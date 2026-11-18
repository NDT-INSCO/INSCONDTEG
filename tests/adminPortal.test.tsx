import React from 'react';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import type { DashboardData } from '../src/admin/contract';
import { externalAdminLink } from '../src/admin/public';

const dom = new JSDOM('<!doctype html><html lang="ar"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/', pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement, CustomEvent: dom.window.CustomEvent, Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const { App } = await import('../src/App');
const { cleanup, fireEvent, render, waitFor, within } = await import('@testing-library/react');
const realFetch = globalThis.fetch;
function adminJson(data: unknown, status = 200) { return Response.json(data, { status }); }
const signedOut = () => adminJson({ error: 'signed_out' }, 401);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('insco_portal_choice_v1', 'company');
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
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
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#company-footer');
  const ui = render(<App />);
  const footer = within(ui.container.querySelector('#company-footer')!);
  const companyName = footer.getByText('International for Services & Constructions Company - INSCO');
  const key = footer.getByRole('link', { name: 'Admin portal' });
  assert.equal(companyName.nextElementSibling, key);
  assert.equal(ui.queryByRole('dialog'), null, 'the first-visit chooser must not cover the footer');
});

test('a static deep link does not present a fake password gate or dashboard', async () => {
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#admin');
  localStorage.removeItem('insco_portal_choice_v1');
  globalThis.fetch = async () => new Response('<h1>404</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  const ui = render(<App />);
  await ui.findByText('بوابة الإدارة غير مهيّأة');
  assert.equal(ui.queryByLabelText('كلمة المرور', { exact: true }), null);
  assert.equal(ui.queryByRole('heading', { name: 'لوحة الإدارة' }), null);
  assert.equal(ui.queryByRole('dialog'), null);
});

test('login verifies against the API, loads the real summary and can publish and sign out', async () => {
  localStorage.setItem('insco_language_v1', 'en');
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#admin');
  let session = false;
  let loginCalls = 0;
  const testPassword = 'Ops_Example42!';
  const data: DashboardData = {
    sessionExpiresAt: Date.now() + 60_000, updatedAt: new Date().toISOString(),
    totals: { total: 0, new: 0, in_progress: 0, closed: 0, overdue: 0 }, activity: [], recent: [],
    services: { tutorConfigured: false, rfqNotificationsConfigured: false },
    announcement: { message: { ar: '', en: '' }, enabled: false, updatedAt: null },
  };
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

test('a Pages footer only accepts an HTTPS admin host and gives it the correct hash', () => {
  assert.equal(externalAdminLink('https://admin.example/site/'), 'https://admin.example/site/#admin');
  assert.equal(externalAdminLink('https://user:password@admin.example/'), null);
  assert.equal(externalAdminLink('http://admin.example/'), null);
});
