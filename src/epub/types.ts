import { EdbText } from '../edb/types';

export interface EpubIndexEntry {
  id: string;
  file: string;
  kind: 'textbook' | 'course';
  title: EdbText;
  subtitle: EdbText;
  discipline: string;
  pages: number;
  languages: ('ar' | 'en')[];
  /** Size of the .epub container in bytes (informational). */
  bytes: number;
  /** SHA-256 over the archive contents; stable across zlib versions. */
  checksum: string;
  /** Text units that exist in one language only (translation gap in the source). */
  untranslated: number;
  modified: string;
}

export interface EpubIndex {
  format: 'EPUB-INDEX';
  version: '1.0';
  generatedAt: string;
  generator: string;
  books: EpubIndexEntry[];
}

export const EPUB_VERSION = '3.0' as const;
export const EPUB_INDEX_FORMAT = 'EPUB-INDEX' as const;
export const EPUB_GENERATOR = 'INSCO-EPUB-Builder/1.0' as const;
