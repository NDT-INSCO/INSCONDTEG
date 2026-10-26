/**
 * Pre-deploy check for the GitHub Pages artifact (docs/).
 *
 *   npm run site:check
 *
 * GitHub Pages serves the repository `docs/` folder from
 * https://ndt-insco.github.io/INSCONDT/ . A build can be perfectly valid in
 * `public/` and still ship broken if the published folder is stale, incomplete,
 * or references the wrong base. These checks run offline.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { validateEpub } from '../src/epub/validate';

/**
 * Same base the build used (`SITE_BASE`), so this check validates the folder
 * that is actually about to be published, whether that is
 * `https://ndt-insco.github.io/-Project-/` or a new repository's own path.
 */
function siteBase(): string {
  const raw = (process.env.SITE_BASE ?? '').trim();
  if (!raw) return '/INSCONDT/';
  const trimmed = raw.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
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
  note(`index.html: ${local.length} local asset references`);
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

console.log(`Published site check (${BASE})`);
for (const notice of notices) console.log(`  · ${notice}`);
if (problems.length === 0) {
  console.log('✓ docs/ is deployable');
  process.exit(0);
}
for (const problem of problems) console.error(`  ✗ ${problem}`);
console.error(`\n${problems.length} problem(s): the published folder would not work on GitHub Pages.`);
process.exit(1);
