/**
 * The local brain: one name for the engine that answers without leaving the building.
 *
 * `AI_PROVIDER` decides which engine serves the four AI surfaces (tutor, copilot, community
 * assist, site manager):
 *
 * - `local`  **(default)** — this module. No network, no key, no quota. Answers are built
 *            from the INSCO library and the platform's own telemetry.
 * - `gemini` — the previous behaviour: Google's models answer.
 * - `manus`  — Manus agent tasks answer (still billed per task).
 * - `auto`   — local first; if the local library has no passage for the question, ask
 *            Gemini, then Manus, when their keys exist.
 *
 * The default changed on purpose. A dependence that is switched on by omission is not a
 * choice, and the requirement here is that the platform's agents keep answering with every
 * outside service removed.
 */
export * from './text.js';
export * from './intent.js';
export * from './compose.js';
export * from './agents.js';

/** The name reported in `meta.model`; it is not a prefix for anything, it is this code. */
export const BRAIN_MODEL = 'insco-local-1';

export type AiProvider = 'local' | 'gemini' | 'manus' | 'auto';

/** Read the provider from the environment; anything unrecognised falls back to `local`. */
export function resolveAiProvider(env: NodeJS.ProcessEnv | Record<string, string | undefined>): AiProvider {
  const raw = String((env as Record<string, string | undefined>).AI_PROVIDER ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'gemini' || raw === 'manus' || raw === 'auto' || raw === 'local') return raw;
  return 'local';
}

export function isLocalProvider(provider: AiProvider): boolean {
  return provider === 'local';
}
