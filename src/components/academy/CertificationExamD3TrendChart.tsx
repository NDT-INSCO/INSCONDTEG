import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { Language } from '../../types';
import {
  ExamHistoryEntry,
  getExamHistory,
  resetExamHistoryToBaseline
} from '../../utils/examSimulationHistoryStore';

interface CertificationExamD3TrendChartProps {
  language: Language;
  onRefresh?: () => void;
  className?: string;
}

interface MethodConfig {
  key: string;
  nameAr: string;
  nameEn: string;
  color: string;
  strokeWidth: number;
}

const METHODS_CONFIG: MethodConfig[] = [
  { key: 'Overall', nameAr: 'المعدل الكلي الشامل', nameEn: 'Overall Composite', color: '#f59e0b', strokeWidth: 3 },
  { key: 'UT', nameAr: 'الموجات فوق الصوتية (UT)', nameEn: 'Ultrasonic (UT)', color: '#10b981', strokeWidth: 2 },
  { key: 'RT', nameAr: 'التصوير الإشعاعي (RT)', nameEn: 'Radiography (RT)', color: '#0ea5e9', strokeWidth: 2 },
  { key: 'MT', nameAr: 'الجسيمات المغناطيسية (MT)', nameEn: 'Magnetic Particle (MT)', color: '#8b5cf6', strokeWidth: 2 },
  { key: 'PT', nameAr: 'السائل النافذ (PT)', nameEn: 'Liquid Penetrant (PT)', color: '#f43f5e', strokeWidth: 2 },
  { key: 'VT', nameAr: 'الفحص البصري (VT)', nameEn: 'Visual Testing (VT)', color: '#f97316', strokeWidth: 2 }
];

