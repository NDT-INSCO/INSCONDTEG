/**
 * Groups — the pure part: limits that mirror `firestore.rules`, the two policies the
 * owner chooses, and the single place that decides what a given member may do.
 *
 * The access decision lives here (not scattered through components) so the interface
 * and the tests read the same answer: may I read this group's feed, may I post, and if
 * not, why not — in both languages, without the component inventing a sentence.
 */
import type {
  CommunityGroup,
  CommunityGroupJoinPolicy,
  CommunityGroupMember,
  CommunityGroupPostPolicy,
} from '../client/types';

/** Mirrors `isValidCommunityGroup` / `isValidGroupPost` in firestore.rules. */
export const NETWORK_GROUP_LIMITS = {
  nameMin: 3,
  nameMax: 120,
  descriptionMin: 5,
  descriptionMax: 1200,
  titleMin: 3,
  titleMax: 160,
  bodyMin: 5,
  bodyMax: 2000,
} as const;

export const NETWORK_GROUP_JOIN_POLICIES: {
  id: CommunityGroupJoinPolicy;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
}[] = [
  {
    id: 'open',
    ar: 'انضمام مفتوح',
    en: 'Open',
    hintAr: 'أي عضو مؤكَّد البريد ينضم فوراً.',
    hintEn: 'Any email-confirmed member joins immediately.',
  },
  {
    id: 'request',
    ar: 'بطلب وموافقة',
    en: 'By request',
    hintAr: 'يصل طلب، وأنت من يوافق أو يرفض.',
    hintEn: 'A request arrives, and you approve or reject it.',
  },
  {
    id: 'invite',
    ar: 'بدعوة فقط',
    en: 'Invitation only',
    hintAr: 'لا أحد ينضم بنفسه — أنت تضيف الأعضاء.',
    hintEn: 'Nobody joins by themselves — you add the members.',
  },
];

export const NETWORK_GROUP_POST_POLICIES: {
  id: CommunityGroupPostPolicy;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
}[] = [
  {
    id: 'members',
    ar: 'كل الأعضاء',
    en: 'All members',
    hintAr: 'كل عضو مقبول يشارك منشورات.',
    hintEn: 'Every approved member can post.',
  },
  {
    id: 'owners',
    ar: 'المالك فقط',
    en: 'Owner only',
    hintAr: 'لوحة إعلانات: الأعضاء يقرؤون فقط.',
    hintEn: 'A notice board: members read only.',
  },
];

export function joinPolicyById(id: string | undefined) {
  return NETWORK_GROUP_JOIN_POLICIES.find(policy => policy.id === id) ?? NETWORK_GROUP_JOIN_POLICIES[0];
}

export function postPolicyById(id: string | undefined) {
  return NETWORK_GROUP_POST_POLICIES.find(policy => policy.id === id) ?? NETWORK_GROUP_POST_POLICIES[0];
}

/* ------------------------------- group draft ------------------------------- */

export interface NetworkGroupDraft {
  name: string;
  description: string;
  joinPolicy: CommunityGroupJoinPolicy;
  postPolicy: CommunityGroupPostPolicy;
}

export const EMPTY_GROUP_DRAFT: NetworkGroupDraft = {
  name: '',
  description: '',
  joinPolicy: 'request',
  postPolicy: 'members',
};

export interface GroupFieldError {
  field: keyof NetworkGroupDraft;
  ar: string;
  en: string;
}

export function validateGroupDraft(draft: NetworkGroupDraft): GroupFieldError[] {
  const errors: GroupFieldError[] = [];
  const name = draft.name.trim();
  const description = draft.description.trim();

  if (name.length < NETWORK_GROUP_LIMITS.nameMin) {
    errors.push({
      field: 'name',
      ar: `اسم الجروب مطلوب (${NETWORK_GROUP_LIMITS.nameMin} أحرف على الأقل).`,
      en: `A group name is required (at least ${NETWORK_GROUP_LIMITS.nameMin} characters).`,
    });
  } else if (name.length > NETWORK_GROUP_LIMITS.nameMax) {
    errors.push({
      field: 'name',
      ar: `اسم الجروب أطول من ${NETWORK_GROUP_LIMITS.nameMax} حرفاً.`,
      en: `The name is longer than ${NETWORK_GROUP_LIMITS.nameMax} characters.`,
    });
  }

  if (description.length < NETWORK_GROUP_LIMITS.descriptionMin) {
    errors.push({
      field: 'description',
      ar: 'اكتب سطراً عن الغرض من الجروب — بلا وصف يبقى اسماً بلا معنى.',
      en: 'Describe the group’s purpose — a name alone says nothing.',
    });
  } else if (description.length > NETWORK_GROUP_LIMITS.descriptionMax) {
    errors.push({
      field: 'description',
      ar: `الوصف أطول من ${NETWORK_GROUP_LIMITS.descriptionMax} حرفاً.`,
      en: `The description is longer than ${NETWORK_GROUP_LIMITS.descriptionMax} characters.`,
    });
  }

  if (!NETWORK_GROUP_JOIN_POLICIES.some(policy => policy.id === draft.joinPolicy)) {
    errors.push({ field: 'joinPolicy', ar: 'اختر سياسة انضمام.', en: 'Choose a join policy.' });
  }
  if (!NETWORK_GROUP_POST_POLICIES.some(policy => policy.id === draft.postPolicy)) {
    errors.push({ field: 'postPolicy', ar: 'اختر من ينشر.', en: 'Choose who may post.' });
  }

  return errors;
}

