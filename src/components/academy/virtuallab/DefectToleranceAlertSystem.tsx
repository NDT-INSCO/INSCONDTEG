import React, { useEffect, useId, useState } from 'react';
import { Language } from '../../../types';
import {
  ALL_WELD_DEFECTS_CATALOG,
  ComprehensiveDefectSpec,
  DefectCodeToleranceResult,
  ExtendedWeldFlawId,
  INSPECTION_CODES_META,
  InspectionCodeId,
  getDefectCodeTolerance,
} from '../../../data/utWeldDefectsCatalog';
import {
  AlertTriangle,
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  Info,
  Scale,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';

/**
 * Maps each InspectionCodeId to its related INSCO Academy curriculum & library standards
 * (ASME Sec V, ASME Sec VIII, ASME Sec IX, ASME B31.3, API 570, API 1104, AWS D1.1, ISO 17640 / ISO 11666 / ISO 5817).
 */
export const INSCO_ACADEMY_STANDARD_ALIGNMENT: Record<
  InspectionCodeId,
  {
    academyRefBadge: string;
    scopeNote: { ar: string; en: string };
  }
> = {
  asme_viii: {
    academyRefBadge: 'ASME Sec VIII Div.1 · ASME Sec V Art.4 · ASME Sec IX',
    scopeNote: {
      ar: 'معتمد في منهج أكاديمية إنسكو لفحص أوعية الضغط والمراجل (طريقة الفحص والمعايرة طبقاً لـ ASME Sec V Art. 4، ومعايير القبول طبقاً لـ UW-51 & Mandatory Appendix 12).',
      en: 'Referenced in INSCO Academy for pressure vessels (NDE calibration per ASME Sec V Art. 4; acceptance per Sec VIII UW-51 & Mandatory Appendix 12).',
    },
  },
  asme_b31_3: {
    academyRefBadge: 'ASME B31.3 · API 570 · ASME Sec V',
    scopeNote: {
      ar: 'معتمد في أكاديمية إنسكو لفحص أنابيب العمليات والمصافي (Table 341.3.2 للتركيب الجديد، ومتكامل مع كود API 570 لفحص أنظمة الأنابيب في الخدمة).',
      en: 'Referenced in INSCO Academy for refinery & process piping (Table 341.3.2 construction limits, paired with API 570 in-service piping inspection).',
    },
  },
  aws_d1_1: {
    academyRefBadge: 'AWS D1.1 Clause 8 · Table 8.1 & 8.2',
    scopeNote: {
      ar: 'معتمد في أكاديمية إنسكو للهياكل والمنشآت الفولاذية (تقييم وصلات CJP بمعادلة فرق الكسب d = a - b - c وفئات الشدة Class A/B/C/D).',
      en: 'Referenced in INSCO Academy for structural steel welds (CJP groove evaluation using dB indication rating d = a - b - c across Classes A–D).',
    },
  },
  api_1104: {
    academyRefBadge: 'API Std 1104 Sec. 9 & 11.4 · API 570',
    scopeNote: {
      ar: 'معتمد في أكاديمية إنسكو للحام خطوط نقل البترول والغاز الحقلية (حدود الأطوال الخطية والحجمية المدفونة بالمليمتر ونسبة %DAC).',
      en: 'Referenced in INSCO Academy for cross-country oil & gas pipeline girth welds (explicit mm length & height tolerances under Sec. 9 & 11.4 UT).',
    },
  },
  iso_11666: {
    academyRefBadge: 'ISO 11666 · ISO 17640 · ISO 5817',
    scopeNote: {
      ar: 'معتمد في أكاديمية إنسكو للمواصفات الأوروبية والدولية (إجراء الفحص الصوتى ISO 17640، ومستوى القبول الصوتي AL 2 في ISO 11666 المربوط بمستويات الجودة ISO 5817).',
      en: 'Referenced in INSCO Academy international standards track (UT technique per ISO 17640, acceptance level AL 2 per ISO 11666 linked to ISO 5817 quality levels).',
    },
  },
};

/**
 * Maps legacy/summary 5-defect IDs in INSCO Academy's Defect Diagnostic tab (`EDUCATIONAL_DEFECTS`)
 * to the 16-defect engineering catalog so both simulators share identical code tolerance calculations.
 */
export function mapEducationalDefectToCatalogId(eduDefectId: string): ExtendedWeldFlawId {
  switch (eduDefectId) {
    case 'crack':
      return 'root_crack';
    case 'lack_of_fusion':
      return 'lack_of_fusion';
    case 'slag':
      return 'slag_inclusion';
    case 'porosity':
      return 'porosity_cluster';
    case 'undercut':
      return 'toe_undercut';
    default:
      return 'root_crack';
  }
}

interface DefectToleranceTooltipProps {
  defectId: ExtendedWeldFlawId;
  activeCode: InspectionCodeId;
  thicknessMm: number;
  language: Language;
  children: React.ReactElement;
  position?: 'top' | 'bottom';
}

/**
 * Accessible hover/focus visual alert Tooltip (`role="tooltip"`) wrapping defect selector buttons.
 * Renders floating multi-standard tolerance preview only while hovered or keyboard-focused
 * so normal card button labels remain clean and unobstructed.
 */
export const DefectToleranceTooltip: React.FC<DefectToleranceTooltipProps> = ({
  defectId,
  activeCode,
  thicknessMm,
  language,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const isAr = language === 'ar';

  const spec: ComprehensiveDefectSpec =
    ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === defectId) || ALL_WELD_DEFECTS_CATALOG[0];
  const activeTol = getDefectCodeTolerance(defectId, activeCode, thicknessMm);
  const activeCodeMeta =
    INSPECTION_CODES_META.find((c) => c.id === activeCode) || INSPECTION_CODES_META[0];

  // Compact cross-standard snapshot for quick hover comparison
  const comparisonCodes: InspectionCodeId[] = ['asme_viii', 'asme_b31_3', 'aws_d1_1', 'api_1104', 'iso_11666'];

  return (
    <div
      className="relative flex flex-col items-stretch"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          dir={isAr ? 'rtl' : 'ltr'}
          className={`pointer-events-none absolute z-40 w-72 sm:w-80 rounded-xl border bg-slate-950/98 p-3 shadow-2xl backdrop-blur-md transition-opacity ${
            activeTol.isZeroTolerance ? 'border-rose-500/50' : 'border-cyan-500/50'
          } ${
            position === 'top'
              ? 'bottom-full mb-2 start-0'
              : 'top-full mt-2 start-0'
          }`}
        >
          {/* Tooltip Alert Header */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800 text-[10px] font-mono">
            <span
              className={`font-bold flex items-center gap-1 ${
                activeTol.isZeroTolerance ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              {activeTol.isZeroTolerance ? (
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Scale className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {isAr
                  ? 'تنبيه السماحية — معايير أكاديمية إنسكو'
                  : 'INSCO Standards Tolerance Alert'}
              </span>
            </span>
            <span className="text-slate-400 tabular-nums">t={thicknessMm}mm</span>
          </div>

          {/* Active Defect & Primary Code Tolerance */}
          <div className="mt-2 space-y-1">
            <div className="text-[11px] font-bold text-white leading-snug">
              {spec.codeSymbol} · {spec.name[language]}
            </div>
            <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 font-mono text-[10.5px] tabular-nums">
              <div className="flex items-center justify-between gap-1 text-slate-400">
                <span>{activeCodeMeta.shortLabel}:</span>
                <span className="text-[9.5px] text-slate-500">{activeTol.clauseRef}</span>
              </div>
              <div
                className={`mt-0.5 font-bold ${
                  activeTol.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'
                }`}
              >
                {activeTol.toleranceBadge[language]}
              </div>
            </div>
          </div>

          {/* Mini Multi-Standard Comparison List */}
          <div className="mt-2 pt-1.5 border-t border-slate-800/90 space-y-1 font-mono text-[9.5px] tabular-nums">
            <div className="text-slate-400 font-semibold">
              {isAr ? 'مقارنة السماحية عبر المعايير الدولية:' : 'Allowable Limits Across International Codes:'}
            </div>
            {comparisonCodes.map((cId) => {
              const cMeta = INSPECTION_CODES_META.find((m) => m.id === cId)!;
              const cTol = getDefectCodeTolerance(defectId, cId, thicknessMm);
              const isCurr = cId === activeCode;
              return (
                <div
                  key={cId}
                  className={`flex items-center justify-between gap-2 ${
                    isCurr ? 'text-cyan-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <span className="shrink-0">{cMeta.shortLabel}</span>
                  <span
                    className={`truncate ${
                      cTol.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'
                    }`}
                  >
                    {cTol.isZeroTolerance
                      ? isAr
                        ? '0.0 مم (مرفوض)'
                        : '0.0 mm (Zero)'
                      : cTol.maxHeightOrDepthMm !== null
                      ? `L≤${cTol.maxLengthMm} · Δh≤${cTol.maxHeightOrDepthMm}mm`
                      : `L≤${cTol.maxLengthMm}mm`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9.5px] text-cyan-400 font-mono">
            {isAr
              ? 'اضغط لاختيار العيب وفتح نافذة تفاصيل السماحية الدولية'
              : 'Click defect to open full multi-standard tolerance modal'}
          </div>
        </div>
      )}
    </div>
  );
};

interface DefectToleranceTriggerBarProps {
  defectId: ExtendedWeldFlawId;
  activeCode: InspectionCodeId;
  thicknessMm: number;
  language: Language;
  autoAlertOnSelect: boolean;
  onToggleAutoAlert: (next: boolean) => void;
  onOpenModal: () => void;
  compact?: boolean;
}

/**
 * Compact control strip placed next to defect selectors so users can re-open the
 * visual tolerance alert Modal anytime or toggle automatic alert popups upon defect selection.
 */
export const DefectToleranceTriggerBar: React.FC<DefectToleranceTriggerBarProps> = ({
  defectId,
  activeCode,
  thicknessMm,
  language,
  autoAlertOnSelect,
  onToggleAutoAlert,
  onOpenModal,
  compact = false,
}) => {
  const isAr = language === 'ar';
  const tol = getDefectCodeTolerance(defectId, activeCode, thicknessMm);
  const spec = ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === defectId) || ALL_WELD_DEFECTS_CATALOG[0];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 font-mono text-xs ${
        tol.isZeroTolerance
          ? 'bg-rose-950/25 border-rose-500/35'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {tol.isZeroTolerance ? (
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className="text-slate-300 font-bold truncate">
          {spec.codeSymbol} · {spec.name[language]}
        </span>
        <span className="text-slate-500">·</span>
        <span
          className={`tabular-nums font-bold ${
            tol.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'
          }`}
        >
          {isAr ? 'السماحية المسموحة: ' : 'Allowable Tolerance: '}
          {tol.toleranceBadge[language]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenModal}
          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition cursor-pointer flex items-center gap-1.5"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>
            {compact
              ? isAr
                ? 'بطاقة السماحية الدولية'
                : 'Standards Tolerance Alert'
              : isAr
              ? 'عرض تنبيه السماحية وفق المعايير الدولية'
              : 'View International Standards Tolerance'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleAutoAlert(!autoAlertOnSelect)}
          aria-pressed={autoAlertOnSelect}
          title={
            isAr
              ? 'تفعيل أو إيقاف ظهور نافذة التنبيه المرئي تلقائياً عند اختيار عيب جديد'
              : 'Toggle automatic visual tolerance alert modal when selecting a defect'
          }
          className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold transition cursor-pointer flex items-center gap-1 ${
            autoAlertOnSelect
              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          {autoAlertOnSelect ? (
            <Bell className="w-3 h-3 text-cyan-400" />
          ) : (
            <BellOff className="w-3 h-3 text-slate-500" />
          )}
          <span>
            {isAr
              ? autoAlertOnSelect
                ? 'التنبيه التلقائي: مفعل'
                : 'التنبيه التلقائي: متوقف'
              : autoAlertOnSelect
              ? 'Auto-Alert: ON'
              : 'Auto-Alert: OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};

interface DefectToleranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectId: ExtendedWeldFlawId;
  activeCode: InspectionCodeId;
  onSelectCode?: (code: InspectionCodeId) => void;
  thicknessMm: number;
  measuredDimensions?: {
    lengthMm?: number;
    heightMm?: number;
    pctDac?: number;
    awsDRatingDb?: number;
  };
  language: Language;
  autoAlertOnSelect?: boolean;
  onToggleAutoAlert?: (next: boolean) => void;
}

/**
 * Full Accessible Visual Alert Modal (`role="dialog"`, `aria-modal="true"`) displayed
 * when selecting a defect in the simulation. Presents exact allowable tolerance values
 * (`L_max`, `Δh_max`, amplitude threshold, and clause citations) across all 5 international
 * standards referenced in INSCO Academy.
 */
export const DefectToleranceModal: React.FC<DefectToleranceModalProps> = ({
  isOpen,
  onClose,
  defectId,
  activeCode,
  onSelectCode,
  thicknessMm,
  measuredDimensions,
  language,
  autoAlertOnSelect,
  onToggleAutoAlert,
}) => {
  const isAr = language === 'ar';
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const spec: ComprehensiveDefectSpec =
    ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === defectId) || ALL_WELD_DEFECTS_CATALOG[0];

  const measL = measuredDimensions?.lengthMm ?? spec.lengthMm;
  const measH = measuredDimensions?.heightMm ?? spec.heightMm;

  const activeTolerance: DefectCodeToleranceResult = getDefectCodeTolerance(
    defectId,
    activeCode,
    thicknessMm,
    {
      lengthMm: measL,
      heightMm: measH,
      pctDac: measuredDimensions?.pctDac,
      awsDRatingDb: measuredDimensions?.awsDRatingDb,
    }
  );

  const activeCodeMeta =
    INSPECTION_CODES_META.find((c) => c.id === activeCode) || INSPECTION_CODES_META[0];
  const activeInscoAlignment = INSCO_ACADEMY_STANDARD_ALIGNMENT[activeCode];

  const allStandardsRows = INSPECTION_CODES_META.map((codeMeta) => ({
    codeMeta,
    alignment: INSCO_ACADEMY_STANDARD_ALIGNMENT[codeMeta.id],
    tolerance: getDefectCodeTolerance(defectId, codeMeta.id, thicknessMm, {
      lengthMm: measL,
      heightMm: measH,
      pctDac: measuredDimensions?.pctDac,
      awsDRatingDb: measuredDimensions?.awsDRatingDb,
    }),
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#080d1a] text-slate-100 shadow-2xl"
      >
        {/* Top Instrument Alert Header */}
        <div
          className={`flex items-start justify-between gap-4 p-4 sm:p-5 border-b ${
            activeTolerance.isZeroTolerance
              ? 'bg-rose-950/35 border-rose-500/40'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span
                className={`inline-flex items-center gap-1.5 font-bold ${
                  activeTolerance.isZeroTolerance ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {activeTolerance.isZeroTolerance ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <Scale className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {isAr
                    ? 'تنبيه مرئي لقيم السماحية المسموح بها — معايير أكاديمية إنسكو الدولية'
                    : 'VISUAL DEFECT TOLERANCE ALERT — INSCO ACADEMY INTERNATIONAL STANDARDS'}
                </span>
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-cyan-300 font-bold tabular-nums">
                {spec.codeSymbol} ({spec.category})
              </span>
            </div>

            <h3 id={titleId} className="text-lg sm:text-xl font-black text-white">
              {spec.name[language]}
            </h3>

            <p id={descId} className="text-xs text-slate-400 leading-relaxed">
              {spec.nature[language]}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق نافذة تنبيه السماحية' : 'Close tolerance alert modal'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* 1. Primary Active Standard Alert Banner & Numerical Limits */}
          <div
            className={`rounded-xl border p-4 space-y-3 ${
              activeTolerance.isZeroTolerance
                ? 'bg-rose-950/20 border-rose-500/40'
                : activeTolerance.reject
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-emerald-950/20 border-emerald-500/40'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/90">
              <div className="space-y-0.5">
                <div className="text-[11px] font-mono text-slate-400">
                  {isAr ? 'المعيار الدولي النشط حالياً في المحاكاة:' : 'Currently Active Simulation Standard:'}
                </div>
                <div className="text-sm sm:text-base font-bold text-white">
                  {activeCodeMeta.fullTitle[language]}
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  {activeInscoAlignment.academyRefBadge}
                </div>
              </div>

              <div className="text-end font-mono tabular-nums">
                <div className="text-[11px] text-slate-400">
                  {isAr ? `عند سماكة العينة t = ${thicknessMm} مم` : `At Specimen Thickness t = ${thicknessMm} mm`}
                </div>
                <div
                  className={`text-xs sm:text-sm font-black mt-0.5 ${
                    activeTolerance.reject ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {activeTolerance.reject
                    ? isAr
                      ? 'حكم العينة الحالية: مرفوض (REJECT)'
                      : 'Simulated Flaw Status: REJECT'
                    : isAr
                    ? 'حكم العينة الحالية: ضمن السماحية (ACCEPT)'
                    : 'Simulated Flaw Status: ACCEPT'}
                </div>
              </div>
            </div>

            {/* Key Allowable Numerical Readouts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono tabular-nums">
              <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3">
                <div className="text-[10.5px] text-slate-400">
                  {isAr ? 'أقصى طول مسموح به (L_max)' : 'Max Allowable Length (L_max)'}
                </div>
                <div
                  className={`text-base sm:text-lg font-black mt-1 ${
                    activeTolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'
                  }`}
                >
                  {activeTolerance.isZeroTolerance
                    ? isAr
                      ? '0.0 مم (ممنوع كلياً)'
                      : '0.0 mm (Prohibited)'
                    : `≤ ${activeTolerance.maxLengthMm.toFixed(1)} mm`}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-1">
                  {isAr
                    ? `طول العيب بالمحاكاة: L = ${measL.toFixed(1)} مم`
                    : `Simulated defect length: L = ${measL.toFixed(1)} mm`}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3">
                <div className="text-[10.5px] text-slate-400">
                  {isAr ? 'أقصى ارتفاع / عمق مسموح (Δh_max)' : 'Max Allowable Height/Depth (Δh_max)'}
                </div>
                <div
                  className={`text-base sm:text-lg font-black mt-1 ${
                    activeTolerance.isZeroTolerance ? 'text-rose-400' : 'text-cyan-300'
                  }`}
                >
                  {activeTolerance.isZeroTolerance
                    ? isAr
                      ? '0.0 مم (صفر سماحية)'
                      : '0.0 mm (Zero)'
                    : activeTolerance.maxHeightOrDepthMm !== null
                    ? `≤ ${activeTolerance.maxHeightOrDepthMm.toFixed(1)} mm`
                    : isAr
                    ? 'محكوم بالطول والسعة'
                    : 'Governed by L & %DAC'}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-1">
                  {isAr
                    ? `ارتفاع العيب بالمحاكاة: Δh = ${measH.toFixed(1)} مم`
                    : `Simulated defect height: Δh = ${measH.toFixed(1)} mm`}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3">
                <div className="text-[10.5px] text-slate-400">
                  {isAr ? 'معيار السعة وفقرة الكود' : 'Amplitude Rule & Code Clause'}
                </div>
                <div className="text-xs font-bold text-amber-300 mt-1 leading-snug">
                  {activeTolerance.amplitudeCriterion[language]}
                </div>
                <div className="text-[10.5px] text-slate-400 mt-1">{activeTolerance.clauseRef}</div>
              </div>
            </div>

            {/* Engineering Explanation */}
            <div className="rounded-lg bg-slate-950/70 border border-slate-800/90 p-3 text-xs space-y-1">
              <div className="text-slate-200 leading-relaxed">
                {activeTolerance.toleranceRuleSummary[language]}
              </div>
              <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{activeInscoAlignment.scopeNote[language]}</span>
              </div>
            </div>
          </div>

          {/* 2. Multi-Standard Comparison Table Across All International Standards in INSCO Academy */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>
                  {isAr
                    ? `جدول مقارنة قيم السماحية المسموح بها لهذا العيب في كافة المعايير الدولية بأكاديمية إنسكو (t = ${thicknessMm} مم):`
                    : `Allowable Tolerance Comparison Across All INSCO Academy International Standards (t = ${thicknessMm} mm):`}
                </span>
              </h4>
              {onSelectCode && (
                <span className="text-[11px] font-mono text-slate-400">
                  {isAr
                    ? 'يمكنك التبديل الفوري لأي كود بالضغط على زر الاعتماد'
                    : 'Click any standard row to apply it to the live simulator'}
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-start border-collapse font-mono text-[11px] tabular-nums">
                <thead className="bg-slate-900/95 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-start">{isAr ? 'المعيار الدولي' : 'International Standard'}</th>
                    <th className="p-2.5 text-start">{isAr ? 'قيمة السماحية المسموح بها' : 'Allowable Tolerance Value'}</th>
                    <th className="p-2.5 text-start">{isAr ? 'شرط السعة / الفئة' : 'Amplitude / Condition'}</th>
                    <th className="p-2.5 text-start">{isAr ? 'الفقرة المرجعية' : 'Clause Reference'}</th>
                    <th className="p-2.5 text-start">{isAr ? 'الحكم الحالي' : 'Disposition'}</th>
                    {onSelectCode && (
                      <th className="p-2.5 text-end">{isAr ? 'تطبيق' : 'Apply'}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {allStandardsRows.map(({ codeMeta, alignment, tolerance }) => {
                    const isCurrent = codeMeta.id === activeCode;
                    return (
                      <tr
                        key={codeMeta.id}
                        onClick={() => onSelectCode && onSelectCode(codeMeta.id)}
                        className={`border-b border-slate-800/70 transition ${
                          onSelectCode ? 'cursor-pointer' : ''
                        } ${
                          isCurrent
                            ? 'bg-cyan-950/40 text-white'
                            : 'text-slate-300 hover:bg-slate-900/70'
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="font-bold text-cyan-300">{codeMeta.shortLabel}</div>
                          <div className="text-[9.5px] text-slate-500">{alignment.academyRefBadge}</div>
                        </td>
                        <td className="p-2.5 font-bold">
                          <span
                            className={
                              tolerance.isZeroTolerance ? 'text-rose-400' : 'text-emerald-300'
                            }
                          >
                            {tolerance.toleranceBadge[language]}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400 max-w-xs">
                          {tolerance.amplitudeCriterion[language]}
                        </td>
                        <td className="p-2.5 text-slate-400">{tolerance.clauseRef}</td>
                        <td className="p-2.5 font-bold">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              tolerance.reject ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {tolerance.reject ? (
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                            )}
                            <span>{tolerance.reject ? 'REJECT' : 'ACCEPT'}</span>
                          </span>
                        </td>
                        {onSelectCode && (
                          <td className="p-2.5 text-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCode(codeMeta.id);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                isCurrent
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400'
                              }`}
                            >
                              {isCurrent
                                ? isAr
                                  ? 'مُعتمد ✓'
                                  : 'Active ✓'
                                : isAr
                                ? 'اعتماد الكود'
                                : 'Use Code'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Modal Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 font-mono text-xs">
            {onToggleAutoAlert && typeof autoAlertOnSelect === 'boolean' ? (
              <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAlertOnSelect}
                  onChange={(e) => onToggleAutoAlert(e.target.checked)}
                  className="rounded accent-cyan-500 cursor-pointer"
                />
                <span>
                  {isAr
                    ? 'إظهار هذا التنبيه المرئي تلقائياً عند اختيار أي عيب في المحاكاة'
                    : 'Automatically show this tolerance alert modal when selecting a defect'}
                </span>
              </label>
            ) : (
              <span className="text-slate-400 text-[11px]">
                {isAr
                  ? 'مرجع المعايير: ASME BPVC Sec V / VIII / IX · ASME B31.3 · API 1104 / 570 · AWS D1.1 · ISO 11666 / 5817'
                  : 'Standards Ref: ASME Sec V / VIII / IX · ASME B31.3 · API 1104 / 570 · AWS D1.1 · ISO 11666 / 5817'}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition cursor-pointer"
            >
              {isAr ? 'إغلاق ومتابعة الفحص بالمحاكي' : 'Close & Continue Simulation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
