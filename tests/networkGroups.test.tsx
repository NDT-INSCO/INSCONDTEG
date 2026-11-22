/**
 * Groups — the owner decides, the rules enforce.
 *
 * The two choices that matter here are the owner's: how people join (open / request /
 * invite) and who may post (all members / the owner). The interface must say what the
 * rules will do *before* the click, and must never leave a member looking at an empty
 * feed when the real answer is "you are not in yet".
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

const me = { uid: 'uid-me', email: 'me@example.test' };
const other = 'uid-other';
const myCard = {
  uid: 'uid-me',
  displayName: 'أحمد محمود',
  organizationName: 'إنسكو',
  sector: 'الفحص غير الإتلافي',
  companiesManaged: 0,
  isPublished: true,
};

type Call = { fn: string; args: unknown[] };
const calls: Call[] = [];
let groups: Record<string, unknown>[] = [];
let memberships: Record<string, unknown>[] = [];
let membersByGroup: Record<string, Record<string, unknown>[]> = {};
let postsByGroup: Record<string, Record<string, unknown>[]> = {};
let groupDoc: Record<string, unknown> | null = null;
let directory: Record<string, unknown>[] = [];
let uploadNeverAnswers = false;
let joinError: { code: string; message: string } | null = null;

const group = (overrides: Record<string, unknown> = {}) => ({
  id: 'g1',
  name: 'مفتشو PAUT',
  description: 'جروب للمفتشين المعتمدين لمشاركة خبرات الموقع.',
  ownerUid: other,
  ownerName: 'سارة علي',
  joinPolicy: 'open',
  postPolicy: 'members',
  ...overrides,
});

mock.module('../src/client/communityGroupsService.ts', {
  namedExports: {
    subscribeCommunityGroups: (onData: (list: unknown[]) => void) => {
      if (uploadNeverAnswers) return () => {};
      onData(groups);
      return () => {};
    },
    subscribeMyGroupMemberships: (_uid: string, onData: (list: unknown[]) => void) => {
      onData(memberships);
      return () => {};
    },
    subscribeCommunityGroup: (_groupId: string, onData: (value: unknown) => void) => {
      onData(groupDoc);
      return () => {};
    },
    subscribeGroupMembers: (groupId: string, onData: (list: unknown[]) => void) => {
      onData(membersByGroup[groupId] ?? []);
      return () => {};
    },
    subscribeGroupPosts: (groupId: string, onData: (list: unknown[]) => void) => {
      onData(postsByGroup[groupId] ?? []);
      return () => {};
    },
    createCommunityGroup: async (...args: unknown[]) => {
      calls.push({ fn: 'createCommunityGroup', args });
      return 'new-group';
    },
    joinCommunityGroup: async (...args: unknown[]) => {
      calls.push({ fn: 'joinCommunityGroup', args });
      if (joinError) throw Object.assign(new Error(joinError.message), { code: joinError.code });
      const target = args[0] as { joinPolicy: string };
      return target.joinPolicy === 'open' ? 'approved' : 'pending';
    },
    answerGroupRequest: async (...args: unknown[]) => {
      calls.push({ fn: 'answerGroupRequest', args });
    },
    inviteToCommunityGroup: async (...args: unknown[]) => {
      calls.push({ fn: 'inviteToCommunityGroup', args });
    },
    leaveCommunityGroup: async (...args: unknown[]) => {
      calls.push({ fn: 'leaveCommunityGroup', args });
    },
    createGroupPost: async (...args: unknown[]) => {
      calls.push({ fn: 'createGroupPost', args });
    },
    deleteGroupPost: async (...args: unknown[]) => {
      calls.push({ fn: 'deleteGroupPost', args });
    },
    updateCommunityGroupSettings: async (...args: unknown[]) => {
      calls.push({ fn: 'updateCommunityGroupSettings', args });
    },
  },
});

mock.module('../src/client/firestoreClientService.ts', {
  namedExports: {
    observeClientPortalAuth: (callback: (u: typeof me | null) => void) => {
      callback(me);
      return () => {};
    },
    isPortalFirestoreReady: () => true,
    clearPendingRegistrationDraft: () => {},
    loadPendingRegistrationDraft: () => null,
    confirmClientPortalVerification: async () => true,
    resendClientVerificationEmail: async () => {},
    subscribeMyCommunityWorkspace: (_uid: string, onData: (value: unknown) => void) => {
      onData(myCard);
      return () => {};
    },
    subscribeCommunityWorkspaces: (_isAdmin: boolean, onData: (list: unknown[]) => void) => {
      onData(directory);
      return () => {};
    },
  },
});

const form = await import('../src/network/networkGroupsForm');
const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkGroupsSection } = await import('../src/components/network/NetworkGroupsSection');
const { NetworkGroupPage } = await import('../src/components/network/NetworkGroupPage');
const { render, cleanup, fireEvent, waitFor, within } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  groups = [];
  memberships = [];
  membersByGroup = {};
  postsByGroup = {};
  groupDoc = null;
  directory = [];
  uploadNeverAnswers = false;
  joinError = null;
});

afterEach(() => cleanup());

const mountList = () =>
  render(
    <SiteAccountProvider>
      <NetworkGroupsSection
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        onOpenGroup={() => {}}
        slowAfterMs={8000}
      />
    </SiteAccountProvider>
  );

const mountPage = (groupId = 'g1') =>
  render(
    <SiteAccountProvider>
      <NetworkGroupPage
        groupId={groupId}
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        onBack={() => {}}
        slowAfterMs={8000}
      />
    </SiteAccountProvider>
  );

/* ------------------------------ the contract ------------------------------ */

