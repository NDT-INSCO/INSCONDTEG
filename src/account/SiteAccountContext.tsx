import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { ClientRegistrationDraftInput } from '../client/types';

type AccountService = typeof import('../client/firestoreClientService');
const loadService = () => import('../client/firestoreClientService');

type VerificationDelivery = { status: 'sending' | 'sent' } | { status: 'failed'; error: unknown };
type AccountNotice = { status: 'unverified' | 'resent' } | { status: 'error'; error: unknown };
type AccountAction = 'refresh' | 'resend' | 'signout';

interface Session {
  user: User | null;
  ready: boolean;
  available: boolean;
  checking: boolean;
  verified: boolean;
  action: AccountAction | null;
  notice: AccountNotice | null;
  delivery?: VerificationDelivery;
  draft?: ClientRegistrationDraftInput | null;
}

const SIGNED_OUT: Session = {
  user: null, ready: false, available: false, checking: false, verified: false, action: null, notice: null,
};

interface SiteAccount extends Session {
  refreshVerification: () => Promise<void>;
  resendVerification: () => Promise<void>;
  signOut: () => Promise<boolean>;
  onRegistrationReady: (user: User, draft: ClientRegistrationDraftInput | null, sendVerification: boolean) => void;
  onDraftSaved: (uid: string) => void;
}

const Context = createContext<SiteAccount | null>(null);

/** One real Firebase session, shared by all public portals. Not the #admin login. */
export function SiteAccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(SIGNED_OUT);
  const current = useRef(SIGNED_OUT);
  const service = useRef<AccountService | null>(null);
  const generation = useRef(0);
  const registrationDelivery = useRef<{ uid: string; result: VerificationDelivery } | null>(null);
  const update = useCallback((patch: Partial<Session>) => {
    current.current = { ...current.current, ...patch };
    setSession(current.current);
  }, []);

  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    void loadService().then(api => {
      if (!active) return;
      service.current = api;
      stop = api.observeClientPortalAuth(user => {
        if (!active) return;
        const previous = current.current.user;
        if (previous?.uid && previous.uid !== user?.uid) api.clearPendingRegistrationDraft(previous.uid);
        if (registrationDelivery.current?.uid !== user?.uid) registrationDelivery.current = null;
        const run = ++generation.current;
        update({
          ...SIGNED_OUT, ready: true, available: api.isPortalFirestoreReady(), user, checking: Boolean(user),
          draft: user ? api.loadPendingRegistrationDraft(user.uid) : null,
          delivery: registrationDelivery.current?.result,
        });
        if (!user) return;
        void api.confirmClientPortalVerification(user).then(
          verified => { if (run === generation.current) update({ checking: false, verified }); },
          error => { if (run === generation.current) update({ checking: false, notice: { status: 'error', error } }); },
        );
      });
    }).catch(() => { if (active) update({ ready: true, available: false }); });
    return () => {
      active = false;
      generation.current++;
      stop?.();
    };
  }, [update]);

  const onRegistrationReady = useCallback((user: User, draft: ClientRegistrationDraftInput | null, send: boolean) => {
    const api = service.current;
    if (!api || !api.isCurrentClientUser(user.uid)) return;
    // The Firebase observer may replace the form before createUser resolves.
    // Keep the handoff here, not in a portal or in persistent browser storage.
    if (draft) api.savePendingRegistrationDraft(user.uid, draft);
    const applies = () => current.current.user?.uid === user.uid;
    if (draft && applies()) update({ draft: api.loadPendingRegistrationDraft(user.uid) });
    const deliver = (result: VerificationDelivery) => {
      if (!api.isCurrentClientUser(user.uid)) return;
      registrationDelivery.current = { uid: user.uid, result };
      if (applies()) update({ delivery: result });
    };
    if (send) {
      deliver({ status: 'sending' });
      void api.resendClientVerificationEmail(user).then(
        () => deliver({ status: 'sent' }), error => deliver({ status: 'failed', error }),
      );
    }
  }, [update]);

  const onDraftSaved = useCallback((uid: string) => {
    service.current?.clearPendingRegistrationDraft(uid);
    if (current.current.user?.uid === uid) update({ draft: null });
  }, [update]);

  const act = useCallback(async (action: AccountAction) => {
    const { user, checking, action: pending, delivery } = current.current;
    const api = service.current;
    if (!api || !user || pending || (checking && action !== 'signout')) return false;
    if (action === 'resend' && (!user.email || delivery?.status === 'sending')) return false;
    const run = generation.current;
    update({ action, notice: null });
    try {
      if (action === 'refresh') {
        const verified = await api.confirmClientPortalVerification(user, true);
        if (run === generation.current) update({ verified, notice: verified ? null : { status: 'unverified' } });
      } else if (action === 'resend') {
        await api.resendClientVerificationEmail(user);
        if (run === generation.current) update({ notice: { status: 'resent' } });
      } else {
        await api.signOutClientPortal();
        api.clearPendingRegistrationDraft(user.uid);
      }
      return true;
    } catch (error) {
      if (run === generation.current) update({ notice: { status: 'error', error } });
      return false;
    } finally {
      if (run === generation.current) update({ action: null });
    }
  }, [update]);

  return (
    <Context.Provider value={{
      ...session, onRegistrationReady, onDraftSaved,
      refreshVerification: async () => { await act('refresh'); },
      resendVerification: async () => { await act('resend'); },
      signOut: () => act('signout'),
    }}>
      {children}
    </Context.Provider>
  );
}

export function useSiteAccount() {
  const value = useContext(Context);
  if (!value) throw new Error('SiteAccountProvider is required');
  return value;
}

/**
 * The same session, for components that must also render outside the provider
 * (a bare portal render in a test, or an embedded card). Returns null instead of
 * throwing, so a screen without an account simply hides its account controls.
 */
export function useOptionalSiteAccount(): SiteAccount | null {
  return useContext(Context);
}
