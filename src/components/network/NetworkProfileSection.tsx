import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Camera,
  CircleAlert,
  Download,
  ExternalLink,
  Loader2,
  LogIn,
  Mail,
  MessageSquare,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { Language } from '../../types';
import { NetworkIdentityFields } from './NetworkIdentityFields';
import type { CommunityWorkspaceProfile } from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { VerificationTrackBadges } from './NetworkBadges';
import { bannerPaletteFor, initialsOf, NETWORK_MEDIA_LIMITS } from '../../network/networkIdentity';
import {
  CAREER_ROLES,
  PROFILE_LANGUAGES,
  RELATED_ENGINEERING_FIELDS,
  buildMemberCvHtml,
  computeVerificationTrackState,
} from '../../network/networkTaxonomy';
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
import {
  NETWORK_SKILLS,
  NETWORK_SKILL_GROUPS,
  NETWORK_SKILL_LIMITS,
  parseSkills,
  toggleSkill,
} from '../../network/networkSkills';

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved' }
  | { status: 'error'; message: string };

interface NetworkProfileSectionProps {
  language: Language;
  /** Opens the site account dialog at the panel the current state needs. */
  onOpenAccount: (panel: 'signin' | 'account') => void;
  /** Opens the Facebook-style public personal page (`#network/people/<uid>`). */
  onOpenPublicPage?: (uid: string) => void;
  /** Opens Messenger or Internal Email (`messages` or `mail`). */
  onOpenMessages?: (modeOrTarget?: string) => void;
  /** Opens 3-track verification hub (`#network/verify`). */
  onOpenVerify?: () => void;
}

/**
 * `#network/profile` — live Facebook-style header preview + complete professional card editor.
 */
