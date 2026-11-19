import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Clock,
  Radio,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Printer,
  Calendar,
  Layers,
  Award,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  X,
  History,
  ArrowLeftRight,
  Trash2,
  Copy,
  Check,
  Activity,
  Crosshair
} from 'lucide-react';
import {
  DEFAULT_UNIT_SYSTEM_CHANGE_EVENT,
  GE_APP_UNIT_OVERRIDE_KEY,
  normalizeUnitSystem,
  readDefaultUnitSystem,
  resolveCalculatorInitialUnitSystem,
} from '../../../utils/unitSystemStore';
import { Language } from '../../../types';
import {
  GeSourceType,
  GeFilmId,
  GeMaterialId,
  GeTechniqueGeometry,
  GeExposureInput,
  GeExposureResult,
  GeFilmLoadingMode,
  GeWideLatitudeGoverning,
  GeMultiFilmConfig,
  GE_ISOTOPES,
  GE_STRUCTURIX_FILMS,
  GE_MATERIALS,
  GE_TECHNIQUES,
  calculateGeRadiographicExposure
} from '../../../utils/geExposureTimeEngine';
import {
  generateGeRadiographicExposurePdf,
  GeRadiographicPdfReportData
} from '../../../utils/geRadiographicExposurePdfGenerator';
import { IsotopeDecayCurveChart } from './IsotopeDecayCurveChart';

export type GeUnitSystem = 'metric' | 'imperial';

export interface GeConversionLogEntry {
  id: string;
  timestamp: string;
  fromUnit: GeUnitSystem;
  toUnit: GeUnitSystem;
  thicknessMm: number;
  thicknessInches: number;
  sfdCm: number;
  sfdInches: number;
  sfdFeet: number;
  sourceType: GeSourceType;
  sourceLabel: string;
  calculatedTotalSeconds: number;
  formattedDuration: string;
}

