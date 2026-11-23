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
import { classifyUpstreamError, failureMessage } from '../src/ai/contract';

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
