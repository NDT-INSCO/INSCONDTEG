import React, { useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Activity, Calendar, Crosshair, Layers, Pause, Play, RotateCcw } from 'lucide-react';
import {
  GE_ISOTOPES,
  GeIsotopeSpec,
  GeSourceType,
  calculateIsotopeDecay
} from '../../../utils/geExposureTimeEngine';

export interface DecayCurvePoint {
  dayOffset: number;
  date: Date;
  isoDate: string;
  activityCi: number;
  fractionRemaining: number;
  percentRemaining: number;
}

export interface IsotopeDecayCurveChartProps {
  isotope: GeIsotopeSpec;
  initialActivityCi: number;
  initialCalibrationDate: string;
  measurementDate: string;
  onChangeMeasurementDate?: (newDate: string) => void;
  language: 'en' | 'ar';
  horizonHalfLives?: 2 | 3 | 5;
  onChangeHorizonHalfLives?: (mult: 2 | 3 | 5) => void;
  isPlaybackActive?: boolean;
  onTogglePlayback?: () => void;
  playbackSpeed?: 0.5 | 1 | 2;
  onChangePlaybackSpeed?: (speed: 0.5 | 1 | 2) => void;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function parseIsoDateUtc(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dateStr || '').trim());
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month, day));
  }
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function formatUtcDateIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addUtcDays(baseDate: Date, days: number): Date {
  return new Date(baseDate.getTime() + Math.round(days) * MS_PER_DAY);
}

const COMPARISON_COLORS: Record<string, string> = {
  ir192: '#f59e0b',
  se75: '#06b6d4',
  co60: '#8b5cf6',
  yb169: '#10b981'
};

