import express from 'express';
import { fail, runAsync } from './http.js';
import { createOperations } from './operations.js';
import { httpOrigin } from './router.js';

export const HOSTED_RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex',
};

/** Initialize once per worker, but retry on a later request if storage is unavailable. */
export function createHostedOperationsHandler(env: NodeJS.ProcessEnv, trustProxy: false | 1 = false) {
  const origin = httpOrigin(env.ADMIN_ORIGIN?.trim());
  const canonicalHost = origin && new URL(origin).host;
  let initialized: ReturnType<typeof createOperations> | undefined;

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use(runAsync(async (req, res, next) => {
    res.set(HOSTED_RESPONSE_HEADERS);
    if (canonicalHost && req.get('host') !== canonicalHost) return fail(res, 403, 'origin_not_allowed');
    const pending = initialized ??= createOperations(env, { production: true, requireHosted: true });
    let operations: Awaited<typeof pending>;
    try {
      operations = await pending;
    } catch {
      if (initialized === pending) initialized = undefined;
      console.error('[admin] Hosted storage is unavailable. Check the database settings.');
      return fail(res, 503, 'storage_error');
    }
    operations.router(req, res, next);
  }));
  app.use((_req, res) => fail(res, 404, 'not_found'));
  return app;
}
