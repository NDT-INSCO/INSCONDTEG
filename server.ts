/**
 * INSCO academy server.
 *
 * Serves the built SPA (or runs Vite in dev) and hosts the AI gateway.
 *
 * The gateway exists because the site is published statically: a Gemini key in
 * the browser would be public. Here the key stays on the server, the browser
 * only sees `/api/ai/*`, and when no key is configured the API says so with a
 * 503 instead of inventing an answer. That is the whole design.
 */
import express from 'express';
import type { Request, Response } from 'express';
import { existsSync } from 'fs';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
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
} from './src/ai/contract';
import type { CorpusDocument, CorpusStats } from './src/ai/corpus';
import type { SearchHit } from './src/ai/search';
import { streamTutorText, TutorAiClient, TutorTransportMode } from './src/ai/transport';

dotenv.config();

type AiLibraryModule = {
  getCorpus: () => CorpusDocument[];
  getCorpusStats: () => CorpusStats;
  retrieveForTutor: (query: string, options?: { limit?: number; discipline?: string }) => SearchHit[];
};

let aiLibraryPromise: Promise<AiLibraryModule> | null = null;

function loadAiLibrary(): Promise<AiLibraryModule> {
  if (!aiLibraryPromise) {
    aiLibraryPromise = Promise.all([
      import('./src/ai/corpus'),
      import('./src/ai/search'),
    ]).then(([corpusMod, searchMod]) => ({
      getCorpus: corpusMod.getCorpus,
      getCorpusStats: corpusMod.getCorpusStats,
      retrieveForTutor: searchMod.retrieveForTutor,
    }));
  }
  return aiLibraryPromise;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
        return new GoogleGenAI({ apiKey: API_KEY });
      } catch (error) {
        clientInitError = error instanceof Error ? error.message : String(error);
        console.error('[ai] client init failed:', clientInitError);
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
  upstream_error: 502,
};

/* ------------------------------------------------------------------ */
/* prompt assembly                                                     */
/* ------------------------------------------------------------------ */

const SYSTEM: Record<'ar' | 'en', string> = {
  ar: [
    'أنت مدرّس في أكاديمية إنسكو للفحص غير الإتلافي (NDT) والمعالجة الحرارية.',
    'قواعد ملزمة:',
    '1) أجب فقط من المقاطع المرفقة ومن مبادئ الفيزياء والهندسة العامة. إن لم يكفِ السياق فقل بصراحة: «لا أجد هذا في مكتبة إنسكو» واقترح ما يمكن البحث عنه.',
    '2) لا تخترع نص بند كود ولا رقم بند ولا نسبة قبول. عند ذكر كود، اذكر رقم البند فقط إن ورد في المقاطع.',
    '3) بعد كل فكرة استشهد بمعرّف المقطع بين قوسين مربعين مثل [book-ut#p3] أو [nde-ut#ut-calibration].',
    '4) هذه مادة دراسة ذاتية، وليست شهادة ولا تأهيلاً. لا تدّعِ اعتماداً من ASNT أو ISO.',
    '5) اكتب عربياً هندسياً واضحاً، بفقرات قصيرة، وبنقاط عند التعداد. لا تكرر السؤال.',
  ].join('\n'),
  en: [
    'You are a tutor at the INSCO academy for non-destructive testing and heat treatment.',
    'Binding rules:',
    '1) Answer only from the provided passages plus general physics and engineering. If the context is insufficient, say plainly "I cannot find this in the INSCO library" and suggest what to search for.',
    '2) Never invent code clause text, clause numbers or acceptance percentages. Cite a clause number only when it appears in the passages.',
    '3) After each claim, cite the passage id in square brackets, e.g. [book-ut#p3] or [nde-ut#ut-calibration].',
    '4) This is self-study material, not a certificate or a qualification. Never claim ASNT or ISO accreditation.',
    '5) Write clear technical English in short paragraphs, using bullets for lists. Do not restate the question.',
  ].join('\n'),
};

const MODE_HINT: Record<string, { ar: string; en: string }> = {
  explain: { ar: 'اشرح المفهوم من الأساس مع مثال عددي إن أمكن.', en: 'Explain from first principles, with a worked number if possible.' },
  compare: { ar: 'قارن بين الطريقتين/الحالتين في جدول أو نقاط، واذكر متى تُستخدم كل واحدة.', en: 'Compare the two methods/cases in a table or bullets, and say when each applies.' },
  code: { ar: 'ركّز على متطلبات الكود: ماذا يطلب، وعلى من ينطبق، وما حدود الاستخدام.', en: 'Focus on code requirements: what is required, to whom it applies, and its limits.' },
  practice: { ar: 'اطرح سؤالاً تدريبياً واحداً ثم حلّه خطوة بخطوة.', en: 'Pose one practice question, then solve it step by step.' },
};

