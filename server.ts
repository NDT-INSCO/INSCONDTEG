/** Serves the INSCO site, AI/RFQ gateways, and the private admin API. */
import express from 'express';
import type { Request, Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type, type FunctionDeclaration } from '@google/genai';
import {
  AGENT_ENDPOINTS,
  AGENT_MODELS,
  normaliseChatGptStreamRequest,
  normaliseCommunityAssistRequest,
  normaliseSafeExternalUrl,
  normaliseSiteManagerRequest,
  normaliseUserCopilotRequest,
  type ChatGptGroundingSource,
  type ChatGptReasoningArchitecture,
  type ChatGptStreamEvent,
  type CommunityAssistResponse,
  type SiteManagerResponse,
  type UserCopilotResponse,
} from './src/ai/agentsContract.js';
import {
  encodeSse,
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
} from './src/ai/contract.js';

import type { SearchHit } from './src/ai/search.js';
import { isModelMissing, streamTutorText, TutorAiClient, TutorTransportMode } from './src/ai/transport.js';
import { buildTutorLibrary, type TutorLibrary } from './server/tutor/library.js';
import { createOperations } from './server/admin/operations.js';
import {
  buildArchitectureBlueprint,
  buildResponseLogicContract,
  buildTrainedKnowledgeContext,
  selectAdaptiveArchitecture,
} from './server/ai/cognitiveArchitecture.js';

dotenv.config();

/**
 * The same library selection the serverless gateway uses: the reviewed corpus if it has
 * anything, the academy corpus if it does not, nothing if both are empty — and the answer
 * says which one it used.
 *
 * This file kept a reviewed-only loader after the gateway moved on, so the standalone
 * server reported `documents: 0` (and stayed silent) where production answered from the
 * academy corpus, and the tutor-review tests caught the difference.
 */
type AiLibraryModule = TutorLibrary & { reviewedDocuments: number };
let aiLibraryPromise: Promise<AiLibraryModule> | null = null;

function loadAiLibrary(): Promise<AiLibraryModule> {
  aiLibraryPromise ??= Promise.resolve().then(() => {
    const built = buildTutorLibrary(
      file => readFileSync(path.join(siteRoot, 'edb', file), 'utf8'),
      { allowAcademyFallback: process.env.TUTOR_ALLOW_ACADEMY_FALLBACK !== 'false' }
    );
    if (built.failure) console.error('[ai] reviewed library unavailable:', built.failure);
    return { ...built.library, reviewedDocuments: built.reviewedDocuments };
  });
  return aiLibraryPromise;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const siteRoot = path.join(__dirname, !isProduction ? 'public' : existsSync(path.join(__dirname, 'dist')) ? 'dist' : 'docs');
const trustedProxies = process.env.TRUST_PROXY?.trim();
if (trustedProxies) app.set('trust proxy', trustedProxies);

/* ------------------------------------------------------------------ */
/* configuration                                                       */
/* ------------------------------------------------------------------ */

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

/**
 * Must cover every `TutorErrorCode`, or the type-check fails — which is how this map came
 * to light: `key_rejected` and `model_busy` were added to the contract, and this second
 * copy of the gateway kept the old six.
 */
const STATUS_CODE: Record<TutorErrorCode, number> = {
  not_configured: 503,
  invalid_request: 400,
  rate_limited: 429,
  budget_exhausted: 429,
  timeout: 504,
  key_rejected: 502,
  model_busy: 503,
  upstream_error: 502,
};

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

/**
 * `reviewed` is not decoration: the reader is told which corpus a passage came from, and an
 * academy passage must never be presented as a reviewed one.
 */
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
  signal: AbortSignal
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
  });
}

/* ------------------------------------------------------------------ */
/* routes                                                              */
/* ------------------------------------------------------------------ */

app.disable('x-powered-by');

// Mount the operations API before the general parser, AI, and static routes.
const operations = await createOperations(process.env, { production: isProduction, baseDir: __dirname, tutorConfigured: Boolean(ai) });
app.use(operations.router);
app.use(express.json({ limit: '6mb' }));

