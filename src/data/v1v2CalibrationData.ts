import { Language } from '../types';

export type CalibrationBlockId = 'v1_iso2400' | 'v2_iso7963' | 'weld_start_check';
export type V2BlockThicknessMm = 12.5 | 20;
export type CalibrationCodeId = 'iso_17640' | 'asme_sec_v' | 'aws_d1_1' | 'api_1104';

export interface BlockReflectorSpec {
  id: string;
  blockId: 'v1_iso2400' | 'v2_iso7963';
  codeTag: string;
  name: { ar: string; en: string };
  geometryType: 'quadrant_arc' | 'sdh_hole' | 'perspex_insert' | 'resolution_notch' | 'index_slot' | 'scale_engraving';
  dimensionsSummary: { ar: string; en: string };
  exactLocationMm: { ar: string; en: string };
  expectedSoundPathsMm: string;
  calibrationPurpose: { ar: string; en: string };
  isoTolerance: { ar: string; en: string };
  /** SVG highlight coordinates in block mm coordinate space */
  highlightMm: {
    cx: number;
    cy: number;
    r?: number;
    w?: number;
    h?: number;
  };
}

export interface CalibrationCodeRule {
  id: CalibrationCodeId;
  shortName: string;
  fullTitle: { ar: string; en: string };
  rangeLinearityToleranceMm: number;
  angleToleranceDeg: number;
  indexToleranceMm: number;
  refHeightFshPct: number;
  refHeightTolerancePct: number;
  scanningGainAddDb: number;
  transferCorrectionNote: { ar: string; en: string };
  startCheckClause: string;
  startCheckSummary: { ar: string; en: string };
}

export interface CalibrationStepSpec {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  id:
    | 'screen_zero_long'
    | 'resolution_deadzone'
    | 'beam_index_point'
    | 'shear_range_wedge_delay'
    | 'refracted_angle_verify'
    | 'reference_sensitivity_gain'
    | 'weld_start_check';
  shortTitle: { ar: string; en: string };
  fullTitle: { ar: string; en: string };
  recommendedTarget: CalibrationBlockId;
  codeReference: Record<CalibrationCodeId, string>;
  objective: { ar: string; en: string };
  operatorProcedure: { ar: string[]; en: string[] };
  acceptanceCriteriaLabel: { ar: string; en: string };
}

export const CALIBRATION_CODES: Record<CalibrationCodeId, CalibrationCodeRule> = {
  iso_17640: {
    id: 'iso_17640',
    shortName: 'ISO 17640 / ISO 2400 & 7963',
    fullTitle: {
      ar: 'الكود الأوروبي الدولي ISO 17640 مع بلوكات المعايرة ISO 2400 (V1) و ISO 7963 (V2)',
      en: 'ISO 17640 Weld UT with ISO 2400 (No. 1 / V1) & ISO 7963 (No. 2 / V2) Blocks',
    },
    rangeLinearityToleranceMm: 1.5,
    angleToleranceDeg: 2.0,
    indexToleranceMm: 1.0,
    refHeightFshPct: 80,
    refHeightTolerancePct: 4,
    scanningGainAddDb: 6,
    transferCorrectionNote: {
      ar: 'يُقاس فرق خشونة السطح بين البلوك الأملس وسطح اللحام الفعلي ويُضاف إذا تجاوز +2 dB (البند 8.4).',
      en: 'Surface transfer loss between smooth calibration block and parent metal is measured and added when > 2 dB (Cl. 8.4).',
    },
    startCheckClause: 'ISO 17640 Clauses 7, 8 & 9',
    startCheckSummary: {
      ar: 'يتطلب مسح منطقة حركة المجس بمجس 0° للتأكد من خلو المعدن الأم من التورق، والتحقق من نقطة الخروج والزاوية كل 4 ساعات عمل وعند بدء الفحص.',
      en: 'Requires 0° parent-metal scan across the full angle-beam scanning zone, plus index, angle, and sensitivity verification prior to weld start and every 4 hours.',
    },
  },
  asme_sec_v: {
    id: 'asme_sec_v',
    shortName: 'ASME Sec V Art. 4',
    fullTitle: {
      ar: 'الكود الأمريكي ASME BPVC Section V Article 4 (فحص اللحامات وأوعية الضغط)',
      en: 'ASME BPVC Section V, Article 4 — Ultrasonic Examination Methods for Welds',
    },
    rangeLinearityToleranceMm: 1.0,
    angleToleranceDeg: 2.0,
    indexToleranceMm: 1.0,
    refHeightFshPct: 80,
    refHeightTolerancePct: 5,
    scanningGainAddDb: 6,
    transferCorrectionNote: {
      ar: 'تُضبط القمة الأولية عند 80% FSH (±5%) ويُضاف حد أدنى +6 dB كسب مسح استكشافي أثناء الفحص اليدوي (T-472).',
      en: 'Primary reference level set at 80% FSH (±5% FSH) with mandatory +6 dB minimum scanning gain during manual search scan (T-472).',
    },
    startCheckClause: 'ASME Sec V Art. 4 — T-463, T-466 & T-472.1',
    startCheckSummary: {
      ar: 'يلزم فحص المعدن الأساسي بمجس مستقيم 0° في حيز حركة المجس الزاوي بالكامل، والتحقق من ثبات المعايرة قبل بدء اللحام وعند انتهاء الوردية (±2 dB / ±1% مدى).',
      en: 'Mandates straight-beam base metal scan across full angle-beam travel path (T-472.1.1) and calibration confirmation at start/finish within ±2 dB and ±1% sweep.',
    },
  },
  aws_d1_1: {
    id: 'aws_d1_1',
    shortName: 'AWS D1.1 Clause 8',
    fullTitle: {
      ar: 'كود المنشآت المعدنية الأمريكي AWS D1.1 Clause 8 (معايرة IIW Type 1 / Type 2)',
      en: 'AWS D1.1 Structural Welding Code — Steel, Clause 8 (IIW V1 & V2 Calibration)',
    },
    rangeLinearityToleranceMm: 1.0,
    angleToleranceDeg: 2.0,
    indexToleranceMm: 1.0,
    refHeightFshPct: 80,
    refHeightTolerancePct: 5,
    scanningGainAddDb: 6,
    transferCorrectionNote: {
      ar: 'تُعاير الحساسية المرجعية (Zero Reference Level b) على ثقب Ø1.5 مم ببلوك IIW مع معادلة التوهين d = a - b - c.',
      en: 'Zero Reference Level (b) established on IIW Ø1.5 mm hole with indication rating d = a - b - c (Cl. 8.24 / 8.25).',
    },
    startCheckClause: 'AWS D1.1 Clauses 8.22 – 8.26',
    startCheckSummary: {
      ar: 'تحديد مسافات Skip (Leg I, II, III) على سطح المعدن بجوار اللحام بالطباشير الصناعي وفحص التورق بمجس 0° قبل مسح الجذر والوجه.',
      en: 'Mark Leg I (S/2) and Leg II (S) skip distances adjacent to weld joint, perform 0° lamination scan, and confirm IIW angle ±2° before root/cap scanning.',
    },
  },
  api_1104: {
    id: 'api_1104',
    shortName: 'API 1104 Sec. 11.4',
    fullTitle: {
      ar: 'كود خطوط الأنابيب البترولية API 1104 Section 11.4 (اللحامات المحيطية للمواسير)',
      en: 'API Standard 1104 Section 11.4 — Ultrasonic Testing of Pipeline Girth Welds',
    },
    rangeLinearityToleranceMm: 1.0,
    angleToleranceDeg: 2.0,
    indexToleranceMm: 1.0,
    refHeightFshPct: 80,
    refHeightTolerancePct: 4,
    scanningGainAddDb: 6,
    transferCorrectionNote: {
      ar: 'يُضاف تصحيح انتقال السطح (+2 إلى +4 dB على سطح الأنبوب) متبوعاً بـ +6 dB كسب مسح ميداني (البند 11.4.5).',
      en: 'Pipe surface transfer loss (+2 to +4 dB) is added to 80% FSH primary reference plus +6 dB field scanning sensitivity (Sec. 11.4.5).',
    },
    startCheckClause: 'API 1104 Sections 11.4.4 – 11.4.6',
    startCheckSummary: {
      ar: 'قياس السماكة الفعلية وفحص شريط المسح 50 مم يمين ويسار اللحام بمجس 0°، وتحديد مسافة نصف القفزة للجذر والقفزة الكاملة للكاب على الماسورة قبل البدء.',
      en: 'Verify actual pipe wall thickness & parent metal cleanliness 50 mm from bevel with 0° probe, mark S/2 root and S cap standoffs, and verify couplant coupling.',
    },
  },
};

/**
 * Complete Geometry, Subdivisions & Machined Reference Reflectors for V1 Block (ISO 2400 / IIW Type 1)
 * Coordinate convention: Block origin (0,0) at top-left corner; Length X = 0..300 mm, Height Y = 0..100 mm, Thickness Z = 25 mm.
 * R100 curved quadrant is on the RIGHT end (center of curvature at X = 200 mm, Y = 0 mm, curving from (300, 0) down to (200, 100)).
 */
export const V1_BLOCK_METADATA = {
  standard: 'ISO 2400 / EN 12223 / ASTM E164 IIW Type 1',
  material: {
    ar: 'صلب كربوني منخفض الحبيبات مُطبّع (S355J0 Normalized Fine-Grain Steel)',
    en: 'Normalized Low-Carbon Fine-Grain Steel (S355J0 / ASTM A36 Normalized)',
  },
  overallDimensionsMm: {
    length: 300,
    height: 100,
    thickness: 25,
    massKg: 5.55,
  },
  acousticVelocitiesMs: {
    longitudinal: 5920,
    shear: 3255,
    perspexLongitudinal: 2720,
  },
};

