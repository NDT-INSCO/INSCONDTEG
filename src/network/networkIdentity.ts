/**
 * Identity pieces for the public member page: the photos, the LinkedIn button and
 * the choice of who may open the page.
 *
 * Everything here is pure — no Firebase, no canvas, no browser — so the same rules
 * that `storage.rules` and `firestore.rules` enforce can be unit-tested without a
 * database. The numbers are the contract: if a file passes here, the storage rule
 * will not reject it for a size or type reason.
 */
import type { CommunityWorkspaceProfile } from '../client/types';

/** Mirrors `storage.rules`. */
export const NETWORK_MEDIA_LIMITS = {
  photoMaxBytes: 2 * 1024 * 1024,
  bannerMaxBytes: 4 * 1024 * 1024,
  /** Storage also checks the content type; this is the same list. */
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  bannerWidth: 1200,
  bannerHeight: 400,
  photoWidth: 512,
  photoHeight: 512,
  /** A URL stored on the card (Firestore field) must stay well under the rules' cap. */
  urlMax: 500,
} as const;

export type NetworkMediaKind = 'photo' | 'banner';

export type NetworkProfileVisibility = 'public' | 'members';

/**
 * Who may open `#network/people/<uid>`.
 *
 * `public`  — anyone with the link, signed in or not (the card is PII-free by design).
 * `members` — only a signed-in member with a confirmed email, enforced by the rules,
 *             not by hiding a button.
 */
export const NETWORK_PROFILE_VISIBILITY: {
  id: NetworkProfileVisibility;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
}[] = [
  {
    id: 'public',
    ar: 'عامة بالرابط',
    en: 'Public link',
    hintAr: 'أي زائر يفتح الرابط يرى بطاقتك المهنية. لا يُعرض بريدك ولا هاتفك إطلاقاً.',
    hintEn: 'Anyone with the link sees your professional card. Your email and phone are never shown.',
  },
  {
    id: 'members',
    ar: 'للأعضاء المؤكَّدين',
    en: 'Confirmed members',
    hintAr: 'القواعد تمنع فتح الصفحة قبل تسجيل الدخول وتأكيد البريد. تبقى في الدليل بالاسم فقط.',
    hintEn: 'The rules refuse the page until sign-in and email confirmation. You still appear in the directory by name.',
  },
];

export function visibilityById(id: string | undefined): NetworkProfileVisibility {
  return id === 'members' ? 'members' : 'public';
}

/* --------------------------------- URLs ---------------------------------- */

const looksLikeHttpUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.length > NETWORK_MEDIA_LIMITS.urlMax) return false;
  return /^https:\/\/[^\s]+$/i.test(trimmed);
};

/**
 * A photo or banner URL. HTTPS only: the site itself is served over HTTPS, and an
 * `http://` image would be blocked as mixed content — promising a picture that
 * cannot load is worse than asking for a proper link.
 */
export function isSafeImageUrl(value: string): boolean {
  return looksLikeHttpUrl(value);
}

export type LinkedInUrlProblem = 'empty' | 'scheme' | 'host' | 'too_long';

/**
 * The «LinkedIn» button points at the member's own profile there. We accept only a
 * LinkedIn host, so the button can never be quietly repurposed as a redirect to
 * somewhere else on a page that carries INSCO's name.
 */
export function inspectLinkedInUrl(value: string): LinkedInUrlProblem | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed.length > NETWORK_MEDIA_LIMITS.urlMax) return 'too_long';
  if (!/^https:\/\//i.test(trimmed)) return 'scheme';
  let host: string;
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return 'scheme';
  }
  const allowed = ['linkedin.com', 'www.linkedin.com', 'lnkd.in', 'www.lnkd.in'];
  const isLinkedIn = allowed.includes(host) || host.endsWith('.linkedin.com');
  return isLinkedIn ? null : 'host';
}

