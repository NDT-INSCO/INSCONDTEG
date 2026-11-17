import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Sun,
  Ruler,
  Crosshair,
  MapPin,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Contrast,
} from 'lucide-react';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import {
  RtWeldSpecimen,
  RtTechniqueSpec,
  RtFilmClassSpec,
  AsmeIqiWireSelection,
  FilmDensityEvaluation,
  RT_DEFECT_LABELS,
} from '../../../data/rtSimulationData';

export type NegatoscopeTool = 'iris' | 'densitometer' | 'caliper' | 'pin';

export interface FilmPinMarker {
  id: string;
  xMm: number;
  yOffsetMm: number;
  localDensity: number;
}

export interface CaliperMeasurement {
  startXMm: number;
  startYMm: number;
  endXMm: number;
  endYMm: number;
  lengthMm: number;
}

export interface RtNegatoscopeCanvasProps {
  language: Language;
  specimen: RtWeldSpecimen;
  technique: RtTechniqueSpec;
  filmClass: RtFilmClassSpec;
  sourceShortCode: string;
  sfdMm: number;
  ugMm: number;
  iqiSelection: AsmeIqiWireSelection;
  iqiPlacement: 'source_side' | 'film_side';
  filmEval: FilmDensityEvaluation;
  showInstructorOverlay: boolean;
  onToggleInstructorOverlay: () => void;
  onMeasuredLengthChange?: (lengthMm: number) => void;
}

const CANVAS_W = 920;
const CANVAS_H = 310;
const FILM_LENGTH_MM = 250;
const FILM_HEIGHT_MM = 84;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function mmToCanvasX(xMm: number): number {
  const margin = 46;
  const usableW = CANVAS_W - margin * 2;
  return margin + (xMm / FILM_LENGTH_MM) * usableW;
}

function mmToCanvasY(yOffsetMm: number): number {
  const centerY = CANVAS_H / 2 + 6;
  const pxPerMm = (CANVAS_H - 64) / FILM_HEIGHT_MM;
  return centerY + yOffsetMm * pxPerMm;
}

function canvasToMm(
  cx: number,
  cy: number
): { xMm: number; yOffsetMm: number } {
  const margin = 46;
  const usableW = CANVAS_W - margin * 2;
  const pxPerMmY = (CANVAS_H - 64) / FILM_HEIGHT_MM;
  const xMm = clamp(((cx - margin) / usableW) * FILM_LENGTH_MM, 0, FILM_LENGTH_MM);
  const yOffsetMm = clamp(
    (cy - (CANVAS_H / 2 + 6)) / pxPerMmY,
    -FILM_HEIGHT_MM / 2,
    FILM_HEIGHT_MM / 2
  );
  return {
    xMm: Number(xMm.toFixed(1)),
    yOffsetMm: Number(yOffsetMm.toFixed(1)),
  };
}

