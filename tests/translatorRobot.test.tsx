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
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  NodeFilter: dom.window.NodeFilter,
  MutationObserver: dom.window.MutationObserver,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { SITE_LANGUAGES, getLanguage, isRtlLanguage, normalizeLanguageCode, detectBrowserLanguage, languageFromUrl } =
  await import('../src/i18n/languages');
const { isTranslatableText, translateText, clearTranslationCache, getCacheSize } =
  await import('../src/i18n/translateEngine');
const { translationRobot } = await import('../src/i18n/translationStore');
const { TranslatorRobot } = await import('../src/components/TranslatorRobot');
const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');

let fetchCalls: string[] = [];

function stubFetch(handler: (url: string) => unknown) {
  fetchCalls = [];
  (globalThis as { fetch: unknown }).fetch = async (url: string) => {
    fetchCalls.push(String(url));
    const body = handler(String(url));
    return {
      ok: true,
      status: 200,
      json: async () => body,
    };
  };
}

function myMemoryBody(url: string) {
  const q = new URL(url).searchParams.get('q') ?? '';
  return { responseData: { translatedText: `[FR] ${q}` }, responseStatus: 200 };
}

beforeEach(() => {
  storage.clear();
  clearTranslationCache();
  document.body.innerHTML = '';
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  translationRobot.disable();
  translationRobot.setSource('ar');
});

afterEach(() => {
  cleanup();
  translationRobot.disable();
});

/* ------------------------------- registry -------------------------------- */

test('the registry covers the world: 100+ languages including ar/en/fr/zh', () => {
  assert.ok(SITE_LANGUAGES.length >= 100, `expected 100+ languages, got ${SITE_LANGUAGES.length}`);
  for (const code of ['ar', 'en', 'fr', 'es', 'de', 'ru', 'zh-CN', 'ja', 'ko', 'tr', 'ur', 'fa', 'hi', 'sw']) {
    assert.ok(getLanguage(code), `missing language ${code}`);
  }
  const codes = SITE_LANGUAGES.map(l => l.code.toLowerCase());
  assert.equal(new Set(codes).size, codes.length, 'language codes must be unique');
});

test('RTL languages are flagged correctly', () => {
  for (const code of ['ar', 'ur', 'fa', 'he', 'ps']) assert.equal(isRtlLanguage(code), true, code);
  for (const code of ['en', 'fr', 'de', 'zh-CN', 'ja']) assert.equal(isRtlLanguage(code), false, code);
});

test('normalizeLanguageCode maps browser tags to registry codes', () => {
  assert.equal(normalizeLanguageCode('fr-FR'), 'fr');
  assert.equal(normalizeLanguageCode('ar-EG'), 'ar');
  assert.equal(normalizeLanguageCode('en-US'), 'en');
  assert.equal(normalizeLanguageCode('zh-Hans-CN'), 'zh-CN');
  assert.equal(normalizeLanguageCode('zh-Hant-TW'), 'zh-TW');
  assert.equal(normalizeLanguageCode('pt-BR'), 'pt-BR');
  assert.equal(normalizeLanguageCode('xx-YY'), null);
  assert.equal(normalizeLanguageCode(''), null);
  assert.equal(normalizeLanguageCode(null), null);
});

test('detectBrowserLanguage and languageFromUrl pick the first supported tag', () => {
  assert.equal(detectBrowserLanguage('de-DE', ['de-DE', 'en']), 'de');
  assert.equal(detectBrowserLanguage('xx', ['fr-FR']), 'fr');
  assert.equal(detectBrowserLanguage('xx', []), null);
  assert.equal(languageFromUrl('?lang=es'), 'es');
  assert.equal(languageFromUrl('?translate=ja'), 'ja');
  assert.equal(languageFromUrl('?lang=xx'), null);
  assert.equal(languageFromUrl(''), null);
});

/* -------------------------------- engine --------------------------------- */

test('isTranslatableText skips numbers, URLs, e-mails and blanks', () => {
  assert.equal(isTranslatableText('Hello world'), true);
  assert.equal(isTranslatableText('خدمات إنسكو'), true);
  assert.equal(isTranslatableText(''), false);
  assert.equal(isTranslatableText('42'), false);
  assert.equal(isTranslatableText('+20 109 077 7202'), false);
  assert.equal(isTranslatableText('https://example.com/x'), false);
  assert.equal(isTranslatableText('insco50@yahoo.com'), false);
  assert.equal(isTranslatableText('---'), false);
});

