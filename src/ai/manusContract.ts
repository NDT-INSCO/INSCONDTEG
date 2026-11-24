/**
 * Manus — the second AI engine, stated once.
 *
 * Gemini answers in a stream in under a second, which is what the tutor and the copilot
 * want. Manus answers differently: a task is *created* and an autonomous agent works on
 * it, sometimes for minutes. Both facts are true at the same time, so the contract here
 * is deliberately shaped around that difference instead of pretending Manus is a chat
 * completion endpoint:
 *
 *  - every call has a `task_id` that can be read again later, and a `task_url` a human
 *    can open in the Manus app;
 *  - "wait for it" is a *budget*, not a timeout that loses the work — when the budget
 *    runs out the task keeps running and the client is told its id instead of an error.
 *
 * The API key never leaves the server. The browser talks to `/api/ai/manus*` on our own
 * gateway, exactly like it talks to `/api/ai/tutor`.
 *
 * Upstream reference (v2): `POST /v2/task.create`, `GET /v2/task.detail`,
 * `GET /v2/task.listMessages`, all authenticated with `x-manus-api-key`.
 */

export const MANUS_BASE_URL = 'https://api.manus.ai';

/** The upstream paths, versioned in one place so a v3 rename is a one-line change. */
export const MANUS_PATHS = {
  createTask: '/v2/task.create',
  taskDetail: '/v2/task.detail',
  listMessages: '/v2/task.listMessages',
} as const;

/** Our own routes. The browser only ever calls these. */
export const MANUS_ENDPOINTS = {
  /** POST — create a task and wait inside the request budget. */
  ask: '/api/ai/manus',
  /** GET ?task_id= — read a task that is still running, or collect a finished one. */
  task: '/api/ai/manus/task',
  /** GET — is Manus configured, and does the key authenticate? */
  status: '/api/ai/manus/status',
} as const;

export const MANUS_LIMITS = {
  /** Characters accepted in one Manus message. */
  messageChars: 6000,
  /** One upstream HTTP call. Manus answers its own API fast; the agent runs later. */
  upstreamTimeoutMs: 15_000,
  /** Gap between polls while a task runs. */
  pollMs: 2_000,
  /** Longest a single gateway request will wait for an answer before handing back the id. */
  waitMs: 45_000,
  /** Below this remaining budget a fallback is not worth starting. */
  minWaitMs: 9_000,
} as const;

/** `task.detail` status vocabulary. `unknown` is for a shape we have not seen. */
export type ManusTaskStatus = 'running' | 'stopped' | 'waiting' | 'error' | 'deleted' | 'unknown';

export type ManusErrorCode =
  | 'not_configured'
  | 'unauthenticated'
  | 'invalid_request'
  | 'not_found'
  | 'rate_limited'
  | 'timeout'
  | 'upstream_error';

export interface ManusTaskHint {
  taskId: string;
  taskUrl?: string;
}

/** One task as the gateway reports it — the answer when there is one, the id always. */
export interface ManusTaskView extends ManusTaskHint {
  status: ManusTaskStatus;
  /** The agent's latest text. Partial while `status` is `running`. */
  answer?: string;
  title?: string;
  elapsedMs: number;
  /** Credits the task consumed, when Manus reports it. */
  credits?: number;
}

export interface ManusAskRequest {
  message: string;
  language: 'ar' | 'en';
  title?: string;
  /**
   * How long this request may wait before handing the task id back. Optional, clamped,
   * and never longer than `MANUS_LIMITS.waitMs` — a caller cannot hold a request open
   * past the server's own budget.
   */
  waitMs?: number;
}

export interface ManusStatusReport {
  configured: boolean;
  /** Whether a Gemini failure is retried on Manus automatically. */
  autoFallback: boolean;
  profile: string;
  /** Present after a probe: `ok` means the key authenticated. */
  auth?: 'ok' | 'unauthenticated' | 'unreachable' | ManusErrorCode;
  lastError?: { code: ManusErrorCode; at: string };
  baseUrl: string;
}

/** A task that will not change on its own: read the answer now. */
export function isTerminalStatus(status: ManusTaskStatus): boolean {
  return status === 'stopped' || status === 'error' || status === 'deleted';
}

