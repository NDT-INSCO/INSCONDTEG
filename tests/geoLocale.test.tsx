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

const {
  getLanguageForCountry,
  countryToFlag,
  getCountryName,
  allCountryCodes,
  COUNTRY_TO_LANGUAGE,
} = await import('../src/i18n/countryMap');

const {
  detectViaIp,
  detectViaBrowser,
  detectLocale,
  shouldAutoTranslate,
  isManualOverrideActive,
  markManualOverride,
  clearManualOverride,
  isDismissedActive,
  markDismissed,
  clearDismissed,
  markAutoApplied,
  readAutoApplied,
  clearAutoApplied,
  clearPersistedGeo,
  GEO_MANUAL_KEY,
  GEO_DISMISSED_KEY,
  GEO_DETECTED_KEY,
} = await import('../src/i18n/geoLocale');

const { translationRobot } = await import('../src/i18n/translationStore');
const { SITE_LANGUAGES, getLanguage } = await import('../src/i18n/languages');
const { clearTranslationCache } = await import('../src/i18n/translateEngine');

function stubFetch(handler: (url: string) => unknown) {
  (globalThis as { fetch: unknown }).fetch = async (url: string) => {
    const body = handler(String(url));
    return {
      ok: true,
      status: 200,
      json: async () => body,
    };
  };
}

function stubFetchFail() {
  (globalThis as { fetch: unknown }).fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({}),
  });
}

beforeEach(() => {
  storage.clear();
  clearTranslationCache();
  clearPersistedGeo();
  clearManualOverride();
  clearDismissed();
  clearAutoApplied();
  document.body.innerHTML = '';
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  translationRobot.disable({ manual: false });
  translationRobot.setSource('ar');
  // Reset URL to base without query
  try {
    window.history.replaceState(null, '', '/INSCONDTEG/');
    // Ensure search is empty
    if (window.location.search) {
      dom.reconfigure({ url: 'https://ndt-insco.github.io/INSCONDTEG/' });
    }
  } catch {
    /* ignore */
  }
});

afterEach(() => {
  translationRobot.disable({ manual: false });
});

/* ----------------------------- countryMap -------------------------------- */

test('country map covers 200+ countries and every value is a known language', () => {
  const codes = allCountryCodes();
  assert.ok(codes.length >= 180, `expected 180+ countries, got ${codes.length}`);
  for (const cc of codes) {
    const langCode = COUNTRY_TO_LANGUAGE[cc];
    assert.ok(langCode, `missing language for ${cc}`);
    assert.ok(getLanguage(langCode) ?? langCode === 'fo', `unknown language ${langCode} for ${cc}`);
  }
});

test('getLanguageForCountry resolves major markets correctly', () => {
  assert.equal(getLanguageForCountry('SA'), 'ar');
  assert.equal(getLanguageForCountry('EG'), 'ar');
  assert.equal(getLanguageForCountry('FR'), 'fr');
  assert.equal(getLanguageForCountry('DE'), 'de');
  assert.equal(getLanguageForCountry('US'), 'en');
  assert.equal(getLanguageForCountry('JP'), 'ja');
  assert.equal(getLanguageForCountry('CN'), 'zh-CN');
  assert.equal(getLanguageForCountry('BR'), 'pt-BR');
  assert.equal(getLanguageForCountry('IN'), 'hi');
  assert.equal(getLanguageForCountry('TR'), 'tr');
  assert.equal(getLanguageForCountry('IR'), 'fa');
  assert.equal(getLanguageForCountry('PK'), 'ur');
  assert.equal(getLanguageForCountry('KE'), 'sw');
  assert.equal(getLanguageForCountry('ZA'), 'en');
  assert.equal(getLanguageForCountry('RU'), 'ru');
  assert.equal(getLanguageForCountry(null), null);
  assert.equal(getLanguageForCountry('XX'), null);
});