app.get(TUTOR_ENDPOINTS.status, async (_req: Request, res: Response) => {
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
      ...(library.reviewedDocuments > 0 ? { reviewed: library.reviewedDocuments } : {}),
    },
    transport: API_MODE,
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
  /** Which corpus answered: the reviewed one, the academy one, or neither. */
  source: TutorLibrary['source'];
  prompt: string;
  system: string;
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
  const citations = hits.map(hit => toCitation(hit, library.source === 'reviewed' && library.reviewedDocuments > 0));
  const context = buildContext(hits, request.language);
  const confident = Boolean(context);
  const hint = MODE_HINT[request.mode]?.[request.language] ?? '';
  const header =
    request.language === 'ar'
      ? 'مقاطع من مكتبة إنسكو (استخدم معرّفاتها في الاستشهاد):'
      : 'Passages from the INSCO library (cite these ids):';
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
    source: library.source,
    prompt: history ? `${history}\n\n${prompt}` : prompt,
    system: `${SYSTEM[request.language]}\n\n${hint}`,
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
    // The same two sentences the serverless gateway uses: an empty library and a library
    // with no matching passage are different facts and must not share one message.
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
    try {
      let text = '';
      for await (const delta of streamFromModel(payload.prompt, payload.system, controller.signal)) {
        text += delta;
      }
      res.json({ text, content: text, meta: { ...meta, elapsedMs: Date.now() - started } });
    } catch (error) {
      const timedOut = controller.signal.aborted;
      const code: TutorErrorCode = timedOut ? 'timeout' : 'upstream_error';
      console.error('[ai] Tutor request failed:', code);
      res.status(STATUS_CODE[code]).json({ error: { code, message: failureMessage(code, payload.language) } });
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

  try {
    for await (const delta of streamFromModel(payload.prompt, payload.system, controller.signal)) {
      res.write(encodeSse({ type: 'delta', text: delta }));
    }
    res.write(encodeSse({ type: 'done' }));
  } catch (error) {
    const timedOut = controller.signal.aborted;
    const code: TutorErrorCode = timedOut ? 'timeout' : 'upstream_error';
    console.error('[ai] Tutor stream failed:', code);
    res.write(encodeSse({ type: 'error', error: { code, message: failureMessage(code, payload.language) } }));
    res.write(encodeSse({ type: 'done' }));
  } finally {
    clearTimeout(timer);
    res.end();
  }
}

app.post(TUTOR_ENDPOINTS.tutor, (req, res) => {
  void handleTutor(req, res, true);
});

// Legacy path: JSON only, and it answers with both `text` and `content` so a
// cached bundle built before the contract fix keeps working.
app.post(TUTOR_ENDPOINTS.legacyTutor, (req, res) => {
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

app.post(AGENT_ENDPOINTS.userCopilot, async (req: Request, res: Response) => {
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
    const timedOut = controller.signal.aborted;
    const code: TutorErrorCode = timedOut ? 'timeout' : 'upstream_error';
    console.error('[ai] user-copilot failed:', error instanceof Error ? error.message : error);
    res.status(STATUS_CODE[code]).json({
      error: { code, message: failureMessage(code, input.language) },
    });
  } finally {
    clearTimeout(timer);
  }
});

app.post(AGENT_ENDPOINTS.siteManager, async (req: Request, res: Response) => {
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
    const timedOut = controller.signal.aborted;
    const code: TutorErrorCode = timedOut ? 'timeout' : 'upstream_error';
    console.error('[ai] site-manager failed:', error instanceof Error ? error.message : error);
    res.status(STATUS_CODE[code]).json({
      error: { code, message: failureMessage(code, input.language) },
    });
  } finally {
    clearTimeout(timer);
  }
});

app.post(AGENT_ENDPOINTS.communityAssist, async (req: Request, res: Response) => {
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
    const timedOut = controller.signal.aborted;
    const code: TutorErrorCode = timedOut ? 'timeout' : 'upstream_error';
    console.error('[ai] community-assist failed:', error instanceof Error ? error.message : error);
    res.status(STATUS_CODE[code]).json({
      error: { code, message: failureMessage(code, input.language) },
    });
  } finally {
    clearTimeout(timer);
  }
});

