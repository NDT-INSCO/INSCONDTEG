import { geoArea, geoDistance } from 'd3';
import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson';

export type RegionalSiteCategory = 'fleet_hub' | 'power' | 'industrial' | 'oil_gas';

export type RegionalViewportPresetId = 'all_footprint' | 'egypt_grid' | 'delta_canal' | 'cairo_hub';

export interface RegionalViewportPreset {
  id: RegionalViewportPresetId;
  label: { ar: string; en: string };
  center: [number, number]; // [lng, lat]
  scale: number;
  graticuleStep: [number, number];
}

export interface RegionalSiteNode {
  id: string;
  code: string;
  name: { ar: string; en: string };
  shortName: { ar: string; en: string };
  location: { ar: string; en: string };
  countryCode: 'EG' | 'YE' | 'AF';
  coordinates: [number, number]; // [lng, lat]
  category: RegionalSiteCategory;
  client: string;
  pwhtUnitsAllocated: number;
  pwhtRoleLabel: { ar: string; en: string };
  serialAllocation?: string;
  ndtMethods: string[];
  governingCodes: string[];
  status: 'hub_24_7' | 'active_reference' | 'international_completed';
  dispatchWindow: { ar: string; en: string };
  evidenceRef?: string;
  scopeSummary: { ar: string; en: string };
}

/** Coordinates of INSCO's Giza Central PWHT Fleet Works (Abu El-Nomros, Giza 12911) */
export const GIZA_DEPOT_COORDINATES: [number, number] = [31.205, 29.905];

export const TOTAL_OWNED_PWHT_UNITS = 16;
export const UNIT_POWER_KW = 65;

export const REGIONAL_VIEWPORT_PRESETS: RegionalViewportPreset[] = [
  {
    id: 'egypt_grid',
    label: { ar: 'الشبكة القومية (مصر)', en: 'Egypt National Grid' },
    center: [31.15, 29.75],
    scale: 4300,
    graticuleStep: [1, 1],
  },
  {
    id: 'delta_canal',
    label: { ar: 'الدلتا وقناة السويس', en: 'Nile Delta & Suez' },
    center: [31.2, 30.65],
    scale: 8200,
    graticuleStep: [1, 1],
  },
  {
    id: 'cairo_hub',
    label: { ar: 'مركز القاهرة والجيزة', en: 'Greater Cairo Hub' },
    center: [31.28, 30.02],
    scale: 18500,
    graticuleStep: [0.5, 0.5],
  },
  {
    id: 'all_footprint',
    label: { ar: 'الانتشار الإقليمي والدولي', en: 'Regional & International' },
    center: [48.5, 25.8],
    scale: 860,
    graticuleStep: [5, 5],
  },
];

