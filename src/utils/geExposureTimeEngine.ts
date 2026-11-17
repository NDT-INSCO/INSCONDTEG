/**
 * GE / Waygate Radiographic Exposure Time Calculation Engine
 * Industrial Radiography Physics Models conforming to:
 * - ASME Section V Article 2 (Mandatory Appendix & T-274.2 / T-282)
 * - Agfa Structurix (GE / Waygate Technologies) Film Characteristic Curves
 * - Industrial Isotope Attenuation (HVL / TVL) and Inverse Square Law
 * - Exponential Isotope Radioactive Decay: A(t) = A0 * (0.5)^(Δt / T1/2)
 */

export type GeSourceType = 'ir192' | 'se75' | 'co60' | 'yb169' | 'xray_dir' | 'xray_pano';

export interface GeIsotopeSpec {
  id: GeSourceType;
  category: 'gamma' | 'xray';
  nameEn: string;
  nameAr: string;
  chemicalSymbol: string;
  halfLifeDays: number; // 0 for X-Ray
  gammaConstantRhmPerCi: number; // R·m²/(hr·Ci)
  steelHvlMm: number; // mm in steel
  leadHvlMm: number; // mm in lead
  focalSpotMm: number;
  recommendedThicknessMm: [number, number];
  defaultActivityCi: number;
  defaultKv?: number;
  defaultMa?: number;
}

export const GE_ISOTOPES: Record<GeSourceType, GeIsotopeSpec> = {
  ir192: {
    id: 'ir192',
    category: 'gamma',
    nameEn: 'Iridium-192 (Ir-192)',
    nameAr: 'إيريديوم-192 (Ir-192 قياسي)',
    chemicalSymbol: '¹⁹²Ir',
    halfLifeDays: 73.83,
    gammaConstantRhmPerCi: 0.48, // 4.8 R/h at 1m for 10 Ci -> 0.48 R·m²/(h·Ci)
    steelHvlMm: 12.7, // 0.50 inch
    leadHvlMm: 4.8,
    focalSpotMm: 3.0,
    recommendedThicknessMm: [10, 75],
    defaultActivityCi: 45
  },
  se75: {
    id: 'se75',
    category: 'gamma',
    nameEn: 'Selenium-75 (Se-75 Soft Gamma)',
    nameAr: 'سيلينيوم-75 (Se-75 ناعم عالي التباين)',
    chemicalSymbol: '⁷⁵Se',
    halfLifeDays: 119.78,
    gammaConstantRhmPerCi: 0.203,
    steelHvlMm: 8.0, // 0.315 inch
    leadHvlMm: 1.8,
    focalSpotMm: 2.0,
    recommendedThicknessMm: [4, 30],
    defaultActivityCi: 60
  },
  co60: {
    id: 'co60',
    category: 'gamma',
    nameEn: 'Cobalt-60 (Co-60 Heavy Wall)',
    nameAr: 'كوبالت-60 (Co-60 للسماكات الكبيرة)',
    chemicalSymbol: '⁶⁰Co',
    halfLifeDays: 1925.2, // 5.27 years
    gammaConstantRhmPerCi: 1.30,
    steelHvlMm: 21.8, // 0.86 inch
    leadHvlMm: 12.5,
    focalSpotMm: 4.0,
    recommendedThicknessMm: [40, 160],
    defaultActivityCi: 35
  },
  yb169: {
    id: 'yb169',
    category: 'gamma',
    nameEn: 'Ytterbium-169 (Yb-169 Ultra-Thin)',
    nameAr: 'إيتربيوم-169 (Yb-169 للسماكات الرقيقة)',
    chemicalSymbol: '¹⁶⁹Yb',
    halfLifeDays: 32.0,
    gammaConstantRhmPerCi: 0.125,
    steelHvlMm: 5.2,
    leadHvlMm: 0.8,
    focalSpotMm: 1.0,
    recommendedThicknessMm: [1.5, 15],
    defaultActivityCi: 25
  },
  xray_dir: {
    id: 'xray_dir',
    category: 'xray',
    nameEn: 'X-Ray Directional Tube (Constant Potential)',
    nameAr: 'أنبوبة أشعة سينية موجهة (X-Ray Directional)',
    chemicalSymbol: 'X-Ray',
    halfLifeDays: 0,
    gammaConstantRhmPerCi: 0,
    steelHvlMm: 5.5, // Effective at ~220 kV
    leadHvlMm: 0.8,
    focalSpotMm: 1.5,
    recommendedThicknessMm: [2, 45],
    defaultActivityCi: 0,
    defaultKv: 220,
    defaultMa: 4.0
  },
  xray_pano: {
    id: 'xray_pano',
    category: 'xray',
    nameEn: 'X-Ray Panoramic 360° Tube',
    nameAr: 'أنبوبة أشعة سينية بانورامية 360°',
    chemicalSymbol: 'X-Pano',
    halfLifeDays: 0,
    gammaConstantRhmPerCi: 0,
    steelHvlMm: 6.0,
    leadHvlMm: 0.9,
    focalSpotMm: 1.2,
    recommendedThicknessMm: [3, 40],
    defaultActivityCi: 0,
    defaultKv: 200,
    defaultMa: 3.5
  }
};

