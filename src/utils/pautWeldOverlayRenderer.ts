export type WeldGrooveType = 'single_v' | 'double_v' | 'j_groove';

export interface PautWeldBevelConfig {
  grooveType: WeldGrooveType;
  bevelAngleDeg: number; // e.g. 25, 30, 37.5
  rootGapMm: number; // e.g. 2.0
  rootFaceMm: number; // e.g. 1.8
  hazWidthMm: number; // e.g. 2.5
  capReinforcementMm: number; // e.g. 1.6
}

export const DEFAULT_PAUT_WELD_BEVEL: PautWeldBevelConfig = {
  grooveType: 'single_v',
  bevelAngleDeg: 30,
  rootGapMm: 2.0,
  rootFaceMm: 1.8,
  hazWidthMm: 2.5,
  capReinforcementMm: 1.6,
};

export interface PautFlawInput {
  id: string;
  label?: string;
  depthMm: number; // 0 .. T inside Leg 1
  heightMm: number; // Δh
  offsetFromCenterTowardsProbeMm: number; // + towards probe (left of CL in S-Scan), - away from probe
  isPlanar?: boolean;
   snapToBevelRole?: 'bevel_wall' | 'haz_wall' | 'cap_toe' | 'root_center' | 'none';
  baseIntensity?: number; // 0 .. 1 longitudinal/gain factor
}

export interface PautLegFlawProjection {
  leg: 1 | 2;
  unfoldedDepthMm: number; // Z1 = d, Z2 = 2T - d
  horizontalDistFromProbeMm: number; // X = X0 - offset
  soundPathMm: number; // sqrt(X^2 + Z^2)
  beamAngleDeg: number; // atan2(X, Z) in degrees from vertical normal (+Z)
  isInsideSector: boolean;
  weldZoneLabelEn: string;
  weldZoneLabelAr: string;
}

export interface PautSectorProjectionSummary {
  scalePxPerMm: number;
  originX: number;
  originY: number;
  maxSoundPathMm: number;
  weldCenterlineXmm: number;
  topCapHalfWidthMm: number;
  projections: PautLegFlawProjection[];
  primaryActiveProjection: PautLegFlawProjection | null;
}

/**
 * Computes the half-width (mm from weld centerline) of the fusion bevel face
 * at local through-wall depth `zMm` (0 = top surface, T = bottom backwall/root).
 */
export function computeWeldBevelHalfWidthAtDepthMm(
  zMm: number,
  thicknessMm: number,
  config: PautWeldBevelConfig = DEFAULT_PAUT_WELD_BEVEL
): number {
  const T = Math.max(4, thicknessMm);
  const z = Math.max(0, Math.min(T, zMm));
  const halfGap = Math.max(0.4, config.rootGapMm * 0.5);
  const rootFace = Math.min(T * 0.35, Math.max(0.5, config.rootFaceMm));
  const tanAlpha = Math.tan((Math.max(10, Math.min(50, config.bevelAngleDeg)) * Math.PI) / 180);

  if (config.grooveType === 'double_v') {
    const halfRootFace = rootFace * 0.5;
    const distFromMid = Math.max(0, Math.abs(z - T * 0.5) - halfRootFace);
    return halfGap + distFromMid * tanAlpha;
  }

  if (config.grooveType === 'j_groove') {
    const bevelSpan = Math.max(1, T - rootFace);
    if (z >= bevelSpan) {
      return halfGap;
    }
    const u = (bevelSpan - z) / bevelSpan; // 0 at root land, 1 at top cap
    const jSlope = Math.tan((Math.max(12, config.bevelAngleDeg * 0.64) * Math.PI) / 180);
    return halfGap + bevelSpan * jSlope * Math.pow(u, 0.68);
  }

  // Default: Single-V Butt Groove
  const bevelDepthLimit = Math.max(1, T - rootFace);
  if (z >= bevelDepthLimit) {
    return halfGap;
  }
  return halfGap + (bevelDepthLimit - z) * tanAlpha;
}

/**
 * Converts true ultrasonic polar coordinates (soundPath S in mm, beamAngle θ in degrees
 * measured from the vertical +Z depth normal) into 2D isotropic canvas pixels.
 */
export function polarUtToCanvas(
  originX: number,
  originY: number,
  scalePxPerMm: number,
  soundPathMm: number,
  beamAngleFromVerticalDeg: number
): { x: number; y: number } {
  const thetaRad = (beamAngleFromVerticalDeg * Math.PI) / 180;
  return {
    x: originX + soundPathMm * scalePxPerMm * Math.sin(thetaRad),
    y: originY + soundPathMm * scalePxPerMm * Math.cos(thetaRad),
  };
}

/**
 * Resolves exact flaw horizontal offset from weld centerline, snapping bevel/HAZ/toe
 * defects onto the active groove profile so customizing groove angle or type keeps
 * sidewall LOF, HAZ cracks, and toe undercut physically anchored to the weld contour.
 */
