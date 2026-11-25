import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import express, { type ErrorRequestHandler, type Request, type RequestHandler, type Response } from 'express';
import { isAdminPassword, isAdminToken, isQuoteStatus, INSCO_PAGES_ORIGIN, NOTICE_LIMIT } from '../../src/admin/contract.js';
import type { AnnouncementInput, DashboardData } from '../../src/admin/contract.js';
import { FACTORY_DRAFT_PATH, FACTORY_LIMITS, normaliseFactoryDraft, normaliseFactoryRequest } from '../../src/admin/factory.js';
import type { FactoryDrafter } from './factory.js';
import { clientAddress, fail, readJsonBody, readTokenCookie, runAsync } from './http.js';
import { createPasskeyRouter } from './passkeys.js';
import { PASSKEY_PASSWORD_WINDOW, PAGES_SESSION_TTL, SESSION_TTL } from './state.js';
import type { WebAuthnCredential } from '@simplewebauthn/server';
import type { AdminStore } from './store.js';
import { normaliseAgentTaskProposal } from '../../src/ai/agentTasksContract.js';

const ATTEMPT_WINDOW = 15 * 60 * 1000;
const COOKIE = 'insco_admin';
const COOKIE_PATH = '/api/admin';

export function httpOrigin(value?: string): string | null {
  try {
    const url = new URL(value ?? '');
    return ['http:', 'https:'].includes(url.protocol) && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password
      ? url.origin : null;
  } catch {
    return null;
  }
}

/** Existing PIN deployments keep leading zeros and accept both forms of Arabic numerals. */
function parseLegacyPin(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 8 || value.length > 32) return null;
  const digits = value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) & 0xf));
  return /[^0-9]/.test(digits) ? null : digits;
}

export function adminConfig(env: NodeJS.ProcessEnv, production: boolean) {
  const password = env.ADMIN_PASSWORD;
  const legacyPin = !password;
  const secret = legacyPin ? parseLegacyPin(env.ADMIN_PIN) : isAdminPassword(password) ? password : null;
  const originValue = env.ADMIN_ORIGIN?.trim();
  const origin = httpOrigin(originValue);
  if (!secret || (originValue && !origin) || (production && !origin?.startsWith('https://'))) return null;
  return { secret, legacyPin, origin };
}

