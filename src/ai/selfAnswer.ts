/**
 * The self-reliant tutor: an answer composed from the library itself.
 *
 * The tutor used to depend on a Gemini key for everything: no key meant a
 * bare 503, and with it meant a model that can invent. This module is the
 * counter-design — the tutor answers from the same corpus the search box
 * and the book viewer use (132 documents), with no key, no network call and
 * no model. What it may not do is pretend to be one: it never invents words,
 * never cites an id the corpus does not contain, and never presents itself as
 * a generated answer. Everything it says is composed from corpus text.
 *
 * The thinking is honest too: it records the steps it actually took (analyse
 * the question → retrieve → pick the closest passage → compose from the
 * texts) and hands them to the caller as `steps`, so the reader can see how
 * the answer was reached rather than trusting a paragraph.
 */
import { tokenize, extractSnippet } from './search.js';
import type { SearchHit } from './search.js';
import type { TutorLanguage } from './contract.js';

export interface SelfAnswerInput {
  question: string;
  language: TutorLanguage;
  /** Retrieved hits (already filtered for confidence by the caller). */
  hits: SearchHit[];
  /** How many documents the library indexed — reported honestly. */
  corpusSize: number;
}

export interface SelfAnswer {
  /** The composed answer, ready to be streamed as-is. */
  text: string;
  /** The steps the answer actually took, in the reader's language. */
  steps: string[];
}

/** The passages that justify an answer follow it. Never more than this many. */
const MAX_RELATED = 2;

function clean(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function passageLabel(hit: SearchHit, ar: boolean): string {
  const document = hit.document;
  const title = clean(ar ? document.title.ar : document.title.en || document.title.ar);
  const section = clean(ar ? document.section.ar : document.section.en || document.section.ar);
  const where = document.pageNumber
    ? ar
      ? `صفحة ${document.pageNumber}`
      : `page ${document.pageNumber}`
    : clean(document.bookId);
  const parts = [title];
  if (section && section.toLowerCase() !== title.toLowerCase()) parts.push(section);
  parts.push(where);
  return parts.join(' · ');
}

/**
 * Compose the answer from retrieved hits only. Returns null when there is
 * nothing to answer from — the caller must then serve the honest decline.
 */
export function composeSelfAnswer({ question, language, hits, corpusSize }: SelfAnswerInput): SelfAnswer | null {
  const usable = (hits ?? []).filter(hit => hit && hit.document).slice(0, 1 + MAX_RELATED);
  if (!usable.length || corpusSize <= 0) return null;

  const ar = language === 'ar';
  const questionTerms = tokenize(question);
  const top = usable[0];
  const topSnippet = extractSnippet(
    ar ? top.document.text.ar : top.document.text.en || top.document.text.ar,
    questionTerms,
    420
  );
  const related = usable.slice(1).map(hit => passageLabel(hit, ar));

  const intro = ar
    ? `سؤالك: ${clean(question)}`
    : `Your question: ${clean(question)}`;

  const verdict = ar
    ? 'هذا إجابة مبنية على مكتبة إنسكو نفسها (بدون مفتاح نموذج): أجب عن سؤالك من المقاطع الأقرب، لا من تخمين.'
    : 'This is an answer composed from the INSCO library itself (no model key): it answers from the closest passages, not from a guess.';

  const topHeading = passageLabel(top, ar);
  const relatedBlock =
    related.length > 0
      ? (ar ? '\n\nومقاطع أخرى ذات صلة:\n' : '\n\nRelated passages:\n') +
        related.map(line => (ar ? `— ${line}` : `— ${line}`)).join('\n')
      : '';

  const limits = ar
    ? '\n\nهذه إجابة مستخرجة من نصوص المكتبة لا توليد من نموذج؛ ليست تقييمًا فنيًا ولا قرارًا تشغيليًا — تأكّد من المصدر الأصلي عند التطبيق.'
    : '\n\nThis is an answer extracted from library texts, not a model generation; it is not a technical assessment or an operating decision — check the original source before acting.';

  const text = [intro, '', verdict, '', topHeading, `«${topSnippet}»`, relatedBlock, limits]
    .filter(part => part !== '')
    .join('\n');

  const steps: string[] = ar
    ? [
        `حلل السؤال: ${questionTerms.length} كلمة رئيسية`,
        `بحث في المكتبة (${corpusSize} وثيقة) — ${usable.length} مقطع طابق`,
        `اختر المقطع الأقرب: ${passageLabel(top, ar)}`,
        'صيغ الإجابة من النصوص نفسها — بدون مفتاح نموذج',
      ]
    : [
        `Analysed the question: ${questionTerms.length} core terms`,
        `Searched the library (${corpusSize} documents) — ${usable.length} passage(s) matched`,
        `Picked the closest passage: ${passageLabel(top, ar)}`,
        'Composed the answer from the texts themselves — no model key',
      ];

  return { text, steps };
}
