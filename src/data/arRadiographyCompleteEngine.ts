export type ArRtCodeTechniqueId =
  | 'swsi_plate'
  | 'swsi_panoramic'
  | 'swsi_internal_eccentric'
  | 'dwsi_contact'
  | 'dwdi_elliptical'
  | 'dwdi_superimposed'
  | 'double_film_latitude'
  | 'tangential_profile';

export type ArRtRadiationSourceId =
  | 'ir192'
  | 'se75'
  | 'co60'
  | 'xray_directional'
  | 'xray_crawler';

export type ArRtFilmDefectId =
  | 'crack_longitudinal'
  | 'crack_transverse'
  | 'crack_crater'
  | 'incomplete_penetration'
  | 'lack_of_fusion'
  | 'slag_elongated_wagon'
  | 'slag_isolated'
  | 'porosity_scattered'
  | 'porosity_clustered'
  | 'porosity_wormhole'
  | 'porosity_hollow_bead'
  | 'tungsten_inclusion'
  | 'oxide_inclusion'
  | 'undercut_cap'
  | 'undercut_root'
  | 'root_concavity'
  | 'burn_through'
  | 'linear_misalignment_hilo';

export type ArRtDefectCategory =
  | 'planar_crack'
  | 'fusion_penetration'
  | 'slag_inclusion'
  | 'porosity_gas'
  | 'metallic_inclusion'
  | 'geometry_profile';

export type ArRtAcceptanceCodeId =
  | 'ASME_VIII_UW51'
  | 'ASME_VIII_UW52'
  | 'ASME_B31_3_NORMAL'
  | 'ASME_B31_1'
  | 'API_1104'
  | 'AWS_D1_1'
  | 'ISO_10675_1_B';

export interface ArRtRadiationSourceSpec {
  id: ArRtRadiationSourceId;
  shortLabel: string;
  category: 'gamma' | 'xray';
  focalSpotMm: number;
  hvlSteelMm: number;
  minAllowedDensityHd: number;
  recommendedWallRangeMm: [number, number];
  name: { ar: string; en: string };
}

export interface ArRtCodeTechniqueSpec {
  id: ArRtCodeTechniqueId;
  shortCode: string;
  geometryType: 'plate' | 'pipe' | 'transition';
  wallsPenetrated: 1 | 2;
  imagesInterpreted: 1 | 2;
  defaultExposuresFor360: number;
  iqiSideStandard: 'Source-Side' | 'Film-Side' | 'Dual-Pack';
  iqiBasisWall: 'Single-Wall (t)' | 'Double-Wall (2t)';
  codeReferences: string;
  name: { ar: string; en: string };
  summary: { ar: string; en: string };
  fieldSetupRule: { ar: string; en: string };
  defaultOdMm: number;
  defaultWallMm: number;
  defaultSfdMm: number;
  defaultOffsetDeg: number;
}

export interface ArRtFilmDefectSpec {
  id: ArRtFilmDefectId;
  codeSymbol: string;
  category: ArRtDefectCategory;
  name: { ar: string; en: string };
  filmAppearance: { ar: string; en: string };
  weldingCause: { ar: string; en: string };
  /**
   * Optical density shift ΔD relative to surrounding sound weld metal:
   * Positive (+0.32..+0.82) = DARKER indication on radiograph (void/gas/slag/crack).
   * Negative (-0.85) = BRIGHTER/WHITE indication on radiograph (high-Z Tungsten Z=74).
   */
  densityDeltaHd: number;
  defaultLengthMm: number;
  defaultWidthMm: number;
  defaultDepthRatio: number;
  defaultCountInWindow: number;
  isPlanarCritical: boolean;
}

export interface ArRtAcceptanceCodeSpec {
  id: ArRtAcceptanceCodeId;
  shortCode: string;
  editionLabel: string;
  title: { ar: string; en: string };
  scopeSummary: { ar: string; en: string };
}

export interface ArRtTechniquePhysicsInput {
  techniqueId: ArRtCodeTechniqueId;
  sourceId: ArRtRadiationSourceId;
  pipeOdMm: number;
  wallThicknessMm: number;
  sfdMm: number;
  beamOffsetDeg: number;
  secondWallThicknessMm?: number;
  exposureFactorPct?: number; // 100 = optimal calibrated exposure
}

export interface ArRtTechniquePhysicsResult {
  technique: ArRtCodeTechniqueSpec;
  source: ArRtRadiationSourceSpec;
  penetratedThicknessMm: number;
  objectToFilmDistanceMm: number;
  sourceToObjectDistanceMm: number;
  minSfdRequiredForUgMm: number;
  calculatedUgMm: number;
  maxAllowedUgMm: number;
  ugCompliant: boolean;
  axialOffsetMm: number;
  ellipseSeparationMm: number;
  minExposuresRequired: number;
  iqiWireDesignation: string;
  iqiPlacementLabel: { ar: string; en: string };
  weldOpticalDensityHd: number;
  secondaryFilmDensityHd?: number;
  densityCompliant: boolean;
  geometryCompliant: boolean;
  overallCodeCompliant: boolean;
  diagnostics: Array<{
    level: 'pass' | 'warn' | 'fail';
    ar: string;
    en: string;
  }>;
}

export interface ArRtDefectEvaluationInput {
  defectId: ArRtFilmDefectId;
  wallThicknessMm: number;
  indicationLengthMm: number;
  indicationWidthMm: number;
  indicationDepthMm: number;
  indicationCount: number;
  weldEvalWindowMm: number; // e.g., 150 mm or 300 mm
}

export interface ArRtSingleCodeVerdict {
  codeId: ArRtAcceptanceCodeId;
  shortCode: string;
  clauseRef: string;
  verdict: 'ACCEPT' | 'REJECT';
  measuredPrimaryMm: number;
  maxAllowedMm: number;
  utilizationPct: number;
  governingParameter: 'zero_tolerance' | 'length' | 'width_or_diameter' | 'depth' | 'exempt_in_spot';
  ruleFormula: string;
  rationale: { ar: string; en: string };
}

export const AR_RT_RADIATION_SOURCES: readonly ArRtRadiationSourceSpec[] = [
  {
    id: 'ir192',
    shortLabel: 'Ir-192 (F=3.0mm)',
    category: 'gamma',
    focalSpotMm: 3.0,
    hvlSteelMm: 12.5,
    minAllowedDensityHd: 2.0,
    recommendedWallRangeMm: [10, 75],
    name: {
      ar: 'نظير جاما إيريديوم Ir-192 (بؤرة 3.0 مم)',
      en: 'Gamma Iridium-192 (3.0 mm Focal Spot)',
    },
  },
  {
    id: 'se75',
    shortLabel: 'Se-75 (F=2.0mm)',
    category: 'gamma',
    focalSpotMm: 2.0,
    hvlSteelMm: 8.0,
    minAllowedDensityHd: 2.0,
    recommendedWallRangeMm: [4, 30],
    name: {
      ar: 'نظير جاما سيلينيوم Se-75 عالي التباين (بؤرة 2.0 مم)',
      en: 'Gamma Selenium-75 High-Contrast (2.0 mm Spot)',
    },
  },
  {
    id: 'co60',
    shortLabel: 'Co-60 (F=3.5mm)',
    category: 'gamma',
    focalSpotMm: 3.5,
    hvlSteelMm: 21.6,
    minAllowedDensityHd: 2.0,
    recommendedWallRangeMm: [45, 180],
    name: {
      ar: 'نظير جاما كوبالت Co-60 للجدران السميكة (بؤرة 3.5 مم)',
      en: 'Gamma Cobalt-60 Heavy-Wall (3.5 mm Spot)',
    },
  },
  {
    id: 'xray_directional',
    shortLabel: 'X-Ray Dir (F=1.5mm)',
    category: 'xray',
    focalSpotMm: 1.5,
    hvlSteelMm: 6.2,
    minAllowedDensityHd: 1.8,
    recommendedWallRangeMm: [2, 45],
    name: {
      ar: 'أنبوبة إكس راي اتجاهية عالية الدقة (بؤرة 1.5 مم)',
      en: 'Directional X-Ray Tube (1.5 mm Fine Focal Spot)',
    },
  },
  {
    id: 'xray_crawler',
    shortLabel: 'X-Ray 360° Crawler (F=2.2mm)',
    category: 'xray',
    focalSpotMm: 2.2,
    hvlSteelMm: 7.4,
    minAllowedDensityHd: 1.8,
    recommendedWallRangeMm: [5, 38],
    name: {
      ar: 'كراولر إكس راي بانورامي 360° للأنابيب (بؤرة 2.2 مم)',
      en: 'Panoramic 360° Pipeline X-Ray Crawler (2.2 mm Spot)',
    },
  },
];

