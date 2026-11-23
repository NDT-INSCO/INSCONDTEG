/** Serves the INSCO site, AI/RFQ gateways, and the private admin API. */
import express from 'express';
import type { Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createAiGateway, isTutorConfigured, readAiEnv } from './server/ai/gateway.js';
import { createOperations } from './server/admin/operations.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const siteRoot = path.join(__dirname, !isProduction ? 'public' : existsSync(path.join(__dirname, 'dist')) ? 'dist' : 'docs');
const trustedProxies = process.env.TRUST_PROXY?.trim();
if (trustedProxies) app.set('trust proxy', trustedProxies);

/* ------------------------------------------------------------------ */
/* operations API + AI gateway                                         */
/* ------------------------------------------------------------------ */
// The AI router lives in `server/ai/gateway.ts`: the same module the Vercel function
// `api/ai.ts` mounts, so local and deployed behaviour cannot drift apart.

app.disable('x-powered-by');

// Mount the operations API before the general parser, AI, and static routes.
const operations = await createOperations(process.env, {
  production: isProduction,
  baseDir: __dirname,
  tutorConfigured: isTutorConfigured(process.env),
});
app.use(operations.router);
app.use(createAiGateway(siteRoot));

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
    const aiRuntime = readAiEnv(process.env);
  console.log(`[ai] tutor: ${aiRuntime.configured ? `enabled, model ${aiRuntime.models[0]}` : 'disabled (no GEMINI_API_KEY)'}`);
    console.log(`[ai] transport: ${aiRuntime.mode}${aiRuntime.configured ? '' : ' (no key, calls will be refused)'}`);
    console.log(`[rfq] delivery: ${operations.rfqEnabled ? 'configured' : 'not configured (POST /api/rfq will answer 503)'}`);
    console.log(`[admin] portal: ${operations.adminEnabled ? 'enabled' : 'disabled (set ADMIN_PASSWORD and, in production, ADMIN_ORIGIN)'}`);
  });
}

void startServer();
