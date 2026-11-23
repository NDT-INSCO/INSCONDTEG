/**
 * Where the browser finds the AI gateway.
 *
 * The site is published twice: a hosted build (Vercel) that serves the site and the
 * gateway from one origin, and a static GitHub Pages build that ships files only — no
 * server, and therefore nowhere to keep a key. The static build can still answer if it
 * is told where the hosted gateway lives, so that is stated once, here, instead of being
 * buried in a build script nobody runs.
 *
 * `VITE_AI_BASE_URL` still wins: a fork or a preview can point somewhere else without a
 * code change.
 */

/** The GitHub Pages origin — the static site that calls across to the hosted gateway. */
export const PAGES_SITE_ORIGIN = 'https://ndt-insco.github.io';

/** The deployment that runs `api/ai.ts`, i.e. the one that actually holds the key. */
export const HOSTED_GATEWAY_URL = 'https://inscondteg.vercel.app';

/**
 * Gateway base URL without a trailing slash. Empty means "same origin", which is right for
 * the hosted build, the dev server, and every test that has no environment configured.
 */
export function resolveGatewayBase(configured: string | undefined, staticPages: boolean): string {
  const explicit = (configured ?? '').trim().replace(/\/+$/, '');
  if (explicit) return explicit;
  // A static build has no same-origin API at all; without this it would report itself
  // unconfigured forever even though the gateway it needs is one fetch away.
  return staticPages ? HOSTED_GATEWAY_URL : '';
}
