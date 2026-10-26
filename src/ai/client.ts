/**
 * Browser side of the tutor.
 *
 * Two rules this file exists to enforce:
 *
 *  1. Never show canned text as if it were an answer. If the gateway is absent,
 *     unreachable, rate-limited or out of budget, the UI must say exactly that.
 *  2. Never hold an API key. The browser only talks to our own gateway, whose
 *     address comes from `VITE_AI_BASE_URL`; empty means same origin (the
 *     bundled Express server) and a static-only deploy correctly reports itself
 *     as unconfigured.
 */
import {
  parseSseBuffer,
  TUTOR_ENDPOINTS,
  TUTOR_LIMITS,
  TUTOR_MODELS,
  TutorFailure,
  TutorRequest,
  TutorStatus,
  TutorStreamEvent,
} from './contract';

type Env = { BASE_URL?: string; VITE_AI_BASE_URL?: string };

function env(): Env {
  try {
    return ((import.meta as unknown as { env?: Env }).env ?? {}) as Env;
  } catch {
    return {};
  }
}

/** Gateway base URL without a trailing slash; empty string means same origin. */
export function gatewayBase(): string {
  const configured = (env().VITE_AI_BASE_URL ?? '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  return '';
}

export function tutorUrl(path: string): string {
  return `${gatewayBase()}${path}`;
}

/** Honest default when the gateway cannot be reached at all. */
export function offlineStatus(reason: TutorStatus['reason'] = 'unreachable'): TutorStatus {
  return {
    configured: false,
    reason,
    model: TUTOR_MODELS.primary,
    deepModel: TUTOR_MODELS.deep,
    limits: TUTOR_LIMITS,
    retrieval: { documents: 0, ready: false },
  };
}

/**
 * Asks the gateway whether it can answer. A static deployment has no gateway,
 * so this resolves to `unreachable` instead of throwing — the UI then explains
 * the situation instead of pretending.
 */
export async function fetchTutorStatus(timeoutMs = 2500): Promise<TutorStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(tutorUrl(TUTOR_ENDPOINTS.status), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return offlineStatus('unreachable');
    const data = (await response.json()) as TutorStatus;
    if (typeof data?.configured !== 'boolean') return offlineStatus('unreachable');
    return data;
  } catch {
    return offlineStatus('unreachable');
  } finally {
    clearTimeout(timer);
  }
}

export interface StreamHandlers {
  onMeta?: (meta: Extract<TutorStreamEvent, { type: 'meta' }>['meta']) => void;
  onDelta?: (text: string) => void;
  onError?: (failure: TutorFailure) => void;
  onDone?: () => void;
}

export interface StreamOptions extends StreamHandlers {
  signal?: AbortSignal;
}

function failureFrom(status: number, body: unknown): TutorFailure {
  const parsed = body as { error?: Partial<TutorFailure> } | null;
  const code = parsed?.error?.code;
  const message = parsed?.error?.message;
  if (code) {
    return { code, message: message || 'Request failed' } as TutorFailure;
  }
  if (status === 429) return { code: 'rate_limited', message: 'Too many requests' };
  if (status === 400) return { code: 'invalid_request', message: 'Invalid request' };
  if (status === 503) return { code: 'not_configured', message: 'Tutor is not configured' };
  return { code: 'upstream_error', message: `HTTP ${status}` };
}

/**
 * Streams one answer. Resolves when the stream ends; never throws for a gateway
 * problem — the failure is delivered through `onError` so the UI has one path.
 */
export async function streamTutor(request: TutorRequest, options: StreamOptions = {}): Promise<void> {
  const { signal, onMeta, onDelta, onError, onDone } = options;

  let response: Response;
  try {
    response = await fetch(tutorUrl(TUTOR_ENDPOINTS.tutor), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') return;
    onError?.({ code: 'not_configured', message: 'Gateway unreachable' });
    return;
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    onError?.(failureFrom(response.status, body));
    return;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    // A gateway on an older build may answer with plain JSON: accept it.
    const body = (await response.json().catch(() => null)) as { text?: string; meta?: never } | null;
    if (body && typeof body.text === 'string') onDelta?.(body.text);
    else onError?.({ code: 'upstream_error', message: 'Unexpected response' });
    onDone?.();
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError?.({ code: 'upstream_error', message: 'No response body' });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;
      for (const event of parsed.events) {
        if (event.type === 'delta') onDelta?.(event.text);
        else if (event.type === 'meta') onMeta?.(event.meta);
        else if (event.type === 'error') onError?.(event.error);
        else if (event.type === 'done') onDone?.();
      }
    }
  } catch (error) {
    if ((error as Error)?.name !== 'AbortError') {
      onError?.({ code: 'upstream_error', message: 'Stream interrupted' });
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // already released
    }
  }
}
