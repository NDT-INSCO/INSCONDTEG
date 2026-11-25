import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CircleAlert,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import type { CommunityConnection, CommunityWorkspaceProfile } from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { VerificationTrackBadges } from './NetworkBadges';
import { CAREER_ROLES, NDT_METHOD_TAXONOMY } from '../../network/networkTaxonomy';
import { NETWORK_AVAILABILITY, NETWORK_SECTORS } from '../../network/networkProfileForm';

interface NetworkDirectorySectionProps {
  language: Language;
  /** Opens the sign-in dialog so a member can add their own card. */
  onOpenAccount: () => void;
  /** Jumps to the profile form. */
  onOpenProfile: () => void;
  /** Opens `#network/people/<uid>` — the member's public page. */
  onOpenMember?: (uid: string) => void;
  /** Opens 1-on-1 DMs with the chosen member. */
  onOpenMessage?: (uid: string) => void;
  /** Opens internal platform email compose pre-addressed to this member. */
  onOpenEmail?: (uid: string) => void;
  slowAfterMs?: number;
}

const availabilityLabel = (id: string | undefined, isAr: boolean) => {
  const found = NETWORK_AVAILABILITY.find(item => item.id === id);
  if (!found) return null;
  return isAr ? found.ar : found.en;
};

/**
 * `#network/people` — the real member directory with verification filters, follow, connect, and DM launch.
 */
