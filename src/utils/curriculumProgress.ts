import { syncActiveUserModuleCompletion } from './userCourseProgressStore';

import { readAccountAcademyProgress, saveAccountModule, saveAccountModuleCompletion } from '../account/academyAccountProgress';

const COMPLETED_MODULES_KEY = 'insco_academy_completed_modules';
const COMPLETED_TOPICS_KEY = 'insco_academy_completed_topics_v1';
const QUIZ_RESULTS_KEY = 'insco_academy_quiz_results_v1';

export interface ModuleProgressRecord {
  moduleId: string;
  disciplineId?: string;
  completedAt: string;
  score?: number;
  unlockedBadge?: string;
}

export interface TopicProgressMap {
  [moduleId: string]: string[]; // array of topic titles or IDs completed for that module
}

export interface FirestoreSyncStatus {
  synced: boolean;
  lastSyncedAt?: string;
  error?: string;
}

// -------------------------------------------------------------
// Module Completion
// -------------------------------------------------------------
export function getCompletedModules(): Record<string, boolean> {
  const account = readAccountAcademyProgress();
  if (account) return Object.fromEntries([...account.modules.entries()].filter(([, row]) => row.completedAt).map(([id]) => [id, true]));
  try {
    const raw = localStorage.getItem(COMPLETED_MODULES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isModuleCompleted(moduleId: string): boolean {
  const completed = getCompletedModules();
  return Boolean(completed[moduleId]);
}

export function markModuleCompleted(moduleId: string, score: number = 100): void {
  if (readAccountAcademyProgress()) { void saveAccountModuleCompletion(moduleId, true, score); return; }
  try {
    const completed = getCompletedModules();
    completed[moduleId] = true;
    localStorage.setItem(COMPLETED_MODULES_KEY, JSON.stringify(completed));

    // Sync active user's NDT module completion in localStorage
    syncActiveUserModuleCompletion(moduleId, true);

    // Save quiz result record
    const results = getQuizResults();
    results[moduleId] = {
      moduleId,
      score,
      completedAt: new Date().toISOString(),
      passed: score >= 75
    };
    localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));

    window.dispatchEvent(new CustomEvent('insco_progress_updated', { detail: { moduleId, score } }));
    window.dispatchEvent(new CustomEvent('insco_user_progress_updated', { detail: { moduleId, completed: true } }));
  } catch (e) {
    console.error('Failed to mark module completed:', e);
  }
}

export function unmarkModuleCompleted(moduleId: string): void {
  if (readAccountAcademyProgress()) { void saveAccountModuleCompletion(moduleId, false); return; }
  try {
    const completed = getCompletedModules();
    delete completed[moduleId];
    localStorage.setItem(COMPLETED_MODULES_KEY, JSON.stringify(completed));

    syncActiveUserModuleCompletion(moduleId, false);

    window.dispatchEvent(new CustomEvent('insco_progress_updated', { detail: { moduleId, completed: false } }));
    window.dispatchEvent(new CustomEvent('insco_user_progress_updated', { detail: { moduleId, completed: false } }));
  } catch (e) {
    console.error('Failed to unmark module completed:', e);
  }
}

export function toggleModuleCompleted(moduleId: string): boolean {
  if (isModuleCompleted(moduleId)) {
    unmarkModuleCompleted(moduleId);
    return false;
  }
  markModuleCompleted(moduleId, 100);
  return true;
}

// -------------------------------------------------------------
// Topic Completion Per Module (Requested by User)
// -------------------------------------------------------------
export function getCompletedTopics(): TopicProgressMap {
  const account = readAccountAcademyProgress();
  if (account) return Object.fromEntries([...account.modules.entries()].map(([id, row]) => [id, row.completedTopics ?? []]));
  try {
    const raw = localStorage.getItem(COMPLETED_TOPICS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isTopicCompleted(moduleId: string, topicText: string): boolean {
  const map = getCompletedTopics();
  const list = map[moduleId] || [];
  return list.includes(topicText);
}

export async function toggleTopicCompleted(
  moduleId: string, 
  topicText: string, 
  disciplineId?: string
): Promise<{ completed: boolean; totalCompleted: number }> {
  try {
    const map = getCompletedTopics();
    const currentList = new Set(map[moduleId] || []);
    let completed = false;

    if (currentList.has(topicText)) {
      currentList.delete(topicText);
      completed = false;
    } else {
      currentList.add(topicText);
      completed = true;
    }

    map[moduleId] = Array.from(currentList);
    if (readAccountAcademyProgress()) {
      const topics = map[moduleId];
      const saved = await saveAccountModule(moduleId, {
        completedTopics: topics, completedCount: topics.length, disciplineId: disciplineId || 'general',
      });
      return saved ? { completed, totalCompleted: topics.length } : { completed: !completed, totalCompleted: getCompletedTopics()[moduleId]?.length ?? 0 };
    }
    localStorage.setItem(COMPLETED_TOPICS_KEY, JSON.stringify(map));

    // Dispatch event so all components update immediately
    window.dispatchEvent(new CustomEvent('insco_topic_progress_updated', { 
      detail: { moduleId, topicText, completed, totalCompleted: map[moduleId].length } 
    }));

    return { completed, totalCompleted: map[moduleId].length };
  } catch (err) {
    console.error('Error toggling topic completed:', err);
    return { completed: false, totalCompleted: 0 };
  }
}

// -------------------------------------------------------------
// Quiz Results
// -------------------------------------------------------------
export function getQuizResults(): Record<string, { moduleId: string; score: number; completedAt: string; passed: boolean }> {
  const account = readAccountAcademyProgress();
  if (account) return Object.fromEntries([...account.modules.values()].filter(row => row.completedAt && typeof row.score === 'number').map(row => [row.moduleId, {
    moduleId: row.moduleId, score: row.score!, completedAt: row.completedAt!.toDate().toISOString(), passed: Boolean(row.isPassed),
  }]));
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
