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
    short: { ar: '12 طريقة فحص حجمية وسطحية', en: '12 volumetric and surface methods' },
    description: {
      ar: 'كشف العيوب وقياس السماكة دون إتلاف الأصل، بأجهزة مملوكة ومعايرة، وفريق معتمد ASNT / ISO 9712 Level II، وتوثيق كودي قابل للمراجعة.',
      en: 'Flaw detection and thickness surveying without damaging the asset — owned calibrated equipment, ASNT / ISO 9712 Level II crews and auditable code-based reporting.',
    },
    methodIds: ['ut', 'paut', 'rt', 'mt', 'pt', 'vt', 'mfl_ec'],
    bullets: [
      { ar: 'تغطية كاملة للطرق الحجمية والسطحية تحت نظام إدارة واحد', en: 'Full volumetric and surface coverage under one management system' },
      { ar: 'قوالب معايرة V1/V2 وسجلات معايرة NIS متتبعة', en: 'V1/V2 calibration blocks and NIS-traceable calibration records' },
      { ar: 'ترخيص ENRRA LS.0112 للتصوير الإشعاعي حتى 100 Ci', en: 'ENRRA licence LS.0112 for radiography up to 100 Ci' },
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
    short: { ar: '16 وحدة أوتوماتيكية 65 kW مملوكة', en: '16 owned 65 kW automatic units' },
    description: {
      ar: 'إزالة الإجهادات المتبقية وخفض صلادة منطقة اللحام و HAZ بدورات تسخين ومكوث وتبريد مضبوطة كودياً، مع رسوم بيانية موثّقة لكل وصلة.',
      en: 'Residual stress relief and HAZ hardness control with code-compliant ramp/soak/cool cycles and a documented chart for every joint.',
    },
    methodIds: [],
    companyServiceIds: ['pwht_service'],
    bullets: [
      { ar: '16 وحدة 65 kW مخزنة بالقاهرة وجاهزة للاستنفار', en: '16 × 65 kW units stored in Cairo, ready to mobilise' },
      { ar: 'متحكمات 6/12 قناة ومزدوجات حرارية معتمدة', en: '6/12-channel controllers with certified thermocouples' },
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
      { ar: 'لحامون مؤهلون على WPS/PQR وإشراف IRCA', en: 'WPS/PQR-qualified welders under IRCA supervision' },
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
