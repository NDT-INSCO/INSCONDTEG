import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { ADMIN_API, ANNOUNCEMENT_API } from '../src/admin/contract';
import { handleRfqRequest } from '../src/rfq/gateway';
import { adminConfig, createAdminRouter, publicAnnouncement, publicSiteCors } from '../server/admin/router';
import { AdminStore, adminDatabasePath, deliverToInbox } from '../server/admin/store';
import type { FactoryDrafter } from '../server/admin/factory';
import './helpers/adminFactoryCases';

const PIN = '054132698710'; // An isolated test fixture, never an application default.
const ORIGIN = 'https://insco-test.example';
const PAGES = 'https://public-test.example';
const HOURS = 3_600_000;
const sample = {
  companyName: 'شركة اختبار إنسكو',
  contactName: 'Name',
  phone: '+20 100 000 0000',
  email: 'qa@example.test',
  serviceType: 'pwht',
  description: 'Test request',
  pageUrl: 'https://example.test/private',
};

async function fixture(t: TestContext, { enabled = true, persisted = false, password, draftFactory }: {
  enabled?: boolean; persisted?: boolean; password?: string; draftFactory?: FactoryDrafter;
} = {}) {
  let store: AdminStore | null = null;
  let clock = Date.parse('2026-11-18T08:00:00Z');
  let file = ':memory:';
  if (persisted) {
    const dir = mkdtempSync(join(tmpdir(), 'insco-admin-test-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    file = adminDatabasePath(join(dir, 'private'), []);
  }
  if (enabled) store = new AdminStore(file);
  const app = express();
  const config = adminConfig(enabled ? { ADMIN_ORIGIN: ORIGIN, ADMIN_PASSWORD: password, ADMIN_PIN: PIN } : {}, true);
  app.use(ADMIN_API, createAdminRouter({ config, store, draftFactory, services: { tutorConfigured: false, rfqNotificationsConfigured: false }, now: () => clock }));
  app.get(ANNOUNCEMENT_API, publicSiteCors(PAGES), publicAnnouncement(store));
  app.options('/api/rfq', publicSiteCors(PAGES));
  app.post('/api/rfq', publicSiteCors(PAGES), express.json(), async (req, res) => {
    const result = await handleRfqRequest(req.body, { deliver: store ? deliverToInbox(store, null) : null, now: () => new Date(clock) }, '192.0.2.1');
    res.status(result.status).json(result.body);
  });
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); store?.close(); });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  async function call(path: string, options: { method?: string; body?: unknown; cookie?: string; origin?: string } = {}) {
    const { method = 'GET', body, cookie, origin } = options;
    return fetch(`${base}${path}`, {
      method,
      headers: {
        ...(method !== 'GET' || origin ? { Origin: origin ?? ORIGIN } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async function login(value = password ?? PIN) {
    const result = await call(`${ADMIN_API}/login`, { method: 'POST', body: { password: value } });
    assert.equal(result.status, 204);
    const setCookie = result.headers.get('set-cookie')!;
    return { cookie: setCookie.split(';')[0], setCookie };
  }
  return { call, login, store, file, advance: (ms: number) => { clock += ms; } };
}

test('production requires an HTTPS origin and a valid server-only credential; no config fails closed', async t => {
  assert.equal(adminConfig({ ADMIN_PIN: PIN }, true), null);
  assert.equal(adminConfig({ ADMIN_PIN: PIN, ADMIN_ORIGIN: 'http://insco-test.example' }, true), null);
  assert.equal(adminConfig({ ADMIN_PIN: '1234', ADMIN_ORIGIN: ORIGIN }, true), null);
  assert.equal(adminConfig({ ADMIN_PASSWORD: 'short', ADMIN_PIN: PIN, ADMIN_ORIGIN: ORIGIN }, true), null);
  const { call } = await fixture(t, { enabled: false });
  const response = await call(`${ADMIN_API}/dashboard`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { error: 'not_configured' });
});

test('private reads and writes need a real session; the cookie is protected, logout revokes it', async t => {
  const { call, login } = await fixture(t);
  assert.equal((await call(`${ADMIN_API}/dashboard`, { cookie: 'insco_admin=untrusted' })).status, 401);
  assert.equal((await call(`${ADMIN_API}/quotes`)).status, 401);
  assert.equal((await call(`${ADMIN_API}/quotes/TEST`, { method: 'PATCH', body: { status: 'closed' } })).status, 401);
  assert.equal((await call(`${ADMIN_API}/announcement`, { method: 'PUT', body: {} })).status, 401);
  assert.equal((await call(`${ADMIN_API}/login`, { method: 'POST', origin: PAGES, body: { pin: PIN } })).status, 403);
  const arabicPin = [...PIN].map(digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]).join('');
  const { cookie, setCookie } = await login(arabicPin);
  assert.match(setCookie, /(?:^|; )HttpOnly(?:;|$)/i);
  assert.match(setCookie, /(?:^|; )Secure(?:;|$)/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\/api\/admin/i);
  assert.ok(!setCookie.includes(PIN));
  const dashboard = await call(`${ADMIN_API}/dashboard`, { cookie });
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.headers.get('access-control-allow-origin'), null);
  assert.equal(dashboard.headers.get('cache-control'), 'no-store');
  assert.equal((await call(`${ADMIN_API}/logout`, { method: 'POST', origin: PAGES, cookie })).status, 403);
  assert.equal((await call(`${ADMIN_API}/logout`, { method: 'POST', cookie })).status, 204);
  assert.equal((await call(`${ADMIN_API}/dashboard`, { cookie })).status, 401);
});

test('a configured password accepts symbols and matches literally instead of allowing the old PIN', async t => {
  const password = '  Ops_Example42!  ';
  const { call, login } = await fixture(t, { password });
  for (const candidate of [PIN, password.toLowerCase(), password.trim(), password.replace('_', '-')]) {
    const denied = await call(`${ADMIN_API}/login`, { method: 'POST', body: { password: candidate } });
    assert.equal(denied.status, 401);
    assert.deepEqual(await denied.json(), { error: 'invalid_credentials' });
    assert.equal(denied.headers.has('set-cookie'), false);
  }
  const { cookie } = await login();
  assert.equal((await call(`${ADMIN_API}/dashboard`, { cookie })).status, 200);
});

test('wrong credentials are throttled and sessions expire on the server', async t => {
  const { call, login, advance } = await fixture(t);
  for (let attempt = 0; attempt < 5; attempt++) {
    const fail = await call(`${ADMIN_API}/login`, { method: 'POST', body: { pin: `${PIN.slice(0, -1)}9` } });
    assert.equal(fail.status, 401);
    assert.equal(fail.headers.has('set-cookie'), false);
  }
  const blocked = await call(`${ADMIN_API}/login`, { method: 'POST', body: { pin: PIN } });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('retry-after'), '900');
  advance(16 * 60_000);
  const { cookie } = await login();
  advance(4 * HOURS + 1);
  assert.equal((await call(`${ADMIN_API}/dashboard`, { cookie })).status, 401);
});

test('the RFQ inbox receives real requests, computes follow-up, and persists status across restarts', async t => {
  const { call, login, file, advance } = await fixture(t, { persisted: true });
  const preflight = await call('/api/rfq', { method: 'OPTIONS', origin: PAGES });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), PAGES);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null);
  assert.equal((await call('/api/rfq', { method: 'POST', body: {} })).status, 400);
  const created = await call('/api/rfq', { method: 'POST', origin: PAGES, body: sample });
  assert.equal(created.status, 200);
  assert.equal(created.headers.get('access-control-allow-origin'), PAGES);
  const { reference } = await created.json();
  const path = `${ADMIN_API}/quotes/${reference}`;
  assert.equal((await call(path)).status, 401);
  advance(49 * HOURS);
  const { cookie } = await login();
  assert.equal((await call(`${ADMIN_API}/quotes?status=in_progress`, { cookie }).then(res => res.json())).total, 0);
  const result = await call(`${ADMIN_API}/quotes?q=${encodeURIComponent('إنسكو')}`, { cookie }).then(res => res.json());
  assert.equal(result.total, 1);
  assert.equal(result.items[0].reference, reference);
  assert.equal(result.items[0].email, undefined, 'list does not include private contact fields');
  const detail = await call(path, { cookie }).then(res => res.json());
  assert.equal(detail.email, sample.email);
  assert.equal(detail.remoteAddress, undefined);
  assert.equal(detail.pageUrl, undefined);
  const overview = await call(`${ADMIN_API}/dashboard`, { cookie }).then(res => res.json());
  assert.equal(overview.totals.overdue, 1);
  assert.equal(overview.activity.reduce((sum: number, day: { count: number }) => sum + day.count, 0), 1);
  assert.equal((await call(path, { method: 'PATCH', cookie, origin: PAGES, body: { status: 'closed' } })).status, 403);
  assert.equal((await call(path, { method: 'PATCH', cookie, body: { status: 'bogus' } })).status, 400);
  const changed = await call(path, { method: 'PATCH', cookie, body: { status: 'closed' } });
  assert.equal(changed.status, 200);
  assert.equal((await changed.json()).status, 'closed');
  const reopened = new AdminStore(file);
  try {
    assert.equal((await reopened.quote(reference))?.status, 'closed');
    assert.equal((await reopened.overview(Date.parse('2026-11-21T00:00:00Z'))).totals.overdue, 0);
  } finally {
    reopened.close();
  }
});

