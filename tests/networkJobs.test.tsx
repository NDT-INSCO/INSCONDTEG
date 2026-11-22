/**
 * Phase E — the jobs board, on the shipped `community_opportunities`.
 *
 * The interesting risks here are not cosmetic:
 *   1. the rules require `authorOrg`, so publishing without a card must be
 *      impossible rather than a failed write at the last moment;
 *   2. `visibility` accepts only `public` in the rules, so the UI must not offer a
 *      private option it cannot honour;
 *   3. the method list is 1–8 entries of ≤32 characters, and a too-long code must
 *      be dropped rather than truncated into a different method;
 *   4. there is no applications collection, so the action must be a real
 *      connection — never a fake "Apply" button.
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
const myCard = {
  uid: 'uid-me',
  displayName: 'أحمد محمود',
  organizationName: 'إنسكو',
  sector: 'الفحص غير الإتلافي',
  companiesManaged: 0,
  isPublished: true,
  companyCode: 'INS-ABC',
};

type Call = { fn: string; args: unknown[] };
const calls: Call[] = [];
let verified = true;
let opportunities: Record<string, unknown>[] = [];
let neverAnswers = false;
let myConnections: unknown[] = [];

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
      onData(myCard);
      return () => {};
    },
    subscribeMyConnections: (_uid: string, onData: (list: unknown[]) => void) => {
      onData(myConnections);
      return () => {};
    },
    connectWithCommunityMember: async (...args: unknown[]) => {
      calls.push({ fn: 'connectWithCommunityMember', args });
    },
    subscribeCommunityOpportunities: (onData: (list: unknown[]) => void) => {
      if (neverAnswers) return () => {};
      onData(opportunities);
      return () => {};
    },
    createCommunityOpportunity: async (...args: unknown[]) => {
      calls.push({ fn: 'createCommunityOpportunity', args });
      return { id: 'new-opp' };
    },
    updateCommunityOpportunityStatus: async (...args: unknown[]) => {
      calls.push({ fn: 'updateCommunityOpportunityStatus', args });
    },
    upsertCommunityWorkspace: async () => {},
  },
});

const jobsForm = await import('../src/network/networkJobsForm');
const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkJobsSection } = await import('../src/components/network/NetworkJobsSection');
const { render, cleanup, fireEvent, waitFor, within } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  verified = true;
  opportunities = [];
  neverAnswers = false;
  myConnections = [];
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

const mount = (slowAfterMs = 8000) =>
  render(
    <SiteAccountProvider>
      <NetworkJobsSection
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        slowAfterMs={slowAfterMs}
      />
    </SiteAccountProvider>
  );

const sampleOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: 'opp-1',
  authorUid: 'uid-other',
  authorName: 'سارة علي',
  authorOrg: 'مقاول عام',
  opportunityType: 'job',
  title: 'مفتش PAUT — المستوى II',
  location: 'البرلس',
  methods: ['PAUT', 'TOFD'],
  requirements: 'شهادة PAUT II وخبرة موقعية سنتين.',
  status: 'open',
  visibility: 'public',
  ...overrides,
});

/* ------------------------------- the contract ------------------------------ */

test('a complete opportunity is accepted and an empty one is refused field by field', () => {
  const valid = {
    ...jobsForm.EMPTY_JOB_DRAFT,
    title: 'مفتش PAUT',
    location: 'البرلس',
    methods: 'PAUT, TOFD',
    requirements: 'شهادة PAUT II وخبرة موقعية.',
  };
  assert.deepEqual(jobsForm.validateJobDraft(valid), []);

  const errors = jobsForm.validateJobDraft(jobsForm.EMPTY_JOB_DRAFT);
  const fields = errors.map(error => error.field);
  assert.ok(fields.includes('title'));
  assert.ok(fields.includes('location'));
  assert.ok(fields.includes('methods'));
  assert.ok(fields.includes('requirements'));
  for (const error of errors) {
    assert.ok(error.ar.length > 4);
    assert.ok(error.en.length > 4);
  }
});

