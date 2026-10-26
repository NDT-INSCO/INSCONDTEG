import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3, Crosshair, Layers, RotateCcw } from 'lucide-react';
import { Language } from '../../../types';
import {
  DiscoveredDefectEntry,
  useDiscoveredDefectsLog,
} from '../../../utils/discoveredDefectsStore';
import { playCalibrationClick } from '../../../utils/ndtAudioFeedback';

export type WeldingErrorBucketId =
  | 'porosity'
  | 'lack_of_fusion'
  | 'slag_inclusions'
  | 'incomplete_penetration'
  | 'cracks'
  | 'undercut_lamination';

export interface WeldingErrorCategoryMeta {
  id: WeldingErrorBucketId;
  code: string;
  shortLabel: { ar: string; en: string };
  fullName: { ar: string; en: string };
  barColor: string;
  barStroke: string;
  severityClass: { ar: string; en: string };
  welderCause: { ar: string; en: string };
  preventionTip: { ar: string; en: string };
}

export const WELDING_ERROR_CATEGORIES: WeldingErrorCategoryMeta[] = [
  {
    id: 'porosity',
    code: 'POR',
    shortLabel: { ar: 'مسامية (POR)', en: 'Porosity' },
    fullName: { ar: 'المسامية والفجوات الغازية (Porosity)', en: 'Gas Porosity & Wormholes' },
    barColor: '#06b6d4',
    barStroke: '#22d3ee',
    severityClass: { ar: 'حجمي · متوسط', en: 'Volumetric · Moderate' },
    welderCause: {
      ar: 'انقطاع غاز الحماية، وجود رطوبة أو زيوت على حواف الشطف، أو زيادة طول القوس الكهربائي.',
      en: 'Loss of shielding gas, moisture/oil on bevel faces, or excessive arc length trapping gas.',
    },
    preventionTip: {
      ar: 'تجفيف أسياخ اللحام (E7018)، تنظيف المعدن جيداً، وضبط تدفق الغاز وطول القوس.',
      en: 'Bake low-hydrogen electrodes, degrease bevels, and maintain proper gas flow & short arc.',
    },
  },
  {
    id: 'lack_of_fusion',
    code: 'LOF',
    shortLabel: { ar: 'نقص انصهار (LOF)', en: 'Lack of Fusion' },
    fullName: { ar: 'نقص الانصهار الجانبي وبين الطبقات (LOF)', en: 'Sidewall & Interpass Lack of Fusion' },
    barColor: '#f59e0b',
    barStroke: '#fbbf24',
    severityClass: { ar: 'مستوي · حرج', en: 'Planar · Critical' },
    welderCause: {
      ar: 'انخفاض الدخل الحراري (أمبير منخفض)، زاوية توجيه خاطئة للمشعل، أو بقاء قشور أكسيدية.',
      en: 'Insufficient heat input, improper electrode work angle, or uncleaned interpass oxide scale.',
    },
    preventionTip: {
      ar: 'ضبط زاوية المشعل عمودياً على جدار الشطف، رفع الأمبير المناسب، وتجليخ طبقات اللحام.',
      en: 'Direct arc into bevel sidewalls, increase current adequately, and grind interpass toes.',
    },
  },
  {
    id: 'slag_inclusions',
    code: 'SLG',
    shortLabel: { ar: 'شوائب خبث (SLG)', en: 'Slag Inclusions' },
    fullName: { ar: 'شوائب الخبث والتنجستن المحبوسة (Inclusions)', en: 'Entrapped Slag & Tungsten Inclusions' },
    barColor: '#3b82f6',
    barStroke: '#60a5fa',
    severityClass: { ar: 'حجمي · عالي', en: 'Volumetric · High' },
    welderCause: {
      ar: 'عدم إزالة الخبث بالكامل بين التمريرات المتعددة أو تحدب الدرزة المفرط الذي يحبس الخبث.',
      en: 'Incomplete slag removal between passes or convex bead profiles trapping molten flux.',
    },
    preventionTip: {
      ar: 'استخدام فرشاة سلكية وحجر جلخ بين كل باص وآخر وتجنب التمريرات المحدبة الضيقة.',
      en: 'Chip and wire-brush thoroughly between passes and maintain flat-to-concave bead toes.',
    },
  },
  {
    id: 'incomplete_penetration',
    code: 'LOP',
    shortLabel: { ar: 'عدم تغلغل (LOP)', en: 'Root LOP' },
    fullName: { ar: 'عدم تغلغل جذر اللحام (Incomplete Penetration)', en: 'Incomplete Root Penetration & Concavity' },
    barColor: '#ec4899',
    barStroke: '#f472b6',
    severityClass: { ar: 'مستوي · حرج', en: 'Planar · Critical' },
    welderCause: {
      ar: 'ضيق فتحة الجذر (Root Gap)، كِبَر شفة الجذر (Root Face)، أو سرعة لحام عالية بباص الجذر.',
      en: 'Too narrow root opening, excessive root face land, or travel speed too fast on root pass.',
    },
    preventionTip: {
      ar: 'معايرة خلوص الجذر (2–3 مم) وشفة الجذر بدقة قبل التجميع وضبط أمبير اختراق الجذر.',
      en: 'Verify fit-up root gap (2–3 mm) and land dimensions before tacking; use keyhole root current.',
    },
  },
  {
    id: 'cracks',
    code: 'CRK',
    shortLabel: { ar: 'شروخ (CRK)', en: 'Cracks' },
    fullName: { ar: 'الشروخ الطولية والعرضية وشروخ الـ HAZ', en: 'Root, Transverse & HAZ Cracks' },
    barColor: '#ef4444',
    barStroke: '#f87171',
    severityClass: { ar: 'مستوي/سطحي · مرفوض قطعياً', en: 'Planar/Surface · Zero Tolerance' },
    welderCause: {
      ar: 'الهيدروجين المذاب مع التبريد السريع (بدون تسخين مسبق Preheat) وإجهادات التقييد العالية.',
      en: 'Diffusible hydrogen, rapid HAZ cooling without preheat, high restraint, or abrupt arc stop.',
    },
    preventionTip: {
      ar: 'تطبيق التسخين المسبق (Preheat) طبقاً لـ WPS، استخدام إلكترودات منخفضة الهيدروجين، وملء الفوهة.',
      en: 'Enforce WPS preheat/interpass temperatures, low-hydrogen consumables, and crater-fill stops.',
    },
  },
  {
    id: 'undercut_lamination',
    code: 'UND',
    shortLabel: { ar: 'عضة/تورق (UND)', en: 'Undercut / Lam.' },
    fullName: { ar: 'عضة الحافة وتورق معدن الأساس (Undercut & Lamination)', en: 'Toe Undercut & Plate Lamination' },
    barColor: '#10b981',
    barStroke: '#34d399',
    severityClass: { ar: 'هندسي · متوسط/عالي', en: 'Geometric · Moderate/High' },
    welderCause: {
      ar: 'ارتفاع الفولت والأمبير مع سرعة تقدم عالية تذيب حافة المعدن الأصلي دون ملئها بمعدن الإضافة.',
      en: 'Excessive voltage/current and fast travel gouging parent metal toe without filler metal.',
    },
    preventionTip: {
      ar: 'تقليل طول القوس والتوقف اللحظي عند أطراف التموج (Weave Toes) وفحص الألواح بزاوية 0°.',
      en: 'Shorten arc voltage, pause briefly at weave toes, and perform 0° base-metal lamination checks.',
    },
  },
];

