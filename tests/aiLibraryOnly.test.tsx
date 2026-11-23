/**
 * The tutor tab when the server has no model: the reader keeps the library.
 *
 * Without a key the tutor used to hide itself behind a banner — a dead end that
 * read as "the AI is broken". It now answers from the library and says so: the
 * input stays usable, the answer is labelled as a library answer, and the steps
 * it took are visible. This test guards those three honesty guarantees.
 */
import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://inscondteg.vercel.app/#ask_ai',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

const REAL_FETCH = globalThis.fetch;

const STATUS = {
  configured: false,
  reason: 'no_key',
  model: 'gemini-3.5-flash-lite',
  deepModel: 'gemini-4-argon',
  limits: { messageChars: 4000, messages: 20, outputTokens: 1600, passages: 5, contextChars: 9000, minScore: 4.2 },
  retrieval: { documents: 132, ready: true, source: 'academy' },
  transport: 'auto',
};

const SSE_BODY = [
  `data: ${JSON.stringify({
    type: 'meta',
    meta: {
      model: null,
      citations: [{ id: 'book-materials#p4', kind: 'textbook', title: { ar: 'الهيدروجين والشروخ', en: 'Hydrogen and cracks' }, bookId: 'book-materials', pageNumber: 4, score: 12, reviewed: false }],
      retrieved: 1,
      confident: true,
      elapsedMs: 2,
      source: 'academy',
      kind: 'library',
      steps: ['حلل السؤال', 'بحث في المكتبة', 'اختر المقطع الأقرب', 'صيغ الإجابة من النصوص'],
    },
  })}`,
  `data: ${JSON.stringify({ type: 'delta', text: 'إجابة مبنية على مكتبة إنسكو نفسها' })}`,
  `data: ${JSON.stringify({ type: 'done' })}`,
].join('\n\n') + '\n\n';

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/api/ai/status')) {
    return new Response(JSON.stringify(STATUS), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/api/ai/tutor')) {
    return new Response(SSE_BODY, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }
  return new Response('{}', { status: 404 });
}) as typeof fetch;

const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { render, cleanup, fireEvent, waitFor } = await import('@testing-library/react');

test('the tutor tab stays usable without a key and labels the answer honestly', async () => {
  const ui = render(<EducationalAcademy language="ar" initialSubTab="ask_ai" />);

  await waitFor(() => {
    assert.match(ui.container.textContent || '', /بدون مفتاح نموذج/);
  });

  // The input stays usable and the library note is honest.
  const input = ui.container.querySelector('input[aria-label*="سؤال"]') as HTMLInputElement;
  assert.ok(input, 'the tutor input must stay visible without a key');
  fireEvent.change(input, { target: { value: 'ما هو تأثير الهيدروجين في الشروخ الباردة؟' } });
  const explainButton = Array.from(ui.container.querySelectorAll('button')).find(b => (b.textContent || '').includes('شرح الموضوع')) as HTMLButtonElement;
  assert.ok(explainButton, 'the explain button must exist');
  assert.equal(explainButton.disabled, false, 'the explain button must be enabled once a question is typed');
  fireEvent.click(explainButton);

  await waitFor(() => {
    assert.match(ui.container.textContent || '', /إجابة مبنية على مكتبة إنسكو نفسها/);
  });

  const text = ui.container.textContent || '';
  assert.match(text, /حلل السؤال/, 'the steps that produced the answer are visible');
  assert.match(text, /بحث في المكتبة/);
  assert.match(text, / بدون مفتاح نموذج/, 'the label says the model did not run');
  cleanup();
});

test.after(() => {
  globalThis.fetch = REAL_FETCH;
  cleanup();
});
