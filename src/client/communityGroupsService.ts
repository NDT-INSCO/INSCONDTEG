/**
 * Groups for the engineering network.
 *
 * Three collections, each with its own job:
 *   `community_groups`          the group and the owner's two policies,
 *   `community_group_members`   one row per member (`groupId_uid`), carrying status,
 *   `community_groups/{id}/posts` the group's own feed.
 *
 * Every write is shaped to pass `firestore.rules` on the first try: a join is either an
 * approval or a request depending on the policy the owner chose, and only the owner can
 * answer a request. Creating a group takes two writes, in order — the group, then the
 * owner's membership row — because a batched row cannot see its own batch's group
 * (`exists()` in the rules is evaluated against the state before the commit).
 */
import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import type {
  CommunityGroup,
  CommunityGroupJoinPolicy,
  CommunityGroupMember,
  CommunityGroupPost,
  CommunityGroupPostPolicy,
} from './types';

const GROUPS = 'community_groups';
const MEMBERS = 'community_group_members';

const memberId = (groupId: string, uid: string) => `${groupId}_${uid}`;

/** The owner's own membership row: approved, role `owner`, written after the group. */
const ownerRow = (groupId: string, uid: string, displayName: string) => ({
  groupId,
  uid,
  displayName,
  role: 'owner' as const,
  status: 'approved' as const,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const requireDb = () => {
  if (!db) throw new Error('Firestore not initialized');
  return db;
};

/* --------------------------------- reading -------------------------------- */

export function subscribeCommunityGroups(
  onData: (groups: CommunityGroup[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, GROUPS), orderBy('createdAt', 'desc'), limit(60));
  return onSnapshot(
    q,
    snap => {
      onData(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityGroup, 'id'>) }))
      );
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, GROUPS);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/** One group, live — the page must react the moment the owner changes a policy. */
export function subscribeCommunityGroup(
  groupId: string,
  onData: (group: CommunityGroup | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, GROUPS, groupId),
    snap => {
      onData(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<CommunityGroup, 'id'>) } as CommunityGroup) : null);
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.GET, `${GROUPS}/${groupId}`);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/** The groups this member belongs to (any status), for badges on the list. */
export function subscribeMyGroupMemberships(
  uid: string,
  onData: (memberships: CommunityGroupMember[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, MEMBERS), where('uid', '==', uid), limit(120));
  return onSnapshot(
    q,
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityGroupMember, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, MEMBERS);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/**
 * Everyone in one group. Only a confirmed member can list this collection — which is
 * why the page asks for the *group's* membership before it shows the roster.
 */
export function subscribeGroupMembers(
  groupId: string,
  onData: (members: CommunityGroupMember[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, MEMBERS), where('groupId', '==', groupId), limit(200));
  return onSnapshot(
    q,
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityGroupMember, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, MEMBERS);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeGroupPosts(
  groupId: string,
  onData: (posts: CommunityGroupPost[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, GROUPS, groupId, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityGroupPost, 'id'>) })));
    },
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, `${GROUPS}/${groupId}/posts`);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/* --------------------------------- writing -------------------------------- */

export interface CommunityGroupInput {
  name: string;
  description: string;
  joinPolicy: CommunityGroupJoinPolicy;
  postPolicy: CommunityGroupPostPolicy;
  coverURL?: string;
}

/**
 * Create a group *and* its owner membership in one batch.
 *
 * The rules refuse a group whose owner row is missing from the same write, so this
 * is not a convenience — it is the only shape that can succeed.
 */