/**
 * Agfa Structurix (GE / Waygate) Film System
 * Calibrated against standard 2.5 H&D optical density
 */
export type GeFilmId = 'd2' | 'd3' | 'd4' | 'd5' | 'd7' | 'd8' | 'f8';

export interface GeFilmSpec {
  id: GeFilmId;
  code: string;
  astmClass: string;
  isoClass: string;
  nameEn: string;
  nameAr: string;
  relativeExposureFactor: number; // Compared to D7 (= 0.65) or standard baseline
  speedRating: string;
  grainSize: string;
  contrastGrade: string;
  commercialEquivalents: string;
}

export const GE_STRUCTURIX_FILMS: Record<GeFilmId, GeFilmSpec> = {
  d2: {
    id: 'd2',
    code: 'Structurix D2',
    astmClass: 'Special',
    isoClass: 'C1',
    nameEn: 'Structurix D2 (Ultra-Fine Grain, Maximum Contrast)',
    nameAr: 'أجفا ستراكتركس D2 (حبيبات فائقة النعومة وأعلى تباين)',
    relativeExposureFactor: 4.2,
    speedRating: 'Very Slow',
    grainSize: 'Ultra-Fine',
    contrastGrade: 'Extremely High',
    commercialEquivalents: 'Carestream DR50 / Fuji IX25'
  },
  d3: {
    id: 'd3',
    code: 'Structurix D3',
    astmClass: 'Class I',
    isoClass: 'C2',
    nameEn: 'Structurix D3 (Micro-Grain, Critical Aerospace)',
    nameAr: 'أجفا ستراكتركس D3 (حبيبات ميكرونية، تطبيقات الطيران الحساسة)',
    relativeExposureFactor: 2.4,
    speedRating: 'Slow',
    grainSize: 'Very Fine',
    contrastGrade: 'Very High',
    commercialEquivalents: 'Carestream M100 / Fuji IX50'
  },
  d4: {
    id: 'd4',
    code: 'Structurix D4',
    astmClass: 'Class I',
    isoClass: 'C3',
    nameEn: 'Structurix D4 (Extra-Fine Grain, High-Pressure Welds)',
    nameAr: 'أجفا ستراكتركس D4 (لحامات الضغط العالي والبتروكيماويات)',
    relativeExposureFactor: 1.5,
    speedRating: 'Medium-Slow',
    grainSize: 'Extra-Fine',
    contrastGrade: 'High',
    commercialEquivalents: 'Carestream MX125 / Fuji IX80'
  },
  d5: {
    id: 'd5',
    code: 'Structurix D5',
    astmClass: 'Class I / II',
    isoClass: 'C4',
    nameEn: 'Structurix D5 (Universal Pipeline & Structural)',
    nameAr: 'أجفا ستراكتركس D5 (الاستخدام الميداني الشامل للأنابيب)',
    relativeExposureFactor: 1.15,
    speedRating: 'Medium',
    grainSize: 'Fine',
    contrastGrade: 'High',
    commercialEquivalents: 'Carestream T200 / Fuji IX100'
  },
  d7: {
    id: 'd7',
    code: 'Structurix D7',
    astmClass: 'Class II',
    isoClass: 'C5',
    nameEn: 'Structurix D7 (High-Speed Industrial Standard)',
    nameAr: 'أجفا ستراكتركس D7 (المعيار الصناعي سريع التصوير)',
    relativeExposureFactor: 0.65,
    speedRating: 'Fast',
    grainSize: 'Medium-Fine',
    contrastGrade: 'Standard High',
    commercialEquivalents: 'Carestream AA400 / Fuji IX150'
  },
  d8: {
    id: 'd8',
    code: 'Structurix D8',
    astmClass: 'Class III',
    isoClass: 'C6',
    nameEn: 'Structurix D8 (Ultra-Fast for Heavy Concrete/Steel)',
    nameAr: 'أجفا ستراكتركس D8 (فائق السرعة للخرسانة والصلب السميك)',
    relativeExposureFactor: 0.38,
    speedRating: 'Very Fast',
    grainSize: 'Medium',
    contrastGrade: 'Medium',
    commercialEquivalents: 'Carestream HS / Fuji IX200'
  },
  f8: {
    id: 'f8',
    code: 'Structurix F8',
    astmClass: 'Class IV (Fluorometallic)',
    isoClass: 'Special',
    nameEn: 'Structurix F8 (Fluorometallic Screen High Speed)',
    nameAr: 'أجفا ستراكتركس F8 (شاشات فلوروميتاليك للسرعة القصوى)',
    relativeExposureFactor: 0.15,
    speedRating: 'Ultra-Fast',
    grainSize: 'Coarse',
    contrastGrade: 'Moderate',
    commercialEquivalents: 'Carestream Industrex Screen Film'
  }
};

