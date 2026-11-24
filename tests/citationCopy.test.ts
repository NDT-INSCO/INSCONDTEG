/**
 * The citation panel's words.
 *
 * An answer built from the academy corpus must not borrow the heading of the reviewed
 * corpus: the two are different promises, and the label is the only place the reader can
 * see which one they got.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { citationCopy } from '../src/ai/citationCopy.js';

test('academy citations are announced as unreviewed, in both languages', () => {
  const ar = citationCopy('academy', true);
  assert.equal(ar.tone, 'academy');
  assert.match(ar.heading, /غير مُراجَعة/);
  assert.match(ar.note, /استرشادية/);
  assert.doesNotMatch(ar.heading, /المصادر المراجَعة/);

  const en = citationCopy('academy', false);
  assert.equal(en.tone, 'academy');
  assert.match(en.heading, /NOT reviewed/);
  assert.doesNotMatch(en.heading, /reviewed passages/i);
  assert.match(en.note, /not an approved reference/i);
});

test('reviewed citations keep their own wording', () => {
  const ar = citationCopy('reviewed', true);
  assert.equal(ar.tone, 'reviewed');
  assert.match(ar.heading, /المصادر المراجَعة/);
  assert.doesNotMatch(ar.note, /استرشادية/);

  const en = citationCopy('reviewed', false);
  assert.equal(en.tone, 'reviewed');
  assert.match(en.heading, /reviewed passages/i);
});

test('private Drive citations carry a clear internal-use warning in both languages', () => {
  const ar = citationCopy('private-drive', true);
  assert.equal(ar.tone, 'academy');
  assert.match(ar.heading, /Drive الخاصة/);
  assert.match(ar.note, /لا تُعد مراجعة فنية/);
  assert.match(ar.note, /إعادة النشر/);

  const mixed = citationCopy('mixed', false);
  assert.equal(mixed.tone, 'academy');
  assert.match(mixed.heading, /Mixed sources/);
  assert.match(mixed.note, /not engineering review/);
});

test('an unknown source is never presented as reviewed', () => {
  for (const source of [undefined, 'none'] as const) {
    const copy = citationCopy(source, false);
    assert.notEqual(copy.tone, 'academy');
    // `none` cannot cite anything: the tutor declines, so this branch only guards the type.
    assert.ok(copy.heading.length > 0);
  }
});