test('an announcement can be published and hidden; only active text reaches visitors', async t => {
  const { call, login } = await fixture(t);
  const { cookie } = await login();
  const write = (body: unknown) => call(`${ADMIN_API}/announcement`, { method: 'PUT', cookie, body });
  const read = () => call(ANNOUNCEMENT_API, { origin: PAGES });
  const message = { ar: 'مرحبًا بكم في إنسكو', en: 'Welcome to INSCO' };
  assert.equal((await write({ enabled: true, message: { ...message, en: '' } })).status, 400);
  assert.equal((await write({ enabled: true, message: { ...message, en: 'a'.repeat(241) } })).status, 400);
  assert.equal((await write({ enabled: true, message })).status, 200);
  const published = await read();
  assert.equal(published.headers.get('access-control-allow-origin'), PAGES);
  assert.deepEqual(await published.json(), { message });
  assert.equal((await call(ANNOUNCEMENT_API, { origin: 'https://other.example' })).headers.get('access-control-allow-origin'), null);
  assert.equal((await write({ enabled: false, message })).status, 200);
  assert.deepEqual(await read().then(res => res.json()), { message: null });
  const privateOverview = await call(`${ADMIN_API}/dashboard`, { cookie }).then(res => res.json());
  assert.deepEqual(privateOverview.announcement.message, message);
});

