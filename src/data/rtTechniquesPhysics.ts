export type RtExposureTechniqueMode = 'panoramic' | 'elliptical' | 'straight';

export type StraightSubMode = 'dwdi_superimposed' | 'dwsi_contact' | 'swsi_plate';

export type RtTechSourceId = 'ir192' | 'se75' | 'xray_crawler';

export interface RtTechSourceSpec {
  id: RtTechSourceId;
  code: string;
  name: { ar: string; en: string };
  focalSpotMm: number;
  category: 'gamma' | 'xray';
  minRecommendedSteelMm: number;
  maxRecommendedSteelMm: number;
}

export const RT_TECH_SOURCES: readonly RtTechSourceSpec[] = [
  {
    id: 'ir192',
    code: 'Ir-192 (F = 3.0 mm)',
    name: {
      ar: 'نظير إيريديوم Ir-192 (بؤرة 3.0 مم)',
      en: 'Iridium-192 Isotope (3.0 mm Focal Spot)',
    },
    focalSpotMm: 3.0,
    category: 'gamma',
    minRecommendedSteelMm: 10,
    maxRecommendedSteelMm: 75,
  },
  {
    id: 'se75',
    code: 'Se-75 (F = 2.0 mm)',
    name: {
      ar: 'نظير سيلينيوم Se-75 عالي الدقة (بؤرة 2.0 مم)',
      en: 'Selenium-75 Small-Focal Isotope (2.0 mm Focal Spot)',
    },
    focalSpotMm: 2.0,
    category: 'gamma',
    minRecommendedSteelMm: 4,
    maxRecommendedSteelMm: 32,
  },
  {
    id: 'xray_crawler',
    code: 'X-Ray Tube / Crawler (F = 2.2 mm)',
    name: {
      ar: 'أنبوبة إكس راي / كراولر بانورامي (بؤرة 2.2 مم)',
      en: 'X-Ray Tube / Panoramic Crawler (2.2 mm Focal Spot)',
    },
    focalSpotMm: 2.2,
    category: 'xray',
    minRecommendedSteelMm: 3,
    maxRecommendedSteelMm: 50,
  },
];

export interface PipePreset {
  id: string;
  npsLabel: string;
  label: { ar: string; en: string };
  odMm: number;
  wallMm: number;
  weldCapWidthMm: number;
  recommendedMode: RtExposureTechniqueMode;
}

export const RT_PIPE_PRESETS: readonly PipePreset[] = [
  {
    id: 'nps_2_sch80',
    npsLabel: '2" Sch 80',
    label: {
      ar: 'ماسورة 2 بوصة (OD 60.3 مم × 5.5 مم) — مثالية للإليبس',
      en: '2" Sch 80 Pipe (OD 60.3 mm × 5.5 mm) — Ideal Elliptical',
    },
    odMm: 60.3,
    wallMm: 5.5,
    weldCapWidthMm: 9,
    recommendedMode: 'elliptical',
  },
  {
    id: 'nps_2_xxs',
    npsLabel: '2" XXS Heavy',
    label: {
      ar: 'ماسورة 2 بوصة ثقيلة XXS (OD 60.3 مم × 11.1 مم) — ستريت 3 لقطات',
      en: '2" XXS Heavy Wall (OD 60.3 mm × 11.1 mm) — Straight 3-Shot',
    },
    odMm: 60.3,
    wallMm: 11.1,
    weldCapWidthMm: 13,
    recommendedMode: 'straight',
  },
  {
    id: 'nps_3_sch40',
    npsLabel: '3" Sch 40',
    label: {
      ar: 'ماسورة 3 بوصة (OD 88.9 مم × 5.5 مم) — الحد الأقصى للإليبس 3.5"',
      en: '3" Sch 40 Pipe (OD 88.9 mm × 5.5 mm) — Max ASME Elliptical Limit',
    },
    odMm: 88.9,
    wallMm: 5.5,
    weldCapWidthMm: 10,
    recommendedMode: 'elliptical',
  },
  {
    id: 'nps_8_sch80',
    npsLabel: '8" Sch 80',
    label: {
      ar: 'ماسورة 8 بوصة (OD 219.1 مم × 12.7 مم) — ستريت ملامس DWSI',
      en: '8" Sch 80 Pipe (OD 219.1 mm × 12.7 mm) — Straight Contact DWSI',
    },
    odMm: 219.1,
    wallMm: 12.7,
    weldCapWidthMm: 14,
    recommendedMode: 'straight',
  },
  {
    id: 'nps_16_std',
    npsLabel: '16" STD',
    label: {
      ar: 'خط أنابيب 16 بوصة (OD 406.4 مم × 9.5 مم) — بانوراما 360°',
      en: '16" Pipeline (OD 406.4 mm × 9.5 mm) — Panoramic 360°',
    },
    odMm: 406.4,
    wallMm: 9.5,
    weldCapWidthMm: 14,
    recommendedMode: 'panoramic',
  },
  {
    id: 'nps_24_xs',
    npsLabel: '24" XS',
    label: {
      ar: 'خط غاز رئيسي 24 بوصة (OD 609.6 مم × 12.7 مم) — بانوراما كراولر',
      en: '24" Mainline Gas Pipe (OD 609.6 mm × 12.7 mm) — Crawler Panoramic',
    },
    odMm: 609.6,
    wallMm: 12.7,
    weldCapWidthMm: 16,
    recommendedMode: 'panoramic',
  },
];

