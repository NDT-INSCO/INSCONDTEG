import assert from 'node:assert/strict';
import test from 'node:test';

import { NDE_ED_COURSES, NDE_ED_SOURCES } from '../src/data/ndeEd';
import {
  NDE_ED_REVIEW_REGISTER,
  REVIEW_STAGE_LABEL,
  checksumForCourse,
  reviewFor,
  reviewSummary,
  validateReviewEntry,
} from '../src/data/ndeEd/review';
import { auditLinks, summariseReachability } from '../src/utils/linkAudit';

test('the review register covers every course with roles, and no invented signatures', () => {
  assert.equal(NDE_ED_REVIEW_REGISTER.length, NDE_ED_COURSES.length);
  for (const course of NDE_ED_COURSES) {
    const entry = reviewFor(course.id);
    assert.ok(entry, `${course.id} missing from the review register`);
    assert.ok(entry!.technicalRole.trim().length > 4, `${course.id} needs a technical role`);
    assert.ok(entry!.editorRole.trim().length > 4, `${course.id} needs an editor role`);
    assert.deepEqual(validateReviewEntry(entry!), [], `${course.id} register entry is inconsistent`);
  }
});

test('no course may claim a review that was never signed', () => {
  const reviewed = NDE_ED_REVIEW_REGISTER.filter(entry => entry.stage === 'reviewed');
  for (const entry of reviewed) {
    assert.ok(entry.reviewer, `${entry.courseId} claims review without a reviewer`);
    assert.match(entry.checksum || '', /^[a-f0-9]{64}$/, `${entry.courseId} needs a signed checksum`);
  }
  const summary = reviewSummary();
  assert.equal(summary.reviewed, reviewed.length);
  assert.equal(summary.total, NDE_ED_REVIEW_REGISTER.length);
  if (summary.reviewed === 0) {
    assert.match(summary.label.en, /0\/\d+ courses reviewed/);
  }
});

test('review state labels exist for all three stages', () => {
  for (const stage of ['pending', 'assigned', 'reviewed'] as const) {
    assert.ok(REVIEW_STAGE_LABEL[stage].ar.trim().length > 3);
    assert.ok(REVIEW_STAGE_LABEL[stage].en.trim().length > 3);
  }
});

test('validateReviewEntry rejects a reviewed course without a checksum or date', () => {
  const base = {
    courseId: 'nde-vt',
    technicalRole: 'VT Level III',
    editorRole: 'Arabic technical editor',
  };
  assert.ok(validateReviewEntry({ ...base, stage: 'reviewed', reviewer: 'X' }).length >= 2);
  assert.deepEqual(
    validateReviewEntry({ ...base, stage: 'reviewed', reviewer: 'X', reviewedAt: '2026-10-21', checksum: 'a'.repeat(64) }),
    []
  );
  assert.ok(validateReviewEntry({ ...base, stage: 'pending', reviewer: 'X' }).length >= 1);
  assert.ok(validateReviewEntry({ ...base, stage: 'assigned', reviewer: 'X' }).length >= 1);
  assert.deepEqual(validateReviewEntry({ ...base, stage: 'assigned', reviewer: 'X', assignedOn: '2026-10-21' }), []);
  assert.ok(
    validateReviewEntry({
      ...base,
      stage: 'reviewed',
      reviewer: 'X',
      reviewedAt: '2026-10-21',
      checksum: 'a'.repeat(64),
      safetyRole: 'Radiation protection',
    }).some(error => error.includes('safety')),
    'a course with a safety role must record the safety reviewer'
  );
});

test('checksumForCourse maps the generated index entry by id', () => {
  const index = { books: [{ id: 'edb-course-nde-vt', checksum: 'abc' }, { id: 'edb-book-ut', checksum: 'def' }] };
  assert.equal(checksumForCourse(index, 'nde-vt'), 'abc');
  assert.equal(checksumForCourse(index, 'nde-pt'), undefined);
  assert.equal(checksumForCourse(null, 'nde-vt'), undefined);
});

test('the reading anchors pass the structural link audit', () => {
  const audit = auditLinks(NDE_ED_SOURCES.map(source => ({ id: source.id, title: source.title, url: source.url })));
  assert.deepEqual(audit.issues, [], audit.issues.map(issue => `${issue.code}:${issue.id}`).join(', '));
  assert.equal(audit.total, NDE_ED_SOURCES.length);
  assert.ok(audit.ok);
  assert.ok(audit.hosts['www.nde-ed.org'] > 70, 'most anchors should be nde-ed.org');
});

test('the audit catches the link mistakes that actually happen', () => {
  const audit = auditLinks([
    { id: 'ok', title: 'Good page', url: 'https://www.nde-ed.org/Physics/Waves/index.xhtml' },
    { id: 'ok', title: 'Duplicate id', url: 'https://www.nde-ed.org/Physics/Sound/index.xhtml' },
    { id: 'dup', title: 'Duplicate url', url: 'https://www.nde-ed.org/Physics/Waves/index.xhtml' },
    { id: 'http', title: 'Insecure anchor', url: 'http://www.nde-ed.org/Physics/Waves/index.xhtml' },
    { id: 'host', title: 'Unreviewed host', url: 'https://example.org/page' },
    { id: 'bad', title: 'Not a url', url: 'nde-ed.org/page' },
    { id: 'html', title: 'Wrong extension', url: 'https://www.nde-ed.org/Physics/Waves/index.html' },
    { id: 'short', title: 'x', url: 'https://www.nde-ed.org/Physics/Waves/other.xhtml' },
  ]);
  const codes = new Set(audit.issues.map(issue => issue.code));
  for (const code of ['duplicate-id', 'duplicate-url', 'not-https', 'unexpected-host', 'invalid-url', 'suspicious-path', 'missing-title']) {
    assert.ok(codes.has(code as never), `expected the audit to report ${code}`);
  }
  assert.equal(audit.ok, false);
  assert.ok(audit.hosts['example.org']);
});

test('reachability summary separates failures without hiding them', () => {
  const summary = summariseReachability([
    { id: 'a', url: 'https://a', status: 200, ok: true },
    { id: 'b', url: 'https://b', status: 404, ok: false },
    { id: 'c', url: 'https://c', status: 'timeout', ok: false },
  ]);
  assert.equal(summary.checked, 3);
  assert.equal(summary.reachable, 1);
  assert.deepEqual(summary.failed.map(item => item.id), ['b', 'c']);
  assert.equal(summary.ok, false);
});
