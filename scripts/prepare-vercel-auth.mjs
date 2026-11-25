import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = fileURLToPath(new URL('../package.json', import.meta.url));
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const eagerJose = "const jose = require('jose');\n";

// Vercel's loader can reject synchronous require(esm) even on Node 24. The
// pinned jwks-rsa release eagerly requires ESM-only jose in BOTH modules below.
// Keep the current SDK and verification logic; only move the imports into the
// async/callback paths. A literal import keeps jose visible to Vercel's tracer.
// Remove once the lockfile picks up a released fix: auth0/node-jwks-rsa#508.
const edits = [
  {
    file: 'src/utils.js',
    before: 'async function retrieveSigningKeys(jwks) {\n',
    after: "async function retrieveSigningKeys(jwks) {\n  const jose = await import('jose');\n",
  },
  {
    file: 'src/integrations/passport.js',
    before: '  return function secretProvider(req, rawJwtToken, cb) {\n',
    after: "  return async function secretProvider(req, rawJwtToken, cb) {\n    let jose;\n    try { jose = await import('jose'); } catch (error) { return cb(error, null); }\n",
  },
];

export function prepareVercelAuth(projectManifest = manifest) {
  // Older checkouts without the private Firebase adapter have nothing to patch.
  if (!readJson(projectManifest).dependencies?.['firebase-admin']) return null;

  const requireProject = createRequire(projectManifest);
  const requireAuth = createRequire(requireProject.resolve('firebase-admin/auth'));
  const jwksManifest = requireAuth.resolve('jwks-rsa/package.json');
  const { version } = readJson(jwksManifest);
  if (version !== '4.1.0') return { version, patched: false };

  const modules = realpathSync(join(dirname(projectManifest), 'node_modules'));
  // Validate the entire known edit before writing. No fallback patch for other
  // versions or files; an unexpected source layout must not ship silently.
  const changes = edits.flatMap(({ file, before, after }) => {
    const path = realpathSync(join(dirname(jwksManifest), file));
    if (!path.startsWith(`${modules}${sep}`)) throw new Error(`Refusing to patch ${file} outside node_modules`);
    const source = readFileSync(path, 'utf8');
    if (!source.includes(eagerJose) && source.includes(after)) return [];
    if (!source.startsWith(eagerJose) || source.split(eagerJose).length !== 2 || source.split(before).length !== 2) {
      throw new Error(`Unexpected jwks-rsa ${version} source in ${file}; review the Vercel compatibility patch`);
    }
    return [{ path, content: source.slice(eagerJose.length).replace(before, after) }];
  });
  for (const { path, content } of changes) writeFileSync(path, content);
  return { version, patched: changes.length > 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = prepareVercelAuth();
  if (result) {
    // build:vercel launches this with --no-experimental-require-module. Fail
    // during build, not at the first production request, if the graph is broken.
    const { getAuth } = await import('firebase-admin/auth');
    if (typeof getAuth !== 'function') throw new Error('Firebase Admin Auth did not load');
    console.log(`[vercel] Firebase Admin Auth loaded (jwks-rsa ${result.version}${result.patched ? ', async JOSE patch applied' : ''}).`);
  }
}
