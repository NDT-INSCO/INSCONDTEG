/**
 * The network's professional profile — form model, validation and mapping.
 *
 * The network does **not** get its own profile collection. The site already has
 * one public, rule-protected, PII-free professional card (`community_workspaces`),
 * used by the community section of the client portal, and the engineering network
 * is a second front door to exactly that record. One member, one card, one source
 * of truth — a second social graph would guarantee two memberships per person and
 * two answers to "who is this engineer?".
 *
 * Everything here is pure: no Firebase, no browser. The limits mirror
 * `firestore.rules` field for field, so a draft that passes here cannot be
 * rejected by the database for a length or enum reason.
 */
import type {
  CommunityAvailabilityStatus,
  CommunityWorkspaceProfile,
} from '../client/types';
import {
  inspectLinkedInUrl,
  isSafeImageUrl,
  linkedInProblemMessage,
  normaliseLinkedInUrl,
  visibilityById,
  type NetworkProfileVisibility,
} from './networkIdentity';
import { parseSkills } from './networkSkills';

/** Mirrors `isValidCommunityWorkspace` in firestore.rules. */
export const NETWORK_PROFILE_LIMITS = {
  displayNameMin: 2,
  displayNameMax: 120,
  organizationMin: 2,
  organizationMax: 160,
  sectorMin: 2,
  sectorMax: 100,
  cityMax: 100,
  specialtyMax: 300,
  bioMax: 600,
  headlineMax: 160,
  certificationsMax: 240,
  yearsExperienceMax: 70,
} as const;

/** The sectors of the rules' `sector` field, phrased for engineers. */
export const NETWORK_SECTORS = [
  'الفحص غير الإتلافي',
  'المعالجة الحرارية',
  'فحص اللحام',
  'ضمان وضبط الجودة',
  'التآكل والمواد',
  'خطوط الأنابيب',
  'السلامة الصناعية',
  'مقاولات وصيانة صناعية',
  'تعليم وتدريب هندسي',
] as const;

export const NETWORK_AVAILABILITY: {
  id: CommunityAvailabilityStatus;
  ar: string;
  en: string;
}[] = [
  { id: 'active_field', ar: 'على رأس العمل', en: 'On site / employed' },
  { id: 'open_to_work', ar: 'متاح للفرص', en: 'Open to work' },
  { id: 'hiring', ar: 'أبحث عن كفاءات', en: 'Hiring' },
  { id: 'offering_services', ar: 'أقدّم خدمات', en: 'Offering services' },
];

export interface NetworkProfileDraft {
  displayName: string;
  headline: string;
  organizationName: string;
  sector: string;
  city: string;
  specialtyTrades: string;
  certifications: string;
  bio: string;
  yearsExperience: string;
  availabilityStatus: CommunityAvailabilityStatus;
  isPublished: boolean;
  photoURL: string;
  bannerURL: string;
  linkedInUrl: string;
  profileVisibility: NetworkProfileVisibility;
  /** Comma-separated catalogue ids — the same string the rules validate. */
  skills: string;
  professionalRole: string;
  relatedFields: string[];
  languages: string[];
  experienceSummary: string;
  educationSummary: string;
  projectsSummary: string;
  shareAcademyProgress: boolean;
  messagePolicy: 'everyone' | 'connections' | 'none';
}

export const EMPTY_NETWORK_PROFILE: NetworkProfileDraft = {
  displayName: '',
  headline: '',
  organizationName: '',
  sector: NETWORK_SECTORS[0],
  city: '',
  specialtyTrades: '',
  certifications: '',
  bio: '',
  yearsExperience: '',
  availabilityStatus: 'active_field',
  isPublished: true,
  photoURL: '',
  bannerURL: '',
  linkedInUrl: '',
  profileVisibility: 'public',
  skills: '',
  professionalRole: '',
  relatedFields: [],
  languages: ['ar', 'en'],
  experienceSummary: '',
  educationSummary: '',
  projectsSummary: '',
  shareAcademyProgress: false,
  messagePolicy: 'everyone',
};

export type NetworkProfileField = keyof NetworkProfileDraft;

export interface NetworkProfileFieldError {
  field: NetworkProfileField;
  /** Both languages, so the form never needs to build sentences itself. */
  ar: string;
  en: string;
}

