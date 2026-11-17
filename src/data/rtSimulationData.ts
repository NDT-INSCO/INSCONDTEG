export type RtSourceCategory = 'gamma' | 'xray';

export type RtSourceId =
  | 'ir192'
  | 'se75'
  | 'co60'
  | 'xray_directional'
  | 'xray_panoramic';

export type RtTechniqueId =
  | 'swsi_plate'
  | 'swsi_panoramic'
  | 'dwsi_contact'
  | 'dwdi_elliptical';

export type RtFilmClassId = 'class_1' | 'class_2' | 'class_3';

export type RtGoverningCodeId = 'ASME_VIII_UW51' | 'ASME_B31_3' | 'API_1104';

export type RtDefectClassification =
  | 'crack'
  | 'lack_of_fusion'
  | 'incomplete_penetration'
  | 'slag_inclusion'
  | 'porosity'
  | 'tungsten_inclusion'
  | 'undercut'
  | 'sound';

export interface RtSourceSpec {
  id: RtSourceId;
  category: RtSourceCategory;
  shortCode: string;
  name: { ar: string; en: string };
  deviceModel: { ar: string; en: string };
  energyDescription: { ar: string; en: string };
  halfLifeLabel: { ar: string; en: string };
  focalSpotMm: number;
  steelHvlMm: number;
  leadHvlMm: number;
  /** R·m²/(hr·Ci) for gamma sources; 0 for X-ray (computed via kV/mA output) */
  gammaConstantRhmPerCi: number;
  recommendedThicknessMm: [number, number];
  defaultActivityCi: number;
  defaultKv: number;
  defaultMa: number;
  minAllowedDensityAsme: number;
}

export interface RtTechniqueSpec {
  id: RtTechniqueId;
  shortCode: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  wallsPenetrated: 1 | 2;
  isEllipticalOffset: boolean;
  geometryKind: 'plate' | 'pipe';
}

export interface RtFilmClassSpec {
  id: RtFilmClassId;
  code: string;
  commercialExamples: string;
  name: { ar: string; en: string };
  /** Relative exposure multiplier (>1 means slower ultra-fine grain needing more exposure) */
  exposureMultiplier: number;
  grainNoiseFactor: number;
  contrastGamma: number;
}

export interface RtFilmIndication {
  id: string;
  type: Exclude<RtDefectClassification, 'sound'>;
  label: { ar: string; en: string };
  /** Center position along 250 mm film length (20..230 mm) */
  xMm: number;
  /** Offset from weld centerline (-14..+14 mm; 0 = weld root center) */
  yOffsetMm: number;
  /** True flaw length along weld axis (mm) */
  lengthMm: number;
  /** Transverse flaw width (mm) */
  widthMm: number;
  /**
   * Optical density shift ΔD relative to surrounding weld metal:
   * Positive (+0.25..+0.85) = DARKER on film (less attenuation: gas, crack, LOP, slag).
   * Negative (-0.45..-0.75) = BRIGHTER/WHITE on film (high-Z Tungsten inclusion!).
   */
  densityDelta: number;
  isPrimary: boolean;
}

export interface RtWeldSpecimen {
  id: string;
  weldTag: string;
  title: { ar: string; en: string };
  materialSpec: string;
  weldingProcess: string;
  geometryKind: 'plate' | 'pipe';
  outerDiameterMm?: number;
  wallThicknessMm: number;
  weldWidthMm: number;
  recommendedTechnique: RtTechniqueId;
  recommendedSource: RtSourceId;
  primaryClassification: RtDefectClassification;
  primaryLengthMm: number;
  indications: RtFilmIndication[];
  codeVerdicts: Record<
    RtGoverningCodeId,
    {
      verdict: 'ACCEPT' | 'REJECT';
      maxAllowedMm: number;
      clause: string;
      reason: { ar: string; en: string };
    }
  >;
  radiographicSignatureNote: { ar: string; en: string };
}

export const RT_SOURCES: readonly RtSourceSpec[] = [
  {
    id: 'ir192',
    category: 'gamma',
    shortCode: 'Ir-192',
    name: {
      ar: 'جاما إيريديوم-192 (Ir-192 Isotope Camera)',
      en: 'Gamma Ray — Iridium-192 (Ir-192 Projector)',
    },
    deviceModel: {
      ar: 'كاميرا إشعاعية Sentinel 880 Delta (درع يورانيوم مستنفد)',
      en: 'Sentinel 880 Delta Projector (Depleted Uranium Shield)',
    },
    energyDescription: {
      ar: 'طيف جاما متعدد الخطوط (متوسط فعال 0.38 MeV)',
      en: 'Polyenergetic Gamma Spectrum (0.38 MeV avg)',
    },
    halfLifeLabel: { ar: 'عمر النصف: 73.8 يوماً', en: 'Half-life: 73.8 days' },
    focalSpotMm: 3.0,
    steelHvlMm: 12.5,
    leadHvlMm: 4.8,
    gammaConstantRhmPerCi: 0.48,
    recommendedThicknessMm: [10, 75],
    defaultActivityCi: 45,
    defaultKv: 0,
    defaultMa: 0,
    minAllowedDensityAsme: 2.0,
  },
  {
    id: 'se75',
    category: 'gamma',
    shortCode: 'Se-75',
    name: {
      ar: 'جاما سيلينيوم-75 (Se-75 عالي التباين للسماكات القليلة)',
      en: 'Gamma Ray — Selenium-75 (Se-75 High-Contrast)',
    },
    deviceModel: {
      ar: 'كاميرا Sentinel 880 / QSA Se-75 المدمجة',
      en: 'Compact Se-75 Isotope Projector',
    },
    energyDescription: {
      ar: 'طاقة جاما منخفضة ناعمة (متوسط 0.21 MeV) تقارب تباين X-Ray',
      en: 'Soft Gamma Spectrum (0.21 MeV avg) — near X-ray contrast',
    },
    halfLifeLabel: { ar: 'عمر النصف: 119.8 يوماً', en: 'Half-life: 119.8 days' },
    focalSpotMm: 2.0,
    steelHvlMm: 8.0,
    leadHvlMm: 1.5,
    gammaConstantRhmPerCi: 0.2,
    recommendedThicknessMm: [4, 30],
    defaultActivityCi: 55,
    defaultKv: 0,
    defaultMa: 0,
    minAllowedDensityAsme: 2.0,
  },
  {
    id: 'co60',
    category: 'gamma',
    shortCode: 'Co-60',
    name: {
      ar: 'جاما كوبالت-60 (Co-60 للأوعية والمسبوكات السميكة)',
      en: 'Gamma Ray — Cobalt-60 (Co-60 Heavy-Wall)',
    },
    deviceModel: {
      ar: 'وحدة تصوير الجدران السميكة Sentinel 680 / Bunker Co-60',
      en: 'Heavy-Shield Co-60 Teletherapy/Industrial Projector',
    },
    energyDescription: {
      ar: 'طاقة اختراق عالية جداً (1.17 & 1.33 MeV)',
      en: 'High-Penetration Gamma (1.17 & 1.33 MeV)',
    },
    halfLifeLabel: { ar: 'عمر النصف: 5.27 سنوات', en: 'Half-life: 5.27 years' },
    focalSpotMm: 3.5,
    steelHvlMm: 21.6,
    leadHvlMm: 12.5,
    gammaConstantRhmPerCi: 1.3,
    recommendedThicknessMm: [50, 200],
    defaultActivityCi: 30,
    defaultKv: 0,
    defaultMa: 0,
    minAllowedDensityAsme: 2.0,
  },
  {
    id: 'xray_directional',
    category: 'xray',
    shortCode: 'X-Ray Dir',
    name: {
      ar: 'أشعة إكس اتجاهية محمولة (Directional X-Ray Tube 100–300 kV)',
      en: 'X-Ray — Directional Portable Tube (100–300 kV)',
    },
    deviceModel: {
      ar: 'أنبوب أشعة سينية YXLON / Balteau 300 kV متغير الجهد والتيار',
      en: 'Industrial 300 kV Constant-Potential Directional X-Ray Head',
    },
    energyDescription: {
      ar: 'طيف أشعة انكباح مستمر محكوم بفرق الجهد kV والتيار mA',
      en: 'Bremsstrahlung spectrum controlled via kV & mA',
    },
    halfLifeLabel: {
      ar: 'يتوقف الإشعاع فوراً عند فصل التيار الكهربائي',
      en: 'Zero residual radiation when de-energized',
    },
    focalSpotMm: 1.5,
    steelHvlMm: 5.5,
    leadHvlMm: 0.8,
    gammaConstantRhmPerCi: 0,
    recommendedThicknessMm: [3, 45],
    defaultActivityCi: 0,
    defaultKv: 210,
    defaultMa: 4.0,
    minAllowedDensityAsme: 1.8,
  },
  {
    id: 'xray_panoramic',
    category: 'xray',
    shortCode: 'X-Ray 360°',
    name: {
      ar: 'زاحف أشعة إكس بانورامي داخلي (Panoramic 360° Pipeline Crawler)',
      en: 'X-Ray — Panoramic 360° Internal Pipeline Crawler',
    },
    deviceModel: {
      ar: 'زاحف خطوط أنابيب 225 kV متمركز تلقائياً بداخل الماسورة',
      en: 'Self-centering 225 kV 360° Panoramic Pipeline Crawler',
    },
    energyDescription: {
      ar: 'حزمة مخروطية 360° لتصوير محيط اللحام في لقطة واحدة SWSI',
      en: '360° radial beam exposing full girth weld in one SWSI shot',
    },
    halfLifeLabel: {
      ar: 'بؤرة دقيقة جداً (1.2 mm) مع إيقاف إلكتروني آمن',
      en: '1.2 mm fine focal spot — electronically switched',
    },
    focalSpotMm: 1.2,
    steelHvlMm: 4.8,
    leadHvlMm: 0.6,
    gammaConstantRhmPerCi: 0,
    recommendedThicknessMm: [6, 32],
    defaultActivityCi: 0,
    defaultKv: 195,
    defaultMa: 3.5,
    minAllowedDensityAsme: 1.8,
  },
];

