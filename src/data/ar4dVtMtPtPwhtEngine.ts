import type { SimulationNdtMethod } from '../utils/simulationHistoryStore';

export type Ar4dInspectorDisciplineId = 'vt' | 'mt' | 'pt' | 'pwht';

export type CodeVerdictLevel = 'pass' | 'warn' | 'reject';

export interface CodeClauseReviewItem {
  codeId: string;
  codeName: string;
  clauseRef: string;
  verdict: CodeVerdictLevel;
  verdictLabelAr: string;
  verdictLabelEn: string;
  requirementAr: string;
  requirementEn: string;
  measuredSummaryAr: string;
  measuredSummaryEn: string;
  remediationAr: string;
  remediationEn: string;
}

export interface PhaseMilestoneSpec {
  progressPct: number;
  labelAr: string;
  labelEn: string;
  detailAr: string;
  detailEn: string;
}

export interface DisciplineAr4dMeta {
  id: Ar4dInspectorDisciplineId;
  orderLabel: string;
  shortCode: string;
  accentHex: string;
  ndtMethod: SimulationNdtMethod;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  equipmentAr: string;
  equipmentEn: string;
  phases: [
    PhaseMilestoneSpec,
    PhaseMilestoneSpec,
    PhaseMilestoneSpec,
    PhaseMilestoneSpec,
  ];
}

export const AR4D_VT_MT_PT_PWHT_DISCIPLINES: readonly DisciplineAr4dMeta[] = [
  {
    id: 'vt',
    orderLabel: '01',
    shortCode: 'VT · Visual',
    accentHex: '#38bdf8',
    ndtMethod: 'VT',
    titleAr: 'الفحص البصري المتقدم 4D بالليزر ومقياس اللحام (VT)',
    titleEn: 'Visual Testing 4D Laser Gauge & Weld Profile AR (VT)',
    subtitleAr:
      'مسح 4D بالواقع المعزز لتاج اللحام والعضة الجانبية واختلال المحاذاة Hi-Lo مع معايرة الإضاءة ≥ 1000 Lux ومسافة الرؤية ≤ 600 mm',
    subtitleEn:
      '4D AR laser-profile sweep for weld reinforcement, undercut depth & Hi-Lo mismatch calibrated to ≥1000 Lux and ≤600mm viewing distance',
    equipmentAr: 'مقياس كامبريدج + Bridge Cam · مقياس لوكس رقمي · بروفايل ليزر 3D',
    equipmentEn: 'Cambridge & Bridge Cam Gauge · Calibrated Lux Meter · 3D Laser Weld Profiler',
    phases: [
      {
        progressPct: 0,
        labelAr: 'تنظيف ومعايرة الإضاءة',
        labelEn: 'Surface Prep & Lux Check',
        detailAr: 'إزالة الخبث والتحقق من شدة الإضاءة ≥ 1000 Lux ومسافة النظر ≤ 600 mm بزاوية ≥ 30°.',
        detailEn: 'Slag removal and verification of ≥1000 Lux illumination, ≤600mm distance & ≥30° angle.',
      },
      {
        progressPct: 33,
        labelAr: 'فحص المحاذاة والجذر Hi-Lo',
        labelEn: 'Hi-Lo & Root Alignment Scan',
        detailAr: 'قياس اختلال التراصف الداخلي Hi-Lo وتقعر الجذر ومقارنته بحدود B31.3 و AWS D1.1.',
        detailEn: 'Measure Hi-Lo mismatch and root concavity against ASME B31.3 & AWS D1.1 limits.',
      },
      {
        progressPct: 66,
        labelAr: 'قياس ارتفاع التاج والعضة Undercut',
        labelEn: 'Cap Height & Undercut Sweep',
        detailAr: 'تمرير مقياس كامبريدج/الليزر على تاج اللحام لقياس العضة الجانبية وارتفاع التعزيز.',
        detailEn: 'Sweep Cambridge gauge over weld crown to capture reinforcement and undercut depth.',
      },
      {
        progressPct: 100,
        labelAr: 'مراجعة الأكواد الخمسة وتوقيع VT',
        labelEn: 'Multi-Code Review & VT Sign-Off',
        detailAr: 'مطابقة التقرير مع ASME V Art.9 و AWS D1.1 و B31.3 و API 1104 و ISO 5817 Level B.',
        detailEn: 'Verify final acceptance across ASME V Art.9, AWS D1.1, B31.3, API 1104 & ISO 5817-B.',
      },
    ],
  },
  {
    id: 'mt',
    orderLabel: '02',
    shortCode: 'MT · Magnetic',
    accentHex: '#ec4899',
    ndtMethod: 'MT',
    titleAr: 'فحص الجسيمات المغناطيسية 4D والفيض المتعامد (MT)',
    titleEn: 'Magnetic Particle 4D Flux Leakage & Yoke AR (MT)',
    subtitleAr:
      'محاكاة زمنية 4D لاختبار قوة رفع الحدوة (4.5/18.1 kg)، حقن الفيض 0° و 90°، تراكم البودرة الفلورية تحت UV-A 365nm وإزالة المغنطة',
    subtitleEn:
      '4D sequence: Dead-weight lift calibration (4.5/18.1 kg), 0°/90° orthogonal magnetization, UV-A 365nm bath buildup & demagnetization',
    equipmentAr: 'حدوة AC/DC Yoke · قرص Pie Gauge / شريحة Castrol · كشاف UV-A 365nm · مقياس Gauss',
    equipmentEn: 'AC/DC Electromagnetic Yoke · Pie Gauge / Castrol Strip · 365nm UV-A Lamp · Gaussmeter',
    phases: [
      {
        progressPct: 0,
        labelAr: 'اختبار وزن الرفع ومعايرة Pie Gauge',
        labelEn: 'Lift Weight & Pie Gauge Check',
        detailAr: 'التحقق من قوة رفع الحدوة (AC ≥ 4.5 kg أو DC ≥ 18.1 kg) وكفاءة شريحة Castrol.',
        detailEn: 'Verify yoke lift weight (AC ≥4.5 kg / DC ≥18.1 kg) and Castrol / Pie Gauge lines.',
      },
      {
        progressPct: 33,
        labelAr: 'مغنطة طولية 0° ورش الحمام الفلوري',
        labelEn: '0° Magnetization & Wet Bath',
        detailAr: 'تنشيط الفيض المغناطيسي بزاوية 0° وتوجيه حمام الجسيمات لكشف الشروخ العرضية.',
        detailEn: 'Energize 0° flux across pole spacing (75–150mm) while applying wet fluorescent particles.',
      },
      {
        progressPct: 66,
        labelAr: 'مسح متعامد 90° وفحص UV-A',
        labelEn: '90° Cross-Scan & UV-A 365nm',
        detailAr: 'تدوير الحدوة 90° لكشف الشروخ الطولية تحت إضاءة UV-A ≥ 1000 µW/cm² وإعتام ≤ 20 Lux.',
        detailEn: 'Rotate yoke 90° to reveal longitudinal cracks under ≥1000 µW/cm² UV-A and ≤20 Lux dark.',
      },
      {
        progressPct: 100,
        labelAr: 'التقييم الكودي وإزالة المغنطة ≤ 3 G',
        labelEn: 'Sizing & Demagnetization ≤ 3 G',
        detailAr: 'تصنيف الدلالة (خطية > 1.5mm أم دائرية) وإزالة المغنطة المتبقية لأقل من 3 Gauss.',
        detailEn: 'Size linear/rounded indications across 5 codes and demagnetize residual field ≤ 3 Gauss.',
      },
    ],
  },
  {
    id: 'pt',
    orderLabel: '03',
    shortCode: 'PT · Penetrant',
    accentHex: '#a855f7',
    ndtMethod: 'PT',
    titleAr: 'فحص السوائل النافذة 4D والتغلغل الشعري والمُظهر (PT)',
    titleEn: 'Liquid Penetrant 4D Capillary Dwell & Bleed-Out AR (PT)',
    subtitleAr:
      'محاكاة زمنية 4D للخاصية الشعرية داخل الشقوق السطحية، زمن التغلغل Dwell، إزالة الزائد، نمو هالة المُظهر، وفحص الهالوجين والكبريت للستانلس',
    subtitleEn:
      '4D capillary absorption inside surface-breaking cracks, excess removal, developer bleed-out growth & ASME T-641 SS halogen limits',
    equipmentAr: 'نظام Type I / II · بخاخ منظف ومُظهر غير مائي · مقياس حرارة السطح · UV-A 365nm',
    equipmentEn: 'Type I/II Penetrant Kit · Non-Aqueous Developer · IR Surface Thermometer · UV-A 365nm',
    phases: [
      {
        progressPct: 0,
        labelAr: 'تنظيف وتجفيف وفحص حرارة 10–52°C',
        labelEn: 'Pre-Clean & 10–52°C Window',
        detailAr: 'التنظيف بالمذيب مع جفاف ≥ 5 دقائق وضمان حرارة المعدن 10–52°C (وحد التلوث لـ SS).',
        detailEn: 'Solvent pre-clean, ≥5 min evaporation dry, verify 10–52°C metal temp & SS impurity limits.',
      },
      {
        progressPct: 33,
        labelAr: 'تطبيق السائل وزمن التغلغل Dwell',
        labelEn: 'Penetrant Capillary Dwell',
        detailAr: 'سحب السائل بالخاصية الشعرية إلى قاع الشق السطحي خلال زمن التغلغل القياسي.',
        detailEn: 'Capillary pull draws dye deeply into surface-breaking discontinuity during dwell window.',
      },
      {
        progressPct: 66,
        labelAr: 'مسح الزائد وتطبيق المُظهر Developer',
        labelEn: 'Excess Wipe & Developer Bleed',
        detailAr: 'إزالة الفائض دون غسل العيب، ثم رش المُظهر لسحب السائل وبناء هالة النزف خلال 10–60 دقيقة.',
        detailEn: 'Remove excess cleanly and apply developer to initiate bleed-out expansion (10–60 min).',
      },
      {
        progressPct: 100,
        labelAr: 'القياس الفلوري/البصري ومراجعة الأكواد',
        labelEn: 'Bleed Interpretation & Codes',
        detailAr: 'تقييم الدلالات المستطيلة (> 3:1 نسبة طول لعرض) والدائرية ومراجعة الأكواد الخمسة.',
        detailEn: 'Evaluate relevant (>1.5mm), linear (>3:1 ratio), and rounded indications across 5 codes.',
      },
    ],
  },
  {
    id: 'pwht',
    orderLabel: '04',
    shortCode: 'PWHT · Thermal',
    accentHex: '#f43f5e',
    ndtMethod: 'MULTI',
    titleAr: 'المعالجة الحرارية بعد اللحام 4D والتوهج الحراري والصلادة (PWHT)',
    titleEn: 'Post Weld Heat Treatment 4D Thermal Cycle & Hardness AR (PWHT)',
    subtitleAr:
      'محاكاة زمنية 4D للدورة الحرارية الكاملة (صعود، نقع، تبريد) على وسادات سيراميك 65 kW مع توزيع الحرارة وحساب Soak/Heated Band وفحص صلادة NACE ≤ 248 HV',
    subtitleEn:
      '4D thermal cycle across 65 kW FCP ceramic pads: controlled ramp, P-Number soak hold, AWS D10.10 bands & NACE ≤248 HV hardness verification',
    equipmentAr: 'وحدة PWHT 65 kW · وسادات سيراميك FCP · ثيرموكبل Type-K · جهاز صلادة UCI/Brinell',
    equipmentEn: '65 kW 6-Zone PWHT Console · Ceramic FCP Pads · Type-K Thermocouples · UCI/HBW Hardness',
    phases: [
      {
        progressPct: 0,
        labelAr: 'تركيب الوسادات FCP والثيرموكبل وعرض النطاق',
        labelEn: 'FCP Pads, Type-K & Band Setup',
        detailAr: 'تثبيت الثيرموكبل باللحام السعوي وضبط عرض نطاق النقع W_sb ونطاق التسخين W_hb.',
        detailEn: 'Capacitive-discharge weld Type-K TCs and size Soak Band & AWS D10.10 Heated Band.',
      },
      {
        progressPct: 33,
        labelAr: 'التسخين الصاعد المقنن (فوق 315°C)',
        labelEn: 'Controlled Ramp Above 315°C',
        detailAr: 'التحكم بمعدل الصعود ≤ 222°C/hr (معدّل بالسماكة) وحصر فرق القنوات ΔT لمنع الإجهاد الحراري.',
        detailEn: 'Enforce thickness-adjusted ramp ceiling above 315°C while keeping multi-TC ΔT tight.',
      },
      {
        progressPct: 66,
        labelAr: 'ثبات النقع الحراري وإزالة الإجهادات',
        labelEn: 'Soak Hold & Stress Relaxation',
        detailAr: 'الثبات داخل نافذة P-Number (مثل P1: 595–650°C) مدة لا تقل عن ساعة لكل 25 mm.',
        detailEn: 'Maintain soak temperature inside P-Number window for ≥ 1 hr per 25mm wall thickness.',
      },
      {
        progressPct: 100,
        labelAr: 'التبريد وفحص صلادة HAZ ≤ 248 HV',
        labelEn: 'Cool Down & NACE Hardness Check',
        detailAr: 'تبريد مقنن حتى 315°C ثم في الهواء الساكن مع فحص الصلادة (≤ 248 HV / 200 HBW لخدمة H2S).',
        detailEn: 'Controlled cool down to 315°C and post-PWHT HAZ hardness audit (NACE ≤248 HV / 200 HBW).',
      },
    ],
  },
];

