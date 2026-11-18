import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import express, { type ErrorRequestHandler, type Request, type RequestHandler, type Response } from 'express';
import { isAdminPassword, isQuoteStatus, NOTICE_LIMIT } from '../../src/admin/contract';
import type { AnnouncementInput, DashboardData } from '../../src/admin/contract';
import type { AdminStore } from './store';

const SESSION_TTL = 4 * 60 * 60 * 1000;
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

function sessionToken(req: Request): string | undefined {
  const value = req.get('cookie')?.split(';').map(pair => pair.trim()).find(pair => pair.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' });
  next();
};

function fail(res: Response, status: number, error: string) {
  res.status(status).json({ error });
}

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
}

export function createAdminRouter({ config, store, services, now = Date.now }: AdminOptions) {
  const router = express.Router();
  router.use(noStore);

  if (!config || !store) {
    router.use((_req, res) => fail(res, 503, 'not_configured'));
    return router;
  }

  const salt = randomBytes(16);
  const hash = scryptSync(config.secret, salt, 32);
  const sessions = new Map<string, number>();
  const attempts = new Map<string, number>();
  let totalAttempts = 0;
  let windowEnds = 0;

  router.use((req, res, next) => {
    if (['GET', 'HEAD'].includes(req.method)) return next();
    const origin = mutationOrigin(req, config.origin);
    if (!origin) return fail(res, 403, 'origin_not_allowed');
    res.locals.cookieSecure = origin.startsWith('https:');
    next();
  });

  const readJson: RequestHandler[] = [
    (req, res, next) => {
      if (!req.is('application/json')) return fail(res, 415, 'invalid_request');
      next();
    },
    express.json({ limit: '4kb' }),
  ];

  router.post('/login', readJson, (req: Request, res: Response) => {
    const time = now();
    const address = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    if (time >= windowEnds) {
      windowEnds = time + ATTEMPT_WINDOW;
      attempts.clear();
      totalAttempts = 0;
    }
    const misses = attempts.get(address) ?? 0;
    if (misses >= 5 || totalAttempts >= 40) {
      res.set('Retry-After', String(Math.ceil((windowEnds - time) / 1000)));
      return fail(res, 429, 'rate_limited');
    }

    // Rate limits bound the expensive verification work, even across addresses.
    totalAttempts += 1;
    const input: unknown = req.body?.password ?? req.body?.pin;
    const secret = config.legacyPin ? parseLegacyPin(input) : isAdminPassword(input) ? input : null;
    if (!secret || !timingSafeEqual(hash, scryptSync(secret, salt, 32))) {
      attempts.set(address, misses + 1);
      return fail(res, 401, 'invalid_credentials');
    }
    attempts.delete(address);
    const oldToken = sessionToken(req);
    if (oldToken) sessions.delete(oldToken);
    for (const [token, expires] of sessions) if (expires <= time) sessions.delete(token);
    if (sessions.size >= 128) {
      const oldest = sessions.keys().next().value;
      if (oldest) sessions.delete(oldest);
    }
    const token = randomBytes(32).toString('hex');
    sessions.set(token, time + SESSION_TTL);
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: res.locals.cookieSecure, path: COOKIE_PATH, maxAge: SESSION_TTL });
    res.status(204).end();
  });

  router.post('/logout', (req, res) => {
    const token = sessionToken(req);
    if (token) sessions.delete(token);
    res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: res.locals.cookieSecure, path: COOKIE_PATH });
    res.status(204).end();
  });

  router.use((req, res, next) => {
    const token = sessionToken(req);
    const expiresAt = token ? sessions.get(token) : undefined;
    if (!expiresAt || expiresAt <= now()) {
      if (token) sessions.delete(token);
      return fail(res, 401, 'signed_out');
    }
    res.locals.sessionExpiresAt = expiresAt;
    next();
  });

  router.get('/dashboard', (_req, res) => {
    const time = now();
    const data: DashboardData = {
      sessionExpiresAt: res.locals.sessionExpiresAt,
      updatedAt: new Date(time).toISOString(),
      ...store.overview(time),
      services,
    };
    res.json(data);
  });

  router.get('/quotes', (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 160) : '';
    const status = isQuoteStatus(req.query.status) ? req.query.status : null;
    const page = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    res.json(store.listQuotes(search, status, Number.isSafeInteger(page) ? page : 1));
  });

  router.get('/quotes/:reference', (req, res) => {
    const quote = store.quote(req.params.reference);
    if (!quote) return fail(res, 404, 'quote_not_found');
    res.json(quote);
  });

  router.patch('/quotes/:reference', readJson, (req: Request, res: Response) => {
    const status: unknown = req.body?.status;
    if (!isQuoteStatus(status)) return fail(res, 400, 'invalid_request');
    if (!store.updateQuote(req.params.reference, status)) return fail(res, 404, 'quote_not_found');
    res.json(store.quote(req.params.reference));
  });

  router.put('/announcement', readJson, (req: Request, res: Response) => {
    const input = announcementInput(req.body);
    if (!input) return fail(res, 400, 'invalid_announcement');
    res.json(store.saveAnnouncement(input, new Date(now()).toISOString()));
  });

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
  return (_req, res) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    try {
      const announcement = store?.announcement();
      res.json({ message: announcement?.enabled ? announcement.message : null });
    } catch {
      console.error('[admin] Could not read the published announcement.');
      fail(res, 503, 'storage_error');
    }
  };
}
