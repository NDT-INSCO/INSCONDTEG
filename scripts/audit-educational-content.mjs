#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ndeDir = path.join(root, 'src/data/ndeEd');
const exclude = new Set(['types.ts','helpers.ts','index.ts','sources.ts','review.ts']);
const files = fs.readdirSync(ndeDir).filter(f => f.endsWith('.ts') && !exclude.has(f)).sort();

function count(re, s) { const m = s.match(re); return m ? m.length : 0; }
function hasFieldNearLesson(s, lessonId, field) {
  const idx = s.indexOf(`id: '${lessonId}'`);
  if (idx < 0) return false;
  const next = s.indexOf("    {\n      id: '", idx + 1);
  const block = s.slice(idx, next > idx ? next : idx + 4000);
  return block.includes(field);
}

const report = { generatedAt: new Date().toISOString(), courses: [], totals: {} };
for (const f of files) {
  const s = fs.readFileSync(path.join(ndeDir, f), 'utf8');
  const lessonIds = [...s.matchAll(/^\s+id: '(?!nde-)([^']+)',/gm)].map(m => m[1]).filter(id => !id.startsWith('edb-'));
  // better: capture lesson ids inside lessons array by looking for id: 'xxx' after lessons
  const ids = [...s.matchAll(/\n\s{6}id: '([^']+)'/g)].map(m => m[1]);
  const courseId = (s.match(/id: '(nde-[^']+)'/) || [,'unknown'])[1];
  const course = { file: `src/data/ndeEd/${f}`, courseId, lessons: [] };
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const blockStart = s.indexOf(`id: '${id}'`);
    const nextId = ids[i+1];
    const next = nextId ? s.indexOf(`id: '${nextId}'`, blockStart + 1) : s.indexOf("\n  ],\n  standards:", blockStart + 1);
    const block = s.slice(blockStart, next > blockStart ? next : blockStart + 12000);
    const quizCalls = (block.match(/\bquiz\(/g) || []).length;
    const quizBankCount = Math.max(0, quizCalls - (block.includes('quiz: quiz(') ? 1 : 0));
    course.lessons.push({
      id,
      hasGovernance: block.includes('governance:'),
      hasPrerequisites: block.includes('prerequisiteLessonIds:'),
      hasAssumptions: block.includes('assumptionsAndLimits:'),
      hasReferenceTrace: block.includes('referenceTrace:'),
      quizBankCount: Math.max(0, quizBankCount),
      hasQuiz: block.includes('quiz: quiz('),
    });
  }
  report.courses.push(course);
}

const lessons = report.courses.flatMap(c => c.lessons);
report.totals = {
  courses: report.courses.length,
  lessons: lessons.length,
  withGovernance: lessons.filter(l=>l.hasGovernance).length,
  withPrerequisites: lessons.filter(l=>l.hasPrerequisites).length,
  withAssumptions: lessons.filter(l=>l.hasAssumptions).length,
  withReferenceTrace: lessons.filter(l=>l.hasReferenceTrace).length,
  withQuizBank: lessons.filter(l=>l.quizBankCount>0).length,
  quizBankQuestions: lessons.reduce((a,l)=>a+l.quizBankCount,0),
};
fs.mkdirSync(path.join(root,'documentation/educational-audit/generated'), {recursive:true});
fs.writeFileSync(path.join(root,'documentation/educational-audit/generated/nde-ed-audit.json'), JSON.stringify(report,null,2));
const lines = [
  '# NDE-Ed Audit (Generated)',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `- Courses: ${report.totals.courses}`,
  `- Lessons: ${report.totals.lessons}`,
  `- With governance: ${report.totals.withGovernance}/${report.totals.lessons}`,
  `- With prerequisiteLessonIds: ${report.totals.withPrerequisites}/${report.totals.lessons}`,
  `- With assumptionsAndLimits: ${report.totals.withAssumptions}/${report.totals.lessons}`,
  `- With referenceTrace: ${report.totals.withReferenceTrace}/${report.totals.lessons}`,
  `- With quizBank: ${report.totals.withQuizBank}/${report.totals.lessons} (${report.totals.quizBankQuestions} extra questions)`,
  '',
  '| Course | Lesson | Gov | Prereq | Assumptions | RefTrace | QuizBank |',
  '|---|---|:---:|:---:|:---:|:---:|---:|',
];
for (const c of report.courses) for (const l of c.lessons) lines.push(`| ${c.courseId} | ${l.id} | ${l.hasGovernance?'Y':'N'} | ${l.hasPrerequisites?'Y':'N'} | ${l.hasAssumptions?'Y':'N'} | ${l.hasReferenceTrace?'Y':'N'} | ${l.quizBankCount} |`);
fs.writeFileSync(path.join(root,'documentation/educational-audit/generated/nde-ed-audit.md'), lines.join('\n')+'\n');
console.log(JSON.stringify(report.totals, null, 2));
