import React, { useState } from 'react';
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
  createInitialCompanyFromRegistration,
  formatFirebaseAuthError,
  saveClientRegistration,
  savePendingRegistrationDraft,
  sendClientPasswordReset,
  sendClientPhoneOtp,
  signInClientPortalWithEmail,
  signInClientPortalWithGoogle,
  signUpClientPortalWithEmail,
} from '../../client/firestoreClientService';
import { ClientRegistrationFormFields } from './ClientRegistrationFormFields';

interface ClientAuthOnboardingCardProps {
  language: Language;
  firebaseReady: boolean;
  authReady: boolean;
  onOpenCompanyPortal: () => void;
  onRegistrationCompleted?: (user: User) => void;
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

export const ClientAuthOnboardingCard: React.FC<ClientAuthOnboardingCardProps> = ({
  language,
  firebaseReady,
  authReady,
  onOpenCompanyPortal,
  onRegistrationCompleted,
}) => {
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'register' | 'signin'>('register');
  const [provider, setProvider] = useState<ClientAuthMethod>('google');

  // Credentials state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');

  // Phone OTP state
  const [authPhone, setAuthPhone] = useState('');
  const [otpConfirmation, setOtpConfirmation] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  // Full Personal + Company Draft State
  const [draft, setDraft] = useState<ClientRegistrationDraftInput>(EMPTY_DRAFT);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const syncEmailIntoDraft = (nextEmail: string) => {
    setAuthEmail(nextEmail);
    setDraft(prev => ({
      ...prev,
      personalEmail: prev.personalEmail || nextEmail,
    }));
  };

  const syncPhoneIntoDraft = (nextPhone: string) => {
    setAuthPhone(nextPhone);
    setDraft(prev => ({
      ...prev,
      phone: nextPhone,
    }));
  };

  const validateFullRegistrationDraft = (): string | null => {
    const effectivePhone = (provider === 'phone' ? authPhone || draft.phone : draft.phone).trim();
    if (draft.fullName.trim().length < 2) {
      return isAr ? 'يرجى إدخال الاسم الكامل للمفوّض.' : 'Please enter the representative Full Name.';
    }
    if (effectivePhone.length < 5) {
      return isAr ? 'يرجى إدخال رقم الهاتف الأساسي بشكل صحيح.' : 'Please enter a valid primary Phone number.';
    }
    if (draft.organizationName.trim().length < 2) {
      return isAr ? 'يرجى إدخال اسم الشركة الرسمي.' : 'Please enter the official Company / Organization Name.';
    }
    return null;
  };

  const finalizeVerifiedUserProfile = async (signedUser: User) => {
    const mergedDraft: ClientRegistrationDraftInput = {
      ...draft,
      fullName: draft.fullName.trim() || signedUser.displayName || 'Client Account',
      personalEmail: (draft.personalEmail || authEmail || signedUser.email || '').trim(),
      phone: (draft.phone || authPhone || signedUser.phoneNumber || '').trim(),
    };

    if (signedUser.emailVerified || provider === 'phone') {
      await saveClientRegistration(signedUser, mergedDraft, null);
      if (mergedDraft.autoCreateCompanyWorkspace) {
        try {
          await createInitialCompanyFromRegistration(signedUser, mergedDraft);
        } catch (companyErr) {
          console.warn('Optional initial company workspace creation skipped:', companyErr);
        }
      }
      onRegistrationCompleted?.(signedUser);
    } else {
      savePendingRegistrationDraft(signedUser.uid, mergedDraft);
    }
  };

  const handleGoogleAction = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    if (mode === 'register') {
      const validationErr = validateFullRegistrationDraft();
      if (validationErr) {
        setErrorMsg(validationErr);
        return;
      }
    }
    setSubmitting(true);
    try {
      const signedUser = await signInClientPortalWithGoogle();
      if (signedUser && mode === 'register') {
        await finalizeVerifiedUserProfile(signedUser);
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, language));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!authEmail.trim() || !authEmail.includes('@')) {
      setErrorMsg(isAr ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }
    if (authPassword.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور يجب ألا تقل عن 6 أحرف.' : 'Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      if (authPassword !== authConfirmPassword) {
        setErrorMsg(isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
        return;
      }
      const validationErr = validateFullRegistrationDraft();
      if (validationErr) {
        setErrorMsg(validationErr);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        const createdUser = await signUpClientPortalWithEmail(
          authEmail,
          authPassword,
          draft.fullName
        );
        savePendingRegistrationDraft(createdUser.uid, {
          ...draft,
          personalEmail: authEmail.trim(),
        });
        setInfoMsg(
          isAr
            ? 'تم إنشاء حسابك وإرسال رابط تفعيل إلى بريدك الإلكتروني.'
            : 'Account created and verification email dispatched.'
        );
      } else {
        await signInClientPortalWithEmail(authEmail, authPassword);
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, language));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setErrorMsg(
        isAr
          ? 'اكتب بريدك الإلكتروني أولاً ثم اضغط استعادة كلمة المرور.'
          : 'Enter your email address first to send a password reset link.'
      );
      return;
    }
    try {
      await sendClientPasswordReset(authEmail);
      setInfoMsg(
        isAr
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
          : 'Password reset link sent to your email address.'
      );
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, language));
    }
  };

  const handleSendPhoneOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    const targetPhone = (authPhone || draft.phone).trim();
    if (targetPhone.length < 7) {
      setErrorMsg(
        isAr
          ? 'أدخل رقم التليفون بالصيغة الدولية مثل +2010XXXXXXXX.'
          : 'Enter an international phone number e.g. +2010XXXXXXXX.'
      );
      return;
    }

    if (mode === 'register') {
      const validationErr = validateFullRegistrationDraft();
      if (validationErr) {
        setErrorMsg(validationErr);
        return;
      }
    }

    setSendingOtp(true);
    try {
      const confirmation = await sendClientPhoneOtp(targetPhone, 'client-phone-recaptcha');
      setOtpConfirmation(confirmation);
      setInfoMsg(
        isAr
          ? 'تم إرسال رمز التحقق SMS إلى رقم هاتفك. أدخل الكود المكون من 6 أرقام أدناه.'
          : 'SMS verification code sent. Enter the 6-digit OTP code below.'
      );
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, language));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpConfirmation || otpCode.trim().length < 4) {
      setErrorMsg(isAr ? 'أدخل رمز التحقق SMS المرسل إليك.' : 'Enter the SMS verification code.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cred = await otpConfirmation.confirm(otpCode.trim());
      if (mode === 'register') {
        await finalizeVerifiedUserProfile(cred.user);
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="client-auth-onboarding-card"
      className="max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-8 space-y-6"
    >
      {/* Header & Mode Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <BriefcaseBusiness className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'بوابة عملاء ومجتمع أعمال إنسكو' : 'INSCO Client & Business Community Portal'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'register'
              ? isAr
                ? 'إنشاء حساب عميل جديد بالبيانات الشخصية وبيانات الشركة'
                : 'Create Client Account with Full Personal & Company Details'
              : isAr
                ? 'تسجيل الدخول إلى بوابة العملاء والملفات'
                : 'Sign In to Client & Company Dossier Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {isAr
              ? 'اختر وسيلة التوثيق المناسبة (البريد الإلكتروني، رقم التليفون SMS، أو حساب Google) وسجّل جميع بياناتك الشخصية وبيانات شركتك مباشرة.'
              : 'Authenticate via Email, Phone SMS OTP, or Google Account while recording full personal & corporate profile information.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={isAr ? 'وضع الدخول والتسجيل' : 'Authentication Mode'}
          className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs shrink-0 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-bold transition cursor-pointer whitespace-nowrap ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-bold transition cursor-pointer whitespace-nowrap ${
              mode === 'signin'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
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
                onClick={() => {
                  setProvider(item.id);
                  setErrorMsg(null);
                  setInfoMsg(null);
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

      {/* Registration Full Form Fields (Personal + Company) when mode === 'register' */}
      {mode === 'register' && (
        <ClientRegistrationFormFields
          language={language}
          value={draft}
          onChange={next => {
            setDraft(next);
            if (provider === 'email' && next.personalEmail && !authEmail) {
              setAuthEmail(next.personalEmail);
            }
            if (provider === 'phone' && next.phone && !authPhone) {
              setAuthPhone(next.phone);
            }
          }}
          showAutoCreateCompanyToggle={true}
        />
      )}

      {/* Alerts / Info Banners */}
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
        >
          {errorMsg}
        </div>
      )}

      {infoMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Provider Action Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-4">
        {provider === 'email' && (
          <form onSubmit={e => void handleEmailSubmit(e)} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <label className="space-y-1">
                <span className="text-slate-300 block font-semibold">
                  {isAr ? 'البريد الإلكتروني للحساب *' : 'Account Email *'}
                </span>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => syncEmailIntoDraft(e.target.value)}
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
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
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
                    required
                    minLength={6}
                    value={authConfirmPassword}
                    onChange={e => setAuthConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={!firebaseReady || !authReady || submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span>
                  {submitting
                    ? isAr
                      ? 'جاري التنفيذ...'
                      : 'Processing...'
                    : mode === 'register'
                      ? isAr
                        ? 'إنشاء الحساب وحفظ جميع البيانات'
                        : 'Create Account & Save Details'
                      : isAr
                        ? 'دخول بالبريد الإلكتروني'
                        : 'Sign In with Email'}
                </span>
              </button>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => void handlePasswordReset()}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              )}
            </div>
          </form>
        )}

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
                  value={authPhone || draft.phone}
                  onChange={e => syncPhoneIntoDraft(e.target.value)}
                  placeholder="+201000000000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <div>
                <button
                  type="button"
                  disabled={!firebaseReady || !authReady || sendingOtp}
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

            <div id="client-phone-recaptcha" />

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
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-lg border border-cyan-500/50 bg-slate-900 px-3 py-2 font-mono text-sm tracking-widest text-white focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {submitting
                      ? isAr
                        ? 'جاري التحقق...'
                        : 'Verifying...'
                      : mode === 'register'
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
            <div className="text-xs text-slate-300">
              {mode === 'register'
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
              disabled={!firebaseReady || !authReady || submitting}
              onClick={() => void handleGoogleAction()}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>
                {submitting
                  ? isAr
                    ? 'جاري التوثيق...'
                    : 'Authenticating...'
                  : mode === 'register'
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

      {/* Footer Back Button */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenCompanyPortal}
          className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
        >
          {isAr ? 'العودة لبوابة الشركة' : 'Back to Corporate Portal'}
        </button>
        <span className="text-[11px] font-mono text-slate-500">
          {isAr ? 'بيانات مشفرة ومعزولة لكل حساب في Firestore' : 'Isolated per-account Cloud Firestore records'}
        </span>
      </div>
    </div>
  );
};
