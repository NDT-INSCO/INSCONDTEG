/**
 * The directory's «أضف إلى شبكتي» is a real write now.
 *
 * `community_connections` ships with the site and its rules demand a sender name,
 * a recipient name and an id of the exact form `fromUid_toUid`. So the button is
 * only enabled when all three exist: a session, a confirmed email, and a card —
 * and the request always carries the member's own card name, never a typed one.
 */
import React from 'react';
import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  history: dom.window.history,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const me = { uid: 'uid-me', email: 'me@example.test' };
const myCard = {
  uid: 'uid-me',
  displayName: 'أحمد محمود',
  organizationName: 'إنسكو',
  sector: 'الفحص غير الإتلافي',
  companiesManaged: 0,
  isPublished: true,
};
const bob = { ...myCard, uid: 'uid-bob', displayName: 'سارة علي' };
const carol = { ...myCard, uid: 'uid-carol', displayName: 'خالد حسن' };

type Call = { fn: string; args: unknown[] };
const calls: Call[] = [];
let verified = true;
let myConnections: unknown[] = [];

mock.module('../src/client/firestoreClientService.ts', {
  namedExports: {
    observeClientPortalAuth: (callback: (u: typeof me | null) => void) => {
      callback(me);
      return () => {};
    },
    isPortalFirestoreReady: () => true,
    clearPendingRegistrationDraft: () => {},
    loadPendingRegistrationDraft: () => null,
    confirmClientPortalVerification: async () => verified,
    resendClientVerificationEmail: async () => {},
    subscribeCommunityWorkspaces: (_admin: boolean, onData: (list: unknown[]) => void) => {
      onData([bob, carol]);
      return () => {};
    },
    subscribeMyCommunityWorkspace: (uid: string, onData: (value: unknown) => void) => {
      if (uid === myCard.uid) onData(myCard);
      return () => {};
    },
    subscribeMyConnections: (_uid: string, onData: (list: unknown[]) => void) => {
      onData(myConnections);
      return () => {};
    },
    connectWithCommunityMember: async (...args: unknown[]) => {
      calls.push({ fn: 'connectWithCommunityMember', args });
    },
    upsertCommunityWorkspace: async () => {},
  },
});

const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkDirectorySection } = await import('../src/components/network/NetworkDirectorySection');
const { render, cleanup, fireEvent, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  verified = true;
  myConnections = [{ id: `${me.uid}_uid-bob`, fromUid: me.uid, toUid: 'uid-bob', status: 'connected' }];
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

const mount = () =>
  render(
    <SiteAccountProvider>
      <NetworkDirectorySection language="ar" onOpenAccount={() => {}} onOpenProfile={() => {}} />
    </SiteAccountProvider>
  );

test('a member already in my network is a state, not a button that does nothing', async () => {
  const { getAllByTestId, getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-directory-list')));

  assert.equal(getAllByTestId('network-connected-chip').length, 1);
  assert.equal(getAllByTestId('network-connect').length, 1, 'only the member not yet added keeps a button');
});

test('adding a member sends my card name and the target uid through the service', async () => {
  const { getAllByTestId, getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-directory-list')));

  const button = getAllByTestId('network-connect')[0] as HTMLButtonElement;
  assert.equal(button.disabled, false);
  fireEvent.click(button);

  await waitFor(() => {
    const call = calls.find(entry => entry.fn === 'connectWithCommunityMember');
    assert.ok(call, 'the connection must go through the service');
    const [user, fromName, target] = call!.args as [typeof me, string, { uid: string; displayName: string }];
    assert.equal(user.uid, 'uid-me');
    assert.equal(fromName, 'أحمد محمود', 'the request carries my card name');
    assert.equal(target.uid, 'uid-carol');
    assert.equal(target.displayName, 'خالد حسن');
  });
});

test('an unconfirmed email cannot add anyone, and the reason is written on the button', async () => {
  verified = false;
  const { getAllByTestId, getByTestId } = mount();
  await waitFor(() => assert.ok(getByTestId('network-directory-list')));

  const button = getAllByTestId('network-connect')[0] as HTMLButtonElement;
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  assert.ok((button.getAttribute('title') ?? '').includes('أكّد بريدك'));

  fireEvent.click(button);
  assert.equal(calls.some(entry => entry.fn === 'connectWithCommunityMember'), false);
});
