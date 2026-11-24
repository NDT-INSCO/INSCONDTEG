/**
 * Geo-aware locale detection for the INSCO Translator Robot.
 *
 * Determines the visitor's country and preferred language from (in order):
 *   1. an explicit `?lang=` / `?translate=` URL
 *   2. an IP geolocation lookup (country → language)
 *   3. the browser language (`navigator.language` / `navigator.languages`)
 *   4. the browser time-zone (Intl → city → country heuristic)
 *
 * Only the visible IP-to-country call leaves the browser, and it goes to a
 * free, CORS-friendly country endpoint — no API keys, no cookies. If the
 * lookup fails or is blocked (VPN, private mode, quota), the browser
 * language is used so the page still localises.
 *
 * Auto-translation is opt-in by default: it only fires when the visitor has
 * never chosen a language before and hasn't dismissed the prompt. Any manual
 * change (the language toggle or the robot panel) marks the preference as
 * manual for 30 days and suppresses further auto-runs.
 */

import { detectBrowserLanguage, getLanguage, languageFromUrl, normalizeLanguageCode } from './languages';
import { COUNTRY_TO_LANGUAGE, getCountryName, getLanguageForCountry } from './countryMap';
import { translationRobot } from './translationStore';

export const GEO_DETECTED_KEY = 'insco_geo_detected_v1';
export const GEO_MANUAL_KEY = 'insco_robot_manual_v1';
export const GEO_DISMISSED_KEY = 'insco_geo_dismissed_v1';
export const GEO_AUTO_KEY = 'insco_geo_auto_v1';

const MANUAL_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DISMISSED_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h IP cache
const IP_TIMEOUT_MS = 2500;

export interface GeoLocation {
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  city?: string | null;
  flag: string;
}

export interface DetectedLocale extends GeoLocation {
  languageCode: string;
  languageNameNative?: string;
  languageNameEn?: string;
  method: 'url' | 'ip' | 'browser' | 'timezone' | 'cache';
  confidence: 'high' | 'medium' | 'low';
}

interface PersistedGeo {
  countryCode: string;
  languageCode: string;
  city?: string | null;
  at: number;
  method: DetectedLocale['method'];
}

interface IpResult {
  countryCode: string;
  countryName?: string;
  city?: string | null;
}

// ---------------------------------------------------------------------------
// persistence helpers
// ---------------------------------------------------------------------------

function readNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function isManualOverrideActive(): boolean {
  const at = readNumber(GEO_MANUAL_KEY);
  if (at === null) return false;
  return Date.now() - at < MANUAL_TTL_MS;
}

