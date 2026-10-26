import assert from 'node:assert/strict';
import test from 'node:test';

import { ENGINEERING_DISCIPLINES } from '../src/data/academyCurriculum';
import {
  NDE_ED_COURSES,
  NDE_ED_LESSONS,
  NDE_ED_SOURCE_MAP,
  NDE_ED_TOTAL_MINUTES,
  courseAssessment,
  courseMinutes,
} from '../src/data/ndeEd';

const methodCodes = new Set(['PHYSICS', 'VT', 'PT', 'MT', 'UT', 'RT', 'ET', 'PAUT', 'TOFD']);

test('the NDE-Ed library exposes the seven seeded courses and their lessons', () => {
  assert.deepEqual(
    NDE_ED_COURSES.map(course => course.id).sort(),
    ['nde-et', 'nde-mt', 'nde-physics', 'nde-pt', 'nde-rt', 'nde-ut', 'nde-vt']
  );
  assert.equal(NDE_ED_LESSONS.length, 35);
  assert.equal(NDE_ED_TOTAL_MINUTES, NDE_ED_COURSES.reduce((sum, course) => sum + courseMinutes(course), 0));
});

test('every course has measurable objectives, sourced lessons and a final self-check', () => {
  for (const course of NDE_ED_COURSES) {
    assert.ok(methodCodes.has(course.code), `${course.id} has an unknown method code`);
    assert.ok(course.outcomes.length >= 3, `${course.id} needs at least three outcomes`);
    assert.ok(course.lessons.length >= 4, `${course.id} needs at least four lessons`);
    assert.ok(courseMinutes(course) > 0);

    for (const lesson of course.lessons) {
      assert.ok(lesson.objectives.length >= 2, `${lesson.id} needs measurable objectives`);
      assert.ok(lesson.sections.length >= 2, `${lesson.id} needs teaching sections`);
      assert.ok(lesson.sources.length >= 1, `${lesson.id} must cite a source`);
      for (const sourceId of lesson.sources) {
        assert.ok(NDE_ED_SOURCE_MAP[sourceId], `${lesson.id} cites unknown source ${sourceId}`);
      }
      assert.ok(lesson.minutes > 0, `${lesson.id} needs a duration`);
    }

    const assessment = courseAssessment(course);
    assert.equal(assessment.length, course.lessons.length);
    for (const item of assessment) {
      const question = item.quiz;
      assert.ok(question.options.length >= 3, `${question.id} needs at least three options`);
      assert.ok(question.answer >= 0 && question.answer < question.options.length, `${question.id} answer index`);
      assert.ok(question.explanation.ar.trim() && question.explanation.en.trim(), `${question.id} explanation`);
    }
  }
});

test('every lesson deep-links to a curriculum level and module that exist', () => {
  for (const lesson of NDE_ED_LESSONS) {
    const link = lesson.curriculum;
    assert.ok(link, `${lesson.id} has no curriculum link`);
    const discipline = ENGINEERING_DISCIPLINES.find(item => item.id === link!.disciplineId);
    assert.ok(discipline, `${lesson.id} points at unknown discipline ${link!.disciplineId}`);
    const level = discipline!.levels.find(item => item.levelId === link!.levelId);
    assert.ok(level, `${lesson.id} points at ${link!.levelId}, which ${discipline!.id} does not define`);
    if (link!.moduleId) {
      assert.ok(
        level!.modules.some(module => module.id === link!.moduleId),
        `${lesson.id} points at module ${link!.moduleId}, which ${link!.levelId} does not contain`
      );
    }
  }
});

test('the conventional curriculum now has the four career stages in order', () => {
  const conventional = ENGINEERING_DISCIPLINES.find(item => item.id === 'conventional_ndt');
  assert.ok(conventional);
  assert.deepEqual(conventional!.levels.map(level => level.levelId), ['academic', 'level1', 'level2', 'level3']);
  const level1 = conventional!.levels[1];
  assert.ok(level1.modules.length >= 5, 'Level 1 must carry the five method modules');
  assert.ok(level1.practicalSkillsChecklist && level1.practicalSkillsChecklist.length >= 5);
});

test('sources are unique, and all but the ASNT VT primer point at nde-ed.org', () => {
  const urls = Object.values(NDE_ED_SOURCE_MAP).map(source => source.url);
  assert.equal(new Set(urls).size, urls.length, 'duplicate source URL');

  const offSite = Object.values(NDE_ED_SOURCE_MAP).filter(source => !/^https:\/\/www\.nde-ed\.org\//.test(source.url));
  assert.deepEqual(offSite.map(source => source.id), ['asnt-vt']);
  assert.match(offSite[0].url, /^https:\/\/www\.asnt\.org\//);

  for (const source of Object.values(NDE_ED_SOURCE_MAP)) {
    assert.ok(source.title.trim().length > 3, source.id);
    assert.ok(source.covers.ar.trim() && source.covers.en.trim(), source.id);
  }
});

test('the non-accreditation notice is present on every course', () => {
  for (const course of NDE_ED_COURSES) {
    assert.match(`${course.limits.ar} ${course.limits.en}`, /certif|accredit|exam|qualif|اعتماد|شهادة|يؤهل/i, `${course.id} limits text`);
  }
});