// ============================================================================
// PARAMETER INPUT TYPES
// ============================================================================

export type WeldJointType = 'butt_pipe' | 'butt_plate' | 'fillet_tee';

export interface VtSimInput {
  jointType: WeldJointType;
  wallThicknessMm: number;
  illuminationLux: number;
  viewingDistanceMm: number;
  viewingAngleDeg: number;
  capReinforcementMm: number;
  undercutDepthMm: number;
  hiLoMismatchMm: number;
  discontinuityLengthMm: number;
  hasSurfaceCrackOrPin: boolean;
}

export type MtMethodMode = 'ac_yoke' | 'dc_yoke' | 'prod' | 'coil';
export type IndicationMorphology = 'linear' | 'rounded';

export interface MtSimInput {
  mode: MtMethodMode;
  wallThicknessMm: number;
  poleSpacingMm: number;
  yokeLiftKg: number;
  uvaIntensityUwCm2: number;
  ambientLightLux: number;
  twoDirectionScan: boolean;
  residualGauss: number;
  morphology: IndicationMorphology;
  indicationSizeMm: number;
  alignedCount: number;
}

export type PtSystemType = 'type1_fluorescent_method_d' | 'type1_water_method_a' | 'type2_visible_solvent_c';
export type PtAlloyGroup = 'carbon_steel' | 'austenitic_ss_nickel';

export interface PtSimInput {
  systemType: PtSystemType;
  alloyGroup: PtAlloyGroup;
  wallThicknessMm: number;
  surfaceTempC: number;
  dwellTimeMin: number;
  developerEvalMin: number;
  lightLevel: number; // µW/cm² for Type I, Lux for Type II
  ambientDarkLux: number; // only critical for Type I
  halogenSulfurPpm: number;
  morphology: IndicationMorphology;
  indicationSizeMm: number;
  alignedCount: number;
}

export type PwhtPNumber = 'P1' | 'P3' | 'P4' | 'P5A';

export interface PwhtPNumberSpec {
  id: PwhtPNumber;
  labelAr: string;
  labelEn: string;
  minSoakC: number;
  maxSoakC: number;
  minHoldPer25mmMin: number;
  maxAllowedHardnessHv: number;
  maxAllowedHardnessHbw: number;
  prePwhtTypicalHv: number;
}

export const PWHT_PNUMBER_SPECS: Record<PwhtPNumber, PwhtPNumberSpec> = {
  P1: {
    id: 'P1',
    labelAr: 'P-No. 1 — صلب كربوني (Carbon Steel SA-106 / A516)',
    labelEn: 'P-No. 1 — Carbon Steel (SA-106 Gr.B / A516)',
    minSoakC: 595,
    maxSoakC: 650,
    minHoldPer25mmMin: 60,
    maxAllowedHardnessHv: 248,
    maxAllowedHardnessHbw: 200,
    prePwhtTypicalHv: 285,
  },
  P3: {
    id: 'P3',
    labelAr: 'P-No. 3 — سبائك منخفضة C-½Mo',
    labelEn: 'P-No. 3 — Low-Alloy C-½Mo Steel',
    minSoakC: 595,
    maxSoakC: 675,
    minHoldPer25mmMin: 60,
    maxAllowedHardnessHv: 248,
    maxAllowedHardnessHbw: 225,
    prePwhtTypicalHv: 315,
  },
  P4: {
    id: 'P4',
    labelAr: 'P-No. 4 — كروم موليبدنوم (1¼Cr-½Mo · P11)',
    labelEn: 'P-No. 4 — Cr-Mo Alloy (1¼Cr-½Mo · SA-335 P11)',
    minSoakC: 650,
    maxSoakC: 720,
    minHoldPer25mmMin: 60,
    maxAllowedHardnessHv: 248,
    maxAllowedHardnessHbw: 225,
    prePwhtTypicalHv: 345,
  },
  P5A: {
    id: 'P5A',
    labelAr: 'P-No. 5A — كروم موليبدنوم عالي (2¼Cr-1Mo · P22)',
    labelEn: 'P-No. 5A — Cr-Mo High-Temp (2¼Cr-1Mo · SA-335 P22)',
    minSoakC: 675,
    maxSoakC: 760,
    minHoldPer25mmMin: 60,
    maxAllowedHardnessHv: 248,
    maxAllowedHardnessHbw: 241,
    prePwhtTypicalHv: 375,
  },
};

