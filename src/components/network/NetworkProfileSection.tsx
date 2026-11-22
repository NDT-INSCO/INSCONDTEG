import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CircleAlert,
  Loader2,
  LogIn,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { Language } from '../../types';
import { NetworkIdentityFields } from './NetworkIdentityFields';
import type { CommunityWorkspaceProfile } from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import {
  NETWORK_AVAILABILITY,
  NETWORK_PROFILE_LIMITS,
  NETWORK_SECTORS,
  draftFromProfile,
  networkProfileCompleteness,
  toWorkspaceWrite,
  validateNetworkProfileDraft,
  type NetworkProfileDraft,
  type NetworkProfileField,
} from '../../network/networkProfileForm';

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved' }
  | { status: 'error'; message: string };

interface NetworkProfileSectionProps {
  language: Language;
  /** Opens the site account dialog at the panel the current state needs. */
  onOpenAccount: (panel: 'signin' | 'account') => void;
}

const fieldClass =
  'w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none';
const labelClass = 'block text-[10px] font-bold text-slate-400';

/**
 * `#network/profile` — the member's real professional card.
 *
 * The card is the site's existing public community workspace document, written
 * through its existing service and rules; this screen is a second, friendlier
 * front door to the same record. Every state is explicit — no session, no
 * verified email, no Firebase, no card yet, saved — because the honest answer to
 * "where is my profile?" must never be an empty card that looks real.
 */
