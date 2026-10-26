import React, { useState, useEffect } from 'react';
import { Language } from '../../../types';
import {
  ALL_WELD_DEFECTS_CATALOG,
  ExtendedWeldFlawId,
} from '../../../data/utWeldDefectsCatalog';
import {
  WorkshopTrainingAttempt,
  getWorkshopTrainingAttempts,
  gradeAndRecordWorkshopAttempt,
  resetWorkshopTrainingAttempts,
  subscribeWorkshopTrainingUpdates,
} from '../../../utils/workshopTrainingResultsStore';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface WorkshopTrainingResultsPanelProps {
  language: Language;
  completedMissionCount?: number;
  totalMissionCount?: number;
}

const BLIND_DRILL_SPECIMENS: Array<{
  id: string;
  label: { ar: string; en: string };
  defectId: ExtendedWeldFlawId;
  specimen: 'flat' | 'curved';
  actualDepthMm: number;
  actualLengthMm: number;
  echoPct: number;
  clueAr: string;
  clueEn: string;
  actualVerdict: 'ACCEPT' | 'REJECT';
}> = [
  {
    id: 'blind-01',
    label: { ar: 'العينة المجهولة #1 (لوح فلات 25 مم - زاوية 60°)', en: 'Blind Specimen #1 (25mm Flat Plate - 60° Probe)' },
    defectId: 'lack_of_fusion',
    specimen: 'flat',
    actualDepthMm: 14.0,
    actualLengthMm: 18.0,
    echoPct: 90,
    clueAr: 'صدى حاد نظيف جداً (90% FSH) عند S=28.0mm على شطف 30°، يمتد لمسافة 18 مم بطول اللحام (-6dB) ويختفي بسرعة عند تغيير الزاوية.',
    clueEn: 'Mirror-clean sharp spike (90% FSH) at S=28.0mm along the 30° bevel face, spanning 18mm along Y (-6dB), dropping sharply off-angle.',
    actualVerdict: 'REJECT',
  },
  {
    id: 'blind-02',
    label: { ar: 'العينة المجهولة #2 (أنبوب كيرف OD 219 مم - سماكة 20 مم)', en: 'Blind Specimen #2 (Curved Pipe OD 219mm - t=20mm)' },
    defectId: 'isolated_pore',
    specimen: 'curved',
    actualDepthMm: 10.0,
    actualLengthMm: 2.8,
    echoPct: 44,
    clueAr: 'نبضة منخفضة السعة (44% FSH، أقل من 60% DAC) عند منتصف السماكة D=10mm، ثابتة عند الدوران المداري وطولها المقاس 2.8 مم فقط.',
    clueEn: 'Low omnidirectional echo (44% FSH, <60% DAC) at mid-wall D=10mm, invariant under orbital swivel, -6dB length = 2.8mm.',
    actualVerdict: 'ACCEPT',
  },
  {
    id: 'blind-03',
    label: { ar: 'العينة المجهولة #3 (جذر لحام وعاء ضغط ASME UW-51)', en: 'Blind Specimen #3 (ASME Pressure Vessel Root)' },
    defectId: 'root_crack',
    specimen: 'flat',
    actualDepthMm: 24.0,
    actualLengthMm: 14.0,
    echoPct: 94,
    clueAr: 'قمة حادة جداً عند عمق الجذر (D=24mm, X=0.5mm) تسبقها إشارة حيود علوية ضعيفة (Tip Diffraction) بفارق ارتفاع Δh=3.5mm.',
    clueEn: 'High-amplitude root corner spike (D=24mm) preceded by weak upper tip-diffraction wavelet indicating Δh = 3.5mm.',
    actualVerdict: 'REJECT',
  },
];

