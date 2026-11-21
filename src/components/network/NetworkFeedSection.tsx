import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleAlert,
  Copy,
  Loader2,
  MessageSquare,
  PenLine,
  Send,
  UserRound,
} from 'lucide-react';
import type { Language } from '../../types';
import type { User } from 'firebase/auth';
import type {
  CommunityPost,
  CommunityPostComment,
  CommunityWorkspaceProfile,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
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
  /** See NetworkDirectorySection: no endless spinner on a blocked connection. */
  slowAfterMs?: number;
}

const fieldClass =
  'w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none';

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
 * `#network/feed` — real posts, real comments.
 *
 * Publishing and commenting use the shipped community service and rules. Two
 * things are deliberately *not* here yet: reactions (they need the member's own
 * reaction to be read first, or a tap would double-count) and any invented
 * content. An empty feed says it is empty.
 */
export const NetworkFeedSection: React.FC<NetworkFeedSectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';

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
  const [copied, setCopied] = useState<string | null>(null);

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  /* The feed itself: public posts only, exactly what the rules expose. */
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
  }, [serviceReady, slowAfterMs]);

  /* The author identity comes from the member's own card, never from the form. */
  useEffect(() => {
    setCard(null);
    if (!uid || !serviceReady) return;
    let active = true;
    let stop: (() => void) | undefined;
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stop = api.subscribeMyCommunityWorkspace(
        uid,
        next => {
          if (active) setCard(next);
        },
        () => {
          /* the composer simply stays closed; the feed still reads */
        }
      );
    });
    return () => {
      active = false;
      stop?.();
    };
  }, [uid, serviceReady]);

  const errors = useMemo(() => validatePostDraft(draft), [draft]);
  const canPublish = Boolean(uid) && verified && Boolean(card);
  const update = useCallback(<K extends keyof NetworkPostDraft>(key: K, value: NetworkPostDraft[K]) => {
    setTouched(true);
    setPublished(false);
    setPublishError(null);
    setDraft(current => ({ ...current, [key]: value }));
  }, []);

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
        await api.createCommunityPost(
          user,
          toPostInput(draft, {
            displayName: card.displayName,
            organizationName: card.organizationName,
            headline: card.headline,
            companyCode: card.companyCode,
          })
        );
        setDraft({ ...EMPTY_POST_DRAFT, method: draft.method, kind: draft.kind });
        setTouched(false);
        setPublished(true);
      } catch (publishFailure) {
        setPublishError(publishFailure instanceof Error ? publishFailure.message : String(publishFailure));
      } finally {
        setPublishing(false);
      }
    },
    [account?.user, card, draft, errors.length]
  );

  const copyLink = useCallback(
    async (postId: string) => {
      const url = `${window.location.origin}${window.location.pathname}#network/feed/${postId}`;
      try {
        await navigator.clipboard?.writeText(url);
        setCopied(postId);
        setTimeout(() => setCopied(null), 2000);
      } catch {
        setCopied(null);
      }
    },
    []
  );

  if (!serviceReady) {
    return (
      <div data-testid="network-feed-unavailable" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          {isAr ? 'المنشورات غير متاحة في هذه النسخة' : 'The feed is not available in this build'}
        </div>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400">
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
          <form onSubmit={publish} className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <PenLine className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              {isAr ? 'منشور جديد' : 'New post'}
              <span className="ms-auto text-[10px] font-normal text-slate-500">
                {isAr ? `نشر باسم ${card?.displayName}` : `Posting as ${card?.displayName}`}
              </span>
            </div>

            <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'نوع المنشور' : 'Post type'}</span>
                <select
                  value={draft.kind}
                  onChange={event => update('kind', event.target.value)}
                  className={fieldClass}
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
                <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'طريقة الفحص' : 'NDT method'}</span>
                <select
                  value={draft.method}
                  onChange={event => update('method', event.target.value as NetworkPostDraft['method'])}
                  className={fieldClass}
                  aria-label={isAr ? 'طريقة الفحص' : 'NDT method'}
                >
                  {NETWORK_METHODS.map(method => (
                    <option key={method.id} value={method.id}>
                      {isAr ? method.ar : method.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 sm:col-span-2">
                <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'العنوان' : 'Title'}</span>
                <input
                  value={draft.title}
                  onChange={event => update('title', event.target.value)}
                  maxLength={NETWORK_POST_LIMITS.titleMax}
                  className={fieldClass}
                  aria-label={isAr ? 'عنوان المنشور' : 'Post title'}
                  placeholder={isAr ? 'مثال: قراءة إشارة على شطف 30° في P91' : 'e.g. reading an indication on a 30° bevel in P91'}
                />
              </label>

              <label className="min-w-0 sm:col-span-2">
                <span className="block text-[10px] font-bold text-slate-400">
                  {isAr ? 'النص' : 'Body'}
                  <span className="ms-1 font-normal text-slate-500">
                    {isAr ? '(القطر، السماكة، الزاوية، الكود المرجعي…)' : '(diameter, thickness, angle, reference code…)'}
                  </span>
                </span>
                <textarea
                  value={draft.body}
                  onChange={event => update('body', event.target.value)}
                  maxLength={NETWORK_POST_LIMITS.bodyMax}
                  rows={4}
                  className={`${fieldClass} resize-none`}
                  aria-label={isAr ? 'نص المنشور' : 'Post body'}
                />
              </label>

              <label className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400">
                  {isAr ? 'وسوم (حتى 6)' : 'Tags (up to 6)'}
                </span>
                <input
                  value={draft.tags}
                  onChange={event => update('tags', event.target.value)}
                  className={fieldClass}
                  aria-label={isAr ? 'وسوم المنشور' : 'Post tags'}
                  placeholder="ASME-V · TOFD · P91"
                />
              </label>

              <label className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'من يرى المنشور' : 'Who can see it'}</span>
                <select
                  value={draft.visibility}
                  onChange={event => update('visibility', event.target.value as NetworkPostDraft['visibility'])}
                  className={fieldClass}
                  aria-label={isAr ? 'نطاق ظهور المنشور' : 'Post visibility'}
                >
                  <option value="public">{isAr ? 'عام' : 'Public'}</option>
                  <option value="members_only">{isAr ? 'الأعضاء فقط' : 'Members only'}</option>
                </select>
              </label>
            </div>

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
                {isAr ? 'نشر' : 'Publish'}
              </button>
              {touched && errors.length > 0 ? (
                <span role="alert" className="text-[10px] text-rose-300">
                  {isAr ? errors[0].ar : errors[0].en}
                </span>
              ) : null}
              {published ? (
                <span role="status" className="text-[10px] font-bold text-emerald-300">
                  {isAr ? 'نُشر المنشور.' : 'Published.'}
                </span>
              ) : null}
              {publishError ? (
                <span role="alert" className="text-[10px] text-rose-300">
                  {isAr ? `لم يُنشر: ${publishError}` : `Not published: ${publishError}`}
                </span>
              ) : null}
            </div>
          </form>
        ) : (
          <ComposerGate
            language={language}
            signedIn={Boolean(uid)}
            verified={verified}
            hasCard={Boolean(card)}
            ready={account?.ready ?? false}
            onOpenAccount={onOpenAccount}
            onOpenProfile={onOpenProfile}
          />
        )}

        {/* -------------------------------- feed ------------------------------- */}
        {error ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
            {isAr ? `تعذّر تحميل المنشورات: ${error}` : `Could not load posts: ${error}`}
          </p>
        ) : null}

        {loading && slow ? (
          <div data-testid="network-feed-slow" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-100/90">
              {isAr
                ? 'لم يصل أي منشور بعد — هذا ليس منشوراً محذوفاً ولا منشوراً تجريبياً، بل اتصال لم يكتمل.'
                : 'No post has arrived yet — this is neither a deleted nor a trial post, but an unfinished connection.'}
            </p>
          </div>
        ) : loading ? (
          <p role="status" className="flex items-center gap-2 p-3 text-[11px] text-slate-400">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل المنشورات…' : 'Loading posts…'}
          </p>
        ) : posts.length === 0 ? (
          <div
            data-testid="network-feed-empty"
            className="rounded-xl border border-dashed border-[#2a2a4d] bg-[#0b0b18] p-6 text-center"
          >
            <MessageSquare className="mx-auto h-6 w-6 text-slate-600" aria-hidden="true" />
            <p className="mt-2 text-xs font-bold text-slate-300">
              {isAr ? 'لا توجد منشورات بعد' : 'No posts yet'}
            </p>
            <p className="mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-slate-500">
              {isAr
                ? 'أول منشور حقيقي يظهر هنا بمجرد نشره من عضو مؤكَّد البريد. لا نملأ الفراغ بمنشورات تجريبية.'
                : 'The first real post appears here as soon as a verified member publishes it. We do not fill the gap with trial posts.'}
            </p>
          </div>
        ) : (
          <ul data-testid="network-feed-list" className="space-y-2.5">
            {posts.map(post => (
              <li key={post.id}>
                <PostCard
                  language={language}
                  post={post}
                  mine={post.authorUid === uid}
                  canComment={canPublish}
                  commentsOpen={openComments === post.id}
                  onToggleComments={() =>
                    setOpenComments(current => (current === post.id ? null : post.id))
                  }
                  onCopyLink={() => copyLink(post.id)}
                  copied={copied === post.id}
                  onOpenAccount={onOpenAccount}
                  onOpenProfile={onOpenProfile}
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
        <div className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
            {isAr ? 'قواعد النشر' : 'Posting rules'}
          </h3>
          <ul className="mt-1.5 space-y-1 text-[10px] leading-relaxed text-slate-400">
            <li>{isAr ? '· سؤال فني واضح مع الكود المرجعي.' : '· A clear technical question with the reference code.'}</li>
            <li>{isAr ? '· لا إعلانات تجارية ولا أسعار.' : '· No advertising and no pricing.'}</li>
            <li>{isAr ? '· لا صور مصدر مشع ولا بيانات عملاء.' : '· No radiation-source photos and no client data.'}</li>
            <li>{isAr ? '· الشهادات تُذكر كإقرار، لا كشارة تحقق.' : '· Certificates are stated as a claim, not as a verified badge.'}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[10px] leading-relaxed text-amber-100">
          {isAr
            ? 'التفاعلات (إعجاب/تعليق سريع) تُفعّل في المرحلة التالية بعد قراءة تفاعل العضو نفسه أولاً — حتى لا يُحسب التفاعل مرتين. التعليقات تعمل الآن.'
            : 'Reactions turn on in the next phase, once a member’s own reaction can be read first so a tap cannot be counted twice. Comments work now.'}
        </div>
      </aside>
    </div>
  );
};

/* ------------------------------- sub-pieces -------------------------------- */

const ComposerGate: React.FC<{
  language: Language;
  signedIn: boolean;
  verified: boolean;
  hasCard: boolean;
  ready: boolean;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
}> = ({ language, signedIn, verified, hasCard, ready, onOpenAccount, onOpenProfile }) => {
  const isAr = language === 'ar';
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
          ? 'أنشئ بطاقتك المهنية أولاً: المنشور يُنشر باسمك وجهة عملك، ولا نختلق اسماً بديلاً.'
          : 'Create your professional card first: a post carries your name and organisation, and we will not invent a stand-in.';

  return (
    <div data-testid="network-composer-gate" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
        <PenLine className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
        {isAr ? 'منشور جديد' : 'New post'}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ready && !signedIn ? (
          <button
            type="button"
            onClick={() => onOpenAccount('signin')}
            className="rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
          >
            {isAr ? 'تسجيل الدخول' : 'Sign in'}
          </button>
        ) : null}
        {ready && signedIn && !verified ? (
          <button
            type="button"
            onClick={() => onOpenAccount('account')}
            className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300"
          >
            {isAr ? 'فتح حسابي' : 'Open my account'}
          </button>
        ) : null}
        {ready && signedIn && verified && !hasCard ? (
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
  );
};

const PostCard: React.FC<{
  language: Language;
  post: CommunityPost;
  mine: boolean;
  canComment: boolean;
  commentsOpen: boolean;
  copied: boolean;
  author: CommunityWorkspaceProfile | null;
  user: User | null;
  onToggleComments: () => void;
  onCopyLink: () => void;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
}> = ({
  language,
  post,
  mine,
  canComment,
  commentsOpen,
  copied,
  author,
  user,
  onToggleComments,
  onCopyLink,
  onOpenAccount,
  onOpenProfile,
}) => {
  const isAr = language === 'ar';
  const kind = displayKindForStored(post.postType);
  const method = NETWORK_METHODS.find(item => item.id === post.ndtMethod);

  return (
    <article data-testid="network-post-card" className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-[11px] font-bold text-violet-200">
          {(post.authorName ?? '?').trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="min-w-0 truncate text-xs font-bold text-white">{post.authorName}</span>
            {mine ? (
              <span className="shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-200">
                {isAr ? 'منشورك' : 'Yours'}
              </span>
            ) : null}
            <span className="shrink-0 text-[10px] text-slate-500">{relativeTime(post.createdAt, isAr)}</span>
          </div>
          <p className="min-w-0 truncate text-[10px] text-slate-400">
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
        {method ? (
          <span className="rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300">
            {isAr ? method.ar : method.en}
          </span>
        ) : null}
        {post.visibility === 'members_only' ? (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-200">
            {isAr ? 'الأعضاء فقط' : 'Members only'}
          </span>
        ) : null}
      </div>

      <h3 className="mt-1.5 text-sm font-bold leading-snug text-white">{post.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-400">{postExcerpt(post.body, 480)}</p>

      {post.tags && post.tags.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {post.tags.map(tag => (
            <span key={tag} className="rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#1d1d38] pt-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={isAr ? 'التفاعل يُفعّل بعد قراءة تفاعلك أولاً' : 'Reactions arrive once your own can be read first'}
          className="inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-500 opacity-70 cursor-not-allowed"
        >
          {isAr ? `إعجاب ${post.likesCount}` : `Like ${post.likesCount}`}
        </button>

        <button
          type="button"
          onClick={onToggleComments}
          aria-expanded={commentsOpen}
          className="inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
        >
          <MessageSquare className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isAr ? `التعليقات ${post.commentsCount}` : `Comments ${post.commentsCount}`}
        </button>

        <button
          type="button"
          onClick={onCopyLink}
          className="inline-flex items-center gap-1 rounded-md border border-[#2a2a4d] bg-[#14142a] px-2 py-0.5 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
        >
          <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />
          {copied ? (isAr ? 'نُسخ الرابط' : 'Link copied') : isAr ? 'رابط المنشور' : 'Post link'}
        </button>
      </div>

      {commentsOpen ? (
        <Comments
          language={language}
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

const Comments: React.FC<{
  language: Language;
  postId: string;
  canComment: boolean;
  author: CommunityWorkspaceProfile | null;
  user: User | null;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
}> = ({ language, postId, canComment, author, user, onOpenAccount, onOpenProfile }) => {
  const isAr = language === 'ar';
  const [comments, setComments] = useState<CommunityPostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
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
        body,
      });
      setBody('');
    } catch (failure) {
      setSendError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="network-comments" className="mt-2 border-t border-[#1d1d38] pt-2">
      {loading ? (
        <p role="status" className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ تحميل التعليقات…' : 'Loading comments…'}
        </p>
      ) : error ? (
        <p role="alert" className="text-[10px] text-rose-300">
          {isAr ? `تعذّر تحميل التعليقات: ${error}` : `Could not load comments: ${error}`}
        </p>
      ) : comments.length === 0 ? (
        <p className="text-[10px] text-slate-500">{isAr ? 'لا تعليقات بعد.' : 'No comments yet.'}</p>
      ) : (
        <ul className="space-y-1.5">
          {comments.map(comment => (
            <li key={comment.id} className="min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] px-2 py-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="min-w-0 truncate text-[10px] font-bold text-slate-300">{comment.authorName}</span>
                <span className="shrink-0 text-[9px] text-slate-500">{relativeTime(comment.createdAt, isAr)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form onSubmit={submit} className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
          <input
            value={body}
            onChange={event => setBody(event.target.value)}
            maxLength={NETWORK_POST_LIMITS.commentMax}
            aria-label={isAr ? 'اكتب تعليقاً' : 'Write a comment'}
            placeholder={isAr ? 'اكتب تعليقاً فنياً…' : 'Write a technical comment…'}
            className="min-w-0 flex-1 rounded-md border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || errors.length > 0}
            className="inline-flex items-center gap-1 rounded-md bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            {isAr ? 'إرسال' : 'Send'}
          </button>
          {sendError ? (
            <span role="alert" className="w-full text-[10px] text-rose-300">
              {isAr ? `لم يُرسل: ${sendError}` : `Not sent: ${sendError}`}
            </span>
          ) : null}
        </form>
      ) : (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-500">
            {isAr ? 'للتعليق تحتاج بطاقة مهنية مؤكَّدة.' : 'Commenting needs a confirmed professional card.'}
          </span>
          <button
            type="button"
            onClick={() => (user ? onOpenProfile() : onOpenAccount('signin'))}
            className="rounded-md border border-violet-400/50 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-200 transition cursor-pointer hover:border-violet-300"
          >
            {user ? (isAr ? 'بطاقتي' : 'My card') : isAr ? 'تسجيل الدخول' : 'Sign in'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkFeedSection;
