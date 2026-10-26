import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  USER_COURSE_PROGRESS_STORAGE_KEY,
  addProgressUser,
  getAllNdtCourseModules,
  getUserProgressSummary,
  readUserCourseProgress,
  resetUserModuleProgress,
  setActiveProgressUser,
  toggleUserModuleCompleted,
} from '../src/utils/userCourseProgressStore';
import { getModuleQuizPack } from '../src/data/curriculumLessonQuizzes';
import { submitLessonQuizAttempt } from '../src/utils/lessonQuizStore';
import { UserCourseProgressDashboard } from '../src/components/academy/UserCourseProgressDashboard';
import { EducationalAcademy } from '../src/components/EducationalAcademy';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/-Project-/#curriculum',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

dom.window.scrollTo = () => {};

const { render, fireEvent, cleanup, act } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
});

test('userCourseProgressStore persists per-user NDT course module completions in localStorage and isolates users', () => {
  const allModules = getAllNdtCourseModules();
  assert.equal(allModules.length, 26);

  const initial = readUserCourseProgress();
  assert.equal(initial.activeUserId, 'current_student_user');
  assert.ok(initial.users.length >= 4);

  // Mark 3 NDT modules complete for current_student_user
  toggleUserModuleCompleted('mod_c_vt');
  toggleUserModuleCompleted('mod_c_ut');
  toggleUserModuleCompleted('mod_adv_ut');

  const rawSaved = dom.window.localStorage.getItem(USER_COURSE_PROGRESS_STORAGE_KEY);
  assert.ok(rawSaved, 'Expected progress JSON saved in localStorage');

  const afterActiveMark = readUserCourseProgress();
  const activeProfile = afterActiveMark.users.find((u) => u.id === 'current_student_user')!;
  assert.deepEqual(activeProfile.completedModuleIds, ['mod_c_vt', 'mod_c_ut', 'mod_adv_ut']);

  const summary = getUserProgressSummary(activeProfile);
  assert.equal(summary.completedCount, 3);
  assert.equal(summary.totalCount, 26);
  assert.equal(summary.percent, Math.round((3 / 26) * 100));

  // Add a second custom trainee and switch to them
  const withNewUser = addProgressUser({
    name: 'Eng. Nadia Al-Mutairi',
    role: 'UT Level II Inspector',
    primaryDisciplineId: 'conventional_ndt',
    makeActive: true,
  });

  const nadia = withNewUser.users[0];
  assert.equal(withNewUser.activeUserId, nadia.id);
  assert.equal(nadia.completedModuleIds.length, 0);

  // Mark 1 module complete for Nadia
  toggleUserModuleCompleted('mod_c_rt');

  const verifyBoth = readUserCourseProgress();
  const nadiaAfter = verifyBoth.users.find((u) => u.id === nadia.id)!;
  const firstUserAfter = verifyBoth.users.find((u) => u.id === 'current_student_user')!;

  assert.deepEqual(nadiaAfter.completedModuleIds, ['mod_c_rt']);
  assert.deepEqual(firstUserAfter.completedModuleIds, ['mod_c_vt', 'mod_c_ut', 'mod_adv_ut']);

  // Switching back to current_student_user restores legacy map for curriculum compatibility
  setActiveProgressUser('current_student_user');
  const legacyMap = JSON.parse(
    dom.window.localStorage.getItem('insco_academy_completed_modules') || '{}'
  );
  assert.equal(legacyMap.mod_c_vt, true);
  assert.equal(legacyMap.mod_c_ut, true);
  assert.equal(legacyMap.mod_c_rt, undefined);

  // Resetting current_student_user clears only their completed modules
  resetUserModuleProgress('current_student_user');
  const postReset = readUserCourseProgress();
  assert.equal(
    postReset.users.find((u) => u.id === 'current_student_user')!.completedModuleIds.length,
    0
  );
  assert.equal(
    postReset.users.find((u) => u.id === nadia.id)!.completedModuleIds.length,
    1
  );
});

