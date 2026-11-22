import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Radio,
  ShieldCheck,
  ShieldAlert,
  FlaskConical,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Ruler,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Layers,
  Thermometer,
  Clock,
  FileCheck2,
} from 'lucide-react';
import { Language } from '../../../types';
import { useTheme } from '../../../utils/themeStore';
import { recordSimulationAttempt } from '../../../utils/simulationHistoryStore';
import {
  RT_SOURCES,
  RT_TECHNIQUES,
  RT_FILMS,
  RT_WELD_SPECIMENS,
  RT_DEFECT_LABELS,
  RtSourceId,
  RtTechniqueId,
  RtFilmClassId,
  RtGoverningCodeId,
  RtDefectClassification,
  computeGeometricUnsharpness,
  computeRadiationSafetyZone,
  selectEssentialAsmeWire,
  computeOptimalExposureSeconds,
  evaluateDevelopedFilm,
} from '../../../data/rtSimulationData';
import { RtSetupAndExposureStage, ExposureState } from './RtSetupAndExposureStage';
import { RtNegatoscopeCanvas } from './RtNegatoscopeCanvas';
import { RtShootingTechniquesSimulator } from './RtShootingTechniquesSimulator';
import { GeRadiographicExposureTimeApp } from './GeRadiographicExposureTimeApp';
import { RtAllCodesAcceptanceSimulator } from './RtAllCodesAcceptanceSimulator';
import { RtIntegratedFilmWorkbench } from './RtIntegratedFilmWorkbench';

export type RtLabStageId = 'setup' | 'exposure' | 'darkroom' | 'interpretation';

export interface RadiographicTestingLabProps {
  language: Language;
}

interface RtEvaluationSubmission {
  scorePct: number;
  passed: boolean;
  xpEarned: number;
  qcPoints: number;
  classificationPoints: number;
  sizingPoints: number;
  verdictPoints: number;
  classificationCorrect: boolean;
  verdictCorrect: boolean;
  lengthErrorMm: number;
}

const DEFECT_CLASSIFICATION_OPTIONS: readonly RtDefectClassification[] = [
  'crack',
  'incomplete_penetration',
  'lack_of_fusion',
  'slag_inclusion',
  'porosity',
  'tungsten_inclusion',
  'undercut',
  'sound',
];

const GOVERNING_CODES: readonly {
  id: RtGoverningCodeId;
  shortLabel: string;
  fullLabel: { ar: string; en: string };
}[] = [
  {
    id: 'ASME_VIII_UW51',
    shortLabel: 'ASME VIII UW-51',
    fullLabel: {
      ar: 'ASME Sec VIII Div. 1 UW-51 (أوعية الضغط — فحص كامل 100%)',
      en: 'ASME Sec VIII Div. 1 UW-51 (Pressure Vessels — Full RT)',
    },
  },
  {
    id: 'ASME_B31_3',
    shortLabel: 'ASME B31.3',
    fullLabel: {
      ar: 'ASME B31.3 Table 341.3.2 (أنابيب العمليات والمصافي)',
      en: 'ASME B31.3 Table 341.3.2 (Process Piping)',
    },
  },
  {
    id: 'API_1104',
    shortLabel: 'API 1104 Sec. 9',
    fullLabel: {
      ar: 'API 1104 Section 9 (خطوط أنابيب نقل البترول والغاز)',
      en: 'API 1104 Section 9 (Cross-Country Pipelines)',
    },
  },
];