/**
 * Classifies any logged 3D simulation defect into one of the 6 core welding error categories.
 */
export function classifyDiscoveredDefectBucket(
  entry: Pick<DiscoveredDefectEntry, 'catalogDefectId' | 'codeSymbol' | 'type' | 'morphology'>
): WeldingErrorBucketId {
  const catId = entry.catalogDefectId;
  if (
    catId === 'isolated_pore' ||
    catId === 'porosity_cluster' ||
    catId === 'wormhole_porosity'
  ) {
    return 'porosity';
  }
  if (catId === 'lack_of_fusion' || catId === 'interpass_lof' || catId === 'root_lof') {
    return 'lack_of_fusion';
  }
  if (catId === 'slag_inclusion' || catId === 'tungsten_inclusion') {
    return 'slag_inclusions';
  }
  if (catId === 'incomplete_penetration' || catId === 'root_concavity') {
    return 'incomplete_penetration';
  }
  if (
    catId === 'root_crack' ||
    catId === 'transverse_crack' ||
    catId === 'haz_underbead_crack' ||
    catId === 'crater_star_crack'
  ) {
    return 'cracks';
  }
  if (catId === 'toe_undercut' || catId === 'base_lamination') {
    return 'undercut_lamination';
  }

  // Fallback classification by codeSymbol / English label
  const hay = `${entry.codeSymbol} ${entry.type.en}`.toLowerCase();
  if (hay.includes('por')) return 'porosity';
  if (hay.includes('lof') || hay.includes('fusion')) return 'lack_of_fusion';
  if (hay.includes('slag') || hay.includes('tungsten') || hay.includes('sl-')) return 'slag_inclusions';
  if (hay.includes('lop') || hay.includes('penetration')) return 'incomplete_penetration';
  if (hay.includes('undercut') || hay.includes('lam')) return 'undercut_lamination';
  return 'cracks';
}

