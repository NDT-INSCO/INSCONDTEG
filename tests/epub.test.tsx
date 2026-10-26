import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { NDT_TEXTBOOKS } from '../src/data/ndeTextbooksData';
import { NDE_ED_COURSES, NDE_ED_SOURCE_MAP } from '../src/data/ndeEd';
import { courseToEdb, textbookToEdb } from '../src/edb/convert';
import { countSingleLanguage, edbToEpub } from '../src/epub/convert';
import { validateEpub } from '../src/epub/validate';
import { readZip, writeZip, crc32, zipContentDigest } from '../src/epub/zip';
import { EdbDocument } from '../src/edb/types';

const RELEASE = '2026-10-21T00:00:00Z';

const bookstore: EdbDocument[] = [
  ...NDT_TEXTBOOKS.map(book => textbookToEdb(book, { createdAt: RELEASE, updatedAt: RELEASE })),
  ...NDE_ED_COURSES.map(course => courseToEdb(course, NDE_ED_SOURCE_MAP, { createdAt: RELEASE, updatedAt: RELEASE })),
];

/* ---------------------------------------------------------------- */
/* zip                                                               */
/* ---------------------------------------------------------------- */

test('zip writer round-trips through the reader with the right bytes', () => {
  const input = [
    { path: 'mimetype', data: Buffer.from('application/epub+zip') },
    { path: 'a/b.txt', data: Buffer.from('مرحبا — hello', 'utf8') },
    { path: 'empty.bin', data: Buffer.alloc(0) },
  ];
  const archive = writeZip(input);
  const entries = readZip(archive);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.map(entry => entry.path), ['mimetype', 'a/b.txt', 'empty.bin']);
  assert.equal(entries[1].data.toString('utf8'), 'مرحبا — hello');
  assert.equal(entries[1].method, 8, 'non-mimetype entries are deflated');
  assert.equal(entries[0].method, 0, 'mimetype must be stored');
  assert.equal(entries[2].data.length, 0);
});

test('zip writer is deterministic and crc32 matches the known vector', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  const entries = [
    { path: 'mimetype', data: Buffer.from('application/epub+zip') },
    { path: 'x.txt', data: Buffer.from('repeat me '.repeat(50)) },
  ];
  const first = writeZip(entries);
  const second = writeZip(entries);
  assert.ok(first.equals(second), 'same input must produce identical archives');
  assert.equal(zipContentDigest(entries), zipContentDigest([...entries].reverse()));
});

test('zip reader rejects a truncated archive instead of returning junk', () => {
  const archive = writeZip([{ path: 'mimetype', data: Buffer.from('application/epub+zip') }]);
  assert.throws(() => readZip(archive.subarray(0, 10)), /too short|central directory/);
});

/* ---------------------------------------------------------------- */
/* epub structure                                                    */
/* ---------------------------------------------------------------- */

test('every EDB document converts to a valid EPUB 3', () => {
  assert.equal(bookstore.length, 18);
  for (const document of bookstore) {
    const build = edbToEpub(document, { modified: RELEASE });
    const result = validateEpub(build.buffer);
    assert.deepEqual(result.errors, [], `${document.id} produced EPUB errors`);
    assert.ok(result.pages >= 5, `${document.id} has ${result.pages} content pages`);
    assert.equal(build.entry.checksum.length, 64);
  }
});

test('EPUB mimetype is first, stored and exact', () => {
  const build = edbToEpub(bookstore[0], { modified: RELEASE });
  const entries = readZip(build.buffer);
  assert.equal(entries[0].path, 'mimetype');
  assert.equal(entries[0].method, 0);
  assert.equal(entries[0].data.toString('utf8'), 'application/epub+zip');
  assert.equal(entries[0].crc, crc32(Buffer.from('application/epub+zip')));
});

