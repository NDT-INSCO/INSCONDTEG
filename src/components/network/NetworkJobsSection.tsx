import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Check,
  CircleAlert,
  Loader2,
  MapPin,
  Search,
  Send,
  UserPlus,
} from 'lucide-react';
import type {
  CommunityConnection,
  CommunityOpportunity,
  CommunityOpportunityType,
  CommunityWorkspaceProfile,
} from '../../client/types';
import type { Language } from '../../types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import {
  EMPTY_JOB_DRAFT,
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

const fieldClass =
  'w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none';

const relativeDate = (value: unknown, isAr: boolean): string => {
  const millis =
    value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function'
      ? (value as { toMillis: () => number }).toMillis()
      : 0;
  if (!millis) return isAr ? 'الآن' : 'now';
  return new Date(millis).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');
};

/**
 * `#network/jobs` — real opportunities.
 *
 * Reading, publishing and closing use `community_opportunities` and its service.
 * Two honest limits are surfaced instead of hidden:
 *   - there is no applications collection yet, so the action is «تواصل مع الناشر»
 *     (a real connection), not a fake "Apply" button;
 *   - the rules accept only `public` visibility, so no private option is offered.
 */
export const NetworkJobsSection: React.FC<NetworkJobsSectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';

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

  const [filter, setFilter] = useState<{ text: string; type: CommunityOpportunityType | 'all'; method: string }>({
    text: '',
    type: 'all',
    method: '',
  });

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;
  const canPublish = Boolean(uid) && verified && Boolean(card);

  const connectedUids = useMemo(() => {
    const set = new Set<string>();
    for (const connection of connections) if (connection.status === 'connected') set.add(connection.toUid);
    return set;
  }, [connections]);

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
    if (!uid || !serviceReady) return;
    let active = true;
    let stopCard: (() => void) | undefined;
    let stopConnections: (() => void) | undefined;
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stopCard = api.subscribeMyCommunityWorkspace(
        uid,
        next => {
          if (active) setCard(next);
        },
        () => {}
      );
      stopConnections = api.subscribeMyConnections(
        uid,
        next => {
          if (active) setConnections(next);
        },
        () => {}
      );
    });
    return () => {
      active = false;
      stopCard?.();
      stopConnections?.();
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

  const visible = useMemo(
    () => opportunities.filter(opportunity => matchesJobFilter(opportunity, filter)),
    [opportunities, filter]
  );

  if (!serviceReady) {
    return (
      <div data-testid="network-jobs-unavailable" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          {isAr ? 'لوحة الفرص غير متاحة في هذه النسخة' : 'The jobs board is not available in this build'}
        </div>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400">
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
          <form onSubmit={publish} className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-white">
              <Briefcase className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              {isAr ? 'نشر فرصة' : 'Publish an opportunity'}
              <span className="ms-auto text-[10px] font-normal text-slate-500">
                {isAr ? `باسم ${card?.displayName} · ${card?.organizationName}` : `as ${card?.displayName} · ${card?.organizationName}`}
              </span>
            </div>

            <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'النوع' : 'Type'}</span>
                <select
                  value={draft.type}
                  onChange={event => update('type', event.target.value as CommunityOpportunityType)}
                  className={fieldClass}
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
                <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'المكان' : 'Location'}</span>
                <input
                  value={draft.location}
                  onChange={event => update('location', event.target.value)}
                  maxLength={NETWORK_JOB_LIMITS.locationMax}
                  className={fieldClass}
                  aria-label={isAr ? 'مكان الفرصة' : 'Opportunity location'}
                  placeholder={isAr ? 'مثال: الجيزة / موقع البرلس' : 'e.g. Giza / El-Burullus site'}
                />
              </label>

              <label className="min-w-0 sm:col-span-2">
                <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'العنوان' : 'Title'}</span>
                <input
                  value={draft.title}
                  onChange={event => update('title', event.target.value)}
                  maxLength={NETWORK_JOB_LIMITS.titleMax}
                  className={fieldClass}
                  aria-label={isAr ? 'عنوان الفرصة' : 'Opportunity title'}
                  placeholder={isAr ? 'مفتش PAUT — المستوى II' : 'PAUT inspector — Level II'}
                />
              </label>

              <label className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400">
                  {isAr ? 'طرق الفحص (حتى 8)' : 'Methods (up to 8)'}
                </span>
                <input
                  value={draft.methods}
                  onChange={event => update('methods', event.target.value)}
                  className={fieldClass}
                  aria-label={isAr ? 'طرق الفحص المطلوبة' : 'Required methods'}
                  placeholder="PAUT, TOFD, RT"
                />
              </label>

              <label className="min-w-0 sm:col-span-2">
                <span className="block text-[10px] font-bold text-slate-400">
                  {isAr ? 'المتطلبات' : 'Requirements'}
                  <span className="ms-1 font-normal text-slate-500">
                    {isAr ? '(الشهادات · الخبرة · المدة)' : '(certificates · experience · duration)'}
                  </span>
                </span>
                <textarea
                  value={draft.requirements}
                  onChange={event => update('requirements', event.target.value)}
                  maxLength={NETWORK_JOB_LIMITS.requirementsMax}
                  rows={3}
                  className={`${fieldClass} resize-none`}
                  aria-label={isAr ? 'متطلبات الفرصة' : 'Opportunity requirements'}
                />
              </label>
            </div>

            {previewMethods.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {previewMethods.map(method => (
                  <span key={method} className="rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400">
                    {method}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={publishing || errors.length > 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {isAr ? 'نشر الفرصة' : 'Publish'}
              </button>
              {touched && errors.length > 0 ? (
                <span role="alert" className="text-[10px] text-rose-300">
                  {isAr ? errors[0].ar : errors[0].en}
                </span>
              ) : null}
              {published ? (
                <span role="status" className="text-[10px] font-bold text-emerald-300">
                  {isAr ? 'نُشرت الفرصة.' : 'Published.'}
                </span>
              ) : null}
            </div>
          </form>
        ) : (
          <div data-testid="network-jobs-gate" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Briefcase className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              {isAr ? 'نشر فرصة' : 'Publish an opportunity'}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
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
                <button
                  type="button"
                  onClick={() => onOpenAccount('signin')}
                  className="rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </button>
              ) : null}
              {account?.ready && uid && !verified ? (
                <button
                  type="button"
                  onClick={() => onOpenAccount('account')}
                  className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300"
                >
                  {isAr ? 'فتح حسابي' : 'Open my account'}
                </button>
              ) : null}
              {account?.ready && uid && verified && !card ? (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
                >
                  {isAr ? 'إنشاء البطاقة' : 'Create the card'}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* ------------------------------- filters ------------------------------ */}
        <div className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-2.5">
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
              <input
                value={filter.text}
                onChange={event => setFilter(current => ({ ...current, text: event.target.value }))}
                aria-label={isAr ? 'ابحث في الفرص' : 'Search opportunities'}
                placeholder={isAr ? 'ابحث بالعنوان أو المكان أو المتطلبات…' : 'Search title, location or requirements…'}
                className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
            <select
              value={filter.type}
              onChange={event =>
                setFilter(current => ({ ...current, type: event.target.value as CommunityOpportunityType | 'all' }))
              }
              aria-label={isAr ? 'تصفية بالنوع' : 'Filter by type'}
              className="min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200"
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
              className="w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 sm:w-36"
            />
          </div>
        </div>

        {actionError ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
            {isAr ? `تعذّر تنفيذ الإجراء: ${actionError}` : `Action failed: ${actionError}`}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
            {isAr ? `تعذّر تحميل الفرص: ${error}` : `Could not load opportunities: ${error}`}
          </p>
        ) : null}

        {/* -------------------------------- list -------------------------------- */}
        {loading && slow ? (
          <div data-testid="network-jobs-slow" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-100/90">
              {isAr
                ? 'لم تصل أي فرصة بعد — هذا ليس لوحاً فارغاً، بل اتصال لم يكتمل.'
                : 'No opportunity has arrived yet — this is not an empty board, but an unfinished connection.'}
            </p>
          </div>
        ) : loading ? (
          <p role="status" className="flex items-center gap-2 p-3 text-[11px] text-slate-400">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل الفرص…' : 'Loading opportunities…'}
          </p>
        ) : visible.length === 0 ? (
          <div
            data-testid="network-jobs-empty"
            className="rounded-xl border border-dashed border-[#2a2a4d] bg-[#0b0b18] p-6 text-center"
          >
            <Briefcase className="mx-auto h-6 w-6 text-slate-600" aria-hidden="true" />
            <p className="mt-2 text-xs font-bold text-slate-300">
              {opportunities.length === 0
                ? isAr
                  ? 'لا توجد فرص منشورة بعد'
                  : 'No published opportunities yet'
                : isAr
                  ? 'لا نتائج مطابقة للفلاتر'
                  : 'No opportunities match the filters'}
            </p>
            <p className="mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-slate-500">
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
              return (
                <li key={opportunity.id}>
                  <article
                    data-testid="network-job-card"
                    className={`min-w-0 rounded-xl border bg-[#0f0f22] p-3 ${
                      opportunity.status === 'closed' ? 'border-[#232345] opacity-75' : 'border-[#232345]'
                    }`}
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
                                ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                : 'border border-slate-600 bg-slate-700/30 text-slate-300'
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
                          {mine ? (
                            <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-200">
                              {isAr ? 'فرصتك' : 'Yours'}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-1 text-sm font-bold leading-snug text-white">{opportunity.title}</h3>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                            {opportunity.location}
                          </span>
                          <span className="min-w-0 truncate">
                            {opportunity.authorOrg} · {relativeDate(opportunity.createdAt, isAr)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(opportunity.methods ?? []).map(method => (
                        <span key={method} className="rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300">
                          {method}
                        </span>
                      ))}
                    </div>

                    <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400">
                      {opportunity.requirements}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#1d1d38] pt-2">
                      {mine ? (
                        <button
                          type="button"
                          onClick={() => void toggleStatus(opportunity)}
                          disabled={closing === opportunity.id}
                          className="inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                      ) : already ? (
                        <span
                          data-testid="network-job-connected"
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200"
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
                                    ? 'إضافة الناشر إلى شبكتك كي يصلا لملفك'
                                    : 'Add the publisher to your network so they reach your profile'
                          }
                          data-testid="network-job-contact"
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${
                            uid && verified && card
                              ? 'border-violet-400/50 bg-violet-500/10 text-violet-200 cursor-pointer hover:border-violet-300'
                              : 'border-[#2a2a4d] bg-[#14142a] text-slate-500 opacity-70 cursor-not-allowed'
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
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ------------------------------ right rail ----------------------------- */}
      <aside className="min-w-0 space-y-3">
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-[10px] leading-relaxed text-sky-100">
          <div className="mb-1 text-[11px] font-bold text-sky-200">
            {isAr ? 'حدود معلنة، لا مخفية' : 'Stated limits, not hidden ones'}
          </div>
          {isAr
            ? 'لا يوجد تقديم رسمي بعد (لا سيرة تُرفع ولا حالة طلب)؛ لذلك الزر هو «تواصل مع الناشر» — اتصال مهني حقيقي. نظام التقديم يأتي في مرحلته مع مجموعة طلبات وقواعدها.'
            : 'There is no formal application yet (no CV upload, no application state), so the action is “Contact the publisher” — a real professional connection. Applications arrive in their own phase with a dedicated collection and rules.'}
        </div>
        <div className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3 text-[10px] leading-relaxed text-slate-400">
          {isAr
            ? 'كل الفرص عامة: القواعد لا تقبل نطاقاً آخر اليوم، فلا نعرض خياراً لا نستطيع الوفاء به.'
            : 'Every opportunity is public: the rules accept no other visibility today, so no option we cannot honour is offered.'}
        </div>
        <div className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3 text-[10px] leading-relaxed text-slate-400">
          {isAr
            ? 'طلب عرض سعر (RFQ) يبقى في بوابة العملاء — لا يُرسل ولا يُستقبل هنا.'
            : 'Quote requests (RFQ) stay in the client portal — they are neither sent nor received here.'}
        </div>
      </aside>
    </div>
  );
};

export default NetworkJobsSection;
