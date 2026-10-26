/**
 * Build the `.edb` library from the source data.
 *
 *   npm run edb:build     write public/edb/*.edb + index.json
 *   npm run edb:check     verify committed files match the current data
 *
 * The output is deterministic: stable JSON key ordering and a SHA-256 checksum
 * stored in the index, so CI can detect stale generated books.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NDT_TEXTBOOKS } from '../src/data/ndeTextbooksData';
import { NDE_ED_COURSES, NDE_ED_SOURCE_MAP } from '../src/data/ndeEd';
import { courseToEdb, textbookToEdb } from '../src/edb/convert';
import { stableStringify, validateEdb } from '../src/edb/validate';
import { EDB_FORMAT, EDB_GENERATOR, EDB_VERSION, EdbDocument, EdbIndex, EdbIndexEntry } from '../src/edb/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'public', 'edb');
const checkMode = process.argv.includes('--check');

/**
 * Content checksum. `metadata.createdAt` / `updatedAt` are build-time values, so
 * they are excluded: otherwise every rebuild would look like a content change
 * and `--check` could never be green in CI.
 */
const checksum = (document: EdbDocument) => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...metadata } = document.metadata;
  const content = { ...document, metadata };
  return createHash('sha256').update(stableStringify(content)).digest('hex');
};

function fileName(id: string) {
  return `${id.replace(/^edb-/, '')}.edb`;
}

function entryFromDocument(document: EdbDocument, kind: 'textbook' | 'course', file: string, bytes: number, digest: string): EdbIndexEntry {
  return {
    id: document.id,
    file,
    kind,
    title: document.metadata.title,
    subtitle: document.metadata.subtitle,
    discipline: document.metadata.relatedDiscipline || 'general',
    pages: document.pages.length,
    estimatedMinutes: document.metadata.estimatedMinutes,
    accent: document.theme.accent,
    edition: document.metadata.edition,
    standards: document.metadata.standards || [],
    checksum: digest,
    bytes,
  };
}

const documents: { document: EdbDocument; kind: 'textbook' | 'course' }[] = [
  ...NDT_TEXTBOOKS.map(book => ({ document: textbookToEdb(book), kind: 'textbook' as const })),
  ...NDE_ED_COURSES.map(course => ({ document: courseToEdb(course, NDE_ED_SOURCE_MAP), kind: 'course' as const })),
];

const entries: EdbIndexEntry[] = [];
let failures = 0;

for (const { document, kind } of documents) {
  const result = validateEdb(document);
  if (!result.valid) {
    failures += 1;
    console.error(`✗ ${document.id}: ${result.errors.length} validation error(s)`);
    result.errors.slice(0, 8).forEach(error => console.error(`   - ${error}`));
    continue;
  }
  const file = fileName(document.id);
  const payload = JSON.stringify(document);
  const digest = checksum(document);
  const bytes = Buffer.byteLength(payload, 'utf8');

  if (!checkMode) {
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, file), payload, 'utf8');
  }
  entries.push(entryFromDocument(document, kind, file, bytes, digest));
}

if (failures > 0) {
  console.error(`\nEDB build failed: ${failures} invalid document(s).`);
  process.exit(1);
}

const index: EdbIndex = {
  format: 'EDB-INDEX',
  version: EDB_VERSION,
  generatedAt: new Date().toISOString(),
  generator: EDB_GENERATOR,
  books: entries,
};

if (checkMode) {
  const indexPath = path.join(outputDir, 'index.json');
  if (!existsSync(indexPath)) {
    console.error('✗ public/edb/index.json is missing. Run npm run edb:build.');
    process.exit(1);
  }
  const existing = JSON.parse(readFileSync(indexPath, 'utf8')) as EdbIndex;
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
      console.error(`✗ stale .edb content: ${entry.file}`);
      stale += 1;
    }
    const filePath = path.join(outputDir, entry.file);
    if (!existsSync(filePath)) {
      console.error(`✗ missing file: ${entry.file}`);
      stale += 1;
    }
  }
  const expectedFiles = new Set(entries.map(entry => entry.file));
  readdirSync(outputDir)
    .filter(file => file.endsWith('.edb') && !expectedFiles.has(file))
    .forEach(file => {
      console.error(`✗ orphan .edb file: ${file}`);
      stale += 1;
    });
  if (stale > 0) {
    console.error(`\nEDB check failed: ${stale} stale item(s). Run npm run edb:build.`);
    process.exit(1);
  }
  console.log(`✓ EDB check passed: ${entries.length} books, ${entries.reduce((sum, entry) => sum + entry.pages, 0)} pages.`);
} else {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
  const totalBytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  console.log(`✓ EDB built: ${entries.length} books (${entries.filter(e => e.kind === 'textbook').length} textbooks, ${entries.filter(e => e.kind === 'course').length} courses)`);
  console.log(`  pages: ${entries.reduce((sum, entry) => sum + entry.pages, 0)} • payload: ${(totalBytes / 1024).toFixed(1)} KiB`);
  console.log(`  output: public/edb/ (${EDB_FORMAT} v${EDB_VERSION})`);
}