export const RT_TECHNIQUES: readonly RtTechniqueSpec[] = [
  {
    id: 'swsi_plate',
    shortCode: 'SWSI (Plate)',
    name: {
      ar: 'جدار مفرد وصورة مفردة — ألواح مسطحة (SWSI Flat Plate)',
      en: 'Single-Wall Single-Image — Flat Plate (SWSI)',
    },
    description: {
      ar: 'المصدر أمام وجه اللحام والفيلم ملاصق للسطح الخلفي؛ تخترق الأشعة سُمكاً واحداً فقط (t) وتوفر أعلى حساسية.',
      en: 'Source faces weld crown, film cassette contacts root side; radiation penetrates 1x wall thickness (t).',
    },
    wallsPenetrated: 1,
    isEllipticalOffset: false,
    geometryKind: 'plate',
  },
  {
    id: 'swsi_panoramic',
    shortCode: 'SWSI (Panoramic)',
    name: {
      ar: 'تصوير بانورامي مركزي داخلي للمواسير (SWSI Panoramic 360°)',
      en: 'Single-Wall Panoramic — Internal Pipe Center (SWSI)',
    },
    description: {
      ar: 'يوضع المصدر في مركز الماسورة (SFD = نصف القطر) وحزام الأفلام حول المحيط الخارجي لتصوير اللحام بالكامل في لقطة واحدة.',
      en: 'Source centered inside pipe (SFD = pipe radius) with film belt wrapped externally for 360° single-wall exposure.',
    },
    wallsPenetrated: 1,
    isEllipticalOffset: false,
    geometryKind: 'pipe',
  },
  {
    id: 'dwsi_contact',
    shortCode: 'DWSI (Contact)',
    name: {
      ar: 'جدار مزدوج وصورة مفردة بالتلامس (DWSI Contact — OD > 3.5")',
      en: 'Double-Wall Single-Image Contact (DWSI — OD > 3.5")',
    },
    description: {
      ar: 'المصدر ملاصق للجدار العلوي للماسورة والفيلم على الجدار السفلي؛ تخترق الأشعة جدارين (2t) ويُقرأ الجزء السفلي فقط في ≥ 3 لقطات.',
      en: 'Source outside top pipe wall, film on bottom wall; beam penetrates 2x wall thickness (2t), interpreting film-side weld only.',
    },
    wallsPenetrated: 2,
    isEllipticalOffset: false,
    geometryKind: 'pipe',
  },
  {
    id: 'dwdi_elliptical',
    shortCode: 'DWDI (Elliptical)',
    name: {
      ar: 'جدار مزدوج وصورة مزدوجة بيضاوية (DWDI Elliptical — OD ≤ 3.5")',
      en: 'Double-Wall Double-Image Elliptical (DWDI — OD ≤ 3.5")',
    },
    description: {
      ar: 'للمواسير الصغيرة (≤ 88.9 مم): يميل المصدر بزاوية 15°–20° لفصل الجدار العلوي عن السفلي على شكل قطع ناقص في لقطتين متعامدتين (0° و 90°).',
      en: 'For small-bore pipe (OD ≤ 3.5"): source offset 15°–20° projects source-side and film-side weld walls as an open ellipse.',
    },
    wallsPenetrated: 2,
    isEllipticalOffset: true,
    geometryKind: 'pipe',
  },
];

export const RT_FILMS: readonly RtFilmClassSpec[] = [
  {
    id: 'class_1',
    code: 'ASTM Class I',
    commercialExamples: 'Agfa D4 / Carestream MX125',
    name: {
      ar: 'فيلم الفئة الأولى فائق النعومة (Class I — D4 / MX125)',
      en: 'ASTM Class I — Extra-Fine Grain, Very High Contrast (D4)',
    },
    exposureMultiplier: 1.75,
    grainNoiseFactor: 0.45,
    contrastGamma: 1.25,
  },
  {
    id: 'class_2',
    code: 'ASTM Class II',
    commercialExamples: 'Agfa D7 / Carestream AA400',
    name: {
      ar: 'فيلم الفئة الثانية القياسي للصناعة (Class II — D7 / AA400)',
      en: 'ASTM Class II — Fine Grain Industrial Standard (D7 / AA400)',
    },
    exposureMultiplier: 1.0,
    grainNoiseFactor: 0.85,
    contrastGamma: 1.0,
  },
  {
    id: 'class_3',
    code: 'ASTM Class III',
    commercialExamples: 'Agfa D8 / High-Speed',
    name: {
      ar: 'فيلم الفئة الثالثة عالي السرعة (Class III — D8)',
      en: 'ASTM Class III — High-Speed Medium Grain (D8)',
    },
    exposureMultiplier: 0.58,
    grainNoiseFactor: 1.45,
    contrastGamma: 0.84,
  },
];

