import React, { useState, useMemo } from 'react';
import {
  Radio,
  RotateCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Award,
  Layers,
  Compass,
  Eye,
  Clock,
} from 'lucide-react';
import { GeRadiographicExposureTimeApp } from './GeRadiographicExposureTimeApp';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import {
  RtExposureTechniqueMode,
  StraightSubMode,
  RtTechSourceId,
  RT_TECH_SOURCES,
  RT_PIPE_PRESETS,
  computePanoramicSimulation,
  computeEllipticalSimulation,
  computeStraightSimulation,
} from '../../../data/rtTechniquesPhysics';

export interface RtShootingTechniquesSimulatorProps {
  language: Language;
  onOpenFullRtLab?: () => void;
}

interface MasteryQuestion {
  id: string;
  question: { ar: string; en: string };
  options: { ar: string; en: string }[];
  correctIndex: number;
  explanation: { ar: string; en: string };
}

const MASTERY_QUESTIONS: readonly MasteryQuestion[] = [
  {
    id: 'mq_1',
    question: {
      ar: 'ماسورة قطرها الخارجي 2 بوصة (60.3 مم) وسماكة عادية 5.5 مم ومتاح إزاحة المصدر محورياً؛ ما هو التكنيك القياسي وأقل عدد لقطات لتغطية 100% من اللحام؟',
      en: 'For a 2" pipe (OD 60.3 mm, wall 5.5 mm) with clear axial access, what is the standard ASME technique and minimum exposures for 100% weld coverage?',
    },
    options: [
      {
        ar: 'الإليبس تكنيك (DWDI Elliptical) — لقطتان بزاوية دوران 90° (0° و 90°)',
        en: 'Elliptical Technique (DWDI Offset) — 2 exposures rotated 90° apart (0° & 90°)',
      },
      {
        ar: 'البانوراما تكنيك (Panoramic) — لقطة داخلية واحدة بالـ Ir-192',
        en: 'Panoramic Technique — 1 internal shot with Ir-192',
      },
      {
        ar: 'الستريت الملامس (DWSI Contact) — 6 لقطات كل 60°',
        en: 'Straight Contact (DWSI) — 6 exposures at 60°',
      },
    ],
    correctIndex: 0,
    explanation: {
      ar: 'طبقاً لـ ASME Sec V T-271.2(b)(1)، المواسير ≤ 3.5 بوصة (88.9 مم) تُصوّر بتكنيك الإليبس (إزاحة محورية لفتح الجدارين) بلقطتين متعامدتين (0° و 90°).',
      en: 'Per ASME Sec V T-271.2(b)(1), pipes OD ≤ 3.5" (88.9 mm) use DWDI Elliptical offset requiring 2 exposures 90° apart.',
    },
  },
  {
    id: 'mq_2',
    question: {
      ar: 'نفس الماسورة 2 بوصة لكن بسماكة ثقيلة جداً (XXS = 11.1 مم) أو بجوار كوع يمنع إزاحة المصدر مما أغلق فتحة الإليبس؛ ماذا يفرض الكود ASME؟',
      en: 'If that 2" pipe has a heavy XXS wall (11.1 mm) or an elbow blocks axial offset so the ellipse closes, what does ASME Section V mandate?',
    },
    options: [
      {
        ar: 'تكرار لقطة واحدة بزيادة وقت التعريض للضعف',
        en: 'Shoot 1 single exposure with double exposure time',
      },
      {
        ar: 'التحول إلى الستريت تكنيك المتطابق (DWDI 0° بدون إزاحة) وتصوير 3 لقطات بزاوية دوران 60° (أو 120°)',
        en: 'Switch to Straight Superimposed (DWDI 0° offset) with 3 exposures rotated 60° (or 120°) apart',
      },
      {
        ar: 'إلغاء الفحص الإشعاعي واستخدام الفحص البصري فقط',
        en: 'Cancel RT and rely on visual inspection only',
      },
    ],
    correctIndex: 1,
    explanation: {
      ar: 'ينص ASME T-271.2(b)(2) على أنه عند تطابق الجدار العلوي والسفلي (0° Straight Superimposed) على مواسير ≤ 3.5 بوصة يجب أخذ 3 لقطات على الأقل بزاوية 60° (أو 120°).',
      en: 'ASME T-271.2(b)(2) mandates at least 3 exposures at 60° (or 120°) when upper and lower weld walls are superimposed (0° Straight).',
    },
  },
  {
    id: 'mq_3',
    question: {
      ar: 'في البانوراما تكنيك لخط أنابيب 24 بوصة، انزلق عنكبوت التمركز (Spider) واقترب المصدر من جدار الساعة 12؛ ما النتيجة على حزام الأفلام؟',
      en: 'In Panoramic RT of a 24" pipeline, the internal spider slips closer to the 12 o’clock wall. What happens on the 360° film belt?',
    },
    options: [
      {
        ar: 'تتساوى الكثافة على جميع الأفلام ولا يتأثر الفحص',
        en: 'Film density stays identical around the entire circumference',
      },
      {
        ar: 'زيادة اسوداد الفيلم (Overexposure) وارتفاع Ug عند الساعة 12، مقابل ضعف الكثافة (Underexposure) عند الساعة 6',
        en: 'High density burn-out + elevated Ug at 12 o’clock, and low underexposed density at 6 o’clock',
      },
      {
        ar: 'يتحول شكل اللحام على الفيلم إلى شكل قطع ناقص (إليبس)',
        en: 'The weld image turns into an open ellipse',
      },
    ],
    correctIndex: 1,
    explanation: {
      ar: 'بسبب قانون التربيع العكسي ومعادلة Ug، اقتراب المصدر من الساعة 12 يرفع الشدة الإشعاعية والضبابية الهندسية هناك، بينما يضعف الإشعاع الواصل للساعة 6.',
      en: 'By the Inverse Square Law and Ug geometry, moving closer to 12 o’clock spikes density and Ug there while starving 6 o’clock of exposure.',
    },
  },
];

