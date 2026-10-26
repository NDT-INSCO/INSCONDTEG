import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../../types';
import {
  ALL_WELD_DEFECTS_CATALOG,
  ComprehensiveDefectSpec,
  DefectFamily,
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
import { NdtAudioControlChip } from './NdtAudioControlChip';
import { DiscoveredDefectsLogTable } from './DiscoveredDefectsLogTable';
import { DefectFrequencyD3Chart } from './DefectFrequencyD3Chart';
import {
  playCalibrationClick,
  playDefectDetectedPing,
  playProbeScanTick,
} from '../../../utils/ndtAudioFeedback';
import {
  DiscoveredDefectEntry,
  deriveDefectSeverity,
  entryTo3DWireframeSpec,
  logDiscoveredDefect,
  useDiscoveredDefectsLog,
} from '../../../utils/discoveredDefectsStore';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Compass,
  Crosshair,
  Eye,
  Layers,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
} from 'lucide-react';

interface BeamConeAndDefectExplorerProps {
  language: Language;
  selectedDefectId?: ExtendedWeldFlawId;
  onSelectDefectForLiveSim?: (defectId: ExtendedWeldFlawId) => void;
}

export const BeamConeAndDefectExplorer: React.FC<BeamConeAndDefectExplorerProps> = ({
  language,
  selectedDefectId = 'lack_of_fusion',
  onSelectDefectForLiveSim,
}) => {
  const isAr = language === 'ar';

  const [activeFamily, setActiveFamily] = useState<'all' | DefectFamily>('all');
  const [activeDefectId, setActiveDefectId] = useState<ExtendedWeldFlawId>(selectedDefectId);

  // Beam Cone ("كوم الأشعة") & Near-Field Interactive Physics Controls
  const [beamMode, setBeamMode] = useState<'ut_single' | 'paut_focused'>('ut_single');
  const [probeAngleDeg, setProbeAngleDeg] = useState<number>(60);
  const [frequencyMhz, setFrequencyMhz] = useState<number>(4.0);
  const [crystalDiameterMm, setCrystalDiameterMm] = useState<number>(10);
  const [wedgeTravelMm, setWedgeTravelMm] = useState<number>(10);
  const [pautElements, setPautElements] = useState<16 | 32 | 64>(32);
  const [pautFocusMm, setPautFocusMm] = useState<number>(22);
  const [probeStandoffMm, setProbeStandoffMm] = useState<number>(36);
  const [plateThicknessMm, setPlateThicknessMm] = useState<number>(25);
  const [selectedCode, setSelectedCode] = useState<InspectionCodeId>('asme_viii');
  const [isToleranceModalOpen, setIsToleranceModalOpen] = useState<boolean>(false);
  const [autoAlertOnDefectSelect, setAutoAlertOnDefectSelect] = useState<boolean>(true);

  // Visual Imagination Layers
  const [showNearField, setShowNearField] = useState<boolean>(true);
  const [showOuter20dBCone, setShowOuter20dBCone] = useState<boolean>(true);
  const [showSideLobes, setShowSideLobes] = useState<boolean>(true);
  const [showWavefronts, setShowWavefronts] = useState<boolean>(true);
  const [showDefectWireframe, setShowDefectWireframe] = useState<boolean>(true);
  const { entries: loggedDefects } = useDiscoveredDefectsLog();

  // Interactive 3D Isometric Camera Orbit Angles
  const [yawDeg, setYawDeg] = useState<number>(-32);
  const [pitchDeg, setPitchDeg] = useState<number>(24);
  const [isDragging3D, setIsDragging3D] = useState<boolean>(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCrossRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setActiveDefectId(selectedDefectId);
  }, [selectedDefectId]);

  const currentDefect: ComprehensiveDefectSpec =
    ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === activeDefectId) || ALL_WELD_DEFECTS_CATALOG[0];

  const filteredDefects =
    activeFamily === 'all'
      ? ALL_WELD_DEFECTS_CATALOG
      : ALL_WELD_DEFECTS_CATALOG.filter((d) => d.family === activeFamily);

  const velocityMs = probeAngleDeg === 0 ? 5920 : 3240;
  const coneMetrics = computeUltrasonicBeamCone({
    frequencyMhz,
    velocityMs,
    crystalDiameterMm,
    isPaut: beamMode === 'paut_focused',
    pautApertureElements: pautElements,
    pautPitchMm: 0.6,
    pautFocalDepthMm: pautFocusMm,
    wedgeTravelMm: probeAngleDeg === 0 ? 0 : wedgeTravelMm,
    wedgeVelocityMs: 2330,
  });

  const flawDepthMm = Number((currentDefect.nominalDepthRatio * plateThicknessMm).toFixed(1));
  const rad = (probeAngleDeg * Math.PI) / 180;
  const cosT = Math.max(0.12, Math.cos(rad));
  const tanT = Math.sin(rad) / cosT;
  const halfSkipMm = probeAngleDeg === 0 ? 0 : plateThicknessMm * tanT;

  // Check if cone intersects defect
  const rayXAtFlaw =
    probeAngleDeg === 0 ? probeStandoffMm : probeStandoffMm - flawDepthMm * tanT;
  const rayXLeg2AtFlaw =
    probeAngleDeg === 0
      ? probeStandoffMm
      : probeStandoffMm - halfSkipMm - (plateThicknessMm - flawDepthMm) * tanT;
  const coneRadius6dB = coneMetrics.width6dBAtDepthMm(flawDepthMm / cosT) / 2;
  const coneRadius20dB = coneMetrics.width20dBAtDepthMm(flawDepthMm / cosT) / 2;
  const minDistToAxis = Math.min(
    Math.abs(rayXAtFlaw - currentDefect.distanceFromWeldCenterMm),
    probeAngleDeg > 0 ? Math.abs(rayXLeg2AtFlaw - currentDefect.distanceFromWeldCenterMm) : 999
  );
  const isIn6dBCore = minDistToAxis <= Math.max(3.5, coneRadius6dB);
  const isIn20dBEdge = !isIn6dBCore && minDistToAxis <= Math.max(6.5, coneRadius20dB);
  const approxFlawSoundPathMm = Math.max(2, flawDepthMm / cosT);
  const nearFieldZoneCheck = coneMetrics.evaluateNearFieldZone(approxFlawSoundPathMm);
  const currentDefectTolerance = getDefectCodeTolerance(currentDefect.id, selectedCode, plateThicknessMm);
  const activeCodeMeta =
    INSPECTION_CODES_META.find((c) => c.id === selectedCode) || INSPECTION_CODES_META[0];

  // Auto-log 3D volumetric defect discovery when user sweeps probe into -6 dB core intersection
  // (Skipped on very first mount so passive opening doesn't pollute user's inspection log until interaction/hit)
  const hasInteracted3DRef = useRef<boolean>(false);
  const prevCoreHitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasInteracted3DRef.current) return;
    const hitKey = `${currentDefect.id}:${plateThicknessMm}:${beamMode}`;
    if (isIn6dBCore) {
      const severity = deriveDefectSeverity(currentDefect.category, currentDefect.id);
      const estSignalPct = Number(
        Math.min(99, Math.max(62, 82 * currentDefect.reflectivityFactor)).toFixed(1)
      );
      const { isNewDiscovery } = logDiscoveredDefect({
        defectKey: `3d_cone_lab:${currentDefect.id}:t${plateThicknessMm}`,
        catalogDefectId: currentDefect.id,
        codeSymbol: currentDefect.codeSymbol,
        type: currentDefect.name,
        morphology: currentDefect.category,
        method: beamMode === 'paut_focused' ? 'PAUT 3D' : 'UT 3D',
        sourceLab: {
          ar: 'مختبر كوم الأشعة ثلاثي الأبعاد (3D Beam Cone)',
          en: '3D Volumetric Beam Cone Lab',
        },
        location: {
          zone: currentDefect.locationZone,
          xMm: currentDefect.distanceFromWeldCenterMm,
          yMm: currentDefect.centerYmm,
          depthZMm: flawDepthMm,
          soundPathOrAngle: `S=${approxFlawSoundPathMm.toFixed(1)}mm @ ${probeAngleDeg}°`,
        },
        sizing: {
          calculatedDepthMm: flawDepthMm,
          calculatedLengthMm: Number(currentDefect.lengthMm.toFixed(1)),
          heightMm: Number(currentDefect.heightMm.toFixed(1)),
          transverseWidthMm: currentDefect.category === 'Volumetric' ? 3.2 : 2.0,
          soundPathMm: Number(approxFlawSoundPathMm.toFixed(1)),
          sizingMethod: beamMode === 'paut_focused' ? 'PAUT Focal -6 dB Sizing' : 'UT -6 dB Drop Sizing',
        },
        severity,
        peakSignalPct: estSignalPct,
      });

      if (isNewDiscovery || prevCoreHitKeyRef.current !== hitKey) {
        playDefectDetectedPing(severity);
      }
      prevCoreHitKeyRef.current = hitKey;
    } else {
      prevCoreHitKeyRef.current = null;
    }
  }, [
    isIn6dBCore,
    currentDefect,
    plateThicknessMm,
    beamMode,
    flawDepthMm,
    approxFlawSoundPathMm,
    probeAngleDeg,
  ]);

  const aimConeDirectlyAtDefect = (def: ComprehensiveDefectSpec) => {
    hasInteracted3DRef.current = true;
    setActiveDefectId(def.id);
    setProbeAngleDeg(def.optimalAngleDeg);
    const targetX =
      def.optimalAngleDeg === 0
        ? def.distanceFromWeldCenterMm
        : Math.round(
            def.distanceFromWeldCenterMm +
              def.nominalDepthRatio *
                plateThicknessMm *
                Math.tan((def.optimalAngleDeg * Math.PI) / 180)
          );
    setProbeStandoffMm(Math.max(0, Math.min(70, targetX)));
  };

  const handleFocusLogged3DDefect = (entry: DiscoveredDefectEntry) => {
    if (entry.catalogDefectId) {
      const targetDef = ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === entry.catalogDefectId);
      if (targetDef) {
        aimConeDirectlyAtDefect(targetDef);
      }
    }
  };

  // Collect active + logged 3D weld specimen wireframe overlays for this specimen
  const coneSpecimenWireframeOverlays = React.useMemo(() => {
    const list = [];
    if (isIn6dBCore || isIn20dBEdge) {
      list.push({
        id: `live-cone-${currentDefect.id}`,
        codeSymbol: currentDefect.codeSymbol,
        label: currentDefect.name,
        severity: deriveDefectSeverity(currentDefect.category, currentDefect.id),
        morphology: currentDefect.category,
        xMm: currentDefect.distanceFromWeldCenterMm,
        yMm: currentDefect.centerYmm,
        calculatedDepthMm: flawDepthMm,
        calculatedLengthMm: Number(currentDefect.lengthMm.toFixed(1)),
        heightMm: Number(currentDefect.heightMm.toFixed(1)),
        transverseWidthMm: currentDefect.category === 'Volumetric' ? 3.2 : 2.0,
        isLiveActive: true,
      });
    }
    for (const item of loggedDefects) {
      if (item.method === 'UT 3D' || item.method === 'PAUT 3D') {
        if (
          list.some(
            (ex) =>
              ex.codeSymbol === item.codeSymbol &&
              Math.abs(ex.xMm - item.location.xMm) < 1.5 &&
              Math.abs(ex.calculatedDepthMm - item.location.depthZMm) < 2
          )
        ) {
          continue;
        }
        list.push(entryTo3DWireframeSpec(item, false));
      }
    }
    return list;
  }, [isIn6dBCore, isIn20dBEdge, currentDefect, flawDepthMm, loggedDefects]);

  // ---------------------------------------------------------------------------
  // 1. Render 3D Spatial Volumetric "كوم الأشعة" & 3D Weld Groove Projection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#040814';
    ctx.fillRect(0, 0, w, h);

    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;
    const scale3D = 3.55;
    const cx = w * 0.50;
    const cy = h * 0.54;

    // 3D world (x: transverse mm, y: weld seam mm [-40..40], z: depth mm [0..-25])
    const project = (x: number, y: number, z: number): [number, number] => {
      const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
      const ry = x * Math.sin(yaw) + y * Math.cos(yaw);
      const screenX = cx + rx * scale3D;
      const screenY = cy - z * Math.cos(pitch) * scale3D + ry * Math.sin(pitch) * scale3D * 0.72;
      return [screenX, screenY];
    };

    // Draw 3D Wireframe Steel Specimen Block (-55..+65 in X, -36..+36 in Y, 0..-25 in Z)
    const drawPoly3D = (
      pts: Array<[number, number, number]>,
      stroke: string,
      fill?: string,
      lineW = 1.2,
      dashed = false
    ) => {
      ctx.save();
      if (dashed) ctx.setLineDash([4, 3]);
      ctx.beginPath();
      pts.forEach(([px, py, pz], idx) => {
        const [sx, sy] = project(px, py, pz);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineW;
      ctx.stroke();
      ctx.restore();
    };

    // Bottom plate face
    drawPoly3D(
      [
        [-52, -34, -plateThicknessMm],
        [62, -34, -plateThicknessMm],
        [62, 34, -plateThicknessMm],
        [-52, 34, -plateThicknessMm],
      ],
      'rgba(51, 65, 85, 0.85)',
      'rgba(15, 23, 42, 0.65)'
    );

    // Top plate face
    drawPoly3D(
      [
        [-52, -34, 0],
        [62, -34, 0],
        [62, 34, 0],
        [-52, 34, 0],
      ],
      'rgba(71, 85, 105, 0.9)',
      'rgba(30, 41, 59, 0.32)'
    );

    // Front cross-section face
    drawPoly3D(
      [
        [-52, 34, 0],
        [62, 34, 0],
        [62, 34, -plateThicknessMm],
        [-52, 34, -plateThicknessMm],
      ],
      '#334155',
      'rgba(15, 23, 42, 0.25)'
    );

    // 3D V-Groove Weld Prism along Y (-34..+34)
    for (const yPlane of [-34, 0, 34]) {
      drawPoly3D(
        [
          [-9, yPlane, 0],
          [9, yPlane, 0],
          [1.6, yPlane, -plateThicknessMm],
          [-1.6, yPlane, -plateThicknessMm],
        ],
        yPlane === 34 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(245, 158, 11, 0.28)',
        yPlane === 34 ? 'rgba(245, 158, 11, 0.10)' : undefined
      );
    }
    // Weld top cap edges
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.lineWidth = 1.3;
    for (const xEdge of [-9, 9]) {
      const [x1, y1] = project(xEdge, -34, 0);
      const [x2, y2] = project(xEdge, 34, 0);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw 3D Volumetric Defect inside the Weld!
    const defX = currentDefect.distanceFromWeldCenterMm;
    const defZ = -flawDepthMm;
    const halfDefL = Math.min(24, currentDefect.lengthMm * 0.75);
    const halfDefH = Math.max(1.2, currentDefect.heightMm * 0.55);
    const defColor =
      currentDefect.category === 'Planar' ? 'rgba(239, 68, 68, 0.88)' : 'rgba(245, 158, 11, 0.85)';

    if (currentDefect.id === 'porosity_cluster' || currentDefect.id === 'isolated_pore' || currentDefect.id === 'tungsten_inclusion') {
      const count = currentDefect.id === 'porosity_cluster' ? 6 : 1;
      for (let p = 0; p < count; p++) {
        const py = count === 1 ? 0 : (p - 2.5) * 2.6;
        const px = defX + (p % 2 === 0 ? 0.6 : -0.6);
        const pz = defZ + (p % 3 - 1) * 0.8;
        const [sx, sy] = project(px, py, pz);
        ctx.fillStyle = currentDefect.id === 'tungsten_inclusion' ? '#f8fafc' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(sx, sy, currentDefect.id === 'isolated_pore' ? 5.5 : 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (currentDefect.id === 'base_lamination') {
      drawPoly3D(
        [
          [defX - 10, -halfDefL, defZ],
          [defX + 10, -halfDefL, defZ],
          [defX + 10, halfDefL, defZ],
          [defX - 10, halfDefL, defZ],
        ],
        '#f43f5e',
        'rgba(244, 63, 94, 0.45)',
        2
      );
    } else if (currentDefect.id === 'transverse_crack') {
      // Transverse crack perpendicular to weld seam (lies in X-Z plane at Y=0)
      drawPoly3D(
        [
          [defX - 5, 0, defZ + halfDefH],
          [defX + 5, 0, defZ + halfDefH],
          [defX + 4, 0, defZ - halfDefH],
          [defX - 4, 0, defZ - halfDefH],
        ],
        '#ef4444',
        'rgba(239, 68, 68, 0.55)',
        2.2
      );
    } else {
      // Longitudinal 3D ribbon / volumetric stringer along Y
      const tiltX = currentDefect.id === 'lack_of_fusion' ? 1.8 : 0.4;
      drawPoly3D(
        [
          [defX - tiltX, -halfDefL, defZ + halfDefH],
          [defX - tiltX, halfDefL, defZ + halfDefH],
          [defX + tiltX, halfDefL, defZ - halfDefH],
          [defX + tiltX, -halfDefL, defZ - halfDefH],
        ],
        isIn6dBCore ? '#ffffff' : defColor,
        isIn6dBCore ? 'rgba(239, 68, 68, 0.78)' : 'rgba(239, 68, 68, 0.42)',
        isIn6dBCore ? 2.4 : 1.6
      );
    }

    // -------------------------------------------------------------------------
    // Draw 3D Ultrasonic Radiation Cone ("كوم الأشعة ثلاثي الأبعاد")
    // -------------------------------------------------------------------------
    const probeX = probeStandoffMm;
    // Draw 3D Transducer Wedge on top surface Z = 0
    drawPoly3D(
      [
        [probeX - 3, -7, 0],
        [probeX + 12, -7, 0],
        [probeX + 12, 7, 0],
        [probeX - 3, 7, 0],
      ],
      beamMode === 'paut_focused' ? '#f59e0b' : '#38bdf8',
      beamMode === 'paut_focused' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.35)',
      1.8
    );
    drawPoly3D(
      [
        [probeX - 1, -6, 6],
        [probeX + 11, -6, 8],
        [probeX + 11, 6, 8],
        [probeX - 1, 6, 6],
      ],
      beamMode === 'paut_focused' ? '#fbbf24' : '#7dd3fc',
      'rgba(15, 23, 42, 0.75)',
      1.4
    );

    // Sample 3D Elliptical Cross-Section Rings along the Acoustic Cone Axis!
    const totalSoundPathMm = probeAngleDeg === 0 ? plateThicknessMm : (plateThicknessMm / cosT) * 1.65;
    const numSlices = 9;
    const prevRing6: Array<[number, number]> = [];
    const prevRing20: Array<[number, number]> = [];

    const get3DConeCenter = (sMm: number): [number, number, number] => {
      if (probeAngleDeg === 0) {
        return [probeX, 0, -Math.min(plateThicknessMm, sMm)];
      }
      const leg1MaxS = plateThicknessMm / cosT;
      if (sMm <= leg1MaxS) {
        return [probeX - sMm * Math.sin(rad), 0, -sMm * cosT];
      }
      const remS = sMm - leg1MaxS;
      return [
        probeX - halfSkipMm - remS * Math.sin(rad),
        0,
        -plateThicknessMm + remS * cosT,
      ];
    };

    const ringSegments = 16;
    const rings6Screen: Array<Array<[number, number]>> = [];
    const rings20Screen: Array<Array<[number, number]>> = [];

    for (let sIdx = 0; sIdx <= numSlices; sIdx++) {
      const sMm = (sIdx / numSlices) * totalSoundPathMm;
      const [cx3, cy3, cz3] = get3DConeCenter(sMm);
      const r6 = coneMetrics.width6dBAtDepthMm(sMm) / 2;
      const r20 = coneMetrics.width20dBAtDepthMm(sMm) / 2;

      const cur6: Array<[number, number]> = [];
      const cur20: Array<[number, number]> = [];

      for (let k = 0; k <= ringSegments; k++) {
        const phi = (k / ringSegments) * Math.PI * 2;
        // Cone cross-section expands in both transverse X/Z and lateral Y!
        const ox6 = Math.cos(phi) * r6 * cosT;
        const oy6 = Math.sin(phi) * r6;
        const oz6 = Math.cos(phi) * r6 * Math.sin(rad) * 0.55;
        cur6.push(project(cx3 + ox6, cy3 + oy6, Math.min(0, Math.max(-plateThicknessMm, cz3 + oz6))));

        const ox20 = Math.cos(phi) * r20 * cosT;
        const oy20 = Math.sin(phi) * r20;
        const oz20 = Math.cos(phi) * r20 * Math.sin(rad) * 0.55;
        cur20.push(project(cx3 + ox20, cy3 + oy20, Math.min(0, Math.max(-plateThicknessMm, cz3 + oz20))));
      }
      rings6Screen.push(cur6);
      rings20Screen.push(cur20);
    }

    // Draw -20 dB Outer Volumetric Cone Wire-Mesh
    if (showOuter20dBCone) {
      ctx.strokeStyle = beamMode === 'paut_focused' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1;
      rings20Screen.forEach((ring) => {
        ctx.beginPath();
        ring.forEach(([sx, sy], i) => (i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)));
        ctx.stroke();
      });
      for (let k = 0; k < ringSegments; k += 4) {
        ctx.beginPath();
        rings20Screen.forEach((ring, i) =>
          i === 0 ? ctx.moveTo(ring[k][0], ring[k][1]) : ctx.lineTo(ring[k][0], ring[k][1])
        );
        ctx.stroke();
      }
    }

    // Draw -6 dB Core Volumetric Cone Rings & Fresnel Near-Field Zone Slices
    const effectiveNf3D =
      coneMetrics.effectiveNearFieldInSpecimenMm > 0
        ? coneMetrics.effectiveNearFieldInSpecimenMm
        : coneMetrics.nearFieldLengthMm;
    rings6Screen.forEach((ring, idx) => {
      const sMm = (idx / numSlices) * totalSoundPathMm;
      const isInsideNearField = showNearField && sMm <= effectiveNf3D;
      const isNearFieldBoundary =
        showNearField && Math.abs(sMm - effectiveNf3D) <= totalSoundPathMm / (numSlices * 1.4);
      ctx.strokeStyle = isNearFieldBoundary
        ? '#e879f9'
        : isInsideNearField
        ? '#c084fc'
        : isIn6dBCore
        ? 'rgba(248, 113, 113, 0.85)'
        : beamMode === 'paut_focused'
        ? 'rgba(251, 191, 36, 0.72)'
        : 'rgba(34, 211, 238, 0.72)';
      ctx.fillStyle = isInsideNearField
        ? 'rgba(168, 85, 247, 0.22)'
        : beamMode === 'paut_focused'
        ? 'rgba(245, 158, 11, 0.11)'
        : 'rgba(6, 182, 212, 0.11)';
      ctx.lineWidth = isNearFieldBoundary ? 2.4 : isInsideNearField ? 1.8 : 1.3;
      ctx.beginPath();
      ring.forEach(([sx, sy], i) => (i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)));
      ctx.fill();
      ctx.stroke();
    });

    if (showNearField && effectiveNf3D > 1 && effectiveNf3D <= totalSoundPathMm) {
      const [nfx, nfy, nfz] = get3DConeCenter(effectiveNf3D);
      const [nsx, nsy] = project(nfx, nfy, nfz);
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 9.5px monospace';
      ctx.fillText(`NF=${effectiveNf3D.toFixed(1)}mm → Far Field`, nsx + 8, nsy - 6);
    }

    for (let k = 0; k < ringSegments; k += 2) {
      ctx.strokeStyle = beamMode === 'paut_focused' ? 'rgba(251, 191, 36, 0.42)' : 'rgba(56, 189, 248, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      rings6Screen.forEach((ring, i) =>
        i === 0 ? ctx.moveTo(ring[k][0], ring[k][1]) : ctx.lineTo(ring[k][0], ring[k][1])
      );
      ctx.stroke();
    }

    // Side-Lobes (فصوص جانبية ثانوية قرب مخرج البروب)
    if (showSideLobes) {
      for (const sideSign of [-1, 1]) {
        const [p0x, p0y] = project(probeX, 0, 0);
        const [p1x, p1y] = project(probeX - 4 * Math.sin(rad), sideSign * 8.5, -5.5);
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.quadraticCurveTo((p0x + p1x) / 2, (p0y + p1y) / 2 + 4, p1x, p1y);
        ctx.stroke();
      }
    }

    // Central Acoustic Axis Spine
    ctx.strokeStyle = isIn6dBCore ? '#ef4444' : '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let sIdx = 0; sIdx <= numSlices; sIdx++) {
      const sMm = (sIdx / numSlices) * totalSoundPathMm;
      const [cx3, cy3, cz3] = get3DConeCenter(sMm);
      const [sx, sy] = project(cx3, cy3, cz3);
      if (sIdx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // -------------------------------------------------------------------------
    // 3D Detected Defect Wireframe Overlays + Exact Depth (Z) & Length (L) Calipers
    // -------------------------------------------------------------------------
    if (showDefectWireframe && coneSpecimenWireframeOverlays.length > 0) {
      coneSpecimenWireframeOverlays.slice(0, 4).forEach((wf, wfIdx) => {
        const wx = wf.xMm;
        const wyCenter = Math.max(-26, Math.min(26, (wf.yMm - 50) * 0.65));
        const wzDepth = -Math.max(0, Math.min(plateThicknessMm, wf.calculatedDepthMm));
        const halfLen3D = Math.max(2.5, Math.min(24, wf.calculatedLengthMm * 0.5));
        const halfW3D = Math.max(1.2, wf.transverseWidthMm * 0.55);
        const halfH3D = Math.max(1.1, wf.heightMm * 0.5);
        const zCenterBox = Math.min(-halfH3D, Math.max(-plateThicknessMm + halfH3D, wzDepth));

        const strokeCol = wf.isLiveActive
          ? '#22d3ee'
          : wf.severity === 'Critical'
          ? '#f87171'
          : '#fbbf24';

        // 12-edge 3D wireframe bounding box corners
        const topCorners: Array<[number, number, number]> = [
          [wx - halfW3D, wyCenter - halfLen3D, zCenterBox + halfH3D],
          [wx + halfW3D, wyCenter - halfLen3D, zCenterBox + halfH3D],
          [wx + halfW3D, wyCenter + halfLen3D, zCenterBox + halfH3D],
          [wx - halfW3D, wyCenter + halfLen3D, zCenterBox + halfH3D],
        ];
        const botCorners: Array<[number, number, number]> = [
          [wx - halfW3D, wyCenter - halfLen3D, zCenterBox - halfH3D],
          [wx + halfW3D, wyCenter - halfLen3D, zCenterBox - halfH3D],
          [wx + halfW3D, wyCenter + halfLen3D, zCenterBox - halfH3D],
          [wx - halfW3D, wyCenter + halfLen3D, zCenterBox - halfH3D],
        ];

        drawPoly3D(topCorners, strokeCol, undefined, wf.isLiveActive ? 1.8 : 1.3);
        drawPoly3D(botCorners, strokeCol, undefined, wf.isLiveActive ? 1.8 : 1.3);
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = wf.isLiveActive ? 1.6 : 1.2;
        for (let c = 0; c < 4; c++) {
          const [tx, ty] = project(...topCorners[c]);
          const [bx, by] = project(...botCorners[c]);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        ctx.restore();

        // Top-Surface Datum Footprint at Z = 0 + dashed drop-line
        const surfFootprint: Array<[number, number, number]> = [
          [wx - halfW3D, wyCenter - halfLen3D, 0],
          [wx + halfW3D, wyCenter - halfLen3D, 0],
          [wx + halfW3D, wyCenter + halfLen3D, 0],
          [wx - halfW3D, wyCenter + halfLen3D, 0],
        ];
        drawPoly3D(surfFootprint, 'rgba(34, 211, 238, 0.55)', undefined, 1.0, true);

        // 3D Depth (Z) & Length (L) Calipers for primary / live detected defect
        if (wfIdx === 0) {
          const calX = wx - halfW3D - 4.5;
          const [zTopSx, zTopSy] = project(calX, wyCenter, 0);
          const [zBotSx, zBotSy] = project(calX, wyCenter, wzDepth);
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(zTopSx - 4, zTopSy);
          ctx.lineTo(zTopSx + 4, zTopSy);
          ctx.moveTo(zTopSx, zTopSy);
          ctx.lineTo(zBotSx, zBotSy);
          ctx.moveTo(zBotSx - 4, zBotSy);
          ctx.lineTo(zBotSx + 4, zBotSy);
          ctx.stroke();

          // Longitudinal Length L Caliper along seam axis Y
          const [lStartSx, lStartSy] = project(wx, wyCenter - halfLen3D, zCenterBox - halfH3D - 1.6);
          const [lEndSx, lEndSy] = project(wx, wyCenter + halfLen3D, zCenterBox - halfH3D - 1.6);
          ctx.strokeStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(lStartSx, lStartSy - 4);
          ctx.lineTo(lStartSx, lStartSy + 4);
          ctx.moveTo(lStartSx, lStartSy);
          ctx.lineTo(lEndSx, lEndSy);
          ctx.moveTo(lEndSx, lEndSy - 4);
          ctx.lineTo(lEndSx, lEndSy + 4);
          ctx.stroke();

          // Callout label box directly on 3D specimen
          const labelX = Math.max(12, Math.min(w - 205, zBotSx - 150));
          const labelY = Math.max(30, Math.min(h - 36, (zTopSy + zBotSy) / 2 - 14));
          ctx.fillStyle = 'rgba(6, 10, 24, 0.92)';
          ctx.strokeStyle = strokeCol;
          ctx.lineWidth = 1.2;
          ctx.fillRect(labelX, labelY, 192, 28);
          ctx.strokeRect(labelX, labelY, 192, 28);
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 9.5px monospace';
          ctx.fillText(
            `[${wf.codeSymbol}] Z=${wf.calculatedDepthMm.toFixed(1)}mm · L=${wf.calculatedLengthMm.toFixed(1)}mm`,
            labelX + 7,
            labelY + 17
          );
          ctx.restore();
        }
      });
    }

    // HUD Legend inside 3D Viewport
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(
      `3D VOLUMETRIC BEAM CONE ("كوم الأشعة") · N=${coneMetrics.nearFieldLengthMm.toFixed(1)}mm · γ(-6dB)=±${coneMetrics.halfAngleMinus6dBDeg.toFixed(1)}° · γ(-20dB)=±${coneMetrics.halfAngleMinus20dBDeg.toFixed(1)}°`,
      14,
      20
    );

    void prevRing6;
    void prevRing20;
  }, [
    yawDeg,
    pitchDeg,
    beamMode,
    probeAngleDeg,
    frequencyMhz,
    crystalDiameterMm,
    pautElements,
    pautFocusMm,
    probeStandoffMm,
    currentDefect,
    flawDepthMm,
    coneMetrics,
    cosT,
    rad,
    halfSkipMm,
    isIn6dBCore,
    showNearField,
    showOuter20dBCone,
    showSideLobes,
    showDefectWireframe,
    coneSpecimenWireframeOverlays,
    plateThicknessMm,
  ]);

  // ---------------------------------------------------------------------------
  // 2. Render Synchronized High-Precision 2D Cross-Section + Echo Envelope
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasCrossRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    const originX = w * 0.44;
    const topY = 46;
    const scale = 4.6;
    const bottomY = topY + plateThicknessMm * scale;

    // Parent Steel Plate
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.fillRect(18, topY, w - 36, plateThicknessMm * scale);
    ctx.strokeRect(18, topY, w - 36, plateThicknessMm * scale);

    // V-Groove Weld Overlay
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(originX - 9 * scale, topY);
    ctx.lineTo(originX + 9 * scale, topY);
    ctx.lineTo(originX + 1.6 * scale, bottomY);
    ctx.lineTo(originX - 1.6 * scale, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw Ultrasonic Beam Cone 2D
    const entryX = originX + probeStandoffMm * scale;
    const entryY = topY;
    const bounceX = probeAngleDeg === 0 ? entryX : entryX - halfSkipMm * scale;
    const bounceY = bottomY;
    const leg2EndX = probeAngleDeg === 0 ? undefined : bounceX - halfSkipMm * scale;
    const leg2EndY = probeAngleDeg === 0 ? undefined : topY;

    drawUltrasonicBeamCone2D({
      ctx,
      entryX,
      entryY,
      bounceX,
      bounceY,
      leg2EndX,
      leg2EndY,
      scalePxPerMm: scale,
      coneMetrics,
      isPaut: beamMode === 'paut_focused',
      focalDepthMm: pautFocusMm,
      showWavefronts,
      showNearField,
      isHit: isIn6dBCore,
    });

    // Probe Icon
    ctx.fillStyle = beamMode === 'paut_focused' ? '#f59e0b' : '#0284c7';
    ctx.fillRect(entryX - 8, topY - 16, 28, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText(`${probeAngleDeg}°`, entryX - 4, topY - 5);

    // Draw Defect Morphology
    const defCanvasX = originX + currentDefect.distanceFromWeldCenterMm * scale;
    const defCanvasY = topY + flawDepthMm * scale;
    drawComprehensiveDefectMorphology(
      ctx,
      currentDefect.id,
      defCanvasX,
      defCanvasY,
      topY,
      bottomY,
      scale,
      isIn6dBCore
    );

    // Bottom Mini Echo Signature Strip inside Canvas
    const stripTop = bottomY + 22;
    const stripH = h - stripTop - 10;
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#1e293b';
    ctx.fillRect(18, stripTop, w - 36, stripH);
    ctx.strokeRect(18, stripTop, w - 36, stripH);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(
      `ECHO ENVELOPE SIGNATURE [${currentDefect.codeSymbol}]: ${currentDefect.directionalSensitivity}`,
      26,
      stripTop + 13
    );

    // Draw characteristic A-Scan envelope shape for this defect
    ctx.strokeStyle = isIn6dBCore ? '#22c55e' : isIn20dBEdge ? '#f59e0b' : '#64748b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const baseLine = stripTop + stripH - 6;
    const ampMult = isIn6dBCore ? 0.82 : isIn20dBEdge ? 0.38 : 0.16;
    for (let px = 24; px < w - 24; px++) {
      const norm = (px - 24) / (w - 48);
      let sig = 0;
      if (norm < 0.06) {
        sig = 0.85 * Math.exp(-Math.pow((norm - 0.02) / 0.018, 2));
      }
      const centerNorm = 0.52;
      const d = norm - centerNorm;
      if (currentDefect.echoWaveformType === 'sharp_spike_tip') {
        sig += ampMult * Math.exp(-Math.pow(d / 0.018, 2));
        sig += ampMult * 0.28 * Math.exp(-Math.pow((d + 0.06) / 0.012, 2)); // Tip diffraction!
      } else if (currentDefect.echoWaveformType === 'clean_specular') {
        sig += ampMult * 0.95 * Math.exp(-Math.pow(d / 0.015, 2));
      } else if (currentDefect.echoWaveformType === 'jagged_multipeak') {
        sig +=
          ampMult *
          0.72 *
          Math.exp(-Math.pow(d / 0.042, 2)) *
          (0.65 + 0.35 * Math.abs(Math.sin(d * 210)));
      } else if (currentDefect.echoWaveformType === 'dense_cluster') {
        for (const off of [-0.04, -0.015, 0.01, 0.035]) {
          sig += ampMult * 0.52 * Math.exp(-Math.pow((d - off) / 0.011, 2));
        }
      } else if (currentDefect.echoWaveformType === 'backwall_loss') {
        sig += ampMult * 0.95 * Math.exp(-Math.pow((norm - 0.36) / 0.016, 2));
      }
      const sy = baseLine - Math.min(stripH - 20, sig * (stripH - 18));
      if (px === 24) ctx.moveTo(px, sy);
      else ctx.lineTo(px, sy);
    }
    ctx.stroke();
  }, [
    currentDefect,
    flawDepthMm,
    probeStandoffMm,
    probeAngleDeg,
    halfSkipMm,
    coneMetrics,
    beamMode,
    pautFocusMm,
    showWavefronts,
    showNearField,
    isIn6dBCore,
    isIn20dBEdge,
    plateThicknessMm,
  ]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-cyan-400 mb-1 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr
                ? 'رفع منطقية التخيل الفراغي · فيزياء كوم الأشعة ثلاثي الأبعاد وموسوعة الـ 16 عيباً'
                : '3D Spatial Beam Cone Visualizer & Complete 16-Defect Morphology Atlas'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {isAr
              ? 'كيف يتشكل "كوم الأشعة" (Sound Beam Cone) وكيف يتفاعل مع كافة أشكال عيوب اللحام؟'
              : 'How the Ultrasonic Beam Cone Forms & Interacts with All Inspectable Weld Defects'}
          </h3>
        </div>

        {/* Audio Chip + Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <NdtAudioControlChip language={language} compact />
          <button
            type="button"
            onClick={() => {
              playCalibrationClick();
              setShowNearField(!showNearField);
            }}
            className={`px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
              showNearField
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/50 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isAr ? 'المجال القريب (NF)' : 'Near Field (NF)'}
          </button>
          <button
            type="button"
            onClick={() => setShowOuter20dBCone(!showOuter20dBCone)}
            className={`px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
              showOuter20dBCone
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isAr ? 'مخروط الانتشار (-20dB)' : '-20dB Outer Cone'}
          </button>
          <button
            type="button"
            onClick={() => setShowWavefronts(!showWavefronts)}
            className={`px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
              showWavefronts
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isAr ? 'جبهات الموجات' : 'Wavefronts'}
          </button>
          <button
            type="button"
            onClick={() => setShowSideLobes(!showSideLobes)}
            className={`px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
              showSideLobes
                ? 'bg-pink-950/60 text-pink-300 border-pink-500/50 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isAr ? 'الفصوص الجانبية (Side Lobes)' : 'Side Lobes'}
          </button>
          <button
            type="button"
            aria-pressed={showDefectWireframe}
            onClick={() => {
              playCalibrationClick();
              setShowDefectWireframe((v) => !v);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
              showDefectWireframe
                ? 'bg-cyan-950/70 text-cyan-200 border-cyan-400/60 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'الشبكة السلكية للعيب 3D' : '3D Flaw Wireframe'}</span>
          </button>
        </div>
      </div>

      {/* Dual Interactive Stage: 3D Volumetric Beam Cone + 2D Cross-Section & Echo Signature */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: 3D Orbiting Volumetric Cone Canvas */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-black p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isAr
                    ? 'منظور ثلاثي الأبعاد لكوم الأشعة داخل اللحام (اسحب بالماوس لتدوير الزاوية 360°)'
                    : 'Interactive 3D Volumetric Beam Cone (Drag to Orbit 360°)'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setYawDeg(-32);
                  setPitchDeg(24);
                }}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'ضبط الزاوية' : 'Reset Orbit'}</span>
              </button>
            </div>

            <canvas
              ref={canvas3DRef}
              width={620}
              height={320}
              onMouseDown={(e) => {
                setIsDragging3D(true);
                dragOriginRef.current = { x: e.clientX, y: e.clientY };
              }}
              onMouseMove={(e) => {
                if (!isDragging3D) return;
                const dx = e.clientX - dragOriginRef.current.x;
                const dy = e.clientY - dragOriginRef.current.y;
                setYawDeg((prev) => prev + dx * 0.45);
                setPitchDeg((prev) => Math.max(8, Math.min(58, prev + dy * 0.35)));
                dragOriginRef.current = { x: e.clientX, y: e.clientY };
              }}
              onMouseUp={() => setIsDragging3D(false)}
              onMouseLeave={() => setIsDragging3D(false)}
              className="w-full h-72 rounded-lg bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing select-none"
            />

            {/* Live 3D Specimen Defect Wireframe Sizing Overlay Strip */}
            {showDefectWireframe && coneSpecimenWireframeOverlays.length > 0 && (
              <div
                role="region"
                aria-label={
                  isAr
                    ? 'أبعاد الشبكة السلكية ثلاثية الأبعاد للعيب المكتشف'
                    : '3D Weld Specimen Wireframe Defect Sizing'
                }
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900/95 border border-cyan-500/40 font-mono text-[11px] tabular-nums"
              >
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isAr
                      ? `إسقاط سلكي ثلاثي الأبعاد [${coneSpecimenWireframeOverlays[0].codeSymbol}]:`
                      : `3D Wireframe Overlay [${coneSpecimenWireframeOverlays[0].codeSymbol}]:`}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2 text-slate-200 font-semibold">
                  <span className="text-sky-300">
                    {isAr
                      ? `العمق المحسوب Z = ${coneSpecimenWireframeOverlays[0].calculatedDepthMm.toFixed(1)} mm`
                      : `Depth Z = ${coneSpecimenWireframeOverlays[0].calculatedDepthMm.toFixed(1)} mm`}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-300">
                    {isAr
                      ? `الطول المحسوب L = ${coneSpecimenWireframeOverlays[0].calculatedLengthMm.toFixed(1)} mm`
                      : `Length L = ${coneSpecimenWireframeOverlays[0].calculatedLengthMm.toFixed(1)} mm`}
                  </span>
                </div>
              </div>
            )}

            {/* Calculated Cone & Near-Field Physics Readout Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs tabular-nums">
              <div className="p-2 rounded-lg bg-slate-900 border border-purple-500/40">
                <div className="text-[10px] text-slate-400">{isAr ? 'المجال القريب الكلي / الصافي:' : 'Total / Specimen NF:'}</div>
                <div className="text-sm font-black text-purple-300">
                  {coneMetrics.nearFieldLengthMm.toFixed(1)} / {coneMetrics.effectiveNearFieldInSpecimenMm.toFixed(1)} mm
                </div>
                <div className="text-[9.5px] text-slate-500">λ = {coneMetrics.wavelengthMm.toFixed(2)} mm</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'زاوية المخروط الفعال (-6dB):' : '-6dB Half-Angle:'}</div>
                <div className="text-sm font-black text-cyan-400">±{coneMetrics.halfAngleMinus6dBDeg.toFixed(1)}°</div>
                <div className="text-[9.5px] text-slate-500">arcsin(0.514·λ/D)</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'انتشار الحافة (-20dB):' : '-20dB Spread:'}</div>
                <div className="text-sm font-black text-amber-400">±{coneMetrics.halfAngleMinus20dBDeg.toFixed(1)}°</div>
                <div className="text-[9.5px] text-slate-500">arcsin(1.22·λ/D)</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'قطر الكوم عند العيب:' : 'Cone Width @ Flaw:'}</div>
                <div className="text-sm font-black text-emerald-400">
                  {coneMetrics.width6dBAtDepthMm(approxFlawSoundPathMm).toFixed(1)} mm
                </div>
                <div className="text-[9.5px] text-slate-500">S = {approxFlawSoundPathMm.toFixed(1)} mm</div>
              </div>
            </div>

            {/* Live Fresnel Near-Field Formula & Reflector Zone Status Box */}
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-purple-500/30 font-mono text-[11px] space-y-1 tabular-nums">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-purple-300 font-bold">
                  {isAr
                    ? `معادلة المجال القريب: N = D²·f/(4V) = ${coneMetrics.effectiveApertureMm.toFixed(1)}² / (4×${coneMetrics.wavelengthMm.toFixed(2)}) = ${coneMetrics.nearFieldLengthMm.toFixed(1)} مم`
                    : `Near-Field Eq: N = D²·f/(4V) = ${coneMetrics.effectiveApertureMm.toFixed(1)}² / (4×${coneMetrics.wavelengthMm.toFixed(2)}) = ${coneMetrics.nearFieldLengthMm.toFixed(1)} mm`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${
                    nearFieldZoneCheck.isUnreliableAmplitudeZone
                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {nearFieldZoneCheck.isUnreliableAmplitudeZone ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  <span>{nearFieldZoneCheck.badgeText[language]}</span>
                </span>
              </div>
              <div className="text-[10.5px] text-slate-400">{nearFieldZoneCheck.advisory[language]}</div>
            </div>
          </div>
        </div>

        {/* Right: 2D Cross-Section + Beam Cone Parameter Controls */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-black p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold">
                {isAr ? 'المقطع العرضي وبصمة الصدى المرتد:' : 'Cross-Section & Echo Signature:'}
              </span>
              <span className={isIn6dBCore ? 'text-emerald-400 font-bold' : isIn20dBEdge ? 'text-amber-400' : 'text-slate-500'}>
                {isIn6dBCore
                  ? isAr
                    ? '● قلب المخروط (-6dB) يصيب العيب'
                    : '● -6dB CORE HIT'
                  : isIn20dBEdge
                  ? isAr
                    ? '▲ طرف المخروط (-20dB)'
                    : '▲ -20dB EDGE'
                  : isAr
                  ? 'خارج الكوم'
                  : 'OUTSIDE CONE'}
              </span>
            </div>

            <canvas
              ref={canvasCrossRef}
              width={460}
              height={235}
              className="w-full h-56 rounded-lg bg-slate-950 border border-slate-800 select-none"
            />
          </div>

          {/* Interactive Beam Cone Shaping Sliders */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setBeamMode('ut_single')}
                className={`py-1.5 rounded-lg border font-bold cursor-pointer ${
                  beamMode === 'ut_single'
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {isAr ? 'مخروط بلورة UT مفردة' : 'Single-Crystal UT Cone'}
              </button>
              <button
                type="button"
                onClick={() => setBeamMode('paut_focused')}
                className={`py-1.5 rounded-lg border font-bold cursor-pointer ${
                  beamMode === 'paut_focused'
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {isAr ? 'مخروط PAUT ممركز بؤرياً' : 'PAUT Focused Cone'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>{isAr ? 'زاوية السقوط:' : 'Beam Angle:'}</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{probeAngleDeg}°</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 45, 60, 70].map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => {
                        setProbeAngleDeg(ang);
                        if (ang === 0) setProbeStandoffMm(currentDefect.distanceFromWeldCenterMm);
                      }}
                      className={`py-1 rounded border text-[10px] cursor-pointer ${
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
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>{isAr ? 'التردد (MHz):' : 'Freq (MHz):'}</span>
                  <span className="text-amber-400 font-bold tabular-nums">{frequencyMhz} MHz</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[2, 4, 5, 10].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequencyMhz(f)}
                      className={`py-1 rounded border text-[10px] cursor-pointer ${
                        frequencyMhz === f
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {f}M
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {beamMode === 'ut_single' ? (
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>{isAr ? 'قطر البلورة D (يتحكم في عرض الكوم):' : 'Crystal Diameter D (Controls Spread):'}</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{crystalDiameterMm} mm</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="24"
                  step="2"
                  value={crystalDiameterMm}
                  onChange={(e) => setCrystalDiameterMm(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">{isAr ? 'عدد العناصر:' : 'Aperture:'}</div>
                  <div className="grid grid-cols-3 gap-1">
                    {([16, 32, 64] as const).map((el) => (
                      <button
                        key={el}
                        type="button"
                        onClick={() => setPautElements(el)}
                        className={`py-1 rounded border text-[10px] cursor-pointer ${
                          pautElements === el ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {el}E
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{isAr ? 'عمق البؤرة:' : 'Focus:'}</span>
                    <span className="text-amber-400 tabular-nums">{pautFocusMm}mm</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="40"
                    value={pautFocusMm}
                    onChange={(e) => setPautFocusMm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-cyan-400" />
                  <span>{isAr ? 'تحريك البروب لاختبار سقوط الكوم على العيب:' : 'Slide Probe X Across Defect:'}</span>
                </span>
                <span className="text-cyan-400 font-bold tabular-nums">X = {probeStandoffMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="1"
                aria-label={isAr ? 'تحريك البروب ثلاثي الأبعاد' : 'Slide 3D Probe Standoff X'}
                value={probeStandoffMm}
                onChange={(e) => {
                  hasInteracted3DRef.current = true;
                  playProbeScanTick();
                  setProbeStandoffMm(Number(e.target.value));
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Defect Deep Spatial Dossier */}
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-9 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
              {currentDefect.codeSymbol}
            </span>
            <span
              className={`px-2 py-0.5 rounded border font-bold ${
                currentDefect.category === 'Planar'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}
            >
              {currentDefect.category === 'Planar' ? (isAr ? 'عيب مستوي Planar' : 'Planar') : isAr ? 'عيب حجمي Volumetric' : 'Volumetric'}
            </span>
            <span className="text-slate-400">
              {isAr ? 'الموقع:' : 'Zone:'} <strong className="text-slate-200">{currentDefect.locationZone[language]}</strong>
            </span>
            <span className="text-slate-400">
              · {isAr ? 'الزاوية المثلى:' : 'Optimal Angle:'}{' '}
              <strong className="text-amber-400">
                {currentDefect.optimalAngleDeg}°{currentDefect.recommendedSkewDeg === 90 ? ' (Skew 90°)' : ''}
              </strong>
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-black text-white">{currentDefect.name[language]}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-400">{isAr ? 'الشكل الفراغي وتفاعل كوم الأشعة: ' : '3D Shape & Cone Interaction: '}</strong>
            {currentDefect.morphologyShape[language]} — {currentDefect.beamInteractionNote[language]}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-amber-400">{isAr ? 'شكل الصدى على الشاشة وحكم الكود: ' : 'Screen Echo & Code Rule: '}</strong>
            {currentDefect.echoSignature[language]}
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex flex-wrap items-center justify-between gap-2 tabular-nums">
            <span className="text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isAr
                  ? `السماحية المسموحة طبقاً لـ ${activeCodeMeta.shortLabel} (سمك t=${plateThicknessMm}مم):`
                  : `Allowable Tolerance per ${activeCodeMeta.shortLabel} (t=${plateThicknessMm}mm):`}
              </span>
            </span>
            <span className={`font-black ${currentDefectTolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'}`}>
              {currentDefectTolerance.toleranceBadge[language]} ({currentDefectTolerance.clauseRef})
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              playCalibrationClick();
              aimConeDirectlyAtDefect(currentDefect);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isAr ? 'توجيه الكوم تلقائياً للعيب' : 'Aim Cone at Defect'}</span>
          </button>

          {onSelectDefectForLiveSim && (
            <button
              type="button"
              onClick={() => onSelectDefectForLiveSim(currentDefect.id)}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل العيب في جهاز الفحص الحي' : 'Inspect in Live UT/PAUT'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Complete 16-Defect Encyclopedia Selector Grid + Active Code Tolerance Switcher */}
      <div className="space-y-3">
        {/* Code & Thickness Selector Bar for Per-Defect Tolerances */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-200 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'اختر الكود لعرض سماحية كل عيب:' : 'Code for Per-Defect Tolerances:'}</span>
            </span>
            {INSPECTION_CODES_META.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCode(c.id)}
                className={`px-2.5 py-1 rounded-lg border cursor-pointer font-bold transition ${
                  selectedCode === c.id
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {c.shortLabel}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 tabular-nums">
            <span className="text-slate-400">{isAr ? 'سماكة العينة (t):' : 'Thickness (t):'}</span>
            {[15, 20, 25, 35].map((thk) => (
              <button
                key={thk}
                type="button"
                onClick={() => setPlateThicknessMm(thk)}
                className={`px-2 py-1 rounded border cursor-pointer text-[11px] ${
                  plateThicknessMm === thk
                    ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {thk}mm
              </button>
            ))}
            <span className="text-slate-500">·</span>
            <label className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Lw:</span>
              <select
                value={wedgeTravelMm}
                onChange={(e) => setWedgeTravelMm(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-purple-300 font-bold"
              >
                {[0, 8, 10, 14, 20].map((lw) => (
                  <option key={lw} value={lw}>
                    {lw}mm
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-300 font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>
              {isAr
                ? `كتالوج جميع العيوب الممكن فحصها (${ALL_WELD_DEFECTS_CATALOG.length} عيباً) مع سماحية ${activeCodeMeta.shortLabel}:`
                : `Complete Catalog of All ${ALL_WELD_DEFECTS_CATALOG.length} Defects with ${activeCodeMeta.shortLabel} Allowable Limits:`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {(
              [
                { id: 'all', label: { ar: 'كل العيوب (16)', en: 'All Defects (16)' } },
                { id: 'cracks', label: { ar: 'الشروخ (4)', en: 'Cracks (4)' } },
                { id: 'fusion_penetration', label: { ar: 'نقص الانصهار والتغلغل (4)', en: 'LOF & LOP (4)' } },
                { id: 'volumetric', label: { ar: 'خبث ومسامات وتنجستن (5)', en: 'Slag & Porosity (5)' } },
                { id: 'geometry_lamination', label: { ar: 'عيوب السطح والتصفيح (3)', en: 'Profile & Lamination (3)' } },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFamily(f.id)}
                className={`px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                  activeFamily === f.id
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-300'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {f.label[language]}
              </button>
            ))}
          </div>
        </div>

        <DefectToleranceTriggerBar
          defectId={activeDefectId}
          activeCode={selectedCode}
          thicknessMm={plateThicknessMm}
          language={language}
          autoAlertOnSelect={autoAlertOnDefectSelect}
          onToggleAutoAlert={setAutoAlertOnDefectSelect}
          onOpenModal={() => setIsToleranceModalOpen(true)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filteredDefects.map((def) => {
            const isSelected = def.id === activeDefectId;
            const tol = getDefectCodeTolerance(def.id, selectedCode, plateThicknessMm);
            return (
              <DefectToleranceTooltip
                key={def.id}
                defectId={def.id}
                activeCode={selectedCode}
                thicknessMm={plateThicknessMm}
                language={language}
              >
                <button
                  type="button"
                  onClick={() => {
                    aimConeDirectlyAtDefect(def);
                    if (autoAlertOnDefectSelect) {
                      setIsToleranceModalOpen(true);
                    }
                  }}
                  className={`w-full h-full p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                        {def.codeSymbol}
                      </span>
                      <span className={def.category === 'Planar' ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                        {def.category} · {def.optimalAngleDeg}°
                      </span>
                    </div>
                    <div className="text-xs font-bold leading-snug">{def.name[language]}</div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{def.morphologyShape[language]}</div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 space-y-1 font-mono tabular-nums">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        {isAr ? `سماحية ${activeCodeMeta.shortLabel}:` : `${activeCodeMeta.shortLabel} Limit:`}
                      </span>
                      <span className={tol.reject ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {tol.reject ? 'REJECT' : 'ACCEPT'}
                      </span>
                    </div>
                    <div className={`text-[10px] font-bold ${tol.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'}`}>
                      {tol.toleranceBadge[language]}
                    </div>
                  </div>
                </button>
              </DefectToleranceTooltip>
            );
          })}
        </div>
      </div>

      {/* Reactive D3.js Bar Chart Tracking Welding Defect Type Frequencies */}
      <DefectFrequencyD3Chart
        language={language}
        onFocusDefectIn3D={handleFocusLogged3DDefect}
        onPopulateSampleDefects={() => {
          const sampleIds: ExtendedWeldFlawId[] = [
            'porosity_cluster',
            'isolated_pore',
            'lack_of_fusion',
            'slag_inclusion',
            'incomplete_penetration',
            'root_crack',
          ];
          for (const fId of sampleIds) {
            const def = ALL_WELD_DEFECTS_CATALOG.find((item) => item.id === fId);
            if (!def) continue;
            const depthZ = Number((def.nominalDepthRatio * plateThicknessMm).toFixed(1));
            const sPath =
              def.optimalAngleDeg === 0
                ? depthZ
                : depthZ / Math.cos((def.optimalAngleDeg * Math.PI) / 180);
            const sev = deriveDefectSeverity(def.category, def.id);
            logDiscoveredDefect({
              defectKey: `3d_beam_cone:${def.id}:${beamMode}`,
              catalogDefectId: def.id,
              codeSymbol: def.codeSymbol,
              type: def.name,
              morphology: def.category,
              method: beamMode === 'paut_focused' ? 'PAUT 3D' : 'UT 3D',
              sourceLab: {
                ar: 'معمل كوم الأشعة ثلاثي الأبعاد والـ 16 عيباً',
                en: '3D Volumetric Beam Cone & 16-Defect Lab',
              },
              location: {
                zone: def.locationZone,
                xMm: def.distanceFromWeldCenterMm,
                yMm: def.centerYmm,
                depthZMm: depthZ,
                soundPathOrAngle: `S=${sPath.toFixed(1)}mm @ ${def.optimalAngleDeg}°`,
              },
              sizing: {
                calculatedDepthMm: depthZ,
                calculatedLengthMm: def.lengthMm,
                heightMm: def.heightMm,
                transverseWidthMm: def.category === 'Volumetric' ? 2.8 : 1.9,
                soundPathMm: Number(sPath.toFixed(1)),
                sizingMethod: '3D Cone Core & -6 dB Drop',
              },
              severity: sev,
              peakSignalPct: Math.round(def.reflectivityFactor * 94),
            });
          }
          playDefectDetectedPing('High');
        }}
      />

      {/* Reactive Auto-Logged 3D Discovered Defects Table */}
      <DiscoveredDefectsLogTable
        language={language}
        onFocusDefectIn3D={handleFocusLogged3DDefect}
        onTriggerSampleScan={() => aimConeDirectlyAtDefect(currentDefect)}
      />

      <DefectToleranceModal
        isOpen={isToleranceModalOpen}
        onClose={() => setIsToleranceModalOpen(false)}
        defectId={activeDefectId}
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
