import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleAlert,
  Clock3,
  DoorOpen,
  Loader2,
  Lock,
  Plus,
  Search,
  Users,
  UsersRound,
} from 'lucide-react';
import type {
  CommunityGroup,
  CommunityGroupMember,
  CommunityWorkspaceProfile,
} from '../../client/types';
import type { Language } from '../../types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { NetworkRulesStatus } from './NetworkRulesStatus';
import {
  EMPTY_GROUP_DRAFT,
  NETWORK_GROUP_JOIN_POLICIES,
  NETWORK_GROUP_LIMITS,
  NETWORK_GROUP_POST_POLICIES,
  describeGroupFailure,
  groupAccess,
  joinPolicyById,
  membershipFor,
  postPolicyById,
  toGroupInput,
  validateGroupDraft,
  type NetworkGroupDraft,
} from '../../network/networkGroupsForm';

interface NetworkGroupsSectionProps {
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenGroup: (groupId: string) => void;
  slowAfterMs?: number;
}

/**
 * `#network/groups` — the groups members create themselves.
 *
 * Every group states its two policies on its card, because a visitor has to know
 * whether the door is open, answered by the owner, or invitation-only *before* clicking.
 * The rules enforce the same answer; the interface only tells the truth about it.
 */
export const NetworkGroupsSection: React.FC<NetworkGroupsSectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  onOpenGroup,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);

  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [memberships, setMemberships] = useState<CommunityGroupMember[]>([]);
  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState('');

  const [draft, setDraft] = useState<NetworkGroupDraft>(EMPTY_GROUP_DRAFT);
  const [touched, setTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;
  const canCreate = Boolean(uid) && verified && Boolean(card);

  useEffect(() => {
    setGroups([]);
    setMemberships([]);
    setCard(null);
    setLoading(Boolean(serviceReady));
    setSlow(false);
    setError(null);
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    const stopFns: (() => void)[] = [];
    const timer = setTimeout(() => {
      if (active) setSlow(true);
    }, slowAfterMs);

    void import('../../client/communityGroupsService').then(api => {
      if (!active) return;
      stopFns.push(
        api.subscribeCommunityGroups(
          next => {
            if (!active) return;
            setGroups(next);
            setLoading(false);
            setSlow(false);
          },
          nextError => {
            if (!active) return;
            setError(nextError.message);
            setLoading(false);
            setSlow(false);
          }
        )
      );
      if (uid) {
        stopFns.push(
          api.subscribeMyGroupMemberships(
            uid,
            next => {
              if (active) setMemberships(next);
            },
            () => {}
          )
        );
        void import('../../client/firestoreClientService').then(service => {
          if (!active) return;
          stopFns.push(
            service.subscribeMyCommunityWorkspace(
              uid,
              next => {
                if (active) setCard(next);
              },
              () => {}
            )
          );
        });
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
      stopFns.forEach(stop => stop());
    };
  }, [serviceReady, uid, slowAfterMs]);

  const errors = useMemo(() => validateGroupDraft(draft), [draft]);

  const update = useCallback(<K extends keyof NetworkGroupDraft>(key: K, value: NetworkGroupDraft[K]) => {
    setTouched(true);
    setCreated(null);
    setActionError(null);
    setDraft(current => ({ ...current, [key]: value }));
  }, []);

  const create = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setTouched(true);
      const user = account?.user;
      if (!user || !card || errors.length > 0) return;
      setCreating(true);
      setActionError(null);
      try {
        const api = await import('../../client/communityGroupsService');
        const id = await api.createCommunityGroup(user, card.displayName, toGroupInput(draft));
        setDraft(EMPTY_GROUP_DRAFT);
        setTouched(false);
        setCreated(id);
      } catch (failure) {
        setActionError(describeGroupFailure(failure, isAr));
      } finally {
        setCreating(false);
      }
    },
    [account?.user, card, draft, errors.length, isAr]
  );

  const join = useCallback(
    async (group: CommunityGroup) => {
      const user = account?.user;
      if (!user || !card) return;
      setJoining(group.id);
      setActionError(null);
      try {
        const api = await import('../../client/communityGroupsService');
        await api.joinCommunityGroup(group, user, card.displayName);
      } catch (failure) {
        const message = failure instanceof Error ? failure.message : String(failure);
        setActionError(
          message === 'invite-only'
            ? isAr
              ? 'هذا الجروب بالدعوة فقط — يضيفك المالك.'
              : 'This group is invitation-only — its owner adds members.'
            : describeGroupFailure(failure, isAr)
        );
      } finally {
        setJoining(null);
      }
    },
    [account?.user, card, isAr]
  );

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (needle === '') return groups;
    return groups.filter(
      group =>
        group.name.toLowerCase().includes(needle) ||
        group.description.toLowerCase().includes(needle) ||
        group.ownerName.toLowerCase().includes(needle)
    );
  }, [groups, term]);

  if (!serviceReady) {
    return (
      <div data-testid="network-groups-unavailable" className={`${s.card} p-4`}>
        <div className={`flex items-center gap-2 text-sm font-bold ${s.heading}`}>
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'الجروبات غير متاحة في هذه النسخة' : 'Groups are not available in this build'}
        </div>
        <p className={`mt-1.5 max-w-2xl text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'لم يُهيَّأ اتصال Firebase، فلا توجد جروبات حقيقية — ولن نعرض جروبات تجريبية بدلاً منها.'
            : 'Firebase is not initialised, so there are no real groups — and we will not show trial groups instead.'}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="network-groups-live" className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
      <div className="min-w-0 space-y-3">
        <NetworkRulesStatus language={language} />

        {/* -------------------------------- create -------------------------------- */}
        {canCreate ? (
          <form onSubmit={create} className={`${s.card} min-w-0 p-3`}>
            <div className={`flex flex-wrap items-center gap-1.5 text-xs font-bold ${s.heading}`}>
              <Plus className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'أنشئ جروباً' : 'Create a group'}
              <span className={`ms-auto text-[10px] font-normal ${s.muted}`}>
                {isAr ? `المالك: ${card?.displayName}` : `Owner: ${card?.displayName}`}
              </span>
            </div>

            <div className="mt-2 grid min-w-0 gap-2">
              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'اسم الجروب' : 'Group name'}</span>
                <input
                  value={draft.name}
                  onChange={event => update('name', event.target.value)}
                  maxLength={NETWORK_GROUP_LIMITS.nameMax}
                  className={s.input}
                  aria-label={isAr ? 'اسم الجروب' : 'Group name'}
                  placeholder={isAr ? 'مثال: مفتشو PAUT في مصر' : 'e.g. PAUT inspectors in Egypt'}
                />
              </label>
              <label className="min-w-0">
                <span className={`block text-[10px] font-bold ${s.subtext}`}>
                  {isAr ? 'الغرض' : 'Purpose'}
                  <span className={`ms-1 font-normal ${s.muted}`}>
                    {isAr ? '(يظهر لكل زائر)' : '(visible to every visitor)'}
                  </span>
                </span>
                <textarea
                  value={draft.description}
                  onChange={event => update('description', event.target.value)}
                  maxLength={NETWORK_GROUP_LIMITS.descriptionMax}
                  rows={2}
                  className={`${s.input} resize-none`}
                  aria-label={isAr ? 'وصف الجروب' : 'Group description'}
                />
              </label>

              <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                <label className="min-w-0">
                  <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'كيف ينضم الناس؟' : 'How do people join?'}</span>
                  <select
                    value={draft.joinPolicy}
                    onChange={event => update('joinPolicy', event.target.value as NetworkGroupDraft['joinPolicy'])}
                    className={s.input}
                    aria-label={isAr ? 'سياسة الانضمام' : 'Join policy'}
                  >
                    {NETWORK_GROUP_JOIN_POLICIES.map(policy => (
                      <option key={policy.id} value={policy.id}>
                        {isAr ? policy.ar : policy.en}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0">
                  <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'من ينشر؟' : 'Who may post?'}</span>
                  <select
                    value={draft.postPolicy}
                    onChange={event => update('postPolicy', event.target.value as NetworkGroupDraft['postPolicy'])}
                    className={s.input}
                    aria-label={isAr ? 'سياسة النشر' : 'Post policy'}
                  >
                    {NETWORK_GROUP_POST_POLICIES.map(policy => (
                      <option key={policy.id} value={policy.id}>
                        {isAr ? policy.ar : policy.en}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={creating || errors.length > 0}
                className={s.buttonPrimary}
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                {isAr ? 'إنشاء الجروب' : 'Create group'}
              </button>
              {touched && errors.length > 0 ? (
                <span role="alert" className="text-[10px] text-rose-400">{isAr ? errors[0].ar : errors[0].en}</span>
              ) : null}
              {created ? (
                <span role="status" className="text-[10px] font-bold text-emerald-500">
                  {isAr ? 'أُنشئ الجروب.' : 'Group created.'}
                </span>
              ) : null}
            </div>
          </form>
        ) : (
          <div data-testid="network-groups-gate" className={`${s.card} p-3`}>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
              <UsersRound className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'أنشئ جروباً' : 'Create a group'}
            </div>
            <p className={`mt-1 text-[11px] leading-relaxed ${s.subtext}`}>
              {!account?.ready
                ? isAr ? 'جارٍ التحقق من جلسة حسابك…' : 'Checking your account session…'
                : !uid
                  ? isAr ? 'سجّل الدخول لإنشاء جروب. التصفح متاح للجميع.' : 'Sign in to create a group. Browsing is open to everyone.'
                  : !verified
                    ? isAr ? 'أكّد بريدك أولاً — القواعد ترفض الإنشاء قبله.' : 'Confirm your email first — the rules refuse creation before it.'
                    : isAr ? 'أنشئ بطاقتك المهنية أولاً: الجروب يُنسب إلى اسمك.' : 'Create your card first: a group is attributed to your name.'}
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
                  className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-500 transition cursor-pointer hover:border-amber-300"
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

        {/* -------------------------------- search -------------------------------- */}
        <div className={`${s.card} flex min-w-0 items-center gap-1.5 px-2.5 py-1.5`}>
          <Search className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
          <input
            value={term}
            onChange={event => setTerm(event.target.value)}
            aria-label={isAr ? 'ابحث في الجروبات' : 'Search groups'}
            placeholder={isAr ? 'ابحث بالاسم أو الوصف أو المالك…' : 'Search by name, purpose or owner…'}
            className={`min-w-0 flex-1 bg-transparent text-[11px] focus:outline-none ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-slate-200 placeholder:text-slate-600'}`}
          />
        </div>

        {actionError ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-400">
            {actionError}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-400">
            {describeGroupFailure({ message: error }, isAr)}
          </p>
        ) : null}

        {/* --------------------------------- list --------------------------------- */}
        {loading ? (
          <div data-testid="network-groups-loading" className={`${s.card} p-4`}>
            {slow ? (
              <>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {isAr ? 'الاتصال بالتخزين بطيء أو محجوب' : 'The store is slow or blocked'}
                </div>
                <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
                  {isAr ? 'لم تصل أي مجموعة بعد — هذا ليس فراغاً، بل اتصال لم يكتمل.' : 'No group has arrived yet — this is not emptiness, but an unfinished connection.'}
                </p>
              </>
            ) : (
              <p role="status" className={`flex items-center gap-2 text-[11px] ${s.subtext}`}>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                {isAr ? 'جارٍ تحميل الجروبات…' : 'Loading groups…'}
              </p>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div data-testid="network-groups-empty" className={`${s.card} border-dashed p-6 text-center`}>
            <UsersRound className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
            <p className={`mt-2 text-xs font-bold ${s.heading}`}>
              {groups.length === 0
                ? isAr ? 'لا توجد جروبات بعد' : 'No groups yet'
                : isAr ? 'لا نتائج مطابقة' : 'No matching groups'}
            </p>
            <p className={`mx-auto mt-1 max-w-md text-[10px] leading-relaxed ${s.muted}`}>
              {groups.length === 0
                ? isAr
                  ? 'أول جروب حقيقي يظهر هنا بمجرد إنشائه من عضو مؤكَّد البريد. لا جروبات وهمية.'
                  : 'The first real group appears here once a confirmed member creates one. No invented groups.'
                : isAr ? 'جرّب كلمة أخرى أو امسح البحث.' : 'Try another word, or clear the search.'}
            </p>
          </div>
        ) : (
          <ul data-testid="network-groups-list" className="grid min-w-0 gap-2.5 sm:grid-cols-2">
            {visible.map(group => {
              const membership = membershipFor(group, memberships);
              const access = groupAccess(group, uid, membership);
              const joinPolicy = joinPolicyById(group.joinPolicy);
              const postPolicy = postPolicyById(group.postPolicy);
              return (
                <li key={group.id} data-testid="network-group-card" className={`${s.card} min-w-0 p-3`}>
                  <div className="flex min-w-0 items-start justify-between gap-1.5">
                    <h3 className={`min-w-0 text-sm font-bold leading-snug ${s.heading}`}>{group.name}</h3>
                    {access.isOwner ? (
                      <span className="shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-400">
                        {isAr ? 'مالك' : 'Owner'}
                      </span>
                    ) : access.state === 'member' ? (
                      <span className="shrink-0 rounded border border-emerald-500/40 bg-emerald-500/10 px-1 text-[9px] font-bold text-emerald-500">
                        {isAr ? 'عضو' : 'Member'}
                      </span>
                    ) : access.state === 'pending' ? (
                      <span className="shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-1 text-[9px] font-bold text-amber-500">
                        {isAr ? 'قيد المراجعة' : 'Pending'}
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-1 line-clamp-3 text-[10px] leading-relaxed ${s.subtext}`}>{group.description}</p>
                  <p className={`mt-1 text-[9px] ${s.muted}`}>
                    {isAr ? `المالك: ${group.ownerName}` : `Owner: ${group.ownerName}`}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className={s.chip}>
                      {isAr ? joinPolicy.ar : joinPolicy.en}
                    </span>
                    <span className={s.chip}>
                      {isAr ? postPolicy.ar : postPolicy.en}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenGroup(group.id)}
                      data-testid="network-group-open"
                      className={s.buttonSecondary}
                    >
                      <DoorOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {isAr ? 'فتح الجروب' : 'Open the group'}
                    </button>

                    {access.state === 'member' || access.isOwner ? (
                      <span data-testid="network-group-member-state" className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                        <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isAr ? 'داخل الجروب' : 'Inside'}
                      </span>
                    ) : access.state === 'pending' ? (
                      <span data-testid="network-group-pending" className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500">
                        <Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isAr ? 'طلبك قيد المراجعة' : 'Your request is pending'}
                      </span>
                    ) : access.state === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-rose-400">
                        {isAr ? 'رُفض طلبك' : 'Your request was rejected'}
                      </span>
                    ) : access.joinIntent === 'invite-only' ? (
                      <span
                        data-testid="network-group-invite-only"
                        title={isAr ? 'يضيفك مالك الجروب' : 'The group owner adds members'}
                        className={`${s.chip} inline-flex items-center gap-1 font-bold`}
                      >
                        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isAr ? 'بدعوة فقط' : 'Invitation only'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void join(group)}
                        disabled={!uid || !verified || !card || joining === group.id}
                        title={
                          !uid
                            ? isAr ? 'سجّل الدخول للانضمام' : 'Sign in to join'
                            : !verified
                              ? isAr ? 'أكّد بريدك أولاً' : 'Confirm your email first'
                              : !card
                                ? isAr ? 'أنشئ بطاقتك أولاً' : 'Create your card first'
                                : undefined
                        }
                        data-testid="network-group-join"
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${
                          uid && verified && card
                            ? 'border-violet-400/50 bg-violet-500/10 text-violet-500 cursor-pointer hover:border-violet-400'
                            : 'border-slate-500/30 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {joining === group.id ? (
                          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
                        ) : access.joinIntent === 'request' ? (
                          <Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />
                        ) : (
                          <Plus className="h-3 w-3 shrink-0" aria-hidden="true" />
                        )}
                        {access.joinIntent === 'request'
                          ? isAr ? 'طلب انضمام' : 'Request to join'
                          : isAr ? 'انضمام' : 'Join'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ------------------------------- right rail ------------------------------ */}
      <aside className="min-w-0 space-y-3">
        <div
          className={`rounded-xl border p-3 text-[10px] leading-relaxed ${
            isLight
              ? 'border-sky-300 bg-sky-50 text-sky-900'
              : 'border-sky-500/30 bg-sky-500/10 text-sky-100'
          }`}
        >
          <div className="mb-1 text-[11px] font-bold">
            {isAr ? 'المالك يقرّر، والقاعدة تفرض' : 'The owner decides, the rules enforce'}
          </div>
          {isAr
            ? 'سياسة الانضمام وسياسة النشر يختارهما مالك الجروب، ومكتوبتان على بطاقة الجروب قبل أي نقرة — و`firestore.rules` ترفض ما يخالفهما.'
            : 'The owner chooses how people join and who posts; both are printed on the card before any click — and `firestore.rules` refuses anything else.'}
        </div>
        <div className={`${s.card} p-3 text-[10px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'منشورات ومكتبة الجروب لا تظهر في التغذية العامة — مساحة الجروب خاصة بأعضائه المعتمدين.'
            : 'Group posts and resources never appear in the public feed — a group stays scoped to its approved members.'}
        </div>
      </aside>
    </div>
  );
};

export default NetworkGroupsSection;