export const CertificationExamD3TrendChart: React.FC<CertificationExamD3TrendChartProps> = ({
  language,
  onRefresh,
  className = ''
}) => {
  const isAr = language === 'ar';
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [activeMethods, setActiveMethods] = useState<Record<string, boolean>>({
    Overall: true,
    UT: true,
    RT: true,
    MT: true,
    PT: true,
    VT: true
  });
  const [chartMode, setChartMode] = useState<'timeline' | 'competency_radar'>('timeline');
  const [hoveredPoint, setHoveredPoint] = useState<{
    entry: ExamHistoryEntry;
    methodKey: string;
    score: number;
    x: number;
    y: number;
  } | null>(null);

  // Load history data
  const reloadHistory = () => {
    setHistory(getExamHistory());
  };

  useEffect(() => {
    reloadHistory();
    const handleUpdated = () => reloadHistory();
    window.addEventListener('insco_exam_history_updated', handleUpdated);
    return () => {
      window.removeEventListener('insco_exam_history_updated', handleUpdated);
    };
  }, []);

  // Aggregate KPI metrics
  const kpiStats = useMemo(() => {
    if (history.length === 0) {
      return { totalAttempts: 0, latestScore: 0, avgScore: 0, bestMethod: 'UT', mostImproved: 'UT' };
    }

    const totalAttempts = history.length;
    const latestScore = history[history.length - 1].overallScorePct;
    const avgScore = Math.round(history.reduce((acc, h) => acc + h.overallScorePct, 0) / totalAttempts);

    // Calculate method averages
    const methodTotals: Record<string, { sum: number; count: number; first: number; last: number }> = {};
    const methodKeys = ['UT', 'RT', 'MT', 'PT', 'VT'];

    methodKeys.forEach(m => {
      methodTotals[m] = { sum: 0, count: 0, first: 0, last: 0 };
    });

    history.forEach((h, hIdx) => {
      methodKeys.forEach(m => {
        if (h.methodScores[m]) {
          const pct = h.methodScores[m].pct;
          methodTotals[m].sum += pct;
          methodTotals[m].count += 1;
          if (hIdx === 0) methodTotals[m].first = pct;
          methodTotals[m].last = pct;
        }
      });
    });

    let bestMethod = 'UT';
    let bestAvg = -1;
    let mostImproved = 'UT';
    let bestGain = -999;

    methodKeys.forEach(m => {
      const data = methodTotals[m];
      if (data.count > 0) {
        const avg = data.sum / data.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestMethod = m;
        }
        const gain = data.last - data.first;
        if (gain > bestGain) {
          bestGain = gain;
          mostImproved = m;
        }
      }
    });

    return { totalAttempts, latestScore, avgScore, bestMethod, mostImproved };
  }, [history]);

  // Toggle method line visibility
  const toggleMethod = (key: string) => {
    setActiveMethods(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Reset to initial baseline
  const handleResetHistory = () => {
    if (confirm(isAr ? 'هل تريد استعادة سجل المحاولات القياسي المبدئي؟' : 'Reset history log to baseline demonstration data?')) {
      resetExamHistoryToBaseline();
      reloadHistory();
    }
  };

  // ---------------------------------------------------------------------------
  // D3 Timeline Line & Area Chart Render Effect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || history.length === 0 || chartMode !== 'timeline') return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 760;
    const height = 340;
    const margin = { top: 32, right: 36, bottom: 44, left: 52 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // X Scale: Session point
    const xLabels = history.map((d, i) => `${d.dateLabel} #${i + 1}`);
    const xScale = d3.scalePoint()
      .domain(xLabels)
      .range([margin.left, width - margin.right])
      .padding(0.4);

    // Y Scale: 0 to 100%
    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Horizontal grid lines
    const gridYValues = [20, 40, 60, 80, 100];
    g.selectAll('.grid-line')
      .data(gridYValues)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.4);

    // 70% Reference line (ASNT Level 1 Pass Threshold)
    g.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(70))
      .attr('y2', yScale(70))
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6);

    g.append('text')
      .attr('x', width - margin.right - 6)
      .attr('y', yScale(70) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#10b981')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('70% Pass Cutoff');

    // 80% Reference line (Level 2 Composite Threshold)
    g.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(80))
      .attr('y2', yScale(80))
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6);

    g.append('text')
      .attr('x', width - margin.right - 6)
      .attr('y', yScale(80) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#f59e0b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('80% Level II Target');

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    // Render X Axis
    const gx = g.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

    gx.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace');

    gx.select('.domain').attr('stroke', '#475569');

    // Render Y Axis
    const gy = g.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis);

    gy.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace');

    gy.select('.domain').attr('stroke', '#475569');

    // Draw lines and dots for each active method
    METHODS_CONFIG.forEach(cfg => {
      if (!activeMethods[cfg.key]) return;

      // Extract points
      const points: { xVal: string; score: number; entry: ExamHistoryEntry }[] = [];
      history.forEach((h, i) => {
        let score = -1;
        if (cfg.key === 'Overall') {
          score = h.overallScorePct;
        } else if (h.methodScores[cfg.key]) {
          score = h.methodScores[cfg.key].pct;
        }

        if (score >= 0) {
          points.push({
            xVal: xLabels[i],
            score,
            entry: h
          });
        }
      });

      if (points.length < 1) return;

      // Line generator
      const lineGen = d3.line<{ xVal: string; score: number }>()
        .x(d => xScale(d.xVal) || 0)
        .y(d => yScale(d.score))
        .curve(d3.curveMonotoneX);

      // Area gradient for Overall
      if (cfg.key === 'Overall' && points.length > 1) {
        const areaGen = d3.area<{ xVal: string; score: number }>()
          .x(d => xScale(d.xVal) || 0)
          .y0(yScale(0))
          .y1(d => yScale(d.score))
          .curve(d3.curveMonotoneX);

        const gradientId = 'overall-area-gradient';
        const defs = svg.append('defs');
        const linearGradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '0%')
          .attr('y2', '100%');

        linearGradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', '#f59e0b')
          .attr('stop-opacity', 0.25);

        linearGradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', '#f59e0b')
          .attr('stop-opacity', 0.0);

        g.append('path')
          .datum(points)
          .attr('fill', `url(#${gradientId})`)
          .attr('d', areaGen);
      }

      // Draw Path
      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', cfg.color)
        .attr('stroke-width', cfg.strokeWidth)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', lineGen);

      // Draw Points
      g.selectAll(`.dot-${cfg.key}`)
        .data(points)
        .enter()
        .append('circle')
        .attr('class', `dot-${cfg.key}`)
        .attr('cx', d => xScale(d.xVal) || 0)
        .attr('cy', d => yScale(d.score))
        .attr('r', cfg.key === 'Overall' ? 5 : 4)
        .attr('fill', cfg.color)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent, d) => {
          d3.select(event.currentTarget as SVGCircleElement)
            .transition()
            .duration(150)
            .attr('r', 7);

          setHoveredPoint({
            entry: d.entry,
            methodKey: cfg.key,
            score: d.score,
            x: event.clientX,
            y: event.clientY
          });
        })
        .on('mouseleave', (event: MouseEvent) => {
          d3.select(event.currentTarget as SVGCircleElement)
            .transition()
            .duration(150)
            .attr('r', cfg.key === 'Overall' ? 5 : 4);
          setHoveredPoint(null);
        });
    });
  }, [history, activeMethods, chartMode]);

  // ---------------------------------------------------------------------------
  // D3 Competency Spider / Radar Chart Render Effect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || history.length === 0 || chartMode !== 'competency_radar') return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 760;
    const height = 340;
    const radius = 110;
    const centerX = width / 2;
    const centerY = height / 2;

    const radarMethods = ['UT', 'RT', 'MT', 'PT', 'VT'];
    const angleSlice = (Math.PI * 2) / radarMethods.length;

    // Calculate method average scores
    const averages = radarMethods.map(m => {
      const vals: number[] = [];
      history.forEach(h => {
        if (h.methodScores[m]) vals.push(h.methodScores[m].pct);
      });
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;
    });

    const rScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Circular grid levels
    const levels = [25, 50, 75, 100];
    levels.forEach(lvl => {
      g.append('circle')
        .attr('r', rScale(lvl))
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5);

      g.append('text')
        .attr('x', 4)
        .attr('y', -rScale(lvl))
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(`${lvl}%`);
    });

    // 80% Target Benchmark Polygon
    const targetPoints = radarMethods.map((_, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      return [
        rScale(80) * Math.cos(angle),
        rScale(80) * Math.sin(angle)
      ];
    });

    g.append('polygon')
      .attr('points', targetPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.7);

    // Spokes and labels
    radarMethods.forEach((method, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // Spoke line
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#475569')
        .attr('stroke-width', 1);

      // Label
      const labelDistance = radius + 24;
      const lx = labelDistance * Math.cos(angle);
      const ly = labelDistance * Math.sin(angle);

      g.append('text')
        .attr('x', lx)
        .attr('y', ly + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`${method} (${averages[i]}%)`);
    });

    // User Proficiency Polygon
    const userPoints = radarMethods.map((_, i) => {
      const score = averages[i];
      const angle = i * angleSlice - Math.PI / 2;
      return [
        rScale(score) * Math.cos(angle),
        rScale(score) * Math.sin(angle)
      ];
    });

    g.append('polygon')
      .attr('points', userPoints.map(p => p.join(',')).join(' '))
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5);

    // User Point Circles
    userPoints.forEach(([x, y], i) => {
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4.5)
        .attr('fill', '#10b981')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2);
    });
  }, [history, chartMode]);

  return (
    <div
      data-testid="certification-exam-d3-trend-chart"
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm ${className}`}
    >
      {/* Header and Mode Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'تحليلات الأداء والتقدم الزمني التراكمي' : 'Longitudinal NDT Performance & Progress Analytics'}</span>
            <span aria-hidden="true">·</span>
            <span>D3.js Visualization Engine</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isAr
              ? 'مخطط تقدم الأداء ومعدلات الإتقان عبر طرق NDT مع مرور الوقت'
              : 'NDT Method Proficiency & Historical Progress Trends'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              data-testid="chart-mode-timeline"
              onClick={() => setChartMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'timeline'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAr ? 'المسار الزمني' : 'Timeline Curve'}</span>
            </button>
            <button
              type="button"
              data-testid="chart-mode-radar"
              onClick={() => setChartMode('competency_radar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'competency_radar'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isAr ? 'رادار الكفاءة' : 'Competency Radar'}</span>
            </button>
          </div>

          <button
            type="button"
            data-testid="reset-history-btn"
            onClick={handleResetHistory}
            title={isAr ? 'استعادة السجل الافتراضي' : 'Reset History to Baseline'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Performance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {isAr ? 'جلسات الاختبار المنجزة' : 'Total Sessions'}
          </span>
          <div data-testid="kpi-total-attempts" className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
            {kpiStats.totalAttempts}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {isAr ? 'جلسات مؤرخة' : 'Logged Exams'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {isAr ? 'آخر نتيجة محققة' : 'Latest Score'}
          </span>
          <div data-testid="kpi-latest-score" className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {kpiStats.latestScore}%
          </div>
          <span className="text-[10px] text-emerald-600/80 block mt-0.5">
            {kpiStats.latestScore >= 80 ? (isAr ? 'مستوى ثانٍ معتمد' : 'Level II Qualified') : (isAr ? 'مستوى أول مؤهل' : 'Level I Qualified')}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {isAr ? 'المتوسط التراكمي' : 'Overall Average'}
          </span>
          <div data-testid="kpi-avg-score" className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {kpiStats.avgScore}%
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {isAr ? 'عبر كافة المحاولات' : 'Across All Attempts'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {isAr ? 'أعلى طريقة إتقاناً' : 'Best Method'}
          </span>
          <div data-testid="kpi-best-method" className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
            {kpiStats.bestMethod}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {isAr ? 'أعلى معدل إجابات صحيحة' : 'Highest Accuracy'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {isAr ? 'الأكثر تحسناً' : 'Most Improved'}
          </span>
          <div data-testid="kpi-most-improved" className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
            {kpiStats.mostImproved}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {isAr ? 'أعلى قفزة في الإتقان' : 'Steepest Growth'}
          </span>
        </div>
      </div>

      {/* Interactive Method Toggles Legend (in Timeline Mode) */}
      {chartMode === 'timeline' && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold me-1">
            {isAr ? 'تصفية المنحنيات المعروضة:' : 'Filter Method Curves:'}
          </span>
          {METHODS_CONFIG.map(cfg => {
            const isActive = activeMethods[cfg.key];
            return (
              <button
                key={cfg.key}
                type="button"
                data-testid={`toggle-method-${cfg.key}`}
                onClick={() => toggleMethod(cfg.key)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'border-transparent text-slate-900 dark:text-white shadow-sm'
                    : 'opacity-40 border-slate-300 dark:border-slate-800 bg-transparent text-slate-500'
                }`}
                style={{
                  backgroundColor: isActive ? `${cfg.color}22` : undefined,
                  borderColor: isActive ? cfg.color : undefined
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                <span>{cfg.key}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* D3 Render Viewport */}
      <div className="relative overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2">
        <svg
          ref={svgRef}
          viewBox="0 0 760 340"
          className="w-full h-auto min-w-[640px] max-h-[380px] overflow-visible"
        />

        {/* Floating Tooltip Indicator */}
        {hoveredPoint && (
          <div
            data-testid="d3-chart-tooltip"
            className="absolute z-20 pointer-events-none p-3 rounded-xl border border-slate-700 bg-slate-950/95 text-white text-xs space-y-1 shadow-2xl backdrop-blur-md"
            style={{
              top: '16px',
              right: '16px',
              minWidth: '180px'
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-mono text-[11px] text-slate-400">
              <span>{hoveredPoint.entry.dateLabel}</span>
              <span className="text-amber-400 font-bold">{hoveredPoint.entry.level.toUpperCase()}</span>
            </div>
            <div className="flex justify-between font-bold pt-0.5">
              <span className="text-slate-300">{hoveredPoint.methodKey}:</span>
              <span className="font-mono text-emerald-400">{hoveredPoint.score}%</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{isAr ? 'المعدل الكلي:' : 'Overall:'}</span>
              <span className="font-mono">{hoveredPoint.entry.overallScorePct}%</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{isAr ? 'الحالة:' : 'Status:'}</span>
              <span className={`font-bold ${hoveredPoint.entry.isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                {hoveredPoint.entry.isPassed ? 'PASSED' : 'RETAKE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notes on ASNT / ISO Standard Trajectory */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>
            {isAr
              ? 'توضح المنحنيات تطور الدقة لكل طريقة فحص عبر الجلسات المتتالية نسبةً للحد الأدنى للاعتماد (70% للمستوى الأول و 80% للمستوى الثاني المركب).'
              : 'Curves illustrate chronological accuracy per inspection method against standard certification cutoffs (70% Level 1, 80% Level 2 composite).'}
          </span>
        </div>
        <span className="font-mono text-slate-400">
          {history.length} {isAr ? 'نقاط قياس مسجلة' : 'Recorded Data Points'}
        </span>
      </div>
    </div>
  );
};
