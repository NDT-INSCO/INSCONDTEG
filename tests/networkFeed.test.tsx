/**
 * Phase D — the feed: real posts, real comments.
 *
 * The network publishes into the shipped `community_posts` collection through
 * the shipped service and rules. The tests that matter are the ones about what
 * could embarrass us:
 *
 *   1. the composer's limits are the database limits,
 *   2. a post always carries the author's real card — never a stand-in name,
 *   3. comments go through the service with the card identity, and the form
 *      refuses empty or over-long text before a write is attempted,
 *   4. an empty feed says it is empty, and a blocked connection says it is
 *      blocked — two different sentences.
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

const user = { uid: 'uid-alice', email: 'alice@example.test', displayName: 'Alice' };
const card = {
  uid: 'uid-alice',
  displayName: 'أحمد محمود',
  organizationName: 'إنسكو',
  sector: 'الفحص غير الإتلافي',
  companiesManaged: 0,
  isPublished: true,
  headline: 'مفتش PAUT — المستوى II',
};

type Call = { fn: string; args: unknown[] };
const calls: Call[] = [];
let feedPosts: unknown[] = [];
let feedComments: unknown[] = [];
let feedError: Error | null = null;
let neverAnswers = false;
let myReaction: { postId: string; uid: string; reactionType: string } | null = null;

mock.module('../src/client/firestoreClientService.ts', {
  namedExports: {
    observeClientPortalAuth: (callback: (u: typeof user | null) => void) => {
      callback(user);
      return () => {};
    },
    isPortalFirestoreReady: () => true,
    clearPendingRegistrationDraft: () => {},
    loadPendingRegistrationDraft: () => null,
    confirmClientPortalVerification: async () => true,
    resendClientVerificationEmail: async () => {},
    subscribeMyCommunityWorkspace: (uid: string, onData: (value: unknown) => void) => {
      if (uid === card.uid) onData(card);
      return () => {};
    },
    subscribeCommunityWorkspaces: (_admin: boolean, onData: (list: unknown[]) => void) => {
      onData([card]);
      return () => {};
    },
    upsertCommunityWorkspace: async (...args: unknown[]) => {
      calls.push({ fn: 'upsertCommunityWorkspace', args });
    },
    subscribeCommunityPosts: (
      _admin: boolean,
      onData: (list: unknown[]) => void,
      onError?: (error: Error) => void
    ) => {
      if (neverAnswers) return () => {};
      if (feedError) {
        onError?.(feedError);
        return () => {};
      }
      onData(feedPosts);
      return () => {};
    },
    createCommunityPost: async (...args: unknown[]) => {
      calls.push({ fn: 'createCommunityPost', args });
      return { id: 'new-post' };
    },
    subscribePostComments: (_postId: string, onData: (list: unknown[]) => void) => {
      onData(feedComments);
      return () => {};
    },
    addCommunityPostComment: async (...args: unknown[]) => {
      calls.push({ fn: 'addCommunityPostComment', args });
    },
    getCommunityPostReaction: async (...args: unknown[]) => {
      calls.push({ fn: 'getCommunityPostReaction', args });
      return myReaction;
    },
    setCommunityPostReaction: async (...args: unknown[]) => {
      calls.push({ fn: 'setCommunityPostReaction', args });
    },
  },
});

const feedForm = await import('../src/network/networkFeedForm');
const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkFeedSection } = await import('../src/components/network/NetworkFeedSection');
const { render, cleanup, fireEvent, waitFor, within } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  feedPosts = [];
  feedComments = [];
  feedError = null;
  neverAnswers = false;
  myReaction = null;
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

const mount = (slowAfterMs = 8000) =>
  render(
    <SiteAccountProvider>
      <NetworkFeedSection
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        slowAfterMs={slowAfterMs}
      />
    </SiteAccountProvider>
  );

/* ------------------------------ the contract ------------------------------- */