export const V1_BLOCK_REFLECTORS: BlockReflectorSpec[] = [
  {
    id: 'v1_r100_quadrant',
    blockId: 'v1_iso2400',
    codeTag: 'R100',
    name: {
      ar: 'ربع الدائرة المنحني R100 مم + شق مركز الصفر (2×3 مم)',
      en: 'R100 mm Curved Quadrant Wall & Zero-Index Saw Slot (2×3 mm)',
    },
    geometryType: 'quadrant_arc',
    dimensionsSummary: {
      ar: 'نصف قطر انحناء R = 100.0 مم (±0.1 مم) بسمك 25 مم، مركزه عند حز الصفر العلوي (عرض 2 مم × عمق 3 مم).',
      en: 'Radius R = 100.0 mm (±0.1 mm), 25 mm wide, centered strictly at the 2 mm × 3 mm zero-index slot.',
    },
    exactLocationMm: {
      ar: 'مركز الانحناء عند X = 200.0 مم من الطرف الأيسر على السطح العلوي (Y = 0 مم)، ويمتد القوس حتى X = 300 مم.',
      en: 'Center of curvature at X = 200.0 mm from left end on top scanning face (Y = 0 mm); arc sweeps to X = 300 mm.',
    },
    expectedSoundPathsMm: '100.0 mm, 200.0 mm, 300.0 mm',
    calibrationPurpose: {
      ar: 'تحديد نقطة خروج الشعاع (Beam Index Point) لمجسات الزاوية ومعايرة مدى الشاشة والسرعة القصية وتأخير الويدج عند 100 و 200 مم.',
      en: 'Determines exact Shear-Wave Beam Index Point (BIP) and calibrates sweep range, shear velocity (3255 m/s), and wedge delay at 100 & 200 mm.',
    },
    isoTolerance: {
      ar: 'دقة نصف القطر ±0.10 مم · خشونة السطح Ra ≤ 1.6 µm',
      en: 'Radius ±0.10 mm · Surface finish Ra ≤ 1.6 µm',
    },
    highlightMm: { cx: 200, cy: 0, r: 100 },
  },
  {
    id: 'v1_perspex_50',
    blockId: 'v1_iso2400',
    codeTag: 'Ø50 / Ø23 PMMA',
    name: {
      ar: 'التجويف الأسطواني Ø50 مم بحشوة البيرسبكس الشفافة (سُمك 23.0 مم = 50 مم فولاذ)',
      en: 'Ø50.0 mm Bore with Concentric Perspex/PMMA Cylinder Insert (23.0 mm = 50 mm Steel Eq.)',
    },
    geometryType: 'perspex_insert',
    dimensionsSummary: {
      ar: 'ثقب دائري نافذ بقطر Ø50.0 مم بداخله قرص أكريليك (PMMA) متمركز بسمك 23.0 مم يكافئ مساراً صوتياً طولياً قدره 50.0 مم في الصلب.',
      en: 'Ø50.0 mm through-bore housing a 23.0 mm thick PMMA insert whose longitudinal transit time equals 50.0 mm in steel.',
    },
    exactLocationMm: {
      ar: 'المركز عند X = 100.0 مم من اليسار، وعلى عمق Y = 55.0 مم من السطح العلوي (45 مم من السطح السفلي).',
      en: 'Center at X = 100.0 mm from left end, Y = 55.0 mm below top surface (30 mm top ligament).',
    },
    expectedSoundPathsMm: '50.0 mm, 100.0 mm, 150.0 mm (0° through PMMA) | Large curved target for 60°–75°',
    calibrationPurpose: {
      ar: 'معايرة المدى لمجس 0° عند مضاعفات 50 مم، وضبط الحساسية المرجعية، والتحقق من الزوايا العالية (60°–75°) والمنطقة الميتة.',
      en: '50 mm multiple timebase check without probe movement, absorption/sensitivity reference, and 60°–75° high-angle verification.',
    },
    isoTolerance: {
      ar: 'المكافئ الصوتي 50.0 ± 0.2 مم طولي في الصلب',
      en: 'Acoustic equivalent 50.0 ± 0.2 mm longitudinal in steel',
    },
    highlightMm: { cx: 100, cy: 55, r: 25 },
  },
  {
    id: 'v1_sdh_1_5mm',
    blockId: 'v1_iso2400',
    codeTag: 'Ø1.5 SDH',
    name: {
      ar: 'الثقب الجانبي القياسي النافذ Ø1.5 مم (Reference SDH)',
      en: 'Ø1.5 mm Through-Drilled Side Reference Hole (SDH)',
    },
    geometryType: 'sdh_hole',
    dimensionsSummary: {
      ar: 'ثقب جانبي نافذ بقطر دقيق Ø1.50 مم بطول سماكة البلوك كاملة (25.0 مم) يمثل عيباً أسطوانياً قياسياً.',
      en: 'Ø1.50 mm precision through-drilled hole (25.0 mm length) acting as universal cylindrical reference reflector.',
    },
    exactLocationMm: {
      ar: 'المركز عند X = 35.0 مم من الحافة اليسرى، وعلى عمق Y = 15.0 مم تحت السطح العلوي (85.0 مم من السطح السفلي).',
      en: 'Center at X = 35.0 mm from left face, Y = 15.0 mm below top surface (85.0 mm above bottom surface).',
    },
    expectedSoundPathsMm: '21.2 mm (45°) · 30.0 mm (60°) · 43.9 mm (70°)',
    calibrationPurpose: {
      ar: 'التحقق الدقيق من زاوية الانكسار الفعلية (40°–60° من أعلى أو 60°–75° من أسفل) وضبط الحساسية المرجعية 80% FSH وفحص المنطقة الميتة.',
      en: 'Verifies true refracted beam angle β (40°–75°) against engraved side scales, sets 80% FSH reference gain, and checks near-surface dead zone.',
    },
    isoTolerance: {
      ar: 'قطر الثقب Ø1.50 ± 0.03 مم · العمق 15.0 ± 0.1 مم',
      en: 'Hole Ø1.50 ± 0.03 mm · Depth 15.0 ± 0.1 mm',
    },
    highlightMm: { cx: 35, cy: 15, r: 4 },
  },
  {
    id: 'v1_resolution_steps',
    blockId: 'v1_iso2400',
    codeTag: '85 / 91 / 100 mm',
    name: {
      ar: 'تدرجات وشق اختبار قوة التفريق المحوري (85 / 91 / 100 مم)',
      en: 'Axial Resolution Notched Step Triplet (85 mm / 91 mm / 100 mm Paths)',
    },
    geometryType: 'resolution_notch',
    dimensionsSummary: {
      ar: 'حز رأسي بعرض 2.0 مم وعمق 15.0 مم (مسار 85 مم) يجاوره كتف مدرج بعمق 9.0 مم وعرض 6.0 مم (مسار 91 مم) بجانب السطح الكامل (100 مم).',
      en: '2.0 mm × 15.0 mm slot (85 mm path) adjacent to a 6.0 mm wide × 9.0 mm step (91 mm path) and full 100 mm backwall.',
    },
    exactLocationMm: {
      ar: 'أسفل مركز R100 عند X = 192..200 مم على الوجه المقابل لسطح الفحص (مسارات ارتداد 85 و 91 و 100 مم من الأعلى).',
      en: 'Machined at X = 192..200 mm along the bottom edge directly opposite the top 0° compression scan zone.',
    },
    expectedSoundPathsMm: '85.0 mm · 91.0 mm · 100.0 mm (Δ = 6 mm & 9 mm)',
    calibrationPurpose: {
      ar: 'اختبار قوة تفريق (Resolution) المجس المستقيم 0° ومقاومة التخميد (Damping 50 Ω)؛ يجب ظهور 3 قمم منفصلة بوضوح دون اندماج.',
      en: 'Tests 0° straight-beam axial range resolution; an acceptable instrument/probe resolves three distinct non-merging peaks at 85, 91, and 100 mm.',
    },
    isoTolerance: {
      ar: 'الأعماق 85.0 / 91.0 / 100.0 مم بدقة ±0.1 مم',
      en: 'Step paths 85.0 / 91.0 / 100.0 mm ±0.1 mm',
    },
    highlightMm: { cx: 196, cy: 92, w: 12, h: 16 },
  },
  {
    id: 'v1_scales_and_thickness',
    blockId: 'v1_iso2400',
    codeTag: '25/100/200 + Scales',
    name: {
      ar: 'مسطرة نقطة الخروج (0–55 مم) وتدريجات الزوايا المحفورة (35°–75°) وسُمك 25 مم',
      en: 'Engraved Millimeter Index Ruler (0–55 mm), Angle Scales (35°–75°) & 25 mm Thickness',
    },
    geometryType: 'scale_engraving',
    dimensionsSummary: {
      ar: 'تقسيمات محفورة بالليزر كل 1 مم حول علامة الصفر، وتدريجان زاويان 40°–60° و 60°–75°، وأبعاد متعامدة 25 × 100 × 200 مم.',
      en: '1 mm engraved index divisions from R100 zero center, dual 40°–60° & 60°–75° degree scales, and 25 / 100 / 200 mm orthogonal paths.',
    },
    exactLocationMm: {
      ar: 'على الحواف العلوية والسفلية والوجه الجانبي للبلوك بطول 300 مم.',
      en: 'Engraved along top/bottom index edges and front/rear side faces of the 300 mm block.',
    },
    expectedSoundPathsMm: '25, 50, 75, 100 mm (Width) | 100, 200 mm (Height/Length)',
    calibrationPurpose: {
      ar: 'قراءة إزاحة نقطة خروج الشعاع بالمليمتر، وقراءة الزاوية الفعلية مباشرة بالدرجات، ومعايرة الخطية الأفقية لمجس 0°.',
      en: 'Direct visual readout of probe index offset in mm, refracted angle in degrees, and 0° horizontal timebase linearity.',
    },
    isoTolerance: {
      ar: 'دقة التقسيمات المحفورة ±0.2 مم / ±0.5°',
      en: 'Engraved scale accuracy ±0.2 mm / ±0.5°',
    },
    highlightMm: { cx: 45, cy: 50, w: 70, h: 90 },
  },
  {
    id: 'v1_zero_index_notch',
    blockId: 'v1_iso2400',
    codeTag: '2.0×3.0 mm Notch',
    name: {
      ar: 'حز الصفر المرجعي العلوي (2.0 × 3.0 مم) + شق الزاوية السفلي (2.0 × 15.0 مم)',
      en: 'Zero-Datum Reference Notch (2.0 × 3.0 mm) & Bottom Corner-Trap Slot (2.0 × 15.0 mm)',
    },
    geometryType: 'index_slot',
    dimensionsSummary: {
      ar: 'حز مرجعي مستطيل بعرض 2.0 مم وعمق 3.0 مم عند مركز قوس R100، مع شق سفلي عمودي 2.0 × 15.0 مم يعمل كعاكس ركني (Corner-Trap Notch) لضبط الحساسية السطحية.',
      en: 'Rectangular 2.0 mm wide × 3.0 mm deep datum slot at R100 center plus 2.0 × 15.0 mm bottom corner-trap slot for surface-breaking notch sensitivity.',
    },
    exactLocationMm: {
      ar: 'حز الصفر عند (X = 200.0 مم، Y = 0..3 مم) والشق الركني السفلي عند (X = 192..194 مم، Y = 85..100 مم).',
      en: 'Top datum notch at (X = 200.0 mm, Y = 0..3 mm); bottom corner-trap notch at (X = 192..194 mm, Y = 85..100 mm).',
    },
    expectedSoundPathsMm: '141.4 mm (45° Leg I) · 200.0 mm (60° Leg I)',
    calibrationPurpose: {
      ar: 'محاكاة الشروخ السطحية العمودية (Corner-Trap Effect) وضبط حساسية الشاشة 80% FSH على الحزوز المرجعية السطحية والجذرية.',
      en: 'Simulates surface-breaking planar cracks (corner-trap reflection) and establishes 80% FSH screen sensitivity on rectangular notches.',
    },
    isoTolerance: {
      ar: 'عرض الحز 2.0 ± 0.1 مم · تعامد الجوانب 90° ± 0.5°',
      en: 'Slot width 2.0 ± 0.1 mm · Sidewall perpendicularity 90° ± 0.5°',
    },
    highlightMm: { cx: 193, cy: 92, w: 6, h: 15 },
  },
];

