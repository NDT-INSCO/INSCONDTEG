import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { config as routes } from '../netlify/functions/insco';
import { createNetlifyHandler } from '../server/admin/netlify';
import { fakeDatabase } from './helpers/hostedAdmin';
import { authenticator } from './helpers/passkeyAuthenticator';

const API = '/api/admin';
const ORIGIN = 'https://insco-admin.netlify.app';
const PAGES = 'https://ndt-insco.github.io';
const DATABASE = 'https://database.insco-hosted.test';
const TOKEN = 'isolated-netlify-test-token';
const PASSWORD = 'Example_Netl1fy_57!';
const production = { context: 'production', id: 'current', published: true };
const env = () => ({ ADMIN_ORIGIN: ORIGIN, ADMIN_PASSWORD: PASSWORD, ADMIN_STATE_KEY: randomBytes(32).toString('hex'),
  TURSO_DATABASE_URL: DATABASE, TURSO_AUTH_TOKEN: TOKEN, PUBLIC_SITE_ORIGIN: PAGES });

function worker(config = env()) {
  const invoke = createNetlifyHandler(config);
  return (path: string, { method = 'GET', body, cookie, from = ORIGIN, url = ORIGIN, ip = '192.0.2.7',
    deploy = production, headers = {} }: { method?: string; body?: unknown; cookie?: string; from?: string;
    url?: string; ip?: string; deploy?: typeof production; headers?: Record<string, string> } = {}) =>
    invoke(new Request(`${url}${path}`, { method, headers: {
      Origin: from, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}), ...headers,
    }, body: body === undefined ? undefined : JSON.stringify(body) }), { deploy, ip });
}

type Worker = ReturnType<typeof worker>;
function cookie(response: Response, name: string) {
  const value = response.headers.getSetCookie().find(item => item.startsWith(`${name}=`));
  assert.ok(value, `missing ${name}`);
  assert.match(value, /HttpOnly; Secure; SameSite=Strict/i);
  return value.split(';', 1)[0];
}

async function login(call: Worker, ip?: string) {
  const response = await call(`${API}/login`, { method: 'POST', body: { password: PASSWORD }, ip });
  assert.equal(response.status, 204, await response.text());
  return cookie(response, 'insco_admin');
}

test('Netlify routes only the operations API and fails closed on previews, older deploys and other origins', async t => {
  assert.deepEqual(routes.path, ['/api/admin', '/api/admin/*', '/api/rfq', '/api/site/announcement']);
  const store = fakeDatabase(t, DATABASE, TOKEN);
  const call = worker();
  for (const deploy of [{ ...production, context: 'deploy-preview' }, { ...production, published: false }]) {
    const denied = await call(`${API}/login`, { deploy, method: 'POST', body: { password: PASSWORD } });
    assert.equal(denied.status, 503);
    assert.deepEqual(await denied.json(), { error: 'not_configured' });
    assert.equal(denied.headers.get('cache-control'), 'no-store');
    assert.deepEqual(denied.headers.getSetCookie(), []);
  }
  for (const url of ['https://preview--insco-admin.netlify.app', 'http://insco-admin.netlify.app']) {
    const alias = await call(`${API}/dashboard`, { url, headers: { Host: new URL(ORIGIN).host } });
    assert.equal(alias.status, 403);
    assert.equal(alias.headers.get('content-security-policy'), "frame-ancestors 'none'");
  }
  const unconfigured = await worker({ ...env(), TURSO_AUTH_TOKEN: '' })(`${API}/dashboard`);
  assert.equal(unconfigured.status, 503);
  assert.deepEqual(await unconfigured.json(), { error: 'not_configured' });
  assert.equal(store.schemaLoads(), 0, 'disallowed requests did not open the database');
  const signedOut = await call(`${API}/dashboard`);
  assert.equal(signedOut.status, 401);
  assert.deepEqual(await signedOut.json(), { error: 'signed_out' });
  assert.equal(signedOut.headers.get('x-robots-tag'), 'noindex');
});

