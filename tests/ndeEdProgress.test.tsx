import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

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
(globalThis as any).localStorage = storage;

const {
  NDE_ED_PROGRESS_KEY,
  readNdeEdProgress,
  toggleLessonComplete,
  recordNdeEdQuiz,
  markExerciseRevealed,
  recordFinalScore,
  getCourseProgress,
  overallNdeEdProgress,
  resetNdeEdProgress,
} = await import('../src/utils/ndeEdProgress');
const { NDE_ED_COURSES, NDE_ED_LESSONS } = await import('../src/data/ndeEd');

const lesson = NDE_ED_LESSONS[0];
const course = NDE_ED_COURSES[0];

beforeEach(() => storage.clear());

test('an empty store returns a clean state', () => {
  const state = readNdeEdProgress();
  assert.deepEqual(state.completedLessons, []);
  assert.deepEqual(state.quizAnswers, {});
  assert.deepEqual(state.finalScores, {});
});

test('unknown lesson and course ids are ignored, never persisted', () => {
  // The store is intentionally non-throwing: a stale URL or old bookmark must not
  // break the catalog. Invalid ids simply do not change state.
  assert.doesNotThrow(() => toggleLessonComplete('not-a-lesson'));
  assert.doesNotThrow(() => recordNdeEdQuiz('not-a-lesson', 0, true));
  assert.doesNotThrow(() => markExerciseRevealed('not-a-lesson'));
  assert.doesNotThrow(() => recordFinalScore('not-a-course', 1, 2));

  const state = readNdeEdProgress();
  assert.equal(state.completedLessons.length, 0);
  assert.deepEqual(state.quizAnswers, {});
  assert.deepEqual(state.exercisesRevealed, []);
  assert.deepEqual(state.finalScores, {});
});

test('a tampered payload is filtered on read', () => {
  storage.setItem(NDE_ED_PROGRESS_KEY, JSON.stringify({
    completedLessons: [lesson.id, 'evil-lesson', 42, null],
    exercisesRevealed: [lesson.id, 'evil-lesson'],
    quizAnswers: {
      [lesson.id]: { selected: 1, correct: true, answeredAt: '2026-01-01' },
      'evil-lesson': { selected: 0, correct: true },
    },
    finalScores: {
      [course.id]: { score: 99, total: 5 },
      'evil-course': { score: 5, total: 5 },
    },
    updatedAt: 123,
  }));
  const state = readNdeEdProgress();
  assert.deepEqual(state.completedLessons, [lesson.id]);
  assert.deepEqual(state.exercisesRevealed, [lesson.id]);
  assert.deepEqual(Object.keys(state.quizAnswers), [lesson.id]);
  assert.deepEqual(Object.keys(state.finalScores), [course.id]);
  // Scores are clamped to the reported total.
  assert.equal(state.finalScores[course.id].score, 5);
  assert.equal(state.finalScores[course.id].total, 5);
  assert.equal(state.updatedAt, '');
});

test('malformed JSON and non-object payloads fall back to an empty state', () => {
  storage.setItem(NDE_ED_PROGRESS_KEY, '{not json');
  assert.deepEqual(readNdeEdProgress().completedLessons, []);
  storage.setItem(NDE_ED_PROGRESS_KEY, '[]');
  assert.deepEqual(readNdeEdProgress().completedLessons, []);
  storage.setItem(NDE_ED_PROGRESS_KEY, 'null');
  assert.deepEqual(readNdeEdProgress().completedLessons, []);
});

test('toggling a lesson is idempotent and reversible', () => {
  toggleLessonComplete(lesson.id);
  assert.deepEqual(readNdeEdProgress().completedLessons, [lesson.id]);
  toggleLessonComplete(lesson.id);
  assert.deepEqual(readNdeEdProgress().completedLessons, []);
});

test('quiz answers, exercise reveals and final scores persist', () => {
  recordNdeEdQuiz(lesson.id, 2, true);
  markExerciseRevealed(lesson.id);
  recordFinalScore(course.id, 8, 10);

  const state = readNdeEdProgress();
  assert.equal(state.quizAnswers[lesson.id].selected, 2);
  assert.equal(state.quizAnswers[lesson.id].correct, true);
  assert.deepEqual(state.exercisesRevealed, [lesson.id]);
  assert.equal(state.finalScores[course.id].score, 8);
  assert.ok(state.updatedAt.length > 0);
});

test('course and overall progress count only real lessons in the course', () => {
  const lessonIds = course.lessons.map((item: { id: string }) => item.id);
  toggleLessonComplete(lessonIds[0]);
  const progress = getCourseProgress(course.id);
  assert.equal(progress.completed, 1);
  assert.equal(progress.total, course.lessons.length);
  assert.ok(progress.percent > 0 && progress.percent < 100);

  const overall = overallNdeEdProgress();
  assert.equal(overall.completed, 1);
  assert.equal(overall.total, NDE_ED_LESSONS.length);
});

test('reset clears every bucket', () => {
  toggleLessonComplete(lesson.id);
  recordFinalScore(course.id, 3, 3);
  resetNdeEdProgress();
  const state = readNdeEdProgress();
  assert.deepEqual(state.completedLessons, []);
  assert.deepEqual(state.finalScores, {});
});

test('a storage that throws does not crash the app', () => {
  const original = (globalThis as any).localStorage;
  (globalThis as any).localStorage = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
  };
  try {
    assert.doesNotThrow(() => readNdeEdProgress());
    assert.doesNotThrow(() => resetNdeEdProgress());
  } finally {
    (globalThis as any).localStorage = original;
  }
});
