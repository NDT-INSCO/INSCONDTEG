/**
 * The local brain: one name for the engine that answers without leaving the building.
 *
 * `AI_PROVIDER` decides which engine serves the four AI surfaces (tutor, copilot, community
 * assist, site manager):
 *
 * - `auto` **(default)** — try INSCO's local brain and reviewed knowledge first; use a
 *            configured provider only when the local answer is not sufficiently grounded.
 * - `local` — never call external providers, even when keys exist.
 * - `gemini` — explicitly prefer Google's models.
 * - `manus` — explicitly prefer Manus tasks (which may incur provider cost).
 *
 * This is a retrieval-and-rules engine, not a fine-tuned neural model. `auto` keeps that
 * local answer path first, while making external inference an opt-in-by-need fallback.
 */
export * from './text.js';
export * from './intent.js';
export * from './compose.js';
export * from './agents.js';

/** The name reported in `meta.model`; it is not a prefix for anything, it is this code. */
export const BRAIN_MODEL = 'insco-local-1';

export type AiProvider = 'local' | 'gemini' | 'manus' | 'auto';

/** Read the provider from the environment; an unset or invalid value uses local-first auto mode. */
export function resolveAiProvider(env: NodeJS.ProcessEnv | Record<string, string | undefined>): AiProvider {
  const raw = String((env as Record<string, string | undefined>).AI_PROVIDER ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'gemini' || raw === 'manus' || raw === 'auto' || raw === 'local') return raw;
  return 'auto';
}

export function isLocalProvider(provider: AiProvider): boolean {
  return provider === 'local' || provider === 'auto';
}