export interface PwhtSimInput {
  pNumber: PwhtPNumber;
  pipeOdMm: number;
  wallThicknessMm: number;
  weldWidthMm: number;
  targetSoakC: number;
  soakHoldMin: number;
  rampRateCPerHr: number;
  coolRateCPerHr: number;
  tcSpreadDeltaC: number;
  sourServiceNace: boolean;
}

// ============================================================================
// UNIFIED SNAPSHOT OUTPUT TYPES
// ============================================================================

export interface Ar4dUnifiedTelemetry {
  discipline: Ar4dInspectorDisciplineId;
  timeProgress01: number;
  phaseIndex: number;
  activePhaseLabelAr: string;
  activePhaseLabelEn: string;
  metric1LabelAr: string;
  metric1LabelEn: string;
  metric1Value: string;
  metric2LabelAr: string;
  metric2LabelEn: string;
  metric2Value: string;
  metric3LabelAr: string;
  metric3LabelEn: string;
  metric3Value: string;
  metric4LabelAr: string;
  metric4LabelEn: string;
  metric4Value: string;
  overallPass: boolean;
  overallVerdictAr: string;
  overallVerdictEn: string;
  codeReviews: CodeClauseReviewItem[];
  /** Physics numbers exported cleanly for 3D shader & SVG fallback rendering */
  visualState: {
    thermalNormalized01: number;
    liveTempC: number;
    capillaryBleed01: number;
    fluxIntensity01: number;
    laserSweepNorm01: number;
    defectSeverity01: number;
  };
}

// ============================================================================
// 1. VT MULTI-CODE REVIEW & 4D COMPUTATION
// ============================================================================

export function evaluateVtAcrossCodes(input: VtSimInput): CodeClauseReviewItem[] {
  const maxB313CapMm = input.wallThicknessMm <= 6.4 ? 1.5 : input.wallThicknessMm <= 12.7 ? 3.0 : input.wallThicknessMm <= 25.4 ? 4.0 : 5.0;
  const iso5817CapMax = Math.min(5.0, Number((1.0 + 0.1 * Math.max(8, input.wallThicknessMm * 0.9)).toFixed(2)));
  const api1104UndercutMax = Number(Math.min(0.8, 0.125 * input.wallThicknessMm).toFixed(2));
  const b313UndercutMax = Number(Math.min(1.0, 0.25 * input.wallThicknessMm).toFixed(2));

  const setupOk = input.illuminationLux >= 1000 && input.viewingDistanceMm <= 600 && input.viewingAngleDeg >= 30;
  const awsCapOk = !input.hasSurfaceCrackOrPin && input.capReinforcementMm <= (input.wallThicknessMm <= 25.4 ? 3.2 : 4.8);
  const awsUndercutOk = input.undercutDepthMm <= 1.0 && (input.undercutDepthMm <= 0.25 || input.discontinuityLengthMm <= 25);
  const awsOk = awsCapOk && awsUndercutOk && input.hiLoMismatchMm <= 3.0;

  const b313Ok =
    !input.hasSurfaceCrackOrPin &&
    input.capReinforcementMm <= maxB313CapMm &&
    input.undercutDepthMm <= b313UndercutMax &&
    input.hiLoMismatchMm <= 1.5;

  const apiOk =
    !input.hasSurfaceCrackOrPin &&
    input.undercutDepthMm <= api1104UndercutMax &&
    input.hiLoMismatchMm <= 3.0 &&
    input.discontinuityLengthMm <= 50;

  const isoOk =
    !input.hasSurfaceCrackOrPin &&
    input.capReinforcementMm <= iso5817CapMax &&
    input.undercutDepthMm <= 0.5 &&
    input.hiLoMismatchMm <= Math.min(3.0, Number((0.1 * input.wallThicknessMm).toFixed(2)));

  return [
    {
      codeId: 'ASME_V_ART9',
      codeName: 'ASME Sec. V Art. 9',
      clauseRef: 'T-951 / T-952',
      verdict: setupOk ? 'pass' : 'reject',
      verdictLabelAr: setupOk ? 'مطابق للشروط البصرية' : 'شرط فحص غير مستوفى',
      verdictLabelEn: setupOk ? 'PASS — Optical Prerequisites Met' : 'REJECT — Prerequisites Failed',
      requirementAr: 'إضاءة ≥ 1000 Lux · مسافة ≤ 600 mm · زاوية ≥ 30°',
      requirementEn: 'Light ≥ 1000 Lux · Distance ≤ 600 mm · Angle ≥ 30°',
      measuredSummaryAr: `${input.illuminationLux} Lux · ${input.viewingDistanceMm} mm · ${input.viewingAngleDeg}°`,
      measuredSummaryEn: `${input.illuminationLux} Lux · ${input.viewingDistanceMm} mm · ${input.viewingAngleDeg}°`,
      remediationAr: setupOk ? 'إعداد الكاميرا والضوء جاهز للتقييم.' : 'ارفع شدة الإضاءة إلى ≥ 1000 Lux واقترب لمسافة ≤ 600 mm بزاوية ≥ 30°.',
      remediationEn: setupOk ? 'Illumination and viewing envelope qualified.' : 'Increase illumination to ≥1000 Lux and keep eye/lens ≤600mm & ≥30°.',
    },
    {
      codeId: 'AWS_D1_1',
      codeName: 'AWS D1.1',
      clauseRef: 'Table 6.1 / Cl. 8.9',
      verdict: !setupOk ? 'warn' : awsOk ? 'pass' : 'reject',
      verdictLabelAr: !setupOk ? 'تحقق من الإضاءة' : awsOk ? 'مقبول AWS D1.1' : 'مرفوض AWS D1.1',
      verdictLabelEn: !setupOk ? 'WARN — Verify Setup' : awsOk ? 'PASS — AWS D1.1' : 'REJECT — AWS D1.1',
      requirementAr: 'صفر شروخ · تعزيز ≤ 3.2mm (t≤25) · عضة ≤ 1.0mm · Hi-Lo ≤ 3.0mm',
      requirementEn: 'Zero cracks · Cap ≤ 3.2mm · Undercut ≤ 1.0mm · Hi-Lo ≤ 3.0mm',
      measuredSummaryAr: `تاج ${input.capReinforcementMm}mm · عضة ${input.undercutDepthMm}mm · Hi-Lo ${input.hiLoMismatchMm}mm`,
      measuredSummaryEn: `Cap ${input.capReinforcementMm}mm · Undercut ${input.undercutDepthMm}mm · Hi-Lo ${input.hiLoMismatchMm}mm`,
      remediationAr: awsOk ? 'هندسة اللحام مقبولة لإنشاءات الصلب.' : 'أصلح الشروخ/العضة وأعد تسوية ارتفاع التاج.',
      remediationEn: awsOk ? 'Weld profile complies with structural steel limits.' : 'Grind excess crown or repair undercut/cracks per WPS.',
    },
    {
      codeId: 'ASME_B31_3',
      codeName: 'ASME B31.3',
      clauseRef: 'Table 341.3.2',
      verdict: !setupOk ? 'warn' : b313Ok ? 'pass' : 'reject',
      verdictLabelAr: !setupOk ? 'تحقق من الإضاءة' : b313Ok ? 'مقبول B31.3' : 'مرفوض B31.3',
      verdictLabelEn: !setupOk ? 'WARN — Verify Setup' : b313Ok ? 'PASS — ASME B31.3' : 'REJECT — ASME B31.3',
      requirementAr: `تاج ≤ ${maxB313CapMm}mm · عضة ≤ ${b313UndercutMax}mm · Hi-Lo ≤ 1.5mm`,
      requirementEn: `Cap ≤ ${maxB313CapMm}mm · Undercut ≤ ${b313UndercutMax}mm · Hi-Lo ≤ 1.5mm`,
      measuredSummaryAr: `تاج ${input.capReinforcementMm}mm · Hi-Lo ${input.hiLoMismatchMm}mm`,
      measuredSummaryEn: `Cap ${input.capReinforcementMm}mm · Hi-Lo ${input.hiLoMismatchMm}mm`,
      remediationAr: b313Ok ? 'مطابق لأنابيب العمليات (Normal Fluid Service).' : 'تجاوز حدود التاج أو اختلال المحاذاة Hi-Lo للأنابيب.',
      remediationEn: b313Ok ? 'Conforms to B31.3 Normal Fluid Service.' : 'Exceeds B31.3 cap, undercut, or 1.5mm Hi-Lo limit.',
    },
    {
      codeId: 'API_1104',
      codeName: 'API 1104',
      clauseRef: 'Sec. 9.7 / Fig. 12',
      verdict: !setupOk ? 'warn' : apiOk ? 'pass' : 'reject',
      verdictLabelAr: !setupOk ? 'تحقق من الإضاءة' : apiOk ? 'مقبول API 1104' : 'مرفوض API 1104',
      verdictLabelEn: !setupOk ? 'WARN — Verify Setup' : apiOk ? 'PASS — API 1104' : 'REJECT — API 1104',
      requirementAr: `عضة ≤ ${api1104UndercutMax}mm (أو 12.5% t) · طول ≤ 50mm · Hi-Lo ≤ 3.0mm`,
      requirementEn: `Undercut ≤ ${api1104UndercutMax}mm (12.5%t) · Length ≤ 50mm · Hi-Lo ≤ 3mm`,
      measuredSummaryAr: `عضة ${input.undercutDepthMm}mm · طول ${input.discontinuityLengthMm}mm`,
      measuredSummaryEn: `Undercut ${input.undercutDepthMm}mm · Length ${input.discontinuityLengthMm}mm`,
      remediationAr: apiOk ? 'مقبول لخطوط أنابيب النفط والغاز.' : 'يلزم لحام تعبئة أو قطع للوصلة في خط الأنابيب.',
      remediationEn: apiOk ? 'Pipeline girth weld complies with API 1104.' : 'Repair undercut or cut out defective girth weld.',
    },
    {
      codeId: 'ISO_5817_B',
      codeName: 'ISO 5817',
      clauseRef: 'Quality Level B (Stringent)',
      verdict: !setupOk ? 'warn' : isoOk ? 'pass' : 'reject',
      verdictLabelAr: !setupOk ? 'تحقق من الإضاءة' : isoOk ? 'مقبول ISO 5817-B' : 'مرفوض ISO 5817-B',
      verdictLabelEn: !setupOk ? 'WARN — Verify Setup' : isoOk ? 'PASS — ISO 5817-B' : 'REJECT — ISO 5817-B',
      requirementAr: `تاج ≤ ${iso5817CapMax}mm · عضة ≤ 0.5mm · صفر شروخ`,
      requirementEn: `Cap ≤ ${iso5817CapMax}mm · Undercut ≤ 0.5mm · Zero cracks`,
      measuredSummaryAr: `تاج ${input.capReinforcementMm}mm · عضة ${input.undercutDepthMm}mm`,
      measuredSummaryEn: `Cap ${input.capReinforcementMm}mm · Undercut ${input.undercutDepthMm}mm`,
      remediationAr: isoOk ? 'يستوفي أعلى درجات الجودة ISO 5817-B.' : 'يتطلب تشطيب أملس لخفض العضة ≤ 0.5 mm.',
      remediationEn: isoOk ? 'Satisfies stringent ISO 5817 Quality Level B.' : 'Requires TIG dressing/repair to keep undercut ≤0.5mm.',
    },
  ];
}

