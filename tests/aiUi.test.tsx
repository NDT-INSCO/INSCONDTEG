import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://ndt-insco.github.io/-Project-/#ask_ai', pretendToBeVisual: true });
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

// A static deployment has no /api/ai/* at all: fetch fails on the network layer.
const failingFetch = async (): Promise<Response> => {
  throw new TypeError('Failed to fetch');
};
Object.assign(globalThis, { fetch: failingFetch });

const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { SemanticSearchBar } = await import('../src/components/academy/SemanticSearchBar');
const { render, cleanup, fireEvent, waitFor } = await import('@testing-library/react');

const OLD_CANNED_TEXT = 'في تقنيات الفحص غير الإتلافي والمعالجة الحرارية، يتم تطبيق مواصفات ASME';

/* ---------------------------------------------------------------- */
/* tutor tab                                                         */
/* ---------------------------------------------------------------- */

test('without a gateway the tutor tab says so and prints no answer', async () => {
  const ui = render(<EducationalAcademy language="ar" initialSubTab="ask_ai" />);

  await waitFor(() => {
    assert.match(ui.container.textContent || '', /غير مُهيّأ/);
  });

  const text = ui.container.textContent || '';
  assert.doesNotMatch(text, new RegExp(OLD_CANNED_TEXT), 'the canned paragraph must never be shown as an answer');
  assert.match(text, /VITE_AI_BASE_URL/, 'the panel must explain how to enable it');
  assert.equal(ui.container.querySelector('input[placeholder*="الاستفسار"]'), null, 'the form is hidden when nothing can answer');
  cleanup();
});

test('the same tab in English explains the same limitation', async () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="ask_ai" />);
  await waitFor(() => {
    assert.match(ui.container.textContent || '', /not configured/i);
  });
  assert.match(ui.container.textContent || '', /VITE_AI_BASE_URL/);
  cleanup();
});

/* ---------------------------------------------------------------- */
/* library search                                                    */
/* ---------------------------------------------------------------- */

test('search returns real library hits and opens the exact page', async () => {
  const opened: { tab: string; bookId?: string; pageNumber?: number }[] = [];
  const ui = render(
    <SemanticSearchBar language="ar" onOpenTarget={target => opened.push(target)} />
  );

  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  assert.ok(input, 'the search input must exist');

  fireEvent.change(input, { target: { value: 'Jaeger' } });

  await waitFor(() => {
    assert.ok(ui.container.querySelectorAll('[role="option"]').length > 0, 'no results rendered');
  });

  const options = ui.container.querySelectorAll('[role="option"]');
  assert.ok(options.length >= 1);
  assert.match(options[0].textContent || '', /متطلبات الإضاءة/);

  fireEvent.click(options[0].querySelector('button') as HTMLButtonElement);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].tab, 'edb');
  assert.equal(opened[0].bookId, 'book-vt');
  assert.equal(opened[0].pageNumber, 1);
  cleanup();
});

test('a course lesson hit opens the course, not a book page', async () => {
  const opened: { tab: string; courseId?: string }[] = [];
  const ui = render(<SemanticSearchBar language="ar" onOpenTarget={target => opened.push(target)} />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'الإضاءة' } });

  await waitFor(() => {
    assert.ok(ui.container.querySelectorAll('[role="option"]').length > 0);
  });

  const first = ui.container.querySelectorAll('[role="option"]')[0];
  fireEvent.click(first.querySelector('button') as HTMLButtonElement);
  assert.equal(opened[0].tab, 'courses');
  assert.ok(opened[0].courseId);
  cleanup();
});

test('an English query works in the English UI', async () => {
  const ui = render(<SemanticSearchBar language="en" />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'illumination' } });
  await waitFor(() => {
    assert.ok(ui.container.querySelectorAll('[role="option"]').length > 0);
  });
  assert.match(ui.container.textContent || '', /Illumination/i);
  cleanup();
});

test('a query with no match says so instead of showing unrelated pages', async () => {
  const ui = render(<SemanticSearchBar language="ar" />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'مطعم كشري' } });
  await waitFor(() => {
    assert.match(ui.container.textContent || '', /لا تطابق مؤكد/);
  });
  assert.equal(ui.container.querySelectorAll('[role="option"]').length, 0);
  cleanup();
});

test('the search offers to hand the question to the tutor', async () => {
  const asked: string[] = [];
  const ui = render(<SemanticSearchBar language="ar" onAskTutor={question => asked.push(question)} />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'PWHT' } });

  await waitFor(() => {
    assert.match(ui.container.textContent || '', /اسأل المستشار/);
  });

  const button = [...ui.container.querySelectorAll('button')].find(item => /اسأل المستشار/.test(item.textContent || ''));
  assert.ok(button);
  fireEvent.click(button!);
  assert.deepEqual(asked, ['PWHT']);
  cleanup();
});
