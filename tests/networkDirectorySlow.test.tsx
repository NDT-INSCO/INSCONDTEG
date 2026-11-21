/**
 * The member directory must never look "empty" when it is only "unfinished".
 *
 * If the Firestore listener has not delivered a first snapshot, the page used to
 * sit on a spinner forever — indistinguishable from a broken site. It now says
 * the connection is slow and offers a retry, and the retry re-opens the
 * subscription instead of silently doing nothing.
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

let subscriptions = 0;

// A portal that is "available" but never answers: exactly the blocked-network case.
mock.module('../src/client/firestoreClientService.ts', {
  namedExports: {
    observeClientPortalAuth: (callback: (user: null) => void) => {
      callback(null);
      return () => {};
    },
    isPortalFirestoreReady: () => true,
    clearPendingRegistrationDraft: () => {},
    loadPendingRegistrationDraft: () => null,
    confirmClientPortalVerification: async () => false,
    resendClientVerificationEmail: async () => {},
    subscribeCommunityWorkspaces: () => {
      subscriptions += 1;
      return () => {};
    },
    subscribeMyCommunityWorkspace: () => () => {},
    upsertCommunityWorkspace: async () => {},
  },
});

const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkDirectorySection } = await import('../src/components/network/NetworkDirectorySection');
const { render, cleanup, fireEvent, waitFor, act } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  subscriptions = 0;
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

test('a listener that never answers is reported as a slow connection, not an empty directory', async () => {
  const { container, getByText } = render(
    <SiteAccountProvider>
      <NetworkDirectorySection
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        slowAfterMs={25}
      />
    </SiteAccountProvider>
  );

  await waitFor(() => {
    assert.ok(container.querySelector('[data-testid="network-directory-slow"]'));
  });

  const text = container.textContent ?? '';
  assert.ok(text.includes('بطيء أو محجوب'));
  assert.ok(text.includes('هذا ليس دليلاً فارغاً'));
  // The two states must not be confused for one another.
  assert.equal(container.querySelector('[data-testid="network-directory-empty"]'), null);
  assert.equal(container.querySelectorAll('[data-testid="network-member-card"]').length, 0);

  assert.equal(subscriptions, 1);
  await act(async () => {
    fireEvent.click(getByText('إعادة المحاولة'));
  });
  await waitFor(() => {
    assert.equal(subscriptions, 2, 'retry must open a fresh subscription');
  });
});
