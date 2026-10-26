import { NDT_TEXTBOOKS } from '../data/ndeTextbooksData';
import { NDE_ED_COURSES, NDE_ED_SOURCE_MAP } from '../data/ndeEd';
import { courseToEdb, textbookToEdb } from '../edb/convert';
import { formatFormula } from '../edb/format';
import { parseEdb, stableStringify } from '../edb/validate';
import { EdbDocument, EdbIndex, EdbIndexEntry } from '../edb/types';

export const EDB_PROGRESS_KEY = 'insco_edb_reading_v1';

export interface EdbBookProgress {
  lastPage: number;
  readPages: number[];
  bookmarks: number[];
  updatedAt: string;
}

const EMPTY_PROGRESS: EdbBookProgress = { lastPage: 1, readPages: [], bookmarks: [], updatedAt: '' };

export function textOf(value: { ar: string; en: string }, language: 'ar' | 'en'): string {
  return value[language]?.trim() ? value[language] : value[language === 'ar' ? 'en' : 'ar'];
}

export function prettyFormula(expression: string): string {
  return formatFormula(expression);
}

function localDocuments(): EdbDocument[] {
  return [
    ...NDT_TEXTBOOKS.map(book => textbookToEdb(book)),
    ...NDE_ED_COURSES.map(course => courseToEdb(course, NDE_ED_SOURCE_MAP)),
  ];
}

function toEntry(document: EdbDocument, kind: 'textbook' | 'course'): EdbIndexEntry {
  return {
    id: document.id,
    file: `${document.id.replace(/^edb-/, '')}.edb`,
    kind,
    title: document.metadata.title,
    subtitle: document.metadata.subtitle,
    discipline: document.metadata.relatedDiscipline || 'general',
    pages: document.pages.length,
    estimatedMinutes: document.metadata.estimatedMinutes,
    accent: document.theme.accent,
    edition: document.metadata.edition,
    standards: document.metadata.standards || [],
    checksum: 'local',
    bytes: 0,
  };
}

export function localEdbIndex(): EdbIndex {
  return {
    format: 'EDB-INDEX',
    version: '1.0',
    generatedAt: new Date().toISOString(),
    generator: 'INSCO-EDB-Runtime/1.0',
    books: [
      ...NDT_TEXTBOOKS.map(book => toEntry(textbookToEdb(book), 'textbook')),
      ...NDE_ED_COURSES.map(course => toEntry(courseToEdb(course, NDE_ED_SOURCE_MAP), 'course')),
    ],
  };
}

export function localEdbDocument(id: string): EdbDocument | null {
  if (id.startsWith('edb-book-')) {
    const book = NDT_TEXTBOOKS.find(item => `edb-${item.id}` === id);
    return book ? textbookToEdb(book) : null;
  }
  if (id.startsWith('edb-course-')) {
    const course = NDE_ED_COURSES.find(item => `edb-course-${item.id}` === id);
    return course ? courseToEdb(course, NDE_ED_SOURCE_MAP) : null;
  }
  return null;
}

function assetBase(): string {
  const base = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

/** Absolute-url path for a file shipped in `public/` (honours the Vite base). */
export function assetUrl(relative: string): string {
  return `${assetBase()}${relative.replace(/^\//, '')}`;
}

function assetCandidates(relative: string): string[] {
  const normalizedBase = assetBase();
  const candidates = [
    `${normalizedBase}${relative}`,
    `/${relative}`,
  ];
  if (typeof window !== 'undefined') {
    try {
      candidates.push(new URL(relative, window.location.href).toString());
    } catch {
      // ignore malformed locations
    }
  }
  return [...new Set(candidates)];
}

async function fetchFirst(candidates: string[]): Promise<Response | null> {
  if (typeof fetch !== 'function') return null;
  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return response;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

export async function loadEdbIndex(): Promise<{ index: EdbIndex; source: 'files' | 'runtime' }> {
  const response = await fetchFirst(assetCandidates('edb/index.json'));
  if (response) {
    try {
      const data = (await response.json()) as EdbIndex;
      if (data?.format === 'EDB-INDEX' && Array.isArray(data.books) && data.books.length > 0) {
        return { index: data, source: 'files' };
      }
    } catch {
      // fall through to runtime generation
    }
  }
  return { index: localEdbIndex(), source: 'runtime' };
}

export async function loadEdbDocument(entry: EdbIndexEntry): Promise<{ document: EdbDocument | null; source: 'file' | 'runtime'; error?: string }> {
  let remoteError = '';
  if (entry.file) {
    const response = await fetchFirst(assetCandidates(`edb/${entry.file}`));
    if (response) {
      try {
        const raw = await response.text();
        const parsed = parseEdb(raw);
        if (parsed.document) return { document: parsed.document, source: 'file' };
        remoteError = parsed.result.errors.slice(0, 2).join('; ');
      } catch (error) {
        remoteError = error instanceof Error ? error.message : String(error);
      }
    }
  }
  const runtime = localEdbDocument(entry.id);
  return { document: runtime, source: 'runtime', error: runtime ? undefined : remoteError || 'EDB document not found' };
}

export function readEdbProgress(): Record<string, EdbBookProgress> {
  try {
    const raw = localStorage.getItem(EDB_PROGRESS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, EdbBookProgress> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([id, value]) => {
      if (!value || typeof value !== 'object') return;
      const item = value as Partial<EdbBookProgress>;
      result[id] = {
        lastPage: typeof item.lastPage === 'number' && item.lastPage > 0 ? item.lastPage : 1,
        readPages: Array.isArray(item.readPages) ? item.readPages.filter((n): n is number => typeof n === 'number' && n > 0) : [],
        bookmarks: Array.isArray(item.bookmarks) ? item.bookmarks.filter((n): n is number => typeof n === 'number' && n > 0) : [],
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
      };
    });
    return result;
  } catch {
    return {};
  }
}

export function getEdbProgress(id: string): EdbBookProgress {
  return readEdbProgress()[id] || EMPTY_PROGRESS;
}

export function saveEdbProgress(id: string, patch: Partial<EdbBookProgress>): EdbBookProgress {
  const all = readEdbProgress();
  const current = all[id] || EMPTY_PROGRESS;
  const next: EdbBookProgress = {
    ...current,
    ...patch,
    readPages: [...new Set(patch.readPages ?? current.readPages)].sort((a, b) => a - b),
    bookmarks: [...new Set(patch.bookmarks ?? current.bookmarks)].sort((a, b) => a - b),
    updatedAt: new Date().toISOString(),
  };
  all[id] = next;
  try {
    localStorage.setItem(EDB_PROGRESS_KEY, JSON.stringify(all));
  } catch {
    // Private mode or quota: reading still works for this session.
  }
  return next;
}

export function edbChecksum(document: EdbDocument): string {
  // Browser-side duplicate of the build checksum for display only. The build
  // script uses SHA-256; this compact string is not a security control.
  const serialized = stableStringify(document);
  let hash = 0;
  for (let i = 0; i < serialized.length; i += 1) {
    hash = (hash * 31 + serialized.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function downloadEdb(document: EdbDocument): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(document)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${document.id.replace(/^edb-/, '')}.edb`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** The EPUB build of this document, if the static library was published. */
export function epubAssetUrl(bookId: string): string {
  return assetUrl(`epub/${bookId.replace(/^edb-/, '')}.epub`);
}

/** Static catalogue of every EPUB (works even if the app itself fails). */
export function epubCatalogUrl(): string {
  return assetUrl('epub/index.html');
}
