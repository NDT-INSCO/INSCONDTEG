/**
 * One contract for both ends of the tutor.
 *
 * The previous tutor was wired with three independent mismatches: the browser
 * posted `{topic}` while the server read `{prompt}`; the server answered
 * `{text}` while the browser read `{content}`; and the endpoint did not exist
 * on the static host at all. Every question therefore fell into a `catch` that
 * printed a canned paragraph as if it were an answer.
 *
 * This module is the single source of truth for the request, the response,
 * the limits and the error codes. It is imported by `server.ts` and by the
 * browser code, so a rename on one side breaks the build instead of the user.
 *
 * It contains no Node and no DOM API: it must stay importable from both.
 */

import type { NdeEdText } from '../data/ndeEd/types.js';

/* ------------------------------------------------------------------ */
/* models                                                              */
/* ------------------------------------------------------------------ */

/**
 * Model ids move fast: `gemini-3.7-flash` and `gemini-3.5-flash` were retired
 * on 2026-10-08 and are now routed to newer models. Keep the primary in one
 * place, allow an env override, and walk a short fallback chain rather than
 * failing the whole feature on one deprecation.
 */
export const TUTOR_MODELS = {
  primary: 'gemini-3.8-flash',
  deep: 'gemini-4-argon',
  fallbacks: ['gemini-3.6-flash', 'gemini-2.5-flash'] as const,
} as const;

/** `thinking_level` is the 4-Argon-era knob; low is right for short answers. */
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export const TUTOR_LIMITS = {
  /** Characters per message, after trimming. */
  messageChars: 4000,
  /** Messages kept from the conversation (the rest are dropped from the front). */
  messages: 20,
  /** Output tokens the model may spend on one answer. */
  outputTokens: 1600,
  /** Retrieved library passages attached to the prompt. */
  passages: 5,
  /** Characters of context sent to the model (retrieval is clipped to fit). */
  contextChars: 9000,
  /** Below this retrieval score the answer is refused instead of guessed. */
  minScore: 4.2,
} as const;

/* ------------------------------------------------------------------ */
/* request                                                             */
/* ------------------------------------------------------------------ */

export type TutorRole = 'user' | 'assistant';
export type TutorMode = 'explain' | 'compare' | 'code' | 'practice';
export type TutorLanguage = 'ar' | 'en';

export interface TutorMessage {
  role: TutorRole;
  content: string;
}

export interface TutorRequest {
  messages: TutorMessage[];
  language: TutorLanguage;
  /** Changes the system instruction, not the retrieval. */
  mode: TutorMode;
  /** Book ids the reader wants prioritised, e.g. ['edb-book-ut']. */
  focusBookIds?: string[];
}

export type TutorRequestInput = {
  messages?: unknown;
  prompt?: unknown;
  topic?: unknown;
  query?: unknown;
  language?: unknown;
  mode?: unknown;
  queryType?: unknown;
  focusBookIds?: unknown;
};

export interface TutorRequestResult {
  ok: boolean;
  value?: TutorRequest;
  errors: string[];
}

const MODES: TutorMode[] = ['explain', 'compare', 'code', 'practice'];

/** The old UI sent a `queryType`; keep the mapping so old clients still work. */
const LEGACY_MODE: Record<string, TutorMode> = {
  explain_method: 'explain',
  compare_methods: 'compare',
  code_clause: 'code',
  practice_question: 'practice',
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clampText(text: string): string {
  const clean = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return clean.length > TUTOR_LIMITS.messageChars ? clean.slice(0, TUTOR_LIMITS.messageChars) : clean;
}

/**
 * Accepts the current shape, the legacy `{topic, queryType}` shape and a bare
 * `{prompt}` string. Returns errors instead of throwing so the route can answer
 * 400 with a specific code.
 */
export function normaliseTutorRequest(input: unknown): TutorRequestResult {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['body must be a JSON object'] };
  }
  const body = input as TutorRequestInput;

  const rawMessages: TutorMessage[] = [];
  if (Array.isArray(body.messages)) {
    for (const item of body.messages) {
      if (!item || typeof item !== 'object') continue;
      const role = (item as { role?: unknown }).role === 'assistant' ? 'assistant' : 'user';
      const content = clampText(asString((item as { content?: unknown }).content));
      if (content) rawMessages.push({ role, content });
    }
  }

  if (rawMessages.length === 0) {
    const single = clampText(asString(body.prompt) || asString(body.topic) || asString(body.query));
    if (single) rawMessages.push({ role: 'user', content: single });
  }

  if (rawMessages.length === 0) errors.push('a question is required (messages[], prompt or topic)');
  if (rawMessages.length > 0 && rawMessages[rawMessages.length - 1].role !== 'user') {
    errors.push('the last message must come from the user');
  }

  const language: TutorLanguage = body.language === 'en' ? 'en' : 'ar';

  let mode: TutorMode = 'explain';
  if (typeof body.mode === 'string' && MODES.includes(body.mode as TutorMode)) {
    mode = body.mode as TutorMode;
  } else if (typeof body.queryType === 'string' && LEGACY_MODE[body.queryType]) {
    mode = LEGACY_MODE[body.queryType];
  }

  const focusBookIds = Array.isArray(body.focusBookIds)
    ? body.focusBookIds.filter((id): id is string => typeof id === 'string').slice(0, 3)
    : undefined;

  if (errors.length > 0) return { ok: false, errors };

  const messages = rawMessages.slice(-TUTOR_LIMITS.messages);
  return { ok: true, errors: [], value: { messages, language, mode, focusBookIds } };
}

