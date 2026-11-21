import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDocFromServer, getDocsFromServer, getFirestore,
  query, serverTimestamp, setDoc, terminate, Timestamp, updateDoc, where, writeBatch, type Firestore,
} from 'firebase/firestore';

// Never use production config or credentials for this suite.
const projectId = 'demo-insco-account-privacy';
const emulator = process.env.FIRESTORE_EMULATOR_HOST?.match(/^(127\.0\.0\.1|localhost):(\d{1,5})$/);
assert.ok(emulator, 'Start the loopback Firebase emulator via npm run test:account-rules:emulator');
const apps: Array<{ app: FirebaseApp; db: Firestore }> = [];
function newClient(name: string, token?: Parameters<typeof connectFirestoreEmulator>[3]) {
  const app = initializeApp({ projectId }, name);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, emulator![1], Number(emulator![2]), token);
  apps.push({ app, db });
  return db;
}
function user(name: string, uid = name, verified = true, email = `${name}@example.test`) {
  return newClient(name, { mockUserToken: { sub: uid, email_verified: verified, email } });
}
const guest = newClient('guest');
const alice = user('alice');
const bob = user('bob');
const unverifiedAlice = user('unverified-alice', 'alice', false);
const bootstrapAdmin = user('admin', 'admin', true, 'inscondtco@gmail.com');
const reviewer = user('reviewer');
const unverifiedReviewer = user('unverified-reviewer', 'reviewer', false);
const consoleOperator = newClient('operator', { mockUserToken: 'owner' });
const profile = (uid: string) => ({
  uid, fullName: `Private ${uid}`, email: `${uid}@example.test`, phone: '', organizationName: '',
  role: 'client', approvalStatus: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
});
const atProfile = (db: Firestore, uid: string) => doc(db, 'client_accounts', uid);
const getProfile = (db: Firestore, uid: string) => getDocFromServer(atProfile(db, uid));
const deny = (value: Promise<unknown>) => assert.rejects(value, { code: 'permission-denied' });
const progress = (db: Firestore, uid: string) => doc(db, 'user_module_progress', `${uid}_mod_ut`);
const createReview = (db: Firestore, who: string, subjectUid: string, auditId: string, reason = 'account_support') => {
  const batch = writeBatch(db);
  batch.set(doc(db, 'account_review_audit', auditId), {
    reviewerUid: who, subjectUid, caseReference: 'CASE-101', reason, createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'account_review_access', who), { auditId, subjectUid, createdAt: serverTimestamp() });
  return batch.commit();
};

