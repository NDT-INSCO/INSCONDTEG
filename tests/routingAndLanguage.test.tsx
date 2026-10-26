import React from 'react';
import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  get length() { return this.store.size; }
}

const storage = new MemoryStorage();
const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/-Project-/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { App } = await import('../src/App');
const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { render, fireEvent, cleanup } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  dom.window.history.replaceState(null, '', '/-Project-/');
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
});

afterEach(() => cleanup());

test('switching to English updates <html lang/dir> and persists the choice', () => {
  const ui = render(<App />);
  assert.equal(document.documentElement.dir, 'rtl');

  fireEvent.click(ui.getByRole('button', { name: /English/i }));
  assert.equal(document.documentElement.dir, 'ltr');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(storage.getItem('insco_language_v1'), 'en');

  cleanup();
  const again = render(<App />);
  assert.ok(again.getByText('INSCO NDT Academy'));
  assert.equal(document.documentElement.dir, 'ltr');
});

test('a stored Arabic preference is respected on load', () => {
  storage.setItem('insco_language_v1', 'ar');
  const ui = render(<App />);
  assert.ok(ui.getByText('أكاديمية إنسكو NDT'));
  assert.equal(document.documentElement.dir, 'rtl');
});

test('a tab can be opened from the URL hash', () => {
  dom.window.location.hash = '#paths';
  const ui = render(<EducationalAcademy language="en" />);
  assert.match(ui.container.textContent || '', /Learning paths/i);
});

test('changing tab updates the hash without adding history entries', () => {
  const ui = render(<EducationalAcademy language="en" />);
  const before = dom.window.history.length;
  fireEvent.click(ui.getByText(/EDB Flipbook Library/i));
  assert.equal(dom.window.location.hash, '#edb');
  assert.equal(dom.window.history.length, before, 'replaceState must not grow history');
});

test('an unknown hash falls back to the default tab instead of breaking', () => {
  dom.window.location.hash = '#not-a-tab';
  const ui = render(<EducationalAcademy language="en" />);
  assert.ok(ui.container.textContent && ui.container.textContent.length > 100);
});

test('initialSubTab wins over the URL hash (embeds and tests stay deterministic)', () => {
  dom.window.location.hash = '#edb';
  const ui = render(<EducationalAcademy language="en" initialSubTab="knowledge" />);
  assert.doesNotMatch(ui.container.textContent || '', /EDB Flipbook Library \(11/i);
});

test('a shared academy link opens the academy itself, not the company profile', () => {
  dom.window.location.hash = '#courses';
  const ui = render(<App />);
  // The academy header belongs to App, so it proves the view switched before
  // the (code-split) academy chunk has even loaded.
  assert.match(ui.container.textContent || '', /أكاديمية إنسكو الهندسية للفحص غير الإتلافي/);
  // The old build forced the first tab and overwrote the requested link.
  assert.equal(dom.window.location.hash, '#courses');
});

test('leaving the academy clears the hash so the address bar stops lying', () => {
  dom.window.location.hash = '#edb';
  const ui = render(<App />);
  fireEvent.click(ui.getByRole('button', { name: /الرئيسية - شركة إنسكو/ }));
  assert.equal(dom.window.location.hash, '');
});
