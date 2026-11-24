/**
 * The composer: ranked passages in, a cited answer out.
 *
 * This is the part that replaces the model. It does not generate prose — it *selects*
 * sentences the library already contains, orders them, and prints the passage id after
 * each one. A reader can therefore check every claim against the same corpus the search
 * box uses, which is exactly what a model-backed answer could never guarantee.
 *
 * The honest failure is part of the design: when no sentence carries enough of the
 * question, `composeTutorAnswer` returns `null` and the gateway says so. Silence is
 * better than an answer that is not in the material.
 */
import type { SearchHit } from '../search.js';
import { tokenize } from '../search.js';
import { detectIntent, topicLabel, type NdtMethod } from './intent.js';
import { isHeading, joinList, pickSentences, quote, similarity, type ScoredSentence } from './text.js';

export type ComposeMode = 'explain' | 'compare' | 'code' | 'practice';

export interface ComposedAnswer {
  text: string;
  /** Corpus ids actually quoted, in the order they appear. */
  usedIds: string[];
  /** How many library sentences the answer is built from — a quality signal, not decoration. */
  sentences: number;
  mode: ComposeMode;
}

export interface ComposeInput {
  question: string;
  hits: SearchHit[];
  language: 'ar' | 'en';
  mode: ComposeMode;
}

const SELECTION_CUES = [
  'يناسب',
  'تستخدم',
  'يستخدم',
  'حدود',
  'ميز',
  'مزايا',
  'عيوب',
  'suitable',
  'advantage',
  'limit',
  'used for',
  'applicable',
  'better',
];

function passageText(hit: SearchHit, language: 'ar' | 'en'): string {
  const preferred = hit.document.text[language];
  return (preferred && preferred.trim() ? preferred : hit.document.text.ar) || '';
}

function toPassages(hits: SearchHit[], language: 'ar' | 'en') {
  return hits.map(hit => ({ id: hit.document.id, text: passageText(hit, language), score: hit.score }));
}

/** Bullets from scored sentences, each ending with its citation. */
function bullets(picks: ScoredSentence[], maxChars = 320): string[] {
  return picks.map(pick => `- ${quote(pick.sentence, maxChars)} [${pick.sourceId}]`);
}

/** A label presented as an answer is a bug; the composer keeps them only as a last resort. */
export function countHeadings(picks: ScoredSentence[]): number {
  return picks.filter(pick => isHeading(pick.sentence)).length;
}

function mentionOf(method: NdtMethod, text: string): boolean {
  const haystack = text.toLowerCase();
  return method.aliases.some(alias => {
    const needle = alias.toLowerCase();
    if (needle.length < 2) return false;
    return new RegExp(`(^|[^\\p{L}])${needle}([^\\p{L}]|$)`, 'u').test(haystack);
  });
}

/* ------------------------------------------------------------------ */
/* modes                                                              */
/* ------------------------------------------------------------------ */

/**
 * The subject of the answer.
 *
 * When the question names a method, that is the subject. When it does not — "كيف أتعامل
 * مع المسامية في اللحام؟" — echoing the whole question as a heading reads like a machine
 * quoting itself, so the passage's own title is used instead.
 */
function topicOf(input: ComposeInput, methods: NdtMethod[]): string {
  const { question, hits, language } = input;
  if (methods.length > 0) return topicLabel(question, methods, language);
  const title = hits[0]?.document.title?.[language] || hits[0]?.document.title?.ar;
  if (title && title.trim()) return title.trim();
  return topicLabel(question, methods, language);
}

function composeExplain(input: ComposeInput, terms: string[]): ComposedAnswer | null {
  const { question, hits, language } = input;
  const passages = toPassages(hits, language);
  // Labels are dropped first; when that leaves too little, they come back — a heading is
  // better than an empty answer, as long as the reader can see it is a heading.
  let picks = pickSentences(passages, { terms, limit: 6 });
  if (picks.length < 2) picks = pickSentences(passages, { terms, limit: 6, allowHeadings: true });
  if (picks.length === 0) return null;

  const intent = detectIntent(question);
  const topic = topicOf(input, intent.methods);
  const opening =
    language === 'ar'
      ? `من مادة إنسكو عن ${topic}:`
      : `From the INSCO material on ${topic}:`;
  const closing =
    language === 'ar'
      ? 'هذه مادة دراسة من مكتبة إنسكو، وليست قراراً هندسياً ولا بند قبول — راجع الإجراء المكتوب والمهندس المختص.'
      : 'This is INSCO study material, not an engineering decision or an acceptance clause — refer to the written procedure and qualified engineer.';

  const text = [opening, '', ...bullets(picks.slice(0, 5)), '', closing].join('\n');
  return {
    text,
    usedIds: unique(picks.map(pick => pick.sourceId)),
    sentences: picks.length,
    mode: 'explain',
  };
}

