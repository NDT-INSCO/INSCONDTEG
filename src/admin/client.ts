import { ADMIN_API } from './contract';
import type { Announcement, AnnouncementInput, DashboardData, ManagedQuote, QuotePage, QuoteStatus } from './contract';

export class AdminApiError extends Error {
  constructor(public readonly code: string, public readonly retryAfter = 0) {
    super(code);
  }
}

async function request<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const deadline = AbortSignal.timeout(12_000);
  const response = await fetch(`${ADMIN_API}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    signal: options.signal ? AbortSignal.any([deadline, options.signal]) : deadline,
    headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return undefined as T;
  if (!response.headers.get('content-type')?.includes('application/json')) {
    // A Pages 404 or a static SPA fallback isn't an admin server.
    throw new AdminApiError(response.status < 500 ? 'not_configured' : 'unavailable');
  }
  const data = await response.json();
  if (!response.ok) throw new AdminApiError(data?.error || 'unavailable', Number(response.headers.get('Retry-After')) || 0);
  return data as T;
}

export const adminClient = {
  login: (password: string) => request<void>('/login', { method: 'POST', body: { password } }),
  logout: () => request<void>('/logout', { method: 'POST' }),
  dashboard: (signal?: AbortSignal) => request<DashboardData>('/dashboard', { signal }),
  quotes: (search: string, status: QuoteStatus | '', page: number, signal: AbortSignal) => {
    const params = new URLSearchParams({ q: search, status, page: String(page) });
    return request<QuotePage>(`/quotes?${params}`, { signal });
  },
  quote: (reference: string, signal: AbortSignal) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { signal }),
  updateQuote: (reference: string, status: QuoteStatus) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { method: 'PATCH', body: { status } }),
  saveAnnouncement: (input: AnnouncementInput) => request<Announcement>('/announcement', { method: 'PUT', body: input }),
};
