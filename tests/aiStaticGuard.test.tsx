/**
 * Static GitHub Pages checks: the local agent brain answers without a gateway
 * or external key, and the dock explains that path honestly.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="en" dir="ltr"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  sessionStorage: dom.window.sessionStorage,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};

test('static build: every agent uses the local brain without a gateway or model key', async () => {
  const { askUserCopilot, runSiteManagerAgent, runCommunityAssist, agentUrl } =
    await import('../src/ai/agentsClient');
  const before = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  try {
    const copilot = await askUserCopilot({ message: 'ما الفرق بين PAUT و TOFD؟', history: [], language: 'ar', mode: 'assistant' });
    assert.equal(copilot.model, null);
    assert.ok(copilot.kind === 'library' || copilot.kind === 'decline');

    const manager = await runSiteManagerAgent({
      instruction: 'audit', language: 'ar', mode: 'executive_audit',
      telemetry: {
        totalRequests: 0, newRequests: 0, urgentRequests: 0, totalCompanies: 0,
        activeTestingCompanies: 0, pendingAccounts: 0, geofenceAlertCount: 0,
        recentGeofenceAlerts: [], communityPostsCount: 0, communityMembersCount: 0,
        opportunitiesCount: 0, recentPosts: [],
      },
    });
    assert.equal(manager.model, null);
    assert.equal(manager.kind, 'site-data');

    const community = await runCommunityAssist({ action: 'enhance_post', language: 'ar', ndtMethod: 'RT', body: 'فحص' });
    assert.equal(community.model, null);
    assert.equal(community.kind, 'editorial');
  } finally {
    globalThis.fetch = before;
  }
  assert.equal(fetchCalls, 0, 'static build must never hit the network for agent answers');
  assert.match(agentUrl('/api/ai/agent/user-copilot'), /^\/api\/ai\/agent\/user-copilot$/);
});

test('static build: the dock explains itself instead of faking', async () => {
  const { render, fireEvent, cleanup } = await import('@testing-library/react');
  const React = await import('react');
  const { InscoDualAiDock } = await import('../src/components/ai/InscoDualAiDock');
  const jsx = React.createElement;
  const ui = render(
    jsx(InscoDualAiDock, {
      language: 'en',
      portal: 'company',
      onOpenCompany: () => {},
      onOpenClient: () => {},
      onOpenAcademy: () => {},
    })
  );
  fireEvent.click(ui.getByTestId('insco-dual-ai-launcher'));
  assert.ok(ui.getByTestId('ai-local-brain'));
  assert.match(ui.getByTestId('ai-local-brain').textContent, /without a key/i);
  cleanup();
});
