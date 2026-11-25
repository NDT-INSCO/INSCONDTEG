import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import type { DriveRawItem } from '../utils/driveOrganizer';
import type { ExtractedDriveContent } from '../utils/driveAcademyImporter';

/**
 * Required Google Drive scope for browsing, creating destination folders,
 * and moving files into organized Education & Simulators subfolders.
 */
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
] as const;

let isSigningIn = false;
// Strictly in-memory OAuth token cache (never written to localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

export function getCachedDriveAccessToken(): string | null {
  return cachedAccessToken;
}

export function observeDriveAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthNeeded?: (user: User | null) => void
): Unsubscribe {
  if (!auth) {
    onAuthNeeded?.(null);
    return () => {};
  }
  return onAuthStateChanged(auth, user => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
    } else {
      if (!isSigningIn && !user) {
        cachedAccessToken = null;
      }
      onAuthNeeded?.(user);
    }
  });
}

export async function signInWithGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized in this environment.');
  }
  const provider = new GoogleAuthProvider();
  for (const scope of GOOGLE_DRIVE_SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({ prompt: 'consent select_account' });

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned by sign-in.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function disconnectGoogleDrive(): Promise<void> {
  cachedAccessToken = null;
  if (auth) {
    await auth.signOut();
  }
}

interface DriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
}

async function driveJsonFetch<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401) {
    cachedAccessToken = null;
    throw Object.assign(new Error('Google Drive session expired. Please sign in again.'), { status: 401 });
  }

  if (!response.ok) {
    let message = `Drive API error (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      if (payload?.error?.message) message = payload.error.message;
    } catch {
      // ignore non-json error body
    }
    throw Object.assign(new Error(message), { status: response.status });
  }

  return (await response.json()) as T;
}

export async function listDriveFolderTree(
  accessToken: string,
  rootFolderId: string
): Promise<{ folderName: string; files: DriveRawItem[]; existingSubfolders: Map<string, string> }> {
  const folderMeta = await driveJsonFetch<DriveApiFile>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(rootFolderId)}?fields=id,name,mimeType&supportsAllDrives=true`,
    accessToken
  );

  if (folderMeta.mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error('The provided Google Drive ID is not a folder.');
  }

  const collected: DriveRawItem[] = [];
  const existingSubfolders = new Map<string, string>();
  const visitedFolders = new Set<string>();
  const queue: Array<{ id: string; path: string; isRoot: boolean }> = [
    { id: rootFolderId, path: '', isRoot: true },
  ];

  while (queue.length > 0 && visitedFolders.size < 60) {
    const current = queue.shift()!;
    if (visitedFolders.has(current.id)) continue;
    visitedFolders.add(current.id);

    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q: `'${current.id}' in parents and trashed = false`,
        pageSize: '200',
        fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,parents)',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const page = await driveJsonFetch<{ nextPageToken?: string; files?: DriveApiFile[] }>(
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
        accessToken
      );

      for (const entry of page.files ?? []) {
        if (entry.mimeType === 'application/vnd.google-apps.folder') {
          if (current.isRoot) {
            existingSubfolders.set(entry.name, entry.id);
          }
          queue.push({
            id: entry.id,
            path: current.path ? `${current.path}/${entry.name}` : entry.name,
            isRoot: false,
          });
        } else {
          collected.push({
            id: entry.id,
            name: entry.name,
            mimeType: entry.mimeType,
            sizeBytes: entry.size ? Number(entry.size) : undefined,
            modifiedTime: entry.modifiedTime,
            webViewLink: entry.webViewLink,
            parents: entry.parents,
            folderPath: current.path || '/',
          });
        }
      }

      pageToken = page.nextPageToken;
    } while (pageToken);
  }

  return {
    folderName: folderMeta.name,
    files: collected,
    existingSubfolders,
  };
}