export const RtNegatoscopeCanvas: React.FC<RtNegatoscopeCanvasProps> = ({
  language,
  specimen,
  technique,
  filmClass,
  sourceShortCode,
  sfdMm,
  ugMm,
  iqiSelection,
  iqiPlacement,
  filmEval,
  showInstructorOverlay,
  onToggleInstructorOverlay,
  onMeasuredLengthChange,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTool, setActiveTool] = useState<NegatoscopeTool>('caliper');
  const [luxPercent, setLuxPercent] = useState<number>(78);
  const [spotIris, setSpotIris] = useState<boolean>(false);
  const [invertPolarity, setInvertPolarity] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.6 | 2.2>(1);

  const [cursorMm, setCursorMm] = useState<{
    xMm: number;
    yOffsetMm: number;
    density: number;
  }>({
    xMm: 125,
    yOffsetMm: 0,
    density: filmEval.weldMetalDensity,
  });

  const [loggedDensities, setLoggedDensities] = useState<
    Array<{ xMm: number; zone: string; density: number }>
  >([]);
  const [pins, setPins] = useState<FilmPinMarker[]>([]);
  const [caliper, setCaliper] = useState<CaliperMeasurement | null>(null);
  const [isDraggingCaliper, setIsDraggingCaliper] = useState<boolean>(false);

  // Reset annotations when specimen changes
  useEffect(() => {
    setPins([]);
    setCaliper(null);
    setLoggedDensities([]);
  }, [specimen.id]);

  // Compute exact local H&D optical density at any (xMm, yOffsetMm) on the radiograph
  const sampleOpticalDensityAt = useCallback(
    (xMm: number, yOffsetMm: number): number => {
      const halfWeld = specimen.weldWidthMm / 2;
      let d = filmEval.baseMetalDensity;

      if (technique.isEllipticalOffset) {
        // Elliptical double-wall projection: two separated weld rings
        const distTop = Math.abs(
          yOffsetMm + 9 - Math.sin((xMm / FILM_LENGTH_MM) * Math.PI) * 5
        );
        const distBot = Math.abs(
          yOffsetMm - 9 + Math.sin((xMm / FILM_LENGTH_MM) * Math.PI) * 5
        );
        if (distTop < halfWeld * 0.65 || distBot < halfWeld * 0.65) {
          d = filmEval.weldMetalDensity;
        }
      } else if (Math.abs(yOffsetMm) <= halfWeld) {
        const edgeRatio = Math.abs(yOffsetMm) / halfWeld;
        d =
          filmEval.weldMetalDensity +
          edgeRatio * edgeRatio * (filmEval.baseMetalDensity - filmEval.weldMetalDensity) * 0.55;
        // Root pass center is slightly thicker reinforcement -> slightly lower density (-0.08)
        if (Math.abs(yOffsetMm) <= 2.4) {
          d -= 0.08;
        }
      }

      // Apply flaw indication density perturbations
      for (const ind of specimen.indications) {
        const dx = Math.abs(xMm - ind.xMm);
        const dy = Math.abs(yOffsetMm - ind.yOffsetMm);
        if (dx <= ind.lengthMm / 2 + 0.8 && dy <= Math.max(1.2, ind.widthMm / 2 + 0.6)) {
          const falloff =
            1 - Math.min(1, (dx / (ind.lengthMm / 2 + 1.2)) * 0.35);
          d += ind.densityDelta * falloff * filmClass.contrastGamma;
        }
      }

      return Number(clamp(d, 0.25, 4.95).toFixed(2));
    },
    [
      specimen,
      technique.isEllipticalOffset,
      filmEval.baseMetalDensity,
      filmEval.weldMetalDensity,
      filmClass.contrastGamma,
    ]
  );

  // Convert client pointer event to internal canvas coordinates accounting for zoom
  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { cx: number; cy: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { cx: CANVAS_W / 2, cy: CANVAS_H / 2 };
    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const normY = (e.clientY - rect.top) / Math.max(1, rect.height);
    const rawX = normX * CANVAS_W;
    const rawY = normY * CANVAS_H;

    // Unproject zoom centered around middle of canvas
    const cx = (rawX - CANVAS_W / 2) / zoomLevel + CANVAS_W / 2;
    const cy = (rawY - CANVAS_H / 2) / zoomLevel + CANVAS_H / 2;
    return { cx, cy };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy } = getCanvasPoint(e);
    const { xMm, yOffsetMm } = canvasToMm(cx, cy);
    const density = sampleOpticalDensityAt(xMm, yOffsetMm);

    if (activeTool === 'caliper') {
      setIsDraggingCaliper(true);
      setCaliper({
        startXMm: xMm,
        startYMm: yOffsetMm,
        endXMm: xMm,
        endYMm: yOffsetMm,
        lengthMm: 0,
      });
    } else if (activeTool === 'densitometer') {
      const zone =
        Math.abs(yOffsetMm) <= specimen.weldWidthMm / 2
          ? isAr
            ? 'معدن اللحام'
            : 'Weld Metal'
          : isAr
            ? 'معدن الأساس'
            : 'Base Metal';
      setLoggedDensities(prev => [
        { xMm, zone, density },
        ...prev.slice(0, 3),
      ]);
    } else if (activeTool === 'pin') {
      setPins(prev => [
        ...prev,
        {
          id: `pin-${Date.now()}-${prev.length + 1}`,
          xMm,
          yOffsetMm,
          localDensity: density,
        },
      ]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy } = getCanvasPoint(e);
    const { xMm, yOffsetMm } = canvasToMm(cx, cy);
    const density = sampleOpticalDensityAt(xMm, yOffsetMm);
    setCursorMm({ xMm, yOffsetMm, density });

    if (isDraggingCaliper && activeTool === 'caliper') {
      setCaliper(prev => {
        if (!prev) return null;
        const dist = Math.hypot(xMm - prev.startXMm, yOffsetMm - prev.startYMm);
        const rounded = Number(dist.toFixed(1));
        return {
          ...prev,
          endXMm: xMm,
          endYMm: yOffsetMm,
          lengthMm: rounded,
        };
      });
    }
  };

  const handleMouseUp = () => {
    if (isDraggingCaliper) {
      setIsDraggingCaliper(false);
      if (caliper && caliper.lengthMm >= 0.5 && onMeasuredLengthChange) {
        onMeasuredLengthChange(caliper.lengthMm);
      }
    }
  };

  // Render high-realism industrial radiograph on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();

    // Apply optical zoom centered at canvas midpoint
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);

    // Map H&D Optical Density + Illuminator Lux into realistic luminance [0..255]
    // Higher H&D density = darker film; higher Negatoscope Lux = more transmitted light
    const densityToLum = (hd: number): number => {
      const luxBoost = (luxPercent / 75) * 1.15;
      // Transmittance-inspired perceptual curve centered around 2.6 H&D
      const raw = 242 * Math.exp(-0.78 * (hd / luxBoost));
      const clamped = clamp(Math.round(raw), 6, 248);
      return invertPolarity ? 255 - clamped : clamped;
    };

    const baseLum = densityToLum(filmEval.baseMetalDensity);
    const weldLum = densityToLum(filmEval.weldMetalDensity);
    const rootLum = densityToLum(Math.max(0.3, filmEval.weldMetalDensity - 0.14));

    // 1. Film Base Metal Background
    ctx.fillStyle = `rgb(${baseLum}, ${baseLum + 2}, ${Math.min(255, baseLum + 5)})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Unsharpness blur radius in pixels
    const pxPerMmX = (CANVAS_W - 92) / FILM_LENGTH_MM;
    const pxPerMmY = (CANVAS_H - 64) / FILM_HEIGHT_MM;
    const ugBlurPx = clamp((ugMm - 0.22) * 3.8, 0, 5.5);

    const centerY = mmToCanvasY(0);
    const weldHalfPx = (specimen.weldWidthMm / 2) * pxPerMmY;

    // 2. Weld Reinforcement Band & Root Profile (SWSI/DWSI Linear vs DWDI Elliptical)
    if (technique.isEllipticalOffset) {
      // Draw upper (source-side) and lower (film-side) elliptical weld rings
      ctx.save();
      for (const sign of [-1, 1]) {
        ctx.beginPath();
        for (let xm = 8; xm <= FILM_LENGTH_MM - 8; xm += 3) {
          const px = mmToCanvasX(xm);
          const arch = Math.sin((xm / FILM_LENGTH_MM) * Math.PI) * 14 * sign;
          const py = centerY + sign * 22 - arch * 0.45;
          if (xm === 8) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(${weldLum}, ${weldLum + 2}, ${Math.min(255, weldLum + 5)}, 0.92)`;
        ctx.lineWidth = weldHalfPx * 1.15;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.strokeStyle = `rgba(${rootLum}, ${rootLum + 2}, ${Math.min(255, rootLum + 6)}, 0.78)`;
        ctx.lineWidth = Math.max(4, weldHalfPx * 0.35);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Standard Linear Butt Weld Band with feathered reinforcement toes
      const weldGrad = ctx.createLinearGradient(
        0,
        centerY - weldHalfPx * 1.15,
        0,
        centerY + weldHalfPx * 1.15
      );
      const baseCss = `rgb(${baseLum}, ${baseLum + 2}, ${Math.min(255, baseLum + 5)})`;
      const weldCss = `rgb(${weldLum}, ${weldLum + 2}, ${Math.min(255, weldLum + 6)})`;
      const rootCss = `rgb(${rootLum}, ${rootLum + 3}, ${Math.min(255, rootLum + 8)})`;

      weldGrad.addColorStop(0, baseCss);
      weldGrad.addColorStop(0.14, weldCss);
      weldGrad.addColorStop(0.42, weldCss);
      weldGrad.addColorStop(0.5, rootCss);
      weldGrad.addColorStop(0.58, weldCss);
      weldGrad.addColorStop(0.86, weldCss);
      weldGrad.addColorStop(1, baseCss);

      ctx.fillStyle = weldGrad;
      ctx.fillRect(36, centerY - weldHalfPx * 1.15, CANVAS_W - 72, weldHalfPx * 2.3);

      // Subtle Weld Cap Chevron Ripples
      ctx.strokeStyle = invertPolarity
        ? 'rgba(30, 41, 59, 0.10)'
        : 'rgba(248, 250, 252, 0.08)';
      ctx.lineWidth = 1.2;
      for (let xm = 10; xm <= FILM_LENGTH_MM - 10; xm += 3.4) {
        const rx = mmToCanvasX(xm);
        ctx.beginPath();
        ctx.moveTo(rx - 4, centerY - weldHalfPx * 0.85);
        ctx.quadraticCurveTo(rx + 3, centerY, rx - 4, centerY + weldHalfPx * 0.85);
        ctx.stroke();
      }
    }

    // 3. Render Authentic Weld Discontinuities / Defects
    for (const ind of specimen.indications) {
      const ix = mmToCanvasX(ind.xMm);
      const iy = mmToCanvasY(ind.yOffsetMm);
      const halfLenPx = (ind.lengthMm / 2) * pxPerMmX;
      const halfWidPx = Math.max(1.6, (ind.widthMm / 2) * pxPerMmY);
      const indLum = densityToLum(
        clamp(filmEval.weldMetalDensity + ind.densityDelta * filmClass.contrastGamma, 0.3, 4.9)
      );

      ctx.save();
      if (ugBlurPx > 0.4 && typeof ctx.filter === 'string') {
        ctx.filter = `blur(${ugBlurPx.toFixed(1)}px)`;
      }

      if (ind.type === 'crack') {
        // Fine jagged branching root crack
        ctx.strokeStyle = `rgb(${indLum}, ${indLum}, ${indLum})`;
        ctx.lineWidth = Math.max(1.7, halfWidPx * 1.1);
        ctx.lineCap = 'round';
        ctx.beginPath();
        const steps = 14;
        for (let s = 0; s <= steps; s += 1) {
          const t = s / steps;
          const px = ix - halfLenPx + t * halfLenPx * 2;
          const jag =
            Math.sin(s * 2.3) * 2.2 + (s % 2 === 0 ? 1.1 : -1.1) * Math.sin(t * Math.PI);
          if (s === 0) ctx.moveTo(px, iy);
          else ctx.lineTo(px, iy + jag);
        }
        ctx.stroke();
        // Micro branch near middle
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(ix + 4, iy + 0.8);
        ctx.lineTo(ix + 12, iy - 4.2);
        ctx.stroke();
      } else if (ind.type === 'incomplete_penetration') {
        // Sharp-edged straight dark band along root centerline
        ctx.fillStyle = `rgb(${indLum}, ${indLum}, ${indLum})`;
        ctx.fillRect(ix - halfLenPx, iy - halfWidPx, halfLenPx * 2, halfWidPx * 2);
      } else if (ind.type === 'lack_of_fusion') {
        // Straight thin sharp line displaced along sidewall bevel
        ctx.strokeStyle = `rgb(${indLum}, ${indLum}, ${indLum})`;
        ctx.lineWidth = Math.max(2.1, halfWidPx * 1.25);
        ctx.beginPath();
        ctx.moveTo(ix - halfLenPx, iy);
        ctx.lineTo(ix + halfLenPx, iy + 0.6);
        ctx.stroke();
      } else if (ind.type === 'slag_inclusion') {
        // Irregular ragged interpass / wagon-track slag line
        ctx.fillStyle = `rgb(${indLum}, ${indLum}, ${indLum})`;
        ctx.beginPath();
        const segs = 12;
        for (let s = 0; s <= segs; s += 1) {
          const px = ix - halfLenPx + (s / segs) * halfLenPx * 2;
          const wob = halfWidPx * (0.7 + 0.45 * Math.abs(Math.sin(s * 1.9)));
          if (s === 0) ctx.moveTo(px, iy - wob * 0.4);
          else ctx.lineTo(px, iy - wob);
        }
        for (let s = segs; s >= 0; s -= 1) {
          const px = ix - halfLenPx + (s / segs) * halfLenPx * 2;
          const wob = halfWidPx * (0.65 + 0.45 * Math.abs(Math.cos(s * 1.7)));
          ctx.lineTo(px, iy + wob);
        }
        ctx.closePath();
        ctx.fill();
      } else if (ind.type === 'porosity') {
        // Clustered gas pores + wormhole tail if primary cluster, or single pore
        ctx.fillStyle = `rgb(${indLum}, ${indLum}, ${indLum})`;
        if (ind.lengthMm > 5) {
          const offsets = [
            [-24, -3, 3.2],
            [-17, 2.5, 2.6],
            [-11, -1.5, 3.8],
            [-4, 3.5, 2.9],
            [2, -2.5, 4.1],
            [9, 1.8, 3.4],
            [16, -3.2, 2.7],
            [22, 0.5, 3.1],
            [-7, 0.2, 2.2],
            [13, -0.8, 2.3],
          ];
          for (const [ox, oy, rad] of offsets) {
            ctx.beginPath();
            ctx.arc(ix + ox, iy + oy, rad, 0, Math.PI * 2);
            ctx.fill();
          }
          // Wormhole herringbone tail on largest pore
          ctx.lineWidth = 2.2;
          ctx.strokeStyle = `rgb(${indLum}, ${indLum}, ${indLum})`;
          ctx.beginPath();
          ctx.moveTo(ix + 2, iy - 2.5);
          ctx.lineTo(ix + 9, iy - 7.5);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(ix, iy, Math.max(2.6, halfWidPx * 1.3), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (ind.type === 'tungsten_inclusion') {
        // Dense bright WHITE high-attenuation particle(s)
        const brightLum = invertPolarity ? 24 : 246;
        ctx.fillStyle = `rgb(${brightLum}, ${brightLum}, ${brightLum})`;
        ctx.beginPath();
        ctx.ellipse(ix, iy, 3.8, 2.9, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ix + 9, iy + 2.2, 1.9, 0, Math.PI * 2);
        ctx.fill();
      } else if (ind.type === 'undercut') {
        // Diffuse dark shadow band along root bead edge
        const ucGrad = ctx.createLinearGradient(0, iy - halfWidPx * 1.8, 0, iy + halfWidPx * 1.8);
        ucGrad.addColorStop(0, `rgba(${indLum}, ${indLum}, ${indLum}, 0.08)`);
        ucGrad.addColorStop(0.5, `rgba(${indLum}, ${indLum}, ${indLum}, 0.88)`);
        ucGrad.addColorStop(1, `rgba(${indLum}, ${indLum}, ${indLum}, 0.08)`);
        ctx.fillStyle = ucGrad;
        ctx.fillRect(ix - halfLenPx, iy - halfWidPx * 1.6, halfLenPx * 2, halfWidPx * 3.2);
      }

      ctx.restore();

      // Optional Instructor Ground-Truth Callout Box
      if (showInstructorOverlay) {
        ctx.save();
        ctx.strokeStyle = ind.densityDelta < 0 ? '#38bdf8' : '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(
          ix - halfLenPx - 8,
          iy - Math.max(12, halfWidPx + 8),
          halfLenPx * 2 + 16,
          Math.max(24, halfWidPx * 2 + 16)
        );
        ctx.setLineDash([]);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ix - 54, iy - 32, 108, 16);
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${RT_DEFECT_LABELS[ind.type].codeAbbr} · ${ind.lengthMm}mm`,
          ix,
          iy - 21
        );
        ctx.restore();
      }
    }

    // 4. ASTM 6-Wire IQI Penetrameter Pack Across Weld (Around x = 42..64 mm)
    const iqiXStart = mmToCanvasX(34);
    const iqiBoxW = 58;
    const iqiBoxH = weldHalfPx * 2.5;
    ctx.save();
    ctx.strokeStyle = invertPolarity
      ? 'rgba(15, 23, 42, 0.35)'
      : 'rgba(226, 232, 240, 0.32)';
    ctx.lineWidth = 1;
    ctx.strokeRect(iqiXStart, centerY - iqiBoxH / 2, iqiBoxW, iqiBoxH);

    // Draw 6 wires from thickest (index 5) to thinnest (index 0)
    for (let wIdx = 0; wIdx < 6; wIdx += 1) {
      const wx = iqiXStart + 7 + wIdx * 8.6;
      // Wire index 5 is thickest (always easiest to see), index 0 is finest
      const reverseRank = 6 - wIdx; // 6 down to 1
      const isVisible = reverseRank <= filmEval.visibleWiresCount;
      const alpha = isVisible
        ? clamp(0.28 + wIdx * 0.12, 0.25, 0.92)
        : 0.04;
      ctx.strokeStyle = invertPolarity
        ? `rgba(15, 23, 42, ${alpha})`
        : `rgba(248, 250, 252, ${alpha})`;
      ctx.lineWidth = 0.8 + wIdx * 0.32;
      ctx.beginPath();
      ctx.moveTo(wx, centerY - iqiBoxH / 2 + 4);
      ctx.lineTo(wx, centerY + iqiBoxH / 2 - 4);
      ctx.stroke();
    }

    ctx.fillStyle = invertPolarity ? '#0f172a' : '#f1f5f9';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `ASTM ${iqiSelection.setId.replace('Set ', '')}${iqiPlacement === 'film_side' ? ' F' : ''}`,
      iqiXStart + 2,
      centerY - iqiBoxH / 2 - 5
    );
    ctx.restore();

    // 5. Lead Identification Letters & Millimeter Location Tape Along Top & Bottom Film Edges
    const leadColor = invertPolarity ? '#0f172a' : '#f8fafc';
    ctx.fillStyle = leadColor;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `INSCO RT · ${specimen.weldTag} · ${sourceShortCode} · SFD ${sfdMm}mm`,
      46,
      24
    );
    ctx.textAlign = 'right';
    ctx.fillText(`${filmClass.code} · D=${filmEval.weldMetalDensity}`, CANVAS_W - 46, 24);

    // Numbered Lead Location Markers (0 to 250 mm every 25 mm)
    ctx.strokeStyle = leadColor;
    ctx.lineWidth = 1;
    ctx.font = '9.5px monospace';
    ctx.textAlign = 'center';
    for (let m = 0; m <= FILM_LENGTH_MM; m += 25) {
      const mx = mmToCanvasX(m);
      ctx.beginPath();
      ctx.moveTo(mx, CANVAS_H - 24);
      ctx.lineTo(mx, CANVAS_H - 17);
      ctx.stroke();
      ctx.fillText(`${m}`, mx, CANVAS_H - 7);
    }

    // Backscatter light "B" artifact if backscatter occurred without proper shielding
    if (filmEval.backscatterFogTriggered) {
      ctx.save();
      ctx.fillStyle = invertPolarity
        ? 'rgba(15, 23, 42, 0.28)'
        : 'rgba(255, 255, 255, 0.25)';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('B', CANVAS_W - 86, CANVAS_H - 46);
      ctx.restore();
    }

    // 6. Subtle Silver-Halide Film Grain Stipple
    const grainAlpha = clamp(0.035 * filmClass.grainNoiseFactor, 0.015, 0.08);
    ctx.fillStyle = invertPolarity
      ? `rgba(0, 0, 0, ${grainAlpha})`
      : `rgba(255, 255, 255, ${grainAlpha})`;
    for (let gx = 40; gx < CANVAS_W - 40; gx += 19) {
      for (let gy = 34; gy < CANVAS_H - 30; gy += 17) {
        const jx = ((gx * 37 + gy * 13) % 11) - 5;
        const jy = ((gx * 17 + gy * 29) % 9) - 4;
        ctx.fillRect(gx + jx, gy + jy, 1.4, 1.4);
      }
    }

    // 7. Interactive Inspector Pins
    pins.forEach((pin, idx) => {
      const px = mmToCanvasX(pin.xMm);
      const py = mmToCanvasY(pin.yOffsetMm);
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`#${idx + 1} (${pin.xMm}mm)`, px + 12, py + 4);
      ctx.restore();
    });

    // 8. Interactive Vernier Caliper Measurement Overlay
    if (caliper) {
      const sx = mmToCanvasX(caliper.startXMm);
      const sy = mmToCanvasY(caliper.startYMm);
      const ex = mmToCanvasX(caliper.endXMm);
      const ey = mmToCanvasY(caliper.endYMm);

      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // End ticks
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();

      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2 - 12;
      ctx.fillStyle = '#083344';
      ctx.fillRect(midX - 38, midY - 11, 76, 16);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - 38, midY - 11, 76, 16);
      ctx.fillStyle = '#ecfeff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L = ${caliper.lengthMm} mm`, midX, midY + 1);
      ctx.restore();
    }

    // 9. Collimated Darkroom Spot Iris Mask (Blocks peripheral glare around cursor)
    if (spotIris) {
      const spotX = mmToCanvasX(cursorMm.xMm);
      const spotY = mmToCanvasY(cursorMm.yOffsetMm);
      const irisGrad = ctx.createRadialGradient(spotX, spotY, 55, spotX, spotY, 155);
      irisGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      irisGrad.addColorStop(0.75, 'rgba(2, 6, 23, 0.72)');
      irisGrad.addColorStop(1, 'rgba(2, 6, 23, 0.94)');
      ctx.fillStyle = irisGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    ctx.restore();
  }, [
    specimen,
    technique,
    filmClass,
    sourceShortCode,
    sfdMm,
    ugMm,
    iqiSelection,
    iqiPlacement,
    filmEval,
    luxPercent,
    spotIris,
    invertPolarity,
    zoomLevel,
    pins,
    caliper,
    cursorMm,
    showInstructorOverlay,
  ]);

  const shellClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/90 border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className={`rounded-2xl border p-4 sm:p-6 space-y-4 ${shellClass}`}>
      {/* 1. Negatoscope Top Instrument Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        {/* Tool Mode Selector */}
        <div
          role="group"
          aria-label={isAr ? 'أدوات فحص الفيلم الإشعاعي' : 'Film inspection tools'}
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            data-testid="rt-tool-caliper"
            onClick={() => setActiveTool('caliper')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
              activeTool === 'caliper'
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'مسطرة القياس (Caliper)' : 'Measure Caliper'}</span>
          </button>

          <button
            type="button"
            data-testid="rt-tool-densitometer"
            onClick={() => setActiveTool('densitometer')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
              activeTool === 'densitometer'
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'مسبار الكثافة (H&D)' : 'Densitometer'}</span>
          </button>

          <button
            type="button"
            data-testid="rt-tool-pin"
            onClick={() => setActiveTool('pin')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
              activeTool === 'pin'
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'تحديد عيب (#Pin)' : 'Mark Indication'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSpotIris(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
              spotIris
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'قناع البؤرة (Spot Iris)' : 'Spot Iris Mask'}</span>
          </button>
        </div>

        {/* Zoom, Polarity & Instructor Overlay */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setZoomLevel(z => (z === 1 ? 1.6 : z === 1.6 ? 2.2 : 1))
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
          >
            {zoomLevel < 2.2 ? (
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{zoomLevel}x</span>
          </button>

          <button
            type="button"
            onClick={() => setInvertPolarity(v => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
          >
            <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{invertPolarity ? (isAr ? 'موجب' : 'Positive') : (isAr ? 'سالب أصلي' : 'Negative')}</span>
          </button>

          <button
            type="button"
            data-testid="rt-toggle-instructor-overlay"
            onClick={onToggleInstructorOverlay}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
              showInstructorOverlay
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {showInstructorOverlay ? (
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {showInstructorOverlay
                ? isAr
                  ? 'إخفاء تحديد العيوب المرجعي'
                  : 'Hide Key Overlay'
                : isAr
                  ? 'إظهار موقع العيب للتدريب'
                  : 'Reveal Flaw Guide'}
            </span>
          </button>

          {(pins.length > 0 || caliper || loggedDensities.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setPins([]);
                setCaliper(null);
                setLoggedDensities([]);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'مسح العلامات' : 'Clear Marks'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. High-Intensity LED Negatoscope Screen */}
      <div className="rounded-xl border-2 border-slate-800 bg-black p-2 sm:p-3 shadow-inner">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          data-testid="rt-negatoscope-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-auto block rounded-lg cursor-crosshair select-none"
        />
      </div>

      {/* 3. Live Illuminator Brightness Slider + Cursor Telemetry Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
        <div className="md:col-span-5 flex items-center gap-3">
          <label
            htmlFor="rt-negatoscope-lux"
            className="text-xs font-semibold whitespace-nowrap shrink-0"
          >
            {isAr
              ? `شدة إضاءة النيجاتوسكوب (${Math.round(luxPercent * 1150).toLocaleString()} Cd/m²):`
              : `Viewer Luminance (${Math.round(luxPercent * 1150).toLocaleString()} Cd/m²):`}
          </label>
          <input
            id="rt-negatoscope-lux"
            type="range"
            min={25}
            max={100}
            value={luxPercent}
            onChange={e => setLuxPercent(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div
          className={`md:col-span-7 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs font-mono tabular-nums ${mutedText}`}
        >
          <span>
            X={cursorMm.xMm}mm · Y={cursorMm.yOffsetMm > 0 ? `+${cursorMm.yOffsetMm}` : cursorMm.yOffsetMm}mm
          </span>
          <span aria-hidden="true">·</span>
          <span data-testid="rt-live-cursor-density" className="font-semibold text-cyan-600 dark:text-cyan-400">
            D = {cursorMm.density} H&amp;D
          </span>
          <span aria-hidden="true">·</span>
          <span>
            IQI: {filmEval.visibleWiresCount}/6 {isAr ? 'أسلاك واضحة' : 'wires visible'}
          </span>
          {caliper && caliper.lengthMm > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {isAr ? `الطول المقاس: ${caliper.lengthMm} مم` : `Measured: ${caliper.lengthMm} mm`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Logged Densitometer Spot Checks (if any) */}
      {loggedDensities.length > 0 && (
        <div className={`flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums pt-1 border-t border-slate-200 dark:border-slate-800 ${mutedText}`}>
          <span className="font-semibold">
            {isAr ? 'قراءات الدنسيتوميتر المسجلة:' : 'Logged Densitometer Spots:'}
          </span>
          {loggedDensities.map((spot, i) => (
            <span key={i}>
              [{spot.zone} @ {spot.xMm}mm: <strong>{spot.density} H&amp;D</strong>]
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
