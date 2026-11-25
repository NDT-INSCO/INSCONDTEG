import React from 'react';
import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
  url: 'https://insco-test.example/#admin',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
const realFetch = globalThis.fetch;
const { cleanup, render, waitFor } = await import('@testing-library/react');
const { AdminAgents } = await import('../src/components/admin/AdminAgents');

afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

test('admin agents panel reads the real gateway status and lists existing integrated capabilities', async () => {
  globalThis.fetch = async input => {
    const url = String(input);
    if (url === '/api/admin/agents/tasks') return Response.json({ items: [] });
    assert.equal(url, '/api/ai/status');
    return Response.json({
      configured: true,
      reason: 'ok',
      provider: 'local',
      external: false,
      brain: { model: 'insco-local-1', documents: 42 },
      model: 'test-model',
      deepModel: 'test-deep-model',
      limits: {},
      retrieval: { documents: 42, ready: true, source: 'academy' },
    });
  };

  const ui = render(<AdminAgents language="en" active />);
  await waitFor(() => assert.ok(ui.getByText('insco-local-1')));
  assert.ok(ui.getByText('Local engine'));
  assert.ok(ui.getByText('Technical tutor'));
  assert.ok(ui.getByText('User copilot'));
  assert.ok(ui.getAllByText('Site manager').length > 0);
  assert.ok(ui.getByText('Community assistant'));
  assert.ok(ui.getByText('Streaming assistant'));
  assert.ok(ui.getByText('42'));
  assert.equal(ui.queryByText(/AIza|API key/i), null);
});