export const WorkshopTrainingResultsPanel: React.FC<WorkshopTrainingResultsPanelProps> = ({
  language,
  completedMissionCount = 0,
  totalMissionCount = 5,
}) => {
  const isAr = language === 'ar';
  const [attempts, setAttempts] = useState<WorkshopTrainingAttempt[]>(() => getWorkshopTrainingAttempts());

  // Blind Drill Interactive State
  const [selectedBlindIdx, setSelectedBlindIdx] = useState<number>(0);
  const [guessedDefectId, setGuessedDefectId] = useState<ExtendedWeldFlawId>('lack_of_fusion');
  const [guessedDepthMm, setGuessedDepthMm] = useState<number>(14.0);
  const [guessedLengthMm, setGuessedLengthMm] = useState<number>(18.0);
  const [guessedVerdict, setGuessedVerdict] = useState<'ACCEPT' | 'REJECT'>('REJECT');
  const [lastBlindResult, setLastBlindResult] = useState<WorkshopTrainingAttempt | null>(null);

  useEffect(() => {
    return subscribeWorkshopTrainingUpdates(() => {
      setAttempts(getWorkshopTrainingAttempts());
    });
  }, []);

  const currentBlind = BLIND_DRILL_SPECIMENS[selectedBlindIdx] || BLIND_DRILL_SPECIMENS[0];

  // Aggregate Practical Metrics
  const totalRuns = attempts.length;
  const avgScore =
    totalRuns > 0 ? Math.round(attempts.reduce((acc, a) => acc + a.scorePct, 0) / totalRuns) : 0;
  const correctVerdicts = attempts.filter((a) => a.traineeVerdict === a.actualCodeVerdict).length;
  const verdictAccuracyPct = totalRuns > 0 ? Math.round((correctVerdicts / totalRuns) * 100) : 0;
  const meanDepthErrMm =
    totalRuns > 0
      ? attempts.reduce((acc, a) => acc + Math.abs(a.measuredDepthMm - a.actualDepthMm), 0) / totalRuns
      : 0;
  const meanLengthErrMm =
    totalRuns > 0
      ? attempts.reduce((acc, a) => acc + Math.abs(a.measuredLengthMm - a.actualLengthMm), 0) / totalRuns
      : 0;
  const uniqueDefectsPracticed = new Set(attempts.map((a) => a.defectId)).size;

  const qualificationBadge =
    avgScore >= 90
      ? { ar: 'جاهزية مستوى متقدم (ASNT Level II / III Ready)', en: 'ASNT Level II / III Practical Readiness', tone: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30' }
      : avgScore >= 75
      ? { ar: 'مؤهل للتدريب الميداني (Level II Trainee)', en: 'Qualified Field Trainee (Level II Track)', tone: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30' }
      : { ar: 'قيد بناء المهارة العملية (Level I Foundation)', en: 'Building Practical Skill (Level I)', tone: 'text-amber-400 border-amber-500/40 bg-amber-950/30' };

  const handleEvaluateBlindSpecimen = () => {
    const actualSpec =
      ALL_WELD_DEFECTS_CATALOG.find((d) => d.id === currentBlind.defectId) || ALL_WELD_DEFECTS_CATALOG[0];
    const result = gradeAndRecordWorkshopAttempt({
      instrument: currentBlind.specimen === 'curved' ? 'PAUT' : 'UT',
      deviceModel:
        currentBlind.specimen === 'curved'
          ? 'Olympus OmniScan X3 (Blind Practical Exam)'
          : 'Krautkrämer USM 35X (Blind Practical Exam)',
      specimenGeometry: currentBlind.specimen,
      defectId: currentBlind.defectId,
      defectNameAr: actualSpec.name.ar,
      defectNameEn: actualSpec.name.en,
      actualDepthMm: currentBlind.actualDepthMm,
      measuredDepthMm: guessedDepthMm,
      actualLengthMm: currentBlind.actualLengthMm,
      measuredLengthMm: guessedLengthMm,
      echoAmplitudePct: currentBlind.echoPct,
      codeStandard: 'ASME Sec VIII Div 1 (UW-51)',
      traineeVerdict: guessedVerdict,
      actualCodeVerdict: currentBlind.actualVerdict,
      isBlindChallenge: true,
    });
    setLastBlindResult(result);
    setAttempts(getWorkshopTrainingAttempts());
  };

  return (
    <section
      aria-label={isAr ? 'النتائج التدريبية وتقييم الكفاءة تحت ورشة العمل' : 'Workshop Training Results & Competency Dashboard'}
      className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-7 space-y-6 shadow-2xl"
    >
      {/* Top Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-emerald-400 mb-1 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr
                ? 'لوحة النتائج التدريبية وسجل الكفاءة العملية (تتحدث تلقائياً من أجهزة الورشة)'
                : 'Live Practical Workshop Training Results & ASNT/ISO 9712 Competency Log'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {isAr
              ? 'النتائج التدريبية وتقييم أداء الفاحص تحت ورشة العمل (UT & PAUT Practical Scorecard)'
              : 'Trainee Practical Inspection Results & Sizing Accuracy Scorecard'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-3.5 py-2 rounded-xl border font-mono text-xs font-bold ${qualificationBadge.tone}`}>
            ● {qualificationBadge[language]}
          </div>
          <button
            type="button"
            onClick={() => {
              resetWorkshopTrainingAttempts();
              setLastBlindResult(null);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة ضبط السجل' : 'Reset Log'}</span>
          </button>
        </div>
      </div>

      {/* 5 Core KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono tabular-nums">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">{isAr ? 'متوسط درجة الكفاءة' : 'Overall Practical Score'}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{avgScore}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {totalRuns} {isAr ? 'عملية فحص موثقة' : 'logged inspections'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">{isAr ? 'دقة قرار الكود (مقبول/مرفوض)' : 'Code Verdict Accuracy'}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">{verdictAccuracyPct}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {correctVerdicts} / {totalRuns} {isAr ? 'مطابق لـ ASME/AWS' : 'ASME/AWS compliant'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">{isAr ? 'متوسط خطأ العمق (ΔD)' : 'Mean Depth Error (ΔD)'}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">±{meanDepthErrMm.toFixed(1)}</span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{isAr ? 'التسامح القياسي ±2.0 مم' : 'Target tolerance ≤ ±2.0 mm'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">{isAr ? 'متوسط خطأ الطول (-6dB ΔL)' : 'Mean Length Error (ΔL)'}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-sky-400">±{meanLengthErrMm.toFixed(1)}</span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{isAr ? 'التسامح القياسي ±3.0 مم' : 'Target tolerance ≤ ±3.0 mm'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400">{isAr ? 'تغطية موسوعة العيوب والمهام' : 'Defect Atlas & Tasks'}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-white">{uniqueDefectsPracticed}</span>
            <span className="text-xs text-slate-400">/ {ALL_WELD_DEFECTS_CATALOG.length}</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">
            {isAr
              ? `المهام العملية: ${completedMissionCount}/${totalMissionCount}`
              : `Guided Missions: ${completedMissionCount}/${totalMissionCount}`}
          </div>
        </div>
      </div>

      {/* Competency Skill Breakdown + Interactive Blind Weld Practical Exam */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: 5-Axis Practical Skill Breakdown */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3.5">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'تحليل المهارات الخمس لمفتش الموجات فوق الصوتية:' : '5-Pillar Ultrasonic Inspector Skill Breakdown:'}</span>
          </div>

          {[
            {
              label: isAr ? '1. معايرة السرعة والصفر ومنحنى DAC/TCG' : '1. Velocity, Wedge Zero & DAC/TCG Calibration',
              pct: Math.min(100, 86 + completedMissionCount * 2),
              color: 'bg-cyan-500',
            },
            {
              label: isAr ? '2. تخيل كوم الأشعة وحسابات الارتداد والكيرف' : '2. Beam Cone Physics, Skip & Pipe Curvature Math',
              pct: Math.min(100, Math.round(100 - meanDepthErrMm * 8)),
              color: 'bg-emerald-500',
            },
            {
              label: isAr ? '3. تمييز العيوب المستوية عن الحجمية من شكل الموجة' : '3. Planar vs. Volumetric Echo Characterization',
              pct: verdictAccuracyPct,
              color: 'bg-amber-500',
            },
            {
              label: isAr ? '4. تحجيم الطول (-6 dB Drop) والارتفاع (Tip Diffraction)' : '4. -6 dB Length & PAUT Tip-Diffraction Sizing',
              pct: Math.min(100, Math.max(45, Math.round(100 - meanLengthErrMm * 7))),
              color: 'bg-sky-500',
            },
            {
              label: isAr ? '5. تطبيق أكواد القبول والرفض (ASME / AWS / API)' : '5. Multi-Code Disposition (ASME / AWS / API)',
              pct: avgScore,
              color: 'bg-purple-500',
            },
          ].map((skill, idx) => (
            <div key={idx} className="space-y-1 font-mono text-xs tabular-nums">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">{skill.label}</span>
                <span className="text-white font-bold">{skill.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div className={`h-full ${skill.color}`} style={{ width: `${skill.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Right 7 Cols: Interactive Blind Practical Specimen Test */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr
                  ? 'اختبار العينة العمياء السريع (قيّم القراءات وسجّل نتيجتك في السجل التدريبي):'
                  : 'Quick Blind Specimen Practical Drill (Evaluate & Record Score):'}
              </span>
            </div>
            <div className="flex gap-1 font-mono text-[10px]">
              {BLIND_DRILL_SPECIMENS.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBlindIdx(i);
                    setLastBlindResult(null);
                  }}
                  className={`px-2.5 py-1 rounded border cursor-pointer ${
                    selectedBlindIdx === i
                      ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  #{i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="font-bold text-amber-400">{currentBlind.label[language]}</div>
            <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
              {isAr ? currentBlind.clueAr : currentBlind.clueEn}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            <label className="space-y-1 block">
              <span className="text-[10px] text-slate-400">{isAr ? 'تشخيص نوع العيب:' : 'Diagnosed Defect:'}</span>
              <select
                value={guessedDefectId}
                onChange={(e) => setGuessedDefectId(e.target.value as ExtendedWeldFlawId)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-white text-[11px]"
              >
                {ALL_WELD_DEFECTS_CATALOG.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.codeSymbol} - {isAr ? d.name.ar : d.name.en}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-[10px] text-slate-400">{isAr ? 'العمق المقاس D (mm):' : 'Measured Depth D (mm):'}</span>
              <input
                type="number"
                step="0.5"
                value={guessedDepthMm}
                onChange={(e) => setGuessedDepthMm(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white tabular-nums"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-[10px] text-slate-400">{isAr ? 'الطول المقاس L (mm):' : 'Measured Length L (mm):'}</span>
              <input
                type="number"
                step="0.5"
                value={guessedLengthMm}
                onChange={(e) => setGuessedLengthMm(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white tabular-nums"
              />
            </label>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'قرار الكود ASME:' : 'ASME Verdict:'}</span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setGuessedVerdict('ACCEPT')}
                  className={`py-1.5 rounded-lg border font-bold text-[11px] cursor-pointer ${
                    guessedVerdict === 'ACCEPT'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ACCEPT
                </button>
                <button
                  type="button"
                  onClick={() => setGuessedVerdict('REJECT')}
                  className={`py-1.5 rounded-lg border font-bold text-[11px] cursor-pointer ${
                    guessedVerdict === 'REJECT'
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  REJECT
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleEvaluateBlindSpecimen}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'تصحيح العينة وتسجيل النتيجة التدريبية' : 'Grade Blind Specimen & Log Result'}</span>
            </button>

            {lastBlindResult && (
              <div
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold tabular-nums ${
                  lastBlindResult.scorePct >= 80
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                }`}
              >
                {isAr
                  ? `الدرجة: ${lastBlindResult.scorePct}% — ${lastBlindResult.feedbackAr}`
                  : `Score: ${lastBlindResult.scorePct}% — ${lastBlindResult.feedbackEn}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Practical Inspection Log Table */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'سجل نتائج الفحوصات العملية التفصيلي بالورشة:' : 'Detailed Practical Workshop Inspection Log:'}</span>
          </span>
          <span className="text-slate-500 tabular-nums">
            {isAr ? 'يعرض آخر الفحوصات المسجلة من أجهزة UT و PAUT' : 'Showing latest graded UT & PAUT runs'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-start border-collapse font-mono text-xs tabular-nums">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                <th className="p-3 text-start">{isAr ? 'الجهاز والعينة' : 'Device & Specimen'}</th>
                <th className="p-3 text-start">{isAr ? 'العيب المفحوص' : 'Inspected Defect'}</th>
                <th className="p-3 text-start">{isAr ? 'العمق (فعلي / مقاس)' : 'Depth (Act / Meas)'}</th>
                <th className="p-3 text-start">{isAr ? 'الطول (فعلي / مقاس)' : 'Length (Act / Meas)'}</th>
                <th className="p-3 text-start">{isAr ? 'حكم المتدرب / الكود' : 'Verdict (You / Code)'}</th>
                <th className="p-3 text-start">{isAr ? 'الدرجة والتقييم الفني' : 'Score & Technical Feedback'}</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((att) => {
                const isVerdictMatch = att.traineeVerdict === att.actualCodeVerdict;
                return (
                  <tr key={att.id} className="border-b border-slate-800/70 hover:bg-slate-900/60">
                    <td className="p-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            att.instrument === 'PAUT'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {att.instrument}
                        </span>
                        <span className="truncate max-w-[160px]">{att.deviceModel}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {att.specimenGeometry === 'curved'
                          ? isAr
                            ? 'أنبوب منحني (Curved Pipe)'
                            : 'Curved Pipe'
                          : isAr
                          ? 'لوح فلات (Flat Plate)'
                          : 'Flat Plate'}
                        {att.isBlindChallenge ? (isAr ? ' · اختبار أعمى' : ' · Blind Drill') : ''}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-200">{isAr ? att.defectNameAr : att.defectNameEn}</div>
                      <div className="text-[10px] text-slate-500">{att.codeStandard}</div>
                    </td>

                    <td className="p-3 text-slate-300">
                      {att.actualDepthMm.toFixed(1)} / <strong className="text-cyan-400">{att.measuredDepthMm.toFixed(1)} mm</strong>
                    </td>

                    <td className="p-3 text-slate-300">
                      {att.actualLengthMm.toFixed(1)} / <strong className="text-amber-400">{att.measuredLengthMm.toFixed(1)} mm</strong>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {isVerdictMatch ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className={isVerdictMatch ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {att.traineeVerdict} / {att.actualCodeVerdict}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[11px] ${
                            att.scorePct >= 90
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : att.scorePct >= 75
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {att.scorePct}%
                        </span>
                        <span className="text-[11px] text-slate-400 font-sans leading-snug">
                          {isAr ? att.feedbackAr : att.feedbackEn}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