export interface AggregatedDefectBucket extends WeldingErrorCategoryMeta {
  uniqueCount: number;
  scanHitCount: number;
  avgSignalPct: number;
  sharePct: number;
  matchingEntries: DiscoveredDefectEntry[];
}

export function aggregateDefectFrequencyByCategory(
  entries: DiscoveredDefectEntry[],
  metricMode: 'unique_defects' | 'scan_hits' = 'unique_defects'
): AggregatedDefectBucket[] {
  const grouped = new Map<WeldingErrorBucketId, DiscoveredDefectEntry[]>();
  for (const cat of WELDING_ERROR_CATEGORIES) {
    grouped.set(cat.id, []);
  }

  for (const entry of entries) {
    const bucketId = classifyDiscoveredDefectBucket(entry);
    grouped.get(bucketId)?.push(entry);
  }

  const totalMetric = entries.reduce(
    (acc, item) => acc + (metricMode === 'unique_defects' ? 1 : Math.max(1, item.hitCount)),
    0
  );

  return WELDING_ERROR_CATEGORIES.map((cat) => {
    const list = grouped.get(cat.id) ?? [];
    const uniqueCount = list.length;
    const scanHitCount = list.reduce((sum, e) => sum + Math.max(1, e.hitCount), 0);
    const activeVal = metricMode === 'unique_defects' ? uniqueCount : scanHitCount;
    const avgSignalPct =
      list.length > 0
        ? Number((list.reduce((s, e) => s + e.peakSignalPct, 0) / list.length).toFixed(1))
        : 0;
    const sharePct = totalMetric > 0 ? Math.round((activeVal / totalMetric) * 100) : 0;

    return {
      ...cat,
      uniqueCount,
      scanHitCount,
      avgSignalPct,
      sharePct,
      matchingEntries: list,
    };
  });
}

export interface DefectFrequencyD3ChartProps {
  language: Language;
  /** Optional callback to focus a logged defect in the 3D scene */
  onFocusDefectIn3D?: (entry: DiscoveredDefectEntry) => void;
  /** Optional callback to populate or trigger multi-defect sample inspection */
  onPopulateSampleDefects?: () => void;
}

