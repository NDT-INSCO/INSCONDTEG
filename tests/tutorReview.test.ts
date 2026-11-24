import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, type TestContext } from 'node:test';
import { parseSseBuffer, TUTOR_ENDPOINTS, type TutorStatus } from '../src/ai/contract';
import { reviewFor } from '../src/data/ndeEd/review';
import { reviewedTutorDocuments } from '../server/tutor/reviewedLibrary';

const courseId = 'nde-vt';
const file = `course-${courseId}.edb`;
const readEdb = (filename: string) => readFileSync(new URL(`../public/edb/${filename}`, import.meta.url), 'utf8');
const asOf = new Date('2026-11-18T00:00:00Z');

test('only the exact signed EDB edition supplies citable passages', () => {
  const register = [{ ...reviewFor(courseId)!, stage: 'reviewed' as const, reviewer: 'Fixture Level III', reviewedAt: '2026-11-10',
    checksum: JSON.parse(readEdb('index.json')).books.find((book: { id: string }) => book.id === `edb-course-${courseId}`).checksum }];
  const documents = reviewedTutorDocuments(readEdb, register, asOf);
  assert.ok(documents.length > 0);
  const first = documents[0];
  assert.equal(first.courseId, courseId);
  assert.equal(first.bookId, `edb-course-${courseId}`);
  assert.equal(first.pageNumber, 3);
  const edition = JSON.parse(readEdb(file));
  assert.ok(first.text.en.includes(edition.pages[2].blocks[0].text.en));

  const readEdition = (doc: unknown) => (filename: string) => filename === file ? JSON.stringify(doc) : readEdb(filename);
  edition.metadata.updatedAt = '2026-11-20T00:00:00.000Z';
  assert.deepEqual(reviewedTutorDocuments(readEdition(edition), register, asOf), documents, 'timestamps do not change the signed content');
  edition.pages[2].blocks[0].text.en = 'This unsigned sentence must not be in any tutor passage.';
  assert.deepEqual(reviewedTutorDocuments(readEdition(edition), register, asOf), [], 'a stale manifest does not make an altered lesson eligible');
  assert.deepEqual(reviewedTutorDocuments(p => p === file ? 'invalid' : readEdb(p), register, asOf), []);
  assert.deepEqual(reviewedTutorDocuments(p => p === 'index.json' ? '{"books":[null]}' : readEdb(p), register, asOf), []);
  assert.deepEqual(reviewedTutorDocuments(readEdb, undefined, asOf), [], 'the current public register has no signed courses');
});

async function launchTutor(t: TestContext, configured: boolean, env: Record<string, string> = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'insco-tutor-test-'));
  // Isolate dotenv, admin configuration, credentials and the SDK's network.
  const child = fork(fileURLToPath(new URL('./helpers/noTutorUpstream.ts', import.meta.url)), [], {
    cwd: dir,
    execArgv: ['--import', import.meta.resolve('tsx')],
    env: {
      NODE_ENV: 'production',
      PORT: '0',
      GEMINI_API_KEY: configured ? 'isolated-test-no-network' : '',
      // This file tests the *external* path: the local engine is the default in
      // production, so it has to be named explicitly here or the upstream is never called.
      AI_PROVIDER: 'gemini',
      ...env,
    },
    silent: true,
  });
  let attempts = 0;
  child.on('message', value => { if ((value as { type?: string })?.type === 'attempted_upstream') attempts++; });
  const exited = new Promise<void>(resolve => child.once('exit', () => resolve()));
  t.after(async () => {
    child.kill();
    await exited;
    await rm(dir, { recursive: true, force: true });
  });
  let log = '';
  child.stderr!.on('data', chunk => { log += String(chunk); });
  const origin = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Tutor server startup timed out: ${log}`)), 10000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Tutor server exited ${code}: ${log}`)); });
    let stdout = '';
    child.stdout!.on('data', chunk => {
      stdout += String(chunk);
      const match = /Server listening on http:\/\/0\.0\.0\.0:(\d+)/.exec(stdout);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
  });
  const call = (path: string, body?: unknown) => fetch(`${origin}${path}`, body === undefined ? { signal: AbortSignal.timeout(5000) } : {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
  });
  return { call, upstreamAttempts: () => attempts };
}

