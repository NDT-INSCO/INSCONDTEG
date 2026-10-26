import React, { useId, useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Crosshair,
  Download,
  Flame,
  Info,
  MapPin,
  Radar,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Language } from '../../../types';
import {
  DiscoveredDefectEntry,
  DiscoveredDefectSeverity,
  useDiscoveredDefectsLog,
} from '../../../utils/discoveredDefectsStore';
import { playCalibrationClick } from '../../../utils/ndtAudioFeedback';

export interface DiscoveredDefectsLogTableProps {
  language: Language;
  /** Optional callback to snap the 3D camera / probe onto a logged defect row */
  onFocusDefectIn3D?: (entry: DiscoveredDefectEntry) => void;
  /** Optional quick-scan trigger for empty state demonstration */
  onTriggerSampleScan?: () => void;
}

const SEVERITY_RANK: Record<DiscoveredDefectSeverity, number> = {
  Critical: 4,
  High: 3,
  Moderate: 2,
  Low: 1,
};

const SPECIMEN_HALF_WIDTH_X_MM = 25;
const SPECIMEN_LENGTH_Y_MM = 100;
const SPECIMEN_THICKNESS_Z_MM = 25;

export interface NormalizedSpecimenSpot {
  /** 0 (left parent metal -25mm) .. 0.5 (weld centerline 0mm) .. 1 (right parent metal +25mm) */
  normX: number;
  /** 0 (start of weld seam 0mm) .. 1 (end of weld seam 100mm) */
  normY: number;
  /** 0 (top cap surface Z=0mm) .. 1 (bottom root face Z=25mm) */
  normZ: number;
  /** Thermal intensity 0.25 .. 1.0 derived from peakSignalPct and severity */
  heatIntensity: number;
  coreColor: string;
  midColor: string;
  outerColor: string;
}

export function computeNormalizedSpecimenSpot(
  entry: Pick<DiscoveredDefectEntry, 'location' | 'severity' | 'peakSignalPct'>
): NormalizedSpecimenSpot {
  const clampedX = Math.max(
    -SPECIMEN_HALF_WIDTH_X_MM,
    Math.min(SPECIMEN_HALF_WIDTH_X_MM, entry.location.xMm)
  );
  const clampedY = Math.max(0, Math.min(SPECIMEN_LENGTH_Y_MM, entry.location.yMm));
  const clampedZ = Math.max(0, Math.min(SPECIMEN_THICKNESS_Z_MM, entry.location.depthZMm));

  const normX = (clampedX + SPECIMEN_HALF_WIDTH_X_MM) / (SPECIMEN_HALF_WIDTH_X_MM * 2);
  const normY = clampedY / SPECIMEN_LENGTH_Y_MM;
  const normZ = clampedZ / SPECIMEN_THICKNESS_Z_MM;

  const sigNorm = Math.max(0.25, Math.min(1, entry.peakSignalPct / 100));
  const sevBoost =
    entry.severity === 'Critical'
      ? 0.15
      : entry.severity === 'High'
      ? 0.08
      : entry.severity === 'Moderate'
      ? 0.03
      : 0;
  const heatIntensity = Math.min(1, sigNorm + sevBoost);

  if (entry.severity === 'Critical' || entry.peakSignalPct >= 85) {
    return {
      normX,
      normY,
      normZ,
      heatIntensity,
      coreColor: '#ef4444',
      midColor: '#f97316',
      outerColor: 'rgba(239, 68, 68, 0)',
    };
  }
  if (entry.severity === 'High' || entry.peakSignalPct >= 70) {
    return {
      normX,
      normY,
      normZ,
      heatIntensity,
      coreColor: '#f59e0b',
      midColor: '#eab308',
      outerColor: 'rgba(245, 158, 11, 0)',
    };
  }
  if (entry.severity === 'Moderate') {
    return {
      normX,
      normY,
      normZ,
      heatIntensity,
      coreColor: '#38bdf8',
      midColor: '#06b6d4',
      outerColor: 'rgba(56, 189, 248, 0)',
    };
  }
  return {
    normX,
    normY,
    normZ,
    heatIntensity,
    coreColor: '#34d399',
    midColor: '#10b981',
    outerColor: 'rgba(52, 211, 153, 0)',
  };
}