export const AR_RT_CODE_TECHNIQUES: readonly ArRtCodeTechniqueSpec[] = [
  {
    id: 'swsi_plate',
    shortCode: 'SWSI — Plate / Seam',
    geometryType: 'plate',
    wallsPenetrated: 1,
    imagesInterpreted: 1,
    defaultExposuresFor360: 1,
    iqiSideStandard: 'Source-Side',
    iqiBasisWall: 'Single-Wall (t)',
    codeReferences: 'ASME V Art.2 T-271.1 · ISO 17636-1 Fig. 1 · AWS D1.1 Cl. 8',
    name: {
      ar: '01. جدار مفرد صورة مفردة للألواح والأوعية (SWSI Flat / Vessel Seam)',
      en: '01. SWSI — Single-Wall Single-Image (Plate & Vessel Seam)',
    },
    summary: {
      ar: 'المصدر متعامد 90° خارج الوصلة والفيلم ملاصق للسطح الخلفي؛ أعلى حساسية إشعاعية وأقل غبش هندسي.',
      en: 'Source normal (90°) outside weld with film flush on back surface; highest sensitivity and minimal Ug.',
    },
    fieldSetupRule: {
      ar: 'وضع مقياس الجودة IQI من جهة المصدر وحرف الرصاص B خلف الكاسيت لمراقبة الإشعاع المرتد.',
      en: 'Place wire/hole IQI on source side and lead letter "B" on back of cassette for backscatter check.',
    },
    defaultOdMm: 400,
    defaultWallMm: 16,
    defaultSfdMm: 600,
    defaultOffsetDeg: 0,
  },
  {
    id: 'swsi_panoramic',
    shortCode: 'SWSI — Panoramic 360°',
    geometryType: 'pipe',
    wallsPenetrated: 1,
    imagesInterpreted: 1,
    defaultExposuresFor360: 1,
    iqiSideStandard: 'Film-Side',
    iqiBasisWall: 'Single-Wall (t)',
    codeReferences: 'ASME V T-271.1 · ISO 17636-1 Fig. 11 · API 1104 Sec. 11',
    name: {
      ar: '02. التصوير البانورامي المركزي 360° (SWSI Panoramic Spider / Crawler)',
      en: '02. SWSI — Panoramic 360° Center-Source Exposure',
    },
    summary: {
      ar: 'تمركز المصدر في محور الأنبوب (SFD = OD/2) مع لف حزام الأفلام حول المحيط الكامل بتداخل ≥ 25 مم في لقطة واحدة.',
      en: 'Source centered on pipe axis (SFD = OD/2) exposing full 360° film belt with ≥25 mm overlap in 1 shot.',
    },
    fieldSetupRule: {
      ar: 'تحقق من سنترة العنكبوت (Spider) لمنع تفاوت الكثافة الضوئية وتجاوز الحد الأقصى للغبش الهندسي Ug.',
      en: 'Verify spider/crawler concentricity so SFD stays uniform and Ug remains within ASME T-274.2.',
    },
    defaultOdMm: 406.4,
    defaultWallMm: 11.0,
    defaultSfdMm: 203.2,
    defaultOffsetDeg: 0,
  },
  {
    id: 'swsi_internal_eccentric',
    shortCode: 'SWSI — Internal Offset',
    geometryType: 'pipe',
    wallsPenetrated: 1,
    imagesInterpreted: 1,
    defaultExposuresFor360: 3,
    iqiSideStandard: 'Source-Side',
    iqiBasisWall: 'Single-Wall (t)',
    codeReferences: 'ISO 17636-1 Fig. 9–10 · ASME V T-271.1',
    name: {
      ar: '03. المصدر الداخلي اللامركزي لجدار واحد (SWSI Internal Eccentric)',
      en: '03. SWSI — Internal Off-Center Source (Eccentric SFD ≈ ID)',
    },
    summary: {
      ar: 'إزاحة المصدر داخل الوعاء/الأنبوب قرب الجدار المقابل لمضاعفة مسافة SFD وتقليل الغبش الهندسي Ug للنصف.',
      en: 'Source placed inside pipe near opposite wall (SFD ≈ ID) to double SFD and halve geometric unsharpness Ug.',
    },
    fieldSetupRule: {
      ar: 'يُستخدم عندما يفشل البانورامي المركزي في شرط Ug على الأقطار المتوسطة مع إمكانية الدخول الداخلي.',
      en: 'Ideal when center-panoramic SFD=R violates Ug limits on medium vessels with internal access.',
    },
    defaultOdMm: 273.0,
    defaultWallMm: 14.0,
    defaultSfdMm: 245.0,
    defaultOffsetDeg: 0,
  },
  {
    id: 'dwsi_contact',
    shortCode: 'DWSI — Contact (>3.5")',
    geometryType: 'pipe',
    wallsPenetrated: 2,
    imagesInterpreted: 1,
    defaultExposuresFor360: 3,
    iqiSideStandard: 'Film-Side',
    iqiBasisWall: 'Single-Wall (t)',
    codeReferences: 'ASME V T-271.2(a) · ISO 17636-1 Fig. 13–14 · API 1104',
    name: {
      ar: '04. جداران وصورة مفردة بالتلامس الخارجي (DWSI Contact — OD > 88.9mm)',
      en: '04. DWSI — Double-Wall Single-Image Contact (OD > 3.5")',
    },
    summary: {
      ar: 'تثبيت المصدر خارج الأنبوب مع اختراق جدارين (2t) وتفسير قطاع اللحام الملاصق للفيلم فقط (3 لقطات بزاوية 120° كحد أدنى).',
      en: 'External source penetrates 2 walls (2t) while interpreting only the film-side weld arc (min 3 shots at 120°).',
    },
    fieldSetupRule: {
      ar: 'يُختار سلك IQI بناءً على سماكة جدار مفرد (t) ويوضع جهة الفيلم مع حرف F وفق ASME T-277.1.',
      en: 'Select IQI based on single-wall thickness (t) placed on film side marked with lead letter "F".',
    },
    defaultOdMm: 219.1,
    defaultWallMm: 12.7,
    defaultSfdMm: 240.0,
    defaultOffsetDeg: 6,
  },
  {
    id: 'dwdi_elliptical',
    shortCode: 'DWDI — Elliptical (≤3.5")',
    geometryType: 'pipe',
    wallsPenetrated: 2,
    imagesInterpreted: 2,
    defaultExposuresFor360: 2,
    iqiSideStandard: 'Source-Side',
    iqiBasisWall: 'Double-Wall (2t)',
    codeReferences: 'ASME V T-271.2(b)(1) · ISO 17636-1 Fig. 15–16',
    name: {
      ar: '05. التكنيك الإهليلجي المائل للأنابيب الصغيرة (DWDI Elliptical 15°–25°)',
      en: '05. DWDI — Double-Wall Double-Image Elliptical (OD ≤ 3.5")',
    },
    summary: {
      ar: 'للأنابيب الصغيرة (OD ≤ 88.9 مم): إزاحة محورية للمصدر بزاوية 15°–25° لفصل صورتي الجدار العلوي والسفلي على شكل قطع ناقص في لقطتين متعامدتين (0° و 90°).',
      en: 'For small-bore pipes (OD ≤ 88.9 mm): 15°–25° axial offset separates upper and lower weld walls into an open ellipse in 2 shots (0° & 90°).',
    },
    fieldSetupRule: {
      ar: 'مقدار الإزاحة المحورية القياسي L ≈ SFD/5 + 2W لضمان عدم تداخل جذر اللحام مع الغطاء، وحساب IQI على جدارين (2t).',
      en: 'Target axial offset L ≈ SFD/5 + 2W to separate root & cap; IQI selected on penetrated double-wall (2t).',
    },
    defaultOdMm: 60.3,
    defaultWallMm: 5.5,
    defaultSfdMm: 380.0,
    defaultOffsetDeg: 18,
  },
  {
    id: 'dwdi_superimposed',
    shortCode: 'DWDI — Superimposed 0°',
    geometryType: 'pipe',
    wallsPenetrated: 2,
    imagesInterpreted: 2,
    defaultExposuresFor360: 3,
    iqiSideStandard: 'Source-Side',
    iqiBasisWall: 'Double-Wall (2t)',
    codeReferences: 'ASME V T-271.2(b)(2) · ISO 17636-1 Fig. 17',
    name: {
      ar: '06. تكنيك التطابق المباشر 0° بـ 3 لقطات (DWDI Superimposed Straight)',
      en: '06. DWDI — Superimposed 0° Straight (3 Exposures at 60°/120°)',
    },
    summary: {
      ar: 'للأنابيب الصغيرة سميكة الجدار (Schedule XXS) حين يتعذر فتح الإليبس؛ يتطابق الجداران بزاوية 0° وتؤخذ 3 لقطات بزاوية 60° أو 120°.',
      en: 'Used on heavy-wall small-bore pipes when elliptical offset merges walls; 0° offset superimposes both walls across 3 shots (0°, 60°, 120°).',
    },
    fieldSetupRule: {
      ar: 'يجب تنفيذ 3 لقطات على الأقل بفرق 60° أو 120° لضمان تغطية كامل محيط اللحام دون مناطق عمياء.',
      en: 'Mandatory minimum 3 exposures spaced 60° or 120° apart to inspect 100% of weld circumference.',
    },
    defaultOdMm: 60.3,
    defaultWallMm: 11.1,
    defaultSfdMm: 380.0,
    defaultOffsetDeg: 0,
  },
  {
    id: 'double_film_latitude',
    shortCode: 'Dual-Film Latitude',
    geometryType: 'transition',
    wallsPenetrated: 1,
    imagesInterpreted: 1,
    defaultExposuresFor360: 1,
    iqiSideStandard: 'Dual-Pack',
    iqiBasisWall: 'Single-Wall (t)',
    codeReferences: 'ASME V T-272 & T-277 · ISO 17636-1 Fig. 18–19',
    name: {
      ar: '07. التصوير المزدوج متعدد السماكات (Double-Film Multi-Thickness Latitude)',
      en: '07. Multi-Thickness Double-Film Composite Technique (Flange/Nozzle)',
    },
    summary: {
      ar: 'تحميل فيلمين مختلفي السرعة (Class I + Class II) داخل كاسيت واحد لتصوير وصلات الفلانشات والفوهات متفاوتة السماكة في لقطة واحدة ضمن كثافة 2.0–4.0.',
      en: 'Simultaneous fast + slow films in one cassette to cover thick nozzle/flange neck and thin pipe wall within valid 2.0–4.0 H&D density.',
    },
    fieldSetupRule: {
      ar: 'وضع IQI على السماكة الأقل وآخر على السماكة الأكبر للتأكد من تحقق الحساسية والكثافة في كلا القطاعين.',
      en: 'Place IQIs representing both thin and thick sections; read thick section on fast film and thin section on slow film.',
    },
    defaultOdMm: 323.9,
    defaultWallMm: 12.0,
    defaultSfdMm: 650.0,
    defaultOffsetDeg: 8,
  },
  {
    id: 'tangential_profile',
    shortCode: 'Tangential Corrosion',
    geometryType: 'pipe',
    wallsPenetrated: 2,
    imagesInterpreted: 1,
    defaultExposuresFor360: 2,
    iqiSideStandard: 'Source-Side',
    iqiBasisWall: 'Single-Wall (t)',
    codeReferences: 'ISO 20769-1 · EN 16407-1 (Tangential Wall Profile)',
    name: {
      ar: '08. التصوير المماسي لقياس التآكل والسماكة المتبقية (Tangential Profile RT)',
      en: '08. Tangential Profile Technique (Remaining Wall & CUI Corrosion)',
    },
    summary: {
      ar: 'توجيه الحزمة الإشعاعية مماسياً لحافة الأنبوب (دون إزالة العزل الحراري CUI) لقياس السماكة المتبقية وعمق النقر الداخلي مباشرةً.',
      en: 'Beam aimed tangentially to pipe edge through insulation (CUI) to measure exact remaining wall thickness and internal pitting.',
    },
    fieldSetupRule: {
      ar: 'يتم وضع كرة أو سلك معايرة مرجعي (Comparator Ball) بنفس مستوى مركز الأنبوب لتصحيح معامل التكبير الهندسي.',
      en: 'Mount a dimensional calibration ball/block at pipe centerline plane to correct geometric magnification.',
    },
    defaultOdMm: 168.3,
    defaultWallMm: 9.5,
    defaultSfdMm: 700.0,
    defaultOffsetDeg: 0,
  },
];

