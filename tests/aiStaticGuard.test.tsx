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

test('static build: the agents call the hosted gateway, never a relative path', async () => {
  const { askUserCopilot, agentUrl } = await import('../src/ai/agentsClient');
  const { AGENT_MODELS } = await import('../src/ai/agentsContract');
  const { HOSTED_GATEWAY_URL } = await import('../src/ai/pagesGateway');

  const chain = [AGENT_MODELS.primary, AGENT_MODELS.fallback, ...AGENT_MODELS.fallbacks];

  // The busy model must never lead — it is the one model that always answers 503.
  assert.notEqual(AGENT_MODELS.primary, 'gemini-4-hydrogen');
  // The measured chain leads with the model that answers and puts the busy one last.
  assert.equal(chain[0], 'gemini-3.5-flash-lite');
  assert.equal(chain[chain.length - 1], 'gemini-4-hydrogen');
  assert.equal(new Set(chain).size, chain.length, 'the chain must not repeat a model');

  // A static build has no server of its own, so every call must be absolute and go to the
  // deployment that holds the key. This used to be a refusal; now it is a real call.
  assert.equal(agentUrl('/api/ai/agent/user-copilot'), `${HOSTED_GATEWAY_URL}/api/ai/agent/user-copilot`);

  const before = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    // The gateway answers 503 when it has no key; the client must pass that through, not
    // invent a reply of its own.
    return new Response(JSON.stringify({ error: { code: 'not_configured', message: 'no key' } }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  try {
    await assert.rejects(
      askUserCopilot({ message: 'hello', history: [], language: 'ar', mode: 'assistant' }),
      (error: { code?: string }) => {
        assert.equal(error.code, 'not_configured', 'the gateway\'s own reason survives');
        return true;
      }
    );
  } finally {
    globalThis.fetch = before;
  }
  assert.equal(calls.length, 1, 'the question reaches the gateway');
  assert.ok(calls[0].startsWith(HOSTED_GATEWAY_URL), `expected the hosted gateway, got ${calls[0]}`);
});

test('static build: the dock no longer pretends there is no gateway', async () => {
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
  // A gateway is configured for this build, so the "no gateway here" notice would be a lie.
  assert.equal(ui.queryByTestId('ai-gateway-unavailable'), null);
  assert.ok(ui.getByTestId('insco-dual-ai-drawer'));
  cleanup();
});
