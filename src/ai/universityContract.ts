/**
 * The wire contract for «جامعة إنسكو الروبوتية» — shared verbatim by the
 * Express gateway (`server/university/gateway.ts`), the browser client
 * (`src/ai/universityClient.ts`) and the tests. Keep it dependency-free.
 *
 * Honesty contract baked into the shapes:
 *   - every dynamic response says whether it came from the live AI gateway
 *     (`mode: 'live'`), from the offline reviewed seed (`mode: 'seed'`), or
 *     was refused/unavailable (`error`);
 *   - collected knowledge is always `pending-review`;
 *   - numbers are derived, never typed in.
 */
import { isUniversityDepartmentId, isPlatformAgentTarget, type UniversityLanguage } from '../data/university.js';
import type { LabTeachingPack } from '../data/universityKnowledge.js';

export const UNIVERSITY_ENDPOINTS = {
  status: '/api/university/status',
  archive: '/api/university/archive',
  collect: '/api/university/collect',
  synthesize: '/api/university/synthesize',
  organize: '/api/university/organize',
  teach: '/api/university/lab/teach',
} as const;

export const UNIVERSITY_LIMITS = {
  maxQueryLength: 400,
  maxRecordsReturned: 8,
  /** Server-side guard: never let one call ask a model for more than this. */
  maxRequestBytes: 16 * 1024,
} as const;

/* ------------------------------- status --------------------------------- */

export type UniversityMode = 'live' | 'seed' | 'unreachable' | 'not_configured';

export interface UniversityStatus {
  /** True when an AI gateway (GEMINI_API_KEY) is configured on the server. */
  configured: boolean;
  mode: UniversityMode;
  model: string | null;
  /** How many records the runtime archive holds right now (seed excluded). */
  runtimeRecords: number;
  version: string;
}

export interface UniversityErrorBody {
  error: { code: string; message: string };
}

/* ------------------------------ collect ---------------------------------- */

export interface UniversityCollectRequest {
  departmentId: string;
  /** Optional focus, e.g. "حماية كاثودية للأنابيب المدفونة". */
  query?: string;
  /** Which collector robot runs the mission (defaults to the research collector). */
  collectorId?: string;
  language: UniversityLanguage;
}

export type UniversityCollectMode = 'live' | 'seed';

export interface UniversityCollectedRecordPayload {
  id: string;
  departmentId: string;
  code: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  keyPointsAr: string[];
  keyPointsEn: string[];
  formula?: string;
  sources: { title: string; publisher: string; url: string }[];
  status: 'reviewed' | 'pending-review';
  version: number;
  collectedBy: string;
  evolvedBy: string[];
  updatedAt: string;
}

export interface UniversityCollectResponse {
  ok: true;
  mode: UniversityCollectMode;
  departmentId: string;
  collectorId: string;
  /** True when the records were persisted to the server-side runtime archive. */
  persisted: boolean;
  message: { ar: string; en: string };
  records: UniversityCollectedRecordPayload[];
}

/* ----------------------------- synthesize -------------------------------- */

export interface UniversitySynthesizeRequest {
  departmentId: string;
  language: UniversityLanguage;
}

export interface UniversitySynthesizeResponse {
  ok: true;
  mode: UniversityCollectMode;
  departmentId: string;
  cellId: string;
  mergedCount: number;
  persisted: boolean;
  message: { ar: string; en: string };
  records: UniversityCollectedRecordPayload[];
  changes: {
    recordId: string;
    kind: 'merged' | 'held-for-review' | 'untouched';
    detailAr: string;
    detailEn: string;
  }[];
}

/* ------------------------------ organize --------------------------------- */

export interface UniversityOrganizeRequest {
  language: UniversityLanguage;
}

export interface UniversityOrganizeResponse {
  ok: true;
  message: { ar: string; en: string };
  stats: {
    total: number;
    reviewed: number;
    pendingReview: number;
    avgCompleteness: number;
    validHttpsSources: number;
    byDepartment: {
      departmentId: string;
      code: string;
      ar: string;
      total: number;
      reviewed: number;
      pendingReview: number;
      avgCompleteness: number;
    }[];
  };
  actions: {
    kind: string;
    recordId: string;
    detailAr: string;
    detailEn: string;
  }[];
  codesAssigned: number;
  codesKept: number;
}

/* -------------------------------- teach ---------------------------------- */

export interface UniversityTeachRequest {
  departmentId: string;
  targetId: string;
  language: UniversityLanguage;
}

export interface UniversityTeachResponse {
  ok: true;
  mode: UniversityCollectMode;
  pack: LabTeachingPack;
}

/* -------------------------------- archive -------------------------------- */

export interface UniversityArchiveResponse {
  ok: true;
  /** Records collected/evolved at runtime — the reviewed seed is bundled separately. */
  records: UniversityCollectedRecordPayload[];
  persisted: boolean;
}

/* ------------------------------ normalisers ------------------------------ */

function cleanLanguage(value: unknown): UniversityLanguage {
  return value === 'en' ? 'en' : 'ar';
}

export function normaliseCollectRequest(raw: unknown): UniversityCollectRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const input = raw as Record<string, unknown>;
  const departmentId = typeof input.departmentId === 'string' ? input.departmentId.trim() : '';
  if (!isUniversityDepartmentId(departmentId)) return null;
  const query =
    typeof input.query === 'string' && input.query.trim()
      ? input.query.trim().slice(0, UNIVERSITY_LIMITS.maxQueryLength)
      : undefined;
  const collectorId =
    typeof input.collectorId === 'string' && input.collectorId.trim()
      ? input.collectorId.trim().slice(0, 96)
      : undefined;
  return { departmentId, query, collectorId, language: cleanLanguage(input.language) };
}

export function normaliseSynthesizeRequest(raw: unknown): UniversitySynthesizeRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const input = raw as Record<string, unknown>;
  const departmentId = typeof input.departmentId === 'string' ? input.departmentId.trim() : '';
  if (!isUniversityDepartmentId(departmentId)) return null;
  return { departmentId, language: cleanLanguage(input.language) };
}

export function normaliseOrganizeRequest(raw: unknown): UniversityOrganizeRequest | null {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { language: cleanLanguage(input.language) };
}

export function normaliseTeachRequest(raw: unknown): UniversityTeachRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const input = raw as Record<string, unknown>;
  const departmentId = typeof input.departmentId === 'string' ? input.departmentId.trim() : '';
  const targetId = typeof input.targetId === 'string' ? input.targetId.trim() : '';
  if (!isUniversityDepartmentId(departmentId) || !isPlatformAgentTarget(targetId)) return null;
  return { departmentId, targetId, language: cleanLanguage(input.language) };
}