export const INSCO_REGIONAL_SITES: RegionalSiteNode[] = [
  {
    id: 'giza-fleet-depot',
    code: 'HUB-GZ',
    name: {
      ar: 'مجمع الورش ومخازن أسطول PWHT المركزي — أبو النمرس',
      en: 'Central PWHT Fleet Depot & Calibration Works — Giza',
    },
    shortName: { ar: 'مخازن الأسطول (الجيزة)', en: 'Giza 16-Unit Depot' },
    location: { ar: 'شارع الجلاء، أبو النمرس، الجيزة 12911', en: 'Abu El-Nomros, Giza 12911, Egypt' },
    countryCode: 'EG',
    coordinates: GIZA_DEPOT_COORDINATES,
    category: 'fleet_hub',
    client: 'INSCO 100% Owned Asset Base',
    pwhtUnitsAllocated: 2,
    pwhtRoleLabel: {
      ar: 'المقر اللوجستي لـ 16 وحدة 65 kW (وحدتان احتياط طوارئ 24/7)',
      en: 'Home base of all 16 × 65 kW units (2 rapid-dispatch standby units)',
    },
    serialAllocation: 'INS-PWHT-01 – INS-PWHT-16 (Standby: 15–16)',
    ndtMethods: ['UT', 'PAUT', 'RT', 'MT', 'PT', 'PMI', 'HT', 'HYDRO'],
    governingCodes: ['ISO 9001:2015', 'NIS Traceable Calibration', 'ENRRA LS.0112'],
    status: 'hub_24_7',
    dispatchWindow: { ar: 'جاهزية تحرك فورية 24/7', en: 'Immediate 24/7 Dispatch Base' },
    evidenceRef: 'CR 209632 · Annex C-01 & D-02',
    scopeSummary: {
      ar: 'مركز التخزين والمعايرة والصيانة الدورية لكامل أسطول إنسكو المملوك (16 ماكينة 65 kW أوتوماتيكية، مبرمجات 6 قنوات، وسخانات سيراميكية مرنة) لضمان التحرك الفوري لأي موقع دون انتظار سوق الإيجار.',
      en: 'Primary staging, NIS calibration, and maintenance hub housing INSCO’s 16 company-owned 65 kW automatic PWHT units, 6-channel strip chart programmers, and flexible ceramic heating pads.',
    },
  },
  {
    id: 'cairo-hq',
    code: 'HQ-CAI',
    name: {
      ar: 'المقر الرئيسي وإدارة توكيد الجودة — المعادي',
      en: 'Corporate Headquarters & QA/QC Command — Maadi, Cairo',
    },
    shortName: { ar: 'المقر الرئيسي (المعادي)', en: 'Cairo HQ (Maadi)' },
    location: { ar: 'مشروع اللاسلكي، الأوتوستراد، المعادي، القاهرة', en: 'Autostrade Way, Maadi, Cairo, Egypt' },
    countryCode: 'EG',
    coordinates: [31.278, 29.968],
    category: 'fleet_hub',
    client: 'INSCO Corporate & CQI-IRCA Audit Office',
    pwhtUnitsAllocated: 0,
    pwhtRoleLabel: {
      ar: 'غرفة عمليات الجدولة واعتماد مخططات PWHT و ITP',
      en: 'Central PWHT thermal chart review, ITP & QA/QC command',
    },
    ndtMethods: ['VT', 'UT', 'PAUT', 'RT', 'PMI', 'HT'],
    governingCodes: ['ISO 9001 / 14001 / 45001', 'CQI-IRCA Cert #121', 'ASME Sec. V'],
    status: 'hub_24_7',
    dispatchWindow: { ar: 'إدارة هندسية مركزية', en: 'Central Engineering Control' },
    evidenceRef: 'Annex A-01 to A-04 · EGAC CAB #120007',
    scopeSummary: {
      ar: 'الإدارة الهندسية العليا ومكتب كبير مدققي الجودة CQI-IRCA لإصدار خطط الفحص والاختبار ITP، مراجعة مخططات المعالجة الحرارية Strip Charts، وإدارة التراخيص الإشعاعية ENRRA.',
      en: 'Executive engineering office led by in-house CQI-IRCA Lead Auditor overseeing ITP approvals, ASME/AWS thermal chart sign-off, and ENRRA radiation safety compliance.',
    },
  },
  {
    id: 'burullus-ccpp',
    code: 'EG-BRL',
    name: {
      ar: 'محطة كهرباء البرلس ذات الدورة المركبة 4800 MW',
      en: 'El-Burullus 4,800 MW Mega Combined-Cycle Power Plant',
    },
    shortName: { ar: 'محطة البرلس 4800 MW', en: 'Burullus 4,800 MW CCPP' },
    location: { ar: 'البرلس، كفر الشيخ — الساحل الشمالي', en: 'Burullus, Kafr El-Sheikh, Egypt' },
    countryCode: 'EG',
    coordinates: [30.968, 31.582],
    category: 'power',
    client: 'ORASCOM Construction / SIEMENS AG',
    pwhtUnitsAllocated: 4,
    pwhtRoleLabel: {
      ar: 'تشغيل 4 وحدات 65 kW أوتوماتيكية (قدرة 260 kVA)',
      en: '4 × 65 kW Automatic PWHT Units Allocated (260 kVA)',
    },
    serialAllocation: 'INS-PWHT-01 – INS-PWHT-04',
    ndtMethods: ['PAUT', 'RT', 'UT', 'MT', 'PT', 'HT'],
    governingCodes: ['ASME B31.1', 'ASME Sec. V Art. 4', 'AWS D10.10'],
    status: 'active_reference',
    dispatchWindow: { ar: 'زمن استنفار: 3.5 ساعات من الجيزة', en: '3.5 hr road dispatch from Giza' },
    evidenceRef: 'Annex E-06 (Orascom) & Annex E-12 (Siemens)',
    scopeSummary: {
      ar: 'أعمال التسخين المبدئي والمعالجة الحرارية PWHT لخطوط البخار عالي الضغط P91/P22 والفحص بالمصفوفات الطورية PAUT والتصوير الإشعاعي للخزانات والغلايات.',
      en: 'High-pressure alloy steam piping (P91/P22) pre-heating and PWHT cycles alongside encoded Phased Array UT, X-ray RT, MT, and PT under Siemens/Orascom QA.',
    },
  },
  {
    id: 'ayoun-mousa-suez',
    code: 'EG-AYM',
    name: {
      ar: 'محطة توليد كهرباء عيون موسى البخارية — السويس',
      en: 'Ayoun Mousa Steam Power Station — Gulf of Suez',
    },
    shortName: { ar: 'محطة عيون موسى (السويس)', en: 'Ayoun Mousa Plant (Suez)' },
    location: { ar: 'عيون موسى، السويس / جنوب سيناء', en: 'Ayoun Mousa, Suez, Egypt' },
    countryCode: 'EG',
    coordinates: [32.652, 29.872],
    category: 'power',
    client: 'MARIDIVE Offshore & AIC / SIEMENS',
    pwhtUnitsAllocated: 2,
    pwhtRoleLabel: {
      ar: 'تشغيل وحدتين 65 kW للمراجل وخطوط البخار',
      en: '2 × 65 kW Automatic PWHT Units Allocated (130 kVA)',
    },
    serialAllocation: 'INS-PWHT-05 – INS-PWHT-06',
    ndtMethods: ['UT', 'RT', 'MT', 'PT', 'HT'],
    governingCodes: ['ASME Sec. I & VIII', 'ASME B31.3', 'ASTM A956'],
    status: 'active_reference',
    dispatchWindow: { ar: 'زمن استنفار: 2.5 ساعة عبر محور السويس', en: '2.5 hr dispatch via Suez corridor' },
    evidenceRef: 'Verified Facility Track Record',
    scopeSummary: {
      ar: 'معالجات حرارية بعد اللحام PWHT وفحوصات غير إتلافية بحرية وبرية لمراجل التوليد وأنابيب البخار عالية الضغط بالمدخل الشمالي لخليج السويس.',
      en: 'Onshore and marine NDT inspections alongside automated 6-channel PWHT stress relieving on high-pressure boiler headers and steam lines.',
    },
  },
  {
    id: 'talkha-power',
    code: 'EG-TLK',
    name: {
      ar: 'محطة توليد كهرباء طلخا المركبة — الدقهلية',
      en: 'Talkha Combined-Cycle Power Station — Dakahlia',
    },
    shortName: { ar: 'محطة كهرباء طلخا', en: 'Talkha Power Station' },
    location: { ar: 'طلخا / المنصورة، محافظة الدقهلية', en: 'Talkha, Dakahlia, Nile Delta, Egypt' },
    countryCode: 'EG',
    coordinates: [31.378, 31.054],
    category: 'power',
    client: 'CMI Energy & ARESCO',
    pwhtUnitsAllocated: 2,
    pwhtRoleLabel: {
      ar: 'تشغيل وحدتين 65 kW لغلايات استرجاع الحرارة HRSG',
      en: '2 × 65 kW Automatic PWHT Units Allocated (130 kVA)',
    },
    serialAllocation: 'INS-PWHT-07 – INS-PWHT-08',
    ndtMethods: ['UT', 'RT', 'MT', 'PT', 'PMI', 'HT'],
    governingCodes: ['ASME Sec. I', 'ASME B31.1', 'AWS D10.10'],
    status: 'active_reference',
    dispatchWindow: { ar: 'زمن استنفار: 2.5 ساعة لوسط الدلتا', en: '2.5 hr dispatch to Central Delta' },
    evidenceRef: 'Brochure Facility & Fleet Record',
    scopeSummary: {
      ar: 'تنفيذ دورات المعالجة الحرارية المبرمجة وفحص سبائك PMI والصلادة والموجات فوق الصوتية لوصلات غلايات استرجاع الطاقة HRSG والتوربينات.',
      en: 'Programmed thermal stress-relieving cycles, alloy verification (PMI), UCI hardness testing, and volumetric UT/RT on HRSG boiler modules and turbine piping.',
    },
  },
  {
    id: 'kureimat-power',
    code: 'EG-KRM',
    name: {
      ar: 'محطة توليد كهرباء الكريمات — بني سويف',
      en: 'El-Kureimat Thermal & Solar-Combined Power Plant',
    },
    shortName: { ar: 'محطة الكريمات (بني سويف)', en: 'El-Kureimat Plant' },
    location: { ar: 'الكريمات، شمال بني سويف / جنوب الجيزة', en: 'El-Kureimat, Beni Suef Corridor, Egypt' },
    countryCode: 'EG',
    coordinates: [31.245, 29.278],
    category: 'power',
    client: 'CMI Energy & ARESCO',
    pwhtUnitsAllocated: 2,
    pwhtRoleLabel: {
      ar: 'تشغيل وحدتين 65 kW لخطوط التوربينات البخارية',
      en: '2 × 65 kW Automatic PWHT Units Allocated (130 kVA)',
    },
    serialAllocation: 'INS-PWHT-09 – INS-PWHT-10',
    ndtMethods: ['UT', 'RT', 'MT', 'PT', 'HT'],
    governingCodes: ['ASME B31.1', 'ASME Sec. V', 'ISO 17636'],
    status: 'active_reference',
    dispatchWindow: { ar: 'زمن استنفار: 1.5 ساعة عبر الأوتوستراد', en: '1.5 hr dispatch via Upper Nile Hwy' },
    evidenceRef: 'Brochure Facility Record',
    scopeSummary: {
      ar: 'معالجة حرارية موضعية PWHT وفحوصات إشعاعية وفوق صوتية لوصلات اللحام الحرجة بمحطة الكريمات على ممر الصعيد الصناعي.',
      en: 'Localized ceramic-pad PWHT soaking cycles and volumetric RT/UT weld verification across high-temperature power generation circuits.',
    },
  },
  {
    id: 'elsewedy-cairo',
    code: 'EG-SWD',
    name: {
      ar: 'مصانع السويدي إلكتريك للمحولات العملاقة — العاشر / القاهرة',
      en: 'Elsewedy Electric High-Voltage Transformer Works',
    },
    shortName: { ar: 'مصانع السويدي للمحولات', en: 'Elsewedy Transformer Works' },
    location: { ar: 'العاشر من رمضان / شرق القاهرة', en: '10th of Ramadan / East Cairo, Egypt' },
    countryCode: 'EG',
    coordinates: [31.742, 30.298],
    category: 'industrial',
    client: 'El Sewedy Electric (PO GM102473)',
    pwhtUnitsAllocated: 2,
    pwhtRoleLabel: {
      ar: 'تشغيل وحدتين 65 kW لإزالة إجهادات خزانات المحولات',
      en: '2 × 65 kW Automatic PWHT Units Allocated (130 kVA)',
    },
    serialAllocation: 'INS-PWHT-11 – INS-PWHT-12',
    ndtMethods: ['VT', 'UT', 'MT', 'PT', 'RT', 'HT', 'PC'],
    governingCodes: ['AWS D1.1', 'ASME Sec. VIII Div. 1', 'ASTM A956'],
    status: 'active_reference',
    dispatchWindow: { ar: 'زمن استنفار: 1.5 ساعة من الجيزة', en: '1.5 hr dispatch from Giza Works' },
    evidenceRef: 'Annex E-01 · Signed PO GM102473',
    scopeSummary: {
      ar: 'حزمة متكاملة من فحوصات VT, UT, MT, PT, RT واختبارات الصلادة بعد المعالجة الحرارية PWHT لهياكل وخزانات محولات القدرة العملاقة.',
      en: 'Full-scope VT, UT, MT, PT, RT, Leeb/UCI hardness testing, and PWHT stress relief on heavy structural power transformer tanks.',
    },
  },
  {
    id: 'october-power',
    code: 'EG-OCT',
    name: {
      ar: 'محطة توليد كهرباء 6 أكتوبر — غرب القاهرة',
      en: '6th of October Gas/Combined Power Station',
    },
    shortName: { ar: 'محطة كهرباء 6 أكتوبر', en: '6th of October Power Plant' },
    location: { ar: 'المنطقة الصناعية، مدينة 6 أكتوبر، الجيزة', en: '6th of October City, West Cairo, Egypt' },
    countryCode: 'EG',
    coordinates: [30.895, 29.932],
    category: 'power',
    client: 'PGESCO / GE — Orascom',
    pwhtUnitsAllocated: 1,
    pwhtRoleLabel: {
      ar: 'تخصيص وحدة 65 kW لخطوط الغاز وأوعية الضغط',
      en: '1 × 65 kW Automatic PWHT Unit Allocated (65 kVA)',
    },
    serialAllocation: 'INS-PWHT-13',
    ndtMethods: ['RT', 'UT', 'MT', 'PT', 'HYDRO', 'MFL / EC'],
    governingCodes: ['ASME B31.3', 'API 650', 'API 1104'],
    status: 'active_reference',
    dispatchWindow: { ar: 'زمن استنفار: 45 دقيقة من أبو النمرس', en: '45 min rapid dispatch from Giza' },
    evidenceRef: 'PGESCO / GE Client Track Record',
    scopeSummary: {
      ar: 'تنفيذ كافة فحوصات NDT على خطوط إمداد الوقود والغاز وخزانات الوقود وأوعية الضغط مع المعالجة الحرارية الموضعية.',
      en: 'Comprehensive pipeline, fuel storage tank, and pressure vessel NDT inspection alongside rapid-response localized PWHT.',
    },
  },
  {
    id: 'borg-el-arab',
    code: 'EG-BEA',
    name: {
      ar: 'مجمع مصانع الزيوت النباتية NVOC — برج العرب',
      en: 'NVOC Industrial Process Complex — Borg El-Arab',
    },
    shortName: { ar: 'مجمع برج العرب (الإسكندرية)', en: 'Borg El-Arab Plant (Alex)' },
    location: { ar: 'برج العرب الصناعية، الإسكندرية', en: 'Borg El-Arab, Alexandria, Egypt' },
    countryCode: 'EG',
    coordinates: [29.578, 30.884],
    category: 'industrial',
    client: 'PSEW / National Vegetable Oils Co. (NVOC)',
    pwhtUnitsAllocated: 1,
    pwhtRoleLabel: {
      ar: 'تخصيص وحدة 65 kW للأوعية الصناعية والمبادلات',
      en: '1 × 65 kW Automatic PWHT Unit Allocated (65 kVA)',
    },
    serialAllocation: 'INS-PWHT-14',
    ndtMethods: ['RT', 'UT', 'PT', 'MT', 'PAUT', 'SR'],
    governingCodes: ['ASME Sec. VIII', 'ASME B31.3', 'ISO 8503'],
    status: 'active_reference',
    dispatchWindow: { ar: 'زمن استنفار: 2.5 ساعة عبر صحراوي الإسكندرية', en: '2.5 hr dispatch via Desert Road' },
    evidenceRef: 'Brochure Industrial Client Record',
    scopeSummary: {
      ar: 'فحوصات RT, UT, PT, MT والمعالجة الحرارية بعد اللحام PWHT لأوعية التصنيع وخطوط البخار والمبادلات الحرارية ببرج العرب.',
      en: 'Process vessel and piping integrity package combining RT, UT, PAUT, PT, MT, and automated 65 kW PWHT thermal cycles.',
    },
  },
  {
    id: 'masila-yemen',
    code: 'INT-YEM',
    name: {
      ar: 'خطوط أنابيب بترول قطاع المسيلة — حضرموت، اليمن',
      en: 'Masila Block Cross-Country Oil Pipelines — R.O. Yemen',
    },
    shortName: { ar: 'قطاع المسيلة البترولي (اليمن)', en: 'Masila Oil Block (Yemen)' },
    location: { ar: 'حوض المسيلة، حضرموت، الجمهورية اليمنية', en: 'Masila Basin, Hadramout, Yemen' },
    countryCode: 'YE',
    coordinates: [49.15, 15.55],
    category: 'oil_gas',
    client: 'ADPC / PETROMASILA & ASPC',
    pwhtUnitsAllocated: 0,
    pwhtRoleLabel: {
      ar: 'بعثة فحص إشعاعي جاما وعوازل خطوط أنابيب بترولية',
      en: 'Expeditionary Gamma RT & Pipeline Holiday Testing Crew',
    },
    ndtMethods: ['RT', 'PC', 'VT', 'UT'],
    governingCodes: ['API 1104', 'NACE SP0188', 'ASME Sec. V Art. 2'],
    status: 'international_completed',
    dispatchWindow: { ar: 'تعبئة دولية عبر الشحن الجوي/البحري', en: 'Cross-border air/sea mobilization' },
    evidenceRef: 'PetroMasila Regional Track Record',
    scopeSummary: {
      ar: 'حملات فحص إشعاعي بمصادر جاما (Ir-192) واختبار عوازل الطلاء بالشرر عالي الجهد Holiday لخطوط نقل النفط الخام بقطاع المسيلة.',
      en: 'Cross-border oilfield pipeline radiography (Gamma-Ray Ir-192) and high-voltage holiday coating continuity inspection for PetroMasila.',
    },
  },
  {
    id: 'bagram-afghanistan',
    code: 'INT-AFG',
    name: {
      ar: 'منشآت وقود الطائرات بقاعدة باجرام — أفغانستان',
      en: 'Bagram Airfield Fuel Tanker Offload Facility — Afghanistan',
    },
    shortName: { ar: 'منشآت وقود باجرام (أفغانستان)', en: 'Bagram Fuel Facility (AFG)' },
    location: { ar: 'مطار باجرام، ولاية بروان، أفغانستان', en: 'Bagram Air Base, Parwan, Afghanistan' },
    countryCode: 'AF',
    coordinates: [69.265, 34.946],
    category: 'oil_gas',
    client: 'U.S. Army Corps of Engineers / Serka & Contrack',
    pwhtUnitsAllocated: 2,
    pwhtRoleLabel: {
      ar: 'تعبئة دولية لوحدتي PWHT (مهمة مكتملة موثقة)',
      en: '2 × 65 kW PWHT Expeditionary Deployment (Completed Mission)',
    },
    ndtMethods: ['RT', 'UT', 'MT', 'PT', 'HYDRO'],
    governingCodes: ['ASME B31.3', 'API 650', 'USACE QA Standards'],
    status: 'international_completed',
    dispatchWindow: { ar: 'شحن جوي استراتيجي لمعدات PWHT و NDT', en: 'Chartered airlift mobilization' },
    evidenceRef: 'Annex B-01 · Serka Group Appreciation Letter',
    scopeSummary: {
      ar: 'تنفيذ أعمال التفتيش غير الإتلافي والمعالجة الحرارية PWHT لمنشآت تفريغ وتخزين وقود الطائرات بمشروع سلاح المهندسين الأمريكي.',
      en: 'International mobilization delivering full NDT and PWHT stress-relieving works on aviation fuel offload piping and tanks under USACE QA.',
    },
  },
];

