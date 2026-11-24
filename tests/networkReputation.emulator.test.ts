import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

/**
 * Endorsements and recommendations against the real rules, in the real emulator.
 *
 * The panel is careful, but the rules are what make the promise true: one endorsement
 * per (member × skill), never from a member about themselves, one recommendation per
 * pair, and a recommendation's date of writing cannot be laundered by an edit.
 */
const projectId = 'demo-insco-account-privacy';
const emulator = process.env.FIRESTORE_EMULATOR_HOST?.match(/^(127\.0\.0\.1|localhost):(\d{1,5})$/);
assert.ok(emulator, 'Start the loopback Firebase emulator via npm run test:account-rules:emulator');

const apps: FirebaseApp[] = [];
function newClient(name: string, token?: Parameters<typeof connectFirestoreEmulator>[3]): Firestore {
  const app = initializeApp({ projectId }, `reputation-${name}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, emulator![1], Number(emulator![2]), token);
  apps.push(app);
  return db;
}
const member = (name: string) =>
  newClient(name, { mockUserToken: { sub: name, email_verified: true, email: `${name}@example.test` } });

const endorsee = member('rep-endorsee');
const endorser = member('rep-endorser');
const other = member('rep-other');
const unverified = newClient('rep-unverified', {
  mockUserToken: { sub: 'rep-endorsee', email_verified: false, email: 'rep-endorsee@example.test' },
});

const deny = (value: Promise<unknown>) => assert.rejects(value, { code: 'permission-denied' });

const endorsement = (fromUid: string, toUid: string, skillId: string) => ({
  toUid,
  fromUid,
  skillId,
  fromName: 'عضو',
  createdAt: serverTimestamp(),
});
const endorsementId = (toUid: string, skillId: string, fromUid: string) => `${toUid}_${skillId}_${fromUid}`;

const recommendation = (fromUid: string, toUid: string, body: string) => ({
  fromUid,
  fromName: 'عضو',
  toUid,
  toName: 'عضو آخر',
  relation: 'colleague',
  body,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
const recommendationId = (fromUid: string, toUid: string) => `${fromUid}_${toUid}`;
const longBody = 'عملنا معاً في فحص خط أنابيب بطول ١٢ بوصة وكان التوثيق دقيقاً ومنظماً.';

after(async () => {
  await terminate(getFirestore(initializeApp({ projectId }, 'reputation-cleanup'))).catch(() => {});
  await Promise.all(apps.map(app => deleteApp(app).catch(() => {})));
});

test('a member endorses a colleague once; the second write is refused', async () => {
  const id = endorsementId('rep-endorsee', 'ut', 'rep-endorser');
  await setDoc(doc(endorser, 'community_endorsements', id), endorsement('rep-endorser', 'rep-endorsee', 'ut'));
  // Clicking twice hits the same document, and an update is not allowed.
  await deny(setDoc(doc(endorser, 'community_endorsements', id), endorsement('rep-endorser', 'rep-endorsee', 'ut')));
});

test('nobody endorses themselves, and only the endorser withdraws', async () => {
  await deny(
    setDoc(
      doc(endorsee, 'community_endorsements', endorsementId('rep-endorsee', 'paut', 'rep-endorsee')),
      endorsement('rep-endorsee', 'rep-endorsee', 'paut')
    )
  );

  const id = endorsementId('rep-endorsee', 'ut', 'rep-endorser');
  await deny(deleteDoc(doc(endorsee, 'community_endorsements', id)));
  await deny(deleteDoc(doc(other, 'community_endorsements', id)));
  await deleteDoc(doc(endorser, 'community_endorsements', id));
});

test('an unverified account cannot endorse', async () => {
  await deny(
    setDoc(
      doc(unverified, 'community_endorsements', endorsementId('rep-other', 'mt', 'rep-endorsee')),
      endorsement('rep-endorsee', 'rep-other', 'mt')
    )
  );
});

test('an endorsement with an id that does not match its fields is refused', async () => {
  await deny(
    setDoc(
      doc(endorser, 'community_endorsements', 'rep-other_ut_rep-endorser'),
      endorsement('rep-endorser', 'rep-endorsee', 'ut')
    )
  );
});

test('a recommendation needs real words', async () => {
  const id = recommendationId('rep-endorser', 'rep-endorsee');
  await deny(setDoc(doc(endorser, 'community_recommendations', id), recommendation('rep-endorser', 'rep-endorsee', 'جيد')));
  await setDoc(doc(endorser, 'community_recommendations', id), recommendation('rep-endorser', 'rep-endorsee', longBody));
});

test('an edit keeps the writing date and cannot change the subject', async () => {
  const id = recommendationId('rep-endorser', 'rep-endorsee');

  // Rewriting `createdAt` is what a laundered testimonial would look like.
  await deny(
    updateDoc(doc(endorser, 'community_recommendations', id), {
      body: `${longBody} وأكثر.`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  // The subject may delete it, but may not rewrite the words.
  await deny(
    updateDoc(doc(endorsee, 'community_recommendations', id), {
      body: `${longBody} أنا أوصي بنفسي.`,
      updatedAt: serverTimestamp(),
    })
  );

  await updateDoc(doc(endorser, 'community_recommendations', id), {
    body: `${longBody} وأكثر.`,
    updatedAt: serverTimestamp(),
  });

  await deny(deleteDoc(doc(other, 'community_recommendations', id)));
  await deleteDoc(doc(endorsee, 'community_recommendations', id));
});

test('skills on a card must be catalogue-shaped, and a cleared list is allowed', async () => {
  const card = (skills: string | undefined) => {
    const base: Record<string, unknown> = {
      uid: 'rep-endorser',
      displayName: 'عضو',
      organizationName: 'إنسكو',
      sector: 'الفحص غير الإتلافي',
      companiesManaged: 0,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    return skills === undefined ? base : { ...base, skills };
  };

  const ref = doc(endorser, 'community_workspaces', 'rep-endorser');
  await setDoc(ref, card('ut,paut'));
  // Editing the list goes through updateDoc (as the production service does): the
  // card's `createdAt` must survive an edit, so a full-card setDoc here would be
  // refused by the update rule for the wrong reason (date immutability, not skills).
  await updateDoc(ref, { skills: '', updatedAt: serverTimestamp() });
  // A non-catalogue id is refused for the skills check, not for anything else.
  await deny(updateDoc(ref, { skills: 'UT, paut', updatedAt: serverTimestamp() }));
  const many = Array.from({ length: 21 }, (_, index) => `skill_${index}`).join(',');
  await deny(updateDoc(ref, { skills: many, updatedAt: serverTimestamp() }));
});