function toCitation(hit: SearchHit): TutorCitation {
  const document = hit.document;
  return {
    id: document.id,
    kind: document.kind,
    title: document.title,
    bookId: document.bookId,
    pageNumber: document.pageNumber,
    courseId: document.courseId,
    score: Math.round(hit.score * 100) / 100,
  };
}

function buildContext(hits: SearchHit[], language: 'ar' | 'en'): string {
  const blocks: string[] = [];
  let budget = TUTOR_LIMITS.contextChars;
  for (const hit of hits) {
    const document = hit.document;
    const heading = `[${document.id}] ${document.title[language] || document.title.ar} — ${
      document.kind === 'textbook' ? `${document.bookId} p${document.pageNumber}` : document.kind
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
app.use(express.json({ limit: '96kb' }));

app.get(TUTOR_ENDPOINTS.status, async (_req: Request, res: Response) => {
  const { getCorpus } = await loadAiLibrary();
  const status: TutorStatus = {
    configured: Boolean(ai),
    reason: ai ? 'ok' : clientInitError ? 'client_init_failed' : 'no_key',
    model: MODEL_CHAIN[0],
    deepModel: TUTOR_MODELS.deep,
    limits: TUTOR_LIMITS,
    retrieval: { documents: getCorpus().length, ready: true },
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
  const { retrieveForTutor } = await loadAiLibrary();
  const request = parsed.value;
  const question = latestQuestion(request);
  const hits = retrieveForTutor(question, { limit: TUTOR_LIMITS.passages });
  const citations = hits.map(toCitation);
  const confident = hits.length > 0;

  const context = buildContext(hits, request.language);
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
      error: { ...failure, message: failureMessage(failure.code, 'ar') },
    });
    return;
  }

  if (!ai) {
    // Honest failure: no key means no answer. The old build returned a canned
    // paragraph here, which is worse than saying nothing.
    res.status(STATUS_CODE.not_configured).json({
      error: {
        code: 'not_configured',
        message: failureMessage('not_configured', 'ar'),
        detail: 'Set GEMINI_API_KEY on the server that hosts /api/ai/*.',
      },
    });
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
      console.error('[ai] tutor failed:', error instanceof Error ? error.message : error);
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

  // Nothing retrieved: answer from the library boundary, not from the model.
  if (!payload.confident) {
    const { getCorpusStats } = await loadAiLibrary();
    const stats = getCorpusStats();
    const message =
      payload.language === 'ar'
        ? `لم أجد سؤالاً مطابقاً في مكتبة إنسكو (${stats.pages} صفحة و${stats.lessons} درساً). جرّب صياغة أخرى، أو استخدم البحث في المكتبة، أو اذكر الطريقة (VT/PT/MT/UT/RT/ET) والكود الذي تسأل عنه.`
        : `I could not match this question to the INSCO library (${stats.pages} pages, ${stats.lessons} lessons). Try different wording, use library search, or name the method (VT/PT/MT/UT/RT/ET) and the code you are asking about.`;
    res.write(encodeSse({ type: 'delta', text: message }));
    res.write(encodeSse({ type: 'done' }));
    res.end();
    clearTimeout(timer);
    return;
  }

  try {
    for await (const delta of streamFromModel(payload.prompt, payload.system, controller.signal)) {
      res.write(encodeSse({ type: 'delta', text: delta }));
    }
    res.write(encodeSse({ type: 'done' }));
  } catch (error) {
    const timedOut = controller.signal.aborted;
    const code: TutorErrorCode = timedOut ? 'timeout' : 'upstream_error';
    console.error('[ai] stream failed:', error instanceof Error ? error.message : error);
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
/* static hosting                                                      */
/* ------------------------------------------------------------------ */

async function startServer(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
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
    const distCandidate = path.resolve(__dirname, 'dist');
    const staticRoot = existsSync(distCandidate)
      ? distCandidate
      : path.resolve(__dirname, 'docs');
    app.use(express.static(staticRoot));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(staticRoot, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
    console.log(`[ai] tutor: ${ai ? `enabled, model ${MODEL_CHAIN[0]}` : 'disabled (no GEMINI_API_KEY)'}`);
    console.log(`[ai] transport: ${API_MODE}${ai ? '' : ' (no key, calls will be refused)'}`);
  });
}

void startServer();
