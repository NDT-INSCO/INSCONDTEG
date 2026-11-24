import type { DashboardData } from './contract';

export const FACTORY_DRAFT_PATH = '/factory/draft';
export const FACTORY_LIMITS = { brief: 1400, language: 40, cells: 8, code: 10_000, requestMs: 26_000 } as const;
export const FACTORY_TASKS = ['inbox', 'announcement', 'custom'] as const;
export const FACTORY_OUTPUTS = ['scenario', 'block', 'bot', 'neuron'] as const;
export const FACTORY_TRIGGERS = ['manual', 'daily', 'snapshot'] as const;
export const FACTORY_CELLS = ['input', 'rule', 'neuron', 'draft'] as const;

export type FactoryTask = (typeof FACTORY_TASKS)[number];
export type FactoryOutput = (typeof FACTORY_OUTPUTS)[number];
export type FactoryTrigger = (typeof FACTORY_TRIGGERS)[number];
export type FactoryCellKind = (typeof FACTORY_CELLS)[number];
export type FactoryLocale = 'ar' | 'en';

export interface FactoryRequest {
  task: FactoryTask;
  output: FactoryOutput;
  trigger: FactoryTrigger;
  locale: FactoryLocale;
  language: string;
  brief: string;
  cells: FactoryCellKind[];
  includeSnapshot: boolean;
}

export interface FactoryStep {
  kind: FactoryCellKind;
  label: string;
}

/** The only shape a model may return. Text and code are never executable here. */
export interface FactoryDraft {
  title: string;
  summary: string;
  steps: FactoryStep[];
  code: string | null;
  checks: string[];
}

export interface FactorySnapshot {
  capturedAt: string;
  newRequests: number;
  inProgress: number;
  overdue: number;
  announcementEnabled: boolean;
}

/** Copy only aggregates. Never pass quote records, contacts, or announcement text. */
export function factorySnapshot(data: Pick<DashboardData, 'totals' | 'updatedAt'> & {
  announcement: Pick<DashboardData['announcement'], 'enabled'>;
}): FactorySnapshot {
  return {
    capturedAt: data.updatedAt,
    newRequests: data.totals.new,
    inProgress: data.totals.in_progress,
    overdue: data.totals.overdue,
    announcementEnabled: data.announcement.enabled,
  };
}

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const oneOf = <T extends string>(values: readonly T[], value: unknown): value is T => values.some(v => v === value);
const text = (value: unknown, maximum: number, minimum = 1) =>
  typeof value === 'string' && value.length <= maximum && value.trim().length >= minimum && !value.includes('\0') ? value.trim() : null;