/**
 * Complete Geometry, Subdivisions & Machined Reference Reflectors for V2 Block (ISO 7963 / IIW Type 2)
 * Total length X = 0..75 mm: Zero center at X = 25 mm on top scanning edge (Y = 0 mm).
 * Left curve = R25 mm (from X = 0 to X = 25), Right curve = R50 mm (from X = 75 down toward bottom), Height Y = 43 mm.
 */
export const V2_BLOCK_METADATA = {
  standard: 'ISO 7963 / EN 27963 (IIW Type 2 Miniature Calibration Block)',
  material: {
    ar: 'صلب كربوني منخفض الحبيبات مُطبّع (S355J0 Normalized Low-Carbon Steel)',
    en: 'Normalized Low-Carbon Fine-Grain Steel (S355J0)',
  },
  overallDimensionsMm: {
    length: 75, // R25 (left) + R50 (right)
    height: 43,
    thicknessOptions: [12.5, 20] as V2BlockThicknessMm[],
    massKg12_5: 0.23,
    massKg20: 0.37,
  },
  acousticVelocitiesMs: {
    longitudinal: 5920,
    shear: 3255,
  },
};

export const V2_BLOCK_REFLECTORS: BlockReflectorSpec[] = [
  {
    id: 'v2_r25_arc',
    blockId: 'v2_iso7963',
    codeTag: 'R25 mm',
    name: {
      ar: 'القوس المنحني الأصغر R25 مم (ارتدادات 25 / 100 / 175 مم)',
      en: 'R25.0 mm Concentric Quadrant Arc (Echoes at 25, 100, 175 mm)',
    },
    geometryType: 'quadrant_arc',
    dimensionsSummary: {
      ar: 'قوس أسطواني بنصف قطر R = 25.0 مم مركزه علامة الصفر (0) المحفورة على سطح الفحص العلوي.',
      en: 'Cylindrical arc of radius R = 25.0 mm centered on the engraved zero (0) index line.',
    },
    exactLocationMm: {
      ar: 'الطرف الأيسر للبلوك من X = 0 مم إلى مركز الصفر X = 25.0 مم.',
      en: 'Left quadrant spanning X = 0 mm to zero-center X = 25.0 mm.',
    },
    expectedSoundPathsMm: '25.0 mm (1st) · 100.0 mm (2nd via R50) · 175.0 mm (3rd)',
    calibrationPurpose: {
      ar: 'عند توجيه المجس نحو R25 يرتد الصدى الأول عند 25 مم ثم ينعكس عبر R50 ليعود عند 100 مم (25+25+50)، لضبط الصفر والمدى 100 مم بدقة.',
      en: 'Aiming at R25 yields echoes at 25 mm and 100 mm (25 + 25 + 50 round-trip off R50), calibrating wedge delay and 0–100 mm shear range.',
    },
    isoTolerance: {
      ar: 'نصف القطر R25.0 ± 0.1 مم',
      en: 'Radius R25.0 ± 0.1 mm',
    },
    highlightMm: { cx: 25, cy: 0, r: 25 },
  },
  {
    id: 'v2_r50_arc',
    blockId: 'v2_iso7963',
    codeTag: 'R50 mm',
    name: {
      ar: 'القوس المنحني الأكبر R50 مم (ارتدادات 50 / 125 / 200 مم)',
      en: 'R50.0 mm Concentric Quadrant Arc (Echoes at 50, 125, 200 mm)',
    },
    geometryType: 'quadrant_arc',
    dimensionsSummary: {
      ar: 'قوس أسطواني مقابل بنصف قطر R = 50.0 مم يشترك في نفس مركز الصفر (0) مع القوس R25.',
      en: 'Opposing cylindrical arc of radius R = 50.0 mm concentric with the exact same zero (0) index center.',
    },
    exactLocationMm: {
      ar: 'الطرف الأيمن للبلوك من مركز الصفر X = 25.0 مم حتى أقصى اليمين X = 75.0 مم.',
      en: 'Right quadrant extending from zero-center X = 25.0 mm to X = 75.0 mm.',
    },
    expectedSoundPathsMm: '50.0 mm (1st) · 125.0 mm (2nd via R25) · 200.0 mm (3rd)',
    calibrationPurpose: {
      ar: 'عند توجيه المجس نحو R50 يظهر الصدى الأول عند 50 مم والثاني عند 125 مم (50+50+25) لتحديد نقطة الخروج وضبط المدى 125–200 مم للمجسات الصغيرة.',
      en: 'Aiming at R50 yields echoes at 50 mm and 125 mm (50 + 50 + 25 via R25) for miniature angle-probe BIP and 125–200 mm range calibration.',
    },
    isoTolerance: {
      ar: 'نصف القطر R50.0 ± 0.1 مم',
      en: 'Radius R50.0 ± 0.1 mm',
    },
    highlightMm: { cx: 25, cy: 0, r: 50 },
  },
  {
    id: 'v2_sdh_5mm',
    blockId: 'v2_iso7963',
    codeTag: 'Ø5.0 / Ø1.5 SDH',
    name: {
      ar: 'ثقب المعايرة الجانبي القياسي Ø5.0 مم (أو Ø1.5 مم حسب ISO 7963)',
      en: 'Ø5.0 mm (ISO 7963 Ø1.5 mm Option) Reference Side-Drilled Hole',
    },
    geometryType: 'sdh_hole',
    dimensionsSummary: {
      ar: 'ثقب نافذ بقطر Ø5.0 مم (مع خيار Ø1.5 مم للمجسات الدقيقة) بكامل سماكة البلوك (12.5 أو 20 مم).',
      en: 'Through-wall reference hole Ø5.0 mm (or Ø1.5 mm per ISO 7963 miniature spec) across 12.5 or 20 mm block thickness.',
    },
    exactLocationMm: {
      ar: 'يبعد 20.0 مم أفقياً عن مركز الصفر (X = 45.0 مم) وعلى عمق Y = 15.0 مم من السطح العلوي (28.0 مم من السفلي).',
      en: 'Located 20.0 mm from arc center (X = 45.0 mm) and Y = 15.0 mm below top face (28.0 mm from bottom face).',
    },
    expectedSoundPathsMm: '18.7 mm (45°) · 27.5 mm (60°) · 41.4 mm (70°)',
    calibrationPurpose: {
      ar: 'التحقق الميداني السريع من زاوية المجس (35°–75°) وضبط الحساسية المرجعية (80% FSH) قبل بدء فحص اللحام في الموقع.',
      en: 'Field verification of refracted angle (35°–75°) and 80% FSH reference sensitivity check right at the weld site.',
    },
    isoTolerance: {
      ar: 'القطر Ø5.00 ± 0.05 مم · العمق 15.0 ± 0.1 مم',
      en: 'Diameter Ø5.00 ± 0.05 mm · Depth 15.0 ± 0.1 mm',
    },
    highlightMm: { cx: 45, cy: 15, r: 3.5 },
  },
  {
    id: 'v2_index_angle_scales',
    blockId: 'v2_iso7963',
    codeTag: 'Index ±15mm & 35°–75°',
    name: {
      ar: 'مسطرة نقطة الخروج (±15 مم) وتدريجات الزوايا المزدوجة (35°–75°) وسُمك 12.5 / 20 مم',
      en: 'Engraved Index Offset Scale (±15 mm), Dual Angle Scales (35°–75°) & 12.5 / 20 mm Thickness',
    },
    geometryType: 'scale_engraving',
    dimensionsSummary: {
      ar: 'تقسيمات مليمترية كل 1 مم حول خط الصفر المشترك، وتدريجات زوايا 40°–75° (علوي) و 35°–75° (سفلي)، وسُمك جانبي لمعايرة 0°.',
      en: '1 mm graduations around shared zero line, engraved 40°–75° & 35°–75° scales on side face, and 12.5 / 20 mm thickness for 0° checks.',
    },
    exactLocationMm: {
      ar: 'محفورة حول X = 25 مم وعلى طول حافتي الفحص العلوية والسفلية لبلوك V2.',
      en: 'Engraved around X = 25 mm zero datum and along top/bottom angle read-off edges.',
    },
    expectedSoundPathsMm: '12.5, 25, 37.5, 50 mm (12.5t) | 20, 40, 60, 80, 100 mm (20t)',
    calibrationPurpose: {
      ar: 'تحديد نقطة خروج البروب الميداني وقراءة الزاوية الحقيقية مباشرة ومعايرة مجس السماكة 0° في الموقع.',
      en: 'Direct field readout of probe exit offset, refracted shear angle, and 0° compression thickness range.',
    },
    isoTolerance: {
      ar: 'دقة التدريج ±0.2 مم / ±0.5°',
      en: 'Scale engraving ±0.2 mm / ±0.5°',
    },
    highlightMm: { cx: 25, cy: 6, w: 30, h: 12 },
  },
  {
    id: 'v2_edm_surface_notch',
    blockId: 'v2_iso7963',
    codeTag: '1.5×2.0 mm EDM Notch',
    name: {
      ar: 'حز المعايرة السطحي المستطيل (EDM Reference Notch — 1.5 × 2.0 مم)',
      en: 'Surface-Breaking Rectangular EDM Reference Notch (1.5 mm Deep × 2.0 mm Wide)',
    },
    geometryType: 'resolution_notch',
    dimensionsSummary: {
      ar: 'حز مرجعي مقطوع بالشرارة الكهربائية (EDM) بعمق 1.50 مم وعرض 2.0 مم على الحافة السفلية المستقيمة للتحقق الميداني من حساسية عيوب الجذر والسطح.',
      en: 'Precision 1.50 mm deep × 2.0 mm wide square-bottomed EDM reference notch on the bottom flat datum for field corner-trap sensitivity start-checks.',
    },
    exactLocationMm: {
      ar: 'على الحافة السفلية المستقيمة (Y = 43.0 مم) عند X = 30.0 مم بعرض كامل سُمك البلوك (12.5 أو 20 مم).',
      en: 'Machined across full block thickness (12.5 or 20 mm) on the bottom flat face (Y = 43.0 mm) at X = 30.0 mm.',
    },
    expectedSoundPathsMm: '60.8 mm (45° Leg I) · 86.0 mm (60° Leg I)',
    calibrationPurpose: {
      ar: 'ضبط حساسية الشاشة المرجعية (80% FSH) على عاكس حز ركني (Notch) وفحص استارت تشيك ثبات الكسب (±2 dB) في الموقع.',
      en: 'Establishes 80% FSH corner-trap notch screen sensitivity and verifies ≤ ±2 dB equipment start-check drift in the field.',
    },
    isoTolerance: {
      ar: 'عمق الحز 1.50 ± 0.05 مم · عرض ≤ 2.0 مم',
      en: 'Notch depth 1.50 ± 0.05 mm · Width ≤ 2.0 mm',
    },
    highlightMm: { cx: 30, cy: 41.5, w: 4, h: 3 },
  },
];

