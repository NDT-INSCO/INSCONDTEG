/**
 * The searchable corpus: every textbook page and every course lesson, built in
 * memory from the same data the reader and the EDB/EPUB builders use.
 *
 * Keeping one builder means a page added to a textbook is searchable and
 * citable immediately — there is no second index to forget to update.
 *
 * Runs in the browser and in Node (no imports beyond the data modules).
 */
import { NDT_TEXTBOOKS } from '../data/ndeTextbooksData';
import { NDE_ED_COURSES } from '../data/ndeEd';
import type { NdeEdText } from '../data/ndeEd/types';

export type CorpusKind = 'textbook' | 'course' | 'lesson';

export interface CorpusDocument {
  /** Stable id used for citations, e.g. `book-ut#p3` or `course-nde-vt#lesson-1`. */
  id: string;
  kind: CorpusKind;
  /** Textbook or course id, used for deep links. */
  bookId: string;
  courseId?: string;
  pageNumber?: number;
  lessonId?: string;
  title: NdeEdText;
  /** Chapter / course section shown under the title in results. */
  section: NdeEdText;
  discipline: string;
  text: NdeEdText;
}

function join(parts: (string | undefined | null)[]): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join('\n');
}

function textbookDocuments(): CorpusDocument[] {
  const documents: CorpusDocument[] = [];
  for (const book of NDT_TEXTBOOKS) {
    for (const page of book.pages) {
      const keyPointsAr = (page.keyPointsAr ?? []).join('\n');
      const keyPointsEn = (page.keyPointsEn ?? []).join('\n');
      const quizAr = page.quizQuestion
        ? join([page.quizQuestion.questionAr, page.quizQuestion.explanationAr, (page.quizQuestion.optionsAr ?? []).join('\n')])
        : '';
      const quizEn = page.quizQuestion
        ? join([page.quizQuestion.questionEn, page.quizQuestion.explanationEn, (page.quizQuestion.optionsEn ?? []).join('\n')])
        : '';
      documents.push({
        id: `${book.id}#p${page.pageNumber}`,
        kind: 'textbook',
        bookId: book.id,
        pageNumber: page.pageNumber,
        title: { ar: page.pageTitleAr, en: page.pageTitleEn },
        section: { ar: page.chapterTitleAr, en: page.chapterTitleEn },
        discipline: book.discipline,
        text: {
          ar: join([page.contentAr, keyPointsAr, page.formula?.descriptionAr, quizAr]),
          en: join([page.contentEn, keyPointsEn, page.formula?.descriptionEn, quizEn]),
        },
      });
    }
  }
  return documents;
}

function courseDocuments(): CorpusDocument[] {
  const documents: CorpusDocument[] = [];
  for (const course of NDE_ED_COURSES) {
    documents.push({
      id: `${course.id}#overview`,
      kind: 'course',
      bookId: course.id,
      courseId: course.id,
      title: course.title,
      section: course.subtitle,
      discipline: course.disciplineId,
      text: {
        ar: join([course.description.ar, course.outcomes.map(outcome => outcome.ar).join('\n'), course.prerequisites.ar]),
        en: join([course.description.en, course.outcomes.map(outcome => outcome.en).join('\n'), course.prerequisites.en]),
      },
    });

    for (const lesson of course.lessons) {
      documents.push({
        id: `${course.id}#${lesson.id}`,
        kind: 'lesson',
        bookId: course.id,
        courseId: course.id,
        lessonId: lesson.id,
        title: lesson.title,
        section: course.title,
        discipline: course.disciplineId,
        text: {
          ar: join([
            lesson.summary.ar,
            lesson.objectives.map(item => item.ar).join('\n'),
            lesson.sections.map(section => join([section.heading.ar, section.body.ar])).join('\n'),
            join([lesson.workedExample.prompt.ar, lesson.workedExample.solution.ar]),
            join([lesson.exercise.prompt.ar, lesson.exercise.answer.ar]),
            join([lesson.quiz.question.ar, lesson.quiz.explanation.ar]),
          ]),
          en: join([
            lesson.summary.en,
            lesson.objectives.map(item => item.en).join('\n'),
            lesson.sections.map(section => join([section.heading.en, section.body.en])).join('\n'),
            join([lesson.workedExample.prompt.en, lesson.workedExample.solution.en]),
            join([lesson.exercise.prompt.en, lesson.exercise.answer.en]),
            join([lesson.quiz.question.en, lesson.quiz.explanation.en]),
          ]),
        },
      });
    }
  }
  return documents;
}

let cache: CorpusDocument[] | null = null;

/** Built once per process (or per tab); the source data is static. */
export function getCorpus(): CorpusDocument[] {
  if (!cache) cache = [...textbookDocuments(), ...courseDocuments()];
  return cache;
}

/** Test hook: forget the memoised corpus. */
export function resetCorpusCache(): void {
  cache = null;
  statsCache = null;
}

/**
 * Counts shown in the UI and in the tutor's honest "not found" reply.
 *
 * They are derived, never typed by hand: the previous hardcoded "157 pages"
 * drifted from the real corpus (90 textbook pages) the moment the data changed.
 */
export interface CorpusStats {
  documents: number;
  pages: number;
  courses: number;
  lessons: number;
  books: number;
}

let statsCache: CorpusStats | null = null;

export function getCorpusStats(): CorpusStats {
  if (statsCache) return statsCache;
  const documents = getCorpus();
  const books = new Set<string>();
  let pages = 0;
  let courses = 0;
  let lessons = 0;
  for (const document of documents) {
    if (document.kind === 'textbook') {
      pages += 1;
      books.add(document.bookId);
    } else if (document.kind === 'course') {
      courses += 1;
    } else {
      lessons += 1;
    }
  }
  statsCache = { documents: documents.length, pages, courses, lessons, books: books.size };
  return statsCache;
}

export function titleOf(document: CorpusDocument, language: 'ar' | 'en'): string {
  return document.title[language] || document.title[language === 'ar' ? 'en' : 'ar'] || '';
}

/** Where a result should navigate to. Consumed by the search UI. */
export interface CorpusTarget {
  tab: 'edb' | 'courses';
  bookId?: string;
  pageNumber?: number;
  courseId?: string;
}

export function targetOf(document: CorpusDocument): CorpusTarget {
  if (document.kind === 'textbook') {
    return { tab: 'edb', bookId: document.bookId, pageNumber: document.pageNumber };
  }
  return { tab: 'courses', courseId: document.courseId ?? document.bookId };
}