test('method codes are cleaned, capped at eight, and over-long ones are dropped not cut', () => {
  assert.deepEqual(jobsForm.normaliseMethods('PAUT, tofd ، RT'), ['PAUT', 'tofd', 'RT']);
  assert.deepEqual(jobsForm.normaliseMethods('PAUT, paut'), ['PAUT'], 'duplicates collapse case-insensitively');
  assert.equal(jobsForm.normaliseMethods('1,2,3,4,5,6,7,8,9').length, jobsForm.NETWORK_JOB_LIMITS.methodsMax);
  assert.deepEqual(
    jobsForm.normaliseMethods('UT, ' + 'X'.repeat(jobsForm.NETWORK_JOB_LIMITS.methodMax + 1)),
    ['UT']
  );
});

test('the limits are the rules limits', () => {
  const limits = jobsForm.NETWORK_JOB_LIMITS;
  const base = {
    ...jobsForm.EMPTY_JOB_DRAFT,
    title: 'عنوان',
    location: 'مكان',
    methods: 'UT',
    requirements: 'متطلبات كافية',
  };

  assert.ok(
    jobsForm.validateJobDraft({ ...base, title: 'ا'.repeat(limits.titleMax + 1) }).some(e => e.field === 'title')
  );
  assert.ok(
    jobsForm.validateJobDraft({ ...base, location: 'ا'.repeat(limits.locationMax + 1) }).some(e => e.field === 'location')
  );
  assert.ok(
    jobsForm
      .validateJobDraft({ ...base, requirements: 'ا'.repeat(limits.requirementsMax + 1) })
      .some(e => e.field === 'requirements')
  );
  assert.equal(jobsForm.validateJobDraft({ ...base, requirements: '   ' }).some(e => e.field === 'requirements'), true);
});

test('the write carries the card identity, only public visibility, and open status', () => {
  const input = jobsForm.toOpportunityInput(
    {
      ...jobsForm.EMPTY_JOB_DRAFT,
      title: 'مفتش RT',
      location: 'الجيزة',
      methods: 'RT, PAUT',
      requirements: 'شهادة RT II وترخيص إشعاعي.',
    },
    { displayName: 'أحمد', organizationName: 'إنسكو', companyCode: 'INS-ABC' }
  );

  assert.equal(input.authorName, 'أحمد');
  assert.equal(input.authorOrg, 'إنسكو');
  assert.equal(input.companyCode, 'INS-ABC');
  assert.deepEqual(input.methods, ['RT', 'PAUT']);
  assert.equal('visibility' in input, false, 'the service sets public; the network never sends a choice');
  assert.equal('status' in input, false, 'a new opportunity is open by construction');
});

test('filters narrow by type, method and free text without touching the database', () => {
  const job = {
    title: 'مفتش PAUT',
    location: 'البرلس',
    requirements: 'شهادة وخبرة',
    methods: ['PAUT', 'TOFD'],
    opportunityType: 'job',
  };
  const tender = {
    title: 'عقد فحص خطوط',
    location: 'السويس',
    requirements: 'فريق متكامل',
    methods: ['RT'],
    opportunityType: 'tender',
  };

  assert.equal(jobsForm.matchesJobFilter(job, { text: '', type: 'all', method: '' }), true);
  assert.equal(jobsForm.matchesJobFilter(tender, { text: '', type: 'job', method: '' }), false);
  assert.equal(jobsForm.matchesJobFilter(job, { text: '', type: 'all', method: 'tofd' }), true);
  assert.equal(jobsForm.matchesJobFilter(tender, { text: '', type: 'all', method: 'PAUT' }), false);
  assert.equal(jobsForm.matchesJobFilter(job, { text: 'البرلس', type: 'all', method: '' }), true);
  assert.equal(jobsForm.matchesJobFilter(job, { text: 'أسيوط', type: 'all', method: '' }), false);
});

/* -------------------------------- the screen ------------------------------- */