export function markManualOverride(): void {
  try {
    localStorage.setItem(GEO_MANUAL_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

export function clearManualOverride(): void {
  try {
    localStorage.removeItem(GEO_MANUAL_KEY);
  } catch {
    /* ignore */
  }
}

export function isDismissedActive(): boolean {
  const at = readNumber(GEO_DISMISSED_KEY);
  if (at === null) return false;
  return Date.now() - at < DISMISSED_TTL_MS;
}

export function markDismissed(): void {
  try {
    localStorage.setItem(GEO_DISMISSED_KEY, String(Date.now()));
  } catch { /* ignore */ }
}

export function clearDismissed(): void {
  try { localStorage.removeItem(GEO_DISMISSED_KEY); } catch { /* ignore */ }
}

function readPersistedGeo(): PersistedGeo | null {
  try {
    const raw = localStorage.getItem(GEO_DETECTED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGeo;
    if (!parsed?.countryCode || !parsed?.languageCode || !parsed?.at) return null;
    if (Date.now() - parsed.at > GEO_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedGeo(geo: PersistedGeo): void {
  try {
    localStorage.setItem(GEO_DETECTED_KEY, JSON.stringify(geo));
  } catch { /* ignore */ }
}

export function clearPersistedGeo(): void {
  try { localStorage.removeItem(GEO_DETECTED_KEY); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// IP geolocation — multiple CORS-friendly endpoints, first wins
// ---------------------------------------------------------------------------

const IP_ENDPOINTS: Array<{ url: string; parse: (json: unknown) => IpResult | null }> = [
  {
    url: 'https://ipapi.co/json/',
    parse: json => {
      const j = json as Record<string, unknown>;
      const cc = (j.country_code ?? j.countryCode) as string | undefined;
      if (!cc) return null;
      return { countryCode: String(cc).toUpperCase(), city: (j.city as string) ?? null };
    },
  },
  {
    url: 'https://countries.dev/ip',
    parse: json => {
      const j = json as Record<string, unknown>;
      const country = j.country as Record<string, unknown> | undefined;
      const cc = (country?.isoAlpha2 ?? country?.iso_alpha_2 ?? j.country_code) as string | undefined;
      if (!cc) return null;
      return { countryCode: String(cc).toUpperCase(), city: (j.city as string) ?? null };
    },
  },
  {
    url: 'https://ipwho.is/',
    parse: json => {
      const j = json as Record<string, unknown>;
      if (j.success === false) return null;
      const cc = (j.country_code ?? j.countryCode) as string | undefined;
      if (!cc) return null;
      return { countryCode: String(cc).toUpperCase(), city: (j.city as string) ?? null };
    },
  },
  {
    url: 'https://get.geojs.io/v1/ip/geo.json',
    parse: json => {
      const j = json as Record<string, unknown>;
      const cc = (j.country_code ?? j.countryCode) as string | undefined;
      if (!cc) return null;
      return { countryCode: String(cc).toUpperCase(), city: (j.city as string) ?? null };
    },
  },
];

async function fetchJsonWithTimeout(url: string, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function detectViaIp(signal?: AbortSignal): Promise<IpResult | null> {
  for (const endpoint of IP_ENDPOINTS) {
    if (signal?.aborted) return null;
    try {
      const json = await fetchJsonWithTimeout(endpoint.url, IP_TIMEOUT_MS, signal);
      const parsed = endpoint.parse(json);
      if (parsed?.countryCode && /^[A-Z]{2}$/.test(parsed.countryCode)) return parsed;
    } catch {
      // try next endpoint
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Browser / timezone detection
// ---------------------------------------------------------------------------

function languageToDetectedLocale(
  countryCode: string | null,
  languageCode: string,
  method: DetectedLocale['method'],
  confidence: DetectedLocale['confidence'],
  city?: string | null,
): DetectedLocale | null {
  const lang = getLanguage(languageCode);
  if (!lang) return null;
  const cc = countryCode ?? guessCountryFromLanguage(languageCode) ?? 'US';
  return {
    countryCode: cc.toUpperCase(),
    countryNameAr: getCountryName(cc, 'ar'),
    countryNameEn: getCountryName(cc, 'en'),
    city: city ?? null,
    flag: flagFor(cc),
    languageCode: lang.code,
    languageNameNative: lang.native,
    languageNameEn: lang.english,
    method,
    confidence,
  };
}

function flagFor(countryCode: string): string {
  const upper = countryCode.trim().toUpperCase();
  if (upper.length !== 2) return '🌍';
  const base = 0x1f1e6;
  try {
    return String.fromCodePoint(base + upper.charCodeAt(0) - 65, base + upper.charCodeAt(1) - 65);
  } catch {
    return '🌍';
  }
}

/** Best-guess country for a language when we only know the browser language. */
function guessCountryFromLanguage(langCode: string): string | null {
  const primary = langCode.split('-')[0].toLowerCase();
  const map: Record<string, string> = {
    ar: 'SA', en: 'US', fr: 'FR', es: 'ES', de: 'DE', ru: 'RU', tr: 'TR', ur: 'PK',
    fa: 'IR', hi: 'IN', it: 'IT', pt: 'PT', nl: 'NL', ja: 'JP', ko: 'KR', zh: 'CN',
    pl: 'PL', cs: 'CZ', uk: 'UA', el: 'GR', he: 'IL', th: 'TH', vi: 'VN', id: 'ID',
    ms: 'MY', sw: 'TZ', bn: 'BD', ta: 'IN', urd: 'PK',
  };
  return map[primary] ?? null;
}

export function detectViaBrowser(): DetectedLocale | null {
  const code = detectBrowserLanguage();
  if (!code) return null;
  return languageToDetectedLocale(null, code, 'browser', 'medium');
}

/** Timezone → country heuristic (covers the 60 most common zones). */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Bahrain': 'BH', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW',
  'Asia/Muscat': 'OM', 'Asia/Aden': 'YE', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Damascus': 'SY',
  'Asia/Baghdad': 'IQ', 'Asia/Gaza': 'PS', 'Asia/Hebron': 'PS', 'Asia/Jerusalem': 'IL', 'Asia/Tehran': 'IR',
  'Asia/Karachi': 'PK', 'Asia/Kolkata': 'IN', 'Asia/Dhaka': 'BD', 'Asia/Kathmandu': 'NP', 'Asia/Colombo': 'LK',
  'Asia/Kabul': 'AF', 'Asia/Yerevan': 'AM', 'Asia/Baku': 'AZ', 'Asia/Tbilisi': 'GE', 'Asia/Almaty': 'KZ',
  'Asia/Tashkent': 'UZ', 'Asia/Bishkek': 'KG', 'Asia/Dushanbe': 'TJ', 'Asia/Ashgabat': 'TM', 'Asia/Istanbul': 'TR',
  'Europe/Istanbul': 'TR', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES',
  'Europe/Lisbon': 'PT', 'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
  'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI', 'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Moscow': 'RU', 'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA',
  'Europe/Minsk': 'BY', 'Europe/Chisinau': 'MD', 'Africa/Cairo': 'EG', 'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ',
  'Africa/Tunis': 'TN', 'Africa/Tripoli': 'LY', 'Africa/Khartoum': 'SD', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Santiago': 'CL', 'America/Bogota': 'CO', 'America/Lima': 'PE',
  'America/Caracas': 'VE', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID', 'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Manila': 'PH', 'Australia/Sydney': 'AU', 'Pacific/Auckland': 'NZ',
};

export function detectViaTimezone(): DetectedLocale | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    const cc = TIMEZONE_TO_COUNTRY[tz] ?? TIMEZONE_TO_COUNTRY[tz.replace(/_/g, ' ')] ?? null;
    if (!cc) return null;
    const lang = getLanguageForCountry(cc);
    if (!lang) return null;
    return languageToDetectedLocale(cc, lang, 'timezone', 'low');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/** Resolve the visitor's locale, trying URL → cache → IP → browser → timezone. */
export async function detectLocale(signal?: AbortSignal): Promise<DetectedLocale | null> {
  // 1. Explicit URL always wins
  const fromUrl = typeof window !== 'undefined' ? languageFromUrl(window.location.search) : null;
  if (fromUrl) {
    const lang = getLanguage(fromUrl);
    if (lang) {
      const cc = guessCountryFromLanguage(fromUrl) ?? 'US';
      return {
        countryCode: cc,
        countryNameAr: getCountryName(cc, 'ar'),
        countryNameEn: getCountryName(cc, 'en'),
        city: null,
        flag: flagFor(cc),
        languageCode: lang.code,
        languageNameNative: lang.native,
        languageNameEn: lang.english,
        method: 'url',
        confidence: 'high',
      };
    }
  }

  // 2. Recent IP cache (24h) — avoids hammering the endpoint on every reload
  const cached = readPersistedGeo();
  if (cached) {
    const lang = getLanguage(cached.languageCode);
    if (lang) {
      return {
        countryCode: cached.countryCode,
        countryNameAr: getCountryName(cached.countryCode, 'ar'),
        countryNameEn: getCountryName(cached.countryCode, 'en'),
        city: cached.city ?? null,
        flag: flagFor(cached.countryCode),
        languageCode: lang.code,
        languageNameNative: lang.native,
        languageNameEn: lang.english,
        method: 'cache',
        confidence: 'high',
      };
    }
  }

  // 3. IP geolocation (primary for \"location entry\")
  try {
    const ip = await detectViaIp(signal);
    if (ip) {
      const langCode = getLanguageForCountry(ip.countryCode);
      if (langCode) {
        const lang = getLanguage(langCode)!;
        const detected: DetectedLocale = {
          countryCode: ip.countryCode,
          countryNameAr: getCountryName(ip.countryCode, 'ar'),
          countryNameEn: getCountryName(ip.countryCode, 'en'),
          city: ip.city ?? null,
          flag: flagFor(ip.countryCode),
          languageCode: lang.code,
          languageNameNative: lang.native,
          languageNameEn: lang.english,
          method: 'ip',
          confidence: 'high',
        };
        writePersistedGeo({
          countryCode: detected.countryCode,
          languageCode: detected.languageCode,
          city: detected.city,
          at: Date.now(),
          method: 'ip',
        });
        return detected;
      }
    }
  } catch {
    // fall through to browser
  }

  // 4. Browser language
  const viaBrowser = detectViaBrowser();
  if (viaBrowser) {
    // cache browser inference for a short period so we don't re-detect on every navigation
    writePersistedGeo({
      countryCode: viaBrowser.countryCode,
      languageCode: viaBrowser.languageCode,
      city: viaBrowser.city,
      at: Date.now(),
      method: 'browser',
    });
    return viaBrowser;
  }

  // 5. Timezone fallback
  const viaTz = detectViaTimezone();
  if (viaTz) {
    writePersistedGeo({
      countryCode: viaTz.countryCode,
      languageCode: viaTz.languageCode,
      city: viaTz.city,
      at: Date.now(),
      method: 'timezone',
    });
    return viaTz;
  }

  return null;
}

/**
 * Should the site auto-translate to `detected` without an explicit user tap?
 * Respects: URL override, existing robot target, manual override (30d),
 * and dismissed state (7d). Never auto-translates to the source language.
 */
export function shouldAutoTranslate(
  detected: DetectedLocale | null | undefined,
  source: 'ar' | 'en',
  activeRobotTarget: string | null | undefined,
): boolean {
  if (!detected) return false;
  if (detected.languageCode === source) return false;
  if (activeRobotTarget === detected.languageCode) return false;
  // If a robot translation is already active (user chose something), don't override it
  if (activeRobotTarget) return false;
  // Explicit ?lang= in URL means the link already decided — don't double-translate
  if (detected.method === 'url') return false;
  if (isManualOverrideActive()) return false;
  if (isDismissedActive()) return false;
  // Don't auto-translate from cache that was itself a low-confidence guess on first load?
  // Allow it — the cache is just to avoid extra IP calls.
  return true;
}

/** Persist that an auto-translation to `code` happened (for banner + dedup). */
export function markAutoApplied(code: string): void {
  try {
    localStorage.setItem(GEO_AUTO_KEY, JSON.stringify({ code, at: Date.now() }));
  } catch { /* ignore */ }
}

export function readAutoApplied(): { code: string; at: number } | null {
  try {
    const raw = localStorage.getItem(GEO_AUTO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code: string; at: number };
    if (!parsed?.code || !parsed?.at) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAutoApplied(): void {
  try { localStorage.removeItem(GEO_AUTO_KEY); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Convenience: run detection + auto-translate if eligible
// ---------------------------------------------------------------------------

export interface AutoTranslateOptions {
  source: 'ar' | 'en';
  /** Called when the detected language is natively supported (ar/en) — switch the site toggle instead of the robot. */
  onSwitchNativeLanguage?: (next: 'ar' | 'en') => void;
  signal?: AbortSignal;
}

/** Detect the visitor's locale and, when eligible, auto-translate the page. */
export async function autoDetectAndTranslate(options: AutoTranslateOptions): Promise<DetectedLocale | null> {
  const { source, onSwitchNativeLanguage, signal } = options;
  const fromUrl = typeof window !== 'undefined' ? languageFromUrl(window.location.search) : null;
  // URL-driven translation is handled by TranslatorRobot itself — don't duplicate
  if (fromUrl) return null;

  const detected = await detectLocale(signal);
  if (!detected) return null;

  const activeTarget = typeof document !== 'undefined' ? translationRobot.getTarget() : null;
  if (!shouldAutoTranslate(detected, source, activeTarget)) return detected;

  // Native ar/en: flip the site's own language toggle instead of machine-translating
  if ((detected.languageCode === 'ar' || detected.languageCode === 'en') && detected.languageCode !== source) {
    onSwitchNativeLanguage?.(detected.languageCode as 'ar' | 'en');
    markAutoApplied(detected.languageCode);
    return detected;
  }

  // Any other world language: use the robot
  if (detected.languageCode !== source) {
    await translationRobot.enable(detected.languageCode, { manual: false });
    markAutoApplied(detected.languageCode);
  }

  return detected;
}