export function computeVt4dTelemetry(input: VtSimInput, timeProgress01: number): Ar4dUnifiedTelemetry {
  const t = Math.max(0, Math.min(1, timeProgress01));
  const meta = AR4D_VT_MT_PT_PWHT_DISCIPLINES[0];
  let phaseIndex = 0;
  for (let i = meta.phases.length - 1; i >= 0; i -= 1) {
    if (t * 100 >= meta.phases[i].progressPct) {
      phaseIndex = i;
      break;
    }
  }
  const activePhase = meta.phases[phaseIndex];
  const codeReviews = evaluateVtAcrossCodes(input);
  const overallPass = codeReviews.every((r) => r.verdict === 'pass');

  return {
    discipline: 'vt',
    timeProgress01: t,
    phaseIndex,
    activePhaseLabelAr: activePhase.labelAr,
    activePhaseLabelEn: activePhase.labelEn,
    metric1LabelAr: 'الشدة الضوئية / المسافة',
    metric1LabelEn: 'Lux / Eye Distance',
    metric1Value: `${input.illuminationLux} Lx · ${input.viewingDistanceMm}mm`,
    metric2LabelAr: 'ارتفاع التاج (Cambridge)',
    metric2LabelEn: 'Weld Crown Cap',
    metric2Value: `${input.capReinforcementMm.toFixed(1)} mm`,
    metric3LabelAr: 'عمق العضة / Hi-Lo',
    metric3LabelEn: 'Undercut / Hi-Lo',
    metric3Value: `${input.undercutDepthMm.toFixed(2)} / ${input.hiLoMismatchMm.toFixed(1)} mm`,
    metric4LabelAr: 'موضع المسح 4D',
    metric4LabelEn: '4D Gauge Sweep',
    metric4Value: `${Math.round(t * 200)} mm`,
    overallPass,
    overallVerdictAr: overallPass ? 'مقبول بجميع أكواد VT الخمسة' : 'توجد مخالفة في كود أو أكثر',
    overallVerdictEn: overallPass ? 'PASS Across All 5 VT Codes' : 'Code Violation Detected — Review Matrix',
    codeReviews,
    visualState: {
      thermalNormalized01: 0,
      liveTempC: 25,
      capillaryBleed01: 0,
      fluxIntensity01: Math.min(1, input.illuminationLux / 1500),
      laserSweepNorm01: t,
      defectSeverity01: input.hasSurfaceCrackOrPin || input.undercutDepthMm > 0.5 ? 0.9 : 0.25,
    },
  };
}

// ============================================================================
// 2. MT MULTI-CODE REVIEW & 4D COMPUTATION
// ============================================================================

