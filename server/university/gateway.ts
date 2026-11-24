/**
 * بوابة الجامعة الروبوتية — the /api/university/* gateway. Express router:
 * the Rector's desk. Every route is honest about where its answer came from
 * (`live` = Gemini with Google Search grounding, `seed` = reviewed offline
 * archive) and everything collected lands as `pending-review`.
 */
import express, { Router, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';

import { AGENT_MODELS } from '../../src/ai/agentsContract.js';
import { HOSTED_GATEWAY_URL, PAGES_SITE_ORIGIN } from '../../src/ai/pagesGateway.js';
import {
  UNIVERSITY_LIMITS,
  normaliseCollectRequest,
  normaliseOrganizeRequest,
  normaliseSynthesizeRequest,
  normaliseTeachRequest,
  type UniversityCollectedRecordPayload,
} from '../../src/ai/universityContract.js';
import {
  departmentById,
  UNIVERSITY_COLLECTORS,
  UNIVERSITY_NEURAL_CELLS,
  type PlatformAgentTargetId,
} from '../../src/data/university.js';
import {
  SEED_KNOWLEDGE,
  buildLabTeachingPack,
  mergeKnowledgeRecords,
  normaliseKnowledgeRecord,
  organizeKnowledgeRecords,
  type KnowledgeRecord,
} from '../../src/data/universityKnowledge.js';
import {
  appendRuntimeRecords,
  asRuntimeId,
  loadRuntimeArchive,
  replaceRuntimeRecords,
  storeIsWritable,
} from './store.js';

export interface UniversityGatewayOptions {
  apiKey: string;
  /** Optional model override (defaults to the agent chain). */
  model?: string;
  ratePerMinute?: number;
}


/* ------------------ CORS (same posture as the AI gateway) ------------------ */
const ALLOWED_ORIGINS = [PAGES_SITE_ORIGIN, HOSTED_GATEWAY_URL];

function allowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  const extra = (process.env.AI_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (ALLOWED_ORIGINS.includes(origin) || extra.includes(origin)) return origin;
  if (/^https:\/\/inscondteg-[a-z0-9-]+-ndt-insco\.vercel\.app$/i.test(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin;
  return null;
}

/* ------------------------- tiny per-IP rate limiter ------------------------ */

interface RateBucket {
  windowStart: number;
  count: number;
}

function makeRateLimiter(limit: number) {
  const buckets = new Map<string, RateBucket>();
  return (key: string): boolean => {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart > 60_000) {
      buckets.set(key, { windowStart: now, count: 1 });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  };
}

const clientKey = (req: Request): string =>
  (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 64);

const sendError = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

const asPayload = (record: KnowledgeRecord): UniversityCollectedRecordPayload => ({ ...record });

function extractJsonArray(text: string): unknown[] | null {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* -------------------------------- router ---------------------------------- */

export function createUniversityRouter(options: UniversityGatewayOptions): Router {
  const router = Router();

  // The static Pages build calls this router cross-origin (to the hosted
  // gateway). Answer the preflight and grant exactly the project's own origins.
  router.use((req, res, next) => {
    res.setHeader('Vary', 'Origin');
    const origin = allowedOrigin(req.headers.origin);
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') {
      res.status(origin ? 204 : 403).end();
      return;
    }
    next();
  });
  router.use(express.json({ limit: '64kb' }));
  const apiKey = options.apiKey.trim();
  const rateLimit = makeRateLimiter(Math.max(1, options.ratePerMinute ?? 10));
  const modelChain = [
    (options.model || '').trim() || AGENT_MODELS.primary,
    AGENT_MODELS.fallback,
    ...AGENT_MODELS.fallbacks,
  ];

  const ai = apiKey
    ? (() => {
        try {
          return new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });
        } catch (error) {
          console.error('[university] AI client init failed:', error);
          return null;
        }
      })()
    : null;

  /** Seed + runtime, with runtime records rewritten to archive ids where needed. */
  const combinedPool = (): KnowledgeRecord[] => [...SEED_KNOWLEDGE, ...loadRuntimeArchive().map(asRuntimeId)];

  /* ------------------------------- status -------------------------------- */
  router.get('/status', (_req, res) => {
    res.json({
      configured: Boolean(ai),
      mode: ai ? 'live' : 'not_configured',
      model: ai ? modelChain[0] : null,
      runtimeRecords: loadRuntimeArchive().length,
      version: 'university-1',
    });
  });

  /* ------------------------------ archive -------------------------------- */
  router.get('/archive', (_req, res) => {
    res.json({ ok: true, records: loadRuntimeArchive().map(asPayload), persisted: storeIsWritable() });
  });

  /* ------------------------------ collect -------------------------------- */
  router.post('/collect', async (req: Request, res: Response) => {
    if (!rateLimit(clientKey(req))) {
      return sendError(res, 429, 'rate_limited', 'Rate limit reached — wait a minute and try again.');
    }
    const bodyBytes = JSON.stringify(req.body ?? {}).length;
    if (bodyBytes > UNIVERSITY_LIMITS.maxRequestBytes) {
      return sendError(res, 413, 'payload_too_large', 'Request body is too large.');
    }
    const request = normaliseCollectRequest(req.body);
    if (!request) {
      return sendError(res, 400, 'bad_request', 'departmentId must be one of the 12 university specialisations.');
    }
    const department = departmentById(request.departmentId)!;
    const collector =
      UNIVERSITY_COLLECTORS.find(agent => agent.id === request.collectorId && agent.departmentId === department.id)
      ?? UNIVERSITY_COLLECTORS.find(agent => agent.departmentId === department.id)!;
    const isAr = request.language === 'ar';

    // ---- honest offline path: serve the reviewed seed, say so plainly. ----
    if (!ai) {
      const seeded = SEED_KNOWLEDGE.filter(record => record.departmentId === department.id);
      return res.json({
        ok: true,
        mode: 'seed',
        departmentId: department.id,
        collectorId: collector.id,
        persisted: false,
        message: {
          ar: 'بوابة الذكاء الاصطناعي غير مهيأة على هذه النسخة — هذه السجلات من الأرشيف العلمي الموثق المبدئي وليست نتيجة تصفح حي.',
          en: 'No AI gateway configured on this deployment — these are reviewed archival records, not a live browse.',
        },
        records: seeded.map(asPayload),
      });
    }

    // ---- live path: Gemini + Google Search grounding. -------------------
    const focus = request.query?.trim() || (isAr ? department.ar : department.en);
    const systemInstruction = [
      `You are the INSCO Industrial-Construction University internet collector «${collector.en}», assigned to the department «${department.en}» (${department.ar}).`,
      'Harvest DOCUMENTED knowledge using live web search. Rules you must obey:',
      '1. Prefer primary sources: standards bodies (ASME, API, AWS, ISO, ASTM, CEN/EN), authorities (OSHA, NIST), accredited education (MIT OCW, Iowa State NDE-ED), recognised publishers. Encyclopedias only as secondary support.',
      '2. Paraphrase — never copy long passages verbatim.',
      '3. Write in BOTH Arabic and English. Arabic is the primary language of the academy.',
      '4. Every record MUST carry at least 2 HTTPS sources with title, publisher and url. Never invent a URL.',
      '5. Name codes exactly as published (e.g. ASME B31.3, ISO 9606-1) — if unsure of an exact clause number, name the code without the clause.',
      '6. Return 3 to 5 records, focused on: ' + focus,
      '7. Respond with a strict JSON array only, no prose, with items shaped exactly:',
      '{"titleAr": string, "titleEn": string, "summaryAr": string, "summaryEn": string, "keyPointsAr": string[], "keyPointsEn": string[], "formula": string | undefined, "sources": [{"title": string, "publisher": string, "url": string}]}',
    ].join('\n');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      let lastError: unknown = null;
      for (const model of modelChain) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `${isAr ? 'اجمع' : 'Collect'} documented knowledge for: ${focus}`,
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }] as never,
              abortSignal: controller.signal,
            },
          });
          const text = (response.text || '').trim();
          const items = text ? extractJsonArray(text) : null;
          if (!items || items.length === 0) {
            throw new Error('Model returned no parseable JSON array');
          }
          const nowIso = new Date().toISOString();
          const collected: KnowledgeRecord[] = [];
          for (const [index, item] of items.entries()) {
            const record = normaliseKnowledgeRecord(item, {
              departmentId: department.id,
              collectedBy: collector.id,
              nowIso,
              sequence: index,
            });
            if (record) collected.push(record);
            if (collected.length >= UNIVERSITY_LIMITS.maxRecordsReturned) break;
          }
          if (collected.length === 0) {
            throw new Error('Model output failed validation (need HTTPS sources and ≥2 key points)');
          }

          // The Organising robot assigns archive codes to everything it stores.
          const { records: organised } = organizeKnowledgeRecords([
            ...SEED_KNOWLEDGE,
            ...loadRuntimeArchive().map(asRuntimeId),
            ...collected,
          ]);
          const collectedCoded = organised.filter(candidate =>
            collected.some(entry => entry.id === candidate.id)
          );
          const saveResult = appendRuntimeRecords(collectedCoded.map(asRuntimeId));

          return res.json({
            ok: true,
            mode: 'live',
            departmentId: department.id,
            collectorId: collector.id,
            persisted: saveResult.persisted,
            message: {
              ar: `جمع ${collectedCoded.length} سجلات موثقة من الإنترنت (نموذج ${model}). كل سجل «قيد المراجعة» حتى يوقّعه مختص — لا يُعتمد تلقائيًا.`,
              en: `Collected ${collectedCoded.length} documented records from the open web (model ${model}). Every record is «pending review» until a specialist signs it — never auto-approved.`,
            },
            records: collectedCoded.map(asPayload),
          });
        } catch (error) {
          lastError = error;
          if (controller.signal.aborted) break;
          console.warn(`[university] collector model ${model} failed, trying next:`, error);
        }
      }
      console.error('[university] collect failed:', lastError);
      return sendError(
        res,
        502,
        'upstream_error',
        isAr
          ? 'تعذر جمع مصادر موثقة من الإنترنت الآن — حاول لاحقًا أو راجع الأرشيف الموثق.'
          : 'Could not gather documented sources from the web right now — try later or consult the archive.'
      );
    } finally {
      clearTimeout(timer);
    }
  });

  /* ---------------------------- synthesize ------------------------------- */
  router.post('/synthesize', (req: Request, res: Response) => {
    if (!rateLimit(clientKey(req))) {
      return sendError(res, 429, 'rate_limited', 'Rate limit reached — wait a minute and try again.');
    }
    const request = normaliseSynthesizeRequest(req.body);
    if (!request) {
      return sendError(res, 400, 'bad_request', 'departmentId must be one of the 12 university specialisations.');
    }
    const department = departmentById(request.departmentId)!;
    const cell = UNIVERSITY_NEURAL_CELLS.find(candidate => candidate.departmentId === department.id)!;
    const isAr = request.language === 'ar';

    const pool = combinedPool().filter(record => record.departmentId === department.id);
    const merged = mergeKnowledgeRecords(pool, cell.id);

    // Persist only what this department owns at runtime (rewritten to live ids).
    const runtimeOut = merged.records
      .filter(record => record.id.includes('-live-') || record.evolvedBy.includes(cell.id))
      .map(asRuntimeId);
    const saveResult = runtimeOut.length
      ? replaceRuntimeRecords(department.id, runtimeOut)
      : { records: [], persisted: false, evicted: 0, kept: loadRuntimeArchive().length };

    res.json({
      ok: true,
      mode: ai ? 'live' : 'seed',
      departmentId: department.id,
      cellId: cell.id,
      mergedCount: merged.mergedCount,
      persisted: saveResult.persisted,
      message: {
        ar: merged.mergedCount > 0
          ? `الخلية «${cell.ar}» دمجت ${merged.mergedCount} فرق مكررة ورفعت الإصدارات — والنتائج «قيد المراجعة».`
          : `الخلية «${cell.ar}» راجعت ${merged.records.length} سجلات — ولا مكرر يحتاج دمجًا.`,
        en: merged.mergedCount > 0
          ? `Cell «${cell.en}» merged ${merged.mergedCount} duplicate groups and bumped versions — results are «pending review».`
          : `Cell «${cell.en}» digested ${merged.records.length} records — no duplicates required merging.`,
      },
      records: merged.records.map(asPayload),
      changes: merged.changes,
    });
  });

  /* ------------------------------ organize ------------------------------- */
  router.post('/organize', (req: Request, res: Response) => {
    if (!rateLimit(clientKey(req))) {
      return sendError(res, 429, 'rate_limited', 'Rate limit reached — wait a minute and try again.');
    }
    const request = normaliseOrganizeRequest(req.body);
    const organised = organizeKnowledgeRecords(combinedPool());
    // Persist the runtime slice with the codes/statuses the audit produced.
    const runtimeOut = organised.records
      .filter(record => record.id.includes('-live-'))
      .map(asRuntimeId);
    if (runtimeOut.length) {
      const departments = [...new Set(runtimeOut.map(record => record.departmentId))];
      for (const departmentId of departments) {
        replaceRuntimeRecords(
          departmentId,
          runtimeOut.filter(record => record.departmentId === departmentId)
        );
      }
    }

    res.json({
      ok: true,
      message: {
        ar: organised.codesAssigned > 0
          ? `«المُنظِّم» راجع ${organised.records.length} سجلًا، أسند ${organised.codesAssigned} كودًا جديدًا وأبقى ${organised.codesKept} كما هو.`
          : `«المُنظِّم» راجع ${organised.records.length} سجلًا — كل الأكواد مستقرة وصالحة.`,
        en: organised.codesAssigned > 0
          ? `The Organising robot audited ${organised.records.length} records, assigned ${organised.codesAssigned} new codes and kept ${organised.codesKept} stable.`
          : `The Organising robot audited ${organised.records.length} records — all codes stable and valid.`,
      },
      stats: organised.stats,
      actions: organised.actions,
      codesAssigned: organised.codesAssigned,
      codesKept: organised.codesKept,
    });
  });

  /* -------------------------------- teach -------------------------------- */
  router.post('/lab/teach', (req: Request, res: Response) => {
    if (!rateLimit(clientKey(req))) {
      return sendError(res, 429, 'rate_limited', 'Rate limit reached — wait a minute and try again.');
    }
    const request = normaliseTeachRequest(req.body);
    if (!request) {
      return sendError(res, 400, 'bad_request', 'departmentId and targetId must be valid university specialisations and platform agents.');
    }
    const isAr = request.language !== 'en';
    const pool = combinedPool().filter(record => record.departmentId === request.departmentId);
    const source = pool.length ? pool : [...SEED_KNOWLEDGE];
    const pack = buildLabTeachingPack(request.departmentId, request.targetId as PlatformAgentTargetId, source);
    if (!pack) {
      return sendError(res, 422, 'no_materials', isAr ? 'لا توجد مادة كافية لتوليد حزمة التعليم.' : 'Not enough material to build a teaching pack.');
    }
    res.json({ ok: true, mode: 'seed', pack });
  });

  // 404 for unknown /api/university/* paths: say it plainly.
  router.use((_req, res) => sendError(res, 404, 'not_found', 'Unknown university endpoint.'));

  return router;
}