export interface PanoramicInput {
  odMm: number;
  wallMm: number;
  sourceId: RtTechSourceId;
  filmLengthMm: 300 | 400;
  overlapMm: number;
  /** Off-center spider sag / eccentricity toward 12 o'clock in mm (0 = dead-center) */
  eccentricityMm: number;
}

export interface PanoramicFilmSegment {
  index: number;
  label: string;
  startAngleDeg: number;
  endAngleDeg: number;
  startStationMm: number;
  endStationMm: number;
  localDensityHd: number;
  localUgMm: number;
}

export interface PanoramicSimulationResult {
  circumferenceMm: number;
  effectiveFilmCoverageMm: number;
  requiredFilmsCount: number;
  totalOverlapValid: boolean;
  nominalSfdMm: number;
  nearWallSfdMm: number;
  farWallSfdMm: number;
  objectToFilmDistanceMm: number;
  nominalUgMm: number;
  nearWallUgMm: number;
  farWallUgMm: number;
  maxAllowedUgMm: number;
  minAllowableOdForUgMm: number;
  nearWallDensityHd: number;
  farWallDensityHd: number;
  densityUniform: boolean;
  passesAsmeCode: boolean;
  exposuresRequired: 1;
  penetratedThicknessMm: number;
  iqiRule: { ar: string; en: string };
  filmSegments: PanoramicFilmSegment[];
  diagnostics: {
    severity: 'pass' | 'warn' | 'fail';
    ar: string;
    en: string;
  }[];
}

export function getAsmeMaxUgMm(singleWallThicknessMm: number): number {
  if (singleWallThicknessMm <= 50) return 0.51;
  if (singleWallThicknessMm <= 75) return 0.76;
  return 1.02;
}

