/**
 * The static GitHub Pages build has no server, so it must call the hosted gateway — but it
 * must do so explicitly, and the gateway must answer the browser's preflight or the call
 * never leaves the page.
 */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { HOSTED_GATEWAY_URL, PAGES_SITE_ORIGIN, resolveGatewayBase } from '../src/ai/pagesGateway';

delete process.env.GEMINI_API_KEY;
delete process.env.API_KEY;

const handler = (await import('../api/ai.ts')).default;
let server: Server;
let base = '';

before(async () => {
  server = createServer(handler as never);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('a same-origin build keeps the gateway relative', () => {
  assert.equal(resolveGatewayBase(undefined, false), '', 'the hosted build talks to itself');
  assert.equal(resolveGatewayBase('  ', false), '');
});

test('a static build points at the hosted gateway', () => {
  assert.equal(resolveGatewayBase(undefined, true), HOSTED_GATEWAY_URL);
  assert.equal(PAGES_SITE_ORIGIN, 'https://ndt-insco.github.io');
});

test('an explicit base wins and loses its trailing slash', () => {
  assert.equal(resolveGatewayBase('https://example.test/', true), 'https://example.test');
  assert.equal(resolveGatewayBase('https://example.test', false), 'https://example.test');
});

test('the gateway answers the preflight the Pages build sends', async () => {
  const response = await fetch(`${base}/api/ai/tutor`, {
    method: 'OPTIONS',
    headers: {
      Origin: PAGES_SITE_ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(response.status, 204, 'a preflight must not be a 404 or a 405');
  assert.equal(response.headers.get('access-control-allow-origin'), PAGES_SITE_ORIGIN);
  assert.match(response.headers.get('access-control-allow-methods') || '', /POST/);
  assert.match(response.headers.get('access-control-allow-headers') || '', /content-type/i);
  assert.match(response.headers.get('vary') || '', /origin/i, 'a CDN must not mix the two builds');
});

test('the status route is readable from the Pages origin', async () => {
  const response = await fetch(`${base}/api/ai/status`, { headers: { Origin: PAGES_SITE_ORIGIN } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), PAGES_SITE_ORIGIN);
});

test('an origin the project does not own is not granted access', async () => {
  const response = await fetch(`${base}/api/ai/tutor`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://not-insco.example', 'Access-Control-Request-Method': 'POST' },
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('access-control-allow-origin'), null, 'no grant, no header');
});
