/**
 * جامعة إنسكو الروبوتية — the runtime archive store contract.
 *
 * Verifies the three backends the university archive can live on, without any
 * network access: backend selection (firestore ▸ file ▸ memory), credential
 * sniffing, record-level validation of whatever lands in the archive, and a
 * full file-backend roundtrip in a scratch directory. The Firestore path is
 * exercised only up to the point where a real network call would start —
 * honest behaviour for a repo that holds no service account.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test, before } from 'node:test';
import { generateKeyPairSync } from 'node:crypto';

const scratch = mkdtempSync(path.join(tmpdir(), 'insco-university-store-'));
process.env.UNIVERSITY_ARCHIVE_PATH = path.join(scratch, 'archive.json');
process.env.UNIVERSITY_STORE = 'file';
// Make sure no stray host env leaks a Firestore credential into the tests.
delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.FIREBASE_FIRESTORE_DATABASE_ID;
delete process.env.FIREBASE_PROJECT_ID;

const store = await import('../server/university/store');
const runtimeRecords = await import('../server/university/runtimeRecords');
const firestoreStore = await import('../server/university/firestoreStore');

before(() => () => rmSync(scratch, { recursive: true, force: true }));

/* --------------------------- backend selection ---------------------------- */

test('backend selection: firestore wins when available, file otherwise, memory last', () => {
  const { selectBackendName } = store;
  assert.equal(selectBackendName({}, true, true), 'firestore');
  assert.equal(selectBackendName({}, true, false), 'firestore');
  assert.equal(selectBackendName({}, false, true), 'file');
  assert.equal(selectBackendName({}, false, false), 'memory');
  // Explicit overrides are honoured, and impossible choices degrade safely.
  assert.equal(selectBackendName({ UNIVERSITY_STORE: 'memory' }, true, true), 'memory');
  assert.equal(selectBackendName({ UNIVERSITY_STORE: 'file' }, false, false), 'memory');
  assert.equal(selectBackendName({ UNIVERSITY_STORE: 'firestore' }, false, true), 'memory');
  assert.equal(selectBackendName({ UNIVERSITY_STORE: 'FIRESTORE' }, true, true), 'firestore');
});

test('credential sniffing: no env ⇒ no Firestore, malformed env ⇒ not usable', async () => {
  const { hasFirestoreCredentials, createFirestoreUniversityStore } = firestoreStore;
  assert.equal(hasFirestoreCredentials({}), false);
  assert.equal(hasFirestoreCredentials({ FIREBASE_SERVICE_ACCOUNT_JSON: '   ' }), false);
  assert.equal(hasFirestoreCredentials({ FIREBASE_SERVICE_ACCOUNT: '   ' }), false);
  assert.equal(hasFirestoreCredentials({ GOOGLE_APPLICATION_CREDENTIALS: path.join(scratch, 'missing.json') }), false);
  const existing = path.join(scratch, 'fake-credentials.json');
  writeFileSync(existing, '{}', 'utf8');
  assert.equal(hasFirestoreCredentials({ GOOGLE_APPLICATION_CREDENTIALS: existing }), true);
  // The Vercel INSCO project stores the account under FIREBASE_SERVICE_ACCOUNT — honoured too.
  assert.equal(hasFirestoreCredentials({ FIREBASE_SERVICE_ACCOUNT: '{"client_email":"a@b.c","private_key":"k"}' }), true);

  // Garbage JSON must degrade to null (file/memory fallback), never throw.
  assert.equal(await createFirestoreUniversityStore({ FIREBASE_SERVICE_ACCOUNT_JSON: '{not json' }), null);
  // Well-formed JSON missing the required private-key fields ⇒ null.
  assert.equal(
    await createFirestoreUniversityStore({ FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({ project_id: 'x' }) }),
    null
  );
});

test('service account JSON with real newlines inside private_key is repaired, not rejected', async () => {
  const { generateKeyPairSync } = await import('node:crypto');
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  // Pretty-printed with literal newlines inside the JSON string — invalid JSON as-is.
  const pretty = [
    '{',
    '  "project_id": "demo-project",',
    '  "client_email": "university-archive@demo-project.iam.gserviceaccount.com",',
    `  "private_key": "${pem}"`,
    '}',
  ].join('\n');
  const created = await firestoreStore.createFirestoreUniversityStore({ FIREBASE_SERVICE_ACCOUNT: pretty });
  assert.ok(created, 'expected the newline-repaired account to initialise Firestore locally');
  assert.equal(created.backend, 'firestore');
});

test('a structurally valid service account initialises Firestore locally (no network)', async () => {
  // Generate a real RSA key pair in-memory so cert() accepts the account.
  // No RPC is issued here — we only assert the local wiring succeeds.
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const account = {
    project_id: 'ai-studio-applet-webapp-18922',
    client_email: 'university-archive@ai-studio-applet-webapp-18922.iam.gserviceaccount.com',
    private_key: pem,
  };
  const created = await firestoreStore.createFirestoreUniversityStore({
    FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify(account),
  });
  assert.ok(created, 'expected a local Firestore store instance from a valid account shape');
  assert.equal(created.backend, 'firestore');
});

/* -------------------------- record validation ----------------------------- */

