import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock3,
  Loader2,
  Lock,
  Plus,
  Send,
  Settings2,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type {
  CommunityGroup,
  CommunityGroupMember,
  CommunityGroupPost,
  CommunityWorkspaceProfile,
} from '../../client/types';
import type { Language } from '../../types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import {
  EMPTY_GROUP_DRAFT,
  EMPTY_GROUP_POST_DRAFT,
  NETWORK_GROUP_JOIN_POLICIES,
  NETWORK_GROUP_LIMITS,
  NETWORK_GROUP_POST_POLICIES,
  approvedMemberCount,
  draftFromGroup,
  groupAccess,
  joinPolicyById,
  postPolicyById,
  toGroupInput,
  toGroupPostInput,
  validateGroupDraft,
  validateGroupPostDraft,
  type NetworkGroupDraft,
  type NetworkGroupPostDraft,
} from '../../network/networkGroupsForm';

interface NetworkGroupPageProps {
  groupId: string;
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onBack: () => void;
  slowAfterMs?: number;
}

const fieldClass =
  'w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none';

const shortDate = (value: unknown, isAr: boolean): string => {
  const at =
    value && typeof value === 'object' && 'toMillis' in value
      ? (value as { toMillis?: () => number }).toMillis?.() ?? 0
      : 0;
  if (!at) return isAr ? 'الآن' : 'now';
  try {
    return new Date(at).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return new Date(at).toISOString().slice(0, 10);
  }
};

/**
 * `#network/groups/<groupId>` — one group.
 *
 * The page asks the same question the rules ask: is this member approved here, and did
 * the owner allow members to post? A non-member is not shown an empty feed but the way
 * in — or, for an invitation-only group, the reason there is none. The owner gets the
 * tools their own policy implies: answer requests, change the two policies, add members.
 */