test('the access decision is one answer, used by the page and the rules', () => {
  const open = { id: 'g1', ownerUid: 'owner', joinPolicy: 'open' as const, postPolicy: 'members' as const };
  const ownerOnly = { ...open, postPolicy: 'owners' as const };

  const guestAccess = form.groupAccess(open, null, null);
  assert.equal(guestAccess.canReadPosts, false);
  assert.equal(guestAccess.canPost, false);
  assert.ok(guestAccess.postBlockedAr?.includes('سجّل الدخول'));

  const outsider = form.groupAccess(open, 'me', null);
  assert.equal(outsider.state, 'none');
  assert.equal(outsider.canReadPosts, false, 'a non-member cannot read the feed');
  assert.equal(outsider.joinIntent, 'join');

  const pending = form.groupAccess(open, 'me', { status: 'pending', role: 'member' });
  assert.equal(pending.state, 'pending');
  assert.equal(pending.canReadPosts, false);
  assert.ok(pending.postBlockedAr?.includes('قيد المراجعة'));

  const member = form.groupAccess(open, 'me', { status: 'approved', role: 'member' });
  assert.equal(member.canReadPosts, true);
  assert.equal(member.canPost, true);

  const memberOfNoticeBoard = form.groupAccess(ownerOnly, 'me', { status: 'approved', role: 'member' });
  assert.equal(memberOfNoticeBoard.canReadPosts, true);
  assert.equal(memberOfNoticeBoard.canPost, false, 'the owner chose "owner only"');
  assert.ok(memberOfNoticeBoard.postBlockedAr?.includes('المالك'));

  const owner = form.groupAccess(ownerOnly, 'owner', null);
  assert.equal(owner.isOwner, true);
  assert.equal(owner.canReadPosts, true, 'the owner reads their own group before any row exists');
  assert.equal(owner.canPost, true);

  assert.equal(form.groupAccess({ ...open, joinPolicy: 'request' }, 'me', null).joinIntent, 'request');
  assert.equal(form.groupAccess({ ...open, joinPolicy: 'invite' }, 'me', null).joinIntent, 'invite-only');
});

test('group and post drafts refuse what the rules would refuse', () => {
  assert.ok(form.validateGroupDraft(form.EMPTY_GROUP_DRAFT).some(error => error.field === 'name'));
  assert.ok(form.validateGroupDraft(form.EMPTY_GROUP_DRAFT).some(error => error.field === 'description'));

  const valid = { name: 'مفتشو PAUT', description: 'جروب للمشاركة.', joinPolicy: 'request' as const, postPolicy: 'members' as const };
  assert.deepEqual(form.validateGroupDraft(valid), []);
  assert.deepEqual(form.toGroupInput({ ...valid, name: '  مفتشو PAUT  ' }).name, 'مفتشو PAUT');

  assert.ok(form.validateGroupPostDraft({ title: '', body: 'قصير' }).length >= 0);
  assert.ok(form.validateGroupPostDraft({ title: '', body: '' }).some(error => error.field === 'body'));
  assert.ok(form.validateGroupPostDraft({ title: 'ab', body: 'نص كافٍ' }).some(error => error.field === 'title'));
  assert.deepEqual(form.validateGroupPostDraft({ title: '', body: 'نص كافٍ للفحص' }), []);
  assert.deepEqual(form.toGroupPostInput({ title: '   ', body: ' نص ' }), { body: 'نص' });
});

test('a refusal names its real cause instead of echoing a Firestore code', () => {
  const denied = form.describeGroupFailure({ code: 'permission-denied' }, true);
  assert.ok(denied.includes('firestore.rules'), 'the rules file is named');
  assert.ok(denied.includes('لم يُنشر'), 'it says the rules are not published');
  assert.ok(!denied.includes('permission-denied'), 'no raw code is shown to the member');

  assert.ok(form.describeGroupFailure({ code: 'unauthenticated' }, true).includes('سجّل الدخول'));
  assert.ok(form.describeGroupFailure({ code: 'unavailable' }, true).includes('شبكة'));
  assert.ok(form.describeGroupFailure({ message: 'network-request-failed' }, false).includes('unreachable'));
  assert.ok(form.describeGroupFailure(new Error('boom'), false).includes('boom'));
});

