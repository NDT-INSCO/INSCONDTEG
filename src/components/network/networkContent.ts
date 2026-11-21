/**
 * The content of the network prototype — structure, never people.
 *
 * The addendum is explicit: no invented members, posts or jobs may be presented
 * as real. So nothing here pretends to be a person. Every entry is a *template*
 * that shows how one card is composed (author header, discipline, body, actions)
 * and is labelled as such in the UI — `sample: true` travels with the data, so a
 * card cannot be rendered without its "نموذج توضيحي" badge.
 */

export type NetworkDiscipline =
  | 'ndt'
  | 'ut_paut'
  | 'rt_dr'
  | 'surface'
  | 'welding'
  | 'pwht'
  | 'qa_qc'
  | 'materials'
  | 'pipeline'
  | 'safety';

export const NETWORK_DISCIPLINES: {
  id: NetworkDiscipline;
  ar: string;
  en: string;
  /** The method codes a member of this discipline actually works with. */
  codes: string;
}[] = [
  { id: 'ndt', ar: 'الفحص غير الإتلافي', en: 'NDT (general)', codes: 'ASNT · ISO 9712' },
  { id: 'ut_paut', ar: 'الموجات فوق الصوتية والمصفوفات', en: 'UT / PAUT / TOFD', codes: 'ASME V Art. 4 · 5' },
  { id: 'rt_dr', ar: 'التصوير الإشعاعي والرقمي', en: 'RT / DR', codes: 'ASME V Art. 2 · EN 14784' },
  { id: 'surface', ar: 'الفحوصات السطحية', en: 'MT / PT / VT', codes: 'ASME V Art. 6 · 7 · 9' },
  { id: 'welding', ar: 'فحص اللحام', en: 'Welding inspection', codes: 'AWS D1.1 · ASME IX' },
  { id: 'pwht', ar: 'المعالجة الحرارية بعد اللحام', en: 'PWHT', codes: 'AWS D10.10 · ASME B31.3' },
  { id: 'qa_qc', ar: 'ضبط وضمان الجودة', en: 'QA / QC', codes: 'ISO 9001 · ITP' },
  { id: 'materials', ar: 'التآكل والمواد', en: 'Corrosion & materials', codes: 'NACE · PMI' },
  { id: 'pipeline', ar: 'فحص وخطوط الأنابيب', en: 'Pipeline inspection', codes: 'API 1104 · B31.4/8' },
  { id: 'safety', ar: 'السلامة الصناعية', en: 'Industrial safety', codes: 'HSE · ISO 45001' },
];

export function disciplineLabel(id: NetworkDiscipline, language: 'ar' | 'en'): string {
  const found = NETWORK_DISCIPLINES.find(item => item.id === id);
  return found ? found[language] : id;
}

export interface NetworkGroupTemplate {
  slug: string;
  ar: string;
  en: string;
  discipline: NetworkDiscipline;
  membersAr: string;
  membersEn: string;
  rulesAr: string;
  rulesEn: string;
}