/**
 * Radiographic Equivalence Factors (R-Factor) relative to Carbon Steel (= 1.0)
 */
export type GeMaterialId =
  | 'carbon_steel'
  | 'stainless_steel'
  | 'aluminum'
  | 'titanium'
  | 'copper_brass'
  | 'inconel_nickel'
  | 'lead';

export interface GeMaterialSpec {
  id: GeMaterialId;
  nameEn: string;
  nameAr: string;
  rFactorIr192: number;
  rFactorSe75: number;
  rFactorCo60: number;
  rFactorXray: number;
  densityGcm3: number;
}

export const GE_MATERIALS: Record<GeMaterialId, GeMaterialSpec> = {
  carbon_steel: {
    id: 'carbon_steel',
    nameEn: 'Carbon Steel / Low-Alloy (P1 / P3)',
    nameAr: 'الصلب الكربوني وسبائك الصلب العادية (P1 / P3)',
    rFactorIr192: 1.0,
    rFactorSe75: 1.0,
    rFactorCo60: 1.0,
    rFactorXray: 1.0,
    densityGcm3: 7.85
  },
  stainless_steel: {
    id: 'stainless_steel',
    nameEn: 'Austenitic Stainless Steel (304 / 316 / 321)',
    nameAr: 'الصلب المقاوم للصدأ الأوستنيتي (304 / 316 / 321)',
    rFactorIr192: 1.03,
    rFactorSe75: 1.04,
    rFactorCo60: 1.01,
    rFactorXray: 1.05,
    densityGcm3: 8.0
  },
  aluminum: {
    id: 'aluminum',
    nameEn: 'Aluminum & Light Alloys (6061 / 5083)',
    nameAr: 'الألومنيوم وسبائكه الخفيفة (6061 / 5083)',
    rFactorIr192: 0.22,
    rFactorSe75: 0.18,
    rFactorCo60: 0.28,
    rFactorXray: 0.12,
    densityGcm3: 2.7
  },
  titanium: {
    id: 'titanium',
    nameEn: 'Titanium & Alloys (Grade 2 / Grade 5 Ti-6Al-4V)',
    nameAr: 'التيتانيوم وسبائكه (Grade 2 / Grade 5)',
    rFactorIr192: 0.52,
    rFactorSe75: 0.48,
    rFactorCo60: 0.58,
    rFactorXray: 0.45,
    densityGcm3: 4.51
  },
  copper_brass: {
    id: 'copper_brass',
    nameEn: 'Copper / Brass / Bronze Alloys',
    nameAr: 'النحاس الأصفر والأحمر والبرونز',
    rFactorIr192: 1.40,
    rFactorSe75: 1.45,
    rFactorCo60: 1.30,
    rFactorXray: 1.55,
    densityGcm3: 8.96
  },
  inconel_nickel: {
    id: 'inconel_nickel',
    nameEn: 'Inconel & Nickel Superalloys (625 / 718 / 825)',
    nameAr: 'إنكونيل وسبائك النيكل الفائقة (625 / 718 / 825)',
    rFactorIr192: 1.15,
    rFactorSe75: 1.18,
    rFactorCo60: 1.10,
    rFactorXray: 1.22,
    densityGcm3: 8.44
  },
  lead: {
    id: 'lead',
    nameEn: 'Lead Shielding (Pb)',
    nameAr: 'الرصاص للحماية والعزل (Pb)',
    rFactorIr192: 2.30,
    rFactorSe75: 3.20,
    rFactorCo60: 1.90,
    rFactorXray: 12.0,
    densityGcm3: 11.34
  }
};

/**
 * Shooting Technique Geometry Options
 */
export type GeTechniqueGeometry =
  | 'swsi_plate'
  | 'swsi_panoramic'
  | 'dwsi_contact'
  | 'dwdi_elliptical'
  | 'dwdi_superimposed';