export const CALIBRATION_WORKFLOW_STEPS: CalibrationStepSpec[] = [
  {
    stepNumber: 1,
    id: 'screen_zero_long',
    shortTitle: {
      ar: '1. معايرة شاشة العمل (0° مدى وسرعة وصفر)',
      en: '1. Screen Range, Velocity & 0° Zero',
    },
    fullTitle: {
      ar: 'المرحلة 1: معايرة شاشة العمل (Timebase Range) وسرعة الموجات الطولية وصفر المجس المستقيم 0°',
      en: 'Stage 1: Working Screen Range, Longitudinal Velocity (5920 m/s) & 0° Probe Zero Calibration',
    },
    recommendedTarget: 'v1_iso2400',
    codeReference: {
      iso_17640: 'ISO 17640 Cl. 7.2 & ISO 2400 Sec. 5',
      asme_sec_v: 'ASME Sec V Art. 4 — T-463.1.1 (Sweep Linearity)',
      aws_d1_1: 'AWS D1.1 Cl. 8.22.1 & 8.24.1 (Horizontal Linearity)',
      api_1104: 'API 1104 Sec. 11.4.4 (Compression Range & Wall Check)',
    },
    objective: {
      ar: 'ضبط مدى شاشة الجهاز (100 مم)، وسرعة الصوت الطولية في الصلب (5920 m/s)، وتعويض زمن طبقة الحماية لمجس 0° (0.60 µs) لتنطبق أصداء الظهر تماماً عند 25 و 50 و 75 و 100 مم.',
      en: 'Calibrate 100 mm screen sweep, longitudinal steel velocity (5920 m/s), and 0° wear-plate zero offset (0.60 µs) so multiple back-wall echoes align strictly at 25, 50, 75, and 100 mm.',
    },
    operatorProcedure: {
      ar: [
        'ركّب المجس المستقيم (0° Compression) على سُمك 25 مم لبلوك V1 (أو قرص البيرسبكس المكافئ لـ 50 مم).',
        'اضبط مدى شاشة العمل (Screen Range) على 100 مم لظهور 4 أصداء متتالية للقاع.',
        'عدّل سرعة الصوت الطولية (5920 m/s) حتى تصبح المسافة بين كل قمتين متتاليتين 25.0 مم تماماً.',
        'عدّل صفر المجس (Zero Offset = 0.60 µs) لتحريك جميع القمم معاً حتى تنطبق القمة الأولى عند 25.0 مم والرابعة عند 100.0 مم ضمن السماحية.',
      ],
      en: [
        'Couple the 0° compression probe onto the 25.0 mm thickness face of Block V1.',
        'Set Screen Working Range to 100 mm so 4 back-wall multiples appear across the graticule.',
        'Adjust Longitudinal Velocity (5920 m/s) until peak-to-peak spacing equals 25.0 mm.',
        'Adjust Probe Zero Offset (0.60 µs) until echoes 1–4 lock onto 25.0, 50.0, 75.0, and 100.0 mm within code tolerance.',
      ],
    },
    acceptanceCriteriaLabel: {
      ar: 'مجس 0° · مدى 100 مم · السرعة 5920±30 m/s · الصفر 0.60±0.12 µs · خطأ موقع الصدى ≤ ±1.0 مم',
      en: '0° Probe · Range 100 mm · VL = 5920±30 m/s · Zero = 0.60±0.12 µs · Echo position error ≤ ±1.0 mm',
    },
  },
  {
    stepNumber: 2,
    id: 'resolution_deadzone',
    shortTitle: {
      ar: '2. قوة التفريق والمنطقة الميتة (85/91/100)',
      en: '2. 0° Resolution & Dead Zone (85/91/100)',
    },
    fullTitle: {
      ar: 'المرحلة 2: اختبار قوة التفريق المحوري (Axial Resolution) والمنطقة الميتة على تدرجات V1 (85 / 91 / 100 مم)',
      en: 'Stage 2: 0° Axial Resolution & Dead-Zone Verification on V1 Triplet Steps (85 / 91 / 100 mm)',
    },
    recommendedTarget: 'v1_iso2400',
    codeReference: {
      iso_17640: 'ISO 2400 Annex A & EN 12668-3 Sec. 3.4',
      asme_sec_v: 'ASME Sec V Art. 4 — Straight-Beam Resolution Verification',
      aws_d1_1: 'AWS D1.1 Cl. 8.22.3 (Longitudinal Resolution)',
      api_1104: 'API 1104 Sec. 11.4.3 (Instrument Resolution)',
    },
    objective: {
      ar: 'التأكد من قدرة الجهاز والمجس 0° على فصل الأصداء المتقاربة (85 مم و 91 مم و 100 مم) إلى ثلاث قمم مستقلة غير مندمجة مع ضبط التخميد العالي (50 Ω).',
      en: 'Verify that the pulser/probe resolves the 85, 91, and 100 mm notched steps on V1 into three clearly separated peaks with valley drop ≥ 6 dB.',
    },
    operatorProcedure: {
      ar: [
        'انقل المجس المستقيم 0° على السطح العلوي لبلوك V1 مباشرة فوق منطقة التدرجات السفلية (X = 195 مم).',
        'اضبط مقاومة التخميد (Pulser Damping) على وضع الدقة العالية 50 Ω لتقصير طول النبضة الصوتية.',
        'ضع البوابة A لتغطي المسار من 80 مم إلى 100 مم وارفع الكسب حتى تصل أعلى قمة إلى ~80% FSH.',
        'تحقق من انفصال القمم الثلاث بوضوح عند 85.0 مم و 91.0 مم و 100.0 مم وعدم تجاوز المنطقة الميتة 5 مم.',
      ],
      en: [
        'Position the 0° probe on V1 top face directly above the notched steps (X ≈ 195 mm).',
        'Select 50 Ω High-Resolution Pulser Damping to shorten pulse ring-down.',
        'Position Gate A across 80–100 mm and adjust Gain so peaks reach ~75–85% FSH.',
        'Confirm three distinct, resolved peaks at 85.0, 91.0, and 100.0 mm with clean valley separation.',
      ],
    },
    acceptanceCriteriaLabel: {
      ar: 'المجس فوق شق التفريق (X = 190..202 مم) · تخميد 50 Ω · فصل كامل للقمم الثلاث 85 / 91 / 100 مم',
      en: '0° Probe over V1 slot (X = 190..202 mm) · 50 Ω Damping · 3 resolved peaks at 85 / 91 / 100 mm',
    },
  },
  {
    stepNumber: 3,
    id: 'beam_index_point',
    shortTitle: {
      ar: '3. تحديد نقطة خروج الشعاع (BIP)',
      en: '3. Angle Probe Index Point (BIP)',
    },
    fullTitle: {
      ar: 'المرحلة 3: إيجاد واعتماد نقطة خروج الشعاع الحقيقية (Beam Index Point) لمجس الزاوية على V1 R100 أو V2 R25/R50',
      en: 'Stage 3: Shear-Wave Angle Probe Beam Index Point (Exit Offset) Determination on V1 R100 or V2 R25/R50',
    },
    recommendedTarget: 'v1_iso2400',
    codeReference: {
      iso_17640: 'ISO 17640 Cl. 7.3.1 & ISO 2400 / ISO 7963',
      asme_sec_v: 'ASME Sec V Art. 4 — T-463.1.2 (Beam Exit Point)',
      aws_d1_1: 'AWS D1.1 Cl. 8.24.2.1 (Exit Point Check ±1 mm)',
      api_1104: 'API 1104 Sec. 11.4.4 (Probe Exit Index Verification)',
    },
    objective: {
      ar: 'تآكل قاعدة الويدج البلاستيكي يرحّل نقطة خروج الشعاع؛ حرّك المجس الزاوي ذهاباً وإياباً حول مركز القوس (R100 في V1 أو R25/R50 في V2) لأقصى صدى لتحديد النقطة الحقيقية.',
      en: 'Wedge wear shifts the acoustic exit point; slide the angle probe across the R100 (V1) or R25/R50 (V2) center until the arc echo peaks, then mark the true BIP.',
    },
    operatorProcedure: {
      ar: [
        'اختر مجس الزاوية القصي (45° أو 60° أو 70° Shear) وضعه على بلوك V1 (موجه لـ R100) أو بلوك V2 (موجه لـ R25 أو R50).',
        'حرّك المجس للأمام والخلف ببطء (مؤشر موضع المجس X) وراقب ارتفاع صدى القوس على شاشة A-Scan.',
        'توقف تماماً عند الموضع الذي يحقق أقصى سعة للصدى (Max Envelope Peak) حيث تنطبق نقطة الخروج الفعلية مع مركز الانحناء (0).',
        'اقرأ الإزاحة على المسطرة المليمترية المحفورة واضغط زر (اعتماد علامة نقطة الخروج BIP) ضمن سماحية ±1.0 مم.',
      ],
      en: [
        'Select a shear-wave angle probe (45°, 60°, or 70°) and couple onto V1 (aimed at R100) or V2 (aimed at R25/R50).',
        'Slide the probe smoothly back and forth (Probe X slider) while watching the curved-wall echo peak.',
        'Stop at the exact maximum amplitude where the true acoustic exit point coincides with the arc center (0 mark).',
        'Read the offset on the engraved mm scale and lock the Beam Index Point within ±1.0 mm tolerance.',
      ],
    },
    acceptanceCriteriaLabel: {
      ar: 'مجس زاوي (45°/60°/70°) · نقطة الخروج ضمن ±1.0 مم من مركز القوس · اعتماد علامة BIP',
      en: 'Shear Probe (45°/60°/70°) · Probe aligned within ±1.0 mm of arc center · BIP mark locked',
    },
  },
  {
    stepNumber: 4,
    id: 'shear_range_wedge_delay',
    shortTitle: {
      ar: '4. مدى القص وتأخير الويدج (V1/V2)',
      en: '4. Shear Range & Wedge Delay',
    },
    fullTitle: {
      ar: 'المرحلة 4: معايرة سرعة الموجات القصية (3255 m/s) وتأخير الويدج ومدى شاشة الفحص على V1 (100/200) أو V2 (25/100)',
      en: 'Stage 4: Shear-Wave Velocity (3255 m/s), Wedge Zero Delay & Working Range Calibration',
    },
    recommendedTarget: 'v1_iso2400',
    codeReference: {
      iso_17640: 'ISO 17640 Cl. 7.2.2 & ISO 7963 Sec. 6',
      asme_sec_v: 'ASME Sec V Art. 4 — T-463.1.1 (Shear Sweep & Zero)',
      aws_d1_1: 'AWS D1.1 Cl. 8.24.2 (Shear Distance Calibration)',
      api_1104: 'API 1104 Sec. 11.4.4 (Shear Timebase Calibration)',
    },
    objective: {
      ar: 'تعويض زمن مرور الشعاع داخل الويدج البلاستيكي (2.35 µs) وضبط سرعة القص (3255 m/s) لتنطبق أصداء القوس المضاعفة (100 و 200 مم على V1، أو 25 و 100 مم على V2) على تدريج الشاشة.',
      en: 'Compensate Perspex wedge travel time (2.35 µs) and calibrate shear velocity (3255 m/s) using dual arc echoes (100 & 200 mm on V1, or 25 & 100 mm on V2).',
    },
    operatorProcedure: {
      ar: [
        'ثبّت المجس الزاوي عند علامة نقطة الخروج المعتمدة على مركز قوس V1 (المدى 200 مم) أو V2 (المدى 125 مم).',
        'اضبط سرعة الموجات القصية في الصلب VS = 3255 m/s لضبط المسافة الفاصلة بين الصدى الأول والصدى المرتد الثاني.',
        'اضبط تأخير الويدج (Wedge Zero Delay = 2.35 µs) حتى ينطبق الصدى الأول تماماً عند 100.0 مم (في V1) أو 25.0 مم / 50.0 مم (في V2).',
        'بعد تطابق القمتين ضمن ±1.0 مم، اضبط مدى شاشة العمل الفعلي للحام (مثلاً 125 مم ليغطي قفزة كاملة وزيادة لسمك 25 مم).',
      ],
      en: [
        'Hold the angle probe on the locked BIP mark at the arc center of V1 (Range 200 mm) or V2 (Range 125 mm).',
        'Adjust Shear Velocity VS = 3255 m/s so inter-echo spacing matches 100.0 mm (V1) or 75.0 mm (V2).',
        'Adjust Wedge Delay (2.35 µs) so Echo #1 sits strictly at 100.0 mm (V1) or 25.0 / 50.0 mm (V2).',
        'Verify both echoes fall within ±1.0 mm tolerance so true metal entry starts at S = 0.0 mm.',
      ],
    },
    acceptanceCriteriaLabel: {
      ar: 'سرعة القص 3255±25 m/s · تأخير الويدج 2.35±0.12 µs · خطأ الأصداء المزدوجة ≤ ±1.0 مم',
      en: 'VS = 3255±25 m/s · Wedge Delay = 2.35±0.12 µs · Dual arc echo error ≤ ±1.0 mm',
    },
  },
  {
    stepNumber: 5,
    id: 'refracted_angle_verify',
    shortTitle: {
      ar: '5. التحقق من زاوية الانكسار (±2°)',
      en: '5. Refracted Angle Check (±2°)',
    },
    fullTitle: {
      ar: 'المرحلة 5: قياس زاوية الانكسار الفعلية للشعاع القصي (β) والتحقق من مطابقتها للكود (±2.0°)',
      en: 'Stage 5: True Refracted Beam Angle (β) Verification Against ±2.0° Code Tolerance',
    },
    recommendedTarget: 'v1_iso2400',
    codeReference: {
      iso_17640: 'ISO 17640 Cl. 7.3.2 (±2° Maximum Deviation)',
      asme_sec_v: 'ASME Sec V Art. 4 — T-463.1.2 (Refracted Angle ±2°)',
      aws_d1_1: 'AWS D1.1 Cl. 8.22.2.2 (Beta within ±2°)',
      api_1104: 'API 1104 Sec. 11.4.4 (Beam Angle ±2°)',
    },
    objective: {
      ar: 'وجيه المجس نحو ثقب Ø1.5 مم في V1 (أو ثقب Ø5.0 مم في V2) وتحريكه لأقصى صدى لقراءة الزاوية الفعلية على التدريج الجانبي والتأكد أنها لا تحيد أكثر من ±2° عن الزاوية الاسمية.',
      en: 'Peak the angle beam on V1 Ø1.5 mm SDH (or V2 Ø5.0 mm SDH), read actual β under the BIP mark on the block angle scale, and verify |β_actual - β_nom| ≤ 2.0°.',
    },
    operatorProcedure: {
      ar: [
        'انقل المجس الزاوي لمواجهة الثقب الجانبي المرجعي (Ø1.5 مم بعمق 15 مم في V1 أو Ø5.0 مم بعمق 15 مم في V2).',
        'حرّك المجس ذهاباً وإياباً حتى تصل قمة صدى الثقب داخل البوابة A إلى أعلى ارتفاع ممكن (True Peak).',
        'انظر إلى تقاطع علامة نقطة الخروج (BIP) مع تدريج الزوايا المحفور على جانب البلوك لقراءة الزاوية الفعلية.',
        'تأكد أن انحراف الزاوية الفعلية عن الزاوية الاسمية (مثلاً 60°) يقع ضمن حدود الكود المسموحة (±2.0°).',
      ],
      en: [
        'Aim the angle probe toward the reference SDH (Ø1.5 mm at 15 mm depth on V1, or Ø5.0 mm at 15 mm depth on V2).',
        'Scan forward and backward until the SDH echo inside Gate A reaches its true maximum amplitude.',
        'Read the actual refracted angle β where the marked BIP intersects the block’s engraved degree scale.',
        'Confirm deviation |β_actual - β_nominal| is within ±2.0° per ISO 17640 / ASME Sec V / AWS D1.1.',
      ],
    },
    acceptanceCriteriaLabel: {
      ar: 'اصطياد قمة ثقب SDH بأقصى إشارة · انحراف الزاوية |Δβ| ≤ 2.0° وفق الكود المختار',
      en: 'Peaked on reference SDH (>92% envelope) · Angle deviation |Δβ| ≤ 2.0° per code',
    },
  },
  {
    stepNumber: 6,
    id: 'reference_sensitivity_gain',
    shortTitle: {
      ar: '6. الحساسية المرجعية 80% + كسب المسح',
      en: '6. 80% Ref Sensitivity & +6dB Scan',
    },
    fullTitle: {
      ar: 'المرحلة 6: ضبط الحساسية المرجعية (80% FSH) وتعويض فقد الانتقال السطحي وإضافة +6 dB كسب المسح',
      en: 'Stage 6: Primary Reference Sensitivity (80% FSH), Transfer Loss (+2 dB) & +6 dB Scanning Gain',
    },
    recommendedTarget: 'v2_iso7963',
    codeReference: {
      iso_17640: 'ISO 17640 Cl. 8.2 – 8.5 (Reference Level & Transfer Correction)',
      asme_sec_v: 'ASME Sec V Art. 4 — T-464 & T-472 (80% FSH + 6 dB Scan)',
      aws_d1_1: 'AWS D1.1 Cl. 8.24.2.2 (Zero Reference Level b & Scanning Level)',
      api_1104: 'API 1104 Sec. 11.4.5 (80% FSH Reference + Transfer + 6 dB)',
    },
    objective: {
      ar: 'تثبيت قمة الثقب المرجعي عند 80% من ارتفاع الشاشة كمرجع أساسي (Href)، ثم إضافة تعويض خشونة سطح اللحام (+2 dB) وكسب البحث الاستكشافي (+6 dB).',
      en: 'Set peaked SDH echo to 80% FSH as Primary Reference Level, apply +2.0 dB surface transfer compensation, and arm +6.0 dB scanning gain.',
    },
    operatorProcedure: {
      ar: [
        'أبقِ المجس عند أقصى قمة لثقب المعايرة المرجعي (Ø1.5 مم في V1 أو Ø5.0 مم في V2).',
        'عدّل مفتاح الكسب الأساسي (Reference Gain) حتى تستقر قمة الصدى عند 80% FSH (±4% حسب الكود) واضغط تثبيت المرجع.',
        'فعّل تعويض فقد الانتقال السطحي (Transfer Loss = +2.0 dB) لتعويض فرق الخشونة بين البلوك المصقول وصاج اللحام.',
        'فعّل مفتاح كسب المسح الإضافي (+6 dB Scanning Gain) المطلوب إلزامياً أثناء المسح اليدوي قبل بدء الفحص.',
      ],
      en: [
        'Keep the probe peaked on the reference SDH target on V1 or V2.',
        'Adjust Primary Gain until the peak stabilizes at 80% FSH (±4–5%) and lock Reference Level.',
        'Enable Surface Transfer Correction (+2.0 dB) to compensate parent-plate roughness vs machined block.',
        'Engage +6.0 dB Scanning Gain as mandated by code for manual search scanning.',
      ],
    },
    acceptanceCriteriaLabel: {
      ar: 'قمة المرجع مضبوطة عند 80% FSH · تفعيل تصحيح السطح (+2 dB) · تفعيل كسب المسح (+6 dB)',
      en: 'Reference locked at 80% FSH (±5%) · Transfer (+2 dB) ON · +6 dB Scanning Gain ON',
    },
  },
  {
    stepNumber: 7,
    id: 'weld_start_check',
    shortTitle: {
      ar: '7. استارت تشيك على اللحام (Start-Check)',
      en: '7. Weld Pre-Scan Start-Check',
    },
    fullTitle: {
      ar: 'المرحلة 7: استارت تشيك ميداني كامل على وصلة اللحام قبل بدء التفتيش (Parent Metal + Skip Marks + Root/Cap Coverage)',
      en: 'Stage 7: Complete On-Weld Pre-Scan Start-Check (0° Lamination Scan, Couplant, S/2 & Full-Skip Coverage)',
    },
    recommendedTarget: 'weld_start_check',
    codeReference: {
      iso_17640: 'ISO 17640 Cl. 9 & Cl. 10 (Parent Metal Scan & Scan Plan)',
      asme_sec_v: 'ASME Sec V Art. 4 — T-472.1 (Base Metal Scan & Skip Coverage)',
      aws_d1_1: 'AWS D1.1 Cl. 8.25 & 8.26 (Skip Distance Marking & Root/Face Scan)',
      api_1104: 'API 1104 Sec. 11.4.6 (Parent Metal Verification & Field Start Check)',
    },
    objective: {
      ar: 'تنفيذ جميع خطوات الـ Start-Check الميدانية على عينة اللحام الفعلية (سُمك 25 مم): مسح الصاج الأم بمجس 0° ضد التورق، فحص السائل الموصل، وتجربة نصف القفزة للجذر والقفزة الكاملة للكاب قبل إصدار إذن بدء التفتيش.',
      en: 'Execute the mandatory on-weld field Start-Check on the 25 mm butt weld: 0° parent-metal lamination scan, couplant check, Half-Skip (S/2) root verification, and Full-Skip (S) cap coverage sign-off.',
    },
    operatorProcedure: {
      ar: [
        '1) فحص المعدن الأم (0° Parent Metal Check): امسح حيز حركة المجس بجانب اللحام للتأكد من سُمك 25.0 مم وخلو الصاج من التورق (Laminations).',
        '2) فحص سائل التوصيل والسطح (Couplant & Toe Prep): تحقق من نظافة منطقة المسح من طرطشة اللحام (Spatter) وانتظام طبقة الجل.',
        '3) تجربة نصف القفزة (Half-Skip S/2): ضع المجس الزاوي عند مسافة S/2 = t·tan(β) للتحقق من وصول محور الحزمة لجذر اللحام (Leg I).',
        '4) تجربة القفزة الكاملة (Full-Skip S) واعتماد الاستارت تشيك: حرك المجس لمسافة S = 2·t·tan(β) لتأكيد تغطية وجه اللحام (Leg II) واعتمد شهادة بدء الفحص.',
      ],
      en: [
        '1) 0° Parent-Metal Lamination Check: Scan the heat-affected & skip travel zone to verify clean 25.0 mm back-wall echo with zero laminations.',
        '2) Surface & Couplant Check: Verify weld-spatter removal along scanning path and uniform acoustic coupling.',
        '3) Half-Skip (S/2) Root Coverage Check: Position angle probe at P = t·tan(β) to verify Leg I impingement on the weld root.',
        '4) Full-Skip (S) Crown Coverage & Sign-Off: Move probe to P = 2t·tan(β) to confirm Leg II coverage of upper bevel/cap and sign off Start-Check.',
      ],
    },
    acceptanceCriteriaLabel: {
      ar: 'اكتمال الـ 4 فحوصات الميدانية على اللحام (0° صاج أم + جل توصيل + S/2 جذر + S كاب) واعتماد الاستارت تشيك',
      en: 'All 4 on-weld Start-Check items verified (0° base metal, couplant, S/2 root, S cap) & signed off',
    },
  },
];

