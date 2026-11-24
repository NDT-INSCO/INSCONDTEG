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
  TutorMeta,
  TutorStatus,
  UpstreamSignal,
} from '../../src/ai/contract.js';
import { buildIndex, searchLibrary, type SearchHit } from '../../src/ai/search.js';
import { composeSelfAnswer } from '../../src/ai/selfAnswer.js';
import { answerCopilot, answerSiteManager, answerCommunity, copilotSearchQuery } from '../../src/ai/agentBrain.js';
import { searchPrivateKnowledge } from './privateKnowledge.js';
import { HOSTED_GATEWAY_URL, PAGES_SITE_ORIGIN } from '../../src/ai/pagesGateway.js';
import { buildTutorLibrary, type TutorLibrary } from '../tutor/library.js';
import {
  ChainAttempt,
  isModelMissing,
  AGENT_PER_MODEL_TIMEOUT_MS,
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

/**
 * Cross-origin access, deliberately narrow.
 *
 * The static GitHub Pages build has to call this gateway from another origin, and a JSON
 * POST is not a "simple" request — the browser sends a preflight first. Answering it is the
 * difference between "the AI works" and "the AI works on Vercel only".
 *
 * Nothing secret travels in the other direction: the key stays on this server, the CORS
 * grant only lets a page the project owns read answers, and per-IP limits are unchanged.
 */
const ALLOWED_ORIGINS = [PAGES_SITE_ORIGIN, HOSTED_GATEWAY_URL];

function allowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  const extra = (process.env.AI_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (ALLOWED_ORIGINS.includes(origin) || extra.includes(origin)) return origin;
  // Preview deployments of this project, and the local dev servers.
  if (/^https:\/\/inscondteg-[a-z0-9-]+-ndt-insco\.vercel\.app$/i.test(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin;
  return null;
}

export function createAiGateway(edbRoot: string): express.Router {
  const router = express.Router();

  router.use((req, res, next) => {
    // `Vary` matters: without it a CDN may hand a Pages response to a Vercel caller.
    res.setHeader('Vary', 'Origin');
    const origin = allowedOrigin(req.headers.origin);
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') {
      res.status(origin ? 204 : 403).end();
      return;
    }
    next();
  });

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
/**
 * The whole-request budget. The function may run 60s (`maxDuration`), so this leaves room
 * for the tail of a long answer instead of cutting it at 45s and calling it a timeout.
 */
const REQUEST_TIMEOUT_MS = Math.max(5000, parseInt(process.env.TUTOR_TIMEOUT_MS || '55000', 10));
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

/**
 * Read JSON out of a model answer that may be fenced, padded, or cut short.
 *
 * The copilot asks for one object; models sometimes wrap it in prose or a code fence, and
 * a truncated answer has no closing brace to forgive. Failing the whole request over a
 * fence is a worse trade than reading the object between the first brace and the last.
 */
function parseModelJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error('The model did not return JSON');
  }
}

/**
 * Google does not always refuse a throttled request up front: on the free tier it often
 * starts streaming, then ends the interaction with "high demand". The reader is left with
 * half an answer and a busy banner even though the question was understood.
 *
 * So a stream that stops after producing text is resumed — the model is shown what it
 * already wrote and asked to continue from there, without repeating itself. Resuming is
 * bounded by a count and by the request's own clock; when either runs out, the partial
 * answer stands and the reader is told why.
 */
const RESUME_LIMIT = 2;
/** Leave enough of the request budget for the resumed answer to say something. */
const RESUME_MIN_REMAINING_MS = 8000;

function resumeInstruction(language: 'ar' | 'en', written: string): string {
  const tail = written.slice(-1200);
  return language === 'ar'
    ? `هذا ما كتبته حتى الآن في إجابتك:\n\n${tail}\n\nأكمل من حيث توقفت تماماً. لا تُعد كتابة ما سبق، ولا تكتب مقدمة جديدة، وأكمل الجملة الناقصة إن وُجدت.`
    : `This is what you have written so far:\n\n${tail}\n\nContinue exactly where you stopped. Do not repeat what you already wrote, do not start a new introduction, and finish the sentence that was cut.`;
}

/** Only a throttled or stalled stream is worth resuming; a rejected key never is. */
function isResumable(signal: UpstreamSignal): boolean {
  return signal === 'model_busy' || signal === 'rate_limited' || signal === 'upstream_error';
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

router.get('/api/ai/ping', async (req: Request, res: Response) => {
  /**
   * One tiny question per model, with the cost of each written down.
   *
   * 'Busy' and 'slow' are indistinguishable from a 45-second failure of the whole chain.
   * This route asks each model in turn for sixteen tokens and reports milliseconds,
   * category and Google's own sentence, stopping at the first that answers.
   */
  if (!ai) {
    res.status(503).json({ error: { code: 'not_configured', message: 'No AI key on this server' } });
    return;
  }
  const wanted =
    typeof req.query.model === 'string' && req.query.model ? [req.query.model] : MODEL_CHAIN;
  const results: Array<Record<string, unknown>> = [];

  const viaInteractions = req.query.api === 'interactions';

  for (const model of wanted) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      if (viaInteractions) {
        // The path Google documents for 3.x. Same question, same budget, streamed.
        const stream = (await ai.interactions.create(
          {
            model,
            input: 'قل: تم',
            generation_config: { max_output_tokens: 16 },
            stream: true,
            store: false,
          },
          { signal: controller.signal }
        )) as unknown as AsyncIterable<{ event_type?: string; delta?: { type?: string; text?: string } }>;
        let text = '';
        const events: string[] = [];
        for await (const event of stream) {
          if (events.length < 8) events.push(event.event_type || '?');
          if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
            text += event.delta.text || '';
            if (text) break;
          }
        }
        results.push({ model, ok: true, ms: Date.now() - started, text: text.slice(0, 40), events });
        break;
      }

      const answer = await ai.models.generateContent({
        model,
        contents: 'قل: تم',
        config: { maxOutputTokens: 16, abortSignal: controller.signal },
      });
      results.push({ model, ok: true, ms: Date.now() - started, text: (answer.text || '').slice(0, 40) });
      break;
    } catch (error) {
      results.push({
        model,
        ok: false,
        ms: Date.now() - started,
        signal: classifyUpstreamError(error),
        detail: sanitiseUpstreamDetail(error),
      });
    } finally {
      clearTimeout(timer);
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: results.some(result => result.ok === true), viaInteractions, results });
});

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
  source: 'reviewed' | 'academy' | 'private-drive' | 'mixed' | 'none';
  hits: SearchHit[];
  documents: number;
}

