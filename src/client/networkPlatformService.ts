import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import {
  BLUEPRINT_LIMITS,
  clampStr,
  type CommunityBlock,
  type CommunityBookmark,
  type CommunityCompany,
  type CommunityCompanyAffiliation,
  type CommunityCompanyDepartment,
  type CommunityDirectMessage,
  type CommunityEmail,
  type CommunityEmailCategory,
  type CommunityEmailPriority,
  type CommunityEvent,
  type CommunityEventKind,
  type CommunityEventRegistration,
  type CommunityFollow,
  type CommunityGroupResource,
  type CommunityJobApplication,
  type CommunityJobApplicationStatus,
  type CommunityMessageThread,
  type CommunityNotification,
  type CommunityNotificationCategory,
  type CommunityNotificationPrefs,
  type CommunityPollVote,
  type CommunityPostAnswer,
  type CommunityReport,
  type CommunityVerification,
  type OrgHierarchyRoleKey,
  type VerificationStatus,
  type VerificationTrack,
} from './types';

function createdAtMs(ts: unknown): number {
  if (
    ts &&
    typeof ts === 'object' &&
    'toMillis' in ts &&
    typeof (ts as { toMillis?: () => number }).toMillis === 'function'
  ) {
    try {
      return (ts as { toMillis: () => number }).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function splitCsv(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(/[,،]+/)
      .map(v => v.trim())
      .filter(Boolean);
  }
  return [];
}

function httpsOrOmit(raw: string | undefined): string | undefined {
  const clean = (raw ?? '').trim();
  if (!clean || !/^https:\/\/.+/i.test(clean)) return undefined;
  return clean.slice(0, 500);
}

/* -------------------------------------------------------------------------- */
/* 1. Q&A Structured Answers & Poll Votes                                      */
/* -------------------------------------------------------------------------- */

export async function addPostAnswer(
  user: User,
  postId: string,
  input: {
    authorName: string;
    authorHeadline?: string;
    body: string;
    references?: string;
    academyCourseId?: string;
    isAiAssisted?: boolean;
  }
): Promise<CommunityPostAnswer> {
  if (!db) throw new Error('Firestore not initialized');
  const ansRef = doc(collection(db, 'community_posts', postId, 'answers'));
  const path = `community_posts/${postId}/answers/${ansRef.id}`;
  const headline = clampStr(input.authorHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX);
  const refs = clampStr(input.references, 500);
  const courseId = clampStr(input.academyCourseId, 80);

  const payload = {
    postId,
    authorUid: user.uid,
    authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    ...(headline ? { authorHeadline: headline } : {}),
    body: clampStr(input.body, 3000),
    ...(refs ? { references: refs } : {}),
    ...(courseId ? { academyCourseId: courseId } : {}),
    upvotesCount: 0,
    isAccepted: false,
    expertReviewed: false,
    isAiAssisted: Boolean(input.isAiAssisted),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ansRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
  return { id: ansRef.id, ...payload };
}

export function subscribePostAnswers(
  postId: string,
  onData: (answers: CommunityPostAnswer[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_posts/${postId}/answers`;
  const q = query(collection(db, 'community_posts', postId, 'answers'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CommunityPostAnswer, 'id'>),
      }));
      list.sort((a, b) => {
        if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
        if (a.expertReviewed !== b.expertReviewed) return a.expertReviewed ? -1 : 1;
        return (b.upvotesCount ?? 0) - (a.upvotesCount ?? 0);
      });
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function getMyAnswerVote(postId: string, answerId: string, uid: string): Promise<boolean> {
  if (!db) return false;
  const path = `community_posts/${postId}/answers/${answerId}/votes/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'community_posts', postId, 'answers', answerId, 'votes', uid));
    return snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return false;
  }
}

export async function toggleAnswerUpvote(
  user: User,
  postId: string,
  answerId: string
): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  const voteRef = doc(db, 'community_posts', postId, 'answers', answerId, 'votes', user.uid);
  const ansRef = doc(db, 'community_posts', postId, 'answers', answerId);
  const path = `community_posts/${postId}/answers/${answerId}/votes/${user.uid}`;
  try {
    const existing = await getDoc(voteRef);
    const batch = writeBatch(db);
    if (existing.exists()) {
      batch.delete(voteRef);
      batch.update(ansRef, { upvotesCount: increment(-1), updatedAt: serverTimestamp() });
      await batch.commit();
      return false;
    }
    batch.set(voteRef, { uid: user.uid, createdAt: serverTimestamp() });
    batch.update(ansRef, { upvotesCount: increment(1), updatedAt: serverTimestamp() });
    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
}

export async function setAnswerAccepted(
  postId: string,
  answerId: string,
  isAccepted: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_posts/${postId}/answers/${answerId}`;
  try {
    await updateDoc(doc(db, 'community_posts', postId, 'answers', answerId), {
      isAccepted: Boolean(isAccepted),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function toggleAnswerExpertReview(
  user: User,
  reviewerName: string,
  postId: string,
  answerId: string,
  expertReviewed: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_posts/${postId}/answers/${answerId}`;
  try {
    await updateDoc(doc(db, 'community_posts', postId, 'answers', answerId), {
      expertReviewed: Boolean(expertReviewed),
      reviewerUid: user.uid,
      reviewerName: clampStr(reviewerName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function castPollVote(
  user: User,
  postId: string,
  optionIndex: number
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_posts/${postId}/poll_votes/${user.uid}`;
  const voteRef = doc(db, 'community_posts', postId, 'poll_votes', user.uid);
  try {
    const existing = await getDoc(voteRef);
    if (existing.exists()) {
      await deleteDoc(voteRef);
    }
    await setDoc(voteRef, {
      postId,
      uid: user.uid,
      optionIndex: Math.max(0, Math.min(5, Math.round(optionIndex))),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribePollVotes(
  postId: string,
  onData: (votes: CommunityPollVote[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_posts/${postId}/poll_votes`;
  return onSnapshot(
    collection(db, 'community_posts', postId, 'poll_votes'),
    snap => {
      onData(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<CommunityPollVote, 'id'>),
        }))
      );
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Group Resources & Events                                                */
/* -------------------------------------------------------------------------- */

export async function addGroupResource(
  user: User,
  groupId: string,
  input: {
    authorName: string;
    kind: 'document' | 'announcement' | 'event';
    title: string;
    description: string;
    url?: string;
    eventDateIso?: string;
  }
): Promise<CommunityGroupResource> {
  if (!db) throw new Error('Firestore not initialized');
  const resRef = doc(collection(db, 'community_groups', groupId, 'resources'));
  const path = `community_groups/${groupId}/resources/${resRef.id}`;
  const url = httpsOrOmit(input.url);
  const eventDateIso = clampStr(input.eventDateIso, 40);
  const payload = {
    groupId,
    authorUid: user.uid,
    authorName: clampStr(input.authorName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    kind: input.kind,
    title: clampStr(input.title, 160),
    description: clampStr(input.description, 1000),
    ...(url ? { url } : {}),
    ...(eventDateIso ? { eventDateIso } : {}),
    createdAt: serverTimestamp(),
  };
  try {
    await setDoc(resRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
  return { id: resRef.id, ...payload };
}

export function subscribeGroupResources(
  groupId: string,
  onData: (items: CommunityGroupResource[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_groups/${groupId}/resources`;
  return onSnapshot(
    query(collection(db, 'community_groups', groupId, 'resources'), orderBy('createdAt', 'desc')),
    snap => {
      onData(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<CommunityGroupResource, 'id'>),
        }))
      );
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function deleteGroupResource(groupId: string, resourceId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_groups/${groupId}/resources/${resourceId}`;
  try {
    await deleteDoc(doc(db, 'community_groups', groupId, 'resources', resourceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/* -------------------------------------------------------------------------- */
/* 3. Follows & Bookmarks                                                     */
/* -------------------------------------------------------------------------- */

export async function toggleFollow(
  user: User,
  targetType: 'member' | 'company',
  targetId: string,
  targetName: string
): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  const followId = `${user.uid}_${targetType}_${targetId}`;
  const ref = doc(db, 'community_follows', followId);
  const path = `community_follows/${followId}`;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      if (targetType === 'company') {
        await updateDoc(doc(db, 'community_companies', targetId), {
          followersCount: increment(-1),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      } else {
        await updateDoc(doc(db, 'community_workspaces', targetId), {
          followersCount: increment(-1),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
      return false;
    }
    await setDoc(ref, {
      followerUid: user.uid,
      targetType,
      targetId,
      targetName: clampStr(targetName, 160),
      createdAt: serverTimestamp(),
    });
    if (targetType === 'company') {
      await updateDoc(doc(db, 'community_companies', targetId), {
        followersCount: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    } else {
      await updateDoc(doc(db, 'community_workspaces', targetId), {
        followersCount: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
}

export function subscribeMyFollows(
  uid: string,
  onData: (follows: CommunityFollow[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_follows';
  return onSnapshot(
    query(collection(db, 'community_follows'), where('followerUid', '==', uid)),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityFollow, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function toggleBookmark(
  user: User,
  postId: string,
  postTitle: string
): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  const bookmarkId = `${user.uid}_${postId}`;
  const ref = doc(db, 'community_bookmarks', bookmarkId);
  const path = `community_bookmarks/${bookmarkId}`;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      return false;
    }
    await setDoc(ref, {
      uid: user.uid,
      postId,
      postTitle: clampStr(postTitle, 180),
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
}

export function subscribeMyBookmarks(
  uid: string,
  onData: (bookmarks: CommunityBookmark[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_bookmarks';
  return onSnapshot(
    query(collection(db, 'community_bookmarks'), where('uid', '==', uid)),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityBookmark, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Formal Job Applications                                                 */
/* -------------------------------------------------------------------------- */

export async function submitJobApplication(
  user: User,
  input: {
    opportunityId: string;
    opportunityTitle: string;
    employerUid: string;
    applicantName: string;
    applicantHeadline?: string;
    applicantOrg?: string;
    coverNote: string;
    cvSummary?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const appId = `${input.opportunityId}_${user.uid}`;
  const path = `community_job_applications/${appId}`;
  const headline = clampStr(input.applicantHeadline, BLUEPRINT_LIMITS.COMMUNITY_HEADLINE_MAX);
  const org = clampStr(input.applicantOrg, 160);
  const cv = clampStr(input.cvSummary, 800);
  try {
    await setDoc(doc(db, 'community_job_applications', appId), {
      opportunityId: input.opportunityId,
      opportunityTitle: clampStr(input.opportunityTitle, 180),
      employerUid: input.employerUid,
      applicantUid: user.uid,
      applicantName: clampStr(input.applicantName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
      ...(headline ? { applicantHeadline: headline } : {}),
      ...(org ? { applicantOrg: org } : {}),
      coverNote: clampStr(input.coverNote, 1500),
      ...(cv ? { cvSummary: cv } : {}),
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeMyJobApplications(
  uid: string,
  onData: (apps: CommunityJobApplication[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_job_applications';
  return onSnapshot(
    query(collection(db, 'community_job_applications'), where('applicantUid', '==', uid)),
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityJobApplication, 'id'>) }));
      list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeEmployerJobApplications(
  employerUid: string,
  onData: (apps: CommunityJobApplication[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_job_applications';
  return onSnapshot(
    query(collection(db, 'community_job_applications'), where('employerUid', '==', employerUid)),
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityJobApplication, 'id'>) }));
      list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateJobApplicationStatus(
  applicationId: string,
  status: CommunityJobApplicationStatus
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_job_applications/${applicationId}`;
  try {
    await updateDoc(doc(db, 'community_job_applications', applicationId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/* -------------------------------------------------------------------------- */
/* 5. Companies, Interactive Org Charts & Employee Consent                    */
/* -------------------------------------------------------------------------- */

function mapCompanyDoc(id: string, raw: Record<string, unknown>): CommunityCompany {
  return {
    id,
    ownerUid: String(raw.ownerUid ?? ''),
    name: String(raw.name ?? ''),
    ...(raw.nameAr ? { nameAr: String(raw.nameAr) } : {}),
    industry: String(raw.industry ?? ''),
    description: String(raw.description ?? ''),
    ...(raw.headquarters ? { headquarters: String(raw.headquarters) } : {}),
    ...(raw.branches ? { branches: String(raw.branches) } : {}),
    ...(raw.website ? { website: String(raw.website) } : {}),
    ...(raw.contactEmail ? { contactEmail: String(raw.contactEmail) } : {}),
    services: splitCsv(raw.services),
    specializations: splitCsv(raw.specializations),
    ...(raw.projectsSummary ? { projectsSummary: String(raw.projectsSummary) } : {}),
    ...(raw.logoURL ? { logoURL: String(raw.logoURL) } : {}),
    ...(raw.coverURL ? { coverURL: String(raw.coverURL) } : {}),
    verificationStatus: (raw.verificationStatus as CommunityCompany['verificationStatus']) ?? 'pending',
    followersCount: typeof raw.followersCount === 'number' ? raw.followersCount : 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function createCommunityCompany(
  user: User,
  input: {
    name: string;
    nameAr?: string;
    industry: string;
    description: string;
    headquarters?: string;
    branches?: string;
    website?: string;
    contactEmail?: string;
    services?: string[];
    specializations?: string[];
    projectsSummary?: string;
    logoURL?: string;
    coverURL?: string;
  }
): Promise<CommunityCompany> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(collection(db, 'community_companies'));
  const path = `community_companies/${ref.id}`;
  const logoURL = httpsOrOmit(input.logoURL);
  const coverURL = httpsOrOmit(input.coverURL);
  const servicesStr = clampStr((input.services ?? []).join(', '), 500);
  const specsStr = clampStr((input.specializations ?? []).join(', '), 400);

  const writePayload = {
    ownerUid: user.uid,
    name: clampStr(input.name, 160),
    ...(input.nameAr?.trim() ? { nameAr: clampStr(input.nameAr, 160) } : {}),
    industry: clampStr(input.industry, 120),
    description: clampStr(input.description, 1500),
    ...(input.headquarters?.trim() ? { headquarters: clampStr(input.headquarters, 160) } : {}),
    ...(input.branches?.trim() ? { branches: clampStr(input.branches, 400) } : {}),
    ...(input.website?.trim() ? { website: clampStr(input.website, 300) } : {}),
    ...(input.contactEmail?.trim() ? { contactEmail: clampStr(input.contactEmail, 160) } : {}),
    ...(servicesStr ? { services: servicesStr } : {}),
    ...(specsStr ? { specializations: specsStr } : {}),
    ...(input.projectsSummary?.trim() ? { projectsSummary: clampStr(input.projectsSummary, 1000) } : {}),
    ...(logoURL ? { logoURL } : {}),
    ...(coverURL ? { coverURL } : {}),
    verificationStatus: 'pending' as const,
    followersCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, writePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
  return mapCompanyDoc(ref.id, writePayload);
}

export async function updateCommunityCompany(
  companyId: string,
  updates: {
    name?: string;
    nameAr?: string;
    industry?: string;
    description?: string;
    headquarters?: string;
    branches?: string;
    website?: string;
    contactEmail?: string;
    services?: string[];
    specializations?: string[];
    projectsSummary?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_companies/${companyId}`;
  try {
    await updateDoc(doc(db, 'community_companies', companyId), {
      ...(updates.name !== undefined && { name: clampStr(updates.name, 160) }),
      ...(updates.nameAr !== undefined && { nameAr: clampStr(updates.nameAr, 160) }),
      ...(updates.industry !== undefined && { industry: clampStr(updates.industry, 120) }),
      ...(updates.description !== undefined && { description: clampStr(updates.description, 1500) }),
      ...(updates.headquarters !== undefined && { headquarters: clampStr(updates.headquarters, 160) }),
      ...(updates.branches !== undefined && { branches: clampStr(updates.branches, 400) }),
      ...(updates.website !== undefined && { website: clampStr(updates.website, 300) }),
      ...(updates.contactEmail !== undefined && { contactEmail: clampStr(updates.contactEmail, 160) }),
      ...(updates.services !== undefined && { services: clampStr(updates.services.join(', '), 500) }),
      ...(updates.specializations !== undefined && { specializations: clampStr(updates.specializations.join(', '), 400) }),
      ...(updates.projectsSummary !== undefined && { projectsSummary: clampStr(updates.projectsSummary, 1000) }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCommunityCompanies(
  onData: (companies: CommunityCompany[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_companies';
  return onSnapshot(
    query(collection(db, 'community_companies'), orderBy('updatedAt', 'desc'), limit(60)),
    snap => {
      onData(snap.docs.map(d => mapCompanyDoc(d.id, d.data() as Record<string, unknown>)));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

function mapDepartmentDoc(id: string, raw: Record<string, unknown>): CommunityCompanyDepartment {
  return {
    id,
    companyId: String(raw.companyId ?? ''),
    name: String(raw.name ?? ''),
    ...(raw.parentDeptId ? { parentDepartmentId: String(raw.parentDeptId) } : {}),
    levelOrder: typeof raw.levelRank === 'number' ? raw.levelRank : 3,
    roleTitle: String(raw.levelTitle ?? ''),
    roleKey: inferRoleKey(String(raw.levelTitle ?? '')),
    ...(raw.managerUid ? { managerUid: String(raw.managerUid) } : {}),
    ...(raw.managerName ? { managerName: String(raw.managerName) } : {}),
    services: splitCsv(raw.services),
    specialties: splitCsv(raw.specializations),
    activeProjects: splitCsv(raw.projectsSummary),
    ...(raw.description ? { overview: String(raw.description) } : {}),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function inferRoleKey(title: string): OrgHierarchyRoleKey {
  const lower = title.toLowerCase();
  if (lower.includes('managing')) return 'managing_director';
  if (lower.includes('operations')) return 'operations_manager';
  if (lower.includes('technical')) return 'technical_manager';
  if (lower.includes('department')) return 'department_manager';
  if (lower.includes('leader')) return 'team_leader';
  if (lower.includes('engineer') || lower.includes('inspector') || lower.includes('tech')) return 'engineer_inspector';
  return 'custom';
}

export async function upsertCompanyDepartment(
  companyId: string,
  deptId: string | null,
  input: {
    name: string;
    parentDepartmentId?: string;
    levelOrder: number;
    roleTitle: string;
    managerUid?: string;
    managerName?: string;
    overview?: string;
    specialties?: string[];
    services?: string[];
    activeProjects?: string[];
  },
  existingCreatedAt?: unknown
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const targetRef = deptId
    ? doc(db, 'community_companies', companyId, 'departments', deptId)
    : doc(collection(db, 'community_companies', companyId, 'departments'));
  const path = `community_companies/${companyId}/departments/${targetRef.id}`;

  const payload = {
    companyId,
    ...(input.parentDepartmentId?.trim() ? { parentDeptId: clampStr(input.parentDepartmentId, 128) } : {}),
    levelRank: Math.max(0, Math.min(20, Math.round(input.levelOrder))),
    levelTitle: clampStr(input.roleTitle, 80),
    name: clampStr(input.name, 120),
    ...(input.overview?.trim() ? { description: clampStr(input.overview, 800) } : {}),
    ...(input.managerUid?.trim() ? { managerUid: clampStr(input.managerUid, 128) } : {}),
    ...(input.managerName?.trim() ? { managerName: clampStr(input.managerName, 120) } : {}),
    ...(input.specialties?.length ? { specializations: clampStr(input.specialties.join(', '), 400) } : {}),
    ...(input.services?.length ? { services: clampStr(input.services.join(', '), 400) } : {}),
    ...(input.activeProjects?.length ? { projectsSummary: clampStr(input.activeProjects.join(', '), 600) } : {}),
    createdAt: existingCreatedAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(targetRef, payload);
  } catch (err) {
    handleFirestoreError(err, deptId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
  return targetRef.id;
}

export async function deleteCompanyDepartment(companyId: string, deptId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_companies/${companyId}/departments/${deptId}`;
  try {
    await deleteDoc(doc(db, 'community_companies', companyId, 'departments', deptId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeCompanyDepartments(
  companyId: string,
  onData: (depts: CommunityCompanyDepartment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_companies/${companyId}/departments`;
  return onSnapshot(
    collection(db, 'community_companies', companyId, 'departments'),
    snap => {
      onData(snap.docs.map(d => mapDepartmentDoc(d.id, d.data() as Record<string, unknown>)));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function inviteCompanyAffiliation(
  user: User,
  input: {
    companyId: string;
    companyName: string;
    employeeUid: string;
    employeeName: string;
    roleTitle: string;
    departmentId?: string;
    departmentName?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const affId = `${input.companyId}_${input.employeeUid}`;
  const path = `community_companies/${input.companyId}/affiliations/${affId}`;
  try {
    await setDoc(doc(db, 'community_companies', input.companyId, 'affiliations', affId), {
      companyId: input.companyId,
      companyName: clampStr(input.companyName, 160),
      employeeUid: input.employeeUid,
      employeeName: clampStr(input.employeeName, 120),
      roleTitle: clampStr(input.roleTitle, 100),
      ...(input.departmentId ? { departmentId: clampStr(input.departmentId, 128) } : {}),
      ...(input.departmentName ? { departmentName: clampStr(input.departmentName, 120) } : {}),
      status: 'invited',
      invitedByUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function respondCompanyAffiliation(
  companyId: string,
  employeeUid: string,
  status: 'accepted' | 'declined' | 'removed'
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const affId = `${companyId}_${employeeUid}`;
  const path = `community_companies/${companyId}/affiliations/${affId}`;
  try {
    await updateDoc(doc(db, 'community_companies', companyId, 'affiliations', affId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCompanyAffiliations(
  companyId: string,
  onData: (rows: CommunityCompanyAffiliation[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_companies/${companyId}/affiliations`;
  return onSnapshot(
    collection(db, 'community_companies', companyId, 'affiliations'),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityCompanyAffiliation, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function fetchUserAffiliationsAcrossCompanies(
  uid: string,
  companyIds: string[]
): Promise<CommunityCompanyAffiliation[]> {
  if (!db || companyIds.length === 0) return [];
  const results: CommunityCompanyAffiliation[] = [];
  for (const cid of companyIds.slice(0, 25)) {
    try {
      const snap = await getDoc(doc(db, 'community_companies', cid, 'affiliations', `${cid}_${uid}`));
      if (snap.exists()) {
        results.push({ id: snap.id, ...(snap.data() as Omit<CommunityCompanyAffiliation, 'id'>) });
      }
    } catch {
      /* ignore inaccessible individual affiliation docs */
    }
  }
  return results;
}

/* -------------------------------------------------------------------------- */
/* 6. Events Center & Live Registrations                                      */
/* -------------------------------------------------------------------------- */

export async function createCommunityEvent(
  user: User,
  input: {
    organizerName: string;
    organizerOrg: string;
    companyId?: string;
    eventType: CommunityEventKind;
    title: string;
    description: string;
    speakers?: string[];
    dateIso: string;
    venueOrLink: string;
    capacity: number;
    academyCourseId?: string;
    postEventResources?: string;
  }
): Promise<CommunityEvent> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(collection(db, 'community_events'));
  const path = `community_events/${ref.id}`;
  const cleanSpeakers = (input.speakers ?? []).map(s => clampStr(s, 100)).filter(Boolean).slice(0, 10);

  const payload = {
    organizerUid: user.uid,
    organizerName: clampStr(input.organizerName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    organizerOrg: clampStr(input.organizerOrg, 160),
    ...(input.companyId?.trim() ? { companyId: clampStr(input.companyId, 128) } : {}),
    eventType: input.eventType,
    title: clampStr(input.title, 180),
    description: clampStr(input.description, 2000),
    ...(cleanSpeakers.length > 0 ? { speakers: cleanSpeakers } : {}),
    dateIso: clampStr(input.dateIso, 40),
    venueOrLink: clampStr(input.venueOrLink, 300),
    capacity: Math.max(1, Math.min(50000, Math.round(input.capacity))),
    attendeesCount: 0,
    ...(input.academyCourseId?.trim() ? { academyCourseId: clampStr(input.academyCourseId, 80) } : {}),
    ...(input.postEventResources?.trim() ? { postEventResources: clampStr(input.postEventResources, 1000) } : {}),
    status: 'upcoming' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
  return { id: ref.id, ...payload };
}

export async function updateCommunityEvent(
  eventId: string,
  updates: {
    status?: 'upcoming' | 'completed' | 'cancelled';
    postEventResources?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_events/${eventId}`;
  try {
    await updateDoc(doc(db, 'community_events', eventId), {
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.postEventResources !== undefined && {
        postEventResources: clampStr(updates.postEventResources, 1000),
      }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCommunityEvents(
  onData: (events: CommunityEvent[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_events';
  return onSnapshot(
    query(collection(db, 'community_events'), orderBy('createdAt', 'desc'), limit(50)),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityEvent, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function rsvpCommunityEvent(
  user: User,
  eventId: string,
  displayName: string,
  register: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const regRef = doc(db, 'community_events', eventId, 'registrations', user.uid);
  const evRef = doc(db, 'community_events', eventId);
  const path = `community_events/${eventId}/registrations/${user.uid}`;
  try {
    const existing = await getDoc(regRef);
    const wasRegistered = existing.exists() && (existing.data() as { status?: string }).status === 'registered';
    const batch = writeBatch(db);
    if (register && !wasRegistered) {
      batch.set(regRef, {
        eventId,
        uid: user.uid,
        displayName: clampStr(displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
        status: 'registered',
        createdAt: existing.exists() ? (existing.data() as { createdAt?: unknown }).createdAt ?? serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(evRef, { attendeesCount: increment(1), updatedAt: serverTimestamp() });
      await batch.commit();
    } else if (!register && wasRegistered) {
      batch.set(regRef, {
        eventId,
        uid: user.uid,
        displayName: clampStr(displayName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
        status: 'cancelled',
        createdAt: (existing.data() as { createdAt?: unknown }).createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(evRef, { attendeesCount: increment(-1), updatedAt: serverTimestamp() });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeEventRegistrations(
  eventId: string,
  onData: (regs: CommunityEventRegistration[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_events/${eventId}/registrations`;
  return onSnapshot(
    collection(db, 'community_events', eventId, 'registrations'),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityEventRegistration, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Direct Messaging & Blocking                                             */
/* -------------------------------------------------------------------------- */

export function deterministicThreadId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__');
}

export async function getOrCreateDmThread(
  user: User,
  myName: string,
  otherUid: string,
  otherName: string
): Promise<CommunityMessageThread> {
  if (!db) throw new Error('Firestore not initialized');
  const threadId = deterministicThreadId(user.uid, otherUid);
  const ref = doc(db, 'community_message_threads', threadId);
  const path = `community_message_threads/${threadId}`;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<CommunityMessageThread, 'id'>) };
    }
    const participantUids = [user.uid, otherUid].sort();
    const participantNames: Record<string, string> = {
      [user.uid]: clampStr(myName, 120),
      [otherUid]: clampStr(otherName, 120),
    };
    const payload = {
      participantUids,
      participantNames,
      lastMessage: '',
      lastSenderUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return { id: threadId, ...payload };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeMyDmThreads(
  uid: string,
  onData: (threads: CommunityMessageThread[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_message_threads';
  return onSnapshot(
    query(collection(db, 'community_message_threads'), where('participantUids', 'array-contains', uid)),
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityMessageThread, 'id'>) }));
      list.sort((a, b) => createdAtMs(b.updatedAt) - createdAtMs(a.updatedAt));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function sendDirectMessage(
  user: User,
  threadId: string,
  input: {
    senderName: string;
    recipientUid: string;
    body: string;
    attachmentUrl?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const msgRef = doc(collection(db, 'community_message_threads', threadId, 'messages'));
  const threadRef = doc(db, 'community_message_threads', threadId);
  const path = `community_message_threads/${threadId}/messages/${msgRef.id}`;
  const cleanBody = clampStr(input.body, 2000);
  const attachmentUrl = httpsOrOmit(input.attachmentUrl);
  const batch = writeBatch(db);
  batch.set(msgRef, {
    threadId,
    senderUid: user.uid,
    senderName: clampStr(input.senderName, 120),
    recipientUid: input.recipientUid,
    body: cleanBody,
    ...(attachmentUrl ? { attachmentUrl } : {}),
    isRead: false,
    createdAt: serverTimestamp(),
  });
  batch.update(threadRef, {
    lastMessage: clampStr(cleanBody, 240),
    lastSenderUid: user.uid,
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function markDirectMessageRead(threadId: string, messageId: string): Promise<void> {
  if (!db) return;
  const path = `community_message_threads/${threadId}/messages/${messageId}`;
  try {
    await updateDoc(doc(db, 'community_message_threads', threadId, 'messages', messageId), {
      isRead: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeThreadMessages(
  threadId: string,
  onData: (messages: CommunityDirectMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = `community_message_threads/${threadId}/messages`;
  return onSnapshot(
    query(collection(db, 'community_message_threads', threadId, 'messages'), orderBy('createdAt', 'asc')),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityDirectMessage, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function blockCommunityMember(
  user: User,
  blockedUid: string,
  reason?: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const blockId = `${user.uid}_${blockedUid}`;
  const path = `community_blocks/${blockId}`;
  try {
    await setDoc(doc(db, 'community_blocks', blockId), {
      blockerUid: user.uid,
      blockedUid,
      ...(reason?.trim() ? { reason: clampStr(reason, 240) } : {}),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function unblockCommunityMember(user: User, blockedUid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const blockId = `${user.uid}_${blockedUid}`;
  const path = `community_blocks/${blockId}`;
  try {
    await deleteDoc(doc(db, 'community_blocks', blockId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeMyBlocks(
  uid: string,
  onData: (blocks: CommunityBlock[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_blocks';
  return onSnapshot(
    query(collection(db, 'community_blocks'), where('blockerUid', '==', uid)),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityBlock, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Notifications & Preferences                                             */
/* -------------------------------------------------------------------------- */

export async function createCommunityNotification(
  actor: User,
  input: {
    recipientUid: string;
    actorName: string;
    category: CommunityNotificationCategory;
    title: string;
    body: string;
    linkSection?: string;
    linkEntryId?: string;
  }
): Promise<void> {
  if (!db) return;
  if (actor.uid === input.recipientUid) return;
  const ref = doc(collection(db, 'community_notifications'));
  const path = `community_notifications/${ref.id}`;
  try {
    await setDoc(ref, {
      recipientUid: input.recipientUid,
      actorUid: actor.uid,
      actorName: clampStr(input.actorName, 120),
      category: input.category,
      title: clampStr(input.title, 160),
      body: clampStr(input.body, 400),
      ...(input.linkSection ? { linkSection: clampStr(input.linkSection, 40) } : {}),
      ...(input.linkEntryId ? { linkEntryId: clampStr(input.linkEntryId, 128) } : {}),
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch {
    /* notification fanout should never block primary social action */
  }
}

export function subscribeMyNotifications(
  uid: string,
  onData: (items: CommunityNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_notifications';
  return onSnapshot(
    query(collection(db, 'community_notifications'), where('recipientUid', '==', uid)),
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityNotification, 'id'>) }));
      list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function markNotificationRead(notificationId: string, isRead = true): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'community_notifications', notificationId), { isRead });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsRead(items: CommunityNotification[]): Promise<void> {
  if (!db) return;
  const unread = items.filter(i => !i.isRead);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  for (const item of unread.slice(0, 50)) {
    batch.update(doc(db, 'community_notifications', item.id), { isRead: true });
  }
  await batch.commit();
}

export const DEFAULT_NOTIFICATION_PREFS: Omit<CommunityNotificationPrefs, 'uid'> = {
  connections: true,
  comments: true,
  groups: true,
  jobs: true,
  messages: true,
  events: true,
  academy: true,
  weeklyDigest: false,
};

export function subscribeNotificationPrefs(
  uid: string,
  onData: (prefs: CommunityNotificationPrefs) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData({ uid, ...DEFAULT_NOTIFICATION_PREFS });
    return () => {};
  }
  const path = `community_notification_prefs/${uid}`;
  return onSnapshot(
    doc(db, 'community_notification_prefs', uid),
    snap => {
      if (snap.exists()) {
        const data = snap.data() as Omit<CommunityNotificationPrefs, 'uid'>;
        onData({ uid, ...DEFAULT_NOTIFICATION_PREFS, ...data });
      } else {
        onData({ uid, ...DEFAULT_NOTIFICATION_PREFS });
      }
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveNotificationPrefs(
  user: User,
  prefs: Omit<CommunityNotificationPrefs, 'uid' | 'updatedAt'>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_notification_prefs/${user.uid}`;
  try {
    await setDoc(doc(db, 'community_notification_prefs', user.uid), {
      connections: Boolean(prefs.connections),
      comments: Boolean(prefs.comments),
      groups: Boolean(prefs.groups),
      jobs: Boolean(prefs.jobs),
      messages: Boolean(prefs.messages),
      events: Boolean(prefs.events),
      academy: Boolean(prefs.academy),
      weeklyDigest: Boolean(prefs.weeklyDigest),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/* -------------------------------------------------------------------------- */
/* 9. 3-Track Verification & Moderation Reports (Admin Audited)               */
/* -------------------------------------------------------------------------- */

export async function submitVerificationRequest(
  user: User,
  input: {
    memberName: string;
    track: VerificationTrack;
    subjectTitle: string;
    issuerOrCompany: string;
    evidenceNote: string;
    evidenceUrl?: string;
    companyId?: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(collection(db, 'community_verifications'));
  const path = `community_verifications/${ref.id}`;
  const evidenceUrl = httpsOrOmit(input.evidenceUrl);
  try {
    await setDoc(ref, {
      uid: user.uid,
      memberName: clampStr(input.memberName, 120),
      track: input.track,
      subjectTitle: clampStr(input.subjectTitle, 160),
      issuerOrCompany: clampStr(input.issuerOrCompany, 160),
      evidenceNote: clampStr(input.evidenceNote, 800),
      ...(evidenceUrl ? { evidenceUrl } : {}),
      ...(input.companyId?.trim() ? { companyId: clampStr(input.companyId, 128) } : {}),
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeMyVerifications(
  uid: string,
  onData: (rows: CommunityVerification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_verifications';
  return onSnapshot(
    query(collection(db, 'community_verifications'), where('uid', '==', uid)),
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityVerification, 'id'>) }));
      list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAllVerificationsAdmin(
  onData: (rows: CommunityVerification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_verifications';
  return onSnapshot(
    query(collection(db, 'community_verifications'), orderBy('createdAt', 'desc'), limit(80)),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityVerification, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function reviewVerificationAdmin(
  verification: CommunityVerification,
  decision: VerificationStatus
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_verifications/${verification.id}`;
  try {
    await updateDoc(doc(db, 'community_verifications', verification.id), {
      status: decision,
      updatedAt: serverTimestamp(),
    });
    if (decision === 'approved') {
      const workspaceField =
        verification.track === 'identity'
          ? { identityVerified: true }
          : verification.track === 'organization'
            ? {
                organizationVerified: true,
                ...(verification.companyId ? { verifiedOrganizationId: verification.companyId } : {}),
              }
            : { credentialVerified: true };
      await updateDoc(doc(db, 'community_workspaces', verification.uid), {
        ...workspaceField,
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      if (verification.track === 'organization' && verification.companyId) {
        await updateDoc(doc(db, 'community_companies', verification.companyId), {
          verificationStatus: 'verified',
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function submitModerationReport(
  user: User,
  input: {
    reporterName: string;
    targetType: CommunityReport['targetType'];
    targetId: string;
    targetTitle: string;
    reason: string;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(collection(db, 'community_reports'));
  const path = `community_reports/${ref.id}`;
  try {
    await setDoc(ref, {
      reporterUid: user.uid,
      reporterName: clampStr(input.reporterName, 120),
      targetType: input.targetType,
      targetId: clampStr(input.targetId, 128),
      targetTitle: clampStr(input.targetTitle, 180),
      reason: clampStr(input.reason, 800),
      status: 'open' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeModerationReportsAdmin(
  onData: (reports: CommunityReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_reports';
  return onSnapshot(
    query(collection(db, 'community_reports'), orderBy('createdAt', 'desc'), limit(60)),
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityReport, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateModerationReportStatus(
  reportId: string,
  status: CommunityReport['status']
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'community_reports', reportId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/* -------------------------------------------------------------------------- */
/* 10. Internal Platform Engineering Email (/community_emails/{emailId})      */
/* -------------------------------------------------------------------------- */

export async function sendCommunityEmail(
  user: User,
  input: {
    senderName: string;
    senderOrg?: string;
    recipientUid: string;
    recipientName: string;
    subject: string;
    category: CommunityEmailCategory;
    priority: CommunityEmailPriority;
    body: string;
    attachmentUrl?: string;
    replyToEmailId?: string;
  }
): Promise<CommunityEmail> {
  if (!db) throw new Error('Firestore not initialized');
  if (!input.recipientUid || input.recipientUid === user.uid) {
    throw new Error('Invalid recipient UID');
  }
  const ref = doc(collection(db, 'community_emails'));
  const path = `community_emails/${ref.id}`;
  const cleanSubject = clampStr(input.subject, 180);
  const cleanBody = clampStr(input.body, 5000);
  if (cleanSubject.length < 2) {
    throw new Error('Email subject must be at least 2 characters');
  }
  if (cleanBody.length < 1) {
    throw new Error('Email body cannot be empty');
  }
  const attachmentUrl = httpsOrOmit(input.attachmentUrl);
  const senderOrg = clampStr(input.senderOrg, 160);
  const replyToEmailId = clampStr(input.replyToEmailId, 128);
  const participantUids = [user.uid, input.recipientUid].sort();
  const payload = {
    participantUids,
    senderUid: user.uid,
    senderName: clampStr(input.senderName, 120) || user.uid,
    ...(senderOrg ? { senderOrg } : {}),
    recipientUid: input.recipientUid,
    recipientName: clampStr(input.recipientName, 120) || input.recipientUid,
    subject: cleanSubject,
    category: input.category,
    priority: input.priority,
    body: cleanBody,
    ...(attachmentUrl ? { attachmentUrl } : {}),
    ...(replyToEmailId ? { replyToEmailId } : {}),
    recipientRead: false,
    senderStarred: false,
    recipientStarred: false,
    senderFolder: 'sent' as const,
    recipientFolder: 'inbox' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(ref, payload);
    return { id: ref.id, ...payload };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeMyEmails(
  uid: string,
  onData: (emails: CommunityEmail[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const path = 'community_emails';
  return onSnapshot(
    query(collection(db, 'community_emails'), where('participantUids', 'array-contains', uid)),
    snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CommunityEmail, 'id'>),
      }));
      list.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
      onData(list);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function markCommunityEmailRead(emailId: string, read = true): Promise<void> {
  if (!db) return;
  const path = `community_emails/${emailId}`;
  try {
    await updateDoc(doc(db, 'community_emails', emailId), {
      recipientRead: read,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function toggleCommunityEmailStar(
  email: CommunityEmail,
  myUid: string,
  starred: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_emails/${email.id}`;
  const isSender = email.senderUid === myUid;
  const isRecipient = email.recipientUid === myUid;
  if (!isSender && !isRecipient) return;
  try {
    await updateDoc(doc(db, 'community_emails', email.id), {
      ...(isSender ? { senderStarred: starred } : { recipientStarred: starred }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function setCommunityEmailFolder(
  email: CommunityEmail,
  myUid: string,
  archived: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `community_emails/${email.id}`;
  const isSender = email.senderUid === myUid;
  const isRecipient = email.recipientUid === myUid;
  if (!isSender && !isRecipient) return;
  try {
    await updateDoc(doc(db, 'community_emails', email.id), {
      ...(isSender
        ? { senderFolder: archived ? 'archive' : 'sent' }
        : { recipientFolder: archived ? 'archive' : 'inbox' }),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
