/**
 * Firestore backend for the Robotic University runtime archive — the «دائم ومجاني»
 * option. Uses the Admin SDK, which bypasses security rules (the rules are
 * default-deny for clients, by design), targets the same named database the app
 * already uses, and lives comfortably inside the **free** Spark tier:
 *
 *   1 GiB storage · 50,000 reads/day · 20,000 writes/day · 20,000 deletes/day
 *
 * The archive holds at most RUNTIME_RECORD_CAP small documents (each well under
 * 4 KB), and the university only writes when someone explicitly runs a collector,
 * a cell or «المُنظِّم» — a handful of operations per run. Billing is not
 * expected to leave the free tier; if it ever does, Firestore stops the
 * operations rather than silently billing beyond quota on Spark.
 *
 * Activation — no secrets in the repo, only env vars the host already supports:
 *   FIREBASE_SERVICE_ACCOUNT_JSON  the service-account JSON, one line (recommended for Vercel)
 *   FIREBASE_SERVICE_ACCOUNT       accepted alias — the same JSON under the name already
 *                                  used by the INSCO Vercel project (production)
 *   GOOGLE_APPLICATION_CREDENTIALS path to the service-account JSON (recommended for a Node host)
 *   FIREBASE_FIRESTORE_DATABASE_ID optional — defaults to the INSCO named database
 *   FIREBASE_PROJECT_ID            optional — defaults to the JSON's project_id
 *
 * Without credentials this module returns `null` and the caller falls back to
 * the file/memory store — same behaviour as before, nothing breaks.
 */
import { existsSync, readFileSync } from 'node:fs';
import type { KnowledgeRecord } from '../../src/data/universityKnowledge.js';
import { cleanRuntimeRecords, RUNTIME_RECORD_CAP } from './runtimeRecords.js';

export const UNIVERSITY_ARCHIVE_COLLECTION = 'universityArchive';

/** The INSCO named database (public client config already committed to the repo). */
const DEFAULT_DATABASE_ID = 'ai-studio-inscointeractive-2ab74c2d-acdd-4fa3-a16b-53ea46221179';
const DEFAULT_PROJECT_ID = 'ai-studio-applet-webapp-18922';

/** Cheap synchronous pre-flight: do we even *have* credentials to try? (No I/O beyond existsSync.) */
const serviceAccountRaw = (env: NodeJS.ProcessEnv): string =>
  (env.FIREBASE_SERVICE_ACCOUNT_JSON || env.FIREBASE_SERVICE_ACCOUNT || '').trim();

export function hasFirestoreCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  if (serviceAccountRaw(env)) return true;
  const credPath = (env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  return Boolean(credPath) && existsSync(credPath);
}

export interface FirestoreArchiveStore {
  backend: 'firestore';
  load(): Promise<KnowledgeRecord[]>;
  append(records: KnowledgeRecord[]): Promise<{ records: KnowledgeRecord[]; persisted: boolean; evicted: number }>;
  replaceDepartment(
    departmentId: string,
    evolved: KnowledgeRecord[]
  ): Promise<{ records: KnowledgeRecord[]; persisted: boolean; evicted: number; kept: number }>;
  isWritable(): Promise<boolean>;
}

