import { syncActiveUserModuleCompletion } from './userCourseProgressStore';

/**
 * Firebase is loaded on demand: the academy works fully offline from
 * localStorage, so bundling the SDK into the first payload (and printing an
 * auth error when no API key is set) is a cost with no benefit.
 */
type FirebaseHandle = {
  db: import('firebase/firestore').Firestore;
  auth: import('firebase/auth').Auth | null;
} | null;

let firebaseHandlePromise: Promise<FirebaseHandle> | null = null;

function getFirebase(): Promise<FirebaseHandle> {
  if (!firebaseHandlePromise) {
    firebaseHandlePromise = (async (): Promise<FirebaseHandle> => {
      try {
        const config = await import('../firebase/config');
        const db = config.db;
        if (!config.isFirebaseConfigured || !db) return null;
        return { db, auth: config.auth };
      } catch {
        return null;
      }
    })();
  }
  return firebaseHandlePromise;
}

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

    // Async sync to Firestore
    syncModuleToFirestore(moduleId, score);

    window.dispatchEvent(new CustomEvent('insco_progress_updated', { detail: { moduleId, score } }));
    window.dispatchEvent(new CustomEvent('insco_user_progress_updated', { detail: { moduleId, completed: true } }));
  } catch (e) {
    console.error('Failed to mark module completed:', e);
  }
}

export function unmarkModuleCompleted(moduleId: string): void {
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
    localStorage.setItem(COMPLETED_TOPICS_KEY, JSON.stringify(map));

    // Dispatch event so all components update immediately
    window.dispatchEvent(new CustomEvent('insco_topic_progress_updated', { 
      detail: { moduleId, topicText, completed, totalCompleted: map[moduleId].length } 
    }));

    // Sync to Firestore
    await syncTopicsToFirestore(moduleId, map[moduleId], disciplineId);

    return { completed, totalCompleted: map[moduleId].length };
  } catch (err) {
    console.error('Error toggling topic completed:', err);
    return { completed: false, totalCompleted: 0 };
  }
}

// -------------------------------------------------------------
// Firestore Sync
// -------------------------------------------------------------
export async function syncTopicsToFirestore(
  moduleId: string, 
  topics: string[], 
  disciplineId?: string
): Promise<FirestoreSyncStatus> {
  const firebase = await getFirebase();
  if (!firebase?.db) {
    return { synced: false, error: 'Cloud sync is not configured; progress stays local' };
  }

  try {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const userId = firebase.auth?.currentUser?.uid || getLocalUserId();
    const docRef = doc(firebase.db, 'user_module_progress', `${userId}_${moduleId}`);

    await setDoc(docRef, {
      userId,
      moduleId,
      disciplineId: disciplineId || 'general',
      completedTopics: topics,
      completedCount: topics.length,
      updatedAt: serverTimestamp(),
      clientTimestamp: new Date().toISOString()
    }, { merge: true });

    return { synced: true, lastSyncedAt: new Date().toLocaleTimeString() };
  } catch (error: any) {
    console.warn('Firestore sync background notice (using local storage):', error?.message);
    return { synced: false, error: error?.message };
  }
}

export async function syncModuleToFirestore(moduleId: string, score: number): Promise<void> {
  const firebase = await getFirebase();
  if (!firebase?.db) return;
  try {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const userId = firebase.auth?.currentUser?.uid || getLocalUserId();
    const docRef = doc(firebase.db, 'user_module_progress', `${userId}_${moduleId}`);
    await setDoc(docRef, {
      userId,
      moduleId,
      isPassed: score >= 75,
      score,
      unlockedCertificate: score >= 75,
      completedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('Firestore module sync notice:', e);
  }
}

function getLocalUserId(): string {
  let uid = localStorage.getItem('insco_local_student_uid');
  if (!uid) {
    uid = 'student_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('insco_local_student_uid', uid);
  }
  return uid;
}

// -------------------------------------------------------------
// Quiz Results
// -------------------------------------------------------------
export function getQuizResults(): Record<string, { moduleId: string; score: number; completedAt: string; passed: boolean }> {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
