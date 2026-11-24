/**
 * Vercel function for the AI gateway: `/api/ai/*` on the deployed site.
 *
 * Before this file existed the deployed build served the site, the admin API and the
 * RFQ endpoint, but nothing answered `/api/ai/*` — so every tutor or copilot call got
 * Vercel's 404, and the client reported it as a missing `GEMINI_API_KEY`. The key was
 * fine; the route was absent. This function mounts the very same router `server.ts`
 * mounts, so there is one implementation and one behaviour.
 *
 * The reviewed corpus (`edb/`) is bundled with the function (see `vercel.json`
 * `includeFiles`) because the tutor reads it from disk at request time.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { createAiGateway } from '../server/ai/gateway.js';
import { createChatGptStreamRouter } from '../server/ai/chatgptStream.js';
import { buildTutorLibrary } from '../server/tutor/library.js';

// The corpus is read from `edb/` at request time. `includeFiles` bundles `public/edb`,
// and `dist` stays first for a local run of the built app. Nothing here guesses: when
// neither directory exists the status route reports `retrieval.ready: false` and the
// tutor declines instead of inventing an answer.
const edbRoot =
  ['public', 'dist', '.'].map(dir => path.join(process.cwd(), dir)).find(dir => existsSync(path.join(dir, 'edb'))) ??
  process.cwd();

const app = express();
app.disable('x-powered-by');

// Never let a stalled upstream turn into a silent hang: a serverless request that
// neither answers nor errors is the worst outcome for whoever is looking at it.
app.use((_req, res, next) => {
  res.setTimeout(55_000, () => {
    if (res.headersSent) return;
    res.status(504).json({ error: { code: 'timeout', message: 'The AI gateway did not answer in time.' } });
  });
  next();
});

// The standalone server and Vercel expose the exact same ChatGPT stream handler. The
// browser previously hit the gateway's generic 404 on this route, despite its UI and
// server.ts implementation being present.
const chatKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
let chatAi: GoogleGenAI | null = null;
if (chatKey) {
  try {
    chatAi = new GoogleGenAI({ apiKey: chatKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  } catch {
    chatAi = null;
  }
}
let chatLibrary: ReturnType<typeof buildTutorLibrary> | null = null;
const loadChatLibrary = async () => {
  chatLibrary ??= buildTutorLibrary(
    file => readFileSync(path.join(edbRoot, 'edb', file), 'utf8'),
    { allowAcademyFallback: process.env.TUTOR_ALLOW_ACADEMY_FALLBACK !== 'false' }
  );
  return chatLibrary.library;
};
const chatRateBuckets = new Map<string, { start: number; count: number }>();
const chatGuard = (req: Request, res: Response, lang: 'ar' | 'en'): boolean => {
  const ip = (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 80);
  const now = Date.now();
  const bucket = chatRateBuckets.get(ip);
  if (!bucket || now - bucket.start >= 60_000) chatRateBuckets.set(ip, { start: now, count: 1 });
  else if (bucket.count >= 8) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: { code: 'rate_limited', message: lang === 'ar' ? 'تم تجاوز حد الطلبات؛ حاول بعد دقيقة.' : 'Rate limit reached; retry in one minute.' } });
    return false;
  } else bucket.count += 1;
  if (!chatAi) {
    res.status(503).json({ error: { code: 'not_configured', message: lang === 'ar' ? 'خدمة البحث والتوليد غير مهيأة على الخادم.' : 'The server-side Gemini service is not configured.' } });
    return false;
  }
  return true;
};
app.use(express.json({ limit: '6mb' }));
app.use(createChatGptStreamRouter({
  ai: chatAi,
  guardAgentPreconditions: chatGuard,
  loadAiLibrary: loadChatLibrary,
  requestTimeoutMs: 53_000,
}));
app.use(createAiGateway(edbRoot));
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Unknown AI route.' } });
});

export default app;
