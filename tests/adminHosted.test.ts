import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer, request, type RequestListener } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, type TestContext } from 'node:test';
import { hostedDatabaseConfig } from '../server/admin/database';
import { createVercelHandler } from '../server/admin/vercel';
import { fakeDatabase } from './helpers/hostedAdmin';
import { authenticator } from './helpers/passkeyAuthenticator';

const ORIGIN = 'https://admin.insco-hosted.test';
const HOST = new URL(ORIGIN).host;
const PAGES = 'https://ndt-insco.github.io';
const DATABASE = 'https://database.insco-hosted.test';
const PASSWORD = 'Example_Hosted_52!';
const TOKEN = 'isolated-test-rw-token';
const env = () => ({ ADMIN_ORIGIN: ORIGIN, ADMIN_PASSWORD: PASSWORD, ADMIN_STATE_KEY: randomBytes(32).toString('hex'),
  TURSO_DATABASE_URL: DATABASE, TURSO_AUTH_TOKEN: TOKEN, PUBLIC_SITE_ORIGIN: PAGES });

async function worker(t: TestContext, config: NodeJS.ProcessEnv) {
  const handler = createVercelHandler(config) as RequestListener;
  const server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const port = (server.address() as AddressInfo).port;
  return function call(path: string, { method = 'GET', body, cookie, from = ORIGIN, host = HOST, ip = '192.0.2.7' }: {
    method?: string; body?: unknown; cookie?: string; from?: string; host?: string; ip?: string;
  } = {}) {
    return new Promise<{ status: number; headers: import('node:http').IncomingHttpHeaders; text: string; json: () => any }>((resolve, reject) => {
      const content = body === undefined ? null : JSON.stringify(body);
      const req = request({ hostname: '127.0.0.1', port, path, method, headers: {
        Host: host, Origin: from, 'X-Forwarded-For': ip,
        ...(content ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(content) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      } }, res => {
        res.setEncoding('utf8');
        let text = '';
        res.on('data', chunk => { text += chunk; });
        res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, text, json: () => JSON.parse(text) }));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end(content ?? undefined);
    });
  };
}

type Worker = Awaited<ReturnType<typeof worker>>;
const api = '/api/admin';
function cookie(res: Awaited<ReturnType<Worker>>, name: string) {
  const value = res.headers['set-cookie']?.find(item => item.startsWith(`${name}=`));
  assert.ok(value, `missing ${name} cookie`);
  return value.split(';', 1)[0];
}
async function login(call: Worker, password = PASSWORD) {
  const response = await call(`${api}/login`, { method: 'POST', body: { password } });
  assert.equal(response.status, 204, response.text);
  assert.match(response.headers['set-cookie']![0], /HttpOnly; Secure; SameSite=Strict/i);
  return cookie(response, 'insco_admin');
}

test('hosted configuration rejects insecure or incomplete remote storage, with no local fallback', async t => {
  const config = env();
  for (const url of ['http://db.example', 'file:/tmp/admin.sqlite', 'libsql://db.example?tls=0', 'https://user@db.example']) {
    assert.equal(hostedDatabaseConfig({ ...config, TURSO_DATABASE_URL: url }), null);
  }
  const call = await worker(t, { ...config, TURSO_AUTH_TOKEN: '', ADMIN_DATA_DIR: '/tmp/never-used-by-functions' });
  const dashboard = await call(`${api}/dashboard`);
  assert.equal(dashboard.status, 503);
  assert.deepEqual(dashboard.json(), { error: 'not_configured' });
  assert.equal(dashboard.headers['cache-control'], 'no-store');
  const login = await call(`${api}/login`, { method: 'POST', body: { password: PASSWORD } });
  assert.equal(login.status, 503);
  assert.equal(login.headers['set-cookie'], undefined);
});

test('hosted initialization can recover after a storage outage; other deploy hostnames stay blocked', async t => {
  const storage = fakeDatabase(t, DATABASE, TOKEN);
  const call = await worker(t, env());
  const alias = await call(`${api}/dashboard`, { host: 'old.insco-hosted.test' });
  assert.equal(alias.status, 403);
  storage.outage();
  const unavailable = await call(`${api}/dashboard`);
  assert.equal(unavailable.status, 503);
  assert.deepEqual(unavailable.json(), { error: 'storage_error' });
  storage.restore();
  assert.equal((await call(`${api}/dashboard`)).status, 401);
  assert.equal((await call(`${api}/login`, { method: 'POST', from: PAGES, body: { password: PASSWORD } })).status, 403);
  await login(call);
});

