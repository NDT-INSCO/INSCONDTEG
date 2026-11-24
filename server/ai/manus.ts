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
  code?: ManusErrorCode;
  message?: string;
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
  signal?.addEventListener('abort', onAbort, { once: true });
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
  if (httpStatus === 404) return 'not_found';
  if (httpStatus === 429) return 'rate_limited';
  if (httpStatus === 400 || httpStatus === 422) return 'invalid_request';
  return 'upstream_error';
}

/** Short, credential-free version of an upstream sentence. */
function safeDetail(value: unknown): string {
  const text = typeof value === 'string' ? value : value instanceof Error ? value.message : '';
  return text
    .replace(/[A-Za-z0-9_-]{24,}/g, '***')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/* ------------------------------------------------------------------ */
/* the client                                                          */
/* ------------------------------------------------------------------ */

export function createManusClient(env: NodeJS.ProcessEnv): ManusClient {
  const apiKey = (env.MANUS_API_KEY || '').trim();
  const profile = manusProfile(env);
  let lastError: { code: ManusErrorCode; at: string } | undefined;

  function noteError(code: ManusErrorCode) {
    lastError = { code, at: new Date().toISOString() };
  }

  async function call(
    path: string,
    init: { method: 'GET' | 'POST'; body?: unknown; query?: Record<string, string> },
    signal?: AbortSignal
  ): Promise<Record<string, unknown>> {
    if (!apiKey) throw new ManusError('not_configured', 'MANUS_API_KEY is not set');
    const url = new URL(`${MANUS_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) url.searchParams.set(key, value);

    const deadline = withDeadline(signal, MANUS_LIMITS.upstreamTimeoutMs);
    let response: Response;
    try {
      response = await fetch(url, {
        method: init.method,
        headers: {
          'x-manus-api-key': apiKey,
          Accept: 'application/json',
          ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: deadline.signal,
      });
    } catch (error) {
      const code: ManusErrorCode = signal?.aborted ? 'timeout' : 'upstream_error';
      noteError(code);
      throw new ManusError(code, `Manus request failed: ${safeDetail(error)}`);
    } finally {
      deadline.done();
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      payload = {};
    }

    if (!response.ok || payload.ok === false) {
      const error = (payload.error ?? {}) as { code?: unknown; message?: unknown };
      const code = codeFromUpstream(error.code, response.status);
      noteError(code);
      throw new ManusError(code, safeDetail(error.message) || `HTTP ${response.status}`, response.status);
    }
    return payload;
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
    return {
      status: normaliseManusStatus(task.status),
      ...(typeof task.title === 'string' && task.title ? { title: task.title } : {}),
      ...(typeof task.task_url === 'string' && task.task_url ? { taskUrl: task.task_url } : {}),
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
            locale: input.language === 'ar' ? 'ar' : 'en',
            agent_profile: profile,
            ...(input.title ? { title: input.title } : {}),
          },
        },
        options.signal
      );

      const taskId = typeof created.task_id === 'string' ? created.task_id : '';
      if (!taskId) throw new ManusError('upstream_error', 'Manus returned no task_id');
      const view: ManusTaskView = {
        taskId,
        status: 'running',
        elapsedMs: 0,
        ...(typeof created.task_title === 'string' && created.task_title ? { title: created.task_title } : {}),
        ...(typeof created.task_url === 'string' && created.task_url ? { taskUrl: created.task_url } : {}),
      };

      while (Date.now() - started < waitMs && !options.signal?.aborted) {
        await sleep(MANUS_LIMITS.pollMs, options.signal);
        if (options.signal?.aborted) break;
        let current: Awaited<ReturnType<typeof detail>>;
        try {
          current = await detail(taskId, options.signal);
        } catch (error) {
          // A single failed poll must not discard the task we already created.
          noteError(error instanceof ManusError ? error.code : 'upstream_error');
          break;
        }
        view.status = current.status;
        if (current.title) view.title = current.title;
        if (current.taskUrl) view.taskUrl = current.taskUrl;
        if (typeof current.credits === 'number') view.credits = current.credits;
        view.elapsedMs = Date.now() - started;

        if (current.status === 'waiting') break; // needs a human; do not burn the allowance
        if (isTerminalStatus(current.status)) break;
      }

      // Collect the text for a finished task, and the partial text for a running one:
      // both are useful, and the second is what a reader sees if the budget ran out.
      try {
        const answer = await newestAnswer(taskId, options.signal);
        if (answer) view.answer = answer;
      } catch (error) {
        noteError(error instanceof ManusError ? error.code : 'upstream_error');
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
      if (!apiKey) return { auth: 'unreachable', code: 'not_configured', message: 'No MANUS_API_KEY' };
      try {
        // A probe that creates a task would cost credits. Reading an id that cannot
        // exist distinguishes the only two things we care about: the key works
        // (`not_found`) or it does not (`unauthenticated`).
        await call(MANUS_PATHS.taskDetail, { method: 'GET', query: { task_id: 'insco-probe-not-a-task' } });
        return { auth: 'ok' };
      } catch (error) {
        if (error instanceof ManusError) {
          if (error.code === 'not_found') return { auth: 'ok' };
          if (error.code === 'unauthenticated') return { auth: 'unauthenticated', code: error.code, message: error.message };
          if (error.code === 'rate_limited') return { auth: 'ok', code: error.code, message: error.message };
          return { auth: 'unreachable', code: error.code, message: error.message };
        }
        return { auth: 'unreachable', code: 'upstream_error', message: safeDetail(error) };
      }
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