/**
 * Per-row miniature dual-projection Weld Specimen Heat Map & Location Map Icon.
 * Left pane: Through-wall V-weld Cross-Section (X vs Depth Z).
 * Right pane: Top-down Weld Seam Plan View (Seam Y vs Transverse X).
 */
const WeldDefectRowHeatMapIcon: React.FC<{
  entry: DiscoveredDefectEntry;
  language: Language;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ entry, language, isSelected, onSelect }) => {
  const isAr = language === 'ar';
  const uid = useId().replace(/:/g, '');
  const spot = useMemo(() => computeNormalizedSpecimenSpot(entry), [entry]);

  // Left Mini Cross-Section Box: x = 4..62 (width 58), y = 7..37 (height 30)
  const csX0 = 4;
  const csY0 = 7;
  const csW = 58;
  const csH = 30;
  const csCenterX = csX0 + csW / 2;
  const pinCsX = Number((csX0 + spot.normX * csW).toFixed(1));
  const pinCsY = Number((csY0 + spot.normZ * csH).toFixed(1));

  // Right Mini Plan View Box: x = 70..128 (width 58), y = 7..37 (height 30)
  // Horizontal = Seam Y (0..100mm), Vertical = Transverse X (-25..+25mm)
  const pvX0 = 70;
  const pvY0 = 7;
  const pvW = 58;
  const pvH = 30;
  const pvCenterY = pvY0 + pvH / 2;
  const pinPvX = Number((pvX0 + spot.normY * pvW).toFixed(1));
  const pinPvY = Number((pvY0 + spot.normX * pvH).toFixed(1));

  const glowRadius = Number((6.5 + spot.heatIntensity * 4.5).toFixed(1));

  const ariaDesc = isAr
    ? `خريطة موقع العيب الحرارية للعيب ${entry.codeSymbol} عند X=${entry.location.xMm}مم، Y=${entry.location.yMm}مم، العمق Z=${entry.location.depthZMm}مم (${entry.peakSignalPct.toFixed(1)}% FSH)`
    : `Weld specimen heat map icon for ${entry.codeSymbol} at X=${entry.location.xMm}mm, Y=${entry.location.yMm}mm, Depth Z=${entry.location.depthZMm}mm (${entry.peakSignalPct.toFixed(1)}% FSH)`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaDesc}
      title={
        isAr
          ? 'اضغط لتكبير موقع العيب على الخريطة الحرارية للعينة وتوجيه الكاميرا ثلاثية الأبعاد'
          : 'Click to inspect exact spot on Weld Heat Map & focus 3D viewport'
      }
      className={`group inline-flex items-center gap-1.5 rounded-lg border p-1 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        isSelected
          ? 'border-cyan-400 bg-cyan-950/40'
          : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
      }`}
    >
      <svg
        width="132"
        height="42"
        viewBox="0 0 132 42"
        role="img"
        aria-label={ariaDesc}
        className="block shrink-0 select-none"
      >
        <defs>
          <radialGradient id={`hm-cs-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={spot.coreColor} stopOpacity="0.98" />
            <stop offset="45%" stopColor={spot.midColor} stopOpacity="0.65" />
            <stop offset="100%" stopColor={spot.coreColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- PANE 1: WELD CROSS-SECTION (X-Z) --- */}
        <rect
          x={csX0}
          y={csY0}
          width={csW}
          height={csH}
          rx="2.5"
          fill="#090f1f"
          stroke="#334155"
          strokeWidth="0.9"
        />
        {/* Single-V Weld Groove Bevel & Cap Crown */}
        <polygon
          points={`${csCenterX - 11},${csY0} ${csCenterX + 11},${csY0} ${csCenterX + 3},${csY0 + csH} ${csCenterX - 3},${csY0 + csH}`}
          fill="#1e293b"
          stroke="#64748b"
          strokeWidth="0.8"
        />
        <path
          d={`M ${csCenterX - 12} ${csY0} Q ${csCenterX} ${csY0 - 3.2} ${csCenterX + 12} ${csY0}`}
          fill="#334155"
          stroke="#94a3b8"
          strokeWidth="0.7"
        />
        {/* Centerline Datum */}
        <line
          x1={csCenterX}
          y1={csY0}
          x2={csCenterX}
          y2={csY0 + csH}
          stroke="#475569"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
        />
        {/* Thermal Heat Map Plume + Exact Reticle Pin (X, Z) */}
        <circle cx={pinCsX} cy={pinCsY} r={glowRadius} fill={`url(#hm-cs-${uid})`} />
        <line
          x1={pinCsX - 3.5}
          y1={pinCsY}
          x2={pinCsX + 3.5}
          y2={pinCsY}
          stroke="#ffffff"
          strokeWidth="0.9"
        />
        <line
          x1={pinCsX}
          y1={pinCsY - 3.5}
          x2={pinCsX}
          y2={pinCsY + 3.5}
          stroke="#ffffff"
          strokeWidth="0.9"
        />
        <circle
          cx={pinCsX}
          cy={pinCsY}
          r="2"
          fill={spot.coreColor}
          stroke="#ffffff"
          strokeWidth="0.8"
        />
        <text x={csX0 + 2} y="6" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">
          X-Z
        </text>

        {/* --- PANE 2: TOP-DOWN SEAM PLAN VIEW (Y-X) --- */}
        <rect
          x={pvX0}
          y={pvY0}
          width={pvW}
          height={pvH}
          rx="2.5"
          fill="#090f1f"
          stroke="#334155"
          strokeWidth="0.9"
        />
        {/* Weld Bead Strip Along Y=0..100mm */}
        <rect
          x={pvX0}
          y={pvCenterY - 5}
          width={pvW}
          height="10"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="0.6"
        />
        <line
          x1={pvX0}
          y1={pvCenterY}
          x2={pvX0 + pvW}
          y2={pvCenterY}
          stroke="#64748b"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
        />
        {/* Thermal Heat Map Plume + Exact Reticle Pin (Y, X) */}
        <circle cx={pinPvX} cy={pinPvY} r={glowRadius} fill={`url(#hm-cs-${uid})`} />
        <circle
          cx={pinPvX}
          cy={pinPvY}
          r="2"
          fill={spot.coreColor}
          stroke="#ffffff"
          strokeWidth="0.8"
        />
        <text x={pvX0 + 2} y="6" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">
          Y-SEAM
        </text>
      </svg>
    </button>
  );
};

