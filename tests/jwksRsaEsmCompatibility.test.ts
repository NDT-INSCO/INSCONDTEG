import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const require = createRequire(import.meta.url);

test('jwks-rsa does not require the ESM-only jose package during CommonJS module loading', async () => {
  const utilsPath = require.resolve('jwks-rsa/src/utils.js');
  const source = readFileSync(utilsPath, 'utf8');
  assert.match(source, /const jose = await import\(['"]jose['"]\)/);
  assert.doesNotMatch(source, /require\(['"]jose['"]\)/);

  const { retrieveSigningKeys } = require('jwks-rsa/src/utils.js') as {
    retrieveSigningKeys: (jwks: unknown[]) => Promise<unknown[]>;
  };
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  const keys = await retrieveSigningKeys([{ ...jwk, use: 'sig' }]);
  assert.equal(keys.length, 1);
  assert.match((keys[0] as { getPublicKey: () => string }).getPublicKey(), /BEGIN PUBLIC KEY/);
});

test('Firebase Admin Auth module initializes for the Vercel AI function', async () => {
  const firebaseAuth = await import('firebase-admin/auth');
  assert.equal(typeof firebaseAuth.getAuth, 'function');
});