export const NetworkProfileSection: React.FC<NetworkProfileSectionProps> = ({
  language,
  onOpenAccount,
  onOpenPublicPage,
  onOpenMessages,
  onOpenVerify,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);

  const [profile, setProfile] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NetworkProfileDraft>(() => draftFromProfile(null));
  const [touched, setTouched] = useState(false);
  const [skillLimitHit, setSkillLimitHit] = useState(false);
  const selectedSkills = parseSkills(draft.skills);
  const [save, setSave] = useState<SaveState>({ status: 'idle' });
  const [uploadEnabled, setUploadEnabled] = useState(false);

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

  const toggleField = useCallback(
    (fieldId: string) => {
      const current = draft.relatedFields;
      if (current.includes(fieldId)) {
        update(
          'relatedFields',
          current.filter(id => id !== fieldId)
        );
      } else if (current.length < 8) {
        update('relatedFields', [...current, fieldId]);
      }
    },
    [draft.relatedFields, update]
  );

  const toggleLanguageChoice = useCallback(
    (langId: string) => {
      const current = draft.languages;
      if (current.includes(langId)) {
        update(
          'languages',
          current.filter(id => id !== langId)
        );
      } else if (current.length < 6) {
        update('languages', [...current, langId]);
      }
    },
    [draft.languages, update]
  );

  const exportCv = useCallback(() => {
    if (!profile) return;
    const html = buildMemberCvHtml(profile, language, computeVerificationTrackState(profile));
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile.displayName || 'insco-member').replace(/[^\w\u0600-\u06FF-]+/g, '_')}_cv.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [language, profile]);

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
          message: isAr ? `لم يتم الحفظ: ${message}` : `Not saved: ${message}`,
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
        isLight={isLight}
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
      <div data-testid="network-profile-checking" className={`${s.card} p-3`}>
        <p role="status" className={`flex items-center gap-2 text-[11px] ${s.subtext}`}>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ التحقق من جلسة حسابك…' : 'Checking your account session…'}
        </p>
        <p className={`mt-1.5 text-[10px] leading-relaxed ${s.muted}`}>
          {isAr
            ? 'إذا استمر هذا، أعد تحميل الصفحة أو تحقق من اتصالك — لن نعرض بطاقة بالنيابة عنك.'
            : 'If this persists, reload the page or check your connection — we will not show a card on your behalf.'}
        </p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div data-testid="network-profile-signed-out" className={`${s.card} p-4`}>
        <div className={`flex items-center gap-2 text-sm font-bold ${s.heading}`}>
          <UserRound className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'ملفك المهني يبدأ بحساب' : 'Your professional card starts with an account'}
        </div>
        <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'الشبكة تستخدم حساب إنسكو الموحّد نفسه — لا حساب ثانٍ للشبكة. سجّل الدخول ثم املأ بطاقتك: المسمّى، التخصص، سنوات الخبرة، والشهادات كإقرار غير موثّق حتى تُراجَع.'
            : 'The network uses the same unified INSCO account — no second account. Sign in, then fill your card: headline, discipline, years of experience, and certificates as an unverified claim until reviewed.'}
        </p>
        <button
          type="button"
          onClick={() => onOpenAccount('signin')}
          className={`mt-3 ${s.buttonPrimary}`}
        >
          <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign in / create account'}
        </button>
      </div>
    );
  }

  if (!verified) {
    return (
      <div
        data-testid="network-profile-unverified"
        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {isAr ? 'أكّد بريدك أولاً' : 'Confirm your email first'}
        </div>
        <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'قواعد الحماية لا تسمح بحفظ البطاقة قبل تأكيد البريد — لتظل الشبكة لأشخاص يمكن الوصول إليهم فعلاً. التأكيد يتم من «حسابي».'
            : 'The security rules refuse to save a card before the email is confirmed, so the network stays reachable. Confirmation happens in “My account”.'}
        </p>
        <button
          type="button"
          onClick={() => onOpenAccount('account')}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-300"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isAr ? 'فتح حسابي' : 'Open my account'}
        </button>
      </div>
    );
  }

  /* ------------------------------- the card -------------------------------- */

  const livePalette = bannerPaletteFor(draft.sector ?? '');
  const availabilityPreview = NETWORK_AVAILABILITY.find(a => a.id === draft.availabilityStatus);

  return (
    <div data-testid="network-profile-live" className="min-w-0 space-y-3">
      {/* Live Facebook-Style Personal Profile Preview + Site-Direction Action Strip */}
      <section data-testid="network-profile-fb-preview" className={`overflow-hidden ${s.card}`}>
        <div
          className="relative max-h-52 w-full overflow-hidden"
          style={{ aspectRatio: `${NETWORK_MEDIA_LIMITS.bannerWidth} / ${NETWORK_MEDIA_LIMITS.bannerHeight}` }}
        >
          {draft.bannerURL ? (
            <img
              src={draft.bannerURL}
              alt={isAr ? 'معاينة البانر الشخصي' : 'Personal cover preview'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${livePalette.from}, ${livePalette.to})` }}
            >
              <span className="text-[11px] font-bold tracking-wide" style={{ color: livePalette.accent }}>
                {isAr ? 'أضف بانر الغلاف من قسم الهوية بالأسفل' : 'Add your cover banner in Identity below'}
              </span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <a
            href="#np-identity-section"
            className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-lg border border-white/25 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm transition hover:bg-black/75"
          >
            <Camera className="h-3 w-3 shrink-0" aria-hidden="true" />
            {isAr ? 'تخصيص الغلاف والصورة' : 'Customize cover & photo'}
          </a>
        </div>

        <div className="relative px-4 pb-3 pt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-3">
              <div className="-mt-12 shrink-0 sm:-mt-14">
                {draft.photoURL ? (
                  <img
                    src={draft.photoURL}
                    alt={draft.displayName || 'Avatar'}
                    className={`h-20 w-20 shrink-0 rounded-full border-4 object-cover shadow-lg sm:h-24 sm:w-24 ${
                      isLight ? 'border-white bg-white' : 'border-[#111128] bg-[#111128]'
                    }`}
                  />
                ) : (
                  <div
                    className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-lg font-black shadow-lg sm:h-24 sm:w-24 ${
                      isLight ? 'border-white' : 'border-[#111128]'
                    }`}
                    style={{ background: livePalette.to, color: livePalette.ink }}
                  >
                    {initialsOf(draft.displayName)}
                  </div>
                )}
              </div>
              <div className="min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className={`truncate text-base font-black sm:text-lg ${s.heading}`}>
                    {draft.displayName || (isAr ? 'اسمك المهني' : 'Your professional name')}
                  </h2>
                  {profile ? <VerificationTrackBadges profile={profile} language={language} isLight={isLight} /> : null}
                </div>
                <p className={`truncate text-xs ${s.subtext}`}>
                  {draft.headline || draft.organizationName || (isAr ? 'أضف مسمّاك المهني وتخصصاتك' : 'Add your engineering headline')}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={s.chip}>{draft.sector}</span>
                  {availabilityPreview ? (
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      {isAr ? availabilityPreview.ar : availabilityPreview.en}
                    </span>
                  ) : null}
                  <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-violet-400 tabular-nums">
                    {isAr ? `اكتمال ${completeness.percent}%` : `${completeness.percent}% complete`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {uid && onOpenPublicPage ? (
                <button
                  type="button"
                  onClick={() => onOpenPublicPage(uid)}
                  data-testid="network-profile-open-fb-page"
                  className={s.buttonPrimary}
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {isAr ? 'عرض صفحتي (وضع فيسبوك)' : 'View my Facebook-style page'}
                </button>
              ) : null}
              {onOpenMessages ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenMessages()}
                    className={s.buttonSecondary}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                    {isAr ? 'الماسنجر' : 'Messenger'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenMessages('mail')}
                    className={s.buttonSecondary}
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                    {isAr ? 'البريد الداخلي' : 'Platform Mail'}
                  </button>
                </>
              ) : null}
              {onOpenVerify ? (
                <button
                  type="button"
                  onClick={onOpenVerify}
                  className={s.buttonSecondary}
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  {isAr ? 'توثيق الشهادات' : 'Verify tracks'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
      <form onSubmit={submit} className={`${s.card} min-w-0 p-3`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
            <UserRound className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
            {profile
              ? isAr
                ? 'تحديث بطاقتك المهنية'
                : 'Update your professional card'
              : isAr
                ? 'إنشاء بطاقتك المهنية'
                : 'Create your professional card'}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {profile ? (
              <button
                type="button"
                onClick={exportCv}
                data-testid="network-profile-export-cv"
                className={s.buttonSecondary}
              >
                <Download className="h-3 w-3 shrink-0" aria-hidden="true" />
                {isAr ? 'تصدير السيرة HTML' : 'Export HTML CV'}
              </button>
            ) : null}
            <span className={`text-[10px] ${s.muted}`}>
              {isAr ? `اكتمال البطاقة ${completeness.percent}%` : `Card completeness ${completeness.percent}%`}
            </span>
          </div>
        </div>

        {loadError ? (
          <p role="alert" className="mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
            {isAr ? `تعذّر تحميل بطاقتك: ${loadError}` : `Could not load your card: ${loadError}`}
          </p>
        ) : null}

        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          <Labelled label={isAr ? 'الاسم الكامل' : 'Full name'} error={errorsByField.get('displayName')} htmlFor="np-name" isLight={isLight}>
            <input
              id="np-name"
              className={s.input}
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
            isLight={isLight}
          >
            <input
              id="np-org"
              className={s.input}
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
            isLight={isLight}
          >
            <input
              id="np-headline"
              className={s.input}
              value={draft.headline}
              onChange={event => update('headline', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.headlineMax}
              placeholder={isAr ? 'مثال: مفتش PAUT/TOFD — المستوى II' : 'e.g. PAUT/TOFD inspector — Level II'}
            />
          </Labelled>

          <Labelled label={isAr ? 'الدور الوظيفي القياسي' : 'Career Role'} htmlFor="np-role" isLight={isLight}>
            <select
              id="np-role"
              className={s.input}
              value={draft.professionalRole}
              onChange={event => update('professionalRole', event.target.value)}
            >
              <option value="">{isAr ? 'اختر الدور المهني…' : 'Select career role…'}</option>
              {CAREER_ROLES.map(role => (
                <option key={role.id} value={role.id}>
                  {isAr ? role.ar : role.en}
                </option>
              ))}
            </select>
          </Labelled>

          <Labelled label={isAr ? 'القطاع' : 'Sector'} error={errorsByField.get('sector')} htmlFor="np-sector" isLight={isLight}>
            <select
              id="np-sector"
              className={s.input}
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

          <Labelled label={isAr ? 'المدينة' : 'City'} error={errorsByField.get('city')} htmlFor="np-city" isLight={isLight}>
            <input
              id="np-city"
              className={s.input}
              value={draft.city}
              onChange={event => update('city', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.cityMax}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'سنوات الخبرة' : 'Years of experience'}
            error={errorsByField.get('yearsExperience')}
            htmlFor="np-years"
            isLight={isLight}
          >
            <input
              id="np-years"
              className={s.input}
              inputMode="numeric"
              value={draft.yearsExperience}
              onChange={event => update('yearsExperience', event.target.value.replace(/[^\d]/g, ''))}
              maxLength={2}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'التخصصات والطرق' : 'Specialities and methods'}
            error={errorsByField.get('specialtyTrades')}
            htmlFor="np-specialties"
            className="sm:col-span-2"
            isLight={isLight}
          >
            <input
              id="np-specialties"
              className={s.input}
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
            isLight={isLight}
            hint={
              isAr
                ? 'تُعرض كإقرار منك، ولا تُوسم «مُتحقَّقة» قبل مراجعة جهة الإصدار.'
                : 'Shown as your claim, never badged “verified” before the issuer is checked.'
            }
          >
            <input
              id="np-certs"
              className={s.input}
              value={draft.certifications}
              onChange={event => update('certifications', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.certificationsMax}
              placeholder="ASNT UT II · ISO 9712 RT II"
            />
          </Labelled>

          <Labelled
            label={isAr ? 'حالة التفرّغ' : 'Availability'}
            error={errorsByField.get('availabilityStatus')}
            htmlFor="np-availability"
            isLight={isLight}
          >
            <select
              id="np-availability"
              className={s.input}
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
            label={isAr ? 'سياسة الرسائل المباشرة' : 'Direct message policy'}
            htmlFor="np-msg-policy"
            isLight={isLight}
          >
            <select
              id="np-msg-policy"
              className={s.input}
              value={draft.messagePolicy}
              onChange={event =>
                update('messagePolicy', event.target.value as NetworkProfileDraft['messagePolicy'])
              }
            >
              <option value="everyone">{isAr ? 'الجميع' : 'Everyone'}</option>
              <option value="connections">{isAr ? 'اتصالاتي فقط' : 'Connections only'}</option>
              <option value="none">{isAr ? 'عدم استقبال رسائل' : 'Do not accept messages'}</option>
            </select>
          </Labelled>

          <Labelled
            label={isAr ? 'نبذة' : 'Bio'}
            error={errorsByField.get('bio')}
            htmlFor="np-bio"
            className="sm:col-span-2"
            isLight={isLight}
          >
            <textarea
              id="np-bio"
              className={`${s.input} resize-none`}
              rows={3}
              value={draft.bio}
              onChange={event => update('bio', event.target.value)}
              maxLength={NETWORK_PROFILE_LIMITS.bioMax}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'الخبرة العملية والمناصب' : 'Experience summary'}
            htmlFor="np-exp"
            className="sm:col-span-2"
            isLight={isLight}
          >
            <textarea
              id="np-exp"
              className={`${s.input} resize-none`}
              rows={2}
              value={draft.experienceSummary}
              onChange={event => update('experienceSummary', event.target.value)}
              maxLength={1200}
              placeholder={isAr ? 'أبرز الأدوار والمشاريع السابقة…' : 'Key roles, oil & gas shutdowns, QA audits…'}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'التعليم والتأهيل الأكاديمي' : 'Education summary'}
            htmlFor="np-edu"
            isLight={isLight}
          >
            <textarea
              id="np-edu"
              className={`${s.input} resize-none`}
              rows={2}
              value={draft.educationSummary}
              onChange={event => update('educationSummary', event.target.value)}
              maxLength={600}
              placeholder={isAr ? 'الدرجة العلمية / الدورات المرجعية…' : 'Degree, NDT training school…'}
            />
          </Labelled>

          <Labelled
            label={isAr ? 'أبرز المشاريع الميدانية' : 'Field projects'}
            htmlFor="np-proj"
            isLight={isLight}
          >
            <textarea
              id="np-proj"
              className={`${s.input} resize-none`}
              rows={2}
              value={draft.projectsSummary}
              onChange={event => update('projectsSummary', event.target.value)}
              maxLength={800}
              placeholder={isAr ? 'مشاريع الفحص والاختبارات…' : 'Key pipeline, refinery or vessel projects…'}
            />
          </Labelled>

          {/* Related engineering fields */}
          <div className="min-w-0 sm:col-span-2">
            <span className={`block text-[10px] font-bold ${s.subtext}`}>
              {isAr ? 'مجالات هندسية مرتبطة (حتى 8)' : 'Related engineering fields (up to 8)'}
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {RELATED_ENGINEERING_FIELDS.map(field => {
                const active = draft.relatedFields.includes(field.id);
                return (
                  <button
                    key={field.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleField(field.id)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] transition cursor-pointer ${
                      active
                        ? 'border-violet-400 bg-violet-500/20 font-bold text-violet-300'
                        : isLight
                          ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-violet-400'
                          : 'border-[#2b2b52] bg-[#0f0f22] text-slate-300 hover:border-violet-400/50'
                    }`}
                  >
                    {isAr ? field.ar : field.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Languages */}
          <div className="min-w-0 sm:col-span-2">
            <span className={`block text-[10px] font-bold ${s.subtext}`}>
              {isAr ? 'لغات العمل' : 'Working languages'}
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {PROFILE_LANGUAGES.map(lang => {
                const active = draft.languages.includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleLanguageChoice(lang.id)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] transition cursor-pointer ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/20 font-bold text-emerald-300'
                        : isLight
                          ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-violet-400'
                          : 'border-[#2b2b52] bg-[#0f0f22] text-slate-300 hover:border-violet-400/50'
                    }`}
                  >
                    {isAr ? lang.ar : lang.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div className="min-w-0 sm:col-span-2">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
              <span className={`text-[11px] font-bold ${s.heading}`}>
                {isAr ? 'المهارات' : 'Skills'}
              </span>
              <span className={`text-[10px] ${s.muted}`}>
                {isAr
                  ? `${selectedSkills.length}/${NETWORK_SKILL_LIMITS.maxSkills} — تزكيات الزملاء لا تُعدّ شهادات`
                  : `${selectedSkills.length}/${NETWORK_SKILL_LIMITS.maxSkills} — peer endorsements, not certificates`}
              </span>
            </div>
            <p className={`mb-1.5 text-[10px] leading-relaxed ${s.muted}`}>
              {isAr
                ? 'اختر من القائمة المغلقة حتى يجدك بقية الأعضاء بنفس المفردات. المهارة إقرار منك، والتزكية رأي زميل — ولا واحدة منهما شهادة موثّقة.'
                : 'Pick from the closed list so members can find you with the same vocabulary. A skill is your claim, an endorsement is a colleague’s word — neither is a verified certificate.'}
            </p>
            <div className="min-w-0 space-y-1.5">
              {NETWORK_SKILL_GROUPS.map(group => {
                const groupSkills = NETWORK_SKILLS.filter(skill => skill.group === group.id);
                if (groupSkills.length === 0) return null;
                return (
                  <div key={group.id} className="min-w-0">
                    <p className={`mb-1 text-[10px] font-bold ${s.subtext}`}>{isAr ? group.ar : group.en}</p>
                    <div className="flex min-w-0 flex-wrap gap-1">
                      {groupSkills.map(skill => {
                        const active = selectedSkills.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            data-testid={`np-skill-${skill.id}`}
                            aria-pressed={active}
                            onClick={() => {
                              const next = toggleSkill(draft.skills, skill.id);
                              update('skills', next.value);
                              setSkillLimitHit(next.rejected === 'limit');
                            }}
                            className={`min-w-0 rounded-full border px-2 py-0.5 text-[10px] transition ${
                              active
                                ? 'border-violet-400/60 bg-violet-500/20 text-violet-300'
                                : isLight
                                  ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-violet-400'
                                  : 'border-[#2b2b52] bg-[#0f0f22] text-slate-300 hover:border-violet-400/40 hover:text-violet-100'
                            }`}
                          >
                            {isAr ? skill.ar : skill.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {skillLimitHit ? (
              <p role="status" className="mt-1 text-[10px] text-amber-400">
                {isAr
                  ? `الحد ${NETWORK_SKILL_LIMITS.maxSkills} مهارة — أزل واحدة قبل الإضافة.`
                  : `The limit is ${NETWORK_SKILL_LIMITS.maxSkills} skills — remove one first.`}
              </p>
            ) : null}
          </div>
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

        <div className="mt-2.5 space-y-1.5">
          <label className={`flex items-center gap-2 text-[11px] ${s.subtext}`}>
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
          <label className={`flex items-center gap-2 text-[11px] ${s.subtext}`}>
            <input
              type="checkbox"
              checked={draft.shareAcademyProgress}
              onChange={event => update('shareAcademyProgress', event.target.checked)}
              className="h-3.5 w-3.5 shrink-0 accent-violet-500"
            />
            {isAr
              ? 'إظهار ملخص إنجازي في الأكاديمية اختيارياً في صفحتي العامة'
              : 'Opt in to share my INSCO Academy learning milestones on my public profile'}
          </label>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={save.status === 'saving' || errors.length > 0}
            className={s.buttonPrimary}
          >
            {save.status === 'saving' ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            {profile ? (isAr ? 'حفظ التعديلات' : 'Save changes') : isAr ? 'إنشاء البطاقة' : 'Create the card'}
          </button>

          {touched && errors.length > 0 ? (
            <span role="alert" className="text-[10px] text-rose-400">
              {isAr ? `أكمل ${errors.length} حقلاً قبل الحفظ.` : `Complete ${errors.length} field(s) before saving.`}
            </span>
          ) : null}
          {save.status === 'saved' ? (
            <span role="status" className="text-[10px] font-bold text-emerald-400">
              {isAr ? 'تم الحفظ في حسابك.' : 'Saved to your account.'}
            </span>
          ) : null}
          {save.status === 'error' ? (
            <span role="alert" className="text-[10px] text-rose-400">
              {save.message}
            </span>
          ) : null}
        </div>
      </form>

      <div className="min-w-0 space-y-3">
        <div className={`${s.card} p-3`}>
          <h4 className={`flex items-center gap-1.5 text-[11px] font-bold ${s.heading}`}>
            <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
            {isAr ? 'حالة البطاقة' : 'Card status'}
          </h4>
          <ul className={`mt-1.5 space-y-1 text-[10px] ${s.subtext}`}>
            <li>{isAr ? `منشورة: ${draft.isPublished ? 'نعم' : 'لا'}` : `Published: ${draft.isPublished ? 'yes' : 'no'}`}</li>
            <li>{loading ? (isAr ? 'جارٍ التحميل…' : 'Loading…') : isAr ? 'مزامنة مع حسابك' : 'Synced with your account'}</li>
            {completeness.missingAr.length > 0 ? (
              <li className={s.muted}>
                {isAr
                  ? `ناقص: ${completeness.missingAr.join(' · ')}`
                  : `Missing: ${completeness.missingEn.join(' · ')}`}
              </li>
            ) : (
              <li className="text-emerald-400">{isAr ? 'البطاقة مكتملة.' : 'The card is complete.'}</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[10px] leading-relaxed text-emerald-300">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-200">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'الفرق الذي لا نخلطه' : 'The difference we do not blur'}
          </div>
          {isAr
            ? 'إقرارك بالشهادة شيء، والتحقق منها شيء آخر: لا شارة «مؤهل مُتحقَّق» تظهر من هنا، بل من مراجعة يدوية لجهة الإصدار في مسار التوثيق.'
            : 'Your claim is one thing, verification another: no “credential verified” badge appears from this form, only from a manual check with the issuer in the verification track.'}
        </div>
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
  isLight?: boolean;
  children: React.ReactNode;
}> = ({ label, htmlFor, error, hint, className = '', isLight = false, children }) => (
  <div className={`min-w-0 ${className}`}>
    <label htmlFor={htmlFor} className={`block text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
      {label}
    </label>
    <div className="mt-0.5">{children}</div>
    {error ? (
      <p className="mt-0.5 text-[10px] text-rose-400">{error}</p>
    ) : hint ? (
      <p className={`mt-0.5 text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{hint}</p>
    ) : null}
  </div>
);

const Notice: React.FC<{
  tone: 'neutral' | 'warning';
  testId: string;
  isLight?: boolean;
  icon: React.ReactNode;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}> = ({ tone, testId, isLight = false, icon, titleAr, titleEn, bodyAr, bodyEn }) => {
  const s = networkSurface(isLight);
  return (
    <div
      data-testid={testId}
      className={
        tone === 'warning'
          ? 'rounded-xl border border-amber-500/30 bg-amber-500/10 p-4'
          : `${s.card} p-4`
      }
    >
      <div className={`flex items-center gap-2 text-sm font-bold ${s.heading}`}>
        {icon}
        <span className="min-w-0">{titleAr}</span>
      </div>
      <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>{bodyAr}</p>
      <p className={`mt-1 max-w-2xl text-[10px] leading-relaxed ${s.muted}`} dir="ltr">
        {bodyEn}
      </p>
      <span className="sr-only">{titleEn}</span>
    </div>
  );
};

export default NetworkProfileSection;
