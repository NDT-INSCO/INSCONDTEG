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
  DefectToleranceTooltip,
  DefectToleranceTriggerBar,
} from './DefectToleranceAlertSystem';
import { gradeAndRecordWorkshopAttempt } from '../../../utils/workshopTrainingResultsStore';
import {
  computePautSectorFlawProjections,
  computeWeldBevelHalfWidthAtDepthMm,
  PautWeldBevelConfig,
  renderModernPautSectorialScan,
  WeldGrooveType,
} from '../../../utils/pautWeldOverlayRenderer';
import {
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Eye,
  Info,
  Layers,
  XCircle,
} from 'lucide-react';

interface PautOmniScanDeviceProps {
  language: Language;
}

export type PautFlawTarget = ExtendedWeldFlawId | 'sound_weld';
type OmniLayoutMode = 'asc_tri' | 'abcs_quad' | 'sscan_large';

export const PautOmniScanDevice: React.FC<PautOmniScanDeviceProps> = ({ language }) => {
  const isAr = language === 'ar';

  // --- Authentic Olympus OmniScan X3 Hardware & Focal Law State ---
  const [gainDb, setGainDb] = useState<number>(44.0);
  const [selectedAngleDeg, setSelectedAngleDeg] = useState<number>(55);
  const [probeIndexOffsetMm, setProbeIndexOffsetMm] = useState<number>(36);
  const [encoderYmm, setEncoderYmm] = useState<number>(50);
  const [specimenGeometry, setSpecimenGeometry] = useState<'flat' | 'curved'>('flat');
  const [pipeOdMm, setPipeOdMm] = useState<number>(219);
  const [apertureElements, setApertureElements] = useState<16 | 32 | 64>(32);
  const [startElement, setStartElement] = useState<number>(1);
  const [focalDepthMm, setFocalDepthMm] = useState<number>(18);
  const [wedgeDelayUs, setWedgeDelayUs] = useState<number>(2.4);
  const [scanLawMode, setScanLawMode] = useState<'sectorial' | 'linear'>('sectorial');
  const [layoutMode, setLayoutMode] = useState<OmniLayoutMode>('abcs_quad');
  const [isTcgCalibrated, setIsTcgCalibrated] = useState<boolean>(true);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  const [activeFlawTarget, setActiveFlawTarget] = useState<PautFlawTarget>('root_crack');
  const [isWeldOverlayVisible, setIsWeldOverlayVisible] = useState<boolean>(true);
  const [showSkipMirror, setShowSkipMirror] = useState<boolean>(true);
  const [weldGrooveType, setWeldGrooveType] = useState<WeldGrooveType>('single_v');
  const [bevelAngleDeg, setBevelAngleDeg] = useState<number>(30);
  const [showSizingCaliper, setShowSizingCaliper] = useState<boolean>(true);
  const [showPhasedCone, setShowPhasedCone] = useState<boolean>(true);
  const [isDraggingWorkProbe, setIsDraggingWorkProbe] = useState<boolean>(false);

  const [caliperY1Mm, setCaliperY1Mm] = useState<number>(16);
  const [caliperY2Mm, setCaliperY2Mm] = useState<number>(19.5);
  const [selectedCode, setSelectedCode] = useState<InspectionCodeId>('asme_viii');
  const [isToleranceModalOpen, setIsToleranceModalOpen] = useState<boolean>(false);
  const [autoAlertOnDefectSelect, setAutoAlertOnDefectSelect] = useState<boolean>(true);
  const [traineeVerdictChoice, setTraineeVerdictChoice] = useState<'ACCEPT' | 'REJECT'>('REJECT');
  const [logFeedbackMsg, setLogFeedbackMsg] = useState<string | null>(null);

  const sScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workSimCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const plateThicknessMm = 20;

  // Map any of the 16 catalog defects + sound_weld cleanly
  const catalogMatch = ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === activeFlawTarget);
  const currentFlaw =
    activeFlawTarget === 'sound_weld' || !catalogMatch
      ? {
          id: 'sound_weld' as const,
          name: { ar: 'لحام سليم خالٍ من العيوب (Sound Weld)', en: '100% Sound Weld Joint' },
          depthMm: 0,
          lengthMm: 0,
          heightMm: 0,
          offsetXMm: 0,
          standoffAtPeakMm: 35,
          optimalAngleDeg: 55,
          severity: 'Full Pass',
          asmeVerdict: 'ACCEPT' as const,
          reason: {
            ar: 'مقبول: اندماج كامل للجذر والجوانب بدون أي مؤشرات فوق عتبة التسجيل.',
            en: 'Passed: Complete root and sidewall fusion with zero recordable indications.',
          },
        }
      : {
          id: catalogMatch.id,
          name:
            catalogMatch.id === 'lack_of_fusion'
              ? { ar: 'نقص انصهار بالجدار الجانبي (Sidewall LOF)', en: 'Lack of Sidewall Fusion' }
              : catalogMatch.id === 'slag_inclusion'
              ? { ar: 'شائبة خبث وسطية قصيرة (Slag < 6mm)', en: 'Isolated Slag Inclusion (< 6mm)' }
              : catalogMatch.name,
          depthMm: Number((catalogMatch.nominalDepthRatio * plateThicknessMm).toFixed(1)),
          lengthMm: catalogMatch.id === 'slag_inclusion' ? 5.0 : catalogMatch.lengthMm,
          heightMm: catalogMatch.heightMm,
          offsetXMm: catalogMatch.distanceFromWeldCenterMm,
          standoffAtPeakMm: Math.max(
            18,
            Math.min(
              52,
              Math.round(
                catalogMatch.distanceFromWeldCenterMm +
                  catalogMatch.nominalDepthRatio *
                    plateThicknessMm *
                    Math.tan((Math.max(45, catalogMatch.optimalAngleDeg) * Math.PI) / 180)
              )
            )
          ),
          optimalAngleDeg: Math.max(45, catalogMatch.optimalAngleDeg),
          severity:
            catalogMatch.id === 'slag_inclusion' || catalogMatch.defaultAsmeVerdict === 'ACCEPT'
              ? 'Minor Acceptable'
              : 'Critical Reject',
          asmeVerdict: (catalogMatch.id === 'slag_inclusion' ? 'ACCEPT' : catalogMatch.defaultAsmeVerdict) as
            | 'ACCEPT'
            | 'REJECT',
          reason:
            catalogMatch.id === 'slag_inclusion'
              ? {
                  ar: 'مقبول: عيب حجمي معزول طوله 5 مم (أقل من الحد الأقصى 6 مم لسمك 20 مم طبقاً لـ ASME UW-51).',
                  en: 'Acceptable: Isolated volumetric inclusion (L = 5mm <= 6mm limit) conforming to ASME Section VIII UW-51.',
                }
              : {
                  ar: `${catalogMatch.echoSignature.ar} — ${catalogMatch.rejectionReason.ar}`,
                  en: `${catalogMatch.echoSignature.en} — ${catalogMatch.rejectionReason.en}`,
                },
        };

  const measuredFlawHeightMm = Math.abs(caliperY2Mm - caliperY1Mm);

  const coneMetrics = computeUltrasonicBeamCone({
    frequencyMhz: 5.0,
    velocityMs: 3240,
    isPaut: true,
    pautApertureElements: apertureElements,
    pautPitchMm: 0.6,
    pautFocalDepthMm: focalDepthMm,
    wedgeTravelMm: 12,
    wedgeVelocityMs: 2330,
  });

  const activeDefectTolerance =
    activeFlawTarget === 'sound_weld'
      ? null
      : getDefectCodeTolerance(activeFlawTarget, selectedCode, plateThicknessMm, {
          lengthMm: currentFlaw.lengthMm,
          heightMm: measuredFlawHeightMm,
        });

  const bevelConfig: PautWeldBevelConfig = {
    grooveType: weldGrooveType,
    bevelAngleDeg,
    rootGapMm: 2.0,
    rootFaceMm: 1.8,
    hazWidthMm: 2.4,
    capReinforcementMm: 1.5,
  };

  const yLongitudinalFactor =
    activeFlawTarget === 'sound_weld'
      ? 0
      : Math.exp(-Math.pow((encoderYmm - 50) / Math.max(4, currentFlaw.lengthMm), 2));

  const sectorProjectionSummary = computePautSectorFlawProjections({
    canvasWidth: 600,
    canvasHeight: 280,
    plateThicknessMm,
    probeIndexOffsetMm,
    minAngleDeg: 40,
    maxAngleDeg: 70,
    selectedAngleDeg,
    showSkipMirror,
    bevelConfig,
    flaw:
      activeFlawTarget === 'sound_weld'
        ? null
        : {
            id: currentFlaw.id,
            depthMm: currentFlaw.depthMm,
            heightMm: currentFlaw.heightMm,
            offsetFromCenterTowardsProbeMm: currentFlaw.offsetXMm,
            isPlanar: currentFlaw.asmeVerdict === 'REJECT' && currentFlaw.heightMm >= 1.5,
            baseIntensity: yLongitudinalFactor,
          },
  });

  // ---------------------------------------------------------------------------
  // 1. Render OmniScan X3 Sectorial S-Scan with True Multi-Leg Weld Overlay
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isFrozen) return;
    const canvas = sScanCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderModernPautSectorialScan(ctx, {
      width: canvas.width,
      height: canvas.height,
      plateThicknessMm,
      probeIndexOffsetMm,
      minAngleDeg: 40,
      maxAngleDeg: 70,
      selectedAngleDeg,
      apertureElements,
      focalDepthMm,
      gainDb,
      isTcgCalibrated,
      scanLawMode,
      specimenGeometry,
      pipeOdMm,
      isWeldOverlayVisible,
      showSkipMirror,
      bevelConfig: {
        grooveType: weldGrooveType,
        bevelAngleDeg,
        rootGapMm: 2.0,
        rootFaceMm: 1.8,
        hazWidthMm: 2.4,
        capReinforcementMm: 1.5,
      },
      flaw:
        activeFlawTarget === 'sound_weld'
          ? null
          : {
              id: currentFlaw.id,
              depthMm: currentFlaw.depthMm,
              heightMm: currentFlaw.heightMm,
              offsetFromCenterTowardsProbeMm: currentFlaw.offsetXMm,
              isPlanar: currentFlaw.asmeVerdict === 'REJECT' && currentFlaw.heightMm >= 1.5,
              baseIntensity: yLongitudinalFactor,
            },
      showFocalBeamCone: showPhasedCone,
      showSizingCaliper,
      caliperY1Mm,
      caliperY2Mm,
      isAr,
    });
  }, [
    gainDb,
    selectedAngleDeg,
    probeIndexOffsetMm,
    encoderYmm,
    specimenGeometry,
    pipeOdMm,
    apertureElements,
    focalDepthMm,
    scanLawMode,
    isTcgCalibrated,
    activeFlawTarget,
    isWeldOverlayVisible,
    showSkipMirror,
    weldGrooveType,
    bevelAngleDeg,
    showPhasedCone,
    showSizingCaliper,
    caliperY1Mm,
    caliperY2Mm,
    measuredFlawHeightMm,
    isFrozen,
    isAr,
    yLongitudinalFactor,
    currentFlaw.id,
    currentFlaw.depthMm,
    currentFlaw.lengthMm,
    currentFlaw.heightMm,
    currentFlaw.offsetXMm,
    currentFlaw.asmeVerdict,
  ]);

  // ---------------------------------------------------------------------------
  // 2. Render Synchronized A-Scan, Encoded C-Scan, and Side B-Scan
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isFrozen) return;

    const activeProj = sectorProjectionSummary.primaryActiveProjection;
    const angleDiff = activeProj
      ? Math.abs(selectedAngleDeg - activeProj.beamAngleDeg)
      : Math.abs(selectedAngleDeg - currentFlaw.optimalAngleDeg);
    const standoffDiff = Math.abs(probeIndexOffsetMm - currentFlaw.standoffAtPeakMm);

    let peakAmp = 0;
    if (activeFlawTarget !== 'sound_weld' && yLongitudinalFactor > 0.08) {
      if (activeProj && activeProj.isInsideSector && angleDiff < 12) {
        const legFactor = activeProj.leg === 1 ? 1.0 : isTcgCalibrated ? 0.92 : 0.75;
        peakAmp = Math.min(
          98,
          Math.max(0, (90 - angleDiff * 5.2) * Math.pow(10, (gainDb - 40) / 20) * yLongitudinalFactor * legFactor)
        );
      } else if (angleDiff < 14 && standoffDiff < 16) {
        peakAmp = Math.min(
          98,
          (88 - angleDiff * 4.5 - standoffDiff * 2.8) * Math.pow(10, (gainDb - 40) / 20) * yLongitudinalFactor
        );
      }
    }

    // A-Scan
    const aCanvas = aScanCanvasRef.current;
    if (aCanvas) {
      const ctx = aCanvas.getContext('2d');
      if (ctx) {
        const w = aCanvas.width;
        const h = aCanvas.height;
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#1e293b';
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(0, (h / 5) * i);
          ctx.lineTo(w, (h / 5) * i);
          ctx.stroke();
        }

        const echoNormPos = activeProj ? Math.min(0.88, Math.max(0.18, activeProj.soundPathMm / 65)) : 0.56;

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          let y = h - 4;
          if (x < w * 0.08) y -= h * 0.72 * Math.exp(-Math.pow(x / (w * 0.024), 2));
          if (peakAmp > 0) {
            const dist = Math.abs(x - w * echoNormPos);
            if (dist < w * 0.08) {
              y -=
                (peakAmp / 100) *
                (h - 16) *
                Math.exp(-Math.pow(dist / (w * 0.025), 2)) *
                Math.abs(Math.sin(dist * 0.55));
            }
          }
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 9.5px monospace';
        const legTag = activeProj && activeProj.isInsideSector ? ` · L${activeProj.leg}` : '';
        ctx.fillText(`A-SCAN @ ${selectedAngleDeg}°${legTag} · ${peakAmp.toFixed(0)}% FSH`, 8, 13);
      }
    }

    // Top C-Scan
    const cCanvas = cScanCanvasRef.current;
    if (cCanvas) {
      const ctx = cCanvas.getContext('2d');
      if (ctx) {
        const w = cCanvas.width;
        const h = cCanvas.height;
        ctx.fillStyle = '#040a18';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(14, 116, 144, 0.22)';
        ctx.fillRect(0, 5, w, h - 10);

        if (activeFlawTarget !== 'sound_weld') {
          const sx = ((50 - currentFlaw.lengthMm / 2) / 100) * w;
          const sw = Math.max(8, (currentFlaw.lengthMm / 100) * w);
          ctx.fillStyle = currentFlaw.asmeVerdict === 'ACCEPT' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(239, 68, 68, 0.94)';
          ctx.fillRect(sx, h / 2 - 5, sw, 10);
        }

        const curX = (encoderYmm / 100) * w;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(curX, 0);
        ctx.lineTo(curX, h);
        ctx.stroke();
      }
    }

    // Side B-Scan (Depth vs Encoder Y)
    const bCanvas = bScanCanvasRef.current;
    if (bCanvas) {
      const ctx = bCanvas.getContext('2d');
      if (ctx) {
        const w = bCanvas.width;
        const h = bCanvas.height;
        ctx.fillStyle = '#030816';
        ctx.fillRect(0, 0, w, h);

        // Backwall echo strip at bottom
        ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.fillRect(0, h - 10, w, 4);

        if (activeFlawTarget !== 'sound_weld') {
          const sx = ((50 - currentFlaw.lengthMm / 2) / 100) * w;
          const sw = Math.max(8, (currentFlaw.lengthMm / 100) * w);
          const sy = (currentFlaw.depthMm / plateThicknessMm) * (h - 12);
          const sh = Math.max(5, (currentFlaw.heightMm / plateThicknessMm) * (h - 12));
          ctx.fillStyle = currentFlaw.asmeVerdict === 'ACCEPT' ? '#f59e0b' : '#ef4444';
          ctx.fillRect(sx, Math.max(4, sy - sh / 2), sw, sh);
        }

        const curX = (encoderYmm / 100) * w;
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(curX, 0);
        ctx.lineTo(curX, h);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText('SIDE B-SCAN (Depth Z vs Encoder Y)', 8, 12);
      }
    }
  }, [
    gainDb,
    selectedAngleDeg,
    probeIndexOffsetMm,
    encoderYmm,
    activeFlawTarget,
    wedgeDelayUs,
    layoutMode,
    isFrozen,
    currentFlaw.depthMm,
    currentFlaw.lengthMm,
    currentFlaw.heightMm,
    currentFlaw.optimalAngleDeg,
    currentFlaw.standoffAtPeakMm,
    currentFlaw.asmeVerdict,
  ]);

  // ---------------------------------------------------------------------------
  // 3. Render Side-by-Side Live PAUT Physical Specimen + Phased Beam Cone
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

    const originX = w * 0.36;
    const scale = 4.3;
    const topY = 56;
    const bottomY = topY + plateThicknessMm * scale;

    if (specimenGeometry === 'flat') {
      ctx.fillStyle = '#131c36';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.fillRect(16, topY, w - 32, plateThicknessMm * scale);
      ctx.strokeRect(16, topY, w - 32, plateThicknessMm * scale);

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      const simSteps = 12;
      for (let i = 0; i <= simSteps; i++) {
        const z = (i / simSteps) * plateThicknessMm;
        const hw = computeWeldBevelHalfWidthAtDepthMm(z, plateThicknessMm, {
          grooveType: weldGrooveType,
          bevelAngleDeg,
          rootGapMm: 2.0,
          rootFaceMm: 1.8,
          hazWidthMm: 2.4,
          capReinforcementMm: 1.5,
        });
        const px = originX - hw * scale;
        const py = topY + z * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = simSteps; i >= 0; i--) {
        const z = (i / simSteps) * plateThicknessMm;
        const hw = computeWeldBevelHalfWidthAtDepthMm(z, plateThicknessMm, {
          grooveType: weldGrooveType,
          bevelAngleDeg,
          rootGapMm: 2.0,
          rootFaceMm: 1.8,
          hazWidthMm: 2.4,
          capReinforcementMm: 1.5,
        });
        ctx.lineTo(originX + hw * scale, topY + z * scale);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (activeFlawTarget !== 'sound_weld') {
        drawComprehensiveDefectMorphology(
          ctx,
          activeFlawTarget,
          originX + currentFlaw.offsetXMm * scale,
          topY + currentFlaw.depthMm * scale,
          topY,
          bottomY,
          scale,
          true
        );
      }

      const entryX = originX + probeIndexOffsetMm * scale;

      // Draw Sectorial Fan Rays (40° to 70°)
      for (let fanDeg = 40; fanDeg <= 70; fanDeg += 6) {
        const fRad = (fanDeg * Math.PI) / 180;
        const fEndX = entryX - plateThicknessMm * Math.tan(fRad) * scale;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(entryX, topY);
        ctx.lineTo(fEndX, bottomY);
        ctx.stroke();
      }

      // Draw Focused Phased Array Cone ("كوم الأشعة الطوري الممركز") along selectedAngleDeg
      const selRad = (selectedAngleDeg * Math.PI) / 180;
      const bounceX = entryX - plateThicknessMm * Math.tan(selRad) * scale;
      const leg2X = bounceX - plateThicknessMm * Math.tan(selRad) * scale;

      if (showPhasedCone) {
        drawUltrasonicBeamCone2D({
          ctx,
          entryX,
          entryY: topY,
          bounceX,
          bounceY: bottomY,
          leg2EndX: leg2X,
          leg2EndY: topY,
          scalePxPerMm: scale,
          coneMetrics,
          isPaut: true,
          focalDepthMm,
          showWavefronts: true,
          showNearField: true,
          isHit: activeFlawTarget !== 'sound_weld',
        });
      }

      // Multi-Element PAUT Wedge + Encoder Wheel
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.strokeStyle = '#f59e0b';
      ctx.fillRect(entryX - 4, topY - 18, 34, 18);
      ctx.strokeRect(entryX - 4, topY - 18, 34, 18);
      for (let el = 0; el < 8; el++) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(entryX - 1 + el * 3.8, topY - 15, 2.4, 5);
      }
      // Wheel Encoder attached behind PAUT Wedge
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(entryX + 38, topY - 7, 7, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Curved Pipe Specimen
      const visOuterR = 205;
      const thkPx = plateThicknessMm * scale * 0.9;
      const visInnerR = visOuterR - thkPx;
      const cx = originX;
      const cy = 54 + visOuterR;

      ctx.fillStyle = '#131c36';
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, cy, visOuterR, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.78);
      ctx.arc(cx, cy, visInnerR, -Math.PI / 2 + 0.78, -Math.PI / 2 - 0.62, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (activeFlawTarget !== 'sound_weld') {
        drawComprehensiveDefectMorphology(
          ctx,
          activeFlawTarget,
          cx + currentFlaw.offsetXMm * scale * 0.85,
          cy - visOuterR + (currentFlaw.depthMm / plateThicknessMm) * thkPx,
          cy - visOuterR,
          cy - visInnerR,
          scale * 0.9,
          true
        );
      }

      const gamma = (probeIndexOffsetMm * scale) / visOuterR;
      const pAng = -Math.PI / 2 + gamma;
      const entryX = cx + visOuterR * Math.cos(pAng);
      const entryY = cy + visOuterR * Math.sin(pAng);
      const selRad = (selectedAngleDeg * Math.PI) / 180;
      const idAng = pAng - (plateThicknessMm * Math.tan(selRad) * scale) / visOuterR;
      const bounceX = cx + visInnerR * Math.cos(idAng);
      const bounceY = cy + visInnerR * Math.sin(idAng);

      if (showPhasedCone) {
        drawUltrasonicBeamCone2D({
          ctx,
          entryX,
          entryY,
          bounceX,
          bounceY,
          scalePxPerMm: scale * 0.9,
          coneMetrics,
          isPaut: true,
          focalDepthMm,
          showWavefronts: true,
          showNearField: true,
          isHit: activeFlawTarget !== 'sound_weld',
        });
      }

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(entryX, entryY - 5, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom Focal Law Delay Bar HUD inside Work Simulator
    const hudY = h - 38;
    ctx.fillStyle = '#090f20';
    ctx.strokeStyle = '#1e293b';
    ctx.fillRect(16, hudY, w - 32, 26);
    ctx.strokeRect(16, hudY, w - 32, 26);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(
      `FOCAL LAW CONE: ${apertureElements}E (#${startElement}..#${startElement + apertureElements - 1}) · Focus=${focalDepthMm}mm · Waist=${coneMetrics.focalWaistWidthMm.toFixed(1)}mm`,
      24,
      hudY + 16
    );
  }, [
    specimenGeometry,
    probeIndexOffsetMm,
    selectedAngleDeg,
    activeFlawTarget,
    apertureElements,
    startElement,
    focalDepthMm,
    showPhasedCone,
    weldGrooveType,
    bevelAngleDeg,
    coneMetrics,
    currentFlaw.depthMm,
    currentFlaw.offsetXMm,
  ]);

  const handleWorkCanvasPointer = (clientX: number) => {
    const canvas = workSimCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (clientX - rect.left) / Math.max(1, rect.width);
    const px = relX * canvas.width;
    const originX = canvas.width * 0.36;
    const mm = Math.round(Math.max(18, Math.min(58, (px - originX) / 4.3)));
    setProbeIndexOffsetMm(mm);
  };

  const handleLogPautInspection = () => {
    const res = gradeAndRecordWorkshopAttempt({
      instrument: 'PAUT',
      deviceModel: `Olympus OmniScan X3 (${apertureElements}E · ${selectedAngleDeg}°)`,
      specimenGeometry,
      defectId: activeFlawTarget,
      defectNameAr: currentFlaw.name.ar,
      defectNameEn: currentFlaw.name.en,
      actualDepthMm: currentFlaw.depthMm,
      measuredDepthMm: caliperY2Mm,
      actualLengthMm: currentFlaw.lengthMm,
      measuredLengthMm: currentFlaw.lengthMm,
      echoAmplitudePct: 86,
      codeStandard: 'ASME Sec V Art. 4 / Sec VIII UW-51',
      traineeVerdict: traineeVerdictChoice,
      actualCodeVerdict: currentFlaw.asmeVerdict,
    });
    setLogFeedbackMsg(
      isAr
        ? `تم تسجيل نتيجة فحص PAUT في السجل التدريبي (${res.scorePct}%)!`
        : `PAUT inspection logged to Training Results (${res.scorePct}%)!`
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Cpu className="w-4 h-4" />
            <span>
              {isAr
                ? 'جهاز الفحص المتقدم بالمصفوفات الطورية (Olympus OmniScan X3)'
                : 'Advanced Phased Array Ultrasonic Flaw Detector (Olympus OmniScan X3)'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {isAr
              ? 'جهاز PAUT بجميع مفاتيحه الواقعية مدمج بجانبه محاكي العمل وكوم الأشعة الطوري'
              : 'Full-Key PAUT OmniScan X3 Merged Side-by-Side with Phased Beam Cone Work Simulator'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSpecimenGeometry('flat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
              specimenGeometry === 'flat' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isAr ? 'عينة فلات (Flat)' : 'Flat Specimen'}
          </button>
          <button
            type="button"
            onClick={() => setSpecimenGeometry('curved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
              specimenGeometry === 'curved' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isAr ? 'عينة كيرف (Curved Pipe)' : 'Curved Pipe'}
          </button>

          <div
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 ${
              currentFlaw.asmeVerdict === 'REJECT'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {currentFlaw.asmeVerdict === 'REJECT' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>ASME: {currentFlaw.asmeVerdict}</span>
          </div>
        </div>
      </div>

      {/* Quick 4 Flaw Presets (Tested!) + Full 16-Defect Dropdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'root_crack', ar: 'شرخ طولي بجذر اللحام (Root Crack)', en: 'Longitudinal Root Crack', sev: 'Critical Reject' },
              { id: 'lack_of_fusion', ar: 'نقص انصهار بالجدار الجانبي (Sidewall LOF)', en: 'Lack of Sidewall Fusion', sev: 'Major Reject' },
              { id: 'slag_inclusion', ar: 'شائبة خبث وسطية قصيرة (Slag < 6mm)', en: 'Isolated Slag Inclusion (< 6mm)', sev: 'Minor Acceptable' },
              { id: 'sound_weld', ar: 'لحام سليم خالٍ من العيوب (Sound Weld)', en: '100% Sound Weld Joint', sev: 'Full Pass' },
            ] as const
          ).map((item) => {
            const isSelected = activeFlawTarget === item.id;
            const btn = (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveFlawTarget(item.id);
                  setLogFeedbackMsg(null);
                  if (item.id !== 'sound_weld' && autoAlertOnDefectSelect) {
                    setIsToleranceModalOpen(true);
                  }
                }}
                className={`w-full h-full p-2.5 rounded-xl border text-start transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold leading-snug">{isAr ? item.ar : item.en}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{item.sev}</div>
              </button>
            );
            return item.id === 'sound_weld' ? (
              <div key={item.id} className="flex flex-col items-stretch">
                {btn}
              </div>
            ) : (
              <DefectToleranceTooltip
                key={item.id}
                defectId={item.id}
                activeCode={selectedCode}
                thicknessMm={plateThicknessMm}
                language={language}
                position="bottom"
              >
                {btn}
              </DefectToleranceTooltip>
            );
          })}
        </div>

        <div className="lg:col-span-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs">
          <label className="block space-y-1">
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{isAr ? 'أو اختر من كتالوج الـ 16 عيباً كاملاً:' : 'Or Load Any of All 16 Weld Defects:'}</span>
            </span>
            <select
              value={activeFlawTarget}
              onChange={(e) => {
                const nextTarget = e.target.value as PautFlawTarget;
                setActiveFlawTarget(nextTarget);
                if (nextTarget !== 'sound_weld' && autoAlertOnDefectSelect) {
                  setIsToleranceModalOpen(true);
                }
              }}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-white text-[11px]"
            >
              <option value="sound_weld">{isAr ? 'لحام سليم 100% (Sound Weld)' : '100% Sound Weld'}</option>
              {ALL_WELD_DEFECTS_CATALOG.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.codeSymbol} · {isAr ? d.name.ar : d.name.en}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {activeFlawTarget !== 'sound_weld' && catalogMatch && (
        <DefectToleranceTriggerBar
          defectId={catalogMatch.id}
          activeCode={selectedCode}
          thicknessMm={plateThicknessMm}
          language={language}
          autoAlertOnSelect={autoAlertOnDefectSelect}
          onToggleAutoAlert={setAutoAlertOnDefectSelect}
          onOpenModal={() => setIsToleranceModalOpen(true)}
          compact
        />
      )}

      {/* =====================================================================
          SIDE-BY-SIDE MERGED WORKSPACE:
          [1] OMNISCAN X3 MULTI-SCAN CHASSIS  +  [2] LIVE PAUT WORK & PHASED CONE SIMULATOR
         ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* ==================== [1] AUTHENTIC OMNISCAN X3 HARDWARE CHASSIS (7 Cols) ==================== */}
        <div className="xl:col-span-7 rounded-2xl border-2 border-slate-700 bg-[#0b1224] p-3.5 sm:p-4 shadow-2xl space-y-3">
          {/* OmniScan Top Hardware Connector & Layout Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px]">
            <div className="flex items-center gap-2.5">
              <span className="font-black text-amber-400 tracking-wider">OLYMPUS OmniScan X3</span>
              <span className="text-slate-400">128-PIN PA ●</span>
              <span className="text-cyan-400">
                SECTORIAL S-SCAN (40°-70°) · {apertureElements}E · FOCUS {focalDepthMm}mm
              </span>
            </div>

            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'abcs_quad', label: 'A+B+C+S' },
                  { id: 'asc_tri', label: 'A+S+C' },
                  { id: 'sscan_large', label: 'S-ZOOM' },
                ] as const
              ).map((ly) => (
                <button
                  key={ly.id}
                  type="button"
                  onClick={() => setLayoutMode(ly.id)}
                  className={`px-2 py-0.5 rounded border cursor-pointer ${
                    layoutMode === ly.id
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {ly.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsFrozen(!isFrozen)}
                className={`px-2 py-0.5 rounded border font-bold cursor-pointer ${
                  isFrozen ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                {isFrozen ? 'FROZEN' : 'FREEZE'}
              </button>
            </div>
          </div>

          {/* Multi-Panel OmniScan Screen + Right Scroll Wheel Console */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Multi-View Display Area (8 Cols) */}
            <div className="md:col-span-8 rounded-xl border-2 border-slate-800 bg-black p-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="tabular-nums">
                  LAW: {scanLawMode.toUpperCase()} · WD {wedgeDelayUs.toFixed(1)}µs · {isTcgCalibrated ? 'TCG ON' : 'TCG OFF'}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsWeldOverlayVisible(!isWeldOverlayVisible)}
                    className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                      isWeldOverlayVisible
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isAr ? 'شكل اللحام' : 'Weld Bevel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSkipMirror(!showSkipMirror)}
                    className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                      showSkipMirror
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isAr ? 'انعكاس 1T/2T' : '1T/2T Mirror'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSizingCaliper(!showSizingCaliper)}
                    className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                      showSizingCaliper
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    Δh Calipers
                  </button>
                </div>
              </div>

              {/* Interactive Weld Geometry Profile Bar inside PAUT Angular Graduation */}
              {isWeldOverlayVisible && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800/90 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 whitespace-nowrap shrink-0">
                      {isAr ? 'وصلة اللحام بالتدريج:' : 'Groove:'}
                    </span>
                    {(
                      [
                        { id: 'single_v', ar: 'V مفردة', en: 'Single-V' },
                        { id: 'double_v', ar: 'X مزدوجة', en: 'Double-V' },
                        { id: 'j_groove', ar: 'أنابيب U/J', en: 'U/J-Bevel' },
                      ] as const
                    ).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setWeldGrooveType(g.id)}
                        className={`px-1.5 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                          weldGrooveType === g.id
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {isAr ? g.ar : g.en}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 tabular-nums">
                    <span className="text-slate-400 whitespace-nowrap shrink-0">
                      {isAr ? 'شطف:' : 'Bevel:'}
                    </span>
                    {[25, 30, 37.5].map((ang) => (
                      <button
                        key={ang}
                        type="button"
                        onClick={() => setBevelAngleDeg(ang)}
                        className={`px-1.5 py-0.5 rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                          bevelAngleDeg === ang
                            ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {ang}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Sectorial S-Scan with Multi-Leg Weld Bevel Overlay */}
              <canvas
                ref={sScanCanvasRef}
                width={600}
                height={280}
                className={`w-full ${layoutMode === 'sscan_large' ? 'h-72' : 'h-56'} rounded-lg bg-slate-950 border border-slate-800 select-none cursor-crosshair`}
              />

              {/* Synchronized A-Scan + Side B-Scan Row */}
              {layoutMode !== 'sscan_large' && (
                <div className={`grid ${layoutMode === 'abcs_quad' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <canvas
                    ref={aScanCanvasRef}
                    width={280}
                    height={95}
                    className="w-full h-24 rounded-lg bg-slate-950 border border-slate-800 select-none"
                  />
                  {layoutMode === 'abcs_quad' && (
                    <canvas
                      ref={bScanCanvasRef}
                      width={280}
                      height={95}
                      className="w-full h-24 rounded-lg bg-slate-950 border border-slate-800 select-none"
                    />
                  )}
                </div>
              )}

              {/* Encoded Top C-Scan Strip */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9.5px] font-mono text-slate-400 tabular-nums">
                  <span>TOP C-SCAN PLANAR MAP (0..100mm)</span>
                  <span className="text-cyan-400">ENC Y = {encoderYmm} mm</span>
                </div>
                <canvas
                  ref={cScanCanvasRef}
                  width={540}
                  height={42}
                  className="w-full h-10 rounded-lg bg-slate-950 border border-slate-800 select-none"
                />
              </div>
            </div>

            {/* Right Tactile OmniScan Wheel & Focal Law Keypad (4 Cols) */}
            <div className="md:col-span-4 rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between space-y-2.5 font-mono text-xs">
              {/* Gain & Scroll Wheel */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">PA GAIN:</span>
                  <span className="text-amber-400 font-black tabular-nums">{gainDb.toFixed(1)} dB</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {[-6, -1, 1, 6].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => setGainDb((prev) => Math.min(80, Math.max(20, prev + delta)))}
                      className="py-1 rounded bg-slate-900 border border-slate-700 hover:border-amber-400 text-white font-bold cursor-pointer tabular-nums"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Beam Angle Scrub */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span>CURSOR ANGLE:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{selectedAngleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="70"
                  value={selectedAngleDeg}
                  onChange={(e) => setSelectedAngleDeg(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Focal Law Configuration */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-[10px]">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setScanLawMode('sectorial')}
                    className={`py-1 rounded border cursor-pointer ${
                      scanLawMode === 'sectorial' ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    S-SCAN
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanLawMode('linear')}
                    className={`py-1 rounded border cursor-pointer ${
                      scanLawMode === 'linear' ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    E-SCAN
                  </button>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">APERTURE ELEMENTS:</div>
                  <div className="grid grid-cols-3 gap-1">
                    {([16, 32, 64] as const).map((el) => (
                      <button
                        key={el}
                        type="button"
                        onClick={() => setApertureElements(el)}
                        className={`py-1 rounded border cursor-pointer ${
                          apertureElements === el ? 'bg-amber-500 text-slate-950 font-bold border-amber-300' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {el}E
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 tabular-nums">
                    <span>Focus: {focalDepthMm}mm</span>
                    <span>El #{startElement}</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="40"
                    value={focalDepthMm}
                    onChange={(e) => setFocalDepthMm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max={Math.max(1, 65 - apertureElements)}
                    value={startElement}
                    onChange={(e) => setStartElement(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsTcgCalibrated(!isTcgCalibrated)}
                  className={`w-full py-1.5 rounded border font-bold cursor-pointer ${
                    isTcgCalibrated ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {isTcgCalibrated ? 'ACG + TCG ACTIVE ✓' : 'CALIBRATE TCG'}
                </button>
              </div>

              {/* Calipers U1 / U2 */}
              {showSizingCaliper && (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[10px] tabular-nums">
                  <div className="flex justify-between text-cyan-400 font-bold">
                    <span>HEIGHT Δh:</span>
                    <span>{measuredFlawHeightMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="22"
                    step="0.5"
                    value={caliperY1Mm}
                    onChange={(e) => setCaliperY1Mm(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="22"
                    step="0.5"
                    value={caliperY2Mm}
                    onChange={(e) => setCaliperY2Mm(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== [2] SIDE-BY-SIDE PAUT PHYSICAL WORK & BEAM CONE SIMULATOR (5 Cols) ==================== */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>
                {isAr
                  ? 'محاكي العمل المدمج وكوم الأشعة الطوري الممركز:'
                  : 'Live PAUT Specimen & Focused Beam Cone:'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowPhasedCone(!showPhasedCone)}
              className={`px-2.5 py-0.5 rounded border font-mono text-[10px] cursor-pointer ${
                showPhasedCone ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isAr ? 'كوم الأشعة البؤري' : 'Focal Cone'}
            </button>
          </div>

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

          {/* Probe Standoff X + Encoder Wheel Y Sliders */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                <span>{isAr ? 'مسافة الويدج X:' : 'Index Offset X:'}</span>
                <span className="text-cyan-400 font-bold tabular-nums">{probeIndexOffsetMm} mm</span>
              </div>
              <input
                type="range"
                min="18"
                max="58"
                value={probeIndexOffsetMm}
                onChange={(e) => setProbeIndexOffsetMm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                <span>{isAr ? 'عجلة الترميز Encoder Y:' : 'Wheel Encoder Y:'}</span>
                <span className="text-amber-400 font-bold tabular-nums">{encoderYmm} mm</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={encoderYmm}
                onChange={(e) => setEncoderYmm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {specimenGeometry === 'curved' && (
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400">{isAr ? 'قطر الأنبوب الخارجي OD:' : 'Curved Pipe OD:'}</span>
              <div className="flex gap-1">
                {[114, 219, 324].map((od) => (
                  <button
                    key={od}
                    type="button"
                    onClick={() => setPipeOdMm(od)}
                    className={`px-2 py-0.5 rounded border cursor-pointer ${
                      pipeOdMm === od ? 'bg-emerald-600 text-white border-emerald-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {od}mm
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation Notes + PAUT Near-Field & Per-Defect Code Tolerance + Log to Training Results */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-slate-800 font-mono text-[10.5px] tabular-nums">
              <span className="text-purple-300 font-bold">
                {isAr
                  ? `المجال القريب للمصفوفة (${apertureElements}E): N = A²/4λ = ${coneMetrics.nearFieldLengthMm.toFixed(1)}مم`
                  : `PAUT Array Near Field (${apertureElements}E): N = A²/4λ = ${coneMetrics.nearFieldLengthMm.toFixed(1)}mm`}
              </span>
              <span className="text-amber-300">
                {isAr ? `البؤرة F=${focalDepthMm}مم ≤ N` : `Focus F=${focalDepthMm}mm`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 font-mono text-[9.5px]">
              {INSPECTION_CODES_META.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCode(c.id)}
                  className={`px-1.5 py-0.5 rounded border cursor-pointer ${
                    selectedCode === c.id
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {c.shortLabel}
                </button>
              ))}
            </div>

            {activeDefectTolerance && (
              <div className="flex items-center justify-between gap-2 font-mono text-[10.5px] tabular-nums bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">{isAr ? 'سماحية الكود لهذا العيب:' : 'Code Tolerance:'}</span>
                <span className={`font-bold ${activeDefectTolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {activeDefectTolerance.toleranceBadge[language]}
                </span>
              </div>
            )}

            <div className="text-cyan-400 font-bold flex items-center gap-1.5 font-mono text-[11px]">
              <Info className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحليل البصمة الصوتية:' : 'Acoustic Signature Analysis:'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{currentFlaw.reason[language]}</p>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono">
              <div className="flex gap-1">
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
                onClick={handleLogPautInspection}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1.5"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل نتيجة PAUT بالتدريب' : 'Log PAUT Result'}</span>
              </button>
            </div>

            {logFeedbackMsg && (
              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{logFeedbackMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeFlawTarget !== 'sound_weld' && catalogMatch && (
        <DefectToleranceModal
          isOpen={isToleranceModalOpen}
          onClose={() => setIsToleranceModalOpen(false)}
          defectId={catalogMatch.id}
          activeCode={selectedCode}
          onSelectCode={setSelectedCode}
          thicknessMm={plateThicknessMm}
          measuredDimensions={{
            lengthMm: currentFlaw.lengthMm,
            heightMm: currentFlaw.heightMm,
          }}
          language={language}
          autoAlertOnSelect={autoAlertOnDefectSelect}
          onToggleAutoAlert={setAutoAlertOnDefectSelect}
        />
      )}
    </div>
  );
};
