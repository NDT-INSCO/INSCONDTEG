import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkAdminHost } from '../scripts/check-admin-host';

const HOST = 'https://admin.insco.test';
const DASHBOARD = `${HOST}/api/admin/dashboard`;
const signedOut = (headers: HeadersInit = { 'cache-control': 'no-store' }) =>
  Response.json({ error: 'signed_out' }, { status: 401, headers });

test('admin preflight rejects non-canonical and unsafe URLs before fetching', async () => {
  const noFetch: typeof fetch = async () => assert.fail('an invalid URL must not be requested');
  for (const url of ['', 'not a URL', 'http://admin.insco.test', 'https://u:p@admin.insco.test',
    `${HOST}/?password=fixture`, `${HOST}/another-app/#admin`, 'https://ndt-insco.github.io/INSCONDTEG/']) {
    assert.deepEqual(await checkAdminHost(url, noFetch), { code: 'invalid_url' });
  }
});

test('admin preflight checks only a signed-out GET and accepts the configured HTTPS contract', async () => {
  let requests = 0;
  const request: typeof fetch = async (input, init) => {
    requests++;
    assert.equal(input, DASHBOARD);
    assert.equal(init?.method, 'GET');
    assert.equal(init?.credentials, 'omit');
    assert.equal(init?.redirect, 'manual');
    assert.equal(init?.cache, 'no-store');
    assert.ok(init?.signal instanceof AbortSignal);
    assert.equal(init?.body, undefined);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('accept'), 'application/json');
    assert.equal(headers.has('cookie'), false);
    assert.equal(headers.has('authorization'), false);
    return signedOut({ 'cache-control': 'private, no-store' });
  };
  assert.deepEqual(await checkAdminHost(`${HOST}/#admin`, request), { code: 'ready', portal: `${HOST}/#admin` });
  assert.equal(requests, 1);
});

test('admin preflight distinguishes missing setup, wrong origin, missing routes, and storage outages', async () => {
  const cases = [
    [503, 'not_configured'], [403, 'origin_not_allowed'], [404, 'missing_api'],
    [500, 'storage_error'], [503, 'storage_error'],
  ] as const;
  for (const [status, code] of cases) {
    const response = Response.json({ error: code }, { status });
    assert.deepEqual(await checkAdminHost(HOST, async () => response), { code, status });
  }
  assert.deepEqual(await checkAdminHost(HOST, async () => { throw new TypeError('private diagnostic fixture'); }), { code: 'unreachable' });
});

test('ad hoc 401s, redirects and incorrect response contracts cannot pass preflight', async () => {
  const redirect = Response.redirect('https://other.example/', 307);
  assert.deepEqual(await checkAdminHost(HOST, async () => redirect), { code: 'redirect', status: 307 });
  for (const response of [new Response('Authentication required', { status: 401 }),
    new Response('{invalid json', { status: 401, headers: { 'content-type': 'application/json' } }),
    Response.json({ error: 'invalid_credentials' }, { status: 401 }),
    Response.json({ error: 'signed_out' }, { status: 503 })]) {
    assert.deepEqual(await checkAdminHost(HOST, async () => response), { code: 'unexpected_response', status: response.status });
  }
  for (const response of [signedOut({ 'cache-control': 'public, max-age=60' }),
    signedOut({ 'cache-control': 'no-store', 'set-cookie': 'example=fixture' })]) {
    assert.deepEqual(await checkAdminHost(HOST, async () => response), { code: 'unsafe_response', status: 401 });
  }
});

test('an unauthenticated 200 is rejected without parsing the potentially private response body', async () => {
  const response = Response.json({ fixture: 'contents must not be read' });
  let parsed = false;
  const parse = response.json.bind(response);
  response.json = () => { parsed = true; return parse(); };
  assert.deepEqual(await checkAdminHost(HOST, async () => response), { code: 'unexpected_response', status: 200 });
  assert.equal(parsed, false);
});