export function normaliseFactoryRequest(value: unknown, requireBrief = true): FactoryRequest | null {
  const raw = record(value);
  if (!raw || !oneOf(FACTORY_TASKS, raw.task) || !oneOf(FACTORY_OUTPUTS, raw.output)
    || !oneOf(FACTORY_TRIGGERS, raw.trigger) || !oneOf(['ar', 'en'] as const, raw.locale)
    || typeof raw.includeSnapshot !== 'boolean') return null;
  const language = text(raw.language, FACTORY_LIMITS.language);
  const brief = text(raw.brief, FACTORY_LIMITS.brief, requireBrief ? 8 : 0);
  if (!language || !/^[\p{L}\p{N}][\p{L}\p{N} +#._()-]*$/u.test(language) || brief === null) return null;
  if (!Array.isArray(raw.cells) || !raw.cells.length || raw.cells.length > FACTORY_LIMITS.cells
    || !raw.cells.every(kind => oneOf(FACTORY_CELLS, kind))) return null;
  return { task: raw.task, output: raw.output, trigger: raw.trigger, locale: raw.locale, language, brief, includeSnapshot: raw.includeSnapshot, cells: [...raw.cells] };
}

export function normaliseFactoryDraft(value: unknown): FactoryDraft | null {
  const raw = record(value);
  if (!raw || !Array.isArray(raw.steps) || raw.steps.length > FACTORY_LIMITS.cells
    || !Array.isArray(raw.checks) || raw.checks.length < 1 || raw.checks.length > 6) return null;
  const title = text(raw.title, 120);
  const summary = text(raw.summary, 1300);
  const code = raw.code;
  // Validate that it contains something, but preserve significant whitespace in code drafts.
  if (!title || !summary || (code !== null && (typeof code !== 'string' || !text(code, FACTORY_LIMITS.code)))) return null;
  const steps: FactoryStep[] = [];
  for (const value of raw.steps) {
    const step = record(value);
    const label = text(step?.label, 100);
    if (!step || !label || !oneOf(FACTORY_CELLS, step.kind)) return null;
    steps.push({ kind: step.kind, label });
  }
  const checks: string[] = [];
  for (const value of raw.checks) {
    const check = text(value, 240);
    if (!check) return null;
    checks.push(check);
  }
  return { title, summary, steps, code, checks };
}

export interface FactoryNeuron { queueWeight: number; delayWeight: number; bias: number; threshold: number }
export const DEFAULT_FACTORY_NEURON: Readonly<FactoryNeuron> = { queueWeight: 1, delayWeight: 2, bias: -1, threshold: .6 };
export interface FactoryCell extends FactoryStep { id: string; neuron?: FactoryNeuron }
export const FACTORY_CELL_COPY: Record<FactoryCellKind | 'review', { ar: string; en: string }> = {
  input: { ar: 'قراءة الإشارة', en: 'Read signal' },
  rule: { ar: 'قاعدة متابعة', en: 'Follow-up rule' },
  neuron: { ar: 'خلية عصبية', en: 'Neural cell' },
  draft: { ar: 'إعداد مسودة داخلية', en: 'Prepare internal draft' },
  review: { ar: 'مراجعة واعتماد بشري', en: 'Human review' },
};

const clamp = (value: number, fallback: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));

/** A tiny, untrained educational neuron; its score never drives live actions. */
export function scoreFactoryNeuron(config: FactoryNeuron, queue: number, delay: number) {
  const sum = clamp(queue, 0, 0, 1) * clamp(config.queueWeight, 1, -3, 3)
    + clamp(delay, 0, 0, 1) * clamp(config.delayWeight, 2, -3, 3)
    + clamp(config.bias, -1, -3, 3);
  const score = 1 / (1 + Math.exp(-sum));
  return { score, recommendReview: score >= clamp(config.threshold, .6, 0, 1) };
}

export const FACTORY_SAMPLES = {
  quiet: { newRequests: 1, overdue: 0, announcementEnabled: false },
  busy: { newRequests: 7, overdue: 3, announcementEnabled: true },
} as const;
export type FactorySample = keyof typeof FACTORY_SAMPLES;
export type FactoryTrace = {
  id: string;
  state: 'read' | 'flagged' | 'clear' | 'drafted' | 'no_input' | 'review';
  score?: number;
};

/** Interpret only built-in, pure cells against fixed sample data. Never eval draft code. */
export function simulateFactory(cells: readonly FactoryCell[], task: FactoryTask, sample: FactorySample): FactoryTrace[] {
  const values = FACTORY_SAMPLES[sample];
  let signalRead = false;
  const trace: FactoryTrace[] = cells.map(cell => {
    if (cell.kind === 'input') {
      signalRead = true;
      return { id: cell.id, state: 'read' };
    }
    if (!signalRead) return { id: cell.id, state: 'no_input' };
    if (cell.kind === 'rule') {
      const flagged = task === 'announcement' ? values.announcementEnabled : values.overdue > 0;
      return { id: cell.id, state: flagged ? 'flagged' : 'clear' };
    }
    if (cell.kind === 'neuron') {
      const result = scoreFactoryNeuron(cell.neuron ?? DEFAULT_FACTORY_NEURON, values.newRequests / 10, values.overdue / 5);
      return { id: cell.id, state: result.recommendReview ? 'flagged' : 'clear', score: result.score };
    }
    return { id: cell.id, state: 'drafted' };
  });
  return [...trace, { id: 'review', state: 'review' }];
}

export function factoryBundle(request: FactoryRequest, cells: readonly FactoryCell[], draft: FactoryDraft, source: 'template' | 'ai') {
  const { includeSnapshot: _includeSnapshot, cells: _cellKinds, ...brief } = request;
  const workflow = cells.map((cell, i) => ({ ...cell, dependsOn: i ? [cells[i - 1].id] : [] }));
  return {
    schemaVersion: 1,
    status: 'draft',
    execution: 'disabled',
    requiresHumanReview: true,
    source,
    brief,
    ...(request.output === 'bot' ? { bot: { trigger: request.trigger, input: request.task, mode: 'manual-review-only' } } : {}),
    workflow: [...workflow, { id: 'review', kind: 'review', label: FACTORY_CELL_COPY.review[request.locale], dependsOn: cells.length ? [cells[cells.length - 1].id] : [] }],
    draft,
  };
}