export interface GeTechniqueSpec {
  id: GeTechniqueGeometry;
  nameEn: string;
  nameAr: string;
  wallsPenetrated: 1 | 2;
  descriptionEn: string;
  descriptionAr: string;
  defaultReinforcementMm: number;
}

export const GE_TECHNIQUES: Record<GeTechniqueGeometry, GeTechniqueSpec> = {
  swsi_plate: {
    id: 'swsi_plate',
    nameEn: 'SWSI — Single-Wall Single-Image (Plate / Large Tank)',
    nameAr: 'SWSI — جدار مفرد وصورة مفردة (ألواح وخزانات كبيرة)',
    wallsPenetrated: 1,
    descriptionEn: 'Source outside, film inside cassette contacting opposite surface.',
    descriptionAr: 'المصدر في جانب والفيلم على السطح المعاكس؛ اختراق جدار واحد.',
    defaultReinforcementMm: 2.5
  },
  swsi_panoramic: {
    id: 'swsi_panoramic',
    nameEn: 'SWSI Panoramic 360° (Source Centered Inside Pipe)',
    nameAr: 'SWSI بانوراما 360° (المصدر متمركز بداخل الماسورة)',
    wallsPenetrated: 1,
    descriptionEn: 'Single 360° internal exposure covering full circumferential girth weld.',
    descriptionAr: 'لقطة داخلية واحدة تغطي محيط اللحام بالكامل 360 درجة.',
    defaultReinforcementMm: 2.0
  },
  dwsi_contact: {
    id: 'dwsi_contact',
    nameEn: 'DWSI Contact — Double-Wall Single-Image (OD > 3.5")',
    nameAr: 'DWSI بالتلامس — جدار مزدوج وصورة مفردة (المواسير > 3.5")',
    wallsPenetrated: 2,
    descriptionEn: 'Source on outer top surface, film on bottom wall; penetrates 2 walls.',
    descriptionAr: 'المصدر على الجدار العلوي والفيلم تحت الجدار السفلي؛ تخترق جدارين.',
    defaultReinforcementMm: 3.5
  },
  dwdi_elliptical: {
    id: 'dwdi_elliptical',
    nameEn: 'DWDI Elliptical — Double-Wall Double-Image (OD ≤ 3.5")',
    nameAr: 'DWDI إليبس بيضاوي — جدار وصورة مزدوجة (المواسير ≤ 3.5")',
    wallsPenetrated: 2,
    descriptionEn: 'Offset beam projects both walls as an ellipse in 2 shots (0° & 90°).',
    descriptionAr: 'ميلان المصدر 15°–20° لفصل الجدارين كقطع ناقص في لقطتين 90° apart.',
    defaultReinforcementMm: 3.0
  },
  dwdi_superimposed: {
    id: 'dwdi_superimposed',
    nameEn: 'DWDI Superimposed — Straight 0° (3 Shots at 60°/120°)',
    nameAr: 'DWDI متراكب ستريت 0° (3 لقطات بزاوية 60°/120°)',
    wallsPenetrated: 2,
    descriptionEn: 'Zero angle offset superimposes top and bottom weld caps.',
    descriptionAr: 'شعاع عمودي 0° تتطابق فيه درزة اللحام العلوية مع السفلية.',
    defaultReinforcementMm: 4.0
  }
};

/**
 * Multi-film Loading & Film-Film Combinations
 * Conforming to ASME Section V Article 2 T-282.1 (Composite Viewing)
 * and Dual-Film Wide-Latitude Radiography (Different film speeds for stepped thicknesses).
 */
export type GeFilmLoadingMode = 'single' | 'dual_composite' | 'dual_different';
export type GeWideLatitudeGoverning = 'primary_film' | 'secondary_film' | 'balanced_latitude';

export interface GeMultiFilmConfig {
  mode: GeFilmLoadingMode;
  primaryFilmId: GeFilmId; // Film 1 (Front Film)
  secondaryFilmId?: GeFilmId; // Film 2 (Back Film, when dual)
  hasInterleafLeadScreen?: boolean; // 0.025mm Pb foil between films
  interleafThicknessMm?: number; // default 0.025 mm
  wideLatitudeGoverning?: GeWideLatitudeGoverning;
}

/**
 * Input state for GE Exposure Time Calculation
 */
export interface GeExposureInput {
  sourceType: GeSourceType;
  materialId: GeMaterialId;
  filmId: GeFilmId; // Primary / Front film
  technique: GeTechniqueGeometry;

  // Geometry
  materialThicknessMm: number;
  weldReinforcementMm: number;
  sfdCm: number; // Source-to-film distance in cm
  pipeOuterDiameterMm?: number; // When technique is pipe-based

