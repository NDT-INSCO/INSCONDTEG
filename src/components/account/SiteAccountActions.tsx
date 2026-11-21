import { lazy, Suspense, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, LogIn, LogOut, ShieldCheck, UserPlus, UserRound, X } from 'lucide-react';
import { useSiteAccount } from '../../account/SiteAccountContext';
import type { Language } from '../../types';
import { AccountPrivacyNotice } from './AccountPrivacyNotice';

const AuthForm = lazy(() => import('../client/ClientAuthOnboardingCard').then(m => ({ default: m.ClientAuthOnboardingCard })));
const Verification = lazy(() => import('./AccountVerificationCard').then(m => ({ default: m.AccountVerificationCard })));
type Panel = 'signin' | 'register' | 'account';

function AccountDialog({ label, closeLabel, onClose, children }: {
  label: string; closeLabel: string; onClose: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    return () => {
      if (typeof dialog.close === 'function') dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={e => { e.preventDefault(); onClose(); }}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-slate-950 p-0 text-slate-100 shadow-2xl backdrop:bg-slate-950/80"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 p-3 sm:px-5">
        <h2 id={titleId} className="flex items-center gap-2 text-sm font-black">
          <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />{label}
        </h2>
        <button type="button" aria-label={closeLabel} onClick={onClose} className="cursor-pointer rounded-lg border border-slate-700 p-2 hover:bg-slate-800">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </dialog>
  );
}

export function SiteAccountActions({ language, onOpenProfile }: { language: Language; onOpenProfile: () => void }) {
  const { user, ready, available, checking, verified, action, notice, onRegistrationReady, signOut } = useSiteAccount();
  const [panel, setPanel] = useState<Panel | null>(null);
  const isAr = language === 'ar';
  const open = (next: Panel) => setPanel(next);
  const close = () => setPanel(null);
  const loading = <p role="status" className="p-3 text-sm text-slate-300">{isAr ? 'جارٍ التحقق من الجلسة…' : 'Checking your session…'}</p>;
  const button = 'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer sm:px-3';
  return (
    <>
      <div className="border-t border-slate-800/80 bg-slate-950/95" data-testid="site-account-actions">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-3 py-1.5 sm:px-6">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            {isAr ? 'حساب إنسكو الموحد' : 'One INSCO account'}
          </span>
          <div className="ms-auto flex items-center gap-1.5">
            {user ? (
              <button type="button" onClick={() => open('account')} className={`${button} border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20`} aria-haspopup="dialog">
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                {isAr ? 'حسابي' : 'My account'}
                {!checking && !verified && <span className="rounded bg-amber-500/15 px-1 text-[10px] text-amber-200">{isAr ? 'بانتظار التفعيل' : 'Verify'}</span>}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => open('signin')} className={`${button} border border-slate-700 text-slate-200 hover:bg-slate-800`} aria-haspopup="dialog">
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />{isAr ? 'تسجيل الدخول' : 'Sign in'}
                </button>
                <button type="button" onClick={() => open('register')} className={`${button} bg-sky-300 text-slate-950 hover:bg-sky-200`} aria-haspopup="dialog">
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />{isAr ? 'إنشاء حساب' : 'Create account'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {panel && (
        <AccountDialog label={isAr ? 'حساب إنسكو الموحد' : 'Your INSCO account'} closeLabel={isAr ? 'إغلاق نافذة الحساب' : 'Close account window'} onClose={close}>
          {!ready || checking ? loading : !user ? (
            <Suspense fallback={loading}>
              <AuthForm
                key={panel}
                scope="site"
                language={language}
                firebaseReady={available}
                authReady={ready}
                initialMode={panel === 'register' ? 'register' : 'signin'}
                onRegistrationReady={onRegistrationReady}
              />
            </Suspense>
          ) : !verified ? (
            <Suspense fallback={loading}><Verification language={language} /></Suspense>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-xs font-bold text-emerald-300">{isAr ? 'مسجّل الدخول في كل الأقسام' : 'Signed in across all sections'}</p>
                <p className="break-all text-sm font-semibold"><bdi>{user.email || user.phoneNumber || user.displayName}</bdi></p>
                <div className="text-xs text-slate-300">
                  <span className="me-1.5">{isAr ? 'معرّف الحساب للدعم:' : 'Account ID for support:'}</span>
                  <bdi className="select-all break-all font-mono">{user.uid}</bdi>
                </div>
              </div>
              <AccountPrivacyNotice language={language} />
              {notice?.status === 'error' && <p role="alert" className="text-xs text-rose-200">{isAr ? 'تعذّر تسجيل الخروج. أعد المحاولة.' : 'Could not sign out. Please retry.'}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`${button} bg-sky-300 text-slate-950 hover:bg-sky-200`} onClick={() => { close(); onOpenProfile(); }}>
                  {isAr ? 'ملفي الخاص' : 'My private profile'}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" className={`${button} border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50`} disabled={Boolean(action)} onClick={() => { void signOut().then(done => { if (done) close(); }); }}>
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />{isAr ? 'تسجيل الخروج' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </AccountDialog>
      )}
    </>
  );
}
