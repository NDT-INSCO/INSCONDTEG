import { Language } from '../types';

export type EstimatorServiceId = 'pwht' | 'ut' | 'rt' | 'surface' | 'pmi_ht' | 'hydro';

export type WallThicknessTier = 'small_thin' | 'medium_std' | 'heavy_thick';

export type MobilizationZone = 'cairo_suez' | 'alex_delta' | 'red_sea_upper';

export type ShiftSchedule = 'day_standard' | 'shutdown_24_7';

export type EstimatorCurrency = 'USD' | 'EGP';

export interface EstimatorServiceSpec {
  id: EstimatorServiceId;
  shortCode: string;
  rfqServiceValue: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  governingCode: string;
  baseRateUsdPerJoint: number;
  dailyCapacityPerCrew: number;
  personnelPerCrew: number;
  equipmentUnitName: { ar: string; en: string };
}

export interface ProjectEstimateInput {
  selectedServices: EstimatorServiceId[];
  jointCount: number;
  thicknessTier: WallThicknessTier;
  mobilizationZone: MobilizationZone;
  shiftSchedule: ShiftSchedule;
}

export interface ServiceEstimateLineItem {
  serviceId: EstimatorServiceId;
  shortCode: string;
  name: { ar: string; en: string };
  equipmentUnits: number;
  equipmentUnitName: { ar: string; en: string };
  crewCount: number;
  serviceDays: number;
  costUsd: number;
  sharePct: number;
}

export interface ProjectEstimateResult {
  lineItems: ServiceEstimateLineItem[];
  mobilizationUsd: number;
  totalMidpointUsd: number;
  minBudgetUsd: number;
  maxBudgetUsd: number;
  estimatedSiteDays: number;
  totalCertifiedPersonnel: number;
  includesRsoOfficer: boolean;
  pwhtUnitsAllocated: number;
  requiredGeneratorKva: number;
  estimatedRtFilms: number;
  primaryRfqServiceValue: string;
}

export const USD_TO_EGP_RATE = 49.5;