/** Load an existing card into the form, without ever inventing a field. */
export function draftFromProfile(profile: CommunityWorkspaceProfile | null): NetworkProfileDraft {
  if (!profile) return { ...EMPTY_NETWORK_PROFILE };
  return {
    displayName: profile.displayName ?? '',
    headline: profile.headline ?? '',
    organizationName: profile.organizationName ?? '',
    sector: profile.sector ?? NETWORK_SECTORS[0],
    city: profile.city ?? '',
    specialtyTrades: profile.specialtyTrades ?? '',
    certifications: profile.certifications ?? '',
    bio: profile.bio ?? '',
    yearsExperience:
      typeof profile.yearsExperience === 'number' ? String(profile.yearsExperience) : '',
    availabilityStatus: profile.availabilityStatus ?? 'active_field',
    isPublished: profile.isPublished !== false,
    photoURL: profile.photoURL ?? '',
    bannerURL: profile.bannerURL ?? '',
    linkedInUrl: profile.linkedInUrl ?? '',
    skills: parseSkills(profile.skills ?? '').join(','),
    profileVisibility: visibilityById(profile.profileVisibility),
    professionalRole: profile.professionalRole ?? '',
    relatedFields: Array.isArray(profile.relatedFields)
      ? profile.relatedFields
      : typeof profile.relatedFields === 'string' && profile.relatedFields
        ? String(profile.relatedFields).split(',').map(s => s.trim()).filter(Boolean)
        : [],
    languages: Array.isArray(profile.languages)
      ? profile.languages
      : typeof profile.languages === 'string' && profile.languages
        ? String(profile.languages).split(',').map(s => s.trim()).filter(Boolean)
        : [],
    experienceSummary: profile.experienceSummary ?? '',
    educationSummary: profile.educationSummary ?? '',
    projectsSummary: profile.projectsSummary ?? '',
    shareAcademyProgress: profile.shareAcademyProgress === true,
    messagePolicy: (profile.messagePolicy === 'connections' || profile.messagePolicy === 'none' ? profile.messagePolicy : 'everyone'),
  };
}

const length = (value: string | undefined) => (value ?? '').trim().length;
const longEnough = (value: string, min: number) => length(value) >= min;

/**
 * Validate the draft against the same constraints the database enforces.
 *
 * Two required fields are not obvious to a member, so they are named plainly:
 * `organizationName` is required by the rules even for an independent engineer
 * ("مستقل" is an acceptable answer), and `sector` must be one of the known ones.
 */