/** The text the model should answer: everything except the system prompt. */
export function latestQuestion(request: TutorRequest): string {
  for (let index = request.messages.length - 1; index >= 0; index -= 1) {
    if (request.messages[index].role === 'user') return request.messages[index].content;
  }
  return '';
}

/* ------------------------------------------------------------------ */
/* retrieval + response                                                */
/* ------------------------------------------------------------------ */

export interface TutorCitation {
  id: string;
  kind: 'textbook' | 'course' | 'lesson';
  title: NdeEdText;
  bookId: string;
  pageNumber?: number;
  courseId?: string;
  /** BM25 score; exposed so the UI can be honest about weak matches. */
  score: number;
  /**
   * False when the passage comes from the academy corpus rather than the reviewed
   * course corpus. The UI must label those citations; the type makes it impossible to
   * forget that a citation is a claim about its source.
   */
  reviewed?: boolean;
}

export interface TutorMeta {
  model: string;
  citations: TutorCitation[];
  retrieved: number;
  /** false when retrieval found nothing above TUTOR_LIMITS.minScore. */
  confident: boolean;
  /** Milliseconds the answer took, server side. */
  elapsedMs: number;
  /** Which library the citations came from — the reader is told, not left to guess. */
  source?: 'reviewed' | 'academy' | 'none';
}

/**
 * What the upstream actually said, in a vocabulary the server can act on.
 *
 * `upstream_error` used to be the only answer the gateway could give, so a quota hit
 * (429), a rejected key (401) and a retired model id (404) all read the same to the
 * reader: "the model is unreachable". They need different responses — wait, fix the
 * key, or move to the next model — so the distinction is made here, from the message
 * the SDK supplies.
 */
export type UpstreamSignal =
  | 'rate_limited'
  | 'model_busy'
  | 'key_rejected'
  | 'model_unavailable'
  | 'upstream_error';

export function classifyUpstreamError(error: unknown): UpstreamSignal {
  const message = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  if (/429|resource_exhausted|rate limit|quota|too many requests/.test(message)) return 'rate_limited';
  // Google's "high demand" 503. It is not the key and not a missing model: another
  // model in the chain can usually answer this second.
  if (/503|unavailable|high demand|overloaded|spikes in demand/.test(message)) return 'model_busy';
  if (/401|403|api[_ -]?key|unauthenticated|permission_denied|invalid authentication/.test(message)) {
    return 'key_rejected';
  }
  if (/404|not found|not_found|does not exist|unsupported model|invalid model/.test(message)) {
    return 'model_unavailable';
  }
  return 'upstream_error';
}

export type TutorErrorCode =
  | 'not_configured'
  | 'invalid_request'
  | 'rate_limited'
  | 'budget_exhausted'
  | 'timeout'
  | 'model_busy'
  | 'key_rejected'
  | 'upstream_error';

export interface TutorFailure {
  code: TutorErrorCode;
  message: string;
  retryAfterSeconds?: number;
  /**
   * What the provider actually said, shortened and stripped of anything
   * credential-shaped. A generic sentence cannot be debugged; this can.
   */
  upstream?: UpstreamDetail;
}

export interface UpstreamDetail {
  signal: UpstreamSignal;
  detail: string;
}

/**
 * Shorten a provider message to something safe to show: no `key=…`, no `AIza…`,
 * no newlines, and at most 200 characters.
 */
/** Google's own wording, when the SDK wrapped it inside a JSON blob. */
export function providerMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const match = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  return (match ? match[1] : raw).replace(/\\"/g, '"').replace(/\\n/g, ' ');
}

