/**
 * Text plumbing for the local brain.
 *
 * Nothing here calls a model: the brain composes answers out of the library it already
 * has. That makes the quality of these few functions the quality of the product, so they
 * are deliberately conservative — a sentence is only used when it is a real sentence from
 * a real passage, and it is dropped when it is a heading, a page number, or boilerplate.
 *
 * Isomorphic on purpose (no Node, no DOM): the same composer runs in the gateway and in
 * a future offline worker without a second implementation.
 */
import { tokenize } from '../search.js';

/** A passage is split on line breaks *and* sentence terminators, in both scripts. */
const SENTENCE_SPLIT = /(?<=[.!?؟])\s+|\n+/;

/** List markers, numbering and bullet glyphs a passage may carry. */
const LEADING_MARKER = /^\s*(?:[-•*·–—]|\(?\d{1,2}[.)])?\s*/;

/** Boilerplate the composer must never present as an answer. */
const BOILERPLATE = [
  /اختبر استيعابك/i,
  /verify your technical mastery/i,
  /أسئلة مراجعة/i,
  /review exam/i,
  /ما الذي تضيفه التقنيات المتقدمة/i,
];

const QUESTION_END = /[?؟]\s*$/;
/** A line that ends with a colon is a label for what follows, not an answer. */
const HEADING_END = /[:：]\s*$/;

export function isHeading(sentence: string): boolean {
  return HEADING_END.test(sentence);
}

/** Clean a fragment without changing its wording. */
export function cleanSentence(raw: string): string {
  return raw
    .replace(LEADING_MARKER, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBoilerplate(sentence: string): boolean {
  return BOILERPLATE.some(pattern => pattern.test(sentence));
}

/**
 * Split a passage into sentences that can stand alone in an answer.
 *
 * Headings ("2. المبدأ الفيزيائي") are kept: they are the only structure some pages have,
 * and a bullet that starts with a heading reads correctly. A fragment with fewer than
 * three words is not a sentence and never becomes one.
 */
export function sentencesOf(text: string): string[] {
  if (!text) return [];
  return text
    .split(SENTENCE_SPLIT)
    .map(cleanSentence)
    .filter(sentence => sentence.length > 0)
    .filter(sentence => tokenize(sentence).length >= 3);
}

export function isQuestion(sentence: string): boolean {
  return QUESTION_END.test(sentence);
}

/** Term overlap, used to deduplicate two passages that say the same thing. */
export function similarity(left: string, right: string): number {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

export interface ScoredSentence {
  sentence: string;
  /** Corpus id of the passage the sentence came from — this is the citation. */
  sourceId: string;
  score: number;
  /** Position inside the passage, so related sentences keep their order. */
  order: number;
  question: boolean;
}

export interface SentencePickOptions {
  /** Terms from the question; a sentence that uses them is worth more. */
  terms?: string[];
  /** Keep questions (a practice answer needs the question itself). */
  allowQuestions?: boolean;
  /** Keep labels that end with a colon; off by default — they are not answers. */
  allowHeadings?: boolean;
  limit?: number;
  /** Drop sentences shorter than this — one-word fragments help nobody. */
  minChars?: number;
}

/**
 * Pick the sentences that answer a question, from ranked passages.
 *
 * Ranking is intentionally simple and inspectable: coverage of the question's words
 * first, then a length sweet spot (a 4-word heading is a label, a 400-character
 * paragraph is a wall), then the passage's own BM25 score as a tie-break.
 */
export function pickSentences(
  passages: Array<{ id: string; text: string; score: number }>,
  options: SentencePickOptions = {}
): ScoredSentence[] {
  const terms = options.terms ?? [];
  const allowQuestions = options.allowQuestions ?? false;
  const allowHeadings = options.allowHeadings ?? false;
  const minChars = options.minChars ?? 45;
  const termSet = new Set(terms);
  const picked: ScoredSentence[] = [];

  passages.forEach((passage, passageIndex) => {
    sentencesOf(passage.text).forEach((sentence, order) => {
      if (isBoilerplate(sentence)) return;
      if (!allowHeadings && isHeading(sentence)) return;
      const question = isQuestion(sentence);
      if (question && !allowQuestions) return;
      if (!question && sentence.length < minChars) return;

      const tokens = tokenize(sentence);
      let hits = 0;
      for (const token of tokens) if (termSet.has(token)) hits += 1;
      const coverage = termSet.size ? hits / termSet.size : 0;
      // Sweet spot: informative but readable.
      const lengthScore = sentence.length < 90 ? 0.35 : sentence.length < 320 ? 1 : 0.72;
      const positionPenalty = order === 0 ? 0 : Math.min(0.15, order * 0.01);
      const questionPenalty = question ? 0.25 : 0;
      const score =
        coverage * 3 +
        lengthScore +
        Math.min(1.5, passage.score / 25) -
        positionPenalty -
        questionPenalty -
        passageIndex * 0.05;

      picked.push({ sentence, sourceId: passage.id, score, order, question });
    });
  });

  picked.sort((left, right) => right.score - left.score || left.order - right.order);
  return dropNearDuplicates(picked).slice(0, options.limit ?? 8);
}

/** Two passages in this corpus often repeat a sentence; the reader needs it once. */
function dropNearDuplicates(sentences: ScoredSentence[]): ScoredSentence[] {
  const kept: ScoredSentence[] = [];
  for (const candidate of sentences) {
    if (kept.some(existing => similarity(existing.sentence, candidate.sentence) > 0.72)) continue;
    kept.push(candidate);
  }
  return kept;
}

/** "PAUT و TOFD" style lists: join with the right conjunction for the language. */
export function joinList(items: string[], language: 'ar' | 'en'): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  const conjunction = language === 'ar' ? ' و' : ' and ';
  return `${clean.slice(0, -1).join(language === 'ar' ? '، ' : ', ')}${conjunction}${
    clean[clean.length - 1]
  }`;
}

/** Trim a quote to whole words so a citation never cuts a term in half. */
export function quote(text: string, maxChars = 220): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