export function evaluateMtAcrossCodes(input: MtSimInput): CodeClauseReviewItem[] {
  const minLiftKg = input.mode === 'dc_yoke' ? 18.1 : input.mode === 'ac_yoke' ? 4.5 : 4.5;
  const liftOk = input.yokeLiftKg >= minLiftKg;
  const spacingOk = input.poleSpacingMm >= 75 && input.poleSpacingMm <= 200;
  const lightOk = input.uvaIntensityUwCm2 >= 1000 && input.ambientLightLux <= 20;
  const setupOk = liftOk && spacingOk && lightOk && input.twoDirectionScan;

  const isLinear = input.morphology === 'linear';
  const asmeApp6Ok =
    input.indicationSizeMm <= 1.5 ||
    (!isLinear && input.indicationSizeMm <= 5.0 && input.alignedCount < 4);
  const awsOk = !isLinear && input.indicationSizeMm <= 3.0;
  const astmDemagOk = input.residualGauss <= 3.0 && setupOk;
  const iso23278Ok = isLinear ? input.indicationSizeMm <= 3.0 : input.indicationSizeMm <= 4.0;

  return [
    {
      codeId: 'ASME_V_ART7',
      codeName: 'ASME Sec. V Art. 7',
      clauseRef: 'T-762 / T-777',
      verdict: setupOk ? 'pass' : 'reject',
      verdictLabelAr: setupOk ? 'معايرة MT مطابقة' : 'خلل في المعايرة/الإضاءة',
      verdictLabelEn: setupOk ? 'PASS — Art. 7 Calibrated' : 'REJECT — Calibration/UV Fail',
      requirementAr: `رفع ≥ ${minLiftKg}kg · فك 75–200mm · UV-A ≥ 1000 µW/cm² · إعتام ≤ 20 Lx · اتجاهين 90°`,
      requirementEn: `Lift ≥ ${minLiftKg}kg · Poles 75–200mm · UV ≥ 1000 · Ambient ≤ 20 Lx · 2-Way`,
      measuredSummaryAr: `${input.yokeLiftKg}kg · ${input.poleSpacingMm}mm · ${input.uvaIntensityUwCm2}µW · ${input.ambientLightLux}Lx`,
      measuredSummaryEn: `${input.yokeLiftKg}kg · ${input.poleSpacingMm}mm · ${input.uvaIntensityUwCm2}µW · ${input.ambientLightLux}Lx`,
      remediationAr: setupOk ? 'اختبار قوة الرفع وشروط UV-A جاهزة.' : 'تأكد من قوة الرفع، التعتيم ≤ 20 Lux، والمسح في اتجاهين متعامدين.',
      remediationEn: setupOk ? 'Yoke lift power and UV-A darkroom verified.' : 'Meet min lift weight, keep ambient ≤20 Lux & scan 2 orthogonal directions.',
    },
    {
      codeId: 'ASME_VIII_APP6',
      codeName: 'ASME VIII Div.1 App.6',
      clauseRef: 'Mandatory App. 6-4',
      verdict: !setupOk ? 'warn' : asmeApp6Ok ? 'pass' : 'reject',
      verdictLabelAr: !setupOk ? 'أكمل المعايرة أولاً' : asmeApp6Ok ? 'مقبول App.6' : 'مرفوض App.6',
      verdictLabelEn: !setupOk ? 'WARN — Fix Setup' : asmeApp6Ok ? 'PASS — App. 6' : 'REJECT — App. 6',
      requirementAr: 'صفر دلالات خطية > 1.5mm · الدائرية ≤ 5.0mm · < 4 متراصة',
      requirementEn: 'Zero linear > 1.5mm · Rounded ≤ 5.0mm · < 4 aligned in line',
      measuredSummaryAr: `${isLinear ? 'خطية' : 'دائرية'} ${input.indicationSizeMm}mm (عدد ${input.alignedCount})`,
      measuredSummaryEn: `${input.morphology} ${input.indicationSizeMm}mm (aligned ${input.alignedCount})`,
      remediationAr: asmeApp6Ok ? 'الدلالة ضمن حدود App.6 لأوعية الضغط.' : 'أزل الدلالة الخطية/المتراصة بالطحن وأعد الفحص واطبق اللحام.',
      remediationEn: asmeApp6Ok ? 'Acceptable per ASME VIII App. 6 pressure vessel rules.' : 'Grind out linear >1.5mm or excessive rounded indication & re-MT.',
    },
    {
      codeId: 'AWS_D1_1_MT',
      codeName: 'AWS D1.1',
      clauseRef: 'Cl. 8.10 / Table 6.1',
      verdict: !setupOk ? 'warn' : awsOk ? 'pass' : 'reject',
      verdictLabelAr: !setupOk ? 'أكمل المعايرة أولاً' : awsOk ? 'مقبول AWS D1.1' : 'مرفوض AWS D1.1',
      verdictLabelEn: !setupOk ? 'WARN — Fix Setup' : awsOk ? 'PASS — AWS D1.1' : 'REJECT — AWS D1.1',
      requirementAr: 'صفر شروخ خطية · مسامات سطحية دائرية ≤ 3.0mm',
      requirementEn: 'Zero planar cracks · Surface porosity rounded ≤ 3.0mm',
      measuredSummaryAr: `${input.morphology} ${input.indicationSizeMm}mm`,
      measuredSummaryEn: `${input.morphology} ${input.indicationSizeMm}mm`,
      remediationAr: awsOk ? 'مطابق لمعايير الهياكل المعدنية AWS D1.1.' : 'الدلالة السطحية مرفوضة إنشائياً وتحتاج إصلاح.',
      remediationEn: awsOk ? 'Meets AWS D1.1 structural weld acceptance.' : 'Linear or >3mm surface discontinuity rejected per AWS D1.1.',
    },
    {
      codeId: 'ASTM_E709',
      codeName: 'ASTM E709 / E1444',
      clauseRef: 'Sec. 14 / 19',
      verdict: astmDemagOk ? 'pass' : 'warn',
      verdictLabelAr: astmDemagOk ? 'مقبول مع إزالة المغنطة' : 'تحذير مغنطة متبقية / إجراء',
      verdictLabelEn: astmDemagOk ? 'PASS — E709 Compliant' : 'WARN — Check Demag ≤ 3G',
      requirementAr: 'مجال متبقي بعد الفحص ≤ 3 Gauss · تغطية 90° متعامدة',
      requirementEn: 'Post-test residual magnetism ≤ 3 Gauss · 90° overlap',
      measuredSummaryAr: `متبقي ${input.residualGauss} Gauss · متعامد: ${input.twoDirectionScan ? 'نعم' : 'لا'}`,
      measuredSummaryEn: `Residual ${input.residualGauss} Gauss · 2-Way: ${input.twoDirectionScan ? 'Yes' : 'No'}`,
      remediationAr: astmDemagOk ? 'المجال المتبقي مأمون قبل اللحام/التشغيل.' : 'مرّر الحدوة AC بالابتعاد التدريجي حتى ينخفض المجال المتبقي إلى ≤ 3 Gauss.',
      remediationEn: astmDemagOk ? 'Residual magnetism safely below 3 Gauss.' : 'Demagnetize gradually until Gaussmeter reads ≤ 3 Gauss.',
    },
    {
      codeId: 'ISO_23278',
      codeName: 'ISO 23278',
      clauseRef: 'Level 2X',
      verdict: !setupOk ? 'warn' : iso23278Ok ? 'pass' : 'reject',
      verdictLabelAr: !setupOk ? 'أكمل المعايرة أولاً' : iso23278Ok ? 'مقبول ISO 23278-2X' : 'مرفوض ISO 23278-2X',
      verdictLabelEn: !setupOk ? 'WARN — Fix Setup' : iso23278Ok ? 'PASS — ISO 23278-2X' : 'REJECT — ISO 23278-2X',
      requirementAr: 'المستوى 2X: الخطية ≤ 3.0mm · غير الخطية ≤ 4.0mm',
      requirementEn: 'Level 2X: Linear ≤ 3.0mm · Non-linear ≤ 4.0mm',
      measuredSummaryAr: `${input.indicationSizeMm}mm`,
      measuredSummaryEn: `${input.indicationSizeMm}mm`,
      remediationAr: iso23278Ok ? 'مطابق للمستوى القياسي ISO 23278 Level 2X.' : 'تجاوز حد الطول المسموح لـ Level 2X.',
      remediationEn: iso23278Ok ? 'Complies with ISO 23278 Acceptance Level 2X.' : 'Exceeds ISO 23278 Level 2X indication dimensions.',
    },
  ];
}

export function computeMt4dTelemetry(input: MtSimInput, timeProgress01: number): Ar4dUnifiedTelemetry {
  const t = Math.max(0, Math.min(1, timeProgress01));
  const meta = AR4D_VT_MT_PT_PWHT_DISCIPLINES[1];
  let phaseIndex = 0;
  for (let i = meta.phases.length - 1; i >= 0; i -= 1) {
    if (t * 100 >= meta.phases[i].progressPct) {
      phaseIndex = i;
      break;
    }
  }
  const activePhase = meta.phases[phaseIndex];
  const fluxPct = Math.round(Math.min(100, (t < 0.85 ? t / 0.65 : Math.max(0.1, 1 - (t - 0.85) * 6)) * 100));
  const codeReviews = evaluateMtAcrossCodes(input);
  const overallPass = codeReviews.every((r) => r.verdict === 'pass');

  return {
    discipline: 'mt',
    timeProgress01: t,
    phaseIndex,
    activePhaseLabelAr: activePhase.labelAr,
    activePhaseLabelEn: activePhase.labelEn,
    metric1LabelAr: 'اختبار الرفع / الفك',
    metric1LabelEn: 'Yoke Lift / Spacing',
    metric1Value: `${input.yokeLiftKg.toFixed(1)} kg · ${input.poleSpacingMm}mm`,
    metric2LabelAr: 'كثافة الفيض 4D',
    metric2LabelEn: '4D Flux Saturation',
    metric2Value: `${fluxPct}% (${input.twoDirectionScan ? '0°+90°' : '0° only'})`,
    metric3LabelAr: 'إضاءة UV-A / الإعتام',
    metric3LabelEn: 'UV-A / Darkroom',
    metric3Value: `${input.uvaIntensityUwCm2} µW · ${input.ambientLightLux} Lx`,
    metric4LabelAr: 'الدلالة / المتبقي',
    metric4LabelEn: 'Indication / Residual',
    metric4Value: `${input.indicationSizeMm.toFixed(1)}mm · ${input.residualGauss.toFixed(1)}G`,
    overallPass,
    overallVerdictAr: overallPass ? 'مقبول بجميع أكواد MT الخمسة' : 'يوجد عيب أو شرط معايرة مخالف',
    overallVerdictEn: overallPass ? 'PASS Across All 5 MT Codes' : 'MT Code Defect or Setup Rejection',
    codeReviews,
    visualState: {
      thermalNormalized01: 0,
      liveTempC: 25,
      capillaryBleed01: Math.min(1, t * 1.15),
      fluxIntensity01: Math.min(1, (t * input.yokeLiftKg) / 10),
      laserSweepNorm01: t,
      defectSeverity01: input.indicationSizeMm > 1.5 ? 0.9 : 0.35,
    },
  };
}

