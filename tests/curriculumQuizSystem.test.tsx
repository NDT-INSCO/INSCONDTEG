import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { ENGINEERING_DISCIPLINES } from '../src/data/academyCurriculum';
import { NDE_ED_COURSES } from '../src/data/ndeEd';
import {
  getAllCurriculumQuizPacks,
  getModuleQuizPack,
  getNdeEdLessonQuizPack,
} from '../src/data/curriculumLessonQuizzes';
import {
  getTotalEarnedQuizXp,
  submitLessonQuizAttempt,
} from '../src/utils/lessonQuizStore';
import { getKnowledgeLeaderboard } from '../src/utils/knowledgeLeaderboardService';
import { isModuleCompleted } from '../src/utils/curriculumProgress';
import { DisciplineCurriculumView } from '../src/components/academy/DisciplineCurriculumView';
import { CurriculumQuizEngine } from '../src/components/academy/CurriculumQuizEngine';
import { NdeEdCourseCatalog } from '../src/components/academy/NdeEdCourseCatalog';
import { KnowledgeLeaderboard } from '../src/components/academy/KnowledgeLeaderboard';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/-Project-/#academy',
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
});

const { render, fireEvent, cleanup } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
});

test('Every accredited curriculum module across all 8 disciplines and every NDE-Ed lesson has a multi-question quiz pack', () => {
  const curriculumPacks = getAllCurriculumQuizPacks();
  assert.equal(ENGINEERING_DISCIPLINES.length, 8);
  assert.ok(curriculumPacks.length >= 26, `Expected >=26 module quiz packs, got ${curriculumPacks.length}`);

  for (const pack of curriculumPacks) {
    assert.ok(pack.questions.length >= 3, `Pack ${pack.packId} should have >=3 questions`);
    for (const q of pack.questions) {
      assert.ok(q.question.ar.length > 10 && q.question.en.length > 10);
      assert.ok(q.options.length >= 4);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length);
      assert.ok(q.explanation.ar.length > 10 && q.explanation.en.length > 10);
    }
  }

  let ndeLessonCount = 0;
  for (const course of NDE_ED_COURSES) {
    for (const lesson of course.lessons) {
      const ndePack = getNdeEdLessonQuizPack(course, lesson);
      assert.equal(ndePack.questions.length, 4);
      ndeLessonCount += 1;
    }
  }
  assert.equal(ndeLessonCount, 35);
});

test('submitLessonQuizAttempt awards XP, prevents duplicate retake farming, awards improvement deltas, and climbs Leaderboard', () => {
  const initialBoard = getKnowledgeLeaderboard({ timeframe: 'all_time', sortMetric: 'xp' });
  const initialXp = initialBoard.currentUser.xp;

  const pack = getModuleQuizPack('mod_weld_1', 'welding_inspection');
  assert.equal(isModuleCompleted('mod_weld_1'), false);

  // 1st attempt: 1 out of 3 correct (33% -> fail)
  const partialAnswers: Record<string, number> = {};
  pack.questions.forEach((q, idx) => {
    partialAnswers[q.id] = idx === 0 ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
  });

  const firstAttempt = submitLessonQuizAttempt(pack, partialAnswers);
  assert.equal(firstAttempt.correctCount, 1);
  assert.equal(firstAttempt.passed, false);
  assert.equal(firstAttempt.xpEarnedNow, 25);
  assert.equal(isModuleCompleted('mod_weld_1'), false);

  // 2nd attempt with identical 1/3 score -> 0 additional XP (anti-farming)
  const repeatSame = submitLessonQuizAttempt(pack, partialAnswers);
  assert.equal(repeatSame.xpEarnedNow, 0);
  assert.equal(getTotalEarnedQuizXp(), 25);

  // 3rd attempt: 3 out of 3 correct (100% -> pass + mastery bonus = 3*25 + 40 + 35 = 150 XP -> delta +125 XP)
  const perfectAnswers: Record<string, number> = {};
  pack.questions.forEach((q) => {
    perfectAnswers[q.id] = q.correctIndex;
  });

  const improvedAttempt = submitLessonQuizAttempt(pack, perfectAnswers);
  assert.equal(improvedAttempt.scorePct, 100);
  assert.equal(improvedAttempt.passed, true);
  assert.equal(improvedAttempt.xpEarnedNow, 125);
  assert.equal(getTotalEarnedQuizXp(), 150);
  assert.equal(isModuleCompleted('mod_weld_1'), true);
  assert.ok(improvedAttempt.newTotalXp > initialXp);

  // Pass 6 more discipline modules (total 7 passed -> >1940 XP, surpassing #8 at 1840 XP) and verify Leaderboard XP & Rank advance
  for (const modId of [
    'mod_pwht_1',
    'mod_api_1',
    'mod_coat_1',
    'mod_adv_ut',
    'mod_qaqc_1',
    'mod_integrity_1',
  ]) {
    const p = getModuleQuizPack(modId);
    const ans: Record<string, number> = {};
    p.questions.forEach((q) => {
      ans[q.id] = q.correctIndex;
    });
    submitLessonQuizAttempt(p, ans);
  }

  const finalBoard = getKnowledgeLeaderboard({ timeframe: 'all_time', sortMetric: 'xp' });
  assert.ok(finalBoard.currentUser.xp > initialXp + 1000);
  assert.ok(finalBoard.currentUserRank < initialBoard.currentUserRank);
});

