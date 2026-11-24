/**
 * Vercel function for the Robotic University gateway: `/api/university/*`.
 *
 * Same discipline as `api/ai.ts`: one implementation, one behaviour. The static
 * GitHub Pages build calls this function cross-origin (the hosted gateway is
 * one fetch away); without this route every university call from Pages would
 * answer 404 with a message blaming the key — exactly the failure that shipped
 * once for `/api/ai/*`.
 *
 * Persistence note: the serverless filesystem is ephemeral, so the runtime
 * archive reports `persisted: false` there and keeps working in memory. The
 * reviewed seed ships in the bundle and needs no disk at all.
 */
import express from 'express';
import { createUniversityRouter } from '../server/university/gateway.js';

const app = express();
app.disable('x-powered-by');

// Never let a stalled upstream turn into a silent hang.
app.use((_req, res, next) => {
  res.setTimeout(55_000, () => {
    if (res.headersSent) return;
    res.status(504).json({ error: { code: 'timeout', message: 'The university gateway did not answer in time.' } });
  });
  next();
});

app.use(
  createUniversityRouter({
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
    model: (process.env.UNIVERSITY_MODEL || '').trim() || undefined,
    ratePerMinute: Math.max(1, parseInt(process.env.UNIVERSITY_RATE_PER_MINUTE || '10', 10)),
  })
);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Unknown university route.' } });
});

export default app;
