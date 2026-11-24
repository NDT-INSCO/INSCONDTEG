/**
 * The runtime-record contract shared by every university archive backend
 * (Firestore · JSON file · in-memory). A record that fails this check never
 * leaves the store, so a poisoned archive — on disk or in Firestore — cannot
 * inject script or non-HTTPS citations into the UI.
 */
import {
  normaliseKnowledgeRecord,
  type KnowledgeRecord,
} from '../../src/data/universityKnowledge.js';

/** Hard cap on archive size — protects both free tiers and the UI. */
export const RUNTIME_RECORD_CAP = 500;

export function isValidRuntimeRecord(raw: unknown): raw is KnowledgeRecord {
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

export function cleanRuntimeRecords(raw: unknown[]): KnowledgeRecord[] {
  return raw.filter(isValidRuntimeRecord).slice(0, RUNTIME_RECORD_CAP);
}

/** Runtime records whose seed counterpart exists are rewritten to live ids on merge. */
export function asRuntimeId(record: KnowledgeRecord): KnowledgeRecord {
  if (record.id.includes('-live-')) return record;
  return { ...record, id: record.id.replace(/^kb-/, 'kb-live-') };
}