test('password sessions, logout, rotations, and rate limits span independent hosted workers', async t => {
  const storage = fakeDatabase(t, DATABASE, TOKEN);
  const config = env();
  const a = await worker(t, config);
  const b = await worker(t, config);
  const attempts = await Promise.all(Array.from({ length: 9 }, (_, i) => (i % 2 ? a : b)(`${api}/login`, {
    method: 'POST', body: { password: 'Wrong_Password9' }, ip: '192.0.2.55',
  })));
  assert.equal(attempts.filter(res => res.status === 401).length, 5);
  assert.equal(attempts.filter(res => res.status === 429).length, 4);
  const session = await login(a);
  assert.equal(storage.schemaLoads(), 2, 'two independent initializations shared the database');
  assert.equal((await b(`${api}/dashboard`, { cookie: session })).status, 200);
  const hashed = storage.db.prepare('SELECT token FROM admin_sessions').get()?.token;
  assert.notEqual(hashed, session.split('=')[1], 'cookies are not stored in plaintext');
  assert.equal((await b(`${api}/logout`, { method: 'POST', cookie: session })).status, 204);
  assert.equal((await a(`${api}/dashboard`, { cookie: session })).status, 401);
  const current = await login(b);
  const rotated = await worker(t, { ...config, ADMIN_PASSWORD: 'Rotated_Example11!' });
  assert.equal((await rotated(`${api}/dashboard`, { cookie: current })).status, 401);
  await login(rotated, 'Rotated_Example11!');
});

test('passkey ceremonies and revocation work across hosted workers; parallel proof succeeds only once', async t => {
  fakeDatabase(t, DATABASE, TOKEN);
  const config = env();
  const a = await worker(t, config);
  const b = await worker(t, config);
  const password = await login(a);
  const key = authenticator(ORIGIN);
  const register = await b(`${api}/passkeys/register/options`, { method: 'POST', cookie: password, body: { label: 'هاتف المكتب' } });
  assert.equal(register.status, 200, register.text);
  const registration = register.json();
  const saved = await a(`${api}/passkeys/register/verify`, { method: 'POST', cookie: `${password}; ${cookie(register, 'insco_passkey_challenge')}`,
    body: { response: key.registration(registration) } });
  assert.equal(saved.status, 201, saved.text);
  const prompt = await a(`${api}/passkeys/authenticate/options`, { method: 'POST', body: {} });
  assert.equal(prompt.status, 200);
  const proof = { method: 'POST', cookie: cookie(prompt, 'insco_passkey_challenge'),
    body: { response: key.assertion(prompt.json(), registration.user.id) } };
  const signedIn = await Promise.all([a(`${api}/passkeys/authenticate/verify`, proof), b(`${api}/passkeys/authenticate/verify`, proof)]);
  assert.deepEqual(signedIn.map(res => res.status).sort(), [204, 400]);
  const device = cookie(signedIn.find(res => res.status === 204)!, 'insco_admin');
  assert.equal((await b(`${api}/dashboard`, { cookie: device })).status, 200);
  assert.equal((await a(`${api}/passkeys/${key.id}`, { method: 'DELETE', cookie: password })).status, 204);
  assert.equal((await b(`${api}/dashboard`, { cookie: device })).status, 401);
  assert.equal((await b(`${api}/dashboard`, { cookie: password })).status, 200);
});

test('hosted RFQs and public announcements use the shared store without granting the Pages origin admin access', async t => {
  fakeDatabase(t, DATABASE, TOKEN);
  const config = env();
  const a = await worker(t, config);
  const b = await worker(t, config);
  const preflight = await a('/api/rfq', { method: 'OPTIONS', from: PAGES });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers['access-control-allow-origin'], PAGES);
  assert.equal(preflight.headers['access-control-allow-credentials'], undefined);
  const quote = await a('/api/rfq', { method: 'POST', from: PAGES,
    body: { companyName: 'QA Company', phone: '+20 100 000 0000', email: 'test@example.test' } });
  assert.equal(quote.status, 200);
  const reference = quote.json().reference;
  assert.equal((await b(`${api}/quotes/${reference}`, { from: PAGES })).status, 401);
  const session = await login(b);
  assert.equal((await b(`${api}/quotes/${reference}`, { cookie: session })).json().companyName, 'QA Company');
  const message = { ar: 'نص تجريبي', en: 'Test message' };
  assert.equal((await b(`${api}/announcement`, { method: 'PUT', cookie: session, body: { enabled: true, message } })).status, 200);
  const announcement = await a('/api/site/announcement', { from: PAGES });
  assert.equal(announcement.headers['access-control-allow-origin'], PAGES);
  assert.deepEqual(announcement.json(), { message });
});