export function resolveFlawOffsetOnBevelMm(
  flaw: PautFlawInput,
  thicknessMm: number,
  bevelConfig: PautWeldBevelConfig
): number {
  const bevelAtFlaw = computeWeldBevelHalfWidthAtDepthMm(flaw.depthMm, thicknessMm, bevelConfig);
  const topBevel = computeWeldBevelHalfWidthAtDepthMm(0, thicknessMm, bevelConfig);

  if (flaw.snapToBevelRole === 'bevel_wall' || flaw.id === 'lack_of_fusion') {
    return bevelAtFlaw;
  }
  if (flaw.snapToBevelRole === 'haz_wall' || flaw.id === 'haz_underbead_crack') {
    return bevelAtFlaw + bevelConfig.hazWidthMm * 0.55;
  }
  if (flaw.snapToBevelRole === 'cap_toe' || flaw.id === 'toe_undercut') {
    return topBevel + 0.6;
  }
  if (flaw.snapToBevelRole === 'root_center' || flaw.id === 'incomplete_penetration') {
    return 0;
  }
  return flaw.offsetFromCenterTowardsProbeMm;
}

/**
 * Computes physical Leg 1 (Direct: 0 -> 1T) and Leg 2 (1st Skip Mirror: 1T -> 2T)
 * PAUT sectorial coordinates for a weld discontinuity.
 */
export function computePautSectorFlawProjections(params: {
  canvasWidth: number;
  canvasHeight: number;
  plateThicknessMm: number;
  probeIndexOffsetMm: number;
  minAngleDeg: number;
  maxAngleDeg: number;
  selectedAngleDeg: number;
  showSkipMirror: boolean;
  bevelConfig?: PautWeldBevelConfig;
  flaw?: PautFlawInput | null;
}): PautSectorProjectionSummary {
  const {
    canvasWidth,
    canvasHeight,
    plateThicknessMm,
    probeIndexOffsetMm,
    minAngleDeg,
    maxAngleDeg,
    selectedAngleDeg,
    showSkipMirror,
    bevelConfig = DEFAULT_PAUT_WELD_BEVEL,
    flaw,
  } = params;

  const T = Math.max(6, plateThicknessMm);
  const originX = 52;
  const originY = 28;
  const rightPad = 34;
  const bottomPad = 18;

  const topCapHalfWidthMm = computeWeldBevelHalfWidthAtDepthMm(0, T, bevelConfig);
  const maxDepthDisplayMm = showSkipMirror ? T * 2.12 : T * 1.25;
  const maxSoundPathMm = Math.max(
    T * (showSkipMirror ? 2.75 : 2.05),
    probeIndexOffsetMm + topCapHalfWidthMm + 8,
    54
  );

  const minRad = (Math.max(0, minAngleDeg) * Math.PI) / 180;
  const maxRad = (Math.min(90, maxAngleDeg) * Math.PI) / 180;

  const availW = Math.max(120, canvasWidth - originX - rightPad);
  const availH = Math.max(90, canvasHeight - originY - bottomPad);

  const horizSpanMm = Math.max(
    maxSoundPathMm * Math.sin(maxRad),
    probeIndexOffsetMm + topCapHalfWidthMm + 7
  );
  const vertSpanMm = Math.max(maxSoundPathMm * Math.cos(minRad), maxDepthDisplayMm);
  const scalePxPerMm = Math.min(availW / horizSpanMm, availH / vertSpanMm);

  const projections: PautLegFlawProjection[] = [];

  if (flaw && flaw.id !== 'sound_weld') {
    const resolvedOffsetMm = resolveFlawOffsetOnBevelMm(flaw, T, bevelConfig);
    const dxMm = Math.max(1.5, probeIndexOffsetMm - resolvedOffsetMm);
    const clampedDepth = Math.max(0.8, Math.min(T - 0.2, flaw.depthMm));

    const classifyZone = (leg: 1 | 2): { en: string; ar: string } => {
      if (clampedDepth >= T * 0.86) {
        return {
          en: leg === 1 ? 'Leg 1 · Root Zone' : 'Leg 2 Mirror · Root Zone',
          ar: leg === 1 ? 'المسار 1 · جذر اللحام' : 'انعكاس المسار 2 · الجذر',
        };
      }
      if (clampedDepth <= T * 0.18) {
        return {
          en: leg === 1 ? 'Leg 1 · Cap / Toe' : 'Leg 2 Mirror · Cap Crown',
          ar: leg === 1 ? 'المسار 1 · تاج اللحام' : 'انعكاس المسار 2 · تاج اللحام العلوي',
        };
      }
      const bevelW = computeWeldBevelHalfWidthAtDepthMm(clampedDepth, T, bevelConfig);
      if (Math.abs(Math.abs(resolvedOffsetMm) - bevelW) <= 1.8) {
        return {
          en: leg === 1 ? 'Leg 1 · Fusion Bevel' : 'Leg 2 Mirror · Bevel Wall',
          ar: leg === 1 ? 'المسار 1 · شطف الانصهار' : 'انعكاس المسار 2 · جدار الشطف',
        };
      }
      if (Math.abs(resolvedOffsetMm) > bevelW + 1.0) {
        return {
          en: leg === 1 ? 'Leg 1 · HAZ Boundary' : 'Leg 2 Mirror · HAZ Boundary',
          ar: leg === 1 ? 'المسار 1 · منطقة HAZ' : 'انعكاس المسار 2 · منطقة HAZ',
        };
      }
      return {
        en: leg === 1 ? 'Leg 1 · Weld Fill' : 'Leg 2 Mirror · Weld Fill',
        ar: leg === 1 ? 'المسار 1 · قلب اللحام' : 'انعكاس المسار 2 · قلب اللحام',
      };
    };

    // Leg 1 (Direct: 0 -> 1T)
    const z1 = clampedDepth;
    const s1 = Math.hypot(dxMm, z1);
    const ang1 = (Math.atan2(dxMm, z1) * 180) / Math.PI;
    const z1Zone = classifyZone(1);
    projections.push({
      leg: 1,
      unfoldedDepthMm: z1,
      horizontalDistFromProbeMm: dxMm,
      soundPathMm: s1,
      beamAngleDeg: ang1,
      isInsideSector: ang1 >= minAngleDeg - 1.5 && ang1 <= maxAngleDeg + 1.5 && s1 <= maxSoundPathMm,
      weldZoneLabelEn: z1Zone.en,
      weldZoneLabelAr: z1Zone.ar,
    });

    // Leg 2 (First Skip Bottom-Reflected Mirror: 1T -> 2T)
    if (showSkipMirror) {
      const z2 = Math.max(T + 0.4, 2 * T - clampedDepth);
      const s2 = Math.hypot(dxMm, z2);
      const ang2 = (Math.atan2(dxMm, z2) * 180) / Math.PI;
      const z2Zone = classifyZone(2);
      projections.push({
        leg: 2,
        unfoldedDepthMm: z2,
        horizontalDistFromProbeMm: dxMm,
        soundPathMm: s2,
        beamAngleDeg: ang2,
        isInsideSector: ang2 >= minAngleDeg - 1.5 && ang2 <= maxAngleDeg + 1.5 && s2 <= maxSoundPathMm,
        weldZoneLabelEn: z2Zone.en,
        weldZoneLabelAr: z2Zone.ar,
      });
    }
  }

  const insideList = projections.filter((p) => p.isInsideSector);
  const primaryActiveProjection =
    insideList.length > 0
      ? insideList.reduce((best, cur) =>
          Math.abs(cur.beamAngleDeg - selectedAngleDeg) < Math.abs(best.beamAngleDeg - selectedAngleDeg)
            ? cur
            : best
        )
      : projections[0] ?? null;

  return {
    scalePxPerMm,
    originX,
    originY,
    maxSoundPathMm,
    weldCenterlineXmm: probeIndexOffsetMm,
    topCapHalfWidthMm,
    projections,
    primaryActiveProjection,
  };
}

