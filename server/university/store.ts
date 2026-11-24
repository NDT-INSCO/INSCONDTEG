/**
 * Runtime archive persistence for the Robotic University — a small JSON store
 * for knowledge records collected live from the internet or evolved by the
 * neural cells. The reviewed seed ships inside the bundle
 * (`src/data/universitySeed.ts`) and is read directly; this store only holds
 * what the platform itself produced at runtime.
 *
 * Design rules:
 *   - atomic write (tmp + rename), tolerant reads (corrupt file ⇒ empty store,
 *     error logged, never a crash);
 *   - every record read back is re-validated — a poisoned archive file cannot
 *     inject script or non-HTTPS links into the UI;
 *   - on hosts without a writable disk (e.g. serverless), writes fail loudly
 *     and callers report `persisted: false` instead of pretending success.
 */
import { accessSync, constants, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  normaliseKnowledgeRecord,
  type KnowledgeRecord,
} from '../../src/data/universityKnowledge.js';

export const RUNTIME_RECORD_CAP = 500;

const storePath =
  (process.env.UNIVERSITY_ARCHIVE_PATH || '').trim() ||
  path.join(process.cwd(), '.admin-data', 'university-archive.json');

let cache: KnowledgeRecord[] | null = null;

function isValidRuntimeRecord(raw: unknown): raw is KnowledgeRecord {
  if (!raw || typeof raw !== 'object') return false;
  const record = raw as Record<string, unknown>;
  const departmentId = typeof record.departmentId === 'string' ? record.departmentId : '';
  const normalised = normaliseKnowledgeRecord(
    {
      titleAr: record.titleAr,
      titleEn: record.titleEn,
      summaryAr: record.summaryAr,
      summaryEn: record.summaryEn,
      keyPointsAr: record.keyPointsAr,
      keyPointsEn: record.keyPointsEn,
      formula: record.formula,
      sources: record.sources,
    },
    { departmentId, collectedBy: 'archive-load', nowIso: '2026-01-01T00:00:00.000Z' }
  );
  if (!normalised) return false;
  return (
    typeof record.id === 'string' &&
    typeof record.code === 'string' &&
    (record.status === 'reviewed' || record.status === 'pending-review') &&
    typeof record.version === 'number' &&
    Array.isArray(record.evolvedBy)
  );
}

export function loadRuntimeArchive(): KnowledgeRecord[] {
  if (cache) return cache;
  try {
    if (!existsSync(storePath)) {
      cache = [];
      return cache;
    }
    const parsed = JSON.parse(readFileSync(storePath, 'utf8')) as unknown;
    const records = Array.isArray(parsed) ? parsed : [];
    cache = records.filter(isValidRuntimeRecord).slice(0, RUNTIME_RECORD_CAP);
    return cache;
  } catch (error) {
    console.error('[university] runtime archive unreadable, starting empty:', error);
    cache = [];
    return cache;
  }
}

export interface SaveResult {
  records: KnowledgeRecord[];
  persisted: boolean;
  evicted: number;
}

function save(records: KnowledgeRecord[]): SaveResult {
  const trimmed = records.slice(-RUNTIME_RECORD_CAP);
  const evicted = records.length - trimmed.length;
  try {
    mkdirSync(path.dirname(storePath), { recursive: true });
    const tmp = `${storePath}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify(trimmed, null, 2), 'utf8');
    renameSync(tmp, storePath);
    cache = trimmed;
    return { records: trimmed, persisted: true, evicted };
  } catch (error) {
    console.error('[university] runtime archive not writable on this host:', error);
    cache = trimmed; // keep serving the in-memory copy for this process
    return { records: trimmed, persisted: false, evicted };
  }
}

/** Append new runtime records (collector output). */
export function appendRuntimeRecords(newRecords: KnowledgeRecord[]): SaveResult {
  const current = loadRuntimeArchive();
  return save([...current, ...newRecords]);
}

/** Replace the runtime records of one department with evolved ones. */
export function replaceRuntimeRecords(
  departmentId: string,
  evolved: KnowledgeRecord[]
): SaveResult & { kept: number } {
  const current = loadRuntimeArchive();
  const kept = current.filter(record => record.departmentId !== departmentId);
  const result = save([...kept, ...evolved]);
  return { ...result, kept: kept.length };
}

/** Runtime records whose seed counterpart exists are rewritten to live ids on merge. */
export function asRuntimeId(record: KnowledgeRecord): KnowledgeRecord {
  if (record.id.includes('-live-')) return record;
  return { ...record, id: record.id.replace(/^kb-/, 'kb-live-') };
}

/** True when the host allows writing the archive (probed, cheap). */
export function storeIsWritable(): boolean {
  try {
    mkdirSync(path.dirname(storePath), { recursive: true });
    accessSync(path.dirname(storePath), constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function runtimeArchivePath(): string {
  return storePath;
}
