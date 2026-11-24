/**
 * Country → language mapping for INSCO geo-auto-translation.
 *
 * Every ISO 3166-1 alpha-2 country code maps to a `SITE_LANGUAGES` code so
 * the robot can open the site in the visitor's most likely language from an
 * IP geolocation result. Territories and micro-states fall back to the
 * language of their administering country or to English when truly neutral
 * (e.g. Antarctica).
 *
 * Country names are resolved at runtime via `Intl.DisplayNames` when
 * available so we don't ship 250 translations; a small English fallback map
 * covers environments without it (tests / old browsers).
 */

import type { SiteLanguage } from './languages';
import { getLanguage } from './languages';

/** Upper-case ISO 3166-1 alpha-2 → provider language code. */
export const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // Middle East & North Africa
  SA: 'ar', AE: 'ar', QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar', YE: 'ar',
  JO: 'ar', LB: 'ar', SY: 'ar', IQ: 'ar', PS: 'ar', EG: 'ar',
  MA: 'ar', DZ: 'ar', TN: 'ar', LY: 'ar', SD: 'ar', MR: 'ar', SO: 'so',
  DJ: 'ar', KM: 'ar', SS: 'ar',
  IL: 'he', TR: 'tr', IR: 'fa', AF: 'fa',
  // Sub-Saharan Africa
  ZA: 'en', NG: 'en', KE: 'sw', ET: 'am', GH: 'en', TZ: 'sw', UG: 'sw',
  RW: 'rw', BI: 'rw', MZ: 'pt', AO: 'pt', BW: 'en', ZM: 'en', ZW: 'sn',
  MW: 'ny', MU: 'en', SC: 'en', NA: 'af', CM: 'fr', CI: 'fr', SN: 'fr',
  ML: 'fr', BF: 'fr', NE: 'fr', TD: 'fr', BJ: 'fr', TG: 'fr', GW: 'pt',
  GN: 'fr', SL: 'en', LR: 'en', GM: 'en', CV: 'pt', ST: 'pt', GA: 'fr',
  CG: 'fr', CD: 'fr', CF: 'fr', GQ: 'es', ER: 'am', MG: 'mg', RE: 'fr',
  YT: 'fr', SH: 'en', LS: 'st', SZ: 'en',
  // Europe — West & North
  FR: 'fr', BE: 'nl', NL: 'nl', LU: 'lb', DE: 'de', AT: 'de', CH: 'de',
  LI: 'de', GB: 'en', IE: 'ga', IM: 'en', JE: 'en', GG: 'en', MC: 'fr',
  ES: 'es', PT: 'pt', AD: 'ca', IT: 'it', SM: 'it', VA: 'it', MT: 'mt',
  SE: 'sv', NO: 'no', DK: 'da', FI: 'fi', IS: 'is', FO: 'fo' as unknown as string, // fo not in registry → fallback in helper
  // Europe — Central & East
  PL: 'pl', CZ: 'cs', SK: 'sk', HU: 'hu', RO: 'ro', BG: 'bg', GR: 'el',
  CY: 'el', HR: 'hr', SI: 'sl', BA: 'bs', RS: 'sr', ME: 'sr', MK: 'mk',
  AL: 'sq', XK: 'sq', // Kosovo — not ISO but common
  RU: 'ru', UA: 'uk', BY: 'be', MD: 'ro', EE: 'et', LV: 'lv', LT: 'lt',
  // Europe — micro & overseas
  GI: 'en', AX: 'sv', SJ: 'no', GL: 'da', PM: 'fr', GP: 'fr',
  MQ: 'fr', BL: 'fr', MF: 'fr',
  // Asia — East
  CN: 'zh-CN', HK: 'zh-CN', MO: 'zh-CN', TW: 'zh-TW', JP: 'ja',
  KR: 'ko', KP: 'ko', MN: 'mn',
  // Asia — Southeast
  SG: 'en', MY: 'ms', ID: 'id', TH: 'th', VN: 'vi', PH: 'tl', KH: 'km',
  LA: 'lo', MM: 'my', BN: 'ms', TL: 'tl',
  // Asia — South & Central
  IN: 'hi', PK: 'ur', BD: 'bn', NP: 'ne', BT: 'dz', LK: 'si', MV: 'en',
  KZ: 'kk', UZ: 'uz', KG: 'ky', TJ: 'tg', TM: 'tk', AZ: 'az', AM: 'hy',
  GE: 'ka',
  // Asia — Pacific territories
  GU: 'en', MP: 'en', AS: 'sm', CK: 'en', FJ: 'en', FM: 'en', MH: 'en',
  NR: 'en', NU: 'en', PW: 'en', PG: 'en', SB: 'en', TO: 'en', TV: 'en',
  VU: 'en', WS: 'sm', KI: 'en',
  // Americas — North
  US: 'en', CA: 'en', MX: 'es', BS: 'en', BZ: 'en', GT: 'es', HN: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', CU: 'es', DO: 'es', HT: 'ht',
  JM: 'en', TT: 'en', BB: 'en', AG: 'en', DM: 'en', LC: 'en', VC: 'en',
  KN: 'en', GD: 'en', PR: 'es', VI: 'en', VG: 'en', KY: 'en', TC: 'en',
  BM: 'en', AW: 'nl', CW: 'nl', BQ: 'nl', SX: 'nl',
  // Americas — South
  BR: 'pt-BR', AR: 'es', CL: 'es', CO: 'es', PE: 'es', VE: 'es', EC: 'es',
  BO: 'es', PY: 'es', UY: 'es', GY: 'en', SR: 'nl', GF: 'fr', FK: 'en',
  // Oceania
  AU: 'en', NZ: 'mi', // Maori available
  // Antarctica & neutral territories
  AQ: 'en', BV: 'en', HM: 'en', TF: 'fr', IO: 'en', CC: 'en', CX: 'en',
  NF: 'en', PN: 'en', GS: 'en', UM: 'en', EH: 'ar',
};