export const ESTIMATOR_SERVICES: readonly EstimatorServiceSpec[] = [
  {
    id: 'pwht',
    shortCode: 'PWHT',
    rfqServiceValue: 'pwht',
    name: {
      ar: 'المعالجة الحرارية الموضعية (PWHT 65 kW)',
      en: 'Post-Weld Heat Treatment (PWHT)',
    },
    description: {
      ar: 'مثال تقديري لوحدة معالجة حرارية وأدوات تسجيل درجة الحرارة.',
      en: 'Planning example: a PWHT console and temperature recording instruments.',
    },
    governingCode: 'ASME B31.3 / Sec VIII',
    baseRateUsdPerJoint: 185,
    dailyCapacityPerCrew: 6,
    personnelPerCrew: 2,
    equipmentUnitName: {
      ar: 'وحدة معالجة حرارية 65 kW',
      en: '65 kW PWHT Console',
    },
  },
  {
    id: 'ut',
    shortCode: 'UT / PAUT',
    rfqServiceValue: 'ut_paut',
    name: {
      ar: 'الموجات فوق الصوتية والمصفوفات (UT / PAUT)',
      en: 'Ultrasonic & Phased Array (UT / PAUT)',
    },
    description: {
      ar: 'فحص حجمي بأجهزة Krautkrämer USM 35X و Olympus OmniScan.',
      en: 'Volumetric weld flaw sizing with USM 35X & Olympus OmniScan.',
    },
    governingCode: 'ASME Sec V Art. 4',
    baseRateUsdPerJoint: 68,
    dailyCapacityPerCrew: 16,
    personnelPerCrew: 2,
    equipmentUnitName: {
      ar: 'جهاز فحص موجات UT / PAUT',
      en: 'UT / PAUT Flaw Detector',
    },
  },
  {
    id: 'rt',
    shortCode: 'RT',
    rfqServiceValue: 'rt_gamma',
    name: {
      ar: 'التصوير الإشعاعي بالجاما والإكس راي (RT)',
      en: 'Industrial Radiography (Gamma / X-Ray)',
    },
    description: {
      ar: 'بند تقديري للتصوير الإشعاعي؛ التنفيذ مشروط بمراجعة الترخيص ونطاق العمل.',
      en: 'Budget allowance for radiography, subject to a review of applicable licensing and scope.',
    },
    governingCode: 'ASME Sec V Art. 2',
    baseRateUsdPerJoint: 82,
    dailyCapacityPerCrew: 14,
    personnelPerCrew: 3,
    equipmentUnitName: {
      ar: 'كاميرا أشعة ومعمل تحميض متنقل',
      en: 'RT Projector & Mobile Darkroom',
    },
  },
  {
    id: 'surface',
    shortCode: 'MT / PT / VT',
    rfqServiceValue: 'mt_pt',
    name: {
      ar: 'الفحوصات السطحية والبصرية (MT / PT / VT)',
      en: 'Surface & Visual Testing (MT / PT / VT)',
    },
    description: {
      ar: 'كشف الشروخ السطحية بالجسيمات المغناطيسية والسوائل النافذة.',
      en: 'Planning example for magnetic particle, penetrant and visual inspection.',
    },
    governingCode: 'ASME Sec V Art. 6 & 7',
    baseRateUsdPerJoint: 28,
    dailyCapacityPerCrew: 32,
    personnelPerCrew: 2,
    equipmentUnitName: {
      ar: 'طقم فحص سطحي ومغناطيسي',
      en: 'MT Yoke & PT Inspection Kit',
    },
  },
  {
    id: 'pmi_ht',
    shortCode: 'PMI & HT',
    rfqServiceValue: 'pmi_hardness',
    name: {
      ar: 'تحليل السبائك واختبار الصلادة (PMI & Hardness)',
      en: 'Alloy Verification (PMI) & Hardness (HT)',
    },
    description: {
      ar: 'تحقق كيميائي فوري للسبائك (P11/P22/P91) وقياس صلادة برينل بعد PWHT.',
      en: 'XRF alloy verification and post-PWHT Brinell/Vickers hardness testing.',
    },
    governingCode: 'ASTM E1476 / A370',
    baseRateUsdPerJoint: 36,
    dailyCapacityPerCrew: 28,
    personnelPerCrew: 1,
    equipmentUnitName: {
      ar: 'جهاز تحليل سبائك وصلادة رقمي',
      en: 'XRF PMI & UCI Hardness Unit',
    },
  },
  {
    id: 'hydro',
    shortCode: 'HYDRO',
    rfqServiceValue: 'hydro',
    name: {
      ar: 'الاختبار الهيدروستاتيكي للضغوط (Hydrotest)',
      en: 'Hydrostatic Pressure Testing',
    },
    description: {
      ar: 'مثال تقديري لمنظومة اختبار الضغط وتسجيل القياسات.',
      en: 'Planning example: a pressure test pump and recording instruments.',
    },
    governingCode: 'ASME B31.3 / B31.4',
    baseRateUsdPerJoint: 54,
    dailyCapacityPerCrew: 20,
    personnelPerCrew: 2,
    equipmentUnitName: {
      ar: 'منظومة ضغط هيدروستاتيكي ومسجل',
      en: 'Hydrotest Pump & Chart Package',
    },
  },
];

export const THICKNESS_TIER_OPTIONS: readonly {
  id: WallThicknessTier;
  multiplier: number;
  capacityFactor: number;
  label: { ar: string; en: string };
}[] = [
  {
    id: 'small_thin',
    multiplier: 0.78,
    capacityFactor: 1.25,
    label: {
      ar: 'أقطار صغيرة (≤ 6" · سماكة ≤ 12 مم)',
      en: 'Small-Bore (≤ 6" · Wall ≤ 12 mm)',
    },
  },
  {
    id: 'medium_std',
    multiplier: 1.0,
    capacityFactor: 1.0,
    label: {
      ar: 'أقطار قياسية (8"–18" · سماكة 12–28 مم)',
      en: 'Standard Process (8"–18" · 12–28 mm)',
    },
  },
  {
    id: 'heavy_thick',
    multiplier: 1.55,
    capacityFactor: 0.65,
    label: {
      ar: 'سماكات ثقيلة ومراجل (≥ 20" · سماكة > 28 مم)',
      en: 'Heavy-Wall / Steam Headers (≥ 20" · > 28 mm)',
    },
  },
];

