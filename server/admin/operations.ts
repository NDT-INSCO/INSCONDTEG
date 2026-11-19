import { createHmac } from 'node:crypto';
import path from 'node:path';
import express, { type ErrorRequestHandler } from 'express';
import { ADMIN_API, ANNOUNCEMENT_API } from '../../src/admin/contract.js';
import { createRateLimiter, deliveryFromEnv, handleRfqRequest } from '../../src/rfq/gateway.js';
import { hostedDatabase, hostedDatabaseConfig } from './database.js';
import { clientAddress, fail, readJsonBody, runAsync } from './http.js';
import { adminConfig, createAdminRouter, httpOrigin, publicAnnouncement, publicSiteCors } from './router.js';
import { ADMIN_SCHEMA } from './schema.js';
import { adminDatabasePath, AdminStore, deliverToInbox } from './store.js';

const RFQ = '/api/rfq';
const HOUR = 60 * 60_000;

interface OperationsOptions {
  production: boolean;
  baseDir?: string;
  requireHosted?: boolean;
  tutorConfigured?: boolean;
}

/** The same API is used by the standalone Node server and the Vercel function. */
export async function createOperations(env: NodeJS.ProcessEnv, { production, baseDir = process.cwd(), requireHosted, tutorConfigured = false }: OperationsOptions) {
  const config = adminConfig(env, production);
  const useHosted = requireHosted || Boolean(env.ADMIN_DATABASE_URL?.trim() || env.TURSO_DATABASE_URL?.trim()
    || env.ADMIN_DATABASE_AUTH_TOKEN?.trim() || env.TURSO_AUTH_TOKEN?.trim());
  const hosted = useHosted ? hostedDatabaseConfig(env) : null;
  let store: AdminStore | null = null;
  if (config && hosted) {
    // No local SQLite fallback for Functions or a partially configured hosted database.
    // Let the function retry initialization on a later request after a temporary failure.
    try {
      store = new AdminStore(await hostedDatabase(hosted.url, hosted.authToken, ADMIN_SCHEMA));
    } catch {
      if (requireHosted) throw new Error('Hosted admin storage is unavailable');
      console.error('[admin] Cannot open hosted storage. Check the settings and restart the server.');
    }
  } else if (config && !useHosted) {
    try {
      const dataDir = path.resolve(baseDir, env.ADMIN_DATA_DIR?.trim() || '.admin-data');
      const publicRoots = ['public', 'docs', 'dist'].map(dir => path.join(baseDir, dir));
      store = new AdminStore(adminDatabasePath(dataDir, publicRoots));
    } catch {
      console.error('[admin] Cannot open private storage. Check ADMIN_DATA_DIR and its permissions.');
    }
  }
  if (config && useHosted && !hosted) console.warn('[admin] Disabled: check hosted database settings and ADMIN_STATE_KEY.');
  if (!config && (env.ADMIN_PASSWORD || env.ADMIN_PIN)) console.warn('[admin] Disabled: check the admin credential and ADMIN_ORIGIN.');

  const primary = deliveryFromEnv(env);
  const delivery = store ? deliverToInbox(store, primary) : requireHosted ? null : primary;
  const publicCors = publicSiteCors(httpOrigin(env.PUBLIC_SITE_ORIGIN?.trim()));
  const router = express.Router();
  router.use(ADMIN_API, createAdminRouter({
    config, store, stateKey: hosted?.stateKey,
    services: { tutorConfigured, rfqNotificationsConfigured: Boolean(delivery && primary) },
  }));
  router.get(ANNOUNCEMENT_API, publicCors, publicAnnouncement(store));

  // Hosted RFQ quotas are shared as well; the inbox is a durable receipt, not an email claim.
  const rfqScope = hosted && createHmac('sha256', hosted.stateKey).update(`rfq\0${config?.origin ?? ''}`).digest('hex');
  const rfqState = hosted && store && rfqScope ? store.auth(rfqScope, hosted.stateKey, config?.origin ?? null) : null;
  const allowRfqAttempt = createRateLimiter({ windowMs: HOUR, max: 6 });
  router.options(RFQ, publicCors);
  router.post(RFQ, publicCors, readJsonBody('96kb'), runAsync(async (req, res) => {
    const address = clientAddress(req);
    const retry = rfqState ? await rfqState.throttle(address, Date.now(), { purpose: 'rfq', window: HOUR, perAddress: 6, total: 250 })
      : allowRfqAttempt(address) ? 0 : HOUR / 1000;
    if (retry) {
      res.set('Retry-After', String(retry));
      res.status(429).json({ ok: false, error: 'rfq_rate_limited', detail: 'Too many requests. Try again later.' });
      return;
    }
    const result = await handleRfqRequest(req.body, { deliver: delivery }, address);
    res.status(result.status).json(result.body);
  }));
  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.status >= 400 && error.status < 500) return fail(res, error.status, 'invalid_request');
    console.error('[admin] Could not complete an operations request.');
    fail(res, 503, 'storage_error');
  };
  router.use(handleError);
  return { router, adminEnabled: store !== null, rfqEnabled: delivery !== null };
}
