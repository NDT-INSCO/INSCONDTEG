/**
 * Manus, the second engine.
 *
 * The behaviour that matters is not "we can reach Manus" — it is that a Manus task is
 * *asynchronous*, so a request that runs out of time must hand back a task id instead of
 * losing the work, and that the browser never sees the key. Everything here talks to the
 * real gateway shipped to Vercel (`api/ai.ts`) over a real socket, with the upstream
 * replaced by a fake that records what it was sent.
 */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { MANUS_ENDPOINTS, MANUS_LIMITS, MANUS_TASK_RECEIPT_HEADER, manusFailureMessage, normaliseManusAsk } from '../src/ai/manusContract';
import { createManusClient } from '../server/ai/manus';
import { createManusTaskReceipts } from '../server/ai/manusReceipts';

const MANUS_KEY = 'mn-test-key-not-a-real-one';

delete process.env.GEMINI_API_KEY;
delete process.env.API_KEY;
process.env.MANUS_API_KEY = MANUS_KEY;
process.env.MANUS_AGENT_PROFILE = 'lite';
// The local engine is the default now; this file is about the external second engine.
process.env.AI_PROVIDER = 'auto';
process.env.MANUS_AUTO_FALLBACK = 'true';
process.env.TUTOR_RATE_PER_MINUTE = '10';
process.env.TUTOR_RATE_PER_DAY = '200';
process.env.TUTOR_DAILY_LIMIT = '300';

/* ------------------------------------------------------------------ */
/* a fake Manus, with the parts of the v2 API the gateway uses          */
/* ------------------------------------------------------------------ */

interface UpstreamCall {
  url: string;
  method: string;
  key: string;
  body: unknown;
}

const upstream: UpstreamCall[] = [];
let answer = 'إجابة مانوس التجريبية عن فحص UT.';
let taskStatus = 'stopped';
let rejectKey = false;
let probeOverride: Response | undefined;
let receipt: string;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function handleManus(url: string, init: RequestInit | undefined): Response {
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers ?? {});
  const key = headers.get('x-manus-api-key') ?? '';
  const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
  upstream.push({ url, method, key: key ? 'present' : 'missing', body });

  if (rejectKey || !key) {
    return json({ ok: false, request_id: 'req_1', error: { code: 'unauthenticated', message: `Invalid API key: ${key}` } }, 401);
  }

  const path = new URL(url).pathname;
  if (path === '/v2/task.create' && method === 'POST') {
    return json({
      ok: true,
      request_id: 'req_2',
      task_id: 'task_test_1',
      task_title: 'INSCO tutor',
      task_url: 'https://manus.im/app/task_test_1',
    });
  }
  if (path === '/v2/task.detail') {
    const taskId = new URL(url).searchParams.get('task_id') ?? '';
    if (taskId !== 'task_test_1') {
      if (probeOverride) return probeOverride;
      // The probe relies on exactly this: an id that cannot exist proves the key works
      // without creating — and paying for — a task.
      return json({ ok: false, request_id: 'req_3', error: { code: 'not_found', message: 'Task not found' } }, 404);
    }
    return json({
      ok: true,
      request_id: 'req_4',
      task: {
        id: taskId,
        status: taskStatus,
        title: 'INSCO tutor',
        task_url: 'https://manus.im/app/task_test_1',
        credit_usage: 3,
      },
    });
  }
  if (path === '/v2/task.listMessages') {
    return json({
      ok: true,
      request_id: 'req_5',
      task_id: 'task_test_1',
      messages: [
        {
          id: 'evt_1',
          type: 'assistant_message',
          timestamp: Date.now(),
          assistant_message: { content: answer },
        },
      ],
    });
  }
  return json({ ok: false, request_id: 'req_x', error: { code: 'not_found', message: `No route ${path}` } }, 404);
}

const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.href : String((input as Request).url);
  if (new URL(url).origin !== 'https://api.manus.ai') return realFetch(input, init);
  assert.equal(init?.redirect, 'error');
  return handleManus(url, init);
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

/* ------------------------------------------------------------------ */
/* the contract                                                        */
/* ------------------------------------------------------------------ */

