import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalisePublicHttpsUrl,
  searchPublicWeb,
  WebSearchError,
} from '../server/ai/webResearch.ts';

test('public result URLs allow HTTPS domains and remove fragments', () => {
  assert.equal(normalisePublicHttpsUrl('https://example.com/article#section'), 'https://example.com/article');
});

test('public result URLs reject unsafe schemes, credentials, local hosts and IP literals', () => {
  for (const url of [
    'http://example.com/',
    'javascript:alert(1)',
    'https://user:pass@example.com/',
    'https://localhost/admin',
    'https://service.local/data',
    'https://127.0.0.1/private',
    'https://10.0.0.8/private',
    'https://[::1]/private',
    'https://example.com:8443/',
  ]) assert.equal(normalisePublicHttpsUrl(url), null, url);
});

test('web search refuses to run without an explicit provider key', async () => {
  await assert.rejects(
    searchPublicWeb('PAUT phased array', { apiKey: '' }),
    (error: unknown) => error instanceof WebSearchError && error.code === 'not_configured',
  );
});

test('web search sends only the query to the fixed provider and filters unsafe/duplicate results', async () => {
  let requested = '';
  let sentHeaders: HeadersInit | undefined;
  const fetchImpl: typeof fetch = async (input, init) => {
    requested = String(input);
    sentHeaders = init?.headers;
    return new Response(JSON.stringify({
      web: { results: [
        { title: 'PAUT guide', url: 'https://example.com/paut', description: '<b>Array</b> testing &amp; inspection', page_age: '2026-10-01' },
        { title: 'Unsafe', url: 'http://127.0.0.1/private', description: 'blocked' },
        { title: 'Duplicate', url: 'https://example.com/paut', description: 'duplicate' },
        { title: 'ASNT', url: 'https://asnt.org/resources', description: 'NDT resource' },
      ] },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const result = await searchPublicWeb('  PAUT phased array  ', {
    apiKey: 'test-secret',
    maxResults: 5,
    fetchImpl,
    now: (() => { let n = 100; return () => ++n; })(),
  });
  assert.match(requested, /^https:\/\/api\.search\.brave\.com\/res\/v1\/web\/search\?/);
  assert.match(requested, /q=PAUT\+phased\+array/);
  assert.equal(new Headers(sentHeaders).get('X-Subscription-Token'), 'test-secret');
  assert.equal(result.sources.length, 2);
  assert.equal(result.sources[0].snippet, 'Array testing & inspection');
  assert.equal(result.sources[0].published, '2026-10-01');
});

test('web search bounds result count and rejects short queries before network access', async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ web: { results: [] } }), { status: 200 });
  };
  await assert.rejects(
    searchPublicWeb('  ', { apiKey: 'x', fetchImpl }),
    (error: unknown) => error instanceof WebSearchError && error.code === 'invalid_query',
  );
  const result = await searchPublicWeb('NDT inspection', { apiKey: 'x', maxResults: 100, fetchImpl });
  assert.equal(calls, 1);
  assert.equal(result.sources.length, 0);
});

test('provider HTTP failures are surfaced as safe typed errors', async () => {
  await assert.rejects(
    searchPublicWeb('NDT inspection', {
      apiKey: 'x',
      fetchImpl: async () => new Response('private provider details', { status: 503 }),
    }),
    (error: unknown) => error instanceof WebSearchError && error.code === 'provider_error' && !error.message.includes('private'),
  );
});