// ============================================================================
// 3. PT MULTI-CODE REVIEW & 4D COMPUTATION
// ============================================================================

export function evaluatePtAcrossCodes(input: PtSimInput): CodeClauseReviewItem[] {
  const isFluorescent = input.systemType !== 'type2_visible_solvent_c';
  const tempOk = input.surfaceTempC >= 10 && input.surfaceTempC <= 52;
  const minDwell = input.systemType === 'type1_water_method_a' ? 10 : 5;
  const dwellOk = input.dwellTimeMin >= minDwell;
  const devOk = input.developerEvalMin >= 10 && input.developerEvalMin <= 60;
  const lightOk = isFluorescent
    ? input.lightLevel >= 1000 && input.ambientDarkLux <= 20
    : input.lightLevel >= 1076;
  const impurityOk =
    input.alloyGroup === 'carbon_steel' || input.halogenSulfurPpm <= 250;

  const t641SetupOk = tempOk && dwellOk && devOk && lightOk && impurityOk;
  const isLinear = input.morphology === 'linear';
  const app8Ok =
    input.indicationSizeMm <= 1.5 ||
    (!isLinear && input.indicationSizeMm <= 5.0 && input.alignedCount < 4);
  const iso23277Ok = isLinear ? input.indicationSizeMm <= 3.0 : input.indicationSizeMm <= 4.0;
  const awsOk = !isLinear && input.indicationSizeMm <= 3.0;

  return [
    {
      codeId: 'ASME_V_ART6',
      codeName: 'ASME Sec. V Art. 6',
      clauseRef: 'T-641 / T-652 / T-672',
      verdict: t641SetupOk ? 'pass' : 'reject',
      verdictLabelAr: t641SetupOk ? 'إجراء PT مطابق بالكامل' : 'مخالفة حرارة/تغلغل/شوائب',
      verdictLabelEn: t641SetupOk ? 'PASS — Art. 6 Compliant' : 'REJECT — Procedure Out of Band',
      requirementAr: `حرارة 10–52°C · تغلغل ≥ ${minDwell}m · مُظهر 10–60m · هالوجين/كبريت SS ≤ 250 ppm`,
      requirementEn: `Temp 10–52°C · Dwell ≥ ${minDwell}m · Dev 10–60m · SS Halogens ≤ 250 ppm`,
      measuredSummaryAr: `${input.surfaceTempC}°C · ${input.dwellTimeMin}m · Dev ${input.developerEvalMin}m · ${input.halogenSulfurPpm} ppm`,
      measuredSummaryEn: `${input.surfaceTempC}°C · ${input.dwellTimeMin}m · Dev ${input.developerEvalMin}m · ${input.halogenSulfurPpm} ppm`,
      remediationAr: t641SetupOk
        ? 'نافذة الحرارة، زمن التغلغل، والمُظهر مستوفاة.'
        : !impurityOk
          ? 'خطر تشقق تآكلي على الستانلس/النيكل! استخدم سوائل معتمدة ≤ 250 ppm هالوجين/كبريت.'
          : 'اضبط حرارة السطح (10–52°C) وأزمنة التغلغل والمُظهر.',
      remediationEn: t641SetupOk
        ? 'Surface thermal window, dwell & developer timing verified.'
        : !impurityOk
          ? 'Stress-corrosion risk on SS/Ni! Switch to low-halogen certified batch (≤250 ppm).'
          : 'Adjust surface temperature (10–52°C) and dwell/developer windows.',
    },
    {
      codeId: 'ASME_VIII_APP8',
      codeName: 'ASME VIII Div.1 App.8',
      clauseRef: 'Mandatory App. 8-4',
      verdict: !t641SetupOk ? 'warn' : app8Ok ? 'pass' : 'reject',
      verdictLabelAr: !t641SetupOk ? 'راجع إجراء PT' : app8Ok ? 'مقبول App.8' : 'مرفوض App.8',
      verdictLabelEn: !t641SetupOk ? 'WARN — Fix Setup' : app8Ok ? 'PASS — App. 8' : 'REJECT — App. 8',
      requirementAr: 'صفر دلالات خطية > 1.5mm · الدائرية ≤ 5.0mm · < 4 متراصة',
      requirementEn: 'Zero linear > 1.5mm · Rounded ≤ 5.0mm · < 4 aligned in line',
      measuredSummaryAr: `${input.morphology} ${input.indicationSizeMm}mm`,
      measuredSummaryEn: `${input.morphology} ${input.indicationSizeMm}mm`,
      remediationAr: app8Ok ? 'الدلالة مقبولة وفق ASME VIII App. 8.' : 'اطحن العيب السطحي وأعد الفحص بالسائل النافذ بعد الترميم.',
      remediationEn: app8Ok ? 'Acceptable per ASME VIII App. 8.' : 'Excavate linear >1.5mm or oversized rounded bleed indication.',
    },
    {
      codeId: 'ASTM_E165',
      codeName: 'ASTM E165 / E1417',
      clauseRef: 'Sec. 8.9 Illumination',
      verdict: lightOk ? 'pass' : 'reject',
      verdictLabelAr: lightOk ? 'إضاءة ASTM مطابقة' : 'قصور في شدة الإضاءة',
      verdictLabelEn: lightOk ? 'PASS — E165 Light Met' : 'REJECT — Illumination Fail',
      requirementAr: isFluorescent ? 'UV-A ≥ 1000 µW/cm² وإعتام ≤ 20 Lx' : 'ضوء أبيض ≥ 1076 Lux على السطح',
      requirementEn: isFluorescent ? 'UV-A ≥ 1000 µW/cm² & Dark ≤ 20 Lx' : 'White Light ≥ 1076 Lux',
      measuredSummaryAr: `${input.lightLevel} ${isFluorescent ? 'µW/cm²' : 'Lux'}`,
      measuredSummaryEn: `${input.lightLevel} ${isFluorescent ? 'µW/cm²' : 'Lux'}`,
      remediationAr: lightOk ? 'تباين رؤية الدلالة الفلورية/المرئية كافٍ.' : 'عاير كشاف UV-A أو مصباح الفحص الأبيض للحد الأدنى المعتمد.',
      remediationEn: lightOk ? 'Sufficient visual/fluorescent contrast achieved.' : 'Restore UV-A / white lux output to ASTM E165 minimum.',
    },
    {
      codeId: 'AWS_D1_1_PT',
      codeName: 'AWS D1.1',
      clauseRef: 'Cl. 8.10 Surface NDE',
      verdict: !t641SetupOk ? 'warn' : awsOk ? 'pass' : 'reject',
      verdictLabelAr: !t641SetupOk ? 'راجع إجراء PT' : awsOk ? 'مقبول AWS D1.1' : 'مرفوض AWS D1.1',
      verdictLabelEn: !t641SetupOk ? 'WARN — Fix Setup' : awsOk ? 'PASS — AWS D1.1' : 'REJECT — AWS D1.1',
      requirementAr: 'صفر شروخ خطية أو عدم انصهار · الدائري ≤ 3.0mm',
      requirementEn: 'Zero linear cracks/LOF · Rounded surface pore ≤ 3.0mm',
      measuredSummaryAr: `${input.morphology} ${input.indicationSizeMm}mm`,
      measuredSummaryEn: `${input.morphology} ${input.indicationSizeMm}mm`,
      remediationAr: awsOk ? 'سطح اللحام خالٍ من الشقوق الخطية.' : 'إصلاح فوري لأي شرخ أو مسامية > 3mm.',
      remediationEn: awsOk ? 'Weld face conforms to AWS D1.1.' : 'Repair open surface crack or pore > 3.0mm.',
    },
    {
      codeId: 'ISO_23277',
      codeName: 'ISO 3452-1 / ISO 23277',
      clauseRef: 'Level 2X',
      verdict: !t641SetupOk ? 'warn' : iso23277Ok ? 'pass' : 'reject',
      verdictLabelAr: !t641SetupOk ? 'راجع إجراء PT' : iso23277Ok ? 'مقبول ISO 23277-2X' : 'مرفوض ISO 23277-2X',
      verdictLabelEn: !t641SetupOk ? 'WARN — Fix Setup' : iso23277Ok ? 'PASS — ISO 23277-2X' : 'REJECT — ISO 23277-2X',
      requirementAr: 'Level 2X: الخطية ≤ 3.0mm · غير الخطية ≤ 4.0mm',
      requirementEn: 'Level 2X: Linear ≤ 3.0mm · Non-linear ≤ 4.0mm',
      measuredSummaryAr: `${input.indicationSizeMm}mm`,
      measuredSummaryEn: `${input.indicationSizeMm}mm`,
      remediationAr: iso23277Ok ? 'مطابق لـ ISO 23277 Level 2X.' : 'تجاوز حدود النزف المسموح في ISO 23277.',
      remediationEn: iso23277Ok ? 'Complies with ISO 23277 Level 2X.' : 'Exceeds ISO 23277 Level 2X bleed-out tolerance.',
    },
  ];
}

