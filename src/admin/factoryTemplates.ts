import { DEFAULT_FACTORY_NEURON, FACTORY_CELL_COPY } from './factory';
import type { FactoryCell, FactoryDraft, FactoryLocale, FactoryNeuron, FactoryOutput, FactoryRequest, FactoryTask } from './factory';

export const FACTORY_TASK_COPY = {
  inbox: { ar: 'متابعة طلبات الأسعار', en: 'Quote follow-up' },
  announcement: { ar: 'مراجعة إعلان الموقع', en: 'Site announcement review' },
  custom: { ar: 'مهمة مخصّصة', en: 'Custom task' },
} as const;

export const FACTORY_OUTPUT_COPY: Record<FactoryOutput, { ar: string; en: string }> = {
  scenario: { ar: 'سيناريو', en: 'Scenario' },
  block: { ar: 'بلوك كود', en: 'Code block' },
  bot: { ar: 'مخطط روبوت', en: 'Bot blueprint' },
  neuron: { ar: 'خلية عصبية', en: 'Neural cell' },
};

export const FACTORY_TRIGGER_COPY = {
  manual: { ar: 'بطلب من المشرف', en: 'Staff request' },
  daily: { ar: 'متابعة يومية مقترحة', en: 'Suggested daily review' },
  snapshot: { ar: 'عند مراجعة لقطة جديدة', en: 'When reviewing a new snapshot' },
} as const;

/** Each offline snippet is a pure, input-driven threshold check. No I/O or connections. */
const BLOCKS = {
  TypeScript: `export function needsReview(signal: number, threshold = 1): boolean {
  return Number.isFinite(signal) && signal >= threshold;
}
`,
  JavaScript: `export function needsReview(signal, threshold = 1) {
  return Number.isFinite(signal) && signal >= threshold;
}
`,
  Python: `from math import isfinite


def needs_review(signal: float, threshold: float = 1.0) -> bool:
    return isfinite(signal) and signal >= threshold
`,
  Go: `package review

import "math"

func NeedsReview(signal, threshold float64) bool {
    return !math.IsInf(signal, 0) && !math.IsNaN(signal) && signal >= threshold
}
`,
  Rust: `pub fn needs_review(signal: f64, threshold: f64) -> bool {
    signal.is_finite() && signal >= threshold
}
`,
  Java: `final class Review {
    static boolean needsReview(double signal, double threshold) {
        return Double.isFinite(signal) && signal >= threshold;
    }
}
`,
  'C#': `public static class Review {
    public static bool NeedsReview(double signal, double threshold = 1) =>
        double.IsFinite(signal) && signal >= threshold;
}
`,
  'C++': `#include <cmath>

bool needs_review(double signal, double threshold = 1) {
    return std::isfinite(signal) && signal >= threshold;
}
`,
  PHP: `<?php
function needsReview(float $signal, float $threshold = 1.0): bool {
    return is_finite($signal) && $signal >= $threshold;
}
`,
  Ruby: `def needs_review?(signal, threshold = 1)
  signal.is_a?(Numeric) && signal.finite? && signal >= threshold
end
`,
  Kotlin: `fun needsReview(signal: Double, threshold: Double = 1.0): Boolean =
    signal.isFinite() && signal >= threshold
`,
  Swift: `func needsReview(_ signal: Double, threshold: Double = 1) -> Bool {
    signal.isFinite && signal >= threshold
}
`,
  'SQL (SQLite)': `-- Bind both parameters as numbers. Read-only: no table is modified.
SELECT CASE WHEN :signal >= :threshold THEN 1 ELSE 0 END AS needs_review;
`,
} as const;

export const FACTORY_LANGUAGES = Object.keys(BLOCKS) as (keyof typeof BLOCKS)[];

export function starterCells(task: FactoryTask): FactoryCell[] {
  const kinds = task === 'custom' ? ['input', 'neuron', 'draft'] as const : ['input', 'rule', 'draft'] as const;
  return kinds.map((kind, index) => ({ id: `starter-${index}`, kind, label: '', ...(kind === 'neuron' ? { neuron: { ...DEFAULT_FACTORY_NEURON } } : {}) }));
}

export const cellLabel = (cell: FactoryCell, locale: FactoryLocale) => cell.label.trim() || FACTORY_CELL_COPY[cell.kind][locale];