/** Fallback English country names for environments without Intl.DisplayNames. */
const COUNTRY_EN_FALLBACK: Record<string, string> = {
  SA: 'Saudi Arabia', AE: 'United Arab Emirates', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain',
  OM: 'Oman', YE: 'Yemen', JO: 'Jordan', LB: 'Lebanon', SY: 'Syria', IQ: 'Iraq', PS: 'Palestine',
  EG: 'Egypt', MA: 'Morocco', DZ: 'Algeria', TN: 'Tunisia', LY: 'Libya', SD: 'Sudan', MR: 'Mauritania',
  SO: 'Somalia', DJ: 'Djibouti', KM: 'Comoros', SS: 'South Sudan', IL: 'Israel', TR: 'Turkey', IR: 'Iran',
  AF: 'Afghanistan', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', ET: 'Ethiopia', GH: 'Ghana',
  TZ: 'Tanzania', UG: 'Uganda', RW: 'Rwanda', BI: 'Burundi', MZ: 'Mozambique', AO: 'Angola', BW: 'Botswana',
  ZM: 'Zambia', ZW: 'Zimbabwe', MW: 'Malawi', MU: 'Mauritius', SC: 'Seychelles', NA: 'Namibia', CM: 'Cameroon',
  CI: 'Ivory Coast', SN: 'Senegal', ML: 'Mali', BF: 'Burkina Faso', NE: 'Niger', TD: 'Chad', BJ: 'Benin',
  TG: 'Togo', GW: 'Guinea-Bissau', GN: 'Guinea', SL: 'Sierra Leone', LR: 'Liberia', GM: 'Gambia',
  CV: 'Cape Verde', ST: 'São Tomé and Príncipe', GA: 'Gabon', CG: 'Republic of Congo', CD: 'DR Congo',
  CF: 'Central African Republic', GQ: 'Equatorial Guinea', ER: 'Eritrea', MG: 'Madagascar', RE: 'Réunion',
  YT: 'Mayotte', SH: 'Saint Helena', LS: 'Lesotho', SZ: 'Eswatini',
  FR: 'France', BE: 'Belgium', NL: 'Netherlands', LU: 'Luxembourg', DE: 'Germany', AT: 'Austria',
  CH: 'Switzerland', LI: 'Liechtenstein', GB: 'United Kingdom', IE: 'Ireland', IM: 'Isle of Man',
  JE: 'Jersey', GG: 'Guernsey', MC: 'Monaco', ES: 'Spain', PT: 'Portugal', AD: 'Andorra', IT: 'Italy',
  SM: 'San Marino', VA: 'Vatican City', MT: 'Malta', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  FI: 'Finland', IS: 'Iceland', PL: 'Poland', CZ: 'Czechia', SK: 'Slovakia', HU: 'Hungary', RO: 'Romania',
  BG: 'Bulgaria', GR: 'Greece', CY: 'Cyprus', HR: 'Croatia', SI: 'Slovenia', BA: 'Bosnia and Herzegovina',
  RS: 'Serbia', ME: 'Montenegro', MK: 'North Macedonia', AL: 'Albania', RU: 'Russia', UA: 'Ukraine',
  BY: 'Belarus', MD: 'Moldova', EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania', GI: 'Gibraltar',
  CN: 'China', HK: 'Hong Kong', MO: 'Macao', TW: 'Taiwan', JP: 'Japan', KR: 'South Korea', KP: 'North Korea',
  MN: 'Mongolia', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', TH: 'Thailand', VN: 'Vietnam',
  PH: 'Philippines', KH: 'Cambodia', LA: 'Laos', MM: 'Myanmar', BN: 'Brunei', TL: 'Timor-Leste',
  IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', NP: 'Nepal', BT: 'Bhutan', LK: 'Sri Lanka', MV: 'Maldives',
  KZ: 'Kazakhstan', UZ: 'Uzbekistan', KG: 'Kyrgyzstan', TJ: 'Tajikistan', TM: 'Turkmenistan', AZ: 'Azerbaijan',
  AM: 'Armenia', GE: 'Georgia',
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  PE: 'Peru', VE: 'Venezuela', EC: 'Ecuador', BO: 'Bolivia', PY: 'Paraguay', UY: 'Uruguay', GY: 'Guyana',
  SR: 'Suriname', AU: 'Australia', NZ: 'New Zealand',
};

