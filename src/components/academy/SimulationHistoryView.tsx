import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  History,
  Plus,
  Search,
  Sliders,
  Trash2,
  TrendingDown,
  X,
  XCircle,
} from 'lucide-react';
import type { Language } from '../../types';
import type { AcademyTab } from '../../academyTabs';
import { ALL_WELD_DEFECTS_CATALOG } from '../../data/utWeldDefectsCatalog';
import {
  SIMULATION_XP_MILESTONES,
  calculateSimulationAttemptXp,
  useSimulationHistory,
  type SimulationAttemptStatus,
  type SimulationNdtMethod,
} from '../../utils/simulationHistoryStore';
import { SimulationLevelUpToast } from './SimulationLevelUpToast';

interface SimulationHistoryViewProps {
  language: Language;
  onOpenSubTab?: (subTab: AcademyTab) => void;
  suppressGlobalToast?: boolean;
}

function formatAttemptTimestamp(iso: string, language: Language): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(parsed);
  } catch {
    return iso.replace('T', ' ').slice(0, 19);
  }
}

export const SimulationHistoryView: React.FC<SimulationHistoryViewProps> = ({
  language,
  onOpenSubTab,
  suppressGlobalToast = false,
}) => {
  const isAr = language === 'ar';
  const { attempts, stats, recordAttempt, deleteAttempt, clearHistory } =
    useSimulationHistory();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | SimulationAttemptStatus>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | SimulationNdtMethod>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  // Quick manual/practice simulation log drawer state
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [quickMethod, setQuickMethod] = useState<SimulationNdtMethod>('UT');
  const [quickStatus, setQuickStatus] = useState<SimulationAttemptStatus>('PASS');
  const [quickAccuracyPct, setQuickAccuracyPct] = useState<number>(92);
  const [quickSelectedDefectIds, setQuickSelectedDefectIds] = useState<string[]>(['root_crack']);
  const [quickStandard, setQuickStandard] = useState<string>('ASME Sec VIII Div.1 (UW-51)');

  const previewQuickXp = useMemo(
    () =>
      calculateSimulationAttemptXp({
        status: quickStatus,
        accuracyPct: quickAccuracyPct,
        defectCount: quickSelectedDefectIds.length,
      }),
    [quickStatus, quickAccuracyPct, quickSelectedDefectIds.length]
  );

  const filteredAttempts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attempts.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (methodFilter !== 'ALL' && item.ndtMethod !== methodFilter) return false;
      if (!q) return true;

      const defectBlob = item.defectTypes
        .map((d) => `${d.ar} ${d.en} ${d.id}`)
        .join(' ')
        .toLowerCase();
      const simBlob = `${item.simulatorTitle.ar} ${item.simulatorTitle.en} ${item.ndtMethod} ${
        item.codeStandard ?? ''
      }`.toLowerCase();

      return defectBlob.includes(q) || simBlob.includes(q);
    });
  }, [attempts, statusFilter, methodFilter, searchQuery]);

  const handleToggleQuickDefect = (id: string) => {
    setQuickSelectedDefectIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev;
      }
      return [...prev, id];
    });
  };

  const handleSaveQuickAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenDefects = ALL_WELD_DEFECTS_CATALOG.filter((d) =>
      quickSelectedDefectIds.includes(d.id)
    ).map((d) => ({
      id: d.id,
      ar: d.name.ar,
      en: d.name.en,
    }));

    if (chosenDefects.length === 0) return;

    recordAttempt({
      simulatorId: 'manual_practice_log',
      targetSubTab: 'weld_simulator',
      simulatorTitle: {
        ar: 'تسجيل تمرين محاكاة عملي موثق',
        en: 'Documented NDT Simulation Practice Run',
      },
      ndtMethod: quickMethod,
      defectTypes: chosenDefects,
      status: quickStatus,
      scorePct: quickAccuracyPct,
      codeVerdict: quickStatus === 'PASS' ? 'ACCEPT' : 'REJECT',
      traineeVerdict: quickStatus === 'PASS' ? 'ACCEPT' : 'REJECT',
      codeStandard: quickStandard,
    });
    setIsQuickLogOpen(false);
  };

  const availableMethods: Array<{ id: 'ALL' | SimulationNdtMethod; label: string }> = [
    { id: 'ALL', label: isAr ? 'كل الطرق' : 'All Methods' },
    { id: 'UT', label: 'UT' },
    { id: 'PAUT', label: 'PAUT' },
    { id: 'DAC', label: 'DAC' },
    { id: 'MULTI', label: isAr ? 'متعدد' : 'Multi-NDT' },
  ];

  return (
    <section
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'سجل المحاكاة' : 'Simulation History'}
      className="rounded-2xl border border-slate-800 bg-[#0b0e20] p-5 sm:p-8 space-y-6 text-slate-100"
    >
      {!suppressGlobalToast && <SimulationLevelUpToast language={language} />}

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <History className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'سجل المحاكاة المحلي المستمر · نظام نقاط الخبرة والترقيات (XP)'
                : 'PERSISTENT LOCAL SIMULATION LOG · ACCURACY-BASED XP & MILESTONES'}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isAr ? 'سجل المحاكاة ونقاط الخبرة (Simulation History & XP)' : 'Simulation History'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isAr
              ? 'يتتبع جميع محاولاتك السابقة في محاكيات الفحص غير الإتلافي (UT، PAUT، منحنى DAC، ومحاكي العيوب)، ويحسب نقاط الخبرة (XP) المكتسبة بناءً على دقة اكتشاف العيب وتحجيمه مع ترقيات المستويات.'
              : 'Tracks your previous NDT simulation attempts across UT, PAUT, ASME DAC, and Weld Defect simulators—calculating Experience Points (XP) from defect detection accuracy and unlocking inspector milestones.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickLogOpen((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل محاولة محاكاة' : 'Log Simulation Attempt'}</span>
          </button>

          {attempts.length > 0 && !confirmClearAll && (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-300 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح السجل' : 'Clear History'}</span>
            </button>
          )}

          {confirmClearAll && (
            <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-2.5 py-1.5 text-xs">
              <span className="text-rose-200 font-semibold">
                {isAr ? 'حذف كل المحاولات؟' : 'Clear all attempts?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearHistory();
                  setConfirmClearAll(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                {isAr ? 'تأكيد المسح' : 'Confirm Clear'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-2 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inspector XP Level & Milestone Progression Strip */}
      <div
        data-testid="sim-history-milestone-panel"
        className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-amber-400/35 bg-amber-500/10 flex items-center justify-center text-amber-300 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-300 font-bold tabular-nums">
                {isAr
                  ? `المستوى ${stats.level} · رتبة المفتش الحالية`
                  : `Level ${stats.level} · Current Inspector Milestone`}
              </div>
              <div
                data-testid="sim-history-level-title"
                className="text-base sm:text-lg font-black text-white"
              >
                {stats.levelTitle[language]}
              </div>
            </div>
          </div>

          <div className="font-mono tabular-nums text-xs sm:text-end space-y-0.5">
            <div className="text-sm font-black text-amber-300">
              {stats.totalXp} / {stats.nextTierXp} XP
            </div>
            <div className="text-[11px] text-slate-400">
              {isAr
                ? `متبقي ${stats.xpNeededForNext} XP للترقية إلى المستوى ${stats.level + 1}`
                : `${stats.xpNeededForNext} XP needed for Level ${stats.level + 1}`}
            </div>
          </div>
        </div>

        {/* Compositor-Only Progress Track (scaleX) */}
        <div
          role="progressbar"
          aria-label={isAr ? 'التقدم نحو المستوى التالي' : 'Progress toward next XP milestone'}
          aria-valuemin={stats.currentTierMinXp}
          aria-valuemax={stats.nextTierXp}
          aria-valuenow={stats.totalXp}
          className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden"
        >
          <div
            style={{ transform: `scaleX(${Math.max(0.02, stats.tierProgressPct / 100)})` }}
            className="h-full w-full bg-gradient-to-r from-cyan-500 to-amber-400 ltr:origin-left rtl:origin-right transition-transform duration-200"
          />
        </div>

        {/* Unboxed Milestone Threshold Reference */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono tabular-nums text-slate-400">
          {SIMULATION_XP_MILESTONES.map((m, idx) => {
            const reached = stats.totalXp >= m.minXp;
            return (
              <React.Fragment key={m.level}>
                {idx > 0 && (
                  <span aria-hidden="true" className="text-slate-700">
                    ·
                  </span>
                )}
                <span className={reached ? 'text-cyan-300 font-semibold' : 'text-slate-500'}>
                  {isAr ? `م${m.level}` : `Lv.${m.level}`} ({m.minXp} XP)
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Collapsible Manual / Multi-Defect Practice Attempt Recorder */}
      {isQuickLogOpen && (
        <form
          onSubmit={handleSaveQuickAttempt}
          className="rounded-xl border border-cyan-500/35 bg-slate-950 p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="text-xs sm:text-sm font-bold text-white">
              {isAr
                ? 'تسجيل محاولة محاكاة جديدة في السجل المحلي'
                : 'Record NDT Simulation Attempt'}
            </div>
            <button
              type="button"
              onClick={() => setIsQuickLogOpen(false)}
              aria-label={isAr ? 'إغلاق نموذج التسجيل' : 'Close form'}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Method */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                {isAr ? 'طريقة الفحص (NDT Method)' : 'NDT Method'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 font-mono">
                {(['UT', 'PAUT', 'DAC', 'MULTI'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setQuickMethod(m)}
                    className={`py-1.5 rounded-lg border font-bold cursor-pointer ${
                      quickMethod === m
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Pass / Fail Status */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                {isAr ? 'نتيجة المحاولة (Pass / Fail)' : 'Simulation Status (Pass / Fail)'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setQuickStatus('PASS');
                    if (quickAccuracyPct < 70) setQuickAccuracyPct(92);
                  }}
                  className={`py-1.5 rounded-lg border font-bold cursor-pointer ${
                    quickStatus === 'PASS'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  PASS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickStatus('FAIL');
                    if (quickAccuracyPct >= 70) setQuickAccuracyPct(40);
                  }}
                  className={`py-1.5 rounded-lg border font-bold cursor-pointer ${
                    quickStatus === 'FAIL'
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  FAIL
                </button>
              </div>
            </div>

            {/* Detection Accuracy Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="sim-hist-accuracy" className="text-slate-300 font-semibold">
                  {isAr ? 'دقة اكتشاف العيب:' : 'Detection Accuracy:'}
                </label>
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {quickAccuracyPct}% · +{previewQuickXp} XP
                </span>
              </div>
              <input
                id="sim-hist-accuracy"
                type="range"
                min={0}
                max={100}
                step={1}
                value={quickAccuracyPct}
                onChange={(e) => setQuickAccuracyPct(Number(e.target.value))}
                aria-label={isAr ? 'نسبة دقة اكتشاف العيب' : 'Defect Detection Accuracy'}
                className="w-full accent-amber-400 cursor-pointer mt-1"
              />
            </div>

            {/* Standard */}
            <div className="space-y-1.5">
              <label htmlFor="sim-hist-standard" className="block text-slate-300 font-semibold">
                {isAr ? 'الكود المرجعي' : 'Reference Standard'}
              </label>
              <select
                id="sim-hist-standard"
                value={quickStandard}
                onChange={(e) => setQuickStandard(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-white font-mono text-xs"
              >
                <option value="ASME Sec VIII Div.1 (UW-51)">ASME Sec VIII Div.1 (UW-51)</option>
                <option value="ASME B31.3 Table 341.3.2">ASME B31.3 Table 341.3.2</option>
                <option value="AWS D1.1 Clause 8">AWS D1.1 Clause 8</option>
                <option value="API Std 1104 Sec. 9">API Std 1104 Sec. 9</option>
                <option value="ISO 11666 / ISO 5817">ISO 11666 / ISO 5817</option>
              </select>
            </div>
          </div>

          {/* Multi-Select Defect Types */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              {isAr
                ? 'اختر نوع العيب أو العيوب التي تم فحصها (Selected Defect Types):'
                : 'Select Inspected Defect Types:'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
              {ALL_WELD_DEFECTS_CATALOG.map((defect) => {
                const checked = quickSelectedDefectIds.includes(defect.id);
                return (
                  <button
                    key={defect.id}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => handleToggleQuickDefect(defect.id)}
                    className={`p-2 rounded-lg border text-start text-[11px] transition cursor-pointer ${
                      checked
                        ? 'bg-cyan-950/60 border-cyan-400 text-white font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-mono text-cyan-400">{defect.codeSymbol}</span> ·{' '}
                    <span>{defect.name[language]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsQuickLogOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer tabular-nums"
            >
              {isAr
                ? `حفظ المحاولة (+${previewQuickXp} XP)`
                : `Save Attempt (+${previewQuickXp} XP)`}
            </button>
          </div>
        </form>
      )}

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono tabular-nums">
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'إجمالي المحاولات المسجلة' : 'Total Attempts'}
          </div>
          <div
            data-testid="sim-history-total-count"
            className="mt-1 text-2xl sm:text-3xl font-black text-white"
          >
            {stats.totalAttempts}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAr
              ? `${stats.uniqueDefectCount} أنواع عيوب مفحوصة`
              : `${stats.uniqueDefectCount} defect types covered`}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'نقاط الخبرة (XP)' : 'Experience Points'}
          </div>
          <div
            data-testid="sim-history-total-xp"
            className="mt-1 text-2xl sm:text-3xl font-black text-amber-300"
          >
            {stats.totalXp} XP
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAr
              ? `متوسط الدقة ${stats.averageAccuracyPct}%`
              : `${stats.averageAccuracyPct}% avg detection accuracy`}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'محاولات ناجحة (PASS)' : 'Passed Attempts'}
          </div>
          <div
            data-testid="sim-history-pass-count"
            className="mt-1 text-2xl sm:text-3xl font-black text-emerald-400"
          >
            {stats.passCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAr ? 'اجتياز مطابق للكود' : 'Code-compliant evaluation'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'محاولات غير مجتازة (FAIL)' : 'Failed Attempts'}
          </div>
          <div
            data-testid="sim-history-fail-count"
            className="mt-1 text-2xl sm:text-3xl font-black text-rose-400"
          >
            {stats.failCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAr ? 'رفض أو عدم تطابق التقييم' : 'Rejected or mismatched verdict'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400">
            {isAr ? 'معدل النجاح الإجمالي' : 'Overall Pass Rate'}
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-cyan-400">
            {stats.passRatePct}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAr ? 'محفوظ محلياً عبر الجلسات' : 'Persisted in localStorage'}
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 inline-flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'الحالة:' : 'Status:'}</span>
          </span>

          {(
            [
              { id: 'ALL', label: isAr ? `الكل (${stats.totalAttempts})` : `All (${stats.totalAttempts})` },
              { id: 'PASS', label: isAr ? `ناجح PASS (${stats.passCount})` : `Pass (${stats.passCount})` },
              { id: 'FAIL', label: isAr ? `راسب FAIL (${stats.failCount})` : `Fail (${stats.failCount})` },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer border tabular-nums ${
                  active
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <span aria-hidden="true" className="hidden sm:inline text-slate-700">
            |
          </span>

          <div className="flex flex-wrap items-center gap-1">
            {availableMethods.map((m) => {
              const active = methodFilter === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodFilter(m.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
                    active
                      ? 'bg-slate-800 text-amber-300 border-amber-400/50'
                      : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Filter Input */}
        <div className="relative w-full lg:w-72">
          <Search
            aria-hidden="true"
            className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute top-1/2 -translate-y-1/2 start-3"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={isAr ? 'بحث في سجل المحاكاة' : 'Filter simulation history'}
            placeholder={
              isAr ? 'ابحث بنوع العيب أو الكود...' : 'Filter by defect type or code...'
            }
            className="w-full rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:outline-none py-1.5 ps-8 pe-3 text-xs text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Attempts List or Empty State */}
      {attempts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-8 sm:p-10 text-center space-y-4">
          <div className="mx-auto w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <History className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-lg mx-auto">
            <h4 className="text-base sm:text-lg font-bold text-white">
              {isAr
                ? 'لا توجد محاولات محاكاة مسجلة حتى الآن'
                : 'No NDT simulation attempts recorded yet'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isAr
                ? 'ابدأ تشغيل أي من محاكيات الفحص غير الإتلافي أدناه وقم بتقييم العيوب لحفظ محاولاتك تلقائياً واكتساب نقاط الخبرة (XP) للترقية إلى المستوى التالي.'
                : 'Run an inspection in any of the Academy NDT simulators below or log a practice run above—each attempt awards Experience Points (XP) based on defect detection accuracy.'}
            </p>
          </div>

          {onOpenSubTab && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenSubTab('weld_simulator')}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {isAr ? 'فتح محاكي فحص اللحام UT/PAUT' : 'Open Weld UT/PAUT Simulator'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSubTab('paut_controller')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isAr ? 'فتح وحدة تحكم PAUT' : 'Open PAUT Controller'}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSubTab('dac_builder')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{isAr ? 'فتح مختبر منحنى DAC' : 'Open ASME DAC Builder'}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSubTab('defects')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'محاكي عيوب اللحام' : 'Open Weld Defect Simulator'}</span>
              </button>
            </div>
          )}
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
          <div className="text-sm font-bold text-slate-200">
            {isAr
              ? 'لا توجد محاولات تطابق عوامل التصفية الحالية'
              : 'No simulation attempts match the active filters'}
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setMethodFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            {isAr ? 'إعادة ضبط البحث والتصفية' : 'Reset search and filters'}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-start border-collapse text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4 text-start">
                  {isAr ? 'أنواع العيوب المختارة' : 'Selected Defect Types'}
                </th>
                <th className="py-3 px-4 text-start">
                  {isAr ? 'المحاكي وطريقة الفحص' : 'Simulator & Method'}
                </th>
                <th className="py-3 px-4 text-start">
                  {isAr ? 'الحالة (Pass / Fail)' : 'Pass / Fail Status'}
                </th>
                <th className="py-3 px-4 text-start">
                  {isAr ? 'نقاط الخبرة (XP)' : 'Experience Points (XP)'}
                </th>
                <th className="py-3 px-4 text-start">
                  {isAr ? 'التاريخ والوقت' : 'Timestamp'}
                </th>
                <th className="py-3 px-4 text-end">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAttempts.map((attempt) => {
                const isPass = attempt.status === 'PASS';
                return (
                  <tr
                    key={attempt.id}
                    data-testid="simulation-history-row"
                    className="hover:bg-slate-900/50 transition"
                  >
                    {/* Selected Defect Types + Unboxed Inline Metadata */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-white text-xs sm:text-sm leading-snug">
                        {attempt.defectTypes.map((d) => d[language]).join(' ، ')}
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-1.5">
                        {attempt.codeStandard && <span>{attempt.codeStandard}</span>}
                        {typeof attempt.measuredDepthMm === 'number' && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">
                              ·
                            </span>
                            <span>D={attempt.measuredDepthMm.toFixed(1)}mm</span>
                          </>
                        )}
                        {typeof attempt.measuredLengthMm === 'number' && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">
                              ·
                            </span>
                            <span>L={attempt.measuredLengthMm.toFixed(1)}mm</span>
                          </>
                        )}
                      </div>
                      {attempt.notes && (
                        <div className="mt-1 text-[11px] text-slate-500 max-w-md leading-relaxed">
                          {attempt.notes[language]}
                        </div>
                      )}
                    </td>

                    {/* Simulator & NDT Method */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono text-xs font-bold text-cyan-300">
                        {attempt.ndtMethod}
                        <span aria-hidden="true" className="text-slate-600 mx-1.5">
                          ·
                        </span>
                        <span className="font-sans font-semibold text-slate-200">
                          {attempt.simulatorTitle[language]}
                        </span>
                      </div>
                      {onOpenSubTab && (
                        <button
                          type="button"
                          onClick={() => onOpenSubTab(attempt.targetSubTab)}
                          className="mt-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                        >
                          {isAr ? 'إعادة فتح المحاكي ←' : 'Open simulator →'}
                        </button>
                      )}
                    </td>

                    {/* Pass / Fail Status */}
                    <td className="py-3.5 px-4 align-top font-mono">
                      <div
                        className={`inline-flex items-center gap-1.5 font-black text-xs ${
                          isPass ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPass ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{isPass ? (isAr ? 'ناجح · PASS' : 'PASS') : isAr ? 'راسب · FAIL' : 'FAIL'}</span>
                      </div>
                      {attempt.codeVerdict && (
                        <div className="mt-1 text-[11px] text-slate-400">
                          <span>
                            {isAr ? 'حكم الكود:' : 'Code:'} {attempt.codeVerdict}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Experience Points (XP) & Detection Accuracy */}
                    <td className="py-3.5 px-4 align-top font-mono whitespace-nowrap">
                      <div
                        data-testid="simulation-attempt-xp"
                        className="font-black text-xs text-amber-300"
                      >
                        +{attempt.xpEarned} XP
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {isAr
                          ? `دقة الكشف ${attempt.accuracyPct}%`
                          : `${attempt.accuracyPct}% accuracy`}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 align-top font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <time dateTime={attempt.timestamp}>
                          {formatAttemptTimestamp(attempt.timestamp, language)}
                        </time>
                      </div>
                    </td>

                    {/* Delete Single Record */}
                    <td className="py-3.5 px-4 align-top text-end">
                      <button
                        type="button"
                        onClick={() => deleteAttempt(attempt.id)}
                        aria-label={
                          isAr
                            ? `حذف محاولة ${attempt.defectTypes[0]?.ar ?? ''}`
                            : `Delete attempt for ${attempt.defectTypes[0]?.en ?? ''}`
                        }
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
