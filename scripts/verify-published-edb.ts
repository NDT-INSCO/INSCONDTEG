/**
 * Verifies the *published* copy of the EDB library (docs/edb), not the source
 * build. This is the copy GitHub Pages actually serves, so it must be checked
 * separately: a stale or partially committed docs/ folder would ship broken
 * books while `edb:check` (which inspects public/edb) stayed green.
 *
 *   npm run edb:verify:published
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { edbContentChecksum } from '../src/edb/nodeChecksum';

const dir = path.join(process.cwd(), 'docs', 'edb');
const index = JSON.parse(readFileSync(path.join(dir, 'index.json'), 'utf8'));
let bad = 0;
for (const entry of index.books) {
  const file = path.join(dir, entry.file);
  if (!existsSync(file)) { console.log('MISSING FILE', entry.file); bad++; continue; }
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const digest = edbContentChecksum(doc);
  if (digest !== entry.checksum) { console.log('CHECKSUM MISMATCH', entry.file); bad++; }
  if (doc.pages.length !== entry.pages) { console.log('PAGE COUNT MISMATCH', entry.file, doc.pages.length, entry.pages); bad++; }
}
const onDisk = readdirSync(dir).filter(f => f.endsWith('.edb'));
const expected = new Set(index.books.map((b: any) => b.file));
const orphans = onDisk.filter(f => !expected.has(f));
if (orphans.length) { console.log('ORPHAN FILES', orphans.join(', ')); bad++; }
const totalBytes = index.books.reduce((s: number, b: any) => s + b.bytes, 0);
console.log(`docs/edb: ${index.books.length} books, ${index.books.reduce((s: number, b: any) => s + b.pages, 0)} pages, ${(totalBytes/1024).toFixed(1)} KiB, ${bad} problems`);
process.exit(bad ? 1 : 0);