test('Netlify preserves JSON bodies, shared sessions and distinct secure passkey cookies', async t => {
  fakeDatabase(t, DATABASE, TOKEN);
  const config = env();
  const a = worker(config);
  const b = worker(config);
  const session = await login(a);
  const device = authenticator(ORIGIN);
  const options = await b(`${API}/passkeys/register/options`, { method: 'POST', cookie: session, body: { label: 'هاتف الإدارة' } });
  assert.equal(options.status, 200);
  const registration = await options.json();
  const saved = await a(`${API}/passkeys/register/verify`, { method: 'POST',
    cookie: `${session}; ${cookie(options, 'insco_passkey_challenge')}`, body: { response: device.registration(registration) } });
  assert.equal(saved.status, 201, await saved.text());
  const keys = await b(`${API}/passkeys`, { cookie: session });
  assert.equal((await keys.json()).items[0].label, 'هاتف الإدارة');
  const loggedOut = await b(`${API}/logout`, { method: 'POST', cookie: session });
  assert.equal(loggedOut.status, 204);
  assert.equal((await a(`${API}/dashboard`, { cookie: session })).status, 401);

  const prompt = await a(`${API}/passkeys/authenticate/options`, { method: 'POST', body: {} });
  assert.equal(prompt.status, 200);
  const proof = { method: 'POST', cookie: cookie(prompt, 'insco_passkey_challenge'),
    body: { response: device.assertion(await prompt.json(), registration.user.id) } };
  const success = await b(`${API}/passkeys/authenticate/verify`, proof);
  assert.equal(success.status, 204, await success.text());
  assert.equal(success.headers.getSetCookie().length, 2, 'the session and cleared challenge are separate headers');
  assert.ok(cookie(success, 'insco_passkey_challenge'));
  const signedIn = cookie(success, 'insco_admin');
  assert.equal((await a(`${API}/dashboard`, { cookie: signedIn })).status, 200);
  assert.equal((await a(`${API}/passkeys/authenticate/verify`, proof)).status, 400);
});

test('Netlify handles public CORS separately from admin, with request size limits and query strings', async t => {
  fakeDatabase(t, DATABASE, TOKEN);
  const call = worker();
  const crossSite = await call(`${API}/login`, { method: 'POST', from: PAGES, body: { password: PASSWORD } });
  assert.equal(crossSite.status, 403);
  assert.equal(crossSite.headers.get('access-control-allow-origin'), null);
  assert.equal((await call('/api/rfq', { method: 'OPTIONS', from: 'https://other.example.test' })).status, 403);
  const preflight = await call('/api/rfq', { method: 'OPTIONS', from: PAGES });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), PAGES);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null);
  const oversized = await call('/api/rfq', { method: 'POST', from: PAGES, body: { text: 'x'.repeat(96 * 1024) } });
  assert.equal(oversized.status, 413);
  const passTooLarge = await call(`${API}/login`, { method: 'POST', body: { password: 'x'.repeat(4096) } });
  assert.equal(passTooLarge.status, 413);
  const quote = await call('/api/rfq', { method: 'POST', from: PAGES, body: {
    companyName: 'مكتب إنسكو', phone: '+20 100 000 0000', email: 'test@example.test',
  } });
  assert.equal(quote.status, 200);
  const { reference } = await quote.json();
  const session = await login(call);
  const search = await call(`${API}/quotes?q=${encodeURIComponent('مكتب إنسكو')}`, { cookie: session });
  assert.equal(search.status, 200);
  assert.equal((await search.json()).items[0].reference, reference);
  assert.equal((await call(`${API}/quotes/${reference}`, { method: 'PATCH', cookie: session, body: { status: 'closed' } })).status, 200);
  const message = { ar: 'نص تجريبي', en: 'Test message' };
  assert.equal((await call(`${API}/announcement`, { method: 'PUT', cookie: session, body: { enabled: true, message } })).status, 200);
  const announcement = await call('/api/site/announcement', { from: PAGES });
  assert.equal(announcement.headers.get('access-control-allow-origin'), PAGES);
  assert.deepEqual(await announcement.json(), { message });
  const head = await call('/api/site/announcement', { method: 'HEAD', from: PAGES });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('Netlify uses the platform client IP for shared rate limits, not request headers', async t => {
  fakeDatabase(t, DATABASE, TOKEN);
  const call = worker();
  for (let i = 1; i <= 6; i++) {
    const response = await call(`${API}/login`, { method: 'POST', body: { password: 'Wrong_Password9' }, headers: {
      'X-Forwarded-For': `192.0.2.${i}`, 'X-NF-Client-Connection-IP': `198.51.100.${i}`,
    } });
    assert.equal(response.status, i <= 5 ? 401 : 429);
  }
  await login(call, '192.0.2.50');
});
