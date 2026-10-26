import { useCallback, useEffect, useState } from 'react';
import { LessonQuizPack, LessonQuizSourceKind } from '../data/curriculumLessonQuizzes';
import { ENGINEERING_DISCIPLINES } from '../data/academyCurriculum';
import { markModuleCompleted } from './curriculumProgress';
import {
  getCurrentStudentProfile,
  getKnowledgeLeaderboard,
  StudentTier,
  updateStudentProfile,
} from './knowledgeLeaderboardService';
import { submitLeaderboardScore } from './quizLeaderboardService';
import { playCalibrationClick, playCalibrationSuccessPing } from './ndtAudioFeedback';

export const LESSON_QUIZ_RECORDS_KEY = 'insco_lesson_quiz_records_v1';
export const LESSON_QUIZ_XP_TOTAL_KEY = 'insco_lesson_quiz_xp_total_v1';

export interface LessonQuizRecord {
  packId: string;
  sourceKind: LessonQuizSourceKind;
  disciplineId: string;
  levelId: string;
  moduleId: string;
  titleAr: string;
  titleEn: string;
  attemptsCount: number;
  lastScorePct: number;
  bestScorePct: number;
  lastCorrectCount: number;
  totalQuestions: number;
  passed: boolean;
  bestXpAwarded: number;
  lastCompletedAt: string;
}

export interface QuizAttemptOutcome {
  packId: string;
  correctCount: number;
  totalQuestions: number;
  scorePct: number;
  passed: boolean;
  candidateXp: number;
  xpEarnedNow: number;
  bestXpForPack: number;
  previousTotalXp: number;
  newTotalXp: number;
  xpDeltaOnLeaderboard: number;
  previousRank: number;
  newRank: number;
  totalRankedStudents: number;
  previousTier: StudentTier;
  newTier: StudentTier;
  unlockedBadgeTitle?: { ar: string; en: string };
}

function safeDispatch(eventName: string, detail?: unknown): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const EventCtor = window.CustomEvent || globalThis.CustomEvent;
      if (EventCtor) {
        window.dispatchEvent(new EventCtor(eventName, { detail }));
      }
    }
  } catch {
    // Safe no-op in headless environments
  }
}

export function getLessonQuizRecords(): Record<string, LessonQuizRecord> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(LESSON_QUIZ_RECORDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getLessonQuizRecord(packId: string): LessonQuizRecord | null {
  const all = getLessonQuizRecords();
  return all[packId] || null;
}

export function getTotalEarnedQuizXp(): number {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const raw = localStorage.getItem(LESSON_QUIZ_XP_TOTAL_KEY);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
  } catch {
    return 0;
  }
}

export function calculateQuizAttemptXp(
  correctCount: number,
  totalQuestions: number,
  passThresholdPct: number = 75
): { scorePct: number; passed: boolean; candidateXp: number } {
  const safeTotal = Math.max(1, totalQuestions);
  const safeCorrect = Math.min(safeTotal, Math.max(0, correctCount));
  const scorePct = Math.round((safeCorrect / safeTotal) * 100);
  const passed = scorePct >= passThresholdPct;

  const perCorrectXp = safeCorrect * 25;
  const passBonusXp = passed ? 40 : 0;
  const masteryBonusXp = scorePct === 100 ? 35 : 0;
  const participationFloor = safeCorrect === 0 ? 10 : 0;

  return {
    scorePct,
    passed,
    candidateXp: perCorrectXp + passBonusXp + masteryBonusXp + participationFloor,
  };
}

