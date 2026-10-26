import React, { useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  CircleStop,
  Compass,
  FileText,
  Film,
  Flame,
  GraduationCap,
  HelpCircle,
  History,
  Info,
  Layers,
  Library,
  Map,
  RefreshCw,
  Route,
  Ruler,
  Search,
  Send,
  Sliders,
  Sparkles,
  TrendingDown,
  Trophy,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Language, EducationalDefect, QuizQuestion } from '../types';
import { ACADEMY_TABS, AcademyTab, readAcademyTab } from '../academyTabs';
import { NDT_METHODS, EDUCATIONAL_DEFECTS, STANDARDS_LIBRARY, SAMPLE_QUIZZES } from '../data/inscoData';
import { IndustrialVideoGen } from './IndustrialVideoGen';
import { DisciplineCurriculumView } from './academy/DisciplineCurriculumView';
import { InteractiveWorkshops } from './academy/InteractiveWorkshops';
import { CurriculumQuizEngine } from './academy/CurriculumQuizEngine';
import { CurriculumLevelProgressTracker } from './academy/CurriculumLevelProgressTracker';
import { UserCourseProgressDashboard } from './academy/UserCourseProgressDashboard';
import { SemanticSearchBar, SearchTarget } from './academy/SemanticSearchBar';
import { fetchTutorStatus, streamTutor } from '../ai/client';
import { getCorpusStats } from '../ai/corpus';
import {
  failureMessage,
  TUTOR_LIMITS,
  TutorCitation,
  TutorFailure,
  TutorLanguage,
  TutorStatus,
} from '../ai/contract';
import { CurriculumCertificatesView } from './academy/CurriculumCertificatesView';
import { PracticalAssessmentView } from './academy/PracticalAssessmentView';
import { LearningPathsView } from './academy/LearningPathsView';
import { GlobalLeaderboard } from './academy/GlobalLeaderboard';
import { KnowledgeLeaderboard } from './academy/KnowledgeLeaderboard';
import { AcademyCompletionMap } from './academy/AcademyCompletionMap';
import { AcademyRoadmap } from './academy/AcademyRoadmap';
import { CertificationCenter } from './academy/CertificationCenter';
import { AcademyKnowledgeLibrary } from './academy/AcademyKnowledgeLibrary';
import { QuickReviewFlashcards } from './academy/QuickReviewFlashcards';
import { NdeEncyclopediaView } from './academy/NdeEncyclopediaView';
import { NdeEdCourseCatalog } from './academy/NdeEdCourseCatalog';
import { ENGINEERING_DISCIPLINES } from '../data/academyCurriculum';
import { NDE_ED_COURSES } from '../data/ndeEd';
import { LEARNING_PATHS } from '../data/learningPaths';
import { NDT_TEXTBOOKS } from '../data/ndeTextbooksData';
import { EdbLibraryView } from './academy/EdbLibraryView';
import { PautInspectorController } from './academy/PautInspectorController';
import { ComprehensiveWeldUtSimulator } from './academy/virtuallab/ComprehensiveWeldUtSimulator';
import { DacCalibrationBuilder } from './academy/virtuallab/DacCalibrationBuilder';
import { V1V2CalibrationLab } from './academy/virtuallab/V1V2CalibrationLab';
import { WorkshopTrainingResultsPanel } from './academy/virtuallab/WorkshopTrainingResultsPanel';
import {
  DefectToleranceModal,
  DefectToleranceTooltip,
  DefectToleranceTriggerBar,
  mapEducationalDefectToCatalogId,
} from './academy/virtuallab/DefectToleranceAlertSystem';
import type { InspectionCodeId } from '../data/utWeldDefectsCatalog';
import { SimulationHistoryView } from './academy/SimulationHistoryView';
import { SimulationLevelUpToast } from './academy/SimulationLevelUpToast';
import {
  recordSimulationAttempt,
  useSimulationHistory,
} from '../utils/simulationHistoryStore';

export type SubTab = AcademyTab;

/** Kept as a plain array so existing callers can keep iterating it. */
export const SUB_TABS: SubTab[] = [...ACADEMY_TABS];

interface EducationalAcademyProps {
  language: Language;
  initialSubTab?: SubTab;
}