test('an empty board says it is empty, with no invented jobs', async () => {
  const { getByTestId, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-jobs-empty')));
  assert.equal(container.querySelectorAll('[data-testid="network-job-card"]').length, 0);
  assert.ok((container.textContent ?? '').includes('لا وظائف وهمية'));
});

test('a blocked connection is reported as blocked, not as an empty board', async () => {
  neverAnswers = true;
  const { getByTestId, container } = mount(25);
  await waitFor(() => assert.ok(getByTestId('network-jobs-slow')));
  assert.equal(container.querySelector('[data-testid="network-jobs-empty"]'), null);
});

test('a real opportunity renders with its methods, status and publisher', async () => {
  opportunities = [sampleOpportunity()];
  const { getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-jobs-list')));

  const card = getByTestId('network-job-card');
  const text = card.textContent ?? '';
  assert.ok(text.includes('مفتش PAUT — المستوى II'));
  assert.ok(text.includes('البرلس'));
  assert.ok(text.includes('PAUT'));
  assert.ok(text.includes('TOFD'));
  assert.ok(text.includes('مفتوحة'));
  assert.ok(text.includes('مقاول عام'));
});

test('contacting a publisher opens a real connection with my card name', async () => {
  opportunities = [sampleOpportunity()];
  const { getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-jobs-list')));

  const contact = getByTestId('network-job-contact') as HTMLButtonElement;
  assert.equal(contact.disabled, false);
  fireEvent.click(contact);

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'connectWithCommunityMember');
    assert.ok(call, 'contact must be a real connection');
    const [user, fromName, target] = call!.args as [typeof me, string, { uid: string; displayName: string }];
    assert.equal(user.uid, 'uid-me');
    assert.equal(fromName, 'أحمد محمود');
    assert.equal(target.uid, 'uid-other');
    assert.equal(target.displayName, 'سارة علي');
  });

  // There is no applications collection, so no "apply" claim is made anywhere.
  assert.equal(calls.some(entry => entry.fn.includes('Application')), false);
});

test('an unconfirmed email cannot contact anyone, and the button says why', async () => {
  verified = false;
  opportunities = [sampleOpportunity()];
  const { getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-jobs-list')));

  const contact = getByTestId('network-job-contact') as HTMLButtonElement;
  assert.equal(contact.disabled, true);
  assert.ok((contact.getAttribute('title') ?? '').includes('أكّد بريدك'));
});

test('publishing sends a payload the rules accept and names the card', async () => {
  const { getByLabelText, getByText, container } = mount();
  await waitFor(() => assert.ok(container.querySelector('form')));

  fireEvent.change(getByLabelText('عنوان الفرصة'), { target: { value: 'مفتش UT — المستوى II' } });
  fireEvent.change(getByLabelText('مكان الفرصة'), { target: { value: 'أسيوط' } });
  fireEvent.change(getByLabelText('طرق الفحص المطلوبة'), { target: { value: 'UT, PAUT' } });
  fireEvent.change(getByLabelText('متطلبات الفرصة'), { target: { value: 'شهادة UT II وخبرة سنتين.' } });

  const publish = getByText('نشر الفرصة') as HTMLButtonElement;
  await waitFor(() => assert.equal(publish.disabled, false));
  fireEvent.click(publish);

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'createCommunityOpportunity');
    assert.ok(call, 'publishing must go through the service');
    const [, payload] = call!.args as [typeof me, Record<string, unknown>];
    assert.equal(payload.authorName, 'أحمد محمود');
    assert.equal(payload.authorOrg, 'إنسكو');
    assert.equal(payload.title, 'مفتش UT — المستوى II');
    assert.equal(payload.location, 'أسيوط');
    assert.deepEqual(payload.methods, ['UT', 'PAUT']);
    assert.equal(payload.opportunityType, 'job');
  });

  await waitFor(() => assert.ok((container.textContent ?? '').includes('نُشرت الفرصة')));
});

test('my own opportunity shows a real close/reopen action instead of a contact button', async () => {
  opportunities = [sampleOpportunity({ authorUid: 'uid-me', authorName: 'أحمد محمود', title: 'فرصتي' })];
  const { getByTestId, getByText } = mount();
  await waitFor(() => assert.ok(getByTestId('network-jobs-list')));

  assert.equal(within(getByTestId('network-job-card')).queryByTestId('network-job-contact'), null);

  fireEvent.click(getByText('إغلاق الفرصة'));
  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'updateCommunityOpportunityStatus');
    assert.ok(call);
    assert.deepEqual(call!.args, ['opp-1', 'closed']);
  });
});

test('a publisher already in my network is a state, not a second request', async () => {
  opportunities = [sampleOpportunity()];
  myConnections = [{ id: 'uid-me_uid-other', fromUid: 'uid-me', toUid: 'uid-other', status: 'connected' }];

  const { getByTestId, container } = mount();
  await waitFor(() => assert.ok(getByTestId('network-jobs-list')));

  assert.ok(getByTestId('network-job-connected'));
  assert.equal(container.querySelector('[data-testid="network-job-contact"]'), null);
});
