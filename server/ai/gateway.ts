/**
 * The AI gateway: tutor, site-manager, copilot and community-assist routes.
 *
 * It lives in its own module because two hosts serve exactly these routes and nothing
 * else: `server.ts` (a long-running Node process, for local dev and a dedicated host)
 * and `api/ai.ts` (the Vercel function, so the same origin the site is served from can
 * answer `/api/ai/*`). Before this split the routes lived inside `server.ts`, which the
 * Vercel build never ran — every AI call on the deployed site answered 404 while the
 * message blamed a missing `GEMINI_API_KEY`.
 *
 * `edbRoot` is passed in rather than derived: the directory that holds `edb/` is
 * `public` in development and `dist` on the deployed build.
 *
 * Nothing here is faked. Without a key the routes answer with their documented
 * `no_key` failure instead of inventing an answer.
 */
import express from 'express';
import type { Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  AGENT_ENDPOINTS,
  AGENT_MODELS,
  normaliseCommunityAssistRequest,
  normaliseSiteManagerRequest,
  normaliseUserCopilotRequest,
  type CommunityAssistResponse,
  type SiteManagerResponse,
  type UserCopilotResponse,
} from '../../src/ai/agentsContract.js';
import {
  classifyUpstreamError,
  encodeSse,
  sanitiseUpstreamDetail,
  failureMessage,
  latestQuestion,
  normaliseTutorRequest,
  TUTOR_ENDPOINTS,
  TUTOR_LIMITS,
  TUTOR_MODELS,
  TutorCitation,
  TutorErrorCode,
  TutorFailure,
  TutorStatus,
  UpstreamSignal,
} from '../../src/ai/contract.js';
import type { SearchHit } from '../../src/ai/search.js';
import { buildTutorLibrary, type TutorLibrary } from '../tutor/library.js';
import {
  ChainAttempt,
  isModelMissing,
  streamTutorText,
  TutorAiClient,
  TutorTransportMode,
} from '../../src/ai/transport.js';

/**
 * The AI settings, read from the environment in one place.
 *
 * `server.ts` logs them at boot and `api/ai.ts` never sees a log — both read from here,
 * so a model or transport change cannot apply to one host only.
 */
export function readAiEnv(env: NodeJS.ProcessEnv) {
  const apiKey = (env.GEMINI_API_KEY || env.API_KEY || '').trim();
  const model = (env.TUTOR_MODEL || '').trim() || TUTOR_MODELS.primary;
  return {
    apiKey,
    configured: Boolean(apiKey),
    models: [model, ...TUTOR_MODELS.fallbacks],
    mode: (env.TUTOR_API_MODE || 'auto').trim().toLowerCase(),
  };
}

/** Whether a Gemini key is present — the one fact both hosts must agree on. */
export function isTutorConfigured(env: NodeJS.ProcessEnv): boolean {
  return readAiEnv(env).configured;
}

