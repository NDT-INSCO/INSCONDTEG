import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { clickable, clickableRow } from '../../../utils/a11y';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Download,
  Pause,
  Play,
  FlipHorizontal,
  Radio,
  Film,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Crosshair,
  Award,
  RotateCcw,
  Eye,
  Clock,
  X,
} from 'lucide-react';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import { GeRadiographicExposureTimeApp } from './GeRadiographicExposureTimeApp';
import {
  AR_RT_ACCEPTANCE_CODES,
  AR_RT_CODE_TECHNIQUES,
  AR_RT_FILM_DEFECTS,
  AR_RT_RADIATION_SOURCES,
  ArRtAcceptanceCodeId,
  ArRtCodeTechniqueId,
  ArRtDefectCategory,
  ArRtFilmDefectId,
  ArRtFilmDefectSpec,
  ArRtRadiationSourceId,
  computeArRtTechniquePhysics,
  computeFilmDensityProfile,
  evaluateDefectAcrossAllCodes,
} from '../../../data/arRadiographyCompleteEngine';

type ArSimulatorStreamState = 'idle' | 'requesting' | 'active' | 'error' | 'calibration_backdrop';
type WorkbenchPillarTab = 'techniques_ar' | 'film_defects' | 'acceptance_codes';

interface VideoDeviceItem {
  deviceId: string;
  label: string;
}

export interface ArCompleteRtCodeSimulatorProps {
  language: Language;
  onBackToQuickAr?: () => void;
}

/**
 * Procedurally renders a realistic radiographic weld film strip onto a 2D canvas,
 * including weld reinforcement, root pass, IQI wires, lead markers, densitometer cursor,
 * and physics-accurate morphology for all 18 weld defect types.
 */
