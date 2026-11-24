/**
 * Idempotently sync the approved Google Drive "مدرسه" PDF folder into the
 * server-only Firestore index. PDFs/text are never written to the repository.
 *
 * Required only when an owner runs this job: INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT
 * containing a service-account JSON with Firestore access and Drive read access;
 * share the source folder with that service account before running. Do not print or
 * commit the secret. Use --dry-run to inspect metadata/extraction counts first.
 */
import { createHash } from 'node:crypto';
import { google } from 'googleapis';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { FieldPath, type DocumentReference } from 'firebase-admin/firestore';
import { getPrivateKnowledgeServices } from '../server/ai/privateKnowledge.js';
import { tokenize } from '../src/ai/search.js';

const SCHOOL_FOLDER_ID = '1Aazy_CaVLDHgpFreuTGKmYPIex9Hitil';
const MAX_PDF_BYTES = 100 * 1024 * 1024;
const CHUNK_CHARS = 1200;
const CHUNK_OVERLAP = 160;
const MAX_TERMS_PER_CHUNK = 200;
const PDF_MIME = 'application/pdf';
const BATCH_SIZE = 400;

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  md5Checksum?: string;
  modifiedTime?: string;
};

function readAccount(): { project_id: string; client_email: string; private_key: string } {
  const raw = (process.env.INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT || '').trim();
  if (!raw) throw new Error('Set INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT in the local environment or encrypted job environment.');
  const account = JSON.parse(raw);
  if (!account.project_id || !account.client_email || !account.private_key) throw new Error('Service account JSON is missing required fields.');
  return account;
}

async function listAllChildren(drive: ReturnType<typeof google.drive>, folderId: string, seen: Set<string>): Promise<DriveFile[]> {
  if (seen.has(folderId)) return [];
  seen.add(folderId);
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 1000,
      pageToken,
      fields: 'nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const rows = (response.data.files ?? []) as DriveFile[];
    files.push(...rows.filter(file => file.mimeType === PDF_MIME));
    for (const child of rows) {
      if (child.mimeType === 'application/vnd.google-apps.folder' && child.id) {
        files.push(...await listAllChildren(drive, child.id, seen));
      }
    }
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);
  return files;
}

function chunkText(text: string): string[] {
  const clean = text.replace(/\u0000/g, ' ').replace(/[ \t]+/g, ' ').replace(/\s+/g, ' ').trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(clean.length, start + CHUNK_CHARS);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf(' ', end);
      if (boundary > start + Math.floor(CHUNK_CHARS * 0.65)) end = boundary;
    }
    const piece = clean.slice(start, end).trim();
    if (piece.length >= 30) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }
  return chunks;
}

async function extractPages(bytes: Uint8Array): Promise<string[]> {
  const pdf = await getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false, verbosity: 0 }).promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map(item => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean)
        .join(' ');
      pages.push(text);
    }
    return pages;
  } finally {
    await pdf.destroy();
  }
}

async function fetchPdf(drive: ReturnType<typeof google.drive>, fileId: string): Promise<Uint8Array> {
  const response = await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
  return new Uint8Array(response.data as ArrayBuffer);
}

async function deleteOldRevisions(db: NonNullable<ReturnType<typeof getPrivateKnowledgeServices>>['db'], sourceId: string, revision: string) {
  const old = await db.collection('agent_knowledge_chunks').where('sourceId', '==', sourceId).get();
  const stale = old.docs.filter(doc => doc.get('revision') !== revision).map(doc => doc.ref);
  for (let offset = 0; offset < stale.length; offset += BATCH_SIZE) {
    const batch = db.batch();
    stale.slice(offset, offset + BATCH_SIZE).forEach((ref: DocumentReference) => batch.delete(ref));
    await batch.commit();
  }
}

