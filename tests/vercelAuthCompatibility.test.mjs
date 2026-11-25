import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

function fixture(t, version = '4.1.0') {
  const cwd = mkdtempSync(join(tmpdir(), 'insco-vercel-auth-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const write = (file, source) => {
    const target = join(cwd, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, typeof source === 'string' ? source : JSON.stringify(source));
  };
  const utils = 'node_modules/jwks-rsa/src/utils.js';
  const passport = 'node_modules/jwks-rsa/src/integrations/passport.js';
  write('package.json', { type: 'module', dependencies: { 'firebase-admin': '14.5.1' } });
  write('node_modules/firebase-admin/package.json', { exports: { './auth': './auth.cjs' } });
  write('node_modules/firebase-admin/auth.cjs', `const jwks = require('jwks-rsa'); exports.getAuth = () => jwks;`);
  write('node_modules/jwks-rsa/package.json', { version, main: 'src/index.js' });
  write('node_modules/jwks-rsa/src/index.js', `module.exports = { ...require('./utils'), ...require('./integrations/passport') };`);
  write(utils, `const jose = require('jose');
async function retrieveSigningKeys(jwks) {
  return jose.getKeys(jwks);
}
module.exports = { retrieveSigningKeys };
`);
  write(passport, `const jose = require('jose');
module.exports.passportJwtSecret = function () {
  return function secretProvider(req, rawJwtToken, cb) {
    cb(null, jose.decodeJwt(rawJwtToken));
  };
};
`);
  write('node_modules/jose/package.json', { type: 'module', exports: './index.js' });
  write('node_modules/jose/index.js', `export const getKeys = keys => keys; export const decodeJwt = token => token;`);
  mkdirSync(join(cwd, 'scripts'));
  copyFileSync(new URL('../scripts/prepare-vercel-auth.mjs', import.meta.url), join(cwd, 'scripts/prepare-vercel-auth.mjs'));
  return {
    write,
    read: file => readFileSync(join(cwd, file), 'utf8'),
    utils, passport,
    prepare: () => run('scripts/prepare-vercel-auth.mjs'),
    run,
  };

  function run(...args) {
    return spawnSync(process.execPath, ['--no-experimental-require-module', ...args], {
      cwd, env: { ...process.env, NODE_OPTIONS: '' }, encoding: 'utf8', timeout: 10_000,
    });
  }
}

test('the Vercel prebuild makes BOTH JWKS entry points load and use ESM-only JOSE', t => {
  const f = fixture(t);
  const original = f.run('--input-type=module', '--eval', "await import('firebase-admin/auth')");
  assert.equal(original.status, 1);
  assert.match(original.stderr, /ERR_REQUIRE_ESM/);
  const patched = f.prepare();
  assert.equal(patched.status, 0, patched.stderr);
  assert.match(patched.stdout, /async JOSE patch applied/);
  const verified = f.run('--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    import { getAuth } from 'firebase-admin/auth';
    const { retrieveSigningKeys, passportJwtSecret } = getAuth();
    assert.deepEqual(await retrieveSigningKeys(['fixture-public-key']), ['fixture-public-key']);
    const token = await new Promise((resolve, reject) => {
      passportJwtSecret()(null, 'fixture-token', (error, value) => error ? reject(error) : resolve(value));
    });
    assert.equal(token, 'fixture-token');
  `);
  assert.equal(verified.status, 0, verified.stderr);
  const repeat = f.prepare();
  assert.equal(repeat.status, 0, repeat.stderr);
  assert.doesNotMatch(repeat.stdout, /patch applied/);
});

test('a changed source layout fails the build without partially patching another file', t => {
  const f = fixture(t);
  const before = f.read(f.utils);
  f.write(f.passport, 'module.exports = {};');
  const result = f.prepare();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unexpected jwks-rsa 4\.1\.0 source/);
  assert.equal(f.read(f.utils), before);
});

test('a different package version is never modified and must still pass the cold import', t => {
  const f = fixture(t, '4.2.0');
  const before = f.read(f.utils);
  const result = f.prepare();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ERR_REQUIRE_ESM/);
  assert.equal(f.read(f.utils), before);
});

test('a release without the Firebase adapter needs no patch', t => {
  const f = fixture(t);
  f.write('package.json', { type: 'module' });
  const result = f.prepare();
  assert.equal(result.status, 0, result.stderr);
  assert.match(f.read(f.utils), /require\('jose'\)/);
});
