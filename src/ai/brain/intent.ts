/**
 * What is the reader asking for?
 *
 * A local engine has no model to infer intent, so intent is *detected* from the words the
 * reader used — and the detection is a plain table a maintainer can read and correct. Each
 * intent only decides the *shape* of the answer (definition, comparison, procedure,
 * quotation, drill); the content always comes from the library.
 *
 * Bilingual by construction: the same question typed in Arabic or English lands on the
 * same intent, because both vocabularies are listed for every rule.
 */
import { normaliseArabic, tokenize } from '../search.js';

export type BrainIntent =
  | 'greeting'
  | 'definition'
  | 'compare'
  | 'procedure'
  | 'defect'
  | 'code'
  | 'safety'
  | 'practice'
  | 'post'
  | 'summarize'
  | 'navigate'
  | 'rfq'
  | 'selector';

export interface NdtMethod {
  code: string;
  /** Lower-case surface forms, Arabic included; matched on token boundaries. */
  aliases: string[];
  ar: string;
  en: string;
}

/**
 * The eleven methods the company actually advertises. The aliases are surface forms, not
 * abbreviations for the model: `ut` must not match inside "output", which is why the
 * matcher tokenises instead of substring-searching.
 */
export const NDT_METHODS: NdtMethod[] = [
  { code: 'PAUT', aliases: ['paut', 'phased', 'phasedarray', 'المصفوفه', 'الطوريه', 'المرحليه'], ar: 'PAUT', en: 'PAUT' },
  { code: 'TOFD', aliases: ['tofd', 'diffraction', 'الحيود', 'الطيران'], ar: 'TOFD', en: 'TOFD' },
  { code: 'UT', aliases: ['ut', 'ultrasonic', 'الموجات', 'الصوتيه', 'السونار'], ar: 'UT', en: 'UT' },
  { code: 'RT', aliases: ['rt', 'radiograph', 'radiographic', 'xray', 'الاشعه', 'الاشعاعي', 'التصوير'], ar: 'RT', en: 'RT' },
  { code: 'MT', aliases: ['mt', 'magnetic', 'المغناطيسيه', 'البراده'], ar: 'MT', en: 'MT' },
  { code: 'PT', aliases: ['pt', 'penetrant', 'النافذه', 'السوائل', 'النفوذ'], ar: 'PT', en: 'PT' },
  { code: 'VT', aliases: ['vt', 'visual', 'البصري', 'الظاهري'], ar: 'VT', en: 'VT' },
  { code: 'PWHT', aliases: ['pwht', 'المعالجه', 'الحراريه', 'التقسيه'], ar: 'PWHT', en: 'PWHT' },
  { code: 'PMI', aliases: ['pmi', 'material', 'المواد', 'التركيب'], ar: 'PMI', en: 'PMI' },
  { code: 'ET', aliases: ['eddy', 'التيارات'], ar: 'ET', en: 'ET' },
  { code: 'AUT', aliases: ['aut', 'automated', 'الالي'], ar: 'AUT', en: 'AUT' },
];

/** Normalised token set of the question, ready for the rules below. */
function tokensOf(text: string): Set<string> {
  return new Set(tokenize(text).map(token => token.toLowerCase()));
}

