import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Language } from '../../../types';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Crosshair,
  Info,
  Layers,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Target,
  TrendingDown,
  Unlock,
  XCircle,
} from 'lucide-react';

export interface RecordedDacPoint {
  holeId: 'sdh_1_4' | 'sdh_1_2' | 'sdh_3_4' | 'sdh_5_4';
  label: string;
  depthMm: number;
  soundPathMm: number;
  amplitudePct: number;
  splitBoostApplied: boolean;
}

interface DacCalibrationBuilderProps {
  language: Language;
  onSyncDacPoints?: (points: Array<{ soundPathMm: number; amplitudePct: number }>, refGainDb: number) => void;
}

type MaterialGrade = 'carbon_fine' | 'forged_alloy' | 'austenitic_coarse';
type TargetMode = 'calibration_block' | 'test_flaw';

interface AsmeBlockRule {
  rangeLabel: { ar: string; en: string };
  standardBlockThicknessMm: number;
  sdhDiameterMm: number;
  sdhImperialLabel: string;
  notchDepthRatio: number;
}

export function getAsmeTableT434Rule(specimenThicknessMm: number): AsmeBlockRule {
  if (specimenThicknessMm <= 25) {
    return {
      rangeLabel: { ar: 'حتى 25 مم (≤ 1 in.)', en: 'Up to 25 mm (≤ 1 in.)' },
      standardBlockThicknessMm: 19,
      sdhDiameterMm: 2.5,
      sdhImperialLabel: '3/32 in. (2.5 mm)',
      notchDepthRatio: 0.02,
    };
  }
  if (specimenThicknessMm <= 50) {
    return {
      rangeLabel: { ar: 'أكبر من 25 حتى 50 مم (1–2 in.)', en: 'Over 25 to 50 mm (1–2 in.)' },
      standardBlockThicknessMm: 38,
      sdhDiameterMm: 3.0,
      sdhImperialLabel: '1/8 in. (3.0 mm)',
      notchDepthRatio: 0.02,
    };
  }
  if (specimenThicknessMm <= 100) {
    return {
      rangeLabel: { ar: 'أكبر من 50 حتى 100 مم (2–4 in.)', en: 'Over 50 to 100 mm (2–4 in.)' },
      standardBlockThicknessMm: 75,
      sdhDiameterMm: 5.0,
      sdhImperialLabel: '3/16 in. (5.0 mm)',
      notchDepthRatio: 0.02,
    };
  }
  return {
    rangeLabel: { ar: 'أكبر من 100 مم (> 4 in.)', en: 'Over 100 mm (> 4 in.)' },
    standardBlockThicknessMm: specimenThicknessMm,
    sdhDiameterMm: 6.5,
    sdhImperialLabel: '1/4 in. (6.5 mm)',
    notchDepthRatio: 0.02,
  };
}

export function getAsmeAppendix12MaxLengthMm(thicknessMm: number): number {
  if (thicknessMm <= 19) return 6.0;
  if (thicknessMm <= 57) return Number((thicknessMm / 3).toFixed(1));
  return 19.0;
}

const MATERIAL_SPECS: Record<
  MaterialGrade,
  { name: { ar: string; en: string }; baseAlphaDbPerMmAt2Mhz: number; velocityShearMs: number }
> = {
  carbon_fine: {
    name: {
      ar: 'فولاذ كربوني ناعم الحبيبات (SA-516 Gr.70)',
      en: 'Fine-Grain Carbon Steel (SA-516 Gr.70)',
    },
    baseAlphaDbPerMmAt2Mhz: 0.014,
    velocityShearMs: 3240,
  },
  forged_alloy: {
    name: {
      ar: 'فولاذ سبائكي مطروق منخفض التوهين (SA-336 F22)',
      en: 'Low-Attenuation Forged Alloy (SA-336 F22)',
    },
    baseAlphaDbPerMmAt2Mhz: 0.008,
    velocityShearMs: 3260,
  },
  austenitic_coarse: {
    name: {
      ar: 'صلب أوستنيتي خشن الحبيبات عالي التشتت (SS 316L)',
      en: 'Coarse-Grain Austenitic Steel (SS 316L)',
    },
    baseAlphaDbPerMmAt2Mhz: 0.036,
    velocityShearMs: 3120,
  },
};

