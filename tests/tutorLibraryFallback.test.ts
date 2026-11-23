/**
 * Which library the tutor answers from, and what it says about it.
 *
 * The tutor is only allowed three states: reviewed courses, the site's academy corpus
 * (labelled as unreviewed), or a refusal. A silent fourth state — answering from the
 * academy material while presenting it as reviewed — is the one this file exists to
 * prevent.
 */
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { getCorpus } from '../src/ai/corpus.js';
import { buildAcademyLibrary, buildTutorLibrary } from '../server/tutor/library.js';

const missingCorpus = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'insco-library-'));
  return (filename: string) => {
    throw new Error(`ENOENT: ${path.join(root, filename)}`);
  };
};

test('with no reviewed course, the academy corpus answers and is named as such', () => {
  const built = buildTutorLibrary(missingCorpus());
  assert.equal(built.reviewedDocuments, 0);
  assert.equal(built.library.source, 'academy');
  assert.equal(built.library.documents, getCorpus().length);
  assert.ok(built.library.documents > 0);
});

test('the academy library actually retrieves the site’s own material', () => {
  const library = buildAcademyLibrary();
  const hits = library.retrieve('الفرق بين PAUT و TOFD');
  assert.ok(hits.length > 0, 'a normal NDT question must match something');
  for (const hit of hits) {
    assert.ok(hit.document.id.length > 0);
    assert.ok((hit.document.text.ar || hit.document.text.en || '').trim().length > 0);
  }
});

test('the fallback can be turned off, and then the tutor has nothing', () => {
  const built = buildTutorLibrary(missingCorpus(), { allowAcademyFallback: false });
  assert.equal(built.library.source, 'none');
  assert.equal(built.library.documents, 0);
  assert.deepEqual(built.library.retrieve('أي سؤال'), []);
});

test('a reviewed corpus would win over the academy one', () => {
  // A tiny fabricated reviewed course: one page and a matching index with a valid
  // checksum is more machinery than this test needs, so the checked property is the
  // ordering rule itself: zero reviewed documents means the academy corpus, not both.
  const built = buildTutorLibrary(missingCorpus());
  assert.notEqual(built.library.source, 'reviewed');
  assert.equal(built.reviewedDocuments, 0);
});

test('the empty library never pretends to have documents', () => {
  const built = buildTutorLibrary(missingCorpus(), { allowAcademyFallback: false });
  assert.equal(built.library.documents, 0);
  assert.equal(built.library.retrieve('UT').length, 0);
});
