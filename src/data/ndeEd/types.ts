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
  sources: string[];
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
