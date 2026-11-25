import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import * as d3 from 'd3';
import { animate, AnimatePresence, motion } from 'motion/react';
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
  Crosshair,
  Eye,
  EyeOff,
  Search,
  Waves
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
  generateGeConversionLogPdf,
  GeRadiographicPdfReportData,
  GeConversionLogPdfReportData
} from '../../../utils/geRadiographicExposurePdfGenerator';
import { IsotopeDecayCurveChart } from './IsotopeDecayCurveChart';
import { LongitudinalWavePenetrationSim } from './LongitudinalWavePenetrationSim';

export type GeUnitSystem = 'metric' | 'imperial';

export type GePresetId =
  | 'pipe_2in_ir'
  | 'pipe_6in_ir'
  | 'plate_se75'
  | 'vessel_co60'
  | 'tube_xray';

export type GePresetCategoryId = 'pipe' | 'plate' | 'vessel' | 'xray';

export interface GePresetCategoryMeta {
  id: GePresetCategoryId;
  labelEn: string;
  labelAr: string;
}

export interface GeIndustryPresetMeta {
  id: GePresetId;
  testId: string;
  category: GePresetCategoryId;
  labelEn: string;
  labelAr: string;
  sourceLabel: string;
  searchKeywords: string;
}

export const GE_PRESET_CATEGORIES: GePresetCategoryMeta[] = [
  { id: 'pipe', labelEn: 'Pipe', labelAr: 'أنابيب' },
  { id: 'plate', labelEn: 'Plate', labelAr: 'ألواح' },
  { id: 'vessel', labelEn: 'Vessel', labelAr: 'أوعية ضغط' },
  { id: 'xray', labelEn: 'X-Ray', labelAr: 'أشعة سينية' }
];

export const GE_INDUSTRY_PRESETS: GeIndustryPresetMeta[] = [
  {
    id: 'pipe_2in_ir',
    testId: 'preset-pipe-2in',
    category: 'pipe',
    labelEn: '2" Pipe Elliptical (Ir-192 DWDI)',
    labelAr: 'أنبوب 2 بوصة بيضاوي (Ir-192 DWDI)',
    sourceLabel: 'Ir-192',
    searchKeywords: '2 pipe elliptical ir192 ir-192 iridium dwdi'
  },
  {
    id: 'pipe_6in_ir',
    testId: 'preset-pipe-6in',
    category: 'pipe',
    labelEn: '6" Pipe Contact (Ir-192 DWSI)',
    labelAr: 'أنبوب 6 بوصة ملامس (Ir-192 DWSI)',
    sourceLabel: 'Ir-192',
    searchKeywords: '6 pipe contact ir192 ir-192 iridium dwsi'
  },
  {
    id: 'plate_se75',
    testId: 'preset-plate-se75',
    category: 'plate',
    labelEn: '10mm Plate (Se-75 SWSI)',
    labelAr: 'لوح 10 مم (Se-75 SWSI)',
    sourceLabel: 'Se-75',
    searchKeywords: '10mm plate se75 se-75 selenium swsi'
  },
  {
    id: 'vessel_co60',
    testId: 'preset-vessel-co60',
    category: 'vessel',
    labelEn: '65mm Vessel (Co-60 Heavy)',
    labelAr: 'وعاء ضغط 65 مم (Co-60 ثقيل)',
    sourceLabel: 'Co-60',
    searchKeywords: '65mm vessel heavy co60 co-60 cobalt swsi'
  },
  {
    id: 'tube_xray',
    testId: 'preset-tube-xray',
    category: 'xray',
    labelEn: '6mm Tube (X-Ray 180kV)',
    labelAr: 'ماسورة 6 مم (X-Ray 180kV)',
    sourceLabel: 'X-Ray',
    searchKeywords: '6mm tube x-ray xray 180kv directional tube_xray'
  }
];

export const GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY = 'ge_app_pb_photoelectron_paths_visible';
export type GePbGhostTrailLength = 'short' | 'medium' | 'long';
export const GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY = 'ge_app_pb_ghost_trail_length';

export interface GePbGhostTrailTierSpec {
  reachFactor: number;
  lagDelay: number;
  enterDuration: number;
  exitDuration: number;
  flowDurationSec: number;
  wakeDurationSec: number;
  dashArray: string;
  peakOpacity: number;
  settledOpacity: number;
  strokeWidthMultiplier: number;
}

export interface GePbGhostTrailAnimationConfig {
  length: GePbGhostTrailLength;
  labelEn: string;
  labelAr: string;
  primary: GePbGhostTrailTierSpec;
  residual: GePbGhostTrailTierSpec;
}

export const GE_PB_GHOST_TRAIL_CONFIGS: Record<GePbGhostTrailLength, GePbGhostTrailAnimationConfig> = {
  short: {
    length: 'short',
    labelEn: 'Short',
    labelAr: 'قصير',
    primary: {
      reachFactor: 0.7,
      lagDelay: 0.025,
      enterDuration: 0.19,
      exitDuration: 0.12,
      flowDurationSec: 0.9,
      wakeDurationSec: 1.25,
      dashArray: '1.9 1.6',
      peakOpacity: 0.52,
      settledOpacity: 0.24,
      strokeWidthMultiplier: 0.9,
    },
    residual: {
      reachFactor: 0.54,
      lagDelay: 0.045,
      enterDuration: 0.22,
      exitDuration: 0.14,
      flowDurationSec: 1.1,
      wakeDurationSec: 1.5,
      dashArray: '2.1 2.0',
      peakOpacity: 0.26,
      settledOpacity: 0.1,
      strokeWidthMultiplier: 0.88,
    },
  },
  medium: {
    length: 'medium',
    labelEn: 'Medium',
    labelAr: 'متوسط',
    primary: {
      reachFactor: 1.0,
      lagDelay: 0.04,
      enterDuration: 0.27,
      exitDuration: 0.165,
      flowDurationSec: 1.25,
      wakeDurationSec: 1.8,
      dashArray: '2.8 1.5',
      peakOpacity: 0.62,
      settledOpacity: 0.34,
      strokeWidthMultiplier: 1.0,
    },
    residual: {
      reachFactor: 1.0,
      lagDelay: 0.08,
      enterDuration: 0.32,
      exitDuration: 0.2,
      flowDurationSec: 1.55,
      wakeDurationSec: 2.2,
      dashArray: '3.2 1.8',
      peakOpacity: 0.36,
      settledOpacity: 0.16,
      strokeWidthMultiplier: 1.0,
    },
  },
  long: {
    length: 'long',
    labelEn: 'Long',
    labelAr: 'طويل',
    primary: {
      reachFactor: 1.38,
      lagDelay: 0.065,
      enterDuration: 0.38,
      exitDuration: 0.23,
      flowDurationSec: 1.65,
      wakeDurationSec: 2.55,
      dashArray: '4.2 1.3',
      peakOpacity: 0.72,
      settledOpacity: 0.44,
      strokeWidthMultiplier: 1.1,
    },
    residual: {
      reachFactor: 1.65,
      lagDelay: 0.12,
      enterDuration: 0.46,
      exitDuration: 0.28,
      flowDurationSec: 2.05,
      wakeDurationSec: 3.1,
      dashArray: '5.2 1.5',
      peakOpacity: 0.44,
      settledOpacity: 0.22,
      strokeWidthMultiplier: 1.12,
    },
  },
};

export const getPbGhostTrailAnimationConfig = (
  length: GePbGhostTrailLength = 'medium'
): GePbGhostTrailAnimationConfig =>
  GE_PB_GHOST_TRAIL_CONFIGS[length] ?? GE_PB_GHOST_TRAIL_CONFIGS.medium;

export const computePbGhostTrailEndpoint = (
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  reachFactor: number
): { x2: number; y2: number } => ({
  x2: Number((originX + (targetX - originX) * reachFactor).toFixed(2)),
  y2: Number((originY + (targetY - originY) * reachFactor).toFixed(2)),
});

interface PbGhostTrailLinesProps {
  origin: 'front_pb' | 'back_pb' | 'interleaf_pb';
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  enterDelay: number;
  gradientId: string;
  baseResidualWidth: number;
  basePrimaryWidth: number;
  originAnchorX: 0 | 1;
  opacityScale?: number;
  config: GePbGhostTrailAnimationConfig;
}

const PbGhostTrailLines: React.FC<PbGhostTrailLinesProps> = ({
  origin,
  originX,
  originY,
  targetX,
  targetY,
  enterDelay,
  gradientId,
  baseResidualWidth,
  basePrimaryWidth,
  originAnchorX,
  opacityScale = 1,
  config,
}) => {
  const residualEnd = computePbGhostTrailEndpoint(originX, originY, targetX, targetY, config.residual.reachFactor);
  const primaryEnd = computePbGhostTrailEndpoint(originX, originY, targetX, targetY, config.primary.reachFactor);
  const residualPeak = Number((config.residual.peakOpacity * opacityScale).toFixed(3));
  const residualSettled = Number((config.residual.settledOpacity * opacityScale).toFixed(3));
  const primaryPeak = Number((config.primary.peakOpacity * opacityScale).toFixed(3));
  const primarySettled = Number((config.primary.settledOpacity * opacityScale).toFixed(3));

  return (
    <>
      <motion.line
        data-ghost-trail={origin}
        data-trail-tier="residual"
        data-trail-length={config.length}
        data-trail-reach={config.residual.reachFactor}
        data-flow-duration={`${config.residual.flowDurationSec}s`}
        data-wake-duration={`${config.residual.wakeDurationSec}s`}
        data-trail-blur="2.1px"
        data-stagger-delay={(enterDelay + config.residual.lagDelay).toFixed(3)}
        x1={originX}
        y1={originY}
        stroke={`url(#${gradientId})`}
        strokeWidth={Number((baseResidualWidth * config.residual.strokeWidthMultiplier).toFixed(2))}
        strokeLinecap="round"
        strokeDasharray={config.residual.dashArray}
        className={`rt-pb-electron-ghost-trail-residual rt-pb-ghost-len-${config.length}`}
        style={{ originX: originAnchorX, originY: 0.5 }}
        initial={{ x2: originX, y2: originY, scale: 0.08, opacity: 0 }}
        animate={{
          x2: residualEnd.x2,
          y2: residualEnd.y2,
          scale: [0.08, 1.12, 1],
          opacity: [0, residualPeak, residualSettled],
          transition: {
            x2: { duration: config.residual.enterDuration, delay: enterDelay + config.residual.lagDelay, ease: [0.16, 1, 0.3, 1] },
            y2: { duration: config.residual.enterDuration, delay: enterDelay + config.residual.lagDelay, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: config.residual.enterDuration + 0.04, delay: enterDelay + config.residual.lagDelay, ease: [0.16, 1, 0.3, 1], times: [0, 0.62, 1] },
            opacity: { duration: config.residual.enterDuration + 0.04, delay: enterDelay + config.residual.lagDelay, ease: 'easeOut', times: [0, 0.45, 1] },
          },
        }}
        exit={{
          x2: originX,
          y2: originY,
          scale: 0.05,
          opacity: 0,
          transition: { duration: config.residual.exitDuration, ease: 'easeIn' },
        }}
      />
      <motion.line
        data-ghost-trail={origin}
        data-trail-tier="primary"
        data-trail-length={config.length}
        data-trail-reach={config.primary.reachFactor}
        data-flow-duration={`${config.primary.flowDurationSec}s`}
        data-wake-duration={`${config.primary.wakeDurationSec}s`}
        data-trail-blur="1.1px"
        data-stagger-delay={(enterDelay + config.primary.lagDelay).toFixed(3)}
        x1={originX}
        y1={originY}
        stroke={`url(#${gradientId})`}
        strokeWidth={Number((basePrimaryWidth * config.primary.strokeWidthMultiplier).toFixed(2))}
        strokeLinecap="round"
        strokeDasharray={config.primary.dashArray}
        className={`rt-pb-electron-ghost-trail-primary rt-pb-ghost-len-${config.length}`}
        style={{ originX: originAnchorX, originY: 0.5 }}
        initial={{ x2: originX, y2: originY, scale: 0.08, opacity: 0 }}
        animate={{
          x2: primaryEnd.x2,
          y2: primaryEnd.y2,
          scale: [0.08, 1.13, 1],
          opacity: [0, primaryPeak, primarySettled],
          transition: {
            x2: { duration: config.primary.enterDuration, delay: enterDelay + config.primary.lagDelay, ease: [0.16, 1, 0.3, 1] },
            y2: { duration: config.primary.enterDuration, delay: enterDelay + config.primary.lagDelay, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: config.primary.enterDuration + 0.05, delay: enterDelay + config.primary.lagDelay, ease: [0.16, 1, 0.3, 1], times: [0, 0.62, 1] },
            opacity: { duration: config.primary.enterDuration + 0.04, delay: enterDelay + config.primary.lagDelay, ease: 'easeOut', times: [0, 0.45, 1] },
          },
        }}
        exit={{
          x2: originX,
          y2: originY,
          scale: 0.05,
          opacity: 0,
          transition: { duration: config.primary.exitDuration, ease: 'easeIn' },
        }}
      />
    </>
  );
};

const readInitialPbPhotoelectronPathsState = (): boolean => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
    }
  } catch {
    // ignore storage access issues
  }
  return true;
};

const readInitialPbGhostTrailLength = (): GePbGhostTrailLength => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY);
      if (stored === 'short' || stored === 'medium' || stored === 'long') {
        return stored;
      }
    }
  } catch {
    // ignore storage access issues
  }
  return 'medium';
};

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

// Resample any BeamDecayPoint array onto a fixed-size uniform normX grid so SVG `d` paths
// always preserve identical vertex count & command topology for smooth CSS morph transitions.
export const sampleUniformCurvePoints = (
  points: BeamDecayPoint[],
  segments: number = 96
): Array<{ normX: number; intensityPct: number }> => {
  if (points.length === 0) return [];
  const sampled: Array<{ normX: number; intensityPct: number }> = [];
  let cursor = 0;
  for (let i = 0; i <= segments; i++) {
    const targetX = i / segments;
    while (cursor < points.length - 2 && points[cursor + 1].normX < targetX) {
      cursor++;
    }
    const p0 = points[cursor];
    const p1 = points[Math.min(points.length - 1, cursor + 1)];
    const span = p1.normX - p0.normX;
    const t = span > 1e-6 ? Math.max(0, Math.min(1, (targetX - p0.normX) / span)) : 0;
    const intensityPct = p0.intensityPct + (p1.intensityPct - p0.intensityPct) * t;
    sampled.push({ normX: targetX, intensityPct });
  }
  return sampled;
};

interface SvgCurveCoord {
  x: number;
  y: number;
}

const buildSvgCurveD = (pts: SvgCurveCoord[]): string =>
  pts.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');

const buildSvgAreaD = (curveD: string, pts: SvgCurveCoord[], plotBottom: number): string => {
  if (!curveD || pts.length === 0) return '';
  return `${curveD} L ${pts[pts.length - 1].x.toFixed(1)} ${plotBottom} L ${pts[0].x.toFixed(1)} ${plotBottom} Z`;
};

interface AnimatedBeamDecayCurveGroupProps {
  targetPoints: SvgCurveCoord[];
  plotBottom: number;
  entryDotPos: { cx: number; cy: number };
  exitDotPos: { cx: number; cy: number };
  is4dViewActive: boolean;
  is4dPlaying: boolean;
  photonAccentColor: string;
  photonCoreColor: string;
  photonDurationSec: number;
}

