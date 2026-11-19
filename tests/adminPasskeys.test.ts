import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import express from 'express';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';
import { ADMIN_API } from '../src/admin/contract';
import { adminConfig, createAdminRouter } from '../server/admin/router';
import { AdminStore } from '../server/admin/store';
import { authenticator } from './helpers/passkeyAuthenticator';

const ORIGIN = 'https://admin.insco-example.test';
const PASSWORD = 'Test_ReallyLocal57!';
const CHALLENGE_COOKIE = 'insco_passkey_challenge';

async function fixture(t: TestContext, { persisted = false, origin = ORIGIN as string | null } = {}) {
  const directory = persisted ? mkdtempSync(join(tmpdir(), 'insco-passkey-test-')) : null;
  const file = directory ? join(directory, 'admin.sqlite') : ':memory:';
  const store = new AdminStore(file);
  let clock = Date.parse('2026-11-18T09:00:00Z');
  const app = express();
  const config = adminConfig({ ADMIN_PASSWORD: PASSWORD, ADMIN_ORIGIN: origin ?? undefined }, Boolean(origin?.startsWith('https://')));
  app.use(ADMIN_API, createAdminRouter({ store, config, now: () => clock, services: { tutorConfigured: false, rfqNotificationsConfigured: false } }));
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    store.close();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  function call(path: string, { method = 'GET', body, cookie, from }: { method?: string; body?: unknown; cookie?: string; from?: string } = {}) {
    return fetch(`${base}${ADMIN_API}${path}`, {
      method,
      headers: {
        ...(method !== 'GET' ? { Origin: from ?? origin ?? base } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async function login() {
    const response = await call('/login', { method: 'POST', body: { password: PASSWORD } });
    assert.equal(response.status, 204);
    return cookie(response, 'insco_admin');
  }
  return { call, login, file, advance: (ms: number) => { clock += ms; } };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;

function cookie(response: Response, name: string) {
  const value = response.headers.getSetCookie().find(item => item.startsWith(`${name}=`));
  assert.ok(value, `missing ${name} cookie`);
  return value.split(';', 1)[0];
}

async function registrationOptions(app: Fixture, session: string) {
  const response = await app.call('/passkeys/register/options', { method: 'POST', cookie: session, body: { label: 'هاتف المكتب' } });
  assert.equal(response.status, 200);
  return {
    options: await response.json() as PublicKeyCredentialCreationOptionsJSON,
    cookie: `${session}; ${cookie(response, CHALLENGE_COOKIE)}`,
    setCookie: response.headers.get('set-cookie')!,
  };
}

async function enroll(app: Fixture, session: string, device: ReturnType<typeof authenticator>) {
  const start = await registrationOptions(app, session);
  assert.equal(start.options.rp.id, new URL(ORIGIN).hostname);
  assert.equal(start.options.authenticatorSelection?.residentKey, 'required');
  assert.equal(start.options.authenticatorSelection?.userVerification, 'required');
  const saved = await app.call('/passkeys/register/verify', { method: 'POST', cookie: start.cookie, body: { response: device.registration(start.options) } });
  assert.equal(saved.status, 201, await (saved.status === 201 ? Promise.resolve('') : saved.text()));
  return start.options.user.id;
}

async function authenticationOptions(app: Fixture) {
  const response = await app.call('/passkeys/authenticate/options', { method: 'POST', body: {} });
  assert.equal(response.status, 200);
  const options = await response.json() as PublicKeyCredentialRequestOptionsJSON;
  assert.equal(options.userVerification, 'required');
  assert.ok(!options.allowCredentials?.length, 'no credential identifiers are sent to signed-out clients');
  return { options, cookie: cookie(response, CHALLENGE_COOKIE) };
}

test('an enrolled passkey persists, starts a protected session, and revocation invalidates that session', async t => {
  const app = await fixture(t, { persisted: true });
  assert.deepEqual(await app.call('/passkeys/status').then(res => res.json()), { available: false });
  assert.equal((await app.call('/passkeys')).status, 401);
  const passwordSession = await app.login();
  const device = authenticator(ORIGIN);
  const userHandle = await enroll(app, passwordSession, device);
  const reopened = new AdminStore(app.file);
  try {
    assert.equal(await reopened.passkeyUserHandle(ORIGIN), userHandle);
    assert.equal((await reopened.listPasskeys(ORIGIN))[0]?.label, 'هاتف المكتب');
    assert.equal(await reopened.passkey('https://other.example.test', device.id), undefined);
  } finally { reopened.close(); }
  assert.deepEqual(await app.call('/passkeys/status').then(res => res.json()), { available: true });

  const start = await authenticationOptions(app);
  const body = { response: device.assertion(start.options, userHandle) };
  const success = await app.call('/passkeys/authenticate/verify', { method: 'POST', body, cookie: start.cookie });
  assert.equal(success.status, 204, await (success.status === 204 ? Promise.resolve('') : success.text()));
  const session = cookie(success, 'insco_admin');
  const setCookie = success.headers.getSetCookie().find(value => value.startsWith('insco_admin='))!;
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.equal((await app.call('/dashboard', { cookie: session })).status, 200);
  const settings = await app.call('/passkeys', { cookie: session }).then(res => res.json());
  assert.equal(settings.canManage, false, 'passkey sessions cannot enroll or revoke other keys');
  assert.deepEqual(Object.keys(settings.items[0]).sort(), ['createdAt', 'id', 'label', 'lastUsedAt']);
  assert.ok(settings.items[0].lastUsedAt);
  assert.equal((await app.call('/passkeys/authenticate/verify', { method: 'POST', body, cookie: start.cookie })).status, 400);
  assert.equal((await app.call(`/passkeys/${device.id}`, { method: 'DELETE', cookie: session })).status, 403);
  assert.equal((await app.call(`/passkeys/${device.id}`, { method: 'DELETE', cookie: passwordSession })).status, 204);
  assert.equal((await app.call('/dashboard', { cookie: session })).status, 401);
  assert.equal((await app.call('/dashboard', { cookie: passwordSession })).status, 200);
  assert.deepEqual(await app.call('/passkeys/status').then(res => res.json()), { available: false });
  assert.equal((await app.call('/passkeys/authenticate/options', { method: 'POST', body: {} })).status, 409);
});

test('registration is limited to the originating recent password session and consumes expired challenges', async t => {
  const app = await fixture(t);
  const path = '/passkeys/register/options';
  assert.equal((await app.call(path, { method: 'POST', body: { label: 'Desk' } })).status, 401);
  const session = await app.login();
  assert.equal((await app.call(path, { method: 'POST', body: { label: 'Desk' }, cookie: session, from: 'https://other.example.test' })).status, 403);
  const device = authenticator(ORIGIN);
  const first = await registrationOptions(app, session);
  assert.match(first.setCookie, /Max-Age=120/);
  assert.match(first.setCookie, /HttpOnly/i);
  assert.match(first.setCookie, /Secure/i);
  assert.match(first.setCookie, /SameSite=Strict/i);
  const another = await app.login();
  const mixedCookies = `${another}; ${first.cookie.split('; ', 2)[1]}`;
  assert.equal((await app.call('/passkeys/register/verify', { method: 'POST', cookie: mixedCookies, body: { response: device.registration(first.options) } })).status, 400);
  const second = await registrationOptions(app, session);
  assert.notEqual(first.options.challenge, second.options.challenge);
  app.advance(120_001);
  const expired = await app.call('/passkeys/register/verify', { method: 'POST', cookie: second.cookie, body: { response: device.registration(second.options) } });
  assert.deepEqual(await expired.json(), { error: 'passkey_challenge_expired' });
  app.advance(8 * 60_000);
  const stale = await app.call(path, { method: 'POST', cookie: session, body: { label: 'Desk' } });
  assert.equal(stale.status, 403);
  assert.deepEqual(await stale.json(), { error: 'passkey_password_required' });
  assert.equal((await app.call('/dashboard', { cookie: session })).status, 200, 'only the management grant expired');
});

test('both ceremonies require device verification, the exact origin, the matching account, and a fresh browser challenge', async t => {
  const app = await fixture(t);
  const session = await app.login();
  const device = authenticator(ORIGIN);
  const register = await registrationOptions(app, session);
  const notVerified = await app.call('/passkeys/register/verify', { method: 'POST', cookie: register.cookie, body: { response: device.registration(register.options, false) } });
  assert.equal(notVerified.status, 400);
  assert.deepEqual(await notVerified.json(), { error: 'passkey_registration_failed' });
  const userHandle = await enroll(app, session, device);
  const auth = '/passkeys/authenticate/verify';
  for (const attempt of [
    { userHandle, verified: false, origin: ORIGIN },
    { userHandle, verified: true, origin: 'https://other.example.test' },
    { userHandle: randomBytes(32).toString('base64url'), verified: true, origin: ORIGIN },
  ]) {
    const start = await authenticationOptions(app);
    const body = { response: device.assertion(start.options, attempt.userHandle, attempt) };
    const denied = await app.call(auth, { method: 'POST', body, cookie: start.cookie });
    assert.equal(denied.status, 401);
    assert.ok(!denied.headers.getSetCookie().some(value => value.startsWith('insco_admin=')));
    assert.deepEqual(await denied.json(), { error: 'passkey_verification_failed' });
  }
  const valid = await authenticationOptions(app);
  const body = { response: device.assertion(valid.options, userHandle) };
  assert.equal((await app.call(auth, { method: 'POST', body })).status, 400, 'the challenge cookie is required');
  const newer = await authenticationOptions(app);
  assert.equal((await app.call(auth, { method: 'POST', body, cookie: newer.cookie })).status, 401, 'the signature is bound to its own challenge');
  assert.equal((await app.call(auth, { method: 'POST', body, cookie: valid.cookie })).status, 204);
});

test('passkey start requests are bounded independently of password sign-in', async t => {
  const app = await fixture(t);
  const session = await app.login();
  await enroll(app, session, authenticator(ORIGIN));
  for (let count = 0; count < 8; count++) await authenticationOptions(app);
  const limited = await app.call('/passkeys/authenticate/options', { method: 'POST', body: {} });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '120');
  assert.ok(await app.login(), 'password recovery remains available');
  app.advance(120_001);
  await authenticationOptions(app);
});

test('passkeys are disabled without an explicit secure site while the local password still works', async t => {
  const app = await fixture(t, { origin: null });
  const session = await app.login();
  assert.deepEqual(await app.call('/passkeys', { cookie: session }).then(res => res.json()), { enabled: false, canManage: false, items: [] });
  assert.equal((await app.call('/passkeys/register/options', { method: 'POST', body: { label: 'Desk' }, cookie: session })).status, 503);
  assert.equal((await app.call('/dashboard', { cookie: session })).status, 200);
});
