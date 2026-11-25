import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Camera,
  Check,
  CircleAlert,
  Download,
  ExternalLink,
  Flag,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Linkedin,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Send,
  Share2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import type {
  CommunityConnection,
  CommunityNdtMethod,
  CommunityPost,
  CommunityPostType,
  CommunityWorkspaceProfile,
} from '../../client/types';
import type { Language } from '../../types';
import { NetworkRecommendationsPanel, NetworkSkillsPanel } from './NetworkReputation';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { AiGeneratedBadge, ReputationScorePill, VerificationTrackBadges } from './NetworkBadges';
import {
  CAREER_ROLES,
  PROFILE_LANGUAGES,
  RELATED_ENGINEERING_FIELDS,
  buildMemberCvHtml,
  computeMemberReputationSummary,
  computeVerificationTrackState,
} from '../../network/networkTaxonomy';
import { readAccountAcademyProgress } from '../../account/academyAccountProgress';
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
  onOpenMember?: (uid: string) => void;
  onOpenMessage?: (uid: string) => void;
  onOpenEmail?: (uid?: string) => void;
  onOpenVerify?: () => void;
  onOpenAcademy?: () => void;
  onOpenCompany?: () => void;
  slowAfterMs?: number;
}

type ProfileTab = 'posts' | 'about' | 'friends' | 'photos' | 'skills' | 'recommendations';

const WALL_NDT_METHODS: CommunityNdtMethod[] = [
  'GENERAL',
  'RT',
  'UT',
  'PAUT',
  'TOFD',
  'MT',
  'PT',
  'VT',
  'ET',
  'PWHT',
  'AR',
];

const WALL_POST_TYPES: { id: CommunityPostType; ar: string; en: string }[] = [
  { id: 'discussion', ar: 'نقاش وخبرة ميدانية', en: 'Field insight & discussion' },
  { id: 'technical_case', ar: 'دراسة حالة / سؤال فني', en: 'Technical case / Q&A' },
  { id: 'equipment_review', ar: 'تقييم معدات فحص', en: 'Equipment review' },
  { id: 'job_tender', ar: 'فرصة أو مناقصة', en: 'Opportunity / tender' },
];

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
    return new Date(at).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date(at).toISOString().slice(0, 10);
  }
};

const availabilityLabel = (id: string | undefined, isAr: boolean): string | null => {
  const found = NETWORK_AVAILABILITY.find(item => item.id === id);
  return found ? (isAr ? found.ar : found.en) : null;
};

/**
 * `#network/people/<uid>` — Facebook-style personal engineering page with cover banner,
 * overlapping profile avatar, navigation bar, two-column timeline + wall composer,
 * INSCO site-direction tools, and direct Messenger + Internal Email entry points.
 */