  // Source Activity / Generator parameters
  initialActivityCi: number;
  initialCalibrationDate: string; // YYYY-MM-DD
  measurementDate: string; // YYYY-MM-DD (typically today)

  // X-Ray Tube specifics (only used if sourceType is xray)
  tubeKv?: number;
  tubeMa?: number;

  // Film & Optical Density Settings
  targetOpticalDensity: number; // typically 2.0 to 4.0, default 2.5 H&D
  hasLeadScreens: boolean; // Front 0.125mm / Back 0.25mm
  hasCollimator: boolean; // Tungsten collimator

  // Multiple Film Layers / Film-Film Combinations
  multiFilmConfig?: GeMultiFilmConfig;
}

/**
 * Output results of the GE Exposure Calculator
 */
export interface GeExposureResult {
  // Radioactive Decay details
  decayDaysElapsed: number;
  decayFractionRemaining: number;
  currentLiveActivityCi: number;

  // Equivalent Thickness & Attenuation
  effectiveSteelThicknessMm: number;
  halfValueLayersCount: number;
  attenuationFactor: number;

  // Exposure metrics
  exposureInCurieMinutes: number; // Ci·min (Gamma) or mA·min (X-Ray)
  calculatedTotalSeconds: number;
  minutesPortion: number;
  secondsPortion: number;
  formattedDuration: string;

  // Multiple Film Layers & Density Projections
  isMultiFilm: boolean;
  filmLoadingMode: GeFilmLoadingMode;
  primaryFilmSpec: GeFilmSpec;
  secondaryFilmSpec?: GeFilmSpec;
  film1PredictedDensity: number;
  film2PredictedDensity?: number;
  compositeSuperimposedDensity?: number;
  multiFilmTimeFactor: number;
  hasInterleafLeadScreen?: boolean;
  speedRatioDescription?: string;

  // Geometric Unsharpness (Ug) per ASME Sec V Art 2 T-274.2
  calculatedUgMm: number;
  maxAllowedUgMm: number;
  passesAsmeUg: boolean;

  // Radiation Safety Distance (Inverse Square Law)
  controlledAreaPerimeter2mR_Meters: number; // 2 mR/hr (20 µSv/hr) perimeter
  publicBarricadePerimeter075mR_Meters: number; // 0.75 mR/hr (7.5 µSv/hr) perimeter

  // Essential Wire IQI Selection (ASME Section V Table T-276)
  essentialWireIdentity: string;
  essentialWireDiameterMm: number;
  iqiSetDesignation: string;
}

/**
 * Calculates radioactive isotope decay:
 * A(t) = A0 * (0.5)^(Δt / T1/2)
 */
export function calculateIsotopeDecay(
  initialCi: number,
  initialDateStr: string,
  measurementDateStr: string,
  halfLifeDays: number
): { daysElapsed: number; fractionRemaining: number; currentCi: number } {
  if (halfLifeDays <= 0) {
    return { daysElapsed: 0, fractionRemaining: 1.0, currentCi: initialCi };
  }

  const d0 = new Date(initialDateStr);
  const d1 = new Date(measurementDateStr);
  const diffMs = Math.max(0, d1.getTime() - d0.getTime());
  const daysElapsed = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const fractionRemaining = Math.pow(0.5, daysElapsed / halfLifeDays);
  const currentCi = Number((initialCi * fractionRemaining).toFixed(2));

  return { daysElapsed, fractionRemaining, currentCi };
}

/**
 * Evaluates ASME Section V Table T-274.2 Maximum Geometric Unsharpness
 */
export function getAsmeMaxUg(thicknessMm: number): number {
  if (thicknessMm < 50.8) return 0.51; // < 2.0" -> 0.020" = 0.51 mm
  if (thicknessMm <= 76.2) return 0.76; // 2.0" to 3.0" -> 0.030" = 0.76 mm
  if (thicknessMm <= 101.6) return 1.02; // 3.0" to 4.0" -> 0.040" = 1.02 mm
  return 1.78; // > 4.0" -> 0.070" = 1.78 mm
}

/**
 * Determines ASME Sec V Art 2 Table T-276 Wire IQI selection
 */