function guardAgentRateLimit(req: Request, res: Response, lang: 'ar' | 'en'): boolean {
  const limit = takeToken(req.ip || req.socket.remoteAddress || 'unknown');
  if (limit.allowed) return true;
  const failure = limit.failure;
  if (failure.code === 'rate_limited' && failure.retryAfterSeconds) {
    res.setHeader('Retry-After', String(failure.retryAfterSeconds));
  }
  res.status(STATUS_CODE[failure.code]).json({
    error: { ...failure, message: failureMessage(failure.code, lang) },
  });
  return false;
}

function bearerToken(req: Request): string | undefined {
  const authorization = req.header('authorization') || '';
  const match = /^Bearer\s+([A-Za-z0-9._-]{20,})$/i.exec(authorization);
  return match?.[1];
}

async function privateKnowledgeHits(question: string, token?: string): Promise<SearchHit[]> {
  const documents = await searchPrivateKnowledge(question, token);
  if (!documents.length) return [];
  const index = buildIndex(documents);
  const result = searchLibrary(question, {
    index,
    limit: TUTOR_LIMITS.passages,
    minScore: TUTOR_LIMITS.minScore,
  });
  return result.confident ? result.hits : [];
}

async function prepare(body: unknown, res: Response, idToken?: string): Promise<TutorPayload | null> {
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
  const publicHits = library.retrieve(question);
  const privateHits = await privateKnowledgeHits(question, idToken);
  const hits = [...publicHits, ...privateHits].sort((a, b) => b.score - a.score).slice(0, TUTOR_LIMITS.passages);
  const reviewed = library.source === 'reviewed';
  const citations = hits.map(hit => ({
    ...toCitation(hit, reviewed && !hit.document.id.startsWith('drive:')),
    ...(hit.document.id.startsWith('drive:') ? { sourceType: 'private-drive' as const } : { sourceType: 'site-library' as const }),
  }));
  const source: TutorPayload['source'] = privateHits.length
    ? (publicHits.length ? 'mixed' : 'private-drive')
    : library.source;
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
    source,
    hits,
    documents: library.documents + privateHits.length,
  };
}