export function sanitiseUpstreamDetail(error: unknown): string {
  const raw = providerMessage(error)
    .replace(/\bkey=[^&\s"']+/gi, 'key=***')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, 'AIza***')
    .replace(/\s+/g, ' ')
    .trim();
  // Both ends matter: an SDK wrapper puts its noise first and Google's sentence last.
  return raw.length <= 200 ? raw : `${raw.slice(0, 120)} … ${raw.slice(-70)}`;
}

export type TutorStreamEvent =
  | { type: 'meta'; meta: TutorMeta }
  | { type: 'delta'; text: string }
  | { type: 'error'; error: TutorFailure }
  | { type: 'done' };

export interface TutorStatus {
  configured: boolean;
  /** Why it is off, when it is off. Shown to the reader verbatim. */
  reason: 'no_key' | 'client_init_failed' | 'unreachable' | 'ok';
  model: string;
  deepModel: string;
  limits: typeof TUTOR_LIMITS;
  /**
   * The last upstream failure, as a category and a timestamp — never a message and
   * never a key. It is what makes "the model is unreachable" diagnosable from outside.
   */
  lastUpstream?: {
    signal: UpstreamSignal;
    at: string;
    detail?: string;
    /** Which model said what, in order — the chain is otherwise invisible. */
    attempts?: { model: string; signal: UpstreamSignal }[];
  };
  /**
   * The *shape* of the configured key — never the key. Enough to tell a truncated
   * paste or a stray quote from a key that Google has revoked.
   */
  keyShape?: { length: number; looksLikeAiStudioKey: boolean };
  /**
   * `error` is set only when the corpus itself could not be read — never guessed.
   * `source` says which library is answering: reviewed courses, the unreviewed academy
   * corpus, or nothing at all (in which case the tutor declines).
   */
  retrieval: {
    documents: number;
    ready: boolean;
    source?: 'reviewed' | 'academy' | 'none';
    /** How many of those documents came from the reviewed course corpus. */
    reviewed?: number;
    error?: string;
  };
  /** Which Google interface the server will call: `interactions` is primary. */
  transport?: 'auto' | 'interactions' | 'legacy' | string;
}

export const TUTOR_ENDPOINTS = {
  status: '/api/ai/status',
  tutor: '/api/ai/tutor',
  /** Old path kept alive so a cached browser bundle does not 404 mid-session. */
  legacyTutor: '/api/ai/educational-tutor',
} as const;

/* ------------------------------------------------------------------ */
/* server-sent events                                                  */
/* ------------------------------------------------------------------ */

/** One SSE frame. `event:` is omitted on purpose: the JSON carries the type. */
export function encodeSse(event: TutorStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export interface SseParseResult {
  events: TutorStreamEvent[];
  rest: string;
}

function isStreamEvent(value: unknown): value is TutorStreamEvent {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return type === 'meta' || type === 'delta' || type === 'error' || type === 'done';
}

/**
 * Incremental SSE parser. Keeps the trailing partial frame in `rest` so a chunk
 * boundary in the middle of a JSON object cannot corrupt the stream.
 */
export function parseSseBuffer(buffer: string): SseParseResult {
  const events: TutorStreamEvent[] = [];
  const frames = buffer.split('\n\n');
  const rest = frames.pop() ?? '';
  for (const frame of frames) {
    for (const line of frame.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') {
        events.push({ type: 'done' });
        continue;
      }
      try {
        const parsed = JSON.parse(payload) as unknown;
        if (isStreamEvent(parsed)) events.push(parsed);
      } catch {
        // A malformed frame is dropped; the stream continues.
      }
    }
  }
  return { events, rest };
}

export function failureMessage(code: TutorErrorCode, language: TutorLanguage): string {
  const ar: Record<TutorErrorCode, string> = {
    not_configured:
      'المستشار الذكي غير مُهيّأ على هذا الخادم. المكتبة والمناهج تعمل بالكامل، لكن الأسئلة الحرة تحتاج مفتاح Gemini على الخادم.',
    invalid_request: 'الطلب غير صالح: اكتب سؤالاً أقصر أو ابدأ محادثة جديدة.',
    rate_limited: 'الحد مؤقت — جرّب بعد دقيقة. وصلنا إلى حدّ استخدام النموذج في هذه اللحظة، والمكتبة والبحث يعملان دون تغيير.',
    budget_exhausted: 'تم الوصول إلى سقف الاستخدام اليومي للمستشار. جرّب غداً أو استخدم البحث في المكتبة.',
    timeout: 'استغرق النموذج وقتاً أطول من المسموح. أعد المحاولة أو اجعل السؤال أقصر.',
    model_busy:
      'الخدمة مزدحمة الآن — النموذج عليه ضغط مؤقت، جرّب بعد دقيقة. المكتبة والبحث يعملان دون تغيير.',
    key_rejected:
      'جوجل رفضت مفتاح Gemini الموجود على الخادم (400: API key not valid). المكتبة والبحث يعملان دون تغيير، والأسئلة الحرة تحتاج مفتاحاً جديداً من AI Studio في متغيّرات Vercel.',
    upstream_error: 'تعذّر الوصول إلى النموذج الآن. المكتبة والبحث يعملان دون تغيير.',
  };
  const en: Record<TutorErrorCode, string> = {
    not_configured:
      'The tutor is not configured on this server. The library and courses work fully; free-form questions need a Gemini key on the server.',
    invalid_request: 'Invalid request: shorten the question or start a new conversation.',
    rate_limited: 'Temporary limit — try again in a minute. The model reached its usage cap just now; the library and search keep working.',
    budget_exhausted: 'The daily tutor budget is used up. Try tomorrow or use library search.',
    timeout: 'The model took longer than allowed. Retry, or ask a shorter question.',
    model_busy:
      'The model is busy right now — a temporary spike in demand. Try again in a minute; the library and search keep working.',
    key_rejected:
      'Google rejected the Gemini key on this server (400: API key not valid). The library and search are unaffected; free-form questions need a new key from AI Studio in the Vercel environment variables.',
    upstream_error: 'The model is unreachable right now. The library and search are unaffected.',
  };
  return language === 'en' ? en[code] : ar[code];
}
