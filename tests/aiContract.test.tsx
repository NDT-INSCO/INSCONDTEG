import test from 'node:test';
import assert from 'node:assert/strict';

import {
  encodeSse,
  failureMessage,
  latestQuestion,
  normaliseTutorRequest,
  parseSseBuffer,
  TUTOR_LIMITS,
  TUTOR_MODELS,
  TutorStreamEvent,
} from '../src/ai/contract';
import { offlineStatus } from '../src/ai/client';

/* ---------------------------------------------------------------- */
/* request contract                                                  */
/* ---------------------------------------------------------------- */

test('the current shape is accepted and normalised', () => {
  const result = normaliseTutorRequest({
    messages: [
      { role: 'user', content: '  ما هو الفحص البصري؟  ' },
      { role: 'assistant', content: 'طريقة فحص...' },
      { role: 'user', content: 'وما متطلبات الإضاءة؟' },
    ],
    language: 'ar',
    mode: 'compare',
  });
  assert.equal(result.ok, true);
  assert.equal(result.value?.messages.length, 3);
  assert.equal(result.value?.messages[0].content, 'ما هو الفحص البصري؟', 'content must be trimmed');
  assert.equal(result.value?.language, 'ar');
  assert.equal(result.value?.mode, 'compare');
});

test('the legacy {topic, queryType} body still works', () => {
  const result = normaliseTutorRequest({ topic: 'ما هو DAC؟', queryType: 'code_clause', language: 'ar' });
  assert.equal(result.ok, true);
  assert.equal(result.value?.messages.length, 1);
  assert.equal(result.value?.messages[0].content, 'ما هو DAC؟');
  assert.equal(result.value?.mode, 'code');
});

test('a bare {prompt} body still works, and an unknown language falls back to Arabic', () => {
  const result = normaliseTutorRequest({ prompt: 'What is IQI?', language: 'fr' });
  assert.equal(result.ok, true);
  assert.equal(result.value?.language, 'ar');
});

test('empty, malformed and assistant-last bodies are rejected with a reason', () => {
  const cases: unknown[] = [
    null,
    'text',
    {},
    { messages: [] },
    { messages: [{ role: 'assistant', content: 'مرحباً' }] },
    { messages: [{ role: 'user', content: '   ' }] },
  ];
  for (const body of cases) {
    const result = normaliseTutorRequest(body);
    assert.equal(result.ok, false, `accepted ${JSON.stringify(body)}`);
    assert.ok(result.errors.length > 0);
  }
});

test('over-long messages are clamped and old turns are dropped', () => {
  const long = 'ا'.repeat(TUTOR_LIMITS.messageChars + 500);
  const result = normaliseTutorRequest({ messages: [{ role: 'user', content: long }] });
  assert.equal(result.ok, true);
  assert.equal(result.value?.messages[0].content.length, TUTOR_LIMITS.messageChars);

  const many = Array.from({ length: 40 }, (_, index) => ({ role: 'user', content: `سؤال ${index}` }));
  const trimmed = normaliseTutorRequest({ messages: many });
  assert.equal(trimmed.value?.messages.length, TUTOR_LIMITS.messages);
  assert.equal(trimmed.value?.messages.at(-1)?.content, 'سؤال 39');
});

test('control characters are stripped before they reach the model', () => {
  const result = normaliseTutorRequest({ messages: [{ role: 'user', content: 'سؤال\u0000به\u0007محارف' }] });
  assert.equal(result.value?.messages[0].content, 'سؤالبهمحارف');
});

test('latestQuestion returns the last user turn', () => {
  const result = normaliseTutorRequest({
    messages: [
      { role: 'user', content: 'أول' },
      { role: 'assistant', content: 'رد' },
      { role: 'user', content: 'آخر سؤال' },
    ],
  });
  assert.equal(latestQuestion(result.value!), 'آخر سؤال');
});

/* ---------------------------------------------------------------- */
/* stream framing                                                    */
/* ---------------------------------------------------------------- */

test('SSE frames round-trip through the parser', () => {
  const events: TutorStreamEvent[] = [
    { type: 'meta', meta: { model: 'gemini-3.8-flash', citations: [], retrieved: 0, confident: false, elapsedMs: 0 } },
    { type: 'delta', text: 'مرحباً ' },
    { type: 'delta', text: 'بالعالم' },
    { type: 'done' },
  ];
  const payload = events.map(encodeSse).join('');
  const parsed = parseSseBuffer(payload);
  assert.equal(parsed.rest, '');
  assert.equal(parsed.events.length, 4);
  assert.deepEqual(parsed.events[1], { type: 'delta', text: 'مرحباً ' });
});

test('a chunk boundary in the middle of a JSON frame is buffered, not lost', () => {
  const full = encodeSse({ type: 'delta', text: 'نص طويل' });
  const cut = full.length - 10;
  const first = parseSseBuffer(full.slice(0, cut));
  assert.equal(first.events.length, 0);
  assert.ok(first.rest.length > 0);

  const second = parseSseBuffer(first.rest + full.slice(cut));
  assert.equal(second.events.length, 1);
  assert.deepEqual(second.events[0], { type: 'delta', text: 'نص طويل' });
});

test('malformed frames are dropped without killing the stream', () => {
  const buffer = `data: {not json}\n\ndata: {"type":"delta","text":"سليم"}\n\n`;
  const parsed = parseSseBuffer(buffer);
  assert.equal(parsed.events.length, 1);
  assert.deepEqual(parsed.events[0], { type: 'delta', text: 'سليم' });
});

test('[DONE] is understood as the end of the stream', () => {
  const parsed = parseSseBuffer('data: [DONE]\n\n');
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].type, 'done');
});

/* ---------------------------------------------------------------- */
/* honest failure states                                             */
/* ---------------------------------------------------------------- */

test('every error code has a message in both languages', () => {
  const codes = ['not_configured', 'invalid_request', 'rate_limited', 'budget_exhausted', 'timeout', 'upstream_error'] as const;
  for (const code of codes) {
    const ar = failureMessage(code, 'ar');
    const en = failureMessage(code, 'en');
    assert.ok(ar.length > 20, `${code} has no Arabic message`);
    assert.ok(en.length > 20, `${code} has no English message`);
    assert.notEqual(ar, en);
  }
});

test('an unreachable gateway reports itself as unconfigured, not as an answer', () => {
  const status = offlineStatus();
  assert.equal(status.configured, false);
  assert.equal(status.reason, 'unreachable');
  assert.equal(status.model, TUTOR_MODELS.primary);
  assert.equal(status.retrieval.ready, false);
});

test('the primary model is a current Flash model, not a retired one', () => {
  assert.equal(TUTOR_MODELS.primary, 'gemini-3.8-flash');
  assert.ok(!TUTOR_MODELS.fallbacks.includes('gemini-3.7-flash' as never));
  assert.ok(!TUTOR_MODELS.fallbacks.includes('gemini-3.5-flash' as never));
  assert.equal(TUTOR_MODELS.deep, 'gemini-4-argon');
});