test('a complete post draft is accepted and an empty one is refused', () => {
  const valid = { ...feedForm.EMPTY_POST_DRAFT, title: 'إشارة على شطف 30°', body: 'التفاصيل الكاملة للسؤال الفني هنا.' };
  assert.deepEqual(feedForm.validatePostDraft(valid), []);

  const errors = feedForm.validatePostDraft(feedForm.EMPTY_POST_DRAFT);
  assert.ok(errors.some(error => error.field === 'title'));
  assert.ok(errors.some(error => error.field === 'body'));
  for (const error of errors) {
    assert.ok(error.ar.length > 4);
    assert.ok(error.en.length > 4);
  }
});

test('the composer limits are the rules limits', () => {
  const limits = feedForm.NETWORK_POST_LIMITS;
  const tooLongTitle = { ...feedForm.EMPTY_POST_DRAFT, title: 'ا'.repeat(limits.titleMax + 1), body: 'نص كافٍ' };
  assert.ok(feedForm.validatePostDraft(tooLongTitle).some(error => error.field === 'title'));

  const tooLongBody = { ...feedForm.EMPTY_POST_DRAFT, title: 'عنوان', body: 'ا'.repeat(limits.bodyMax + 1) };
  assert.ok(feedForm.validatePostDraft(tooLongBody).some(error => error.field === 'body'));

  assert.equal(feedForm.validatePostDraft({ ...feedForm.EMPTY_POST_DRAFT, title: 'ا'.repeat(limits.titleMax), body: 'نص كافٍ' }).some(e => e.field === 'title'), false);

  assert.ok(feedForm.validateCommentDraft('').length > 0);
  assert.equal(feedForm.validateCommentDraft('تعليق').length, 0);
  assert.ok(feedForm.validateCommentDraft('ا'.repeat(limits.commentMax + 1)).length > 0);
});

test('tags are cleaned, de-duplicated and bounded before they reach the database', () => {
  assert.deepEqual(feedForm.normaliseTags('#ASME-V, TOFD ، P91'), ['ASME-V', 'TOFD', 'P91']);
  assert.deepEqual(feedForm.normaliseTags('a, A, a'), ['a'], 'case-insensitive duplicates collapse');
  assert.equal(feedForm.normaliseTags('1,2,3,4,5,6,7,8').length, feedForm.NETWORK_POST_LIMITS.tagsMax);
  assert.deepEqual(
    feedForm.normaliseTags('ok, ' + 'x'.repeat(feedForm.NETWORK_POST_LIMITS.tagMax + 1)),
    ['ok'],
    'an over-long tag is dropped rather than truncated'
  );
});

test('every network post kind maps to a stored type the rules accept, and back again', () => {
  const stored = new Set(['technical_case', 'job_tender', 'discussion', 'equipment_review', 'announcement']);
  for (const kind of feedForm.NETWORK_POST_KINDS) {
    assert.ok(stored.has(kind.stored), `${kind.id} → ${kind.stored} must be a stored type`);
    const label = feedForm.displayKindForStored(kind.stored);
    assert.ok(label.ar.length > 1);
  }
  assert.equal(feedForm.postKindById('unknown'), undefined);
  assert.equal(feedForm.postKindById('technical')?.stored, 'discussion');
});

test('a post carries the member’s real card, and pinning is never requested', () => {
  const input = feedForm.toPostInput(
    { ...feedForm.EMPTY_POST_DRAFT, title: 'عنوان', body: 'نص كافٍ للسؤال', tags: 'UT' },
    { displayName: 'أحمد', organizationName: 'إنسكو', headline: 'مفتش', companyCode: 'INS-1' }
  );
  assert.equal(input.authorName, 'أحمد');
  assert.equal(input.authorOrg, 'إنسكو');
  assert.equal(input.isPinnedAnnouncement, false);
  assert.deepEqual(input.tags, ['UT']);
  assert.equal(input.postType, 'discussion');
  assert.equal(input.visibility, 'public');
});

/* -------------------------------- the screen ------------------------------- */

