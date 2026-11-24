import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { after, test } from 'node:test';

test('the research endpoint calls the configured search provider and returns sourced public links', async () => {
  const oldKey = process.env.BRAVE_SEARCH_API_KEY;
  const oldAiProvider = process.env.AI_PROVIDER;
  const realFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestedBody = '';
  process.env.BRAVE_SEARCH_API_KEY = 'test-brave-key';
  process.env.AI_PROVIDER = 'local';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedBody = String(init?.body ?? '');
    return new Response(JSON.stringify({
      web: { results: [
        { title: 'ASNT NDT Resource', url: 'https://www.asnt.org/resources', description: 'Public NDT resource' },
      ] },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  let server: Server | undefined;
  try {
    const { createAiGateway } = await import('../server/ai/gateway.ts');
    const app = express();
    app.use(createAiGateway(process.cwd()));
    server = createServer(app as never);
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const response = await realFetch(`http://127.0.0.1:${port}/api/ai/research/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'NDT inspection standards', maxResults: 3 }),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { external: boolean; provider: string; sources: Array<{ url: string }> };
    assert.equal(body.external, true);
    assert.equal(body.provider, 'brave');
    assert.equal(body.sources[0].url, 'https://www.asnt.org/resources');
    assert.match(requestedUrl, /^https:\/\/api\.search\.brave\.com\//);
    assert.equal(requestedBody, '', 'search tool does not forward conversation or private documents');
  } finally {
    globalThis.fetch = realFetch;
    if (oldKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY;
    else process.env.BRAVE_SEARCH_API_KEY = oldKey;
    if (oldAiProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = oldAiProvider;
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
  }
});


test('the Vercel AI gateway mounts the shared ChatGPT streaming endpoint', async () => {
  const realFetch = globalThis.fetch;
  let server: Server | undefined;
  try {
    const { createAiGateway } = await import('../server/ai/gateway.ts');
    const app = express();
    app.use(createAiGateway(process.cwd()));
    server = createServer(app as never);
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const response = await realFetch(`http://127.0.0.1:${port}/api/ai/agent/chatgpt-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 400);
    const body = await response.json() as { error?: { code?: string } };
    assert.equal(body.error?.code, 'invalid_request');
  } finally {
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
  }
});