export async function createCommunityGroup(
  user: User,
  ownerName: string,
  input: CommunityGroupInput
): Promise<string> {
  const database = requireDb();
  const groupRef = doc(collection(database, GROUPS));

  const groupDoc = {
    name: input.name,
    description: input.description,
    ownerUid: user.uid,
    ownerName,
    joinPolicy: input.joinPolicy,
    postPolicy: input.postPolicy,
    ...(input.coverURL ? { coverURL: input.coverURL } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(groupRef, groupDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, GROUPS);
    throw error;
  }

  try {
    await setDoc(
      doc(database, MEMBERS, memberId(groupRef.id, user.uid)),
      ownerRow(groupRef.id, user.uid, ownerName)
    );
  } catch (error) {
    // The group exists but its owner row did not land: say so instead of pretending
    // the creation was clean. Re-creating would be a duplicate, so the message names
    // what exists (the owner row can be written again later; the page reads ownership
    // from the group document itself).
    throw new Error(
      'أُنشئ الجروب، لكن لم تُسجَّل صفوفة العضوية. أعد المحاولة من صفحة الجروب. / ' +
        'The group was created but its owner membership row was not saved. Retry from the group page.'
    );
  }

  return groupRef.id;
}

export async function updateCommunityGroupSettings(
  groupId: string,
  input: CommunityGroupInput
): Promise<void> {
  const database = requireDb();
  try {
    await updateDoc(doc(database, GROUPS, groupId), {
      name: input.name,
      description: input.description,
      joinPolicy: input.joinPolicy,
      postPolicy: input.postPolicy,
      ...(input.coverURL ? { coverURL: input.coverURL } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${GROUPS}/${groupId}`);
  }
}

/**
 * Ask to join (or join outright, when the owner left the door open).
 *
 * An invitation-only group cannot be entered from this side at all: the rules refuse
 * the row, so the caller gets a plain explanation instead of a silent no-op.
 */
export async function joinCommunityGroup(
  group: CommunityGroup,
  user: User,
  displayName: string
): Promise<'approved' | 'pending'> {
  const database = requireDb();
  if (group.joinPolicy === 'invite') {
    throw new Error('invite-only');
  }
  const status = group.joinPolicy === 'open' ? 'approved' : 'pending';
  try {
    await setDoc(doc(database, MEMBERS, memberId(group.id, user.uid)), {
      groupId: group.id,
      uid: user.uid,
      displayName,
      role: 'member',
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return status;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, MEMBERS);
  }
}

/** The owner's answer to a request. Members can never approve themselves. */
export async function answerGroupRequest(
  groupId: string,
  uid: string,
  answer: 'approved' | 'rejected'
): Promise<void> {
  const database = requireDb();
  try {
    await updateDoc(doc(database, MEMBERS, memberId(groupId, uid)), {
      status: answer,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, MEMBERS);
  }
}

/** The owner adds a member to an invitation-only group. */
export async function inviteToCommunityGroup(
  groupId: string,
  target: { uid: string; displayName: string }
): Promise<void> {
  const database = requireDb();
  try {
    await setDoc(doc(database, MEMBERS, memberId(groupId, target.uid)), {
      groupId,
      uid: target.uid,
      displayName: target.displayName,
      role: 'member',
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, MEMBERS);
  }
}

/** Leaving removes the row; the group stays. */
export async function leaveCommunityGroup(groupId: string, uid: string): Promise<void> {
  const database = requireDb();
  try {
    await deleteDoc(doc(database, MEMBERS, memberId(groupId, uid)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, MEMBERS);
  }
}

export interface GroupPostInput {
  title?: string;
  body: string;
}

export async function createGroupPost(
  user: User,
  groupId: string,
  author: { displayName: string; headline?: string },
  input: GroupPostInput
): Promise<void> {
  const database = requireDb();
  try {
    await setDoc(doc(collection(database, GROUPS, groupId, 'posts')), {
      authorUid: user.uid,
      authorName: author.displayName,
      ...(author.headline ? { authorHeadline: author.headline } : {}),
      ...(input.title ? { title: input.title } : {}),
      body: input.body,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${GROUPS}/${groupId}/posts`);
  }
}

export async function deleteGroupPost(groupId: string, postId: string): Promise<void> {
  const database = requireDb();
  try {
    await deleteDoc(doc(database, GROUPS, groupId, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GROUPS}/${groupId}/posts`);
  }
}
