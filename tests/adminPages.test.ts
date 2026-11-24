import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test, type TestContext } from 'node:test';
import { createNetlifyHandler } from '../server/admin/netlify';
import { PAGES_SESSION_TTL, tokenDigest } from '../server/admin/state';
import { ADMIN_API, INSCO_PAGES_ORIGIN as PAGES, PAGES_ADMIN_API as API, isAdminToken } from '../src/admin/contract';
import { fakeDatabase } from './helpers/hostedAdmin';
import { authenticator } from './helpers/passkeyAuthenticator';

const HOST = 'https://insco-admin.netlify.app';
const DATABASE = 'https://pages-admin-db.example.test';
const DATABASE_TOKEN = 'isolated-pages-test-token';
const PASSWORD = 'Fixture_Adm1n_Only!';
const live = { context: 'production', id: 'published', published: true };

function fixture(t: TestContext) {
  const store = fakeDatabase(t, DATABASE, DATABASE_TOKEN);
  const env = {
    ADMIN_PAGES_ENABLED: 'true', ADMIN_ORIGIN: HOST, ADMIN_PASSWORD: PASSWORD,
    ADMIN_STATE_KEY: randomBytes(32).toString('hex'), TURSO_DATABASE_URL: DATABASE, TURSO_AUTH_TOKEN: DATABASE_TOKEN,
  };
  function worker(override: NodeJS.ProcessEnv = {}) {
    const handle = createNetlifyHandler({ ...env, ...override });
    return (path: string, { method = 'GET', body, token, origin = PAGES, headers: more, url = HOST, deploy = live, ip = '192.0.2.6' }: {
      method?: string; body?: unknown; token?: string; origin?: string | null; headers?: HeadersInit;
      url?: string; deploy?: typeof live; ip?: string;
    } = {}) => {
      const headers = new Headers(more);
      if (origin !== null) headers.set('Origin', origin);
      if (body !== undefined) headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return handle(new Request(`${url}${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body), headers }), { ip, deploy });
    };
  }
  return { worker, store };
}

type Call = ReturnType<ReturnType<typeof fixture>['worker']>;
async function session(response: Response) {
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal(response.headers.has('set-cookie'), false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('access-control-allow-origin'), PAGES);
  const { token } = await response.json();
  assert.ok(isAdminToken(token));
  return token;
}
async function login(call: Call) {
  return session(await call(`${API}/login`, { method: 'POST', body: { password: PASSWORD } }));
}
const draftInput = { task: 'inbox', output: 'block', trigger: 'manual', locale: 'en', language: 'Python',
  brief: 'Summarise the synthetic queue.', cells: ['input', 'draft'], includeSnapshot: true };

test('Pages admin is opt-in, canonical production only, with exact credential-free CORS', async t => {
  const { worker, store } = fixture(t);
  const call = worker();
  for (const options of [
    { deploy: { ...live, published: false } }, { deploy: { ...live, context: 'deploy-preview' } },
    { url: 'https://alias--insco-admin.netlify.app' },
    { origin: null }, { origin: `http://${new URL(PAGES).host}` }, { origin: `${PAGES}/INSCONDTEG` },
    { origin: 'null' }, { origin: 'https://elsewhere.github.io' },
  ]) {
    const response = await call(`${API}/dashboard`, options);
    assert.ok([403, 503].includes(response.status));
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.equal(response.headers.has('set-cookie'), false);
  }
  for (const flag of ['', 'false', 'TRUE']) {
    const response = await worker({ ADMIN_PAGES_ENABLED: flag })(`${API}/dashboard`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  for (const [method, names, allowed] of [
    ['PATCH', 'authorization, content-type', true], ['DELETE', 'authorization', true],
    ['POST', 'content-type', true], ['TRACE', 'content-type', false], ['GET', 'x-untrusted', false],
  ] as const) {
    const response = await call(`${API}/quotes/Q1`, { method: 'OPTIONS', headers: {
      'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': names,
    } });
    assert.equal(response.status, allowed ? 204 : 403);
    assert.equal(response.headers.get('access-control-allow-origin'), allowed ? PAGES : null);
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
    assert.match(response.headers.get('vary')!, /Origin.*Access-Control-Request-Method.*Access-Control-Request-Headers/i);
  }
  assert.equal(store.schemaLoads(), 0, 'refused requests and preflight did not open storage');
  for (const override of [{ TURSO_AUTH_TOKEN: '' }, { ADMIN_PASSWORD: '', ADMIN_PIN: '12345678' }]) {
    const response = await worker(override)(`${API}/dashboard`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('access-control-allow-origin'), PAGES);
    assert.deepEqual(await response.json(), { error: 'not_configured' });
  }
  assert.equal((await call(`${ADMIN_API}/login`, { origin: HOST, method: 'POST', body: { password: PASSWORD } })).status, 404);
});

test('Pages bearer uses shared live records and supports protected quotes, notices, Factory and revocation', async t => {
  const { worker, store } = fixture(t);
  const databaseFetch = fetch;
  const proposal = { title: 'Review draft', summary: 'Synthetic data only.', steps: [], checks: ['Review manually'], code: null };
  let drafts = 0;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    if (req.url.startsWith(DATABASE + '/')) return databaseFetch(req);
    const provider = new URL(req.url);
    assert.equal(provider.origin, 'https://generativelanguage.googleapis.com');
    assert.match(provider.pathname, /\/interactions$/);
    assert.equal(req.headers.get('x-goog-api-key'), 'fixture-factory-key');
    const payload = await req.text();
    assert.ok(payload.includes('newRequests'));
    assert.ok(!payload.includes('Fixture customer'));
    drafts++;
    const event = { event_type: 'step.delta', delta: { type: 'text', text: JSON.stringify(proposal) } };
    return new Response(`data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`, { headers: { 'Content-Type': 'text/event-stream' } });
  });
  const original = worker({ ADMIN_PAGES_ENABLED: 'false' });
  const a = worker();
  const b = worker({ GEMINI_API_KEY: 'fixture-factory-key' });
  const incoming = await original('/api/rfq', { origin: HOST, method: 'POST', body: {
    companyName: 'Fixture customer', contactName: 'Test operator', phone: '+20 100 000 0000', email: 'fixture@example.test',
  } });
  assert.equal(incoming.status, 200, await incoming.clone().text());
  const { reference } = await incoming.json();
  for (const [path, method] of [['/dashboard', 'GET'], ['/quotes', 'GET'], ['/quotes/Q1', 'PATCH'], ['/announcement', 'PUT'], ['/factory/draft', 'POST']]) {
    const response = await b(`${API}${path}`, { method, ...(method === 'GET' ? {} : { body: {} }) });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'signed_out' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('access-control-allow-origin'), PAGES);
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
    assert.equal(response.headers.has('set-cookie'), false);
  }
  assert.equal(drafts, 0);
  const token = await login(a);
  const stored = store.db.prepare('SELECT token, issued_at, expires_at FROM admin_sessions').get()!;
  assert.equal(stored.token, tokenDigest(token));
  assert.equal(Number(stored.expires_at) - Number(stored.issued_at), PAGES_SESSION_TTL);
  assert.equal((await b(`${API}/dashboard`, { origin: null, token })).status, 403);
  assert.equal((await b(`${API}/dashboard`, { headers: { Cookie: `insco_admin=${token}` } })).status, 401);
  assert.equal((await original(`${ADMIN_API}/dashboard`, { origin: HOST, headers: { Cookie: `insco_admin=${token}` } })).status, 401);
  assert.equal((await original(`${ADMIN_API}/dashboard`, { origin: HOST, token })).status, 401);
  const fromOtherHost = await original(`${ADMIN_API}/login`, { origin: HOST, method: 'POST', body: { password: PASSWORD } });
  assert.equal(fromOtherHost.status, 204);
  const cookie = fromOtherHost.headers.getSetCookie()[0].split(';', 1)[0];
  assert.equal((await b(`${API}/dashboard`, { token: cookie.split('=')[1] })).status, 401);
  assert.equal((await b(`${API}/dashboard`, { token })).status, 200);
  const list = await b(`${API}/quotes?q=Fixture%20customer`, { token });
  assert.equal((await list.json()).items[0].reference, reference);
  const patched = await b(`${API}/quotes/${reference}`, { method: 'PATCH', body: { status: 'in_progress' }, token });
  assert.equal((await patched.json()).status, 'in_progress');
  const updated = await original(`${ADMIN_API}/quotes/${reference}`, { origin: HOST, headers: { Cookie: cookie } });
  assert.equal((await updated.json()).status, 'in_progress');
  const message = { ar: 'إعلان للاختبار', en: 'Fixture notice' };
  assert.equal((await a(`${API}/announcement`, { method: 'PUT', token, body: { enabled: true, message } })).status, 200);
  const banner = await b('/api/site/announcement');
  assert.equal(banner.headers.get('access-control-allow-origin'), PAGES);
  assert.deepEqual(await banner.json(), { message });
  const draft = await b(`${API}/factory/draft`, { method: 'POST', token, body: draftInput });
  assert.equal(draft.status, 200, await draft.clone().text());
  assert.deepEqual(await draft.json(), proposal);
  assert.equal(drafts, 1);
  const signOut = await a(`${API}/logout`, { method: 'POST', token });
  assert.equal(signOut.status, 204);
  assert.equal(signOut.headers.has('set-cookie'), false);
  assert.equal((await b(`${API}/dashboard`, { token })).status, 401);
  const expired = await login(a);
  store.db.prepare('UPDATE admin_sessions SET expires_at = 0 WHERE token = ?').run(tokenDigest(expired));
  assert.equal((await b(`${API}/dashboard`, { token: expired })).status, 401);
});