export function validateNetworkProfileDraft(draft: NetworkProfileDraft): NetworkProfileFieldError[] {
  const errors: NetworkProfileFieldError[] = [];
  const push = (field: NetworkProfileField, ar: string, en: string) =>
    errors.push({ field, ar, en });

  const name = draft.displayName.trim();
  if (!longEnough(name, NETWORK_PROFILE_LIMITS.displayNameMin)) {
    push('displayName', 'الاسم مطلوب (حرفان على الأقل).', 'Your name is required (at least two characters).');
  } else if (length(name) > NETWORK_PROFILE_LIMITS.displayNameMax) {
    push(
      'displayName',
      `الاسم أطول من ${NETWORK_PROFILE_LIMITS.displayNameMax} حرفاً.`,
      `The name is longer than ${NETWORK_PROFILE_LIMITS.displayNameMax} characters.`
    );
  }

  const org = draft.organizationName.trim();
  if (!longEnough(org, NETWORK_PROFILE_LIMITS.organizationMin)) {
    push(
      'organizationName',
      'اكتب جهة العمل، أو «مستقل» إذا كنت تعمل لحسابك.',
      'Enter your employer, or "Independent" if you work for yourself.'
    );
  } else if (length(org) > NETWORK_PROFILE_LIMITS.organizationMax) {
    push(
      'organizationName',
      `جهة العمل أطول من ${NETWORK_PROFILE_LIMITS.organizationMax} حرفاً.`,
      `The employer is longer than ${NETWORK_PROFILE_LIMITS.organizationMax} characters.`
    );
  }

  const sector = draft.sector.trim();
  if (!longEnough(sector, NETWORK_PROFILE_LIMITS.sectorMin)) {
    push('sector', 'اختر القطاع.', 'Choose your sector.');
  } else if (length(sector) > NETWORK_PROFILE_LIMITS.sectorMax) {
    push('sector', 'اسم القطاع طويل جداً.', 'The sector name is too long.');
  }

  if (length(draft.headline) > NETWORK_PROFILE_LIMITS.headlineMax) {
    push(
      'headline',
      `المسمّى المختصر أطول من ${NETWORK_PROFILE_LIMITS.headlineMax} حرفاً.`,
      `The headline is longer than ${NETWORK_PROFILE_LIMITS.headlineMax} characters.`
    );
  }

  if (length(draft.city) > NETWORK_PROFILE_LIMITS.cityMax) {
    push('city', 'اسم المدينة طويل جداً.', 'The city name is too long.');
  }

  if (length(draft.specialtyTrades) > NETWORK_PROFILE_LIMITS.specialtyMax) {
    push(
      'specialtyTrades',
      `التخصصات أطول من ${NETWORK_PROFILE_LIMITS.specialtyMax} حرفاً.`,
      `The specialities are longer than ${NETWORK_PROFILE_LIMITS.specialtyMax} characters.`
    );
  }

  if (length(draft.certifications) > NETWORK_PROFILE_LIMITS.certificationsMax) {
    push(
      'certifications',
      `قائمة الشهادات أطول من ${NETWORK_PROFILE_LIMITS.certificationsMax} حرفاً.`,
      `The certifications line is longer than ${NETWORK_PROFILE_LIMITS.certificationsMax} characters.`
    );
  }

  if (length(draft.bio) > NETWORK_PROFILE_LIMITS.bioMax) {
    push(
      'bio',
      `النبذة أطول من ${NETWORK_PROFILE_LIMITS.bioMax} حرفاً.`,
      `The bio is longer than ${NETWORK_PROFILE_LIMITS.bioMax} characters.`
    );
  }

  const years = draft.yearsExperience.trim();
  if (years !== '') {
    const parsed = Number(years);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > NETWORK_PROFILE_LIMITS.yearsExperienceMax) {
      push(
        'yearsExperience',
        `سنوات الخبرة بين 0 و${NETWORK_PROFILE_LIMITS.yearsExperienceMax}.`,
        `Years of experience must be between 0 and ${NETWORK_PROFILE_LIMITS.yearsExperienceMax}.`
      );
    }
  }

  if (!NETWORK_AVAILABILITY.some(item => item.id === draft.availabilityStatus)) {
    push('availabilityStatus', 'اختر حالة تفرّغ صحيحة.', 'Choose a valid availability state.');
  }

  if (draft.photoURL.trim() !== '' && !isSafeImageUrl(draft.photoURL)) {
    push('photoURL', 'رابط الصورة يجب أن يبدأ بـ https://', 'The photo link must start with https://');
  }

  if (draft.bannerURL.trim() !== '' && !isSafeImageUrl(draft.bannerURL)) {
    push('bannerURL', 'رابط البانر يجب أن يبدأ بـ https://', 'The banner link must start with https://');
  }

  // Normalise first: `linkedin.com/in/name` is what people paste, and the write path
  // turns it into a full URL anyway. Validating the raw text would reject the very
  // input we accept on save.
  const linkedInProblem = inspectLinkedInUrl(normaliseLinkedInUrl(draft.linkedInUrl));
  if (linkedInProblem) {
    push('linkedInUrl', linkedInProblemMessage(linkedInProblem, true), linkedInProblemMessage(linkedInProblem, false));
  }

  if (draft.profileVisibility !== 'public' && draft.profileVisibility !== 'members') {
    push(
      'profileVisibility',
      'اختر من يرى صفحتك.',
      'Choose who can open your page.'
    );
  }

  return errors;
}

export interface NetworkWorkspaceWrite {
  displayName: string;
  organizationName: string;
  sector: string;
  city?: string;
  companyCode?: string;
  specialtyTrades?: string;
  bio?: string;
  companiesManaged: number;
  isPublished: boolean;
  headline?: string;
  certifications?: string;
  yearsExperience?: number;
  availabilityStatus?: CommunityAvailabilityStatus;
  photoURL?: string;
  bannerURL?: string;
  linkedInUrl?: string;
  profileVisibility?: NetworkProfileVisibility;
  skills?: string;
  professionalRole?: string;
  relatedFields?: string[];
  languages?: string[];
  experienceSummary?: string;
  educationSummary?: string;
  projectsSummary?: string;
  shareAcademyProgress?: boolean;
  messagePolicy?: 'everyone' | 'connections' | 'none';
}

const trimmed = (value: string) => value.trim();
const optional = (value: string) => {
  const next = trimmed(value);
  return next === '' ? undefined : next;
};

/**
 * Draft → the exact payload `upsertCommunityWorkspace` accepts.
 *
 * Optional fields are omitted rather than sent empty, because an empty string in
 * Firestore is a value (and would overwrite a field the member cleared by choice
 * with a blank one the rules then have to police).
 */
