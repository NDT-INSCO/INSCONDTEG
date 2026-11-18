/**
 * "Did you rebuild `docs/` after changing `src/`?"
 *
 * Pages publishes `main` → `/docs`, so the committed folder *is* the site and a
 * stale folder is how the live site once went blank. The check therefore has to
 * compare the committed output with a fresh `npm run build`.
 *
 * Comparing `git status` byte-for-byte is too strict: Vite names chunks after
 * their content, and when two chunks import each other (the academy chunk and
 * the three.js scene chunk do) the hash names can be assigned in a different
 * order on a different machine even though every byte of the payload is the
 * same. That produced a red build on a perfectly fresh `docs/`.
 *
 * So the comparison is:
 *   • every file that exists in `HEAD:docs/` must exist on disk (and vice
 *     versa) — same names for real files, hash suffix normalised for assets;
 *   • the payloads must match once hashed file names inside them are
 *     normalised;
 *   • everything outside `docs/assets/` (fonts, PDFs, images, EDB books) must
 *     match byte for byte.
 *
 * A genuinely stale folder still fails: its JavaScript differs.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOCS = 'docs';
/** `name-D3adB33f.js` → `name-HASH.js` (8-character Vite hash). */
const HASHED = /-[A-Za-z0-9_-]{8}\.(js|css|woff2?|png|jpg|svg|webp)$/;

function sha(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 12);
}

function normaliseName(path: string): string {
  return path.replace(HASHED, '-HASH.$1');
}

function normalisePayload(text: string): string {
  return text.replace(/-[A-Za-z0-9_-]{8}\.(js|css|woff2?|png|jpg|svg|webp)/g, '-HASH.$1');
}

function gitFiles(): string[] {
  const out = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', DOCS], {
    encoding: 'utf8',
  });
  return out.split('\n').map(line => line.trim()).filter(Boolean);
}

function diskFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else found.push(relative(process.cwd(), full).split('\\').join('/'));
    }
  };
  walk(dir);
  return found;
}

const committed = gitFiles();
const onDisk = diskFiles(DOCS);

const problems: string[] = [];

// 1. same file set (asset names compared with the hash normalised).
const committedNames = new Map(committed.map(path => [normaliseName(path), path]));
const diskNames = new Map(onDisk.map(path => [normaliseName(path), path]));

for (const [name, path] of committedNames) {
  if (!diskNames.has(name)) problems.push(`missing from the fresh build: ${path}`);
}
for (const [name, path] of diskNames) {
  if (!committedNames.has(name)) problems.push(`not committed: ${path}`);
}

// 2. same payload (hashed names inside the payload normalised).
const isPayloadText = (path: string) => /\.(js|css|html|json|map)$/.test(path);
let compared = 0;

for (const [name, committedPath] of committedNames) {
  const diskPath = diskNames.get(name);
  if (!diskPath || !existsSync(diskPath)) continue;

  const committedBuffer = execFileSync('git', ['show', `HEAD:${committedPath}`], {
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  });
  const diskBuffer = readFileSync(diskPath);

  if (isPayloadText(committedPath)) {
    const a = normalisePayload(committedBuffer.toString('utf8'));
    const b = normalisePayload(diskBuffer.toString('utf8'));
    if (a !== b) {
      problems.push(
        `content differs: ${committedPath} (committed ${sha(a)}) vs ${diskPath} (build ${sha(b)})`
      );
    }
  } else if (sha(committedBuffer) !== sha(diskBuffer)) {
    problems.push(`binary differs: ${committedPath}`);
  }
  compared += 1;
}

if (problems.length > 0) {
  console.error('docs/ is stale or unrelated to the current source.');
  for (const problem of problems.slice(0, 25)) console.error(`  · ${problem}`);
  console.error(`\n${problems.length} problem(s) across ${committed.length} committed file(s).`);
  console.error("Run 'npm run build' and commit the result.");
  process.exit(1);
}

console.log(
  `docs/ matches the fresh build (${compared} file(s) compared, chunk hash names normalised).`
);