test('with no library at all the tutor refuses JSON and SSE without generation', async t => {
  // The academy fallback is off here on purpose: this is the state in which the tutor
  // must decline rather than answer from nothing.
  const { call, upstreamAttempts } = await launchTutor(t, true, { TUTOR_ALLOW_ACADEMY_FALLBACK: 'false' });
  const response = await call(TUTOR_ENDPOINTS.status);
  assert.equal(response.status, 200);
  const status = await response.json() as TutorStatus;
  assert.equal(status.configured, true);
  assert.equal(status.retrieval.documents, 0);
  assert.equal(status.retrieval.ready, false);
  assert.equal(status.retrieval.source, 'none');
  const legacy = await call(TUTOR_ENDPOINTS.legacyTutor, { topic: 'What is visual inspection?', language: 'en' });
  assert.equal(legacy.status, 200);
  const json = await legacy.json();
  assert.match(json.text, /no matching material/i);
  assert.equal(json.content, json.text);
  assert.equal(json.meta.confident, false);
  assert.deepEqual(json.meta.citations, []);
  const sse = await call(TUTOR_ENDPOINTS.tutor, { messages: [{ role: 'user', content: 'ما هو الفحص البصري؟' }], language: 'ar', mode: 'explain' });
  assert.equal(sse.status, 200);
  assert.match(sse.headers.get('content-type') || '', /^text\/event-stream/);
  const { events, rest } = parseSseBuffer(await sse.text());
  assert.equal(rest, '');
  assert.deepEqual(events.map(event => event.type), ['meta', 'delta', 'done']);
  assert.ok(events[0].type === 'meta' && !events[0].meta.confident && events[0].meta.retrieved === 0);
  assert.ok(events[0].type === 'meta' && events[0].meta.source === 'none');
  assert.ok(events[1].type === 'delta' && events[1].text.includes('لا توجد مادة مطابقة'));
  assert.equal(upstreamAttempts(), 0);
});

test('without a reviewed course the tutor answers from the academy corpus and says so', async t => {
  const { call, upstreamAttempts } = await launchTutor(t, true);
  const status = await (await call(TUTOR_ENDPOINTS.status)).json() as TutorStatus;
  assert.equal(status.configured, true);
  assert.equal(status.retrieval.source, 'academy', 'the reviewed corpus is empty in this repository');
  assert.ok(status.retrieval.documents > 0);
  assert.equal(status.retrieval.ready, true);

  // A question the academy material cannot match is still refused — no generation.
  const miss = await call(TUTOR_ENDPOINTS.legacyTutor, { topic: 'zzz qqq xyzzy', language: 'en' });
  assert.equal(miss.status, 200);
  const missJson = await miss.json();
  assert.equal(missJson.meta.confident, false);
  assert.equal(missJson.meta.source, 'academy');
  assert.match(missJson.text, /academy material/i);
  assert.equal(upstreamAttempts(), 0, 'nothing is generated for a question with no passage');

  // A question the corpus does match reaches the model. The isolated upstream refuses
  // the call, which is exactly the proof that generation was attempted, and the failure
  // is reported instead of answered.
  const hit = await call(TUTOR_ENDPOINTS.tutor, {
    messages: [{ role: 'user', content: 'ما الفرق بين PAUT و TOFD؟' }],
    language: 'ar',
    mode: 'explain',
  });
  assert.equal(hit.status, 200);
  const { events } = parseSseBuffer(await hit.text());
  const meta = events.find(event => event.type === 'meta');
  assert.ok(meta && meta.type === 'meta');
  assert.equal(meta.meta.confident, true, 'the corpus matched, so this is not the empty state');
  assert.equal(meta.meta.source, 'academy');
  assert.ok(meta.meta.citations.length > 0);
  for (const citation of meta.meta.citations) {
    assert.equal(citation.reviewed, false, 'academy citations are never presented as reviewed');
  }
  // The isolated upstream refuses every call: the stream must report that, not invent text.
  const failure = events.find(event => event.type === 'error');
  assert.ok(failure && failure.type === 'error');
  assert.equal(failure.error.code, 'upstream_error');
  assert.ok(upstreamAttempts() >= 1, 'generation was attempted');
});

test('unconfigured tutor and invalid requests are distinct, not canned answers', async t => {
  const { call, upstreamAttempts } = await launchTutor(t, false);
  const invalid = await call(TUTOR_ENDPOINTS.tutor, {});
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, 'invalid_request');
  // An unconfigured tutor answers from the library, not a refusal: the same
  // corpus the search box uses, honestly labelled and with no model attempt.
  const libraryAnswer = await call(TUTOR_ENDPOINTS.tutor, { prompt: 'What is a visual inspection?', language: 'en' });
  assert.equal(libraryAnswer.status, 200);
  const body = await libraryAnswer.text();
  assert.match(body, /"kind":"library"/);
  assert.match(body, /"model":null/);
  assert.equal(upstreamAttempts(), 0, 'the library path must not reach the model');
});
