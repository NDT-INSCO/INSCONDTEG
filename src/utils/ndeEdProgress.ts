import { NDE_ED_COURSES, NDE_ED_LESSONS } from '../data/ndeEd';

export const NDE_ED_PROGRESS_KEY = 'insco_nde_ed_progress_v1';

export interface NdeEdQuizRecord {
  selected: number;
  correct: boolean;
  answeredAt: string;
}

export interface NdeEdFinalScore {
  score: number;
  total: number;
  answeredAt: string;
}

export interface NdeEdProgressState {
  completedLessons: string[];
  quizAnswers: Record<string, NdeEdQuizRecord>;
  exercisesRevealed: string[];
  finalScores: Record<string, NdeEdFinalScore>;
  updatedAt: string;
}

const EMPTY: NdeEdProgressState = {
  completedLessons: [],
  quizAnswers: {},
  exercisesRevealed: [],
  finalScores: {},
  updatedAt: '',
};

const validLessonIds = new Set(NDE_ED_LESSONS.map(lesson => lesson.id));
const validCourseIds = new Set(NDE_ED_COURSES.map(course => course.id));

export function readNdeEdProgress(): NdeEdProgressState {
  try {
    const raw = localStorage.getItem(NDE_ED_PROGRESS_KEY);
    if (!raw) return { ...EMPTY };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...EMPTY };
    const data = parsed as Partial<NdeEdProgressState>;
    const quizAnswers: Record<string, NdeEdQuizRecord> = {};
    if (data.quizAnswers && typeof data.quizAnswers === 'object' && !Array.isArray(data.quizAnswers)) {
      Object.entries(data.quizAnswers).forEach(([id, value]) => {
        if (!validLessonIds.has(id) || !value || typeof value !== 'object') return;
        const item = value as Partial<NdeEdQuizRecord>;
        if (typeof item.selected !== 'number' || typeof item.correct !== 'boolean') return;
        quizAnswers[id] = {
          selected: item.selected,
          correct: item.correct,
          answeredAt: typeof item.answeredAt === 'string' ? item.answeredAt : '',
        };
      });
    }
    const finalScores: Record<string, NdeEdFinalScore> = {};
    if (data.finalScores && typeof data.finalScores === 'object' && !Array.isArray(data.finalScores)) {
      Object.entries(data.finalScores).forEach(([id, value]) => {
        if (!validCourseIds.has(id) || !value || typeof value !== 'object') return;
        const item = value as Partial<NdeEdFinalScore>;
        if (typeof item.score !== 'number' || typeof item.total !== 'number' || item.total <= 0) return;
        finalScores[id] = {
          score: Math.max(0, Math.min(item.score, item.total)),
          total: item.total,
          answeredAt: typeof item.answeredAt === 'string' ? item.answeredAt : '',
        };
      });
    }
    const completedLessons = Array.isArray(data.completedLessons)
      ? [...new Set(data.completedLessons.filter((id): id is string => typeof id === 'string' && validLessonIds.has(id)))]
      : [];
    const exercisesRevealed = Array.isArray(data.exercisesRevealed)
      ? [...new Set(data.exercisesRevealed.filter((id): id is string => typeof id === 'string' && validLessonIds.has(id)))]
      : [];
    return {
      completedLessons,
      quizAnswers,
      exercisesRevealed,
      finalScores,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(state: NdeEdProgressState): NdeEdProgressState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(NDE_ED_PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable; the current session still keeps state in React.
  }
  return next;
}

export function toggleLessonComplete(lessonId: string): NdeEdProgressState {
  if (!validLessonIds.has(lessonId)) return readNdeEdProgress();
  const state = readNdeEdProgress();
  const completedLessons = state.completedLessons.includes(lessonId)
    ? state.completedLessons.filter(id => id !== lessonId)
    : [...state.completedLessons, lessonId];
  return write({ ...state, completedLessons });
}

export function recordNdeEdQuiz(lessonId: string, selected: number, correct: boolean): NdeEdProgressState {
  if (!validLessonIds.has(lessonId)) return readNdeEdProgress();
  const state = readNdeEdProgress();
  return write({
    ...state,
    quizAnswers: {
      ...state.quizAnswers,
      [lessonId]: { selected, correct, answeredAt: new Date().toISOString() },
    },
  });
}

export function markExerciseRevealed(lessonId: string): NdeEdProgressState {
  if (!validLessonIds.has(lessonId)) return readNdeEdProgress();
  const state = readNdeEdProgress();
  if (state.exercisesRevealed.includes(lessonId)) return state;
  return write({ ...state, exercisesRevealed: [...state.exercisesRevealed, lessonId] });
}

export function recordFinalScore(courseId: string, score: number, total: number): NdeEdProgressState {
  if (!validCourseIds.has(courseId) || total <= 0) return readNdeEdProgress();
  const state = readNdeEdProgress();
  return write({
    ...state,
    finalScores: {
      ...state.finalScores,
      [courseId]: { score, total, answeredAt: new Date().toISOString() },
    },
  });
}

export function getCourseProgress(courseId: string, state = readNdeEdProgress()) {
  const course = NDE_ED_COURSES.find(item => item.id === courseId);
  const lessonIds = course?.lessons.map(lesson => lesson.id) || [];
  const completed = lessonIds.filter(id => state.completedLessons.includes(id)).length;
  const total = lessonIds.length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
    finalScore: state.finalScores[courseId],
  };
}

export function resetNdeEdProgress(): NdeEdProgressState {
  try {
    localStorage.removeItem(NDE_ED_PROGRESS_KEY);
  } catch {
    // ignore
  }
  return { ...EMPTY };
}

export function overallNdeEdProgress(state = readNdeEdProgress()) {
  const total = NDE_ED_LESSONS.length;
  const completed = state.completedLessons.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}
