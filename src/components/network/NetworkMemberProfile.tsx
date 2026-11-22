import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CircleAlert,
  Loader2,
  Lock,
  Linkedin,
  MapPin,
  Pencil,
  UserRound,
} from 'lucide-react';
import type { CommunityPost, CommunityWorkspaceProfile } from '../../client/types';
import type { Language } from '../../types';
import { NetworkRecommendationsPanel, NetworkSkillsPanel } from './NetworkReputation';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { NETWORK_AVAILABILITY } from '../../network/networkProfileForm';
import {
  NETWORK_MEDIA_LIMITS,
  bannerPaletteFor,
  initialsOf,
  publicPageAccess,
  visibilityById,
} from '../../network/networkIdentity';

interface NetworkMemberProfileProps {
  uid: string;
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenDirectory: () => void;
  slowAfterMs?: number;
}

const millis = (value: unknown): number => {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const fn = (value as { toMillis?: () => number }).toMillis;
    if (typeof fn === 'function') {
      try {
        return fn();
      } catch {
        return 0;
      }
    }
  }
  return 0;
};

const shortDate = (value: unknown, isAr: boolean): string => {
  const at = millis(value);
  if (!at) return isAr ? 'الآن' : 'now';
  try {
    return new Date(at).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return new Date(at).toISOString().slice(0, 10);
  }
};

const availabilityLabel = (id: string | undefined, isAr: boolean): string | null => {
  const found = NETWORK_AVAILABILITY.find(item => item.id === id);
  return found ? (isAr ? found.ar : found.en) : null;
};

/**
 * `#network/people/<uid>` — a member's public page.
 *
 * It reads the same `community_workspaces` card the rest of the site uses, and the
 * same rules decide who may read it: a card marked «للأعضاء المؤكَّدين» is refused to a
 * signed-out visitor by Firestore itself, and the page says so plainly instead of
 * showing an empty shell. Nothing on this page is invented — no banner drawn as if
 * the member had uploaded one, no certificate claimed as verified, no padding posts.
 */