async function main() {
  const services = getPrivateKnowledgeServices();
  if (!services) throw new Error('Firestore admin is not configured; no data was read or written.');
  const account = readAccount();
  const auth = new google.auth.JWT({
    email: account.client_email,
    key: account.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });
  const files = await listAllChildren(drive, SCHOOL_FOLDER_ID, new Set());
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Found ${files.length} PDF(s) under the supplied Drive folder. Mode: ${dryRun ? 'dry run' : 'sync'}.`);
  if (dryRun) {
    for (const file of files) console.log(`${file.name}\t${file.size ?? 'unknown'} bytes\t${file.id}`);
    return;
  }

  const seenChecksum = new Map<string, string>();
  let imported = 0;
  let unchanged = 0;
  let duplicate = 0;
  let empty = 0;
  let failed = 0;

  for (const file of files) {
    if (!file.id || !file.name) continue;
    const sourceRef = services.db.collection('agent_knowledge_sources').doc(file.id);
    const oldSource = await sourceRef.get();
    const checksum = file.md5Checksum || '';
    const prior = oldSource.data();
    if (checksum && prior?.checksum === checksum && prior?.status === 'active') {
      seenChecksum.set(checksum, file.id);
      unchanged += 1;
      continue;
    }
    if (checksum && seenChecksum.has(checksum)) {
      await sourceRef.set({
        sourceId: file.id, title: file.name, mimeType: file.mimeType, checksum,
        status: 'duplicate', duplicateOf: seenChecksum.get(checksum), updatedAt: new Date().toISOString(),
      }, { merge: true });
      duplicate += 1;
      continue;
    }

    try {
      const declaredSize = Number(file.size ?? 0);
      if (declaredSize > MAX_PDF_BYTES) throw new Error(`file exceeds ${MAX_PDF_BYTES} byte safety limit`);
      const bytes = await fetchPdf(drive, file.id);
      if (bytes.byteLength > MAX_PDF_BYTES) throw new Error(`download exceeds ${MAX_PDF_BYTES} byte safety limit`);
      const revision = createHash('sha256').update(checksum || bytes).update(file.modifiedTime ?? '').digest('hex').slice(0, 24);
      const pages = await extractPages(bytes);
      const chunks: Array<{ page: number; chunk: number; text: string; terms: string[] }> = [];
      pages.forEach((pageText, index) => chunkText(pageText).forEach((text, chunk) => {
        chunks.push({ page: index + 1, chunk, text, terms: [...new Set(tokenize(text))].slice(0, MAX_TERMS_PER_CHUNK) });
      }));

      if (!chunks.length) {
        await sourceRef.set({
          sourceId: file.id, title: file.name, mimeType: file.mimeType, checksum,
          status: 'empty', extraction: 'no selectable text (possibly scanned pages)', pageCount: pages.length,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        empty += 1;
        continue;
      }

      // Write a complete new revision first. The source manifest switches atomically
      // only after all chunks are durable; readers keep using the old revision meanwhile.
      for (let offset = 0; offset < chunks.length; offset += BATCH_SIZE) {
        const batch = services.db.batch();
        chunks.slice(offset, offset + BATCH_SIZE).forEach(chunk => {
          const id = `${file.id}_${revision}_p${chunk.page}_c${chunk.chunk}`;
          batch.set(services.db.collection('agent_knowledge_chunks').doc(id), {
            sourceId: file.id,
            revision,
            title: file.name,
            section: `Page ${chunk.page}`,
            page: chunk.page,
            chunk: chunk.chunk,
            text: chunk.text,
            terms: chunk.terms,
            discipline: 'NDT',
            modifiedTime: file.modifiedTime ?? null,
          });
        });
        await batch.commit();
      }
      await sourceRef.set({
        sourceId: file.id,
        title: file.name,
        mimeType: file.mimeType,
        checksum,
        currentRevision: revision,
        status: 'active',
        pageCount: pages.length,
        chunkCount: chunks.length,
        modifiedTime: file.modifiedTime ?? null,
        syncedAt: new Date().toISOString(),
        sourceUrl: `https://drive.google.com/open?id=${encodeURIComponent(file.id)}`,
      });
      await deleteOldRevisions(services.db, file.id, revision);
      if (checksum) seenChecksum.set(checksum, file.id);
      imported += 1;
      console.log(`Indexed ${file.name}: ${pages.length} page(s), ${chunks.length} chunk(s).`);
    } catch (error) {
      // Keep the previous active revision intact on a failed update.
      const message = error instanceof Error ? error.message.slice(0, 180) : 'unknown import error';
      console.error(`Skipped ${file.name}: ${message}`);
      failed += 1;
    }
  }
  console.log(JSON.stringify({ found: files.length, imported, unchanged, duplicate, empty, failed }));
  if (failed) process.exitCode = 1;
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Drive knowledge sync failed');
  process.exitCode = 1;
});