export async function ensureDriveSubfolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string,
  existingMap?: Map<string, string>
): Promise<string> {
  const known = existingMap?.get(folderName);
  if (known) return known;

  const escapedName = folderName.replace(/'/g, "\\'");
  const params = new URLSearchParams({
    q: `'${parentFolderId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    pageSize: '1',
    fields: 'files(id,name)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const search = await driveJsonFetch<{ files?: Array<{ id: string }> }>(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    accessToken
  );

  if (search.files?.[0]?.id) {
    existingMap?.set(folderName, search.files[0].id);
    return search.files[0].id;
  }

  const created = await driveJsonFetch<{ id: string }>(
    'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      }),
    }
  );
  existingMap?.set(folderName, created.id);
  return created.id;
}

function parseCsvRows(raw: string): string[][] {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 60)
    .map(line =>
      line
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map(cell => cell.replace(/^"|"$/g, '').trim())
    );
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractPdfPagesInBrowser(bytes: Uint8Array): Promise<Array<{ pageNumber: number; text: string }>> {
  const pdfjs = await import('pdfjs-dist');
  try {
    const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    if (workerModule?.default && pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
    }
  } catch {
    // Fallback if bundler URL import is unavailable in tests
  }
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true, verbosity: 0 });
  const pdf = await task.promise;
  try {
    const maxPages = Math.min(pdf.numPages, 20);
    const pages: Array<{ pageNumber: number; text: string }> = [];
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map(item => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean)
        .join(' ')
        .trim();
      if (text) pages.push({ pageNumber, text });
    }
    return pages;
  } finally {
    const closable = pdf as unknown as { destroy?: () => Promise<void>; cleanup?: () => Promise<void> };
    if (typeof closable.destroy === 'function') {
      await closable.destroy();
    } else if (typeof closable.cleanup === 'function') {
      await closable.cleanup();
    }
  }
}

export async function fetchDriveFileContent(
  accessToken: string,
  file: DriveRawItem
): Promise<ExtractedDriveContent> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Google Workspace native files (Docs / Slides / Sheets)
  if (
    file.mimeType === 'application/vnd.google-apps.document' ||
    file.mimeType === 'application/vnd.google-apps.presentation'
  ) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text%2Fplain&supportsAllDrives=true`,
      { headers }
    );
    if (res.status === 401) {
      cachedAccessToken = null;
      throw Object.assign(new Error('Google Drive session expired. Please sign in again.'), { status: 401 });
    }
    if (!res.ok) {
      return { text: '', extractionMethod: 'metadata-only', note: `Export returned ${res.status}` };
    }
    const text = await res.text();
    return { text, extractionMethod: 'google-export' };
  }

  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text%2Fcsv&supportsAllDrives=true`,
      { headers }
    );
    if (res.status === 401) {
      cachedAccessToken = null;
      throw Object.assign(new Error('Google Drive session expired. Please sign in again.'), { status: 401 });
    }
    if (!res.ok) {
      return { text: '', extractionMethod: 'metadata-only', note: `Sheet export returned ${res.status}` };
    }
    const rawCsv = await res.text();
    return {
      text: rawCsv,
      csvRows: parseCsvRows(rawCsv),
      extractionMethod: 'csv',
    };
  }

  // Binary / text media download (capped safely at 35 MB in browser)
  const MAX_BROWSER_BYTES = 35 * 1024 * 1024;
  if (file.sizeBytes && file.sizeBytes > MAX_BROWSER_BYTES) {
    return {
      text: '',
      extractionMethod: 'metadata-only',
      note: 'File exceeds 35 MB browser extraction limit; linked as Drive reference.',
    };
  }

  const isHtml = file.mimeType === 'text/html' || /\.html?$/i.test(file.name);
  const isCsv = file.mimeType === 'text/csv' || /\.csv$/i.test(file.name);
  const isTextLike =
    isHtml ||
    isCsv ||
    file.mimeType.startsWith('text/') ||
    file.mimeType === 'application/json' ||
    /\.(txt|md|json|svg)$/i.test(file.name);
  const isPdf = file.mimeType === 'application/pdf' || /\.pdf$/i.test(file.name);

  if (!isTextLike && !isPdf) {
    return {
      text: '',
      extractionMethod: 'metadata-only',
      note: 'Binary or specialized CAD/simulator format linked with Drive reference.',
    };
  }

  const mediaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`,
    { headers }
  );
  if (mediaRes.status === 401) {
    cachedAccessToken = null;
    throw Object.assign(new Error('Google Drive session expired. Please sign in again.'), { status: 401 });
  }
  if (!mediaRes.ok) {
    return {
      text: '',
      extractionMethod: 'metadata-only',
      note: `Drive media download returned ${mediaRes.status}.`,
    };
  }

  if (isTextLike) {
    const rawText = await mediaRes.text();
    if (isHtml) {
      return {
        text: stripHtmlToText(rawText),
        htmlContent: rawText,
        extractionMethod: 'html',
      };
    }
    if (isCsv) {
      return {
        text: rawText,
        csvRows: parseCsvRows(rawText),
        extractionMethod: 'csv',
      };
    }
    return { text: rawText, extractionMethod: 'text' };
  }

  // PDF extraction via pdfjs-dist
  try {
    const buffer = await mediaRes.arrayBuffer();
    const pages = await extractPdfPagesInBrowser(new Uint8Array(buffer));
    const joined = pages.map(p => p.text).join('\n\n');
    return {
      text: joined,
      pages,
      extractionMethod: 'pdfjs',
      note: pages.length === 0 ? 'PDF has scanned image pages without selectable text.' : undefined,
    };
  } catch (err) {
    return {
      text: '',
      extractionMethod: 'metadata-only',
      note: err instanceof Error ? err.message : 'PDF extraction unavailable in this browser session.',
    };
  }
}

export async function moveDriveFileToFolder(
  accessToken: string,
  fileId: string,
  targetFolderId: string,
  currentParents: string[] | undefined
): Promise<void> {
  const removeParents = (currentParents ?? []).filter(p => p !== targetFolderId).join(',');
  const params = new URLSearchParams({
    addParents: targetFolderId,
    supportsAllDrives: 'true',
    fields: 'id,parents',
  });
  if (removeParents) params.set('removeParents', removeParents);

  await driveJsonFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`,
    accessToken,
    { method: 'PATCH' }
  );
}