test('DisciplineCurriculumView (Arabic RTL) lets trainee complete post-lesson quiz with instant results and XP leaderboard navigation', () => {
  let leaderboardOpened = false;
  const ui = render(
    <DisciplineCurriculumView
      language="ar"
      targetDisciplineId="api_inspection"
      onOpenLeaderboard={() => {
        leaderboardOpened = true;
      }}
    />
  );

  assert.equal(ui.container.firstElementChild?.getAttribute('dir'), 'rtl');

  // Open post-lesson quiz for first API module (mod_api_1)
  const openQuizButtons = ui.getAllByText(/اختبر معلوماتك بعد الدرس \(\+XP\)/i);
  assert.ok(openQuizButtons.length >= 2);
  fireEvent.click(openQuizButtons[0]);

  const pack = getModuleQuizPack('mod_api_1', 'api_inspection');

  // Answer Q1 correctly and click instant answer check
  fireEvent.click(ui.getByTestId(`quiz-option-${pack.questions[0].correctIndex}`));
  fireEvent.click(ui.getByText(/تحقق من الإجابة الفورية/));
  assert.ok(ui.getByText(/إجابة صحيحة \(\+25 XP\)/));

  // Answer remaining questions
  for (let i = 1; i < pack.questions.length; i++) {
    fireEvent.click(ui.getByText(/السؤال التالي/));
    const q = pack.questions[i];
    fireEvent.click(ui.getByTestId(`quiz-option-${q.correctIndex}`));
  }

  // Submit quiz & claim XP
  fireEvent.click(ui.getByText(/إنهاء الاختبار واحتساب XP/));

  // Instant final results & XP banner displayed
  assert.ok(ui.getByText(/اجتزت اختبار الدرس بنجاح/));
  assert.ok(ui.getAllByText(/\+150 XP/).length > 0);

  // Navigate to Leaderboard CTA
  const lbButtons = ui.getAllByText(/عرض لوحة المتصدرين \(XP\)/);
  fireEvent.click(lbButtons[0]);
  assert.equal(leaderboardOpened, true);
});

test('NdeEdCourseCatalog embeds interactive Post-Lesson Quiz (+XP) inside LessonPlayer and updates KnowledgeLeaderboard', () => {
  const targetCourse = NDE_ED_COURSES[4]; // Ultrasonic Testing course
  const firstLesson = targetCourse.lessons[0];
  const courseUi = render(<NdeEdCourseCatalog language="en" initialCourseId={targetCourse.id} />);

  // Open first lesson of UT course
  fireEvent.click(courseUi.getByText(firstLesson.title.en));

  // Expand post-lesson interactive quiz
  fireEvent.click(courseUi.getByText(/Start Interactive Lesson Quiz \(\+XP\)/i));

  const pack = getNdeEdLessonQuizPack(targetCourse, firstLesson);

  for (let i = 0; i < pack.questions.length; i++) {
    if (i > 0) {
      fireEvent.click(courseUi.getByText(/Next Question/i));
    }
    fireEvent.click(courseUi.getByTestId(`quiz-option-${pack.questions[i].correctIndex}`));
  }

  fireEvent.click(courseUi.getByText(/Submit Quiz & Claim XP/i));
  assert.ok(courseUi.getByText(/Lesson Quiz Passed/i));
  assert.ok(courseUi.getAllByText(/\+175 XP/).length >= 2);

  cleanup();

  // Render CurriculumQuizEngine & KnowledgeLeaderboard to confirm live synced XP & recent activity
  const engineUi = render(<CurriculumQuizEngine language="en" />);
  assert.ok(engineUi.getByText(/\+175 XP from lesson quizzes/i));
  cleanup();

  const boardAfter = getKnowledgeLeaderboard({ timeframe: 'all_time', sortMetric: 'xp' });
  assert.match(boardAfter.currentUser.recentActivity.actionEn, /Sound generation/i);

  const lbUi = render(<KnowledgeLeaderboard language="en" />);
  assert.ok(lbUi.getAllByText(new RegExp(boardAfter.currentUser.xp.toLocaleString())).length > 0);
  assert.ok(lbUi.getAllByText(/100% Code Mastery|Curriculum Quiz Qualifier/i).length > 0);
});
