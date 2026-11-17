/**
 * Absolute URL for a file shipped in `public/`.
 *
 * GitHub Pages serves this app from a sub-path (`/INSCONDTEG/`), so a
 * root-relative string such as `/images/hero.jpg` resolves to
 * `https://ndt-insco.github.io/images/hero.jpg` and 404s. Everything that
 * points at a `public/` file has to go through the Vite base instead:
 *
 *     publicUrl('images/hero.jpg')  →  /INSCONDTEG/images/hero.jpg
 *
 * During `vite build` the base is baked in; outside the bundler (tests, plain
 * node) it falls back to `/`, which is what the dev server and jsdom expect.
 */
export function publicUrl(relative: string): string {
  const base = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${relative.replace(/^\/+/, '')}`;
}