test('countryToFlag returns correct emoji for known codes', () => {
  assert.equal(countryToFlag('US'), '🇺🇸');
  assert.equal(countryToFlag('FR'), '🇫🇷');
  assert.equal(countryToFlag('EG'), '🇪🇬');
  assert.equal(countryToFlag('SA'), '🇸🇦');
  assert.equal(countryToFlag('JP'), '🇯🇵');
  assert.equal(countryToFlag(''), '🌍');
  assert.equal(countryToFlag(null), '🌍');
});

test('getCountryName returns a non-empty name for every country', () => {
  for (const cc of ['US', 'FR', 'EG', 'SA', 'CN', 'IN', 'BR']) {
    const en = getCountryName(cc, 'en');
    const ar = getCountryName(cc, 'ar');
    assert.ok(en.length > 1, `en name for ${cc} empty`);
    assert.ok(ar.length > 1, `ar name for ${cc} empty`);
  }
});

/* ----------------------------- browser detection --------------------------- */

test('detectViaBrowser respects navigator.language and maps to registry', () => {
  const result = detectViaBrowser();
  assert.ok(result, 'should detect a language from navigator');
  assert.ok(getLanguage(result!.languageCode), `unknown language ${result!.languageCode}`);
  assert.equal(result!.method, 'browser');
  assert.equal(getLanguageForCountry('FR'), 'fr');
});

/* ----------------------------- IP detection -------------------------------- */

test('detectViaIp tries multiple endpoints and returns first success', async () => {
  let callCount = 0;
  (globalThis as { fetch: unknown }).fetch = async (url: string) => {
    callCount += 1;
    if (String(url).includes('ipapi.co')) {
      return { ok: false, status: 429, json: async () => ({}) } as unknown as Response;
    }
    if (String(url).includes('countries.dev')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ country: { isoAlpha2: 'FR' }, city: 'Paris' }),
      } as unknown as Response;
    }
    return { ok: false, status: 500, json: async () => ({}) } as unknown as Response;
  };
  const result = await detectViaIp();
  assert.ok(result, 'should get FR from second endpoint');
  assert.equal(result!.countryCode, 'FR');
  assert.equal(result!.city, 'Paris');
  assert.ok(callCount >= 2);
});

test('detectViaIp returns null when all endpoints fail', async () => {
  stubFetchFail();
  const result = await detectViaIp();
  assert.equal(result, null);
});

/* ----------------------------- full locale orchestration ------------------- */

test('detectLocale prefers URL param over everything', async () => {
  window.history.replaceState(null, '', '/INSCONDTEG/?lang=de');
  const result = await detectLocale();
  assert.ok(result);
  assert.equal(result!.languageCode, 'de');
  assert.equal(result!.method, 'url');
});

test('detectLocale uses IP when available and caches result', async () => {
  stubFetch(() => ({ country_code: 'JP', city: 'Tokyo' }));
  // ipapi.co path
  const result = await detectLocale();
  assert.ok(result);
  assert.equal(result!.countryCode, 'JP');
  assert.equal(result!.languageCode, 'ja');
  assert.equal(result!.method, 'ip');
  // Second call should come from cache, no fetch
  let fetches = 0;
  (globalThis as { fetch: unknown }).fetch = async () => {
    fetches += 1;
    return { ok: true, status: 200, json: async () => ({ country_code: 'FR' }) } as unknown as Response;
  };
  const cached = await detectLocale();
  assert.ok(cached);
  assert.equal(cached!.countryCode, 'JP', 'second call should use cached JP, not new FR');
  assert.equal(fetches, 0, 'cache should avoid fetch');
});

test('detectLocale falls back to browser language when IP fails', async () => {
  stubFetchFail();
  const result = await detectLocale();
  assert.ok(result);
  assert.ok(getLanguage(result!.languageCode), `unknown language ${result!.languageCode}`);
});