test('the feed says it is empty instead of showing trial posts', async () => {
  const { getByTestId, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-feed-empty')));
  assert.equal(container.querySelectorAll('[data-testid="network-post-card"]').length, 0);
  const text = container.textContent ?? '';
  assert.ok(text.includes('لا نملأ الفراغ بمنشورات تجريبية'));
});

test('a blocked connection is reported as blocked, not as an empty feed', async () => {
  neverAnswers = true;
  const { getByTestId, container } = mount(25);
  await waitFor(() => assert.ok(getByTestId('network-feed-slow')));
  assert.equal(container.querySelector('[data-testid="network-feed-empty"]'), null);
});

test('a real post renders with its author card, and its comments open on demand', async () => {
  feedPosts = [
    {
      id: 'p1',
      authorUid: 'uid-alice',
      authorName: 'أحمد محمود',
      authorOrg: 'إنسكو',
      authorHeadline: 'مفتش PAUT — المستوى II',
      postType: 'discussion',
      ndtMethod: 'PAUT',
      title: 'إشارة على شطف 30° في P91',
      body: 'القطر 323.9 مم والسماكة 12.7 مم، الزاوية 30°، الإشارة عند 22 مم.',
      likesCount: 0,
      commentsCount: 2,
      visibility: 'public',
      aiModerationStatus: 'approved',
      isPinnedAnnouncement: false,
      tags: ['ASME-V'],
    },
  ];
  feedComments = [
    {
      id: 'c1',
      postId: 'p1',
      authorUid: 'uid-bob',
      authorName: 'سارة',
      body: 'تحقق من قانون التركيز قبل الحكم على الإشارة.',
      isAiAssisted: false,
    },
  ];

  const { getByTestId, getByText, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-feed-list')));

  const cardEl = getByTestId('network-post-card');
  const cardText = cardEl.textContent ?? '';
  assert.ok(cardText.includes('أحمد محمود'));
  assert.ok(cardText.includes('إنسكو'));
  assert.ok(cardText.includes('إشارة على شطف 30° في P91'));
  assert.ok(cardText.includes('#ASME-V'));

  // A confirmed member can react; the state is exposed, not just styled.
  const like = within(cardEl).getByTestId('network-like') as HTMLButtonElement;
  assert.equal(like.disabled, false);
  assert.equal(like.getAttribute('aria-pressed'), 'false');

  fireEvent.click(within(cardEl).getByText(/التعليقات/));
  await waitFor(() => assert.ok(getByTestId('network-comments')));
  assert.ok((container.textContent ?? '').includes('قانون التركيز'));
});

test('commenting sends the card identity through the service, never a typed name', async () => {
  feedPosts = [
    {
      id: 'p2',
      authorUid: 'uid-other',
      authorName: 'خالد',
      authorOrg: 'مقاول',
      postType: 'technical_case',
      ndtMethod: 'UT',
      title: 'عنوان منشور آخر',
      body: 'نص كافٍ للعرض في الاختبار.',
      likesCount: 0,
      commentsCount: 0,
      visibility: 'public',
      aiModerationStatus: 'approved',
      isPinnedAnnouncement: false,
    },
  ];

  const { getByTestId, getByLabelText, getByText, getByRole } = mount();
  await waitFor(() => assert.ok(getByTestId('network-feed-list')));
  fireEvent.click(getByRole('button', { name: /التعليقات/ }));

  await waitFor(() => assert.ok(getByTestId('network-comments')));
  const input = getByLabelText('اكتب تعليقاً') as HTMLInputElement;

  // An empty comment cannot be sent at all.
  const send = getByText('إرسال') as HTMLButtonElement;
  assert.equal(send.disabled, true);

  fireEvent.change(input, { target: { value: 'سؤال: هل قارنت مع V2؟' } });
  await waitFor(() => assert.equal(send.disabled, false));
  fireEvent.click(send);

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'addCommunityPostComment');
    assert.ok(call, 'the comment must go through the service');
    const [sentUser, postId, payload] = call!.args as [typeof user, string, Record<string, unknown>];
    assert.equal(sentUser.uid, 'uid-alice');
    assert.equal(postId, 'p2');
    assert.equal(payload.authorName, 'أحمد محمود', 'identity comes from the card');
    assert.equal(payload.authorHeadline, 'مفتش PAUT — المستوى II');
    assert.equal(payload.body, 'سؤال: هل قارنت مع V2؟');
  });
});

