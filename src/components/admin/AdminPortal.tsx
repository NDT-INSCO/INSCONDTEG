import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Globe2, Inbox, LayoutDashboard, LogOut, Megaphone, RotateCw, ShieldCheck } from 'lucide-react';
import { adminClient, AdminApiError } from '../../admin/client';
import type { DashboardData, QuoteStatus } from '../../admin/contract';
import type { Language } from '../../types';
import { AdminAnnouncement } from './AdminAnnouncement';
import { AdminLogin, type LoginPhase } from './AdminLogin';
import { AdminOverview } from './AdminOverview';
import { AdminQuotes } from './AdminQuotes';
import { AdminBrand, AdminMessage, BackIcon, adminError, shortDate } from './AdminUi';

type GateState = { kind: LoginPhase; notice?: 'expired' | 'logout' } | { kind: 'ready'; initial: DashboardData };
interface PortalProps { language: Language; onBack: () => void; onToggleLanguage: () => void }

export default function AdminPortal(props: PortalProps) {
  const [gate, setGate] = useState<GateState>({ kind: 'checking' });
  const [check, setCheck] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void adminClient.dashboard(controller.signal).then(initial => {
      if (!controller.signal.aborted) setGate({ kind: 'ready', initial });
    }).catch(error => {
      if (controller.signal.aborted) return;
      const code = error instanceof AdminApiError ? error.code : '';
      setGate({ kind: code === 'signed_out' ? 'login' : code === 'not_configured' ? 'disabled' : 'offline' });
    });
    return () => controller.abort();
  }, [check]);

  const onSessionError = useCallback((error: unknown) => {
    if (!(error instanceof AdminApiError)) return false;
    if (error.code === 'signed_out') {
      setGate({ kind: 'login', notice: 'expired' });
      return true;
    }
    if (error.code === 'not_configured') {
      setGate({ kind: 'disabled' });
      return true;
    }
    return false;
  }, []);

  async function login(password: string) {
    try {
      await adminClient.login(password);
      const initial = await adminClient.dashboard();
      setGate({ kind: 'ready', initial });
    } catch (error) {
      if (error instanceof AdminApiError && error.code === 'signed_out') throw new AdminApiError('cookies_blocked');
      if (!onSessionError(error)) throw error;
    }
  }

  async function logout() {
    await adminClient.logout();
    setGate({ kind: 'login', notice: 'logout' });
  }

  return gate.kind === 'ready'
    ? <AdminWorkspace {...props} initial={gate.initial} onSessionError={onSessionError} onLogout={logout} />
    : <AdminLogin {...props} phase={gate.kind} notice={gate.notice} onLogin={login} onRetry={() => { setGate({ kind: 'checking' }); setCheck(value => value + 1); }} />;
}

const VIEWS = [
  { id: 'overview', icon: LayoutDashboard, ar: 'نظرة عامة', en: 'Overview' },
  { id: 'quotes', icon: Inbox, ar: 'صندوق الطلبات', en: 'Quote requests' },
  { id: 'announcement', icon: Megaphone, ar: 'إعلانات الموقع', en: 'Announcements' },
] as const;
type ViewId = (typeof VIEWS)[number]['id'];

