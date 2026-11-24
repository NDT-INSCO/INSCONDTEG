/**
 * Server-only access to INSCO's private Drive-derived Firestore knowledge index.
 *
 * Client access is denied by default: the caller must present a Firebase ID token
 * carrying the explicit `inscoKnowledgeAccess` custom claim. No document text or
 * credential is ever bundled into the browser build.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { CorpusDocument } from '../../src/ai/corpus.js';
import { expandQuery, getLibraryIndex, tokenize } from '../../src/ai/search.js';

const CHUNKS = 'agent_knowledge_chunks';
const SOURCES = 'agent_knowledge_sources';
const MAX_CANDIDATES = 250;
const FIRESTORE_QUERY_TERMS = 30;

export interface PrivateKnowledgeServices {
  db: Firestore;
  auth: Auth;
}

let cached: PrivateKnowledgeServices | null | undefined;
let warnedUnavailable = false;

/** A service-account JSON secret is read at runtime only; never log it. */
export function getPrivateKnowledgeServices(): PrivateKnowledgeServices | null {
  if (cached !== undefined) return cached;
  const raw = (process.env.INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return (cached = null);
  try {
    const account = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
    if (!account.project_id || !account.client_email || !account.private_key) throw new Error('invalid service account fields');
    const app = getApps().find(item => item.name === 'insco-private-knowledge') ?? initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key.replace(/\\n/g, '\n'),
      }),
      projectId: account.project_id,
    }, 'insco-private-knowledge');
    cached = { db: getFirestore(app), auth: getAuth(app) };
    return cached;
  } catch {
    if (!warnedUnavailable) {
      console.error('[ai] private knowledge store unavailable (check server-side configuration)');
      warnedUnavailable = true;
    }
    return (cached = null);
  }
}

/**
 * Return no private content unless the Firebase token has the explicit allow-claim.
 * A verified account alone is deliberately not enough for licensed standards.
 */
export async function searchPrivateKnowledge(query: string, idToken?: string): Promise<CorpusDocument[]> {
  if (!idToken || !query.trim()) return [];
  const services = getPrivateKnowledgeServices();
  if (!services) return [];

  try {
    const claims = await services.auth.verifyIdToken(idToken, true);
    if (claims.inscoKnowledgeAccess !== true) return [];

    const expanded = expandQuery(query, getLibraryIndex())
      .sort((a, b) => b.weight - a.weight)
      .map(term => term.term);
    const terms = [...new Set([...tokenize(query), ...expanded])].slice(0, FIRESTORE_QUERY_TERMS);
    if (!terms.length) return [];

    const matches = await services.db.collection(CHUNKS)
      .where('terms', 'array-contains-any', terms)
      .limit(MAX_CANDIDATES)
      .get();
    if (matches.empty) return [];

    const chunks = matches.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    const sourceIds = [...new Set(chunks.map(item => item.data.sourceId).filter((id): id is string => typeof id === 'string'))];
    if (!sourceIds.length) return [];
    const sourceSnapshots = await services.db.getAll(...sourceIds.map(id => services.db.collection(SOURCES).doc(id)));
    const current = new Map(sourceSnapshots.map(snapshot => [snapshot.id, snapshot.data()]));

    return chunks.flatMap(({ id, data }) => {
      const sourceId = typeof data.sourceId === 'string' ? data.sourceId : '';
      const source = current.get(sourceId);
      if (!source || source.status !== 'active' || source.currentRevision !== data.revision) return [];
      if (typeof data.text !== 'string' || data.text.trim().length < 30 || typeof data.title !== 'string') return [];
      const page = Number.isInteger(data.page) && data.page > 0 ? data.page as number : undefined;
      const title = data.title.slice(0, 240);
      const section = typeof data.section === 'string' ? data.section.slice(0, 240) : (page ? `Page ${page}` : '');
      return [{
        id: `drive:${sourceId}#${id}`,
        kind: 'textbook' as const,
        bookId: sourceId,
        ...(typeof source.sourceUrl === 'string' ? { sourceUrl: source.sourceUrl } : {}),
        ...(page ? { pageNumber: page } : {}),
        title: { ar: title, en: title },
        section: { ar: section, en: section },
        discipline: typeof data.discipline === 'string' ? data.discipline.slice(0, 80) : 'NDT',
        // The source may be English or Arabic; identical text fields let the
        // bilingual term normalizer search the exact extracted source safely.
        text: { ar: data.text, en: data.text },
      } satisfies CorpusDocument];
    });
  } catch {
    // An unavailable private index should never turn the public/local answer path
    // into an outage, and diagnostics must not include a token or document content.
    if (!warnedUnavailable) {
      console.error('[ai] private knowledge lookup skipped (authorization or store unavailable)');
      warnedUnavailable = true;
    }
    return [];
  }
}

export function resetPrivateKnowledgeForTests(): void {
  cached = undefined;
  warnedUnavailable = false;
}