export function submitLessonQuizAttempt(
  pack: LessonQuizPack,
  selectedAnswers: Record<string, number>
): QuizAttemptOutcome {
  const beforeBoard = getKnowledgeLeaderboard({ timeframe: 'all_time', sortMetric: 'xp' });
  const previousTotalXp = beforeBoard.currentUser.xp;
  const previousRank = beforeBoard.currentUserRank;
  const previousTier = beforeBoard.currentUser.tier;

  let correctCount = 0;
  for (const q of pack.questions) {
    if (selectedAnswers[q.id] === q.correctIndex) {
      correctCount += 1;
    }
  }

  const { scorePct, passed, candidateXp } = calculateQuizAttemptXp(
    correctCount,
    pack.questions.length,
    pack.passThresholdPct
  );

  const records = getLessonQuizRecords();
  const existing = records[pack.packId];
  const previousBestXp = existing?.bestXpAwarded ?? 0;
  const xpEarnedNow = Math.max(0, candidateXp - previousBestXp);
  const bestXpForPack = Math.max(previousBestXp, candidateXp);

  const updatedRecord: LessonQuizRecord = {
    packId: pack.packId,
    sourceKind: pack.sourceKind,
    disciplineId: pack.disciplineId,
    levelId: pack.levelId,
    moduleId: pack.moduleId,
    titleAr: pack.title.ar,
    titleEn: pack.title.en,
    attemptsCount: (existing?.attemptsCount ?? 0) + 1,
    lastScorePct: scorePct,
    bestScorePct: Math.max(existing?.bestScorePct ?? 0, scorePct),
    lastCorrectCount: correctCount,
    totalQuestions: pack.questions.length,
    passed: Boolean(existing?.passed || passed),
    bestXpAwarded: bestXpForPack,
    lastCompletedAt: new Date().toISOString(),
  };

  records[pack.packId] = updatedRecord;

  const nextBonusXpTotal = getTotalEarnedQuizXp() + xpEarnedNow;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LESSON_QUIZ_RECORDS_KEY, JSON.stringify(records));
      localStorage.setItem(LESSON_QUIZ_XP_TOTAL_KEY, String(nextBonusXpTotal));
    }
  } catch {
    // Ignore storage quota issues in constrained environments
  }

  // Only mark accredited curriculum modules complete in curriculumProgress (preserves KnowledgeLibrary & NDE-Ed test isolation)
  if (pack.sourceKind === 'curriculum_module' && passed) {
    markModuleCompleted(pack.moduleId, scorePct);
  }

  // Unlock milestone badges on StudentPerformer
  const profileBefore = getCurrentStudentProfile();
  const badges = [...(profileBefore.badges || [])];
  let unlockedBadgeTitle: { ar: string; en: string } | undefined;

  const passedRecordsCount = Object.values(records).filter((r) => r.passed).length;

  if (passed && !badges.some((b) => b.id === 'quiz_first_pass')) {
    badges.unshift({
      id: 'quiz_first_pass',
      titleAr: 'مجتاز اختبارات المنهج',
      titleEn: 'Curriculum Quiz Qualifier',
      icon: 'award',
      color: 'emerald',
    });
    unlockedBadgeTitle = {
      ar: 'مجتاز اختبارات المنهج',
      en: 'Curriculum Quiz Qualifier',
    };
  }

  if (scorePct === 100 && !badges.some((b) => b.id === 'quiz_perfect_100')) {
    badges.unshift({
      id: 'quiz_perfect_100',
      titleAr: 'العلامة الكاملة 100% بالكود',
      titleEn: '100% Code Mastery',
      icon: 'zap',
      color: 'amber',
    });
    unlockedBadgeTitle = {
      ar: 'العلامة الكاملة 100% بالكود',
      en: '100% Code Mastery',
    };
  }

  if (passedRecordsCount >= 5 && !badges.some((b) => b.id === 'quiz_scholar_5')) {
    badges.unshift({
      id: 'quiz_scholar_5',
      titleAr: 'فارس الـ 5 وحدات هندسية',
      titleEn: '5-Lesson Honor Scholar',
      icon: 'sparkles',
      color: 'cyan',
    });
    unlockedBadgeTitle = {
      ar: 'فارس الـ 5 وحدات هندسية',
      en: '5-Lesson Honor Scholar',
    };
  }

  const disciplineMeta = ENGINEERING_DISCIPLINES.find((d) => d.id === pack.disciplineId);

  updateStudentProfile({
    disciplineId: disciplineMeta?.id || profileBefore.disciplineId,
    disciplineTitleAr: disciplineMeta?.titleAr || profileBefore.disciplineTitleAr,
    disciplineTitleEn: disciplineMeta?.titleEn || profileBefore.disciplineTitleEn,
    badges,
    recentActivity: {
      actionAr: `حقق ${scorePct}% في اختبار «${pack.title.ar}» (${xpEarnedNow > 0 ? `+${xpEarnedNow} XP` : 'مراجعة تثبيت'})`,
      actionEn: `Scored ${scorePct}% on "${pack.title.en}" quiz (${xpEarnedNow > 0 ? `+${xpEarnedNow} XP` : 'mastery review'})`,
      timestamp: 'Just now',
    },
  });

  void submitLeaderboardScore({
    studentName: profileBefore.name,
    disciplineId: pack.disciplineId,
    disciplineTitle: disciplineMeta?.titleEn || pack.subtitle.en,
    score: correctCount,
    percentage: scorePct,
    date: new Date().toISOString().slice(0, 10),
    badgeUnlocked: unlockedBadgeTitle?.en,
  });

  const afterBoard = getKnowledgeLeaderboard({ timeframe: 'all_time', sortMetric: 'xp' });
  const newTotalXp = afterBoard.currentUser.xp;
  const newRank = afterBoard.currentUserRank;
  const newTier = afterBoard.currentUser.tier;

  if (passed) {
    playCalibrationSuccessPing();
  } else {
    playCalibrationClick();
  }

  const outcome: QuizAttemptOutcome = {
    packId: pack.packId,
    correctCount,
    totalQuestions: pack.questions.length,
    scorePct,
    passed,
    candidateXp,
    xpEarnedNow,
    bestXpForPack,
    previousTotalXp,
    newTotalXp,
    xpDeltaOnLeaderboard: Math.max(0, newTotalXp - previousTotalXp),
    previousRank,
    newRank,
    totalRankedStudents: afterBoard.totalStudentsCount,
    previousTier,
    newTier,
    unlockedBadgeTitle,
  };

  safeDispatch('insco_quiz_completed', outcome);
  safeDispatch('insco_leaderboard_updated', outcome);

  return outcome;
}

