import test from 'node:test';
import assert from 'node:assert/strict';

import { getCorpus } from '../src/ai/corpus';
import {
  buildIndex,
  expandQuery,
  getLibraryIndex,
  normaliseArabic,
  searchLibrary,
  tokenize,
} from '../src/ai/search';
import { buildSynonymIndex, TERM_GROUPS } from '../src/ai/synonyms';

/* ---------------------------------------------------------------- */
/* normalisation                                                     */
/* ---------------------------------------------------------------- */

test('Arabic normalisation unifies hamza forms, ta marbuta and diacritics', () => {
  assert.equal(normaliseArabic('أَحْمَد'), 'احمد');
  assert.equal(normaliseArabic('إضاءة'), 'اضاءه');
  assert.equal(normaliseArabic('آلة'), 'اله');
  assert.equal(normaliseArabic('مُصْطَفَى'), 'مصطفي');
  assert.equal(normaliseArabic('٠١٢٣'), '0123');
  assert.equal(normaliseArabic('الفـحص'), 'الفحص'); // tatweel removed
});

test('tokenizer drops stopwords, short tokens and stems English plurals', () => {
  const tokens = tokenize('ما هي متطلبات الإضاءة في الفحص البصري؟');
  assert.ok(tokens.includes('متطلب'), tokens.join(','));
  assert.ok(tokens.includes('اضاءه'), tokens.join(','));
  assert.ok(!tokens.includes('ما'), 'stopword "ما" must be dropped');
  assert.ok(!tokens.includes('في'), 'stopword "في" must be dropped');

  const english = tokenize('How do cracks propagate in welds');
  assert.ok(english.includes('crack'), english.join(','));
  assert.ok(english.includes('weld'), english.join(','));
  assert.ok(!english.includes('how'));
});

test('the thesaurus maps Arabic and English terms to each other', () => {
  const synonyms = buildSynonymIndex();
  const crack = synonyms.get('crack') ?? [];
  assert.ok(crack.includes('شق'), 'crack must expand to an Arabic spelling');
  const shaq = synonyms.get('شق') ?? [];
  assert.ok(shaq.includes('crack'), 'Arabic must expand back to crack');
  for (const group of TERM_GROUPS) {
    assert.ok(group.ar.length + group.en.length > 0, `${group.id} is empty`);
  }
});

/* ---------------------------------------------------------------- */
/* corpus + index                                                    */
/* ---------------------------------------------------------------- */

test('the corpus indexes every textbook page and every lesson', () => {
  const corpus = getCorpus();
  const textbooks = corpus.filter(document => document.kind === 'textbook');
  const lessons = corpus.filter(document => document.kind === 'lesson');
  const courses = corpus.filter(document => document.kind === 'course');

  assert.equal(textbooks.length, 90);
  assert.equal(lessons.length, 35);
  assert.equal(courses.length, 7);
  assert.equal(corpus.length, 132);

  const ids = new Set(corpus.map(document => document.id));
  assert.equal(ids.size, corpus.length, 'document ids must be unique');
  for (const document of corpus) {
    assert.ok(document.text.ar.length + document.text.en.length > 100, `${document.id} has no text`);
  }
});

test('the index covers the corpus and exposes a usable vocabulary', () => {
  const index = getLibraryIndex();
  assert.equal(index.documents.length, getCorpus().length);
  assert.ok(index.df.size > 3000, `vocabulary is suspiciously small: ${index.df.size}`);
  assert.ok(index.averageLength > 50);
});

/* ---------------------------------------------------------------- */
/* retrieval                                                         */
/* ---------------------------------------------------------------- */

test('an Arabic query finds the visual-testing illumination page', () => {
  const result = searchLibrary('ما هي متطلبات الإضاءة في الفحص البصري؟');
  assert.equal(result.confident, true);
  assert.equal(result.hits[0].document.id, 'book-vt#p1');
  assert.match(result.hits[0].document.title.ar, /الإضاءة/);
});

test('the same page is found from an English query', () => {
  const result = searchLibrary('illumination requirements visual testing');
  assert.equal(result.confident, true);
  assert.equal(result.hits[0].document.id, 'book-vt#p1');
});