/**
 * Ensures every GeoJSON Polygon ring complies with d3-geo's spherical clockwise
 * winding convention so interiors never invert across the globe.
 */
function makeCountryFeature(
  id: string,
  nameEn: string,
  nameAr: string,
  role: 'core' | 'international' | 'context',
  ring: [number, number][]
): Feature<Polygon, { id: string; nameEn: string; nameAr: string; role: 'core' | 'international' | 'context' }> {
  const closedRing: [number, number][] =
    ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring
      : [...ring, ring[0]];

  const candidate: Feature<Polygon, { id: string; nameEn: string; nameAr: string; role: 'core' | 'international' | 'context' }> = {
    type: 'Feature',
    properties: { id, nameEn, nameAr, role },
    geometry: {
      type: 'Polygon',
      coordinates: [closedRing],
    },
  };

  // In d3-geo, a regional country covers << π steradians; if > π, reverse winding.
  if (geoArea(candidate) > Math.PI) {
    candidate.geometry.coordinates = [[...closedRing].reverse()];
  }
  return candidate;
}

export const REGIONAL_LANDMASS_COLLECTION: FeatureCollection<
  Polygon,
  { id: string; nameEn: string; nameAr: string; role: 'core' | 'international' | 'context' }
> = {
  type: 'FeatureCollection',
  features: [
    // Egypt (Core HQ & 16-Unit PWHT Fleet Base — accurate Mediterranean, Delta, Sinai, Gulf of Suez/Aqaba & Red Sea outline)
    makeCountryFeature('EG', 'Egypt', 'مصر', 'core', [
      [25.15, 31.58],
      [27.22, 31.36],
      [28.95, 30.86],
      [29.88, 31.21],
      [30.42, 31.46],
      [30.98, 31.59],
      [31.82, 31.52],
      [32.31, 31.27],
      [33.15, 31.12],
      [34.26, 31.29],
      [34.89, 29.50],
      [34.43, 27.98],
      [34.18, 27.73],
      [33.58, 28.22],
      [32.95, 29.22],
      [32.56, 29.96],
      [32.36, 29.82],
      [32.62, 29.02],
      [33.82, 27.24],
      [34.78, 25.45],
      [35.48, 23.95],
      [35.85, 22.0],
      [25.0, 22.0],
      [25.0, 29.2],
      [25.15, 31.58],
    ]),

    // Libya (Eastern neighbor context)
    makeCountryFeature('LY', 'Libya', 'ليبيا', 'context', [
      [19.5, 30.3],
      [20.1, 32.1],
      [22.9, 32.8],
      [25.15, 31.58],
      [25.0, 29.2],
      [25.0, 22.0],
      [19.5, 22.0],
      [19.5, 30.3],
    ]),

    // Sudan (Southern neighbor context)
    makeCountryFeature('SD', 'Sudan', 'السودان', 'context', [
      [25.0, 22.0],
      [35.85, 22.0],
      [37.25, 20.8],
      [38.55, 18.05],
      [36.5, 14.5],
      [25.0, 14.5],
      [25.0, 22.0],
    ]),

    // Saudi Arabia & Levant Corridor
    makeCountryFeature('SA', 'Saudi Arabia', 'السعودية', 'context', [
      [34.95, 29.35],
      [36.9, 29.8],
      [39.2, 32.1],
      [42.1, 31.2],
      [46.5, 29.1],
      [48.5, 28.5],
      [50.15, 26.25],
      [51.55, 24.15],
      [55.15, 22.65],
      [52.0, 19.0],
      [47.2, 17.05],
      [43.2, 17.45],
      [42.65, 16.45],
      [41.4, 18.8],
      [39.1, 21.55],
      [38.05, 24.05],
      [36.5, 26.2],
      [34.95, 29.35],
    ]),

    // Yemen (International Mobilization — Masila Block)
    makeCountryFeature('YE', 'Yemen', 'اليمن', 'international', [
      [42.65, 16.45],
      [43.2, 17.45],
      [47.2, 17.05],
      [52.0, 19.0],
      [53.1, 16.65],
      [51.1, 15.15],
      [48.2, 14.0],
      [45.1, 12.75],
      [43.45, 12.65],
      [42.9, 14.8],
      [42.65, 16.45],
    ]),

    // Oman
    makeCountryFeature('OM', 'Oman', 'عُمان', 'context', [
      [52.0, 19.0],
      [55.15, 22.65],
      [56.35, 25.95],
      [59.8, 22.55],
      [57.75, 19.8],
      [55.2, 17.05],
      [53.1, 16.65],
      [52.0, 19.0],
    ]),

    // UAE
    makeCountryFeature('AE', 'UAE', 'الإمارات', 'context', [
      [51.55, 24.15],
      [54.4, 24.5],
      [56.1, 25.95],
      [56.35, 25.1],
      [55.15, 22.65],
      [51.55, 24.15],
    ]),

    // Levant & Jordan
    makeCountryFeature('JO', 'Levant', 'المشرق', 'context', [
      [34.26, 31.29],
      [35.1, 33.1],
      [35.9, 35.8],
      [41.2, 37.0],
      [42.1, 34.5],
      [39.2, 32.1],
      [36.9, 29.8],
      [34.95, 29.35],
      [34.89, 29.50],
      [34.26, 31.29],
    ]),

    // Iraq
    makeCountryFeature('IQ', 'Iraq', 'العراق', 'context', [
      [39.2, 32.1],
      [42.1, 34.5],
      [42.5, 37.1],
      [45.4, 35.9],
      [48.4, 30.0],
      [46.5, 29.1],
      [42.1, 31.2],
      [39.2, 32.1],
    ]),

    // Iran
    makeCountryFeature('IR', 'Iran', 'إيران', 'context', [
      [45.4, 35.9],
      [48.8, 38.4],
      [54.0, 37.5],
      [61.2, 35.6],
      [61.6, 31.2],
      [63.2, 27.2],
      [61.5, 25.2],
      [56.6, 27.1],
      [53.2, 26.8],
      [50.5, 28.9],
      [48.4, 30.0],
      [45.4, 35.9],
    ]),

    // Afghanistan (International Mobilization — Bagram Airfield Facility)
    makeCountryFeature('AF', 'Afghanistan', 'أفغانستان', 'international', [
      [61.2, 35.6],
      [65.2, 37.3],
      [68.8, 37.2],
      [71.5, 37.9],
      [74.5, 37.2],
      [71.2, 34.2],
      [69.4, 31.6],
      [66.2, 29.9],
      [61.6, 29.8],
      [61.6, 31.2],
      [61.2, 35.6],
    ]),

    // Pakistan (Southeastern context)
    makeCountryFeature('PK', 'Pakistan', 'باكستان', 'context', [
      [61.5, 25.2],
      [63.2, 27.2],
      [61.6, 29.8],
      [66.2, 29.9],
      [69.4, 31.6],
      [71.2, 34.2],
      [74.2, 32.5],
      [71.1, 27.8],
      [67.1, 24.8],
      [61.5, 25.2],
    ]),
  ],
};

