/**
 * The deployed function must answer `/api/ai/*`.
 *
 * This is the regression that mattered: the site, the admin API and the RFQ endpoint
 * were all served on Vercel, but nothing answered the AI routes, so every tutor or
 * copilot call came back 404 and the client blamed a missing API key. The test mounts
 * the actual Vercel handler (`api/ai.ts`) on a real socket and speaks HTTP to it — no
 * key is configured, and the answer still comes back: from the local brain, out of the
 * corpus, with citations. What must never happen is a 404 or a canned paragraph.
 */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import express from 'express';

delete process.env.GEMINI_API_KEY;
delete process.env.API_KEY;

const handler = (await import('../api/ai.ts')).default;
let server: Server;
let base = '';

before(async () => {
  server = createServer(handler as never);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('the status route reports the local engine as the one answering', async () => {
  const response = await fetch(`${base}/api/ai/status`);
  assert.equal(response.status, 200, 'the route must exist — its absence is what broke the site');
  const body = (await response.json()) as {
    configured: boolean;
    reason: string;
    model: string;
    provider?: string;
    external?: boolean;
    brain?: { model: string; documents: number };
  };
  assert.equal(body.configured, true, 'no key is needed: the brain answers from the corpus');
  assert.equal(body.reason, 'ok');
  assert.equal(body.provider, 'local');
  assert.equal(body.external, false, 'nothing outside this deployment is involved');
  assert.equal(body.brain?.model, 'insco-local-1');
  assert.ok((body.brain?.documents ?? 0) > 0, 'the brain can only answer if it has passages');
});

test('a tutor call without any key is answered locally, with citations', async () => {
  const response = await fetch(`${base}/api/ai/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'ما هو الفرق بين PAUT و TOFD؟', language: 'ar' }),
  });
  assert.equal(response.status, 200, 'the local engine needs no key and no upstream');
  const text = await response.text();
  assert.match(text, /"type":"delta"/, 'the answer is streamed like any other');
  assert.match(text, /\[[a-z0-9-]+#/, 'every claim carries a passage id the reader can open');
  assert.match(text, /"model":"insco-local-1"/, 'the meta names the engine honestly');
});

test('every agent route the client calls is mounted', async () => {
  for (const route of ['/api/ai/agent/user-copilot', '/api/ai/agent/site-manager', '/api/ai/community/assist']) {
    const response = await fetch(`${base}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'اختبار', language: 'ar' }),
    });
    assert.notEqual(response.status, 404, `${route} must be mounted`);
  }
});


test('the deployed ChatGPT stream route is mounted and reports missing server configuration honestly', async () => {
  const response = await fetch(`${base}/api/ai/agent/chatgpt-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Find current NDT sources', language: 'en', mode: 'web_search' }),
  });
  assert.equal(response.status, 503, 'the route exists; a missing key is not a 404');
  const body = await response.json() as { error?: { code?: string } };
  assert.equal(body.error?.code, 'not_configured');
});

test('an unknown AI route says so instead of hanging', async () => {
  const response = await fetch(`${base}/api/ai/does-not-exist`);
  assert.equal(response.status, 404);
  const body = (await response.json()) as { error?: { code?: string } };
  assert.equal(body.error?.code, 'not_found');
});

/**
 * A missing corpus must be *reported*, not thrown.
 *
 * The deployed function died on this once: the reviewed library was loaded through a
 * dynamic import the bundled runtime could not resolve, so `/api/ai/status` answered
 * 500 and the site looked like a bad key. The gateway now loads it statically and
 * degrades to zero documents with an explicit `ready: false`.
 */
test('the status route answers with the academy library when the reviewed corpus is missing', async () => {
  const { createAiGateway } = await import('../server/ai/gateway.ts');
  const emptyRoot = mkdtempSync(path.join(tmpdir(), 'insco-no-edb-'));
  const app = express();
  app.use(createAiGateway(emptyRoot));

  const local = createServer(app as never);
  await new Promise<void>(resolve => local.listen(0, '127.0.0.1', resolve));
  const { port } = local.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/status`);
    assert.equal(response.status, 200, 'a broken corpus must not become a 500');
    const body = (await response.json()) as {
      retrieval: { documents: number; ready: boolean; source?: string };
    };
    assert.equal(body.retrieval.source, 'academy', 'no reviewed course exists, so the academy corpus answers');
    assert.ok(body.retrieval.documents > 0, 'and it is not empty');
    assert.equal(body.retrieval.ready, true);
  } finally {
    await new Promise<void>(resolve => local.close(() => resolve()));
  }
});

test('the client blames the route for a 404 and the key only for not_configured', async () => {
  const { askUserCopilot } = await import('../src/ai/agentsClient.ts');
  const realFetch = globalThis.fetch;

  const stub = (status: number, body: unknown) => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
  };

  try {
    stub(404, {});
    await assert.rejects(
      askUserCopilot({ message: 'اختبار', language: 'ar' } as never),
      (error: Error) => {
        assert.match(error.message, /not deployed/i);
        assert.doesNotMatch(error.message, /GEMINI_API_KEY/);
        return true;
      }
    );

    stub(503, { error: { code: 'not_configured' } });
    await assert.rejects(
      askUserCopilot({ message: 'اختبار', language: 'ar' } as never),
      (error: Error) => {
        assert.match(error.message, /GEMINI_API_KEY/);
        return true;
      }
    );

    stub(500, { error: { code: 'gateway_error', message: 'server exploded' } });
    await assert.rejects(
      askUserCopilot({ message: 'اختبار', language: 'ar' } as never),
      (error: Error) => {
        assert.equal(error.message, 'server exploded', 'the server message is shown verbatim');
        return true;
      }
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});
