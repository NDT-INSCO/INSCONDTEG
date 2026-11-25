import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Briefcase,
  Check,
  CircleAlert,
  FileCheck2,
  Loader2,
  MapPin,
  Search,
  Send,
  UserPlus,
} from 'lucide-react';
import type {
  CommunityConnection,
  CommunityEmploymentType,
  CommunityExperienceLevel,
  CommunityJobApplication,
  CommunityJobApplicationStatus,
  CommunityOpportunity,
  CommunityOpportunityType,
  CommunityWorkspaceProfile,
} from '../../client/types';
import type { Language } from '../../types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import {
  EMPTY_JOB_DRAFT,
  NETWORK_EMPLOYMENT_TYPES,
  NETWORK_EXPERIENCE_LEVELS,
  NETWORK_JOB_LIMITS,
  NETWORK_OPPORTUNITY_TYPES,
  matchesJobFilter,
  normaliseMethods,
  opportunityTypeById,
  toOpportunityInput,
  validateJobDraft,
  type NetworkJobDraft,
} from '../../network/networkJobsForm';

interface NetworkJobsSectionProps {
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  slowAfterMs?: number;
}

const relativeDate = (value: unknown, isAr: boolean): string => {
  const millis =
    value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function'
      ? (value as { toMillis: () => number }).toMillis()
      : 0;
  if (!millis) return isAr ? 'الآن' : 'now';
  return new Date(millis).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');
};

const appStatusLabel = (status: CommunityJobApplicationStatus, isAr: boolean) => {
  switch (status) {
    case 'shortlisted':
      return isAr ? 'قائمة مختصرة' : 'Shortlisted';
    case 'contacted':
      return isAr ? 'تم التواصل' : 'Contacted';
    case 'rejected':
      return isAr ? 'غير مناسب حالياً' : 'Declined';
    default:
      return isAr ? 'تم التقديم' : 'Submitted';
  }
};

/**
 * `#network/jobs` — real opportunities, formal applications, saved jobs & employer triage.
 */