const escapeCsvField = (value: string | number): string => {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const buildConversionLogCsv = (entries: GeConversionLogEntry[]): string => {
  const headers = [
    'Timestamp',
    'From Unit',
    'To Unit',
    'Thickness (mm)',
    'Thickness (in)',
    'SFD (cm)',
    'SFD (in)',
    'SFD (ft)',
    'Source Type',
    'Source Label',
    'Exposure Time (s)',
    'Formatted Duration'
  ];

  const rows = entries.map((entry) => [
    entry.timestamp,
    entry.fromUnit,
    entry.toUnit,
    entry.thicknessMm,
    entry.thicknessInches,
    entry.sfdCm,
    entry.sfdInches,
    entry.sfdFeet,
    entry.sourceType,
    entry.sourceLabel,
    entry.calculatedTotalSeconds,
    entry.formattedDuration
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\n');
};

export interface BeamDecayPoint {
  normX: number;
  physicalDepthMm: number;
  effectiveSteelDepthMm: number;
  intensityPct: number;
  hvlAtDepth: number;
  inCavity: boolean;
}

export interface BeamDecayWallSegment {
  id: 'wall_1' | 'cavity' | 'wall_2' | 'weld_cap';
  labelEn: string;
  labelAr: string;
  startNorm: number;
  endNorm: number;
  physicalThicknessMm: number;
  effectiveSteelThicknessMm: number;
  entryIntensityPct: number;
  exitIntensityPct: number;
}

export interface BeamDecayHvlMarker {
  hvlIndex: number;
  normX: number;
  intensityPct: number;
  steelDepthMm: number;
}

export interface BeamDecayProfile {
  sourceType: GeSourceType;
  materialId: GeMaterialId;
  technique: GeTechniqueGeometry;
  wallsPenetrated: 1 | 2;
  rFactor: number;
  effectiveHvlMm: number;
  materialPhysicalHvlMm: number;
  muSteelPerMm: number;
  muMaterialPerMm: number;
  wallThicknessMm: number;
  weldReinforcementMm: number;
  totalPhysicalThicknessMm: number;
  effectiveSteelThicknessMm: number;
  totalHvlCount: number;
  exitIntensityPct: number;
  attenuationFactor: number;
  wallSegments: BeamDecayWallSegment[];
  hvlMarkers: BeamDecayHvlMarker[];
  points: BeamDecayPoint[];
}

export interface ComputeBeamDecayProfileInput {
  sourceType: GeSourceType;
  materialId: GeMaterialId;
  technique: GeTechniqueGeometry;
  materialThicknessMm: number;
  weldReinforcementMm: number;
  samples?: number;
}

export const computeBeamDecayProfile = ({
  sourceType,
  materialId,
  technique,
  materialThicknessMm,
  weldReinforcementMm,
  samples = 72
}: ComputeBeamDecayProfileInput): BeamDecayProfile => {
  const isotope = GE_ISOTOPES[sourceType];
  const material = GE_MATERIALS[materialId];
  const techSpec = GE_TECHNIQUES[technique];

  const safeThickness = Math.max(0.5, materialThicknessMm);
  const safeWeld = Math.max(0, weldReinforcementMm);

  const rFactor =
    sourceType === 'ir192'
      ? material.rFactorIr192
      : sourceType === 'se75'
        ? material.rFactorSe75
        : sourceType === 'co60'
          ? material.rFactorCo60
          : material.rFactorXray;

  const effectiveHvlMm = isotope.steelHvlMm;
  const materialPhysicalHvlMm = Number((effectiveHvlMm / Math.max(0.05, rFactor)).toFixed(2));
  const muSteelPerMm = Number((Math.LN2 / effectiveHvlMm).toFixed(4));
  const muMaterialPerMm = Number((Math.LN2 / Math.max(0.1, materialPhysicalHvlMm)).toFixed(4));

  const wallsPenetrated = techSpec.wallsPenetrated;
  const wallEqSteel = safeThickness * rFactor;
  const totalPhysicalThicknessMm = Number((safeThickness * wallsPenetrated + safeWeld).toFixed(2));
  const effectiveSteelThicknessMm = Number((wallEqSteel * wallsPenetrated + safeWeld).toFixed(2));
  const totalHvlCount = Number((effectiveSteelThicknessMm / effectiveHvlMm).toFixed(2));
  const exitIntensityPct = Number((100 * Math.pow(0.5, effectiveSteelThicknessMm / effectiveHvlMm)).toFixed(2));
  const attenuationFactor = Number(Math.pow(2, totalHvlCount).toFixed(1));

  const rawSegments: Array<{
    id: BeamDecayWallSegment['id'];
    labelEn: string;
    labelAr: string;
    startNorm: number;
    endNorm: number;
    physicalThicknessMm: number;
    effectiveSteelThicknessMm: number;
  }> = [];

  if (wallsPenetrated === 2) {
    const weldFrac = safeWeld > 0 ? Math.min(0.14, Math.max(0.05, (safeWeld / Math.max(1, effectiveSteelThicknessMm)) * 0.74)) : 0;
    const wallSpan = (0.74 - weldFrac) / 2;
    const cavityStart = wallSpan;
    const cavityEnd = cavityStart + 0.26;
    const wall2End = cavityEnd + wallSpan;

    rawSegments.push({
      id: 'wall_1',
      labelEn: 'Near Wall',
      labelAr: 'الجدار القريب',
      startNorm: 0,
      endNorm: cavityStart,
      physicalThicknessMm: safeThickness,
      effectiveSteelThicknessMm: wallEqSteel
    });
    rawSegments.push({
      id: 'cavity',
      labelEn: 'Pipe Bore (Air)',
      labelAr: 'تجويف الماسورة',
      startNorm: cavityStart,
      endNorm: cavityEnd,
      physicalThicknessMm: 0,
      effectiveSteelThicknessMm: 0
    });
    rawSegments.push({
      id: 'wall_2',
      labelEn: 'Far Wall',
      labelAr: 'الجدار البعيد',
      startNorm: cavityEnd,
      endNorm: wall2End,
      physicalThicknessMm: safeThickness,
      effectiveSteelThicknessMm: wallEqSteel
    });
    if (safeWeld > 0) {
      rawSegments.push({
        id: 'weld_cap',
        labelEn: 'Weld Cap',
        labelAr: 'تاج اللحام',
        startNorm: wall2End,
        endNorm: 1,
        physicalThicknessMm: safeWeld,
        effectiveSteelThicknessMm: safeWeld
      });
    }
  } else {
    const wallFrac = safeWeld > 0 ? Math.max(0.72, wallEqSteel / Math.max(0.01, wallEqSteel + safeWeld)) : 1;
    rawSegments.push({
      id: 'wall_1',
      labelEn: 'Specimen Wall',
      labelAr: 'جدار العينة',
      startNorm: 0,
      endNorm: wallFrac,
      physicalThicknessMm: safeThickness,
      effectiveSteelThicknessMm: wallEqSteel
    });
    if (safeWeld > 0) {
      rawSegments.push({
        id: 'weld_cap',
        labelEn: 'Weld Cap',
        labelAr: 'تاج اللحام',
        startNorm: wallFrac,
        endNorm: 1,
        physicalThicknessMm: safeWeld,
        effectiveSteelThicknessMm: safeWeld
      });
    }
  }

  let runningPhys = 0;
  let runningSteel = 0;
  const wallSegments: BeamDecayWallSegment[] = rawSegments.map((seg) => {
    const entryIntensityPct = Number((100 * Math.pow(0.5, runningSteel / effectiveHvlMm)).toFixed(2));
    runningPhys += seg.physicalThicknessMm;
    runningSteel += seg.effectiveSteelThicknessMm;
    const segExitIntensityPct = Number((100 * Math.pow(0.5, runningSteel / effectiveHvlMm)).toFixed(2));
    return {
      ...seg,
      entryIntensityPct,
      exitIntensityPct: segExitIntensityPct
    };
  });

  const evaluateAtNorm = (normX: number): BeamDecayPoint => {
    const clamped = Math.max(0, Math.min(1, normX));
    let cumPhys = 0;
    let cumSteel = 0;
    let inCavity = false;

    for (const seg of wallSegments) {
      if (clamped <= seg.endNorm || seg === wallSegments[wallSegments.length - 1]) {
        const span = Math.max(1e-6, seg.endNorm - seg.startNorm);
        const localT = Math.max(0, Math.min(1, (clamped - seg.startNorm) / span));
        cumPhys += seg.physicalThicknessMm * localT;
        cumSteel += seg.effectiveSteelThicknessMm * localT;
        inCavity = seg.id === 'cavity' && clamped > seg.startNorm && clamped < seg.endNorm;
        break;
      }
      cumPhys += seg.physicalThicknessMm;
      cumSteel += seg.effectiveSteelThicknessMm;
    }

    const hvlAtDepth = cumSteel / effectiveHvlMm;
    const intensityPct = 100 * Math.pow(0.5, hvlAtDepth);
    return {
      normX: Number(clamped.toFixed(4)),
      physicalDepthMm: Number(cumPhys.toFixed(2)),
      effectiveSteelDepthMm: Number(cumSteel.toFixed(2)),
      intensityPct: Number(intensityPct.toFixed(2)),
      hvlAtDepth: Number(hvlAtDepth.toFixed(2)),
      inCavity
    };
  };

  // Sample curve densely plus exact segment boundary vertices for crisp corners across pipe bore
  const normSet = new Set<number>();
  for (let i = 0; i <= samples; i++) {
    normSet.add(Number((i / samples).toFixed(4)));
  }
  wallSegments.forEach((seg) => {
    normSet.add(Number(seg.startNorm.toFixed(4)));
    normSet.add(Number(seg.endNorm.toFixed(4)));
  });

  const sortedNorms = Array.from(normSet).sort((a, b) => a - b);
  const points: BeamDecayPoint[] = sortedNorms.map(evaluateAtNorm);

  // Locate exact HVL crossing coordinates along solid segments
  const hvlMarkers: BeamDecayHvlMarker[] = [];
  const maxMarkerCount = Math.min(8, Math.floor(totalHvlCount));
  for (let h = 1; h <= maxMarkerCount; h++) {
    const targetSteel = h * effectiveHvlMm;
    let steelBefore = 0;
    for (const seg of wallSegments) {
      const steelAfter = steelBefore + seg.effectiveSteelThicknessMm;
      if (seg.effectiveSteelThicknessMm > 0 && targetSteel >= steelBefore - 1e-6 && targetSteel <= steelAfter + 1e-6) {
        const frac = (targetSteel - steelBefore) / seg.effectiveSteelThicknessMm;
        const markerNormX = seg.startNorm + frac * (seg.endNorm - seg.startNorm);
        hvlMarkers.push({
          hvlIndex: h,
          normX: Number(markerNormX.toFixed(4)),
          intensityPct: Number((100 * Math.pow(0.5, h)).toFixed(2)),
          steelDepthMm: Number(targetSteel.toFixed(1))
        });
        break;
      }
      steelBefore = steelAfter;
    }
  }

  return {
    sourceType,
    materialId,
    technique,
    wallsPenetrated,
    rFactor,
    effectiveHvlMm,
    materialPhysicalHvlMm,
    muSteelPerMm,
    muMaterialPerMm,
    wallThicknessMm: safeThickness,
    weldReinforcementMm: safeWeld,
    totalPhysicalThicknessMm,
    effectiveSteelThicknessMm,
    totalHvlCount,
    exitIntensityPct,
    attenuationFactor,
    wallSegments,
    hvlMarkers,
    points
  };
};

export const interpolateBeamDecayAtNorm = (profile: BeamDecayProfile, normX: number): BeamDecayPoint => {
  const clamped = Math.max(0, Math.min(1, normX));
  let cumPhys = 0;
  let cumSteel = 0;
  let inCavity = false;

  for (const seg of profile.wallSegments) {
    if (clamped <= seg.endNorm || seg === profile.wallSegments[profile.wallSegments.length - 1]) {
      const span = Math.max(1e-6, seg.endNorm - seg.startNorm);
      const localT = Math.max(0, Math.min(1, (clamped - seg.startNorm) / span));
      cumPhys += seg.physicalThicknessMm * localT;
      cumSteel += seg.effectiveSteelThicknessMm * localT;
      inCavity = seg.id === 'cavity' && clamped > seg.startNorm && clamped < seg.endNorm;
      break;
    }
    cumPhys += seg.physicalThicknessMm;
    cumSteel += seg.effectiveSteelThicknessMm;
  }

  const hvlAtDepth = cumSteel / profile.effectiveHvlMm;
  const intensityPct = 100 * Math.pow(0.5, hvlAtDepth);
  return {
    normX: Number(clamped.toFixed(4)),
    physicalDepthMm: Number(cumPhys.toFixed(2)),
    effectiveSteelDepthMm: Number(cumSteel.toFixed(2)),
    intensityPct: Number(intensityPct.toFixed(2)),
    hvlAtDepth: Number(hvlAtDepth.toFixed(2)),
    inCavity
  };
};

export type GeConversionFormulaKind =
  | 'quick_thickness'
  | 'quick_sfd'
  | 'thickness'
  | 'reinforcement'
  | 'sfd'
  | 'pipe_od';

export interface GeConversionFormulaOptions {
  kind: GeConversionFormulaKind;
  unitSystem: GeUnitSystem;
  isAr: boolean;
  metricValue: number;
  imperialValue: number;
  secondaryImperialValue?: number;
}

export const getUnitConversionFormula = ({
  kind,
  unitSystem,
  isAr,
  metricValue,
  imperialValue,
  secondaryImperialValue = 0
}: GeConversionFormulaOptions): string => {
  if (kind === 'quick_thickness') {
    if (unitSystem === 'imperial') {
      return isAr
        ? `1 بوصة = 25.4 مم · المعادلة: ${imperialValue} بوصة × 25.4 = ${metricValue.toFixed(1)} مم`
        : `1 in = 25.4 mm · Math: ${imperialValue} in × 25.4 = ${metricValue.toFixed(1)} mm`;
    }
    return isAr
      ? `1 بوصة = 25.4 مم · المعادلة: ${metricValue.toFixed(1)} مم ÷ 25.4 = ${imperialValue} بوصة`
      : `1 in = 25.4 mm · Math: ${metricValue.toFixed(1)} mm ÷ 25.4 = ${imperialValue} in`;
  }

  if (kind === 'quick_sfd') {
    if (unitSystem === 'imperial') {
      return isAr
        ? `1 بوصة = 2.54 سم، 1 قدم = 30.48 سم · المعادلة: ${imperialValue} بوصة × 2.54 = ${metricValue} سم (${secondaryImperialValue} قدم × 30.48)`
        : `1 in = 2.54 cm, 1 ft = 30.48 cm · Math: ${imperialValue} in × 2.54 = ${metricValue} cm (${secondaryImperialValue} ft × 30.48)`;
    }
    return isAr
      ? `1 بوصة = 2.54 سم، 1 قدم = 30.48 سم · المعادلة: ${metricValue} سم ÷ 2.54 = ${imperialValue} بوصة (${secondaryImperialValue} قدم)`
      : `1 in = 2.54 cm, 1 ft = 30.48 cm · Math: ${metricValue} cm ÷ 2.54 = ${imperialValue} in (${secondaryImperialValue} ft)`;
  }

  if (kind === 'sfd') {
    if (unitSystem === 'imperial') {
      return isAr
        ? `1 بوصة = 2.54 سم | 1 قدم = 12 بوصة = 30.48 سم (الحالي: ${imperialValue} in / ${secondaryImperialValue} ft ← ${metricValue} cm)`
        : `1 inch = 2.54 cm · 1 ft = 12 in = 30.48 cm (Live: ${imperialValue} in / ${secondaryImperialValue} ft → ${metricValue} cm in Inverse Square Law)`;
    }
    return isAr
      ? `1 سم = 0.3937 بوصة | 1 بوصة = 2.54 سم | 1 قدم = 30.48 سم (الحالي: ${metricValue} cm = ${imperialValue} in / ${secondaryImperialValue} ft)`
      : `1 cm = 0.3937 in · 1 inch = 2.54 cm · 1 ft = 30.48 cm (Live: ${metricValue} cm = ${imperialValue} in / ${secondaryImperialValue} ft)`;
  }

  if (kind === 'reinforcement') {
    if (unitSystem === 'imperial') {
      return isAr
        ? `1 بوصة = 25.4 مم (الحالي: ${imperialValue} in ← ${metricValue.toFixed(1)} mm)`
        : `1 inch = 25.4 mm (Live: ${imperialValue} in → ${metricValue.toFixed(1)} mm added to wall)`;
    }
    return isAr
      ? `1 مم = 0.0394 بوصة | 1 بوصة = 25.4 مم (الحالي: ${metricValue} mm = ${imperialValue} in)`
      : `1 mm = 0.0394 in · 1 inch = 25.4 mm (Live: ${metricValue} mm = ${imperialValue} in)`;
  }

  if (kind === 'pipe_od') {
    if (unitSystem === 'imperial') {
      return isAr
        ? `1 بوصة = 25.4 مم (الحالي: ${imperialValue} in ← ${metricValue} mm)`
        : `1 inch = 25.4 mm (Live: ${imperialValue} in → ${metricValue} mm used for Ug & beam path)`;
    }
    return isAr
      ? `1 مم = 0.0394 بوصة | 1 بوصة = 25.4 مم (الحالي: ${metricValue} mm = ${imperialValue} in)`
      : `1 mm = 0.0394 in · 1 inch = 25.4 mm (Live: ${metricValue} mm = ${imperialValue} in)`;
  }

  // Default: 'thickness'
  if (unitSystem === 'imperial') {
    return isAr
      ? `1 بوصة = 25.4 مم (الحالي: ${imperialValue} in ← ${metricValue.toFixed(1)} mm في معادلة التوهين)`
      : `1 inch = 25.4 mm (Live: ${imperialValue} in → ${metricValue.toFixed(1)} mm used in physics engine)`;
  }
  return isAr
    ? `1 مم = 0.0394 بوصة | 1 بوصة = 25.4 مم (الحالي: ${metricValue} mm = ${imperialValue} in)`
    : `1 mm = 0.0394 in · 1 inch = 25.4 mm (Live: ${metricValue} mm = ${imperialValue} in)`;
};

interface UnitConversionTooltipProps {
  tooltipText: string;
  testId: string;
  isAr: boolean;
}

const UnitConversionTooltip: React.FC<UnitConversionTooltipProps> = ({ tooltipText, testId, isAr }) => {
  const [pinnedOpen, setPinnedOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center group/tip">
      <button
        type="button"
        data-testid={testId}
        title={tooltipText}
        aria-label={tooltipText}
        aria-expanded={pinnedOpen}
        onClick={() => setPinnedOpen((prev) => !prev)}
        onBlur={() => setPinnedOpen(false)}
        className="inline-flex items-center justify-center p-0.5 rounded-full text-slate-400 hover:text-amber-500 focus:text-amber-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 transition cursor-help"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      <span
        role="tooltip"
        data-testid={`${testId}-content`}
        className={`pointer-events-none absolute bottom-full mb-2 ${
          isAr ? 'right-0' : 'left-0'
        } z-40 w-64 rounded-xl bg-slate-900 dark:bg-slate-800 text-slate-100 border border-slate-700 px-3 py-2 text-[11px] leading-snug font-mono shadow-xl transition-all duration-150 ${
          pinnedOpen
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible translate-y-1 group-hover/tip:opacity-100 group-hover/tip:visible group-hover/tip:translate-y-0 group-focus-within/tip:opacity-100 group-focus-within/tip:visible group-focus-within/tip:translate-y-0'
        }`}
      >
        <span className="block font-bold text-amber-400 mb-0.5">
          {isAr ? 'تحويل الوحدات النشط:' : 'Active Unit Conversion:'}
        </span>
        <span>{tooltipText}</span>
      </span>
    </span>
  );
};

interface UnitConversionSparklineProps {
  entries: GeConversionLogEntry[];
  unitSystem: GeUnitSystem;
  isAr: boolean;
}

const UnitConversionSparkline: React.FC<UnitConversionSparklineProps> = ({
  entries,
  unitSystem,
  isAr
}) => {
  const width = 84;
  const height = 24;

  const {
    points,
    linePath,
    areaPath,
    metricCount,
    imperialCount
  } = useMemo(() => {
    const recent = [...entries.slice(0, 5)].reverse();
    const mCount = recent.filter((e) => e.toUnit === 'metric').length;
    const iCount = recent.filter((e) => e.toUnit === 'imperial').length;

    if (recent.length === 0) {
      return {
        points: [] as Array<{ x: number; y: number; entry: GeConversionLogEntry }>,
        linePath: '',
        areaPath: '',
        metricCount: 0,
        imperialCount: 0
      };
    }

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(recent.length - 1, 1)])
      .range(recent.length === 1 ? [width / 2, width / 2] : [6, width - 6]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - 5, 5]);

    const mapped = recent.map((entry, idx) => ({
      x: xScale(idx),
      y: yScale(entry.toUnit === 'imperial' ? 1 : 0),
      entry
    }));

    const lineGenerator = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<{ x: number; y: number }>()
      .x((d) => d.x)
      .y0(height - 3)
      .y1((d) => d.y)
      .curve(d3.curveMonotoneX);

    return {
      points: mapped,
      linePath: mapped.length > 1 ? lineGenerator(mapped) || '' : '',
      areaPath: mapped.length > 1 ? areaGenerator(mapped) || '' : '',
      metricCount: mCount,
      imperialCount: iCount
    };
  }, [entries]);

  const strokeColor = unitSystem === 'metric' ? '#0ea5e9' : '#f59e0b';

  return (
    <div
      data-testid="ge-quick-units-sparkline"
      title={
        isAr
          ? `اتجاه آخر 5 تحويلات: متري (${metricCount}) مقابل إمبراطوري (${imperialCount})`
          : `Last 5 conversion switches trend: Metric (${metricCount}) vs Imperial (${imperialCount})`
      }
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 text-[10px] font-mono"
    >
      <TrendingUp
        className={`w-3 h-3 shrink-0 ${
          unitSystem === 'metric' ? 'text-sky-500' : 'text-amber-500'
        }`}
        aria-hidden="true"
      />
      <svg
        data-testid="ge-quick-units-sparkline-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          isAr
            ? `مخطط خطي لتكرار التحويلات: ${metricCount} متري و ${imperialCount} إمبراطوري`
            : `Conversion trend sparkline: ${metricCount} Metric and ${imperialCount} Imperial switches`
        }
        className="overflow-visible shrink-0"
      >
        <line
          x1={4}
          y1={height / 2}
          x2={width - 4}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeDasharray="2 2"
          strokeWidth={1}
        />
        {areaPath && (
          <path
            d={areaPath}
            fill={strokeColor}
            fillOpacity={0.16}
          />
        )}
        {linePath && (
          <path
            data-testid="ge-quick-units-sparkline-path"
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        )}
        {points.map((pt, idx) => (
          <circle
            key={pt.entry.id}
            data-testid={`ge-quick-units-sparkline-point-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={pt.entry.toUnit === 'metric' ? '#0ea5e9' : '#f59e0b'}
            stroke="#0f172a"
            strokeWidth={1}
          >
            <title>
              {`${pt.entry.fromUnit === 'metric' ? 'mm/cm' : 'in/ft'} → ${
                pt.entry.toUnit === 'metric' ? 'mm/cm' : 'in/ft'
              } (${pt.entry.timestamp})`}
            </title>
          </circle>
        ))}
      </svg>
      <span
        data-testid="ge-quick-units-sparkline-summary"
        className="flex items-center gap-1 font-bold tabular-nums whitespace-nowrap"
      >
        <span className="text-sky-600 dark:text-sky-400">
          {isAr ? `م:${metricCount}` : `M:${metricCount}`}
        </span>
        <span className="text-slate-400">/</span>
        <span className="text-amber-600 dark:text-amber-400">
          {isAr ? `إ:${imperialCount}` : `I:${imperialCount}`}
        </span>
      </span>
    </div>
  );
};

interface GeRadiographicExposureTimeAppProps {
  language: Language;
  onApplyTimeToLab?: (seconds: number) => void;
  onClose?: () => void;
  className?: string;
  initialSource?: GeSourceType;
  initialThicknessMm?: number;
  initialSfdCm?: number;
}

export const GeRadiographicExposureTimeApp: React.FC<GeRadiographicExposureTimeAppProps> = ({
  language,
  onApplyTimeToLab,
  onClose,
  className = '',
  initialSource = 'ir192',
  initialThicknessMm = 12.0,
  initialSfdCm = 70
}) => {
  const isAr = language === 'ar';

  // Measurement Unit System (Metric: mm/cm, Imperial: in/ft)
  const [unitSystem, setUnitSystem] = useState<GeUnitSystem>(() =>
    resolveCalculatorInitialUnitSystem(GE_APP_UNIT_OVERRIDE_KEY)
  );

  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GE_APP_UNIT_OVERRIDE_KEY, unitSystem);
      }
    } catch {
      // ignore
    }
  }, [unitSystem]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleGlobalDefaultChange = (event: Event) => {
      const custom = event as CustomEvent<GeUnitSystem>;
      const next = custom.detail ? normalizeUnitSystem(custom.detail) : readDefaultUnitSystem();
      setUnitSystem(next);
    };
    window.addEventListener(DEFAULT_UNIT_SYSTEM_CHANGE_EVENT, handleGlobalDefaultChange);
    return () => {
      window.removeEventListener(DEFAULT_UNIT_SYSTEM_CHANGE_EVENT, handleGlobalDefaultChange);
    };
  }, []);

  // Conversion Log (records the last 5 conversions when switching Metric <-> Imperial)
  const [conversionLog, setConversionLog] = useState<GeConversionLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('ge_app_conversion_log');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5);
        }
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [showConversionLog, setShowConversionLog] = useState<boolean>(false);
  const [showQuickUnitsHistory, setShowQuickUnitsHistory] = useState<boolean>(false);
  const unitTogglerRef = useRef<HTMLDivElement | null>(null);
  const quickUnitsHistoryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showConversionLog) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (unitTogglerRef.current && !unitTogglerRef.current.contains(event.target as Node)) {
        setShowConversionLog(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showConversionLog]);

  useEffect(() => {
    if (!showQuickUnitsHistory) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (quickUnitsHistoryRef.current && !quickUnitsHistoryRef.current.contains(event.target as Node)) {
        setShowQuickUnitsHistory(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showQuickUnitsHistory]);

  // Calculator Inputs
  const [sourceType, setSourceType] = useState<GeSourceType>(initialSource);
  const [materialId, setMaterialId] = useState<GeMaterialId>('carbon_steel');
  const [filmId, setFilmId] = useState<GeFilmId>('d7');
  const [technique, setTechnique] = useState<GeTechniqueGeometry>('dwsi_contact');

  // Multi-Film Loading Configuration (ASME Section V T-282.1 / Wide-Latitude)
  const [filmLoadingMode, setFilmLoadingMode] = useState<GeFilmLoadingMode>('single');
  const [secondaryFilmId, setSecondaryFilmId] = useState<GeFilmId>('d7');
  const [hasInterleafScreen, setHasInterleafScreen] = useState<boolean>(false);
  const [wideLatitudeGov, setWideLatitudeGov] = useState<GeWideLatitudeGoverning>('primary_film');

  // Recent Sources tracking (tracks last 3 selected sources)
  const [recentSources, setRecentSources] = useState<GeSourceType[]>(() => {
    try {
      const stored = localStorage.getItem('ge_app_recent_sources');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validSources: GeSourceType[] = parsed.filter((s: any) => s in GE_ISOTOPES);
          if (validSources.length > 0) {
            return validSources.slice(0, 3);
          }
        }
      }
    } catch {
      // ignore
    }
    return ['ir192', 'se75', 'xray_dir'];
  });

  const selectAndTrackSource = (src: GeSourceType) => {
    setSourceType(src);
    setRecentSources((prev) => {
      const updated = [src, ...prev.filter((s) => s !== src)].slice(0, 3);
      try {
        localStorage.setItem('ge_app_recent_sources', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const [materialThicknessMm, setMaterialThicknessMm] = useState<number>(initialThicknessMm);
  const [weldReinforcementMm, setWeldReinforcementMm] = useState<number>(2.5);
  const [sfdCm, setSfdCm] = useState<number>(initialSfdCm);
  const [pipeOuterDiameterMm, setPipeOuterDiameterMm] = useState<number>(114.3); // 4" pipe

  // Imperial unit conversion getters and helpers
  const thicknessInches = Number((materialThicknessMm / 25.4).toFixed(3));
  const reinforcementInches = Number((weldReinforcementMm / 25.4).toFixed(3));
  const sfdInches = Number((sfdCm / 2.54).toFixed(1));
  const sfdFeet = Number((sfdCm / 30.48).toFixed(2));
  const pipeOdInches = Number((pipeOuterDiameterMm / 25.4).toFixed(2));

  // Handlers for Imperial input edits (which automatically update metric state & triggers calculations)
  const handleThicknessChangeInches = (valIn: number) => {
    const clamped = Math.max(0.08, Math.min(3.5, valIn));
    setMaterialThicknessMm(Number((clamped * 25.4).toFixed(2)));
  };

  const handleReinforcementChangeInches = (valIn: number) => {
    const clamped = Math.max(0, Math.min(0.25, valIn));
    setWeldReinforcementMm(Number((clamped * 25.4).toFixed(2)));
  };

  const handleSfdChangeInches = (valIn: number) => {
    const clamped = Math.max(10, Math.min(60, valIn));
    setSfdCm(Math.round(clamped * 2.54));
  };

  const handlePipeOdChangeInches = (valIn: number) => {
    const clamped = Math.max(1.0, Math.min(14.0, valIn));
    setPipeOuterDiameterMm(Number((clamped * 25.4).toFixed(1)));
  };

  // Source Activity & Decay Inputs
  const [initialActivityCi, setInitialActivityCi] = useState<number>(45);
  // Default calibration date 30 days prior for realistic decay
  const [initialCalibrationDate, setInitialCalibrationDate] = useState<string>('2026-10-06');
  const [measurementDate, setMeasurementDate] = useState<string>('2026-11-05');

  // X-Ray Specifics
  const [tubeKv, setTubeKv] = useState<number>(220);
  const [tubeMa, setTubeMa] = useState<number>(4.0);

  // Quality & Setup
  const [targetOpticalDensity, setTargetOpticalDensity] = useState<number>(2.5);
  const [hasLeadScreens, setHasLeadScreens] = useState<boolean>(true);
  const [hasCollimator, setHasCollimator] = useState<boolean>(true);

  // Active Timer State
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isTimerCompleted, setIsTimerCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Technique Card Modal
  const [showTechniqueSheetModal, setShowTechniqueSheetModal] = useState<boolean>(false);

  // PDF Report Export State
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Interactive Scrub Probe along Live Beam Intensity Decay Overlay
  const [beamHoverNormX, setBeamHoverNormX] = useState<number | null>(null);

  // Audio tone helper
  const playBeep = (freq: number = 880, durationMs: number = 180) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio not permitted or running in test environment
    }
  };

  // Compute Results dynamically
  const calcResult: GeExposureResult = useMemo(() => {
    const multiFilmConfig: GeMultiFilmConfig = {
      mode: filmLoadingMode,
      primaryFilmId: filmId,
      secondaryFilmId: filmLoadingMode !== 'single' ? secondaryFilmId : undefined,
      hasInterleafLeadScreen: hasInterleafScreen,
      wideLatitudeGoverning: wideLatitudeGov
    };

    const input: GeExposureInput = {
      sourceType,
      materialId,
      filmId,
      technique,
      materialThicknessMm,
      weldReinforcementMm,
      sfdCm,
      pipeOuterDiameterMm: technique.includes('dw') || technique === 'swsi_panoramic' ? pipeOuterDiameterMm : undefined,
      initialActivityCi,
      initialCalibrationDate,
      measurementDate,
      tubeKv,
      tubeMa,
      targetOpticalDensity,
      hasLeadScreens,
      hasCollimator,
      multiFilmConfig
    };
    return calculateGeRadiographicExposure(input);
  }, [
    sourceType,
    materialId,
    filmId,
    technique,
    materialThicknessMm,
    weldReinforcementMm,
    sfdCm,
    pipeOuterDiameterMm,
    initialActivityCi,
    initialCalibrationDate,
    measurementDate,
    tubeKv,
    tubeMa,
    targetOpticalDensity,
    hasLeadScreens,
    hasCollimator,
    filmLoadingMode,
    secondaryFilmId,
    hasInterleafScreen,
    wideLatitudeGov
  ]);

  // Live Beer-Lambert / HVL Beam Intensity Decay Profile along the Exposure Path
  const beamDecayProfile: BeamDecayProfile = useMemo(() => {
    return computeBeamDecayProfile({
      sourceType,
      materialId,
      technique,
      materialThicknessMm,
      weldReinforcementMm
    });
  }, [sourceType, materialId, technique, materialThicknessMm, weldReinforcementMm]);

  const beamDecayProbePoint: BeamDecayPoint | null = useMemo(() => {
    if (beamHoverNormX === null) return null;
    return interpolateBeamDecayAtNorm(beamDecayProfile, beamHoverNormX);
  }, [beamDecayProfile, beamHoverNormX]);

  const toggleUnitSystem = (targetUnit: GeUnitSystem) => {
    if (targetUnit !== unitSystem) {
      const entry: GeConversionLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        fromUnit: unitSystem,
        toUnit: targetUnit,
        thicknessMm: Number(materialThicknessMm.toFixed(1)),
        thicknessInches,
        sfdCm,
        sfdInches,
        sfdFeet,
        sourceType,
        sourceLabel: GE_ISOTOPES[sourceType].chemicalSymbol,
        calculatedTotalSeconds: calcResult.calculatedTotalSeconds,
        formattedDuration: calcResult.formattedDuration
      };

      setConversionLog((prev) => {
        const updated = [entry, ...prev].slice(0, 5);
        try {
          localStorage.setItem('ge_app_conversion_log', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }

    setUnitSystem(targetUnit);
  };

  const handleClearConversionLog = () => {
    setConversionLog([]);
    try {
      localStorage.removeItem('ge_app_conversion_log');
    } catch {
      // ignore
    }
  };

  const handleRestoreConversionEntry = (entry: GeConversionLogEntry) => {
    setMaterialThicknessMm(entry.thicknessMm);
    setSfdCm(entry.sfdCm);
    setUnitSystem(entry.toUnit);
    setShowConversionLog(false);
    setShowQuickUnitsHistory(false);
  };

  const [resetConfirmed, setResetConfirmed] = useState<boolean>(false);
  const [unitsResetConfirmed, setUnitsResetConfirmed] = useState<boolean>(false);
  const [csvExportedConfirmed, setCsvExportedConfirmed] = useState<boolean>(false);
  const [copiedUnitsConfirmed, setCopiedUnitsConfirmed] = useState<boolean>(false);
  const [unitTransitionPulse, setUnitTransitionPulse] = useState<boolean>(false);
  const unitsResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const csvExportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyUnitsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unitTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUnitSystemRef = useRef<GeUnitSystem>(unitSystem);

  useEffect(() => {
    if (prevUnitSystemRef.current !== unitSystem) {
      prevUnitSystemRef.current = unitSystem;
      setUnitTransitionPulse(true);
      if (unitTransitionTimeoutRef.current) {
        clearTimeout(unitTransitionTimeoutRef.current);
      }
      unitTransitionTimeoutRef.current = setTimeout(() => setUnitTransitionPulse(false), 550);
    }
  }, [unitSystem]);

  useEffect(() => {
    return () => {
      if (unitsResetTimeoutRef.current) {
        clearTimeout(unitsResetTimeoutRef.current);
      }
      if (csvExportTimeoutRef.current) {
        clearTimeout(csvExportTimeoutRef.current);
      }
      if (copyUnitsTimeoutRef.current) {
        clearTimeout(copyUnitsTimeoutRef.current);
      }
      if (unitTransitionTimeoutRef.current) {
        clearTimeout(unitTransitionTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyQuickUnits = async () => {
    const formattedText =
      unitSystem === 'metric'
        ? `Thickness (t): ${materialThicknessMm.toFixed(1)} mm · SFD: ${sfdCm} cm`
        : `Thickness (t): ${thicknessInches}" · SFD: ${sfdInches}" (${sfdFeet} ft)`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(formattedText);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = formattedText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand?.('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // ignore in restricted environments
    }

    setCopiedUnitsConfirmed(true);
    if (copyUnitsTimeoutRef.current) {
      clearTimeout(copyUnitsTimeoutRef.current);
    }
    copyUnitsTimeoutRef.current = setTimeout(() => setCopiedUnitsConfirmed(false), 2000);
  };

  const handleExportConversionLogCsv = () => {
    if (conversionLog.length === 0) return;
    const csvContent = buildConversionLogCsv(conversionLog);
    const filename = `ge-conversion-log-${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    } catch {
      // ignore in restricted environments
    }

    setCsvExportedConfirmed(true);
    if (csvExportTimeoutRef.current) {
      clearTimeout(csvExportTimeoutRef.current);
    }
    csvExportTimeoutRef.current = setTimeout(() => setCsvExportedConfirmed(false), 2000);
  };

  const handleResetUnitsOnly = () => {
    const savedUnitSystem = resolveCalculatorInitialUnitSystem(GE_APP_UNIT_OVERRIDE_KEY);

    setUnitSystem(savedUnitSystem);
    setMaterialThicknessMm(initialThicknessMm);
    setWeldReinforcementMm(2.5);
    setSfdCm(initialSfdCm);
    setPipeOuterDiameterMm(114.3);
    setShowQuickUnitsHistory(false);

    setUnitsResetConfirmed(true);
    if (unitsResetTimeoutRef.current) {
      clearTimeout(unitsResetTimeoutRef.current);
    }
    unitsResetTimeoutRef.current = setTimeout(() => setUnitsResetConfirmed(false), 2000);
  };

  const handleResetAllInputs = () => {
    setUnitSystem(readDefaultUnitSystem());
    setShowConversionLog(false);
    setShowQuickUnitsHistory(false);

    setSourceType(initialSource);
    setMaterialId('carbon_steel');
    setFilmId('d7');
    setTechnique('dwsi_contact');

    setFilmLoadingMode('single');
    setSecondaryFilmId('d7');
    setHasInterleafScreen(false);
    setWideLatitudeGov('primary_film');

    setMaterialThicknessMm(initialThicknessMm);
    setWeldReinforcementMm(2.5);
    setSfdCm(initialSfdCm);
    setPipeOuterDiameterMm(114.3);

    setInitialActivityCi(45);
    setInitialCalibrationDate('2026-10-06');
    setMeasurementDate('2026-11-05');

    setTubeKv(220);
    setTubeMa(4.0);

    setTargetOpticalDensity(2.5);
    setHasLeadScreens(true);
    setHasCollimator(true);

    setIsTimerRunning(false);
    setIsTimerCompleted(false);
    setShowTechniqueSheetModal(false);

    setResetConfirmed(true);
    setTimeout(() => setResetConfirmed(false), 2000);
  };

  // Dynamic visual indicator tokens for all input fields based on active unit system
  const unitInputBorderClass =
    unitSystem === 'metric'
      ? 'border-sky-400/80 dark:border-sky-500/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors'
      : 'border-amber-400/90 dark:border-amber-500/70 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors';
  const unitRangeAccentClass =
    unitSystem === 'metric' ? 'accent-sky-500' : 'accent-amber-500';
  const unitTagClass =
    unitSystem === 'metric'
      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40'
      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40';

  // Dynamic conversion formula strings derived from active unit system & live dimensions
  const conversionFormulas = useMemo(() => ({
    quickThickness: getUnitConversionFormula({
      kind: 'quick_thickness',
      unitSystem,
      isAr,
      metricValue: materialThicknessMm,
      imperialValue: thicknessInches
    }),
    quickSfd: getUnitConversionFormula({
      kind: 'quick_sfd',
      unitSystem,
      isAr,
      metricValue: sfdCm,
      imperialValue: sfdInches,
      secondaryImperialValue: sfdFeet
    }),
    thickness: getUnitConversionFormula({
      kind: 'thickness',
      unitSystem,
      isAr,
      metricValue: materialThicknessMm,
      imperialValue: thicknessInches
    }),
    reinforcement: getUnitConversionFormula({
      kind: 'reinforcement',
      unitSystem,
      isAr,
      metricValue: weldReinforcementMm,
      imperialValue: reinforcementInches
    }),
    sfd: getUnitConversionFormula({
      kind: 'sfd',
      unitSystem,
      isAr,
      metricValue: sfdCm,
      imperialValue: sfdInches,
      secondaryImperialValue: sfdFeet
    }),
    pipeOd: getUnitConversionFormula({
      kind: 'pipe_od',
      unitSystem,
      isAr,
      metricValue: pipeOuterDiameterMm,
      imperialValue: pipeOdInches
    })
  }), [
    unitSystem,
    isAr,
    materialThicknessMm,
    thicknessInches,
    weldReinforcementMm,
    reinforcementInches,
    sfdCm,
    sfdInches,
    sfdFeet,
    pipeOuterDiameterMm,
    pipeOdInches
  ]);

  // Sync initial timer duration when calculated seconds update and timer is idle
  useEffect(() => {
    if (!isTimerRunning && !isTimerCompleted) {
      setTimerSecondsLeft(calcResult.calculatedTotalSeconds);
    }
  }, [calcResult.calculatedTotalSeconds, isTimerRunning, isTimerCompleted]);

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setIsTimerRunning(false);
          setIsTimerCompleted(true);
          playBeep(1200, 600); // Completion sound
          return 0;
        }
        if (prev <= 5) {
          playBeep(700, 100); // Beep during last 5 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, soundEnabled]);

  const handleStartTimer = () => {
    if (timerSecondsLeft <= 0) {
      setTimerSecondsLeft(calcResult.calculatedTotalSeconds);
    }
    setIsTimerCompleted(false);
    setIsTimerRunning(true);
    playBeep(440, 250);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerCompleted(false);
    setTimerSecondsLeft(calcResult.calculatedTotalSeconds);
  };

  // Quick Preset Loader
  const loadPreset = (presetKey: 'pipe_2in_ir' | 'pipe_6in_ir' | 'plate_se75' | 'vessel_co60' | 'tube_xray') => {
    if (presetKey === 'pipe_2in_ir') {
      selectAndTrackSource('ir192');
      setTechnique('dwdi_elliptical');
      setMaterialThicknessMm(5.5);
      setPipeOuterDiameterMm(60.3); // 2" OD
      setWeldReinforcementMm(2.0);
      setSfdCm(60);
      setFilmId('d4');
      setInitialActivityCi(45);
      setTargetOpticalDensity(2.5);
    } else if (presetKey === 'pipe_6in_ir') {
      selectAndTrackSource('ir192');
      setTechnique('dwsi_contact');
      setMaterialThicknessMm(7.1);
      setPipeOuterDiameterMm(168.3); // 6" OD
      setWeldReinforcementMm(2.5);
      setSfdCm(70);
      setFilmId('d7');
      setInitialActivityCi(50);
      setTargetOpticalDensity(2.5);
    } else if (presetKey === 'plate_se75') {
      selectAndTrackSource('se75');
      setTechnique('swsi_plate');
      setMaterialThicknessMm(10.0);
      setWeldReinforcementMm(2.0);
      setSfdCm(50);
      setFilmId('d4');
      setInitialActivityCi(60);
      setTargetOpticalDensity(2.5);
    } else if (presetKey === 'vessel_co60') {
      selectAndTrackSource('co60');
      setTechnique('swsi_plate');
      setMaterialThicknessMm(65.0);
      setWeldReinforcementMm(3.5);
      setSfdCm(90);
      setFilmId('d7');
      setInitialActivityCi(40);
      setTargetOpticalDensity(2.5);
    } else if (presetKey === 'tube_xray') {
      selectAndTrackSource('xray_dir');
      setTechnique('swsi_plate');
      setMaterialThicknessMm(6.0);
      setWeldReinforcementMm(1.5);
      setSfdCm(70);
      setTubeKv(180);
      setTubeMa(4.0);
      setFilmId('d5');
      setTargetOpticalDensity(2.2);
    }
  };

  const formatMinSec = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectedIsotope = GE_ISOTOPES[sourceType];
  const selectedFilm = GE_STRUCTURIX_FILMS[filmId];
  const selectedMaterial = GE_MATERIALS[materialId];
  const selectedTechnique = GE_TECHNIQUES[technique];

  // PDF Report Export Handler
  const handleExportPdfReport = () => {
    try {
      setIsExportingPdf(true);
      const reportNumber = `RT-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
      const todayStr = new Date().toISOString().split('T')[0];

      const pdfData: GeRadiographicPdfReportData = {
        reportNumber,
        reportDate: measurementDate || todayStr,
        clientName: 'INSCO NDT Industrial Operations',
        projectFacility: 'Field Radiographic Testing Station',
        weldJointId: 'W-01 (ASME Sec V Circumferential Butt)',
        leadRadiographer: 'Certified RT Inspector',
        radiographerLevel: 'Level II',
        inspectorCertNumber: 'INSCO-RT-ISO9712-4421',

        sourceType,
        isotopeSpec: selectedIsotope,
        initialActivityCi,
        initialCalibrationDate,
        measurementDate,
        decayDaysElapsed: calcResult.decayDaysElapsed,
        currentLiveActivityCi: calcResult.currentLiveActivityCi,
        tubeKv: sourceType.startsWith('xray') ? tubeKv : undefined,
        tubeMa: sourceType.startsWith('xray') ? tubeMa : undefined,

        materialSpec: selectedMaterial,
        nominalThicknessMm: materialThicknessMm,
        weldReinforcementMm,
        pipeOuterDiameterMm: technique.includes('dw') || technique === 'swsi_panoramic' ? pipeOuterDiameterMm : undefined,
        techniqueSpec: selectedTechnique,
        sfdCm,

        filmLoadingMode,
        primaryFilmSpec: calcResult.primaryFilmSpec,
        secondaryFilmSpec: calcResult.secondaryFilmSpec,
        hasInterleafLeadScreen: calcResult.hasInterleafLeadScreen,
        wideLatitudeGoverning: wideLatitudeGov,
        hasLeadScreens,
        hasCollimator,
        targetOpticalDensity,

        calculatedExposureSeconds: calcResult.calculatedTotalSeconds,
        formattedExposureDuration: calcResult.formattedDuration,
        exposureInCurieMinutes: calcResult.exposureInCurieMinutes,
        effectiveSteelThicknessMm: calcResult.effectiveSteelThicknessMm,
        halfValueLayersCount: calcResult.halfValueLayersCount,
        attenuationFactor: calcResult.attenuationFactor,
        calculatedUgMm: calcResult.calculatedUgMm,
        maxAllowedUgMm: calcResult.maxAllowedUgMm,
        passesAsmeUg: calcResult.passesAsmeUg,
        essentialWireIdentity: calcResult.essentialWireIdentity,
        essentialWireDiameterMm: calcResult.essentialWireDiameterMm,
        iqiSetDesignation: calcResult.iqiSetDesignation,
        controlledAreaPerimeter2mR_Meters: calcResult.controlledAreaPerimeter2mR_Meters,
        publicBarricadePerimeter075mR_Meters: calcResult.publicBarricadePerimeter075mR_Meters,

        isMultiFilm: calcResult.isMultiFilm,
        film1PredictedDensity: calcResult.film1PredictedDensity,
        film2PredictedDensity: calcResult.film2PredictedDensity,
        compositeSuperimposedDensity: calcResult.compositeSuperimposedDensity,
        multiFilmTimeFactor: calcResult.multiFilmTimeFactor,
        speedRatioDescription: calcResult.speedRatioDescription,
      };

      const doc = generateGeRadiographicExposurePdf(pdfData);
      const fileName = `GE_Radiographic_Exposure_Report_${sourceType.toUpperCase()}_${todayStr}.pdf`;
      doc.save(fileName);

      setPdfSuccessMessage(isAr ? `تم تصدير تقرير PDF بنجاح: ${fileName}` : `PDF Report successfully exported: ${fileName}`);
      setTimeout(() => setPdfSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Failed to export PDF report', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="ge-exposure-calculator-app"
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl p-6 sm:p-8 space-y-6 ${className}`}
    >
      {/* -------------------------------------------------------------------
          TOP HEADER STRIP
      ------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold tracking-wider">
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{isAr ? 'حاسبة وقت التعريض الإشعاعي المعتمدة' : 'GE / Waygate Radiographic Exposure Time App'}</span>
            <span aria-hidden="true">·</span>
            <span>Agfa Structurix Exposure Curves</span>
            <span aria-hidden="true">·</span>
            <span>ASME Section V Art 2</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr
              ? 'حاسبة زمن التعريض الإشعاعي الصناعي (محاكي تطبيق GE Exposure Calculator)'
              : 'Industrial Radiography Exposure Time & Decay Calculator (GE App Edition)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            {isAr
              ? 'حساب فيزيائي دقيق لزمن التعريض بالأشعة السينية وجاما (Ir-192 / Se-75 / Co-60) وفق منحنيات أفلام Agfa Structurix، مع التتبع التلقائي لتحلل النظير الإشعاعي وحساب أبعاد الأمان والوضوح الهندسي Ug.'
              : 'Precision physics engine calculating gamma (Ir-192, Se-75, Co-60, Yb-169) and X-ray exposure times calibrated to Agfa Structurix film characteristic curves, real-time isotope decay, geometric unsharpness Ug, and radiation safety perimeters.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unit System Toggle (Metric mm/cm vs Imperial in/ft) + Conversion Log */}
          <div ref={unitTogglerRef} className="relative">
            <div
              role="group"
              aria-label={isAr ? 'نظام وحدات القياس وسجل التحويلات' : 'Measurement Unit System & Conversion Log'}
              className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
            >
              <button
                id="ge-unit-toggle-metric"
                type="button"
                data-testid="ge-unit-toggle-metric"
                onClick={() => toggleUnitSystem('metric')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  unitSystem === 'metric'
                    ? 'bg-sky-500 text-white shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${unitSystem === 'metric' ? 'bg-white' : 'bg-sky-500/70'}`} aria-hidden="true" />
                <span>{isAr ? 'متري (mm/cm)' : 'Metric (mm/cm)'}</span>
              </button>
              <button
                id="ge-unit-toggle-imperial"
                type="button"
                data-testid="ge-unit-toggle-imperial"
                onClick={() => toggleUnitSystem('imperial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  unitSystem === 'imperial'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${unitSystem === 'imperial' ? 'bg-slate-950' : 'bg-amber-500/70'}`} aria-hidden="true" />
                <span>{isAr ? 'إمبراطوري (in/ft)' : 'Imperial (in/ft)'}</span>
              </button>

              <span className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1" aria-hidden="true" />

              <button
                type="button"
                data-testid="ge-conversion-log-toggle"
                onClick={() => setShowConversionLog((prev) => !prev)}
                aria-expanded={showConversionLog}
                title={isAr ? 'سجل آخر 5 تحويلات للوحدات' : 'View last 5 unit conversions'}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  showConversionLog
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{isAr ? 'السجل' : 'Log'}</span>
                <span
                  data-testid="ge-conversion-log-count"
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black tabular-nums ${
                    showConversionLog
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {conversionLog.length}
                </span>
              </button>
            </div>

            {/* Conversion Log Dropdown Popover */}
            {showConversionLog && (
              <div
                data-testid="ge-conversion-log-panel"
                className={`absolute top-full mt-2 ${
                  isAr ? 'left-0' : 'right-0'
                } z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3 text-xs font-mono`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'سجل تحويلات الوحدات (آخر 5)' : 'Conversion Log (Last 5)'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {conversionLog.length > 0 && (
                      <button
                        type="button"
                        data-testid="ge-conversion-log-clear-btn"
                        onClick={handleClearConversionLog}
                        className="px-2 py-1 rounded-lg text-[10px] text-red-500 hover:bg-red-500/10 transition flex items-center gap-1 cursor-pointer"
                        title={isAr ? 'مسح السجل' : 'Clear Conversion Log'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isAr ? 'مسح' : 'Clear'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="ge-conversion-log-close-btn"
                      onClick={() => setShowConversionLog(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      aria-label={isAr ? 'إغلاق السجل' : 'Close Conversion Log'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {conversionLog.length === 0 ? (
                  <div
                    data-testid="ge-conversion-log-empty"
                    className="py-5 text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1"
                  >
                    <History className="w-6 h-6 mx-auto text-slate-400 opacity-60" />
                    <p>
                      {isAr
                        ? 'لا توجد تحويلات مسجلة بعد. بدّل بين المتري والإمبراطوري لحفظ السجل تلقائياً.'
                        : 'No conversions logged yet. Switch between Metric & Imperial to record history.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                    {conversionLog.map((entry, idx) => (
                      <div
                        key={entry.id}
                        data-testid={`ge-conversion-log-entry-${idx}`}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 hover:border-amber-500/40 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            <span>{entry.fromUnit === 'metric' ? 'mm/cm' : 'in/ft'}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span>{entry.toUnit === 'metric' ? 'mm/cm' : 'in/ft'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">{entry.timestamp}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="text-slate-400 block text-[9px]">
                              {isAr ? 'السُمك (t):' : 'Wall (t):'}
                            </span>
                            <strong>
                              {entry.thicknessMm} mm ⇄ {entry.thicknessInches} in
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">
                              {isAr ? 'المسافة (SFD):' : 'SFD:'}
                            </span>
                            <strong>
                              {entry.sfdCm} cm ⇄ {entry.sfdInches} in
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-800/70 text-[10px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {entry.sourceLabel} · {entry.formattedDuration} ({entry.calculatedTotalSeconds}s)
                          </span>
                          <button
                            type="button"
                            data-testid={`ge-conversion-log-restore-${idx}`}
                            onClick={() => handleRestoreConversionEntry(entry)}
                            className="px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 font-bold transition cursor-pointer"
                          >
                            {isAr ? 'تطبيق' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            data-testid="ge-reset-all-inputs-btn"
            onClick={handleResetAllInputs}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              resetConfirmed
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 hover:bg-red-500/10 hover:border-red-400/50 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-200'
            }`}
            title={isAr ? 'استعادة كافة المدخلات والإعدادات للقيم الافتراضية' : 'Restore all inputs and settings to defaults'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {resetConfirmed
                ? (isAr ? 'تمت الاستعادة' : 'Defaults Restored')
                : (isAr ? 'إعادة ضبط الكل' : 'Reset All Inputs')}
            </span>
          </button>

          <button
            type="button"
            data-testid="ge-technique-sheet-btn"
            onClick={() => setShowTechniqueSheetModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-sm text-slate-800 dark:text-slate-200"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'كارت تقنية RT' : 'RT Technique Sheet'}</span>
          </button>

          <button
            type="button"
            data-testid="ge-export-pdf-report-btn"
            onClick={handleExportPdfReport}
            disabled={isExportingPdf}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title={isAr ? 'تصدير تقرير فحص PDF معتمد' : 'Export Formatted PDF Report'}
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>{isExportingPdf ? (isAr ? 'جاري التصدير...' : 'Exporting...') : (isAr ? 'تصدير تقرير PDF' : 'Export PDF Report')}</span>
          </button>

          {onApplyTimeToLab && (
            <button
              type="button"
              data-testid="ge-apply-to-lab-btn"
              onClick={() => onApplyTimeToLab(calcResult.calculatedTotalSeconds)}
              className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isAr ? 'تطبيق الوقت بالمعمل' : 'Apply to RT Lab'}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------
          PDF EXPORT SUCCESS NOTIFICATION TOAST
      ------------------------------------------------------------------- */}
      {pdfSuccessMessage && (
        <div
          data-testid="ge-pdf-success-banner"
          className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-bold">{pdfSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------
          QUICK FIELD PRESETS BAR
      ------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 me-1">
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span>{isAr ? 'نماذج الاختبار السريعة الجاهزة:' : 'Quick Industry Presets:'}</span>
        </span>

        <button
          type="button"
          data-testid="preset-pipe-2in"
          onClick={() => loadPreset('pipe_2in_ir')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 font-mono transition cursor-pointer"
        >
          2" Pipe Elliptical (Ir-192 DWDI)
        </button>

        <button
          type="button"
          data-testid="preset-pipe-6in"
          onClick={() => loadPreset('pipe_6in_ir')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 font-mono transition cursor-pointer"
        >
          6" Pipe Contact (Ir-192 DWSI)
        </button>

        <button
          type="button"
          data-testid="preset-plate-se75"
          onClick={() => loadPreset('plate_se75')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 font-mono transition cursor-pointer"
        >
          10mm Plate (Se-75 SWSI)
        </button>

        <button
          type="button"
          data-testid="preset-vessel-co60"
          onClick={() => loadPreset('vessel_co60')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 font-mono transition cursor-pointer"
        >
          65mm Vessel (Co-60 Heavy)
        </button>

        <button
          type="button"
          data-testid="preset-tube-xray"
          onClick={() => loadPreset('tube_xray')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 font-mono transition cursor-pointer"
        >
          6mm Tube (X-Ray 180kV)
        </button>
      </div>

      {/* -------------------------------------------------------------------
          PRIMARY READOUT HUD (THE SIGNATURE GE DISPLAY)
      ------------------------------------------------------------------- */}
      <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4 relative z-10">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {isAr ? 'زمن التعريض المحسوب بدقة GE' : 'Calculated Radiographic Exposure Time'}
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                data-testid="ge-calculated-exposure-display"
                className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums"
              >
                {calcResult.minutesPortion}m {calcResult.secondsPortion.toString().padStart(2, '0')}s
              </span>
              <span className="text-lg sm:text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                ({calcResult.calculatedTotalSeconds}s)
              </span>
            </div>

            {calcResult.isMultiFilm && (
              <div
                data-testid="ge-multi-film-badge"
                className="mt-2 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300">
                  {calcResult.filmLoadingMode === 'dual_composite'
                    ? (isAr ? 'فيلم مزدوج متراكب (ASME T-282.1)' : 'Dual Composite Superimposed (ASME T-282.1)')
                    : (isAr ? 'مزيج فيلمين واسع المدى التبايني' : 'Wide-Latitude Dual Combination')}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-200">
                  {calcResult.filmLoadingMode === 'dual_composite' ? (
                    <>
                      <span>
                        D₁ ({calcResult.film1PredictedDensity.toFixed(2)}) + D₂ ({calcResult.film2PredictedDensity?.toFixed(2)}) ={' '}
                        <strong className="text-amber-400">{calcResult.compositeSuperimposedDensity?.toFixed(2)} H&D</strong>
                      </span>
                      <span className="ms-1.5 text-emerald-400 font-bold">(-45% time · ×{calcResult.multiFilmTimeFactor})</span>
                    </>
                  ) : (
                    <>
                      <span>
                        F1({calcResult.primaryFilmSpec.code}): <strong>{calcResult.film1PredictedDensity.toFixed(2)} D</strong>
                      </span>
                      <span className="mx-1">/</span>
                      <span>
                        F2({calcResult.secondaryFilmSpec?.code}): <strong>{calcResult.film2PredictedDensity?.toFixed(2)} D</strong>
                      </span>
                      {calcResult.hasInterleafLeadScreen && (
                        <span className="ms-1.5 text-sky-400 font-bold">(+0.025mm Pb Interleaf)</span>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Exposure Run Timer */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 backdrop-blur space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3 text-slate-500 dark:text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'عداد التشغيل الميداني:' : 'Live Shot Timer:'}</span>
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled((p) => !p)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
                title={isAr ? 'كتم/تشغيل الصوت' : 'Toggle Beep Sound'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div
                data-testid="ge-live-countdown-clock"
                className={`text-2xl font-black font-mono tabular-nums px-3 py-1 rounded-xl border ${
                  isTimerRunning
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500 animate-pulse'
                    : isTimerCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-800'
                }`}
              >
                {formatMinSec(timerSecondsLeft)}
              </div>

              <div className="flex items-center gap-1.5">
                {!isTimerRunning ? (
                  <button
                    type="button"
                    data-testid="ge-timer-start-btn"
                    onClick={handleStartTimer}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer shadow"
                    title={isAr ? 'بدء العد التنازلي' : 'Start Exposure'}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="ge-timer-pause-btn"
                    onClick={handlePauseTimer}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer shadow"
                    title={isAr ? 'إيقاف مؤقت' : 'Pause Exposure'}
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  data-testid="ge-timer-reset-btn"
                  onClick={handleResetTimer}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title={isAr ? 'إعادة ضبط' : 'Reset Timer'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isTimerRunning && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-mono font-bold animate-pulse">
                <Radio className="w-3 h-3" />
                <span>{isAr ? '⚠️ إشعاع نشط (BEAM ACTIVE)' : '⚠️ RADIATION ON (BEAM ACTIVE)'}</span>
              </div>
            )}
            {isTimerCompleted && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isAr ? 'تم اكتمال التعريض وسحب المصدر' : 'Exposure Complete — Source Safely Stowed'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Essential Physics Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              {sourceType.startsWith('xray') ? (isAr ? 'جرعة المللي أمبير' : 'Exposure (mA·min)') : (isAr ? 'جرعة الكيوري' : 'Exposure (Ci·min)')}
            </span>
            <div data-testid="ge-curie-minutes" className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {calcResult.exposureInCurieMinutes}{' '}
              <span className="text-xs font-normal">{sourceType.startsWith('xray') ? 'mA·min' : 'Ci·min'}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {sourceType.startsWith('xray') ? `at ${tubeMa} mA` : `at ${calcResult.currentLiveActivityCi} Ci`}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              {isAr ? 'سُمك الصلب المكافئ' : 'Equivalent Steel Thickness'}
            </span>
            <div data-testid="ge-effective-thickness" className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
              {unitSystem === 'imperial' ? (
                <>
                  {(calcResult.effectiveSteelThicknessMm / 25.4).toFixed(3)} <span className="text-xs font-normal">in</span>
                </>
              ) : (
                <>
                  {calcResult.effectiveSteelThicknessMm} <span className="text-xs font-normal">mm</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {unitSystem === 'imperial'
                ? `${calcResult.effectiveSteelThicknessMm} mm · ${calcResult.halfValueLayersCount} HVL`
                : `${(calcResult.effectiveSteelThicknessMm / 25.4).toFixed(3)} in · ${calcResult.halfValueLayersCount} HVL`}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              {isAr ? 'الوضوح الهندسي (Ug)' : 'Geometric Unsharpness (Ug)'}
            </span>
            <div
              data-testid="ge-ug-metric"
              className={`text-xl font-black tabular-nums ${
                calcResult.passesAsmeUg ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
              }`}
            >
              {unitSystem === 'imperial' ? (
                <>
                  {(calcResult.calculatedUgMm / 25.4).toFixed(4)} <span className="text-xs font-normal">in</span>
                </>
              ) : (
                <>
                  {calcResult.calculatedUgMm} <span className="text-xs font-normal">mm</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {unitSystem === 'imperial'
                ? (calcResult.passesAsmeUg
                    ? `ASME Pass (≤ ${(calcResult.maxAllowedUgMm / 25.4).toFixed(4)}" / ${calcResult.maxAllowedUgMm}mm)`
                    : `Exceeds ASME (max ${(calcResult.maxAllowedUgMm / 25.4).toFixed(4)}")`)
                : (calcResult.passesAsmeUg
                    ? `ASME Pass (≤ ${calcResult.maxAllowedUgMm}mm / ${(calcResult.maxAllowedUgMm / 25.4).toFixed(4)}")`
                    : `Exceeds ASME (max ${calcResult.maxAllowedUgMm}mm)`)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              {isAr ? 'سلك حساسية ASME IQI' : 'Essential ASME Wire IQI'}
            </span>
            <div data-testid="ge-essential-wire" className="text-xl font-black text-purple-600 dark:text-purple-400">
              {calcResult.essentialWireIdentity}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Ø {calcResult.essentialWireDiameterMm} mm ({calcResult.iqiSetDesignation.split(' ')[0]})
            </span>
          </div>
        </div>

        {/* Radiation Safety Boundary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">
              {isAr ? 'نطاق حدود الأمان الإشعاعي الميداني المحسوب:' : 'Calculated Field Radiation Safety Distances:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {isAr ? 'منطقة محكومة (2 mR/hr):' : 'Controlled (2 mR/hr):'}{' '}
              <strong className="text-white">{calcResult.controlledAreaPerimeter2mR_Meters} m</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30">
              {isAr ? 'حاجز الجمهور (0.75 mR/hr):' : 'Barricade (0.75 mR/hr):'}{' '}
              <strong className="text-white">{calcResult.publicBarricadePerimeter075mR_Meters} m</strong>
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          QUICK UNITS HIGH-VISIBILITY SWITCH BAR (DIRECTLY ABOVE MAIN INPUTS)
      ------------------------------------------------------------------- */}
      <div
        id="ge-quick-units-bar"
        data-testid="ge-quick-units-bar"
        data-unit-mode={unitSystem}
        data-unit-transitioning={unitTransitionPulse ? 'true' : 'false'}
        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-500 ease-in-out ${
          unitSystem === 'metric'
            ? `bg-sky-500/10 border-sky-500/60 shadow-[0_0_18px_rgba(14,165,233,0.16)] dark:bg-sky-950/35 dark:border-sky-500/50 ${
                unitTransitionPulse ? 'ring-4 ring-sky-400/45 scale-[1.01]' : 'ring-0 ring-transparent scale-100'
              }`
            : `bg-amber-500/10 border-amber-500/70 shadow-[0_0_18px_rgba(245,158,11,0.22)] dark:bg-amber-950/35 dark:border-amber-500/60 ${
                unitTransitionPulse ? 'ring-4 ring-amber-400/50 scale-[1.01]' : 'ring-0 ring-transparent scale-100'
              }`
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight
              className={`w-4 h-4 shrink-0 transition-all duration-500 ease-in-out ${
                unitSystem === 'metric'
                  ? 'text-sky-600 dark:text-sky-400 rotate-0 scale-100'
                  : 'text-amber-600 dark:text-amber-400 rotate-180 scale-110'
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {isAr ? 'تبديل الوحدات السريع (Quick Units)' : 'Quick Units'}
            </span>
          </div>

          <span
            data-testid="ge-quick-units-active-cue"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-black border flex items-center gap-1.5 transition-all duration-500 ease-in-out ${
              unitTransitionPulse ? 'scale-105' : 'scale-100'
            } ${
              unitSystem === 'metric'
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                : 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-500 ease-in-out ${
                unitSystem === 'metric' ? 'bg-white' : 'bg-slate-950'
              }`}
              aria-hidden="true"
            />
            <span>
              {unitSystem === 'metric'
                ? (isAr ? 'الوضع النشط: متري (mm / cm)' : 'ACTIVE: METRIC (mm / cm)')
                : (isAr ? 'الوضع النشط: إمبراطوري (in / ft)' : 'ACTIVE: IMPERIAL (in / ft)')}
            </span>
          </span>

          <button
            type="button"
            data-testid="ge-quick-units-copy-btn"
            onClick={handleCopyQuickUnits}
            aria-label={
              copiedUnitsConfirmed
                ? (isAr ? 'تم نسخ قيم السُمك و SFD' : 'Copied thickness and SFD values')
                : (isAr ? 'نسخ قيم السُمك و SFD الحالية للحافظة' : 'Copy current thickness and SFD values to clipboard')
            }
            title={
              copiedUnitsConfirmed
                ? (isAr ? 'تم النسخ!' : 'Copied!')
                : (isAr ? 'نسخ السُمك و SFD إلى الحافظة' : 'Copy Thickness & SFD to Clipboard')
            }
            className={`p-1.5 rounded-lg border transition-colors duration-300 ease-in-out cursor-pointer inline-flex items-center gap-1 text-[11px] font-mono font-bold ${
              copiedUnitsConfirmed
                ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-white/75 dark:bg-slate-900/75 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-sky-500/60 hover:text-sky-600 dark:hover:text-sky-400'
            }`}
          >
            {copiedUnitsConfirmed ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          <div
            data-testid="ge-quick-units-preview"
            className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors duration-500 ease-in-out"
          >
            <span className="inline-flex items-center gap-1">
              <span>
                {unitSystem === 'metric'
                  ? `Thickness (t): ${materialThicknessMm.toFixed(1)} mm`
                  : `Thickness (t): ${thicknessInches}"`}
              </span>
              <UnitConversionTooltip
                testId="ge-quick-units-tooltip-thickness"
                isAr={isAr}
                tooltipText={conversionFormulas.quickThickness}
              />
            </span>

            <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>

            <span className="inline-flex items-center gap-1">
              <span>
                {unitSystem === 'metric'
                  ? `SFD: ${sfdCm} cm`
                  : `SFD: ${sfdInches}" (${sfdFeet} ft)`}
              </span>
              <UnitConversionTooltip
                testId="ge-quick-units-tooltip-sfd"
                isAr={isAr}
                tooltipText={conversionFormulas.quickSfd}
              />
            </span>

            <UnitConversionSparkline
              entries={conversionLog}
              unitSystem={unitSystem}
              isAr={isAr}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="ge-quick-units-metric"
            onClick={() => toggleUnitSystem('metric')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors duration-300 ease-in-out cursor-pointer ${
              unitSystem === 'metric'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            mm / cm
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={unitSystem === 'imperial'}
            aria-label={isAr ? 'تبديل سريع بين النظام المتري والإمبراطوري' : 'Quick Units toggle switch between Metric and Imperial'}
            data-testid="ge-quick-units-switch"
            onClick={() => toggleUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
            className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-lg border-2 p-0.5 transition-colors duration-500 ease-in-out cursor-pointer focus:outline-none focus:ring-2 ${
              unitSystem === 'metric'
                ? 'bg-sky-500/25 border-sky-500 focus:ring-sky-500/40'
                : 'bg-amber-500/30 border-amber-500 focus:ring-amber-500/40'
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-5 w-6 rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                unitSystem === 'imperial'
                  ? (isAr ? '-translate-x-6 bg-amber-500' : 'translate-x-6 bg-amber-500')
                  : 'translate-x-0 bg-sky-500'
              }`}
            />
          </button>

          <button
            type="button"
            data-testid="ge-quick-units-imperial"
            onClick={() => toggleUnitSystem('imperial')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors duration-300 ease-in-out cursor-pointer ${
              unitSystem === 'imperial'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            in / ft
          </button>

          <span className="h-5 w-px bg-slate-300/80 dark:bg-slate-700/80 mx-0.5" aria-hidden="true" />

          {/* Quick Conversion History Dropdown inside #ge-quick-units-bar */}
          <div ref={quickUnitsHistoryRef} className="relative">
            <button
              type="button"
              data-testid="ge-quick-units-history-toggle"
              aria-expanded={showQuickUnitsHistory}
              aria-haspopup="menu"
              onClick={() => setShowQuickUnitsHistory((prev) => !prev)}
              title={isAr ? 'استعراض وإعادة تطبيق آخر 5 تحويلات' : 'View & re-apply last 5 unit conversions'}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors duration-300 ease-in-out cursor-pointer flex items-center gap-1.5 ${
                showQuickUnitsHistory
                  ? unitSystem === 'metric'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                    : 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                  : 'bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'آخر 5' : 'History'}</span>
              <span
                data-testid="ge-quick-units-history-count"
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black tabular-nums ${
                  showQuickUnitsHistory
                    ? 'bg-black/15 text-current'
                    : unitSystem === 'metric'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}
              >
                {conversionLog.length}
              </span>
            </button>

            {showQuickUnitsHistory && (
              <div
                role="menu"
                data-testid="ge-quick-units-history-menu"
                aria-label={isAr ? 'قائمة آخر 5 تحويلات للوحدات' : 'Last 5 unit conversions'}
                className={`absolute top-full mt-2 ${
                  isAr ? 'left-0' : 'right-0'
                } z-50 w-72 sm:w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-3 space-y-2.5 text-xs font-mono`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <ArrowLeftRight
                      className={`w-3.5 h-3.5 ${
                        unitSystem === 'metric' ? 'text-sky-500' : 'text-amber-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{isAr ? 'سجل التحويلات (آخر 5)' : 'Recent Conversions (Last 5)'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {conversionLog.length > 0 && (
                      <button
                        type="button"
                        data-testid="ge-quick-units-history-clear"
                        onClick={handleClearConversionLog}
                        className="px-1.5 py-0.5 rounded-md text-[10px] text-red-500 hover:bg-red-500/10 transition flex items-center gap-1 cursor-pointer"
                        title={isAr ? 'مسح السجل' : 'Clear history'}
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                        <span>{isAr ? 'مسح' : 'Clear'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="ge-quick-units-history-close"
                      onClick={() => setShowQuickUnitsHistory(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      aria-label={isAr ? 'إغلاق القائمة' : 'Close conversion history menu'}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {conversionLog.length === 0 ? (
                  <div
                    data-testid="ge-quick-units-history-empty"
                    className="py-4 text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1"
                  >
                    <History className="w-5 h-5 mx-auto text-slate-400 opacity-60" aria-hidden="true" />
                    <p>
                      {isAr
                        ? 'لا توجد تحويلات بعد. بدّل بين المتري والإمبراطوري للتسجيل.'
                        : 'No conversions yet. Toggle units to record your last 5 conversions.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {conversionLog.slice(0, 5).map((entry, idx) => (
                      <div
                        key={entry.id}
                        role="menuitem"
                        data-testid={`ge-quick-units-history-item-${idx}`}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 transition space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              entry.toUnit === 'imperial'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            <span>{entry.fromUnit === 'metric' ? 'mm/cm' : 'in/ft'}</span>
                            <ArrowRight className="w-2.5 h-2.5" aria-hidden="true" />
                            <span>{entry.toUnit === 'metric' ? 'mm/cm' : 'in/ft'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">{entry.timestamp}</span>
                        </div>

                        <div className="text-[10px] text-slate-700 dark:text-slate-300 flex flex-wrap gap-x-2">
                          <span>
                            t: <strong>{entry.thicknessMm} mm</strong> ⇄ <strong>{entry.thicknessInches} in</strong>
                          </span>
                          <span>
                            SFD: <strong>{entry.sfdCm} cm</strong> ⇄ <strong>{entry.sfdInches} in</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-800/70 text-[10px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {entry.sourceLabel} · {entry.formattedDuration}
                          </span>
                          <button
                            type="button"
                            data-testid={`ge-quick-units-history-apply-${idx}`}
                            onClick={() => handleRestoreConversionEntry(entry)}
                            className="px-2 py-0.5 rounded-md bg-sky-500/15 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 font-bold transition cursor-pointer"
                          >
                            {isAr ? 'تطبيق' : 'Re-apply'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Conversion Log CSV Button inside #ge-quick-units-bar */}
          <button
            type="button"
            data-testid="ge-quick-units-export-csv-btn"
            onClick={handleExportConversionLogCsv}
            disabled={conversionLog.length === 0}
            title={
              conversionLog.length === 0
                ? (isAr ? 'بدّل الوحدات أولاً لتسجيل تحويلات قابلة للتصدير' : 'Switch units at least once to export conversion log CSV')
                : (isAr ? 'تصدير سجل التحويلات الحالي كملف CSV' : 'Export current conversion log as CSV')
            }
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors duration-300 ease-in-out flex items-center gap-1.5 ${
              conversionLog.length === 0
                ? 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                : csvExportedConfirmed
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-pointer'
                  : 'bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-sky-500/10 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer'
            }`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {csvExportedConfirmed
                ? (isAr ? 'تم تصدير CSV' : 'CSV Exported')
                : (isAr ? 'تصدير CSV' : 'Export CSV')}
            </span>
          </button>

          {/* Reset Units Only Button inside #ge-quick-units-bar */}
          <button
            type="button"
            data-testid="ge-quick-units-reset-only-btn"
            onClick={handleResetUnitsOnly}
            title={
              isAr
                ? 'إعادة ضبط مدخلات السُمك والمسافة فقط إلى القيم الافتراضية دون تصفير باقي الحاسبة'
                : 'Reset only thickness & distance inputs to last saved system defaults without a full app reset'
            }
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors duration-300 ease-in-out cursor-pointer flex items-center gap-1.5 ${
              unitsResetConfirmed
                ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-red-500/10 hover:border-red-400/50 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {unitsResetConfirmed
                ? (isAr ? 'تم ضبط الوحدات' : 'Units Reset')
                : (isAr ? 'إعادة ضبط الوحدات فقط' : 'Reset Units Only')}
            </span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          INPUT CONFIGURATION SECTIONS (STEP 1, STEP 2, STEP 3)
      ------------------------------------------------------------------- */}
      <div className="grid lg:grid-cols-3 gap-6 pt-2">
        {/* =================================================================
            COLUMN 1: RADIATION SOURCE & ISOTOPE DECAY TRACKER
        ================================================================= */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Radio className="w-4 h-4" />
            <span>{isAr ? '1. المصدر الإشعاعي وتتبع التحلل' : '1. Radiation Source & Decay'}</span>
          </div>

          {/* Recent Sources Quick-Switch Chips Bar */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'المصادر الأخيرة (تبديل سريع):' : 'Recent Sources (Quick Switch):'}</span>
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Top 3</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {recentSources.map((srcKey) => {
                const spec = GE_ISOTOPES[srcKey];
                const isActive = sourceType === srcKey;
                return (
                  <button
                    key={srcKey}
                    type="button"
                    data-testid={`recent-source-chip-${srcKey}`}
                    onClick={() => selectAndTrackSource(srcKey)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 font-black shadow-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-950 animate-ping' : 'bg-amber-500'}`} />
                    <span>{spec.chemicalSymbol || (spec.id === 'xray_dir' ? 'X-Ray Dir' : spec.id === 'xray_pano' ? 'X-Ray Pano' : spec.id.toUpperCase())}</span>
                    <span className="text-[10px] font-normal opacity-75">
                      {spec.category === 'xray' ? 'kV' : 'γ'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Selection Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'نظير جاما / أنبوبة إكس راي:' : 'Isotope / X-Ray Tube:'}
            </label>
            <select
              data-testid="ge-select-source-type"
              data-unit-mode={unitSystem}
              value={sourceType}
              onChange={(e) => selectAndTrackSource(e.target.value as GeSourceType)}
              className={`w-full bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer`}
            >
              <option value="ir192">Ir-192 — Iridium-192 (10–75 mm Steel)</option>
              <option value="se75">Se-75 — Selenium-75 Soft Gamma (4–30 mm)</option>
              <option value="co60">Co-60 — Cobalt-60 Heavy Steel (40–160 mm)</option>
              <option value="yb169">Yb-169 — Ytterbium-169 Thin Wall (1.5–15 mm)</option>
              <option value="xray_dir">X-Ray Tube — Directional (Constant Potential)</option>
              <option value="xray_pano">X-Ray Tube — 360° Panoramic Crawler</option>
            </select>
          </div>

          {/* Isotope Decay Calculator Strip (for Gamma) */}
          {selectedIsotope.category === 'gamma' ? (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{isAr ? 'حساب تحلل النظير التلقائي:' : 'Automatic Isotope Decay:'}</span>
                <span className="text-amber-500 font-bold">T½: {selectedIsotope.halfLifeDays}d</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">{isAr ? 'النشاط الأولي (Ci):' : 'Initial Activity (Ci):'}</span>
                  <input
                    type="number"
                    data-testid="ge-initial-curie-input"
                    data-unit-mode={unitSystem}
                    value={initialActivityCi}
                    min={1}
                    max={200}
                    onChange={(e) => setInitialActivityCi(Math.max(1, Number(e.target.value)))}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border ${unitInputBorderClass} rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono focus:outline-none`}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">{isAr ? 'تاريخ المعايرة الأولية:' : 'Calib. Date:'}</span>
                  <input
                    type="date"
                    data-testid="ge-calib-date-input"
                    data-unit-mode={unitSystem}
                    value={initialCalibrationDate}
                    onChange={(e) => setInitialCalibrationDate(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border ${unitInputBorderClass} rounded-lg px-2 py-1 text-[11px] text-slate-900 dark:text-white font-mono focus:outline-none`}
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{isAr ? 'تاريخ التصوير الفعلي:' : 'Shot Date (Today):'}</span>
                  <button
                    type="button"
                    onClick={() => setMeasurementDate('2026-11-05')}
                    className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                  >
                    {isAr ? 'اليوم' : 'Today'}
                  </button>
                </div>
                <input
                  type="date"
                  data-testid="ge-shot-date-input"
                  data-unit-mode={unitSystem}
                  value={measurementDate}
                  onChange={(e) => setMeasurementDate(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${unitInputBorderClass} rounded-lg px-2 py-1 text-[11px] text-slate-900 dark:text-white font-mono focus:outline-none`}
                />
              </div>

              {/* Decayed Activity Result Badge */}
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-0.5 font-mono">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>{isAr ? 'الأيام المنقضية:' : 'Elapsed Decay:'}</span>
                  <strong>{calcResult.decayDaysElapsed} days</strong>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                  <span>{isAr ? 'النشاط الحالي الفعال:' : 'Live Current Activity:'}</span>
                  <strong data-testid="ge-live-curie-badge">{calcResult.currentLiveActivityCi} Ci</strong>
                </div>
              </div>
            </div>
          ) : (
            /* X-Ray Tube Controls */
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'جهد الأنبوبة (kV):' : 'Tube Voltage (kV):'}</span>
                  <strong className="font-mono text-amber-500">{tubeKv} kV</strong>
                </div>
                <input
                  type="range"
                  data-testid="ge-tube-kv-slider"
                  data-unit-mode={unitSystem}
                  min={100}
                  max={320}
                  step={5}
                  value={tubeKv}
                  onChange={(e) => setTubeKv(Number(e.target.value))}
                  className={`w-full ${unitRangeAccentClass} cursor-pointer`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'تيار الأنبوبة (mA):' : 'Tube Current (mA):'}</span>
                  <strong className="font-mono text-amber-500">{tubeMa} mA</strong>
                </div>
                <input
                  type="range"
                  data-testid="ge-tube-ma-slider"
                  data-unit-mode={unitSystem}
                  min={1.0}
                  max={10.0}
                  step={0.5}
                  value={tubeMa}
                  onChange={(e) => setTubeMa(Number(e.target.value))}
                  className={`w-full ${unitRangeAccentClass} cursor-pointer`}
                />
              </div>
            </div>
          )}

          {/* Focal Spot and Attenuation Details */}
          <div className="text-[11px] text-slate-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>{isAr ? 'الحجم البؤري للمصدر:' : 'Focal Spot Size:'}</span>
              <strong className="text-slate-800 dark:text-slate-200">{selectedIsotope.focalSpotMm} mm</strong>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'طبقة النصف الفولاذية HVL:' : 'Steel Half-Value Layer:'}</span>
              <strong className="text-slate-800 dark:text-slate-200">{selectedIsotope.steelHvlMm} mm</strong>
            </div>
          </div>
        </div>

        {/* =================================================================
            COLUMN 2: MATERIAL & GEOMETRIC TECHNIQUE PARAMETERS
        ================================================================= */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
              <span>{isAr ? '2. المادة والهندسة والمسافة' : '2. Material, Geometry & SFD'}</span>
            </div>
            <div
              data-testid="ge-unit-mode-badge"
              data-unit-mode={unitSystem}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${unitTagClass}`}
            >
              {unitSystem === 'metric'
                ? (isAr ? 'النظام: متري (mm/cm)' : 'Unit: Metric (mm/cm)')
                : (isAr ? 'النظام: إمبراطوري (in/ft)' : 'Unit: Imperial (in/ft)')}
            </div>
          </div>

          {/* Material Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'مادة الفحص ومعامل التكافؤ R:' : 'Material & Radiographic Equivalence:'}
            </label>
            <select
              data-testid="ge-select-material"
              data-unit-mode={unitSystem}
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value as GeMaterialId)}
              className={`w-full bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer`}
            >
              {(Object.keys(GE_MATERIALS) as GeMaterialId[]).map((mKey) => {
                const mat = GE_MATERIALS[mKey];
                return (
                  <option key={mKey} value={mKey}>
                    {isAr ? mat.nameAr : mat.nameEn} (R={mat.rFactorIr192})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Technique Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'طريقة التصوير ومسار الأشعة:' : 'Shooting Technique Geometry:'}
            </label>
            <select
              data-testid="ge-select-technique"
              data-unit-mode={unitSystem}
              value={technique}
              onChange={(e) => setTechnique(e.target.value as GeTechniqueGeometry)}
              className={`w-full bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer`}
            >
              {(Object.keys(GE_TECHNIQUES) as GeTechniqueGeometry[]).map((tKey) => {
                const tech = GE_TECHNIQUES[tKey];
                return (
                  <option key={tKey} value={tKey}>
                    {isAr ? tech.nameAr : tech.nameEn}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Wall Thickness & Weld Reinforcement Inputs (Metric mm / Imperial in) */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 inline-flex items-center gap-1.5">
                  <span>
                    {unitSystem === 'metric'
                      ? (isAr ? 'سُمك الجدار الاسمي (t):' : 'Nominal Wall Thickness (t):')
                      : (isAr ? 'سُمك الجدار الاسمي (t - بالبوصة):' : 'Nominal Wall Thickness (t - in):')}
                  </span>
                  <UnitConversionTooltip
                    testId="ge-tooltip-thickness"
                    isAr={isAr}
                    tooltipText={conversionFormulas.thickness}
                  />
                </span>
                <div className="flex items-center gap-2 font-mono">
                  {unitSystem === 'metric' ? (
                    <>
                      <span className="text-[11px] text-slate-400">({thicknessInches} in)</span>
                      <strong className="text-sky-600 dark:text-sky-400">{materialThicknessMm} mm</strong>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] text-slate-400">({materialThicknessMm.toFixed(1)} mm)</span>
                      <strong className="text-amber-600 dark:text-amber-400">{thicknessInches} in</strong>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  data-testid="ge-thickness-slider"
                  data-unit-mode={unitSystem}
                  min={unitSystem === 'metric' ? 2.0 : 0.08}
                  max={unitSystem === 'metric' ? 90.0 : 3.5}
                  step={unitSystem === 'metric' ? 0.5 : 0.025}
                  value={unitSystem === 'metric' ? materialThicknessMm : thicknessInches}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (unitSystem === 'metric') {
                      setMaterialThicknessMm(val);
                    } else {
                      handleThicknessChangeInches(val);
                    }
                  }}
                  className={`w-full ${unitRangeAccentClass} cursor-pointer`}
                />
                <div className="flex items-center gap-1 shrink-0">
                  {unitSystem === 'metric' ? (
                    <input
                      type="number"
                      data-testid="ge-thickness-number-input"
                      data-unit-mode={unitSystem}
                      min={2.0}
                      max={120.0}
                      step={0.5}
                      value={materialThicknessMm}
                      onChange={(e) => setMaterialThicknessMm(Math.max(1.0, Math.min(150.0, Number(e.target.value))))}
                      className={`w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                      title={isAr ? 'أدخل السُمك بالملليمتر' : 'Enter thickness in mm'}
                    />
                  ) : (
                    <input
                      type="number"
                      data-testid="ge-thickness-imperial-input"
                      data-unit-mode={unitSystem}
                      min={0.08}
                      max={5.0}
                      step={0.025}
                      value={thicknessInches}
                      onChange={(e) => handleThicknessChangeInches(Number(e.target.value))}
                      className={`w-20 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                      title={isAr ? 'أدخل السُمك بالبوصة' : 'Enter thickness in inches'}
                    />
                  )}
                  <span
                    data-testid="ge-unit-tag-thickness"
                    data-unit-mode={unitSystem}
                    className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${unitTagClass}`}
                  >
                    {unitSystem === 'metric' ? 'mm' : 'in'}
                  </span>
                </div>
              </div>
              {unitSystem === 'imperial' && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10px] font-mono text-slate-500">
                  <span className="text-slate-400">{isAr ? 'سماكات شائعة:' : 'Common:'}</span>
                  {[0.25, 0.375, 0.5, 0.75, 1.0, 1.5].map((inchVal) => (
                    <button
                      key={inchVal}
                      type="button"
                      onClick={() => handleThicknessChangeInches(inchVal)}
                      className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                    >
                      {inchVal}"
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 inline-flex items-center gap-1.5">
                  <span>
                    {unitSystem === 'metric'
                      ? (isAr ? 'تعزيز درزة اللحام (Crown/Root):' : 'Weld Reinforcement:')
                      : (isAr ? 'تعزيز درزة اللحام (بالبوصة):' : 'Weld Reinforcement (in):')}
                  </span>
                  <UnitConversionTooltip
                    testId="ge-tooltip-reinforcement"
                    isAr={isAr}
                    tooltipText={conversionFormulas.reinforcement}
                  />
                </span>
                <div className="flex items-center gap-2 font-mono">
                  {unitSystem === 'metric' ? (
                    <>
                      <span className="text-[11px] text-slate-400">({reinforcementInches} in)</span>
                      <strong className="text-sky-600 dark:text-sky-400">{weldReinforcementMm} mm</strong>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] text-slate-400">({weldReinforcementMm.toFixed(1)} mm)</span>
                      <strong className="text-amber-600 dark:text-amber-400">{reinforcementInches} in</strong>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  data-testid="ge-reinforcement-slider"
                  data-unit-mode={unitSystem}
                  min={0}
                  max={unitSystem === 'metric' ? 6.0 : 0.25}
                  step={unitSystem === 'metric' ? 0.5 : 0.01}
                  value={unitSystem === 'metric' ? weldReinforcementMm : reinforcementInches}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (unitSystem === 'metric') {
                      setWeldReinforcementMm(val);
                    } else {
                      handleReinforcementChangeInches(val);
                    }
                  }}
                  className={`w-full ${unitRangeAccentClass} cursor-pointer`}
                />
                <div className="flex items-center gap-1 shrink-0">
                  {unitSystem === 'metric' ? (
                    <input
                      type="number"
                      data-testid="ge-reinforcement-number-input"
                      data-unit-mode={unitSystem}
                      min={0}
                      max={6.0}
                      step={0.5}
                      value={weldReinforcementMm}
                      onChange={(e) => setWeldReinforcementMm(Math.max(0, Math.min(8.0, Number(e.target.value))))}
                      className={`w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                    />
                  ) : (
                    <input
                      type="number"
                      data-testid="ge-reinforcement-imperial-input"
                      data-unit-mode={unitSystem}
                      min={0}
                      max={0.25}
                      step={0.01}
                      value={reinforcementInches}
                      onChange={(e) => handleReinforcementChangeInches(Number(e.target.value))}
                      className={`w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                    />
                  )}
                  <span
                    data-testid="ge-unit-tag-reinforcement"
                    data-unit-mode={unitSystem}
                    className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${unitTagClass}`}
                  >
                    {unitSystem === 'metric' ? 'mm' : 'in'}
                  </span>
                </div>
              </div>
            </div>

            {/* Source to Film Distance (SFD) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 inline-flex items-center gap-1.5">
                  <span>
                    {unitSystem === 'metric'
                      ? (isAr ? 'المسافة البؤرية (SFD / FFD):' : 'Source-Film Distance (SFD):')
                      : (isAr ? 'المسافة البؤرية (SFD - بوصة/قدم):' : 'Source-Film Distance (SFD - in/ft):')}
                  </span>
                  <UnitConversionTooltip
                    testId="ge-tooltip-sfd"
                    isAr={isAr}
                    tooltipText={conversionFormulas.sfd}
                  />
                </span>
                <strong className={`font-mono ${unitSystem === 'metric' ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {unitSystem === 'metric' ? (
                    `${sfdCm} cm (${sfdInches} in / ${sfdFeet} ft)`
                  ) : (
                    `${sfdInches} in (${sfdFeet} ft) — ${sfdCm} cm`
                  )}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  data-testid="ge-sfd-slider"
                  data-unit-mode={unitSystem}
                  min={unitSystem === 'metric' ? 25 : 10}
                  max={unitSystem === 'metric' ? 150 : 60}
                  step={unitSystem === 'metric' ? 1 : 0.5}
                  value={unitSystem === 'metric' ? sfdCm : sfdInches}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (unitSystem === 'metric') {
                      setSfdCm(val);
                    } else {
                      handleSfdChangeInches(val);
                    }
                  }}
                  className={`w-full ${unitRangeAccentClass} cursor-pointer`}
                />
                <div className="flex items-center gap-1 shrink-0">
                  {unitSystem === 'metric' ? (
                    <input
                      type="number"
                      data-testid="ge-sfd-number-input"
                      data-unit-mode={unitSystem}
                      min={20}
                      max={200}
                      step={1}
                      value={sfdCm}
                      onChange={(e) => setSfdCm(Math.max(20, Math.min(200, Number(e.target.value))))}
                      className={`w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                      title={isAr ? 'أدخل المسافة بالسنتيمتر' : 'Enter distance in cm'}
                    />
                  ) : (
                    <input
                      type="number"
                      data-testid="ge-sfd-imperial-input"
                      data-unit-mode={unitSystem}
                      min={10}
                      max={80}
                      step={0.5}
                      value={sfdInches}
                      onChange={(e) => handleSfdChangeInches(Number(e.target.value))}
                      className={`w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                      title={isAr ? 'أدخل المسافة بالبوصة' : 'Enter distance in inches'}
                    />
                  )}
                  <span
                    data-testid="ge-unit-tag-sfd"
                    data-unit-mode={unitSystem}
                    className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${unitTagClass}`}
                  >
                    {unitSystem === 'metric' ? 'cm' : 'in'}
                  </span>
                </div>
              </div>
              {unitSystem === 'imperial' && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10px] font-mono text-slate-500">
                  <span className="text-slate-400">{isAr ? 'مسافات شائعة:' : 'Standard SFD:'}</span>
                  {[16, 20, 24, 28, 36, 48].map((inDist) => (
                    <button
                      key={inDist}
                      type="button"
                      onClick={() => handleSfdChangeInches(inDist)}
                      className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                    >
                      {inDist}"
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pipe Outer Diameter (if pipe geometry) */}
            {selectedTechnique.wallsPenetrated === 2 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 inline-flex items-center gap-1.5">
                    <span>
                      {unitSystem === 'metric'
                        ? (isAr ? 'القطر الخارجي للماسورة (OD):' : 'Pipe Outer Diameter (OD):')
                        : (isAr ? 'القطر الخارجي للماسورة (OD - بالبوصة):' : 'Pipe Outer Diameter (OD - in):')}
                    </span>
                    <UnitConversionTooltip
                      testId="ge-tooltip-pipe-od"
                      isAr={isAr}
                      tooltipText={conversionFormulas.pipeOd}
                    />
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    {unitSystem === 'metric' ? (
                      <>
                        <span className="text-[11px] text-slate-400">({pipeOdInches} in)</span>
                        <strong className="text-sky-600 dark:text-sky-400">{pipeOuterDiameterMm} mm</strong>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-400">({pipeOuterDiameterMm} mm)</span>
                        <strong className="text-amber-600 dark:text-amber-400">{pipeOdInches} in</strong>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    data-testid="ge-pipe-od-slider"
                    data-unit-mode={unitSystem}
                    min={unitSystem === 'metric' ? 25 : 1.0}
                    max={unitSystem === 'metric' ? 350 : 14.0}
                    step={unitSystem === 'metric' ? 5 : 0.25}
                    value={unitSystem === 'metric' ? pipeOuterDiameterMm : pipeOdInches}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (unitSystem === 'metric') {
                        setPipeOuterDiameterMm(val);
                      } else {
                        handlePipeOdChangeInches(val);
                      }
                    }}
                    className={`w-full ${unitRangeAccentClass} cursor-pointer`}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {unitSystem === 'metric' ? (
                      <input
                        type="number"
                        data-testid="ge-pipe-od-number-input"
                        data-unit-mode={unitSystem}
                        min={25}
                        max={350}
                        step={5}
                        value={pipeOuterDiameterMm}
                        onChange={(e) => setPipeOuterDiameterMm(Math.max(15, Math.min(400, Number(e.target.value))))}
                        className={`w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                      />
                    ) : (
                      <input
                        type="number"
                        data-testid="ge-pipe-od-imperial-input"
                        data-unit-mode={unitSystem}
                        min={1.0}
                        max={14.0}
                        step={0.25}
                        value={pipeOdInches}
                        onChange={(e) => handlePipeOdChangeInches(Number(e.target.value))}
                        className={`w-16 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-lg text-slate-900 dark:text-white text-end focus:outline-none`}
                      />
                    )}
                    <span
                      data-testid="ge-unit-tag-pipe-od"
                      data-unit-mode={unitSystem}
                      className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${unitTagClass}`}
                    >
                      {unitSystem === 'metric' ? 'mm' : 'in'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================
            COLUMN 3: FILM SELECTION (AGFA STRUCTURIX) & QUALITY CONTROL
        ================================================================= */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
            <span>{isAr ? '3. طبقات الفيلم ومواصفات الجودة' : '3. Film System & Multi-Film Loading'}</span>
          </div>

          {/* Film Loading Mode Segmented Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'ترتيب طبقات الفيلم (أحادي / مزدوج):' : 'Film Layering & Loading Mode:'}
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[11px] font-mono">
              <button
                type="button"
                data-testid="ge-film-loading-mode-single"
                onClick={() => setFilmLoadingMode('single')}
                className={`py-1.5 px-1 rounded-lg font-bold transition text-center cursor-pointer ${
                  filmLoadingMode === 'single'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'فيلم أحادي' : 'Single'}
              </button>
              <button
                type="button"
                data-testid="ge-film-loading-mode-dual-composite"
                onClick={() => setFilmLoadingMode('dual_composite')}
                className={`py-1.5 px-1 rounded-lg font-bold transition text-center cursor-pointer ${
                  filmLoadingMode === 'dual_composite'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'مزدوج متراكب' : 'Dual Comp.'}
              </button>
              <button
                type="button"
                data-testid="ge-film-loading-mode-dual-different"
                onClick={() => setFilmLoadingMode('dual_different')}
                className={`py-1.5 px-1 rounded-lg font-bold transition text-center cursor-pointer ${
                  filmLoadingMode === 'dual_different'
                    ? 'bg-sky-500 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'مزدوج مختلف' : 'Wide-Lat.'}
              </button>
            </div>
          </div>

          {/* Primary Film (Front Film 1) Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {filmLoadingMode === 'single'
                ? (isAr ? 'فيلم أجفا ستراكتركس (Agfa Structurix):' : 'Agfa Structurix Film System:')
                : (isAr ? 'الفيلم الأمامي الأول (Front Film 1):' : 'Primary Film (Front Film 1):')}
            </label>
            <select
              data-testid="ge-select-film"
              data-unit-mode={unitSystem}
              value={filmId}
              onChange={(e) => setFilmId(e.target.value as GeFilmId)}
              className={`w-full bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer`}
            >
              {(Object.keys(GE_STRUCTURIX_FILMS) as GeFilmId[]).map((fKey) => {
                const f = GE_STRUCTURIX_FILMS[fKey];
                return (
                  <option key={fKey} value={fKey}>
                    {f.code} — {f.speedRating} (ASTM {f.astmClass})
                  </option>
                );
              })}
            </select>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
              {isAr ? selectedFilm.nameAr : selectedFilm.nameEn}
            </span>
          </div>

          {/* Dual Composite Note (ASME Section V T-282.1) */}
          {filmLoadingMode === 'dual_composite' && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono space-y-1">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>ASME Sec V T-282.1 Superimposed Viewing</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                {isAr
                  ? 'يتم تحميل فيلمين متطابقين في نفس الكاسيت وقراءتهما متطابقين؛ تجمع الكثافات الضوئية مما يخفض وقت التعريض بنسبة 45% (معامل 0.55×).'
                  : 'Two identical films exposed together and viewed superimposed. Densities sum (D = D1 + D2), reducing required exposure time by ~45% (0.55x factor).'}
              </p>
              <div className="text-[10px] text-amber-500 font-bold pt-0.5">
                D₁ ({calcResult.film1PredictedDensity.toFixed(2)}) + D₂ ({calcResult.film2PredictedDensity?.toFixed(2)}) = {calcResult.compositeSuperimposedDensity?.toFixed(2)} H&D
              </div>
            </div>
          )}

          {/* Dual Different (Wide-Latitude) Controls */}
          {filmLoadingMode === 'dual_different' && (
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs space-y-3 font-mono">
              {/* Secondary Film (Back Film 2) Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'الفيلم الخلفي الثاني (Back Film 2):' : 'Secondary Film (Back Film 2):'}
                </label>
                <select
                  data-testid="ge-select-secondary-film"
                  data-unit-mode={unitSystem}
                  value={secondaryFilmId}
                  onChange={(e) => setSecondaryFilmId(e.target.value as GeFilmId)}
                  className={`w-full bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer`}
                >
                  {(Object.keys(GE_STRUCTURIX_FILMS) as GeFilmId[]).map((fKey) => {
                    const f = GE_STRUCTURIX_FILMS[fKey];
                    return (
                      <option key={fKey} value={fKey}>
                        {f.code} — {f.speedRating} (ASTM {f.astmClass})
                      </option>
                    );
                  })}
                </select>
                <div className="text-[10px] text-sky-600 dark:text-sky-400">
                  {calcResult.speedRatioDescription}
                </div>
              </div>

              {/* Interleaf Screen Toggle */}
              <label className={`flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border ${unitInputBorderClass} cursor-pointer`}>
                <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                  {isAr ? 'شاشة رصاص وسيطة (0.025mm Pb Interleaf)' : 'Interleaf Lead Foil Screen (0.025mm Pb)'}
                </span>
                <input
                  type="checkbox"
                  data-testid="ge-interleaf-screen-toggle"
                  data-unit-mode={unitSystem}
                  checked={hasInterleafScreen}
                  onChange={(e) => setHasInterleafScreen(e.target.checked)}
                  className={`w-4 h-4 ${unitRangeAccentClass} rounded cursor-pointer`}
                />
              </label>

              {/* Governing Strategy Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'معيار توجيه زمن التعريض:' : 'Governing Exposure Strategy:'}
                </label>
                <select
                  data-testid="ge-select-wide-latitude-gov"
                  data-unit-mode={unitSystem}
                  value={wideLatitudeGov}
                  onChange={(e) => setWideLatitudeGov(e.target.value as GeWideLatitudeGoverning)}
                  className={`w-full bg-white dark:bg-slate-900 border ${unitInputBorderClass} rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer`}
                >
                  <option value="primary_film">{isAr ? 'الفيلم الأمامي هو الحاكم (Primary)' : 'Primary Film Governs (Front Film)'}</option>
                  <option value="secondary_film">{isAr ? 'الفيلم الخلفي هو الحاكم (Secondary)' : 'Secondary Film Governs (Back Film)'}</option>
                  <option value="balanced_latitude">{isAr ? 'توازن المدى التبايني (Balanced Mean)' : 'Balanced Wide-Latitude Strategy'}</option>
                </select>
              </div>

              {/* Density comparison preview */}
              <div className="text-[10px] text-slate-500 pt-1 border-t border-sky-500/20 flex justify-between">
                <span>Front F1 D: ~{calcResult.film1PredictedDensity.toFixed(2)}</span>
                <span>Back F2 D: ~{calcResult.film2PredictedDensity?.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Film Properties Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? 'تصنيف ISO / ASTM:' : 'ISO / ASTM Class:'}</span>
              <strong className="text-slate-800 dark:text-slate-200">{selectedFilm.isoClass} / {selectedFilm.astmClass}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? 'معامل التعريض النسبي:' : 'Relative Exposure Factor:'}</span>
              <strong className="text-amber-500">×{selectedFilm.relativeExposureFactor}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? 'البدائل التجارية المماثلة:' : 'Equivalent Brands:'}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{selectedFilm.commercialEquivalents}</span>
            </div>
          </div>

          {/* Target Optical Density Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{isAr ? 'الكثافة البصرية المستهدفة (H&D):' : 'Target Optical Density (H&D):'}</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{targetOpticalDensity.toFixed(1)} H&D</strong>
            </div>
            <input
              type="range"
              data-testid="ge-density-slider"
              data-unit-mode={unitSystem}
              min={1.8}
              max={3.8}
              step={0.1}
              value={targetOpticalDensity}
              onChange={(e) => setTargetOpticalDensity(Number(e.target.value))}
              className={`w-full ${unitRangeAccentClass} cursor-pointer`}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>2.0 Min (ASME)</span>
              <span>2.5 Standard</span>
              <span>4.0 Max</span>
            </div>
          </div>

          {/* Quality Accessories Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <label className={`flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border ${unitInputBorderClass} cursor-pointer`}>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isAr ? 'شاشات الرصاص (0.125F / 0.25B Pb)' : 'Lead Intensifying Screens (Pb)'}
              </span>
              <input
                type="checkbox"
                data-testid="ge-lead-screens-toggle"
                data-unit-mode={unitSystem}
                checked={hasLeadScreens}
                onChange={(e) => setHasLeadScreens(e.target.checked)}
                className={`w-4 h-4 ${unitRangeAccentClass} rounded cursor-pointer`}
              />
            </label>

            <label className={`flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border ${unitInputBorderClass} cursor-pointer`}>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isAr ? 'حاجب الكوليماتور تنجستن (Collimator)' : 'Tungsten Collimator Shield'}
              </span>
              <input
                type="checkbox"
                data-testid="ge-collimator-toggle"
                data-unit-mode={unitSystem}
                checked={hasCollimator}
                onChange={(e) => setHasCollimator(e.target.checked)}
                className={`w-4 h-4 ${unitRangeAccentClass} rounded cursor-pointer`}
              />
            </label>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          LIVE EXPOSURE PATH & BEAM INTENSITY DECAY OVERLAY
      ------------------------------------------------------------------- */}
      {(() => {
        const pathLeft = 196;
        const pathWidth = 396;
        const plotTop = 46;
        const plotBottom = 226;
        const plotHeight = plotBottom - plotTop;
        const sourceCenterX = 46;
        const sourceCenterY = 136;
        const filmPlaneX = pathLeft + pathWidth + 14;

        const normToX = (normX: number) => pathLeft + normX * pathWidth;
        const intensityToY = (pct: number) => plotBottom - (Math.max(0, Math.min(100, pct)) / 100) * plotHeight;

        const curveD = beamDecayProfile.points
          .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${normToX(pt.normX).toFixed(1)} ${intensityToY(pt.intensityPct).toFixed(1)}`)
          .join(' ');
        const areaD = `${curveD} L ${normToX(1).toFixed(1)} ${plotBottom} L ${normToX(0).toFixed(1)} ${plotBottom} Z`;

        const activePoint = beamDecayProbePoint ?? beamDecayProfile.points[beamDecayProfile.points.length - 1];
        const probeSvgX = beamDecayProbePoint ? normToX(beamDecayProbePoint.normX) : null;
        const probeSvgY = beamDecayProbePoint ? intensityToY(beamDecayProbePoint.intensityPct) : null;

        const handlePointerInspect = (e: React.MouseEvent<SVGRectElement>) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (rect.width > 0) {
            const relX = (e.clientX - rect.left) / rect.width;
            setBeamHoverNormX(Math.max(0, Math.min(1, relX)));
          } else {
            // Deterministic fallback in headless/JSDOM layouts without layout geometry
            const fallbackNorm = e.clientX > 0 ? Math.max(0, Math.min(1, (e.clientX - pathLeft) / pathWidth)) : 0.5;
            setBeamHoverNormX(fallbackNorm);
          }
        };

        const matBaseFill =
          materialId === 'copper_brass'
            ? 'rgba(217, 119, 6, 0.22)'
            : materialId === 'aluminum'
              ? 'rgba(148, 163, 184, 0.22)'
              : materialId === 'titanium'
                ? 'rgba(167, 139, 250, 0.20)'
                : 'rgba(56, 189, 248, 0.16)';

        const formatLen = (mmVal: number) =>
          unitSystem === 'imperial' ? `${(mmVal / 25.4).toFixed(3)}"` : `${mmVal.toFixed(1)} mm`;

        return (
          <div
            data-testid="ge-beam-intensity-decay-overlay"
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 space-y-4"
          >
            {/* Header & Quantitative Telemetry Strip */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {isAr
                      ? 'المحاكاة الحية لمسار الإشعاع وتوهين شدة الحزمة عبر سُمك المعدن'
                      : 'Live Exposure Path & Beam Intensity Decay Overlay'}
                  </span>
                  {isTimerRunning && (
                    <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-500 dark:text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                      {isAr ? 'بث حي' : 'Beam Active'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  I(x) = I₀ · 0.5^(x_eq / HVL) · {selectedIsotope.chemicalSymbol} (HVL {formatLen(beamDecayProfile.effectiveHvlMm)}) ·{' '}
                  {selectedMaterial.nameEn.split('(')[0].trim()} (R={beamDecayProfile.rFactor.toFixed(2)}) ·{' '}
                  {beamDecayProfile.wallsPenetrated === 2 ? (isAr ? 'جدار مزدوج' : '2-Wall Path') : isAr ? 'جدار مفرد' : '1-Wall Path'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">
                    {isAr ? 'معامل التوهين μ' : 'Linear μ (Steel)'}
                  </span>
                  <strong data-testid="ge-beam-decay-mu" className="text-sky-600 dark:text-sky-400 tabular-nums">
                    {beamDecayProfile.muSteelPerMm.toFixed(4)} mm⁻¹
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">
                    {isAr ? 'طبقات النصف (HVL)' : 'Penetrated HVLs'}
                  </span>
                  <strong data-testid="ge-beam-decay-hvl-count" className="text-amber-600 dark:text-amber-400 tabular-nums">
                    {beamDecayProfile.totalHvlCount.toFixed(2)} HVL
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">
                    {isAr ? 'الشدة الخارجة للفيلم' : 'Exit Intensity I/I₀'}
                  </span>
                  <strong data-testid="ge-beam-decay-exit-pct" className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {beamDecayProfile.exitIntensityPct.toFixed(2)}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Interactive SVG Exposure Path + Overlaid Decay Curve */}
            <div className="relative overflow-x-auto rounded-2xl bg-slate-950 border border-slate-800 p-3 sm:p-4">
              {/* Live Scrubbing / Exit Probe HUD */}
              <div
                data-testid="ge-beam-decay-probe-hud"
                className="flex flex-wrap items-center justify-between gap-2 mb-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono"
              >
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">
                    {beamDecayProbePoint
                      ? isAr
                        ? 'فحص العمق المباشر:'
                        : 'Cursor Depth Probe:'
                      : isAr
                        ? 'ملخص الخروج عند الفيلم (مرر المؤشر على المسار للفحص):'
                        : 'Exit Plane Readout (hover path to scrub depth):'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 tabular-nums">
                  <span className="text-slate-300">
                    {isAr ? 'العمق:' : 'Depth:'}{' '}
                    <strong className="text-white">{formatLen(activePoint.physicalDepthMm)}</strong>
                  </span>
                  <span className="text-slate-300">
                    {isAr ? 'مكافئ الصلب:' : 'Eq. Steel:'}{' '}
                    <strong className="text-sky-400">{formatLen(activePoint.effectiveSteelDepthMm)}</strong>
                  </span>
                  <span className="text-slate-300">
                    HVL: <strong className="text-amber-400">{activePoint.hvlAtDepth.toFixed(2)}</strong>
                  </span>
                  <span className="text-slate-300">
                    I(x)/I₀: <strong className="text-emerald-400">{activePoint.intensityPct.toFixed(2)}%</strong>
                  </span>
                  {activePoint.inCavity && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px]">
                      {isAr ? 'تجويف هوائي (لا توهين)' : 'Pipe Bore (0 attenuation)'}
                    </span>
                  )}
                </div>
              </div>

              <svg
                data-testid="ge-beam-decay-svg"
                viewBox="0 0 780 282"
                className="w-full h-auto min-w-[600px] select-none"
                role="img"
                aria-label={isAr ? 'مخطط مسار الإشعاع وتوهين شدة الحزمة' : 'Radiographic exposure path and beam intensity decay graph'}
              >
                <defs>
                  {/* Exponential beam brightness attenuation gradient mapped cleanly to curve points */}
                  <linearGradient id="geBeamPathAttenuationGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    {beamDecayProfile.points
                      .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % 6 === 0)
                      .map((pt, idx) => (
                        <stop
                          key={`${pt.normX}-${idx}`}
                          offset={`${(pt.normX * 100).toFixed(1)}%`}
                          stopColor="#f59e0b"
                          stopOpacity={Math.max(0.06, Math.min(0.52, (pt.intensityPct / 100) * 0.52)).toFixed(3)}
                        />
                      ))}
                  </linearGradient>

                  {/* SFD air-gap beam cone gradient */}
                  <linearGradient id="geSfdConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={isTimerRunning ? '0.68' : '0.45'} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={isTimerRunning ? '0.38' : '0.24'} />
                  </linearGradient>

                  {/* Under-curve exponential area fill */}
                  <linearGradient id="geDecayAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.34" />
                    <stop offset="65%" stopColor="#0ea5e9" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Zone Headers */}
                <text x="95" y="18" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {sourceType.startsWith('xray') ? 'X-RAY TUBE & SFD' : 'ISOTOPE SOURCE & SFD'}
                </text>
                <text x={pathLeft + pathWidth / 2} y="18" fill="#e2e8f0" fontSize="10.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {isAr ? 'مقطع المعدن + منحنى توهين شدة الحزمة' : 'MATERIAL CROSS-SECTION + BEAM DECAY OVERLAY'}
                </text>
                <text x="688" y="18" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {hasLeadScreens ? 'Pb + FILM' : 'FILM CASSETTE'}
                </text>

                {/* LEFT ZONE: Source Focal Spot, Tungsten Collimator, & SFD Beam Fan */}
                <polygon
                  points={
                    hasCollimator
                      ? `${sourceCenterX},${sourceCenterY} ${pathLeft},${plotTop + 6} ${pathLeft},${plotBottom - 6}`
                      : `${sourceCenterX},${sourceCenterY} ${pathLeft},${plotTop - 10} ${pathLeft},${plotBottom + 10}`
                  }
                  fill="url(#geSfdConeGrad)"
                />

                {/* Animated Radiation Photon Stream Lines inside SFD cone */}
                <g data-testid="ge-beam-photon-stream">
                  {[-0.65, 0, 0.65].map((rayOffset, idx) => {
                    const targetY = sourceCenterY + rayOffset * (hasCollimator ? 64 : 84);
                    return (
                      <line
                        key={idx}
                        x1={sourceCenterX + 10}
                        y1={sourceCenterY}
                        x2={pathLeft}
                        y2={targetY}
                        stroke="#fbbf24"
                        strokeWidth={idx === 1 ? '1.8' : '1.1'}
                        strokeDasharray="6 6"
                        opacity={isTimerRunning ? 0.95 : 0.65}
                        className={idx === 1 ? 'ut-beam-flow' : 'ut-beam-flow-delayed'}
                      />
                    );
                  })}
                </g>

                {/* Tungsten Collimator Jaws (when enabled) */}
                {hasCollimator && (
                  <g data-testid="ge-beam-collimator-jaws">
                    <rect x="68" y={plotTop - 4} width="14" height="58" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                    <rect x="68" y={plotBottom - 54} width="14" height="58" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                    <text x="75" y={plotTop - 9} fill="#cbd5e1" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                      W-Coll
                    </text>
                  </g>
                )}

                {/* Focal Spot Emitter Housing */}
                <circle
                  cx={sourceCenterX}
                  cy={sourceCenterY}
                  r={isTimerRunning ? '18' : '14'}
                  fill="#f59e0b"
                  opacity={isTimerRunning ? '0.28' : '0.16'}
                  className={isTimerRunning ? 'ut-beam-cone-pulse' : undefined}
                />
                <circle cx={sourceCenterX} cy={sourceCenterY} r="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                <circle cx={sourceCenterX} cy={sourceCenterY} r="3.5" fill="#fbbf24" />
                <text x={sourceCenterX} y={sourceCenterY + 26} fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {selectedIsotope.chemicalSymbol}
                </text>
                <text x={sourceCenterX} y={sourceCenterY + 38} fill="#94a3b8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                  {sourceType.startsWith('xray') ? `${tubeKv}kV` : `${calcResult.currentLiveActivityCi}Ci`}
                </text>

                {/* SFD Dimension Span */}
                <line x1={sourceCenterX} y1="252" x2={filmPlaneX} y2="252" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={sourceCenterX} y1="246" x2={sourceCenterX} y2="258" stroke="#64748b" strokeWidth="1.5" />
                <line x1={filmPlaneX} y1="246" x2={filmPlaneX} y2="258" stroke="#64748b" strokeWidth="1.5" />
                <rect x="290" y="243" width="146" height="16" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="363" y="254" fill="#e2e8f0" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
                  SFD: {unitSystem === 'imperial' ? `${sfdInches}"` : `${sfdCm} cm`} · t_eq: {formatLen(beamDecayProfile.effectiveSteelThicknessMm)}
                </text>

                {/* CENTER ZONE: Material Cross-Section Segments + Pipe Bore + Weld Cap */}
                {beamDecayProfile.wallSegments.map((seg) => {
                  const segX = normToX(seg.startNorm);
                  const segW = (seg.endNorm - seg.startNorm) * pathWidth;
                  const isCavity = seg.id === 'cavity';
                  const isWeld = seg.id === 'weld_cap';
                  return (
                    <g key={seg.id} data-testid={`ge-beam-segment-${seg.id}`}>
                      <rect
                        x={segX}
                        y={plotTop}
                        width={segW}
                        height={plotHeight}
                        fill={isCavity ? 'rgba(15, 23, 42, 0.72)' : isWeld ? 'rgba(245, 158, 11, 0.16)' : matBaseFill}
                        stroke={isCavity ? '#334155' : isWeld ? '#d97706' : '#475569'}
                        strokeWidth="1"
                        strokeDasharray={isCavity ? '4 3' : undefined}
                      />
                      {/* Weld crown profile indicator on exit face */}
                      {isWeld && (
                        <path
                          d={`M ${segX} ${plotTop + 18} Q ${segX + segW + 6} ${sourceCenterY} ${segX} ${plotBottom - 18}`}
                          fill="rgba(245, 158, 11, 0.18)"
                          stroke="#f59e0b"
                          strokeWidth="1.2"
                          opacity="0.7"
                        />
                      )}
                      {segW >= 36 && (
                        <text
                          x={segX + segW / 2}
                          y={plotTop - 7}
                          fill={isCavity ? '#38bdf8' : isWeld ? '#fbbf24' : '#cbd5e1'}
                          fontSize="8.5"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {isAr ? seg.labelAr : seg.labelEn}
                        </text>
                      )}
                      {segW >= 42 && (
                        <text
                          x={segX + segW / 2}
                          y={plotBottom + 13}
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {isCavity ? 'Air Gap' : formatLen(seg.physicalThicknessMm)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Overlaid Beam Attenuation Gradient Beam inside Material */}
                <rect
                  data-testid="ge-beam-attenuation-cone"
                  x={pathLeft}
                  y={plotTop + 10}
                  width={pathWidth}
                  height={plotHeight - 20}
                  fill="url(#geBeamPathAttenuationGrad)"
                  pointerEvents="none"
                />

                {/* Animated Traveling Photon Stream Across Material */}
                <line
                  x1={pathLeft}
                  y1={sourceCenterY}
                  x2={filmPlaneX}
                  y2={sourceCenterY}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="5 7"
                  opacity={Math.max(0.28, Math.min(0.85, beamDecayProfile.exitIntensityPct / 100 + 0.25))}
                  className="ut-beam-flow"
                  pointerEvents="none"
                />

                {/* Intensity Horizontal Reference Grid (100%, 50%, 25%, 10%, 0%) */}
                {[
                  { pct: 100, label: '100%' },
                  { pct: 50, label: '50% (1 HVL)' },
                  { pct: 25, label: '25%' },
                  { pct: 10, label: '10% (TVL)' },
                  { pct: 0, label: '0%' }
                ].map((tick) => {
                  const yPos = intensityToY(tick.pct);
                  return (
                    <g key={tick.pct}>
                      <line
                        x1={pathLeft}
                        y1={yPos}
                        x2={pathLeft + pathWidth}
                        y2={yPos}
                        stroke={tick.pct === 50 ? '#38bdf8' : '#334155'}
                        strokeWidth={tick.pct === 50 ? '1' : '0.8'}
                        strokeDasharray={tick.pct === 0 || tick.pct === 100 ? undefined : '3 3'}
                        opacity={tick.pct === 50 ? 0.55 : 0.45}
                      />
                      <text
                        x={pathLeft - 5}
                        y={yPos + 3}
                        fill={tick.pct === 50 ? '#38bdf8' : '#94a3b8'}
                        fontSize="8.5"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                {/* HVL Milestone Vertical Markers */}
                {beamDecayProfile.hvlMarkers.map((marker) => {
                  const mx = normToX(marker.normX);
                  const my = intensityToY(marker.intensityPct);
                  return (
                    <g key={marker.hvlIndex} data-testid={`ge-beam-hvl-marker-${marker.hvlIndex}`}>
                      <line x1={mx} y1={plotTop} x2={mx} y2={plotBottom} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <circle cx={mx} cy={my} r="3" fill="#38bdf8" stroke="#020617" strokeWidth="1.2" />
                      <text x={mx} y={plotBottom - 5} fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {marker.hvlIndex}HVL
                      </text>
                    </g>
                  );
                })}

                {/* Overlaid Exponential Beam Intensity Decay Curve + Area Fill */}
                <path d={areaD} fill="url(#geDecayAreaGrad)" pointerEvents="none" />
                <path
                  data-testid="ge-beam-decay-curve-path"
                  d={curveD}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pointerEvents="none"
                />

                {/* Entry (100%) and Exit Dots */}
                <circle cx={normToX(0)} cy={intensityToY(100)} r="4" fill="#fbbf24" stroke="#020617" strokeWidth="1.5" />
                <circle
                  data-testid="ge-beam-decay-exit-dot"
                  cx={normToX(1)}
                  cy={intensityToY(beamDecayProfile.exitIntensityPct)}
                  r="4.5"
                  fill="#10b981"
                  stroke="#020617"
                  strokeWidth="1.5"
                />

                {/* Interactive Crosshair Probe when Hovering/Scrubbing */}
                {probeSvgX !== null && probeSvgY !== null && beamDecayProbePoint && (
                  <g pointerEvents="none">
                    <line
                      data-testid="ge-beam-decay-hover-line"
                      x1={probeSvgX}
                      y1={plotTop}
                      x2={probeSvgX}
                      y2={plotBottom}
                      stroke="#e2e8f0"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                    />
                    <circle cx={probeSvgX} cy={probeSvgY} r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.8" />
                    <rect
                      x={Math.min(pathLeft + pathWidth - 110, Math.max(pathLeft + 4, probeSvgX + 8))}
                      y={Math.max(plotTop + 4, probeSvgY - 26)}
                      width="106"
                      height="22"
                      rx="4"
                      fill="#0f172a"
                      stroke="#fbbf24"
                      strokeWidth="1"
                    />
                    <text
                      x={Math.min(pathLeft + pathWidth - 110, Math.max(pathLeft + 4, probeSvgX + 8)) + 53}
                      y={Math.max(plotTop + 4, probeSvgY - 26) + 14}
                      fill="#fbbf24"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {beamDecayProbePoint.intensityPct.toFixed(1)}% · {beamDecayProbePoint.hvlAtDepth.toFixed(2)} HVL
                    </text>
                  </g>
                )}

                {/* Transparent Scrubbing Interaction Layer */}
                <rect
                  data-testid="ge-beam-decay-interaction-layer"
                  x={pathLeft}
                  y={plotTop}
                  width={pathWidth}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseMove={handlePointerInspect}
                  onClick={handlePointerInspect}
                  onMouseLeave={() => setBeamHoverNormX(null)}
                />

                {/* RIGHT ZONE: Lead Screens & Film Cassette Stack + Exit Telemetry */}
                <g>
                  {hasLeadScreens && (
                    <rect x={filmPlaneX} y={plotTop + 8} width="6" height={plotHeight - 16} rx="1" fill="#64748b" stroke="#94a3b8" strokeWidth="0.8" />
                  )}
                  <rect
                    x={filmPlaneX + (hasLeadScreens ? 8 : 0)}
                    y={plotTop + 8}
                    width="9"
                    height={plotHeight - 16}
                    rx="1.5"
                    fill="#10b981"
                    fillOpacity="0.32"
                    stroke="#10b981"
                    strokeWidth="1.2"
                  />
                  {calcResult.isMultiFilm && (
                    <>
                      {hasInterleafScreen && (
                        <rect
                          x={filmPlaneX + (hasLeadScreens ? 19 : 11)}
                          y={plotTop + 8}
                          width="3.5"
                          height={plotHeight - 16}
                          fill="#94a3b8"
                        />
                      )}
                      <rect
                        x={filmPlaneX + (hasLeadScreens ? (hasInterleafScreen ? 24 : 19) : hasInterleafScreen ? 16 : 11)}
                        y={plotTop + 8}
                        width="8"
                        height={plotHeight - 16}
                        rx="1.5"
                        fill="#38bdf8"
                        fillOpacity="0.32"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                      />
                    </>
                  )}
                  {hasLeadScreens && (
                    <rect
                      x={filmPlaneX + (calcResult.isMultiFilm ? (hasInterleafScreen ? 34 : 29) : 19)}
                      y={plotTop + 8}
                      width="6"
                      height={plotHeight - 16}
                      rx="1"
                      fill="#64748b"
                      stroke="#94a3b8"
                      strokeWidth="0.8"
                    />
                  )}

                  {/* Exit Readout Box */}
                  <rect x="656" y="72" width="112" height="128" rx="8" fill="#0f172a" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="712" y="92" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    {isAr ? 'الشدة الواصلة للفيلم' : 'TRANSMITTED'}
                  </text>
                  <text x="712" y="114" fill="#10b981" fontSize="16" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    {beamDecayProfile.exitIntensityPct.toFixed(1)}%
                  </text>
                  <line x1="668" y1="124" x2="756" y2="124" stroke="#1e293b" strokeWidth="1" />
                  <text x="712" y="140" fill="#cbd5e1" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    1 / {calcResult.attenuationFactor}× Beam
                  </text>
                  <text x="712" y="156" fill="#38bdf8" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    {selectedFilm.code.replace('Structurix ', '')}
                    {calcResult.isMultiFilm && calcResult.secondaryFilmSpec
                      ? ` + ${calcResult.secondaryFilmSpec.code.replace('Structurix ', '')}`
                      : ''}
                  </text>
                  <text x="712" y="172" fill="#fbbf24" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
                    Target {targetOpticalDensity.toFixed(1)} H&D
                  </text>
                  <text x="712" y="188" fill={calcResult.passesAsmeUg ? '#34d399' : '#f87171'} fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                    Ug {calcResult.calculatedUgMm}mm {calcResult.passesAsmeUg ? 'PASS' : 'FAIL'}
                  </text>
                </g>
              </svg>
            </div>
          </div>
        );
      })()}

      {/* -------------------------------------------------------------------
          INTERACTIVE D3 ISOTOPE DECAY CURVE & SHOT DATE MARKER
      ------------------------------------------------------------------- */}
      <IsotopeDecayCurveChart
        isotope={selectedIsotope}
        initialActivityCi={initialActivityCi}
        initialCalibrationDate={initialCalibrationDate}
        measurementDate={measurementDate}
        onChangeMeasurementDate={setMeasurementDate}
        language={language}
      />

      {/* -------------------------------------------------------------------
          INTERACTIVE SVG EXPOSURE vs. THICKNESS CHARTS
      ------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'منحنى زمن التعريض مقابل السُمك (GE Characteristic Curves)' : 'Exposure Time vs. Thickness Curve (GE Characteristic Curves)'}</span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {selectedIsotope.nameEn} · {selectedFilm.code} · SFD {sfdCm}cm
          </span>
        </div>

        {/* SVG Curve Graphic */}
        <div className="relative overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
          <svg viewBox="0 0 700 180" className="w-full h-auto min-w-[500px]">
            {/* Grid Lines */}
            {[40, 80, 120, 160].map((y) => (
              <line key={y} x1="40" x2="680" y1={y} y2={y} stroke="#334155" strokeDasharray="3 3" opacity={0.3} />
            ))}

            {/* Thickness axis */}
            <line x1="40" x2="680" y1="160" y2="160" stroke="#475569" strokeWidth="1.5" />
            <line x1="40" x2="40" y1="20" y2="160" stroke="#475569" strokeWidth="1.5" />

            {/* Axis labels */}
            <text x="670" y="152" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
              Thickness (mm) →
            </text>
            <text x="50" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              ↑ Time (seconds)
            </text>

            {/* D7 and D4 reference curves */}
            <path
              d="M 50 150 Q 200 135 350 100 T 650 30"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2"
              opacity="0.5"
            />
            <path
              d="M 50 155 Q 200 145 350 120 T 650 65"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              opacity="0.5"
            />

            {/* Active operating point */}
            <circle
              cx={Math.min(650, Math.max(60, 50 + (calcResult.effectiveSteelThicknessMm / 50) * 300))}
              cy={Math.max(30, Math.min(150, 160 - (calcResult.calculatedTotalSeconds / 600) * 120))}
              r="6"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
              className="animate-pulse"
            />
            <text
              x={Math.min(620, Math.max(70, 65 + (calcResult.effectiveSteelThicknessMm / 50) * 300))}
              y={Math.max(26, Math.min(145, 155 - (calcResult.calculatedTotalSeconds / 600) * 120))}
              fill="#f59e0b"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              Current: {calcResult.formattedDuration} ({calcResult.effectiveSteelThicknessMm}mm)
            </text>
          </svg>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          PRINTABLE TECHNIQUE SHEET MODAL (ASME SECTION V ARTICLE 2)
      ------------------------------------------------------------------- */}
      {showTechniqueSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? 'كارت تقنية التصوير الإشعاعي (ASME Sec V Technique Card)' : 'ASME Sec V Article 2 Radiographic Technique Card'}
                </h3>
              </div>
              <button
                onClick={() => setShowTechniqueSheetModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Technique Card Body */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                <span>GOVERNING STANDARD:</span>
                <span className="font-bold text-amber-500">ASME Section V Article 2 / Section VIII Div 1</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>SOURCE: {selectedIsotope.nameEn}</div>
                <div>ACTIVITY: {calcResult.currentLiveActivityCi} Ci (Decayed)</div>
                <div>MATERIAL: {selectedMaterial.nameEn}</div>
                <div>
                  THICKNESS: {materialThicknessMm} mm ({thicknessInches} in) (+{weldReinforcementMm}mm / {reinforcementInches}" reinf.)
                </div>
                <div>TECHNIQUE: {selectedTechnique.nameEn}</div>
                <div>
                  SFD: {sfdCm} cm ({sfdInches} in / {sfdFeet} ft)
                </div>
                <div>
                  FILM LOADING:{' '}
                  {calcResult.isMultiFilm
                    ? (calcResult.filmLoadingMode === 'dual_composite' ? 'Dual Composite (ASME T-282.1)' : 'Dual Wide-Latitude')
                    : 'Single Film'}
                </div>
                <div>
                  PRIMARY FILM: {calcResult.primaryFilmSpec.code} ({calcResult.primaryFilmSpec.astmClass})
                </div>
                {calcResult.isMultiFilm && (
                  <div>
                    SECONDARY FILM: {calcResult.secondaryFilmSpec?.code} ({calcResult.secondaryFilmSpec?.astmClass})
                  </div>
                )}
                {calcResult.isMultiFilm && (
                  <div>INTERLEAF SCREEN: {calcResult.hasInterleafLeadScreen ? '0.025mm Pb Foil' : 'None'}</div>
                )}
                <div>
                  TARGET DENSITY: {targetOpticalDensity.toFixed(1)} H&D
                  {calcResult.isMultiFilm ? ` (Comp: ${calcResult.compositeSuperimposedDensity?.toFixed(2)})` : ''}
                </div>
                <div>LEAD SCREENS: Front 0.125mm / Back 0.25mm Pb</div>
                <div>IQI WIRE: {calcResult.essentialWireIdentity} (Ø {calcResult.essentialWireDiameterMm}mm)</div>
                <div>
                  CALCULATED Ug: {calcResult.calculatedUgMm} mm ({(calcResult.calculatedUgMm / 25.4).toFixed(4)} in) ({calcResult.passesAsmeUg ? 'PASS' : 'FAIL'})
                </div>
                <div className="font-bold text-emerald-500">EXPOSURE: {calcResult.formattedDuration}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="ge-modal-export-pdf-btn"
                onClick={handleExportPdfReport}
                disabled={isExportingPdf}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? (isAr ? 'جاري التصدير...' : 'Exporting...') : (isAr ? 'تصدير تقرير PDF' : 'Export PDF Report')}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة الكارت' : 'Print Card'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTechniqueSheetModal(false)}
                className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