export function toGroupInput(draft: NetworkGroupDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    joinPolicy: draft.joinPolicy,
    postPolicy: draft.postPolicy,
  };
}

export function draftFromGroup(group: CommunityGroup): NetworkGroupDraft {
  return {
    name: group.name,
    description: group.description,
    joinPolicy: group.joinPolicy,
    postPolicy: group.postPolicy,
  };
}

/* -------------------------------- post draft ------------------------------- */

export interface NetworkGroupPostDraft {
  title: string;
  body: string;
}

export const EMPTY_GROUP_POST_DRAFT: NetworkGroupPostDraft = { title: '', body: '' };

export interface GroupPostError {
  field: 'title' | 'body';
  ar: string;
  en: string;
}

export function validateGroupPostDraft(draft: NetworkGroupPostDraft): GroupPostError[] {
  const errors: GroupPostError[] = [];
  const title = draft.title.trim();
  const body = draft.body.trim();

  if (title !== '' && title.length < NETWORK_GROUP_LIMITS.titleMin) {
    errors.push({ field: 'title', ar: 'العنوان قصير جداً (3 أحرف على الأقل) أو اتركه فارغاً.', en: 'The title is too short (3+ characters) or leave it empty.' });
  }
  if (title.length > NETWORK_GROUP_LIMITS.titleMax) {
    errors.push({ field: 'title', ar: `العنوان أطول من ${NETWORK_GROUP_LIMITS.titleMax} حرفاً.`, en: `The title is longer than ${NETWORK_GROUP_LIMITS.titleMax} characters.` });
  }
  if (body.length < NETWORK_GROUP_LIMITS.bodyMin) {
    errors.push({ field: 'body', ar: 'المنشور مطلوب (5 أحرف على الأقل).', en: 'A post is required (at least 5 characters).' });
  } else if (body.length > NETWORK_GROUP_LIMITS.bodyMax) {
    errors.push({ field: 'body', ar: `المنشور أطول من ${NETWORK_GROUP_LIMITS.bodyMax} حرفاً.`, en: `The post is longer than ${NETWORK_GROUP_LIMITS.bodyMax} characters.` });
  }
  return errors;
}

export function toGroupPostInput(draft: NetworkGroupPostDraft) {
  const title = draft.title.trim();
  return {
    ...(title !== '' ? { title } : {}),
    body: draft.body.trim(),
  };
}

/* --------------------------------- access --------------------------------- */

export type GroupMembershipState = 'none' | 'member' | 'pending' | 'rejected';

export interface GroupAccess {
  state: GroupMembershipState;
  isOwner: boolean;
  canReadPosts: boolean;
  canPost: boolean;
  /** Why posting is closed, when it is — never a silent disabled button. */
  postBlockedAr: string | null;
  postBlockedEn: string | null;
  /** What the join button should do for someone who is not in yet. */
  joinIntent: 'join' | 'request' | 'invite-only';
}

export function membershipFor(
  group: Pick<CommunityGroup, 'id'>,
  memberships: Pick<CommunityGroupMember, 'groupId' | 'status' | 'role'>[]
): Pick<CommunityGroupMember, 'groupId' | 'status' | 'role'> | null {
  return memberships.find(row => row.groupId === group.id) ?? null;
}

/**
 * The one answer to "what may I do here?".
 *
 * Reading a group's feed needs an approved membership (the rules refuse it otherwise);
 * posting additionally depends on the owner's `postPolicy`. A pending request can read
 * nothing yet, and the page says the request is waiting rather than pretending the group
 * is empty.
 */
