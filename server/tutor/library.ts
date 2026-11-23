/**
 * The tutor's two libraries, and which one is answering.
 *
 * 1. **reviewed** — the small corpus built from `.edb` course files that passed the
 *    review register and the checksum check (`reviewedLibrary.ts`). This is the tutor's
 *    original promise: every answer is traceable to reviewed bytes.
 * 2. **academy** — the full textbook/course corpus the reader and the search box already
 *    use (`src/ai/corpus.ts`). Nothing in it is reviewed for teaching; it is the site's
 *    own published material.
 *
 * When the review register is empty — the state of this repository today — the tutor
 * used to refuse every question, which reads as "the AI is broken". It now falls back to
 * the academy corpus **and says so**, in the citations, in the answer's metadata and in
 * the prompt itself: the model is told the passages are unreviewed study material and
 * must present its answer as guidance, not as an approved reference.
 *
 * If neither library has a single document the tutor still declines. There is no third
 * state in which it answers without a source.
 */
import { getCorpus } from '../../src/ai/corpus.js';
import { TUTOR_LIMITS } from '../../src/ai/contract.js';
import { buildIndex, retrieveForTutor, type SearchHit } from '../../src/ai/search.js';
import { buildReviewedTutorLibrary } from './reviewedLibrary.js';

export type TutorLibrarySource = 'reviewed' | 'academy' | 'none';

export interface TutorLibrary {
  source: TutorLibrarySource;
  documents: number;
  retrieve: (query: string) => SearchHit[];
}

export const EMPTY_TUTOR_LIBRARY: TutorLibrary = {
  source: 'none',
  documents: 0,
  retrieve: () => [],
};

/** The unreviewed academy corpus, indexed the same way the search box indexes it. */
export function buildAcademyLibrary(): TutorLibrary {
  const documents = getCorpus();
  if (documents.length === 0) return EMPTY_TUTOR_LIBRARY;
  const index = buildIndex(documents);
  return {
    source: 'academy',
    documents: documents.length,
    retrieve: (query: string) => retrieveForTutor(query, { index, limit: TUTOR_LIMITS.passages }),
  };
}

/**
 * Pick the library for this process: reviewed if it has anything at all, otherwise the
 * academy corpus, otherwise nothing. `read` is injected so both the Node server and the
 * serverless function can point at whichever directory holds `edb/`.
 */
export function buildTutorLibrary(
  read: (filename: string) => string,
  options: { allowAcademyFallback?: boolean } = {}
): { library: TutorLibrary; reviewedDocuments: number; failure: string } {
  const { allowAcademyFallback = true } = options;
  let reviewedDocuments = 0;
  let failure = '';

  try {
    const reviewed = buildReviewedTutorLibrary(read);
    reviewedDocuments = reviewed.reviewedDocuments;
    if (reviewedDocuments > 0) {
      return {
        library: { source: 'reviewed', documents: reviewedDocuments, retrieve: reviewed.retrieveForTutor },
        reviewedDocuments,
        failure,
      };
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  if (!allowAcademyFallback) return { library: EMPTY_TUTOR_LIBRARY, reviewedDocuments, failure };
  return { library: buildAcademyLibrary(), reviewedDocuments, failure };
}
