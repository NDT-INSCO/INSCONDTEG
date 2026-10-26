import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy', pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { render, cleanup } = await import('@testing-library/react');

test('the academy opens the NDE-Ed courses tab without crashing', () => {
  const ui = render(<EducationalAcademy language="ar" initialSubTab="courses" />);
  assert.ok(ui.container.textContent && ui.container.textContent.length > 100);
  cleanup();
});

test('the academy opens the EDB library tab without crashing', () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="edb" />);
  assert.ok(ui.container.textContent && ui.container.textContent.length > 100);
  cleanup();
});

test('the academy opens the learning paths tab without crashing', () => {
  const ui = render(<EducationalAcademy language="ar" initialSubTab="paths" />);
  assert.match(ui.container.textContent || '', /مسارات التعلم|مسار/);
  cleanup();
});

test('the academy opens the practical assessment tab without crashing', () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="practical" />);
  assert.match(ui.container.textContent || '', /Training practical assessment/i);
  cleanup();
});

test('the academy opens the self-study statement tab without crashing', () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="certificates" />);
  assert.match(ui.container.textContent || '', /Self-study learning statement/i);
  cleanup();
});