export const RT_DEFECT_LABELS: Record<
  RtDefectClassification,
  { ar: string; en: string; codeAbbr: string }
> = {
  crack: {
    ar: 'شرخ طولي أو عرضي باللحام (Crack — Cr)',
    en: 'Weld Crack (Longitudinal / Transverse — Cr)',
    codeAbbr: 'CRK',
  },
  lack_of_fusion: {
    ar: 'نقص انصهار الجدار الجانبي أو بين التمريرات (Lack of Fusion — LOF)',
    en: 'Incomplete / Lack of Sidewall Fusion (LOF)',
    codeAbbr: 'LOF',
  },
  incomplete_penetration: {
    ar: 'عدم تغلغل جذر اللحام (Incomplete Root Penetration — LOP/IP)',
    en: 'Incomplete Root Penetration (LOP / IP)',
    codeAbbr: 'LOP',
  },
  slag_inclusion: {
    ar: 'شوائب خبث طولية أو مسارات متوازية (Elongated Slag / Wagon Tracks)',
    en: 'Elongated Slag Inclusion / Wagon Tracks (ESI)',
    codeAbbr: 'SLG',
  },
  porosity: {
    ar: 'مسامية غازية عنقودية أو دودية (Clustered / Wormhole Porosity)',
    en: 'Clustered or Wormhole Gas Porosity (POR)',
    codeAbbr: 'POR',
  },
  tungsten_inclusion: {
    ar: 'شوائب تنجستن عالية الكثافة بيضاء (Dense Tungsten Inclusions — W)',
    en: 'Dense Tungsten Inclusions — Bright White (TI)',
    codeAbbr: 'TUNG',
  },
  undercut: {
    ar: 'تقويض داخلي أو خارجي بحواف اللحام (Root / Crown Undercut — UC)',
    en: 'Internal Root or External Toe Undercut (UC)',
    codeAbbr: 'UC',
  },
  sound: {
    ar: 'لحام سليم 100% خالٍ من العيوب المرفوضة (Sound Acceptable Weld)',
    en: 'Sound Weld — No Rejectable Discontinuities',
    codeAbbr: 'OK',
  },
};