const CHATGPT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'open_canvas_document',
    description:
      'Open or update an interactive side-by-side Canvas artifact (markdown report, NDT procedure, code module, table, HTML/SVG schematic, or RFQ scope) when the user asks to write, draft, edit, or build a deliverable.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Clear concise title for the Canvas document.' },
        kind: {
          type: Type.STRING,
          enum: ['markdown', 'code', 'table', 'html', 'svg', 'report'],
          description: 'Artifact content format.',
        },
        language: { type: Type.STRING, description: 'Optional code language (e.g. typescript, python, sql).' },
        content: { type: Type.STRING, description: 'Complete artifact body content.' },
      },
      required: ['title', 'kind', 'content'],
    },
  },
  {
    name: 'draft_community_post',
    description:
      'Create a structured engineering post draft ready to publish inside INSCO Community (technical case, tender/job, discussion, or equipment review).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        postType: {
          type: Type.STRING,
          enum: ['technical_case', 'job_tender', 'discussion', 'equipment_review'],
        },
        ndtMethod: { type: Type.STRING, description: 'NDT/PWHT method such as RT, UT, PAUT, MT, PT, VT, PWHT, ET.' },
        title: { type: Type.STRING },
        body: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['postType', 'ndtMethod', 'title', 'body', 'tags'],
    },
  },
  {
    name: 'open_platform_destination',
    description:
      'Provide a direct action button navigating the user to a specific INSCO platform page (community, rfq, ar_lab, workshops, timeclock, or academy).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING, description: 'Button label in the user language.' },
        actionType: {
          type: Type.STRING,
          enum: ['navigate', 'open_rfq', 'open_ar_lab', 'open_community', 'open_workshop'],
        },
        target: { type: Type.STRING, description: 'Optional sub-route target.' },
      },
      required: ['label', 'actionType'],
    },
  },
  {
    name: 'save_user_memory',
    description:
      'Save a concise helpful user preference or background fact (e.g. certifications, preferred codes, company role) into persistent memory when the user expresses an ongoing preference.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        memory: { type: Type.STRING, description: 'One concise sentence summarizing the preference or fact.' },
      },
      required: ['memory'],
    },
  },
];

