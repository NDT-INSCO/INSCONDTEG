import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bookmark,
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  Flag,
  GraduationCap,
  Heart,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  PenLine,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  UserRound,
} from 'lucide-react';
import type { Language } from '../../types';
import type { User } from 'firebase/auth';
import type {
  CommunityPollVote,
  CommunityPost,
  CommunityPostAnswer,
  CommunityPostComment,
  CommunityPostFormat,
  CommunityReactionType,
  CommunityWorkspaceProfile,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { AiGeneratedBadge } from './NetworkBadges';
import { runCommunityAssist } from '../../ai/agentsClient';
import {
  ACADEMY_LINKABLE_COURSES,
  NDT_METHOD_TAXONOMY,
  detectDuplicatePostRisk,
  filterAndRankPosts,
  type FeedTabCategory,
} from '../../network/networkTaxonomy';
import {
  EMPTY_POST_DRAFT,
  NETWORK_METHODS,
  NETWORK_POST_KINDS,
  NETWORK_POST_LIMITS,
  displayKindForStored,
  postExcerpt,
  toPostInput,
  validateCommentDraft,
  validatePostDraft,
  type NetworkPostDraft,
} from '../../network/networkFeedForm';

interface NetworkFeedSectionProps {
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenAcademy?: () => void;
  /** See NetworkDirectorySection: no endless spinner on a blocked connection. */
  slowAfterMs?: number;
}

const FEED_TABS: Array<{ id: FeedTabCategory; ar: string; en: string }> = [
  { id: 'latest', ar: 'الأحدث', en: 'Latest' },
  { id: 'for_you', ar: 'لك', en: 'For You' },
  { id: 'following', ar: 'المتابَعون', en: 'Following' },
  { id: 'technical', ar: 'نقاشات وحالات', en: 'Technical Q&A' },
  { id: 'companies', ar: 'المؤسسات', en: 'Companies' },
  { id: 'academy', ar: 'الأكاديمية', en: 'Academy' },
  { id: 'groups', ar: 'المجموعات', en: 'Groups' },
];

const POST_FORMATS: Array<{ id: CommunityPostFormat; ar: string; en: string }> = [
  { id: 'standard', ar: 'منشور قياسي', en: 'Standard Post' },
  { id: 'question', ar: 'سؤال فني (Q&A)', en: 'Technical Question (Q&A)' },
  { id: 'case_study', ar: 'دراسة حالة ميدانية', en: 'Field Case Study' },
  { id: 'poll', ar: 'استطلاع رأي هندسي', en: 'Engineering Poll' },
  { id: 'article', ar: 'مقال تقني مطوّل', en: 'Technical Article' },
  { id: 'academy_share', ar: 'مشاركة من الأكاديمية', en: 'Academy Share' },
];

function relativeTime(value: unknown, isAr: boolean): string {
  const millis =
    value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function'
      ? (value as { toMillis: () => number }).toMillis()
      : 0;
  if (!millis) return isAr ? 'الآن' : 'just now';
  const minutes = Math.floor((Date.now() - millis) / 60000);
  if (minutes < 1) return isAr ? 'الآن' : 'just now';
  if (minutes < 60) return isAr ? `قبل ${minutes} دقيقة` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isAr ? `قبل ${hours} ساعة` : `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return isAr ? `قبل ${days} يوم` : `${days} d ago`;
  return new Date(millis).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');
}

/**
 * `#network/feed` — multi-format live engineering feed, Q&A answers, polls, reactions, and Community AI.
 */
export const NetworkFeedSection: React.FC<NetworkFeedSectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  onOpenAcademy,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NetworkPostDraft>(EMPTY_POST_DRAFT);
  const [touched, setTouched] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [openAnswers, setOpenAnswers] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [myReactions, setMyReactions] = useState<Record<string, CommunityReactionType>>({});
  const [reacting, setReacting] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);

  const [feedTab, setFeedTab] = useState<FeedTabCategory>('latest');
  const [searchText, setSearchText] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const [followedUids, setFollowedUids] = useState<Set<string>>(new Set());
  const [followedCompanyIds, setFollowedCompanyIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

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
      if (api.isVerifiedAdminUser && account?.user) {
        setIsAdmin(api.isVerifiedAdminUser(account.user));
      }
      stop = api.subscribeCommunityPosts(
        false,
        next => {
          if (!active) return;
          setPosts(next);
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
  }, [serviceReady, slowAfterMs, account?.user]);

  useEffect(() => {
    setCard(null);
    if (!uid || !serviceReady) return;
    let active = true;
    let stopCard: (() => void) | undefined;
    let stopFollows: (() => void) | undefined;
    let stopBookmarks: (() => void) | undefined;
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stopCard = api.subscribeMyCommunityWorkspace(
        uid,
        next => {
          if (active) setCard(next);
        },
        () => {}
      );
    });
    void import('../../client/networkPlatformService')
      .then(api => {
        if (!active) return;
        if (api.subscribeMyFollows) {
          stopFollows = api.subscribeMyFollows(uid, rows => {
            if (!active) return;
            setFollowedUids(new Set(rows.filter(r => r.targetType === 'member').map(r => r.targetId)));
            setFollowedCompanyIds(new Set(rows.filter(r => r.targetType === 'company').map(r => r.targetId)));
          });
        }
        if (api.subscribeMyBookmarks) {
          stopBookmarks = api.subscribeMyBookmarks(uid, rows => {
            if (!active) return;
            setBookmarkedIds(new Set(rows.map(r => r.postId)));
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      stopCard?.();
      stopFollows?.();
      stopBookmarks?.();
    };
  }, [uid, serviceReady]);

  const errors = useMemo(() => validatePostDraft(draft), [draft]);
  const canPublish = Boolean(uid) && verified && Boolean(card);
  const ownRecentPosts = useMemo(
    () => (uid ? posts.filter(p => p.authorUid === uid).slice(0, 10) : []),
    [posts, uid]
  );
  const duplicateRisk = useMemo(
    () => detectDuplicatePostRisk(draft.title, draft.body, ownRecentPosts),
    [draft.body, draft.title, ownRecentPosts]
  );

  const visiblePosts = useMemo(
    () =>
      filterAndRankPosts(posts, {
        tab: feedTab,
        followedUids,
        followedCompanyIds,
        preferredMethod: card?.specialtyTrades?.split(/[·,\s]+/)[0],
        methodFilter,
        searchText,
      }),
    [posts, feedTab, followedUids, followedCompanyIds, card?.specialtyTrades, methodFilter, searchText]
  );

  const update = useCallback(<K extends keyof NetworkPostDraft>(key: K, value: NetworkPostDraft[K]) => {
    setTouched(true);
    setPublished(false);
    setPublishError(null);
    setDraft(current => ({ ...current, [key]: value }));
  }, []);

  const runAiAssist = useCallback(
    async (action: 'draft_from_topic' | 'enhance_post' | 'code_check') => {
      const seed = draft.body.trim() || draft.title.trim();
      if (seed.length < 3 || aiLoading) return;
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await runCommunityAssist({
          action,
          language: isAr ? 'ar' : 'en',
          ndtMethod: draft.method,
          title: draft.title.trim() || undefined,
          body: seed,
        });
        const generated = (res.body ?? res.reply ?? '').trim();
        setDraft(current => ({
          ...current,
          title: !current.title.trim() && res.title ? res.title.slice(0, NETWORK_POST_LIMITS.titleMax) : current.title,
          body:
            action === 'code_check'
              ? `${current.body.trim()}\n\n---\n${generated}`.slice(0, NETWORK_POST_LIMITS.bodyMax)
              : generated.slice(0, NETWORK_POST_LIMITS.bodyMax),
          aiGenerated: true,
        }));
        setTouched(true);
      } catch (err) {
        setAiError(err instanceof Error ? err.message : String(err));
      } finally {
        setAiLoading(false);
      }
    },
    [aiLoading, draft.body, draft.method, draft.title, isAr]
  );

  const publish = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setTouched(true);
      const user = account?.user;
      if (!user || !card || errors.length > 0) return;
      setPublishing(true);
      setPublishError(null);
      try {
        const api = await import('../../client/firestoreClientService');
        const nextKind =
          draft.postFormat === 'question'
            ? 'technical'
            : draft.postFormat === 'case_study'
              ? 'case_study'
              : draft.kind;
        await api.createCommunityPost(
          user,
          toPostInput(
            { ...draft, kind: nextKind },
            {
              displayName: card.displayName,
              organizationName: card.organizationName,
              headline: card.headline,
              companyCode: card.companyCode,
            }
          )
        );
        setDraft({ ...EMPTY_POST_DRAFT, method: draft.method, kind: draft.kind });
        setTouched(false);
        setShowAdvancedFields(false);
        setPublished(true);
      } catch (publishFailure) {
        setPublishError(publishFailure instanceof Error ? publishFailure.message : String(publishFailure));
      } finally {
        setPublishing(false);
      }
    },
    [account?.user, card, draft, errors.length]
  );

  const toggleReaction = useCallback(
    async (postId: string, type: CommunityReactionType) => {
      const user = account?.user;
      if (!user || reacting) return;
      setReacting(postId);
      setReactionError(null);
      try {
        const api = await import('../../client/firestoreClientService');
        const mine = await api.getCommunityPostReaction(postId, user.uid);
        await api.setCommunityPostReaction(user, postId, type, mine);
        setMyReactions(current => {
          const next = { ...current };
          if (mine && mine.reactionType === type) delete next[postId];
          else next[postId] = type;
          return next;
        });
      } catch (failure) {
        setReactionError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setReacting(null);
      }
    },
    [account?.user, reacting]
  );

  const handleToggleBookmark = useCallback(
    async (post: CommunityPost) => {
      const user = account?.user;
      if (!user) return;
      try {
        const api = await import('../../client/networkPlatformService');
        const added = await api.toggleBookmark(user, post.id, post.title);
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          if (added) next.add(post.id);
          else next.delete(post.id);
          return next;
        });
      } catch {
        /* ignore bookmark failures in offline builds */
      }
    },
    [account?.user]
  );

  const copyLink = useCallback(async (postId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#network/feed/${postId}`;
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(postId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  if (!serviceReady) {
    return (
      <div data-testid="network-feed-unavailable" className={`${s.card} p-4`}>
        <div className={`flex items-center gap-2 text-sm font-bold ${s.heading}`}>
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'المنشورات غير متاحة في هذه النسخة' : 'The feed is not available in this build'}
        </div>
        <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'لم يُهيَّأ اتصال Firebase، لذلك لا توجد منشورات حقيقية — ولن نعرض منشورات تجريبية بدلاً منها.'
            : 'Firebase is not initialised, so there are no real posts — and we will not show trial posts instead.'}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="network-feed-live" className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
      <div className="min-w-0 space-y-3">
        {/* ------------------------------ composer ----------------------------- */}
        {canPublish ? (
          <form onSubmit={publish} className={`${s.card} min-w-0 p-3`}>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <PenLine className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              <span className={s.heading}>{isAr ? 'منشور جديد' : 'New post'}</span>
              <button
                type="button"
                onClick={() => setShowAdvancedFields(v => !v)}
                className={`ms-2 ${s.buttonSecondary}`}
              >
                {showAdvancedFields
                  ? isAr ? 'إخفاء الخيارات الإضافية' : 'Hide extras'
                  : isAr ? 'وسائط / أكاديمية / استطلاع' : 'Media / Academy / Poll'}
              </button>
              <span className={`ms-auto text-[10px] font-normal ${s.muted}`}>
                {isAr ? `نشر باسم ${card?.displayName}` : `Posting as ${card?.displayName}`}
              </span>
            </div>

            <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-3">
              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'نوع المنشور' : 'Post type'}</span>
                <select
                  value={draft.kind}
                  onChange={event => update('kind', event.target.value)}
                  className={s.input}
                  aria-label={isAr ? 'نوع المنشور' : 'Post type'}
                >
                  {NETWORK_POST_KINDS.map(kind => (
                    <option key={kind.id} value={kind.id}>
                      {isAr ? kind.ar : kind.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'صيغة التفاعل' : 'Format'}</span>
                <select
                  value={draft.postFormat ?? 'standard'}
                  onChange={event => {
                    const fmt = event.target.value as CommunityPostFormat;
                    update('postFormat', fmt);
                    if (fmt === 'poll' || fmt === 'academy_share') setShowAdvancedFields(true);
                  }}
                  className={s.input}
                  aria-label={isAr ? 'صيغة المنشور' : 'Post format'}
                >
                  {POST_FORMATS.map(fmt => (
                    <option key={fmt.id} value={fmt.id}>
                      {isAr ? fmt.ar : fmt.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'طريقة الفحص' : 'NDT method'}</span>
                <select
                  value={draft.method}
                  onChange={event => update('method', event.target.value as NetworkPostDraft['method'])}
                  className={s.input}
                  aria-label={isAr ? 'طريقة الفحص' : 'NDT method'}
                >
                  {NETWORK_METHODS.map(method => (
                    <option key={method.id} value={method.id}>
                      {isAr ? method.ar : method.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 sm:col-span-3">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'العنوان' : 'Title'}</span>
                <input
                  value={draft.title}
                  onChange={event => update('title', event.target.value)}
                  maxLength={NETWORK_POST_LIMITS.titleMax}
                  className={s.input}
                  aria-label={isAr ? 'عنوان المنشور' : 'Post title'}
                  placeholder={isAr ? 'مثال: قراءة إشارة على شطف 30° في P91' : 'e.g. reading an indication on a 30° bevel in P91'}
                />
              </label>

              <label className="min-w-0 sm:col-span-3">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>
                  {isAr ? 'النص' : 'Body'}
                  <span className={`ms-1 font-normal ${s.muted}`}>
                    {isAr ? '(القطر، السماكة، الزاوية، الكود المرجعي…)' : '(diameter, thickness, angle, reference code…)'}
                  </span>
                </span>
                <textarea
                  value={draft.body}
                  onChange={event => update('body', event.target.value)}
                  maxLength={NETWORK_POST_LIMITS.bodyMax}
                  rows={4}
                  className={`${s.input} resize-none`}
                  aria-label={isAr ? 'نص المنشور' : 'Post body'}
                />
              </label>

              {showAdvancedFields || draft.postFormat === 'poll' ? (
                <>
                  {draft.postFormat === 'poll' ? (
                    <label className="min-w-0 sm:col-span-3">
                      <span className={`block text-[10px] font-bold ${s.subtext}`}>
                        {isAr ? 'خيارات الاستطلاع (خيار في كل سطر، 2 إلى 5 خيارات)' : 'Poll options (one per line, 2 to 5 options)'}
                      </span>
                      <textarea
                        value={draft.pollOptionsText ?? ''}
                        onChange={e => update('pollOptionsText', e.target.value)}
                        rows={3}
                        className={`${s.input} resize-none`}
                        placeholder={isAr ? 'ASME V Art. 4\nISO 17640\nAWS D1.1' : 'ASME V Art. 4\nISO 17640\nAWS D1.1'}
                      />
                    </label>
                  ) : null}

                  <label className="min-w-0">
                    <span className={`block text-[10px] font-bold ${s.subtext}`}>
                      {isAr ? 'رابط مرجع / ملف (HTTPS)' : 'Reference / PDF Link (HTTPS)'}
                    </span>
                    <input
                      value={draft.externalLink ?? ''}
                      onChange={e => update('externalLink', e.target.value)}
                      className={s.input}
                      placeholder="https://..."
                    />
                  </label>

                  <label className="min-w-0">
                    <span className={`block text-[10px] font-bold ${s.subtext}`}>
                      {isAr ? 'رابط صورة فحص أو مخطط (HTTPS)' : 'Inspection Media Image URL'}
                    </span>
                    <input
                      value={draft.mediaUrl ?? ''}
                      onChange={e => update('mediaUrl', e.target.value)}
                      className={s.input}
                      placeholder="https://..."
                    />
                  </label>

                  <label className="min-w-0">
                    <span className={`block text-[10px] font-bold ${s.subtext}`}>
                      {isAr ? 'ربط مقرر من الأكاديمية' : 'Attach Academy Course'}
                    </span>
                    <select
                      value={draft.academyCourseId ?? ''}
                      onChange={e => {
                        const chosen = ACADEMY_LINKABLE_COURSES.find(c => c.id === e.target.value);
                        update('academyCourseId', e.target.value);
                        update('academyLessonTitle', chosen ? (isAr ? chosen.ar : chosen.en) : '');
                      }}
                      className={s.input}
                    >
                      <option value="">{isAr ? 'بدون ربط' : 'None'}</option>
                      {ACADEMY_LINKABLE_COURSES.map(c => (
                        <option key={c.id} value={c.id}>
                          {isAr ? c.ar : c.en}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              <label className="min-w-0 sm:col-span-2">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>
                  {isAr ? 'وسوم (حتى 6)' : 'Tags (up to 6)'}
                </span>
                <input
                  value={draft.tags}
                  onChange={event => update('tags', event.target.value)}
                  className={s.input}
                  aria-label={isAr ? 'وسوم المنشور' : 'Post tags'}
                  placeholder="ASME-V · TOFD · P91"
                />
              </label>

              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'من يرى المنشور' : 'Who can see it'}</span>
                <select
                  value={draft.visibility}
                  onChange={event => update('visibility', event.target.value as NetworkPostDraft['visibility'])}
                  className={s.input}
                  aria-label={isAr ? 'نطاق ظهور المنشور' : 'Post visibility'}
                >
                  <option value="public">{isAr ? 'عام' : 'Public'}</option>
                  <option value="members_only">{isAr ? 'الأعضاء فقط' : 'Members only'}</option>
                </select>
              </label>
            </div>

            {/* Community AI Toolbar */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={aiLoading || (draft.body.trim().length < 3 && draft.title.trim().length < 3)}
                onClick={() => void runAiAssist('draft_from_topic')}
                className={s.buttonSecondary}
              >
                {aiLoading ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3 w-3 shrink-0 text-fuchsia-400" aria-hidden="true" />}
                {isAr ? 'صياغة مسودة AI' : 'AI Draft'}
              </button>
              <button
                type="button"
                disabled={aiLoading || draft.body.trim().length < 3}
                onClick={() => void runAiAssist('enhance_post')}
                className={s.buttonSecondary}
              >
                <Sparkles className="h-3 w-3 shrink-0 text-fuchsia-400" aria-hidden="true" />
                {isAr ? 'تحسين الصياغة' : 'AI Enhance'}
              </button>
              <button
                type="button"
                disabled={aiLoading || draft.body.trim().length < 3}
                onClick={() => void runAiAssist('code_check')}
                className={s.buttonSecondary}
              >
                <ShieldCheck className="h-3 w-3 shrink-0 text-fuchsia-400" aria-hidden="true" />
                {isAr ? 'تدقيق الكود المعياري AI' : 'AI Technical Check'}
              </button>
              {draft.aiGenerated ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
            </div>

            {aiError ? (
              <p role="alert" className="mt-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
                {aiError}
              </p>
            ) : null}

            {duplicateRisk ? (
              <p role="status" className="mt-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
                {isAr
                  ? 'تنبيه مكافحة التكرار: يبدو أنك نشرت محتوى مطابقاً مؤخراً — تحقّق قبل إعادة النشر.'
                  : 'Duplicate warning: you recently published nearly identical content.'}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={publishing || errors.length > 0}
                className={s.buttonPrimary}
              >
                {publishing ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {isAr ? 'نشر' : 'Publish'}
              </button>
              {touched && errors.length > 0 ? (
                <span role="alert" className="text-[10px] text-rose-400">
                  {isAr ? errors[0].ar : errors[0].en}
                </span>
              ) : null}
              {published ? (
                <span role="status" className="text-[10px] font-bold text-emerald-400">
                  {isAr ? 'نُشر المنشور.' : 'Published.'}
                </span>
              ) : null}
              {publishError ? (
                <span role="alert" className="text-[10px] text-rose-400">
                  {isAr ? `لم يُنشر: ${publishError}` : `Not published: ${publishError}`}
                </span>
              ) : null}
            </div>
          </form>
        ) : (
          <ComposerGate
            language={language}
            isLight={isLight}
            signedIn={Boolean(uid)}
            verified={verified}
            hasCard={Boolean(card)}
            ready={account?.ready ?? false}
            onOpenAccount={onOpenAccount}
            onOpenProfile={onOpenProfile}
          />
        )}

        {/* ----------------------- feed tabs & filters ------------------------ */}
        <div className={`${s.card} space-y-2 p-2.5`}>
          <div className="flex flex-wrap gap-1" role="tablist">
            {FEED_TABS.map(tabItem => (
              <button
                key={tabItem.id}
                type="button"
                role="tab"
                aria-selected={feedTab === tabItem.id}
                data-testid={`network-feed-tab-${tabItem.id}`}
                onClick={() => setFeedTab(tabItem.id)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
                  feedTab === tabItem.id ? s.navActive : s.navInactive
                }`}
              >
                {isAr ? tabItem.ar : tabItem.en}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row">
            <div className={`flex min-w-0 flex-1 items-center gap-1.5 ${s.subCard} px-2 py-1`}>
              <Search className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                aria-label={isAr ? 'تصفية التغذية' : 'Filter feed'}
                placeholder={isAr ? 'ابحث في المنشورات والوسوم والأكواد…' : 'Filter posts, tags, codes…'}
                className={`min-w-0 flex-1 bg-transparent text-[11px] focus:outline-none ${s.heading}`}
              />
            </div>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              aria-label={isAr ? 'تصفية بطريقة الفحص' : 'Filter by NDT method'}
              className={`${s.input} sm:w-44`}
            >
              <option value="ALL">{isAr ? 'كل طرق الفحص' : 'All NDT methods'}</option>
              {NDT_METHOD_TAXONOMY.map(m => (
                <option key={m.id} value={m.id}>
                  {isAr ? m.ar : m.en}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* -------------------------------- feed ------------------------------- */}
        {error ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
            {isAr ? `تعذّر تحميل المنشورات: ${error}` : `Could not load posts: ${error}`}
          </p>
        ) : null}

        {reactionError ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
            {isAr ? `تعذّر تسجيل التفاعل: ${reactionError}` : `Could not record reaction: ${reactionError}`}
          </p>
        ) : null}

        {loading && slow ? (
          <div data-testid="network-feed-slow" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
            </div>
            <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
              {isAr
                ? 'لم يصل أي منشور بعد — هذا ليس منشوراً محذوفاً ولا منشوراً تجريبياً، بل اتصال لم يكتمل.'
                : 'No post has arrived yet — this is neither a deleted nor a trial post, but an unfinished connection.'}
            </p>
          </div>
        ) : loading ? (
          <p role="status" className={`flex items-center gap-2 p-3 text-[11px] ${s.subtext}`}>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل المنشورات…' : 'Loading posts…'}
          </p>
        ) : visiblePosts.length === 0 ? (
          <div
            data-testid="network-feed-empty"
            className={`${s.subCard} border-dashed p-6 text-center`}
          >
            <MessageSquare className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
            <p className={`mt-2 text-xs font-bold ${s.heading}`}>
              {posts.length === 0
                ? isAr
                  ? 'لا توجد منشورات بعد'
                  : 'No posts yet'
                : isAr
                  ? 'لا نتائج مطابقة للتصفية'
                  : 'No matching posts for current filter'}
            </p>
            <p className={`mx-auto mt-1 max-w-md text-[10px] leading-relaxed ${s.muted}`}>
              {isAr
                ? 'أول منشور حقيقي يظهر هنا بمجرد نشره من عضو مؤكَّد البريد. لا نملأ الفراغ بمنشورات تجريبية.'
                : 'The first real post appears here as soon as a verified member publishes it. We do not fill the gap with trial posts.'}
            </p>
          </div>
        ) : (
          <ul data-testid="network-feed-list" className="space-y-2.5">
            {visiblePosts.map(post => (
              <li key={post.id}>
                <PostCard
                  language={language}
                  isLight={isLight}
                  post={post}
                  mine={post.authorUid === uid}
                  isAdmin={isAdmin}
                  canComment={canPublish}
                  commentsOpen={openComments === post.id}
                  answersOpen={openAnswers === post.id}
                  onToggleComments={() =>
                    setOpenComments(current => (current === post.id ? null : post.id))
                  }
                  onToggleAnswers={() =>
                    setOpenAnswers(current => (current === post.id ? null : post.id))
                  }
                  onCopyLink={() => void copyLink(post.id)}
                  copied={copied === post.id}
                  canReact={Boolean(uid) && verified}
                  myReaction={myReactions[post.id]}
                  reacting={reacting === post.id}
                  onToggleReaction={type => void toggleReaction(post.id, type)}
                  bookmarked={bookmarkedIds.has(post.id)}
                  onToggleBookmark={() => void handleToggleBookmark(post)}
                  onOpenAccount={onOpenAccount}
                  onOpenProfile={onOpenProfile}
                  onOpenAcademy={onOpenAcademy}
                  author={card}
                  user={account?.user ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ------------------------------ right rail ----------------------------- */}
      <aside className="min-w-0 space-y-3">
        <div className={`${s.card} p-3`}>
          <h3 className={`flex items-center gap-1.5 text-[11px] font-bold ${s.heading}`}>
            <UserRound className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
            {isAr ? 'قواعد النشر' : 'Posting rules'}
          </h3>
          <ul className={`mt-1.5 space-y-1 text-[10px] leading-relaxed ${s.subtext}`}>
            <li>{isAr ? '· سؤال فني واضح مع الكود المرجعي.' : '· A clear technical question with the reference code.'}</li>
            <li>{isAr ? '· لا إعلانات تجارية ولا تسعير تعاقدي.' : '· No advertising and no commercial pricing.'}</li>
            <li>{isAr ? '· لا صور مصدر مشع ولا بيانات عملاء.' : '· No radiation-source photos and no client data.'}</li>
            <li>{isAr ? '· الشهادات تُذكر كإقرار، لا كشارة تحقق.' : '· Certificates are stated as a claim, not as a verified badge.'}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[10px] leading-relaxed text-emerald-300">
          {isAr
            ? 'التفاعل يُقرأ قبل أن يُكتب: نتحقق من تفاعلك على المنشور أولاً، فلا تُحسب ضغطة مرتين ولا يبتعد العدّاد عن عدد التفاعلات الحقيقي.'
            : 'Reactions are checked before writing so a tap is never double-counted and counters always stay accurate.'}
        </div>
      </aside>
    </div>
  );
};

/* ------------------------------- sub-pieces -------------------------------- */

const ComposerGate: React.FC<{
  language: Language;
  isLight: boolean;
  signedIn: boolean;
  verified: boolean;
  hasCard: boolean;
  ready: boolean;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
}> = ({ language, isLight, signedIn, verified, hasCard, ready, onOpenAccount, onOpenProfile }) => {
  const isAr = language === 'ar';
  const s = networkSurface(isLight);
  const message = !ready
    ? isAr
      ? 'جارٍ التحقق من جلسة حسابك…'
      : 'Checking your account session…'
    : !signedIn
      ? isAr
        ? 'سجّل الدخول لتكتب منشوراً. القراءة متاحة للجميع.'
        : 'Sign in to write a post. Reading is open to everyone.'
      : !verified
        ? isAr
          ? 'أكّد بريدك أولاً — قواعد الحماية لا تسمح بالنشر قبله.'
          : 'Confirm your email first — the rules refuse to publish before it.'
        : isAr
          ? 'أنشئ بطاقتك المهنية أولاً: المنشور يُنشر باسمك وجهة عملك، ولا نختلق اسماً بدلاً.'
          : 'Create your professional card first: a post carries your name and organisation.';

  return (
    <div data-testid="network-composer-gate" className={`${s.card} p-3`}>
      <div className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
        <PenLine className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
        {isAr ? 'منشور جديد' : 'New post'}
      </div>
      <p className={`mt-1 text-[11px] leading-relaxed ${s.subtext}`}>{message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ready && !signedIn ? (
          <button type="button" onClick={() => onOpenAccount('signin')} className={s.buttonPrimary}>
            {isAr ? 'تسجيل الدخول' : 'Sign in'}
          </button>
        ) : null}
        {ready && signedIn && !verified ? (
          <button
            type="button"
            onClick={() => onOpenAccount('account')}
            className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-300"
          >
            {isAr ? 'فتح حسابي' : 'Open my account'}
          </button>
        ) : null}
        {ready && signedIn && verified && !hasCard ? (
          <button type="button" onClick={onOpenProfile} className={s.buttonPrimary}>
            {isAr ? 'إنشاء البطاقة' : 'Create the card'}
          </button>
        ) : null}
      </div>
    </div>
  );
};

const PostCard: React.FC<{
  language: Language;
  isLight: boolean;
  post: CommunityPost;
  mine: boolean;
  isAdmin: boolean;
  canComment: boolean;
  commentsOpen: boolean;
  answersOpen: boolean;
  copied: boolean;
  canReact: boolean;
  myReaction?: CommunityReactionType;
  reacting: boolean;
  bookmarked: boolean;
  onToggleReaction: (type: CommunityReactionType) => void;
  onToggleBookmark: () => void;
  author: CommunityWorkspaceProfile | null;
  user: User | null;
  onToggleComments: () => void;
  onToggleAnswers: () => void;
  onCopyLink: () => void;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenAcademy?: () => void;
}> = ({
  language,
  isLight,
  post,
  mine,
  isAdmin,
  canComment,
  commentsOpen,
  answersOpen,
  copied,
  canReact,
  myReaction,
  reacting,
  bookmarked,
  onToggleReaction,
  onToggleBookmark,
  author,
  user,
  onToggleComments,
  onToggleAnswers,
  onCopyLink,
  onOpenAccount,
  onOpenProfile,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const s = networkSurface(isLight);
  const kind = displayKindForStored(post.postType);
  const method = NETWORK_METHODS.find(item => item.id === post.ndtMethod);
  const [pollVotes, setPollVotes] = useState<CommunityPollVote[]>([]);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reported, setReported] = useState(false);

  const hasPoll = Array.isArray(post.pollOptions) && post.pollOptions.length >= 2;
  useEffect(() => {
    if (!hasPoll) return;
    let active = true;
    let stop: (() => void) | undefined;
    void import('../../client/networkPlatformService')
      .then(api => {
        if (!active || !api.subscribePollVotes) return;
        stop = api.subscribePollVotes(post.id, rows => {
          if (active) setPollVotes(rows);
        });
      })
      .catch(() => {});
    return () => {
      active = false;
      stop?.();
    };
  }, [hasPoll, post.id]);

  const handleVote = async (idx: number) => {
    if (!user) return;
    try {
      const api = await import('../../client/networkPlatformService');
      await api.castPollVote(user, post.id, idx);
    } catch {
      /* ignore */
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportReason.trim()) return;
    try {
      const api = await import('../../client/networkPlatformService');
      await api.submitModerationReport(user, {
        reporterName: author?.displayName || user.displayName || user.uid,
        targetType: 'post',
        targetId: post.id,
        targetTitle: post.title,
        reason: reportReason.trim(),
      });
      setReported(true);
      setReporting(false);
      setReportReason('');
    } catch {
      /* ignore */
    }
  };

  const myPollVote = user ? pollVotes.find(v => v.uid === user.uid) : undefined;
  const totalVotes = pollVotes.length;
  const extUrl = post.externalLink || post.linkUrl;
  const courseTitle = post.academyLessonTitle || post.academyCourseTitle;

  return (
    <article data-testid="network-post-card" className={`${s.card} min-w-0 p-3`}>
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-[11px] font-bold text-violet-400">
          {(post.authorName ?? '?').trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className={`min-w-0 truncate text-xs font-bold ${s.heading}`}>{post.authorName}</span>
            {mine ? (
              <span className="shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-300">
                {isAr ? 'منشورك' : 'Yours'}
              </span>
            ) : null}
            {post.isAiAssisted || post.aiGenerated ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
            <span className={`shrink-0 text-[10px] ${s.muted}`}>{relativeTime(post.createdAt, isAr)}</span>
          </div>
          <p className={`min-w-0 truncate text-[10px] ${s.subtext}`}>
            {[post.authorHeadline, post.authorOrg].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {kind ? (
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${kind.accent}`}>
            {isAr ? kind.ar : kind.en}
          </span>
        ) : null}
        {method ? <span className={s.chip}>{isAr ? method.ar : method.en}</span> : null}
        {post.visibility === 'members_only' ? (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-300">
            {isAr ? 'الأعضاء فقط' : 'Members only'}
          </span>
        ) : null}
        {post.companyName ? (
          <span className="rounded border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-300">
            {post.companyName}
          </span>
        ) : null}
      </div>

      <h3 className={`mt-1.5 text-sm font-bold leading-snug ${s.heading}`}>{post.title}</h3>
      <p className={`mt-1 whitespace-pre-wrap text-[11px] leading-relaxed ${s.subtext}`}>
        {postExcerpt(post.body, 600)}
      </p>

      {post.mediaUrl ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-violet-500/20">
          <img src={post.mediaUrl} alt={post.title} className="max-h-72 w-full object-cover" loading="lazy" />
        </div>
      ) : null}

      {extUrl ? (
        <a
          href={extUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`mt-2 inline-flex items-center gap-1 ${s.buttonSecondary}`}
        >
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isAr ? 'فتح المرجع المرفق' : 'Open attached reference'}
        </a>
      ) : null}

      {post.academyCourseId ? (
        <button
          type="button"
          onClick={() => {
            if (onOpenAcademy) onOpenAcademy();
            else window.location.hash = '#academy/choose/courses';
          }}
          className="mt-2 ms-1 inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-400 cursor-pointer hover:border-amber-300"
        >
          <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
          {courseTitle || (isAr ? 'دورة مرتبطة في الأكاديمية' : 'Linked INSCO Academy Course')}
        </button>
      ) : null}

      {hasPoll && post.pollOptions ? (
        <div className={`mt-2 space-y-1.5 ${s.subCard} p-2.5`} data-testid="network-post-poll">
          <p className={`text-[10px] font-bold ${s.heading}`}>
            {isAr ? `استطلاع (${totalVotes} صوت)` : `Poll (${totalVotes} votes)`}
          </p>
          {post.pollOptions.map((opt, idx) => {
            const count = pollVotes.filter(v => v.optionIndex === idx).length;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const picked = myPollVote?.optionIndex === idx;
            return (
              <button
                key={`${post.id}-opt-${idx}`}
                type="button"
                disabled={!canReact}
                onClick={() => void handleVote(idx)}
                className={`relative w-full overflow-hidden rounded-lg border px-2.5 py-1.5 text-start text-[11px] transition cursor-pointer ${
                  picked
                    ? 'border-violet-400 bg-violet-500/20 font-bold text-violet-200'
                    : isLight
                      ? 'border-slate-300 bg-white text-slate-800 hover:border-violet-400'
                      : 'border-[#2a2a4d] bg-[#14142a] text-slate-200 hover:border-violet-400/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{opt}</span>
                  <span className="text-[10px]">{pct}% ({count})</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {post.tags && post.tags.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {post.tags.map(tag => (
            <span key={tag} className={s.chip}>
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className={`mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2 ${s.divider}`}>
        <button
          type="button"
          onClick={() => onToggleReaction('like')}
          disabled={!canReact || reacting}
          aria-pressed={myReaction === 'like'}
          aria-disabled={!canReact || reacting}
          title={
            canReact
              ? isAr
                ? myReaction === 'like'
                  ? 'إلغاء الإعجاب'
                  : 'إعجاب — يُقرأ تفاعلك أولاً فلا يُحسب مرتين'
                : 'Like post'
              : isAr
                ? 'الإعجاب يحتاج حساباً مؤكَّد البريد'
                : 'Liking needs a confirmed account'
          }
          data-testid="network-like"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${
            myReaction === 'like'
              ? 'border-violet-400/60 bg-violet-500/20 text-violet-200'
              : isLight
                ? 'border-slate-300 bg-white text-slate-700'
                : 'border-[#2a2a4d] bg-[#14142a] text-slate-300'
          } ${canReact && !reacting ? 'cursor-pointer hover:border-violet-400' : 'cursor-not-allowed opacity-60'}`}
        >
          {reacting ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <Heart className={`h-3 w-3 shrink-0 ${myReaction === 'like' ? 'fill-current' : ''}`} aria-hidden="true" />
          )}
          {isAr ? `إعجاب ${post.likesCount}` : `Like ${post.likesCount}`}
        </button>

        {(
          [
            { id: 'insightful', icon: Lightbulb, ar: 'مفيد', en: 'Insightful' },
            { id: 'verified', icon: CheckCircle2, ar: 'دقيق فنياً', en: 'Verified Tech' },
            { id: 'celebrate', icon: Award, ar: 'إنجاز', en: 'Celebrate' },
          ] as const
        ).map(rx => {
          const Icon = rx.icon;
          const active = myReaction === rx.id;
          return (
            <button
              key={rx.id}
              type="button"
              disabled={!canReact || reacting}
              onClick={() => onToggleReaction(rx.id)}
              aria-pressed={active}
              data-testid={`network-reaction-${rx.id}`}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${
                active ? 'border-amber-400 bg-amber-500/20 text-amber-300' : s.buttonSecondary
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
              {isAr ? rx.ar : rx.en}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onToggleAnswers}
          aria-expanded={answersOpen}
          data-testid="network-answers-toggle"
          className={s.buttonSecondary}
        >
          <HelpCircle className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
          {isAr ? `إجابات Q&A (${post.answersCount ?? 0})` : `Q&A Answers (${post.answersCount ?? 0})`}
        </button>

        <button
          type="button"
          onClick={onToggleComments}
          aria-expanded={commentsOpen}
          className={s.buttonSecondary}
        >
          <MessageSquare className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isAr ? `التعليقات ${post.commentsCount}` : `Comments ${post.commentsCount}`}
        </button>

        {user ? (
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-pressed={bookmarked}
            className={bookmarked ? s.buttonPrimary : s.buttonSecondary}
          >
            <Bookmark className={`h-3 w-3 shrink-0 ${bookmarked ? 'fill-current' : ''}`} aria-hidden="true" />
            {bookmarked ? (isAr ? 'محفوظ' : 'Saved') : isAr ? 'حفظ' : 'Save'}
          </button>
        ) : null}

        <button type="button" onClick={onCopyLink} className={s.buttonSecondary}>
          <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />
          {copied ? (isAr ? 'نُسخ الرابط' : 'Link copied') : isAr ? 'رابط المنشور' : 'Post link'}
        </button>

        {user && !mine ? (
          <button type="button" onClick={() => setReporting(v => !v)} className={s.buttonSecondary}>
            <Flag className="h-3 w-3 shrink-0" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {reported ? (
        <p className="mt-1 text-[10px] text-emerald-400">
          {isAr ? 'تم إرسال البلاغ للإدارة.' : 'Report submitted.'}
        </p>
      ) : null}

      {reporting ? (
        <form onSubmit={handleReport} className={`mt-2 flex flex-wrap gap-1.5 ${s.subCard} p-2`}>
          <input
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            placeholder={isAr ? 'سبب الإبلاغ عن المنشور…' : 'Reason for reporting…'}
            className={`${s.input} flex-1`}
          />
          <button type="submit" className={s.buttonPrimary}>
            {isAr ? 'إبلاغ' : 'Report'}
          </button>
        </form>
      ) : null}

      {answersOpen ? (
        <QnAAnswersDrawer
          language={language}
          isLight={isLight}
          post={post}
          isAuthor={mine}
          isAdmin={isAdmin}
          canAnswer={canComment}
          author={author}
          user={user}
        />
      ) : null}

      {commentsOpen ? (
        <Comments
          language={language}
          isLight={isLight}
          postId={post.id}
          canComment={canComment}
          author={author}
          user={user}
          onOpenAccount={onOpenAccount}
          onOpenProfile={onOpenProfile}
        />
      ) : null}
    </article>
  );
};

const QnAAnswersDrawer: React.FC<{
  language: Language;
  isLight: boolean;
  post: CommunityPost;
  isAuthor: boolean;
  isAdmin: boolean;
  canAnswer: boolean;
  author: CommunityWorkspaceProfile | null;
  user: User | null;
}> = ({ language, isLight, post, isAuthor, isAdmin, canAnswer, author, user }) => {
  const isAr = language === 'ar';
  const s = networkSurface(isLight);
  const [answers, setAnswers] = useState<CommunityPostAnswer[]>([]);
  const [body, setBody] = useState('');
  const [refs, setRefs] = useState('');
  const [sending, setSending] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);

  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    void import('../../client/networkPlatformService')
      .then(api => {
        if (!active || !api.subscribePostAnswers) return;
        stop = api.subscribePostAnswers(post.id, rows => {
          if (active) setAnswers(rows);
        });
      })
      .catch(() => {});
    return () => {
      active = false;
      stop?.();
    };
  }, [post.id]);

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !author || body.trim().length < 5) return;
    setSending(true);
    try {
      const api = await import('../../client/networkPlatformService');
      await api.addPostAnswer(user, post.id, {
        authorName: author.displayName,
        authorHeadline: author.headline,
        body: body.trim(),
        references: refs.trim() || undefined,
        isAiAssisted: aiUsed,
      });
      setBody('');
      setRefs('');
      setAiUsed(false);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const askAiAnswer = async () => {
    if (aiWorking) return;
    setAiWorking(true);
    try {
      const res = await runCommunityAssist({
        action: 'suggest_reply',
        language: isAr ? 'ar' : 'en',
        ndtMethod: post.ndtMethod,
        title: post.title,
        body: post.body,
      });
      setBody((res.body ?? res.reply ?? '').slice(0, 2800));
      setAiUsed(true);
    } catch {
      /* ignore */
    } finally {
      setAiWorking(false);
    }
  };

  const canExpertReview = isAdmin || Boolean(author?.credentialVerified);

  return (
    <div data-testid="network-qa-answers" className={`mt-2 space-y-2 border-t pt-2 ${s.divider}`}>
      <h4 className={`text-[11px] font-bold ${s.heading}`}>
        {isAr ? 'الإجابات الهندسية المُنظّمة' : 'Structured Technical Answers'}
      </h4>

      {answers.length === 0 ? (
        <p className={`text-[10px] ${s.muted}`}>
          {isAr ? 'لا توجد إجابات بعد. كن أول من يقدّم حلاً موثقاً بالكود.' : 'No technical answers yet.'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {answers.map(ans => (
            <li
              key={ans.id}
              className={`rounded-lg border p-2 ${
                ans.isAccepted
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : ans.expertReviewed
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : isLight
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-[#232345] bg-[#0b0b18]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-bold ${s.heading}`}>{ans.authorName}</span>
                {ans.isAccepted ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                    <Check className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                    {isAr ? 'إجابة معتمدة' : 'Accepted'}
                  </span>
                ) : null}
                {ans.expertReviewed ? (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                    {isAr ? 'مراجعة خبير' : 'Expert Reviewed'}
                  </span>
                ) : null}
                {ans.isAiAssisted ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
              </div>
              <p className={`mt-1 whitespace-pre-wrap text-[11px] ${s.subtext}`}>{ans.body}</p>
              {ans.references ? (
                <p className={`mt-1 text-[9px] ${s.muted}`}>
                  {isAr ? `المرجع: ${ans.references}` : `Ref: ${ans.references}`}
                </p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      void import('../../client/networkPlatformService').then(api =>
                        api.toggleAnswerUpvote(user, post.id, ans.id)
                      );
                    }}
                    className={s.buttonSecondary}
                  >
                    <ThumbsUp className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                    {ans.upvotesCount}
                  </button>
                ) : null}
                {isAuthor ? (
                  <button
                    type="button"
                    onClick={() => {
                      void import('../../client/networkPlatformService').then(api =>
                        api.setAnswerAccepted(post.id, ans.id, !ans.isAccepted)
                      );
                    }}
                    className={s.buttonSecondary}
                  >
                    {ans.isAccepted
                      ? isAr ? 'إلغاء الاعتماد' : 'Unaccept'
                      : isAr ? 'اعتماد الإجابة' : 'Accept Answer'}
                  </button>
                ) : null}
                {canExpertReview && user && author ? (
                  <button
                    type="button"
                    onClick={() => {
                      void import('../../client/networkPlatformService').then(api =>
                        api.toggleAnswerExpertReview(user, author.displayName, post.id, ans.id, !ans.expertReviewed)
                      );
                    }}
                    className={s.buttonSecondary}
                  >
                    {ans.expertReviewed
                      ? isAr ? 'إزالة مراجعة الخبير' : 'Remove Expert Badge'
                      : isAr ? 'وسم مراجعة خبير' : 'Mark Expert Reviewed'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAnswer ? (
        <form onSubmit={submitAnswer} className={`space-y-1.5 ${s.subCard} p-2`}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={2}
            placeholder={isAr ? 'أضف إجابة فنية موثقة بالمعايير…' : 'Write a technical answer grounded in codes…'}
            className={`${s.input} resize-none`}
          />
          <input
            value={refs}
            onChange={e => setRefs(e.target.value)}
            placeholder={isAr ? 'المرجع (مثل: ASME V T-434)' : 'Reference (e.g. ASME V T-434)'}
            className={s.input}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="submit" disabled={sending || body.trim().length < 5} className={s.buttonPrimary}>
              <Send className="h-3 w-3 shrink-0" aria-hidden="true" />
              {isAr ? 'إرسال الإجابة' : 'Submit Answer'}
            </button>
            <button type="button" disabled={aiWorking} onClick={() => void askAiAnswer()} className={s.buttonSecondary}>
              {aiWorking ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3 w-3 shrink-0 text-fuchsia-400" aria-hidden="true" />}
              {isAr ? 'مسودة إجابة AI' : 'AI Draft Answer'}
            </button>
            {aiUsed ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
          </div>
        </form>
      ) : null}
    </div>
  );
};

const Comments: React.FC<{
  language: Language;
  isLight: boolean;
  postId: string;
  canComment: boolean;
  author: CommunityWorkspaceProfile | null;
  user: User | null;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
}> = ({ language, isLight, postId, canComment, author, user, onOpenAccount, onOpenProfile }) => {
  const isAr = language === 'ar';
  const s = networkSurface(isLight);
  const [comments, setComments] = useState<CommunityPostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<CommunityPostComment | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const errors = validateCommentDraft(body);

  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    setLoading(true);
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stop = api.subscribePostComments(
        postId,
        next => {
          if (!active) return;
          setComments(next);
          setLoading(false);
        },
        nextError => {
          if (!active) return;
          setError(nextError.message);
          setLoading(false);
        }
      );
    });
    return () => {
      active = false;
      stop?.();
    };
  }, [postId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !author || errors.length > 0) return;
    setSending(true);
    setSendError(null);
    try {
      const api = await import('../../client/firestoreClientService');
      await api.addCommunityPostComment(user, postId, {
        authorName: author.displayName,
        ...(author.headline ? { authorHeadline: author.headline } : {}),
        ...(replyTo ? { parentCommentId: replyTo.id } : {}),
        body,
      });
      setBody('');
      setReplyTo(null);
    } catch (failure) {
      setSendError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setSending(false);
    }
  };

  const topLevel = comments.filter(c => !c.parentCommentId);
  const repliesFor = (parentId: string) => comments.filter(c => c.parentCommentId === parentId);

  return (
    <div data-testid="network-comments" className={`mt-2 border-t pt-2 ${s.divider}`}>
      {loading ? (
        <p role="status" className={`flex items-center gap-1.5 text-[10px] ${s.muted}`}>
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ تحميل التعليقات…' : 'Loading comments…'}
        </p>
      ) : error ? (
        <p role="alert" className="text-[10px] text-rose-400">
          {isAr ? `تعذّر تحميل التعليقات: ${error}` : `Could not load comments: ${error}`}
        </p>
      ) : comments.length === 0 ? (
        <p className={`text-[10px] ${s.muted}`}>{isAr ? 'لا تعليقات بعد.' : 'No comments yet.'}</p>
      ) : (
        <ul className="space-y-1.5">
          {topLevel.map(comment => (
            <li key={comment.id} className={`min-w-0 ${s.subCard} px-2 py-1.5`}>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className={`min-w-0 truncate text-[10px] font-bold ${s.heading}`}>{comment.authorName}</span>
                {comment.isAiAssisted ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
                <span className={`shrink-0 text-[9px] ${s.muted}`}>{relativeTime(comment.createdAt, isAr)}</span>
                {canComment ? (
                  <button
                    type="button"
                    onClick={() => setReplyTo(comment)}
                    className={`ms-auto text-[9px] font-bold text-violet-400 cursor-pointer hover:underline`}
                  >
                    {isAr ? 'رد' : 'Reply'}
                  </button>
                ) : null}
              </div>
              <p className={`mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed ${s.subtext}`}>{comment.body}</p>
              {repliesFor(comment.id).length > 0 ? (
                <ul className={`mt-1.5 space-y-1 border-s-2 border-violet-500/30 ps-2`}>
                  {repliesFor(comment.id).map(reply => (
                    <li key={reply.id} className="text-[10px]">
                      <span className={`font-bold ${s.heading}`}>{reply.authorName}: </span>
                      <span className={s.subtext}>{reply.body}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form onSubmit={submit} className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
          {replyTo ? (
            <div className="flex w-full items-center justify-between text-[9px] text-violet-400">
              <span>{isAr ? `رد على ${replyTo.authorName}` : `Replying to ${replyTo.authorName}`}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="underline cursor-pointer">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          ) : null}
          <input
            value={body}
            onChange={event => setBody(event.target.value)}
            maxLength={NETWORK_POST_LIMITS.commentMax}
            aria-label={isAr ? 'اكتب تعليقاً' : 'Write a comment'}
            placeholder={isAr ? 'اكتب تعليقاً فنياً…' : 'Write a technical comment…'}
            className={`${s.input} flex-1`}
          />
          <button type="submit" disabled={sending || errors.length > 0} className={s.buttonPrimary}>
            {sending ? (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            {isAr ? 'إرسال' : 'Send'}
          </button>
          {sendError ? (
            <span role="alert" className="w-full text-[10px] text-rose-400">
              {isAr ? `لم يُرسل: ${sendError}` : `Not sent: ${sendError}`}
            </span>
          ) : null}
        </form>
      ) : (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={`text-[10px] ${s.muted}`}>
            {isAr ? 'للتعليق تحتاج بطاقة مهنية مؤكَّدة.' : 'Commenting needs a confirmed professional card.'}
          </span>
          <button
            type="button"
            onClick={() => (user ? onOpenProfile() : onOpenAccount('signin'))}
            className={s.buttonSecondary}
          >
            {user ? (isAr ? 'بطاقتي' : 'My card') : isAr ? 'تسجيل الدخول' : 'Sign in'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkFeedSection;