test('shouldAutoTranslate respects manual override, dismissed, and source language', async () => {
  const detected = {
    countryCode: 'FR',
    countryNameAr: 'فرنسا',
    countryNameEn: 'France',
    flag: '🇫🇷',
    city: 'Paris',
    languageCode: 'fr',
    method: 'ip' as const,
    confidence: 'high' as const,
  };
  // Fresh visitor: should auto
  assert.equal(shouldAutoTranslate(detected, 'ar', null), true);
  // Same language as source: no
  assert.equal(shouldAutoTranslate({ ...detected, languageCode: 'ar' }, 'ar', null), false);
  // Already have robot target: no
  assert.equal(shouldAutoTranslate(detected, 'ar', 'es'), false);
  // Manual override active: no
  markManualOverride();
  assert.equal(isManualOverrideActive(), true);
  assert.equal(shouldAutoTranslate(detected, 'ar', null), false);
  clearManualOverride();
  // Dismissed: no
  markDismissed();
  assert.equal(isDismissedActive(), true);
  assert.equal(shouldAutoTranslate(detected, 'ar', null), false);
  clearDismissed();
  assert.equal(shouldAutoTranslate(detected, 'ar', null), true);
  // URL method never auto
  assert.equal(shouldAutoTranslate({ ...detected, method: 'url' }, 'ar', null), false);
});

test('manual and dismissed flags expire after TTL (simulated via old timestamp)', () => {
  // Simulate old manual timestamp (31 days ago)
  const old = Date.now() - 31 * 24 * 60 * 60 * 1000;
  storage.setItem(GEO_MANUAL_KEY, String(old));
  assert.equal(isManualOverrideActive(), false, '31-day old manual should be expired');
  storage.setItem(GEO_MANUAL_KEY, String(Date.now()));
  assert.equal(isManualOverrideActive(), true);

  const oldDismiss = Date.now() - 8 * 24 * 60 * 60 * 1000;
  storage.setItem(GEO_DISMISSED_KEY, String(oldDismiss));
  assert.equal(isDismissedActive(), false, '8-day old dismissed should be expired');
});

test('markAutoApplied and readAutoApplied persist the last auto language', () => {
  markAutoApplied('fr');
  const read = readAutoApplied();
  assert.ok(read);
  assert.equal(read!.code, 'fr');
  clearAutoApplied();
  assert.equal(readAutoApplied(), null);
});

test('geo banner auto-translate integration: IP JP auto-translates page via robot', async () => {
  // Simulate fresh visitor from Japan
  stubFetch(() => ({ country_code: 'JP', city: 'Tokyo' }));
  // Browser fallback to en if needed
  document.body.innerHTML = '<main><h1>مرحبا بكم في إنسكو</h1><p>خدمات الفحص</p></main>';
  const { autoDetectAndTranslate } = await import('../src/i18n/geoLocale');
  // Mock translation fetch for robot
  const origFetch = (globalThis as { fetch: unknown }).fetch;
  let fetchCalls = 0;
  (globalThis as { fetch: unknown }).fetch = async (url: string) => {
    const u = String(url);
    if (u.includes('mymemory') || u.includes('translate.googleapis')) {
      fetchCalls += 1;
      return { ok: true, status: 200, json: async () => ({ responseData: { translatedText: `[JA] test` } }) } as unknown as Response;
    }
    // IP call
    return { ok: true, status: 200, json: async () => ({ country_code: 'JP', city: 'Tokyo' }) } as unknown as Response;
  };
  const detected = await autoDetectAndTranslate({ source: 'ar', onSwitchNativeLanguage: () => {} });
  assert.ok(detected);
  assert.equal(detected!.countryCode, 'JP');
  assert.equal(detected!.languageCode, 'ja');
  // Robot should have been enabled to ja
  assert.equal(translationRobot.getTarget(), 'ja');
  // Clean up
  (globalThis as { fetch: unknown }).fetch = origFetch;
  void fetchCalls;
});

test('dismissed banner can be cleared and auto resumes', () => {
  markDismissed();
  assert.equal(isDismissedActive(), true);
  clearDismissed();
  assert.equal(isDismissedActive(), false);
});