export function computePt4dTelemetry(input: PtSimInput, timeProgress01: number): Ar4dUnifiedTelemetry {
  const t = Math.max(0, Math.min(1, timeProgress01));
  const meta = AR4D_VT_MT_PT_PWHT_DISCIPLINES[2];
  let phaseIndex = 0;
  for (let i = meta.phases.length - 1; i >= 0; i -= 1) {
    if (t * 100 >= meta.phases[i].progressPct) {
      phaseIndex = i;
      break;
    }
  }
  const activePhase = meta.phases[phaseIndex];
  const capillaryDepthPct = t < 0.65 ? Math.round((t / 0.65) * 100) : 100;
  const bleedOutGrowth01 = t < 0.65 ? 0 : Math.min(1, (t - 0.65) / 0.35);
  const effectiveBleedMm = Number((input.indicationSizeMm * (0.25 + 0.75 * bleedOutGrowth01)).toFixed(2));
  const codeReviews = evaluatePtAcrossCodes(input);
  const overallPass = codeReviews.every((r) => r.verdict === 'pass');

  return {
    discipline: 'pt',
    timeProgress01: t,
    phaseIndex,
    activePhaseLabelAr: activePhase.labelAr,
    activePhaseLabelEn: activePhase.labelEn,
    metric1LabelAr: 'تغلغل شعري 4D',
    metric1LabelEn: '4D Capillary Fill',
    metric1Value: `${capillaryDepthPct}% (${input.dwellTimeMin}m)`,
    metric2LabelAr: 'نمو نزف المُظهر 4D',
    metric2LabelEn: '4D Bleed-Out Size',
    metric2Value: `${effectiveBleedMm} / ${input.indicationSizeMm.toFixed(1)} mm`,
    metric3LabelAr: 'الحرارة والشوائب',
    metric3LabelEn: 'Temp / SS Halogens',
    metric3Value: `${input.surfaceTempC}°C · ${input.halogenSulfurPpm}ppm`,
    metric4LabelAr: 'زمن التقييم / الإضاءة',
    metric4LabelEn: 'Dev Window / Light',
    metric4Value: `${input.developerEvalMin}m · ${input.lightLevel}`,
    overallPass,
    overallVerdictAr: overallPass ? 'مقبول بجميع أكواد PT الخمسة' : 'مخالفة في الإجراء أو حجم الدلالة',
    overallVerdictEn: overallPass ? 'PASS Across All 5 PT Codes' : 'PT Procedure Violation or Defect Reject',
    codeReviews,
    visualState: {
      thermalNormalized01: 0,
      liveTempC: input.surfaceTempC,
      capillaryBleed01: bleedOutGrowth01,
      fluxIntensity01: Math.min(1, input.lightLevel / 1400),
      laserSweepNorm01: t,
      defectSeverity01: input.indicationSizeMm > 1.5 ? 0.92 : 0.3,
    },
  };
}

// ============================================================================
// 4. PWHT MULTI-CODE REVIEW & 4D THERMAL CYCLE COMPUTATION
// ============================================================================

export function computePwhtCycleDerivatives(input: PwhtSimInput) {
  const pSpec = PWHT_PNUMBER_SPECS[input.pNumber];
  const minRequiredHoldMin =
    input.wallThicknessMm <= 25
      ? Math.max(15, Math.round((input.wallThicknessMm / 25) * pSpec.minHoldPer25mmMin))
      : Math.round((input.wallThicknessMm / 25) * pSpec.minHoldPer25mmMin);

  // ASME Sec. VIII UCS-56 & B31.3 thickness-adjusted ramp/cool ceiling above 315°C / 425°C
  const maxAllowedRampRate = Math.min(220, Math.max(55, Math.round(5588 / Math.max(25, input.wallThicknessMm))));
  const maxAllowedCoolRate = Math.min(260, Math.max(55, Math.round(6985 / Math.max(25, input.wallThicknessMm))));

  // AWS D10.10 bands
  const radiusMm = input.pipeOdMm / 2;
  const soakBandMm = Math.round(input.weldWidthMm + 2 * input.wallThicknessMm);
  const heatedBandMm = Math.round(soakBandMm + 4 * Math.sqrt(Math.max(1, radiusMm * input.wallThicknessMm)));

  // Predicted residual stress relief & hardness tempering
  const soakTempOk = input.targetSoakC >= pSpec.minSoakC && input.targetSoakC <= pSpec.maxSoakC;
  const holdFactor = Math.min(1.15, input.soakHoldMin / Math.max(15, minRequiredHoldMin));
  const tempEfficacy = Math.max(0.25, Math.min(1.1, (input.targetSoakC - 480) / (pSpec.minSoakC - 480)));
  const finalStressReliefPct = Number(Math.min(96, 86 * holdFactor * Math.min(1.04, tempEfficacy)).toFixed(1));
  const postHardnessHv = Math.round(
    Math.max(155, pSpec.prePwhtTypicalHv - finalStressReliefPct * (pSpec.id === 'P1' ? 1.05 : pSpec.id === 'P5A' ? 1.52 : 1.28))
  );
  const postHardnessHbw = Math.round(postHardnessHv * 0.945);

  return {
    pSpec,
    minRequiredHoldMin,
    maxAllowedRampRate,
    maxAllowedCoolRate,
    soakBandMm,
    heatedBandMm,
    soakTempOk,
    finalStressReliefPct,
    postHardnessHv,
    postHardnessHbw,
  };
}