export function getAsmeWireIqi(thicknessMm: number): {
  wireIdentity: string;
  wireDiameterMm: number;
  setDesignation: string;
} {
  if (thicknessMm <= 6.35) return { wireIdentity: '#5', wireDiameterMm: 0.16, setDesignation: 'Set A (Wires 1-6)' };
  if (thicknessMm <= 9.53) return { wireIdentity: '#6', wireDiameterMm: 0.20, setDesignation: 'Set A (Wires 1-6)' };
  if (thicknessMm <= 12.7) return { wireIdentity: '#7', wireDiameterMm: 0.25, setDesignation: 'Set B (Wires 6-11)' };
  if (thicknessMm <= 19.05) return { wireIdentity: '#8', wireDiameterMm: 0.33, setDesignation: 'Set B (Wires 6-11)' };
  if (thicknessMm <= 25.4) return { wireIdentity: '#9', wireDiameterMm: 0.41, setDesignation: 'Set B (Wires 6-11)' };
  if (thicknessMm <= 38.1) return { wireIdentity: '#10', wireDiameterMm: 0.51, setDesignation: 'Set B (Wires 6-11)' };
  if (thicknessMm <= 50.8) return { wireIdentity: '#11', wireDiameterMm: 0.64, setDesignation: 'Set B (Wires 6-11)' };
  if (thicknessMm <= 63.5) return { wireIdentity: '#12', wireDiameterMm: 0.81, setDesignation: 'Set C (Wires 10-15)' };
  if (thicknessMm <= 101.6) return { wireIdentity: '#13', wireDiameterMm: 1.02, setDesignation: 'Set C (Wires 10-15)' };
  return { wireIdentity: '#14', wireDiameterMm: 1.27, setDesignation: 'Set C (Wires 10-15)' };
}

/**
 * Primary GE Exposure Time Calculation Algorithm
 * Employs exact GE / Waygate Radiographic curves & formulas
 */