export function normaliseLinkedInUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  // A bare `linkedin.com/in/name` is a very common paste; make it a real URL
  // instead of rejecting it with a message about a scheme nobody types.
  if (/^(www\.)?(linkedin\.com|lnkd\.in)\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function linkedInProblemMessage(problem: LinkedInUrlProblem, isAr: boolean): string {
  switch (problem) {
    case 'empty':
      return isAr ? 'اكتب رابط ملفك على LinkedIn أو اتركه فارغاً.' : 'Enter your LinkedIn URL, or leave it empty.';
    case 'scheme':
      return isAr
        ? 'الرابط يجب أن يبدأ بـ https:// (مثال: https://www.linkedin.com/in/your-name).'
        : 'The link must start with https:// (e.g. https://www.linkedin.com/in/your-name).';
    case 'host':
      return isAr
        ? 'هذا ليس رابط LinkedIn. نقبل linkedin.com أو lnkd.in فقط.'
        : 'That is not a LinkedIn link. Only linkedin.com or lnkd.in are accepted.';
    case 'too_long':
      return isAr ? 'الرابط أطول من المسموح.' : 'The link is longer than allowed.';
  }
}

/* -------------------------------- uploads -------------------------------- */

export interface MediaFileLike {
  type: string;
  size: number;
}

export interface MediaRejection {
  ar: string;
  en: string;
}

/**
 * Validate a picked file before a single byte leaves the device.
 *
 * The same two checks exist in `storage.rules`; doing them here as well turns a
 * rejected upload into an instant explanation instead of a network error.
 */
export function validateMediaFile(file: MediaFileLike, kind: NetworkMediaKind): MediaRejection | null {
  const isAr = true;
  const maxBytes = kind === 'photo' ? NETWORK_MEDIA_LIMITS.photoMaxBytes : NETWORK_MEDIA_LIMITS.bannerMaxBytes;
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  if (!(NETWORK_MEDIA_LIMITS.acceptedTypes as readonly string[]).includes(file.type)) {
    return {
      ar: 'الصيغة غير مدعومة. المقبول: JPG أو PNG أو WebP.',
      en: 'Unsupported format. Accepted: JPG, PNG or WebP.',
    };
  }
  if (file.size > maxBytes) {
    return {
      ar: `الحجم أكبر من ${maxMb} ميجابايت. صغّر الصورة ثم أعد المحاولة.`,
      en: `The file is larger than ${maxMb} MB. Shrink it and try again.`,
    };
  }
  if (file.size === 0) {
    return isAr
      ? { ar: 'الملف فارغ.', en: 'The file is empty.' }
      : { ar: 'الملف فارغ.', en: 'The file is empty.' };
  }
  return null;
}

export function extensionForMime(type: string): 'jpg' | 'png' | 'webp' {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

/** Where a member's media lives in the bucket; mirrored by `storage.rules`. */
export function mediaPath(uid: string, kind: NetworkMediaKind, extension: string): string {
  return `community_profiles/${uid}/${kind}-${Date.now()}.${extension}`;
}

/* --------------------------------- banner -------------------------------- */

export interface BannerPalette {
  from: string;
  to: string;
  accent: string;
  ink: string;
}

const PALETTES: Record<string, BannerPalette> = {
  'الفحص غير الإتلافي': { from: '#120b2e', to: '#3b1d7a', accent: '#a78bfa', ink: '#f5f3ff' },
  'المعالجة الحرارية': { from: '#2a0f0b', to: '#7c2d12', accent: '#fdba74', ink: '#fff7ed' },
  'فحص اللحام': { from: '#0b1f2a', to: '#155e75', accent: '#67e8f9', ink: '#ecfeff' },
  'ضمان وضبط الجودة': { from: '#0b2416', to: '#166534', accent: '#86efac', ink: '#f0fdf4' },
  'التآكل والمواد': { from: '#241a06', to: '#854d0e', accent: '#fde047', ink: '#fefce8' },
  'خطوط الأنابيب': { from: '#101a2c', to: '#1e3a8a', accent: '#93c5fd', ink: '#eff6ff' },
  'السلامة الصناعية': { from: '#2a0a14', to: '#9f1239', accent: '#fda4af', ink: '#fff1f2' },
  'مقاولات وصيانة صناعية': { from: '#171717', to: '#3f3f46', accent: '#d4d4d8', ink: '#fafafa' },
  'تعليم وتدريب هندسي': { from: '#14103a', to: '#4338ca', accent: '#c7d2fe', ink: '#eef2ff' },
};

const FALLBACK_PALETTE: BannerPalette = { from: '#120b2e', to: '#3b1d7a', accent: '#a78bfa', ink: '#f5f3ff' };

export function bannerPaletteFor(sector: string): BannerPalette {
  return PALETTES[sector] ?? FALLBACK_PALETTE;
}

/** Up to two initials, so an avatar never has to be an empty circle. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '؟';
  const first = Array.from(words[0])[0] ?? '';
  const second = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? '' : '';
  return `${first}${second}`.toUpperCase();
}

/** Greedy wrap on spaces; a single over-long word is left intact rather than cut. */
export function wrapBannerText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current === '' ? word : `${current} ${word}`;
    if (Array.from(candidate).length <= maxChars || current === '') {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current !== '') lines.push(current);
  return lines;
}

export interface BannerSpec {
  width: number;
  height: number;
  palette: BannerPalette;
  name: string;
  headlineLines: string[];
  metaLine: string;
  initials: string;
  /** Draw the INSCO network wordmark in the corner. */
  brand: string;
  rtl: boolean;
}

export interface BannerSource {
  displayName: string;
  headline?: string;
  organizationName?: string;
  sector?: string;
  city?: string;
}

/**
 * Turn a card into a banner that says something true.
 *
 * The generated banner is built from the member's own card only — name, headline,
 * organisation, sector, city. It never adds a certification, a badge or a title the
 * member has not entered.
 */
export function bannerSpecFor(source: BannerSource, language: 'ar' | 'en' = 'ar'): BannerSpec {
  const isAr = language === 'ar';
  const headline = (source.headline ?? '').trim();
  const meta = [source.organizationName, source.city].map(part => (part ?? '').trim()).filter(Boolean).join(' · ');
  return {
    width: NETWORK_MEDIA_LIMITS.bannerWidth,
    height: NETWORK_MEDIA_LIMITS.bannerHeight,
    palette: bannerPaletteFor((source.sector ?? '').trim()),
    name: (source.displayName ?? '').trim(),
    headlineLines: headline === '' ? [] : wrapBannerText(headline, isAr ? 46 : 62, 2),
    metaLine: meta,
    initials: initialsOf(source.displayName ?? ''),
    brand: isAr ? 'الشبكة الهندسية · إنسكو' : 'INSCO Engineering Network',
    rtl: isAr,
  };
}

/** The smallest useful check before drawing: a banner without a name is anonymous. */
export function canGenerateBanner(source: BannerSource): boolean {
  return (source.displayName ?? '').trim().length >= 2;
}

/* ------------------------------- visibility ------------------------------- */

export interface PublicPageAccess {
  /** `ok` — render the page; otherwise say plainly why not. */
  state: 'ok' | 'missing' | 'private' | 'not-published';
}

/**
 * Decide what a visitor may see, mirroring the rules.
 *
 * `profile` is `null` when the document could not be read at all — the rules refuse
 * a members-only card to a signed-out reader, and Firestore reports that as a
 * permission error, which the caller turns into `private` rather than `missing`.
 */
export function publicPageAccess(
  profile: Pick<CommunityWorkspaceProfile, 'isPublished' | 'profileVisibility'> | null,
  viewer: { signedIn: boolean; verified: boolean }
): PublicPageAccess {
  if (!profile) return { state: 'missing' };
  if (!profile.isPublished) return { state: 'not-published' };
  if (visibilityById(profile.profileVisibility) === 'members' && !(viewer.signedIn && viewer.verified)) {
    return { state: 'private' };
  }
  return { state: 'ok' };
}

/** The shareable link to a member's public page — one spelling, used everywhere. */
export function memberPageLink(uid: string): string {
  return `#network/people/${uid}`;
}
