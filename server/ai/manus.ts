/**
 * The Manus client.
 *
 * Manus is an autonomous agent, not a completion endpoint: `task.create` returns a
 * `task_id` immediately and the work happens later. Two consequences shape this file:
 *
 *  1. **A deadline is not a failure.** When the budget runs out we return the task id
 *     and whatever the agent has written so far, because the task is still running and
 *     a reader can collect it a minute later. Throwing that away would waste the credits
 *     and the work.
 *  2. **Polling is explicit.** One upstream call per poll, each bounded, and no retry
 *     storm: Manus meters requests per minute and a loop that ignores that spends the
 *     allowance of the very requests that would fetch the answer.
 *
 * The key is read once from the environment and never logged, never echoed, and never
 * placed in an error message.
 */
import {
  MANUS_BASE_URL,
  MANUS_LIMITS,
  MANUS_PATHS,
  isManusAutoFallback,
  isManusConfigured,
  isTerminalStatus,
  manusProfile,
  normaliseManusStatus,
  type ManusAskRequest,
  type ManusErrorCode,
  type ManusTaskStatus,
  type ManusTaskView,
} from '../../src/ai/manusContract.js';

export class ManusError extends Error {
  readonly code: ManusErrorCode;
  readonly httpStatus?: number;

  constructor(code: ManusErrorCode, message: string, httpStatus?: number) {
    super(message);
    this.name = 'ManusError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export interface ManusProbe {
  auth: 'ok' | 'unauthenticated' | 'unreachable';
}

export interface ManusClient {
  readonly configured: boolean;
  readonly autoFallback: boolean;
  readonly profile: string;
  /** Create a task and wait up to `waitMs` for an answer. */
  ask(input: ManusAskRequest, options?: { waitMs?: number; signal?: AbortSignal }): Promise<ManusTaskView>;
  /** Read one task: its status, plus the newest agent message when there is one. */
  task(taskId: string, options?: { signal?: AbortSignal }): Promise<ManusTaskView>;
  /** Does the key authenticate? Costs nothing and creates no task. */
  probe(): Promise<ManusProbe>;
  lastError(): { code: ManusErrorCode; at: string } | undefined;
}

/* ------------------------------------------------------------------ */
/* plumbing                                                            */
/* ------------------------------------------------------------------ */

/**
 * A per-call deadline that also obeys the caller's abort signal.
 *
 * `AbortSignal.any` exists on recent Node, but the gateway also runs under older
 * runtimes; linking by hand keeps one behaviour everywhere.
 */
function withDeadline(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal?.aborted) onAbort();
  else signal?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise(resolve => {
    const timer = setTimeout(finish, ms);
    const onAbort = () => finish();
    function finish() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Manus' documented error codes → ours. Anything unknown stays an upstream error. */
function codeFromUpstream(raw: unknown, httpStatus: number): ManusErrorCode {
  switch (typeof raw === 'string' ? raw.trim().toLowerCase() : '') {
    case 'unauthenticated':
    case 'permission_denied':
      return 'unauthenticated';
    case 'invalid_argument':
      return 'invalid_request';
    case 'not_found':
      return 'not_found';
    case 'rate_limited':
      return 'rate_limited';
    default:
      break;
  }
  if (httpStatus === 401 || httpStatus === 403) return 'unauthenticated';
  // A bare 404 can mean a missing API route rather than an authenticated task lookup.
  if (httpStatus === 429) return 'rate_limited';
  if (httpStatus === 400 || httpStatus === 422) return 'invalid_request';
  return 'upstream_error';
}

/** Only point a reader at HTTPS links on the provider's own sites. */
function taskLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['manus.im', 'www.manus.im', 'manus.ai', 'www.manus.ai'].includes(url.host)
      && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

/* ------------------------------------------------------------------ */
/* the client                                                          */
/* ------------------------------------------------------------------ */

export function createManusClient(env: NodeJS.ProcessEnv): ManusClient {
  const apiKey = (env.MANUS_API_KEY || '').trim();
  const profile = manusProfile(env);
  let lastError: { code: ManusErrorCode; at: string } | undefined;
  let probeCache: { until: number; result: Promise<ManusProbe> } | undefined;

  function noteError(code: ManusErrorCode) {
    lastError = { code, at: new Date().toISOString() };
  }

  async function call(
    path: string,
    init: { method: 'GET' | 'POST'; body?: unknown; query?: Record<string, string>; probe?: boolean },
    signal?: AbortSignal
  ): Promise<Record<string, unknown>> {
    if (!apiKey) throw new ManusError('not_configured', 'MANUS_API_KEY is not set');
    const url = new URL(`${MANUS_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) url.searchParams.set(key, value);

    const deadline = withDeadline(signal, MANUS_LIMITS.upstreamTimeoutMs);
    try {
      deadline.signal.throwIfAborted();
      const response = await fetch(url, {
        method: init.method,
        headers: {
          'x-manus-api-key': apiKey,
          Accept: 'application/json',
          ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        redirect: 'error', // Never forward the provider key to a redirect destination.
        signal: deadline.signal,
      });
      const raw = await response.json().catch(() => null) as unknown;
      deadline.signal.throwIfAborted();
      const payload = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : null;
      if (!response.ok || payload?.ok === false) {
        const error = payload?.error as { code?: unknown } | undefined;
        const code = codeFromUpstream(payload?.ok === false ? error?.code : undefined, response.status);
        throw new ManusError(code, `HTTP ${response.status}`, response.status);
      }
      if (payload?.ok !== true) throw new ManusError('upstream_error', 'Manus returned an invalid response');
      return payload;
    } catch (error) {
      const code: ManusErrorCode = error instanceof ManusError ? error.code : deadline.signal.aborted ? 'timeout' : 'upstream_error';
      if (!init.probe && !signal?.aborted) noteError(code);
      throw error instanceof ManusError ? error : new ManusError(code, 'Manus request failed');
    } finally {
      deadline.done();
    }
  }

  /** The newest assistant message on a task, if the agent has written anything. */
  async function newestAnswer(taskId: string, signal?: AbortSignal): Promise<string | undefined> {
    const payload = await call(
      MANUS_PATHS.listMessages,
      { method: 'GET', query: { task_id: taskId, order: 'desc', limit: '20' } },
      signal
    );
    const messages = Array.isArray(payload.messages) ? (payload.messages as Array<Record<string, unknown>>) : [];
    for (const message of messages) {
      if (message?.type !== 'assistant_message') continue;
      const content = (message.assistant_message as { content?: unknown } | undefined)?.content;
      if (typeof content === 'string' && content.trim()) return content.trim();
    }
    return undefined;
  }

  async function detail(taskId: string, signal?: AbortSignal): Promise<{
    status: ManusTaskStatus;
    title?: string;
    taskUrl?: string;
    credits?: number;
  }> {
    const payload = await call(MANUS_PATHS.taskDetail, { method: 'GET', query: { task_id: taskId } }, signal);
    const task = (payload.task ?? {}) as Record<string, unknown>;
    const taskUrl = taskLink(task.task_url);
    return {
      status: normaliseManusStatus(task.status),
      ...(typeof task.title === 'string' && task.title ? { title: task.title } : {}),
      ...(taskUrl ? { taskUrl } : {}),
      ...(typeof task.credit_usage === 'number' ? { credits: task.credit_usage } : {}),
    };
  }

  return {
    configured: Boolean(apiKey),
    autoFallback: isManusAutoFallback(env),
    profile,

    async ask(input, options = {}) {
      const started = Date.now();
      const waitMs = Math.max(0, options.waitMs ?? MANUS_LIMITS.waitMs);
      const created = await call(
        MANUS_PATHS.createTask,
        {
          method: 'POST',
          body: {
            message: { content: [{ type: 'text', text: input.message, visibility: 'visible' }] },
            locale: input.language,
            agent_profile: profile,
            clear_connectors: true, // Do not inherit the account's enabled connectors for public prompts.
            share_visibility: 'private',
            async_title: true,
            ...(input.title ? { title: input.title } : {}),
          },
        },
        options.signal
      );

      const taskId = typeof created.task_id === 'string' ? created.task_id : '';
      if (!taskId) throw new ManusError('upstream_error', 'Manus returned no task_id');
      const taskUrl = taskLink(created.task_url);
      const view: ManusTaskView = {
        taskId,
        status: 'running',
        elapsedMs: 0,
        ...(typeof created.task_title === 'string' && created.task_title ? { title: created.task_title } : {}),
        ...(taskUrl ? { taskUrl } : {}),
      };

      const remaining = waitMs - (Date.now() - started);
      if (remaining > 0) {
        const lookup = withDeadline(options.signal, remaining);
        try {
          while (waitMs - (Date.now() - started) > MANUS_LIMITS.pollMs && !lookup.signal.aborted) {
            await sleep(MANUS_LIMITS.pollMs, lookup.signal);
            if (lookup.signal.aborted) break;
            const current = await detail(taskId, lookup.signal);
            Object.assign(view, current);
            if (current.status === 'waiting' || isTerminalStatus(current.status)) break;
          }
          if (!lookup.signal.aborted && view.status !== 'deleted') {
            const answer = await newestAnswer(taskId, lookup.signal);
            if (answer) view.answer = answer;
          }
        } catch {
          // A failed or timed-out read must not discard a task we already created.
        } finally {
          lookup.done();
        }
      }
      view.elapsedMs = Date.now() - started;
      return view;
    },

    async task(taskId, options = {}) {
      const started = Date.now();
      const current = await detail(taskId, options.signal);
      const view: ManusTaskView = { ...current, taskId, elapsedMs: 0 };
      if (current.status !== 'deleted') {
        try {
          const answer = await newestAnswer(taskId, options.signal);
          if (answer) view.answer = answer;
        } catch (error) {
          noteError(error instanceof ManusError ? error.code : 'upstream_error');
        }
      }
      view.elapsedMs = Date.now() - started;
      return view;
    },

    async probe() {
      if (!apiKey) return { auth: 'unreachable' };
      if (probeCache && probeCache.until > Date.now()) return probeCache.result;
      // Coalesce requests for one minute per worker. A valid-shaped synthetic ID
      // exercises authentication without creating a task or listing account data.
      const result = (async (): Promise<ManusProbe> => {
        try {
          await call(MANUS_PATHS.taskDetail, {
            method: 'GET', query: { task_id: '0000000000000000000000' }, probe: true,
          });
          return { auth: 'ok' };
        } catch (error) {
          if (error instanceof ManusError && error.code === 'not_found') return { auth: 'ok' };
          if (error instanceof ManusError && error.code === 'unauthenticated') return { auth: 'unauthenticated' };
          return { auth: 'unreachable' };
        }
      })();
      probeCache = { until: Date.now() + 60_000, result };
      return result;
    },

    lastError() {
      return lastError;
    },
  };
}

/** Whether the fallback is worth starting with the budget left on the clock. */
export function canWaitForManus(client: ManusClient, remainingMs: number): boolean {
  return client.configured && client.autoFallback && remainingMs >= MANUS_LIMITS.minWaitMs;
}

export { isManusConfigured };
