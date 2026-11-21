import { academyActivityStorage } from '../account/academyAccountProgress';
import { ExamCertificationLevel, ExamDifficultyLevel } from './curriculumExamGenerator';

export interface ExamHistoryEntry {
  id: string;
  timestamp: string;
  dateLabel: string;
  examId: string;
  level: ExamCertificationLevel;
  difficulty: ExamDifficultyLevel;
  overallScorePct: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  methodScores: Record<string, { total: number; correct: number; pct: number }>;
}

const STORAGE_KEY = 'insco_exam_simulation_history_v1';

// Initial realistic baseline progression for a qualifying candidate
const INITIAL_BASELINE_HISTORY: ExamHistoryEntry[] = [
  {
    id: 'hist_init_01',
    timestamp: '2026-10-10T09:30:00.000Z',
    dateLabel: 'Oct 10',
    examId: 'insco_exam_baseline_1',
    level: 'level1',
    difficulty: 'standard',
    overallScorePct: 62,
    isPassed: false,
    timeSpentSeconds: 840,
    methodScores: {
      UT: { total: 4, correct: 2, pct: 50 },
      RT: { total: 3, correct: 2, pct: 67 },
      MT: { total: 2, correct: 1, pct: 50 },
      PT: { total: 2, correct: 2, pct: 100 },
      VT: { total: 2, correct: 1, pct: 50 },
    }
  },
  {
    id: 'hist_init_02',
    timestamp: '2026-10-18T14:15:00.000Z',
    dateLabel: 'Oct 18',
    examId: 'insco_exam_baseline_2',
    level: 'level1',
    difficulty: 'standard',
    overallScorePct: 70,
    isPassed: true,
    timeSpentSeconds: 780,
    methodScores: {
      UT: { total: 4, correct: 3, pct: 75 },
      RT: { total: 3, correct: 2, pct: 67 },
      MT: { total: 2, correct: 2, pct: 100 },
      PT: { total: 2, correct: 1, pct: 50 },
      VT: { total: 2, correct: 2, pct: 100 },
    }
  },
  {
    id: 'hist_init_03',
    timestamp: '2026-10-25T11:00:00.000Z',
    dateLabel: 'Oct 25',
    examId: 'insco_exam_baseline_3',
    level: 'both',
    difficulty: 'standard',
    overallScorePct: 76,
    isPassed: false, // 80% needed for composite
    timeSpentSeconds: 720,
    methodScores: {
      UT: { total: 4, correct: 3, pct: 75 },
      RT: { total: 3, correct: 2, pct: 67 },
      MT: { total: 3, correct: 3, pct: 100 },
      PT: { total: 2, correct: 2, pct: 100 },
      VT: { total: 2, correct: 1, pct: 50 },
    }
  },
  {
    id: 'hist_init_04',
    timestamp: '2026-11-01T16:45:00.000Z',
    dateLabel: 'Nov 01',
    examId: 'insco_exam_baseline_4',
    level: 'level2',
    difficulty: 'strict_proctored',
    overallScorePct: 84,
    isPassed: true,
    timeSpentSeconds: 660,
    methodScores: {
      UT: { total: 4, correct: 4, pct: 100 },
      RT: { total: 4, correct: 3, pct: 75 },
      MT: { total: 2, correct: 2, pct: 100 },
      PT: { total: 2, correct: 2, pct: 100 },
      VT: { total: 2, correct: 1, pct: 50 },
    }
  }
];

export function getExamHistory(): ExamHistoryEntry[] {
  if (typeof window === 'undefined') return INITIAL_BASELINE_HISTORY;
  try {
    const raw = academyActivityStorage.getItem(STORAGE_KEY);
    if (!raw) {
      academyActivityStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BASELINE_HISTORY));
      return INITIAL_BASELINE_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BASELINE_HISTORY;
  } catch {
    return INITIAL_BASELINE_HISTORY;
  }
}

export function saveExamHistoryEntry(
  entry: Omit<ExamHistoryEntry, 'id' | 'timestamp' | 'dateLabel'>
): ExamHistoryEntry {
  const current = getExamHistory();
  const dateObj = new Date();
  const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const newEntry: ExamHistoryEntry = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: dateObj.toISOString(),
    dateLabel
  };

  const updated = [...current, newEntry];
  if (typeof window !== 'undefined') {
    try {
      academyActivityStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('insco_exam_history_updated', { detail: newEntry }));
    } catch {}
  }

  return newEntry;
}

export function resetExamHistoryToBaseline(): ExamHistoryEntry[] {
  if (typeof window !== 'undefined') {
    try {
      academyActivityStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BASELINE_HISTORY));
      window.dispatchEvent(new CustomEvent('insco_exam_history_updated'));
    } catch {}
  }
  return INITIAL_BASELINE_HISTORY;
}
