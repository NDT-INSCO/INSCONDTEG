import React from 'react';
import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  get length() {
    return this.store.size;
  }
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
  StorageEvent: dom.window.StorageEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { App } = await import('../src/App');
const {
  THEME_STORAGE_KEY,
  readTheme,
  setTheme,
  toggleTheme,
} = await import('../src/utils/themeStore');
const { render, fireEvent, cleanup, act } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  dom.window.history.replaceState(null, '', '/-Project-/');
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark', 'light');
});

afterEach(() => cleanup());

test('defaults to dark mode when localStorage has no saved preference', () => {
  const ui = render(<App />);
  const toggleBtn = ui.getByTestId('global-theme-toggle');

  assert.equal(readTheme(), 'dark');
  assert.equal(toggleBtn.getAttribute('data-current-theme'), 'dark');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(document.documentElement.classList.contains('dark'), true);
  assert.equal(document.documentElement.classList.contains('light'), false);
});

test('toggling between Dark and Light modes updates DOM attributes, classes, and localStorage', () => {
  const ui = render(<App />);
  const toggleBtn = ui.getByTestId('global-theme-toggle');

  // Switch from Dark -> Light
  fireEvent.click(toggleBtn);
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'light');
  assert.equal(toggleBtn.getAttribute('data-current-theme'), 'light');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(document.documentElement.classList.contains('light'), true);
  assert.equal(document.documentElement.classList.contains('dark'), false);

  // Switch back from Light -> Dark
  fireEvent.click(toggleBtn);
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'dark');
  assert.equal(toggleBtn.getAttribute('data-current-theme'), 'dark');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(document.documentElement.classList.contains('dark'), true);
  assert.equal(document.documentElement.classList.contains('light'), false);
});

test('persists Light mode preference across unmount and remount', () => {
  const firstMount = render(<App />);
  fireEvent.click(firstMount.getByTestId('global-theme-toggle'));
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'light');

  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark', 'light');

  const secondMount = render(<App />);
  const remountedBtn = secondMount.getByTestId('global-theme-toggle');
  assert.equal(remountedBtn.getAttribute('data-current-theme'), 'light');
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(document.documentElement.classList.contains('light'), true);
});

test('updates accessible labels across Arabic and English UI languages', () => {
  const ui = render(<App />);
  const toggleBtn = ui.getByTestId('global-theme-toggle');

  // Default Arabic in Dark mode -> action invites switching to Light mode
  assert.match(toggleBtn.getAttribute('aria-label') || '', /التبديل إلى الوضع الفاتح/);

  // Switch UI language to English
  fireEvent.click(ui.getByRole('button', { name: /English/i }));
  assert.equal(toggleBtn.getAttribute('aria-label'), 'Switch to Light mode');
  assert.match(toggleBtn.textContent || '', /Dark/);

  // Toggle to Light mode in English
  fireEvent.click(toggleBtn);
  assert.equal(toggleBtn.getAttribute('aria-label'), 'Switch to Dark mode');
  assert.match(toggleBtn.textContent || '', /Light/);
});

test('programmatic setTheme and toggleTheme synchronize mounted components immediately', () => {
  const ui = render(<App />);
  const toggleBtn = ui.getByTestId('global-theme-toggle');

  act(() => {
    setTheme('light');
  });
  assert.equal(toggleBtn.getAttribute('data-current-theme'), 'light');
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'light');

  act(() => {
    toggleTheme();
  });
  assert.equal(toggleBtn.getAttribute('data-current-theme'), 'dark');
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'dark');
});
