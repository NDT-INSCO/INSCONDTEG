/**
 * The four service families the corporate site sells, and the anchors that make
 * each one shareable (`#services/ndt` …).
 *
 * Everything here is derived from data the company already publishes in
 * `inscoCompanyData.ts`; nothing is invented. The family page exists so a
 * procurement engineer can send one link ("our UT/PAUT scope") instead of
 * "scroll to the services section".
 */
export type ServiceFamilyId = 'ndt' | 'pwht' | 'materials' | 'quality';

export const SERVICE_FAMILY_IDS: readonly ServiceFamilyId[] = ['ndt', 'pwht', 'materials', 'quality'];

export interface Bilingual {
  ar: string;
  en: string;
}

export interface ServiceFamily {
  id: ServiceFamilyId;
  title: Bilingual;
  short: Bilingual;
  description: Bilingual;
  /** Ids from `INSCO_COMPANY_DATA.ndtMethods`. */
  methodIds: string[];
  /** Ids from `INSCO_COMPANY_DATA.services` (welding, QA/QC rental …). */
  companyServiceIds?: string[];
  bullets: Bilingual[];
  /** Value of the RFQ `serviceType` select, so the form opens pre-filled. */
  rfqServiceType: string;
  /** Where the demo page proves the capability, if it can. */
  demoAnchorId?: string;
  /** Academy tab with the matching training lab. */
  academyTab?: string;
}

export const SERVICE_FAMILIES: ServiceFamily[] = [
  {
    id: 'ndt',
    title: {
      ar: 'الفحص غير الإتلافي (NDT Inspection)',
      en: 'Non-Destructive Testing (NDT Inspection)',
    },
    short: { ar: 'طرق فحص حجمية وسطحية', en: 'Volumetric and surface testing' },
    description: {
      ar: 'كشف الانقطاعات وقياس السماكة دون إتلاف الأصل. يتحدد الإجراء والمعدات والتأهيل المطلوب طبقاً لنطاق المشروع.',
      en: 'Flaw detection and thickness surveying without damaging the asset. Procedure, equipment and qualifications depend on the project scope.',
    },
    methodIds: ['ut', 'paut', 'rt', 'mt', 'pt', 'vt'],
    bullets: [
      { ar: 'طرق حجمية وسطحية تبعاً لنطاق الفحص', en: 'Volumetric and surface methods suited to the inspection scope' },
      { ar: 'تُراجع قوالب وسجلات المعايرة مع الفريق الفني', en: 'Review calibration blocks and records with the technical team' },
      { ar: 'يلزم التحقق من نطاق الترخيص قبل أي عمل إشعاعي', en: 'Confirm the applicable licence scope before radiography' },
    ],
    rfqServiceType: 'ut_paut',
    demoAnchorId: 'ultrasonic-lab',
    academyTab: 'rt_lab',
  },
  {
    id: 'pwht',
    title: {
      ar: 'المعالجة الحرارية بعد اللحام (PWHT)',
      en: 'Post-Weld Heat Treatment (PWHT)',
    },
    short: { ar: 'معالجة حرارية موضعية للوصلات', en: 'Local heat treatment for welds' },
    description: {
      ar: 'إزالة الإجهادات المتبقية وخفض صلادة منطقة اللحام و HAZ بدورات تسخين ومكوث وتبريد مضبوطة كودياً، مع رسوم بيانية موثّقة لكل وصلة.',
      en: 'Residual stress relief and HAZ hardness control with code-compliant ramp/soak/cool cycles and a documented chart for every joint.',
    },
    methodIds: [],
    companyServiceIds: ['pwht_service'],
    bullets: [
      { ar: 'راجع سجل المعدات وأكّد التوافر للمشروع', en: 'Check the equipment register and confirm availability for the project' },
      { ar: 'متحكمات 6/12 قناة ومزدوجات حرارية؛ اطلب سجلات المعايرة', en: '6/12-channel controllers and thermocouples; ask for calibration records' },
      { ar: 'أكواد ASME B31.3 · AWS D10.10 · API 537 · ASME VIII UW-40', en: 'ASME B31.3 · AWS D10.10 · API 537 · ASME VIII UW-40' },
    ],
    rfqServiceType: 'pwht',
    demoAnchorId: 'pwht-simulator',
    academyTab: 'pwht_curve',
  },
  {
    id: 'materials',
    title: {
      ar: 'تحليل المواد والصلادة (Material Testing & PMI)',
      en: 'Material Testing & PMI',
    },
    short: { ar: 'مطابقة السبائك وقياس الصلادة ميدانياً', en: 'Alloy identification and field hardness' },
    description: {
      ar: 'التحقق من مطابقة السبيكة للكود قبل التركيب، وقياس صلادة المنطقة المتأثرة بالحرارة للتحقق من نجاح المعالجة الحرارية.',
      en: 'Verify alloy conformance before installation, and measure HAZ hardness to confirm a heat treatment actually worked.',
    },
    methodIds: ['pmi', 'ht', 'sr'],
    bullets: [
      { ar: 'تحليل كيميائي فوري غير إتلافي للسبائك', en: 'Instant non-destructive alloy chemistry' },
      { ar: 'تحقق من نتائج PWHT بقياس صلادة HAZ', en: 'PWHT verification through HAZ hardness measurement' },
      { ar: 'قياس خشونة وبروفايل السطح قبل الطلاء', en: 'Surface profile and roughness before coating' },
    ],
    rfqServiceType: 'pmi_hardness',
    academyTab: 'methods',
  },
  {
    id: 'quality',
    title: {
      ar: 'خدمات الجودة والضغط والتأهيل (Quality & Technical Services)',
      en: 'Quality, Pressure & Technical Services',
    },
    short: { ar: 'ضغط هيدروستاتيكي، دهانات، توريد أطقم', en: 'Hydrostatic, coatings, crew supply' },
    description: {
      ar: 'إثبات السلامة الإنشائية بالضغط، وحماية الأسطح من التآكل، وتوريد أطقم لحام وتفتيش مؤهلة تعمل تحت إجراءات QC/QA موثّقة.',
      en: 'Structural integrity proof by pressure, corrosion protection of surfaces, and qualified welding/inspection crews working under documented QC/QA procedures.',
    },
    methodIds: ['hydro', 'pc'],
    companyServiceIds: ['welding_manpower', 'qc_qa_rental'],
    bullets: [
      { ar: 'اختبار ضغط هيدروستاتيكي بضغوط عالية', en: 'High-pressure hydrostatic testing' },
      { ar: 'تفتيش دهانات وطلاءات واقية', en: 'Protective coating inspection' },
      { ar: 'تأهيل اللحامين وإجراءات WPS/PQR حسب العقد', en: 'Confirm welder qualifications and WPS/PQR for the contract' },
    ],
    rfqServiceType: 'mt_pt',
    academyTab: 'standards',
  },
];

export function serviceFamilyById(id: string): ServiceFamily | undefined {
  return SERVICE_FAMILIES.find(family => family.id === id);
}

/** `#services/ndt` → `'ndt'`; anything else → `undefined`. */
export function readServiceFamilyHash(hash: string): ServiceFamilyId | undefined {
  const match = /^#services\/([a-z]+)$/i.exec(hash.trim());
  if (!match) return undefined;
  const id = match[1].toLowerCase();
  return SERVICE_FAMILY_IDS.includes(id as ServiceFamilyId) ? (id as ServiceFamilyId) : undefined;
}

export function serviceFamilyHash(id: ServiceFamilyId): string {
  return `#services/${id}`;
}
