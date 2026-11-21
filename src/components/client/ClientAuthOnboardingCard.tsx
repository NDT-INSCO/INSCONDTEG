import React, { useId, useRef, useState } from 'react';
import type { ConfirmationResult, User } from 'firebase/auth';
import {
  BriefcaseBusiness,
  CheckCircle2,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import type { Language } from '../../types';
import type { ClientAuthMethod, ClientRegistrationDraftInput } from '../../client/types';
import {
  formatFirebaseAuthError,
  normalizePhoneDigits,
  sendClientPasswordReset,
  sendClientPhoneOtp,
  signInClientPortalWithEmail,
  signInClientPortalWithGoogle,
  signUpClientPortalWithEmail,
} from '../../client/firestoreClientService';
import { ClientRegistrationFormFields } from './ClientRegistrationFormFields';
import { AccountPrivacyNotice } from '../account/AccountPrivacyNotice';

interface ClientAuthOnboardingCardProps {
  language: Language;
  firebaseReady: boolean;
  authReady: boolean;
  onOpenCompanyPortal?: () => void;
  scope?: 'client' | 'site';
  initialMode?: 'register' | 'signin';
  onRegistrationReady: (user: User, draft: ClientRegistrationDraftInput | null, sendVerification: boolean) => void;
}

const EMPTY_DRAFT: ClientRegistrationDraftInput = {
  fullName: '',
  personalEmail: '',
  phone: '',
  jobTitle: '',
  nationalId: '',
  secondaryPhone: '',
  personalAddress: '',
  organizationName: '',
  organizationNameEn: '',
  sector: 'Oil & Gas / Power',
  commercialRegNo: '',
  taxCardNo: '',
  companyPhone: '',
  companyEmail: '',
  website: '',
  companyAddress: '',
  cityGovernorate: '',
  activeScope: '',
  requestedCompanyCode: '',
  autoCreateCompanyWorkspace: true,
};

type DraftTextField = Exclude<keyof ClientRegistrationDraftInput, 'autoCreateCompanyWorkspace'>;
const DRAFT_TEXT_FIELDS = (Object.keys(EMPTY_DRAFT) as Array<keyof ClientRegistrationDraftInput>)
  .filter((key): key is DraftTextField => key !== 'autoCreateCompanyWorkspace');

type AuthFailure = { message: string; input?: HTMLInputElement | null; recoverSignIn?: boolean };

function namedInput(fields: HTMLCollection | HTMLFormControlsCollection | undefined, name: string) {
  const control = fields?.namedItem(name);
  return control && 'tagName' in control && control.tagName === 'INPUT' ? control as HTMLInputElement : null;
}

function normalizeSignupWebsite(value: string | undefined): string | null {
  const site = value?.trim() ?? '';
  if (!site) return '';
  try {
    const url = new URL(site.includes('://') ? site : `https://${site}`);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export const ClientAuthOnboardingCard: React.FC<ClientAuthOnboardingCardProps> = ({
  language,
  firebaseReady,
  authReady,
  onOpenCompanyPortal,
  initialMode = 'signin',
  scope = 'client',
  onRegistrationReady,
}) => {
  const isAr = language === 'ar';

  const [mode, setMode] = useState(initialMode);
  const [provider, setProvider] = useState<ClientAuthMethod>('email');
  const isRegister = mode === 'register';
  const site = scope === 'site';
  const collectProfile = isRegister && !site;
  const recaptchaId = useId();
  const emailForm = useRef<HTMLFormElement>(null);
  const registrationFields = useRef<HTMLFieldSetElement>(null);
  const lastEmail = useRef('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [otpConfirmation, setOtpConfirmation] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [draft, setDraft] = useState<ClientRegistrationDraftInput>(EMPTY_DRAFT);
  const [action, setAction] = useState<'auth' | 'reset' | 'sms' | null>(null);
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const canSubmit = firebaseReady && authReady && !action;
  const submitting = action === 'auth';
  const sendingOtp = action === 'sms';
  const targetPhone = collectProfile ? draft.phone : authPhone;

  const reportError = (message: string, input?: HTMLInputElement | null) => setFailure({ message, input });
  const clearMessages = () => {
    setFailure(null);
    setInfoMsg(null);
  };

  const clearOtp = () => {
    setOtpConfirmation(null);
    setOtpCode('');
  };

  const emailInput = (name: string) => namedInput(emailForm.current?.elements, name);
  const emailField = () => emailInput('username');
  const profileInput = (field: keyof ClientRegistrationDraftInput) => namedInput(registrationFields.current?.elements, field);

  const switchAuthView = () => {
    const field = emailField();
    if (field) lastEmail.current = field.value;
    clearMessages();
    clearOtp();
  };

  const updateDraft = (next: ClientRegistrationDraftInput) => {
    if (next.phone !== draft.phone) clearOtp();
    setDraft(next);
  };

  const captureDraft = (): ClientRegistrationDraftInput => {
    const next = { ...draft };
    // Autofill can update the fields without triggering React change events.
    // Whitelist profile fields here so no password or OTP enters the draft.
    for (const field of DRAFT_TEXT_FIELDS) {
      const input = profileInput(field);
      if (input) next[field] = input.value;
    }
    next.autoCreateCompanyWorkspace = profileInput('autoCreateCompanyWorkspace')?.checked ?? next.autoCreateCompanyWorkspace;
    setDraft(next);
    return next;
  };

  const validateDraft = (input: ClientRegistrationDraftInput): ClientRegistrationDraftInput | null => {
    const phone = normalizePhoneDigits(input.phone).trim();
    const issue = (field: keyof ClientRegistrationDraftInput, ar: string, en: string) => {
      reportError(isAr ? ar : en, profileInput(field));
      return null;
    };
    if (input.fullName.trim().length < 2) {
      return issue('fullName', 'اكتب الاسم الكامل للمفوّض.', 'Enter the representative’s full name.');
    }
    if (phone.replace(/\D/g, '').length < 5) {
      return issue('phone', 'اكتب رقم الهاتف الأساسي بالأرقام.', 'Enter a valid primary phone number.');
    }
    if (input.organizationName.trim().length < 2) {
      return issue('organizationName', 'اكتب اسم الشركة الرسمي.', 'Enter the official company name.');
    }
    if (profileInput('personalEmail')?.validity.typeMismatch) {
      return issue('personalEmail', 'صحّح البريد الشخصي أو اترك الحقل الاختياري فارغاً.', 'Correct the personal email or leave the optional field blank.');
    }
    if (profileInput('companyEmail')?.validity.typeMismatch) {
      return issue('companyEmail', 'صحّح بريد الشركة أو اترك الحقل الاختياري فارغاً.', 'Correct the company email or leave the optional field blank.');
    }
    const website = normalizeSignupWebsite(input.website);
    if (website === null) {
      return issue('website', 'اكتب موقع الشركة بشكل صحيح (مثال: www.company.com) أو اتركه فارغاً.', 'Enter a valid company website (e.g. www.company.com) or leave it blank.');
    }
    return { ...input, phone, website };
  };

  const handOffDraft = (signedUser: User, details: ClientRegistrationDraftInput, accountEmail?: string) => {
    onRegistrationReady(signedUser, {
      ...details,
      fullName: details.fullName.trim(),
      personalEmail: (accountEmail ?? (details.personalEmail?.trim() || signedUser.email || '')).trim(),
      phone: (signedUser.phoneNumber || details.phone).trim(),
    }, accountEmail !== undefined);
  };

  const handleGoogleAction = async () => {
    if (!canSubmit) return;
    clearMessages();
    const details = collectProfile ? validateDraft(captureDraft()) : null;
    if (collectProfile && !details) return;
    setAction('auth');
    try {
      const signedUser = await signInClientPortalWithGoogle(rememberMe);
      if (details) handOffDraft(signedUser, details);
    } catch (err) {
      reportError(formatFirebaseAuthError(err, language));
    } finally {
      setAction(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    clearMessages();

    // Read the native form at submission time: some password managers fill
    // the inputs without dispatching React change events. Never trim passwords.
    const liveDraft = collectProfile ? captureDraft() : null;
    const fields = new FormData(e.currentTarget);
    const email = String(fields.get('username') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    if (!email || !emailField()?.validity.valid) {
      reportError(isAr ? 'اكتب بريد الحساب بشكل صحيح.' : 'Enter a valid account email address.', emailField());
      return;
    }
    if (!password) {
      reportError(isAr ? 'اكتب كلمة المرور.' : 'Enter your password.', emailInput('password'));
      return;
    }
    if (isRegister && password.length < 6) {
      reportError(isAr ? 'استخدم كلمة مرور من 6 أحرف على الأقل.' : 'Use a password of at least 6 characters.', emailInput('password'));
      return;
    }
    if (isRegister && password !== fields.get('confirm-password')) {
      reportError(isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.', emailInput('confirm-password'));
      return;
    }
    const details = liveDraft ? validateDraft(liveDraft) : null;
    if (collectProfile && !details) return;

    setAction('auth');
    try {
      if (isRegister) {
        const createdUser = await signUpClientPortalWithEmail(email, password, rememberMe);
        if (details) handOffDraft(createdUser, details, createdUser.email || email);
        else onRegistrationReady(createdUser, null, true);
      } else {
        await signInClientPortalWithEmail(email, password, rememberMe);
      }
    } catch (err) {
      const message = formatFirebaseAuthError(err, language);
      setFailure({
        message: isRegister ? `${isAr ? 'تعذّر إنشاء الحساب.' : 'Could not create the account.'} ${message}` : message,
        recoverSignIn: isRegister && (err as { code?: string } | null)?.code === 'auth/email-already-in-use',
      });
    } finally {
      setAction(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!canSubmit) return;
    clearMessages();
    const field = emailField();
    if (!field?.value.trim() || !field.validity.valid) {
      reportError(
        isAr
          ? 'اكتب بريد الحساب بشكل صحيح أولاً، ثم اضغط «نسيت كلمة المرور؟».'
          : 'Enter a valid account email first, then select “Forgot password?”.'
      );
      field?.focus();
      return;
    }
    setAction('reset');
    try {
      await sendClientPasswordReset(field.value);
      setInfoMsg(
        isAr
          ? 'إذا كان البريد مرتبطاً بحساب، سيصلك رابط لإعادة تعيين كلمة المرور. راجع الوارد والبريد غير المرغوب فيه.'
          : 'If this email belongs to an account, you will receive a reset link. Check your inbox and spam folder.'
      );
    } catch (err) {
      reportError(formatFirebaseAuthError(err, language));
    } finally {
      setAction(null);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!canSubmit) return;
    clearMessages();

    const details = collectProfile ? validateDraft(captureDraft()) : null;
    if (collectProfile && !details) return;

    setAction('sms');
    try {
      const confirmation = await sendClientPhoneOtp(details?.phone ?? targetPhone, recaptchaId, rememberMe);
      setOtpConfirmation(confirmation);
      setOtpCode('');
      setInfoMsg(
        isAr
          ? 'تم إرسال رمز التحقق SMS إلى رقم هاتفك. أدخل الكود المكون من 6 أرقام أدناه.'
          : 'SMS verification code sent. Enter the 6-digit OTP code below.'
      );
    } catch (err) {
      reportError(formatFirebaseAuthError(err, language));
    } finally {
      setAction(null);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !otpConfirmation) return;
    clearMessages();
    const code = normalizePhoneDigits(otpCode).trim();
    if (!/^\d{6}$/.test(code)) {
      reportError(isAr ? 'أدخل رمز التحقق من 6 أرقام.' : 'Enter the 6-digit SMS verification code.');
      return;
    }
    const details = collectProfile ? validateDraft(captureDraft()) : null;
    if (collectProfile && !details) return;
    setAction('auth');
    try {
      const cred = await otpConfirmation.confirm(code);
      if (details) handOffDraft(cred.user, details);
    } catch (err) {
      reportError(formatFirebaseAuthError(err, language));
    } finally {
      setAction(null);
    }
  };

  const feedback = (
    <>
      {!firebaseReady && (
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {isAr ? 'خدمة تسجيل دخول العملاء غير متاحة حالياً. حاول لاحقاً أو تواصل مع الدعم.' : 'Client sign-in is unavailable. Try again later or contact support.'}
        </p>
      )}
      {failure && (
        <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 space-y-2">
          <p>{failure.message}</p>
          {failure.input && (
            <button type="button" className="text-cyan-200 font-bold underline" onClick={() => {
              failure.input?.focus({ preventScroll: true });
              failure.input?.scrollIntoView?.({ block: 'center' });
            }}>
              {isAr ? 'راجع الحقل' : 'Review field'}
            </button>
          )}
          {failure.recoverSignIn && (
            <button type="button" className="text-cyan-200 font-bold underline" onClick={() => {
              switchAuthView();
              setMode('signin');
              emailForm.current?.scrollIntoView?.({ block: 'center' });
            }}>
              {isAr ? 'ادخل بالبريد نفسه' : 'Sign in with this email'}
            </button>
          )}
        </div>
      )}
      {infoMsg && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{infoMsg}</span>
        </div>
      )}
    </>
  );

  const rememberOption = (
    <label className="flex items-start gap-2.5 text-xs text-slate-300">
      <input
        type="checkbox"
        name="remember-session"
        checked={rememberMe}
        disabled={Boolean(action) || (provider === 'phone' && Boolean(otpConfirmation))}
        onChange={e => setRememberMe(e.target.checked)}
        className="mt-0.5 accent-cyan-500"
      />
      <span>
        <strong className="block text-slate-100">{isAr ? 'ابقني مسجّلاً على هذا الجهاز' : 'Keep me signed in on this device'}</strong>
        {isAr ? 'استخدمه على جهازك الخاص فقط. هذا الخيار لا يحفظ كلمة المرور.' : 'Use only on a private device. This does not save your password.'}
      </span>
    </label>
  );

  return (
    <div
      data-testid="client-auth-onboarding-card"
      className={site ? "space-y-4" : "max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-8 space-y-6"}
    >
      {/* Header & Mode Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <BriefcaseBusiness className="w-4 h-4" aria-hidden="true" />
            <span>{site ? (isAr ? 'حساب واحد لكل الأقسام' : 'One account for every section') : (isAr ? 'بوابة عملاء ومجتمع أعمال إنسكو' : 'INSCO Client & Business Community Portal')}</span>
          </div>
          {site ? (
            <h3 className="text-xl font-black text-white">{isRegister ? (isAr ? 'إنشاء حساب إنسكو' : 'Create your INSCO account') : (isAr ? 'تسجيل الدخول إلى إنسكو' : 'Sign in to INSCO')}</h3>
          ) : (
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'register'
              ? isAr
                ? 'إنشاء حساب عميل جديد بالبيانات الشخصية وبيانات الشركة'
                : 'Create Client Account with Full Personal & Company Details'
              : isAr
                ? 'تسجيل الدخول إلى بوابة العملاء والملفات'
                : 'Sign In to Client & Company Dossier Portal'}
          </h1>
          )}
          <p className="text-xs sm:text-sm text-slate-300">
            {site ? (isAr ? 'نفس الحساب للشركة والعملاء والأكاديمية والمجتمع. تقدر تضيف بيانات ملفك بعد التفعيل.' : 'Use the same account for Company, Clients, Academy, and Community. Add profile details after verification.') : isAr
              ? 'اختر وسيلة التوثيق المناسبة (البريد الإلكتروني، رقم التليفون SMS، أو حساب Google) وسجّل جميع بياناتك الشخصية وبيانات شركتك مباشرة.'
              : 'Authenticate via Email, Phone SMS OTP, or Google Account while recording full personal & corporate profile information.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={isAr ? 'وضع الدخول والتسجيل' : 'Authentication Mode'}
          className="grid w-full grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs sm:w-auto lg:shrink-0 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            disabled={Boolean(action)}
            onClick={() => {
              if (mode === 'register') return;
              switchAuthView();
              setMode('register');
            }}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center font-bold transition cursor-pointer sm:whitespace-nowrap sm:px-3.5 ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            disabled={Boolean(action)}
            onClick={() => {
              if (mode === 'signin') return;
              switchAuthView();
              setMode('signin');
            }}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center font-bold transition cursor-pointer sm:whitespace-nowrap sm:px-3.5 ${
              mode === 'signin'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>
        </div>
      </div>

      {/* 3 Provider Selector Tabs */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400">
          {isAr ? 'اختر طريقة التسجيل / الدخول:' : 'Choose Sign-In / Registration Method:'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {(
            [
              {
                id: 'email',
                ar: 'البريد الإلكتروني وكلمة المرور',
                en: 'Email & Password',
                Icon: Mail,
              },
              {
                id: 'phone',
                ar: 'رقم التليفون (رمز تحقق SMS)',
                en: 'Phone Number (SMS OTP)',
                Icon: Phone,
              },
              {
                id: 'google',
                ar: 'حساب Google السريع',
                en: 'Google Account',
                Icon: ShieldCheck,
              },
            ] as const
          ).map(item => {
            const active = provider === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`auth-method-tab-${item.id}`}
                aria-pressed={active}
                disabled={Boolean(action)}
                onClick={() => {
                  if (provider === item.id) return;
                  switchAuthView();
                  setProvider(item.id);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 font-bold transition cursor-pointer ${
                  active
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? item.ar : item.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {collectProfile && provider !== 'email' && (
        <fieldset ref={registrationFields} disabled={Boolean(action)}>
          <ClientRegistrationFormFields
            language={language}
            value={draft}
            onChange={updateDraft}
            showAutoCreateCompanyToggle
          />
        </fieldset>
      )}

      {/* Provider Action Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-4">
        {provider === 'email' && (
          <form
            key={mode}
            ref={emailForm}
            method="post"
            noValidate
            aria-busy={submitting}
            onSubmit={e => void handleEmailSubmit(e)}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Mail className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>
                {mode === 'register'
                  ? isAr
                    ? 'بيانات الدخول بالبريد الإلكتروني وكلمة المرور'
                    : 'Email & Password Account Credentials'
                  : isAr
                    ? 'تسجيل الدخول بالبريد الإلكتروني'
                    : 'Sign In with Email & Password'}
              </span>
            </div>

            <div className={site ? "grid min-w-0 grid-cols-1 gap-3 text-xs" : "grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"}>
              <label className="space-y-1">
                <span className="text-slate-300 block font-semibold">
                  {isAr ? 'البريد الإلكتروني للحساب *' : 'Account Email *'}
                </span>
                <input
                  type="email"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  dir="ltr"
                  required
                  defaultValue={lastEmail.current || (isRegister ? draft.personalEmail : '')}
                  placeholder="client@company.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-300 block font-semibold">
                  {isAr ? 'كلمة المرور *' : 'Password *'}
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  dir="ltr"
                  required
                  minLength={isRegister ? 6 : undefined}
                  placeholder="••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              {mode === 'register' && (
                <label className="space-y-1">
                  <span className="text-slate-300 block font-semibold">
                    {isAr ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
                  </span>
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    dir="ltr"
                    required
                    minLength={6}
                    placeholder="••••••"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </label>
              )}
            </div>

            {collectProfile && (
              <fieldset ref={registrationFields} disabled={Boolean(action)}>
                <ClientRegistrationFormFields
                  language={language}
                  value={draft}
                  onChange={updateDraft}
                  showPersonalEmail={false}
                  showAutoCreateCompanyToggle
                />
              </fieldset>
            )}
            {collectProfile && (
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'الحقول بعلامة * مطلوبة فقط. باقي البيانات تقدر تضيفها بعد تفعيل حسابك.'
                  : 'Only fields marked * are required. You can add other details after verifying your account.'}
              </p>
            )}
            {isRegister && <AccountPrivacyNotice language={language} />}
            {rememberOption}
            {feedback}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span>
                  {submitting
                    ? isAr
                      ? isRegister ? 'جاري إنشاء الحساب…' : 'جاري تسجيل الدخول…'
                      : isRegister ? 'Creating the account…' : 'Signing in…'
                    : mode === 'register'
                      ? isAr
                        ? 'إنشاء الحساب وإرسال رابط التفعيل'
                        : 'Create Account & Send Verification Link'
                      : isAr
                        ? 'دخول بالبريد الإلكتروني'
                        : 'Sign In with Email'}
                </span>
              </button>

              {mode === 'signin' && (
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => void handlePasswordReset()}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 cursor-pointer"
                >
                  {action === 'reset'
                    ? isAr ? 'جاري طلب الرابط…' : 'Requesting link…'
                    : isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              )}
            </div>
          </form>
        )}

        {provider !== 'email' && isRegister && <AccountPrivacyNotice language={language} />}
        {provider !== 'email' && rememberOption}

        {provider === 'phone' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Phone className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>
                {isAr
                  ? 'التسجيل والدخول عبر رقم التليفون برسالة تأكيد SMS'
                  : 'Phone Number Registration & Sign-In via SMS OTP'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs items-end">
              <label className="space-y-1">
                <span className="text-slate-300 block font-semibold">
                  {isAr ? 'رقم الموبايل بالصيغة الدولية (+20...) *' : 'International Mobile Number *'}
                </span>
                <input
                  type="tel"
                  autoComplete="tel"
                  disabled={Boolean(action)}
                  value={targetPhone}
                  onChange={e => {
                    clearOtp();
                    if (collectProfile) setDraft({ ...draft, phone: e.target.value });
                    else setAuthPhone(e.target.value);
                  }}
                  placeholder="+201000000000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <div>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => void handleSendPhoneOtp()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-black text-white transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {sendingOtp
                      ? isAr
                        ? 'جاري الإرسال...'
                        : 'Sending SMS...'
                      : otpConfirmation
                        ? isAr
                          ? 'إعادة إرسال رمز التحقق'
                          : 'Resend SMS Code'
                        : isAr
                          ? 'إرسال رمز التحقق SMS'
                          : 'Send SMS Verification Code'}
                  </span>
                </button>
              </div>
            </div>

            <div id={recaptchaId} />
            {feedback}

            {otpConfirmation && (
              <form
                onSubmit={e => void handleVerifyPhoneOtp(e)}
                className="flex flex-wrap items-end gap-3 border-t border-slate-800 pt-3 text-xs"
              >
                <label className="space-y-1 flex-1 min-w-[200px]">
                  <span className="text-slate-300 block font-semibold">
                    {isAr ? 'أدخل رمز التحقق (6 أرقام)' : 'Enter 6-digit SMS Code'}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-lg border border-cyan-500/50 bg-slate-900 px-3 py-2 font-mono text-sm tracking-widest text-white focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {submitting
                      ? isAr
                        ? 'جاري التحقق...'
                        : 'Verifying...'
                      : collectProfile
                        ? isAr
                          ? 'تأكيد الرمز وحفظ البيانات'
                          : 'Verify OTP & Save Profile'
                        : isAr
                          ? 'تأكيد والدخول'
                          : 'Verify & Sign In'}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}

        {provider === 'google' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="basis-full empty:hidden">{feedback}</div>
            <div className="text-xs text-slate-300">
              {site
                ? (isAr ? 'استخدم نفس طريقة الدخول كل مرة علشان تفتح حسابك الحالي.' : 'Use your original sign-in method to return to the same account.')
                : mode === 'register'
                ? isAr
                  ? 'بعد استكمال بياناتك الشخصية وبيانات الشركة أعلاه، اضغط لتوثيق الحساب عبر Google وحفظ الملف فوراً.'
                  : 'After completing your Personal & Company details above, click to authenticate with Google and save your profile immediately.'
                : isAr
                  ? 'سجّل الدخول مباشرة بحساب Google المرتبط بملف شركتك.'
                  : 'Sign in directly with the Google account linked to your company dossier.'}
            </div>

            <button
              type="button"
              data-testid="client-portal-google-signin"
              disabled={!canSubmit}
              onClick={() => void handleGoogleAction()}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>
                {submitting
                  ? isAr
                    ? 'جاري التوثيق...'
                    : 'Authenticating...'
                  : collectProfile
                    ? isAr
                      ? 'توثيق بحساب Google وحفظ جميع البيانات'
                      : 'Register with Google & Save All Details'
                    : isAr
                      ? 'تسجيل الدخول بحساب Google'
                      : 'Sign In with Google'}
              </span>
            </button>
          </div>
        )}
      </div>

      {onOpenCompanyPortal && (
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenCompanyPortal}
          className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
        >
          {isAr ? 'العودة لبوابة الشركة' : 'Back to Corporate Portal'}
        </button>
      </div>
      )}
    </div>
  );
};
