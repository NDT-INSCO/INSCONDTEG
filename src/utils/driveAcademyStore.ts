import { useEffect, useState } from 'react';
import { academyActivityStorage } from '../account/academyAccountProgress';
import type { ImportedDriveSimulator, ImportedVocationalBookEntry } from './driveAcademyImporter';

export const DRIVE_VOCATIONAL_BOOKS_KEY = 'insco_drive_vocational_books_v1';
export const DRIVE_SIMULATORS_KEY = 'insco_drive_simulators_v1';
export const DRIVE_ACADEMY_UPDATED_EVENT = 'insco-drive-academy-updated';

export interface DriveAcademyLibraryState {
  books: ImportedVocationalBookEntry[];
  simulators: ImportedDriveSimulator[];
  lastSyncedAt: string | null;
}

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = academyActivityStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function readDriveAcademyLibrary(): DriveAcademyLibraryState {
  const books = safeReadJson<ImportedVocationalBookEntry[]>(DRIVE_VOCATIONAL_BOOKS_KEY, []);
  const simulators = safeReadJson<ImportedDriveSimulator[]>(DRIVE_SIMULATORS_KEY, []);
  const validBooks = Array.isArray(books) ? books.filter(b => b?.book?.format === 'EDB' && b?.indexEntry?.id) : [];
  const validSims = Array.isArray(simulators) ? simulators.filter(s => typeof s?.id === 'string' && typeof s?.titleEn === 'string') : [];
  const timestamps = [...validBooks.map(b => b.importedAt), ...validSims.map(s => s.importedAt)].filter(Boolean).sort();
  return {
    books: validBooks,
    simulators: validSims,
    lastSyncedAt: timestamps.length ? timestamps[timestamps.length - 1] : null,
  };
}

function notifyDriveAcademyUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DRIVE_ACADEMY_UPDATED_EVENT));
  }
}

export function upsertDriveAcademyImport(
  incomingBooks: ImportedVocationalBookEntry[],
  incomingSims: ImportedDriveSimulator[]
): DriveAcademyLibraryState {
  const current = readDriveAcademyLibrary();

  const bookMap = new Map<string, ImportedVocationalBookEntry>();
  for (const b of current.books) bookMap.set(b.sourceFileId || b.indexEntry.id, b);
  for (const b of incomingBooks) bookMap.set(b.sourceFileId || b.indexEntry.id, b);

  const simMap = new Map<string, ImportedDriveSimulator>();
  for (const s of current.simulators) simMap.set(s.sourceFileId || s.id, s);
  for (const s of incomingSims) simMap.set(s.sourceFileId || s.id, s);

  const nextBooks = Array.from(bookMap.values());
  const nextSims = Array.from(simMap.values());

  try {
    academyActivityStorage.setItem(DRIVE_VOCATIONAL_BOOKS_KEY, JSON.stringify(nextBooks));
    academyActivityStorage.setItem(DRIVE_SIMULATORS_KEY, JSON.stringify(nextSims));
  } catch {
    // Storage quota exceeded — trim oldest HTML payloads if needed
    const compactSims = nextSims.map(s => ({ ...s, htmlContent: undefined }));
    try {
      academyActivityStorage.setItem(DRIVE_VOCATIONAL_BOOKS_KEY, JSON.stringify(nextBooks));
      academyActivityStorage.setItem(DRIVE_SIMULATORS_KEY, JSON.stringify(compactSims));
    } catch {
      // ignore
    }
  }

  notifyDriveAcademyUpdate();
  return readDriveAcademyLibrary();
}

export function removeImportedVocationalBook(bookId: string): void {
  const current = readDriveAcademyLibrary();
  const nextBooks = current.books.filter(b => b.indexEntry.id !== bookId);
  try {
    academyActivityStorage.setItem(DRIVE_VOCATIONAL_BOOKS_KEY, JSON.stringify(nextBooks));
  } catch {
    // ignore
  }
  notifyDriveAcademyUpdate();
}

export function removeImportedDriveSimulator(simId: string): void {
  const current = readDriveAcademyLibrary();
  const nextSims = current.simulators.filter(s => s.id !== simId);
  try {
    academyActivityStorage.setItem(DRIVE_SIMULATORS_KEY, JSON.stringify(nextSims));
  } catch {
    // ignore
  }
  notifyDriveAcademyUpdate();
}

export function clearDriveAcademyLibrary(): void {
  try {
    academyActivityStorage.removeItem(DRIVE_VOCATIONAL_BOOKS_KEY);
    academyActivityStorage.removeItem(DRIVE_SIMULATORS_KEY);
  } catch {
    // ignore
  }
  notifyDriveAcademyUpdate();
}

export function useDriveAcademyLibrary(): DriveAcademyLibraryState {
  const [state, setState] = useState<DriveAcademyLibraryState>(() => readDriveAcademyLibrary());

  useEffect(() => {
    const sync = () => setState(readDriveAcademyLibrary());
    sync();
    window.addEventListener(DRIVE_ACADEMY_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(DRIVE_ACADEMY_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return state;
}
