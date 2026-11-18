import React, { useState, useMemo, useEffect } from 'react';
import {
  Radio,
  Sliders,
  RotateCcw,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Columns,
  ShieldAlert,
  Clock,
  Layers,
  Camera,
} from 'lucide-react';
import { Language } from '../../types';
import { useTheme } from '../../utils/themeStore';
import { recordSimulationAttempt } from '../../utils/simulationHistoryStore';
import { NdtCameraArOverlayLab } from './virtuallab/NdtCameraArOverlayLab';
import {
  RtExposureTechniqueMode,
  StraightSubMode,
  RtTechSourceId,
  getAsmeMaxUgMm,
  computePanoramicSimulation,
  computeEllipticalSimulation,
  computeStraightSimulation,
} from '../../data/rtTechniquesPhysics';

export interface SimulationLabsRtTechniquesWorkbenchProps {
  language: Language;
  onOpenFullRtLab?: () => void;
}

type FilmSpeedClass = 'class_1_d4' | 'class_2_d7';

interface DynamicExposureMetrics {
  sodMm: number;
  objectToFilmMm: number;
  dynamicUgMm: number;
  maxAllowedUgMm: number;
  passesUg: boolean;
  magnificationFactor: number;
  penetratedSteelMm: number;
  optimalExposureSec: number;
  simulatedDensityHd: number;
  densityInCodeWindow: boolean;
  safeBarricadeRadiusM: number;
  doseRateAt1mMrHr: number;
  essentialAsmeWireLabel: string;
}

function selectAsmeWireLabel(singleWallMm: number): string {
  if (singleWallMm <= 6.4) return '1A (0.13 mm)';
  if (singleWallMm <= 9.5) return '1B / #6 (0.16 mm)';
  if (singleWallMm <= 12.7) return '1B / #7 (0.20 mm)';
  if (singleWallMm <= 19.0) return '1B / #8 (0.25 mm)';
  if (singleWallMm <= 25.4) return '1B / #9 (0.32 mm)';
  return '1B / #10 (0.40 mm)';
}

