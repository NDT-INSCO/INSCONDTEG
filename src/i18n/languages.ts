/**
 * Universal language registry for the INSCO Translator Robot.
 *
 * The site itself ships natively in Arabic and English (`Language` in
 * `src/types.ts`). Every other language is reached through machine
 * translation at runtime (see `translateEngine.ts`), so this registry only
 * needs each language's code, native name and text direction — the actual
 * translated strings are produced on demand and cached in the browser.
 *
 * Codes follow the ISO 639-1 / Google Translate / MyMemory conventions so
 * they can be passed straight to the translation providers. Chinese uses
 * the region-qualified forms (`zh-CN`, `zh-TW`) those providers expect.
 */

export interface SiteLanguage {
  /** Provider code, e.g. `fr`, `zh-CN`, `pt-BR`. */
  code: string;
  /** Name in the language itself, e.g. `Français`. */
  native: string;
  /** Name in English, e.g. `French`. */
  english: string;
  /** Text direction for the language. */
  dir: 'rtl' | 'ltr';
  /** Shown in the robot's "popular" row. */
  popular?: boolean;
}

export const SITE_LANGUAGES: SiteLanguage[] = [
  { code: 'ar', native: 'العربية', english: 'Arabic', dir: 'rtl', popular: true },
  { code: 'en', native: 'English', english: 'English', dir: 'ltr', popular: true },
  { code: 'fr', native: 'Français', english: 'French', dir: 'ltr', popular: true },
  { code: 'es', native: 'Español', english: 'Spanish', dir: 'ltr', popular: true },
  { code: 'de', native: 'Deutsch', english: 'German', dir: 'ltr', popular: true },
  { code: 'ru', native: 'Русский', english: 'Russian', dir: 'ltr', popular: true },
  { code: 'zh-CN', native: '简体中文', english: 'Chinese (Simplified)', dir: 'ltr', popular: true },
  { code: 'ja', native: '日本語', english: 'Japanese', dir: 'ltr', popular: true },
  { code: 'ko', native: '한국어', english: 'Korean', dir: 'ltr', popular: true },
  { code: 'tr', native: 'Türkçe', english: 'Turkish', dir: 'ltr', popular: true },
  { code: 'ur', native: 'اردو', english: 'Urdu', dir: 'rtl', popular: true },
  { code: 'fa', native: 'فارسی', english: 'Persian', dir: 'rtl', popular: true },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', dir: 'ltr', popular: true },
  { code: 'it', native: 'Italiano', english: 'Italian', dir: 'ltr', popular: true },
  { code: 'pt', native: 'Português', english: 'Portuguese', dir: 'ltr', popular: true },
  { code: 'zh-TW', native: '繁體中文', english: 'Chinese (Traditional)', dir: 'ltr' },
  { code: 'pt-BR', native: 'Português (Brasil)', english: 'Brazilian Portuguese', dir: 'ltr' },
  { code: 'nl', native: 'Nederlands', english: 'Dutch', dir: 'ltr' },
  { code: 'sv', native: 'Svenska', english: 'Swedish', dir: 'ltr' },
  { code: 'no', native: 'Norsk', english: 'Norwegian', dir: 'ltr' },
  { code: 'da', native: 'Dansk', english: 'Danish', dir: 'ltr' },
  { code: 'fi', native: 'Suomi', english: 'Finnish', dir: 'ltr' },
  { code: 'pl', native: 'Polski', english: 'Polish', dir: 'ltr' },
  { code: 'cs', native: 'Čeština', english: 'Czech', dir: 'ltr' },
  { code: 'sk', native: 'Slovenčina', english: 'Slovak', dir: 'ltr' },
  { code: 'hu', native: 'Magyar', english: 'Hungarian', dir: 'ltr' },
  { code: 'ro', native: 'Română', english: 'Romanian', dir: 'ltr' },
  { code: 'bg', native: 'Български', english: 'Bulgarian', dir: 'ltr' },
  { code: 'uk', native: 'Українська', english: 'Ukrainian', dir: 'ltr' },
  { code: 'sr', native: 'Српски', english: 'Serbian', dir: 'ltr' },
  { code: 'hr', native: 'Hrvatski', english: 'Croatian', dir: 'ltr' },
  { code: 'bs', native: 'Bosanski', english: 'Bosnian', dir: 'ltr' },
  { code: 'sl', native: 'Slovenščina', english: 'Slovenian', dir: 'ltr' },
  { code: 'et', native: 'Eesti', english: 'Estonian', dir: 'ltr' },
  { code: 'lv', native: 'Latviešu', english: 'Latvian', dir: 'ltr' },
  { code: 'lt', native: 'Lietuvių', english: 'Lithuanian', dir: 'ltr' },
  { code: 'el', native: 'Ελληνικά', english: 'Greek', dir: 'ltr' },
  { code: 'he', native: 'עברית', english: 'Hebrew', dir: 'rtl' },
  { code: 'ka', native: 'ქართული', english: 'Georgian', dir: 'ltr' },
  { code: 'hy', native: 'Հայերեն', english: 'Armenian', dir: 'ltr' },
  { code: 'az', native: 'Azərbaycan', english: 'Azerbaijani', dir: 'ltr' },
  { code: 'kk', native: 'Қазақша', english: 'Kazakh', dir: 'ltr' },
  { code: 'uz', native: 'Oʻzbek', english: 'Uzbek', dir: 'ltr' },
  { code: 'ky', native: 'Кыргызча', english: 'Kyrgyz', dir: 'ltr' },
  { code: 'tg', native: 'Тоҷикӣ', english: 'Tajik', dir: 'ltr' },
  { code: 'tk', native: 'Türkmençe', english: 'Turkmen', dir: 'ltr' },
  { code: 'mn', native: 'Монгол', english: 'Mongolian', dir: 'ltr' },
  { code: 'be', native: 'Беларуская', english: 'Belarusian', dir: 'ltr' },
  { code: 'mk', native: 'Македонски', english: 'Macedonian', dir: 'ltr' },
  { code: 'sq', native: 'Shqip', english: 'Albanian', dir: 'ltr' },
  { code: 'mt', native: 'Malti', english: 'Maltese', dir: 'ltr' },
  { code: 'ca', native: 'Català', english: 'Catalan', dir: 'ltr' },
  { code: 'eu', native: 'Euskara', english: 'Basque', dir: 'ltr' },
  { code: 'gl', native: 'Galego', english: 'Galician', dir: 'ltr' },
  { code: 'cy', native: 'Cymraeg', english: 'Welsh', dir: 'ltr' },
  { code: 'ga', native: 'Gaeilge', english: 'Irish', dir: 'ltr' },
  { code: 'is', native: 'Íslenska', english: 'Icelandic', dir: 'ltr' },
  { code: 'gd', native: 'Gàidhlig', english: 'Scottish Gaelic', dir: 'ltr' },
  { code: 'lb', native: 'Lëtzebuergesch', english: 'Luxembourgish', dir: 'ltr' },
  { code: 'fy', native: 'Frysk', english: 'Frisian', dir: 'ltr' },
  { code: 'eo', native: 'Esperanto', english: 'Esperanto', dir: 'ltr' },
  { code: 'la', native: 'Latina', english: 'Latin', dir: 'ltr' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian', dir: 'ltr' },
  { code: 'ms', native: 'Bahasa Melayu', english: 'Malay', dir: 'ltr' },
  { code: 'th', native: 'ไทย', english: 'Thai', dir: 'ltr' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese', dir: 'ltr' },
  { code: 'tl', native: 'Filipino', english: 'Filipino', dir: 'ltr' },
  { code: 'ceb', native: 'Cebuano', english: 'Cebuano', dir: 'ltr' },
  { code: 'jv', native: 'Basa Jawa', english: 'Javanese', dir: 'ltr' },
  { code: 'su', native: 'Basa Sunda', english: 'Sundanese', dir: 'ltr' },
  { code: 'haw', native: 'ʻŌlelo Hawaiʻi', english: 'Hawaiian', dir: 'ltr' },
  { code: 'hmn', native: 'Hmoob', english: 'Hmong', dir: 'ltr' },
  { code: 'mi', native: 'Te Reo Māori', english: 'Maori', dir: 'ltr' },
  { code: 'sm', native: 'Gagana Samoa', english: 'Samoan', dir: 'ltr' },
  { code: 'ht', native: 'Kreyòl Ayisyen', english: 'Haitian Creole', dir: 'ltr' },
  { code: 'mg', native: 'Malagasy', english: 'Malagasy', dir: 'ltr' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali', dir: 'ltr' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', dir: 'ltr' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', dir: 'ltr' },
  { code: 'mr', native: 'मराठी', english: 'Marathi', dir: 'ltr' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati', dir: 'ltr' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', dir: 'ltr' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada', dir: 'ltr' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam', dir: 'ltr' },
  { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia', dir: 'ltr' },
  { code: 'as', native: 'অসমীয়া', english: 'Assamese', dir: 'ltr' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali', dir: 'ltr' },
  { code: 'si', native: 'සිංහල', english: 'Sinhala', dir: 'ltr' },
  { code: 'my', native: 'မြန်မာ', english: 'Burmese', dir: 'ltr' },
  { code: 'km', native: 'ខ្មែរ', english: 'Khmer', dir: 'ltr' },
  { code: 'lo', native: 'ລາວ', english: 'Lao', dir: 'ltr' },
  { code: 'bo', native: 'བོད་ཡིག', english: 'Tibetan', dir: 'ltr' },
  { code: 'dz', native: 'རྫོང་ཁ', english: 'Dzongkha', dir: 'ltr' },
  { code: 'sw', native: 'Kiswahili', english: 'Swahili', dir: 'ltr' },
  { code: 'ha', native: 'Hausa', english: 'Hausa', dir: 'ltr' },
  { code: 'yo', native: 'Yorùbá', english: 'Yoruba', dir: 'ltr' },
  { code: 'ig', native: 'Igbo', english: 'Igbo', dir: 'ltr' },
  { code: 'am', native: 'አማርኛ', english: 'Amharic', dir: 'ltr' },
  { code: 'so', native: 'Soomaali', english: 'Somali', dir: 'ltr' },
  { code: 'rw', native: 'Kinyarwanda', english: 'Kinyarwanda', dir: 'ltr' },
  { code: 'ny', native: 'Chichewa', english: 'Chichewa', dir: 'ltr' },
  { code: 'st', native: 'Sesotho', english: 'Sesotho', dir: 'ltr' },
  { code: 'sn', native: 'Shona', english: 'Shona', dir: 'ltr' },
  { code: 'zu', native: 'Zulu', english: 'Zulu', dir: 'ltr' },
  { code: 'xh', native: 'Xhosa', english: 'Xhosa', dir: 'ltr' },
  { code: 'af', native: 'Afrikaans', english: 'Afrikaans', dir: 'ltr' },
  { code: 'ps', native: 'پښتو', english: 'Pashto', dir: 'rtl' },
  { code: 'ku', native: 'Kurdî', english: 'Kurdish (Sorani)', dir: 'rtl' },
  { code: 'ckb', native: 'کوردی', english: 'Kurdish (Sorani - ckb)', dir: 'rtl' },
  { code: 'sd', native: 'سنڌي', english: 'Sindhi', dir: 'rtl' },
  { code: 'ug', native: 'ئۇيغۇر', english: 'Uyghur', dir: 'rtl' },
  { code: 'yi', native: 'יידיש', english: 'Yiddish', dir: 'rtl' },
  // --- World coverage expansion: remaining Google/MyMemory languages ---
  { code: 'ak', native: 'Akan', english: 'Akan (Twi)', dir: 'ltr' },
  { code: 'ay', native: 'Aymar aru', english: 'Aymara', dir: 'ltr' },
  { code: 'bho', native: 'भोजपुरी', english: 'Bhojpuri', dir: 'ltr' },
  { code: 'bm', native: 'Bamanankan', english: 'Bambara', dir: 'ltr' },
  { code: 'br', native: 'Brezhoneg', english: 'Breton', dir: 'ltr' },
  { code: 'co', native: 'Corsu', english: 'Corsican', dir: 'ltr' },
  { code: 'dv', native: 'ދިވެހި', english: 'Dhivehi', dir: 'rtl' },
  { code: 'doi', native: 'डोगरी', english: 'Dogri', dir: 'ltr' },
  { code: 'ee', native: 'Eʋegbe', english: 'Ewe', dir: 'ltr' },
  { code: 'gn', native: "Avañe'ẽ", english: 'Guarani', dir: 'ltr' },
  { code: 'gom', native: 'कोंकणी', english: 'Konkani', dir: 'ltr' },
  { code: 'ilo', native: 'Ilocano', english: 'Ilocano', dir: 'ltr' },
  { code: 'kri', native: 'Krio', english: 'Krio', dir: 'ltr' },
  { code: 'ln', native: 'Lingála', english: 'Lingala', dir: 'ltr' },
  { code: 'lg', native: 'Luganda', english: 'Ganda', dir: 'ltr' },
  { code: 'lus', native: 'Mizo ṭawng', english: 'Mizo', dir: 'ltr' },
  { code: 'mai', native: 'मैथिली', english: 'Maithili', dir: 'ltr' },
  { code: 'mni-Mtei', native: 'ꯃꯅꯤꯄꯨꯔꯤ', english: 'Manipuri (Meitei)', dir: 'ltr' },
  { code: 'nso', native: 'Sepedi', english: 'Northern Sotho', dir: 'ltr' },
  { code: 'om', native: 'Afaan Oromoo', english: 'Oromo', dir: 'ltr' },
  { code: 'qu', native: 'Runa Simi', english: 'Quechua', dir: 'ltr' },
  { code: 'sa', native: 'संस्कृतम्', english: 'Sanskrit', dir: 'ltr' },
  { code: 'tt', native: 'Татарча', english: 'Tatar', dir: 'ltr' },
  { code: 'ti', native: 'ትግርኛ', english: 'Tigrinya', dir: 'ltr' },
  { code: 'ts', native: 'Xitsonga', english: 'Tsonga', dir: 'ltr' },
  { code: 'chr', native: 'ᏣᎳᎩ', english: 'Cherokee', dir: 'ltr' },
];

const BY_CODE = new Map(SITE_LANGUAGES.map(l => [l.code.toLowerCase(), l]));

/** Look up a language by provider code (`fr`, `zh-CN`, …), case-insensitively. */
export function getLanguage(code: string | null | undefined): SiteLanguage | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.trim().toLowerCase());
}

/** True when the language is written right-to-left. */
export function isRtlLanguage(code: string | null | undefined): boolean {
  return getLanguage(code)?.dir === 'rtl';
}

/**
 * Normalise a browser / URL language tag (`fr-FR`, `ar-EG`, `zh-Hans-CN`)
 * to a registry code, or `null` when the language is not supported.
 */
export function normalizeLanguageCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const tag = raw.trim().replace(/_/g, '-');
  if (!tag) return null;
  const lower = tag.toLowerCase();
  // Exact match first (covers zh-CN / zh-TW / pt-BR).
  const exact = BY_CODE.get(lower);
  if (exact) return exact.code;
  // Script subtags: zh-Hans-CN → zh-CN, zh-Hant-TW → zh-TW.
  const parts = lower.split('-');
  if (parts[0] === 'zh') {
    if (parts.includes('tw') || parts.includes('hant') || parts.includes('hk')) return 'zh-TW';
    return 'zh-CN';
  }
  if (parts[0] === 'pt' && parts.includes('br')) return 'pt-BR';
  // Fall back to the primary subtag (fr-FR → fr, en-US → en).
  const primary = BY_CODE.get(parts[0]);
  return primary ? primary.code : null;
}

/** Detect the visitor's browser language as a registry code, if supported. */
export function detectBrowserLanguage(
  navLanguage?: string | null,
  navLanguages?: readonly string[] | null,
): string | null {
  const candidates: (string | null | undefined)[] = [];
  if (navLanguage) candidates.push(navLanguage);
  if (navLanguages) candidates.push(...navLanguages);
  if (candidates.length === 0 && typeof navigator !== 'undefined') {
    candidates.push(navigator.language);
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
  }
  for (const candidate of candidates) {
    const code = normalizeLanguageCode(candidate);
    if (code) return code;
  }
  return null;
}

/** Read an explicit `?lang=xx` / `?translate=xx` request from the URL. */
export function languageFromUrl(search: string | null | undefined): string | null {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return normalizeLanguageCode(params.get('lang') ?? params.get('translate'));
  } catch {
    return null;
  }
}