async function handleTutor(req: Request, res: Response, streaming: boolean): Promise<void> {
  // Validate first: a malformed body must be a 400 and must not spend quota.
  const payload = await prepare(req.body, res, bearerToken(req));
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

  if (!ai || payload.source === 'private-drive' || payload.source === 'mixed') {
    // Private Drive material is never sent to an external model provider. Without a key,
    // the public library path is likewise composed from retrieved passages only.
    const selfAnswer = composeSelfAnswer({
      question: payload.question,
      language: payload.language,
      hits: payload.hits,
      corpusSize: payload.documents,
      privatePassages: payload.hits.filter(hit => hit.document.id.startsWith('drive:')).length,
    });
    if (!selfAnswer) {
      const emptyLibrary = payload.source === 'none';
      const message = payload.language === 'ar'
        ? emptyLibrary
          ? 'لا توجد مادة مطابقة في مكتبة الموقع. راجع مراجع الأكاديمية أو اطرح السؤال على مختص مؤهل.'
          : 'لا توجد مقاطع مطابقة لسؤالك في مادة الأكاديمية. أعد صياغته بمصطلح أدق أو راجع مراجع الأكاديمية.'
        : emptyLibrary
          ? 'The site library has no matching material. Consult the academy references or a qualified specialist.'
          : 'No passage in the academy material matches this question. Rephrase it with a more specific term.';
      const meta: TutorMeta = { model: null, citations: [], retrieved: 0, confident: false, elapsedMs: 0, source: payload.source };
      res.setHeader('Cache-Control', 'no-store');
      if (!streaming) { res.json({ text: message, content: message, meta }); return; }
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.end(encodeSse({ type: 'meta', meta }) + encodeSse({ type: 'delta', text: message }) + encodeSse({ type: 'done' }));
      return;
    }
    const meta: TutorMeta = {
      model: null,
      citations: payload.citations,
      retrieved: payload.citations.length,
      confident: payload.confident,
      elapsedMs: 0,
      source: payload.source,
      kind: 'library',
      steps: selfAnswer.steps,
    };
    res.setHeader('Cache-Control', 'no-store');
    if (!streaming) { res.json({ text: selfAnswer.text, content: selfAnswer.text, meta }); return; }
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.end(encodeSse({ type: 'meta', meta }) + encodeSse({ type: 'delta', text: selfAnswer.text }) + encodeSse({ type: 'done' }));
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
  let written = '';
  try {
    for (let resume = 0; ; resume += 1) {
      const prompt =
        resume === 0
          ? payload.prompt
          : `${payload.prompt}\n\n${resumeInstruction(payload.language, written)}`;
      try {
        for await (const delta of streamFromModel(prompt, payload.system, controller.signal, streamAttempts)) {
          written += delta;
          res.write(encodeSse({ type: 'delta', text: delta }));
        }
        break;
      } catch (error) {
        const remaining = REQUEST_TIMEOUT_MS - (Date.now() - started);
        const kind = classifyUpstreamError(error);
        // A warning, not a failure: the reader keeps what was written and gets the rest.
        if (
          written &&
          resume < RESUME_LIMIT &&
          remaining > RESUME_MIN_REMAINING_MS &&
          isResumable(kind) &&
          !controller.signal.aborted
        ) {
          console.warn(`[ai] tutor stream stopped as ${kind}; resuming (${resume + 1}/${RESUME_LIMIT})`);
          continue;
        }
        throw error;
      }
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
  const candidates = [AGENT_MODELS.primary, AGENT_MODELS.fallback, ...AGENT_MODELS.fallbacks];
  let lastError: unknown = null;

  /**
   * The interface Google actually serves, asked first.
   *
   * `models.generateContent` is the retired path — one key here answers it with "no longer
   * available to new users" and another simply never returns. Leading with it cost the
   * copilot four silent 18-second slices and a 504 before the working interface was even
   * tried, so the order is now reversed: JSON over `interactions`, legacy only as a last
   * resort.
   */
  const interactionSystem =
    params.systemInstruction +
    '\n\nأعد كائن JSON واحداً فقط يطابق هذا المخطط، بلا شرح ولا أسوار كود:\n' +
    JSON.stringify(params.responseSchema);

  for (const model of candidates) {
    if (params.signal.aborted) throw lastError ?? new Error('Agent request aborted');
    const budget = new AbortController();
    const onAbort = () => budget.abort();
    params.signal.addEventListener('abort', onAbort, { once: true });
    // A whole-call slice: an agent answer is one JSON document, so there is no useful
    // "it started writing" moment to protect — if the document is not done in the slice,
    // the next model is a better bet than waiting.
    const timer = setTimeout(() => budget.abort(), AGENT_PER_MODEL_TIMEOUT_MS);
    try {
      let raw = '';
      for await (const delta of streamTutorText(ai as unknown as TutorAiClient, {
        prompt: params.prompt,
        system: interactionSystem,
        signal: budget.signal,
        models: [model],
        mode: 'interactions',
        maxOutputTokens: 1400,
        log: message => console.warn(message),
      })) {
        raw += delta;
      }
      const parsed = parseModelJson<T>(raw);
      console.warn(`[ai] agent answered through interactions on ${model}`);
      return { data: parsed, model };
    } catch (err) {
      lastError = err;
      if (params.signal.aborted) throw err;
      console.warn(`[ai] agent interactions on ${model} failed: ${sanitiseUpstreamDetail(err)}`);
    } finally {
      clearTimeout(timer);
      params.signal.removeEventListener('abort', onAbort);
    }
  }

  /** Last resort: the legacy call, for a key where Interactions is the broken half. */
  for (const model of candidates.slice(0, 2)) {
    if (params.signal.aborted) throw lastError ?? new Error('Agent request aborted');
    const budget = new AbortController();
    const onAbort = () => budget.abort();
    params.signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => budget.abort(), AGENT_PER_MODEL_TIMEOUT_MS);
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema as never,
          temperature: 0.35,
          maxOutputTokens: 1400,
          abortSignal: budget.signal,
        },
      });
      const rawText = (response.text || '').trim();
      if (!rawText) throw new Error('Model returned empty structured payload');
      const parsed = parseModelJson<T>(rawText);
      return { data: parsed, model };
    } catch (err) {
      lastError = err;
      if (params.signal.aborted) throw err;
      console.warn(`[ai] agent legacy on ${model} failed: ${sanitiseUpstreamDetail(err)}`);
    } finally {
      clearTimeout(timer);
      params.signal.removeEventListener('abort', onAbort);
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
  if (!guardAgentRateLimit(req, res, input.language)) return;
  const privateDocuments = await searchPrivateKnowledge(copilotSearchQuery(input), bearerToken(req));
  res.setHeader('Cache-Control', 'no-store');
  res.json(answerCopilot(input, privateDocuments));
});

router.post(AGENT_ENDPOINTS.siteManager, (req: Request, res: Response) => {
  const parsed = normaliseSiteManagerRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: { code: 'invalid_request', message: parsed.error } });
    return;
  }
  if (!guardAgentRateLimit(req, res, parsed.value.language)) return;
  res.setHeader('Cache-Control', 'no-store');
  res.json(answerSiteManager(parsed.value));
});

router.post(AGENT_ENDPOINTS.communityAssist, async (req: Request, res: Response) => {
  const parsed = normaliseCommunityAssistRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: { code: 'invalid_request', message: parsed.error } });
    return;
  }
  const input = parsed.value;
  if (!guardAgentRateLimit(req, res, input.language)) return;
  const privateDocuments = input.action === 'code_check'
    ? await searchPrivateKnowledge(`${input.ndtMethod} ${input.title || ''} ${input.body}`, bearerToken(req))
    : [];
  res.setHeader('Cache-Control', 'no-store');
  res.json(answerCommunity(input, privateDocuments));
});

  return router;
}