export const AR_RT_FILM_DEFECTS: readonly ArRtFilmDefectSpec[] = [
  {
    id: 'crack_longitudinal',
    codeSymbol: 'LC',
    category: 'planar_crack',
    name: {
      ar: 'شرخ طولي باللحام (Longitudinal Crack)',
      en: 'Longitudinal Weld Crack',
    },
    filmAppearance: {
      ar: 'خيط داكن متعرج حاد الأطراف ومتفرع أحياناً يمتد بموازاة محور اللحام.',
      en: 'Fine jagged, sharp-tipped wavy dark filament running parallel to the weld axis.',
    },
    weldingCause: {
      ar: 'إجهادات انكماش حرارية عالية أو تقصف هيدروجيني أو تلوث الكبريت/الفوسفور.',
      en: 'High restraint shrinkage stress, hydrogen embrittlement, or centerline solidification segregation.',
    },
    densityDeltaHd: 0.66,
    defaultLengthMm: 14.0,
    defaultWidthMm: 0.6,
    defaultDepthRatio: 0.35,
    defaultCountInWindow: 1,
    isPlanarCritical: true,
  },
  {
    id: 'crack_transverse',
    codeSymbol: 'TC',
    category: 'planar_crack',
    name: {
      ar: 'شرخ عرضي متعامد (Transverse Crack)',
      en: 'Transverse Weld / HAZ Crack',
    },
    filmAppearance: {
      ar: 'خط داكن رفيع متعرج يقطع معدن اللحام عمودياً وقد يمتد إلى المنطقة المتأثرة بالحرارة HAZ.',
      en: 'Sharp thin dark line perpendicular to weld axis, often extending into adjacent base metal HAZ.',
    },
    weldingCause: {
      ar: 'انكماش طولي مفرط في الفولاذ عالي الصلادة مع وجود هيدروجين منتشر.',
      en: 'Longitudinal axial restraint combined with high-hardness martensitic HAZ and hydrogen.',
    },
    densityDeltaHd: 0.58,
    defaultLengthMm: 9.0,
    defaultWidthMm: 0.5,
    defaultDepthRatio: 0.3,
    defaultCountInWindow: 1,
    isPlanarCritical: true,
  },
  {
    id: 'crack_crater',
    codeSymbol: 'CC',
    category: 'planar_crack',
    name: {
      ar: 'شرخ الفوهة النجمي (Crater / Star Crack)',
      en: 'Crater (Star) Crack',
    },
    filmAppearance: {
      ar: 'خطوط داكنة دقيقة متشعبة على شكل نجمة ثلاثية أو رباعية في نقطة انقطاع القوس الكهربائي.',
      en: 'Fine dark star-shaped radiating prongs localized inside a circular arc-stop crater.',
    },
    weldingCause: {
      ar: 'قطع مفاجئ للقوس الكهربائي قبل ملء فوهة النهاية (Crater Fill).',
      en: 'Abrupt arc termination causing concave shrinkage crater before solidification completes.',
    },
    densityDeltaHd: 0.62,
    defaultLengthMm: 3.5,
    defaultWidthMm: 2.8,
    defaultDepthRatio: 0.22,
    defaultCountInWindow: 1,
    isPlanarCritical: true,
  },
  {
    id: 'incomplete_penetration',
    codeSymbol: 'LOP / IP',
    category: 'fusion_penetration',
    name: {
      ar: 'عدم تغلغل الجذر (Incomplete Root Penetration)',
      en: 'Incomplete Root Penetration (LOP / IP)',
    },
    filmAppearance: {
      ar: 'شريط داكن مستقيم جداً ذو حواف هندسية حادة متوازية في منتصف جذر اللحام تماماً.',
      en: 'Continuous or intermittent straight dark band with razor-sharp parallel edges dead-center on weld root.',
    },
    weldingCause: {
      ar: 'ضيق فتحة الجذر، أو كبر وجه الجذر، أو انخفاض أمبير تمريرة الجذر.',
      en: 'Tight root gap, excessive root face land, low welding current, or overly fast travel speed.',
    },
    densityDeltaHd: 0.78,
    defaultLengthMm: 18.0,
    defaultWidthMm: 1.8,
    defaultDepthRatio: 0.25,
    defaultCountInWindow: 1,
    isPlanarCritical: true,
  },
  {
    id: 'lack_of_fusion',
    codeSymbol: 'LOF / IF',
    category: 'fusion_penetration',
    name: {
      ar: 'عدم انصهار الجدار الجانبي أو بين التمريرات (Lack of Fusion)',
      en: 'Sidewall / Interpass Lack of Fusion (LOF)',
    },
    filmAppearance: {
      ar: 'خط داكن رفيع ومستقيم مُزاح عن المركز بمحاذاة شطف الوصلة (Bevel)، غالباً يصاحبه نقاط خبث.',
      en: 'Thin straight dark line offset from weld center along the bevel fusion face.',
    },
    weldingCause: {
      ar: 'زاوية توجيه خاطئة للإلكترود أو انخفاض الدخل الحراري أو وجود قشور أكسيد على الشطف.',
      en: 'Improper electrode work angle, insufficient heat input, or mill scale on bevel face.',
    },
    densityDeltaHd: 0.48,
    defaultLengthMm: 16.0,
    defaultWidthMm: 0.9,
    defaultDepthRatio: 0.24,
    defaultCountInWindow: 1,
    isPlanarCritical: true,
  },
  {
    id: 'slag_elongated_wagon',
    codeSymbol: 'ESI',
    category: 'slag_inclusion',
    name: {
      ar: 'شوائب خبث طولية / خطوط العربة (Elongated Slag / Wagon Tracks)',
      en: 'Elongated Slag / Wagon Tracks (ESI)',
    },
    filmAppearance: {
      ar: 'خطان داكنان متوازيان غير منتظمي الحواف على جانبي خرزة الجذر (Wagon Tracks) أو شريط خبث متطاول.',
      en: 'Parallel irregular-edged dark lines flanking the root bead (wagon tracks) or elongated non-metallic stringer.',
    },
    weldingCause: {
      ar: 'عدم تنظيف خبث تمريرة الجذر في المجاري الجانبية الضيقة قبل التمريرة الساخنة (Hot Pass).',
      en: 'Incomplete slag removal in undercut grooves beside convex root pass before hot pass.',
    },
    densityDeltaHd: 0.52,
    defaultLengthMm: 12.0,
    defaultWidthMm: 1.4,
    defaultDepthRatio: 0.18,
    defaultCountInWindow: 2,
    isPlanarCritical: false,
  },
  {
    id: 'slag_isolated',
    codeSymbol: 'ISI',
    category: 'slag_inclusion',
    name: {
      ar: 'شوائب خبث منفردة غير منتظمة (Isolated Slag Inclusion)',
      en: 'Isolated Irregular Slag Inclusion (ISI)',
    },
    filmAppearance: {
      ar: 'بقع داكنة غير منتظمة الشكل (مضلعة أو مدببة الزوايا) بكثافة متوسطة موزعة عشوائياً.',
      en: 'Irregular, jagged-contour dark blotches of moderate contrast scattered in weld fill.',
    },
    weldingCause: {
      ar: 'انحباس بقايا الغلاف الصهري بين تمريرات اللحام المتعددة.',
      en: 'Entrapped flux pockets between multipass weld beads.',
    },
    densityDeltaHd: 0.45,
    defaultLengthMm: 4.5,
    defaultWidthMm: 2.4,
    defaultDepthRatio: 0.16,
    defaultCountInWindow: 3,
    isPlanarCritical: false,
  },
  {
    id: 'porosity_scattered',
    codeSymbol: 'SP',
    category: 'porosity_gas',
    name: {
      ar: 'مسامية غازية كروية متفرقة (Scattered Porosity)',
      en: 'Scattered Gas Porosity',
    },
    filmAppearance: {
      ar: 'نقاط دائرية داكنة ملساء الحواف موزعة في معدن اللحام.',
      en: 'Sharp round or teardrop dark spots with smooth circular edges distributed across weld.',
    },
    weldingCause: {
      ar: 'رطوبة في الأسلاك/الفلاكس أو اضطراب غاز الحماية أو تلوث السطح بالزيوت.',
      en: 'Damp electrodes/flux, shielding gas draft loss, or oil/moisture contamination.',
    },
    densityDeltaHd: 0.55,
    defaultLengthMm: 2.5,
    defaultWidthMm: 2.5,
    defaultDepthRatio: 0.15,
    defaultCountInWindow: 4,
    isPlanarCritical: false,
  },
  {
    id: 'porosity_clustered',
    codeSymbol: 'CP',
    category: 'porosity_gas',
    name: {
      ar: 'مسامية عنقودية متجمعة (Clustered Porosity)',
      en: 'Clustered Porosity',
    },
    filmAppearance: {
      ar: 'تجمع كثيف لمسامات دائرية داكنة في منطقة موضعية محددة (غالباً عند بدء القوس).',
      en: 'Tightly grouped cluster of dark spherical gas pores concentrated in an arc-start zone.',
    },
    weldingCause: {
      ar: 'فقدان لحظي لغاز الحماية عند بداية التمريرة أو رطوبة موضعية.',
      en: 'Momentary loss of shielding gas coverage at weld start/restart.',
    },
    densityDeltaHd: 0.60,
    defaultLengthMm: 14.0,
    defaultWidthMm: 2.2,
    defaultDepthRatio: 0.18,
    defaultCountInWindow: 8,
    isPlanarCritical: false,
  },
  {
    id: 'porosity_wormhole',
    codeSymbol: 'WP',
    category: 'porosity_gas',
    name: {
      ar: 'مسامية دودية أنبوبية (Wormhole / Piping Porosity)',
      en: 'Elongated Wormhole / Herringbone Porosity',
    },
    filmAppearance: {
      ar: 'تجاويف غازية داكنة مستطيلة تشبه عظام السمكة أو الذيل المذنب باتجاه تجمد المعدن.',
      en: 'Elongated tadpole or herringbone dark tubular cavities aligned with solidification.',
    },
    weldingCause: {
      ar: 'انبعاث غاز كثيف من الجذر الرطب أو الصدأ أثناء تجمد حوض اللحام السريع.',
      en: 'Continuous gas evolution trapped between growing dendrites during rapid freezing.',
    },
    densityDeltaHd: 0.66,
    defaultLengthMm: 7.0,
    defaultWidthMm: 2.0,
    defaultDepthRatio: 0.22,
    defaultCountInWindow: 3,
    isPlanarCritical: false,
  },
  {
    id: 'porosity_hollow_bead',
    codeSymbol: 'HB',
    category: 'porosity_gas',
    name: {
      ar: 'مسامية الخرزة المجوفة بالجذر (Hollow Bead — API 1104)',
      en: 'Hollow Bead Root Porosity (HB)',
    },
    filmAppearance: {
      ar: 'فجوة غازية طولية ملساء الحواف تقع على امتداد منتصف خرزة الجذر في لحام الأنابيب السليلوزي.',
      en: 'Elongated smooth-walled linear gas cavity along root centerline in cellulosic SMAW pipe welds.',
    },
    weldingCause: {
      ar: 'سرعة تقدم عالية جداً مع إلكترود سليلوزي (E6010/E8010) يحبس الغاز داخل خرزة الجذر.',
      en: 'Excessive travel speed or high arc voltage with vertical-down cellulosic SMAW root pass.',
    },
    densityDeltaHd: 0.64,
    defaultLengthMm: 10.0,
    defaultWidthMm: 1.8,
    defaultDepthRatio: 0.2,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
  {
    id: 'tungsten_inclusion',
    codeSymbol: 'TI',
    category: 'metallic_inclusion',
    name: {
      ar: 'شوائب تنجستن ساطعة عالية الامتصاص (Tungsten Inclusion)',
      en: 'Bright Tungsten Inclusion (GTAW / TIG)',
    },
    filmAppearance: {
      ar: 'نقطة أو شظية بيضاء ساطعة جداً (كثافة ضوئية منخفضة جداً) نتيجة العدد الذري العالي للتنجستن (Z=74).',
      en: 'Razor-sharp Stark WHITE (low optical density) spot/splinter due to Tungsten high attenuation (Z=74).',
    },
    weldingCause: {
      ar: 'غمس إلكترود التنجستن في حوض اللحام المنصهر أو زيادة تيار لحام الأرجون GTAW.',
      en: 'Dipping GTAW tungsten electrode into molten weld pool or excessive current.',
    },
    densityDeltaHd: -0.85,
    defaultLengthMm: 2.8,
    defaultWidthMm: 2.2,
    defaultDepthRatio: 0.15,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
  {
    id: 'oxide_inclusion',
    codeSymbol: 'OX',
    category: 'metallic_inclusion',
    name: {
      ar: 'انحباس أكاسيد معدنية (Oxide Film Inclusion)',
      en: 'Entrapped Oxide Inclusion',
    },
    filmAppearance: {
      ar: 'ظلال خيطية باهتة متداخلة داخل معدن اللحام في سبائك الألومنيوم أو الستانلس ستيل.',
      en: 'Wispy irregular dark/mottled oxide folds suspended inside stainless or alloy weld metal.',
    },
    weldingCause: {
      ar: 'قصور غاز التطهير الخلفي (Back Purging / Sugaring) أو عدم إزالة طبقة الأكسيد الحرجة.',
      en: 'Inadequate inert backing purge ("sugaring") or refractory surface oxide entrapment.',
    },
    densityDeltaHd: 0.34,
    defaultLengthMm: 9.5,
    defaultWidthMm: 1.5,
    defaultDepthRatio: 0.16,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
  {
    id: 'undercut_cap',
    codeSymbol: 'EUC',
    category: 'geometry_profile',
    name: {
      ar: 'نهش خارجي عند حافة الغطاء (External Cap Undercut)',
      en: 'External Cap Toe Undercut',
    },
    filmAppearance: {
      ar: 'شريط داكن متدرج الكثافة بمحاذاة الحافة الخارجية لغطاء اللحام تماماً.',
      en: 'Ribbon-like diffuse dark shadow bordering the outer toe of the weld cap reinforcement.',
    },
    weldingCause: {
      ar: 'تيار لحام مرتفع أو طول قوس كبير يذيب معدن الأساس عند الحافة دون ملئه.',
      en: 'Excessive arc voltage/amperage melting base metal toe without filler metal deposition.',
    },
    densityDeltaHd: 0.42,
    defaultLengthMm: 22.0,
    defaultWidthMm: 1.6,
    defaultDepthRatio: 0.08,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
  {
    id: 'undercut_root',
    codeSymbol: 'IUC',
    category: 'geometry_profile',
    name: {
      ar: 'نهش داخلي عند الجذر (Internal Root Undercut)',
      en: 'Internal Root Toe Undercut',
    },
    filmAppearance: {
      ar: 'ظل داكن متعرج ملاصق لحافة خرزة الجذر الفاتحة بالقرب من منتصف اللحام.',
      en: 'Irregular dark groove shadow immediately adjacent to the bright internal root pass.',
    },
    weldingCause: {
      ar: 'حرارة مفرطة في تمريرة الجذر تؤدي لتآكل حافة شطف الأنبوب من الداخل.',
      en: 'Excessive root pass heat input eroding internal pipe land adjacent to root bead.',
    },
    densityDeltaHd: 0.44,
    defaultLengthMm: 16.0,
    defaultWidthMm: 1.4,
    defaultDepthRatio: 0.09,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
  {
    id: 'root_concavity',
    codeSymbol: 'RC',
    category: 'geometry_profile',
    name: {
      ar: 'تقعر الجذر / السحب الداخلي (Root Concavity / Suck-Back)',
      en: 'Root Concavity (Suck-Back)',
    },
    filmAppearance: {
      ar: 'شريط عريض داكن تدريجي الحواف في مركز الجذر (تختلف عن LOP بعدم وجود حواف مستقيمة حادة).',
      en: 'Broad, softly feathered dark band along root center (unlike sharp-edged LOP).',
    },
    weldingCause: {
      ar: 'انكماش حوض الجذر للأعلى بفعل الشد السطحي أو زيادة حرارة التمريرة الثانية.',
      en: 'Overhead surface tension or excessive hot-pass heat remelting and drawing up root bead.',
    },
    densityDeltaHd: 0.38,
    defaultLengthMm: 19.0,
    defaultWidthMm: 3.6,
    defaultDepthRatio: 0.12,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
  {
    id: 'burn_through',
    codeSymbol: 'BT',
    category: 'geometry_profile',
    name: {
      ar: 'احتراق الجذر وثقب الانصهار (Burn-Through)',
      en: 'Root Burn-Through (Melt-Through Crater)',
    },
    filmAppearance: {
      ar: 'بقعة دائرية داكنة جداً في مركز الجذر محاطة بهالة فاتحة من المعدن المتدلي (Icicle).',
      en: 'Intense localized dark circular crater in root center surrounded by a lighter metal halo.',
    },
    weldingCause: {
      ar: 'اتساع فتحة الجذر مع دخل حراري مرتفع يؤدي لانهيار وسقوط حوض الجذر.',
      en: 'Excessive root opening and amperage blowing out molten root metal.',
    },
    densityDeltaHd: 0.82,
    defaultLengthMm: 5.5,
    defaultWidthMm: 5.0,
    defaultDepthRatio: 0.35,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
  {
    id: 'linear_misalignment_hilo',
    codeSymbol: 'HI-LO',
    category: 'geometry_profile',
    name: {
      ar: 'عدم محاذاة الحواف الداخلية (Linear Misalignment / High-Low)',
      en: 'Internal Linear Misalignment (High-Low)',
    },
    filmAppearance: {
      ar: 'تغير مفاجئ وحاد في الكثافة الضوئية طولياً عبر منتصف الجذر يفصل بين نصف فاتح ونصف أغمق.',
      en: 'Abrupt step-change in optical density along weld centerline with one straight sharp edge.',
    },
    weldingCause: {
      ar: 'عدم تطابق القطر الداخلي للماسورتين أثناء التجميع (Fit-up Offset) أو بيضاوية الأنبوب.',
      en: 'Improper pipe fit-up clamping or pipe out-of-roundness prior to tack welding.',
    },
    densityDeltaHd: 0.40,
    defaultLengthMm: 35.0,
    defaultWidthMm: 2.5,
    defaultDepthRatio: 0.16,
    defaultCountInWindow: 1,
    isPlanarCritical: false,
  },
];

export const AR_RT_ACCEPTANCE_CODES: readonly ArRtAcceptanceCodeSpec[] = [
  {
    id: 'ASME_VIII_UW51',
    shortCode: 'ASME VIII UW-51',
    editionLabel: 'BPVC Sec. VIII Div. 1 (UW-51 + App. 4)',
    title: {
      ar: 'كود أوعية الضغط ASME VIII Div.1 — UW-51 (تصوير كامل 100%)',
      en: 'ASME BPVC Sec. VIII Div. 1 — UW-51 (Full 100% Radiography)',
    },
    scopeSummary: {
      ar: 'يرفض أي شرخ أو عدم انصهار أو عدم تغلغل؛ يحد العيوب الطولية بـ 6 مم أو t/3 والمسامية وفق Appendix 4.',
      en: 'Zero tolerance for cracks, LOF, LOP; elongated ≤ 6 mm or t/3 (max 19 mm); rounded per Mandatory App. 4.',
    },
  },
  {
    id: 'ASME_VIII_UW52',
    shortCode: 'ASME VIII UW-52 (Spot)',
    editionLabel: 'BPVC Sec. VIII Div. 1 (UW-52 Spot RT)',
    title: {
      ar: 'كود أوعية الضغط ASME VIII Div.1 — UW-52 (تصوير موضعي Spot RT)',
      en: 'ASME BPVC Sec. VIII Div. 1 — UW-52 (Spot Radiography)',
    },
    scopeSummary: {
      ar: 'يرفض الشروخ وLOF وLOP، يسمح بخبث حتى 2t/3، ولا تُعد المسامية الكروية سبب رفض في الفحص الموضعي!',
      en: 'Rejects cracks/LOF/LOP, allows elongated slag up to 2t/3 (max 19 mm), and rounded porosity is NOT a rejectable factor.',
    },
  },
  {
    id: 'ASME_B31_3_NORMAL',
    shortCode: 'ASME B31.3',
    editionLabel: 'Process Piping Table 341.3.2 (Normal Service)',
    title: {
      ar: 'كود أنابيب العمليات والمصافي ASME B31.3 (الخدمة العادية)',
      en: 'ASME B31.3 Process Piping — Table 341.3.2 (Normal Fluid Service)',
    },
    scopeSummary: {
      ar: 'يرفض الشروخ وLOF؛ يسمح بقدر محدود من LOP والخبث والنهش شريطة عدم تجاوز حدود العمق والطول في الجدول 341.3.2.',
      en: 'Rejects cracks & LOF; permits bounded root LOP (≤38 mm, depth ≤min(1mm,0.2Tw)) and elongated slag ≤2Tw.',
    },
  },
  {
    id: 'ASME_B31_1',
    shortCode: 'ASME B31.1',
    editionLabel: 'Power Piping Para. 136.4.5',
    title: {
      ar: 'كود أنابيب محطات الطاقة والبخار ASME B31.1',
      en: 'ASME B31.1 Power Piping — Para. 136.4.5',
    },
    scopeSummary: {
      ar: 'صارم لأنابيب البخار عالي الضغط: يرفض أي شرخ أو LOF أو LOP، ويحد العيوب الطولية بـ 6 مم أو t/3.',
      en: 'High-pressure steam piping: zero cracks/LOF/LOP; elongated ≤ 6 mm or t/3; porosity ≤ min(0.2t, 3.2 mm).',
    },
  },
  {
    id: 'API_1104',
    shortCode: 'API 1104',
    editionLabel: 'API Std 1104 Sec. 9.3 (Pipelines)',
    title: {
      ar: 'كود خطوط أنابيب النفط والغاز API 1104 — القسم 9.3',
      en: 'API Standard 1104 — Section 9.3 (Pipeline Field Welding)',
    },
    scopeSummary: {
      ar: 'معايير ميدانية لخطوط الأنابيب: يستثني شرخ الفوهة الضحل ≤ 4 مم، ويسمح بـ IP/IF حتى 25 مم وESI حتى 50 مم بشروط العرض.',
      en: 'Field pipeline criteria: permits shallow crater cracks ≤4 mm, IP/IF ≤25 mm, ESI ≤50 mm (width ≤1.6 mm), HB ≤13 mm.',
    },
  },
  {
    id: 'AWS_D1_1',
    shortCode: 'AWS D1.1',
    editionLabel: 'AWS D1.1 Clause 8.12.1 (Structural Steel)',
    title: {
      ar: 'كود المنشآت الفولاذية AWS D1.1 — البند 8.12.1',
      en: 'AWS D1.1 Structural Welding Code — Steel (Clause 8.12.1)',
    },
    scopeSummary: {
      ar: 'يرفض الشروخ تماماً؛ يحدد الحد الأقصى للعيوب الاندماجية والخبث بمعادلة (2/3 × سماكة اللحام بحد أقصى 19 مم).',
      en: 'Zero cracks; fusion/slag/porosity discontinuity size governed by B = 2/3 E (max 19 mm) and spacing ≥3B.',
    },
  },
  {
    id: 'ISO_10675_1_B',
    shortCode: 'ISO 10675-1 (Lvl 1)',
    editionLabel: 'ISO 10675-1 Acceptance Level 1 (ISO 5817-B)',
    title: {
      ar: 'المواصفة الأوروبية/الدولية ISO 10675-1 — المستوى الأول (Quality B)',
      en: 'ISO 10675-1 Level 1 (Stringent — Corresponds to ISO 5817 Level B)',
    },
    scopeSummary: {
      ar: 'أعلى فئة جودة أوروبية: ترفض الشروخ وLOF وLOP؛ الخبث الطولي l ≤ t (بحد 25 مم) والمسامية المنفردة d ≤ min(0.2t, 3mm).',
      en: 'Highest ISO quality class: zero cracks/LOF/LOP; slag l ≤ t (max 25 mm), pore d ≤ min(0.2t, 3.0 mm).',
    },
  },
];

export function getAsmeMaxGeometricUnsharpnessMm(wallMm: number): number {
  if (wallMm <= 50) return 0.51;
  if (wallMm <= 75) return 0.76;
  return 1.02;
}

export function selectCodeIqiWireDesignation(basisThicknessMm: number): string {
  if (basisThicknessMm <= 6.4) return 'ASTM Set A #5 (0.13 mm) · ISO W14';
  if (basisThicknessMm <= 9.5) return 'ASTM Set B #6 (0.16 mm) · ISO W13';
  if (basisThicknessMm <= 12.7) return 'ASTM Set B #7 (0.20 mm) · ISO W12';
  if (basisThicknessMm <= 19.0) return 'ASTM Set B #8 (0.25 mm) · ISO W11';
  if (basisThicknessMm <= 25.4) return 'ASTM Set B #9 (0.32 mm) · ISO W10';
  if (basisThicknessMm <= 38.0) return 'ASTM Set B #10 (0.40 mm) · ISO W9';
  return 'ASTM Set B #11 (0.51 mm) · ISO W8';
}

/**
 * Computes live physics, geometric unsharpness Ug, IQI selection, optical density,
 * and code compliance for any of the 8 AR radiographic shooting techniques.
 */
export function computeArRtTechniquePhysics(
  input: ArRtTechniquePhysicsInput
): ArRtTechniquePhysicsResult {
  const technique =
    AR_RT_CODE_TECHNIQUES.find((t) => t.id === input.techniqueId) ?? AR_RT_CODE_TECHNIQUES[0];
  const source =
    AR_RT_RADIATION_SOURCES.find((s) => s.id === input.sourceId) ?? AR_RT_RADIATION_SOURCES[0];

  const odMm = Math.max(32, input.pipeOdMm);
  const wallMm = Math.max(2.5, Math.min(input.wallThicknessMm, odMm * 0.35));
  const exposurePct = input.exposureFactorPct ?? 100;

  // Determine effective SFD and object-to-film distance d per technique geometry
  let effectiveSfdMm = Math.max(40, input.sfdMm);
  let dMm = wallMm + 2.0; // Film cassette standoff + single wall
  let penetratedThicknessMm = wallMm;

  if (technique.id === 'swsi_panoramic') {
    effectiveSfdMm = Number((odMm / 2).toFixed(1));
    dMm = Number((wallMm + 2.0).toFixed(1));
    penetratedThicknessMm = wallMm;
  } else if (technique.id === 'swsi_internal_eccentric') {
    const internalId = Math.max(30, odMm - 2 * wallMm);
    effectiveSfdMm = Number(Math.min(input.sfdMm, internalId + wallMm).toFixed(1));
    dMm = Number((wallMm + 2.0).toFixed(1));
    penetratedThicknessMm = wallMm;
  } else if (technique.id === 'dwsi_contact') {
    effectiveSfdMm = Math.max(odMm + 2, input.sfdMm);
    // Only the film-side wall weld is interpreted -> d = film-side wall + 2 mm
    dMm = Number((wallMm + 2.0).toFixed(1));
    penetratedThicknessMm = Number((wallMm * 2).toFixed(1));
  } else if (technique.id === 'dwdi_elliptical' || technique.id === 'dwdi_superimposed') {
    effectiveSfdMm = Math.max(odMm + 40, input.sfdMm);
    // Both source-side and film-side walls are interpreted -> d = full pipe OD + 2 mm
    dMm = Number((odMm + 2.0).toFixed(1));
    penetratedThicknessMm = Number((wallMm * 2).toFixed(1));
  } else if (technique.id === 'double_film_latitude') {
    const thickSection = input.secondWallThicknessMm ?? Number((wallMm * 2.1).toFixed(1));
    dMm = Number((thickSection + 2.5).toFixed(1));
    penetratedThicknessMm = thickSection;
  } else if (technique.id === 'tangential_profile') {
    effectiveSfdMm = Math.max(odMm * 2, input.sfdMm);
    dMm = Number((odMm / 2 + 15).toFixed(1));
    // Chord length through tangential pipe wall: 2 * sqrt(R^2 - r^2) * ~0.55 effective edge chord
    const rOuter = odMm / 2;
    const rInner = Math.max(4, rOuter - wallMm);
    penetratedThicknessMm = Number(
      (1.15 * Math.sqrt(Math.max(4, rOuter * rOuter - rInner * rInner))).toFixed(1)
    );
  }

  const sodMm = Math.max(8, Number((effectiveSfdMm - dMm).toFixed(1)));
  const calculatedUgMm = Number(((source.focalSpotMm * dMm) / sodMm).toFixed(3));
  const maxAllowedUgMm = getAsmeMaxGeometricUnsharpnessMm(wallMm);
  const ugCompliant = calculatedUgMm <= maxAllowedUgMm;
  const minSfdRequiredForUgMm = Number(
    (dMm * (source.focalSpotMm / maxAllowedUgMm + 1)).toFixed(1)
  );

  const offsetRad = (Math.max(0, Math.min(40, input.beamOffsetDeg)) * Math.PI) / 180;
  const axialOffsetMm =
    technique.id === 'dwdi_elliptical'
      ? Number((effectiveSfdMm * Math.tan(offsetRad)).toFixed(1))
      : 0;
  const ellipseSeparationMm =
    technique.id === 'dwdi_elliptical'
      ? Number((odMm * Math.tan(offsetRad)).toFixed(1))
      : 0;

  const iqiBasisMm =
    technique.iqiBasisWall === 'Double-Wall (2t)' ? wallMm * 2 : wallMm;
  const iqiWireDesignation = selectCodeIqiWireDesignation(iqiBasisMm);

  const iqiPlacementLabel =
    technique.iqiSideStandard === 'Film-Side'
      ? {
          ar: 'جهة الفيلم (Film-Side + حرف F الرصاصي)',
          en: 'Film-Side (with Lead Letter "F")',
        }
      : technique.iqiSideStandard === 'Dual-Pack'
      ? {
          ar: 'مزدوج على السماكة الصغرى والكبرى (Dual Section IQIs)',
          en: 'Dual IQIs on Thin & Thick Sections',
        }
      : {
          ar: 'جهة المصدر القياسية (Source-Side IQI)',
          en: 'Standard Source-Side IQI',
        };

  // Optical density H&D calculation (calibrated around 2.65 H&D at 100% exposure factor)
  const rawDensity = 2.65 * (exposurePct / 100) * (1 - Math.max(0, penetratedThicknessMm - 45) * 0.0025);
  const weldOpticalDensityHd = Number(Math.max(0.8, Math.min(4.6, rawDensity)).toFixed(2));
  const secondaryFilmDensityHd =
    technique.id === 'double_film_latitude'
      ? Number(Math.min(4.4, weldOpticalDensityHd + 1.05).toFixed(2))
      : undefined;

  const densityCompliant =
    weldOpticalDensityHd >= source.minAllowedDensityHd && weldOpticalDensityHd <= 4.0;

  // Geometry rules per ASME Sec V T-271
  let geometryCompliant = true;
  const diagnostics: ArRtTechniquePhysicsResult['diagnostics'] = [];

  if (technique.id === 'dwdi_elliptical' && odMm > 88.9) {
    geometryCompliant = false;
    diagnostics.push({
      level: 'fail',
      ar: `رفض إجرائي (ASME T-271.2): قطر الأنبوب (${odMm} مم) يتجاوز 88.9 مم (3.5 بوصة)؛ يجب التحول إلى DWSI Contact أو Panoramic.`,
      en: `Code Violation (ASME T-271.2): Pipe OD (${odMm} mm) exceeds 88.9 mm (3.5"); switch to DWSI Contact or Panoramic.`,
    });
  }

  if (technique.id === 'dwdi_elliptical' && ellipseSeparationMm < wallMm * 1.2) {
    geometryCompliant = false;
    diagnostics.push({
      level: 'warn',
      ar: `فتحة الإليبس (${ellipseSeparationMm} مم) ضيقة جداً وقد تتداخل خرزتا الجذر والغطاء؛ ارفع زاوية الميل إلى 18°–22° أو استخدم DWDI 0° بـ 3 لقطات.`,
      en: `Ellipse separation (${ellipseSeparationMm} mm) is too tight; increase offset angle to 18°–22° or use 3-shot Superimposed DWDI.`,
    });
  }

  if (!ugCompliant) {
    diagnostics.push({
      level: 'fail',
      ar: `الغبش الهندسي Ug = ${calculatedUgMm} مم يتجاوز حد الكود (${maxAllowedUgMm} مم)؛ يلزم SFD ≥ ${minSfdRequiredForUgMm} مم أو بؤرة أصغر (Se-75 / X-Ray).`,
      en: `Geometric unsharpness Ug = ${calculatedUgMm} mm exceeds ASME max (${maxAllowedUgMm} mm); increase SFD ≥ ${minSfdRequiredForUgMm} mm or use finer focal spot.`,
    });
  } else {
    diagnostics.push({
      level: 'pass',
      ar: `الغبش الهندسي مطابق للكود: Ug = ${calculatedUgMm} مم ≤ ${maxAllowedUgMm} مم (ASME V T-274.2).`,
      en: `Geometric unsharpness compliant: Ug = ${calculatedUgMm} mm ≤ ${maxAllowedUgMm} mm (ASME V T-274.2).`,
    });
  }

  if (!densityCompliant) {
    diagnostics.push({
      level: 'fail',
      ar: `الكثافة الضوئية للفيلم (${weldOpticalDensityHd} H&D) خارج النطاق المسموح (${source.minAllowedDensityHd} – 4.0 H&D) وفق ASME T-282.`,
      en: `Film optical density (${weldOpticalDensityHd} H&D) is outside allowed ${source.minAllowedDensityHd}–4.0 H&D window (ASME T-282).`,
    });
  } else {
    diagnostics.push({
      level: 'pass',
      ar: `الكثافة الضوئية مثالية للقراءة: D = ${weldOpticalDensityHd} H&D ضمن نافذة (${source.minAllowedDensityHd} – 4.0).`,
      en: `Film optical density compliant: D = ${weldOpticalDensityHd} H&D within (${source.minAllowedDensityHd}–4.0).`,
    });
  }

  const overallCodeCompliant = ugCompliant && densityCompliant && geometryCompliant;

  return {
    technique,
    source,
    penetratedThicknessMm,
    objectToFilmDistanceMm: dMm,
    sourceToObjectDistanceMm: sodMm,
    minSfdRequiredForUgMm,
    calculatedUgMm,
    maxAllowedUgMm,
    ugCompliant,
    axialOffsetMm,
    ellipseSeparationMm,
    minExposuresRequired: technique.defaultExposuresFor360,
    iqiWireDesignation,
    iqiPlacementLabel,
    weldOpticalDensityHd,
    secondaryFilmDensityHd,
    densityCompliant,
    geometryCompliant,
    overallCodeCompliant,
    diagnostics,
  };
}

/**
 * Evaluates a radiographic weld defect simultaneously across ALL 7 international NDT acceptance codes.
 */
export function evaluateDefectAcrossAllCodes(
  input: ArRtDefectEvaluationInput
): ArRtSingleCodeVerdict[] {
  const defect =
    AR_RT_FILM_DEFECTS.find((d) => d.id === input.defectId) ?? AR_RT_FILM_DEFECTS[0];
  const t = Math.max(3.0, input.wallThicknessMm);
  const L = Math.max(0.5, input.indicationLengthMm);
  const W = Math.max(0.2, input.indicationWidthMm);
  const depthMm = Math.max(0.1, input.indicationDepthMm);
  const count = Math.max(1, Math.round(input.indicationCount));

  return AR_RT_ACCEPTANCE_CODES.map((code): ArRtSingleCodeVerdict => {
    // 1. ASME BPVC Sec. VIII Div. 1 — UW-51 (100% Full RT) & Mandatory Appendix 4
    if (code.id === 'ASME_VIII_UW51') {
      if (
        defect.category === 'planar_crack' ||
        defect.id === 'incomplete_penetration' ||
        defect.id === 'lack_of_fusion'
      ) {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME VIII Div.1 UW-51(b)(1)',
          verdict: 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: 0,
          utilizationPct: 999,
          governingParameter: 'zero_tolerance',
          ruleFormula: 'Max = 0.0 mm (Any Crack / LOF / LOP Unacceptable)',
          rationale: {
            ar: 'يرفض البند UW-51(b)(1) رفضاً قاطعاً أي شرخ أو منطقة عدم انصهار أو عدم تغلغل مهما صغر طولها.',
            en: 'UW-51(b)(1) strictly rejects any crack, zone of incomplete fusion, or incomplete penetration regardless of length.',
          },
        };
      }

      if (defect.category === 'porosity_gas' || defect.id === 'tungsten_inclusion') {
        // Appendix 4 rounded indications: min(t/3, 6.4 mm) for random isolated; cluster stricter
        const singleLimit = Number(
          Math.min(defect.id === 'porosity_clustered' ? 3.2 : 6.4, t / 3).toFixed(2)
        );
        const measuredDim = defect.id === 'porosity_clustered' ? L : W;
        const limitDim = defect.id === 'porosity_clustered' ? Math.min(25.0, t) : singleLimit;
        const pass = measuredDim <= limitDim;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME VIII Div.1 Mandatory App. 4-3',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: measuredDim,
          maxAllowedMm: Number(limitDim.toFixed(2)),
          utilizationPct: Math.round((measuredDim / Math.max(0.1, limitDim)) * 100),
          governingParameter: 'width_or_diameter',
          ruleFormula:
            defect.id === 'porosity_clustered'
              ? 'Cluster Length ≤ min(t, 25 mm)'
              : 'Max Pore d ≤ min(t/3, 6.4 mm)',
          rationale: {
            ar: pass
              ? `مقبول وفق الملحق الإلزامي 4: البعد المقاس (${measuredDim} مم) لا يتجاوز الحد المسموح (${limitDim.toFixed(1)} مم).`
              : `مرفوض وفق الملحق الإلزامي 4: البعد المقاس (${measuredDim} مم) يتجاوز الحد الأقصى (${limitDim.toFixed(1)} مم).`,
            en: pass
              ? `Acceptable per Mandatory Appendix 4: measured ${measuredDim} mm ≤ allowable ${limitDim.toFixed(1)} mm.`
              : `Rejected per Mandatory Appendix 4: measured ${measuredDim} mm exceeds allowable ${limitDim.toFixed(1)} mm.`,
          },
        };
      }

      if (defect.id === 'undercut_cap' || defect.id === 'undercut_root') {
        const maxUcDepth = Number(Math.min(0.8, 0.1 * t).toFixed(2));
        const pass = depthMm <= maxUcDepth;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME VIII Div.1 UW-35(b)',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: depthMm,
          maxAllowedMm: maxUcDepth,
          utilizationPct: Math.round((depthMm / Math.max(0.1, maxUcDepth)) * 100),
          governingParameter: 'depth',
          ruleFormula: 'Undercut Depth ≤ min(0.8 mm [1/32"], 0.1t)',
          rationale: {
            ar: pass
              ? `عمق النهش (${depthMm} مم) ضمن سماحية UW-35 (${maxUcDepth} مم).`
              : `عمق النهش (${depthMm} مم) يتجاوز حد UW-35 البالغ (${maxUcDepth} مم).`,
            en: pass
              ? `Undercut depth (${depthMm} mm) is within UW-35 limit (${maxUcDepth} mm).`
              : `Undercut depth (${depthMm} mm) exceeds UW-35 limit (${maxUcDepth} mm).`,
          },
        };
      }

      if (defect.id === 'burn_through') {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME VIII Div.1 UW-51(b)',
          verdict: 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: 0,
          utilizationPct: 999,
          governingParameter: 'zero_tolerance',
          ruleFormula: 'Burn-Through Crater = Unacceptable (0 mm)',
          rationale: {
            ar: 'احتراق الجذر الكامل يقلل سماكة الجدار التصميمية ومرفوض في أوعية الضغط UW-51.',
            en: 'Root burn-through reduces design wall thickness below minimum and is rejected under UW-51.',
          },
        };
      }

      // Elongated slag / oxide / root concavity / misalignment -> UW-51(b)(2)
      const elongatedMax =
        t <= 19.0 ? 6.0 : t <= 57.0 ? Number((t / 3).toFixed(2)) : 19.0;
      const aggregateLen = L * (count > 1 ? Math.min(count, 3) * 0.85 : 1);
      const pass = L <= elongatedMax && aggregateLen <= t;
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'ASME VIII Div.1 UW-51(b)(2)',
        verdict: pass ? 'ACCEPT' : 'REJECT',
        measuredPrimaryMm: L,
        maxAllowedMm: elongatedMax,
        utilizationPct: Math.round((L / elongatedMax) * 100),
        governingParameter: 'length',
        ruleFormula: 'L ≤ 6 mm (t≤19), t/3 (19<t≤57), 19 mm (t>57) & ΣL ≤ t in 12t',
        rationale: {
          ar: pass
            ? `طول الدلالة الممتدة (${L} مم) ضمن حد UW-51(b)(2) البالغ (${elongatedMax} مم).`
            : `طول الدلالة الممتدة (${L} مم) أو مجموعها يتجاوز حد UW-51(b)(2) البالغ (${elongatedMax} مم).`,
          en: pass
            ? `Elongated indication length (${L} mm) satisfies UW-51(b)(2) limit (${elongatedMax} mm).`
            : `Elongated indication (${L} mm) exceeds UW-51(b)(2) limit (${elongatedMax} mm).`,
        },
      };
    }

    // 2. ASME BPVC Sec. VIII Div. 1 — UW-52 (Spot Radiography)
    if (code.id === 'ASME_VIII_UW52') {
      if (
        defect.category === 'planar_crack' ||
        defect.id === 'incomplete_penetration' ||
        defect.id === 'lack_of_fusion' ||
        defect.id === 'burn_through'
      ) {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME VIII Div.1 UW-52(c)(1)',
          verdict: 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: 0,
          utilizationPct: 999,
          governingParameter: 'zero_tolerance',
          ruleFormula: 'Cracks / LOF / LOP = 0.0 mm',
          rationale: {
            ar: 'حتى في التصوير الموضعي UW-52، أي شرخ أو عدم انصهار أو عدم تغلغل مرفوض فوراً ويستوجب لقطات إضافية (Tracer Shots).',
            en: 'Under Spot RT UW-52(c)(1), any crack, LOF, or LOP is rejected and triggers 2 additional tracer radiographs.',
          },
        };
      }

      if (
        defect.id === 'porosity_scattered' ||
        defect.id === 'porosity_clustered' ||
        defect.id === 'tungsten_inclusion'
      ) {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME VIII Div.1 UW-52(c)(3)',
          verdict: 'ACCEPT',
          measuredPrimaryMm: W,
          maxAllowedMm: 99,
          utilizationPct: 15,
          governingParameter: 'exempt_in_spot',
          ruleFormula: 'Rounded Indications NOT a Factor in Spot RT (UW-52(c)(3))',
          rationale: {
            ar: 'قاعدة شهيرة في UW-52(c)(3): الدلالات المستديرة (المسامية الكروية والتنجستن المنفرد) لا تُعد عامل رفض في التصوير الموضعي!',
            en: 'Key code distinction in UW-52(c)(3): Rounded indications are NOT a factor in acceptability of welds under Spot RT!',
          },
        };
      }

      const spotMax = Number(Math.max(6.0, Math.min(19.0, (2 * t) / 3)).toFixed(2));
      const pass = L <= spotMax;
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'ASME VIII Div.1 UW-52(c)(2)',
        verdict: pass ? 'ACCEPT' : 'REJECT',
        measuredPrimaryMm: L,
        maxAllowedMm: spotMax,
        utilizationPct: Math.round((L / spotMax) * 100),
        governingParameter: 'length',
        ruleFormula: 'Elongated Slag L ≤ 2t/3 (min 6 mm, max 19 mm)',
        rationale: {
          ar: pass
            ? `مقبول في التصوير الموضعي UW-52: الطول (${L} مم) ≤ 2t/3 (${spotMax} مم).`
            : `مرفوض في التصوير الموضعي UW-52: الطول (${L} مم) يتجاوز 2t/3 (${spotMax} مم).`,
          en: pass
            ? `Acceptable under Spot RT UW-52(c)(2): L=${L} mm ≤ 2t/3 (${spotMax} mm).`
            : `Rejected under Spot RT UW-52(c)(2): L=${L} mm > 2t/3 (${spotMax} mm).`,
        },
      };
    }

    // 3. ASME B31.3 — Process Piping Table 341.3.2 (Normal Fluid Service)
    if (code.id === 'ASME_B31_3_NORMAL') {
      if (defect.category === 'planar_crack' || defect.id === 'lack_of_fusion') {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME B31.3 Table 341.3.2 (A & B)',
          verdict: 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: 0,
          utilizationPct: 999,
          governingParameter: 'zero_tolerance',
          ruleFormula: 'Zero Cracks & Zero Lack of Fusion',
          rationale: {
            ar: 'يرفض جدول ASME B31.3 (341.3.2) أي شرخ أو نقص انصهار في جميع فئات الخدمة.',
            en: 'ASME B31.3 Table 341.3.2 permits zero cracks and zero lack of fusion across all fluid services.',
          },
        };
      }

      if (defect.id === 'incomplete_penetration') {
        const maxLopDepth = Number(Math.min(1.0, 0.2 * t).toFixed(2));
        const maxLopLen = 38.0;
        const pass = L <= maxLopLen && depthMm <= maxLopDepth;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME B31.3 Table 341.3.2 (Criterion C)',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: depthMm > maxLopDepth ? depthMm : L,
          maxAllowedMm: depthMm > maxLopDepth ? maxLopDepth : maxLopLen,
          utilizationPct: Math.round(
            Math.max(L / maxLopLen, depthMm / Math.max(0.1, maxLopDepth)) * 100
          ),
          governingParameter: depthMm > maxLopDepth ? 'depth' : 'length',
          ruleFormula: 'Normal Fluid: L ≤ 38 mm in 150 mm & Depth ≤ min(1.0 mm, 0.2Tw)',
          rationale: {
            ar: pass
              ? `مسموح في الخدمة العادية B31.3: طول عدم التغلغل (${L}≤38 مم) وعمقه (${depthMm}≤${maxLopDepth} مم).`
              : `مرفوض في B31.3: عدم التغلغل تجاوز حد العمق (${maxLopDepth} مم) أو الطول (38 مم).`,
            en: pass
              ? `Permitted in B31.3 Normal Fluid Service: LOP length (${L}≤38 mm) and depth (${depthMm}≤${maxLopDepth} mm).`
              : `Rejected in B31.3: LOP exceeds depth (${maxLopDepth} mm) or length (38 mm) limit.`,
          },
        };
      }

      if (defect.category === 'porosity_gas' || defect.id === 'tungsten_inclusion') {
        const poreLimit = Number(Math.min(6.4, t / 3).toFixed(2));
        const pass = W <= poreLimit;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME B31.3 Table 341.3.2 (Criterion D → BPV VIII App.4)',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: W,
          maxAllowedMm: poreLimit,
          utilizationPct: Math.round((W / Math.max(0.1, poreLimit)) * 100),
          governingParameter: 'width_or_diameter',
          ruleFormula: 'Pore Size ≤ BPV VIII Div.1 App. 4 (min(Tw/3, 6.4 mm))',
          rationale: {
            ar: pass
              ? `حجم المسامية (${W} مم) يطابق إحالة B31.3 إلى الملحق 4 (${poreLimit} مم).`
              : `حجم المسامية (${W} مم) يتجاوز حد B31.3 / الملحق 4 (${poreLimit} مم).`,
            en: pass
              ? `Pore size (${W} mm) satisfies B31.3 reference to BPV VIII App. 4 (${poreLimit} mm).`
              : `Pore size (${W} mm) exceeds B31.3 / App. 4 limit (${poreLimit} mm).`,
          },
        };
      }

      if (defect.id === 'undercut_cap' || defect.id === 'undercut_root') {
        const maxUc = Number(Math.min(1.0, t / 4).toFixed(2));
        const pass = depthMm <= maxUc;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME B31.3 Table 341.3.2 (Criterion H)',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: depthMm,
          maxAllowedMm: maxUc,
          utilizationPct: Math.round((depthMm / Math.max(0.1, maxUc)) * 100),
          governingParameter: 'depth',
          ruleFormula: 'Undercut Depth ≤ min(1.0 mm, Tw/4)',
          rationale: {
            ar: pass
              ? `عمق النهش (${depthMm} مم) ضمن سماحية الخدمة العادية B31.3 (${maxUc} مم).`
              : `عمق النهش (${depthMm} مم) يتجاوز سماحية B31.3 (${maxUc} مم).`,
            en: pass
              ? `Undercut depth (${depthMm} mm) is within B31.3 Normal Service limit (${maxUc} mm).`
              : `Undercut depth (${depthMm} mm) exceeds B31.3 limit (${maxUc} mm).`,
          },
        };
      }

      // Elongated slag / root concavity in Normal Fluid Service: L <= 2*Tw and W <= min(3 mm, Tw/2)
      const maxSlagLen = Number((2 * t).toFixed(1));
      const maxSlagW = Number(Math.min(3.0, t / 2).toFixed(2));
      const pass = L <= maxSlagLen && (defect.category !== 'slag_inclusion' || W <= maxSlagW) && defect.id !== 'burn_through';
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'ASME B31.3 Table 341.3.2 (Criterion E / K)',
        verdict: pass ? 'ACCEPT' : 'REJECT',
        measuredPrimaryMm: L,
        maxAllowedMm: defect.id === 'burn_through' ? 0 : maxSlagLen,
        utilizationPct: defect.id === 'burn_through' ? 999 : Math.round((L / maxSlagLen) * 100),
        governingParameter: defect.id === 'burn_through' ? 'zero_tolerance' : 'length',
        ruleFormula: 'Elongated Slag L ≤ 2·Tw & Width ≤ min(3.0 mm, Tw/2)',
        rationale: {
          ar: pass
            ? `مقبول في B31.3 للخدمة العادية: الطول (${L} مم ≤ ${maxSlagLen} مم) والعرض ضمن السماحية.`
            : `مرفوض في B31.3: تجاوز حد الطول (${maxSlagLen} مم) أو العرض (${maxSlagW} مم) أو وجود احتراق جذر.`,
          en: pass
            ? `Acceptable in B31.3 Normal Service: L=${L} mm ≤ 2Tw (${maxSlagLen} mm) and width ≤ ${maxSlagW} mm.`
            : `Rejected in B31.3: exceeds length (${maxSlagLen} mm), width (${maxSlagW} mm), or burn-through rule.`,
        },
      };
    }

    // 4. ASME B31.1 — Power Piping Para. 136.4.5
    if (code.id === 'ASME_B31_1') {
      if (
        defect.category === 'planar_crack' ||
        defect.id === 'incomplete_penetration' ||
        defect.id === 'lack_of_fusion' ||
        defect.id === 'burn_through'
      ) {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME B31.1 Para. 136.4.5(A)(1)',
          verdict: 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: 0,
          utilizationPct: 999,
          governingParameter: 'zero_tolerance',
          ruleFormula: 'Zero Cracks, Zero LOF, Zero LOP',
          rationale: {
            ar: 'أنابيب الطاقة والبخار B31.1 (136.4.5) تمنع منعاً باتاً الشروخ أو نقص الانصهار أو نقص التغلغل.',
            en: 'Power Piping B31.1 Para. 136.4.5 strictly prohibits any crack, LOF, or LOP.',
          },
        };
      }

      if (defect.category === 'porosity_gas' || defect.id === 'tungsten_inclusion') {
        const maxPore = Number(Math.min(3.2, 0.2 * t).toFixed(2));
        const pass = W <= maxPore;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'ASME B31.1 App. A-250',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: W,
          maxAllowedMm: maxPore,
          utilizationPct: Math.round((W / Math.max(0.1, maxPore)) * 100),
          governingParameter: 'width_or_diameter',
          ruleFormula: 'Rounded Pore d ≤ min(0.2t, 3.2 mm [1/8"])',
          rationale: {
            ar: pass
              ? `قطر الدلالة المستديرة (${W} مم) ضمن حد A-250 (${maxPore} مم).`
              : `قطر الدلالة المستديرة (${W} مم) يتجاوز حد A-250 (${maxPore} مم).`,
            en: pass
              ? `Rounded indication (${W} mm) satisfies B31.1 A-250 limit (${maxPore} mm).`
              : `Rounded indication (${W} mm) exceeds B31.1 A-250 limit (${maxPore} mm).`,
          },
        };
      }

      const maxElong = t <= 19.0 ? 6.0 : t <= 57.0 ? Number((t / 3).toFixed(2)) : 19.0;
      const pass = L <= maxElong;
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'ASME B31.1 Para. 136.4.5(A)(2)',
        verdict: pass ? 'ACCEPT' : 'REJECT',
        measuredPrimaryMm: L,
        maxAllowedMm: maxElong,
        utilizationPct: Math.round((L / maxElong) * 100),
        governingParameter: 'length',
        ruleFormula: 'Elongated L ≤ 6 mm (t≤19), t/3 (19<t≤57), 19 mm (t>57)',
        rationale: {
          ar: pass
            ? `الدلالة الممتدة (${L} مم) مطابقة للفقرة 136.4.5 (${maxElong} مم).`
            : `الدلالة الممتدة (${L} مم) تتجاوز حد الفقرة 136.4.5 (${maxElong} مم).`,
          en: pass
            ? `Elongated indication (${L} mm) satisfies Para. 136.4.5 (${maxElong} mm).`
            : `Elongated indication (${L} mm) exceeds Para. 136.4.5 (${maxElong} mm).`,
        },
      };
    }

    // 5. API Standard 1104 — Section 9.3 (Pipeline Field Welding)
    if (code.id === 'API_1104') {
      // Famous API 1104 Sec. 9.3.10 rule: Shallow crater cracks <= 4.0 mm (5/32") ARE ACCEPTABLE!
      if (defect.id === 'crack_crater') {
        const maxCrater = 4.0;
        const pass = L <= maxCrater;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'API 1104 Sec. 9.3.10',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: maxCrater,
          utilizationPct: Math.round((L / maxCrater) * 100),
          governingParameter: 'length',
          ruleFormula: 'Shallow Star/Crater Crack L ≤ 4.0 mm (5/32") Acceptable',
          rationale: {
            ar: pass
              ? `استثناء شهير في API 1104 البند 9.3.10: شرخ الفوهة النجمي الضحل بطول (${L} مم ≤ 4.0 مم) مقبول في خطوط الأنابيب!`
              : `مرفوض وفق API 1104 البند 9.3.10 لأن طول شرخ الفوهة (${L} مم) تجاوز 4.0 مم (5/32").`,
            en: pass
              ? `Famous API 1104 Sec. 9.3.10 rule: shallow crater crack (${L} mm ≤ 4.0 mm [5/32"]) is ACCEPTABLE!`
              : `Rejected per API 1104 Sec. 9.3.10: crater crack (${L} mm) exceeds 4.0 mm (5/32").`,
          },
        };
      }

      if (defect.id === 'crack_longitudinal' || defect.id === 'crack_transverse') {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'API 1104 Sec. 9.3.10',
          verdict: 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: 0,
          utilizationPct: 999,
          governingParameter: 'zero_tolerance',
          ruleFormula: 'Non-Crater Cracks = 0.0 mm (Unacceptable)',
          rationale: {
            ar: 'جميع الشروخ الطولية والعرضية غير النجمية مرفوضة تماماً في API 1104 (9.3.10).',
            en: 'All longitudinal and transverse cracks are strictly unacceptable under API 1104 Sec. 9.3.10.',
          },
        };
      }

      if (defect.id === 'incomplete_penetration' || defect.id === 'lack_of_fusion') {
        const maxIpIf = 25.0; // 1 inch
        const pass = L <= maxIpIf && L * count <= 25.0;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: defect.id === 'incomplete_penetration' ? 'API 1104 Sec. 9.3.1' : 'API 1104 Sec. 9.3.4',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: maxIpIf,
          utilizationPct: Math.round((L / maxIpIf) * 100),
          governingParameter: 'length',
          ruleFormula: 'Individual IP / IF ≤ 25 mm (1") & Aggregate ≤ 25 mm in 300 mm',
          rationale: {
            ar: pass
              ? `مقبول في API 1104: طول (${defect.codeSymbol}) البالغ ${L} مم لا يتجاوز 25 مم (1 بوصة) في 300 مم.`
              : `مرفوض في API 1104: الطول الفردي أو التراكمي يتجاوز 25 مم (1 بوصة) في 300 مم.`,
            en: pass
              ? `Acceptable under API 1104: ${defect.codeSymbol} length (${L} mm) ≤ 25 mm (1") in 300 mm weld.`
              : `Rejected under API 1104: individual or aggregate length exceeds 25 mm (1") in 300 mm.`,
          },
        };
      }

      if (defect.id === 'porosity_hollow_bead') {
        const maxHb = 13.0; // 1/2 inch
        const pass = L <= maxHb && L * count <= 50.0;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'API 1104 Sec. 9.3.9.4 (Hollow Bead)',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: maxHb,
          utilizationPct: Math.round((L / maxHb) * 100),
          governingParameter: 'length',
          ruleFormula: 'Single HB ≤ 13 mm (1/2") & Total ≤ 50 mm in 300 mm',
          rationale: {
            ar: pass
              ? `مقبول وفق بند الخرزة المجوفة API 1104 (9.3.9.4): الطول (${L} مم ≤ 13 مم).`
              : `مرفوض وفق API 1104 (9.3.9.4): الخرزة المجوفة (${L} مم) تتجاوز 13 مم (1/2").`,
            en: pass
              ? `Acceptable per API 1104 Sec. 9.3.9.4: Hollow Bead (${L} mm) ≤ 13 mm (1/2").`
              : `Rejected per API 1104 Sec. 9.3.9.4: Hollow Bead (${L} mm) > 13 mm (1/2").`,
          },
        };
      }

      if (defect.category === 'porosity_gas' || defect.id === 'tungsten_inclusion') {
        const maxPore = Number(Math.min(3.0, 0.25 * t).toFixed(2));
        const dim = defect.id === 'porosity_clustered' ? L : W;
        const lim = defect.id === 'porosity_clustered' ? 13.0 : maxPore;
        const pass = dim <= lim;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'API 1104 Sec. 9.3.9.2 / 9.3.9.3',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: dim,
          maxAllowedMm: lim,
          utilizationPct: Math.round((dim / Math.max(0.1, lim)) * 100),
          governingParameter: 'width_or_diameter',
          ruleFormula:
            defect.id === 'porosity_clustered'
              ? 'Cluster Diameter ≤ 13 mm (1/2")'
              : 'Individual Pore ≤ min(3.0 mm [1/8"], 0.25t)',
          rationale: {
            ar: pass
              ? `مقبول وفق API 1104 (9.3.9): البعد المقاس (${dim} مم) ≤ (${lim} مم).`
              : `مرفوض وفق API 1104 (9.3.9): البعد المقاس (${dim} مم) يتجاوز (${lim} مم).`,
            en: pass
              ? `Acceptable per API 1104 Sec. 9.3.9: ${dim} mm ≤ ${lim} mm.`
              : `Rejected per API 1104 Sec. 9.3.9: ${dim} mm exceeds ${lim} mm.`,
          },
        };
      }

      if (defect.id === 'burn_through') {
        const maxBt = Number(Math.min(6.0, t).toFixed(2));
        const pass = L <= maxBt && count === 1;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'API 1104 Sec. 9.3.7',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: maxBt,
          utilizationPct: Math.round((L / maxBt) * 100),
          governingParameter: 'length',
          ruleFormula: 'Single BT ≤ min(6.0 mm [1/4"], t)',
          rationale: {
            ar: pass
              ? `مقبول وفق API 1104 (9.3.7): احتراق جذر منفرد بطول (${L} مم ≤ ${maxBt} مم).`
              : `مرفوض وفق API 1104 (9.3.7): احتراق الجذر تجاوز (${maxBt} مم) أو تكرر.`,
            en: pass
              ? `Acceptable per API 1104 Sec. 9.3.7: isolated BT (${L} mm) ≤ ${maxBt} mm.`
              : `Rejected per API 1104 Sec. 9.3.7: BT exceeds ${maxBt} mm or multiple BTs present.`,
          },
        };
      }

      // Elongated / Isolated Slag, Undercut, Concavity, Misalignment in API 1104
      const isIsolatedSlag = defect.id === 'slag_isolated';
      const maxLen = isIsolatedSlag ? 13.0 : 50.0;
      const maxWidth = isIsolatedSlag ? 3.0 : 1.6;
      const pass =
        L <= maxLen &&
        (defect.category !== 'slag_inclusion' || W <= maxWidth);
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'API 1104 Sec. 9.3.8 / 9.3.11',
        verdict: pass ? 'ACCEPT' : 'REJECT',
        measuredPrimaryMm: defect.category === 'slag_inclusion' && W > maxWidth ? W : L,
        maxAllowedMm: defect.category === 'slag_inclusion' && W > maxWidth ? maxWidth : maxLen,
        utilizationPct: Math.round(
          Math.max(
            L / maxLen,
            defect.category === 'slag_inclusion' ? W / maxWidth : 0
          ) * 100
        ),
        governingParameter:
          defect.category === 'slag_inclusion' && W > maxWidth ? 'width_or_diameter' : 'length',
        ruleFormula: isIsolatedSlag
          ? 'ISI Aggregate ≤ 13 mm & Width ≤ 3.0 mm (1/8")'
          : 'ESI / EU Length ≤ 50 mm (2") & ESI Width ≤ 1.6 mm (1/16")',
        rationale: {
          ar: pass
            ? `مقبول وفق API 1104 (9.3.8/9.3.11): الطول (${L}≤${maxLen} مم) والعرض ضمن السماحية.`
            : `مرفوض وفق API 1104: تجاوز حد الطول (${maxLen} مم) أو عرض الخبث (${maxWidth} مم).`,
          en: pass
            ? `Acceptable per API 1104 Sec. 9.3.8/11: length (${L}≤${maxLen} mm) and width compliant.`
            : `Rejected per API 1104: exceeds length (${maxLen} mm) or slag width (${maxWidth} mm).`,
        },
      };
    }

    // 6. AWS D1.1 — Clause 8.12.1 (Statically Loaded Structural Steel)
    if (code.id === 'AWS_D1_1') {
      if (defect.category === 'planar_crack') {
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'AWS D1.1 Clause 8.12.1(1)',
          verdict: 'REJECT',
          measuredPrimaryMm: L,
          maxAllowedMm: 0,
          utilizationPct: 999,
          governingParameter: 'zero_tolerance',
          ruleFormula: 'Welds Shall Have No Cracks (0.0 mm)',
          rationale: {
            ar: 'البند 8.12.1(1) في AWS D1.1 يرفض أي نوع من الشروخ في اللحامات الإنشائية دون استثناء.',
            en: 'AWS D1.1 Clause 8.12.1(1) permits zero cracks regardless of loading or weld size.',
          },
        };
      }

      if (defect.id === 'undercut_cap' || defect.id === 'undercut_root') {
        const maxAwsUc = t < 25.0 ? 1.0 : 2.0;
        const pass = depthMm <= maxAwsUc;
        return {
          codeId: code.id,
          shortCode: code.shortCode,
          clauseRef: 'AWS D1.1 Table 8.1 (Undercut)',
          verdict: pass ? 'ACCEPT' : 'REJECT',
          measuredPrimaryMm: depthMm,
          maxAllowedMm: maxAwsUc,
          utilizationPct: Math.round((depthMm / maxAwsUc) * 100),
          governingParameter: 'depth',
          ruleFormula: 'Undercut ≤ 1.0 mm [1/32"] (for t < 25 mm)',
          rationale: {
            ar: pass
              ? `عمق النهش (${depthMm} مم) يطابق جدول AWS D1.1 8.1 (${maxAwsUc} مم).`
              : `عمق النهش (${depthMm} مم) يتجاوز جدول AWS D1.1 8.1 (${maxAwsUc} مم).`,
            en: pass
              ? `Undercut depth (${depthMm} mm) satisfies AWS D1.1 Table 8.1 (${maxAwsUc} mm).`
              : `Undercut depth (${depthMm} mm) exceeds AWS D1.1 Table 8.1 (${maxAwsUc} mm).`,
          },
        };
      }

      // AWS D1.1 Fig. 8.1 maximum discontinuity size B = min(19.0, (2/3) * E)
      const awsMaxB = Number(Math.max(3.0, Math.min(19.0, (2 * t) / 3)).toFixed(2));
      const measuredAws =
        defect.id === 'porosity_scattered' || defect.id === 'tungsten_inclusion' ? W : L;
      const pass = measuredAws <= awsMaxB && defect.id !== 'burn_through';
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'AWS D1.1 Clause 8.12.1(2) & Fig. 8.1',
        verdict: pass ? 'ACCEPT' : 'REJECT',
        measuredPrimaryMm: measuredAws,
        maxAllowedMm: defect.id === 'burn_through' ? 0 : awsMaxB,
        utilizationPct:
          defect.id === 'burn_through' ? 999 : Math.round((measuredAws / awsMaxB) * 100),
        governingParameter: defect.id === 'burn_through' ? 'zero_tolerance' : 'length',
        ruleFormula: 'Max Discontinuity B = min(2/3 · E, 19.0 mm [3/4"])',
        rationale: {
          ar: pass
            ? `البعد المقاس (${measuredAws} مم) لا يتجاوز منحنى AWS D1.1 شكل 8.1 (B = ${awsMaxB} مم).`
            : `البعد المقاس (${measuredAws} مم) يتجاوز الحد الأقصى في AWS D1.1 شكل 8.1 (B = ${awsMaxB} مم).`,
          en: pass
            ? `Measured size (${measuredAws} mm) is within AWS D1.1 Fig. 8.1 limit (B = ${awsMaxB} mm).`
            : `Measured size (${measuredAws} mm) exceeds AWS D1.1 Fig. 8.1 limit (B = ${awsMaxB} mm).`,
        },
      };
    }

    // 7. ISO 10675-1 — Acceptance Level 1 (corresponds to ISO 5817 Quality Level B)
    if (
      defect.category === 'planar_crack' ||
      defect.id === 'incomplete_penetration' ||
      defect.id === 'lack_of_fusion' ||
      defect.id === 'burn_through' ||
      defect.id === 'porosity_wormhole' ||
      defect.id === 'porosity_hollow_bead'
    ) {
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'ISO 10675-1 Table 1 (Level 1 / ISO 5817-B)',
        verdict: 'REJECT',
        measuredPrimaryMm: L,
        maxAllowedMm: 0,
        utilizationPct: 999,
        governingParameter: 'zero_tolerance',
        ruleFormula: 'Level 1 (Class B): Not Permitted (0.0 mm)',
        rationale: {
          ar: 'المستوى الأول (Level 1 / الفئة B) في ISO 10675-1 لا يسمح إطلاقاً بالشروخ أو LOF أو LOP أو المسامية الأنبوبية.',
          en: 'ISO 10675-1 Level 1 (ISO 5817-B) strictly prohibits cracks, LOF, LOP, burn-through, and wormholes.',
        },
      };
    }

    if (defect.category === 'porosity_gas' || defect.id === 'tungsten_inclusion') {
      const isoPoreMax = Number(Math.min(3.0, 0.2 * t).toFixed(2));
      const dim = defect.id === 'porosity_clustered' ? L : W;
      const lim = defect.id === 'porosity_clustered' ? Math.min(12.0, t) : isoPoreMax;
      const pass = dim <= lim;
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: 'ISO 10675-1 Table 1 No. 1 / 2 / 7',
        verdict: pass ? 'ACCEPT' : 'REJECT',
        measuredPrimaryMm: dim,
        maxAllowedMm: Number(lim.toFixed(2)),
        utilizationPct: Math.round((dim / Math.max(0.1, lim)) * 100),
        governingParameter: 'width_or_diameter',
        ruleFormula: 'Level 1 Pore / Tungsten d ≤ min(0.2s, 3.0 mm)',
        rationale: {
          ar: pass
            ? `مطابق للمستوى الأول ISO 10675-1: البعد (${dim} مم) ≤ (${lim.toFixed(1)} مم).`
            : `مرفوض في المستوى الأول ISO 10675-1: البعد (${dim} مم) يتجاوز (${lim.toFixed(1)} مم).`,
          en: pass
            ? `Complies with ISO 10675-1 Level 1: ${dim} mm ≤ ${lim.toFixed(1)} mm.`
            : `Rejected under ISO 10675-1 Level 1: ${dim} mm exceeds ${lim.toFixed(1)} mm.`,
        },
      };
    }

    const isoSlagLenMax = Number(Math.min(25.0, t).toFixed(1));
    const isoSlagWidthMax = Number(Math.min(2.0, 0.2 * t).toFixed(2));
    const pass =
      L <= isoSlagLenMax &&
      (defect.category !== 'slag_inclusion' || W <= isoSlagWidthMax);
    return {
      codeId: code.id,
      shortCode: code.shortCode,
      clauseRef: 'ISO 10675-1 Table 1 No. 4 / 9',
      verdict: pass ? 'ACCEPT' : 'REJECT',
      measuredPrimaryMm: L,
      maxAllowedMm: isoSlagLenMax,
      utilizationPct: Math.round((L / Math.max(0.1, isoSlagLenMax)) * 100),
      governingParameter: 'length',
      ruleFormula: 'Level 1 Slag l ≤ min(s, 25 mm) & w ≤ min(0.2s, 2.0 mm)',
      rationale: {
        ar: pass
          ? `مطابق للمستوى الأول ISO 10675-1: الطول (${L}≤${isoSlagLenMax} مم) والعرض ضمن السماحية.`
          : `مرفوض في المستوى الأول ISO 10675-1: تجاوز حد الطول (${isoSlagLenMax} مم) أو العرض (${isoSlagWidthMax} مم).`,
        en: pass
          ? `Complies with ISO 10675-1 Level 1: l=${L} mm ≤ ${isoSlagLenMax} mm and width compliant.`
          : `Rejected under ISO 10675-1 Level 1: exceeds length (${isoSlagLenMax} mm) or width (${isoSlagWidthMax} mm).`,
      },
    };
  });
}