export function computePanoramicSimulation(input: PanoramicInput): PanoramicSimulationResult {
  const src = RT_TECH_SOURCES.find((s) => s.id === input.sourceId) ?? RT_TECH_SOURCES[0];
  const odMm = Math.max(80, input.odMm);
  const wallMm = Math.min(Math.max(3, input.wallMm), odMm * 0.3);
  const circumferenceMm = Number((Math.PI * odMm).toFixed(1));
  const overlapMm = Math.max(5, Math.min(80, input.overlapMm));
  const effectiveFilmCoverageMm = Math.max(80, input.filmLengthMm - overlapMm);
  const requiredFilmsCount = Math.max(2, Math.ceil(circumferenceMm / effectiveFilmCoverageMm));
  const totalOverlapValid = overlapMm >= 25;

  const nominalSfdMm = Number((odMm / 2).toFixed(1));
  const maxSafeEccentricity = Math.max(0, nominalSfdMm - wallMm - 12);
  const ecc = Math.max(0, Math.min(input.eccentricityMm, maxSafeEccentricity));

  const nearWallSfdMm = Number(Math.max(15, nominalSfdMm - ecc).toFixed(1));
  const farWallSfdMm = Number((nominalSfdMm + ecc).toFixed(1));

  // Object-to-film d = single wall t + 2 mm weld cap/wrapper clearance
  const dMm = Number((wallMm + 2).toFixed(1));
  const maxAllowedUgMm = getAsmeMaxUgMm(wallMm);

  const calcUg = (sfd: number): number => {
    const sod = Math.max(5, sfd - dMm);
    return Number(((src.focalSpotMm * dMm) / sod).toFixed(3));
  };

  const nominalUgMm = calcUg(nominalSfdMm);
  const nearWallUgMm = calcUg(nearWallSfdMm);
  const farWallUgMm = calcUg(farWallSfdMm);

  // Minimum pipe OD so that nominal SFD = OD/2 satisfies F * d / (OD/2 - d) <= Ug_max
  const minAllowableOdForUgMm = Number(
    (2 * dMm * (1 + src.focalSpotMm / maxAllowedUgMm)).toFixed(0)
  );

  // Target center density = 2.60 H&D when centered; Inverse Square Law scales exposure around pipe
  const baseDensity = 2.6;
  const calcDensityAtAngle = (angleDeg: number): number => {
    // 0 deg = 12 o'clock (eccentric shift direction)
    const rad = (angleDeg * Math.PI) / 180;
    const idRadius = nominalSfdMm;
    // Distance from eccentric source (0, -ecc) to outer surface point (R*sin, -R*cos)
    const dx = idRadius * Math.sin(rad);
    const dy = -idRadius * Math.cos(rad) - -ecc;
    const localSfd = Math.max(15, Math.sqrt(dx * dx + dy * dy));
    const exposureRatio = Math.pow(nominalSfdMm / localSfd, 2);
    // Film characteristic curve gamma ~ 2.1 around D=2.6
    const density = baseDensity + 2.1 * Math.log10(Math.max(0.15, exposureRatio));
    return Number(Math.max(0.8, Math.min(4.8, density)).toFixed(2));
  };

  const nearWallDensityHd = calcDensityAtAngle(0);
  const farWallDensityHd = calcDensityAtAngle(180);
  const densityUniform = nearWallDensityHd <= 4.0 && farWallDensityHd >= 2.0 && nearWallDensityHd - farWallDensityHd <= 0.65;

  const filmSegments: PanoramicFilmSegment[] = Array.from({ length: requiredFilmsCount }, (_, idx) => {
    const stepDeg = 360 / requiredFilmsCount;
    const startAngleDeg = Number((idx * stepDeg).toFixed(1));
    const endAngleDeg = Number(((idx + 1) * stepDeg).toFixed(1));
    const midAngleDeg = startAngleDeg + stepDeg / 2;
    const startStationMm = Math.round((circumferenceMm * idx) / requiredFilmsCount);
    const endStationMm = Math.min(
      Math.round(circumferenceMm),
      startStationMm + input.filmLengthMm
    );

    const rad = (midAngleDeg * Math.PI) / 180;
    const dx = nominalSfdMm * Math.sin(rad);
    const dy = -nominalSfdMm * Math.cos(rad) + ecc;
    const localSfd = Math.max(15, Math.sqrt(dx * dx + dy * dy));

    return {
      index: idx + 1,
      label: `${idx}–${idx + 1}`,
      startAngleDeg,
      endAngleDeg,
      startStationMm,
      endStationMm,
      localDensityHd: calcDensityAtAngle(midAngleDeg),
      localUgMm: calcUg(localSfd),
    };
  });

  const diagnostics: PanoramicSimulationResult['diagnostics'] = [];

  if (nearWallUgMm > maxAllowedUgMm) {
    diagnostics.push({
      severity: 'fail',
      ar: `عدم الوضوح الهندسي Ug عند الجدار القريب (${nearWallUgMm} مم) يتجاوز حد ASME (${maxAllowedUgMm} مم). القطر الأدنى المسموح لهذا المصدر هو ${minAllowableOdForUgMm} مم أو استخدم Se-75 ببؤرة أصغر.`,
      en: `Near-wall Ug (${nearWallUgMm} mm) exceeds ASME limit (${maxAllowedUgMm} mm). Minimum pipe OD for this source is ${minAllowableOdForUgMm} mm, or switch to small-focal Se-75.`,
    });
  } else {
    diagnostics.push({
      severity: 'pass',
      ar: `تحقق شرط ASME T-274: قيمة Ug القصوى (${nearWallUgMm} مم) أقل من الحد المسموح (${maxAllowedUgMm} مم) مع تعريض محيطي كامل 360° في لقطة واحدة.`,
      en: `ASME T-274 satisfied: peak Ug (${nearWallUgMm} mm) is within ${maxAllowedUgMm} mm across 100% 360° circumference in 1 single shot.`,
    });
  }

  if (ecc > 6) {
    diagnostics.push({
      severity: densityUniform ? 'warn' : 'fail',
      ar: `انحراف عن المركز بمقدار ${ecc} مم (Spider Off-Center): الكثافة عند الساعة 12 ارتفعت إلى ${nearWallDensityHd} H&D بينما هبطت عند الساعة 6 إلى ${farWallDensityHd} H&D! يجب ضبط أرجل عنكبوت التمركز بدقة.`,
      en: `Source off-center by ${ecc} mm: 12 o'clock density burned to ${nearWallDensityHd} H&D while 6 o'clock dropped to ${farWallDensityHd} H&D! Re-center the spider rig.`,
    });
  }

  if (!totalOverlapValid) {
    diagnostics.push({
      severity: 'fail',
      ar: `تداخل الأفلام (${overlapMm} مم) أقل من 25 مم (1 بوصة)؛ قد يضيع جزء من اللحام بين الكاسيتات المتجاورة على الحزام.`,
      en: `Film-to-film overlap (${overlapMm} mm) is below mandatory 25 mm (1 in.); weld segments between cassettes risk missing coverage.`,
    });
  }

  const passesAsmeCode = nearWallUgMm <= maxAllowedUgMm && densityUniform && totalOverlapValid;

  return {
    circumferenceMm,
    effectiveFilmCoverageMm,
    requiredFilmsCount,
    totalOverlapValid,
    nominalSfdMm,
    nearWallSfdMm,
    farWallSfdMm,
    objectToFilmDistanceMm: dMm,
    nominalUgMm,
    nearWallUgMm,
    farWallUgMm,
    maxAllowedUgMm,
    minAllowableOdForUgMm,
    nearWallDensityHd,
    farWallDensityHd,
    densityUniform,
    passesAsmeCode,
    exposuresRequired: 1,
    penetratedThicknessMm: wallMm,
    iqiRule: {
      ar: 'اختراق جدار واحد (1×t): يوضع سلك IQI جهة المصدر داخل الماسورة، أو جهة الفيلم خارجياً مع حرف "F" رصاصي (أثناء التجربة الموثقة).',
      en: 'Single-Wall Viewing (1×t): Place IQI internally on source side, or externally on film side accompanied by lead letter "F" per ASME T-277.1(b).',
    },
    filmSegments,
    diagnostics,
  };
}

export type EllipticalStatus =
  | 'OPTIMAL_OPEN_ELLIPSE'
  | 'SUPERIMPOSED_CLOSED'
  | 'EXCESSIVE_DISTORTION'
  | 'EXCEEDS_OD_LIMIT'
  | 'HEAVY_WALL_USE_STRAIGHT';