test('package document declares both languages, a UUID and a fixed modified date', () => {
  const build = edbToEpub(bookstore[0], { modified: RELEASE });
  const entries = readZip(build.buffer);
  const opf = entries.find(entry => entry.path.endsWith('content.opf'))!.data.toString('utf8');
  assert.match(opf, /<dc:language>ar<\/dc:language>/);
  assert.match(opf, /<dc:language>en<\/dc:language>/);
  assert.match(opf, /urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/);
  assert.match(opf, new RegExp(`<meta property="dcterms:modified">${RELEASE}</meta>`));
  assert.match(opf, /page-progression-direction="rtl"/);
});

test('the navigation document lists the cover, every chapter and the back matter', () => {
  const document = bookstore.find(item => item.id === 'edb-book-vt')!;
  const build = edbToEpub(document, { modified: RELEASE });
  const nav = readZip(build.buffer).find(entry => entry.path.endsWith('nav.xhtml'))!.data.toString('utf8');
  assert.match(nav, /epub:type="toc"/);
  assert.equal((nav.match(/<li>/g) || []).length >= document.chapters.length + 3, true);
  for (const chapter of document.chapters) {
    assert.ok(nav.includes(chapter.title.ar.slice(0, 12)), `nav is missing chapter ${chapter.title.ar}`);
  }
});

test('bilingual pages keep Arabic first and mark each language block', () => {
  const build = edbToEpub(bookstore[0], { modified: RELEASE });
  const page = readZip(build.buffer).find(entry => /text\/p00[1-9]\.xhtml$/.test(entry.path))!.data.toString('utf8');
  const arabic = page.indexOf('lang="ar"');
  const english = page.indexOf('lang="en"');
  assert.ok(arabic > 0 && english > arabic, 'Arabic block precedes the English block');
  assert.match(page, /dir="rtl"/);
  assert.match(page, /dir="ltr"/);
});

test('EPUB contains no remote resources and no script', () => {
  for (const document of bookstore.slice(0, 6)) {
    const build = edbToEpub(document, { modified: RELEASE });
    for (const entry of readZip(build.buffer)) {
      const text = entry.data.toString('utf8');
      if (entry.path.endsWith('.xhtml') || entry.path.endsWith('.opf') || entry.path.endsWith('.ncx')) {
        assert.doesNotMatch(text, /<script/i, `${entry.path} must not contain script`);
        assert.doesNotMatch(text, /src="https?:/, `${entry.path} must not load remote files`);
      }
    }
  }
});

test('XML-hostile characters are escaped instead of breaking the document', () => {
  const base = textbookToEdb(NDT_TEXTBOOKS[0], { createdAt: RELEASE, updatedAt: RELEASE });
  const hostile: EdbDocument = {
    ...base,
    id: 'edb-test-escaping',
    pages: base.pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            title: { ar: 'عنوان <غريب> & "مقتبس"', en: 'Odd <title> & "quoted"' },
            blocks: [{ type: 'paragraph', text: { ar: '5 < 6 && 7 > 6', en: '5 < 6 && 7 > 6' } }],
          }
        : page
    ),
  };
  const build = edbToEpub(hostile, { modified: RELEASE });
  const result = validateEpub(build.buffer);
  assert.deepEqual(result.errors, []);
  const page = readZip(build.buffer).find(entry => entry.path.endsWith('p001.xhtml'))!.data.toString('utf8');
  assert.match(page, /&lt;غريب&gt; &amp; &quot;مقتبس&quot;/);
  assert.doesNotMatch(page, /5 < 6/);
});