/**
 * Generates an optical density scanline D(x) across a 200 mm film strip for the live AR Densitometer.
 */
export function computeFilmDensityProfile(params: {
  baseDensityHd: number;
  defect: ArRtFilmDefectSpec;
  defectLengthMm: number;
  defectWidthMm: number;
  stationXMm: number; // 0 .. 200 mm along weld axis
}): { stationOpticalDensityHd: number; weldBackgroundHd: number; baseMetalHd: number } {
  const { baseDensityHd, defect, defectLengthMm, stationXMm } = params;
  const baseMetalHd = Number(Math.min(4.4, baseDensityHd + 0.34).toFixed(2));
  const weldBackgroundHd = Number(baseDensityHd.toFixed(2));

  // Defect centered around X = 100 mm on the 200 mm AR film strip
  const halfLen = Math.max(1.5, defectLengthMm / 2);
  const distFromCenter = Math.abs(stationXMm - 100);

  let delta = 0;
  if (distFromCenter <= halfLen) {
    const profileEnvelope = Math.cos(((distFromCenter / halfLen) * Math.PI) / 2);
    if (defect.id === 'porosity_scattered' || defect.id === 'porosity_clustered') {
      // Modulate periodic pore peaks across cluster/scattered zone
      const porePulse = Math.abs(Math.sin(stationXMm * 0.85));
      delta = defect.densityDeltaHd * profileEnvelope * (0.45 + 0.55 * porePulse);
    } else {
      delta = defect.densityDeltaHd * (0.65 + 0.35 * profileEnvelope);
    }
  }

  const stationOpticalDensityHd = Number(
    Math.max(0.45, Math.min(4.65, weldBackgroundHd + delta)).toFixed(2)
  );

  return {
    stationOpticalDensityHd,
    weldBackgroundHd,
    baseMetalHd,
  };
}