export function detectMethods(question: string): NdtMethod[] {
  const raw = ` ${normaliseArabic(question).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  const tokens = tokensOf(question);
  const found: NdtMethod[] = [];
  for (const method of NDT_METHODS) {
    const hit = method.aliases.some(alias => {
      const normalised = normaliseArabic(alias).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      if (!normalised) return false;
      if (normalised.includes(' ')) return raw.includes(` ${normalised} `);
      return tokens.has(normalised) || raw.includes(` ${normalised} `);
    });
    if (hit) found.push(method);
  }
  return found;
}

interface IntentRule {
  intent: BrainIntent;
  /** Any one of these is enough. Matched against normalised text. */
  any: string[];
}

/**
 * Ordered: the first rule that matches wins, so the specific shapes sit above the general
 * one. `post` needs an explicit posting word; a question *about* posts stays a definition.
 */
const RULES: IntentRule[] = [
  {
    intent: 'greeting',
    any: ['سلام عليكم', 'السلام عليكم', 'مرحبا', 'أهلا', 'اهلا', 'هاي', 'hello', 'hi there', 'good morning', 'good evening'],
  },
  {
    intent: 'post',
    any: ['منشور', 'منشورا', 'بوست', 'اكتب لي', 'اكتب منشور', 'صياغه منشور', 'انشر', 'draft a post', 'write a post', 'linkedin post', 'community post'],
  },
  {
    intent: 'summarize',
    any: ['لخص', 'تلخيص', 'ملخص', 'summarize', 'summary of', 'tl;dr'],
  },
  {
    intent: 'navigate',
    any: ['اذهب', 'افتح', 'وين', 'فين الصفحه', 'go to', 'open the page', 'where is', 'navigate'],
  },
  {
    intent: 'rfq',
    any: ['عرض سعر', 'طلب عرض', 'تسعير', 'rfq', 'quotation', 'request a quote', 'proposal'],
  },
  {
    intent: 'practice',
    any: ['سؤال تدريبي', 'تمارين', 'امتحان', 'اختبرني', 'quiz', 'practice question', 'test me', 'exam'],
  },
  {
    intent: 'compare',
    any: ['الفرق بين', 'فرق بين', 'قارن', 'مقارنه', 'الافضل بين', 'difference between', 'compare', 'versus', 'vs', 'better than'],
  },
  {
    intent: 'code',
    any: ['كود', 'بند', 'معيار', 'قبول', 'asme', 'astm', 'iso', 'api 1104', 'acceptance', 'code clause', 'standard'],
  },
  {
    intent: 'procedure',
    any: ['خطوات', 'كيفيه', 'كيف يتم', 'طريقه اجراء', 'اجراءات', 'procedure', 'how to', 'steps', 'process for'],
  },
  {
    intent: 'defect',
    any: ['عيب', 'عيوب', 'شق', 'شروخ', 'مساميه', 'اندماج', 'خبث', 'crack', 'porosity', 'lack of fusion', 'defect', 'discontinuity'],
  },
  {
    intent: 'safety',
    any: ['سلامه', 'وقايه', 'حمايه', 'اشعاع', 'radiation', 'safety', 'protection', 'exposure'],
  },
  {
    intent: 'selector',
    any: ['اختار', 'انسب طريقه', 'اي طريقه', 'which method', 'select', 'choose method', 'recommend a method'],
  },
];

export interface IntentResult {
  intent: BrainIntent;
  methods: NdtMethod[];
  /** True when the reader asked to compare two or more methods. */
  comparing: boolean;
  /** True when a posting verb was used even if another rule matched first. */
  posting: boolean;
}

/**
 * Does the text contain this phrase as whole words?
 *
 * Substring matching is what made "لخّص لي المنشورات" (summarise the posts) read as
 * "write a post": `منشور` is inside `المنشورات`. A phrase only counts when it stands as
 * its own token, with the Arabic article tolerated because readers write both forms.
 */
function hasPhrase(padded: string, phrase: string): boolean {
  const normalised = normaliseArabic(phrase).toLowerCase();
  if (!normalised) return false;
  if (padded.includes(` ${normalised} `)) return true;
  if (padded.includes(` ال${normalised} `)) return true;
  return false;
}

export function detectIntent(question: string): IntentResult {
  const normalised = normaliseArabic(question).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const padded = ` ${normalised} `;
  const methods = detectMethods(question);
  const posting = ['منشور', 'بوست', 'post', 'draft', 'صياغه'].some(word => padded.includes(` ${word} `));
  const comparing =
    methods.length >= 2 &&
    ['فرق', 'قارن', 'مقارنه', 'difference', 'compare', 'versus', 'vs', 'between'].some(word =>
      padded.includes(` ${word} `)
    );

  for (const rule of RULES) {
    if (rule.any.some(phrase => hasPhrase(padded, phrase))) {
      return { intent: rule.intent, methods, comparing: comparing || rule.intent === 'compare', posting };
    }
  }
  return { intent: 'definition', methods, comparing, posting };
}

/** A short label for the topic, used in an answer's opening line. */
export function topicLabel(question: string, methods: NdtMethod[], language: 'ar' | 'en'): string {
  if (methods.length === 1) return language === 'ar' ? methods[0].ar : methods[0].en;
  if (methods.length > 1) {
    const codes = methods.map(method => (language === 'ar' ? method.ar : method.en));
    return codes.join(language === 'ar' ? ' و' : ' / ');
  }
  const trimmed = question.replace(/[?؟.]+$/g, '').trim();
  return trimmed.length > 70 ? `${trimmed.slice(0, 67)}…` : trimmed;
}
