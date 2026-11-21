import { collection, doc, getDocFromServer, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { ClientAccount } from '../client/types';

export const ACCOUNT_REVIEW_MS = 5 * 60 * 1000;
export const ACCOUNT_REVIEW_REASONS = ['account_support', 'company_link', 'data_request'] as const;
export type AccountReviewReason = typeof ACCOUNT_REVIEW_REASONS[number];

interface ReviewRequest {
  subjectUid: string;
  caseReference: string;
  reason: AccountReviewReason;
}

export function validAccountReview({ subjectUid, caseReference, reason }: ReviewRequest): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(subjectUid)
    && /^[a-zA-Z0-9-]{4,40}$/.test(caseReference)
    && ACCOUNT_REVIEW_REASONS.includes(reason);
}

export async function canReviewPrivateAccounts(uid: string): Promise<boolean> {
  if (!db || auth?.currentUser?.uid !== uid || !auth.currentUser.emailVerified) return false;
  const reviewer = await getDocFromServer(doc(db, 'account_reviewers', uid));
  return auth.currentUser?.uid === uid && reviewer.data()?.enabled === true;
}

/** No list, guess-by-email, client-side role grant, or read before audit acknowledgement. */
export async function reviewPrivateAccount(input: ReviewRequest): Promise<ClientAccount | null> {
  const reviewer = auth?.currentUser;
  if (!db || !reviewer?.emailVerified || !validAccountReview(input) || reviewer.uid === input.subjectUid) {
    throw Object.assign(new Error('Invalid account review request'), { code: 'permission-denied' });
  }
  const { subjectUid, caseReference, reason } = input;
  const audit = doc(collection(db, 'account_review_audit'));
  const access = doc(db, 'account_review_access', reviewer.uid);
  const grant = writeBatch(db);
  grant.set(audit, { reviewerUid: reviewer.uid, subjectUid, caseReference, reason, createdAt: serverTimestamp() });
  grant.set(access, { auditId: audit.id, subjectUid, createdAt: serverTimestamp() });
  await grant.commit();
  if (auth?.currentUser?.uid !== reviewer.uid) return null;
  const snapshot = await getDocFromServer(doc(db, 'client_accounts', subjectUid));
  if (auth?.currentUser?.uid !== reviewer.uid) return null;
  return snapshot.exists() ? snapshot.data() as ClientAccount : null;
}