export const REGIONAL_HYDRO_COLLECTION: FeatureCollection<LineString, { name: string }> = {
  type: 'FeatureCollection',
  features: [
    // Main Nile River (Aswan -> Qena -> Beni Suef / El-Kureimat -> Giza / Cairo)
    {
      type: 'Feature',
      properties: { name: 'Nile River' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [31.3, 22.0],
          [32.89, 24.09],
          [32.64, 25.69],
          [32.72, 26.16],
          [31.18, 27.18],
          [30.85, 28.1],
          [31.1, 29.07],
          [31.22, 29.55],
          [31.24, 30.05],
          [31.14, 30.18],
        ],
      },
    },
    // Nile Delta Rosetta Branch
    {
      type: 'Feature',
      properties: { name: 'Rosetta Branch' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [31.14, 30.18],
          [30.82, 30.65],
          [30.48, 31.15],
          [30.38, 31.46],
        ],
      },
    },
    // Nile Delta Damietta Branch (passing Talkha)
    {
      type: 'Feature',
      properties: { name: 'Damietta Branch' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [31.14, 30.18],
          [31.26, 30.68],
          [31.38, 31.05],
          [31.81, 31.5],
        ],
      },
    },
    // Suez Canal (Suez -> Ismailia -> Port Said)
    {
      type: 'Feature',
      properties: { name: 'Suez Canal' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [32.56, 29.96],
          [32.35, 30.35],
          [32.31, 30.6],
          [32.31, 31.26],
        ],
      },
    },
  ],
};

const EARTH_RADIUS_KM = 6371;

export function calculateMobilizationDistanceKm(targetCoords: [number, number]): number {
  if (
    Math.abs(targetCoords[0] - GIZA_DEPOT_COORDINATES[0]) < 0.0001 &&
    Math.abs(targetCoords[1] - GIZA_DEPOT_COORDINATES[1]) < 0.0001
  ) {
    return 0;
  }
  const radians = geoDistance(GIZA_DEPOT_COORDINATES, targetCoords);
  return Math.round(radians * EARTH_RADIUS_KM);
}

export function getRegionalCategoryLabel(category: RegionalSiteCategory, isAr: boolean): string {
  switch (category) {
    case 'fleet_hub':
      return isAr ? 'المقر ومخازن الأسطول' : 'HQ & Fleet Depot';
    case 'power':
      return isAr ? 'محطات توليد الطاقة' : 'Power Generation';
    case 'industrial':
      return isAr ? 'المجمعات الصناعية' : 'Heavy Industrial';
    case 'oil_gas':
      return isAr ? 'البترول والوقود الدولي' : 'Oil, Gas & Fuel';
  }
}
