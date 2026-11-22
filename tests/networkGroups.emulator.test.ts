import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

/**
 * Groups against the real rules, in the real emulator.
 *
 * The whole promise of this phase is that the owner's two choices are enforced by
 * `firestore.rules` and not by a disabled button — so the refusals are what these tests
 * check: a visitor cannot walk into a request-only or invitation-only group, a member
 * cannot approve themselves, and a group's feed is unreadable to a non-member.
 */
const projectId = 'demo-insco-account-privacy';
const emulator = process.env.FIRESTORE_EMULATOR_HOST?.match(/^(127\.0\.0\.1|localhost):(\d{1,5})$/);
assert.ok(emulator, 'Start the loopback Firebase emulator via npm run test:account-rules:emulator');

const apps: FirebaseApp[] = [];
function newClient(name: string, token?: Parameters<typeof connectFirestoreEmulator>[3]): Firestore {
  const app = initializeApp({ projectId }, `groups-${name}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, emulator![1], Number(emulator![2]), token);
  apps.push(app);
  return db;
}
const member = (name: string, uid = name) =>
  newClient(name, { mockUserToken: { sub: uid, email_verified: true, email: `${name}@example.test` } });

const guest = newClient('groups-guest');
const owner = member('owner');
const joiner = member('joiner');
const stranger = member('stranger');
const unverified = newClient('groups-unverified', {
  mockUserToken: { sub: 'owner', email_verified: false, email: 'owner@example.test' },
});

const deny = (value: Promise<unknown>) => assert.rejects(value, { code: 'permission-denied' });

/**
 * A query that a rule cannot evaluate statically (because the rule calls `get()`) is
 * rejected by Firestore rather than returning rows. Both codes are a refusal, and both
 * mean the same thing here: no rows for this caller.
 */
const denyQuery = async (value: Promise<unknown>) => {
  await assert.rejects(value, (error: { code?: string }) =>
    ['permission-denied', 'failed-precondition', 'invalid-argument'].includes(error.code ?? '')
  );
};

const group = (id: string, overrides: Record<string, unknown> = {}) => ({
  name: `جروب ${id}`,
  description: 'وصف كافٍ للجروب في المحاكي.',
  ownerUid: 'owner',
  ownerName: 'مالك الجروب',
  joinPolicy: 'open',
  postPolicy: 'members',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

const memberRow = (groupId: string, uid: string, overrides: Record<string, unknown> = {}) => ({
  groupId,
  uid,
  displayName: `عضو ${uid}`,
  role: 'member',
  status: 'approved',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

const atGroup = (db: Firestore, id: string) => doc(db, 'community_groups', id);
const atMember = (db: Firestore, groupId: string, uid: string) =>
  doc(db, 'community_group_members', `${groupId}_${uid}`);
const atPost = (db: Firestore, groupId: string, postId: string) =>
  doc(db, 'community_groups', groupId, 'posts', postId);

const post = (overrides: Record<string, unknown> = {}) => ({
  authorUid: 'joiner',
  authorName: 'عضو المنشور',
  body: 'منشور تجريبي داخل الجروب فقط.',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

/**
 * Owner creates the group, then their own membership row — two writes, in that order,
 * exactly as the service does. A batch cannot work here: the row's rule needs to see
 * the group, and `exists()` in rules is evaluated before the commit.
 */
async function createGroup(id: string, overrides: Record<string, unknown> = {}) {
  await setDoc(atGroup(owner, id), group(id, overrides));
  await setDoc(atMember(owner, id, 'owner'), memberRow(id, 'owner', { role: 'owner' }));
}

after(async () => {
  await Promise.allSettled(apps.map(app => terminate(getFirestore(app)).then(() => deleteApp(app))));
});

test('the owner creates a group together with their own membership row', async () => {
  await createGroup('g-open');
  const snap = await getDocFromServer(atGroup(owner, 'g-open'));
  assert.equal(snap.exists(), true);
  assert.equal(snap.data()?.joinPolicy, 'open');

  // A group whose owner row is missing is still a valid document; what the rules refuse
  // is anyone else claiming the owner role.
  await deny(setDoc(atMember(owner, 'g-open', 'stranger'), memberRow('g-open', 'stranger', { role: 'owner' })));
});

test('an unverified owner cannot create a group', async () => {
  await deny(setDoc(atGroup(unverified, 'g-unverified'), group('g-unverified')));
});

test('an open group lets a confirmed member in, immediately and only as themselves', async () => {
  await setDoc(atMember(joiner, 'g-open', 'joiner'), memberRow('g-open', 'joiner'));
  const row = await getDocFromServer(atMember(joiner, 'g-open', 'joiner'));
  assert.equal(row.data()?.status, 'approved');

  // Writing a row for somebody else is refused, even in an open group.
  await deny(setDoc(atMember(joiner, 'g-open', 'stranger'), memberRow('g-open', 'stranger')));
});

test('a request-only group accepts a pending request and refuses a self-approval', async () => {
  await createGroup('g-request', { joinPolicy: 'request' });

  await setDoc(atMember(joiner, 'g-request', 'joiner'), memberRow('g-request', 'joiner', { status: 'pending' }));
  const pending = await getDocFromServer(atMember(joiner, 'g-request', 'joiner'));
  assert.equal(pending.data()?.status, 'pending');

  // Joining outright is refused: the policy is "by request".
  await deny(setDoc(atMember(stranger, 'g-request', 'stranger'), memberRow('g-request', 'stranger')));

  // And a member cannot approve their own request.
  await deny(updateDoc(atMember(joiner, 'g-request', 'joiner'), { status: 'approved', updatedAt: serverTimestamp() }));

  // The owner can.
  await updateDoc(atMember(owner, 'g-request', 'joiner'), { status: 'approved', updatedAt: serverTimestamp() });
  const approved = await getDocFromServer(atMember(owner, 'g-request', 'joiner'));
  assert.equal(approved.data()?.status, 'approved');
});

test('an invitation-only group cannot be joined from the outside, only by its owner', async () => {
  await createGroup('g-invite', { joinPolicy: 'invite' });

  await deny(setDoc(atMember(joiner, 'g-invite', 'joiner'), memberRow('g-invite', 'joiner')));
  await deny(setDoc(atMember(joiner, 'g-invite', 'joiner'), memberRow('g-invite', 'joiner', { status: 'pending' })));

  // The owner adds someone; the row is written by the owner, for that member.
  await setDoc(atMember(owner, 'g-invite', 'stranger'), memberRow('g-invite', 'stranger'));
  const added = await getDocFromServer(atMember(owner, 'g-invite', 'stranger'));
  assert.equal(added.data()?.status, 'approved');
});

test('the group itself is public to read, but only its owner may change its policies', async () => {
  const asGuest = await getDocFromServer(atGroup(guest, 'g-open'));
  assert.equal(asGuest.exists(), true, 'a visitor may see what exists before signing in');

  const list = await getDocsFromServer(collection(guest, 'community_groups'));
  assert.ok(list.docs.length >= 1, 'the group list is readable without a session');

  await deny(updateDoc(atGroup(stranger, 'g-open'), { postPolicy: 'owners', updatedAt: serverTimestamp() }));

  await updateDoc(atGroup(owner, 'g-open'), { postPolicy: 'owners', updatedAt: serverTimestamp() });
  const changed = await getDocFromServer(atGroup(owner, 'g-open'));
  assert.equal(changed.data()?.postPolicy, 'owners');
});

test('a group feed is unreadable to non-members and writable only as the policy allows', async () => {
  // A member of the open group posts; the owner has just switched it to "owner only".
  await deny(setDoc(atPost(joiner, 'g-open', 'p1'), post('p1')));

  await setDoc(atPost(owner, 'g-open', 'p1'), post({ authorUid: 'owner', authorName: 'مالك الجروب' }));

  // A member may read the feed…
  const read = await getDocFromServer(atPost(joiner, 'g-open', 'p1'));
  assert.equal(read.exists(), true);

  // …but a stranger, and a visitor with no session, may not.
  await denyQuery(getDocsFromServer(collection(stranger, 'community_groups', 'g-open', 'posts')));
  await denyQuery(getDocsFromServer(collection(guest, 'community_groups', 'g-open', 'posts')));

  // Switch back to "all members": the member can post, the stranger still cannot.
  await updateDoc(atGroup(owner, 'g-open'), { postPolicy: 'members', updatedAt: serverTimestamp() });
  await setDoc(atPost(joiner, 'g-open', 'p2'), post({ body: 'منشور بعد إعادة فتح النشر للأعضاء.' }));
  await deny(setDoc(atPost(stranger, 'g-open', 'p3'), post({ authorUid: 'stranger' })));
});

test('the owner can remove a member; a member cannot remove another member', async () => {
  await createGroup('g-remove');
  await setDoc(atMember(joiner, 'g-remove', 'joiner'), memberRow('g-remove', 'joiner'));
  await setDoc(atMember(stranger, 'g-remove', 'stranger'), memberRow('g-remove', 'stranger'));

  await deny(deleteDoc(atMember(joiner, 'g-remove', 'stranger')));
  await deleteDoc(atMember(owner, 'g-remove', 'stranger'));

  const gone = await getDocFromServer(atMember(owner, 'g-remove', 'stranger'));
  assert.equal(gone.exists(), false);
});