/* -------------------------------- the list -------------------------------- */

test('an empty list says it is empty, with no invented groups', async () => {
  const { getByTestId, container } = mountList();
  await waitFor(() => assert.ok(getByTestId('network-groups-empty')));
  assert.equal(container.querySelectorAll('[data-testid="network-group-card"]').length, 0);
  assert.ok((container.textContent ?? '').includes('لا جروبات وهمية'));
});

test('an open group joins immediately, carrying my card name', async () => {
  groups = [group({ joinPolicy: 'open' })];
  const { getByTestId } = mountList();
  await waitFor(() => assert.ok(getByTestId('network-group-card')));

  const join = getByTestId('network-group-join') as HTMLButtonElement;
  assert.equal(join.disabled, false);
  assert.ok((join.textContent ?? '').includes('انضمام'));
  fireEvent.click(join);

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'joinCommunityGroup');
    assert.ok(call, 'joining goes through the service');
    const [target, user, displayName] = call!.args as [{ joinPolicy: string }, typeof me, string];
    assert.equal(target.joinPolicy, 'open');
    assert.equal(user.uid, 'uid-me');
    assert.equal(displayName, 'أحمد محمود', 'the request carries the member own card name');
  });
});

test('when the deployed rules refuse the write, the page says the rules are unpublished', async () => {
  groups = [group({ joinPolicy: 'open' })];
  joinError = { code: 'permission-denied', message: 'Firestore create failed (permission-denied)' };

  const { getByTestId, findByRole } = mountList();
  await waitFor(() => assert.ok(getByTestId('network-group-join')));
  fireEvent.click(getByTestId('network-group-join'));

  const alert = await findByRole('alert');
  assert.ok((alert.textContent ?? '').includes('firestore.rules'));
  assert.ok(!(alert.textContent ?? '').includes('permission-denied'));
});

test('a request-only group takes a request and then says it is pending', async () => {
  groups = [group({ joinPolicy: 'request' })];
  const first = mountList();
  await waitFor(() => assert.ok(first.getByTestId('network-group-card')));
  assert.ok((first.getByTestId('network-group-join').textContent ?? '').includes('طلب انضمام'));
  cleanup();

  memberships = [{ id: 'g1_uid-me', groupId: 'g1', uid: 'uid-me', status: 'pending', role: 'member' }];
  const second = mountList();
  await waitFor(() => assert.ok(second.getByTestId('network-group-pending')));
  assert.equal(second.container.querySelector('[data-testid="network-group-join"]'), null, 'no second request button');
});

test('an invitation-only group offers no join button at all, and says why', async () => {
  groups = [group({ joinPolicy: 'invite' })];
  const { getByTestId, container } = mountList();
  await waitFor(() => assert.ok(getByTestId('network-group-invite-only')));
  assert.equal(container.querySelector('[data-testid="network-group-join"]'), null);
  assert.ok((getByTestId('network-group-invite-only').textContent ?? '').includes('بدعوة فقط'));
  assert.ok((getByTestId('network-group-invite-only').getAttribute('title') ?? '').includes('يضيفك'));
});

test('creating a group sends the two policies the owner picked', async () => {
  const { getByLabelText, getByText, container } = mountList();
  await waitFor(() => assert.ok(container.querySelector('form')));

  fireEvent.change(getByLabelText('اسم الجروب'), { target: { value: 'مفتشو TOFD' } });
  fireEvent.change(getByLabelText('وصف الجروب'), { target: { value: 'جروب لمفتشي TOFD لمشاركة التقارير.' } });
  fireEvent.change(getByLabelText('سياسة الانضمام'), { target: { value: 'invite' } });
  fireEvent.change(getByLabelText('سياسة النشر'), { target: { value: 'owners' } });

  const create = getByText('إنشاء الجروب') as HTMLButtonElement;
  await waitFor(() => assert.equal(create.disabled, false));
  fireEvent.click(create);

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'createCommunityGroup');
    assert.ok(call);
    const [, ownerName, input] = call!.args as [typeof me, string, Record<string, unknown>];
    assert.equal(ownerName, 'أحمد محمود');
    assert.equal(input.joinPolicy, 'invite');
    assert.equal(input.postPolicy, 'owners');
    assert.equal(input.name, 'مفتشو TOFD');
  });
});

/* ------------------------------- the group page ---------------------------- */

