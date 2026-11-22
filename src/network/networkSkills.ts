/**
 * Skills, endorsements and written recommendations.
 *
 * The LinkedIn model, reduced to what this site can honestly do:
 *
 * - **Skills are declared** by the member, from a closed catalogue. A closed list
 *   is not a limitation for vanity's sake: it keeps every card searchable by the
 *   same vocabulary, and it is stored as one comma-separated string so the rules
 *   can validate it completely (`^[a-z0-9_]{1,40}(,[a-z0-9_]{1,40}){0,19}$`).
 * - **Endorsements are counted, never incremented**: each is a document written by
 *   one confirmed member about another, and the number shown is the length of that
 *   set. There is no counter field to drift, and no way to endorse yourself.
 * - **A recommendation is written words**, not a score. One per pair, editable by
 *   its author, readable by any confirmed member.
 *
 * Nothing here ever claims verification: an endorsement says "a colleague vouches
 * for this skill", not "certified". That distinction is the whole point.
 */
import type { CommunityEndorsement, CommunityRecommendation } from '../client/types';

export const NETWORK_SKILL_LIMITS = {
  maxSkills: 20,
  skillIdMax: 40,
  recommendationMin: 40,
  recommendationMax: 1200,
  endorsementsPerSkillShown: 99,
} as const;

export type NetworkSkillGroup = 'methods' | 'sizing' | 'materials' | 'management';

export interface NetworkSkill {
  id: string;
  ar: string;
  en: string;
  group: NetworkSkillGroup;
}

/** The vocabulary. Ids are lower_snake, ≤40 chars, and never change once shipped. */
export const NETWORK_SKILLS: NetworkSkill[] = [
  { id: 'ut', ar: 'فحص الموجات فوق الصوتية UT', en: 'Ultrasonic Testing (UT)', group: 'methods' },
  { id: 'paut', ar: 'الموجات فوق الصوتية المرحلية PAUT', en: 'Phased Array (PAUT)', group: 'methods' },
  { id: 'tofd', ar: 'زمن الطيران الانحرافي TOFD', en: 'Time of Flight Diffraction (TOFD)', group: 'methods' },
  { id: 'rt', ar: 'التصوير الإشعاعي RT', en: 'Radiographic Testing (RT)', group: 'methods' },
  { id: 'rt_film', ar: 'تفسير أفلام التصوير RT-FI', en: 'Radiographic Film Interpretation', group: 'methods' },
  { id: 'mt', ar: 'الجسيمات المغناطيسية MT', en: 'Magnetic Particle (MT)', group: 'methods' },
  { id: 'pt', ar: 'السوائل النافذة PT', en: 'Penetrant Testing (PT)', group: 'methods' },
  { id: 'vt', ar: 'الفحص البصري VT', en: 'Visual Testing (VT)', group: 'methods' },
  { id: 'et', ar: 'التيارات الدوامية ET', en: 'Eddy Current (ET)', group: 'methods' },
  { id: 'pmi', ar: 'تحليل المعادن PMI', en: 'Positive Material Identification (PMI)', group: 'materials' },
  { id: 'ht', ar: 'المعالجة الحرارية PWHT', en: 'Post Weld Heat Treatment', group: 'materials' },
  { id: 'hardness', ar: 'قياس الصلادة', en: 'Hardness Testing', group: 'materials' },
  { id: 'weld_qa', ar: 'جودة اللحام QA/QC', en: 'Welding QA/QC', group: 'materials' },
  { id: 'corrosion', ar: 'تقييم التآكل', en: 'Corrosion Assessment', group: 'materials' },
  { id: 'sizing', ar: 'تقييم حجم العيوب', en: 'Defect Sizing', group: 'sizing' },
  { id: 'acceptance', ar: 'تطبيق معايير القبول', en: 'Acceptance Criteria', group: 'sizing' },
  { id: 'asnt', ar: 'مؤهلات ASNT', en: 'ASNT Qualifications', group: 'sizing' },
  { id: 'iso9712', ar: 'مؤهلات ISO 9712', en: 'ISO 9712 Qualifications', group: 'sizing' },
  { id: 'reporting', ar: 'كتابة التقارير الفنية', en: 'Technical Reporting', group: 'management' },
  { id: 'ndte_ed', ar: 'التدريب والتأهيل NDT', en: 'NDT Training', group: 'management' },
  { id: 'inspection_mgmt', ar: 'إدارة أعمال الفحص', en: 'Inspection Management', group: 'management' },
  { id: 'risk_based', ar: 'الفحص المبني على المخاطر RBI', en: 'Risk-Based Inspection', group: 'management' },
];

