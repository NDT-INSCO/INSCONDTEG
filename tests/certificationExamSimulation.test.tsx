import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  buildExamQuestionPool,
  generateRandomizedCertificationExam,
  evaluateExamSubmission,
  getCurriculumSourceModules,
  EXAM_DIFFICULTY_TIERS
} from '../src/utils/curriculumExamGenerator';
import { CertificationExamSimulation } from '../src/components/academy/CertificationExamSimulation';
import { CertificationCenter } from '../src/components/academy/CertificationCenter';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event
});

const { render, fireEvent, cleanup, screen } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
});

test('curriculumExamGenerator retrieves curriculum source modules and builds question pools', () => {
  const modules = getCurriculumSourceModules();
  assert.ok(modules.length >= 5, 'Should have multiple curriculum source modules');
  assert.ok(modules.some(m => m.id === 'mod_c_ut'), 'Should include conventional UT Level 1 module');
  assert.ok(modules.some(m => m.id === 'mod_c2_1'), 'Should include conventional Level 2 flaw sizing module');

  // Level 1 pool
  const l1Pool = buildExamQuestionPool('level1', 'all');
  assert.ok(l1Pool.length >= 8, 'Level 1 pool should contain questions');
  assert.ok(l1Pool.every(q => q.level === 'level1'));

  // Level 2 pool
  const l2Pool = buildExamQuestionPool('level2', 'all');
  assert.ok(l2Pool.length >= 6, 'Level 2 pool should contain questions');
  assert.ok(l2Pool.every(q => q.level === 'level2'));

  // Method specific pool
  const utPool = buildExamQuestionPool('both', 'UT');
  assert.ok(utPool.length >= 4, 'UT pool should contain questions');
  assert.ok(utPool.every(q => q.method === 'UT' || q.method === 'General'));
});

test('generateRandomizedCertificationExam configures countdown timer by difficulty level accurately', () => {
  // 1. Training (120s/Q)
  const trainingExam = generateRandomizedCertificationExam({
    level: 'both',
    method: 'all',
    difficulty: 'training',
    questionCount: 10,
    mode: 'timed'
  });
  assert.equal(trainingExam.difficulty, 'training');
  assert.equal(trainingExam.secondsPerQuestion, 120);
  assert.equal(trainingExam.timeLimitSeconds, 10 * 120); // 1200 seconds / 20 mins

  // 2. Standard ASNT (90s/Q)
  const standardExam = generateRandomizedCertificationExam({
    level: 'both',
    method: 'all',
    difficulty: 'standard',
    questionCount: 10,
    mode: 'timed'
  });
  assert.equal(standardExam.difficulty, 'standard');
  assert.equal(standardExam.secondsPerQuestion, 90);
  assert.equal(standardExam.timeLimitSeconds, 10 * 90); // 900 seconds / 15 mins

  // 3. Strict Proctored (60s/Q)
  const proctoredExam = generateRandomizedCertificationExam({
    level: 'both',
    method: 'all',
    difficulty: 'strict_proctored',
    questionCount: 20,
    mode: 'timed'
  });
  assert.equal(proctoredExam.difficulty, 'strict_proctored');
  assert.equal(proctoredExam.secondsPerQuestion, 60);
  assert.equal(proctoredExam.timeLimitSeconds, 20 * 60); // 1200 seconds / 20 mins

  // 4. Speed Challenge (45s/Q)
  const speedExam = generateRandomizedCertificationExam({
    level: 'both',
    method: 'all',
    difficulty: 'speed_challenge',
    questionCount: 10,
    mode: 'timed'
  });
  assert.equal(speedExam.difficulty, 'speed_challenge');
  assert.equal(speedExam.secondsPerQuestion, 45);
  assert.equal(speedExam.timeLimitSeconds, 10 * 45); // 450 seconds / 7.5 mins

  // 5. Custom pace override (e.g. 75s/Q)
  const customExam = generateRandomizedCertificationExam({
    level: 'both',
    method: 'all',
    questionCount: 10,
    mode: 'timed',
    customSecondsPerQuestion: 75
  });
  assert.equal(customExam.secondsPerQuestion, 75);
  assert.equal(customExam.timeLimitSeconds, 750);
});