export interface RenderModernPautSScanOptions {
  width: number;
  height: number;
  plateThicknessMm: number;
  probeIndexOffsetMm: number;
  minAngleDeg: number;
  maxAngleDeg: number;
  selectedAngleDeg: number;
  apertureElements: number;
  focalDepthMm: number;
  gainDb: number;
  isTcgCalibrated?: boolean;
  scanLawMode?: 'sectorial' | 'linear';
  specimenGeometry?: 'flat' | 'curved';
  pipeOdMm?: number;
  isWeldOverlayVisible?: boolean;
  showSkipMirror?: boolean;
  bevelConfig?: PautWeldBevelConfig;
  flaw?: PautFlawInput | null;
  showFocalBeamCone?: boolean;
  showSizingCaliper?: boolean;
  caliperY1Mm?: number;
  caliperY2Mm?: number;
  isAr?: boolean;
}

function safeStrokeRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (typeof ctx.strokeRect === 'function') {
    ctx.strokeRect(x, y, w, h);
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.stroke();
  }
}

function safeQuadCurve(
  ctx: CanvasRenderingContext2D,
  cpx: number,
  cpy: number,
  x: number,
  y: number
): void {
  if (typeof ctx.quadraticCurveTo === 'function') {
    ctx.quadraticCurveTo(cpx, cpy, x, y);
  } else {
    ctx.lineTo(x, y);
  }
}

function safeEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotRad: number
): void {
  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), rotRad, 0, Math.PI * 2);
  } else {
    ctx.arc(x, y, Math.max(1, (rx + ry) * 0.5), 0, Math.PI * 2);
  }
}

/**
 * Draws the detailed weld groove geometry (fusion bevels, multi-pass contours,
 * HAZ dashed zones, cap crown, root land/gap) for Leg 1 (0 -> 1T) and optionally
 * Leg 2 Mirrored Skip (1T -> 2T).
 */
