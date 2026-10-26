import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../../types';
import { VirtualSignaturePad } from './VirtualSignaturePad';
import { DacCalibrationBuilder } from './DacCalibrationBuilder';
import { V1V2CalibrationLab } from './V1V2CalibrationLab';
import { BeamConeAndDefectExplorer } from './BeamConeAndDefectExplorer';
import { NdtAudioControlChip } from './NdtAudioControlChip';
import {
  playCalibrationClick,
  playCalibrationSuccessPing,
  playDefectDetectedPing,
} from '../../../utils/ndtAudioFeedback';
import {
  DefectToleranceModal,
  DefectToleranceTooltip,
  DefectToleranceTriggerBar,
} from './DefectToleranceAlertSystem';
import { generateWeldInspectionPdf } from '../../../utils/weldInspectionPdfGenerator';
import {
  ALL_WELD_DEFECTS_CATALOG,
  ComprehensiveDefectSpec,
  DefectFamily,
  ExtendedWeldFlawId,
  INSPECTION_CODES_META,
  computeUltrasonicBeamCone,
  drawComprehensiveDefectMorphology,
  drawUltrasonicBeamCone2D,
  getAllDefectsCodeToleranceSchedule,
  getDefectCodeTolerance,
} from '../../../data/utWeldDefectsCatalog';
import { gradeAndRecordWorkshopAttempt } from '../../../utils/workshopTrainingResultsStore';
import {
  renderModernPautSectorialScan,
  WeldGrooveType,
} from '../../../utils/pautWeldOverlayRenderer';
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Cpu,
  Crosshair,
  Download,
  Eye,
  FileCheck,
  FileText,
  Info,
  Layers,
  Pause,
  Play,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Target,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';

interface ComprehensiveWeldUtSimulatorProps {
  language: Language;
}

export type InspectionCode = 'asme_viii' | 'asme_b31_3' | 'aws_d1_1' | 'api_1104' | 'iso_11666';
export type SpecimenGeometry = 'flat' | 'curved';
export type InstrumentMode = 'ut' | 'paut';
export type WeldFlawType = ExtendedWeldFlawId;