export function toWorkspaceWrite(
  draft: NetworkProfileDraft,
  existing: CommunityWorkspaceProfile | null
): NetworkWorkspaceWrite {
  const years = trimmed(draft.yearsExperience);
  const parsedYears = years === '' ? undefined : Math.round(Number(years));
  const headline = optional(draft.headline);
  const certifications = optional(draft.certifications);
  const specialtyTrades = optional(draft.specialtyTrades);
  const bio = optional(draft.bio);
  const city = optional(draft.city);
  const companyCode = existing?.companyCode ? existing.companyCode : undefined;
  const professionalRole = optional(draft.professionalRole ?? '');
  const experienceSummary = optional(draft.experienceSummary ?? '');
  const educationSummary = optional(draft.educationSummary ?? '');
  const projectsSummary = optional(draft.projectsSummary ?? '');

  return {
    displayName: trimmed(draft.displayName),
    organizationName: trimmed(draft.organizationName),
    sector: trimmed(draft.sector),
    ...(city !== undefined ? { city } : {}),
    ...(companyCode ? { companyCode } : {}),
    ...(specialtyTrades !== undefined ? { specialtyTrades } : {}),
    ...(bio !== undefined ? { bio } : {}),
    companiesManaged: existing?.companiesManaged ?? 0,
    isPublished: draft.isPublished,
    ...(headline !== undefined ? { headline } : {}),
    ...(certifications !== undefined ? { certifications } : {}),
    ...(parsedYears !== undefined && Number.isFinite(parsedYears) ? { yearsExperience: parsedYears } : {}),
    availabilityStatus: draft.availabilityStatus,
    ...(optional(draft.photoURL) !== undefined ? { photoURL: optional(draft.photoURL) } : {}),
    ...(optional(draft.bannerURL) !== undefined ? { bannerURL: optional(draft.bannerURL) } : {}),
    ...(normaliseLinkedInUrl(draft.linkedInUrl) !== ''
      ? { linkedInUrl: normaliseLinkedInUrl(draft.linkedInUrl) }
      : {}),
    /* Always explicit: the audience is a decision, not a default we inherit. */
    profileVisibility: draft.profileVisibility,
    /* Always written, even when empty: omitting it on update would keep the old list. */
    skills: parseSkills(draft.skills).join(','),
    ...(professionalRole ? { professionalRole: professionalRole.slice(0, 60) } : {}),
    ...(Array.isArray(draft.relatedFields) && draft.relatedFields.length > 0
      ? { relatedFields: draft.relatedFields.slice(0, 8) }
      : {}),
    ...(Array.isArray(draft.languages) && draft.languages.length > 0
      ? { languages: draft.languages.slice(0, 6) }
      : {}),
    ...(experienceSummary ? { experienceSummary: experienceSummary.slice(0, 1200) } : {}),
    ...(educationSummary ? { educationSummary: educationSummary.slice(0, 600) } : {}),
    ...(projectsSummary ? { projectsSummary: projectsSummary.slice(0, 800) } : {}),
    ...(draft.shareAcademyProgress !== undefined ? { shareAcademyProgress: Boolean(draft.shareAcademyProgress) } : {}),
    ...(draft.messagePolicy ? { messagePolicy: draft.messagePolicy } : {}),
  };
}

/** How complete the card is, so a member knows what a visitor still cannot see. */
export function networkProfileCompleteness(draft: NetworkProfileDraft): {
  percent: number;
  missingAr: string[];
  missingEn: string[];
} {
  const checks: { filled: boolean; ar: string; en: string }[] = [
    { filled: longEnough(draft.displayName, NETWORK_PROFILE_LIMITS.displayNameMin), ar: 'الاسم', en: 'Name' },
    { filled: longEnough(draft.organizationName, NETWORK_PROFILE_LIMITS.organizationMin), ar: 'جهة العمل', en: 'Employer' },
    { filled: longEnough(draft.headline, 4), ar: 'المسمّى المهني', en: 'Headline' },
    { filled: longEnough(draft.specialtyTrades, 3), ar: 'التخصصات', en: 'Specialities' },
    { filled: longEnough(draft.certifications, 3), ar: 'الشهادات (كإقرار غير موثّق)', en: 'Certifications (as an unverified claim)' },
    { filled: longEnough(draft.bio, 20), ar: 'نبذة', en: 'Bio' },
    { filled: trimmed(draft.yearsExperience) !== '', ar: 'سنوات الخبرة', en: 'Years of experience' },
    { filled: longEnough(draft.city, 2), ar: 'المدينة', en: 'City' },
  ];
  const filled = checks.filter(check => check.filled).length;
  return {
    percent: Math.round((filled / checks.length) * 100),
    missingAr: checks.filter(check => !check.filled).map(check => check.ar),
    missingEn: checks.filter(check => !check.filled).map(check => check.en),
  };
}
