import { isIP } from 'node:net';

export interface WebSearchSource {
  title: string;
  url: string;
  snippet: string;
  published?: string;
}

export interface WebSearchResult {
  provider: 'brave';
  query: string;
  sources: WebSearchSource[];
  elapsedMs: number;
}

export type WebSearchErrorCode =
  | 'not_configured'
  | 'invalid_query'
  | 'provider_error'
  | 'provider_timeout';

export class WebSearchError extends Error {
  constructor(
    readonly code: WebSearchErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'WebSearchError';
  }
}

export interface WebSearchOptions {
  apiKey?: string;
  maxResults?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|lt|gt);/gi, entity => ({
      '&nbsp;': ' ',
      '&amp;': '&',
      '&quot;': '"',
      '&lt;': '<',
      '&gt;': '>',
    })[entity.toLowerCase()] ?? ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Search results are untrusted data. Only expose ordinary public HTTPS links;
 * this module never fetches a result URL or follows a result redirect.
 */
export function normalisePublicHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (url.port && url.port !== '443') return null;
    if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost') ||
        host.endsWith('.local') || host.endsWith('.internal') || isIP(host) !== 0) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Calls only the fixed Brave Search API endpoint. The user's query is the only
 * user content sent; conversation history, attachments and private site data are
 * deliberately not accepted by this API.
 */
export async function searchPublicWeb(
  rawQuery: string,
  options: WebSearchOptions = {},
): Promise<WebSearchResult> {
  const query = cleanText(rawQuery, 500);
  if (query.length < 3) {
    throw new WebSearchError('invalid_query', 'Search query must contain at least 3 characters.');
  }
  const apiKey = (options.apiKey ?? process.env.BRAVE_SEARCH_API_KEY ?? '').trim();
  if (!apiKey) {
    throw new WebSearchError('not_configured', 'Public web search is not configured.');
  }

  const maxResults = Math.max(1, Math.min(8, Math.trunc(options.maxResults ?? 5)));
  const timeoutMs = Math.max(1000, Math.min(15000, Math.trunc(options.timeoutMs ?? 8000)));
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const started = now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = new URL('https://api.search.brave.com/res/v1/web/search');
    endpoint.searchParams.set('q', query);
    endpoint.searchParams.set('count', String(maxResults));
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new WebSearchError('provider_error', `Web search provider returned HTTP ${response.status}.`);
    }

    const payload = await response.json() as {
      web?: { results?: Array<{ title?: unknown; url?: unknown; description?: unknown; page_age?: unknown }> };
    };
    const rows = Array.isArray(payload.web?.results) ? payload.web.results : [];
    const seen = new Set<string>();
    const sources: WebSearchSource[] = [];

    for (const row of rows) {
      const url = normalisePublicHttpsUrl(row.url);
      const title = cleanText(row.title, 240);
      if (!url || !title || seen.has(url)) continue;
      seen.add(url);
      const snippet = cleanText(row.description, 900);
      const published = cleanText(row.page_age, 80);
      sources.push({
        title,
        url,
        snippet,
        ...(published ? { published } : {}),
      });
      if (sources.length >= maxResults) break;
    }

    return {
      provider: 'brave',
      query,
      sources,
      elapsedMs: Math.max(0, now() - started),
    };
  } catch (error) {
    if (error instanceof WebSearchError) throw error;
    if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new WebSearchError('provider_timeout', 'Web search provider timed out.');
    }
    throw new WebSearchError('provider_error', 'Web search provider request failed.');
  } finally {
    clearTimeout(timer);
  }
}
