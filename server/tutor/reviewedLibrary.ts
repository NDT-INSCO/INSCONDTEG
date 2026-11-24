import type { CorpusDocument } from '../../src/ai/corpus.js';
import { TUTOR_LIMITS } from '../../src/ai/contract.js';
import { buildIndex, retrieveForTutor } from '../../src/ai/search.js';
import { checksumForCourse, reviewedCourseIds, type CourseReviewEntry } from '../../src/data/ndeEd/review.js';
import { edbContentChecksum } from '../../src/edb/nodeChecksum.js';
import type { EdbBlock, EdbLanguage } from '../../src/edb/types.js';
import { parseEdb } from '../../src/edb/validate.js';

function passageText(block: EdbBlock, lang: EdbLanguage): string {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
    case 'callout': return block.text[lang];
    case 'list': return block.items.map(item => item[lang]).join('\n');
    case 'formula': return [block.expression, block.caption?.[lang]].filter(Boolean).join('\n');
    default: return ''; // No quiz answers, images, external URLs or launch instructions.
  }
}

/** The actual text indexed by the tutor must come from the reviewed bytes, not
 * a separately maintained in-memory course or the unauthenticated manifest alone. */
export function reviewedTutorDocuments(
  read: (filename: string) => string,
  register?: readonly CourseReviewEntry[],
  now?: Date,
): CorpusDocument[] {
  let index: Parameters<typeof reviewedCourseIds>[0];
  try {
    index = JSON.parse(read('index.json'));
  } catch {
    return [];
  }
  const passages: CorpusDocument[] = [];
  for (const courseId of reviewedCourseIds(index, register, now)) {
    if (!/^[a-z0-9-]+$/.test(courseId)) continue;
    try {
      const { document } = parseEdb(read(`course-${courseId}.edb`));
      if (!document || document.id !== `edb-course-${courseId}` || edbContentChecksum(document) !== checksumForCourse(index, courseId)) continue;
      for (const page of document.pages) {
        if (page.kind !== 'content') continue;
        const ar = page.blocks.map(block => passageText(block, 'ar')).filter(Boolean).join('\n').trim();
        const en = page.blocks.map(block => passageText(block, 'en')).filter(Boolean).join('\n').trim();
        if (Math.max(ar.length, en.length) < 40) continue;
        passages.push({
          id: `${document.id}#p${page.number}`,
          kind: 'lesson',
          bookId: document.id,
          courseId,
          pageNumber: page.number,
          title: page.title,
          section: document.metadata.title,
          discipline: document.metadata.relatedDiscipline ?? 'general',
          text: { ar, en },
        });
      }
    } catch {
      // Absent or malformed editions are unavailable; never substitute another version.
    }
  }
  return passages;
}

export function buildReviewedTutorLibrary(read: (filename: string) => string) {
  const documents = reviewedTutorDocuments(read);
  const index = buildIndex(documents);
  return {
    reviewedDocuments: documents.length,
    retrieveForTutor: (query: string, limit?: number) =>
      retrieveForTutor(query, { index, limit: limit ?? TUTOR_LIMITS.passages }),
  };
}
