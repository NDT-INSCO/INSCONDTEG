import { PRACTICAL_TASKS, PracticalMethod, getPracticalTask } from '../data/practicalAssessment';

export const PPA_STORAGE_KEY = 'insco_practical_assessment_v1';

export type PPAScore = 0 | 1 | 2 | 3;
export type PPAOutcome = 'meets' | 'not_yet';

export interface PPACriterionScore {
  criterionId: string;
  score: PPAScore;
  comment?: string;
}

export interface PPARecord {
  id: string;
  taskId: string;
  method: PracticalMethod;
  /** Locally recorded candidate label — never an identity verification. */
  candidate: string;
  assessor: string;
  /** Assessor reference supplied by the supervising organisation (optional). */
  assessorRef: string;
  /** ISO date (YYYY-MM-DD). */
  performedOn: string;
  specimenId: string;
  procedureRef: string;
  scores: PPACriterionScore[];
  notes: string;
  /** Candidate/assessor acknowledgement of the record content. */
  declared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PPASummary {
  totalScore: number;
  maxScore: number;
  percent: number;
  criticalFailures: string[];
  outcome: PPAOutcome;
  complete: boolean;
  missingFields: string[];
}

const EMPTY_LIST: PPARecord[] = [];

const isScore = (value: unknown): value is PPAScore =>
  value === 0 || value === 1 || value === 2 || value === 3;

const cleanString = (value: unknown, max = 200): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

function sanitiseRecord(raw: unknown): PPARecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const task = typeof item.taskId === 'string' ? getPracticalTask(item.taskId) : undefined;
  if (!task) return null;

  const scores: PPACriterionScore[] = [];
  if (Array.isArray(item.scores)) {
    item.scores.forEach(entry => {
      if (!entry || typeof entry !== 'object') return;
      const row = entry as Record<string, unknown>;
      const criterionId = typeof row.criterionId === 'string' ? row.criterionId : '';
      if (!task.criteria.some(criterion => criterion.id === criterionId)) return;
      if (!isScore(row.score)) return;
      scores.push({
        criterionId,
        score: row.score,
        comment: cleanString(row.comment, 400) || undefined,
      });
    });
  }

  const method = task.method;
  const createdAt = cleanString(item.createdAt, 40);
  return {
    id: cleanString(item.id, 60) || `ppa-${Date.now().toString(36)}`,
    taskId: task.id,
    method,
    candidate: cleanString(item.candidate, 80),
    assessor: cleanString(item.assessor, 80),
    assessorRef: cleanString(item.assessorRef, 80),
    performedOn: isIsoDate(cleanString(item.performedOn, 10)) ? cleanString(item.performedOn, 10) : '',
    specimenId: cleanString(item.specimenId, 80),
    procedureRef: cleanString(item.procedureRef, 120),
    scores,
    notes: cleanString(item.notes, 2000),
    declared: item.declared === true,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: cleanString(item.updatedAt, 40) || createdAt || new Date().toISOString(),
  };
}

export function readPracticalAssessments(): PPARecord[] {
  try {
    const raw = localStorage.getItem(PPA_STORAGE_KEY);
    if (!raw) return [...EMPTY_LIST];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...EMPTY_LIST];
    return parsed
      .map(sanitiseRecord)
      .filter((record): record is PPARecord => Boolean(record));
  } catch {
    return [...EMPTY_LIST];
  }
}

