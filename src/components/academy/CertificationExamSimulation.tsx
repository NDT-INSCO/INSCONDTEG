import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Flag,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  Play,
  Pause,
  Printer,
  Sparkles,
  BookOpen,
  Filter,
  Layers,
  GraduationCap,
  X,
  ExternalLink,
  Sliders,
  Check,
  Zap,
  ShieldAlert,
  Gauge,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../../types';
import {
  ExamCertificationLevel,
  ExamMethod,
  ExamMode,
  ExamDifficultyLevel,
  EXAM_DIFFICULTY_TIERS,
  ExamQuestion,
  GeneratedExam,
  ExamResultSummary,
  generateRandomizedCertificationExam,
  evaluateExamSubmission,
  getCurriculumSourceModules
} from '../../utils/curriculumExamGenerator';
import { CertificationExamD3TrendChart } from './CertificationExamD3TrendChart';
import { saveExamHistoryEntry } from '../../utils/examSimulationHistoryStore';

interface CertificationExamSimulationProps {
  language: Language;
  defaultLevel?: ExamCertificationLevel;
  defaultMethod?: ExamMethod;
  defaultDifficulty?: ExamDifficultyLevel;
  onNavigateToCurriculumModule?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
  onClose?: () => void;
}

export const CertificationExamSimulation: React.FC<CertificationExamSimulationProps> = ({
  language,
  defaultLevel = 'both',
  defaultMethod = 'all',
  defaultDifficulty = 'standard',
  onNavigateToCurriculumModule,
  onClose
}) => {
  const isAr = language === 'ar';

  // Configurator / Generation options
  const [selectedLevel, setSelectedLevel] = useState<ExamCertificationLevel>(defaultLevel);
  const [selectedMethod, setSelectedMethod] = useState<ExamMethod>(defaultMethod);
  const [selectedDifficulty, setSelectedDifficulty] = useState<ExamDifficultyLevel>(defaultDifficulty);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [examMode, setExamMode] = useState<ExamMode>('timed');
  const [customPaceSeconds, setCustomPaceSeconds] = useState<number>(0); // 0 means use difficulty tier default
  const [stage1Tab, setStage1Tab] = useState<'config' | 'analytics'>('config');

  // Simulation execution state
  const [activeExam, setActiveExam] = useState<GeneratedExam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExamActive, setIsExamActive] = useState<boolean>(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showTimeExpiredModal, setShowTimeExpiredModal] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'flagged'>('all');

  // Study mode immediate check reveal state per question index
  const [studyRevealedAnswers, setStudyRevealedAnswers] = useState<Record<number, boolean>>({});

  // Timer ref
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const totalPauseDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);

  // Curriculum source modules overview
  const availableCurriculumModules = useMemo(() => getCurriculumSourceModules(), []);

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Launch a new randomized exam
  const handleGenerateExam = () => {
    const exam = generateRandomizedCertificationExam({
      level: selectedLevel,
      method: selectedMethod,
      difficulty: selectedDifficulty,
      questionCount,
      mode: examMode,
      customSecondsPerQuestion: customPaceSeconds > 0 ? customPaceSeconds : undefined
    });

    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setStudyRevealedAnswers({});
    setRemainingSeconds(exam.timeLimitSeconds);
    setIsExamActive(true);
    setIsExamSubmitted(false);
    setIsPaused(false);
    setShowSubmitModal(false);
    setShowTimeExpiredModal(false);
    startTimeRef.current = Date.now();
    totalPauseDurationRef.current = 0;
  };

  // Timer effect
  useEffect(() => {
    if (!isExamActive || isExamSubmitted || isPaused || examMode !== 'timed') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExamActive, isExamSubmitted, isPaused, examMode]);

  // Handle Pause / Resume
  const handleTogglePause = () => {
    if (!activeExam) return;
    const tier = EXAM_DIFFICULTY_TIERS[activeExam.difficulty];
    if (!tier.allowPause && !isPaused) return; // Disallowed in strict proctored mode

    if (isPaused) {
      // Resuming
      if (pauseStartRef.current > 0) {
        totalPauseDurationRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
      setIsPaused(false);
    } else {
      // Pausing
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  };

  // Handle option select
  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (isExamSubmitted || isPaused) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx
    }));

    if (examMode === 'study') {
      setStudyRevealedAnswers((prev) => ({
        ...prev,
        [questionIdx]: true
      }));
    }
  };

  // Toggle flag on current question
  const handleToggleFlag = (questionIdx: number) => {
    if (isPaused) return;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionIdx]: !prev[questionIdx]
    }));
  };

  // Time expired auto-submission
  const handleTimeExpired = () => {
    setShowTimeExpiredModal(true);
    setTimeout(() => {
      handleFinalSubmit();
    }, 2200);
  };

  // Final submission evaluation
  const handleFinalSubmit = () => {
    if (!activeExam) return;
    setIsExamActive(false);
    setIsExamSubmitted(true);
    setIsPaused(false);
    setShowSubmitModal(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const effectiveElapsedMs = Date.now() - startTimeRef.current - totalPauseDurationRef.current;
    const timeSpent = Math.max(1, Math.round(effectiveElapsedMs / 1000));
    const flaggedList = Object.entries(flaggedQuestions)
      .filter(([_, isFlagged]) => isFlagged)
      .map(([idx]) => Number(idx));

    const result = evaluateExamSubmission(activeExam, userAnswers, timeSpent, flaggedList);

    // Save exam attempt into history store for longitudinal D3 chart tracking
    try {
      const methodScoresMap: Record<string, { pct: number; correct: number; total: number }> = {};
      Object.entries(result.methodBreakdown).forEach(([mKey, data]) => {
        methodScoresMap[mKey] = {
          pct: data.pct,
          correct: data.correct,
          total: data.total
        };
      });

      saveExamHistoryEntry({
        examId: activeExam.examId,
        overallScorePct: result.scorePct,
        isPassed: result.isPassed,
        timeSpentSeconds: result.timeSpentSeconds,
        level: activeExam.targetLevel,
        difficulty: activeExam.difficulty,
        methodScores: methodScoresMap
      });
    } catch {
      // Safe fallback if localStorage is disabled
    }

    if (result.isPassed) {
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {
        // Safe fallback in test environments
      }
    }
  };

  // Compute live result summary when submitted
  const examResults: ExamResultSummary | null = useMemo(() => {
    if (!isExamSubmitted || !activeExam) return null;
    const effectiveElapsedMs = Date.now() - startTimeRef.current - totalPauseDurationRef.current;
    const timeSpent = Math.max(1, Math.round(effectiveElapsedMs / 1000));
    const flaggedList = Object.entries(flaggedQuestions)
      .filter(([_, isFlagged]) => isFlagged)
      .map(([idx]) => Number(idx));
    return evaluateExamSubmission(activeExam, userAnswers, timeSpent, flaggedList);
  }, [isExamSubmitted, activeExam, userAnswers, flaggedQuestions]);

  // Current question helper
  const currentQ: ExamQuestion | undefined = activeExam?.questions[currentQuestionIndex];

  // Answered count & Pacing telemetry
  const answeredCount = Object.keys(userAnswers).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const totalQuestions = activeExam?.questions.length || 0;
  const unansweredRemaining = Math.max(1, totalQuestions - answeredCount);

  // Live average seconds available per remaining unanswered question
  const pacingSecsPerRemainingQuestion = remainingSeconds > 0
    ? Math.round(remainingSeconds / unansweredRemaining)
    : 0;

  // Time progress percentage (for warning color transition)
  const initialTotalSeconds = activeExam?.timeLimitSeconds || 1;
  const timeFractionRemaining = remainingSeconds / initialTotalSeconds;

  // Selected difficulty configuration object
  const currentDifficultyTier = EXAM_DIFFICULTY_TIERS[selectedDifficulty];
  const effectivePaceSecs = customPaceSeconds > 0 ? customPaceSeconds : currentDifficultyTier.secondsPerQuestion;
  const calculatedTotalMinutes = Math.round((questionCount * effectivePaceSecs) / 60);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="certification-exam-simulation-container"
      className="w-full space-y-6 text-slate-900 dark:text-slate-100"
    >
      {/* -------------------------------------------------------------------
          TOP HEADER STRIP
      ------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'أكاديمية إنسكو الهندسية' : 'INSCO Engineering Academy'}</span>
            <span aria-hidden="true">·</span>
            <span>{isAr ? 'محاكي امتحانات التأهيل الدولي' : 'NDT Certification Exam Simulation'}</span>
            <span aria-hidden="true">·</span>
            <span>ASNT SNT-TC-1A / ISO 9712</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr
              ? 'محاكي امتحانات التأهيل لشهادات NDT المستوى الأول والثاني'
              : 'NDT Level 1 & Level 2 Certification Exam Simulation'}
          </h2>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label={isAr ? 'إغلاق المحاكي' : 'Close Simulator'}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ===================================================================
          STAGE 1: EXAM CONFIGURATOR & D3 TREND ANALYTICS
      =================================================================== */}
      {!isExamActive && !isExamSubmitted && (
        <div className="space-y-6">
          {/* Stage 1 Segmented View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="stage1-tab-config"
                onClick={() => setStage1Tab('config')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  stage1Tab === 'config'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعداد وتوليد الاختبار' : 'Exam Configurator'}</span>
              </button>
              <button
                type="button"
                data-testid="stage1-tab-analytics"
                onClick={() => setStage1Tab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  stage1Tab === 'analytics'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isAr ? 'منحنيات الأداء والرادار (D3.js)' : 'Performance Trends & Radar (D3.js)'}</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 hidden sm:inline-block">
              {stage1Tab === 'config'
                ? (isAr ? 'تخصيص المعايير وتحديد سرعة المؤقت' : 'Customize test parameters & countdown pace')
                : (isAr ? 'تحليل تقدم الدرجات ومعدلات إتقان الطرق' : 'Longitudinal competency trajectory')}
            </span>
          </div>

          {stage1Tab === 'config' ? (
            <>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold uppercase tracking-wider">
                    {isAr ? 'توليد ديناميكي عشوائي مع مؤقت زمني واقعي' : 'Dynamic Randomized Curriculum Generation with Real-World Timer'}
                  </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {isAr
                  ? 'قم بإعداد وتوليد اختبار تأهيلي معتمد محاكى لظروف الامتحان الحقيقي'
                  : 'Configure and Generate Your Realistic NDT Certification Exam'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-3xl">
                {isAr
                  ? 'يقوم هذا المحاكي بسحب الأسئلة ديناميكياً من المنهج المعتمد ومصفوفات الأكواد العالمية (ASME Sec V, ASME VIII Div 1 UW-51, ASME B31.3, API 1104, AWS D1.1). تتيح ميزة المؤقت التنازلي القابل للضبط وفق درجة الصعوبة محاكاة ظروف مراكز الاختبارات الدولية بدقة عالية.'
                  : 'This simulator dynamically pulls from INSCO’s accredited curriculum and international code matrices. The configurable countdown timer accurately simulates real-world test-center pacing conditions across multiple difficulty tiers.'}
              </p>
            </div>

            {/* Curriculum Data Feed Proof Strip */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  {isAr ? 'مصادر بيانات المنهج المتصلة حالياً:' : 'Active Curriculum Data Feed Sources:'}
                </span>
                <span>{availableCurriculumModules.length} {isAr ? 'وحدة تعليمية' : 'Study modules'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
                  Level 1 (VT-1, PT-1, MT-1, UT-1, RT-1)
                </span>
                <span className="px-3 py-1 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-medium">
                  Level 2 (Flaw Sizing, DAC/TCG Curves, RT Darkroom)
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium">
                  Codes (ASME Sec V / VIII, API 1104, AWS D1.1)
                </span>
                <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium">
                  Duties & Written Practice Scope
                </span>
              </div>
            </div>

            {/* Core Exam Selectors (Level, Method, Question Count, Mode) */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Level Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? '1. مستوى الشهادة المستهدف:' : '1. Target Certification Level:'}
                </label>
                <select
                  data-testid="select-exam-level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as ExamCertificationLevel)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="both">{isAr ? 'المستوى 1 و 2 الشامل (Levels 1 & 2 Composite)' : 'Comprehensive (Levels 1 & 2)'}</option>
                  <option value="level1">{isAr ? 'المستوى الأول (Level 1 Technician)' : 'Level 1 (Technician / Operator)'}</option>
                  <option value="level2">{isAr ? 'المستوى الثاني (Level 2 Inspector / Evaluator)' : 'Level 2 (Certified Inspector)'}</option>
                </select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {selectedLevel === 'level1'
                    ? (isAr ? 'المبادئ الفيزيائية، المعايرة، وحدود الصلاحيات' : 'Physics, calibration, instrument setup')
                    : selectedLevel === 'level2'
                    ? (isAr ? 'تحديد أحجام العيوب وتطبيق أكواد ASME/API/AWS' : 'Flaw sizing, DAC curves, code acceptance')
                    : (isAr ? 'اختبار مركب شامل للمستويين معاً' : 'Full composite examination covering both stages')}
                </span>
              </div>

              {/* Method Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? '2. طريقة الفحص (NDT Method):' : '2. Inspection Method:'}
                </label>
                <select
                  data-testid="select-exam-method"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as ExamMethod)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">{isAr ? 'كافة الطرق التقليدية (UT, RT, MT, PT, VT)' : 'All Conventional Methods (Composite)'}</option>
                  <option value="UT">UT - Ultrasonic Testing</option>
                  <option value="RT">RT - Radiographic Testing</option>
                  <option value="MT">MT - Magnetic Particle Testing</option>
                  <option value="PT">PT - Liquid Penetrant Testing</option>
                  <option value="VT">VT - Visual Testing</option>
                </select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {selectedMethod === 'all'
                    ? (isAr ? 'أسئلة متنوعة تغطي الطرق الخمس الكلاسيكية' : 'Cross-method exam across all 5 techniques')
                    : (isAr ? `تركيز مكثف على تخصص ${selectedMethod}` : `Dedicated ${selectedMethod} method qualification test`)}
                </span>
              </div>

              {/* Question Count Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? '3. عدد الأسئلة العشوائية:' : '3. Question Count:'}
                </label>
                <select
                  data-testid="select-question-count"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value={10}>10 {isAr ? 'أسئلة (اختبار سريع)' : 'Questions (Express)'}</option>
                  <option value={20}>20 {isAr ? 'سؤالاً (اختبار معياري)' : 'Questions (Standard)'}</option>
                  <option value={30}>30 {isAr ? 'سؤالاً (اختبار مكثف)' : 'Questions (Intensive)'}</option>
                  <option value={40}>40 {isAr ? 'سؤالاً (تدريب مطوّل)' : 'Questions (extended practice)'}</option>
                </select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {isAr ? `${questionCount} سؤالاً عشوائياً بدون تكرار` : `${questionCount} non-repeating randomized questions`}
                </span>
              </div>

              {/* Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? '4. نظام إجراء الاختبار:' : '4. Examination Mode:'}
                </label>
                <select
                  data-testid="select-exam-mode"
                  value={examMode}
                  onChange={(e) => setExamMode(e.target.value as ExamMode)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="timed">{isAr ? 'وضع الامتحان المؤقت (Timed Proctored Exam)' : 'Timed Examination (Proctored Conditions)'}</option>
                  <option value="study">{isAr ? 'وضع التدريب التفاعلي (Study & Practice Mode)' : 'Interactive Study Mode (Instant Feedback)'}</option>
                </select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {examMode === 'timed'
                    ? (isAr ? 'مؤقت تنازلي حقيقي مع تقييم نهائي بعد التسليم' : 'Countdown timer with final scorecard at end')
                    : (isAr ? 'كشف الشرح الكودي فور اختيار كل إجابة' : 'Immediate clause explanation after each click')}
                </span>
              </div>
            </div>

            {/* -----------------------------------------------------------------
                DIFFICULTY LEVEL & REAL-WORLD COUNTDOWN TIMER CONFIGURATOR
            ----------------------------------------------------------------- */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'درجة صعوبة وتوقيت الاختبار التنازلي (Difficulty & Real-World Pace):' : 'Countdown Timer Difficulty Level & Pacing:'}</span>
                </label>

                {examMode === 'timed' && (
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    <span>{isAr ? 'إجمالي زمن الاختبار المقدر:' : 'Total Calculated Exam Duration:'}</span>{' '}
                    <strong data-testid="calculated-exam-duration" className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {calculatedTotalMinutes} {isAr ? 'دقيقة' : 'Minutes'} ({questionCount * effectivePaceSecs}s)
                    </strong>
                  </div>
                )}
              </div>

              {/* Difficulty Tiers Selector Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(EXAM_DIFFICULTY_TIERS) as ExamDifficultyLevel[]).map((tierKey) => {
                  const tier = EXAM_DIFFICULTY_TIERS[tierKey];
                  const isSelected = selectedDifficulty === tierKey;

                  return (
                    <button
                      key={tierKey}
                      type="button"
                      data-testid={`difficulty-tier-${tierKey}`}
                      onClick={() => setSelectedDifficulty(tierKey)}
                      className={`text-start p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {isAr ? tier.nameAr : tier.nameEn}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            {tier.secondsPerQuestion}s/Q
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          {isAr ? tier.descriptionAr : tier.descriptionEn}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400">
                        <span>
                          {tier.allowPause ? (isAr ? '✓ إيقاف مؤقت متاح' : '✓ Pause Permitted') : (isAr ? '✗ إيقاف مقفل (مشدد)' : '✗ Continuous Proctored')}
                        </span>
                        <span className="font-mono">
                          {Math.round((questionCount * tier.secondsPerQuestion) / 60)} {isAr ? 'دقيقة' : 'min'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Pace Override Option */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'تخصيص ثواني السؤال يدوياً (اختياري):' : 'Custom Pace Override (Optional):'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    data-testid="select-custom-pace"
                    value={customPaceSeconds}
                    onChange={(e) => setCustomPaceSeconds(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value={0}>{isAr ? 'الافتراضي حسب درجة الصعوبة' : 'Default by Difficulty Tier'}</option>
                    <option value={30}>30s/Q - Ultra-Speed Sprint</option>
                    <option value={45}>45s/Q - Fast-Paced</option>
                    <option value={60}>60s/Q - 1 Minute Proctored</option>
                    <option value={75}>75s/Q - Prometric Standard</option>
                    <option value={90}>90s/Q - 1.5 Minutes ASNT</option>
                    <option value={120}>120s/Q - 2 Minutes Training</option>
                    <option value={150}>150s/Q - 2.5 Minutes Deep Study</option>
                  </select>
                  {customPaceSeconds > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomPaceSeconds(0)}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {isAr ? 'إعادة ضبط' : 'Reset'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Launch CTA Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>{isAr ? 'نسبة النجاح المقررة:' : 'Passing Threshold:'}</span>{' '}
                <strong className="text-amber-600 dark:text-amber-400 font-mono">
                  {selectedLevel === 'level2' || selectedLevel === 'both' ? '80%' : '70%'}
                </strong>{' '}
                <span>({isAr ? 'وفق توصيات ASNT SNT-TC-1A' : 'per ASNT SNT-TC-1A guidelines'})</span>
              </div>

              <button
                data-testid="generate-exam-btn"
                onClick={handleGenerateExam}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isAr ? 'توليد وبدء الامتحان العشوائي الآن' : 'Generate & Start Randomized Exam'}</span>
              </button>
            </div>
          </div>

          {/* D3 Longitudinal Progress & Performance Trend Chart */}
          <CertificationExamD3TrendChart language={language} />
        </>
      ) : (
        /* Standalone D3 Analytics & Radar View */
        <CertificationExamD3TrendChart language={language} />
      )}
    </div>
  )}

      {/* ===================================================================
          STAGE 2: ACTIVE EXAMINATION SIMULATOR WITH COUNTDOWN TIMER
      =================================================================== */}
      {isExamActive && !isExamSubmitted && currentQ && (
        <div className="space-y-6">
          {/* Top Examination HUD with Configured Countdown Timer */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {currentQ.level === 'level1' ? 'NDT LEVEL I' : 'NDT LEVEL II'} • {currentQ.method}
              </span>

              {/* Difficulty badge */}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {EXAM_DIFFICULTY_TIERS[activeExam?.difficulty || 'standard'].nameEn}
              </span>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>{isAr ? 'السؤال' : 'Question'}</span>{' '}
                <strong data-testid="question-progress" className="text-slate-900 dark:text-white font-mono tabular-nums">
                  {currentQuestionIndex + 1} / {activeExam?.questions.length}
                </strong>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>{isAr ? 'المُجاب عنه:' : 'Answered:'}</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {answeredCount} / {activeExam?.questions.length}
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Dynamic Countdown Timer Display */}
              {examMode === 'timed' && (
                <div className="flex items-center gap-2">
                  <div
                    data-testid="exam-timer"
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums transition-all ${
                      remainingSeconds <= 60
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500 animate-pulse ring-2 ring-red-500/40'
                        : remainingSeconds <= 300 || timeFractionRemaining <= 0.25
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(remainingSeconds)}</span>
                  </div>

                  {/* Dynamic Pacing Coach Telemetry */}
                  <span
                    data-testid="pacing-coach-indicator"
                    className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline-block tabular-nums"
                  >
                    ~{pacingSecsPerRemainingQuestion}s {isAr ? 'لكل سؤال شاغر' : 'avg/remaining'}
                  </span>
                </div>
              )}

              {/* Pause / Resume Button or Locked Indicator */}
              {examMode === 'timed' && (
                <div>
                  {activeExam && EXAM_DIFFICULTY_TIERS[activeExam.difficulty].allowPause ? (
                    <button
                      type="button"
                      data-testid="pause-exam-btn"
                      onClick={handleTogglePause}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                        isPaused
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-amber-500'
                      }`}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? (isAr ? 'استئناف' : 'Resume') : (isAr ? 'إيقاف مؤقت' : 'Pause')}</span>
                    </button>
                  ) : (
                    <span
                      data-testid="pause-disabled-badge"
                      title={isAr ? 'الإيقاف المؤقت محظور في وضع الاختبار المشدد لمحاكاة شروط برومتريك الرسمية' : 'Pause is disabled under strict proctored testing rules'}
                      className="text-[11px] font-mono text-slate-400 border border-slate-300 dark:border-slate-800 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950"
                    >
                      🔒 {isAr ? 'مراقب مشدد' : 'Strict Proctored'}
                    </span>
                  )}
                </div>
              )}

              {/* Flag button */}
              <button
                data-testid="flag-question-btn"
                onClick={() => handleToggleFlag(currentQuestionIndex)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                  flaggedQuestions[currentQuestionIndex]
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-amber-500'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[currentQuestionIndex] ? (isAr ? 'مُعلّم للمراجعة' : 'Flagged') : (isAr ? 'تعليم للمراجعة' : 'Flag')}</span>
              </button>

              {/* Submit Button */}
              <button
                data-testid="submit-exam-btn"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow"
              >
                {isAr ? 'إنهاء وتسليم الاختبار' : 'Submit Exam'}
              </button>
            </div>
          </div>

          {/* Critical Timer Alert Banner when < 60s */}
          {examMode === 'timed' && remainingSeconds <= 60 && remainingSeconds > 0 && (
            <div
              data-testid="timer-critical-alert"
              className="p-3 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-2 animate-pulse"
            >
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'تنبيه زمني حرج: يتبقى أقل من 60 ثانية! سيتم تسليم ورقة الإجابة تلقائياً عند انتهاء الوقت.'
                    : 'Critical Time Alert: Under 60 seconds remaining! Exam paper will auto-submit upon timer expiration.'}
                </span>
              </div>
              <span className="font-mono font-black tabular-nums">{remainingSeconds}s</span>
            </div>
          )}

          {/* Paused Veil (Preserves exam integrity while stepped away) */}
          {isPaused ? (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 p-12 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                <Pause className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isAr ? 'الاختبار متوقف مؤقتاً' : 'Examination Paused'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {isAr
                  ? 'تم حجب الأسئلة مؤقتاً للحفاظ على نزاهة جلسة الاختبار. انقر على استئناف لمتابعة الإجابة.'
                  : 'Questions are concealed while paused to preserve exam integrity. Click resume to continue.'}
              </p>
              <button
                data-testid="resume-exam-btn"
                onClick={handleTogglePause}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow"
              >
                {isAr ? 'استئناف الاختبار الآن' : 'Resume Examination Now'}
              </button>
            </div>
          ) : (
            <>
              {/* Question Navigation Matrix */}
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
                  <span>{isAr ? 'مصفوفة الأسئلة والتنقل السريع:' : 'Question Navigation Grid:'}</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                      {isAr ? 'مُجاب' : 'Answered'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-amber-500" />
                      {isAr ? 'مُعلّم' : 'Flagged'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-slate-300 dark:bg-slate-700" />
                      {isAr ? 'شاغر' : 'Unanswered'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeExam?.questions.map((_, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = userAnswers[idx] !== undefined;
                    const isFlagged = flaggedQuestions[idx];

                    let btnClass = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
                    if (isCurrent) {
                      btnClass = 'ring-2 ring-amber-500 bg-amber-500 text-slate-950 font-black border-amber-500';
                    } else if (isFlagged) {
                      btnClass = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 font-bold';
                    } else if (isAnswered) {
                      btnClass = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        data-testid={`jump-question-${idx}`}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-8 h-8 rounded-lg text-xs font-mono transition border cursor-pointer flex items-center justify-center relative ${btnClass}`}
                      >
                        {idx + 1}
                        {isFlagged && !isCurrent && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Question Display Card */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
                {/* Question Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span>{isAr ? currentQ.sourceModuleName.ar : currentQ.sourceModuleName.en}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">{currentQ.codeReference}</span>
                  </div>
                  <span className="capitalize">{currentQ.category.replace('_', ' ')}</span>
                </div>

                {/* Question Statement */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
                    {isAr ? currentQ.question.ar : currentQ.question.en}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                    {isAr ? currentQ.question.en : currentQ.question.ar}
                  </p>
                </div>

                {/* Options Choices */}
                <div className="space-y-3 pt-2">
                  {(isAr ? currentQ.options.ar : currentQ.options.en).map((optText, optIdx) => {
                    const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                    const isStudyRevealed = examMode === 'study' && studyRevealedAnswers[currentQuestionIndex];
                    const isCorrect = optIdx === currentQ.correctIndex;

                    let optClass = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500/50';

                    if (isStudyRevealed) {
                      if (isCorrect) {
                        optClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                      } else if (isSelected && !isCorrect) {
                        optClass = 'bg-red-500/10 border-red-500 text-red-800 dark:text-red-200';
                      }
                    } else if (isSelected) {
                      optClass = 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold shadow-sm';
                    }

                    return (
                      <button
                        key={optIdx}
                        data-testid={`option-choice-${optIdx}`}
                        onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                        className={`w-full text-start p-4 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${optClass}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-xs sm:text-sm leading-relaxed">{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* In Study Mode: Explanation Callout */}
                {examMode === 'study' && studyRevealedAnswers[currentQuestionIndex] && (
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-2 text-xs text-sky-900 dark:text-sky-200 animate-fadeIn">
                    <div className="font-bold flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                      <BookOpen className="w-4 h-4 text-sky-500" />
                      <span>{isAr ? 'الشرح والفقرة الكودية المرجعية:' : 'Code Explanation & Reference:'}</span>
                    </div>
                    <p className="leading-relaxed">
                      {isAr ? currentQ.explanation.ar : currentQ.explanation.en}
                    </p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {isAr ? 'الكود المعتمد:' : 'Governing Code:'} {currentQ.codeReference}
                    </div>
                  </div>
                )}

                {/* Footer Navigation Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    data-testid="prev-question-btn"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isAr ? 'السؤال السابق' : 'Previous Question'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < (activeExam?.questions.length || 0) - 1 ? (
                      <button
                        data-testid="next-question-btn"
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:white text-white dark:text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <span>{isAr ? 'السؤال التالي' : 'Next Question'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        data-testid="finalize-review-btn"
                        onClick={() => setShowSubmitModal(true)}
                        className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <span>{isAr ? 'مراجعة وتسليم الاختبار' : 'Review & Submit'}</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Time Expired Notification Modal */}
      {showTimeExpiredModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-red-500/50 bg-white dark:bg-slate-900 p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto animate-bounce">
              <Clock className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">
              {isAr ? 'انتهى الوقت المحدد للاختبار!' : 'Time Has Expired!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAr
                ? 'وصل العداد التنازلي إلى الصفر. جاري اعتماد وحفظ إجاباتك المسجلة تلقائياً والانتقال إلى بطاقة النتائج...'
                : 'The exam countdown has reached zero. Your answers are being automatically submitted to generate your official scorecard...'}
            </p>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? 'تأكيد تسليم أوراق الاختبار' : 'Confirm Exam Submission'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'يرجى مراجعة ملخص الإجابات قبل إنهاء الجلسة واحتساب النتيجة النهائية.'
                  : 'Please check your answering summary before finalizing your exam scorecard.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'إجمالي الأسئلة:' : 'Total Questions:'}</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{activeExam?.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 dark:text-emerald-400">{isAr ? 'الأسئلة المُجاب عنها:' : 'Answered:'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الأسئلة الشاغرة:' : 'Unanswered:'}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {(activeExam?.questions.length || 0) - answeredCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-600 dark:text-amber-400">{isAr ? 'الأسئلة المُعلّمة للمراجعة:' : 'Flagged for Review:'}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{flaggedCount}</span>
              </div>
              {examMode === 'timed' && (
                <div className="flex justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-slate-500">{isAr ? 'الوقت المتبقي في العداد:' : 'Remaining Time:'}</span>
                  <span className="font-bold font-mono text-sky-600 dark:text-sky-400">{formatTime(remainingSeconds)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isAr ? 'العودة للمراجعة' : 'Return to Exam'}
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow"
              >
                {isAr ? 'تأكيد التسليم' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          STAGE 3: COMPREHENSIVE SCORECARD & PACING DIAGNOSTICS
      =================================================================== */}
      {isExamSubmitted && examResults && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Score Hero Card */}
          <div
            data-testid="exam-scorecard-hero"
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'التقرير الفني لاختبار التأهيل' : 'Qualification Examination Scorecard'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">{activeExam?.examId}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {EXAM_DIFFICULTY_TIERS[examResults.difficulty].nameEn}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {examResults.isPassed
                    ? (isAr ? 'مبروك! لقد اجتزت اختبار التأهيل بنجاح' : 'Congratulations! You Have Passed the Qualification Exam')
                    : (isAr ? 'لم يتم بلوغ نسبة النجاح المطلوبة - يُوصى بمراجعة المنهج' : 'Passing Threshold Not Reached - Syllabus Review Recommended')}
                </h3>
              </div>

              {/* Pass/Fail Status Banner */}
              <div
                data-testid="exam-pass-status-badge"
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border ${
                  examResults.isPassed
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                }`}
              >
                {examResults.isPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>
                  {examResults.isPassed
                    ? (isAr ? 'ناجح - مؤهل معتمد (PASSED)' : 'PASSED - QUALIFIED')
                    : (isAr ? 'راسب - إعادة الاختبار (RETAKE REQUIRED)' : 'RETAKE REQUIRED')}
                </span>
              </div>
            </div>

            {/* Metrics Strip with Time Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">
                  {isAr ? 'الدرجة النهائية' : 'Overall Score'}
                </span>
                <div data-testid="exam-final-score-pct" className="text-3xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
                  {examResults.scorePct}%
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {isAr ? 'الحد الأدنى للنجاح:' : 'Pass cutoff:'} {examResults.passingThresholdPct}%
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">
                  {isAr ? 'الإجابات الصحيحة' : 'Correct Answers'}
                </span>
                <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {examResults.correctCount} / {examResults.totalQuestions}
                </div>
                <span className="text-[11px] text-emerald-600/80 block mt-1">
                  {Math.round((examResults.correctCount / examResults.totalQuestions) * 100)}% {isAr ? 'دقة' : 'Accuracy'}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">
                  {isAr ? 'الإجابات الخاطئة / الشاغرة' : 'Incorrect / Unanswered'}
                </span>
                <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {examResults.incorrectCount + examResults.unansweredCount}
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {examResults.incorrectCount} {isAr ? 'خطأ' : 'missed'} · {examResults.unansweredCount} {isAr ? 'شاغر' : 'blank'}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">
                  {isAr ? 'الزمن المستهلك' : 'Time Elapsed'}
                </span>
                <div data-testid="exam-elapsed-time" className="text-3xl font-black font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                  {formatTime(examResults.timeSpentSeconds)}
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {isAr ? 'المخصص:' : 'Allocated:'} {formatTime(examResults.allocatedTimeSeconds)} · ~{examResults.averageSecondsPerQuestion}s/Q
                </span>
              </div>
            </div>

            {/* Real-World Exam Pacing Evaluation Card */}
            <div
              data-testid="pacing-evaluation-card"
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? 'تقييم إدارة الوقت وسرعة الحل:' : 'Real-World Time & Pacing Evaluation:'}
                  </span>
                </div>
                <span
                  data-testid="pacing-grade-label"
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${
                    examResults.pacingEvaluation.grade === 'optimal'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : examResults.pacingEvaluation.grade === 'rushed'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-red-500/15 text-red-700 dark:text-red-300'
                  }`}
                >
                  {isAr ? examResults.pacingEvaluation.labelAr : examResults.pacingEvaluation.labelEn}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAr ? examResults.pacingEvaluation.feedbackAr : examResults.pacingEvaluation.feedbackEn}
              </p>
            </div>

            {/* Diagnostic Breakdown by Method & Level */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              {/* Method Breakdown */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'تحليل الأداء حسب طريقة الفحص (Method Breakdown):' : 'Performance by NDT Method:'}
                </span>

                <div className="space-y-2">
                  {Object.entries(examResults.methodBreakdown).map(([methodName, data]) => (
                    <div key={methodName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{methodName}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {data.correct}/{data.total} ({data.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            data.pct >= 80 ? 'bg-emerald-500' : data.pct >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Breakdown */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'تحليل الأداء حسب مستوى التأهيل (Level Breakdown):' : 'Performance by Certification Level:'}
                </span>

                <div className="space-y-2">
                  {Object.entries(examResults.levelBreakdown).map(([lvlName, data]) => (
                    <div key={lvlName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{lvlName}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {data.correct}/{data.total} ({data.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            data.pct >= 80 ? 'bg-emerald-500' : data.pct >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                data-testid="back-to-config-btn"
                onClick={() => {
                  setIsExamSubmitted(false);
                  setIsExamActive(false);
                  setActiveExam(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isAr ? 'تعديل المعايير والبدء من جديد' : 'Change Parameters'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  data-testid="print-exam-report-btn"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة تقرير النتيجة' : 'Print Scorecard'}</span>
                </button>

                <button
                  data-testid="retake-new-exam-btn"
                  onClick={handleGenerateExam}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'توليد اختبار عشوائي جديد' : 'Generate New Test'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time D3 Progress & Trend Trajectory */}
          <CertificationExamD3TrendChart language={language} />

          {/* Curriculum Recommendations Section */}
          {examResults.recommendedModules.length > 0 && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <GraduationCap className="w-4 h-4" />
                <span>{isAr ? 'خطة المراجعة المنهجية المقترحة بناءً على إجاباتك:' : 'Curriculum Study Recommendations Based on Your Results:'}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {examResults.recommendedModules.map((rec) => (
                  <div
                    key={rec.moduleId}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {isAr ? rec.nameAr : rec.nameEn}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? rec.reasonAr : rec.reasonEn}
                      </p>
                    </div>

                    {onNavigateToCurriculumModule && (
                      <button
                        onClick={() => onNavigateToCurriculumModule('conventional_ndt', 0, rec.moduleId)}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold pt-1 cursor-pointer self-start"
                      >
                        <span>{isAr ? 'فتح الوحدة في المنهج ←' : 'Open Module in Curriculum →'}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question-by-Question Detailed Review Sheet */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? 'المراجعة التفصيلية لإجابات الاختبار والبنود الكودية' : 'Question-by-Question Review with Code References'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? 'تحقق من كل سؤال مع التفسير العلمي والاستناد للفقرة القانونية في أكواد ASME و API و AWS و ISO.'
                    : 'Audit each response with clause citations across ASME, API, AWS, and ISO standard codes.'}
                </p>
              </div>

              {/* Review Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'كافة الأسئلة' : 'All Questions'}
                </button>
                <button
                  onClick={() => setReviewFilter('incorrect')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reviewFilter === 'incorrect'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'الإجابات الخاطئة فقط' : 'Incorrect Only'}
                </button>
                <button
                  onClick={() => setReviewFilter('flagged')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reviewFilter === 'flagged'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'المُعلّمة فقط' : 'Flagged Only'}
                </button>
              </div>
            </div>

            {/* Questions Review List */}
            <div className="space-y-4">
              {activeExam?.questions.map((q, idx) => {
                const userChoice = userAnswers[idx];
                const isCorrect = userChoice === q.correctIndex;
                const isFlagged = flaggedQuestions[idx];

                if (reviewFilter === 'incorrect' && isCorrect) return null;
                if (reviewFilter === 'flagged' && !isFlagged) return null;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border space-y-3 transition ${
                      isCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {q.method} · {q.level === 'level1' ? 'L1' : 'L2'}
                        </span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[11px]">
                          {q.codeReference}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFlagged && (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {isAr ? 'مُعلّم' : 'Flagged'}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold flex items-center gap-1 ${
                            isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          <span>
                            {isCorrect
                              ? (isAr ? 'إجابة صحيحة' : 'Correct')
                              : userChoice === undefined
                              ? (isAr ? 'شاغر لم تتم الإجابة' : 'Unanswered')
                              : (isAr ? 'إجابة خاطئة' : 'Incorrect')}
                          </span>
                        </span>
                      </div>
                    </div>

                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {isAr ? q.question.ar : q.question.en}
                    </h5>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      {(isAr ? q.options.ar : q.options.en).map((opt, oIdx) => {
                        const isUserPicked = userChoice === oIdx;
                        const isAnswer = oIdx === q.correctIndex;

                        let borderStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                        if (isAnswer) {
                          borderStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold';
                        } else if (isUserPicked && !isAnswer) {
                          borderStyle = 'border-red-500 bg-red-500/10 text-red-800 dark:text-red-200 line-through';
                        }

                        return (
                          <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${borderStyle}`}>
                            <span className="w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center bg-slate-100 dark:bg-slate-800 shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                      <strong className="text-sky-600 dark:text-sky-400 block mb-0.5 font-bold">
                        {isAr ? 'الشرح والتوثيق الكودي:' : 'Technical Code Justification:'}
                      </strong>
                      <p className="leading-relaxed">
                        {isAr ? q.explanation.ar : q.explanation.en}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