export const DefectFrequencyD3Chart: React.FC<DefectFrequencyD3ChartProps> = ({
  language,
  onFocusDefectIn3D,
  onPopulateSampleDefects,
}) => {
  const isAr = language === 'ar';
  const { entries } = useDiscoveredDefectsLog();

  const [metricMode, setMetricMode] = useState<'unique_defects' | 'scan_hits'>('unique_defects');
  const [sortByFrequency, setSortByFrequency] = useState<boolean>(false);
  const [selectedBucketId, setSelectedBucketId] = useState<WeldingErrorBucketId>('porosity');

  const svgRef = useRef<SVGSVGElement | null>(null);

  const buckets = useMemo(() => {
    const raw = aggregateDefectFrequencyByCategory(entries, metricMode);
    if (!sortByFrequency) return raw;
    return [...raw].sort((a, b) => {
      const valA = metricMode === 'unique_defects' ? a.uniqueCount : a.scanHitCount;
      const valB = metricMode === 'unique_defects' ? b.uniqueCount : b.scanHitCount;
      return d3.descending(valA, valB);
    });
  }, [entries, metricMode, sortByFrequency]);

  const totalIdentified = entries.length;
  const totalScanHits = useMemo(
    () => entries.reduce((sum, item) => sum + Math.max(1, item.hitCount), 0),
    [entries]
  );

  const topErrorBucket = useMemo(() => {
    if (entries.length === 0) return null;
    return [...buckets].sort((a, b) => b.uniqueCount - a.uniqueCount || b.scanHitCount - a.scanHitCount)[0] ?? null;
  }, [buckets, entries.length]);

  // Automatically highlight the most frequent non-zero bucket when entries first arrive
  useEffect(() => {
    const currentSelected = buckets.find((b) => b.id === selectedBucketId);
    if ((!currentSelected || currentSelected.uniqueCount === 0) && topErrorBucket && topErrorBucket.uniqueCount > 0) {
      setSelectedBucketId(topErrorBucket.id);
    }
  }, [buckets, selectedBucketId, topErrorBucket]);

  const activeBucket =
    buckets.find((b) => b.id === selectedBucketId) ?? buckets[0];

  // ---------------------------------------------------------------------------
  // D3.js Bar Chart Rendering Engine (Synchronous SVG DOM Join)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = 680;
    const height = 258;
    const margin = { top: 28, right: 20, bottom: 48, left: 44 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const getVal = (d: AggregatedDefectBucket) =>
      metricMode === 'unique_defects' ? d.uniqueCount : d.scanHitCount;

    const maxVal = d3.max(buckets, getVal) ?? 0;
    const yUpper = Math.max(4, Math.ceil(maxVal * 1.2));

    const xScale = d3
      .scaleBand<string>()
      .domain(buckets.map((d) => d.id))
      .range([margin.left, width - margin.right])
      .padding(0.32);

    const yScale = d3
      .scaleLinear()
      .domain([0, yUpper])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // 1. Horizontal Gridlines
    const yTicks = yScale.ticks(Math.min(6, yUpper)).filter((t) => Number.isInteger(t));
    svg
      .append('g')
      .attr('class', 'd3-grid-lines')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (t) => yScale(t))
      .attr('y2', (t) => yScale(t))
      .attr('stroke', (t) => (t === 0 ? '#334155' : '#1e293b'))
      .attr('stroke-width', (t) => (t === 0 ? 1.2 : 0.9))
      .attr('stroke-dasharray', (t) => (t === 0 ? 'none' : '3,3'));

    // 2. Y-Axis (Integer Counts)
    const yAxisGroup = svg
      .append('g')
      .attr('class', 'd3-y-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(yScale)
          .tickValues(yTicks)
          .tickSizeOuter(0)
          .tickFormat(d3.format('d'))
      );

    yAxisGroup.select('.domain').attr('stroke', '#334155');
    yAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    yAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-size', '10.5px');

    // Y-Axis Unit Label
    svg
      .append('text')
      .attr('x', margin.left - 8)
      .attr('y', 15)
      .attr('text-anchor', 'start')
      .attr('fill', '#64748b')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-size', '9.5px')
      .text(
        metricMode === 'unique_defects'
          ? isAr
            ? 'العدد (عيوب)'
            : 'COUNT (DEFECTS)'
          : isAr
          ? 'مرات الرصد'
          : 'SCAN HITS'
      );

    // 3. X-Axis (Welding Error Categories)
    const labelMap = new Map<string, string>(
      buckets.map((b) => [b.id, b.shortLabel[language]])
    );
    const xAxisGroup = svg
      .append('g')
      .attr('class', 'd3-x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSizeOuter(0)
          .tickFormat((id) => labelMap.get(id) ?? id)
      );

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#475569');
    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', (id) => (id === selectedBucketId ? '#f8fafc' : '#cbd5e1'))
      .attr('font-weight', (id) => (id === selectedBucketId ? '700' : '500'))
      .attr('font-size', '10.5px')
      .attr('dy', '1.15em');

    // Code symbol sub-labels beneath X-axis ticks
    const codeMap = new Map<string, string>(buckets.map((b) => [b.id, b.code]));
    svg
      .append('g')
      .attr('class', 'd3-x-sublabels')
      .selectAll('text')
      .data(buckets)
      .join('text')
      .attr('x', (d) => (xScale(d.id) ?? 0) + xScale.bandwidth() / 2)
      .attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-size', '9px')
      .text((d) => `[${codeMap.get(d.id)}]`);

    // 4. Data Bars Group
    const barGroups = svg
      .append('g')
      .attr('class', 'd3-bars-layer')
      .selectAll('g.d3-bar-node')
      .data(buckets, (d) => (d as AggregatedDefectBucket).id)
      .join('g')
      .attr('class', 'd3-bar-node')
      .attr('data-category', (d) => d.id)
      .attr('data-count', (d) => String(getVal(d)))
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        playCalibrationClick();
        setSelectedBucketId(d.id);
      });

    // Subtle background column slot (improves clickability even when count === 0)
    barGroups
      .append('rect')
      .attr('class', 'd3-bar-slot')
      .attr('x', (d) => xScale(d.id) ?? 0)
      .attr('y', margin.top)
      .attr('width', xScale.bandwidth())
      .attr('height', innerHeight)
      .attr('rx', 5)
      .attr('fill', (d) =>
        d.id === selectedBucketId ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.35)'
      )
      .attr('stroke', (d) =>
        d.id === selectedBucketId ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 41, 59, 0.5)'
      )
      .attr('stroke-width', 1);

    // Primary D3 Frequency Bar
    barGroups
      .append('rect')
      .attr('class', 'd3-defect-bar')
      .attr('x', (d) => (xScale(d.id) ?? 0) + 2)
      .attr('y', (d) => {
        const val = getVal(d);
        return val > 0 ? yScale(val) : height - margin.bottom - 2;
      })
      .attr('width', Math.max(8, xScale.bandwidth() - 4))
      .attr('height', (d) => {
        const val = getVal(d);
        return val > 0 ? Math.max(4, height - margin.bottom - yScale(val)) : 2;
      })
      .attr('rx', 4)
      .attr('fill', (d) => (getVal(d) > 0 ? d.barColor : '#1e293b'))
      .attr('fill-opacity', (d) =>
        getVal(d) === 0 ? 0.5 : d.id === selectedBucketId ? 0.95 : 0.78
      )
      .attr('stroke', (d) => (getVal(d) > 0 ? d.barStroke : '#334155'))
      .attr('stroke-width', (d) => (d.id === selectedBucketId ? 1.6 : 1));

    // Quantitative Value + Share % Label Above Each Bar
    barGroups
      .append('text')
      .attr('class', 'd3-bar-value')
      .attr('x', (d) => (xScale(d.id) ?? 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => {
        const val = getVal(d);
        return val > 0 ? yScale(val) - 7 : height - margin.bottom - 7;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (getVal(d) > 0 ? '#f8fafc' : '#64748b'))
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text((d) => {
        const val = getVal(d);
        if (val === 0) return '0';
        return `${val} (${d.sharePct}%)`;
      });
  }, [buckets, metricMode, selectedBucketId, language, isAr]);

  return (
    <section
      aria-label={
        isAr
          ? 'مخطط D3 التكراري لأنواع عيوب اللحام المكتشفة'
          : 'D3.js Welding Defect Frequency Bar Chart'
      }
      className="rounded-2xl border border-slate-800 bg-[#070a18] p-4 sm:p-5 space-y-4"
    >
      {/* Top Instrument Telemetry Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-cyan-400 font-semibold">
              {isAr ? 'تحليل D3.js لتكرار أخطاء اللحام' : 'D3.js Welding Error Frequency Analytics'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isAr ? `العيوب الفريدة: ${totalIdentified}` : `Identified: ${totalIdentified}`}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isAr ? `إجمالي الرصد: ${totalScanHits}` : `Scan Hits: ${totalScanHits}`}
            </span>
            {topErrorBucket && topErrorBucket.uniqueCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300">
                  {isAr
                    ? `الأكثر شيوعاً: ${topErrorBucket.shortLabel.ar}`
                    : `Most Frequent: ${topErrorBucket.shortLabel.en}`}
                </span>
              </>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            {isAr
              ? 'التوزيع الإحصائي لأنواع عيوب اللحام المكتشفة في المختبر ثلاثي الأبعاد'
              : 'Frequency Distribution of Identified Welding Defects in the 3D Lab'}
          </h3>
        </div>

        {/* Interactive Chart Controls (Segmented Metric Switcher + Sort Order) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                playCalibrationClick();
                setMetricMode('unique_defects');
              }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer whitespace-nowrap shrink-0 ${
                metricMode === 'unique_defects'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'عدد العيوب' : 'Unique Defects'}
            </button>
            <button
              type="button"
              onClick={() => {
                playCalibrationClick();
                setMetricMode('scan_hits');
              }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer whitespace-nowrap shrink-0 ${
                metricMode === 'scan_hits'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'تكرار المسح' : 'Scan Hits'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              playCalibrationClick();
              setSortByFrequency((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
              sortByFrequency
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {sortByFrequency
              ? isAr
                ? 'مرتب تنازلياً'
                : 'Sorted High → Low'
              : isAr
              ? 'ترتيب حسب الأكثر تكراراً'
              : 'Sort by Frequency'}
          </button>

          {onPopulateSampleDefects && (
            <button
              type="button"
              onClick={() => {
                playCalibrationClick();
                onPopulateSampleDefects();
              }}
              className="px-3 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-mono font-bold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'محاكاة عينة متعددة العيوب' : 'Load Multi-Defect Sample'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Asymmetric Split: D3 SVG Bar Chart (8 Cols) + Welding Error Diagnostic Panel (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: D3.js SVG Viewport */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col justify-between">
          <svg
            ref={svgRef}
            viewBox="0 0 680 258"
            role="img"
            aria-label={
              isAr
                ? 'مخطط أعمدة D3 يوضح تكرار المسامية ونقص الانصهار وشوائب الخبث والشروخ'
                : 'D3 bar chart showing frequency of Porosity, Lack of Fusion, Slag Inclusions, Root LOP, Cracks, and Undercut'
            }
            className="w-full h-56 sm:h-64 block select-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>
              {isAr
                ? 'اضغط على أي عمود لعرض السبب الميتالورجي لخطأ اللحام وطرق الوقاية منه.'
                : 'Click any bar to inspect the welding root cause, prevention method, and logged 3D spots.'}
            </span>
            {totalIdentified === 0 && (
              <span className="text-amber-300 font-mono text-[10.5px]">
                {isAr
                  ? 'حرّك المجس في العينة ثلاثية الأبعاد لاكتشاف العيوب وتحديث الأعمدة تلقائياً'
                  : 'Sweep the 3D probe over the weld to populate bars live'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Selected Welding Error Root-Cause & Prevention Diagnostic Card */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-mono font-bold text-white truncate">
                  {activeBucket.fullName[language]}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                [{activeBucket.code}]
              </span>
            </div>

            {/* Clean Quantitative Readout Row (Tabular Numerals) */}
            <div className="grid grid-cols-3 gap-2 py-1 font-mono tabular-nums">
              <div>
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'العيوب المرصودة' : 'Identified'}
                </div>
                <div className="text-lg font-bold text-white">{activeBucket.uniqueCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'نسبة التكرار' : 'Share'}
                </div>
                <div className="text-lg font-bold text-cyan-400">{activeBucket.sharePct}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'متوسط الإشارة' : 'Avg Signal'}
                </div>
                <div className="text-lg font-bold text-amber-300">
                  {activeBucket.avgSignalPct > 0 ? `${activeBucket.avgSignalPct}%` : '—'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs leading-relaxed pt-1 border-t border-slate-800/80">
              <div className="text-slate-400 text-[11px] font-mono">
                {activeBucket.severityClass[language]}
              </div>
              <div>
                <span className="font-semibold text-amber-300">
                  {isAr ? 'سبب خطأ اللحام الشائع: ' : 'Common Welding Error: '}
                </span>
                <span className="text-slate-300">{activeBucket.welderCause[language]}</span>
              </div>
              <div>
                <span className="font-semibold text-emerald-300">
                  {isAr ? 'الوقاية وضبط الجودة: ' : 'WPS Prevention: '}
                </span>
                <span className="text-slate-300">{activeBucket.preventionTip[language]}</span>
              </div>
            </div>
          </div>

          {/* Matching Logged 3D Defects Quick-Jump List */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="text-[10.5px] font-mono text-slate-400">
              {isAr
                ? `المواقع المكتشفة لهذا النوع (${activeBucket.matchingEntries.length}):`
                : `Logged 3D Spots in Category (${activeBucket.matchingEntries.length}):`}
            </div>
            {activeBucket.matchingEntries.length === 0 ? (
              <div className="text-[11px] text-slate-500">
                {isAr
                  ? 'لم يُسجَّل هذا العيب بعد في الجلسة الحالية.'
                  : 'No defects of this category logged yet in current session.'}
              </div>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {activeBucket.matchingEntries.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-[11px] font-mono bg-slate-900/80 rounded-lg px-2.5 py-1 border border-slate-800 tabular-nums"
                  >
                    <span className="text-slate-200 truncate">
                      {item.codeSymbol} · Z={item.location.depthZMm}mm · {item.peakSignalPct.toFixed(0)}%
                    </span>
                    {onFocusDefectIn3D && (
                      <button
                        type="button"
                        onClick={() => {
                          playCalibrationClick();
                          onFocusDefectIn3D(item);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>{isAr ? 'معاينة 3D' : '3D'}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
