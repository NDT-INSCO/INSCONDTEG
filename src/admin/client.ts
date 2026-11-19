import type {
  AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { ADMIN_API } from './contract';
import type { Announcement, AnnouncementInput, DashboardData, ManagedQuote, PasskeySettings, PasskeySummary, QuotePage, QuoteStatus } from './contract';

export class AdminApiError extends Error {
  constructor(public readonly code: string, public readonly retryAfter = 0) {
    super(code);
  }
}

async function request<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  // Keep older passkey-capable Safari versions working without AbortSignal.any().
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 12_000);
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
    if (response.status === 204) return undefined as T;
    if (!response.headers.get('content-type')?.includes('application/json')) {
      // A Pages 404 or a static SPA fallback isn't an admin server.
      throw new AdminApiError(response.status < 500 ? 'not_configured' : 'unavailable');
    }
    const data = await response.json();
    if (!response.ok) throw new AdminApiError(data?.error || 'unavailable', Number(response.headers.get('Retry-After')) || 0);
    return data as T;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

export const adminClient = {
  login: (password: string) => request<void>('/login', { method: 'POST', body: { password } }),
  logout: () => request<void>('/logout', { method: 'POST' }),
  dashboard: (signal?: AbortSignal) => request<DashboardData>('/dashboard', { signal }),
  passkeyStatus: (signal: AbortSignal) => request<{ available: boolean }>('/passkeys/status', { signal }),
  passkeys: (signal: AbortSignal) => request<PasskeySettings>('/passkeys', { signal }),
  passkeyAuthOptions: (signal: AbortSignal) => request<PublicKeyCredentialRequestOptionsJSON>('/passkeys/authenticate/options', { method: 'POST', body: {}, signal }),
  passkeyAuthVerify: (response: AuthenticationResponseJSON, signal: AbortSignal) => request<void>('/passkeys/authenticate/verify', { method: 'POST', body: { response }, signal }),
  passkeyRegisterOptions: (label: string, signal: AbortSignal) => request<PublicKeyCredentialCreationOptionsJSON>('/passkeys/register/options', { method: 'POST', body: { label }, signal }),
  passkeyRegisterVerify: (response: RegistrationResponseJSON, signal: AbortSignal) => request<PasskeySummary>('/passkeys/register/verify', { method: 'POST', body: { response }, signal }),
  removePasskey: (id: string, signal: AbortSignal) => request<void>(`/passkeys/${encodeURIComponent(id)}`, { method: 'DELETE', signal }),
  quotes: (search: string, status: QuoteStatus | '', page: number, signal: AbortSignal) => {
    const params = new URLSearchParams({ q: search, status, page: String(page) });
    return request<QuotePage>(`/quotes?${params}`, { signal });
  },
  quote: (reference: string, signal: AbortSignal) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { signal }),
  updateQuote: (reference: string, status: QuoteStatus) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { method: 'PATCH', body: { status } }),
  saveAnnouncement: (input: AnnouncementInput) => request<Announcement>('/announcement', { method: 'PUT', body: input }),
};
