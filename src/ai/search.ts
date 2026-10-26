/**
 * Lexical search over the library (BM25) with a bilingual thesaurus.
 *
 * The "semantic search" box in the UI was an input with no handler: it rendered
 * and did nothing. This module replaces it with retrieval that actually works
 * offline, on GitHub Pages, with no API key and no network call.
 *
 * Trade-off, stated plainly: this is retrieval by terms, not by vectors. It
 * cannot match a paraphrase that shares no vocabulary. It handles the cases the
 * library actually gets wrong today — Arabic query against English text,
 * plurals, abbreviations (HAZ, IQI, PAUT), and long questions pasted into a
 * search box — via normalisation and a curated thesaurus. When an embedding
 * key exists the same interface can be backed by vectors without touching the
 * callers.
 */
import { buildPhraseIndex, buildSynonymIndex, TermGroup } from './synonyms';
import { CorpusDocument, CorpusKind, getCorpus } from './corpus';

/* ------------------------------------------------------------------ */
/* text normalisation                                                  */
/* ------------------------------------------------------------------ */

const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const AR_STOP = new Set([
  'من', 'في', 'على', 'عن', 'الى', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين',
  'ما', 'هو', 'هي', 'هل', 'ثم', 'او', 'ان', 'كان', 'كانت', 'يكون', 'لا', 'لم', 'لن', 'قد',
  'كل', 'بعض', 'بين', 'عند', 'بعد', 'قبل', 'حتى', 'كما', 'اي', 'يا', 'انه', 'انها', 'هناك',
  'كيف', 'لماذا', 'متى', 'اين', 'ماذا', 'وما', 'ومن', 'وفي', 'وعلى', 'الى', 'عليه', 'عليها',
  'يمكن', 'يجب', 'يتم', 'تم', 'تمت', 'هو', 'هي', 'اذا', 'إذ', 'عندما', 'حيث', 'لكن', 'بل',
]);

const EN_STOP = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'at', 'for', 'with', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'what', 'how', 'why', 'when', 'which', 'who', 'that',
  'this', 'these', 'those', 'it', 'its', 'as', 'by', 'from', 'can', 'could', 'should', 'would',
  'do', 'does', 'did', 'not', 'but', 'if', 'then', 'than', 'about', 'into', 'over', 'under',
  'between', 'during', 'before', 'after', 'i', 'you', 'we', 'they', 'he', 'she', 'please',
  'explain', 'tell', 'give', 'show', 'want', 'need', 'there', 'their', 'also', 'more', 'most',
]);

/** Arabic → canonical form: no diacritics, unified letters, ASCII digits. */
export function normaliseArabic(input: string): string {
  return input
    .replace(CONTROL, ' ')
    .replace(AR_DIACRITICS, '')
    .replace(/\u0640/g, '')
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, digit => String(digit.charCodeAt(0) - 0x06F0));
}

