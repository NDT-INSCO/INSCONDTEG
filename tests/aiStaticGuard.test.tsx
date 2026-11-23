/**
 * Static GitHub Pages build honesty checks for the Dual AI agents:
 * no gateway may be faked — the client refuses with `not_configured`, the
 * contract names the measured chain, and the dock banner explains itself.
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

test('static build: agents refuse with not_configured and the contract names real models', async () => {
  const { askUserCopilot, runSiteManagerAgent, runCommunityAssist, agentUrl, AgentApiError } =
    await import('../src/ai/agentsClient');
  const { AGENT_MODELS } = await import('../src/ai/agentsContract');

  const chain = [AGENT_MODELS.primary, AGENT_MODELS.fallback, ...AGENT_MODELS.fallbacks];

  // The busy model must never lead — it is the one model that always answers 503.
  assert.notEqual(AGENT_MODELS.primary, 'gemini-4-hydrogen');
  // The measured chain leads with the model that answers and puts the busy one last.
  assert.equal(chain[0], 'gemini-3.5-flash-lite');
  assert.equal(chain[chain.length - 1], 'gemini-4-hydrogen');
  assert.equal(new Set(chain).size, chain.length, 'the chain must not repeat a model');

  // The static build must never reach the network with a relative URL.
  const before = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  try {
    await assert.rejects(
      askUserCopilot({ message: 'hello', history: [], language: 'ar', mode: 'assistant' }),
      (error: AgentApiError) => {
        assert.equal(error.code, 'not_configured');
        assert.equal(error.status, 503);
        assert.match(error.message, /INSCO AI gateway/);
        return true;
      }
    );

    await assert.rejects(
      runSiteManagerAgent({
        instruction: 'audit',
        language: 'ar',
        mode: 'executive_audit',
        telemetry: {
          totalRequests: 0, newRequests: 0, urgentRequests: 0, totalCompanies: 0,
          activeTestingCompanies: 0, pendingAccounts: 0, geofenceAlertCount: 0,
          recentGeofenceAlerts: [], communityPostsCount: 0, communityMembersCount: 0,
          opportunitiesCount: 0, recentPosts: [],
        },
      }),
      (error: AgentApiError) => {
        assert.equal(error.code, 'not_configured');
        return true;
      }
    );

    await assert.rejects(
      runCommunityAssist({ action: 'enhance_post', language: 'ar', ndtMethod: 'RT', body: 'فحص' }),
      (error: AgentApiError) => {
        assert.equal(error.code, 'not_configured');
        return true;
      }
    );
  } finally {
    globalThis.fetch = before;
  }
  assert.equal(fetchCalls, 0, 'static build must never hit the network');

  // URL helper stays relative when the gateway is not configured (see client.ts).
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
  assert.ok(ui.getByTestId('ai-gateway-unavailable'));
  assert.match(ui.getByTestId('ai-gateway-unavailable').textContent, /static/i);
  cleanup();
});
