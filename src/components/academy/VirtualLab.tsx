import React, { Suspense, lazy, useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Activity, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  RotateCcw, 
  HelpCircle, 
  ChevronRight, 
  FileText,
  Sliders,
  Play,
  Zap,
  Maximize2,
  Atom,
  Ruler
} from 'lucide-react';
import { Language } from '../../types';
import { 
  VIRTUAL_LAB_EXPERIMENTS, 
  VirtualLabExperiment,
  CalibrationReportData
} from '../../data/virtualLabData';
// three.js is only needed when this lab is actually opened. Importing it
// statically put ~600 KB of renderer code in the first payload for every
// visitor, including those who only read the library tab.
const UtThreeScene = lazy(() =>
  import('./virtuallab/UtThreeScene').then(module => ({ default: module.UtThreeScene }))
);
import { UtAScanDisplay } from './virtuallab/UtAScanDisplay';
import { CalibrationReportModal } from './virtuallab/CalibrationReportModal';
import { NdtAudioControlChip } from './virtuallab/NdtAudioControlChip';
import { DiscoveredDefectsLogTable } from './virtuallab/DiscoveredDefectsLogTable';
import { DefectFrequencyD3Chart } from './virtuallab/DefectFrequencyD3Chart';
import { V1V2CalibrationLab } from './virtuallab/V1V2CalibrationLab';
import {
  playCalibrationClick,
  playCalibrationSuccessPing,
  playDefectDetectedPing,
  playProbeScanTick,
} from '../../utils/ndtAudioFeedback';
import {
  Defect3DWireframeSpec,
  DiscoveredDefectEntry,
  DiscoveredDefectSeverity,
  entryTo3DWireframeSpec,
  logDiscoveredDefect,
  useDiscoveredDefectsLog,
} from '../../utils/discoveredDefectsStore';
import type { ExtendedWeldFlawId } from '../../data/utWeldDefectsCatalog';

type AngleWeldCouponFlawId =
  | 'incomplete_penetration'
  | 'porosity_cluster'
  | 'lack_of_fusion'
  | 'slag_inclusion'
  | 'root_crack';

interface AngleWeldCouponFlawSpec {
  id: AngleWeldCouponFlawId;
  catalogDefectId: ExtendedWeldFlawId;
  codeSymbol: string;
  shortBtn: { ar: string; en: string };
  type: { ar: string; en: string };
  zone: { ar: string; en: string };
  morphology: 'Planar' | 'Volumetric';
  severity: DiscoveredDefectSeverity;
  depthMm: number;
  xMm: number;
  yMm: number;
  lengthMm: number;
  heightMm: number;
  widthMm: number;
}

const ANGLE_WELD_COUPON_FLAWS: Record<AngleWeldCouponFlawId, AngleWeldCouponFlawSpec> = {
  incomplete_penetration: {
    id: 'incomplete_penetration',
    catalogDefectId: 'incomplete_penetration',
    codeSymbol: 'LOP-R',
    shortBtn: { ar: 'عدم تغلغل الجذر', en: 'Root LOP' },
    type: {
      ar: 'عدم تغلغل جذر اللحام (Root Incomplete Penetration)',
      en: 'Root Incomplete Penetration (LOP)',
    },
    zone: { ar: 'خط جذر اللحام (Weld Root Centerline)', en: 'Weld Root Centerline' },
    morphology: 'Planar',
    severity: 'Critical',
    depthMm: 20.0,
    xMm: 0,
    yMm: 50,
    lengthMm: 12.0,
    heightMm: 3.8,
    widthMm: 2.2,
  },
  porosity_cluster: {
    id: 'porosity_cluster',
    catalogDefectId: 'porosity_cluster',
    codeSymbol: 'POR-C',
    shortBtn: { ar: 'مسامية عنقودية', en: 'Porosity' },
    type: {
      ar: 'عنقود مسامية غازية بقلب اللحام (Gas Porosity Cluster)',
      en: 'Clustered Gas Porosity',
    },
    zone: { ar: 'قلب معدن اللحام (Weld Fill Volume)', en: 'Mid-Wall Weld Fill' },
    morphology: 'Volumetric',
    severity: 'High',
    depthMm: 12.0,
    xMm: 1.5,
    yMm: 34,
    lengthMm: 9.5,
    heightMm: 2.6,
    widthMm: 3.0,
  },
  lack_of_fusion: {
    id: 'lack_of_fusion',
    catalogDefectId: 'lack_of_fusion',
    codeSymbol: 'LOF-SW',
    shortBtn: { ar: 'نقص انصهار جانبي', en: 'Lack of Fusion' },
    type: {
      ar: 'نقص انصهار بالجدار الجانبي للشطف (Sidewall LOF)',
      en: 'Sidewall Lack of Fusion (LOF)',
    },
    zone: { ar: 'جدار شطف الوصلة 30° (Bevel Fusion Face)', en: '30° Bevel Fusion Face' },
    morphology: 'Planar',
    severity: 'Critical',
    depthMm: 13.0,
    xMm: 4.5,
    yMm: 66,
    lengthMm: 15.5,
    heightMm: 2.9,
    widthMm: 1.8,
  },
  slag_inclusion: {
    id: 'slag_inclusion',
    catalogDefectId: 'slag_inclusion',
    codeSymbol: 'SLG-I',
    shortBtn: { ar: 'شوائب خبث', en: 'Slag Inclusion' },
    type: {
      ar: 'شائبة خبث طولية محبوسة بين التمريرات (Slag Inclusion)',
      en: 'Entrapped Interpass Slag Inclusion',
    },
    zone: { ar: 'حدود التمريرات الداخلية (Interpass Boundary)', en: 'Interpass Bead Boundary' },
    morphology: 'Volumetric',
    severity: 'High',
    depthMm: 15.0,
    xMm: -2.0,
    yMm: 22,
    lengthMm: 11.0,
    heightMm: 2.4,
    widthMm: 2.6,
  },
  root_crack: {
    id: 'root_crack',
    catalogDefectId: 'root_crack',
    codeSymbol: 'CRK-R',
    shortBtn: { ar: 'شرخ جذري', en: 'Root Crack' },
    type: {
      ar: 'شرخ طولي بجذر اللحام (Longitudinal Root Crack)',
      en: 'Longitudinal Weld Root Crack',
    },
    zone: { ar: 'منطقة جذر اللحام (Root Stress Zone)', en: 'Weld Root Toe' },
    morphology: 'Planar',
    severity: 'Critical',
    depthMm: 19.0,
    xMm: 0.6,
    yMm: 78,
    lengthMm: 14.0,
    heightMm: 3.6,
    widthMm: 1.6,
  },
};

