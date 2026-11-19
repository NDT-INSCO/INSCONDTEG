/**
 * Pre-deploy check for the GitHub Pages artifact (docs/).
 *
 *   npm run site:check
 *
 * GitHub Pages serves the repository `docs/` folder from
 * https://ndt-insco.github.io/INSCONDTEG/ . A build can be perfectly valid in
 * `public/` and still ship broken if the published folder is stale, incomplete,
 * or references the wrong base. These checks run offline.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { validateEpub } from '../src/epub/validate';

/**
 * Same base the build used (`SITE_BASE`, else `GITHUB_REPOSITORY`, else this
 * repository's own Pages path), so this check validates the folder that is
 * actually about to be published.
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

const BASE = siteBase();
const docs = path.resolve(process.cwd(), 'docs');
const problems: string[] = [];
const notices: string[] = [];
function fail(message: string) {
  problems.push(message);
}

function note(message: string) {
  notices.push(message);
}

/**
 * The base this repository is really served from.
 *
 * `docs/index.html` can be perfectly self-consistent and still be wrong: a
 * folder built for `/INSCONDT/` passes every asset check here, then returns 404
 * for every script on `https://ndt-insco.github.io/INSCONDTEG/` — a blank page
 * with no data. So we compare the base baked into the folder with the path the
 * hosting repository actually uses.
 */
function servedBase(): string | null {
  const explicit = (process.env.SITE_BASE ?? '').trim();
  if (explicit) {
    const trimmed = explicit.replace(/^\/+|\/+$/g, '');
    return trimmed ? `/${trimmed}/` : '/';
  }
  let repo = (process.env.GITHUB_REPOSITORY ?? '').split('/')[1]?.trim();
  if (!repo) {
    try {
      const remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], { encoding: 'utf8' }).trim();
      repo = remote.replace(/\.git$/, '').split(/[/:]/).pop()?.trim();
    } catch {
      // Exported tarball without a git remote: nothing to compare against.
    }
  }
  return repo ? `/${repo}/` : null;
}

const EXPECTED_BASE = servedBase();