before(async () => {
  const url = `http://${emulator![0]}:${emulator![2]}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(url, { method: 'DELETE' });
  assert.ok(response.ok, 'Could not reset the test-only emulator');
  await setDoc(doc(consoleOperator, 'account_reviewers', 'reviewer'), { enabled: true });
});

after(async () => {
  await Promise.all(apps.map(async ({ app, db }) => { await terminate(db); await deleteApp(app); }));
});

test('verified users can save and open only their own private profile, not list all records or make themselves staff', async () => {
  assert.equal((await getProfile(alice, 'alice')).exists(), false);
  await setDoc(atProfile(alice, 'alice'), profile('alice'));
  await setDoc(atProfile(bob, 'bob'), profile('bob'));
  assert.equal((await getProfile(alice, 'alice')).data()?.fullName, 'Private alice');
  await deny(getProfile(guest, 'alice'));
  await deny(getProfile(unverifiedAlice, 'alice'));
  await deny(getProfile(bob, 'alice'));
  await deny(getProfile(bootstrapAdmin, 'alice'));
  await deny(getDocsFromServer(collection(bootstrapAdmin, 'client_accounts')));
  await deny(getDocsFromServer(collection(reviewer, 'client_accounts')));
  await deny(updateDoc(atProfile(bob, 'alice'), { fullName: 'Wrong owner', updatedAt: serverTimestamp() }));
  await deny(updateDoc(atProfile(alice, 'alice'), { role: 'admin', updatedAt: serverTimestamp() }));
  await deny(setDoc(doc(bob, 'account_reviewers', 'bob'), { enabled: true }));
  await updateDoc(atProfile(alice, 'alice'), { fullName: 'Alice Updated', updatedAt: serverTimestamp() });
  assert.equal((await getProfile(alice, 'alice')).data()?.fullName, 'Alice Updated');
});

test('authorized staff need an immutable, matching audit request; expiry and role revocation close access', async () => {
  await deny(getProfile(reviewer, 'alice'));
  await deny(createReview(bob, 'bob', 'alice', 'customer-cannot-review'));
  await deny(createReview(unverifiedReviewer, 'reviewer', 'alice', 'unverified-cannot-review'));
  await deny(createReview(reviewer, 'admin', 'alice', 'invalid-reviewer'));
  await deny(createReview(reviewer, 'reviewer', 'alice', 'invalid-reason', 'unknown'));
  const grant = doc(reviewer, 'account_review_access', 'reviewer');
  await deny(setDoc(grant, { auditId: 'no-audit', subjectUid: 'alice', createdAt: serverTimestamp() }));
  const log = doc(reviewer, 'account_review_audit', 'review-1');
  await deny(setDoc(log, {
    reviewerUid: 'reviewer', subjectUid: 'alice', reason: 'account_support', caseReference: 'CASE-101', createdAt: serverTimestamp(),
  }));
  await createReview(reviewer, 'reviewer', 'alice', 'review-1');
  assert.equal((await getProfile(reviewer, 'alice')).data()?.fullName, 'Alice Updated');
  assert.equal((await getDocFromServer(doc(consoleOperator, 'account_review_audit', 'review-1'))).data()?.caseReference, 'CASE-101');
  await deny(getProfile(reviewer, 'bob'));
  await deny(getProfile(unverifiedReviewer, 'alice'));
  await deny(getDocFromServer(log));
  await deny(getDocFromServer(doc(alice, 'account_review_audit', 'review-1')));
  await deny(updateDoc(log, { caseReference: 'REDACTED' }));
  await deny(deleteDoc(log));
  await deny(setDoc(grant, { auditId: 'review-1', subjectUid: 'alice', createdAt: serverTimestamp() }));
  await deny(updateDoc(atProfile(reviewer, 'alice'), { approvalStatus: 'approved', updatedAt: serverTimestamp() }));
  await createReview(reviewer, 'reviewer', 'bob', 'review-2');
  await deny(getProfile(reviewer, 'alice'));
  assert.ok((await getProfile(reviewer, 'bob')).exists());
  await updateDoc(doc(consoleOperator, 'account_review_access', 'reviewer'), { createdAt: Timestamp.fromMillis(Date.now() - 6 * 60 * 1000) });
  await deny(getProfile(reviewer, 'bob'));
  await createReview(reviewer, 'reviewer', 'bob', 'review-3');
  await deleteDoc(doc(consoleOperator, 'account_reviewers', 'reviewer'));
  await deny(getProfile(reviewer, 'bob'));
});

test('company linking requires both the operations role and an active company-link reason', async () => {
  await setDoc(doc(consoleOperator, 'account_reviewers', 'admin'), { enabled: true });
  await createReview(bootstrapAdmin, 'admin', 'bob', 'admin-1');
  await deny(updateDoc(atProfile(bootstrapAdmin, 'bob'), { approvalStatus: 'approved', updatedAt: serverTimestamp() }));
  await createReview(bootstrapAdmin, 'admin', 'bob', 'admin-2', 'company_link');
  await deny(updateDoc(atProfile(bootstrapAdmin, 'bob'), { fullName: 'Unauthorized edit', updatedAt: serverTimestamp() }));
  await updateDoc(atProfile(bootstrapAdmin, 'bob'), { approvalStatus: 'approved', updatedAt: serverTimestamp() });
  assert.equal((await getProfile(bob, 'bob')).data()?.approvalStatus, 'approved');
});

test('personal academy records cannot be listed, replaced, or reassigned by other accounts', async () => {
  await setDoc(progress(alice, 'alice'), { userId: 'alice', moduleId: 'mod_ut', score: 90 });
  await deny(getDocFromServer(progress(bob, 'alice')));
  await deny(getDocsFromServer(collection(bootstrapAdmin, 'user_module_progress')));
  await deny(setDoc(progress(bob, 'alice'), { userId: 'bob', moduleId: 'mod_ut', score: 0 }));
  await deny(updateDoc(progress(alice, 'alice'), { userId: 'bob' }));
  await deny(setDoc(progress(unverifiedAlice, 'alice'), { userId: 'alice', moduleId: 'mod_ut', score: 1 }));
  const mine = await getDocsFromServer(query(collection(alice, 'user_module_progress'), where('userId', '==', 'alice')));
  assert.equal(mine.size, 1);
  assert.equal(mine.docs[0].data().score, 90);
});
