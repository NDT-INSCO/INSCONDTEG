export interface NdeEdText {
  ar: string;
  en: string;
}

export type NdeEdLevel = 'foundation' | 'level1' | 'level2' | 'level3';

export interface NdeEdSource {
  id: string;
  publisher: string;
  title: string;
  url: string;
  /** What this page supports in the course. */
  covers: NdeEdText;
  /** true when the page is a historical overview rather than current requirements. */
  historical?: boolean;
}

export interface NdeEdQuiz {
  id: string;
  question: NdeEdText;
  options: NdeEdText[];
  answer: number;
  explanation: NdeEdText;
  /** Optional assessment classification for audit/governance. */
  category?: 'knowledge' | 'understanding' | 'application' | 'critical_thinking';
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Why each incorrect option is wrong (same order as options). */
  optionFeedback?: NdeEdText[];
  /** Reference/source note for the question rationale. */
  referenceNote?: NdeEdText;
  /** Review status for the question itself. */
  reviewStatus?: NdeEdReviewStatus;
}

export type NdeEdReviewStatus =
  | 'draft'
  | 'under_technical_review'
  | 'under_educational_review'
  | 'approved'
  | 'published'
  | 'needs_revision'
  | 'archived';

export interface NdeEdReferenceTrace {
  kind: 'reading_support' | 'normative_standard' | 'procedure' | 'textbook' | 'internal';
  sourceId?: string;
  publisher?: string;
  title?: string;
  edition?: string;
  clause?: string;
  page?: string;
  url?: string;
  note?: NdeEdText;
  /** True only when the reference has been verified against the actual document. */
  verified?: boolean;
}

export interface NdeEdLessonGovernance {
  status: NdeEdReviewStatus;
  technicalReviewerRole?: string;
  technicalReviewer?: string;
  educationalReviewer?: string;
  lastReviewedAt?: string;
  lastUpdatedAt?: string;
  verifiedAgainstEdition?: string;
  changeLog?: string[];
}

export interface NdeEdLesson {
  id: string;
  title: NdeEdText;
  summary: NdeEdText;
  minutes: number;
  objectives: NdeEdText[];
  sections: { heading: NdeEdText; body: NdeEdText }[];
  workedExample: { prompt: NdeEdText; solution: NdeEdText };
  exercise: { prompt: NdeEdText; hint: NdeEdText; answer: NdeEdText };
  quiz: NdeEdQuiz;
  /** Optional additional questions for deeper assessment (keeps `quiz` for backward compatibility). */
  quizBank?: NdeEdQuiz[];
  sources: string[];
  /** Explicit prerequisite lesson IDs within NDE-Ed. */
  prerequisiteLessonIds?: string[];
  /** Assumptions, scope limits, and safety/decision boundaries for the lesson. */
  assumptionsAndLimits?: NdeEdText[];
  /** Structured reference trace for auditability. */
  referenceTrace?: NdeEdReferenceTrace[];
  /** Governance/review metadata. */
  governance?: NdeEdLessonGovernance;
  /** Existing curriculum link, when this lesson supports one of the 8 disciplines. */
  curriculum?: {
    disciplineId: string;
    levelId?: 'academic' | 'level1' | 'level2' | 'level3';
    moduleId?: string;
  };
  /** Existing interactive textbook page, when available. */
  textbook?: { bookId: string; pageNumber: number };
  /** Existing virtual lab id, when available. */
  labId?: string;
}

export interface NdeEdCourse {
  id: string;
  disciplineId: string;
  title: NdeEdText;
  subtitle: NdeEdText;
  description: NdeEdText;
  level: NdeEdLevel;
  accent: string;
  code: string;
  prerequisites: NdeEdText;
  outcomes: NdeEdText[];
  lessons: NdeEdLesson[];
  standards: string[];
  /** nde-ed.org landing page for this course. */
  sourceLanding: string;
  /** A short, explicit statement of what this course does NOT authorise. */
  limits: NdeEdText;
}