function formatMinutesSeconds(totalSec: number): string {
  const clamped = Math.max(1, Math.round(totalSec));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const SimulationLabsRtTechniquesWorkbench: React.FC<
  SimulationLabsRtTechniquesWorkbenchProps
> = ({ language, onOpenFullRtLab }) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  // Primary Technique Mode (Panorama, Ellipse, Straight / Street) + Synchronized Compare View
  const [technique, setTechnique] = useState<RtExposureTechniqueMode>('panoramic');
  const [straightSubMode, setStraightSubMode] = useState<StraightSubMode>('dwdi_superimposed');
  const [compareAllThree, setCompareAllThree] = useState<boolean>(false);
  const [showCameraArHud, setShowCameraArHud] = useState<boolean>(false);

  // Dynamic Technical Variables — Pipe & Weld
  const [pipeOdMm, setPipeOdMm] = useState<number>(406.4);
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(9.5);
  const [weldCapWidthMm, setWeldCapWidthMm] = useState<number>(12);

  // Dynamic Technical Variables — Radiation Source, Focal Spot & Energy
  const [sourceId, setSourceId] = useState<RtTechSourceId>('ir192');
  const [focalSpotMm, setFocalSpotMm] = useState<number>(3.0);
  const [activityCi, setActivityCi] = useState<number>(40);
  const [xrayKv, setXrayKv] = useState<number>(220);
  const [xrayMa, setXrayMa] = useState<number>(5.0);
  const [filmClass, setFilmClass] = useState<FilmSpeedClass>('class_1_d4');
  const [hasCollimator, setHasCollimator] = useState<boolean>(true);

  // Dynamic Technical Variables — Exposure Geometry & Multi-Shot Controls
  const [sfdMm, setSfdMm] = useState<number>(500);
  const [axialOffsetMm, setAxialOffsetMm] = useState<number>(110);
  const [eccentricityMm, setEccentricityMm] = useState<number>(0);
  const [filmLengthMm, setFilmLengthMm] = useState<300 | 400>(400);
  const [filmOverlapMm, setFilmOverlapMm] = useState<number>(30);
  const [shotRotationIdx, setShotRotationIdx] = useState<number>(0);

  // Dynamic Exposure Time (Auto-calculated vs Manual Override)
  const [autoExposureTime, setAutoExposureTime] = useState<boolean>(true);
  const [manualExposureSec, setManualExposureSec] = useState<number>(75);

  // Logged XP Banner State
  const [savedAttempt, setSavedAttempt] = useState<{
    xpEarned: number;
    scorePct: number;
    techniqueName: string;
  } | null>(null);

  // When switching technique, adjust Pipe OD / SFD into a realistic starting domain if out of bounds
  const handleSelectTechnique = (nextMode: RtExposureTechniqueMode) => {
    setTechnique(nextMode);
    setShotRotationIdx(0);
    if (nextMode === 'panoramic') {
      if (pipeOdMm < 140) {
        setPipeOdMm(406.4);
        setWallThicknessMm(9.5);
      }
      setEccentricityMm(0);
    } else if (nextMode === 'elliptical') {
      if (pipeOdMm > 88.9) {
        setPipeOdMm(60.3);
        setWallThicknessMm(5.5);
        setWeldCapWidthMm(9);
      }
      setSfdMm(480);
      setAxialOffsetMm(105);
      setSourceId('se75');
      setFocalSpotMm(2.0);
    } else {
      // Straight (Street)
      if (pipeOdMm <= 88.95) {
        setStraightSubMode('dwdi_superimposed');
        setWallThicknessMm(11.1);
        setSfdMm(500);
      } else {
        setStraightSubMode('dwsi_contact');
        setSfdMm(Math.round(pipeOdMm + 20));
      }
    }
  };

  const handleSelectSource = (nextSource: RtTechSourceId) => {
    setSourceId(nextSource);
    if (nextSource === 'ir192') {
      setFocalSpotMm(3.0);
      setActivityCi(40);
    } else if (nextSource === 'se75') {
      setFocalSpotMm(2.0);
      setActivityCi(55);
    } else {
      setFocalSpotMm(2.2);
      setXrayKv(220);
      setXrayMa(5.0);
    }
  };

  // Underlying Geometry Engines for All 3 Techniques
  const panoGeo = useMemo(
    () =>
      computePanoramicSimulation({
        odMm: pipeOdMm,
        wallMm: wallThicknessMm,
        sourceId,
        filmLengthMm,
        overlapMm: filmOverlapMm,
        eccentricityMm,
      }),
    [pipeOdMm, wallThicknessMm, sourceId, filmLengthMm, filmOverlapMm, eccentricityMm]
  );

  const ellipGeo = useMemo(
    () =>
      computeEllipticalSimulation({
        odMm: pipeOdMm,
        wallMm: wallThicknessMm,
        weldCapWidthMm,
        sfdMm,
        axialOffsetMm,
        sourceId,
        activeShotIndex: (shotRotationIdx % 2) as 0 | 1,
      }),
    [pipeOdMm, wallThicknessMm, weldCapWidthMm, sfdMm, axialOffsetMm, sourceId, shotRotationIdx]
  );

  const straightGeo = useMemo(
    () =>
      computeStraightSimulation({
        subMode: straightSubMode,
        odMm: pipeOdMm,
        wallMm: wallThicknessMm,
        plateWeldLengthMm: 1200,
        filmLengthMm,
        sfdMm,
        sourceId,
        activeShotIndex: shotRotationIdx,
      }),
    [straightSubMode, pipeOdMm, wallThicknessMm, filmLengthMm, sfdMm, sourceId, shotRotationIdx]
  );

  // Unified Dynamic Physics Telemetry (uses live custom focalSpotMm, Ci/kV/mA, Film Class, Exposure Time)
  const dynamicMetrics = useMemo<DynamicExposureMetrics>(() => {
    const effectiveSfd =
      technique === 'panoramic'
        ? Math.max(20, pipeOdMm / 2 - eccentricityMm)
        : technique === 'straight' && straightSubMode === 'dwsi_contact'
        ? Math.max(pipeOdMm, sfdMm)
        : Math.max(pipeOdMm + 80, sfdMm);

    const objectToFilmMm =
      technique === 'elliptical' ||
      (technique === 'straight' && straightSubMode === 'dwdi_superimposed')
        ? pipeOdMm + 2
        : wallThicknessMm + 2;

    const rayDistanceMm =
      technique === 'elliptical'
        ? Math.sqrt(effectiveSfd * effectiveSfd + axialOffsetMm * axialOffsetMm)
        : effectiveSfd;

    const sodMm = Math.max(15, rayDistanceMm - objectToFilmMm);
    const dynamicUgMm = Number(((focalSpotMm * objectToFilmMm) / sodMm).toFixed(3));
    const maxAllowedUgMm = getAsmeMaxUgMm(
      technique === 'panoramic' ||
        (technique === 'straight' && straightSubMode !== 'dwdi_superimposed')
        ? wallThicknessMm
        : 2 * wallThicknessMm
    );
    const passesUg = dynamicUgMm <= maxAllowedUgMm;
    const magnificationFactor = Number((rayDistanceMm / sodMm).toFixed(3));

    const penetratedSteelMm =
      technique === 'panoramic'
        ? wallThicknessMm
        : technique === 'elliptical'
        ? ellipGeo.obliquePenetratedSteelMm
        : straightGeo.penetratedSteelMm;

    // Radiation Output & Optimal Exposure Time Calculation
    const hvlMm =
      sourceId === 'ir192' ? 12.2 : sourceId === 'se75' ? 7.8 : Math.max(5.5, xrayKv * 0.042);
    const transmission = Math.pow(2, -penetratedSteelMm / hvlMm);
    const filmSpeedFactor = filmClass === 'class_1_d4' ? 1.0 : 0.48; // Class II is ~2x faster

    let intensityAt1mRMin = 10;
    let doseRateAt1mMrHr = 12000;
    if (sourceId === 'ir192') {
      // RHM Ir-192 ~ 0.48 R/hr per Ci @ 1m
      const rHrAt1m = activityCi * 0.48;
      doseRateAt1mMrHr = Math.round(rHrAt1m * 1000);
      intensityAt1mRMin = rHrAt1m / 60;
    } else if (sourceId === 'se75') {
      // RHM Se-75 ~ 0.203 R/hr per Ci @ 1m
      const rHrAt1m = activityCi * 0.203;
      doseRateAt1mMrHr = Math.round(rHrAt1m * 1000);
      intensityAt1mRMin = rHrAt1m / 60;
    } else {
      // X-Ray tube output ~ kV^2 * mA
      const rMinAt1m = Math.pow(xrayKv / 200, 2.2) * xrayMa * 1.45;
      intensityAt1mRMin = rMinAt1m;
      doseRateAt1mMrHr = Math.round(rMinAt1m * 60 * 1000);
    }

    const sfdMeters = rayDistanceMm / 1000;
    const doseRateAtFilmRSec =
      (intensityAt1mRMin / 60 / Math.max(0.02, sfdMeters * sfdMeters)) * transmission;
    const requiredRoentgensFor26Hd = 1.65 * filmSpeedFactor;
    const optimalExposureSec = Math.max(
      4,
      Math.min(3600, Math.round(requiredRoentgensFor26Hd / Math.max(1e-5, doseRateAtFilmRSec)))
    );

    const activeExposureSec = autoExposureTime ? optimalExposureSec : manualExposureSec;
    const exposureRatio = Math.max(0.08, activeExposureSec / optimalExposureSec);
    const simulatedDensityHd = Number(
      Math.max(0.65, Math.min(4.85, 2.6 + 2.15 * Math.log10(exposureRatio))).toFixed(2)
    );
    const densityInCodeWindow = simulatedDensityHd >= 2.0 && simulatedDensityHd <= 4.0;

    // 2 mR/hr Safe Barricade Radius (with 4x collimator attenuation when active on external shots)
    const collimatorFactor = hasCollimator && technique !== 'panoramic' ? 0.25 : 1.0;
    const effectiveDose1m = doseRateAt1mMrHr * collimatorFactor;
    const safeBarricadeRadiusM = Number(Math.sqrt(effectiveDose1m / 2.0).toFixed(1));

    return {
      sodMm: Number(sodMm.toFixed(1)),
      objectToFilmMm: Number(objectToFilmMm.toFixed(1)),
      dynamicUgMm,
      maxAllowedUgMm,
      passesUg,
      magnificationFactor,
      penetratedSteelMm,
      optimalExposureSec,
      simulatedDensityHd,
      densityInCodeWindow,
      safeBarricadeRadiusM,
      doseRateAt1mMrHr: Math.round(effectiveDose1m),
      essentialAsmeWireLabel: selectAsmeWireLabel(wallThicknessMm),
    };
  }, [
    technique,
    straightSubMode,
    pipeOdMm,
    wallThicknessMm,
    sfdMm,
    axialOffsetMm,
    eccentricityMm,
    focalSpotMm,
    sourceId,
    activityCi,
    xrayKv,
    xrayMa,
    filmClass,
    hasCollimator,
    autoExposureTime,
    manualExposureSec,
    ellipGeo.obliquePenetratedSteelMm,
    straightGeo.penetratedSteelMm,
  ]);

  useEffect(() => {
    if (autoExposureTime) {
      setManualExposureSec(dynamicMetrics.optimalExposureSec);
    }
  }, [autoExposureTime, dynamicMetrics.optimalExposureSec]);

  const handleAutoOptimizeAll = () => {
    setAutoExposureTime(true);
    setHasCollimator(true);
    if (technique === 'panoramic') {
      if (pipeOdMm < 220) {
        setSourceId('se75');
        setFocalSpotMm(2.0);
        setPipeOdMm(323.9);
      } else {
        setFocalSpotMm(sourceId === 'ir192' ? 2.5 : 2.0);
      }
      setEccentricityMm(0);
      setFilmOverlapMm(30);
    } else if (technique === 'elliptical') {
      const clampedOd = Math.min(88.9, Math.max(42, pipeOdMm));
      const clampedWall = Math.min(clampedOd * 0.16, wallThicknessMm);
      setPipeOdMm(Number(clampedOd.toFixed(1)));
      setWallThicknessMm(Number(clampedWall.toFixed(1)));
      setSourceId('se75');
      setFocalSpotMm(2.0);
      const nextSfd = 520;
      setSfdMm(nextSfd);
      const sod = nextSfd - (clampedOd - clampedWall / 2);
      const optOff = Math.round(((weldCapWidthMm + 9) * sod) / Math.max(12, clampedOd - clampedWall));
      setAxialOffsetMm(optOff);
    } else {
      if (straightSubMode === 'dwdi_superimposed') {
        const clampedOd = Math.min(88.9, pipeOdMm);
        setPipeOdMm(Number(clampedOd.toFixed(1)));
        setSourceId('se75');
        setFocalSpotMm(2.0);
        setSfdMm(560);
      } else if (straightSubMode === 'dwsi_contact') {
        const nextOd = Math.max(168.3, pipeOdMm);
        setPipeOdMm(Number(nextOd.toFixed(1)));
        setSourceId('ir192');
        setFocalSpotMm(2.5);
        setSfdMm(Math.round(nextOd + 30));
      } else {
        setSfdMm(650);
        setFocalSpotMm(2.2);
      }
    }
  };

  const handleResetDefaults = () => {
    setTechnique('panoramic');
    setCompareAllThree(false);
    setPipeOdMm(406.4);
    setWallThicknessMm(9.5);
    setWeldCapWidthMm(12);
    setSourceId('ir192');
    setFocalSpotMm(3.0);
    setActivityCi(40);
    setFilmClass('class_1_d4');
    setEccentricityMm(0);
    setFilmOverlapMm(30);
    setSfdMm(500);
    setAxialOffsetMm(110);
    setShotRotationIdx(0);
    setAutoExposureTime(true);
  };

  const geometryCodeValid =
    technique === 'panoramic'
      ? dynamicMetrics.passesUg && panoGeo.densityUniform && panoGeo.totalOverlapValid
      : technique === 'elliptical'
      ? dynamicMetrics.passesUg && ellipGeo.status === 'OPTIMAL_OPEN_ELLIPSE'
      : dynamicMetrics.passesUg;

  const overallCompliant = geometryCodeValid && dynamicMetrics.densityInCodeWindow;

  const handleSaveExperiment = () => {
    const scorePct = overallCompliant
      ? 100
      : dynamicMetrics.passesUg || dynamicMetrics.densityInCodeWindow
      ? 75
      : 55;

    const techLabelAr =
      technique === 'panoramic'
        ? 'البانوراما (Panorama 360°)'
        : technique === 'elliptical'
        ? 'الإليبس (Ellipse DWDI)'
        : 'الستريت (Straight / Street 0°)';
    const techLabelEn =
      technique === 'panoramic'
        ? 'Panorama 360° (SWSI)'
        : technique === 'elliptical'
        ? 'Ellipse Offset (DWDI)'
        : 'Straight / Street (0°)';

    const rec = recordSimulationAttempt({
      simulatorId: `sim_labs_rt_${technique}`,
      targetSubTab: 'sim_labs_rt',
      simulatorTitle: {
        ar: `معمل محاكاة تقنيات التصوير (${techLabelAr})`,
        en: `RT Exposure Simulation Lab (${techLabelEn})`,
      },
      ndtMethod: 'RT',
      defectTypes: [
        {
          id: `rt_sim_${technique}`,
          ar: `ضبط المتغيرات التقنية — ${techLabelAr}`,
          en: `Dynamic Parameter Tuning — ${techLabelEn}`,
        },
      ],
      status: scorePct >= 75 ? 'PASS' : 'FAIL',
      codeVerdict: 'ACCEPT',
      traineeVerdict: overallCompliant ? 'ACCEPT' : 'REJECT',
      codeStandard: 'ASME Sec V Art. 2',
      scorePct,
      notes: {
        ar: `OD=${pipeOdMm}mm · t=${wallThicknessMm}mm · Ug=${dynamicMetrics.dynamicUgMm}mm · D=${dynamicMetrics.simulatedDensityHd} H&D`,
        en: `OD=${pipeOdMm}mm · t=${wallThicknessMm}mm · Ug=${dynamicMetrics.dynamicUgMm}mm · D=${dynamicMetrics.simulatedDensityHd} H&D`,
      },
    });

    setSavedAttempt({
      xpEarned: rec.xpEarned,
      scorePct,
      techniqueName: isAr ? techLabelAr : techLabelEn,
    });
  };

  // Convert H&D optical density into grayscale fill hex for live film SVG
  const filmShadeHex = useMemo(() => {
    const clamped = Math.max(0.65, Math.min(4.85, dynamicMetrics.simulatedDensityHd));
    const lum = Math.round(196 - ((clamped - 0.65) / 4.2) * 176);
    const hex = Math.max(14, Math.min(205, lum)).toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }, [dynamicMetrics.simulatedDensityHd]);

  const shellBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const subBg = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-950/90 border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const pipeInches = (pipeOdMm / 25.4).toFixed(1);

  return (
    <section
      data-testid="simulation-labs-rt-workbench"
      className="space-y-6"
      aria-label={
        isAr
          ? 'معمل محاكاة تقنيات البانوراما والإليبس والستريت'
          : 'Panorama, Ellipse & Straight RT Simulation Lab'
      }
    >
      {/* Top Lab Header & Technique Mode Selector */}
      <div className={`rounded-2xl border p-5 sm:p-7 ${shellBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/25">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-500 mb-1.5">
              <Radio className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'قسم معامل المحاكاة التفاعلية' : 'Interactive Simulation Labs'}</span>
              <span aria-hidden="true">·</span>
              <span>Panorama · Ellipse · Straight (Street)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr
                ? 'معمل المحاكاة الديناميكي لتقنيات التصوير الإشعاعي (Panorama · Ellipse · Street)'
                : 'Dynamic RT Exposure Simulation Lab (Panorama · Ellipse · Straight / Street)'}
            </h2>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${mutedText}`}>
              {isAr
                ? 'تحكّم لحظياً في جميع المتغيرات التقنية (قطر وسماكة الماسورة، حجم البؤرة F، الشدة الإشعاعية Ci / kV، المسافة البؤرية SFD، الإزاحة المحورية، وزمن التعريض) وراقب تأثيرها المباشر على مسار الأشعة وكثافة الفيلم ومطابقة كود ASME.'
                : 'Adjust technical parameters in real time (Pipe OD, wall thickness, focal spot F, Ci / kV output, SFD, axial offset, and exposure time) and observe live ray-tracing, film density H&D, and ASME code compliance.'}
            </p>
          </div>

          {/* The four tools used to be a fixed single-line row: on a phone the
              labels pushed the buttons (and their icons) past the card edge. */}
          <div
            data-testid="rt-workbench-toolbar"
            className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end"
          >
            <button
              type="button"
              data-testid="rt-workbench-camera-toggle"
              onClick={() => setShowCameraArHud((v) => !v)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex min-w-0 max-w-full items-center gap-1.5 leading-tight ${
                showCameraArHud
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                  : isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0">
                {isAr ? 'استخدام الكاميرا (تراكب NDT)' : 'Use Camera (NDT Overlay)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCompareAllThree((v) => !v)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex min-w-0 max-w-full items-center gap-1.5 leading-tight ${
                compareAllThree
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : isLight
                  ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-cyan-400'
              }`}
            >
              <Columns className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0">
                {isAr ? 'مقارنة التقنيات الثلاث معاً' : 'Compare All 3 Techniques'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleAutoOptimizeAll}
              className="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-500 text-xs font-bold transition cursor-pointer flex min-w-0 max-w-full items-center gap-1.5 leading-tight"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'ضبط مثالي تلقائي (ASME)' : 'Auto-Optimize ASME'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex min-w-0 max-w-full items-center gap-1.5 leading-tight ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* 3 Technique Segmented Cards: Panorama | Ellipse | Straight (Street) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <button
            type="button"
            data-testid="tech-btn-panorama"
            onClick={() => handleSelectTechnique('panoramic')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              technique === 'panoramic'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : isLight
                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600'
            }`}
          >
            <div
              className={`text-xs font-mono font-bold tabular-nums ${
                technique === 'panoramic' ? 'text-slate-900' : 'text-amber-500'
              }`}
            >
              01 · PANORAMA (360° SWSI)
            </div>
            <div className="text-sm sm:text-base font-black mt-0.5">
              {isAr ? 'تقنية البانوراما (Panorama)' : 'Panorama Technique'}
            </div>
            <div
              className={`text-xs mt-1 ${
                technique === 'panoramic' ? 'text-slate-800' : mutedText
              }`}
            >
              {isAr
                ? 'مصدر مركزي داخلي · تغطية 360° بلقطة واحدة'
                : 'Central internal source · Full 360° in 1 shot'}
            </div>
          </button>

          <button
            type="button"
            data-testid="tech-btn-ellipse"
            onClick={() => handleSelectTechnique('elliptical')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              technique === 'elliptical'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                : isLight
                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-cyan-400'
                : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600'
            }`}
          >
            <div
              className={`text-xs font-mono font-bold tabular-nums ${
                technique === 'elliptical' ? 'text-slate-900' : 'text-cyan-500'
              }`}
            >
              02 · ELLIPSE (DWDI OFFSET)
            </div>
            <div className="text-sm sm:text-base font-black mt-0.5">
              {isAr ? 'تقنية الإليبس (Ellipse)' : 'Ellipse Technique'}
            </div>
            <div
              className={`text-xs mt-1 ${
                technique === 'elliptical' ? 'text-slate-900' : mutedText
              }`}
            >
              {isAr
                ? 'إزاحة محورية لفصل الجدارين (≤ 3.5") · لقطتان 90°'
                : 'Axial offset opens ellipse (OD ≤ 3.5") · 2 shots @ 90°'}
            </div>
          </button>

          <button
            type="button"
            data-testid="tech-btn-street"
            onClick={() => handleSelectTechnique('straight')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              technique === 'straight'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : isLight
                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600'
            }`}
          >
            <div
              className={`text-xs font-mono font-bold tabular-nums ${
                technique === 'straight' ? 'text-slate-900' : 'text-emerald-500'
              }`}
            >
              03 · STRAIGHT / STREET (0° BEAM)
            </div>
            <div className="text-sm sm:text-base font-black mt-0.5">
              {isAr ? 'تقنية الستريت (Straight / Street)' : 'Straight (Street) Technique'}
            </div>
            <div
              className={`text-xs mt-1 ${
                technique === 'straight' ? 'text-slate-900' : mutedText
              }`}
            >
              {isAr
                ? 'شعاع عمودي 0° بدون إزاحة · متطابق أو ملامس أو ألواح'
                : '0° perpendicular normal beam · Superimposed, Contact, or Plate'}
            </div>
          </button>
        </div>
      </div>

      {/* Optional Embedded Live Camera NDT AR Overlay Synced with Active RT Parameters */}
      {showCameraArHud && (
        <NdtCameraArOverlayLab
          language={language}
          initialOverlayDiscipline="rt_exposure"
          initialRtTechnique={technique}
          initialPipeOdMm={pipeOdMm}
          initialWallMm={wallThicknessMm}
          initialSfdMm={sfdMm}
          initialFocalSpotMm={focalSpotMm}
          initialAxialOffsetMm={axialOffsetMm}
        />
      )}

      {/* Optional Live Side-by-Side 3-Technique Synchronized Summary Strip */}
      {compareAllThree && (
        <div
          data-testid="live-three-tech-comparison"
          className={`rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-3 gap-4 tabular-nums ${subBg}`}
        >
          <div className="p-4 rounded-xl border border-amber-500/35 bg-amber-500/5 space-y-1.5">
            <div className="text-xs font-mono font-bold text-amber-500">PANORAMA · 360°</div>
            <div className="text-sm font-black">
              {panoGeo.requiredFilmsCount} {isAr ? 'أفلام × لقطة واحدة' : 'Films × 1 Exposure'}
            </div>
            <div className={`text-xs ${mutedText}`}>
              SFD = {panoGeo.nominalSfdMm} mm · Ug = {panoGeo.nearWallUgMm} mm ·{' '}
              {panoGeo.passesAsmeCode
                ? isAr
                  ? 'مناسب لهذا القطر'
                  : 'Valid for this OD'
                : isAr
                ? `يحتاج قطر ≥ ${panoGeo.minAllowableOdForUgMm} مم`
                : `Needs OD ≥ ${panoGeo.minAllowableOdForUgMm} mm`}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-cyan-500/35 bg-cyan-500/5 space-y-1.5">
            <div className="text-xs font-mono font-bold text-cyan-500">ELLIPSE · DWDI</div>
            <div className="text-sm font-black">
              {isAr ? 'لقطتان بزاوية 90° (0° & 90°)' : '2 Exposures @ 90° (0° & 90°)'}
            </div>
            <div className={`text-xs ${mutedText}`}>
              θ = {ellipGeo.beamTiltDeg}° · Gap = {ellipGeo.clearRootOpeningGapMm} mm ·{' '}
              {ellipGeo.withinAsmeOdLimit
                ? isAr
                  ? 'ضمن حد ≤ 88.9 مم'
                  : 'Within ≤ 88.9 mm limit'
                : isAr
                ? 'يتجاوز حد 3.5" (غير مسموح)'
                : 'Exceeds 3.5" OD limit'}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/35 bg-emerald-500/5 space-y-1.5">
            <div className="text-xs font-mono font-bold text-emerald-500">
              STRAIGHT / STREET · 0°
            </div>
            <div className="text-sm font-black">
              {straightGeo.exposuresRequired}{' '}
              {isAr ? 'لقطات' : 'Exposures'}{' '}
              {straightGeo.rotationStepDeg > 0 ? `(@ ${straightGeo.rotationStepDeg}°)` : ''}
            </div>
            <div className={`text-xs ${mutedText}`}>
              Offset = 0 mm · Chord = {straightGeo.effectiveChordLengthMm} mm · Ug ={' '}
              {straightGeo.ugMm} mm
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Zone Interactive Sandbox: Left Visual Stage (7 cols) + Right Dynamic Controls (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / START ZONE (7 Cols): Live Engineering Ray-Tracing + Film Output + Telemetry */}
        <div className="lg:col-span-7 space-y-5">
          {/* Real-Time Quantitative Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
            <div className={`p-3.5 rounded-xl border ${subBg}`}>
              <div className={`text-[11px] ${mutedText}`}>
                {isAr ? 'عدم الوضوح الهندسي Ug' : 'Geometric Ug'}
              </div>
              <div
                data-testid="live-ug-readout"
                className={`text-base sm:text-lg font-black font-mono mt-0.5 ${
                  dynamicMetrics.passesUg ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {dynamicMetrics.dynamicUgMm} mm
              </div>
              <div className={`text-[11px] font-mono ${mutedText}`}>
                Max {dynamicMetrics.maxAllowedUgMm} mm · M={dynamicMetrics.magnificationFactor}×
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${subBg}`}>
              <div className={`text-[11px] ${mutedText}`}>
                {isAr ? 'كثافة الفيلم المحسوبة' : 'Film Density (H&D)'}
              </div>
              <div
                data-testid="live-density-readout"
                className={`text-base sm:text-lg font-black font-mono mt-0.5 ${
                  dynamicMetrics.densityInCodeWindow ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {dynamicMetrics.simulatedDensityHd} H&amp;D
              </div>
              <div className={`text-[11px] font-mono ${mutedText}`}>
                ASME 2.0 – 4.0 H&amp;D
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${subBg}`}>
              <div className={`text-[11px] flex items-center gap-1 ${mutedText}`}>
                <Clock className="w-3 h-3 shrink-0" />
                <span>{isAr ? 'زمن التعريض الأمثل' : 'Optimal Exposure'}</span>
              </div>
              <div
                data-testid="live-exposure-time"
                className="text-base sm:text-lg font-black font-mono mt-0.5 text-cyan-500"
              >
                {formatMinutesSeconds(
                  autoExposureTime ? dynamicMetrics.optimalExposureSec : manualExposureSec
                )}
              </div>
              <div className={`text-[11px] font-mono ${mutedText}`}>
                T_eff = {dynamicMetrics.penetratedSteelMm} mm
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${subBg}`}>
              <div className={`text-[11px] flex items-center gap-1 ${mutedText}`}>
                <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{isAr ? 'نصف قطر حاجز 2mR/h' : '2 mR/hr Barricade'}</span>
              </div>
              <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-amber-500">
                {dynamicMetrics.safeBarricadeRadiusM} m
              </div>
              <div className={`text-[11px] font-mono ${mutedText}`}>
                IQI {dynamicMetrics.essentialAsmeWireLabel}
              </div>
            </div>
          </div>

          {/* Interactive Geometric Ray-Tracing Canvas */}
          <div className={`rounded-2xl border p-5 space-y-4 ${shellBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  {isAr
                    ? 'مسرح المحاكاة الهندسي الحي وتتبّع الأشعة والفيلم'
                    : 'Live Geometric Ray-Tracing & Radiographic Film Stage'}
                </h3>
                <p className={`text-xs ${mutedText}`}>
                  {isAr
                    ? `الماسورة الحالية: ${pipeOdMm} مم (${pipeInches}") × سماكة ${wallThicknessMm} مم · بؤرة المصدر F = ${focalSpotMm} مم`
                    : `Active Pipe: ${pipeOdMm} mm (${pipeInches}") × Wall ${wallThicknessMm} mm · Focal Spot F = ${focalSpotMm} mm`}
                </p>
              </div>

              <span
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  overallCompliant ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {overallCompliant ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {overallCompliant
                    ? isAr
                      ? 'متغيرات مطابقة لكود ASME'
                      : 'ASME Code Compliant'
                    : isAr
                    ? 'متغيرات خارج حدود الكود'
                    : 'Outside Code Window'}
                </span>
              </span>
            </div>

            {/* Dynamic SVG Ray-Tracing Viewport */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              {technique === 'panoramic' && (() => {
                const cx = 340;
                const cy = 120;
                const outerR = Math.min(86, Math.max(48, pipeOdMm * 0.14));
                const wallPx = Math.min(18, Math.max(5, wallThicknessMm * 0.65));
                const beltR = outerR + 8;
                const eccPx = Math.round(
                  (eccentricityMm / Math.max(40, panoGeo.nominalSfdMm)) * (outerR - wallPx - 10)
                );
                const srcY = cy - eccPx;
                const focalRadius = Math.max(4, focalSpotMm * 2.1);

                return (
                  <svg
                    viewBox="0 0 680 240"
                    className="w-full h-auto rounded-lg bg-slate-900"
                    role="img"
                    aria-label="Dynamic Panorama ray tracing viewport"
                  >
                    {/* 360 Radial Rays */}
                    {Array.from({ length: 16 }, (_, idx) => {
                      const rad = ((idx * 22.5 - 90) * Math.PI) / 180;
                      return (
                        <line
                          key={idx}
                          x1={cx}
                          y1={srcY}
                          x2={cx + beltR * Math.cos(rad)}
                          y2={cy + beltR * Math.sin(rad)}
                          stroke="rgba(245, 158, 11, 0.34)"
                          strokeWidth="1.3"
                          strokeDasharray="4 3"
                        />
                      );
                    })}

                    {/* Continuous Film Belt */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={beltR}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="5"
                      strokeDasharray="28 3"
                    />

                    {/* Pipe Wall */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={outerR}
                      fill="#0f172a"
                      stroke="#64748b"
                      strokeWidth={wallPx}
                    />

                    {/* Central Isotope / Crawler Focal Spot */}
                    <circle
                      cx={cx}
                      cy={srcY}
                      r={focalRadius}
                      fill="#f59e0b"
                      stroke="#fef3c7"
                      strokeWidth="2"
                    />

                    {/* Left & Right Telemetry Callouts inside Canvas */}
                    <text x="26" y="42" fill="#fbbf24" fontSize="11" fontFamily="monospace">
                      1 Shot = 360° Coverage
                    </text>
                    <text x="26" y="62" fill="#cbd5e1" fontSize="10.5" fontFamily="monospace">
                      Belt: {panoGeo.requiredFilmsCount} × {filmLengthMm}mm
                    </text>
                    <text x="26" y="82" fill="#38bdf8" fontSize="10.5" fontFamily="monospace">
                      Overlap: {filmOverlapMm} mm
                    </text>

                    <text x="485" y="42" fill="#cbd5e1" fontSize="10.5" fontFamily="monospace">
                      12:00 D = {panoGeo.nearWallDensityHd} H&amp;D
                    </text>
                    <text x="485" y="62" fill="#cbd5e1" fontSize="10.5" fontFamily="monospace">
                      06:00 D = {panoGeo.farWallDensityHd} H&amp;D
                    </text>
                    <text x="485" y="82" fill="#fbbf24" fontSize="10.5" fontFamily="monospace">
                      Eccentricity Δe = {eccentricityMm} mm
                    </text>
                  </svg>
                );
              })()}

              {technique === 'elliptical' && (() => {
                const weldCenterX = 365;
                const srcX = Math.max(95, weldCenterX - Math.round((axialOffsetMm / 260) * 230));
                const srcY = 30;
                const pipeTopY = 116;
                const pipeBotY = 172;
                const filmY = 186;
                const tUpper = (filmY - srcY) / Math.max(12, pipeTopY - srcY);
                const projUpperX = Math.min(610, srcX + tUpper * (weldCenterX - srcX));
                const focalRadius = Math.max(4, focalSpotMm * 2.1);

                return (
                  <svg
                    viewBox="0 0 680 240"
                    className="w-full h-auto rounded-lg bg-slate-900"
                    role="img"
                    aria-label="Dynamic Ellipse ray tracing viewport"
                  >
                    {/* Reference vertical & offset triangle */}
                    <line
                      x1={weldCenterX}
                      y1={srcY}
                      x2={weldCenterX}
                      y2={filmY}
                      stroke="#475569"
                      strokeDasharray="4 4"
                    />
                    <line x1={srcX} y1={srcY} x2={weldCenterX} y2={srcY} stroke="#22d3ee" strokeWidth="2.2" />
                    <text
                      x={(srcX + weldCenterX) / 2}
                      y="20"
                      textAnchor="middle"
                      fill="#22d3ee"
                      fontSize="11"
                      fontFamily="monospace"
                    >
                      Axial Offset L = {axialOffsetMm} mm (θ = {ellipGeo.beamTiltDeg}°)
                    </text>

                    {/* Beam Cone */}
                    <polygon
                      points={`${srcX},${srcY} 285,${filmY} ${Math.max(440, projUpperX + 26)},${filmY}`}
                      fill="rgba(34, 211, 238, 0.14)"
                    />

                    {/* Small-Bore Pipe Upper & Lower Walls */}
                    <rect x="110" y={pipeTopY} width="480" height="12" fill="#475569" stroke="#94a3b8" />
                    <rect x="110" y={pipeBotY} width="480" height="12" fill="#475569" stroke="#94a3b8" />

                    {/* Upper & Lower Weld Crowns */}
                    <polygon
                      points={`${weldCenterX - 10},${pipeTopY - 3} ${weldCenterX + 10},${pipeTopY - 3} ${weldCenterX + 7},${pipeTopY + 14} ${weldCenterX - 7},${pipeTopY + 14}`}
                      fill="#f8fafc"
                    />
                    <polygon
                      points={`${weldCenterX - 7},${pipeBotY - 2} ${weldCenterX + 7},${pipeBotY - 2} ${weldCenterX + 10},${pipeBotY + 15} ${weldCenterX - 10},${pipeBotY + 15}`}
                      fill="#f8fafc"
                    />

                    {/* Ray through Upper Wall vs Lower Wall */}
                    <line
                      x1={srcX}
                      y1={srcY}
                      x2={projUpperX}
                      y2={filmY}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                    />
                    <line
                      x1={srcX}
                      y1={srcY}
                      x2={weldCenterX + 6}
                      y2={filmY}
                      stroke="#34d399"
                      strokeWidth="2"
                    />

                    {/* Film Cassette */}
                    <rect x="240" y={filmY} width="380" height="7" rx="2" fill="#06b6d4" />
                    <circle cx={projUpperX} cy={filmY + 3.5} r="4.5" fill="#f59e0b" />
                    <circle cx={weldCenterX + 6} cy={filmY + 3.5} r="4.5" fill="#34d399" />

                    {/* Focal Spot */}
                    <circle
                      cx={srcX}
                      cy={srcY}
                      r={focalRadius}
                      fill="#22d3ee"
                      stroke="#ecfeff"
                      strokeWidth="2"
                    />

                    <text x="430" y="218" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                      Ellipse Separation = {ellipGeo.ellipseSeparationMm} mm · Clear Root Gap ={' '}
                      {ellipGeo.clearRootOpeningGapMm} mm · Active Shot {(shotRotationIdx % 2) * 90}°
                    </text>
                  </svg>
                );
              })()}

              {technique === 'straight' && (() => {
                const isPlate = straightSubMode === 'swsi_plate';
                const isContact = straightSubMode === 'dwsi_contact';
                const srcY = isContact ? 68 : 28;
                const filmY = 186;
                const focalRadius = Math.max(4, focalSpotMm * 2.1);

                return (
                  <svg
                    viewBox="0 0 680 240"
                    className="w-full h-auto rounded-lg bg-slate-900"
                    role="img"
                    aria-label="Dynamic Straight 0 degree ray tracing viewport"
                  >
                    <polygon
                      points={`340,${srcY} 210,${filmY} 470,${filmY}`}
                      fill="rgba(16, 185, 129, 0.16)"
                    />
                    <line
                      x1="340"
                      y1={srcY}
                      x2="340"
                      y2={filmY + 8}
                      stroke="#34d399"
                      strokeWidth="2.2"
                      strokeDasharray="5 3"
                    />

                    {!isPlate && (
                      <>
                        <rect x="110" y="80" width="460" height="14" fill="#475569" stroke="#94a3b8" />
                        <polygon points="329,77 351,77 347,96 333,96" fill="#e2e8f0" />
                      </>
                    )}

                    <rect x="110" y="166" width="460" height="16" fill="#475569" stroke="#94a3b8" />
                    <polygon points="331,163 349,163 353,184 327,184" fill="#f8fafc" />

                    {/* Film Cassette */}
                    <rect x="195" y={filmY} width="290" height="7" rx="2" fill="#06b6d4" />

                    {/* Focal Spot */}
                    <circle
                      cx="340"
                      cy={srcY}
                      r={focalRadius}
                      fill="#10b981"
                      stroke="#ecfdf5"
                      strokeWidth="2"
                    />

                    <text x="340" y="218" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                      0° Straight Beam (Offset = 0 mm) · {straightGeo.stationMarkersLabel} ·{' '}
                      {straightGeo.exposuresRequired} Total Shots
                    </text>
                  </svg>
                );
              })()}
            </div>

            {/* Live Simulated Film Strip Responding to Density H&D + Geometry */}
            <div className="rounded-xl border border-slate-800 bg-black p-3">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2 tabular-nums">
                <span>
                  {isAr
                    ? 'معاينة الفيلم المحمّض (تتفاعل حياً مع زمن التعريض والكثافة والإزاحة):'
                    : 'Live Developed Film Radiograph (reacts to exposure time, H&D & offset):'}
                </span>
                <span className="font-mono text-amber-400">
                  D = {dynamicMetrics.simulatedDensityHd} H&amp;D
                </span>
              </div>

              <svg
                viewBox="0 0 680 135"
                className="w-full h-auto rounded-lg"
                role="img"
                aria-label="Dynamic simulated radiograph strip"
              >
                <rect x="20" y="10" width="640" height="108" rx="4" fill={filmShadeHex} stroke="#475569" />

                {technique === 'elliptical' ? (
                  <>
                    <ellipse
                      cx="340"
                      cy="64"
                      rx={Math.min(200, Math.max(85, pipeOdMm * 2.0))}
                      ry={Math.min(42, Math.max(0, ellipGeo.ellipseSeparationMm * 1.3))}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeOpacity="0.45"
                      strokeWidth={Math.max(8, Math.min(18, weldCapWidthMm))}
                    />
                    {ellipGeo.projectedFlaws.map((flaw) => {
                      const rx = Math.min(200, Math.max(85, pipeOdMm * 2.0));
                      const ry = Math.min(42, Math.max(0, ellipGeo.ellipseSeparationMm * 1.3));
                      const fx = 340 + flaw.normX * (rx - 10);
                      const fy = 64 + flaw.normY * ry;
                      return (
                        <circle
                          key={flaw.id}
                          cx={fx}
                          cy={fy}
                          r="4"
                          fill={flaw.clockHour === 6 ? '#ffffff' : '#090b0e'}
                          stroke="#22d3ee"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </>
                ) : (
                  <>
                    <rect
                      x="20"
                      y="52"
                      width="640"
                      height="24"
                      fill="#e2e8f0"
                      fillOpacity={
                        technique === 'straight' && straightSubMode === 'dwdi_superimposed'
                          ? 0.44
                          : 0.28
                      }
                    />
                    <line x1="280" y1="64" x2="365" y2="65" stroke="#0b0d11" strokeWidth="2.6" />
                  </>
                )}

                {/* IQI Wires & Lead Markers */}
                <text x="42" y="30" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  {technique === 'panoramic'
                    ? `360° BELT · ${panoGeo.requiredFilmsCount} FILMS`
                    : technique === 'elliptical'
                    ? `ELLIPSE · ${(shotRotationIdx % 2) * 90}°`
                    : `STRAIGHT · ${straightGeo.stationMarkersLabel}`}
                </text>
                <text x="530" y="30" fill="#f8fafc" fontSize="10.5" fontFamily="monospace">
                  IQI {dynamicMetrics.essentialAsmeWireLabel}
                </text>
              </svg>
            </div>
          </div>

          {/* Save Experiment & Optional Link to Full 4-Stage Darkroom Lab */}
          <div className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 ${subBg}`}>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveExperiment}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'حفظ تجربة المعمل في سجل المحاكاة (+XP)'
                    : 'Save Lab Experiment to History (+XP)'}
                </span>
              </button>

              {onOpenFullRtLab && (
                <button
                  type="button"
                  onClick={onOpenFullRtLab}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 hover:border-amber-500'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400'
                  }`}
                >
                  {isAr
                    ? 'فتح معمل التحميض وقراءة الأفلام الكامل'
                    : 'Open Full Darkroom & Film Lab'}
                </button>
              )}
            </div>

            {savedAttempt && (
              <div className="text-xs font-bold text-emerald-500 tabular-nums">
                {isAr
                  ? `تم التوثيق (${savedAttempt.techniqueName}): ${savedAttempt.scorePct}% · +${savedAttempt.xpEarned} XP`
                  : `Logged (${savedAttempt.techniqueName}): ${savedAttempt.scorePct}% · +${savedAttempt.xpEarned} XP`}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / END ZONE (5 Cols): Dynamic Technical Variables Control Deck */}
        <div className={`lg:col-span-5 rounded-2xl border p-5 space-y-5 ${shellBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/25">
            <div className="flex min-w-0 items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500 shrink-0" />
              <h3 className="text-base font-bold">
                {isAr
                  ? 'لوحة التحكم الديناميكية في المتغيرات التقنية'
                  : 'Dynamic Technical Variables Control Panel'}
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-500 tabular-nums">LIVE</span>
          </div>

          {/* Group 1: Pipe & Weld Dimensions */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isAr ? '1. أبعاد الماسورة ووصلة اللحام' : '1. Pipe & Weld Geometry'}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                <label htmlFor="sim-pipe-od">
                  {isAr ? 'القطر الخارجي للماسورة (OD):' : 'Pipe Outer Diameter (OD):'}
                </label>
                <span className="font-mono text-amber-500">
                  {pipeOdMm} mm ({pipeInches}&quot;)
                </span>
              </div>
              <input
                id="sim-pipe-od"
                type="range"
                min={33.4}
                max={914}
                step={0.5}
                value={pipeOdMm}
                onChange={(e) => setPipeOdMm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                <label htmlFor="sim-wall-t">
                  {isAr ? 'سماكة الجدار الواحد (t):' : 'Single Wall Thickness (t):'}
                </label>
                <span className="font-mono text-amber-500">{wallThicknessMm} mm</span>
              </div>
              <input
                id="sim-wall-t"
                type="range"
                min={3.0}
                max={36.0}
                step={0.5}
                value={wallThicknessMm}
                onChange={(e) => setWallThicknessMm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Group 2: Radiation Source, Focal Spot & Output */}
          <div className="space-y-3 pt-3 border-t border-slate-700/20">
            <div className="text-xs font-bold text-cyan-500">
              {isAr
                ? '2. متغيرات المصدر الإشعاعي وحجم البؤرة والطاقة'
                : '2. Source, Focal Spot & Energy Variables'}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'ir192', label: 'Ir-192' },
                  { id: 'se75', label: 'Se-75' },
                  { id: 'xray_crawler', label: 'X-Ray' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSource(item.id)}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-bold cursor-pointer transition ${
                    sourceId === item.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-700'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                <label htmlFor="sim-focal-spot">
                  {isAr ? 'حجم البؤرة الإشعاعية (Focal Spot F):' : 'Focal Spot Size (F):'}
                </label>
                <span className="font-mono text-cyan-500">{focalSpotMm.toFixed(1)} mm</span>
              </div>
              <input
                id="sim-focal-spot"
                type="range"
                min={1.0}
                max={4.5}
                step={0.1}
                value={focalSpotMm}
                onChange={(e) => setFocalSpotMm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {sourceId !== 'xray_crawler' ? (
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                  <label htmlFor="sim-activity-ci">
                    {isAr ? 'شدة النظير المشع (Activity Ci):' : 'Isotope Activity (Ci):'}
                  </label>
                  <span className="font-mono text-cyan-500">{activityCi} Ci</span>
                </div>
                <input
                  id="sim-activity-ci"
                  type="range"
                  min={5}
                  max={120}
                  step={1}
                  value={activityCi}
                  onChange={(e) => setActivityCi(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <label htmlFor="sim-xray-kv">kV:</label>
                    <span className="font-mono text-cyan-500">{xrayKv} kV</span>
                  </div>
                  <input
                    id="sim-xray-kv"
                    type="range"
                    min={100}
                    max={300}
                    step={5}
                    value={xrayKv}
                    onChange={(e) => setXrayKv(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <label htmlFor="sim-xray-ma">mA:</label>
                    <span className="font-mono text-cyan-500">{xrayMa.toFixed(1)} mA</span>
                  </div>
                  <input
                    id="sim-xray-ma"
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={xrayMa}
                    onChange={(e) => setXrayMa(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Group 3: Technique-Specific Geometric Variables */}
          <div className="space-y-3 pt-3 border-t border-slate-700/20">
            <div className="text-xs font-bold text-emerald-500">
              {isAr
                ? '3. متغيرات وضع التصوير والزوايا وتوزيع الأفلام'
                : '3. Technique Geometry & Shot Controls'}
            </div>

            {technique === 'panoramic' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <label htmlFor="sim-pano-ecc">
                      {isAr
                        ? 'انحراف تمركز العنكبوت (Δe Off-Center):'
                        : 'Spider Off-Center Shift (Δe):'}
                    </label>
                    <span className="font-mono text-rose-400">{eccentricityMm} mm</span>
                  </div>
                  <input
                    id="sim-pano-ecc"
                    type="range"
                    min={0}
                    max={65}
                    step={1}
                    value={eccentricityMm}
                    onChange={(e) => setEccentricityMm(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <label htmlFor="sim-pano-overlap">
                      {isAr ? 'تداخل حزام الأفلام (Overlap):' : 'Film Belt Overlap:'}
                    </label>
                    <span className="font-mono text-emerald-500">{filmOverlapMm} mm</span>
                  </div>
                  <input
                    id="sim-pano-overlap"
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={filmOverlapMm}
                    onChange={(e) => setFilmOverlapMm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {technique === 'elliptical' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <label htmlFor="sim-ellip-sfd">
                      {isAr ? 'المسافة البؤرية (SFD):' : 'Source-to-Film Distance (SFD):'}
                    </label>
                    <span className="font-mono text-emerald-500">{sfdMm} mm</span>
                  </div>
                  <input
                    id="sim-ellip-sfd"
                    type="range"
                    min={280}
                    max={900}
                    step={10}
                    value={sfdMm}
                    onChange={(e) => setSfdMm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <label htmlFor="sim-ellip-offset">
                      {isAr ? 'الإزاحة المحورية (Axial Offset L):' : 'Axial Source Offset (L):'}
                    </label>
                    <span className="font-mono text-cyan-500">
                      {axialOffsetMm} mm ({ellipGeo.beamTiltDeg}°)
                    </span>
                  </div>
                  <input
                    id="sim-ellip-offset"
                    type="range"
                    min={0}
                    max={250}
                    step={2}
                    value={axialOffsetMm}
                    onChange={(e) => setAxialOffsetMm(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    {isAr ? 'دوران اللقطة (0° / 90°):' : 'Shot Rotation (0° / 90°):'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShotRotationIdx((i) => (i + 1) % 2)}
                    className="flex min-w-0 max-w-[60%] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-start text-xs font-bold text-cyan-400 tabular-nums cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {shotRotationIdx % 2 === 0
                        ? isAr
                          ? 'اللقطة 1 (0°) — اضغط للدوران 90°'
                          : 'Shot 1 (0°) — Rotate 90°'
                        : isAr
                        ? 'اللقطة 2 (90°) — اضغط للعودة 0°'
                        : 'Shot 2 (90°) — Back to 0°'}
                    </span>
                  </button>
                </div>
              </>
            )}

            {technique === 'straight' && (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      {
                        id: 'dwdi_superimposed',
                        ar: 'متطابق ≤3.5"',
                        en: 'DWDI 0°',
                      },
                      {
                        id: 'dwsi_contact',
                        ar: 'ملامس >3.5"',
                        en: 'Contact DWSI',
                      },
                      {
                        id: 'swsi_plate',
                        ar: 'لوح مفتوح',
                        en: 'Flat Plate',
                      },
                    ] as const
                  ).map((sm) => (
                    <button
                      key={sm.id}
                      type="button"
                      onClick={() => {
                        setStraightSubMode(sm.id);
                        setShotRotationIdx(0);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold cursor-pointer ${
                        straightSubMode === sm.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isAr ? sm.ar : sm.en}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <label htmlFor="sim-straight-sfd">
                      {isAr ? 'مسافة المصدر للفيلم (SFD):' : 'Source-to-Film Distance (SFD):'}
                    </label>
                    <span className="font-mono text-emerald-500">
                      {Math.max(
                        straightSubMode === 'dwsi_contact' ? Math.round(pipeOdMm) : 250,
                        sfdMm
                      )}{' '}
                      mm
                    </span>
                  </div>
                  <input
                    id="sim-straight-sfd"
                    type="range"
                    min={straightSubMode === 'dwsi_contact' ? Math.round(pipeOdMm) : 250}
                    max={950}
                    step={10}
                    value={Math.max(
                      straightSubMode === 'dwsi_contact' ? Math.round(pipeOdMm) : 250,
                      sfdMm
                    )}
                    onChange={(e) => setSfdMm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    {isAr ? 'تبديل محطة اللقطة:' : 'Active Exposure Station:'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setShotRotationIdx((i) => (i + 1) % Math.max(1, straightGeo.exposuresRequired))
                    }
                    className="flex min-w-0 max-w-[60%] items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-start text-xs font-bold text-emerald-400 tabular-nums cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 shrink-0" />
                    <span className="min-w-0">{straightGeo.stationMarkersLabel}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Group 4: Film Class & Exposure Time Dynamic Override */}
          <div className="space-y-3 pt-3 border-t border-slate-700/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold">
                {isAr ? '4. نوع الفيلم وزمن التعريض الفعلي' : '4. Film Speed & Exposure Time'}
              </span>
              <button
                type="button"
                onClick={() => setAutoExposureTime((v) => !v)}
                className={`px-2.5 py-1 rounded-md border text-[11px] font-bold cursor-pointer ${
                  autoExposureTime
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                }`}
              >
                {autoExposureTime
                  ? isAr
                    ? 'زمن تلقائي (2.6 H&D)'
                    : 'Auto Time (2.6 H&D)'
                  : isAr
                  ? 'تحكم يدوي بالزمن'
                  : 'Manual Time'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilmClass('class_1_d4')}
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-bold cursor-pointer ${
                  filmClass === 'class_1_d4'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                ASTM Class I (D4)
              </button>
              <button
                type="button"
                onClick={() => setFilmClass('class_2_d7')}
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-bold cursor-pointer ${
                  filmClass === 'class_2_d7'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                ASTM Class II (D7)
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                <label htmlFor="sim-exposure-sec">
                  {isAr ? 'زمن التعريض (ثانية):' : 'Exposure Time (sec):'}
                </label>
                <span className="font-mono text-amber-500">
                  {autoExposureTime ? dynamicMetrics.optimalExposureSec : manualExposureSec} s
                </span>
              </div>
              <input
                id="sim-exposure-sec"
                type="range"
                min={5}
                max={Math.max(300, dynamicMetrics.optimalExposureSec * 2)}
                step={1}
                value={autoExposureTime ? dynamicMetrics.optimalExposureSec : manualExposureSec}
                onChange={(e) => {
                  setAutoExposureTime(false);
                  setManualExposureSec(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Diagnostic Banner */}
          <div className="pt-2 space-y-2">
            {!dynamicMetrics.passesUg && (
              <div className="p-3 rounded-xl border border-rose-500/35 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? `عدم الوضوح الهندسي Ug (${dynamicMetrics.dynamicUgMm} مم) أعلى من الحد المسموح (${dynamicMetrics.maxAllowedUgMm} مم). صغّر حجم البؤرة F أو ارفع SFD.`
                    : `Ug (${dynamicMetrics.dynamicUgMm} mm) exceeds ASME limit (${dynamicMetrics.maxAllowedUgMm} mm). Reduce focal spot F or increase SFD.`}
                </span>
              </div>
            )}

            {!dynamicMetrics.densityInCodeWindow && (
              <div className="p-3 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? `كثافة الفيلم الحالية (${dynamicMetrics.simulatedDensityHd} H&D) خارج نطاق القبول القياسي (2.0–4.0 H&D). عدّل زمن التعريض أو فعّل الضبط التلقائي.`
                    : `Simulated density (${dynamicMetrics.simulatedDensityHd} H&D) is outside ASME 2.0–4.0 H&D range. Adjust exposure time or enable Auto Time.`}
                </span>
              </div>
            )}

            {technique === 'elliptical' && ellipGeo.status !== 'OPTIMAL_OPEN_ELLIPSE' && (
              <div className="p-3 rounded-xl border border-rose-500/35 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{ellipGeo.diagnostics[0]?.[language]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
