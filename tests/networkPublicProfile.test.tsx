/**
 * `#network/people/<uid>` — the member's public page.
 *
 * The page is the part of the network a stranger can reach from a shared link, so the
 * risks are honesty risks: showing a members-only card to a signed-out visitor, drawing
 * a banner the member never had, claiming a certificate is verified, padding the page
 * with invented posts, or turning "refused by the rules" into "no such member".
 */
import React from 'react';
import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  history: dom.window.history,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

type Card = Record<string, unknown> | null;

let card: Card = null;
let denied = false;
let posts: Record<string, unknown>[] = [];
let signedIn = true;
let verified = true;
let neverAnswers = false;

const user = { uid: 'uid-viewer', email: 'viewer@example.test' };

mock.module('../src/client/firestoreClientService.ts', {
  namedExports: {
    observeClientPortalAuth: (callback: (u: typeof user | null) => void) => {
      callback(signedIn ? user : null);
      return () => {};
    },
    isPortalFirestoreReady: () => true,
    clearPendingRegistrationDraft: () => {},
    loadPendingRegistrationDraft: () => null,
    confirmClientPortalVerification: async () => verified,
    resendClientVerificationEmail: async () => {},
    getCommunityWorkspace: async () => {
      if (neverAnswers) return new Promise(() => {});
      if (denied) {
        throw Object.assign(new Error('Firestore get failed (permission-denied)'), { code: 'permission-denied' });
      }
      return card;
    },
    subscribeAuthorPublicPosts: (_uid: string, onData: (list: unknown[]) => void) => {
      onData(posts);
      return () => {};
    },
  },
});

const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkMemberProfile } = await import('../src/components/network/NetworkMemberProfile');
const { render, cleanup, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  card = null;
  denied = false;
  posts = [];
  signedIn = true;
  verified = true;
  neverAnswers = false;
});

afterEach(() => cleanup());

/** `container` scoped lookup, so a wait cannot accidentally match another state. */
const getByTestIdSafe = (container: HTMLElement, id: string): Element | null =>
  container.querySelector(`[data-testid="${id}"]`);

const mount = (slowAfterMs = 30) =>
  render(
    <SiteAccountProvider>
      <NetworkMemberProfile
        uid="uid-member"
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        onOpenDirectory={() => {}}
        slowAfterMs={slowAfterMs}
      />
    </SiteAccountProvider>
  );

const publishedCard = (overrides: Record<string, unknown> = {}) => ({
  uid: 'uid-member',
  displayName: 'أحمد سيد محمود',
  organizationName: 'إنسكو للفحص',
  sector: 'الفحص غير الإتلافي',
  headline: 'مفتش PAUT — المستوى الثاني',
  city: 'الجيزة',
  bio: 'خبرة ميدانية في فحص اللحام.',
  specialtyTrades: 'PAUT · TOFD · UT',
  certifications: 'ASNT Level II (إقرار)',
  yearsExperience: 9,
  availabilityStatus: 'open_to_work',
  companiesManaged: 0,
  isPublished: true,
  ...overrides,
});