test('runtime record sanitiser rejects junk and keeps valid records', () => {
  const { cleanRuntimeRecords } = runtimeRecords;
  const valid = {
    id: 'kb-live-x',
    departmentId: 'engineering',
    code: 'INSCO-IND-ENG-101',
    titleAr: 'سجل تجريبي للاختبار',
    titleEn: 'Test record',
    summaryAr: 'ملخص عربي صالح للسجل الاختباري للاختبار',
    summaryEn: 'A valid English summary for the test record.',
    keyPointsAr: ['نقطة أولى كاملة', 'نقطة ثانية كاملة', 'نقطة ثالثة كاملة'],
    keyPointsEn: ['first point', 'second point', 'third point'],
    sources: [{ title: 'ASME B31.3', publisher: 'ASME', url: 'https://www.asme.org/codes-standards/find-codes-standards/b31-process-piping' }],
    status: 'pending-review',
    version: 1,
    collectedBy: 'collector-engineering-research',
    evolvedBy: [],
    updatedAt: new Date().toISOString(),
  };
  assert.equal(cleanRuntimeRecords([valid]).length, 1);
  // Non-HTTPS source ⇒ dropped.
  assert.equal(
    cleanRuntimeRecords([{ ...valid, sources: [{ title: 'x', publisher: 'y', url: 'http://example.com/' }] }]).length,
    0
  );
  // Unknown department ⇒ dropped.
  assert.equal(cleanRuntimeRecords([{ ...valid, departmentId: 'alchemy' }]).length, 0);
  // Junk entries never crash the sanitiser.
  assert.equal(cleanRuntimeRecords([null, 42, 'nope', {}, []]).length, 0);
});

/* ----------------------------- file roundtrip ----------------------------- */

test('file backend: append persists to disk, reload reads it back, replaceDepartment swaps only that department', async () => {
  store.resetUniversityStoreForTests();
  const { appendRuntimeRecords, loadRuntimeArchive, replaceRuntimeRecords, storeBackend, storeIsWritable } = store;

  assert.equal(await storeBackend(), 'file');
  assert.equal(await storeIsWritable(), true);

  const base = {
    departmentId: 'engineering',
    titleAr: 'سجل اختبار الحفظ الدائم على القرص',
    titleEn: 'Disk persistence test record',
    summaryAr: 'ملخص عربي لاختبار أن السجل يُكتب على القرص ويُقرأ لاحقًا كما هو.',
    summaryEn: 'English summary asserting the record round-trips through the JSON file.',
    keyPointsAr: ['نقطة الحفظ الأولى', 'نقطة الحفظ الثانية'],
    keyPointsEn: ['first save point', 'second save point'],
    sources: [{ title: 'ASME', publisher: 'ASME', url: 'https://www.asme.org/' }],
    status: 'pending-review' as const,
    version: 1,
    collectedBy: 'collector-engineering-research',
    evolvedBy: [] as string[],
    updatedAt: new Date().toISOString(),
  };
  const first = await appendRuntimeRecords([
    { ...base, id: 'kb-test-disk-1', code: 'INSCO-IND-ENG-201' },
    { ...base, id: 'kb-test-disk-2', code: 'INSCO-IND-ENG-202' },
  ]);
  assert.equal(first.persisted, true);
  assert.equal(existsSync(process.env.UNIVERSITY_ARCHIVE_PATH!), true);

  // A fresh read (cache dropped) sees both records on disk.
  store.resetUniversityStoreForTests();
  const loaded = await loadRuntimeArchive();
  assert.equal(loaded.filter(r => r.code === 'INSCO-IND-ENG-201' || r.code === 'INSCO-IND-ENG-202').length, 2);

  // replaceDepartment with an evolved copy for engineering only.
  const target = loaded.find(r => r.code === 'INSCO-IND-ENG-201')!;
  const evolved = { ...target, version: target.version + 1, status: 'pending-review' as const, titleAr: 'سجل مُطوَّر بعد المذاكرة' };
  const replaced = await replaceRuntimeRecords('engineering', [evolved]);
  assert.equal(replaced.persisted, true);
  const onDisk = JSON.parse(readFileSync(process.env.UNIVERSITY_ARCHIVE_PATH!, 'utf8')) as Array<{ code: string; version: number }>;
  assert.equal(onDisk.some(r => r.code === 'INSCO-IND-ENG-201' && r.version === 2), true);
});

test('memory backend: reports persisted:false but still serves the session', async () => {
  const previous = process.env.UNIVERSITY_STORE;
  process.env.UNIVERSITY_STORE = 'memory';
  store.resetUniversityStoreForTests();
  try {
    assert.equal(await store.storeBackend(), 'memory');
    assert.equal(await store.storeIsWritable(), false);
    const appended = await store.appendRuntimeRecords([
      {
        id: 'kb-test-mem-1',
        departmentId: 'mathematics',
        code: 'INSCO-IND-MTH-301',
        titleAr: 'سجل ذاكرة مؤقتة',
        titleEn: 'Ephemeral memory record',
        summaryAr: 'ملخص عربي لسجل يعيش في الذاكرة فقط ولا يصل إلى القرص.',
        summaryEn: 'English summary for a record that lives in memory only.',
        keyPointsAr: ['نقطة الذاكرة الأولى', 'نقطة الذاكرة الثانية'],
        keyPointsEn: ['first memory point', 'second memory point'],
        sources: [{ title: 'ISO', publisher: 'ISO', url: 'https://www.iso.org/' }],
        status: 'pending-review',
        version: 1,
        collectedBy: 'collector-mathematics-research',
        evolvedBy: [],
        updatedAt: new Date().toISOString(),
      },
    ]);
    assert.equal(appended.persisted, false);
    assert.equal(appended.records.some(r => r.code === 'INSCO-IND-MTH-301'), true);
  } finally {
    process.env.UNIVERSITY_STORE = previous;
    store.resetUniversityStoreForTests();
  }
});
