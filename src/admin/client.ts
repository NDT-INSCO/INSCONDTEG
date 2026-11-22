import type {
  AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { isStaticPages } from '../utils/staticPages';
import { ADMIN_API, isQuoteStatus } from './contract';
import type { Announcement, AnnouncementInput, DashboardData, ManagedQuote, PasskeySettings, PasskeySummary, QuotePage, QuoteStatus } from './contract';

export class AdminApiError extends Error {
  constructor(public readonly code: string, public readonly retryAfter = 0) {
    super(code);
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
const validDate = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const validCount = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** A 200 from a proxy or a stale build is not proof that the session exists. */
function isDashboard(value: unknown): value is DashboardData {
  const data = record(value);
  const totals = record(data?.totals);
  const services = record(data?.services);
  const announcement = record(data?.announcement);
  const message = record(announcement?.message);
  return !!data && validCount(data.sessionExpiresAt) && validDate(data.updatedAt)
    && !!totals && ['total', 'new', 'in_progress', 'closed', 'overdue'].every(key => validCount(totals[key]))
    && Array.isArray(data.activity) && data.activity.every(item => {
      const day = record(item);
      return validDate(day?.day) && validCount(day?.count);
    })
    && Array.isArray(data.recent) && data.recent.every(item => {
      const quote = record(item);
      return !!quote && typeof quote.reference === 'string' && typeof quote.companyName === 'string'
        && typeof quote.serviceType === 'string' && validDate(quote.receivedAt) && isQuoteStatus(quote.status);
    })
    && typeof services?.tutorConfigured === 'boolean' && typeof services.rfqNotificationsConfigured === 'boolean'
    && typeof announcement?.enabled === 'boolean' && (announcement.updatedAt === null || validDate(announcement.updatedAt))
    && typeof message?.ar === 'string' && typeof message.en === 'string';
}

async function request<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal; expectEmpty?: boolean } = {}): Promise<T> {
  if (isStaticPages()) throw new AdminApiError('not_configured');
  // Keep older passkey-capable Safari versions working without AbortSignal.any().
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; abort(); }, 12_000);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(`${ADMIN_API}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'same-origin',
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (response.status === 204 && options.expectEmpty) return undefined as T;
    if (response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
      if (response.status === 404) throw new AdminApiError('not_configured');
      throw new AdminApiError(response.ok ? 'invalid_response' : 'unavailable');
    }
    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new AdminApiError('invalid_response');
    }
    if (!response.ok) {
      const code = record(data)?.error;
      const retry = Number(response.headers.get('Retry-After'));
      // Only the signed-out response from the admin API should offer sign-in.
      if (code === 'signed_out' && response.status !== 401) throw new AdminApiError('invalid_response');
      throw new AdminApiError(typeof code === 'string' ? code : 'unavailable', Number.isFinite(retry) ? Math.max(0, retry) : 0);
    }
    if (options.expectEmpty) throw new AdminApiError('invalid_response');
    return data as T;
  } catch (error) {
    if (options.signal?.aborted || error instanceof AdminApiError) throw error;
    throw new AdminApiError(timedOut ? 'timeout' : 'unavailable');
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

export const adminClient = {
  login: (password: string, signal: AbortSignal) => request<void>('/login', { method: 'POST', body: { password }, signal, expectEmpty: true }),
  logout: () => request<void>('/logout', { method: 'POST', expectEmpty: true }),
  dashboard: async (signal?: AbortSignal) => {
    const data = await request<unknown>('/dashboard', { signal });
    if (!isDashboard(data)) throw new AdminApiError('invalid_response');
    return data;
  },
  passkeyStatus: (signal: AbortSignal) => request<{ available: boolean }>('/passkeys/status', { signal }),
  passkeys: (signal: AbortSignal) => request<PasskeySettings>('/passkeys', { signal }),
  passkeyAuthOptions: (signal: AbortSignal) => request<PublicKeyCredentialRequestOptionsJSON>('/passkeys/authenticate/options', { method: 'POST', body: {}, signal }),
  passkeyAuthVerify: (response: AuthenticationResponseJSON, signal: AbortSignal) => request<void>('/passkeys/authenticate/verify', { method: 'POST', body: { response }, signal, expectEmpty: true }),
  passkeyRegisterOptions: (label: string, signal: AbortSignal) => request<PublicKeyCredentialCreationOptionsJSON>('/passkeys/register/options', { method: 'POST', body: { label }, signal }),
  passkeyRegisterVerify: (response: RegistrationResponseJSON, signal: AbortSignal) => request<PasskeySummary>('/passkeys/register/verify', { method: 'POST', body: { response }, signal }),
  removePasskey: (id: string, signal: AbortSignal) => request<void>(`/passkeys/${encodeURIComponent(id)}`, { method: 'DELETE', signal, expectEmpty: true }),
  quotes: (search: string, status: QuoteStatus | '', page: number, signal: AbortSignal) => {
    const params = new URLSearchParams({ q: search, status, page: String(page) });
    return request<QuotePage>(`/quotes?${params}`, { signal });
  },
  quote: (reference: string, signal: AbortSignal) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { signal }),
  updateQuote: (reference: string, status: QuoteStatus) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { method: 'PATCH', body: { status } }),
  saveAnnouncement: (input: AnnouncementInput) => request<Announcement>('/announcement', { method: 'PUT', body: input }),
};