test('a malformed body is refused before it creates — and bills — a task', () => {
  assert.equal(normaliseManusAsk({}).ok, false);
  assert.equal(normaliseManusAsk({ message: '   ' }).ok, false);
  assert.equal(normaliseManusAsk({ message: 'x'.repeat(MANUS_LIMITS.messageChars + 1) }).ok, false);
  const parsed = normaliseManusAsk({ message: ' اشرح PAUT ', language: 'en', title: ' t ' });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.message, 'اشرح PAUT');
    assert.equal(parsed.value.language, 'en');
    assert.equal(parsed.value.title, 't');
  }
});

test('the Arabic failure copy names the real cause', () => {
  assert.match(manusFailureMessage('unauthenticated', 'ar'), /MANUS_API_KEY/);
  assert.match(manusFailureMessage('rate_limited', 'en'), /rate-limiting/);
});

/* ------------------------------------------------------------------ */
/* the gateway                                                         */
/* ------------------------------------------------------------------ */

test('the status route reports Manus without leaking the key', async () => {
  const response = await fetch(`${base}${MANUS_ENDPOINTS.status}`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as { configured: boolean; autoFallback: boolean; profile: string };
  assert.equal(body.configured, true, 'MANUS_API_KEY is set for this process');
  assert.equal(body.autoFallback, true, 'the fallback is on unless it is switched off explicitly');
  assert.equal(body.profile, 'lite');
  assert.equal(JSON.stringify(body).includes(MANUS_KEY), false, 'the key must never be echoed');
});

test('the probe is a coalesced read and does not record a missing probe ID as a generation failure', async () => {
  assert.deepEqual(upstream, [], 'the default status call must not contact Manus');
  const url = `${base}${MANUS_ENDPOINTS.status}?probe=1`;
  const responses = await Promise.all([fetch(url), fetch(url)]);
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const body = await response.json();
    assert.equal(body.auth, 'ok');
    assert.equal(body.lastError, undefined);
  }
  assert.equal(upstream.length, 1);
  assert.equal(upstream[0].method, 'GET');
  assert.equal(new URL(upstream[0].url).pathname, '/v2/task.detail');
  assert.match(new URL(upstream[0].url).searchParams.get('task_id') ?? '', /^[a-z0-9]{22}$/i);
});

test('rejected credentials, a generic 404, and a throttled probe do not report auth ok', async () => {
  const client = () => createManusClient({ MANUS_API_KEY: MANUS_KEY });
  try {
    rejectKey = true;
    assert.deepEqual(await client().probe(), { auth: 'unauthenticated' });
    rejectKey = false;
    for (const status of [404, 429]) {
      probeOverride = new Response('Not available', { status });
      assert.deepEqual(await client().probe(), { auth: 'unreachable' });
    }
  } finally {
    rejectKey = false;
    probeOverride = undefined;
  }
});

test('a cancelled request never creates an upstream task', async () => {
  const client = createManusClient({ MANUS_API_KEY: MANUS_KEY });
  const before = upstream.length;
  await assert.rejects(client.ask({ message: 'test', language: 'en' }, { signal: AbortSignal.abort() }), { code: 'timeout' });
  assert.equal(upstream.length, before);
});

test('a malformed HTTP request cannot start a task', async () => {
  const count = upstream.length;
  const response = await fetch(`${base}${MANUS_ENDPOINTS.ask}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(response.status, 400);
  assert.equal(upstream.length, count);
});

test('asking Manus returns the answer and its task id', async () => {
  upstream.length = 0;
  const response = await fetch(`${base}${MANUS_ENDPOINTS.ask}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'ما الفرق بين PAUT و TOFD؟', language: 'ar', title: 'سؤال', connectors: ['ignored'] }),
  });
  assert.equal(response.status, 200, 'a finished task is a 200, not a 202');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const body = (await response.json()) as { taskId: string; status: string; answer?: string; taskUrl?: string; taskReceipt?: string };
  assert.equal(body.taskId, 'task_test_1');
  assert.equal(body.status, 'stopped');
  assert.equal(body.answer, answer);
  assert.equal(body.taskUrl, 'https://manus.im/app/task_test_1');
  assert.ok(body.taskReceipt);
  assert.doesNotMatch(JSON.stringify(body), new RegExp(MANUS_KEY));

  const create = upstream.find(call => call.url.includes('/v2/task.create'));
  assert.ok(create, 'the gateway must create the task it reports');
  assert.equal(create?.method, 'POST');
  assert.deepEqual(create.body, {
    message: { content: [{ type: 'text', text: 'ما الفرق بين PAUT و TOFD؟', visibility: 'visible' }] },
    locale: 'ar', agent_profile: 'lite', title: 'سؤال', clear_connectors: true, share_visibility: 'private', async_title: true,
  });
  assert.equal(upstream.every(call => call.key === 'present'), true, 'every upstream call carries the key');
});