function drawWeldGeometryCrossSection(
  ctx: CanvasRenderingContext2D,
  params: {
    weldCenterX: number;
    originY: number;
    scalePx: number;
    thicknessMm: number;
    bevelConfig: PautWeldBevelConfig;
    showSkipMirror: boolean;
    emphasis: 'ghost_outside' | 'active_inside_fan';
    isAr?: boolean;
  }
): void {
  const {
    weldCenterX,
    originY,
    scalePx,
    thicknessMm,
    bevelConfig,
    showSkipMirror,
    emphasis,
    isAr,
  } = params;

  const isInside = emphasis === 'active_inside_fan';
  const T = thicknessMm;
  const steps = 16;

  const drawSingleLegProfile = (leg: 1 | 2) => {
    const mapZToY = (localZmm: number): number => {
      const unfoldedZ = leg === 1 ? localZmm : 2 * T - localZmm;
      return originY + unfoldedZ * scalePx;
    };

    const leftPts: Array<{ x: number; y: number }> = [];
    const rightPts: Array<{ x: number; y: number }> = [];
    const hazLeftPts: Array<{ x: number; y: number }> = [];
    const hazRightPts: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const zMm = (i / steps) * T;
      const halfW = computeWeldBevelHalfWidthAtDepthMm(zMm, T, bevelConfig);
      const yPx = mapZToY(zMm);
      leftPts.push({ x: weldCenterX - halfW * scalePx, y: yPx });
      rightPts.push({ x: weldCenterX + halfW * scalePx, y: yPx });
      hazLeftPts.push({ x: weldCenterX - (halfW + bevelConfig.hazWidthMm) * scalePx, y: yPx });
      hazRightPts.push({ x: weldCenterX + (halfW + bevelConfig.hazWidthMm) * scalePx, y: yPx });
    }

    // 1. Subtle weld metal fill polygon
    ctx.fillStyle = isInside
      ? leg === 1
        ? 'rgba(245, 158, 11, 0.12)'
        : 'rgba(56, 189, 248, 0.08)'
      : 'rgba(148, 163, 184, 0.04)';
    ctx.beginPath();
    leftPts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    for (let i = rightPts.length - 1; i >= 0; i--) {
      ctx.lineTo(rightPts[i].x, rightPts[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // 2. Internal multi-pass weld bead arcs (Root pass, Fill passes, Cap pass)
    if (isInside) {
      const passFractions = [0.22, 0.48, 0.76];
      ctx.strokeStyle = leg === 1 ? 'rgba(251, 191, 36, 0.24)' : 'rgba(125, 211, 252, 0.20)';
      ctx.lineWidth = 0.9;
      for (const frac of passFractions) {
        const zPass = frac * T;
        const hw = computeWeldBevelHalfWidthAtDepthMm(zPass, T, bevelConfig) * scalePx;
        const yPass = mapZToY(zPass);
        const archDir = leg === 1 ? -3.2 : 3.2;
        ctx.beginPath();
        ctx.moveTo(weldCenterX - hw, yPass);
        safeQuadCurve(ctx, weldCenterX, yPass + archDir, weldCenterX + hw, yPass);
        ctx.stroke();
      }
    }

    // 3. Cap reinforcement crown contour (at z = 0 => top surface on Leg 1, 2T mirror on Leg 2)
    const topCapHalfPx = leftPts[0] ? weldCenterX - leftPts[0].x : 8 * scalePx;
    const capY = mapZToY(0);
    const crownPeakPx = bevelConfig.capReinforcementMm * scalePx * (leg === 1 ? -1 : 1);
    ctx.strokeStyle = isInside
      ? leg === 1
        ? 'rgba(251, 191, 36, 0.92)'
        : 'rgba(56, 189, 248, 0.80)'
      : 'rgba(234, 179, 8, 0.25)';
    ctx.lineWidth = isInside ? 1.6 : 1.0;
    if (leg === 2) ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(weldCenterX - topCapHalfPx, capY);
    safeQuadCurve(ctx, weldCenterX, capY + crownPeakPx * 1.4, weldCenterX + topCapHalfPx, capY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Root bead contour at z = T (1T boundary)
    if (leg === 1) {
      const rootHalfPx = Math.max(2, bevelConfig.rootGapMm * 0.5 * scalePx);
      const rootY = mapZToY(T);
      ctx.strokeStyle = isInside ? 'rgba(251, 191, 36, 0.9)' : 'rgba(234, 179, 8, 0.25)';
      ctx.lineWidth = isInside ? 1.5 : 1.0;
      ctx.beginPath();
      ctx.moveTo(weldCenterX - rootHalfPx, rootY);
      safeQuadCurve(ctx, weldCenterX, rootY + 3.5, weldCenterX + rootHalfPx, rootY);
      ctx.stroke();
    }

    // 5. Left & Right Fusion Bevel Walls
    ctx.strokeStyle = isInside
      ? leg === 1
        ? '#fbbf24'
        : '#38bdf8'
      : 'rgba(234, 179, 8, 0.28)';
    ctx.lineWidth = isInside ? (leg === 1 ? 1.85 : 1.45) : 1.05;
    if (leg === 2) {
      ctx.setLineDash([5, 3]);
    }
    ctx.beginPath();
    leftPts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    ctx.beginPath();
    rightPts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Dashed HAZ (Heat-Affected Zone) Parallel Boundaries
    if (isInside) {
      ctx.strokeStyle = leg === 1 ? 'rgba(245, 158, 11, 0.42)' : 'rgba(56, 189, 248, 0.34)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      hazLeftPts.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      ctx.beginPath();
      hazRightPts.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  // Draw Leg 1 (Direct: 0 -> 1T)
  drawSingleLegProfile(1);

  // Draw Leg 2 (Skip Mirror: 1T -> 2T)
  if (showSkipMirror) {
    drawSingleLegProfile(2);
  }

  // Weld Centerline Axis (CL)
  const maxLegY = originY + (showSkipMirror ? 2 * T : T) * scalePx;
  ctx.strokeStyle = isInside ? 'rgba(251, 191, 36, 0.45)' : 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 3, 1.5, 3]);
  ctx.beginPath();
  ctx.moveTo(weldCenterX, originY - 6);
  ctx.lineTo(weldCenterX, maxLegY + 4);
  ctx.stroke();
  ctx.setLineDash([]);

  if (isInside) {
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText('CL', weldCenterX - 5, originY + 11);
    if (showSkipMirror) {
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '8px monospace';
      ctx.fillText(
        isAr ? 'انعكاس اللحام (2T)' : 'LEG 2 WELD MIRROR',
        weldCenterX - 38,
        originY + T * 1.55 * scalePx
      );
    }
  }
}

/**
 * Renders an authentic modern PAUT Sectorial S-Scan (or Linear E-Scan) screen
 * with true vertical-normal ultrasonic angle graduation (θ from +Z) and
 * multi-leg unfolded weld bevel geometry inside the angular sector fan.
 */
export function renderModernPautSectorialScan(
  ctx: CanvasRenderingContext2D,
  options: RenderModernPautSScanOptions
): PautSectorProjectionSummary {
  const {
    width,
    height,
    plateThicknessMm,
    probeIndexOffsetMm,
    minAngleDeg,
    maxAngleDeg,
    selectedAngleDeg,
    apertureElements,
    focalDepthMm,
    gainDb,
    isTcgCalibrated = true,
    scanLawMode = 'sectorial',
    specimenGeometry = 'flat',
    isWeldOverlayVisible = true,
    showSkipMirror = true,
    bevelConfig = DEFAULT_PAUT_WELD_BEVEL,
    flaw = null,
    showFocalBeamCone = false,
    showSizingCaliper = false,
    caliperY1Mm = 14,
    caliperY2Mm = 18,
    isAr = false,
  } = options;

  const summary = computePautSectorFlawProjections({
    canvasWidth: width,
    canvasHeight: height,
    plateThicknessMm,
    probeIndexOffsetMm,
    minAngleDeg,
    maxAngleDeg,
    selectedAngleDeg,
    showSkipMirror,
    bevelConfig,
    flaw,
  });

  const { originX, originY, scalePxPerMm, maxSoundPathMm } = summary;
  const T = Math.max(6, plateThicknessMm);
  const fanRadiusPx = maxSoundPathMm * scalePxPerMm;
  const weldCenterX = originX + probeIndexOffsetMm * scalePxPerMm;

  // Clear full screen with deep obsidian instrument background
  ctx.fillStyle = '#040812';
  ctx.fillRect(0, 0, width, height);

  // Canvas arc angles corresponding to ultrasonic angles measured from +Z (downward vertical):
  // x = originX + R * sin(theta), y = originY + R * cos(theta)
  // => canvasAngle = PI/2 - thetaRad
  const minClampedDeg = Math.max(0, minAngleDeg);
  const maxClampedDeg = Math.min(90, maxAngleDeg);
  const canvasArcStart = Math.PI / 2 - (maxClampedDeg * Math.PI) / 180;
  const canvasArcEnd = Math.PI / 2 - (minClampedDeg * Math.PI) / 180;

  const backwall1TY = originY + T * scalePxPerMm;
  const skip2TY = originY + 2 * T * scalePxPerMm;

  // =========================================================================
  // PASS 1: Outside-Sector Specimen Plate & Ghosted Weld Context
  // =========================================================================
  const drawHorizontalBoundaryLine = (yPx: number, stroke: string, dashed: boolean) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.1;
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (specimenGeometry === 'curved') {
      ctx.moveTo(originX - 6, yPx + 5);
      safeQuadCurve(ctx, (originX + width - 36) * 0.5, yPx - 4, width - 34, yPx + 6);
    } else {
      ctx.moveTo(originX - 6, yPx);
      ctx.lineTo(width - 34, yPx);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Top specimen surface (Z = 0), 1T Backwall, and 2T Skip Mirror outside fan
  drawHorizontalBoundaryLine(originY, 'rgba(100, 116, 139, 0.55)', false);
  drawHorizontalBoundaryLine(backwall1TY, 'rgba(148, 163, 184, 0.25)', true);
  if (showSkipMirror && skip2TY < height - 6) {
    drawHorizontalBoundaryLine(skip2TY, 'rgba(56, 189, 248, 0.18)', true);
  }

  if (isWeldOverlayVisible) {
    drawWeldGeometryCrossSection(ctx, {
      weldCenterX,
      originY,
      scalePx: scalePxPerMm,
      thicknessMm: T,
      bevelConfig,
      showSkipMirror,
      emphasis: 'ghost_outside',
      isAr,
    });
  }

  // =========================================================================
  // PASS 2: Clipped Active PAUT Sectorial Fan (or E-Scan Parallelogram)
  //         Containing Bright Weld Profile, Sound-Path Grid & Echoes
  // =========================================================================
  ctx.save();
  ctx.beginPath();
  if (scanLawMode === 'linear') {
    const fixedThetaRad = (selectedAngleDeg * Math.PI) / 180;
    const apHalfPx = Math.max(10, apertureElements * 0.32 * scalePxPerMm * 0.45);
    const dx = fanRadiusPx * Math.sin(fixedThetaRad);
    const dy = fanRadiusPx * Math.cos(fixedThetaRad);
    ctx.moveTo(originX - apHalfPx, originY);
    ctx.lineTo(originX + apHalfPx, originY);
    ctx.lineTo(originX + apHalfPx + dx, originY + dy);
    ctx.lineTo(originX - apHalfPx + dx, originY + dy);
    ctx.closePath();
  } else {
    ctx.moveTo(originX, originY);
    ctx.arc(originX, originY, fanRadiusPx, canvasArcStart, canvasArcEnd);
    ctx.closePath();
  }

  if (typeof ctx.clip === 'function') {
    ctx.clip();
  }

  // Active OmniScan ultrasonic sector background fill
  const fanBg = ctx.createLinearGradient(originX, originY, originX + fanRadiusPx * 0.8, originY + fanRadiusPx * 0.8);
  fanBg.addColorStop(0, '#071936');
  fanBg.addColorStop(0.55, '#081f42');
  fanBg.addColorStop(1, '#051329');
  ctx.fillStyle = fanBg;
  ctx.fillRect(0, 0, width, height);

  // Sound-path concentric radial arcs (every 10 mm)
  ctx.lineWidth = 0.9;
  for (let rMm = 10; rMm <= maxSoundPathMm; rMm += 10) {
    const rPx = rMm * scalePxPerMm;
    ctx.strokeStyle = rMm % 20 === 0 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(51, 65, 85, 0.45)';
    ctx.beginPath();
    ctx.arc(originX, originY, rPx, canvasArcStart, canvasArcEnd);
    ctx.stroke();
  }

  // Angular ray guidelines inside sectorial fan
  const rayStepDeg = maxClampedDeg - minClampedDeg > 55 ? 10 : 5;
  for (let deg = Math.ceil(minClampedDeg / 5) * 5; deg <= maxClampedDeg; deg += rayStepDeg) {
    const endPt = polarUtToCanvas(originX, originY, scalePxPerMm, maxSoundPathMm, deg);
    const isStandardAngle = deg === 45 || deg === 60 || deg === 70;
    ctx.strokeStyle = isStandardAngle ? 'rgba(56, 189, 248, 0.34)' : 'rgba(51, 65, 85, 0.42)';
    ctx.lineWidth = isStandardAngle ? 1.1 : 0.8;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endPt.x, endPt.y);
    ctx.stroke();
  }

  // Crisp 1T Root/Backwall & 2T Top-Surface Skip Mirror lines INSIDE the active PAUT fan
  drawHorizontalBoundaryLine(backwall1TY, 'rgba(226, 232, 240, 0.65)', true);
  if (showSkipMirror) {
    drawHorizontalBoundaryLine(skip2TY, 'rgba(56, 189, 248, 0.55)', true);
  }

  // Illuminated Weld Bevel Geometry & Multi-Leg Mirror INSIDE the angular graduation!
  if (isWeldOverlayVisible) {
    drawWeldGeometryCrossSection(ctx, {
      weldCenterX,
      originY,
      scalePx: scalePxPerMm,
      thicknessMm: T,
      bevelConfig,
      showSkipMirror,
      emphasis: 'active_inside_fan',
      isAr,
    });
  }

  // Render Physically Positioned Flaw Echoes (Leg 1 Direct & Leg 2 Skip Mirror)
  if (flaw && flaw.id !== 'sound_weld') {
    const gainMult = Math.pow(10, (gainDb - 42) / 22) * (isTcgCalibrated ? 1.1 : 0.88);
    const baseFactor = flaw.baseIntensity ?? 1.0;

    for (const proj of summary.projections) {
      if (!proj.isInsideSector) continue;

      const legAtten = proj.leg === 1 ? 1.0 : isTcgCalibrated ? 0.92 : 0.72;
      const intensity = Math.min(1.0, Math.max(0, baseFactor * gainMult * legAtten));
      if (intensity < 0.08) continue;

      const echoPt = polarUtToCanvas(
        originX,
        originY,
        scalePxPerMm,
        proj.soundPathMm,
        proj.beamAngleDeg
      );

      const rx = Math.max(8, 18 * intensity);
      const ry = Math.max(5, 10.5 * intensity);
      const rotRad = -((proj.beamAngleDeg * Math.PI) / 180) * 0.45;

      const grad = ctx.createRadialGradient(echoPt.x, echoPt.y, 1.5, echoPt.x, echoPt.y, rx * 1.15);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.98)'); // OmniScan Red 80-100% FSH
      grad.addColorStop(0.32, 'rgba(245, 158, 11, 0.90)'); // Amber-Orange 55-80%
      grad.addColorStop(0.62, 'rgba(34, 197, 94, 0.65)'); // Green 30-55%
      grad.addColorStop(0.85, 'rgba(6, 182, 212, 0.35)'); // Cyan 15-30%
      grad.addColorStop(1, 'rgba(14, 116, 144, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      safeEllipse(ctx, echoPt.x, echoPt.y, rx, ry, rotRad);
      ctx.fill();

      // Planar Upper/Lower Tip Diffraction Echo Spot
      if (flaw.isPlanar && flaw.heightMm >= 1.5) {
        const tipShiftPx = flaw.heightMm * scalePxPerMm * (proj.leg === 1 ? -1 : 1);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.95)';
        ctx.beginPath();
        ctx.arc(echoPt.x, echoPt.y + tipShiftPx, 2.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Focal Depth Arc Marker inside Sector
  const focusRadiusPx = focalDepthMm * scalePxPerMm;
  if (focusRadiusPx > 6 && focusRadiusPx < fanRadiusPx) {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.42)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(originX, originY, focusRadiusPx, canvasArcStart, canvasArcEnd);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // =========================================================================
  // PASS 3: Crisp Sectorial Fan Border & Outer Protractor Angular Graduation
  // =========================================================================
  if (scanLawMode === 'sectorial') {
    const startEdge = polarUtToCanvas(originX, originY, scalePxPerMm, maxSoundPathMm, minClampedDeg);
    const endEdge = polarUtToCanvas(originX, originY, scalePxPerMm, maxSoundPathMm, maxClampedDeg);

    // Sectorial boundary frame
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(startEdge.x, startEdge.y);
    ctx.arc(originX, originY, fanRadiusPx, canvasArcStart, canvasArcEnd);
    ctx.closePath();
    ctx.stroke();

    // Outer Protractor Graduation Ticks (1° minor, 5° major, labeled degrees)
    const labelEveryDeg = maxClampedDeg - minClampedDeg > 50 ? 15 : 5;
    for (let deg = Math.ceil(minClampedDeg); deg <= Math.floor(maxClampedDeg); deg += 1) {
      const isMajor = deg % 5 === 0;
      const tickLenPx = isMajor ? 6.5 : 3.0;
      const pInner = polarUtToCanvas(originX, originY, 1, fanRadiusPx, deg);
      const pOuter = polarUtToCanvas(originX, originY, 1, fanRadiusPx + tickLenPx, deg);

      ctx.strokeStyle = isMajor ? '#38bdf8' : 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = isMajor ? 1.2 : 0.75;
      ctx.beginPath();
      ctx.moveTo(pInner.x, pInner.y);
      ctx.lineTo(pOuter.x, pOuter.y);
      ctx.stroke();

      if (deg % labelEveryDeg === 0) {
        const pText = polarUtToCanvas(originX, originY, 1, fanRadiusPx + 13, deg);
        ctx.fillStyle = deg === 45 || deg === 60 || deg === 70 ? '#7dd3fc' : '#94a3b8';
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText(`${deg}°`, pText.x - 7, pText.y + 3);
      }
    }
  }

  // =========================================================================
  // PASS 4: Active Steering Angle Cursor Ray + Focal Spot + Rulers + Wedge
  // =========================================================================
  const clampedCursorDeg = Math.max(minClampedDeg, Math.min(maxClampedDeg, selectedAngleDeg));
  const cursorEnd = polarUtToCanvas(originX, originY, scalePxPerMm, maxSoundPathMm, clampedCursorDeg);

  if (showFocalBeamCone) {
    const focusS = Math.min(maxSoundPathMm, focalDepthMm / Math.max(0.18, Math.cos((clampedCursorDeg * Math.PI) / 180)));
    const focalPt = polarUtToCanvas(originX, originY, scalePxPerMm, focusS, clampedCursorDeg);
    const apSpanPx = Math.min(20, apertureElements * 0.35);

    ctx.fillStyle = 'rgba(34, 211, 238, 0.13)';
    ctx.beginPath();
    ctx.moveTo(originX - apSpanPx * 0.5, originY);
    ctx.lineTo(focalPt.x, focalPt.y);
    ctx.lineTo(originX + apSpanPx * 0.5, originY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(focalPt.x, focalPt.y, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Active Cursor Ray (Crisp OmniScan Green/Cyan Cursor)
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.65;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(cursorEnd.x, cursorEnd.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Left Vertical True-Depth Ruler (Z in mm: 0, 1T, 2T)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  const maxRulerZ = showSkipMirror ? 2 * T : T;
  const maxRulerY = Math.min(height - 10, originY + maxRulerZ * scalePxPerMm);
  ctx.beginPath();
  ctx.moveTo(originX - 10, originY);
  ctx.lineTo(originX - 10, maxRulerY);
  ctx.stroke();

  const zStep = T >= 24 ? 10 : 5;
  ctx.font = '8px monospace';
  for (let zMm = 0; zMm <= maxRulerZ; zMm += zStep) {
    const yTick = originY + zMm * scalePxPerMm;
    if (yTick > height - 8) break;
    ctx.strokeStyle = zMm === T || zMm === 2 * T ? '#fbbf24' : '#475569';
    ctx.beginPath();
    ctx.moveTo(originX - 14, yTick);
    ctx.lineTo(originX - 10, yTick);
    ctx.stroke();

    if (zMm % 10 === 0 || zMm === T || zMm === 2 * T) {
      ctx.fillStyle = zMm === T ? '#fbbf24' : zMm === 2 * T ? '#38bdf8' : '#64748b';
      const label = zMm === T ? `1T(${T})` : zMm === 2 * T ? `2T(${2 * T})` : `${zMm}`;
      ctx.fillText(label, 4, yTick + 3);
    }
  }

  // Top Horizontal Index Ruler (X in mm) & Standoff X0 Indicator to Weld CL
  ctx.strokeStyle = '#334155';
  for (let xMm = 10; xMm <= 80; xMm += 10) {
    const xTick = originX + xMm * scalePxPerMm;
    if (xTick > width - 38) break;
    ctx.beginPath();
    ctx.moveTo(xTick, originY - 4);
    ctx.lineTo(xTick, originY);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '7.5px monospace';
    ctx.fillText(`${xMm}`, xTick - 5, originY - 6);
  }

  // Probe Index Standoff Dimension Line (0 -> X0 Weld CL)
  if (isWeldOverlayVisible && weldCenterX > originX + 24 && weldCenterX < width - 36) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(originX + 14, 11);
    ctx.lineTo(weldCenterX, 11);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`X0=${probeIndexOffsetMm}mm`, (originX + weldCenterX) * 0.5 - 18, 9);
  }

  // Phased Array Wedge Footprint at Emission Index (originX, originY)
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(originX - 24, originY - 14, 34, 14);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  safeStrokeRect(ctx, originX - 24, originY - 14, 34, 14);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 7.5px monospace';
  ctx.fillText(`${apertureElements}E`, originX - 18, originY - 4);

  // Height Sizing Calipers (U1 / U2) in True Depth Coordinates
  if (showSizingCaliper) {
    const cal1Y = originY + caliperY1Mm * scalePxPerMm;
    const cal2Y = originY + caliperY2Mm * scalePxPerMm;
    const deltaH = Math.abs(caliperY2Mm - caliperY1Mm);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(originX + 12, cal1Y);
    ctx.lineTo(width - 38, cal1Y);
    ctx.moveTo(originX + 12, cal2Y);
    ctx.lineTo(width - 38, cal2Y);
    ctx.stroke();

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText(
      `Δh=${deltaH.toFixed(1)}mm`,
      Math.max(originX + 20, width - 108),
      (cal1Y + cal2Y) * 0.5 + 3
    );
  }

  // Right-Edge OmniScan Amplitude Color Scale Bar (0% .. 100% FSH)
  const barX = width - 16;
  const barY = 26;
  const barH = Math.max(60, height - 52);
  const ampGrad = ctx.createLinearGradient(barX, barY + barH, barX, barY);
  ampGrad.addColorStop(0, '#071936');
  ampGrad.addColorStop(0.25, '#06b6d4');
  ampGrad.addColorStop(0.5, '#22c55e');
  ampGrad.addColorStop(0.75, '#f59e0b');
  ampGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = ampGrad;
  ctx.fillRect(barX, barY, 7, barH);
  ctx.strokeStyle = '#334155';
  safeStrokeRect(ctx, barX, barY, 7, barH);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '7px monospace';
  ctx.fillText('100', barX - 8, barY - 3);
  ctx.fillText('0%', barX - 4, barY + barH + 9);

  // Active Flaw Zone / Leg Readout Badge at Bottom-Right of S-Scan
  if (summary.primaryActiveProjection && summary.primaryActiveProjection.isInsideSector) {
    const p = summary.primaryActiveProjection;
    const tagText = isAr
      ? `${p.weldZoneLabelAr} · θ=${p.beamAngleDeg.toFixed(0)}° · S=${p.soundPathMm.toFixed(1)}mm`
      : `${p.weldZoneLabelEn} · θ=${p.beamAngleDeg.toFixed(0)}° · S=${p.soundPathMm.toFixed(1)}mm`;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
    ctx.fillRect(originX + 4, height - 17, Math.min(width - originX - 42, tagText.length * 5.4 + 12), 14);
    ctx.fillStyle = p.leg === 1 ? '#fde68a' : '#7dd3fc';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText(tagText, originX + 9, height - 7);
  }

  return summary;
}