interface VirtualLabProps {
  language: Language;
}

export const VirtualLab: React.FC<VirtualLabProps> = ({ language }) => {
  const isAr = language === 'ar';

  // Selected lab module ('experiments' | 'v1_v2_dedicated') & experiment state
  const [activeLabModule, setActiveLabModule] = useState<'experiments' | 'v1_v2_dedicated'>('experiments');
  const [selectedExpId, setSelectedExpId] = useState<string>(VIRTUAL_LAB_EXPERIMENTS[0].id);
  const currentExp = useMemo(() => {
    return VIRTUAL_LAB_EXPERIMENTS.find(e => e.id === selectedExpId) || VIRTUAL_LAB_EXPERIMENTS[0];
  }, [selectedExpId]);

  // Calibration Instrument State
  const [velocity, setVelocity] = useState<number>(currentExp.defaultVelocity);
  const [range, setRange] = useState<number>(currentExp.defaultRange);
  const [gain, setGain] = useState<number>(currentExp.defaultGain);
  const [zeroDelay, setZeroDelay] = useState<number>(currentExp.defaultZero);
  const [gateStartMm, setGateStartMm] = useState<number>(currentExp.defaultGateStart);
  const [gateWidthMm, setGateWidthMm] = useState<number>(currentExp.defaultGateWidth);
  const [gateThresholdPercent, setGateThresholdPercent] = useState<number>(currentExp.defaultGateThreshold);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  // Physical Setup State
  // IIW V1 probe position preset
  const [iiwPreset, setIiwPreset] = useState<'A' | 'B' | 'C' | 'D'>('B');
  // Step Wedge chosen step (1 to 5)
  const [selectedStep, setSelectedStep] = useState<number>(1);
  // Angle Beam Weld inspection parameters
  const [probeAngleDeg, setProbeAngleDeg] = useState<number>(60);
  const [probeStandoffMm, setProbeStandoffMm] = useState<number>(40); // mm from weld centerline
  const [weldCouponFlawId, setWeldCouponFlawId] =
    useState<AngleWeldCouponFlawId>('incomplete_penetration');
  const activeWeldFlaw = ANGLE_WELD_COUPON_FLAWS[weldCouponFlawId];
  // MT Yoke parameters
  const [isYokeEnergized, setIsYokeEnergized] = useState<boolean>(false);
  const [areParticlesApplied, setAreParticlesApplied] = useState<boolean>(false);
  const [crackAngleDeg, setCrackAngleDeg] = useState<number>(90); // 90 = perpendicular, 0 = parallel

  // Active step in the guided mission
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Modal report state
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // 3D Defect Wireframe & Specimen X-Ray Overlay toggles
  const [showDefectWireframes, setShowDefectWireframes] = useState<boolean>(true);
  const [xraySpecimenMode, setXraySpecimenMode] = useState<boolean>(false);
  const { entries: loggedDefects } = useDiscoveredDefectsLog();

  // Reset parameters when switching experiment
  const handleSelectExperiment = (expId: string) => {
    const nextExp = VIRTUAL_LAB_EXPERIMENTS.find(e => e.id === expId);
    if (!nextExp) return;
    setActiveLabModule('experiments');
    setSelectedExpId(expId);
    setVelocity(nextExp.defaultVelocity);
    setRange(nextExp.defaultRange);
    setGain(nextExp.defaultGain);
    setZeroDelay(nextExp.defaultZero);
    setGateStartMm(nextExp.defaultGateStart);
    setGateWidthMm(nextExp.defaultGateWidth);
    setGateThresholdPercent(nextExp.defaultGateThreshold);
    setIsFrozen(false);
    setActiveStepIndex(0);
    setCompletedSteps([]);
    setIiwPreset('B');
    setSelectedStep(1);
    setIsYokeEnergized(false);
    setAreParticlesApplied(false);
  };

  // -------------------------------------------------------------
  // Physical Acoustics Calculations
  // Calculates sound path, echo reflections, and flaw detection
  // -------------------------------------------------------------
  const acousticSimulation = useMemo(() => {
    let primaryEchoDist = 0;
    let secondaryEchoDist = 0;
    let reflectorType: 'backwall' | 'arc_100' | 'sdh' | 'weld_defect' | 'step' = 'backwall';
    let isDefectIntersected = false;
    let soundPath = 0;
    let depth = 0;
    let surfaceDist = 0;

    if (currentExp.blockType === 'iiw_v1') {
      if (iiwPreset === 'A') {
        // Normal beam on 25 mm step -> echoes at 25 mm, 50 mm, 75 mm
        reflectorType = 'step';
        primaryEchoDist = 25 * (5920 / velocity);
        secondaryEchoDist = 50 * (5920 / velocity);
      } else if (iiwPreset === 'B') {
        // Normal beam oriented towards 100 mm arc -> echoes at 100 mm and 200 mm
        reflectorType = 'arc_100';
        primaryEchoDist = 100 * (5920 / velocity);
        secondaryEchoDist = 200 * (5920 / velocity);
      } else if (iiwPreset === 'C') {
        // Angle beam index point verification on 100 mm arc
        reflectorType = 'arc_100';
        primaryEchoDist = 100 * (3240 / velocity);
      } else if (iiwPreset === 'D') {
        // Sensitivity on 1.5 mm SDH hole (at 15 mm depth)
        reflectorType = 'sdh';
        primaryEchoDist = 15 * (5920 / velocity);
      }
    } else if (currentExp.blockType === 'step_wedge') {
      // Step thicknesses: 2.5, 5.0, 7.5, 10.0, 12.5 mm
      const stepHeightsMm = [2.5, 5.0, 7.5, 10.0, 12.5];
      const actualThickness = stepHeightsMm[selectedStep - 1] || 2.5;
      primaryEchoDist = actualThickness * (5920 / velocity);
      secondaryEchoDist = actualThickness * 2 * (5920 / velocity);
      reflectorType = 'step';
    } else if (currentExp.blockType === 'angle_weld') {
      reflectorType = 'weld_defect';
      const targetDepthMm = activeWeldFlaw.depthMm;
      const rad = (probeAngleDeg * Math.PI) / 180;

      // Direct Leg 1 horizontal distance from flaw to probe index
      const targetStandoffMm = Math.max(
        20,
        Math.min(64, targetDepthMm * Math.tan(rad) + activeWeldFlaw.xMm)
      );

      const diffFromTarget = Math.abs(probeStandoffMm - targetStandoffMm);
      if (diffFromTarget < 6.0) {
        isDefectIntersected = true;
        soundPath = targetDepthMm / Math.cos(rad);
        depth = targetDepthMm;
        surfaceDist = probeStandoffMm;
        primaryEchoDist = soundPath * (3240 / velocity);
      } else {
        primaryEchoDist = 0;
      }
    }

    // Exact Depth & Length calculated during simulation (ASME Sec V Trig + -6 dB Drop Sizing)
    const angleRad = (probeAngleDeg * Math.PI) / 180;
    const rawCalcDepth =
      currentExp.blockType === 'angle_weld' && isDefectIntersected
        ? primaryEchoDist * Math.cos(angleRad)
        : depth;
    const calculatedDepthMm = Number(
      (rawCalcDepth <= 20 ? rawCalcDepth : Math.max(0, 40 - rawCalcDepth)).toFixed(1)
    );
    const calculatedLengthMm =
      currentExp.blockType === 'angle_weld' && isDefectIntersected ? activeWeldFlaw.lengthMm : 0;

    return {
      primaryEchoDist,
      secondaryEchoDist,
      reflectorType,
      isDefectIntersected,
      soundPath,
      depth,
      surfaceDist,
      calculatedDepthMm,
      calculatedLengthMm,
    };
  }, [
    currentExp.blockType,
    iiwPreset,
    selectedStep,
    velocity,
    probeAngleDeg,
    probeStandoffMm,
    activeWeldFlaw,
  ]);

  // Check guided step completion criteria
  const checkCurrentStepStatus = () => {
    const curStep = currentExp.steps[activeStepIndex];
    if (!curStep) return false;

    if (currentExp.id === 'ut-iiw-v1-range') {
      if (curStep.stepNumber === 1) return iiwPreset === 'B';
      if (curStep.stepNumber === 2) return gain >= 42 && gain <= 46;
      if (curStep.stepNumber === 3) return Math.abs(velocity - 5920) <= 25;
      if (curStep.stepNumber === 4) return gateStartMm >= 85 && gateStartMm <= 95 && gateThresholdPercent <= 60;
    } else if (currentExp.id === 'ut-step-wedge-thickness') {
      if (curStep.stepNumber === 1) return selectedStep === 1;
      if (curStep.stepNumber === 2) return Math.abs(velocity - 5920) <= 30;
      if (curStep.stepNumber === 3) return selectedStep === 4;
    } else if (currentExp.id === 'ut-angle-weld-inspection') {
      if (curStep.stepNumber === 1) return probeAngleDeg === 60 && velocity === 3240;
      if (curStep.stepNumber === 2) return acousticSimulation.isDefectIntersected;
      if (curStep.stepNumber === 3) return isFrozen;
    } else if (currentExp.id === 'mt-magnetic-yoke-inspection') {
      if (curStep.stepNumber === 1) return isYokeEnergized;
      if (curStep.stepNumber === 2) return areParticlesApplied;
      if (curStep.stepNumber === 3) return crackAngleDeg <= 30;
    }

    return false;
  };

  const isCurrentStepCompleted = checkCurrentStepStatus();

  // Play calibration confirmation chime when current guided step condition transitions to met
  const prevStepMetRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    if (isCurrentStepCompleted && !prevStepMetRef.current) {
      playCalibrationSuccessPing();
    }
    prevStepMetRef.current = isCurrentStepCompleted;
  }, [isCurrentStepCompleted, activeStepIndex, selectedExpId]);

  // Automatically log discovered 3D defects (UT Angle-Weld Root Defect & MT Yoke Surface Crack) + play sonar ping
  const isMtDefectDetected =
    currentExp.blockType === 'mt_yoke' &&
    isYokeEnergized &&
    areParticlesApplied &&
    crackAngleDeg >= 60;

  const prevUtHitRef = React.useRef<boolean>(false);
  const prevMtHitRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (currentExp.blockType === 'angle_weld' && acousticSimulation.isDefectIntersected) {
      const approxAmpPct = Math.min(100, Math.max(45, 80 + (gain - 50) * 2.5));
      const { isNewDiscovery } = logDiscoveredDefect({
        defectKey: `3d_virtual_lab:angle_weld:${activeWeldFlaw.id}:${probeAngleDeg}`,
        catalogDefectId: activeWeldFlaw.catalogDefectId,
        codeSymbol: activeWeldFlaw.codeSymbol,
        type: activeWeldFlaw.type,
        morphology: activeWeldFlaw.morphology,
        method: 'UT 3D',
        sourceLab: {
          ar: 'مختبر NDT التفاعلي ثلاثي الأبعاد',
          en: '3D Interactive Virtual NDT Lab',
        },
        location: {
          zone: activeWeldFlaw.zone,
          xMm: activeWeldFlaw.xMm,
          yMm: activeWeldFlaw.yMm,
          depthZMm: acousticSimulation.calculatedDepthMm,
          soundPathOrAngle: `S=${acousticSimulation.primaryEchoDist.toFixed(1)}mm @ ${probeAngleDeg}°`,
        },
        sizing: {
          calculatedDepthMm: acousticSimulation.calculatedDepthMm,
          calculatedLengthMm: acousticSimulation.calculatedLengthMm,
          heightMm: activeWeldFlaw.heightMm,
          transverseWidthMm: activeWeldFlaw.widthMm,
          soundPathMm: Number(acousticSimulation.primaryEchoDist.toFixed(1)),
          sizingMethod: 'ASME Sec V Trig Depth & -6 dB Length',
        },
        severity: activeWeldFlaw.severity,
        peakSignalPct: approxAmpPct,
      });
      if (isNewDiscovery || !prevUtHitRef.current) {
        playDefectDetectedPing(activeWeldFlaw.severity);
      }
    }
    prevUtHitRef.current =
      currentExp.blockType === 'angle_weld' && acousticSimulation.isDefectIntersected;
  }, [
    currentExp.blockType,
    acousticSimulation.isDefectIntersected,
    acousticSimulation.calculatedDepthMm,
    acousticSimulation.calculatedLengthMm,
    acousticSimulation.primaryEchoDist,
    probeAngleDeg,
    gain,
    activeWeldFlaw,
  ]);

  const mtCalculatedLengthMm = useMemo(
    () => Number((24.0 * Math.max(0.25, Math.sin((crackAngleDeg * Math.PI) / 180))).toFixed(1)),
    [crackAngleDeg]
  );

  React.useEffect(() => {
    if (isMtDefectDetected) {
      const fluxPct = Math.min(100, Math.round(65 + ((crackAngleDeg - 60) / 30) * 32));
      const { isNewDiscovery } = logDiscoveredDefect({
        defectKey: '3d_virtual_lab:mt_yoke:surface_fatigue_crack',
        catalogDefectId: 'transverse_crack',
        codeSymbol: 'MT-CR',
        type: {
          ar: 'شرخ سطحي مستعرض مرصود بتسرب الفيض المغناطيسي',
          en: 'Transverse Surface Crack (Magnetic Flux Leakage)',
        },
        morphology: 'Surface',
        method: 'MT 3D',
        sourceLab: {
          ar: 'مختبر NDT التفاعلي ثلاثي الأبعاد',
          en: '3D Interactive Virtual NDT Lab',
        },
        location: {
          zone: {
            ar: 'سطح العينة بين قطبي الشوكة المغناطيسية',
            en: 'Top Surface Between AC Yoke Poles',
          },
          xMm: 0,
          yMm: 50,
          depthZMm: 0,
          soundPathOrAngle: `Flux ∠${crackAngleDeg}°`,
        },
        sizing: {
          calculatedDepthMm: 0,
          calculatedLengthMm: mtCalculatedLengthMm,
          heightMm: 1.5,
          transverseWidthMm: 1.2,
          sizingMethod: 'MFL Particle Indication Length',
        },
        severity: 'Critical',
        peakSignalPct: fluxPct,
      });
      if (isNewDiscovery || !prevMtHitRef.current) {
        playDefectDetectedPing('Critical');
      }
    }
    prevMtHitRef.current = isMtDefectDetected;
  }, [isMtDefectDetected, crackAngleDeg, mtCalculatedLengthMm]);

  // Build 3D Wireframe Overlays for the active 3D specimen (live detected + logged session weld flaws)
  const detectedWireframeOverlays = useMemo<Defect3DWireframeSpec[]>(() => {
    if (currentExp.blockType === 'angle_weld') {
      const list: Defect3DWireframeSpec[] = [];
      if (acousticSimulation.isDefectIntersected) {
        list.push({
          id: `live-ut-${activeWeldFlaw.id}`,
          codeSymbol: activeWeldFlaw.codeSymbol,
          label: activeWeldFlaw.type,
          severity: activeWeldFlaw.severity,
          morphology: activeWeldFlaw.morphology,
          xMm: activeWeldFlaw.xMm,
          yMm: activeWeldFlaw.yMm,
          calculatedDepthMm: acousticSimulation.calculatedDepthMm,
          calculatedLengthMm: acousticSimulation.calculatedLengthMm,
          heightMm: activeWeldFlaw.heightMm,
          transverseWidthMm: activeWeldFlaw.widthMm,
          isLiveActive: true,
        });
      }
      for (const item of loggedDefects) {
        if (item.method === 'UT 3D' || item.method === 'PAUT 3D') {
          if (
            list.some(
              (existing) =>
                existing.codeSymbol === item.codeSymbol &&
                Math.abs(existing.yMm - item.location.yMm) < 2
            )
          ) {
            continue;
          }
          list.push(entryTo3DWireframeSpec(item, false));
        }
      }
      return list;
    }

    if (currentExp.blockType === 'mt_yoke') {
      const list: Defect3DWireframeSpec[] = [];
      if (isMtDefectDetected) {
        list.push({
          id: 'live-mt-surface-crack',
          codeSymbol: 'MT-CR',
          label: {
            ar: 'شرخ سطحي مستعرض (MFL)',
            en: 'Transverse Surface Crack',
          },
          severity: 'Critical',
          morphology: 'Surface',
          xMm: 0,
          yMm: 50,
          calculatedDepthMm: 0,
          calculatedLengthMm: mtCalculatedLengthMm,
          heightMm: 1.5,
          transverseWidthMm: 1.2,
          orientationDeg: crackAngleDeg,
          isLiveActive: true,
        });
      } else {
        for (const item of loggedDefects) {
          if (item.method === 'MT 3D') {
            list.push({
              ...entryTo3DWireframeSpec(item, false),
              orientationDeg: crackAngleDeg,
            });
          }
        }
      }
      return list;
    }

    return [];
  }, [
    currentExp.blockType,
    acousticSimulation.isDefectIntersected,
    acousticSimulation.calculatedDepthMm,
    acousticSimulation.calculatedLengthMm,
    activeWeldFlaw,
    isMtDefectDetected,
    mtCalculatedLengthMm,
    crackAngleDeg,
    loggedDefects,
  ]);

  // Advance step
  const handleAdvanceStep = () => {
    playCalibrationClick();
    if (!completedSteps.includes(activeStepIndex)) {
      setCompletedSteps(prev => [...prev, activeStepIndex]);
    }
    if (activeStepIndex < currentExp.steps.length - 1) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  // Auto 80% FSH Gain calibration button
  const handleAuto80Gain = () => {
    playCalibrationSuccessPing();
    if (currentExp.blockType === 'iiw_v1') {
      setGain(44.0);
    } else if (currentExp.blockType === 'step_wedge') {
      setGain(36.0);
    } else if (currentExp.blockType === 'angle_weld') {
      setGain(50.0);
    }
  };

  const handleFocusDefectIn3D = (entry: DiscoveredDefectEntry) => {
    if (entry.method === 'MT 3D') {
      handleSelectExperiment('mt-magnetic-yoke-inspection');
      setIsYokeEnergized(true);
      setAreParticlesApplied(true);
      setCrackAngleDeg(90);
    } else {
      handleSelectExperiment('ut-angle-weld-inspection');
      const matchedCoupon = (Object.values(ANGLE_WELD_COUPON_FLAWS).find(
        (c) => c.catalogDefectId === entry.catalogDefectId || c.codeSymbol === entry.codeSymbol
      ) ?? ANGLE_WELD_COUPON_FLAWS.incomplete_penetration);
      setWeldCouponFlawId(matchedCoupon.id);
      setProbeAngleDeg(60);
      setVelocity(3240);
      setProbeStandoffMm(
        Math.max(
          20,
          Math.min(64, Math.round(matchedCoupon.depthMm * Math.tan((60 * Math.PI) / 180) + matchedCoupon.xMm))
        )
      );
    }
  };

  const handleQuickSampleScan = () => {
    handleSelectExperiment('ut-angle-weld-inspection');
    setProbeAngleDeg(60);
    setVelocity(3240);
    setProbeStandoffMm(
      Math.max(
        20,
        Math.min(64, Math.round(activeWeldFlaw.depthMm * Math.tan((60 * Math.PI) / 180) + activeWeldFlaw.xMm))
      )
    );
  };

  const handlePopulateMultiDefectSample = () => {
    handleSelectExperiment('ut-angle-weld-inspection');
    const sampleFlaws: Array<{
      spec: AngleWeldCouponFlawSpec;
      peakPct: number;
    }> = [
      { spec: ANGLE_WELD_COUPON_FLAWS.porosity_cluster, peakPct: 74 },
      { spec: ANGLE_WELD_COUPON_FLAWS.lack_of_fusion, peakPct: 89 },
      { spec: ANGLE_WELD_COUPON_FLAWS.slag_inclusion, peakPct: 78 },
      { spec: ANGLE_WELD_COUPON_FLAWS.incomplete_penetration, peakPct: 92 },
      { spec: ANGLE_WELD_COUPON_FLAWS.root_crack, peakPct: 95 },
    ];
    for (const { spec, peakPct } of sampleFlaws) {
      const sPath = spec.depthMm / Math.cos((60 * Math.PI) / 180);
      logDiscoveredDefect({
        defectKey: `3d_virtual_lab:angle_weld:${spec.id}:60`,
        catalogDefectId: spec.catalogDefectId,
        codeSymbol: spec.codeSymbol,
        type: spec.type,
        morphology: spec.morphology,
        method: 'UT 3D',
        sourceLab: {
          ar: 'مختبر NDT التفاعلي ثلاثي الأبعاد',
          en: '3D Interactive Virtual NDT Lab',
        },
        location: {
          zone: spec.zone,
          xMm: spec.xMm,
          yMm: spec.yMm,
          depthZMm: spec.depthMm,
          soundPathOrAngle: `S=${sPath.toFixed(1)}mm @ 60°`,
        },
        sizing: {
          calculatedDepthMm: spec.depthMm,
          calculatedLengthMm: spec.lengthMm,
          heightMm: spec.heightMm,
          transverseWidthMm: spec.widthMm,
          soundPathMm: Number(sPath.toFixed(1)),
          sizingMethod: 'ASME Sec V Trig Depth & -6 dB Length',
        },
        severity: spec.severity,
        peakSignalPct: peakPct,
      });
    }
    // Also log an isolated gas pore so students see higher Porosity frequency!
    logDiscoveredDefect({
      defectKey: '3d_virtual_lab:angle_weld:isolated_pore:60',
      catalogDefectId: 'isolated_pore',
      codeSymbol: 'POR-S',
      type: {
        ar: 'فجوة غازية كروية معزولة (Isolated Gas Pore)',
        en: 'Isolated Spherical Gas Pore',
      },
      morphology: 'Volumetric',
      method: 'UT 3D',
      sourceLab: {
        ar: 'مختبر NDT التفاعلي ثلاثي الأبعاد',
        en: '3D Interactive Virtual NDT Lab',
      },
      location: {
        zone: { ar: 'قلب معدن اللحام', en: 'Weld Metal Fill' },
        xMm: -1.2,
        yMm: 42,
        depthZMm: 10.5,
        soundPathOrAngle: 'S=21.0mm @ 60°',
      },
      sizing: {
        calculatedDepthMm: 10.5,
        calculatedLengthMm: 4.0,
        heightMm: 2.0,
        transverseWidthMm: 2.0,
        soundPathMm: 21.0,
        sizingMethod: 'ASME Sec V Trig Depth & -6 dB Length',
      },
      severity: 'Moderate',
      peakSignalPct: 62,
    });
    playCalibrationSuccessPing();
  };

  // Prepare Calibration Report Data
  const reportData: CalibrationReportData = useMemo(() => {
    const isPassed = Math.abs(velocity - (currentExp.blockType === 'angle_weld' ? 3240 : 5920)) <= 30;
    return {
      certificateId: `INSC-CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      technicianName: 'Eng. Certified NDT Specialist',
      companyName: 'INSCO NDT International Academy',
      discipline: currentExp.method === 'UT' ? 'Ultrasonic Testing (UT Level II)' : 'Magnetic Particle Testing (MT Level II)',
      experimentTitle: isAr ? currentExp.titleAr : currentExp.titleEn,
      standard: currentExp.standard,
      date: new Date().toISOString().split('T')[0],
      equipmentModel: 'INSCO EPOCH 650 Digital Flaw Detector',
      equipmentSerial: 'USM-98442-NDT',
      transducerModel: currentExp.blockType === 'angle_weld' ? 'A60-2.25MHz-Shear' : 'N0-5MHz-Longitudinal',
      transducerFreqMHz: currentExp.blockType === 'angle_weld' ? 2.25 : 5.0,
      transducerSizeMm: 12.7,
      transducerAngleDeg: currentExp.blockType === 'angle_weld' ? probeAngleDeg : 0,
      blockType: currentExp.blockType === 'iiw_v1' ? 'IIW Type 1 (ISO 2400)' : '5-Step Wedge (ASTM E797)',
      calibratedVelocity: velocity,
      calibratedZeroDelay: zeroDelay,
      calibratedGainDb: gain,
      referenceEchoFshPercent: 80.0,
      status: isPassed ? 'PASSED' : 'FAILED',
      evaluatorNotesAr: isPassed 
        ? 'تمت معايرة الجهاز بنجاح طبقاً لاشتراطات كود الجمعية الأمريكية ASME Sec V Article 4 و ISO 2400. تقع جميع القراءات ضمن هامش السماحية المقبول (±0.05 مم للسماكة و ±20 م/ث للسرعة).'
        : 'فشلت المعايرة: سرعة الصوت المقاسة تنحرف عن السرعة المعيارية للفولاذ الكربوني. يُرجى إعادة ضبط السرعة عند 5920 م/ث.',
      evaluatorNotesEn: isPassed
        ? 'Equipment successfully calibrated in full compliance with ASME Sec V Art. 4 & ISO 2400. All measurements fall within acceptable code tolerances (±0.05 mm thickness and ±20 m/s velocity).'
        : 'Calibration failed: Measured velocity deviates from standard carbon steel reference. Recalibrate velocity to 5920 m/s.'
    };
  }, [currentExp, velocity, zeroDelay, gain, probeAngleDeg, isAr]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c133a] via-[#111a4c] to-[#0a0f2e] border border-[#232c66] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" />
                {isAr ? 'مختبر NDT التفاعلي ثلاثي الأبعاد' : '3D Interactive Virtual NDT Lab'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                {currentExp.standard}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {isAr ? currentExp.titleAr : currentExp.titleEn}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAr ? currentExp.subtitleAr : currentExp.subtitleEn}
            </p>
          </div>

          {/* Action Buttons: Audio Controls, Generate Report, Reset */}
          <div className="flex flex-wrap items-center gap-3">
            <NdtAudioControlChip language={language} />

            <button
              onClick={() => {
                playCalibrationClick();
                setIsReportOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>{isAr ? 'توليد شهادة المعايرة والتقرير' : 'Generate Calibration Certificate'}</span>
            </button>

            <button
              onClick={() => {
                playCalibrationClick();
                handleSelectExperiment(selectedExpId);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#090d26] hover:bg-[#131b4d] border border-[#232c66] text-slate-200 text-sm font-semibold transition cursor-pointer"
              title={isAr ? 'إعادة ضبط التجربة' : 'Reset Experiment'}
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Experiment Selector Carousel / Tabs */}
        <div className="mt-6 pt-5 border-t border-[#1f2856] flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playCalibrationClick();
              setActiveLabModule('v1_v2_dedicated');
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeLabModule === 'v1_v2_dedicated'
                ? 'bg-teal-400 text-slate-950 font-black shadow-lg shadow-teal-500/30'
                : 'bg-[#090d26] text-teal-300 hover:text-white hover:bg-[#13293d] border border-teal-500/40'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>
              {isAr
                ? 'بلوكات V1 & V2 ثلاثية الأبعاد (SDH/Notch + الحساسية واستارت تشيك)'
                : 'V1 & V2 3D Calibration Blocks & Start-Check'}
            </span>
          </button>

          {VIRTUAL_LAB_EXPERIMENTS.map(exp => {
            const isSelected = activeLabModule === 'experiments' && exp.id === selectedExpId;
            return (
              <button
                key={exp.id}
                onClick={() => handleSelectExperiment(exp.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/30'
                    : 'bg-[#090d26] text-slate-300 hover:text-white hover:bg-[#151c4a] border border-[#202856]'
                }`}
              >
                {exp.method === 'UT' ? <Activity className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                <span>{isAr ? exp.titleAr : exp.titleEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dedicated V1 & V2 3D Calibration Blocks + Sensitivity + Start-Check Module OR Standard 3D Workbench */}
      {activeLabModule === 'v1_v2_dedicated' ? (
        <V1V2CalibrationLab
          language={language}
          onCompleteAndProceedToWeld={(cal) => {
            playCalibrationSuccessPing();
            handleSelectExperiment('ut-angle-weld-inspection');
            setVelocity(cal.velocityMs);
            setZeroDelay(cal.zeroDelayUs);
            setRange(cal.rangeMm);
            setGain(Math.round(cal.gainDb));
            setProbeAngleDeg(cal.probeAngleDeg);
          }}
        />
      ) : (
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): 3D Viewport & Physical Block Positioning */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#0b1028] p-4 rounded-3xl border border-[#1e2756] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Atom className="w-4 h-4" />
                {isAr ? 'حيز التجربة ثلاثي الأبعاد (Three.js 3D Viewport)' : 'Physical 3D Test Chamber'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {isAr ? 'التحكم: السحب للتدوير • العجلة للتكبير' : 'Drag: Orbit • Scroll: Zoom'}
              </span>
            </div>

            {/* 3D Scene Canvas */}
            <div className="h-[380px] sm:h-[440px]">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center rounded-2xl border border-[#232a55] bg-[#080c1c] text-xs text-slate-400">
                    {isAr ? 'جارٍ تحميل الحيز ثلاثي الأبعاد…' : 'Loading the 3D viewport…'}
                  </div>
                }
              >
              <UtThreeScene
                language={language}
                blockType={currentExp.blockType}
                probePositionMm={probeStandoffMm}
                probeAngleDeg={probeAngleDeg}
                probePreset={iiwPreset}
                selectedStep={selectedStep}
                plateThicknessMm={20}
                defectDetected={acousticSimulation.isDefectIntersected}
                detectedWireframeOverlays={detectedWireframeOverlays}
                showDefectWireframes={showDefectWireframes}
                xraySpecimenMode={xraySpecimenMode}
                onToggleDefectWireframes={() => {
                  playCalibrationClick();
                  setShowDefectWireframes((v) => !v);
                }}
                onToggleXraySpecimen={() => {
                  playCalibrationClick();
                  setXraySpecimenMode((v) => !v);
                }}
                isYokeEnergized={isYokeEnergized}
                areParticlesApplied={areParticlesApplied}
                crackAngleDeg={crackAngleDeg}
              />
              </Suspense>
            </div>

            {/* Block-Specific Interactive Controls */}
            {currentExp.blockType === 'iiw_v1' && (
              <div className="bg-[#070a1a] p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  {isAr ? 'مواضع المجس على كتلة IIW V1 القياسية:' : 'Probe Calibration Positions on IIW V1:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setIiwPreset('A')}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      iiwPreset === 'A'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? 'الموضع A: خطوة 25mm' : 'Pos A: 25mm Step'}
                  </button>
                  <button
                    onClick={() => setIiwPreset('B')}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      iiwPreset === 'B'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? 'الموضع B: قوس 100mm' : 'Pos B: 100mm Arc'}
                  </button>
                  <button
                    onClick={() => setIiwPreset('C')}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      iiwPreset === 'C'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? 'الموضع C: زاوية الشعاع' : 'Pos C: Angle Beam'}
                  </button>
                  <button
                    onClick={() => setIiwPreset('D')}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      iiwPreset === 'D'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? 'الموضع D: ثقب 1.5mm' : 'Pos D: 1.5mm SDH'}
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {isAr
                      ? 'هل تريد معايرة بلوكي V1 & V2 بالكامل (ثقوب SDH + شقوق EDM + استارت تشيك)؟'
                      : 'Need full ISO 2400 V1 & ISO 7963 V2 3D blocks, SDH/Notch sensitivity & start-check?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playCalibrationClick();
                      setActiveLabModule('v1_v2_dedicated');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/40 text-teal-300 text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>
                      {isAr ? 'فتح وحدة V1 & V2 ثلاثية الأبعاد الشاملة' : 'Launch V1 & V2 3D Module'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {currentExp.blockType === 'step_wedge' && (
              <div className="bg-[#070a1a] p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  {isAr ? 'اختر الدرجة لوضع المجس (5-Step Wedge):' : 'Select Step Thickness:'}
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { step: 1, thk: '2.5 mm' },
                    { step: 2, thk: '5.0 mm' },
                    { step: 3, thk: '7.5 mm' },
                    { step: 4, thk: '10.0 mm' },
                    { step: 5, thk: '12.5 mm' }
                  ].map(s => (
                    <button
                      key={s.step}
                      onClick={() => setSelectedStep(s.step)}
                      className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        selectedStep === s.step
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-[10px] text-slate-500">Step {s.step}</span>
                      <span>{s.thk}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentExp.blockType === 'angle_weld' && (
              <div className="bg-[#070a1a] p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">
                    {isAr ? 'مسافة المجس عن مركز اللحام (Standoff X):' : 'Probe Standoff (X):'}
                  </span>
                  <span className="font-mono font-bold text-sky-400">{probeStandoffMm} mm</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={65}
                  step={1}
                  aria-label={isAr ? 'مسافة المجس عن مركز اللحام' : 'Probe Standoff (X)'}
                  value={probeStandoffMm}
                  onChange={e => {
                    playProbeScanTick();
                    setProbeStandoffMm(parseInt(e.target.value, 10));
                  }}
                  className="w-full accent-sky-500 cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">{isAr ? 'زاوية إسفين المجس:' : 'Wedge Angle:'}</span>
                  <div className="flex gap-2">
                    {[45, 60, 70].map(ang => (
                      <button
                        key={ang}
                        onClick={() => setProbeAngleDeg(ang)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer tabular-nums ${
                          probeAngleDeg === ang
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {ang}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Weld Error Coupon Selector for 3D Inspection & D3 Frequency Tracking */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] text-slate-400 block">
                    {isAr
                      ? 'نوع عيب اللحام المستهدف داخل العينة ثلاثية الأبعاد:'
                      : 'Target Welding Error Inside 3D Specimen:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.values(ANGLE_WELD_COUPON_FLAWS) as AngleWeldCouponFlawSpec[]).map((flawOpt) => {
                      const isSel = weldCouponFlawId === flawOpt.id;
                      return (
                        <button
                          key={flawOpt.id}
                          type="button"
                          onClick={() => {
                            playCalibrationClick();
                            setWeldCouponFlawId(flawOpt.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition cursor-pointer whitespace-nowrap shrink-0 ${
                            isSel
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {flawOpt.shortBtn[language]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentExp.blockType === 'mt_yoke' && (
              <div className="bg-[#070a1a] p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsYokeEnergized(prev => !prev)}
                    className={`p-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      isYokeEnergized
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isYokeEnergized ? (isAr ? 'الشوكة مفعلة (AC Field ON)' : 'AC Field Active') : (isAr ? 'تنشيط الشوكة (Energize)' : 'Energize Yoke')}</span>
                  </button>

                  <button
                    onClick={() => setAreParticlesApplied(prev => !prev)}
                    className={`p-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                      areParticlesApplied
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{areParticlesApplied ? (isAr ? 'المسحوق مطبق' : 'Particles Applied') : (isAr ? 'رش المسحوق (Dust Particles)' : 'Apply Particles')}</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{isAr ? 'زاوية الشق مع خطوط المجال (Crack Angle):' : 'Flaw Orientation Angle:'}</span>
                    <span className="font-bold text-amber-400 font-mono">{crackAngleDeg}° ({crackAngleDeg >= 75 ? (isAr ? 'متعامد 90° - تسرب قوي' : 'Perpendicular') : (isAr ? 'مائل / موازٍ - لا تسرب' : 'Parallel')})</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={crackAngleDeg}
                    onChange={e => setCrackAngleDeg(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (6 Cols): Digital A-Scan Unit & Step-by-Step Mission Checklist */}
        <div className="lg:col-span-6 space-y-4">
          {/* Digital Flaw Detector A-Scan */}
          {currentExp.method === 'UT' && (
            <UtAScanDisplay
              language={language}
              velocity={velocity}
              range={range}
              gain={gain}
              zeroDelay={zeroDelay}
              gateStartMm={gateStartMm}
              gateWidthMm={gateWidthMm}
              gateThresholdPercent={gateThresholdPercent}
              isFrozen={isFrozen}
              onToggleFreeze={() => {
                playCalibrationClick();
                setIsFrozen(prev => !prev);
              }}
              primaryEchoDistanceMm={acousticSimulation.primaryEchoDist}
              secondaryEchoDistanceMm={acousticSimulation.secondaryEchoDist}
              reflectorType={acousticSimulation.reflectorType}
              onGainChange={(v) => {
                playCalibrationClick();
                setGain(v);
              }}
              onVelocityChange={(v) => {
                playCalibrationClick();
                setVelocity(v);
              }}
              onZeroDelayChange={(v) => {
                playCalibrationClick();
                setZeroDelay(v);
              }}
              onGateStartChange={(v) => {
                playCalibrationClick();
                setGateStartMm(v);
              }}
              onGateThresholdChange={(v) => {
                playCalibrationClick();
                setGateThresholdPercent(v);
              }}
              onAuto80Gain={handleAuto80Gain}
            />
          )}

          {/* Guided Lab Mission Checklist Card */}
          <div className="bg-[#0b1028] p-5 rounded-3xl border border-[#1e2756] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2756] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  {isAr ? 'خطوات المعايرة الإرشادية (Guided Lab Protocol)' : 'Guided Calibration Protocol'}
                </h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                {isAr 
                  ? `الخطوة ${activeStepIndex + 1} من ${currentExp.steps.length}` 
                  : `Step ${activeStepIndex + 1} of ${currentExp.steps.length}`}
              </span>
            </div>

            {/* Current Step Active Card */}
            {currentExp.steps[activeStepIndex] && (
              <div className="p-4 rounded-2xl bg-[#080d24] border border-[#232c66] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    {isAr ? currentExp.steps[activeStepIndex].titleAr : currentExp.steps[activeStepIndex].titleEn}
                  </span>
                  {isCurrentStepCompleted ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'مكتملة ومطابقة' : 'Condition Met'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400/90 font-semibold">
                      {isAr ? 'بانتظار المعايرة...' : 'Awaiting input...'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {isAr ? currentExp.steps[activeStepIndex].instructionAr : currentExp.steps[activeStepIndex].instructionEn}
                </p>

                <div className="p-2.5 rounded-xl bg-[#0d143b] border border-[#20295c] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isAr ? 'الشرط الهندسي المستهدف:' : 'Target Condition:'}</span>
                  <span className="font-bold text-sky-300">
                    {isAr ? currentExp.steps[activeStepIndex].targetConditionAr : currentExp.steps[activeStepIndex].targetConditionEn}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? currentExp.steps[activeStepIndex].hintAr : currentExp.steps[activeStepIndex].hintEn}</span>
                  </div>

                  <button
                    onClick={handleAdvanceStep}
                    disabled={!isCurrentStepCompleted && activeStepIndex === currentExp.steps.length - 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition cursor-pointer"
                  >
                    <span>{isAr ? 'التالي' : 'Next'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Checklist of All Steps */}
            <div className="space-y-1.5 pt-2">
              {currentExp.steps.map((st, idx) => {
                const isDone = completedSteps.includes(idx);
                const isCurrent = idx === activeStepIndex;
                return (
                  <button
                    key={st.stepNumber}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer text-left ${
                      isCurrent
                        ? 'bg-[#151c48] border border-[#2c377d] text-white font-bold'
                        : 'bg-[#080d24] hover:bg-[#10163b] text-slate-400 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone 
                          ? 'bg-emerald-500 text-slate-950 font-black' 
                          : isCurrent 
                            ? 'bg-amber-400 text-slate-950' 
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isDone ? '✓' : st.stepNumber}
                      </div>
                      <span>{isAr ? st.titleAr : st.titleEn}</span>
                    </div>

                    {isDone && <span className="text-[10px] text-emerald-400 font-bold">Passed</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Reactive D3.js Bar Chart Tracking Welding Defect Type Frequencies */}
      <DefectFrequencyD3Chart
        language={language}
        onFocusDefectIn3D={handleFocusDefectIn3D}
        onPopulateSampleDefects={handlePopulateMultiDefectSample}
      />

      {/* Reactive Auto-Logged 3D Discovered Defects Table */}
      <DiscoveredDefectsLogTable
        language={language}
        onFocusDefectIn3D={handleFocusDefectIn3D}
        onTriggerSampleScan={handleQuickSampleScan}
      />

      {/* Calibration Certificate Modal */}
      <CalibrationReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        language={language}
        reportData={reportData}
      />
    </div>
  );
};
