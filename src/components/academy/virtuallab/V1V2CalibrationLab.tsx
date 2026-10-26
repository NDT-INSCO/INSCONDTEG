import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Crosshair,
  Eye,
  FileCheck,
  Info,
  Layers,
  Play,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
} from 'lucide-react';
import { Language } from '../../../types';
import {
  BlockReflectorSpec,
  CALIBRATION_CODES,
  CALIBRATION_WORKFLOW_STEPS,
  CalibrationBlockId,
  CalibrationCodeId,
  V1_BLOCK_METADATA,
  V1_BLOCK_REFLECTORS,
  V2_BLOCK_METADATA,
  V2_BLOCK_REFLECTORS,
  V2BlockThicknessMm,
  computeCalibrationPhysics,
  formatBilingual,
} from '../../../data/v1v2CalibrationData';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import {
  playCalibrationClick,
  playCalibrationSuccessPing,
  playProbeScanTick,
} from '../../../utils/ndtAudioFeedback';
import { NdtAudioControlChip } from './NdtAudioControlChip';
import { V1V2ThreeScene } from './V1V2ThreeScene';

export interface V1V2CalibrationLabProps {
  language: Language;
  /** Optional callback to sync calibrated parameters back to ComprehensiveWeldUtSimulator and jump to live weld scan */
  onCompleteAndProceedToWeld?: (calibratedParams: {
    velocityMs: number;
    zeroDelayUs: number;
    probeAngleDeg: 45 | 60 | 70;
    gainDb: number;
    rangeMm: number;
    scanningGainActive: boolean;
  }) => void;
}