export const NetworkProfileSection: React.FC<NetworkProfileSectionProps> = ({
  language,
  onOpenAccount,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';

  const [profile, setProfile] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NetworkProfileDraft>(() => draftFromProfile(null));
  const [touched, setTouched] = useState(false);
  const [save, setSave] = useState<SaveState>({ status: 'idle' });
  const [uploadEnabled, setUploadEnabled] = useState(false);

  /* Storage is optional: ask the media service whether this build has a bucket. */
  useEffect(() => {
    let active = true;
    void import('../../client/profileMediaService').then(api => {
      if (active) setUploadEnabled(api.isMediaUploadAvailable());
    });
    return () => {
      active = false;
    };
  }, []);

  const uid = account?.user?.uid ?? null;
  const signedIn = Boolean(uid);
  const verified = account?.verified ?? false;
  const serviceReady = account?.available ?? false;

  /* The card follows the account: signing out clears it immediately. */
  useEffect(() => {
    setProfile(null);
    setDraft(draftFromProfile(null));
    setTouched(false);
    setSave({ status: 'idle' });
    setLoadError(null);
    if (!uid || !serviceReady) return;

    let active = true;
    setLoading(true);
    let stop: (() => void) | undefined;
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stop = api.subscribeMyCommunityWorkspace(
        uid,
        next => {
          if (!active) return;
          setProfile(next);
          setDraft(current => (touched ? current : draftFromProfile(next)));
          setLoading(false);
        },
        error => {
          if (!active) return;
          setLoadError(error.message);
          setLoading(false);
        }
      );
    });
    return () => {
      active = false;
      stop?.();
    };
    // `touched` is read through a state updater on purpose: re-subscribing on
    // every keystroke would open a new Firestore listener per character.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, serviceReady]);

  const errors = useMemo(() => validateNetworkProfileDraft(draft), [draft]);
  const errorsByField = useMemo(() => {
    const map = new Map<NetworkProfileField, string>();
    for (const error of errors) if (!map.has(error.field)) map.set(error.field, isAr ? error.ar : error.en);
    return map;
  }, [errors, isAr]);
  const completeness = useMemo(() => networkProfileCompleteness(draft), [draft]);

  const update = useCallback(<K extends keyof NetworkProfileDraft>(key: K, value: NetworkProfileDraft[K]) => {
    setTouched(true);
    setSave(current => (current.status === 'saved' ? { status: 'idle' } : current));
    setDraft(current => ({ ...current, [key]: value }));
  }, []);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setTouched(true);
      const user = account?.user;
      if (!user) return;
      if (errors.length > 0) return;
      setSave({ status: 'saving' });
      try {
        const api = await import('../../client/firestoreClientService');
        await api.upsertCommunityWorkspace(user, toWorkspaceWrite(draft, profile), profile);
        setSave({ status: 'saved' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSave({
          status: 'error',
          message: isAr
            ? `لم يتم الحفظ: ${message}`
            : `Not saved: ${message}`,
        });
      }
    },
    [account?.user, draft, errors.length, isAr, profile]
  );

  /* ----------------------------- not-ready states ---------------------------- */

  if (!serviceReady) {
    return (
      <Notice
        tone="neutral"
        testId="network-profile-service-unavailable"
        icon={<CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />}
        titleAr="التسجيل غير متاح في هذه النسخة"
        titleEn="Accounts are not available in this build"
        bodyAr="لم يُهيَّأ اتصال Firebase هنا، لذلك لا يمكن إنشاء ملف مهني حقيقي. لن نعرض لك ملفاً وهمياً بدلاً منه."
        bodyEn="Firebase is not initialised here, so no real professional card can be created. We will not show you a fake one instead."
      />
    );
  }

  if (!account?.ready) {
    return (
      <div data-testid="network-profile-checking" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
        <p role="status" className="flex items-center gap-2 text-[11px] text-slate-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ التحقق من جلسة حسابك…' : 'Checking your account session…'}
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
          {isAr
            ? 'إذا استمر هذا، أعد تحميل الصفحة أو تحقق من اتصالك — لن نعرض بطاقة بالنيابة عنك.'
            : 'If this persists, reload the page or check your connection — we will not show a card on your behalf.'}
        </p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div data-testid="network-profile-signed-out" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <UserRound className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          {isAr ? 'ملفك المهني يبدأ بحساب' : 'Your professional card starts with an account'}
        </div>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400">
          {isAr
            ? 'الشبكة تستخدم حساب إنسكو الموحّد نفسه — لا حساب ثانٍ للشبكة. سجّل الدخول ثم املأ بطاقتك: المسمّى، التخصص، سنوات الخبرة، والشهادات كإقرار غير موثّق حتى تُراجَع.'
            : 'The network uses the same unified INSCO account — no second account. Sign in, then fill your card: headline, discipline, years of experience, and certificates as an unverified claim until reviewed.'}
        </p>
        <button
          type="button"
          onClick={() => onOpenAccount('signin')}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
        >
          <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign in / create account'}
        </button>
      </div>
    );
  }

  if (!verified) {
    return (
      <div data-testid="network-profile-unverified" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {isAr ? 'أكّد بريدك أولاً' : 'Confirm your email first'}
        </div>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-amber-100/90">
          {isAr
            ? 'قواعد الحماية لا تسمح بحفظ البطاقة قبل تأكيد البريد — لتظل الشبكة لأشخاص يمكن الوصول إليهم فعلاً. التأكيد يتم من «حسابي».'
            : 'The security rules refuse to save a card before the email is confirmed, so the network stays reachable. Confirmation happens in “My account”.'}
        </p>
        <button
          type="button"
          onClick={() => onOpenAccount('account')}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isAr ? 'فتح حسابي' : 'Open my account'}
        </button>
      </div>
    );
  }

  /* ------------------------------- the card -------------------------------- */

  return (
    <div data-testid="network-profile-live" className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
      <form onSubmit={submit} className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-white">
            <UserRound className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            {profile
              ? isAr ? 'تحديث بطاقتك المهنية' : 'Update your professional card'
              : isAr ? 'إنشاء بطاقتك المهنية' : 'Create your professional card'}
          </h3>
          <span className="text-[10px] text-slate-500">
            {isAr ? `اكتمال البطاقة ${completeness.percent}%` : `Card completeness ${completeness.percent}%`}
          </span>
        </div>

        {loadError ? (
          <p role="alert" className="mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
            {isAr ? `تعذّر تحميل بطاقتك: ${loadError}` : `Could not load your card: ${loadError}`}
          </p>
        ) : null}

        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          <Labelled label={isAr ? 'الاسم الكامل' : 'Full name'} error={errorsByField.get('displayName')} htmlFor="np-name">
            <input
              id="np-name"
              className={fieldClass}
              value={draft.displayName}
              onChange={event => update('displayName', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.displayNameMax}
              autoComplete="name"
            />
          </Labelled>

          <Labelled
            label={isAr ? 'جهة العمل (أو «مستقل»)' : 'Employer (or “Independent”)'}
            error={errorsByField.get('organizationName')}
            htmlFor="np-org"
          >
            <input
              id="np-org"
              className={fieldClass}
              value={draft.organizationName}
              onChange={event => update('organizationName', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.organizationMax}
              autoComplete="organization"
            />
          </Labelled>

          <Labelled
            label={isAr ? 'المسمّى المهني' : 'Professional headline'}
            error={errorsByField.get('headline')}
            htmlFor="np-headline"
            className="sm:col-span-2"
          >
            <input
              id="np-headline"
              className={fieldClass}
              value={draft.headline}
              onChange={event => update('headline', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.headlineMax}
              placeholder={isAr ? 'مثال: مفتش PAUT/TOFD — المستوى II' : 'e.g. PAUT/TOFD inspector — Level II'}
            />
          </Labelled>

          <Labelled label={isAr ? 'القطاع' : 'Sector'} error={errorsByField.get('sector')} htmlFor="np-sector">
            <select
              id="np-sector"
              className={fieldClass}
              value={draft.sector}
              onChange={event => update('sector', event.target.value)}
            >
              {NETWORK_SECTORS.map(sector => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </Labelled>

          <Labelled label={isAr ? 'المدينة' : 'City'} error={errorsByField.get('city')} htmlFor="np-city">
            <input
              id="np-city"
              className={fieldClass}
              value={draft.city}
              onChange={event => update('city', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.cityMax}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'التخصصات والطرق' : 'Specialities and methods'}
            error={errorsByField.get('specialtyTrades')}
            htmlFor="np-specialties"
            className="sm:col-span-2"
          >
            <input
              id="np-specialties"
              className={fieldClass}
              value={draft.specialtyTrades}
              onChange={event => update('specialtyTrades', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.specialtyMax}
              placeholder={isAr ? 'UT · PAUT/TOFD · RT · فحص لحام' : 'UT · PAUT/TOFD · RT · weld inspection'}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'الشهادات (إقرار غير موثّق)' : 'Certifications (an unverified claim)'}
            error={errorsByField.get('certifications')}
            htmlFor="np-certs"
            className="sm:col-span-2"
            hint={isAr ? 'تُعرض كإقرار منك، ولا تُوسم «مُتحقَّقة» قبل مراجعة جهة الإصدار.' : 'Shown as your claim, never badged “verified” before the issuer is checked.'}
          >
            <input
              id="np-certs"
              className={fieldClass}
              value={draft.certifications}
              onChange={event => update('certifications', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.certificationsMax}
              placeholder="ASNT UT II · ISO 9712 RT II"
            />
          </Labelled>

          <Labelled
            label={isAr ? 'سنوات الخبرة' : 'Years of experience'}
            error={errorsByField.get('yearsExperience')}
            htmlFor="np-years"
          >
            <input
              id="np-years"
              className={fieldClass}
              inputMode="numeric"
              value={draft.yearsExperience}
              onChange={event => update('yearsExperience', event.target.value.replace(/[^\d]/g, ''))}
              maxLength={2}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'حالة التفرّغ' : 'Availability'}
            error={errorsByField.get('availabilityStatus')}
            htmlFor="np-availability"
          >
            <select
              id="np-availability"
              className={fieldClass}
              value={draft.availabilityStatus}
              onChange={event =>
                update('availabilityStatus', event.target.value as NetworkProfileDraft['availabilityStatus'])
              }
            >
              {NETWORK_AVAILABILITY.map(item => (
                <option key={item.id} value={item.id}>
                  {isAr ? item.ar : item.en}
                </option>
              ))}
            </select>
          </Labelled>

          <Labelled
            label={isAr ? 'نبذة' : 'Bio'}
            error={errorsByField.get('bio')}
            htmlFor="np-bio"
            className="sm:col-span-2"
          >
            <textarea
              id="np-bio"
              className={`${fieldClass} resize-none`}
              rows={3}
              value={draft.bio}
              onChange={event => update('bio', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.bioMax}
            />
          </Labelled>
        </div>

        <div className="mt-2.5">
          <NetworkIdentityFields
            language={language}
            draft={draft}
            user={account?.user ?? null}
            uploadEnabled={uploadEnabled}
            errors={errorsByField}
            onChange={update}
          />
        </div>

        <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={draft.isPublished}
            onChange={event => update('isPublished', event.target.checked)}
            className="h-3.5 w-3.5 shrink-0 accent-violet-500"
          />
          {isAr
            ? 'إظهار البطاقة في دليل الأعضاء (يمكن إخفاؤها في أي وقت)'
            : 'Show this card in the member directory (you can hide it any time)'}
        </label>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={save.status === 'saving' || errors.length > 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {save.status === 'saving' ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            {profile ? (isAr ? 'حفظ التعديلات' : 'Save changes') : isAr ? 'إنشاء البطاقة' : 'Create the card'}
          </button>

          {touched && errors.length > 0 ? (
            <span role="alert" className="text-[10px] text-rose-300">
              {isAr ? `أكمل ${errors.length} حقلاً قبل الحفظ.` : `Complete ${errors.length} field(s) before saving.`}
            </span>
          ) : null}
          {save.status === 'saved' ? (
            <span role="status" className="text-[10px] font-bold text-emerald-300">
              {isAr ? 'تم الحفظ في حسابك.' : 'Saved to your account.'}
            </span>
          ) : null}
          {save.status === 'error' ? (
            <span role="alert" className="text-[10px] text-rose-300">
              {save.message}
            </span>
          ) : null}
        </div>
      </form>

      <div className="min-w-0 space-y-3">
        <div className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
          <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
            {isAr ? 'حالة البطاقة' : 'Card status'}
          </h4>
          <ul className="mt-1.5 space-y-1 text-[10px] text-slate-400">
            <li>{isAr ? `منشورة: ${draft.isPublished ? 'نعم' : 'لا'}` : `Published: ${draft.isPublished ? 'yes' : 'no'}`}</li>
            <li>{loading ? (isAr ? 'جارٍ التحميل…' : 'Loading…') : isAr ? 'مزامنة مع حسابك' : 'Synced with your account'}</li>
            {completeness.missingAr.length > 0 ? (
              <li className="text-slate-500">
                {isAr
                  ? `ناقص: ${completeness.missingAr.join(' · ')}`
                  : `Missing: ${completeness.missingEn.join(' · ')}`}
              </li>
            ) : (
              <li className="text-emerald-300">{isAr ? 'البطاقة مكتملة.' : 'The card is complete.'}</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[10px] leading-relaxed text-emerald-100">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-200">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'الفرق الذي لا نخلطه' : 'The difference we do not blur'}
          </div>
          {isAr
            ? 'إقرارك بالشهادة شيء، والتحقق منها شيء آخر: لا شارة «مؤهل مُتحقَّق» تظهر من هنا، بل من مراجعة يدوية لجهة الإصدار في مسار التحقق.'
            : 'Your claim is one thing, verification another: no “credential verified” badge appears from this form, only from a manual check with the issuer in the verification track.'}
        </div>
      </div>
    </div>
  );
};

const Labelled: React.FC<{
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, error, hint, className = '', children }) => (
  <div className={`min-w-0 ${className}`}>
    <label htmlFor={htmlFor} className={labelClass}>
      {label}
    </label>
    <div className="mt-0.5">{children}</div>
    {error ? (
      <p className="mt-0.5 text-[10px] text-rose-300">{error}</p>
    ) : hint ? (
      <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>
    ) : null}
  </div>
);

const Notice: React.FC<{
  tone: 'neutral' | 'warning';
  testId: string;
  icon: React.ReactNode;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}> = ({ tone, testId, icon, titleAr, titleEn, bodyAr, bodyEn }) => (
  <div
    data-testid={testId}
    className={`rounded-xl border p-4 ${
      tone === 'warning' ? 'border-amber-500/30 bg-amber-500/10' : 'border-[#232345] bg-[#0f0f22]'
    }`}
  >
    <div className="flex items-center gap-2 text-sm font-bold text-white">
      {icon}
      <span className="min-w-0">{titleAr === titleEn ? titleAr : `${titleAr}`}</span>
    </div>
    <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400">{bodyAr}</p>
    <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-slate-500" dir="ltr">
      {bodyEn}
    </p>
    <span className="sr-only">{titleEn}</span>
  </div>
);

export default NetworkProfileSection;
