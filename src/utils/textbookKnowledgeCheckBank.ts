import { NdtTextbook, BookPage } from '../data/ndeTextbooksData';
import { EdbDocument, EdbPage } from '../edb/types';
import { prettyFormula } from './edbLibrary';
import { generateKnowledgeCheckQuestions, KnowledgeCheckQuestion } from './knowledgeCheckGenerator';

export const QUICK_CHECK_STORAGE_KEY = 'insco_quick_knowledge_check_v1';
export const QUICK_CHECK_EVENT = 'insco-quick-knowledge-check-change';

export type QuickCheckScope = 'loaded_book' | 'current_page';

export interface QuickCheckItem {
  id: string;
  bookId: string;
  discipline: string;
  sourcePageNumber: number;
  pageTitleAr: string;
  pageTitleEn: string;
  chapterTitleAr: string;
  chapterTitleEn: string;
  conceptTagAr: string;
  conceptTagEn: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationAr: string;
  explanationEn: string;
  formulaLatex?: string;
}

export interface BookQuickCheckRecord {
  answeredIds: string[];
  correctIds: string[];
  attemptsCount: number;
  lastUpdatedIso: string;
}

export type QuickCheckProgressStore = Record<string, BookQuickCheckRecord>;

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Deterministically rotates dynamic question choices so the correct option is
 * evenly distributed across A/B/C/D rather than always sitting at index 0.
 */
function balanceQuestionChoices(
  question: KnowledgeCheckQuestion,
  seedKey: string
): Pick<QuickCheckItem, 'optionsAr' | 'optionsEn' | 'correctIndex'> {
  const count = Math.min(question.optionsAr.length, question.optionsEn.length);
  if (count < 2 || !question.id.startsWith('dyn-')) {
    return {
      optionsAr: [...question.optionsAr],
      optionsEn: [...question.optionsEn],
      correctIndex: question.correctIndex,
    };
  }

  const shift = stableHash(seedKey) % count;
  if (shift === 0) {
    return {
      optionsAr: [...question.optionsAr],
      optionsEn: [...question.optionsEn],
      correctIndex: question.correctIndex,
    };
  }

  const optionsAr: string[] = new Array(count);
  const optionsEn: string[] = new Array(count);
  let nextCorrectIndex = question.correctIndex;

  for (let i = 0; i < count; i += 1) {
    const targetIdx = (i + shift) % count;
    optionsAr[targetIdx] = question.optionsAr[i];
    optionsEn[targetIdx] = question.optionsEn[i];
    if (i === question.correctIndex) {
      nextCorrectIndex = targetIdx;
    }
  }

  return {
    optionsAr,
    optionsEn,
    correctIndex: nextCorrectIndex,
  };
}

function mapPageQuestionToItem(
  book: NdtTextbook,
  page: BookPage,
  q: KnowledgeCheckQuestion
): QuickCheckItem {
  const uniqueId = `${book.id}::p${page.pageNumber}::${q.id}`;
  const balanced = balanceQuestionChoices(q, uniqueId);

  return {
    id: uniqueId,
    bookId: book.id,
    discipline: book.discipline,
    sourcePageNumber: page.pageNumber,
    pageTitleAr: page.pageTitleAr,
    pageTitleEn: page.pageTitleEn,
    chapterTitleAr: page.chapterTitleAr,
    chapterTitleEn: page.chapterTitleEn,
    conceptTagAr: q.conceptTagAr,
    conceptTagEn: q.conceptTagEn,
    questionAr: q.questionAr,
    questionEn: q.questionEn,
    optionsAr: balanced.optionsAr,
    optionsEn: balanced.optionsEn,
    correctIndex: balanced.correctIndex,
    explanationAr: q.explanationAr,
    explanationEn: q.explanationEn,
    formulaLatex: page.formula?.latex,
  };
}

/**
 * Builds an immediate-feedback Knowledge Check deck grounded in the currently
 * loaded NDT textbook (`NdtTextbook`), supporting either the active page or
 * a multi-chapter check across the entire loaded textbook.
 */