export const RT_WELD_SPECIMENS: readonly RtWeldSpecimen[] = [
  {
    id: 'rt-sp-root-crack',
    weldTag: 'W-101 · 8" Sch80 CS',
    title: {
      ar: 'وصلة ماسورة 8" Sch 80 — شرخ طولي متعرج بجذر اللحام',
      en: '8" Sch 80 Carbon Steel Pipe — Longitudinal Root Crack',
    },
    materialSpec: 'ASTM A106 Gr. B (t = 12.7 mm)',
    weldingProcess: 'GTAW Root + SMAW Fill/Cap (E7018)',
    geometryKind: 'pipe',
    outerDiameterMm: 219.1,
    wallThicknessMm: 12.7,
    weldWidthMm: 16,
    recommendedTechnique: 'dwsi_contact',
    recommendedSource: 'ir192',
    primaryClassification: 'crack',
    primaryLengthMm: 18.0,
    indications: [
      {
        id: 'ind-crk-1',
        type: 'crack',
        label: {
          ar: 'شرخ طولي متشعب دقيق بجذر اللحام (18.0 مم)',
          en: 'Fine jagged longitudinal root crack (18.0 mm)',
        },
        xMm: 126,
        yOffsetMm: 0.8,
        lengthMm: 18.0,
        widthMm: 1.1,
        densityDelta: 0.68,
        isPrimary: true,
      },
      {
        id: 'ind-por-minor',
        type: 'porosity',
        label: { ar: 'فجوة غازية منفردة دقيقة (1.4 مم)', en: 'Isolated fine gas pore (1.4 mm)' },
        xMm: 188,
        yOffsetMm: -3.2,
        lengthMm: 1.4,
        widthMm: 1.4,
        densityDelta: 0.38,
        isPrimary: false,
      },
    ],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'REJECT',
        maxAllowedMm: 0,
        clause: 'ASME Sec VIII Div. 1 UW-51(b)(1)',
        reason: {
          ar: 'مرفوض قطعاً: أي شرخ (Crack) مهما كان طوله مرفوض بدون أي سماحية في جميع الأكواد.',
          en: 'Strictly REJECT: Any crack indication is unacceptable regardless of length (zero tolerance).',
        },
      },
      ASME_B31_3: {
        verdict: 'REJECT',
        maxAllowedMm: 0,
        clause: 'ASME B31.3 Table 341.3.2 (Cracks)',
        reason: {
          ar: 'مرفوض قطعاً: لا يُسمح بأي شروخ في خطوط أنابيب العمليات تحت أي فئة خدمة.',
          en: 'Strictly REJECT: Zero crack tolerance across all B31.3 fluid service categories.',
        },
      },
      API_1104: {
        verdict: 'REJECT',
        maxAllowedMm: 0,
        clause: 'API 1104 Sec. 9.3.10 (Cracks)',
        reason: {
          ar: 'مرفوض: الشروخ الطولية والعرضية مرفوضة ما لم تكن شرخ فوهة سطحي ضحل أقل من 4 مم.',
          en: 'REJECT: Longitudinal root cracks are unacceptable regardless of length under API 1104.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'يظهر الشرخ على الفيلم كخط داكن رفيع متعرج (Zigzag/Feathered) ذي أطراف مدببة متلاشية نتيجة تمزق المعدن تحت إجهادات الانكماش.',
      en: 'Appears on the radiograph as a fine, dark, wavy filamentary line with feathered tapering tips near the root centerline.',
    },
  },
  {
    id: 'rt-sp-lop',
    weldTag: 'W-104 · 18mm Plate',
    title: {
      ar: 'لوح وعاء ضغط 18 مم — عدم تغلغل جذر اللحام (Incomplete Penetration)',
      en: '18 mm Vessel Shell Plate — Incomplete Root Penetration (LOP)',
    },
    materialSpec: 'SA-516 Gr. 70 (t = 18.0 mm)',
    weldingProcess: 'SMAW Single-V Butt Weld',
    geometryKind: 'plate',
    wallThicknessMm: 18.0,
    weldWidthMm: 18,
    recommendedTechnique: 'swsi_plate',
    recommendedSource: 'ir192',
    primaryClassification: 'incomplete_penetration',
    primaryLengthMm: 24.0,
    indications: [
      {
        id: 'ind-lop-1',
        type: 'incomplete_penetration',
        label: {
          ar: 'عدم تغلغل جذري مستقيم حاد الحواف بالمنتصف (24.0 مم)',
          en: 'Sharp-edged straight centerline root LOP (24.0 mm)',
        },
        xMm: 118,
        yOffsetMm: 0,
        lengthMm: 24.0,
        widthMm: 2.3,
        densityDelta: 0.78,
        isPrimary: true,
      },
    ],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'REJECT',
        maxAllowedMm: 0,
        clause: 'ASME Sec VIII Div. 1 UW-51(b)(1)',
        reason: {
          ar: 'مرفوض قطعاً: عدم التغلغل الجذري (Incomplete Penetration) مرفوض بالكامل في الفحص الكامل UW-51.',
          en: 'REJECT: Any zone of incomplete penetration is non-negotiably unacceptable under UW-51.',
        },
      },
      ASME_B31_3: {
        verdict: 'REJECT',
        maxAllowedMm: 1.0,
        clause: 'ASME B31.3 Table 341.3.2 (Severe Cyclic / Normal)',
        reason: {
          ar: 'مرفوض: طول عدم التغلغل (24 مم) وعمقه يتجاوزان الحد المسموح به.',
          en: 'REJECT: 24.0 mm continuous root LOP exceeds allowable B31.3 limits.',
        },
      },
      API_1104: {
        verdict: 'REJECT',
        maxAllowedMm: 25.0,
        clause: 'API 1104 Sec. 9.3.1 (IP — High Density)',
        reason: {
          ar: 'مرفوض هندسياً لشدة كثافة الفجوة الجذرية المفتوحة عبر منتصف الجذر.',
          en: 'REJECT due to severe unpenetrated root gap density exceeding weld root crown density.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'يظهر عدم التغلغل (LOP) كشريط داكن مستقيم تماماً ذي حافتين متوازيتين حادتين في منتصف شريط الجذر الفاتح تماماً.',
      en: 'Recognized by a straight, uniform dark band with crisp parallel edges running dead-center down the lighter root pass.',
    },
  },
  {
    id: 'rt-sp-lof',
    weldTag: 'W-109 · 12" P11 Pipe',
    title: {
      ar: 'خط بخار 12" سبيكة P11 — نقص انصهار الجدار الجانبي (Sidewall LOF)',
      en: '12" Alloy P11 Steam Line — Sidewall Lack of Fusion (LOF)',
    },
    materialSpec: 'ASTM A335 P11 (t = 15.9 mm)',
    weldingProcess: 'GMAW / FCAW Narrow Bevel',
    geometryKind: 'pipe',
    outerDiameterMm: 323.8,
    wallThicknessMm: 15.9,
    weldWidthMm: 17,
    recommendedTechnique: 'dwsi_contact',
    recommendedSource: 'xray_directional',
    primaryClassification: 'lack_of_fusion',
    primaryLengthMm: 29.0,
    indications: [
      {
        id: 'ind-lof-1',
        type: 'lack_of_fusion',
        label: {
          ar: 'خط نقص انصهار مستقيم بمحاذاة وجه الشطف العلوي (29.0 مم)',
          en: 'Straight sidewall lack-of-fusion line along bevel face (29.0 mm)',
        },
        xMm: 135,
        yOffsetMm: -4.8,
        lengthMm: 29.0,
        widthMm: 1.3,
        densityDelta: 0.56,
        isPrimary: true,
      },
    ],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'REJECT',
        maxAllowedMm: 0,
        clause: 'ASME Sec VIII Div. 1 UW-51(b)(1)',
        reason: {
          ar: 'مرفوض قطعاً: نقص الانصهار (Lack of Fusion) عيب مستوٍ مرفوض بغض النظر عن طوله.',
          en: 'REJECT: Planar lack of fusion is strictly unacceptable regardless of length under UW-51.',
        },
      },
      ASME_B31_3: {
        verdict: 'REJECT',
        maxAllowedMm: 0,
        clause: 'ASME B31.3 Table 341.3.2',
        reason: {
          ar: 'مرفوض: لا يُسمح بنقص الانصهار في وصلات الأنابيب الحرجة.',
          en: 'REJECT: Lack of fusion is not permitted in B31.3 pressure piping welds.',
        },
      },
      API_1104: {
        verdict: 'REJECT',
        maxAllowedMm: 25.0,
        clause: 'API 1104 Sec. 9.3.4 (IF > 25 mm)',
        reason: {
          ar: 'مرفوض: طول نقص الانصهار (29.0 مم) يتجاوز الحد الأقصى المسموح به في API 1104 وهو 25 مم (1 بوصة).',
          en: 'REJECT: 29.0 mm IF length exceeds the 25 mm (1 in.) maximum limit in API 1104.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'يظهر نقص الانصهار الجانبي كخط داكن رفيع ومستقيم مُزاح بعيداً عن منتصف الجذر وموازٍ لحافة شطف الوصلة (Bevel Face).',
      en: 'Appears as a thin, ruler-straight dark line displaced laterally from the weld centerline along the bevel fusion face.',
    },
  },
  {
    id: 'rt-sp-slag-wagon',
    weldTag: 'W-115 · 24" X65 Line',
    title: {
      ar: 'خط نقل غاز 24" API 5L — شوائب خبث طولية متوازية (Wagon Tracks)',
      en: '24" API 5L X65 Pipeline — Parallel Elongated Slag (Wagon Tracks)',
    },
    materialSpec: 'API 5L Gr. X65 (t = 14.3 mm)',
    weldingProcess: 'SMAW Cellulosic Downhill (E6010 / E8010)',
    geometryKind: 'pipe',
    outerDiameterMm: 609.6,
    wallThicknessMm: 14.3,
    weldWidthMm: 16,
    recommendedTechnique: 'swsi_panoramic',
    recommendedSource: 'xray_panoramic',
    primaryClassification: 'slag_inclusion',
    primaryLengthMm: 21.5,
    indications: [
      {
        id: 'ind-slg-top',
        type: 'slag_inclusion',
        label: {
          ar: 'خط خبث ممدود على جانب خرزة الجذر العلوية (21.5 مم)',
          en: 'Elongated interpass slag line — upper track (21.5 mm)',
        },
        xMm: 112,
        yOffsetMm: -3.1,
        lengthMm: 21.5,
        widthMm: 1.9,
        densityDelta: 0.52,
        isPrimary: true,
      },
      {
        id: 'ind-slg-bot',
        type: 'slag_inclusion',
        label: {
          ar: 'مسار خبث موازٍ (Wagon Track) على الجانب المقابل (19.0 مم)',
          en: 'Parallel wagon-track slag inclusion — lower track (19.0 mm)',
        },
        xMm: 113,
        yOffsetMm: 3.1,
        lengthMm: 19.0,
        widthMm: 1.8,
        densityDelta: 0.49,
        isPrimary: false,
      },
    ],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'REJECT',
        maxAllowedMm: 6.0,
        clause: 'ASME Sec VIII Div. 1 UW-51(b)(2) (t ≤ 19 mm → max 6 mm)',
        reason: {
          ar: 'مرفوض: للسماكات أقل من 19 مم، الحد الأقصى لطول الشائبة الممدودة هو 6.0 مم (1/4 بوصة)، بينما المقاس 21.5 مم.',
          en: 'REJECT: For t ≤ 19 mm, max elongated indication length is 6.0 mm (1/4"); measured 21.5 mm.',
        },
      },
      ASME_B31_3: {
        verdict: 'REJECT',
        maxAllowedMm: 4.8,
        clause: 'ASME B31.3 Table 341.3.2 (max t/3 = 4.77 mm)',
        reason: {
          ar: 'مرفوض: طول شائبة الخبث (21.5 مم) يتجاوز ثلث السماكة (t/3 = 4.8 مم).',
          en: 'REJECT: 21.5 mm elongated slag exceeds the t/3 (4.8 mm) B31.3 limit.',
        },
      },
      API_1104: {
        verdict: 'REJECT',
        maxAllowedMm: 12.7,
        clause: 'API 1104 Sec. 9.3.8.2 (Wagon Tracks > 1/2" / width > 1.6 mm)',
        reason: {
          ar: 'مرفوض: مسارات الخبث المتوازية (Wagon Tracks) بعرض يتجاوز 1.6 مم وطول 21.5 مم تتعدى حدود API 1104.',
          en: 'REJECT: Parallel wagon-track ESI wider than 1.6 mm and 21.5 mm long exceeds API 1104 limits.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'تظهر شوائب الخبث كخطوط داكنة غير منتظمة العرض والمحيط، وفي اللحام السليلوزي تشكل خطين متوازيين على جانبي خرزة الجذر (Wagon Tracks).',
      en: 'Slag inclusions exhibit irregular, ragged widths; trapped on both sides of a convex stringer bead they form classic parallel "wagon tracks".',
    },
  },
  {
    id: 'rt-sp-porosity-cluster',
    weldTag: 'W-122 · 16mm SA516',
    title: {
      ar: 'لوح خزان كروي 16 مم — مسامية غازية عنقودية ودودية (Cluster Porosity)',
      en: '16 mm Spherical Tank Plate — Clustered & Wormhole Porosity',
    },
    materialSpec: 'SA-516 Gr. 70 (t = 16.0 mm)',
    weldingProcess: 'GMAW Shielding Gas Disruption',
    geometryKind: 'plate',
    wallThicknessMm: 16.0,
    weldWidthMm: 17,
    recommendedTechnique: 'swsi_plate',
    recommendedSource: 'se75',
    primaryClassification: 'porosity',
    primaryLengthMm: 19.5,
    indications: [
      {
        id: 'ind-por-cluster',
        type: 'porosity',
        label: {
          ar: 'عنقود مسامات غازية كثيف مع مسام دودي (19.5 مم)',
          en: 'Dense gas porosity cluster with wormhole tail (19.5 mm zone)',
        },
        xMm: 132,
        yOffsetMm: 0.5,
        lengthMm: 19.5,
        widthMm: 6.5,
        densityDelta: 0.62,
        isPrimary: true,
      },
    ],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'REJECT',
        maxAllowedMm: 4.8,
        clause: 'ASME Sec VIII Div. 1 Mandatory Appendix 4',
        reason: {
          ar: 'مرفوض: كثافة المسامية العنقودية وأقطار الفجوات تتجاوز المخططات المرجعية للملحق 4 في ASME VIII.',
          en: 'REJECT: Clustered porosity concentration and aligned wormhole pores exceed ASME VIII Appendix 4 charts.',
        },
      },
      ASME_B31_3: {
        verdict: 'REJECT',
        maxAllowedMm: 4.8,
        clause: 'ASME B31.3 Table 341.3.2 / BPV VIII App. 4',
        reason: {
          ar: 'مرفوض لتجاوز المسامية المتجمعة حدود القبول القياسية للسماكة 16 مم.',
          en: 'REJECT: Clustered porosity exceeds B31.3 Normal Fluid Service porosity allowances.',
        },
      },
      API_1104: {
        verdict: 'REJECT',
        maxAllowedMm: 13.0,
        clause: 'API 1104 Sec. 9.3.9.3 (Cluster Porosity > 13 mm)',
        reason: {
          ar: 'مرفوض: قطر منطقة المسامية العنقودية (19.5 مم) يتجاوز الحد الأقصى 13 مم (1/2 بوصة).',
          en: 'REJECT: Cluster porosity diameter (19.5 mm) exceeds the 13 mm (1/2 in.) API 1104 limit.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'تظهر المسامات الغازية كنقاط دائرية داكنة ناعمة الحواف كفقاعات محتجزة، وقد يمتد منها ذيل مخروطي في حالة المسامية الدودية (Herringbone/Wormhole).',
      en: 'Rounded dark spots with smooth circular contours caused by trapped gas; elongated tadpole tails indicate wormhole piping.',
    },
  },
  {
    id: 'rt-sp-tungsten',
    weldTag: 'W-130 · 2" SS316L TIG',
    title: {
      ar: 'أنبوب ستانلس صغير 2" (DWDI بيضاوي) — شوائب تنجستن بيضاء منفردة',
      en: '2" Sch 80 SS316L Tube (DWDI Elliptical) — Isolated Bright Tungsten',
    },
    materialSpec: 'ASTM A312 TP316L (OD 60.3 mm, t = 5.54 mm)',
    weldingProcess: 'GTAW (TIG) Manual Root & Cap',
    geometryKind: 'pipe',
    outerDiameterMm: 60.3,
    wallThicknessMm: 5.54,
    weldWidthMm: 11,
    recommendedTechnique: 'dwdi_elliptical',
    recommendedSource: 'se75',
    primaryClassification: 'tungsten_inclusion',
    primaryLengthMm: 1.4,
    indications: [
      {
        id: 'ind-tung-1',
        type: 'tungsten_inclusion',
        label: {
          ar: 'شائبة تنجستن ناصعة البياض عالية الكثافة الذرية (1.4 مم)',
          en: 'Bright white high-density Tungsten inclusion (1.4 mm)',
        },
        xMm: 142,
        yOffsetMm: -2.0,
        lengthMm: 1.4,
        widthMm: 1.3,
        densityDelta: -0.68,
        isPrimary: true,
      },
    ],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'ACCEPT',
        maxAllowedMm: 1.8,
        clause: 'ASME Sec VIII Div. 1 App. 4 (Rounded Indication ≤ t/3 = 1.85 mm)',
        reason: {
          ar: 'مقبول (ACCEPT): تُعامل شائبة التنجستن المنفردة كمؤشر دائري (Rounded Indication)، وقطرها 1.4 مم أقل من الحد المسموح t/3 (1.85 مم).',
          en: 'ACCEPT: Isolated tungsten is evaluated as a rounded indication; 1.4 mm size is within the t/3 (1.85 mm) limit.',
        },
      },
      ASME_B31_3: {
        verdict: 'ACCEPT',
        maxAllowedMm: 1.8,
        clause: 'ASME B31.3 Table 341.3.2 (Rounded ≤ t/3)',
        reason: {
          ar: 'مقبول: شائبة تنجستن منفردة بحجم 1.4 مم تقع ضمن السماحية الكودية للسماكة 5.54 مم.',
          en: 'ACCEPT: Single 1.4 mm tungsten particle satisfies B31.3 rounded indication limits.',
        },
      },
      API_1104: {
        verdict: 'ACCEPT',
        maxAllowedMm: 3.0,
        clause: 'API 1104 Sec. 9.3.12 (Isolated Tungsten ≤ 3 mm)',
        reason: {
          ar: 'مقبول: حجم شائبة التنجستن المنفردة (1.4 مم) أقل من الحد الأقصى 3 مم (1/8 بوصة).',
          en: 'ACCEPT: Isolated 1.4 mm tungsten inclusion is well under the 3 mm (1/8 in.) API 1104 limit.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'التنجستن عنصر ثقيل جداً (Z=74، كثافة 19.3 g/cm³) يمتص الأشعة أكثر بكثير من الصلب، فيظهر كنقطة بيضاء ناصعة حادة الحواف وليست داكنة!',
      en: 'Because Tungsten (Z=74, ρ=19.3 g/cm³) attenuates X/Gamma rays far more strongly than steel, it renders BRIGHT WHITE on the film.',
    },
  },
  {
    id: 'rt-sp-undercut',
    weldTag: 'W-138 · 10" Sch40 CS',
    title: {
      ar: 'ماسورة عمليات 10" Sch 40 — تقويض جذري ممتد (Internal Root Undercut)',
      en: '10" Sch 40 Process Pipe — Extended Internal Root Undercut',
    },
    materialSpec: 'ASTM A106 Gr. B (t = 9.27 mm)',
    weldingProcess: 'SMAW High Amperage Root Pass',
    geometryKind: 'pipe',
    outerDiameterMm: 273.0,
    wallThicknessMm: 9.27,
    weldWidthMm: 14,
    recommendedTechnique: 'dwsi_contact',
    recommendedSource: 'xray_directional',
    primaryClassification: 'undercut',
    primaryLengthMm: 36.0,
    indications: [
      {
        id: 'ind-uc-1',
        type: 'undercut',
        label: {
          ar: 'أخدود تقويض داخلي داكن بمحاذاة إصبع خرزة الجذر (36.0 مم)',
          en: 'Dark root toe undercut groove along root bead edge (36.0 mm)',
        },
        xMm: 108,
        yOffsetMm: 2.8,
        lengthMm: 36.0,
        widthMm: 2.1,
        densityDelta: 0.46,
        isPrimary: true,
      },
    ],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'REJECT',
        maxAllowedMm: 12.0,
        clause: 'ASME Sec VIII Div. 1 UW-35 / UW-51 (Undercut > 0.8 mm depth)',
        reason: {
          ar: 'مرفوض: كثافة أخدود التقويض أعلى بكثير من معدن الأساس المجاور مما يدل على تجاوز العمق المسموح 0.8 مم (1/32 بوصة).',
          en: 'REJECT: Optical density of the root toe groove substantially exceeds base metal density, indicating depth > 0.8 mm.',
        },
      },
      ASME_B31_3: {
        verdict: 'REJECT',
        maxAllowedMm: 18.5,
        clause: 'ASME B31.3 Table 341.3.2 (Internal Undercut > 2t length)',
        reason: {
          ar: 'مرفوض: طول التقويض الداخلي (36 مم) وعمقه يتجاوزان حدود القبول في ASME B31.3.',
          en: 'REJECT: 36.0 mm continuous internal undercut exceeds B31.3 length and depth limits.',
        },
      },
      API_1104: {
        verdict: 'REJECT',
        maxAllowedMm: 25.0,
        clause: 'API 1104 Sec. 9.3.11 / Table 4 (EU/IU > 25 mm)',
        reason: {
          ar: 'مرفوض: التقويض يتجاوز الطول المسموح به (25 مم) عند هذا العمق الكثافي.',
          en: 'REJECT: Root undercut length (36.0 mm) exceeds the 25 mm API 1104 Table 4 allowance.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'يظهر التقويض الجذري كشريط داكن غير حاد الحواف ملاصق مباشرةً للحد الفاصل بين خرزة الجذر البيضاء ومعدن الأساس.',
      en: 'Manifests as a diffuse dark shadow groove hugging the immediate toe boundary between the bright root bead and base metal.',
    },
  },
  {
    id: 'rt-sp-sound',
    weldTag: 'W-150 · 20mm Boiler',
    title: {
      ar: 'جسم غلاية بخارية 20 مم — لحام سليم ومطابق 100% (Sound Weld)',
      en: '20 mm Steam Drum Shell — 100% Sound Qualified Butt Weld',
    },
    materialSpec: 'SA-515 Gr. 70 (t = 20.0 mm)',
    weldingProcess: 'SAW / GTAW Qualified WPS',
    geometryKind: 'plate',
    wallThicknessMm: 20.0,
    weldWidthMm: 18,
    recommendedTechnique: 'swsi_plate',
    recommendedSource: 'ir192',
    primaryClassification: 'sound',
    primaryLengthMm: 0,
    indications: [],
    codeVerdicts: {
      ASME_VIII_UW51: {
        verdict: 'ACCEPT',
        maxAllowedMm: 6.3,
        clause: 'ASME Sec VIII Div. 1 UW-51 Full Radiography',
        reason: {
          ar: 'مقبول بامتياز (ACCEPT): نفاذية جذرية مكتملة وتجانس معدني تام ووضوح كامل لسلك IQI المطلوب بدون أي عيوب.',
          en: 'ACCEPT: Complete root fusion, uniform weld crown density, clear essential IQI wire, and zero discontinuities.',
        },
      },
      ASME_B31_3: {
        verdict: 'ACCEPT',
        maxAllowedMm: 6.3,
        clause: 'ASME B31.3 Severe Cyclic & Normal Service',
        reason: {
          ar: 'مقبول: وصلة سليمة خالية من أي انقطاعات مستوية أو حجمية.',
          en: 'ACCEPT: Clean radiograph meeting Severe Cyclic and Normal Fluid Service standards.',
        },
      },
      API_1104: {
        verdict: 'ACCEPT',
        maxAllowedMm: 25.0,
        clause: 'API 1104 Sec. 9.3',
        reason: {
          ar: 'مقبول: لحام قياسي سليم 100%.',
          en: 'ACCEPT: 100% sound weld profile.',
        },
      },
    },
    radiographicSignatureNote: {
      ar: 'تظهر تموجات خرزة الغطاء (Weld Ripples) متناسقة وناعمة مع خط جذر متجانس السطوع وعدم وجود أي خطوط أو بقع داكنة غير طبيعية.',
      en: 'Smooth, rhythmic weld cap ripples and uniform root pass brightness with zero anomalous dark or bright indications.',
    },
  },
];