test('evaluateExamSubmission accurately tallies scores, pacing analytics and curriculum recommendations', () => {
  const exam = generateRandomizedCertificationExam({
    level: 'level1',
    method: 'all',
    difficulty: 'standard',
    questionCount: 10,
    mode: 'timed'
  });

  // Candidate answers 8 correctly and 2 incorrectly in 450 seconds (out of 900s)
  const userAnswers: Record<number, number> = {};
  exam.questions.forEach((q, idx) => {
    if (idx < 8) {
      userAnswers[idx] = q.correctIndex; // Correct
    } else {
      userAnswers[idx] = (q.correctIndex + 1) % 4; // Incorrect
    }
  });

  const evaluation = evaluateExamSubmission(exam, userAnswers, 450, [0, 9]);
  assert.equal(evaluation.totalQuestions, 10);
  assert.equal(evaluation.correctCount, 8);
  assert.equal(evaluation.incorrectCount, 2);
  assert.equal(evaluation.scorePct, 80);
  assert.equal(evaluation.isPassed, true); // Threshold is 70% for Level 1
  assert.equal(evaluation.timeSpentSeconds, 450);
  assert.equal(evaluation.allocatedTimeSeconds, 900);
  assert.equal(evaluation.averageSecondsPerQuestion, 45);
  assert.ok(evaluation.pacingEvaluation.grade.length > 0);
  assert.ok(evaluation.recommendedModules.length > 0, 'Should recommend missed modules for review');
});

test('CertificationExamSimulation allows selecting difficulty levels and displays live countdown timer', () => {
  const ui = render(<CertificationExamSimulation language="en" />);

  // Heading and setup controls
  assert.ok(ui.getByText(/NDT Level 1 & Level 2 Certification Exam Simulation/i));
  assert.ok(ui.getByTestId('difficulty-tier-training'));
  assert.ok(ui.getByTestId('difficulty-tier-standard'));
  assert.ok(ui.getByTestId('difficulty-tier-strict_proctored'));
  assert.ok(ui.getByTestId('difficulty-tier-speed_challenge'));

  // Switch to strict proctored difficulty
  fireEvent.click(ui.getByTestId('difficulty-tier-strict_proctored'));
  assert.ok(ui.getByTestId('calculated-exam-duration'));

  // Click start exam
  const generateBtn = ui.getByTestId('generate-exam-btn');
  fireEvent.click(generateBtn);

  // Active exam state with live countdown timer
  const timer = ui.getByTestId('exam-timer');
  assert.ok(timer);
  assert.equal(timer.textContent, '10:00'); // 10 questions * 60s = 600s = 10:00

  // Pause is locked in strict proctored mode to enforce real-world testing conditions
  assert.ok(ui.getByTestId('pause-disabled-badge'));

  // Pacing coach indicator is rendered
  assert.ok(ui.getByTestId('pacing-coach-indicator'));

  // Select an option and submit
  fireEvent.click(ui.getByTestId('option-choice-0'));
  fireEvent.click(ui.getByTestId('submit-exam-btn'));
  fireEvent.click(ui.getByRole('button', { name: /Confirm & Submit/i }));

  // Scorecard with pacing analytics appears
  assert.ok(ui.getByTestId('exam-scorecard-hero'));
  assert.ok(ui.getByTestId('exam-elapsed-time'));
  assert.ok(ui.getByTestId('pacing-evaluation-card'));
  assert.ok(ui.getByTestId('pacing-grade-label'));
});

test('CertificationExamSimulation in Training mode supports Pause and Resume feature', () => {
  const ui = render(<CertificationExamSimulation language="en" />);

  // Select training tier (allows pause)
  fireEvent.click(ui.getByTestId('difficulty-tier-training'));
  fireEvent.click(ui.getByTestId('generate-exam-btn'));

  // Timer shows 20:00 (10 questions * 120s = 1200s = 20:00)
  const timer = ui.getByTestId('exam-timer');
  assert.equal(timer.textContent, '20:00');

  // Pause button exists
  const pauseBtn = ui.getByTestId('pause-exam-btn');
  assert.ok(pauseBtn);

  // Click Pause
  fireEvent.click(pauseBtn);
  assert.ok(ui.getByText(/Examination Paused/i));

  // Click Resume
  const resumeBtn = ui.getByTestId('resume-exam-btn');
  assert.ok(resumeBtn);
  fireEvent.click(resumeBtn);

  // Exam resumes
  assert.ok(ui.getByTestId('question-progress'));
});

test('CertificationExamSimulation component renders correctly in Arabic layout', () => {
  const ui = render(<CertificationExamSimulation language="ar" />);

  assert.ok(ui.getByText(/محاكي امتحانات التأهيل لشهادات NDT المستوى الأول والثاني/i));
  assert.ok(ui.getByText(/درجة صعوبة وتوقيت الاختبار التنازلي/i));
  assert.ok(ui.getByTestId('difficulty-tier-standard'));
  assert.ok(ui.getByTestId('generate-exam-btn'));
});