function composeCompare(input: ComposeInput, terms: string[]): ComposedAnswer | null {
  const { question, hits, language } = input;
  const intent = detectIntent(question);
  const methods = intent.methods.slice(0, 3);
  const passages = toPassages(hits, language);

  if (methods.length < 2) {
    // "The difference between X and what?" is still a definition question.
    return composeExplain(input, terms);
  }

  const sections: string[] = [];
  const usedIds: string[] = [];
  const usedSentences: string[] = [];
  let sentenceCount = 0;

  for (const method of methods) {
    const relevant = passages.filter(passage => mentionOf(method, passage.text));
    // The sentence has to name the method itself: a passage about PAUT often mentions
    // TOFD in passing, and quoting that under "PAUT" would be a false attribution.
    const picks = pickSentences(relevant.length > 0 ? relevant : passages, { terms, limit: 4 })
      .filter(pick => mentionOf(method, pick.sentence))
      .filter(pick => !usedSentences.some(previous => similarity(previous, pick.sentence) > 0.6))
      .slice(0, 2);
    if (picks.length === 0) continue;
    const heading = language === 'ar' ? `${method.ar}:` : `${method.en}:`;
    sections.push(heading, ...bullets(picks, 300), '');
    usedIds.push(...picks.map(pick => pick.sourceId));
    usedSentences.push(...picks.map(pick => pick.sentence));
    sentenceCount += picks.length;
  }

  if (sentenceCount === 0) return null;

  const cuePick = pickSentences(passages, { terms: SELECTION_CUES, limit: 4 }).find(
    pick => !usedSentences.some(previous => similarity(previous, pick.sentence) > 0.6)
  );
  const names = joinList(
    methods.map(method => (language === 'ar' ? method.ar : method.en)),
    language
  );
  const verdict =
    language === 'ar'
      ? cuePick
        ? `متى تُستخدم أي منهما؟ ${quote(cuePick.sentence, 260)} [${cuePick.sourceId}]`
        : `اختيار الطريقة بين ${names} يحدده نطاق العمل والمواصفة المرجعية؛ المادة تشرح كل تقنية على حدة دون ترجيح.`
      : cuePick
        ? `When is each used? ${quote(cuePick.sentence, 260)} [${cuePick.sourceId}]`
        : `Choosing between ${names} depends on the scope of work and the reference standard; the material explains each technique without ranking them.`;
  if (cuePick) usedIds.push(cuePick.sourceId);

  const opening =
    language === 'ar' ? `المقارنة كما وردت في مادة إنسكو بين ${names}:` : `The comparison, as the INSCO material states it, between ${names}:`;
  const text = [opening, '', ...sections, verdict].join('\n').replace(/\n{3,}/g, '\n\n');

  return { text, usedIds: unique(usedIds), sentences: sentenceCount + (cuePick ? 1 : 0), mode: 'compare' };
}