if (!existsSync(docs)) {
  console.error('✗ docs/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

// 1) index.html and its asset graph
const indexPath = path.join(docs, 'index.html');
if (!existsSync(indexPath)) {
  fail('docs/index.html is missing');
} else {
  const html = readFileSync(indexPath, 'utf8');
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  const local = references.filter(ref => !ref.startsWith('data:') && !ref.startsWith('http'));

  for (const ref of local) {
    if (!ref.startsWith(BASE)) {
      fail(`index.html references "${ref}", which is outside the Pages base ${BASE}`);
      continue;
    }
    const relative = ref.slice(BASE.length).split('?')[0];
    const target = path.join(docs, relative);
    if (!existsSync(target)) fail(`index.html references missing asset: ${ref}`);
  }

  if (!local.some(ref => ref.endsWith('.js'))) fail('index.html does not reference any JavaScript bundle');
  if (!local.some(ref => ref.endsWith('.css'))) fail('index.html does not reference any stylesheet');

  // The base baked into the build, taken from the first asset it loads.
  const baked = local.find(ref => /^\/[^/]+\/assets\//.test(ref))?.match(/^(\/[^/]+\/)/)?.[1] ?? null;
  if (EXPECTED_BASE && baked && baked !== EXPECTED_BASE) {
    fail(
      `docs/index.html is built for ${baked} but this repository is served from ${EXPECTED_BASE}: ` +
        `every asset would 404 and the page would stay blank. ` +
        `Rebuild with SITE_BASE=${EXPECTED_BASE} (or leave SITE_BASE unset).`,
    );
  }
  note(`index.html: ${local.length} local asset references${baked ? `, built for ${baked}` : ''}`);
}

// 1b) every chunk the entry can reach must exist.
//
// index.html can name a bundle that is present while that bundle imports a
// chunk nobody committed (a partial build, or a half-staged `docs/`). The page
// then loads its CSS — so it is not blank white, it is the theme background —
// and never mounts: exactly the outage this check exists to prevent.
{
  const assetsDir = path.join(docs, 'assets');
  if (existsSync(assetsDir)) {
    const chunks = readdirSync(assetsDir).filter(file => file.endsWith('.js'));
    const reachable = new Set<string>();
    const queue: string[] = [];
    const html = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
    for (const match of html.matchAll(/(?:src|href)="([^"]+\.js)"/g)) {
      const name = match[1].slice(BASE.length).split('?')[0].replace(/^assets\//, '');
      if (chunks.includes(name)) {
        reachable.add(name);
        queue.push(name);
      }
    }

    // `from "./x.js"`, `import("./x.js")`, and Vite's `["assets/x.js", …]` list.
    const importPattern = /(?:from|import)\s*\(?\s*["']\.\/([^"']+\.js)["']|["']assets\/([^"']+\.js)["']/g;
    const missing = new Set<string>();
    while (queue.length) {
      const chunk = queue.shift()!;
      const code = readFileSync(path.join(assetsDir, chunk), 'utf8');
      for (const match of code.matchAll(importPattern)) {
        const target = (match[1] ?? match[2] ?? '').split('?')[0];
        if (!target || target.startsWith('http')) continue;
        if (!existsSync(path.join(assetsDir, target))) {
          missing.add(`assets/${chunk} imports assets/${target}, which is not in the build`);
          continue;
        }
        if (!reachable.has(target)) {
          reachable.add(target);
          queue.push(target);
        }
      }
    }

    for (const problem of missing) fail(problem);

    // A second generation of hashed chunks means a partial rebuild left the old
    // ones behind: not fatal, but it hides which files the page really uses.
    const orphans = chunks.filter(chunk => !reachable.has(chunk));
    if (orphans.length > 0 && orphans.length < chunks.length) {
      note(`unreferenced chunks left in docs/assets (${orphans.length}): ${orphans.slice(0, 4).join(', ')}${orphans.length > 4 ? ' …' : ''}`);
    }
    note(`chunk graph: ${reachable.size} reachable of ${chunks.length} JavaScript chunk(s)`);
  }
}

// 2) Jekyll must not process the folder
if (!existsSync(path.join(docs, '.nojekyll'))) {
  fail('docs/.nojekyll is missing (GitHub Pages will run Jekyll over the build)');
}

// 3) EDB library
const edbDir = path.join(docs, 'edb');
const edbIndexPath = path.join(edbDir, 'index.json');
if (!existsSync(edbIndexPath)) {
  fail('docs/edb/index.json is missing: the EDB tab would fall back to in-app generation');
} else {
  const index = JSON.parse(readFileSync(edbIndexPath, 'utf8')) as {
    books?: { id: string; file: string; pages: number }[];
  };
  const books = index.books || [];
  if (books.length === 0) fail('docs/edb/index.json lists no books');
  for (const book of books) {
    const file = path.join(edbDir, book.file);
    if (!existsSync(file)) fail(`docs/edb/${book.file} is listed in the index but missing`);
    else if (statSync(file).size === 0) fail(`docs/edb/${book.file} is empty`);
  }
  note(`EDB: ${books.length} books, ${books.reduce((sum, book) => sum + (book.pages || 0), 0)} pages`);
}

// 4) EPUB library
const epubDir = path.join(docs, 'epub');
const epubIndexPath = path.join(epubDir, 'index.json');
if (!existsSync(epubIndexPath)) {
  fail('docs/epub/index.json is missing: the EPUB downloads would 404');
} else {
  const index = JSON.parse(readFileSync(epubIndexPath, 'utf8')) as {
    format?: string;
    books?: { id: string; file: string; bytes: number }[];
  };
  const books = index.books || [];
  if (index.format !== 'EPUB-INDEX') fail('docs/epub/index.json has an unexpected format');
  if (books.length === 0) fail('docs/epub/index.json lists no books');
  for (const book of books) {
    const file = path.join(epubDir, book.file);
    if (!existsSync(file)) {
      fail(`docs/epub/${book.file} is listed in the index but missing`);
      continue;
    }
    const buffer = readFileSync(file);
    if (buffer.length !== book.bytes) {
      fail(`docs/epub/${book.file} is ${buffer.length} bytes, the index says ${book.bytes}`);
    }
    const result = validateEpub(buffer);
    if (!result.valid) fail(`docs/epub/${book.file} is not a valid EPUB: ${result.errors[0]}`);
  }
  const catalog = path.join(epubDir, 'index.html');
  if (!existsSync(catalog)) fail('docs/epub/index.html (static catalogue) is missing');
  else {
    const html = readFileSync(catalog, 'utf8');
    for (const book of books) {
      if (!html.includes(book.file)) fail(`the EPUB catalogue does not link ${book.file}`);
    }
  }
  note(`EPUB: ${books.length} books, ${(books.reduce((sum, book) => sum + book.bytes, 0) / 1024).toFixed(0)} KiB`);
}

// 5) Size budget for the first payload
const assetsDir = path.join(docs, 'assets');
if (existsSync(assetsDir)) {
  const html = readFileSync(indexPath, 'utf8');
  const entry = [...html.matchAll(/src="([^"]+\.js)"/g)].map(match => match[1]);
  for (const ref of entry) {
    const file = path.join(docs, ref.slice(BASE.length));
    if (!existsSync(file)) continue;
    const kb = statSync(file).size / 1024;
    if (kb > 2000) fail(`entry bundle ${ref} is ${kb.toFixed(0)} KB (budget 2000 KB)`);
    else if (kb > 1200) note(`entry bundle ${ref} is ${kb.toFixed(0)} KB — consider code-splitting`);
    else note(`entry bundle ${ref} is ${kb.toFixed(0)} KB`);
  }
}

console.log(`Published site check (base ${BASE}${EXPECTED_BASE && EXPECTED_BASE !== BASE ? `, served from ${EXPECTED_BASE}` : ''})`);
for (const notice of notices) console.log(`  · ${notice}`);
if (problems.length === 0) {
  console.log('✓ docs/ is deployable');
  process.exit(0);
}
for (const problem of problems) console.error(`  ✗ ${problem}`);
console.error(`\n${problems.length} problem(s): the published folder would not work on GitHub Pages.`);
process.exit(1);