export const DiscoveredDefectsLogTable: React.FC<DiscoveredDefectsLogTableProps> = ({
  language,
  onFocusDefectIn3D,
  onTriggerSampleScan,
}) => {
  const isAr = language === 'ar';
  const { entries, summary, removeEntry, clearAll } = useDiscoveredDefectsLog();
  const compositeGradPrefix = useId().replace(/:/g, '');

  const [severityFilter, setSeverityFilter] = useState<'ALL' | DiscoveredDefectSeverity>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'severity' | 'depth'>('newest');
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [showCompositeHeatMap, setShowCompositeHeatMap] = useState<boolean>(true);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = entries.filter((item) => {
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
      if (!q) return true;
      const haystack = [
        item.codeSymbol,
        item.type.ar,
        item.type.en,
        item.location.zone.ar,
        item.location.zone.en,
        item.method,
        item.severity,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'severity') {
        const diff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
        if (diff !== 0) return diff;
      } else if (sortBy === 'depth') {
        const diff = b.location.depthZMm - a.location.depthZMm;
        if (diff !== 0) return diff;
      }
      return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
    });
  }, [entries, severityFilter, searchQuery, sortBy]);

  const activeHighlightedEntry = useMemo(
    () =>
      filteredAndSorted.find((e) => e.id === selectedDefectId) ??
      filteredAndSorted[0] ??
      null,
    [filteredAndSorted, selectedDefectId]
  );

  const handleSelectHeatMapSpot = (entry: DiscoveredDefectEntry) => {
    playCalibrationClick();
    setSelectedDefectId(entry.id);
    setShowCompositeHeatMap(true);
    if (onFocusDefectIn3D) {
      onFocusDefectIn3D(entry);
    }
  };

  const handleExportCsv = () => {
    if (filteredAndSorted.length === 0 || typeof document === 'undefined') return;
    playCalibrationClick();
    const header = [
      'LogID',
      'CodeSymbol',
      'DefectType',
      'Morphology',
      'Method',
      'LocationZone',
      'X_mm',
      'Y_mm',
      'Depth_Z_mm',
      'Severity',
      'PeakSignal_Pct',
      'DiscoveredAt',
    ].join(',');
    const rows = filteredAndSorted.map((r) =>
      [
        r.id,
        r.codeSymbol,
        `"${(isAr ? r.type.ar : r.type.en).replace(/"/g, '""')}"`,
        r.morphology,
        r.method,
        `"${(isAr ? r.location.zone.ar : r.location.zone.en).replace(/"/g, '""')}"`,
        r.location.xMm,
        r.location.yMm,
        r.location.depthZMm,
        r.severity,
        r.peakSignalPct,
        r.discoveredAt,
      ].join(',')
    );
    const csvBlob = new Blob([`${header}\n${rows.join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insco-3d-lab-defects-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSeverityCell = (severity: DiscoveredDefectSeverity) => {
    if (severity === 'Critical') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 whitespace-nowrap">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{isAr ? 'حرج (Critical)' : 'Critical'}</span>
        </span>
      );
    }
    if (severity === 'High') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{isAr ? 'مرتفع (High)' : 'High'}</span>
        </span>
      );
    }
    if (severity === 'Moderate') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 whitespace-nowrap">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{isAr ? 'متوسط (Moderate)' : 'Moderate'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{isAr ? 'منخفض (Low)' : 'Low'}</span>
      </span>
    );
  };

  return (
    <section
      aria-label={
        isAr
          ? 'السجل التفاعلي التلقائي للعيوب المكتشفة في المختبر ثلاثي الأبعاد'
          : 'Reactive 3D Lab Discovered Defects Log Table'
      }
      className="rounded-2xl border border-slate-800 bg-slate-950/95 p-5 space-y-4"
    >
      {/* Top Bar: Title + Summary Metrics + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
            <Radar className="w-4 h-4" />
            <span>
              {isAr
                ? 'سجل الرصد التلقائي الحي والخريطة الحرارية للمختبر ثلاثي الأبعاد'
                : 'Reactive 3D Inspection Defect Log & Specimen Heat Map'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {isAr
              ? 'جدول العيوب المكتشفة تلقائياً مع الخريطة الحرارية لموقع العيب على عينة اللحام'
              : 'Discovered Defects Log (Type · Weld Heat Map · 3D Location · Severity)'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => {
                playCalibrationClick();
                setShowCompositeHeatMap((v) => !v);
              }}
              aria-pressed={showCompositeHeatMap}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold transition cursor-pointer whitespace-nowrap ${
                showCompositeHeatMap
                  ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {showCompositeHeatMap
                  ? isAr
                    ? 'إخفاء الخريطة الحرارية المجمعة'
                    : 'Hide Specimen Heat Map'
                  : isAr
                  ? 'عرض الخريطة الحرارية المجمعة'
                  : 'Show Specimen Heat Map'}
              </span>
            </button>
          )}

          <button
            type="button"
            disabled={filteredAndSorted.length === 0}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-cyan-500/50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => {
                playCalibrationClick();
                setSelectedDefectId(null);
                clearAll();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-950/30 px-3 py-1.5 text-xs font-mono font-bold text-rose-300 hover:bg-rose-950/60 cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح السجل' : 'Clear Log'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Grid (Single-Elevation Hairline Dividers + Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-slate-800/80 font-mono text-xs tabular-nums">
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'إجمالي العيوب المكتشفة' : 'Total Discovered'}
          </div>
          <div className="text-xl font-black text-white">{summary.total}</div>
        </div>
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'عيوب حرجة مستوية (Critical)' : 'Critical Planar / Crack'}
          </div>
          <div className="text-xl font-black text-rose-400">{summary.critical}</div>
        </div>
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'عيوب مرتفعة الخطورة (High)' : 'High Severity'}
          </div>
          <div className="text-xl font-black text-amber-400">{summary.high}</div>
        </div>
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'أعلى إشارة مسجلة (% FSH)' : 'Peak Signal Amplitude'}
          </div>
          <div className="text-xl font-black text-cyan-400">
            {summary.maxSignalPct > 0 ? `${summary.maxSignalPct.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Interactive Composite Simulated Weld Specimen Heat Map Overview */}
      {showCompositeHeatMap && filteredAndSorted.length > 0 && (
        <div
          aria-label={
            isAr
              ? 'الخريطة الحرارية المجمعة لمواقع العيوب على عينة اللحام'
              : 'Composite Simulated Weld Specimen Defect Heat Map'
          }
          className="pb-4 border-b border-slate-800/80 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isAr
                  ? 'الخريطة الحرارية المرجعية لعينة اللحام (اضغط على أي بؤرة حرارية لتحديد العيب):'
                  : 'Simulated Weld Specimen Heat Map Reference (Click any thermal hotspot to inspect):'}
              </span>
            </div>

            {/* Thermal Intensity Legend (Explicit Text + Color Swatches) */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 inline-block" />
                <span>{isAr ? 'حرج ≥85%' : 'Critical ≥85%'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 inline-block" />
                <span>{isAr ? 'مرتفع 70–84%' : 'High 70–84%'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-400 inline-block" />
                <span>{isAr ? 'متوسط' : 'Moderate'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 inline-block" />
                <span>{isAr ? 'منخفض' : 'Low'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left 6 Cols: Top-Down Weld Seam Plan Heat Map (Y = 0..100mm, X = -25..+25mm) */}
            <div className="lg:col-span-6">
              <svg
                viewBox="0 0 360 118"
                role="img"
                aria-label={
                  isAr
                    ? 'مسقط أفقي للخريطة الحرارية على طول خط اللحام Y من 0 إلى 100 مم'
                    : 'Top-down weld seam heat map along Y = 0 to 100 mm'
                }
                className="w-full h-auto rounded-lg border border-slate-800 bg-[#070c18] block select-none"
              >
                <defs>
                  {filteredAndSorted.map((item, idx) => {
                    const sp = computeNormalizedSpecimenSpot(item);
                    return (
                      <radialGradient
                        key={item.id}
                        id={`${compositeGradPrefix}-plan-${idx}`}
                        cx="50%"
                        cy="50%"
                        r="50%"
                      >
                        <stop offset="0%" stopColor={sp.coreColor} stopOpacity="0.95" />
                        <stop offset="45%" stopColor={sp.midColor} stopOpacity="0.55" />
                        <stop offset="100%" stopColor={sp.coreColor} stopOpacity="0" />
                      </radialGradient>
                    );
                  })}
                </defs>

                <text x="10" y="14" fill="#94a3b8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  {isAr
                    ? 'المسقط العلوي لخط اللحام (Top Seam Plan: Y = 0–100 mm)'
                    : 'Top-Down Weld Seam Heat Map (Y = 0–100 mm · X = ±25 mm)'}
                </text>

                {/* Specimen Plate Box: x=28..344 (316px), y=22..100 (78px) */}
                <rect x="28" y="22" width="316" height="78" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                {/* HAZ & Weld Cap Strip */}
                <rect x="28" y="45" width="316" height="32" fill="#162036" />
                <rect x="28" y="50" width="316" height="22" fill="#1e293b" stroke="#475569" strokeWidth="0.9" />
                <line x1="28" y1="61" x2="344" y2="61" stroke="#64748b" strokeWidth="0.8" strokeDasharray="4 3" />

                {/* Y-Axis Millimeter Ticks */}
                {[0, 25, 50, 75, 100].map((yTick) => {
                  const tx = 28 + (yTick / 100) * 316;
                  return (
                    <g key={yTick}>
                      <line x1={tx} y1="100" x2={tx} y2="104" stroke="#64748b" strokeWidth="0.9" />
                      <text x={tx - 7} y="113" fill="#64748b" fontSize="7.5" fontFamily="monospace">
                        {yTick}mm
                      </text>
                    </g>
                  );
                })}

                {/* Thermal Defect Hotspots */}
                {filteredAndSorted.map((item, idx) => {
                  const sp = computeNormalizedSpecimenSpot(item);
                  const cx = Number((28 + sp.normY * 316).toFixed(1));
                  const cy = Number((22 + sp.normX * 78).toFixed(1));
                  const rGlow = Number((13 + sp.heatIntensity * 10).toFixed(1));
                  const isSel = activeHighlightedEntry?.id === item.id;
                  return (
                    <g
                      key={item.id}
                      onClick={() => handleSelectHeatMapSpot(item)}
                      className="cursor-pointer"
                    >
                      <circle cx={cx} cy={cy} r={rGlow} fill={`url(#${compositeGradPrefix}-plan-${idx})`} />
                      {isSel && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="8.5"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1.3"
                          strokeDasharray="2.5 1.5"
                        />
                      )}
                      <circle cx={cx} cy={cy} r="3.2" fill={sp.coreColor} stroke="#ffffff" strokeWidth="1" />
                      <text
                        x={Math.min(320, cx + 5)}
                        y={Math.max(32, cy - 5)}
                        fill="#f8fafc"
                        fontSize="7.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {item.codeSymbol}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Right 6 Cols: Through-Wall V-Groove Cross-Section Heat Map (X = -25..+25mm, Depth Z = 0..25mm) */}
            <div className="lg:col-span-6">
              <svg
                viewBox="0 0 360 118"
                role="img"
                aria-label={
                  isAr
                    ? 'مقطع عرضي للخريطة الحرارية عبر سمك اللحام Z من 0 إلى 25 مم'
                    : 'Through-wall V-weld cross-section heat map Z = 0 to 25 mm'
                }
                className="w-full h-auto rounded-lg border border-slate-800 bg-[#070c18] block select-none"
              >
                <text x="10" y="14" fill="#94a3b8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  {isAr
                    ? 'المقطع العرضي للوصلة (Cross-Section: X = ±25 mm · Depth Z = 0–25 mm)'
                    : 'Through-Wall V-Groove Profile (X = ±25 mm · Depth Z = 0–25 mm)'}
                </text>

                {/* Plate Profile: x=36..336 (300px), y=24..98 (74px) */}
                <rect x="36" y="24" width="300" height="74" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.1" />
                {/* Single-V Weld Bevel & Root */}
                <polygon
                  points="132,24 240,24 196,98 176,98"
                  fill="#1e293b"
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <path
                  d="M 128 24 Q 186 16 244 24"
                  fill="#334155"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <line x1="186" y1="18" x2="186" y2="103" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                <text x="8" y="29" fill="#64748b" fontSize="7" fontFamily="monospace">
                  Z=0
                </text>
                <text x="4" y="98" fill="#64748b" fontSize="7" fontFamily="monospace">
                  25mm
                </text>
                <text x="171" y="112" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                  CL (X=0)
                </text>

                {filteredAndSorted.map((item, idx) => {
                  const sp = computeNormalizedSpecimenSpot(item);
                  const cx = Number((36 + sp.normX * 300).toFixed(1));
                  const cy = Number((24 + sp.normZ * 74).toFixed(1));
                  const rGlow = Number((13 + sp.heatIntensity * 10).toFixed(1));
                  const isSel = activeHighlightedEntry?.id === item.id;
                  return (
                    <g
                      key={item.id}
                      onClick={() => handleSelectHeatMapSpot(item)}
                      className="cursor-pointer"
                    >
                      <circle cx={cx} cy={cy} r={rGlow} fill={`url(#${compositeGradPrefix}-plan-${idx})`} />
                      {isSel && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="8.5"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1.3"
                          strokeDasharray="2.5 1.5"
                        />
                      )}
                      <circle cx={cx} cy={cy} r="3.2" fill={sp.coreColor} stroke="#ffffff" strokeWidth="1" />
                      <text
                        x={Math.min(312, cx + 5)}
                        y={Math.max(33, cy - 5)}
                        fill="#f8fafc"
                        fontSize="7.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {item.codeSymbol}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Active Spot Coordinate Readout Strip */}
          {activeHighlightedEntry && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 tabular-nums">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-cyan-300">
                  {activeHighlightedEntry.codeSymbol} ·{' '}
                  {isAr ? activeHighlightedEntry.type.ar : activeHighlightedEntry.type.en}
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  {isAr
                    ? activeHighlightedEntry.location.zone.ar
                    : activeHighlightedEntry.location.zone.en}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-amber-300 font-semibold">
                <span>X = {activeHighlightedEntry.location.xMm} mm</span>
                <span className="text-slate-600">·</span>
                <span>Y = {activeHighlightedEntry.location.yMm} mm</span>
                <span className="text-slate-600">·</span>
                <span>Z = {activeHighlightedEntry.location.depthZMm} mm</span>
                <span className="text-slate-600">·</span>
                <span>{activeHighlightedEntry.peakSignalPct.toFixed(1)}% FSH</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter, Search & Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'Critical', 'High', 'Moderate', 'Low'] as const).map((sev) => {
            const active = severityFilter === sev;
            const label =
              sev === 'ALL'
                ? isAr
                  ? 'الكل'
                  : 'All'
                : sev === 'Critical'
                ? isAr
                  ? 'حرج'
                  : 'Critical'
                : sev === 'High'
                ? isAr
                  ? 'مرتفع'
                  : 'High'
                : sev === 'Moderate'
                ? isAr
                  ? 'متوسط'
                  : 'Moderate'
                : isAr
                ? 'منخفض'
                : 'Low';
            return (
              <button
                key={sev}
                type="button"
                onClick={() => {
                  playCalibrationClick();
                  setSeverityFilter(sev);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition whitespace-nowrap ${
                  active
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالنوع أو الموقع...' : 'Filter type or zone...'}
              aria-label={isAr ? 'بحث في العيوب المكتشفة' : 'Filter discovered defects'}
              className="rounded-lg border border-slate-800 bg-slate-900 ps-8 pe-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              aria-label={isAr ? 'ترتيب الجدول' : 'Sort discovered defects'}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'severity' | 'depth')}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900">
                {isAr ? 'الأحدث رصداً' : 'Newest First'}
              </option>
              <option value="severity" className="bg-slate-900">
                {isAr ? 'الأعلى خطورة' : 'Highest Severity'}
              </option>
              <option value="depth" className="bg-slate-900">
                {isAr ? 'الأعمق (Z mm)' : 'Deepest Z (mm)'}
              </option>
            </select>
          </label>
        </div>
      </div>

      {/* High-Density Data Table or Empty State */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-cyan-400">
            <Radar className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-lg mx-auto">
            <h4 className="text-sm font-bold text-white">
              {entries.length === 0
                ? isAr
                  ? 'لم يتم رصد عيوب بعد — حرّك المجس أو فعّل الفحص ثلاثي الأبعاد لالتقاط العيوب تلقائياً'
                  : 'No Defects Logged Yet — Sweep the 3D Probe to Auto-Capture Discontinuities'
                : isAr
                ? 'لا توجد عيوب مطابقة لفلتر البحث الحالي'
                : 'No Logged Defects Match Current Filter'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'بمجرد تقاطع مخروط الأشعة فوق الصوتية (-6 dB) أو خطوط الفيض المغناطيسي مع أي عيب داخل العينة ثلاثية الأبعاد، يُسجّل تلقائياً هنا مع خريطة حرارية لموقعه الدقيق على اللحام ودرجة خطورته.'
                : 'As soon as the 3D ultrasonic beam core or magnetic flux intersects a flaw in the specimen, this reactive table automatically records its type, weld specimen heat-map icon, spatial coordinates, and code severity.'}
            </p>
          </div>
          {entries.length === 0 && onTriggerSampleScan && (
            <button
              type="button"
              onClick={onTriggerSampleScan}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white cursor-pointer transition"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>
                {isAr ? 'توجيه المجس لرصد العيب الحالي فوراً' : 'Aim 3D Probe & Detect Flaw Now'}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full border-collapse text-start text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 font-mono text-[11px] text-slate-400">
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'نوع العيب والتقنية' : 'Defect Type & Method'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'خريطة موقع العيب (Heat Map)' : 'Weld Heat Map'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'الموقع الفراغي (Zone · X, Y, Z)' : '3D Location (Zone · X, Y, Depth Z)'}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {isAr ? 'درجة الخطورة' : 'Severity'}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {isAr ? 'ذروة الإشارة' : 'Peak Signal'}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {isAr ? 'وقت الرصد' : 'Logged Time'}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {isAr ? 'إجراء' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950">
              {filteredAndSorted.map((row) => {
                const timeStr = new Date(row.lastUpdatedAt).toLocaleTimeString(
                  isAr ? 'ar-EG' : 'en-US',
                  { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                );
                const isRowSelected = activeHighlightedEntry?.id === row.id;
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isRowSelected ? 'bg-cyan-950/20' : 'hover:bg-slate-900/70'
                    }`}
                  >
                    <td className="py-2.5 px-3 align-middle">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white leading-tight">
                          {isAr ? row.type.ar : row.type.en}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 tabular-nums">
                          <span className="font-bold text-cyan-300">{row.codeSymbol}</span>
                          <span aria-hidden="true">·</span>
                          <span>{row.method}</span>
                          <span aria-hidden="true">·</span>
                          <span>{row.morphology}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-3 align-middle">
                      <WeldDefectRowHeatMapIcon
                        entry={row}
                        language={language}
                        isSelected={isRowSelected}
                        onSelect={() => handleSelectHeatMapSpot(row)}
                      />
                    </td>

                    <td className="py-2.5 px-3 align-middle font-mono tabular-nums">
                      <div className="text-slate-200 font-semibold">
                        {isAr ? row.location.zone.ar : row.location.zone.en}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        X={row.location.xMm}mm · Y={row.location.yMm}mm · Z={row.location.depthZMm}mm
                        {row.sizing ? ` · L=${row.sizing.calculatedLengthMm.toFixed(1)}mm` : ''} (
                        {row.location.soundPathOrAngle})
                      </div>
                    </td>

                    <td className="py-2.5 px-3 align-middle">
                      {renderSeverityCell(row.severity)}
                    </td>

                    <td className="py-2.5 px-3 align-middle text-end font-mono tabular-nums">
                      <div className="font-bold text-amber-300">{row.peakSignalPct.toFixed(1)}% FSH</div>
                      <div className="text-[10px] text-slate-500">
                        {row.hitCount}× {isAr ? 'التقاط' : 'hits'}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 align-middle text-end font-mono text-[11px] text-slate-400 tabular-nums">
                      {timeStr}
                    </td>

                    <td className="py-2.5 px-3 align-middle text-end">
                      <div className="inline-flex items-center justify-end gap-1">
                        {onFocusDefectIn3D && (
                          <button
                            type="button"
                            onClick={() => {
                              playCalibrationClick();
                              setSelectedDefectId(row.id);
                              onFocusDefectIn3D(row);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/35 bg-cyan-950/40 px-2 py-1 text-[10.5px] font-mono font-bold text-cyan-300 hover:bg-cyan-900/50 cursor-pointer whitespace-nowrap"
                            title={isAr ? 'توجيه الكاميرا والمجس نحو العيب' : 'Focus 3D Probe on Defect'}
                          >
                            <Crosshair className="w-3 h-3" />
                            <span>{isAr ? 'معاينة 3D' : 'Focus 3D'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            playCalibrationClick();
                            removeEntry(row.id);
                          }}
                          aria-label={isAr ? 'حذف السطر' : 'Remove defect row'}
                          className="rounded-lg border border-slate-800 bg-slate-900 p-1 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