export function groupAccess(
  group: Pick<CommunityGroup, 'id' | 'ownerUid' | 'joinPolicy' | 'postPolicy'>,
  viewerUid: string | null,
  membership: Pick<CommunityGroupMember, 'status' | 'role'> | null
): GroupAccess {
  const isOwner = Boolean(viewerUid) && group.ownerUid === viewerUid;
  const status = membership?.status ?? null;
  const state: GroupMembershipState =
    status === 'approved' ? 'member' : status === 'pending' ? 'pending' : status === 'rejected' ? 'rejected' : 'none';

  const approved = state === 'member' || isOwner;
  const canReadPosts = approved;

  let canPost = false;
  let postBlockedAr: string | null = null;
  let postBlockedEn: string | null = null;

  if (!viewerUid) {
    postBlockedAr = 'سجّل الدخول للمشاركة.';
    postBlockedEn = 'Sign in to take part.';
  } else if (state === 'pending') {
    postBlockedAr = 'طلبك قيد المراجعة — لا نشر قبل الموافقة.';
    postBlockedEn = 'Your request is pending — no posting before approval.';
  } else if (state === 'rejected') {
    postBlockedAr = 'رفض المالك طلبك، فلا نشر في هذا الجروب.';
    postBlockedEn = 'The owner rejected your request, so no posting here.';
  } else if (state === 'none' && !isOwner) {
    postBlockedAr =
      group.joinPolicy === 'invite'
        ? 'الجروب بالدعوة فقط — يضيفك المالك.'
        : group.joinPolicy === 'open'
          ? 'انضم أولاً لتشارك.'
          : 'أرسل طلب انضمام أولاً لتشارك.';
    postBlockedEn =
      group.joinPolicy === 'invite'
        ? 'This group is invitation-only — its owner adds members.'
        : group.joinPolicy === 'open'
          ? 'Join first to take part.'
          : 'Request to join first to take part.';
  } else if (group.postPolicy === 'owners' && !isOwner) {
    postBlockedAr = 'المالك اختار أن ينشر هو فقط — الأعضاء يقرؤون.';
    postBlockedEn = 'The owner keeps posting to themselves — members read.';
  } else {
    canPost = true;
  }

  return {
    state,
    isOwner,
    canReadPosts,
    canPost,
    postBlockedAr,
    postBlockedEn,
    joinIntent: group.joinPolicy === 'invite' ? 'invite-only' : group.joinPolicy === 'open' ? 'join' : 'request',
  };
}

/** How many approved members a roster contains — counted, never incremented. */
export function approvedMemberCount(members: Pick<CommunityGroupMember, 'status'>[]): number {
  return members.filter(member => member.status === 'approved').length;
}

/**
 * Why a write was refused, in the words the member can act on.
 *
 * The most common refusal in this feature is not the member's fault: the rules in
 * `firestore.rules` live in the repository, and until they are published to the
 * Firebase project, the server answers `permission-denied` to every group write.
 * That is a deployment fact, not a UI bug — so the interface says exactly that
 * instead of echoing `Firestore create failed (permission-denied)`.
 */
export function describeGroupFailure(error: unknown, isAr: boolean): string {
  const raw = error as { code?: unknown; message?: unknown } | null;
  const code = typeof raw?.code === 'string' ? raw.code : '';
  const message = typeof raw?.message === 'string' ? raw.message : String(error ?? '');

  if (code === 'permission-denied' || message.includes('permission-denied')) {
    return isAr
      ? 'الخادم رفض العملية: قواعد Firebase المنشورة لا تسمح بالجروبات بعد. الملف firestore.rules موجود في المستودع ولم يُنشر على المشروع — بعد نشره تعمل هذه الخطوة من أول مرة.'
      : 'The server refused: the deployed Firebase rules do not allow groups yet. firestore.rules is in the repository but has not been published to the project — once it is, this action works first time.';
  }
  if (code === 'unauthenticated' || message.includes('unauthenticated')) {
    return isAr ? 'انتهت الجلسة — سجّل الدخول ثم أعد المحاولة.' : 'The session ended — sign in and try again.';
  }
  if (
    code === 'unavailable' ||
    message.includes('unavailable') ||
    message.includes('offline') ||
    message.includes('network-request-failed')
  ) {
    return isAr
      ? 'تعذّر الوصول إلى الخادم (شبكة أو حجب). لم يُحفظ شيء — أعد المحاولة.'
      : 'The server was unreachable (network or blocking). Nothing was saved — try again.';
  }
  return isAr ? `تعذّر تنفيذ الإجراء: ${message}` : `Action failed: ${message}`;
}