export const DacCalibrationBuilder: React.FC<DacCalibrationBuilderProps> = ({
  language,
  onSyncDacPoints,
}) => {
  const isAr = language === 'ar';

  // --- Specimen, Probe & ASME Block Configuration ---
  const [specimenThicknessMm, setSpecimenThicknessMm] = useState<number>(38);
  const [useExactSpecimenThicknessBlock, setUseExactSpecimenThicknessBlock] = useState<boolean>(true);
  const [probeAngleDeg, setProbeAngleDeg] = useState<45 | 60 | 70>(60);
  const [probeFreqMhz, setProbeFreqMhz] = useState<2.25 | 4.0 | 5.0>(4.0);
  const [materialGrade, setMaterialGrade] = useState<MaterialGrade>('carbon_fine');

  // --- Instrument Gain, Split-DAC & Range ---
  const [gainDb, setGainDb] = useState<number>(46.5);
  const [lockedRefGainDb, setLockedRefGainDb] = useState<number | null>(null);
  const [splitDacEnabled, setSplitDacEnabled] = useState<boolean>(false);
  const [showSubCurves, setShowSubCurves] = useState<boolean>(true); // 50% (-6dB) & 20% (-14dB)
  const [showThicknessOverlay, setShowThicknessOverlay] = useState<boolean>(false);

  // --- Probe Position & Target Mode ---
  const [targetMode, setTargetMode] = useState<TargetMode>('calibration_block');
  const [dacAttemptSavedMsg, setDacAttemptSavedMsg] = useState<string | null>(null);
  const [selectedHoleId, setSelectedHoleId] = useState<'sdh_1_4' | 'sdh_1_2' | 'sdh_3_4' | 'sdh_5_4'>('sdh_1_4');
  const [probeXmm, setProbeXmm] = useState<number>(16.5);
  const [isDraggingBlock, setIsDraggingBlock] = useState<boolean>(false);

  // --- Recorded DAC Points ---
  const [recordedPoints, setRecordedPoints] = useState<RecordedDacPoint[]>([]);
  const [activeGuideStep, setActiveGuideStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [syncedNotice, setSyncedNotice] = useState<boolean>(false);

  // --- Simulated Weld Flaw for Step 5 ASME Evaluation ---
  const [flawCategory, setFlawCategory] = useState<'Volumetric' | 'Planar'>('Volumetric');
  const [flawDepthRatio, setFlawDepthRatio] = useState<number>(0.55);
  const [flawReflectivity, setFlawReflectivity] = useState<number>(0.92); // relative to SDH
  const [flawLengthMm, setFlawLengthMm] = useState<number>(9.5);

  const blockCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aScanCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Derived ASME Sec V Table T-434.2.1 Values ---
  const asmeRule = useMemo(() => getAsmeTableT434Rule(specimenThicknessMm), [specimenThicknessMm]);
  const blockThicknessMm = useExactSpecimenThicknessBlock
    ? specimenThicknessMm
    : asmeRule.standardBlockThicknessMm;

  const angleRad = (probeAngleDeg * Math.PI) / 180;
  const sinTheta = Math.sin(angleRad);
  const cosTheta = Math.cos(angleRad);
  const tanTheta = Math.tan(angleRad);

  // Effective frequency-dependent acoustic attenuation (dB/mm one-way)
  const matSpec = MATERIAL_SPECS[materialGrade];
  const effectiveAlphaDbPerMm = useMemo(() => {
    return matSpec.baseAlphaDbPerMmAt2Mhz * Math.pow(probeFreqMhz / 2.25, 1.32);
  }, [matSpec, probeFreqMhz]);

  // Define the 4 ASME SDH Calibration Reflectors (1/4 T, 1/2 T, 3/4 T in Leg 1, plus 5/4 T V-bounce in Leg 2)
  const sdhTargets = useMemo(() => {
    const holeXCenter = blockThicknessMm * 2.25; // fixed X coordinate of holes inside block canvas
    const defs: Array<{
      id: 'sdh_1_4' | 'sdh_1_2' | 'sdh_3_4' | 'sdh_5_4';
      fractionLabel: string;
      depthMm: number;
      effectiveRayDepthMm: number;
      leg: 1 | 2;
      holeXmm: number;
      optimalProbeXmm: number;
      soundPathMm: number;
    }> = [
      {
        id: 'sdh_1_4',
        fractionLabel: '1/4 T',
        depthMm: Number((0.25 * blockThicknessMm).toFixed(1)),
        effectiveRayDepthMm: 0.25 * blockThicknessMm,
        leg: 1,
        holeXmm: holeXCenter,
        optimalProbeXmm: Number((holeXCenter - 0.25 * blockThicknessMm * tanTheta).toFixed(1)),
        soundPathMm: Number(((0.25 * blockThicknessMm) / cosTheta).toFixed(1)),
      },
      {
        id: 'sdh_1_2',
        fractionLabel: '1/2 T',
        depthMm: Number((0.5 * blockThicknessMm).toFixed(1)),
        effectiveRayDepthMm: 0.5 * blockThicknessMm,
        leg: 1,
        holeXmm: holeXCenter,
        optimalProbeXmm: Number((holeXCenter - 0.5 * blockThicknessMm * tanTheta).toFixed(1)),
        soundPathMm: Number(((0.5 * blockThicknessMm) / cosTheta).toFixed(1)),
      },
      {
        id: 'sdh_3_4',
        fractionLabel: '3/4 T',
        depthMm: Number((0.75 * blockThicknessMm).toFixed(1)),
        effectiveRayDepthMm: 0.75 * blockThicknessMm,
        leg: 1,
        holeXmm: holeXCenter,
        optimalProbeXmm: Number((holeXCenter - 0.75 * blockThicknessMm * tanTheta).toFixed(1)),
        soundPathMm: Number(((0.75 * blockThicknessMm) / cosTheta).toFixed(1)),
      },
      {
        id: 'sdh_5_4',
        fractionLabel: '5/4 T (Leg 2)',
        depthMm: Number((0.75 * blockThicknessMm).toFixed(1)),
        effectiveRayDepthMm: 1.25 * blockThicknessMm,
        leg: 2,
        holeXmm: holeXCenter,
        optimalProbeXmm: Number((holeXCenter - 1.25 * blockThicknessMm * tanTheta).toFixed(1)),
        soundPathMm: Number(((1.25 * blockThicknessMm) / cosTheta).toFixed(1)),
      },
    ];
    return defs;
  }, [blockThicknessMm, tanTheta, cosTheta]);

  // Dynamic Timebase Range (mm) covering up to 1.55 * T / cos(theta)
  const screenRangeMm = useMemo(() => {
    const maxS = (1.45 * Math.max(specimenThicknessMm, blockThicknessMm)) / cosTheta;
    return Math.max(60, Math.ceil(maxS / 25) * 25);
  }, [specimenThicknessMm, blockThicknessMm, cosTheta]);

  // Acoustic Physics Model: Echo Amplitude (% FSH) for a cylindrical SDH at sound path S (mm)
  // Accounts for:
  // 1) SDH Diameter Target Strength (+3 dB per doubling of hole diameter)
  // 2) Cylindrical Beam Divergence Loss: -10 * log10(S / S_ref0)
  // 3) Material Two-Way Absorption & Grain Scattering Loss: -2 * alpha_eff * S
  // 4) Backwall Bounce Loss (-1.2 dB on Leg 2)
  const computeSdhPeakEchoAtSoundPath = (
    soundPathMm: number,
    effectiveGainDb: number,
    sdhDiamMm: number,
    isLeg2 = false
  ): { amplitudePct: number; spreadLossDb: number; matLossDb: number; totalLossDb: number } => {
    const sSafe = Math.max(4, soundPathMm);
    const sRef0 = 12; // near-field reference normalization distance (mm)
    const spreadLossDb = 10 * Math.log10(Math.max(1, sSafe / sRef0));
    const matLossDb = 2 * effectiveAlphaDbPerMm * sSafe;
    const bounceLossDb = isLeg2 ? 1.2 : 0;
    const holeSizeGainDb = 10 * Math.log10(sdhDiamMm / 2.5);
    const totalLossDb = spreadLossDb + matLossDb + bounceLossDb;

    // At G = 42 dB and S = 12mm with 2.5mm SDH, echo = 80% FSH
    const netDb = effectiveGainDb - 42.0 + holeSizeGainDb - totalLossDb;
    const rawPct = 80 * Math.pow(10, netDb / 20);
    return {
      amplitudePct: Number(Math.min(100, Math.max(1, rawPct)).toFixed(1)),
      spreadLossDb: Number(spreadLossDb.toFixed(2)),
      matLossDb: Number(matLossDb.toFixed(2)),
      totalLossDb: Number(totalLossDb.toFixed(2)),
    };
  };

  // Keep probe aligned when switching selected hole initially or changing thickness
  const snapProbeToHole = (holeId: 'sdh_1_4' | 'sdh_1_2' | 'sdh_3_4' | 'sdh_5_4') => {
    setTargetMode('calibration_block');
    setSelectedHoleId(holeId);
    const found = sdhTargets.find((h) => h.id === holeId);
    if (found) {
      setProbeXmm(found.optimalProbeXmm);
    }
  };

  useEffect(() => {
    if (targetMode === 'calibration_block') {
      const found = sdhTargets.find((h) => h.id === selectedHoleId);
      if (found) {
        setProbeXmm(found.optimalProbeXmm);
      }
    }
  }, [blockThicknessMm, probeAngleDeg]);

  // --- Live Active Echo Calculation (Probe Position Envelope + Split DAC) ---
  const activeSignal = useMemo(() => {
    const baseGain = lockedRefGainDb !== null ? lockedRefGainDb : gainDb;

    if (targetMode === 'calibration_block') {
      const target = sdhTargets.find((h) => h.id === selectedHoleId) || sdhTargets[0];
      const deltaX = Math.abs(probeXmm - target.optimalProbeXmm);
      const beamHalfWidthMm = Math.max(3.2, 2.5 + 0.06 * target.soundPathMm);
      const alignmentFactor = Math.exp(-Math.pow(deltaX / beamHalfWidthMm, 2));

      const applySplit = splitDacEnabled && (target.id === 'sdh_3_4' || target.id === 'sdh_5_4');
      const effectiveGain = baseGain + (applySplit ? 12 : 0);

      const peakPhysics = computeSdhPeakEchoAtSoundPath(
        target.soundPathMm,
        effectiveGain,
        asmeRule.sdhDiameterMm,
        target.leg === 2
      );
      const liveAmplitudePct = Number((peakPhysics.amplitudePct * alignmentFactor).toFixed(1));

      return {
        soundPathMm: target.soundPathMm,
        depthMm: target.depthMm,
        surfaceDistMm: Number((target.soundPathMm * sinTheta).toFixed(1)),
        amplitudePct: liveAmplitudePct,
        peakPossiblePct: peakPhysics.amplitudePct,
        alignmentFactor,
        spreadLossDb: peakPhysics.spreadLossDb,
        matLossDb: peakPhysics.matLossDb,
        totalLossDb: peakPhysics.totalLossDb,
        splitApplied: applySplit,
        leg: target.leg,
      };
    } else {
      // Simulated Weld Flaw inside Specimen of thickness `specimenThicknessMm`
      const flawDepthMm = Number((flawDepthRatio * specimenThicknessMm).toFixed(1));
      const flawSoundPathMm = Number((flawDepthMm / cosTheta).toFixed(1));
      const applySplit = splitDacEnabled && flawSoundPathMm >= 0.65 * (blockThicknessMm / cosTheta);
      const effectiveGain = baseGain + (applySplit ? 12 : 0);

      const sdhEquiv = computeSdhPeakEchoAtSoundPath(
        flawSoundPathMm,
        effectiveGain,
        asmeRule.sdhDiameterMm,
        false
      );
      const liveAmp = Number(Math.min(100, sdhEquiv.amplitudePct * flawReflectivity).toFixed(1));

      return {
        soundPathMm: flawSoundPathMm,
        depthMm: flawDepthMm,
        surfaceDistMm: Number((flawSoundPathMm * sinTheta).toFixed(1)),
        amplitudePct: liveAmp,
        peakPossiblePct: liveAmp,
        alignmentFactor: 1,
        spreadLossDb: sdhEquiv.spreadLossDb,
        matLossDb: sdhEquiv.matLossDb,
        totalLossDb: sdhEquiv.totalLossDb,
        splitApplied: applySplit,
        leg: 1 as const,
      };
    }
  }, [
    lockedRefGainDb,
    gainDb,
    targetMode,
    sdhTargets,
    selectedHoleId,
    probeXmm,
    splitDacEnabled,
    asmeRule.sdhDiameterMm,
    sinTheta,
    flawDepthRatio,
    specimenThicknessMm,
    cosTheta,
    blockThicknessMm,
    flawReflectivity,
    effectiveAlphaDbPerMm,
  ]);

  // Check if 3/4 T or 5/4 T falls below 20% FSH under ASME Sec V T-464.1.3
  const deepHoleNeedsSplitDac = useMemo(() => {
    const baseGain = lockedRefGainDb !== null ? lockedRefGainDb : gainDb;
    const h34 = sdhTargets[2];
    const h54 = sdhTargets[3];
    const p34 = computeSdhPeakEchoAtSoundPath(h34.soundPathMm, baseGain, asmeRule.sdhDiameterMm, false);
    const p54 = computeSdhPeakEchoAtSoundPath(h54.soundPathMm, baseGain, asmeRule.sdhDiameterMm, true);
    return p34.amplitudePct < 20 || p54.amplitudePct < 20;
  }, [lockedRefGainDb, gainDb, sdhTargets, asmeRule.sdhDiameterMm, effectiveAlphaDbPerMm]);

  // Interpolate 100% DAC Curve value at any sound path S (mm)
  const evaluateDacAtSoundPath = (sMm: number): number | null => {
    if (recordedPoints.length === 0) return null;
    const sorted = [...recordedPoints].sort((a, b) => a.soundPathMm - b.soundPathMm);
    if (sorted.length === 1) return sorted[0].amplitudePct;

    if (sMm <= sorted[0].soundPathMm) {
      return sorted[0].amplitudePct;
    }
    if (sMm >= sorted[sorted.length - 1].soundPathMm) {
      // Exponential tail extrapolation beyond last recorded SDH
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      const ds = Math.max(1, last.soundPathMm - prev.soundPathMm);
      const decayRate = Math.log(Math.max(1, last.amplitudePct) / Math.max(1, prev.amplitudePct)) / ds;
      const extrap = last.amplitudePct * Math.exp(decayRate * (sMm - last.soundPathMm));
      return Math.max(2, Math.min(100, extrap));
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      if (sMm >= p1.soundPathMm && sMm <= p2.soundPathMm) {
        const ratio = (sMm - p1.soundPathMm) / Math.max(0.1, p2.soundPathMm - p1.soundPathMm);
        // Log-linear interpolation matches exponential ultrasonic attenuation accurately
        const logAmp =
          Math.log(Math.max(1, p1.amplitudePct)) * (1 - ratio) +
          Math.log(Math.max(1, p2.amplitudePct)) * ratio;
        return Math.min(100, Math.max(2, Math.exp(logAmp)));
      }
    }
    return sorted[0].amplitudePct;
  };

  // --- Comparative Specimen Thickness Table (Simulating Thickness Effect on Returned Signal) ---
  const thicknessComparisonRows = useMemo(() => {
    const sampleThicknesses = Array.from(new Set([15, 25, 38, 60, 95, specimenThicknessMm])).sort(
      (a, b) => a - b
    );
    const refGain = lockedRefGainDb !== null ? lockedRefGainDb : gainDb;

    return sampleThicknesses.map((thk) => {
      const rule = getAsmeTableT434Rule(thk);
      // Compare signal returned from a reflector at full root/3/4T depth (0.75 * thk)
      const depthMm = Number((0.75 * thk).toFixed(1));
      const sMm = Number((depthMm / cosTheta).toFixed(1));
      const res = computeSdhPeakEchoAtSoundPath(sMm, refGain, asmeRule.sdhDiameterMm, false);
      const maxLen = getAsmeAppendix12MaxLengthMm(thk);
      return {
        thicknessMm: thk,
        isCurrent: thk === specimenThicknessMm,
        depthMm,
        soundPathMm: sMm,
        spreadLossDb: res.spreadLossDb,
        matLossDb: res.matLossDb,
        totalLossDb: res.totalLossDb,
        amplitudePct: res.amplitudePct,
        sdhReqMm: rule.sdhDiameterMm,
        maxAllowableLenMm: maxLen,
      };
    });
  }, [specimenThicknessMm, lockedRefGainDb, gainDb, cosTheta, asmeRule.sdhDiameterMm, effectiveAlphaDbPerMm]);

  // --- ASME Sec VIII Div 1 Appendix 12 Flaw Evaluation ---
  const flawEvaluation = useMemo(() => {
    const localDacPct = evaluateDacAtSoundPath(activeSignal.soundPathMm) ?? 55;
    const pctOfDac = Number(((activeSignal.amplitudePct / Math.max(1, localDacPct)) * 100).toFixed(1));
    const dbVsDac = Number(
      (20 * Math.log10(Math.max(0.5, activeSignal.amplitudePct) / Math.max(1, localDacPct))).toFixed(1)
    );
    const maxAllowableLengthMm = getAsmeAppendix12MaxLengthMm(specimenThicknessMm);

    let disposition: 'ACCEPT_NON_RECORDABLE' | 'ACCEPT_RECORDABLE' | 'REJECT';
    let reasonAr = '';
    let reasonEn = '';
    let clause = 'ASME Sec VIII Div 1, App. 12';

    if (flawCategory === 'Planar') {
      disposition = 'REJECT';
      clause = 'ASME Sec VIII Div 1, App. 12-3(a)';
      reasonAr =
        'مرفوض قطعياً: الانقطاعات المشخّصة كعيوب مستوية (شروخ، نقص انصهار، أو نقص تغلغل) مرفوضة بغض النظر عن سعتها أو طولها.';
      reasonEn =
        'REJECTED: Imperfections interpreted as cracks, lack of fusion, or incomplete penetration are unacceptable regardless of length or amplitude.';
    } else if (pctOfDac < 20) {
      disposition = 'ACCEPT_NON_RECORDABLE';
      clause = 'ASME Sec V Art. 4 (T-492) & Sec VIII App. 12';
      reasonAr = `مقبول (دون عتبة التسجيل 20% DAC): سعة الصدى (${pctOfDac}% DAC) أقل من مستوى التسجيل الإلزامي (-14 dB).`;
      reasonEn = `ACCEPTED (Below 20% DAC Recording Level): Signal (${pctOfDac}% DAC) is below the mandatory evaluation threshold (-14 dB).`;
    } else if (pctOfDac > 100 && flawLengthMm > maxAllowableLengthMm) {
      disposition = 'REJECT';
      clause = 'ASME Sec VIII Div 1, App. 12-3(b)';
      reasonAr = `مرفوض: الإشارة تتجاوز منحنى 100% DAC (${pctOfDac}% DAC) وطول العيب (${flawLengthMm} مم) أكبر من الحد الأقصى المسموح لسماكة ${specimenThicknessMm} مم وهو (${maxAllowableLengthMm} مم).`;
      reasonEn = `REJECTED: Indication exceeds 100% DAC (${pctOfDac}% DAC) and length (${flawLengthMm} mm) exceeds the maximum allowable limit (${maxAllowableLengthMm} mm) for t = ${specimenThicknessMm} mm.`;
    } else {
      disposition = 'ACCEPT_RECORDABLE';
      clause = 'ASME Sec VIII Div 1, App. 12-3(b) & 12-4';
      reasonAr = `مقبول مع التسجيل الإلزامي في التقرير: الإشارة ≥ 20% DAC (${pctOfDac}% DAC)، العيب حجمي وطوله (${flawLengthMm} مم) ضمن الحد المسموح (≤ ${maxAllowableLengthMm} مم).`;
      reasonEn = `ACCEPTED (Recordable Indication): Volumetric reflector ≥ 20% DAC (${pctOfDac}% DAC) with length (${flawLengthMm} mm) within ASME limit (≤ ${maxAllowableLengthMm} mm).`;
    }

    return {
      localDacPct: Number(localDacPct.toFixed(1)),
      pctOfDac,
      dbVsDac,
      maxAllowableLengthMm,
      disposition,
      clause,
      reasonAr,
      reasonEn,
    };
  }, [activeSignal, recordedPoints, flawCategory, flawLengthMm, specimenThicknessMm]);

  // --- Step-by-Step Interactive Actions ---
  const handleAutoSet80PctOnFirstHole = () => {
    const h1 = sdhTargets[0];
    setTargetMode('calibration_block');
    setSelectedHoleId('sdh_1_4');
    setProbeXmm(h1.optimalProbeXmm);

    // Solve exact gainDb so 1/4 T SDH hits 80.0% FSH
    const probeTest = computeSdhPeakEchoAtSoundPath(h1.soundPathMm, 42.0, asmeRule.sdhDiameterMm, false);
    const holeSizeGainDb = 10 * Math.log10(asmeRule.sdhDiameterMm / 2.5);
    const exactGain = Number((42.0 + probeTest.totalLossDb - holeSizeGainDb).toFixed(1));
    setGainDb(exactGain);
    setLockedRefGainDb(null);
    setActiveGuideStep(2);
  };

  const handleRecordCurrentSdhPoint = () => {
    const target = sdhTargets.find((h) => h.id === selectedHoleId) || sdhTargets[0];
    // Snap probe to peak if user was slightly off so recorded DAC point reflects true peak per ASME
    setProbeXmm(target.optimalProbeXmm);
    const baseGain = lockedRefGainDb !== null ? lockedRefGainDb : gainDb;
    if (target.id === 'sdh_1_4' && lockedRefGainDb === null) {
      setLockedRefGainDb(gainDb);
    }

    const applySplit = splitDacEnabled && (target.id === 'sdh_3_4' || target.id === 'sdh_5_4');
    const peak = computeSdhPeakEchoAtSoundPath(
      target.soundPathMm,
      baseGain + (applySplit ? 12 : 0),
      asmeRule.sdhDiameterMm,
      target.leg === 2
    );

    const newPt: RecordedDacPoint = {
      holeId: target.id,
      label: target.fractionLabel,
      depthMm: target.depthMm,
      soundPathMm: target.soundPathMm,
      amplitudePct: peak.amplitudePct,
      splitBoostApplied: applySplit,
    };

    setRecordedPoints((prev) => {
      const filtered = prev.filter((p) => p.holeId !== target.id);
      return [...filtered, newPt].sort((a, b) => a.soundPathMm - b.soundPathMm);
    });

    // Advance next hole automatically for smooth step-by-step UX
    if (target.id === 'sdh_1_4') {
      setSelectedHoleId('sdh_1_2');
      setProbeXmm(sdhTargets[1].optimalProbeXmm);
      setActiveGuideStep(3);
    } else if (target.id === 'sdh_1_2') {
      setSelectedHoleId('sdh_3_4');
      setProbeXmm(sdhTargets[2].optimalProbeXmm);
      setActiveGuideStep(3);
    } else if (target.id === 'sdh_3_4') {
      setSelectedHoleId('sdh_5_4');
      setProbeXmm(sdhTargets[3].optimalProbeXmm);
      setActiveGuideStep(4);
    } else {
      setActiveGuideStep(4);
    }
  };

  const handleAutoBuildFullDac = () => {
    const h1 = sdhTargets[0];
    const probeTest = computeSdhPeakEchoAtSoundPath(h1.soundPathMm, 42.0, asmeRule.sdhDiameterMm, false);
    const holeSizeGainDb = 10 * Math.log10(asmeRule.sdhDiameterMm / 2.5);
    const exactRefGain = Number((42.0 + probeTest.totalLossDb - holeSizeGainDb).toFixed(1));

    // Check if deep hole < 20% FSH so we auto-enable Split DAC when appropriate
    const p34Check = computeSdhPeakEchoAtSoundPath(
      sdhTargets[2].soundPathMm,
      exactRefGain,
      asmeRule.sdhDiameterMm,
      false
    );
    const p54Check = computeSdhPeakEchoAtSoundPath(
      sdhTargets[3].soundPathMm,
      exactRefGain,
      asmeRule.sdhDiameterMm,
      true
    );
    const autoSplit = p34Check.amplitudePct < 20 || p54Check.amplitudePct < 20;

    setGainDb(exactRefGain);
    setLockedRefGainDb(exactRefGain);
    setSplitDacEnabled(autoSplit);

    const built: RecordedDacPoint[] = sdhTargets.map((h) => {
      const splitHere = autoSplit && (h.id === 'sdh_3_4' || h.id === 'sdh_5_4');
      const pk = computeSdhPeakEchoAtSoundPath(
        h.soundPathMm,
        exactRefGain + (splitHere ? 12 : 0),
        asmeRule.sdhDiameterMm,
        h.leg === 2
      );
      return {
        holeId: h.id,
        label: h.fractionLabel,
        depthMm: h.depthMm,
        soundPathMm: h.soundPathMm,
        amplitudePct: pk.amplitudePct,
        splitBoostApplied: splitHere,
      };
    });

    setRecordedPoints(built);
    setTargetMode('calibration_block');
    setSelectedHoleId('sdh_3_4');
    setProbeXmm(sdhTargets[2].optimalProbeXmm);
    setActiveGuideStep(4);
  };

  const handleResetBuilder = () => {
    setRecordedPoints([]);
    setLockedRefGainDb(null);
    setSplitDacEnabled(false);
    setTargetMode('calibration_block');
    setSelectedHoleId('sdh_1_4');
    setProbeXmm(sdhTargets[0].optimalProbeXmm);
    setActiveGuideStep(1);
    setSyncedNotice(false);
  };

  const handleSyncToMainConsole = () => {
    if (!onSyncDacPoints || recordedPoints.length === 0) return;
    onSyncDacPoints(
      recordedPoints.map((p) => ({ soundPathMm: p.soundPathMm, amplitudePct: p.amplitudePct })),
      lockedRefGainDb ?? gainDb
    );
    setSyncedNotice(true);
    setTimeout(() => setSyncedNotice(false), 3000);
  };

  // --- Canvas 1: ASME Basic Calibration Block & Thickness Cross-Section ---
  useEffect(() => {
    const canvas = blockCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#090d1a';
    ctx.fillRect(0, 0, w, h);

    const activeThickness = targetMode === 'calibration_block' ? blockThicknessMm : specimenThicknessMm;
    const topY = 58;
    // Scale vertical block height dynamically with thickness (min 95px, max 175px) so user visually feels thickness changes!
    const pxPerMmY = Math.min(4.8, Math.max(1.35, (92 + activeThickness * 0.72) / activeThickness));
    const blockPxH = Math.min(182, Math.max(88, activeThickness * pxPerMmY));
    const botY = topY + blockPxH;

    const maxHorizMm = activeThickness * 2.85;
    const leftPad = 36;
    const rightPad = 28;
    const blockPxW = w - leftPad - rightPad;
    const pxPerMmX = blockPxW / maxHorizMm;

    // Steel Block Body
    const steelGrad = ctx.createLinearGradient(0, topY, 0, botY);
    steelGrad.addColorStop(0, '#1e293b');
    steelGrad.addColorStop(0.5, '#0f172a');
    steelGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = steelGrad;
    ctx.fillRect(leftPad, topY, blockPxW, blockPxH);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftPad, topY, blockPxW, blockPxH);

    // Thickness Dimension Callout on Left
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(18, topY);
    ctx.lineTo(18, botY);
    ctx.moveTo(13, topY);
    ctx.lineTo(23, topY);
    ctx.moveTo(13, botY);
    ctx.lineTo(23, botY);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`T=${activeThickness}mm`, 4, topY - 8);

    // Subtle 1/4 T, 1/2 T, 3/4 T horizontal depth guidelines
    [0.25, 0.5, 0.75].forEach((frac) => {
      const gy = topY + frac * blockPxH;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.beginPath();
      ctx.moveTo(leftPad, gy);
      ctx.lineTo(leftPad + blockPxW, gy);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`${Math.round(frac * 100)}%T`, leftPad + 6, gy - 3);
    });

    if (targetMode === 'calibration_block') {
      // Draw ASME Side-Drilled Holes (1/4 T, 1/2 T, 3/4 T)
      const holeX = leftPad + sdhTargets[0].holeXmm * pxPerMmX;
      const holeRadiusPx = Math.max(4.5, asmeRule.sdhDiameterMm * 1.15);

      sdhTargets.slice(0, 3).forEach((hole) => {
        const hy = topY + (hole.depthMm / activeThickness) * blockPxH;
        const isCurrentTarget =
          selectedHoleId === hole.id || (selectedHoleId === 'sdh_5_4' && hole.id === 'sdh_3_4');
        const isRecorded = recordedPoints.some((p) => p.holeId === hole.id);

        ctx.beginPath();
        ctx.arc(holeX, hy, holeRadiusPx, 0, Math.PI * 2);
        ctx.fillStyle = isCurrentTarget ? '#082f49' : '#020617';
        ctx.fill();
        ctx.lineWidth = isCurrentTarget ? 2.2 : 1.5;
        ctx.strokeStyle = isCurrentTarget ? '#f59e0b' : isRecorded ? '#10b981' : '#94a3b8';
        ctx.stroke();

        ctx.fillStyle = isCurrentTarget ? '#fbbf24' : isRecorded ? '#34d399' : '#cbd5e1';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${hole.fractionLabel} (${hole.depthMm}mm)`, holeX + holeRadiusPx + 6, hy + 3);
      });

      // Draw Probe & Ultrasonic Beam Path
      const pX = Math.max(leftPad + 14, Math.min(leftPad + blockPxW - 24, leftPad + probeXmm * pxPerMmX));
      // Wedge housing
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(pX - 16, topY - 22, 32, 22);
      ctx.strokeStyle = '#bae6fd';
      ctx.strokeRect(pX - 16, topY - 22, 32, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${probeAngleDeg}°`, pX - 10, topY - 8);

      // Ray path inside block
      const target = sdhTargets.find((h) => h.id === selectedHoleId) || sdhTargets[0];
      ctx.save();
      ctx.lineWidth = 2.2;
      // Fade beam alpha slightly with greater totalLossDb to visually illustrate thickness attenuation
      const beamAlpha = Math.max(0.35, 1 - activeSignal.totalLossDb / 36);
      ctx.strokeStyle = `rgba(245, 158, 11, ${beamAlpha.toFixed(2)})`;

      if (target.leg === 1) {
        const endX = pX + target.depthMm * tanTheta * pxPerMmX;
        const endY = topY + (target.depthMm / activeThickness) * blockPxH;
        ctx.beginPath();
        ctx.moveTo(pX, topY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else {
        // Leg 2 bounce off bottom wall up to 3/4 T SDH (5/4 T total vertical path)
        const bounceX = pX + activeThickness * tanTheta * pxPerMmX;
        const endX = bounceX + 0.25 * activeThickness * tanTheta * pxPerMmX;
        const endY = topY + 0.75 * blockPxH;
        ctx.beginPath();
        ctx.moveTo(pX, topY);
        ctx.lineTo(bounceX, botY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Draw Simulated Weld V-Groove & Flaw inside Specimen
      const weldCenterX = leftPad + blockPxW * 0.68;
      const capHalfPx = 18;
      const rootHalfPx = 3;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
      ctx.beginPath();
      ctx.moveTo(weldCenterX - capHalfPx, topY);
      ctx.lineTo(weldCenterX + capHalfPx, topY);
      ctx.lineTo(weldCenterX + rootHalfPx, botY);
      ctx.lineTo(weldCenterX - rootHalfPx, botY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.stroke();

      const flawY = topY + flawDepthRatio * blockPxH;
      const flawX = weldCenterX;
      const probeStandX = flawX - flawDepthRatio * activeThickness * tanTheta * pxPerMmX;

      // Probe
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(probeStandX - 16, topY - 22, 32, 22);
      ctx.strokeStyle = '#bae6fd';
      ctx.strokeRect(probeStandX - 16, topY - 22, 32, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${probeAngleDeg}°`, probeStandX - 10, topY - 8);

      // Ray to Flaw
      ctx.strokeStyle = flawCategory === 'Planar' ? '#f43f5e' : '#f59e0b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(probeStandX, topY);
      ctx.lineTo(flawX, flawY);
      ctx.stroke();

      // Flaw symbol
      if (flawCategory === 'Planar') {
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(flawX - 6, flawY - 8);
        ctx.lineTo(flawX + 5, flawY + 8);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(flawX, flawY, 7, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        `Flaw D=${activeSignal.depthMm}mm | L=${flawLengthMm}mm`,
        flawX + 12,
        flawY + 4
      );
    }

    // Bottom info strip inside canvas
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `ASME Sec V T-434.2.1: Ø${asmeRule.sdhDiameterMm}mm SDH | S = ${activeSignal.soundPathMm} mm | Loss = -${activeSignal.totalLossDb} dB`,
      leftPad,
      h - 10
    );
  }, [
    blockThicknessMm,
    specimenThicknessMm,
    targetMode,
    sdhTargets,
    selectedHoleId,
    recordedPoints,
    probeXmm,
    probeAngleDeg,
    asmeRule.sdhDiameterMm,
    tanTheta,
    activeSignal,
    flawDepthRatio,
    flawCategory,
    flawLengthMm,
  ]);

  // --- Canvas 2: Live UT A-Scan & Step-by-Step Multi-Curve ASME DAC Display ---
  useEffect(() => {
    const canvas = aScanCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padL = 40;
    const padR = 16;
    const padT = 18;
    const padB = 28;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Oscilloscope Screen Background
    ctx.fillStyle = '#040a12';
    ctx.fillRect(0, 0, w, h);

    // 10x10 Graticule Grid
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const gx = padL + (i / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
      ctx.stroke();

      const gy = padT + (i / 10) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + plotW, gy);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        const pctLabel = 100 - i * 10;
        ctx.fillText(`${pctLabel}%`, 6, gy + 3);
        const sVal = Math.round((i / 10) * screenRangeMm);
        ctx.fillText(`${sVal}`, gx - 8, h - 8);
      }
    }

    // 80% FSH Reference Horizontal Guide
    const y80 = padT + 0.2 * plotH;
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.moveTo(padL, y80);
    ctx.lineTo(padL + plotW, y80);
    ctx.stroke();
    ctx.restore();

    // Optional Thickness Attenuation Comparison Curves (t = 20mm vs 50mm vs 90mm theoretical envelope)
    if (showThicknessOverlay) {
      const baseG = lockedRefGainDb !== null ? lockedRefGainDb : gainDb;
      [
        { label: 'α Low (Forged)', alpha: 0.008, color: 'rgba(56, 189, 248, 0.55)' },
        { label: 'α High (Coarse)', alpha: 0.036, color: 'rgba(244, 63, 94, 0.55)' },
      ].forEach((curve) => {
        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = curve.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 1; i <= 80; i++) {
          const s = (i / 80) * screenRangeMm;
          const spreadDb = 10 * Math.log10(Math.max(1, s / 12));
          const matDb = 2 * curve.alpha * Math.pow(probeFreqMhz / 2.25, 1.32) * s;
          const holeDb = 10 * Math.log10(asmeRule.sdhDiameterMm / 2.5);
          const pct = Math.min(100, Math.max(1, 80 * Math.pow(10, (baseG - 42 + holeDb - spreadDb - matDb) / 20)));
          const px = padL + (s / screenRangeMm) * plotW;
          const py = padT + (1 - pct / 100) * plotH;
          if (i === 1) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      });
    }

    // Draw Recorded ASME DAC Curves (100% DAC, 50% DAC [-6 dB], 20% DAC [-14 dB])
    if (recordedPoints.length > 0) {
      const drawFactorCurve = (factor: number, stroke: string, dashed: boolean, labelText: string) => {
        ctx.save();
        if (dashed) ctx.setLineDash([6, 4]);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = factor === 1 ? 2.4 : 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const s = (i / 100) * screenRangeMm;
          const baseVal = evaluateDacAtSoundPath(s) ?? 50;
          const val = Math.min(100, Math.max(1, baseVal * factor));
          const px = padL + (s / screenRangeMm) * plotW;
          const py = padT + (1 - val / 100) * plotH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();

        const endVal = Math.min(100, Math.max(2, (evaluateDacAtSoundPath(screenRangeMm * 0.92) ?? 40) * factor));
        const ly = padT + (1 - endVal / 100) * plotH;
        ctx.fillStyle = stroke;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(labelText, padL + plotW - 76, Math.max(padT + 10, ly - 4));
      };

      drawFactorCurve(1.0, '#f59e0b', false, '100% DAC');
      if (showSubCurves) {
        drawFactorCurve(0.5, '#38bdf8', true, '50% (-6dB)');
        drawFactorCurve(0.2, '#fb7185', true, '20% (-14dB)');
      }

      // Plot Individual Recorded Anchor Dots (P1..P4)
      recordedPoints.forEach((pt, idx) => {
        const px = padL + (pt.soundPathMm / screenRangeMm) * plotW;
        const py = padT + (1 - pt.amplitudePct / 100) * plotH;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#090d1a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`P${idx + 1}(${pt.label})`, px - 14, py - 9);
      });
    }

    // Draw Live Full-Wave Rectified Ultrasonic A-Scan Trace
    ctx.strokeStyle = targetMode === 'test_flaw' ? '#f43f5e' : '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const samples = 240;
    for (let i = 0; i <= samples; i++) {
      const s = (i / samples) * screenRangeMm;
      // Initial main bang near S = 0..3mm
      const mainBang = 92 * Math.exp(-Math.pow(s / 1.8, 2));
      // Target echo Gaussian envelope
      const pulseWidthMm = probeFreqMhz === 2.25 ? 2.4 : probeFreqMhz === 4.0 ? 1.6 : 1.3;
      const echoEnv =
        activeSignal.amplitudePct *
        Math.exp(-Math.pow((s - activeSignal.soundPathMm) / pulseWidthMm, 2)) *
        (0.85 + 0.15 * Math.abs(Math.cos((s - activeSignal.soundPathMm) * 4.2)));
      // Deterministic baseline electronic grass (no random RAF flicker needed)
      const grass = 1.6 + 1.1 * Math.abs(Math.sin(s * 3.7 + probeXmm));
      const yPct = Math.min(100, Math.max(mainBang, echoEnv) + grass);

      const px = padL + (s / screenRangeMm) * plotW;
      const py = padT + (1 - yPct / 100) * plotH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Measurement Gate Bar around current target sound path
    const gateStartMm = Math.max(4, activeSignal.soundPathMm - 8);
    const gateWidthMm = 16;
    const gx1 = padL + (gateStartMm / screenRangeMm) * plotW;
    const gx2 = padL + (Math.min(screenRangeMm, gateStartMm + gateWidthMm) / screenRangeMm) * plotW;
    const gateY = padT + (1 - 0.2) * plotH;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gx1, gateY);
    ctx.lineTo(gx2, gateY);
    ctx.stroke();
  }, [
    screenRangeMm,
    recordedPoints,
    showSubCurves,
    showThicknessOverlay,
    activeSignal,
    targetMode,
    probeFreqMhz,
    probeXmm,
    lockedRefGainDb,
    gainDb,
    asmeRule.sdhDiameterMm,
  ]);

  // Pointer drag handler on calibration block canvas to move probe interactively
  const updateProbeFromCanvasEvent = (clientX: number) => {
    if (targetMode !== 'calibration_block') return;
    const canvas = blockCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const canvasX = (clientX - rect.left) * scaleX;
    const leftPad = 36;
    const rightPad = 28;
    const blockPxW = canvas.width - leftPad - rightPad;
    const maxHorizMm = blockThicknessMm * 2.85;
    const newXmm = ((canvasX - leftPad) / blockPxW) * maxHorizMm;
    setProbeXmm(Number(Math.max(2, Math.min(maxHorizMm - 8, newXmm)).toFixed(1)));
  };

  const stepsMeta = [
    {
      num: 1 as const,
      title: { ar: '1. سماكة العينة وبلوك ASME', en: '1. Thickness & ASME Block' },
    },
    {
      num: 2 as const,
      title: { ar: '2. ضبط مرجع 80% عند 1/4 T', en: '2. Set 80% FSH at 1/4 T' },
    },
    {
      num: 3 as const,
      title: { ar: '3. تسجيل نقاط 1/2 T و 3/4 T', en: '3. Record 1/2 T & 3/4 T' },
    },
    {
      num: 4 as const,
      title: { ar: '4. منحنيات التقييم وتأثير السماكة', en: '4. DAC Curves & Thickness Loss' },
    },
    {
      num: 5 as const,
      title: { ar: '5. تقييم عيب اللحام وفق ASME', en: '5. ASME Flaw Evaluation' },
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-7 space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
            <span>ASME BPVC Section V Art. 4 (T-434.2.1 / T-464)</span>
            <span aria-hidden="true">·</span>
            <span>ASME Section VIII Div. 1 App. 12</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isAr
              ? 'مختبر إنشاء منحنى المعايرة DAC خطوة بخطوة وتأثير سماكة العينة'
              : 'Interactive Step-by-Step ASME DAC Curve Builder & Thickness Attenuation Lab'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            {isAr
              ? 'قم ببناء منحنى تصحيح المسافة والسعة (DAC) من ثقوب البلوك القياسي (1/4 T، 1/2 T، 3/4 T)، وراقب فيزيائياً كيف تؤدي زيادة سماكة العينة إلى توهين قوة الصدى المرتد وتغيير حدود القبول والرفض في كود ASME.'
              : 'Construct a real multi-point Distance-Amplitude Correction (DAC) curve on ASME Side-Drilled Holes, simulate how specimen thickness attenuates echo amplitude, and evaluate weld flaws per ASME standards.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAutoBuildFullDac}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Award className="w-4 h-4" />
            <span>{isAr ? 'بناء منحنى DAC القياسي تلقائياً' : 'Auto-Build 4-Point ASME DAC'}</span>
          </button>

          {onSyncDacPoints && recordedPoints.length >= 2 && (
            <button
              type="button"
              onClick={handleSyncToMainConsole}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {syncedNotice
                  ? isAr
                    ? 'تم التحديث على الجهاز الرئيسي ✓'
                    : 'Synced to Main UT Device ✓'
                  : isAr
                    ? 'نقل المنحنى للجهاز الرئيسي'
                    : 'Sync DAC to Main Console'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetBuilder}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Progressive 5-Step Guided Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {stepsMeta.map((st) => {
          const isActive = activeGuideStep === st.num;
          const isStepDone =
            (st.num === 1 && recordedPoints.length >= 0) ||
            (st.num === 2 && recordedPoints.some((p) => p.holeId === 'sdh_1_4')) ||
            (st.num === 3 && recordedPoints.length >= 3) ||
            (st.num === 4 && recordedPoints.length >= 3) ||
            (st.num === 5 && targetMode === 'test_flaw');

          return (
            <button
              key={st.num}
              type="button"
              onClick={() => {
                setActiveGuideStep(st.num);
                if (st.num === 5) setTargetMode('test_flaw');
                else setTargetMode('calibration_block');
              }}
              className={`px-3 py-2.5 rounded-xl border text-start transition cursor-pointer flex items-center justify-between gap-2 ${
                isActive
                  ? 'bg-cyan-950/60 border-cyan-400 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-semibold truncate">{st.title[language]}</span>
              {isStepDone && st.num > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">0{st.num}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Two-Zone Interactive Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / TOP STAGE (7 Columns): Dual Synchronized Canvases + Live Telemetry */}
        <div className="lg:col-span-7 space-y-5">
          {/* Canvas 1: ASME Calibration Block / Weld Specimen Thickness Cross-Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  {targetMode === 'calibration_block'
                    ? isAr
                      ? `بلوك معايرة ASME القياسي (T = ${blockThicknessMm} مم · ثقوب Ø${asmeRule.sdhDiameterMm} مم)`
                      : `ASME Basic Calibration Block (T = ${blockThicknessMm} mm · Ø${asmeRule.sdhDiameterMm} mm SDH)`
                    : isAr
                      ? `مقطع عينة اللحام الفعلي (سماكة t = ${specimenThicknessMm} مم)`
                      : `Actual Weld Specimen Cross-Section (Thickness t = ${specimenThicknessMm} mm)`}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetMode('calibration_block')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer whitespace-nowrap ${
                    targetMode === 'calibration_block'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'وضع البلوك القياسي (SDH)' : 'Calibration Block (SDH)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetMode('test_flaw');
                    setActiveGuideStep(5);
                  }}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer whitespace-nowrap ${
                    targetMode === 'test_flaw'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'اختبار عيب على المنحنى' : 'Test Weld Flaw vs DAC'}
                </button>
              </div>
            </div>

            <canvas
              ref={blockCanvasRef}
              width={640}
              height={265}
              onMouseDown={(e) => {
                setIsDraggingBlock(true);
                updateProbeFromCanvasEvent(e.clientX);
              }}
              onMouseMove={(e) => {
                if (isDraggingBlock) updateProbeFromCanvasEvent(e.clientX);
              }}
              onMouseUp={() => setIsDraggingBlock(false)}
              onMouseLeave={() => setIsDraggingBlock(false)}
              className="w-full h-auto rounded-lg border border-slate-800 cursor-ew-resize"
            />

            {/* Quick SDH Target Selector Buttons */}
            {targetMode === 'calibration_block' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sdhTargets.map((h) => {
                  const isSel = selectedHoleId === h.id;
                  const recorded = recordedPoints.find((p) => p.holeId === h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => snapProbeToHole(h.id)}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-mono transition cursor-pointer flex items-center justify-between ${
                        isSel
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                          : recorded
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{h.fractionLabel}</span>
                      <span className="tabular-nums text-[11px]">
                        {recorded ? `${recorded.amplitudePct}%` : `D=${h.depthMm}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Canvas 2: Digital UT A-Scan & Live Multi-Curve DAC Screen */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  {isAr
                    ? 'شاشة A-Scan الرقمية ومنحنيات DAC المرجعية (100% / 50% / 20%)'
                    : 'Digital A-Scan Oscilloscope & ASME DAC Curves (100% / 50% / 20%)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowSubCurves(!showSubCurves)}
                  className={`px-2.5 py-1 rounded border text-[11px] font-mono cursor-pointer whitespace-nowrap ${
                    showSubCurves
                      ? 'bg-sky-950/60 border-sky-500/50 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {isAr ? '-6dB / -14dB خطوط' : '-6dB / -14dB Curves'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowThicknessOverlay(!showThicknessOverlay)}
                  className={`px-2.5 py-1 rounded border text-[11px] font-mono cursor-pointer whitespace-nowrap ${
                    showThicknessOverlay
                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {isAr ? 'مقارنة التوهين المادي' : 'Attenuation Envelope'}
                </button>
              </div>
            </div>

            <canvas
              ref={aScanCanvasRef}
              width={640}
              height={260}
              className="w-full h-auto rounded-lg border border-slate-800"
            />

            {/* Live Acoustic Readout Strip (Tabular Numerals) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'المسار الصوتي (S)' : 'Sound Path (S)'}</div>
                <div className="text-sm font-bold text-cyan-400 tabular-nums">{activeSignal.soundPathMm} mm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'العمق الحقيقي (D)' : 'True Depth (D)'}</div>
                <div className="text-sm font-bold text-white tabular-nums">{activeSignal.depthMm} mm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'قوة الإشارة (%FSH)' : 'Echo Height'}</div>
                <div className="text-sm font-bold text-emerald-400 tabular-nums">{activeSignal.amplitudePct}% FSH</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'نسبة من منحنى DAC' : 'Amplitude vs DAC'}</div>
                <div className="text-sm font-bold text-amber-400 tabular-nums">
                  {recordedPoints.length > 0 ? `${flawEvaluation.pctOfDac}% DAC` : '—'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400">{isAr ? 'فقد التوهين الكلي' : 'Attenuation Loss'}</div>
                <div className="text-sm font-bold text-rose-400 tabular-nums">-{activeSignal.totalLossDb} dB</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / BOTTOM CONTROL & CONCEPT DECK (5 Columns) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card A: Specimen Thickness & ASME Sec V Table T-434.2.1 Selector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  {isAr ? '1. سماكة العينة ومعايير بلوك ASME' : '1. Specimen Thickness & ASME Block Specs'}
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-400 tabular-nums">t = {specimenThicknessMm} mm</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                <label htmlFor="dac-specimen-thickness">
                  {isAr ? 'سماكة عينة الفحص (Specimen Thickness t):' : 'Weld Specimen Thickness (t):'}
                </label>
                <span className="font-mono font-bold text-cyan-300 tabular-nums">{specimenThicknessMm} mm</span>
              </div>
              <input
                id="dac-specimen-thickness"
                aria-label="Weld Specimen Thickness (t)"
                type="range"
                min="10"
                max="120"
                step="1"
                value={specimenThicknessMm}
                onChange={(e) => setSpecimenThicknessMm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {[15, 25, 38, 60, 95].map((presetT) => (
                  <button
                    key={presetT}
                    type="button"
                    onClick={() => setSpecimenThicknessMm(presetT)}
                    className={`py-1 rounded border text-xs font-mono cursor-pointer tabular-nums ${
                      specimenThicknessMm === presetT
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {presetT}mm
                  </button>
                ))}
              </div>
            </div>

            {/* Live ASME Table T-434.2.1 Derived Box */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>{isAr ? 'نطاق جدول ASME T-434.2.1:' : 'ASME Table T-434.2.1 Range:'}</span>
                <span className="text-white font-semibold">{asmeRule.rangeLabel[language]}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{isAr ? 'قطر الثقب الجانبي المطلوب (SDH):' : 'Required SDH Hole Diameter:'}</span>
                <span className="text-amber-400 font-bold tabular-nums">{asmeRule.sdhImperialLabel}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{isAr ? 'أقصى طول مقبول (ASME App. 12):' : 'Max Allowable Flaw Length:'}</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {getAsmeAppendix12MaxLengthMm(specimenThicknessMm)} mm
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'سماكة بلوك المعايرة:' : 'Calibration Block T:'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setUseExactSpecimenThicknessBlock(true)}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                      useExactSpecimenThicknessBlock
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {isAr ? `مطابق للعينة (${specimenThicknessMm}mm)` : `Exact t (${specimenThicknessMm}mm)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseExactSpecimenThicknessBlock(false)}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                      !useExactSpecimenThicknessBlock
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {isAr
                      ? `قياسي (${asmeRule.standardBlockThicknessMm}mm)`
                      : `Std (${asmeRule.standardBlockThicknessMm}mm)`}
                  </button>
                </div>
              </div>
            </div>

            {/* Probe Angle, Frequency & Material Grain Attenuation */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-slate-400 mb-1">{isAr ? 'زاوية المجس (Angle):' : 'Probe Angle:'}</div>
                <div className="grid grid-cols-3 gap-1 font-mono">
                  {([45, 60, 70] as const).map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setProbeAngleDeg(ang)}
                      className={`py-1 rounded border cursor-pointer tabular-nums ${
                        probeAngleDeg === ang
                          ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {ang}°
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-slate-400 mb-1">{isAr ? 'التردد (Frequency):' : 'Frequency:'}</div>
                <div className="grid grid-cols-3 gap-1 font-mono">
                  {([2.25, 4.0, 5.0] as const).map((fq) => (
                    <button
                      key={fq}
                      type="button"
                      onClick={() => setProbeFreqMhz(fq)}
                      className={`py-1 rounded border cursor-pointer tabular-nums ${
                        probeFreqMhz === fq
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {fq}M
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="dac-material-select" className="block text-xs text-slate-400 mb-1">
                {isAr ? 'نوع المعدن ومعامل التوهين الحبيبي (α):' : 'Material Microstructure & Attenuation (α):'}
              </label>
              <select
                id="dac-material-select"
                value={materialGrade}
                onChange={(e) => setMaterialGrade(e.target.value as MaterialGrade)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white cursor-pointer"
              >
                {(Object.keys(MATERIAL_SPECS) as MaterialGrade[]).map((key) => (
                  <option key={key} value={key}>
                    {MATERIAL_SPECS[key].name[language]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card B: Step-by-Step DAC Point Capture & Split-DAC Controls */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  {isAr ? '2 & 3. الكسب المرجعي وتسجيل نقاط DAC' : '2 & 3. Reference Gain & DAC Point Capture'}
                </h4>
              </div>
              <span className="text-xs font-mono text-amber-400 tabular-nums">
                {recordedPoints.length}/4 {isAr ? 'نقاط' : 'Pts'}
              </span>
            </div>

            {/* Probe X Position Slider */}
            {targetMode === 'calibration_block' && (
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <label htmlFor="dac-probe-standoff">
                    {isAr ? 'موضع المجس على سطح البلوك (Probe X):' : 'Probe Position on Block (X):'}
                  </label>
                  <span className="font-mono text-cyan-400 tabular-nums">{probeXmm} mm</span>
                </div>
                <input
                  id="dac-probe-standoff"
                  aria-label="Probe Position on Block (X)"
                  type="range"
                  min="2"
                  max={Math.round(blockThicknessMm * 2.6)}
                  step="0.5"
                  value={probeXmm}
                  onChange={(e) => setProbeXmm(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            )}

            {/* Primary Reference Gain Controls (Locked once Point 1 is recorded per ASME T-464.1.2) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  {lockedRefGainDb !== null ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isAr ? 'الكسب المرجعي الأساسي (G_ref):' : 'Primary Reference Gain (G_ref):'}</span>
                </span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {lockedRefGainDb !== null ? lockedRefGainDb : gainDb} dB
                  {splitDacEnabled ? ' (+12 dB Split)' : ''}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                {[-2, -0.5, 0.5, 2].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    disabled={lockedRefGainDb !== null}
                    onClick={() => setGainDb((g) => Number(Math.max(10, Math.min(90, g + delta)).toFixed(1)))}
                    className={`py-1.5 rounded border tabular-nums transition ${
                      lockedRefGainDb !== null
                        ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-cyan-400 cursor-pointer'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}dB
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAutoSet80PctOnFirstHole}
                  className="py-1.5 rounded bg-cyan-600/30 border border-cyan-500/50 text-cyan-200 font-bold cursor-pointer hover:bg-cyan-600/40 whitespace-nowrap"
                >
                  80% 1/4T
                </button>
              </div>

              {lockedRefGainDb !== null && (
                <div className="flex items-center justify-between text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                  <span>
                    {isAr
                      ? 'تم تثبيت الكسب وفق ASME T-464.1.2 لتسجيل بقية الثقوب دون تغيير الحساسية.'
                      : 'Gain locked per ASME T-464.1.2 so deeper SDHs record true distance attenuation.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLockedRefGainDb(null)}
                    className="underline font-semibold ms-2 shrink-0 cursor-pointer"
                  >
                    {isAr ? 'فك القفل' : 'Unlock'}
                  </button>
                </div>
              )}
            </div>

            {/* ASME T-464.1.3 Split-DAC Warning when thick specimen attenuates echo < 20% FSH */}
            {deepHoleNeedsSplitDac && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr
                      ? 'تنبيه ASME T-464.1.3: انخفاض الإشارة دون 20% FSH بسبب سماكة العينة!'
                      : 'ASME T-464.1.3 Alert: Deep SDH Drops Below 20% FSH Due to Thickness!'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isAr
                    ? 'عندما تهبط إشارة الثقب العميق أقل من 20% من ارتفاع الشاشة نتيجة التوهين في السماكات الكبيرة، يُلزم كود ASME بإنشاء منحنى مجزأ (Split DAC) برفع الكسب للمنطقة العميقة.'
                    : 'When specimen thickness causes deeper reflectors to fall below 20% FSH, ASME requires a Split-DAC curve with boosted gain for the deeper zone.'}
                </p>
                <button
                  type="button"
                  onClick={() => setSplitDacEnabled(!splitDacEnabled)}
                  className={`w-full py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    splitDacEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {splitDacEnabled
                    ? isAr
                      ? 'تم تفعيل Split DAC (+12 dB للثقوب العميقة) ✓'
                      : 'Split DAC Active (+12 dB on Deep Zone) ✓'
                    : isAr
                      ? 'تفعيل Split DAC (+12 dB) طبقاً لـ ASME'
                      : 'Enable ASME Split DAC (+12 dB)'}
                </button>
              </div>
            )}

            {/* Primary Record Current SDH Button */}
            <button
              type="button"
              onClick={handleRecordCurrentSdhPoint}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Crosshair className="w-4 h-4" />
              <span>
                {isAr
                  ? `تسجيل نقطة DAC للثقب الحالي (${sdhTargets.find((h) => h.id === selectedHoleId)?.fractionLabel})`
                  : `Record Peak DAC Point (${sdhTargets.find((h) => h.id === selectedHoleId)?.fractionLabel})`}
              </span>
            </button>

            {/* Recorded DAC Points List */}
            {recordedPoints.length > 0 && (
              <div className="space-y-1.5 pt-1 text-xs font-mono">
                {recordedPoints.map((pt, idx) => (
                  <div
                    key={pt.holeId}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 tabular-nums"
                  >
                    <span className="text-slate-300">
                      P{idx + 1} · {pt.label} (S={pt.soundPathMm}mm)
                    </span>
                    <span className="font-bold text-amber-400">
                      {pt.amplitudePct}% FSH {pt.splitBoostApplied ? '[Split +12dB]' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card C: Step 5 — ASME Weld Flaw Evaluation vs Constructed DAC */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  {isAr ? '5. تقييم عيب اللحام طبقاً لـ ASME Sec VIII App. 12' : '5. ASME Sec VIII App. 12 Flaw Verdict'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargetMode('test_flaw');
                  setActiveGuideStep(5);
                }}
                className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                {targetMode === 'test_flaw'
                  ? isAr
                    ? 'قيد الاختبار الآن'
                    : 'Active on Screen'
                  : isAr
                    ? 'عرض على الشاشة'
                    : 'Show on A-Scan'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTargetMode('test_flaw');
                  setFlawCategory('Volumetric');
                }}
                className={`py-1.5 px-2 rounded-lg border font-semibold cursor-pointer ${
                  flawCategory === 'Volumetric'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {isAr ? 'عيب حجمي (خبث / مسامية)' : 'Volumetric (Slag / Porosity)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetMode('test_flaw');
                  setFlawCategory('Planar');
                }}
                className={`py-1.5 px-2 rounded-lg border font-semibold cursor-pointer ${
                  flawCategory === 'Planar'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {isAr ? 'عيب مستوي (شرخ / نقص انصهار)' : 'Planar (Crack / LOF)'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <label htmlFor="dac-flaw-length">
                  {isAr ? 'طول العيب المقاس (Flaw Length L):' : 'Measured Flaw Length (L):'}
                </label>
                <span className="font-mono text-white tabular-nums">
                  {flawLengthMm} mm (Max: {flawEvaluation.maxAllowableLengthMm} mm)
                </span>
              </div>
              <input
                id="dac-flaw-length"
                aria-label="Measured Flaw Length (L)"
                type="range"
                min="2"
                max="30"
                step="0.5"
                value={flawLengthMm}
                onChange={(e) => {
                  setTargetMode('test_flaw');
                  setFlawLengthMm(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="flex justify-between text-slate-300">
                <label htmlFor="dac-flaw-reflectivity">
                  {isAr ? 'شدة الانعكاس المكافئة للعيب:' : 'Flaw Reflectivity Factor:'}
                </label>
                <span className="font-mono text-white tabular-nums">{Math.round(flawReflectivity * 100)}% SDH</span>
              </div>
              <input
                id="dac-flaw-reflectivity"
                aria-label="Flaw Reflectivity Factor"
                type="range"
                min="0.15"
                max="1.45"
                step="0.05"
                value={flawReflectivity}
                onChange={(e) => {
                  setTargetMode('test_flaw');
                  setFlawReflectivity(Number(e.target.value));
                }}
                className="w-full accent-rose-500 cursor-pointer"
              />

              <div className="flex justify-between text-slate-300">
                <label htmlFor="dac-flaw-depth">
                  {isAr ? 'نسبة عمق العيب داخل السماكة:' : 'Flaw Depth Ratio (D/t):'}
                </label>
                <span className="font-mono text-cyan-300 tabular-nums">
                  {Math.round(flawDepthRatio * 100)}% t ({(flawDepthRatio * specimenThicknessMm).toFixed(1)} mm)
                </span>
              </div>
              <input
                id="dac-flaw-depth"
                aria-label="Flaw Depth Ratio"
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={flawDepthRatio}
                onChange={(e) => {
                  setTargetMode('test_flaw');
                  setFlawDepthRatio(Number(e.target.value));
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Dual-Coded Semantic ASME Verdict Banner */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                flawEvaluation.disposition === 'REJECT'
                  ? 'bg-rose-950/35 border-rose-500/50 text-rose-200'
                  : flawEvaluation.disposition === 'ACCEPT_RECORDABLE'
                    ? 'bg-amber-950/35 border-amber-500/50 text-amber-100'
                    : 'bg-emerald-950/35 border-emerald-500/50 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  {flawEvaluation.disposition === 'REJECT' ? (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>
                    {flawEvaluation.disposition === 'REJECT'
                      ? isAr
                        ? 'الحكم الهندسي: مرفوض (REJECTED)'
                        : 'ASME VERDICT: REJECTED'
                      : flawEvaluation.disposition === 'ACCEPT_RECORDABLE'
                        ? isAr
                          ? 'الحكم الهندسي: مقبول مع التسجيل (ACCEPT - RECORD)'
                          : 'ASME VERDICT: ACCEPTABLE (RECORDABLE)'
                        : isAr
                          ? 'الحكم الهندسي: مقبول دون تسجيل (ACCEPT < 20% DAC)'
                          : 'ASME VERDICT: ACCEPTABLE (< 20% DAC)'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold tabular-nums">
                  {flawEvaluation.pctOfDac}% DAC ({flawEvaluation.dbVsDac > 0 ? `+${flawEvaluation.dbVsDac}` : flawEvaluation.dbVsDac} dB)
                </span>
              </div>
              <div className="text-[11px] font-mono opacity-85">{flawEvaluation.clause}</div>
              <p className="text-xs leading-relaxed">
                {isAr ? flawEvaluation.reasonAr : flawEvaluation.reasonEn}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const isRejected = flawEvaluation.disposition === 'REJECT';
                    const dacAccuracyPct =
                      recordedPoints.length >= 4
                        ? 100
                        : recordedPoints.length >= 3
                        ? 95
                        : 76;
                    const rec = recordSimulationAttempt({
                      simulatorId: 'dac_builder',
                      targetSubTab: 'dac_builder',
                      simulatorTitle: {
                        ar: 'مختبر منحنى المعايرة DAC (ASME Sec V / App. 12)',
                        en: 'ASME DAC Curve Builder & Flaw Evaluator',
                      },
                      ndtMethod: 'DAC',
                      defectTypes: [
                        flawCategory === 'Planar'
                          ? {
                              id: 'planar_crack_lof',
                              ar: 'عيب مستوٍ (شرخ / نقص انصهار)',
                              en: 'Planar Flaw (Crack / LOF)',
                            }
                          : {
                              id: 'volumetric_slag_porosity',
                              ar: 'عيب حجمي (خبث / مسامية)',
                              en: 'Volumetric Flaw (Slag / Porosity)',
                            },
                      ],
                      status: isRejected ? 'FAIL' : 'PASS',
                      codeVerdict: isRejected ? 'REJECT' : 'ACCEPT',
                      codeStandard: flawEvaluation.clause,
                      scorePct: dacAccuracyPct,
                      measuredDepthMm: Number((flawDepthRatio * specimenThicknessMm).toFixed(1)),
                      measuredLengthMm: flawLengthMm,
                      notes: {
                        ar: `${flawEvaluation.pctOfDac}% DAC · سمك العينة ${specimenThicknessMm} مم`,
                        en: `${flawEvaluation.pctOfDac}% DAC · Specimen t=${specimenThicknessMm} mm`,
                      },
                    });
                    setDacAttemptSavedMsg(
                      isAr
                        ? `تم الحفظ في سجل المحاكاة (${rec.status} · +${rec.xpEarned} XP)`
                        : `Saved to Simulation History (${rec.status} · +${rec.xpEarned} XP)`
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>
                    {isAr ? 'تسجيل محاولة تقييم DAC في السجل' : 'Record DAC Simulation Attempt'}
                  </span>
                </button>
                {dacAttemptSavedMsg && (
                  <span className="text-[11px] font-mono text-emerald-300 font-semibold">
                    {dacAttemptSavedMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Section: Specimen Thickness Effect on Echo Amplitude & ASME Limits Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm sm:text-base font-bold text-white">
              {isAr
                ? 'جدول محاكاة تأثير سماكة العينة على قوة الإشارة المرتدة ومعايير ASME (عند ثقب 3/4 T)'
                : 'Specimen Thickness Effect on Returned Echo Amplitude & ASME Acceptance Matrix (at 3/4 T)'}
            </h4>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              ΔdB = 10·log₁₀(S/S₀) + 2·α·S · α = {effectiveAlphaDbPerMm.toFixed(3)} dB/mm
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 text-start">{isAr ? 'سماكة العينة (t)' : 'Thickness (t)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'المسار الصوتي (S)' : 'Sound Path (S)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'تمدد الشعاع (Spread)' : 'Beam Spread'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'توهين المعدن (2αS)' : 'Material Loss'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'إجمالي الفقد' : 'Total Loss'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'قوة الإشارة المرتدة' : 'Returned Echo'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'ثقب ASME المطلوب' : 'ASME SDH Ø'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'أقصى طول عيب مسموح' : 'Max Flaw L_max'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {thicknessComparisonRows.map((row) => (
                <tr
                  key={row.thicknessMm}
                  onClick={() => setSpecimenThicknessMm(row.thicknessMm)}
                  className={`transition cursor-pointer ${
                    row.isCurrent
                      ? 'bg-cyan-950/40 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-900/80'
                  }`}
                >
                  <td className="py-2.5 px-3 text-cyan-300">
                    {row.thicknessMm} mm {row.isCurrent ? (isAr ? '(الحالية)' : '(Active)') : ''}
                  </td>
                  <td className="py-2.5 px-3">{row.soundPathMm} mm</td>
                  <td className="py-2.5 px-3 text-slate-400">-{row.spreadLossDb} dB</td>
                  <td className="py-2.5 px-3 text-rose-300">-{row.matLossDb} dB</td>
                  <td className="py-2.5 px-3 text-rose-400">-{row.totalLossDb} dB</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={
                        row.amplitudePct < 20
                          ? 'text-rose-400'
                          : row.amplitudePct < 50
                            ? 'text-amber-300'
                            : 'text-emerald-400'
                      }
                    >
                      {row.amplitudePct}% FSH {row.amplitudePct < 20 ? '(Split DAC)' : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-amber-300">Ø {row.sdhReqMm} mm</td>
                  <td className="py-2.5 px-3 text-emerald-300">{row.maxAllowableLenMm} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
