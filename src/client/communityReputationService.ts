/**
 * Endorsements and written recommendations — the two things another member can
 * add to your card.
 *
 * Both are sets keyed by a deterministic id, so "did I already endorse this?" is
 * answered by the document id rather than by a counter that can drift, and a
 * double click cannot double the number.
 */
import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import type { CommunityEndorsement, CommunityRecommendation } from './types';
import {
  endorsementId,
  recommendationId,
  type RecommendationDraft,
  type RecommendationRelation,
} from '../network/networkSkills';

const ENDORSEMENTS = 'community_endorsements';
const RECOMMENDATIONS = 'community_recommendations';

const requireDb = () => {
  if (!db) throw new Error('Firestore not initialized');
  return db;
};

/**
 * The name shown next to an endorsement or a recommendation: the member's own card
 * name, never the email or the auth display name. Falls back to empty, and the
 * caller decides what to write — guessing a name would put words in someone's mouth.
 */
export async function loadMyDisplayName(uid: string): Promise<string> {
  if (!db || !uid) return '';
  try {
    const snap = await getDoc(doc(db, 'community_workspaces', uid));
    const name = (snap.data() as { displayName?: unknown } | undefined)?.displayName;
    return typeof name === 'string' ? name : '';
  } catch {
    return '';
  }
}

/* ------------------------------- endorsements ------------------------------ */

export function subscribeEndorsements(
  toUid: string,
  onData: (rows: CommunityEndorsement[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db || !toUid) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, ENDORSEMENTS), where('toUid', '==', toUid), limit(300));
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityEndorsement, 'id'>) }))),
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, ENDORSEMENTS);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/**
 * Endorse one skill. `setDoc` on a fixed id makes this idempotent: the second
 * attempt writes the same document instead of adding a second endorsement.
 */
export async function endorseSkill(
  user: User,
  target: { uid: string; skillId: string },
  fromName: string
): Promise<void> {
  const database = requireDb();
  try {
    await setDoc(doc(database, ENDORSEMENTS, endorsementId(target.uid, target.skillId, user.uid)), {
      toUid: target.uid,
      skillId: target.skillId,
      fromUid: user.uid,
      fromName,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ENDORSEMENTS);
  }
}

export async function withdrawEndorsement(fromUid: string, target: { uid: string; skillId: string }): Promise<void> {
  const database = requireDb();
  try {
    await deleteDoc(doc(database, ENDORSEMENTS, endorsementId(target.uid, target.skillId, fromUid)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, ENDORSEMENTS);
  }
}

/** Whether *I* endorsed each skill — read once, used to label the button honestly. */
export async function loadMyEndorsements(
  fromUid: string,
  toUid: string
): Promise<Record<string, true>> {
  if (!db || !fromUid || !toUid) return {};
  try {
    const snap = await getDocs(
      query(
        collection(db, ENDORSEMENTS),
        where('toUid', '==', toUid),
        where('fromUid', '==', fromUid),
        limit(50)
      )
    );
    const rows: Record<string, true> = {};
    for (const entry of snap.docs) {
      const skillId = (entry.data() as { skillId?: unknown }).skillId;
      if (typeof skillId === 'string') rows[skillId] = true;
    }
    return rows;
  } catch {
    // A refusal here only means the buttons stay neutral; the list still renders.
    return {};
  }
}

/* ------------------------------ recommendations ---------------------------- */

export function subscribeRecommendations(
  toUid: string,
  onData: (rows: CommunityRecommendation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db || !toUid) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, RECOMMENDATIONS), where('toUid', '==', toUid), limit(30));
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CommunityRecommendation, 'id'>) }))),
    err => {
      try {
        handleFirestoreError(err, OperationType.LIST, RECOMMENDATIONS);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/**
 * Write or edit *my* recommendation about someone. Creating sends `createdAt`;
 * editing never touches it, because the rules require it to stay unchanged — a
 * `setDoc` here would rewrite the creation date to "now" and be refused.
 */
export async function writeRecommendation(
  user: User,
  target: { uid: string; displayName: string },
  fromName: string,
  input: { relation: RecommendationRelation; body: string },
  options: { exists: boolean }
): Promise<void> {
  const database = requireDb();
  const ref = doc(database, RECOMMENDATIONS, recommendationId(user.uid, target.uid));
  try {
    if (options.exists) {
      await updateDoc(ref, {
        relation: input.relation,
        body: input.body,
        updatedAt: serverTimestamp(),
      });
      return;
    }
    await setDoc(ref, {
      fromUid: user.uid,
      fromName,
      toUid: target.uid,
      toName: target.displayName,
      relation: input.relation,
      body: input.body,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, options.exists ? OperationType.UPDATE : OperationType.CREATE, RECOMMENDATIONS);
  }
}

export async function deleteRecommendation(id: string): Promise<void> {
  const database = requireDb();
  try {
    await deleteDoc(doc(database, RECOMMENDATIONS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, RECOMMENDATIONS);
  }
}
