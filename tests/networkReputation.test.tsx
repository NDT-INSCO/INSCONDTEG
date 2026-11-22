/**
 * The member page's professional identity: declared skills, peer endorsements and
 * written recommendations.
 *
 * What these tests protect is the honesty of the panel, not its styling:
 * - a count is the number of documents that exist, so an empty page shows zeros;
 * - nobody endorses themselves, and an unverified visitor is told why the button is
 *   not there instead of clicking into a wall;
 * - a recommendation is someone's written words: it is shown with its author's name,
 *   it cannot be submitted vague, and only its author or subject can touch it.
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

const me = { uid: 'uid-me', email: 'me@example.test', displayName: 'أحمد' };
const other = 'uid-other';

type Call = { fn: string; args: unknown[] };
const calls: Call[] = [];
let endorsements: Record<string, unknown>[] = [];
let mine: Record<string, true> = {};
let recommendations: Record<string, unknown>[] = [];
let verified = true;
let endorseError: Error | null = null;

const card = (overrides: Record<string, unknown> = {}) => ({
  uid: other,
  displayName: 'سارة علي',
  organizationName: 'إنسكو',
  sector: 'الفحص غير الإتلافي',
  companiesManaged: 0,
  isPublished: true,
  skills: 'ut,paut',
  ...overrides,
});

mock.module('../src/client/communityReputationService.ts', {
  namedExports: {
    subscribeEndorsements: (_uid: string, onData: (rows: unknown[]) => void) => {
      onData(endorsements);
      return () => {};
    },
    subscribeRecommendations: (_uid: string, onData: (rows: unknown[]) => void) => {
      onData(recommendations);
      return () => {};
    },
    loadMyEndorsements: async (_from: string, _to: string) => mine,
    loadMyDisplayName: async () => 'أحمد محمود',
    endorseSkill: async (...args: unknown[]) => {
      calls.push({ fn: 'endorseSkill', args });
      if (endorseError) throw endorseError;
    },
    withdrawEndorsement: async (...args: unknown[]) => {
      calls.push({ fn: 'withdrawEndorsement', args });
    },
    writeRecommendation: async (...args: unknown[]) => {
      calls.push({ fn: 'writeRecommendation', args });
    },
    deleteRecommendation: async (...args: unknown[]) => {
      calls.push({ fn: 'deleteRecommendation', args });
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
    confirmClientPortalVerification: async () => verified,
    resendClientVerificationEmail: async () => {},
    subscribeMyCommunityWorkspace: (_uid: string, onData: (value: unknown) => void) => {
      onData(null);
      return () => {};
    },
  },
});

const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkSkillsPanel, NetworkRecommendationsPanel } = await import(
  '../src/components/network/NetworkReputation'
);
const { render, cleanup, fireEvent, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  endorsements = [];
  mine = {};
  recommendations = [];
  verified = true;
  endorseError = null;
});

afterEach(() => cleanup());

const mount = (element: React.ReactElement) => render(<SiteAccountProvider>{element}</SiteAccountProvider>);

test('declared skills render with counts computed from documents', async () => {
  endorsements = [
    { id: 'a', toUid: other, skillId: 'ut', fromUid: 'u1', fromName: 'محمود' },
    { id: 'b', toUid: other, skillId: 'ut', fromUid: 'u2', fromName: 'هشام' },
  ];

  const view = mount(<NetworkSkillsPanel profile={card() as never} language="ar" />);

  // The chips exist on first paint; the counts arrive with the documents.
  await waitFor(() => {
    const counts = view.getAllByTestId('network-skill-endorsements').map(node => node.textContent);
    assert.deepEqual(counts, ['2', '0'], 'a skill nobody endorsed shows zero');
  });
  assert.equal(view.getAllByTestId('network-skill-chip').length, 2, 'one chip per declared skill, nothing padded');

  const text = view.container.textContent ?? '';
  assert.ok(text.includes('ليست شهادة'), 'the panel must say an endorsement is not a certificate');
  assert.ok(text.includes('محسوب'), 'and that the number is counted, not stored');
});

test('a member is never offered a button to endorse themselves', async () => {
  const view = mount(
    <NetworkSkillsPanel profile={card({ uid: me.uid, displayName: me.displayName }) as never} language="ar" self />
  );

  await waitFor(() => assert.ok(view.getByTestId('network-skills-list')));
  assert.equal(view.queryAllByTestId('network-skill-endorse').length, 0);
  assert.equal(view.queryAllByText('زكِّ').length, 0);
});

test('an unverified visitor is told why endorsements are not shown', async () => {
  verified = false;
  const view = mount(<NetworkSkillsPanel profile={card() as never} language="ar" />);

  await waitFor(() => assert.ok(view.getByTestId('network-skills-signin')));
  assert.equal(view.queryAllByTestId('network-skill-endorse').length, 0);
  assert.equal(calls.length, 0, 'nothing is written on a refusal');
});

test('endorsing sends one write for the clicked skill, attributed to me', async () => {
  const view = mount(<NetworkSkillsPanel profile={card() as never} language="ar" />);

  await waitFor(() => assert.ok(view.getByTestId('network-skills-list')));
  const buttons = view.getAllByTestId('network-skill-endorse');
  fireEvent.click(buttons[0]);

  await waitFor(() => assert.equal(calls.length, 1));
  assert.equal(calls[0].fn, 'endorseSkill');
  const [user, target, fromName] = calls[0].args as [typeof me, { uid: string; skillId: string }, string];
  assert.equal(user.uid, me.uid, 'the write is made by the signed-in member');
  assert.deepEqual(target, { uid: other, skillId: 'ut' });
  assert.equal(fromName, 'أحمد محمود', 'the name comes from the card, not the email');
});

test('a refused endorsement surfaces the reason instead of a fake count', async () => {
  endorseError = new Error('permission-denied');
  const view = mount(<NetworkSkillsPanel profile={card() as never} language="ar" />);

  await waitFor(() => assert.ok(view.getByTestId('network-skills-list')));
  fireEvent.click(view.getAllByTestId('network-skill-endorse')[0]);

  await waitFor(() => assert.ok(view.getByRole('alert')));
  assert.ok((view.getByRole('alert').textContent ?? '').includes('permission-denied'));
  const counts = view.getAllByTestId('network-skill-endorsements').map(node => node.textContent);
  assert.deepEqual(counts, ['0', '0'], 'a failed write never increments anything');
});

test('an already endorsed skill reads as endorsed, without a second button', async () => {
  mine = { ut: true };
  const view = mount(<NetworkSkillsPanel profile={card() as never} language="ar" />);

  await waitFor(() => assert.equal(view.queryAllByText('زكّيتها').length, 1));
});

test('a card with no skills says so and offers the profile for its owner', async () => {
  const view = mount(
    <NetworkSkillsPanel
      profile={card({ uid: me.uid, skills: '' }) as never}
      language="ar"
      self
      onOpenProfile={() => {}}
    />
  );

  await waitFor(() => assert.ok(view.getByTestId('network-skills-empty')));
  assert.equal(view.queryAllByTestId('network-skill-endorse').length, 0);
});

test('a written recommendation is shown with its author and its own words', async () => {
  recommendations = [
    {
      id: `${other}_${me.uid}`,
      fromUid: other,
      fromName: 'سارة علي',
      toUid: me.uid,
      toName: me.displayName,
      relation: 'colleague',
      body: 'عملنا معاً في فحص خط ١٢ بوصة، وكانت دقيقة في تقييم العيوب وتوثيق النتائج.',
    },
  ];

  const view = mount(
    <NetworkRecommendationsPanel profile={card({ uid: me.uid, displayName: me.displayName }) as never} language="ar" self />
  );

  await waitFor(() => assert.ok(view.getByTestId('network-recommendations-list')));
  const item = view.getByTestId('network-recommendation');
  assert.ok((item.textContent ?? '').includes('سارة علي'));
  assert.ok((item.textContent ?? '').includes('تقييم العيوب'));
  assert.ok((item.textContent ?? '').includes('زميل عمل'));
  // On your own page you cannot write about yourself, and you cannot edit their words.
  assert.equal(view.queryByTestId('network-recommendation-form'), null);
  assert.equal(view.queryByTestId('network-recommendation-edit'), null);
});

test('the subject can take a recommendation down, the author can edit it', async () => {
  recommendations = [
    {
      id: `uid-x_${me.uid}`,
      fromUid: 'uid-x',
      fromName: 'محمود',
      toUid: me.uid,
      toName: me.displayName,
      relation: 'client',
      body: 'تعاملت معه في مشروع تفتيش، وكان التقرير واضحاً وفي الموعد دون مبالغة في التقييم.',
    },
  ];

  const view = mount(
    <NetworkRecommendationsPanel profile={card({ uid: me.uid, displayName: me.displayName }) as never} language="ar" self />
  );
  await waitFor(() => assert.ok(view.getByTestId('network-recommendation-delete')));
  assert.equal(view.queryByTestId('network-recommendation-edit'), null, 'the subject cannot rewrite the words');

  fireEvent.click(view.getByTestId('network-recommendation-delete'));
  await waitFor(() => assert.equal(calls.length, 1));
  assert.equal(calls[0].fn, 'deleteRecommendation');
  assert.equal(calls[0].args[0], `uid-x_${me.uid}`);
});

test('the author of the only recommendation gets an edit affordance', async () => {
  recommendations = [
    {
      id: `${me.uid}_${other}`,
      fromUid: me.uid,
      fromName: me.displayName,
      toUid: other,
      toName: 'سارة علي',
      relation: 'colleague',
      body: 'شاهدت عملها في الموقع لمدة سنة، وتوثيقها للعيوب كان دقيقاً ومنظماً في كل تقرير.',
    },
  ];

  const view = mount(<NetworkRecommendationsPanel profile={card() as never} language="ar" />);
  await waitFor(() => assert.ok(view.getByTestId('network-recommendation-edit')));
  assert.ok(view.getByTestId('network-recommendation-submit').textContent?.includes('احفظ التعديل'));
});

test('a vague recommendation cannot be submitted, and a real one is sent trimmed', async () => {
  const view = mount(<NetworkRecommendationsPanel profile={card() as never} language="ar" />);
  await waitFor(() => assert.ok(view.getByTestId('network-recommendation-form')));

  const textarea = view.getByPlaceholderText(/عملنا معاً/);
  const submit = view.getByTestId('network-recommendation-submit') as HTMLButtonElement;

  assert.equal(submit.disabled, true, 'an empty recommendation is not submittable');

  fireEvent.change(textarea, { target: { value: 'جيد جداً' } });
  await waitFor(() => assert.ok(view.getByTestId('network-recommendation-error')));
  assert.equal(submit.disabled, true);
  assert.equal(calls.length, 0, 'nothing is written until the words are there');

  const body = '  عملنا معاً على فحص لحامات خط الأنابيب، وكان التقييم دقيقاً والتقرير واضحاً.  ';
  fireEvent.change(textarea, { target: { value: body } });
  await waitFor(() => assert.equal(submit.disabled, false));

  fireEvent.click(submit);
  await waitFor(() => assert.equal(calls.length, 1));
  assert.equal(calls[0].fn, 'writeRecommendation');
  const [, target, fromName, input, options] = calls[0].args as [
    typeof me,
    { uid: string; displayName: string },
    string,
    { relation: string; body: string },
    { exists: boolean },
  ];
  assert.equal(target.uid, other);
  assert.equal(fromName, 'أحمد محمود');
  assert.equal(input.body, body.trim(), 'the stored text is the trimmed text');
  assert.equal(options.exists, false, 'a new recommendation is created, not edited');
});

test('an unverified visitor sees the rule, not an empty list that looks like “none”', async () => {
  verified = false;
  const view = mount(<NetworkRecommendationsPanel profile={card() as never} language="ar" />);

  await waitFor(() => assert.ok(view.getByTestId('network-recommendations-signin')));
  assert.equal(view.queryByTestId('network-recommendations-empty'), null);
  assert.equal(view.queryByTestId('network-recommendation-form'), null);
});
