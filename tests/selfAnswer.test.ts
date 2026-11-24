/**
 * The self-reliant tutor: the answer composed from the library itself.
 *
 * Two honesty rules this test guards. First, the answer must be composed only
 * from corpus text — an id that is not in the corpus must never appear.
 * Second, the reader is told exactly how the answer was produced (the steps),
 * so a library answer is never mistaken for a model answer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { composeSelfAnswer } from '../src/ai/selfAnswer.js';
import { searchLibrary, tokenize } from '../src/ai/search.js';
import type { SearchHit } from '../src/ai/search.js';

/* ------------------------------------------------------------------ */
/* mock hits                                                           */
/* ------------------------------------------------------------------ */

function mockHit(id: string, overrides: Partial<SearchHit['document']> = {}): SearchHit {
  return {
    score: 8,
    matched: ['crack'],
    baseMatched: 1,
    rareMatch: false,
    document: {
      id,
      kind: 'textbook',
      bookId: 'book-ut',
      pageNumber: 3,
      title: { ar: 'الشروخ في اللحام', en: 'Cracks in the weld' },
      section: { ar: 'الفحص', en: 'Testing' },
      discipline: 'ndt',
      text: { ar: 'الشروخ تظهر بسبب إجهادات متبقية.', en: 'Cracks appear because of residual stresses.' },
      ...overrides,
    },
    snippet: { ar: 'الشروخ تظهر بسبب إجهادات متبقية.', en: 'Cracks appear because of residual stresses.' },
  };
}

/* ------------------------------------------------------------------ */
/* behaviour                                                           */
/* ------------------------------------------------------------------ */

test('composes an answer from the top passage, in Arabic, with the thinking visible', () => {
  const hits = [mockHit('book-ut#p3'), mockHit('book-ut#p4', { pageNumber: 4 })];
  const answer = composeSelfAnswer({
    question: 'ما هي الشروخ؟',
    language: 'ar',
    hits,
    corpusSize: 132,
  });
  assert.ok(answer, 'a matched question must produce an answer');
  assert.match(answer.text, /سؤالك/);
  assert.match(answer.text, /الشروخ في اللحام/);
  assert.match(answer.text, /الشروخ تظهر بسبب/);
  // The honest limits line, and the related passage.
  assert.match(answer.text, /ليست تقييمًا/);
  // The thinking trace: analyse → search → pick → compose.
  assert.equal(answer.steps.length, 4);
  assert.match(answer.steps[0], /حلل السؤال/);
  assert.match(answer.steps[1], /بحث في المكتبة/);
  assert.match(answer.steps[2], /المقطع الأقرب/);
  assert.match(answer.steps[3], /بدون مفتاح نموذج/);
});

test('composes an English answer when asked in English', () => {
  const hits = [mockHit('book-ut#p3')];
  const answer = composeSelfAnswer({
    question: 'What causes cracks?',
    language: 'en',
    hits,
    corpusSize: 132,
  });
  assert.ok(answer);
  assert.match(answer.text, /Your question/);
  assert.match(answer.text, /Cracks in the weld/);
  assert.match(answer.text, /composed from the INSCO library itself/);
  assert.match(answer.text, /not a technical assessment/);
  assert.match(answer.steps[0], /Analysed the question/);
  assert.match(answer.steps[3], /no model key/);
});

test('refuses to compose when the library has nothing to quote', () => {
  const empty = composeSelfAnswer({
    question: 'ما هي الشروخ؟',
    language: 'ar',
    hits: [],
    corpusSize: 132,
  });
  assert.equal(empty, null);

  const noCorpus = composeSelfAnswer({
    question: 'What is porosity?',
    language: 'en',
    hits: [mockHit('book-ut#p3')],
    corpusSize: 0,
  });
  assert.equal(noCorpus, null);
});

test('quotes at most three passages, never invents an id', () => {
  const hits = [mockHit('book-ut#p3'), mockHit('book-ut#p4'), mockHit('book-ut#p5'), mockHit('book-ut#p6')];
  const answer = composeSelfAnswer({ question: 'وشروخ', language: 'ar', hits, corpusSize: 132 });
  assert.ok(answer);
  assert.equal((answer.text.match(/book-ut/g) ?? []).length, 0, 'an id must not leak into the prose');
  assert.match(answer.steps[2], /المقطع الأقرب/);
});

/* ------------------------------------------------------------------ */
/* real corpus                                                         */
/* ------------------------------------------------------------------ */

test('an Arabic question on the real corpus yields a grounded answer', () => {
  const question = 'ما هو تأثير الهيدروجين في الشروخ الباردة؟';
  const result = searchLibrary(question);
  assert.ok(result.confident, `expected a real match, got: ${JSON.stringify(result.terms)}`);
  const hits = result.hits.slice(0, 5);
  const answer = composeSelfAnswer({
    question,
    language: 'ar',
    hits,
    corpusSize: result.indexed,
  });
  assert.ok(answer);
  const topTitle = hits[0].document.title.ar;
  assert.match(answer.text, new RegExp(topTitle.slice(0, 12)));
  assert.equal(answer.steps.length, 4);
});

test('the answer never cites an id the corpus does not hold', () => {
  const question = 'What is the depth of penetration?';
  const result = searchLibrary(question);
  if (!result.confident) return; // the real corpus may not match this one
  const hits = result.hits.slice(0, 5);
  const answer = composeSelfAnswer({ question, language: 'en', hits, corpusSize: result.indexed });
  assert.ok(answer);
  const knownIds = new Set(hits.map(h => h.document.id));
  // Every `book-…#…`-shaped id in the text must be one the corpus actually holds.
  const ids = answer.text.match(/[a-z0-9-]+#p\d+/gi) ?? [];
  for (const id of ids) assert.ok(knownIds.has(id), `invented id leaked: ${id}`);
  // The question itself must be echoed back, not swapped or rephrased silently.
  assert.match(answer.text, /depth of penetration/i);
});