export const NetworkMemberProfile: React.FC<NetworkMemberProfileProps> = ({
  uid,
  language,
  onOpenAccount,
  onOpenProfile,
  onOpenDirectory,
  onOpenMember,
  onOpenMessage,
  onOpenEmail,
  onOpenVerify,
  onOpenAcademy,
  onOpenCompany,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);

  const [profile, setProfile] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [directoryMembers, setDirectoryMembers] = useState<CommunityWorkspaceProfile[]>([]);
  const [myConnections, setMyConnections] = useState<CommunityConnection[]>([]);

  const [tab, setTab] = useState<ProfileTab>('posts');
  const [following, setFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  // Wall inline composer state (visible to owner on timeline)
  const [wallType, setWallType] = useState<CommunityPostType>('discussion');
  const [wallMethod, setWallMethod] = useState<CommunityNdtMethod>('GENERAL');
  const [wallTitle, setWallTitle] = useState('');
  const [wallBody, setWallBody] = useState('');
  const [wallMediaUrl, setWallMediaUrl] = useState('');
  const [wallVisibility, setWallVisibility] = useState<'public' | 'members_only'>('public');
  const [wallPosting, setWallPosting] = useState(false);
  const [wallNotice, setWallNotice] = useState<string | null>(null);

  const serviceReady = account?.available ?? false;
  const myUid = account?.user?.uid ?? null;
  const signedIn = Boolean(myUid);
  const verified = account?.verified ?? false;
  const isMine = myUid === uid;

  useEffect(() => {
    setProfile(null);
    setDenied(false);
    setError(null);
    setPosts([]);
    setPostsLoading(true);
    setSlow(false);
    setTab('posts');
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

  const access = useMemo(
    () => publicPageAccess(profile, { signedIn, verified }),
    [profile, signedIn, verified]
  );
  const visible = access.state === 'ok';

  useEffect(() => {
    if (!serviceReady || !visible) {
      setPostsLoading(false);
      return;
    }
    let active = true;
    const unsubs: Array<() => void> = [];
    setPostsLoading(true);
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeAuthorPublicPosts(
          uid,
          next => {
            if (!active) return;
            setPosts(next);
            setPostsLoading(false);
          },
          () => {
            if (active) setPostsLoading(false);
          }
        )
      );
      if (typeof api.subscribeCommunityWorkspaces === 'function') {
        unsubs.push(
          api.subscribeCommunityWorkspaces(
            false,
            list => {
              if (active) setDirectoryMembers(list);
            },
            () => {}
          )
        );
      }
      if (myUid && typeof api.subscribeMyConnections === 'function') {
        unsubs.push(
          api.subscribeMyConnections(
            myUid,
            list => {
              if (active) setMyConnections(list);
            },
            () => {}
          )
        );
      }
    });
    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [uid, myUid, serviceReady, visible]);

  useEffect(() => {
    if (!serviceReady || !myUid || isMine) {
      setFollowing(false);
      return;
    }
    let active = true;
    let stop: (() => void) | undefined;
    void import('../../client/networkPlatformService')
      .then(api => {
        if (!active || !api.subscribeMyFollows) return;
        stop = api.subscribeMyFollows(myUid, list => {
          if (!active) return;
          setFollowing(list.some(f => f.targetType === 'member' && f.targetId === uid));
        });
      })
      .catch(() => {});
    return () => {
      active = false;
      stop?.();
    };
  }, [serviceReady, myUid, uid, isMine]);

  const copyLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#network/people/${uid}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* Clipboard can be blocked; the link is still visible in the address bar. */
    }
  }, [uid]);

  const handleToggleFollow = useCallback(async () => {
    const user = account?.user;
    if (!user || !profile || isMine || togglingFollow) return;
    setTogglingFollow(true);
    try {
      const api = await import('../../client/networkPlatformService');
      const nextState = await api.toggleFollow(user, 'member', uid, profile.displayName);
      setFollowing(nextState);
    } catch {
      /* handled softly */
    } finally {
      setTogglingFollow(false);
    }
  }, [account?.user, profile, isMine, togglingFollow, uid]);

  const handleExportCv = useCallback(() => {
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

  const handlePublishWallPost = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !profile || !isMine || !verified) return;
      if (wallTitle.trim().length < 3 || wallBody.trim().length < 5) return;
      setWallPosting(true);
      setWallNotice(null);
      try {
        const api = await import('../../client/firestoreClientService');
        await api.createCommunityPost(user, {
          authorName: profile.displayName,
          authorHeadline: profile.headline,
          authorOrg: profile.organizationName,
          authorCompanyCode: profile.companyCode,
          postType: wallType,
          ndtMethod: wallMethod,
          title: wallTitle.trim(),
          body: wallBody.trim(),
          mediaUrl: wallMediaUrl.trim().startsWith('https://') ? wallMediaUrl.trim() : undefined,
          visibility: wallVisibility,
        });
        setWallTitle('');
        setWallBody('');
        setWallMediaUrl('');
        setWallNotice(
          wallVisibility === 'public'
            ? isAr
              ? 'تم نشر المنشور على حائط صفحتك.'
              : 'Published to your profile wall.'
            : isAr
              ? 'تم نشر المنشور للأعضاء المؤكَّدين.'
              : 'Published for confirmed members.'
        );
      } catch (err) {
        setWallNotice(err instanceof Error ? err.message : String(err));
      } finally {
        setWallPosting(false);
      }
    },
    [
      account?.user,
      isAr,
      isMine,
      profile,
      verified,
      wallBody,
      wallMediaUrl,
      wallMethod,
      wallTitle,
      wallType,
      wallVisibility,
    ]
  );

  const handleSubmitReport = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !profile || !reportReason.trim()) return;
      try {
        const api = await import('../../client/networkPlatformService');
        await api.submitModerationReport(user, {
          reporterName: account?.user?.displayName || user.uid,
          targetType: 'user',
          targetId: uid,
          targetTitle: profile.displayName,
          reason: reportReason.trim(),
        });
        setReportReason('');
        setReportOpen(false);
        setReportStatus(isAr ? 'تم إرسال البلاغ للمراجعة.' : 'Report submitted for moderation review.');
      } catch {
        setReportStatus(isAr ? 'تعذّر إرسال البلاغ.' : 'Could not send report.');
      }
    },
    [account?.user, isAr, profile, reportReason, uid]
  );

  const connectedPeerUids = useMemo(() => {
    const set = new Set<string>();
    for (const c of myConnections) {
      if (c.status === 'connected') {
        set.add(c.fromUid === uid ? c.toUid : c.fromUid);
      }
    }
    return set;
  }, [myConnections, uid]);

  const networkPeers = useMemo(() => {
    const others = directoryMembers.filter(m => m.uid !== uid);
    return [...others].sort((a, b) => {
      const aConn = connectedPeerUids.has(a.uid) ? 1 : 0;
      const bConn = connectedPeerUids.has(b.uid) ? 1 : 0;
      return bConn - aConn;
    });
  }, [connectedPeerUids, directoryMembers, uid]);

  const galleryMedia = useMemo(() => {
    const items: { id: string; url: string; label: string; kind: 'banner' | 'avatar' | 'post' }[] = [];
    if (profile?.bannerURL) {
      items.push({
        id: 'profile-banner',
        url: profile.bannerURL,
        label: isAr ? 'صورة الغلاف (البانر)' : 'Cover banner',
        kind: 'banner',
      });
    }
    if (profile?.photoURL) {
      items.push({
        id: 'profile-photo',
        url: profile.photoURL,
        label: isAr ? 'الصورة الشخصية' : 'Profile photo',
        kind: 'avatar',
      });
    }
    for (const p of posts) {
      if (p.mediaUrl) {
        items.push({
          id: `post-${p.id}`,
          url: p.mediaUrl,
          label: p.title,
          kind: 'post',
        });
      }
    }
    return items;
  }, [isAr, posts, profile?.bannerURL, profile?.photoURL]);

  if (!serviceReady) {
    return (
      <div data-testid="network-member-unavailable" className={`${s.card} p-4`}>
        <div className={`flex items-center gap-2 text-sm font-bold ${s.heading}`}>
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'الصفحة غير متاحة في هذه النسخة' : 'This page is not available in this build'}
        </div>
        <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'لم يُهيَّأ اتصال Firebase، فلا يمكن قراءة بطاقة حقيقية — ولن نعرض بطاقة تجريبية بدلاً منها.'
            : 'Firebase is not initialised, so no real card can be read — and we will not show a trial card instead.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-testid="network-member-loading" className={`${s.card} p-4`}>
        {slow ? (
          <>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
            </div>
            <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
              {isAr
                ? 'لم تصل البطاقة بعد — هذه ليست صفحة فارغة، بل اتصال لم يكتمل.'
                : 'The card has not arrived yet — this is not an empty page, but an unfinished connection.'}
            </p>
          </>
        ) : (
          <p role="status" className={`flex items-center gap-2 text-[11px] ${s.subtext}`}>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل البطاقة…' : 'Loading the card…'}
          </p>
        )}
      </div>
    );
  }

  const deadEnd = (testId: string, title: string, body: string, action?: React.ReactNode) => (
    <div data-testid={testId} className={`mx-auto max-w-xl ${s.card} p-5 text-center`}>
      <Lock className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
      <p className={`mt-2 text-sm font-bold ${s.heading}`}>{title}</p>
      <p className={`mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed ${s.subtext}`}>{body}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{action}</div>
    </div>
  );

  const backButton = (
    <button type="button" onClick={onOpenDirectory} className={s.buttonSecondary}>
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
          className={s.buttonPrimary}
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

  /* ------------------------------ Facebook Page ----------------------------- */

  const palette = bannerPaletteFor(profile.sector ?? '');
  const availability = availabilityLabel(profile.availabilityStatus, isAr);
  const membersOnly = visibilityById(profile.profileVisibility) === 'members';
  const reputationSummary = computeMemberReputationSummary({
    postsCount: posts.length,
    acceptedAnswersCount: 0,
    endorsementsCount: profile.endorsementsCount ?? 0,
  });
  const careerRole = CAREER_ROLES.find(r => r.id === profile.professionalRole);
  const relatedFieldsList = (Array.isArray(profile.relatedFields)
    ? profile.relatedFields
    : typeof profile.relatedFields === 'string' && profile.relatedFields
      ? String(profile.relatedFields).split(',').map(v => v.trim()).filter(Boolean)
      : []
  ).map(id => RELATED_ENGINEERING_FIELDS.find(f => f.id === id) ?? { id, ar: id, en: id });
  const languagesList = (Array.isArray(profile.languages)
    ? profile.languages
    : typeof profile.languages === 'string' && profile.languages
      ? String(profile.languages).split(',').map(v => v.trim()).filter(Boolean)
      : []
  ).map(id => PROFILE_LANGUAGES.find(l => l.id === id) ?? { id, ar: id, en: id });
  const academySession = isMine ? readAccountAcademyProgress() : null;
  const canMessage = !isMine && profile.messagePolicy !== 'none' && Boolean(onOpenMessage);

  return (
    <div data-testid="network-member-live" className="mx-auto min-w-0 max-w-5xl space-y-3">
      {/* Facebook-style Cover Banner + Overlapping Avatar + Primary Actions + Navigation Bar */}
      <section className={`overflow-hidden ${s.card}`}>
        {/* Cover Banner */}
        <div
          className="relative max-h-64 w-full overflow-hidden"
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
              <span className="text-[11px] font-bold tracking-wide" style={{ color: palette.accent }}>
                {isAr ? 'لا بانر بعد' : 'No banner yet'}
              </span>
            </div>
          )}

          {/* Measured bottom scrim for visual depth & action button legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {isMine ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-lg border border-white/30 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm transition cursor-pointer hover:bg-black/75"
            >
              <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAr ? 'تعديل الغلاف والبطاقة' : 'Edit cover & profile'}
            </button>
          ) : null}
        </div>

        {/* Profile Identity Row (Overlapping Avatar + Name + Action Buttons) */}
        <div className="px-4 pb-2 pt-2">
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
              {/* Overlapping Avatar */}
              <div className="relative -mt-12 shrink-0 sm:-mt-16">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    data-testid="network-member-photo"
                    className={`h-24 w-24 shrink-0 rounded-full border-4 object-cover shadow-xl sm:h-28 sm:w-28 ${
                      isLight ? 'border-white bg-white' : 'border-[#111128] bg-[#111128]'
                    }`}
                    loading="lazy"
                  />
                ) : (
                  <div
                    data-testid="network-member-photo-placeholder"
                    className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 text-xl font-black shadow-xl sm:h-28 sm:w-28 ${
                      isLight ? 'border-white' : 'border-[#111128]'
                    }`}
                    style={{ background: palette.to, color: palette.ink }}
                  >
                    {initialsOf(profile.displayName)}
                  </div>
                )}
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 data-testid="network-member-name" className={`text-lg font-black leading-snug sm:text-xl ${s.heading}`}>
                    {profile.displayName}
                  </h2>
                  <VerificationTrackBadges profile={profile} language={language} isLight={isLight} />
                </div>
                {profile.headline ? (
                  <p className={`mt-0.5 text-xs font-medium leading-relaxed ${s.subtext}`}>{profile.headline}</p>
                ) : null}
                {careerRole ? (
                  <p className="mt-0.5 text-[11px] font-bold text-violet-400">
                    {isAr ? careerRole.ar : careerRole.en}
                  </p>
                ) : null}

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {availability ? (
                    <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
                      {availability}
                    </span>
                  ) : null}
                  <span className={s.chip}>{profile.sector}</span>
                  <ReputationScorePill summary={reputationSummary} language={language} isLight={isLight} />
                  {membersOnly ? (
                    <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                      {isAr ? 'للأعضاء المؤكَّدين' : 'Confirmed members'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Facebook Action Strip */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              {!isMine && signedIn ? (
                <button
                  type="button"
                  onClick={() => void handleToggleFollow()}
                  disabled={togglingFollow}
                  data-testid="network-member-follow"
                  className={following ? s.buttonPrimary : s.buttonSecondary}
                >
                  {following ? (
                    <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  )}
                  {following ? (isAr ? 'متابَع' : 'Following') : isAr ? 'متابعة' : 'Follow'}
                </button>
              ) : null}

              {canMessage ? (
                <button
                  type="button"
                  onClick={() => (signedIn ? onOpenMessage?.(uid) : onOpenAccount('signin'))}
                  data-testid="network-member-message"
                  className={s.buttonPrimary}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {isAr ? 'مراسلة' : 'Message'}
                </button>
              ) : null}

              {!isMine && onOpenEmail ? (
                <button
                  type="button"
                  onClick={() => (signedIn ? onOpenEmail(uid) : onOpenAccount('signin'))}
                  data-testid="network-member-email"
                  className={s.buttonSecondary}
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                  {isAr ? 'بريد داخلي' : 'Platform Mail'}
                </button>
              ) : null}

              {isMine ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    data-testid="network-member-edit"
                    className={s.buttonPrimary}
                  >
                    <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {isAr ? 'تعديل بطاقتي' : 'Edit my card'}
                  </button>
                  {onOpenEmail ? (
                    <button
                      type="button"
                      onClick={() => onOpenEmail()}
                      data-testid="network-member-open-inbox"
                      className={s.buttonSecondary}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                      {isAr ? 'صندوق البريد' : 'Inbox'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className={s.buttonSecondary}
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" /> : <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    {copiedLink ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ الرابط' : 'Copy link'}
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={handleExportCv}
                data-testid="network-member-export-cv"
                className={s.buttonSecondary}
              >
                <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {isAr ? 'تصدير CV' : 'Export CV'}
              </button>

              {profile.linkedInUrl ? (
                <a
                  href={profile.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  data-testid="network-member-linkedin"
                  className="inline-flex items-center gap-1 rounded-lg border border-sky-500/50 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-400 transition hover:border-sky-300"
                >
                  <Linkedin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  LinkedIn
                </a>
              ) : null}

              {!isMine && signedIn ? (
                <button
                  type="button"
                  onClick={() => setReportOpen(v => !v)}
                  className={s.buttonSecondary}
                  title={isAr ? 'إبلاغ' : 'Report'}
                >
                  <Flag className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          {reportStatus ? (
            <p className="mt-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">
              {reportStatus}
            </p>
          ) : null}

          {reportOpen ? (
            <form onSubmit={handleSubmitReport} className={`mt-2 ${s.subCard} flex flex-wrap items-center gap-2 p-2`}>
              <input
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder={isAr ? 'سبب الإبلاغ للإدارة…' : 'Reason for moderation review…'}
                className={`${s.input} flex-1`}
              />
              <button type="submit" className={s.buttonPrimary}>
                {isAr ? 'إرسال البلاغ' : 'Submit report'}
              </button>
            </form>
          ) : null}

          {/* Facebook-Style Horizontal Profile Navigation Tabs */}
          <div
            data-testid="network-member-tabs"
            role="tablist"
            className={`mt-3 flex min-w-0 flex-wrap gap-1 border-t pt-2 ${s.divider}`}
          >
            {(
              [
                { id: 'posts', ar: 'المنشورات واليوميات', en: 'Timeline & Posts' },
                { id: 'about', ar: 'حول', en: 'About' },
                { id: 'friends', ar: 'الشبكة والزملاء', en: 'Connections' },
                { id: 'photos', ar: 'المعرض الهندسي', en: 'Media' },
                { id: 'skills', ar: 'المهارات والتزكيات', en: 'Skills & endorsements' },
                { id: 'recommendations', ar: 'التوصيات', en: 'Recommendations' },
              ] as const
            ).map(entry => {
              const active = tab === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`network-member-tab-${entry.id}`}
                  onClick={() => setTab(entry.id)}
                  className={`min-w-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                    active
                      ? isLight
                        ? 'bg-violet-600 text-white'
                        : 'bg-violet-500/25 text-violet-200 ring-1 ring-violet-400/50'
                      : `${s.subtext} hover:bg-violet-500/10`
                  }`}
                >
                  {isAr ? entry.ar : entry.en}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* TAB: Timeline & Posts (2-Column Facebook Layout) */}
      {tab === 'posts' ? (
        <div className="grid min-w-0 gap-3 lg:grid-cols-[310px_minmax(0,1fr)]">
          {/* Left Intro & Site-Direction Tools Column */}
          <aside className="min-w-0 space-y-3">
            {/* Intro Card */}
            <div className={`${s.card} space-y-2.5 p-3`}>
              <h3 className={`text-xs font-black ${s.heading}`}>
                {isAr ? 'نبذة تعريفية (Intro)' : 'Intro'}
              </h3>

              {profile.bio ? (
                <p className={`whitespace-pre-wrap text-[11px] leading-relaxed ${s.subtext}`}>{profile.bio}</p>
              ) : null}

              <ul className={`space-y-1.5 border-t pt-2 text-[11px] ${s.divider} ${s.subtext}`}>
                <li className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                  <span>{profile.organizationName}</span>
                </li>
                {profile.city ? (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                    <span>{profile.city}</span>
                  </li>
                ) : null}
                {typeof profile.yearsExperience === 'number' ? (
                  <li className="flex items-start gap-2">
                    <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                    <span>{isAr ? `${profile.yearsExperience} سنة خبرة` : `${profile.yearsExperience} yrs`}</span>
                  </li>
                ) : null}
                {typeof profile.followersCount === 'number' || posts.length > 0 ? (
                  <li className="flex items-start gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                    <span className="font-mono text-[10px] tabular-nums">
                      {isAr
                        ? `${posts.length} منشور · ${profile.followersCount ?? 0} متابع`
                        : `${posts.length} posts · ${profile.followersCount ?? 0} followers`}
                    </span>
                  </li>
                ) : null}
              </ul>

              {profile.specialtyTrades ? (
                <div className={`${s.subCard} p-2`}>
                  <p className={`text-[9px] font-bold ${s.muted}`}>{isAr ? 'التخصصات وطرق الفحص' : 'Specialities'}</p>
                  <p className={`mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed ${s.subtext}`}>
                    {profile.specialtyTrades}
                  </p>
                </div>
              ) : null}

              {profile.certifications ? (
                <div className={`${s.subCard} p-2`}>
                  <div className={`flex flex-wrap items-center gap-1 text-[9px] font-bold ${s.muted}`}>
                    <span>{isAr ? 'شهادات معلنة' : 'Declared certificates'}</span>
                    <span className="rounded bg-amber-500/15 px-1 text-[8px] font-bold text-amber-400">
                      {isAr ? 'غير مُتحقَّق منها' : 'not verified'}
                    </span>
                  </div>
                  <p className={`mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed ${s.subtext}`}>
                    {profile.certifications}
                  </p>
                </div>
              ) : null}

              {relatedFieldsList.length > 0 || languagesList.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {relatedFieldsList.map(field => (
                    <span key={field.id} className={s.chip}>
                      {isAr ? field.ar : field.en}
                    </span>
                  ))}
                  {languagesList.map(lang => (
                    <span
                      key={lang.id}
                      className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400"
                    >
                      {isAr ? lang.ar : lang.en}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* INSCO Site-Direction Tools Card */}
            <div data-testid="network-member-site-tools" className={`${s.card} space-y-2 p-3`}>
              <h3 className={`flex items-center gap-1.5 text-xs font-black ${s.heading}`}>
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                {isAr ? 'أدوات توجهات منصة إنسكو' : 'INSCO Platform Direction Tools'}
              </h3>
              <p className={`text-[10px] leading-relaxed ${s.subtext}`}>
                {isAr
                  ? 'وصول مباشر لأدوات الفحص الهندسي، الأكاديمية، مسارات التوثيق الثلاثة، والتواصل الرسمي.'
                  : 'Direct integration across NDT inspection, Academy milestones, 3-track verification, and member communication.'}
              </p>

              {profile.shareAcademyProgress ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {isAr ? 'مشاركة إنجاز الأكاديمية (اختياري)' : 'Opted-in Academy Achievements'}
                  </div>
                  <p className={`mt-0.5 ${s.subtext}`}>
                    {academySession && academySession.modules.size > 0
                      ? isAr
                        ? `وحدات منجزة في الحساب: ${academySession.modules.size}`
                        : `Completed Academy modules in account: ${academySession.modules.size}`
                      : isAr
                        ? 'فعّل العضو عرض تقدمه في أكاديمية إنسكو على بطاقته العامة.'
                        : 'Member opted in to highlight their INSCO Academy study milestones.'}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-1.5">
                {onOpenVerify ? (
                  <button type="button" onClick={onOpenVerify} className={`${s.buttonSecondary} w-full justify-start`}>
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                    {isAr ? 'مسار توثيق الهوية والشهادات' : 'Verification & Credentials Hub'}
                  </button>
                ) : null}
                {onOpenEmail ? (
                  <button
                    type="button"
                    onClick={() => (isMine ? onOpenEmail() : onOpenEmail(uid))}
                    className={`${s.buttonSecondary} w-full justify-start`}
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                    {isMine
                      ? isAr
                        ? 'البريد الإلكتروني الداخلي (صندوقي)'
                        : 'Internal Engineering Mail'
                      : isAr
                        ? 'إرسال بريد إلكتروني بالمنصة'
                        : 'Send Internal Platform Email'}
                  </button>
                ) : null}
                {onOpenAcademy ? (
                  <button type="button" onClick={onOpenAcademy} className={`${s.buttonSecondary} w-full justify-start`}>
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                    {isAr ? 'أكاديمية إنسكو للتدريب' : 'INSCO Academy'}
                  </button>
                ) : null}
                {onOpenCompany ? (
                  <button type="button" onClick={onOpenCompany} className={`${s.buttonSecondary} w-full justify-start`}>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
                    {isAr ? 'بوابة الشركات والتفتيش' : 'Company & Inspection Portal'}
                  </button>
                ) : null}
              </div>
            </div>
          </aside>

          {/* Right Timeline Wall Column */}
          <div className="min-w-0 space-y-3">
            {isMine && signedIn && verified ? (
              <form
                onSubmit={handlePublishWallPost}
                data-testid="network-member-wall-composer"
                className={`${s.card} space-y-2 p-3`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`flex items-center gap-1.5 text-xs font-black ${s.heading}`}>
                    <Pencil className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                    {isAr ? 'انشر تحديثاً هندسياً على صفحتك' : 'Post an engineering update on your wall'}
                  </h3>
                  <select
                    value={wallVisibility}
                    onChange={e => setWallVisibility(e.target.value as 'public' | 'members_only')}
                    aria-label={isAr ? 'خصوصية المنشور' : 'Post visibility'}
                    className={`${s.input} w-auto`}
                  >
                    <option value="public">{isAr ? 'عام للجميع' : 'Public'}</option>
                    <option value="members_only">{isAr ? 'للأعضاء المؤكَّدين' : 'Confirmed members'}</option>
                  </select>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={wallType}
                    onChange={e => setWallType(e.target.value as CommunityPostType)}
                    aria-label={isAr ? 'نوع المنشور' : 'Post type'}
                    className={s.input}
                  >
                    {WALL_POST_TYPES.map(t => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.ar : t.en}
                      </option>
                    ))}
                  </select>
                  <select
                    value={wallMethod}
                    onChange={e => setWallMethod(e.target.value as CommunityNdtMethod)}
                    aria-label={isAr ? 'طريقة الفحص' : 'NDT method'}
                    className={s.input}
                  >
                    {WALL_NDT_METHODS.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  value={wallTitle}
                  onChange={e => setWallTitle(e.target.value)}
                  maxLength={180}
                  required
                  minLength={3}
                  placeholder={isAr ? 'عنوان المنشور أو التجربة الميدانية…' : 'Headline of your engineering note…'}
                  className={s.input}
                />
                <textarea
                  value={wallBody}
                  onChange={e => setWallBody(e.target.value)}
                  rows={3}
                  maxLength={3000}
                  required
                  minLength={5}
                  placeholder={
                    isAr
                      ? 'شارك ملاحظة فحص، صورة تجهيز، أو ملخص تجربة…'
                      : 'Share an inspection insight, field setup, or case summary…'
                  }
                  className={`${s.input} resize-none`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={wallMediaUrl}
                    onChange={e => setWallMediaUrl(e.target.value)}
                    dir="ltr"
                    maxLength={500}
                    placeholder={isAr ? 'رابط صورة اختياري (https://…)' : 'Optional image link (https://…)'}
                    className={`${s.input} flex-1`}
                  />
                  <button
                    type="submit"
                    disabled={wallPosting || wallTitle.trim().length < 3 || wallBody.trim().length < 5}
                    className={s.buttonPrimary}
                  >
                    {wallPosting ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    {isAr ? 'نشر على الحائط' : 'Post to wall'}
                  </button>
                </div>
                {wallNotice ? (
                  <p role="status" className="text-[10px] font-bold text-emerald-400">
                    {wallNotice}
                  </p>
                ) : null}
              </form>
            ) : null}

            <div className={`${s.card} p-3`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className={`text-xs font-black ${s.heading}`}>
                  {isAr ? 'منشورات علنية' : 'Public posts'}
                </h3>
                <span className={`font-mono text-[10px] tabular-nums ${s.muted}`}>
                  {posts.length}
                </span>
              </div>
              {postsLoading ? (
                <p role="status" className={`mt-2 flex items-center gap-2 text-[10px] ${s.subtext}`}>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                  {isAr ? 'جارٍ تحميل المنشورات…' : 'Loading posts…'}
                </p>
              ) : posts.length === 0 ? (
                <p data-testid="network-member-posts-empty" className={`mt-2 text-[10px] leading-relaxed ${s.muted}`}>
                  {isAr
                    ? 'لا منشورات علنية بعد. المنشورات المخصّصة للأعضاء لا تظهر هنا — لا لغيرهم ولا هنا.'
                    : 'No public posts yet. Members-only posts do not appear here — for anyone.'}
                </p>
              ) : (
                <ul data-testid="network-member-posts" className="mt-2.5 space-y-2.5">
                  {posts.map(post => (
                    <li key={post.id} data-testid="network-member-post" className={`min-w-0 ${s.subCard} p-3`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {profile.photoURL ? (
                            <img
                              src={profile.photoURL}
                              alt=""
                              className="h-7 w-7 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                              style={{ background: palette.to, color: palette.ink }}
                            >
                              {initialsOf(profile.displayName)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className={`truncate text-[11px] font-bold ${s.heading}`}>{profile.displayName}</p>
                            <p className={`text-[9px] ${s.muted}`}>{shortDate(post.createdAt, isAr)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={s.chip}>{post.ndtMethod}</span>
                          {post.isAiAssisted ? <AiGeneratedBadge language={language} isLight={isLight} /> : null}
                        </div>
                      </div>
                      <h4 className={`mt-2 text-xs font-bold leading-snug ${s.heading}`}>{post.title}</h4>
                      <p className={`mt-1 whitespace-pre-wrap text-[11px] leading-relaxed ${s.subtext}`}>{post.body}</p>
                      {post.mediaUrl ? (
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          loading="lazy"
                          className="mt-2 max-h-64 w-full rounded-lg border border-violet-500/20 object-cover"
                        />
                      ) : null}
                      {post.tags && post.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.tags.map(tag => (
                            <span key={tag} className={s.chip}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB: About / Engineering Dossier */}
      {tab === 'about' ? (
        <div data-testid="network-member-about" className={`${s.card} space-y-3 p-4`}>
          <h3 className={`text-sm font-black ${s.heading}`}>
            {isAr ? 'الملف الهندسي التفصيلي' : 'Detailed Engineering Profile'}
          </h3>
          {profile.bio ? (
            <div className={`${s.subCard} p-3`}>
              <p className={`text-[10px] font-bold ${s.muted}`}>{isAr ? 'النبذة الشخصية' : 'Biography'}</p>
              <p className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${s.subtext}`}>{profile.bio}</p>
            </div>
          ) : null}
          <dl className="grid min-w-0 gap-2.5 sm:grid-cols-2">
            {profile.experienceSummary ? (
              <div className={`min-w-0 ${s.subCard} p-3 sm:col-span-2`}>
                <dt className={`text-[10px] font-bold ${s.muted}`}>{isAr ? 'الخبرة العملية والمناصب' : 'Work Experience'}</dt>
                <dd className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${s.subtext}`}>{profile.experienceSummary}</dd>
              </div>
            ) : null}
            {profile.educationSummary ? (
              <div className={`min-w-0 ${s.subCard} p-3`}>
                <dt className={`text-[10px] font-bold ${s.muted}`}>{isAr ? 'التعليم والتأهيل الأكاديمي' : 'Education'}</dt>
                <dd className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${s.subtext}`}>{profile.educationSummary}</dd>
              </div>
            ) : null}
            {profile.projectsSummary ? (
              <div className={`min-w-0 ${s.subCard} p-3`}>
                <dt className={`text-[10px] font-bold ${s.muted}`}>{isAr ? 'المشاريع الميدانية' : 'Field projects'}</dt>
                <dd className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${s.subtext}`}>{profile.projectsSummary}</dd>
              </div>
            ) : null}
            {profile.specialtyTrades ? (
              <div className={`min-w-0 ${s.subCard} p-3`}>
                <dt className={`text-[10px] font-bold ${s.muted}`}>{isAr ? 'التخصصات' : 'Specialities'}</dt>
                <dd className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${s.subtext}`}>{profile.specialtyTrades}</dd>
              </div>
            ) : null}
            {profile.certifications ? (
              <div className={`min-w-0 ${s.subCard} p-3`}>
                <dt className={`flex items-center gap-1.5 text-[10px] font-bold ${s.muted}`}>
                  <span>{isAr ? 'شهادات معلنة' : 'Declared certificates'}</span>
                  <span className="rounded bg-amber-500/15 px-1 text-[9px] font-bold text-amber-400">
                    {isAr ? 'غير مُتحقَّق منها' : 'not verified'}
                  </span>
                </dt>
                <dd className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${s.subtext}`}>{profile.certifications}</dd>
              </div>
            ) : null}
          </dl>
          {languagesList.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
              <span className={`text-[10px] font-bold ${s.muted}`}>{isAr ? 'لغات العمل:' : 'Languages:'}</span>
              {languagesList.map(lang => (
                <span key={lang.id} className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                  {isAr ? lang.ar : lang.en}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TAB: Friends & Network Connections */}
      {tab === 'friends' ? (
        <div data-testid="network-member-friends" className={`${s.card} space-y-3 p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={`flex items-center gap-1.5 text-sm font-black ${s.heading}`}>
              <Users className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'الشبكة والزملاء في المنصة' : 'Network & Engineering Colleagues'}
            </h3>
            <span className={`font-mono text-[10px] tabular-nums ${s.muted}`}>{networkPeers.length}</span>
          </div>

          {networkPeers.length === 0 ? (
            <p className={`text-xs ${s.subtext}`}>
              {isAr ? 'لا يوجد أعضاء منشورون آخرون في الشبكة حتى الآن.' : 'No other published members in the directory yet.'}
            </p>
          ) : (
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {networkPeers.slice(0, 18).map(peer => {
                const isConnected = connectedPeerUids.has(peer.uid);
                return (
                  <li key={peer.uid} className={`${s.subCard} flex flex-col justify-between gap-2 p-3`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      {peer.photoURL ? (
                        <img
                          src={peer.photoURL}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400">
                          {initialsOf(peer.displayName)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          {onOpenMember ? (
                            <button
                              type="button"
                              onClick={() => onOpenMember(peer.uid)}
                              className={`truncate text-start text-xs font-bold hover:text-violet-400 hover:underline cursor-pointer ${s.heading}`}
                            >
                              {peer.displayName}
                            </button>
                          ) : (
                            <span className={`truncate text-xs font-bold ${s.heading}`}>{peer.displayName}</span>
                          )}
                          {isConnected ? (
                            <span className="shrink-0 rounded bg-emerald-500/15 px-1 text-[8px] font-bold text-emerald-400">
                              {isAr ? 'متصل' : 'Connected'}
                            </span>
                          ) : null}
                        </div>
                        <p className={`truncate text-[10px] ${s.subtext}`}>{peer.headline || peer.organizationName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {onOpenMember ? (
                        <button
                          type="button"
                          onClick={() => onOpenMember(peer.uid)}
                          className={s.buttonSecondary}
                        >
                          <UserRound className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {isAr ? 'الصفحة' : 'Profile'}
                        </button>
                      ) : null}
                      {onOpenMessage && peer.messagePolicy !== 'none' ? (
                        <button
                          type="button"
                          onClick={() => (signedIn ? onOpenMessage(peer.uid) : onOpenAccount('signin'))}
                          className={s.buttonSecondary}
                        >
                          <MessageSquare className="h-3 w-3 shrink-0 text-violet-400" aria-hidden="true" />
                          {isAr ? 'ماسنجر' : 'Chat'}
                        </button>
                      ) : null}
                      {onOpenEmail ? (
                        <button
                          type="button"
                          onClick={() => (signedIn ? onOpenEmail(peer.uid) : onOpenAccount('signin'))}
                          className={s.buttonSecondary}
                        >
                          <Mail className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                          {isAr ? 'بريد' : 'Mail'}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {/* TAB: Photos & Technical Media */}
      {tab === 'photos' ? (
        <div data-testid="network-member-photos" className={`${s.card} space-y-3 p-4`}>
          <h3 className={`flex items-center gap-1.5 text-sm font-black ${s.heading}`}>
            <ImageIcon className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
            {isAr ? 'الصور والوسائط الهندسية' : 'Engineering Photos & Media'}
          </h3>
          {galleryMedia.length === 0 ? (
            <p className={`text-xs ${s.subtext}`}>
              {isAr ? 'لم يضف العضو صوراً أو وسائط ميدانية بعد.' : 'No photos or field media uploaded yet.'}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {galleryMedia.map(item => (
                <figure key={item.id} className={`overflow-hidden ${s.subCard}`}>
                  <img
                    src={item.url}
                    alt={item.label}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                  <figcaption className={`truncate px-2.5 py-1.5 text-[10px] font-bold ${s.subtext}`}>
                    {item.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'skills' ? (
        <NetworkSkillsPanel profile={profile} language={language} self={isMine} onOpenProfile={onOpenProfile} />
      ) : null}

      {tab === 'recommendations' ? (
        <NetworkRecommendationsPanel profile={profile} language={language} self={isMine} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {backButton}
        <p className={`text-[9px] ${s.muted}`}>
          {isAr
            ? 'الصفحة تُقرأ من بطاقتك المهنية نفسها — لا نسخة ثانية.'
            : 'This page reads your one professional card — there is no second copy.'}
        </p>
      </div>
    </div>
  );
};

export default NetworkMemberProfile;
