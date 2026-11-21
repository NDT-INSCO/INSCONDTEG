/**
 * The network's post composer — form model, validation and mapping.
 *
 * The feed writes the site's existing `community_posts` collection through the
 * existing service (`createCommunityPost`, `addCommunityPostComment`,
 * `setCommunityPostReaction`), under the rules that already ship with it. The
 * network's richer vocabulary (eight kinds of post, ten disciplines) is mapped
 * down to the closed enums the database accepts — never the other way round, and
 * never by loosening a rule.
 *
 * Pure module: no Firebase, no browser.
 */
import type {
  CommunityNdtMethod,
  CommunityPostType,
} from '../client/types';

/** Mirrors `isValidCommunityPost` / `isValidCommunityComment` in firestore.rules. */
export const NETWORK_POST_LIMITS = {
  titleMin: 3,
  titleMax: 180,
  bodyMin: 5,
  bodyMax: 3000,
  commentMin: 1,
  commentMax: 1500,
  tagMax: 32,
  tagsMax: 6,
  authorNameMax: 120,
  authorOrgMax: 160,
  authorHeadlineMax: 160,
} as const;

/** The eight kinds a member chooses from, each mapped to a stored post type. */
export const NETWORK_POST_KINDS: {
  id: string;
  ar: string;
  en: string;
  stored: CommunityPostType;
  accent: string;
}[] = [
  { id: 'technical', ar: 'نقاش فني', en: 'Technical discussion', stored: 'discussion', accent: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10' },
  { id: 'knowledge', ar: 'معرفة هندسية', en: 'Engineering knowledge', stored: 'technical_case', accent: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
  { id: 'case_study', ar: 'دراسة حالة', en: 'Case study', stored: 'technical_case', accent: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
  { id: 'news', ar: 'أخبار القطاع', en: 'Industry news', stored: 'announcement', accent: 'text-slate-300 border-slate-600 bg-slate-700/30' },
  { id: 'career', ar: 'مسيرة مهنية', en: 'Career update', stored: 'discussion', accent: 'text-violet-300 border-violet-500/40 bg-violet-500/10' },
  { id: 'jobs', ar: 'وظائف وفرص', en: 'Jobs & opportunities', stored: 'job_tender', accent: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
  { id: 'training', ar: 'تدريب وورش', en: 'Training & workshops', stored: 'announcement', accent: 'text-sky-300 border-sky-500/40 bg-sky-500/10' },
  { id: 'research', ar: 'أبحاث ومنشورات', en: 'Research & publications', stored: 'technical_case', accent: 'text-teal-300 border-teal-500/40 bg-teal-500/10' },
];

export function postKindById(id: string) {
  return NETWORK_POST_KINDS.find(kind => kind.id === id);
}

/**
 * Stored type → the label a reader sees.
 *
 * Several network kinds collapse into one stored type, so this picks the most
 * specific label that still tells the truth about what was stored.
 */
export function displayKindForStored(stored: CommunityPostType) {
  const id =
    stored === 'discussion'
      ? 'technical'
      : stored === 'technical_case'
        ? 'case_study'
        : stored === 'announcement'
          ? 'news'
          : stored === 'job_tender'
            ? 'jobs'
            : 'knowledge';
  return postKindById(id) ?? NETWORK_POST_KINDS[0];
}

/** The nine methods the database accepts, with the labels engineers use. */
export const NETWORK_METHODS: { id: CommunityNdtMethod; ar: string; en: string }[] = [
  { id: 'GENERAL', ar: 'عام', en: 'General' },
  { id: 'UT', ar: 'موجات فوق صوتية UT', en: 'Ultrasonic UT' },
  { id: 'PAUT', ar: 'مصفوفات PAUT', en: 'Phased array PAUT' },
  { id: 'RT', ar: 'تصوير إشعاعي RT', en: 'Radiography RT' },
  { id: 'MT', ar: 'جسيمات مغناطيسية MT', en: 'Magnetic particle MT' },
  { id: 'PT', ar: 'سوائل نافذة PT', en: 'Penetrant PT' },
  { id: 'VT', ar: 'فحص بصري VT', en: 'Visual VT' },
  { id: 'PWHT', ar: 'معالجة حرارية PWHT', en: 'Heat treatment PWHT' },
  { id: 'AR', ar: 'مركبات وأتمتة AR', en: 'AR & automation' },
];

/** The profile discipline the member already chose seeds the method default. */
export function defaultMethodForDiscipline(disciplineId: string): CommunityNdtMethod {
  switch (disciplineId) {
    case 'ut_paut':
      return 'PAUT';
    case 'rt_dr':
      return 'RT';
    case 'surface':
      return 'MT';
    case 'welding':
      return 'VT';
    case 'pwht':
      return 'PWHT';
    default:
      return 'GENERAL';
  }
}

export interface NetworkPostDraft {
  kind: string;
  method: CommunityNdtMethod;
  title: string;
  body: string;
  /** Comma or `#` separated, as typed. Normalised before writing. */
  tags: string;
  visibility: 'public' | 'members_only';
}

export const EMPTY_POST_DRAFT: NetworkPostDraft = {
  kind: 'technical',
  method: 'GENERAL',
  title: '',
  body: '',
  tags: '',
  visibility: 'public',
};

export type NetworkPostField = keyof NetworkPostDraft;

export interface NetworkPostFieldError {
  field: NetworkPostField;
  ar: string;
  en: string;
}

const trimmed = (value: string) => value.trim();

/**
 * Split whatever the member typed into the tag list the rules accept.
 *
 * The rules only bound the first tag's length, so this bounds all of them; a
 * long tag is dropped rather than silently truncated, because a truncated word
 * is worse than a missing one.
 */
export function normaliseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(/[,،#\n]+/)) {
    const tag = part.trim().replace(/\s+/g, ' ');
    if (!tag) continue;
    if (tag.length > NETWORK_POST_LIMITS.tagMax) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === NETWORK_POST_LIMITS.tagsMax) break;
  }
  return tags;
}

export function validatePostDraft(draft: NetworkPostDraft): NetworkPostFieldError[] {
  const errors: NetworkPostFieldError[] = [];
  const push = (field: NetworkPostField, ar: string, en: string) => errors.push({ field, ar, en });

  if (!postKindById(draft.kind)) {
    push('kind', 'اختر نوع المنشور.', 'Choose a post type.');
  }

  if (!NETWORK_METHODS.some(method => method.id === draft.method)) {
    push('method', 'اختر طريقة فحص صحيحة.', 'Choose a valid NDT method.');
  }

  const title = trimmed(draft.title);
  if (title.length < NETWORK_POST_LIMITS.titleMin) {
    push('title', 'العنوان قصير جداً (3 أحرف على الأقل).', 'The title is too short (at least three characters).');
  } else if (title.length > NETWORK_POST_LIMITS.titleMax) {
    push(
      'title',
      `العنوان أطول من ${NETWORK_POST_LIMITS.titleMax} حرفاً.`,
      `The title is longer than ${NETWORK_POST_LIMITS.titleMax} characters.`
    );
  }

  const body = trimmed(draft.body);
  if (body.length < NETWORK_POST_LIMITS.bodyMin) {
    push('body', 'النص قصير جداً (5 أحرف على الأقل).', 'The body is too short (at least five characters).');
  } else if (body.length > NETWORK_POST_LIMITS.bodyMax) {
    push(
      'body',
      `النص أطول من ${NETWORK_POST_LIMITS.bodyMax} حرفاً.`,
      `The body is longer than ${NETWORK_POST_LIMITS.bodyMax} characters.`
    );
  }

  if (draft.visibility !== 'public' && draft.visibility !== 'members_only') {
    push('visibility', 'اختر نطاق الظهور.', 'Choose who can see this.');
  }

  return errors;
}

export function validateCommentDraft(body: string): NetworkPostFieldError[] {
  const value = trimmed(body);
  if (value.length < NETWORK_POST_LIMITS.commentMin) {
    return [{ field: 'body', ar: 'اكتب تعليقاً أولاً.', en: 'Write a comment first.' }];
  }
  if (value.length > NETWORK_POST_LIMITS.commentMax) {
    return [
      {
        field: 'body',
        ar: `التعليق أطول من ${NETWORK_POST_LIMITS.commentMax} حرفاً.`,
        en: `The comment is longer than ${NETWORK_POST_LIMITS.commentMax} characters.`,
      },
    ];
  }
  return [];
}

/** What the author identity looks like when it comes from the member's card. */
export interface NetworkPostAuthor {
  displayName: string;
  organizationName: string;
  headline?: string;
  companyCode?: string;
}

/**
 * Draft → the exact input `createCommunityPost` accepts.
 *
 * `authorOrg` is required by the rules even for an independent engineer, so the
 * caller must have a card; the component refuses to open the composer without
 * one instead of inventing an organisation name.
 */
export function toPostInput(draft: NetworkPostDraft, author: NetworkPostAuthor) {
  const kind = postKindById(draft.kind);
  const tags = normaliseTags(draft.tags);
  const headline = trimmed(author.headline ?? '');
  return {
    authorName: trimmed(author.displayName),
    ...(headline ? { authorHeadline: headline.slice(0, NETWORK_POST_LIMITS.authorHeadlineMax) } : {}),
    authorOrg: trimmed(author.organizationName),
    ...(author.companyCode ? { authorCompanyCode: author.companyCode } : {}),
    postType: kind ? kind.stored : ('discussion' as const),
    ndtMethod: draft.method,
    title: trimmed(draft.title),
    body: trimmed(draft.body),
    ...(tags.length > 0 ? { tags } : {}),
    visibility: draft.visibility,
    // Never set by the network: pinning is an admin action.
    isPinnedAnnouncement: false,
  };
}

/** A short, honest preview of what a visitor will read. */
export function postExcerpt(body: string, max = 220): string {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}