test('Pages passkeys use the browser RP, require recent password and consume ceremonies exactly once', async t => {
  const { worker } = fixture(t);
  const a = worker();
  const b = worker();
  const token = await login(a);
  const device = authenticator(PAGES);
  const options = await b(`${API}/passkeys/register/options`, { method: 'POST', token, body: { label: 'جهاز تجريبي' } });
  assert.equal(options.status, 200);
  assert.equal(options.headers.has('set-cookie'), false);
  const registration = await options.json();
  assert.equal(registration.options.rp.id, new URL(PAGES).hostname);
  assert.ok(isAdminToken(registration.ceremony));
  const response = device.registration(registration.options);
  const added = await a(`${API}/passkeys/register/verify`, { method: 'POST', token, body: { ceremony: registration.ceremony, response } });
  assert.equal(added.status, 201, await added.clone().text());
  assert.equal(added.headers.has('set-cookie'), false);
  assert.deepEqual(await (await a(`${API}/passkeys/status`)).json(), { available: true });
  assert.deepEqual(await (await worker({ ADMIN_PAGES_ENABLED: 'false' })(`${ADMIN_API}/passkeys/status`, { origin: HOST })).json(), { available: false });

  const prompt = async () => {
    const res = await a(`${API}/passkeys/authenticate/options`, { method: 'POST', body: {} });
    assert.equal(res.status, 200);
    assert.equal(res.headers.has('set-cookie'), false);
    return res.json();
  };
  const wrong = await prompt();
  assert.equal(wrong.options.rpId, new URL(PAGES).hostname);
  const verify = (body: unknown) => b(`${API}/passkeys/authenticate/verify`, { method: 'POST', body });
  const wrongProof = device.assertion(wrong.options, registration.options.user.id, { origin: HOST });
  assert.equal((await verify({ ceremony: wrong.ceremony, response: wrongProof })).status, 401);
  const fresh = await prompt();
  const proof = { ceremony: fresh.ceremony, response: device.assertion(fresh.options, registration.options.user.id) };
  const viaKey = await session(await verify(proof));
  assert.equal((await verify(proof)).status, 400);
  assert.equal((await a(`${API}/dashboard`, { token: viaKey })).status, 200);
  const keys = await b(`${API}/passkeys`, { token: viaKey });
  assert.equal((await keys.json()).canManage, false);
  assert.equal((await a(`${API}/passkeys/${device.id}`, { method: 'DELETE', token: viaKey })).status, 403);
  assert.equal((await a(`${API}/passkeys/${device.id}`, { method: 'DELETE', token })).status, 204);
  assert.equal((await b(`${API}/dashboard`, { token: viaKey })).status, 401);
});

test('Pages password limits share the platform IP budget across workers and expose Retry-After', async t => {
  const { worker } = fixture(t);
  const workers = [worker(), worker()];
  for (let i = 0; i < 6; i++) {
    const res = await workers[i % 2](`${API}/login`, { method: 'POST', body: { password: 'Wrong_password!' },
      headers: { 'X-Forwarded-For': `198.51.100.${i}` } });
    assert.equal(res.status, i < 5 ? 401 : 429);
    assert.equal(res.headers.get('access-control-expose-headers'), 'Retry-After');
    if (i === 5) assert.ok(Number(res.headers.get('retry-after')) > 0);
  }
});