export function buildTextbookKnowledgeCheckDeck(
  book: NdtTextbook,
  options: {
    scope?: QuickCheckScope;
    pageNumber?: number;
    maxQuestions?: number;
  } = {}
): QuickCheckItem[] {
  const { scope = 'loaded_book', pageNumber = 1, maxQuestions = 8 } = options;

  if (!book.pages || book.pages.length === 0) {
    return [];
  }

  if (scope === 'current_page') {
    const targetPage =
      book.pages.find(p => p.pageNumber === pageNumber) || book.pages[0];
    const generated = generateKnowledgeCheckQuestions(
      targetPage,
      'en',
      book.discipline
    );
    return generated
      .slice(0, maxQuestions)
      .map(q => mapPageQuestionToItem(book, targetPage, q));
  }

  // Scope: 'loaded_book'
  // First pass: collect top-priority (curated or page-authored or formula) question from every page
  const primaryPass: QuickCheckItem[] = [];
  const secondaryPass: QuickCheckItem[] = [];
  const seenPrompts = new Set<string>();

  for (const page of book.pages) {
    const generated = generateKnowledgeCheckQuestions(
      page,
      'en',
      book.discipline
    );
    generated.forEach((q, idx) => {
      const promptSignature = q.questionEn.trim().toLowerCase();
      if (seenPrompts.has(promptSignature)) return;
      seenPrompts.add(promptSignature);

      const item = mapPageQuestionToItem(book, page, q);
      if (idx === 0) {
        primaryPass.push(item);
      } else {
        secondaryPass.push(item);
      }
    });
  }

  const combined = [...primaryPass, ...secondaryPass];
  return combined.slice(0, Math.max(1, maxQuestions));
}