export const NetworkGroupPage: React.FC<NetworkGroupPageProps> = ({
  groupId,
  language,
  onOpenAccount,
  onOpenProfile,
  onBack,
  slowAfterMs = 8000,
}) => {
  const account = useOptionalSiteAccount();
  const isAr = language === 'ar';

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [members, setMembers] = useState<CommunityGroupMember[]>([]);
  const [posts, setPosts] = useState<CommunityGroupPost[]>([]);
  const [postsState, setPostsState] = useState<'idle' | 'loading' | 'ready' | 'refused'>('idle');

  const [draft, setDraft] = useState<NetworkGroupPostDraft>(EMPTY_GROUP_POST_DRAFT);
  const [posting, setPosting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [answering, setAnswering] = useState<string | null>(null);

  const [settings, setSettings] = useState<NetworkGroupDraft>(EMPTY_GROUP_DRAFT);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [directory, setDirectory] = useState<CommunityWorkspaceProfile[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  const membership = useMemo(
    () => members.find(member => member.uid === uid) ?? null,
    [members, uid]
  );
  const access = useMemo(
    () => (group ? groupAccess(group, uid, membership) : null),
    [group, uid, membership]
  );

  /* ------------------------------- the group ------------------------------- */
  useEffect(() => {
    setGroup(null);
    setMembers([]);
    setPosts([]);
    setPostsState('idle');
    setError(null);
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
    void import('../../client/communityGroupsService').then(api => {
      if (!active) return;
      api.subscribeCommunityGroup(
        groupId,
        next => {
          if (!active) return;
          setGroup(next);
          setLoading(false);
          setSlow(false);
          if (next) setSettings(draftFromGroup(next));
        },
        nextError => {
          if (!active) return;
          setError(nextError.message);
          setLoading(false);
          setSlow(false);
        }
      );
      if (uid) {
        api.subscribeGroupMembers(
          groupId,
          next => {
            if (active) setMembers(next);
          },
          () => {}
        );
        void import('../../client/firestoreClientService').then(service => {
          if (!active) return;
          service.subscribeMyCommunityWorkspace(
            uid,
            next => {
              if (active) setCard(next);
            },
            () => {}
          );
        });
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [groupId, serviceReady, uid, slowAfterMs]);

  /* --------------------------- the group's posts --------------------------- */
  const canReadPosts = access?.canReadPosts ?? false;
  useEffect(() => {
    if (!serviceReady || !canReadPosts) {
      setPosts([]);
      setPostsState(access && !canReadPosts ? 'refused' : 'idle');
      return;
    }
    let active = true;
    setPostsState('loading');
    void import('../../client/communityGroupsService').then(api => {
      if (!active) return;
      api.subscribeGroupPosts(
        groupId,
        next => {
          if (!active) return;
          setPosts(next);
          setPostsState('ready');
        },
        () => {
          if (active) setPostsState('refused');
        }
      );
    });
    return () => {
      active = false;
    };
  }, [groupId, serviceReady, canReadPosts, access]);

  /* ------------------- the owner's invite picker (invite policy) ----------- */
  useEffect(() => {
    if (!access?.isOwner || group?.joinPolicy !== 'invite') {
      setDirectory([]);
      return;
    }
    let active = true;
    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      api.subscribeCommunityWorkspaces(
        false,
        next => {
          if (active) setDirectory(next);
        },
        () => {}
      );
    });
    return () => {
      active = false;
    };
  }, [access?.isOwner, group?.joinPolicy]);

  const join = useCallback(async () => {
    const user = account?.user;
    if (!group || !user || !card) return;
    setJoining(true);
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
          : message
      );
    } finally {
      setJoining(false);
    }
  }, [account?.user, card, group, isAr]);

  const post = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const user = account?.user;
      if (!group || !user || !card) return;
      if (validateGroupPostDraft(draft).length > 0) return;
      setPosting(true);
      setActionError(null);
      try {
        const api = await import('../../client/communityGroupsService');
        await api.createGroupPost(user, group.id, { displayName: card.displayName, headline: card.headline }, toGroupPostInput(draft));
        setDraft(EMPTY_GROUP_POST_DRAFT);
      } catch (failure) {
        setActionError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setPosting(false);
      }
    },
    [account?.user, card, draft, group]
  );

  const answer = useCallback(
    async (target: CommunityGroupMember, decision: 'approved' | 'rejected') => {
      if (!group) return;
      setAnswering(target.uid);
      setActionError(null);
      try {
        const api = await import('../../client/communityGroupsService');
        await api.answerGroupRequest(group.id, target.uid, decision);
      } catch (failure) {
        setActionError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setAnswering(null);
      }
    },
    [group]
  );

  const saveSettings = useCallback(async () => {
    if (!group || validateGroupDraft(settings).length > 0) return;
    setSavingSettings(true);
    setActionError(null);
    try {
      const api = await import('../../client/communityGroupsService');
      await api.updateCommunityGroupSettings(group.id, toGroupInput(settings));
      setSettingsOpen(false);
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setSavingSettings(false);
    }
  }, [group, settings]);

  const invite = useCallback(
    async (target: CommunityWorkspaceProfile) => {
      if (!group) return;
      setInviting(target.uid);
      setActionError(null);
      try {
        const api = await import('../../client/communityGroupsService');
        await api.inviteToCommunityGroup(group.id, { uid: target.uid, displayName: target.displayName });
      } catch (failure) {
        setActionError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        setInviting(null);
      }
    },
    [group]
  );

  const back = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
    >
      <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {isAr ? 'كل الجروبات' : 'All groups'}
    </button>
  );

  if (!serviceReady) {
    return (
      <div data-testid="network-group-unavailable" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <CircleAlert className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          {isAr ? 'الجروبات غير متاحة في هذه النسخة' : 'Groups are not available in this build'}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
          {isAr ? 'لم يُهيَّأ اتصال Firebase، فلا جروب حقيقياً لقراءته.' : 'Firebase is not initialised, so there is no real group to read.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-testid="network-group-loading" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4">
        {slow ? (
          <>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'الاتصال بطيء أو محجوب' : 'The connection is slow or blocked'}
            </div>
            <p className="mt-1 text-[10px] text-amber-100/90">
              {isAr ? 'لم يصل الجروب بعد — ليست صفحة فارغة.' : 'The group has not arrived yet — this is not an empty page.'}
            </p>
          </>
        ) : (
          <p role="status" className="flex items-center gap-2 text-[11px] text-slate-400">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            {isAr ? 'جارٍ تحميل الجروب…' : 'Loading the group…'}
          </p>
        )}
      </div>
    );
  }

  if (error || !group) {
    return (
      <div data-testid="network-group-missing" className="mx-auto max-w-xl rounded-xl border border-[#232345] bg-[#0f0f22] p-5 text-center">
        <Lock className="mx-auto h-6 w-6 text-slate-600" aria-hidden="true" />
        <p className="mt-2 text-sm font-bold text-white">{isAr ? 'لا يوجد جروب بهذا الرابط' : 'No group at this link'}</p>
        <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-slate-400">
          {error
            ? isAr ? `تعذّر تحميله: ${error}` : `It could not be loaded: ${error}`
            : isAr ? 'ربما حُذف، أو أن الرابط قديم. لا نعرض جروباً بديلاً.' : 'It may have been deleted, or the link is old. We do not show a substitute group.'}
        </p>
        <div className="mt-3">{back}</div>
      </div>
    );
  }

  const joinPolicy = joinPolicyById(group.joinPolicy);
  const postPolicy = postPolicyById(group.postPolicy);
  const approved = approvedMemberCount(members);
  const pending = members.filter(member => member.status === 'pending');
  const postErrors = validateGroupPostDraft(draft);
  const settingsErrors = validateGroupDraft(settings);

  return (
    <div data-testid="network-group-live" className="mx-auto min-w-0 max-w-3xl space-y-3">
      {/* -------------------------------- header -------------------------------- */}
      <div className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 data-testid="network-group-name" className="text-base font-bold leading-snug text-white">
              {group.name}
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{group.description}</p>
            <p className="mt-1 text-[10px] text-slate-500">
              {isAr ? `المالك: ${group.ownerName}` : `Owner: ${group.ownerName}`}
              {access?.canReadPosts ? ` · ${isAr ? `${approved} عضو` : `${approved} members`}` : ''}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300">
                {isAr ? joinPolicy.ar : joinPolicy.en}
              </span>
              <span className="rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[9px] text-slate-300">
                {isAr ? postPolicy.ar : postPolicy.en}
              </span>
              {access?.isOwner ? (
                <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200">
                  {isAr ? 'أنت المالك' : 'You own this group'}
                </span>
              ) : access?.state === 'member' ? (
                <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-200">
                  {isAr ? 'عضو' : 'Member'}
                </span>
              ) : access?.state === 'pending' ? (
                <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
                  {isAr ? 'طلبك قيد المراجعة' : 'Your request is pending'}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {access?.isOwner ? (
              <button
                type="button"
                onClick={() => setSettingsOpen(open => !open)}
                data-testid="network-group-settings-toggle"
                className="inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-2.5 py-1 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
              >
                <Settings2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                {isAr ? 'إعدادات الجروب' : 'Group settings'}
              </button>
            ) : null}
            {back}
          </div>
        </div>

        {actionError ? (
          <p role="alert" className="mt-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
            {isAr ? `تعذّر تنفيذ الإجراء: ${actionError}` : `Action failed: ${actionError}`}
          </p>
        ) : null}

        {/* -------------------------- owner: settings -------------------------- */}
        {access?.isOwner && settingsOpen ? (
          <div data-testid="network-group-settings" className="mt-2 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2">
            <div className="grid min-w-0 gap-2">
              <input
                value={settings.name}
                onChange={event => setSettings(current => ({ ...current, name: event.target.value }))}
                maxLength={NETWORK_GROUP_LIMITS.nameMax}
                className={fieldClass}
                aria-label={isAr ? 'اسم الجروب' : 'Group name'}
              />
              <textarea
                value={settings.description}
                onChange={event => setSettings(current => ({ ...current, description: event.target.value }))}
                maxLength={NETWORK_GROUP_LIMITS.descriptionMax}
                rows={2}
                className={`${fieldClass} resize-none`}
                aria-label={isAr ? 'وصف الجروب' : 'Group description'}
              />
              <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                <select
                  value={settings.joinPolicy}
                  onChange={event => setSettings(current => ({ ...current, joinPolicy: event.target.value as NetworkGroupDraft['joinPolicy'] }))}
                  className={fieldClass}
                  aria-label={isAr ? 'سياسة الانضمام' : 'Join policy'}
                >
                  {NETWORK_GROUP_JOIN_POLICIES.map(policy => (
                    <option key={policy.id} value={policy.id}>{isAr ? policy.ar : policy.en}</option>
                  ))}
                </select>
                <select
                  value={settings.postPolicy}
                  onChange={event => setSettings(current => ({ ...current, postPolicy: event.target.value as NetworkGroupDraft['postPolicy'] }))}
                  className={fieldClass}
                  aria-label={isAr ? 'سياسة النشر' : 'Post policy'}
                >
                  {NETWORK_GROUP_POST_POLICIES.map(policy => (
                    <option key={policy.id} value={policy.id}>{isAr ? policy.ar : policy.en}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={savingSettings || settingsErrors.length > 0}
                data-testid="network-group-settings-save"
                className="inline-flex items-center gap-1 rounded-md bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" /> : <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
                {isAr ? 'حفظ السياسات' : 'Save policies'}
              </button>
              {settingsErrors.length > 0 ? (
                <span className="text-[9px] text-rose-300">{isAr ? settingsErrors[0].ar : settingsErrors[0].en}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* --------------------------- owner: requests --------------------------- */}
      {access?.isOwner && pending.length > 0 ? (
        <div data-testid="network-group-requests" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <h3 className="text-[11px] font-bold text-amber-200">
            {isAr ? `طلبات انضمام (${pending.length})` : `Join requests (${pending.length})`}
          </h3>
          <ul className="mt-1.5 space-y-1.5">
            {pending.map(request => (
              <li key={request.uid} className="flex min-w-0 flex-wrap items-center justify-between gap-1.5 rounded border border-[#232345] bg-[#0b0b18] px-2 py-1">
                <span className="min-w-0 truncate text-[10px] text-slate-200">{request.displayName}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void answer(request, 'approved')}
                    disabled={answering === request.uid}
                    data-testid="network-group-approve"
                    className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-200 transition cursor-pointer hover:border-emerald-300 disabled:opacity-50"
                  >
                    {answering === request.uid ? <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" /> : <Check className="h-2.5 w-2.5" aria-hidden="true" />}
                    {isAr ? 'قبول' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void answer(request, 'rejected')}
                    disabled={answering === request.uid}
                    data-testid="network-group-reject"
                    className="inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-200 transition cursor-pointer hover:border-rose-300 disabled:opacity-50"
                  >
                    <X className="h-2.5 w-2.5" aria-hidden="true" />
                    {isAr ? 'رفض' : 'Reject'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ---------------------- owner: invite-only picker ---------------------- */}
      {access?.isOwner && group.joinPolicy === 'invite' ? (
        <div data-testid="network-group-invite" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
            <UserPlus className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
            {isAr ? 'أضف عضواً من دليل الأعضاء' : 'Add a member from the directory'}
          </h3>
          {directory.filter(member => !members.some(row => row.uid === member.uid)).length === 0 ? (
            <p className="mt-1 text-[10px] text-slate-500">
              {isAr ? 'لا أعضاء متاحين للإضافة الآن.' : 'No members available to add right now.'}
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {directory
                .filter(member => !members.some(row => row.uid === member.uid))
                .slice(0, 8)
                .map(member => (
                  <li key={member.uid} className="flex min-w-0 flex-wrap items-center justify-between gap-1.5 rounded border border-[#232345] bg-[#0b0b18] px-2 py-1">
                    <span className="min-w-0 truncate text-[10px] text-slate-200">
                      {member.displayName} · <span className="text-slate-500">{member.organizationName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void invite(member)}
                      disabled={inviting === member.uid}
                      className="inline-flex items-center gap-1 rounded border border-violet-400/50 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-200 transition cursor-pointer hover:border-violet-300 disabled:opacity-50"
                    >
                      {inviting === member.uid ? <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" /> : <Plus className="h-2.5 w-2.5" aria-hidden="true" />}
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* ------------------------------ not a member ---------------------------- */}
      {!access?.canReadPosts ? (
        <div data-testid="network-group-gate" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-4 text-center">
          <Lock className="mx-auto h-6 w-6 text-slate-600" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold text-white">
            {access?.state === 'pending'
              ? isAr ? 'طلبك قيد المراجعة' : 'Your request is pending'
              : access?.state === 'rejected'
                ? isAr ? 'رُفض طلبك' : 'Your request was rejected'
                : isAr ? 'منشورات الجروب للأعضاء' : 'This feed is for members'}
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-slate-400">
            {access?.state === 'pending'
              ? isAr ? 'المالك لم يبتّ في طلبك بعد — لا نشر ولا قراءة قبل الموافقة، وهذا ما تفرضه القواعد.' : 'The owner has not answered yet — no reading or posting before approval, as the rules require.'
              : access?.state === 'rejected'
                ? isAr ? 'قرار المالك نهائي في هذه الجلسة. يمكنك مراسلته من دليل الأعضاء.' : 'The owner’s decision stands for now. You can reach them from the directory.'
                : access?.joinIntent === 'invite-only'
                  ? isAr ? 'هذا الجروب بالدعوة فقط — يضيفك المالك بنفسه.' : 'This group is invitation-only — its owner adds members.'
                  : isAr ? 'تغذية الجروب لا تُقرأ قبل الموافقة، حتى لا يبدو الجروب فارغاً وهو ليس كذلك.' : 'A group feed is not readable before approval, so a group never looks empty when it is not.'}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {access && access.state === 'none' && access.joinIntent !== 'invite-only' ? (
              <button
                type="button"
                onClick={() => void join()}
                disabled={!uid || !verified || !card || joining}
                title={
                  !uid
                    ? isAr ? 'سجّل الدخول للانضمام' : 'Sign in to join'
                    : !verified
                      ? isAr ? 'أكّد بريدك أولاً' : 'Confirm your email first'
                      : !card
                        ? isAr ? 'أنشئ بطاقتك أولاً' : 'Create your card first'
                        : undefined
                }
                data-testid="network-group-join-page"
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                  uid && verified && card
                    ? 'bg-violet-500 text-slate-950 cursor-pointer hover:bg-violet-400'
                    : 'border border-[#2a2a4d] bg-[#14142a] text-slate-500 cursor-not-allowed'
                }`}
              >
                {joining ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : access.joinIntent === 'request' ? <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                {access.joinIntent === 'request' ? (isAr ? 'طلب انضمام' : 'Request to join') : isAr ? 'انضمام' : 'Join'}
              </button>
            ) : null}
            {!uid ? (
              <button
                type="button"
                onClick={() => onOpenAccount('signin')}
                className="rounded-lg border border-[#2a2a4d] bg-[#14142a] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign in'}
              </button>
            ) : null}
            {uid && !verified ? (
              <button
                type="button"
                onClick={() => onOpenAccount('account')}
                className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition cursor-pointer hover:border-amber-300"
              >
                {isAr ? 'أكّد بريدك' : 'Confirm your email'}
              </button>
            ) : null}
            {uid && verified && !card ? (
              <button
                type="button"
                onClick={onOpenProfile}
                className="rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400"
              >
                {isAr ? 'أنشئ بطاقتك' : 'Create your card'}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {/* -------------------------------- composer ------------------------------- */}
          {access?.canPost ? (
            <form onSubmit={post} className="min-w-0 rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Send className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
                {isAr ? `انشر في ${group.name}` : `Post in ${group.name}`}
                <span className="ms-auto text-[9px] font-normal text-slate-500">
                  {isAr ? `باسم ${card?.displayName}` : `as ${card?.displayName}`}
                </span>
              </div>
              <input
                value={draft.title}
                onChange={event => setDraft(current => ({ ...current, title: event.target.value }))}
                maxLength={NETWORK_GROUP_LIMITS.titleMax}
                className={`${fieldClass} mt-2`}
                aria-label={isAr ? 'عنوان المنشور (اختياري)' : 'Post title (optional)'}
                placeholder={isAr ? 'عنوان (اختياري)' : 'Title (optional)'}
              />
              <textarea
                value={draft.body}
                onChange={event => setDraft(current => ({ ...current, body: event.target.value }))}
                maxLength={NETWORK_GROUP_LIMITS.bodyMax}
                rows={3}
                className={`${fieldClass} mt-1.5 resize-none`}
                aria-label={isAr ? 'نص المنشور' : 'Post body'}
                placeholder={isAr ? 'شارك ما تعلمته في الموقع…' : 'Share what you learned on site…'}
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={posting || postErrors.length > 0}
                  data-testid="network-group-post-submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition cursor-pointer hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {posting ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  {isAr ? 'نشر' : 'Post'}
                </button>
                {postErrors.length > 0 && draft.body !== '' ? (
                  <span className="text-[9px] text-rose-300">{isAr ? postErrors[0].ar : postErrors[0].en}</span>
                ) : null}
                <span className="ms-auto text-[9px] text-slate-600">
                  {draft.body.length}/{NETWORK_GROUP_LIMITS.bodyMax}
                </span>
              </div>
            </form>
          ) : (
            <p data-testid="network-group-post-blocked" className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3 text-[10px] leading-relaxed text-slate-400">
              {isAr ? access?.postBlockedAr : access?.postBlockedEn}
            </p>
          )}

          {/* --------------------------------- posts -------------------------------- */}
          <div className="rounded-xl border border-[#232345] bg-[#0f0f22] p-3">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
              <Users className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
              {isAr ? 'منشورات الجروب' : 'Group posts'}
            </h3>
            {postsState === 'loading' ? (
              <p role="status" className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                {isAr ? 'جارٍ تحميل المنشورات…' : 'Loading posts…'}
              </p>
            ) : posts.length === 0 ? (
              <p data-testid="network-group-posts-empty" className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                {isAr
                  ? 'لا منشورات بعد. أول منشور حقيقي يظهر هنا — لا شيء يُملأ به الفراغ.'
                  : 'No posts yet. The first real post appears here — nothing is used to fill the gap.'}
              </p>
            ) : (
              <ul data-testid="network-group-posts" className="mt-1.5 space-y-2">
                {posts.map(entry => (
                  <li key={entry.id} data-testid="network-group-post" className="min-w-0 rounded-lg border border-[#232345] bg-[#0b0b18] p-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-200">{entry.authorName}</span>
                      <span className="text-[9px] text-slate-500">{shortDate(entry.createdAt, isAr)}</span>
                      {entry.authorUid === uid || access?.isOwner ? (
                        <button
                          type="button"
                          onClick={() => {
                            void import('../../client/communityGroupsService').then(api => api.deleteGroupPost(group.id, entry.id));
                          }}
                          title={isAr ? 'حذف المنشور' : 'Delete the post'}
                          className="ms-auto inline-flex items-center gap-0.5 rounded border border-[#2a2a4d] px-1 py-0.5 text-[9px] text-slate-500 transition cursor-pointer hover:border-rose-400/50 hover:text-rose-200"
                        >
                          <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                          {isAr ? 'حذف' : 'Delete'}
                        </button>
                      ) : null}
                    </div>
                    {entry.title ? <h4 className="mt-0.5 text-[11px] font-bold text-white">{entry.title}</h4> : null}
                    <p className="mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-300">{entry.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkGroupPage;