export interface SimulatedEchoPeak {
  id: string;
  label: { ar: string; en: string };
  trueSoundPathMm: number;
  displayedSoundPathMm: number;
  amplitudeFshPct: number;
}

export interface CalibrationPhysicsInput {
  targetBlock: CalibrationBlockId;
  v2ThicknessMm: V2BlockThicknessMm;
  probeMode: 'zero_deg' | 'angle_shear';
  nominalAngleDeg: 45 | 60 | 70;
  /** Simulated physical manufacturing skew of probe wedge (+0.6° realistic slight deviation within ±2°) */
  probeActualAngleSkewDeg: number;
  /** Probe position along top scanning surface (mm) */
  probePositionXmm: number;
  /** Direction probe faces: 'right' (+X) or 'left' (-X) */
  beamDirection: 'right' | 'left';
  /** Calibrated velocity entered on instrument (m/s) */
  instrumentVelocityMs: number;
  /** Calibrated zero / wedge delay entered on instrument (µs) */
  instrumentZeroDelayUs: number;
  /** Screen working range (mm) */
  screenRangeMm: number;
  /** Primary receiver gain (dB) */
  gainDb: number;
  /** Surface transfer loss added (dB) */
  transferCorrectionDb: number;
  /** +6 dB scanning gain toggle */
  scanningGainActive: boolean;
  /** Pulser damping */
  dampingOhms: 50 | 500;
  /** Weld plate thickness for Stage 7 start-check (mm) */
  weldThicknessMm: number;
  /** Special 0° sub-spot on V1 ('thk_25' | 'height_100' | 'perspex_50' | 'res_steps') */
  v1ZeroSpot: 'thk_25' | 'height_100' | 'perspex_50' | 'res_steps';
  /** Optional V2 SDH hole diameter per ISO 7963 (5.0 mm standard or 1.5 mm fine-beam option) */
  v2SdhDiameterMm?: 5.0 | 1.5;
  /** Optional reference flaw mode for Stage 6 sensitivity & Stage 7 start-check ('sdh' vs 'edm_notch') */
  sensitivityReflectorMode?: 'sdh' | 'edm_notch';
}