export function isManusConfigured(env: NodeJS.ProcessEnv): boolean {
  return (env.MANUS_API_KEY || '').trim().length > 0;
}

/** `MANUS_AGENT_PROFILE` lets the operator choose cost: lite, standard, max, max-ultra. */
export function manusProfile(env: NodeJS.ProcessEnv): string {
  return (env.MANUS_AGENT_PROFILE || '').trim() || 'standard';
}

/**
 * On by default: the whole point of a second engine is that it answers when the first
 * one is rate-limited. `MANUS_AUTO_FALLBACK=false` turns the automatic retry off while
 * leaving the explicit `/api/ai/manus` routes working.
 */
export function isManusAutoFallback(env: NodeJS.ProcessEnv): boolean {
  return (env.MANUS_AUTO_FALLBACK || '').trim().toLowerCase() !== 'false';
}

export function normaliseManusStatus(raw: unknown): ManusTaskStatus {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (
    value === 'running' ||
    value === 'stopped' ||
    value === 'waiting' ||
    value === 'error' ||
    value === 'deleted'
  ) {
    return value;
  }
  return 'unknown';
}

export type ManusParse<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Validate a request body before it costs anything: Manus bills credits per task, so a
 * malformed body must be a 400 and must never create one.
 */
export function normaliseManusAsk(body: unknown): ManusParse<ManusAskRequest> {
  const input = (body ?? {}) as Record<string, unknown>;
  const rawMessage = input.message ?? input.prompt ?? input.text;
  if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return { ok: false, error: 'A non-empty `message` is required.' };
  }
  const message = rawMessage.trim();
  if (message.length > MANUS_LIMITS.messageChars) {
    return { ok: false, error: `The message is longer than ${MANUS_LIMITS.messageChars} characters.` };
  }
  const language = input.language === 'en' ? 'en' : 'ar';
  const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
  const rawWait = typeof input.wait_ms === 'number' ? input.wait_ms : Number(input.wait_ms);
  const waitMs = Number.isFinite(rawWait)
    ? Math.min(MANUS_LIMITS.waitMs, Math.max(1000, Math.round(rawWait)))
    : undefined;
  return {
    ok: true,
    value: {
      message,
      language,
      ...(rawTitle ? { title: rawTitle.slice(0, 120) } : {}),
      ...(waitMs ? { waitMs } : {}),
    },
  };
}

/** The sentence a reader gets. Technical truth for the operator, plain words for the user. */
export function manusFailureMessage(code: ManusErrorCode, language: 'ar' | 'en'): string {
  const ar: Record<ManusErrorCode, string> = {
    not_configured: 'مانوس غير مُهيّأ على هذا الخادم (MANUS_API_KEY غير موجود).',
    unauthenticated: 'مفتاح مانوس مرفوض. حدّث MANUS_API_KEY في متغيّرات البيئة.',
    invalid_request: 'طلب مانوس غير صالح: اكتب رسالة أقصر أو ابدأ مهمة جديدة.',
    not_found: 'مهمة مانوس غير موجودة أو حُذفت.',
    rate_limited: 'مانوس وصل إلى حدّ الطلبات. جرّب بعد دقيقة — المهمة السابقة قد تكون اكتملت.',
    timeout: 'مانوس لم يُكمل المهمة داخل الوقت المتاح. المهمة ما زالت تعمل، ويمكن متابعتها بالمعرّف.',
    upstream_error: 'تعذّر الوصول إلى مانوس الآن.',
  };
  const en: Record<ManusErrorCode, string> = {
    not_configured: 'Manus is not configured on this server (no MANUS_API_KEY).',
    unauthenticated: 'Manus rejected the key. Update MANUS_API_KEY in the environment.',
    invalid_request: 'Invalid Manus request: send a shorter message or start a new task.',
    not_found: 'That Manus task does not exist or was deleted.',
    rate_limited: 'Manus is rate-limiting us. Try again in a minute — the earlier task may have finished.',
    timeout: 'Manus did not finish inside the budget. The task is still running; follow it by id.',
    upstream_error: 'Manus is unreachable right now.',
  };
  return language === 'en' ? en[code] : ar[code];
}