// ============================================================================
// ASME SECTION V ARTICLE 2 ENGINEERING PHYSICS & EXPOSURE CALCULATIONS
// ============================================================================

export interface GeometricUnsharpnessResult {
  ugMm: number;
  maxAllowedUgMm: number;
  passesAsmeUg: boolean;
  minimumRecommendedSfdMm: number;
}

/**
 * Calculates Geometric Unsharpness: Ug = (F * d) / (D - d)
 * where SFD = D + d => D - d = SFD - 2*d (or per ASME V T-274.1: Ug = F * d / D, with D = SFD - d).
 */
export function computeGeometricUnsharpness(
  focalSpotMm: number,
  sfdMm: number,
  specimenThicknessMm: number,
  wallsPenetrated: 1 | 2 = 1,
  pipeOuterDiameterMm?: number
): GeometricUnsharpnessResult {
  // Object-to-film distance d:
  // For SWSI: specimen thickness + 2 mm cassette standoff
  // For DWSI/DWDI: full pipe OD + 2 mm if DWDI, or wallThickness * 1.4 + 2 mm for DWSI film-side interpretation
  const objectToFilmMm =
    wallsPenetrated === 2 && pipeOuterDiameterMm
      ? Math.max(specimenThicknessMm * 2, Math.min(pipeOuterDiameterMm, 90)) + 2
      : specimenThicknessMm + 2;

  const sourceToObjectMm = Math.max(25, sfdMm - objectToFilmMm);
  const ugMm = Number(((focalSpotMm * objectToFilmMm) / sourceToObjectMm).toFixed(3));

  // ASME Section V Article 2 T-274.2 Maximum Ug table:
  // Under 50 mm (2 in): 0.51 mm (0.020 in)
  // 50 to 75 mm (2–3 in): 0.76 mm (0.030 in)
  // Over 75 to 100 mm (3–4 in): 1.02 mm (0.040 in)
  let maxAllowedUgMm = 0.51;
  if (specimenThicknessMm > 75) {
    maxAllowedUgMm = 1.02;
  } else if (specimenThicknessMm > 50) {
    maxAllowedUgMm = 0.76;
  }

  const minD = (focalSpotMm * objectToFilmMm) / maxAllowedUgMm;
  const minimumRecommendedSfdMm = Math.ceil((minD + objectToFilmMm) / 10) * 10;

  return {
    ugMm,
    maxAllowedUgMm,
    passesAsmeUg: ugMm <= maxAllowedUgMm,
    minimumRecommendedSfdMm,
  };
}