// Drives on-demand 300ms interpolated updates to the SVG `d` and dot attributes using Framer Motion `animate()`
// whenever curve parameters (e.g. material, SFD distance, thickness, technique, or 4D day) change.
const AnimatedBeamDecayCurveGroup: React.FC<AnimatedBeamDecayCurveGroupProps> = ({
  targetPoints,
  plotBottom,
  entryDotPos,
  exitDotPos,
  is4dViewActive,
  is4dPlaying,
  photonAccentColor,
  photonCoreColor,
  photonDurationSec
}) => {
  const durationMs = is4dViewActive && is4dPlaying ? 160 : 300;
  const targetCurveD = useMemo(() => buildSvgCurveD(targetPoints), [targetPoints]);
  const targetAreaD = useMemo(
    () => buildSvgAreaD(targetCurveD, targetPoints, plotBottom),
    [targetCurveD, targetPoints, plotBottom]
  );

  // Freeze initial JSX attribute values at mount so React re-renders never stomp mid-flight interpolated DOM attributes
  const mountInitialRef = useRef({
    curveD: targetCurveD,
    areaD: targetAreaD,
    entryCx: entryDotPos.cx.toFixed(1),
    entryCy: entryDotPos.cy.toFixed(1),
    exitCx: exitDotPos.cx.toFixed(1),
    exitCy: exitDotPos.cy.toFixed(1)
  });

  const areaRef = useRef<SVGPathElement | null>(null);
  const curveRef = useRef<SVGPathElement | null>(null);
  const flowRef = useRef<SVGPathElement | null>(null);
  const entryDotRef = useRef<SVGCircleElement | null>(null);
  const exitDotRef = useRef<SVGCircleElement | null>(null);

  const renderedStateRef = useRef<{
    points: SvgCurveCoord[];
    entry: { cx: number; cy: number };
    exit: { cx: number; cy: number };
  }>({
    points: targetPoints,
    entry: entryDotPos,
    exit: exitDotPos
  });

  const targetSignature = `${targetCurveD}|${entryDotPos.cx.toFixed(1)},${entryDotPos.cy.toFixed(1)}|${exitDotPos.cx.toFixed(1)},${exitDotPos.cy.toFixed(1)}|${plotBottom}`;
  const lastTargetSignatureRef = useRef<string>(targetSignature);
  const activeAnimationRef = useRef<{ stop: () => void } | null>(null);
  const latestTargetsRef = useRef({
    points: targetPoints,
    entry: entryDotPos,
    exit: exitDotPos,
    plotBottom,
    durationMs
  });
  latestTargetsRef.current = {
    points: targetPoints,
    entry: entryDotPos,
    exit: exitDotPos,
    plotBottom,
    durationMs
  };

  useEffect(() => {
    return () => {
      activeAnimationRef.current?.stop();
      activeAnimationRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (targetSignature === lastTargetSignatureRef.current) {
      return;
    }
    lastTargetSignatureRef.current = targetSignature;

    const { points: nextPoints, entry: nextEntry, exit: nextExit, plotBottom: nextPlotBottom, durationMs: nextDurationMs } =
      latestTargetsRef.current;

    const applySnapshot = (
      pts: SvgCurveCoord[],
      entry: { cx: number; cy: number },
      exit: { cx: number; cy: number }
    ) => {
      const nextCurveD = buildSvgCurveD(pts);
      const nextAreaD = buildSvgAreaD(nextCurveD, pts, nextPlotBottom);
      areaRef.current?.setAttribute('d', nextAreaD);
      curveRef.current?.setAttribute('d', nextCurveD);
      flowRef.current?.setAttribute('d', nextCurveD);
      entryDotRef.current?.setAttribute('cx', entry.cx.toFixed(1));
      entryDotRef.current?.setAttribute('cy', entry.cy.toFixed(1));
      exitDotRef.current?.setAttribute('cx', exit.cx.toFixed(1));
      exitDotRef.current?.setAttribute('cy', exit.cy.toFixed(1));
      renderedStateRef.current = { points: pts, entry, exit };
    };

    activeAnimationRef.current?.stop();
    activeAnimationRef.current = null;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || renderedStateRef.current.points.length !== nextPoints.length) {
      applySnapshot(nextPoints, nextEntry, nextExit);
      return;
    }

    const from = renderedStateRef.current;
    const to = {
      points: nextPoints,
      entry: nextEntry,
      exit: nextExit
    };

    // Keep current rendered geometry on commit frame so the visual curve never jumps before interpolating
    applySnapshot(from.points, from.entry, from.exit);

    const controls = animate(0, 1, {
      duration: nextDurationMs / 1000,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        const interpPoints = to.points.map((pt, idx) => {
          const f = from.points[idx] ?? pt;
          return {
            x: f.x + (pt.x - f.x) * t,
            y: f.y + (pt.y - f.y) * t
          };
        });
        const interpEntry = {
          cx: from.entry.cx + (to.entry.cx - from.entry.cx) * t,
          cy: from.entry.cy + (to.entry.cy - from.entry.cy) * t
        };
        const interpExit = {
          cx: from.exit.cx + (to.exit.cx - from.exit.cx) * t,
          cy: from.exit.cy + (to.exit.cy - from.exit.cy) * t
        };
        applySnapshot(interpPoints, interpEntry, interpExit);
      },
      onComplete: () => {
        applySnapshot(to.points, to.entry, to.exit);
        if (activeAnimationRef.current === controls) {
          activeAnimationRef.current = null;
        }
      }
    });

    activeAnimationRef.current = controls;
  }, [targetSignature]);

  return (
    <g data-testid="ge-beam-decay-animated-group" data-transition-ms={durationMs}>
      <path
        ref={areaRef}
        data-testid="ge-beam-decay-area"
        d={mountInitialRef.current.areaD}
        fill="url(#geDecayAreaGrad)"
        className="rt-beam-curve-color-transition"
        pointerEvents="none"
      />
      <path
        ref={curveRef}
        data-testid="ge-beam-decay-curve-path"
        data-transition-ms={durationMs}
        d={mountInitialRef.current.curveD}
        fill="none"
        stroke={is4dViewActive ? '#22d3ee' : photonAccentColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rt-beam-curve-color-transition"
        pointerEvents="none"
      />
      <path
        ref={flowRef}
        data-testid="ge-beam-decay-curve-flow"
        d={mountInitialRef.current.curveD}
        fill="none"
        stroke={is4dViewActive ? '#cffafe' : photonCoreColor}
        strokeWidth="2.2"
        strokeDasharray="10 18"
        strokeLinecap="round"
        opacity="0.92"
        className="rt-photon-curve-flow rt-beam-curve-color-transition"
        style={{ '--rt-photon-duration': `${photonDurationSec}s` } as React.CSSProperties}
        pointerEvents="none"
      />

      <circle
        ref={entryDotRef}
        data-testid="ge-beam-decay-entry-dot"
        cx={mountInitialRef.current.entryCx}
        cy={mountInitialRef.current.entryCy}
        r="4"
        fill={is4dViewActive ? '#22d3ee' : '#fbbf24'}
        stroke="#020617"
        strokeWidth="1.5"
        className="rt-beam-curve-color-transition"
      />
      <circle
        ref={exitDotRef}
        data-testid="ge-beam-decay-exit-dot"
        cx={mountInitialRef.current.exitCx}
        cy={mountInitialRef.current.exitCy}
        r="4.5"
        fill="#10b981"
        stroke="#020617"
        strokeWidth="1.5"
        className="rt-beam-curve-color-transition"
      />
    </g>
  );
};

export interface Ge4dDecayShiftSnapshot {
  dayOffset: number;
  maxHorizonDays: number;
  halfLifeDays: number;
  halfLivesElapsed: number;
  isGammaIsotope: boolean;
  baseCalibrationDate: string;
  projectedDateStr: string;
  decayFraction: number;
  decayPercentRemaining: number;
  liveActivityCi: number;
  initialActivityCi: number;
  doseRate1mRhm: number;
  exposureTimeMultiplier: number;
  day0Result: GeExposureResult;
  shiftedResult: GeExposureResult;
  perimeterShrinkPct: number;
  uncompensatedDensityHd: number;
  isUncompensatedUnderexposed: boolean;
  shiftedBeamPoints: BeamDecayPoint[];
  shiftedExitIntensityPct: number;
  photonDurationSec: number;
  streamCycleSec: number;
  photonParticleCount: number;
  wavefrontDurationSec: number;
}

const addDaysIsoDate = (isoDate: string, deltaDays: number): string => {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  const baseMs = Number.isNaN(parsed.getTime()) ? new Date('2026-10-06T00:00:00Z').getTime() : parsed.getTime();
  const next = new Date(baseMs + Math.round(deltaDays) * 86400000);
  return next.toISOString().slice(0, 10);
};