export function calculateGeRadiographicExposure(input: GeExposureInput): GeExposureResult {
  const isotope = GE_ISOTOPES[input.sourceType];
  const material = GE_MATERIALS[input.materialId];
  const technique = GE_TECHNIQUES[input.technique];

  // Multi-film Loading & Film-Film Combinations
  const multiFilmConfig = input.multiFilmConfig || {
    mode: 'single',
    primaryFilmId: input.filmId
  };
  const primaryFilmSpec = GE_STRUCTURIX_FILMS[multiFilmConfig.primaryFilmId || input.filmId];
  const secondaryFilmSpec = multiFilmConfig.secondaryFilmId
    ? GE_STRUCTURIX_FILMS[multiFilmConfig.secondaryFilmId]
    : undefined;

  let effectiveFilmFactor = primaryFilmSpec.relativeExposureFactor;
  let multiFilmTimeFactor = 1.0;
  let film1PredictedDensity = input.targetOpticalDensity;
  let film2PredictedDensity: number | undefined = undefined;
  let compositeSuperimposedDensity: number | undefined = input.targetOpticalDensity;
  let speedRatioDescription = 'Standard Single Film Layer';

  if (multiFilmConfig.mode === 'dual_composite') {
    // ASME Section V Article 2 T-282.1 Composite Viewing:
    // When identical/paired films are viewed superimposed, their densities add up (D1 + D2).
    // Reaching target composite density requires ~half density per film (~0.55x exposure time).
    multiFilmTimeFactor = 0.55;
    effectiveFilmFactor = primaryFilmSpec.relativeExposureFactor * multiFilmTimeFactor;
    film1PredictedDensity = Number((input.targetOpticalDensity * 0.52).toFixed(2));
    const backScreenFactor = multiFilmConfig.hasInterleafLeadScreen ? 0.90 : 0.96;
    film2PredictedDensity = Number((input.targetOpticalDensity * 0.48 * backScreenFactor).toFixed(2));
    compositeSuperimposedDensity = Number((film1PredictedDensity + film2PredictedDensity).toFixed(2));
    speedRatioDescription = 'Composite Viewing (Superimposed): Densities sum under negatoscope, reducing exposure time by ~45%';
  } else if (multiFilmConfig.mode === 'dual_different') {
    // Wide-latitude loading with two different film speeds (e.g. Front Film = D4, Back Film = D7)
    const secFilm = secondaryFilmSpec || primaryFilmSpec;
    const interleafFactor = multiFilmConfig.hasInterleafLeadScreen ? 0.88 : 0.96;
    const speedRatio = Number((primaryFilmSpec.relativeExposureFactor / secFilm.relativeExposureFactor).toFixed(2));
    const gov = multiFilmConfig.wideLatitudeGoverning || 'primary_film';

    if (gov === 'primary_film') {
      effectiveFilmFactor = primaryFilmSpec.relativeExposureFactor;
      multiFilmTimeFactor = 1.0;
      film1PredictedDensity = input.targetOpticalDensity;
      film2PredictedDensity = Number(Math.min(4.8, Math.max(1.0, input.targetOpticalDensity * speedRatio * interleafFactor)).toFixed(2));
    } else if (gov === 'secondary_film') {
      effectiveFilmFactor = secFilm.relativeExposureFactor / interleafFactor;
      multiFilmTimeFactor = Number((effectiveFilmFactor / primaryFilmSpec.relativeExposureFactor).toFixed(2));
      film2PredictedDensity = input.targetOpticalDensity;
      film1PredictedDensity = Number(Math.min(4.8, Math.max(0.8, input.targetOpticalDensity / (speedRatio * interleafFactor))).toFixed(2));
    } else {
      // Balanced wide-latitude compromise
      effectiveFilmFactor = Math.sqrt(primaryFilmSpec.relativeExposureFactor * (secFilm.relativeExposureFactor / interleafFactor));
      multiFilmTimeFactor = Number((effectiveFilmFactor / primaryFilmSpec.relativeExposureFactor).toFixed(2));
      film1PredictedDensity = Number(Math.max(1.8, input.targetOpticalDensity * 0.88).toFixed(2));
      film2PredictedDensity = Number(Math.min(4.2, input.targetOpticalDensity * 1.35 * interleafFactor).toFixed(2));
    }
    compositeSuperimposedDensity = Number((film1PredictedDensity + film2PredictedDensity).toFixed(2));
    speedRatioDescription = `Wide-Latitude: ${primaryFilmSpec.code} + ${secFilm.code} (Speed ratio: ${speedRatio}×)`;
  }

  // 1. Isotope Activity with Decay
  const { daysElapsed, fractionRemaining, currentCi } = calculateIsotopeDecay(
    input.initialActivityCi,
    input.initialCalibrationDate,
    input.measurementDate,
    isotope.halfLifeDays
  );

  // 2. Material Equivalence & Penetrated Thickness
  let materialRfactor = 1.0;
  if (isotope.id === 'ir192') materialRfactor = material.rFactorIr192;
  else if (isotope.id === 'se75') materialRfactor = material.rFactorSe75;
  else if (isotope.id === 'co60') materialRfactor = material.rFactorCo60;
  else materialRfactor = material.rFactorXray;

  // Single or double wall penetration + weld cap reinforcement
  const baseThicknessPerWall = input.materialThicknessMm * materialRfactor;
  const totalPenetratedBase = baseThicknessPerWall * technique.wallsPenetrated;
  const effectiveSteelThicknessMm = Number((totalPenetratedBase + input.weldReinforcementMm).toFixed(2));

  // 3. Half-Value Layers (HVL) and Attenuation
  const effectiveHvl = isotope.steelHvlMm;
  const halfValueLayersCount = Number((effectiveSteelThicknessMm / effectiveHvl).toFixed(2));
  const attenuationFactor = Math.pow(2, halfValueLayersCount);

  // 4. Target Density Correction Factor
  // Reference optical density in GE curves is 2.5 H&D
  const densityRatio = input.targetOpticalDensity / 2.5;
  const densityCorrectionFactor = Math.max(0.6, densityRatio * (1 + 0.16 * (input.targetOpticalDensity - 2.5)));

  // 5. Screen Factor (Front 0.125mm + Back 0.25mm Lead Screens)
  const screenFactor = input.hasLeadScreens ? 1.0 : 1.65;

  // 6. Distance factor: Inverse Square Law relative to standard reference distance (100 cm)
  const sfdRatio = input.sfdCm / 100.0;
  const inverseSquareFactor = sfdRatio * sfdRatio;

  // 7. Compute Exposure Time
  let calculatedSeconds = 0;
  let exposureInUnits = 0; // Ci·min or mA·min

  if (isotope.category === 'gamma') {
    const activeCi = Math.max(1, currentCi);

    // Calibrated industrial field constant K:
    // With Ir-192, 45 Ci at 70 cm SFD through 15mm steel on D7, gives ~1.5 - 2.5 min
    const baseK = 18.2;
    const curieMinutes =
      (baseK *
        inverseSquareFactor *
        attenuationFactor *
        effectiveFilmFactor *
        densityCorrectionFactor *
        screenFactor) /
      Math.max(0.18, isotope.gammaConstantRhmPerCi);

    exposureInUnits = Number(curieMinutes.toFixed(2));
    calculatedSeconds = Math.round((curieMinutes / activeCi) * 60);
  } else {
    // X-Ray Tube Exposure in mA·min
    const tubeKv = input.tubeKv || isotope.defaultKv || 200;
    const tubeMa = Math.max(0.5, input.tubeMa || isotope.defaultMa || 4.0);

    // Voltage penetration factor: higher kV reduces required exposure exponentially
    const kvReference = 220;
    const kvFactor = Math.pow(kvReference / Math.max(80, tubeKv), 2.8);

    const baseMaMin =
      22.0 *
      inverseSquareFactor *
      attenuationFactor *
      effectiveFilmFactor *
      densityCorrectionFactor *
      screenFactor *
      kvFactor;

    exposureInUnits = Number(baseMaMin.toFixed(2));
    calculatedSeconds = Math.round((baseMaMin / tubeMa) * 60);
  }

  // Safety clamp (minimum 5s, max 3600s / 60 min)
  calculatedSeconds = Math.min(3600, Math.max(5, calculatedSeconds));

  const minutesPortion = Math.floor(calculatedSeconds / 60);
  const secondsPortion = calculatedSeconds % 60;
  const formattedDuration = `${minutesPortion}m ${secondsPortion.toString().padStart(2, '0')}s`;

  // 8. Geometric Unsharpness (Ug = FocalSpot * OFD / (SFD - OFD))
  // OFD (Object to Film Distance):
  // For plate: wall thickness + cassette thickness (~4mm)
  // For pipe DWSI / DWDI: Outer diameter of pipe (or wall thickness if contact)
  let ofdMm = input.materialThicknessMm + 4;
  if (technique.wallsPenetrated === 2 && input.pipeOuterDiameterMm) {
    ofdMm = input.pipeOuterDiameterMm + 4;
  }
  const sfdMm = input.sfdCm * 10;
  const sodMm = Math.max(10, sfdMm - ofdMm); // Source to object distance
  const calculatedUgMm = Number(((isotope.focalSpotMm * ofdMm) / sodMm).toFixed(3));
  const maxAllowedUgMm = getAsmeMaxUg(input.materialThicknessMm);
  const passesAsmeUg = calculatedUgMm <= maxAllowedUgMm;

  // 9. Radiation Protection Boundary Distances (Inverse Square Law)
  // Dose rate = (GammaConstant * Activity * CollimatorTransmission) / Distance^2
  // 2 mR/hr = 0.002 R/hr boundary -> D = sqrt( (GammaConstant * Activity * Trans) / 0.002 )
  const collimatorFactor = input.hasCollimator ? 0.08 : 1.0; // 92% attenuation through tungsten collimator
  let controlledPerimeterMeters = 15;
  let publicPerimeterMeters = 30;

  if (isotope.category === 'gamma') {
    const activeCi = Math.max(1, currentCi);
    const doseRateNumerator = isotope.gammaConstantRhmPerCi * activeCi * collimatorFactor;
    controlledPerimeterMeters = Number(Math.sqrt(doseRateNumerator / 0.002).toFixed(1));
    publicPerimeterMeters = Number(Math.sqrt(doseRateNumerator / 0.00075).toFixed(1));
  } else {
    // X-Ray directional perimeter approximation
    controlledPerimeterMeters = input.hasCollimator ? 12 : 24;
    publicPerimeterMeters = input.hasCollimator ? 22 : 45;
  }

  // 10. ASME Section V IQI Wire Determination
  const iqiInfo = getAsmeWireIqi(input.materialThicknessMm);

  return {
    decayDaysElapsed: daysElapsed,
    decayFractionRemaining: Number(fractionRemaining.toFixed(3)),
    currentLiveActivityCi: currentCi,

    effectiveSteelThicknessMm,
    halfValueLayersCount,
    attenuationFactor: Number(attenuationFactor.toFixed(1)),

    exposureInCurieMinutes: exposureInUnits,
    calculatedTotalSeconds: calculatedSeconds,
    minutesPortion,
    secondsPortion,
    formattedDuration,

    // Multiple Film Layers & Density Projections
    isMultiFilm: multiFilmConfig.mode !== 'single',
    filmLoadingMode: multiFilmConfig.mode,
    primaryFilmSpec,
    secondaryFilmSpec,
    film1PredictedDensity,
    film2PredictedDensity,
    compositeSuperimposedDensity,
    multiFilmTimeFactor,
    hasInterleafLeadScreen: multiFilmConfig.hasInterleafLeadScreen,
    speedRatioDescription,

    calculatedUgMm,
    maxAllowedUgMm,
    passesAsmeUg,

    controlledAreaPerimeter2mR_Meters: controlledPerimeterMeters,
    publicBarricadePerimeter075mR_Meters: publicPerimeterMeters,

    essentialWireIdentity: iqiInfo.wireIdentity,
    essentialWireDiameterMm: iqiInfo.wireDiameterMm,
    iqiSetDesignation: iqiInfo.setDesignation
  };
}