/** Group definitions from the addendum; membership counts stay empty until a backend exists. */
export const NETWORK_GROUPS: NetworkGroupTemplate[] = [
  { slug: 'ndt-professionals', ar: 'مهنيو الفحص غير الإتلافي', en: 'NDT Professionals', discipline: 'ndt', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'سؤال فني واضح · لا إعلانات تجارية · مرجع الكود مطلوب', rulesEn: 'A clear technical question · no advertising · cite the code' },
  { slug: 'ultrasonic', ar: 'الموجات فوق الصوتية', en: 'Ultrasonic Testing', discipline: 'ut_paut', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'أرفق معايرة الجهاز ومنحنى DAC/TCG', rulesEn: 'Attach the instrument calibration and the DAC/TCG curve' },
  { slug: 'paut-tofd', ar: 'المصفوفات و TOFD', en: 'PAUT & TOFD', discipline: 'ut_paut', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'حدّد البروب والزاوية وقانون التركيز', rulesEn: 'State the probe, angle and focal law' },
  { slug: 'radiography', ar: 'التصوير الإشعاعي', en: 'Radiographic Testing', discipline: 'rt_dr', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'لا صور مصدر مشع · الالتزام بتراخيص ENRRA', rulesEn: 'No source photographs · ENRRA licensing applies' },
  { slug: 'welding-inspection', ar: 'فحص اللحام', en: 'Welding Inspection', discipline: 'welding', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'وضّح WPS/PQR والكود المرجعي', rulesEn: 'Name the WPS/PQR and the reference code' },
  { slug: 'pwht', ar: 'المعالجة الحرارية PWHT', en: 'PWHT Professionals', discipline: 'pwht', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'أرفق منحنى التسخين والتبريد', rulesEn: 'Attach the heating and cooling curve' },
  { slug: 'qa-qc', ar: 'مهندسو الجودة', en: 'QA/QC Engineers', discipline: 'qa_qc', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'اذكر خطة الفحص ITP والمواصفة', rulesEn: 'Cite the ITP and the specification' },
  { slug: 'corrosion-materials', ar: 'التآكل والمواد', en: 'Corrosion & Materials', discipline: 'materials', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'حدّد السبيكة والوسط والظروف', rulesEn: 'State the alloy, the medium and the conditions' },
  { slug: 'pipeline', ar: 'فحص خطوط الأنابيب', en: 'Pipeline Inspection', discipline: 'pipeline', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'اذكر API 1104/B31.8 والقطاع', rulesEn: 'Name API 1104/B31.8 and the segment' },
  { slug: 'industrial-engineering', ar: 'الهندسة الصناعية', en: 'Industrial Engineering', discipline: 'safety', membersAr: 'تُعرض بعد ربط الخادم', membersEn: 'Shown once the backend is connected', rulesAr: 'اربط النقاش بالتشغيل والصيانة', rulesEn: 'Tie the discussion to operations and maintenance' },
];

export interface NetworkJobTemplate {
  id: string;
  sample: true;
  ar: string;
  en: string;
  discipline: NetworkDiscipline;
  requirementAr: string;
  requirementEn: string;
  metaAr: string;
  metaEn: string;
}

export const NETWORK_JOB_TEMPLATES: NetworkJobTemplate[] = [
  { id: 'job-rt-2', sample: true, ar: 'قالب وظيفة: مفتش RT — المستوى II', en: 'Job template: RT inspector — Level II', discipline: 'rt_dr', requirementAr: 'شهادة RT II · ترخيص إشعاعي · خبرة موقعية', requirementEn: 'RT II certificate · radiation licence · site experience', metaAr: 'المكان والمدة والجهة تُملأ عند ربط الخادم', metaEn: 'Location, duration and organisation are filled once the backend is connected' },
  { id: 'job-paut-3', sample: true, ar: 'قالب وظيفة: مفتش PAUT — المستوى II/III', en: 'Job template: PAUT inspector — Level II/III', discipline: 'ut_paut', requirementAr: 'PAUT II · TOFD · ASME V', requirementEn: 'PAUT II · TOFD · ASME V', metaAr: 'المكان والمدة والجهة تُملأ عند ربط الخادم', metaEn: 'Location, duration and organisation are filled once the backend is connected' },
  { id: 'job-qa-site', sample: true, ar: 'قالب وظيفة: مهندس QA/QC في موقع', en: 'Job template: site QA/QC engineer', discipline: 'qa_qc', requirementAr: 'ISO 9001 · ITP · تقارير فحص', requirementEn: 'ISO 9001 · ITP · inspection reporting', metaAr: 'المكان والمدة والجهة تُملأ عند ربط الخادم', metaEn: 'Location, duration and organisation are filled once the backend is connected' },
];

export interface NetworkArticleTemplate {
  id: string;
  sample: true;
  ar: string;
  en: string;
  discipline: NetworkDiscipline;
  noteAr: string;
  noteEn: string;
}

export const NETWORK_ARTICLE_TEMPLATES: NetworkArticleTemplate[] = [
  { id: 'art-dac', sample: true, ar: 'قالب مقال: بناء منحنى DAC من V1/V2', en: 'Article template: building a DAC curve from V1/V2', discipline: 'ut_paut', noteAr: 'يُربَط تلقائياً بدرس الأكاديمية ذي الصلة', noteEn: 'Links to the matching academy lesson' },
  { id: 'art-pwht', sample: true, ar: 'قالب مقال: قراءة منحنى PWHT المسجّل', en: 'Article template: reading a recorded PWHT chart', discipline: 'pwht', noteAr: 'يُربَط بمحاكي مهم', noteEn: 'Links to the matching simulator' },
  { id: 'art-film', sample: true, ar: 'قالب مقال: كثافة الفيلم و Ug في RT', en: 'Article template: film density and Ug in RT', discipline: 'rt_dr', noteAr: 'يُربَط بمعمل RT', noteEn: 'Links to the RT lab' },
];