export const compute4dDecayShiftSnapshot = (
  input: GeExposureInput,
  beamProfile: BeamDecayProfile,
  dayOffset4d: number
): Ge4dDecayShiftSnapshot => {
  const isotope = GE_ISOTOPES[input.sourceType];
  const isGammaIsotope = isotope.category === 'gamma' && isotope.halfLifeDays > 0;
  const halfLifeDays = isGammaIsotope ? isotope.halfLifeDays : 365;
  const maxHorizonDays = isGammaIsotope ? Math.max(2, Math.round(halfLifeDays * 2)) : 365;
  const dayOffset = Math.max(0, Math.min(maxHorizonDays, Math.round(dayOffset4d)));

  const baseCalibrationDate = Number.isNaN(new Date(`${input.initialCalibrationDate}T00:00:00Z`).getTime())
    ? '2026-10-06'
    : input.initialCalibrationDate;
  const projectedDateStr = addDaysIsoDate(baseCalibrationDate, dayOffset);

  const day0Result = calculateGeRadiographicExposure({
    ...input,
    initialCalibrationDate: baseCalibrationDate,
    measurementDate: baseCalibrationDate
  });
  const shiftedResult = calculateGeRadiographicExposure({
    ...input,
    initialCalibrationDate: baseCalibrationDate,
    measurementDate: projectedDateStr
  });

  const decayFraction = isGammaIsotope ? shiftedResult.decayFractionRemaining : 1;
  const decayPercentRemaining = Number((decayFraction * 100).toFixed(1));
  const halfLivesElapsed = isGammaIsotope ? Number((dayOffset / halfLifeDays).toFixed(2)) : 0;

  const doseRate1mRhm = isGammaIsotope
    ? Number(Math.max(0.15, shiftedResult.currentLiveActivityCi * isotope.gammaConstantRhmPerCi).toFixed(2))
    : Number(
        Math.max(
          0.5,
          (input.tubeMa ?? 4.0) * Math.pow(Math.max(60, input.tubeKv ?? 220) / 180, 2) * 3.8
        ).toFixed(2)
      );

  const exposureTimeMultiplier = Number(
    (shiftedResult.calculatedTotalSeconds / Math.max(0.01, day0Result.calculatedTotalSeconds)).toFixed(2)
  );
  const perimeterShrinkPct = Number(
    (
      (1 -
        shiftedResult.controlledAreaPerimeter2mR_Meters /
          Math.max(0.01, day0Result.controlledAreaPerimeter2mR_Meters)) *
      100
    ).toFixed(1)
  );

  const uncompensatedDensityHd = Number((input.targetOpticalDensity * decayFraction).toFixed(2));
  const isUncompensatedUnderexposed = uncompensatedDensityHd < 2.0;

  const shiftedBeamPoints: BeamDecayPoint[] = beamProfile.points.map((pt) => ({
    ...pt,
    intensityPct: Number((pt.intensityPct * decayFraction).toFixed(2))
  }));
  const shiftedExitIntensityPct = Number((beamProfile.exitIntensityPct * decayFraction).toFixed(2));

  const intensityNorm = Math.max(0, Math.min(1, Math.log10(Math.max(1, doseRate1mRhm)) / Math.log10(120)));
  const photonDurationSec = Number((3.1 - intensityNorm * 2.45).toFixed(2));
  const streamCycleSec = Number((photonDurationSec * 0.62).toFixed(2));
  const photonParticleCount = Math.max(3, Math.min(9, Math.round(3 + intensityNorm * 6)));
  const wavefrontDurationSec = Number((2.5 - intensityNorm * 1.1).toFixed(2));

  return {
    dayOffset,
    maxHorizonDays,
    halfLifeDays,
    halfLivesElapsed,
    isGammaIsotope,
    baseCalibrationDate,
    projectedDateStr,
    decayFraction,
    decayPercentRemaining,
    liveActivityCi: shiftedResult.currentLiveActivityCi,
    initialActivityCi: input.initialActivityCi,
    doseRate1mRhm,
    exposureTimeMultiplier,
    day0Result,
    shiftedResult,
    perimeterShrinkPct,
    uncompensatedDensityHd,
    isUncompensatedUnderexposed,
    shiftedBeamPoints,
    shiftedExitIntensityPct,
    photonDurationSec,
    streamCycleSec,
    photonParticleCount,
    wavefrontDurationSec
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
    imperialCount,
    metricPct,
    imperialPct
  } = useMemo(() => {
    const recent = [...entries.slice(0, 5)].reverse();
    const mCount = recent.filter((e) => e.toUnit === 'metric').length;
    const iCount = recent.filter((e) => e.toUnit === 'imperial').length;
    const total = mCount + iCount;
    const mPct = total > 0 ? Math.round((mCount / total) * 100) : 0;
    const iPct = total > 0 ? 100 - mPct : 0;

    if (recent.length === 0) {
      return {
        points: [] as Array<{ x: number; y: number; entry: GeConversionLogEntry }>,
        linePath: '',
        areaPath: '',
        metricCount: 0,
        imperialCount: 0,
        metricPct: 0,
        imperialPct: 0
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
      imperialCount: iCount,
      metricPct: mPct,
      imperialPct: iPct
    };
  }, [entries]);

  const strokeColor = unitSystem === 'metric' ? '#0ea5e9' : '#f59e0b';

  return (
    <div
      data-testid="ge-quick-units-sparkline"
      title={
        isAr
          ? `اتجاه آخر 5 تحويلات: متري ${metricCount} (${metricPct}%) مقابل إمبراطوري ${imperialCount} (${imperialPct}%)`
          : `Last 5 conversion switches: Metric ${metricCount} (${metricPct}%) vs Imperial ${imperialCount} (${imperialPct}%)`
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
            ? `مخطط خطي لتكرار التحويلات: متري ${metricCount} (${metricPct}%) وإمبراطوري ${imperialCount} (${imperialPct}%)`
            : `Conversion trend sparkline: Metric ${metricCount} (${metricPct}%) and Imperial ${imperialCount} (${imperialPct}%)`
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
      <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
        ·
      </span>
      <span
        data-testid="ge-quick-units-sparkline-usage"
        className="flex items-center gap-1 font-bold tabular-nums whitespace-nowrap"
      >
        <span className="text-sky-600 dark:text-sky-400">
          {isAr ? `${metricPct}% متري` : `${metricPct}% Metric`}
        </span>
        <span className="text-slate-400">/</span>
        <span className="text-amber-600 dark:text-amber-400">
          {isAr ? `${imperialPct}% إمبراطوري` : `${imperialPct}% Imperial`}
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
  initialPbGhostTrailLength?: GePbGhostTrailLength;
}

export const GeRadiographicExposureTimeApp: React.FC<GeRadiographicExposureTimeAppProps> = ({
  language,
  onApplyTimeToLab,
  onClose,
  className = '',
  initialSource = 'ir192',
  initialThicknessMm = 12.0,
  initialSfdCm = 70,
  initialPbGhostTrailLength,
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
  const [compositeTimeCorrectionFactor, setCompositeTimeCorrectionFactor] = useState<number>(0.55);

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

  // 4D Time-Based Isotope Decay Animation Overlay State
  const [showBeamOverlay, setShowBeamOverlay] = useState<boolean>(true);
  const [showLeadScreenOverlay, setShowLeadScreenOverlay] = useState<boolean>(true);
  const [showPbPhotoelectronPaths, setShowPbPhotoelectronPaths] = useState<boolean>(() =>
    readInitialPbPhotoelectronPathsState()
  );
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY, String(showPbPhotoelectronPaths));
      }
    } catch {
      // ignore storage write issues
    }
  }, [showPbPhotoelectronPaths]);
  const [pbGhostTrailLength, setPbGhostTrailLength] = useState<GePbGhostTrailLength>(
    () => initialPbGhostTrailLength ?? readInitialPbGhostTrailLength()
  );
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY, pbGhostTrailLength);
      }
    } catch {
      // ignore storage write issues
    }
  }, [pbGhostTrailLength]);
  const pbGhostTrailConfig = useMemo(
    () => getPbGhostTrailAnimationConfig(pbGhostTrailLength),
    [pbGhostTrailLength]
  );
  const [hasInteractedWithPbPaths, setHasInteractedWithPbPaths] = useState<boolean>(false);
  const [showPbPhysicsTooltip, setShowPbPhysicsTooltip] = useState<boolean>(false);
  const [showWeldProfileOverlay, setShowWeldProfileOverlay] = useState<boolean>(true);
  const [is4dViewActive, setIs4dViewActive] = useState<boolean>(false);
  const [is4dPlaying, setIs4dPlaying] = useState<boolean>(false);
  const [playbackSpeed4d, setPlaybackSpeed4d] = useState<0.5 | 1 | 2>(1);
  const [dayOffset4d, setDayOffset4d] = useState<number>(30);

  // Real-Time Primary Exposure 4D Isotope Decay Playback State
  const [isRealtime4dPlaying, setIsRealtime4dPlaying] = useState<boolean>(false);
  const [realtime4dSpeed, setRealtime4dSpeed] = useState<0.5 | 1 | 2>(1);
  const [realtime4dHorizonHalfLives, setRealtime4dHorizonHalfLives] = useState<2 | 3 | 5>(3);

  // Quick Industry Presets Categorized Tabs, Dropdown & Search Filter State
  const [presetCategoryTab, setPresetCategoryTab] = useState<GePresetCategoryId>('pipe');
  const [activePresetId, setActivePresetId] = useState<GePresetId | null>(null);
  const [presetSearchQuery, setPresetSearchQuery] = useState<string>('');

  // Ultrasonic Longitudinal Waves Simulation Option inside #ge-exposure-calculator-app
  const [showLongitudinalWaveSim, setShowLongitudinalWaveSim] = useState<boolean>(false);

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
  const exposureInput: GeExposureInput = useMemo(() => {
    const multiFilmConfig: GeMultiFilmConfig = {
      mode: filmLoadingMode,
      primaryFilmId: filmId,
      secondaryFilmId: filmLoadingMode !== 'single' ? secondaryFilmId : undefined,
      hasInterleafLeadScreen: hasInterleafScreen,
      wideLatitudeGoverning: wideLatitudeGov,
      compositeTimeCorrectionFactor:
        filmLoadingMode === 'dual_composite' ? compositeTimeCorrectionFactor : undefined
    };

    return {
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
    wideLatitudeGov,
    compositeTimeCorrectionFactor
  ]);

  const calcResult: GeExposureResult = useMemo(
    () => calculateGeRadiographicExposure(exposureInput),
    [exposureInput]
  );

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

  const shift4d: Ge4dDecayShiftSnapshot = useMemo(
    () => compute4dDecayShiftSnapshot(exposureInput, beamDecayProfile, dayOffset4d),
    [exposureInput, beamDecayProfile, dayOffset4d]
  );

  const realtime4dSnapshot = useMemo(() => {
    const isotopeSpec = GE_ISOTOPES[sourceType];
    const isGamma = isotopeSpec.category === 'gamma' && isotopeSpec.halfLifeDays > 0;
    const halfLifeDays = isGamma ? isotopeSpec.halfLifeDays : 365;
    const maxDays = isGamma ? Math.max(2, Math.round(halfLifeDays * realtime4dHorizonHalfLives)) : 180;
    const currentDay = Math.max(0, Math.min(maxDays, calcResult.decayDaysElapsed));
    const baseCalib = Number.isNaN(new Date(`${initialCalibrationDate}T00:00:00Z`).getTime())
      ? '2026-10-06'
      : initialCalibrationDate;
    const day0Res = calculateGeRadiographicExposure({
      ...exposureInput,
      initialCalibrationDate: baseCalib,
      measurementDate: baseCalib
    });
    const exposureMultiplier = Number(
      (calcResult.calculatedTotalSeconds / Math.max(0.01, day0Res.calculatedTotalSeconds)).toFixed(2)
    );
    const percentRemaining = isGamma ? Number((calcResult.decayFractionRemaining * 100).toFixed(1)) : 100;
    const halfLivesElapsed = isGamma ? Number((currentDay / halfLifeDays).toFixed(2)) : 0;

    // Mini exponential 4D waveform geometry (220x32 SVG)
    const w = 220;
    const h = 32;
    const padX = 4;
    const padY = 4;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const curvePts: string[] = [];
    for (let i = 0; i <= 32; i++) {
      const fracX = i / 32;
      const d = fracX * maxDays;
      const yFrac = isGamma ? Math.pow(0.5, d / halfLifeDays) : 1;
      const px = padX + fracX * innerW;
      const py = padY + (1 - yFrac) * innerH;
      curvePts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    const markerFracX = maxDays > 0 ? Math.max(0, Math.min(1, currentDay / maxDays)) : 0;
    const markerFracY = isGamma ? Math.pow(0.5, currentDay / halfLifeDays) : 1;
    const markerX = Number((padX + markerFracX * innerW).toFixed(1));
    const markerY = Number((padY + (1 - markerFracY) * innerH).toFixed(1));

    return {
      isGamma,
      halfLifeDays,
      maxDays,
      currentDay,
      baseCalib,
      day0Seconds: day0Res.calculatedTotalSeconds,
      exposureMultiplier,
      percentRemaining,
      halfLivesElapsed,
      sparklinePath: curvePts.join(' '),
      markerX,
      markerY
    };
  }, [
    sourceType,
    realtime4dHorizonHalfLives,
    calcResult.decayDaysElapsed,
    calcResult.calculatedTotalSeconds,
    calcResult.decayFractionRemaining,
    initialCalibrationDate,
    exposureInput
  ]);

  const handleRealtime4dDayChange = (targetDay: number) => {
    const clamped = Math.max(0, Math.min(realtime4dSnapshot.maxDays, Math.round(targetDay)));
    setMeasurementDate(addDaysIsoDate(realtime4dSnapshot.baseCalib, clamped));
  };

  // Stop real-time 4D playback if source switches to non-decaying X-ray tube
  useEffect(() => {
    if (!realtime4dSnapshot.isGamma && isRealtime4dPlaying) {
      setIsRealtime4dPlaying(false);
    }
  }, [realtime4dSnapshot.isGamma, isRealtime4dPlaying]);

  // Real-time 4D Isotope Decay Auto-Playback Loop (directly drives measurementDate & calcResult)
  useEffect(() => {
    if (!isRealtime4dPlaying || !realtime4dSnapshot.isGamma) return;
    const maxDays = realtime4dSnapshot.maxDays;
    const baseCalib = realtime4dSnapshot.baseCalib;
    const baseMs = new Date(`${baseCalib}T00:00:00Z`).getTime();
    const stepDays = Math.max(1, Math.round((maxDays / 60) * realtime4dSpeed));
    const timer = setInterval(() => {
      setMeasurementDate((prevDate) => {
        const parsedMs = new Date(`${prevDate}T00:00:00Z`).getTime();
        const prevDays = Number.isNaN(parsedMs) ? 0 : Math.max(0, Math.round((parsedMs - baseMs) / 86400000));
        const nextDays = prevDays + stepDays > maxDays ? 0 : prevDays + stepDays;
        return addDaysIsoDate(baseCalib, nextDays);
      });
    }, 180);
    if (typeof (timer as { unref?: () => void }).unref === 'function') {
      (timer as { unref: () => void }).unref();
    }
    return () => clearInterval(timer);
  }, [
    isRealtime4dPlaying,
    realtime4dSnapshot.isGamma,
    realtime4dSnapshot.maxDays,
    realtime4dSnapshot.baseCalib,
    realtime4dSpeed
  ]);

  // Clamp 4D offset when isotope horizon shrinks
  useEffect(() => {
    if (dayOffset4d > shift4d.maxHorizonDays) {
      setDayOffset4d(shift4d.maxHorizonDays);
    }
  }, [dayOffset4d, shift4d.maxHorizonDays]);

  // 4D Time-Based Decay Auto-Playback Loop
  useEffect(() => {
    if (!is4dViewActive || !is4dPlaying) return;
    const stepDays = Math.max(1, Math.round((shift4d.maxHorizonDays / 60) * playbackSpeed4d));
    const timer = setInterval(() => {
      setDayOffset4d((prev) => {
        const next = prev + stepDays;
        return next > shift4d.maxHorizonDays ? 0 : next;
      });
    }, 180);
    if (typeof (timer as { unref?: () => void }).unref === 'function') {
      (timer as { unref: () => void }).unref();
    }
    return () => clearInterval(timer);
  }, [is4dViewActive, is4dPlaying, playbackSpeed4d, shift4d.maxHorizonDays]);

  const handleToggle4dView = () => {
    setIs4dViewActive((prev) => {
      const next = !prev;
      if (next) {
        const clampedCurrent = Math.max(0, Math.min(shift4d.maxHorizonDays, calcResult.decayDaysElapsed || 30));
        setDayOffset4d(clampedCurrent);
      } else {
        setIs4dPlaying(false);
      }
      return next;
    });
  };

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
  const [conversionPdfExportedConfirmed, setConversionPdfExportedConfirmed] = useState<boolean>(false);
  const [copiedUnitsConfirmed, setCopiedUnitsConfirmed] = useState<boolean>(false);
  const [unitTransitionPulse, setUnitTransitionPulse] = useState<boolean>(false);
  const unitsResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const csvExportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversionPdfExportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (conversionPdfExportTimeoutRef.current) {
        clearTimeout(conversionPdfExportTimeoutRef.current);
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
    setCompositeTimeCorrectionFactor(0.55);

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
    setShowBeamOverlay(true);
    setShowLeadScreenOverlay(true);
    setShowPbPhotoelectronPaths(true);
    setPbGhostTrailLength('medium');
    setShowWeldProfileOverlay(true);
    setIs4dPlaying(false);
    setIsRealtime4dPlaying(false);
    setRealtime4dHorizonHalfLives(3);
    setPresetCategoryTab('pipe');
    setActivePresetId(null);
    setPresetSearchQuery('');
    setShowLongitudinalWaveSim(false);

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
  const loadPreset = (presetKey: GePresetId) => {
    const matchedMeta = GE_INDUSTRY_PRESETS.find((item) => item.id === presetKey);
    if (matchedMeta) {
      setPresetCategoryTab(matchedMeta.category);
    }
    setActivePresetId(presetKey);
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

  const normalizedPresetSearch = presetSearchQuery.trim().toLowerCase();
  const visiblePresets = useMemo(() => {
    if (normalizedPresetSearch) {
      return GE_INDUSTRY_PRESETS.filter((preset) => {
        const catMeta = GE_PRESET_CATEGORIES.find((c) => c.id === preset.category);
        const haystack = [
          preset.labelEn,
          preset.labelAr,
          preset.sourceLabel,
          preset.searchKeywords,
          catMeta?.labelEn ?? '',
          catMeta?.labelAr ?? ''
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedPresetSearch);
      });
    }
    return GE_INDUSTRY_PRESETS.filter((preset) => preset.category === presetCategoryTab);
  }, [normalizedPresetSearch, presetCategoryTab]);

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

  // Unit Conversion Log Structured PDF Export Handler
  const handleExportConversionLogPdf = () => {
    if (conversionLog.length === 0) return;

    try {
      const reportNumber = `RT-CONV-${Math.floor(100000 + Math.random() * 900000)}`;
      const todayStr = new Date().toISOString().split('T')[0];

      const pdfData: GeConversionLogPdfReportData = {
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

        activeUnitSystem: unitSystem,
        conversionEntries: conversionLog,
      };

      const doc = generateGeConversionLogPdf(pdfData);
      const fileName = `ge-conversion-log-${todayStr}.pdf`;
      doc.save(fileName);

      setConversionPdfExportedConfirmed(true);
      if (conversionPdfExportTimeoutRef.current) {
        clearTimeout(conversionPdfExportTimeoutRef.current);
      }
      conversionPdfExportTimeoutRef.current = setTimeout(() => setConversionPdfExportedConfirmed(false), 2000);
    } catch (err) {
      console.error('Failed to export conversion log PDF report', err);
    }
  };

  return (
    <div
      id="ge-exposure-calculator-app"
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

        <div className="flex flex-wrap items-center gap-2.5">
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
            <AnimatePresence>
              {showConversionLog && (
                <motion.div
                  key="ge-conversion-log-panel"
                  data-testid="ge-conversion-log-panel"
                  initial={{ opacity: 0, x: isAr ? -32 : 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isAr ? -32 : 32 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute top-full mt-2 ${
                    isAr ? 'left-0' : 'right-0'
                  } z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3 text-xs font-mono`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <ArrowLeftRight className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>{isAr ? 'سجل تحويلات الوحدات (آخر 5)' : 'Conversion Log (Last 5)'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {conversionLog.length > 0 && (
                        <>
                          <button
                            type="button"
                            data-testid="ge-conversion-log-export-pdf-btn"
                            onClick={handleExportConversionLogPdf}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              conversionPdfExportedConfirmed
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={isAr ? 'تصدير السجل كملف PDF منسق' : 'Export conversion log as structured PDF report'}
                          >
                            <FileText className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>
                              {conversionPdfExportedConfirmed
                                ? (isAr ? 'تم التصدير' : 'PDF Exported')
                                : (isAr ? 'تصدير PDF' : 'Export PDF')}
                            </span>
                          </button>
                          <button
                            type="button"
                            data-testid="ge-conversion-log-clear-btn"
                            onClick={handleClearConversionLog}
                            className="px-2 py-1 rounded-lg text-[10px] text-red-500 hover:bg-red-500/10 transition flex items-center gap-1 cursor-pointer"
                            title={isAr ? 'مسح السجل' : 'Clear Conversion Log'}
                          >
                            <Trash2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'مسح' : 'Clear'}</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        data-testid="ge-conversion-log-close-btn"
                        onClick={() => setShowConversionLog(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        aria-label={isAr ? 'إغلاق السجل' : 'Close Conversion Log'}
                      >
                        <X className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {conversionLog.length === 0 ? (
                    <div
                      data-testid="ge-conversion-log-empty"
                      className="py-5 text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1"
                    >
                      <History className="w-6 h-6 shrink-0 mx-auto text-slate-400 opacity-60" />
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
                              <ArrowRight className="w-2.5 h-2.5 shrink-0" />
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
                </motion.div>
              )}
            </AnimatePresence>
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
          SIMULATION MODE SELECTOR (RT EXPOSURE vs ULTRASONIC LONGITUDINAL WAVES)
      ------------------------------------------------------------------- */}
      <div
        data-testid="ge-simulation-mode-bar"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 p-3 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 shrink-0 text-cyan-500" aria-hidden="true" />
            <span>{isAr ? 'نمط محاكاة الفحص والاختراق:' : 'Penetration Simulation Mode:'}</span>
          </span>

          <div
            role="group"
            aria-label={isAr ? 'خيارات المحاكاة داخل التطبيق' : 'In-App Simulation Modes'}
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              data-testid="ge-mode-rt-btn"
              aria-pressed={!showLongitudinalWaveSim}
              onClick={() => setShowLongitudinalWaveSim(false)}
              className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                !showLongitudinalWaveSim
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'التصوير الإشعاعي (RT)' : 'Radiographic Exposure (RT)'}</span>
            </button>

            <button
              id="ge-longitudinal-wave-option"
              type="button"
              data-testid="ge-longitudinal-wave-option-btn"
              aria-pressed={showLongitudinalWaveSim}
              onClick={() => setShowLongitudinalWaveSim((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showLongitudinalWaveSim
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-black'
                  : 'bg-white dark:bg-slate-900 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10'
              }`}
            >
              <Waves className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? 'الموجات الطولية (Longitudinal Waves)'
                  : 'Longitudinal Waves (الموجات الطولية)'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-950/15 text-[10px] font-mono uppercase">
                {showLongitudinalWaveSim ? (isAr ? 'نشط' : 'ON') : 'UT'}
              </span>
            </button>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {showLongitudinalWaveSim
            ? (isAr
                ? 'يعرض شكل الموجة الطولية وتغيّر كثافة التضاغط عند اختراق المادة المختارة'
                : 'Showing longitudinal compression/rarefaction shape & penetration density shift')
            : (isAr
                ? 'فعّل "الموجات الطولية" لمحاكاة شكل الموجة وتغير كثافتها عند الاختراق'
                : 'Select "Longitudinal Waves" to simulate ultrasonic wave shape & density on penetration')}
        </span>
      </div>

      {/* Ultrasonic Longitudinal Waves Penetration Simulator (Activated via Longitudinal Waves option) */}
      {showLongitudinalWaveSim && (
        <LongitudinalWavePenetrationSim
          language={language}
          materialId={materialId}
          onChangeMaterialId={setMaterialId}
          materialThicknessMm={materialThicknessMm}
          onChangeThicknessMm={setMaterialThicknessMm}
          unitSystem={unitSystem}
        />
      )}

      {/* -------------------------------------------------------------------
          QUICK FIELD PRESETS BAR (CATEGORIZED TABS, DROPDOWN & SEARCH)
      ------------------------------------------------------------------- */}
      <div
        data-testid="ge-quick-presets-bar"
        className="flex flex-wrap items-center gap-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 p-2.5"
      >
        <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 me-1">
          <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{isAr ? 'نماذج الاختبار السريعة الجاهزة:' : 'Quick Industry Presets:'}</span>
        </span>

        {/* Categorized Tabs */}
        <div
          role="tablist"
          aria-label={isAr ? 'تصنيفات نماذج الاختبار' : 'Preset Categories'}
          data-testid="ge-preset-category-tabs"
          className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1"
        >
          {GE_PRESET_CATEGORIES.map((category) => {
            const count = GE_INDUSTRY_PRESETS.filter((p) => p.category === category.id).length;
            const isSelected = !normalizedPresetSearch && presetCategoryTab === category.id;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`ge-preset-tab-${category.id}`}
                onClick={() => {
                  setPresetCategoryTab(category.id);
                  if (presetSearchQuery) {
                    setPresetSearchQuery('');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{isAr ? category.labelAr : category.labelEn}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                    isSelected
                      ? 'bg-slate-950/15 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Categorized Quick-Select Dropdown */}
        <select
          aria-label={isAr ? 'اختر نموذجاً سريعاً حسب الفئة' : 'Quick select preset by category'}
          data-testid="ge-preset-category-select"
          value={activePresetId ?? ''}
          onChange={(e) => {
            const val = e.target.value as GePresetId | '';
            if (val) {
              loadPreset(val);
            }
          }}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{isAr ? 'انتقال سريع حسب الفئة...' : 'Jump to preset...'}</option>
          {GE_PRESET_CATEGORIES.map((category) => (
            <optgroup key={category.id} label={isAr ? category.labelAr : category.labelEn}>
              {GE_INDUSTRY_PRESETS.filter((p) => p.category === category.id).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {isAr ? preset.labelAr : preset.labelEn}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Search Input Filter by Name or Source Type */}
        <div className="relative flex items-center min-w-[190px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 absolute start-2.5 pointer-events-none" />
          <input
            type="text"
            value={presetSearchQuery}
            onChange={(e) => setPresetSearchQuery(e.target.value)}
            data-testid="ge-preset-search-input"
            aria-label={
              isAr
                ? 'ابحث في النماذج بالاسم أو نوع المصدر'
                : 'Search quick presets by name or source type'
            }
            placeholder={
              isAr ? 'بحث بالاسم أو المصدر (Ir-192, Co-60)...' : 'Filter by name or source (Ir-192, Se-75)...'
            }
            className="w-full ps-8 pe-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
          {presetSearchQuery && (
            <button
              type="button"
              data-testid="ge-preset-search-clear"
              aria-label={isAr ? 'مسح البحث' : 'Clear preset search'}
              onClick={() => setPresetSearchQuery('')}
              className="absolute end-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>

        {/* Active Category or Search Match Preset Buttons */}
        <div
          data-testid="ge-preset-buttons-list"
          className="flex flex-wrap items-center gap-2 basis-full sm:basis-auto"
        >
          {visiblePresets.length > 0 ? (
            visiblePresets.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={preset.testId}
                  onClick={() => loadPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-xl border font-mono transition cursor-pointer ${
                    isActive
                      ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                  }`}
                >
                  {isAr ? preset.labelAr : preset.labelEn}
                </button>
              );
            })
          ) : (
            <div
              data-testid="ge-preset-search-empty"
              className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            >
              <span>
                {isAr
                  ? `لا توجد نماذج مطابقة لـ "${presetSearchQuery}"`
                  : `No presets matching "${presetSearchQuery}"`}
              </span>
              <button
                type="button"
                onClick={() => setPresetSearchQuery('')}
                className="text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer"
              >
                {isAr ? 'إعادة ضبط' : 'Clear'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------
          PRIMARY READOUT HUD (THE SIGNATURE GE DISPLAY)
      ------------------------------------------------------------------- */}
      <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {isAr ? 'زمن التعريض المحسوب بدقة GE' : 'Calculated Radiographic Exposure Time'}
              </span>
              <button
                type="button"
                data-testid="ge-hud-toggle-beam-overlay"
                data-overlay-visible={showBeamOverlay ? 'true' : 'false'}
                aria-pressed={!showBeamOverlay}
                onClick={() => {
                  setShowBeamOverlay((prev) => {
                    if (prev) setIs4dPlaying(false);
                    return !prev;
                  });
                }}
                title={
                  showBeamOverlay
                    ? isAr
                      ? 'إخفاء مخطط 4D وكثافة الحزمة للتركيز على الحسابات الرقمية الأساسية'
                      : 'Hide 4D / Beam Intensity overlay to focus on basic numeric calculations'
                    : isAr
                    ? 'إظهار مخطط 4D وكثافة الحزمة'
                    : 'Show 4D / Beam Intensity overlay'
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition cursor-pointer ${
                  showBeamOverlay
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/50'
                    : 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30'
                }`}
              >
                {showBeamOverlay ? (
                  <EyeOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {showBeamOverlay
                    ? isAr
                      ? 'إخفاء مخطط 4D والحزمة'
                      : 'Hide 4D / Beam Overlay'
                    : isAr
                    ? 'إظهار مخطط 4D والحزمة'
                    : 'Show 4D / Beam Overlay'}
                </span>
              </button>

              <button
                type="button"
                data-testid="ge-hud-toggle-lead-screen-overlay"
                data-layer-active={showLeadScreenOverlay ? 'true' : 'false'}
                aria-pressed={showLeadScreenOverlay}
                onClick={() => setShowLeadScreenOverlay((prev) => !prev)}
                title={
                  isAr
                    ? 'إظهار أو إخفاء طبقة شدة شاشات الرصاص (Pb) داخل مخطط 4D'
                    : 'Toggle Lead-Screen (Pb) intensity intensification overlay inside the 4D beam visualizer'
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition cursor-pointer ${
                  showLeadScreenOverlay
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                } ${!showBeamOverlay ? 'opacity-60' : ''}`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {showLeadScreenOverlay
                    ? isAr
                      ? 'شدة شاشات Pb: ظاهر'
                      : 'Pb Screen Intensity: ON'
                    : isAr
                    ? 'شدة شاشات Pb: مخفي'
                    : 'Pb Screen Intensity: OFF'}
                </span>
              </button>

              <button
                type="button"
                data-testid="ge-hud-toggle-weld-profile-overlay"
                data-layer-active={showWeldProfileOverlay ? 'true' : 'false'}
                aria-pressed={showWeldProfileOverlay}
                onClick={() => setShowWeldProfileOverlay((prev) => !prev)}
                title={
                  isAr
                    ? 'إظهار أو إخفاء مُصوِّر مقطع تقوية اللحام داخل مخطط 4D'
                    : 'Toggle Weld-Reinforcement profile visualizer inside the 4D beam visualizer'
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition cursor-pointer ${
                  showWeldProfileOverlay
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                } ${!showBeamOverlay ? 'opacity-60' : ''}`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {showWeldProfileOverlay
                    ? isAr
                      ? 'مقطع تقوية اللحام: ظاهر'
                      : 'Weld Profile Visualizer: ON'
                    : isAr
                    ? 'مقطع تقوية اللحام: مخفي'
                    : 'Weld Profile Visualizer: OFF'}
                </span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span
                data-testid="ge-calculated-exposure-display"
                className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums"
              >
                {calcResult.minutesPortion}m {calcResult.secondsPortion.toString().padStart(2, '0')}s
              </span>
              <span className="text-lg sm:text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                ({calcResult.calculatedTotalSeconds}s)
              </span>
              <button
                type="button"
                data-testid="ge-hud-print-technique-card-btn"
                onClick={() => setShowTechniqueSheetModal(true)}
                aria-label={isAr ? 'طباعة كارت تقنية التصوير الإشعاعي' : 'Print Technique Card'}
                title={isAr ? 'فتح وطباعة كارت تقنية التصوير الإشعاعي (ASME Sec V)' : 'Print Technique Card (ASME Sec V)'}
                className="inline-flex items-center justify-center p-2 rounded-xl border border-amber-500/40 bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
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
                      <span className="ms-1.5 text-emerald-400 font-bold">
                        ({Math.round((calcResult.multiFilmTimeFactor - 1) * 100)}% time · ×{calcResult.multiFilmTimeFactor.toFixed(2)})
                      </span>
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

        {/* Real-Time 4D Isotope Activity Decay Automated Playback Slider */}
        <div
          data-testid="ge-decay-4d-playback-panel"
          className="relative z-10 rounded-2xl border border-slate-300/70 dark:border-slate-700/80 bg-white/85 dark:bg-slate-950/85 p-3.5 sm:p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <Activity className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {isAr
                  ? 'محاكي التمرير التلقائي لتحلل النظير 4D (تحديث لحظي لزمن التعريض)'
                  : '4D Isotope Activity Decay Playback (Real-Time Exposure Sync)'}
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {realtime4dSnapshot.isGamma
                  ? `T½ = ${realtime4dSnapshot.halfLifeDays}d · ${measurementDate}`
                  : isAr
                    ? 'X-Ray بجهد ثابت (بدون اضمحلال)'
                    : 'Constant-Potential X-Ray (No Decay)'}
              </span>
            </div>

            {realtime4dSnapshot.isGamma && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="ge-decay-4d-play-btn"
                  aria-pressed={isRealtime4dPlaying}
                  onClick={() => setIsRealtime4dPlaying((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isRealtime4dPlaying
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                      : 'bg-sky-600 text-white hover:bg-sky-500 shadow-sm'
                  }`}
                >
                  {isRealtime4dPlaying ? (
                    <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {isRealtime4dPlaying
                      ? isAr
                        ? 'إيقاف 4D'
                        : 'Pause Decay'
                      : isAr
                        ? 'تشغيل 4D تلقائي'
                        : 'Play Decay'}
                  </span>
                </button>

                <div
                  role="group"
                  aria-label={isAr ? 'سرعة محاكاة 4D' : '4D Playback Speed'}
                  className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-mono"
                >
                  {([0.5, 1, 2] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      data-testid={`ge-decay-4d-speed-${spd}`}
                      onClick={() => setRealtime4dSpeed(spd)}
                      className={`px-2 py-1 font-bold transition cursor-pointer ${
                        realtime4dSpeed === spd
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  data-testid="ge-decay-4d-reset-btn"
                  onClick={() => {
                    setIsRealtime4dPlaying(false);
                    handleRealtime4dDayChange(0);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'تصفير t₀' : 'Reset t₀'}</span>
                </button>
              </div>
            )}
          </div>

          {realtime4dSnapshot.isGamma ? (
            <>
              {/* Live 4D Decay Curve Visualization + Real-Time Activity/Exposure Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-5 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-3 py-2">
                  <svg
                    viewBox="0 0 220 32"
                    className="w-44 sm:w-52 h-8 shrink-0"
                    aria-hidden="true"
                  >
                    <line x1="4" x2="216" y1="28" y2="28" stroke="#475569" strokeOpacity="0.35" strokeWidth="1" />
                    <path
                      d={realtime4dSnapshot.sparklinePath}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1={realtime4dSnapshot.markerX}
                      x2={realtime4dSnapshot.markerX}
                      y1="2"
                      y2="30"
                      stroke="#0ea5e9"
                      strokeWidth="1.25"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={realtime4dSnapshot.markerX}
                      cy={realtime4dSnapshot.markerY}
                      r="3.5"
                      fill="#0ea5e9"
                      stroke="#ffffff"
                      strokeWidth="1.25"
                    />
                  </svg>

                  <div className="flex-1 min-w-0 space-y-1 font-mono tabular-nums">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>A(t) / A₀</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {realtime4dSnapshot.percentRemaining.toFixed(1)}%
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 100 6"
                      data-testid="ge-decay-4d-activity-bar"
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      aria-hidden="true"
                    >
                      <rect x="0" y="0" width="100" height="6" rx="3" fill="#1e293b" fillOpacity="0.25" />
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(2, Math.min(100, realtime4dSnapshot.percentRemaining))}
                        height="6"
                        rx="3"
                        fill={realtime4dSnapshot.percentRemaining <= 25 ? '#ef4444' : '#f59e0b'}
                      />
                    </svg>
                  </div>
                </div>

                <div
                  data-testid="ge-decay-4d-activity-readout"
                  className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-3 py-2 text-xs font-mono tabular-nums flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'النشاط عند الزمن t' : 'Live Activity A(t)'}
                    </span>
                    <strong className="text-amber-600 dark:text-amber-400">
                      {calcResult.currentLiveActivityCi} Ci / {initialActivityCi} Ci
                    </strong>
                  </div>
                  <div className="text-end">
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      t = +{realtime4dSnapshot.currentDay}d
                    </span>
                    <strong className="text-sky-600 dark:text-sky-400">
                      {realtime4dSnapshot.halfLivesElapsed.toFixed(2)} T½
                    </strong>
                  </div>
                </div>

                <div
                  data-testid="ge-decay-4d-multiplier-readout"
                  className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-3 py-2 text-xs font-mono tabular-nums flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'معامل الزمن المحسوب' : 'Live Exposure Sync'}
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ×{realtime4dSnapshot.exposureMultiplier.toFixed(2)} t₀
                    </strong>
                  </div>
                  <strong className="text-slate-900 dark:text-white">
                    {calcResult.formattedDuration}
                  </strong>
                </div>
              </div>

              {/* Continuous Real-Time Timeline Slider & Milestone Steps */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">0d</span>
                  <input
                    type="range"
                    data-testid="ge-decay-4d-slider"
                    aria-label={isAr ? 'شريط التمرير الزمني لتحلل النظير 4D' : '4D Isotope Activity Decay Playback Slider'}
                    min={0}
                    max={realtime4dSnapshot.maxDays}
                    step={1}
                    value={realtime4dSnapshot.currentDay}
                    onChange={(e) => {
                      setIsRealtime4dPlaying(false);
                      handleRealtime4dDayChange(Number(e.target.value));
                    }}
                    className={`w-full ${unitRangeAccentClass} cursor-pointer`}
                  />
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">
                    {realtime4dSnapshot.maxDays}d
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  {[
                    { id: 't0', label: 't₀ (100%)', days: 0 },
                    { id: 'half', label: '½ T½ (71%)', days: Math.round(realtime4dSnapshot.halfLifeDays * 0.5) },
                    { id: '1hl', label: '1×T½ (50%)', days: Math.round(realtime4dSnapshot.halfLifeDays) },
                    { id: '2hl', label: '2×T½ (25%)', days: Math.round(realtime4dSnapshot.halfLifeDays * 2) }
                  ].map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      data-testid={`ge-decay-4d-jump-${step.id}`}
                      onClick={() => {
                        setIsRealtime4dPlaying(false);
                        handleRealtime4dDayChange(step.days);
                      }}
                      className={`px-2 py-1 rounded-lg border transition cursor-pointer tabular-nums ${
                        Math.abs(realtime4dSnapshot.currentDay - step.days) <= 1
                          ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-500/50'
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-sky-600 dark:text-sky-400 py-1">
              <span>
                {isAr
                  ? 'أنبوب الأشعة السينية يعمل بجهد مستمر (kV/mA ثابتة — 100% خرج إشعاعي بدون تحلل زمني).'
                  : 'Constant-Potential X-Ray Tube Generator — 100% steady output (0% radioactive isotope decay).'}
              </span>
              <span className="tabular-nums font-bold">
                {tubeKv} kV · {tubeMa} mA · {calcResult.formattedDuration}
              </span>
            </div>
          )}
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
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              {csvExportedConfirmed
                ? (isAr ? 'تم تصدير CSV' : 'CSV Exported')
                : (isAr ? 'تصدير CSV' : 'Export CSV')}
            </span>
          </button>

          {/* Export Conversion Log Structured PDF Report Button inside #ge-quick-units-bar */}
          <button
            type="button"
            data-testid="ge-quick-units-export-pdf-btn"
            onClick={handleExportConversionLogPdf}
            disabled={conversionLog.length === 0}
            title={
              conversionLog.length === 0
                ? (isAr ? 'بدّل الوحدات أولاً لتصدير تقرير PDF منسق' : 'Switch units at least once to export conversion log PDF report')
                : (isAr ? 'تصدير سجل التحويلات الحالي كتقرير PDF رسمي منسق' : 'Export current unit conversion log as a structured PDF report')
            }
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors duration-300 ease-in-out flex items-center gap-1.5 ${
              conversionLog.length === 0
                ? 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                : conversionPdfExportedConfirmed
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-pointer'
                  : 'bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              {conversionPdfExportedConfirmed
                ? (isAr ? 'تم تصدير PDF' : 'PDF Exported')
                : (isAr ? 'تصدير PDF' : 'Export PDF')}
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

          {/* Dual Composite Note & Fine-Tuning Time-Correction Factor Slider (ASME Section V T-282.1) */}
          {filmLoadingMode === 'dual_composite' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>ASME Sec V T-282.1 Superimposed Viewing</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                {isAr
                  ? `يتم تحميل فيلمين متطابقين في نفس الكاسيت وقراءتهما متطابقين؛ تجمع الكثافات الضوئية مما يضبط وقت التعريض عبر معامل تصحيح الزمن (${compositeTimeCorrectionFactor.toFixed(2)}×).`
                  : `Two identical films exposed together and viewed superimposed. Densities sum (D = D1 + D2), scaling exposure duration via the Time-Correction Factor (${compositeTimeCorrectionFactor.toFixed(2)}x).`}
              </p>

              {/* Time-Correction Factor Fine-Tuning Slider */}
              <div className="pt-1 space-y-1.5 border-t border-amber-500/20">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="ge-composite-time-correction-slider"
                    className="text-[11px] font-bold text-slate-700 dark:text-slate-200"
                  >
                    {isAr ? 'معامل تصحيح الزمن (Time-Correction Factor):' : 'Time-Correction Factor:'}
                  </label>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span
                      data-testid="ge-composite-time-correction-value"
                      className="font-black text-amber-600 dark:text-amber-400"
                    >
                      ×{compositeTimeCorrectionFactor.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ({Math.round((compositeTimeCorrectionFactor - 1) * 100)}%)
                    </span>
                    {Math.abs(compositeTimeCorrectionFactor - 0.55) > 0.005 && (
                      <button
                        type="button"
                        data-testid="ge-composite-time-correction-reset"
                        onClick={() => setCompositeTimeCorrectionFactor(0.55)}
                        className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] text-amber-700 dark:text-amber-300 font-bold cursor-pointer"
                      >
                        0.55×
                      </button>
                    )}
                  </div>
                </div>
                <input
                  id="ge-composite-time-correction-slider"
                  type="range"
                  data-testid="ge-composite-time-correction-slider"
                  aria-label={isAr ? 'معامل تصحيح الزمن للأفلام المتراكبة' : 'Time-Correction Factor'}
                  min={0.40}
                  max={0.85}
                  step={0.01}
                  value={compositeTimeCorrectionFactor}
                  onChange={(e) => setCompositeTimeCorrectionFactor(Number(e.target.value))}
                  className={`w-full h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer ${unitRangeAccentClass}`}
                />
                <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
                  <span>0.40× (-60%)</span>
                  <span>0.55× (ASME Std)</span>
                  <span>0.85× (-15%)</span>
                </div>
              </div>

              <div className="text-[10px] text-amber-600 dark:text-amber-500 font-bold pt-0.5 tabular-nums">
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
      {showBeamOverlay && (() => {
        const pathLeft = 196;
        const pathWidth = 396;
        const plotTop = 46;
        const plotBottom = 226;
        const plotHeight = plotBottom - plotTop;
        const clampedSfdCm = Math.max(25, Math.min(200, sfdCm));
        const sourceCenterX =
          clampedSfdCm <= 70
            ? Number((62 - ((clampedSfdCm - 25) / 45) * 16).toFixed(1))
            : Number((46 - Math.min(1, (clampedSfdCm - 70) / 80) * 22).toFixed(1));
        const collimatorX = Number((sourceCenterX + 22).toFixed(1));
        const sourceCenterY = 136;
        const filmPlaneX = pathLeft + pathWidth + 14;

        // Inverse-square distance scaling relative to standard 70 cm SFD (exact 1.0 at 70 cm)
        const sfdDistanceFactor = Number(Math.pow(70 / Math.max(20, clampedSfdCm), 2).toFixed(4));
        const yAxisMaxPct = Math.max(100, Number((100 * sfdDistanceFactor).toFixed(2)));
        const curveTransitionClass =
          is4dViewActive && is4dPlaying ? 'rt-beam-curve-transition-playback' : 'rt-beam-curve-transition';

        const normToX = (normX: number) => pathLeft + normX * pathWidth;
        const intensityToY = (pct: number) =>
          plotBottom - (Math.max(0, Math.min(yAxisMaxPct, pct)) / yAxisMaxPct) * plotHeight;

        const uniformBaselinePoints = sampleUniformCurvePoints(beamDecayProfile.points, 96);
        const baselineCurveD = uniformBaselinePoints
          .map(
            (pt, idx) =>
              `${idx === 0 ? 'M' : 'L'} ${normToX(pt.normX).toFixed(1)} ${intensityToY(pt.intensityPct * sfdDistanceFactor).toFixed(1)}`
          )
          .join(' ');
        const activeCurvePoints = is4dViewActive ? shift4d.shiftedBeamPoints : beamDecayProfile.points;
        const uniformActivePoints = sampleUniformCurvePoints(activeCurvePoints, 96);
        const targetCurveCoords: SvgCurveCoord[] = uniformActivePoints.map((pt) => ({
          x: Number(normToX(pt.normX).toFixed(1)),
          y: Number(intensityToY(pt.intensityPct * sfdDistanceFactor).toFixed(1))
        }));

        const activeDecayScale = is4dViewActive ? shift4d.decayFraction : 1;
        const rawExitPct = is4dViewActive ? shift4d.shiftedExitIntensityPct : beamDecayProfile.exitIntensityPct;
        const displayedExitPct = Number((rawExitPct * sfdDistanceFactor).toFixed(2));
        const baseProbePoint = beamDecayProbePoint ?? beamDecayProfile.points[beamDecayProfile.points.length - 1];
        const activePoint: BeamDecayPoint = {
          ...baseProbePoint,
          intensityPct: Number((baseProbePoint.intensityPct * activeDecayScale * sfdDistanceFactor).toFixed(2))
        };
        const probeSvgX = beamDecayProbePoint ? normToX(beamDecayProbePoint.normX) : null;
        const probeSvgY = beamDecayProbePoint ? intensityToY(activePoint.intensityPct) : null;

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

        // Synchronize photon travel speed & stream cadence with active isotope / SFD distance / 4D decayed intensity
        const baseEffectiveRhm = is4dViewActive
          ? shift4d.doseRate1mRhm
          : selectedIsotope.category === 'gamma'
            ? Math.max(0.2, calcResult.currentLiveActivityCi * selectedIsotope.gammaConstantRhmPerCi)
            : Math.max(0.5, tubeMa * Math.pow(Math.max(60, tubeKv) / 180, 2) * 3.8);
        const effectiveIntensityRhm = Number((baseEffectiveRhm * sfdDistanceFactor).toFixed(2));
        const intensityNorm = Math.max(
          0,
          Math.min(1, Math.log10(Math.max(1, effectiveIntensityRhm)) / Math.log10(120))
        );
        const photonDurationSec = is4dViewActive && sfdCm === 70
          ? shift4d.photonDurationSec
          : Number((3.1 - intensityNorm * 2.45).toFixed(2));
        const streamCycleSec = is4dViewActive && sfdCm === 70
          ? shift4d.streamCycleSec
          : Number((photonDurationSec * 0.62).toFixed(2));
        const photonParticleCount = is4dViewActive
          ? shift4d.photonParticleCount
          : Math.max(4, Math.min(9, Math.round(4 + intensityNorm * 5)));
        const photonExitOpacity = Number(
          Math.max(0.2, Math.min(0.92, 0.2 + (Math.min(100, displayedExitPct) / 100) * 0.72)).toFixed(2)
        );
        const photonAccentColor = selectedIsotope.category === 'xray' ? '#38bdf8' : '#fbbf24';
        const photonCoreColor = selectedIsotope.category === 'xray' ? '#e0f2fe' : '#fef3c7';
        const photonTravelDx = filmPlaneX - (sourceCenterX + 6);
        const photonLanePattern = [0, -0.52, 0.52, -0.24, 0.24, -0.68, 0.68, -0.1, 0.1];
        const sourceConeOpacityMultiplier =
          (is4dViewActive ? Math.max(0.28, activeDecayScale) : 1) * Math.max(0.35, Math.min(1.2, sfdDistanceFactor));

        return (
          <div
            data-testid="ge-beam-intensity-decay-overlay"
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 space-y-4"
          >
            {/* Header & Quantitative Telemetry Strip */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
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
                  <button
                    type="button"
                    data-testid="ge-beam-toggle-longitudinal-waves"
                    aria-pressed={showLongitudinalWaveSim}
                    onClick={() => setShowLongitudinalWaveSim((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                      showLongitudinalWaveSim
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10'
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'الموجات الطولية (UT)' : 'Longitudinal Waves'}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="ge-4d-view-toggle"
                    aria-pressed={is4dViewActive}
                    onClick={handleToggle4dView}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-colors ${
                      is4dViewActive
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>{isAr ? 'عرض 4D الزمني للاضمحلال' : '4D Decay View'}</span>
                    <span className="px-1 py-0.5 rounded bg-slate-900/10 dark:bg-white/10 text-[9px] uppercase">
                      {is4dViewActive ? (isAr ? 'مفعّل' : 'ON') : isAr ? 'إيقاف' : 'OFF'}
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="ge-beam-toggle-lead-screen-overlay"
                    data-layer-active={showLeadScreenOverlay ? 'true' : 'false'}
                    aria-pressed={showLeadScreenOverlay}
                    onClick={() => setShowLeadScreenOverlay((prev) => !prev)}
                    title={
                      isAr
                        ? 'إظهار أو إخفاء طبقة شدة شاشات الرصاص (Pb) لتقليل التزاحم البصري في مسار الحزمة'
                        : 'Toggle Lead Screen (Pb) intensity overlay visibility to declutter the beam visualization'
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                      showLeadScreenOverlay
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {showLeadScreenOverlay ? (
                      <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{isAr ? 'طبقة شدة Pb' : 'Lead Screen (Pb) Overlay'}</span>
                    <span className="px-1 py-0.5 rounded bg-slate-900/10 dark:bg-white/10 text-[9px] uppercase">
                      {showLeadScreenOverlay ? (isAr ? 'ظاهر' : 'ON') : isAr ? 'مخفي' : 'OFF'}
                    </span>
                  </button>
                  <div className="relative inline-flex items-center gap-1 group/pb-tip">
                    <motion.button
                      id="ge-beam-toggle-pb-photoelectron-paths"
                      type="button"
                      data-testid="ge-beam-toggle-pb-photoelectron-paths"
                      data-layer-active={showPbPhotoelectronPaths ? 'true' : 'false'}
                      data-pb-screens-active={hasLeadScreens ? 'true' : 'false'}
                      aria-pressed={showPbPhotoelectronPaths}
                      aria-describedby="ge-pb-photoelectron-physics-tooltip"
                      whileTap={{ scale: 0.94 }}
                      animate={{ scale: showPbPhotoelectronPaths ? 1 : 0.97 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onClick={() => {
                        setHasInteractedWithPbPaths(true);
                        setShowPbPhotoelectronPaths((prev) => {
                          const next = !prev;
                          if (next && !showLeadScreenOverlay) {
                            setShowLeadScreenOverlay(true);
                          }
                          return next;
                        });
                      }}
                      title={
                        isAr
                          ? 'إظهار أو إخفاء مسارات الفوتوإلكترونات الثانوية (e⁻) المتجهة من شاشات الرصاص إلى مستوى الفيلم لتوضيح آلية التقوية'
                          : 'Toggle secondary photoelectron (e⁻) intensification vector paths from Pb screens to the film plane'
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all duration-200 cursor-pointer ${
                        showPbPhotoelectronPaths
                          ? 'bg-teal-500/15 border-teal-500/60 text-teal-700 dark:text-teal-300 shadow-sm hover:bg-teal-500/25'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      } ${!showLeadScreenOverlay ? 'opacity-55' : ''}`}
                    >
                      <Zap
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                          showPbPhotoelectronPaths ? 'scale-105 text-teal-500' : 'scale-95 opacity-70'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{isAr ? 'مسارات e⁻ للرصاص' : 'Pb e⁻ Paths'}</span>
                      <motion.span
                        key={showPbPhotoelectronPaths ? 'on' : 'off'}
                        initial={{ opacity: 0, scale: 0.78 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="px-1 py-0.5 rounded bg-slate-900/10 dark:bg-white/10 text-[9px] uppercase"
                      >
                        {showPbPhotoelectronPaths ? (isAr ? 'ظاهر' : 'ON') : isAr ? 'مخفي' : 'OFF'}
                      </motion.span>
                    </motion.button>

                    <div
                      role="group"
                      data-testid="ge-pb-ghost-trail-length-toggle"
                      data-trail-length={pbGhostTrailLength}
                      aria-label={isAr ? 'طول أثر الشبح للإلكترونات' : 'Photoelectron ghost trail length'}
                      className={`inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 transition-opacity ${
                        showPbPhotoelectronPaths && hasLeadScreens ? 'opacity-100' : 'opacity-80'
                      }`}
                    >
                      <span className="px-1.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 select-none">
                        {isAr ? 'أثر الشبح:' : 'Ghost Trail:'}
                      </span>
                      {(['short', 'medium', 'long'] as const).map((lenOpt) => {
                        const cfg = GE_PB_GHOST_TRAIL_CONFIGS[lenOpt];
                        const isSelected = pbGhostTrailLength === lenOpt;
                        return (
                          <button
                            key={lenOpt}
                            id={`ge-pb-ghost-trail-length-${lenOpt}`}
                            type="button"
                            data-testid={`ge-pb-ghost-trail-length-${lenOpt}`}
                            data-trail-length-option={lenOpt}
                            data-state={isSelected ? 'active' : 'inactive'}
                            aria-pressed={isSelected}
                            onClick={() => {
                              setPbGhostTrailLength(lenOpt);
                              if (!showLeadScreenOverlay) {
                                setShowLeadScreenOverlay(true);
                              }
                              if (!showPbPhotoelectronPaths) {
                                setShowPbPhotoelectronPaths(true);
                              }
                            }}
                            title={
                              isAr
                                ? `طول الأثر الضوئي المتبقي: ${cfg.labelAr} (${cfg.residual.reachFactor}×)`
                                : `Ghost trail wake length: ${cfg.labelEn} (${cfg.residual.reachFactor}× residual reach)`
                            }
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-500/20 text-teal-700 dark:text-teal-200 border border-teal-500/50 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 border border-transparent hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {isAr ? cfg.labelAr : cfg.labelEn}
                          </button>
                        );
                      })}
                      <span
                        data-testid="ge-pb-ghost-trail-reach-badge"
                        className="px-1 text-[9px] font-mono font-bold text-teal-600 dark:text-teal-300 tabular-nums"
                      >
                        {GE_PB_GHOST_TRAIL_CONFIGS[pbGhostTrailLength].residual.reachFactor}×
                      </span>
                    </div>

                    <button
                      type="button"
                      data-testid="ge-pb-photoelectron-info-btn"
                      aria-label={
                        isAr
                          ? 'شرح فيزياء تقوية الإلكترونات الثانوية وتحسين تباين الفيلم'
                          : 'Explain secondary photoelectron intensification physics and film contrast gain'
                      }
                      aria-expanded={showPbPhysicsTooltip}
                      aria-controls="ge-pb-photoelectron-physics-tooltip"
                      onClick={() => setShowPbPhysicsTooltip((prev) => !prev)}
                      onBlur={() => setShowPbPhysicsTooltip(false)}
                      className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors cursor-help ${
                        showPbPhysicsTooltip
                          ? 'bg-teal-500/20 border-teal-500/60 text-teal-600 dark:text-teal-300'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:border-teal-500/50'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <div
                      id="ge-pb-photoelectron-physics-tooltip"
                      role="tooltip"
                      data-testid="ge-pb-photoelectron-physics-tooltip"
                      data-open={showPbPhysicsTooltip ? 'true' : 'false'}
                      className={`pointer-events-none absolute top-full mt-2 ${
                        isAr ? 'left-0' : 'right-0'
                      } z-40 w-80 sm:w-96 rounded-xl bg-slate-950 text-slate-100 border border-teal-500/40 p-3.5 text-[11px] leading-relaxed shadow-2xl transition-all duration-150 ${
                        showPbPhysicsTooltip
                          ? 'opacity-100 visible translate-y-0'
                          : 'opacity-0 invisible translate-y-1 group-hover/pb-tip:opacity-100 group-hover/pb-tip:visible group-hover/pb-tip:translate-y-0 group-focus-within/pb-tip:opacity-100 group-focus-within/pb-tip:visible group-focus-within/pb-tip:translate-y-0'
                      }`}
                    >
                      <div className="font-bold text-teal-300 mb-1.5 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 shrink-0 text-teal-400" aria-hidden="true" />
                        <span>
                          {isAr
                            ? 'فيزياء تقوية الفوتوإلكترونات الثانوية (Pb e⁻) وتباين الفيلم'
                            : 'Secondary Photoelectron (Pb e⁻) Intensification & Contrast'}
                        </span>
                      </div>
                      <p className="text-slate-300 mb-2">
                        {isAr
                          ? 'تمتص رقائق الرصاص (Z = 82) فوتونات الجاما والإكس راي عبر التأثير الكهروضوئي، وتطلق إلكترونات ثانوية (e⁻) عالية الكفاءة داخل مستحلب الفيلم، مما يضاعف سرعة الفيلم (~2× إلى 3× عامل تقوية) ويقلص زمن التعريض.'
                          : 'High-Z Lead foils (Z = 82) absorb X/Gamma photons via the photoelectric effect and emit localized secondary electrons (e⁻) directly into the silver halide emulsion, amplifying photographic response (~2×–3× Intensification Factor) and cutting exposure time.'}
                      </p>
                      <p className="text-slate-300 mb-2.5">
                        {isAr
                          ? 'تعزيز التباين: تفلتر الرقاقة الأمامية الإشعاع المشتت منخفض الطاقة وتسمح للفوتونات الأولية فقط بالمساهمة في تكوين الصورة، بينما تحجب الرقاقة الخلفية التشتت الخلفي (Backscatter)، مما يرفع تباين الفيلم (ΔD) وحساسية سلك IQI.'
                          : 'Contrast Gain: The front Pb screen selectively filters low-energy forward scatter while primary photons drive dense localized e⁻ tracks; the rear Pb foil absorbs backscatter—sharpening film contrast (ΔD) and IQI wire sensitivity.'}
                      </p>
                      <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[10px]">
                        <div className="flex items-center gap-2 text-amber-200">
                          <span className="inline-block w-5 h-1 rounded-full bg-gradient-to-r from-yellow-300 via-lime-400 to-teal-400 shrink-0" />
                          <span>
                            {isAr
                              ? 'تدرج الطاقة: أصفر دافئ (Pb) ← فيروزي بارد (تبدّد بالفيلم)'
                              : 'Energy dissipation: Warm Yellow (Pb) → Cool Teal (Film)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-300">
                          <span className="inline-block w-3.5 h-0.5 bg-gradient-to-r from-yellow-300 to-teal-400 shrink-0" />
                          <span>
                            {isAr
                              ? 'Front Pb → Film: فوتوإلكترونات أمامية + فلترة التشتت'
                              : 'Front Pb → Film: Forward e⁻ emission + scatter filtration'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-teal-300">
                          <span className="inline-block w-3.5 h-0.5 bg-gradient-to-r from-yellow-300 to-teal-400 shrink-0" />
                          <span>
                            {isAr
                              ? 'Back Pb → Film: إلكترونات مرتدة + حجب التشتت الخلفي'
                              : 'Back Pb → Film: Backscattered e⁻ + backscatter shielding'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-300">
                          <span className="inline-block w-3.5 h-0.5 bg-gradient-to-r from-yellow-300 to-teal-400 shrink-0" />
                          <span>
                            {isAr
                              ? 'Interleaf Pb (Dual): تقوية ثنائية الاتجاه للفيلم المزدوج'
                              : 'Interleaf Pb (Dual): Bidirectional e⁻ boost for dual films'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="inline-block w-3.5 h-0.5 bg-teal-400/50 blur-[1px] shrink-0" />
                          <span>
                            {isAr
                              ? 'أثر الشبح (Ghost Trail): قصير / متوسط / طويل لتبدّد الطاقة'
                              : 'Ghost Trail Wake: Short / Medium / Long residual persistence'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  I(x,t) = I₀(0)·0.5^(t/T½)·0.5^(x_eq/HVL) · {selectedIsotope.chemicalSymbol} (HVL{' '}
                  {formatLen(beamDecayProfile.effectiveHvlMm)}) · {selectedMaterial.nameEn.split('(')[0].trim()} (R=
                  {beamDecayProfile.rFactor.toFixed(2)}) ·{' '}
                  {beamDecayProfile.wallsPenetrated === 2 ? (isAr ? 'جدار مزدوج' : '2-Wall Path') : isAr ? 'جدار مفرد' : '1-Wall Path'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
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
                    {is4dViewActive ? (isAr ? 'الشدة الخارجة I(t)/I₀' : '4D Exit I(t)/I₀') : isAr ? 'الشدة الخارجة للفيلم' : 'Exit Intensity I/I₀'}
                  </span>
                  <strong data-testid="ge-beam-decay-exit-pct" className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {displayedExitPct.toFixed(2)}%
                  </strong>
                </div>
                <div
                  data-testid="ge-beam-photon-sync-hud"
                  data-photon-duration={photonDurationSec}
                  data-intensity-rhm={effectiveIntensityRhm.toFixed(2)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">
                    {isAr ? 'تدفق الفوتونات' : 'Photon Flux Sync'}
                  </span>
                  <strong className="text-amber-600 dark:text-amber-400 tabular-nums">
                    {effectiveIntensityRhm.toFixed(1)} R/h · {photonDurationSec.toFixed(2)}s
                  </strong>
                </div>
              </div>
            </div>

            {/* 4D Time-Based Decay Control Bar & Parameter Shift HUD */}
            {is4dViewActive && (
              <div className="space-y-3">
                <div
                  data-testid="ge-4d-controls-bar"
                  className="rounded-2xl border border-cyan-500/35 bg-white dark:bg-slate-900/95 p-3.5 sm:p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid="ge-4d-play-btn"
                        onClick={() => setIs4dPlaying((p) => !p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                      >
                        {is4dPlaying ? (
                          <Pause className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Play className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>
                          {is4dPlaying
                            ? isAr
                              ? 'إيقاف العرض 4D'
                              : 'Pause 4D Decay'
                            : isAr
                              ? 'تشغيل محاكاة 4D'
                              : 'Play 4D Decay'}
                        </span>
                      </button>

                      <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-mono">
                        {([0.5, 1, 2] as const).map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            data-testid={`ge-4d-speed-${spd}`}
                            onClick={() => setPlaybackSpeed4d(spd)}
                            className={`px-2 py-1 font-bold transition-colors ${
                              playbackSpeed4d === spd
                                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        data-testid="ge-4d-reset-btn"
                        onClick={() => {
                          setIs4dPlaying(false);
                          setDayOffset4d(0);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'يوم الصفر t₀' : 'Reset t₀'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {isAr ? 'اليوم:' : 'Timeline:'}{' '}
                        <strong className="text-cyan-600 dark:text-cyan-400">
                          t = +{shift4d.dayOffset}d
                        </strong>{' '}
                        ({shift4d.projectedDateStr})
                        {shift4d.isGammaIsotope && (
                          <span className="text-slate-500 dark:text-slate-400">
                            {' '}
                            · {shift4d.halfLivesElapsed.toFixed(2)} T½
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        data-testid="ge-4d-apply-date-btn"
                        onClick={() => setMeasurementDate(shift4d.projectedDateStr)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-bold hover:bg-amber-500/25 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'تطبيق تاريخ 4D على اللقطة' : 'Apply 4D Date to Shot'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Continuous 4D Timeline Scrubber & Half-Life Milestones */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 flex items-center gap-2.5">
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">0d</span>
                      <input
                        type="range"
                        data-testid="ge-4d-day-scrubber"
                        aria-label={isAr ? 'شريط التمرير الزمني 4D بالأيام' : '4D Decay Day Scrubber'}
                        min={0}
                        max={shift4d.maxHorizonDays}
                        step={1}
                        value={shift4d.dayOffset}
                        onChange={(e) => {
                          setIs4dPlaying(false);
                          setDayOffset4d(Number(e.target.value));
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">
                        {shift4d.maxHorizonDays}d
                      </span>
                    </div>

                    {shift4d.isGammaIsotope ? (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        {[
                          { id: 't0', label: 't₀ (100%)', days: 0 },
                          { id: 'half', label: '½ T½ (71%)', days: Math.round(shift4d.halfLifeDays * 0.5) },
                          { id: '1hl', label: '1 T½ (50%)', days: Math.round(shift4d.halfLifeDays) },
                          { id: '2hl', label: '2 T½ (25%)', days: shift4d.maxHorizonDays }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            data-testid={`ge-4d-milestone-${m.id}`}
                            onClick={() => {
                              setIs4dPlaying(false);
                              setDayOffset4d(m.days);
                            }}
                            className={`px-2 py-1 rounded-lg border transition-colors tabular-nums ${
                              Math.abs(shift4d.dayOffset - m.days) <= 1
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-cyan-500/40'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                        {isAr ? 'أنبوب X-Ray بجهد ثابت (لا يضمحل زمنياً)' : 'Constant-Potential X-Ray Tube (0% calendar decay)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live 4D Parameter Shift HUD */}
                <div
                  data-testid="ge-4d-shift-hud"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono"
                >
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{isAr ? 'النشاط الإشعاعي A(t)' : 'Source Activity A(t)'}</span>
                    </span>
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <strong data-testid="ge-4d-live-activity" className="text-sm text-amber-600 dark:text-amber-400">
                        {shift4d.isGammaIsotope ? `${shift4d.liveActivityCi.toFixed(2)} Ci` : `${tubeKv} kV`}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {shift4d.decayPercentRemaining.toFixed(1)}% / {shift4d.initialActivityCi} Ci
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span>{isAr ? 'انزياح زمن التعريض' : 'Compensated Exposure'}</span>
                    </span>
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <strong data-testid="ge-4d-shifted-exposure" className="text-sm text-cyan-600 dark:text-cyan-400">
                        {shift4d.shiftedResult.formattedDuration}
                      </strong>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {shift4d.exposureTimeMultiplier.toFixed(2)}× t₀
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isAr ? 'حد الحاجز 2 mR/hr' : '2 mR/hr Boundary'}</span>
                    </span>
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <strong data-testid="ge-4d-shifted-perimeter" className="text-sm text-emerald-600 dark:text-emerald-400">
                        {shift4d.shiftedResult.controlledAreaPerimeter2mR_Meters.toFixed(1)} m
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        -{Math.max(0, shift4d.perimeterShrinkPct).toFixed(1)}% vs t₀
                      </span>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-3 space-y-1 ${
                      shift4d.isUncompensatedUnderexposed
                        ? 'border-red-500/45 bg-red-500/10'
                        : 'border-emerald-500/40 bg-emerald-500/10'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      {shift4d.isUncompensatedUnderexposed ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span>{isAr ? 'كثافة الفيلم بدون تعويض' : 'Uncompensated OD'}</span>
                    </span>
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <strong
                        data-testid="ge-4d-uncompensated-od"
                        className={`text-sm ${
                          shift4d.isUncompensatedUnderexposed
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {shift4d.uncompensatedDensityHd.toFixed(2)} H&D
                      </strong>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          shift4d.isUncompensatedUnderexposed
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {shift4d.isUncompensatedUnderexposed
                          ? isAr
                            ? 'ضعيف < 2.0'
                            : 'UNDER < 2.0'
                          : isAr
                            ? 'مقبول ≥ 2.0'
                            : 'PASS ≥ 2.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive SVG Exposure Path + Overlaid Decay Curve */}
            <div className="relative overflow-x-auto rounded-2xl bg-slate-950 border border-slate-800 p-3 sm:p-4">
              {/* Live Scrubbing / Exit Probe HUD */}
              <div
                data-testid="ge-beam-decay-probe-hud"
                className="flex flex-wrap items-center justify-between gap-2 mb-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono"
              >
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
                    {is4dViewActive ? 'I(x,t)/I₀:' : 'I(x)/I₀:'}{' '}
                    <strong className="text-emerald-400">{activePoint.intensityPct.toFixed(2)}%</strong>
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
                    {activeCurvePoints
                      .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % 6 === 0)
                      .map((pt, idx) => (
                        <stop
                          key={`${pt.normX}-${idx}`}
                          offset={`${(pt.normX * 100).toFixed(1)}%`}
                          stopColor={is4dViewActive ? '#22d3ee' : photonAccentColor}
                          stopOpacity={Math.max(0.04, Math.min(0.52, (pt.intensityPct / 100) * 0.52)).toFixed(3)}
                        />
                      ))}
                  </linearGradient>

                  {/* 4D Temporal Decay Wavefront sweeping gradient */}
                  <linearGradient id="ge4dWavefrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                    <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.82" />
                  </linearGradient>

                  {/* SFD air-gap beam cone gradient */}
                  <linearGradient id="geSfdConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop
                      offset="0%"
                      stopColor={photonAccentColor}
                      stopOpacity={((isTimerRunning ? 0.68 : 0.45) * sourceConeOpacityMultiplier).toFixed(2)}
                    />
                    <stop
                      offset="100%"
                      stopColor={photonAccentColor}
                      stopOpacity={((isTimerRunning ? 0.38 : 0.24) * sourceConeOpacityMultiplier).toFixed(2)}
                    />
                  </linearGradient>

                  {/* Under-curve exponential area fill */}
                  <linearGradient id="geDecayAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={is4dViewActive ? '#22d3ee' : photonAccentColor} stopOpacity="0.34" />
                    <stop offset="65%" stopColor="#0ea5e9" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="0.02" />
                  </linearGradient>

                  {/* Lead-Screen (Pb) Secondary Photoelectron Intensification Gradient */}
                  <linearGradient id="gePbIntensificationGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.04" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity={hasLeadScreens ? '0.42' : '0.12'} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.04" />
                  </linearGradient>

                  {/* Directional Pb → Film Photoelectron Energy Dissipation Gradients (Warm Yellow at Pb → Cool Teal at Film) */}
                  {(() => {
                    const gFilm1X = filmPlaneX + (hasLeadScreens ? 8 : 0);
                    const gFilm1TargetX = gFilm1X + 4.5;
                    const gFilm2X = filmPlaneX + (hasLeadScreens ? (hasInterleafScreen ? 24 : 19) : hasInterleafScreen ? 16 : 11);
                    const gRearFilmTargetX = calcResult.isMultiFilm ? gFilm2X + 4 : gFilm1TargetX;
                    const gBackPbInnerX = filmPlaneX + (calcResult.isMultiFilm ? (hasInterleafScreen ? 34 : 29) : 19);
                    const gInterleafX = filmPlaneX + (hasLeadScreens ? 19 : 11);
                    const stopNodes = (
                      <>
                        <stop offset="0%" stopColor="#fde047" className="rt-pb-energy-stop-origin" />
                        <stop offset="48%" stopColor="#a3e635" className="rt-pb-energy-stop-mid" />
                        <stop offset="100%" stopColor="#14b8a6" className="rt-pb-energy-stop-tip" />
                      </>
                    );
                    return (
                      <>
                        <linearGradient
                          id="gePbElectronDissipationFront"
                          gradientUnits="userSpaceOnUse"
                          x1={filmPlaneX + 6}
                          y1="0"
                          x2={gFilm1TargetX}
                          y2="0"
                        >
                          {stopNodes}
                        </linearGradient>
                        <linearGradient
                          id="gePbElectronDissipationBack"
                          gradientUnits="userSpaceOnUse"
                          x1={gBackPbInnerX}
                          y1="0"
                          x2={gRearFilmTargetX}
                          y2="0"
                        >
                          {stopNodes}
                        </linearGradient>
                        <linearGradient
                          id="gePbElectronDissipationInterleafLeft"
                          gradientUnits="userSpaceOnUse"
                          x1={gInterleafX}
                          y1="0"
                          x2={gFilm1X + 5.5}
                          y2="0"
                        >
                          {stopNodes}
                        </linearGradient>
                        <linearGradient
                          id="gePbElectronDissipationInterleafRight"
                          gradientUnits="userSpaceOnUse"
                          x1={gInterleafX + 3.5}
                          y1="0"
                          x2={gFilm2X + 3.5}
                          y2="0"
                        >
                          {stopNodes}
                        </linearGradient>
                      </>
                    );
                  })()}

                  {/* Arrowhead marker for secondary photoelectron (e⁻) intensification vectors */}
                  <marker
                    id="gePbElectronArrow"
                    viewBox="0 0 8 8"
                    refX="6"
                    refY="4"
                    markerWidth="4.2"
                    markerHeight="4.2"
                    orient="auto"
                  >
                    <path d="M 0 1 L 7 4 L 0 7 z" fill="#14b8a6" className="rt-pb-energy-arrow-tip" />
                  </marker>
                </defs>

                {/* Zone Headers */}
                <text x="95" y="18" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {sourceType.startsWith('xray') ? 'X-RAY TUBE & SFD' : 'ISOTOPE SOURCE & SFD'}
                </text>
                <text x={pathLeft + pathWidth / 2} y="18" fill="#e2e8f0" fontSize="10.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {is4dViewActive
                    ? isAr
                      ? `مسار 4D الزمني (t=+${shift4d.dayOffset}d · ${(activeDecayScale * 100).toFixed(0)}%)`
                      : `4D TEMPORAL BEAM DECAY (t=+${shift4d.dayOffset}d · ${(activeDecayScale * 100).toFixed(0)}% A₀)`
                    : isAr
                      ? 'مقطع المعدن + منحنى توهين شدة الحزمة'
                      : 'MATERIAL CROSS-SECTION + BEAM DECAY OVERLAY'}
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
                  className={curveTransitionClass}
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
                        stroke={photonAccentColor}
                        strokeWidth={idx === 1 ? '1.8' : '1.1'}
                        strokeDasharray="6 6"
                        opacity={(isTimerRunning ? 0.95 : 0.65) * Math.max(0.35, activeDecayScale)}
                        className={`rt-photon-beam-flow ${curveTransitionClass}`}
                        style={
                          {
                            '--rt-photon-stream-duration': `${streamCycleSec}s`,
                            '--rt-photon-delay': `${idx === 1 ? 0 : -(streamCycleSec * 0.45).toFixed(2)}s`
                          } as React.CSSProperties
                        }
                      />
                    );
                  })}
                </g>

                {/* Tungsten Collimator Jaws (when enabled) */}
                {hasCollimator && (
                  <g data-testid="ge-beam-collimator-jaws">
                    <rect x={collimatorX} y={plotTop - 4} width="14" height="58" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" className={curveTransitionClass} />
                    <rect x={collimatorX} y={plotBottom - 54} width="14" height="58" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" className={curveTransitionClass} />
                    <text x={collimatorX + 7} y={plotTop - 9} fill="#cbd5e1" fontSize="8.5" fontFamily="monospace" textAnchor="middle" className={curveTransitionClass}>
                      W-Coll
                    </text>
                  </g>
                )}

                {/* Focal Spot Emitter Housing */}
                <circle
                  cx={sourceCenterX}
                  cy={sourceCenterY}
                  r={isTimerRunning ? '18' : '14'}
                  fill={photonAccentColor}
                  opacity={(isTimerRunning ? 0.28 : 0.16) * Math.max(0.35, activeDecayScale)}
                  className={isTimerRunning ? `ut-beam-cone-pulse ${curveTransitionClass}` : curveTransitionClass}
                />
                <circle cx={sourceCenterX} cy={sourceCenterY} r="10" fill="#0f172a" stroke={photonAccentColor} strokeWidth="2" className={curveTransitionClass} />
                <circle cx={sourceCenterX} cy={sourceCenterY} r="3.5" fill={photonAccentColor} className={curveTransitionClass} />
                <text x={sourceCenterX} y={sourceCenterY + 26} fill={photonAccentColor} fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className={curveTransitionClass}>
                  {selectedIsotope.chemicalSymbol}
                </text>
                <text x={sourceCenterX} y={sourceCenterY + 38} fill="#94a3b8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" className={curveTransitionClass}>
                  {sourceType.startsWith('xray')
                    ? `${tubeKv}kV · ${tubeMa}mA`
                    : `${(is4dViewActive ? shift4d.liveActivityCi : calcResult.currentLiveActivityCi)}Ci`}
                </text>

                {/* SFD Dimension Span */}
                <line x1={sourceCenterX} y1="252" x2={filmPlaneX} y2="252" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" className={curveTransitionClass} />
                <line x1={sourceCenterX} y1="246" x2={sourceCenterX} y2="258" stroke="#64748b" strokeWidth="1.5" className={curveTransitionClass} />
                <line x1={filmPlaneX} y1="246" x2={filmPlaneX} y2="258" stroke="#64748b" strokeWidth="1.5" />
                <rect x="275" y="243" width="184" height="16" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="367" y="254" fill="#e2e8f0" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
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
                        className={curveTransitionClass}
                      />
                      {/* Weld-Reinforcement Profile Visualizer Overlay */}
                      {isWeld && showWeldProfileOverlay && (
                        <g
                          data-testid="ge-weld-reinforcement-profile-overlay"
                          data-weld-mm={weldReinforcementMm.toFixed(1)}
                          pointerEvents="none"
                        >
                          <path
                            d={`M ${segX} ${plotTop + 14} Q ${segX + segW + Math.min(18, Math.max(6, weldReinforcementMm * 2.4))} ${sourceCenterY} ${segX} ${plotBottom - 14}`}
                            fill="rgba(245, 158, 11, 0.24)"
                            stroke="#fbbf24"
                            strokeWidth="1.6"
                            opacity="0.88"
                          />
                          <line
                            x1={segX}
                            y1={plotTop + 14}
                            x2={segX}
                            y2={plotBottom - 14}
                            stroke="#f59e0b"
                            strokeWidth="1"
                            strokeDasharray="3 2"
                            opacity="0.7"
                          />
                          <rect
                            x={Math.max(pathLeft + 2, segX - 24)}
                            y={plotTop + 18}
                            width="46"
                            height="14"
                            rx="3"
                            fill="#0f172a"
                            fillOpacity="0.88"
                            stroke="#f59e0b"
                            strokeWidth="0.8"
                          />
                          <text
                            x={Math.max(pathLeft + 25, segX - 1)}
                            y={plotTop + 28}
                            fill="#fbbf24"
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            +{formatLen(weldReinforcementMm)}
                          </text>
                        </g>
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

                {/* 4D CSS-Animated Temporal Decay Wavefront Pulse Traveling Exposure Path */}
                {is4dViewActive && (
                  <g data-testid="ge-4d-decayed-beam-overlay" pointerEvents="none">
                    <g
                      data-testid="ge-4d-decay-wavefront"
                      className="rt-4d-decay-wavefront"
                      style={
                        {
                          '--rt-4d-wavefront-span': `${pathWidth}px`,
                          '--rt-4d-wave-duration': `${shift4d.wavefrontDurationSec}s`
                        } as React.CSSProperties
                      }
                    >
                      <rect
                        x={pathLeft - 26}
                        y={plotTop + 8}
                        width="26"
                        height={plotHeight - 16}
                        fill="url(#ge4dWavefrontGrad)"
                      />
                      <line
                        x1={pathLeft}
                        y1={plotTop + 6}
                        x2={pathLeft}
                        y2={plotBottom - 6}
                        stroke="#67e8f9"
                        strokeWidth="2"
                      />
                    </g>
                  </g>
                )}

                {/* Animated Traveling Photon Stream Across Material */}
                <line
                  data-testid="ge-beam-specimen-photon-stream"
                  x1={pathLeft}
                  y1={sourceCenterY}
                  x2={filmPlaneX}
                  y2={sourceCenterY}
                  stroke={photonAccentColor}
                  strokeWidth="1.6"
                  strokeDasharray="6 6"
                  opacity={Math.max(0.24, Math.min(0.85, displayedExitPct / 100 + 0.22))}
                  className="rt-photon-beam-flow"
                  style={
                    {
                      '--rt-photon-stream-duration': `${streamCycleSec}s`,
                      '--rt-photon-delay': '0s'
                    } as React.CSSProperties
                  }
                  pointerEvents="none"
                />

                {/* Animated Discrete Radiation Photons Traveling Source -> Material -> Detector */}
                <g data-testid="ge-beam-photon-particles" aria-hidden="true" pointerEvents="none">
                  {Array.from({ length: photonParticleCount }).map((_, idx) => {
                    const laneFactor = photonLanePattern[idx % photonLanePattern.length];
                    const targetSpreadY = hasCollimator ? 52 : 70;
                    const dy = Number((laneFactor * targetSpreadY).toFixed(1));
                    const delaySec = Number((-(idx / photonParticleCount) * photonDurationSec).toFixed(2));
                    return (
                      <g
                        key={idx}
                        data-testid={`ge-beam-photon-particle-${idx}`}
                        className="rt-photon-particle"
                        style={
                          {
                            '--rt-dx': `${photonTravelDx}px`,
                            '--rt-dy': `${dy}px`,
                            '--rt-photon-duration': `${photonDurationSec}s`,
                            '--rt-photon-delay': `${delaySec}s`,
                            '--rt-photon-exit-opacity': `${photonExitOpacity}`
                          } as React.CSSProperties
                        }
                      >
                        <circle
                          cx={sourceCenterX + 6}
                          cy={sourceCenterY}
                          r="5.5"
                          fill={photonAccentColor}
                          fillOpacity={(0.28 * Math.max(0.35, activeDecayScale)).toFixed(2)}
                        />
                        <circle
                          cx={sourceCenterX + 6}
                          cy={sourceCenterY}
                          r="2.2"
                          fill={photonCoreColor}
                          fillOpacity={(0.35 + 0.65 * activeDecayScale).toFixed(2)}
                        />
                      </g>
                    );
                  })}
                </g>

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
                        className={curveTransitionClass}
                      />
                      <text
                        x={pathLeft - 5}
                        y={yPos + 3}
                        fill={tick.pct === 50 ? '#38bdf8' : '#94a3b8'}
                        fontSize="8.5"
                        fontFamily="monospace"
                        textAnchor="end"
                        className={curveTransitionClass}
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                {/* HVL Milestone Vertical Markers */}
                {beamDecayProfile.hvlMarkers.map((marker) => {
                  const mx = normToX(marker.normX);
                  const my = intensityToY(marker.intensityPct * activeDecayScale * sfdDistanceFactor);
                  return (
                    <g key={marker.hvlIndex} data-testid={`ge-beam-hvl-marker-${marker.hvlIndex}`}>
                      <line x1={mx} y1={plotTop} x2={mx} y2={plotBottom} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" className={curveTransitionClass} />
                      <circle cx={mx} cy={my} r="3" fill="#38bdf8" stroke="#020617" strokeWidth="1.2" className={curveTransitionClass} />
                      <text x={mx} y={plotBottom - 5} fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className={curveTransitionClass}>
                        {marker.hvlIndex}HVL
                      </text>
                    </g>
                  );
                })}

                {/* Day-0 Baseline Ghost Curve (rendered when 4D Decay View is active) */}
                {is4dViewActive && (
                  <g data-testid="ge-4d-baseline-group" pointerEvents="none">
                    <path
                      data-testid="ge-4d-baseline-curve"
                      d={baselineCurveD}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.6"
                      strokeDasharray="5 4"
                      opacity="0.72"
                      className={curveTransitionClass}
                    />
                    <circle cx={normToX(0)} cy={intensityToY(100 * sfdDistanceFactor)} r="3.2" fill="#94a3b8" opacity="0.8" className={curveTransitionClass} />
                    <rect
                      x={pathLeft + 8}
                      y={plotTop + 6}
                      width="192"
                      height="20"
                      rx="4"
                      fill="#020617"
                      fillOpacity="0.82"
                      stroke="#22d3ee"
                      strokeWidth="0.9"
                    />
                    <text
                      x={pathLeft + 14}
                      y={plotTop + 19}
                      fill="#67e8f9"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      t₀ 100% → t+{shift4d.dayOffset}d {(activeDecayScale * 100).toFixed(0)}% · Exp ×{shift4d.exposureTimeMultiplier.toFixed(2)}
                    </text>
                  </g>
                )}

                {/* Overlaid Exponential Beam Intensity Decay Curve + Synchronized Photon Flux Flow (300ms Motion Interpolation) */}
                <AnimatedBeamDecayCurveGroup
                  targetPoints={targetCurveCoords}
                  plotBottom={plotBottom}
                  entryDotPos={{
                    cx: normToX(0),
                    cy: intensityToY(100 * activeDecayScale * sfdDistanceFactor)
                  }}
                  exitDotPos={{
                    cx: normToX(1),
                    cy: intensityToY(displayedExitPct)
                  }}
                  is4dViewActive={is4dViewActive}
                  is4dPlaying={is4dPlaying}
                  photonAccentColor={photonAccentColor}
                  photonCoreColor={photonCoreColor}
                  photonDurationSec={photonDurationSec}
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
                      {activePoint.intensityPct.toFixed(1)}% · {activePoint.hvlAtDepth.toFixed(2)} HVL
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

                  {/* Lead-Screen (Pb) Intensity & Photoelectron Intensification Overlay */}
                  {showLeadScreenOverlay && (
                    <g
                      data-testid="ge-lead-screen-intensity-overlay"
                      data-lead-screens-enabled={hasLeadScreens ? 'true' : 'false'}
                      pointerEvents="none"
                    >
                      <rect
                        x={filmPlaneX - 6}
                        y={plotTop + 2}
                        width={calcResult.isMultiFilm ? (hasInterleafScreen ? 52 : 47) : 37}
                        height={plotHeight - 4}
                        rx="5"
                        fill="url(#gePbIntensificationGrad)"
                        stroke={hasLeadScreens ? '#10b981' : '#64748b'}
                        strokeWidth="1"
                        strokeDasharray={hasLeadScreens ? undefined : '3 2'}
                        opacity={hasLeadScreens ? 0.92 : 0.55}
                      />
                      <AnimatePresence initial={hasInteractedWithPbPaths} mode="sync">
                        {showPbPhotoelectronPaths && (hasLeadScreens || (calcResult.isMultiFilm && hasInterleafScreen)) && (() => {
                          const film1X = filmPlaneX + (hasLeadScreens ? 8 : 0);
                          const film1TargetX = film1X + 4.5;
                          const film2X = filmPlaneX + (hasLeadScreens ? (hasInterleafScreen ? 24 : 19) : hasInterleafScreen ? 16 : 11);
                          const rearFilmTargetX = calcResult.isMultiFilm ? film2X + 4 : film1TargetX;
                          const backPbInnerX = filmPlaneX + (calcResult.isMultiFilm ? (hasInterleafScreen ? 34 : 29) : 19);
                          const interleafX = filmPlaneX + (hasLeadScreens ? 19 : 11);
                          const overlayWidth = calcResult.isMultiFilm ? (hasInterleafScreen ? 52 : 47) : 37;

                          return (
                            <motion.g
                              key="ge-pb-photoelectron-paths"
                              data-testid="ge-pb-photoelectron-paths"
                              data-animated-transition="stagger-collapse"
                              data-entrance-effect="fade-outward-scale"
                              data-ghost-trail-enabled="true"
                              data-ghost-trail-length={pbGhostTrailLength}
                              data-front-pb={hasLeadScreens ? 'true' : 'false'}
                              data-back-pb={hasLeadScreens ? 'true' : 'false'}
                              data-interleaf-pb={calcResult.isMultiFilm && hasInterleafScreen ? 'true' : 'false'}
                              pointerEvents="none"
                              style={{ transformOrigin: `${filmPlaneX + 16}px ${sourceCenterY}px` }}
                              initial={{ opacity: 0, scale: 0.92 }}
                              animate={{
                                opacity: [0, 1],
                                scale: [0.92, 1.03, 1],
                                transition: {
                                  opacity: { duration: 0.2, ease: 'easeOut' },
                                  scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 1] },
                                },
                              }}
                              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14, ease: 'easeIn' } }}
                            >
                              {hasLeadScreens && (
                                <>
                                  {/* Forward-scattered secondary photoelectron vectors from Front Pb to Film 1 plane */}
                                  {[-50, -25, 0, 25, 50].map((dyOff, idx) => {
                                    const originX = filmPlaneX + 6;
                                    const originY = sourceCenterY + dyOff;
                                    const targetY = sourceCenterY + dyOff - (dyOff === 0 ? 0 : Math.sign(dyOff) * 3);
                                    const enterDelay = idx * 0.035;
                                    return (
                                      <g key={`front-pb-vec-${idx}`}>
                                        <motion.circle
                                          data-origin-dot="front_pb"
                                          cx={filmPlaneX + 5.5}
                                          cy={originY}
                                          r="1.4"
                                          fill="#fde047"
                                          className="rt-pb-energy-origin-spark"
                                          style={{ transformOrigin: `${filmPlaneX + 5.5}px ${originY}px` }}
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{
                                            scale: [0, 1.55, 1],
                                            opacity: [0, 1, 0.95],
                                            transition: {
                                              duration: 0.26,
                                              delay: enterDelay,
                                              ease: [0.16, 1, 0.3, 1],
                                              times: [0, 0.52, 1],
                                            },
                                          }}
                                          exit={{
                                            scale: 0,
                                            opacity: 0,
                                            transition: { duration: 0.12, ease: 'easeIn' },
                                          }}
                                        />
                                        {/* Blurred residual energy ghost trails lagging behind Front Pb photoelectron */}
                                        <PbGhostTrailLines
                                          origin="front_pb"
                                          originX={originX}
                                          originY={originY}
                                          targetX={film1TargetX}
                                          targetY={targetY}
                                          enterDelay={enterDelay}
                                          gradientId="gePbElectronDissipationFront"
                                          baseResidualWidth={2.9}
                                          basePrimaryWidth={2.15}
                                          originAnchorX={0}
                                          opacityScale={1}
                                          config={pbGhostTrailConfig}
                                        />
                                        <motion.line
                                          data-vector-origin="front_pb"
                                          data-entrance-effect="fade-outward-scale"
                                          data-color-pulse="yellow-to-teal"
                                          data-stagger-delay={enterDelay.toFixed(3)}
                                          data-origin-x={originX}
                                          data-origin-y={originY}
                                          x1={originX}
                                          y1={originY}
                                          stroke="url(#gePbElectronDissipationFront)"
                                          strokeWidth="1.45"
                                          strokeDasharray="2.5 1.5"
                                          markerEnd="url(#gePbElectronArrow)"
                                          className="rt-pb-electron-vector"
                                          style={{ originX: 0, originY: 0.5 }}
                                          initial={{ x2: originX, y2: originY, scale: 0.08, opacity: 0 }}
                                          animate={{
                                            x2: film1TargetX,
                                            y2: targetY,
                                            scale: [0.08, 1.14, 1],
                                            opacity: [0, 1, 0.95],
                                            transition: {
                                              x2: { duration: 0.22, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              y2: { duration: 0.22, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              scale: { duration: 0.28, delay: enterDelay, ease: [0.16, 1, 0.3, 1], times: [0, 0.62, 1] },
                                              opacity: { duration: 0.26, delay: enterDelay, ease: 'easeOut', times: [0, 0.55, 1] },
                                            },
                                          }}
                                          exit={{
                                            x2: originX,
                                            y2: originY,
                                            scale: 0.05,
                                            opacity: 0,
                                            transition: { duration: 0.12, ease: 'easeIn' },
                                          }}
                                        />
                                      </g>
                                    );
                                  })}
                                  {/* Backscattered secondary photoelectron vectors from Back Pb to rear Film plane */}
                                  {[-50, -25, 0, 25, 50].map((dyOff, idx) => {
                                    const originX = backPbInnerX;
                                    const originY = sourceCenterY + dyOff;
                                    const targetY = sourceCenterY + dyOff - (dyOff === 0 ? 0 : Math.sign(dyOff) * 3);
                                    const enterDelay = 0.06 + idx * 0.035;
                                    return (
                                      <g key={`back-pb-vec-${idx}`}>
                                        <motion.circle
                                          data-origin-dot="back_pb"
                                          cx={backPbInnerX + 0.5}
                                          cy={originY}
                                          r="1.4"
                                          fill="#fde047"
                                          className="rt-pb-energy-origin-spark"
                                          style={{ transformOrigin: `${backPbInnerX + 0.5}px ${originY}px` }}
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{
                                            scale: [0, 1.55, 1],
                                            opacity: [0, 1, 0.92],
                                            transition: {
                                              duration: 0.26,
                                              delay: enterDelay,
                                              ease: [0.16, 1, 0.3, 1],
                                              times: [0, 0.52, 1],
                                            },
                                          }}
                                          exit={{
                                            scale: 0,
                                            opacity: 0,
                                            transition: { duration: 0.12, ease: 'easeIn' },
                                          }}
                                        />
                                        {/* Blurred residual energy ghost trails lagging behind Back Pb photoelectron */}
                                        <PbGhostTrailLines
                                          origin="back_pb"
                                          originX={originX}
                                          originY={originY}
                                          targetX={rearFilmTargetX}
                                          targetY={targetY}
                                          enterDelay={enterDelay}
                                          gradientId="gePbElectronDissipationBack"
                                          baseResidualWidth={2.9}
                                          basePrimaryWidth={2.15}
                                          originAnchorX={1}
                                          opacityScale={0.94}
                                          config={pbGhostTrailConfig}
                                        />
                                        <motion.line
                                          data-vector-origin="back_pb"
                                          data-entrance-effect="fade-outward-scale"
                                          data-color-pulse="yellow-to-teal"
                                          data-stagger-delay={enterDelay.toFixed(3)}
                                          data-origin-x={originX}
                                          data-origin-y={originY}
                                          x1={originX}
                                          y1={originY}
                                          stroke="url(#gePbElectronDissipationBack)"
                                          strokeWidth="1.45"
                                          strokeDasharray="2.5 1.5"
                                          markerEnd="url(#gePbElectronArrow)"
                                          className="rt-pb-electron-vector"
                                          style={{ originX: 1, originY: 0.5 }}
                                          initial={{ x2: originX, y2: originY, scale: 0.08, opacity: 0 }}
                                          animate={{
                                            x2: rearFilmTargetX,
                                            y2: targetY,
                                            scale: [0.08, 1.14, 1],
                                            opacity: [0, 1, 0.92],
                                            transition: {
                                              x2: { duration: 0.22, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              y2: { duration: 0.22, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              scale: { duration: 0.28, delay: enterDelay, ease: [0.16, 1, 0.3, 1], times: [0, 0.62, 1] },
                                              opacity: { duration: 0.26, delay: enterDelay, ease: 'easeOut', times: [0, 0.55, 1] },
                                            },
                                          }}
                                          exit={{
                                            x2: originX,
                                            y2: originY,
                                            scale: 0.05,
                                            opacity: 0,
                                            transition: { duration: 0.12, ease: 'easeIn' },
                                          }}
                                        />
                                      </g>
                                    );
                                  })}
                                </>
                              )}
                              {calcResult.isMultiFilm && hasInterleafScreen && (
                                <>
                                  {/* Bidirectional secondary photoelectron vectors from Interleaf 0.025mm Pb foil into Film 1 & Film 2 */}
                                  {[-34, 0, 34].map((dyOff, idx) => {
                                    const originY = sourceCenterY + dyOff;
                                    const enterDelay = 0.04 + idx * 0.04;
                                    return (
                                      <g key={`interleaf-pb-vec-${idx}`}>
                                        <motion.circle
                                          data-origin-dot="interleaf_pb"
                                          cx={interleafX + 1.75}
                                          cy={originY}
                                          r="1.25"
                                          fill="#fde047"
                                          className="rt-pb-energy-origin-spark"
                                          style={{ transformOrigin: `${interleafX + 1.75}px ${originY}px` }}
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{
                                            scale: [0, 1.5, 1],
                                            opacity: [0, 1, 0.9],
                                            transition: {
                                              duration: 0.25,
                                              delay: enterDelay,
                                              ease: [0.16, 1, 0.3, 1],
                                              times: [0, 0.52, 1],
                                            },
                                          }}
                                          exit={{
                                            scale: 0,
                                            opacity: 0,
                                            transition: { duration: 0.11, ease: 'easeIn' },
                                          }}
                                        />
                                        {/* Blurred residual energy ghost trails lagging behind bidirectional Interleaf Pb vectors */}
                                        <PbGhostTrailLines
                                          origin="interleaf_pb"
                                          originX={interleafX}
                                          originY={originY}
                                          targetX={film1X + 5.5}
                                          targetY={originY}
                                          enterDelay={enterDelay}
                                          gradientId="gePbElectronDissipationInterleafLeft"
                                          baseResidualWidth={2.5}
                                          basePrimaryWidth={1.9}
                                          originAnchorX={1}
                                          opacityScale={0.9}
                                          config={pbGhostTrailConfig}
                                        />
                                        <PbGhostTrailLines
                                          origin="interleaf_pb"
                                          originX={interleafX + 3.5}
                                          originY={originY}
                                          targetX={film2X + 3.5}
                                          targetY={originY}
                                          enterDelay={enterDelay}
                                          gradientId="gePbElectronDissipationInterleafRight"
                                          baseResidualWidth={2.5}
                                          basePrimaryWidth={1.9}
                                          originAnchorX={0}
                                          opacityScale={0.9}
                                          config={pbGhostTrailConfig}
                                        />
                                        <motion.line
                                          data-vector-origin="interleaf_pb"
                                          data-entrance-effect="fade-outward-scale"
                                          data-color-pulse="yellow-to-teal"
                                          data-stagger-delay={enterDelay.toFixed(3)}
                                          data-origin-x={interleafX}
                                          data-origin-y={originY}
                                          x1={interleafX}
                                          y1={originY}
                                          stroke="url(#gePbElectronDissipationInterleafLeft)"
                                          strokeWidth="1.3"
                                          strokeDasharray="2 1.5"
                                          markerEnd="url(#gePbElectronArrow)"
                                          className="rt-pb-electron-vector"
                                          style={{ originX: 1, originY: 0.5 }}
                                          initial={{ x2: interleafX, y2: originY, scale: 0.08, opacity: 0 }}
                                          animate={{
                                            x2: film1X + 5.5,
                                            y2: originY,
                                            scale: [0.08, 1.14, 1],
                                            opacity: [0, 1, 0.9],
                                            transition: {
                                              x2: { duration: 0.2, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              y2: { duration: 0.2, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              scale: { duration: 0.26, delay: enterDelay, ease: [0.16, 1, 0.3, 1], times: [0, 0.62, 1] },
                                              opacity: { duration: 0.24, delay: enterDelay, ease: 'easeOut', times: [0, 0.55, 1] },
                                            },
                                          }}
                                          exit={{
                                            x2: interleafX,
                                            y2: originY,
                                            scale: 0.05,
                                            opacity: 0,
                                            transition: { duration: 0.11, ease: 'easeIn' },
                                          }}
                                        />
                                        <motion.line
                                          data-vector-origin="interleaf_pb"
                                          data-entrance-effect="fade-outward-scale"
                                          data-color-pulse="yellow-to-teal"
                                          data-stagger-delay={enterDelay.toFixed(3)}
                                          data-origin-x={interleafX + 3.5}
                                          data-origin-y={originY}
                                          x1={interleafX + 3.5}
                                          y1={originY}
                                          stroke="url(#gePbElectronDissipationInterleafRight)"
                                          strokeWidth="1.3"
                                          strokeDasharray="2 1.5"
                                          markerEnd="url(#gePbElectronArrow)"
                                          className="rt-pb-electron-vector"
                                          style={{ originX: 0, originY: 0.5 }}
                                          initial={{ x2: interleafX + 3.5, y2: originY, scale: 0.08, opacity: 0 }}
                                          animate={{
                                            x2: film2X + 3.5,
                                            y2: originY,
                                            scale: [0.08, 1.14, 1],
                                            opacity: [0, 1, 0.9],
                                            transition: {
                                              x2: { duration: 0.2, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              y2: { duration: 0.2, delay: enterDelay, ease: [0.16, 1, 0.3, 1] },
                                              scale: { duration: 0.26, delay: enterDelay, ease: [0.16, 1, 0.3, 1], times: [0, 0.62, 1] },
                                              opacity: { duration: 0.24, delay: enterDelay, ease: 'easeOut', times: [0, 0.55, 1] },
                                            },
                                          }}
                                          exit={{
                                            x2: interleafX + 3.5,
                                            y2: originY,
                                            scale: 0.05,
                                            opacity: 0,
                                            transition: { duration: 0.11, ease: 'easeIn' },
                                          }}
                                        />
                                      </g>
                                    );
                                  })}
                                </>
                              )}
                              {/* Educational Photoelectron Direction & Gain Callout Pill */}
                              <motion.g
                                data-testid="ge-pb-photoelectron-legend"
                                style={{ transformOrigin: `${filmPlaneX + 16}px ${plotBottom + 9}px` }}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{
                                  opacity: [0, 1],
                                  scale: [0.85, 1.05, 1],
                                  transition: {
                                    opacity: { duration: 0.2, delay: 0.1, ease: 'easeOut' },
                                    scale: { duration: 0.26, delay: 0.1, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 1] },
                                  },
                                }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.88,
                                  transition: { duration: 0.11, ease: 'easeIn' },
                                }}
                              >
                                <rect
                                  x={filmPlaneX - 10}
                                  y={plotBottom + 2}
                                  width={Math.max(58, overlayWidth + 10)}
                                  height="14"
                                  rx="3"
                                  fill="#042f2e"
                                  stroke="#14b8a6"
                                  strokeWidth="0.8"
                                />
                                <text
                                  x={filmPlaneX - 10 + Math.max(58, overlayWidth + 10) / 2}
                                  y={plotBottom + 11.5}
                                  fill="#5eead4"
                                  fontSize="6.8"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  textAnchor="middle"
                                >
                                  {calcResult.isMultiFilm && hasInterleafScreen
                                    ? 'Pb →e⁻← Film (Dual)'
                                    : 'Pb +e⁻ → Film'}
                                </text>
                              </motion.g>
                            </motion.g>
                          );
                        })()}
                        {showPbPhotoelectronPaths && !hasLeadScreens && !(calcResult.isMultiFilm && hasInterleafScreen) && (
                          <motion.text
                            key="ge-pb-photoelectron-disabled-note"
                            data-testid="ge-pb-photoelectron-disabled-note"
                            x={filmPlaneX + 12}
                            y={plotBottom + 11}
                            fill="#94a3b8"
                            fontSize="6.5"
                            fontFamily="monospace"
                            textAnchor="middle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            style={{ transformOrigin: `${filmPlaneX + 12}px ${plotBottom + 11}px` }}
                          >
                            {isAr ? 'فعّل Pb لإطلاق e⁻' : 'Pb Off (No e⁻)'}
                          </motion.text>
                        )}
                      </AnimatePresence>
                      <rect
                        x={filmPlaneX - 8}
                        y={plotTop - 13}
                        width="56"
                        height="13"
                        rx="3"
                        fill="#0f172a"
                        stroke={hasLeadScreens ? '#10b981' : '#475569'}
                        strokeWidth="0.8"
                      />
                      <text
                        x={filmPlaneX + 20}
                        y={plotTop - 4}
                        fill={hasLeadScreens ? '#34d399' : '#94a3b8'}
                        fontSize="7.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {hasLeadScreens ? 'Pb +e⁻ Gain' : 'No Pb (1×)'}
                      </text>
                    </g>
                  )}

                  {/* Exit Readout Box */}
                  <rect x="656" y="72" width="112" height="128" rx="8" fill="#0f172a" stroke={is4dViewActive ? '#22d3ee' : '#1e293b'} strokeWidth="1.2" />
                  <text x="712" y="92" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    {is4dViewActive ? (isAr ? 'الشدة 4D للفيلم' : '4D TRANSMITTED') : isAr ? 'الشدة الواصلة للفيلم' : 'TRANSMITTED'}
                  </text>
                  <text x="712" y="114" fill={is4dViewActive ? '#22d3ee' : '#10b981'} fontSize="16" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    {displayedExitPct.toFixed(1)}%
                  </text>
                  <line x1="668" y1="124" x2="756" y2="124" stroke="#1e293b" strokeWidth="1" />
                  <text x="712" y="140" fill="#cbd5e1" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    {is4dViewActive
                      ? `Exp ${shift4d.shiftedResult.formattedDuration} (${shift4d.exposureTimeMultiplier.toFixed(2)}×)`
                      : `1 / ${calcResult.attenuationFactor}× Beam`}
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
        onChangeMeasurementDate={(nextDate) => {
          setIsRealtime4dPlaying(false);
          setMeasurementDate(nextDate);
        }}
        language={language}
        horizonHalfLives={realtime4dHorizonHalfLives}
        onChangeHorizonHalfLives={setRealtime4dHorizonHalfLives}
        isPlaybackActive={isRealtime4dPlaying}
        onTogglePlayback={() => setIsRealtime4dPlaying((prev) => !prev)}
        playbackSpeed={realtime4dSpeed}
        onChangePlaybackSpeed={setRealtime4dSpeed}
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
        <div
          id="ge-technique-card-modal"
          data-testid="ge-technique-card-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:static print:block print:bg-white print:p-0"
        >
          <div className="ge-technique-card-sheet rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] print:max-w-none print:max-h-none print:overflow-visible print:rounded-lg print:border-slate-700 print:bg-white print:text-slate-900 print:shadow-none">
            <div className="ge-technique-card-header flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500 print:text-slate-800" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white print:text-slate-900">
                  {isAr ? 'كارت تقنية التصوير الإشعاعي (ASME Sec V Technique Card)' : 'ASME Sec V Article 2 Radiographic Technique Card'}
                </h3>
              </div>
              <button
                type="button"
                aria-label={isAr ? 'إغلاق كارت التقنية' : 'Close Technique Card'}
                onClick={() => setShowTechniqueSheetModal(false)}
                className="ge-technique-card-no-print p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer print:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Technique Card Body */}
            <div className="ge-technique-card-body rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3 font-mono text-xs print:bg-slate-50 print:text-slate-900 print:border-slate-300">
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                <span>GOVERNING STANDARD:</span>
                <span className="font-bold text-amber-500 print:text-slate-900">ASME Section V Article 2 / Section VIII Div 1</span>
              </div>
              <div className="ge-technique-card-grid grid grid-cols-2 gap-2">
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
                <div className="font-bold text-emerald-500 print:text-slate-900">EXPOSURE: {calcResult.formattedDuration}</div>
              </div>
            </div>

            <div className="ge-technique-card-print-meta hidden print:flex">
              <span>INSCO Radiographic Technique Summary</span>
              <span>Ug Limit Status: {calcResult.passesAsmeUg ? 'PASS' : 'REVIEW'}</span>
            </div>

            <div className="ge-technique-card-no-print flex flex-wrap items-center justify-end gap-3 pt-2 print:hidden">
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
