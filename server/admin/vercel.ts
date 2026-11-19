import express from 'express';
import { fail, runAsync } from './http.js';
import { createOperations } from './operations.js';
import { httpOrigin } from './router.js';

export function createVercelHandler(env: NodeJS.ProcessEnv) {
  const origin = httpOrigin(env.ADMIN_ORIGIN?.trim());
  const canonicalHost = origin && new URL(origin).host;
  let initialized: ReturnType<typeof createOperations> | undefined;

  const app = express();
  app.disable('x-powered-by');
  // Vercel overwrites the forwarding header at its edge, rather than trusting client values.
  app.set('trust proxy', 1);
  app.use(runAsync(async (req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' });
    // Don't expose the same admin backend on alternate deploy URLs.
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