export interface NetworkEventTemplate {
  id: string;
  sample: true;
  ar: string;
  en: string;
  kindAr: string;
  kindEn: string;
}

export const NETWORK_EVENT_TEMPLATES: NetworkEventTemplate[] = [
  { id: 'ev-workshop', sample: true, ar: 'قالب فعالية: ورشة عملية على PAUT', en: 'Event template: a hands-on PAUT workshop', kindAr: 'ورشة عمل', kindEn: 'Workshop' },
  { id: 'ev-webinar', sample: true, ar: 'قالب فعالية: ندوة عن أكواد ASME', en: 'Event template: an ASME codes webinar', kindAr: 'ندوة', kindEn: 'Seminar' },
  { id: 'ev-conf', sample: true, ar: 'قالب فعالية: مؤتمر الجودة الصناعية', en: 'Event template: industrial quality conference', kindAr: 'مؤتمر', kindEn: 'Conference' },
];

export interface NetworkOrgTemplate {
  id: string;
  sample: true;
  ar: string;
  en: string;
  sectorAr: string;
  sectorEn: string;
}

export const NETWORK_ORG_TEMPLATES: NetworkOrgTemplate[] = [
  { id: 'org-insco', sample: true, ar: 'صفحة إنسكو المؤسسية', en: 'The INSCO organisation page', sectorAr: 'NDT · PWHT · فحص اللحام', sectorEn: 'NDT · PWHT · welding inspection' },
  { id: 'org-contractor', sample: true, ar: 'قالب صفحة مقاول عام', en: 'General-contractor page template', sectorAr: 'مشروعات الطاقة والصناعة', sectorEn: 'Power and industrial projects' },
  { id: 'org-lab', sample: true, ar: 'قالب صفحة معمل فحص', en: 'Inspection-laboratory page template', sectorAr: 'مختبرات وفحص مستقل', sectorEn: 'Laboratories and third-party inspection' },
];

/** The four professional states of INSCO Verified Professional. */
export const NETWORK_VERIFICATION_LEVELS: {
  id: string;
  ar: string;
  en: string;
  meaningAr: string;
  meaningEn: string;
  accent: string;
}[] = [
  {
    id: 'member',
    ar: 'حساب مهني',
    en: 'Professional account',
    meaningAr: 'بريد مؤكَّد ومسمّى وتخصص — لا يُدّعى أي تحقق من الشهادات.',
    meaningEn: 'A confirmed email, a headline and a discipline — no credential claim is made.',
    accent: 'border-slate-600 text-slate-300',
  },
  {
    id: 'identity',
    ar: 'هوية مُتحقَّقة',
    en: 'Identity verified',
    meaningAr: 'التحقق من الشخص نفسه (هوية/جهة عمل)، منفصل تماماً عن الشهادات.',
    meaningEn: 'The person is verified (identity or employer), entirely separate from certificates.',
    accent: 'border-cyan-500/50 text-cyan-300',
  },
  {
    id: 'credential',
    ar: 'مؤهل مُتحقَّق',
    en: 'Credential verified',
    meaningAr: 'راجعنا شهادة ASNT/ISO 9712 مع جهة الإصدار — تُعرض الشارة بجانب تلك الشهادة فقط.',
    meaningEn: 'An ASNT/ISO 9712 certificate was checked with the issuing body — the badge sits beside that certificate only.',
    accent: 'border-emerald-500/50 text-emerald-300',
  },
  {
    id: 'expert',
    ar: 'خبير تقني',
    en: 'Technical expert',
    meaningAr: 'خبرة موثّقة ومشاركات مُراجَعة — لا يُمنح تلقائياً بعدد المنشورات.',
    meaningEn: 'Documented experience and reviewed contributions — never granted automatically by post count.',
    accent: 'border-amber-500/50 text-amber-300',
  },
];