function composeCode(input: ComposeInput, terms: string[]): ComposedAnswer | null {
  const { language, hits } = input;
  const passages = toPassages(hits, language);
  const clauseTerms = [...terms, ...tokenize('كود بند معيار قبول asme astm iso acceptance clause standard')];
  let picks = pickSentences(passages, { terms: clauseTerms, limit: 4 });
  if (picks.length < 2) picks = pickSentences(passages, { terms: clauseTerms, limit: 4, allowHeadings: true });
  const clausePicks = picks.filter(pick =>
    /(\basme\b|\bastm\b|\biso\b|\bapi\b|\bبند\b|\bكود\b|\bمعيار\b|clause|acceptance)/i.test(pick.sentence)
  );
  const chosen = clausePicks.length > 0 ? clausePicks : picks.slice(0, 3);
  if (chosen.length === 0) return null;

  const opening =
    language === 'ar'
      ? 'ما تقوله المادة (مقتطف حرفي، وليس قرار قبول):'
      : 'What the material says (verbatim extract, not an acceptance decision):';
  const honesty =
    language === 'ar'
      ? clausePicks.length > 0
        ? 'المقتطف يذكر المرجع كما ورد في المادة. لا تستخدم هذه الإجابة لاعتماد وصلة أو مشروع: قرار القبول يعود للإجراء المعتمد والمفتش المؤهل.'
        : 'المادة المتاحة لا تحدد رقم بند ولا نسبة قبول لهذا السؤال، ولا يجوز اختراعه. هذا ما تفعله المكتبة: تقول ما لديها وتتوقف.'
      : clausePicks.length > 0
        ? 'The extract states the reference exactly as the material does. Do not use this answer to accept a weld or a project: acceptance belongs to the approved procedure and a qualified inspector.'
        : 'The available material does not state a clause number or acceptance value for this question, and one must not be invented. This is what the library does: it says what it has and stops.';

  const text = [opening, '', ...bullets(chosen), '', honesty].join('\n');
  return { text, usedIds: unique(chosen.map(pick => pick.sourceId)), sentences: chosen.length, mode: 'code' };
}

function composePractice(input: ComposeInput, terms: string[]): ComposedAnswer | null {
  const { question, hits, language } = input;
  const passages = toPassages(hits, language);
  const withQuestions = pickSentences(passages, { terms, limit: 3, allowQuestions: true, minChars: 25 });
  const asked = withQuestions.find(pick => pick.question);
  const answers = pickSentences(passages, { terms, limit: 3 }).filter(
    pick => !asked || pick.sentence !== asked.sentence
  );
  if (answers.length === 0 && !asked) return null;

  const intent = detectIntent(question);
  const topic = topicLabel(question, intent.methods, language);
  const drill =
    asked?.sentence ??
    (language === 'ar'
      ? `اشرح ما تقيسه ${topic}، واذكر حدّاً واحداً من حدودها.`
      : `Explain what ${topic} measures and name one of its limits.`);

  const answerBlock =
    language === 'ar'
      ? ['الإجابة من المادة:', ...bullets(answers.slice(0, 3))].join('\n')
      : ['Answer from the material:', ...bullets(answers.slice(0, 3))].join('\n');

  const header = language === 'ar' ? 'سؤال تدريبي:' : 'Practice question:';
  const text = [header, drill, '', answerBlock].join('\n');

  return {
    text,
    usedIds: unique([...(asked ? [asked.sourceId] : []), ...answers.map(pick => pick.sourceId)]),
    sentences: answers.length + (asked ? 1 : 0),
    mode: 'practice',
  };
}

/* ------------------------------------------------------------------ */
/* entry                                                              */
/* ------------------------------------------------------------------ */

/**
 * How much of the question the retrieved passages actually contain.
 *
 * Retrieval is a ranking, not a verdict: it will always return *something*, and "ما هو سعر
 * سهم الشركة" still shares the word "الشركة" with a page about employer certification. The
 * measure below is the share of the reader's own words that appear in the passages. When
 * it is low the honest answer is "this is not in the library", not a plausible paragraph
 * about something else.
 */
function coverage(question: string, hits: SearchHit[]): number {
  const termList = [...new Set(tokenize(question))].filter(term => term.length >= 3);
  if (termList.length === 0) return 1;
  const passage = tokenize(
    hits
      .map(hit => `${hit.document.text.ar} ${hit.document.text.en} ${hit.document.title.ar} ${hit.document.title.en}`)
      .join(' ')
  );
  const vocabulary = new Set(passage);
  return termList.filter(term => vocabulary.has(term)).length / termList.length;
}

/** Below this share of matched words, an answer would be about a different subject. */
const MIN_COVERAGE = 0.5;

export function composeTutorAnswer(input: ComposeInput): ComposedAnswer | null {
  if (input.hits.length === 0) return null;
  if (coverage(input.question, input.hits) < MIN_COVERAGE) return null;
  const terms = tokenize(input.question);
  switch (input.mode) {
    case 'compare':
      return composeCompare(input, terms);
    case 'code':
      return composeCode(input, terms);
    case 'practice':
      return composePractice(input, terms);
    default:
      return composeExplain(input, terms);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