export interface RadiationSafetyResult {
  unshieldedDoseAt1mRhr: number;
  effectiveDoseAt1mRhr: number;
  collimatorReductionFactor: number;
  barricadeRadius2mRhrMeters: number;
  restrictedRadius5mRhrMeters: number;
}

/**
 * Computes Inverse Square Law dose rates & ENRRA / NRC barricade radius (2 mR/hr boundary).
 */
export function computeRadiationSafetyZone(
  source: RtSourceSpec,
  activityCi: number,
  kv: number,
  ma: number,
  hasCollimator: boolean
): RadiationSafetyResult {
  let unshieldedDoseAt1mRhr = 0;

  if (source.category === 'gamma') {
    unshieldedDoseAt1mRhr = Math.max(0.5, activityCi * source.gammaConstantRhmPerCi);
  } else {
    // Empirical industrial X-ray output at 1 m in R/hr (~0.6 * mA * (kV/100)^2 * 6)
    const kvNorm = Math.max(80, kv) / 100;
    unshieldedDoseAt1mRhr = Math.max(1, ma * kvNorm * kvNorm * 5.2);
  }

  // Tungsten 4-HVL collimator reduces surrounding scatter/beam outside cone by ~12x
  const collimatorReductionFactor = hasCollimator ? 12 : 1;
  const effectiveDoseAt1mRhr = unshieldedDoseAt1mRhr / collimatorReductionFactor;

  // 2 mR/hr = 0.002 R/hr => D2 = sqrt(I1_Rhr / 0.002)
  const barricadeRadius2mRhrMeters = Number(
    Math.sqrt(effectiveDoseAt1mRhr / 0.002).toFixed(1)
  );
  const restrictedRadius5mRhrMeters = Number(
    Math.sqrt(effectiveDoseAt1mRhr / 0.005).toFixed(1)
  );

  return {
    unshieldedDoseAt1mRhr: Number(unshieldedDoseAt1mRhr.toFixed(1)),
    effectiveDoseAt1mRhr: Number(effectiveDoseAt1mRhr.toFixed(2)),
    collimatorReductionFactor,
    barricadeRadius2mRhrMeters,
    restrictedRadius5mRhrMeters,
  };
}