test('CertificationExamSimulation in Study Mode provides immediate feedback and code references', () => {
  const ui = render(<CertificationExamSimulation language="en" />);

  // Change mode to study
  const modeSelect = ui.getByTestId('select-exam-mode');
  fireEvent.change(modeSelect, { target: { value: 'study' } });

  // Start exam
  fireEvent.click(ui.getByTestId('generate-exam-btn'));

  // Select option choice 0
  fireEvent.click(ui.getByTestId('option-choice-0'));

  // Immediate code explanation is displayed
  assert.ok(ui.getByText(/Code Explanation & Reference:/i));
});

test('CertificationCenter integrates the Certification Exam Simulation tab seamlessly', () => {
  const ui = render(<CertificationCenter language="en" initialTab="exam_simulation" />);

  // Tab button presence
  assert.ok(ui.getByTestId('tab-exam-simulation'));

  // CertificationExamSimulation rendered within CertificationCenter
  assert.ok(ui.getByTestId('certification-exam-simulation-container'));
  assert.ok(ui.getByText(/NDT Level 1 & Level 2 Certification Exam Simulation/i));
});

test('CertificationExamSimulation integrates D3.js chart with timeline, radar mode, and method toggles', () => {
  const ui = render(<CertificationExamSimulation language="en" />);

  // D3 chart container is rendered in Stage 1
  assert.ok(ui.getByTestId('certification-exam-d3-trend-chart'));
  assert.ok(ui.getByText(/Longitudinal NDT Performance & Progress Analytics/i));

  // KPI indicators
  assert.ok(ui.getByTestId('kpi-total-attempts'));
  assert.ok(ui.getByTestId('kpi-latest-score'));
  assert.ok(ui.getByTestId('kpi-avg-score'));
  assert.ok(ui.getByTestId('kpi-best-method'));
  assert.ok(ui.getByTestId('kpi-most-improved'));

  // Stage 1 tab switching between Configurator and dedicated Analytics view
  const analyticsTabBtn = ui.getByTestId('stage1-tab-analytics');
  assert.ok(analyticsTabBtn);
  fireEvent.click(analyticsTabBtn);
  assert.ok(ui.getByTestId('certification-exam-d3-trend-chart'));

  // Switch back to configurator
  fireEvent.click(ui.getByTestId('stage1-tab-config'));
  assert.ok(ui.getByTestId('difficulty-tier-standard'));

  // Test D3 chart mode toggle: Timeline vs Competency Radar
  const radarBtn = ui.getByTestId('chart-mode-radar');
  assert.ok(radarBtn);
  fireEvent.click(radarBtn);

  // In radar mode, timeline method filter pills are hidden
  assert.equal(ui.queryByTestId('toggle-method-UT'), null);

  // Switch back to timeline mode
  const timelineBtn = ui.getByTestId('chart-mode-timeline');
  assert.ok(timelineBtn);
  fireEvent.click(timelineBtn);

  // In timeline mode, method filter toggle pills exist and can be clicked
  const utToggle = ui.getByTestId('toggle-method-UT');
  assert.ok(utToggle);
  fireEvent.click(utToggle); // toggles UT off/on

  const rtToggle = ui.getByTestId('toggle-method-RT');
  assert.ok(rtToggle);
  fireEvent.click(rtToggle);
});

test('Submitting an exam saves attempt and updates longitudinal D3 trend history', () => {
  const ui = render(<CertificationExamSimulation language="en" />);

  const initialSessionsText = ui.getByTestId('kpi-total-attempts').textContent;
  const initialSessions = Number(initialSessionsText);

  // Start exam
  fireEvent.click(ui.getByTestId('generate-exam-btn'));

  // Answer first question
  fireEvent.click(ui.getByTestId('option-choice-0'));

  // Submit exam
  fireEvent.click(ui.getByTestId('submit-exam-btn'));
  fireEvent.click(ui.getByRole('button', { name: /Confirm & Submit/i }));

  // Scorecard is shown and contains the D3 chart
  assert.ok(ui.getByTestId('exam-scorecard-hero'));
  const scoreCardChart = ui.getByTestId('certification-exam-d3-trend-chart');
  assert.ok(scoreCardChart);

  // Total sessions should now have incremented by 1
  const updatedSessions = Number(ui.getByTestId('kpi-total-attempts').textContent);
  assert.equal(updatedSessions, initialSessions + 1);
});