function sendChatGptSse(res: Response, event: ChatGptStreamEvent): void {
  if (res.writableEnded) return;
  res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

app.post(AGENT_ENDPOINTS.chatgptStream, async (req: Request, res: Response) => {
  const parsed = normaliseChatGptStreamRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: { code: 'invalid_request', message: parsed.error } });
    return;
  }
  const input = parsed.value;
  if (!guardAgentPreconditions(req, res, input.language)) return;
  if (!ai) return;

  const started = Date.now();
  const controller = new AbortController();
  const streamTimeoutMs = Math.max(REQUEST_TIMEOUT_MS, 90_000);
  const timer = setTimeout(() => controller.abort(), streamTimeoutMs);
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const isAr = input.language === 'ar';
  const activeArch = selectAdaptiveArchitecture(
    input.message,
    input.reasoningArchitecture,
    input.mode,
    Boolean(input.verifyTargetTurn)
  );
  const effectivePacks =
    input.trainingPacks && input.trainingPacks.length > 0
      ? input.trainingPacks
      : input.memoryProfile?.activeTrainingPacks ?? [
          'ndt_codes',
          'film_diagnostics',
          'pwht_thermal',
          'software_architecture',
        ];

  let libraryHits: SearchHit[] = [];
  try {
    const lib = await loadAiLibrary();
    libraryHits = lib.retrieve(input.verifyTargetTurn?.question || input.message);
  } catch {
    libraryHits = [];
  }

  const architectureBlueprint = buildArchitectureBlueprint(
    activeArch,
    input.language,
    input.selfVerifyPass ?? true
  );
  const logicContract = buildResponseLogicContract(
    input.language,
    input.memoryProfile?.responseStyle
  );
  const trainedKnowledge = buildTrainedKnowledgeContext({
    packs: effectivePacks,
    customFewShots: input.memoryProfile?.fewShotExamples,
    libraryHits,
    lang: input.language,
  });

  const memoryBlock = [
    input.memoryProfile?.customInstructions
      ? `User Custom Instructions:\n${input.memoryProfile.customInstructions}`
      : '',
    input.memoryProfile?.savedMemories?.length
      ? `Saved User Memories:\n- ${input.memoryProfile.savedMemories.join('\n- ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const modeDirectiveMap: Record<string, string> = {
    auto: isAr
      ? 'تكيّف تلقائياً مع نوع المهمة (محادثة، كود، بحث، تحليل صور/ملفات، هندسة NDT/PWHT، أو كتابة تقارير).'
      : 'Adapt fluidly to the task (reasoning, coding, web research, multimodal analysis, NDT/PWHT engineering, or report writing).',
    thinking: isAr
      ? 'استخدم تفكيراً تحليلياً معمقاً خطوة بخطوة قبل الحسم في المعادلات والأكواد والقرارات الهندسية.'
      : 'Apply deep first-principles step-by-step reasoning before concluding.',
    web_search: isAr
      ? 'ابحث في الويب عند الحاجة لأحدث المعلومات والمعايير والمواصفات واذكر المصادر بوضوح.'
      : 'Ground answers in live web search results and cite sources clearly.',
    deep_research: isAr
      ? 'أعد تقريراً بحثياً متكاملاً بأقسام واضحة ومقارنات وجداول وتوصيات تنفيذية مع فتحه في لوحة Canvas عند مناسبته.'
      : 'Produce a structured multi-section deep research report with tables, citations, and Canvas deliverable.',
    canvas: isAr
      ? 'أنشئ المخرج في صورة وثيقة منظمة أو كود قابل للتشغيل واستدعِ أداة open_canvas_document لفتحه في Canvas بجانب المحادثة.'
      : 'Author a polished deliverable or code module and invoke open_canvas_document to display it inside Canvas.',
    code_analyst: isAr
      ? 'حلّل الأكواد والبيانات والجداول (CSV/JSON) بدقة واكتب أكواداً نظيفة مع أمثلة ونتائج مجدولة.'
      : 'Act as senior software & data analyst: write clean production code, inspect CSV/JSON data, and compute verified tables.',
    vision_ndt: isAr
      ? 'حلل الصور والملفات المرفقة (أفلام أشعة RT، شاشات UT/PAUT، مخططات هندسية، أو مستندات) مع ملاحظات مهنية دقيقة.'
      : 'Analyze attached radiographs, UT/PAUT traces, weld photos, schematics, or documents systematically.',
  };

  const systemInstruction = [
    isAr
      ? 'أنت "INSCO AI Agent" — وكيل ذكاء اصطناعي متكامل بمستوى ChatGPT للمهام العامة والهندسية، مدمج مع منصة INSCO العالمية (NDT، المعالجة الحرارية PWHT، تقييم الأكواد ASME/API/AWS/ISO، مجتمع INSCO، عروض الأسعار RFQ، ومعامل المحاكاة AR/4D).'
      : 'You are "INSCO AI Agent" — a ChatGPT-class autonomous general and engineering AI agent natively integrated into the INSCO platform (NDT, PWHT, ASME/API/AWS/ISO compliance, INSCO Community, RFQ operations, and Interactive AR/4D Labs).',
    architectureBlueprint,
    logicContract,
    trainedKnowledge,
    `Active Mode Guidance: ${modeDirectiveMap[input.mode] || modeDirectiveMap.auto}`,
    isAr
      ? 'استخدم تنسيق Markdown الغني (عناوين، قوائم، جداول، وكتل كود محددة اللغة). إذا طلب المستخدم إنشاء تقرير/إجراء/كود/مستند طويل أو تعديل وثيقة Canvas الحالية، استدعِ أداة open_canvas_document بجانب ردك الموجز في الدردشة.'
      : 'Use clean Markdown (headings, bullet lists, tables, language-tagged code blocks). When producing reports, procedures, code deliverables, or refining the active Canvas document, invoke open_canvas_document alongside a concise chat summary.',
    memoryBlock,
    input.context
      ? `Active INSCO Platform Context: portal=${input.context.portal ?? 'company'}, section=${input.context.section ?? 'home'}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const userParts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  for (const att of input.attachments) {
    if (att.kind === 'text' && att.textContent) {
      userParts.push({
        text: `[Attached File: ${att.name} (${att.mimeType})]\n\`\`\`\n${att.textContent}\n\`\`\``,
      });
    } else if ((att.kind === 'image' || att.kind === 'pdf') && att.dataBase64) {
      userParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }

  const canvasContextSuffix = input.canvasDocument
    ? `\n\n[Active Canvas Document "${input.canvasDocument.title}" (${input.canvasDocument.kind})]:\n\`\`\`\n${input.canvasDocument.content}\n\`\`\``
    : '';

  const userPromptText = input.verifyTargetTurn
    ? isAr
      ? `نفّذ تدقيق التحقق المتسلسل (Chain-of-Verification Audit) على الإجابة التالية:\n\n[السؤال الأصلي]:\n${input.verifyTargetTurn.question}\n\n[الرد المطلوب تدقيقه]:\n${input.verifyTargetTurn.draftAnswer}\n\nقدّم تقريراً منطقياً يشمل: 1) نقاط القوة المؤكدة، 2) أي فجوات حسابية أو فرضيات ناقصة أو بنود تستوجب مراجعة الكود، 3) النسخة المصححة والموثقة النهائية.`
      : `Execute a Chain-of-Verification (CoVe) Logic & Technical Audit on this response:\n\n[Original Question]:\n${input.verifyTargetTurn.question}\n\n[Draft Response to Audit]:\n${input.verifyTargetTurn.draftAnswer}\n\nProvide: 1) Verified Claims, 2) Flagged Gaps / Edge Cases / Assumption Risks, 3) Corrected & Verified Final Answer.`
    : `${input.message}${canvasContextSuffix}`;

  userParts.push({ text: userPromptText });

  const contents = [
    ...input.history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: userParts,
    },
  ];

  const thinkingEnum =
    input.thinkingEffort === 'high' || input.verifyTargetTurn
      ? ThinkingLevel.HIGH
      : input.thinkingEffort === 'medium'
      ? ThinkingLevel.MEDIUM
      : ThinkingLevel.LOW;

  const hasUrlInPrompt = /https?:\/\/\S+/i.test(input.message);
  const tools: Array<Record<string, unknown>> = [
    { functionDeclarations: CHATGPT_TOOL_DECLARATIONS },
  ];
  if (input.webSearchEnabled) {
    tools.unshift({ googleSearch: {} });
  }
  if (hasUrlInPrompt) {
    tools.unshift({ urlContext: {} });
  }

  const archLabels: Record<Exclude<ChatGptReasoningArchitecture, 'auto'>, { ar: string; en: string }> = {
    first_principles: { ar: 'المبادئ الأولى', en: 'First-Principles' },
    chain_of_verification: { ar: 'التحقق المتسلسل CoVe', en: 'Chain-of-Verification' },
    tree_of_thoughts: { ar: 'شجرة الأفكار ToT', en: 'Tree-of-Thoughts' },
    react_planner: { ar: 'تخطيط ReAct', en: 'ReAct Planner' },
    socratic_tutor: { ar: 'المعلم التشخيصي', en: 'Socratic Tutor' },
  };
  const archTag = archLabels[activeArch]?.[isAr ? 'ar' : 'en'] ?? activeArch;

  sendChatGptSse(res, {
    type: 'status',
    phase: input.webSearchEnabled ? 'searching' : 'reasoning',
    label: isAr
      ? `تفعيل هيكل [${archTag}] · ${libraryHits.length} مراجع INSCO${input.webSearchEnabled ? ' · بحث الويب' : ''}...`
      : `Applying [${archTag}] · ${libraryHits.length} INSCO refs${input.webSearchEnabled ? ' · Web Grounding' : ''}...`,
  });

  try {
    const candidates = [AGENT_MODELS.primary, AGENT_MODELS.fallback];
    let usedModel = candidates[0];
    let lastError: unknown = null;
    let streamedSuccessfully = false;

    for (const model of candidates) {
      usedModel = model;
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: contents as never,
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: thinkingEnum,
              includeThoughts: input.thinkingEffort !== 'low' || Boolean(input.verifyTargetTurn),
            },
            tools: tools as never,
            toolConfig: {
              includeServerSideToolInvocations: true,
            } as never,
            abortSignal: controller.signal,
          },
        });

        const seenSources = new Map<string, ChatGptGroundingSource>();
        let artifactSeq = 1;

        for await (const chunk of stream) {
          if (controller.signal.aborted) break;

          const parts = chunk.candidates?.[0]?.content?.parts ?? [];
          for (const part of parts) {
            const p = part as { thought?: boolean; text?: string };
            if (typeof p.text === 'string' && p.text.length > 0) {
              if (p.thought) {
                sendChatGptSse(res, { type: 'thought', delta: p.text });
              } else {
                sendChatGptSse(res, { type: 'token', delta: p.text });
              }
            }
          }

          // Collect live grounding citations cleanly
          const gChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
          if (Array.isArray(gChunks) && gChunks.length > 0) {
            let addedNew = false;
            for (const gc of gChunks) {
              const web = (gc as { web?: { uri?: string; title?: string } }).web;
              const safeUri = normaliseSafeExternalUrl(web?.uri);
              if (safeUri && !seenSources.has(safeUri)) {
                seenSources.set(safeUri, {
                  uri: safeUri,
                  title: (web?.title || safeUri).slice(0, 120),
                });
                addedNew = true;
              }
            }
            if (addedNew) {
              sendChatGptSse(res, {
                type: 'sources',
                sources: Array.from(seenSources.values()).slice(0, 8),
              });
            }
          }

          // Handle INSCO tool / canvas / memory calls cleanly
          const fnCalls = chunk.functionCalls ?? [];
          for (const fc of fnCalls) {
            const args = (fc.args && typeof fc.args === 'object' ? fc.args : {}) as Record<string, unknown>;
            if (fc.name === 'open_canvas_document' && typeof args.content === 'string') {
              const kind =
                args.kind === 'code' ||
                args.kind === 'table' ||
                args.kind === 'html' ||
                args.kind === 'svg' ||
                args.kind === 'report'
                  ? args.kind
                  : 'markdown';
              sendChatGptSse(res, {
                type: 'artifact',
                artifact: {
                  id: `canvas-${Date.now()}-${artifactSeq++}`,
                  title: typeof args.title === 'string' && args.title.trim() ? args.title.trim() : 'Canvas',
                  kind,
                  language: typeof args.language === 'string' ? args.language : undefined,
                  content: args.content,
                },
              });
            } else if (fc.name === 'draft_community_post' && typeof args.title === 'string' && typeof args.body === 'string') {
              sendChatGptSse(res, {
                type: 'tool_action',
                action: {
                  label: isAr ? 'إدراج المسودة في مجتمع INSCO' : 'Insert Draft into INSCO Community',
                  actionType: 'apply_post_draft',
                  draftPost: {
                    postType:
                      args.postType === 'job_tender' ||
                      args.postType === 'discussion' ||
                      args.postType === 'equipment_review'
                        ? args.postType
                        : 'technical_case',
                    ndtMethod: typeof args.ndtMethod === 'string' ? args.ndtMethod : 'GENERAL',
                    title: args.title,
                    body: args.body,
                    tags: Array.isArray(args.tags) ? args.tags.map(String).slice(0, 6) : ['INSCO'],
                  },
                },
              });
            } else if (fc.name === 'open_platform_destination' && typeof args.label === 'string') {
              const allowedAction =
                args.actionType === 'open_rfq' ||
                args.actionType === 'open_ar_lab' ||
                args.actionType === 'open_community' ||
                args.actionType === 'open_workshop'
                  ? args.actionType
                  : 'navigate';
              sendChatGptSse(res, {
                type: 'tool_action',
                action: {
                  label: args.label,
                  actionType: allowedAction,
                  target: typeof args.target === 'string' ? args.target : undefined,
                },
              });
            } else if (fc.name === 'save_user_memory' && typeof args.memory === 'string' && args.memory.trim()) {
              sendChatGptSse(res, {
                type: 'memory_saved',
                memory: args.memory.trim().slice(0, 240),
              });
            }
          }
        }

        streamedSuccessfully = true;
        break;
      } catch (err) {
        lastError = err;
        if (controller.signal.aborted) throw err;
        if (isModelMissing(err)) {
          console.warn(`[ai] chatgpt-stream model ${model} unavailable, trying fallback`);
          continue;
        }
        throw err;
      }
    }

    if (!streamedSuccessfully) {
      throw lastError instanceof Error ? lastError : new Error('All models failed');
    }

    sendChatGptSse(res, {
      type: 'done',
      model: usedModel,
      elapsedMs: Date.now() - started,
      architectureUsed: activeArch,
      libraryHitsCount: libraryHits.length,
    });
    res.end();
  } catch (error) {
    const timedOut = controller.signal.aborted;
    const code: TutorErrorCode = timedOut ? 'timeout' : 'upstream_error';
    console.error('[ai] chatgpt-stream failed:', error instanceof Error ? error.message : error);
    sendChatGptSse(res, {
      type: 'error',
      code,
      message: failureMessage(code, input.language),
    });
    res.end();
  } finally {
    clearTimeout(timer);
  }
});