function buildEdbPageItems(doc: EdbDocument, page: EdbPage): QuickCheckItem[] {
  const chapter = doc.chapters.find(ch => ch.id === page.chapterId);
  const chapterTitleAr = chapter?.title.ar || doc.metadata.title.ar;
  const chapterTitleEn = chapter?.title.en || doc.metadata.title.en;
  const discipline = doc.metadata.relatedDiscipline || 'NDT';
  const items: QuickCheckItem[] = [];

  page.blocks.forEach((block, idx) => {
    if (block.type === 'quiz' && block.options.length >= 2) {
      items.push({
        id: `${doc.id}::p${page.number}::quiz-${block.id}`,
        bookId: doc.id,
        discipline,
        sourcePageNumber: page.number,
        pageTitleAr: page.title.ar,
        pageTitleEn: page.title.en,
        chapterTitleAr,
        chapterTitleEn,
        conceptTagAr: 'فحص فهم معتمد',
        conceptTagEn: 'Verified Page Assessment',
        questionAr: block.question.ar,
        questionEn: block.question.en,
        optionsAr: block.options.map(opt => opt.ar),
        optionsEn: block.options.map(opt => opt.en),
        correctIndex: Math.min(Math.max(block.answer, 0), block.options.length - 1),
        explanationAr: block.explanation.ar,
        explanationEn: block.explanation.en,
      });
    } else if (block.type === 'formula' && block.caption) {
      const formatted = prettyFormula(block.expression);
      const rawId = `dyn-edb-formula-${page.number}-${idx}`;
      const balanced = balanceQuestionChoices(
        {
          id: rawId,
          questionAr: `في صفحة "${page.title.ar}"، ماذا تصف المعادلة الهندسية [ ${formatted} ]؟`,
          questionEn: `On page "${page.title.en}", what physical relationship does [ ${formatted} ] express?`,
          optionsAr: [
            block.caption.ar,
            'تقدير الرطوبة النسبية داخل مستودع التخزين فقط',
            'حساب التكلفة الإدارية السنوية لمعدات الورشة',
            'إلغاء الحاجة لمعايرة الجهاز قبل بدء الفحص',
          ],
          optionsEn: [
            block.caption.en,
            'Ambient warehouse relative humidity estimation only',
            'Annual administrative overhead cost of shop tools',
            'Eliminating reference block calibration prior to inspection',
          ],
          correctIndex: 0,
          explanationAr: `المعادلة [ ${formatted} ] الواردة في الصفحة توضح: ${block.caption.ar}.`,
          explanationEn: `The equation [ ${formatted} ] on this page defines: ${block.caption.en}.`,
          conceptTagAr: 'المعادلات الهندسية',
          conceptTagEn: 'Engineering Equations',
        },
        `${doc.id}::${rawId}`
      );

      items.push({
        id: `${doc.id}::p${page.number}::${rawId}`,
        bookId: doc.id,
        discipline,
        sourcePageNumber: page.number,
        pageTitleAr: page.title.ar,
        pageTitleEn: page.title.en,
        chapterTitleAr,
        chapterTitleEn,
        conceptTagAr: 'المعادلات الهندسية',
        conceptTagEn: 'Engineering Equations',
        questionAr: `في صفحة "${page.title.ar}"، ماذا تصف المعادلة الهندسية [ ${formatted} ]؟`,
        questionEn: `On page "${page.title.en}", what physical relationship does [ ${formatted} ] express?`,
        optionsAr: balanced.optionsAr,
        optionsEn: balanced.optionsEn,
        correctIndex: balanced.correctIndex,
        explanationAr: `المعادلة [ ${formatted} ] الواردة في الصفحة توضح: ${block.caption.ar}.`,
        explanationEn: `The equation [ ${formatted} ] on this page defines: ${block.caption.en}.`,
        formulaLatex: formatted,
      });
    } else if (block.type === 'callout') {
      const rawId = `dyn-edb-callout-${page.number}-${idx}`;
      const balanced = balanceQuestionChoices(
        {
          id: rawId,
          questionAr: `أي مبدأ فني تؤكده الملاحظة الهندسية في صفحة "${page.title.ar}"؟`,
          questionEn: `Which technical rule is emphasized in the engineering note on "${page.title.en}"?`,
          optionsAr: [
            block.text.ar,
            'تجاوز حدود القبول القياسية دون الرجوع للكود المرجعي',
            'إجراء الفحص بدون تنظيف مسبق للسطح أو معايرة مرجعية',
            'اعتماد نتائج الفحص التقديرية دون توثيق رسمي',
          ],
          optionsEn: [
            block.text.en,
            'Bypassing code acceptance criteria during field inspection',
            'Executing inspection without surface preparation or calibration',
            'Accepting unverified visual estimates without documentation',
          ],
          correctIndex: 0,
          explanationAr: `تنص الملاحظة المعتمدة في الصفحة على: ${block.text.ar}`,
          explanationEn: `The page callout establishes this verified principle: ${block.text.en}`,
          conceptTagAr: block.title?.ar || 'ضوابط الفحص الهندسي',
          conceptTagEn: block.title?.en || 'Inspection Control Principle',
        },
        `${doc.id}::${rawId}`
      );

      items.push({
        id: `${doc.id}::p${page.number}::${rawId}`,
        bookId: doc.id,
        discipline,
        sourcePageNumber: page.number,
        pageTitleAr: page.title.ar,
        pageTitleEn: page.title.en,
        chapterTitleAr,
        chapterTitleEn,
        conceptTagAr: block.title?.ar || 'ضوابط الفحص الهندسي',
        conceptTagEn: block.title?.en || 'Inspection Control Principle',
        questionAr: `أي مبدأ فني تؤكده الملاحظة الهندسية في صفحة "${page.title.ar}"؟`,
        questionEn: `Which technical rule is emphasized in the engineering note on "${page.title.en}"?`,
        optionsAr: balanced.optionsAr,
        optionsEn: balanced.optionsEn,
        correctIndex: balanced.correctIndex,
        explanationAr: `تنص الملاحظة المعتمدة في الصفحة على: ${block.text.ar}`,
        explanationEn: `The page callout establishes this verified principle: ${block.text.en}`,
      });
    } else if (block.type === 'list' && block.items.length > 0 && items.length === 0) {
      const firstPoint = block.items[0];
      const rawId = `dyn-edb-list-${page.number}-${idx}`;
      const balanced = balanceQuestionChoices(
        {
          id: rawId,
          questionAr: `وفقاً للنقاط الأساسية في صفحة "${page.title.ar}"، أي عبارة تُعد صحيحة؟`,
          questionEn: `Based on the key points on page "${page.title.en}", which statement is accurate?`,
          optionsAr: [
            firstPoint.ar,
            'لا يلزم التحقق من حساسية الجهاز قبل بدء الوردية',
            'تُهمل اشتراطات السلامة المهنية عند الفحص السريع',
            'تتساوى جميع المواد في الخواص الفيزيائية والمقاومة الصوتية',
          ],
          optionsEn: [
            firstPoint.en,
            'Sensitivity verification is optional prior to shift start',
            'Safety controls may be skipped for rapid spot checks',
            'All alloys exhibit identical acoustic and magnetic properties',
          ],
          correctIndex: 0,
          explanationAr: `النقطة المحورية المقررة في هذه الصفحة هي: ${firstPoint.ar}`,
          explanationEn: `The key point established on this page is: ${firstPoint.en}`,
          conceptTagAr: 'النقاط الأساسية للصفحة',
          conceptTagEn: 'Page Key Takeaways',
        },
        `${doc.id}::${rawId}`
      );

      items.push({
        id: `${doc.id}::p${page.number}::${rawId}`,
        bookId: doc.id,
        discipline,
        sourcePageNumber: page.number,
        pageTitleAr: page.title.ar,
        pageTitleEn: page.title.en,
        chapterTitleAr,
        chapterTitleEn,
        conceptTagAr: 'النقاط الأساسية للصفحة',
        conceptTagEn: 'Page Key Takeaways',
        questionAr: `وفقاً للنقاط الأساسية في صفحة "${page.title.ar}"، أي عبارة تُعد صحيحة؟`,
        questionEn: `Based on the key points on page "${page.title.en}", which statement is accurate?`,
        optionsAr: balanced.optionsAr,
        optionsEn: balanced.optionsEn,
        correctIndex: balanced.correctIndex,
        explanationAr: `النقطة المحورية المقررة في هذه الصفحة هي: ${firstPoint.ar}`,
        explanationEn: `The key point established on this page is: ${firstPoint.en}`,
      });
    }
  });

  return items;
}

