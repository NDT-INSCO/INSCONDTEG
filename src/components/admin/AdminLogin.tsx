import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Globe2, KeyRound, LoaderCircle, LockKeyhole, RotateCw, ShieldCheck } from 'lucide-react';
import { isAdminPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../admin/contract';
import type { Language } from '../../types';
import { AdminBrand, AdminLoading, AdminMessage, BackIcon, adminError } from './AdminUi';

export type LoginPhase = 'checking' | 'login' | 'disabled' | 'offline';

function SecurityGraphic() {
  return (
    <div className="ad-security-graphic" dir="ltr" aria-hidden="true">
      <svg viewBox="0 0 360 208" fill="none">
        <defs>
          <pattern id="ad-graph-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#71e4d4" opacity=".22" /></pattern>
          <radialGradient id="ad-graph-glow"><stop stopColor="#277e81" stopOpacity=".45" /><stop offset="1" stopColor="#0a1929" stopOpacity="0" /></radialGradient>
        </defs>
        <rect x="10" y="6" width="340" height="192" fill="url(#ad-graph-dots)" />
        <ellipse cx="180" cy="101" rx="155" ry="95" fill="url(#ad-graph-glow)" />
        <path d="M10 29V9h20m300 0h20v20M10 178v20h20m300 0h20v-20" stroke="#4c7b86" />
        <circle cx="180" cy="103" r="87" stroke="#315f70" strokeDasharray="3 7" />
        <circle cx="180" cy="103" r="70" stroke="#467682" opacity=".76" />
        <circle cx="180" cy="103" r="54" stroke="#67d8ca" strokeOpacity=".32" fill="#0f2938" />
        <path d="M180 7v14m0 164v14m-94-96h-13m200 0h14M94 102H57L38 82H20m247 22h38l19 20h16" stroke="#54bfb4" strokeOpacity=".52" />
        <circle cx="20" cy="82" r="3" fill="#70e6d5" />
        <circle cx="340" cy="124" r="3" fill="#70e6d5" />
        <circle cx="180" cy="33" r="3" fill="#70e6d5" />
        <circle cx="180" cy="173" r="3" fill="#70e6d5" />
        <path d="M180 70c9 7 24 10 24 10v22c0 17-11 27-24 34-13-7-24-17-24-34V80s15-3 24-10Z" fill="#17394a" stroke="#8bf3e0" strokeWidth="1.6" />
        <rect x="170" y="98" width="20" height="15" rx="3" fill="#91f3df" />
        <path d="M175 98v-4a5 5 0 1 1 10 0v4" stroke="#91f3df" strokeWidth="2" />
        <path d="M180 104v3" stroke="#163544" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="ad-graphic-tag"><span className="ad-dot" /> INSCO / ACCESS CONTROL</span>
      <span className="ad-graphic-index">01</span>
    </div>
  );
}

interface LoginProps {
  language: Language;
  phase: LoginPhase;
  notice?: 'expired' | 'logout';
  onBack: () => void;
  onToggleLanguage: () => void;
  onRetry: () => void;
  onLogin: (password: string) => Promise<void>;
}

export function AdminLogin({ language, phase, notice, onBack, onToggleLanguage, onRetry, onLogin }: LoginProps) {
  const ar = language === 'ar';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [badFormat, setBadFormat] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    if (!isAdminPassword(password)) {
      setBadFormat(true);
      inputRef.current?.focus();
      return;
    }
    setBadFormat(false);
    setPending(true);
    setShowPassword(false);
    try {
      await onLogin(password);
    } catch (cause) {
      setError(cause);
      inputRef.current?.focus();
    } finally {
      setPassword('');
      setPending(false);
    }
  }

  return (
    <div className="ad-theme ad-login-view">
      <header className="ad-login-top">
        <AdminBrand language={language} />
        <div className="ad-login-tools">
          <button type="button" className="ad-icon-button" onClick={onToggleLanguage} aria-label={ar ? 'Switch to English' : 'التحويل إلى العربية'} title={ar ? 'English' : 'العربية'}><Globe2 size={17} aria-hidden="true" /><span lang={ar ? 'en' : 'ar'}>{ar ? 'EN' : 'ع'}</span></button>
          <button type="button" className="ad-button ad-button-muted" onClick={onBack}><BackIcon />{ar ? 'العودة للموقع' : 'Back to site'}</button>
        </div>
      </header>
      <main className="ad-login-main">
        <div className="ad-login-shell">
          <div className="ad-login-story">
            <span className="ad-eyebrow"><span className="ad-dot" />{ar ? 'مساحة خاصة بفريق إنسكو' : 'INSCO STAFF WORKSPACE'}</span>
            <p className="ad-login-display">{ar ? <>إدارة الموقع.<br /><span>من مكان واحد.</span></> : <>Site operations.<br /><span>One workspace.</span></>}</p>
            <p className="ad-login-story-copy">{ar ? 'تابع طلبات العملاء، راجع ما يحتاج تدخلًا، وانشر إعلانات الموقع من لوحة واحدة.' : 'Track incoming enquiries, see what needs attention, and publish announcements from one dashboard.'}</p>
            <SecurityGraphic />
          </div>
          <div className="ad-login-entry">
            <span className="ad-entry-icon"><LockKeyhole size={23} aria-hidden="true" /></span>
            <h1 tabIndex={-1} ref={headingRef}>{ar ? 'دخول الإدارة' : 'Admin sign-in'}</h1>
            <p className="ad-subtle">{ar ? 'أدخل كلمة مرور الإدارة للمتابعة.' : 'Enter the admin password to continue.'}</p>
            {phase === 'checking' && <AdminLoading language={language} />}
            {(phase === 'disabled' || phase === 'offline') && (
              <div className="ad-login-feedback">
                <AdminMessage>
                  <strong>{phase === 'disabled' ? (ar ? 'بوابة الإدارة غير مهيّأة' : 'Admin portal not configured') : (ar ? 'تعذّر الاتصال بالبوابة' : 'Portal unreachable')}</strong>
                  <p>{phase === 'disabled' ? (ar ? 'يلزم ربط الموقع بخادم إدارة يعمل لتسجيل الدخول.' : 'Connect this site to an admin server to sign in.') : (ar ? 'تحقق من الاتصال ثم أعد المحاولة.' : 'Check your connection and try again.')}</p>
                </AdminMessage>
                <button type="button" className="ad-button ad-button-muted" onClick={onRetry}><RotateCw size={16} aria-hidden="true" />{ar ? 'إعادة التحقق' : 'Check again'}</button>
              </div>
            )}
            {phase === 'login' && (
              <form className="ad-login-form" onSubmit={submit}>
                <label htmlFor="ad-password">{ar ? 'كلمة المرور' : 'Admin password'}</label>
                <div className="ad-password-field">
                  <KeyRound size={17} aria-hidden="true" className="ad-password-leading" />
                  <input
                    ref={inputRef} id="ad-password" name="password" type={showPassword ? 'text' : 'password'} dir="ltr"
                    autoComplete="current-password" autoCapitalize="none" spellCheck={false} required maxLength={PASSWORD_MAX_LENGTH}
                    value={password} placeholder="••••••••" aria-invalid={badFormat || undefined}
                    onChange={event => { setPassword(event.target.value); setBadFormat(false); setError(null); }} readOnly={pending}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={pending} aria-label={showPassword ? (ar ? 'إخفاء كلمة المرور' : 'Hide password') : (ar ? 'إظهار كلمة المرور' : 'Show password')}>
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {notice && !error && !badFormat && <AdminMessage error={false}>{notice === 'logout' ? (ar ? 'تم تسجيل الخروج.' : 'You have signed out.') : (ar ? 'انتهت الجلسة. سجّل دخولك مرة أخرى.' : 'Your session ended. Sign in again.')}</AdminMessage>}
                {badFormat && <AdminMessage>{ar ? `أدخل كلمة مرور صالحة من ${PASSWORD_MIN_LENGTH} إلى ${PASSWORD_MAX_LENGTH} حرفًا.` : `Enter a valid password between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`}</AdminMessage>}
                {error != null && <AdminMessage>{adminError(error, language)}</AdminMessage>}
                <button type="submit" className="ad-button ad-primary ad-login-cta" disabled={pending}>
                  {pending ? (ar ? 'جارٍ التحقق…' : 'Verifying…') : (ar ? 'تسجيل الدخول' : 'Sign in')}
                  {pending ? <LoaderCircle size={19} className="ad-spin" aria-hidden="true" /> : <ArrowRight size={19} className="ad-directional" aria-hidden="true" />}
                </button>
              </form>
            )}
            <div className="ad-login-secure"><ShieldCheck size={16} aria-hidden="true" />{ar ? 'الدخول مخصّص للإدارة فقط' : 'Restricted to authorised staff'}</div>
          </div>
        </div>
      </main>
      <footer className="ad-login-bottom"><span>© 2026 INSCO</span><span>{ar ? 'بوابة إدارة الموقع' : 'Website administration'}</span></footer>
    </div>
  );
}
