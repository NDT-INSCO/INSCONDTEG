import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  FlaskConical,
  Play,
  Sliders,
  Sparkles,
  Table,
  Trash2,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  computeDriveSimulatorMetrics,
  type ImportedDriveSimulator,
} from '../../utils/driveAcademyImporter';
import {
  removeImportedDriveSimulator,
  useDriveAcademyLibrary,
} from '../../utils/driveAcademyStore';
import type { SimulationLabsSectionId } from './InteractiveWorkshops';

interface DriveSimulatorRunnerProps {
  language: Language;
  onSelectLabSection?: (section: SimulationLabsSectionId) => void;
  onOpenFullRtLab?: () => void;
}

function mapTabToWorkshopSection(tab: string): SimulationLabsSectionId | null {
  switch (tab) {
    case 'ge_exposure_time':
      return 'ge_exposure_time';
    case 'sim_labs_rt':
      return 'rt_panorama_ellipse_street';
    case 'ar_rt_codes':
      return 'ar_rt_all_codes';
    case 'workshops':
      return 'ndt_workbench';
    default:
      return null;
  }
}

export const DriveSimulatorRunner: React.FC<DriveSimulatorRunnerProps> = ({
  language,
  onSelectLabSection,
  onOpenFullRtLab,
}) => {
  const isAr = language === 'ar';
  const { simulators } = useDriveAcademyLibrary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});

  const activeSim: ImportedDriveSimulator | null = useMemo(() => {
    if (simulators.length === 0) return null;
    return simulators.find(s => s.id === selectedId) ?? simulators[0];
  }, [selectedId, simulators]);

  useEffect(() => {
    if (!activeSim) return;
    const initial: Record<string, number> = {};
    for (const param of activeSim.params) {
      initial[param.key] = param.defaultValue;
    }
    setParamValues(initial);
  }, [activeSim?.id]);

  const metrics = useMemo(() => {
    if (!activeSim) return [];
    return computeDriveSimulatorMetrics(activeSim, paramValues);
  }, [activeSim, paramValues]);

  if (simulators.length === 0 || !activeSim) {
    return null;
  }

  const handleOpenTargetLab = (sim: ImportedDriveSimulator) => {
    const mapped = mapTabToWorkshopSection(sim.targetLabTab);
    if (mapped && onSelectLabSection) {
      onSelectLabSection(mapped);
      return;
    }
    if (sim.targetLabTab === 'rt_lab' && onOpenFullRtLab) {
      onOpenFullRtLab();
      return;
    }
    window.location.hash = `#${sim.targetLabTab}`;
  };

  const applyDatasetRow = (headers: string[], row: string[]) => {
    const next = { ...paramValues };
    headers.forEach((header, idx) => {
      const numeric = Number(String(row[idx] ?? '').replace(/[^0-9.-]/g, ''));
      if (!Number.isFinite(numeric)) return;
      const lower = header.toLowerCase();
      for (const param of activeSim.params) {
        if (
          lower.includes('thick') || lower.includes('سمك')
            ? param.key === 'thicknessMm'
            : lower.includes('sfd') || lower.includes('dist')
            ? param.key === 'sfdMm'
            : lower.includes('ci') || lower.includes('activ')
            ? param.key === 'activityCi'
            : lower.includes('angle') || lower.includes('زاوية')
            ? param.key === 'angleDeg'
            : lower.includes('temp') || lower.includes('حرارة')
            ? param.key === 'holdTempC'
            : false
        ) {
          next[param.key] = Math.min(param.max, Math.max(param.min, numeric));
        }
      }
    });
    setParamValues(next);
  };

  return (
    <section
      id="drive-imported-simulators"
      data-testid="drive-imported-simulators"
      className="rounded-2xl border border-emerald-500/35 bg-[#0a1024] p-4 sm:p-5 space-y-4"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-black text-emerald-300">
            <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'محاكيات مستوردة من Google Drive' : 'Simulators Imported from Google Drive'}</span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-white">
            {isAr
              ? `معامل المحاكاة التطبيقية المستخلصة (${simulators.length})`
              : `Extracted Vocational Simulators (${simulators.length})`}
          </h4>
        </div>
      </div>

      {/* Simulator selector grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {simulators.map(sim => {
          const selected = sim.id === activeSim.id;
          return (
            <button
              key={sim.id}
              type="button"
              onClick={() => setSelectedId(sim.id)}
              className={`flex min-w-0 items-start justify-between gap-2 rounded-xl border p-3 text-start transition cursor-pointer ${
                selected
                  ? 'border-emerald-400 bg-emerald-500/15 text-white'
                  : 'border-[#252e58] bg-[#0d132c] text-slate-300 hover:border-emerald-400/50'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded border border-emerald-400/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-emerald-300">
                    {sim.discipline}
                  </span>
                  <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-300">
                    {sim.mode === 'html-sandbox'
                      ? (isAr ? 'محاكي تفاعلي' : 'Interactive HTML')
                      : sim.mode === 'dataset-lab'
                      ? (isAr ? 'بيانات معايرة' : 'Dataset Lab')
                      : (isAr ? 'معمل فيزيائي' : 'Physics Lab')}
                  </span>
                </div>
                <p className="text-xs font-bold leading-snug break-words">
                  {isAr ? sim.titleAr : sim.titleEn}
                </p>
              </div>
              <Play className="w-4 h-4 shrink-0 text-emerald-400 mt-1" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* Active Simulator Workbench */}
      <div className="rounded-2xl border border-[#29315b] bg-[#070b1a] p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <h5 className="text-sm sm:text-base font-black text-white">
              {isAr ? activeSim.titleAr : activeSim.titleEn}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr ? activeSim.summaryAr : activeSim.summaryEn}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenTargetLab(activeSim)}
              className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? `فتح المعمل المتكامل (${activeSim.targetLabTab})`
                  : `Launch Integrated Lab (${activeSim.targetLabTab})`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => removeImportedDriveSimulator(activeSim.id)}
              className="inline-flex min-w-0 items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-300 cursor-pointer"
              aria-label={isAr ? 'حذف المحاكي المستورد' : 'Remove imported simulator'}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'حذف' : 'Remove'}</span>
            </button>
          </div>
        </div>

        {/* Sandboxed HTML Simulation Frame (if HTML file) */}
        {activeSim.htmlContent ? (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'تشغيل تفاعلي معزول من ملف Drive' : 'Sandboxed Interactive Drive Simulation'}</span>
            </div>
            <iframe
              title={activeSim.titleEn}
              srcDoc={activeSim.htmlContent}
              sandbox="allow-scripts"
              className="w-full h-80 rounded-xl border border-[#2d3666] bg-white"
            />
          </div>
        ) : null}

        {/* Interactive Physics Controls & Live Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3 rounded-xl border border-[#222b52] bg-[#0b1024] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-sky-300">
              <Sliders className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'متغيرات التجربة التفاعلية' : 'Interactive Simulation Parameters'}</span>
            </div>
            {activeSim.params.map(param => {
              const current = paramValues[param.key] ?? param.defaultValue;
              return (
                <label key={param.key} className="block space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span>{isAr ? param.labelAr : param.labelEn}</span>
                    <span className="font-mono font-bold text-amber-300">
                      {current} {param.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={current}
                    onChange={e =>
                      setParamValues(prev => ({ ...prev, [param.key]: Number(e.target.value) }))
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>

          <div className="space-y-2.5 rounded-xl border border-[#222b52] bg-[#0b1024] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
              <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'مخرجات المحاكاة الحية' : 'Live Simulation Outputs'}</span>
            </div>
            <div className="grid gap-2">
              {metrics.map(metric => (
                <div
                  key={metric.labelEn}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#29315b] bg-[#080d1e] px-3 py-2 text-xs"
                >
                  <span className="text-slate-300">{isAr ? metric.labelAr : metric.labelEn}</span>
                  <span
                    className={`font-mono font-black ${
                      metric.status === 'pass'
                        ? 'text-emerald-300'
                        : metric.status === 'warning'
                        ? 'text-amber-300'
                        : 'text-sky-300'
                    }`}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
            {activeSim.formulas.length > 0 ? (
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-2.5 text-[11px] font-mono text-slate-200 space-y-1">
                <div className="text-[10px] text-amber-300 font-sans font-bold">
                  {isAr ? 'المعادلات المستخلصة:' : 'Extracted Formulas:'}
                </div>
                {activeSim.formulas.slice(0, 3).map((f, idx) => (
                  <div key={idx} dir="ltr" className="break-all">
                    {f}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Tabular Dataset Scenarios (if CSV / Sheet) */}
        {activeSim.datasetHeaders && activeSim.datasetRows && activeSim.datasetRows.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-[#222b52] bg-[#0b1024] p-3.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
              <Table className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? 'بيانات وسيناريوهات مستوردة (اضغط على أي صف لتطبيقه على المحاكي)'
                  : 'Imported Scenario Rows (click any row to load into simulator)'}
              </span>
            </div>
            <table className="w-full text-[11px] text-start border-collapse">
              <thead>
                <tr className="border-b border-[#29315b] text-slate-400">
                  {activeSim.datasetHeaders.map((h, i) => (
                    <th key={i} className="py-1.5 px-2 font-bold text-start">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSim.datasetRows.slice(0, 8).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    onClick={() => applyDatasetRow(activeSim.datasetHeaders!, row)}
                    className="border-b border-[#1c2345] hover:bg-emerald-500/10 cursor-pointer text-slate-200"
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-1.5 px-2 font-mono">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
};
