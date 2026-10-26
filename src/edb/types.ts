/**
 * EDB — Engineering Digital Book (INSCO open container) v1.0
 *
 * A single `.edb` file is UTF-8 JSON whose top-level object starts with
 * `"format": "EDB"`. It carries bilingual pages, chapters, quiz blocks,
 * formulas, sources and reading metadata. It intentionally contains no
 * executable code and no remotely loaded script.
 *
 * The normative description lives in documentation/EDB_FORMAT_AR.md.
 */

export type EdbLanguage = 'ar' | 'en';

export interface EdbText {
  ar: string;
  en: string;
}

export type EdbBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: EdbText }
  | { type: 'paragraph'; text: EdbText }
  | { type: 'list'; ordered: boolean; items: EdbText[] }
  | { type: 'formula'; expression: string; caption?: EdbText }
  | { type: 'callout'; tone: 'info' | 'warning' | 'success'; title?: EdbText; text: EdbText }
  | { type: 'quiz'; id: string; question: EdbText; options: EdbText[]; answer: number; explanation: EdbText }
  | { type: 'experiment'; experimentId: string; label: EdbText }
  | { type: 'source'; publisher?: string; title: string; url: string }
  | { type: 'image'; src: string; alt: EdbText };

export interface EdbPage {
  id: string;
  /** 1-based reading position. */
  number: number;
  chapterId: string;
  kind: 'cover' | 'content' | 'chapter' | 'assessment' | 'summary';
  title: EdbText;
  blocks: EdbBlock[];
  estimatedMinutes?: number;
}

export interface EdbChapter {
  id: string;
  title: EdbText;
  pageIds: string[];
}

export interface EdbMetadata {
  title: EdbText;
  subtitle: EdbText;
  author: EdbText;
  publisher: string;
  edition: string;
  createdAt: string;
  updatedAt: string;
  languages: EdbLanguage[];
  readingDirection: 'rtl' | 'ltr' | 'auto';
  estimatedMinutes: number;
  keywords: EdbText[];
  rights: {
    holder: string;
    license: string;
    notice: EdbText;
  };
  sourceNote?: EdbText;
  standards?: string[];
  relatedDiscipline?: string;
  relatedLevel?: string;
}

export interface EdbTheme {
  /** CSS hex colours, validated as #rgb or #rrggbb. */
  accent: string;
  accentSoft: string;
  ink: string;
  paper: string;
  /** Decorative label shown on the cover. */
  label: EdbText;
}

export interface EdbGlossaryEntry {
  term: EdbText;
  definition: EdbText;
}

export interface EdbDocument {
  format: 'EDB';
  version: '1.0';
  id: string;
  metadata: EdbMetadata;
  theme: EdbTheme;
  chapters: EdbChapter[];
  pages: EdbPage[];
  glossary?: EdbGlossaryEntry[];
  generator: string;
}

export interface EdbIndexEntry {
  id: string;
  file: string;
  kind: 'textbook' | 'course';
  title: EdbText;
  subtitle: EdbText;
  discipline: string;
  pages: number;
  estimatedMinutes: number;
  accent: string;
  edition: string;
  standards: string[];
  checksum: string;
  bytes: number;
}

export interface EdbIndex {
  format: 'EDB-INDEX';
  version: '1.0';
  generatedAt: string;
  generator: string;
  books: EdbIndexEntry[];
}

export interface EdbValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const EDB_FORMAT = 'EDB' as const;
export const EDB_VERSION = '1.0' as const;
export const EDB_GENERATOR = 'INSCO-EDB-Builder/1.0';
export const EDB_MAX_BYTES = 8 * 1024 * 1024;
export const EDB_MAX_PAGES = 600;
export const EDB_MAX_BLOCKS_PER_PAGE = 200;
