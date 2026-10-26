import React from 'react';
import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';

import { NDE_ED_COURSES } from '../src/data/ndeEd';
import { PRACTICAL_TASKS } from '../src/data/practicalAssessment';
import { LEARNING_PATHS, getLearningPath, pathLessonIds, pathStats, validatePath } from '../src/data/learningPaths';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  get length() { return this.store.size; }
}

const storage = new MemoryStorage();
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy', pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { LearningPathsView } = await import('../src/components/academy/LearningPathsView');
const { NDE_ED_PROGRESS_KEY } = await import('../src/utils/ndeEdProgress');
const { render, fireEvent, cleanup } = await import('@testing-library/react');

beforeEach(() => storage.clear());
afterEach(() => cleanup());

test('every learning path points only at content that exists', () => {
  assert.ok(LEARNING_PATHS.length >= 3);
  for (const path of LEARNING_PATHS) {
    assert.deepEqual(validatePath(path), [], path.id);
    assert.ok(path.steps.length >= 3);
    assert.ok(path.steps.some(step => step.kind === 'course'), `${path.id} should include at least one course`);
    assert.ok(path.limits.ar.trim() && path.limits.en.trim(), `${path.id} needs an explicit limits statement`);
  }
});

test('path course steps resolve to real courses and practical steps to real tasks', () => {
  for (const path of LEARNING_PATHS) {
    for (const step of path.steps) {
      if (step.kind === 'course') {
        assert.ok(NDE_ED_COURSES.some(course => course.id === step.courseId), `${path.id}/${step.id}`);
      }
      if (step.kind === 'practical') {
        assert.ok(PRACTICAL_TASKS.some(task => task.id === step.practicalTaskId), `${path.id}/${step.id}`);
      }
    }
  }
});

test('pathStats counts what the UI claims', () => {
  const path = LEARNING_PATHS[0];
  const stats = pathStats(path);
  assert.equal(stats.steps, path.steps.length);
  assert.equal(stats.courses, path.steps.filter(step => step.kind === 'course').length);
  assert.equal(stats.practical, path.steps.filter(step => step.kind === 'practical').length);
  assert.ok(stats.minutes > 0);
});

test('pathLessonIds is ordered, deduplicated and limited to real lessons', () => {
  const path = LEARNING_PATHS[0];
  const ids = pathLessonIds(path);
  assert.ok(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length);
  const firstCourse = NDE_ED_COURSES.find(course => course.id === path.steps.find(step => step.kind === 'course')?.courseId);
  assert.equal(ids[0], firstCourse?.lessons[0].id, 'the first lesson of the first course should lead');
});

test('unknown path ids resolve to nothing', () => {
  assert.equal(getLearningPath('nope'), undefined);
});

test('the view lists all paths and opens one with its steps', () => {
  const ui = render(<LearningPathsView language="en" />);
  for (const path of LEARNING_PATHS) {
    assert.ok(ui.getAllByText(path.title.en).length >= 1, `${path.id} missing`);
  }
  fireEvent.click(ui.getAllByText('View path')[0]);
  assert.ok(ui.getByText(/Path limits:/i));
  const first = LEARNING_PATHS[0];
  for (const step of first.steps) {
    assert.ok((ui.container.textContent || '').includes(step.title.en), `${step.id} not rendered`);
  }
});

test('completing every course lesson marks those path steps as done', () => {
  const path = LEARNING_PATHS[0];
  const courseIds = path.steps.filter(step => step.kind === 'course').map(step => step.courseId!);
  const completedLessons = courseIds.flatMap(id => NDE_ED_COURSES.find(course => course.id === id)!.lessons.map(lesson => lesson.id));
  storage.setItem(NDE_ED_PROGRESS_KEY, JSON.stringify({
    completedLessons,
    quizAnswers: {},
    exercisesRevealed: [],
    finalScores: {},
    updatedAt: new Date().toISOString(),
  }));

  const ui = render(<LearningPathsView language="en" initialPathId={path.id} />);
  const text = ui.container.textContent || '';
  assert.match(text, new RegExp(`${completedLessons.length}/${completedLessons.length} lessons`));
});

test('Arabic mode renders the paths without English fallbacks', () => {
  const ui = render(<LearningPathsView language="ar" />);
  assert.ok(ui.getAllByText(LEARNING_PATHS[0].title.ar).length >= 1);
  fireEvent.click(ui.getAllByText('عرض المسار')[0]);
  assert.ok(ui.getByText(/حدود المسار:/));
});
