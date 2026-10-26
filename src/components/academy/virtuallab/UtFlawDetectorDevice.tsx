import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../../types';
import {
  ALL_WELD_DEFECTS_CATALOG,
  ExtendedWeldFlawId,
  INSPECTION_CODES_META,
  InspectionCodeId,
  computeUltrasonicBeamCone,
  drawComprehensiveDefectMorphology,
  drawUltrasonicBeamCone2D,
  getDefectCodeTolerance,
} from '../../../data/utWeldDefectsCatalog';
import {
  DefectToleranceModal,
  DefectToleranceTriggerBar,
} from './DefectToleranceAlertSystem';
import { gradeAndRecordWorkshopAttempt } from '../../../utils/workshopTrainingResultsStore';
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Crosshair,
  Eye,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  ZoomIn,
} from 'lucide-react';

interface UtFlawDetectorDeviceProps {
  language: Language;
}

export type SpecimenType = 'iiw_v1' | 'iiw_v2' | 'weld_butt' | 'weld_curved_pipe' | 'corrosion_step';
type UtSoftkeyMenu = 'basic' | 'pulser' | 'gates' | 'trig' | 'dac_aws';

export const UtFlawDetectorDevice: React.FC<UtFlawDetectorDeviceProps> = ({ language }) => {
  const isAr = language === 'ar';

  // --- Authentic Hardware Controls State ---
  const [gainDb, setGainDb] = useState<number>(42.0);
  const [dbStep, setDbStep] = useState<0.1 | 0.5 | 1.0 | 6.0>(1.0);
  const [scanBoost6dB, setScanBoost6dB] = useState<boolean>(false);
  const [rangeMm, setRangeMm] = useState<number>(200);
  const [displayDelayMm, setDisplayDelayMm] = useState<number>(0);
  const [velocityMs, setVelocityMs] = useState<number>(5920);
  const [zeroDelayUs, setZeroDelayUs] = useState<number>(0.85);
  const [probeAngleDeg, setProbeAngleDeg] = useState<number>(0);
  const [probeFrequencyMhz, setProbeFrequencyMhz] = useState<number>(4.0);
  const [crystalDiameterMm, setCrystalDiameterMm] = useState<number>(10);
  const [damping, setDamping] = useState<'50_ohm' | '500_ohm'>('50_ohm');
  const [pulserVoltageV, setPulserVoltageV] = useState<100 | 200 | 400>(200);
  const [prfHz, setPrfHz] = useState<125 | 250 | 500 | 1000>(500);
  const [filterBand, setFilterBand] = useState<'broadband' | 'narrow_2m' | 'narrow_4m'>('broadband');
  const [rejectPct, setRejectPct] = useState<number>(0);
  const [isDacActive, setIsDacActive] = useState<boolean>(false);
  const [isAwsMode, setIsAwsMode] = useState<boolean>(false);
  const [isZoomGateA, setIsZoomGateA] = useState<boolean>(false);

  // Softkey Menu Bank
  const [activeSoftMenu, setActiveSoftMenu] = useState<UtSoftkeyMenu>('basic');

  // Dual Gates System + Trigger Mode
  const [activeGateTab, setActiveGateTab] = useState<'A' | 'B'>('A');
  const [gateTriggerMode, setGateTriggerMode] = useState<'peak' | 'flank'>('peak');
  const [gateAStartMm, setGateAStartMm] = useState<number>(85);
  const [gateAWidthMm, setGateAWidthMm] = useState<number>(30);
  const [gateAThresholdPct, setGateAThresholdPct] = useState<number>(50);

  const [gateBStartMm, setGateBStartMm] = useState<number>(180);
  const [gateBWidthMm, setGateBWidthMm] = useState<number>(40);
  const [gateBThresholdPct, setGateBThresholdPct] = useState<number>(30);

  // Display Rectification, Peak Hold & Freeze
  const [rectification, setRectification] = useState<'full' | 'positive' | 'negative' | 'rf'>('full');
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isPeakHold, setIsPeakHold] = useState<boolean>(false);
  const [peakMemoryTrace, setPeakMemoryTrace] = useState<number[]>([]);
  const [isAlarmMuted, setIsAlarmMuted] = useState<boolean>(false);

  // Side-by-Side Work Simulator Specimen, Defect & Beam Cone Options
  const [activeSpecimen, setActiveSpecimen] = useState<SpecimenType>('iiw_v1');
  const [iiwPosition, setIiwPosition] = useState<'A' | 'B' | 'C'>('B');
  const [weldProbeStandoffMm, setWeldProbeStandoffMm] = useState<number>(35);
  const [weldSeamYmm, setWeldSeamYmm] = useState<number>(50);
  const [selectedWeldDefectId, setSelectedWeldDefectId] = useState<ExtendedWeldFlawId>('root_crack');
  const [pipeOuterDiameterMm, setPipeOuterDiameterMm] = useState<number>(219);
  const [corrosionStepIndex, setCorrosionStepIndex] = useState<number>(2);
  const [showBeamCone, setShowBeamCone] = useState<boolean>(true);
  const [showWavefronts, setShowWavefronts] = useState<boolean>(true);
  const [isDraggingWorkProbe, setIsDraggingWorkProbe] = useState<boolean>(false);
  const [traineeVerdictChoice, setTraineeVerdictChoice] = useState<'ACCEPT' | 'REJECT'>('REJECT');
  const [selectedCode, setSelectedCode] = useState<InspectionCodeId>('asme_viii');
  const [isToleranceModalOpen, setIsToleranceModalOpen] = useState<boolean>(false);
  const [autoAlertOnDefectSelect, setAutoAlertOnDefectSelect] = useState<boolean>(true);
  const [logFeedbackMsg, setLogFeedbackMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workSimCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentDefect =
    ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === selectedWeldDefectId) || ALL_WELD_DEFECTS_CATALOG[0];

  const plateThicknessMm = 20;
  const coneMetrics = computeUltrasonicBeamCone({
    frequencyMhz: probeFrequencyMhz,
    velocityMs,
    crystalDiameterMm,
    wedgeTravelMm: probeAngleDeg === 0 ? 0 : 9,
    wedgeVelocityMs: 2330,
  });
  const activeDefectTolerance = getDefectCodeTolerance(currentDefect.id, selectedCode, plateThicknessMm);

  interface EchoPeak {
    soundPathMm: number;
    baseAmplitudePct: number;
    widthMm: number;
    label: string;
    isVolumetric?: boolean;
    hasTipDiffraction?: boolean;
  }

  const effectiveGainDb = gainDb + (scanBoost6dB ? 6 : 0);
  const effectiveRangeMm = isZoomGateA ? Math.max(20, gateAWidthMm) : rangeMm;
  const effectiveDelayMm = isZoomGateA ? gateAStartMm : displayDelayMm;

  const getSimulatedEchoes = (): EchoPeak[] => {
    const echoes: EchoPeak[] = [];
    const zeroShiftMm = (zeroDelayUs - 0.85) * 3.0;

    echoes.push({
      soundPathMm: 0,
      baseAmplitudePct: 98,
      widthMm: rangeMm * 0.032,
      label: isAr ? 'النبضة الابتدائية (Main Bang)' : 'Main Bang / Initial Pulse',
    });

    if (activeSpecimen === 'iiw_v1') {
      const velScale = velocityMs / 5920;
      if (probeAngleDeg === 0) {
        if (iiwPosition === 'B') {
          echoes.push({ soundPathMm: 100 * velScale + zeroShiftMm, baseAmplitudePct: 80, widthMm: 5.2, label: 'R100 Arc' });
          echoes.push({ soundPathMm: 200 * velScale + zeroShiftMm, baseAmplitudePct: 38, widthMm: 7.0, label: '200mm Multiple' });
        } else if (iiwPosition === 'A') {
          echoes.push({ soundPathMm: 25 * velScale + zeroShiftMm, baseAmplitudePct: 85, widthMm: 3.8, label: '25mm Backwall' });
          echoes.push({ soundPathMm: 50 * velScale + zeroShiftMm, baseAmplitudePct: 62, widthMm: 4.8, label: '50mm 2nd Multiple' });
          echoes.push({ soundPathMm: 75 * velScale + zeroShiftMm, baseAmplitudePct: 45, widthMm: 5.5, label: '75mm 3rd Multiple' });
          echoes.push({ soundPathMm: 100 * velScale + zeroShiftMm, baseAmplitudePct: 32, widthMm: 6.0, label: '100mm 4th Multiple' });
        } else {
          echoes.push({ soundPathMm: 15 * velScale + zeroShiftMm, baseAmplitudePct: 60, widthMm: 3.4, label: '1.5mm SDH' });
          echoes.push({ soundPathMm: 100 * velScale + zeroShiftMm, baseAmplitudePct: 40, widthMm: 5.8, label: '100mm Backwall' });
        }
      } else {
        echoes.push({ soundPathMm: 100 + zeroShiftMm, baseAmplitudePct: 82, widthMm: 6.0, label: 'R100 Angle Verification' });
      }
    } else if (activeSpecimen === 'iiw_v2') {
      echoes.push({ soundPathMm: 25 + zeroShiftMm, baseAmplitudePct: 84, widthMm: 4.2, label: 'R25 Arc' });
      echoes.push({ soundPathMm: 50 + zeroShiftMm, baseAmplitudePct: 48, widthMm: 5.8, label: 'R50 Arc' });
    } else if (activeSpecimen === 'weld_butt' || activeSpecimen === 'weld_curved_pipe') {
      const defectDepthMm = currentDefect.nominalDepthRatio * plateThicknessMm;
      const rad = (probeAngleDeg * Math.PI) / 180;
      const cosA = Math.max(0.15, Math.cos(rad));
      const tanA = Math.sin(rad) / cosA;
      const curvatureFactor = activeSpecimen === 'weld_curved_pipe' ? 1 + plateThicknessMm / pipeOuterDiameterMm : 1.0;

      if (probeAngleDeg === 0) {
        // Straight beam checks parent lamination or backwall
        const distLam = Math.abs(weldProbeStandoffMm - currentDefect.distanceFromWeldCenterMm);
        if (currentDefect.id === 'base_lamination' && distLam < 10) {
          echoes.push({
            soundPathMm: defectDepthMm + zeroShiftMm,
            baseAmplitudePct: 90,
            widthMm: 3.4,
            label: 'Base-Metal Lamination',
          });
        } else {
          echoes.push({
            soundPathMm: plateThicknessMm + zeroShiftMm,
            baseAmplitudePct: 86,
            widthMm: 3.6,
            label: '20mm Plate Backwall',
          });
        }
      } else {
        const halfSkip = plateThicknessMm * tanA * curvatureFactor;
        const targetLeg1Standoff = currentDefect.distanceFromWeldCenterMm + defectDepthMm * tanA * curvatureFactor;
        const targetLeg2Standoff =
          currentDefect.distanceFromWeldCenterMm + halfSkip + (plateThicknessMm - defectDepthMm) * tanA;

        const distLeg1 = Math.abs(weldProbeStandoffMm - targetLeg1Standoff);
        const distLeg2 = Math.abs(weldProbeStandoffMm - targetLeg2Standoff);
        const coneHalfW = Math.max(4.5, coneMetrics.width6dBAtDepthMm(defectDepthMm / cosA) / 2);

        const yDist = Math.abs(weldSeamYmm - currentDefect.centerYmm);
        const yFactor = Math.exp(-Math.LN2 * Math.pow(yDist / Math.max(2, currentDefect.lengthMm / 2), 2.2));

        if (distLeg1 <= coneHalfW * 1.45 && yFactor > 0.15) {
          const sPath = defectDepthMm / cosA + zeroShiftMm;
          const spatialDecay = Math.exp(-Math.pow(distLeg1 / coneHalfW, 2));
          echoes.push({
            soundPathMm: sPath,
            baseAmplitudePct: Math.max(10, 88 * currentDefect.reflectivityFactor * spatialDecay * yFactor),
            widthMm: damping === '50_ohm' ? 4.0 : 6.2,
            label: `${currentDefect.codeSymbol} (Leg 1)`,
            isVolumetric: currentDefect.category === 'Volumetric',
            hasTipDiffraction: currentDefect.echoWaveformType === 'sharp_spike_tip',
          });
        } else if (distLeg2 <= coneHalfW * 1.55 && yFactor > 0.15) {
          const sPath = (2 * plateThicknessMm - defectDepthMm) / cosA + zeroShiftMm;
          const spatialDecay = Math.exp(-Math.pow(distLeg2 / (coneHalfW * 1.15), 2));
          echoes.push({
            soundPathMm: sPath,
            baseAmplitudePct: Math.max(10, 78 * currentDefect.reflectivityFactor * spatialDecay * yFactor),
            widthMm: damping === '50_ohm' ? 4.5 : 6.8,
            label: `${currentDefect.codeSymbol} (Leg 2 Skip)`,
            isVolumetric: currentDefect.category === 'Volumetric',
            hasTipDiffraction: currentDefect.echoWaveformType === 'sharp_spike_tip',
          });
        }
      }
    } else if (activeSpecimen === 'corrosion_step') {
      const stepThicknesses = [2.5, 5.0, 7.5, 10.0, 12.5];
      const thk = stepThicknesses[corrosionStepIndex] || 5.0;
      echoes.push({ soundPathMm: thk, baseAmplitudePct: 88, widthMm: 2.6, label: `Backwall (${thk}mm)` });
      echoes.push({ soundPathMm: thk * 2, baseAmplitudePct: 52, widthMm: 3.5, label: `2nd Multiple (${thk * 2}mm)` });
      if (thk * 3 < rangeMm) {
        echoes.push({ soundPathMm: thk * 3, baseAmplitudePct: 28, widthMm: 4.2, label: `3rd Multiple (${thk * 3}mm)` });
      }
    }

    return echoes;
  };

  const simulatedEchoes = getSimulatedEchoes();
  const voltBoost = pulserVoltageV === 400 ? 1.15 : pulserVoltageV === 200 ? 1.0 : 0.85;

  let gateAPeakEcho: EchoPeak | null = null;
  let gateAMaxAmp = 0;
  for (const e of simulatedEchoes) {
    if (e.soundPathMm >= gateAStartMm && e.soundPathMm <= gateAStartMm + gateAWidthMm) {
      const raw = e.baseAmplitudePct * voltBoost * Math.pow(10, (effectiveGainDb - 40) / 20);
      const effectiveAmp = Math.min(100, raw < rejectPct ? 0 : raw);
      if (effectiveAmp > gateAMaxAmp) {
        gateAMaxAmp = effectiveAmp;
        gateAPeakEcho = e;
      }
    }
  }

  const isGateAAlarmTriggered = gateAMaxAmp >= gateAThresholdPct && !isAlarmMuted;
  const rad = (probeAngleDeg * Math.PI) / 180;
  const soundPathMeasured = gateAPeakEcho
    ? gateTriggerMode === 'flank'
      ? Math.max(0, gateAPeakEcho.soundPathMm - gateAPeakEcho.widthMm * 0.35)
      : gateAPeakEcho.soundPathMm
    : 0;

  // Flat vs Curved Pipe Depth & Leg Calculation
  const outerR = pipeOuterDiameterMm / 2;
  const rawCosDepth = soundPathMeasured * Math.cos(rad);
  const legNumber =
    probeAngleDeg > 0 && rawCosDepth > plateThicknessMm
      ? rawCosDepth > plateThicknessMm * 2
        ? 3
        : 2
      : 1;

  const flatTrueDepth =
    soundPathMeasured <= 0
      ? 0
      : legNumber === 1
      ? rawCosDepth
      : legNumber === 2
      ? Math.max(0, 2 * plateThicknessMm - rawCosDepth)
      : Math.max(0, rawCosDepth - 2 * plateThicknessMm);

  const depthMeasured =
    activeSpecimen === 'weld_curved_pipe' && soundPathMeasured > 0
      ? Math.max(
          0,
          outerR -
            Math.sqrt(
              Math.max(
                1,
                outerR * outerR +
                  soundPathMeasured * soundPathMeasured -
                  2 * outerR * soundPathMeasured * Math.cos(rad)
              )
            )
        )
      : flatTrueDepth;

  const surfaceDistMeasured = soundPathMeasured * Math.sin(rad);

  // AWS D1.1 Indication Rating D = A - B - C
  const awsAttenuationC = Math.max(0, 2 * (Math.max(25.4, soundPathMeasured) / 25.4 - 1));
  const awsRatingD = Number((gainDb - 42.0 - awsAttenuationC).toFixed(1));

  // ---------------------------------------------------------------------------
  // 1. Render Realistic Industrial A-Scan CRT/LCD Screen
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Precision 10x10 Industrial Graticule with Sub-ticks
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = (height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        if (i === 2) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
          ctx.strokeStyle = '#1e293b';
        }
      }

      for (let j = 0; j <= 10; j++) {
        const x = (width / 10) * j;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Near-Field (Fresnel Zone: 0 -> N_eff) Overlay on UT A-Scan Screen
      if (coneMetrics.effectiveNearFieldInSpecimenMm > effectiveDelayMm) {
        const nfPx = Math.min(
          width,
          Math.max(0, ((coneMetrics.effectiveNearFieldInSpecimenMm - effectiveDelayMm) / effectiveRangeMm) * width)
        );
        if (nfPx > 2) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.13)';
          ctx.fillRect(0, 0, nfPx, height);
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
          ctx.lineWidth = 1.3;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(nfPx, 0);
          ctx.lineTo(nfPx, height);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#e9d5ff';
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText(`NF=${coneMetrics.effectiveNearFieldInSpecimenMm.toFixed(1)}mm`, Math.min(width - 80, nfPx + 4), 12);
        }
      }

      // Optional Multi-Curve ASME DAC (100%, -6dB, -14dB)
      if (isDacActive && rectification !== 'rf') {
        const drawCurve = (mult: number, stroke: string, dash: boolean) => {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1.5;
          if (dash) ctx.setLineDash([4, 3]);
          ctx.beginPath();
          [
            { s: effectiveRangeMm * 0.18 + effectiveDelayMm, a: 82 * mult },
            { s: effectiveRangeMm * 0.48 + effectiveDelayMm, a: 60 * mult },
            { s: effectiveRangeMm * 0.82 + effectiveDelayMm, a: 40 * mult },
          ].forEach((pt, idx) => {
            const px = ((pt.s - effectiveDelayMm) / effectiveRangeMm) * width;
            const py = height - (Math.min(100, pt.a) / 100) * height;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        };
        drawCurve(1.0, '#f59e0b', false);
        drawCurve(0.5, 'rgba(245, 158, 11, 0.55)', true);
        drawCurve(0.2, 'rgba(56, 189, 248, 0.45)', true);
      }

      // Gate A & Gate B
      if (!isZoomGateA) {
        const gateAXStart = ((gateAStartMm - effectiveDelayMm) / effectiveRangeMm) * width;
        const gateAXEnd = ((gateAStartMm + gateAWidthMm - effectiveDelayMm) / effectiveRangeMm) * width;
        const gateAY = height - (gateAThresholdPct / 100) * height;

        ctx.strokeStyle = isGateAAlarmTriggered ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gateAXStart, gateAY);
        ctx.lineTo(gateAXEnd, gateAY);
        ctx.stroke();
        ctx.fillStyle = isGateAAlarmTriggered ? '#ef4444' : '#06b6d4';
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText(`GATE A (${gateTriggerMode.toUpperCase()})`, gateAXStart + 4, gateAY - 6);

        const gateBXStart = ((gateBStartMm - effectiveDelayMm) / effectiveRangeMm) * width;
        const gateBXEnd = ((gateBStartMm + gateBWidthMm - effectiveDelayMm) / effectiveRangeMm) * width;
        const gateBY = height - (gateBThresholdPct / 100) * height;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gateBXStart, gateBY);
        ctx.lineTo(gateBXEnd, gateBY);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('GATE B', gateBXStart + 4, gateBY - 6);
      }

      // Synthesize Live Waveform + Peak Memory Envelope
      const baselineY = height - 4;
      const currentFrameY: number[] = new Array(width).fill(baselineY);
      const noiseScale = filterBand === 'broadband' ? 1.35 : 0.65;

      ctx.strokeStyle = isGateAAlarmTriggered ? '#f87171' : '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const currentSoundPath = effectiveDelayMm + (x / width) * effectiveRangeMm;
        let signalAmp = 0;

        simulatedEchoes.forEach((echo) => {
          const dist = Math.abs(currentSoundPath - echo.soundPathMm);
          if (dist < echo.widthMm * 2.2) {
            let envelope = Math.exp(-Math.pow(dist / (echo.widthMm * 0.5), 2));
            if (echo.isVolumetric) {
              envelope *= 0.72 + 0.32 * Math.abs(Math.sin(dist * 2.4));
            }
            const rfCarrier = Math.sin((dist / echo.widthMm) * Math.PI * (probeFrequencyMhz * 1.15));
            const gainFactor = voltBoost * Math.pow(10, (effectiveGainDb - 40) / 20);
            const peak = (echo.baseAmplitudePct * gainFactor * (height - 20)) / 100;

            if (rectification === 'full') signalAmp += peak * envelope * Math.abs(rfCarrier);
            else if (rectification === 'positive') signalAmp += peak * envelope * Math.max(0, rfCarrier);
            else if (rectification === 'negative') signalAmp += peak * envelope * Math.max(0, -rfCarrier);
            else signalAmp += (peak * envelope * rfCarrier) / 2;
          }

          // Secondary Tip Diffraction Spike
          if (echo.hasTipDiffraction) {
            const tipDist = Math.abs(currentSoundPath - (echo.soundPathMm - 3.6));
            if (tipDist < 3.5) {
              const tipEnv = Math.exp(-Math.pow(tipDist / 1.2, 2));
              const gainFactor = voltBoost * Math.pow(10, (effectiveGainDb - 40) / 20);
              const tipPeak = (echo.baseAmplitudePct * 0.28 * gainFactor * (height - 20)) / 100;
              signalAmp += tipPeak * tipEnv;
            }
          }
        });

        const rawNoise = (Math.sin(x * 0.3 + Date.now() * 0.008) * 1.2 + (Math.random() - 0.5) * 1.4) * noiseScale;
        const grassNoise = Math.abs(rawNoise) < rejectPct * 0.12 ? 0 : rawNoise;
        const suppressedAmp = signalAmp < (rejectPct / 100) * height ? 0 : signalAmp;

        const totalY =
          rectification === 'rf'
            ? height / 2 - suppressedAmp + grassNoise
            : baselineY - Math.min(height - 8, suppressedAmp + Math.max(0, grassNoise));

        currentFrameY[x] = totalY;
        if (x === 0) ctx.moveTo(x, totalY);
        else ctx.lineTo(x, totalY);
      }
      ctx.stroke();

      // Peak Hold Envelope Overlay
      if (isPeakHold && rectification !== 'rf') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const bestY =
            peakMemoryTrace.length === width ? Math.min(peakMemoryTrace[x], currentFrameY[x]) : currentFrameY[x];
          if (x === 0) ctx.moveTo(x, bestY);
          else ctx.lineTo(x, bestY);
        }
        ctx.stroke();
      }

      if (!isFrozen) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    simulatedEchoes,
    effectiveGainDb,
    effectiveRangeMm,
    effectiveDelayMm,
    gateAStartMm,
    gateAWidthMm,
    gateAThresholdPct,
    gateBStartMm,
    gateBWidthMm,
    gateBThresholdPct,
    gateTriggerMode,
    rectification,
    isFrozen,
    isPeakHold,
    peakMemoryTrace,
    isGateAAlarmTriggered,
    isDacActive,
    isZoomGateA,
    probeFrequencyMhz,
    voltBoost,
    rejectPct,
    filterBand,
    coneMetrics.effectiveNearFieldInSpecimenMm,
  ]);

  // Update Peak Memory Envelope when active
  useEffect(() => {
    if (!isPeakHold) {
      setPeakMemoryTrace([]);
    }
  }, [isPeakHold, activeSpecimen]);

  // ---------------------------------------------------------------------------
  // 2. Render Side-by-Side Live Physical Work Simulator & Beam Cone ("كوم الأشعة")
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = workSimCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#040814';
    ctx.fillRect(0, 0, w, h);

    if (activeSpecimen === 'weld_butt' || activeSpecimen === 'weld_curved_pipe') {
      const originX = w * 0.38;
      const scale = 4.3;
      const topY = 58;
      const bottomY = topY + plateThicknessMm * scale;
      const flawDepthMm = currentDefect.nominalDepthRatio * plateThicknessMm;

      if (activeSpecimen === 'weld_butt') {
        // Steel Plate
        ctx.fillStyle = '#131c36';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.fillRect(16, topY, w - 32, plateThicknessMm * scale);
        ctx.strokeRect(16, topY, w - 32, plateThicknessMm * scale);

        // V-Groove Weld
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(originX - 8.5 * scale, topY);
        ctx.quadraticCurveTo(originX, topY - 3 * scale, originX + 8.5 * scale, topY);
        ctx.lineTo(originX + 1.5 * scale, bottomY);
        ctx.lineTo(originX - 1.5 * scale, bottomY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Defect Shape
        const defX = originX + currentDefect.distanceFromWeldCenterMm * scale;
        const defY = topY + flawDepthMm * scale;
        drawComprehensiveDefectMorphology(
          ctx,
          currentDefect.id,
          defX,
          defY,
          topY,
          bottomY,
          scale,
          gateAMaxAmp >= gateAThresholdPct
        );

        // Probe & Ultrasonic Beam Cone ("كوم الأشعة")
        const entryX = originX + weldProbeStandoffMm * scale;
        const radA = (probeAngleDeg * Math.PI) / 180;
        const halfSkipPx = probeAngleDeg === 0 ? 0 : plateThicknessMm * Math.tan(radA) * scale;
        const bounceX = probeAngleDeg === 0 ? entryX : entryX - halfSkipPx;
        const leg2X = probeAngleDeg === 0 ? undefined : bounceX - halfSkipPx;

        if (showBeamCone) {
          drawUltrasonicBeamCone2D({
            ctx,
            entryX,
            entryY: topY,
            bounceX,
            bounceY: bottomY,
            leg2EndX: leg2X,
            leg2EndY: probeAngleDeg === 0 ? undefined : topY,
            scalePxPerMm: scale,
            coneMetrics,
            showWavefronts,
            showNearField: true,
            isHit: gateAMaxAmp >= gateAThresholdPct,
          });
        }

        // Central Ray Spine
        ctx.strokeStyle = gateAMaxAmp >= gateAThresholdPct ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(entryX, topY);
        ctx.lineTo(bounceX, bottomY);
        if (leg2X !== undefined) ctx.lineTo(leg2X, topY);
        ctx.stroke();

        // Physical Probe + Perspex Wedge + Coax BNC
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#7dd3fc';
        ctx.fillRect(entryX - 4, topY - 18, 28, 18);
        ctx.strokeRect(entryX - 4, topY - 18, 28, 18);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(entryX + 6, topY - 25, 6, 7); // Brass BNC
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText(`${probeAngleDeg}°`, entryX + 2, topY - 6);
      } else {
        // Curved Pipe Work Specimen
        const visOuterR = 210;
        const thkPx = plateThicknessMm * scale * 0.92;
        const visInnerR = visOuterR - thkPx;
        const cx = originX;
        const cy = 54 + visOuterR;

        ctx.fillStyle = '#131c36';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, visOuterR, -Math.PI / 2 - 0.65, -Math.PI / 2 + 0.78);
        ctx.arc(cx, cy, visInnerR, -Math.PI / 2 + 0.78, -Math.PI / 2 - 0.65, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Weld Groove at Crown
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(cx - 32, cy - visOuterR + 2);
        ctx.lineTo(cx + 32, cy - visOuterR + 2);
        ctx.lineTo(cx + 6, cy - visInnerR);
        ctx.lineTo(cx - 6, cy - visInnerR);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const defX = cx + currentDefect.distanceFromWeldCenterMm * scale * 0.85;
        const defY = cy - visOuterR + (flawDepthMm / plateThicknessMm) * thkPx;
        drawComprehensiveDefectMorphology(
          ctx,
          currentDefect.id,
          defX,
          defY,
          cy - visOuterR,
          cy - visInnerR,
          scale * 0.9,
          gateAMaxAmp >= gateAThresholdPct
        );

        const gamma = (weldProbeStandoffMm * scale) / visOuterR;
        const pAng = -Math.PI / 2 + gamma;
        const entryX = cx + visOuterR * Math.cos(pAng);
        const entryY = cy + visOuterR * Math.sin(pAng);
        const radA = (probeAngleDeg * Math.PI) / 180;
        const idAng = pAng - (plateThicknessMm * Math.tan(radA) * scale) / visOuterR;
        const bounceX = cx + visInnerR * Math.cos(idAng);
        const bounceY = cy + visInnerR * Math.sin(idAng);
        const odAng2 = idAng - (plateThicknessMm * Math.tan(radA) * scale) / visOuterR;
        const leg2X = cx + visOuterR * Math.cos(odAng2);
        const leg2Y = cy + visOuterR * Math.sin(odAng2);

        if (showBeamCone) {
          drawUltrasonicBeamCone2D({
            ctx,
            entryX,
            entryY,
            bounceX,
            bounceY,
            leg2EndX: probeAngleDeg > 0 ? leg2X : undefined,
            leg2EndY: probeAngleDeg > 0 ? leg2Y : undefined,
            scalePxPerMm: scale * 0.9,
            coneMetrics,
            showWavefronts,
            showNearField: true,
            isHit: gateAMaxAmp >= gateAThresholdPct,
          });
        }

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(entryX, entryY - 5, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Top-View Seam Y Strip inside Work Simulator
      const stripY = h - 42;
      ctx.fillStyle = '#090f20';
      ctx.strokeStyle = '#1e293b';
      ctx.fillRect(16, stripY, w - 32, 30);
      ctx.strokeRect(16, stripY, w - 32, 30);
      const seamStartPx = 16 + ((currentDefect.centerYmm - currentDefect.lengthMm / 2) / 100) * (w - 32);
      const seamLenPx = Math.max(8, (currentDefect.lengthMm / 100) * (w - 32));
      ctx.fillStyle = currentDefect.category === 'Planar' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)';
      ctx.fillRect(seamStartPx, stripY + 9, seamLenPx, 12);
      const probeYPx = 16 + (weldSeamYmm / 100) * (w - 32);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(probeYPx, stripY);
      ctx.lineTo(probeYPx, stripY + 30);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`TOP SEAM SCAN: Y=${weldSeamYmm}mm · Defect [${currentDefect.codeSymbol}]`, 22, stripY - 5);
    } else if (activeSpecimen === 'iiw_v1' || activeSpecimen === 'iiw_v2') {
      // Calibration Block Worktable with Beam Cone
      const bx = 42;
      const by = 52;
      const bw = w - 84;
      const bh = h - 92;
      ctx.fillStyle = '#16213e';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw * 0.72, by);
      ctx.arc(bx + bw * 0.35, by, bw * 0.37, 0, Math.PI * 0.44);
      ctx.lineTo(bx, by + bh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Perspex insert & 1.5mm SDH
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(bx + bw * 0.34, by + bh * 0.55, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bx + bw * 0.58, by + 28, 4.5, 0, Math.PI * 2);
      ctx.fill();

      const entryX =
        iiwPosition === 'A' ? bx + 55 : iiwPosition === 'C' ? bx + bw * 0.58 : bx + bw * 0.35;
      const targetX =
        iiwPosition === 'A' ? bx + 55 : iiwPosition === 'C' ? bx + bw * 0.58 : bx + bw * 0.68;
      const targetY =
        iiwPosition === 'A' ? by + bh : iiwPosition === 'C' ? by + 28 : by + bh * 0.62;

      if (showBeamCone) {
        drawUltrasonicBeamCone2D({
          ctx,
          entryX,
          entryY: by,
          bounceX: targetX,
          bounceY: targetY,
          scalePxPerMm: 2.2,
          coneMetrics,
          showWavefronts,
          showNearField: true,
        });
      }

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(entryX - 15, by - 16, 30, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        activeSpecimen === 'iiw_v1'
          ? `IIW V1 BLOCK (Pos ${iiwPosition}) · Cone NF=${coneMetrics.nearFieldLengthMm.toFixed(0)}mm`
          : 'IIW V2 MINI CALIBRATION BLOCK (R25 / R50mm)',
        24,
        26
      );
    } else {
      // 5-Step Corrosion Wedge with Beam Cone
      const steps = [2.5, 5.0, 7.5, 10.0, 12.5];
      const stepW = (w - 60) / 5;
      const baseBottom = h - 38;
      steps.forEach((thk, idx) => {
        const sh = thk * 11;
        const sx = 30 + idx * stepW;
        const sy = baseBottom - sh;
        ctx.fillStyle = idx === corrosionStepIndex ? '#1e3a5f' : '#131c36';
        ctx.strokeStyle = idx === corrosionStepIndex ? '#38bdf8' : '#334155';
        ctx.fillRect(sx, sy, stepW - 4, sh);
        ctx.strokeRect(sx, sy, stepW - 4, sh);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(`${thk}mm`, sx + 10, baseBottom + 14);

        if (idx === corrosionStepIndex) {
          const cx = sx + (stepW - 4) / 2;
          if (showBeamCone) {
            drawUltrasonicBeamCone2D({
              ctx,
              entryX: cx,
              entryY: sy,
              bounceX: cx,
              bounceY: baseBottom,
              scalePxPerMm: 8,
              coneMetrics,
              showWavefronts,
              showNearField: false,
            });
          }
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(cx - 12, sy - 14, 24, 14);
        }
      });
    }
  }, [
    activeSpecimen,
    iiwPosition,
    weldProbeStandoffMm,
    weldSeamYmm,
    currentDefect,
    pipeOuterDiameterMm,
    corrosionStepIndex,
    probeAngleDeg,
    coneMetrics,
    showBeamCone,
    showWavefronts,
    gateAMaxAmp,
    gateAThresholdPct,
  ]);

  const handleWorkCanvasPointer = (clientX: number) => {
    if (activeSpecimen !== 'weld_butt' && activeSpecimen !== 'weld_curved_pipe') return;
    const canvas = workSimCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (clientX - rect.left) / Math.max(1, rect.width);
    const px = relX * canvas.width;
    const originX = canvas.width * 0.38;
    const mm = Math.round(Math.max(5, Math.min(72, (px - originX) / 4.3)));
    setWeldProbeStandoffMm(mm);
  };

  const handleLogUtInspection = () => {
    const actualDepth = Number((currentDefect.nominalDepthRatio * plateThicknessMm).toFixed(1));
    const res = gradeAndRecordWorkshopAttempt({
      instrument: 'UT',
      deviceModel: `Krautkrämer USM 35X (${probeAngleDeg}° · ${probeFrequencyMhz}MHz)`,
      specimenGeometry: activeSpecimen === 'weld_curved_pipe' ? 'curved' : 'flat',
      defectId: currentDefect.id,
      defectNameAr: currentDefect.name.ar,
      defectNameEn: currentDefect.name.en,
      actualDepthMm: actualDepth,
      measuredDepthMm: depthMeasured > 0 ? depthMeasured : actualDepth,
      actualLengthMm: currentDefect.lengthMm,
      measuredLengthMm: currentDefect.lengthMm,
      echoAmplitudePct: gateAMaxAmp > 0 ? gateAMaxAmp : 75,
      codeStandard: activeDefectTolerance.codeCitation,
      traineeVerdict: traineeVerdictChoice,
      actualCodeVerdict: activeDefectTolerance.reject ? 'REJECT' : 'ACCEPT',
    });
    setLogFeedbackMsg(
      isAr
        ? `تم حفظ النتيجة في سجل التدريب بالأسفل (${res.scorePct}%)!`
        : `Logged to Training Results below (${res.scorePct}%)!`
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-5">
      {/* Top Industrial Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr
                ? 'محاكي جهاز كشف العيوب الرقمي UT الكامل (Krautkrämer USM 35X / EPOCH Series)'
                : 'Authentic Digital Ultrasonic Flaw Detector Hardware (Krautkrämer USM 35X)'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {isAr
              ? 'جهاز UT بجميع مفاتيحه الواقعية مدمج بجانبه محاكي العمل وكوم الأشعة'
              : 'Full-Option UT Hardware Chassis Merged Side-by-Side with Live Work & Beam Cone Simulator'}
          </h3>
        </div>

        {/* Specimen Quick Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {[
            { id: 'iiw_v1', title: isAr ? 'كتلة IIW V1' : 'IIW V1 Block', sub: 'R100 / SDH', angle: 0, range: 200 },
            { id: 'iiw_v2', title: isAr ? 'كتلة V2' : 'IIW V2 Block', sub: 'R25 / R50', angle: 45, range: 100 },
            { id: 'weld_butt', title: isAr ? 'عينة لحام فلات (Flat)' : 'Flat Butt Weld', sub: '20mm V-Weld', angle: 60, range: 100 },
            { id: 'weld_curved_pipe', title: isAr ? 'عينة لحام كيرف (Curved)' : 'Curved Pipe Weld', sub: `OD ${pipeOuterDiameterMm}mm`, angle: 60, range: 100 },
            { id: 'corrosion_step', title: isAr ? 'كتلة السلالم' : 'Step Wedge', sub: '2.5-12.5mm', angle: 0, range: 50 },
          ].map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => {
                setActiveSpecimen(spec.id as SpecimenType);
                setProbeAngleDeg(spec.angle);
                setRangeMm(spec.range);
                setVelocityMs(spec.angle === 0 ? 5920 : 3240);
                setLogFeedbackMsg(null);
              }}
              className={`p-2 rounded-xl border text-start transition cursor-pointer ${
                activeSpecimen === spec.id
                  ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold leading-tight">{spec.title}</div>
              <div className="text-[9.5px] text-slate-500 font-mono">{spec.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          SIDE-BY-SIDE MERGED WORKSPACE:
          [1] AUTHENTIC RUGGED UT HARDWARE BEZEL  +  [2] LIVE PHYSICAL WORK SIMULATOR
         ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* ==================== [1] AUTHENTIC UT HARDWARE INSTRUMENT CHASSIS (7 Cols) ==================== */}
        <div className="xl:col-span-7 rounded-2xl border-2 border-slate-700 bg-[#0d1322] p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between space-y-3">
          {/* Rugged Top Connector & Alarm LED Bezel Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px]">
            <div className="flex items-center gap-3">
              <span className="font-black text-cyan-400 tracking-wider">USM 35X · Krautkrämer</span>
              <span className="text-slate-400">BNC T/R1 ●</span>
              <span className="text-slate-500">PRF {prfHz}Hz</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded border font-bold ${
                  isGateAAlarmTriggered
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {isGateAAlarmTriggered ? '▲ GATE A ALARM!' : '● GATE ARMED'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                BAT 98%
              </span>
              <button
                type="button"
                onClick={() => setIsAlarmMuted(!isAlarmMuted)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                aria-label="Mute Alarm"
              >
                {isAlarmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Instrument Inner Body: LCD Screen + Right Tactile Membrane Keypad */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            {/* LCD Display + F1-F5 Softkeys (8 Cols) */}
            <div className="md:col-span-8 flex flex-col justify-between rounded-xl border-2 border-slate-800 bg-black p-2.5 space-y-2">
              {/* Top 5-Slot Live Digital Readout Ribbon (Like EPOCH / USM Top Bar) */}
              <div className="grid grid-cols-5 gap-1.5 pb-1.5 border-b border-slate-800 font-mono tabular-nums text-center">
                <div className="bg-slate-950 rounded p-1 border border-slate-800/80">
                  <div className="text-[9px] text-slate-500">SA (Path)</div>
                  <div className="text-xs sm:text-sm font-black text-cyan-400">
                    {soundPathMeasured > 0 ? `${soundPathMeasured.toFixed(1)}` : '---'}
                    <span className="text-[9px] text-slate-500 ml-0.5">mm</span>
                  </div>
                </div>
                <div className="bg-slate-950 rounded p-1 border border-slate-800/80">
                  <div className="text-[9px] text-slate-500">DA (Depth)</div>
                  <div className="text-xs sm:text-sm font-black text-amber-400">
                    {depthMeasured > 0 ? `${depthMeasured.toFixed(1)}` : '---'}
                    <span className="text-[9px] text-slate-500 ml-0.5">mm</span>
                  </div>
                </div>
                <div className="bg-slate-950 rounded p-1 border border-slate-800/80">
                  <div className="text-[9px] text-slate-500">PA (Surf X)</div>
                  <div className="text-xs sm:text-sm font-black text-slate-200">
                    {surfaceDistMeasured > 0 ? `${surfaceDistMeasured.toFixed(1)}` : '---'}
                    <span className="text-[9px] text-slate-500 ml-0.5">mm</span>
                  </div>
                </div>
                <div className="bg-slate-950 rounded p-1 border border-slate-800/80">
                  <div className="text-[9px] text-slate-500">% FSH / LEG</div>
                  <div className={`text-xs sm:text-sm font-black ${isGateAAlarmTriggered ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {gateAMaxAmp.toFixed(0)}% <span className="text-[9px] text-cyan-400">L{legNumber}</span>
                  </div>
                </div>
                <div className="bg-slate-950 rounded p-1 border border-slate-800/80">
                  <div className="text-[9px] text-slate-500">{isAwsMode ? 'AWS D-RTG' : 'GAIN dB'}</div>
                  <div className="text-xs sm:text-sm font-black text-white">
                    {isAwsMode ? `${awsRatingD}` : `${gainDb.toFixed(1)} dB`}
                  </div>
                </div>
              </div>

              {/* Status Overlay Strip */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 tabular-nums">
                <span>
                  RNG: <strong className="text-white">{effectiveRangeMm}mm</strong> · VEL:{' '}
                  <strong className="text-white">{velocityMs} m/s</strong> · ZERO: {zeroDelayUs.toFixed(2)}µs
                </span>
                <span>
                  <strong className="text-amber-300">{probeAngleDeg}°</strong> ({probeFrequencyMhz}MHz · Ø{crystalDiameterMm}mm) ·{' '}
                  {rectification.toUpperCase()}
                </span>
              </div>

              {/* A-Scan Oscilloscope Canvas */}
              <canvas
                ref={canvasRef}
                width={560}
                height={265}
                className="w-full h-56 sm:h-64 rounded-lg bg-slate-950 border border-slate-800 cursor-crosshair select-none"
              />

              {/* Horizontal Distance Scale */}
              <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-500 px-1 tabular-nums">
                <span>{effectiveDelayMm} mm</span>
                <span>{(effectiveDelayMm + effectiveRangeMm * 0.25).toFixed(0)} mm</span>
                <span>{(effectiveDelayMm + effectiveRangeMm * 0.5).toFixed(0)} mm</span>
                <span>{(effectiveDelayMm + effectiveRangeMm * 0.75).toFixed(0)} mm</span>
                <span>{effectiveDelayMm + effectiveRangeMm} mm</span>
              </div>

              {/* Bottom F1–F5 Hardware Softkey Menu Tabs */}
              <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-800 font-mono text-[10px]">
                {(
                  [
                    { id: 'basic', f: 'F1', label: 'BASIC' },
                    { id: 'pulser', f: 'F2', label: 'P/R & FLT' },
                    { id: 'gates', f: 'F3', label: 'GATE A/B' },
                    { id: 'trig', f: 'F4', label: 'TRIG/PRB' },
                    { id: 'dac_aws', f: 'F5', label: 'DAC/AWS' },
                  ] as const
                ).map((sk) => (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => setActiveSoftMenu(sk.id)}
                    className={`py-1.5 rounded border text-center cursor-pointer transition ${
                      activeSoftMenu === sk.id
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="block text-[8.5px] opacity-75">{sk.f}</span>
                    <span>{sk.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Tactile Hardware Keypad & Jog Wheel (4 Cols) */}
            <div className="md:col-span-4 rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between space-y-3 font-mono text-xs">
              {/* Rotary Gain Knob & Coarse/Fine Step */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">GAIN {scanBoost6dB ? '(+6 SCAN)' : ''}</span>
                  <span className="text-sm font-black text-cyan-400 tabular-nums">{gainDb.toFixed(1)} dB</span>
                </div>

                {/* Direct Gain Step Buttons (preserving '+6' exact name for tests!) */}
                <div className="grid grid-cols-3 gap-1">
                  {[-6, -1, -dbStep, dbStep, 1, 6].map((delta, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGainDb((prev) => Number(Math.min(100, Math.max(0, prev + delta)).toFixed(1)))}
                      className="py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-white font-bold text-[10px] cursor-pointer tabular-nums"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>

                {/* Fine dB Step Selector */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  <span className="text-[9.5px] text-slate-500">dB STEP:</span>
                  {([0.1, 0.5, 1.0, 6.0] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDbStep(st)}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] border cursor-pointer tabular-nums ${
                        dbStep === st ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Function Hard-Keys (80% AUTO, +6dB SCAN, ZOOM, PEAK, FREEZE, DAC) */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    if (gateAMaxAmp > 2) {
                      const diff = 20 * Math.log10(80 / gateAMaxAmp);
                      setGainDb((prev) => Number(Math.min(100, Math.max(0, prev + diff)).toFixed(1)));
                    }
                  }}
                  className="py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold cursor-pointer"
                >
                  AUTO 80%
                </button>

                <button
                  type="button"
                  onClick={() => setScanBoost6dB(!scanBoost6dB)}
                  className={`py-2 rounded-lg border font-bold cursor-pointer ${
                    scanBoost6dB ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  +6dB SCAN
                </button>

                <button
                  type="button"
                  onClick={() => setIsPeakHold(!isPeakHold)}
                  className={`py-2 rounded-lg border font-bold cursor-pointer ${
                    isPeakHold ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  PEAK {isPeakHold ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFrozen(!isFrozen)}
                  className={`py-2 rounded-lg border font-bold cursor-pointer ${
                    isFrozen ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {isFrozen ? 'FROZEN' : 'FREEZE'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsZoomGateA(!isZoomGateA)}
                  className={`py-2 rounded-lg border font-bold cursor-pointer flex items-center justify-center gap-1 ${
                    isZoomGateA ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>ZOOM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDacActive(!isDacActive)}
                  className={`py-2 rounded-lg border font-bold cursor-pointer ${
                    isDacActive ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  DAC {isDacActive ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Dynamic Softkey Parameter Sub-Panel */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 flex-1">
                {activeSoftMenu === 'basic' && (
                  <>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">RANGE (mm):</div>
                      <div className="grid grid-cols-5 gap-1">
                        {[50, 100, 200, 250, 500].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRangeMm(r)}
                            className={`py-1 rounded border text-[9.5px] cursor-pointer ${
                              rangeMm === r ? 'bg-cyan-600 text-white border-cyan-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>VELOCITY:</span>
                        <span className="text-cyan-400 tabular-nums">{velocityMs} m/s</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 mt-1 text-[9.5px]">
                        {[
                          { v: 5920, l: '5920 L' },
                          { v: 3240, l: '3240 S' },
                          { v: 6320, l: '6320 Al' },
                        ].map((m) => (
                          <button
                            key={m.v}
                            type="button"
                            onClick={() => setVelocityMs(m.v)}
                            className={`py-1 rounded border cursor-pointer ${
                              velocityMs === m.v ? 'bg-cyan-600/30 text-cyan-300 border-cyan-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {m.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>ZERO OFFSET:</span>
                        <span className="text-cyan-400 tabular-nums">{zeroDelayUs.toFixed(2)} µs</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.05"
                        value={zeroDelayUs}
                        onChange={(e) => setZeroDelayUs(Number(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {activeSoftMenu === 'pulser' && (
                  <>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">RECTIFICATION:</div>
                      <div className="grid grid-cols-4 gap-1 text-[9.5px]">
                        {(['full', 'positive', 'negative', 'rf'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setRectification(m)}
                            className={`py-1 rounded border uppercase cursor-pointer ${
                              rectification === m ? 'bg-cyan-600 text-white border-cyan-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {m === 'positive' ? '+HW' : m === 'negative' ? '-HW' : m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                      <button
                        type="button"
                        onClick={() => setDamping(damping === '50_ohm' ? '500_ohm' : '50_ohm')}
                        className="py-1 rounded border border-slate-700 bg-slate-900 text-amber-300 cursor-pointer"
                      >
                        Damp: {damping === '50_ohm' ? '50Ω' : '500Ω'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPulserVoltageV(pulserVoltageV === 200 ? 400 : pulserVoltageV === 400 ? 100 : 200)}
                        className="py-1 rounded border border-slate-700 bg-slate-900 text-amber-300 cursor-pointer"
                      >
                        Volt: {pulserVoltageV}V
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrfHz(prfHz === 500 ? 1000 : prfHz === 1000 ? 125 : 500)}
                        className="py-1 rounded border border-slate-700 bg-slate-900 text-cyan-300 cursor-pointer"
                      >
                        PRF: {prfHz}Hz
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFilterBand(filterBand === 'broadband' ? 'narrow_4m' : filterBand === 'narrow_4m' ? 'narrow_2m' : 'broadband')
                        }
                        className="py-1 rounded border border-slate-700 bg-slate-900 text-cyan-300 cursor-pointer"
                      >
                        Flt: {filterBand === 'broadband' ? 'BB' : filterBand === 'narrow_4m' ? '4MHz' : '2MHz'}
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>REJECT:</span>
                        <span>{rejectPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={rejectPct}
                        onChange={(e) => setRejectPct(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {activeSoftMenu === 'gates' && (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveGateTab('A')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            activeGateTab === 'A' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          Gate A
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveGateTab('B')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            activeGateTab === 'B' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          Gate B
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGateTriggerMode(gateTriggerMode === 'peak' ? 'flank' : 'peak')}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9.5px] text-cyan-300 cursor-pointer"
                      >
                        {gateTriggerMode.toUpperCase()}
                      </button>
                    </div>

                    {activeGateTab === 'A' ? (
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Start: {gateAStartMm}mm</span>
                          <span>Width: {gateAWidthMm}mm</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max={Math.max(20, rangeMm - 20)}
                          value={gateAStartMm}
                          onChange={(e) => setGateAStartMm(Number(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={gateAWidthMm}
                          onChange={(e) => setGateAWidthMm(Number(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-slate-400">
                          <span>Threshold:</span>
                          <span>{gateAThresholdPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={gateAThresholdPct}
                          onChange={(e) => setGateAThresholdPct(Number(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Start: {gateBStartMm}mm</span>
                          <span>Thresh: {gateBThresholdPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max={Math.max(30, rangeMm - 20)}
                          value={gateBStartMm}
                          onChange={(e) => setGateBStartMm(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={gateBThresholdPct}
                          onChange={(e) => setGateBThresholdPct(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </>
                )}

                {activeSoftMenu === 'trig' && (
                  <>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">PROBE ANGLE:</div>
                      <div className="grid grid-cols-4 gap-1 text-[10px]">
                        {[0, 45, 60, 70].map((deg) => (
                          <button
                            key={deg}
                            type="button"
                            onClick={() => {
                              setProbeAngleDeg(deg);
                              setVelocityMs(deg === 0 ? 5920 : 3240);
                            }}
                            className={`py-1 rounded border cursor-pointer ${
                              probeAngleDeg === deg ? 'bg-amber-600 text-white border-amber-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div>
                        <div className="text-slate-400 mb-1">FREQ:</div>
                        <div className="grid grid-cols-3 gap-1">
                          {[2, 4, 5].map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setProbeFrequencyMhz(f)}
                              className={`py-1 rounded border cursor-pointer ${
                                probeFrequencyMhz === f ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              {f}M
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1">CRYSTAL Ø:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {[10, 14].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setCrystalDiameterMm(d)}
                              className={`py-1 rounded border cursor-pointer ${
                                crystalDiameterMm === d ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              {d}mm
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeSoftMenu === 'dac_aws' && (
                  <div className="space-y-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setIsAwsMode(!isAwsMode)}
                      className={`w-full py-1.5 rounded border font-bold cursor-pointer ${
                        isAwsMode ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      AWS D1.1 MODE {isAwsMode ? 'ACTIVE' : 'OFF'}
                    </button>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1 tabular-nums text-slate-300">
                      <div>A (Indication): {gainDb.toFixed(1)} dB</div>
                      <div>B (Ref IIW): 42.0 dB</div>
                      <div>C (Atten): {awsAttenuationC.toFixed(1)} dB</div>
                      <div className="text-amber-400 font-bold">D = A-B-C = {awsRatingD} dB</div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setGainDb(42);
                  setVelocityMs(probeAngleDeg === 0 ? 5920 : 3240);
                  setZeroDelayUs(0.85);
                  setDisplayDelayMm(0);
                  setRejectPct(0);
                  setIsZoomGateA(false);
                }}
                className="w-full py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET HARDWARE</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================== [2] SIDE-BY-SIDE PHYSICAL WORK & BEAM CONE SIMULATOR (5 Cols) ==================== */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr ? 'محاكي العمل الحي وكوم الأشعة (اسحب البروب):' : 'Live Specimen Worktable & Sound Cone:'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setShowBeamCone(!showBeamCone)}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  showBeamCone ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50 font-bold' : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                {isAr ? 'كوم الأشعة' : 'Beam Cone'}
              </button>
              <button
                type="button"
                onClick={() => setShowWavefronts(!showWavefronts)}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  showWavefronts ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                {isAr ? 'الموجات' : 'Waves'}
              </button>
            </div>
          </div>

          {/* Interactive Work Specimen Canvas */}
          <canvas
            ref={workSimCanvasRef}
            width={440}
            height={235}
            onMouseDown={(e) => {
              setIsDraggingWorkProbe(true);
              handleWorkCanvasPointer(e.clientX);
            }}
            onMouseMove={(e) => {
              if (isDraggingWorkProbe) handleWorkCanvasPointer(e.clientX);
            }}
            onMouseUp={() => setIsDraggingWorkProbe(false)}
            onMouseLeave={() => setIsDraggingWorkProbe(false)}
            className="w-full h-56 rounded-xl bg-slate-950 border border-slate-800 cursor-ew-resize select-none"
          />

          {/* Dynamic Specimen Manipulation Controls */}
          <div className="space-y-3 font-mono text-xs">
            {(activeSpecimen === 'weld_butt' || activeSpecimen === 'weld_curved_pipe') && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'اختر العيب داخل العينة (16 شكلاً):' : 'Select Specimen Defect (16 Types):'}
                    </span>
                    <select
                      value={selectedWeldDefectId}
                      onChange={(e) => {
                        const nextId = e.target.value as ExtendedWeldFlawId;
                        setSelectedWeldDefectId(nextId);
                        const spec = ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === nextId);
                        if (spec) {
                          setProbeAngleDeg(spec.optimalAngleDeg);
                          setVelocityMs(spec.optimalAngleDeg === 0 ? 5920 : 3240);
                        }
                        if (autoAlertOnDefectSelect) {
                          setIsToleranceModalOpen(true);
                        }
                      }}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-white text-[11px]"
                    >
                      {ALL_WELD_DEFECTS_CATALOG.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.codeSymbol} · {isAr ? d.name.ar : d.name.en}
                        </option>
                      ))}
                    </select>
                  </label>

                  {activeSpecimen === 'weld_curved_pipe' ? (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'قطر الأنبوب OD:' : 'Pipe OD:'}</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[114, 219, 324].map((od) => (
                          <button
                            key={od}
                            type="button"
                            onClick={() => setPipeOuterDiameterMm(od)}
                            className={`py-1.5 rounded border text-[10px] cursor-pointer ${
                              pipeOuterDiameterMm === od ? 'bg-emerald-600 text-white border-emerald-400 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {od}mm
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 tabular-nums">
                      <div className="text-cyan-400 font-bold">
                        {isAr ? 'خصائص كوم الأشعة:' : 'Beam Cone Metrics:'}
                      </div>
                      <div>
                        NF={coneMetrics.nearFieldLengthMm.toFixed(1)}mm · γ(-6dB)=±{coneMetrics.halfAngleMinus6dBDeg.toFixed(1)}°
                      </div>
                    </div>
                  )}
                </div>

                <DefectToleranceTriggerBar
                  defectId={selectedWeldDefectId}
                  activeCode={selectedCode}
                  thicknessMm={plateThicknessMm}
                  language={language}
                  autoAlertOnSelect={autoAlertOnDefectSelect}
                  onToggleAutoAlert={setAutoAlertOnDefectSelect}
                  onOpenModal={() => setIsToleranceModalOpen(true)}
                  compact
                />

                {/* X & Y Probe Sliders */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span>{isAr ? 'بعد البروب X:' : 'Standoff X:'}</span>
                      <span className="text-cyan-400 font-bold tabular-nums">{weldProbeStandoffMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="72"
                      value={weldProbeStandoffMm}
                      onChange={(e) => setWeldProbeStandoffMm(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span>{isAr ? 'موضع اللحام Y:' : 'Seam Axis Y:'}</span>
                      <span className="text-amber-400 font-bold tabular-nums">{weldSeamYmm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={weldSeamYmm}
                      onChange={(e) => setWeldSeamYmm(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Live Near-Field Calculation & Active Defect Code Tolerance Strip */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/35 space-y-2 text-[10.5px] tabular-nums">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-slate-800">
                    <span className="text-purple-300 font-bold">
                      {isAr
                        ? `المجال القريب: N = D²f/4V = ${coneMetrics.nearFieldLengthMm.toFixed(1)}مم (صافي ${coneMetrics.effectiveNearFieldInSpecimenMm.toFixed(1)}مم)`
                        : `Near Field: N = D²f/4V = ${coneMetrics.nearFieldLengthMm.toFixed(1)}mm (N_eff=${coneMetrics.effectiveNearFieldInSpecimenMm.toFixed(1)}mm)`}
                    </span>
                    <span className="text-slate-400">λ={coneMetrics.wavelengthMm.toFixed(2)}mm</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex flex-wrap gap-1">
                      {INSPECTION_CODES_META.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCode(c.id)}
                          className={`px-1.5 py-0.5 rounded border text-[9.5px] cursor-pointer ${
                            selectedCode === c.id
                              ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {c.shortLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-slate-400">
                      {isAr ? 'سماحية العيب بالكود:' : 'Allowable Tolerance:'}
                    </span>
                    <span className={`font-bold ${activeDefectTolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'}`}>
                      {activeDefectTolerance.toleranceBadge[language]}
                    </span>
                  </div>
                </div>

                {/* Quick Log to Training Results Bar */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTraineeVerdictChoice('ACCEPT')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                        traineeVerdictChoice === 'ACCEPT' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      ACCEPT
                    </button>
                    <button
                      type="button"
                      onClick={() => setTraineeVerdictChoice('REJECT')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                        traineeVerdictChoice === 'REJECT' ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      REJECT
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogUtInspection}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1.5"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تسجيل النتيجة بالتدريب' : 'Log to Results'}</span>
                  </button>
                </div>

                {logFeedbackMsg && (
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{logFeedbackMsg}</span>
                  </div>
                )}
              </>
            )}

            {activeSpecimen === 'iiw_v1' && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { pos: 'B', label: 'Pos B (R100 Arc)' },
                    { pos: 'A', label: 'Pos A (25mm Thk)' },
                    { pos: 'C', label: 'Pos C (1.5mm SDH)' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.pos}
                    type="button"
                    onClick={() => setIiwPosition(item.pos)}
                    className={`py-2 px-2 rounded-lg border transition cursor-pointer text-[11px] ${
                      iiwPosition === item.pos ? 'bg-cyan-600 text-white border-cyan-400 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {activeSpecimen === 'corrosion_step' && (
              <div className="grid grid-cols-5 gap-1.5">
                {[2.5, 5.0, 7.5, 10.0, 12.5].map((thk, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCorrosionStepIndex(idx)}
                    className={`py-2 rounded-lg border transition cursor-pointer text-[11px] ${
                      corrosionStepIndex === idx ? 'bg-cyan-600 text-white border-cyan-400 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {thk}mm
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DefectToleranceModal
        isOpen={isToleranceModalOpen}
        onClose={() => setIsToleranceModalOpen(false)}
        defectId={selectedWeldDefectId}
        activeCode={selectedCode}
        onSelectCode={setSelectedCode}
        thicknessMm={plateThicknessMm}
        language={language}
        autoAlertOnSelect={autoAlertOnDefectSelect}
        onToggleAutoAlert={setAutoAlertOnDefectSelect}
      />
    </div>
  );
};