test('Academy dashboard displays a progress bar for each user, persists module completion toggles, and survives remount', () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="curriculum" />);

  const dashboard = ui.getByTestId('academy-user-progress-dashboard');
  assert.ok(dashboard);

  const stateBefore = readUserCourseProgress();
  for (const user of stateBefore.users) {
    const bar = ui.getByTestId(`user-progress-bar-${user.id}`);
    const expectedSummary = getUserProgressSummary(user);
    assert.equal(bar.getAttribute('role'), 'progressbar');
    assert.equal(bar.getAttribute('aria-valuenow'), String(expectedSummary.percent));
  }

  // Toggle an NDT course module directly inside DisciplineCurriculumView
  const firstModId = 'mod_c_acad_1';
  const toggleBtn = ui.getByTestId(`toggle-module-complete-${firstModId}`);
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');

  fireEvent.click(toggleBtn);
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'true');

  // Active user's progress bar in the Academy dashboard updates immediately
  const expectedPctOne = Math.round((1 / 26) * 100);
  assert.equal(
    ui.getByTestId('user-progress-bar-current_student_user').getAttribute('aria-valuenow'),
    String(expectedPctOne)
  );
  assert.match(
    ui.getByTestId('user-progress-count-current_student_user').textContent || '',
    /1\/26/
  );

  // Remount Academy dashboard to verify localStorage persistence across reloads
  cleanup();
  const reloaded = render(<EducationalAcademy language="en" initialSubTab="curriculum" />);
  assert.equal(
    reloaded.getByTestId('user-progress-bar-current_student_user').getAttribute('aria-valuenow'),
    String(expectedPctOne)
  );
  assert.equal(
    reloaded.getByTestId(`toggle-module-complete-${firstModId}`).getAttribute('aria-pressed'),
    'true'
  );
});

test('UserCourseProgressDashboard supports adding a user in Arabic RTL, toggling modules from drawer, and syncing quiz completions', () => {
  const ui = render(<UserCourseProgressDashboard language="ar" />);
  assert.equal(ui.getByTestId('academy-user-progress-dashboard').getAttribute('dir'), 'rtl');

  // Add a new user via inline form
  fireEvent.click(ui.getByTestId('toggle-add-user-form'));
  const nameInput = ui.getByLabelText(/اسم المتدرب/);
  fireEvent.change(nameInput, { target: { value: 'م. ياسر الحربي' } });
  fireEvent.click(ui.getByTestId('submit-new-user-btn'));

  const afterAdd = readUserCourseProgress();
  const yasser = afterAdd.users.find((u) => u.nameAr === 'م. ياسر الحربي');
  assert.ok(yasser, 'New Arabic trainee should be saved in localStorage');
  assert.equal(afterAdd.activeUserId, yasser.id);

  // Verify Yasser has his own progress bar starting at 0%
  assert.equal(
    ui.getByTestId(`user-progress-bar-${yasser.id}`).getAttribute('aria-valuenow'),
    '0'
  );

  // Expand Yasser's module checklist drawer and toggle two NDT modules
  fireEvent.click(ui.getByTestId(`manage-user-modules-${yasser.id}`));
  fireEvent.click(ui.getByTestId(`drawer-toggle-${yasser.id}-mod_c_ut`));
  fireEvent.click(ui.getByTestId(`drawer-toggle-${yasser.id}-mod_c_mt`));

  // Pass a curriculum quiz (mod_weld_1) as active user Yasser -> auto-syncs into Yasser's progress bar
  const weldPack = getModuleQuizPack('mod_weld_1', 'welding_inspection');
  const answers: Record<string, number> = {};
  weldPack.questions.forEach((q) => {
    answers[q.id] = q.correctIndex;
  });
  act(() => {
    submitLessonQuizAttempt(weldPack, answers);
  });

  const expectedThreePct = Math.round((3 / 26) * 100);
  assert.equal(
    ui.getByTestId(`user-progress-bar-${yasser.id}`).getAttribute('aria-valuenow'),
    String(expectedThreePct)
  );
  assert.match(ui.getByTestId(`user-progress-count-${yasser.id}`).textContent || '', /3\/26/);
});