test('a still-running task is a 202 that carries the id, not an error', async () => {
  taskStatus = 'running';
  try {
    const response = await fetch(`${base}${MANUS_ENDPOINTS.ask}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The caller may cap its own wait; the server still clamps it.
      body: JSON.stringify({ message: 'مهمة طويلة', wait_ms: 1000 }),
    });
    assert.equal(response.status, 202, 'work in progress is not a failure');
    const body = (await response.json()) as { taskId: string; status: string; taskReceipt: string };
    assert.equal(body.taskId, 'task_test_1');
    assert.equal(body.status, 'running');
    assert.ok(body.taskReceipt);
    receipt = body.taskReceipt;
  } finally {
    taskStatus = 'stopped';
  }
});

test('reading a task with a missing, changed, or mismatched receipt never calls upstream', async () => {
  const count = upstream.length;
  for (const [id, token] of [['task_test_1', ''], ['task_test_1', `${receipt}x`], ['another_task', receipt]]) {
    const response = await fetch(`${base}${MANUS_ENDPOINTS.task}?task_id=${id}`, {
      headers: token ? { [MANUS_TASK_RECEIPT_HEADER]: token } : {},
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await response.json()).error.code, 'task_receipt_required');
  }
  assert.equal(upstream.length, count);
});

test('task receipts are signed, expire, and work across workers without a database', () => {
  const env = { MANUS_API_KEY: MANUS_KEY };
  let now = 1_800_000_000_000;
  const issuer = createManusTaskReceipts(env, () => now);
  const verifier = createManusTaskReceipts(env, () => now);
  const value = issuer.issue('task-abc');
  assert.ok(value);
  assert.equal(verifier.allows('task-abc', value), true);
  assert.equal(verifier.allows('task-def', value), false);
  assert.equal(verifier.allows('task-abc', value.replace(/\d(?=\.)/, digit => String((Number(digit) + 1) % 10))), false);
  assert.equal(createManusTaskReceipts({ MANUS_API_KEY: 'rotated' }, () => now).allows('task-abc', value), false);
  now += 60 * 60_000;
  assert.equal(verifier.allows('task-abc', value), false);
});

test('a task can be collected later by its receipt, including from Pages', async () => {
  const url = `${base}${MANUS_ENDPOINTS.task}?task_id=task_test_1`;
  const preflight = await fetch(url, {
    method: 'OPTIONS', headers: {
      Origin: 'https://ndt-insco.github.io', 'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': MANUS_TASK_RECEIPT_HEADER,
    },
  });
  assert.equal(preflight.status, 204);
  assert.ok(preflight.headers.get('Access-Control-Allow-Headers')?.includes(MANUS_TASK_RECEIPT_HEADER));
  const response = await fetch(url, { headers: { [MANUS_TASK_RECEIPT_HEADER]: receipt, Origin: 'https://ndt-insco.github.io' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://ndt-insco.github.io');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const body = (await response.json()) as { status: string; answer?: string; taskReceipt?: string };
  assert.equal(body.taskReceipt, undefined);
  assert.equal(body.status, 'stopped');
  assert.equal(body.answer, answer);
});

test('a missing task_id is a 400, and a rejected key is reported as such', async () => {
  const bad = await fetch(`${base}${MANUS_ENDPOINTS.task}`);
  assert.equal(bad.status, 400);

  rejectKey = true;
  try {
    const response = await fetch(`${base}${MANUS_ENDPOINTS.ask}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'سؤال' }),
    });
    assert.equal(response.status, 502);
    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, 'unauthenticated');
    assert.match(body.error.message, /MANUS_API_KEY/);
    assert.equal(JSON.stringify(body).includes(MANUS_KEY), false);
  } finally {
    rejectKey = false;
  }
});