export const MOBILIZATION_ZONE_OPTIONS: readonly {
  id: MobilizationZone;
  baseFeeUsd: number;
  locationLabel: { ar: string; en: string };
}[] = [
  {
    id: 'cairo_suez',
    baseFeeUsd: 650,
    locationLabel: {
      ar: 'القاهرة الكبرى / العين السخنة / السويس',
      en: 'Greater Cairo / Ain Sokhna / Suez',
    },
  },
  {
    id: 'alex_delta',
    baseFeeUsd: 1100,
    locationLabel: {
      ar: 'الإسكندرية / الدلتا / بورسعيد (حقل ظهر)',
      en: 'Alexandria / Delta / Port Said',
    },
  },
  {
    id: 'red_sea_upper',
    baseFeeUsd: 1850,
    locationLabel: {
      ar: 'البحر الأحمر / الصعيد / الحقول الصحراوية',
      en: 'Red Sea / Upper Egypt / Remote Fields',
    },
  },
];

export function formatEstimatorCurrency(amountUsd: number, currency: EstimatorCurrency): string {
  const value = currency === 'EGP' ? Math.round(amountUsd * USD_TO_EGP_RATE) : Math.round(amountUsd);
  const formatted = new Intl.NumberFormat('en-US').format(value);
  return currency === 'EGP' ? `${formatted} EGP` : `$${formatted}`;
}

export function calculateProjectEstimate(input: ProjectEstimateInput): ProjectEstimateResult {
  const safeJoints = Math.max(1, Math.min(2000, Math.round(input.jointCount)));
  const tier =
    THICKNESS_TIER_OPTIONS.find((t) => t.id === input.thicknessTier) ?? THICKNESS_TIER_OPTIONS[1];
  const zone =
    MOBILIZATION_ZONE_OPTIONS.find((z) => z.id === input.mobilizationZone) ??
    MOBILIZATION_ZONE_OPTIONS[0];

  const isShutdown24x7 = input.shiftSchedule === 'shutdown_24_7';
  const shiftRateMultiplier = isShutdown24x7 ? 1.28 : 1.0;
  const shiftOutputBoost = isShutdown24x7 ? 1.75 : 1.0;

  if (input.selectedServices.length === 0) {
    return {
      lineItems: [],
      mobilizationUsd: 0,
      totalMidpointUsd: 0,
      minBudgetUsd: 0,
      maxBudgetUsd: 0,
      estimatedSiteDays: 0,
      totalCertifiedPersonnel: 0,
      includesRsoOfficer: false,
      pwhtUnitsAllocated: 0,
      requiredGeneratorKva: 0,
      estimatedRtFilms: 0,
      primaryRfqServiceValue: 'pwht',
    };
  }

  // Multi-service bundle discount (5% when 3+ services are mobilized together)
  const bundleFactor = input.selectedServices.length >= 3 ? 0.95 : 1.0;

  const rawItems: Omit<ServiceEstimateLineItem, 'sharePct'>[] = [];
  let maxSingleDisciplineDays = 1;
  let totalCrew = 0;
  let pwhtUnitsAllocated = 0;

  for (const svcId of input.selectedServices) {
    const spec = ESTIMATOR_SERVICES.find((s) => s.id === svcId);
    if (!spec) continue;

    // Scale equipment units with scope size (e.g., up to 16 owned PWHT units)
    const maxFleetUnits = svcId === 'pwht' ? 16 : 6;
    const desiredUnits =
      safeJoints > 120 ? 3 : safeJoints > 45 ? 2 : 1;
    const equipmentUnits = Math.min(maxFleetUnits, desiredUnits);

    if (svcId === 'pwht') {
      pwhtUnitsAllocated = equipmentUnits;
    }

    const effectiveDailyOutput = Math.max(
      1,
      spec.dailyCapacityPerCrew * equipmentUnits * tier.capacityFactor * shiftOutputBoost
    );
    const serviceDays = Math.max(1, Math.ceil(safeJoints / effectiveDailyOutput));
    if (serviceDays > maxSingleDisciplineDays) {
      maxSingleDisciplineDays = serviceDays;
    }

    const shiftFactorForCrew = isShutdown24x7 ? 2 : 1;
    const crewCount = spec.personnelPerCrew * equipmentUnits * shiftFactorForCrew;
    totalCrew += crewCount;

    const costUsd = Math.round(
      safeJoints *
        spec.baseRateUsdPerJoint *
        tier.multiplier *
        shiftRateMultiplier *
        bundleFactor
    );

    rawItems.push({
      serviceId: spec.id,
      shortCode: spec.shortCode,
      name: spec.name,
      equipmentUnits,
      equipmentUnitName: spec.equipmentUnitName,
      crewCount,
      serviceDays,
      costUsd,
    });
  }

  const includesRsoOfficer = input.selectedServices.includes('rt');
  if (includesRsoOfficer) {
    totalCrew += 1; // Planning allowance, not proof of a named or licensed person.
  }

  const rtHazmatLogisticsUsd = includesRsoOfficer ? 420 : 0;
  const multiEquipmentLogisticsUsd = Math.max(0, rawItems.length - 1) * 240;
  const mobilizationUsd = zone.baseFeeUsd + rtHazmatLogisticsUsd + multiEquipmentLogisticsUsd;

  const servicesSumUsd = rawItems.reduce((acc, item) => acc + item.costUsd, 0);
  const totalMidpointUsd = servicesSumUsd + mobilizationUsd;

  const lineItems: ServiceEstimateLineItem[] = rawItems.map((item) => ({
    ...item,
    sharePct:
      totalMidpointUsd > 0 ? Math.max(1, Math.round((item.costUsd / totalMidpointUsd) * 100)) : 0,
  }));

  const minBudgetUsd = Math.round(totalMidpointUsd * 0.92);
  const maxBudgetUsd = Math.round(totalMidpointUsd * 1.08);

  // Parallelized site duration with slight coordination buffer when multiple methods run sequentially on same welds
  const sequentialBufferDays = input.selectedServices.length >= 2 ? 1 : 0;
  const estimatedSiteDays = maxSingleDisciplineDays + sequentialBufferDays;

  const requiredGeneratorKva = pwhtUnitsAllocated * 75;
  const filmsPerJoint =
    input.thicknessTier === 'heavy_thick'
      ? 5
      : input.thicknessTier === 'medium_std'
      ? 3
      : 2;
  const estimatedRtFilms = includesRsoOfficer ? safeJoints * filmsPerJoint : 0;

  const firstSpec =
    ESTIMATOR_SERVICES.find((s) => s.id === input.selectedServices[0]) ?? ESTIMATOR_SERVICES[0];

  return {
    lineItems,
    mobilizationUsd,
    totalMidpointUsd,
    minBudgetUsd,
    maxBudgetUsd,
    estimatedSiteDays,
    totalCertifiedPersonnel: totalCrew,
    includesRsoOfficer,
    pwhtUnitsAllocated,
    requiredGeneratorKva,
    estimatedRtFilms,
    primaryRfqServiceValue: firstSpec.rfqServiceValue,
  };
}

