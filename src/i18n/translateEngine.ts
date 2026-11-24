/**
 * Machine-translation engine for the INSCO Translator Robot.
 *
 * The site is natively Arabic/English; every other language is translated
 * on the fly in the browser with two free, key-less providers:
 *
 *   1. MyMemory  — https://api.mymemory.translated.net (CORS-friendly)
 *   2. Google Translate (unofficial `gtx` endpoint, CORS-friendly)
 *
 * Results are cached in `localStorage` so a page translated once stays
 * translated on the next visit, even offline. No API keys are involved and
 * nothing is sent anywhere except the visible page text to those two
 * public translation endpoints.
 */

const CACHE_KEY = 'insco_translation_cache_v1';
const MAX_CACHE_ENTRIES = 600;
const REQUEST_TIMEOUT_MS = 10_000;

/** In-memory mirror of the persisted cache: `from|to|text` → translation. */
const memoryCache = new Map<string, string>();
let cacheLoaded = false;

function cacheKey(from: string, to: string, text: string): string {
  return `${from}|${to}|${text}`;
}

function loadCache(): void {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value) memoryCache.set(key, value);
    }
  } catch {
    /* corrupted or unavailable storage: start with an empty cache */
  }
}

function persistCache(): void {
  try {
    // Evict oldest entries first (Map preserves insertion order).
    while (memoryCache.size > MAX_CACHE_ENTRIES) {
      const oldest = memoryCache.keys().next().value;
      if (oldest === undefined) break;
      memoryCache.delete(oldest);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memoryCache)));
  } catch {
    /* private mode / quota: the in-memory cache still works for this visit */
  }
}

/** Number of cached translations (persisted + this visit). */
export function getCacheSize(): number {
  loadCache();
  return memoryCache.size;
}

/** Drop every cached translation. */
export function clearTranslationCache(): void {
  memoryCache.clear();
  cacheLoaded = true;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Should this string be sent to a translation provider?
 * Skips blanks, pure numbers/punctuation, URLs, e-mails and code-like
 * tokens so the robot never mangles phone numbers, links or identifiers.
 */
export function isTranslatableText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (!/\p{L}/u.test(trimmed)) return false;
  if (/^https?:\/\/\S+$/i.test(trimmed)) return false;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(trimmed)) return false;
  if (/^[\d\s+\-()./]+$/.test(trimmed)) return false;
  return true;
}

async function fetchWithTimeout(url: string, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function translateViaMyMemory(
  text: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<string> {
  const url =
    `https://api.mymemory.translated.net/get` +
    `?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${from}|${to}`)}`;
  const res = await fetchWithTimeout(url, signal);
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const json = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };
  const translated = json.responseData?.translatedText?.trim();
  if (!translated) throw new Error('MyMemory returned no translation');
  // MyMemory reports quota/quality problems inside the text itself.
  if (/MYMEMORY WARNING|INVALID|QUERY LENGTH LIMIT|NO QUERY SPECIFIED/i.test(translated)) {
    throw new Error('MyMemory rejected the request');
  }
  return translated;
}

async function translateViaGoogle(
  text: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<string> {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t` +
    `&q=${encodeURIComponent(text)}`;
  const res = await fetchWithTimeout(url, signal);
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const json = (await res.json()) as unknown[];
  const segments = json?.[0];
  if (!Array.isArray(segments)) throw new Error('Google Translate returned no translation');
  const translated = segments
    .map(seg => (Array.isArray(seg) ? String(seg[0] ?? '') : ''))
    .join('')
    .trim();
  if (!translated) throw new Error('Google Translate returned an empty translation');
  return translated;
}

export interface TranslateOptions {
  signal?: AbortSignal;
  /** Skip the persistent cache (used by tests / forced refresh). */
  bypassCache?: boolean;
}

/**
 * Translate one string, trying MyMemory first and Google Translate second.
 * Successful results are cached; failures throw the last provider error.
 */
export async function translateText(
  text: string,
  from: string,
  to: string,
  options: TranslateOptions = {},
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return text;
  loadCache();
  const key = cacheKey(from, to, trimmed);
  if (!options.bypassCache) {
    const cached = memoryCache.get(key);
    if (cached) return cached;
  }
  let lastError: unknown = null;
  for (const provider of [translateViaMyMemory, translateViaGoogle]) {
    try {
      const translated = await provider(trimmed, from, to, options.signal);
      memoryCache.set(key, translated);
      persistCache();
      return translated;
    } catch (error) {
      if (options.signal?.aborted) throw error;
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Translation failed');
}

export interface BatchResult {
  translations: Map<string, string>;
  failed: string[];
}

/**
 * Translate many strings at once (deduplicated, cache-first).
 * Never rejects: strings that fail on every provider land in `failed`
 * so the caller can keep the original text for them.
 */
export async function translateBatch(
  texts: readonly string[],
  from: string,
  to: string,
  options: TranslateOptions = {},
): Promise<BatchResult> {
  loadCache();
  const translations = new Map<string, string>();
  const failed: string[] = [];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const text of texts) {
    const trimmed = text.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    const cached = options.bypassCache ? undefined : memoryCache.get(cacheKey(from, to, trimmed));
    if (cached) translations.set(trimmed, cached);
    else unique.push(trimmed);
  }
  const results = await Promise.allSettled(
    unique.map(text => translateText(text, from, to, options)),
  );
  results.forEach((result, index) => {
    const text = unique[index];
    if (result.status === 'fulfilled') translations.set(text, result.value);
    else failed.push(text);
  });
  return { translations, failed };
}