test('translateText uses MyMemory and caches the result', async () => {
  stubFetch(myMemoryBody);
  const first = await translateText('Hello', 'en', 'fr');
  assert.equal(first, '[FR] Hello');
  assert.equal(fetchCalls.length, 1);
  const second = await translateText('Hello', 'en', 'fr');
  assert.equal(second, '[FR] Hello');
  assert.equal(fetchCalls.length, 1, 'second call must come from cache');
  assert.ok(getCacheSize() >= 1);
});

test('translateText falls back to Google when MyMemory fails', async () => {
  (globalThis as { fetch: unknown }).fetch = async (url: string) => {
    fetchCalls.push(String(url));
    if (String(url).includes('mymemory')) {
      return { ok: false, status: 429, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => [[['[G] Bonjour']]] };
  };
  fetchCalls = [];
  const result = await translateText('Hello', 'en', 'fr');
  assert.equal(result, '[G] Bonjour');
  assert.equal(fetchCalls.length, 2);
});

test('translateText throws when every provider fails', async () => {
  (globalThis as { fetch: unknown }).fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(() => translateText('Hello', 'en', 'fr'));
});

/* --------------------------------- store --------------------------------- */

test('enable() translates visible text and disable() restores it exactly', async () => {
  stubFetch(myMemoryBody);
  document.body.innerHTML = '<main><h1>خدمات إنسكو</h1><p>اطلب عرض سعر</p></main>';
  await translationRobot.enable('fr');
  assert.match(document.body.textContent ?? '', /\[FR\]/);
  assert.equal(document.documentElement.lang, 'fr');
  assert.equal(document.documentElement.dir, 'ltr');
  assert.equal(storage.getItem('insco_robot_lang_v1'), 'fr');

  translationRobot.disable();
  assert.equal(document.body.textContent, 'خدمات إنسكواطلب عرض سعر');
  assert.equal(document.documentElement.lang, 'ar');
  assert.equal(document.documentElement.dir, 'rtl');
  assert.equal(storage.getItem('insco_robot_lang_v1'), null);
});

test('an RTL target flips <html dir> to rtl', async () => {
  stubFetch(myMemoryBody);
  document.body.innerHTML = '<main><h1>خدمات إنسكو</h1></main>';
  await translationRobot.enable('ur');
  assert.equal(document.documentElement.lang, 'ur');
  assert.equal(document.documentElement.dir, 'rtl');
});

test('the robot never translates its own UI or marked regions', async () => {
  stubFetch(myMemoryBody);
  document.body.innerHTML =
    '<main><h1>خدمات إنسكو</h1>' +
    '<div data-translator-ui="true"><p>لوحة الترجمة</p></div>' +
    '<div data-no-translate="true"><p>لا تترجم</p></div>' +
    '<script>var x = "خدمات";</script></main>';
  await translationRobot.enable('fr');
  assert.match(document.body.textContent ?? '', /\[FR\] خدمات إنسكو/);
  assert.match(document.body.textContent ?? '', /لوحة الترجمة/);
  assert.match(document.body.textContent ?? '', /لا تترجم/);
});

test('enabling the native language restores instead of translating', async () => {
  stubFetch(myMemoryBody);
  document.body.innerHTML = '<main><h1>خدمات إنسكو</h1></main>';
  await translationRobot.enable('fr');
  await translationRobot.enable('ar');
  assert.equal(translationRobot.getTarget(), null);
  assert.equal(document.body.textContent, 'خدمات إنسكو');
});

/* ---------------------------------- UI ----------------------------------- */

test('the robot button opens a searchable panel with every language', async () => {
  stubFetch(myMemoryBody);
  const ui = render(<TranslatorRobot source="ar" />);
  fireEvent.click(ui.getByRole('button', { name: /مترجم إنسكو الذكي/i }));
  assert.ok(ui.getByRole('dialog'));
  // Popular + full list render; search narrows it down.
  fireEvent.change(ui.getByPlaceholderText(/ابحث عن لغة/i), { target: { value: 'Français' } });
  assert.ok(ui.getByRole('button', { name: /Français/ }));
  assert.equal(ui.queryByRole('button', { name: /Deutsch/ }), null);
});

test('choosing a language from the panel translates the page', async () => {
  stubFetch(myMemoryBody);
  document.body.innerHTML = '<main><h1>خدمات إنسكو</h1></main>';
  const ui = render(<TranslatorRobot source="ar" />);
  fireEvent.click(ui.getByRole('button', { name: /مترجم إنسكو الذكي/i }));
  fireEvent.change(ui.getByPlaceholderText(/ابحث عن لغة/i), { target: { value: 'Français' } });
  fireEvent.click(ui.getByRole('button', { name: /Français/ }));
  await waitFor(() => assert.match(document.body.textContent ?? '', /\[FR\]/));
  assert.equal(translationRobot.getTarget(), 'fr');
});