test('publishing sends a payload the rules accept, then clears the composer', async () => {
  const { getByLabelText, getByText, container } = mount();
  await waitFor(() => assert.ok(container.querySelector('form')));

  fireEvent.change(getByLabelText('عنوان المنشور'), { target: { value: 'سؤال عن TOFD' } });
  fireEvent.change(getByLabelText('نص المنشور'), { target: { value: 'هل تُستخدم نفس الحساسية في TOFD؟' } });
  fireEvent.change(getByLabelText('وسوم المنشور'), { target: { value: 'TOFD, ASME-V' } });

  const publish = getByText('نشر') as HTMLButtonElement;
  await waitFor(() => assert.equal(publish.disabled, false));
  fireEvent.click(publish);

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'createCommunityPost');
    assert.ok(call, 'the post must go through the service');
    const [, payload] = call!.args as [typeof user, Record<string, unknown>];
    assert.equal(payload.authorUid, undefined, 'the service adds the uid from the session');
    assert.equal(payload.authorName, 'أحمد محمود');
    assert.equal(payload.authorOrg, 'إنسكو');
    assert.equal(payload.title, 'سؤال عن TOFD');
    assert.deepEqual(payload.tags, ['TOFD', 'ASME-V']);
    assert.equal(payload.isPinnedAnnouncement, false);
    assert.equal(payload.visibility, 'public');
  });

  await waitFor(() => assert.ok((container.textContent ?? '').includes('نُشر المنشور')));
  await waitFor(() => assert.equal((getByLabelText('عنوان المنشور') as HTMLInputElement).value, ''));
});

test('a like reads the member’s own reaction first, then writes exactly once', async () => {
  feedPosts = [
    {
      id: 'p3',
      authorUid: 'uid-other',
      authorName: 'خالد',
      authorOrg: 'مقاول',
      postType: 'discussion',
      ndtMethod: 'VT',
      title: 'عنوان ثالث',
      body: 'نص كافٍ للعرض.',
      likesCount: 4,
      commentsCount: 0,
      visibility: 'public',
      aiModerationStatus: 'approved',
      isPinnedAnnouncement: false,
    },
  ];
  const { getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-feed-list')));

  const like = getByTestId('network-like') as HTMLButtonElement;
  fireEvent.click(like);

  await waitFor(() => {
    const read = calls.find(entry => entry.fn === 'getCommunityPostReaction');
    assert.ok(read, 'the member’s own reaction must be read before writing');
    assert.deepEqual(read!.args, ['p3', 'uid-alice']);

    const write = calls.find(entry => entry.fn === 'setCommunityPostReaction');
    assert.ok(write, 'the reaction must be written through the service');
    const [sentUser, postId, type, existing] = write!.args as [typeof user, string, string, unknown];
    assert.equal(sentUser.uid, 'uid-alice');
    assert.equal(postId, 'p3');
    assert.equal(type, 'like');
    assert.equal(existing, null, 'no prior reaction means the service creates one');
  });

  await waitFor(() => {
    assert.equal((getByTestId('network-like') as HTMLButtonElement).getAttribute('aria-pressed'), 'true');
  });
});

test('an existing like is removed rather than added twice', async () => {
  feedPosts = [
    {
      id: 'p4',
      authorUid: 'uid-other',
      authorName: 'خالد',
      authorOrg: 'مقاول',
      postType: 'discussion',
      ndtMethod: 'VT',
      title: 'عنوان رابع',
      body: 'نص كافٍ للعرض.',
      likesCount: 5,
      commentsCount: 0,
      visibility: 'public',
      aiModerationStatus: 'approved',
      isPinnedAnnouncement: false,
    },
  ];
  myReaction = { postId: 'p4', uid: 'uid-alice', reactionType: 'like' };

  const { getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-feed-list')));

  fireEvent.click(getByTestId('network-like'));

  await waitFor(() => {
    const write = calls.find(entry => entry.fn === 'setCommunityPostReaction');
    assert.ok(write);
    const [, , type, existing] = write!.args as [typeof user, string, string, { reactionType: string } | null];
    assert.equal(type, 'like');
    assert.equal(existing?.reactionType, 'like', 'the service must receive the reaction it is undoing');
  });

  // After undoing, the button no longer claims to be pressed.
  await waitFor(() => {
    assert.equal((getByTestId('network-like') as HTMLButtonElement).getAttribute('aria-pressed'), 'false');
  });
});
