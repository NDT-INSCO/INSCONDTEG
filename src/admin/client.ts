import type {
  AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { isStaticPages } from '../utils/staticPages';
import { ADMIN_API, PAGES_ADMIN_API, isAdminToken, isQuoteStatus } from './contract';
import { approvedPagesAdminOrigin, isInscoPages } from './pages';
import type { Announcement, AnnouncementInput, DashboardData, ManagedQuote, PasskeySettings, PasskeySummary, QuotePage, QuoteStatus } from './contract';
import { FACTORY_DRAFT_PATH, FACTORY_LIMITS, normaliseFactoryDraft, type FactoryRequest } from './factory';
import type { AgentTask, AgentTaskAgent, AgentTaskStatus } from '../ai/agentTasksContract';

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
    && (services.factoryAiConfigured === undefined || typeof services.factoryAiConfigured === 'boolean')
    && typeof announcement?.enabled === 'boolean' && (announcement.updatedAt === null || validDate(announcement.updatedAt))
    && typeof message?.ar === 'string' && typeof message.en === 'string';
}

/** A Pages bearer is scoped to this portal instance and is never persisted. */
export function createAdminClient(pagesOrigin?: string | null) {
  const pages = approvedPagesAdminOrigin(pagesOrigin ?? undefined);
  let session: string | undefined;
  let revision = 0;
  function clearSession() {
    session = undefined;
    revision += 1;
  }

  async function request<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal; expectEmpty?: boolean; timeoutMs?: number } = {}): Promise<T> {
    if (pages ? (typeof window === 'undefined' || window.top !== window || !isInscoPages(window.location)) : isStaticPages()) {
      throw new AdminApiError('not_configured');
    }
    const requestRevision = revision;
    const token = pages ? session : undefined;
    // Keep older passkey-capable Safari versions working without AbortSignal.any().
    const controller = new AbortController();
    const abort = () => controller.abort();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; abort(); }, options.timeoutMs ?? 12_000);
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await fetch(`${pages ? `${pages}${PAGES_ADMIN_API}` : ADMIN_API}${path}`, {
        method: options.method ?? 'GET',
        credentials: pages ? 'omit' : 'same-origin',
        ...(pages ? { referrerPolicy: 'no-referrer' } : {}),
        redirect: 'error',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
        if (code === 'signed_out' && token && requestRevision === revision) clearSession();
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

  async function authenticate(path: string, body: unknown, signal: AbortSignal): Promise<void> {
    const attempt = revision;
    const data = await request<unknown>(path, { method: 'POST', body, signal, expectEmpty: !pages });
    if (!pages) return;
    if (signal.aborted || attempt !== revision) throw new DOMException('Cancelled', 'AbortError');
    const token = record(data)?.token;
    if (!isAdminToken(token)) throw new AdminApiError('invalid_response');
    session = token;
    revision += 1;
  }

  async function passkeyOptions<T>(path: string, body: unknown, signal: AbortSignal): Promise<{ optionsJSON: T; ceremony?: string }> {
    const data = await request<unknown>(path, { method: 'POST', body, signal });
    if (!pages) return { optionsJSON: data as T };
    const payload = record(data);
    if (!record(payload?.options) || !isAdminToken(payload?.ceremony)) throw new AdminApiError('invalid_response');
    return { optionsJSON: payload.options as T, ceremony: payload.ceremony };
  }

  function passkeyProof(response: RegistrationResponseJSON | AuthenticationResponseJSON, ceremony?: string) {
    if (pages && !isAdminToken(ceremony)) throw new AdminApiError('passkey_challenge_expired');
    return pages ? { response, ceremony } : { response };
  }

  return {
    clearSession,
    login: (password: string, signal: AbortSignal) => authenticate('/login', { password }, signal),
    logout: async () => {
      await request<void>('/logout', { method: 'POST', expectEmpty: true });
      clearSession();
    },
    dashboard: async (signal?: AbortSignal) => {
      const data = await request<unknown>('/dashboard', { signal });
      if (!isDashboard(data)) throw new AdminApiError('invalid_response');
      return data;
    },
    factoryDraft: async (input: FactoryRequest, signal: AbortSignal) => {
      const raw = await request<unknown>(FACTORY_DRAFT_PATH, { method: 'POST', body: input, signal, timeoutMs: FACTORY_LIMITS.requestMs + 5_000 });
      const draft = normaliseFactoryDraft(raw);
      if (!draft) throw new AdminApiError('factory_invalid_draft');
      return draft;
    },
    agentTasks: async (signal?: AbortSignal) => {
      const data = await request<{ items: AgentTask[] }>('/agents/tasks', { signal });
      if (!data || !Array.isArray(data.items)) throw new AdminApiError('invalid_response');
      return data.items;
    },
    proposeAgentTask: (input: { agent: AgentTaskAgent; title: string; summary: string }) =>
      request<AgentTask>('/agents/tasks', { method: 'POST', body: input }),
    reviewAgentTask: (id: string, decision: Extract<AgentTaskStatus, 'approved' | 'rejected'>) =>
      request<AgentTask>(`/agents/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: { decision } }),
    passkeyStatus: (signal: AbortSignal) => request<{ available: boolean }>('/passkeys/status', { signal }),
    passkeys: (signal: AbortSignal) => request<PasskeySettings>('/passkeys', { signal }),
    passkeyAuthOptions: (signal: AbortSignal) => passkeyOptions<PublicKeyCredentialRequestOptionsJSON>('/passkeys/authenticate/options', {}, signal),
    passkeyAuthVerify: (response: AuthenticationResponseJSON, signal: AbortSignal, ceremony?: string) =>
      authenticate('/passkeys/authenticate/verify', passkeyProof(response, ceremony), signal),
    passkeyRegisterOptions: (label: string, signal: AbortSignal) => passkeyOptions<PublicKeyCredentialCreationOptionsJSON>('/passkeys/register/options', { label }, signal),
    passkeyRegisterVerify: (response: RegistrationResponseJSON, signal: AbortSignal, ceremony?: string) =>
      request<PasskeySummary>('/passkeys/register/verify', { method: 'POST', body: passkeyProof(response, ceremony), signal }),
    removePasskey: (id: string, signal: AbortSignal) => request<void>(`/passkeys/${encodeURIComponent(id)}`, { method: 'DELETE', signal, expectEmpty: true }),
    quotes: (search: string, status: QuoteStatus | '', page: number, signal: AbortSignal) => {
      const params = new URLSearchParams({ q: search, status, page: String(page) });
      return request<QuotePage>(`/quotes?${params}`, { signal });
    },
    quote: (reference: string, signal: AbortSignal) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { signal }),
    updateQuote: (reference: string, status: QuoteStatus) => request<ManagedQuote>(`/quotes/${encodeURIComponent(reference)}`, { method: 'PATCH', body: { status } }),
    saveAnnouncement: (input: AnnouncementInput) => request<Announcement>('/announcement', { method: 'PUT', body: input }),
  };
}

export type AdminClient = ReturnType<typeof createAdminClient>;
export const adminClient = createAdminClient();
