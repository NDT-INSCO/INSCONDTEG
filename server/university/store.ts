/**
 * Runtime archive facade for the Robotic University — one promise-shaped API,
 * three backends selected at first use:
 *
 *   firestore  دائم ومجاني (within the Spark quota) — when the host carries a
 *              service account (FIREBASE_SERVICE_ACCOUNT_JSON or
 *              GOOGLE_APPLICATION_CREDENTIALS). Survives redeploys on Vercel.
 *   file       JSON on a writable disk (a self-hosted Node host) — default
 *              outside serverless when no Firestore credentials exist.
 *   memory     هذا كل شيء — when there is no port of call at all (serverless
 *              without Firestore, or a read-only fs). Works; forgets on exit.
 *
 * Force a backend with UNIVERSITY_STORE=firestore|file|memory (used by the
 * tests and available for ops debugging). Every backend re-validates records
 * on read — see runtimeRecords.ts.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, accessSync, constants } from 'node:fs';
import path from 'node:path';
import type { KnowledgeRecord } from '../../src/data/universityKnowledge.js';
import {
  cleanRuntimeRecords,
  asRuntimeId,
  RUNTIME_RECORD_CAP,
} from './runtimeRecords.js';
import {
  createFirestoreUniversityStore,
  hasFirestoreCredentials,
  type FirestoreArchiveStore,
} from './firestoreStore.js';

export type UniversityStoreBackend = 'firestore' | 'file' | 'memory';
export { asRuntimeId, RUNTIME_RECORD_CAP };

const storePath =
  (process.env.UNIVERSITY_ARCHIVE_PATH || '').trim() ||
  path.join(process.cwd(), '.admin-data', 'university-archive.json');

/* ------------------------- pure backend selection ------------------------- */

export function selectBackendName(
  env: NodeJS.ProcessEnv,
  firestoreAvailable: boolean,
  fileWritable: boolean
): UniversityStoreBackend {
  const forced = (env.UNIVERSITY_STORE || '').trim().toLowerCase();
  if (forced === 'memory') return 'memory';
  if (forced === 'file') return fileWritable ? 'file' : 'memory';
  if (forced === 'firestore') return firestoreAvailable ? 'firestore' : 'memory';
  return firestoreAvailable ? 'firestore' : fileWritable ? 'file' : 'memory';
}

/* ------------------------------ file backend ------------------------------ */

let fileCache: KnowledgeRecord[] | null = null;

function loadFile(): KnowledgeRecord[] {
  if (fileCache) return fileCache;
  try {
    if (!existsSync(storePath)) {
      fileCache = [];
      return fileCache;
    }
    const parsed = JSON.parse(readFileSync(storePath, 'utf8')) as unknown;
    fileCache = cleanRuntimeRecords(Array.isArray(parsed) ? parsed : []);
    return fileCache;
  } catch (error) {
    console.error('[university] runtime archive unreadable, starting empty:', error);
    fileCache = [];
    return fileCache;
  }
}