export interface EllipticalInput {
  odMm: number;
  wallMm: number;
  weldCapWidthMm: number;
  sfdMm: number;
  axialOffsetMm: number;
  sourceId: RtTechSourceId;
  activeShotIndex: 0 | 1; // 0 = 0 deg, 1 = 90 deg rotation
}

export interface ProjectedEllipseFlaw {
  id: string;
  name: { ar: string; en: string };
  clockHour: 12 | 3 | 6;
  wallOrigin: 'upper_source_side' | 'lower_film_side' | 'tangential_edge';
  /** Normalized X along weld width (-1 left tangential edge .. +1 right tangential edge) */
  normX: number;
  /** Normalized Y (-1 upper ellipse crown .. +1 lower ellipse crown) */
  normY: number;
  clearlyResolvedInCurrentShot: boolean;
}

export interface EllipticalSimulationResult {
  withinAsmeOdLimit: boolean;
  wallToOdRatio: number;
  beamTiltDeg: number;
  recommendedMinOffsetMm: number;
  recommendedMaxOffsetMm: number;
  optimalOffsetMm: number;
  ellipseSeparationMm: number;
  clearRootOpeningGapMm: number;
  obliquePenetratedSteelMm: number;
  ugMm: number;
  maxAllowedUgMm: number;
  passesUg: boolean;
  status: EllipticalStatus;
  passesAsmeCode: boolean;
  exposuresRequired: 2;
  rotationStepDeg: 90;
  projectedFlaws: ProjectedEllipseFlaw[];
  diagnostics: {
    severity: 'pass' | 'warn' | 'fail';
    ar: string;
    en: string;
  }[];
}