function AdminWorkspace({ language, initial, onBack, onToggleLanguage, onSessionError, onLogout }: PortalProps & {
  initial: DashboardData;
  onSessionError: (error: unknown) => boolean;
  onLogout: () => Promise<void>;
}) {
  const ar = language === 'ar';
  const [data, setData] = useState(initial);
  const [active, setActive] = useState<ViewId>('overview');
  const [initialStatus, setInitialStatus] = useState<QuoteStatus | ''>('');
  const [reference, setReference] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => onSessionError(new AdminApiError('signed_out')), Math.max(0, data.sessionExpiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [data.sessionExpiresAt, onSessionError]);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [active, reference]);

  async function refresh() {
    if (refreshing || signingOut) return;
    setRefreshing(true);
    setError(null);
    try {
      setData(await adminClient.dashboard());
    } catch (cause) {
      if (!onSessionError(cause)) setError(cause);
    } finally {
      setRefreshing(false);
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      await onLogout();
    } catch (cause) {
      if (!onSessionError(cause)) setError(cause);
    } finally {
      setSigningOut(false);
    }
  }

  function navigate(view: ViewId, status: QuoteStatus | '' = '', quote: string | null = null) {
    setActive(view);
    setInitialStatus(status);
    setReference(quote);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function selectQuote(quote: string | null) {
    setReference(quote);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return (
    <div className="ad-theme ad-workspace">
      <aside className="ad-sidebar">
        <AdminBrand language={language} />
        <p className="ad-sidebar-label">{ar ? 'مساحة العمل' : 'WORKSPACE'}</p>
        <nav className="ad-sidebar-nav" aria-label={ar ? 'أقسام الإدارة' : 'Admin sections'}>
          {VIEWS.map(({ icon: Icon, id, ...label }) => (
            <button key={id} type="button" className="ad-nav-button" aria-current={active === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon size={19} aria-hidden="true" /><span>{label[language]}</span></button>
          ))}
        </nav>
        <div className="ad-sidebar-bottom">
          <div className="ad-private"><ShieldCheck size={17} aria-hidden="true" />{ar ? 'جلسة إدارة محمية' : 'Private admin session'}</div>
          <button type="button" className="ad-nav-button" onClick={onBack}><BackIcon /><span>{ar ? 'العودة للموقع' : 'Back to site'}</span></button>
          <button type="button" className="ad-nav-button ad-logout" disabled={signingOut} onClick={() => void signOut()}><LogOut size={17} aria-hidden="true" className="ad-directional" /><span>{signingOut ? (ar ? 'جارٍ الخروج…' : 'Signing out…') : (ar ? 'تسجيل الخروج' : 'Sign out')}</span></button>
        </div>
      </aside>
      <main className="ad-workspace-content">
        <header className="ad-topbar">
          <div>
            <span className="ad-topbar-label">{ar ? 'بوابة إدارة إنسكو' : 'INSCO ADMIN'}</span>
            <h1 ref={heading} tabIndex={-1}>{reference ? (ar ? 'بيانات الطلب' : 'Request details') : VIEWS.find(view => view.id === active)![language]}</h1>
          </div>
          <div className="ad-topbar-actions">
            {active === 'overview' && <>
              <small>{ar ? 'آخر تحديث:' : 'Updated:'} <time dateTime={data.updatedAt}>{shortDate(data.updatedAt, language, { timeStyle: 'short' })}</time></small>
              <button type="button" className="ad-icon-button" disabled={refreshing} onClick={() => void refresh()} aria-label={ar ? 'تحديث الملخص' : 'Refresh overview'} title={ar ? 'تحديث الملخص' : 'Refresh overview'}><RotateCw size={17} aria-hidden="true" className={refreshing ? 'ad-spin' : ''} /></button>
            </>}
            <button type="button" className="ad-icon-button" onClick={onToggleLanguage} aria-label={ar ? 'Switch to English' : 'التحويل إلى العربية'} title={ar ? 'English' : 'العربية'}><Globe2 size={17} aria-hidden="true" /><span lang={ar ? 'en' : 'ar'}>{ar ? 'EN' : 'ع'}</span></button>
          </div>
        </header>
        <div className="ad-workspace-body" aria-busy={refreshing}>
          {error != null && <AdminMessage>{adminError(error, language)}</AdminMessage>}
          {active === 'overview' && <AdminOverview language={language} data={data} onInbox={status => navigate('quotes', status)} onQuote={quote => navigate('quotes', '', quote)} onAnnouncement={() => navigate('announcement')} />}
          {active === 'quotes' && <AdminQuotes language={language} initialStatus={initialStatus} reference={reference} onOpen={selectQuote} onSessionError={onSessionError} onUpdate={() => void refresh()} />}
          {active === 'announcement' && <AdminAnnouncement language={language} initial={data.announcement} onSessionError={onSessionError} onSaved={announcement => setData(current => ({ ...current, announcement }))} />}
        </div>
        <footer className="ad-workspace-footer"><span>© 2026 INSCO</span><span>{ar ? 'مركز عمليات الموقع' : 'Site operations workspace'}</span></footer>
      </main>
    </div>
  );
}