interface ServiceAccountLike {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

/**
 * The service account pretty-pasted into a host dashboard often arrives with
 * REAL newlines inside the private_key string, which is invalid JSON. Repair
 * just that one field, then parse — anything still broken is rejected.
 */
function parseServiceAccountJson(raw: string): ServiceAccountLike | null {
  try {
    return JSON.parse(raw) as ServiceAccountLike;
  } catch {
    const repaired = raw.replace(
      /"private_key"\s*:\s*"([\s\S]*?)"/,
      (_match, keyBody: string) => `"private_key":"${keyBody.replace(/\r?\n/g, '\\n').trim()}"`
    );
    try {
      return JSON.parse(repaired) as ServiceAccountLike;
    } catch (error) {
      console.error('[university] Firestore service account JSON could not be parsed:', error);
      return null;
    }
  }
}

function readServiceAccount(env: NodeJS.ProcessEnv): ServiceAccountLike | null {
  const raw = serviceAccountRaw(env);
  if (raw) return parseServiceAccountJson(raw);
  const credPath = (env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (credPath && existsSync(credPath)) {
    try {
      return JSON.parse(readFileSync(credPath, 'utf8')) as ServiceAccountLike;
    } catch (error) {
      console.error('[university] Firestore service account file could not be parsed:', error);
      return null;
    }
  }
  return null;
}

function evictedCount(current: number, inserted: number): { evict: number } {
  const projected = current + inserted;
  return projected > RUNTIME_RECORD_CAP ? { evict: projected - RUNTIME_RECORD_CAP } : { evict: 0 };
}

export async function createFirestoreUniversityStore(
  env: NodeJS.ProcessEnv = process.env
): Promise<FirestoreArchiveStore | null> {
  if (!hasFirestoreCredentials(env)) return null;

  const serviceAccount = readServiceAccount(env);
  if (!serviceAccount) {
    // readServiceAccount already reported the parse/read failure.
    return null;
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    console.error('[university] Firestore service account JSON is missing client_email/private_key — staying on file/memory store.');
    return null;
  }

  const projectId = serviceAccount.project_id || (env.FIREBASE_PROJECT_ID || '').trim() || DEFAULT_PROJECT_ID;
  const databaseId = (env.FIREBASE_FIRESTORE_DATABASE_ID || '').trim() || DEFAULT_DATABASE_ID;

  // Dynamic import on purpose: the package is an *optional* dependency, so hosts
  // installed with --no-optional keep working (file/memory store) instead of
  // crashing at import time.
  let appModule: typeof import('firebase-admin/app');
  let firestoreModule: typeof import('firebase-admin/firestore');
  try {
    appModule = await import('firebase-admin/app');
    firestoreModule = await import('firebase-admin/firestore');
  } catch (error) {
    console.error('[university] firebase-admin not importable (optional dependency) — staying on file/memory store:', error);
    return null;
  }

  let db: FirebaseFirestore.Firestore;
  try {
    const named = appModule.getApps().find(a => a.name === 'university-archive');
    const app = named
      ? named
      : appModule.initializeApp({ credential: appModule.cert(serviceAccount as never), projectId }, 'university-archive');
    db = firestoreModule.getFirestore(app, databaseId);
  } catch (error) {
    console.error('[university] Firestore initialisation failed — staying on file/memory store:', error);
    return null;
  }

  const collection = () => db.collection(UNIVERSITY_ARCHIVE_COLLECTION);

  const docsToRecords = (snapshot: FirebaseFirestore.QuerySnapshot) =>
    cleanRuntimeRecords(snapshot.docs.map(doc => ({ ...(doc.data() as object), id: doc.id })));

  const load = async (): Promise<KnowledgeRecord[]> => {
    try {
      const snapshot = await collection().orderBy('updatedAt', 'asc').limit(RUNTIME_RECORD_CAP).get();
      return docsToRecords(snapshot);
    } catch (error) {
      console.error('[university] Firestore read failed; serving nothing rather than guessing:', error);
      return [];
    }
  };

  const evictOldest = async (target: number): Promise<number> => {
    const countSnap = await collection().count().get();
    const total = countSnap.data().count;
    const excess = total - target;
    if (excess <= 0) return 0;
    const oldest = await collection().orderBy('updatedAt', 'asc').limit(excess).get();
    const batch = db.batch();
    for (const doc of oldest.docs) batch.delete(doc.ref);
    await batch.commit();
    return oldest.size;
  };

  const append = async (
    records: KnowledgeRecord[]
  ): Promise<{ records: KnowledgeRecord[]; persisted: boolean; evicted: number }> => {
    try {
      const currentCount = (await collection().count().get()).data().count;
      const { evict } = evictedCount(currentCount, records.length);
      const batch = db.batch();
      for (const record of records) {
        batch.set(collection().doc(record.id), { ...record }, { merge: true });
      }
      await batch.commit();
      const evicted = evict > 0 ? await evictOldest(RUNTIME_RECORD_CAP) : 0;
      const after = await load();
      return { records: after, persisted: true, evicted };
    } catch (error) {
      console.error('[university] Firestore write failed (quota or permissions) — nothing persisted:', error);
      const after = await load();
      return { records: after, persisted: false, evicted: 0 };
    }
  };

  const replaceDepartment = async (
    departmentId: string,
    evolved: KnowledgeRecord[]
  ): Promise<{ records: KnowledgeRecord[]; persisted: boolean; evicted: number; kept: number }> => {
    try {
      const existing = await collection().where('departmentId', '==', departmentId).get();
      const batch = db.batch();
      for (const doc of existing.docs) batch.delete(doc.ref);
      for (const record of evolved) {
        batch.set(collection().doc(record.id), { ...record }, { merge: false });
      }
      await batch.commit();
      const evicted = await evictOldest(RUNTIME_RECORD_CAP);
      const after = await load();
      const kept = after.filter(record => record.departmentId !== departmentId).length;
      return { records: after, persisted: true, evicted, kept };
    } catch (error) {
      console.error('[university] Firestore replace failed — nothing persisted:', error);
      const after = await load();
      const kept = after.filter(record => record.departmentId !== departmentId).length;
      return { records: after, persisted: false, evicted: 0, kept };
    }
  };

  const isWritable = async (): Promise<boolean> => {
    try {
      await collection().limit(1).get();
      return true;
    } catch {
      return false;
    }
  };

  console.log(`[university] runtime archive backend: FIRESTORE (project ${projectId}, database ${databaseId}, collection ${UNIVERSITY_ARCHIVE_COLLECTION})`);
  return { backend: 'firestore', load, append, replaceDepartment, isWritable };
}