test('a tampered or truncated EPUB is rejected by the validator', () => {
  const build = edbToEpub(bookstore[0], { modified: RELEASE });
  const broken = Buffer.from(build.buffer);
  broken[broken.length - 40] = 0x00;
  const result = validateEpub(broken);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('the built library on disk matches the source (no stale files)', () => {
  const dir = path.resolve(process.cwd(), 'public', 'epub');
  assert.ok(existsSync(path.join(dir, 'index.json')), 'run npm run epub:build');
  const index = JSON.parse(readFileSync(path.join(dir, 'index.json'), 'utf8')) as {
    format: string;
    books: { id: string; file: string; checksum: string; bytes: number }[];
  };
  assert.equal(index.format, 'EPUB-INDEX');
  assert.equal(index.books.length, bookstore.length);
  for (const book of index.books) {
    const file = path.join(dir, book.file);
    assert.ok(existsSync(file), `missing ${book.file}`);
    const buffer = readFileSync(file);
    assert.equal(buffer.length, book.bytes, `${book.file} size does not match the index`);
    const result = validateEpub(buffer);
    assert.deepEqual(result.errors, [], `${book.file} is not a valid EPUB`);
  }
});

test('a book with an empty chapter list still yields a valid EPUB', () => {
  const base = textbookToEdb(NDT_TEXTBOOKS[0], { createdAt: RELEASE, updatedAt: RELEASE });
  const build = edbToEpub({ ...base, chapters: [] }, { modified: RELEASE });
  const result = validateEpub(build.buffer);
  assert.deepEqual(result.errors, []);
  const nav = readZip(build.buffer).find(entry => entry.path.endsWith('nav.xhtml'))!.data.toString('utf8');
  assert.match(nav, /epub:type="toc"/);
});

test('non-http source links are dropped with a warning, not written into the book', () => {
  const base = textbookToEdb(NDT_TEXTBOOKS[0], { createdAt: RELEASE, updatedAt: RELEASE });
  const page = base.pages[1];
  const build = edbToEpub(
    {
      ...base,
      pages: [
        base.pages[0],
        { ...page, blocks: [...page.blocks, { type: 'source', title: 'bad', url: 'javascript:alert(1)' }] },
        ...base.pages.slice(2),
      ],
    },
    { modified: RELEASE }
  );
  assert.ok(build.warnings.some(warning => warning.includes('non-http')), 'the dropped link must be reported');
  for (const entry of readZip(build.buffer)) {
    if (!entry.path.endsWith('.xhtml')) continue;
    assert.doesNotMatch(entry.data.toString('utf8'), /javascript:alert/, 'javascript: URL leaked into the book');
  }
});

/* ---------------------------------------------------------------- */
/* translation gaps                                                  */
/* ---------------------------------------------------------------- */

test('a list item with no translation is omitted, never relabelled', () => {
  const base = textbookToEdb(NDT_TEXTBOOKS[0], { createdAt: RELEASE, updatedAt: RELEASE });
  const page = base.pages[1];
  const patched: EdbDocument = {
    ...base,
    pages: [
      base.pages[0],
      {
        ...page,
        blocks: [
          { type: 'list', ordered: false, items: [{ ar: 'بند مترجم', en: 'Translated item' }, { ar: 'بند بلا ترجمة', en: '' }] },
        ],
      },
      ...base.pages.slice(2),
    ],
  };
  const build = edbToEpub(patched, { modified: RELEASE });
  assert.deepEqual(validateEpub(build.buffer).errors, []);
  const html = readZip(build.buffer).find(entry => entry.path.endsWith('p002.xhtml'))!.data.toString('utf8');
  assert.match(html, /Translated item/);
  // Both items stay in the Arabic list; the untranslated one is not copied into
  // the English list (one occurrence in the document, not two).
  assert.equal((html.match(/بند بلا ترجمة/g) || []).length, 1);
  assert.doesNotMatch(html, /lang="en"[^>]*>[^<]*بند بلا ترجمة/);
});

test('the translation gap is counted per book, not hidden', () => {
  const vt = bookstore.find(item => item.id === 'edb-book-vt')!;
  const build = edbToEpub(vt, { modified: RELEASE });
  assert.ok(build.entry.untranslated > 0, 'the known gap must be reported');
  assert.equal(build.entry.untranslated, countSingleLanguage(vt));
});