export interface AsmeIqiWireSelection {
  setId: 'Set A' | 'Set B' | 'Set C';
  essentialWireNumber: number;
  essentialWireDiameterMm: number;
  packWiresMm: readonly [number, number, number, number, number, number];
}

const ASTM_SET_A: readonly [number, number, number, number, number, number] = [
  0.08, 0.1, 0.13, 0.16, 0.2, 0.25,
];
const ASTM_SET_B: readonly [number, number, number, number, number, number] = [
  0.25, 0.33, 0.4, 0.51, 0.64, 0.81,
];
const ASTM_SET_C: readonly [number, number, number, number, number, number] = [
  0.81, 1.02, 1.27, 1.6, 2.03, 2.54,
];

/**
 * Selects Essential Wire IQI per ASME Section V Article 2 Table T-276
 * (including nominal ~2.5 mm weld reinforcement allowance).
 */
export function selectEssentialAsmeWire(
  singleWallThicknessMm: number,
  isSourceSideIqi: boolean = true
): AsmeIqiWireSelection {
  const nominalWithReinforcementMm = singleWallThicknessMm + 2.4;

  if (nominalWithReinforcementMm <= 6.4) {
    return {
      setId: 'Set A',
      essentialWireNumber: isSourceSideIqi ? 5 : 4,
      essentialWireDiameterMm: isSourceSideIqi ? 0.2 : 0.16,
      packWiresMm: ASTM_SET_A,
    };
  }
  if (nominalWithReinforcementMm <= 12.7) {
    return {
      setId: 'Set B',
      essentialWireNumber: isSourceSideIqi ? 6 : 5,
      essentialWireDiameterMm: isSourceSideIqi ? 0.25 : 0.2,
      packWiresMm: ASTM_SET_B,
    };
  }
  if (nominalWithReinforcementMm <= 19.0) {
    return {
      setId: 'Set B',
      essentialWireNumber: isSourceSideIqi ? 7 : 6,
      essentialWireDiameterMm: isSourceSideIqi ? 0.33 : 0.25,
      packWiresMm: ASTM_SET_B,
    };
  }
  if (nominalWithReinforcementMm <= 25.4) {
    return {
      setId: 'Set B',
      essentialWireNumber: isSourceSideIqi ? 8 : 7,
      essentialWireDiameterMm: isSourceSideIqi ? 0.4 : 0.33,
      packWiresMm: ASTM_SET_B,
    };
  }
  if (nominalWithReinforcementMm <= 38.1) {
    return {
      setId: 'Set B',
      essentialWireNumber: isSourceSideIqi ? 9 : 8,
      essentialWireDiameterMm: isSourceSideIqi ? 0.51 : 0.4,
      packWiresMm: ASTM_SET_B,
    };
  }
  return {
    setId: 'Set C',
    essentialWireNumber: isSourceSideIqi ? 11 : 10,
    essentialWireDiameterMm: isSourceSideIqi ? 0.81 : 0.64,
    packWiresMm: ASTM_SET_C,
  };
}

export interface ExposureCalculationInput {
  source: RtSourceSpec;
  technique: RtTechniqueSpec;
  filmClass: RtFilmClassSpec;
  wallThicknessMm: number;
  sfdMm: number;
  activityCi: number;
  kv: number;
  ma: number;
  hasLeadScreens: boolean;
  hasBackscatterB: boolean;
  developerTempC: number;
  developerMinutes: number;
}

export interface FilmDensityEvaluation {
  optimalExposureSeconds: number;
  penetratedSteelMm: number;
  baseMetalDensity: number;
  weldMetalDensity: number;
  chemicalFogDensity: number;
  backscatterFogTriggered: boolean;
  visibleWiresCount: number;
  essentialWireVisible: boolean;
  passesAsmeDensity: boolean;
  passesFilmQc: boolean;
  qcSummary: { ar: string; en: string };
}

/**
 * Computes optimal exposure time (to achieve ~2.65 H&D weld density) using
 * Inverse Square Law + exponential HVL steel attenuation + film class speed.
 */