export const RtShootingTechniquesSimulator: React.FC<RtShootingTechniquesSimulatorProps> = ({
  language,
  onOpenFullRtLab,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  // Primary Technique Mode
  const [activeMode, setActiveMode] = useState<RtExposureTechniqueMode>('panoramic');
  const [straightSubMode, setStraightSubMode] = useState<StraightSubMode>('dwdi_superimposed');
  const [sourceId, setSourceId] = useState<RtTechSourceId>('ir192');
  const [showGeExposureModal, setShowGeExposureModal] = useState<boolean>(false);

  // Panoramic Parameters
  const [panoOdMm, setPanoOdMm] = useState<number>(406.4); // 16" pipe
  const [panoWallMm, setPanoWallMm] = useState<number>(9.5);
  const [panoFilmLengthMm, setPanoFilmLengthMm] = useState<300 | 400>(400);
  const [panoOverlapMm, setPanoOverlapMm] = useState<number>(30);
  const [panoEccentricityMm, setPanoEccentricityMm] = useState<number>(0);

  // Elliptical Parameters
  const [ellipOdMm, setEllipOdMm] = useState<number>(60.3); // 2" pipe
  const [ellipWallMm, setEllipWallMm] = useState<number>(5.5);
  const [ellipWeldCapMm, setEllipWeldCapMm] = useState<number>(9);
  const [ellipSfdMm, setEllipSfdMm] = useState<number>(450);
  const [ellipOffsetMm, setEllipOffsetMm] = useState<number>(105);
  const [ellipShotIdx, setEllipShotIdx] = useState<0 | 1>(0);

  // Straight Parameters
  const [straightOdMm, setStraightOdMm] = useState<number>(60.3);
  const [straightWallMm, setStraightWallMm] = useState<number>(11.1);
  const [straightPlateLenMm, setStraightPlateLenMm] = useState<number>(1100);
  const [straightFilmLengthMm, setStraightFilmLengthMm] = useState<300 | 400>(400);
  const [straightSfdMm, setStraightSfdMm] = useState<number>(500);
  const [straightShotIdx, setStraightShotIdx] = useState<number>(0);

  // Mastery Check & XP Logging State
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loggedRecordInfo, setLoggedRecordInfo] = useState<{
    xpEarned: number;
    scorePct: number;
  } | null>(null);

  // Physics Computations
  const panoResult = useMemo(
    () =>
      computePanoramicSimulation({
        odMm: panoOdMm,
        wallMm: panoWallMm,
        sourceId,
        filmLengthMm: panoFilmLengthMm,
        overlapMm: panoOverlapMm,
        eccentricityMm: panoEccentricityMm,
      }),
    [panoOdMm, panoWallMm, sourceId, panoFilmLengthMm, panoOverlapMm, panoEccentricityMm]
  );

  const ellipResult = useMemo(
    () =>
      computeEllipticalSimulation({
        odMm: ellipOdMm,
        wallMm: ellipWallMm,
        weldCapWidthMm: ellipWeldCapMm,
        sfdMm: ellipSfdMm,
        axialOffsetMm: ellipOffsetMm,
        sourceId,
        activeShotIndex: ellipShotIdx,
      }),
    [ellipOdMm, ellipWallMm, ellipWeldCapMm, ellipSfdMm, ellipOffsetMm, sourceId, ellipShotIdx]
  );

  const straightResult = useMemo(
    () =>
      computeStraightSimulation({
        subMode: straightSubMode,
        odMm: straightOdMm,
        wallMm: straightWallMm,
        plateWeldLengthMm: straightPlateLenMm,
        filmLengthMm: straightFilmLengthMm,
        sfdMm: straightSfdMm,
        sourceId,
        activeShotIndex: straightShotIdx,
      }),
    [
      straightSubMode,
      straightOdMm,
      straightWallMm,
      straightPlateLenMm,
      straightFilmLengthMm,
      straightSfdMm,
      sourceId,
      straightShotIdx,
    ]
  );

  const applyPipePreset = (presetId: string) => {
    const preset = RT_PIPE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.recommendedMode === 'panoramic') {
      setActiveMode('panoramic');
      setPanoOdMm(preset.odMm);
      setPanoWallMm(preset.wallMm);
      setPanoEccentricityMm(0);
      setPanoOverlapMm(30);
      setSourceId(preset.odMm >= 500 ? 'xray_crawler' : 'ir192');
    } else if (preset.recommendedMode === 'elliptical') {
      setActiveMode('elliptical');
      setEllipOdMm(preset.odMm);
      setEllipWallMm(preset.wallMm);
      setEllipWeldCapMm(preset.weldCapWidthMm);
      const targetSfd = 480;
      setEllipSfdMm(targetSfd);
      setSourceId('se75');
      const sod = targetSfd - (preset.odMm - preset.wallMm / 2);
      const optOffset = Math.round(((preset.weldCapWidthMm + 9) * sod) / (preset.odMm - preset.wallMm));
      setEllipOffsetMm(optOffset);
      setEllipShotIdx(0);
    } else {
      setActiveMode('straight');
      setStraightOdMm(preset.odMm);
      setStraightWallMm(preset.wallMm);
      setStraightShotIdx(0);
      if (preset.odMm <= 88.95) {
        setStraightSubMode('dwdi_superimposed');
        setStraightSfdMm(500);
        setSourceId('se75');
      } else {
        setStraightSubMode('dwsi_contact');
        setStraightSfdMm(Math.round(preset.odMm + 20));
        setSourceId('ir192');
      }
    }
  };

  const handleLogMasteryAttempt = () => {
    const answeredCount = Object.keys(answers).length;
    const correctCount = MASTERY_QUESTIONS.reduce(
      (acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0),
      0
    );

    const activeCodePass =
      activeMode === 'panoramic'
        ? panoResult.passesAsmeCode
        : activeMode === 'elliptical'
        ? ellipResult.passesAsmeCode
        : straightResult.passesAsmeCode;

    const quizPct = answeredCount > 0 ? Math.round((correctCount / MASTERY_QUESTIONS.length) * 70) : 50;
    const setupPct = activeCodePass ? 30 : 15;
    const scorePct = Math.min(100, quizPct + setupPct);

    const record = recordSimulationAttempt({
      simulatorId: `rt_techniques_${activeMode}`,
      targetSubTab: 'rt_techniques',
      simulatorTitle: {
        ar: 'محاكي تكنيكات التصوير الإشعاعي (البانوراما · الإليبس · الستريت)',
        en: 'RT Exposure Techniques Simulator (Panoramic · Elliptical · Straight)',
      },
      ndtMethod: 'RT',
      defectTypes: [
        {
          id: 'rt_exposure_geometry',
          ar: 'هندسة التعريض الإشعاعي وفصل الجدران',
          en: 'RT Exposure Geometry & Wall Separation',
        },
      ],
      status: scorePct >= 70 ? 'PASS' : 'FAIL',
      codeVerdict: 'ACCEPT',
      traineeVerdict: activeCodePass ? 'ACCEPT' : 'REJECT',
      codeStandard: 'ASME Sec V Art. 2 T-271',
      scorePct,
      notes: {
        ar: `إتقان محاكاة البانوراما والإليبس والستريت بنسبة ${scorePct}% (${correctCount}/${MASTERY_QUESTIONS.length} أسئلة صحيحة)`,
        en: `Completed Panoramic, Elliptical & Straight RT simulation (${scorePct}%, ${correctCount}/${MASTERY_QUESTIONS.length} checks)`,
      },
    });

    setLoggedRecordInfo({
      xpEarned: record.xpEarned,
      scorePct,
    });
  };

  const shellClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const panelClass = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-950/90 border-slate-800 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const currentSource = RT_TECH_SOURCES.find((s) => s.id === sourceId) ?? RT_TECH_SOURCES[0];

  // Helper for converting optical density H&D (0.8 .. 4.8) into SVG grayscale fill
  const densityToGrayHex = (hd: number): string => {
    const clamped = Math.max(0.8, Math.min(4.8, hd));
    // Higher density = darker film (lower luminance)
    const lum = Math.round(185 - ((clamped - 0.8) / 4.0) * 165);
    const hex = Math.max(14, Math.min(200, lum)).toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary 3-Technique Switcher */}
      <div className={`rounded-2xl border p-5 sm:p-7 ${shellClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-slate-700/25">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-500 mb-1.5">
              <Radio className="w-4 h-4 shrink-0" />
              <span>ASME Sec V Art. 2 (T-271.1 &amp; T-271.2)</span>
              <span aria-hidden="true">·</span>
              <span>ISO 17636-1</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr
                ? 'المحاكاة التفصيلية لتكنيكات التصوير الإشعاعي: البانوراما والإليبس والستريت'
                : 'Detailed RT Exposure Techniques Simulator: Panoramic, Elliptical & Straight'}
            </h2>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${mutedText}`}>
              {isAr
                ? 'اختبر هندسة الأشعة وتوزيع الأفلام وحسابات عدم الوضوح الهندسي Ug لحظياً للتكنيكات الثلاثة الأساسية في مواقع البترول والغاز ومحطات الطاقة، مع معاينة حية لشكل اللحام والعيوب على الفيلم الناتج.'
                : 'Simulate live ray-tracing geometry, film belt layout, axial offset angle, multi-shot pipe rotation, and resulting radiographic film projections across Panoramic, Elliptical, and Straight RT techniques.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="rt-tech-open-ge-exposure-btn"
              onClick={() => setShowGeExposureModal(true)}
              className="px-4 py-2.5 rounded-xl border border-amber-500 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-sm"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'حساب الوقت بـ GE App' : 'Calculate Exposure with GE App'}</span>
            </button>

            {onOpenFullRtLab && (
              <button
                type="button"
                onClick={onOpenFullRtLab}
                className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'الانتقال لمعمل التحميض وقراءة الأفلام الكامل'
                    : 'Open Full Darkroom & Film Reading Lab'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Core Technique Selector Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <button
            type="button"
            onClick={() => setActiveMode('panoramic')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              activeMode === 'panoramic'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : isLight
                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600'
            }`}
          >
            <div
              className={`text-xs font-mono font-bold tabular-nums ${
                activeMode === 'panoramic' ? 'text-slate-900' : 'text-amber-500'
              }`}
            >
              01 · SWSI 360° PANORAMIC
            </div>
            <div className="text-sm sm:text-base font-black mt-1">
              {isAr ? 'البانوراما تكنيك (Panoramic)' : 'Panoramic Technique (360°)'}
            </div>
            <div
              className={`text-xs mt-1 ${
                activeMode === 'panoramic' ? 'text-slate-800' : mutedText
              }`}
            >
              {isAr
                ? 'مصدر مركزي داخلي · حزام أفلام محيطي 360° · لقطة واحدة شاملة'
                : 'Internal central source · 360° external film belt · 1 single shot'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('elliptical')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              activeMode === 'elliptical'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                : isLight
                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-cyan-400'
                : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600'
            }`}
          >
            <div
              className={`text-xs font-mono font-bold tabular-nums ${
                activeMode === 'elliptical' ? 'text-slate-900' : 'text-cyan-500'
              }`}
            >
              02 · DWDI ELLIPTICAL (OD ≤ 3.5&quot;)
            </div>
            <div className="text-sm sm:text-base font-black mt-1">
              {isAr ? 'الإليبس تكنيك (Elliptical)' : 'Elliptical Technique (Offset)'}
            </div>
            <div
              className={`text-xs mt-1 ${
                activeMode === 'elliptical' ? 'text-slate-900' : mutedText
              }`}
            >
              {isAr
                ? 'إزاحة محورية لفصل الجدارين في قطع ناقص · لقطتان (0° و 90°)'
                : 'Axial source offset opens upper/lower walls · 2 shots (0° & 90°)'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('straight')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              activeMode === 'straight'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : isLight
                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600'
            }`}
          >
            <div
              className={`text-xs font-mono font-bold tabular-nums ${
                activeMode === 'straight' ? 'text-slate-900' : 'text-emerald-500'
              }`}
            >
              03 · 0° PERPENDICULAR STRAIGHT
            </div>
            <div className="text-sm sm:text-base font-black mt-1">
              {isAr ? 'الستريت تكنيك (Straight 0°)' : 'Straight Technique (0° Normal)'}
            </div>
            <div
              className={`text-xs mt-1 ${
                activeMode === 'straight' ? 'text-slate-900' : mutedText
              }`}
            >
              {isAr
                ? 'شعاع عمودي بدون إزاحة · متطابق (3×60°) أو ملامس DWSI أو ألواح'
                : 'Zero-offset 0° beam · Superimposed (3×60°), Contact DWSI, or Plate'}
            </div>
          </button>
        </div>

        {/* Field Pipe Presets Bar */}
        <div className="mt-4 pt-4 border-t border-slate-700/20 flex flex-wrap items-center gap-2">
          <span className={`text-xs font-bold ${mutedText}`}>
            {isAr ? 'عينات مواسير قياسية سريعة:' : 'Quick Field Pipe Presets:'}
          </span>
          {RT_PIPE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPipePreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:border-amber-500 hover:text-slate-950'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-400 hover:text-white'
              }`}
            >
              {preset.npsLabel} · {preset.odMm}×{preset.wallMm}mm
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Zone Engineering Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / TOP ZONE (7 Cols): Dual Engineering Ray-Tracing Diagrams + Live Radiographic Film */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dual Engineering Cross-Sections */}
          <div className={`rounded-2xl border p-5 ${shellClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  {activeMode === 'panoramic'
                    ? isAr
                      ? 'المخطط الهندسي للبانوراما تكنيك (تتبّع الأشعة 360° وحزام الأفلام)'
                      : 'Panoramic 360° Ray-Tracing & Circumferential Film Belt'
                    : activeMode === 'elliptical'
                    ? isAr
                      ? 'المخطط الهندسي للإليبس تكنيك (الإزاحة المحورية وفصل الجدارين)'
                      : 'Elliptical Offset Ray-Tracing & 90° Two-Shot Pipe Rotation'
                    : isAr
                    ? 'المخطط الهندسي للستريت تكنيك (شعاع عمودي 0° وتقسيم القطاعات)'
                    : 'Straight 0° Perpendicular Ray-Tracing & Multi-Shot Coverage'}
                </h3>
                <p className={`text-xs ${mutedText}`}>
                  {isAr
                    ? 'يميناً: المقطع الطولي المحوري · يساراً: المقطع الدائري 360° وتوزيع اللقطات'
                    : 'Left: Axial Side Ray-Tracing · Right: 360° Pipe Cross-Section & Coverage'}
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-amber-500">
                {currentSource.code}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SVG 1: Axial Longitudinal Cross-Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>
                    {isAr ? '1. المقطع الطولي المحوري (Side View)' : '1. Axial Side View'}
                  </span>
                  <span className="font-mono text-[11px] text-amber-400 tabular-nums">
                    {activeMode === 'panoramic'
                      ? `SFD = ${panoResult.nominalSfdMm} mm`
                      : activeMode === 'elliptical'
                      ? `θ = ${ellipResult.beamTiltDeg}°`
                      : 'Offset = 0 mm (0°)'}
                  </span>
                </div>

                {activeMode === 'panoramic' && (() => {
                  const eccShiftPx = Math.round(
                    (panoEccentricityMm / Math.max(40, panoResult.nominalSfdMm)) * 46
                  );
                  const srcY = 115 - eccShiftPx;
                  return (
                    <svg
                      viewBox="0 0 360 230"
                      className="w-full h-auto rounded-lg bg-slate-900"
                      role="img"
                      aria-label="Panoramic axial cross section"
                    >
                      {/* Radiation isotropic fan to top and bottom walls */}
                      <polygon
                        points={`180,${srcY} 115,42 245,42`}
                        fill="rgba(245, 158, 11, 0.18)"
                      />
                      <polygon
                        points={`180,${srcY} 115,188 245,188`}
                        fill="rgba(245, 158, 11, 0.14)"
                      />

                      {/* Upper Pipe Wall + Weld Crown */}
                      <rect x="45" y="46" width="270" height="16" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                      <polygon points="168,43 192,43 187,64 173,64" fill="#cbd5e1" />

                      {/* Lower Pipe Wall + Weld Crown */}
                      <rect x="45" y="168" width="270" height="16" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                      <polygon points="173,166 187,166 192,187 168,187" fill="#cbd5e1" />

                      {/* External Film Belt Top & Bottom */}
                      <rect x="115" y="36" width="130" height="5" rx="2" fill="#06b6d4" />
                      <rect x="115" y="189" width="130" height="5" rx="2" fill="#06b6d4" />

                      {/* Pipe Centerline */}
                      <line
                        x1="35"
                        y1="115"
                        x2="325"
                        y2="115"
                        stroke="#64748b"
                        strokeDasharray="5 4"
                        strokeWidth="1"
                      />

                      {/* Spider Centering Legs */}
                      <line x1="150" y1="62" x2="180" y2={srcY} stroke="#94a3b8" strokeWidth="2" />
                      <line x1="210" y1="62" x2="180" y2={srcY} stroke="#94a3b8" strokeWidth="2" />
                      <line x1="150" y1="168" x2="180" y2={srcY} stroke="#94a3b8" strokeWidth="2" />
                      <line x1="210" y1="168" x2="180" y2={srcY} stroke="#94a3b8" strokeWidth="2" />

                      {/* Guide Tube / Crawler Body */}
                      <rect x="45" y={srcY - 4} width="132" height="8" rx="3" fill="#64748b" />

                      {/* Isotope Focal Spot */}
                      <circle cx="180" cy={srcY} r="7" fill="#f59e0b" stroke="#fef3c7" strokeWidth="2" />

                      {/* Labels */}
                      <text x="180" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                        12:00 Film Belt (D={panoResult.nearWallDensityHd} H&amp;D)
                      </text>
                      <text x="180" y="214" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                        06:00 Film Belt (D={panoResult.farWallDensityHd} H&amp;D)
                      </text>
                      <text x="255" y={srcY + 4} fill="#fbbf24" fontSize="10" fontFamily="monospace">
                        {panoEccentricityMm > 0 ? `Δe=${panoEccentricityMm}mm` : 'Centered 0mm'}
                      </text>
                    </svg>
                  );
                })()}

                {activeMode === 'elliptical' && (() => {
                  const maxShiftPx = 95;
                  const srcX = Math.max(
                    65,
                    195 - Math.min(maxShiftPx, Math.round((ellipOffsetMm / 240) * maxShiftPx))
                  );
                  const srcY = 28;
                  const upperWeldX = 195;
                  const upperWeldY = 114;
                  const lowerWeldX = 195;
                  const lowerWeldY = 166;
                  const filmY = 178;
                  // Ray intersection from source through upper weld onto film plane
                  const tRay = (filmY - srcY) / Math.max(10, upperWeldY - srcY);
                  const projectedUpperX = Math.min(325, srcX + tRay * (upperWeldX - srcX));

                  return (
                    <svg
                      viewBox="0 0 360 230"
                      className="w-full h-auto rounded-lg bg-slate-900"
                      role="img"
                      aria-label="Elliptical offset axial ray tracing"
                    >
                      {/* SFD vertical reference & Axial Offset L horizontal bar */}
                      <line
                        x1={upperWeldX}
                        y1={srcY}
                        x2={upperWeldX}
                        y2={filmY}
                        stroke="#475569"
                        strokeDasharray="4 3"
                        strokeWidth="1"
                      />
                      <line
                        x1={srcX}
                        y1={srcY}
                        x2={upperWeldX}
                        y2={srcY}
                        stroke="#22d3ee"
                        strokeWidth="2"
                      />
                      <text
                        x={(srcX + upperWeldX) / 2}
                        y="18"
                        textAnchor="middle"
                        fill="#22d3ee"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        L={ellipOffsetMm}mm
                      </text>

                      {/* Radiation cone */}
                      <polygon
                        points={`${srcX},${srcY} 145,${filmY} ${Math.max(245, projectedUpperX + 18)},${filmY}`}
                        fill="rgba(34, 211, 238, 0.14)"
                      />

                      {/* Small-bore pipe walls */}
                      <rect x="45" y="108" width="275" height="12" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                      <rect x="45" y="160" width="275" height="12" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

                      {/* Upper & Lower Weld Crowns */}
                      <polygon points="187,105 203,105 200,122 190,122" fill="#f8fafc" />
                      <polygon points="190,158 200,158 203,175 187,175" fill="#f8fafc" />

                      {/* Ray 1: Through Upper Weld to Film */}
                      <line
                        x1={srcX}
                        y1={srcY}
                        x2={projectedUpperX}
                        y2={filmY}
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                        strokeDasharray="4 2"
                      />
                      {/* Ray 2: Through Lower Weld to Film */}
                      <line
                        x1={srcX}
                        y1={srcY}
                        x2={lowerWeldX + ((filmY - srcY) / (lowerWeldY - srcY) - 1) * (lowerWeldX - srcX)}
                        y2={filmY}
                        stroke="#34d399"
                        strokeWidth="1.8"
                      />

                      {/* Film Cassette at Bottom */}
                      <rect x="115" y={filmY} width="215" height="6" rx="2" fill="#06b6d4" />

                      {/* Projected Crown Markers on Film */}
                      <circle cx={projectedUpperX} cy={filmY + 3} r="4" fill="#f59e0b" />
                      <circle cx={lowerWeldX + 4} cy={filmY + 3} r="4" fill="#34d399" />

                      {/* Source Focal Spot */}
                      <circle cx={srcX} cy={srcY} r="7" fill="#22d3ee" stroke="#ecfeff" strokeWidth="2" />

                      <text x="220" y="206" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                        Separation = {ellipResult.ellipseSeparationMm} mm (Gap {ellipResult.clearRootOpeningGapMm} mm)
                      </text>
                      <text x="54" y="98" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                        OD={ellipOdMm}mm
                      </text>
                    </svg>
                  );
                })()}

                {activeMode === 'straight' && (() => {
                  const isPlate = straightSubMode === 'swsi_plate';
                  const isContact = straightSubMode === 'dwsi_contact';
                  const srcY = isContact ? 68 : 28;
                  const filmY = 182;

                  return (
                    <svg
                      viewBox="0 0 360 230"
                      className="w-full h-auto rounded-lg bg-slate-900"
                      role="img"
                      aria-label="Straight 0 degree perpendicular ray tracing"
                    >
                      {/* Radiation cone straight 0 deg */}
                      <polygon
                        points={`180,${srcY} 105,${filmY} 255,${filmY}`}
                        fill="rgba(16, 185, 129, 0.16)"
                      />

                      {/* 0 deg normal centerline */}
                      <line
                        x1="180"
                        y1={srcY}
                        x2="180"
                        y2={filmY + 8}
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />

                      {!isPlate && (
                        <>
                          {/* Upper Pipe Wall */}
                          <rect x="45" y="76" width="270" height="14" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                          <polygon points="171,73 189,73 186,92 174,92" fill="#e2e8f0" />
                        </>
                      )}

                      {/* Lower Pipe Wall or Single Flat Plate */}
                      <rect x="45" y="162" width="270" height="16" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                      <polygon points="172,159 188,159 191,180 169,180" fill="#f8fafc" />

                      {/* Film Cassette */}
                      <rect x="95" y={filmY} width="170" height="6" rx="2" fill="#06b6d4" />

                      {/* Source */}
                      <circle cx="180" cy={srcY} r="7" fill="#10b981" stroke="#ecfdf5" strokeWidth="2" />

                      <text x="180" y="18" textAnchor="middle" fill="#34d399" fontSize="10" fontFamily="monospace">
                        0° Perpendicular Beam (Offset = 0 mm)
                      </text>
                      <text x="180" y="210" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                        {straightSubMode === 'dwdi_superimposed'
                          ? 'Upper + Lower Superimposed → 3 Shots @ 60°'
                          : straightSubMode === 'dwsi_contact'
                          ? `Film-Side Viewing Only (${straightResult.stationMarkersLabel})`
                          : `Single-Wall Flat Plate (${straightResult.stationMarkersLabel})`}
                      </text>
                    </svg>
                  );
                })()}
              </div>

              {/* SVG 2: Circumferential 360° Cross-Section & Coverage */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>
                    {isAr
                      ? '2. المقطع الدائري 360° وتغطية المحيط'
                      : '2. 360° Pipe Cross-Section'}
                  </span>
                  <span className="font-mono text-[11px] text-cyan-400 tabular-nums">
                    {activeMode === 'panoramic'
                      ? `${panoResult.requiredFilmsCount} Films · 1 Shot`
                      : activeMode === 'elliptical'
                      ? `Shot ${ellipShotIdx + 1}/2 (${ellipShotIdx === 0 ? '0°' : '90°'})`
                      : `${straightResult.exposuresRequired} Shots`}
                  </span>
                </div>

                {activeMode === 'panoramic' && (() => {
                  const cx = 180;
                  const cy = 115;
                  const outerR = 72;
                  const innerR = 58;
                  const beltR = 80;
                  const eccPx = Math.round(
                    (panoEccentricityMm / Math.max(40, panoResult.nominalSfdMm)) * 38
                  );
                  const srcY = cy - eccPx;

                  return (
                    <svg
                      viewBox="0 0 360 230"
                      className="w-full h-auto rounded-lg bg-slate-900"
                      role="img"
                      aria-label="Panoramic 360 circumferential film belt"
                    >
                      {/* Radial 360 rays */}
                      {Array.from({ length: 12 }, (_, idx) => {
                        const ang = ((idx * 30 - 90) * Math.PI) / 180;
                        const x2 = cx + beltR * Math.cos(ang);
                        const y2 = cy + beltR * Math.sin(ang);
                        return (
                          <line
                            key={idx}
                            x1={cx}
                            y1={srcY}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(245, 158, 11, 0.32)"
                            strokeWidth="1.2"
                            strokeDasharray="3 2"
                          />
                        );
                      })}

                      {/* Outer Film Belt Dashed Ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={beltR}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="4"
                        strokeDasharray="24 3"
                      />

                      {/* Pipe Steel Ring */}
                      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#64748b" strokeWidth="12" />
                      <circle cx={cx} cy={cy} r={innerR} fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />

                      {/* Film Boundary Overlap Ticks */}
                      {panoResult.filmSegments.slice(0, 12).map((seg) => {
                        const rad = ((seg.startAngleDeg - 90) * Math.PI) / 180;
                        const tx1 = cx + (beltR - 6) * Math.cos(rad);
                        const ty1 = cy + (beltR - 6) * Math.sin(rad);
                        const tx2 = cx + (beltR + 7) * Math.cos(rad);
                        const ty2 = cy + (beltR + 7) * Math.sin(rad);
                        return (
                          <line
                            key={seg.index}
                            x1={tx1}
                            y1={ty1}
                            x2={tx2}
                            y2={ty2}
                            stroke="#f59e0b"
                            strokeWidth="2.2"
                          />
                        );
                      })}

                      {/* Internal Source */}
                      <circle cx={cx} cy={srcY} r="7" fill="#f59e0b" stroke="#fef3c7" strokeWidth="2" />

                      {/* Clock Labels */}
                      <text x={cx} y="20" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                        12:00 ({panoResult.nearWallDensityHd} H&amp;D)
                      </text>
                      <text x={cx} y="218" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                        06:00 ({panoResult.farWallDensityHd} H&amp;D)
                      </text>
                      <text x="285" y={cy + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        03:00
                      </text>
                      <text x="36" y={cy + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        09:00
                      </text>
                    </svg>
                  );
                })()}

                {activeMode === 'elliptical' && (() => {
                  const cx = 180;
                  const cy = 118;
                  const pipeR = 46;
                  const isSecondShot = ellipShotIdx === 1;

                  return (
                    <svg
                      viewBox="0 0 360 230"
                      className="w-full h-auto rounded-lg bg-slate-900"
                      role="img"
                      aria-label="Elliptical 90 degree rotation cross section"
                    >
                      {/* Ghost of Inactive Shot Axis */}
                      {isSecondShot ? (
                        <line x1={cx} y1="26" x2={cx} y2="195" stroke="#334155" strokeDasharray="4 4" strokeWidth="1.5" />
                      ) : (
                        <line x1="65" y1={cy} x2="295" y2={cy} stroke="#334155" strokeDasharray="4 4" strokeWidth="1.5" />
                      )}

                      {/* Active Beam Cone */}
                      {!isSecondShot ? (
                        <>
                          <polygon points={`${cx},24 120,185 240,185`} fill="rgba(34, 211, 238, 0.16)" />
                          <circle cx={cx} cy="24" r="6.5" fill="#22d3ee" stroke="#ecfeff" strokeWidth="2" />
                          <rect x="118" y="185" width="124" height="5" rx="2" fill="#06b6d4" />
                        </>
                      ) : (
                        <>
                          <polygon points={`62,${cy} 248,60 248,176`} fill="rgba(34, 211, 238, 0.16)" />
                          <circle cx="62" cy={cy} r="6.5" fill="#22d3ee" stroke="#ecfeff" strokeWidth="2" />
                          <rect x="248" y="58" width="5" height="120" rx="2" fill="#06b6d4" />
                        </>
                      )}

                      {/* Pipe Ring */}
                      <circle cx={cx} cy={cy} r={pipeR} fill="#0f172a" stroke="#64748b" strokeWidth="10" />

                      {/* 3 Embedded Test Flaws on Pipe Wall */}
                      {/* 12:00 Root IP */}
                      <circle cx={cx} cy={cy - pipeR} r="4.5" fill="#ef4444" stroke="#fecaca" strokeWidth="1.2" />
                      {/* 03:00 Sidewall LOF */}
                      <circle cx={cx + pipeR} cy={cy} r="4.5" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.2" />
                      {/* 06:00 Tungsten */}
                      <circle cx={cx} cy={cy + pipeR} r="4.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.2" />

                      <text x={cx} y="215" textAnchor="middle" fill="#22d3ee" fontSize="10" fontFamily="monospace">
                        {isSecondShot
                          ? 'Shot 2 (90°): 03:00 LOF now centered cleanly!'
                          : 'Shot 1 (0°): 12:00 & 06:00 open; 03:00 at edge'}
                      </text>
                    </svg>
                  );
                })()}

                {activeMode === 'straight' && (() => {
                  const cx = 180;
                  const cy = 115;
                  const pipeR = 64;
                  const shots = straightResult.exposuresRequired;
                  const activeIdx = ((straightShotIdx % shots) + shots) % shots;

                  if (straightSubMode === 'swsi_plate') {
                    return (
                      <svg
                        viewBox="0 0 360 230"
                        className="w-full h-auto rounded-lg bg-slate-900"
                        role="img"
                        aria-label="Straight plate sequential film layout"
                      >
                        <rect x="30" y="92" width="300" height="36" rx="4" fill="#334155" stroke="#64748b" />
                        <line x1="30" y1="110" x2="330" y2="110" stroke="#cbd5e1" strokeWidth="4" />
                        {Array.from({ length: Math.min(5, shots) }, (_, idx) => {
                          const w = 260 / Math.min(5, shots);
                          const x = 42 + idx * (w - 6);
                          const isCurrent = idx === activeIdx % Math.min(5, shots);
                          return (
                            <rect
                              key={idx}
                              x={x}
                              y={isCurrent ? 82 : 132}
                              width={w + 8}
                              height="14"
                              rx="2"
                              fill={isCurrent ? '#10b981' : '#0891b2'}
                              opacity={isCurrent ? 0.95 : 0.45}
                              stroke="#f8fafc"
                              strokeWidth="1"
                            />
                          );
                        })}
                        <text x="180" y="55" textAnchor="middle" fill="#34d399" fontSize="10.5" fontFamily="monospace">
                          Flat Weld Seam ({straightPlateLenMm} mm) · {shots} Overlapping Films
                        </text>
                        <text x="180" y="185" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                          Active Cassette: {straightResult.stationMarkersLabel}
                        </text>
                      </svg>
                    );
                  }

                  const arcSpanDeg = straightSubMode === 'dwdi_superimposed' ? 60 : 360 / shots;
                  const centerDeg =
                    straightSubMode === 'dwdi_superimposed'
                      ? 90 + activeIdx * 60
                      : 90 + activeIdx * (360 / shots);
                  const startRad = ((centerDeg - arcSpanDeg / 2) * Math.PI) / 180;
                  const endRad = ((centerDeg + arcSpanDeg / 2) * Math.PI) / 180;
                  const arcR = pipeR + 10;
                  const ax1 = cx + arcR * Math.cos(startRad);
                  const ay1 = cy + arcR * Math.sin(startRad);
                  const ax2 = cx + arcR * Math.cos(endRad);
                  const ay2 = cy + arcR * Math.sin(endRad);

                  const oppRad = ((centerDeg + 180) * Math.PI) / 180;
                  const srcX = cx + (pipeR + (straightSubMode === 'dwsi_contact' ? 8 : 30)) * Math.cos(oppRad);
                  const srcY = cy + (pipeR + (straightSubMode === 'dwsi_contact' ? 8 : 30)) * Math.sin(oppRad);

                  return (
                    <svg
                      viewBox="0 0 360 230"
                      className="w-full h-auto rounded-lg bg-slate-900"
                      role="img"
                      aria-label="Straight pipe multi shot angular coverage"
                    >
                      {/* Cone from active source position to diagnostic film arc */}
                      <polygon
                        points={`${srcX},${srcY} ${ax1},${ay1} ${ax2},${ay2}`}
                        fill="rgba(16, 185, 129, 0.2)"
                      />

                      {/* Pipe Ring */}
                      <circle cx={cx} cy={cy} r={pipeR} fill="#0f172a" stroke="#64748b" strokeWidth="11" />

                      {/* Active Film Arc Highlight */}
                      <path
                        d={`M ${ax1} ${ay1} A ${arcR} ${arcR} 0 0 1 ${ax2} ${ay2}`}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />

                      {/* Source Marker */}
                      <circle cx={srcX} cy={srcY} r="6.5" fill="#10b981" stroke="#ecfdf5" strokeWidth="2" />

                      <text x={cx} y="216" textAnchor="middle" fill="#34d399" fontSize="10" fontFamily="monospace">
                        {straightResult.stationMarkersLabel} · {shots} Shots × {straightResult.rotationStepDeg}°
                      </text>
                    </svg>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Live Simulated Radiographic Film Preview (Negatoscope Strip) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isAr
                    ? 'معاينة الفيلم الإشعاعي الناتج على النيجاتوسكوب (Live Radiograph Projection)'
                    : 'Live Resulting Radiographic Film Preview (Negatoscope View)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeMode === 'panoramic'
                    ? isAr
                      ? 'حزام الأفلام المفرد 360° مع علامات التداخل وقياس أثر انحراف العنكبوت على الكثافة'
                      : 'Unrolled 360° film belt showing cassette overlaps, station numbers, and eccentricity density shift'
                    : activeMode === 'elliptical'
                    ? isAr
                      ? 'حرّك شريط الإزاحة المحورية لمشاهدة انفتاح اللحام من خط منطبق إلى قطع ناقص (إليبس) ودوران العيوب بين 0° و 90°'
                      : 'Adjust Axial Offset to watch the weld separate into an open ellipse and toggle 0°/90° to rotate flaws'
                    : isAr
                    ? 'شكل شريط اللحام المستقيم وعلامات الموقع الرصاصية وهبوط الكثافة عند الأطراف المماسية'
                    : 'Projected straight weld band, lead location markers, and tangential edge density profile'}
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 tabular-nums">
                {activeMode === 'panoramic'
                  ? `C = ${panoResult.circumferenceMm} mm`
                  : activeMode === 'elliptical'
                  ? `Gap = ${ellipResult.clearRootOpeningGapMm} mm`
                  : straightResult.stationMarkersLabel}
              </span>
            </div>

            {/* Film SVG Canvas */}
            {activeMode === 'panoramic' && (
              <svg
                viewBox="0 0 680 175"
                className="w-full h-auto rounded-xl border border-slate-700 bg-black"
                role="img"
                aria-label="Panoramic unrolled film belt preview"
              >
                {panoResult.filmSegments.slice(0, 8).map((seg, i, arr) => {
                  const totalShown = arr.length;
                  const segW = 640 / totalShown;
                  const x = 20 + i * segW;
                  const fillHex = densityToGrayHex(seg.localDensityHd);
                  return (
                    <g key={seg.index}>
                      <rect
                        x={x}
                        y="22"
                        width={segW - 2}
                        height="122"
                        fill={fillHex}
                        stroke="#38bdf8"
                        strokeOpacity="0.45"
                        strokeWidth="1"
                      />
                      {/* Weld single-wall horizontal band */}
                      <rect
                        x={x}
                        y="70"
                        width={segW - 2}
                        height="24"
                        fill="#cbd5e1"
                        fillOpacity="0.28"
                      />
                      <line
                        x1={x}
                        y1="82"
                        x2={x + segW - 2}
                        y2="82"
                        stroke="#e2e8f0"
                        strokeOpacity="0.35"
                        strokeWidth="3"
                      />
                      {/* Overlap zone indicator */}
                      {i > 0 && (
                        <rect
                          x={x - 6}
                          y="22"
                          width="12"
                          height="122"
                          fill="#f59e0b"
                          fillOpacity="0.22"
                        />
                      )}
                      {/* Lead Number Belt Station */}
                      <text
                        x={x + 8}
                        y="38"
                        fill="#f8fafc"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {i}
                      </text>
                      <text
                        x={x + segW / 2}
                        y="134"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        F{seg.index} · {seg.localDensityHd}
                      </text>
                    </g>
                  );
                })}
                {/* Film-side IQI + F letter on Film 1 */}
                <text x="48" y="60" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  F · IQI
                </text>
                {[0, 5, 10, 15, 20, 25].map((dx) => (
                  <line
                    key={dx}
                    x1={50 + dx}
                    y1="66"
                    x2={50 + dx}
                    y2="98"
                    stroke="#f8fafc"
                    strokeOpacity="0.6"
                    strokeWidth="1"
                  />
                ))}
                <text x="340" y="163" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
                  360° Continuous Panoramic Belt ({panoResult.requiredFilmsCount} Cassettes × {panoFilmLengthMm}mm, Overlap {panoOverlapMm}mm)
                </text>
              </svg>
            )}

            {activeMode === 'elliptical' && (() => {
              const rx = Math.min(210, Math.max(95, ellipOdMm * 2.1));
              const ry = Math.min(56, Math.max(0, ellipResult.ellipseSeparationMm * 1.45));
              const crownStroke = Math.max(9, Math.min(22, ellipWeldCapMm * 1.15));
              const cy = 88;
              const cx = 340;

              return (
                <svg
                  viewBox="0 0 680 185"
                  className="w-full h-auto rounded-xl border border-slate-700 bg-black"
                  role="img"
                  aria-label="Elliptical weld film projection"
                >
                  {/* Film Base */}
                  <rect x="35" y="16" width="610" height="142" rx="4" fill="#262930" stroke="#475569" />

                  {/* Pipe Projected Silhouette */}
                  <rect
                    x={cx - rx}
                    y="22"
                    width={rx * 2}
                    height="130"
                    fill="#383d47"
                    fillOpacity="0.72"
                  />

                  {/* Elliptical Weld Ring (Upper Source-Side Arc + Lower Film-Side Arc) */}
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx - 6}
                    ry={ry}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeOpacity="0.45"
                    strokeWidth={crownStroke}
                  />
                  {/* Inner Root Edge */}
                  {ry > 4 && (
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={Math.max(20, rx - 14)}
                      ry={Math.max(1, ry - crownStroke * 0.42)}
                      fill="#1f232a"
                      fillOpacity="0.65"
                    />
                  )}

                  {/* Projected Clock Discontinuities */}
                  {ellipResult.projectedFlaws.map((flaw) => {
                    const fx = cx + flaw.normX * (rx - 10);
                    const fy = cy + flaw.normY * ry;
                    const isTungsten = flaw.clockHour === 6;
                    const isIp = flaw.clockHour === 12;

                    return (
                      <g key={flaw.id}>
                        {isTungsten ? (
                          <circle
                            cx={fx}
                            cy={fy}
                            r="4.5"
                            fill="#ffffff"
                            stroke="#38bdf8"
                            strokeWidth="1.2"
                          />
                        ) : (
                          <rect
                            x={fx - (isIp ? 14 : 9)}
                            y={fy - 2.2}
                            width={isIp ? 28 : 18}
                            height="4.4"
                            rx="1.5"
                            fill="#090b0e"
                            stroke={flaw.clearlyResolvedInCurrentShot ? '#22d3ee' : '#f59e0b'}
                            strokeWidth="1"
                          />
                        )}
                        <text
                          x={fx}
                          y={fy < cy ? fy - 9 : fy + 16}
                          textAnchor="middle"
                          fill={flaw.clearlyResolvedInCurrentShot ? '#67e8f9' : '#fcd34d'}
                          fontSize="9.5"
                          fontFamily="monospace"
                        >
                          {flaw.clockHour}:00
                        </text>
                      </g>
                    );
                  })}

                  {/* Lead ID & Source-Side IQI */}
                  <text x="58" y="38" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    {ellipShotIdx === 0 ? 'W-02 · 0°' : 'W-02 · 90°'}
                  </text>
                  <text x="560" y="38" fill="#f8fafc" fontSize="10.5" fontFamily="monospace">
                    IQI (Src)
                  </text>
                  {[0, 6, 12, 18, 24, 30].map((dx) => (
                    <line
                      key={dx}
                      x1={560 + dx}
                      y1="46"
                      x2={560 + dx}
                      y2="78"
                      stroke="#f8fafc"
                      strokeOpacity="0.62"
                      strokeWidth="1.1"
                    />
                  ))}

                  <text x="340" y="175" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
                    {ellipResult.status === 'SUPERIMPOSED_CLOSED'
                      ? 'CLOSED / SUPERIMPOSED: Upper & Lower Walls Overlap — Increase Axial Offset!'
                      : `OPEN ELLIPSE: Upper Wall (Top Arc) + Lower Wall (Bottom Arc) · Clear Gap = ${ellipResult.clearRootOpeningGapMm} mm`}
                  </text>
                </svg>
              );
            })()}

            {activeMode === 'straight' && (() => {
              const markerParts = straightResult.stationMarkersLabel.split(' ');
              const leftMarker = markerParts[0] || '0';
              const rightMarker = markerParts[2] || '1';

              return (
                <svg
                  viewBox="0 0 680 175"
                  className="w-full h-auto rounded-xl border border-slate-700 bg-black"
                  role="img"
                  aria-label="Straight 0 degree film preview"
                >
                  <defs>
                    <linearGradient id="straightEdgeFalloff" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={straightSubMode === 'dwsi_contact' ? '#585e6a' : '#353a44'} />
                      <stop offset="20%" stopColor="#262a31" />
                      <stop offset="80%" stopColor="#262a31" />
                      <stop offset="100%" stopColor={straightSubMode === 'dwsi_contact' ? '#585e6a' : '#353a44'} />
                    </linearGradient>
                  </defs>

                  <rect
                    x="35"
                    y="18"
                    width="610"
                    height="128"
                    rx="4"
                    fill="url(#straightEdgeFalloff)"
                    stroke="#475569"
                  />

                  {/* Single Straight Weld Band */}
                  <rect
                    x="35"
                    y="66"
                    width="610"
                    height={straightSubMode === 'dwdi_superimposed' ? 32 : 24}
                    fill="#cbd5e1"
                    fillOpacity={straightSubMode === 'dwdi_superimposed' ? 0.42 : 0.28}
                  />
                  {/* Simulated Longitudinal Root Crack inside diagnostic zone */}
                  <line
                    x1="285"
                    y1="78"
                    x2="375"
                    y2="80"
                    stroke="#090b0e"
                    strokeWidth="2.8"
                  />

                  {/* Diagnostic Location Markers (A — B) */}
                  <line x1="145" y1="22" x2="145" y2="142" stroke="#10b981" strokeDasharray="4 3" strokeWidth="1.5" />
                  <line x1="535" y1="22" x2="535" y2="142" stroke="#10b981" strokeDasharray="4 3" strokeWidth="1.5" />

                  <text x="154" y="40" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    {leftMarker}
                  </text>
                  <text x="514" y="40" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    {rightMarker}
                  </text>

                  <text x="235" y="40" fill="#f8fafc" fontSize="11" fontFamily="monospace">
                    {straightSubMode === 'dwsi_contact' ? 'F · IQI (1×t)' : 'IQI (Src)'}
                  </text>
                  {[0, 6, 12, 18, 24, 30].map((dx) => (
                    <line
                      key={dx}
                      x1={238 + dx}
                      y1="52"
                      x2={238 + dx}
                      y2="108"
                      stroke="#f8fafc"
                      strokeOpacity="0.62"
                      strokeWidth="1.1"
                    />
                  ))}

                  <text x="340" y="164" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
                    {straightSubMode === 'dwdi_superimposed'
                      ? `DWDI 0° Straight Superimposed · Active ${straightResult.stationMarkersLabel} (Requires all 3 shots: 0° / 60° / 120°)`
                      : straightSubMode === 'dwsi_contact'
                      ? `DWSI 0° Contact · Diagnostic Chord = ${straightResult.effectiveChordLengthMm} mm · Edge ΔD = -${straightResult.edgeDensityDropHd} H&D`
                      : `SWSI 0° Normal Plate · Cassette Coverage = ${straightResult.effectiveChordLengthMm} mm`}
                  </text>
                </svg>
              );
            })()}
          </div>
        </div>

        {/* RIGHT / BOTTOM ZONE (5 Cols): Parameter Sliders & Real-Time ASME Engineering Deck */}
        <div className="lg:col-span-5 space-y-5">
          {/* Control Panel Card */}
          <div className={`rounded-2xl border p-5 space-y-4 ${shellClass}`}>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-700/25">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold">
                  {isAr ? 'ضوابط الهندسة والتصوير الميداني' : 'Geometry & Exposure Controls'}
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-amber-500">
                {activeMode.toUpperCase()}
              </span>
            </div>

            {/* Radiation Source Selector (Shared across all 3 techniques) */}
            <div>
              <label className="block text-xs font-bold mb-1.5">
                {isAr ? 'المصدر الإشعاعي وحجم البؤرة (F):' : 'Radiation Source & Focal Spot (F):'}
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {RT_TECH_SOURCES.map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setSourceId(src.id)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold text-start transition cursor-pointer flex items-center justify-between ${
                      sourceId === src.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate">{src.name[language]}</span>
                    <span className="font-mono tabular-nums shrink-0 ms-2">
                      F={src.focalSpotMm}mm
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* PANORAMIC CONTROLS */}
            {activeMode === 'panoramic' && (
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>{isAr ? 'القطر الخارجي للماسورة (OD):' : 'Pipe Outer Diameter (OD):'}</span>
                    <span className="font-mono text-amber-500">{panoOdMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={114}
                    max={914}
                    step={2}
                    value={panoOdMm}
                    onChange={(e) => setPanoOdMm(Number(e.target.value))}
                    aria-label="Panoramic Pipe OD"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>{isAr ? 'سماكة الجدار الواحد (t):' : 'Single Wall Thickness (t):'}</span>
                    <span className="font-mono text-amber-500">{panoWallMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={34}
                    step={0.5}
                    value={panoWallMm}
                    onChange={(e) => setPanoWallMm(Number(e.target.value))}
                    aria-label="Panoramic Wall Thickness"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPanoFilmLengthMm(300)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer tabular-nums ${
                      panoFilmLengthMm === 300
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    {isAr ? 'فيلم 300 مم (12")' : '300 mm (12") Film'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanoFilmLengthMm(400)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer tabular-nums ${
                      panoFilmLengthMm === 400
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    {isAr ? 'فيلم 400 مم (16")' : '400 mm (16") Film'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>
                      {isAr
                        ? 'تداخل الأفلام على الحزام (Overlap ≥ 25mm):'
                        : 'Film Cassette Overlap (≥ 25 mm):'}
                    </span>
                    <span className="font-mono text-cyan-400">{panoOverlapMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={panoOverlapMm}
                    onChange={(e) => setPanoOverlapMm(Number(e.target.value))}
                    aria-label="Panoramic Film Overlap"
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>
                      {isAr
                        ? 'خطأ تمركز العنكبوت (Off-Center Δe نحو 12:00):'
                        : 'Spider Off-Center Error (Δe toward 12:00):'}
                    </span>
                    <span className="font-mono text-rose-400">{panoEccentricityMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={65}
                    step={1}
                    value={panoEccentricityMm}
                    onChange={(e) => setPanoEccentricityMm(Number(e.target.value))}
                    aria-label="Spider Centering Eccentricity"
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ELLIPTICAL CONTROLS */}
            {activeMode === 'elliptical' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold">
                    {isAr ? 'لقطة الدوران النشطة (90° Rotation):' : 'Active Exposure Shot:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEllipShotIdx(0)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer tabular-nums ${
                        ellipShotIdx === 0
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isAr ? 'لقطة 1 (0°)' : 'Shot 1 (0°)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEllipShotIdx(1)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer tabular-nums flex items-center gap-1 ${
                        ellipShotIdx === 1
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'لقطة 2 (دوران 90°)' : 'Shot 2 (90°)'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>
                      {isAr
                        ? 'قطر الماسورة الصغيرة OD (حد الكود ≤ 88.9 مم):'
                        : 'Small-Bore Pipe OD (ASME ≤ 88.9 mm):'}
                    </span>
                    <span className="font-mono text-cyan-400">{ellipOdMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={33.4}
                    max={114.3}
                    step={0.5}
                    value={ellipOdMm}
                    onChange={(e) => setEllipOdMm(Number(e.target.value))}
                    aria-label="Elliptical Pipe OD"
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>{isAr ? 'سماكة الجدار (t):' : 'Wall Thickness (t):'}</span>
                    <span className="font-mono text-cyan-400">{ellipWallMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={16}
                    step={0.5}
                    value={ellipWallMm}
                    onChange={(e) => setEllipWallMm(Number(e.target.value))}
                    aria-label="Elliptical Wall Thickness"
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>{isAr ? 'المسافة البؤرية (SFD):' : 'Source-to-Film Distance (SFD):'}</span>
                    <span className="font-mono text-cyan-400">{ellipSfdMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={300}
                    max={850}
                    step={10}
                    value={ellipSfdMm}
                    onChange={(e) => setEllipSfdMm(Number(e.target.value))}
                    aria-label="Elliptical SFD"
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>
                      {isAr
                        ? 'الإزاحة المحورية للمصدر (Axial Offset L):'
                        : 'Axial Source Offset (L):'}
                    </span>
                    <span className="font-mono text-amber-400">
                      {ellipOffsetMm} mm ({ellipResult.beamTiltDeg}°)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={250}
                    step={2}
                    value={ellipOffsetMm}
                    onChange={(e) => setEllipOffsetMm(Number(e.target.value))}
                    aria-label="Elliptical Axial Offset"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[11px] tabular-nums ${mutedText}`}>
                      {isAr
                        ? `النطاق الموصى به: ${ellipResult.recommendedMinOffsetMm}–${ellipResult.recommendedMaxOffsetMm} مم`
                        : `Target range: ${ellipResult.recommendedMinOffsetMm}–${ellipResult.recommendedMaxOffsetMm} mm`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEllipOffsetMm(ellipResult.optimalOffsetMm)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-cyan-500/35 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>
                        {isAr
                          ? `ضبط مثالي (${ellipResult.optimalOffsetMm} مم)`
                          : `Auto-Offset (${ellipResult.optimalOffsetMm} mm)`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STRAIGHT CONTROLS */}
            {activeMode === 'straight' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {isAr
                      ? 'نوع الستريت تكنيك الميداني (0° Straight Sub-Mode):'
                      : 'Straight 0° Configuration:'}
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setStraightSubMode('dwdi_superimposed');
                        setStraightOdMm(60.3);
                        setStraightWallMm(11.1);
                        setStraightSfdMm(500);
                        setStraightShotIdx(0);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-start cursor-pointer ${
                        straightSubMode === 'dwdi_superimposed'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isAr
                        ? '1. ستريت متطابق للمواسير الصغيرة ≤ 3.5" (DWDI 0° · 3 لقطات × 60°)'
                        : '1. Small-Bore Superimposed (DWDI 0° · 3 Shots @ 60°)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStraightSubMode('dwsi_contact');
                        setStraightOdMm(219.1);
                        setStraightWallMm(12.7);
                        setStraightSfdMm(230);
                        setStraightShotIdx(0);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-start cursor-pointer ${
                        straightSubMode === 'dwsi_contact'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isAr
                        ? '2. ستريت ملامس للمواسير > 3.5" (DWSI 0° Contact · 3–6 لقطات)'
                        : '2. Medium/Large Pipe Contact (DWSI 0° · 3–6 Shots)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStraightSubMode('swsi_plate');
                        setStraightWallMm(16);
                        setStraightSfdMm(650);
                        setStraightShotIdx(0);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-start cursor-pointer ${
                        straightSubMode === 'swsi_plate'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isAr
                        ? '3. ستريت عمودي للألواح المفتوحة (SWSI 0° Flat Plate)'
                        : '3. Flat Plate Butt Weld (SWSI 0° Perpendicular)'}
                    </button>
                  </div>
                </div>

                {straightSubMode !== 'swsi_plate' ? (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                      <span>{isAr ? 'القطر الخارجي للماسورة (OD):' : 'Pipe Outer Diameter (OD):'}</span>
                      <span className="font-mono text-emerald-400">{straightOdMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={straightSubMode === 'dwdi_superimposed' ? 33 : 100}
                      max={straightSubMode === 'dwdi_superimposed' ? 114 : 610}
                      step={1}
                      value={straightOdMm}
                      onChange={(e) => setStraightOdMm(Number(e.target.value))}
                      aria-label="Straight Pipe OD"
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                      <span>{isAr ? 'طول خط لحام اللوح:' : 'Flat Weld Seam Length:'}</span>
                      <span className="font-mono text-emerald-400">{straightPlateLenMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={350}
                      max={2400}
                      step={50}
                      value={straightPlateLenMm}
                      onChange={(e) => setStraightPlateLenMm(Number(e.target.value))}
                      aria-label="Plate Weld Length"
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>{isAr ? 'سماكة الجدار (t):' : 'Wall Thickness (t):'}</span>
                    <span className="font-mono text-emerald-400">{straightWallMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={36}
                    step={0.5}
                    value={straightWallMm}
                    onChange={(e) => setStraightWallMm(Number(e.target.value))}
                    aria-label="Straight Wall Thickness"
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 tabular-nums">
                    <span>{isAr ? 'مسافة المصدر للفيلم (SFD):' : 'Source-to-Film Distance (SFD):'}</span>
                    <span className="font-mono text-emerald-400">
                      {Math.max(
                        straightSubMode === 'dwsi_contact' ? straightOdMm : 250,
                        straightSfdMm
                      )}{' '}
                      mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={straightSubMode === 'dwsi_contact' ? Math.round(straightOdMm) : 250}
                    max={950}
                    step={10}
                    value={Math.max(
                      straightSubMode === 'dwsi_contact' ? Math.round(straightOdMm) : 250,
                      straightSfdMm
                    )}
                    onChange={(e) => setStraightSfdMm(Number(e.target.value))}
                    aria-label="Straight SFD"
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Multi-Shot Sector Selector */}
                <div>
                  <div className="text-xs font-bold mb-1.5">
                    {isAr
                      ? 'استعراض اللقطات المتتابعة حول المحيط:'
                      : 'Cycle Multi-Shot Exposure Stations:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      { length: Math.min(6, straightResult.exposuresRequired) },
                      (_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStraightShotIdx(idx)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer tabular-nums ${
                            straightShotIdx % straightResult.exposuresRequired === idx
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : isLight
                              ? 'bg-slate-100 border-slate-300 text-slate-700'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          {isAr ? `لقطة ${idx + 1}` : `Shot ${idx + 1}`}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live ASME Section V Telemetry & Diagnostic Verdict Card */}
          <div className={`rounded-2xl border p-5 space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>
                  {isAr
                    ? 'نتائج الحسابات الهندسية ومطابقة كود ASME'
                    : 'Live Engineering Telemetry & ASME Compliance'}
                </span>
              </h4>
              {(activeMode === 'panoramic'
                ? panoResult.passesAsmeCode
                : activeMode === 'elliptical'
                ? ellipResult.passesAsmeCode
                : straightResult.passesAsmeCode) ? (
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'مطابق للكود' : 'ASME COMPLIANT'}</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  <span>{isAr ? 'يلزم تصحيح الضبط' : 'ADJUST SETUP'}</span>
                </span>
              )}
            </div>

            {/* Key Quantitative Metrics Grid */}
            {activeMode === 'panoramic' && (
              <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>{isAr ? 'محيط الماسورة الكلي' : 'Outer Circumference'}</div>
                  <div className="text-base font-black font-mono mt-0.5">
                    {panoResult.circumferenceMm} mm
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>{isAr ? 'عدد الأفلام بالحزام' : 'Films in 360° Belt'}</div>
                  <div className="text-base font-black font-mono mt-0.5 text-amber-500">
                    {panoResult.requiredFilmsCount} {isAr ? 'أفلام (لقطة 1)' : 'Films (1 Shot)'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'Ug الجدار القريب / الحد' : 'Near-Wall Ug / Max'}
                  </div>
                  <div
                    className={`text-base font-black font-mono mt-0.5 ${
                      panoResult.nearWallUgMm <= panoResult.maxAllowedUgMm
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {panoResult.nearWallUgMm} / {panoResult.maxAllowedUgMm} mm
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'أقل قطر OD مسموح لـ Ug' : 'Min Pipe OD for Ug'}
                  </div>
                  <div className="text-base font-black font-mono mt-0.5">
                    {panoResult.minAllowableOdForUgMm} mm
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'elliptical' && (
              <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'زاوية ميل الشعاع (θ)' : 'Beam Tilt Angle (θ)'}
                  </div>
                  <div className="text-base font-black font-mono mt-0.5 text-cyan-500">
                    {ellipResult.beamTiltDeg}°
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'فراغ فتحة الإليبس الصافي' : 'Clear Root Opening'}
                  </div>
                  <div
                    className={`text-base font-black font-mono mt-0.5 ${
                      ellipResult.clearRootOpeningGapMm >= 3
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {ellipResult.clearRootOpeningGapMm} mm
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'الضبابية الهندسية Ug' : 'Double-Wall Ug'}
                  </div>
                  <div
                    className={`text-base font-black font-mono mt-0.5 ${
                      ellipResult.passesUg ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {ellipResult.ugMm} / {ellipResult.maxAllowedUgMm} mm
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'عدد اللقطات لـ 360°' : 'Exposures for 360°'}
                  </div>
                  <div className="text-base font-black font-mono mt-0.5 text-amber-500">
                    2 × 90° ({ellipResult.obliquePenetratedSteelMm}mm)
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'straight' && (
              <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'عدد اللقطات المطلوبة' : 'Required Exposures'}
                  </div>
                  <div className="text-base font-black font-mono mt-0.5 text-emerald-500">
                    {straightResult.exposuresRequired}{' '}
                    {straightResult.rotationStepDeg > 0
                      ? `(@ ${straightResult.rotationStepDeg}°)`
                      : isAr
                      ? 'لقطات متتالية'
                      : 'Sequential'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'الطول الفعّال للقطة' : 'Diagnostic Length'}
                  </div>
                  <div className="text-base font-black font-mono mt-0.5">
                    {straightResult.effectiveChordLengthMm} mm
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'الضبابية الهندسية Ug' : 'Geometric Ug'}
                  </div>
                  <div
                    className={`text-base font-black font-mono mt-0.5 ${
                      straightResult.passesUg ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {straightResult.ugMm} / {straightResult.maxAllowedUgMm} mm
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/25">
                  <div className={mutedText}>
                    {isAr ? 'السمك المخترق' : 'Penetrated Steel'}
                  </div>
                  <div className="text-base font-black font-mono mt-0.5">
                    {straightResult.penetratedSteelMm} mm ({straightResult.wallsPenetrated}W/
                    {straightResult.wallsViewed}V)
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Feedback List */}
            <div className="space-y-2">
              {(activeMode === 'panoramic'
                ? panoResult.diagnostics
                : activeMode === 'elliptical'
                ? ellipResult.diagnostics
                : straightResult.diagnostics
              ).map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                    diag.severity === 'pass'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : diag.severity === 'warn'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {diag.severity === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : diag.severity === 'warn' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{diag[language]}</span>
                </div>
              ))}
            </div>

            {/* IQI Placement Rule Callout */}
            <div className={`p-3 rounded-xl border border-slate-700/25 text-xs leading-relaxed ${mutedText}`}>
              <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>
                {isAr ? 'قاعدة وضع سلك الحساسية (ASME IQI): ' : 'ASME IQI Placement Rule: '}
              </strong>
              {activeMode === 'panoramic'
                ? panoResult.iqiRule[language]
                : activeMode === 'elliptical'
                ? isAr
                  ? 'اختراق جدارين وتفسير جدارين (DWDI): يوضع سلك IQI جهة المصدر أعلى الماسورة دون الحاجة لحرف F، ويُختار السلك على أساس جدار واحد في أغلب مواصفات ASME T-277.'
                  : 'DWDI Elliptical: Place IQI on upper source-side pipe surface (no "F" marker required).'
                : straightResult.iqiRule[language]}
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Comparison Matrix: Panoramic vs Elliptical vs Straight */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${shellClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-4 h-4 text-amber-500" />
          <h3 className="text-base sm:text-lg font-bold">
            {isAr
              ? 'جدول المقارنة الهندسية الشامل: البانوراما · الإليبس · الستريت (ASME Sec V Art. 2)'
              : 'Master Engineering Comparison: Panoramic vs. Elliptical vs. Straight (ASME Sec V)'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse tabular-nums">
            <thead>
              <tr className="border-b border-slate-700/30 text-start">
                <th className="py-2.5 px-3 text-start font-bold">{isAr ? 'المعيار الهندسي' : 'Parameter'}</th>
                <th className="py-2.5 px-3 text-start font-bold text-amber-500">
                  {isAr ? 'البانوراما (Panoramic)' : 'Panoramic (SWSI 360°)'}
                </th>
                <th className="py-2.5 px-3 text-start font-bold text-cyan-500">
                  {isAr ? 'الإليبس (Elliptical)' : 'Elliptical (DWDI Offset)'}
                </th>
                <th className="py-2.5 px-3 text-start font-bold text-emerald-500">
                  {isAr ? 'ستريت متطابق (DWDI 0°)' : 'Straight Superimposed (0°)'}
                </th>
                <th className="py-2.5 px-3 text-start font-bold text-emerald-400">
                  {isAr ? 'ستريت ملامس (DWSI 0°)' : 'Straight Contact (DWSI 0°)'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              <tr>
                <td className="py-2.5 px-3 font-semibold">{isAr ? 'نطاق قطر الماسورة OD' : 'Pipe OD Range'}</td>
                <td className="py-2.5 px-3">{isAr ? 'أقطار متوسطة وكبيرة (≥ 6"–60") مع وصول داخلي' : 'Medium/Large (≥ 6"–60") w/ internal access'}</td>
                <td className="py-2.5 px-3 font-mono">OD ≤ 3.5&quot; (88.9 mm)</td>
                <td className="py-2.5 px-3 font-mono">OD ≤ 3.5&quot; (Heavy Wall / Tight)</td>
                <td className="py-2.5 px-3 font-mono">OD &gt; 3.5&quot; (Closed Pipe)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">{isAr ? 'إزاحة المصدر المحورية' : 'Axial Source Offset'}</td>
                <td className="py-2.5 px-3">{isAr ? 'صفر (مركز المحور تماماً)' : '0 mm (Centered on pipe axis)'}</td>
                <td className="py-2.5 px-3">{isAr ? 'SFD/5 إلى SFD/3 (ميل 12°–18°)' : 'SFD/5 to SFD/3 (12°–18° tilt)'}</td>
                <td className="py-2.5 px-3">{isAr ? 'صفر (شعاع عمودي 0°)' : '0 mm (Perpendicular 0°)'}</td>
                <td className="py-2.5 px-3">{isAr ? 'صفر (شعاع عمودي 0°)' : '0 mm (Perpendicular 0°)'}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">{isAr ? 'الجدران المخترقة / المفسرة' : 'Walls Penetrated / Viewed'}</td>
                <td className="py-2.5 px-3 font-mono">1 Wall / 1 Wall (1×t)</td>
                <td className="py-2.5 px-3 font-mono">2 Walls / 2 Walls (2×t)</td>
                <td className="py-2.5 px-3 font-mono">2 Walls / 2 Walls (2×t)</td>
                <td className="py-2.5 px-3 font-mono">2 Walls / 1 Film Wall (2×t)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">{isAr ? 'أقل عدد لقطات لـ 360°' : 'Min Shots for 360°'}</td>
                <td className="py-2.5 px-3 font-bold text-amber-500">{isAr ? 'لقطة واحدة فقط (100%)' : '1 Single Exposure (100%)'}</td>
                <td className="py-2.5 px-3 font-bold text-cyan-500">{isAr ? 'لقطتان بزاوية 90° (0° و 90°)' : '2 Exposures @ 90°'}</td>
                <td className="py-2.5 px-3 font-bold text-emerald-500">{isAr ? '3 لقطات بزاوية 60° (أو 120°)' : '3 Exposures @ 60° (or 120°)'}</td>
                <td className="py-2.5 px-3 font-bold text-emerald-400">{isAr ? '3 إلى 6 لقطات (حسب القطر)' : '3 to 6 Exposures (by arc)'}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">{isAr ? 'شكل اللحام على الفيلم' : 'Weld Shape on Film'}</td>
                <td className="py-2.5 px-3">{isAr ? 'شريط مستقيم متصل عبر حزام الأفلام' : 'Continuous straight single-wall belt'}</td>
                <td className="py-2.5 px-3">{isAr ? 'قطع ناقص مفتوح (قوس علوي + قوس سفلي)' : 'Open Ellipse (separated upper & lower arcs)'}</td>
                <td className="py-2.5 px-3">{isAr ? 'شريط مستقيم منطبق الجدارين' : 'Single superimposed straight band'}</td>
                <td className="py-2.5 px-3">{isAr ? 'شريط مستقيم بين علامتي A—B' : 'Single-wall chord band between A—B'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Practical Competency Check & XP Record Logger */}
      <div className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${shellClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>
                {isAr
                  ? 'اختبار إتقان التكنيكات الميدانية وتسجيل نقاط الخبرة (+XP)'
                  : 'Field Technique Mastery Check & XP Logging'}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              {isAr
                ? 'أجب عن المواقف الميدانية الثلاثة لتوثيق إتمام محاكاة البانوراما والإليبس والستريت في سجلك التدريبي.'
                : 'Answer the 3 field scenarios to log your Panoramic, Elliptical & Straight RT competency record.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogMasteryAttempt}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>
              {isAr
                ? 'حفظ إتمام محاكاة التكنيكات الثلاثة (+XP)'
                : 'Record RT Techniques Mastery (+XP)'}
            </span>
          </button>
        </div>

        {loggedRecordInfo && (
          <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs sm:text-sm flex items-center justify-between gap-3 tabular-nums">
            <span className="font-bold text-emerald-600 dark:text-emerald-300">
              {isAr
                ? `تم توثيق التمرين في سجل المحاكاة بنجاح! النتيجة: ${loggedRecordInfo.scorePct}%`
                : `Training attempt recorded! Mastery Score: ${loggedRecordInfo.scorePct}%`}
            </span>
            <span className="font-mono font-black text-amber-500">
              +{loggedRecordInfo.xpEarned} XP
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {MASTERY_QUESTIONS.map((mq, qIdx) => {
            const picked = answers[mq.id];
            const hasAnswered = picked !== undefined;
            const isCorrect = picked === mq.correctIndex;

            return (
              <div key={mq.id} className={`rounded-xl border p-4 space-y-3 ${panelClass}`}>
                <div className="text-xs font-bold leading-relaxed">
                  <span className="font-mono text-amber-500 me-1.5 tabular-nums">0{qIdx + 1}.</span>
                  {mq.question[language]}
                </div>
                <div className="space-y-1.5">
                  {mq.options.map((opt, oIdx) => {
                    const isPicked = picked === oIdx;
                    const optCorrect = oIdx === mq.correctIndex;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [mq.id]: oIdx }))}
                        className={`w-full text-start p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                          hasAnswered && optCorrect
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-200 font-bold'
                            : hasAnswered && isPicked && !optCorrect
                            ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-200'
                            : isLight
                            ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-700'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        {opt[language]}
                      </button>
                    );
                  })}
                </div>
                {hasAnswered && (
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isCorrect
                        ? 'text-emerald-600 dark:text-emerald-300'
                        : 'text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    {mq.explanation[language]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* GE Exposure Time Calculator Modal */}
      {showGeExposureModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto animate-fadeIn">
            <GeRadiographicExposureTimeApp
              language={language}
              initialSource={sourceId === 'xray_crawler' ? 'xray_pano' : 'ir192'}
              initialThicknessMm={
                activeMode === 'panoramic'
                  ? panoWallMm
                  : activeMode === 'elliptical'
                  ? ellipWallMm
                  : straightWallMm
              }
              initialSfdCm={
                activeMode === 'panoramic'
                  ? Math.round(panoOdMm / 20)
                  : activeMode === 'elliptical'
                  ? Math.round(ellipSfdMm / 10)
                  : Math.round(straightSfdMm / 10)
              }
              onClose={() => setShowGeExposureModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