/**
 * Builds a Quick Knowledge Check deck from a loaded `.edb` textbook (`EdbDocument`).
 */
export function buildEdbKnowledgeCheckDeck(
  doc: EdbDocument,
  options: {
    scope?: QuickCheckScope;
    pageNumber?: number;
    maxQuestions?: number;
  } = {}
): QuickCheckItem[] {
  const { scope = 'loaded_book', pageNumber = 1, maxQuestions = 8 } = options;

  if (!doc.pages || doc.pages.length === 0) {
    return [];
  }

  if (scope === 'current_page') {
    const target =
      doc.pages.find(p => p.number === pageNumber) || doc.pages[0];
    const pageItems = buildEdbPageItems(doc, target);
    if (pageItems.length > 0) {
      return pageItems.slice(0, maxQuestions);
    }
    // If the user is on the cover page (which has no content blocks), fall back to book-level questions
  }

  const authoredQuizzes: QuickCheckItem[] = [];
  const derivedItems: QuickCheckItem[] = [];

  for (const page of doc.pages) {
    const pageItems = buildEdbPageItems(doc, page);
    for (const item of pageItems) {
      if (item.id.includes('::quiz-')) {
        authoredQuizzes.push(item);
      } else {
        derivedItems.push(item);
      }
    }
  }

  return [...authoredQuizzes, ...derivedItems].slice(0, Math.max(1, maxQuestions));
}

export function readQuickCheckProgress(): QuickCheckProgressStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(QUICK_CHECK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as QuickCheckProgressStore;
  } catch {
    return {};
  }
}

export function getBookQuickCheckRecord(bookId: string): BookQuickCheckRecord {
  const store = readQuickCheckProgress();
  return (
    store[bookId] || {
      answeredIds: [],
      correctIds: [],
      attemptsCount: 0,
      lastUpdatedIso: '',
    }
  );
}

export function recordQuickCheckAnswer(
  bookId: string,
  questionId: string,
  isCorrect: boolean
): BookQuickCheckRecord {
  const store = readQuickCheckProgress();
  const prev = store[bookId] || {
    answeredIds: [],
    correctIds: [],
    attemptsCount: 0,
    lastUpdatedIso: '',
  };

  const answeredSet = new Set(prev.answeredIds);
  answeredSet.add(questionId);

  const correctSet = new Set(prev.correctIds);
  if (isCorrect) {
    correctSet.add(questionId);
  } else {
    correctSet.delete(questionId);
  }

  const nextRecord: BookQuickCheckRecord = {
    answeredIds: Array.from(answeredSet),
    correctIds: Array.from(correctSet),
    attemptsCount: prev.attemptsCount + 1,
    lastUpdatedIso: new Date().toISOString(),
  };

  const nextStore: QuickCheckProgressStore = {
    ...store,
    [bookId]: nextRecord,
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(QUICK_CHECK_STORAGE_KEY, JSON.stringify(nextStore));
      window.dispatchEvent(new CustomEvent(QUICK_CHECK_EVENT, { detail: { bookId } }));
    }
  } catch {
    // Ignore storage quota errors cleanly
  }

  return nextRecord;
}

export function resetQuickCheckBookProgress(bookId: string): void {
  const store = readQuickCheckProgress();
  if (!(bookId in store)) return;
  const nextStore = { ...store };
  delete nextStore[bookId];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(QUICK_CHECK_STORAGE_KEY, JSON.stringify(nextStore));
      window.dispatchEvent(new CustomEvent(QUICK_CHECK_EVENT, { detail: { bookId } }));
    }
  } catch {
    // Ignore storage errors
  }
}