export const NetworkMemberProfile: React.FC<NetworkMemberProfileProps> = ({
  uid,
  language,
  onOpenAccount,
  onOpenProfile,
  onOpenDirectory,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';

  const [profile, setProfile] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'skills' | 'recommendations'>('posts');

  const serviceReady = account?.available ?? false;
  const signedIn = Boolean(account?.user?.uid);
  const verified = account?.verified ?? false;
  const isMine = account?.user?.uid === uid;

  useEffect(() => {
    setProfile(null);
    setDenied(false);
    setError(null);
    setPosts([]);
    setPostsLoading(true);
    setSlow(false);
    if (!serviceReady) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      if (active) setSlow(true);
    }, slowAfterMs);

    void (async () => {
      try {
        const api = await import('../../client/firestoreClientService');
        const found = await api.getCommunityWorkspace(uid);
        if (!active) return;
        setProfile(found);
      } catch (failure) {
        if (!active) return;
        // Firestore reports a rule refusal as permission-denied; that is a different
        // answer from "no such member", and the page must not confuse the two.
        const code = (failure as { code?: unknown } | null)?.code;
        if (typeof code === 'string' && code.includes('permission')) setDenied(true);
        else setError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        if (active) {
          setLoading(false);
          setSlow(false);
          clearTimeout(timer);
        }
      }
    })();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [uid, serviceReady, slowAfterMs, signedIn, verified]);

  const access = useMemo(() => publicPageAccess(profile, { signedIn, verified }), [profile, signedIn, verified]);
  const visible = access.state === 'ok';

  useEffect(() => {
    if (!serviceReady || !visible) {
      setPostsLoading(false);
      return;
    }
    let active = true;
    let stop: (() => void) | undefined;
    setPostsLoading(true);
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stop = api.subscribeAuthorPublicPosts(
        uid,
        next => {
          if (!active) return;
          setPosts(next);
          setPostsLoading(false);
        },
        () => {
          if (active) setPostsLoading(false);
        }
      );
    });
    return () => {
      active = false;
      stop?.();
    };
  }, [uid, serviceReady, visible]);

  const copyLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#network/people/${uid}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* Clipboard can be blocked; the link is still visible in the address bar. */
    }
  }, [uid]);

  if (!serviceReady) {
    return (
      <div data-testid="network-member-unavailable" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          {isAr ? 'الصفحة غير متاحة في هذه النسخة' : 'This page is not available in this build'}
        </div>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-400">
          {isAr
            ? 'لم يُهيَّأ اتصال Firebase، فلا يمكن قراءة بطاقة حقيقية — ولن نعرض بطاقة تجريبية بدلاً منها.'
            : 'Firebase is not initialised, so no real card can be read — and we will not show a trial card instead.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-testid="network-member-loading" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4">
        {slow ? (
          <>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-100/90">
              {isAr ? 'لم تصل البطاقة بعد — هذه ليست صفحة فارغة، بل اتصال لم يكتمل.' : 'The card has not arrived yet — this is not an empty page, but an unfinished connection.'}
            </p>
          </>
        ) : (
          <p role="status" className="flex items-center gap-2 text-[11px] text-slate-400">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل البطاقة…' : 'Loading the card…'}
          </p>
        )}
      </div>
    );
  }

  /* ----------------------------- honest dead ends ---------------------------- */

  const deadEnd = (testId: string, title: string, body: string, action?: React.ReactNode) => (
    <div data-testid={testId} className="mx-auto max-w-xl rounded-xl border border-[#232345] bg-[#0f0f22] p-5 text-center">
      <Lock className="mx-auto h-6 w-6 text-slate-600" aria-hidden="true" />
      <p className="mt-2 text-sm font-bold text-white">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-slate-400">{body}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{action}</div>
    </div>
  );

  const backButton = (
    <button
      type="button"
      onClick={onOpenDirectory}
      className="inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
    >
      <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {isAr ? 'دليل الأعضاء' : 'Member directory'}
    </button>
  );

  if (error) {
    return deadEnd(
      'network-member-error',
      isAr ? 'تعذّر تحميل الصفحة' : 'The page could not be loaded',
      isAr ? `لم نتمكن من قراءة البطاقة: ${error}` : `The card could not be read: ${error}`,
      backButton
    );
  }

  if (denied || access.state === 'private') {
    return deadEnd(
      'network-member-private',
      isAr ? 'هذه الصفحة للأعضاء المؤكَّدين' : 'This page is for confirmed members',
      isAr
        ? 'صاحب البطاقة اختار أن تكون صفحته للمسجّلين المؤكَّدين، وقواعد الحماية تمنع قراءتها قبل ذلك — ليس إخفاءً لزر، بل منعاً فعلياً.'
        : 'The member chose to keep this page for confirmed members, and the security rules refuse it before that — an actual refusal, not a hidden button.',
      signedIn ? (
        account?.verified ? (
          backButton
        ) : (
          <button
            type="button"
            onClick={() => onOpenAccount('account')}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-400/90 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-amber-300"
          >
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'أكّد بريدك' : 'Confirm your email'}
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={() => onOpenAccount('signin')}
          className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
        >
          <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isAr ? 'تسجيل الدخول' : 'Sign in'}
        </button>
      )
    );
  }

  if (access.state === 'missing') {
    return deadEnd(
      'network-member-missing',
      isAr ? 'لا توجد بطاقة بهذا الرابط' : 'No card at this link',
      isAr
        ? 'قد يكون الرابط قديماً أو أن العضو لم ينشئ بطاقته بعد. لا نعرض بطاقة بديلة.'
        : 'The link may be old, or the member has not created a card yet. We do not show a substitute card.',
      backButton
    );
  }

  if (access.state === 'not-published' || !profile) {
    return deadEnd(
      'network-member-not-published',
      isAr ? 'البطاقة غير منشورة' : 'This card is not published',
      isAr
        ? 'العضو أخفى بطاقته من الدليل مؤقتاً. لا شيء لعرضه حتى يعيد نشرها.'
        : 'The member has temporarily hidden the card from the directory. There is nothing to show until it is published again.',
      backButton
    );
  }

  /* --------------------------------- the page -------------------------------- */

  const palette = bannerPaletteFor(profile.sector ?? '');
  const availability = availabilityLabel(profile.availabilityStatus, isAr);
  const membersOnly = visibilityById(profile.profileVisibility) === 'members';

  return (
    <div data-testid="network-member-live" className="mx-auto min-w-0 max-w-3xl space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#232345] bg-[#0f0f22]">
        {/* banner: the member's own image, or an honest "no banner" strip */}
        <div
          className="relative"
          style={{ aspectRatio: `${NETWORK_MEDIA_LIMITS.bannerWidth} / ${NETWORK_MEDIA_LIMITS.bannerHeight}` }}
        >
          {profile.bannerURL ? (
            <img
              src={profile.bannerURL}
              alt={isAr ? 'بانر العضو' : 'Member banner'}
              data-testid="network-member-banner"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              data-testid="network-member-banner-placeholder"
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
            >
              <span className="text-[10px] tracking-wide" style={{ color: palette.accent }}>
                {isAr ? 'لا بانر بعد' : 'No banner yet'}
              </span>
            </div>
          )}

          <div className="absolute -bottom-7 start-3 flex items-end gap-2">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                data-testid="network-member-photo"
                className="h-16 w-16 rounded-full border-2 border-[#0f0f22] object-cover"
                loading="lazy"
              />
            ) : (
              <div
                data-testid="network-member-photo-placeholder"
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0f0f22] text-sm font-bold"
                style={{ background: palette.to, color: palette.ink }}
              >
                {initialsOf(profile.displayName)}
              </div>
            )}
          </div>
        </div>

        <div className="px-3 pb-3 pt-9">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 data-testid="network-member-name" className="text-base font-bold leading-snug text-white">
                {profile.displayName}
              </h2>
              {profile.headline ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">{profile.headline}</p>
              ) : null}
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-0.5">
                  <Building2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                  {profile.organizationName}
                </span>
                {profile.city ? (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                    {profile.city}
                  </span>
                ) : null}
                {typeof profile.yearsExperience === 'number' ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Briefcase className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                    {isAr ? `${profile.yearsExperience} سنة خبرة` : `${profile.yearsExperience} yrs`}
                  </span>
                ) : null}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {availability ? (
                  <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200">
                    {availability}
                  </span>
                ) : null}
                <span className="rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400">
                  {profile.sector}
                </span>
                {membersOnly ? (
                  <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
                    {isAr ? 'للأعضاء المؤكَّدين' : 'Confirmed members'}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {profile.linkedInUrl ? (
                <a
                  href={profile.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  data-testid="network-member-linkedin"
                  className="inline-flex items-center gap-1 rounded-lg border border-sky-500/50 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-200 transition hover:border-sky-300"
                >
                  <Linkedin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  LinkedIn
                </a>
              ) : null}
              {isMine ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    data-testid="network-member-edit"
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
                  >
                    <Pencil className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {isAr ? 'تعديل بطاقتي' : 'Edit my card'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-2.5 py-1 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
                  >
                    {isAr ? 'نسخ الرابط' : 'Copy link'}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">{profile.bio}</p>
          ) : null}

          <dl className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
            {profile.specialtyTrades ? (
              <div className="min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2">
                <dt className="text-[9px] font-bold text-slate-500">{isAr ? 'التخصصات' : 'Specialities'}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300">{profile.specialtyTrades}</dd>
              </div>
            ) : null}
            {profile.certifications ? (
              <div className="min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2">
                <dt className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                  {isAr ? 'شهادات معلنة' : 'Declared certificates'}
                  <span className="rounded bg-amber-500/10 px-1 text-[8px] font-bold text-amber-300">
                    {isAr ? 'غير مُتحقَّق منها' : 'not verified'}
                  </span>
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300">{profile.certifications}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {/* --------------------------------- tabs --------------------------------- */}
      <div data-testid="network-member-tabs" role="tablist" className="flex min-w-0 flex-wrap gap-1 rounded-xl border border-[#232345] bg-[#0f0f22] p-1">
        {(
          [
            { id: 'posts', ar: 'المنشورات', en: 'Posts' },
            { id: 'skills', ar: 'المهارات والتزكيات', en: 'Skills & endorsements' },
            { id: 'recommendations', ar: 'التوصيات', en: 'Recommendations' },
          ] as const
        ).map(entry => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            data-testid={`network-member-tab-${entry.id}`}
            onClick={() => setTab(entry.id)}
            className={`min-w-0 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
              tab === entry.id
                ? 'bg-violet-500/20 text-violet-100'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {isAr ? entry.ar : entry.en}
          </button>
        ))}
      </div>

      {tab === 'skills' ? (
        <NetworkSkillsPanel profile={profile} language={language} self={isMine} onOpenProfile={onOpenProfile} />
      ) : null}

      {tab === 'recommendations' ? (
        <NetworkRecommendationsPanel profile={profile} language={language} self={isMine} />
      ) : null}

      {/* --------------------------------- posts -------------------------------- */}
      {tab === 'posts' ? (
      <div className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
        <h3 className="text-[11px] font-bold text-slate-200">{isAr ? 'منشورات علنية' : 'Public posts'}</h3>
        {postsLoading ? (
          <p role="status" className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل المنشورات…' : 'Loading posts…'}
          </p>
        ) : posts.length === 0 ? (
          <p data-testid="network-member-posts-empty" className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            {isAr
              ? 'لا منشورات علنية بعد. المنشورات المخصّصة للأعضاء لا تظهر هنا — لا لغيرهم ولا هنا.'
              : 'No public posts yet. Members-only posts do not appear here — for anyone.'}
          </p>
        ) : (
          <ul data-testid="network-member-posts" className="mt-1.5 space-y-2">
            {posts.map(post => (
              <li key={post.id} data-testid="network-member-post" className="min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-400">{post.ndtMethod}</span>
                  <span className="text-[9px] text-slate-500">{shortDate(post.createdAt, isAr)}</span>
                </div>
                <h4 className="mt-1 text-[11px] font-bold leading-snug text-white">{post.title}</h4>
                <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400">{post.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {backButton}
        <p className="text-[9px] text-slate-600">
          {isAr ? 'الصفحة تُقرأ من بطاقتك المهنية نفسها — لا نسخة ثانية.' : 'This page reads your one professional card — there is no second copy.'}
        </p>
      </div>
    </div>
  );
};

export default NetworkMemberProfile;