function paintRadiographicFilmCanvas(
  canvas: HTMLCanvasElement | null,
  opts: {
    defect: ArRtFilmDefectSpec;
    defectLengthMm: number;
    defectWidthMm: number;
    defectCount: number;
    baseWeldDensityHd: number;
    densitometerXMm: number;
    negatoscopeBrightnessPct: number;
    invertXrayPolarity: boolean;
    showCaliperTicks: boolean;
    iqiLabel: string;
  }
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const brightFactor = opts.negatoscopeBrightnessPct / 100;
  // Convert optical density D (1.0 .. 4.2 H&D) into greyscale luminance (0..255)
  const densityToLum = (dHd: number): number => {
    const normalized = Math.max(0.04, Math.min(0.96, 1 - (dHd - 0.8) / 3.6));
    const lum = Math.round(normalized * 235 * brightFactor);
    const clamped = Math.max(8, Math.min(248, lum));
    return opts.invertXrayPolarity ? 255 - clamped : clamped;
  };

  const baseMetalLum = densityToLum(opts.baseWeldDensityHd + 0.34);
  const weldCapLum = densityToLum(opts.baseWeldDensityHd);
  const weldRootLum = densityToLum(Math.max(1.1, opts.baseWeldDensityHd - 0.16));

  // 1. Base metal film background
  ctx.fillStyle = `rgb(${baseMetalLum}, ${baseMetalLum + 3}, ${Math.min(255, baseMetalLum + 8)})`;
  ctx.fillRect(0, 0, w, h);

  // 2. Weld cap band (horizontal center strip)
  const weldCenterY = h * 0.52;
  const capHalfH = h * 0.23;
  const weldGrad = ctx.createLinearGradient(0, weldCenterY - capHalfH, 0, weldCenterY + capHalfH);
  weldGrad.addColorStop(0, `rgb(${baseMetalLum}, ${baseMetalLum + 2}, ${Math.min(255, baseMetalLum + 6)})`);
  weldGrad.addColorStop(0.22, `rgb(${weldCapLum}, ${weldCapLum + 3}, ${Math.min(255, weldCapLum + 7)})`);
  weldGrad.addColorStop(0.5, `rgb(${weldRootLum}, ${weldRootLum + 3}, ${Math.min(255, weldRootLum + 8)})`);
  weldGrad.addColorStop(0.78, `rgb(${weldCapLum}, ${weldCapLum + 3}, ${Math.min(255, weldCapLum + 7)})`);
  weldGrad.addColorStop(1, `rgb(${baseMetalLum}, ${baseMetalLum + 2}, ${Math.min(255, baseMetalLum + 6)})`);
  ctx.fillStyle = weldGrad;
  ctx.fillRect(0, weldCenterY - capHalfH, w, capHalfH * 2);

  // Subtle weld ripple lines
  ctx.strokeStyle = opts.invertXrayPolarity ? 'rgba(30,41,59,0.12)' : 'rgba(241,245,249,0.08)';
  ctx.lineWidth = 1.2;
  for (let rx = 18; rx < w - 18; rx += 9) {
    ctx.beginPath();
    ctx.arc(rx, weldCenterY, capHalfH * 0.82, -0.45, 0.45);
    ctx.stroke();
  }

  // 3. Lead Identification Letters & ASTM/ISO Wire IQI Pack (bright white lead absorption)
  const leadLum = densityToLum(1.05);
  ctx.fillStyle = `rgb(${leadLum}, ${leadLum}, ${leadLum})`;
  ctx.font = 'bold 12px "IBM Plex Mono", monospace';
  ctx.fillText('INSCO-RT  W-204   0        50       100      150      200 mm', 16, 18);

  // Wire IQI pack (6 wires of graded thickness across weld)
  const iqiX = 36;
  ctx.strokeStyle = `rgba(${leadLum}, ${leadLum}, ${leadLum}, 0.85)`;
  ctx.strokeRect(iqiX - 6, weldCenterY - capHalfH * 0.9, 54, capHalfH * 1.8);
  for (let wi = 0; wi < 6; wi++) {
    ctx.beginPath();
    ctx.lineWidth = Math.max(0.6, 2.2 - wi * 0.28);
    ctx.strokeStyle = `rgba(${leadLum}, ${leadLum}, ${leadLum}, ${0.95 - wi * 0.1})`;
    ctx.moveTo(iqiX + wi * 8, weldCenterY - capHalfH * 0.78);
    ctx.lineTo(iqiX + wi * 8, weldCenterY + capHalfH * 0.78);
    ctx.stroke();
  }
  ctx.font = 'bold 10px "IBM Plex Mono", monospace';
  ctx.fillText(opts.iqiLabel.slice(0, 18), iqiX - 6, h - 8);

  // 4. Scale mm -> pixels along 200 mm film strip
  const pxPerMm = (w - 80) / 200;
  const centerPxX = 40 + 100 * pxPerMm;
  const lenPx = Math.max(6, opts.defectLengthMm * pxPerMm);
  const widPx = Math.max(2.5, opts.defectWidthMm * pxPerMm * 1.35);

  const defectLum = densityToLum(opts.baseWeldDensityHd + opts.defect.densityDeltaHd);
  const defectColor = `rgb(${defectLum}, ${defectLum}, ${defectLum})`;

  ctx.save();
  ctx.strokeStyle = defectColor;
  ctx.fillStyle = defectColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const id = opts.defect.id;

  if (id === 'crack_longitudinal') {
    ctx.lineWidth = Math.max(1.6, widPx * 0.45);
    ctx.beginPath();
    const steps = 12;
    const startX = centerPxX - lenPx / 2;
    ctx.moveTo(startX, weldCenterY);
    for (let i = 1; i <= steps; i++) {
      const x = startX + (lenPx * i) / steps;
      const jag = (i % 2 === 0 ? 1 : -1) * (1.8 + (i % 3));
      ctx.lineTo(x, weldCenterY + jag);
    }
    ctx.stroke();
    // Secondary micro-branch
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(centerPxX + lenPx * 0.1, weldCenterY - 1);
    ctx.lineTo(centerPxX + lenPx * 0.28, weldCenterY - 7);
    ctx.stroke();
  } else if (id === 'crack_transverse') {
    ctx.lineWidth = Math.max(1.6, widPx * 0.45);
    const halfSpan = Math.min(capHalfH * 1.15, lenPx * 0.65);
    ctx.beginPath();
    ctx.moveTo(centerPxX - 2, weldCenterY - halfSpan);
    ctx.lineTo(centerPxX + 2.5, weldCenterY - halfSpan * 0.3);
    ctx.lineTo(centerPxX - 1.5, weldCenterY + halfSpan * 0.35);
    ctx.lineTo(centerPxX + 2, weldCenterY + halfSpan);
    ctx.stroke();
  } else if (id === 'crack_crater') {
    // Concave crater shadow + 4 radiating star prongs
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(centerPxX, weldCenterY, Math.max(7, lenPx * 0.55), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6;
    [0.2, 1.85, 3.3, 4.9].forEach((ang) => {
      ctx.beginPath();
      ctx.moveTo(centerPxX, weldCenterY);
      ctx.lineTo(
        centerPxX + Math.cos(ang) * Math.max(6, lenPx * 0.52),
        weldCenterY + Math.sin(ang) * Math.max(6, lenPx * 0.52)
      );
      ctx.stroke();
    });
  } else if (id === 'incomplete_penetration') {
    // Razor-straight dark root band dead-center
    const bandH = Math.max(3.5, widPx * 0.85);
    ctx.fillRect(centerPxX - lenPx / 2, weldCenterY - bandH / 2, lenPx, bandH);
  } else if (id === 'lack_of_fusion') {
    // Straight sharp dark line offset along bevel fusion face
    ctx.lineWidth = Math.max(2.2, widPx * 0.7);
    ctx.beginPath();
    ctx.moveTo(centerPxX - lenPx / 2, weldCenterY - capHalfH * 0.48);
    ctx.lineTo(centerPxX + lenPx / 2, weldCenterY - capHalfH * 0.48);
    ctx.stroke();
  } else if (id === 'slag_elongated_wagon') {
    // Parallel irregular wagon tracks flanking root bead
    [-capHalfH * 0.34, capHalfH * 0.34].forEach((yOff, idx) => {
      ctx.lineWidth = Math.max(2.6, widPx * 0.75);
      ctx.beginPath();
      const sX = centerPxX - lenPx / 2 + idx * 4;
      ctx.moveTo(sX, weldCenterY + yOff);
      ctx.quadraticCurveTo(centerPxX, weldCenterY + yOff + (idx === 0 ? -2.2 : 2.2), sX + lenPx, weldCenterY + yOff);
      ctx.stroke();
    });
  } else if (id === 'slag_isolated') {
    const count = Math.min(5, Math.max(1, opts.defectCount));
    for (let i = 0; i < count; i++) {
      const bx = centerPxX + (i - (count - 1) / 2) * (lenPx * 0.85 + 10);
      const by = weldCenterY + (i % 2 === 0 ? -5 : 6);
      ctx.beginPath();
      ctx.moveTo(bx - lenPx * 0.35, by - widPx * 0.3);
      ctx.lineTo(bx + lenPx * 0.4, by - widPx * 0.45);
      ctx.lineTo(bx + lenPx * 0.3, by + widPx * 0.45);
      ctx.lineTo(bx - lenPx * 0.42, by + widPx * 0.3);
      ctx.closePath();
      ctx.fill();
    }
  } else if (id === 'porosity_scattered') {
    const count = Math.min(9, Math.max(2, opts.defectCount));
    const poreR = Math.max(2.0, widPx * 0.48);
    for (let i = 0; i < count; i++) {
      const px = centerPxX + (i - (count - 1) / 2) * 14;
      const py = weldCenterY + Math.sin(i * 2.1) * (capHalfH * 0.48);
      ctx.beginPath();
      ctx.arc(px, py, poreR * (0.8 + (i % 3) * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'porosity_clustered') {
    const count = Math.min(14, Math.max(5, opts.defectCount));
    const poreR = Math.max(1.8, widPx * 0.42);
    for (let i = 0; i < count; i++) {
      const angle = i * 1.15;
      const rad = (i / count) * (lenPx * 0.48);
      ctx.beginPath();
      ctx.arc(
        centerPxX + Math.cos(angle) * rad,
        weldCenterY + Math.sin(angle) * Math.min(rad, capHalfH * 0.65),
        poreR,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  } else if (id === 'porosity_wormhole') {
    const count = Math.min(5, Math.max(2, opts.defectCount));
    for (let i = 0; i < count; i++) {
      const wx = centerPxX + (i - (count - 1) / 2) * 16;
      const dir = i % 2 === 0 ? -1 : 1;
      ctx.lineWidth = Math.max(2.6, widPx * 0.65);
      ctx.beginPath();
      ctx.moveTo(wx, weldCenterY);
      ctx.lineTo(wx + 8, weldCenterY + dir * Math.min(capHalfH * 0.72, lenPx * 0.55));
      ctx.stroke();
    }
  } else if (id === 'porosity_hollow_bead') {
    const hbH = Math.max(3.6, widPx * 0.85);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(centerPxX - lenPx / 2, weldCenterY - hbH / 2, lenPx, hbH, hbH / 2);
    } else {
      ctx.rect(centerPxX - lenPx / 2, weldCenterY - hbH / 2, lenPx, hbH);
    }
    ctx.fill();
  } else if (id === 'tungsten_inclusion') {
    // Stark BRIGHT WHITE high-density tungsten splinter(s)
    const brightWhite = opts.invertXrayPolarity ? 'rgb(15, 23, 42)' : 'rgb(252, 254, 255)';
    ctx.fillStyle = brightWhite;
    const count = Math.min(4, Math.max(1, opts.defectCount));
    for (let i = 0; i < count; i++) {
      const tx = centerPxX + (i - (count - 1) / 2) * 14;
      ctx.beginPath();
      ctx.ellipse(tx, weldCenterY + (i % 2 === 0 ? -3 : 4), Math.max(2.8, lenPx * 0.35), Math.max(2.2, widPx * 0.45), 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'oxide_inclusion') {
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = Math.max(2.0, widPx * 0.6);
    ctx.beginPath();
    ctx.moveTo(centerPxX - lenPx / 2, weldCenterY - 3);
    ctx.bezierCurveTo(
      centerPxX - lenPx * 0.15,
      weldCenterY + 6,
      centerPxX + lenPx * 0.2,
      weldCenterY - 6,
      centerPxX + lenPx / 2,
      weldCenterY + 2
    );
    ctx.stroke();
  } else if (id === 'undercut_cap') {
    ctx.globalAlpha = 0.78;
    ctx.fillRect(centerPxX - lenPx / 2, weldCenterY - capHalfH - 2, lenPx, Math.max(3.5, widPx * 0.75));
  } else if (id === 'undercut_root') {
    ctx.globalAlpha = 0.82;
    ctx.fillRect(centerPxX - lenPx / 2, weldCenterY - capHalfH * 0.24, lenPx, Math.max(3.0, widPx * 0.7));
  } else if (id === 'root_concavity') {
    const rcGrad = ctx.createLinearGradient(0, weldCenterY - widPx, 0, weldCenterY + widPx);
    rcGrad.addColorStop(0, 'rgba(0,0,0,0)');
    rcGrad.addColorStop(0.5, defectColor);
    rcGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rcGrad;
    ctx.fillRect(centerPxX - lenPx / 2, weldCenterY - widPx, lenPx, widPx * 2);
  } else if (id === 'burn_through') {
    // Bright metal icicle halo around intense dark burn-through crater
    const haloLum = densityToLum(Math.max(1.0, opts.baseWeldDensityHd - 0.38));
    ctx.fillStyle = `rgb(${haloLum}, ${haloLum}, ${haloLum})`;
    ctx.beginPath();
    ctx.arc(centerPxX, weldCenterY, Math.max(8, lenPx * 0.68), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = defectColor;
    ctx.beginPath();
    ctx.arc(centerPxX, weldCenterY, Math.max(5, lenPx * 0.44), 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'linear_misalignment_hilo') {
    // Step density shift between upper half and lower half of root
    ctx.globalAlpha = 0.68;
    ctx.fillRect(centerPxX - lenPx / 2, weldCenterY, lenPx, capHalfH * 0.48);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(centerPxX - lenPx / 2, weldCenterY);
    ctx.lineTo(centerPxX + lenPx / 2, weldCenterY);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Caliper Measurement Brackets & Live Densitometer Scan Crosshair
  if (opts.showCaliperTicks) {
    const leftBrk = centerPxX - lenPx / 2;
    const rightBrk = centerPxX + lenPx / 2;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftBrk, weldCenterY - capHalfH * 0.85);
    ctx.lineTo(leftBrk, weldCenterY + capHalfH * 0.85);
    ctx.moveTo(rightBrk, weldCenterY - capHalfH * 0.85);
    ctx.lineTo(rightBrk, weldCenterY + capHalfH * 0.85);
    ctx.stroke();
  }

  const probePxX = 40 + Math.max(0, Math.min(200, opts.densitometerXMm)) * pxPerMm;
  ctx.strokeStyle = '#f59e0b';
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(probePxX, 22);
  ctx.lineTo(probePxX, h - 6);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.8;
  ctx.arc(probePxX, weldCenterY, 5, 0, Math.PI * 2);
  ctx.stroke();
}

export const ArCompleteRtCodeSimulator: React.FC<ArCompleteRtCodeSimulatorProps> = ({
  language,
  onBackToQuickAr,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  // Camera & MediaDevices Refs/State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const arFilmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const darkroomFilmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const arSvgOverlayRef = useRef<SVGSVGElement | null>(null);

  const [streamState, setStreamState] = useState<ArSimulatorStreamState>('calibration_backdrop');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoDevices, setVideoDevices] = useState<VideoDeviceItem[]>([]);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);

  // Active Pillar Tab
  const [activePillar, setActivePillar] = useState<WorkbenchPillarTab>('techniques_ar');

  // Pillar 1: All 8 Code Shooting Techniques State
  const [techniqueId, setTechniqueId] = useState<ArRtCodeTechniqueId>('dwdi_elliptical');
  const [sourceId, setSourceId] = useState<ArRtRadiationSourceId>('ir192');
  const [pipeOdMm, setPipeOdMm] = useState<number>(60.3);
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(8.0);
  const [sfdMm, setSfdMm] = useState<number>(380);
  const [beamOffsetDeg, setBeamOffsetDeg] = useState<number>(18);
  const [exposureFactorPct, setExposureFactorPct] = useState<number>(100);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(1);

  // Spatial AR Alignment State
  const [arScalePct, setArScalePct] = useState<number>(100);
  const [arRotationDeg, setArRotationDeg] = useState<number>(0);
  const [showArFilmOnWeld, setShowArFilmOnWeld] = useState<boolean>(true);

  // Pillar 2: All 18 Film Defects & Densitometer State
  const [defectCategoryFilter, setDefectCategoryFilter] = useState<'all' | ArRtDefectCategory>('all');
  const [selectedDefectId, setSelectedDefectId] = useState<ArRtFilmDefectId>('incomplete_penetration');
  const [defectLengthMm, setDefectLengthMm] = useState<number>(18.0);
  const [defectWidthMm, setDefectWidthMm] = useState<number>(1.8);
  const [defectDepthMm, setDefectDepthMm] = useState<number>(1.6);
  const [defectCount, setDefectCount] = useState<number>(1);
  const [densitometerXMm, setDensitometerXMm] = useState<number>(100);
  const [negatoscopeBrightnessPct, setNegatoscopeBrightnessPct] = useState<number>(100);
  const [invertXrayPolarity, setInvertXrayPolarity] = useState<boolean>(false);
  const [showCaliperTicks, setShowCaliperTicks] = useState<boolean>(true);

  // Pillar 3: Multi-Code Acceptance Criteria & Inspector Sentencing Exam State
  const [targetExamCodeId, setTargetExamCodeId] = useState<ArRtAcceptanceCodeId>('ASME_VIII_UW51');
  const [inspectorFeedback, setInspectorFeedback] = useState<{
    correct: boolean;
    chosenVerdict: 'ACCEPT' | 'REJECT';
    officialVerdict: 'ACCEPT' | 'REJECT';
    codeLabel: string;
    clauseRef: string;
    xpEarned: number;
    explanation: string;
  } | null>(null);
  const [capturedReportUrl, setCapturedReportUrl] = useState<string | null>(null);
  const [showGeExposureModal, setShowGeExposureModal] = useState<boolean>(false);

  const activeDefect = useMemo(
    () => AR_RT_FILM_DEFECTS.find((d) => d.id === selectedDefectId) ?? AR_RT_FILM_DEFECTS[0],
    [selectedDefectId]
  );

  // Sync recommended geometry when user selects a different shooting technique
  const handleSelectTechnique = (nextId: ArRtCodeTechniqueId) => {
    const spec = AR_RT_CODE_TECHNIQUES.find((t) => t.id === nextId);
    setTechniqueId(nextId);
    setActiveShotIndex(1);
    if (spec) {
      setPipeOdMm(spec.defaultOdMm);
      setWallThicknessMm(spec.defaultWallMm);
      setSfdMm(spec.defaultSfdMm);
      setBeamOffsetDeg(spec.defaultOffsetDeg);
    }
  };

  // Sync realistic default sizing when user picks one of the 18 film defects
  const handleSelectDefect = (nextDefectId: ArRtFilmDefectId) => {
    const spec = AR_RT_FILM_DEFECTS.find((d) => d.id === nextDefectId);
    setSelectedDefectId(nextDefectId);
    setInspectorFeedback(null);
    if (spec) {
      setDefectLengthMm(spec.defaultLengthMm);
      setDefectWidthMm(spec.defaultWidthMm);
      setDefectDepthMm(
        Number(Math.max(0.4, wallThicknessMm * spec.defaultDepthRatio).toFixed(1))
      );
      setDefectCount(spec.defaultCountInWindow);
      setDensitometerXMm(100);
    }
  };

  // Live Physics of Active AR Shooting Technique
  const techniquePhysics = useMemo(
    () =>
      computeArRtTechniquePhysics({
        techniqueId,
        sourceId,
        pipeOdMm,
        wallThicknessMm,
        sfdMm,
        beamOffsetDeg,
        exposureFactorPct,
      }),
    [techniqueId, sourceId, pipeOdMm, wallThicknessMm, sfdMm, beamOffsetDeg, exposureFactorPct]
  );

  // Live Optical Densitometer Reading at station X
  const densitometerReading = useMemo(
    () =>
      computeFilmDensityProfile({
        baseDensityHd: techniquePhysics.weldOpticalDensityHd,
        defect: activeDefect,
        defectLengthMm,
        defectWidthMm,
        stationXMm: densitometerXMm,
      }),
    [
      techniquePhysics.weldOpticalDensityHd,
      activeDefect,
      defectLengthMm,
      defectWidthMm,
      densitometerXMm,
    ]
  );

  // Live Evaluation Across All 7 International Codes
  const allCodeVerdicts = useMemo(
    () =>
      evaluateDefectAcrossAllCodes({
        defectId: selectedDefectId,
        wallThicknessMm,
        indicationLengthMm: defectLengthMm,
        indicationWidthMm: defectWidthMm,
        indicationDepthMm: defectDepthMm,
        indicationCount: defectCount,
        weldEvalWindowMm: 300,
      }),
    [
      selectedDefectId,
      wallThicknessMm,
      defectLengthMm,
      defectWidthMm,
      defectDepthMm,
      defectCount,
    ]
  );

  const acceptCountAcrossCodes = useMemo(
    () => allCodeVerdicts.filter((v) => v.verdict === 'ACCEPT').length,
    [allCodeVerdicts]
  );

  const filteredDefects = useMemo(
    () =>
      defectCategoryFilter === 'all'
        ? AR_RT_FILM_DEFECTS
        : AR_RT_FILM_DEFECTS.filter((d) => d.category === defectCategoryFilter),
    [defectCategoryFilter]
  );

  // Repaint both the AR On-Weld Film Canvas and the Zoomed Darkroom Negatoscope Canvas immediately
  useEffect(() => {
    const paintOpts = {
      defect: activeDefect,
      defectLengthMm,
      defectWidthMm,
      defectCount,
      baseWeldDensityHd: techniquePhysics.weldOpticalDensityHd,
      densitometerXMm,
      negatoscopeBrightnessPct,
      invertXrayPolarity,
      showCaliperTicks,
      iqiLabel: techniquePhysics.iqiWireDesignation,
    };
    paintRadiographicFilmCanvas(arFilmCanvasRef.current, paintOpts);
    paintRadiographicFilmCanvas(darkroomFilmCanvasRef.current, paintOpts);
  }, [
    activeDefect,
    defectLengthMm,
    defectWidthMm,
    defectCount,
    techniquePhysics.weldOpticalDensityHd,
    techniquePhysics.iqiWireDesignation,
    densitometerXMm,
    negatoscopeBrightnessPct,
    invertXrayPolarity,
    showCaliperTicks,
    showArFilmOnWeld,
    activePillar,
  ]);

  // Camera MediaStream Lifecycle
  const stopCameraTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => {
        try {
          tr.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraTracks();
    };
  }, [stopCameraTracks]);

  const enumerateCameras = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.enumerateDevices !== 'function'
    ) {
      return;
    }
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(
        list
          .filter((d) => d.kind === 'videoinput')
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || (isAr ? `كاميرا الفحص #${i + 1}` : `Camera #${i + 1}`),
          }))
      );
    } catch {
      // Optional enumeration
    }
  }, [isAr]);

  const startArCamera = useCallback(
    async (overrideFacing?: 'environment' | 'user', overrideDevice?: string) => {
      setCameraErrorMsg('');
      setIsFrozen(false);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setStreamState('error');
        setCameraErrorMsg(
          isAr
            ? 'متصفحك الحالي لا يدعم واجهة الكاميرا الحية (MediaDevices.getUserMedia). يمكنك المتابعة فوراً بوضع مشهد الأنبوب المعزز التجريبي.'
            : 'MediaDevices.getUserMedia is unavailable in this browser context. Use the AR Pipe Calibration Backdrop to run all simulations.'
        );
        return;
      }

      stopCameraTracks();
      setStreamState('requesting');

      const targetFacing = overrideFacing ?? facingMode;
      const targetDev = overrideDevice !== undefined ? overrideDevice : selectedDeviceId;

      const videoConstraints: MediaTrackConstraints = targetDev
        ? { deviceId: { exact: targetDev }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: { ideal: targetFacing }, width: { ideal: 1280 }, height: { ideal: 720 } };

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
        streamRef.current = mediaStream;
        const track = mediaStream.getVideoTracks()[0];
        if (track) {
          setActiveCameraLabel(
            track.label ||
              (targetFacing === 'environment'
                ? isAr
                  ? 'الكاميرا الخلفية الميدانية'
                  : 'Rear Field Camera'
                : isAr
                ? 'الكاميرا الأمامية'
                : 'Front Camera')
          );
        }
        setStreamState('active');
        await enumerateCameras();
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        const errName = err instanceof Error ? err.name : 'CameraError';
        setStreamState('error');
        setCameraErrorMsg(
          isAr
            ? `تعذّر فتح الكاميرا (${errName}). يمكنك السماح بصلاحية الكاميرا أو استخدام مشهد الأنبوب المعزز التجريبي بكامل الخصائص.`
            : `Camera access unavailable (${errName}). Grant permission or use the full-featured AR Pipe Calibration Backdrop.`
        );
      }
    },
    [enumerateCameras, facingMode, isAr, selectedDeviceId, stopCameraTracks]
  );

  useEffect(() => {
    if (streamState === 'active' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [streamState]);

  const handleToggleFreeze = () => {
    if (!videoRef.current || streamState !== 'active') return;
    if (isFrozen) {
      videoRef.current.play().catch(() => {});
      setIsFrozen(false);
    } else {
      videoRef.current.pause();
      setIsFrozen(true);
    }
  };

  // Evaluate Trainee's Inspector Verdict against the selected International Code
  const handleSubmitInspectorVerdict = (chosenVerdict: 'ACCEPT' | 'REJECT') => {
    const targetEval =
      allCodeVerdicts.find((v) => v.codeId === targetExamCodeId) ?? allCodeVerdicts[0];
    const isCorrect = chosenVerdict === targetEval.verdict;

    const record = recordSimulationAttempt({
      simulatorId: `ar_rt_all_codes_${techniqueId}_${selectedDefectId}_${targetExamCodeId}`,
      targetSubTab: 'ar_rt_codes',
      simulatorTitle: {
        ar: `الواقع المعزز الشامل لتكنيكات وعيوب وأكواد RT (${targetEval.shortCode})`,
        en: `Complete AR RT Techniques, Defects & ${targetEval.shortCode} Criteria`,
      },
      ndtMethod: 'RT',
      defectTypes: [
        {
          id: activeDefect.id,
          ar: activeDefect.name.ar,
          en: activeDefect.name.en,
        },
      ],
      status: isCorrect ? 'PASS' : 'FAIL',
      codeVerdict: targetEval.verdict,
      traineeVerdict: chosenVerdict,
      codeStandard: `${targetEval.shortCode} (${targetEval.clauseRef})`,
      scorePct: isCorrect ? 100 : 40,
      actualLengthMm: defectLengthMm,
      measuredLengthMm: defectLengthMm,
      actualDepthMm: defectDepthMm,
      measuredDepthMm: defectDepthMm,
      notes: {
        ar: `${techniquePhysics.technique.shortCode} · ${activeDefect.codeSymbol} L=${defectLengthMm}mm · قرار الكود: ${targetEval.verdict}`,
        en: `${techniquePhysics.technique.shortCode} · ${activeDefect.codeSymbol} L=${defectLengthMm}mm · Official: ${targetEval.verdict}`,
      },
    });

    setInspectorFeedback({
      correct: isCorrect,
      chosenVerdict,
      officialVerdict: targetEval.verdict,
      codeLabel: targetEval.shortCode,
      clauseRef: targetEval.clauseRef,
      xpEarned: record.xpEarned,
      explanation: targetEval.rationale[language],
    });
  };

  // Capture Composite AR Field Report Image (Camera/Backdrop + Technique HUD + Film Strip + Multi-Code Stamp)
  const handleCaptureCompositeReport = () => {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 1280;
    outCanvas.height = 720;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#070b16';
    ctx.fillRect(0, 0, 1280, 720);

    if (streamState === 'active' && videoRef.current) {
      try {
        ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
      } catch {
        // Fallback dark industrial background
      }
    } else {
      // Industrial pipe calibration backdrop
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(140, 310, 1000, 150);
    }

    if (arFilmCanvasRef.current) {
      ctx.drawImage(arFilmCanvasRef.current, 340, 490, 600, 130);
    }

    // Stamp Top Telemetry Banner
    ctx.fillStyle = 'rgba(6, 10, 24, 0.92)';
    ctx.fillRect(24, 20, 1232, 66);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 20, 1232, 66);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "IBM Plex Mono", monospace';
    ctx.fillText(
      `INSCO AR RT REPORT · ${techniquePhysics.technique.shortCode} · ${techniquePhysics.source.shortLabel} · Ug=${techniquePhysics.calculatedUgMm}mm`,
      44,
      48
    );

    const activeVerdictObj =
      allCodeVerdicts.find((v) => v.codeId === targetExamCodeId) ?? allCodeVerdicts[0];
    ctx.fillStyle = activeVerdictObj.verdict === 'ACCEPT' ? '#34d399' : '#f87171';
    ctx.font = 'bold 17px "IBM Plex Mono", monospace';
    ctx.fillText(
      `Defect: ${activeDefect.name.en} (L=${defectLengthMm}mm, W=${defectWidthMm}mm) · ${activeVerdictObj.shortCode}: ${activeVerdictObj.verdict} (${acceptCountAcrossCodes}/7 Codes Accept)`,
      44,
      74
    );

    let dataUrl = '';
    try {
      dataUrl = outCanvas.toDataURL('image/png') || '';
    } catch {
      dataUrl = '';
    }
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
    setCapturedReportUrl(dataUrl);
  };

  const cardSurface = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#0b1026] border-slate-800 text-slate-100';
  const subSurface = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-[#070a18] border-slate-800/90 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const selectedCodeEval =
    allCodeVerdicts.find((v) => v.codeId === targetExamCodeId) ?? allCodeVerdicts[0];

  return (
    <div
      data-testid="ar-complete-rt-code-simulator"
      className="space-y-6 tabular-nums"
    >
      {/* Top Header & Camera / Pillar Mode Controls */}
      <div className={`rounded-3xl border p-5 sm:p-6 shadow-xl ${cardSurface}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/25">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-500">
              <span>{isAr ? 'مختبر الواقع المعزز الإشعاعي الشامل' : 'Augmented Reality Radiography Workbench'}</span>
              <span aria-hidden="true">·</span>
              <span>8 {isAr ? 'تكنيكات كودية' : 'Code Techniques'}</span>
              <span aria-hidden="true">·</span>
              <span>18 {isAr ? 'عيب أفلام' : 'Film Defects'}</span>
              <span aria-hidden="true">·</span>
              <span>7 {isAr ? 'أكواد قبول دولية' : 'Acceptance Codes'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isAr
                ? 'محاكي الواقع المعزز الشامل لتكنيكات التصوير وعيوب الأفلام ومعايير القبول في جميع الأكواد'
                : 'Complete AR Radiographic Shooting Techniques, Film Defects & Multi-Code Acceptance Simulator'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onBackToQuickAr && (
              <button
                type="button"
                onClick={onBackToQuickAr}
                className="px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold hover:border-cyan-400 transition cursor-pointer"
              >
                {isAr ? 'العودة لتراكب AR السريع (UT/VT)' : 'Quick Multi-Method AR'}
              </button>
            )}

            <button
              type="button"
              data-testid="ar-open-ge-exposure-btn"
              onClick={() => setShowGeExposureModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              title={isAr ? 'حاسبة زمن التعريض الإشعاعي المعتمدة GE' : 'GE Radiographic Exposure Time App'}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'حاسبة وقت التعريض GE App' : 'GE Exposure Time App'}</span>
            </button>

            {streamState === 'active' ? (
              <button
                type="button"
                data-testid="ar-rt-stop-camera-btn"
                onClick={() => {
                  stopCameraTracks();
                  setStreamState('calibration_backdrop');
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer"
              >
                <CameraOff className="w-4 h-4" />
                <span>{isAr ? 'إيقاف الكاميرا' : 'Stop Live Camera'}</span>
              </button>
            ) : (
              <button
                type="button"
                data-testid="ar-rt-start-camera-btn"
                onClick={() => startArCamera()}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>
                  {isAr ? 'تشغيل الكاميرا الحية (AR Camera)' : 'Launch Live AR Camera'}
                </span>
              </button>
            )}

            <button
              type="button"
              data-testid="ar-rt-capture-report-btn"
              onClick={handleCaptureCompositeReport}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'التقاط تقرير AR الموثق' : 'Capture AR Report'}</span>
            </button>
          </div>
        </div>

        {/* Camera Error Banner with Graceful Backdrop Fallback */}
        {streamState === 'error' && cameraErrorMsg && (
          <div
            data-testid="ar-rt-camera-error"
            className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{cameraErrorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setStreamState('calibration_backdrop')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'تفعيل مشهد الأنبوب المعزز التجريبي' : 'Use Pipe AR Backdrop'}
            </button>
          </div>
        )}

        {/* 3 Core Engineering Pillars Switcher */}
        <div className="mt-5 grid sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            data-testid="pillar-tab-techniques"
            onClick={() => setActivePillar('techniques_ar')}
            className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-3 ${
              activePillar === 'techniques_ar'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                : `${subSurface} hover:border-cyan-500/50`
            }`}
          >
            <Radio className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-xs font-black">
                {isAr ? '01. جميع تكنيكات التصوير (8 تكنيكات)' : '01. All 8 Code Shooting Techniques'}
              </div>
              <div className={`text-[11px] ${activePillar === 'techniques_ar' ? 'text-slate-900' : mutedText}`}>
                ASME V · ISO 17636-1 · API 1104 · EN 16407
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="pillar-tab-defects"
            onClick={() => setActivePillar('film_defects')}
            className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-3 ${
              activePillar === 'film_defects'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                : `${subSurface} hover:border-amber-500/50`
            }`}
          >
            <Film className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-xs font-black">
                {isAr ? '02. محاكاة جميع عيوب الأفلام (18 عيباً)' : '02. All 18 Film Defects & Negatoscope'}
              </div>
              <div className={`text-[11px] ${activePillar === 'film_defects' ? 'text-slate-900' : mutedText}`}>
                {isAr ? 'قراءة الكثافة الضوئية H&D والكاليبر الرقمي' : 'Live Optical Densitometer & Film Caliper'}
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="pillar-tab-codes"
            onClick={() => setActivePillar('acceptance_codes')}
            className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-3 ${
              activePillar === 'acceptance_codes'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                : `${subSurface} hover:border-emerald-500/50`
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-xs font-black">
                {isAr
                  ? `03. الأكسبتانس كراتيريا بجميع الأكواد (${acceptCountAcrossCodes}/7 قبول)`
                  : `03. All-Codes Acceptance Matrix (${acceptCountAcrossCodes}/7 Accept)`}
              </div>
              <div className={`text-[11px] ${activePillar === 'acceptance_codes' ? 'text-slate-900' : mutedText}`}>
                ASME VIII (UW-51/52) · B31.3 · B31.1 · API 1104 · AWS D1.1 · ISO
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Split Educational Sandbox: Left/Top Live AR Viewport (7 Cols) + Right Control Deck (5 Cols) */}
      <div className="grid xl:grid-cols-12 gap-6 items-start">
        {/* LIVE AUGMENTED REALITY VIEWPORT + ON-WELD X-RAY FILM PROJECTION */}
        <div className="xl:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-[#060914] overflow-hidden shadow-2xl">
            {/* Viewport Camera Toolbar */}
            <div className="px-4 py-2.5 bg-[#090d1f] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-mono">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">
                  {streamState === 'active'
                    ? activeCameraLabel || (isAr ? 'بث الكاميرا الحية نشط' : 'Live AR Stream Active')
                    : isAr
                    ? 'مشهد الواقع المعزز الصناعي (الأنبوب والوصلة الملحومة)'
                    : 'Industrial Pipe Weld AR Stage'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {streamState === 'active' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const next = facingMode === 'environment' ? 'user' : 'environment';
                        setFacingMode(next);
                        startArCamera(next, '');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-cyan-400" />
                      <span>{isAr ? 'تبديل العدسة' : 'Switch Cam'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleFreeze}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isFrozen ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                      <span>{isFrozen ? (isAr ? 'استئناف' : 'Resume') : (isAr ? 'تجميد' : 'Freeze')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMirrored((m) => !m)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FlipHorizontal className="w-3 h-3 text-sky-400" />
                      <span>{isAr ? 'مرآة' : 'Mirror'}</span>
                    </button>
                  </>
                )}

                {videoDevices.length > 1 && (
                  <select
                    aria-label={isAr ? 'اختيار الكاميرا' : 'Select camera'}
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      startArCamera(facingMode, e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                  >
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  data-testid="toggle-ar-film-on-weld"
                  onClick={() => setShowArFilmOnWeld((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    showArFilmOnWeld
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>{isAr ? 'إسقاط الفيلم على اللحام' : 'AR Film Overlay'}</span>
                </button>
              </div>
            </div>

            {/* 16:9 Live AR Stage */}
            <div className="relative aspect-video w-full bg-[#070b16] select-none overflow-hidden">
              {/* Layer 1: Live Camera <video> OR Realistic Industrial Pipe/Plate Weld Backdrop */}
              {streamState === 'active' ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`absolute inset-0 w-full h-full object-cover ${
                    isMirrored ? '-scale-x-100' : ''
                  }`}
                />
              ) : (
                <svg
                  viewBox="0 0 1280 720"
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="arPipeCylinder" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="35%" stopColor="#475569" />
                      <stop offset="55%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="arWeldBead" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="50%" stopColor="#cbd5e1" />
                      <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                  </defs>
                  <rect width="1280" height="720" fill="#070b16" />
                  {/* Subtle engineering coordinate grid */}
                  <g stroke="#1e293b" strokeWidth="1" opacity="0.55">
                    {[120, 240, 360, 480, 600].map((gy) => (
                      <line key={gy} x1="0" y1={gy} x2="1280" y2={gy} />
                    ))}
                    {[160, 320, 480, 640, 800, 960, 1120].map((gx) => (
                      <line key={gx} x1={gx} y1="0" x2={gx} y2="720" />
                    ))}
                  </g>
                  {/* Realistic Field Pipe & Girth Weld Seam */}
                  <rect x="90" y="295" width="1100" height="175" rx="18" fill="url(#arPipeCylinder)" stroke="#64748b" strokeWidth="2" />
                  <rect x="622" y="289" width="36" height="187" rx="8" fill="url(#arWeldBead)" />
                  <line x1="640" y1="275" x2="640" y2="490" stroke="#38bdf8" strokeDasharray="6 4" strokeWidth="1.5" />
                </svg>
              )}

              {/* Layer 2: Interactive SVG Augmented Reality Code Shooting Technique Vector Overlay */}
              <svg
                ref={arSvgOverlayRef}
                data-testid="ar-rt-technique-layer"
                viewBox="0 0 1280 720"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <g
                  transform={`translate(640, 365) rotate(${arRotationDeg}) scale(${
                    arScalePct / 100
                  }) translate(-640, -365)`}
                >
                  {/* Controlled Radiation Area Boundary Ring */}
                  <ellipse
                    cx="640"
                    cy="380"
                    rx="510"
                    ry="255"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.4"
                    strokeDasharray="10 8"
                    opacity="0.55"
                  />

                  {/* Dynamic Ray-Tracing & Source/Film Geometry for All 8 Code Techniques */}
                  {(() => {
                    const isPanoramic = techniqueId === 'swsi_panoramic';
                    const isInternalEcc = techniqueId === 'swsi_internal_eccentric';
                    const isElliptical = techniqueId === 'dwdi_elliptical';
                    const isTangential = techniqueId === 'tangential_profile';
                    const isDualFilm = techniqueId === 'double_film_latitude';

                    const srcX = isPanoramic
                      ? 640
                      : isInternalEcc
                      ? 640
                      : isElliptical
                      ? 640 + Math.round(beamOffsetDeg * 5.2)
                      : isTangential
                      ? 640
                      : 640;

                    const srcY = isPanoramic
                      ? 382
                      : isInternalEcc
                      ? 308
                      : isTangential
                      ? 105
                      : 118;

                    const filmY = 478;

                    return (
                      <g>
                        {/* Radiation Cone / Panoramic 360° Fan */}
                        {isPanoramic ? (
                          <g>
                            <circle
                              cx={srcX}
                              cy={srcY}
                              r="112"
                              fill="rgba(56, 189, 248, 0.14)"
                              stroke="#38bdf8"
                              strokeWidth="2.5"
                              strokeDasharray="8 5"
                            />
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => {
                              const rad = (ang * Math.PI) / 180;
                              return (
                                <line
                                  key={ang}
                                  x1={srcX}
                                  y1={srcY}
                                  x2={srcX + Math.cos(rad) * 112}
                                  y2={srcY + Math.sin(rad) * 112}
                                  stroke="#22d3ee"
                                  strokeWidth="1.6"
                                />
                              );
                            })}
                          </g>
                        ) : isTangential ? (
                          <g>
                            <polygon
                              points={`${srcX},${srcY} 490,${filmY} 790,${filmY}`}
                              fill="rgba(245, 158, 11, 0.16)"
                              stroke="#fbbf24"
                              strokeWidth="2"
                            />
                            {/* Tangential grazing rays */}
                            <line x1={srcX} y1={srcY} x2="540" y2={filmY} stroke="#22d3ee" strokeWidth="2.2" />
                            <line x1={srcX} y1={srcY} x2="740" y2={filmY} stroke="#22d3ee" strokeWidth="2.2" />
                          </g>
                        ) : (
                          <g>
                            <polygon
                              points={`${srcX},${srcY} 480,${filmY} 800,${filmY}`}
                              fill="rgba(34, 211, 238, 0.16)"
                              stroke="#22d3ee"
                              strokeWidth="2"
                            />
                            {/* Center Beam Axis */}
                            <line
                              x1={srcX}
                              y1={srcY}
                              x2="640"
                              y2={filmY}
                              stroke="#facc15"
                              strokeWidth="2.2"
                              strokeDasharray="7 4"
                            />
                            {/* Elliptical Projected Upper & Lower Weld Trace */}
                            {isElliptical && (
                              <ellipse
                                cx="640"
                                cy={filmY - 6}
                                rx="92"
                                ry={Math.max(14, Math.min(42, beamOffsetDeg * 1.45))}
                                fill="none"
                                stroke="#34d399"
                                strokeWidth="2.6"
                              />
                            )}
                          </g>
                        )}

                        {/* Source Focal Spot Emitter Symbol */}
                        <circle cx={srcX} cy={srcY} r="14" fill="#f59e0b" stroke="#0f172a" strokeWidth="3" />
                        <text
                          x={srcX + 22}
                          y={srcY + 5}
                          fill="#fde047"
                          fontSize="14"
                          fontWeight="bold"
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {`${techniquePhysics.source.shortLabel} · SFD=${Math.round(
                            techniquePhysics.sourceToObjectDistanceMm +
                              techniquePhysics.objectToFilmDistanceMm
                          )}mm`}
                        </text>

                        {/* Film Cassette(s) & Lead Backscatter "B" */}
                        <rect
                          x="455"
                          y={filmY}
                          width="370"
                          height="12"
                          rx="4"
                          fill="#0ea5e9"
                          stroke="#e0f2fe"
                          strokeWidth="1.5"
                        />
                        {isDualFilm && (
                          <rect
                            x="455"
                            y={filmY + 15}
                            width="370"
                            height="11"
                            rx="4"
                            fill="#a855f7"
                            stroke="#f3e8ff"
                            strokeWidth="1.5"
                          />
                        )}
                        <text
                          x="838"
                          y={filmY + 12}
                          fill="#38bdf8"
                          fontSize="13"
                          fontWeight="bold"
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {isDualFilm
                            ? 'Cassette: Class I + Class II + Pb "B"'
                            : `Film + IQI (${techniquePhysics.technique.iqiSideStandard}) + Pb "B"`}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              </svg>

              {/* Layer 3: Top-Left Live AR Code & Physics Readout */}
              <div
                data-testid="ar-rt-live-hud-summary"
                className="absolute top-3 left-3 bg-[#060916]/92 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-[11px] font-mono text-slate-200 space-y-1 max-w-md pointer-events-none"
              >
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <span>{techniquePhysics.technique.shortCode}</span>
                  <span>·</span>
                  <span>
                    {isAr
                      ? `لقطة ${activeShotIndex}/${techniquePhysics.minExposuresRequired}`
                      : `Shot ${activeShotIndex}/${techniquePhysics.minExposuresRequired}`}
                  </span>
                  <span>·</span>
                  <span
                    className={
                      techniquePhysics.overallCodeCompliant ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {techniquePhysics.overallCodeCompliant ? 'SETUP PASS' : 'SETUP ALERT'}
                  </span>
                </div>
                <div className="text-slate-300">
                  {`Ug = ${techniquePhysics.calculatedUgMm} / ${techniquePhysics.maxAllowedUgMm} mm · D = ${techniquePhysics.weldOpticalDensityHd} H&D · Wall = ${techniquePhysics.penetratedThicknessMm} mm`}
                </div>
              </div>

              {/* Layer 4: Top-Right Live Multi-Code Verdict Stamp */}
              <div
                data-testid="ar-rt-verdict-stamp"
                className="absolute top-3 right-3 bg-[#060916]/92 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-[11px] font-mono text-end pointer-events-none"
              >
                <div className="text-slate-300 font-bold">
                  {`${activeDefect.codeSymbol} · L=${defectLengthMm}mm · W=${defectWidthMm}mm`}
                </div>
                <div
                  className={`text-xs font-black mt-0.5 ${
                    selectedCodeEval.verdict === 'ACCEPT' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {`${selectedCodeEval.shortCode}: ${selectedCodeEval.verdict} (${acceptCountAcrossCodes}/7 Codes Accept)`}
                </div>
              </div>

              {/* Layer 5: On-Weld AR X-Ray Film Negatoscope Strip Overlay */}
              {showArFilmOnWeld && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[92%] sm:w-[78%] bg-[#050812]/94 border border-cyan-500/50 rounded-2xl p-2 shadow-2xl">
                  <div className="flex items-center justify-between px-1.5 pb-1 text-[10.5px] font-mono text-cyan-300">
                    <span>
                      {isAr
                        ? `إسقاط الفيلم الإشعاعي الحي (${activeDefect.name.ar})`
                        : `AR X-Ray Film Strip (${activeDefect.name.en})`}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {`X=${densitometerXMm}mm · D(x)=${densitometerReading.stationOpticalDensityHd} H&D`}
                    </span>
                  </div>
                  <canvas
                    ref={arFilmCanvasRef}
                    data-testid="ar-film-negatoscope-canvas"
                    width={620}
                    height={98}
                    className="w-full h-[78px] sm:h-[92px] rounded-xl border border-slate-800 block"
                  />
                </div>
              )}
            </div>

            {/* Bottom Spatial AR Alignment Bar & Shot Stepper */}
            <div className="px-4 py-3 bg-[#090d1f] border-t border-slate-800 grid sm:grid-cols-3 gap-3 items-center text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 whitespace-nowrap">
                  {isAr ? 'حجم التراكب:' : 'AR Scale:'}
                </span>
                <input
                  type="range"
                  min={70}
                  max={135}
                  value={arScalePct}
                  onChange={(e) => setArScalePct(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="font-mono text-[11px] w-10">{arScalePct}%</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 whitespace-nowrap">
                  {isAr ? 'دوران المحور:' : 'AR Rotate:'}
                </span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={arRotationDeg}
                  onChange={(e) => setArRotationDeg(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="font-mono text-[11px] w-10">{arRotationDeg}°</span>
              </div>

              <div className="flex items-center justify-end gap-1.5">
                {Array.from({ length: techniquePhysics.minExposuresRequired }).map((_, idx) => {
                  const shotNum = idx + 1;
                  return (
                    <button
                      key={shotNum}
                      type="button"
                      onClick={() => setActiveShotIndex(shotNum)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold cursor-pointer ${
                        activeShotIndex === shotNum
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {isAr ? `لقطة ${shotNum}` : `Shot ${shotNum}`}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setArScalePct(100);
                    setArRotationDeg(0);
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  title={isAr ? 'إعادة ضبط المحاذاة' : 'Reset AR Alignment'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Zoomed Darkroom Negatoscope & Live Optical Densitometer Strip */}
          <div className={`rounded-3xl border p-5 space-y-3 shadow-lg ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono font-bold text-amber-500">
                  {isAr
                    ? 'منظار قراءة الأفلام المكبّر + مقياس الكثافة الضوئية (Densitometer)'
                    : 'High-Contrast Negatoscope Viewer & Live Optical Densitometer'}
                </div>
                <h3 className="text-sm sm:text-base font-black">
                  {activeDefect.name[language]} ({activeDefect.codeSymbol})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setInvertXrayPolarity((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                    invertXrayPolarity
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : `${subSurface}`
                  }`}
                >
                  {isAr ? 'عكس التباين (Pos/Neg)' : 'Invert Polarity'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaliperTicks((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                    showCaliperTicks
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                      : `${subSurface}`
                  }`}
                >
                  {isAr ? 'فكّي القياس' : 'Caliper'}
                </button>
              </div>
            </div>

            <canvas
              ref={darkroomFilmCanvasRef}
              width={760}
              height={136}
              className="w-full h-[118px] sm:h-[136px] rounded-2xl border border-slate-800 bg-slate-950 block"
            />

            {/* Live Densitometer Probe Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className={mutedText}>
                  {isAr
                    ? `مسبار الكثافة الضوئية عند المحطة X = ${densitometerXMm} mm`
                    : `Densitometer Probe Station X = ${densitometerXMm} mm`}
                </span>
                <span
                  data-testid="live-densitometer-readout"
                  className="font-black text-amber-400"
                >
                  {`D(x) = ${densitometerReading.stationOpticalDensityHd.toFixed(2)} H&D · ΔD = ${(
                    densitometerReading.stationOpticalDensityHd -
                    densitometerReading.weldBackgroundHd
                  ).toFixed(2)}`}
                </span>
              </div>
              <input
                type="range"
                data-testid="densitometer-probe-slider"
                min={0}
                max={200}
                step={1}
                value={densitometerXMm}
                onChange={(e) => setDensitometerXMm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className={`rounded-2xl border p-3 text-xs leading-relaxed ${subSurface}`}>
              <div className="font-bold text-cyan-400 mb-0.5">
                {isAr ? 'البصمة الإشعاعية على الفيلم والسبب الميتالورجي:' : 'Radiographic Signature & Metallurgical Cause:'}
              </div>
              <p>{activeDefect.filmAppearance[language]}</p>
              <p className={`mt-1 ${mutedText}`}>{activeDefect.weldingCause[language]}</p>
            </div>
          </div>

          {/* Captured Annotated Field Report Preview */}
          {capturedReportUrl && (
            <div
              data-testid="ar-rt-captured-report-card"
              className={`rounded-3xl border p-4 space-y-3 ${cardSurface}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400">
                  {isAr
                    ? 'تم توليد لقطة تقرير الواقع المعزز والأكواد بنجاح'
                    : 'Annotated AR & Multi-Code Inspection Snapshot Ready'}
                </span>
                <a
                  href={capturedReportUrl}
                  download={`insco-ar-rt-${techniqueId}-${selectedDefectId}.png`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تنزيل PNG' : 'Download PNG'}</span>
                </a>
              </div>
              <img
                src={capturedReportUrl}
                alt="Captured AR Radiographic Report"
                className="w-full rounded-2xl border border-slate-700"
              />
            </div>
          )}
        </div>

        {/* RIGHT CONTROL & MULTI-CODE EVALUATION DECK (5 COLS) */}
        <div className="xl:col-span-5 space-y-5">
          {/* PILLAR 1 PANEL: ALL 8 CODE SHOOTING TECHNIQUES */}
          {activePillar === 'techniques_ar' && (
            <div className={`rounded-3xl border p-5 space-y-4 shadow-xl ${cardSurface}`}>
              <div className="flex items-center justify-between border-b border-slate-700/25 pb-3">
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-bold">
                    ASME V Art. 2 · ISO 17636-1 · API 1104
                  </div>
                  <h3 className="text-base font-black">
                    {isAr
                      ? 'جميع تكنيكات التصوير الإشعاعي في الأكواد (8 تكنيكات)'
                      : 'All 8 Code Radiographic Exposure Techniques'}
                  </h3>
                </div>
                <Sliders className="w-5 h-5 text-cyan-400 shrink-0" />
              </div>

              {/* 8 Technique Selector Cards */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {AR_RT_CODE_TECHNIQUES.map((tech) => {
                  const isSel = tech.id === techniqueId;
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      data-testid={`select-ar-tech-${tech.id}`}
                      onClick={() => handleSelectTechnique(tech.id)}
                      className={`w-full text-start p-3 rounded-2xl border transition cursor-pointer ${
                        isSel
                          ? 'bg-cyan-500/15 border-cyan-400'
                          : `${subSurface} hover:border-cyan-500/40`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black">{tech.name[language]}</span>
                        <span className="text-[11px] font-mono text-cyan-400 shrink-0">
                          {`${tech.wallsPenetrated}W / ${tech.imagesInterpreted}I · ${tech.defaultExposuresFor360}x`}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 leading-relaxed ${mutedText}`}>
                        {tech.summary[language]}
                      </p>
                      <div className="text-[10.5px] font-mono text-amber-400 mt-1">
                        {tech.codeReferences}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Radiation Source Picker */}
              <div className={`rounded-2xl border p-3.5 space-y-2.5 ${subSurface}`}>
                <label className="text-xs font-bold block">
                  {isAr ? 'المصدر الإشعاعي وحجم البؤرة (Focal Spot F):' : 'Radiation Source & Focal Spot:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {AR_RT_RADIATION_SOURCES.map((src) => (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setSourceId(src.id)}
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-mono font-bold transition cursor-pointer ${
                        sourceId === src.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'border-slate-700/60 hover:border-amber-400'
                      }`}
                    >
                      {src.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Exposure Geometry Sliders */}
              <div className={`rounded-2xl border p-3.5 space-y-3 ${subSurface}`}>
                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{isAr ? 'القطر الخارجي للأنبوب / العرض (OD):' : 'Pipe OD / Span:'}</span>
                    <span className="font-bold text-cyan-400">{pipeOdMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min={33.4}
                    max={610}
                    step={0.5}
                    value={pipeOdMm}
                    onChange={(e) => setPipeOdMm(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{isAr ? 'سماكة الجدار المفرد (Wall t):' : 'Single Wall Thickness (t):'}</span>
                    <span className="font-bold text-cyan-400">{wallThicknessMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    data-testid="ar-rt-wall-slider"
                    min={3.5}
                    max={50}
                    step={0.5}
                    value={wallThicknessMm}
                    onChange={(e) => setWallThicknessMm(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {techniqueId !== 'swsi_panoramic' && (
                  <div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>{isAr ? 'المسافة بين المصدر والفيلم (SFD):' : 'Source-to-Film Distance (SFD):'}</span>
                      <span className="font-bold text-cyan-400">{sfdMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={120}
                      max={1000}
                      step={10}
                      value={sfdMm}
                      onChange={(e) => setSfdMm(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                )}

                {techniqueId === 'dwdi_elliptical' && (
                  <div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>{isAr ? 'زاوية الإزاحة الإهليلجية (15°–25°):' : 'Elliptical Offset Angle:'}</span>
                      <span className="font-bold text-emerald-400">
                        {`${beamOffsetDeg}° (Offset=${techniquePhysics.axialOffsetMm}mm)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      step={1}
                      value={beamOffsetDeg}
                      onChange={(e) => setBeamOffsetDeg(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{isAr ? 'معامل جرعة التعريض (mA·min / Ci·min):' : 'Exposure Dose Factor:'}</span>
                    <span className="font-bold text-amber-400">
                      {`${exposureFactorPct}% → D=${techniquePhysics.weldOpticalDensityHd} H&D`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={45}
                    max={165}
                    step={5}
                    value={exposureFactorPct}
                    onChange={(e) => setExposureFactorPct(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Code Setup Diagnostics */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-slate-400">
                  {`${techniquePhysics.iqiWireDesignation} · ${techniquePhysics.iqiPlacementLabel[language]}`}
                </div>
                {techniquePhysics.diagnostics.map((diag, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border px-3 py-2 text-xs flex items-start gap-2 ${
                      diag.level === 'pass'
                        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                        : diag.level === 'warn'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-rose-500/45 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {diag.level === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{diag[language]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PILLAR 2 PANEL: ALL 18 RADIOGRAPHIC FILM DEFECTS & SIZING */}
          {activePillar === 'film_defects' && (
            <div className={`rounded-3xl border p-5 space-y-4 shadow-xl ${cardSurface}`}>
              <div className="border-b border-slate-700/25 pb-3">
                <div className="text-xs font-mono text-amber-400 font-bold">
                  {isAr ? 'أطلس قراءة عيوب الأفلام الكامل (18 عيباً)' : 'Complete 18 Radiographic Film Defects Atlas'}
                </div>
                <h3 className="text-base font-black">
                  {isAr
                    ? 'اختر العيب وعدّل أبعاده على الفيلم الحي'
                    : 'Select Weld Indication & Adjust Live Film Dimensions'}
                </h3>
              </div>

              {/* Category Filter Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', ar: 'الكل (18)', en: 'All (18)' },
                    { id: 'planar_crack', ar: 'الشروخ', en: 'Cracks' },
                    { id: 'fusion_penetration', ar: 'الانصهار/الجذر', en: 'LOF / LOP' },
                    { id: 'slag_inclusion', ar: 'الخبث', en: 'Slag' },
                    { id: 'porosity_gas', ar: 'المسامية', en: 'Porosity' },
                    { id: 'metallic_inclusion', ar: 'التنجستن/الأكاسيد', en: 'Tungsten' },
                    { id: 'geometry_profile', ar: 'الهندسة/النهش', en: 'Profile' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDefectCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                      defectCategoryFilter === cat.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : `${subSurface}`
                    }`}
                  >
                    {cat[language]}
                  </button>
                ))}
              </div>

              {/* 18 Defects Selector List */}
              <div className="grid sm:grid-cols-2 gap-2 max-h-[270px] overflow-y-auto pr-1">
                {filteredDefects.map((def) => {
                  const active = def.id === selectedDefectId;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      data-testid={`select-film-defect-${def.id}`}
                      onClick={() => handleSelectDefect(def.id)}
                      className={`p-2.5 rounded-2xl border text-start transition cursor-pointer ${
                        active
                          ? 'bg-amber-500/15 border-amber-400'
                          : `${subSurface} hover:border-amber-500/40`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs font-black">
                        <span className="truncate">{def.name[language]}</span>
                        <span className="font-mono text-[10.5px] text-amber-400 shrink-0">
                          {def.codeSymbol}
                        </span>
                      </div>
                      <div className={`text-[10.5px] font-mono mt-0.5 ${mutedText}`}>
                        {def.densityDeltaHd < 0
                          ? isAr
                            ? `ساطع أبيض (ΔD ${def.densityDeltaHd})`
                            : `Bright White (ΔD ${def.densityDeltaHd})`
                          : isAr
                          ? `داكن على الفيلم (ΔD +${def.densityDeltaHd})`
                          : `Dark on Film (ΔD +${def.densityDeltaHd})`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Defect Sizing Sliders (Immediately update AR Film & All 7 Codes!) */}
              <div className={`rounded-2xl border p-3.5 space-y-3 ${subSurface}`}>
                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{isAr ? 'طول الدلالة على الفيلم (Length L):' : 'Indication Length (L):'}</span>
                    <span data-testid="defect-length-readout" className="font-bold text-amber-400">
                      {defectLengthMm.toFixed(1)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    data-testid="defect-length-slider"
                    min={1.0}
                    max={60.0}
                    step={0.5}
                    value={defectLengthMm}
                    onChange={(e) => setDefectLengthMm(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{isAr ? 'العرض / قطر المسام (Width / Pore d):' : 'Width / Pore Diameter (W):'}</span>
                    <span className="font-bold text-amber-400">{defectWidthMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    data-testid="defect-width-slider"
                    min={0.3}
                    max={8.0}
                    step={0.1}
                    value={defectWidthMm}
                    onChange={(e) => setDefectWidthMm(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{isAr ? 'العمق التقديري (Depth Z):' : 'Estimated Depth (Z):'}</span>
                    <span className="font-bold text-cyan-400">{defectDepthMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={10.0}
                    step={0.1}
                    value={defectDepthMm}
                    onChange={(e) => setDefectDepthMm(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{isAr ? 'إضاءة النيجاتوسكوب (Luminance):' : 'Negatoscope Brightness:'}</span>
                    <span className="font-bold text-sky-400">{negatoscopeBrightnessPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={65}
                    max={135}
                    step={5}
                    value={negatoscopeBrightnessPct}
                    onChange={(e) => setNegatoscopeBrightnessPct(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PILLAR 3 PANEL: ALL-CODES ACCEPTANCE CRITERIA ENGINE & INSPECTOR EXAM */}
          {activePillar === 'acceptance_codes' && (
            <div className={`rounded-3xl border p-5 space-y-4 shadow-xl ${cardSurface}`}>
              <div className="border-b border-slate-700/25 pb-3">
                <div className="text-xs font-mono text-emerald-400 font-bold">
                  {isAr
                    ? `تقييم فوري متزامن عبر 7 أكواد عالمية (t=${wallThicknessMm}mm · L=${defectLengthMm}mm)`
                    : `Live Simultaneous 7-Code Evaluation (t=${wallThicknessMm}mm · L=${defectLengthMm}mm)`}
                </div>
                <h3 className="text-base font-black">
                  {isAr
                    ? `مصفوفة القبول والرفض لعيب: ${activeDefect.name.ar}`
                    : `All-Codes Acceptance Matrix: ${activeDefect.name.en}`}
                </h3>
              </div>

              {/* Inspector Sentencing Challenge Box */}
              <div className={`rounded-2xl border p-3.5 space-y-3 ${subSurface}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>
                      {isAr
                        ? 'اختبار قرار المفتش المعتمد (+XP):'
                        : 'Certified Inspector Sentencing Challenge (+XP):'}
                    </span>
                  </div>
                  <select
                    data-testid="target-exam-code-select"
                    aria-label={isAr ? 'الكود المستهدف للحكم' : 'Target acceptance code'}
                    value={targetExamCodeId}
                    onChange={(e) => {
                      setTargetExamCodeId(e.target.value as ArRtAcceptanceCodeId);
                      setInspectorFeedback(null);
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2 py-1 text-xs font-mono"
                  >
                    {AR_RT_ACCEPTANCE_CODES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shortCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid="submit-verdict-accept"
                    onClick={() => handleSubmitInspectorVerdict('ACCEPT')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'قرار: مقبول (ACCEPT)' : 'Sentence: ACCEPT'}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="submit-verdict-reject"
                    onClick={() => handleSubmitInspectorVerdict('REJECT')}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isAr ? 'قرار: مرفوض (REJECT)' : 'Sentence: REJECT'}</span>
                  </button>
                </div>

                {inspectorFeedback && (
                  <div
                    data-testid="inspector-verdict-feedback"
                    className={`rounded-xl border p-3 text-xs space-y-1 ${
                      inspectorFeedback.correct
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    <div className="font-black flex items-center justify-between">
                      <span>
                        {inspectorFeedback.correct
                          ? isAr
                            ? `أحسنت! حكم مطابق لـ ${inspectorFeedback.codeLabel}`
                            : `Correct! Matches ${inspectorFeedback.codeLabel}`
                          : isAr
                          ? `حكم غير مطابق — قرار ${inspectorFeedback.codeLabel} هو ${inspectorFeedback.officialVerdict}`
                          : `Mismatch — Official ${inspectorFeedback.codeLabel} Verdict is ${inspectorFeedback.officialVerdict}`}
                      </span>
                      <span className="font-mono text-amber-300">
                        +{inspectorFeedback.xpEarned} XP
                      </span>
                    </div>
                    <div className="font-mono text-[11px] opacity-90">
                      {inspectorFeedback.clauseRef}
                    </div>
                    <p className="text-slate-200 leading-relaxed">{inspectorFeedback.explanation}</p>
                  </div>
                )}
              </div>

              {/* All 7 International Codes Comparison Matrix */}
              <div
                data-testid="all-codes-verdict-matrix"
                className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1"
              >
                {allCodeVerdicts.map((v) => {
                  const isAccept = v.verdict === 'ACCEPT';
                  return (
                    <div
                      key={v.codeId}
                      data-testid={`code-verdict-row-${v.codeId}`}
                      {...clickable(() => setTargetExamCodeId(v.codeId), isAr ? 'اختيار كود التقييم' : 'Select evaluation code')}
                      className={`rounded-2xl border p-3 transition cursor-pointer ${
                        targetExamCodeId === v.codeId
                          ? 'border-cyan-400 bg-cyan-500/10'
                          : `${subSurface}`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black">{v.shortCode}</span>
                          <span className={`text-[11px] font-mono ms-2 ${mutedText}`}>
                            {v.clauseRef}
                          </span>
                        </div>
                        <span
                          data-testid={`code-verdict-status-${v.codeId}`}
                          className={`text-xs font-mono font-black ${
                            isAccept ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isAccept
                            ? isAr
                              ? '● مقبول ACCEPT'
                              : '● ACCEPT'
                            : isAr
                            ? '▲ مرفوض REJECT'
                            : '▲ REJECT'}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-amber-300">
                        <span>{v.ruleFormula}</span>
                        <span>
                          {v.governingParameter === 'zero_tolerance'
                            ? `${v.measuredPrimaryMm} mm > 0.0 mm`
                            : v.governingParameter === 'exempt_in_spot'
                            ? 'Spot RT Exempt'
                            : `${v.measuredPrimaryMm} / ${v.maxAllowedMm} mm`}
                        </span>
                      </div>

                      <p className={`text-[11px] mt-1 leading-relaxed ${mutedText}`}>
                        {v.rationale[language]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GE Radiographic Exposure Time App Companion Modal */}
      {showGeExposureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative max-w-5xl w-full my-auto">
            <GeRadiographicExposureTimeApp
              language={language}
              initialSource={sourceId === 'xray_crawler' ? 'xray_pano' : 'ir192'}
              initialThicknessMm={wallThicknessMm}
              initialSfdCm={Math.round(sfdMm / 10)}
              onClose={() => setShowGeExposureModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