test('the copilot answers through Manus when local retrieval has no answer and Gemini has no key', async () => {
  // Local-first answers ordinary supported requests without a provider. This obscure
  // free-form question has no INSCO passage, so auto mode may use configured Manus.
  const response = await fetch(`${base}/api/ai/agent/user-copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'qwertyuiop ZXQ-997 novel malvidium spectroscopy', language: 'en', mode: 'assistant' }),
  });
  assert.equal(response.status, 200, 'a configured second engine must answer');
  const body = (await response.json()) as { reply: string; model: string; suggestedActions: unknown[] };
  assert.equal(body.model, 'manus', 'the reader is told which engine answered');
  assert.equal(body.reply, answer);
  assert.deepEqual(body.suggestedActions, []);
});

test('auto mode reports local-first and the availability of its fallback separately', async () => {
  const response = await fetch(`${base}/api/ai/status`);
  const body = (await response.json()) as {
    configured: boolean;
    provider?: string;
    localFirst?: boolean;
    fallbackAvailable?: boolean;
    manus?: { configured: boolean; autoFallback: boolean; profile: string; baseUrl: string };
  };
  assert.equal(body.configured, true, 'the local library can answer even without Gemini');
  assert.equal(body.provider, 'auto');
  assert.equal(body.localFirst, true);
  assert.equal(body.fallbackAvailable, true, 'Manus is available as a fallback, not proof its key is valid');
  assert.equal(body.manus?.configured, true);
  assert.equal(body.manus?.baseUrl, 'https://api.manus.ai');
});

test('auto mode answers a grounded tutor question locally without contacting Manus', async () => {
  const before = upstream.length;
  const response = await fetch(`${base}/api/ai/tutor`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'اشرح مبدأ TOFD', language: 'ar' }),
  });
  assert.equal(response.status, 200);
  const stream = await response.text();
  assert.match(stream, /\"provider\":\"local\"/);
  assert.match(stream, /\[book-|\[nde-/);
  assert.equal(upstream.length, before, 'a good local answer must not consume a provider task');
});


test('the tutor keeps its source and constraints on a Manus answer', async () => {
  const response = await fetch(`${base}/api/ai/tutor`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'اشرح qwertyuiop ZXQ-997 malvidium.', language: 'ar' }),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type') ?? '', /text\/event-stream/);
  const stream = await response.text();
  assert.match(stream, /"provider":"manus"/);
  assert.ok(stream.includes(answer));
  const create = upstream.findLast(call => call.url.endsWith('/v2/task.create'));
  assert.match(JSON.stringify(create?.body), /لا تصدر قرار قبول/);
});

test('the community uses Manus only when a local code check has no matching library source', async () => {
  const response = await fetch(`${base}/api/ai/community/assist`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'code_check', ndtMethod: 'GENERAL', title: 'ZXQ-997', body: 'qwertyuiop malvidium spectroscopy ZXQ-997', language: 'en' }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.model, 'manus');
  assert.equal(body.reply, answer);
  assert.equal(body.suggestedActions, undefined);
});

test('the copilot keeps admin and client portal context local when Manus is the only external key', async () => {
  const before = upstream.length;
  for (const portal of ['admin', 'client']) {
    const response = await fetch(`${base}/api/ai/agent/user-copilot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Private portal test', language: 'en', context: { portal } }),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { model?: string };
    assert.equal(body.model, 'insco-local-1');
  }
  assert.equal(upstream.length, before);
});

test('direct creation shares the gateway budget and does not bill once limited', async () => {
  for (let attempt = 0; attempt <= 10; attempt++) {
    const before = upstream.length;
    const response = await fetch(`${base}${MANUS_ENDPOINTS.ask}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'rate fixture', wait_ms: 1000 }),
    });
    await response.json();
    if (response.status === 429) {
      assert.equal(upstream.length, before);
      assert.ok(response.headers.get('Retry-After'));
      return;
    }
    assert.equal(response.status, 202);
  }
  assert.fail('the gateway did not enforce its per-worker budget');
});