export const NETWORK_SKILL_GROUPS: { id: NetworkSkillGroup; ar: string; en: string }[] = [
  { id: 'methods', ar: 'طرق الفحص', en: 'Methods' },
  { id: 'materials', ar: 'مواد ومعالجة', en: 'Materials & treatment' },
  { id: 'sizing', ar: 'تقييم ومعايير', en: 'Sizing & standards' },
  { id: 'management', ar: 'إدارة وتدريب', en: 'Management & training' },
];

const SKILL_IDS = new Set(NETWORK_SKILLS.map(skill => skill.id));

export function skillById(id: string): NetworkSkill | undefined {
  return NETWORK_SKILLS.find(skill => skill.id === id);
}

export function skillLabel(skill: NetworkSkill, isAr: boolean): string {
  return isAr ? skill.ar : skill.en;
}

/**
 * The stored form is one string so the rules can prove it: ids only, no spaces.
 * Unknown ids are dropped rather than kept — an id from an older build that no
 * longer exists must not resurrect a chip nobody can name.
 */
export function parseSkills(raw: string | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (!id || !SKILL_IDS.has(id) || out.includes(id)) continue;
    if (out.length >= NETWORK_SKILL_LIMITS.maxSkills) break;
    out.push(id);
  }
  return out;
}

export function serialiseSkills(ids: string[]): string {
  return parseSkills(ids.join(',')).join(',');
}

/** Adding a skill at the ceiling replaces nothing: the caller gets the same string back. */
export function toggleSkill(raw: string, id: string): { value: string; rejected: 'limit' | null } {
  const current = parseSkills(raw);
  if (current.includes(id)) {
    return { value: serialiseSkills(current.filter(item => item !== id)), rejected: null };
  }
  if (!SKILL_IDS.has(id)) return { value: serialiseSkills(current), rejected: null };
  if (current.length >= NETWORK_SKILL_LIMITS.maxSkills) {
    return { value: serialiseSkills(current), rejected: 'limit' };
  }
  return { value: serialiseSkills([...current, id]), rejected: null };
}

/* ------------------------------- endorsements ------------------------------ */

/** Deterministic id: one endorsement per (target, skill, endorser), enforced by the rules. */
export function endorsementId(toUid: string, skillId: string, fromUid: string): string {
  return `${toUid}_${skillId}_${fromUid}`;
}

export interface EndorseGate {
  allowed: boolean;
  reasonAr: string | null;
  reasonEn: string | null;
}

/**
 * Why the endorse button is or is not offered. Mirrors the rules; the rules remain
 * the authority, this only avoids offering a click that must fail.
 */
export function canEndorse(params: {
  viewerUid: string | null;
  viewerVerified: boolean;
  toUid: string;
  skillId: string;
  targetSkills: string[];
  existing: Pick<CommunityEndorsement, 'skillId' | 'fromUid'>[];
}): EndorseGate {
  const { viewerUid, viewerVerified, toUid, skillId, targetSkills, existing } = params;
  if (!viewerUid) {
    return { allowed: false, reasonAr: 'سجّل الدخول لتزكية المهارات.', reasonEn: 'Sign in to endorse skills.' };
  }
  if (!viewerVerified) {
    return {
      allowed: false,
      reasonAr: 'التزكية تحتاج بريداً مؤكَّداً (خطوة تأكيد واحدة).',
      reasonEn: 'Endorsing needs a confirmed email (one verification step).',
    };
  }
  if (viewerUid === toUid) {
    return { allowed: false, reasonAr: 'لا تُزكّي مهاراتك أنت.', reasonEn: 'You cannot endorse your own skills.' };
  }
  if (!targetSkills.includes(skillId)) {
    return { allowed: false, reasonAr: 'هذه المهارة ليست على بطاقة العضو.', reasonEn: 'This skill is not on their card.' };
  }
  if (existing.some(row => row.fromUid === viewerUid && row.skillId === skillId)) {
    return { allowed: false, reasonAr: 'زكّيت هذه المهارة بالفعل.', reasonEn: 'You already endorsed this skill.' };
  }
  return { allowed: true, reasonAr: null, reasonEn: null };
}