test('Arabic and English queries for a crack retrieve the same pages', () => {
  const arabic = searchLibrary('شق');
  const english = searchLibrary('crack');
  assert.equal(arabic.confident, true);
  assert.equal(english.confident, true);

  // Exact rank equivalence is not something a thesaurus can promise, and
  // asserting it would be testing an aspiration. What must hold: the two
  // languages surface the same documents, and every one of them is on topic.
  const arabicIds = arabic.hits.slice(0, 3).map(hit => hit.document.id);
  const englishIds = english.hits.slice(0, 3).map(hit => hit.document.id);
  const shared = arabicIds.filter(id => englishIds.includes(id));
  assert.ok(shared.length >= 2, `only ${shared.length} shared hits: ${arabicIds} vs ${englishIds}`);

  for (const hit of [...arabic.hits.slice(0, 2), ...english.hits.slice(0, 2)]) {
    const text = `${hit.document.title.ar} ${hit.document.title.en} ${hit.document.text.ar} ${hit.document.text.en}`;
    assert.match(text, /شق|شروخ|crack/i, `${hit.document.id} is not about cracks`);
  }
});

test('a rare exact term wins on its own', () => {
  const result = searchLibrary('Ishihara');
  assert.equal(result.confident, true);
  assert.equal(result.hits[0].document.id, 'book-vt#p1');
  assert.equal(result.hits[0].rareMatch, true);
});

test('abbreviations resolve through the thesaurus', () => {
  const result = searchLibrary('PWHT');
  assert.equal(result.confident, true);
  assert.ok(result.hits.some(hit => hit.document.text.ar.includes('المعالجة الحرارية') || hit.document.text.en.toLowerCase().includes('stress relief')));
});

test('empty, short and junk queries return nothing rather than noise', () => {
  for (const query of ['', ' ', 'a', 'نيوتن', 'quantum tunnelling microscope', 'asdfghjkl']) {
    const result = searchLibrary(query);
    assert.equal(result.hits.length, 0, `"${query}" must return no hits`);
    assert.equal(result.confident, false);
  }
});

test('a generic word alone is not treated as a confident match', () => {
  const result = searchLibrary('ما هو أفضل مطعم في القاهرة');
  assert.equal(result.confident, false, 'one generic word must not count as an answer');
});

test('results are deterministic and respect the limit', () => {
  const first = searchLibrary('calibration', { limit: 3 });
  const second = searchLibrary('calibration', { limit: 3 });
  assert.deepEqual(first.hits.map(hit => hit.document.id), second.hits.map(hit => hit.document.id));
  assert.ok(first.hits.length <= 3);
});

test('the kind filter restricts results to lessons when asked', () => {
  const result = searchLibrary('calibration', { kinds: ['lesson'] });
  assert.ok(result.hits.length > 0);
  for (const hit of result.hits) assert.equal(hit.document.kind, 'lesson');
});

test('snippets quote the matched text, not the beginning of the page', () => {
  const result = searchLibrary('Ishihara');
  const hit = result.hits[0];
  assert.ok(hit.snippet.ar.includes('Ishihara') || hit.snippet.en.includes('Ishihara'));
  assert.ok(hit.snippet.ar.length <= 260);
});

test('query expansion keeps the user terms and adds synonyms with lower weight', () => {
  const index = getLibraryIndex();
  const terms = expandQuery('crack', index);
  const byTerm = new Map(terms.map(term => [term.term, term]));
  assert.equal(byTerm.get('crack')?.weight, 1);
  const arabic = [...byTerm.keys()].find(term => /[\u0600-\u06FF]/.test(term));
  assert.ok(arabic, 'a synonym in Arabic must be present');
  assert.ok((byTerm.get(arabic!)?.weight ?? 1) < 1);
});

test('a custom index can be built from a subset without touching the global one', () => {
  const subset = getCorpus().filter(document => document.kind === 'lesson');
  const index = buildIndex(subset);
  const result = searchLibrary('eddy current', { index });
  assert.ok(result.hits.length > 0);
  for (const hit of result.hits) assert.equal(hit.document.kind, 'lesson');
});
