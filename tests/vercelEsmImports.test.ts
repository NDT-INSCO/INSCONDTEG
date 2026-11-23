/**
 * Vercel functions run the import graph as plain Node ESM.
 *
 * `tsx` (tests, the dev server) resolves `./thing` to `./thing.ts`; Node ESM does not.
 * That difference shipped a function which answered `500 FUNCTION_INVOCATION_FAILED`
 * on every request while the local server was perfectly healthy — the site then blamed
 * the API key for it.
 *
 * So: every relative import reachable from an `api/*.ts` entry must name its extension,
 * and a directory import must name `index.js`.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const ROOT = process.cwd();
const ENTRIES = ['api/ai.ts', 'api/insco.ts', 'server.ts'];

// `import type … from './x'` is erased before Node ever resolves it, so it is not a
// runtime import and does not need an extension.
const SPECIFIER = /(^|\n)\s*(import|export)(\s+type\b[^;]*?|\s[^;]*?)from\s*(['"])(\.[^'"]*)\4/g;

function relativeSpecifiers(file: string): string[] {
  const source = readFileSync(path.join(ROOT, file), 'utf8');
  const found: string[] = [];
  for (const match of source.matchAll(SPECIFIER)) {
    if (/^\s*import\s+type\b/.test(match[2] + match[3])) continue;
    found.push(match[5]);
  }
  return found;
}

function resolve(file: string, specifier: string): string | null {
  const base = path.resolve(ROOT, path.dirname(file), specifier);
  // `.js` in the source is `.ts` on disk: TypeScript rewrites it when it emits.
  const candidates = specifier.endsWith('.js')
    ? [base, base.replace(/\.js$/, '.ts'), base.replace(/\.js$/, '.tsx'), base.replace(/\.js$/, '/index.ts')]
    : [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

test('every relative import reachable from a function entry has an explicit extension', () => {
  const seen = new Set<string>();
  const problems: string[] = [];
  const queue = [...ENTRIES];

  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (!existsSync(path.join(ROOT, file))) continue;

    for (const specifier of relativeSpecifiers(file)) {
      const resolved = resolve(file, specifier);
      const isCode = !/\.(json|css|svg|png|jpg|webp|ttf|woff2?)$/i.test(specifier);
      if (!isCode) continue;

      if (!specifier.endsWith('.js')) {
        problems.push(`${file}: '${specifier}' is missing the .js extension`);
      } else if (!resolved) {
        problems.push(`${file}: '${specifier}' does not resolve to a source file`);
      }

      if (resolved) queue.push(path.relative(ROOT, resolved));
    }
  }

  // Guard against a matcher that quietly scans nothing.
  assert.ok(seen.size >= 10, `expected to walk the function graph, walked ${seen.size} file(s)`);
  assert.deepEqual(problems, [], `imports that would fail on Vercel:\n${problems.join('\n')}`);
});

test('the AI function entry only imports modules that exist on disk', () => {
  const entry = 'api/ai.ts';
  for (const specifier of relativeSpecifiers(entry)) {
    assert.ok(resolve(entry, specifier), `${entry}: '${specifier}' must resolve`);
  }
});