function write(records: PPARecord[]): boolean {
  try {
    localStorage.setItem(PPA_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function summarise(record: PPARecord): PPASummary {
  const task = getPracticalTask(record.taskId);
  const criteria = task?.criteria ?? [];
  const scored = new Map(record.scores.map(row => [row.criterionId, row.score]));

  let totalScore = 0;
  const criticalFailures: string[] = [];
  let unanswered = 0;

  criteria.forEach(criterion => {
    const score = scored.get(criterion.id);
    if (score === undefined) {
      unanswered += 1;
      if (criterion.critical) criticalFailures.push(criterion.id);
      return;
    }
    totalScore += score;
    if (criterion.critical && score < 2) criticalFailures.push(criterion.id);
  });

  const maxScore = criteria.length * 3;
  const missingFields: string[] = [];
  if (!record.candidate) missingFields.push('candidate');
  if (!record.assessor) missingFields.push('assessor');
  if (!record.performedOn) missingFields.push('performedOn');
  if (!record.specimenId) missingFields.push('specimenId');
  if (unanswered > 0) missingFields.push('scores');
  if (!record.declared) missingFields.push('declaration');

  return {
    totalScore,
    maxScore,
    percent: maxScore ? Math.round((totalScore / maxScore) * 100) : 0,
    criticalFailures,
    outcome: criticalFailures.length === 0 && criteria.length > 0 ? 'meets' : 'not_yet',
    complete: missingFields.length === 0,
    missingFields,
  };
}

export function createPracticalAssessment(
  input: Omit<PPARecord, 'id' | 'method' | 'createdAt' | 'updatedAt'> & { id?: string }
): { record: PPARecord | null; error?: string } {
  const task = getPracticalTask(input.taskId);
  if (!task) return { record: null, error: 'unknown-task' };
  if (input.scores.length === 0) {
    return { record: null, error: 'no-scores' };
  }

  const now = new Date().toISOString();
  const record: PPARecord = {
    id: input.id || `ppa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    taskId: task.id,
    method: task.method,
    candidate: cleanString(input.candidate, 80),
    assessor: cleanString(input.assessor, 80),
    assessorRef: cleanString(input.assessorRef, 80),
    performedOn: isIsoDate(input.performedOn) ? input.performedOn : '',
    specimenId: cleanString(input.specimenId, 80),
    procedureRef: cleanString(input.procedureRef, 120),
    scores: input.scores
      .filter(row => task.criteria.some(criterion => criterion.id === row.criterionId) && isScore(row.score))
      .map(row => ({ criterionId: row.criterionId, score: row.score, comment: cleanString(row.comment, 400) || undefined })),
    notes: cleanString(input.notes, 2000),
    declared: input.declared === true,
    createdAt: now,
    updatedAt: now,
  };

  const existing = readPracticalAssessments();
  if (!write([record, ...existing])) return { record: null, error: 'storage-unavailable' };
  return { record };
}

export function deletePracticalAssessment(id: string): boolean {
  const next = readPracticalAssessments().filter(record => record.id !== id);
  return write(next);
}

export function resetPracticalAssessments(): boolean {
  return write([]);
}

/** Records grouped by method, with a count of complete (all fields + pass) rows. */
export function practicalStats(records = readPracticalAssessments()) {
  const byMethod: Record<string, number> = {};
  let complete = 0;
  let meets = 0;
  records.forEach(record => {
    byMethod[record.method] = (byMethod[record.method] || 0) + 1;
    const summary = summarise(record);
    if (summary.complete) complete += 1;
    if (summary.outcome === 'meets' && summary.complete) meets += 1;
  });
  return { total: records.length, complete, meets, byMethod, methodsCovered: Object.keys(byMethod).length };
}

/** Human-readable export; deliberately states what the file is NOT. */
export function exportPracticalAssessments(records = readPracticalAssessments()): string {
  const payload = {
    format: 'INSCO-PPA',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    notice:
      'Training practical assessment records. Not a certificate, not an accredited examination, and not evidence of competence outside the supervising organisation. Not issued by ASNT, ISO or any accrediting body.',
    disclaimerAr:
      'سجل تقييم عملي تدريبي. ليس شهادة ولا امتحاناً معتمداً ولا دليلاً على الكفاءة خارج المنظمة المشرفة. لا يصدر عن ASNT أو ISO أو أي جهة اعتماد.',
    tasks: PRACTICAL_TASKS.map(task => ({ id: task.id, method: task.method, title: task.title, criteria: task.criteria.length })),
    records: records.map(record => ({ ...record, summary: summarise(record) })),
  };
  return JSON.stringify(payload, null, 2);
}

export function isTaskId(value: string): boolean {
  return PRACTICAL_TASKS.some(task => task.id === value);
}
