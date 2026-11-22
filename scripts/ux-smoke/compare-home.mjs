/** Cold home JS comparison using the exact built files, not a simulated CDN transfer. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { docs, launch, out, repo } from './harness.mjs';

const baseCommit = '797d81820c0d0c98885dbdfc476ab8b0fe1c2079';
const base = '/INSCONDTEG/';
const origin = 'http://insco-qa.test';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const before = await mkdtemp(join(tmpdir(), 'insco-ux-base-'));
try {
  // Only in scratch storage. The original PDF is never served publicly.
  const archive = execFileSync('git', ['archive', baseCommit, 'docs'], { cwd: repo, maxBuffer: 64 * 1024 * 1024 });
  execFileSync('tar', ['-xf', '-', '-C', before], { input: archive });
  for (const [snapshot, directory] of [['before', join(before, 'docs')], ['after', docs]]) {
    for (const [view, width, height, lang] of [['mobile', 390, 844, 'ar'], ['desktop', 1440, 1000, 'en']]) {
      const browser = await launch({ disableWebGL: true });
      try {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const scripts = new Map();
        const failures = [];
        // No server/remote requests: fulfill directly with independently materialized build files.
        await context.route('**/*', async route => {
          const { origin: source, pathname } = new URL(route.request().url());
          if (source !== origin || !pathname.startsWith(base)) return route.abort();
          const relative = decodeURIComponent(pathname.slice(base.length)) || 'index.html';
          const file = resolve(directory, relative);
          if (!file.startsWith(`${directory}${sep}`) || extname(file) === '.pdf') return route.abort();
          try {
            const bytes = await readFile(file);
            if (extname(file) === '.js') scripts.set(relative, bytes);
            await route.fulfill({ body: bytes, contentType: mime[extname(file)] ?? 'application/octet-stream' });
          } catch {
            failures.push(relative);
            await route.fulfill({ status: 404 });
          }
        });
        await context.addInitScript(lang => {
          localStorage.setItem('insco_language_v1', lang);
          localStorage.setItem('insco_theme_v1', 'dark');
          localStorage.setItem('insco_portal_choice_v1', 'company');
        }, lang);
        const page = await context.newPage();
        await page.goto(origin + base, { waitUntil: 'networkidle' });
        if (snapshot === 'before') await page.getByTestId('insco-3d-banner-fallback').waitFor();
        else await page.getByTestId('corporate-landing-hero').locator('img').evaluate(img => img.decode());
        await page.screenshot({ path: join(out, `${snapshot}-${view}.jpg`), quality: 85, animations: 'disabled' });
        assert.deepEqual(failures, []);
        const files = [...scripts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, bytes]) => ({ name, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length }));
        assert.ok(files.length > 0);
        console.log(JSON.stringify({ snapshot, view, width, height, lang, chromium: browser.version(), baseline: baseCommit,
          js: files.length, rawJsBytes: files.reduce((sum, f) => sum + f.rawBytes, 0), gzipJsBytes: files.reduce((sum, f) => sum + f.gzipBytes, 0), files }));
      } finally { await browser.close(); }
    }
  }
} finally { await rm(before, { recursive: true, force: true }); }
