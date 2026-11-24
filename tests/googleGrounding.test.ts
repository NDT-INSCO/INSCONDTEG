import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGoogleGroundingPrompt, extractGoogleGroundingCitations, restrictUniversitySourcesToGrounding, shouldUseGoogleGrounding } from '../server/ai/googleGrounding.js';

test('web research turns on for explicit and time-sensitive / standards questions, not routine chat', () => {
  assert.equal(shouldUseGoogleGrounding('What is UT?', false), false);
  assert.equal(shouldUseGoogleGrounding('What is the latest ISO revision for this test?', false), true);
  assert.equal(shouldUseGoogleGrounding('ما أحدث إصدار لمعيار ISO؟', false), true);
  assert.equal(shouldUseGoogleGrounding('hello', true), true);
});

test('grounding prompt treats web pages as untrusted and forbids invented code details', () => {
  const prompt = buildGoogleGroundingPrompt('ASME code acceptance values', 'en');
  assert.match(prompt, /primary sources/i);
  assert.match(prompt, /untrusted data/i);
  assert.match(prompt, /Do not invent clauses/i);
});

test('only unique HTTPS grounding citations are exposed to the UI', () => {
  const citations = extractGoogleGroundingCitations({
    candidates: [{ groundingMetadata: { groundingChunks: [
      { web: { uri: 'https://asme.org/codes', title: 'ASME' } },
      { web: { uri: 'https://asme.org/codes', title: 'Duplicate' } },
      { web: { uri: 'http://insecure.example/path', title: 'Insecure' } },
      { web: { uri: 'javascript:alert(1)', title: 'Unsafe' } },
      { web: { uri: 'https://astm.org/standards', title: 'ASTM' } },
    ] } }],
  });
  assert.deepEqual(citations.map(item => item.url), ['https://asme.org/codes', 'https://astm.org/standards']);
  assert.ok(citations.every(item => item.sourceType === 'web-search'));
});

test('university archive sources must match Google grounding metadata, not model-invented URLs', () => {
  const grounded = extractGoogleGroundingCitations({
    candidates: [{ groundingMetadata: { groundingChunks: [
      { web: { uri: 'https://iso.org/standard/63553.html', title: 'ISO standard page' } },
      { web: { uri: 'https://asme.org/codes', title: 'ASME code page' } },
    ] } }],
  });
  const sources = restrictUniversitySourcesToGrounding([
    { url: 'https://iso.org/standard/63553.html', title: 'A made-up title', publisher: 'Fake Publisher' },
    { url: 'https://asme.org/codes', title: 'Another made-up title', publisher: 'Fake' },
    { url: 'https://invented.example/nope', title: 'Invented' },
  ], grounded);
  assert.deepEqual(sources, [
    { title: 'ISO standard page', publisher: 'iso.org', url: 'https://iso.org/standard/63553.html' },
    { title: 'ASME code page', publisher: 'asme.org', url: 'https://asme.org/codes' },
  ]);
});
