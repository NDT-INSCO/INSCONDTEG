/**
 * The local brain — the requirement, stated as a test.
 *
 * "Zero dependence on other AI programs" is not a claim this repository can make by
 * removing an import: it has to be measurable. So the first test here replaces `fetch`
 * with a recorder that fails *outside* the test's own loopback, and then drives the real
 * Vercel handler through every AI surface. If any code path ever reintroduces a call to
 * Google, Manus or anyone else, that test fails by name.
 *
 * The rest of the file checks the answer quality the engine promises: a citation on every
 * claim, a refusal when the library has nothing, no heading presented as a fact, and the
 * same question producing the same answer twice.
 */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { getCorpus } from '../src/ai/corpus';
import { composeTutorAnswer } from '../src/ai/brain/compose';
import { detectIntent } from '../src/ai/brain/intent';
import { draftCopilotAnswer } from '../src/ai/brain/agents';
import { searchLibrary } from '../src/ai/search';

// No provider keys at all, and no provider chosen: the default has to be the local brain.
delete process.env.GEMINI_API_KEY;
delete process.env.API_KEY;
delete process.env.MANUS_API_KEY;
delete process.env.AI_PROVIDER;

const corpus = getCorpus();
const corpusIds = new Set(corpus.map(document => document.id));

/* ------------------------------------------------------------------ */
/* the network sentinel                                                */
/* ------------------------------------------------------------------ */

interface Attempt {
  url: string;
}

const outbound: Attempt[] = [];
const realFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : String((input as Request).url);
  const local = url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost');
  if (!local) {
    outbound.push({ url });
    throw new Error(`Outbound request during a local answer: ${url}`);
  }
  return realFetch(input as RequestInfo, init);
}) as typeof fetch;

const handler = (await import('../api/ai.ts')).default;
let server: Server;
let base = '';

before(async () => {
  server = createServer(handler as never);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  globalThis.fetch = realFetch;
  await new Promise<void>(resolve => server.close(() => resolve()));
});

async function post(path: string, body: unknown) {
  const response = await realFetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response;
}

/* ------------------------------------------------------------------ */
/* 1. zero dependence                                                  */
/* ------------------------------------------------------------------ */

test('every AI surface answers with the outside world cut off', async () => {
  outbound.length = 0;

  const tutor = await post('/api/ai/tutor', {
    messages: [{ role: 'user', content: 'اشرح مبدأ TOFD' }],
    language: 'ar',
  });
  assert.equal(tutor.status, 200);
  const tutorText = await tutor.text();
  assert.match(tutorText, /"type":"delta"/);

  const copilot = await post('/api/ai/agent/user-copilot', {
    message: 'ما الفرق بين PAUT و TOFD؟',
    language: 'ar',
    mode: 'assistant',
  });
  assert.equal(copilot.status, 200);

  const community = await post('/api/ai/community/assist', {
    action: 'enhance_post',
    language: 'ar',
    ndtMethod: 'PAUT',
    title: 'ملاحظة ميدانية',
    body: 'لاحظنا اختلافاً في قراءة السماكة على وصلة أنبوب سميك.',
  });
  assert.equal(community.status, 200);

  const manager = await post('/api/ai/agent/site-manager', {
    language: 'ar',
    mode: 'executive_audit',
    telemetry: { totalRequests: 12, newRequests: 3, urgentRequests: 1, totalCompanies: 4, activeTestingCompanies: 2 },
  });
  assert.equal(manager.status, 200);

  assert.deepEqual(outbound, [], 'the local engine must not touch the network');
});

test('the status route says plainly that nothing external is involved', async () => {
  const response = await realFetch(`${base}/api/ai/status`);
  const body = (await response.json()) as {
    provider?: string;
    external?: boolean;
    configured: boolean;
    brain?: { model: string; documents: number };
  };
  assert.equal(body.provider, 'local');
  assert.equal(body.external, false);
  assert.equal(body.configured, true);
  assert.equal(body.brain?.documents, corpus.length);
});

/* ------------------------------------------------------------------ */
/* 2. the tutor answer                                                 */
/* ------------------------------------------------------------------ */