/* ------------------------------------------------------------------ */
/* static hosting                                                      */
/* ------------------------------------------------------------------ */

async function startServer(): Promise<void> {
  const server = createServer(app);

  if (!isProduction) {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vitePromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        // Dev is served at the preview root, so it must not inherit the GitHub
        // Pages `/-Project-/` base. Production builds still use the file config.
        base: '/',
        optimizeDeps: {
          entries: ['index.html'],
        },
        server: {
          middlewareMode: true,
          allowedHosts: true,
          hmr: hmrDisabled ? false : { server },
          watch: {
            ignored: ['**/docs/**', '**/.aistudio/**', '**/tests/**'],
          },
        },
        appType: 'spa',
      })
    );

    app.use((req, res, next) => {
      vitePromise
        .then(vite => vite.middlewares(req, res, next))
        .catch(next);
    });
  } else {
    app.use(express.static(siteRoot));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(siteRoot, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : PORT;
    console.log(`Server listening on http://0.0.0.0:${port} (${isProduction ? 'production' : 'development'})`);
    console.log(`[ai] tutor: ${ai ? `enabled, model ${MODEL_CHAIN[0]}` : 'disabled (no GEMINI_API_KEY)'}`);
    console.log(`[ai] transport: ${API_MODE}${ai ? '' : ' (no key, calls will be refused)'}`);
    console.log(`[rfq] delivery: ${operations.rfqEnabled ? 'configured' : 'not configured (POST /api/rfq will answer 503)'}`);
    console.log(`[admin] portal: ${operations.adminEnabled ? 'enabled' : 'disabled (set ADMIN_PASSWORD and, in production, ADMIN_ORIGIN)'}`);
  });
}

void startServer();