export const RadiographicTestingLab: React.FC<RadiographicTestingLabProps> = ({ language }) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const NextArrow = isAr ? ArrowLeft : ArrowRight;

  // Stage & Mode State
  const [activeStage, setActiveStage] = useState<RtLabStageId>('setup');
  const [blindExamMode, setBlindExamMode] = useState<boolean>(false);
  const [showTechniquesSimulator, setShowTechniquesSimulator] = useState<boolean>(false);

  // Stage 1: Job Setup & Safety Parameters
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>(RT_WELD_SPECIMENS[0].id);
  const [selectedSourceId, setSelectedSourceId] = useState<RtSourceId>(
    RT_WELD_SPECIMENS[0].recommendedSource
  );
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<RtTechniqueId>(
    RT_WELD_SPECIMENS[0].recommendedTechnique
  );
  const [selectedFilmId, setSelectedFilmId] = useState<RtFilmClassId>('class_1');
  const [sfdMm, setSfdMm] = useState<number>(720);
  const [activityCi, setActivityCi] = useState<number>(45);
  const [kv, setKv] = useState<number>(220);
  const [ma, setMa] = useState<number>(5.0);
  const [hasCollimator, setHasCollimator] = useState<boolean>(true);
  const [hasBarricade, setHasBarricade] = useState<boolean>(true);
  const [hasSurveyMeterOn, setHasSurveyMeterOn] = useState<boolean>(true);
  const [hasLeadScreens, setHasLeadScreens] = useState<boolean>(true);
  const [hasBackscatterB, setHasBackscatterB] = useState<boolean>(true);
  const [iqiPlacement, setIqiPlacement] = useState<'source_side' | 'film_side'>('film_side');

  // Stage 2: Exposure & Shooting State
  const [targetExposureSeconds, setTargetExposureSeconds] = useState<number>(68);
  const [elapsedExposureSeconds, setElapsedExposureSeconds] = useState<number>(0);
  const [exposureState, setExposureState] = useState<ExposureState>('idle');
  const [autoSyncExposureTime, setAutoSyncExposureTime] = useState<boolean>(true);

  // Stage 3: Darkroom Chemical Processing State
  const [developerTempC, setDeveloperTempC] = useState<number>(20.0);
  const [developerMinutes, setDeveloperMinutes] = useState<number>(5.0);

  // Stage 4: Negatoscope Film Interpretation & Code Evaluation State
  const [showInstructorOverlay, setShowInstructorOverlay] = useState<boolean>(false);
  const [caliperMeasuredMm, setCaliperMeasuredMm] = useState<number | null>(null);
  const [traineeClassification, setTraineeClassification] =
    useState<RtDefectClassification>('crack');
  const [traineeLengthMm, setTraineeLengthMm] = useState<number>(15.0);
  const [governingCode, setGoverningCode] = useState<RtGoverningCodeId>('ASME_VIII_UW51');
  const [traineeVerdict, setTraineeVerdict] = useState<'ACCEPT' | 'REJECT'>('REJECT');
  const [submissionResult, setSubmissionResult] = useState<RtEvaluationSubmission | null>(null);
  const [showGeExposureApp, setShowGeExposureApp] = useState<boolean>(false);

  const specimen = useMemo(
    () => RT_WELD_SPECIMENS.find((sp) => sp.id === selectedSpecimenId) ?? RT_WELD_SPECIMENS[0],
    [selectedSpecimenId]
  );
  const source = useMemo(
    () => RT_SOURCES.find((src) => src.id === selectedSourceId) ?? RT_SOURCES[0],
    [selectedSourceId]
  );
  const technique = useMemo(
    () => RT_TECHNIQUES.find((tech) => tech.id === selectedTechniqueId) ?? RT_TECHNIQUES[0],
    [selectedTechniqueId]
  );
  const filmClass = useMemo(
    () => RT_FILMS.find((f) => f.id === selectedFilmId) ?? RT_FILMS[0],
    [selectedFilmId]
  );

  // Real-time ASME Section V Engineering Calculations
  const ugResult = useMemo(
    () =>
      computeGeometricUnsharpness(
        source.focalSpotMm,
        sfdMm,
        specimen.wallThicknessMm,
        technique.wallsPenetrated,
        specimen.outerDiameterMm
      ),
    [
      source.focalSpotMm,
      sfdMm,
      specimen.wallThicknessMm,
      technique.wallsPenetrated,
      specimen.outerDiameterMm,
    ]
  );

  const safetyResult = useMemo(
    () => computeRadiationSafetyZone(source, activityCi, kv, ma, hasCollimator),
    [source, activityCi, kv, ma, hasCollimator]
  );

  const iqiSelection = useMemo(
    () => selectEssentialAsmeWire(specimen.wallThicknessMm, iqiPlacement === 'source_side'),
    [specimen.wallThicknessMm, iqiPlacement]
  );

  const exposureCalcInput = useMemo(
    () => ({
      source,
      technique,
      filmClass,
      wallThicknessMm: specimen.wallThicknessMm,
      sfdMm,
      activityCi,
      kv,
      ma,
      hasLeadScreens,
      hasBackscatterB,
      developerTempC,
      developerMinutes,
    }),
    [
      source,
      technique,
      filmClass,
      specimen.wallThicknessMm,
      sfdMm,
      activityCi,
      kv,
      ma,
      hasLeadScreens,
      hasBackscatterB,
      developerTempC,
      developerMinutes,
    ]
  );

  const optimalExposureSeconds = useMemo(
    () => computeOptimalExposureSeconds(exposureCalcInput),
    [exposureCalcInput]
  );

  // Keep targetExposureSeconds synced to optimal when autoSyncExposureTime is active
  useEffect(() => {
    if (autoSyncExposureTime) {
      setTargetExposureSeconds(optimalExposureSeconds);
    }
  }, [autoSyncExposureTime, optimalExposureSeconds]);

  // Evaluate developed film density & QC
  // If the trainee actually completed an exposure shot, use elapsed/target; otherwise preview targetExposureSeconds
  const effectiveShotSeconds =
    exposureState === 'source_out_done' || exposureState === 'retracted_safe'
      ? Math.max(1, elapsedExposureSeconds)
      : targetExposureSeconds;

  const filmEval = useMemo(
    () =>
      evaluateDevelopedFilm(
        exposureCalcInput,
        effectiveShotSeconds,
        ugResult.ugMm,
        ugResult.maxAllowedUgMm
      ),
    [exposureCalcInput, effectiveShotSeconds, ugResult.ugMm, ugResult.maxAllowedUgMm]
  );

  // Live exposure timer tick when exposing
  useEffect(() => {
    if (exposureState !== 'exposing') return;
    const stepSeconds = Math.max(1, Math.ceil(targetExposureSeconds / 25));
    const timer = window.setInterval(() => {
      setElapsedExposureSeconds((prev) => {
        const next = prev + stepSeconds;
        if (next >= targetExposureSeconds) {
          setExposureState('source_out_done');
          return targetExposureSeconds;
        }
        return next;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [exposureState, targetExposureSeconds]);

  const applyRecommendedSetupForSpecimen = useCallback((targetSpecimenId: string) => {
    const sp =
      RT_WELD_SPECIMENS.find((item) => item.id === targetSpecimenId) ?? RT_WELD_SPECIMENS[0];
    const recSource =
      RT_SOURCES.find((src) => src.id === sp.recommendedSource) ?? RT_SOURCES[0];
    const recTech =
      RT_TECHNIQUES.find((tech) => tech.id === sp.recommendedTechnique) ?? RT_TECHNIQUES[0];

    setSelectedSpecimenId(sp.id);
    setSelectedSourceId(recSource.id);
    setSelectedTechniqueId(recTech.id);
    setSelectedFilmId('class_1');

    if (recSource.category === 'gamma') {
      setActivityCi(recSource.defaultActivityCi);
    } else {
      setKv(recSource.defaultKv);
      setMa(recSource.defaultMa);
    }

    const ugCheck = computeGeometricUnsharpness(
      recSource.focalSpotMm,
      600,
      sp.wallThicknessMm,
      recTech.wallsPenetrated,
      sp.outerDiameterMm
    );
    setSfdMm(Math.max(550, ugCheck.minimumRecommendedSfdMm + 80));
    setHasCollimator(true);
    setHasBarricade(true);
    setHasSurveyMeterOn(true);
    setHasLeadScreens(true);
    setHasBackscatterB(true);
    setIqiPlacement(recTech.wallsPenetrated === 2 ? 'film_side' : 'source_side');
    setDeveloperTempC(20.0);
    setDeveloperMinutes(5.0);
    setAutoSyncExposureTime(true);
    setExposureState('idle');
    setElapsedExposureSeconds(0);
    setShowInstructorOverlay(false);
    setCaliperMeasuredMm(null);
    setSubmissionResult(null);
  }, []);

  const handleSelectSpecimen = (specimenId: string) => {
    applyRecommendedSetupForSpecimen(specimenId);
  };

  const handleSelectSource = (sourceId: RtSourceId) => {
    const nextSrc = RT_SOURCES.find((s) => s.id === sourceId) ?? RT_SOURCES[0];
    setSelectedSourceId(sourceId);
    if (nextSrc.category === 'gamma') {
      setActivityCi(nextSrc.defaultActivityCi);
    } else {
      setKv(nextSrc.defaultKv);
      setMa(nextSrc.defaultMa);
    }
    setExposureState('idle');
    setElapsedExposureSeconds(0);
    setSubmissionResult(null);
  };

  const handleStartExposure = () => {
    setElapsedExposureSeconds(0);
    setExposureState('exposing');
  };

  const handleInstantFinishExposure = () => {
    setElapsedExposureSeconds(targetExposureSeconds);
    setExposureState('source_out_done');
  };

  const handleRetractAndSurvey = () => {
    setExposureState('retracted_safe');
  };

  const handleResetExposure = () => {
    setElapsedExposureSeconds(0);
    setExposureState('idle');
  };

  const handleMeasuredLengthFromCaliper = useCallback((lenMm: number) => {
    setCaliperMeasuredMm(lenMm);
    setTraineeLengthMm(lenMm);
  }, []);

  const handleSubmitInterpretation = () => {
    const codeRule = specimen.codeVerdicts[governingCode];
    const qcPoints = filmEval.passesFilmQc ? 20 : 8;
    const classificationCorrect = traineeClassification === specimen.primaryClassification;
    const classificationPoints = classificationCorrect ? 35 : 0;

    let lengthErrorMm = Math.abs(traineeLengthMm - specimen.primaryLengthMm);
    let sizingPoints = 0;
    if (specimen.primaryClassification === 'sound') {
      lengthErrorMm = traineeLengthMm;
      sizingPoints = traineeLengthMm <= 1.0 ? 20 : 5;
    } else if (lengthErrorMm <= 3.5) {
      sizingPoints = 20;
    } else if (lengthErrorMm <= 7.5) {
      sizingPoints = 12;
    } else if (lengthErrorMm <= 12.0) {
      sizingPoints = 6;
    }

    const verdictCorrect = traineeVerdict === codeRule.verdict;
    const verdictPoints = verdictCorrect ? 25 : 0;

    const scorePct = qcPoints + classificationPoints + sizingPoints + verdictPoints;
    const passed = scorePct >= 70 && verdictCorrect;

    const defectLabel = RT_DEFECT_LABELS[specimen.primaryClassification];
    const record = recordSimulationAttempt({
      simulatorId: `rt_lab_${specimen.id}_${source.id}`,
      targetSubTab: 'rt_lab',
      simulatorTitle: {
        ar: `معمل التصوير الإشعاعي RT (${source.shortCode}) — ${specimen.weldTag}`,
        en: `RT Lab (${source.shortCode}) — ${specimen.weldTag}`,
      },
      ndtMethod: 'RT',
      defectTypes: [
        {
          id: `rt_${specimen.primaryClassification}`,
          ar: defectLabel.ar,
          en: defectLabel.en,
        },
      ],
      status: passed ? 'PASS' : 'FAIL',
      codeVerdict: codeRule.verdict,
      traineeVerdict,
      codeStandard: codeRule.clause,
      scorePct,
      actualLengthMm: specimen.primaryLengthMm,
      measuredLengthMm: traineeLengthMm,
      notes: {
        ar: `كثافة الفيلم ${filmEval.weldMetalDensity} H&D · تقنية ${technique.shortCode} · دقة التقييم ${scorePct}%`,
        en: `Film density ${filmEval.weldMetalDensity} H&D · ${technique.shortCode} · Score ${scorePct}%`,
      },
    });

    setShowInstructorOverlay(true);
    setSubmissionResult({
      scorePct,
      passed,
      xpEarned: record.xpEarned,
      qcPoints,
      classificationPoints,
      sizingPoints,
      verdictPoints,
      classificationCorrect,
      verdictCorrect,
      lengthErrorMm: Number(lengthErrorMm.toFixed(1)),
    });
  };

  const stages: readonly {
    id: RtLabStageId;
    stepNum: string;
    title: { ar: string; en: string };
    subtitle: { ar: string; en: string };
  }[] = [
    {
      id: 'setup',
      stepNum: '01',
      title: { ar: 'تجهيز الشغل والأمان', en: 'Job Setup & Safety' },
      subtitle: { ar: 'المصدر · SFD · Ug · الحواجز', en: 'Source · SFD · Ug · Barricade' },
    },
    {
      id: 'exposure',
      stepNum: '02',
      title: { ar: 'التعريض والتصوير الميداني', en: 'Exposure & Shooting' },
      subtitle: { ar: 'إخراج المصدر · المؤقت · المسح', en: 'Crank-Out · HV Timer · Survey' },
    },
    {
      id: 'darkroom',
      stepNum: '03',
      title: { ar: 'الغرفة المظلمة وجودة الفيلم', en: 'Darkroom & Film QC' },
      subtitle: { ar: 'التحميض · الكثافة H&D · سلك IQI', en: 'Developer · H&D Density · IQI' },
    },
    {
      id: 'interpretation',
      stepNum: '04',
      title: { ar: 'قراءة الفيلم وتقييم الكود', en: 'Film Reading & Verdict' },
      subtitle: { ar: 'نيجاتوسكوب · قياس العيب · القرار', en: 'Negatoscope · Sizing · Code' },
    },
  ];

  const shellBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const subCardBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : 'bg-slate-950/90 border-slate-800';
  const inputBg = isLight
    ? 'bg-white border-slate-300 text-slate-900'
    : 'bg-slate-900 border-slate-700 text-slate-100';

  const activeCodeRule = specimen.codeVerdicts[governingCode];

  return (
    <div className="space-y-6">
      {/* Main Header & 4-Stage Pipeline Navigation */}
      <div className={`rounded-2xl border p-5 sm:p-7 shadow-xl ${shellBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/30">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-500 mb-1.5 flex flex-wrap items-center gap-2">
              <Radio className="w-4 h-4" />
              <span>
                {isAr
                  ? 'التصوير الإشعاعي الصناعي بالجاما والإكس راي · ASME Sec V Art. 2'
                  : 'Industrial Gamma & X-Ray Radiography · ASME Sec V Art. 2'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr
                ? 'معمل التصوير الإشعاعي الشامل: من تجهيز الموقع والتصوير حتى قراءة الأفلام'
                : 'End-to-End Gamma & X-Ray Radiography Lab: Setup, Shooting & Film Interpretation'}
            </h2>
            <p
              className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {isAr
                ? 'حاكي دورة عمل فاحص الأشعة المعتمد (RT Level II) بالكامل: اختر نظير الجاما (Ir-192 / Se-75 / Co-60) أو أنبوبة الإكس راي، اضبط المسافة البؤرية SFD وحواجز الأمان، نفّذ لقطة التصوير والمسح الإشعاعي، حمّض الفيلم وتحقق من الكثافة وحساسية سلك IQI، ثم افحص العيوب على النيجاتوسكوب وأصدر قرار القبول أو الرفض.'
                : 'Simulate the complete RT Level II workflow: configure Gamma isotopes (Ir-192 / Se-75 / Co-60) or X-Ray tubes, verify geometric unsharpness Ug and 2 mR/hr safety perimeters, shoot & survey, process film in the darkroom, and measure weld flaws on a high-intensity LED negatoscope.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowTechniquesSimulator((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showTechniquesSimulator
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : isLight
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-amber-950/50 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                {showTechniquesSimulator
                  ? isAr
                    ? 'العودة لمعمل التصوير وقراءة الأفلام (4 مراحل)'
                    : 'Back to 4-Stage Shooting & Film Lab'
                  : isAr
                  ? 'محاكي البانوراما والإليبس والستريت التفصيلي'
                  : 'Panoramic · Elliptical · Straight Simulator'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setBlindExamMode((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                blindExamMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {blindExamMode
                  ? isAr
                    ? 'وضع الاختبار الأعمى مفعل'
                    : 'Blind Exam Mode ON'
                  : isAr
                  ? 'وضع التدريب الإرشادي'
                  : 'Guided Training Mode'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => applyRecommendedSetupForSpecimen(specimen.id)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
                  : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'ضبط قياسي تلقائي (ASME)' : 'Auto-Optimal Setup'}</span>
            </button>
          </div>
        </div>

        {!showTechniquesSimulator && (
          <>
            {/* 4-Stage Interactive Pipeline Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5">
          {stages.map((st) => {
            const isActive = activeStage === st.id;
            const stageCompleted =
              (st.id === 'setup' && ugResult.passesAsmeUg && hasBarricade && hasSurveyMeterOn) ||
              (st.id === 'exposure' && exposureState === 'retracted_safe') ||
              (st.id === 'darkroom' && filmEval.passesFilmQc) ||
              (st.id === 'interpretation' && submissionResult !== null);

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStage(st.id)}
                className={`p-3.5 rounded-xl border text-start transition cursor-pointer flex items-start justify-between gap-2 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : isLight
                    ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                    : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div
                    className={`text-[11px] font-mono font-bold tabular-nums ${
                      isActive ? 'text-slate-900' : 'text-amber-500'
                    }`}
                  >
                    STAGE {st.stepNum}
                  </div>
                  <div className="text-xs sm:text-sm font-black mt-0.5">{st.title[language]}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      isActive
                        ? 'text-slate-800'
                        : isLight
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.subtitle[language]}
                  </div>
                </div>
                {stageCompleted && (
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isActive ? 'text-slate-950' : 'text-emerald-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Weld Specimen Selector Strip (8 Industrial Specimens) */}
        <div className="mt-5 pt-4 border-t border-slate-700/30">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span>
                {isAr
                  ? 'اختر عينة اللحام المراد تصويرها وفحص فيلمها (8 عينات صناعية):'
                  : 'Select Weld Joint Specimen to Shoot & Interpret (8 Industrial Welds):'}
              </span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {specimen.materialSpec} · {specimen.weldingProcess} · t = {specimen.wallThicknessMm} mm
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {RT_WELD_SPECIMENS.map((sp, idx) => {
              const isSelected = sp.id === specimen.id;
              const shortDefect = RT_DEFECT_LABELS[sp.primaryClassification][language];
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => handleSelectSpecimen(sp.id)}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                        : 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-sm'
                      : isLight
                      ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold opacity-80 tabular-nums">
                    #{idx + 1} · {sp.weldTag.split(' · ')[0]}
                  </div>
                  <div className="text-[11px] font-bold mt-0.5 line-clamp-2 leading-snug">
                    {blindExamMode
                      ? `${sp.geometryKind === 'pipe' ? 'Pipe' : 'Plate'} ${sp.wallThicknessMm}mm`
                      : shortDefect}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
          </>
        )}
      </div>

      {showTechniquesSimulator ? (
        <RtShootingTechniquesSimulator
          language={language}
          onOpenFullRtLab={() => setShowTechniquesSimulator(false)}
        />
      ) : (
        <>

      {/* ===================================================================== */}
      {/* STAGE 1: JOB SETUP, SOURCE SELECTION, GEOMETRY & RADIATION SAFETY     */}
      {/* ===================================================================== */}
      {activeStage === 'setup' && (
        <div className={`rounded-2xl border p-5 sm:p-6 space-y-6 ${shellBg}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Radiation Source & Exposure Technique */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1A. Source Selection (Gamma Isotopes vs X-Ray Tubes) */}
              <div className={`rounded-xl border p-4 space-y-3.5 ${subCardBg}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-500" />
                    <span>
                      {isAr
                        ? '1. اختيار مصدر الإشعاع (نظائر جاما أو ماكينة إكس راي)'
                        : '1. Select Radiation Source (Gamma Isotope vs X-Ray Tube)'}
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono text-amber-500 font-bold">
                    {source.category === 'gamma' ? 'GAMMA RAY' : 'X-RAY'} · F = {source.focalSpotMm} mm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RT_SOURCES.map((src) => {
                    const isSelected = src.id === source.id;
                    const isRec = src.id === specimen.recommendedSource;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => handleSelectSource(src.id)}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-amber-50 border-amber-500 text-slate-900'
                              : 'bg-amber-500/15 border-amber-400 text-white'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="font-bold text-amber-500">{src.shortCode}</span>
                          <span className="text-slate-400 tabular-nums">
                            {src.recommendedThicknessMm[0]}–{src.recommendedThicknessMm[1]} mm
                            {isRec ? (isAr ? ' · موصى به' : ' · Optimal') : ''}
                          </span>
                        </div>
                        <div className="text-xs font-bold">{src.name[language]}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {src.energyDescription[language]}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Source Output Sliders: Activity (Ci) for Gamma OR kV + mA for X-Ray */}
                {source.category === 'gamma' ? (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="rt-activity-slider" className="font-bold">
                        {isAr
                          ? 'نشاط مصدر الجاما الحالي (Isotope Activity):'
                          : 'Isotope Source Activity (Ci):'}
                      </label>
                      <span className="font-mono font-bold text-amber-500 tabular-nums">
                        {activityCi} Ci ({(activityCi * 0.037).toFixed(2)} TBq) · {source.halfLifeLabel[language]}
                      </span>
                    </div>
                    <input
                      id="rt-activity-slider"
                      type="range"
                      min={5}
                      max={120}
                      step={1}
                      value={activityCi}
                      onChange={(e) => setActivityCi(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="rt-kv-slider" className="font-bold">
                          {isAr ? 'جهد الأنبوبة (Tube Voltage kV):' : 'Tube Voltage (kV):'}
                        </label>
                        <span className="font-mono font-bold text-cyan-500 tabular-nums">
                          {kv} kV
                        </span>
                      </div>
                      <input
                        id="rt-kv-slider"
                        type="range"
                        min={90}
                        max={300}
                        step={5}
                        value={kv}
                        onChange={(e) => setKv(Number(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="rt-ma-slider" className="font-bold">
                          {isAr ? 'تيار الفتيلة (Tube Current mA):' : 'Tube Current (mA):'}
                        </label>
                        <span className="font-mono font-bold text-cyan-500 tabular-nums">
                          {ma.toFixed(1)} mA
                        </span>
                      </div>
                      <input
                        id="rt-ma-slider"
                        type="range"
                        min={1}
                        max={10}
                        step={0.5}
                        value={ma}
                        onChange={(e) => setMa(Number(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 1B. Exposure Technique & SFD Geometry */}
              <div className={`rounded-xl border p-4 space-y-3.5 ${subCardBg}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-500" />
                    <span>
                      {isAr
                        ? '2. وضع التصوير الهندسي والمسافة البؤرية (Technique & SFD)'
                        : '2. Exposure Geometry Technique & SFD'}
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-500 font-bold tabular-nums">
                    {technique.shortCode} · {technique.wallsPenetrated}W
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RT_TECHNIQUES.map((tech) => {
                    const isSelected = tech.id === technique.id;
                    return (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => setSelectedTechniqueId(tech.id)}
                        className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-cyan-50 border-cyan-500 text-slate-900'
                              : 'bg-cyan-500/15 border-cyan-400 text-white'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{tech.name[language]}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {tech.description[language]}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SFD Slider + Geometric Unsharpness Ug Verification */}
                <div className="pt-2 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <label htmlFor="rt-sfd-slider" className="font-bold">
                      {isAr
                        ? 'المسافة من المصدر للفيلم (SFD — Source-to-Film Distance):'
                        : 'Source-to-Film Distance (SFD):'}
                    </label>
                    <span className="font-mono font-bold text-cyan-500 tabular-nums">
                      {sfdMm} mm ({(sfdMm / 25.4).toFixed(1)} in.) · Min ASME SFD:{' '}
                      {ugResult.minimumRecommendedSfdMm} mm
                    </span>
                  </div>
                  <input
                    id="rt-sfd-slider"
                    type="range"
                    min={180}
                    max={1200}
                    step={10}
                    value={sfdMm}
                    onChange={(e) => setSfdMm(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />

                  <div
                    className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 tabular-nums ${
                      ugResult.passesAsmeUg
                        ? isLight
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : isLight
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-red-950/30 border-red-500/40 text-red-300'
                    }`}
                  >
                    <div className="font-mono font-bold">
                      Ug = F·d / D = {ugResult.ugMm} mm (ASME T-274 Max: {ugResult.maxAllowedUgMm} mm)
                    </div>
                    <div className="font-bold">
                      {ugResult.passesAsmeUg
                        ? isAr
                          ? 'وضوح هندسي مطابق للكود'
                          : 'Passes ASME Ug Limit'
                        : isAr
                        ? 'تحذير: Ug مرتفع (ارفع مسافة SFD!)'
                        : 'Warning: Excessive Penumbra Blur — Increase SFD!'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Film Class, IQI & Radiation Safety Checklist */}
            <div className="lg:col-span-5 space-y-5">
              {/* Film Class & IQI Placement */}
              <div className={`rounded-xl border p-4 space-y-3.5 ${subCardBg}`}>
                <h3 className="text-sm font-black flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    {isAr
                      ? '3. اختيار الفيلم ومؤشر جودة الصورة (Film & IQI)'
                      : '3. ASTM Film Class & IQI Penetrameter'}
                  </span>
                </h3>

                <div className="space-y-2">
                  {RT_FILMS.map((fc) => {
                    const isSelected = fc.id === filmClass.id;
                    return (
                      <button
                        key={fc.id}
                        type="button"
                        onClick={() => setSelectedFilmId(fc.id)}
                        className={`w-full p-2.5 rounded-xl border text-start transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? isLight
                              ? 'bg-emerald-50 border-emerald-500 text-slate-900'
                              : 'bg-emerald-500/15 border-emerald-400 text-white'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-700'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{fc.name[language]}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {fc.code} · {fc.commercialExamples}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-500 font-bold tabular-nums">
                          ×{fc.exposureMultiplier}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* IQI Placement */}
                <div className="pt-1 space-y-1.5">
                  <div className="text-xs font-bold">
                    {isAr ? 'موضع سلك الحساسية (ASTM Wire IQI):' : 'Wire IQI Placement (ASME T-277):'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIqiPlacement('source_side')}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                        iqiPlacement === 'source_side'
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : isLight
                          ? 'bg-white text-slate-700 border-slate-200'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      {isAr ? 'جهة المصدر (Source-Side)' : 'Source-Side (Std)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIqiPlacement('film_side')}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                        iqiPlacement === 'film_side'
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : isLight
                          ? 'bg-white text-slate-700 border-slate-200'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      {isAr ? 'جهة الفيلم بحرف "F"' : 'Film-Side ("F" Marker)'}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-1 tabular-nums">
                    {isAr ? 'السلك الأساسي المطلوب رؤيته:' : 'Required Essential Wire:'}{' '}
                    <strong className="text-cyan-400">
                      ASTM {iqiSelection.setId} · Wire #{iqiSelection.essentialWireNumber} (Ø{' '}
                      {iqiSelection.essentialWireDiameterMm} mm)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Radiation Safety & Cassette Hardware Toggles */}
              <div className={`rounded-xl border p-4 space-y-3 ${subCardBg}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>
                      {isAr
                        ? '4. اشتراطات الوقاية الإشعاعية والكاسيت'
                        : '4. Radiation Safety & Cassette Hardware'}
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-amber-500 tabular-nums">
                    2 mR/hr @ {safetyResult.barricadeRadius2mRhrMeters} m
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-700/30 cursor-pointer">
                    <span>
                      {isAr
                        ? 'محدد حزمة التنجستن (4-HVL Collimator)'
                        : 'Tungsten Beam Collimator (4-HVL)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={hasCollimator}
                      onChange={(e) => setHasCollimator(e.target.checked)}
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-700/30 cursor-pointer">
                    <span>
                      {isAr
                        ? `حاجز تحذير وعلامات إشعاع عند ${safetyResult.barricadeRadius2mRhrMeters} متر`
                        : `Rope Barricade at ${safetyResult.barricadeRadius2mRhrMeters} m (2 mR/hr)`}
                    </span>
                    <input
                      type="checkbox"
                      checked={hasBarricade}
                      onChange={(e) => setHasBarricade(e.target.checked)}
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-700/30 cursor-pointer">
                    <span>
                      {isAr
                        ? 'تشغيل جهاز المسح الإشعاعي المعاير (Survey Meter)'
                        : 'Calibrated GM Survey Meter Switched ON'}
                    </span>
                    <input
                      type="checkbox"
                      checked={hasSurveyMeterOn}
                      onChange={(e) => setHasSurveyMeterOn(e.target.checked)}
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-700/30 cursor-pointer">
                    <span>
                      {isAr
                        ? 'رقائق الرصاص الأمامية والخلفية (Lead Screens 0.125mm)'
                        : 'Front & Back Lead Foil Screens (0.125 mm)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={hasLeadScreens}
                      onChange={(e) => setHasLeadScreens(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-700/30 cursor-pointer">
                    <span>
                      {isAr
                        ? 'تثبيت حرف الرصاص الخلفي "B" (فحص الأشعة المرتدة)'
                        : 'Backscatter Lead Symbol "B" on Cassette Back'}
                    </span>
                    <input
                      type="checkbox"
                      checked={hasBackscatterB}
                      onChange={(e) => setHasBackscatterB(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 1 Bottom Summary & Proceed CTA */}
          <div
            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${subCardBg}`}
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono tabular-nums">
              <span>
                {isAr ? 'السماكة المخترقة:' : 'Penetrated Steel:'}{' '}
                <strong className="text-cyan-400">{filmEval.penetratedSteelMm} mm</strong>
              </span>
              <span>·</span>
              <span>
                {isAr ? 'زمن التعريض الأمثل المحسوب:' : 'Calculated Exposure Time:'}{' '}
                <strong className="text-amber-400">{optimalExposureSeconds} s</strong>
              </span>
              <span>·</span>
              <span>
                {isAr ? 'نصف قطر الحاجز الآمن:' : 'Safe Perimeter:'}{' '}
                <strong className="text-emerald-400">
                  {safetyResult.barricadeRadius2mRhrMeters} m
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveStage('exposure')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
            >
              <span>
                {isAr
                  ? 'الانتقال لمنصة التعريض والتصوير الميداني'
                  : 'Proceed to Exposure & Shooting'}
              </span>
              <NextArrow className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STAGE 2: FIELD EXPOSURE, CRANK-OUT / HV BEAM & SURVEY METER           */}
      {/* ===================================================================== */}
      {activeStage === 'exposure' && (
        <div className="space-y-5">
          {/* Exposure Timer Setting Strip */}
          <div className={`rounded-2xl border p-4 sm:p-5 ${shellBg}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>
                    {isAr
                      ? 'ضبط مؤقت التعريض الإشعاعي (Exposure Time Setting):'
                      : 'Configure Radiographic Exposure Timer:'}
                  </span>
                  <span className="font-mono text-amber-500 font-black tabular-nums">
                    {targetExposureSeconds} s ({(targetExposureSeconds / 60).toFixed(2)} min)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? `الزمن المحسوب للوصول لكثافة مثالية (~2.65 H&D) هو ${optimalExposureSeconds} ثانية. يمكنك تجربة تعريض ناقص أو زائد لملاحظة تأثيره على الفيلم.`
                    : `Calculated optimal time for ~2.65 H&D density is ${optimalExposureSeconds}s. Try under- or over-exposing to observe real H&D film shifts.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={exposureState === 'exposing'}
                  onClick={() => {
                    setAutoSyncExposureTime(false);
                    setTargetExposureSeconds(Math.max(8, Math.round(optimalExposureSeconds * 0.35)));
                    handleResetExposure();
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {isAr ? 'تعريض ناقص (0.35×)' : 'Under-Expose (0.35×)'}
                </button>
                <button
                  type="button"
                  disabled={exposureState === 'exposing'}
                  onClick={() => {
                    setAutoSyncExposureTime(true);
                    setTargetExposureSeconds(optimalExposureSeconds);
                    handleResetExposure();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold cursor-pointer transition"
                >
                  {isAr
                    ? `زمن مثالي (${optimalExposureSeconds}s)`
                    : `Optimal (${optimalExposureSeconds}s)`}
                </button>
                <button
                  type="button"
                  disabled={exposureState === 'exposing'}
                  onClick={() => {
                    setAutoSyncExposureTime(false);
                    setTargetExposureSeconds(Math.min(600, Math.round(optimalExposureSeconds * 2.6)));
                    handleResetExposure();
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {isAr ? 'تعريض مفرط (2.6×)' : 'Over-Expose (2.6×)'}
                </button>

                <button
                  type="button"
                  data-testid="rt-open-ge-exposure-calculator-btn"
                  onClick={() => setShowGeExposureApp(true)}
                  className="px-3.5 py-1.5 rounded-lg border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'حاسبة GE Exposure App' : 'GE Exposure Time App'}</span>
                </button>
              </div>
            </div>

            <div className="mt-3">
              <input
                aria-label={isAr ? 'مؤقت التعريض بالثواني' : 'Exposure time seconds'}
                type="range"
                min={8}
                max={600}
                step={2}
                disabled={exposureState === 'exposing'}
                value={targetExposureSeconds}
                onChange={(e) => {
                  setAutoSyncExposureTime(false);
                  setTargetExposureSeconds(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Interactive SVG Field Exposure & Ray-Tracing Stage */}
          <RtSetupAndExposureStage
            language={language}
            source={source}
            technique={technique}
            specimen={specimen}
            sfdMm={sfdMm}
            activityCi={activityCi}
            kv={kv}
            ma={ma}
            targetExposureSeconds={targetExposureSeconds}
            elapsedExposureSeconds={elapsedExposureSeconds}
            exposureState={exposureState}
            hasCollimator={hasCollimator}
            hasBarricade={hasBarricade}
            hasSurveyMeterOn={hasSurveyMeterOn}
            hasLeadScreens={hasLeadScreens}
            hasBackscatterB={hasBackscatterB}
            iqiPlacement={iqiPlacement}
            ugResult={ugResult}
            safetyResult={safetyResult}
            iqiSelection={iqiSelection}
            onStartExposure={handleStartExposure}
            onInstantFinishExposure={handleInstantFinishExposure}
            onRetractAndSurvey={handleRetractAndSurvey}
            onResetExposure={handleResetExposure}
            onProceedToDarkroom={() => setActiveStage('darkroom')}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* STAGE 3: DARKROOM CHEMICAL PROCESSING & ASME FILM QC                  */}
      {/* ===================================================================== */}
      {activeStage === 'darkroom' && (
        <div className={`rounded-2xl border p-5 sm:p-6 space-y-6 ${shellBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/30">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-500" />
                <span>
                  {isAr
                    ? 'الغرفة المظلمة للتحميض الكيميائي ومراقبة جودة الفيلم (Darkroom & Film QC)'
                    : 'Chemical Darkroom Processing & ASME Sec V Film Quality Control'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'اضبط حرارة وزمن حوض المظهر (Developer) تحت إضاءة الأمان الحمراء، وراجع كثافة الفيلم الضوئية (H&D) ووضوح سلك الحساسية الأساسي قبل التفسير.'
                  : 'Control Developer bath temperature and immersion time under safelight conditions, then verify H&D optical density and IQI wire sensitivity.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeveloperTempC(20.0);
                setDeveloperMinutes(5.0);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5 shrink-0 ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'التحميض القياسي (20°C · 5 د)' : 'Standard Bath (20°C · 5 min)'}</span>
            </button>
          </div>

          {/* 5-Tank Darkroom Chemical Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              {
                step: '1',
                ar: 'المظهر القلوي (Developer)',
                en: 'Developer Bath',
                meta: `${developerTempC.toFixed(1)}°C · ${developerMinutes.toFixed(1)} min`,
                tone: 'text-amber-400 border-amber-500/40',
              },
              {
                step: '2',
                ar: 'حمام الإيقاف الحمضي (Stop Bath)',
                en: 'Acetic Stop Bath',
                meta: '20°C · 0.5 min',
                tone: 'text-sky-400 border-sky-500/30',
              },
              {
                step: '3',
                ar: 'المثبت (Fixer — Thiosulfate)',
                en: 'Fixer Clearing Tank',
                meta: '20°C · 8.0 min',
                tone: 'text-cyan-400 border-cyan-500/30',
              },
              {
                step: '4',
                ar: 'الغسيل المائي الجاري (Wash)',
                en: 'Running Water Wash',
                meta: '20 min archival',
                tone: 'text-teal-400 border-teal-500/30',
              },
              {
                step: '5',
                ar: 'التجفيف الحراري الخالي من الغبار',
                en: 'Dust-Free Dryer',
                meta: '45°C · Ready',
                tone: 'text-emerald-400 border-emerald-500/30',
              },
            ].map((bath) => (
              <div
                key={bath.step}
                className={`p-3 rounded-xl border ${subCardBg} ${bath.tone}`}
              >
                <div className="text-[10px] font-mono uppercase opacity-80">TANK 0{bath.step}</div>
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {isAr ? bath.ar : bath.en}
                </div>
                <div className="text-[11px] font-mono mt-1 tabular-nums">{bath.meta}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chemical Sliders */}
            <div className={`lg:col-span-5 rounded-xl border p-4 space-y-5 ${subCardBg}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="rt-dev-temp" className="font-bold flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {isAr ? 'درجة حرارة المظهر (Developer Temp):' : 'Developer Temperature:'}
                    </span>
                  </label>
                  <span className="font-mono font-bold text-amber-500 tabular-nums">
                    {developerTempC.toFixed(1)} °C
                  </span>
                </div>
                <input
                  id="rt-dev-temp"
                  type="range"
                  min={16}
                  max={26}
                  step={0.5}
                  value={developerTempC}
                  onChange={(e) => setDeveloperTempC(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="text-[11px] text-slate-400">
                  {isAr
                    ? 'الحرارة القياسية 20°C. رفع الحرارة فوق 23°C يزيد الضباب الكيميائي (Chemical Fog) وحجم الحبيبات.'
                    : 'Nominal is 20°C (68°F). Excess heat above 23°C elevates chemical fog and grain clumping.'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="rt-dev-time" className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                    <span>
                      {isAr ? 'زمن الغمر في المظهر (Development Time):' : 'Development Time:'}
                    </span>
                  </label>
                  <span className="font-mono font-bold text-cyan-500 tabular-nums">
                    {developerMinutes.toFixed(1)} min
                  </span>
                </div>
                <input
                  id="rt-dev-time"
                  type="range"
                  min={2}
                  max={8}
                  step={0.5}
                  value={developerMinutes}
                  onChange={(e) => setDeveloperMinutes(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* ASME Sec V Art. 2 Film Quality Control Scorecard */}
            <div className={`lg:col-span-7 rounded-xl border p-4 space-y-4 ${subCardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-black">
                  {isAr
                    ? 'بطاقة فحص جودة الفيلم (ASME Sec V Art. 2 T-282 / T-283)'
                    : 'ASME Sec V Art. 2 Film Quality Verification'}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    filmEval.passesFilmQc
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {filmEval.passesFilmQc
                    ? isAr
                      ? 'الفيلم مقبول فنياً للقراءة (QC PASS)'
                      : 'FILM QC PASS'
                    : isAr
                    ? 'مطلوب إعادة ضبط / تصوير (QC FAIL)'
                    : 'FILM QC FAIL (RESHOOT)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-lg border border-slate-700/30">
                  <div className="text-[11px] text-slate-400">
                    {isAr ? 'كثافة معدن اللحام (Weld H&D)' : 'Weld Metal Density'}
                  </div>
                  <div
                    className={`text-lg font-mono font-black mt-0.5 ${
                      filmEval.passesAsmeDensity ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {filmEval.weldMetalDensity.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    ASME: {source.minAllowedDensityAsme.toFixed(1)} – 4.00
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-700/30">
                  <div className="text-[11px] text-slate-400">
                    {isAr ? 'كثافة معدن الأساس (Base H&D)' : 'Base Metal Density'}
                  </div>
                  <div className="text-lg font-mono font-black text-cyan-400 mt-0.5">
                    {filmEval.baseMetalDensity.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Fog: {filmEval.chemicalFogDensity.toFixed(2)} H&D
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-700/30">
                  <div className="text-[11px] text-slate-400">
                    {isAr ? 'أسلاك الحساسية المرئية (IQI)' : 'Visible IQI Wires'}
                  </div>
                  <div
                    className={`text-lg font-mono font-black mt-0.5 ${
                      filmEval.essentialWireVisible ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {filmEval.visibleWiresCount} / 6
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Wire #{iqiSelection.essentialWireNumber} (Ø{' '}
                    {iqiSelection.essentialWireDiameterMm}mm)
                  </div>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  filmEval.passesFilmQc
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                <span>{filmEval.qcSummary[language]}</span>

                {!filmEval.passesFilmQc && (
                  <button
                    type="button"
                    onClick={() => applyRecommendedSetupForSpecimen(specimen.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                  >
                    {isAr ? 'تصحيح الإعدادات تلقائياً' : 'Auto-Fix Film QC'}
                  </button>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setActiveStage('interpretation')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer inline-flex items-center gap-2"
                >
                  <span>
                    {isAr
                      ? 'تركيب الفيلم على النيجاتوسكوب وقراءة العيوب'
                      : 'Mount Film on High-Intensity Negatoscope'}
                  </span>
                  <NextArrow className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STAGE 4: COMPLETE NEGATOSCOPE FILM DEFECT READING & CODE EVALUATION   */}
      {/* ===================================================================== */}
      {activeStage === 'interpretation' && (
        <div className="space-y-6">
          {/* Interactive HTML5 Canvas LED Negatoscope */}
          <RtNegatoscopeCanvas
            language={language}
            specimen={specimen}
            technique={technique}
            filmClass={filmClass}
            sourceShortCode={source.shortCode}
            sfdMm={sfdMm}
            ugMm={ugResult.ugMm}
            iqiSelection={iqiSelection}
            iqiPlacement={iqiPlacement}
            filmEval={filmEval}
            showInstructorOverlay={showInstructorOverlay}
            onToggleInstructorOverlay={() => setShowInstructorOverlay((v) => !v)}
            onMeasuredLengthChange={handleMeasuredLengthFromCaliper}
          />

          {/* 2-Column Trainee RT Interpretation Sheet & Automated Code Grading */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column A: Trainee RT Examination Report Form */}
            <div className={`lg:col-span-7 rounded-2xl border p-5 sm:p-6 space-y-5 ${shellBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/30">
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {isAr
                      ? 'استمارة تفسير الفيلم الإشعاعي وقرار المفتش (RT Interpretation Report)'
                      : 'Radiographic Film Interpretation & Code Disposition Sheet'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr
                      ? 'قِس طول العيب بأداة المسطرة (Caliper) أعلى الفيلم، ثم حدد نوع الانقطاع وقرار الكود.'
                      : 'Measure indication length with the Caliper tool above, classify the discontinuity, and issue your code verdict.'}
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
                  {specimen.weldTag} · t = {specimen.wallThicknessMm} mm
                </span>
              </div>

              {/* 1. Defect Classification Grid */}
              <div className="space-y-2">
                <div className="text-xs font-bold">
                  {isAr
                    ? '1. تصنيف المؤشر الإشعاعي الرئيسي على الفيلم (Primary Indication):'
                    : '1. Classify Primary Radiographic Indication:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFECT_CLASSIFICATION_OPTIONS.map((cls) => {
                    const isSelected = traineeClassification === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => {
                          setTraineeClassification(cls);
                          if (cls === 'sound') {
                            setTraineeLengthMm(0);
                            setTraineeVerdict('ACCEPT');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-start transition cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                            : isLight
                            ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400'
                            : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {RT_DEFECT_LABELS[cls][language]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Measured Length & Governing Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="rt-measured-length" className="font-bold flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {isAr ? '2. طول العيب المقاس (مم):' : '2. Measured Length (mm):'}
                      </span>
                    </label>
                    {caliperMeasuredMm !== null && (
                      <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                        {isAr ? `المسطرة: ${caliperMeasuredMm} مم` : `Caliper: ${caliperMeasuredMm} mm`}
                      </span>
                    )}
                  </div>
                  <input
                    id="rt-measured-length"
                    type="number"
                    min={0}
                    max={250}
                    step={0.5}
                    value={traineeLengthMm}
                    onChange={(e) => setTraineeLengthMm(Math.max(0, Number(e.target.value)))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold tabular-nums ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="rt-governing-code" className="block text-xs font-bold">
                    {isAr ? '3. الكود الهندسي الحاكم:' : '3. Governing Acceptance Code:'}
                  </label>
                  <select
                    id="rt-governing-code"
                    value={governingCode}
                    onChange={(e) => setGoverningCode(e.target.value as RtGoverningCodeId)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${inputBg}`}
                  >
                    {GOVERNING_CODES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullLabel[language]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Final Disposition (ACCEPT vs REJECT) */}
              <div className="space-y-2">
                <div className="text-xs font-bold">
                  {isAr
                    ? '4. القرار النهائي لمفتش الأشعة (Final Weld Disposition):'
                    : '4. Inspector Final Disposition:'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTraineeVerdict('ACCEPT')}
                    className={`py-3 px-4 rounded-xl border font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                      traineeVerdict === 'ACCEPT'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : isLight
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'مقبول (ACCEPT)' : 'ACCEPT WELD'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTraineeVerdict('REJECT')}
                    className={`py-3 px-4 rounded-xl border font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                      traineeVerdict === 'REJECT'
                        ? 'bg-red-600 text-white border-red-400 shadow-md'
                        : isLight
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:border-red-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-red-500/50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isAr ? 'مرفوض — إصلاح (REJECT)' : 'REJECT (REPAIR)'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitInterpretation}
                className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Award className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'اعتماد تقرير قراءة الفيلم وتسجيل النقاط (+XP)'
                    : 'Submit RT Film Interpretation & Log XP'}
                </span>
              </button>
            </div>

            {/* Column B: Code Acceptance Reference & Graded Level III Feedback */}
            <div className={`lg:col-span-5 rounded-2xl border p-5 sm:p-6 space-y-4 ${shellBg}`}>
              {!submissionResult ? (
                <>
                  <h4 className="text-sm font-black flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>
                      {isAr
                        ? 'ملخص حدود القبول والرفض المرجعية للكود المختار'
                        : 'Quick Radiographic Code Acceptance Guide'}
                    </span>
                  </h4>

                  <div className={`rounded-xl border p-4 space-y-2.5 text-xs leading-relaxed ${subCardBg}`}>
                    <div className="font-bold text-cyan-400">
                      {GOVERNING_CODES.find((c) => c.id === governingCode)?.fullLabel[language]}
                    </div>
                    <ul className="space-y-2 text-slate-400">
                      <li>
                        ·{' '}
                        {isAr
                          ? 'العيوب المستوية (الشروخ Cracks، نقص الانصهار LOF، عدم التغلغل LOP): مرفوضة تماماً (Zero Tolerance) في ASME UW-51 و B31.3.'
                          : 'Planar flaws (Cracks, Lack of Fusion, Incomplete Penetration): Strictly unacceptable (0 mm) under ASME UW-51 & B31.3.'}
                      </li>
                      <li>
                        ·{' '}
                        {isAr
                          ? 'الشوائب الممدودة (Elongated Slag) في ASME UW-51: الحد الأقصى 6.0 مم للسماكات t ≤ 19 مم، و t/3 للسماكات من 19 إلى 57 مم.'
                          : 'Elongated Slag (ASME UW-51): Max 6.0 mm (1/4") for t ≤ 19 mm; max t/3 for 19 < t ≤ 57 mm.'}
                      </li>
                      <li>
                        ·{' '}
                        {isAr
                          ? 'شوائب التنجستن (Tungsten Inclusions): الوحيدة التي تظهر كبقع بيضاء ساطعة جداً على الفيلم لارتفاع العدد الذري (Z = 74).'
                          : 'Tungsten Inclusions: Appear uniquely BRIGHT WHITE (low optical density) due to extreme X/Gamma absorption (Z = 74).'}
                      </li>
                    </ul>
                  </div>

                  <div className={`rounded-xl border p-4 text-xs space-y-1.5 tabular-nums ${subCardBg}`}>
                    <div className="font-bold">
                      {isAr ? 'حالة الفيلم المعروض حالياً:' : 'Mounted Film Technical Status:'}
                    </div>
                    <div className="font-mono text-slate-400">
                      H&D = {filmEval.weldMetalDensity} · IQI = {filmEval.visibleWiresCount}/6 wires · Ug ={' '}
                      {ugResult.ugMm} mm
                    </div>
                    <div className="pt-1.5 border-t border-slate-700/30 text-[11px] text-amber-500 font-bold">
                      {isAr
                        ? '↓ راجع محاكاة القبول والرفض المتزامنة عبر الـ 7 أكواد العالمية أسفل الاستمارة'
                        : '↓ See live 7-code acceptance & rejection thresholds simulator directly below'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border ${
                      submissionResult.passed
                        ? 'bg-emerald-500/15 border-emerald-500/40'
                        : 'bg-red-500/15 border-red-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-black ${
                          submissionResult.passed ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {submissionResult.passed
                          ? isAr
                            ? 'اجتياز تقييم قراءة الفيلم بنجاح!'
                            : 'RT Film Interpretation Passed!'
                          : isAr
                          ? 'يحتاج مراجعة — راجع التوقيع الإشعاعي بالأسفل'
                          : 'Review Required — Check Level III Key Below'}
                      </span>
                      <span className="font-mono text-lg font-black text-amber-400 tabular-nums">
                        {submissionResult.scorePct}% · +{submissionResult.xpEarned} XP
                      </span>
                    </div>
                  </div>

                  {/* 4-Part Score Breakdown */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs tabular-nums">
                    <div className={`p-2.5 rounded-lg border ${subCardBg}`}>
                      <div className="text-slate-400">
                        {isAr ? 'جودة تحميض الفيلم (QC)' : 'Film QC (ASME V)'}
                      </div>
                      <div className="font-mono font-bold mt-0.5">
                        {submissionResult.qcPoints} / 20
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${subCardBg}`}>
                      <div className="text-slate-400">
                        {isAr ? 'دقة تصنيف العيب' : 'Flaw Classification'}
                      </div>
                      <div
                        className={`font-mono font-bold mt-0.5 ${
                          submissionResult.classificationCorrect ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {submissionResult.classificationPoints} / 35
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${subCardBg}`}>
                      <div className="text-slate-400">
                        {isAr ? 'دقة قياس الطول (Caliper)' : 'Length Sizing'}
                      </div>
                      <div className="font-mono font-bold mt-0.5">
                        {submissionResult.sizingPoints} / 20 (Δ {submissionResult.lengthErrorMm} mm)
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${subCardBg}`}>
                      <div className="text-slate-400">
                        {isAr ? 'قرار القبول/الرفض' : 'Code Verdict'}
                      </div>
                      <div
                        className={`font-mono font-bold mt-0.5 ${
                          submissionResult.verdictCorrect ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {submissionResult.verdictPoints} / 25
                      </div>
                    </div>
                  </div>

                  {/* Official Level III Ground Truth Explanation */}
                  <div className={`rounded-xl border p-4 space-y-2.5 text-xs leading-relaxed ${subCardBg}`}>
                    <div className="font-bold text-amber-400">
                      {isAr ? 'التشخيص المرجعي (ASNT Level III Key):' : 'ASNT Level III Master Key:'}
                    </div>
                    <div>
                      <span className="text-slate-400">
                        {isAr ? 'العيب الفعلي والطول الحقيقي:' : 'True Flaw & Length:'}{' '}
                      </span>
                      <strong className="font-mono">
                        {RT_DEFECT_LABELS[specimen.primaryClassification][language]} ({specimen.primaryLengthMm}{' '}
                        mm)
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">
                        {isAr ? 'حكم الكود الرسمي:' : 'Official Code Verdict:'}{' '}
                      </span>
                      <strong
                        className={`font-mono ${
                          activeCodeRule.verdict === 'ACCEPT' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {activeCodeRule.verdict} ({activeCodeRule.clause} · Max {activeCodeRule.maxAllowedMm} mm)
                      </strong>
                    </div>
                    <p className="text-slate-300">{activeCodeRule.reason[language]}</p>
                    <div className="pt-2 border-t border-slate-700/40 text-cyan-300">
                      {specimen.radiographicSignatureNote[language]}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive 7-Code Radiographic Acceptance & Rejection Simulator */}
          <RtAllCodesAcceptanceSimulator
            language={language}
            specimenWeldTag={specimen.weldTag}
            specimenWallThicknessMm={specimen.wallThicknessMm}
            traineeClassification={traineeClassification}
            traineeLengthMm={traineeLengthMm}
            activeGoverningCode={governingCode}
            blindExamMode={blindExamMode}
            hasSubmitted={submissionResult !== null}
            officialClassification={specimen.primaryClassification}
            officialLengthMm={specimen.primaryLengthMm}
            onSelectGoverningCode={(code) => setGoverningCode(code)}
            onApplyLengthToReport={(len) => {
              setTraineeLengthMm(len);
              setCaliperMeasuredMm(len);
            }}
          />

          {/* Integrated Multi-Indication Film Reading, 7-Code Matrix & Official Reporting Workbench */}
          <RtIntegratedFilmWorkbench
            language={language}
            specimen={specimen}
            source={source}
            technique={technique}
            filmClass={filmClass}
            sfdMm={sfdMm}
            activityCi={activityCi}
            kv={kv}
            ma={ma}
            hasLeadScreens={hasLeadScreens}
            hasBackscatterB={hasBackscatterB}
            iqiPlacement={iqiPlacement}
            iqiSelection={iqiSelection}
            ugResult={ugResult}
            filmEval={filmEval}
            traineeClassification={traineeClassification}
            traineeLengthMm={traineeLengthMm}
            activeGoverningCode={governingCode}
            blindExamMode={blindExamMode}
            hasSubmitted={submissionResult !== null}
            onSelectGoverningCode={(code) => setGoverningCode(code)}
          />
        </div>
      )}
        </>
      )}

      {/* GE Exposure Time Calculator Modal */}
      {showGeExposureApp && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto animate-fadeIn">
            <GeRadiographicExposureTimeApp
              language={language}
              initialSource={source.id === 'ir192' ? 'ir192' : source.id === 'se75' ? 'se75' : source.id === 'co60' ? 'co60' : 'xray_dir'}
              initialThicknessMm={specimen.wallThicknessMm}
              initialSfdCm={Math.round(sfdMm / 10)}
              onApplyTimeToLab={(secs) => {
                setTargetExposureSeconds(secs);
                setAutoSyncExposureTime(false);
                setShowGeExposureApp(false);
              }}
              onClose={() => setShowGeExposureApp(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