/** Light, deliberately conservative stemming. Precision beats recall here. */
function stem(token: string): string {
  let value = token;
  if (/^[\u0600-\u06FF]/.test(value)) {
    if (value.length > 3 && value.startsWith('\u0627\u0644')) value = value.slice(2);
    if (value.length > 4 && value.endsWith('\u0627\u062A')) value = value.slice(0, -2);
    return value;
  }
  if (value.length > 3 && value.endsWith("'s")) value = value.slice(0, -2);
  if (value.length > 4 && value.endsWith('ies')) value = `${value.slice(0, -3)}y`;
  else if (value.length > 4 && value.endsWith('es')) value = value.slice(0, -2);
  else if (value.length > 4 && value.endsWith('s') && !value.endsWith('ss')) value = value.slice(0, -1);
  return value;
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const normalised = normaliseArabic(text).toLowerCase();
  const raw = normalised.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const tokens: string[] = [];
  for (const item of raw) {
    if (item.length < 2) continue;
    if (/^[0-9]+$/.test(item) && item.length < 2) continue;
    if (AR_STOP.has(item) || EN_STOP.has(item)) continue;
    const stemmed = stem(item);
    if (!stemmed || (AR_STOP.has(stemmed) && stemmed !== item)) continue;
    tokens.push(stemmed);
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/* index                                                               */
/* ------------------------------------------------------------------ */

interface IndexedDocument {
  document: CorpusDocument;
  /** Body term frequencies (Arabic + English merged: one page, one concept). */
  tf: Map<string, number>;
  titleTf: Map<string, number>;
  length: number;
}

export interface LibraryIndex {
  documents: IndexedDocument[];
  df: Map<string, number>;
  averageLength: number;
  synonyms: Map<string, string[]>;
  phrases: { phrase: string; expansions: string[] }[];
}

const K1 = 1.45;
const B = 0.72;
const TITLE_BOOST = 2.4;

function countTerms(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
  return tf;
}

export function buildIndex(documents: CorpusDocument[], groups?: TermGroup[]): LibraryIndex {
  const indexed: IndexedDocument[] = [];
  const df = new Map<string, number>();
  let totalLength = 0;

  for (const document of documents) {
    const bodyTokens = tokenize(`${document.text.ar}\n${document.text.en}\n${document.section.ar} ${document.section.en}`);
    const titleTokens = tokenize(`${document.title.ar} ${document.title.en}`);
    const tf = countTerms(bodyTokens);
    for (const [term] of tf) df.set(term, (df.get(term) ?? 0) + 1);
    const titleTf = countTerms(titleTokens);
    for (const [term] of titleTf) {
      if (!tf.has(term)) df.set(term, (df.get(term) ?? 0) + 1);
    }
    indexed.push({ document, tf, titleTf, length: Math.max(1, bodyTokens.length) });
    totalLength += Math.max(1, bodyTokens.length);
  }

  return {
    documents: indexed,
    df,
    averageLength: indexed.length ? totalLength / indexed.length : 1,
    synonyms: buildSynonymIndex(groups),
    phrases: buildPhraseIndex(groups).map(entry => ({ ...entry, phrase: normaliseArabic(entry.phrase).toLowerCase() })),
  };
}

let cachedIndex: LibraryIndex | null = null;

export function getLibraryIndex(): LibraryIndex {
  if (!cachedIndex) cachedIndex = buildIndex(getCorpus());
  return cachedIndex;
}

export function resetSearchCache(): void {
  cachedIndex = null;
}

/* ------------------------------------------------------------------ */
/* query                                                               */
/* ------------------------------------------------------------------ */

export interface QueryTerm {
  term: string;
  weight: number;
  source: 'query' | 'synonym' | 'phrase';
}

/** Query → weighted terms, expanding through the thesaurus. */
export function expandQuery(query: string, index: LibraryIndex): QueryTerm[] {
  const base = tokenize(query);
  const weighted = new Map<string, QueryTerm>();

  const add = (term: string, weight: number, source: QueryTerm['source']) => {
    const clean = stem(term.trim());
    if (!clean) return;
    const existing = weighted.get(clean);
    if (!existing || existing.weight < weight) weighted.set(clean, { term: clean, weight, source });
  };

  for (const token of base) add(token, 1, 'query');

  for (const token of base) {
    const expansions = index.synonyms.get(token);
    if (!expansions) continue;
    for (const expansion of expansions) {
      for (const part of tokenize(expansion)) add(part, 0.55, 'synonym');
    }
  }

  const normalisedQuery = ` ${tokenize(query).join(' ')} `;
  const rawNormalised = ` ${normaliseArabic(query).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  for (const entry of index.phrases) {
    const phraseNormalised = ` ${entry.phrase.replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
    if (!phraseNormalised.trim() || !(normalisedQuery.includes(phraseNormalised) || rawNormalised.includes(phraseNormalised))) continue;
    for (const expansion of entry.expansions) {
      for (const part of tokenize(expansion)) add(part, 0.5, 'phrase');
    }
  }

  return [...weighted.values()];
}

/* ------------------------------------------------------------------ */
/* scoring                                                             */
/* ------------------------------------------------------------------ */

function idf(index: LibraryIndex, term: string): number {
  const total = index.documents.length;
  const df = index.df.get(term) ?? 0;
  return Math.log(1 + (total - df + 0.5) / (df + 0.5));
}

export interface SearchHit {
  document: CorpusDocument;
  score: number;
  matched: string[];
  /** How many of the user's own words matched (synonym hits excluded). */
  baseMatched: number;
  /** True when a matched word is rare in the library (df <= 2). */
  rareMatch: boolean;
  snippet: { ar: string; en: string };
}

export interface SearchResult {
  query: string;
  hits: SearchHit[];
  /** false when nothing crossed minScore: the caller must say "no match". */
  confident: boolean;
  indexed: number;
  terms: string[];
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  kinds?: CorpusKind[];
  index?: LibraryIndex;
}

/** The sentence with the most query terms, trimmed for display. */
export function extractSnippet(text: string, terms: string[], maxChars = 260): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (terms.length === 0) return clean.slice(0, maxChars);
  const sentences = clean.split(/(?<=[.!?؟\n])\s+/).filter(Boolean);
  let best = '';
  let bestScore = 0;
  for (const sentence of sentences) {
    const tokens = new Set(tokenize(sentence));
    let score = 0;
    for (const term of terms) if (tokens.has(term)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = sentence;
    }
  }
  const chosen = best || clean;
  if (chosen.length <= maxChars) return chosen;
  return `${chosen.slice(0, maxChars - 1).trimEnd()}…`;
}

export function searchLibrary(query: string, options: SearchOptions = {}): SearchResult {
  const index = options.index ?? getLibraryIndex();
  const limit = options.limit ?? 6;
  const minScore = options.minScore ?? 4.2;
  const kinds = options.kinds;
  const terms = expandQuery(query, index);

  if (terms.length === 0) {
    return { query, hits: [], confident: false, indexed: index.documents.length, terms: [] };
  }

  const baseSet = new Set(terms.filter(term => term.weight >= 1).map(term => term.term));
  const normalisedQuery = normaliseArabic(query).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const hits: SearchHit[] = [];

  for (const entry of index.documents) {
    if (kinds && !kinds.includes(entry.document.kind)) continue;

    let score = 0;
    const matched: string[] = [];
    for (const term of terms) {
      const key = term.term;
      const body = entry.tf.get(key) ?? 0;
      const title = entry.titleTf.get(key) ?? 0;
      if (body === 0 && title === 0) continue;
      matched.push(key);
      const weight = idf(index, key);
      const norm = K1 * (1 - B + (B * entry.length) / index.averageLength);
      score += term.weight * weight * (body * (K1 + 1)) / (body + norm);
      if (title > 0) score += term.weight * weight * TITLE_BOOST;
    }

    if (score <= 0) continue;

    // Whole-query phrase bonus: an exact title match should always win.
    if (normalisedQuery.length >= 4) {
      const titleText = normaliseArabic(`${entry.document.title.ar} ${entry.document.title.en}`).toLowerCase();
      const bodyText = normaliseArabic(`${entry.document.text.ar} ${entry.document.text.en}`).toLowerCase();
      if (titleText.includes(normalisedQuery)) score += 3;
      else if (bodyText.includes(normalisedQuery)) score += 1.2;
    }

    const baseMatched = matched.filter(term => baseSet.has(term)).length;
    const rareMatch = matched.some(term => baseSet.has(term) && (index.df.get(term) ?? 0) <= 2);
    // Reward answers that cover more of the question, not one lucky word.
    if (baseSet.size > 1) score *= 1 + 0.55 * (baseMatched / baseSet.size);

    hits.push({
      document: entry.document,
      score,
      matched,
      baseMatched,
      rareMatch,
      snippet: {
        ar: extractSnippet(entry.document.text.ar, matched),
        en: extractSnippet(entry.document.text.en, matched),
      },
    });
  }

  hits.sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id));
  const top = hits.slice(0, limit);
  // Two independent signals: a real score, and either several of the user's
  // words matched or one very strong hit. One generic word ("best", "all") is
  // not a search result, it is noise, and the UI must say so.
  const best = top[0];
  const confident =
    Boolean(best) &&
    best.score >= minScore &&
    (best.baseMatched >= 2 || best.rareMatch || best.score >= minScore * 2.2);
  return {
    query,
    hits: top,
    confident,
    indexed: index.documents.length,
    terms: [...baseSet],
  };
}

/** Retrieval for the tutor: same ranking, tuned for prompt assembly. */
export function retrieveForTutor(query: string, options: SearchOptions & { minScore?: number } = {}): SearchHit[] {
  const result = searchLibrary(query, { limit: 5, ...options });
  return result.confident ? result.hits : [];
}
