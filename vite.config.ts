import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The path the site is served from.
 *
 * A GitHub Pages *project* site lives under `/<repo-name>/`, so the base has to
 * match the hosting repository. This repository publishes at
 * `https://ndt-insco.github.io/INSCONDTEG/` — so `npm run build` alone produces
 * a folder that works on Pages, whichever way Pages is configured.
 *
 * Resolution order:
 *   1. `SITE_BASE` (custom domain → `/`, another repository → `/<repo>/`)
 *   2. `GITHUB_REPOSITORY` when running inside Actions (`owner/repo`)
 *   3. the repository name this project was last published from
 *
 * A base that does not match the hosting path is exactly what leaves a live
 * site blank: every `/wrong-base/assets/*.js` request 404s and React never
 * mounts.
 */
function siteBase(): string {
  const raw = (process.env.SITE_BASE ?? '').trim();
  if (raw) {
    const trimmed = raw.replace(/^\/+|\/+$/g, '');
    return trimmed ? `/${trimmed}/` : '/';
  }
  const fromActions = (process.env.GITHUB_REPOSITORY ?? '').split('/')[1]?.trim();
  return fromActions ? `/${fromActions}/` : '/INSCONDTEG/';
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: siteBase(),
  optimizeDeps: {
    entries: ['index.html'],
  },
  // The preview proxy serves the dev server from a dynamic host name.
  // `allowedHosts` only affects the dev server; production output is unchanged.
  server: {
    allowedHosts: true,
    // Keep the private inbox and its SQLite sidecars off the dev asset server.
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.admin-data/**', '**/admin.sqlite*'],
    },
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: {
      ignored: ['**/docs/**', '**/.aistudio/**', '**/tests/**'],
    },
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
