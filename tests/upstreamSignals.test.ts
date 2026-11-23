/**
 * What the server says when Google refuses a call.
 *
 * The deployed product used to answer every upstream failure with one sentence —
 * "the model is unreachable" — so a quota hit, a rejected key and a retired model
 * id were indistinguishable to the reader and to us. These tests pin the three
 * categories that decide the response: retry (quota), stop (key), next model (404).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyUpstreamError, failureMessage, sanitiseUpstreamDetail } from '../src/ai/contract';

test('the classifier separates quota, key and model failures', () => {
  assert.equal(classifyUpstreamError(new Error('429 RESOURCE_EXHAUSTED')), 'rate_limited');
  assert.equal(
    classifyUpstreamError(new Error('Quota exceeded for quota metric generate_content_free_tier_requests')),
    'rate_limited'
  );
  assert.equal(classifyUpstreamError(new Error('400 API key not valid. Please pass a valid API key.')), 'key_rejected');
  assert.equal(classifyUpstreamError(new Error('PERMISSION_DENIED: caller lacks permission')), 'key_rejected');
  assert.equal(classifyUpstreamError(new Error('404 models/gemini-3.8-flash is not found')), 'model_unavailable');
  assert.equal(classifyUpstreamError(new Error('fetch failed')), 'upstream_error');
  assert.equal(classifyUpstreamError(undefined), 'upstream_error');
});

test('a quota hit is reported as temporary, not as a broken tutor', () => {
  const ar = failureMessage('rate_limited', 'ar');
  const en = failureMessage('rate_limited', 'en');
  assert.match(ar, /الحد مؤقت/);
  assert.match(ar, /جرّب بعد دقيقة/);
  assert.doesNotMatch(ar, /تعذّر الوصول/);
  assert.match(en, /limit/i);
  assert.match(en, /minute/i);
});

test('the upstream snippet is shortened and carries no credential', () => {
  const key = 'AIza' + 'x'.repeat(35);
  const message =
    '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/' +
    `v1beta/models/gemini-2.5-flash: [503] The model is overloaded. ?key=${key}`;

  const detail = sanitiseUpstreamDetail(new Error(message));

  assert.match(detail, /503/);
  assert.match(detail, /overloaded/);
  assert.doesNotMatch(detail, /AIza/);
  assert.doesNotMatch(detail, new RegExp(key));
  assert.ok(detail.length <= 200, 'the snippet is a snippet');
  assert.equal(sanitiseUpstreamDetail(undefined), '');
});

test('a key Google rejects is named as such, not as an unreachable model', () => {
  const ar = failureMessage('key_rejected', 'ar');
  assert.match(ar, /API key not valid/);
  assert.match(ar, /مفتاح/);
  assert.doesNotMatch(ar, /تعذّر الوصول/);
});

test('the provider sentence is found inside an SDK wrapper', () => {
  const wrapped = new Error(
    '400 API error occurred: {"httpMeta":{"response":{}},"error":{"code":400,' +
      '"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}'
  );
  assert.equal(classifyUpstreamError(wrapped), 'key_rejected');
  assert.equal(sanitiseUpstreamDetail(wrapped), 'API key not valid. Please pass a valid API key.');
});

test("Google's high-demand 503 is a busy model, not a broken key", () => {
  const busy = new Error(
    'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.'
  );
  assert.equal(classifyUpstreamError(busy), 'model_busy');

  const ar = failureMessage('model_busy', 'ar');
  assert.match(ar, /مزدحم/);
  assert.match(ar, /جرّب بعد دقيقة/);
  assert.doesNotMatch(ar, /مفتاح/);
  assert.match(failureMessage('model_busy', 'en'), /busy/i);
});
