import React, { useMemo, useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle2,
  XCircle,
  Sliders,
  Link2,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { RtDefectClassification, RtGoverningCodeId } from '../../../data/rtSimulationData';
import {
  AR_RT_ACCEPTANCE_CODES,
  AR_RT_FILM_DEFECTS,
  ArRtAcceptanceCodeId,
  ArRtFilmDefectId,
  ArRtSingleCodeVerdict,
  evaluateDefectAcrossAllCodes,
} from '../../../data/arRadiographyCompleteEngine';

export type RtSimulatorDefectSelection = ArRtFilmDefectId | 'sound';

export interface RtAllCodesEvaluationInput {
  defectId: RtSimulatorDefectSelection;
  wallThicknessMm: number;
  indicationLengthMm: number;
  indicationWidthMm: number;
  indicationDepthMm: number;
  indicationCount: number;
}

export function mapLabClassificationToArDefectId(
  cls: RtDefectClassification
): RtSimulatorDefectSelection {
  switch (cls) {
    case 'crack':
      return 'crack_longitudinal';
    case 'incomplete_penetration':
      return 'incomplete_penetration';
    case 'lack_of_fusion':
      return 'lack_of_fusion';
    case 'slag_inclusion':
      return 'slag_elongated_wagon';
    case 'porosity':
      return 'porosity_scattered';
    case 'tungsten_inclusion':
      return 'tungsten_inclusion';
    case 'undercut':
      return 'undercut_cap';
    case 'sound':
    default:
      return 'sound';
  }
}

export function evaluateFilmReadingAcrossAllCodes(
  input: RtAllCodesEvaluationInput
): ArRtSingleCodeVerdict[] {
  if (input.defectId === 'sound') {
    return AR_RT_ACCEPTANCE_CODES.map((code) => ({
      codeId: code.id,
      shortCode: code.shortCode,
      clauseRef: `${code.shortCode} Standard Baseline`,
      verdict: 'ACCEPT',
      measuredPrimaryMm: 0,
      maxAllowedMm: 0,
      utilizationPct: 0,
      governingParameter: 'length',
      ruleFormula: 'No Rejectable Discontinuities Detected (Sound Weld)',
      rationale: {
        ar: `اللحام سليم وخالٍ من الانقطاعات المرفوضة عند مراجعته وفق معايير ${code.shortCode}.`,
        en: `Sound weld metal with zero rejectable indications under ${code.shortCode}.`,
      },
    }));
  }

  return evaluateDefectAcrossAllCodes({
    defectId: input.defectId,
    wallThicknessMm: input.wallThicknessMm,
    indicationLengthMm: input.indicationLengthMm,
    indicationWidthMm: input.indicationWidthMm,
    indicationDepthMm: input.indicationDepthMm,
    indicationCount: input.indicationCount,
    weldEvalWindowMm: 150,
  });
}

function mapArCodeToLabGoverningCode(codeId: ArRtAcceptanceCodeId): RtGoverningCodeId | null {
  if (codeId === 'ASME_VIII_UW51') return 'ASME_VIII_UW51';
  if (codeId === 'ASME_B31_3_NORMAL') return 'ASME_B31_3';
  if (codeId === 'API_1104') return 'API_1104';
  return null;
}

interface ContrastPreset {
  id: string;
  label: { ar: string; en: string };
  defectId: RtSimulatorDefectSelection;
  wallThicknessMm: number;
  lengthMm: number;
  widthMm: number;
  depthMm: number;
  count: number;
}

const CODE_CONTRAST_PRESETS: readonly ContrastPreset[] = [
  {
    id: 'crater_crack_api_exception',
    label: {
      ar: 'شرخ فوهة 3.5 مم (مفارقة API 1104)',
      en: 'Crater Crack 3.5 mm (API 1104 Exception)',
    },
    defectId: 'crack_crater',
    wallThicknessMm: 12.7,
    lengthMm: 3.5,
    widthMm: 2.8,
    depthMm: 1.4,
    count: 1,
  },
  {
    id: 'wagon_slag_12mm',
    label: {
      ar: 'خبث طولي 12 مم (تباين UW-51 و UW-52)',
      en: 'Wagon Track Slag 12 mm (UW-51 vs UW-52)',
    },
    defectId: 'slag_elongated_wagon',
    wallThicknessMm: 18.0,
    lengthMm: 12.0,
    widthMm: 1.5,
    depthMm: 2.0,
    count: 1,
  },
  {
    id: 'scattered_porosity_spot',
    label: {
      ar: 'مسامية متفرقة 2.5 مم (إعفاء UW-52 Spot)',
      en: 'Scattered Porosity 2.5 mm (UW-52 Spot Exempt)',
    },
    defectId: 'porosity_scattered',
    wallThicknessMm: 16.0,
    lengthMm: 2.5,
    widthMm: 2.5,
    depthMm: 1.5,
    count: 4,
  },
  {
    id: 'root_lop_shallow',
    label: {
      ar: 'عدم تغلغل جذر 14 مم (B31.3 مقابل UW-51)',
      en: 'Shallow Root LOP 14 mm (B31.3 vs UW-51)',
    },
    defectId: 'incomplete_penetration',
    wallThicknessMm: 16.0,
    lengthMm: 14.0,
    widthMm: 1.6,
    depthMm: 0.8,
    count: 1,
  },
];

export interface RtAllCodesAcceptanceSimulatorProps {
  language: Language;
  specimenWeldTag: string;
  specimenWallThicknessMm: number;
  traineeClassification: RtDefectClassification;
  traineeLengthMm: number;
  activeGoverningCode: RtGoverningCodeId;
  blindExamMode: boolean;
  hasSubmitted: boolean;
  officialClassification: RtDefectClassification;
  officialLengthMm: number;
  onSelectGoverningCode?: (code: RtGoverningCodeId) => void;
  onApplyLengthToReport?: (lengthMm: number) => void;
}

export const RtAllCodesAcceptanceSimulator: React.FC<RtAllCodesAcceptanceSimulatorProps> = ({
  language,
  specimenWeldTag,
  specimenWallThicknessMm,
  traineeClassification,
  traineeLengthMm,
  activeGoverningCode,
  blindExamMode,
  hasSubmitted,
  officialClassification,
  officialLengthMm,
  onSelectGoverningCode,
  onApplyLengthToReport,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  const [simMode, setSimMode] = useState<'sync_film' | 'what_if'>('sync_film');
  const [customDefectId, setCustomDefectId] = useState<RtSimulatorDefectSelection>(
    () => mapLabClassificationToArDefectId(traineeClassification)
  );
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(specimenWallThicknessMm);
  const [lengthMm, setLengthMm] = useState<number>(
    traineeClassification === 'sound' ? 0 : Math.max(0.5, traineeLengthMm)
  );
  const [widthMm, setWidthMm] = useState<number>(1.8);
  const [depthMm, setDepthMm] = useState<number>(1.5);
  const [indicationCount, setIndicationCount] = useState<number>(1);
  const [focusedCodeId, setFocusedCodeId] = useState<ArRtAcceptanceCodeId>('ASME_VIII_UW51');

  // Keep focused code aligned with active governing code when it switches
  useEffect(() => {
    if (activeGoverningCode === 'ASME_VIII_UW51') setFocusedCodeId('ASME_VIII_UW51');
    else if (activeGoverningCode === 'ASME_B31_3') setFocusedCodeId('ASME_B31_3_NORMAL');
    else if (activeGoverningCode === 'API_1104') setFocusedCodeId('API_1104');
  }, [activeGoverningCode]);

  // Sync thickness when specimen switches in sync mode
  useEffect(() => {
    if (simMode === 'sync_film') {
      setWallThicknessMm(specimenWallThicknessMm);
    }
  }, [specimenWallThicknessMm, simMode]);

  // Sync defect type & caliper/input length in sync_film mode
  useEffect(() => {
    if (simMode === 'sync_film') {
      const mapped = mapLabClassificationToArDefectId(traineeClassification);
      setCustomDefectId(mapped);
      setLengthMm(traineeClassification === 'sound' ? 0 : Math.max(0, traineeLengthMm));
      if (mapped !== 'sound') {
        const spec = AR_RT_FILM_DEFECTS.find((d) => d.id === mapped);
        if (spec) {
          setWidthMm(spec.defaultWidthMm);
          setDepthMm(Number(Math.max(0.4, specimenWallThicknessMm * spec.defaultDepthRatio).toFixed(1)));
          setIndicationCount(spec.defaultCountInWindow);
        }
      }
    }
  }, [simMode, traineeClassification, traineeLengthMm, specimenWallThicknessMm]);

  const effectiveDefectId: RtSimulatorDefectSelection =
    simMode === 'sync_film'
      ? mapLabClassificationToArDefectId(traineeClassification)
      : customDefectId;

  const effectiveWallMm = simMode === 'sync_film' ? specimenWallThicknessMm : wallThicknessMm;
  const effectiveLengthMm =
    simMode === 'sync_film'
      ? traineeClassification === 'sound'
        ? 0
        : traineeLengthMm
      : customDefectId === 'sound'
      ? 0
      : lengthMm;

  const verdicts = useMemo(
    () =>
      evaluateFilmReadingAcrossAllCodes({
        defectId: effectiveDefectId,
        wallThicknessMm: effectiveWallMm,
        indicationLengthMm: effectiveLengthMm,
        indicationWidthMm: widthMm,
        indicationDepthMm: depthMm,
        indicationCount,
      }),
    [effectiveDefectId, effectiveWallMm, effectiveLengthMm, widthMm, depthMm, indicationCount]
  );

  const acceptCount = verdicts.filter((v) => v.verdict === 'ACCEPT').length;
  const rejectCount = verdicts.length - acceptCount;
  const hasDivergence = acceptCount > 0 && rejectCount > 0;

  const activeDefectSpec =
    effectiveDefectId === 'sound'
      ? null
      : AR_RT_FILM_DEFECTS.find((d) => d.id === effectiveDefectId) ?? AR_RT_FILM_DEFECTS[0];

  const focusedCodeMeta =
    AR_RT_ACCEPTANCE_CODES.find((c) => c.id === focusedCodeId) ?? AR_RT_ACCEPTANCE_CODES[0];
  const focusedVerdict =
    verdicts.find((v) => v.codeId === focusedCodeId) ?? verdicts[0];

  const handleSelectDefectVariant = (defectId: RtSimulatorDefectSelection) => {
    setSimMode('what_if');
    setCustomDefectId(defectId);
    if (defectId === 'sound') {
      setLengthMm(0);
      setWidthMm(0);
      setDepthMm(0);
      setIndicationCount(0);
      return;
    }
    const spec = AR_RT_FILM_DEFECTS.find((d) => d.id === defectId);
    if (spec) {
      setLengthMm(spec.defaultLengthMm);
      setWidthMm(spec.defaultWidthMm);
      setDepthMm(Number(Math.max(0.4, wallThicknessMm * spec.defaultDepthRatio).toFixed(1)));
      setIndicationCount(spec.defaultCountInWindow);
    }
  };

  const handleApplyPreset = (preset: ContrastPreset) => {
    setSimMode('what_if');
    setCustomDefectId(preset.defectId);
    setWallThicknessMm(preset.wallThicknessMm);
    setLengthMm(preset.lengthMm);
    setWidthMm(preset.widthMm);
    setDepthMm(preset.depthMm);
    setIndicationCount(preset.count);
  };

  const handleLoadOfficialSpecimenKey = () => {
    setSimMode('what_if');
    const mapped = mapLabClassificationToArDefectId(officialClassification);
    setCustomDefectId(mapped);
    setWallThicknessMm(specimenWallThicknessMm);
    setLengthMm(officialLengthMm);
    if (mapped !== 'sound') {
      const spec = AR_RT_FILM_DEFECTS.find((d) => d.id === mapped);
      if (spec) {
        setWidthMm(spec.defaultWidthMm);
        setDepthMm(Number(Math.max(0.4, specimenWallThicknessMm * spec.defaultDepthRatio).toFixed(1)));
        setIndicationCount(spec.defaultCountInWindow);
      }
    }
  };

  const shellSurface = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const subSurface = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-800'
    : 'bg-slate-950/85 border-slate-800 text-slate-200';
  const inputSurface = isLight
    ? 'bg-white border-slate-300 text-slate-900'
    : 'bg-slate-900 border-slate-700 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const canRevealOfficialLoader = !blindExamMode || hasSubmitted;

  return (
    <section
      data-testid="rt-all-codes-acceptance-simulator"
      dir={isAr ? 'rtl' : 'ltr'}
      className={`rounded-2xl border p-5 sm:p-6 space-y-5 shadow-xl ${shellSurface}`}
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-500">
            <Scale className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'محاكاة معايير القبول والرفض لجميع الأكواد العالمية (7 أكواد)'
                : 'All-Codes Radiographic Acceptance & Rejection Criteria Simulator (7 Codes)'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight">
            {isAr
              ? 'مختبر مقارنة قرارات القبول والرفض الفورية أثناء قراءة الفيلم'
              : 'Live Multi-Code Film Sentencing & Threshold Comparison Matrix'}
          </h3>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            {isAr
              ? 'قارن تأثير نوع العيب وأبعاده وسماكة الجدار لحظياً عبر ASME VIII (UW-51 / UW-52) و ASME B31.3 و B31.1 و API 1104 و AWS D1.1 و ISO 10675-1.'
              : 'Compare how wall thickness, flaw type, length, width, and depth flip verdicts in real time across ASME VIII (UW-51 / UW-52), B31.3, B31.1, API 1104, AWS D1.1, and ISO 10675-1.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="rt-codes-mode-sync"
            onClick={() => setSimMode('sync_film')}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              simMode === 'sync_film'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isAr ? 'مزامنة قراءة التقرير والمسطرة' : 'Sync Film Report & Caliper'}
            </span>
          </button>

          <button
            type="button"
            data-testid="rt-codes-mode-whatif"
            onClick={() => setSimMode('what_if')}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              simMode === 'what_if'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isAr ? 'مختبر جميع العيوب والأبعاد (18 عيب)' : '18-Defect Boundary Sandbox'}
            </span>
          </button>

          {canRevealOfficialLoader && (
            <button
              type="button"
              data-testid="rt-codes-load-specimen"
              onClick={handleLoadOfficialSpecimenKey}
              className={`px-3 py-2 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isAr ? 'تحميل عيب العينة الفعلي للمقارنة' : 'Load Specimen True Flaw'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Divergence Presets Strip */}
      <div className="space-y-2">
        <div className={`text-[11px] font-bold flex items-center gap-1.5 ${mutedText}`}>
          <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            {isAr
              ? 'سيناريوهات مفارقات الأكواد الميدانية (اضغط لاختبار اختلاف القبول والرفض بين الأكواد):'
              : 'Classic Multi-Code Divergence Scenarios (Click to Inspect Inter-Code Contrasts):'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {CODE_CONTRAST_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={`rt-code-preset-${preset.id}`}
              onClick={() => handleApplyPreset(preset)}
              className={`px-3 py-2 rounded-lg border text-xs font-bold text-start transition cursor-pointer ${
                isLight
                  ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400 hover:bg-amber-50/60'
                  : 'bg-slate-950/70 text-slate-200 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
              }`}
            >
              {preset.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Body: Left Parameter Workbench (4 cols) + Right 7-Code Verdict Matrix (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Flaw Variant & Dimensional Sliders */}
        <div className={`lg:col-span-5 rounded-xl border p-4 space-y-4 ${subSurface}`}>
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-700/20">
            <span className="text-xs font-black">
              {simMode === 'sync_film'
                ? isAr
                  ? 'القيم المتزامنة مع استمارة التقرير'
                  : 'Synced Report Indication Inputs'
                : isAr
                ? 'مُدخَلات المحاكاة الحرة للعيب والأبعاد'
                : 'Interactive Flaw & Geometry Inputs'}
            </span>
            <span className="text-[11px] font-mono text-cyan-500 font-bold tabular-nums">
              {specimenWeldTag}
            </span>
          </div>

          {/* Flaw Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="rt-all-codes-defect-select"
              className="block text-xs font-bold"
            >
              {isAr ? 'نوع العيب / الانقطاع الإشعاعي:' : 'Radiographic Discontinuity Variant:'}
            </label>
            <select
              id="rt-all-codes-defect-select"
              data-testid="rt-all-codes-defect-select"
              value={effectiveDefectId}
              onChange={(e) =>
                handleSelectDefectVariant(e.target.value as RtSimulatorDefectSelection)
              }
              className={`w-full px-3 py-2 rounded-lg border text-xs font-bold ${inputSurface}`}
            >
              <option value="sound">
                {isAr
                  ? 'لحام سليم — لا توجد انقطاعات مرفوضة (Sound Weld)'
                  : 'Sound Weld — No Rejectable Discontinuities'}
              </option>
              {AR_RT_FILM_DEFECTS.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.codeSymbol}] {d.name[language]}
                </option>
              ))}
            </select>
            {simMode === 'sync_film' && (
              <div className={`text-[11px] leading-snug ${mutedText}`}>
                {isAr
                  ? 'مرتبط الآن بتصنيف التقرير وطول المسطرة بالأسفل. تغيير القائمة أعلاه سينقلك لوضع الاختبار الحر (18 عيباً).'
                  : 'Synced with report classification & caliper length. Choosing a sub-variant switches to Sandbox mode.'}
              </div>
            )}
          </div>

          {/* Active Defect Radiographic Signature Note */}
          {activeDefectSpec && (
            <div
              className={`rounded-lg border p-3 text-[11px] space-y-1 leading-relaxed ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="font-bold text-amber-500">
                {activeDefectSpec.codeSymbol} ·{' '}
                {activeDefectSpec.isPlanarCritical
                  ? isAr
                    ? 'عيب مستوي حرج (Planar Flaw)'
                    : 'Critical Planar Flaw'
                  : isAr
                  ? 'عيب حجمي / هندسي (Volumetric / Profile)'
                  : 'Volumetric / Geometry Discontinuity'}
              </div>
              <div className={mutedText}>{activeDefectSpec.filmAppearance[language]}</div>
            </div>
          )}

          {/* Geometric & Flaw Sliders */}
          <div className="space-y-3 tabular-nums">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>{isAr ? 'سماكة الجدار t (Wall Thickness):' : 'Wall Thickness (t):'}</span>
                <span className="font-bold text-cyan-500">{effectiveWallMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                aria-label={isAr ? 'سماكة الجدار بالمليمتر' : 'Wall thickness mm'}
                data-testid="rt-codes-wall-slider"
                min={4}
                max={75}
                step={0.5}
                value={effectiveWallMm}
                onChange={(e) => {
                  setSimMode('what_if');
                  setWallThicknessMm(Number(e.target.value));
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>{isAr ? 'طول العيب L (Indication Length):' : 'Indication Length (L):'}</span>
                <span className="font-bold text-amber-500">{effectiveLengthMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                aria-label={isAr ? 'طول العيب بالمليمتر' : 'Indication length mm'}
                data-testid="rt-codes-length-slider"
                min={0}
                max={80}
                step={0.5}
                value={effectiveLengthMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSimMode('what_if');
                  setLengthMm(val);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span>{isAr ? 'العرض / القطر W:' : 'Width / Dia W:'}</span>
                  <span className="font-bold">{widthMm.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  aria-label={isAr ? 'عرض أو قطر العيب' : 'Indication width or diameter'}
                  data-testid="rt-codes-width-slider"
                  min={0.2}
                  max={12.0}
                  step={0.1}
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span>{isAr ? 'العمق d (Depth):' : 'Flaw Depth d:'}</span>
                  <span className="font-bold">{depthMm.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  aria-label={isAr ? 'عمق العيب' : 'Indication depth'}
                  data-testid="rt-codes-depth-slider"
                  min={0.1}
                  max={8.0}
                  step={0.1}
                  value={depthMm}
                  onChange={(e) => setDepthMm(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span>
                  {isAr
                    ? 'عدد الدلالات في نافذة الكود (Count):'
                    : 'Count in Code Window:'}
                </span>
                <span className="font-bold">{indicationCount}</span>
              </div>
              <input
                type="range"
                aria-label={isAr ? 'عدد الدلالات' : 'Indication count'}
                data-testid="rt-codes-count-slider"
                min={1}
                max={12}
                step={1}
                value={indicationCount}
                onChange={(e) => setIndicationCount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {onApplyLengthToReport && simMode === 'what_if' && (
              <button
                type="button"
                onClick={() => onApplyLengthToReport(effectiveLengthMm)}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
                    : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `نقل الطول (${effectiveLengthMm.toFixed(1)} مم) إلى استمارة التقرير`
                    : `Copy Length (${effectiveLengthMm.toFixed(1)} mm) to Interpretation Sheet`}
                </span>
              </button>
            )}
          </div>

          {/* Focused Code Deep Inspection Card */}
          <div
            className={`rounded-lg border p-3.5 space-y-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-black">{focusedCodeMeta.title[language]}</span>
              <span
                className={`font-mono font-black ${
                  focusedVerdict.verdict === 'ACCEPT' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {focusedVerdict.verdict}
              </span>
            </div>
            <div className={`text-[11px] font-mono ${mutedText}`}>
              {focusedCodeMeta.editionLabel} · {focusedVerdict.clauseRef}
            </div>
            <div className="text-[11px] font-medium text-amber-500 leading-relaxed">
              {focusedCodeMeta.scopeSummary[language]}
            </div>
          </div>
        </div>

        {/* Right: All 7 Codes Verdict Matrix */}
        <div className="lg:col-span-7 space-y-3">
          {/* KPI Summary Bar */}
          <div
            className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-3 tabular-nums ${subSurface}`}
          >
            <div className="flex items-center gap-4 text-xs font-mono font-black">
              <span data-testid="rt-codes-accept-count" className="text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {acceptCount} / {verdicts.length} ACCEPT
                </span>
              </span>
              <span data-testid="rt-codes-reject-count" className="text-rose-500 flex items-center gap-1">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>
                  {rejectCount} / {verdicts.length} REJECT
                </span>
              </span>
            </div>

            <div className="text-xs font-bold flex items-center gap-1.5">
              {hasDivergence ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-amber-500">
                    {isAr
                      ? 'تباين بين الأكواد — نفس العيب مقبول في كود ومرفوض في آخر'
                      : 'Code Divergence — Same Flaw Accepted by Some Codes, Rejected by Others'}
                  </span>
                </>
              ) : acceptCount === verdicts.length ? (
                <span className="text-emerald-500">
                  {isAr ? 'إجماع كامل بالقبول عبر الـ 7 أكواد' : 'Unanimous ACCEPT Across All 7 Codes'}
                </span>
              ) : (
                <span className="text-rose-500">
                  {isAr ? 'إجماع كامل بالرفض عبر الـ 7 أكواد' : 'Unanimous REJECT Across All 7 Codes'}
                </span>
              )}
            </div>
          </div>

          {/* 7-Code Cards Grid */}
          <div data-testid="rt-all-codes-verdict-list" className="space-y-2.5">
            {verdicts.map((v) => {
              const isAccept = v.verdict === 'ACCEPT';
              const isFocused = focusedCodeId === v.codeId;
              const mappedLabCode = mapArCodeToLabGoverningCode(v.codeId);
              const isActiveFormCode = mappedLabCode === activeGoverningCode;
              const barPct =
                v.governingParameter === 'zero_tolerance'
                  ? 100
                  : v.governingParameter === 'exempt_in_spot'
                  ? 15
                  : Math.min(100, Math.max(2, v.utilizationPct));

              return (
                <div
                  key={v.codeId}
                  data-testid={`rt-film-code-row-${v.codeId}`}
                  className={`relative rounded-xl border p-3.5 transition space-y-2 ${
                    isFocused
                      ? isLight
                        ? 'border-cyan-500 bg-cyan-50/40'
                        : 'border-cyan-400 bg-cyan-500/10'
                      : subSurface
                  }`}
                >
                  <button
                    type="button"
                    aria-label={isAr ? `عرض تفاصيل ${v.shortCode}` : `Show ${v.shortCode} details`}
                    aria-pressed={isFocused}
                    onClick={() => setFocusedCodeId(v.codeId)}
                    className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-cyan-500"
                  />
                  {/* Top Row: Code Name + Clause + Explicit Icon Verdict */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                      <span className="text-sm font-black">{v.shortCode}</span>
                      <span className={`text-[11px] font-mono ${mutedText}`}>
                        {v.clauseRef}
                      </span>
                      {isActiveFormCode && (
                        <span className="text-[11px] font-mono font-bold text-cyan-500">
                          · {isAr ? 'الكود النشط بالتقرير' : 'Active Report Code'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {mappedLabCode && onSelectGoverningCode && !isActiveFormCode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGoverningCode(mappedLabCode);
                          }}
                          className={`relative z-20 px-2 py-1 rounded border text-[11px] font-bold transition cursor-pointer ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-700 hover:border-cyan-500'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400'
                          }`}
                        >
                          {isAr ? 'اعتماده بالتقرير' : 'Use in Sheet'}
                        </button>
                      )}

                      <span
                        data-testid={`rt-film-code-status-${v.codeId}`}
                        className={`px-2.5 py-1 rounded-md border text-xs font-mono font-black flex items-center gap-1.5 ${
                          isAccept
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                            : 'bg-rose-500/15 text-rose-500 border-rose-500/40'
                        }`}
                      >
                        {isAccept ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{isAr ? (isAccept ? 'مقبول ACCEPT' : 'مرفوض REJECT') : v.verdict}</span>
                      </span>
                    </div>
                  </div>

                  {/* Formula & Quantitative Measurement vs Limit */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                    <span className="text-amber-500 font-bold">{v.ruleFormula}</span>
                    <span className="font-bold">
                      {effectiveDefectId === 'sound'
                        ? '0.0 mm (Sound Weld)'
                        : v.governingParameter === 'zero_tolerance'
                        ? isAr
                          ? `${v.measuredPrimaryMm} مم > 0.0 مم (صفر سماحية)`
                          : `${v.measuredPrimaryMm} mm > 0.0 mm (Zero Tolerance)`
                        : v.governingParameter === 'exempt_in_spot'
                        ? isAr
                          ? 'معفى في Spot RT'
                          : 'Spot RT Exempt'
                        : `${v.measuredPrimaryMm} / ${v.maxAllowedMm} mm (${v.utilizationPct}%)`}
                    </span>
                  </div>

                  {/* Utilization Threshold Bar */}
                  <div
                    className={`h-1.5 w-full rounded-sm overflow-hidden ${
                      isLight ? 'bg-slate-200' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`h-full transition-all duration-200 ${
                        isAccept ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${effectiveDefectId === 'sound' ? 0 : barPct}%` }}
                    />
                  </div>

                  {/* Engineering Rationale */}
                  <p className={`text-xs leading-relaxed ${mutedText}`}>{v.rationale[language]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