export interface CalibrationPhysicsOutput {
  trueMaterialVelocityMs: number;
  trueProbeDelayUs: number;
  trueRefractedAngleDeg: number;
  measuredAngleOnScaleDeg: number | null;
  angleErrorDeg: number;
  indexErrorFromArcCenterMm: number | null;
  halfSkipWeldMm: number;
  fullSkipWeldMm: number;
  echoes: SimulatedEchoPeak[];
  primaryGateEcho: SimulatedEchoPeak | null;
  resolutionValleyRatio: number;
}

/**
 * Pure ultrasonic time-of-flight & echo amplitude solver for V1, V2, and Weld Start-Check.
 * Connects instrument Velocity (m/s) and Zero Delay (µs) directly to displayed echo positions:
 *   t_flight_total (µs) = 2 * S_true_mm / (V_true / 1000) + t_delay_true_µs
 *   S_displayed_mm = ((t_flight_total - t_delay_inst_µs) * (V_inst / 1000)) / 2
 */
export function computeCalibrationPhysics(input: CalibrationPhysicsInput): CalibrationPhysicsOutput {
  const trueMaterialVelocityMs = input.probeMode === 'zero_deg' ? 5920 : 3255;
  const trueProbeDelayUs = input.probeMode === 'zero_deg' ? 0.6 : 2.35;
  const trueRefractedAngleDeg =
    input.probeMode === 'zero_deg'
      ? 0
      : Number((input.nominalAngleDeg + input.probeActualAngleSkewDeg).toFixed(1));

  const totalEffectiveGainDb =
    input.gainDb + input.transferCorrectionDb + (input.scanningGainActive ? 6 : 0);
  // Gain factor relative to 48.0 dB nominal reference
  const gainLinearFactor = Math.pow(10, (totalEffectiveGainDb - 48.0) / 20);

  const mapTruePathToDisplayMm = (truePathMm: number): number => {
    const vTrueMmPerUs = trueMaterialVelocityMs / 1000;
    const vInstMmPerUs = input.instrumentVelocityMs / 1000;
    const totalRoundTripUs = (2 * truePathMm) / vTrueMmPerUs + trueProbeDelayUs;
    const correctedUs = totalRoundTripUs - input.instrumentZeroDelayUs;
    return Number(((correctedUs * vInstMmPerUs) / 2).toFixed(2));
  };

  const clampFsh = (rawPct: number): number =>
    Number(Math.min(100, Math.max(0, rawPct)).toFixed(1));

  const echoes: SimulatedEchoPeak[] = [];
  let indexErrorFromArcCenterMm: number | null = null;
  let measuredAngleOnScaleDeg: number | null = null;
  const resolutionValleyRatio = input.dampingOhms === 50 ? 0.22 : 0.78;

  const rad = (trueRefractedAngleDeg * Math.PI) / 180;
  const tanBeta = input.probeMode === 'zero_deg' ? 0 : Math.tan(rad);
  const halfSkipWeldMm = Number((input.weldThicknessMm * tanBeta).toFixed(1));
  const fullSkipWeldMm = Number((2 * input.weldThicknessMm * tanBeta).toFixed(1));

  if (input.targetBlock === 'v1_iso2400') {
    if (input.probeMode === 'zero_deg') {
      if (input.v1ZeroSpot === 'thk_25') {
        [25, 50, 75, 100, 125].forEach((sTrue, idx) => {
          const baseAmp = 82 * Math.pow(0.84, idx);
          echoes.push({
            id: `v1_25_bw_${idx + 1}`,
            label: {
              ar: `صدى القاع #${idx + 1} (${sTrue} مم)`,
              en: `Backwall #${idx + 1} (${sTrue} mm)`,
            },
            trueSoundPathMm: sTrue,
            displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
            amplitudeFshPct: clampFsh(baseAmp * gainLinearFactor),
          });
        });
      } else if (input.v1ZeroSpot === 'perspex_50') {
        [50, 100, 150, 200].forEach((sTrue, idx) => {
          const baseAmp = 78 * Math.pow(0.72, idx);
          echoes.push({
            id: `v1_pmma_${idx + 1}`,
            label: {
              ar: `صدى البيرسبكس #${idx + 1} (مكافئ ${sTrue} مم)`,
              en: `PMMA Eq. #${idx + 1} (${sTrue} mm)`,
            },
            trueSoundPathMm: sTrue,
            displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
            amplitudeFshPct: clampFsh(baseAmp * gainLinearFactor),
          });
        });
      } else if (input.v1ZeroSpot === 'res_steps') {
        // Check if probe X is over the resolution notches (X = 188..204 mm)
        const distFromSlot = Math.abs(input.probePositionXmm - 196);
        const envelope = Math.exp(-Math.pow(distFromSlot / 10, 2));
        if (envelope > 0.1) {
          [
            { path: 85, amp: 76, tag: '85 mm Slot' },
            { path: 91, amp: 80, tag: '91 mm Step' },
            { path: 100, amp: 84, tag: '100 mm Backwall' },
          ].forEach((st) => {
            echoes.push({
              id: `v1_res_${st.path}`,
              label: {
                ar: `قمة تفريق ${st.path} مم`,
                en: `${st.tag}`,
              },
              trueSoundPathMm: st.path,
              displayedSoundPathMm: mapTruePathToDisplayMm(st.path),
              amplitudeFshPct: clampFsh(st.amp * envelope * gainLinearFactor),
            });
          });
        } else {
          // Standard 100 mm & 200 mm height backwall outside notch zone
          [100, 200].forEach((sTrue, idx) => {
            echoes.push({
              id: `v1_h100_${idx + 1}`,
              label: {
                ar: `صدى الارتفاع ${sTrue} مم`,
                en: `Height BW ${sTrue} mm`,
              },
              trueSoundPathMm: sTrue,
              displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
              amplitudeFshPct: clampFsh(80 * Math.pow(0.78, idx) * gainLinearFactor),
            });
          });
        }
      } else {
        // height_100
        [100, 200].forEach((sTrue, idx) => {
          echoes.push({
            id: `v1_h100_std_${idx + 1}`,
            label: {
              ar: `صدى القاع ${sTrue} مم`,
              en: `Height BW ${sTrue} mm`,
            },
            trueSoundPathMm: sTrue,
            displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
            amplitudeFshPct: clampFsh(82 * Math.pow(0.78, idx) * gainLinearFactor),
          });
        });
      }
    } else {
      // Angle shear probe on V1 Block (X = 0..240 mm)
      if (input.beamDirection === 'right') {
        // Aiming right toward R100 curved quadrant centered at X = 200 mm
        const dxCenter = input.probePositionXmm - 200;
        indexErrorFromArcCenterMm = Number(dxCenter.toFixed(1));
        const arcGaussian = Math.exp(-Math.pow(dxCenter / 5.5, 2));
        if (arcGaussian > 0.05) {
          const pathShift = dxCenter * Math.sin(rad) * 0.45;
          [100, 200].forEach((nominalR, idx) => {
            const sTrue = Number((nominalR - pathShift).toFixed(2));
            const baseAmp = idx === 0 ? 80 : 54;
            echoes.push({
              id: `v1_r100_${nominalR}`,
              label: {
                ar: idx === 0 ? 'صدى قوس R100 الأول (100 مم)' : 'الصدى المرتد الثاني (200 مم)',
                en: idx === 0 ? 'R100 Primary Arc (100 mm)' : 'R200 Second Reverb (200 mm)',
              },
              trueSoundPathMm: sTrue,
              displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
              amplitudeFshPct: clampFsh(baseAmp * arcGaussian * gainLinearFactor),
            });
          });
        }
      } else {
        // Aiming left toward Ø1.5 mm SDH at (X = 35 mm, Y = 15 mm) and Ø50 mm hole at (X = 100 mm, Y = 55 mm)
        const sdhDepth = 15;
        const idealProbeXForSdh = 35 + sdhDepth * Math.tan(rad);
        const dxSdh = input.probePositionXmm - idealProbeXForSdh;
        const sdhGaussian = Math.exp(-Math.pow(dxSdh / 4.2, 2));

        // Engraved scale reading: tan(beta_read) = (probePositionXmm - 35) / 15
        if (input.probePositionXmm > 40 && input.probePositionXmm < 95) {
          const readRad = Math.atan((input.probePositionXmm - 35) / sdhDepth);
          measuredAngleOnScaleDeg = Number(((readRad * 180) / Math.PI).toFixed(1));
        }

        if (sdhGaussian > 0.04) {
          const distHorizontal = Math.max(2, input.probePositionXmm - 35);
          const sTrue = Number((Math.hypot(distHorizontal, sdhDepth) - 0.75).toFixed(2));
          echoes.push({
            id: 'v1_sdh_1_5',
            label: {
              ar: 'صدى ثقب المعايرة Ø1.5 مم SDH',
              en: 'Ø1.5 mm SDH Reference Echo',
            },
            trueSoundPathMm: sTrue,
            displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
            amplitudeFshPct: clampFsh(80 * sdhGaussian * gainLinearFactor),
          });
        }

        // Also check Ø50 mm large hole centered at (100, 55), radius 25 mm
        const idealXHole50 = 100 + 55 * Math.tan(rad);
        const dx50 = input.probePositionXmm - idealXHole50;
        const g50 = Math.exp(-Math.pow(dx50 / 8.0, 2));
        if (g50 > 0.08) {
          const sCenter = Math.hypot(input.probePositionXmm - 100, 55);
          const sSurface = Math.max(10, Number((sCenter - 25).toFixed(2)));
          echoes.push({
            id: 'v1_hole_50',
            label: {
              ar: 'صدى محيط ثقب Ø50 مم',
              en: 'Ø50 mm Cylindrical Bore Echo',
            },
            trueSoundPathMm: sSurface,
            displayedSoundPathMm: mapTruePathToDisplayMm(sSurface),
            amplitudeFshPct: clampFsh(74 * g50 * gainLinearFactor),
          });
        }

        // Bottom 2x15mm Corner-Trap Notch at X = 193 mm, Y = 100 mm when aiming left from X > 195 mm or in edm_notch mode
        const notchDepthV1 = 100;
        const idealProbeXForNotchV1 = 193 + notchDepthV1 * Math.tan(rad);
        if (input.sensitivityReflectorMode === 'edm_notch') {
          const sNotch = Number((15 / Math.cos(rad)).toFixed(2));
          const idealShallowNotchX = 35 + 15 * Math.tan(rad);
          const dxNotch = input.probePositionXmm - idealShallowNotchX;
          const gNotch = Math.exp(-Math.pow(dxNotch / 4.2, 2));
          if (gNotch > 0.05) {
            echoes.push({
              id: 'v1_edm_notch_ref',
              label: {
                ar: 'صدى الحز المرجعي السطحي (EDM Reference Notch)',
                en: 'EDM Reference Notch Echo (Corner Trap)',
              },
              trueSoundPathMm: sNotch,
              displayedSoundPathMm: mapTruePathToDisplayMm(sNotch),
              amplitudeFshPct: clampFsh(80 * gNotch * gainLinearFactor),
            });
          }
        } else if (Math.abs(input.probePositionXmm - idealProbeXForNotchV1) < 12) {
          const gSlot = Math.exp(-Math.pow((input.probePositionXmm - idealProbeXForNotchV1) / 5.5, 2));
          const sSlot = Number((notchDepthV1 / Math.cos(rad)).toFixed(2));
          echoes.push({
            id: 'v1_bottom_slot_notch',
            label: {
              ar: 'صدى شق الزاوية السفلي (2×15 مم)',
              en: 'Bottom 2×15 mm Corner-Trap Slot',
            },
            trueSoundPathMm: sSlot,
            displayedSoundPathMm: mapTruePathToDisplayMm(sSlot),
            amplitudeFshPct: clampFsh(76 * gSlot * gainLinearFactor),
          });
        }
      }
    }
  } else if (input.targetBlock === 'v2_iso7963') {
    const v2HoleDia = input.v2SdhDiameterMm ?? 5.0;
    const v2HoleRadius = v2HoleDia / 2;
    if (input.probeMode === 'zero_deg') {
      // 0° thickness multiples across V2 thickness (12.5 mm or 20 mm)
      const t = input.v2ThicknessMm;
      [1, 2, 3, 4, 5].forEach((mult) => {
        const sTrue = Number((t * mult).toFixed(2));
        if (sTrue <= 125) {
          echoes.push({
            id: `v2_bw_${mult}`,
            label: {
              ar: `صدى سُمك V2 #${mult} (${sTrue} مم)`,
              en: `V2 Thickness #${mult} (${sTrue} mm)`,
            },
            trueSoundPathMm: sTrue,
            displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
            amplitudeFshPct: clampFsh(82 * Math.pow(0.83, mult - 1) * gainLinearFactor),
          });
        }
      });
    } else {
      // V2 zero center at X = 25 mm. Left arc = R25 (aiming 'left'), Right arc = R50 or SDH at (X=45, Y=15)
      const dxZero = input.probePositionXmm - 25;
      indexErrorFromArcCenterMm = Number(dxZero.toFixed(1));
      const zeroGaussian = Math.exp(-Math.pow(dxZero / 4.2, 2));

      if (input.beamDirection === 'left') {
        // Aiming left at R25 mm arc -> echoes at 25 mm, 100 mm, 175 mm
        if (zeroGaussian > 0.05) {
          const shift = -dxZero * Math.sin(rad) * 0.4;
          [
            { s: 25, amp: 80, ar: 'صدى قوس R25 الأول (25 مم)', en: 'R25 Primary Arc (25 mm)' },
            { s: 100, amp: 58, ar: 'صدى ارتداد R25+R50 (100 مم)', en: 'R25→R50 Reverb (100 mm)' },
            { s: 175, amp: 36, ar: 'صدى ارتداد ثالث (175 مم)', en: '3rd Reverb (175 mm)' },
          ].forEach((pk) => {
            const sTrue = Number((pk.s + shift).toFixed(2));
            echoes.push({
              id: `v2_r25_${pk.s}`,
              label: { ar: pk.ar, en: pk.en },
              trueSoundPathMm: sTrue,
              displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
              amplitudeFshPct: clampFsh(pk.amp * zeroGaussian * gainLinearFactor),
            });
          });
        }

        // Aiming left at the V2 SDH (X = 45, Y = 15) OR V2 EDM Notch
        const sdhDepth = 15;
        const idealProbeRightOfSdh = 45 + sdhDepth * Math.tan(rad);
        const dxSdhLeft = input.probePositionXmm - idealProbeRightOfSdh;
        const gSdhLeft = Math.exp(-Math.pow(dxSdhLeft / 3.8, 2));
        if (input.probePositionXmm > 49) {
          const readRad = Math.atan((input.probePositionXmm - 45) / sdhDepth);
          measuredAngleOnScaleDeg = Number(((readRad * 180) / Math.PI).toFixed(1));
        }
        if (gSdhLeft > 0.05) {
          const sCenter = Math.hypot(Math.max(2, input.probePositionXmm - 45), sdhDepth);
          const sTrue = Number((sCenter - v2HoleRadius).toFixed(2));
          echoes.push({
            id: 'v2_sdh_5mm_left',
            label: {
              ar:
                input.sensitivityReflectorMode === 'edm_notch'
                  ? 'صدى حز المعايرة الميداني V2 (1.5×2.0 مم EDM)'
                  : `صدى ثقب V2 القياسي Ø${v2HoleDia.toFixed(1)} مم`,
              en:
                input.sensitivityReflectorMode === 'edm_notch'
                  ? 'V2 1.5×2.0 mm EDM Notch Echo'
                  : `V2 Ø${v2HoleDia.toFixed(1)} mm Reference SDH`,
            },
            trueSoundPathMm: sTrue,
            displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
            amplitudeFshPct: clampFsh(80 * gSdhLeft * gainLinearFactor),
          });
        }
      } else {
        // Aiming right from around X = 25 mm -> hits R50 arc (50 mm, 125 mm) OR hits SDH at (45, 15)
        if (zeroGaussian > 0.06) {
          const shift = dxZero * Math.sin(rad) * 0.4;
          [
            { s: 50, amp: 80, ar: 'صدى قوس R50 الأول (50 مم)', en: 'R50 Primary Arc (50 mm)' },
            { s: 125, amp: 55, ar: 'صدى ارتداد R50+R25 (125 مم)', en: 'R50→R25 Reverb (125 mm)' },
          ].forEach((pk) => {
            const sTrue = Number((pk.s - shift).toFixed(2));
            echoes.push({
              id: `v2_r50_${pk.s}`,
              label: { ar: pk.ar, en: pk.en },
              trueSoundPathMm: sTrue,
              displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
              amplitudeFshPct: clampFsh(pk.amp * zeroGaussian * gainLinearFactor),
            });
          });
        }

        const idealProbeLeftOfSdh = 45 - 15 * Math.tan(rad);
        const dxSdhRight = input.probePositionXmm - idealProbeLeftOfSdh;
        const gSdhRight = Math.exp(-Math.pow(dxSdhRight / 3.8, 2));
        if (input.probePositionXmm < 40 && idealProbeLeftOfSdh >= 2) {
          const readRad = Math.atan(Math.max(1, 45 - input.probePositionXmm) / 15);
          measuredAngleOnScaleDeg = Number(((readRad * 180) / Math.PI).toFixed(1));
        }
        if (gSdhRight > 0.05 && input.probePositionXmm < 42) {
          const sCenter = Math.hypot(Math.max(2, 45 - input.probePositionXmm), 15);
          const sTrue = Number((sCenter - v2HoleRadius).toFixed(2));
          echoes.push({
            id: 'v2_sdh_5mm_right',
            label: {
              ar: `صدى ثقب V2 القياسي Ø${v2HoleDia.toFixed(1)} مم`,
              en: `V2 Ø${v2HoleDia.toFixed(1)} mm Reference SDH`,
            },
            trueSoundPathMm: sTrue,
            displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
            amplitudeFshPct: clampFsh(80 * gSdhRight * gainLinearFactor),
          });
        }
      }
    }
  } else {
    // Stage 7: Weld Start-Check Specimen (Weld centerline at X = 0, Probe standoff X = 12..115 mm on right side)
    if (input.probeMode === 'zero_deg') {
      // Clean parent metal back-wall echoes at t, 2t, 3t (no lamination!)
      [1, 2, 3].forEach((mult) => {
        const sTrue = Number((input.weldThicknessMm * mult).toFixed(2));
        echoes.push({
          id: `weld_pm_bw_${mult}`,
          label: {
            ar: `قاع المعدن الأساسي السليم #${mult} (${sTrue} مم)`,
            en: `Clean Parent Metal BW #${mult} (${sTrue} mm)`,
          },
          trueSoundPathMm: sTrue,
          displayedSoundPathMm: mapTruePathToDisplayMm(sTrue),
          amplitudeFshPct: clampFsh(84 * Math.pow(0.8, mult - 1) * gainLinearFactor),
        });
      });
    } else {
      // Angle probe scanning toward weld centerline from standoff = probePositionXmm
      const standoff = input.probePositionXmm;
      const isNotchStartCheck = input.sensitivityReflectorMode === 'edm_notch';
      // 1) Root bead geometry OR 10%t Root EDM Reference Notch reflection when standoff ≈ halfSkipWeldMm
      const dxRoot = standoff - halfSkipWeldMm;
      const gRoot = Math.exp(-Math.pow(dxRoot / 5.0, 2));
      if (gRoot > 0.08) {
        const sRoot = Number((input.weldThicknessMm / Math.cos(rad)).toFixed(2));
        echoes.push({
          id: 'weld_root_geometry_echo',
          label: {
            ar: isNotchStartCheck
              ? 'صدى حز المعايرة الجذري 10%t (Root EDM Notch — S/2)'
              : 'إشارة خرزة جذر اللحام الهندسية (Half-Skip S/2)',
            en: isNotchStartCheck
              ? '10%t Root EDM Reference Notch (Leg I — S/2)'
              : 'Weld Root Bead Geometry Check (Leg I — S/2)',
          },
          trueSoundPathMm: sRoot,
          displayedSoundPathMm: mapTruePathToDisplayMm(sRoot),
          amplitudeFshPct: clampFsh((isNotchStartCheck ? 78 : 46) * gRoot * gainLinearFactor),
        });
      }

      // 2) Crown / Cap toe geometry OR 10%t Surface EDM Reference Notch when standoff ≈ fullSkipWeldMm
      const dxCap = standoff - fullSkipWeldMm;
      const gCap = Math.exp(-Math.pow(dxCap / 5.5, 2));
      if (gCap > 0.08) {
        const sCap = Number(((2 * input.weldThicknessMm) / Math.cos(rad)).toFixed(2));
        echoes.push({
          id: 'weld_cap_geometry_echo',
          label: {
            ar: isNotchStartCheck
              ? 'صدى حز المعايرة السطحي 10%t (Surface EDM Notch — S)'
              : 'إشارة حافة كاب اللحام العلوي (Full-Skip S)',
            en: isNotchStartCheck
              ? '10%t Surface EDM Reference Notch (Leg II — Full Skip)'
              : 'Weld Crown / Cap Toe Check (Leg II — Full Skip)',
          },
          trueSoundPathMm: sCap,
          displayedSoundPathMm: mapTruePathToDisplayMm(sCap),
          amplitudeFshPct: clampFsh((isNotchStartCheck ? 72 : 38) * gCap * gainLinearFactor),
        });
      }
    }
  }

  echoes.sort((a, b) => a.displayedSoundPathMm - b.displayedSoundPathMm);

  const primaryGateEcho =
    echoes.reduce<SimulatedEchoPeak | null>((best, cur) => {
      if (cur.displayedSoundPathMm < 0 || cur.displayedSoundPathMm > input.screenRangeMm) {
        return best;
      }
      if (!best || cur.amplitudeFshPct > best.amplitudeFshPct) return cur;
      return best;
    }, null) ?? echoes[0] ?? null;

  const angleToCompare = measuredAngleOnScaleDeg ?? trueRefractedAngleDeg;
  const angleErrorDeg =
    input.probeMode === 'zero_deg'
      ? 0
      : Number(Math.abs(angleToCompare - input.nominalAngleDeg).toFixed(1));

  return {
    trueMaterialVelocityMs,
    trueProbeDelayUs,
    trueRefractedAngleDeg,
    measuredAngleOnScaleDeg,
    angleErrorDeg,
    indexErrorFromArcCenterMm,
    halfSkipWeldMm,
    fullSkipWeldMm,
    echoes,
    primaryGateEcho,
    resolutionValleyRatio,
  };
}

export function formatBilingual(obj: { ar: string; en: string }, language: Language): string {
  return language === 'ar' ? obj.ar : obj.en;
}