export const ComprehensiveWeldUtSimulator: React.FC<ComprehensiveWeldUtSimulatorProps> = ({ language }) => {
  const isAr = language === 'ar';

  // --- Active Workshop Step ---
  const [activeStep, setActiveStep] = useState<
    'scan_inspect' | 'calibration' | 'code_eval' | 'report' | 'beam_cone_atlas'
  >('scan_inspect');

  // --- Instrument Mode (UT Conventional vs PAUT Phased Array) & Specimen Geometry (Flat vs Curved Pipe) ---
  const [instrumentMode, setInstrumentMode] = useState<InstrumentMode>('ut');
  const [specimenGeometry, setSpecimenGeometry] = useState<SpecimenGeometry>('flat');
  const [pipeOuterDiameterMm, setPipeOuterDiameterMm] = useState<number>(219); // 8" NPS standard pipe OD (114, 168, 219, 324)

  // --- Weld Joint & Complete 16-Defect Catalog Parameters ---
  const [plateThicknessMm, setPlateThicknessMm] = useState<number>(25); // 15, 20, 25, 30 mm
  const [capWidthMm] = useState<number>(18);
  const [defectFamilyFilter, setDefectFamilyFilter] = useState<'all' | DefectFamily>('all');
  const [selectedFlawId, setSelectedFlawId] = useState<WeldFlawType>('root_crack');
  const currentFlaw: ComprehensiveDefectSpec =
    ALL_WELD_DEFECTS_CATALOG.find((f) => f.id === selectedFlawId) || ALL_WELD_DEFECTS_CATALOG[0];
  const filteredFlaws =
    defectFamilyFilter === 'all'
      ? ALL_WELD_DEFECTS_CATALOG
      : ALL_WELD_DEFECTS_CATALOG.filter((f) => f.family === defectFamilyFilter);
  const flawNominalDepthMm = Number((currentFlaw.nominalDepthRatio * plateThicknessMm).toFixed(1));

  // --- Beam Cone ("كوم الأشعة") & Near-Field (Fresnel) Live Controls ---
  const [showBeamConeOverlay, setShowBeamConeOverlay] = useState<boolean>(true);
  const [showNearFieldAndWavefronts, setShowNearFieldAndWavefronts] = useState<boolean>(true);
  const [crystalDiameterMm, setCrystalDiameterMm] = useState<number>(10);
  const [wedgeTravelMm, setWedgeTravelMm] = useState<number>(10);
  const [showQuickToleranceMatrix, setShowQuickToleranceMatrix] = useState<boolean>(false);
  const [isToleranceModalOpen, setIsToleranceModalOpen] = useState<boolean>(false);
  const [autoAlertOnDefectSelect, setAutoAlertOnDefectSelect] = useState<boolean>(true);

  // --- Trainee Verdict & Training Results Log Feedback ---
  const [traineeDisposition, setTraineeDisposition] = useState<'REJECT' | 'ACCEPT'>('REJECT');
  const [lastLoggedScoreToast, setLastLoggedScoreToast] = useState<string | null>(null);

  // --- Probe Scanning Position (X Standoff + Y Weld Axis + Auto Raster) ---
  const [probeIndexXmm, setProbeIndexXmm] = useState<number>(42); // Standoff from weld center (10..80 mm)
  const [probeSeamYmm, setProbeSeamYmm] = useState<number>(50); // Position along weld seam (0..100 mm)
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(false);
  const [isDraggingProbe, setIsDraggingProbe] = useState<boolean>(false);

  // --- Complete Conventional UT Hardware Parameters ---
  const [probeAngleDeg, setProbeAngleDeg] = useState<number>(60); // 0, 45, 60, 70°
  const [probeFrequencyMhz, setProbeFrequencyMhz] = useState<number>(4.0); // 2.0, 4.0, 5.0 MHz
  const [velocityMs, setVelocityMs] = useState<number>(3240); // Shear 3240 m/s, Long 5920 m/s
  const [zeroDelayUs, setZeroDelayUs] = useState<number>(1.25); // Probe/wedge zero delay (µs)
  const [gainDb, setGainDb] = useState<number>(48.0); // Receiver Gain (dB)
  const [rangeMm, setRangeMm] = useState<number>(100); // Timebase range (50..250 mm)
  const [displayDelayMm, setDisplayDelayMm] = useState<number>(0); // Display delay (0..50 mm)
  const [rectification, setRectification] = useState<'full' | 'positive' | 'negative' | 'rf'>('full');
  const [damping, setDamping] = useState<'50_ohm' | '500_ohm'>('50_ohm');
  const [pulserVoltageV, setPulserVoltageV] = useState<100 | 200 | 400>(200);
  const [bandpassFilter, setBandpassFilter] = useState<'broadband' | '2mhz' | '4mhz' | '5mhz'>('broadband');
  const [prfHz, setPrfHz] = useState<100 | 250 | 500 | 1000>(500);
  const [rejectPct, setRejectPct] = useState<number>(0); // 0..30% linear reject

  // --- Dual Gates, Peak Envelope & Freeze ---
  const [activeGateEdit, setActiveGateEdit] = useState<'A' | 'B'>('A');
  const [gateAStartMm, setGateAStartMm] = useState<number>(35);
  const [gateAWidthMm, setGateAWidthMm] = useState<number>(40);
  const [gateAThresholdPct, setGateAThresholdPct] = useState<number>(40);
  const [gateBStartMm, setGateBStartMm] = useState<number>(75);
  const [gateBWidthMm, setGateBWidthMm] = useState<number>(25);
  const [gateBThresholdPct, setGateBThresholdPct] = useState<number>(30);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isPeakHoldActive, setIsPeakHoldActive] = useState<boolean>(false);
  const [peakEnvelope, setPeakEnvelope] = useState<number[]>([]);
  const [isAlarmMuted, setIsAlarmMuted] = useState<boolean>(false);
  const [isScanningGainActive, setIsScanningGainActive] = useState<boolean>(false); // +6 dB scan

  // --- DAC / TCG Curve State ---
  const [isDacEnabled, setIsDacEnabled] = useState<boolean>(true);
  const [dacPoints, setDacPoints] = useState<Array<{ soundPathMm: number; amplitudePct: number }>>([
    { soundPathMm: 22, amplitudePct: 80 },
    { soundPathMm: 48, amplitudePct: 62 },
    { soundPathMm: 78, amplitudePct: 44 },
  ]);

  // --- Complete PAUT Hardware & Focal Law Parameters ---
  const [pautApertureElements, setPautApertureElements] = useState<16 | 32 | 64>(32);
  const [pautStartElement, setPautStartElement] = useState<number>(1);
  const [pautElementPitchMm, setPautElementPitchMm] = useState<number>(0.6);
  const [pautSweepMode, setPautSweepMode] = useState<'sectorial' | 'linear'>('sectorial');
  const [pautMinAngleDeg] = useState<number>(35);
  const [pautMaxAngleDeg] = useState<number>(75);
  const [pautCursorAngleDeg, setPautCursorAngleDeg] = useState<number>(60);
  const [pautFocalDepthMm, setPautFocalDepthMm] = useState<number>(20);
  const [pautTcgEqualized, setPautTcgEqualized] = useState<boolean>(true);
  const [pautWeldOverlayVisible, setPautWeldOverlayVisible] = useState<boolean>(true);
  const [pautShowSkipMirror, setPautShowSkipMirror] = useState<boolean>(true);
  const [pautGrooveType, setPautGrooveType] = useState<WeldGrooveType>('single_v');
  const [pautBevelAngleDeg, setPautBevelAngleDeg] = useState<number>(30);
  const [caliperU1Mm, setCaliperU1Mm] = useState<number>(21.0);
  const [caliperU2Mm, setCaliperU2Mm] = useState<number>(24.5);

  // --- Interactive Calibration Training Simulator State ---
  const [activeCalBlock, setActiveCalBlock] = useState<'asme_basic' | 'iiw_v1' | 'iiw_v2' | 'curved_pipe_block'>('iiw_v1');
  const [calTargetSpot, setCalTargetSpot] = useState<'r100_arc' | 'thk_25' | 'sdh_angle' | 'sdh_dac_1' | 'sdh_dac_2' | 'sdh_dac_3'>('r100_arc');
  const [calCompletedSteps, setCalCompletedSteps] = useState<number[]>([1]);
  const [isAutoCalDone, setIsAutoCalDone] = useState<boolean>(false);

  // --- Interactive Flaw Sizing (-6 dB Drop Length & Height) & Code Evaluation ---
  const [selectedCode, setSelectedCode] = useState<InspectionCode>('asme_viii');
  const [drop6dBY1, setDrop6dBY1] = useState<number | null>(null);
  const [drop6dBY2, setDrop6dBY2] = useState<number | null>(null);
  const [measuredFlawLengthMm, setMeasuredFlawLengthMm] = useState<number>(14.0);
  const [measuredFlawHeightMm, setMeasuredFlawHeightMm] = useState<number>(3.5);

  // --- PDF Report & Virtual Signature State ---
  const [inspectorName, setInspectorName] = useState<string>('Eng. Ahmed M.');
  const [inspectorLevel, setInspectorLevel] = useState<'Level II' | 'Level III'>('Level II');
  const [inspectorCertNumber, setInspectorCertNumber] = useState<string>('UT-PAUT-20419');
  const [clientName, setClientName] = useState<string>('Egyptian Refining Co. (ERC)');
  const [weldJointId, setWeldJointId] = useState<string>('WJ-104-CS-25MM');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [pdfDownloadSuccess, setPdfDownloadSuccess] = useState<boolean>(false);

  // Canvas References
  const weldCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pautSScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pautCScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const calBlockCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync default sizing values when switching target flaw
  useEffect(() => {
    setMeasuredFlawLengthMm(currentFlaw.lengthMm);
    setMeasuredFlawHeightMm(currentFlaw.heightMm);
    setProbeSeamYmm(currentFlaw.centerYmm);
    setTraineeDisposition(currentFlaw.defaultAsmeVerdict);
    const dNom = Number((currentFlaw.nominalDepthRatio * plateThicknessMm).toFixed(1));
    setCaliperU1Mm(Math.max(0, Number((dNom - currentFlaw.heightMm).toFixed(1))));
    setCaliperU2Mm(dNom);
    setDrop6dBY1(null);
    setDrop6dBY2(null);
  }, [selectedFlawId, plateThicknessMm, currentFlaw.lengthMm, currentFlaw.heightMm, currentFlaw.centerYmm, currentFlaw.nominalDepthRatio, currentFlaw.defaultAsmeVerdict]);

  // Auto-Raster Zigzag Scanner Effect
  useEffect(() => {
    if (!isAutoScanning || isFrozen) return;
    const timer = setInterval(() => {
      setProbeSeamYmm((prevY) => {
        const nextY = prevY + 2;
        if (nextY > 90) return 10;
        return nextY;
      });
      setProbeIndexXmm((prevX) => {
        const t = Date.now() / 650;
        return Number((38 + Math.sin(t) * 20).toFixed(1));
      });
    }, 90);
    return () => clearInterval(timer);
  }, [isAutoScanning, isFrozen]);

  // ---------------------------------------------------------------------------
  // Acoustic Physics, Beam Cone ("كوم الأشعة") & Flat vs Curved Pipe Ray Tracing Engine
  // ---------------------------------------------------------------------------
  const effectiveBeamAngleDeg = instrumentMode === 'paut' ? pautCursorAngleDeg : probeAngleDeg;
  const isStraightZeroBeam = effectiveBeamAngleDeg === 0;
  const angleRad = (effectiveBeamAngleDeg * Math.PI) / 180;
  const sinTheta = Math.sin(angleRad);
  const cosTheta = Math.max(0.08, Math.cos(angleRad));
  const tanTheta = isStraightZeroBeam ? 0 : Math.sin(angleRad) / cosTheta;

  const beamConeMetrics = computeUltrasonicBeamCone({
    frequencyMhz: probeFrequencyMhz,
    velocityMs,
    crystalDiameterMm,
    isPaut: instrumentMode === 'paut',
    pautApertureElements,
    pautPitchMm: pautElementPitchMm,
    pautFocalDepthMm,
    wedgeTravelMm: isStraightZeroBeam ? 0 : wedgeTravelMm,
    wedgeVelocityMs: 2330,
  });

  // Curvature Correction Factor for Curved Pipe (ASME Sec V Art. 4)
  const outerRadiusMm = pipeOuterDiameterMm / 2;
  const innerRadiusMm = Math.max(20, outerRadiusMm - plateThicknessMm);

  // Flat skip distances
  const flatHalfSkipMm = isStraightZeroBeam ? 0 : plateThicknessMm * tanTheta;
  const flatFullSkipMm = isStraightZeroBeam ? 0 : 2 * plateThicknessMm * tanTheta;

  // Curved pipe skip distance along outer circumference (law of sines in pipe wall)
  const sinAlphaId = Math.min(0.995, (outerRadiusMm / innerRadiusMm) * sinTheta);
  const alphaIdRad = Math.asin(sinAlphaId);
  const centralAngleHalfSkipRad = isStraightZeroBeam ? 0 : Math.max(0.01, alphaIdRad - angleRad);
  const curvedHalfSkipArcMm = outerRadiusMm * centralAngleHalfSkipRad;
  const curvedFullSkipArcMm = 2 * curvedHalfSkipArcMm;

  const halfSkipSurfaceMm = specimenGeometry === 'curved' ? curvedHalfSkipArcMm : flatHalfSkipMm;
  const fullSkipSurfaceMm = specimenGeometry === 'curved' ? curvedFullSkipArcMm : flatFullSkipMm;

  // Ray-Flaw Impingement Math (X cross-section + Y longitudinal weld axis)
  const flawX =
    currentFlaw.id === 'base_lamination'
      ? Math.abs(currentFlaw.distanceFromWeldCenterMm)
      : currentFlaw.distanceFromWeldCenterMm;
  const rayXLeg1AtFlawDepth =
    specimenGeometry === 'curved'
      ? probeIndexXmm - flawNominalDepthMm * tanTheta * (1 + flawNominalDepthMm / (2 * outerRadiusMm))
      : probeIndexXmm - flawNominalDepthMm * tanTheta;

  const rayXLeg2AtFlawDepth = isStraightZeroBeam
    ? 999
    : probeIndexXmm - halfSkipSurfaceMm - (plateThicknessMm - flawNominalDepthMm) * tanTheta;

  const distToFlawLeg1 = Math.abs(rayXLeg1AtFlawDepth - flawX);
  const distToFlawLeg2 = Math.abs(rayXLeg2AtFlawDepth - flawX);
  const approxPathToFlawMm = flawNominalDepthMm / cosTheta;
  const beamHalfWidthAtDepthMm = Math.max(
    3.5,
    beamConeMetrics.width6dBAtDepthMm(approxPathToFlawMm) * 0.65 + (instrumentMode === 'paut' ? 2.2 : 1.2)
  );

  // Y-axis longitudinal coverage factor ( enables authentic -6 dB drop sizing along Y! )
  const halfLen = Math.max(1.5, currentFlaw.lengthMm / 2);
  const yOffsetFromCenter = Math.abs(probeSeamYmm - currentFlaw.centerYmm);
  const longitudinalFactor = Math.exp(-Math.LN2 * Math.pow(yOffsetFromCenter / halfLen, 2.4));

  let isCrossSectionHit = false;
  let activeLeg = 1;
  let transverseOffsetMm = 0;

  if (distToFlawLeg1 <= beamHalfWidthAtDepthMm) {
    isCrossSectionHit = true;
    activeLeg = 1;
    transverseOffsetMm = distToFlawLeg1;
  } else if (!isStraightZeroBeam && distToFlawLeg2 <= beamHalfWidthAtDepthMm) {
    isCrossSectionHit = true;
    activeLeg = 2;
    transverseOffsetMm = distToFlawLeg2;
  }

  const isHit = isCrossSectionHit && longitudinalFactor >= 0.15;

  // Sound path & true depth calculation (incorporating velocity calibration accuracy & curved geometry)
  const nominalRefVelocity = isStraightZeroBeam ? 5920 : 3240;
  const velocityRatio = velocityMs / nominalRefVelocity;
  const zeroOffsetMm = (zeroDelayUs - 1.25) * (nominalRefVelocity / 1000);

  const geometricSoundPathMm = isHit
    ? activeLeg === 1
      ? flawNominalDepthMm / cosTheta
      : (2 * plateThicknessMm - flawNominalDepthMm) / cosTheta
    : 0;

  const calculatedSoundPathMm = isHit
    ? Math.max(1, geometricSoundPathMm * velocityRatio + zeroOffsetMm)
    : 0;

  // Curved vs Flat Depth Equation: D_curved = Ro - sqrt(Ro^2 + S^2 - 2*Ro*S*cos(theta))
  const flatCalculatedDepthMm = isHit
    ? activeLeg === 1
      ? calculatedSoundPathMm * cosTheta
      : Math.max(0, 2 * plateThicknessMm - calculatedSoundPathMm * cosTheta)
    : flawNominalDepthMm;

  const curvedCalculatedDepthMm = isHit
    ? Math.max(
        0.5,
        outerRadiusMm -
          Math.sqrt(
            Math.max(
              1,
              outerRadiusMm * outerRadiusMm +
                calculatedSoundPathMm * calculatedSoundPathMm -
                2 * outerRadiusMm * calculatedSoundPathMm * cosTheta
            )
          )
      )
    : flawNominalDepthMm;

  const calculatedDepthMm = specimenGeometry === 'curved' ? curvedCalculatedDepthMm : flatCalculatedDepthMm;
  const calculatedSurfaceDistMm = isHit ? calculatedSoundPathMm * sinTheta : Math.abs(flawX);

  // Echo Amplitude (% FSH) factoring Gain, Pulser Voltage, Damping, Angle, Transverse & Y-Longitudinal profile, Reject
  let echoAmplitudePct = 0;
  if (isHit) {
    const angleDiff = Math.abs(effectiveBeamAngleDeg - currentFlaw.optimalAngleDeg);
    const angleTolerance = currentFlaw.category === 'Planar' ? 22 : 42;
    const angleEfficiency =
      instrumentMode === 'paut'
        ? Math.max(0.45, 1 - angleDiff / (angleTolerance * 1.4))
        : Math.max(0.2, 1 - angleDiff / angleTolerance);

    const transverseFactor = Math.exp(-Math.pow(transverseOffsetMm / (beamHalfWidthAtDepthMm * 0.85), 2));
    const voltageBoost = pulserVoltageV === 400 ? 1.18 : pulserVoltageV === 200 ? 1.0 : 0.82;
    const dampingBoost = damping === '500_ohm' ? 1.12 : 1.0;
    const tcgBoost = instrumentMode === 'paut' && pautTcgEqualized ? 1.12 : 1.0;

    const effectiveGain = gainDb + (isScanningGainActive ? 6 : 0);
    const gainFactor = Math.pow(10, (effectiveGain - 45) / 20);

    const rawAmp =
      82 *
      currentFlaw.reflectivityFactor *
      angleEfficiency *
      transverseFactor *
      longitudinalFactor *
      voltageBoost *
      dampingBoost *
      tcgBoost *
      gainFactor;

    const afterReject = rawAmp < rejectPct ? 0 : rawAmp;
    echoAmplitudePct = Math.min(100, Math.max(0, Math.round(afterReject)));
  }

  // PAUT Element Nanosecond Firing Delays (Focal Law)
  const elementDelaysNs: number[] = [];
  const halfAperture = (pautApertureElements - 1) / 2;
  const focalDistM = Math.max(0.005, pautFocalDepthMm / 1000);
  for (let i = 0; i < pautApertureElements; i++) {
    const xElemM = (i - halfAperture) * (pautElementPitchMm / 1000);
    const steerSec = (xElemM * sinTheta) / 3240;
    const focusSec = (xElemM * xElemM * cosTheta * cosTheta) / (2 * focalDistM * 3240);
    elementDelaysNs.push(Math.max(0, Math.round((steerSec + focusSec + 4e-6) * 1e9)));
  }
  const maxDelayNs = Math.max(...elementDelaysNs, 1);

  // Gate A Alarm Status & Acoustic Defect Detection Ping
  const isEchoInGateA =
    isHit &&
    calculatedSoundPathMm >= gateAStartMm &&
    calculatedSoundPathMm <= gateAStartMm + gateAWidthMm;
  const isAlarmTriggered = isEchoInGateA && echoAmplitudePct >= gateAThresholdPct && !isAlarmMuted;
  const prevAlarmTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (isAlarmTriggered && !prevAlarmTriggeredRef.current) {
      playDefectDetectedPing(currentFlaw.category === 'Planar' ? 'Critical' : 'High');
    }
    prevAlarmTriggeredRef.current = isAlarmTriggered;
  }, [isAlarmTriggered, currentFlaw.category]);

  // Evaluate % DAC at current sound path
  const interpolatedDacRefPct = (() => {
    if (dacPoints.length === 0 || calculatedSoundPathMm <= 0) return 80;
    if (calculatedSoundPathMm <= dacPoints[0].soundPathMm) return dacPoints[0].amplitudePct;
    const last = dacPoints[dacPoints.length - 1];
    if (calculatedSoundPathMm >= last.soundPathMm) return last.amplitudePct;
    for (let i = 0; i < dacPoints.length - 1; i++) {
      const p1 = dacPoints[i];
      const p2 = dacPoints[i + 1];
      if (calculatedSoundPathMm >= p1.soundPathMm && calculatedSoundPathMm <= p2.soundPathMm) {
        const t = (calculatedSoundPathMm - p1.soundPathMm) / Math.max(1, p2.soundPathMm - p1.soundPathMm);
        return p1.amplitudePct + t * (p2.amplitudePct - p1.amplitudePct);
      }
    }
    return 60;
  })();

  const pctOfDac = isHit ? Math.round((echoAmplitudePct / Math.max(10, interpolatedDacRefPct)) * 100) : 0;

  // ---------------------------------------------------------------------------
  // Near-Field Zone Assessment & Per-Defect Multi-Code Allowable Tolerance Engine
  // ---------------------------------------------------------------------------
  const activeReflectorPathMm =
    isHit && calculatedSoundPathMm > 0
      ? calculatedSoundPathMm
      : Math.max(2, flawNominalDepthMm / cosTheta);
  const nearFieldAssessment = beamConeMetrics.evaluateNearFieldZone(activeReflectorPathMm);

  const awsAttenuationCMm = Math.max(0, 2 * (Math.max(25.4, activeReflectorPathMm) / 25.4 - 1));
  const awsDRatingDb = Number((gainDb - 42.0 - awsAttenuationCMm).toFixed(1));
  const effectiveMeasuredHeightMm =
    instrumentMode === 'paut' ? Number(Math.abs(caliperU2Mm - caliperU1Mm).toFixed(1)) : measuredFlawHeightMm;

  const evaluateAgainstCode = (code: InspectionCode) => {
    const tol = getDefectCodeTolerance(currentFlaw.id, code, plateThicknessMm, {
      lengthMm: measuredFlawLengthMm,
      heightMm: effectiveMeasuredHeightMm,
      awsDRatingDb,
      pctDac: pctOfDac > 0 ? pctOfDac : undefined,
    });
    return {
      reject: tol.reject,
      citation: tol.codeCitation,
      clauseRef: tol.clauseRef,
      limitText: tol.toleranceBadge[language],
      tolerance: tol,
      explanation: tol.evaluationExplanation[language],
    };
  };

  const activeEval = evaluateAgainstCode(selectedCode);
  const activeTolerance = activeEval.tolerance;
  const allDefectsToleranceSchedule = getAllDefectsCodeToleranceSchedule(selectedCode, plateThicknessMm);
  const activeCodeMeta =
    INSPECTION_CODES_META.find((c) => c.id === selectedCode) || INSPECTION_CODES_META[0];
  const isCodeReject = activeEval.reject;
  const codeClauseCitation = activeEval.citation;
  const codeExplanation = activeEval.explanation;

  // Interactive Pointer Dragging on Weld Cross-Section Canvas
  const updateProbeFromCanvasPointer = (clientX: number) => {
    const canvas = weldCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (clientX - rect.left) / Math.max(1, rect.width);
    const canvasX = relX * canvas.width;
    const originX = canvas.width / 2;
    const scale = Math.min((canvas.width * 0.82) / 150, (canvas.height * 0.68) / 38);
    const newXmm = Math.min(80, Math.max(10, Number(((canvasX - originX) / scale).toFixed(1))));
    setProbeIndexXmm(newXmm);
  };

  // Capture -6 dB Drop Endpoints
  const handleRecord6dBStart = () => {
    setDrop6dBY1(probeSeamYmm);
    if (drop6dBY2 !== null) {
      setMeasuredFlawLengthMm(Math.max(1, Number(Math.abs(drop6dBY2 - probeSeamYmm).toFixed(1))));
    }
  };

  const handleRecord6dBEnd = () => {
    setDrop6dBY2(probeSeamYmm);
    if (drop6dBY1 !== null) {
      setMeasuredFlawLengthMm(Math.max(1, Number(Math.abs(probeSeamYmm - drop6dBY1).toFixed(1))));
    }
  };

  // Export Official PDF Report
  const handleDownloadPdfReport = () => {
    const doc = generateWeldInspectionPdf({
      reportNumber: 'INSCO-UT-2026-0428',
      inspectionDate: '2026-10-24',
      clientName,
      facility: specimenGeometry === 'curved' ? `Process Pipe Spool (OD ${pipeOuterDiameterMm}mm)` : 'Pressure Vessel Shell Workshop',
      weldJointId,
      inspectorName,
      inspectorLevel,
      inspectorCertNumber,
      selectedCode,
      codeClauseCitation,
      materialSpecification: 'ASME SA-516 Gr.70 / API 5L X65 Carbon Steel',
      plateThicknessMm,
      specimenGeometry,
      pipeOuterDiameterMm,
      instrumentMode,
      jointType: 'Single-V Butt Weld (60° Included Angle)',
      probeModel: instrumentMode === 'paut' ? 'Olympus OmniScan X3 (5L64-A12)' : 'Krautkramer USM 35X Digital UT',
      probeAngleDeg: effectiveBeamAngleDeg,
      probeFrequencyMhz,
      velocityMs,
      zeroDelayUs,
      gainDb,
      calBlockUsed:
        activeCalBlock === 'iiw_v1'
          ? 'IIW Type 1 (V1 - ISO 2400)'
          : activeCalBlock === 'iiw_v2'
          ? 'IIW Type 2 (V2 - ISO 7963)'
          : activeCalBlock === 'curved_pipe_block'
          ? `Curved Pipe ASME Reference Ring (OD ${pipeOuterDiameterMm}mm)`
          : 'ASME Sec V Basic SDH Calibration Block',
      pautApertureElements,
      pautFocalDepthMm,
      flawName: currentFlaw.name.en,
      flawCategory: currentFlaw.category,
      soundPathMm: calculatedSoundPathMm > 0 ? calculatedSoundPathMm : flawNominalDepthMm / cosTheta,
      trueDepthMm: calculatedDepthMm,
      surfaceDistMm: calculatedSurfaceDistMm,
      flawLengthMm: measuredFlawLengthMm,
      flawHeightMm: instrumentMode === 'paut' ? Math.abs(caliperU2Mm - caliperU1Mm) : measuredFlawHeightMm,
      echoAmplitudePct: echoAmplitudePct > 0 ? echoAmplitudePct : Math.round(currentFlaw.reflectivityFactor * 82),
      isReject: isCodeReject,
      codeExplanation,
      signatureDataUrl,
      language,
    });
    doc.save(`INSCO_${instrumentMode.toUpperCase()}_Inspection_Report_${weldJointId}.pdf`);
    setPdfDownloadSuccess(true);
  };

  // Log Trainee Inspection Result to Persistent Workshop Scorecard Below
  const handleLogAttemptToTrainingResults = () => {
    const rec = gradeAndRecordWorkshopAttempt({
      instrument: instrumentMode === 'paut' ? 'PAUT' : 'UT',
      deviceModel:
        instrumentMode === 'paut'
          ? `Olympus OmniScan X3 (${pautApertureElements}E · ${pautCursorAngleDeg}°)`
          : `Krautkrämer USM 35X (${probeAngleDeg}° · ${probeFrequencyMhz}MHz)`,
      specimenGeometry,
      defectId: currentFlaw.id,
      defectNameAr: currentFlaw.name.ar,
      defectNameEn: currentFlaw.name.en,
      actualDepthMm: flawNominalDepthMm,
      measuredDepthMm: isHit ? calculatedDepthMm : flawNominalDepthMm,
      actualLengthMm: currentFlaw.lengthMm,
      measuredLengthMm: measuredFlawLengthMm,
      echoAmplitudePct: echoAmplitudePct > 0 ? echoAmplitudePct : Math.round(currentFlaw.reflectivityFactor * 78),
      codeStandard: codeClauseCitation,
      traineeVerdict: traineeDisposition,
      actualCodeVerdict: isCodeReject ? 'REJECT' : 'ACCEPT',
      isBlindChallenge: false,
    });
    setLastLoggedScoreToast(
      isAr
        ? `تم تسجيل الفحص في لوحة النتائج التدريبية بالأسفل — الدرجة: ${rec.scorePct}%`
        : `Logged to Training Results below — Score: ${rec.scorePct}%`
    );
  };

  // ---------------------------------------------------------------------------
  // 1. Render Weld Cross-Section (Flat Plate OR Curved Pipe) & Acoustic Beam Cone
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = weldCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, width, height);

    const originX = width / 2;
    const scale = Math.min((width * 0.82) / 150, (height * 0.68) / 38);

    if (specimenGeometry === 'flat') {
      // ==================== FLAT PLATE BUTT WELD GEOMETRY ====================
      const originY = 58;
      const plateThicknessPx = plateThicknessMm * scale;
      const bottomY = originY + plateThicknessPx;
      const halfPlateWidthPx = 70 * scale;

      // Base Metal Plates
      ctx.fillStyle = '#131a33';
      ctx.strokeStyle = '#2b3b6b';
      ctx.lineWidth = 1.5;

      // Left Plate
      ctx.beginPath();
      ctx.moveTo(originX - halfPlateWidthPx, originY);
      ctx.lineTo(originX - (capWidthMm / 2) * scale, originY);
      ctx.lineTo(originX - 1.5 * scale, bottomY);
      ctx.lineTo(originX - halfPlateWidthPx, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Plate
      ctx.beginPath();
      ctx.moveTo(originX + halfPlateWidthPx, originY);
      ctx.lineTo(originX + (capWidthMm / 2) * scale, originY);
      ctx.lineTo(originX + 1.5 * scale, bottomY);
      ctx.lineTo(originX + halfPlateWidthPx, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Weld Metal V-Groove
      ctx.fillStyle = '#1f2b52';
      ctx.beginPath();
      ctx.moveTo(originX - (capWidthMm / 2) * scale, originY);
      ctx.quadraticCurveTo(originX, originY - 3.5 * scale, originX + (capWidthMm / 2) * scale, originY);
      ctx.lineTo(originX + 1.5 * scale, bottomY);
      ctx.quadraticCurveTo(originX, bottomY + 2.5 * scale, originX - 1.5 * scale, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#435894';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Centerline
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(originX, originY - 22);
      ctx.lineTo(originX, bottomY + 18);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`FLAT PLATE WELD ℄ (t = ${plateThicknessMm}mm)`, originX, originY - 26);

      // Draw Target Flaw (All 16 Morphologies)
      const effectiveFlawXmm =
        currentFlaw.id === 'base_lamination'
          ? Math.abs(currentFlaw.distanceFromWeldCenterMm)
          : currentFlaw.distanceFromWeldCenterMm;
      const flawCanvasX = originX + effectiveFlawXmm * scale;
      const flawCanvasY = originY + flawNominalDepthMm * scale;
      drawComprehensiveDefectMorphology(
        ctx,
        currentFlaw.id,
        flawCanvasX,
        flawCanvasY,
        originY,
        bottomY,
        scale,
        isHit
      );

      // Draw Probe & Wedge at probeIndexXmm
      const probeX = originX + probeIndexXmm * scale;
      const wedgeW = (instrumentMode === 'paut' ? 22 : 17) * scale;
      const wedgeH = 13 * scale;

      ctx.fillStyle = instrumentMode === 'paut' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(56, 189, 248, 0.22)';
      ctx.strokeStyle = instrumentMode === 'paut' ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(probeX, originY);
      ctx.lineTo(probeX + wedgeW, originY);
      ctx.lineTo(probeX + wedgeW, originY - wedgeH);
      ctx.lineTo(probeX + (isStraightZeroBeam ? 0 : 3 * scale), originY - wedgeH * (isStraightZeroBeam ? 1 : 0.72));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // PAUT multi-element array ticks vs single UT crystal
      if (instrumentMode === 'paut') {
        for (let el = 0; el < 8; el++) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(probeX + (4 + el * 1.9) * scale, originY - wedgeH * 0.85, 1.3 * scale, 3.2 * scale);
        }
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(probeX + 4 * scale, originY - wedgeH * 0.82, 8 * scale, 3.5 * scale);
      }

      // Beam Index Red Dot
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(probeX, originY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${instrumentMode === 'paut' ? `${pautApertureElements}E PAUT` : 'UT'} ${effectiveBeamAngleDeg}° (X=${probeIndexXmm}mm)`,
        probeX + wedgeW / 2,
        originY - wedgeH - 6
      );

      // Ray Tracing: Beam Cone ("كوم الأشعة") + PAUT Fan + Central Leg 1 & Leg 2
      const leg1EndX = isStraightZeroBeam ? probeX : probeX - halfSkipSurfaceMm * scale;
      const leg1EndY =
        currentFlaw.id === 'base_lamination' && isHit ? flawCanvasY : bottomY;
      const leg2EndX = isStraightZeroBeam ? undefined : leg1EndX - halfSkipSurfaceMm * scale;
      const leg2EndY = isStraightZeroBeam ? undefined : originY;

      if (showBeamConeOverlay) {
        drawUltrasonicBeamCone2D({
          ctx,
          entryX: probeX,
          entryY: originY,
          bounceX: leg1EndX,
          bounceY: leg1EndY,
          leg2EndX,
          leg2EndY,
          scalePxPerMm: scale,
          coneMetrics: beamConeMetrics,
          isPaut: instrumentMode === 'paut',
          focalDepthMm: pautFocalDepthMm,
          showNearField: showNearFieldAndWavefronts,
          showWavefronts: showNearFieldAndWavefronts,
          isHit,
        });
      }

      if (instrumentMode === 'paut') {
        for (let fanDeg = 40; fanDeg <= 70; fanDeg += 5) {
          const fRad = (fanDeg * Math.PI) / 180;
          const fEndX = probeX - plateThicknessMm * Math.tan(fRad) * scale;
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(probeX, originY);
          ctx.lineTo(fEndX, bottomY);
          ctx.stroke();
        }
      }

      // Central Leg 1 Ray
      ctx.strokeStyle = activeLeg === 1 && isHit ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(probeX, originY);
      ctx.lineTo(leg1EndX, leg1EndY);
      ctx.stroke();

      // Central Leg 2 Ray (Full Skip)
      if (!isStraightZeroBeam && leg2EndX !== undefined && leg2EndY !== undefined) {
        ctx.strokeStyle = activeLeg === 2 && isHit ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(leg1EndX, leg1EndY);
        ctx.lineTo(leg2EndX, leg2EndY);
        ctx.stroke();
      }

      // Return Echo Bounce Ray when Flaw is Hit
      if (isHit) {
        ctx.strokeStyle = '#22c55e';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (activeLeg === 1) {
          ctx.moveTo(flawCanvasX, flawCanvasY);
          ctx.lineTo(probeX, originY);
        } else {
          ctx.moveTo(flawCanvasX, flawCanvasY);
          ctx.lineTo(leg1EndX, leg1EndY);
          ctx.lineTo(probeX, originY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      // ==================== CURVED PIPE WELD GEOMETRY ====================
      // Visual Pipe Arc Center below the canvas
      const visualOuterR = Math.max(150, Math.min(360, outerRadiusMm * scale * 0.72));
      const plateThicknessPx = plateThicknessMm * scale * 0.9;
      const visualInnerR = Math.max(60, visualOuterR - plateThicknessPx);
      const pipeCenterX = originX;
      const pipeCenterY = 58 + visualOuterR;

      const maxSpanAngle = Math.min(0.68, (68 * scale) / visualOuterR);

      // Draw Curved Pipe Wall Sector
      ctx.fillStyle = '#131a33';
      ctx.strokeStyle = '#2b3b6b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(pipeCenterX, pipeCenterY, visualOuterR, -Math.PI / 2 - maxSpanAngle, -Math.PI / 2 + maxSpanAngle);
      ctx.arc(pipeCenterX, pipeCenterY, visualInnerR, -Math.PI / 2 + maxSpanAngle, -Math.PI / 2 - maxSpanAngle, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Curved V-Groove Weld at Top Crown (-PI/2)
      const capHalfAngle = ((capWidthMm / 2) * scale) / visualOuterR;
      const rootHalfAngle = (1.6 * scale) / visualInnerR;

      ctx.fillStyle = '#1f2b52';
      ctx.strokeStyle = '#435894';
      ctx.beginPath();
      const capLeftX = pipeCenterX + visualOuterR * Math.cos(-Math.PI / 2 - capHalfAngle);
      const capLeftY = pipeCenterY + visualOuterR * Math.sin(-Math.PI / 2 - capHalfAngle);
      const capRightX = pipeCenterX + visualOuterR * Math.cos(-Math.PI / 2 + capHalfAngle);
      const capRightY = pipeCenterY + visualOuterR * Math.sin(-Math.PI / 2 + capHalfAngle);
      const rootRightX = pipeCenterX + visualInnerR * Math.cos(-Math.PI / 2 + rootHalfAngle);
      const rootRightY = pipeCenterY + visualInnerR * Math.sin(-Math.PI / 2 + rootHalfAngle);
      const rootLeftX = pipeCenterX + visualInnerR * Math.cos(-Math.PI / 2 - rootHalfAngle);
      const rootLeftY = pipeCenterY + visualInnerR * Math.sin(-Math.PI / 2 - rootHalfAngle);

      ctx.moveTo(capLeftX, capLeftY);
      ctx.quadraticCurveTo(pipeCenterX, pipeCenterY - visualOuterR - 4 * scale, capRightX, capRightY);
      ctx.lineTo(rootRightX, rootRightY);
      ctx.quadraticCurveTo(pipeCenterX, pipeCenterY - visualInnerR + 2.5 * scale, rootLeftX, rootLeftY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Header Label for Curved Pipe
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `CURVED PIPE SPECIMEN (OD = ${pipeOuterDiameterMm}mm · ID = ${pipeOuterDiameterMm - 2 * plateThicknessMm}mm · t = ${plateThicknessMm}mm)`,
        originX,
        24
      );

      // Draw Defect inside Curved Pipe Weld (All 16 Morphologies)
      const effectiveCurvedFlawX =
        currentFlaw.id === 'base_lamination'
          ? Math.abs(currentFlaw.distanceFromWeldCenterMm)
          : currentFlaw.distanceFromWeldCenterMm;
      const flawArcAngle = -Math.PI / 2 + (effectiveCurvedFlawX * scale) / visualOuterR;
      const flawRadialR = visualOuterR - (flawNominalDepthMm / plateThicknessMm) * plateThicknessPx;
      const flawCanvasX = pipeCenterX + flawRadialR * Math.cos(flawArcAngle);
      const flawCanvasY = pipeCenterY + flawRadialR * Math.sin(flawArcAngle);

      drawComprehensiveDefectMorphology(
        ctx,
        currentFlaw.id,
        flawCanvasX,
        flawCanvasY,
        pipeCenterY - visualOuterR,
        pipeCenterY - visualInnerR,
        scale,
        isHit
      );

      // Draw Tangential Contoured Probe on Curved Outer Surface
      const probeGamma = Math.min(maxSpanAngle * 0.92, (probeIndexXmm * scale) / visualOuterR);
      const probePolarAngle = -Math.PI / 2 + probeGamma;
      const probeX = pipeCenterX + visualOuterR * Math.cos(probePolarAngle);
      const probeY = pipeCenterY + visualOuterR * Math.sin(probePolarAngle);

      ctx.save();
      ctx.translate(probeX, probeY);
      ctx.rotate(probeGamma);
      const wedgeW = 16 * scale;
      const wedgeH = 12 * scale;
      ctx.fillStyle = instrumentMode === 'paut' ? 'rgba(245, 158, 11, 0.26)' : 'rgba(56, 189, 248, 0.26)';
      ctx.strokeStyle = instrumentMode === 'paut' ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wedgeW, 0);
      ctx.lineTo(wedgeW, -wedgeH);
      ctx.lineTo(2 * scale, -wedgeH * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${effectiveBeamAngleDeg}° CONTOURED`, wedgeW / 2, -wedgeH - 5);
      ctx.restore();

      // Curved Pipe Ray Tracing & Beam Cone
      const leg1IdAngle = isStraightZeroBeam
        ? probePolarAngle
        : probePolarAngle - Math.min(probeGamma + 0.25, (halfSkipSurfaceMm * scale) / visualOuterR);
      const idBounceX = pipeCenterX + visualInnerR * Math.cos(leg1IdAngle);
      const idBounceY = pipeCenterY + visualInnerR * Math.sin(leg1IdAngle);

      const leg2OdAngle = leg1IdAngle - (halfSkipSurfaceMm * scale) / visualOuterR;
      const odBounceX = pipeCenterX + visualOuterR * Math.cos(leg2OdAngle);
      const odBounceY = pipeCenterY + visualOuterR * Math.sin(leg2OdAngle);

      if (showBeamConeOverlay) {
        drawUltrasonicBeamCone2D({
          ctx,
          entryX: probeX,
          entryY: probeY,
          bounceX: idBounceX,
          bounceY: idBounceY,
          leg2EndX: isStraightZeroBeam ? undefined : odBounceX,
          leg2EndY: isStraightZeroBeam ? undefined : odBounceY,
          scalePxPerMm: scale * 0.9,
          coneMetrics: beamConeMetrics,
          isPaut: instrumentMode === 'paut',
          focalDepthMm: pautFocalDepthMm,
          showNearField: showNearFieldAndWavefronts,
          showWavefronts: showNearFieldAndWavefronts,
          isHit,
        });
      }

      if (instrumentMode === 'paut') {
        for (let fan = -3; fan <= 3; fan++) {
          const fanAngle = leg1IdAngle + fan * 0.035;
          const fx = pipeCenterX + visualInnerR * Math.cos(fanAngle);
          const fy = pipeCenterY + visualInnerR * Math.sin(fanAngle);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(probeX, probeY);
          ctx.lineTo(fx, fy);
          ctx.stroke();
        }
      }

      // Leg 1 Ray
      ctx.strokeStyle = activeLeg === 1 && isHit ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(probeX, probeY);
      ctx.lineTo(idBounceX, idBounceY);
      ctx.stroke();

      // Leg 2 Ray off Curved Inner Wall
      if (!isStraightZeroBeam) {
        ctx.strokeStyle = activeLeg === 2 && isHit ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(idBounceX, idBounceY);
        ctx.lineTo(odBounceX, odBounceY);
        ctx.stroke();
      }

      if (isHit) {
        ctx.strokeStyle = '#22c55e';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (activeLeg === 1) {
          ctx.moveTo(flawCanvasX, flawCanvasY);
          ctx.lineTo(probeX, probeY);
        } else {
          ctx.moveTo(flawCanvasX, flawCanvasY);
          ctx.lineTo(idBounceX, idBounceY);
          ctx.lineTo(probeX, probeY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Bottom HUD Strip inside Weld Canvas showing Beam Cone & Skip Info
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(10, height - 26, width - 20, 20);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `N_total=${beamConeMetrics.nearFieldLengthMm.toFixed(1)}mm · N_eff=${beamConeMetrics.effectiveNearFieldInSpecimenMm.toFixed(1)}mm · -6dB=±${beamConeMetrics.halfAngleMinus6dBDeg.toFixed(1)}° · Skip/2=${halfSkipSurfaceMm.toFixed(1)}mm`,
      18,
      height - 13
    );
  }, [
    specimenGeometry,
    pipeOuterDiameterMm,
    plateThicknessMm,
    capWidthMm,
    currentFlaw,
    flawNominalDepthMm,
    probeIndexXmm,
    probeSeamYmm,
    effectiveBeamAngleDeg,
    isStraightZeroBeam,
    instrumentMode,
    pautApertureElements,
    pautFocalDepthMm,
    beamConeMetrics,
    showBeamConeOverlay,
    showNearFieldAndWavefronts,
    isHit,
    activeLeg,
    halfSkipSurfaceMm,
    fullSkipSurfaceMm,
  ]);

  // ---------------------------------------------------------------------------
  // 2. Render Digital A-Scan Oscilloscope (UT & PAUT Synchronized A-Scan)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = aScanCanvasRef.current;
    if (!canvas || isFrozen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // 10x10 Graticule Grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      if (i > 0 && i < 10 && i % 2 === 0) {
        ctx.fillStyle = '#475569';
        ctx.font = '8px monospace';
        ctx.fillText(`${100 - i * 10}%`, 4, y - 2);
      }
    }
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      if (i > 0) {
        ctx.fillStyle = '#475569';
        ctx.font = '8px monospace';
        ctx.fillText(`${Math.round(displayDelayMm + (i / 10) * rangeMm)}`, x - 8, height - 3);
      }
    }

    // Near-Field (Fresnel Interference Zone: 0 -> N_eff) Shaded Overlay on A-Scan Timebase
    if (showNearFieldAndWavefronts && beamConeMetrics.effectiveNearFieldInSpecimenMm > displayDelayMm) {
      const nfEndPx = Math.min(
        width,
        Math.max(0, ((beamConeMetrics.effectiveNearFieldInSpecimenMm - displayDelayMm) / rangeMm) * width)
      );
      if (nfEndPx > 2) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.14)';
        ctx.fillRect(0, 0, nfEndPx, height);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(nfEndPx, 0);
        ctx.lineTo(nfEndPx, height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e9d5ff';
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText(
          `NEAR FIELD (N_eff=${beamConeMetrics.effectiveNearFieldInSpecimenMm.toFixed(1)}mm)`,
          Math.max(4, Math.min(nfEndPx + 4, width - 175)),
          13
        );
      }
    }

    // 80% FSH Reference Line
    const y80 = 0.2 * height;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y80);
    ctx.lineTo(width, y80);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw DAC Curves (100% DAC, -6dB, -14dB)
    if (isDacEnabled && dacPoints.length >= 2 && rectification !== 'rf') {
      const drawDacMultiplier = (mult: number, color: string, dashed: boolean) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        if (dashed) ctx.setLineDash([4, 3]);
        ctx.beginPath();
        dacPoints.forEach((pt, idx) => {
          const x = ((pt.soundPathMm - displayDelayMm) / rangeMm) * width;
          const y = (1 - Math.min(100, pt.amplitudePct * mult) / 100) * height;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      };
      drawDacMultiplier(1.0, '#f59e0b', false); // Primary 100% DAC
      drawDacMultiplier(0.5, 'rgba(234, 179, 8, 0.65)', true); // -6 dB (50% DAC)
      drawDacMultiplier(0.2, 'rgba(56, 189, 248, 0.5)', true); // -14 dB (20% Evaluation)
    }

    // Gate A & Gate B Bars
    const drawGate = (start: number, gw: number, thresh: number, color: string, label: string) => {
      const gx = ((start - displayDelayMm) / rangeMm) * width;
      const gWidthPx = (gw / rangeMm) * width;
      const gy = rectification === 'rf' ? height / 2 - (thresh / 200) * height : (1 - thresh / 100) * height;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + gWidthPx, gy);
      ctx.moveTo(gx, gy - 4);
      ctx.lineTo(gx, gy + 4);
      ctx.moveTo(gx + gWidthPx, gy - 4);
      ctx.lineTo(gx + gWidthPx, gy + 4);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(label, gx + 3, gy - 6);
    };

    drawGate(gateAStartMm, gateAWidthMm, gateAThresholdPct, isAlarmTriggered ? '#ef4444' : '#06b6d4', `GATE A (${gateAThresholdPct}%)`);
    drawGate(gateBStartMm, gateBWidthMm, gateBThresholdPct, '#f59e0b', `GATE B (${gateBThresholdPct}%)`);

    // Synthesize Waveform Samples
    const numPoints = 360;
    const waveSamples = new Array<number>(numPoints).fill(0);

    const filterNoiseScale = bandpassFilter === 'broadband' ? 1.8 : 0.75;
    for (let i = 0; i < numPoints; i++) {
      const rawGrass = (Math.sin(i * 0.7) * 1.1 + (Math.random() - 0.5) * 1.8) * filterNoiseScale;
      waveSamples[i] = Math.abs(rawGrass) < rejectPct * 0.15 ? 0 : rawGrass;
    }

    // Initial Main Bang at S = 0
    if (displayDelayMm < 8) {
      for (let i = 0; i < 18; i++) {
        const env = Math.exp(-Math.pow((i - 2) / 3.8, 2));
        waveSamples[i] += 95 * env * (rectification === 'rf' ? Math.cos(i * 1.5) : 1);
      }
    }

    // Defect Echo Envelope across all 5 distinct acoustic waveform signatures
    if (isHit && echoAmplitudePct > 0) {
      const peakIdx = Math.round(((calculatedSoundPathMm - displayDelayMm) / rangeMm) * numPoints);
      const pulseWidth = damping === '50_ohm' ? 10 : 16;

      for (let i = -pulseWidth; i <= pulseWidth; i++) {
        const idx = peakIdx + i;
        if (idx >= 0 && idx < numPoints) {
          let env = Math.exp(-Math.pow(i / (pulseWidth / 2.4), 2));
          if (currentFlaw.echoWaveformType === 'jagged_multipeak') {
            env *= 0.72 + 0.35 * Math.abs(Math.sin(i * 0.9));
          } else if (currentFlaw.echoWaveformType === 'dense_cluster') {
            env *= 0.55 + 0.45 * Math.abs(Math.cos(i * 1.45));
          }
          const osc = Math.cos(i * (probeFrequencyMhz * 0.35));
          let sampleVal = 0;
          if (rectification === 'full') sampleVal = echoAmplitudePct * env * Math.abs(osc);
          else if (rectification === 'positive') sampleVal = echoAmplitudePct * env * Math.max(0, osc);
          else if (rectification === 'negative') sampleVal = echoAmplitudePct * env * Math.max(0, -osc);
          else sampleVal = echoAmplitudePct * env * osc;
          waveSamples[idx] += sampleVal;
        }
      }

      // Upper Crack Tip Diffraction Echo for sharp_spike_tip flaws
      if (currentFlaw.echoWaveformType === 'sharp_spike_tip') {
        const tipPathMm = Math.max(2, calculatedSoundPathMm - currentFlaw.heightMm / cosTheta);
        const tipIdx = Math.round(((tipPathMm - displayDelayMm) / rangeMm) * numPoints);
        for (let i = -6; i <= 6; i++) {
          const idx = tipIdx + i;
          if (idx >= 0 && idx < numPoints) {
            const env = Math.exp(-Math.pow(i / 2.5, 2));
            waveSamples[idx] += echoAmplitudePct * 0.28 * env * Math.abs(Math.cos(i * 1.3));
          }
        }
      }

      // Multiple echo train for base_lamination
      if (currentFlaw.echoWaveformType === 'backwall_loss') {
        const secondMultIdx = Math.round(((calculatedSoundPathMm * 2 - displayDelayMm) / rangeMm) * numPoints);
        for (let i = -7; i <= 7; i++) {
          const idx = secondMultIdx + i;
          if (idx >= 0 && idx < numPoints) {
            const env = Math.exp(-Math.pow(i / 3.0, 2));
            waveSamples[idx] += echoAmplitudePct * 0.52 * env * Math.abs(Math.cos(i * 1.2));
          }
        }
      }
    }

    // Peak Envelope Hold Memory
    if (isPeakHoldActive && rectification !== 'rf') {
      const nextEnv =
        peakEnvelope.length === numPoints
          ? peakEnvelope.map((prev, i) => Math.max(prev, Math.max(0, waveSamples[i])))
          : waveSamples.map((v) => Math.max(0, v));

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * width;
        const y = height - (Math.min(100, nextEnv[i]) / 100) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (nextEnv.some((val, i) => val > (peakEnvelope[i] ?? -1))) {
        setPeakEnvelope(nextEnv);
      }
    }

    // Main Live A-Scan Waveform Trace
    ctx.strokeStyle = isAlarmTriggered ? '#f87171' : '#22c55e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      let y = height - 2;
      if (rectification === 'rf') {
        const clamped = Math.max(-100, Math.min(100, waveSamples[i]));
        y = height / 2 - (clamped / 100) * (height * 0.46);
      } else {
        const amp = Math.min(100, Math.max(0, waveSamples[i]));
        y = height - (amp / 100) * height;
      }
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Digital Peak Callout HUD on A-Scan
    if (isHit && echoAmplitudePct > 0) {
      const peakX = ((calculatedSoundPathMm - displayDelayMm) / rangeMm) * width;
      const peakY = rectification === 'rf' ? height / 2 - (echoAmplitudePct / 100) * (height * 0.45) : (1 - echoAmplitudePct / 100) * height;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(peakX, peakY, 3.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        `S=${calculatedSoundPathMm.toFixed(1)}mm · D=${calculatedDepthMm.toFixed(1)}mm · ${echoAmplitudePct}% FSH (${pctOfDac}% DAC)`,
        Math.max(8, Math.min(width - 310, peakX - 60)),
        Math.max(16, peakY - 10)
      );
    }
  }, [
    rangeMm,
    displayDelayMm,
    isDacEnabled,
    dacPoints,
    gateAStartMm,
    gateAWidthMm,
    gateAThresholdPct,
    gateBStartMm,
    gateBWidthMm,
    gateBThresholdPct,
    isAlarmTriggered,
    isHit,
    echoAmplitudePct,
    calculatedSoundPathMm,
    calculatedDepthMm,
    pctOfDac,
    rectification,
    damping,
    bandpassFilter,
    rejectPct,
    probeFrequencyMhz,
    currentFlaw,
    cosTheta,
    isFrozen,
    isPeakHoldActive,
    showNearFieldAndWavefronts,
    beamConeMetrics.effectiveNearFieldInSpecimenMm,
  ]);

  // ---------------------------------------------------------------------------
  // 3. Render PAUT Sectorial S-Scan + Encoded Top C-Scan Views (When PAUT Active)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (instrumentMode !== 'paut' || activeStep !== 'scan_inspect') return;

    // A) Sectorial S-Scan Canvas with Multi-Leg Weld Bevel Overlay inside Angular Graduation
    const sCanvas = pautSScanCanvasRef.current;
    if (sCanvas) {
      const ctx = sCanvas.getContext('2d');
      if (ctx) {
        renderModernPautSectorialScan(ctx, {
          width: sCanvas.width,
          height: sCanvas.height,
          plateThicknessMm,
          probeIndexOffsetMm: probeIndexXmm,
          minAngleDeg: pautMinAngleDeg,
          maxAngleDeg: pautMaxAngleDeg,
          selectedAngleDeg: pautCursorAngleDeg,
          apertureElements: pautApertureElements,
          focalDepthMm: pautFocalDepthMm,
          gainDb,
          isTcgCalibrated: pautTcgEqualized,
          scanLawMode: pautSweepMode,
          specimenGeometry,
          pipeOdMm: pipeOuterDiameterMm,
          isWeldOverlayVisible: pautWeldOverlayVisible,
          showSkipMirror: pautShowSkipMirror,
          bevelConfig: {
            grooveType: pautGrooveType,
            bevelAngleDeg: pautBevelAngleDeg,
            rootGapMm: 2.0,
            rootFaceMm: 1.8,
            hazWidthMm: 2.5,
            capReinforcementMm: 1.6,
          },
          flaw: {
            id: currentFlaw.id,
            depthMm: flawNominalDepthMm,
            heightMm: currentFlaw.heightMm,
            offsetFromCenterTowardsProbeMm: currentFlaw.distanceFromWeldCenterMm,
            isPlanar: currentFlaw.category === 'Planar',
            baseIntensity: longitudinalFactor,
          },
          showFocalBeamCone: showBeamConeOverlay,
          showSizingCaliper: true,
          caliperY1Mm: caliperU1Mm,
          caliperY2Mm: caliperU2Mm,
          isAr,
        });
      }
    }

    // B) Encoded Top C-Scan Strip (Y = 0..100mm along weld length)
    const cCanvas = pautCScanCanvasRef.current;
    if (cCanvas) {
      const ctx = cCanvas.getContext('2d');
      if (ctx) {
        const w = cCanvas.width;
        const h = cCanvas.height;
        ctx.fillStyle = '#040a18';
        ctx.fillRect(0, 0, w, h);

        // Background healthy weld C-Scan blue noise
        ctx.fillStyle = 'rgba(14, 116, 144, 0.18)';
        ctx.fillRect(0, 8, w, h - 16);

        // Weld centerline horizontal guide
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Defect C-Scan Footprint from (centerY - L/2) to (centerY + L/2)
        const startX = ((currentFlaw.centerYmm - currentFlaw.lengthMm / 2) / 100) * w;
        const flawWidthPx = Math.max(8, (currentFlaw.lengthMm / 100) * w);
        const flawY = h / 2 + (currentFlaw.distanceFromWeldCenterMm / 20) * (h * 0.35);

        const cGrad = ctx.createLinearGradient(startX, flawY, startX + flawWidthPx, flawY);
        cGrad.addColorStop(0, 'rgba(34, 197, 94, 0.65)');
        cGrad.addColorStop(0.2, 'rgba(245, 158, 11, 0.9)');
        cGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.98)');
        cGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.9)');
        cGrad.addColorStop(1, 'rgba(34, 197, 94, 0.65)');
        ctx.fillStyle = cGrad;
        ctx.fillRect(startX, flawY - 6, flawWidthPx, 12);

        // Current Encoder Y Cursor Line
        const curEncoderPx = (probeSeamYmm / 100) * w;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(curEncoderPx, 0);
        ctx.lineTo(curEncoderPx, h);
        ctx.stroke();

        // -6 dB Markers if recorded
        if (drop6dBY1 !== null) {
          const y1Px = (drop6dBY1 / 100) * w;
          ctx.strokeStyle = '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(y1Px, 0);
          ctx.lineTo(y1Px, h);
          ctx.stroke();
        }
        if (drop6dBY2 !== null) {
          const y2Px = (drop6dBY2 / 100) * w;
          ctx.strokeStyle = '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(y2Px, 0);
          ctx.lineTo(y2Px, h);
          ctx.stroke();
        }
      }
    }
  }, [
    instrumentMode,
    activeStep,
    pautMinAngleDeg,
    pautMaxAngleDeg,
    pautCursorAngleDeg,
    plateThicknessMm,
    specimenGeometry,
    probeIndexXmm,
    probeSeamYmm,
    longitudinalFactor,
    currentFlaw,
    flawNominalDepthMm,
    pautApertureElements,
    pautFocalDepthMm,
    pautTcgEqualized,
    pautSweepMode,
    pautWeldOverlayVisible,
    pautShowSkipMirror,
    pautGrooveType,
    pautBevelAngleDeg,
    pipeOuterDiameterMm,
    showBeamConeOverlay,
    isAr,
    gainDb,
    caliperU1Mm,
    caliperU2Mm,
    drop6dBY1,
    drop6dBY2,
  ]);

  // ---------------------------------------------------------------------------
  // 4. Render Interactive Calibration Block Canvas in Step 2 (Calibration Lab)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeStep !== 'calibration') return;
    const canvas = calBlockCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#040814';
    ctx.fillRect(0, 0, w, h);

    if (activeCalBlock === 'iiw_v1' || activeCalBlock === 'iiw_v2') {
      // Draw IIW V1 / V2 Steel Block with R100 Arc & Ø1.5mm SDH
      const bx = 60;
      const by = 45;
      const bw = w - 120;
      const bh = h - 75;

      ctx.fillStyle = '#16213e';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw * 0.72, by);
      ctx.arc(bx + bw * 0.35, by, bw * 0.37, 0, Math.PI * 0.42);
      ctx.lineTo(bx, by + bh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Perspex insert circle & Ø1.5mm SDH hole
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(bx + bw * 0.35, by + bh * 0.52, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bx + bw * 0.58, by + 24, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Probe Position & Ray on Calibration Block
      const probePosX =
        calTargetSpot === 'thk_25' ? bx + 45 : calTargetSpot === 'sdh_angle' ? bx + bw * 0.42 : bx + bw * 0.35;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(probePosX - 16, by - 16, 32, 16);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(probePosX, by);
      if (calTargetSpot === 'thk_25') {
        ctx.lineTo(probePosX, by + bh);
      } else if (calTargetSpot === 'sdh_angle') {
        ctx.lineTo(bx + bw * 0.58, by + 24);
      } else {
        ctx.lineTo(bx + bw * 0.68, by + bh * 0.55);
      }
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        activeCalBlock === 'iiw_v1'
          ? 'IIW TYPE 1 (V1 - ISO 2400): R100mm Arc · 25mm Thickness · Ø1.5mm SDH'
          : 'IIW TYPE 2 (V2 - ISO 7963): R25 / R50mm Arcs · Ø5mm Angle Hole',
        20,
        24
      );
    } else if (activeCalBlock === 'curved_pipe_block') {
      // Draw Curved Pipe ASME Reference Ring with ID/OD Notches & SDHs
      const cx = w / 2;
      const cy = h + 85;
      const rOut = 165;
      const rIn = 125;
      ctx.fillStyle = '#16213e';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, -Math.PI * 0.72, -Math.PI * 0.28);
      ctx.arc(cx, cy, rIn, -Math.PI * 0.28, -Math.PI * 0.72, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3 Reference SDHs at 1/4T, 1/2T, 3/4T in Curved Wall
      const holes = [0.25, 0.5, 0.75];
      holes.forEach((frac, idx) => {
        const ang = -Math.PI / 2 + (idx - 1) * 0.16;
        const rr = rOut - frac * (rOut - rIn);
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(cx + rr * Math.cos(ang), cy + rr * Math.sin(ang), 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Contoured Probe on Curved Reference Block
      const pAng = -Math.PI / 2 + 0.28;
      const px = cx + rOut * Math.cos(pAng);
      const py = cy + rOut * Math.sin(pAng);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx, cy - (rOut + rIn) / 2);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`ASME CURVED PIPE REFERENCE BLOCK (OD = ${pipeOuterDiameterMm}mm · 10% ID/OD Notches + SDH)`, 18, 24);
    } else {
      // ASME Sec V Basic Calibration Block (1/4T, 1/2T, 3/4T Side-Drilled Holes for DAC / TCG)
      const bx = 55;
      const by = 48;
      const bw = w - 110;
      const bh = h - 80;
      ctx.fillStyle = '#16213e';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillRect(bx, by, bw, bh);

      const sdhCoords = [
        { label: '1/4 T', x: bx + bw * 0.32, y: by + bh * 0.25 },
        { label: '1/2 T', x: bx + bw * 0.55, y: by + bh * 0.5 },
        { label: '3/4 T', x: bx + bw * 0.78, y: by + bh * 0.75 },
      ];

      sdhCoords.forEach((hPt) => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(hPt.x, hPt.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px monospace';
        ctx.fillText(hPt.label, hPt.x + 8, hPt.y + 3);
      });

      const targetIdx = calTargetSpot === 'sdh_dac_2' ? 1 : calTargetSpot === 'sdh_dac_3' ? 2 : 0;
      const targetHole = sdhCoords[targetIdx];
      const probeX = Math.max(bx + 18, targetHole.x - 45);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(probeX - 14, by - 14, 28, 14);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(probeX, by);
      ctx.lineTo(targetHole.x, targetHole.y);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('ASME SEC V ARTICLE 4 BASIC BLOCK: 3-Point DAC / PAUT TCG Side-Drilled Holes', 18, 24);
    }
  }, [activeStep, activeCalBlock, calTargetSpot, pipeOuterDiameterMm]);

  const toggleCalStepDone = (stepNum: number) => {
    setCalCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((n) => n !== stepNum) : [...prev, stepNum]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Workshop Header & Workflow Navigation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-cyan-400 mb-2">
              {isAr
                ? 'ورشة UT و PAUT المتكاملة · عينات مسطحة ومنحنية · كالبريشن وتقييم الكود'
                : 'UT & PAUT Master Workshop · Flat & Curved Specimens · Calibration & Code Sizing'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isAr
                ? 'محاكي فحص اللحامات بالموجات فوق الصوتية والمصفوفات الطورية (UT & PAUT)'
                : 'Comprehensive Ultrasonic Weld Inspection & Phased Array (UT & PAUT) Lab'}
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'بيئة ورشة عملية كاملة تجمع جهاز UT التقليدي بكامل مفاتيحه وجهاز PAUT متعدد القنوات، مع محاكاة العينات المسطحة (Flat) والأنابيب المنحنية (Curved Pipe)، وتدريب الكالبريشن خطوة بخطوة، وحركة المجس لتحديد أبعاد العيوب ومطابقتها بالأكواد وإصدار تقرير PDF بتوقيع إلكتروني.'
                : 'Complete hands-on UT & PAUT workshop featuring full hardware consoles, Flat Plate & Curved Pipe ray tracing, guided step-by-step block calibration, probe scanning & -6 dB flaw sizing, multi-code acceptance evaluation, and signed PDF reporting.'}
            </p>
          </div>

          {/* 5 Main Workshop Stages */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'scan_inspect', label: { ar: '1. المسح والأجهزة وتتبع الأشعة', en: '1. Scan & Ray Trace' }, icon: Crosshair },
              { id: 'calibration', label: { ar: '2. محاكي الكالبريشن ومفاتيح الضبط', en: '2. Full Calibration Keys' }, icon: Sliders },
              { id: 'code_eval', label: { ar: '3. تقييم العيوب ومطابقة الكود', en: '3. Code Evaluation' }, icon: ShieldCheck },
              { id: 'report', label: { ar: '4. تقرير PDF والتوقيع الإلكتروني', en: '4. Official Test Report' }, icon: FileCheck },
              { id: 'beam_cone_atlas', label: { ar: '5. كوم الأشعة 3D والـ 16 عيباً', en: '5. 3D Beam Cone & 16 Defects' }, icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStep === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStep(tab.id as typeof activeStep)}
                  className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label[language]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Workshop Bar: Instrument Switcher (UT vs PAUT) + Specimen Geometry Switcher (Flat vs Curved Pipe) */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Instrument Hardware Selector */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-mono text-slate-400 shrink-0">
              {isAr ? 'جهاز الفحص النشط:' : 'Active Instrument:'}
            </span>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <button
                type="button"
                onClick={() => setInstrumentMode('ut')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  instrumentMode === 'ut'
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isAr ? 'جهاز UT كامل (USM 35X)' : 'Conventional UT Device'}</span>
              </button>
              <button
                type="button"
                onClick={() => setInstrumentMode('paut')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  instrumentMode === 'paut'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{isAr ? 'جهاز PAUT كامل (OmniScan)' : 'Phased Array PAUT Device'}</span>
              </button>
            </div>
          </div>

          {/* Specimen Geometry Selector: Flat Plate vs Curved Pipe */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-2 justify-between lg:justify-end">
            <span className="text-xs font-mono text-slate-400">
              {isAr ? 'هندسة العينة:' : 'Specimen Geometry:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSpecimenGeometry('flat')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  specimenGeometry === 'flat'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                {isAr ? 'عينة فلات مسطحة (Flat Plate)' : 'Flat Butt-Weld Plate'}
              </button>
              <button
                type="button"
                onClick={() => setSpecimenGeometry('curved')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  specimenGeometry === 'curved'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                {isAr ? 'عينة كيرف أنبوب (Curved Pipe)' : 'Curved Pipe Weld'}
              </button>
            </div>

            {/* Wall Thickness & Pipe OD Quick Selectors */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <label className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300">
                <span>t:</span>
                <select
                  aria-label={isAr ? 'سمك العينة' : 'Specimen Thickness'}
                  value={plateThicknessMm}
                  onChange={(e) => setPlateThicknessMm(Number(e.target.value))}
                  className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer"
                >
                  {[15, 20, 25, 30].map((tVal) => (
                    <option key={tVal} value={tVal} className="bg-slate-950 text-white">
                      {tVal} mm
                    </option>
                  ))}
                </select>
              </label>

              {specimenGeometry === 'curved' && (
                <label className="flex items-center gap-1 bg-slate-900 border border-emerald-500/40 rounded-lg px-2 py-1.5 text-slate-300">
                  <span>OD:</span>
                  <select
                    aria-label={isAr ? 'القطر الخارجي للأنبوب' : 'Pipe Outer Diameter'}
                    value={pipeOuterDiameterMm}
                    onChange={(e) => setPipeOuterDiameterMm(Number(e.target.value))}
                    className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={114} className="bg-slate-950 text-white">114 mm (4&quot;)</option>
                    <option value={168} className="bg-slate-950 text-white">168 mm (6&quot;)</option>
                    <option value={219} className="bg-slate-950 text-white">219 mm (8&quot;)</option>
                    <option value={324} className="bg-slate-950 text-white">324 mm (12&quot;)</option>
                  </select>
                </label>
              )}

              <NdtAudioControlChip language={language} compact />
            </div>
          </div>
        </div>

        {/* Global Active Inspection Code Switcher (Updates Per-Defect Tolerances Across Entire Simulator) */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'الكود الهندسي المعتمد لحساب سماحية العيوب:' : 'Active Inspection Code (Governs Defect Tolerances):'}</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {INSPECTION_CODES_META.map((cMeta) => {
                const isActiveCode = selectedCode === cMeta.id;
                return (
                  <button
                    key={cMeta.id}
                    type="button"
                    onClick={() => setSelectedCode(cMeta.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                      isActiveCode
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {cMeta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {activeCodeMeta.clauseSummary[language]}
          </div>
        </div>
      </div>

      {/* Complete 16-Defect Catalog Strip with Family Filters + Per-Defect Live Code Tolerance */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs font-mono">
          <span className="text-slate-200 font-bold flex items-center gap-1.5">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr
                ? `موسوعة كافة العيوب (${ALL_WELD_DEFECTS_CATALOG.length} عيباً) وسماحية كل عيب حسب ${activeCodeMeta.shortLabel} عند سمك t=${plateThicknessMm}مم:`
                : `All ${ALL_WELD_DEFECTS_CATALOG.length} Weld Defects & Allowable Tolerance per ${activeCodeMeta.shortLabel} (t=${plateThicknessMm}mm):`}
            </span>
          </span>

          {/* Family Filter Tabs + Quick Full 16-Defect Tolerance Matrix Toggle */}
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: 'all', ar: 'الكل (16)', en: 'All (16)' },
              { id: 'cracks', ar: 'الشروخ (4)', en: 'Cracks (4)' },
              { id: 'fusion_penetration', ar: 'الانصهار والتغلغل (4)', en: 'LOF & LOP (4)' },
              { id: 'volumetric', ar: 'الخبث والمسامات (5)', en: 'Volumetric (5)' },
              { id: 'geometry_lamination', ar: 'السطح والتورق (3)', en: 'Profile & Lam. (3)' },
            ] as const).map((fam) => (
              <button
                key={fam.id}
                type="button"
                onClick={() => setDefectFamilyFilter(fam.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  defectFamilyFilter === fam.id
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {isAr ? fam.ar : fam.en}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowQuickToleranceMatrix(!showQuickToleranceMatrix)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                showQuickToleranceMatrix
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'جدول سماحية كل العيوب' : 'All 16 Tolerances Table'}</span>
            </button>
          </div>
        </div>

        {/* Visual Standards Tolerance Alert Trigger & Auto-Popup Control */}
        <DefectToleranceTriggerBar
          defectId={selectedFlawId}
          activeCode={selectedCode}
          thicknessMm={plateThicknessMm}
          language={language}
          autoAlertOnSelect={autoAlertOnDefectSelect}
          onToggleAutoAlert={setAutoAlertOnDefectSelect}
          onOpenModal={() => setIsToleranceModalOpen(true)}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {filteredFlaws.map((flaw) => {
            const isSelected = selectedFlawId === flaw.id;
            const dMm = (flaw.nominalDepthRatio * plateThicknessMm).toFixed(1);
            const cardTol = getDefectCodeTolerance(flaw.id, selectedCode, plateThicknessMm);
            return (
              <DefectToleranceTooltip
                key={flaw.id}
                defectId={flaw.id}
                activeCode={selectedCode}
                thicknessMm={plateThicknessMm}
                language={language}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFlawId(flaw.id);
                    setProbeAngleDeg(flaw.optimalAngleDeg);
                    setPautCursorAngleDeg(flaw.optimalAngleDeg === 0 ? 45 : flaw.optimalAngleDeg);
                    setVelocityMs(flaw.optimalAngleDeg === 0 ? 5920 : 3240);
                    if (autoAlertOnDefectSelect) {
                      setIsToleranceModalOpen(true);
                    }
                  }}
                  className={`w-full h-full p-2 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[9.5px] font-mono mb-1">
                      <span className={flaw.category === 'Planar' ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                        {flaw.codeSymbol}
                      </span>
                      <span className="text-cyan-400">{flaw.optimalAngleDeg}°</span>
                    </div>
                    <div className="text-[11px] font-bold line-clamp-2 leading-snug">{flaw.name[language]}</div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-1">
                    <div className="text-[9.5px] text-slate-500 font-mono tabular-nums">
                      D={dMm} · L={flaw.lengthMm}mm
                    </div>
                    <div
                      className={`text-[9.5px] font-mono font-bold leading-tight tabular-nums ${
                        cardTol.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'
                      }`}
                    >
                      {isAr ? 'السماحية: ' : 'Tol: '}
                      {cardTol.isZeroTolerance
                        ? isAr
                          ? '0.0 مم (ممنوع)'
                          : '0.0 mm (Zero)'
                        : cardTol.toleranceBadge[language]}
                    </div>
                  </div>
                </button>
              </DefectToleranceTooltip>
            );
          })}
        </div>

        {/* Expandable Instant 16-Defect Code Allowable Tolerance Matrix */}
        {showQuickToleranceMatrix && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="font-bold text-amber-300">
                {isAr
                  ? `جدول السماحية المسموحة لجميع العيوب الـ 16 طبقاً لـ ${activeCodeMeta.fullTitle.ar} (سمك العينة t = ${plateThicknessMm} مم)`
                  : `Complete 16-Defect Allowable Tolerance Schedule — ${activeCodeMeta.fullTitle.en} (t = ${plateThicknessMm} mm)`}
              </span>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'اضغط على أي صف لتحميل العيب فوراً في المحاكاة' : 'Click any row to load defect into live scan'}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 max-h-80 overflow-y-auto">
              <table className="w-full text-start border-collapse font-mono text-[11px] tabular-nums">
                <thead className="sticky top-0 bg-slate-900 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="p-2 text-start">{isAr ? 'الرمز' : 'Code'}</th>
                    <th className="p-2 text-start">{isAr ? 'اسم العيب' : 'Defect Type'}</th>
                    <th className="p-2 text-start">{isAr ? 'التصنيف' : 'Nature'}</th>
                    <th className="p-2 text-start">{isAr ? 'السماحية القصوى المسموحة' : 'Allowable Tolerance'}</th>
                    <th className="p-2 text-start">{isAr ? 'شرط السعة / الملاحظة' : 'Amplitude / Criterion'}</th>
                    <th className="p-2 text-start">{isAr ? 'فقرة الكود' : 'Clause'}</th>
                  </tr>
                </thead>
                <tbody>
                  {allDefectsToleranceSchedule.map(({ defect, tolerance }) => (
                    <tr
                      key={defect.id}
                      onClick={() => {
                        setSelectedFlawId(defect.id);
                        setProbeAngleDeg(defect.optimalAngleDeg);
                        setPautCursorAngleDeg(defect.optimalAngleDeg === 0 ? 45 : defect.optimalAngleDeg);
                        setVelocityMs(defect.optimalAngleDeg === 0 ? 5920 : 3240);
                        if (autoAlertOnDefectSelect) {
                          setIsToleranceModalOpen(true);
                        }
                      }}
                      className={`border-b border-slate-800/70 cursor-pointer transition ${
                        selectedFlawId === defect.id ? 'bg-cyan-950/50 text-white' : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <td className="p-2 font-bold text-cyan-400">{defect.codeSymbol}</td>
                      <td className="p-2 font-bold">{defect.name[language]}</td>
                      <td className="p-2">
                        <span className={defect.category === 'Planar' ? 'text-rose-400' : 'text-amber-300'}>
                          {defect.category}
                        </span>
                      </td>
                      <td className="p-2 font-bold">
                        <span className={tolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'}>
                          {tolerance.toleranceBadge[language]}
                        </span>
                      </td>
                      <td className="p-2 text-slate-400">{tolerance.amplitudeCriterion[language]}</td>
                      <td className="p-2 text-slate-400">{tolerance.clauseRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          STEP 1: PROBE SCANNING, RAY TRACING & FULL UT / PAUT INSTRUMENTS
         ===================================================================== */}
      {activeStep === 'scan_inspect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Physical Specimen Ray-Tracing + UT/PAUT Screens */}
          <div className="lg:col-span-8 space-y-4">
            {/* 1A. Specimen Cross-Section & Interactive Probe Dragging Canvas */}
            <div className="rounded-2xl border border-slate-700 bg-black p-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pb-2 border-b border-slate-800 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">
                    {specimenGeometry === 'curved'
                      ? isAr
                        ? 'تتبع الأشعة داخل عينة أنبوب منحني (Curved Pipe ID/OD Ray Tracing)'
                        : 'CURVED PIPE CROSS-SECTION RAY TRACING (ID/OD BOUNCE)'
                      : isAr
                      ? 'تتبع الأشعة داخل عينة فلات مسطحة (Flat Plate Snell Refraction)'
                      : "WELD CROSS-SECTION RAY TRACING (SNELL'S REFLECTION)"}
                  </span>
                  <span className="text-cyan-400 tabular-nums">
                    · {effectiveBeamAngleDeg}° @ X={probeIndexXmm}mm, Y={probeSeamYmm}mm
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowBeamConeOverlay(!showBeamConeOverlay)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      showBeamConeOverlay
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isAr ? 'كوم الأشعة (-6/-20dB)' : 'Beam Cone (-6/-20dB)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNearFieldAndWavefronts(!showNearFieldAndWavefronts)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      showNearFieldAndWavefronts
                        ? 'bg-purple-950/70 text-purple-300 border-purple-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isAr ? 'المجال القريب NF والموجات' : 'Near-Field & Waves'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAutoScanning(!isAutoScanning)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      isAutoScanning
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isAutoScanning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isAutoScanning ? (isAr ? 'إيقاف المسح الآلي' : 'Stop Raster') : (isAr ? 'مسح آلي متعرج' : 'Auto Raster Scan')}</span>
                  </button>
                  <span className={`text-[11px] font-bold ${isHit ? 'text-rose-400' : 'text-slate-400'}`}>
                    {isHit
                      ? isAr
                        ? `تم التقاط العيب (Leg ${activeLeg})!`
                        : `FLAW DETECTED (LEG ${activeLeg})!`
                      : isAr
                      ? 'مسار صوتي حر'
                      : 'CLEAR ACOUSTIC PATH'}
                  </span>
                </div>
              </div>

              <canvas
                ref={weldCanvasRef}
                width={680}
                height={265}
                onMouseDown={(e) => {
                  setIsDraggingProbe(true);
                  updateProbeFromCanvasPointer(e.clientX);
                }}
                onMouseMove={(e) => {
                  if (isDraggingProbe) updateProbeFromCanvasPointer(e.clientX);
                }}
                onMouseUp={() => setIsDraggingProbe(false)}
                onMouseLeave={() => setIsDraggingProbe(false)}
                onTouchStart={(e) => {
                  if (e.touches[0]) updateProbeFromCanvasPointer(e.touches[0].clientX);
                }}
                onTouchMove={(e) => {
                  if (e.touches[0]) updateProbeFromCanvasPointer(e.touches[0].clientX);
                }}
                className="w-full h-56 sm:h-64 rounded-xl bg-slate-950 border border-slate-800 select-none cursor-ew-resize"
              />

              {/* Live Ultrasonic Beam Cone ("كوم الأشعة") Spatial Physics Strip */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    {isAr ? 'طول المجال القريب (Fresnel N):' : 'Near-Field Zone (N):'}
                  </span>
                  <span className="text-purple-300 font-bold">{beamConeMetrics.nearFieldLengthMm.toFixed(1)} mm</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    {isAr ? 'زاوية كوم التقييم (-6 dB):' : '-6 dB Core Cone Spread:'}
                  </span>
                  <span className="text-cyan-400 font-bold">±{beamConeMetrics.halfAngleMinus6dBDeg.toFixed(1)}°</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    {isAr ? 'زاوية الحافة الخارجية (-20 dB):' : '-20 dB Outer Cone Spread:'}
                  </span>
                  <span className="text-amber-300 font-bold">±{beamConeMetrics.halfAngleMinus20dBDeg.toFixed(1)}°</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {isAr ? 'قطر البلورة D:' : 'Crystal Ø:'}
                    </span>
                    <span className="text-emerald-300 font-bold">{beamConeMetrics.effectiveApertureMm.toFixed(1)} mm</span>
                  </div>
                  {instrumentMode === 'ut' && (
                    <div className="flex gap-1">
                      {[6, 10, 14].map((dMm) => (
                        <button
                          key={dMm}
                          type="button"
                          onClick={() => setCrystalDiameterMm(dMm)}
                          className={`px-1.5 py-0.5 rounded text-[9.5px] border cursor-pointer ${
                            crystalDiameterMm === dMm
                              ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {dMm}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dual Axis Probe Movement Controls: X Standoff + Y Weld Axis (-6dB Length Sizing) */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? 'حركة البروب العمودية X (Standoff):' : 'Probe Standoff Distance (X mm):'}</span>
                    </span>
                    <span className="text-cyan-400 font-bold tabular-nums">{probeIndexXmm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="0.5"
                    aria-label={isAr ? 'مسافة المجس من خط المركز' : 'Probe Standoff Distance'}
                    value={probeIndexXmm}
                    onChange={(e) => setProbeIndexXmm(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>{isAr ? 'حركة البروب بطول اللحام Y (لتحديد الطول -6dB):' : 'Weld Seam Axis Position (Y mm):'}</span>
                    <span className="text-amber-400 font-bold tabular-nums">{probeSeamYmm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    aria-label={isAr ? 'موضع المجس بطول خط اللحام' : 'Weld Seam Axis Position'}
                    value={probeSeamYmm}
                    onChange={(e) => setProbeSeamYmm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Curved vs Flat Geometry Math Comparison Bar (Visible when Curved Pipe is selected) */}
              {specimenGeometry === 'curved' && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="text-emerald-300 font-bold">
                    {isAr ? 'تصحيح الانحناء للعينات الأسطوانية (ASME Curvature Correction):' : 'Curved Pipe Geometry Correction (ASME Sec V):'}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-slate-300 tabular-nums">
                    <span>
                      Flat Depth: <strong>{flatCalculatedDepthMm.toFixed(1)} mm</strong>
                    </span>
                    <span>·</span>
                    <span className="text-emerald-400">
                      True Curved Depth: <strong>{curvedCalculatedDepthMm.toFixed(1)} mm</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Curved Half-Skip: <strong>{curvedHalfSkipArcMm.toFixed(1)} mm</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 1A-NF. Interactive Near-Field (Fresnel Zone) Live Equations & Axial Acoustic Pressure Curve */}
            <div className="rounded-2xl border border-purple-500/40 bg-slate-950 p-4 shadow-xl space-y-3.5 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {isAr
                      ? 'منطقة المجال القريب (Near Field / Fresnel Zone) وحساباتها الفيزيائية الحية'
                      : 'Near-Field (Fresnel Zone) Physics, Live Equations & On-Axis Pressure Curve'}
                  </span>
                </div>

                {/* Live Reflector Zone Status Badge */}
                <span
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 tabular-nums ${
                    nearFieldAssessment.zone === 'near_field'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                      : nearFieldAssessment.zone === 'transition_focus'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {nearFieldAssessment.zone === 'near_field' ? (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{nearFieldAssessment.badgeText[language]}</span>
                </span>
              </div>

              {/* 4 Step-by-Step Substituted Formula Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 tabular-nums">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400">
                    {isAr ? '1. الطول الموجي (λ = V / f):' : '1. Wavelength (λ = V / f):'}
                  </div>
                  <div className="text-sm font-black text-cyan-300">
                    λ = {beamConeMetrics.wavelengthMm.toFixed(2)} mm
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {velocityMs} m/s ÷ {probeFrequencyMhz.toFixed(1)} MHz
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-1">
                  <div className="text-[10px] text-slate-400">
                    {instrumentMode === 'paut'
                      ? isAr
                        ? '2. المجال القريب للمصفوفة (N = A²·f / 4V):'
                        : '2. Array Near Field (N = A²·f / 4V):'
                      : isAr
                      ? '2. المجال القريب الكلي (N = D²·f / 4V):'
                      : '2. Total Near Field (N = D²·f / 4V):'}
                  </div>
                  <div className="text-sm font-black text-purple-300">
                    N = {beamConeMetrics.nearFieldLengthMm.toFixed(1)} mm
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ({beamConeMetrics.effectiveApertureMm.toFixed(1)}² × {probeFrequencyMhz}) ÷ (4 × {(velocityMs / 1000).toFixed(2)})
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-1">
                  <div className="text-[10px] text-slate-400">
                    {isAr ? '3. الصافي داخل العينة (N_eff = N - N_wedge):' : '3. Specimen Effective NF (N - N_wedge):'}
                  </div>
                  <div className="text-sm font-black text-amber-300">
                    N_eff = {beamConeMetrics.effectiveNearFieldInSpecimenMm.toFixed(1)} mm
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {beamConeMetrics.nearFieldLengthMm.toFixed(1)} - {beamConeMetrics.wedgeEquivalentSteelMm.toFixed(1)} mm (Lw={isStraightZeroBeam ? 0 : wedgeTravelMm}mm)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400">
                    {isAr ? '4. زاوية التشتت sin(γ)=K·λ/D:' : '4. Beam Divergence sin(γ)=K·λ/D:'}
                  </div>
                  <div className="text-sm font-black text-emerald-300">
                    ±{beamConeMetrics.halfAngleMinus6dBDeg.toFixed(1)}° <span className="text-[10px] text-slate-400">(-6dB)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    K=0.514 (-6dB) · ±{beamConeMetrics.halfAngleMinus20dBDeg.toFixed(1)}° (-20dB, K=1.22)
                  </div>
                </div>
              </div>

              {/* Interactive Near-Field Parameter Sliders (Frequency f, Crystal D, Wedge Path Lw) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex justify-between text-[10px] text-slate-300 mb-1.5">
                    <span>{isAr ? 'تردد المجس (f):' : 'Probe Frequency (f):'}</span>
                    <span className="text-cyan-400 font-bold tabular-nums">{probeFrequencyMhz.toFixed(1)} MHz</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[1.0, 2.0, 4.0, 5.0, 10.0].map((fVal) => (
                      <button
                        key={fVal}
                        type="button"
                        onClick={() => setProbeFrequencyMhz(fVal)}
                        className={`py-1 rounded border text-[10px] cursor-pointer tabular-nums ${
                          probeFrequencyMhz === fVal
                            ? 'bg-purple-600 text-white border-purple-400 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {fVal}M
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                    <span>
                      {instrumentMode === 'paut'
                        ? isAr
                          ? 'الفتحة الفعالة A = n×p:'
                          : 'Active Aperture A = n×p:'
                        : isAr
                        ? 'قطر البلورة (D):'
                        : 'Crystal Diameter (D):'}
                    </span>
                    <span className="text-purple-300 font-bold tabular-nums">
                      {beamConeMetrics.effectiveApertureMm.toFixed(1)} mm
                    </span>
                  </div>
                  {instrumentMode === 'ut' ? (
                    <input
                      type="range"
                      min="6"
                      max="24"
                      step="2"
                      aria-label={isAr ? 'قطر بلورة المجس' : 'Crystal Diameter'}
                      value={crystalDiameterMm}
                      onChange={(e) => setCrystalDiameterMm(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      {([16, 32, 64] as const).map((el) => (
                        <button
                          key={el}
                          type="button"
                          onClick={() => setPautApertureElements(el)}
                          className={`py-1 rounded border text-[10px] cursor-pointer ${
                            pautApertureElements === el
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {el}E ({(el * pautElementPitchMm).toFixed(1)}mm)
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                    <span>{isAr ? 'طول مسار الويدج (Lw):' : 'Wedge Sound Path (Lw):'}</span>
                    <span className="text-amber-300 font-bold tabular-nums">
                      {isStraightZeroBeam ? '0 mm (0° Direct)' : `${wedgeTravelMm} mm`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="2"
                    disabled={isStraightZeroBeam}
                    aria-label={isAr ? 'طول مسار الويدج' : 'Wedge Sound Path'}
                    value={isStraightZeroBeam ? 0 : wedgeTravelMm}
                    onChange={(e) => setWedgeTravelMm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>

              {/* On-Axis Acoustic Pressure Graph: Fresnel Interference Oscillations vs Smooth Fraunhofer Far-Field Decay */}
              {(() => {
                const maxGraphPathMm = Math.max(90, Math.min(240, Math.ceil(beamConeMetrics.nearFieldLengthMm * 2.6)));
                const svgW = 640;
                const svgH = 108;
                const padL = 34;
                const padR = 14;
                const padT = 18;
                const padB = 20;
                const plotW = svgW - padL - padR;
                const plotH = svgH - padT - padB;
                const nfEff = beamConeMetrics.effectiveNearFieldInSpecimenMm;
                const nfX = padL + Math.min(1, nfEff / maxGraphPathMm) * plotW;
                const flawPinX = padL + Math.min(1, activeReflectorPathMm / maxGraphPathMm) * plotW;
                const flawPressure = beamConeMetrics.axialPressureAtPath(activeReflectorPathMm);
                const flawPinY = padT + (1 - flawPressure) * plotH;

                const pts: string[] = [];
                const sampleCount = 180;
                for (let i = 0; i <= sampleCount; i++) {
                  const sVal = (i / sampleCount) * maxGraphPathMm;
                  const pVal = beamConeMetrics.axialPressureAtPath(sVal);
                  const px = padL + (sVal / maxGraphPathMm) * plotW;
                  const py = padT + (1 - pVal) * plotH;
                  pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                }

                return (
                  <div className="rounded-xl bg-black border border-slate-800 p-2.5 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span>
                        {isAr
                          ? 'منحنى الضغط الصوتي المحوري P(S): تذبذب التداخل في المجال القريب (Fresnel) ← استقرار المجال البعيد (Fraunhofer)'
                          : 'On-Axis Acoustic Pressure P(S): Fresnel Interference Maxima/Minima (0→N_eff) vs Smooth Far-Field Decay'}
                      </span>
                      <span className="text-purple-300 tabular-nums">
                        S_flaw = {activeReflectorPathMm.toFixed(1)}mm · S/N_eff = {nearFieldAssessment.ratioSOverN}×
                      </span>
                    </div>

                    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-28 block select-none">
                      {/* Shaded Fresnel Near-Field Zone */}
                      {nfEff > 0 && (
                        <rect
                          x={padL}
                          y={padT}
                          width={Math.max(2, nfX - padL)}
                          height={plotH}
                          fill="rgba(168, 85, 247, 0.18)"
                        />
                      )}
                      {/* Safe Fraunhofer Far-Field Zone */}
                      <rect
                        x={nfX}
                        y={padT}
                        width={Math.max(2, padL + plotW - nfX)}
                        height={plotH}
                        fill="rgba(16, 185, 129, 0.06)"
                      />
                      {/* Axes */}
                      <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#334155" strokeWidth="1" />
                      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#334155" strokeWidth="1" />

                      {/* N_eff Transition Boundary */}
                      {nfEff > 0 && (
                        <>
                          <line
                            x1={nfX}
                            y1={padT}
                            x2={nfX}
                            y2={padT + plotH}
                            stroke="#c084fc"
                            strokeWidth="1.6"
                            strokeDasharray="4 3"
                          />
                          <text x={Math.min(svgW - 140, nfX + 4)} y={padT + 10} fill="#e9d5ff" fontSize="9" fontFamily="monospace">
                            {`Y₀⁺ Peak (N_eff=${nfEff.toFixed(1)}mm)`}
                          </text>
                        </>
                      )}

                      {/* Pressure Curve Polyline */}
                      <polyline fill="none" stroke="#38bdf8" strokeWidth="1.8" points={pts.join(' ')} />

                      {/* Current Reflector Sound Path Marker Pin */}
                      <line
                        x1={flawPinX}
                        y1={padT}
                        x2={flawPinX}
                        y2={padT + plotH}
                        stroke={nearFieldAssessment.isUnreliableAmplitudeZone ? '#f43f5e' : '#22c55e'}
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={flawPinX}
                        cy={flawPinY}
                        r="4"
                        fill={nearFieldAssessment.isUnreliableAmplitudeZone ? '#f43f5e' : '#22c55e'}
                      />

                      {/* Axis Labels */}
                      <text x={4} y={padT + 8} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">100%</text>
                      <text x={8} y={padT + plotH} fill="#64748b" fontSize="8.5" fontFamily="monospace">0%</text>
                      <text x={padL} y={svgH - 4} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">0 mm</text>
                      <text x={padL + plotW * 0.5 - 18} y={svgH - 4} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                        {`${Math.round(maxGraphPathMm * 0.5)} mm`}
                      </text>
                      <text x={padL + plotW - 38} y={svgH - 4} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                        {`${maxGraphPathMm} mm`}
                      </text>
                    </svg>

                    <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                      {nearFieldAssessment.advisory[language]}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* 1B. PAUT Sectorial S-Scan + Top C-Scan Multi-View (Rendered when PAUT Mode is selected) */}
            {instrumentMode === 'paut' && (
              <div className="rounded-2xl border border-amber-500/40 bg-black p-4 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Cpu className="w-4 h-4" />
                    <span>
                      OMNISCAN X3 MULTI-VIEW · {pautSweepMode === 'sectorial' ? 'SECTORIAL S-SCAN (35°-75°)' : 'LINEAR E-SCAN'} + ENCODED C-SCAN
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] tabular-nums">
                    <button
                      type="button"
                      onClick={() => setPautWeldOverlayVisible(!pautWeldOverlayVisible)}
                      className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                        pautWeldOverlayVisible
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {isAr ? 'شكل اللحام' : 'Weld Bevel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPautShowSkipMirror(!pautShowSkipMirror)}
                      className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                        pautShowSkipMirror
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {isAr ? 'انعكاس 1T/2T' : '1T/2T Mirror'}
                    </button>
                    {pautWeldOverlayVisible &&
                      (
                        [
                          { id: 'single_v', label: 'V' },
                          { id: 'double_v', label: 'X' },
                          { id: 'j_groove', label: 'U/J' },
                        ] as const
                      ).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setPautGrooveType(g.id)}
                          className={`px-1.5 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                            pautGrooveType === g.id
                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    <span className="text-slate-400 ml-1">
                      {pautApertureElements}E · Pitch {pautElementPitchMm}mm · Focus {pautFocalDepthMm}mm
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <canvas
                      ref={pautSScanCanvasRef}
                      width={580}
                      height={275}
                      className="w-full h-56 rounded-xl bg-slate-950 border border-slate-800 select-none cursor-crosshair"
                    />
                  </div>
                  <div className="md:col-span-4 flex flex-col justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                    <div className="text-amber-400 font-bold">{isAr ? 'محددات ارتفاع العيب (Δh):' : 'PAUT Height Calipers (Δh):'}</div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Cursor U1 (Top Tip):</span>
                        <span className="text-cyan-400 tabular-nums">{caliperU1Mm.toFixed(1)} mm</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={plateThicknessMm}
                        step="0.5"
                        value={caliperU1Mm}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setCaliperU1Mm(v);
                          setMeasuredFlawHeightMm( Number(Math.abs(caliperU2Mm - v).toFixed(1)) );
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Cursor U2 (Bottom):</span>
                        <span className="text-cyan-400 tabular-nums">{caliperU2Mm.toFixed(1)} mm</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={plateThicknessMm}
                        step="0.5"
                        value={caliperU2Mm}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setCaliperU2Mm(v);
                          setMeasuredFlawHeightMm( Number(Math.abs(v - caliperU1Mm).toFixed(1)) );
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">{isAr ? 'الارتفاع المقاس Δh:' : 'Flaw Height Δh:'}</span>
                      <span className="text-sm font-black text-cyan-400 tabular-nums">
                        {Math.abs(caliperU2Mm - caliperU1Mm).toFixed(1)} mm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Encoded Top C-Scan Strip */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>{isAr ? 'خريطة المسح العلوي المشفر C-Scan على طول اللحام (0 - 100 مم):' : 'Encoded Top C-Scan Weld Map (Y = 0 to 100 mm):'}</span>
                    <span className="text-cyan-400 tabular-nums">Encoder Y = {probeSeamYmm} mm</span>
                  </div>
                  <canvas
                    ref={pautCScanCanvasRef}
                    width={640}
                    height={54}
                    className="w-full h-14 rounded-lg bg-slate-950 border border-slate-800 select-none"
                  />
                </div>
              </div>
            )}

            {/* 1C. Oscilloscope Flaw Detector A-Scan Screen */}
            <div className="rounded-2xl border border-slate-700 bg-black p-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pb-2 border-b border-slate-800 mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-white font-bold">
                    {instrumentMode === 'paut'
                      ? `SYNCHRONIZED PAUT A-SCAN @ ${pautCursorAngleDeg}°`
                      : 'DIGITAL FLAW DETECTOR A-SCAN DISPLAY'}
                  </span>
                  <span className="text-slate-500 tabular-nums">
                    {displayDelayMm} - {displayDelayMm + rangeMm}mm · {rectification.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScanningGainActive(!isScanningGainActive)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                      isScanningGainActive ? 'bg-amber-500/20 text-amber-300 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    +6dB Scan {isScanningGainActive ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPeakHoldActive(!isPeakHoldActive);
                      setPeakEnvelope([]);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                      isPeakHoldActive ? 'bg-rose-500/20 text-rose-300 border-rose-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Peak Env {isPeakHoldActive ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFrozen(!isFrozen)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                      isFrozen ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isFrozen ? 'FROZEN' : 'FREEZE'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAlarmMuted(!isAlarmMuted)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Toggle Alarm Audio"
                  >
                    {isAlarmMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
              </div>

              <canvas
                ref={aScanCanvasRef}
                width={680}
                height={200}
                className="w-full h-44 sm:h-52 rounded-xl bg-slate-950 border border-slate-800 select-none"
              />

              {/* Digital Readouts HUD */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 font-mono text-xs tabular-nums">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">{isAr ? 'سعة الصدى (% FSH):' : 'Echo Amplitude:'}</div>
                  <div className={`text-base font-black ${isAlarmTriggered ? 'text-rose-400' : 'text-green-400'}`}>
                    {echoAmplitudePct}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">{isAr ? 'نسبة منحنى DAC:' : '% DAC Level:'}</div>
                  <div className="text-base font-black text-amber-300">{pctOfDac}%</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">{isAr ? 'المسار الصوتي (S):' : 'Sound Path (S):'}</div>
                  <div className="text-base font-black text-amber-400">{calculatedSoundPathMm.toFixed(1)} mm</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">{isAr ? 'العمق الحقيقي (D):' : 'True Depth (D):'}</div>
                  <div className="text-base font-black text-cyan-400">{calculatedDepthMm.toFixed(1)} mm</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-slate-500 text-[10px]">{isAr ? 'المسافة السطحية (X):' : 'Surface Dist (X):'}</div>
                  <div className="text-base font-black text-slate-200">{calculatedSurfaceDistMm.toFixed(1)} mm</div>
                </div>
              </div>

              {/* Interactive Hands-On -6 dB Drop Length Sizing Recorder */}
              <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="text-slate-300">
                  {isAr
                    ? 'قياس طول العيب عملياً (-6 dB Drop): حرك Y حتى تهبط السعة لنصف قيمتها وسجّل الطرفين:'
                    : 'Hands-on -6 dB Drop Sizing: Move Y until echo drops 50% and capture endpoints:'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRecord6dBStart}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 cursor-pointer"
                  >
                    {isAr ? `بداية العيب Y1${drop6dBY1 !== null ? ` (${drop6dBY1}mm)` : ''}` : `Set Y1${drop6dBY1 !== null ? ` (${drop6dBY1}mm)` : ''}`}
                  </button>
                  <button
                    type="button"
                    onClick={handleRecord6dBEnd}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 cursor-pointer"
                  >
                    {isAr ? `نهاية العيب Y2${drop6dBY2 !== null ? ` (${drop6dBY2}mm)` : ''}` : `Set Y2${drop6dBY2 !== null ? ` (${drop6dBY2}mm)` : ''}`}
                  </button>
                  <span className="text-amber-400 font-bold tabular-nums">
                    ΔL = {measuredFlawLengthMm.toFixed(1)} mm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Complete Hardware Keypad (Adapts between Full UT & Full PAUT Keys) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/85 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>
                    {instrumentMode === 'paut'
                      ? isAr
                        ? 'مفاتيح جهاز PAUT والمصفوفة الطورية'
                        : 'PAUT Focal Law & Hardware Console'
                      : isAr
                      ? 'لوحة مفاتيح جهاز UT الكاملة'
                      : 'Complete UT Hardware Keypad'}
                  </span>
                </span>
                <span className="text-cyan-400 font-bold tabular-nums">{gainDb.toFixed(1)} dB</span>
              </div>

              {/* Angle Beam Buttons (0° Long. + 45°, 60°, 70° Shear) */}
              <div>
                <div className="text-slate-400 text-[11px] mb-1">
                  {isAr ? 'زاوية المجس القياسية (Wedge Angle):' : 'Probe Wedge Angle:'}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProbeAngleDeg(0);
                      setVelocityMs(5920);
                    }}
                    className={`py-1.5 rounded border font-bold transition cursor-pointer text-[11px] ${
                      effectiveBeamAngleDeg === 0
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    0° Long.
                  </button>
                  {[45, 60, 70].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        setProbeAngleDeg(deg);
                        setPautCursorAngleDeg(deg);
                        setVelocityMs(3240);
                      }}
                      className={`py-1.5 rounded border font-bold transition cursor-pointer text-[11px] ${
                        effectiveBeamAngleDeg === deg
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {deg}° Shear
                    </button>
                  ))}
                </div>
              </div>

              {/* Precision Receiver Gain Keys (-6, -1, -0.5, +0.5, +1, +6 + Auto 80% FSH) */}
              <div>
                <div className="text-slate-400 text-[11px] mb-1 flex justify-between">
                  <span>{isAr ? 'مفاتيح الكسب الدقيقة (Gain dB):' : 'System Gain Keys (dB):'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (echoAmplitudePct > 2) {
                        const dbDiff = 20 * Math.log10(80 / echoAmplitudePct);
                        setGainDb((prev) => Number(Math.min(100, Math.max(0, prev + dbDiff)).toFixed(1)));
                      } else {
                        setGainDb(48.0);
                      }
                    }}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    {isAr ? 'ضبط تلقائي 80% FSH' : 'Set Ref 80% FSH'}
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[-6, -1, -0.5, 0.5, 1, 6].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setGainDb((prev) => Number(Math.min(100, Math.max(0, prev + step)).toFixed(1)))}
                      className="py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-200 hover:text-white transition cursor-pointer text-[10px] tabular-nums"
                    >
                      {step > 0 ? `+${step}` : `${step}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* PAUT Specific Controls: Active Cursor Angle, Aperture, Focal Depth, Sweep Mode */}
              {instrumentMode === 'paut' ? (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>{isAr ? 'مؤشر زاوية المسح القطاعي (35°-75°):' : 'Sectorial Beam Cursor (35°-75°):'}</span>
                      <span className="text-amber-400 font-bold tabular-nums">{pautCursorAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="75"
                      step="1"
                      value={pautCursorAngleDeg}
                      onChange={(e) => setPautCursorAngleDeg(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">{isAr ? 'العناصر الفعالة (Aperture):' : 'Active Aperture:'}</div>
                      <div className="grid grid-cols-3 gap-1">
                        {([16, 32, 64] as const).map((el) => (
                          <button
                            key={el}
                            type="button"
                            onClick={() => setPautApertureElements(el)}
                            className={`py-1 rounded border text-[10px] cursor-pointer ${
                              pautApertureElements === el ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {el}E
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">{isAr ? 'نمط المسح:' : 'Scan Law Mode:'}</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setPautSweepMode('sectorial')}
                          className={`py-1 rounded border text-[10px] cursor-pointer ${
                            pautSweepMode === 'sectorial' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          S-Scan
                        </button>
                        <button
                          type="button"
                          onClick={() => setPautSweepMode('linear')}
                          className={`py-1 rounded border text-[10px] cursor-pointer ${
                            pautSweepMode === 'linear' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          E-Scan
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>{isAr ? 'عمق البؤرة (Focal Depth):' : 'Focal Depth:'}</span>
                      <span className="text-amber-400 tabular-nums">{pautFocalDepthMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={pautFocalDepthMm}
                      onChange={(e) => setPautFocalDepthMm(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Live Focal Law Element Delay Profile */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 tabular-nums">
                      <span>FOCAL LAW DELAYS (EL #{pautStartElement}..#{pautStartElement + pautApertureElements - 1})</span>
                      <span className="text-amber-400">{maxDelayNs} ns</span>
                    </div>
                    <div className="h-8 flex items-end gap-0.5">
                      {elementDelaysNs.slice(0, 32).map((ns, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-amber-400/85 rounded-t"
                          style={{ height: `${Math.max(12, Math.round((ns / maxDelayNs) * 100))}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Conventional UT Timebase, Rectification, Pulser & Dual Gates */
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">{isAr ? 'نطاق الشاشة (Range mm):' : 'Timebase Range:'}</div>
                    <div className="grid grid-cols-5 gap-1">
                      {[50, 100, 150, 200, 250].map((rVal) => (
                        <button
                          key={rVal}
                          type="button"
                          onClick={() => setRangeMm(rVal)}
                          className={`py-1 rounded border text-[10px] cursor-pointer ${
                            rangeMm === rVal ? 'bg-cyan-600 text-white border-cyan-400 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {rVal}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">{isAr ? 'تقويم الموجة (Rectification):' : 'Rectification Mode:'}</div>
                    <div className="grid grid-cols-4 gap-1">
                      {([
                        { id: 'full', label: 'Full' },
                        { id: 'positive', label: '+Half' },
                        { id: 'negative', label: '-Half' },
                        { id: 'rf', label: 'RF' },
                      ] as const).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setRectification(m.id)}
                          className={`py-1 rounded border text-[10px] cursor-pointer ${
                            rectification === m.id ? 'bg-cyan-600 text-white border-cyan-400 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">{isAr ? 'جهد النابض (Voltage):' : 'Pulser Voltage:'}</div>
                      <div className="grid grid-cols-3 gap-1">
                        {([100, 200, 400] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setPulserVoltageV(v)}
                            className={`py-1 rounded border text-[10px] cursor-pointer ${
                              pulserVoltageV === v ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {v}V
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">{isAr ? 'حذف الضوضاء (Reject):' : 'Linear Reject:'}</div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="2"
                        value={rejectPct}
                        onChange={(e) => setRejectPct(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dual Gates A & B Controls */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveGateEdit('A')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        activeGateEdit === 'A' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Gate A
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGateEdit('B')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        activeGateEdit === 'B' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Gate B
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {activeGateEdit === 'A'
                      ? `${gateAStartMm}..${gateAStartMm + gateAWidthMm}mm (${gateAThresholdPct}%)`
                      : `${gateBStartMm}..${gateBStartMm + gateBWidthMm}mm (${gateBThresholdPct}%)`}
                  </span>
                </div>

                {activeGateEdit === 'A' ? (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{isAr ? 'بداية البوابة A:' : 'Gate A Start:'}</span>
                      <span className="text-cyan-400 tabular-nums">{gateAStartMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="1"
                      value={gateAStartMm}
                      onChange={(e) => setGateAStartMm(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{isAr ? 'عتبة الإنذار A (%):' : 'Gate A Threshold:'}</span>
                      <span className="text-cyan-400 tabular-nums">{gateAThresholdPct}% FSH</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={gateAThresholdPct}
                      onChange={(e) => setGateAThresholdPct(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{isAr ? 'بداية البوابة B:' : 'Gate B Start:'}</span>
                      <span className="text-amber-400 tabular-nums">{gateBStartMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="160"
                      step="1"
                      value={gateBStartMm}
                      onChange={(e) => setGateBStartMm(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{isAr ? 'عتبة البوابة B (%):' : 'Gate B Threshold:'}</span>
                      <span className="text-amber-400 tabular-nums">{gateBThresholdPct}% FSH</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={gateBThresholdPct}
                      onChange={(e) => setGateBThresholdPct(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Flaw Acoustic Signature & Evaluation Hint Card */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'بصمة الصدى وتشخيص العيب' : 'Echo Signature & Flaw Diagnosis'}</span>
                </span>
                <span className={currentFlaw.category === 'Planar' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                  {currentFlaw.category}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{currentFlaw.description[language]}</p>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div>
                  <span className="text-cyan-400 font-bold">{isAr ? 'شكل الإشارة على الجهاز: ' : 'Screen Echo Behavior: '}</span>
                  <span>{currentFlaw.echoSignature[language]}</span>
                </div>
                <div>
                  <span className="text-amber-400 font-bold">{isAr ? 'تفاعل كوم الأشعة: ' : 'Beam Cone Interaction: '}</span>
                  <span>{currentFlaw.beamInteractionNote[language]}</span>
                </div>

                {/* Live Allowable Tolerance per Selected Code */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">
                      {isAr ? `سماحية العيب (${activeCodeMeta.shortLabel}):` : `Allowable Tolerance (${activeCodeMeta.shortLabel}):`}
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        activeTolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'
                      }`}
                    >
                      {activeTolerance.toleranceBadge[language]}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{activeTolerance.toleranceRuleSummary[language]}</div>
                </div>

                <div className="pt-1 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'تقييم الكود الفوري:' : 'Instant Code Verdict:'}</span>
                  <button
                    type="button"
                    onClick={() => setActiveStep('code_eval')}
                    className={`font-bold underline cursor-pointer ${isCodeReject ? 'text-rose-400' : 'text-emerald-400'}`}
                  >
                    {isCodeReject ? 'REJECT -> تفاصيل التقييم' : 'ACCEPT -> تفاصيل التقييم'}
                  </button>
                </div>
              </div>

              {/* Record Inspection Attempt to Training Results Dashboard Below */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">
                    {isAr ? 'قرارك كفاحص للتسجيل بالنتائج:' : 'Your Inspector Disposition:'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTraineeDisposition('ACCEPT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        traineeDisposition === 'ACCEPT'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      ACCEPT
                    </button>
                    <button
                      type="button"
                      onClick={() => setTraineeDisposition('REJECT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        traineeDisposition === 'REJECT'
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      REJECT
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogAttemptToTrainingResults}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'تسجيل الفحص في النتائج التدريبية بالأسفل'
                      : 'Log Inspection to Training Results'}
                  </span>
                </button>
                {lastLoggedScoreToast && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[10.5px]">
                    {lastLoggedScoreToast}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 2: INTERACTIVE CALIBRATION SIMULATOR & COMPLETE HARDWARE KEYS
         ===================================================================== */}
      {activeStep === 'calibration' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>
                  {isAr
                    ? 'محاكي تدريب الكالبريشن التفاعلي وجميع مفاتيح ضبط الأجهزة (UT & PAUT Calibration Lab)'
                    : 'Interactive Step-by-Step Calibration Simulator & Complete Hardware Keys'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'تعلّم خطوات معايرة جهازي UT و PAUT عملياً على البلوكات القياسية (IIW V1, V2, ASME SDH, وبلوك الأنبوب المنحني) من ضبط السرعة والصفر حتى منحنى DAC و TCG.'
                  : 'Hands-on training for UT & PAUT calibration on IIW V1, V2, ASME SDH, and Curved Pipe reference blocks.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playCalibrationSuccessPing();
                setIsAutoCalDone(true);
                setVelocityMs(3240);
                setZeroDelayUs(1.25);
                setRangeMm(100);
                setGainDb(48);
                setPautTcgEqualized(true);
                setCalCompletedSteps([1, 2, 3, 4, 5]);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isAr ? 'معايرة تلقائية نموذجية (Auto-Cal Standard)' : 'Auto-Cal Standard (V1/ASME)'}</span>
            </button>
          </div>

          {/* Interactive 5-Step Calibration Coach + Live Reference Block Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Guided 5-Step Calibration Checklist */}
            <div className="lg:col-span-6 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'خطوات الكالبريشن العملية الـ 5 (اضغط للتطبيق والتحقق):' : '5-Step Practical Calibration Procedure:'}</span>
                </span>
                <span className="text-cyan-400 tabular-nums">{calCompletedSteps.length}/5 {isAr ? 'مكتمل' : 'Verified'}</span>
              </div>

              {[
                {
                  step: 1,
                  title: isAr ? '1. معايرة سرعة الصوت (Material Sound Velocity)' : '1. Calibrate Material Velocity (c = 3240 / 5920 m/s)',
                  desc: isAr
                    ? 'ضع المجس على قوس R100 ببلوك IIW V1 واضبط السرعة حتى ينطبق الصدى الأول عند 100 مم والثاني عند 200 مم.'
                    : 'Place probe on IIW V1 R100 slot and adjust velocity until echoes align at 100mm & 200mm.',
                  apply: () => {
                    setActiveCalBlock('iiw_v1');
                    setCalTargetSpot('r100_arc');
                    setVelocityMs(3240);
                    toggleCalStepDone(1);
                  },
                },
                {
                  step: 2,
                  title: isAr ? '2. معايرة صفر المجس وتأخير الويدج (Probe Zero / Wedge Delay)' : '2. Calibrate Probe Zero / PAUT Wedge Delay (µs)',
                  desc: isAr
                    ? 'عوض زمن مرور الموجة داخل بلاستيك الويدج (Perspex) ليبدأ الصفر الحقيقي من سطح المعدن (1.25 µs).'
                    : 'Compensate transit time inside Perspex wedge so 0.0mm starts strictly at specimen entry surface.',
                  apply: () => {
                    setActiveCalBlock('iiw_v1');
                    setCalTargetSpot('r100_arc');
                    setZeroDelayUs(1.25);
                    toggleCalStepDone(2);
                  },
                },
                {
                  step: 3,
                  title: isAr ? '3. تحديد نقطة خروج الشعاع والتحقق من الزاوية (Index & Angle)' : '3. Verify Beam Index Point & Refracted Angle (θ)',
                  desc: isAr
                    ? 'وجه المجس نحو ثقب Ø1.5mm SDH وحركه ذهاباً وإياباً لأقصى قمة (Max Peak) للتأكد من دقة الزاوية (60° ± 2°).'
                    : 'Maximize echo on Ø1.5mm SDH target to mark true Beam Index Point and verify refracted angle.',
                  apply: () => {
                    setActiveCalBlock('iiw_v1');
                    setCalTargetSpot('sdh_angle');
                    setProbeAngleDeg(60);
                    toggleCalStepDone(3);
                  },
                },
                {
                  step: 4,
                  title:
                    instrumentMode === 'paut'
                      ? isAr
                        ? '4. موازنة حساسية الزوايا والعمق (PAUT ACG + 3-Point TCG)'
                        : '4. Equalize PAUT Angular (ACG) & Time-Corrected Gain (TCG)'
                      : isAr
                      ? '4. بناء منحنى تصحيح السعة بالمسافة (3-Point ASME DAC Curve)'
                      : '4. Construct 3-Point ASME SDH DAC Curve (1/4T, 1/2T, 3/4T)',
                  desc: isAr
                    ? 'سجل قمم الثقوب الجانبية عند أعماق 1/4T و 1/2T و 3/4T على بلوك ASME (أو البلوك المنحني للأنابيب) عند 80% FSH.'
                    : 'Record Side-Drilled Hole peaks at 1/4T, 1/2T, and 3/4T depths on ASME or Curved Pipe reference block.',
                  apply: () => {
                    setActiveCalBlock(specimenGeometry === 'curved' ? 'curved_pipe_block' : 'asme_basic');
                    setCalTargetSpot('sdh_dac_2');
                    setIsDacEnabled(true);
                    setPautTcgEqualized(true);
                    setDacPoints([
                      { soundPathMm: 22, amplitudePct: 80 },
                      { soundPathMm: 48, amplitudePct: 62 },
                      { soundPathMm: 78, amplitudePct: 44 },
                    ]);
                    toggleCalStepDone(4);
                  },
                },
                {
                  step: 5,
                  title: isAr ? '5. تصحيح الفقد السطحي وإضافة +6dB للمسح (Transfer & Scan Gain)' : '5. Apply Transfer Correction & +6 dB Scanning Gain',
                  desc: isAr
                    ? 'أضف +6 dB كسب مسح استكشافي لضمان عدم تفويت أي عيب أثناء المسح اليدوي، ثم أعده للمرجع عند التقييم.'
                    : 'Add +6 dB scanning sensitivity margin during search scan; remove prior to code amplitude evaluation.',
                  apply: () => {
                    setIsScanningGainActive(true);
                    toggleCalStepDone(5);
                  },
                },
              ].map((item) => {
                const done = calCompletedSteps.includes(item.step);
                return (
                  <div
                    key={item.step}
                    onClick={item.apply}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      done
                        ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-1 rounded mt-0.5 shrink-0 ${done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Calibration Block Canvas & Target Selector */}
            <div className="lg:col-span-6 space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-black p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-white font-bold">
                    {isAr ? 'محاكي بلوك المعايرة التفاعلي:' : 'Interactive Reference Calibration Block:'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {([
                      { id: 'iiw_v1', label: 'IIW V1' },
                      { id: 'iiw_v2', label: 'IIW V2' },
                      { id: 'asme_basic', label: 'ASME SDH' },
                      { id: 'curved_pipe_block', label: isAr ? 'بلوك كيرف أنبوب' : 'Curved Block' },
                    ] as const).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          playCalibrationClick();
                          setActiveCalBlock(b.id);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                          activeCalBlock === b.id ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <canvas
                  ref={calBlockCanvasRef}
                  width={540}
                  height={220}
                  className="w-full h-52 rounded-xl bg-slate-950 border border-slate-800 select-none"
                />

                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCalTargetSpot('r100_arc')}
                    className={`py-1.5 rounded border cursor-pointer ${
                      calTargetSpot === 'r100_arc' ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {isAr ? 'قوس R100 (السرعة والصفر)' : 'R100 Arc (Vel & Zero)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalTargetSpot('sdh_angle')}
                    className={`py-1.5 rounded border cursor-pointer ${
                      calTargetSpot === 'sdh_angle' ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {isAr ? 'ثقب التحقق من الزاوية' : 'SDH Angle Verification'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCalBlock('asme_basic');
                      setCalTargetSpot('sdh_dac_2');
                    }}
                    className={`py-1.5 rounded border cursor-pointer ${
                      calTargetSpot.startsWith('sdh_dac') ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {isAr ? 'ثقوب 1/4T · 1/2T · 3/4T DAC' : '1/4T-3/4T DAC/TCG Holes'}
                  </button>
                </div>

                {isAutoCalDone && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    {isAr
                      ? 'تمت المعايرة القياسية بنجاح: السرعة 3240 m/s · الصفر 1.25 µs · منحنى DAC / TCG مفعل ومعتمد.'
                      : 'Calibration Verified: Shear Velocity 3240 m/s · Zero 1.25 µs · 3-Point DAC/TCG Active.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complete Hardware Parameter Banks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs pt-2">
            {/* 1. Velocity & Probe Zero */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-cyan-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Compass className="w-4 h-4" />
                <span>1. VELOCITY & PROBE ZERO (µs)</span>
              </div>

              <div>
                <div className="text-slate-400 text-[11px] mb-1">{isAr ? 'سرعة الصوت في الخامة:' : 'Material Acoustic Velocity:'}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={velocityMs}
                    onChange={(e) => setVelocityMs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white tabular-nums"
                  />
                  <span className="text-slate-400">m/s</span>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setVelocityMs(3240)}
                    className={`py-1 text-[10px] rounded border cursor-pointer ${velocityMs === 3240 ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    Steel Shear (3240)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVelocityMs(5920)}
                    className={`py-1 text-[10px] rounded border cursor-pointer ${velocityMs === 5920 ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    Steel Long. (5920)
                  </button>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px] mb-1">{isAr ? 'تأخير صفر المجس / الويدج:' : 'Probe / Wedge Zero Delay:'}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    value={zeroDelayUs}
                    onChange={(e) => setZeroDelayUs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white tabular-nums"
                  />
                  <span className="text-slate-400">µs</span>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px] mb-1">{isAr ? 'إزاحة العرض (Display Delay):' : 'Display Delay (mm):'}</div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={displayDelayMm}
                  onChange={(e) => setDisplayDelayMm(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. Pulser & Receiver */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Cpu className="w-4 h-4" />
                <span>2. PULSER & RECEIVER (P/R)</span>
              </div>

              <div>
                <div className="text-slate-400 text-[11px] mb-1">{isAr ? 'مقاومة التخميد (Damping):' : 'Damping:'}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDamping('50_ohm')}
                    className={`py-1.5 rounded border font-bold text-[10px] cursor-pointer ${damping === '50_ohm' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    50 Ω (Resolution)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDamping('500_ohm')}
                    className={`py-1.5 rounded border font-bold text-[10px] cursor-pointer ${damping === '500_ohm' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    500 Ω (Penetration)
                  </button>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px] mb-1">{isAr ? 'مرشح التردد (Bandpass Filter):' : 'Bandpass Filter:'}</div>
                <div className="grid grid-cols-2 gap-1">
                  {(['broadband', '2mhz', '4mhz', '5mhz'] as const).map((flt) => (
                    <button
                      key={flt}
                      type="button"
                      onClick={() => {
                        setBandpassFilter(flt);
                        if (flt === '2mhz') setProbeFrequencyMhz(2.0);
                        if (flt === '4mhz') setProbeFrequencyMhz(4.0);
                        if (flt === '5mhz') setProbeFrequencyMhz(5.0);
                      }}
                      className={`py-1 rounded border text-[10px] uppercase cursor-pointer ${
                        bandpassFilter === flt ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {flt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px] mb-1">{isAr ? 'تردد تكرار النبضات (PRF):' : 'Pulse Repetition Freq (PRF):'}</div>
                <div className="grid grid-cols-4 gap-1">
                  {([100, 250, 500, 1000] as const).map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      onClick={() => setPrfHz(hz)}
                      className={`py-1 rounded border text-[10px] cursor-pointer ${
                        prfHz === hz ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {hz}Hz
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Calibration Block & DAC */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-green-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Layers className="w-4 h-4" />
                <span>3. CALIBRATION BLOCK & DAC</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>{isAr ? 'منحنى DAC ثلاثي النقاط:' : '3-Point DAC Curve:'}</span>
                  <button
                    type="button"
                    onClick={() => setIsDacEnabled(!isDacEnabled)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${isDacEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}
                  >
                    DAC {isDacEnabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
                <div className="space-y-1 text-[10px] text-slate-400 tabular-nums">
                  {dacPoints.map((pt, i) => (
                    <div key={i} className="flex justify-between bg-slate-900 px-2 py-1 rounded">
                      <span>Point #{i + 1}: S = {pt.soundPathMm} mm</span>
                      <span className="text-amber-400 font-bold">{pt.amplitudePct}% FSH</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const sNew = calculatedSoundPathMm > 0 ? Math.round(calculatedSoundPathMm) : 35;
                    const aNew = echoAmplitudePct > 5 ? echoAmplitudePct : 75;
                    setDacPoints((prev) => [...prev, { soundPathMm: sNew, amplitudePct: aNew }].sort((a, b) => a.soundPathMm - b.soundPathMm).slice(0, 5));
                  }}
                  className="py-1.5 rounded bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold cursor-pointer hover:bg-emerald-600/40"
                >
                  {isAr ? '+ تسجيل نقطة DAC' : '+ Record DAC Pt'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDacPoints([
                      { soundPathMm: 22, amplitudePct: 80 },
                      { soundPathMm: 48, amplitudePct: 62 },
                      { soundPathMm: 78, amplitudePct: 44 },
                    ])
                  }
                  className="py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] cursor-pointer hover:text-white"
                >
                  {isAr ? 'استعادة 3 نقاط ASME' : 'Reset 3-Pt ASME'}
                </button>
              </div>
            </div>

            {/* 4. PAUT Array, Wedge & TCG Calibration */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-sky-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Activity className="w-4 h-4" />
                <span>4. PAUT FOCAL LAW & TCG</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>{isAr ? 'عنصر البداية (Start Element):' : 'Start Element:'}</span>
                  <span className="text-sky-400 tabular-nums">#{pautStartElement}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(1, 65 - pautApertureElements)}
                  value={pautStartElement}
                  onChange={(e) => setPautStartElement(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-1">{isAr ? 'خطوة العناصر (Element Pitch):' : 'Element Pitch (mm):'}</div>
                <div className="grid grid-cols-3 gap-1">
                  {[0.5, 0.6, 1.0].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPautElementPitchMm(p)}
                      className={`py-1 rounded border text-[10px] cursor-pointer ${
                        pautElementPitchMm === p ? 'bg-sky-600 text-white border-sky-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {p} mm
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPautTcgEqualized(!pautTcgEqualized)}
                className={`w-full py-1.5 rounded border text-[10px] font-bold cursor-pointer ${
                  pautTcgEqualized ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {pautTcgEqualized ? 'ACG + TCG EQUALIZED ✓' : 'CALIBRATE ACG + TCG'}
              </button>
            </div>
          </div>

          {/* Full V1 (ISO 2400) & V2 (ISO 7963) Blocks + 7-Stage Code Calibration & Weld Start-Check Simulator */}
          <div className="pt-4 border-t border-slate-800">
            <V1V2CalibrationLab
              language={language}
              onCompleteAndProceedToWeld={(cal) => {
                setVelocityMs(cal.velocityMs);
                setZeroDelayUs(cal.zeroDelayUs);
                setProbeAngleDeg(cal.probeAngleDeg);
                setGainDb(cal.gainDb);
                setRangeMm(cal.rangeMm);
                setIsScanningGainActive(cal.scanningGainActive);
                setIsAutoCalDone(true);
                setCalCompletedSteps([1, 2, 3, 4, 5]);
                setActiveStep('scan_inspect');
              }}
            />
          </div>

          {/* Dedicated Step-by-Step ASME DAC Curve & Specimen Thickness Attenuation Builder */}
          <div className="pt-4">
            <DacCalibrationBuilder
              language={language}
              onSyncDacPoints={(points, refGainDb) => {
                playCalibrationSuccessPing();
                setDacPoints(points);
                setGainDb(refGainDb);
                setIsDacEnabled(true);
              }}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 3: HOW TO EVALUATE FLAWS & MULTI-CODE COMPLIANCE ENGINE
         ===================================================================== */}
      {activeStep === 'code_eval' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>
                  {isAr
                    ? 'منهجية تقييم العيوب ومطابقتها بالأكواد الهندسية: ما المرفوض وما المسموح؟'
                    : 'Code Compliance & Flaw Acceptance Engine'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'تعلّم كيف يقيم مهندس المستوى الثاني والثالث (Level II / III) العيب المكتشف من حيث الطبيعة والطول والارتفاع والسعة مقابل حدود القبول والرفض.'
                  : 'Evaluate flaw nature, -6 dB length, height Δh, and % DAC amplitude against ASME Sec VIII, B31.3, AWS D1.1, and API 1104.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {INSPECTION_CODES_META.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCode(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                    selectedCode === c.id
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {c.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Code Verdict Banner */}
          <div
            className={`p-5 rounded-2xl border-2 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isCodeReject
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 ${isCodeReject ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'}`}>
                {isCodeReject ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-xs font-mono text-slate-300">{codeClauseCitation}</div>
                <div className="text-xl sm:text-2xl font-black mt-0.5">
                  {isCodeReject
                    ? isAr
                      ? 'القرار: مرفوض قطعياً (VERDICT: REJECTED / UNACCEPTABLE)'
                      : 'VERDICT: REJECTED / UNACCEPTABLE'
                    : isAr
                    ? 'القرار: مقبول هندسياً (VERDICT: ACCEPTED / COMPLIANT)'
                    : 'VERDICT: ACCEPTED / COMPLIANT'}
                </div>
                <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-slate-200">{codeExplanation}</p>
              </div>
            </div>

            <div className="shrink-0 p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-center tabular-nums">
              <div className="text-[10px] text-slate-400">{isAr ? 'أبعاد العيب المقاسة:' : 'Measured Sizing:'}</div>
              <div className="text-base font-bold text-amber-400">{currentFlaw.category}</div>
              <div className="text-xs text-slate-200 mt-1">
                L = {measuredFlawLengthMm.toFixed(1)} mm · Δh = {measuredFlawHeightMm.toFixed(1)} mm
              </div>
            </div>
          </div>

          {/* Interactive Sizing Controls: 6 dB Drop Length + Tip Diffraction Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  {isAr ? '1. قياس طول العيب بطريقة هبوط 6 ديسيبل (-6 dB Drop Length):' : '1. Flaw Length Sizing via 6 dB Drop (L):'}
                </span>
                <span className="text-cyan-400 font-bold tabular-nums">{measuredFlawLengthMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="2"
                max="35"
                step="0.5"
                value={measuredFlawLengthMm}
                onChange={(e) => setMeasuredFlawLengthMm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>2 mm (Isolated)</span>
                <span>6 mm (ASME UW-51 Limit @ t=25mm)</span>
                <span>35 mm (Extended)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  {isAr ? '2. قياس ارتفاع العيب بحيود القمة (Tip Diffraction Height Δh):' : '2. Flaw Through-Wall Height Sizing (Δh):'}
                </span>
                <span className="text-amber-400 font-bold tabular-nums">{measuredFlawHeightMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.5"
                value={measuredFlawHeightMm}
                onChange={(e) => setMeasuredFlawHeightMm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5 mm</span>
                <span>3.5 mm (Root Crack Height)</span>
                <span>12.0 mm</span>
              </div>
            </div>
          </div>

          {/* 4-Stage Educational Guide: How Inspectors Evaluate Indications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              {
                title: isAr ? 'الخطوة 1: تعظيم الصدى (Maximization)' : 'Step 1: Echo Maximization',
                body: isAr
                  ? 'حرك المجس للأمام والخلف (X) مع دوران طفيف (±10° Swivel) للوصول لأعلى قمة صدى وتسجيل S و D.'
                  : 'Scan X standoff with ±10° orbital swivel to peak echo amplitude and read true Sound Path S & Depth D.',
              },
              {
                title: isAr ? 'الخطوة 2: تصنيف النوع (Characterization)' : 'Step 2: Planar vs Volumetric',
                body: isAr
                  ? 'لاحظ شكل الموجة عند الدوران: الشرخ ونقص الانصهار يهبط فجأة (Planar)، بينما الخبث والمسام يحافظ على قمم متعددة.'
                  : 'Observe angular drop-off: planar cracks/LOF drop sharply off-normal; volumetric slag shows multi-peak echoes.',
              },
              {
                title: isAr ? 'الخطوة 3: تحجيم الأبعاد (-6dB & Δh)' : 'Step 3: Length & Height Sizing',
                body: isAr
                  ? 'حرك المجس موازياً للحام (Y) حتى تنخفض القمة بمقدار النصف (-6 dB) لقياس الطول L، واستخدم PAUT S-Scan لقياس Δh.'
                  : 'Move parallel to weld (Y) until peak drops 50% (-6 dB) for length L, and read crack tip diffraction for Δh.',
              },
              {
                title: isAr ? 'الخطوة 4: قرار القبول أو الرفض' : 'Step 4: Code Disposition',
                body: isAr
                  ? 'تُرفض العيوب التي تتخطى 20% DAC إن كانت مستوية، وتُقارن العيوب الحجمية بحد الطول الأقصى للكود المختار.'
                  : 'Reject all planar flaws regardless of length; compare volumetric inclusions >20% DAC against max length tables.',
              },
            ].map((card, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-400">{card.title}</div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          {/* Multi-Code Side-by-Side Comparison Matrix for Active Defect */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-start border-collapse font-mono text-xs tabular-nums">
              <thead>
                <tr className="bg-slate-900 text-slate-300 text-[11px]">
                  <th className="p-3 border-b border-slate-800 text-start">{isAr ? 'الكود المرجعي' : 'Standard Code'}</th>
                  <th className="p-3 border-b border-slate-800 text-start">{isAr ? 'سماحية هذا العيب في الكود' : 'Allowable Tolerance'}</th>
                  <th className="p-3 border-b border-slate-800 text-start">{isAr ? 'شرط السعة والفقرة' : 'Clause & Amplitude Rule'}</th>
                  <th className="p-3 border-b border-slate-800 text-start">{isAr ? 'القرار الحالي' : 'Disposition'}</th>
                </tr>
              </thead>
              <tbody>
                {(['asme_viii', 'asme_b31_3', 'aws_d1_1', 'api_1104', 'iso_11666'] as const).map((codeId) => {
                  const res = evaluateAgainstCode(codeId);
                  return (
                    <tr key={codeId} className="border-b border-slate-800/70 text-slate-300">
                      <td className="p-3 font-bold text-white">{res.citation}</td>
                      <td className="p-3 font-bold">
                        <span className={res.tolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'}>
                          {res.limitText}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {res.clauseRef} · {res.tolerance.amplitudeCriterion[language]}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${res.reject ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {res.reject ? (isAr ? 'مرفوض (REJECT)' : 'REJECT') : (isAr ? 'مقبول (ACCEPT)' : 'ACCEPT')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Complete 16-Defect Allowable Tolerance Schedule for Active Selected Code & Thickness t */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>
                    {isAr
                      ? `جدول سماحية كل عيب من العيوب الـ 16 بناءً على الكود المستخدم (${activeCodeMeta.shortLabel} · t = ${plateThicknessMm} مم)`
                      : `Allowable Tolerance Schedule for All 16 Weld Defects (${activeCodeMeta.shortLabel} · t = ${plateThicknessMm} mm)`}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr
                    ? 'تتحدث قيم السماحية تلقائياً عند تغيير الكود أعلاه أو تغيير سماكة العينة (t). اضغط على أي عيب لمحاكاته وتقييمه.'
                    : 'Allowable length (L_max) and depth/height (Δh_max) recalculate automatically with active code and specimen thickness t.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-start border-collapse font-mono text-xs tabular-nums">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 text-[11px]">
                    <th className="p-2.5 border-b border-slate-800 text-start">#</th>
                    <th className="p-2.5 border-b border-slate-800 text-start">{isAr ? 'العيب الهندسي' : 'Defect Name'}</th>
                    <th className="p-2.5 border-b border-slate-800 text-start">{isAr ? 'الطبيعة' : 'Category'}</th>
                    <th className="p-2.5 border-b border-slate-800 text-start">{isAr ? 'السماحية المسموحة بالكود' : 'Code Allowable Tolerance'}</th>
                    <th className="p-2.5 border-b border-slate-800 text-start">{isAr ? 'معيار السعة والملاحظات' : 'Amplitude & Sizing Rule'}</th>
                    <th className="p-2.5 border-b border-slate-800 text-start">{isAr ? 'مرجع الفقرة' : 'Code Clause'}</th>
                  </tr>
                </thead>
                <tbody>
                  {allDefectsToleranceSchedule.map(({ defect, tolerance }, idx) => {
                    const isCurrent = defect.id === currentFlaw.id;
                    return (
                      <tr
                        key={defect.id}
                        onClick={() => setSelectedFlawId(defect.id)}
                        className={`border-b border-slate-800/70 cursor-pointer transition ${
                          isCurrent ? 'bg-cyan-950/45 text-white' : 'text-slate-300 hover:bg-slate-900/70'
                        }`}
                      >
                        <td className="p-2.5 text-cyan-400 font-bold">
                          {idx + 1}. {defect.codeSymbol}
                        </td>
                        <td className="p-2.5 font-bold">{defect.name[language]}</td>
                        <td className="p-2.5">
                          <span className={defect.category === 'Planar' ? 'text-rose-400 font-bold' : 'text-amber-300'}>
                            {defect.category}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold">
                          <span className={tolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'}>
                            {tolerance.toleranceBadge[language]}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-400">{tolerance.amplitudeCriterion[language]}</td>
                        <td className="p-2.5 text-[11px] text-slate-400">{tolerance.clauseRef}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 4: OFFICIAL PDF INSPECTION REPORT & VIRTUAL ELECTRONIC SIGNATURE
         ===================================================================== */}
      {activeStep === 'report' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>{isAr ? 'تقرير الفحص الهندسي المعتمد بالموجات فوق الصوتية (PDF + توقيع إلكتروني)' : 'Official Ultrasonic Examination Test Report'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'أدخل بيانات المفتش ووقّع إلكترونياً لتوليد وتحميل ملف تقرير فحص رسمي (PDF) بنتائج المحاكاة وحالة اللحام (مقبول / مرفوض).'
                  : 'Sign with the virtual electronic signature pad and export an official PDF Inspection Report with your simulation results and code verdict.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdfReport}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'توليد وتحميل تقرير الفحص (PDF)' : 'Download Signed PDF Report'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdfReport}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}</span>
              </button>
            </div>
          </div>

          {pdfDownloadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between">
              <span>
                {isAr
                  ? `✓ تم إنشاء وتحميل ملف التقرير PDF بنجاح متضمناً التوقيع الإلكتروني وحالة اللحام (${isCodeReject ? 'مرفوض REJECTED' : 'مقبول ACCEPTED'}).`
                  : `✓ Official PDF Inspection Report generated with electronic signature and weld disposition (${isCodeReject ? 'REJECTED' : 'ACCEPTED'}).`}
              </span>
            </div>
          )}

          {/* Inspector Details + Virtual Electronic Signature Pad */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="font-bold text-cyan-400 pb-1 border-b border-slate-800">
                {isAr ? 'بيانات الفاحص والوصلة للتقرير:' : 'Inspector & Weld Identification:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1 block">
                  <span className="text-slate-400 text-[11px]">{isAr ? 'اسم المفتش المعتمد:' : 'Inspector Name:'}</span>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-slate-400 text-[11px]">{isAr ? 'مستوى التأهيل:' : 'ASNT / ISO Level:'}</span>
                  <select
                    value={inspectorLevel}
                    onChange={(e) => setInspectorLevel(e.target.value as 'Level II' | 'Level III')}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                  >
                    <option value="Level II">ASNT NDT Level II</option>
                    <option value="Level III">ASNT NDT Level III</option>
                  </select>
                </label>
                <label className="space-y-1 block">
                  <span className="text-slate-400 text-[11px]">{isAr ? 'العميل / المنشأة:' : 'Client / Facility:'}</span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-slate-400 text-[11px]">{isAr ? 'رقم وصلة اللحام:' : 'Weld Joint ID:'}</span>
                  <input
                    type="text"
                    value={weldJointId}
                    onChange={(e) => setWeldJointId(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                  />
                </label>
              </div>
            </div>

            <div className="lg:col-span-6">
              <VirtualSignaturePad
                language={language}
                inspectorName={inspectorName}
                onSignatureChange={(dataUrl) => setSignatureDataUrl(dataUrl)}
              />
            </div>
          </div>

          {/* Live Certificate Report Preview */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block">Report Number:</span>
                <span className="text-white font-bold">INSCO-UT-2026-0428</span>
              </div>
              <div>
                <span className="text-slate-500 block">Specimen Geometry:</span>
                <span className="text-emerald-400 font-bold">
                  {specimenGeometry === 'curved' ? `Curved Pipe (OD ${pipeOuterDiameterMm}mm · t=${plateThicknessMm}mm)` : `Flat Butt Plate (t=${plateThicknessMm}mm)`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Client / Facility:</span>
                <span className="text-white font-bold">{clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Code & Standard:</span>
                <span className="text-cyan-400 font-bold">{codeClauseCitation}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block">Instrument Mode:</span>
                <span className="text-slate-200">
                  {instrumentMode === 'paut' ? `OmniScan X3 PAUT (${pautApertureElements}E)` : 'Krautkrämer USM 35X UT'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Transducer / Angle:</span>
                <span className="text-slate-200">{effectiveBeamAngleDeg}° Shear ({probeFrequencyMhz} MHz)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Calibration Setup:</span>
                <span className="text-slate-200">{velocityMs} m/s · {zeroDelayUs} µs · {gainDb.toFixed(1)} dB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Final Weld Status:</span>
                <span className={`font-black ${isCodeReject ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isCodeReject ? 'REJECTED (مرفوض)' : 'ACCEPTED (مقبول)'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-800 tabular-nums">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[10px]">
                    <th className="p-2 border border-slate-800">#</th>
                    <th className="p-2 border border-slate-800">Discontinuity</th>
                    <th className="p-2 border border-slate-800">Type</th>
                    <th className="p-2 border border-slate-800">Sound Path (S)</th>
                    <th className="p-2 border border-slate-800">True Depth (D)</th>
                    <th className="p-2 border border-slate-800">Length × Δh</th>
                    <th className="p-2 border border-slate-800">% FSH</th>
                    <th className="p-2 border border-slate-800">Disposition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-300">
                    <td className="p-2 border border-slate-800">1</td>
                    <td className="p-2 border border-slate-800 font-bold text-white">{currentFlaw.name.en}</td>
                    <td className="p-2 border border-slate-800">{currentFlaw.category}</td>
                    <td className="p-2 border border-slate-800">
                      {(calculatedSoundPathMm > 0 ? calculatedSoundPathMm : flawNominalDepthMm / cosTheta).toFixed(1)} mm
                    </td>
                    <td className="p-2 border border-slate-800">{calculatedDepthMm.toFixed(1)} mm</td>
                    <td className="p-2 border border-slate-800">
                      {measuredFlawLengthMm.toFixed(1)} × {measuredFlawHeightMm.toFixed(1)} mm
                    </td>
                    <td className="p-2 border border-slate-800 font-bold text-amber-400">
                      {echoAmplitudePct > 0 ? echoAmplitudePct : Math.round(currentFlaw.reflectivityFactor * 82)}%
                    </td>
                    <td className="p-2 border border-slate-800">
                      <span className={`font-bold ${isCodeReject ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isCodeReject ? 'REJECT' : 'ACCEPT'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block">Signed By ({inspectorLevel}):</span>
                <span className="text-white font-bold">
                  {inspectorName} (Cert # {inspectorCertNumber})
                </span>
              </div>
              <div className="text-end">
                <span className="text-slate-500 block">Electronic Signature Verification:</span>
                <span className="text-emerald-400 font-bold">
                  {signatureDataUrl ? 'E-SIGNATURE EMBEDDED & VERIFIED (ISO 9712)' : 'AUTO-STAMP READY (ISO 9712)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 5: 3D ULTRASONIC BEAM CONE ("كوم الأشعة") & ALL 16 DEFECTS ATLAS
         ===================================================================== */}
      {activeStep === 'beam_cone_atlas' && (
        <BeamConeAndDefectExplorer
          language={language}
          selectedDefectId={selectedFlawId}
          onSelectDefectForLiveSim={(defId) => {
            const target = ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === defId);
            if (target) {
              setSelectedFlawId(defId);
              setProbeAngleDeg(target.optimalAngleDeg);
              setPautCursorAngleDeg(target.optimalAngleDeg === 0 ? 45 : target.optimalAngleDeg);
              setVelocityMs(target.optimalAngleDeg === 0 ? 5920 : 3240);
            }
            setActiveStep('scan_inspect');
            if (autoAlertOnDefectSelect) {
              setIsToleranceModalOpen(true);
            }
          }}
        />
      )}

      {/* Visual International Standards Tolerance Alert Modal */}
      <DefectToleranceModal
        isOpen={isToleranceModalOpen}
        onClose={() => setIsToleranceModalOpen(false)}
        defectId={selectedFlawId}
        activeCode={selectedCode}
        onSelectCode={(nextCode) => setSelectedCode(nextCode)}
        thicknessMm={plateThicknessMm}
        measuredDimensions={{
          lengthMm: measuredFlawLengthMm,
          heightMm: measuredFlawHeightMm,
        }}
        language={language}
        autoAlertOnSelect={autoAlertOnDefectSelect}
        onToggleAutoAlert={setAutoAlertOnDefectSelect}
      />
    </div>
  );
};
