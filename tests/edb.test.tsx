import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeBilingualBlocks, parseLanguageBlocks } from '../src/edb/paragraphs';
import { courseToEdb, textbookToEdb } from '../src/edb/convert';
import { parseEdb, stableStringify, validateEdb } from '../src/edb/validate';
import { NDE_ED_COURSES, NDE_ED_SOURCE_MAP } from '../src/data/ndeEd';
import { NDT_TEXTBOOKS } from '../src/data/ndeTextbooksData';

const RTL = /[\u0600-\u06FF]/;

test('parseLanguageBlocks keeps one paragraph block per non-empty line', () => {
  const blocks = parseLanguageBlocks('الفحص البصري هو أول طريقة.\nVisual testing is the first method.');
  assert.equal(blocks.length, 2);
  for (const block of blocks) assert.equal(block.type, 'paragraph');
});

test('parseLanguageBlocks detects bullet and Arabic-Indic numbered lists', () => {
  const blocks = parseLanguageBlocks('- أول بند\n- ثاني بند\n٣. البند الثالث\n٤. البند الرابع');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, 'list');
  assert.equal(blocks[0].type === 'list' && blocks[0].ordered, false);
  assert.equal(blocks[0].type === 'list' && blocks[0].items.length, 2);
  assert.equal(blocks[1].type === 'list' && blocks[1].ordered, true);
  assert.equal(blocks[1].type === 'list' && blocks[1].items.length, 2);
});

test('parseLanguageBlocks drops blank lines and keeps Arabic text intact', () => {
  const blocks = parseLanguageBlocks('\n\nطريقة واحدة فقط بالعربية.\n\nثم فقرة ثانية.\n');
  assert.equal(blocks.length, 2);
  for (const block of blocks) {
    assert.equal(block.type, 'paragraph');
    if (block.type === 'paragraph') assert.match(block.text, RTL);
  }
});

test('mergeBilingualBlocks pairs same-type blocks line by line', () => {
  const merged = mergeBilingualBlocks(
    'الفحص بالموجات فوق الصوتية.\nالفحص بالجسيمات المغناطيسية.',
    'Ultrasonic testing.\nMagnetic particle testing.'
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[0].text.ar, 'الفحص بالموجات فوق الصوتية.');
  assert.equal(merged[0].text.en, 'Ultrasonic testing.');
  assert.equal(merged[1].text.en, 'Magnetic particle testing.');
});

test('mergeBilingualBlocks keeps an orphan rather than dropping content', () => {
  const merged = mergeBilingualBlocks(
    'الفحص بالموجات فوق الصوتية.\nفقرة إضافية غير مترجمة.',
    'Ultrasonic testing.'
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[1].text.ar, 'فقرة إضافية غير مترجمة.');
  assert.equal(merged[1].text.en, '');
});

test('mergeBilingualBlocks collapses a paragraph/list mismatch into one bilingual paragraph', () => {
  const merged = mergeBilingualBlocks('عنوان عربي', '- نقطة أولى\n- نقطة ثانية');
  assert.equal(merged.length, 1);
  assert.equal(merged[0].type, 'paragraph');
  assert.equal(merged[0].text.ar, 'عنوان عربي');
  assert.equal(merged[0].text.en, 'نقطة أولى نقطة ثانية');
});

test('mergeBilingualBlocks never emits a block whose two fields are both empty', () => {
  const merged = mergeBilingualBlocks('   \n\n', '\n  \n');
  assert.deepEqual(merged, []);
});

test('every textbook converts to a valid EDB with non-empty bilingual pages', () => {
  assert.ok(NDT_TEXTBOOKS.length > 0);
  for (const textbook of NDT_TEXTBOOKS) {
    const edb = textbookToEdb(textbook);
    const result = validateEdb(edb);
    assert.deepEqual(result.errors, [], `${textbook.id}: ${result.errors.join(' | ')}`);
    assert.equal(parseEdb(JSON.stringify(edb)).document?.format, 'EDB');
    for (const page of edb.pages) {
      const blocks = page.blocks.filter(block => block.type === 'paragraph' || block.type === 'list');
      assert.ok(blocks.length > 0, `${textbook.id} page ${page.number} has no text blocks`);
      for (const block of blocks) {
        if (block.type === 'paragraph') {
          assert.ok(block.text.ar.trim() || block.text.en.trim(), `${textbook.id} page ${page.number} empty block`);
        }
      }
    }
  }
});

test('every NDE-Ed course converts to a valid EDB with one page per lesson', () => {
  assert.ok(NDE_ED_COURSES.length >= 6);
  for (const course of NDE_ED_COURSES) {
    const edb = courseToEdb(course, NDE_ED_SOURCE_MAP);
    const result = validateEdb(edb);
    assert.deepEqual(result.errors, [], `${course.id}: ${result.errors.join(' | ')}`);
    assert.ok(edb.pages.length >= course.lessons.length + 2, `${course.id} needs cover + about + lessons`);
    assert.equal(edb.pages[0].kind, 'cover');
    const bodyPages = edb.pages.filter(page => page.kind === 'content');
    assert.ok(bodyPages.length >= course.lessons.length, `${course.id} content page count`);
  }
});

test('conversion is deterministic and stableStringify is key-order independent', () => {
  const stamp = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
  const first = stableStringify(textbookToEdb(NDT_TEXTBOOKS[0], stamp));
  const second = stableStringify(textbookToEdb(NDT_TEXTBOOKS[0], stamp));
  assert.equal(first, second);
  assert.equal(
    stableStringify(courseToEdb(NDE_ED_COURSES[0], NDE_ED_SOURCE_MAP, stamp)),
    stableStringify(courseToEdb(NDE_ED_COURSES[0], NDE_ED_SOURCE_MAP, stamp))
  );

  const document = JSON.parse(first);
  const scrambled = Object.fromEntries(Object.entries(document).reverse());
  assert.equal(stableStringify(scrambled), first);
});

test('course EDB carries the nde-ed.org attribution and the non-certifying notice', () => {
  const edb = courseToEdb(NDE_ED_COURSES[0], NDE_ED_SOURCE_MAP);
  const text = JSON.stringify(edb);
  assert.match(text, /nde-ed\.org/);
  assert.match(text, /not a formal|certif/i);
});