export const NetworkJobsSection: React.FC<NetworkJobsSectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);

  const [opportunities, setOpportunities] = useState<CommunityOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [connections, setConnections] = useState<CommunityConnection[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [draft, setDraft] = useState<NetworkJobDraft>(EMPTY_JOB_DRAFT);
  const [touched, setTouched] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);

  const [filter, setFilter] = useState<{
    text: string;
    type: CommunityOpportunityType | 'all';
    method: string;
    employmentType: CommunityEmploymentType | 'all';
    savedOnly: boolean;
  }>({
    text: '',
    type: 'all',
    method: '',
    employmentType: 'all',
    savedOnly: false,
  });

  const [myApps, setMyApps] = useState<CommunityJobApplication[]>([]);
  const [employerApps, setEmployerApps] = useState<CommunityJobApplication[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const [applyingOppId, setApplyingOppId] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [cvSummary, setCvSummary] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;
  const canPublish = Boolean(uid) && verified && Boolean(card);

  const connectedUids = useMemo(() => {
    const set = new Set<string>();
    for (const connection of connections) if (connection.status === 'connected') set.add(connection.toUid);
    return set;
  }, [connections]);

  const myAppByOpp = useMemo(() => {
    const map = new Map<string, CommunityJobApplication>();
    for (const app of myApps) map.set(app.opportunityId, app);
    return map;
  }, [myApps]);

  useEffect(() => {
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    let stop: (() => void) | undefined;
    setLoading(true);
    setSlow(false);
    const timer = setTimeout(() => {
      if (active) setSlow(true);
    }, slowAfterMs);
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stop = api.subscribeCommunityOpportunities(
        next => {
          if (!active) return;
          setOpportunities(next);
          setLoading(false);
          setSlow(false);
        },
        nextError => {
          if (!active) return;
          setError(nextError.message);
          setLoading(false);
          setSlow(false);
        }
      );
    });
    return () => {
      active = false;
      clearTimeout(timer);
      stop?.();
    };
  }, [serviceReady, slowAfterMs]);

  useEffect(() => {
    setCard(null);
    setConnections([]);
    setMyApps([]);
    setEmployerApps([]);
    setBookmarkedIds(new Set());
    if (!uid || !serviceReady) return;
    let active = true;
    const stops: Array<() => void> = [];
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stops.push(
        api.subscribeMyCommunityWorkspace(
          uid,
          next => {
            if (active) setCard(next);
          },
          () => {}
        )
      );
      stops.push(
        api.subscribeMyConnections(
          uid,
          next => {
            if (active) setConnections(next);
          },
          () => {}
        )
      );
    });
    void import('../../client/networkPlatformService')
      .then(api => {
        if (!active) return;
        if (api.subscribeMyJobApplications) {
          stops.push(
            api.subscribeMyJobApplications(uid, list => {
              if (active) setMyApps(list);
            })
          );
        }
        if (api.subscribeEmployerJobApplications) {
          stops.push(
            api.subscribeEmployerJobApplications(uid, list => {
              if (active) setEmployerApps(list);
            })
          );
        }
        if (api.subscribeMyBookmarks) {
          stops.push(
            api.subscribeMyBookmarks(uid, list => {
              if (active) setBookmarkedIds(new Set(list.map(b => b.postId)));
            })
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      stops.forEach(fn => fn());
    };
  }, [uid, serviceReady]);

  const errors = useMemo(() => validateJobDraft(draft), [draft]);
  const previewMethods = useMemo(() => normaliseMethods(draft.methods), [draft.methods]);

  const update = useCallback(<K extends keyof NetworkJobDraft>(key: K, value: NetworkJobDraft[K]) => {
    setTouched(true);
    setPublished(false);
    setActionError(null);
    setDraft(current => ({ ...current, [key]: value }));
  }, []);

  const publish = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setTouched(true);
      const user = account?.user;
      if (!user || !card || errors.length > 0) return;
      setPublishing(true);
      setActionError(null);
      try {
        const api = await import('../../client/firestoreClientService');
        await api.createCommunityOpportunity(
          user,
          toOpportunityInput(draft, {
            displayName: card.displayName,
            organizationName: card.organizationName,
            companyCode: card.companyCode,
          })
        );
        setDraft(EMPTY_JOB_DRAFT);
        setTouched(false);
        setPublished(true);
      } catch (failure) {
        setActionError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setPublishing(false);
      }
    },
    [account?.user, card, draft, errors.length]
  );

  const toggleStatus = useCallback(async (opportunity: CommunityOpportunity) => {
    setClosing(opportunity.id);
    setActionError(null);
    try {
      const api = await import('../../client/firestoreClientService');
      await api.updateCommunityOpportunityStatus(
        opportunity.id,
        opportunity.status === 'open' ? 'closed' : 'open'
      );
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setClosing(null);
    }
  }, []);

  const contactPublisher = useCallback(
    async (opportunity: CommunityOpportunity) => {
      const user = account?.user;
      if (!user || !card || connecting) return;
      setConnecting(opportunity.id);
      setActionError(null);
      try {
        const api = await import('../../client/firestoreClientService');
        await api.connectWithCommunityMember(user, card.displayName, {
          uid: opportunity.authorUid,
          displayName: opportunity.authorName,
        });
      } catch (failure) {
        setActionError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setConnecting(null);
      }
    },
    [account?.user, card, connecting]
  );

  const toggleSaveJob = useCallback(
    async (opportunity: CommunityOpportunity) => {
      const user = account?.user;
      if (!user) return;
      try {
        const api = await import('../../client/networkPlatformService');
        const next = await api.toggleBookmark(user, opportunity.id, opportunity.title);
        setBookmarkedIds(prev => {
          const updated = new Set(prev);
          if (next) updated.add(opportunity.id);
          else updated.delete(opportunity.id);
          return updated;
        });
      } catch {
        /* ignore */
      }
    },
    [account?.user]
  );

  const submitApplication = useCallback(
    async (e: React.FormEvent, opportunity: CommunityOpportunity) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || coverNote.trim().length < 5 || submittingApp) return;
      setSubmittingApp(true);
      setActionError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        await api.submitJobApplication(user, {
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
          employerUid: opportunity.authorUid,
          applicantName: card.displayName,
          applicantHeadline: card.headline,
          applicantOrg: card.organizationName,
          coverNote: coverNote.trim(),
          cvSummary: cvSummary.trim() || card.experienceSummary || card.certifications || undefined,
        });
        setCoverNote('');
        setCvSummary('');
        setApplyingOppId(null);
      } catch (failure) {
        setActionError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setSubmittingApp(false);
      }
    },
    [account?.user, card, coverNote, cvSummary, submittingApp]
  );

  const updateApplicantStatus = useCallback(async (appId: string, status: CommunityJobApplicationStatus) => {
    try {
      const api = await import('../../client/networkPlatformService');
      await api.updateJobApplicationStatus(appId, status);
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : String(failure));
    }
  }, []);

  const visible = useMemo(
    () =>
      opportunities.filter(opportunity => {
        if (!matchesJobFilter(opportunity, { text: filter.text, type: filter.type, method: filter.method })) {
          return false;
        }
        if (filter.employmentType !== 'all' && opportunity.employmentType !== filter.employmentType) {
          return false;
        }
        if (filter.savedOnly && !bookmarkedIds.has(opportunity.id)) {
          return false;
        }
        return true;
      }),
    [opportunities, filter, bookmarkedIds]
  );

  if (!serviceReady) {
    return (
      <div data-testid="network-jobs-unavailable" className={`${s.card} p-4`}>
        <div className={`flex items-center gap-2 text-sm font-bold ${s.heading}`}>
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'لوحة الفرص غير متاحة في هذه النسخة' : 'The jobs board is not available in this build'}
        </div>
        <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'لم يُهيَّأ اتصال Firebase، فلا توجد فرص حقيقية — ولن نعرض وظائف تجريبية بدلاً منها.'
            : 'Firebase is not initialised, so there are no real opportunities — and we will not show trial jobs instead.'}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="network-jobs-live" className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
      <div className="min-w-0 space-y-3">
        {canPublish ? (
          <form onSubmit={publish} className={`${s.card} min-w-0 p-3`}>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <Briefcase className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              <span className={s.heading}>{isAr ? 'نشر فرصة' : 'Publish an opportunity'}</span>
              <span className={`ms-auto text-[10px] font-normal ${s.muted}`}>
                {isAr ? `باسم ${card?.displayName} · ${card?.organizationName}` : `as ${card?.displayName} · ${card?.organizationName}`}
              </span>
            </div>

            <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'النوع' : 'Type'}</span>
                <select
                  value={draft.type}
                  onChange={event => update('type', event.target.value as CommunityOpportunityType)}
                  className={s.input}
                  aria-label={isAr ? 'نوع الفرصة' : 'Opportunity type'}
                >
                  {NETWORK_OPPORTUNITY_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {isAr ? type.ar : type.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'نظام التعاقد' : 'Employment type'}</span>
                <select
                  value={draft.employmentType ?? 'full_time'}
                  onChange={event => update('employmentType', event.target.value as CommunityEmploymentType)}
                  className={s.input}
                >
                  {NETWORK_EMPLOYMENT_TYPES.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {isAr ? emp.ar : emp.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'المستوى المطلوب' : 'Experience level'}</span>
                <select
                  value={draft.experienceLevel ?? 'mid'}
                  onChange={event => update('experienceLevel', event.target.value as CommunityExperienceLevel)}
                  className={s.input}
                >
                  {NETWORK_EXPERIENCE_LEVELS.map(lvl => (
                    <option key={lvl.id} value={lvl.id}>
                      {isAr ? lvl.ar : lvl.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'المكان' : 'Location'}</span>
                <input
                  value={draft.location}
                  onChange={event => update('location', event.target.value)}
                  maxLength={NETWORK_JOB_LIMITS.locationMax}
                  className={s.input}
                  aria-label={isAr ? 'مكان الفرصة' : 'Opportunity location'}
                  placeholder={isAr ? 'مثال: الجيزة / موقع البرلس' : 'e.g. Giza / El-Burullus site'}
                />
              </label>

              <label className="min-w-0 sm:col-span-2">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'العنوان' : 'Title'}</span>
                <input
                  value={draft.title}
                  onChange={event => update('title', event.target.value)}
                  maxLength={NETWORK_JOB_LIMITS.titleMax}
                  className={s.input}
                  aria-label={isAr ? 'عنوان الفرصة' : 'Opportunity title'}
                  placeholder={isAr ? 'مفتش PAUT — المستوى II' : 'PAUT inspector — Level II'}
                />
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>
                  {isAr ? 'طرق الفحص (حتى 8)' : 'Methods (up to 8)'}
                </span>
                <input
                  value={draft.methods}
                  onChange={event => update('methods', event.target.value)}
                  className={s.input}
                  aria-label={isAr ? 'طرق الفحص المطلوبة' : 'Required methods'}
                  placeholder="PAUT, TOFD, RT"
                />
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>
                  {isAr ? 'نطاق التعويض / اليومية (اختياري)' : 'Compensation range (optional)'}
                </span>
                <input
                  value={draft.salaryRange ?? ''}
                  onChange={event => update('salaryRange', event.target.value)}
                  maxLength={80}
                  className={s.input}
                  placeholder={isAr ? 'مثال: تنافسي + بدلات موقع' : 'e.g. Competitive + site allowance'}
                />
              </label>

              <label className="min-w-0 sm:col-span-2">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>
                  {isAr ? 'المتطلبات' : 'Requirements'}
                  <span className={`ms-1 font-normal ${s.muted}`}>
                    {isAr ? '(الشهادات · الخبرة · المدة)' : '(certificates · experience · duration)'}
                  </span>
                </span>
                <textarea
                  value={draft.requirements}
                  onChange={event => update('requirements', event.target.value)}
                  maxLength={NETWORK_JOB_LIMITS.requirementsMax}
                  rows={3}
                  className={`${s.input} resize-none`}
                  aria-label={isAr ? 'متطلبات الفرصة' : 'Opportunity requirements'}
                />
              </label>
            </div>

            {previewMethods.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {previewMethods.map(method => (
                  <span key={method} className={s.chip}>
                    {method}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="submit" disabled={publishing || errors.length > 0} className={s.buttonPrimary}>
                {publishing ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {isAr ? 'نشر الفرصة' : 'Publish'}
              </button>
              {touched && errors.length > 0 ? (
                <span role="alert" className="text-[10px] text-rose-400">
                  {isAr ? errors[0].ar : errors[0].en}
                </span>
              ) : null}
              {published ? (
                <span role="status" className="text-[10px] font-bold text-emerald-400">
                  {isAr ? 'نُشرت الفرصة.' : 'Published.'}
                </span>
              ) : null}
            </div>
          </form>
        ) : (
          <div data-testid="network-jobs-gate" className={`${s.card} p-3`}>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
              <Briefcase className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'نشر فرصة' : 'Publish an opportunity'}
            </div>
            <p className={`mt-1 text-[11px] leading-relaxed ${s.subtext}`}>
              {!account?.ready
                ? isAr
                  ? 'جارٍ التحقق من جلسة حسابك…'
                  : 'Checking your account session…'
                : !uid
                  ? isAr
                    ? 'سجّل الدخول لنشر فرصة. التصفح متاح للجميع.'
                    : 'Sign in to publish. Browsing is open to everyone.'
                  : !verified
                    ? isAr
                      ? 'أكّد بريدك أولاً — القواعد ترفض النشر قبله.'
                      : 'Confirm your email first — the rules refuse to publish before it.'
                    : isAr
                      ? 'أنشئ بطاقتك المهنية أولاً: الفرصة تُنشر باسمك وجهة عملك.'
                      : 'Create your card first: an opportunity carries your name and organisation.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {account?.ready && !uid ? (
                <button type="button" onClick={() => onOpenAccount('signin')} className={s.buttonPrimary}>
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </button>
              ) : null}
              {account?.ready && uid && !verified ? (
                <button
                  type="button"
                  onClick={() => onOpenAccount('account')}
                  className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-300"
                >
                  {isAr ? 'فتح حسابي' : 'Open my account'}
                </button>
              ) : null}
              {account?.ready && uid && verified && !card ? (
                <button type="button" onClick={onOpenProfile} className={s.buttonPrimary}>
                  {isAr ? 'إنشاء البطاقة' : 'Create the card'}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* ------------------------------- filters ------------------------------ */}
        <div className={`${s.card} min-w-0 space-y-2 p-2.5`}>
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row">
            <div className={`flex min-w-0 flex-1 items-center gap-1.5 ${s.subCard} px-2 py-1.5`}>
              <Search className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              <input
                value={filter.text}
                onChange={event => setFilter(current => ({ ...current, text: event.target.value }))}
                aria-label={isAr ? 'ابحث في الفرص' : 'Search opportunities'}
                placeholder={isAr ? 'ابحث بالعنوان أو المكان أو المتطلبات…' : 'Search title, location or requirements…'}
                className={`min-w-0 flex-1 bg-transparent text-[11px] focus:outline-none ${s.heading}`}
              />
            </div>
            <select
              value={filter.type}
              onChange={event =>
                setFilter(current => ({ ...current, type: event.target.value as CommunityOpportunityType | 'all' }))
              }
              aria-label={isAr ? 'تصفية بالنوع' : 'Filter by type'}
              className={`${s.input} sm:w-36`}
            >
              <option value="all">{isAr ? 'كل الأنواع' : 'All types'}</option>
              {NETWORK_OPPORTUNITY_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {isAr ? type.ar : type.en}
                </option>
              ))}
            </select>
            <input
              value={filter.method}
              onChange={event => setFilter(current => ({ ...current, method: event.target.value }))}
              aria-label={isAr ? 'تصفية بطريقة الفحص' : 'Filter by method'}
              placeholder={isAr ? 'طريقة: PAUT' : 'Method: PAUT'}
              className={`${s.input} sm:w-32`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter.employmentType}
              onChange={e =>
                setFilter(curr => ({ ...curr, employmentType: e.target.value as CommunityEmploymentType | 'all' }))
              }
              className={`${s.input} sm:w-44`}
            >
              <option value="all">{isAr ? 'كل أنظمة التعاقد' : 'All employment types'}</option>
              {NETWORK_EMPLOYMENT_TYPES.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {isAr ? emp.ar : emp.en}
                </option>
              ))}
            </select>
            {uid ? (
              <button
                type="button"
                onClick={() => setFilter(curr => ({ ...curr, savedOnly: !curr.savedOnly }))}
                className={filter.savedOnly ? s.buttonPrimary : s.buttonSecondary}
              >
                <Bookmark className="h-3 w-3 shrink-0" aria-hidden="true" />
                {isAr ? 'الوظائف المحفوظة' : 'Saved jobs'}
              </button>
            ) : null}
          </div>
        </div>

        {actionError ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
            {isAr ? `تعذّر تنفيذ الإجراء: ${actionError}` : `Action failed: ${actionError}`}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
            {isAr ? `تعذّر تحميل الفرص: ${error}` : `Could not load opportunities: ${error}`}
          </p>
        ) : null}

        {/* -------------------------------- list -------------------------------- */}
        {loading && slow ? (
          <div data-testid="network-jobs-slow" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
            </div>
            <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
              {isAr
                ? 'لم تصل أي فرصة بعد — هذا ليس لوحاً فارغاً، بل اتصال لم يكتمل.'
                : 'No opportunity has arrived yet — this is not an empty board, but an unfinished connection.'}
            </p>
          </div>
        ) : loading ? (
          <p role="status" className={`flex items-center gap-2 p-3 text-[11px] ${s.subtext}`}>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل الفرص…' : 'Loading opportunities…'}
          </p>
        ) : visible.length === 0 ? (
          <div data-testid="network-jobs-empty" className={`${s.subCard} border-dashed p-6 text-center`}>
            <Briefcase className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
            <p className={`mt-2 text-xs font-bold ${s.heading}`}>
              {opportunities.length === 0
                ? isAr
                  ? 'لا توجد فرص منشورة بعد'
                  : 'No published opportunities yet'
                : isAr
                  ? 'لا نتائج مطابقة للفلاتر'
                  : 'No opportunities match the filters'}
            </p>
            <p className={`mx-auto mt-1 max-w-md text-[10px] leading-relaxed ${s.muted}`}>
              {opportunities.length === 0
                ? isAr
                  ? 'أول فرصة حقيقية تظهر هنا بمجرد نشرها من عضو مؤكَّد البريد. لا وظائف وهمية.'
                  : 'The first real opportunity appears here once a confirmed member publishes it. No invented jobs.'
                : isAr
                  ? 'جرّب نوعاً آخر أو طريقة أخرى، أو امسح كلمة البحث.'
                  : 'Try another type or method, or clear the search.'}
            </p>
          </div>
        ) : (
          <ul data-testid="network-jobs-list" className="space-y-2.5">
            {visible.map(opportunity => {
              const type = opportunityTypeById(opportunity.opportunityType);
              const mine = opportunity.authorUid === uid;
              const already = connectedUids.has(opportunity.authorUid);
              const myApp = myAppByOpp.get(opportunity.id);
              const saved = bookmarkedIds.has(opportunity.id);
              const empLabel = NETWORK_EMPLOYMENT_TYPES.find(e => e.id === opportunity.employmentType);
              const lvlLabel = NETWORK_EXPERIENCE_LEVELS.find(l => l.id === opportunity.experienceLevel);
              const applicantsForOpp = mine
                ? employerApps.filter(app => app.opportunityId === opportunity.id)
                : [];

              return (
                <li key={opportunity.id}>
                  <article
                    data-testid="network-job-card"
                    className={`${s.card} min-w-0 p-3 ${opportunity.status === 'closed' ? 'opacity-75' : ''}`}
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {type ? (
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${type.accent}`}>
                              {isAr ? type.ar : type.en}
                            </span>
                          ) : null}
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              opportunity.status === 'open'
                                ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                : 'border border-slate-500/40 bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {opportunity.status === 'open'
                              ? isAr
                                ? 'مفتوحة'
                                : 'Open'
                              : isAr
                                ? 'مغلقة'
                                : 'Closed'}
                          </span>
                          {empLabel ? <span className={s.chip}>{isAr ? empLabel.ar : empLabel.en}</span> : null}
                          {lvlLabel ? <span className={s.chip}>{isAr ? lvlLabel.ar : lvlLabel.en}</span> : null}
                          {mine ? (
                            <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-300">
                              {isAr ? 'فرصتك' : 'Yours'}
                            </span>
                          ) : null}
                        </div>
                        <h3 className={`mt-1 text-sm font-bold leading-snug ${s.heading}`}>{opportunity.title}</h3>
                        <p className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] ${s.subtext}`}>
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                            {opportunity.location}
                          </span>
                          <span className="min-w-0 truncate">
                            {opportunity.authorOrg} · {relativeDate(opportunity.createdAt, isAr)}
                          </span>
                          {opportunity.salaryRange ? (
                            <span className="font-bold text-emerald-400">{opportunity.salaryRange}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(opportunity.methods ?? []).map(method => (
                        <span key={method} className={s.chip}>
                          {method}
                        </span>
                      ))}
                    </div>

                    <p className={`mt-1.5 whitespace-pre-wrap text-[10px] leading-relaxed ${s.subtext}`}>
                      {opportunity.requirements}
                    </p>

                    <div className={`mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2 ${s.divider}`}>
                      {mine ? (
                        <button
                          type="button"
                          onClick={() => void toggleStatus(opportunity)}
                          disabled={closing === opportunity.id}
                          className={s.buttonSecondary}
                        >
                          {closing === opportunity.id ? (
                            <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
                          ) : null}
                          {opportunity.status === 'open'
                            ? isAr
                              ? 'إغلاق الفرصة'
                              : 'Close it'
                            : isAr
                              ? 'إعادة فتحها'
                              : 'Reopen it'}
                        </button>
                      ) : (
                        <>
                          {already ? (
                            <span
                              data-testid="network-job-connected"
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
                            >
                              <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                              {isAr ? 'الناشر في شبكتك' : 'Publisher is in your network'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void contactPublisher(opportunity)}
                              disabled={!uid || !verified || !card || connecting === opportunity.id}
                              aria-disabled={!uid || !verified || !card || connecting === opportunity.id}
                              title={
                                !uid
                                  ? isAr
                                    ? 'سجّل الدخول للتواصل مع الناشر'
                                    : 'Sign in to contact the publisher'
                                  : !verified
                                    ? isAr
                                      ? 'أكّد بريدك أولاً'
                                      : 'Confirm your email first'
                                    : !card
                                      ? isAr
                                        ? 'أنشئ بطاقتك المهنية أولاً'
                                        : 'Create your card first'
                                      : isAr
                                        ? 'إضافة الناشر إلى شبكتك كي يصل لملفك'
                                        : 'Add the publisher to your network'
                              }
                              data-testid="network-job-contact"
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${
                                uid && verified && card
                                  ? 'border-violet-400/50 bg-violet-500/10 text-violet-300 cursor-pointer hover:border-violet-300'
                                  : `${s.buttonSecondary} opacity-60 cursor-not-allowed`
                              }`}
                            >
                              {connecting === opportunity.id ? (
                                <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
                              ) : (
                                <UserPlus className="h-3 w-3 shrink-0" aria-hidden="true" />
                              )}
                              {isAr ? 'تواصل مع الناشر' : 'Contact the publisher'}
                            </button>
                          )}

                          {myApp ? (
                            <span
                              data-testid="network-job-applied"
                              className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300"
                            >
                              <FileCheck2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                              {appStatusLabel(myApp.status, isAr)}
                            </span>
                          ) : opportunity.status === 'open' ? (
                            <button
                              type="button"
                              data-testid="network-job-apply"
                              disabled={!uid || !verified || !card}
                              onClick={() =>
                                setApplyingOppId(curr => (curr === opportunity.id ? null : opportunity.id))
                              }
                              className={s.buttonPrimary}
                            >
                              <Send className="h-3 w-3 shrink-0" aria-hidden="true" />
                              {isAr ? 'تقديم رسمي للفرصة' : 'Apply now'}
                            </button>
                          ) : null}
                        </>
                      )}

                      {uid ? (
                        <button
                          type="button"
                          onClick={() => void toggleSaveJob(opportunity)}
                          aria-pressed={saved}
                          className={saved ? s.buttonPrimary : s.buttonSecondary}
                        >
                          <Bookmark className={`h-3 w-3 shrink-0 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
                          {saved ? (isAr ? 'محفوظة' : 'Saved') : isAr ? 'حفظ' : 'Save'}
                        </button>
                      ) : null}
                    </div>

                    {applyingOppId === opportunity.id ? (
                      <form
                        onSubmit={e => void submitApplication(e, opportunity)}
                        className={`mt-2 space-y-1.5 ${s.subCard} p-2.5`}
                      >
                        <textarea
                          value={coverNote}
                          onChange={e => setCoverNote(e.target.value)}
                          rows={2}
                          required
                          placeholder={isAr ? 'نبذة تعريفية عن ملاءمتك لهذه الفرصة (5 أحرف على الأقل)…' : 'Cover note & key qualifications (min 5 chars)…'}
                          className={`${s.input} resize-none`}
                        />
                        <input
                          value={cvSummary}
                          onChange={e => setCvSummary(e.target.value)}
                          placeholder={isAr ? 'ملخص السيرة/الشهادات المرفقة (اختياري)' : 'Optional CV / certifications highlight'}
                          className={s.input}
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <button type="submit" disabled={submittingApp || coverNote.trim().length < 5} className={s.buttonPrimary}>
                            {isAr ? 'إرسال الطلب' : 'Submit application'}
                          </button>
                          <button type="button" onClick={() => setApplyingOppId(null)} className={s.buttonSecondary}>
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {mine && applicantsForOpp.length > 0 ? (
                      <div className={`mt-2 space-y-1.5 border-t pt-2 ${s.divider}`}>
                        <p className={`text-[10px] font-bold ${s.heading}`}>
                          {isAr ? `المتقدمون (${applicantsForOpp.length})` : `Applicants (${applicantsForOpp.length})`}
                        </p>
                        {applicantsForOpp.map(app => (
                          <div key={app.id} className={`${s.subCard} flex flex-wrap items-center justify-between gap-2 p-2 text-[10px]`}>
                            <div className="min-w-0 flex-1">
                              <p className={`font-bold ${s.heading}`}>{app.applicantName}</p>
                              <p className={s.subtext}>{app.coverNote}</p>
                            </div>
                            <select
                              value={app.status}
                              onChange={e =>
                                void updateApplicantStatus(app.id, e.target.value as CommunityJobApplicationStatus)
                              }
                              className={`${s.input} sm:w-36`}
                            >
                              <option value="submitted">{isAr ? 'مُرسَل' : 'Submitted'}</option>
                              <option value="shortlisted">{isAr ? 'قائمة مختصرة' : 'Shortlisted'}</option>
                              <option value="contacted">{isAr ? 'تم التواصل' : 'Contacted'}</option>
                              <option value="rejected">{isAr ? 'معتذَر' : 'Declined'}</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ------------------------------ right rail ----------------------------- */}
      <aside className="min-w-0 space-y-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[10px] leading-relaxed text-emerald-300">
          <div className="mb-1 text-[11px] font-bold text-emerald-200">
            {isAr ? 'تقديم مهني وتتبع للحالة' : 'Live Applications & Tracking'}
          </div>
          {isAr
            ? 'يمكنك التقديم رسمياً على الفرص المفتوحة مع إرفاق نبذة خبرتك، أو التواصل المهني المباشر مع الناشر، ومتابعة حالة طلبك لحظياً.'
            : 'Apply directly to open opportunities with your professional summary, or connect with the publisher, and track status updates live.'}
        </div>
        <div className={`${s.card} p-3 text-[10px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'كل الفرص المعلنة هنا عامة وشفافة لتمكين جميع المهندسين المعتمدين من التنافس المهني.'
            : 'All published career opportunities here are transparent and visible to confirmed network engineers.'}
        </div>
        <div className={`${s.card} p-3 text-[10px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'الاستفسارات التعاقدية التجارية والوثائق السرية للعملاء تبقى منفصلة في بوابة العملاء المخصصة لها.'
            : 'Commercial procurement workflows remain strictly separated in the dedicated Client Portal.'}
        </div>
      </aside>
    </div>
  );
};

export default NetworkJobsSection;