export function createAiGateway(edbRoot: string): express.Router {
  const router = express.Router();

  // A static import on purpose. This used to be `await import('../tutor/reviewedLibrary.js')`,
  // which `tsx` resolves but a bundled serverless runtime does not: the request died with
  // an unhandled rejection and the deployed site answered 500 on `/api/ai/status`.
  let aiLibraryPromise: Promise<TutorLibrary> | null = null;
  let reviewedDocuments = 0;
  let libraryFailure = '';

  /**
   * The reviewed corpus if it has anything, the academy corpus if it does not, and
   * nothing if both are empty — in which order, and which one won, is reported by the
   * status route. A missing corpus is never thrown: the gateway must be able to say why
   * it cannot answer.
   */
  function loadAiLibrary(): Promise<TutorLibrary> {
    aiLibraryPromise ??= Promise.resolve().then(() => {
      const built = buildTutorLibrary(
        file => readFileSync(path.join(edbRoot, 'edb', file), 'utf8'),
        // The tutor's own tests and hosts can turn the fallback off; production wants it.
        { allowAcademyFallback: process.env.TUTOR_ALLOW_ACADEMY_FALLBACK !== 'false' }
      );
      reviewedDocuments = built.reviewedDocuments;
      libraryFailure = built.failure;
      if (built.failure) console.error('[ai] reviewed library unavailable:', built.failure);
      if (built.library.source === 'academy') {
        console.warn(`[ai] no reviewed courses; answering from the academy corpus (${built.library.documents} passages)`);
      }
      return built.library;
    });
    return aiLibraryPromise;
  }

const API_KEY = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
const MODEL_CHAIN: string[] = [
  (process.env.TUTOR_MODEL || '').trim() || TUTOR_MODELS.primary,
  ...TUTOR_MODELS.fallbacks,
];
const DAILY_BUDGET = Math.max(1, parseInt(process.env.TUTOR_DAILY_LIMIT || '300', 10));
const PER_MINUTE = Math.max(1, parseInt(process.env.TUTOR_RATE_PER_MINUTE || '10', 10));
const PER_DAY = Math.max(1, parseInt(process.env.TUTOR_RATE_PER_DAY || '200', 10));
const REQUEST_TIMEOUT_MS = Math.max(5000, parseInt(process.env.TUTOR_TIMEOUT_MS || '45000', 10));
// `interactions` is Google's current primary interface (2026). `legacy` keeps the
// old models.generateContentStream path for an old key/project. `auto` tries the
// Interactions API first and falls back once if the endpoint is unavailable.
const API_MODE = (process.env.TUTOR_API_MODE || 'auto').trim().toLowerCase();

let clientInitError = '';
const ai: GoogleGenAI | null = API_KEY
  ? (() => {
      try {
        return new GoogleGenAI({
          apiKey: API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
      } catch (error) {
        clientInitError = 'client_init_failed';
        console.error('[ai] Tutor client initialization failed.');
        return null;
      }
    })()
  : null;

/* ------------------------------------------------------------------ */
/* rate limiting + budget                                              */
/* ------------------------------------------------------------------ */

interface Bucket {
  minuteStart: number;
  minuteCount: number;
  dayStart: number;
  dayCount: number;
}

const buckets = new Map<string, Bucket>();
let globalDayStart = new Date().toISOString().slice(0, 10);
let globalCount = 0;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

type LimitResult = { allowed: true } | { allowed: false; failure: TutorFailure };

function takeToken(ip: string): LimitResult {
  const now = Date.now();
  const dayKey = todayKey();
  if (dayKey !== globalDayStart) {
    globalDayStart = dayKey;
    globalCount = 0;
    buckets.clear();
  }
  if (globalCount >= DAILY_BUDGET) {
    return {
      allowed: false,
      failure: { code: 'budget_exhausted', message: 'Daily tutor budget reached' },
    };
  }
  const bucket = buckets.get(ip) ?? { minuteStart: now, minuteCount: 0, dayStart: now, dayCount: 0 };
  if (now - bucket.minuteStart >= 60_000) {
    bucket.minuteStart = now;
    bucket.minuteCount = 0;
  }
  if (now - bucket.dayStart >= 86_400_000) {
    bucket.dayStart = now;
    bucket.dayCount = 0;
  }
  if (bucket.minuteCount >= PER_MINUTE) {
    buckets.set(ip, bucket);
    return {
      allowed: false,
      failure: { code: 'rate_limited', message: 'Too many requests this minute', retryAfterSeconds: 60 },
    };
  }
  if (bucket.dayCount >= PER_DAY) {
    buckets.set(ip, bucket);
    return {
      allowed: false,
      failure: { code: 'rate_limited', message: 'Daily limit for this client', retryAfterSeconds: 3600 },
    };
  }
  bucket.minuteCount += 1;
  bucket.dayCount += 1;
  buckets.set(ip, bucket);
  globalCount += 1;
  return { allowed: true };
}

const STATUS_CODE: Record<TutorErrorCode, number> = {
  not_configured: 503,
  invalid_request: 400,
  rate_limited: 429,
  budget_exhausted: 429,
  timeout: 504,
  model_busy: 503,
  key_rejected: 502,
  upstream_error: 502,
};

/**
 * The last upstream failure this instance saw, and its category.
 *
 * It is a category and a timestamp only: never the message, which can echo request
 * text, and never any part of the key. It is published on `/api/ai/status` so the
 * next failure can be diagnosed from a browser instead of from the Vercel log console.
 */
let lastUpstream: TutorStatus['lastUpstream'] = undefined;

/**
 * Turn a thrown upstream error into a code the client can act on.
 *
 * `upstream_error` used to be the answer for everything, which made a quota hit
 * indistinguishable from a rejected key or a retired model. A quota hit is both true
 * and temporary, so it is reported as `rate_limited` (429, "wait a moment") rather than
 * as a 502. The full message goes to the log; the signal goes to `/api/ai/status`.
 */
function upstreamFailure(
  error: unknown,
  timedOut: boolean,
  attempts?: ChainAttempt[]
): { code: TutorErrorCode; signal: UpstreamSignal; detail: string } {
  const detail = error instanceof Error ? error.message : String(error);
  if (timedOut) return { code: 'timeout', signal: 'upstream_error', detail };

  let signal = classifyUpstreamError(error);
  /**
   * The streaming SDK drops Google's sentence when it cannot parse the error body, so a
   * 400 can arrive as `API error occurred: {"httpMeta":{"response":{}}` with no wording
   * to match. The key belongs to the deployment, not to one route: if this instance
   * rejected it within the last ten minutes, this is the same failure.
   */
  if (signal === 'upstream_error' && lastUpstream?.signal === 'key_rejected') {
    const age = Date.now() - Date.parse(lastUpstream.at);
    if (Number.isFinite(age) && age < 10 * 60 * 1000) signal = 'key_rejected';
  }

  const safe = sanitiseUpstreamDetail(error);
  lastUpstream = {
    signal,
    at: new Date().toISOString(),
    detail: safe,
    ...(attempts && attempts.length ? { attempts: attempts.slice(-6) } : {}),
  };

  // A rejected key and a quota hit both have a precise answer; everything else stays
  // a generic upstream failure.
  const code: TutorErrorCode =
    signal === 'rate_limited' || signal === 'model_busy' || signal === 'key_rejected'
      ? signal
      : 'upstream_error';
  return { code, signal, detail: safe };
}

/** The failure body: the sentence the reader gets, plus a safe upstream snippet. */
function failureBody(
  code: TutorErrorCode,
  language: Parameters<typeof failureMessage>[1],
  upstream: { signal: UpstreamSignal; detail: string }
): TutorFailure {
  return { code, message: failureMessage(code, language), upstream };
}

/* ------------------------------------------------------------------ */
/* prompt assembly                                                     */
/* ------------------------------------------------------------------ */

const SYSTEM: Record<'ar' | 'en', string> = {
  ar: [
    'أنت مدرّس في أكاديمية إنسكو للفحص غير الإتلافي (NDT) والمعالجة الحرارية.',
    'قواعد ملزمة:',
    '1) أجب فقط من المقاطع المرفقة التي اجتازت المراجعة. إن لم يكفِ السياق فقل بصراحة: «لا أجد هذا في مكتبة إنسكو» واقترح ما يمكن البحث عنه.',
    '2) لا تخترع نص بند كود ولا رقم بند ولا نسبة قبول. عند ذكر كود، اذكر رقم البند فقط إن ورد في المقاطع.',
    '3) بعد كل فكرة استشهد بمعرّف المقطع بين قوسين مربعين مثل [edb-course-nde-ut#p3].',
    '4) هذه مادة دراسة ذاتية، وليست شهادة ولا تأهيلاً. لا تدّعِ اعتماداً من ASNT أو ISO.',
    '5) للتعلّم فقط. لا تصدر قرار قبول أو رفض أو صلاحية تشغيل، ولا تعطِ إعدادات ميدانية. أحِل ذلك للإجراء المكتوب والمهندس المختص.',
    '6) اكتب عربياً هندسياً واضحاً، بفقرات قصيرة، وبنقاط عند التعداد. لا تكرر السؤال.',
  ].join('\n'),
  en: [
    'You are a tutor at the INSCO academy for non-destructive testing and heat treatment.',
    'Binding rules:',
    '1) Answer only from the provided reviewed passages. If the context is insufficient, say plainly "I cannot find this in the INSCO library" and suggest what to search for.',
    '2) Never invent code clause text, clause numbers or acceptance percentages. Cite a clause number only when it appears in the passages.',
    '3) After each claim, cite the passage id in square brackets, e.g. [edb-course-nde-ut#p3].',
    '4) This is self-study material, not a certificate or a qualification. Never claim ASNT or ISO accreditation.',
    '5) Do not decide acceptance, operational readiness or field settings. Refer those decisions to the applicable written procedure and qualified engineer.',
    '6) Write clear technical English in short paragraphs, using bullets for lists. Do not restate the question.',
  ].join('\n'),
};

const MODE_HINT: Record<string, { ar: string; en: string }> = {
  explain: { ar: 'اشرح المفهوم من الأساس مع مثال عددي إن أمكن.', en: 'Explain from first principles, with a worked number if possible.' },
  compare: { ar: 'قارن بين الطريقتين/الحالتين في جدول أو نقاط، واذكر متى تُستخدم كل واحدة.', en: 'Compare the two methods/cases in a table or bullets, and say when each applies.' },
  code: { ar: 'اذكر مرجع التعلّم وحدود المقطع. لا تحدد بند قبول لمشروع فعلي.', en: 'Identify the study reference and its limits; do not specify a code acceptance criterion for a real job.' },
  practice: { ar: 'اطرح سؤالاً تدريبياً واحداً ثم حلّه خطوة بخطوة.', en: 'Pose one practice question, then solve it step by step.' },
};

function toCitation(hit: SearchHit, reviewed: boolean): TutorCitation {
  const document = hit.document;
  return {
    id: document.id,
    kind: document.kind,
    title: document.title,
    bookId: document.bookId,
    pageNumber: document.pageNumber,
    courseId: document.courseId,
    score: Math.round(hit.score * 100) / 100,
    reviewed,
  };
}

function buildContext(hits: SearchHit[], language: 'ar' | 'en'): string {
  const blocks: string[] = [];
  let budget = TUTOR_LIMITS.contextChars;
  for (const hit of hits) {
    const document = hit.document;
    const heading = `[${document.id}] ${document.title[language] || document.title.ar} — ${
      document.pageNumber ? `${document.bookId} p${document.pageNumber}` : document.kind
    }`;
    const body = (document.text[language] || document.text.ar || '').replace(/\s+/g, ' ').trim();
    const slice = body.slice(0, Math.max(400, Math.floor(budget / Math.max(1, hits.length))));
    if (slice.length < 40) continue;
    blocks.push(`${heading}\n${slice}`);
    budget -= slice.length + heading.length;
    if (budget <= 0) break;
  }
  return blocks.join('\n\n---\n\n');
}

/* ------------------------------------------------------------------ */
/* model calls                                                         */
/* ------------------------------------------------------------------ */

function streamFromModel(
  prompt: string,
  system: string,
  signal: AbortSignal,
  attempts?: ChainAttempt[]
): AsyncGenerator<string, void, unknown> {
  if (!ai) throw new Error('AI client is not configured');
  return streamTutorText(ai as unknown as TutorAiClient, {
    prompt,
    system,
    signal,
    models: MODEL_CHAIN,
    mode: (API_MODE as TutorTransportMode) || 'auto',
    maxOutputTokens: TUTOR_LIMITS.outputTokens,
    log: message => console.warn(message),
    attempts,
  });
}

  router.use(express.json({ limit: '96kb' }));

router.get('/api/ai/models', async (_req: Request, res: Response) => {
  /**
   * What this key may actually call, straight from Google.
   *
   * The chain walks a hard-coded list, and "busy" cannot be told apart from "this id does
   * not exist on this project" by guessing. This route removes the guessing: it lists the
   * models with a name, and marks which of them the chain already uses.
   */
  if (!ai) {
    res.status(503).json({ error: { code: 'not_configured', message: 'No AI key on this server' } });
    return;
  }
  try {
    const pager = await ai.models.list({ config: { pageSize: 200 } });
    const names: string[] = [];
    // The pager exposes `page` today; the loop keeps this working if that changes.
    const page = (pager as unknown as { page?: { name?: string }[] }).page;
    if (Array.isArray(page)) {
      for (const model of page) if (model?.name) names.push(model.name.replace(/^models\//, ''));
    } else {
      for await (const model of pager as unknown as AsyncIterable<{ name?: string }>) {
        if (model?.name) names.push(model.name.replace(/^models\//, ''));
      }
    }
    names.sort();
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      count: names.length,
      models: names,
      chain: MODEL_CHAIN,
      inChain: MODEL_CHAIN.filter(model => names.includes(model)),
      missingFromKey: MODEL_CHAIN.filter(model => !names.includes(model)),
    });
  } catch (error) {
    const { code, signal, detail } = upstreamFailure(error, false);
    res.status(STATUS_CODE[code]).json({ error: failureBody(code, 'en', { signal, detail }) });
  }
});

router.get(TUTOR_ENDPOINTS.status, async (_req: Request, res: Response) => {
  const library = await loadAiLibrary();
  const status: TutorStatus = {
    configured: Boolean(ai),
    reason: ai ? 'ok' : clientInitError ? 'client_init_failed' : 'no_key',
    model: MODEL_CHAIN[0],
    deepModel: TUTOR_MODELS.deep,
    limits: TUTOR_LIMITS,
    retrieval: {
      documents: library.documents,
      ready: library.documents > 0,
      source: library.source,
      // The reviewed count is kept separate: an academy answer must never be read as a
      // reviewed one just because `documents` is large.
      ...(reviewedDocuments > 0 ? { reviewed: reviewedDocuments } : {}),
      ...(libraryFailure ? { error: libraryFailure } : {}),
    },
    transport: API_MODE,
    ...(API_KEY ? { keyShape: { length: API_KEY.length, looksLikeAiStudioKey: /^(AIza[0-9A-Za-z_-]{30,}|AQ\.[0-9A-Za-z_.-]{20,})$/.test(API_KEY) } } : {}),
    ...(lastUpstream ? { lastUpstream } : {}),
  };
  res.setHeader('Cache-Control', 'no-store');
  res.json(status);
});

interface TutorPayload {
  question: string;
  language: 'ar' | 'en';
  mode: string;
  citations: TutorCitation[];
  confident: boolean;
  prompt: string;
  system: string;
  /** Which library produced the citations — echoed to the reader in `meta`. */
  source: 'reviewed' | 'academy' | 'none';
}

async function prepare(body: unknown, res: Response): Promise<TutorPayload | null> {
  const parsed = normaliseTutorRequest(body);
  if (!parsed.ok || !parsed.value) {
    res.status(STATUS_CODE.invalid_request).json({
      error: { code: 'invalid_request', message: parsed.errors.join('; ') },
    });
    return null;
  }
  const library = await loadAiLibrary();
  const request = parsed.value;
  const question = latestQuestion(request);
  const hits = library.retrieve(question);
  const reviewed = library.source === 'reviewed';
  const citations = hits.map(hit => toCitation(hit, reviewed));
  const context = buildContext(hits, request.language);
  const confident = Boolean(context);
  const hint = MODE_HINT[request.mode]?.[request.language] ?? '';
  // The model is told, in the same breath as the passages, that academy material is not
  // reviewed study content — otherwise it would present it as approved reference.
  const header = reviewed
    ? request.language === 'ar'
      ? 'مقاطع من مكتبة إنسكو المراجَعة (استخدم معرّفاتها في الاستشهاد):'
      : 'Passages from the reviewed INSCO library (cite these ids):'
    : request.language === 'ar'
      ? 'مقاطع من مادة الأكاديمية (غير مُراجَعة — استخدم معرّفاتها في الاستشهاد، ووضّح أن الإجابة استرشادية للتعلّم لا مرجع معتمد):'
      : 'Passages from the academy corpus (NOT reviewed — cite their ids and say the answer is study guidance, not an approved reference):';
  const prompt = confident
    ? `${header}\n\n${context}\n\n---\n\n${hint}\n\n${
        request.language === 'ar' ? 'السؤال' : 'Question'
      }: ${question}`
    : `${hint}\n\n${request.language === 'ar' ? 'السؤال' : 'Question'}: ${question}`;

  const history = request.messages
    .slice(0, -1)
    .map(message => `${message.role === 'assistant' ? 'Tutor' : 'Student'}: ${message.content}`)
    .join('\n');

  return {
    question,
    language: request.language,
    mode: request.mode,
    citations,
    confident,
    prompt: history ? `${history}\n\n${prompt}` : prompt,
    system: `${SYSTEM[request.language]}\n\n${hint}`,
    source: library.source,
  };
}

async function handleTutor(req: Request, res: Response, streaming: boolean): Promise<void> {
  // Validate first: a malformed body must be a 400 and must not spend quota.
  const payload = await prepare(req.body, res);
  if (!payload) return;

  const limit = takeToken(req.ip || req.socket.remoteAddress || 'unknown');
  if (!limit.allowed) {
    const failure = limit.failure;
    if (failure.code === 'rate_limited' && failure.retryAfterSeconds) {
      res.setHeader('Retry-After', String(failure.retryAfterSeconds));
    }
    res.status(STATUS_CODE[failure.code]).json({
      error: { ...failure, message: failureMessage(failure.code, payload.language) },
    });
    return;
  }

  if (!ai) {
    // Honest failure: no key means no answer. The old build returned a canned
    // paragraph here, which is worse than saying nothing.
    res.status(STATUS_CODE.not_configured).json({
      error: {
        code: 'not_configured',
        message: failureMessage('not_configured', payload.language),
        detail: 'Set GEMINI_API_KEY on the server that hosts /api/ai/*.',
      },
    });
    return;
  }

  // Fail closed in both protocols, including the legacy JSON endpoint.
  if (!payload.confident) {
    const emptyLibrary = payload.source === 'none';
    const message = payload.language === 'ar'
      ? emptyLibrary
        ? 'لا توجد مادة مطابقة في مكتبة الموقع. راجع مراجع الأكاديمية أو اطرح السؤال على مختص مؤهل.'
        : 'لا توجد مقاطع مطابقة لسؤالك في مادة الأكاديمية. أعد صياغته بمصطلح أدق أو راجع مراجع الأكاديمية.'
      : emptyLibrary
        ? 'The site library has no matching material. Consult the academy references or a qualified specialist.'
        : 'No passage in the academy material matches this question. Rephrase it with a more specific term.';
    const meta = { model: MODEL_CHAIN[0], citations: [], retrieved: 0, confident: false, elapsedMs: 0, source: payload.source };
    res.setHeader('Cache-Control', 'no-store');
    if (!streaming) { res.json({ text: message, content: message, meta }); return; }
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.end(encodeSse({ type: 'meta', meta }) + encodeSse({ type: 'delta', text: message }) + encodeSse({ type: 'done' }));
    return;
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // `req` emits 'close' as soon as its body is consumed, which would abort every
  // call. The response closing before it finished is the real client disconnect.
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  const meta = {
    model: MODEL_CHAIN[0],
    citations: payload.citations,
    retrieved: payload.citations.length,
    confident: payload.confident,
    elapsedMs: 0,
    source: payload.source,
  };

  if (!streaming) {
    const attempts: ChainAttempt[] = [];
    try {
      let text = '';
      for await (const delta of streamFromModel(payload.prompt, payload.system, controller.signal, attempts)) {
        text += delta;
      }
      res.json({ text, content: text, meta: { ...meta, elapsedMs: Date.now() - started } });
    } catch (error) {
      const { code, signal, detail } = upstreamFailure(error, controller.signal.aborted, attempts);
      console.error(`[ai] Tutor request failed: ${signal}: ${detail}`);
      res
        .status(STATUS_CODE[code])
        .json({ error: failureBody(code, payload.language, { signal, detail }) });
    } finally {
      clearTimeout(timer);
    }
    return;
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write(encodeSse({ type: 'meta', meta }));

  const streamAttempts: ChainAttempt[] = [];
  try {
    for await (const delta of streamFromModel(payload.prompt, payload.system, controller.signal, streamAttempts)) {
      res.write(encodeSse({ type: 'delta', text: delta }));
    }
    res.write(encodeSse({ type: 'done' }));
  } catch (error) {
    const { code, signal, detail } = upstreamFailure(error, controller.signal.aborted, streamAttempts);
    console.error(`[ai] Tutor stream failed: ${signal}: ${detail}`);
    res.write(
      encodeSse({ type: 'error', error: failureBody(code, payload.language, { signal, detail }) })
    );
    res.write(encodeSse({ type: 'done' }));
  } finally {
    clearTimeout(timer);
    res.end();
  }
}

router.post(TUTOR_ENDPOINTS.tutor, (req, res) => {
  void handleTutor(req, res, true);
});

// Legacy path: JSON only, and it answers with both `text` and `content` so a
// cached bundle built before the contract fix keeps working.
router.post(TUTOR_ENDPOINTS.legacyTutor, (req, res) => {
  void handleTutor(req, res, false);
});

/* ------------------------------------------------------------------ */
/* Dual AI Agents & INSCO Community Copilot                            */
/* ------------------------------------------------------------------ */

async function generateStructuredAgentJson<T>(params: {
  prompt: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  signal: AbortSignal;
}): Promise<{ data: T; model: string }> {
  if (!ai) throw new Error('AI client is not configured');
  const candidates = [AGENT_MODELS.primary, AGENT_MODELS.fallback];
  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema as never,
          temperature: 0.35,
          maxOutputTokens: 1800,
          abortSignal: params.signal,
        },
      });
      const rawText = (response.text || '').trim();
      if (!rawText) {
        throw new Error('Model returned empty structured payload');
      }
      const parsed = JSON.parse(rawText) as T;
      return { data: parsed, model };
    } catch (err) {
      lastError = err;
      if (params.signal.aborted) throw err;
      if (isModelMissing(err)) {
        console.warn(`[ai] agent model ${model} unavailable, trying fallback`);
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All agent models failed');
}

function guardAgentPreconditions(req: Request, res: Response, lang: 'ar' | 'en'): boolean {
  const limit = takeToken(req.ip || req.socket.remoteAddress || 'unknown');
  if (!limit.allowed) {
    const failure = limit.failure;
    if (failure.code === 'rate_limited' && failure.retryAfterSeconds) {
      res.setHeader('Retry-After', String(failure.retryAfterSeconds));
    }
    res.status(STATUS_CODE[failure.code]).json({
      error: { ...failure, message: failureMessage(failure.code, lang) },
    });
    return false;
  }

  if (!ai) {
    res.status(STATUS_CODE.not_configured).json({
      error: {
        code: 'not_configured',
        message: failureMessage('not_configured', lang),
        detail: 'Set GEMINI_API_KEY on the server hosting /api/ai/agent/*.',
      },
    });
    return false;
  }
  return true;
}

router.post(AGENT_ENDPOINTS.userCopilot, async (req: Request, res: Response) => {
  const parsed = normaliseUserCopilotRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: { code: 'invalid_request', message: parsed.error } });
    return;
  }
  const input = parsed.value;
  if (!guardAgentPreconditions(req, res, input.language)) return;

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  const systemInstruction =
    input.language === 'ar'
      ? [
          'أنت "المساعد الذكي الشامل لمستخدمي منصة INSCO" — خبير هندسي في الفحص غير الإتلافي (NDT: RT, UT, PAUT, MT, PT, VT) والمعالجة الحرارية PWHT، ومستشار تفاعلي داخل منصة INSCO (بوابة الشركة، بوابة العملاء والملفات المكوّدة، مجتمع INSCO المهني الهجين بين LinkedIn وFacebook، والأكاديمية ومعامل الواقع المعزز AR).',
          'مهامك:',
          '1) مساعدة المستخدم في أي طلب: اختيار طريقة الفحص أو تقنية التصوير المناسبة، صياغة منشورات احترافية في مجتمع INSCO، تلخيص المناقشات، تجهيز طلبات عرض الأسعار والاختبارات RFQ، وشرح محاكيات الأكاديمية والواقع المعزز.',
          '2) أعد إجابة عملية ومختصرة ومنظمة بالعربية، واقترح أزرار إجراءات سريعة مفيدة للتنقل أو تطبيق المسودة مباشرة.',
          '3) عندما يطلب المستخدم كتابة منشور أو صياغته (أو كان الوضع draft_post / improve_post)، عبّئ الحقل draftPost بعنوان ومحتوى هندسي جاهز للنشر ووسوم مناسبة.',
          '4) أجب بصيغة JSON مطابقة للمخطط فقط بدون نص خارج JSON.',
        ].join('\n')
      : [
          'You are the "INSCO Universal User Copilot" — a senior NDT (RT, UT, PAUT, MT, PT, VT) & PWHT engineering advisor and interactive platform concierge across the INSCO Corporate Portal, Client & Dossier Portal, INSCO Community (LinkedIn + Facebook hybrid), and Engineering Academy / AR Simulators.',
          'Responsibilities:',
          '1) Help users accomplish any task: choosing NDT methods or RT/UT techniques, drafting or polishing LinkedIn/Facebook community posts, summarizing discussions, structuring RFQs/test requests, and explaining simulator physics.',
          '2) Keep replies concise, directly actionable, and structured, plus 1-3 concrete suggestedActions buttons.',
          '3) When the user asks to draft or improve a post (or mode is draft_post / improve_post), populate draftPost completely.',
          '4) Respond strictly as JSON matching the schema.',
        ].join('\n');

  const historyBlock = input.history
    .map(m => `${m.role === 'assistant' ? 'Copilot' : 'User'}: ${m.content}`)
    .join('\n');
  const contextBlock = input.context ? JSON.stringify(input.context) : '{}';
  const prompt = [
    `Mode: ${input.mode}`,
    `Active Platform Context JSON: ${contextBlock}`,
    historyBlock ? `Recent Conversation:\n${historyBlock}` : '',
    `User Request: ${input.message}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const { data, model } = await generateStructuredAgentJson<
      Omit<UserCopilotResponse, 'model' | 'elapsedMs'>
    >({
      prompt,
      systemInstruction,
      signal: controller.signal,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING },
          suggestedActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                actionType: {
                  type: Type.STRING,
                  enum: ['navigate', 'apply_post_draft', 'open_rfq', 'open_ar_lab', 'open_community'],
                },
                target: { type: Type.STRING },
              },
              required: ['label', 'actionType'],
            },
          },
          draftPost: {
            type: Type.OBJECT,
            properties: {
              postType: {
                type: Type.STRING,
                enum: ['technical_case', 'job_tender', 'discussion', 'equipment_review'],
              },
              ndtMethod: { type: Type.STRING },
              title: { type: Type.STRING },
              body: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['postType', 'ndtMethod', 'title', 'body', 'tags'],
          },
        },
        required: ['reply', 'suggestedActions'],
      },
    });

    res.json({
      reply: data.reply,
      suggestedActions: Array.isArray(data.suggestedActions) ? data.suggestedActions.slice(0, 4) : [],
      ...(data.draftPost ? { draftPost: data.draftPost } : {}),
      model,
      elapsedMs: Date.now() - started,
    } satisfies UserCopilotResponse);
  } catch (error) {
    const { code, signal, detail } = upstreamFailure(error, controller.signal.aborted);
    console.error(`[ai] user-copilot failed: ${signal}: ${detail}`);
    res.status(STATUS_CODE[code]).json({
      error: failureBody(code, input.language, { signal, detail }),
    });
  } finally {
    clearTimeout(timer);
  }
});

router.post(AGENT_ENDPOINTS.siteManager, async (req: Request, res: Response) => {
  const parsed = normaliseSiteManagerRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: { code: 'invalid_request', message: parsed.error } });
    return;
  }
  const input = parsed.value;
  if (!guardAgentPreconditions(req, res, input.language)) return;

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  const systemInstruction =
    input.language === 'ar'
      ? [
          'أنت "وكيل إدارة الموقع والعمليات في منصة INSCO" — مدير عمليات رقمي احترافي يشرف على تشغيل المنصة بالكامل.',
          'مسؤولياتك تشمل: تدقيق صحة المنصة، فرز أولويات طلبات الفحص والعملاء الجدد، تحليل تنبيهات الجيوفينس (تسجيل الحضور خارج النطاق الجغرافي للمشروع)، الإشراف على محتوى مجتمع INSCO ورصد أي منشورات تحتاج مراجعة أو توضيح، وصياغة إعلانات إدارية احترافية لنشرها وتثبيتها في المجتمع.',
          'اعتمد بدقة على بيانات التليمترى المقدمة ولا تخترع أرقاماً غير موجودة فيها.',
          'أجب بصيغة JSON مطابقة للمخطط فقط.',
        ].join('\n')
      : [
          'You are the "INSCO Site Manager & Operations Director AI Agent" — the executive autonomous operator overseeing platform health, client request triage, field attendance geofencing alerts, and INSCO Community moderation & announcements.',
          'Rely strictly on the telemetry snapshot provided; never fabricate counts or employee alerts.',
          'Return strict JSON matching the schema.',
        ].join('\n');

  const prompt = [
    `Operation Mode: ${input.mode}`,
    `Telemetry Snapshot JSON:\n${JSON.stringify(input.telemetry)}`,
    `Directive: ${input.instruction}`,
  ].join('\n\n');

  try {
    const { data, model } = await generateStructuredAgentJson<
      Omit<SiteManagerResponse, 'model' | 'elapsedMs'>
    >({
      prompt,
      systemInstruction,
      signal: controller.signal,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          healthStatus: {
            type: Type.STRING,
            enum: ['OPTIMAL', 'ATTENTION_NEEDED', 'ACTION_REQUIRED'],
          },
          priorityActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                actionType: {
                  type: Type.STRING,
                  enum: [
                    'navigate',
                    'publish_announcement',
                    'flag_post',
                    'open_requests',
                    'open_timeclock',
                    'open_community',
                  ],
                },
                target: { type: Type.STRING },
              },
              required: ['title', 'detail', 'severity', 'actionType'],
            },
          },
          flaggedPostIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          announcementDraft: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              body: { type: Type.STRING },
              ndtMethod: { type: Type.STRING },
            },
            required: ['title', 'body', 'ndtMethod'],
          },
        },
        required: ['summary', 'healthStatus', 'priorityActions', 'flaggedPostIds'],
      },
    });

    res.json({
      summary: data.summary,
      healthStatus: data.healthStatus || 'OPTIMAL',
      priorityActions: Array.isArray(data.priorityActions) ? data.priorityActions.slice(0, 6) : [],
      flaggedPostIds: Array.isArray(data.flaggedPostIds) ? data.flaggedPostIds.slice(0, 10) : [],
      ...(data.announcementDraft ? { announcementDraft: data.announcementDraft } : {}),
      model,
      elapsedMs: Date.now() - started,
    } satisfies SiteManagerResponse);
  } catch (error) {
    const { code, signal, detail } = upstreamFailure(error, controller.signal.aborted);
    console.error(`[ai] site-manager failed: ${signal}: ${detail}`);
    res.status(STATUS_CODE[code]).json({
      error: failureBody(code, input.language, { signal, detail }),
    });
  } finally {
    clearTimeout(timer);
  }
});

router.post(AGENT_ENDPOINTS.communityAssist, async (req: Request, res: Response) => {
  const parsed = normaliseCommunityAssistRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: { code: 'invalid_request', message: parsed.error } });
    return;
  }
  const input = parsed.value;
  if (!guardAgentPreconditions(req, res, input.language)) return;

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  const systemInstruction =
    input.language === 'ar'
      ? 'أنت مساعد تحرير هندسي في مجتمع INSCO (مزيج LinkedIn وFacebook لمهندسي NDT وPWHT). حسّن المنشورات التقنية أو لخّصها أو اقترح ردوداً هندسية دقيقة متوافقة مع الأكواد الدولية بصيغة JSON فقط.'
      : 'You are an engineering editorial AI inside INSCO Community (LinkedIn + Facebook hybrid for NDT & PWHT engineers). Draft, polish, summarize, or code-check posts strictly in JSON.';

  const prompt = JSON.stringify({
    action: input.action,
    language: input.language,
    ndtMethod: input.ndtMethod,
    title: input.title || '',
    body: input.body,
  });

  try {
    const { data, model } = await generateStructuredAgentJson<
      Omit<CommunityAssistResponse, 'model' | 'elapsedMs'>
    >({
      prompt,
      systemInstruction,
      signal: controller.signal,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING },
          title: { type: Type.STRING },
          body: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          technicalSnippet: { type: Type.STRING },
        },
        required: ['reply'],
      },
    });

    res.json({
      ...data,
      model,
      elapsedMs: Date.now() - started,
    } satisfies CommunityAssistResponse);
  } catch (error) {
    const { code, signal, detail } = upstreamFailure(error, controller.signal.aborted);
    console.error(`[ai] community-assist failed: ${signal}: ${detail}`);
    res.status(STATUS_CODE[code]).json({
      error: failureBody(code, input.language, { signal, detail }),
    });
  } finally {
    clearTimeout(timer);
  }
});

  return router;
}