export function getAcademyQuizSummary() {
  const records = Object.values(getLessonQuizRecords());
  const board = getKnowledgeLeaderboard({ timeframe: 'all_time', sortMetric: 'xp' });
  const passedCount = records.filter((r) => r.passed).length;
  const totalAttempts = records.reduce((acc, r) => acc + r.attemptsCount, 0);
  const averageBestPct =
    records.length > 0
      ? Math.round(records.reduce((acc, r) => acc + r.bestScorePct, 0) / records.length)
      : board.currentUser.quizAccuracy;

  return {
    recordsMap: getLessonQuizRecords(),
    uniqueQuizzesTaken: records.length,
    passedCount,
    totalAttempts,
    averageBestPct,
    bonusQuizXp: getTotalEarnedQuizXp(),
    totalStudentXp: board.currentUser.xp,
    currentUserRank: board.currentUserRank,
    totalStudentsCount: board.totalStudentsCount,
    tier: board.currentUser.tier,
  };
}

export function useLessonQuizStore() {
  const [summary, setSummary] = useState(() => getAcademyQuizSummary());

  const refresh = useCallback(() => {
    setSummary(getAcademyQuizSummary());
  }, []);

  useEffect(() => {
    window.addEventListener('insco_quiz_completed', refresh);
    window.addEventListener('insco_leaderboard_updated', refresh);
    window.addEventListener('insco_progress_updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('insco_quiz_completed', refresh);
      window.removeEventListener('insco_leaderboard_updated', refresh);
      window.removeEventListener('insco_progress_updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return {
    ...summary,
    refresh,
  };
}
