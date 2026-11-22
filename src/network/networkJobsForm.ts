/**
 * The jobs board — form model, validation and mapping.
 *
 * Opportunities live in the shipped `community_opportunities` collection and are
 * written through `createCommunityOpportunity`, so the network adds no collection
 * and no rule. Everything here mirrors `isValidCommunityOpportunity`:
 *
 *   title 3–180 · location 2–140 · requirements 5–1500 · methods 1–8 (each ≤ 32)
 *   type ∈ {job, tender, equipment} · status ∈ {open, closed} · visibility public
 *
 * Two constraints are worth stating out loud because they shape the UI:
 *   - `authorOrg` is required by the rules, so publishing needs a card;
 *   - `visibility` accepts only `public` today, so the board must not offer a
 *     "members only" choice it cannot honour.
 */
import type { CommunityOpportunityType } from '../client/types';

export const NETWORK_JOB_LIMITS = {
  titleMin: 3,
  titleMax: 180,
  locationMin: 2,
  locationMax: 140,
  requirementsMin: 5,
  requirementsMax: 1500,
  methodMax: 32,
  methodsMax: 8,
} as const;

export const NETWORK_OPPORTUNITY_TYPES: {
  id: CommunityOpportunityType;
  ar: string;
  en: string;
  accent: string;
}[] = [
  { id: 'job', ar: 'وظيفة', en: 'Job', accent: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
  { id: 'tender', ar: 'مناقصة / عقد', en: 'Tender / contract', accent: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
  { id: 'equipment', ar: 'معدات ومهام', en: 'Equipment & assignments', accent: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10' },
];

export function opportunityTypeById(id: string) {
  return NETWORK_OPPORTUNITY_TYPES.find(type => type.id === id);
}

export interface NetworkJobDraft {
  type: CommunityOpportunityType;
  title: string;
  location: string;
  /** Comma separated method codes, as typed. */
  methods: string;
  requirements: string;
}

export const EMPTY_JOB_DRAFT: NetworkJobDraft = {
  type: 'job',
  title: '',
  location: '',
  methods: '',
  requirements: '',
};

export type NetworkJobField = keyof NetworkJobDraft;

export interface NetworkJobFieldError {
  field: NetworkJobField;
  ar: string;
  en: string;
}

const trimmed = (value: string) => value.trim();

/**
 * Method codes, cleaned the same way tags are: over-long codes are dropped rather
 * than truncated, duplicates collapse, and the list is capped at eight.
 */
export function normaliseMethods(raw: string): string[] {
  const seen = new Set<string>();
  const methods: string[] = [];
  for (const part of raw.split(/[,،\n]+/)) {
    const method = part.trim().replace(/\s+/g, ' ');
    if (!method) continue;
    if (method.length > NETWORK_JOB_LIMITS.methodMax) continue;
    const key = method.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    methods.push(method);
    if (methods.length === NETWORK_JOB_LIMITS.methodsMax) break;
  }
  return methods;
}

export function validateJobDraft(draft: NetworkJobDraft): NetworkJobFieldError[] {
  const errors: NetworkJobFieldError[] = [];
  const push = (field: NetworkJobField, ar: string, en: string) => errors.push({ field, ar, en });

  if (!opportunityTypeById(draft.type)) {
    push('type', 'اختر نوع الفرصة.', 'Choose the opportunity type.');
  }

  const title = trimmed(draft.title);
  if (title.length < NETWORK_JOB_LIMITS.titleMin) {
    push('title', 'العنوان قصير جداً (3 أحرف على الأقل).', 'The title is too short (at least three characters).');
  } else if (title.length > NETWORK_JOB_LIMITS.titleMax) {
    push(
      'title',
      `العنوان أطول من ${NETWORK_JOB_LIMITS.titleMax} حرفاً.`,
      `The title is longer than ${NETWORK_JOB_LIMITS.titleMax} characters.`
    );
  }

  const location = trimmed(draft.location);
  if (location.length < NETWORK_JOB_LIMITS.locationMin) {
    push('location', 'اكتب المكان (المدينة/الموقع).', 'Enter the location (city or site).');
  } else if (location.length > NETWORK_JOB_LIMITS.locationMax) {
    push(
      'location',
      `المكان أطول من ${NETWORK_JOB_LIMITS.locationMax} حرفاً.`,
      `The location is longer than ${NETWORK_JOB_LIMITS.locationMax} characters.`
    );
  }

  const methods = normaliseMethods(draft.methods);
  if (methods.length === 0) {
    push('methods', 'اذكر طريقة فحص واحدة على الأقل (مثل PAUT أو RT).', 'Name at least one method (e.g. PAUT or RT).');
  }

  const requirements = trimmed(draft.requirements);
  if (requirements.length < NETWORK_JOB_LIMITS.requirementsMin) {
    push(
      'requirements',
      'اكتب المتطلبات (5 أحرف على الأقل): الشهادات والخبرة.',
      'Describe the requirements (at least five characters): certificates and experience.'
    );
  } else if (requirements.length > NETWORK_JOB_LIMITS.requirementsMax) {
    push(
      'requirements',
      `المتطلبات أطول من ${NETWORK_JOB_LIMITS.requirementsMax} حرفاً.`,
      `The requirements are longer than ${NETWORK_JOB_LIMITS.requirementsMax} characters.`
    );
  }

  return errors;
}

export interface NetworkJobAuthor {
  displayName: string;
  organizationName: string;
  companyCode?: string;
}

/** Draft → the exact input `createCommunityOpportunity` accepts. */
export function toOpportunityInput(draft: NetworkJobDraft, author: NetworkJobAuthor) {
  return {
    authorName: trimmed(author.displayName),
    authorOrg: trimmed(author.organizationName),
    ...(author.companyCode ? { companyCode: author.companyCode } : {}),
    opportunityType: draft.type,
    title: trimmed(draft.title),
    location: trimmed(draft.location),
    // The service substitutes ['GENERAL'] when empty, but the rules require 1–8,
    // so a validated draft always arrives non-empty.
    methods: normaliseMethods(draft.methods),
    requirements: trimmed(draft.requirements),
  };
}

/** Filtering on the client: the collection is small (40 rows) and already public. */
export interface NetworkJobFilter {
  text: string;
  type: CommunityOpportunityType | 'all';
  /** A method code to look for inside each opportunity's method list. */
  method: string;
}

export function matchesJobFilter(
  opportunity: {
    title: string;
    location: string;
    requirements: string;
    methods?: string[];
    opportunityType: string;
  },
  filter: NetworkJobFilter
): boolean {
  if (filter.type !== 'all' && opportunity.opportunityType !== filter.type) return false;

  const method = filter.method.trim().toUpperCase();
  if (method) {
    const methods = (opportunity.methods ?? []).map(entry => entry.toUpperCase());
    if (!methods.some(entry => entry.includes(method))) return false;
  }

  const text = filter.text.trim().toLowerCase();
  if (!text) return true;
  return [opportunity.title, opportunity.location, opportunity.requirements, ...(opportunity.methods ?? [])]
    .join(' ')
    .toLowerCase()
    .includes(text);
}