function mutationOrigin(req: Request, configured: string | null): string | null {
  const origin = httpOrigin(req.get('origin'));
  if (!origin) return null;
  if (configured) return configured === origin ? origin : null;
  // Development fallback only. In production require an explicit HTTPS origin.
  const url = new URL(origin);
  return url.host === req.get('host') && (url.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    ? origin : null;
}

function pagesSession(req: Request) {
  const token = /^Bearer (\S+)$/i.exec(req.get('authorization') ?? '')?.[1];
  return isAdminToken(token) ? token : undefined;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' });
  next();
};

function announcementInput(body: unknown): AnnouncementInput | null {
  if (!body || typeof body !== 'object') return null;
  const { enabled, message } = body as Partial<AnnouncementInput>;
  if (typeof enabled !== 'boolean' || typeof message?.ar !== 'string' || typeof message?.en !== 'string') return null;
  const ar = message.ar.trim();
  const en = message.en.trim();
  if (ar.length > NOTICE_LIMIT || en.length > NOTICE_LIMIT || (enabled && (!ar || !en))) return null;
  return { enabled, message: { ar, en } };
}

interface AdminOptions {
  config: ReturnType<typeof adminConfig>;
  store: AdminStore | null;
  services: DashboardData['services'];
  now?: () => number;
  stateKey?: Uint8Array;
  draftFactory?: FactoryDrafter | null;
  pages?: boolean;
}

export function createAdminRouter({
  config, store, services, draftFactory, now = Date.now, stateKey = randomBytes(32),
  pages = false,
}: AdminOptions) {
  const router = express.Router();
  router.use(noStore);

  if (!config || !store) {
    router.use((_req, res) => fail(res, 503, 'not_configured'));
    return router;
  }

  const salt = randomBytes(16);
  const hash = scryptSync(config.secret, salt, 32);
  const signInOrigin = pages ? INSCO_PAGES_ORIGIN : config.origin;
  // The backend and browser origins both bind Pages sessions; keep the existing
  // cookie scope byte-for-byte unchanged on hosted/standalone sign-in.
  const scope = createHmac('sha256', stateKey).update(JSON.stringify([
    config.origin, config.secret, config.legacyPin, ...(pages ? ['pages-v1', signInOrigin] : []),
  ])).digest('hex');
  const state = store.auth(scope, stateKey, signInOrigin);
  const sessionToken = pages ? pagesSession : (req: Request) => readTokenCookie(req, COOKIE);

  async function issueSession(req: Request, res: Response, passkey?: WebAuthnCredential) {
    const token = await state.issueSession(sessionToken(req), now(), passkey, pages ? PAGES_SESSION_TTL : SESSION_TTL);
    if (!token) return fail(res, 401, 'passkey_verification_failed');
    if (pages) {
      res.json({ token });
      return;
    }
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: res.locals.cookieSecure, path: COOKIE_PATH, maxAge: SESSION_TTL });
    res.status(204).end();
  }

  const requireSession = runAsync(async (req, res, next) => {
    const token = sessionToken(req);
    const session = await state.session(token, now());
    if (!session || !token) return fail(res, 401, 'signed_out');
    res.locals.sessionGrant = state.grant(token);
    res.locals.sessionExpiresAt = session.expiresAt;
    res.locals.passwordAt = session.passwordAt;
    next();
  });

  router.use((req, res, next) => {
    if (pages) return req.get('origin') === signInOrigin ? next() : fail(res, 403, 'origin_not_allowed');
    if (['GET', 'HEAD'].includes(req.method)) return next();
    const origin = mutationOrigin(req, config.origin);
    if (!origin) return fail(res, 403, 'origin_not_allowed');
    res.locals.cookieSecure = origin.startsWith('https:');
    next();
  });

  const readJson = readJsonBody();

  router.post('/login', readJson, runAsync(async (req, res) => {
    const time = now();
    const address = clientAddress(req);
    // Reserve the budgets before password verification, including across workers.
    const retry = await state.throttle(address, time, { purpose: 'password', window: ATTEMPT_WINDOW, perAddress: 5, total: 40 });
    if (retry) {
      res.set('Retry-After', String(retry));
      return fail(res, 429, 'rate_limited');
    }
    const input: unknown = req.body?.password ?? req.body?.pin;
    const secret = config.legacyPin ? parseLegacyPin(input) : isAdminPassword(input) ? input : null;
    if (!secret || !timingSafeEqual(hash, scryptSync(secret, salt, 32))) {
      return fail(res, 401, 'invalid_credentials');
    }
    await state.resetAddress(address, 'password', time);
    await issueSession(req, res);
  }));

  router.post('/logout', runAsync(async (req, res) => {
    await state.forgetSession(sessionToken(req));
    if (!pages) res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: res.locals.cookieSecure, path: COOKIE_PATH });
    res.status(204).end();
  }));

  router.use('/passkeys', createPasskeyRouter({
    origin: signInOrigin, store, state, now, requireSession, pages,
    canManage: res => typeof res.locals.passwordAt === 'number' && now() < res.locals.passwordAt + PASSKEY_PASSWORD_WINDOW,
    signIn: issueSession,
  }));

  router.use(requireSession);

  router.get('/dashboard', runAsync(async (_req, res) => {
    const time = now();
    const data: DashboardData = {
      sessionExpiresAt: res.locals.sessionExpiresAt,
      updatedAt: new Date(time).toISOString(),
      ...await store.overview(time),
      services: { ...services, ...(draftFactory ? { factoryAiConfigured: true } : {}) },
    };
    res.json(data);
  }));

  // Covered by the same origin and session gates as every other private mutation.
  // This route only returns a draft. No generated code is evaluated or installed.
  router.post(FACTORY_DRAFT_PATH, readJsonBody('10kb'), runAsync(async (req, res) => {
    if (!draftFactory) return fail(res, 503, 'factory_not_configured');
    const input = normaliseFactoryRequest(req.body);
    if (!input) return fail(res, 400, 'factory_invalid_request');
    const time = now();
    const retry = await state.throttle(clientAddress(req), time, { purpose: 'factory', window: ATTEMPT_WINDOW, perAddress: 4, total: 12 });
    if (retry) {
      res.set('Retry-After', String(retry));
      return fail(res, 429, 'rate_limited');
    }
    const snapshot = input.includeSnapshot ? await store.factoryContext(time) : null;
    if (res.destroyed) return;
    const controller = new AbortController();
    const stop = () => controller.abort();
    const timer = setTimeout(stop, FACTORY_LIMITS.requestMs);
    const interrupted = new Promise<null>(resolve => controller.signal.addEventListener('abort', () => resolve(null), { once: true }));
    res.once('close', stop);
    try {
      // Stop waiting at the deadline even if the upstream iterator is slow to abort.
      const draft = normaliseFactoryDraft(await Promise.race([draftFactory(input, snapshot, controller.signal), interrupted]));
      if (res.destroyed) return;
      if (controller.signal.aborted) return fail(res, 504, 'factory_timeout');
      if (!draft) return fail(res, 502, 'factory_invalid_draft');
      res.json(draft);
    } catch {
      if (!res.destroyed) fail(res, controller.signal.aborted ? 504 : 502, controller.signal.aborted ? 'factory_timeout' : 'factory_unavailable');
    } finally {
      clearTimeout(timer);
      res.off('close', stop);
    }
  }));

  // Agent proposals are private, persisted and inert. Approval is recorded for audit;
  // it does not execute code, publish content, or mutate customer records.
  router.get('/agents/tasks', runAsync(async (_req, res) => {
    res.json({ items: await store.listAgentTasks(50) });
  }));

  router.post('/agents/tasks', readJsonBody('4kb'), runAsync(async (req, res) => {
    const input = normaliseAgentTaskProposal(req.body);
    if (!input) return fail(res, 400, 'agent_task_invalid');
    const createdAt = new Date(now()).toISOString();
    const task = await store.proposeAgentTask({ id: randomUUID(), ...input, createdAt });
    res.status(201).json(task);
  }));

  router.patch('/agents/tasks/:id', readJson, runAsync(async (req, res) => {
    const decision = req.body?.decision;
    if (decision !== 'approved' && decision !== 'rejected') return fail(res, 400, 'agent_task_invalid_decision');
    const task = await store.agentTask(req.params.id);
    if (!task) return fail(res, 404, 'agent_task_not_found');
    const reviewedAt = new Date(now()).toISOString();
    const reviewed = await store.reviewAgentTask(req.params.id, decision, 'admin-session', reviewedAt);
    if (!reviewed) return fail(res, 409, 'agent_task_already_reviewed');
    res.json(await store.agentTask(req.params.id));
  }));

  router.get('/quotes', runAsync(async (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 160) : '';
    const status = isQuoteStatus(req.query.status) ? req.query.status : null;
    const page = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    res.json(await store.listQuotes(search, status, Number.isSafeInteger(page) ? page : 1));
  }));

  router.get('/quotes/:reference', runAsync(async (req, res) => {
    const quote = await store.quote(req.params.reference);
    if (!quote) return fail(res, 404, 'quote_not_found');
    res.json(quote);
  }));

  router.patch('/quotes/:reference', readJson, runAsync(async (req, res) => {
    const status: unknown = req.body?.status;
    if (!isQuoteStatus(status)) return fail(res, 400, 'invalid_request');
    if (!await store.updateQuote(req.params.reference, status)) return fail(res, 404, 'quote_not_found');
    res.json(await store.quote(req.params.reference));
  }));

  router.put('/announcement', readJson, runAsync(async (req, res) => {
    const input = announcementInput(req.body);
    if (!input) return fail(res, 400, 'invalid_announcement');
    res.json(await store.saveAnnouncement(input, new Date(now()).toISOString()));
  }));

  router.use((_req, res) => fail(res, 404, 'not_found'));
  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.status >= 400 && error.status < 500) return fail(res, error.status, 'invalid_request');
    console.error('[admin] Could not complete an admin request.');
    fail(res, 500, 'storage_error');
  };
  router.use(handleError);
  return router;
}

/** Public routes may accept the static site's exact origin, never cookies or admin access. */
export function publicSiteCors(origin: string | null): RequestHandler {
  return (req, res, next) => {
    if (origin) res.vary('Origin');
    const allowed = origin && req.get('origin') === origin;
    if (allowed) res.set('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      if (!allowed) return fail(res, 403, 'origin_not_allowed');
      res.set({ 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
      return res.status(204).end();
    }
    next();
  };
}

export function publicAnnouncement(store: AdminStore | null): RequestHandler {
  return runAsync(async (_req, res) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    try {
      const announcement = await store?.announcement();
      res.json({ message: announcement?.enabled ? announcement.message : null });
    } catch {
      console.error('[admin] Could not read the published announcement.');
      fail(res, 503, 'storage_error');
    }
  });
}