export const IsotopeDecayCurveChart: React.FC<IsotopeDecayCurveChartProps> = ({
  isotope,
  initialActivityCi,
  initialCalibrationDate,
  measurementDate,
  onChangeMeasurementDate,
  language,
  horizonHalfLives: controlledHorizonHalfLives,
  onChangeHorizonHalfLives,
  isPlaybackActive = false,
  onTogglePlayback,
  playbackSpeed = 1,
  onChangePlaybackSpeed
}) => {
  const isAr = language === 'ar';
  const [uncontrolledHorizonHalfLives, setUncontrolledHorizonHalfLives] = useState<2 | 3 | 5>(3);
  const horizonHalfLives = controlledHorizonHalfLives ?? uncontrolledHorizonHalfLives;
  const setHorizonHalfLives = (mult: 2 | 3 | 5) => {
    setUncontrolledHorizonHalfLives(mult);
    onChangeHorizonHalfLives?.(mult);
  };
  const [showCompareIsotopes, setShowCompareIsotopes] = useState<boolean>(false);
  const [hoverDayOffset, setHoverDayOffset] = useState<number | null>(null);

  const safeInitialCi = Math.max(1, Number.isFinite(initialActivityCi) ? initialActivityCi : 45);
  const isGamma = isotope.category === 'gamma' && isotope.halfLifeDays > 0;

  const calibDateUtc = useMemo(
    () => parseIsoDateUtc(initialCalibrationDate),
    [initialCalibrationDate]
  );
  const shotDateUtc = useMemo(
    () => parseIsoDateUtc(measurementDate),
    [measurementDate]
  );

  const rawSignedDays = useMemo(
    () => Math.round((shotDateUtc.getTime() - calibDateUtc.getTime()) / MS_PER_DAY),
    [calibDateUtc, shotDateUtc]
  );

  const liveDecay = useMemo(
    () =>
      calculateIsotopeDecay(
        safeInitialCi,
        initialCalibrationDate,
        measurementDate,
        isotope.halfLifeDays
      ),
    [safeInitialCi, initialCalibrationDate, measurementDate, isotope.halfLifeDays]
  );

  // SVG Layout Geometry
  const svgWidth = 760;
  const svgHeight = 300;
  const margin = { top: 32, right: 56, bottom: 48, left: 58 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Dynamic X-domain spanning chosen half-life multiples & always enclosing current shot date
  const domainMaxDays = useMemo(() => {
    if (!isGamma) return 180;
    const baseSpan = Math.ceil(isotope.halfLifeDays * horizonHalfLives);
    const shotBound = Math.max(0, liveDecay.daysElapsed);
    if (shotBound > baseSpan * 0.92) {
      return Math.ceil(Math.max(shotBound * 1.15, shotBound + isotope.halfLifeDays * 0.25));
    }
    return Math.max(30, baseSpan);
  }, [isGamma, isotope.halfLifeDays, horizonHalfLives, liveDecay.daysElapsed]);

  const domainEndDate = useMemo(
    () => addUtcDays(calibDateUtc, domainMaxDays),
    [calibDateUtc, domainMaxDays]
  );

  // D3 Scales
  const xTimeScale = useMemo(
    () =>
      d3
        .scaleUtc()
        .domain([calibDateUtc, domainEndDate])
        .range([margin.left, svgWidth - margin.right]),
    [calibDateUtc, domainEndDate, margin.left, margin.right, svgWidth]
  );

  const xDayScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, domainMaxDays])
        .range([margin.left, svgWidth - margin.right])
        .clamp(true),
    [domainMaxDays, margin.left, margin.right, svgWidth]
  );

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, safeInitialCi])
        .range([svgHeight - margin.bottom, margin.top]),
    [safeInitialCi, svgHeight, margin.bottom, margin.top]
  );

  // Sample points along the exponential decay curve
  const curvePoints = useMemo<DecayCurvePoint[]>(() => {
    const sampleCount = 120;
    const pts: DecayCurvePoint[] = [];
    for (let i = 0; i <= sampleCount; i++) {
      const dayOffset = (i / sampleCount) * domainMaxDays;
      const date = new Date(calibDateUtc.getTime() + dayOffset * MS_PER_DAY);
      const fraction = isGamma ? Math.pow(0.5, dayOffset / isotope.halfLifeDays) : 1;
      const activityCi = safeInitialCi * fraction;
      pts.push({
        dayOffset,
        date,
        isoDate: formatUtcDateIso(date),
        activityCi,
        fractionRemaining: fraction,
        percentRemaining: fraction * 100
      });
    }
    return pts;
  }, [calibDateUtc, domainMaxDays, isGamma, isotope.halfLifeDays, safeInitialCi]);

  // D3 Line & Area generators
  const linePath = useMemo(() => {
    const generator = d3
      .line<DecayCurvePoint>()
      .x((d) => xDayScale(d.dayOffset))
      .y((d) => yScale(d.activityCi))
      .curve(d3.curveMonotoneX);
    return generator(curvePoints) || '';
  }, [curvePoints, xDayScale, yScale]);

  const areaPath = useMemo(() => {
    const generator = d3
      .area<DecayCurvePoint>()
      .x((d) => xDayScale(d.dayOffset))
      .y0(yScale(0))
      .y1((d) => yScale(d.activityCi))
      .curve(d3.curveMonotoneX);
    return generator(curvePoints) || '';
  }, [curvePoints, xDayScale, yScale]);

  // Optional comparison curves for the other gamma isotopes on the same day domain
  const comparisonCurves = useMemo(() => {
    if (!isGamma || !showCompareIsotopes) return [];
    const gammaKeys: GeSourceType[] = ['ir192', 'se75', 'co60', 'yb169'];
    return gammaKeys
      .filter((k) => k !== isotope.id)
      .map((k) => {
        const spec = GE_ISOTOPES[k];
        const pts: Array<{ dayOffset: number; activityCi: number }> = [];
        const steps = 80;
        for (let i = 0; i <= steps; i++) {
          const dayOffset = (i / steps) * domainMaxDays;
          const frac = Math.pow(0.5, dayOffset / spec.halfLifeDays);
          pts.push({ dayOffset, activityCi: safeInitialCi * frac });
        }
        const path =
          d3
            .line<{ dayOffset: number; activityCi: number }>()
            .x((d) => xDayScale(d.dayOffset))
            .y((d) => yScale(d.activityCi))
            .curve(d3.curveMonotoneX)(pts) || '';
        return {
          spec,
          color: COMPARISON_COLORS[k] || '#94a3b8',
          path
        };
      });
  }, [isGamma, showCompareIsotopes, isotope.id, domainMaxDays, safeInitialCi, xDayScale, yScale]);

  // Half-life milestone coordinates (1 T1/2 = 50%, 2 T1/2 = 25%, etc.)
  const halfLifeMilestones = useMemo(() => {
    if (!isGamma) return [];
    const milestones: Array<{
      index: number;
      dayOffset: number;
      x: number;
      y: number;
      activityCi: number;
      percent: number;
      isoDate: string;
    }> = [];
    const maxN = Math.floor(domainMaxDays / isotope.halfLifeDays);
    for (let n = 1; n <= Math.min(maxN, 5); n++) {
      const dayOffset = n * isotope.halfLifeDays;
      const fraction = Math.pow(0.5, n);
      const activityCi = safeInitialCi * fraction;
      milestones.push({
        index: n,
        dayOffset,
        x: xDayScale(dayOffset),
        y: yScale(activityCi),
        activityCi,
        percent: fraction * 100,
        isoDate: formatUtcDateIso(addUtcDays(calibDateUtc, dayOffset))
      });
    }
    return milestones;
  }, [isGamma, domainMaxDays, isotope.halfLifeDays, safeInitialCi, xDayScale, yScale, calibDateUtc]);

  // Vertical Shot Date Coordinates
  const clampedShotDays = Math.max(0, liveDecay.daysElapsed);
  const shotX = xDayScale(clampedShotDays);
  const shotY = yScale(isGamma ? liveDecay.currentCi : safeInitialCi);
  const shotPercentRemaining = isGamma
    ? Number((liveDecay.fractionRemaining * 100).toFixed(1))
    : 100;

  // Axis Ticks via D3
  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);
  const xTicks = useMemo(() => {
    const ticks = xTimeScale.ticks(6);
    const fmt = domainMaxDays > 500 ? d3.utcFormat('%b %Y') : d3.utcFormat('%b %d');
    return ticks.map((date) => ({
      date,
      x: xTimeScale(date),
      label: fmt(date)
    }));
  }, [xTimeScale, domainMaxDays]);

  // Hover point telemetry
  const hoverTelemetry = useMemo(() => {
    if (hoverDayOffset === null) return null;
    const clampedDay = Math.max(0, Math.min(domainMaxDays, Math.round(hoverDayOffset)));
    const date = addUtcDays(calibDateUtc, clampedDay);
    const isoDate = formatUtcDateIso(date);
    const fraction = isGamma ? Math.pow(0.5, clampedDay / isotope.halfLifeDays) : 1;
    const activityCi = Number((safeInitialCi * fraction).toFixed(2));
    const percentRemaining = Number((fraction * 100).toFixed(1));
    return {
      dayOffset: clampedDay,
      isoDate,
      activityCi,
      percentRemaining,
      x: xDayScale(clampedDay),
      y: yScale(activityCi),
      deltaFromShotDays: clampedDay - clampedShotDays
    };
  }, [
    hoverDayOffset,
    domainMaxDays,
    calibDateUtc,
    isGamma,
    isotope.halfLifeDays,
    safeInitialCi,
    xDayScale,
    yScale,
    clampedShotDays
  ]);

  // Compute day offset from pointer X event (supports both live browser rects and JSDOM fallback)
  const resolveDayFromPointerEvent = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      const svgEl = e.currentTarget.ownerSVGElement;
      let svgX = margin.left;
      if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        if (rect.width > 0) {
          svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
        } else if (typeof e.nativeEvent.offsetX === 'number' && e.nativeEvent.offsetX > 0) {
          svgX = e.nativeEvent.offsetX;
        } else if (e.clientX > 0) {
          svgX = e.clientX;
        }
      }
      const clampedSvgX = Math.max(margin.left, Math.min(svgWidth - margin.right, svgX));
      return Math.round(xDayScale.invert(clampedSvgX));
    },
    [margin.left, margin.right, svgWidth, xDayScale]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      setHoverDayOffset(resolveDayFromPointerEvent(e));
    },
    [resolveDayFromPointerEvent]
  );

  const handlePlotClick = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (!isGamma || !onChangeMeasurementDate) return;
      const dayOffset = resolveDayFromPointerEvent(e);
      const nextIso = formatUtcDateIso(addUtcDays(calibDateUtc, dayOffset));
      onChangeMeasurementDate(nextIso);
    },
    [isGamma, onChangeMeasurementDate, resolveDayFromPointerEvent, calibDateUtc]
  );

  const jumpToDaysOffset = useCallback(
    (days: number) => {
      if (!onChangeMeasurementDate) return;
      onChangeMeasurementDate(formatUtcDateIso(addUtcDays(calibDateUtc, days)));
    },
    [calibDateUtc, onChangeMeasurementDate]
  );

  const activeColor = isGamma ? '#f59e0b' : '#06b6d4';

  // Ensure label stays inside SVG viewport near edges
  const shotLabelAnchor =
    shotX > svgWidth - margin.right - 135
      ? 'end'
      : shotX < margin.left + 115
      ? 'start'
      : 'middle';

  return (
    <div
      data-testid="isotope-decay-curve-card"
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <Activity className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isAr
                ? `منحنى التحلل الإشعاعي التفاعلي D3 — ${isotope.nameAr}`
                : `Interactive Isotope Decay Curve (D3) — ${isotope.nameEn}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>
              {isGamma
                ? `T½ = ${isotope.halfLifeDays}d`
                : isAr
                ? 'مصدر كهربائي ثابت (بدون تحلل)'
                : 'Constant Potential Generator (Non-decaying)'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isGamma
                ? `A₀ = ${safeInitialCi} Ci (${initialCalibrationDate})`
                : `${isotope.nameEn}`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
              {isGamma
                ? isAr
                  ? `تاريخ التصوير: ${measurementDate} (${liveDecay.currentCi} Ci / ${shotPercentRemaining}%)`
                  : `Shot: ${measurementDate} (${liveDecay.currentCi} Ci / ${shotPercentRemaining}%)`
                : isAr
                ? `تاريخ التصوير: ${measurementDate}`
                : `Shot: ${measurementDate}`}
            </span>
          </div>
        </div>

        {/* Interactive Controls */}
        {isGamma && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="isotope-decay-compare-btn"
              onClick={() => setShowCompareIsotopes((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                showCompareIsotopes
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-600 dark:text-sky-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'مقارنة النظائر' : 'Compare Isotopes'}</span>
            </button>

            <div
              role="group"
              aria-label={isAr ? 'نطاق أنصاف العمر' : 'Half-life range'}
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono"
            >
              {([2, 3, 5] as const).map((mult) => (
                <button
                  key={mult}
                  type="button"
                  data-testid={`isotope-decay-horizon-${mult}`}
                  onClick={() => setHorizonHalfLives(mult)}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer whitespace-nowrap ${
                    horizonHalfLives === mult
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {mult}×T½
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Hover / Crosshair Telemetry Strip */}
      <div
        data-testid="isotope-decay-hover-readout"
        className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono tabular-nums"
      >
        {hoverTelemetry ? (
          <div className="flex flex-wrap items-center gap-3 text-slate-700 dark:text-slate-200">
            <span className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
              <Crosshair className="w-3.5 h-3.5" />
              <span>{hoverTelemetry.isoDate}</span>
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>+{hoverTelemetry.dayOffset}d</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <strong className="text-amber-600 dark:text-amber-400">
              {hoverTelemetry.activityCi} Ci ({hoverTelemetry.percentRemaining}%)
            </strong>
            {onChangeMeasurementDate && isGamma && (
              <>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {isAr ? 'اضغط لتحديد تاريخ التصوير' : 'Click curve to set shot date'}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
            <Crosshair className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isGamma
                ? isAr
                  ? 'مرّر المؤشر على المنحنى لاستعراض النشاط المستقبلي أو اضغط لتغيير تاريخ التصوير الفعلي.'
                  : 'Hover across the curve to inspect decayed activity, or click anywhere to move the Shot Date marker.'
                : isAr
                ? 'أنبوبة الأشعة السينية تعمل بجهد مستمر ولا تخضع للتحلل الإشعاعي.'
                : 'X-Ray tubes maintain 100% output at constant kV/mA with zero radioactive decay.'}
            </span>
          </div>
        )}

        {rawSignedDays < 0 && isGamma && (
          <span className="text-rose-500 font-semibold">
            {isAr
              ? 'تاريخ التصوير يسبق تاريخ المعايرة (مقيد عند t₀)'
              : 'Shot date precedes calibration (clamped at t₀)'}
          </span>
        )}
      </div>

      {/* Main D3 SVG Canvas */}
      <div className="relative overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-slate-200 dark:border-slate-800">
        <svg
          data-testid="isotope-decay-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={
            isAr
              ? `منحنى التحلل الإشعاعي للنظير ${isotope.nameAr} مع خط تاريخ التصوير ${measurementDate}`
              : `Radioactive decay curve for ${isotope.nameEn} with vertical shot date line at ${measurementDate}`
          }
          className="w-full h-auto min-w-[540px] select-none"
        >
          <defs>
            <linearGradient id="ge-decay-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity={0.28} />
              <stop offset="100%" stopColor={activeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines + Left Y-Axis (Ci) + Right Y-Axis (%) */}
          {yTicks.map((tickVal) => {
            const yPos = yScale(tickVal);
            const pct = Math.round((tickVal / safeInitialCi) * 100);
            return (
              <g key={`y-${tickVal}`}>
                <line
                  x1={margin.left}
                  x2={svgWidth - margin.right}
                  y1={yPos}
                  y2={yPos}
                  stroke="#334155"
                  strokeOpacity={0.2}
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#94a3b8"
                >
                  {Number.isInteger(tickVal) ? tickVal : tickVal.toFixed(1)}
                </text>
                <text
                  x={svgWidth - margin.right + 8}
                  y={yPos + 3}
                  textAnchor="start"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#64748b"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Vertical Gridlines & X-Axis Date Ticks */}
          {xTicks.map((tick, idx) => (
            <g key={`x-${idx}`}>
              <line
                x1={tick.x}
                x2={tick.x}
                y1={margin.top}
                y2={svgHeight - margin.bottom}
                stroke="#334155"
                strokeOpacity={0.14}
                strokeDasharray="2 4"
              />
              <text
                x={tick.x}
                y={svgHeight - margin.bottom + 16}
                textAnchor="middle"
                fontSize="10"
                fontFamily="monospace"
                fill="#94a3b8"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Axes Frame */}
          <line
            x1={margin.left}
            x2={svgWidth - margin.right}
            y1={svgHeight - margin.bottom}
            y2={svgHeight - margin.bottom}
            stroke="#475569"
            strokeWidth={1.25}
          />
          <line
            x1={margin.left}
            x2={margin.left}
            y1={margin.top}
            y2={svgHeight - margin.bottom}
            stroke="#475569"
            strokeWidth={1.25}
          />
          <line
            x1={svgWidth - margin.right}
            x2={svgWidth - margin.right}
            y1={margin.top}
            y2={svgHeight - margin.bottom}
            stroke="#475569"
            strokeWidth={1}
            strokeOpacity={0.45}
          />

          {/* Axis Titles */}
          <text
            x={margin.left}
            y={18}
            fontSize="10"
            fontFamily="monospace"
            fill="#94a3b8"
          >
            {isGamma ? 'Activity (Ci)' : 'Output (%)'}
          </text>
          <text
            x={svgWidth - margin.right}
            y={18}
            textAnchor="end"
            fontSize="10"
            fontFamily="monospace"
            fill="#94a3b8"
          >
            Remaining (%)
          </text>
          <text
            x={margin.left + plotWidth / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            fontSize="10"
            fontFamily="monospace"
            fill="#64748b"
          >
            {isGamma
              ? `Timeline from Calibration (${initialCalibrationDate}) · Elapsed Days`
              : 'Constant Potential Operating Envelope'}
          </text>

          {/* Optional Comparison Isotope Curves */}
          {comparisonCurves.map((cmp) => (
            <g key={cmp.spec.id} opacity={0.55}>
              <path
                data-testid={`isotope-decay-compare-${cmp.spec.id}`}
                d={cmp.path}
                fill="none"
                stroke={cmp.color}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                className="rt-beam-curve-transition"
              />
            </g>
          ))}

          {/* Shaded Area under Primary Decay Curve */}
          {areaPath && (
            <path d={areaPath} fill="url(#ge-decay-area-grad)" className="rt-beam-curve-transition" />
          )}

          {/* Primary Isotope Decay Curve */}
          <path
            data-testid="isotope-decay-path"
            d={linePath}
            fill="none"
            stroke={activeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            className="rt-beam-curve-transition"
          />

          {/* Half-Life Guide Lines & Dots */}
          {halfLifeMilestones.map((m) => (
            <g key={`hl-${m.index}`} data-testid={`isotope-decay-halflife-${m.index}`}>
              <line
                x1={m.x}
                x2={m.x}
                y1={m.y}
                y2={svgHeight - margin.bottom}
                stroke="#64748b"
                strokeOpacity={0.38}
                strokeDasharray="3 3"
              />
              <circle
                cx={m.x}
                cy={m.y}
                r={3.5}
                fill="#0f172a"
                stroke="#94a3b8"
                strokeWidth={1.5}
              />
              <text
                x={m.x}
                y={m.y - 8}
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="monospace"
                fill="#94a3b8"
              >
                {m.index}T½ ({m.percent}%)
              </text>
            </g>
          ))}

          {/* Current Shot Date Vertical Marker Line */}
          <g>
            <line
              data-testid="isotope-decay-shot-line"
              x1={shotX}
              x2={shotX}
              y1={margin.top}
              y2={svgHeight - margin.bottom}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 3"
              className={isPlaybackActive ? 'rt-beam-curve-transition-playback' : 'rt-beam-curve-transition'}
            />
            {/* Horizontal dashed guide from Shot point to Y-axis */}
            <line
              x1={margin.left}
              x2={shotX}
              y1={shotY}
              y2={shotY}
              stroke="#ef4444"
              strokeOpacity={0.4}
              strokeWidth={1}
              strokeDasharray="2 2"
              className={isPlaybackActive ? 'rt-beam-curve-transition-playback' : 'rt-beam-curve-transition'}
            />
            <circle
              data-testid="isotope-decay-shot-dot"
              cx={shotX}
              cy={shotY}
              r={5.5}
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth={2}
              className={isPlaybackActive ? 'rt-beam-curve-transition-playback' : 'rt-beam-curve-transition'}
            />
            <text
              data-testid="isotope-decay-shot-label"
              x={shotX}
              y={margin.top - 7}
              textAnchor={shotLabelAnchor}
              fontSize="10.5"
              fontWeight="bold"
              fontFamily="monospace"
              fill="#ef4444"
            >
              {isGamma
                ? `SHOT ${measurementDate} · ${liveDecay.currentCi} Ci`
                : `SHOT ${measurementDate}`}
            </text>
          </g>

          {/* Interactive Hover Crosshair */}
          {hoverTelemetry && (
            <g pointerEvents="none">
              <line
                data-testid="isotope-decay-hover-line"
                x1={hoverTelemetry.x}
                x2={hoverTelemetry.x}
                y1={margin.top}
                y2={svgHeight - margin.bottom}
                stroke="#06b6d4"
                strokeWidth={1.25}
              />
              <circle
                cx={hoverTelemetry.x}
                cy={hoverTelemetry.y}
                r={4.5}
                fill="#06b6d4"
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            </g>
          )}

          {/* Pointer Interaction Overlay */}
          <rect
            data-testid="isotope-decay-interaction-layer"
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            className="cursor-crosshair"
            onMouseMove={handlePointerMove}
            onMouseLeave={() => setHoverDayOffset(null)}
            onClick={handlePlotClick}
          />
        </svg>

        {/* Legend Strip when Comparison Mode is Enabled */}
        {isGamma && showCompareIsotopes && (
          <div className="flex flex-wrap items-center gap-4 pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-500">
              {isAr ? 'مقارنة منحنيات التحلل:' : 'Isotope Comparison:'}
            </span>
            {(['ir192', 'se75', 'co60', 'yb169'] as GeSourceType[]).map((key) => {
              const spec = GE_ISOTOPES[key];
              const isSelected = key === isotope.id;
              return (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-0.5 rounded-full"
                    style={{ backgroundColor: isSelected ? activeColor : COMPARISON_COLORS[key] }}
                  />
                  <span className={isSelected ? 'font-bold text-slate-900 dark:text-white' : ''}>
                    {spec.id.toUpperCase()} ({spec.halfLifeDays}d)
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Interactive Day Scrubber & Quick Jump Controls */}
      {isGamma && onChangeMeasurementDate && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
            {onTogglePlayback && (
              <button
                type="button"
                data-testid="isotope-decay-play-btn"
                onClick={onTogglePlayback}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isPlaybackActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500'
                }`}
              >
                {isPlaybackActive ? (
                  <Pause className="w-3 h-3 shrink-0" aria-hidden="true" />
                ) : (
                  <Play className="w-3 h-3 shrink-0" aria-hidden="true" />
                )}
                <span>{isPlaybackActive ? (isAr ? 'إيقاف 4D' : 'Pause') : (isAr ? 'تشغيل 4D' : 'Play 4D')}</span>
              </button>
            )}
            {onChangePlaybackSpeed && (
              <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-[10px]">
                {([0.5, 1, 2] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onChangePlaybackSpeed(spd)}
                    className={`px-1.5 py-1 font-bold cursor-pointer transition-colors ${
                      playbackSpeed === spd
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500">
              {isAr ? 'تحريك تاريخ التصوير:' : 'Scrub Shot Day:'}
            </span>
            <input
              type="range"
              data-testid="isotope-decay-day-scrubber"
              min={0}
              max={domainMaxDays}
              step={1}
              value={Math.min(domainMaxDays, clampedShotDays)}
              onChange={(e) => jumpToDaysOffset(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
              aria-label={isAr ? 'شريط تحريك يوم التصوير' : 'Shot date day offset scrubber'}
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              +{clampedShotDays}d
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="isotope-decay-jump-calib"
              onClick={() => jumpToDaysOffset(0)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:border-amber-500 transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span>t₀ (100%)</span>
            </button>
            <button
              type="button"
              data-testid="isotope-decay-jump-half1"
              onClick={() => jumpToDaysOffset(Math.round(isotope.halfLifeDays))}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:border-amber-500 transition cursor-pointer whitespace-nowrap"
            >
              1×T½ ({Math.round(isotope.halfLifeDays)}d)
            </button>
            <button
              type="button"
              data-testid="isotope-decay-jump-half2"
              onClick={() => jumpToDaysOffset(Math.round(isotope.halfLifeDays * 2))}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:border-amber-500 transition cursor-pointer whitespace-nowrap"
            >
              2×T½ ({Math.round(isotope.halfLifeDays * 2)}d)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
