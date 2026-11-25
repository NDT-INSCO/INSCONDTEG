/*
 * firebase-admin -> jwks-rsa currently loads jose (ESM-only) with require() from
 * a CommonJS helper. Vercel's Node 24 runtime rejects that edge even though the
 * local Node loader accepts it. Keep the import deferred and use native import()
 * from the async key-retrieval function. Fail closed if the upstream file shape
 * changes so a dependency update cannot silently skip this compatibility fix.
 */
const fs = require('node:fs');
const path = require('node:path');

const packageJsonPath = require.resolve('jwks-rsa/package.json');
const packageRoot = path.dirname(packageJsonPath);
const utilsPath = path.join(packageRoot, 'src', 'utils.js');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let source = fs.readFileSync(utilsPath, 'utf8');

const cjsImport = "const jose = require('jose');";
const asyncFunction = 'async function retrieveSigningKeys(jwks) {\n';
const esmImport = "  const jose = await import('jose');";

if (source.includes(esmImport) && !source.includes(cjsImport)) {
  console.log(`[postinstall] jwks-rsa ${packageJson.version}: ESM-compatible jose import already present.`);
  process.exit(0);
}

if (!source.includes(cjsImport) || !source.includes(asyncFunction)) {
  throw new Error(
    `[postinstall] Cannot apply the jwks-rsa ${packageJson.version} jose ESM compatibility fix: unexpected src/utils.js shape.`
  );
}

source = source.replace(cjsImport, '');
source = source.replace(asyncFunction, `${asyncFunction}${esmImport}\n`);
fs.writeFileSync(utilsPath, source);
console.log(`[postinstall] Patched jwks-rsa ${packageJson.version} to dynamically import jose from async key retrieval.`);