export function computeEllipticalSimulation(input: EllipticalInput): EllipticalSimulationResult {
  const src = RT_TECH_SOURCES.find((s) => s.id === input.sourceId) ?? RT_TECH_SOURCES[1];
  const odMm = Math.max(25, input.odMm);
  const wallMm = Math.min(Math.max(2.5, input.wallMm), odMm * 0.35);
  const weldCapWidthMm = Math.max(5, Math.min(24, input.weldCapWidthMm));
  const sfdMm = Math.max(odMm + 120, input.sfdMm);
  const axialOffsetMm = Math.max(0, input.axialOffsetMm);

  const withinAsmeOdLimit = odMm <= 88.95; // 3.5" NPS = 88.9 mm
  const wallToOdRatio = Number((wallMm / odMm).toFixed(3));

  const beamTiltRad = Math.atan2(axialOffsetMm, sfdMm);
  const beamTiltDeg = Number(((beamTiltRad * 180) / Math.PI).toFixed(1));

  // Upper weld crown is at distance (OD - t/2) from film; axial offset shifts its projection
  const sodToUpperWall = Math.max(40, sfdMm - (odMm - wallMm / 2));
  const ellipseSeparationMm = Number(
    ((axialOffsetMm * (odMm - wallMm)) / sodToUpperWall).toFixed(1)
  );
  const clearRootOpeningGapMm = Number((ellipseSeparationMm - weldCapWidthMm).toFixed(1));

  // Minimum offset for a 4 mm clear root separation; max offset before ~21 deg tilt distortion
  const recommendedMinOffsetMm = Math.round(
    ((weldCapWidthMm + 4) * sodToUpperWall) / Math.max(10, odMm - wallMm)
  );
  const recommendedMaxOffsetMm = Math.round(
    Math.min(
      sfdMm * Math.tan((21 * Math.PI) / 180),
      ((weldCapWidthMm + 18) * sodToUpperWall) / Math.max(10, odMm - wallMm)
    )
  );
  const optimalOffsetMm = Math.round(
    Math.max(recommendedMinOffsetMm, (recommendedMinOffsetMm + Math.max(recommendedMinOffsetMm, recommendedMaxOffsetMm)) / 2)
  );

  const obliquePenetratedSteelMm = Number(((2 * wallMm) / Math.cos(beamTiltRad)).toFixed(1));

  // Geometric unsharpness for DWDI uses d = full pipe OD + 2mm film gap
  const dDoubleWallMm = odMm + 2;
  const sodDoubleWallMm = Math.max(30, Math.sqrt(sfdMm * sfdMm + axialOffsetMm * axialOffsetMm) - dDoubleWallMm);
  const ugMm = Number(((src.focalSpotMm * dDoubleWallMm) / sodDoubleWallMm).toFixed(3));
  const maxAllowedUgMm = getAsmeMaxUgMm(2 * wallMm);
  const passesUg = ugMm <= maxAllowedUgMm;

  let status: EllipticalStatus = 'OPTIMAL_OPEN_ELLIPSE';
  if (!withinAsmeOdLimit) {
    status = 'EXCEEDS_OD_LIMIT';
  } else if (wallToOdRatio > 0.22) {
    status = 'HEAVY_WALL_USE_STRAIGHT';
  } else if (clearRootOpeningGapMm < 3.0) {
    status = 'SUPERIMPOSED_CLOSED';
  } else if (beamTiltDeg > 22.0) {
    status = 'EXCESSIVE_DISTORTION';
  }

  // Project 3 physical weld flaws at pipe clock hours (12:00, 3:00, 6:00)
  // Shot 0 = beam from 12:00 -> 6:00; Shot 1 = pipe rotated +90 deg so 3:00 moves to 12:00!
  const rotationDeg = input.activeShotIndex === 0 ? 0 : -90;
  const rawFlaws: readonly {
    id: string;
    clockHour: 12 | 3 | 6;
    name: { ar: string; en: string };
  }[] = [
    {
      id: 'flaw_12_root_ip',
      clockHour: 12,
      name: {
        ar: 'نقص تغلغل بالجذر (عند الساعة 12:00)',
        en: 'Root Incomplete Penetration (at 12:00)',
      },
    },
    {
      id: 'flaw_3_sidewall_lof',
      clockHour: 3,
      name: {
        ar: 'عدم انصهار جانبي (عند الساعة 3:00)',
        en: 'Sidewall Lack of Fusion (at 3:00)',
      },
    },
    {
      id: 'flaw_6_tungsten',
      clockHour: 6,
      name: {
        ar: 'شائبة تنجستن عالية الكثافة (عند الساعة 6:00)',
        en: 'Dense Tungsten Inclusion (at 6:00)',
      },
    },
  ];

  const projectedFlaws: ProjectedEllipseFlaw[] = rawFlaws.map((f) => {
    const baseAngleDeg = f.clockHour === 12 ? 0 : f.clockHour === 3 ? 90 : 180;
    const effectiveAngleRad = ((baseAngleDeg + rotationDeg) * Math.PI) / 180;
    const normX = Number(Math.sin(effectiveAngleRad).toFixed(2));
    // cos(0)=+1 -> upper wall (normY = -1); cos(180)=-1 -> lower wall (normY = +1)
    const normY = Number((-Math.cos(effectiveAngleRad)).toFixed(2));
    const isNearEdge = Math.abs(normX) > 0.82;
    const wallOrigin: ProjectedEllipseFlaw['wallOrigin'] = isNearEdge
      ? 'tangential_edge'
      : normY < 0
      ? 'upper_source_side'
      : 'lower_film_side';

    return {
      id: f.id,
      name: f.name,
      clockHour: f.clockHour,
      wallOrigin,
      normX,
      normY,
      clearlyResolvedInCurrentShot:
        !isNearEdge && clearRootOpeningGapMm >= 3.0 && status === 'OPTIMAL_OPEN_ELLIPSE',
    };
  });

  const diagnostics: EllipticalSimulationResult['diagnostics'] = [];

  if (!withinAsmeOdLimit) {
    diagnostics.push({
      severity: 'fail',
      ar: `قطر الماسورة (${odMm} مم) أكبر من حد ASME T-271.2(b) لتكنيك الإليبس (الحد الأقصى 3.5 بوصة = 88.9 مم). يجب التحويل إلى الستريت الملامس DWSI أو البانوراما.`,
      en: `Pipe OD (${odMm} mm) exceeds ASME T-271.2(b) limit for DWDI Elliptical (max 3.5" = 88.9 mm). Switch to Straight DWSI Contact or Panoramic.`,
    });
  } else if (status === 'HEAVY_WALL_USE_STRAIGHT') {
    diagnostics.push({
      severity: 'warn',
      ar: `سماكة الجدار كبيرة مقارنة بالقطر (t/OD = ${(wallToOdRatio * 100).toFixed(0)}%)؛ فتحة الإليبس تنغلق بسبب سماكة اللحام. ينص الكود ASME T-271.2(b)(2) على استخدام الستريت المتطابق (0° بـ 3 لقطات كل 60°).`,
      en: `Heavy wall-to-OD ratio (${(wallToOdRatio * 100).toFixed(0)}%) closes the ellipse root. ASME T-271.2(b)(2) mandates switching to Straight Superimposed (0° with 3 shots @ 60°).`,
    });
  } else if (status === 'SUPERIMPOSED_CLOSED') {
    diagnostics.push({
      severity: 'fail',
      ar: `الإزاحة المحورية (${axialOffsetMm} مم) صغيرة جداً! الجدار العلوي والسفلي متداخلان (الفراغ الصافي ${clearRootOpeningGapMm} مم). ارفع الإزاحة إلى ${recommendedMinOffsetMm}–${recommendedMaxOffsetMm} مم لفتح الإليبس.`,
      en: `Axial offset (${axialOffsetMm} mm) is too small! Upper and lower weld crowns overlap (gap ${clearRootOpeningGapMm} mm). Increase offset to ${recommendedMinOffsetMm}–${recommendedMaxOffsetMm} mm.`,
    });
  } else if (status === 'EXCESSIVE_DISTORTION') {
    diagnostics.push({
      severity: 'fail',
      ar: `زاوية ميل الشعاع (${beamTiltDeg}°) كبيرة جداً (> 22°) وتسبب تشوهاً هندسياً للجذر وزيادة السمك المخترق (${obliquePenetratedSteelMm} مم). خفّض الإزاحة إلى حوالي ${optimalOffsetMm} مم.`,
      en: `Beam tilt angle (${beamTiltDeg}°) exceeds 22°, causing severe root distortion and oblique thickness (${obliquePenetratedSteelMm} mm). Reduce offset toward ${optimalOffsetMm} mm.`,
    });
  } else {
    diagnostics.push({
      severity: 'pass',
      ar: `إليبس مفتوح مثالي طبقاً لـ ASME T-271.2(b)(1)! فصل الجدارين ${ellipseSeparationMm} مم بفراغ جذر صافٍ ${clearRootOpeningGapMm} مم وزاوية ميل ${beamTiltDeg}°. يلزم لقطتان (0° و 90°) لتغطية 100%.`,
      en: `Optimal ASME T-271.2(b)(1) open ellipse! Wall separation ${ellipseSeparationMm} mm with ${clearRootOpeningGapMm} mm clear gap at ${beamTiltDeg}° tilt. Shoot 2 exposures at 0° & 90°.`,
    });
  }

  if (!passesUg) {
    diagnostics.push({
      severity: 'fail',
      ar: `قيمة عدم الوضوح الهندسي Ug = ${ugMm} مم تتجاوز الحد (${maxAllowedUgMm} مم) لأن الجدار العلوي يبعد مسافة OD كاملة عن الفيلم. زد SFD أو استخدم Se-75.`,
      en: `Geometric unsharpness Ug = ${ugMm} mm exceeds ${maxAllowedUgMm} mm because source-side wall is full OD away from film. Increase SFD or select Se-75.`,
    });
  }

  const passesAsmeCode = status === 'OPTIMAL_OPEN_ELLIPSE' && passesUg && withinAsmeOdLimit;

  return {
    withinAsmeOdLimit,
    wallToOdRatio,
    beamTiltDeg,
    recommendedMinOffsetMm,
    recommendedMaxOffsetMm,
    optimalOffsetMm,
    ellipseSeparationMm,
    clearRootOpeningGapMm,
    obliquePenetratedSteelMm,
    ugMm,
    maxAllowedUgMm,
    passesUg,
    status,
    passesAsmeCode,
    exposuresRequired: 2,
    rotationStepDeg: 90,
    projectedFlaws,
    diagnostics,
  };
}