let displayNamesAr: Intl.DisplayNames | null | undefined;
let displayNamesEn: Intl.DisplayNames | null | undefined;

function getDisplayNames(locale: 'ar' | 'en'): Intl.DisplayNames | null {
  if (locale === 'ar') {
    if (displayNamesAr !== undefined) return displayNamesAr;
    try {
      displayNamesAr = new Intl.DisplayNames(['ar'], { type: 'region' });
      return displayNamesAr;
    } catch {
      displayNamesAr = null;
      return null;
    }
  }
  if (displayNamesEn !== undefined) return displayNamesEn;
  try {
    displayNamesEn = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNamesEn;
  } catch {
    displayNamesEn = null;
    return null;
  }
}

/** Resolve an ISO country code to its language in the registry, or null. */
export function getLanguageForCountry(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  const upper = countryCode.trim().toUpperCase();
  const mapped = COUNTRY_TO_LANGUAGE[upper];
  if (!mapped) return null;
  // Guard: territory mapped to a language we don't ship (e.g. fo) → fallback to en
  const lang = getLanguage(mapped);
  if (lang) return lang.code;
  if (mapped.toLowerCase() === 'fo') return 'da';
  return mapped;
}

/** Flag emoji for an ISO country code (🇦→🇿 regional indicators). */
export function countryToFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.trim().length !== 2) return '🌍';
  const upper = countryCode.trim().toUpperCase();
  const base = 0x1f1e6; // 🇦
  const a = upper.charCodeAt(0) - 65 + base;
  const b = upper.charCodeAt(1) - 65 + base;
  try {
    return String.fromCodePoint(a, b);
  } catch {
    return '🌍';
  }
}

/** Human-readable country name in Arabic or English. */
export function getCountryName(countryCode: string | null | undefined, locale: 'ar' | 'en' = 'en'): string {
  if (!countryCode) return locale === 'ar' ? 'غير معروف' : 'Unknown';
  const upper = countryCode.trim().toUpperCase();
  const dn = getDisplayNames(locale);
  if (dn) {
    try {
      const name = dn.of(upper);
      if (name) return name;
    } catch {
      /* invalid region: fall through */
    }
  }
  return COUNTRY_EN_FALLBACK[upper] ?? upper;
}

/** All known country codes (useful for tests). */
export function allCountryCodes(): string[] {
  return Object.keys(COUNTRY_TO_LANGUAGE);
}
