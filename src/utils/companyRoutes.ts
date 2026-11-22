/** Shareable company destinations. Older section hashes still reach the same tools. */
export const COMPANY_DETAILS = {
  about: { ar: 'عن إنسكو', en: 'About INSCO', hash: 'about', anchors: ['industries'] },
  services: { ar: 'الخدمات الفنية', en: 'Technical services', hash: 'services', anchors: ['ndt-methods-catalog', 'services-regional-map'] },
  equipment: { ar: 'المعدات والمعايرة', en: 'Equipment & calibration', hash: 'fleet-inspector', anchors: ['capabilities'] },
  quality: { ar: 'الجودة والشهادات', en: 'Quality & certifications', hash: 'certifications', anchors: ['standards-matrix'] },
  projects: { ar: 'المشروعات وسابقة الأعمال', en: 'Projects & experience', hash: 'projects', anchors: ['testimonials'] },
  dossier: { ar: 'ملف التأهيل', en: 'Vendor dossier', hash: 'vault', anchors: ['vendor'] },
  quote: { ar: 'طلب عرض سعر والتواصل', en: 'Quotes & contact', hash: 'rfq', anchors: ['contact', 'quick-actions', 'cost-estimator'] },
  field: { ar: 'أدوات المفتش والحضور', en: 'Inspector tools & attendance', hash: 'inspector-qr-access', anchors: ['field-attendance-timeline'] },
  privacy: { ar: 'خصوصية الحساب', en: 'Account privacy', hash: 'privacy', anchors: [] },
} as const;

export type CompanyDetailId = keyof typeof COMPANY_DETAILS;

const hashes = new Map<string, CompanyDetailId>();
for (const key of Object.keys(COMPANY_DETAILS) as CompanyDetailId[]) {
  const { hash, anchors } = COMPANY_DETAILS[key];
  for (const anchor of [hash, ...anchors]) hashes.set(anchor, key);
}

export function companyDetailForHash(hash: string): CompanyDetailId | undefined {
  return hashes.get(hash);
}

const DEMO_ANCHORS = ['inspection-showcase', 'hologram-lab', 'pwht-simulator', 'radiography-viewer', 'ultrasonic-lab'] as const;
export type CompanyDemoAnchor = (typeof DEMO_ANCHORS)[number];

export function isCompanyDemoAnchor(value: string): value is CompanyDemoAnchor {
  return (DEMO_ANCHORS as readonly string[]).includes(value);
}