test('a non-member is shown the way in, not an empty feed', async () => {
  groupDoc = group({ joinPolicy: 'request' });
  membersByGroup = { g1: [] };

  const { getByTestId, container } = mountPage();
  await waitFor(() => assert.ok(getByTestId('network-group-gate')));

  assert.equal(container.querySelector('[data-testid="network-group-posts-empty"]'), null, 'the feed is not rendered at all');
  assert.ok((container.textContent ?? '').includes('لا تُقرأ قبل الموافقة'));
  assert.ok(getByTestId('network-group-join-page'));
});

test('an approved member posts when the owner allowed members to post', async () => {
  groupDoc = group({ postPolicy: 'members' });
  membersByGroup = { g1: [{ id: 'g1_uid-me', groupId: 'g1', uid: 'uid-me', displayName: 'أحمد', role: 'member', status: 'approved' }] };
  postsByGroup = {
    g1: [{ id: 'p1', authorUid: other, authorName: 'سارة علي', body: 'قياس على عينة ملحومة قبل الفحص الكامل.' }],
  };

  const { getByTestId } = mountPage();
  await waitFor(() => assert.ok(getByTestId('network-group-posts')));
  assert.equal(getByTestId('network-group-post-submit') !== null, true);

  fireEvent.change(getByTestId('network-group-post-submit').closest('form')!.querySelector('textarea')!, {
    target: { value: 'تجربة على خط أنابيب 12 بوصة.' },
  });
  fireEvent.click(getByTestId('network-group-post-submit'));

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'createGroupPost');
    assert.ok(call);
    const [, groupId, author, input] = call!.args as [typeof me, string, { displayName: string }, { body: string }];
    assert.equal(groupId, 'g1');
    assert.equal(author.displayName, 'أحمد محمود');
    assert.equal(input.body, 'تجربة على خط أنابيب 12 بوصة.');
  });
});

test('when the owner keeps posting to themselves, the member is told, not left with a dead box', async () => {
  groupDoc = group({ postPolicy: 'owners', ownerUid: other });
  membersByGroup = { g1: [{ id: 'g1_uid-me', groupId: 'g1', uid: 'uid-me', displayName: 'أحمد', role: 'member', status: 'approved' }] };

  const { getByTestId } = mountPage();
  await waitFor(() => assert.ok(getByTestId('network-group-post-blocked')));
  assert.equal(within(getByTestId('network-group-live')).queryByTestId('network-group-post-submit'), null);
  assert.ok((getByTestId('network-group-post-blocked').textContent ?? '').includes('المالك'));
});

test('the owner still posts under an owner-only policy, and answers pending requests', async () => {
  groupDoc = group({ postPolicy: 'owners', ownerUid: 'uid-me', ownerName: 'أحمد محمود' });
  membersByGroup = {
    g1: [
      { id: 'g1_uid-me', groupId: 'g1', uid: 'uid-me', displayName: 'أحمد', role: 'owner', status: 'approved' },
      { id: 'g1_uid-x', groupId: 'g1', uid: 'uid-x', displayName: 'محمود صابر', role: 'member', status: 'pending' },
    ],
  };

  const { getByTestId } = mountPage();
  await waitFor(() => assert.ok(getByTestId('network-group-requests')));
  assert.ok(getByTestId('network-group-post-submit'), 'the owner may post');

  fireEvent.click(getByTestId('network-group-approve'));
  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'answerGroupRequest');
    assert.ok(call);
    assert.deepEqual(call!.args, ['g1', 'uid-x', 'approved']);
  });
});

test('an invitation-only group gives its owner a picker from the real directory', async () => {
  groupDoc = group({ joinPolicy: 'invite', ownerUid: 'uid-me', ownerName: 'أحمد محمود' });
  membersByGroup = {
    g1: [{ id: 'g1_uid-me', groupId: 'g1', uid: 'uid-me', displayName: 'أحمد', role: 'owner', status: 'approved' }],
  };
  directory = [
    { uid: 'uid-y', displayName: 'هدى فؤاد', organizationName: 'مقاول عام', sector: 'فحص اللحام', companiesManaged: 0, isPublished: true },
  ];

  const { getByTestId } = mountPage();
  await waitFor(() => assert.ok(getByTestId('network-group-invite')));
  await waitFor(() =>
    assert.ok((getByTestId('network-group-invite').textContent ?? '').includes('هدى فؤاد'), 'the picker lists real members')
  );
});

test('a group that does not exist says so instead of showing an empty shell', async () => {
  groupDoc = null;
  const { getByTestId } = mountPage('missing');
  await waitFor(() => assert.ok(getByTestId('network-group-missing')));
});

test('a blocked connection is reported as blocked, not as an empty list', async () => {
  uploadNeverAnswers = true;
  const { getByTestId, container } = mountList();
  await waitFor(() => assert.ok(getByTestId('network-groups-loading')));
  assert.equal(container.querySelector('[data-testid="network-groups-empty"]'), null);
});