export const NetworkDirectorySection: React.FC<NetworkDirectorySectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  onOpenMember,
  onOpenMessage,
  onOpenEmail,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);

  const [members, setMembers] = useState<CommunityWorkspaceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [term, setTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const serviceReady = account?.available ?? false;
  const signedIn = Boolean(account?.user?.uid);
  const verified = account?.verified ?? false;
  const myUid = account?.user?.uid ?? null;

  const [connections, setConnections] = useState<CommunityConnection[]>([]);
  const [followedUids, setFollowedUids] = useState<Set<string>>(new Set());
  const [myCard, setMyCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [followingUid, setFollowingUid] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const connectedUids = useMemo(() => {
    const set = new Set<string>();
    for (const connection of connections) {
      if (connection.status === 'connected') set.add(connection.toUid);
    }
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
      stop = api.subscribeCommunityWorkspaces(
        false,
        next => {
          if (!active) return;
          setMembers(next);
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
  }, [serviceReady, attempt, slowAfterMs]);

  useEffect(() => {
    if (!serviceReady || !myUid) {
      setConnections([]);
      setFollowedUids(new Set());
      setMyCard(null);
      return;
    }
    let active = true;
    let stopConnections: (() => void) | undefined;
    let stopCard: (() => void) | undefined;
    let stopFollows: (() => void) | undefined;
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      stopConnections = api.subscribeMyConnections(
        myUid,
        next => {
          if (active) setConnections(next);
        },
        () => {}
      );
      stopCard = api.subscribeMyCommunityWorkspace(
        myUid,
        next => {
          if (active) setMyCard(next);
        },
        () => {}
      );
    });
    void import('../../client/networkPlatformService')
      .then(api => {
        if (!active || !api.subscribeMyFollows) return;
        stopFollows = api.subscribeMyFollows(myUid, rows => {
          if (active) {
            setFollowedUids(new Set(rows.filter(r => r.targetType === 'member').map(r => r.targetId)));
          }
        });
      })
      .catch(() => {});
    return () => {
      active = false;
      stopConnections?.();
      stopCard?.();
      stopFollows?.();
    };
  }, [serviceReady, myUid]);

  const connect = useCallback(
    async (target: { uid: string; displayName: string }) => {
      const user = account?.user;
      if (!user || !myCard || connecting) return;
      setConnecting(target.uid);
      setConnectError(null);
      try {
        const api = await import('../../client/firestoreClientService');
        await api.connectWithCommunityMember(user, myCard.displayName, {
          uid: target.uid,
          displayName: target.displayName,
        });
      } catch (failure) {
        setConnectError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setConnecting(null);
      }
    },
    [account?.user, connecting, myCard]
  );

  const toggleFollowMember = useCallback(
    async (target: CommunityWorkspaceProfile) => {
      const user = account?.user;
      if (!user || followingUid) return;
      setFollowingUid(target.uid);
      try {
        const api = await import('../../client/networkPlatformService');
        const next = await api.toggleFollow(user, 'member', target.uid, target.displayName);
        setFollowedUids(prev => {
          const updated = new Set(prev);
          if (next) updated.add(target.uid);
          else updated.delete(target.uid);
          return updated;
        });
      } catch {
        /* ignore */
      } finally {
        setFollowingUid(null);
      }
    },
    [account?.user, followingUid]
  );

  if (!serviceReady) {
    return (
      <div data-testid="network-directory-unavailable" className={`${s.card} p-4`}>
        <div className={`flex items-center gap-2 text-sm font-bold ${s.heading}`}>
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'دليل الأعضاء غير متاح في هذه النسخة' : 'The member directory is not available in this build'}
        </div>
        <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'لم يُهيَّأ اتصال Firebase، لذلك لا يوجد أعضاء حقيقيون لعرضهم — ولن نعرض أسماء وهمية بدلاً منهم.'
            : 'Firebase is not initialised, so there are no real members to show — and we will not show invented names instead.'}
        </p>
      </div>
    );
  }

  const needle = term.trim().toLowerCase();
  const visible = members.filter(member => {
    if (sectorFilter && member.sector !== sectorFilter) return false;
    if (roleFilter && member.professionalRole !== roleFilter) return false;
    if (methodFilter) {
      const hay = `${member.specialtyTrades ?? ''} ${member.headline ?? ''}`.toUpperCase();
      if (!hay.includes(methodFilter.toUpperCase())) return false;
    }
    if (verifiedOnly && !member.identityVerified && !member.organizationVerified && !member.credentialVerified) {
      return false;
    }
    if (!needle) return true;
    return [member.displayName, member.headline, member.organizationName, member.sector, member.city, member.specialtyTrades]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(needle));
  });

  return (
    <div data-testid="network-directory-live">
      <div className="mb-2.5 space-y-2">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className={`flex min-w-0 flex-1 items-center gap-1.5 ${s.subCard} px-2 py-1.5`}>
            <Search className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
            <input
              value={term}
              onChange={event => setTerm(event.target.value)}
              aria-label={isAr ? 'البحث في الأعضاء' : 'Search members'}
              placeholder={isAr ? 'ابحث بالاسم أو التخصص أو المدينة…' : 'Search by name, discipline or city…'}
              className={`min-w-0 flex-1 bg-transparent text-[11px] focus:outline-none ${s.heading}`}
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {signedIn ? (
              <button type="button" onClick={onOpenProfile} className={s.buttonPrimary}>
                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {isAr ? 'بطاقتي' : 'My card'}
              </button>
            ) : (
              <button type="button" onClick={onOpenAccount} className={s.buttonSecondary}>
                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {isAr ? 'أضف بطاقتك' : 'Add your card'}
              </button>
            )}
          </div>
        </div>

        <div className="grid min-w-0 gap-1.5 sm:grid-cols-4">
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            aria-label={isAr ? 'تصفية بالقطاع' : 'Filter by sector'}
            className={s.input}
          >
            <option value="">{isAr ? 'كل القطاعات' : 'All sectors'}</option>
            {NETWORK_SECTORS.map(sec => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            aria-label={isAr ? 'تصفية بطريقة الفحص' : 'Filter by NDT method'}
            className={s.input}
          >
            <option value="">{isAr ? 'كل طرق الفحص' : 'All NDT methods'}</option>
            {NDT_METHOD_TAXONOMY.map(m => (
              <option key={m.id} value={m.id}>
                {isAr ? m.ar : m.en}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            aria-label={isAr ? 'تصفية بالدور الوظيفي' : 'Filter by career role'}
            className={s.input}
          >
            <option value="">{isAr ? 'كل الأدوار الوظيفية' : 'All career roles'}</option>
            {CAREER_ROLES.map(r => (
              <option key={r.id} value={r.id}>
                {isAr ? r.ar : r.en}
              </option>
            ))}
          </select>

          <label className={`flex items-center gap-2 ${s.subCard} px-2.5 py-1.5 text-[10px] font-bold ${s.subtext}`}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="h-3.5 w-3.5 shrink-0 accent-violet-500"
            />
            {isAr ? 'الموثَّقون فقط' : 'Verified track only'}
          </label>
        </div>
      </div>

      {connectError ? (
        <p role="alert" className="mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
          {connectError}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
          {isAr ? `تعذّر تحميل الدليل: ${error}` : `Could not load the directory: ${error}`}
        </p>
      ) : null}

      {loading && slow ? (
        <div
          data-testid="network-directory-slow"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
          </div>
          <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
            {isAr
              ? 'لم يصل أي عضو بعد. هذا ليس دليلاً فارغاً — بل اتصال لم يكتمل. أعد المحاولة، أو تحقق من اتصالك بالشبكة.'
              : 'No member has arrived yet. This is not an empty directory — it is an unfinished connection. Retry, or check your network.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAttempt(current => current + 1);
            }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition cursor-pointer hover:border-amber-300"
          >
            <Loader2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : loading ? (
        <p role="status" className={`flex items-center gap-2 p-3 text-[11px] ${s.subtext}`}>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {isAr ? 'جارٍ تحميل الأعضاء…' : 'Loading members…'}
        </p>
      ) : visible.length === 0 ? (
        <div
          data-testid="network-directory-empty"
          className={`${s.subCard} border-dashed p-6 text-center`}
        >
          <Users className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
          <p className={`mt-2 text-xs font-bold ${s.heading}`}>
            {needle || sectorFilter || methodFilter || roleFilter || verifiedOnly
              ? isAr
                ? 'لا نتائج مطابقة'
                : 'No matching members'
              : isAr
                ? 'لا يوجد أعضاء منشورون بعد'
                : 'No published members yet'}
          </p>
          <p className={`mx-auto mt-1 max-w-md text-[10px] leading-relaxed ${s.muted}`}>
            {needle || sectorFilter || methodFilter || roleFilter || verifiedOnly
              ? isAr
                ? 'جرّب تعديل الفلاتر أو البحث بكلمة أخرى.'
                : 'Try adjusting the filters or search keyword.'
              : isAr
                ? 'الدليل يعرض البطاقات المنشورة فقط. أول بطاقة حقيقية تظهر هنا بمجرد حفظها وتأكيد البريد.'
                : 'The directory shows published cards only. The first real card appears here as soon as it is saved and the email is confirmed.'}
          </p>
        </div>
      ) : (
        <ul data-testid="network-directory-list" className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(member => {
            const availability = availabilityLabel(member.availabilityStatus, isAr);
            const isMe = member.uid === myUid;
            const isFollowing = followedUids.has(member.uid);
            const blocksDms = member.messagePolicy === 'none';

            return (
              <li
                key={member.uid}
                data-testid="network-member-card"
                className={`${s.card} min-w-0 p-3`}
              >
                <div className="flex min-w-0 items-start gap-2">
                  {member.photoURL ? (
                    <img
                      src={member.photoURL}
                      alt=""
                      data-testid="network-member-card-photo"
                      className="h-9 w-9 shrink-0 rounded-full border border-violet-500/30 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-bold text-violet-400">
                      {(member.displayName ?? '?').trim().charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {onOpenMember ? (
                        <button
                          type="button"
                          onClick={() => onOpenMember(member.uid)}
                          data-testid="network-member-open"
                          title={isAr ? 'افتتح الصفحة العامة' : 'Open the public page'}
                          className={`min-w-0 truncate text-start text-xs font-bold underline-offset-2 transition cursor-pointer hover:text-violet-400 hover:underline ${s.heading}`}
                        >
                          {member.displayName}
                        </button>
                      ) : (
                        <p className={`min-w-0 truncate text-xs font-bold ${s.heading}`}>{member.displayName}</p>
                      )}
                      {isMe ? (
                        <span className="shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-300">
                          {isAr ? 'بطاقتك' : 'You'}
                        </span>
                      ) : null}
                    </div>
                    <p className={`min-w-0 truncate text-[10px] ${s.subtext}`}>{member.headline || member.organizationName}</p>
                    <p className={`min-w-0 truncate text-[10px] ${s.muted}`}>{member.organizationName}</p>
                  </div>
                </div>

                <div className="mt-1.5">
                  <VerificationTrackBadges profile={member} language={language} isLight={isLight} />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className={s.chip}>{member.sector}</span>
                  {member.city ? (
                    <span className={`inline-flex items-center gap-0.5 ${s.chip}`}>
                      <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                      {member.city}
                    </span>
                  ) : null}
                  {typeof member.yearsExperience === 'number' ? (
                    <span className={s.chip}>
                      {isAr ? `${member.yearsExperience} سنة` : `${member.yearsExperience} yrs`}
                    </span>
                  ) : null}
                  {availability ? (
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                      {availability}
                    </span>
                  ) : null}
                </div>

                {member.specialtyTrades ? (
                  <p className={`mt-1.5 line-clamp-2 text-[10px] leading-relaxed ${s.subtext}`}>{member.specialtyTrades}</p>
                ) : null}

                {member.certifications ? (
                  <p className={`mt-1.5 flex items-start gap-1 ${s.subCard} px-1.5 py-1 text-[9px] leading-relaxed ${s.subtext}`}>
                    <ShieldCheck className={`mt-0.5 h-2.5 w-2.5 shrink-0 ${s.muted}`} aria-hidden="true" />
                    <span className="min-w-0">
                      {isAr ? 'شهادات معلنة (غير مُتحقَّق منها): ' : 'Declared certifications (not verified): '}
                      {member.certifications}
                    </span>
                  </p>
                ) : null}

                {!isMe ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {connectedUids.has(member.uid) ? (
                      <span
                        data-testid="network-connected-chip"
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
                      >
                        <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isAr ? 'في شبكتك' : 'In your network'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void connect({ uid: member.uid, displayName: member.displayName })}
                        disabled={!signedIn || !verified || !myCard || connecting === member.uid}
                        aria-disabled={!signedIn || !verified || !myCard || connecting === member.uid}
                        title={
                          !signedIn
                            ? isAr
                              ? 'سجّل الدخول لإضافة العضو إلى شبكتك'
                              : 'Sign in to add this member'
                            : !verified
                              ? isAr
                                ? 'أكّد بريدك أولاً'
                                : 'Confirm your email first'
                              : !myCard
                                ? isAr
                                  ? 'أنشئ بطاقتك المهنية أولاً — الطلب يحمل اسمك'
                                  : 'Create your card first — the request carries your name'
                                : isAr
                                  ? 'إضافة العضو إلى شبكتك'
                                  : 'Add this member to your network'
                        }
                        data-testid="network-connect"
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${
                          signedIn && verified && myCard
                            ? 'border-violet-400/50 bg-violet-500/10 text-violet-300 cursor-pointer hover:border-violet-300'
                            : `${s.buttonSecondary} opacity-60 cursor-not-allowed`
                        }`}
                      >
                        {connecting === member.uid ? (
                          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
                        ) : (
                          <UserPlus className="h-3 w-3 shrink-0" aria-hidden="true" />
                        )}
                        {isAr ? 'أضف إلى شبكتي' : 'Add to my network'}
                      </button>
                    )}

                    {signedIn ? (
                      <button
                        type="button"
                        onClick={() => void toggleFollowMember(member)}
                        disabled={followingUid === member.uid}
                        className={isFollowing ? s.buttonPrimary : s.buttonSecondary}
                      >
                        <UserCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isFollowing ? (isAr ? 'متابَع' : 'Following') : isAr ? 'متابعة' : 'Follow'}
                      </button>
                    ) : null}

                    {!blocksDms ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!signedIn) onOpenAccount();
                          else onOpenMessage?.(member.uid);
                        }}
                        data-testid="network-directory-message"
                        className={s.buttonSecondary}
                      >
                        <MessageSquare className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isAr ? 'ماسنجر' : 'Message'}
                      </button>
                    ) : null}
                    {onOpenEmail ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!signedIn) onOpenAccount();
                          else onOpenEmail(member.uid);
                        }}
                        data-testid="network-directory-email"
                        className={s.buttonSecondary}
                      >
                        <Mail className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                        {isAr ? 'بريد' : 'Email'}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NetworkDirectorySection;
