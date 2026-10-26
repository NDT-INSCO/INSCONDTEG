import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The path the site is served from.
 *
 * A GitHub Pages *project* site lives under `/<repo-name>/`, so the base has to
 * match the hosting repository. This repository publishes at
 * `https://ndt-insco.github.io/INSCONDT/`, which is the default — so `npm run
 * build` alone produces a folder that works on Pages, whichever way Pages is
 * configured. `SITE_BASE` overrides it (custom domain → `/`, the older
 * `-Project-` repository → `/-Project-/`).
 */
function siteBase(): string {
  const raw = (process.env.SITE_BASE ?? '').trim();
  if (!raw) return '/INSCONDT/';
  const trimmed = raw.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
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