export const V1V2CalibrationLab: React.FC<V1V2CalibrationLabProps> = ({
  language,
  onCompleteAndProceedToWeld,
}) => {
  const isAr = language === 'ar';

  // --- Governing Code & Active Step (1..7) ---
  const [selectedCodeId, setSelectedCodeId] = useState<CalibrationCodeId>('iso_17640');
  const [activeStepNum, setActiveStepNum] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [verifiedSteps, setVerifiedSteps] = useState<number[]>([]);

  // --- Active Block & Block-Specific Options ---
  const [targetBlock, setTargetBlock] = useState<CalibrationBlockId>('v1_iso2400');
  const [v2ThicknessMm, setV2ThicknessMm] = useState<V2BlockThicknessMm>(12.5);
  const [v2SdhDiameterMm, setV2SdhDiameterMm] = useState<5.0 | 1.5>(5.0);
  const [sensitivityReflectorMode, setSensitivityReflectorMode] = useState<'sdh' | 'edm_notch'>('sdh');
  const [viewportMode, setViewportMode] = useState<'split_3d_2d' | '3d_only' | '2d_only'>('split_3d_2d');
  const [v1ZeroSpot, setV1ZeroSpot] = useState<'thk_25' | 'height_100' | 'perspex_50' | 'res_steps'>('thk_25');
  const [selectedReflectorId, setSelectedReflectorId] = useState<string>('v1_r100_quadrant');
  const [showDimensionsSchedule, setShowDimensionsSchedule] = useState<boolean>(true);

  // --- Probe & Ultrasonic Instrument Controls (Initialized slightly uncalibrated so Stage 1 adjustment is tangible) ---
  const [probeMode, setProbeMode] = useState<'zero_deg' | 'angle_shear'>('zero_deg');
  const [nominalAngleDeg, setNominalAngleDeg] = useState<45 | 60 | 70>(60);
  const [probeActualAngleSkewDeg] = useState<number>(0.6); // Realistic +0.6° wedge angle (e.g. 60.6° within ±2° code limit)
  const [probePositionXmm, setProbePositionXmm] = useState<number>(140);
  const [beamDirection, setBeamDirection] = useState<'right' | 'left'>('right');

  const [instrumentVelocityMs, setInstrumentVelocityMs] = useState<number>(5740);
  const [instrumentZeroDelayUs, setInstrumentZeroDelayUs] = useState<number>(1.35);
  const [screenRangeMm, setScreenRangeMm] = useState<number>(100);
  const [gainDb, setGainDb] = useState<number>(48.0);
  const [transferCorrectionDb, setTransferCorrectionDb] = useState<number>(0);
  const [scanningGainActive, setScanningGainActive] = useState<boolean>(false);
  const [dampingOhms, setDampingOhms] = useState<50 | 500>(500);
  const [gateAStartMm, setGateAStartMm] = useState<number>(18);
  const [gateAWidthMm, setGateAWidthMm] = useState<number>(85);
  const [gateAThresholdPct, setGateAThresholdPct] = useState<number>(40);

  // --- Calibration Milestones & Stage 7 Weld Start-Check Sub-Checklist ---
  const [bipMarkedOnWedge, setBipMarkedOnWedge] = useState<boolean>(false);
  const [refLevelLocked80Pct, setRefLevelLocked80Pct] = useState<boolean>(false);
  const [weldThicknessMm, setWeldThicknessMm] = useState<number>(25);
  const [startCheckItems, setStartCheckItems] = useState<{
    parentMetal0Deg: boolean;
    couplantAndSurface: boolean;
    halfSkipRoot: boolean;
    fullSkipCap: boolean;
  }>({
    parentMetal0Deg: false,
    couplantAndSurface: false,
    halfSkipRoot: false,
    fullSkipCap: false,
  });
  const [equipmentDriftChecked, setEquipmentDriftChecked] = useState<boolean>(false);
  const [signedOffCertificate, setSignedOffCertificate] = useState<{
    certId: string;
    xpEarned: number;
    accuracyPct: number;
    timestamp: string;
  } | null>(null);

  const codeRule = CALIBRATION_CODES[selectedCodeId];
  const currentStep =
    CALIBRATION_WORKFLOW_STEPS.find((s) => s.stepNumber === activeStepNum) ??
    CALIBRATION_WORKFLOW_STEPS[0];

  // --- Real-Time Acoustic Physics Engine ---
  const physics = useMemo(
    () =>
      computeCalibrationPhysics({
        targetBlock,
        v2ThicknessMm,
        probeMode,
        nominalAngleDeg,
        probeActualAngleSkewDeg,
        probePositionXmm,
        beamDirection,
        instrumentVelocityMs,
        instrumentZeroDelayUs,
        screenRangeMm,
        gainDb,
        transferCorrectionDb,
        scanningGainActive,
        dampingOhms,
        weldThicknessMm,
        v1ZeroSpot,
        v2SdhDiameterMm,
        sensitivityReflectorMode,
      }),
    [
      targetBlock,
      v2ThicknessMm,
      probeMode,
      nominalAngleDeg,
      probeActualAngleSkewDeg,
      probePositionXmm,
      beamDirection,
      instrumentVelocityMs,
      instrumentZeroDelayUs,
      screenRangeMm,
      gainDb,
      transferCorrectionDb,
      scanningGainActive,
      dampingOhms,
      weldThicknessMm,
      v1ZeroSpot,
      v2SdhDiameterMm,
      sensitivityReflectorMode,
    ]
  );

  // --- Live Verification Logic for Each of the 7 Stages ---
  const stepLiveStatus = useMemo(() => {
    // Stage 1: 0° Range, Velocity (5920±35) & Zero (0.60±0.15), echoes within ±codeRule.rangeLinearityToleranceMm
    const s1Echo1 = physics.echoes[0];
    const s1EchoLast = physics.echoes[Math.min(3, physics.echoes.length - 1)];
    const s1Err1 = s1Echo1 ? Math.abs(s1Echo1.displayedSoundPathMm - s1Echo1.trueSoundPathMm) : 99;
    const s1ErrLast = s1EchoLast
      ? Math.abs(s1EchoLast.displayedSoundPathMm - s1EchoLast.trueSoundPathMm)
      : 99;
    const stage1Ready =
      probeMode === 'zero_deg' &&
      (targetBlock === 'v1_iso2400' || targetBlock === 'v2_iso7963') &&
      Math.abs(instrumentVelocityMs - 5920) <= 35 &&
      Math.abs(instrumentZeroDelayUs - 0.6) <= 0.15 &&
      s1Err1 <= codeRule.rangeLinearityToleranceMm &&
      s1ErrLast <= codeRule.rangeLinearityToleranceMm;

    // Stage 2: 0° Axial Resolution on V1 85/91/100 mm steps with 50 Ω damping
    const has3ResPeaks =
      physics.echoes.some((e) => e.id === 'v1_res_85' && e.amplitudeFshPct >= 45) &&
      physics.echoes.some((e) => e.id === 'v1_res_91' && e.amplitudeFshPct >= 45) &&
      physics.echoes.some((e) => e.id === 'v1_res_100' && e.amplitudeFshPct >= 45);
    const stage2Ready =
      targetBlock === 'v1_iso2400' &&
      probeMode === 'zero_deg' &&
      v1ZeroSpot === 'res_steps' &&
      dampingOhms === 50 &&
      has3ResPeaks;

    // Stage 3: Shear Beam Index Point (BIP) on V1 R100 or V2 R25/R50 within ±indexToleranceMm
    const onArcTarget =
      probeMode === 'angle_shear' &&
      ((targetBlock === 'v1_iso2400' && beamDirection === 'right') || targetBlock === 'v2_iso7963');
    const idxErr = physics.indexErrorFromArcCenterMm !== null ? Math.abs(physics.indexErrorFromArcCenterMm) : 99;
    const stage3Ready = onArcTarget && idxErr <= codeRule.indexToleranceMm && bipMarkedOnWedge;

    // Stage 4: Shear Velocity (3255±25 m/s) & Wedge Delay (2.35±0.15 µs) with dual arc echoes aligned
    const arcEchoes = physics.echoes.filter(
      (e) => e.id.startsWith('v1_r100_') || e.id.startsWith('v2_r25_') || e.id.startsWith('v2_r50_')
    );
    const maxArcErr =
      arcEchoes.length >= 2
        ? Math.max(
            Math.abs(arcEchoes[0].displayedSoundPathMm - arcEchoes[0].trueSoundPathMm),
            Math.abs(arcEchoes[1].displayedSoundPathMm - arcEchoes[1].trueSoundPathMm)
          )
        : 99;
    const stage4Ready =
      probeMode === 'angle_shear' &&
      Math.abs(instrumentVelocityMs - 3255) <= 25 &&
      Math.abs(instrumentZeroDelayUs - 2.35) <= 0.15 &&
      maxArcErr <= codeRule.rangeLinearityToleranceMm;

    // Stage 5: Refracted Angle β check on V1 Ø1.5mm SDH or V2 Ø5.0mm SDH within ±2.0°
    const sdhEcho = physics.echoes.find((e) => e.id === 'v1_sdh_1_5' || e.id.startsWith('v2_sdh_5mm'));
    const stage5Ready =
      probeMode === 'angle_shear' &&
      Boolean(sdhEcho && sdhEcho.amplitudeFshPct >= 65) &&
      physics.measuredAngleOnScaleDeg !== null &&
      Math.abs(physics.measuredAngleOnScaleDeg - nominalAngleDeg) <= codeRule.angleToleranceDeg;

    // Stage 6: Reference Sensitivity 80% FSH locked + Transfer Loss (+2 dB) + Scanning Gain (+6 dB)
    const stage6Ready =
      refLevelLocked80Pct && transferCorrectionDb >= 2 && scanningGainActive;

    // Stage 7: All 4 Weld Start-Check physical verifications completed
    const stage7Ready =
      startCheckItems.parentMetal0Deg &&
      startCheckItems.couplantAndSurface &&
      startCheckItems.halfSkipRoot &&
      startCheckItems.fullSkipCap;

    return {
      1: stage1Ready,
      2: stage2Ready,
      3: stage3Ready,
      4: stage4Ready,
      5: stage5Ready,
      6: stage6Ready,
      7: stage7Ready,
    } as Record<1 | 2 | 3 | 4 | 5 | 6 | 7, boolean>;
  }, [
    physics,
    probeMode,
    targetBlock,
    instrumentVelocityMs,
    instrumentZeroDelayUs,
    codeRule,
    v1ZeroSpot,
    dampingOhms,
    beamDirection,
    bipMarkedOnWedge,
    nominalAngleDeg,
    refLevelLocked80Pct,
    transferCorrectionDb,
    scanningGainActive,
    startCheckItems,
  ]);

  const markStepVerified = (stepNum: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setVerifiedSteps((prev) => (prev.includes(stepNum) ? prev : [...prev, stepNum].sort((a, b) => a - b)));
  };

  // --- Smart Step Positioner / Guided Setup Helper (for smooth step-by-step practice) ---
  const applyStepGuidedSetup = (stepNum: 1 | 2 | 3 | 4 | 5 | 6 | 7, autoCalibrateValues: boolean) => {
    setActiveStepNum(stepNum);
    if (autoCalibrateValues) {
      playCalibrationSuccessPing();
    } else {
      playCalibrationClick();
    }
    const trueSkewRad = ((nominalAngleDeg + probeActualAngleSkewDeg) * Math.PI) / 180;

    if (stepNum === 1) {
      setTargetBlock('v1_iso2400');
      setProbeMode('zero_deg');
      setV1ZeroSpot('thk_25');
      setScreenRangeMm(100);
      setGateAStartMm(18);
      setGateAWidthMm(85);
      if (autoCalibrateValues) {
        setInstrumentVelocityMs(5920);
        setInstrumentZeroDelayUs(0.6);
        setGainDb(48.0);
        markStepVerified(1);
      }
    } else if (stepNum === 2) {
      setTargetBlock('v1_iso2400');
      setProbeMode('zero_deg');
      setV1ZeroSpot('res_steps');
      setProbePositionXmm(196);
      setScreenRangeMm(125);
      setGateAStartMm(80);
      setGateAWidthMm(25);
      if (autoCalibrateValues) {
        setInstrumentVelocityMs(5920);
        setInstrumentZeroDelayUs(0.6);
        setDampingOhms(50);
        setGainDb(48.5);
        markStepVerified(2);
      }
    } else if (stepNum === 3) {
      const useV2 = targetBlock === 'v2_iso7963';
      if (!useV2) setTargetBlock('v1_iso2400');
      setProbeMode('angle_shear');
      setBeamDirection(useV2 ? 'left' : 'right');
      setScreenRangeMm(useV2 ? 125 : 200);
      setGateAStartMm(useV2 ? 15 : 85);
      setGateAWidthMm(useV2 ? 95 : 120);
      if (autoCalibrateValues) {
        setProbePositionXmm(useV2 ? 25 : 200);
        setBipMarkedOnWedge(true);
        markStepVerified(3);
      } else {
        setProbePositionXmm(useV2 ? 29 : 194);
      }
    } else if (stepNum === 4) {
      const useV2 = targetBlock === 'v2_iso7963';
      if (!useV2) setTargetBlock('v1_iso2400');
      setProbeMode('angle_shear');
      setBeamDirection(useV2 ? 'left' : 'right');
      setProbePositionXmm(useV2 ? 25 : 200);
      setBipMarkedOnWedge(true);
      setScreenRangeMm(useV2 ? 125 : 220);
      setGateAStartMm(useV2 ? 18 : 90);
      setGateAWidthMm(useV2 ? 95 : 120);
      if (autoCalibrateValues) {
        setInstrumentVelocityMs(3255);
        setInstrumentZeroDelayUs(2.35);
        markStepVerified(4);
      }
    } else if (stepNum === 5) {
      const useV2 = targetBlock === 'v2_iso7963';
      if (!useV2) setTargetBlock('v1_iso2400');
      setProbeMode('angle_shear');
      setBeamDirection('left');
      setInstrumentVelocityMs(3255);
      setInstrumentZeroDelayUs(2.35);
      setScreenRangeMm(100);
      setGateAStartMm(12);
      setGateAWidthMm(50);
      const exactPeakX = useV2
        ? Number((45 + 15 * Math.tan(trueSkewRad)).toFixed(1))
        : Number((35 + 15 * Math.tan(trueSkewRad)).toFixed(1));
      setProbePositionXmm(autoCalibrateValues ? exactPeakX : Number((exactPeakX - 3.5).toFixed(1)));
      if (autoCalibrateValues) {
        markStepVerified(5);
      }
    } else if (stepNum === 6) {
      const useV2 = targetBlock === 'v2_iso7963';
      if (!useV2) setTargetBlock('v1_iso2400');
      setProbeMode('angle_shear');
      setBeamDirection('left');
      setInstrumentVelocityMs(3255);
      setInstrumentZeroDelayUs(2.35);
      setScreenRangeMm(100);
      const exactPeakX = useV2
        ? Number((45 + 15 * Math.tan(trueSkewRad)).toFixed(1))
        : Number((35 + 15 * Math.tan(trueSkewRad)).toFixed(1));
      setProbePositionXmm(exactPeakX);
      if (autoCalibrateValues) {
        setGainDb(48.0);
        setRefLevelLocked80Pct(true);
        setTransferCorrectionDb(2.0);
        setScanningGainActive(true);
        markStepVerified(6);
      }
    } else if (stepNum === 7) {
      setTargetBlock('weld_start_check');
      setInstrumentVelocityMs(3255);
      setInstrumentZeroDelayUs(2.35);
      setScreenRangeMm(125);
      setProbeMode('angle_shear');
      setBeamDirection('left');
      const halfSkipX = Number((weldThicknessMm * Math.tan(trueSkewRad)).toFixed(1));
      setProbePositionXmm(halfSkipX);
      setGateAStartMm(20);
      setGateAWidthMm(90);
      if (autoCalibrateValues) {
        setTransferCorrectionDb(2.0);
        setScanningGainActive(true);
        setRefLevelLocked80Pct(true);
        setEquipmentDriftChecked(true);
        setStartCheckItems({
          parentMetal0Deg: true,
          couplantAndSurface: true,
          halfSkipRoot: true,
          fullSkipCap: true,
        });
        markStepVerified(7);
      }
    }
  };

  // --- Full 7-Step Complete Sign-Off & XP Logging ---
  const handleSignOffCalibrationAndLogXp = () => {
    const completedCount = [1, 2, 3, 4, 5, 6, 7].filter(
      (n) => verifiedSteps.includes(n) || stepLiveStatus[n as 1 | 2 | 3 | 4 | 5 | 6 | 7]
    ).length;
    const scorePct = Math.round((completedCount / 7) * 100);
    const isPass = completedCount >= 5;

    playCalibrationSuccessPing();
    const record = recordSimulationAttempt({
      simulatorId: 'v1_v2_code_calibration_lab',
      targetSubTab: 'v1_v2_calibration',
      simulatorTitle: {
        ar: 'معمل كالبريشن بلوكات V1 & V2 واستارت تشيك اللحام وفق الأكواد',
        en: 'V1 & V2 Calibration Blocks & Weld Start-Check Simulator',
      },
      ndtMethod: 'UT',
      defectTypes: [
        {
          id: 'v1_sdh_1_5mm',
          ar: 'ثقب V1 القياسي Ø1.5 مم + قوس R100 وتدرجات 85/91/100',
          en: 'V1 Ø1.5mm SDH + R100 Quadrant & 85/91/100 Resolution Steps',
        },
        {
          id: 'v2_sdh_5mm',
          ar: 'بلوك V2 الميداني R25/R50 + ثقب Ø5.0 مم + استارت تشيك اللحام',
          en: 'V2 R25/R50 Field Block + Ø5.0mm SDH + Weld Start-Check',
        },
      ],
      status: isPass ? 'PASS' : 'FAIL',
      codeVerdict: 'ACCEPT',
      traineeVerdict: isPass ? 'ACCEPT' : 'REJECT',
      codeStandard: codeRule.shortName,
      scorePct,
      actualDepthMm: 15.0,
      measuredDepthMm: 15.0,
      actualLengthMm: physics.fullSkipWeldMm,
      measuredLengthMm: physics.fullSkipWeldMm,
      notes: {
        ar: `اكتملت المعايرة المرحلية (${completedCount}/7 مراحل) وفق ${codeRule.shortName} شاملة استارت تشيك اللحام.`,
        en: `Completed ${completedCount}/7 code calibration stages per ${codeRule.shortName} through on-weld Start-Check.`,
      },
    });

    setSignedOffCertificate({
      certId: `CAL-V1V2-${Date.now().toString().slice(-5)}`,
      xpEarned: record.xpEarned,
      accuracyPct: record.accuracyPct,
      timestamp: record.timestamp,
    });
  };

  const activeReflectorsList: BlockReflectorSpec[] =
    targetBlock === 'v2_iso7963' ? V2_BLOCK_REFLECTORS : V1_BLOCK_REFLECTORS;
  const activeReflectorSpec =
    activeReflectorsList.find((r) => r.id === selectedReflectorId) ?? activeReflectorsList[0];

  // Probe slider bounds based on active specimen
  const probeSliderMin = targetBlock === 'v1_iso2400' ? 15 : targetBlock === 'v2_iso7963' ? 8 : 15;
  const probeSliderMax = targetBlock === 'v1_iso2400' ? 235 : targetBlock === 'v2_iso7963' ? 70 : 115;

  // --- Generate Continuous A-Scan Waveform Polyline ---
  const aScanSvgPoints = useMemo(() => {
    const svgW = 680;
    const svgH = 200;
    const padL = 38;
    const padR = 14;
    const padT = 16;
    const padB = 26;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;

    const samples = 280;
    const pts: string[] = [];
    // Pulse width depends on damping: 50 Ω = narrow crisp pulse (1.35 mm sigma), 500 Ω = broad ringing pulse (3.9 mm sigma)
    const pulseSigmaMm =
      probeMode === 'zero_deg' && dampingOhms === 500
        ? 3.9
        : dampingOhms === 50
        ? 1.25
        : 2.2;
    const deadZoneWidthMm = dampingOhms === 50 ? 3.2 : 7.8;

    for (let i = 0; i <= samples; i++) {
      const sMm = (i / samples) * screenRangeMm;
      // Initial transmit pulse ("Main Bang") at S = 0
      let ampPct = 98 * Math.exp(-Math.pow(sMm / deadZoneWidthMm, 2));

      // Sum echo contributions
      for (const echo of physics.echoes) {
        const dist = sMm - echo.displayedSoundPathMm;
        const env = echo.amplitudeFshPct * Math.exp(-Math.pow(dist / pulseSigmaMm, 2));
        ampPct = Math.max(ampPct, env);
      }

      // Subtle grass baseline noise (~1.2% FSH)
      const grass = 0.9 + 0.6 * Math.abs(Math.sin(i * 1.9));
      const finalPct = Math.min(100, Math.max(grass, ampPct));
      const x = padL + (i / samples) * plotW;
      const y = padT + (1 - finalPct / 100) * plotH;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return { svgW, svgH, padL, padR, padT, padB, plotW, plotH, polyline: pts.join(' ') };
  }, [physics.echoes, screenRangeMm, probeMode, dampingOhms]);

  const primaryEcho = physics.primaryGateEcho;
  const trueAngleRad = (physics.trueRefractedAngleDeg * Math.PI) / 180;
  const displayedSoundPath = primaryEcho ? primaryEcho.displayedSoundPathMm : 0;
  const displayedDepthMm =
    probeMode === 'zero_deg'
      ? displayedSoundPath
      : Number((displayedSoundPath * Math.cos(trueAngleRad)).toFixed(1));
  const displayedProjMm =
    probeMode === 'zero_deg'
      ? 0
      : Number((displayedSoundPath * Math.sin(trueAngleRad)).toFixed(1));

  const isCurrentStepLiveValid = stepLiveStatus[activeStepNum];
  const isCurrentStepVerified = verifiedSteps.includes(activeStepNum) || isCurrentStepLiveValid;

  return (
    <div className="space-y-6">
      {/* Top Header & Code Selector Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Ruler className="w-4 h-4" />
              <span>
                {isAr
                  ? 'مختبر بلوكات المعايرة القياسية IIW V1 (ISO 2400) & V2 (ISO 7963) والمحاكاة الكودية الكاملة'
                  : 'IIW V1 (ISO 2400) & V2 (ISO 7963) Reference Blocks & Step-by-Step Code Calibration Lab'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {isAr
                ? 'بلوكات المعايرة V1 & V2 بكامل أبعادها ومحاكاة الكالبريشن حتى استارت تشيك اللحام'
                : 'Complete V1 & V2 Calibration Blocks & Step-by-Step Weld Start-Check Simulator'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'رسومات هندسية تفاعلية بمقياس رسم حقيقي لبلوكتي V1 و V2 بتقسيماتهما وثقوبهما وأقواسهما، مع محاكاة عملية من 7 مراحل طبقاً للأكواد الدولية: تبدأ من معايرة شاشة العمل والسرعة والصفر حتى تنفيذ الاستارت تشيك (Start-Check) الفعلي على وصلة اللحام.'
                : 'Scaled interactive blueprints of V1 & V2 blocks with every machined hole, Perspex insert, resolution notch, and angle scale, paired with a 7-stage code-governed workflow from Screen Range Calibration to On-Weld Start-Check.'}
            </p>
          </div>

          {/* Governing Code Switcher + Lab Audio Controls */}
          <div className="space-y-2 shrink-0 flex flex-col items-start lg:items-end">
            <NdtAudioControlChip language={language} compact />
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-slate-400">
                {isAr ? 'الكود الهندسي الحاكم للمعايرة والسماحية:' : 'Governing Calibration Standard:'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CALIBRATION_CODES) as CalibrationCodeId[]).map((cid) => {
                  const c = CALIBRATION_CODES[cid];
                  const active = selectedCodeId === cid;
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => {
                        playCalibrationClick();
                        setSelectedCodeId(cid);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {c.shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 7-Stage Step-by-Step Calibration Progress Strip */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>
                {isAr
                  ? 'مسار الكالبريشن الكودي خطوة بخطوة (من معايرة الشاشة ← استارت تشيك اللحام):'
                  : '7-Stage Code Calibration Pipeline (Screen Range → Weld Start-Check):'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold tabular-nums">
                {
                  [1, 2, 3, 4, 5, 6, 7].filter(
                    (n) => verifiedSteps.includes(n) || stepLiveStatus[n as 1 | 2 | 3 | 4 | 5 | 6 | 7]
                  ).length
                }{' '}
                / 7 {isAr ? 'مراحل معتمدة' : 'Stages Verified'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setInstrumentVelocityMs(5740);
                  setInstrumentZeroDelayUs(1.35);
                  setProbeMode('zero_deg');
                  setTargetBlock('v1_iso2400');
                  setV1ZeroSpot('thk_25');
                  setScreenRangeMm(100);
                  setDampingOhms(500);
                  setBipMarkedOnWedge(false);
                  setRefLevelLocked80Pct(false);
                  setTransferCorrectionDb(0);
                  setScanningGainActive(false);
                  setStartCheckItems({
                    parentMetal0Deg: false,
                    couplantAndSurface: false,
                    halfSkipRoot: false,
                    fullSkipCap: false,
                  });
                  setEquipmentDriftChecked(false);
                  setSensitivityReflectorMode('sdh');
                  setV2SdhDiameterMm(5.0);
                  setVerifiedSteps([]);
                  setSignedOffCertificate(null);
                  setActiveStepNum(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'إعادة ضبط للتدريب اليدوي' : 'Reset Uncalibrated'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CALIBRATION_WORKFLOW_STEPS.map((st) => {
              const isSelected = activeStepNum === st.stepNumber;
              const isDone = verifiedSteps.includes(st.stepNumber) || stepLiveStatus[st.stepNumber];
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => applyStepGuidedSetup(st.stepNumber, false)}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                      : isDone
                      ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200 hover:border-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    <span className="font-bold tabular-nums">
                      {isAr ? `مرحلة ${st.stepNumber}` : `STAGE ${st.stepNumber}`}
                    </span>
                    <span className={isDone ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {isDone ? (isAr ? '✓ مكتمل' : '✓ PASS') : isAr ? '○ ضبط' : '○ SET'}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold leading-snug">
                    {formatBilingual(st.shortTitle, language)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Zone Interactive Sandbox (Left 7 Cols: Scaled Blueprints + Live A-Scan | Right 5 Cols: Step Coach + Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================
            LEFT ZONE (7 COLS): SCALED CAD BLUEPRINT + LIVE DIGITAL A-SCAN
           ================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1A. Specimen / Calibration Block Switcher & Technical Blueprint Canvas */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTargetBlock('v1_iso2400');
                    setSelectedReflectorId('v1_r100_quadrant');
                    if (probePositionXmm > 235) setProbePositionXmm(200);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    targetBlock === 'v1_iso2400'
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isAr ? 'بلوكة V1 القياسية (ISO 2400 — 300×100×25)' : 'Block V1 (ISO 2400 — 300×100×25 mm)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetBlock('v2_iso7963');
                    setSelectedReflectorId('v2_r25_arc');
                    setProbePositionXmm(25);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    targetBlock === 'v2_iso7963'
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-300'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? `بلوكة V2 الميدانية (ISO 7963 — 75×43×${v2ThicknessMm})`
                      : `Block V2 (ISO 7963 — 75×43×${v2ThicknessMm} mm)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetBlock('weld_start_check');
                    setActiveStepNum(7);
                    setProbeMode('angle_shear');
                    setBeamDirection('left');
                    setProbePositionXmm(Math.max(20, Math.round(physics.halfSkipWeldMm || 43)));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    targetBlock === 'weld_start_check'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'وصلة اللحام — استارت تشيك (Start-Check)' : 'Weld Joint — Start-Check'}</span>
                </button>
              </div>

              {/* Contextual Sub-Options for V1 (0° Spots) or V2 (12.5mm vs 20mm thickness + Ø5.0 vs Ø1.5 SDH) */}
              {targetBlock === 'v2_iso7963' && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{isAr ? 'سُمك V2:' : 'V2 Thk:'}</span>
                    {([12.5, 20] as V2BlockThicknessMm[]).map((thk) => (
                      <button
                        key={thk}
                        type="button"
                        onClick={() => setV2ThicknessMm(thk)}
                        className={`px-2 py-0.5 rounded border cursor-pointer tabular-nums ${
                          v2ThicknessMm === thk
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {thk} mm
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{isAr ? 'ثقب SDH:' : 'SDH Ø:'}</span>
                    {([5.0, 1.5] as const).map((dia) => (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => {
                          playCalibrationClick();
                          setV2SdhDiameterMm(dia);
                        }}
                        className={`px-2 py-0.5 rounded border cursor-pointer tabular-nums ${
                          v2SdhDiameterMm === dia
                            ? 'bg-rose-600 text-white font-bold border-rose-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        Ø{dia.toFixed(1)}mm
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {targetBlock === 'v1_iso2400' && probeMode === 'zero_deg' && (
                <div className="flex flex-wrap items-center gap-1 text-[10.5px] font-mono">
                  <span className="text-slate-400">{isAr ? 'موضع مجس 0° على V1:' : 'V1 0° Spot:'}</span>
                  {(
                    [
                      { id: 'thk_25', ar: 'سُمك 25 مم', en: '25mm Width' },
                      { id: 'perspex_50', ar: 'بيرسبكس 50 مم', en: 'PMMA 50mm Eq' },
                      { id: 'res_steps', ar: 'شق التفريق 85/91/100', en: '85/91/100 Steps' },
                      { id: 'height_100', ar: 'ارتفاع 100 مم', en: '100mm Height' },
                    ] as const
                  ).map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => {
                        setV1ZeroSpot(sp.id);
                        if (sp.id === 'res_steps') setProbePositionXmm(196);
                        if (sp.id === 'perspex_50') setProbePositionXmm(100);
                      }}
                      className={`px-2 py-0.5 rounded border cursor-pointer ${
                        v1ZeroSpot === sp.id
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isAr ? sp.ar : sp.en}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3D WebGL Block + 2D Blueprint Mode Bar & Reference Flaw Type Switcher (SDH vs EDM Notch) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'عرض المجسم:' : 'Stage View:'}</span>
                </span>
                {(
                  [
                    { id: 'split_3d_2d', ar: 'مجسم 3D + مخطط 2D', en: '3D Block + 2D CAD' },
                    { id: '3d_only', ar: 'مجسم 3D فقط', en: '3D Block Only' },
                    { id: '2d_only', ar: 'مخطط هندسي 2D', en: '2D CAD Blueprint' },
                  ] as const
                ).map((vm) => (
                  <button
                    key={vm.id}
                    type="button"
                    onClick={() => {
                      playCalibrationClick();
                      setViewportMode(vm.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                      viewportMode === vm.id
                        ? 'bg-cyan-600 text-white font-bold border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    {isAr ? vm.ar : vm.en}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400">
                  {isAr ? 'عاكس الحساسية المرجعي:' : 'Reference Flaw:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setSensitivityReflectorMode('sdh');
                  }}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                    sensitivityReflectorMode === 'sdh'
                      ? 'bg-rose-600 text-white font-bold border-rose-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {isAr ? 'ثقب جانبي (SDH)' : 'Side-Drilled Hole (SDH)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setSensitivityReflectorMode('edm_notch');
                  }}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                    sensitivityReflectorMode === 'edm_notch'
                      ? 'bg-emerald-600 text-white font-bold border-emerald-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {isAr ? 'حز مرجعي (EDM Notch)' : 'Reference Notch (EDM)'}
                </button>
              </div>
            </div>

            {/* ===============================================================
                INTERACTIVE 3D THREE.JS EXTRUDED BLOCK & RAY-TRACING VIEWPORT
               =============================================================== */}
            {viewportMode !== '2d_only' && (
              <V1V2ThreeScene
                language={language}
                targetBlock={targetBlock}
                v2ThicknessMm={v2ThicknessMm}
                v2SdhDiameterMm={v2SdhDiameterMm}
                sensitivityReflectorMode={sensitivityReflectorMode}
                v1ZeroSpot={v1ZeroSpot}
                selectedReflectorId={selectedReflectorId}
                probeMode={probeMode}
                nominalAngleDeg={nominalAngleDeg}
                trueRefractedAngleDeg={physics.trueRefractedAngleDeg}
                probePositionXmm={probePositionXmm}
                beamDirection={beamDirection}
                bipMarkedOnWedge={bipMarkedOnWedge}
                weldThicknessMm={weldThicknessMm}
                halfSkipWeldMm={physics.halfSkipWeldMm}
                fullSkipWeldMm={physics.fullSkipWeldMm}
                couplantApplied={startCheckItems.couplantAndSurface}
                primaryEchoAmplitudePct={primaryEcho ? primaryEcho.amplitudeFshPct : 0}
                onSelectReflector={(refId) => setSelectedReflectorId(refId)}
              />
            )}

            {/* ===============================================================
                SCALED INTERACTIVE SVG BLUEPRINT (V1 / V2 / WELD START-CHECK)
               =============================================================== */}
            <div
              className={`rounded-xl bg-[#070b16] border border-slate-800 p-2 sm:p-3 overflow-hidden ${
                viewportMode === '3d_only' ? 'sr-only' : ''
              }`}
            >
              {targetBlock === 'v1_iso2400' && (
                <svg
                  viewBox="0 0 740 310"
                  className="w-full h-auto block select-none"
                  role="img"
                  aria-label="IIW V1 ISO 2400 Calibration Block Scaled Blueprint"
                >
                  <defs>
                    <linearGradient id="steelBodyV1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="50%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <pattern id="blueprintGridV1" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" />
                    </pattern>
                  </defs>

                  <rect x="0" y="0" width="740" height="310" fill="url(#blueprintGridV1)" />

                  {/* Title Banner Inside Blueprint */}
                  <text x="20" y="22" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    ISO 2400 / IIW TYPE 1 (V1) CALIBRATION BLOCK — SCALE 1:1mm (300 × 100 × 25 mm)
                  </text>

                  {/* Scale: 1 mm = 2.0 px, Block origin (X=0, Y=0) -> SVG (55, 68) */}
                  {(() => {
                    const ox = 55;
                    const oy = 68;
                    const sc = 2.0; // 300mm -> 600px, 100mm -> 200px

                    // Machined V1 Block Path with R100 right quadrant & bottom 85/91/100 resolution steps at X=192..200mm
                    // Top: (0,0) -> (300,0)
                    // Right R100 arc centered at (200,0): from (300,0) to (200,100)
                    // Bottom: (200,100) -> step 91mm at X=194..200, slot 85mm at X=192..194 -> (0,100)
                    const v1Path = [
                      `M ${ox} ${oy}`,
                      `L ${ox + 300 * sc} ${oy}`,
                      `A ${100 * sc} ${100 * sc} 0 0 1 ${ox + 200 * sc} ${oy + 100 * sc}`,
                      `L ${ox + 200 * sc} ${oy + 91 * sc}`,
                      `L ${ox + 194 * sc} ${oy + 91 * sc}`,
                      `L ${ox + 194 * sc} ${oy + 85 * sc}`,
                      `L ${ox + 192 * sc} ${oy + 85 * sc}`,
                      `L ${ox + 192 * sc} ${oy + 100 * sc}`,
                      `L ${ox} ${oy + 100 * sc}`,
                      'Z',
                    ].join(' ');

                    const probeSvgX =
                      probeMode === 'zero_deg'
                        ? v1ZeroSpot === 'perspex_50'
                          ? ox + 100 * sc
                          : v1ZeroSpot === 'res_steps'
                          ? ox + probePositionXmm * sc
                          : v1ZeroSpot === 'thk_25'
                          ? ox + 65 * sc
                          : ox + 145 * sc
                        : ox + probePositionXmm * sc;

                    // Compute Angle Ray End for visualization
                    const rayLenMm =
                      beamDirection === 'right'
                        ? 100
                        : probePositionXmm > 40 && probePositionXmm < 90
                        ? Math.hypot(probePositionXmm - 35, 15)
                        : 95;
                    const dirSign = beamDirection === 'right' ? 1 : -1;
                    const rayEndX = probeSvgX + dirSign * rayLenMm * Math.sin(trueAngleRad) * sc;
                    const rayEndY = oy + rayLenMm * Math.cos(trueAngleRad) * sc;

                    return (
                      <g>
                        {/* Main Steel Silhouette */}
                        <path
                          d={v1Path}
                          fill="url(#steelBodyV1)"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />

                        {/* R100 Center Zero Saw-Slot (2mm x 3mm at X=200, Y=0) */}
                        <rect
                          x={ox + 199 * sc}
                          y={oy}
                          width={2 * sc}
                          height={3.5 * sc}
                          fill="#f59e0b"
                        />
                        <line
                          x1={ox + 200 * sc}
                          y1={oy - 8}
                          x2={ox + 200 * sc}
                          y2={oy + 100 * sc}
                          stroke="#f59e0b"
                          strokeWidth="0.9"
                          strokeDasharray="4 3"
                          opacity="0.65"
                        />
                        <text
                          x={ox + 200 * sc - 16}
                          y={oy - 11}
                          fill="#fbbf24"
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          0 (R100 Center)
                        </text>

                        {/* Engraved Probe Index Millimeter Ruler around X = 150..230 mm */}
                        {Array.from({ length: 17 }, (_, idx) => {
                          const mmOffset = (idx - 10) * 5; // -50 to +30 mm
                          const xTick = ox + (200 + mmOffset) * sc;
                          const isMajor = mmOffset % 10 === 0;
                          return (
                            <g key={mmOffset}>
                              <line
                                x1={xTick}
                                y1={oy}
                                x2={xTick}
                                y2={oy + (isMajor ? 9 : 5)}
                                stroke="#cbd5e1"
                                strokeWidth={mmOffset === 0 ? '1.6' : '0.8'}
                              />
                              {isMajor && mmOffset !== 0 && (
                                <text
                                  x={xTick - 6}
                                  y={oy + 18}
                                  fill="#94a3b8"
                                  fontSize="7.5"
                                  fontFamily="monospace"
                                >
                                  {Math.abs(mmOffset)}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Ø50 mm Hole + Concentric Ø23 mm Perspex/PMMA Insert at (X=100, Y=55) */}
                        <g
                          onClick={() => setSelectedReflectorId('v1_perspex_50')}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={ox + 100 * sc}
                            cy={oy + 55 * sc}
                            r={25 * sc}
                            fill="#091326"
                            stroke={selectedReflectorId === 'v1_perspex_50' ? '#38bdf8' : '#64748b'}
                            strokeWidth={selectedReflectorId === 'v1_perspex_50' ? '2.4' : '1.6'}
                          />
                          <circle
                            cx={ox + 100 * sc}
                            cy={oy + 55 * sc}
                            r={14 * sc}
                            fill="rgba(56, 189, 248, 0.22)"
                            stroke="#38bdf8"
                            strokeWidth="1.4"
                            strokeDasharray="3 2"
                          />
                          <text
                            x={ox + 100 * sc - 26}
                            y={oy + 55 * sc - 3}
                            fill="#bae6fd"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            Ø50 Bore
                          </text>
                          <text
                            x={ox + 100 * sc - 32}
                            y={oy + 55 * sc + 9}
                            fill="#38bdf8"
                            fontSize="7.5"
                            fontFamily="monospace"
                          >
                            PMMA 23=50mm
                          </text>
                        </g>

                        {/* Ø1.5 mm Through-Drilled Reference SDH at (X=35, Y=15) */}
                        <g
                          onClick={() => setSelectedReflectorId('v1_sdh_1_5mm')}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={ox + 35 * sc}
                            cy={oy + 15 * sc}
                            r={4.5}
                            fill="#091326"
                            stroke="#f43f5e"
                            strokeWidth="2"
                          />
                          <circle
                            cx={ox + 35 * sc}
                            cy={oy + 15 * sc}
                            r={1.8}
                            fill="#fb7185"
                          />
                          <text
                            x={ox + 8}
                            y={oy + 15 * sc + 15}
                            fill="#fda4af"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            Ø1.5 SDH (15mm)
                          </text>
                        </g>

                        {/* Engraved Beam Angle Degree Scale on Top Edge for Ø1.5mm SDH (40°, 45°, 50°, 60°, 70°) */}
                        {[40, 45, 50, 60, 70].map((deg) => {
                          const xMm = 35 + 15 * Math.tan((deg * Math.PI) / 180);
                          const xPx = ox + xMm * sc;
                          return (
                            <g key={deg}>
                              <line
                                x1={xPx}
                                y1={oy}
                                x2={xPx}
                                y2={oy + 10}
                                stroke="#fb7185"
                                strokeWidth="1.1"
                              />
                              <text
                                x={xPx - 6}
                                y={oy + 20}
                                fill="#fda4af"
                                fontSize="7.5"
                                fontFamily="monospace"
                              >
                                {deg}°
                              </text>
                            </g>
                          );
                        })}

                        {/* Highlight Resolution Triplet Steps (85 / 91 / 100 mm) */}
                        <g
                          onClick={() => setSelectedReflectorId('v1_resolution_steps')}
                          className="cursor-pointer"
                        >
                          <rect
                            x={ox + 189 * sc}
                            y={oy + 82 * sc}
                            width={14 * sc}
                            height={20 * sc}
                            fill="transparent"
                            stroke={selectedReflectorId === 'v1_resolution_steps' ? '#34d399' : '#10b981'}
                            strokeWidth="1.2"
                            strokeDasharray="3 2"
                          />
                          <text
                            x={ox + 148 * sc}
                            y={oy + 96 * sc}
                            fill="#6ee7b7"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            85/91/100mm Steps
                          </text>
                        </g>

                        {/* R100 Radius Callout Arrow */}
                        <g
                          onClick={() => setSelectedReflectorId('v1_r100_quadrant')}
                          className="cursor-pointer"
                        >
                          <line
                            x1={ox + 200 * sc}
                            y1={oy}
                            x2={ox + (200 + 100 * Math.sin(Math.PI / 3)) * sc}
                            y2={oy + 100 * Math.cos(Math.PI / 3) * sc}
                            stroke="#f59e0b"
                            strokeWidth="1.2"
                            strokeDasharray="4 2"
                          />
                          <text
                            x={ox + 242 * sc}
                            y={oy + 38 * sc}
                            fill="#fbbf24"
                            fontSize="9.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            R = 100.0 mm
                          </text>
                        </g>

                        {/* Overall Dimension Lines: 300 mm Bottom & 100 mm Left & 25 mm Thickness Badge */}
                        <line x1={ox} y1={oy + 216} x2={ox + 600} y2={oy + 216} stroke="#64748b" strokeWidth="1.2" />
                        <line x1={ox} y1={oy + 210} x2={ox} y2={oy + 222} stroke="#64748b" strokeWidth="1.2" />
                        <line x1={ox + 600} y1={oy + 68} x2={ox + 600} y2={oy + 222} stroke="#64748b" strokeWidth="0.7" strokeDasharray="3 3" />
                        <text x={ox + 255} y={oy + 230} fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          L = 300.0 mm (200 mm + R100 mm)
                        </text>

                        <line x1={ox - 16} y1={oy} x2={ox - 16} y2={oy + 200} stroke="#64748b" strokeWidth="1.2" />
                        <text
                          x={ox - 24}
                          y={oy + 115}
                          fill="#cbd5e1"
                          fontSize="9.5"
                          fontFamily="monospace"
                          transform={`rotate(-90, ${ox - 24}, ${oy + 115})`}
                        >
                          H = 100.0 mm
                        </text>

                        {/* Side Profile Thickness Callout Box (25.0 mm) */}
                        <rect x="666" y="68" width="50" height="200" fill="#1e293b" stroke="#64748b" strokeWidth="1.4" />
                        <text x="670" y="60" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          Z=25mm
                        </text>
                        <line x1="666" y1={oy + 15 * sc} x2="716" y2={oy + 15 * sc} stroke="#fb7185" strokeWidth="1.4" strokeDasharray="3 2" />
                        <rect x="679" y={oy + 30 * sc} width="24" height={50 * sc} fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="1" />

                        {/* Live UT Probe & Acoustic Ray Tracing */}
                        {probeMode === 'zero_deg' ? (
                          <g>
                            <rect
                              x={probeSvgX - 13}
                              y={oy - 24}
                              width="26"
                              height="24"
                              rx="3"
                              fill="#059669"
                              stroke="#6ee7b7"
                              strokeWidth="1.5"
                            />
                            <text x={probeSvgX - 9} y={oy - 9} fill="#ffffff" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                              0°
                            </text>
                            {v1ZeroSpot === 'thk_25' ? (
                              <line
                                x1="691"
                                y1="68"
                                x2="691"
                                y2="268"
                                stroke="#34d399"
                                strokeWidth="2.2"
                                strokeDasharray="5 3"
                              />
                            ) : (
                              <>
                                <line
                                  x1={probeSvgX}
                                  y1={oy}
                                  x2={probeSvgX}
                                  y2={
                                    v1ZeroSpot === 'res_steps'
                                      ? oy + 85 * sc
                                      : oy + 100 * sc
                                  }
                                  stroke="#34d399"
                                  strokeWidth="2.2"
                                  strokeDasharray="5 3"
                                />
                                {v1ZeroSpot === 'res_steps' && (
                                  <>
                                    <line x1={probeSvgX - 5} y1={oy} x2={probeSvgX - 5} y2={oy + 100 * sc} stroke="#34d399" strokeWidth="1.2" opacity="0.7" />
                                    <line x1={probeSvgX + 5} y1={oy} x2={probeSvgX + 5} y2={oy + 91 * sc} stroke="#34d399" strokeWidth="1.2" opacity="0.7" />
                                  </>
                                )}
                              </>
                            )}
                          </g>
                        ) : (
                          <g>
                            {/* Perspex Angle Wedge */}
                            <polygon
                              points={`${probeSvgX - 20},${oy} ${probeSvgX + 20},${oy} ${
                                beamDirection === 'right' ? probeSvgX - 8 : probeSvgX + 8
                              },${oy - 24} ${
                                beamDirection === 'right' ? probeSvgX - 22 : probeSvgX + 22
                              },${oy - 14}`}
                              fill="#0284c7"
                              stroke="#7dd3fc"
                              strokeWidth="1.5"
                            />
                            {/* Red BIP Exit Tick on Wedge */}
                            <line
                              x1={probeSvgX}
                              y1={oy - 8}
                              x2={probeSvgX}
                              y2={oy + 3}
                              stroke={bipMarkedOnWedge ? '#22c55e' : '#f43f5e'}
                              strokeWidth="2.5"
                            />
                            <text
                              x={probeSvgX - 16}
                              y={oy - 27}
                              fill="#e0f2fe"
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {nominalAngleDeg}° (X={probePositionXmm}mm)
                            </text>
                            {/* Ultrasonic Shear Beam Cone & Central Axis */}
                            <polygon
                              points={`${probeSvgX},${oy} ${rayEndX - 10},${Math.min(oy + 198, rayEndY)} ${rayEndX + 10},${Math.min(oy + 198, rayEndY)}`}
                              fill="rgba(56, 189, 248, 0.16)"
                            />
                            <line
                              x1={probeSvgX}
                              y1={oy}
                              x2={rayEndX}
                              y2={Math.min(oy + 198, rayEndY)}
                              stroke="#38bdf8"
                              strokeWidth="2.2"
                              strokeDasharray="6 3"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              )}

              {targetBlock === 'v2_iso7963' && (
                <svg
                  viewBox="0 0 740 300"
                  className="w-full h-auto block select-none"
                  role="img"
                  aria-label="IIW V2 ISO 7963 Miniature Calibration Block Scaled Blueprint"
                >
                  <rect x="0" y="0" width="740" height="300" fill="#070b16" />
                  <text x="20" y="22" fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    {`ISO 7963 / IIW TYPE 2 (V2) FIELD BLOCK — 75 × 43 × ${v2ThicknessMm} mm (Concentric R25 & R50)`}
                  </text>

                  {/* Scale: 1 mm = 4.6 px, Block X = 0..75 mm -> 345 px, Y = 0..43 mm -> 197.8 px */}
                  {(() => {
                    const ox = 140;
                    const oy = 62;
                    const sc = 4.6;
                    // V2 Geometry: Zero center at (X=25, Y=0).
                    // Left curve = R25 centered at (25, 0) from (0, 0) down to (25, 25), then trimmed/extended to bottom flat face Y=43!
                    // Actually ISO 7963: Two opposing arcs R25 (left) and R50 (right) centered on opposing/offset or shared zero index:
                    // Left arc R25 centered at (25, 0): at Y=0 -> X=0; sweeps to X = 25 - sqrt(25^2 - y^2) down to Y=22, and bottom edge at Y=43.
                    // Right arc R50 centered at (25, 0): at Y=0 -> X=75; at Y=43 -> X = 25 + sqrt(50^2 - 43^2) = 25 + 25.5 = 50.5 mm!
                    const r50BotX = 25 + Math.sqrt(50 * 50 - 43 * 43); // ~50.51 mm
                    const r25EndAngleY = 25; // bottom of R25 quadrant at (25, 25), connected cleanly via ISO 7963 profile
                    const v2Path = [
                      `M ${ox} ${oy}`,
                      `L ${ox + 75 * sc} ${oy}`,
                      `A ${50 * sc} ${50 * sc} 0 0 1 ${ox + r50BotX * sc} ${oy + 43 * sc}`,
                      `L ${ox + 14 * sc} ${oy + 43 * sc}`,
                      `L ${ox + 8 * sc} ${oy + 23 * sc}`,
                      `A ${25 * sc} ${25 * sc} 0 0 1 ${ox} ${oy}`,
                      'Z',
                    ].join(' ');

                    const probeSvgX = ox + probePositionXmm * sc;
                    const dirSign = beamDirection === 'right' ? 1 : -1;
                    const rayLenMm = beamDirection === 'left' ? 25 : 50;
                    const rayEndX = probeSvgX + dirSign * rayLenMm * Math.sin(trueAngleRad) * sc;
                    const rayEndY = oy + rayLenMm * Math.cos(trueAngleRad) * sc;
                    void r25EndAngleY;

                    return (
                      <g>
                        <path d={v2Path} fill="#162033" stroke="#cbd5e1" strokeWidth="2.2" />

                        {/* Shared Zero Center Datum (X = 25 mm, Y = 0 mm) */}
                        <line
                          x1={ox + 25 * sc}
                          y1={oy - 10}
                          x2={ox + 25 * sc}
                          y2={oy + 43 * sc}
                          stroke="#fbbf24"
                          strokeWidth="1.2"
                          strokeDasharray="4 3"
                        />
                        <text x={ox + 25 * sc - 26} y={oy - 13} fill="#fbbf24" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                          0 (R25/R50 Center)
                        </text>

                        {/* Engraved Index Millimeter Ticks (-15 to +15 mm around X = 25 mm) */}
                        {[-15, -10, -5, 0, 5, 10, 15].map((mmOff) => {
                          const tx = ox + (25 + mmOff) * sc;
                          return (
                            <g key={mmOff}>
                              <line x1={tx} y1={oy} x2={tx} y2={oy + 8} stroke="#e2e8f0" strokeWidth="1" />
                              {mmOff !== 0 && (
                                <text x={tx - 6} y={oy + 18} fill="#94a3b8" fontSize="8" fontFamily="monospace">
                                  {Math.abs(mmOff)}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Ø5.0 mm Reference SDH at (X = 45 mm, Y = 15 mm) */}
                        <g
                          onClick={() => setSelectedReflectorId('v2_sdh_5mm')}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={ox + 45 * sc}
                            cy={oy + 15 * sc}
                            r={2.5 * sc}
                            fill="#070b16"
                            stroke="#f43f5e"
                            strokeWidth="2.2"
                          />
                          <text
                            x={ox + 45 * sc - 28}
                            y={oy + 15 * sc + 24}
                            fill="#fda4af"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            Ø5.0 mm SDH (15mm)
                          </text>
                        </g>

                        {/* Engraved Angle Scale (40°..70°) for Ø5mm SDH */}
                        {[45, 55, 60, 65, 70].map((deg) => {
                          const xMm = 45 + 15 * Math.tan((deg * Math.PI) / 180);
                          if (xMm > 74) return null;
                          const tx = ox + xMm * sc;
                          return (
                            <g key={deg}>
                              <line x1={tx} y1={oy} x2={tx} y2={oy + 9} stroke="#fb7185" strokeWidth="1" />
                              <text x={tx - 6} y={oy + 19} fill="#fda4af" fontSize="7.5" fontFamily="monospace">
                                {deg}°
                              </text>
                            </g>
                          );
                        })}

                        {/* R25 & R50 Dimension Callouts */}
                        <text
                          x={ox - 58}
                          y={oy + 58}
                          fill="#38bdf8"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          onClick={() => setSelectedReflectorId('v2_r25_arc')}
                          className="cursor-pointer"
                        >
                          R25.0 mm
                        </text>
                        <text
                          x={ox + 68 * sc}
                          y={oy + 105}
                          fill="#fbbf24"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          onClick={() => setSelectedReflectorId('v2_r50_arc')}
                          className="cursor-pointer"
                        >
                          R50.0 mm
                        </text>

                        {/* Overall Dimensions: 25mm + 50mm = 75.0 mm, H = 43.0 mm, Side Profile 12.5/20 mm */}
                        <line x1={ox} y1={oy + 214} x2={ox + 75 * sc} y2={oy + 214} stroke="#64748b" strokeWidth="1.2" />
                        <text x={ox + 95} y={oy + 228} fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          Total L = 75.0 mm (R25 + R50) · H = 43.0 mm
                        </text>

                        {/* Side Profile Thickness View */}
                        <rect
                          x="585"
                          y={oy}
                          width={v2ThicknessMm * 3.2}
                          height={43 * sc}
                          fill="#1e293b"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        />
                        <text x="575" y={oy - 8} fill="#fbbf24" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                          Thk = {v2ThicknessMm} mm
                        </text>

                        {/* Probe & Reverberation Ray Path */}
                        {probeMode === 'zero_deg' ? (
                          <g>
                            <rect x={probeSvgX - 13} y={oy - 24} width="26" height="24" rx="3" fill="#059669" stroke="#6ee7b7" />
                            <text x={probeSvgX - 8} y={oy - 9} fill="#fff" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                              0°
                            </text>
                            <line x1="605" y1={oy} x2="605" y2={oy + 43 * sc} stroke="#34d399" strokeWidth="2.2" strokeDasharray="5 3" />
                          </g>
                        ) : (
                          <g>
                            <polygon
                              points={`${probeSvgX - 20},${oy} ${probeSvgX + 20},${oy} ${
                                beamDirection === 'right' ? probeSvgX - 8 : probeSvgX + 8
                              },${oy - 24} ${
                                beamDirection === 'right' ? probeSvgX - 22 : probeSvgX + 22
                              },${oy - 14}`}
                              fill="#d97706"
                              stroke="#fde68a"
                              strokeWidth="1.5"
                            />
                            <line
                              x1={probeSvgX}
                              y1={oy - 8}
                              x2={probeSvgX}
                              y2={oy + 3}
                              stroke={bipMarkedOnWedge ? '#22c55e' : '#f43f5e'}
                              strokeWidth="2.5"
                            />
                            <text x={probeSvgX - 22} y={oy - 28} fill="#fef3c7" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                              {nominalAngleDeg}° ({beamDirection === 'left' ? '← R25' : 'R50 →'})
                            </text>
                            <line
                              x1={probeSvgX}
                              y1={oy}
                              x2={rayEndX}
                              y2={Math.min(oy + 43 * sc, rayEndY)}
                              stroke="#38bdf8"
                              strokeWidth="2.4"
                              strokeDasharray="6 3"
                            />
                            {/* Show secondary R50/R25 reverb path when near zero center */}
                            {Math.abs(probePositionXmm - 25) <= 4 && (
                              <line
                                x1={probeSvgX}
                                y1={oy}
                                x2={probeSvgX - dirSign * (beamDirection === 'left' ? 50 : 25) * Math.sin(trueAngleRad) * sc}
                                y2={Math.min(
                                  oy + 43 * sc,
                                  oy + (beamDirection === 'left' ? 50 : 25) * Math.cos(trueAngleRad) * sc
                                )}
                                stroke="#fbbf24"
                                strokeWidth="1.4"
                                strokeDasharray="3 3"
                                opacity="0.75"
                              />
                            )}
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              )}

              {targetBlock === 'weld_start_check' && (
                <svg
                  viewBox="0 0 740 295"
                  className="w-full h-auto block select-none"
                  role="img"
                  aria-label="Weld Pre-Scan Start-Check Cross Section"
                >
                  <rect x="0" y="0" width="740" height="295" fill="#070b16" />
                  <text x="20" y="22" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    {`STAGE 7: PRE-SCAN WELD START-CHECK — Butt Joint t=${weldThicknessMm}mm · S/2=${physics.halfSkipWeldMm}mm · S=${physics.fullSkipWeldMm}mm`}
                  </text>

                  {(() => {
                    const weldCx = 165;
                    const topY = 78;
                    const sc = 4.2; // 25mm -> 105px; 110mm standoff -> 462px
                    const botY = topY + weldThicknessMm * sc;
                    const halfCapPx = 9 * sc;
                    const halfRootPx = 1.8 * sc;
                    const probeSvgX = weldCx + probePositionXmm * sc;

                    const halfSkipX = weldCx + physics.halfSkipWeldMm * sc;
                    const fullSkipX = weldCx + physics.fullSkipWeldMm * sc;

                    // Leg I & Leg II ray tracing from probe toward weld centerline
                    const leg1BounceX = probeSvgX - physics.halfSkipWeldMm * sc;
                    const leg2TopX = probeSvgX - physics.fullSkipWeldMm * sc;

                    return (
                      <g>
                        {/* Parent Metal Plate */}
                        <rect
                          x="35"
                          y={topY}
                          width="675"
                          height={weldThicknessMm * sc}
                          fill="#172033"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />

                        {/* Couplant Film Strip when verified */}
                        {startCheckItems.couplantAndSurface && (
                          <rect
                            x={weldCx + halfCapPx + 4}
                            y={topY - 4}
                            width="480"
                            height="4"
                            fill="rgba(56, 189, 248, 0.45)"
                          />
                        )}

                        {/* Single-V Butt Weld Groove, Crown & Root Pass Bead */}
                        <polygon
                          points={`${weldCx - halfCapPx},${topY} ${weldCx + halfCapPx},${topY} ${weldCx + halfRootPx},${botY} ${weldCx - halfRootPx},${botY}`}
                          fill="#334155"
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                        />
                        <path
                          d={`M ${weldCx - halfCapPx - 3} ${topY} Q ${weldCx} ${topY - 12} ${weldCx + halfCapPx + 3} ${topY}`}
                          fill="#475569"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                        />
                        <path
                          d={`M ${weldCx - halfRootPx - 3} ${botY} Q ${weldCx} ${botY + 8} ${weldCx + halfRootPx + 3} ${botY}`}
                          fill="#475569"
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={weldCx}
                          y1={topY - 22}
                          x2={weldCx}
                          y2={botY + 18}
                          stroke="#64748b"
                          strokeWidth="1"
                          strokeDasharray="4 3"
                        />
                        <text x={weldCx - 28} y={topY - 26} fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                          Weld CL (X=0)
                        </text>

                        {/* Chalk Marks on Plate for Half-Skip (S/2) & Full-Skip (S) */}
                        {halfSkipX < 695 && (
                          <g>
                            <line x1={halfSkipX} y1={topY - 10} x2={halfSkipX} y2={topY + 10} stroke="#fbbf24" strokeWidth="2.2" />
                            <text x={halfSkipX - 28} y={topY + 23} fill="#fbbf24" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                              S/2={physics.halfSkipWeldMm}mm
                            </text>
                          </g>
                        )}
                        {fullSkipX < 700 && (
                          <g>
                            <line x1={fullSkipX} y1={topY - 10} x2={fullSkipX} y2={topY + 10} stroke="#38bdf8" strokeWidth="2.2" />
                            <text x={fullSkipX - 26} y={topY + 23} fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                              S={physics.fullSkipWeldMm}mm
                            </text>
                          </g>
                        )}

                        {/* Probe & Acoustic Beam Coverage on Weld */}
                        {probeMode === 'zero_deg' ? (
                          <g>
                            <rect x={probeSvgX - 14} y={topY - 26} width="28" height="26" rx="3" fill="#059669" stroke="#6ee7b7" strokeWidth="1.6" />
                            <text x={probeSvgX - 9} y={topY - 10} fill="#fff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                              0°
                            </text>
                            <line
                              x1={probeSvgX}
                              y1={topY}
                              x2={probeSvgX}
                              y2={botY}
                              stroke="#34d399"
                              strokeWidth="2.5"
                              strokeDasharray="5 3"
                            />
                            <text x={probeSvgX + 10} y={(topY + botY) / 2} fill="#6ee7b7" fontSize="9" fontFamily="monospace">
                              Clean 25.0mm (No Lamination)
                            </text>
                          </g>
                        ) : (
                          <g>
                            <polygon
                              points={`${probeSvgX - 20},${topY} ${probeSvgX + 20},${topY} ${probeSvgX + 8},${topY - 25} ${probeSvgX + 22},${topY - 14}`}
                              fill="#0284c7"
                              stroke="#7dd3fc"
                              strokeWidth="1.6"
                            />
                            <text x={probeSvgX - 22} y={topY - 30} fill="#e0f2fe" fontSize="9" fontFamily="monospace" fontWeight="bold">
                              {nominalAngleDeg}° @ X={probePositionXmm}mm
                            </text>
                            {/* Leg I (Direct to Root) */}
                            <line
                              x1={probeSvgX}
                              y1={topY}
                              x2={Math.max(40, leg1BounceX)}
                              y2={botY}
                              stroke="#fbbf24"
                              strokeWidth="2.4"
                              strokeDasharray="6 3"
                            />
                            {/* Leg II (Bounce from Root/Bottom up to Cap/Upper Bevel) */}
                            {leg1BounceX > 45 && (
                              <line
                                x1={leg1BounceX}
                                y1={botY}
                                x2={Math.max(40, leg2TopX)}
                                y2={topY}
                                stroke="#38bdf8"
                                strokeWidth="2.0"
                                strokeDasharray="4 3"
                              />
                            )}
                          </g>
                        )}

                        <text x="42" y={botY + 34} fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                          {isAr
                            ? 'علامات الطباشير الميدانية: Leg I يغطي الجذر عند S/2 · Leg II يغطي الوجه والكاب عند القفزة الكاملة S'
                            : 'Field Skip Marks: Leg I hits Weld Root at S/2 · Leg II sweeps Upper Bevel & Cap at Full Skip S'}
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              )}
            </div>

            {/* Interactive Probe Position Slider + Beam Direction + Angle Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
              <div className="sm:col-span-6 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <label htmlFor="v1v2-probe-x-slider" className="text-slate-300 font-bold">
                    {isAr ? 'موضع المجس على السطح (X mm):' : 'Probe Surface Position (X mm):'}
                  </label>
                  <span className="text-cyan-400 font-bold tabular-nums">{probePositionXmm.toFixed(1)} mm</span>
                </div>
                <input
                  id="v1v2-probe-x-slider"
                  type="range"
                  min={probeSliderMin}
                  max={probeSliderMax}
                  step="0.5"
                  value={Math.min(probeSliderMax, Math.max(probeSliderMin, probePositionXmm))}
                  onChange={(e) => {
                    playProbeScanTick();
                    setProbePositionXmm(Number(e.target.value));
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <div className="text-[11px] text-slate-400">{isAr ? 'نوع وزاوية المجس:' : 'Probe Mode / Angle:'}</div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setProbeMode('zero_deg')}
                    className={`py-1 rounded border text-[10px] font-bold cursor-pointer ${
                      probeMode === 'zero_deg'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    0°
                  </button>
                  {([45, 60, 70] as const).map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        setProbeMode('angle_shear');
                        setNominalAngleDeg(deg);
                      }}
                      className={`py-1 rounded border text-[10px] font-bold cursor-pointer tabular-nums ${
                        probeMode === 'angle_shear' && nominalAngleDeg === deg
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <div className="text-[11px] text-slate-400">{isAr ? 'اتجاه توجيه الشعاع:' : 'Beam Aim Direction:'}</div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    disabled={probeMode === 'zero_deg' || targetBlock === 'weld_start_check'}
                    onClick={() => setBeamDirection('left')}
                    className={`py-1 rounded border text-[10px] font-bold cursor-pointer disabled:opacity-40 ${
                      beamDirection === 'left'
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isAr ? '← يسار' : '← Left'}
                  </button>
                  <button
                    type="button"
                    disabled={probeMode === 'zero_deg' || targetBlock === 'weld_start_check'}
                    onClick={() => setBeamDirection('right')}
                    className={`py-1 rounded border text-[10px] font-bold cursor-pointer disabled:opacity-40 ${
                      beamDirection === 'right'
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isAr ? 'يمين →' : 'Right →'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 1B. Live Physics-Driven Digital Flaw Detector A-Scan Screen */}
          <div className="rounded-2xl border border-slate-700 bg-black p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold">
                  {isAr ? 'شاشة العمل الحية لجهاز الموجات فوق الصوتية (A-Scan)' : 'LIVE CALIBRATION A-SCAN OSCILLOSCOPE'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 tabular-nums">
                <span>Range: 0–{screenRangeMm} mm</span>
                <span>·</span>
                <span>V = {instrumentVelocityMs} m/s</span>
                <span>·</span>
                <span>Zero = {instrumentZeroDelayUs.toFixed(2)} µs</span>
                <span>·</span>
                <span className="text-cyan-400 font-bold">
                  Gain = {(gainDb + transferCorrectionDb + (scanningGainActive ? 6 : 0)).toFixed(1)} dB
                </span>
              </div>
            </div>

            {/* SVG Oscilloscope Graticule & Echo Trace */}
            <svg
              viewBox={`0 0 ${aScanSvgPoints.svgW} ${aScanSvgPoints.svgH}`}
              className="w-full h-48 sm:h-52 rounded-xl bg-[#040911] border border-slate-800 block select-none"
              role="img"
              aria-label="Live Ultrasonic A-Scan Calibration Screen"
            >
              {/* 10x10 Graticule Grid */}
              {Array.from({ length: 11 }, (_, idx) => {
                const gx = aScanSvgPoints.padL + (idx / 10) * aScanSvgPoints.plotW;
                const gy = aScanSvgPoints.padT + (idx / 10) * aScanSvgPoints.plotH;
                const rangeLabel = Math.round((idx / 10) * screenRangeMm);
                return (
                  <g key={idx}>
                    <line
                      x1={gx}
                      y1={aScanSvgPoints.padT}
                      x2={gx}
                      y2={aScanSvgPoints.padT + aScanSvgPoints.plotH}
                      stroke="#132238"
                      strokeWidth={idx % 2 === 0 ? '1' : '0.6'}
                    />
                    <line
                      x1={aScanSvgPoints.padL}
                      y1={gy}
                      x2={aScanSvgPoints.padL + aScanSvgPoints.plotW}
                      y2={gy}
                      stroke="#132238"
                      strokeWidth={idx % 2 === 0 ? '1' : '0.6'}
                    />
                    {idx % 2 === 0 && (
                      <text
                        x={gx - 9}
                        y={aScanSvgPoints.svgH - 7}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {rangeLabel}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 80% FSH Reference Sensitivity Horizontal Line */}
              <line
                x1={aScanSvgPoints.padL}
                y1={aScanSvgPoints.padT + 0.2 * aScanSvgPoints.plotH}
                x2={aScanSvgPoints.padL + aScanSvgPoints.plotW}
                y2={aScanSvgPoints.padT + 0.2 * aScanSvgPoints.plotH}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="5 4"
              />
              <text
                x={aScanSvgPoints.padL + 6}
                y={aScanSvgPoints.padT + 0.2 * aScanSvgPoints.plotH - 4}
                fill="#fbbf24"
                fontSize="8.5"
                fontFamily="monospace"
              >
                80% FSH Reference Level
              </text>

              {/* Gate A Bar */}
              {(() => {
                const gx1 =
                  aScanSvgPoints.padL +
                  Math.min(1, Math.max(0, gateAStartMm / screenRangeMm)) * aScanSvgPoints.plotW;
                const gx2 =
                  aScanSvgPoints.padL +
                  Math.min(1, Math.max(0, (gateAStartMm + gateAWidthMm) / screenRangeMm)) *
                    aScanSvgPoints.plotW;
                const gy =
                  aScanSvgPoints.padT + (1 - gateAThresholdPct / 100) * aScanSvgPoints.plotH;
                return (
                  <line
                    x1={gx1}
                    y1={gy}
                    x2={Math.max(gx1 + 12, gx2)}
                    y2={gy}
                    stroke="#f43f5e"
                    strokeWidth="3"
                  />
                );
              })()}

              {/* True Target Markers (Subtle Cyan Ticks showing exact expected graticule positions) */}
              {physics.echoes.map((ec) => {
                if (ec.trueSoundPathMm < 0 || ec.trueSoundPathMm > screenRangeMm) return null;
                const tx = aScanSvgPoints.padL + (ec.trueSoundPathMm / screenRangeMm) * aScanSvgPoints.plotW;
                const dx = aScanSvgPoints.padL + (ec.displayedSoundPathMm / screenRangeMm) * aScanSvgPoints.plotW;
                return (
                  <g key={ec.id}>
                    <line
                      x1={tx}
                      y1={aScanSvgPoints.padT}
                      x2={tx}
                      y2={aScanSvgPoints.padT + 10}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    {ec.displayedSoundPathMm >= 0 && ec.displayedSoundPathMm <= screenRangeMm && (
                      <text
                        x={Math.min(aScanSvgPoints.svgW - 55, Math.max(aScanSvgPoints.padL + 2, dx - 16))}
                        y={Math.max(
                          aScanSvgPoints.padT + 12,
                          aScanSvgPoints.padT + (1 - ec.amplitudeFshPct / 100) * aScanSvgPoints.plotH - 6
                        )}
                        fill="#86efac"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {ec.displayedSoundPathMm.toFixed(1)}mm
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Main Rectified A-Scan Signal Trace */}
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.1"
                points={aScanSvgPoints.polyline}
              />

              {/* Y-Axis % FSH Labels */}
              <text x="6" y={aScanSvgPoints.padT + 8} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                100%
              </text>
              <text
                x="10"
                y={aScanSvgPoints.padT + 0.2 * aScanSvgPoints.plotH + 3}
                fill="#fbbf24"
                fontSize="8.5"
                fontFamily="monospace"
              >
                80%
              </text>
              <text
                x="10"
                y={aScanSvgPoints.padT + 0.5 * aScanSvgPoints.plotH + 3}
                fill="#64748b"
                fontSize="8.5"
                fontFamily="monospace"
              >
                50%
              </text>
              <text
                x="14"
                y={aScanSvgPoints.padT + aScanSvgPoints.plotH}
                fill="#64748b"
                fontSize="8.5"
                fontFamily="monospace"
              >
                0%
              </text>
            </svg>

            {/* Digital Telemetry Readout Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs tabular-nums">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'المسار المقاس على الشاشة (S):' : 'Displayed Path (S):'}
                </div>
                <div className="text-base font-black text-emerald-400">
                  {primaryEcho ? `${primaryEcho.displayedSoundPathMm.toFixed(1)} mm` : '—'}
                </div>
                {primaryEcho && (
                  <div className="text-[10px] text-slate-500">
                    {isAr ? 'الفعلي:' : 'True:'} {primaryEcho.trueSoundPathMm.toFixed(1)} mm
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'خطأ تدريج المدى (ΔS):' : 'Sweep Error (ΔS):'}
                </div>
                {(() => {
                  const err = primaryEcho
                    ? Math.abs(primaryEcho.displayedSoundPathMm - primaryEcho.trueSoundPathMm)
                    : 0;
                  const withinTol = primaryEcho && err <= codeRule.rangeLinearityToleranceMm;
                  return (
                    <>
                      <div className={`text-base font-black ${withinTol ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {primaryEcho ? `${err.toFixed(2)} mm` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isAr ? 'سماحية الكود:' : 'Limit:'} ±{codeRule.rangeLinearityToleranceMm} mm
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'سعة القمة (% FSH):' : 'Peak Height (% FSH):'}
                </div>
                <div className="text-base font-black text-amber-300">
                  {primaryEcho ? `${primaryEcho.amplitudeFshPct.toFixed(1)}%` : '0.0%'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {refLevelLocked80Pct ? (isAr ? 'المرجع مثبت 80%' : 'Ref Locked 80%') : 'Target 80% FSH'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'العمق (D) / الإسقاط (P):' : 'Depth (D) / Surf (P):'}
                </div>
                <div className="text-sm font-black text-white">
                  {displayedDepthMm.toFixed(1)} / {displayedProjMm.toFixed(1)} mm
                </div>
                <div className="text-[10px] text-slate-500">
                  {probeMode === 'zero_deg' ? '0° Compression' : `β_nom = ${nominalAngleDeg}°`}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'قراءة الزاوية على البلوك:' : 'Scale Angle Readout:'}
                </div>
                <div className="text-base font-black text-rose-300">
                  {physics.measuredAngleOnScaleDeg !== null
                    ? `${physics.measuredAngleOnScaleDeg.toFixed(1)}°`
                    : probeMode === 'zero_deg'
                    ? '0.0°'
                    : `${physics.trueRefractedAngleDeg.toFixed(1)}°`}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isAr ? 'السماحية:' : 'Code:'} ±{codeRule.angleToleranceDeg}°
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            RIGHT ZONE (5 COLS): STEP-BY-STEP COACH + INSTRUMENT KEYPAD
           ================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Stage Step-by-Step Procedure Card */}
          <div className="rounded-2xl border border-cyan-500/35 bg-slate-900/95 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-amber-400 font-bold">
                  {currentStep.codeReference[selectedCodeId]}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  {formatBilingual(currentStep.fullTitle, language)}
                </h3>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border shrink-0 ${
                  isCurrentStepVerified
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                }`}
              >
                {isCurrentStepVerified
                  ? isAr
                    ? '✓ مطابق للكود'
                    : '✓ CODE VERIFIED'
                  : isAr
                  ? '▲ بانتظار الضبط'
                  : '▲ ADJUST NOW'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {formatBilingual(currentStep.objective, language)}
            </p>

            {/* Step-by-Step Numbered Procedure */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
              <div className="text-[11px] font-mono font-bold text-cyan-400">
                {isAr ? 'خطوات التنفيذ العملي للفاحص (Step-by-Step):' : 'Inspector Step-by-Step Procedure:'}
              </div>
              <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                {(isAr ? currentStep.operatorProcedure.ar : currentStep.operatorProcedure.en).map(
                  (line, i) => (
                    <li key={i}>{line}</li>
                  )
                )}
              </ol>
            </div>

            {/* Code Acceptance Criteria Banner */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono flex items-start gap-2">
              <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400">
                  {isAr ? 'معيار القبول حسب الكود:' : 'Code Verification Criterion:'}
                </div>
                <div className="text-white font-bold mt-0.5">
                  {formatBilingual(currentStep.acceptanceCriteriaLabel, language)}
                </div>
              </div>
            </div>

            {/* Stage-Specific Action Controls (Stage 3 Mark BIP, Stage 6 Lock 80% Ref, Stage 7 Start-Check Checklist) */}
            {activeStepNum === 3 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">
                    {isAr ? 'إزاحة المجس عن مركز القوس (0):' : 'Offset from Arc Zero Center:'}
                  </span>
                  <span className="font-bold text-amber-300 tabular-nums">
                    {physics.indexErrorFromArcCenterMm !== null
                      ? `${physics.indexErrorFromArcCenterMm > 0 ? '+' : ''}${physics.indexErrorFromArcCenterMm} mm`
                      : '—'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationSuccessPing();
                    setBipMarkedOnWedge(true);
                    if (
                      physics.indexErrorFromArcCenterMm !== null &&
                      Math.abs(physics.indexErrorFromArcCenterMm) <= codeRule.indexToleranceMm
                    ) {
                      markStepVerified(3);
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>
                    {bipMarkedOnWedge
                      ? isAr
                        ? '✓ تم تعليم نقطة خروج الشعاع (BIP) على جانب الويدج'
                        : '✓ Beam Index Point (BIP) Marked on Wedge'
                      : isAr
                      ? 'اعتماد علامة نقطة خروج الشعاع (BIP) عند أقصى قمة'
                      : 'Mark True Beam Index Point (BIP) on Wedge'}
                  </span>
                </button>
              </div>
            )}

            {activeStepNum === 6 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-amber-300 font-bold">
                    {isAr
                      ? 'ميزانية معايرة حساسية الشاشة (Screen Sensitivity Ledger):'
                      : 'Guided Screen Sensitivity Calibration Ledger:'}
                  </span>
                  <span className="text-cyan-300 font-bold tabular-nums">
                    {isAr ? 'الإجمالي الفعال:' : 'Total Scan Gain:'}{' '}
                    {(gainDb + transferCorrectionDb + (scanningGainActive ? 6 : 0)).toFixed(1)} dB
                  </span>
                </div>

                {/* Live 80% FSH Target Meter */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] tabular-nums">
                    <span className="text-slate-300">
                      {sensitivityReflectorMode === 'edm_notch'
                        ? isAr
                          ? 'عاكس الضبط: حز مرجعي EDM (Corner-Trap)'
                          : 'Target: EDM Reference Notch (Corner-Trap)'
                        : isAr
                        ? `عاكس الضبط: ثقب SDH (${targetBlock === 'v2_iso7963' ? `Ø${v2SdhDiameterMm.toFixed(1)}` : 'Ø1.5'} مم)`
                        : `Target: Reference SDH (${targetBlock === 'v2_iso7963' ? `Ø${v2SdhDiameterMm.toFixed(1)}` : 'Ø1.5'} mm)`}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {primaryEcho ? `${primaryEcho.amplitudeFshPct.toFixed(1)}% FSH` : '0.0% FSH'} / 80% Ref
                    </span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, primaryEcho ? primaryEcho.amplitudeFshPct : 0))}%`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                      style={{ left: '80%' }}
                      title="80% FSH Primary Reference"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 tabular-nums pt-0.5">
                    <span>H_ref (80%): {gainDb.toFixed(1)} dB</span>
                    <span>Transfer: +{transferCorrectionDb.toFixed(1)} dB</span>
                    <span>Scan (+6dB): {scanningGainActive ? 'ARMED' : 'OFF'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playCalibrationSuccessPing();
                      if (primaryEcho && primaryEcho.amplitudeFshPct > 5) {
                        const dbDelta = 20 * Math.log10(80 / primaryEcho.amplitudeFshPct);
                        setGainDb((g) => Number(Math.min(90, Math.max(10, g + dbDelta)).toFixed(1)));
                      } else {
                        setGainDb(48.0);
                      }
                      setRefLevelLocked80Pct(true);
                    }}
                    className={`py-2 px-2 rounded-lg border font-bold cursor-pointer ${
                      refLevelLocked80Pct
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800'
                    }`}
                  >
                    {isAr ? '1) تثبيت 80% FSH' : '1) Lock 80% FSH'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferCorrectionDb((prev) => (prev >= 2 ? 0 : 2.0))}
                    className={`py-2 px-2 rounded-lg border font-bold cursor-pointer tabular-nums ${
                      transferCorrectionDb >= 2
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isAr ? `2) تصحيح السطح +${transferCorrectionDb || 2}dB` : `2) Transfer +${transferCorrectionDb || 2}dB`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setScanningGainActive((v) => !v)}
                    className={`py-2 px-2 rounded-lg border font-bold cursor-pointer tabular-nums ${
                      scanningGainActive
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isAr ? '3) كسب المسح +6dB' : '3) +6dB Scan Gain'}
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 7: ON-WELD PRE-SCAN START-CHECK INTERACTIVE DECK */}
            {activeStepNum === 7 && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span>
                    {isAr
                      ? 'قائمة استارت تشيك اللحام الميدانية (نفّذ البنود الـ 4 عملياً):'
                      : 'On-Weld Pre-Scan Start-Check Execution:'}
                  </span>
                  <span className="tabular-nums">
                    {Object.values(startCheckItems).filter(Boolean).length}/4
                  </span>
                </div>

                {/* Equipment Start-Check Drift Verification Card (V2 / EDM Notch Drift <= ±2 dB & <= ±1 mm) */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="space-y-0.5">
                    <div className="text-cyan-300 font-bold">
                      {isAr
                        ? 'فحص انحراف الجهاز الميداني (Equipment Start-Check Drift):'
                        : 'Equipment Start-Check Drift Gate (Sweep ≤ ±1mm · Gain ≤ ±2dB):'}
                    </div>
                    <div className="text-slate-400 tabular-nums">
                      {isAr
                        ? `السرعة ${instrumentVelocityMs} m/s · الصفر ${instrumentZeroDelayUs.toFixed(2)} µs · الكسب ${(gainDb + transferCorrectionDb + (scanningGainActive ? 6 : 0)).toFixed(1)} dB`
                        : `VS=${instrumentVelocityMs} m/s · Delay=${instrumentZeroDelayUs.toFixed(2)} µs · Scan=${(gainDb + transferCorrectionDb + (scanningGainActive ? 6 : 0)).toFixed(1)} dB`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playCalibrationSuccessPing();
                      setEquipmentDriftChecked(true);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                      equipmentDriftChecked
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-950 text-cyan-300 border-cyan-500/40 hover:bg-slate-800'
                    }`}
                  >
                    {equipmentDriftChecked
                      ? isAr
                        ? '✓ ثبات الجهاز مطابق (±0.0 dB)'
                        : '✓ Drift Verified (0.0 dB)'
                      : isAr
                      ? 'تحقق من ثبات المعايرة (Drift Check)'
                      : 'Run Drift Start-Check'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playCalibrationSuccessPing();
                      setTargetBlock('weld_start_check');
                      setProbeMode('zero_deg');
                      setProbePositionXmm(38);
                      setStartCheckItems((p) => ({ ...p, parentMetal0Deg: true }));
                    }}
                    className={`w-full p-2.5 rounded-lg border text-start cursor-pointer flex items-center justify-between ${
                      startCheckItems.parentMetal0Deg
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>
                      {isAr
                        ? '1. مسح الصاج الأم بمجس 0° (التأكد من سُمك 25مم وعدم وجود تورق)'
                        : '1. Run 0° Parent Metal Lamination & 25mm Thickness Scan'}
                    </span>
                    <span className="font-bold">{startCheckItems.parentMetal0Deg ? '✓ OK' : 'RUN'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playCalibrationSuccessPing();
                      setTargetBlock('weld_start_check');
                      setStartCheckItems((p) => ({ ...p, couplantAndSurface: true }));
                    }}
                    className={`w-full p-2.5 rounded-lg border text-start cursor-pointer flex items-center justify-between ${
                      startCheckItems.couplantAndSurface
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>
                      {isAr
                        ? '2. فحص نظافة حافة اللحام وتوزيع سائل التوصيل (Couplant Check)'
                        : '2. Verify Spatter-Free Scan Zone & Uniform Couplant Wetting'}
                    </span>
                    <span className="font-bold">{startCheckItems.couplantAndSurface ? '✓ OK' : 'CHECK'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playCalibrationSuccessPing();
                      setTargetBlock('weld_start_check');
                      setProbeMode('angle_shear');
                      setBeamDirection('left');
                      const sHalf = Number((weldThicknessMm * Math.tan(trueAngleRad)).toFixed(1));
                      setProbePositionXmm(sHalf);
                      setStartCheckItems((p) => ({ ...p, halfSkipRoot: true }));
                    }}
                    className={`w-full p-2.5 rounded-lg border text-start cursor-pointer flex items-center justify-between tabular-nums ${
                      startCheckItems.halfSkipRoot
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>
                      {isAr
                        ? `3. اختبار نصف القفزة للجذر (S/2 = ${physics.halfSkipWeldMm} مم — Leg I)`
                        : `3. Verify Half-Skip Root Coverage (S/2 = ${physics.halfSkipWeldMm} mm — Leg I)`}
                    </span>
                    <span className="font-bold">{startCheckItems.halfSkipRoot ? '✓ OK' : 'TEST'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playCalibrationSuccessPing();
                      setTargetBlock('weld_start_check');
                      setProbeMode('angle_shear');
                      setBeamDirection('left');
                      const sFull = Number((2 * weldThicknessMm * Math.tan(trueAngleRad)).toFixed(1));
                      setProbePositionXmm(sFull);
                      setStartCheckItems((p) => ({ ...p, fullSkipCap: true }));
                    }}
                    className={`w-full p-2.5 rounded-lg border text-start cursor-pointer flex items-center justify-between tabular-nums ${
                      startCheckItems.fullSkipCap
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>
                      {isAr
                        ? `4. اختبار القفزة الكاملة للكاب (S = ${physics.fullSkipWeldMm} مم — Leg II)`
                        : `4. Verify Full-Skip Crown Coverage (S = ${physics.fullSkipWeldMm} mm — Leg II)`}
                    </span>
                    <span className="font-bold">{startCheckItems.fullSkipCap ? '✓ OK' : 'TEST'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSignOffCalibrationAndLogXp}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'اعتماد شهادة الكالبريشن واستارت تشيك اللحام وتسجيل نقاط الخبرة (+XP)'
                      : 'Sign Off Code Calibration & Weld Start-Check (+XP)'}
                  </span>
                </button>

                {signedOffCertificate && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-400/50 space-y-2 text-[11px] text-emerald-100">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-300">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>
                          {isAr
                            ? `شهادة جاهزية معتمدة #${signedOffCertificate.certId}`
                            : `Signed Calibration Readiness #${signedOffCertificate.certId}`}
                        </span>
                      </span>
                      <span className="text-amber-300 font-black tabular-nums">
                        +{signedOffCertificate.xpEarned} XP ({signedOffCertificate.accuracyPct}%)
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {isAr
                        ? 'تم توثيق المعايرة على بلوكتي V1/V2 واجتياز استارت تشيك اللحام في سجل المحاكاة. الجهاز جاهز الآن لبدء المسح الفعلي لاكتشاف عيوب اللحام.'
                        : 'V1/V2 calibration and on-weld Start-Check logged to Simulation History. Instrument is ready for live weld flaw inspection.'}
                    </p>
                    {onCompleteAndProceedToWeld && (
                      <button
                        type="button"
                        onClick={() =>
                          onCompleteAndProceedToWeld({
                            velocityMs: 3255,
                            zeroDelayUs: 2.35,
                            probeAngleDeg: nominalAngleDeg,
                            gainDb,
                            rangeMm: 125,
                            scanningGainActive: true,
                          })
                        }
                        className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {isAr
                            ? 'ابدأ مسح اللحام الفعلي بهذه الإعدادات المعايرة'
                            : 'Start Live Weld Flaw Scan with Calibrated Settings'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step Navigation & One-Click Guided Calibration Apply */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => applyStepGuidedSetup(activeStepNum, true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAr
                    ? `تطبيق وضبط المرحلة ${activeStepNum} قياسياً`
                    : `Auto-Calibrate Stage ${activeStepNum}`}
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activeStepNum === 1}
                  onClick={() =>
                    applyStepGuidedSetup((activeStepNum - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7, false)
                  }
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 text-xs font-mono cursor-pointer flex items-center gap-1"
                >
                  {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'السابق' : 'Prev'}</span>
                </button>
                <button
                  type="button"
                  disabled={activeStepNum === 7}
                  onClick={() => {
                    if (isCurrentStepLiveValid) markStepVerified(activeStepNum);
                    applyStepGuidedSetup((activeStepNum + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7, false);
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs font-mono cursor-pointer flex items-center gap-1"
                >
                  <span>{isAr ? 'المرحلة التالية' : 'Next Stage'}</span>
                  {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Manual Ultrasonic Instrument Calibration Controls Deck */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>
                  {isAr ? 'مفاتيح معايرة شاشة العمل والجهاز اليدوية' : 'Manual Instrument Screen & Calibration Controls'}
                </span>
              </span>
              <span className="text-slate-400 text-[11px]">{codeRule.shortName}</span>
            </div>

            {/* 1. Screen Working Range (mm) */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>{isAr ? 'مدى شاشة العمل (Screen Range):' : 'Screen Working Range:'}</span>
                <span className="text-cyan-400 font-bold tabular-nums">{screenRangeMm} mm</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[50, 100, 125, 200, 250].map((rng) => (
                  <button
                    key={rng}
                    type="button"
                    onClick={() => {
                      playCalibrationClick();
                      setScreenRangeMm(rng);
                    }}
                    className={`py-1.5 rounded border text-[10.5px] font-bold cursor-pointer tabular-nums ${
                      screenRangeMm === rng
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {rng}mm
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Material Sound Velocity (VL = 5920 / VS = 3255 m/s) */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <label htmlFor="v1v2-velocity-slider">
                  {isAr ? 'سرعة الصوت في المعدن (Velocity):' : 'Material Velocity (V):'}
                </label>
                <span className="text-emerald-400 font-bold tabular-nums">{instrumentVelocityMs} m/s</span>
              </div>
              <input
                id="v1v2-velocity-slider"
                type="range"
                min="2900"
                max="6200"
                step="5"
                value={instrumentVelocityMs}
                onChange={(e) => {
                  playCalibrationClick();
                  setInstrumentVelocityMs(Number(e.target.value));
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setInstrumentVelocityMs(5920);
                  }}
                  className="py-1 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500 text-slate-300 text-[10px] cursor-pointer tabular-nums"
                >
                  {isAr ? 'طولية صلب VL = 5920 m/s' : 'Steel Long. VL = 5920 m/s'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setInstrumentVelocityMs(3255);
                  }}
                  className="py-1 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-300 text-[10px] cursor-pointer tabular-nums"
                >
                  {isAr ? 'قصية صلب VS = 3255 m/s' : 'Steel Shear VS = 3255 m/s'}
                </button>
              </div>
            </div>

            {/* 3. Probe Zero / Wedge Delay (µs) */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <label htmlFor="v1v2-zero-slider">
                  {isAr ? 'صفر المجس / تأخير الويدج (Zero Delay):' : 'Probe Zero / Wedge Delay:'}
                </label>
                <span className="text-amber-300 font-bold tabular-nums">{instrumentZeroDelayUs.toFixed(2)} µs</span>
              </div>
              <input
                id="v1v2-zero-slider"
                type="range"
                min="0"
                max="5.0"
                step="0.05"
                value={instrumentZeroDelayUs}
                onChange={(e) => {
                  playCalibrationClick();
                  setInstrumentZeroDelayUs(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setInstrumentZeroDelayUs(0.6);
                  }}
                  className="py-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-400 text-slate-300 text-[10px] cursor-pointer tabular-nums"
                >
                  {isAr ? 'صفر مجس 0° (0.60 µs)' : '0° Probe Zero (0.60 µs)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playCalibrationClick();
                    setInstrumentZeroDelayUs(2.35);
                  }}
                  className="py-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-400 text-slate-300 text-[10px] cursor-pointer tabular-nums"
                >
                  {isAr ? 'تأخير ويدج زاوي (2.35 µs)' : 'Shear Wedge Delay (2.35 µs)'}
                </button>
              </div>
            </div>

            {/* 4. Receiver Gain (dB) & Damping (50 Ω vs 500 Ω) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>{isAr ? 'الكسب الأساسي (Gain):' : 'Primary Gain:'}</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{gainDb.toFixed(1)} dB</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[-2, -0.5, 0.5, 2].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        playCalibrationClick();
                        setGainDb((g) => Number(Math.min(95, Math.max(5, g + st)).toFixed(1)));
                      }}
                      className="py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-400 text-slate-200 text-[10px] cursor-pointer tabular-nums"
                    >
                      {st > 0 ? `+${st}` : st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-300 mb-1">
                  {isAr ? 'مقاومة التخميد (Damping):' : 'Pulser Damping:'}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setDampingOhms(50)}
                    className={`py-1.5 rounded border text-[10px] font-bold cursor-pointer ${
                      dampingOhms === 50
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    50 Ω (High Res)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDampingOhms(500)}
                    className={`py-1.5 rounded border text-[10px] font-bold cursor-pointer ${
                      dampingOhms === 500
                        ? 'bg-amber-600 text-white border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    500 Ω (Broad)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          COMPLETE V1 & V2 GEOMETRIC SUBDIVISIONS, DIMENSIONS & REFLECTORS ATLAS
         ===================================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isAr
                  ? 'الدليل التفصيلي لتقسيمات وأبعاد وثقوب بلوكتي المعايرة V1 (ISO 2400) و V2 (ISO 7963)'
                  : 'Complete V1 (ISO 2400) & V2 (ISO 7963) Subdivisions, Reflectors & Tolerance Schedule'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'اضغط على أي عيب أو ثقب مرجعي أو قوس لفحص أبعاده المليمترية الدقيقة والغرض الكودي منه على المخطط أعلاه.'
                  : 'Select any machined reference hole, Perspex cylinder, resolution notch, or arc to inspect its exact millimeter tolerances.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDimensionsSchedule((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 hover:text-white cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>
              {showDimensionsSchedule
                ? isAr
                  ? 'طي جدول الأبعاد الكامل'
                  : 'Collapse Dimensions Table'
                : isAr
                ? 'عرض جدول أبعاد V1 & V2 الكامل'
                : 'Expand Full V1 & V2 Dimensions'}
            </span>
          </button>
        </div>

        {/* Highlighted Selected Reflector Inspector */}
        {targetBlock !== 'weld_start_check' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/35 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
            <div className="md:col-span-5 space-y-1.5">
              <div className="text-[11px] font-mono text-cyan-400 font-bold">
                {activeReflectorSpec.codeTag} ·{' '}
                {activeReflectorSpec.blockId === 'v1_iso2400' ? V1_BLOCK_METADATA.standard : V2_BLOCK_METADATA.standard}
              </div>
              <div className="text-sm sm:text-base font-black text-white">
                {formatBilingual(activeReflectorSpec.name, language)}
              </div>
              <div className="text-slate-300 leading-relaxed">
                {formatBilingual(activeReflectorSpec.dimensionsSummary, language)}
              </div>
            </div>
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400">{isAr ? 'الإحداثيات والأبعاد الدقيقة:' : 'Exact Machined Location:'}</div>
                <div className="text-slate-200 leading-relaxed">
                  {formatBilingual(activeReflectorSpec.exactLocationMm, language)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400">{isAr ? 'المسارات الصوتية والسماحية:' : 'Sound Paths & ISO Tolerance:'}</div>
                <div className="text-amber-300 font-bold tabular-nums">{activeReflectorSpec.expectedSoundPathsMm}</div>
                <div className="text-emerald-300">{formatBilingual(activeReflectorSpec.isoTolerance, language)}</div>
              </div>
              <div className="sm:col-span-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-cyan-400 font-bold">
                  {isAr ? 'الوظيفة في الكالبريشن: ' : 'Calibration Purpose: '}
                </span>
                <span className="text-slate-200">
                  {formatBilingual(activeReflectorSpec.calibrationPurpose, language)}
                </span>
              </div>
            </div>
          </div>
        )}

        {showDimensionsSchedule && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* V1 Block Complete Schedule */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-bold">{V1_BLOCK_METADATA.standard}</div>
                  <h4 className="text-sm font-black text-white">
                    {isAr
                      ? 'بلوكة المعايرة القياسية V1 — الأبعاد الكاملة: 300 × 100 × 25 مم (5.55 كجم)'
                      : 'Block V1 (IIW Type 1) — Overall: 300 × 100 × 25 mm (5.55 kg)'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetBlock('v1_iso2400')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono cursor-pointer"
                >
                  {isAr ? 'اعرض V1 على المحاكي' : 'Load V1'}
                </button>
              </div>

              <div className="space-y-2">
                {V1_BLOCK_REFLECTORS.map((ref) => (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() => {
                      setTargetBlock('v1_iso2400');
                      setSelectedReflectorId(ref.id);
                    }}
                    className={`w-full text-start p-3 rounded-lg border transition cursor-pointer space-y-1 ${
                      targetBlock === 'v1_iso2400' && selectedReflectorId === ref.id
                        ? 'bg-cyan-950/40 border-cyan-400 text-white'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white">{formatBilingual(ref.name, language)}</span>
                      <span className="font-mono text-[10.5px] text-cyan-300 shrink-0 tabular-nums">{ref.codeTag}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {formatBilingual(ref.dimensionsSummary, language)}
                    </div>
                    <div className="text-[10.5px] font-mono text-amber-300 tabular-nums">
                      {isAr ? 'المسارات الصوتية:' : 'Sound Paths:'} {ref.expectedSoundPathsMm}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* V2 Block Complete Schedule */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-amber-400 font-bold">{V2_BLOCK_METADATA.standard}</div>
                  <h4 className="text-sm font-black text-white">
                    {isAr
                      ? 'بلوكة المعايرة الميدانية المصغرة V2 — الأبعاد: 75 × 43 × 12.5 / 20 مم'
                      : 'Block V2 (IIW Type 2 Miniature) — Overall: 75 × 43 × 12.5 / 20 mm'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetBlock('v2_iso7963')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono cursor-pointer"
                >
                  {isAr ? 'اعرض V2 على المحاكي' : 'Load V2'}
                </button>
              </div>

              <div className="space-y-2">
                {V2_BLOCK_REFLECTORS.map((ref) => (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() => {
                      setTargetBlock('v2_iso7963');
                      setSelectedReflectorId(ref.id);
                    }}
                    className={`w-full text-start p-3 rounded-lg border transition cursor-pointer space-y-1 ${
                      targetBlock === 'v2_iso7963' && selectedReflectorId === ref.id
                        ? 'bg-amber-950/40 border-amber-400 text-white'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white">{formatBilingual(ref.name, language)}</span>
                      <span className="font-mono text-[10.5px] text-amber-300 shrink-0 tabular-nums">{ref.codeTag}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {formatBilingual(ref.dimensionsSummary, language)}
                    </div>
                    <div className="text-[10.5px] font-mono text-cyan-300 tabular-nums">
                      {isAr ? 'المسارات الصوتية:' : 'Sound Paths:'} {ref.expectedSoundPathsMm}
                    </div>
                  </button>
                ))}

                {/* Governing Code Start-Check Summary Card */}
                <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-500/30 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4" />
                      <span>{codeRule.startCheckClause}</span>
                    </span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-slate-200 text-[11.5px] leading-relaxed">
                    {formatBilingual(codeRule.startCheckSummary, language)}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    {formatBilingual(codeRule.transferCorrectionNote, language)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
