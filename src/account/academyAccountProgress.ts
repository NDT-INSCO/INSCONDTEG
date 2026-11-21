import type { User } from 'firebase/auth';

export interface AccountModuleProgress {
  moduleId: string;
  disciplineId?: string;
  completedTopics?: string[];
  completedCount?: number;
  completedAt?: { toDate: () => Date } | null;
  isPassed?: boolean;
  score?: number;
  unlockedCertificate?: boolean;
}

type SyncState = 'loading' | 'ready' | 'unverified' | 'error';
interface AccountProgress {
  uid: string;
  name: string;
  modules: Map<string, AccountModuleProgress>;
  state: SyncState;
  activity: Map<string, string>;
}

// The academy's sandbox/guest data is device-local. Real account progress is
// fetched by UID and remains in memory only, for the active account.
let account: AccountProgress | null = null;
let database: { db: import('firebase/firestore').Firestore; auth: import('firebase/auth').Auth } | null = null;

function notify() {
  if (typeof window === 'undefined') return;
  for (const event of ['insco_progress_updated', 'insco_user_progress_updated', 'insco_topic_progress_updated']) {
    window.dispatchEvent(new CustomEvent(event));
  }
}

export function readAccountAcademyProgress() { return account; }

/** Local training tools stay local for visitors and ephemeral when signed in. */
export const academyActivityStorage = {
  getItem(key: string): string | null {
    return account ? account.activity.get(key) ?? null : localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (account) account.activity.set(key, value);
    else localStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    if (account) account.activity.delete(key);
    else localStorage.removeItem(key);
  },
};

export function bindAccountAcademyProgress(user: User, verified: boolean, onStatus: (state: SyncState) => void) {
  const bound: AccountProgress = { uid: user.uid, name: user.displayName || '', modules: new Map(), activity: new Map(), state: verified ? 'loading' : 'unverified' };
  account = bound;
  database = null;
  let unsubscribe: (() => void) | undefined;
  const changeStatus = (state: SyncState) => {
    if (account !== bound) return;
    bound.state = state;
    if (state === 'error') bound.modules.clear();
    onStatus(state);
    notify();
  };
  onStatus(bound.state);
  if (verified) {
    void Promise.all([import('../firebase/config'), import('firebase/firestore')]).then(([config, api]) => {
      if (account !== bound) return;
      const { db, auth } = config;
      if (!db || !auth || auth.currentUser?.uid !== user.uid) { changeStatus('error'); return; }
      database = { db, auth };
      const source = api.query(api.collection(db, 'user_module_progress'), api.where('userId', '==', user.uid));
      unsubscribe = api.onSnapshot(source, { includeMetadataChanges: true }, snapshot => {
        if (account !== bound || auth.currentUser?.uid !== user.uid || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
        const modules = new Map<string, AccountModuleProgress>();
        for (const record of snapshot.docs) {
          const row = record.data() as AccountModuleProgress & { userId: string };
          if (row.userId !== user.uid || typeof row.moduleId !== 'string' || record.id !== `${user.uid}_${row.moduleId}`) continue;
          modules.set(row.moduleId, {
            ...row,
            completedAt: typeof row.completedAt?.toDate === 'function' ? row.completedAt : null,
            completedTopics: Array.isArray(row.completedTopics) ? row.completedTopics.filter(topic => typeof topic === 'string') : [],
          });
        }
        bound.modules = modules;
        changeStatus('ready');
      }, () => changeStatus('error'));
    }).catch(() => changeStatus('error'));
  }
  return () => {
    unsubscribe?.();
    if (account === bound) { account = null; database = null; }
  };
}

export async function saveAccountModule(moduleId: string, fields: Omit<AccountModuleProgress, 'moduleId' | 'completedAt'>, finished?: boolean) {
  const bound = account;
  const target = database;
  if (!bound || bound.state !== 'ready' || !target || !/^[a-zA-Z0-9_-]{1,80}$/.test(moduleId)) return false;
  try {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    if (account !== bound || target.auth.currentUser?.uid !== bound.uid) return false;
    await setDoc(doc(target.db, 'user_module_progress', `${bound.uid}_${moduleId}`), {
      ...fields, moduleId, userId: bound.uid, updatedAt: serverTimestamp(),
      ...(finished === undefined ? {} : { completedAt: finished ? serverTimestamp() : null }),
    }, { merge: true });
    if (account !== bound) return false;
    window.dispatchEvent(new CustomEvent('insco_account_progress_saved'));
    return true;
  } catch {
    if (account === bound) window.dispatchEvent(new CustomEvent('insco_account_progress_save_error'));
    return false;
  }
}

export function saveAccountModuleCompletion(moduleId: string, completed: boolean, score = 100) {
  return saveAccountModule(moduleId, {
    isPassed: completed && score >= 75,
    score: completed ? score : 0,
    unlockedCertificate: completed && score >= 75,
  }, completed);
}