export interface StraightInput {
  subMode: StraightSubMode;
  odMm: number;
  wallMm: number;
  plateWeldLengthMm: number;
  filmLengthMm: 300 | 400;
  sfdMm: number;
  sourceId: RtTechSourceId;
  activeShotIndex: number;
}

export interface StraightSimulationResult {
  subMode: StraightSubMode;
  axialOffsetMm: 0;
  beamAngleDeg: 90;
  wallsPenetrated: 1 | 2;
  wallsViewed: 1 | 2;
  penetratedSteelMm: number;
  exposuresRequired: number;
  rotationStepDeg: number;
  effectiveDiagnosticArcDeg: number;
  effectiveChordLengthMm: number;
  stationMarkersLabel: string;
  ugMm: number;
  maxAllowedUgMm: number;
  passesUg: boolean;
  edgeDensityDropHd: number;
  passesAsmeCode: boolean;
  iqiRule: { ar: string; en: string };
  diagnostics: {
    severity: 'pass' | 'warn' | 'fail';
    ar: string;
    en: string;
  }[];
}

export function computeStraightSimulation(input: StraightInput): StraightSimulationResult {
  const src = RT_TECH_SOURCES.find((s) => s.id === input.sourceId) ?? RT_TECH_SOURCES[0];
  const wallMm = Math.max(3, input.wallMm);
  const odMm = Math.max(33, input.odMm);

  if (input.subMode === 'dwdi_superimposed') {
    // Small-bore <= 88.9 mm, 0 deg straight superimposed -> 3 shots @ 60 deg (or 120 deg)
    const sfdMm = Math.max(odMm + 120, input.sfdMm);
    const dMm = odMm + 2;
    const sodMm = Math.max(30, sfdMm - dMm);
    const ugMm = Number(((src.focalSpotMm * dMm) / sodMm).toFixed(3));
    const maxAllowedUgMm = getAsmeMaxUgMm(2 * wallMm);
    const passesUg = ugMm <= maxAllowedUgMm;
    const withinSmallBore = odMm <= 88.95;
    const shotIdx = ((input.activeShotIndex % 3) + 3) % 3;
    const shotAngles = [0, 60, 120];

    const diagnostics: StraightSimulationResult['diagnostics'] = [];
    if (!withinSmallBore) {
      diagnostics.push({
        severity: 'warn',
        ar: `الستريت المتطابق DWDI مخصص للمواسير الصغيرة ≤ 88.9 مم (3.5"). للأقطار الأكبر (${odMm} مم) انتقل إلى الوضع الثاني: الستريت الملامس DWSI (تفسير الجدار السفلي فقط).`,
        en: `DWDI Superimposed Straight is for OD ≤ 88.9 mm (3.5"). For larger pipe (${odMm} mm), switch to Straight DWSI Contact (single-wall viewing).`,
      });
    } else {
      diagnostics.push({
        severity: 'pass',
        ar: `الستريت المتطابق (0° بدون إزاحة) مطابق لـ ASME T-271.2(b)(2): الجدار العلوي والسفلي ينطبقان في شريط مستقيم واحد، لذا يُشترط 3 لقطات بزاوية دوران 60° (0° / 60° / 120°).`,
        en: `ASME T-271.2(b)(2) Straight Superimposed (0° offset): Upper and lower walls superimpose into one straight band, requiring 3 exposures rotated 60° apart (0° / 60° / 120°).`,
      });
    }

    if (!passesUg) {
      diagnostics.push({
        severity: 'fail',
        ar: `قيمة Ug = ${ugMm} مم تتجاوز الحد (${maxAllowedUgMm} مم). ارفع SFD لتقليل الضبابية الهندسية للجدار العلوي.`,
        en: `Ug = ${ugMm} mm exceeds ${maxAllowedUgMm} mm. Increase SFD to sharpen the source-side wall image.`,
      });
    }

    return {
      subMode: input.subMode,
      axialOffsetMm: 0,
      beamAngleDeg: 90,
      wallsPenetrated: 2,
      wallsViewed: 2,
      penetratedSteelMm: Number((2 * wallMm).toFixed(1)),
      exposuresRequired: 3,
      rotationStepDeg: 60,
      effectiveDiagnosticArcDeg: 60,
      effectiveChordLengthMm: Number(((Math.PI * odMm) / 3).toFixed(1)),
      stationMarkersLabel: `Shot ${shotIdx + 1}/3 @ ${shotAngles[shotIdx]}°`,
      ugMm,
      maxAllowedUgMm,
      passesUg,
      edgeDensityDropHd: 0.35,
      passesAsmeCode: passesUg && withinSmallBore,
      iqiRule: {
        ar: 'اختراق جدارين وتفسير جدارين (DWDI 0°): يوضع سلك IQI جهة المصدر أعلى الماسورة دون الحاجة لحرف F.',
        en: 'DWDI 0° Straight: Place single source-side IQI on upper pipe wall (no "F" letter needed).',
      },
      diagnostics,
    };
  }

  if (input.subMode === 'dwsi_contact') {
    // Medium/large pipe > 3.5", source straight outside upper wall (contact SFD >= OD)
    const effectiveSfdMm = Math.max(odMm, input.sfdMm);
    const dMm = wallMm + 2; // Viewing ONLY film-side lower wall!
    const sodMm = Math.max(25, effectiveSfdMm - dMm);
    const ugMm = Number(((src.focalSpotMm * dMm) / sodMm).toFixed(3));
    const maxAllowedUgMm = getAsmeMaxUgMm(wallMm);
    const passesUg = ugMm <= maxAllowedUgMm;

    // Effective diagnostic arc angle depends on SFD/OD ratio & chord thickness latitude:
    // Contact (SFD = OD) covers ~90 deg cleanly (4 shots); higher standoff SFD >= 1.6*OD can cover 120 deg (3 shots)
    const standoffRatio = effectiveSfdMm / odMm;
    const exposuresRequired = standoffRatio >= 1.55 && odMm <= 275 ? 3 : odMm <= 460 ? 4 : 6;
    const rotationStepDeg = Math.round(360 / exposuresRequired);
    const effectiveDiagnosticArcDeg = rotationStepDeg;
    const effectiveChordLengthMm = Number(((Math.PI * odMm) / exposuresRequired).toFixed(1));

    const markerLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'A'];
    const shotIdx = ((input.activeShotIndex % exposuresRequired) + exposuresRequired) % exposuresRequired;
    const startLetter = markerLetters[shotIdx];
    const endLetter = markerLetters[(shotIdx + 1) % exposuresRequired === 0 ? 0 : shotIdx + 1];

    // Tangential path thickness grows toward film ends -> density drops near edges
    const halfArcRad = ((effectiveDiagnosticArcDeg / 2) * Math.PI) / 180;
    const edgeChordFactor = 1 / Math.max(0.45, Math.cos(halfArcRad * 0.65));
    const edgeDensityDropHd = Number(Math.min(1.4, (edgeChordFactor - 1) * 1.45).toFixed(2));

    const diagnostics: StraightSimulationResult['diagnostics'] = [
      {
        severity: passesUg ? 'pass' : 'fail',
        ar: passesUg
          ? `الستريت الملامس DWSI (0° عمودي): اختراق جدارين (${(2 * wallMm).toFixed(1)} مم) وتفسير الجدار الملاصق للفيلم فقط بقيمة Ug ممتازة (${ugMm} مم). يلزم ${exposuresRequired} لقطات كل ${rotationStepDeg}° بعلامات رصاص (${startLetter}–${endLetter}) لتغطية المحيط بالكامل.`
          : `قيمة Ug (${ugMm} مم) تتجاوز حد ASME (${maxAllowedUgMm} مم). ارفع مسافة SFD أو اختر بؤرة أصغر.`,
        en: passesUg
          ? `Straight DWSI Contact (0° normal): Penetrates 2 walls (${(2 * wallMm).toFixed(1)} mm) and interprets ONLY the film-side arc with Ug = ${ugMm} mm. Requires ${exposuresRequired} shots @ ${rotationStepDeg}° using lead markers (${startLetter}–${endLetter}).`
          : `Ug (${ugMm} mm) exceeds ASME limit (${maxAllowedUgMm} mm). Increase standoff SFD or use smaller focal spot.`,
      },
    ];

    return {
      subMode: input.subMode,
      axialOffsetMm: 0,
      beamAngleDeg: 90,
      wallsPenetrated: 2,
      wallsViewed: 1,
      penetratedSteelMm: Number((2 * wallMm).toFixed(1)),
      exposuresRequired,
      rotationStepDeg,
      effectiveDiagnosticArcDeg,
      effectiveChordLengthMm,
      stationMarkersLabel: `${startLetter} — ${endLetter} (${shotIdx + 1}/${exposuresRequired})`,
      ugMm,
      maxAllowedUgMm,
      passesUg,
      edgeDensityDropHd,
      passesAsmeCode: passesUg,
      iqiRule: {
        ar: 'تفسير الجدار السفلي فقط (DWSI): يوضع سلك IQI جهة الفيلم مع حرف "F" رصاصي، ويُحسب رقم السلك على أساس سماكة جدار واحد (1×t) في ASME!',
        en: 'DWSI Film-Side Viewing: Place Film-Side IQI with lead letter "F"; select ASME essential wire based on SINGLE-wall thickness (1×t) per T-277.1.',
      },
      diagnostics,
    };
  }

  // SubMode 3: 'swsi_plate' (Straight 0° normal beam on flat plate butt weld)
  const sfdMm = Math.max(250, input.sfdMm);
  const dMm = wallMm + 2;
  const sodMm = Math.max(30, sfdMm - dMm);
  const ugMm = Number(((src.focalSpotMm * dMm) / sodMm).toFixed(3));
  const maxAllowedUgMm = getAsmeMaxUgMm(wallMm);
  const passesUg = ugMm <= maxAllowedUgMm;

  const overlapMm = 30;
  const effectiveCasLength = input.filmLengthMm - overlapMm;
  const seamLengthMm = Math.max(300, input.plateWeldLengthMm);
  const exposuresRequired = Math.max(1, Math.ceil(seamLengthMm / effectiveCasLength));
  const shotIdx = ((input.activeShotIndex % exposuresRequired) + exposuresRequired) % exposuresRequired;

  // Inverse square + oblique thickness drop at film ends (x = +/- filmLength/2)
  const halfFilm = input.filmLengthMm / 2;
  const cornerRayDist = Math.sqrt(sfdMm * sfdMm + halfFilm * halfFilm);
  const cornerRatio = Math.pow(sfdMm / cornerRayDist, 2);
  const edgeDensityDropHd = Number(Math.abs(2.1 * Math.log10(cornerRatio)).toFixed(2));
  const sfdTooShortForFilmLen = edgeDensityDropHd > 0.45;

  const diagnostics: StraightSimulationResult['diagnostics'] = [
    {
      severity: passesUg && !sfdTooShortForFilmLen ? 'pass' : 'warn',
      ar: !passesUg
        ? `قيمة Ug (${ugMm} مم) تتجاوز الحد المسموح (${maxAllowedUgMm} مم). زد مسافة SFD فوراً.`
        : sfdTooShortForFilmLen
        ? `مسافة SFD (${sfdMm} مم) قصيرة نسبياً لطول الفيلم (${input.filmLengthMm} مم)، مما يسبب هبوط الكثافة عند طرفي الفيلم بمقدار ${edgeDensityDropHd} H&D.`
        : `الستريت العمودي SWSI (90° عمودي على اللوح): قيمة Ug = ${ugMm} مم وتوزيع كثافة متجانس عبر الكاسيت. يلزم ${exposuresRequired} لقطات متتالية لتغطية طول اللحام (${seamLengthMm} مم).`,
      en: !passesUg
        ? `Ug (${ugMm} mm) exceeds ${maxAllowedUgMm} mm. Increase SFD.`
        : sfdTooShortForFilmLen
        ? `SFD (${sfdMm} mm) is short relative to ${input.filmLengthMm} mm film, causing ${edgeDensityDropHd} H&D density drop at cassette ends.`
        : `Normal 90° Straight SWSI Plate Setup: Ug = ${ugMm} mm with uniform density across cassette. Requires ${exposuresRequired} sequential shots for ${seamLengthMm} mm seam.`,
    },
  ];

  return {
    subMode: input.subMode,
    axialOffsetMm: 0,
    beamAngleDeg: 90,
    wallsPenetrated: 1,
    wallsViewed: 1,
    penetratedSteelMm: wallMm,
    exposuresRequired,
    rotationStepDeg: 0,
    effectiveDiagnosticArcDeg: 0,
    effectiveChordLengthMm: effectiveCasLength,
    stationMarkersLabel: `${shotIdx * effectiveCasLength}–${Math.min(seamLengthMm, (shotIdx + 1) * effectiveCasLength + overlapMm)} mm (${shotIdx + 1}/${exposuresRequired})`,
    ugMm,
    maxAllowedUgMm,
    passesUg,
    edgeDensityDropHd,
    passesAsmeCode: passesUg && !sfdTooShortForFilmLen,
    iqiRule: {
      ar: 'اختراق جدار واحد (SWSI 0°): يوضع سلك IQI على سطح اللوح جهة المصدر بموازاة محور اللحام.',
      en: 'Single-Wall SWSI 0°: Place IQI directly on source-side plate surface adjacent to weld.',
    },
    diagnostics,
  };
}