export function evaluatePwhtAcrossCodes(input: PwhtSimInput): CodeClauseReviewItem[] {
  const d = computePwhtCycleDerivatives(input);
  const b313Ok = d.soakTempOk && input.soakHoldMin >= d.minRequiredHoldMin;
  const ucs56Ok =
    d.soakTempOk &&
    input.soakHoldMin >= d.minRequiredHoldMin &&
    input.rampRateCPerHr <= d.maxAllowedRampRate &&
    input.coolRateCPerHr <= d.maxAllowedCoolRate;
  const d1010Ok = input.tcSpreadDeltaC <= 25;
  const naceLimitHv = d.pSpec.maxAllowedHardnessHv;
  const naceOk = !input.sourServiceNace || d.postHardnessHv <= naceLimitHv;
  const api510Ok = ucs56Ok && d1010Ok;

  return [
    {
      codeId: 'ASME_B31_3_331',
      codeName: 'ASME B31.3',
      clauseRef: 'Table 331.1.1',
      verdict: b313Ok ? 'pass' : 'reject',
      verdictLabelAr: b313Ok ? 'دورة نقع B31.3 مطابقة' : 'حرارة أو زمن نقع خارج الجدول',
      verdictLabelEn: b313Ok ? 'PASS — B31.3 Soak Met' : 'REJECT — Temp/Time Non-Compliant',
      requirementAr: `${input.pNumber}: ${d.pSpec.minSoakC}–${d.pSpec.maxSoakC}°C · نقع ≥ ${d.minRequiredHoldMin} min`,
      requirementEn: `${input.pNumber}: ${d.pSpec.minSoakC}–${d.pSpec.maxSoakC}°C · Hold ≥ ${d.minRequiredHoldMin} min`,
      measuredSummaryAr: `${input.targetSoakC}°C لمدة ${input.soakHoldMin} min`,
      measuredSummaryEn: `${input.targetSoakC}°C for ${input.soakHoldMin} min`,
      remediationAr: b313Ok
        ? 'درجة وزمن النقع مطابقان لـ Table 331.1.1.'
        : 'اضبط حرارة النقع داخل نافذة P-Number ومدّ زمن التثبيت حسب السماكة.',
      remediationEn: b313Ok
        ? 'Soak temperature and duration match ASME B31.3 Table 331.1.1.'
        : 'Center soak temperature inside P-Number band and meet minimum hold minutes.',
    },
    {
      codeId: 'ASME_VIII_UCS56',
      codeName: 'ASME Sec. VIII Div.1',
      clauseRef: 'UCS-56(d) Rates',
      verdict: ucs56Ok ? 'pass' : 'reject',
      verdictLabelAr: ucs56Ok ? 'معدلات UCS-56 مطابقة' : 'تجاوز معدل التسخين أو التبريد',
      verdictLabelEn: ucs56Ok ? 'PASS — UCS-56 Rates' : 'REJECT — Rate Too Fast',
      requirementAr: `صعود ≤ ${d.maxAllowedRampRate}°C/h · تبريد ≤ ${d.maxAllowedCoolRate}°C/h (فوق 315°C)`,
      requirementEn: `Ramp ≤ ${d.maxAllowedRampRate}°C/h · Cool ≤ ${d.maxAllowedCoolRate}°C/h (>315°C)`,
      measuredSummaryAr: `صعود ${input.rampRateCPerHr}°C/h · تبريد ${input.coolRateCPerHr}°C/h`,
      measuredSummaryEn: `Ramp ${input.rampRateCPerHr}°C/h · Cool ${input.coolRateCPerHr}°C/h`,
      remediationAr: ucs56Ok ? 'التدرج الحراري يحمي الوصلة من التواءات الصدمة الحرارية.' : 'خفّض معدل التسخين/التبريد حسب معادلة السماكة (5588/t).',
      remediationEn: ucs56Ok ? 'Ramp and cooling rates safely avoid thermal distortion.' : 'Reduce heating/cooling rate to satisfy UCS-56 thickness limit.',
    },
    {
      codeId: 'AWS_D10_10',
      codeName: 'AWS D10.10',
      clauseRef: 'W_hb Band & ΔT Spread',
      verdict: d1010Ok ? 'pass' : 'reject',
      verdictLabelAr: d1010Ok ? 'توزيع حراري ΔT مطابق' : 'فرق حرارة ΔT مرتفع (>25°C)',
      verdictLabelEn: d1010Ok ? 'PASS — AWS D10.10 Bands' : 'REJECT — Excessive ΔT Spread',
      requirementAr: `W_sb=${d.soakBandMm}mm · W_hb=${d.heatedBandMm}mm · ΔT قراءة ≤ 25°C`,
      requirementEn: `W_sb=${d.soakBandMm}mm · W_hb=${d.heatedBandMm}mm · TC ΔT ≤ 25°C`,
      measuredSummaryAr: `ΔT=${input.tcSpreadDeltaC}°C عبر قنوات Type-K`,
      measuredSummaryEn: `ΔT=${input.tcSpreadDeltaC}°C across Type-K zones`,
      remediationAr: d1010Ok ? 'تجانس حراري جيد بين أعلى وأسفل الماسورة.' : 'عدّل مناطق التحكم 6-Zone ووسّع العزل على القاع (Chimney Effect).',
      remediationEn: d1010Ok ? 'Uniform circumferential thermal soak.' : 'Balance multi-zone power output & reinforce insulation against chimney draft.',
    },
    {
      codeId: 'NACE_MR0175',
      codeName: 'NACE MR0175 / ISO 15156',
      clauseRef: 'Sour H₂S Hardness Cap',
      verdict: naceOk ? 'pass' : 'reject',
      verdictLabelAr: naceOk ? 'صلادة NACE مقبولة' : 'الصلادة تتجاوز 248 HV',
      verdictLabelEn: naceOk ? 'PASS — NACE ≤ 248 HV' : 'REJECT — Exceeds 248 HV',
      requirementAr: `صلادة HAZ بعد المعالجة ≤ ${naceLimitHv} HV (22 HRC / ${d.pSpec.maxAllowedHardnessHbw} HBW)`,
      requirementEn: `Post-PWHT HAZ hardness ≤ ${naceLimitHv} HV (22 HRC / ${d.pSpec.maxAllowedHardnessHbw} HBW)`,
      measuredSummaryAr: `${d.postHardnessHv} HV (${d.postHardnessHbw} HBW)`,
      measuredSummaryEn: `${d.postHardnessHv} HV (${d.postHardnessHbw} HBW)`,
      remediationAr: naceOk ? 'البنية المارتنسيتية خُمّدت بنجاح للخدمة الحمضية.' : 'يلزم إعادة معالجة حرارية لرفع التخميد وخفض الصلادة دون 248 HV.',
      remediationEn: naceOk ? 'Martensite successfully tempered for sour H2S service.' : 'Re-PWHT at upper soak band with adequate hold to drop hardness ≤248 HV.',
    },
    {
      codeId: 'API_510_PD5500',
      codeName: 'API 510 / PD 5500',
      clauseRef: 'Sec. 7.7 Thermal Traceability',
      verdict: api510Ok ? 'pass' : 'warn',
      verdictLabelAr: api510Ok ? 'سجل المخطط الحراري معتمد' : 'يتطلب مراجعة سجل الحرارة',
      verdictLabelEn: api510Ok ? 'PASS — Chart Traceable' : 'WARN — Audit Chart Deviation',
      requirementAr: 'منحنى مسجل متصل 6 قنوات + مطابقة الشدة والمعدلات',
      requirementEn: 'Continuous multi-TC chart recorder + verified soak/rates',
      measuredSummaryAr: `إزالة إجهاد ${d.finalStressReliefPct}%`,
      measuredSummaryEn: `${d.finalStressReliefPct}% residual stress relieved`,
      remediationAr: api510Ok ? 'مخطط المسجل الشريطي جاهز لاعتماد المفتش المعتمد AI.' : 'صحح أي انحراف في المعدلات أو ΔT قبل توقيع شهادة PWHT.',
      remediationEn: api510Ok ? 'Thermal chart ready for Authorized Inspector sign-off.' : 'Correct rate or ΔT excursions prior to PWHT certificate sign-off.',
    },
  ];
}

export function computePwht4dTelemetry(input: PwhtSimInput, timeProgress01: number): Ar4dUnifiedTelemetry {
  const t = Math.max(0, Math.min(1, timeProgress01));
  const meta = AR4D_VT_MT_PT_PWHT_DISCIPLINES[3];
  let phaseIndex = 0;
  for (let i = meta.phases.length - 1; i >= 0; i -= 1) {
    if (t * 100 >= meta.phases[i].progressPct) {
      phaseIndex = i;
      break;
    }
  }
  const activePhase = meta.phases[phaseIndex];
  const deriv = computePwhtCycleDerivatives(input);

  const ambient = 28;
  let liveTempC = ambient;
  if (t < 0.34) {
    liveTempC = ambient + (input.targetSoakC - ambient) * (t / 0.34);
  } else if (t < 0.72) {
    liveTempC = input.targetSoakC + Math.sin(t * 28) * 3;
  } else {
    liveTempC = input.targetSoakC - (input.targetSoakC - 210) * ((t - 0.72) / 0.28);
  }

  const thermalNorm = Math.max(0, Math.min(1, (liveTempC - ambient) / Math.max(100, input.targetSoakC - ambient)));
  const reliefProgress = Number((deriv.finalStressReliefPct * Math.pow(Math.min(1, t / 0.78), 1.35)).toFixed(1));
  const liveHv = Math.round(
    deriv.pSpec.prePwhtTypicalHv - (deriv.pSpec.prePwhtTypicalHv - deriv.postHardnessHv) * Math.min(1, t / 0.85)
  );
  const codeReviews = evaluatePwhtAcrossCodes(input);
  const overallPass = codeReviews.every((r) => r.verdict === 'pass');

  return {
    discipline: 'pwht',
    timeProgress01: t,
    phaseIndex,
    activePhaseLabelAr: activePhase.labelAr,
    activePhaseLabelEn: activePhase.labelEn,
    metric1LabelAr: 'الحرارة الحية للوصلة 4D',
    metric1LabelEn: 'Live 4D Joint Temp',
    metric1Value: `${Math.round(liveTempC)}°C / ${input.targetSoakC}°C`,
    metric2LabelAr: 'عرض نطاق Soak / Heated',
    metric2LabelEn: 'AWS D10.10 W_sb / W_hb',
    metric2Value: `${deriv.soakBandMm} / ${deriv.heatedBandMm} mm`,
    metric3LabelAr: 'إزالة الإجهاد والصلادة',
    metric3LabelEn: 'Stress Relief / Hardness',
    metric3Value: `${reliefProgress}% · ${liveHv} HV`,
    metric4LabelAr: 'النقع والمعدلات (ΔT)',
    metric4LabelEn: 'Hold & Ramp (ΔT)',
    metric4Value: `${input.soakHoldMin}m · ΔT ${input.tcSpreadDeltaC}°C`,
    overallPass,
    overallVerdictAr: overallPass ? 'دورة PWHT معتمدة بكل الأكواد الخمسة' : 'انحراف حراري أو صلادة تتجاوز الحد',
    overallVerdictEn: overallPass ? 'PASS Across All 5 PWHT Codes' : 'Thermal/Hardness Deviation — Review Codes',
    codeReviews,
    visualState: {
      thermalNormalized01: thermalNorm,
      liveTempC: Math.round(liveTempC),
      capillaryBleed01: 0,
      fluxIntensity01: thermalNorm,
      laserSweepNorm01: t,
      defectSeverity01: overallPass ? 0.15 : 0.85,
    },
  };
}