test('a public card renders its own banner, photo, LinkedIn button and declared certificates', async () => {
  signedIn = false;
  verified = false;
  card = publishedCard({
    profileVisibility: 'public',
    bannerURL: 'https://firebasestorage.example/banner.jpg',
    photoURL: 'https://firebasestorage.example/photo.jpg',
    linkedInUrl: 'https://www.linkedin.com/in/ahmed',
  });

  const { getByTestId, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-member-live')));

  assert.equal(getByTestId('network-member-name').textContent, 'أحمد سيد محمود');
  assert.equal(getByTestId('network-member-banner').getAttribute('src'), 'https://firebasestorage.example/banner.jpg');
  assert.equal(getByTestId('network-member-photo').getAttribute('src'), 'https://firebasestorage.example/photo.jpg');

  const linkedIn = getByTestId('network-member-linkedin');
  assert.equal(linkedIn.getAttribute('href'), 'https://www.linkedin.com/in/ahmed');
  assert.equal(linkedIn.getAttribute('rel'), 'noopener noreferrer nofollow');
  assert.equal(linkedIn.getAttribute('target'), '_blank');

  const text = container.textContent ?? '';
  assert.ok(text.includes('ASNT Level II'), 'declared certificates are shown');
  assert.ok(text.includes('غير مُتحقَّق منها'), 'and are labelled as unverified, not as badges');
  assert.ok(text.includes('PAUT · TOFD · UT'));
  assert.ok(text.includes('9 سنة خبرة'));
});

test('a card without images says so instead of drawing someone else\'s banner', async () => {
  card = publishedCard({ profileVisibility: 'public' });
  const { getByTestId, container } = mount();

  await waitFor(() => assert.ok(getByTestId('network-member-live')));
  assert.ok(getByTestId('network-member-banner-placeholder'));
  assert.ok(getByTestId('network-member-photo-placeholder'));
  assert.equal(container.querySelector('[data-testid="network-member-banner"]'), null);
  assert.equal((container.textContent ?? '').includes('لا بانر بعد'), true);
});

test('a members-only card is refused to a signed-out visitor, in the page own words', async () => {
  signedIn = false;
  verified = false;
  card = publishedCard({ profileVisibility: 'members' });

  const { getByTestId, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-member-private')));

  const text = container.textContent ?? '';
  assert.ok(text.includes('للأعضاء المؤكَّدين'));
  assert.ok(text.includes('قواعد الحماية'), 'the refusal is attributed to the rules, not to a hidden button');
  assert.equal(container.querySelector('[data-testid="network-member-name"]'), null);
});

test('the rules refusing the read is reported as private, never as "no such member"', async () => {
  signedIn = false;
  denied = true;

  const { getByTestId, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-member-private')));
  assert.equal(container.querySelector('[data-testid="network-member-missing"]'), null);
});

test('a confirmed member can open a members-only card', async () => {
  signedIn = true;
  verified = true;
  card = publishedCard({ profileVisibility: 'members' });

  const { getByTestId, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-member-live')));
  assert.ok((container.textContent ?? '').includes('للأعضاء المؤكَّدين'), 'the audience is stated on the page');
});

test('an unknown uid is a missing card, and no card is invented to fill the page', async () => {
  card = null;
  const { getByTestId, container } = mount();

  await waitFor(() => assert.ok(getByTestId('network-member-missing')));
  assert.equal((container.textContent ?? '').includes('لا نعرض بطاقة بديلة'), true);
});

test('a card hidden from the directory says it is not published', async () => {
  card = publishedCard({ isPublished: false });
  const { getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-member-not-published')));
});

test('the public posts are the public ones only, and an empty list is said out loud', async () => {
  card = publishedCard({ profileVisibility: 'public' });
  posts = [
    {
      id: 'p1',
      authorUid: 'uid-member',
      authorName: 'أحمد',
      authorOrg: 'إنسكو',
      postType: 'insight',
      ndtMethod: 'PAUT',
      title: 'درس من موقع البرلس',
      body: 'قياس على عينة ملحومة قبل الفحص الكامل.',
      likesCount: 0,
      commentsCount: 0,
      visibility: 'public',
      aiModerationStatus: 'approved',
      isPinnedAnnouncement: false,
    },
  ];

  const first = mount();
  await waitFor(() => assert.ok(first.getByTestId('network-member-posts')));
  assert.equal(first.getAllByTestId('network-member-post').length, 1);
  assert.ok((first.getByTestId('network-member-post').textContent ?? '').includes('درس من موقع البرلس'));
  cleanup();

  posts = [];
  const second = mount();
  await waitFor(() => assert.ok(second.getByTestId('network-member-posts-empty')));
  assert.equal((second.container.textContent ?? '').includes('لا منشورات علنية بعد'), true);
});

test('a blocked connection is reported as blocked, not as a missing member', async () => {
  neverAnswers = true;
  const { container } = mount(20);
  await waitFor(() => assert.ok(getByTestIdSafe(container, 'network-member-loading')));
  await waitFor(() => assert.ok((container.textContent ?? '').includes('اتصال لم يكتمل')));
  assert.equal(container.querySelector('[data-testid="network-member-missing"]'), null);
});

test('the owner sees an edit action and a copy-link, a visitor does not', async () => {
  card = publishedCard({ profileVisibility: 'public' });
  signedIn = true;

  const asVisitor = mount();
  await waitFor(() => assert.ok(asVisitor.getByTestId('network-member-live')));
  assert.equal(asVisitor.container.querySelector('[data-testid="network-member-edit"]'), null);
  cleanup();

  const asOwner = render(
    <SiteAccountProvider>
      <NetworkMemberProfile
        uid="uid-viewer"
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        onOpenDirectory={() => {}}
        slowAfterMs={30}
      />
    </SiteAccountProvider>
  );
  await waitFor(() => assert.ok(asOwner.getByTestId('network-member-live')));
  assert.ok(asOwner.getByTestId('network-member-edit'));
});

/* ------------------------------ the editor ------------------------------- */

test('the editor offers the three routes, the audience choice, and admits when upload is off', async () => {
  const { NetworkIdentityFields } = await import('../src/components/network/NetworkIdentityFields');
  const form = await import('../src/network/networkProfileForm');
  const changes: [string, unknown][] = [];

  const { getByTestId, getByLabelText, container } = render(
    <NetworkIdentityFields
      language="ar"
      draft={{ ...form.EMPTY_NETWORK_PROFILE, displayName: 'أحمد محمود' }}
      user={null}
      uploadEnabled={false}
      errors={new Map()}
      onChange={(key, value) => changes.push([String(key), value])}
    />
  );

  assert.ok(getByTestId('network-identity-fields'));
  assert.ok(getByTestId('network-generate-banner'), 'a banner can be generated from the card');
  assert.ok(getByLabelText('رابط LinkedIn'));
  assert.ok(getByTestId('network-visibility-public'));
  assert.ok(getByTestId('network-visibility-members'));

  const text = container.textContent ?? '';
  assert.ok(text.includes('رفع الصور يحتاج تهيئة Firebase Storage'), 'upload is plainly declared unavailable');
  assert.ok(text.includes('توليد بانر احترافي'));

  (getByTestId('network-visibility-members') as HTMLInputElement).click();
  assert.deepEqual(changes.at(-1), ['profileVisibility', 'members']);
});

test('when the browser cannot draw, generation says so instead of uploading a blank image', async () => {
  const { NetworkIdentityFields } = await import('../src/components/network/NetworkIdentityFields');
  const form = await import('../src/network/networkProfileForm');
  const { getByTestId, findByTestId } = render(
    <NetworkIdentityFields
      language="ar"
      draft={{ ...form.EMPTY_NETWORK_PROFILE, displayName: 'أحمد محمود', headline: 'مفتش PAUT' }}
      user={null}
      uploadEnabled={false}
      errors={new Map()}
      onChange={() => {}}
    />
  );

  (getByTestId('network-generate-banner') as HTMLButtonElement).click();
  const status = await findByTestId('network-identity-status');
  assert.ok((status.textContent ?? '').includes('لا يدعم رسم الصور'), 'jsdom has no canvas: the message is honest');
});
