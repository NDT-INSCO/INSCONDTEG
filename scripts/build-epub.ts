/**
 * Build the EPUB 3 library from the same source data as the `.edb` files.
 *
 *   npm run epub:build    write public/epub/*.epub + index.json + index.html
 *   npm run epub:check    fail if the committed output is stale
 *
 * The release timestamp is fixed, not "now": a reproducible archive is what
 * makes `--check` meaningful in CI.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NDT_TEXTBOOKS } from '../src/data/ndeTextbooksData';
import { NDE_ED_COURSES, NDE_ED_SOURCE_MAP } from '../src/data/ndeEd';
import { courseToEdb, textbookToEdb } from '../src/edb/convert';
import { edbToEpub } from '../src/epub/convert';
import { validateEpub } from '../src/epub/validate';
import { EPUB_GENERATOR, EPUB_INDEX_FORMAT, EpubIndex, EpubIndexEntry } from '../src/epub/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'public', 'epub');
const checkMode = process.argv.includes('--check');
const RELEASE = process.env.EPUB_RELEASE_DATE || '2026-10-21T00:00:00Z';

const documents = [
  ...NDT_TEXTBOOKS.map(book => ({ document: textbookToEdb(book, { createdAt: RELEASE, updatedAt: RELEASE }), kind: 'textbook' as const })),
  ...NDE_ED_COURSES.map(course => ({
    document: courseToEdb(course, NDE_ED_SOURCE_MAP, { createdAt: RELEASE, updatedAt: RELEASE }),
    kind: 'course' as const,
  })),
];

const entries: EpubIndexEntry[] = [];
const outputs: { file: string; buffer: Buffer }[] = [];
let failures = 0;

for (const { document, kind } of documents) {
  const build = edbToEpub(document, { modified: RELEASE });
  const result = validateEpub(build.buffer);
  if (!result.valid) {
    failures += 1;
    console.error(`✗ ${build.file}: ${result.errors.length} validation error(s)`);
    result.errors.slice(0, 8).forEach(error => console.error(`   - ${error}`));
    continue;
  }
  if (result.warnings.length) {
    result.warnings.slice(0, 3).forEach(warning => console.warn(`  ! ${build.file}: ${warning}`));
  }
  build.warnings.slice(0, 3).forEach(warning => console.warn(`  ! ${build.file}: ${warning}`));
  entries.push({ ...build.entry, kind });
  outputs.push({ file: build.file, buffer: build.buffer });
}

if (failures > 0) {
  console.error(`\nEPUB build failed: ${failures} invalid document(s).`);
  process.exit(1);
}

const totalBytes = outputs.reduce((sum, item) => sum + item.buffer.length, 0);
const index: EpubIndex = {
  format: EPUB_INDEX_FORMAT,
  version: '1.0',
  generatedAt: `${RELEASE.slice(0, 10)}T00:00:00Z`,
  generator: EPUB_GENERATOR,
  books: entries,
};

if (checkMode) {
  const indexPath = path.join(outputDir, 'index.json');
  if (!existsSync(indexPath)) {
    console.error('✗ public/epub/index.json is missing. Run npm run epub:build.');
    process.exit(1);
  }
  const existing = JSON.parse(readFileSync(indexPath, 'utf8')) as EpubIndex;
  const existingById = new Map(existing.books.map(book => [book.id, book]));
  let stale = 0;
  for (const entry of entries) {
    const previous = existingById.get(entry.id);
    if (!previous) {
      console.error(`✗ missing from index: ${entry.id}`);
      stale += 1;
      continue;
    }
    if (previous.checksum !== entry.checksum) {
      console.error(`✗ stale .epub content: ${entry.file}`);
      stale += 1;
    }
    if (!existsSync(path.join(outputDir, entry.file))) {
      console.error(`✗ missing file: ${entry.file}`);
      stale += 1;
    }
  }
  const expected = new Set(entries.map(entry => entry.file));
  readdirSync(outputDir)
    .filter(file => file.endsWith('.epub') && !expected.has(file))
    .forEach(file => {
      console.error(`✗ orphan .epub file: ${file}`);
      stale += 1;
    });
  if (stale > 0) {
    console.error(`\nEPUB check failed: ${stale} stale item(s). Run npm run epub:build.`);
    process.exit(1);
  }
  console.log(`✓ EPUB check passed: ${entries.length} books, ${entries.reduce((sum, entry) => sum + entry.pages, 0)} pages.`);
  process.exit(0);
}

mkdirSync(outputDir, { recursive: true });
for (const item of outputs) {
  writeFileSync(path.join(outputDir, item.file), item.buffer);
}
writeFileSync(path.join(outputDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'index.html'), catalogPage(index), 'utf8');

const untranslated = entries.reduce((sum, entry) => sum + entry.untranslated, 0);
console.log(`✓ EPUB built: ${entries.length} books (${entries.filter(e => e.kind === 'textbook').length} textbooks, ${entries.filter(e => e.kind === 'course').length} courses)`);
console.log(`  pages: ${entries.reduce((sum, entry) => sum + entry.pages, 0)} • payload: ${(totalBytes / 1024).toFixed(1)} KiB`);
if (untranslated > 0) {
  console.log(`  ! translation gap: ${untranslated} text unit(s) exist in one language only (omitted from the other language, not duplicated)`);
  entries
    .filter(entry => entry.untranslated > 0)
    .sort((a, b) => b.untranslated - a.untranslated)
    .slice(0, 5)
    .forEach(entry => console.log(`     - ${entry.file}: ${entry.untranslated}`));
}
console.log('  output: public/epub/ (EPUB 3.0)');

/** Static catalogue so the books can be downloaded even if the app fails. */
function catalogPage(data: EpubIndex): string {
  const rows = data.books
    .map(book => {
      const kb = (book.bytes / 1024).toFixed(0);
      const gap = book.untranslated > 0
        ? `<span class="gap">${book.untranslated} مقطع بِلغة واحدة فقط</span>`
        : '';
      return `<li>
  <a class="book" href="${book.file}">
    <span class="kind">${book.kind === 'course' ? 'مقرر' : 'كتاب'}</span>
    <span class="title">${escapeHtml(book.title.ar)}</span>
    <span class="sub">${escapeHtml(book.subtitle.ar)}</span>
    <span class="meta">${escapeHtml(book.discipline)} · ${book.pages} صفحة · ${kb} كيلوبايت</span>
    ${gap}
  </a>
</li>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>مكتبة EPUB — إنسكو NDT</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: #070a14; color: #e7ecf5; font-family: "Segoe UI", "Noto Naskh Arabic", Tahoma, sans-serif; line-height: 1.7; }
main { max-width: 900px; margin: 0 auto; padding: 48px 20px 72px; }
h1 { font-size: clamp(1.6rem, 4vw, 2.3rem); margin: 0 0 8px; }
p.lead { color: #9aa6bd; margin: 0 0 12px; max-width: 62ch; }
.badge { display: inline-block; border: 1px solid #d9a441; color: #f1c069; border-radius: 999px; padding: 2px 12px; font-size: 12px; margin-bottom: 20px; }
ul { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.book { display: block; height: 100%; text-decoration: none; color: inherit; background: #0e1424; border: 1px solid #1e2942; border-radius: 14px; padding: 16px 18px; transition: border-color .15s, transform .15s; }
.book:hover, .book:focus-visible { border-color: #d9a441; transform: translateY(-2px); }
.kind { display: block; font-size: 11px; letter-spacing: .08em; color: #6f7c96; text-transform: uppercase; }
.title { display: block; font-weight: 700; margin: 6px 0 2px; }
.sub { display: block; font-size: 13px; color: #9aa6bd; }
.meta { display: block; margin-top: 10px; font-size: 12px; color: #6f7c96; font-variant-numeric: tabular-nums; }
.gap { display: block; margin-top: 6px; font-size: 11px; color: #d9a441; }
footer { margin-top: 40px; font-size: 12px; color: #6f7c96; border-top: 1px solid #1a2338; padding-top: 16px; }
a.plain { color: #f1c069; }
</style>
</head>
<body>
<main>
  <span class="badge">EPUB 3 · ثنائي اللغة</span>
  <h1>مكتبة إنسكو — نسخة EPUB</h1>
  <p class="lead">${data.books.length} ملف EPUB ${data.books.reduce((sum, book) => sum + book.pages, 0)} صفحة، مبنية من نفس ملفات EDB. كل ملف يحتوي النسختين العربية والإنجليزية، وفهرساً قابلاً للتنقل، وأسئلة فهم مع إجاباتها. تعمل على Kindle وKobo وApple Books وCalibre دون اتصال.</p>
  <p class="lead">هذه الطبعة مادة دراسة ذاتية: لا تصدر شهادة ولا تمنح اعتماداً.</p>
  <ul>
${rows}
  </ul>
  <footer>
    <p>${escapeHtml(data.generator)} · ${escapeHtml(data.generatedAt.slice(0, 10))} · <a class="plain" href="../">العودة إلى الأكاديمية</a></p>
    <p>تنزيل الملف لا يمنح حقوق إعادة نشر المحتوى.</p>
  </footer>
</main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
