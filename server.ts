/** Serves the INSCO site, AI/RFQ gateways, and the private admin API. */
import express from 'express';
import type { Request, Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
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
  TutorMeta,
  TutorStatus,
} from './src/ai/contract.js';

import { answerCopilot, answerSiteManager, answerCommunity, copilotSearchQuery } from './src/ai/agentBrain.js';
import { searchPrivateKnowledge } from './server/ai/privateKnowledge.js';
import { buildIndex, searchLibrary, type SearchHit } from './src/ai/search.js';
import { composeSelfAnswer } from './src/ai/selfAnswer.js';
import { isModelMissing, streamTutorText, TutorAiClient, TutorTransportMode } from './src/ai/transport.js';
import { buildTutorLibrary, type TutorLibrary } from './server/tutor/library.js';
import { createOperations } from './server/admin/operations.js';
import { createUniversityRouter } from './server/university/gateway.js';
import { createChatGptStreamRouter } from './server/ai/chatgptStream.js';

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
    ...(document.id.startsWith('drive:') ? { sourceType: 'private-drive' as const } : { sourceType: 'site-library' as const }),
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

/* ------------------------------- جامعة إنسكو الروبوتية ----------------------
 * The Robotic University for industrial construction: twelve specialisations,
 * internet collectors per specialisation, neural cells, the Organising robot
 * and «المعمل» — the AI-agent teaching unit. Read-through is honest about
 * live vs reviewed-archive sources; see universityContract.
 * ------------------------------------------------------------------------ */
const UNIVERSITY_RATE = Math.max(1, parseInt(process.env.UNIVERSITY_RATE_PER_MINUTE || '10', 10));
app.use('/api/university', createUniversityRouter({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
  model: (process.env.UNIVERSITY_MODEL || '').trim() || undefined,
  ratePerMinute: UNIVERSITY_RATE,
}));

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
  source: TutorLibrary['source'] | 'private-drive' | 'mixed';
  hits: SearchHit[];
  documents: number;
  prompt: string;
  system: string;
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
  const citations = hits.map(hit => toCitation(hit, library.source === 'reviewed' && library.reviewedDocuments > 0 && !hit.document.id.startsWith('drive:')));
  const source: TutorPayload['source'] = privateHits.length
    ? (publicHits.length ? 'mixed' : 'private-drive')
    : library.source;
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
    source,
    hits,
    documents: library.documents + privateHits.length,
    prompt: history ? `${history}\n\n${prompt}` : prompt,
    system: `${SYSTEM[request.language]}\n\n${hint}`,
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

function bearerToken(req: Request): string | undefined {
  const authorization = req.header('authorization') || '';
  const match = /^Bearer\s+([A-Za-z0-9._-]{20,})$/i.exec(authorization);
  return match?.[1];
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

// Operational agents remain deterministic and keyless. Hosted model-backed ChatGPT is
// available separately below and is never a prerequisite for these routes.
app.post(AGENT_ENDPOINTS.userCopilot, async (req: Request, res: Response) => {
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

app.post(AGENT_ENDPOINTS.siteManager, (req: Request, res: Response) => {
  const parsed = normaliseSiteManagerRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: { code: 'invalid_request', message: parsed.error } });
    return;
  }
  if (!guardAgentRateLimit(req, res, parsed.value.language)) return;
  res.setHeader('Cache-Control', 'no-store');
  res.json(answerSiteManager(parsed.value));
});

app.post(AGENT_ENDPOINTS.communityAssist, async (req: Request, res: Response) => {
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

app.use(createChatGptStreamRouter({
  ai,
  guardAgentPreconditions,
  loadAiLibrary,
  requestTimeoutMs: Math.max(REQUEST_TIMEOUT_MS, 90_000),
}));

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