function neuronBlock(language: string, { queueWeight, delayWeight, bias, threshold }: FactoryNeuron): string | null {
  // These defaults come from bounded number inputs; no user text is interpolated into code.
  const n = (value: number, fallback: number, min: number, max: number) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  const wq = n(queueWeight, 1, -3, 3);
  const wd = n(delayWeight, 2, -3, 3);
  const b = n(bias, -1, -3, 3);
  const t = n(threshold, .6, 0, 1);
  if (language === 'Python') return `from math import exp, isfinite


def unit(value: float) -> float:
    return min(1, max(0, value)) if isfinite(value) else 0


def neuron(queue: float, delay: float) -> tuple[float, bool]:
    weighted = (${wq}) * unit(queue) + (${wd}) * unit(delay) + (${b})
    score = 1 / (1 + exp(-weighted))
    return score, score >= ${t}
`;
  if (language === 'TypeScript' || language === 'JavaScript') {
    const type = language === 'TypeScript' ? ': number' : '';
    return `const unit = (x${type}) => Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;

export function neuron(queue${type}, delay${type}) {
  const weighted = (${wq}) * unit(queue) + (${wd}) * unit(delay) + (${b});
  const score = 1 / (1 + Math.exp(-weighted));
  return { score, recommendReview: score >= ${t} };
}
`;
  }
  return null;
}

export function localFactoryDraft(request: FactoryRequest, cells: readonly FactoryCell[]): FactoryDraft {
  const { task, output, locale } = request;
  const ar = locale === 'ar';
  const signal = task === 'announcement'
    ? (ar ? 'حالة إظهار الإعلان (٠ أو ١)' : 'announcement visibility (0 or 1)')
    : task === 'inbox' ? (ar ? 'عدد الطلبات المتأخرة' : 'the overdue count') : (ar ? 'إشارة رقمية تجريبية' : 'a sample numeric signal');
  const readSignal = `${ar ? 'المدخل المقترح:' : 'Proposed input:'} ${signal}.`;
  const summary = {
    scenario: `${readSignal} ${ar ? 'رتّب خطوات القراءة والمتابعة وإعداد المسودة، ثم اعرض النتيجة على المشرف.' : 'Arrange the read, follow-up and draft steps, then present the result to a reviewer.'}`,
    block: `${readSignal} ${ar ? 'البلوك يأخذ رقمًا وعتبة ويرجع نتيجة منطقية، من غير اتصال أو تغيير بيانات.' : 'The block takes a number and a threshold and returns a boolean, without connecting to a service or changing data.'}`,
    bot: `${readSignal} ${ar ? 'استخدم بلوك الفرز لتحديد هل يلزم اقتراح تقرير داخلي. المشرف يراجع التقرير؛ المحفّز وصف فقط ولا يرسل شيء تلقائيًا.' : 'Use the starter rule to decide whether to propose an internal follow-up report. Staff review the report; the trigger is descriptive and sends nothing automatically.'}`,
    neuron: ar ? 'خلية رقمية تعليمية تجمع الإشارات بالأوزان وتحسب درجة بين ٠ و١. ليست نموذجًا مدرّبًا ولا تتخذ قرارات في الموقع.' : 'An educational neuron combines weighted inputs into a score between 0 and 1. It is not trained and does not make site decisions.',
  }[output];
  const code = output === 'scenario' ? null : output === 'neuron'
    ? neuronBlock(request.language, cells.find(cell => cell.kind === 'neuron')?.neuron ?? DEFAULT_FACTORY_NEURON)
    : Object.prototype.hasOwnProperty.call(BLOCKS, request.language) ? BLOCKS[request.language as keyof typeof BLOCKS].trimEnd() : null;
  return {
    title: `${FACTORY_OUTPUT_COPY[output][locale]} · ${FACTORY_TASK_COPY[task][locale]}`,
    summary,
    steps: cells.map(cell => ({ kind: cell.kind, label: cellLabel(cell, locale) })),
    code,
    checks: ar
      ? ['جرّب حالة عادية وحالة تحتاج متابعة ببيانات اصطناعية.', 'تأكد أن الخرج مقترح داخلي فقط وأن آخر خطوة للمشرف.', 'افحص الكود في بيئة اختبار منفصلة قبل أي استخدام فعلي.']
      : ['Try one quiet and one follow-up case on synthetic inputs.', 'Verify that the result is internal and the last step is for staff review.', 'Review and test the code separately before real use.'],
  };
}