test('private storage is rejected in the static document root or a symlink into it', t => {
  const dir = mkdtempSync(join(tmpdir(), 'insco-admin-path-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const publicDir = join(dir, 'public');
  mkdirSync(publicDir);
  symlinkSync(publicDir, join(dir, 'linked'));
  assert.throws(() => adminDatabasePath(join(publicDir, 'admin'), [publicDir]), /public site directory/);
  assert.throws(() => adminDatabasePath(join(dir, 'linked'), [publicDir]), /public site directory/);
});

const factoryPath = `${ADMIN_API}/factory/draft`;
const factoryInput = {
  task: 'inbox', output: 'bot', trigger: 'daily', locale: 'en', language: 'Python', brief: 'Prepare an internal staff review.',
  cells: ['input', 'rule', 'draft'], includeSnapshot: false,
};
const factoryDraft = { title: 'Internal follow-up', summary: 'A draft for a person to review.', steps: [{ kind: 'input', label: 'Read counts' }], code: null, checks: ['Use a synthetic sample'] };

test('factory AI is private, same-origin, and only gets an optional aggregate snapshot', async t => {
  const attempts: Parameters<FactoryDrafter>[] = [];
  const { call, login, advance, store } = await fixture(t, { draftFactory: async (...args) => { attempts.push(args); return factoryDraft; } });
  const readContext = t.mock.method(store!, 'factoryContext');
  assert.equal((await call('/api/rfq', { method: 'POST', origin: PAGES, body: sample })).status, 200);
  await call(factoryPath, { method: 'POST', body: factoryInput }).then(async response => {
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'signed_out' });
  });
  advance(49 * HOURS);
  const { cookie } = await login();
  assert.equal((await call(factoryPath, { method: 'POST', origin: PAGES, cookie, body: factoryInput })).status, 403);
  assert.equal((await call(factoryPath, { method: 'POST', cookie, body: { ...factoryInput, cells: ['execute'] } })).status, 400);
  assert.equal(attempts.length, 0);
  const result = await call(factoryPath, { method: 'POST', cookie, body: { ...factoryInput, snapshot: { email: sample.email } } });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.headers.has('Access-Control-Allow-Origin'), false);
  assert.deepEqual(await result.json(), factoryDraft);
  assert.deepEqual(attempts[0][0], factoryInput);
  assert.equal(attempts[0][1], null);
  assert.equal(readContext.mock.callCount(), 0);
  await store!.saveAnnouncement({ enabled: true, message: { ar: 'أخبار تجريبية', en: 'Test news' } }, '2026-11-20T08:00:00.000Z');
  assert.equal((await call(factoryPath, { method: 'POST', cookie, body: { ...factoryInput, includeSnapshot: true } })).status, 200);
  assert.equal(readContext.mock.callCount(), 1);
  assert.deepEqual(attempts[1][1], { capturedAt: '2026-11-20T09:00:00.000Z', newRequests: 1, inProgress: 0, overdue: 1, announcementEnabled: true });
  const dash = await call(`${ADMIN_API}/dashboard`, { cookie }).then(res => res.json());
  assert.equal(dash.services.factoryAiConfigured, true);
  assert.equal(dash.totals.new, 1, 'a draft does not change the live inbox');
  await call(`${ADMIN_API}/logout`, { method: 'POST', cookie });
  assert.equal((await call(factoryPath, { method: 'POST', cookie, body: factoryInput })).status, 401);
});

test('factory model failures return bounded errors and cannot bypass the generation budget', async t => {
  let generations = 0;
  const { call, login } = await fixture(t, { draftFactory: async () => {
    generations++;
    if (generations === 1) throw new Error('do not expose upstream diagnostics');
    return { ...factoryDraft, steps: [{ kind: 'unsupported_action', label: 'Wrong shape' }] };
  } });
  const { cookie } = await login();
  const draft = () => call(factoryPath, { method: 'POST', cookie, body: factoryInput });
  const out = await draft();
  assert.equal(out.status, 502);
  assert.deepEqual(await out.json(), { error: 'factory_unavailable' });
  for (let i = 0; i < 3; i++) {
    const invalid = await draft();
    assert.equal(invalid.status, 502);
    assert.deepEqual(await invalid.json(), { error: 'factory_invalid_draft' });
  }
  const limited = await draft();
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('Retry-After')) > 0);
  assert.equal(generations, 4);
});

test('no factory model key never makes drafts look available', async t => {
  const { call, login } = await fixture(t);
  const { cookie } = await login();
  const res = await call(factoryPath, { method: 'POST', cookie, body: factoryInput });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: 'factory_not_configured' });
});