/** Counts per skill, computed from the documents — there is no counter field to trust. */
export function countEndorsements(rows: Pick<CommunityEndorsement, 'skillId'>[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.skillId] = (counts[row.skillId] ?? 0) + 1;
  return counts;
}

export function endorsersOf(rows: CommunityEndorsement[], skillId: string): string[] {
  return rows.filter(row => row.skillId === skillId).map(row => row.fromName).filter(Boolean);
}

/* ------------------------------ recommendations ---------------------------- */

export type RecommendationRelation = 'colleague' | 'client' | 'instructor';

export const RECOMMENDATION_RELATIONS: { id: RecommendationRelation; ar: string; en: string }[] = [
  { id: 'colleague', ar: 'زميل عمل', en: 'Colleague' },
  { id: 'client', ar: 'عميل', en: 'Client' },
  { id: 'instructor', ar: 'مدرّب', en: 'Instructor' },
];

export function relationLabel(id: string, isAr: boolean): string {
  const found = RECOMMENDATION_RELATIONS.find(relation => relation.id === id);
  if (!found) return isAr ? 'علاقة غير محددة' : 'Unspecified relation';
  return isAr ? found.ar : found.en;
}

export interface RecommendationDraft {
  relation: RecommendationRelation;
  body: string;
}

export const EMPTY_RECOMMENDATION: RecommendationDraft = { relation: 'colleague', body: '' };

export interface RecommendationFieldError {
  field: 'relation' | 'body';
  ar: string;
  en: string;
}

/** One recommendation per pair, in one direction — the id itself prevents a second. */
export function recommendationId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}

export function validateRecommendation(draft: RecommendationDraft): RecommendationFieldError[] {
  const errors: RecommendationFieldError[] = [];
  const body = draft.body.trim();
  if (!RECOMMENDATION_RELATIONS.some(relation => relation.id === draft.relation)) {
    errors.push({ field: 'relation', ar: 'اختر نوع العلاقة.', en: 'Choose the relation.' });
  }
  if (body.length < NETWORK_SKILL_LIMITS.recommendationMin) {
    errors.push({
      field: 'body',
      ar: `اكتب ${NETWORK_SKILL_LIMITS.recommendationMin} حرفاً على الأقل — توصية بلا تفاصيل لا تُفيد.`,
      en: `Write at least ${NETWORK_SKILL_LIMITS.recommendationMin} characters — a vague line helps nobody.`,
    });
  } else if (body.length > NETWORK_SKILL_LIMITS.recommendationMax) {
    errors.push({
      field: 'body',
      ar: `التوصية أطول من ${NETWORK_SKILL_LIMITS.recommendationMax} حرفاً.`,
      en: `The recommendation is longer than ${NETWORK_SKILL_LIMITS.recommendationMax} characters.`,
    });
  }
  return errors;
}

export function toRecommendationInput(draft: RecommendationDraft): { relation: RecommendationRelation; body: string } {
  return { relation: draft.relation, body: draft.body.trim() };
}

/** A recommendation the viewer may edit or remove: their own, still theirs to change. */
export function canManageRecommendation(
  row: Pick<CommunityRecommendation, 'fromUid' | 'toUid'>,
  viewerUid: string | null
): boolean {
  if (!viewerUid) return false;
  return row.fromUid === viewerUid || row.toUid === viewerUid;
}