export function buildEstimateRfqSummary(
  input: ProjectEstimateInput,
  result: ProjectEstimateResult,
  currency: EstimatorCurrency,
  language: Language
): string {
  const isAr = language === 'ar';
  const tier =
    THICKNESS_TIER_OPTIONS.find((t) => t.id === input.thicknessTier) ?? THICKNESS_TIER_OPTIONS[1];
  const codes = result.lineItems.map((li) => li.shortCode).join(' + ');
  const rangeStr = `${formatEstimatorCurrency(result.minBudgetUsd, currency)} – ${formatEstimatorCurrency(
    result.maxBudgetUsd,
    currency
  )}`;

  if (isAr) {
    return `تقدير مشروع أولي: الخدمات (${codes}) | عدد الوصلات: ${input.jointCount} وصلة (${tier.label.ar}) | المدة المقدرة: ${result.estimatedSiteDays} أيام عمل | الطاقم المقدّر: ${result.totalCertifiedPersonnel} أفراد | الميزانية التقديرية: ${rangeStr}.`;
  }

  return `Project Estimate Scope: Services (${codes}) | Volume: ${input.jointCount} weld joints (${tier.label.en}) | Est. Duration: ${result.estimatedSiteDays} site days | Est. crew: ${result.totalCertifiedPersonnel} personnel | Budgetary Range: ${rangeStr}.`;
}