export function computeOptimalExposureSeconds(input: ExposureCalculationInput): number {
  const penetratedSteelMm =
    input.wallThicknessMm * input.technique.wallsPenetrated + 2.2;
  const sfdMeters = Math.max(0.2, input.sfdMm / 1000);
  const screenFactor = input.hasLeadScreens ? 1.0 : 1.65;

  if (input.source.category === 'gamma') {
    const effectiveHvl = input.source.steelHvlMm;
    const attenuationFactor = Math.pow(2, penetratedSteelMm / effectiveHvl);
    const activity = Math.max(5, input.activityCi);
    // Calibrated industrial exposure constant yielding realistic field seconds (35s–240s)
    const baseCiMin =
      (2.4 * sfdMeters * sfdMeters * attenuationFactor * input.filmClass.exposureMultiplier * screenFactor) /
      Math.max(0.18, input.source.gammaConstantRhmPerCi);
    const seconds = Math.round((baseCiMin / activity) * 60);
    return Math.min(Math.max(seconds, 12), 900);
  }

  // X-Ray tube exposure calculation (mA·min)
  const kvEffective = Math.max(100, input.kv);
  // Higher kV reduces effective HVL attenuation strongly
  const dynamicHvlMm = Math.max(3.2, (kvEffective / 38) * 1.15);
  const attenuationFactor = Math.pow(2, penetratedSteelMm / dynamicHvlMm);
  const kvEfficiency = Math.pow(200 / kvEffective, 2.3);
  const ma = Math.max(0.5, input.ma);
  const maMinutes =
    1.15 *
    sfdMeters *
    sfdMeters *
    attenuationFactor *
    kvEfficiency *
    input.filmClass.exposureMultiplier *
    screenFactor;
  const seconds = Math.round((maMinutes / ma) * 60);
  return Math.min(Math.max(seconds, 8), 600);
}

/**
 * Evaluates developed radiographic film density (H&D), contrast, IQI wire visibility,
 * and ASME Section V Article 2 T-282 / T-283 compliance.
 */
export function evaluateDevelopedFilm(
  input: ExposureCalculationInput,
  actualExposureSeconds: number,
  ugMm: number,
  maxAllowedUgMm: number
): FilmDensityEvaluation {
  const optimalExposureSeconds = computeOptimalExposureSeconds(input);
  const penetratedSteelMm =
    input.wallThicknessMm * input.technique.wallsPenetrated + 2.2;

  const exposureRatio = Math.max(0.05, actualExposureSeconds / optimalExposureSeconds);

  // Darkroom chemical development multiplier (standard: 20°C for 5.0 min)
  const tempFactor = 1 + (input.developerTempC - 20) * 0.055;
  const timeFactor = Math.pow(Math.max(1, input.developerMinutes) / 5, 0.55);
  const devMultiplier = Math.max(0.45, Math.min(1.65, tempFactor * timeFactor));

  const chemicalFogDensity = Number(
    (
      0.16 +
      Math.max(0, (input.developerTempC - 22) * 0.04) +
      (!input.hasLeadScreens ? 0.22 : 0)
    ).toFixed(2)
  );

  // Characteristic H&D film curve centered around 2.65 H&D at optimal exposure
  const rawWeldDensity =
    chemicalFogDensity +
    2.48 * Math.pow(exposureRatio, 0.72 * input.filmClass.contrastGamma) * devMultiplier;

  const weldMetalDensity = Number(Math.min(4.85, Math.max(0.35, rawWeldDensity)).toFixed(2));
  // Base metal is slightly thinner than weld reinforcement -> ~0.28 H&D darker
  const baseMetalDensity = Number(
    Math.min(4.95, weldMetalDensity + 0.28 * input.filmClass.contrastGamma).toFixed(2)
  );

  const backscatterFogTriggered = !input.hasLeadScreens || !input.hasBackscatterB;

  const minD = input.source.minAllowedDensityAsme;
  const passesAsmeDensity = weldMetalDensity >= minD && weldMetalDensity <= 4.0;

  // Calculate how many of the 6 IQI wires are discernible on the film
  let qualityScore = 6;
  if (weldMetalDensity < minD) {
    qualityScore -= Math.ceil((minD - weldMetalDensity) * 2.6);
  } else if (weldMetalDensity > 4.0) {
    qualityScore -= Math.ceil((weldMetalDensity - 4.0) * 2.5);
  }
  if (ugMm > maxAllowedUgMm) {
    qualityScore -= Math.ceil(((ugMm - maxAllowedUgMm) / maxAllowedUgMm) * 2.5);
  }
  if (!input.hasLeadScreens) {
    qualityScore -= 1;
  }
  if (input.filmClass.id === 'class_3') {
    qualityScore -= 1;
  }

  const visibleWiresCount = Math.max(1, Math.min(6, qualityScore));
  // Essential wire corresponds typically to the 4th/5th finest wire in the selected pack
  const essentialWireVisible = visibleWiresCount >= 4;
  const passesFilmQc =
    passesAsmeDensity &&
    essentialWireVisible &&
    ugMm <= maxAllowedUgMm &&
    input.hasBackscatterB;

  let qcSummary: { ar: string; en: string };
  if (!passesAsmeDensity) {
    qcSummary =
      weldMetalDensity < minD
        ? {
            ar: `مرفوض فنياً (إعادة تصوير): كثافة الفيلم (${weldMetalDensity} H&D) أقل من الحد الأدنى لكود ASME (${minD}). زد زمن التعريض أو النشاط.`,
            en: `Film QC Failed (Reshoot): Weld density (${weldMetalDensity} H&D) is below ASME minimum (${minD}). Increase exposure time.`,
          }
        : {
            ar: `مرفوض فنياً (إعادة تصوير): الفيلم محترق بكثافة مفرطة (${weldMetalDensity} H&D > 4.0). قلل زمن التعريض.`,
            en: `Film QC Failed (Reshoot): Over-exposed film (${weldMetalDensity} H&D > 4.0 max). Reduce exposure time.`,
          };
  } else if (ugMm > maxAllowedUgMm) {
    qcSummary = {
      ar: `مرفوض فنياً: عدم الوضوح الهندسي Ug (${ugMm} مم) يتجاوز حد ASME (${maxAllowedUgMm} مم). ارفع مسافة SFD.`,
      en: `Film QC Failed: Geometric unsharpness Ug (${ugMm} mm) exceeds ASME limit (${maxAllowedUgMm} mm). Increase SFD.`,
    };
  } else if (!input.hasBackscatterB) {
    qcSummary = {
      ar: 'ملاحظة جودة ASME T-223: حرف الرصاص الخلفي "B" غير مركّب للتحقق من الأشعة المرتدة الخلفية.',
      en: 'ASME T-223 Warning: Backscatter lead symbol "B" was omitted from the back of the cassette.',
    };
  } else {
    qcSummary = {
      ar: `الفيلم مطابق تماماً لاشتراطات ASME Sec V Art. 2: الكثافة ${weldMetalDensity} H&D، وسلك الحساسية الأساسي واضح، واللقطة جاهزة لتفسير العيوب.`,
      en: `Film passes ASME Sec V Art. 2 QC: Density ${weldMetalDensity} H&D, essential IQI wire discernible, ready for flaw interpretation.`,
    };
  }

  return {
    optimalExposureSeconds,
    penetratedSteelMm: Number(penetratedSteelMm.toFixed(1)),
    baseMetalDensity,
    weldMetalDensity,
    chemicalFogDensity,
    backscatterFogTriggered,
    visibleWiresCount,
    essentialWireVisible,
    passesAsmeDensity,
    passesFilmQc,
    qcSummary,
  };
}