function saveFile(records: KnowledgeRecord[]): { records: KnowledgeRecord[]; persisted: boolean; evicted: number } {
  const trimmed = records.slice(-RUNTIME_RECORD_CAP);
  const evicted = records.length - trimmed.length;
  try {
    mkdirSync(path.dirname(storePath), { recursive: true });
    const tmp = `${storePath}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify(trimmed, null, 2), 'utf8');
    renameSync(tmp, storePath);
    fileCache = trimmed;
    return { records: trimmed, persisted: true, evicted };
  } catch (error) {
    console.error('[university] runtime archive not writable on this host:', error);
    fileCache = trimmed; // serve the in-memory copy for this process
    return { records: trimmed, persisted: false, evicted };
  }
}

const fileBackend = {
  async load() {
    return loadFile();
  },
  async append(records: KnowledgeRecord[]) {
    return saveFile([...loadFile(), ...records]);
  },
  async replaceDepartment(departmentId: string, evolved: KnowledgeRecord[]) {
    const current = loadFile();
    const kept = current.filter(record => record.departmentId !== departmentId);
    const result = saveFile([...kept, ...evolved]);
    return { ...result, kept: kept.length };
  },
};

function fileIsWritable(): boolean {
  try {
    mkdirSync(path.dirname(storePath), { recursive: true });
    accessSync(path.dirname(storePath), constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/* ----------------------------- memory backend ----------------------------- */

let memoryRecords: KnowledgeRecord[] = [];

const memoryBackend = {
  async load() {
    return memoryRecords;
  },
  async append(records: KnowledgeRecord[]) {
    const next = [...memoryRecords, ...records].slice(-RUNTIME_RECORD_CAP);
    const evicted = memoryRecords.length + records.length - next.length;
    memoryRecords = next;
    return { records: next, persisted: false, evicted };
  },
  async replaceDepartment(departmentId: string, evolved: KnowledgeRecord[]) {
    const kept = memoryRecords.filter(record => record.departmentId !== departmentId);
    const next = [...kept, ...evolved].slice(-RUNTIME_RECORD_CAP);
    const evicted = Math.max(0, kept.length + evolved.length - next.length);
    memoryRecords = next;
    return { records: next, persisted: false, evicted, kept: kept.length };
  },
};

/* ------------------------------- the facade ------------------------------- */

interface ResolvedBackend {
  backend: UniversityStoreBackend;
  load(): Promise<KnowledgeRecord[]>;
  append(records: KnowledgeRecord[]): ReturnType<typeof fileBackend.append>;
  replaceDepartment(
    departmentId: string,
    evolved: KnowledgeRecord[]
  ): ReturnType<typeof fileBackend.replaceDepartment>;
  isWritable(): Promise<boolean>;
}

let resolved: ResolvedBackend | null = null;

async function resolveBackend(): Promise<ResolvedBackend> {
  if (resolved) return resolved;

  const fileWritable = fileIsWritable();
  let firestore: FirestoreArchiveStore | null = null;
  if (hasFirestoreCredentials()) {
    // createFirestoreUniversityStore returns null instead of throwing on any problem.
    firestore = await createFirestoreUniversityStore(process.env);
  }

  const backend = selectBackendName(process.env, Boolean(firestore), fileWritable);
  if (backend === 'firestore' && firestore) {
    resolved = {
      backend: 'firestore',
      load: () => firestore!.load(),
      append: records => firestore!.append(records),
      replaceDepartment: (departmentId, evolved) => firestore!.replaceDepartment(departmentId, evolved),
      isWritable: () => firestore!.isWritable(),
    };
    return resolved;
  }
  if (backend === 'file') {
    resolved = {
      backend: 'file',
      load: () => fileBackend.load(),
      append: records => fileBackend.append(records),
      replaceDepartment: (departmentId, evolved) => fileBackend.replaceDepartment(departmentId, evolved),
      isWritable: async () => fileIsWritable(),
    };
    return resolved;
  }
  console.warn('[university] no persistent archive available (no Firestore credentials, no writable disk) — running on in-memory storage for this process.');
  resolved = {
    backend: 'memory',
    load: () => memoryBackend.load(),
    append: records => memoryBackend.append(records),
    replaceDepartment: (departmentId, evolved) => memoryBackend.replaceDepartment(departmentId, evolved),
    isWritable: async () => false,
  };
  return resolved;
}

export async function storeBackend(): Promise<UniversityStoreBackend> {
  return (await resolveBackend()).backend;
}

export async function loadRuntimeArchive(): Promise<KnowledgeRecord[]> {
  return (await resolveBackend()).load();
}

export async function appendRuntimeRecords(
  newRecords: KnowledgeRecord[]
): Promise<{ records: KnowledgeRecord[]; persisted: boolean; evicted: number }> {
  return (await resolveBackend()).append(newRecords);
}

export async function replaceRuntimeRecords(
  departmentId: string,
  evolved: KnowledgeRecord[]
): Promise<{ records: KnowledgeRecord[]; persisted: boolean; evicted: number; kept: number }> {
  return (await resolveBackend()).replaceDepartment(departmentId, evolved);
}

export async function storeIsWritable(): Promise<boolean> {
  return (await resolveBackend()).isWritable();
}

export function runtimeArchivePath(): string {
  return storePath;
}

/** Test hook: drop the memoised backend and caches (never called in production paths). */
export function resetUniversityStoreForTests(): void {
  resolved = null;
  fileCache = null;
  memoryRecords = [];
}
