import React from 'react';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { adminClient, AdminApiError } from '../src/admin/client';
import type { DashboardData } from '../src/admin/contract';
import { adminPortalLink, externalAdminLink, readPublicAnnouncement } from '../src/admin/public';

const HOSTED = 'https://admin.insco.test/';
const PAGES = 'https://ndt-insco.github.io/INSCONDTEG/';
const UNLINKED_PAGES = 'https://fork-of-insco.github.io/INSCONDTEG/';
const VERCEL_ADMIN = 'https://inscondteg.vercel.app/#admin';
const dom = new JSDOM('<!doctype html><html lang="ar"><body></body></html>', {
  url: HOSTED, pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement, CustomEvent: dom.window.CustomEvent, Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const { App } = await import('../src/App');
const AdminPortal = (await import('../src/components/admin/AdminPortal')).default;
const { act, cleanup, fireEvent, render, waitFor, within } = await import('@testing-library/react');
const realFetch = globalThis.fetch;
const testPassword = 'Ops_Example42!';
function adminJson(data: unknown, status = 200) { return Response.json(data, { status }); }
const signedOut = () => adminJson({ error: 'signed_out' }, 401);
const noContent = () => new Response(null, { status: 204 });
const dashboard = (serverTime = Date.now()): DashboardData => ({
  sessionExpiresAt: serverTime + 60_000, updatedAt: new Date(serverTime).toISOString(),
  totals: { total: 0, new: 0, in_progress: 0, closed: 0, overdue: 0 }, activity: [], recent: [],
  services: { tutorConfigured: false, rfqNotificationsConfigured: false },
  announcement: { message: { ar: '', en: '' }, enabled: false, updatedAt: null },
});
const renderPortal = () => render(<AdminPortal language="en" onBack={() => {}} onToggleLanguage={() => {}} />);
async function submitPassword(ui: ReturnType<typeof render>) {
  const field = await ui.findByLabelText('Admin password', { exact: true }) as HTMLInputElement;
  fireEvent.change(field, { target: { value: testPassword } });
  fireEvent.click(ui.getByRole('button', { name: 'Sign in', exact: true }));
  return field;
}

beforeEach(() => {
  dom.reconfigure({ url: HOSTED });
  localStorage.clear();
  localStorage.setItem('insco_portal_choice_v1', 'company');
  globalThis.fetch = async () => signedOut();
});
afterEach(() => { cleanup(); globalThis.fetch = realFetch; });

test('the footer key opens a stand-alone password page, and Back returns to the site', async () => {
  const ui = render(<App />);
  const footer = ui.container.querySelector('footer')!;
  const key = within(footer).getByRole('link', { name: 'بوابة الإدارة' });
  assert.equal(key.getAttribute('href'), '#admin');
  fireEvent.click(key);
  assert.equal(window.location.hash, '#admin');
  const field = await ui.findByLabelText('كلمة المرور', { exact: true });
  assert.equal(field.getAttribute('type'), 'password');
  assert.equal(field.getAttribute('autocomplete'), 'current-password');
  assert.notEqual(field.getAttribute('inputmode'), 'numeric');
  assert.equal(ui.queryByRole('button', { name: 'اطلب عرض سعر' }), null);
  assert.equal(ui.queryByRole('heading', { name: 'لوحة الإدارة' }), null);
  fireEvent.click(ui.getByRole('button', { name: 'العودة للموقع' }));
  await waitFor(() => assert.ok(ui.getByRole('link', { name: 'بوابة الإدارة' })));
  assert.equal(window.location.hash, '');
});

test('a direct footer link shows the only admin key beside the prominent English company name', () => {
  localStorage.setItem('insco_language_v1', 'en');
  localStorage.removeItem('insco_portal_choice_v1');
  dom.window.history.replaceState(null, '', '/#company-footer');
  const ui = render(<App />);
  const footer = within(ui.container.querySelector('#company-footer')!);
  const companyName = footer.getByText('International for Services & Constructions Company - INSCO');
  const key = footer.getByRole('link', { name: 'Admin portal' });
  assert.equal(companyName.nextElementSibling, key);
  assert.equal(ui.queryByRole('dialog'), null, 'the first-visit chooser must not cover the footer');
});

test('the official Pages footer key opens the hosted admin in a separate, isolated tab', () => {
  dom.reconfigure({ url: `${PAGES}#company-footer` });
  const ui = render(<App />);
  const footer = within(ui.container.querySelector('#company-footer')!);
  const key = footer.getByRole('link', { name: 'بوابة الإدارة' });
  assert.equal(key.getAttribute('href'), VERCEL_ADMIN);
  assert.equal(key.getAttribute('target'), '_blank');
  assert.equal(key.getAttribute('rel'), 'noopener noreferrer');
});

test('a saved #admin bookmark offers the hosted portal, not a form or cross-origin API request', async () => {
  dom.reconfigure({ url: `${PAGES}#admin` });
  localStorage.removeItem('insco_portal_choice_v1');
  const requests: string[] = [];
  globalThis.fetch = async input => {
    requests.push(String(input));
    return signedOut();
  };
  const ui = render(<App />);
  const link = await ui.findByRole('link', { name: 'فتح بوابة الإدارة' });
  assert.equal(link.getAttribute('href'), VERCEL_ADMIN);
  assert.equal(link.getAttribute('target'), '_blank');
  assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
  assert.equal(ui.queryByLabelText('كلمة المرور', { exact: true }), null);
  assert.equal(ui.queryByRole('button', { name: 'مصنع البرمجيات' }), null);
  const signal = new AbortController().signal;
  assert.equal(await readPublicAnnouncement(signal), null);
  await assert.rejects(adminClient.factoryDraft({ task: 'inbox', output: 'block', trigger: 'manual', locale: 'ar', language: 'Python',
    brief: 'مسودة للمراجعة', cells: ['input', 'draft'], includeSnapshot: false }, signal), (error: unknown) => error instanceof AdminApiError && error.code === 'not_configured');
  assert.deepEqual(requests, []);
});

test('an unlinked Pages fork shows why sign-in is unavailable without trying the admin API', async () => {
  dom.reconfigure({ url: `${UNLINKED_PAGES}#admin` });
  localStorage.removeItem('insco_portal_choice_v1');
  let adminCalls = 0;
  globalThis.fetch = async input => {
    if (String(input).startsWith('/api/admin/')) adminCalls++;
    return signedOut();
  };
  const ui = render(<App />);
  await ui.findByText('بوابة الإدارة غير مهيّأة');
  assert.ok(ui.getByText(/الموقع العام لا يستقبل كلمات المرور/));
  assert.equal(ui.queryByRole('button', { name: 'إعادة التحقق' }), null);
  assert.equal(ui.queryByLabelText('كلمة المرور', { exact: true }), null);
  assert.equal(ui.queryByRole('heading', { name: 'لوحة الإدارة' }), null);
  assert.equal(ui.queryByRole('dialog'), null);
  assert.equal(adminCalls, 0);
});

test('login verifies against the API, loads the real summary and can publish and sign out', async () => {
  localStorage.setItem('insco_language_v1', 'en');
  dom.window.history.replaceState(null, '', '/#admin');
  let session = false;
  let loginCalls = 0;
  const data = dashboard();
  globalThis.fetch = async (input, init) => {
    assert.equal(init?.credentials, 'same-origin');
    switch (input) {
      case '/api/admin/login': {
        loginCalls++;
        const { password } = JSON.parse(String(init?.body));
        if (password !== testPassword) return adminJson({ error: 'invalid_credentials' }, 401);
        session = true;
        return new Response(null, { status: 204 });
      }
      case '/api/admin/dashboard': return session ? adminJson(data) : signedOut();
      case '/api/admin/announcement': {
        if (!session) return signedOut();
        assert.equal(init?.method, 'PUT');
        const input = JSON.parse(String(init?.body));
        assert.deepEqual(input, { enabled: true, message: { ar: 'إعلان تجريبي', en: 'A test announcement' } });
        data.announcement = { ...input, updatedAt: new Date().toISOString() };
        return adminJson(data.announcement);
      }
      case '/api/admin/logout':
        session = false;
        return new Response(null, { status: 204 });
      default: throw new Error(`Unexpected API: ${input}`);
    }
  };
  const ui = render(<App />);
  const passwordInput = await ui.findByLabelText('Admin password', { exact: true });
  fireEvent.click(ui.getByRole('button', { name: 'Show password' }));
  assert.equal(passwordInput.getAttribute('type'), 'text');
  fireEvent.change(passwordInput, { target: { value: testPassword.toLowerCase() } });
  fireEvent.click(ui.getByRole('button', { name: 'Sign in' }));
  await ui.findByText('The password is incorrect.');
  assert.equal(ui.queryByRole('heading', { name: 'Website dashboard' }), null);
  fireEvent.change(passwordInput, { target: { value: testPassword } });
  fireEvent.click(ui.getByRole('button', { name: 'Sign in' }));
  await ui.findByRole('heading', { name: 'Website dashboard' });
  assert.equal(loginCalls, 2);
  assert.ok(!Object.values(localStorage).includes(testPassword));
  assert.ok(ui.getByText('No requests yet'));

  fireEvent.click(ui.getByRole('button', { name: 'Announcements', exact: true }));
  fireEvent.change(ui.getByLabelText(/Arabic announcement/), { target: { value: 'إعلان تجريبي' } });
  fireEvent.change(ui.getByLabelText(/English announcement/), { target: { value: 'A test announcement' } });
  fireEvent.click(ui.getByRole('switch', { name: /Show announcement/ }));
  fireEvent.click(ui.getByRole('button', { name: 'Save announcement' }));
  await ui.findByText('The announcement is now published.');
  fireEvent.click(ui.getByRole('button', { name: 'Sign out' }));
  await ui.findByText('You have signed out.');
  assert.equal(ui.queryByRole('heading', { name: 'Website dashboard' }), null);
  assert.equal(session, false);
});

test('a compatible device can choose the Arabic passkey button and still use the password after a passkey error', async () => {
  const secure = Object.getOwnPropertyDescriptor(dom.window, 'isSecureContext');
  const credential = Object.getOwnPropertyDescriptor(globalThis, 'PublicKeyCredential');
  Object.defineProperty(dom.window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(globalThis, 'PublicKeyCredential', { value: class {}, configurable: true });
  try {
    dom.window.history.replaceState(null, '', '/#admin');
    globalThis.fetch = async (input, init) => {
      switch (input) {
        case '/api/admin/dashboard': return signedOut();
        case '/api/admin/passkeys/status': return adminJson({ available: true });
        case '/api/admin/passkeys/authenticate/options':
          assert.equal(init?.method, 'POST');
          assert.equal(init?.credentials, 'same-origin');
          return adminJson({ error: 'no_passkeys' }, 409);
        default: throw new Error(`Unexpected API: ${input}`);
      }
    };
    const ui = render(<App />);
    const button = await ui.findByRole('button', { name: 'الدخول بالبصمة أو Face ID' });
    const password = ui.getByLabelText('كلمة المرور', { exact: true }) as HTMLInputElement;
    fireEvent.click(button);
    await ui.findByText('لا يوجد مفتاح مرور مسجّل. ادخل بكلمة المرور لإضافة مفتاح.');
    assert.equal(password.type, 'password');
    assert.equal(password.readOnly, false);
    assert.equal((ui.getByRole('button', { name: 'تسجيل الدخول', exact: true }) as HTMLButtonElement).disabled, false);
  } finally {
    if (secure) Object.defineProperty(dom.window, 'isSecureContext', secure);
    else Reflect.deleteProperty(dom.window, 'isSecureContext');
    if (credential) Object.defineProperty(globalThis, 'PublicKeyCredential', credential);
    else Reflect.deleteProperty(globalThis, 'PublicKeyCredential');
  }
});

test('the built-in admin destination is scoped to the official Pages path and supports an explicit override', () => {
  const official = new URL(PAGES);
  assert.equal(adminPortalLink('', official), VERCEL_ADMIN);
  assert.equal(adminPortalLink('', new URL('/INSCONDTEG', official)), VERCEL_ADMIN);
  for (const other of [UNLINKED_PAGES, HOSTED, VERCEL_ADMIN, 'https://ndt-insco.github.io/INSCONDTEG-test/']) {
    assert.equal(adminPortalLink('', new URL(other)), null, other);
  }
  assert.equal(adminPortalLink('https://approved.example/', official), 'https://approved.example/#admin');
  assert.equal(adminPortalLink('off', official), null);
  assert.equal(adminPortalLink('https://untrusted.github.io/', official), null);
});

test('a Pages footer only accepts an external HTTPS admin URL and gives it the correct hash', () => {
  assert.equal(externalAdminLink('https://admin.example/site/#old'), 'https://admin.example/site/#admin');
  assert.equal(externalAdminLink('https://user:password@admin.example/'), null);
  assert.equal(externalAdminLink('http://admin.example/'), null);
  assert.equal(externalAdminLink('https://admin.example/?password=demo'), null);
  assert.equal(externalAdminLink('https://other.github.io./site/'), null);
  assert.equal(externalAdminLink(`${HOSTED}other/path`), null);
});

test('a transient protected read failure after authentication is retryable without resending credentials', async () => {
  let loginCalls = 0;
  let unavailable = 2;
  globalThis.fetch = async (input, init) => {
    if (input === '/api/admin/login') {
      assert.equal(init?.redirect, 'error');
      assert.deepEqual(JSON.parse(String(init?.body)), { password: testPassword });
      loginCalls++;
      return noContent();
    }
    assert.equal(input, '/api/admin/dashboard');
    if (!loginCalls) return signedOut();
    return unavailable-- > 0 ? adminJson({ error: 'storage_error' }, 503) : adminJson(dashboard());
  };
  const ui = renderPortal();
  await submitPassword(ui);
  await ui.findByText('The admin database is unavailable. Try again shortly.');
  assert.equal(ui.queryByLabelText('Admin password', { exact: true }), null);
  assert.equal(ui.queryByRole('heading', { name: 'Website dashboard' }), null);
  for (let count = 0; count < 2; count++) {
    fireEvent.click(await ui.findByRole('button', { name: 'Check session again' }));
  }
  await ui.findByRole('heading', { name: 'Website dashboard' });
  assert.equal(loginCalls, 1);
});

test('a successful login response without a recognised session never opens the dashboard', async () => {
  globalThis.fetch = async input => input === '/api/admin/login' ? noContent() : signedOut();
  const ui = renderPortal();
  const field = await submitPassword(ui);
  await ui.findByText(/The server did not recognise your session/);
  assert.equal(field.value, '');
  assert.equal(ui.queryByRole('heading', { name: 'Website dashboard' }), null);
});

test('a fallback page or malformed admin payload cannot be mistaken for an authenticated dashboard', async () => {
  for (const reply of [new Response('<html>SPA fallback</html>'), noContent(), adminJson({ healthy: true }), adminJson({ error: 'signed_out' }, 503)]) {
    globalThis.fetch = async () => reply;
    const ui = renderPortal();
    await ui.findByText(/did not return a valid admin response/);
    assert.equal(ui.queryByRole('heading', { name: 'Website dashboard' }), null);
    assert.equal(ui.queryByLabelText('Admin password', { exact: true }), null);
    ui.unmount();
  }
});

test('a fast device clock does not expire a valid session on the client', async () => {
  const data = dashboard(Date.now() - 6 * 60 * 60_000);
  globalThis.fetch = async () => adminJson(data);
  const ui = renderPortal();
  await ui.findByRole('heading', { name: 'Website dashboard' });
  // Let any incorrectly scheduled zero-delay expiry run.
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.equal(ui.queryByText('Your session ended. Sign in again.'), null);
  assert.ok(ui.getByRole('heading', { name: 'Website dashboard' }));
});

test('an in-flight sign-in is sent only once and cancelled when leaving the portal', async () => {
  let pending: AbortSignal | null | undefined;
  let loginCalls = 0;
  globalThis.fetch = async (input, init) => {
    if (input === '/api/admin/dashboard') return signedOut();
    assert.equal(input, '/api/admin/login');
    loginCalls++;
    pending = init?.signal;
    return new Promise((_, reject) => pending?.addEventListener('abort', () => reject(pending?.reason), { once: true }));
  };
  const ui = renderPortal();
  const field = await submitPassword(ui);
  fireEvent.submit(field.form!);
  assert.equal(loginCalls, 1);
  assert.equal(field.value, '');
  ui.unmount();
  assert.equal(pending?.aborted, true);
});

test('the factory is signed-in only, rehearses and drafts locally, and keeps work only for the session', async () => {
  let session = false;
  const calls: string[] = [];
  globalThis.fetch = async input => {
    const route = String(input);
    calls.push(route);
    if (route === '/api/admin/dashboard') return session ? adminJson(dashboard()) : signedOut();
    if (route === '/api/admin/login') { session = true; return noContent(); }
    if (route === '/api/admin/logout') { session = false; return noContent(); }
    throw new Error(`Unexpected API: ${route}`);
  };
  const ui = renderPortal();
  await ui.findByLabelText('Admin password');
  assert.equal(ui.queryByRole('button', { name: 'Software Factory' }), null);
  await submitPassword(ui);
  fireEvent.click(await ui.findByRole('button', { name: 'Software Factory' }));
  await ui.findByRole('heading', { name: 'Scenario board' });
  assert.equal((ui.getByRole('button', { name: 'Draft with AI' }) as HTMLButtonElement).disabled, true);
  fireEvent.click(ui.getByRole('button', { name: 'Neural cell' }));
  fireEvent.click(ui.getByRole('button', { name: 'Rehearse steps' }));
  assert.ok(ui.getByText(/Follow-up suggested · 71%/));
  assert.ok(ui.getByText('Waiting for human review'));
  fireEvent.change(ui.getByLabelText('Programming language'), { target: { value: 'Python' } });
  fireEvent.click(ui.getByRole('button', { name: 'Build from template' }));
  assert.match(ui.getByLabelText('Code draft').textContent!, /def neuron/);
  assert.equal((ui.getByRole('button', { name: 'Download draft JSON' }) as HTMLButtonElement).disabled, false);
  fireEvent.change(ui.getByLabelText('Task objective'), { target: { value: 'Updated objective' } });
  assert.equal((ui.getByRole('button', { name: 'Download draft JSON' }) as HTMLButtonElement).disabled, true);
  fireEvent.click(ui.getByRole('button', { name: 'Overview' }));
  fireEvent.click(ui.getByRole('button', { name: 'Software Factory' }));
  assert.equal((ui.getByLabelText('Task objective') as HTMLTextAreaElement).value, 'Updated objective');
  fireEvent.click(ui.getByRole('button', { name: 'Sign out' }));
  await ui.findByText('You have signed out.');
  assert.equal(ui.queryByText('Updated objective'), null);
  assert.deepEqual(calls, ['/api/admin/dashboard', '/api/admin/login', '/api/admin/dashboard', '/api/admin/logout']);
});

test('AI factory drafts use the private endpoint and proposed steps or markup stay inert', async () => {
  const data = dashboard();
  data.services.factoryAiConfigured = true;
  let requests = 0;
  globalThis.fetch = async (input, init) => {
    if (input === '/api/admin/dashboard') return adminJson(data);
    assert.equal(input, '/api/admin/factory/draft');
    assert.equal(init?.method, 'POST');
    assert.equal(init?.credentials, 'same-origin');
    const request = JSON.parse(String(init?.body));
    assert.equal(request.language, 'Elixir');
    assert.equal(request.includeSnapshot, false);
    assert.equal(request.snapshot, undefined);
    requests++;
    return adminJson({ title: 'Proposed draft', summary: 'No site changes', code: '<b>plain text</b>', checks: ['Review'], steps: [{ kind: 'input', label: 'Read anonymised counts' }] });
  };
  const ui = renderPortal();
  fireEvent.click(await ui.findByRole('button', { name: 'Software Factory' }));
  await ui.findByRole('heading', { name: 'Work brief' });
  fireEvent.change(ui.getByLabelText('Programming language'), { target: { value: 'other' } });
  fireEvent.change(ui.getByLabelText('Language name'), { target: { value: 'Elixir' } });
  fireEvent.change(ui.getByLabelText('Task objective'), { target: { value: 'Plan an internal report' } });
  fireEvent.click(ui.getByRole('button', { name: 'Draft with AI' }));
  await ui.findByRole('heading', { name: 'Proposed draft' });
  const snippet = ui.getByLabelText('Code draft');
  assert.equal(snippet.textContent, '<b>plain text</b>');
  assert.equal(snippet.querySelector('b'), null);
  assert.equal((ui.getByLabelText('Cell 1 name') as HTMLInputElement).value, '');
  fireEvent.click(ui.getByRole('button', { name: 'Replace scenario with proposed steps' }));
  assert.equal((ui.getByLabelText('Cell 1 name') as HTMLInputElement).value, 'Read anonymised counts');
  assert.ok(ui.getByText('Human review'));
  assert.equal(requests, 1);
});

test('leaving the factory tab cancels an in-flight draft and retains the brief', async () => {
  const data = dashboard();
  data.services.factoryAiConfigured = true;
  let pendingSignal: AbortSignal | null | undefined;
  let finish!: (response: Response) => void;
  globalThis.fetch = async (input, init) => {
    if (input === '/api/admin/dashboard') return adminJson(data);
    assert.equal(input, '/api/admin/factory/draft');
    pendingSignal = init?.signal;
    return new Promise<Response>(resolve => { finish = resolve; });
  };
  const ui = renderPortal();
  const factory = await ui.findByRole('button', { name: 'Software Factory' });
  fireEvent.click(factory);
  const brief = await ui.findByLabelText('Task objective');
  fireEvent.change(brief, { target: { value: 'Keep this working brief' } });
  fireEvent.click(ui.getByRole('button', { name: 'Draft with AI' }));
  assert.equal(pendingSignal?.aborted, false);
  fireEvent.click(ui.getByRole('button', { name: 'Overview' }));
  assert.equal(pendingSignal?.aborted, true);
  await act(async () => finish(adminJson({ title: 'Stale reply', summary: 'Late response', steps: [], code: null, checks: ['Review'] })));
  fireEvent.click(factory);
  assert.equal((ui.getByLabelText('Task objective') as HTMLTextAreaElement).value, 'Keep this working brief');
  assert.equal((ui.getByRole('button', { name: 'Draft with AI' }) as HTMLButtonElement).disabled, false);
  assert.equal(ui.queryByText('Stale reply'), null);
});