export const EducationalAcademy: React.FC<EducationalAcademyProps> = ({ language, initialSubTab }) => {
  const isAr = language === 'ar';
  const corpusStats = React.useMemo(() => getCorpusStats(), []);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    // Order: explicit request → shared link → first tab.
    initialSubTab ?? readAcademyTab(window.location.hash) ?? 'encyclopedia'
  );

  // Target Module/Discipline when navigating to Quiz Mode from Curriculum
  const [quizTarget, setQuizTarget] = useState<{
    disciplineId?: string;
    levelId?: 'academic' | 'level1' | 'level2' | 'level3';
    moduleId?: string;
    moduleTitle?: { ar: string; en: string };
  } | null>(null);

  // Target Module/Level when navigating from the Level Progress Tracker
  const [curriculumTarget, setCurriculumTarget] = useState<{
    disciplineId?: string;
    levelIdx?: number;
    moduleId?: string;
  }>({});

  const [courseTarget, setCourseTarget] = useState<string | undefined>(undefined);
  const [edbTarget, setEdbTarget] = useState<string | undefined>(undefined);
  const [edbTargetPage, setEdbTargetPage] = useState<number | undefined>(undefined);
  const [textbookTarget, setTextbookTarget] = useState<{ bookId: string; pageNumber: number } | undefined>(undefined);

  const handleNavigateToCurriculumModule = (disciplineId: string, levelIdx: number, moduleId?: string) => {
    setCurriculumTarget({ disciplineId, levelIdx, moduleId });
    setActiveSubTab('curriculum');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleLaunchModuleQuiz = (
    disciplineId: string,
    levelId?: 'academic' | 'level1' | 'level2' | 'level3',
    moduleId?: string,
    moduleTitle?: { ar: string; en: string }
  ) => {
    setQuizTarget({ disciplineId, levelId, moduleId, moduleTitle });
    setActiveSubTab('quiz');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // A tab is shareable: `#courses`, `#practical`, `#edb`… The hash is the only
  // router in the app, so a teacher can paste a link straight to a section.
  // `initialSubTab` is the tab requested by the host page; it is an instruction,
  // not a permanent override — otherwise every re-render would snap the reader
  // back to the tab the app opened with.
  const appliedRequest = React.useRef<SubTab | undefined>(initialSubTab);
  React.useEffect(() => {
    if (initialSubTab && initialSubTab !== appliedRequest.current) {
      appliedRequest.current = initialSubTab;
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  React.useEffect(() => {
    const applyHash = () => {
      const tab = readAcademyTab(window.location.hash);
      if (tab) setActiveSubTab(tab);
    };
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  React.useEffect(() => {
    if (window.location.hash.replace(/^#/, '') === activeSubTab) return;
    // replaceState keeps the back button clean while still updating the URL.
    window.history.replaceState(null, '', `#${activeSubTab}`);
  }, [activeSubTab]);

  // Persistent local Simulation History counter
  const { stats: simulationHistoryStats } = useSimulationHistory();

  // Defect Simulator State
  const [selectedDefect, setSelectedDefect] = useState<EducationalDefect>(EDUCATIONAL_DEFECTS[0]);
  const [defectSimCode, setDefectSimCode] = useState<InspectionCodeId>('asme_viii');
  const [isDefectToleranceModalOpen, setIsDefectToleranceModalOpen] = useState<boolean>(false);
  const [autoDefectAlert, setAutoDefectAlert] = useState<boolean>(true);
  const [defectTraineeVerdict, setDefectTraineeVerdict] = useState<'ACCEPT' | 'REJECT'>('REJECT');
  const [defectLogToast, setDefectLogToast] = useState<string | null>(null);

  // PWHT Simulator State
  const [steelGrade, setSteelGrade] = useState<'P1' | 'P4_P5' | 'P91'>('P1');
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(25);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(SAMPLE_QUIZZES);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // AI Tutor State. `aiStatus` decides whether the tab offers a form or an
  // honest explanation: the site is published statically, so most deployments
  // have no gateway at all.
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<TutorStatus | null>(null);
  const [aiCitations, setAiCitations] = useState<TutorCitation[]>([]);
  const [aiFailure, setAiFailure] = useState<TutorFailure | null>(null);
  const aiAbort = React.useRef<AbortController | null>(null);

  // PWHT Calculations based on ASME B31.3
  const getPWHTParameters = () => {
    switch (steelGrade) {
      case 'P1': // Carbon Steel
        return {
          name: isAr ? 'فولاذ كربوني (Carbon Steel - P-No. 1)' : 'Carbon Steel (P-No. 1)',
          minSoakTemp: 595,
          maxSoakTemp: 650,
          soakTimeMin: Math.max(60, Math.round((wallThicknessMm / 25) * 60)),
          heatingRate: 200,
          coolingRate: 250,
          color: '#f59e0b',
          codeClause: 'ASME B31.3 Table 331.1.1 P-No. 1'
        };
      case 'P4_P5': // Low Alloy Cr-Mo (P11 / P22)
        return {
          name: isAr ? 'سبائك كروم موليبدينوم (Low Alloy Cr-Mo - P4/P5)' : 'Cr-Mo Alloy Steel (P4/P5)',
          minSoakTemp: 705,
          maxSoakTemp: 760,
          soakTimeMin: Math.max(120, Math.round((wallThicknessMm / 25) * 120)),
          heatingRate: 150,
          coolingRate: 150,
          color: '#ef4444',
          codeClause: 'ASME B31.3 Table 331.1.1 P-No. 4/5A'
        };
      case 'P91': // Creep Resistant 9Cr-1Mo-V
        return {
          name: isAr ? 'سبائك P91 لمحطات التوليد والمراجل الفائقة' : 'Modified 9Cr-1Mo-V (P-No. 15E)',
          minSoakTemp: 750,
          maxSoakTemp: 775,
          soakTimeMin: Math.max(120, Math.round((wallThicknessMm / 25) * 120)),
          heatingRate: 100,
          coolingRate: 100,
          color: '#ec4899',
          codeClause: 'ASME B31.3 / ASME Sec I PW-39 (Strict ±10°C Window)'
        };
    }
  };

  const pwht = getPWHTParameters();

  const handleQuizAnswer = (optionIdx: number) => {
    if (showAnswer) return;
    setSelectedOption(optionIdx);
    setShowAnswer(true);
    if (optionIdx === quizQuestions[currentQuizIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setScore(0);
    setQuizCompleted(false);
  };

  // Ask the gateway once, and only when the tutor tab is actually opened.
  React.useEffect(() => {
    if (activeSubTab !== 'ask_ai' || aiStatus) return;
    let active = true;
    void fetchTutorStatus().then(status => {
      if (active) setAiStatus(status);
    });
    return () => { active = false; };
  }, [activeSubTab, aiStatus]);

  const openSearchTarget = (target: SearchTarget) => {
    if (target.tab === 'edb' && target.bookId) {
      setEdbTarget(`edb-${target.bookId}`);
      setEdbTargetPage(target.pageNumber);
      setActiveSubTab('edb');
    } else if (target.courseId) {
      setCourseTarget(target.courseId);
      setActiveSubTab('courses');
    }
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const stopAiTutor = () => {
    aiAbort.current?.abort();
    aiAbort.current = null;
    setIsAiLoading(false);
  };

  const handleAskAiTutor = async (topicToSend?: string) => {
    const q = (topicToSend || aiTopic).trim();
    if (!q || isAiLoading) return;

    setAiTopic(q);
    setIsAiLoading(true);
    setAiResponse('');
    setAiCitations([]);
    setAiFailure(null);

    const controller = new AbortController();
    aiAbort.current = controller;

    // If the status probe has not finished, take it now so a static deploy
    // explains itself instead of spinning forever.
    const status = aiStatus ?? (await fetchTutorStatus());
    if (!status.configured) {
      setAiStatus(status);
      setIsAiLoading(false);
      return;
    }

    await streamTutor(
      {
        messages: [{ role: 'user', content: q }],
        language: (language === 'en' ? 'en' : 'ar') as TutorLanguage,
        mode: 'explain',
      },
      {
        signal: controller.signal,
        onMeta: meta => setAiCitations(meta.citations),
        onDelta: text => setAiResponse(previous => previous + text),
        onError: failure => setAiFailure(failure),
        onDone: () => setIsAiLoading(false),
      }
    );

    if (aiAbort.current === controller) aiAbort.current = null;
    setIsAiLoading(false);
  };

  const openCitation = (citation: TutorCitation) => {
    if (citation.kind === 'textbook' && citation.pageNumber) {
      setEdbTarget(`edb-${citation.bookId}`);
      setEdbTargetPage(citation.pageNumber);
      setActiveSubTab('edb');
    } else if (citation.courseId) {
      setCourseTarget(citation.courseId);
      setActiveSubTab('courses');
    }
  };

  const aiUnavailable = aiStatus !== null && !aiStatus.configured;

  return (
    <section className="py-16 md:py-24 bg-[#080914] border-b border-[#21264c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
            <BookOpen className="w-4 h-4" />
            <span>{isAr ? 'الأكاديمية التعليمية والتطوير الهندسي' : 'INSCO NDT & PWHT ACADEMY'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {isAr ? (
              <>
                المركز التعليمي <span className="text-amber-400">في علوم الفحص والمعالجة الحرارية</span>
              </>
            ) : (
              <>
                Interactive Knowledge Hub for <span className="text-amber-400">NDT & Heat Treatment</span>
              </>
            )}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-3">
            {isAr
              ? 'أدوات محاكاة تفاعلية لفحص عيوب اللحام، محاكي منحنيات المعالجة الحرارية PWHT، بنك أسئلة وتأهيل لاختبارات ASNT، ومستشار أكاديمي مدعوم بالذكاء الاصطناعي.'
              : 'Interactive weld defect simulator, PWHT thermal curve calculator, ASNT practice exams, and ASME/API code explorer.'}
          </p>
        </div>

        {/* Semantic Search Bar for NDT & PWHT Technical Terms and Curriculum Modules */}
        <div className="max-w-4xl mx-auto mb-10">
          <SemanticSearchBar
            language={language}
            onNavigateToModule={(dId, lIdx, mId) => handleNavigateToCurriculumModule(dId, lIdx, mId)}
            onLaunchQuiz={(dId, lId, mId, mTitle) => handleLaunchModuleQuiz(dId, lId as any, mId, mTitle)}
            onOpenTarget={openSearchTarget}
            onAskTutor={question => {
              setActiveSubTab('ask_ai');
              void handleAskAiTutor(question);
            }}
          />
        </div>

        {/* Unified Practical Category Hubs (Prevents multi-line wrapping & page displacement) */}
        <div className="space-y-4 mb-8">
          {/* Main 5 Unified Functional Hubs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#0c0e22] p-1.5 rounded-2xl border-2 border-[#202755] shadow-xl max-w-6xl mx-auto">
            {/* Hub 0: Interactive Textbooks & Encyclopedia */}
            <button
              onClick={() => setActiveSubTab('encyclopedia')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'encyclopedia' || activeSubTab === 'knowledge' || activeSubTab === 'edb'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeSubTab === 'encyclopedia' || activeSubTab === 'knowledge' || activeSubTab === 'edb' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="truncate">{isAr ? 'الكتب الدراسية والموسوعة' : 'Textbooks & Encyclopedia'}</span>
            </button>

            {/* Hub 1: Comprehensive Curricula */}
            <button
              onClick={() => setActiveSubTab('curriculum')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'curriculum' || activeSubTab === 'courses' || activeSubTab === 'paths'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${activeSubTab === 'curriculum' || activeSubTab === 'courses' || activeSubTab === 'paths' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="truncate">{isAr ? 'المناهج والمسارات' : 'Curricula (8)'}</span>
            </button>

            {/* Hub 2: Certification & Digital Badges */}
            <button
              onClick={() => {
                if (activeSubTab !== 'certificates' && activeSubTab !== 'certification_center' && activeSubTab !== 'practical') {
                  setActiveSubTab('certification_center');
                }
              }}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'certificates' || activeSubTab === 'certification_center' || activeSubTab === 'practical'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
              }`}
            >
              <Award className={`w-4 h-4 ${activeSubTab === 'certificates' || activeSubTab === 'certification_center' || activeSubTab === 'practical' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="truncate">{isAr ? 'اختبارات NDT وإفادة التعلم' : 'NDT Exams & Learning Statement'}</span>
            </button>

            {/* Hub 3: Hands-on Interactive Workbenches */}
            <button
              onClick={() => setActiveSubTab('workshops')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'workshops'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
              }`}
            >
              <Wrench className={`w-4 h-4 ${activeSubTab === 'workshops' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span className="truncate">{isAr ? 'معامل الورش الحية' : 'Interactive Labs (6)'}</span>
            </button>

            {/* Hub 4: Thermal & Defect Simulators + Simulation History */}
            <button
              onClick={() => {
                if (
                  ![
                    'defects',
                    'pwht_curve',
                    'paut_controller',
                    'weld_simulator',
                    'dac_builder',
                    'simulation_history',
                  ].includes(activeSubTab)
                ) {
                  setActiveSubTab('weld_simulator');
                }
              }}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                [
                  'defects',
                  'pwht_curve',
                  'paut_controller',
                  'weld_simulator',
                  'dac_builder',
                  'simulation_history',
                ].includes(activeSubTab)
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
              }`}
            >
              <Activity
                className={`w-4 h-4 ${
                  [
                    'defects',
                    'pwht_curve',
                    'paut_controller',
                    'weld_simulator',
                    'dac_builder',
                    'simulation_history',
                  ].includes(activeSubTab)
                    ? 'text-slate-950'
                    : 'text-amber-400'
                }`}
              />
              <span className="truncate">{isAr ? 'المحاكيات وأجهزة الفحص' : 'Simulators & Devices'}</span>
            </button>

            {/* Hub 5: Codes, Methods & AI Professor */}
            <button
              onClick={() => {
                if (!['standards', 'methods', 'quiz', 'flashcards', 'ask_ai', 'video_gen', 'leaderboard', 'completion_map', 'roadmap'].includes(activeSubTab)) {
                  setActiveSubTab('roadmap');
                }
              }}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                ['standards', 'methods', 'quiz', 'flashcards', 'ask_ai', 'video_gen', 'leaderboard', 'completion_map', 'roadmap'].includes(activeSubTab)
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${['standards', 'methods', 'quiz', 'flashcards', 'ask_ai', 'video_gen'].includes(activeSubTab) ? 'text-slate-950' : 'text-sky-400'}`} />
              <span className="truncate">{isAr ? 'الأكواد والمستشار والمسار' : 'Codes, AI & Roadmap'}</span>
            </button>
          </div>

          {/* Child Sub-Segment Pills for Hub 0: Textbooks, Encyclopedia & Knowledge Library */}
          {(activeSubTab === 'encyclopedia' || activeSubTab === 'knowledge' || activeSubTab === 'edb') && (
            <div className="flex flex-wrap items-center justify-center gap-2 animate-fadeIn">
              <button
                onClick={() => setActiveSubTab('encyclopedia')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'encyclopedia'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? `الكتب الدراسية التفاعلية وتقليب الصفحات (${NDT_TEXTBOOKS.length} كتاباً) والمعمل` : `Interactive Textbooks & Labs (${NDT_TEXTBOOKS.length} Books)`}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('knowledge')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'knowledge'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>{isAr ? 'مكتبة الدروس ومسار القراءة التأسيسي' : 'Foundational Lessons & Reading Path'}</span>
              </button>
              <button
                onClick={() => { setEdbTarget(undefined); setActiveSubTab('edb'); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'edb'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Library className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? `مكتبة EDB وتقليب الصفحات (${NDT_TEXTBOOKS.length + NDE_ED_COURSES.length} مستنداً)` : `EDB Flipbook Library (${NDT_TEXTBOOKS.length + NDE_ED_COURSES.length} Documents)`}</span>
              </button>
            </div>
          )}

          {/* Child Sub-Segment Pills for Hub 1: Curricula & NDE-Ed Courses */}
          {(activeSubTab === 'curriculum' || activeSubTab === 'courses' || activeSubTab === 'paths') && (
            <div className="flex flex-wrap items-center justify-center gap-2 animate-fadeIn">
              <button
                onClick={() => setActiveSubTab('curriculum')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'curriculum'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'المناهج الثمانية والمسارات المهنية' : 'Eight Disciplines & Career Paths'}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('courses')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'courses'
                    ? 'bg-[#1e2554] text-cyan-300 border border-cyan-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? `مقررات NDE-Ed التفاعلية (${NDE_ED_COURSES.length} مقررات)` : `NDE-Ed Interactive Courses (${NDE_ED_COURSES.length})`}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('paths')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'paths'
                    ? 'bg-[#1e2554] text-indigo-300 border border-indigo-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAr ? `مسارات التعلم (${LEARNING_PATHS.length})` : `Learning Paths (${LEARNING_PATHS.length})`}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('quiz')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10132b] text-emerald-300 hover:text-white border border-emerald-500/35 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'نظام الاختبارات التفاعلي (+XP)' : 'Interactive Quiz System (+XP)'}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('leaderboard')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10132b] text-amber-300 hover:text-white border border-amber-500/35 transition cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'لوحة المتصدرين (XP)' : 'XP Leaderboard'}</span>
              </button>
            </div>
          )}

          {/* Child Sub-Segment Pills for Hub 2: Certification Center & Attestations */}
          {(activeSubTab === 'certificates' || activeSubTab === 'certification_center' || activeSubTab === 'practical') && (
            <div className="flex flex-wrap items-center justify-center gap-2 animate-fadeIn">
              <button
                onClick={() => setActiveSubTab('certification_center')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'certification_center'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'مركز تسجيل الاختبارات الرسمية والمحاكي التجريبي' : 'Official Exam Center & Mock Tests'}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('certificates')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'certificates'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>{isAr ? 'إفادة تعلم ذاتي غير معتمدة' : 'Self-Study Statement (non-accredited)'}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('practical')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'practical'
                    ? 'bg-[#1e2554] text-teal-300 border border-teal-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>{isAr ? 'التقييم العملي الموثّق (تدريبي)' : 'Practical Assessment (training)'}</span>
              </button>
            </div>
          )}

          {/* Direct Quick Sub-Tab Access to Simulation History when outside Simulators Hub */}
          {![
            'defects',
            'pwht_curve',
            'paut_controller',
            'weld_simulator',
            'dac_builder',
            'v1_v2_calibration',
            'simulation_history',
          ].includes(activeSubTab) && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setActiveSubTab('simulation_history')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10132b] text-cyan-300 hover:text-white border border-cyan-500/30 transition cursor-pointer tabular-nums"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'سجل المحاكاة' : 'Simulation History'}</span>
                {simulationHistoryStats.totalAttempts > 0 && (
                  <span className="font-mono text-[11px] text-amber-300">
                    ({simulationHistoryStats.totalAttempts} · {simulationHistoryStats.totalXp} XP)
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Child Sub-Segment Pills for Hub 4: Simulators, Devices & Simulation History */}
          {[
            'defects',
            'pwht_curve',
            'paut_controller',
            'weld_simulator',
            'dac_builder',
            'v1_v2_calibration',
            'simulation_history',
          ].includes(activeSubTab) && (
            <div className="flex flex-wrap items-center justify-center gap-2 animate-fadeIn">
              <button
                type="button"
                onClick={() => setActiveSubTab('weld_simulator')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'weld_simulator'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-cyan-400 hover:text-cyan-200 border border-cyan-500/30'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isAr ? 'محاكي فحص اللحام وتتبع الأشعة والكود' : 'Weld UT Ray Tracing & Codes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('v1_v2_calibration')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'v1_v2_calibration'
                    ? 'bg-teal-400 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-teal-300 hover:text-teal-100 border border-teal-500/35'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>{isAr ? 'كالبريشن بلوكات V1 & V2 واستارت تشيك الكود' : 'V1 & V2 Blocks + Start-Check'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('dac_builder')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'dac_builder'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-emerald-400 hover:text-emerald-200 border border-emerald-500/30'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{isAr ? 'مختبر منحنى المعايرة DAC' : 'ASME DAC Curve Builder'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('paut_controller')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'paut_controller'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-amber-400 hover:text-amber-200 border border-amber-500/30'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isAr ? 'جهاز تحكم PAUT الميداني (Inspector Controller)' : 'PAUT Inspector Controller'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('defects')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'defects'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'محاكي عيوب اللحام (Defect Simulator)' : 'Weld Defect Simulator'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('pwht_curve')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'pwht_curve'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{isAr ? 'محاكي منحنيات PWHT الحرارية' : 'PWHT Thermal Curve'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('simulation_history')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer tabular-nums ${
                  activeSubTab === 'simulation_history'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-cyan-300 hover:text-white border border-cyan-500/35'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{isAr ? 'سجل المحاكاة' : 'Simulation History'}</span>
                {simulationHistoryStats.totalAttempts > 0 && (
                  <span
                    className={`font-mono text-[11px] ${
                      activeSubTab === 'simulation_history' ? 'text-slate-950' : 'text-amber-300'
                    }`}
                  >
                    ({simulationHistoryStats.totalAttempts} · {simulationHistoryStats.totalXp} XP)
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Child Sub-Segment Pills for Hub 5: Knowledge, Exams & AI */}
          {['standards', 'methods', 'quiz', 'flashcards', 'ask_ai', 'video_gen', 'leaderboard', 'completion_map', 'roadmap', 'encyclopedia'].includes(activeSubTab) && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 animate-fadeIn max-w-4xl mx-auto">
              <button
                onClick={() => setActiveSubTab('encyclopedia')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'encyclopedia'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-amber-300 hover:text-white border border-amber-400/40'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${activeSubTab === 'encyclopedia' ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{isAr ? 'موسوعة NDT ومعمل الحسابات' : 'NDT Encyclopedia'}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('flashcards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'flashcards'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-cyan-300 hover:text-white border border-cyan-400/40'
                }`}
              >
                <BrainCircuit className={`w-3.5 h-3.5 ${activeSubTab === 'flashcards' ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{isAr ? 'بطاقات الاستذكار السريع' : 'Quick Flashcards'}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('standards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'standards'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'مكتبة الأكواد (ASME / API / AWS)' : 'Standards Library'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('methods')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'methods'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>{isAr ? 'دليل الـ 12 تقنية فحص' : '12 NDT Methods Guide'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('quiz')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'quiz'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'اختبار المعرفة وتأهيل ASNT' : 'ASNT Quiz'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('leaderboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'leaderboard'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-amber-300 hover:text-white border border-amber-400/40'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 ${activeSubTab === 'leaderboard' ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{isAr ? 'لوحة متصدري المعرفة' : 'Knowledge Leaderboard'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('completion_map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'completion_map'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-sky-300 hover:text-white border border-sky-400/40'
                }`}
              >
                <Map className={`w-3.5 h-3.5 ${activeSubTab === 'completion_map' ? 'text-slate-950' : 'text-sky-400'}`} />
                <span>{isAr ? 'خريطة الاستكمال' : 'Completion Map'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('roadmap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'roadmap'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#10132b] text-sky-300 hover:text-white border border-sky-400/40'
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${activeSubTab === 'roadmap' ? 'text-slate-950' : 'text-sky-400'}`} />
                <span>{isAr ? 'خريطة مسار التعلم' : 'Academy Roadmap'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('ask_ai')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'ask_ai'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'اسأل المستشار الأكاديمي' : 'Ask Professor AI'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('video_gen')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'video_gen'
                    ? 'bg-[#1e2554] text-amber-300 border border-amber-400/50 shadow-md'
                    : 'bg-[#10132b] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>{isAr ? 'توليد فيديو المحاكاة' : 'Veo Simulation'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Persistent Curriculum Level & Per-User Course Progress Dashboard */}
        <div className="mb-8 space-y-4">
          <CurriculumLevelProgressTracker
            language={language}
            onNavigateToModule={(dId, lIdx, mId) => handleNavigateToCurriculumModule(dId, lIdx, mId)}
            onLaunchQuiz={(dId, lId, mId, mTitle) => handleLaunchModuleQuiz(dId, lId as any, mId, mTitle)}
            onNavigateToCertificates={() => {
              setActiveSubTab('certificates');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            onOpenLeaderboard={() => {
              setActiveSubTab('leaderboard');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
          <UserCourseProgressDashboard
            language={language}
            onNavigateToModule={(dId, lIdx, mId) => handleNavigateToCurriculumModule(dId, lIdx, mId)}
          />
        </div>

        {/* Sub-Tab 0A: All Disciplines & Career Roadmaps Curriculum */}
        {activeSubTab === 'curriculum' && (
          <DisciplineCurriculumView
            language={language}
            targetDisciplineId={curriculumTarget.disciplineId}
            targetLevelIdx={curriculumTarget.levelIdx}
            targetModuleId={curriculumTarget.moduleId}
            onLaunchFlashcards={(dId, mId) => {
              setQuizTarget({ disciplineId: dId, moduleId: mId });
              setActiveSubTab('flashcards');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            onLaunchQuiz={(dId, lId, mId, mTitle) => handleLaunchModuleQuiz(dId, lId as any, mId, mTitle)}
            onOpenLeaderboard={() => {
              setActiveSubTab('leaderboard');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        )}

        {/* Sub-Tab: NDE-Ed Interactive Courses */}
        {activeSubTab === 'courses' && (
          <NdeEdCourseCatalog
            language={language}
            initialCourseId={courseTarget}
            onOpenCurriculum={(disciplineId, levelId, moduleId) => {
              // Resolve the level index from the curriculum data itself so adding a
              // stage can never silently shift every course deep-link.
              const discipline = ENGINEERING_DISCIPLINES.find(item => item.id === disciplineId);
              const found = discipline?.levels.findIndex(level => level.levelId === levelId) ?? -1;
              handleNavigateToCurriculumModule(disciplineId, found >= 0 ? found : 0, moduleId);
            }}
            onOpenTextbook={(bookId, pageNumber) => {
              setTextbookTarget({ bookId, pageNumber });
              setActiveSubTab('encyclopedia');
              window.scrollTo({ top: 320, behavior: 'smooth' });
            }}
            onOpenLab={() => {
              setActiveSubTab('workshops');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            onOpenEdb={(courseId) => {
              setEdbTarget(`edb-course-${courseId}`);
              setActiveSubTab('edb');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            onOpenLeaderboard={() => {
              setActiveSubTab('leaderboard');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        )}

        {/* Sub-Tab: Curated Learning Paths */}
        {activeSubTab === 'paths' && (
          <LearningPathsView
            language={language}
            onOpenCourse={(courseId) => {
              setCourseTarget(courseId);
              setActiveSubTab('courses');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            onOpenPractical={() => {
              setActiveSubTab('practical');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        )}

        {/* Sub-Tab: EDB Flipbook Library */}
        {activeSubTab === 'edb' && (
          <EdbLibraryView
            language={language}
            initialBookId={edbTarget}
            initialPage={edbTargetPage}
            onOpenCourse={(courseId) => {
              setCourseTarget(courseId);
              setActiveSubTab('courses');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            onOpenLab={() => {
              setActiveSubTab('workshops');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        )}

        {/* Sub-Tab: Quick Review Flashcard System */}
        {activeSubTab === 'flashcards' && (
          <QuickReviewFlashcards
            language={language}
            initialDisciplineId={quizTarget?.disciplineId}
            initialModuleId={quizTarget?.moduleId}
            onLaunchQuiz={(dId, lId, mId) => handleLaunchModuleQuiz(dId, lId as any, mId)}
            onNavigateToCurriculum={(dId) => handleNavigateToCurriculumModule(dId, 0)}
          />
        )}

        {/* Sub-Tab 0B: Official NDT Certification & Testing Center */}
        {activeSubTab === 'certification_center' && (
          <CertificationCenter
            language={language}
            onNavigateToModule={(disciplineId, levelIdx, moduleId) => {
              handleNavigateToCurriculumModule(disciplineId, levelIdx, moduleId);
            }}
            onOpenRoadmap={() => {
              setActiveSubTab('roadmap');
            }}
          />
        )}

        {/* Sub-Tab 0B: Visual Certification & Digital Badges Section */}
        {activeSubTab === 'certificates' && (
          <CurriculumCertificatesView
            language={language}
            onLaunchQuiz={(dId) => handleLaunchModuleQuiz(dId, 'academic')}
          />
        )}

        {/* Sub-Tab 0B2: Documented Practical Assessment (training record) */}
        {activeSubTab === 'practical' && (
          <PracticalAssessmentView language={language} />
        )}

        {/* Sub-Tab 0B: Interactive Hands-on Visual Workbenches */}
        {activeSubTab === 'workshops' && (
          <InteractiveWorkshops language={language} />
        )}

        {/* Sub-Tab 0C: PAUT Inspector Controller Device */}
        {activeSubTab === 'paut_controller' && (
          <PautInspectorController language={language} />
        )}

        {/* Sub-Tab 0D: Comprehensive Weld UT Ray Tracing & Defect Evaluation + Training Scorecard */}
        {activeSubTab === 'weld_simulator' && (
          <div className="space-y-8">
            <ComprehensiveWeldUtSimulator language={language} />
            <WorkshopTrainingResultsPanel language={language} />
          </div>
        )}

        {/* Sub-Tab 0E: Step-by-Step ASME DAC Calibration Builder */}
        {activeSubTab === 'dac_builder' && (
          <DacCalibrationBuilder language={language} />
        )}

        {/* Sub-Tab 0E2: Complete V1 & V2 Calibration Blocks + 7-Stage Code Calibration & Weld Start-Check */}
        {activeSubTab === 'v1_v2_calibration' && (
          <V1V2CalibrationLab
            language={language}
            onCompleteAndProceedToWeld={() => setActiveSubTab('weld_simulator')}
          />
        )}

        {/* Sub-Tab 0F: Persistent Local Simulation History */}
        {activeSubTab === 'simulation_history' && (
          <SimulationHistoryView
            language={language}
            suppressGlobalToast
            onOpenSubTab={(tab) => {
              setActiveSubTab(tab);
              window.scrollTo({ top: 340, behavior: 'smooth' });
            }}
          />
        )}

        {/* Sub-Tab 1: Defect Diagnostic Simulator */}
        {activeSubTab === 'defects' && (
          <div className="bg-[#10132b] p-6 sm:p-8 rounded-2xl border-2 border-amber-500/40 shadow-2xl space-y-5">
            <div className="max-w-2xl">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? 'محاكي تشخيص عيوب اللحام وقواعد القبول' : 'Weld Discontinuity & Defect Simulator'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isAr
                  ? 'اختر نوع العيب الشائع لاكتشاف سببه الفيزيائي، وأنسب طرق NDT لاكتشافه، ومعيار قبوله أو رفضه طبقاً لـ ASME B31.3 و AWS D1.1.'
                  : 'Select a common weld defect to examine its root metallurgical cause, optimal NDT detection techniques, and ASME acceptance limits.'}
              </p>
            </div>

            <DefectToleranceTriggerBar
              defectId={mapEducationalDefectToCatalogId(selectedDefect.id)}
              activeCode={defectSimCode}
              thicknessMm={25}
              language={language}
              autoAlertOnSelect={autoDefectAlert}
              onToggleAutoAlert={setAutoDefectAlert}
              onOpenModal={() => setIsDefectToleranceModalOpen(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Defect Selector Buttons with Hover Tolerance Tooltip */}
              <div className="lg:col-span-4 space-y-2.5">
                {EDUCATIONAL_DEFECTS.map((defect) => {
                  const isSelected = selectedDefect.id === defect.id;
                  const mappedId = mapEducationalDefectToCatalogId(defect.id);
                  return (
                    <DefectToleranceTooltip
                      key={defect.id}
                      defectId={mappedId}
                      activeCode={defectSimCode}
                      thicknessMm={25}
                      language={language}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDefect(defect);
                          setDefectLogToast(null);
                          if (autoDefectAlert) {
                            setIsDefectToleranceModalOpen(true);
                          }
                        }}
                        className={`w-full text-start p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#1d224e] border-amber-400 text-white shadow-md'
                            : 'bg-[#0b0c1c] border-[#202652] text-slate-300 hover:bg-[#141738]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm">
                            {isAr ? defect.name.ar : defect.name.en}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {isAr ? defect.nature.ar : defect.nature.en}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono-code px-2 py-0.5 rounded font-bold ${
                            defect.severity === 'Critical'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {defect.severity}
                        </span>
                      </button>
                    </DefectToleranceTooltip>
                  );
                })}
              </div>

              {/* Defect Detailed Analysis Board */}
              <div className="lg:col-span-8 bg-[#0b0c1c] p-6 rounded-2xl border border-[#232958] space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1f2550]">
                  <div>
                    <span className="text-[10px] font-mono-code text-amber-400 font-bold uppercase tracking-wider">
                      METALLURGICAL DEFECT DOSSIER
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      {isAr ? selectedDefect.name.ar : selectedDefect.name.en}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono-code ${
                      selectedDefect.severity === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isAr ? `درجة الخطورة: ${selectedDefect.severity}` : `Severity: ${selectedDefect.severity}`}
                  </span>
                </div>

                {/* Nature & Physical Root Cause */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="bg-[#131633] p-4 rounded-xl border border-[#212752]">
                    <div className="font-bold text-amber-400 mb-1">{isAr ? 'طبيعة العيب في اللحام:' : 'Nature of Discontinuity:'}</div>
                    <p className="text-slate-300 leading-relaxed">
                      {isAr ? selectedDefect.nature.ar : selectedDefect.nature.en}
                    </p>
                  </div>

                  <div className="bg-[#131633] p-4 rounded-xl border border-[#212752]">
                    <div className="font-bold text-amber-400 mb-1">{isAr ? 'السبب الرئيسي أثناء اللحام:' : 'Root Cause in Welding:'}</div>
                    <p className="text-slate-300 leading-relaxed">
                      {isAr ? selectedDefect.cause.ar : selectedDefect.cause.en}
                    </p>
                  </div>
                </div>

                {/* Best Detection NDT Methods */}
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {isAr ? 'أفضل طرق الفحص غير الإتلافي لاكتشافه بدقة:' : 'Recommended NDT Methods for Detection:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDefect.bestDetectionMethods.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#181d45] text-sky-300 border border-sky-500/30"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Code Acceptance Criteria */}
                <div className="bg-[#15122b] p-4 rounded-xl border border-amber-500/40">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'معيار القبول والرفض بالكود الدولي:' : 'Code Acceptance Criteria:'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-mono-code leading-relaxed">
                    {selectedDefect.acceptanceCriteriaCode}
                  </p>
                </div>

                {/* Interactive Simulation Disposition & Log to Simulation History */}
                <div className="rounded-xl border border-[#232958] bg-[#10132b] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-slate-300 font-bold">
                      {isAr ? 'تقييم القبول الكودي للمحاولة:' : 'Evaluate Defect Disposition:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDefectTraineeVerdict('ACCEPT')}
                      className={`px-3 py-1 rounded-lg border font-bold cursor-pointer ${
                        defectTraineeVerdict === 'ACCEPT'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      ACCEPT
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefectTraineeVerdict('REJECT')}
                      className={`px-3 py-1 rounded-lg border font-bold cursor-pointer ${
                        defectTraineeVerdict === 'REJECT'
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      REJECT
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const expectedVerdict: 'ACCEPT' | 'REJECT' =
                          selectedDefect.severity === 'Critical' ? 'REJECT' : 'ACCEPT';
                        const isPass = defectTraineeVerdict === expectedVerdict;
                        const rec = recordSimulationAttempt({
                          simulatorId: 'defects_simulator',
                          targetSubTab: 'defects',
                          simulatorTitle: {
                            ar: 'محاكي تشخيص عيوب اللحام وقواعد القبول',
                            en: 'Weld Discontinuity & Defect Simulator',
                          },
                          ndtMethod: 'MULTI',
                          defectTypes: [
                            {
                              id: selectedDefect.id,
                              ar: selectedDefect.name.ar,
                              en: selectedDefect.name.en,
                            },
                          ],
                          status: isPass ? 'PASS' : 'FAIL',
                          codeVerdict: expectedVerdict,
                          traineeVerdict: defectTraineeVerdict,
                          codeStandard: selectedDefect.acceptanceCriteriaCode,
                          scorePct: isPass ? 100 : 40,
                        });
                        setDefectLogToast(
                          isAr
                            ? `تم التسجيل (${rec.status} · +${rec.xpEarned} XP)`
                            : `Recorded (${rec.status} · +${rec.xpEarned} XP)`
                        );
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>
                        {isAr ? 'تسجيل المحاولة في سجل المحاكاة' : 'Record Simulation Attempt'}
                      </span>
                    </button>

                    {defectLogToast && (
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('simulation_history')}
                        className="text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                      >
                        {defectLogToast} · {isAr ? 'عرض السجل' : 'View History'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DefectToleranceModal
              isOpen={isDefectToleranceModalOpen}
              onClose={() => setIsDefectToleranceModalOpen(false)}
              defectId={mapEducationalDefectToCatalogId(selectedDefect.id)}
              activeCode={defectSimCode}
              onSelectCode={setDefectSimCode}
              thicknessMm={25}
              language={language}
              autoAlertOnSelect={autoDefectAlert}
              onToggleAutoAlert={setAutoDefectAlert}
            />
          </div>
        )}

        {/* Sub-Tab 2: PWHT Thermal Curve Generator */}
        {activeSubTab === 'pwht_curve' && (
          <div className="bg-[#10132b] p-6 sm:p-8 rounded-2xl border-2 border-amber-500/40 shadow-2xl space-y-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-code font-bold text-amber-400 mb-1">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>THERMAL CYCLE SIMULATION PER ASME B31.3 & AWS D1.1</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? 'محاكي منحنى المعالجة الحرارية بعد اللحام (PWHT Curve)' : 'PWHT Thermal Curve Interactive Simulator'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isAr
                  ? 'اختر سبيكة المعدن وسمك الجدار لحساب أقصى معدل تسخين، ودرجة حرارة النقع (Soak Temp)، وزمن الثبات، ومعدل التبريد المحكوم كما يطبقه أسطول وحدات إنسكو الأوتوماتيكية.'
                  : 'Select material grade and wall thickness to calculate code-compliant heating rate, soak duration, and cooling cycle.'}
              </p>
            </div>

            {/* Interactive Sliders & Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#0b0c1c] p-5 rounded-xl border border-[#212752]">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-2">
                  {isAr ? 'نوع السبيكة والمجموعة (P-Number):' : 'Steel Material Grade:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'P1', label: 'Carbon Steel (P1)' },
                    { id: 'P4_P5', label: 'Cr-Mo (P4/P5)' },
                    { id: 'P91', label: 'Creep P91 (15E)' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSteelGrade(g.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        steelGrade === g.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                          : 'bg-[#15193d] text-slate-300 border-[#252c61]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300 text-xs font-bold">
                    {isAr ? 'سماكة الجدار (Wall Thickness):' : 'Wall Thickness (mm):'}
                  </label>
                  <span className="text-amber-400 font-mono-code font-bold text-sm">
                    {wallThicknessMm} mm ({Math.round(wallThicknessMm / 25.4 * 10) / 10}")
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={wallThicknessMm}
                  onChange={(e) => setWallThicknessMm(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono-code">
                  <span>10 mm (Min)</span>
                  <span>50 mm</span>
                  <span>120 mm (Heavy Wall)</span>
                </div>
              </div>
            </div>

            {/* Calculated Values Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#131635] p-4 rounded-xl border border-[#232958]">
                <div className="text-[11px] text-slate-400">{isAr ? 'حرارة النقع الموصى بها' : 'Soak Temperature'}</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono-code mt-1">
                  {pwht.minSoakTemp}°C - {pwht.maxSoakTemp}°C
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{pwht.codeClause}</div>
              </div>

              <div className="bg-[#131635] p-4 rounded-xl border border-[#232958]">
                <div className="text-[11px] text-slate-400">{isAr ? 'زمن النقع المحسوب' : 'Soak Duration'}</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono-code mt-1">
                  {pwht.soakTimeMin} {isAr ? 'دقيقة' : 'mins'} ({Math.round(pwht.soakTimeMin / 60 * 10) / 10}h)
                </div>
                <div className="text-[10px] text-slate-400 mt-1">1 hr per 25mm thickness</div>
              </div>

              <div className="bg-[#131635] p-4 rounded-xl border border-[#232958]">
                <div className="text-[11px] text-slate-400">{isAr ? 'أقصى معدل تسخين' : 'Max Heating Rate'}</div>
                <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono-code mt-1">
                  ≤ {pwht.heatingRate}°C / hr
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Above 300°C</div>
              </div>

              <div className="bg-[#131635] p-4 rounded-xl border border-[#232958]">
                <div className="text-[11px] text-slate-400">{isAr ? 'أقصى معدل تبريد' : 'Max Cooling Rate'}</div>
                <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono-code mt-1">
                  ≤ {pwht.coolingRate}°C / hr
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Controlled down to 300°C</div>
              </div>
            </div>

            {/* Interactive SVG Heating Curve Diagram */}
            <div className="bg-[#0b0c1c] p-6 rounded-2xl border border-[#242b5c]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'المخطط الحراري الزمني المتزامن (Temperature vs Time Chart)' : 'Code Thermal Chart Visualization'}</span>
                </span>
                <span className="text-[11px] font-mono-code text-slate-400">
                  {isAr ? 'تسجيل دقيق بست قنوات مبرمجة' : 'INSCO 6-Channel Automated Recording'}
                </span>
              </div>

              {/* Chart SVG */}
              <div className="w-full h-64 relative bg-[#060814] rounded-xl border border-[#1b2046] p-4 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 600 220" fill="none">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="570" y2="20" stroke="#1c2146" strokeDasharray="3 3" />
                  <line x1="50" y1="70" x2="570" y2="70" stroke="#1c2146" strokeDasharray="3 3" />
                  <line x1="50" y1="120" x2="570" y2="120" stroke="#1c2146" strokeDasharray="3 3" />
                  <line x1="50" y1="170" x2="570" y2="170" stroke="#1c2146" strokeDasharray="3 3" />

                  {/* Axis */}
                  <line x1="50" y1="190" x2="570" y2="190" stroke="#475569" strokeWidth="1.5" />
                  <line x1="50" y1="10" x2="50" y2="190" stroke="#475569" strokeWidth="1.5" />

                  {/* Temperature Labels */}
                  <text x="15" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">800°C</text>
                  <text x="15" y="75" fill="#94a3b8" fontSize="10" fontFamily="monospace">600°C</text>
                  <text x="15" y="125" fill="#94a3b8" fontSize="10" fontFamily="monospace">400°C</text>
                  <text x="15" y="175" fill="#94a3b8" fontSize="10" fontFamily="monospace">200°C</text>
                  <text x="50" y="208" fill="#94a3b8" fontSize="10" fontFamily="monospace">0h</text>
                  <text x="200" y="208" fill="#94a3b8" fontSize="10" fontFamily="monospace">Heating</text>
                  <text x="340" y="208" fill="#94a3b8" fontSize="10" fontFamily="monospace">Soaking ({pwht.soakTimeMin}m)</text>
                  <text x="480" y="208" fill="#94a3b8" fontSize="10" fontFamily="monospace">Cooling</text>

                  {/* PWHT Curve Plot */}
                  <path
                    d={`M 50 180 L 220 50 L 380 50 L 530 180`}
                    stroke={pwht.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Soak highlight area */}
                  <rect x="220" y="45" width="160" height="10" fill={pwht.color} opacity="0.3" rx="3" />
                  <circle cx="220" cy="50" r="5" fill="#fff" />
                  <circle cx="380" cy="50" r="5" fill="#fff" />

                  <text x="250" y="38" fill={pwht.color} fontSize="12" fontWeight="bold">
                    Soak: {pwht.minSoakTemp}°C - {pwht.maxSoakTemp}°C
                  </text>
                </svg>
              </div>

              <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  {isAr
                    ? 'توفر إنسكو أسطولاً واسعاً ومتطوراً من وحدات المعالجة الحرارية 65 kW قادرة على التحكم الدقيق في منحنيات التسخين والتبريد لتجنب أي صدمة حرارية (Thermal Shock) أو تشوهات في الهيكل.'
                    : 'INSCO\'s extensive fleet of automatic 65 kW units executes precise digital ramp-soak programming with thermocouple feedback on every joint.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: 12 NDT Methods Guide */}
        {activeSubTab === 'methods' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {NDT_METHODS.map((method) => (
                <div
                  key={method.id}
                  className="bg-[#10132b] p-5 rounded-2xl border border-[#232958] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 font-mono-code font-black text-sm flex items-center justify-center border border-amber-500/30">
                      {method.code}
                    </span>
                    <span className="text-[10px] font-mono-code text-slate-400 px-2 py-0.5 rounded bg-[#0b0c1c]">
                      {method.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base">
                    {isAr ? method.name.ar : method.name.en}
                  </h4>
                  <div className="text-[11px] font-mono-code text-amber-400">
                    {method.standards}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr ? method.description.ar : method.description.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tab 4: Standards Library */}
        {activeSubTab === 'standards' && (
          <div className="bg-[#10132b] p-6 sm:p-8 rounded-2xl border border-[#232958] space-y-6">
            <div className="max-w-2xl">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? 'مكتبة المواصفات والأكواد الهندسية المعتمدة' : 'International Codes & Standards Directory'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isAr
                  ? 'جميع إجراءات التفتيش والاختبار بشركة إنسكو محررة وفقاً لأحدث إصدارات هذه الأكواد العالمية.'
                  : 'All INSCO method procedures and acceptance criteria are issued per these international standards.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STANDARDS_LIBRARY.map((std, i) => (
                <div key={i} className="bg-[#0b0d1e] p-4 rounded-xl border border-[#202652] space-y-2">
                  <div className="text-xs font-mono-code font-bold text-amber-400">
                    {std.code}
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {isAr ? std.titleAr : std.titleEn}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {std.scope}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tab 5: Interactive Quiz & Certification Exam Engine */}
        {activeSubTab === 'quiz' && (
          <CurriculumQuizEngine
            language={language}
            initialDisciplineId={quizTarget?.disciplineId}
            initialLevelId={quizTarget?.levelId}
            initialModuleId={quizTarget?.moduleId}
            initialModuleTitle={quizTarget?.moduleTitle}
            onCloseTargetedQuiz={() => {
              setQuizTarget(null);
              setActiveSubTab('curriculum');
            }}
            onNavigateToDiscipline={() => {
              setActiveSubTab('curriculum');
            }}
            onOpenLeaderboard={() => {
              setActiveSubTab('leaderboard');
            }}
          />
        )}

        {/* Sub-Tab 5B: Knowledge Leaderboard */}
        {activeSubTab === 'leaderboard' && (
          <KnowledgeLeaderboard
            language={language}
            onLaunchQuiz={(disciplineId, levelId) => {
              if (disciplineId) {
                handleLaunchModuleQuiz(disciplineId, levelId as any);
              } else {
                setActiveSubTab('quiz');
              }
            }}
            onNavigateToDiscipline={(disciplineId) => {
              handleNavigateToCurriculumModule(disciplineId, 0);
            }}
            onNavigateToCurriculum={() => {
              setActiveSubTab('curriculum');
            }}
          />
        )}

        {/* Sub-Tab 5C: Academy Completion Map */}
        {activeSubTab === 'completion_map' && (
          <AcademyCompletionMap language={language} />
        )}

        {/* Sub-Tab 5D: Academy Student Learning Path & Career Roadmap */}
        {activeSubTab === 'roadmap' && (
          <AcademyRoadmap
            language={language}
            onNavigateToModule={(disciplineId, levelIdx, moduleId) => {
              handleNavigateToCurriculumModule(disciplineId, levelIdx, moduleId);
            }}
            onOpenLibraryLesson={(_lessonId) => {
              setActiveSubTab('knowledge');
            }}
            onLaunchQuiz={(disciplineId, levelId, moduleId) => {
              if (disciplineId) {
                handleLaunchModuleQuiz(disciplineId, levelId as any, moduleId);
              } else {
                setActiveSubTab('quiz');
              }
            }}
            onNavigateToCertificates={() => {
              setActiveSubTab('certification_center');
            }}
            onOpenVirtualLab={(_labId) => {
              setActiveSubTab('workshops');
            }}
          />
        )}

        {/* Sub-Tab 0: NDE Academic Encyclopedia & Formula Lab */}
        {activeSubTab === 'encyclopedia' && (
          <NdeEncyclopediaView
            language={language}
            initialBookId={textbookTarget?.bookId}
            initialPageNumber={textbookTarget?.pageNumber}
            onOpenQuiz={(dId) => handleLaunchModuleQuiz(dId)}
            onOpenFlashcards={() => {
              setActiveSubTab('flashcards');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        )}

        {/* Sub-Tab 0B: Knowledge Library */}
        {activeSubTab === 'knowledge' && (
          <AcademyKnowledgeLibrary
            language={language}
            onCurriculum={(disciplineId) => handleNavigateToCurriculumModule(disciplineId, 0)}
            onOpenLeaderboard={() => {
              setActiveSubTab('leaderboard');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        )}

        {/* Sub-Tab 6: Ask AI Professor */}
        {activeSubTab === 'ask_ai' && (
          <div className="max-w-4xl mx-auto bg-[#10132b] p-6 sm:p-8 rounded-2xl border-2 border-amber-500/40 shadow-2xl space-y-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-code font-bold text-amber-400 mb-1">
                <BrainCircuit className="w-4 h-4" />
                <span>AI NDT LEVEL III CONSULTANT{aiStatus?.configured ? ` · ${aiStatus.model}` : ''}</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                {isAr ? 'اسأل أستاذ NDT والمعالجة الحرارية الذكي' : 'Ask the Senior NDT & Metallurgy Tutor'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isAr
                  ? `الإجابات تُبنى من مكتبة إنسكو نفسها (${corpusStats.pages} صفحة و${corpusStats.lessons} درساً)، وكل فكرة تُسند إلى الصفحة التي جاءت منها.`
                  : `Answers are built from the INSCO library itself (${corpusStats.pages} pages, ${corpusStats.lessons} lessons), and every claim cites the page it came from.`}
              </p>
            </div>

            {aiStatus === null && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                {isAr ? 'جارٍ التحقق من إعدادات المستشار…' : 'Checking tutor configuration…'}
              </div>
            )}

            {aiUnavailable && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 space-y-3">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
                  <Info className="w-4 h-4" />
                  {isAr ? 'المستشار الذكي غير مُهيّأ على هذه النسخة' : 'The tutor is not configured on this deployment'}
                </p>
                <p className="text-xs leading-6 text-slate-300">
                  {isAr
                    ? 'هذا الموقع يُنشر كملفات ثابتة، والمفتاح لا يجوز أن يوضع في المتصفح. المكتبة والمناهج والبحث تعمل بالكامل بدون المستشار. لتفعيل الأسئلة الحرة، شغّل بوابة الخادم مع مفتاح Gemini، وحدّد عنوانها في VITE_AI_BASE_URL.'
                    : 'This site ships as static files, and an API key must never live in the browser. The library, courses and search work fully without the tutor. To enable free-form answers, run the gateway with a Gemini key and point VITE_AI_BASE_URL at it.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? 'سبب الحالة: '
                    : 'Reported reason: '}
                  <code className="text-slate-300">
                    {aiStatus?.reason === 'unreachable'
                      ? isAr
                        ? 'لا يوجد خادم مستشار على هذا النطاق'
                        : 'no tutor gateway on this domain'
                      : aiStatus?.reason === 'no_key'
                        ? isAr
                          ? 'الخادم يعمل بدون GEMINI_API_KEY'
                          : 'server running without GEMINI_API_KEY'
                        : isAr
                          ? 'تعذّرت تهيئة عميل النموذج'
                          : 'model client failed to initialise'}
                  </code>
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('edb')}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-400"
                >
                  {isAr ? 'ابحث في المكتبة بدلاً من ذلك' : 'Search the library instead'}
                </button>
              </div>
            )}

            {!aiUnavailable && aiStatus !== null && (
              <>
                <div className="flex flex-wrap gap-2">
                  {(isAr
                    ? [
                        'كيف نميز بين عيب Lack of Fusion وعيب Porosity في قراءة Phased Array؟',
                        'ما هي متطلبات الإضاءة وحدة الإبصار في الفحص البصري؟',
                        'ما هو تأثير الهيدروجين في الشروخ الباردة وما دور التسخين المسبق؟',
                        'كيف نحسب عمق التغلغل في التيارات الدوامية؟',
                      ]
                    : [
                        'How do I tell lack of fusion from porosity on a phased array scan?',
                        'What are the illumination and vision requirements for visual testing?',
                        'How does hydrogen cause cold cracking, and what does preheat do?',
                        'How is the standard depth of penetration calculated in eddy current?',
                      ]
                  ).map(pill => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => {
                        setAiTopic(pill);
                        void handleAskAiTutor(pill);
                      }}
                      className="text-xs text-slate-300 hover:text-amber-300 bg-[#0c0e20] hover:bg-[#161a3d] px-3 py-1.5 rounded-lg border border-[#212754] transition cursor-pointer"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') void handleAskAiTutor();
                    }}
                    maxLength={TUTOR_LIMITS.messageChars}
                    placeholder={isAr ? 'اكتب موضوع الاستفسار التعليمي...' : 'Enter your question for the tutor...'}
                    className="flex-1 bg-[#0b0c1c] border border-[#272e63] rounded-xl px-4 py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                  {isAiLoading ? (
                    <button
                      type="button"
                      onClick={stopAiTutor}
                      className="px-5 py-3 rounded-xl border border-rose-400/50 text-rose-300 font-bold text-xs sm:text-sm flex items-center gap-1.5"
                    >
                      <CircleStop className="w-4 h-4" />
                      <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleAskAiTutor()}
                      disabled={!aiTopic.trim()}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? 'شرح الموضوع' : 'Explain'}</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {aiFailure && (
              <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-xs leading-6 text-rose-200">
                {failureMessage(aiFailure.code, language === 'en' ? 'en' : 'ar')}
              </p>
            )}

            {(isAiLoading || aiResponse) && (
              <div className="bg-[#0b0c1c] p-6 rounded-xl border border-amber-500/30 text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-line">
                {aiResponse || (
                  <span className="flex items-center gap-3 text-amber-400">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    {isAr ? 'جارٍ استرجاع المقاطع من المكتبة ثم الصياغة…' : 'Retrieving library passages, then composing…'}
                  </span>
                )}
              </div>
            )}

            {aiCitations.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {isAr ? 'المصادر التي استند إليها' : 'Sources behind the answer'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiCitations.map(citation => (
                    <button
                      key={citation.id}
                      type="button"
                      onClick={() => openCitation(citation)}
                      className="max-w-full truncate rounded-lg border border-[#2a3260] bg-[#0d1028] px-3 py-1.5 text-[11px] text-slate-300 hover:border-amber-400 hover:text-amber-200"
                      title={citation.id}
                    >
                      {isAr ? 'ص' : 'p'}
                      {citation.pageNumber ?? '—'} · {citation.title[language] || citation.title.ar}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  {isAr
                    ? 'مادة دراسة ذاتية غير معتمدة. القرارات الفنية تُبنى على نسخة الكود المرخصة في العقد.'
                    : 'Self-study material, not accredited. Technical decisions follow the licensed contract code.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab 7: Veo Video Generator */}
        {activeSubTab === 'video_gen' && (
          <IndustrialVideoGen language={language} />
        )}
      </div>

      <SimulationLevelUpToast
        language={language}
        onOpenHistory={
          activeSubTab !== 'simulation_history'
            ? () => {
                setActiveSubTab('simulation_history');
                window.scrollTo({ top: 320, behavior: 'smooth' });
              }
            : undefined
        }
      />
    </section>
  );
};
