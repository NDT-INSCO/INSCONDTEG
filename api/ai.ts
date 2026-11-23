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
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createAiGateway } from '../server/ai/gateway.js';

// The corpus is read from `edb/` at request time. The build copies `public/edb`
// into `dist/edb`, which is what `includeFiles` bundles; the other two are for a local
// run of this function, where the sources are still in place.
const edbRoot =
  ['dist', 'public', '.'].map(dir => path.join(process.cwd(), dir)).find(dir => existsSync(path.join(dir, 'edb'))) ??
  process.cwd();

const app = express();
app.disable('x-powered-by');
app.use(createAiGateway(edbRoot));
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Unknown AI route.' } });
});

export default app;