test('the tutor answer quotes the corpus and cites every claim', async () => {
  const response = await post('/api/ai/tutor', {
    messages: [{ role: 'user', content: 'اشرح مبدأ TOFD' }],
    language: 'ar',
  });
  const text = await response.text();
  const deltas = [...text.matchAll(/"type":"delta","text":"((?:[^"\\]|\\.)*)"/g)].map(match =>
    JSON.parse(`"${match[1]}"`) as string
  );
  const answer = deltas.join('');
  assert.ok(answer.length > 120, 'a real answer, not a one-liner');
  const cited = [...answer.matchAll(/\[([a-z0-9-]+#[\w-]+)\]/g)].map(match => match[1]);
  assert.ok(cited.length >= 2, 'at least two passage ids');
  for (const id of cited) assert.ok(corpusIds.has(id), `${id} must be a real corpus id`);
  assert.match(answer, /ليست قراراً هندسياً|study material/i, 'the limits of the material are stated');
});

test('a question the library cannot answer is refused, not improvised', async () => {
  const response = await post('/api/ai/tutor', {
    messages: [{ role: 'user', content: 'ما هو سعر سهم الشركة في البورصة اليوم؟' }],
    language: 'ar',
  });
  const text = await response.text();
  assert.match(text, /لا توجد مقاطع مطابقة|لا توجد مادة مطابقة/);
  assert.equal(/"[a-z0-9-]+#[\w-]+"/.test(text), false, 'no citation is invented');
});

test('a label ending in a colon is never presented as an answer', () => {
  const hits = searchLibrary('اشرح مبدأ TOFD', { limit: 5 }).hits;
  const answer = composeTutorAnswer({ question: 'اشرح مبدأ TOFD', hits, language: 'ar', mode: 'explain' });
  assert.ok(answer);
  for (const line of answer!.text.split('\n')) {
    if (!line.startsWith('- ')) continue;
    assert.equal(/[:：]\s*\[/.test(line), false, `a heading became a bullet: ${line}`);
  }
});

test('a comparison names each method and attributes sentences to the right one', () => {
  const question = 'ما الفرق بين PAUT و TOFD؟';
  const hits = searchLibrary(question, { limit: 6 }).hits;
  const answer = composeTutorAnswer({ question, hits, language: 'ar', mode: 'compare' });
  assert.ok(answer);
  assert.match(answer!.text, /PAUT:/);
  assert.match(answer!.text, /TOFD:/);
  const intent = detectIntent(question);
  assert.equal(intent.comparing, true);
  assert.deepEqual(
    intent.methods.map(method => method.code).sort(),
    ['PAUT', 'TOFD']
  );
});

test('asking a code question never invents an acceptance value', () => {
  const question = 'ما هو بند القبول في ASME؟';
  const hits = searchLibrary(question, { limit: 6 }).hits;
  const answer = composeTutorAnswer({ question, hits, language: 'ar', mode: 'code' });
  assert.ok(answer);
  assert.match(answer!.text, /ليس قرار قبول|ليست قرار قبول/);
});

test('the same question produces the same answer twice', async () => {
  const ask = async () => {
    const response = await post('/api/ai/tutor', {
      messages: [{ role: 'user', content: 'ما هي المعالجة الحرارية PWHT؟' }],
      language: 'ar',
    });
    return response.text();
  };
  const first = await ask();
  const second = await ask();
  const strip = (value: string) => value.replace(/"elapsedMs":\d+/g, '"elapsedMs":0');
  assert.equal(strip(first), strip(second), 'a deterministic engine has no sampling noise');
});

/* ------------------------------------------------------------------ */
/* 3. the copilot                                                      */
/* ------------------------------------------------------------------ */

test('the copilot answers, drafts and summarises without a model', () => {
  const library = searchLibrary('PAUT', { limit: 5 }).hits;

  const plain = draftCopilotAnswer({
    message: 'اشرح مبدأ TOFD',
    mode: 'assistant',
    language: 'ar',
    hits: searchLibrary('اشرح مبدأ TOFD', { limit: 5 }).hits,
  });
  assert.ok(plain.reply.includes('['), 'a grounded reply carries citations');
  assert.ok(plain.suggestedActions.length >= 1);

  const draft = draftCopilotAnswer({
    message: 'اكتب منشوراً عن تجربة فحص PAUT للحامات السميكة',
    mode: 'draft_post',
    language: 'ar',
    hits: library,
  });
  assert.ok(draft.draftPost, 'draft_post must produce a draft');
  assert.equal(draft.draftPost?.ndtMethod, 'PAUT');
  assert.ok((draft.draftPost?.body.length ?? 0) > 80);
  assert.ok(draft.suggestedActions.some(action => action.actionType === 'apply_post_draft'));

  const summary = draftCopilotAnswer({
    message: 'لخص لي المنشورات',
    mode: 'summarize_feed',
    language: 'ar',
    context: {
      feedPreview: [
        { id: 'p1', title: 'PAUT على لحامات سميكة', ndtMethod: 'PAUT', excerpt: '' },
        { id: 'p2', title: 'PWHT بعد اللحام', ndtMethod: 'PWHT', excerpt: '' },
      ],
    },
    hits: [],
  });
  assert.match(summary.reply, /2 منشورات/);
  assert.match(summary.reply, /PAUT/);

  const quote = draftCopilotAnswer({ message: 'عايز عرض سعر', mode: 'rfq_draft', language: 'ar', hits: [] });
  assert.match(quote.reply, /نطاق العمل/);
  assert.ok(quote.suggestedActions.some(action => action.actionType === 'open_rfq'));

  const nothing = draftCopilotAnswer({
    message: 'zzzz qqqq غير موجود',
    mode: 'assistant',
    language: 'ar',
    hits: [],
  });
  assert.match(nothing.reply, /لم أجد في مكتبة إنسكو/);
});

test('the improve mode keeps the reader’s own draft', () => {
  const answer = draftCopilotAnswer({
    message: 'حسّن المنشور',
    mode: 'improve_post',
    language: 'ar',
    hits: [],
    context: { postDraftTitle: 'عنواني', postDraftBody: 'لحام أنبوب 12 بوصة، سماكة 18 مم، فحص PAUT.' },
  });
  assert.equal(answer.draftPost?.title, 'عنواني');
  assert.match(answer.draftPost?.body ?? '', /12 بوصة/, 'the original text survives');
});

/* ------------------------------------------------------------------ */
/* 4. the site manager                                                 */
/* ------------------------------------------------------------------ */

test('the operations audit is arithmetic over the snapshot', async () => {
  const response = await post('/api/ai/agent/site-manager', {
    language: 'ar',
    mode: 'executive_audit',
    telemetry: {
      totalRequests: 12,
      newRequests: 3,
      urgentRequests: 2,
      totalCompanies: 4,
      activeTestingCompanies: 2,
      pendingAccounts: 1,
      geofenceAlertCount: 1,
      recentGeofenceAlerts: [
        { employeeName: 'أحمد', companyCode: 'INSCO-01', distanceMeters: 850, radiusMeters: 300, timestampIso: '2026-11-24T08:00:00Z' },
      ],
      communityPostsCount: 7,
      communityMembersCount: 40,
      opportunitiesCount: 2,
      recentPosts: [
        { id: 'p1', title: 'منشور', ndtMethod: 'UT', postType: 'technical_case', authorOrg: 'INSCO', excerpt: '', aiModerationStatus: 'pending' },
        { id: 'p2', title: 'منشور ٢', ndtMethod: 'RT', postType: 'technical_case', authorOrg: 'INSCO', excerpt: '', aiModerationStatus: 'approved' },
      ],
    },
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    summary: string;
    healthStatus: string;
    priorityActions: Array<{ actionType: string; severity: string }>;
    flaggedPostIds: string[];
    announcementDraft?: { title: string };
  };
  assert.equal(body.healthStatus, 'ACTION_REQUIRED');
  assert.match(body.summary, /12 طلباً/);
  assert.match(body.summary, /2 عاجل/);
  assert.ok(body.priorityActions.some(action => action.actionType === 'open_requests' && action.severity === 'high'));
  assert.ok(body.priorityActions.some(action => action.actionType === 'open_timeclock'));
  assert.deepEqual(body.flaggedPostIds, ['p1'], 'only the unapproved post is flagged');
  assert.ok(body.announcementDraft, 'an action-required state drafts the update');
});

test('a quiet platform is reported as stable, not dressed up as an incident', async () => {
  const response = await post('/api/ai/agent/site-manager', {
    language: 'en',
    mode: 'executive_audit',
    telemetry: { totalRequests: 5, totalCompanies: 3, activeTestingCompanies: 3 },
  });
  const body = (await response.json()) as { healthStatus: string; priorityActions: unknown[] };
  assert.equal(body.healthStatus, 'OPTIMAL');
  assert.deepEqual(body.priorityActions, []);
});

/* ------------------------------------------------------------------ */
/* 5. community assist                                                 */
/* ------------------------------------------------------------------ */

test('community assist polishes, summarises and quotes — without inventing', async () => {
  const base = {
    language: 'ar',
    ndtMethod: 'PAUT',
    title: 'ملاحظة',
    body: 'اختلاف في قراءة السماكة على وصلة سميكة. المفتش راجع المعايرة ثم أعاد المسح.',
  };

  const enhance = (await (await post('/api/ai/community/assist', { ...base, action: 'enhance_post' })).json()) as {
    body?: string;
    tags?: string[];
    reply: string;
  };
  assert.ok(enhance.body && enhance.body.length > base.body.length);
  assert.ok(enhance.tags?.includes('PAUT'));

  const summary = (await (await post('/api/ai/community/assist', { ...base, action: 'summarize_post' })).json()) as {
    reply: string;
  };
  assert.match(summary.reply, /ملخص المنشور/);

  const check = (await (await post('/api/ai/community/assist', { ...base, action: 'code_check' })).json()) as {
    reply: string;
  };
  assert.match(check.reply, /لا تذكر مادة المكتبة|ما ورد في المادة/);
});
