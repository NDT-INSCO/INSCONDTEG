import React, { useState, useEffect, useMemo, useRef, useId, type ReactNode } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Flag,
  Eye,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Play,
  Calculator,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../../types';
import {
  PracticeExamExample,
  ExamPracticePlan,
  MockExamQuestion,
  MOCK_EXAM_QUESTIONS,
  getPracticeExamExamples,
  getExamPracticePlans,
  saveExamPracticePlan,
  removeExamPracticePlan,
  checkCandidateEligibility,
  getMockExamQuestions
} from '../../utils/certificationExamService';
import { useEscapeKey, useModalFocus } from '../../utils/a11y';
import { CertificationExamSimulation } from './CertificationExamSimulation';

interface CertificationCenterProps {
  language: Language;
  onNavigateToModule?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
  onOpenRoadmap?: () => void;
  initialTab?: 'catalog' | 'registrations' | 'mock_test' | 'calculator' | 'exam_simulation';
}

function PracticeDialog({ title, closeLabel, onClose, children }: {
  title: string; closeLabel: string; onClose: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEscapeKey(true, onClose);
  useModalFocus(true, ref);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 print:static print:block print:bg-white">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="max-h-[90dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 text-slate-100 print:max-h-none print:border-0 print:bg-white print:text-black sm:p-7">
        <div className="flex items-start justify-between gap-3 border-b border-slate-700 pb-3">
          <h3 id={titleId} className="text-lg font-bold">{title}</h3>
          <button type="button" aria-label={closeLabel} onClick={onClose} className="rounded-lg border border-slate-600 p-2 print:hidden"><X className="size-4" aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const CertificationCenter: React.FC<CertificationCenterProps> = ({
  language,
  onNavigateToModule,
  onOpenRoadmap,
  initialTab = 'catalog'
}) => {
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'catalog' | 'registrations' | 'mock_test' | 'calculator' | 'exam_simulation'>(initialTab);
  const exams = getPracticeExamExamples();
  const [plans, setPlans] = useState<ExamPracticePlan[]>([]);
  
  // Search & Filter state for catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  
  // Detailed Eligibility Modal / Drawer
  const [viewingEligibilityExam, setViewingEligibilityExam] = useState<PracticeExamExample | null>(null);

  const [planningExam, setPlanningExam] = useState<PracticeExamExample | null>(null);
  const [studyOn, setStudyOn] = useState('');
  const [format, setFormat] = useState<ExamPracticePlan['format']>('in_person');
  const [viewingPlan, setViewingPlan] = useState<ExamPracticePlan | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const openPlanner = (exam: PracticeExamExample) => {
    setPlanningExam(exam);
    setStudyOn('');
    setFormat('in_person');
    setSaveFailed(false);
  };

  const closeLabel = isAr ? 'إغلاق النافذة' : 'Close dialog';
  const practiceNotice = isAr
    ? 'للتعلّم الذاتي فقط. لا يوجد حجز رسمي أو اعتماد صادر من هذه الصفحة.'
    : 'Self-study only. This page does not book exams or issue professional certification.';

  // ---------------------------------------------------------------------------
  // Mock Practice Test Simulator State
  // ---------------------------------------------------------------------------
  const [mockExamId, setMockExamId] = useState<string>('asnt_lvl2_combo');
  const [mockSection, setMockSection] = useState<'all' | 'general' | 'specific' | 'practical'>('all');
  const [testQuestions, setTestQuestions] = useState<MockExamQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60 * 60); // 60 min default

  // ---------------------------------------------------------------------------
  // Interactive Eligibility Calculator State
  // ---------------------------------------------------------------------------
  const [calcHours, setCalcHours] = useState<number>(80);
  const [calcExperienceMonths, setCalcExperienceMonths] = useState<number>(12);
  const [calcEducation, setCalcEducation] = useState<'high_school' | 'associate_diploma' | 'bsc_engineering'>('bsc_engineering');

  useEffect(() => { setPlans(getExamPracticePlans()); }, []);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (selectedSchemeFilter !== 'all' && exam.accreditationBody !== selectedSchemeFilter) return false;
      if (selectedLevelFilter !== 'all' && exam.level !== selectedLevelFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = exam.title.ar.toLowerCase().includes(q) || exam.title.en.toLowerCase().includes(q);
        const inCode = exam.code.toLowerCase().includes(q);
        const inMethod = exam.method.toLowerCase().includes(q);
        if (!inTitle && !inCode && !inMethod) return false;
      }
      return true;
    });
  }, [exams, selectedSchemeFilter, selectedLevelFilter, searchQuery]);

  const handleSavePlan = (event: React.FormEvent) => {
    event.preventDefault();
    if (!planningExam) return;
    const plan = saveExamPracticePlan(planningExam.id, studyOn, format);
    if (!plan) { setSaveFailed(true); return; }
    setPlans(getExamPracticePlans());
    setPlanningExam(null);
    setViewingPlan(plan);
  };

  // Start Mock Practice Test
  const startMockTest = (examId?: string) => {
    const targetExamId = examId || mockExamId;
    setMockExamId(targetExamId);
    const qList = getMockExamQuestions(targetExamId, mockSection === 'all' ? undefined : mockSection);
    setTestQuestions(qList);
    setAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIdx(0);
    setIsTestRunning(true);
    setIsTestSubmitted(false);
    setRemainingSeconds(60 * 45); // 45 minutes
    setActiveTab('mock_test');
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (!isTestRunning || isTestSubmitted) return;
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTestSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTestRunning, isTestSubmitted]);

  // Format Timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Submit Mock Test
  const handleSubmitMockTest = () => {
    if (confirm(isAr ? 'هل أنت متأكد من إنهاء وتسليم الاختبار التجريبي؟' : 'Are you sure you want to finish and submit the mock test?')) {
      setIsTestSubmitted(true);
      setIsTestRunning(false);

      // Check score
      const correctCount = testQuestions.filter((q, idx) => answers[idx] === q.correctAnswer).length;
      const scorePct = testQuestions.length > 0 ? Math.round((correctCount / testQuestions.length) * 100) : 0;
      if (scorePct >= 70) {
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    }
  };

  // Mock Test Score Calculations
  const mockScoreResults = useMemo(() => {
    if (!isTestSubmitted || testQuestions.length === 0) return null;
    const total = testQuestions.length;
    let correct = 0;
    testQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= 70;
    return { total, correct, percent, passed };
  }, [isTestSubmitted, testQuestions, answers]);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full space-y-8 animate-fadeIn text-slate-100">
      
      <header className="space-y-3 rounded-2xl border border-sky-500/30 bg-slate-900 p-5 sm:p-7">
        <div className="flex items-center gap-2 text-sm font-bold text-sky-300"><GraduationCap className="size-5" aria-hidden="true" />{isAr ? 'أكاديمية إنسكو · تقييم ذاتي' : 'INSCO Academy · self-assessment'}</div>
        <h2 className="text-2xl font-black text-white sm:text-3xl">{isAr ? 'دليل التأهيل والتدريب على الاختبارات' : 'Qualification Guide & Exam Practice'}</h2>
        <p className="max-w-prose text-sm leading-relaxed text-slate-200">{practiceNotice}</p>
        <p className="max-w-prose text-sm leading-relaxed text-slate-300">{isAr
          ? 'راجع أمثلة مناهج ASNT وISO 9712 وAPI وCSWIP، وجرّب المحاكاة. تحقّق من المتطلبات والإصدار الحالي لدى الجهة المانحة أو جهة العمل قبل التقدم.'
          : 'Explore examples for ASNT, ISO 9712, API and CSWIP, and try a simulator. Confirm the current requirements with the awarding body or your employer before applying.'}</p>
        <p className="text-xs text-slate-300">{exams.length} {isAr ? 'أمثلة تدريبية' : 'practice examples'} · {MOCK_EXAM_QUESTIONS.length} {isAr ? 'سؤال للتقييم الذاتي' : 'self-check questions'}</p>
      </header>

      {/* 2. NAVIGATION SEGMENT TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={activeTab === 'catalog'}
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-[#10142e] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isAr ? 'دليل الاختبارات وشروط الأهلية' : 'Exam Catalog & Prerequisites'}</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'registrations'}
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer relative ${
              activeTab === 'registrations'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-[#10142e] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'خطط المذاكرة' : 'My study plans'}</span>
            {plans.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                {plans.length}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'mock_test'}
            onClick={() => setActiveTab('mock_test')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'mock_test'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-[#10142e] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'محاكي الاختبارات التجريبية' : 'Pre-Exam Mock Simulator'}</span>
          </button>

          <button
            data-testid="tab-exam-simulation"
            type="button"
            aria-pressed={activeTab === 'exam_simulation'}
            onClick={() => setActiveTab('exam_simulation')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'exam_simulation'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-[#10142e] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isAr ? 'محاكي امتحانات التأهيل (Level 1 & 2)' : 'Certification Exam Simulation'}</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'calculator'}
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-[#10142e] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{isAr ? 'حاسبة الأهلية السريعة' : 'Eligibility Calculator'}</span>
          </button>
        </div>

        {onOpenRoadmap && (
          <button
            onClick={onOpenRoadmap}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold"
          >
            <span>{isAr ? 'عرض خريطة مسار التعلم ←' : 'View Learning Roadmap →'}</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: EXAM CATALOG & ELIGIBILITY REQUIREMENTS
         ========================================================================= */}
      {activeTab === 'catalog' && (
        <section aria-label={isAr ? 'دليل الاختبارات' : 'Exam Catalog'} className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0a0d21] border border-slate-800 p-4 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5 pointer-events-none" />
              <input
                type="text"
                aria-label={isAr ? 'بحث في أمثلة الاختبارات' : 'Search example exams'} value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث برمز الاختبار أو الطريقة أو الكود (ASNT, UT, API 570, CSWIP, ISO 9712...)'
                    : 'Search by exam code, technique, or body (ASNT, UT, API 570, CSWIP, ISO 9712...)'
                }
                className="w-full bg-[#070918] border border-slate-700 rounded-xl py-2 ps-10 pe-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Scheme Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold shrink-0">{isAr ? 'نظام الاعتماد:' : 'Scheme:'}</span>
              <select
                aria-label={isAr ? 'نظام التأهيل' : 'Qualification scheme'} value={selectedSchemeFilter}
                onChange={e => setSelectedSchemeFilter(e.target.value)}
                className="bg-[#070918] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">{isAr ? 'كافة الهيئات' : 'All Schemes'}</option>
                <option value="ASNT SNT-TC-1A">ASNT SNT-TC-1A</option>
                <option value="ISO 9712">ISO 9712</option>
                <option value="API ICP">API ICP</option>
                <option value="CSWIP / AWS">CSWIP / AWS</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold shrink-0">{isAr ? 'المستوى:' : 'Level:'}</span>
              <select
                aria-label={isAr ? 'المستوى' : 'Level'} value={selectedLevelFilter}
                onChange={e => setSelectedLevelFilter(e.target.value)}
                className="bg-[#070918] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">{isAr ? 'كافة المستويات' : 'All Levels'}</option>
                <option value="level1">Level I</option>
                <option value="level2">Level II</option>
                <option value="level3">Level III</option>
                <option value="inspector">Authorized Inspector</option>
              </select>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredExams.map((exam) => {
              const eligReport = checkCandidateEligibility(exam);

              return (
                <div
                  key={exam.id}
                  className="rounded-3xl border border-slate-800 bg-[#0b0e24] p-6 space-y-5 hover:border-amber-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#141a40] text-amber-300 border border-amber-500/30">
                          {exam.code}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                          {exam.accreditationBody}
                        </span>
                      </div>

                      {/* Eligibility Status Tag */}
                      {eligReport.isEligible ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isAr ? 'مستوفٍ في المثال التدريبي' : 'Met in this example'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {isAr ? 'متطلبات قيد الإنجاز' : 'Prerequisites In-Progress'}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-lg font-black text-white hover:text-amber-200 transition">
                        {exam.title[language]}
                      </h4>
                      <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
                        {exam.scopeSummary[language]}
                      </p>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-[#060818] p-3 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">{isAr ? 'مدة المثال' : 'Example duration'}</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          {exam.examFormat.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">{isAr ? 'هدف التدريب' : 'Practice target'}</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {exam.examFormat.passingScorePercent}%
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-300 block text-[11px]">{isAr ? 'الاستخدام' : 'Use'}</span>
                        <span className="font-bold">{isAr ? 'تدريبي' : 'Practice'}</span>
                      </div>
                    </div>

                    {/* Format Breakdown */}
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>{isAr ? 'تركيبة الاختبار:' : 'Exam Structure:'}</span>
                        <span className="text-slate-200">
                          {exam.examFormat.generalQuestions} {isAr ? 'عام' : 'General'} + {exam.examFormat.specificQuestions} {isAr ? 'خاص كودي' : 'Specific'} {exam.examFormat.practicalSamples > 0 && `+ ${exam.examFormat.practicalSamples} ${isAr ? 'عينات عملية' : 'Practical samples'}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isAr ? 'الأكواد المرجعية:' : 'Governing Codes:'}</span>
                        <span className="text-cyan-300 font-mono text-[11px] truncate max-w-[240px]">
                          {exam.prerequisites.applicableCodes.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => setViewingEligibilityExam(exam)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#141a3d] hover:bg-[#1d2557] text-sky-300 border border-sky-500/25 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'شروط الأهلية بالتفصيل' : 'View Eligibility'}</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => startMockTest(exam.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
                        title={isAr ? 'خوض تدريب تجريبي محاكي للاختبار' : 'Launch Mock Practice Exam'}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'امتحان تجريبي' : 'Mock Test'}</span>
                      </button>

                      <button
                        type="button" aria-haspopup="dialog"
                        onClick={() => openPlanner(exam)}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isAr ? 'خطّط للمذاكرة' : 'Plan study session'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'registrations' && (
        <section aria-label={isAr ? 'خطط المذاكرة' : 'Study plans'} className="space-y-4">
          <h3 className="text-xl font-bold text-white">{isAr ? 'خطط المذاكرة' : 'My study plans'}</h3>
          <p className="text-sm text-slate-300">{isAr ? 'الخطط شخصية ولا تُرسل لأي جهة. قد لا تنتقل معك إلى جهاز أو جلسة أخرى.' : 'Plans are personal and are not sent anywhere. They may not follow you to another device or session.'}</p>
          {plans.length === 0 && <p className="text-sm text-slate-300">{isAr ? 'لا توجد خطط مذاكرة محفوظة.' : 'No study plans saved.'}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {plans.map(plan => (
              <article key={plan.id} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h4 className="font-bold">{exams.find(exam => exam.id === plan.examId)?.title[language]}</h4>
                <p className="text-sm text-slate-300"><bdi>{plan.studyOn}</bdi></p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-haspopup="dialog" onClick={() => setViewingPlan(plan)} className="rounded-lg border border-slate-600 px-3 py-2 text-sm">{isAr ? 'عرض وطباعة الخطة' : 'View or print plan'}</button>
                  <button type="button" onClick={() => {
                    const removed = removeExamPracticePlan(plan.id);
                    setSaveFailed(!removed);
                    if (removed) setPlans(getExamPracticePlans());
                  }} className="rounded-lg border border-slate-600 px-3 py-2 text-sm">{isAr ? 'حذف الخطة' : 'Remove plan'}</button>
                </div>
              </article>
            ))}
          </div>
          {saveFailed && <p role="alert" className="text-sm text-rose-300">{isAr ? 'تعذّر تحديث الخطط.' : 'Could not update study plans.'}</p>}
          <button type="button" onClick={() => setActiveTab('catalog')} className="rounded-lg bg-sky-300 px-3 py-2 text-sm font-bold text-slate-950">{isAr ? 'استعرض أمثلة الاختبارات' : 'Browse example exams'}</button>
        </section>
      )}

      {/* =========================================================================
          TAB 3: PRE-EXAM MOCK PRACTICE TEST SIMULATOR
         ========================================================================= */}
      {activeTab === 'mock_test' && (
        <section aria-label={isAr ? 'الاختبار التجريبي' : 'Mock Practice Test'} className="space-y-6">
          {!isTestRunning && !isTestSubmitted ? (
            /* Mock Test Launch Screen */
            <div className="rounded-3xl border border-slate-800 bg-[#0c0f26] p-6 sm:p-10 space-y-6 max-w-3xl mx-auto shadow-2xl">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-white">
                  {isAr ? 'محاكي اختبارات الفحص غير الإتلافي' : 'NDT Mock Test Simulator'}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                  {isAr
                    ? 'تدرب في بيئة اختبار زمنية حقيقية مطابقة لاختبارات ASNT SNT-TC-1A و ISO 9712 و API. يتضمن الامتحان أسئلة فيزياء عامة، وأسئلة كودية محددة، وحالات تقييم عيوب عملية مع توضيحات كودية فورية.'
                    : 'Experience a timed examination simulating ASNT SNT-TC-1A, ISO 9712, and API exam conditions. Test your grasp of General Physics, Specific Codes, and Practical Flaw Sizing with detailed clause explanations.'}
                </p>
              </div>

              {/* Selector Controls */}
              <div className="grid sm:grid-cols-2 gap-4 bg-[#070918] p-5 rounded-2xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{isAr ? 'اختر تخصص الاختبار التجريبي:' : 'Select Target Exam Specialty:'}</label>
                  <select
                    aria-label={isAr ? 'موضوع الاختبار التجريبي' : 'Practice exam specialty'} value={mockExamId}
                    onChange={e => setMockExamId(e.target.value)}
                    className="w-full bg-[#0d102c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.code} - {isAr ? e.title.ar : e.title.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{isAr ? 'قسم الامتحان المستهدف:' : 'Examination Section Target:'}</label>
                  <select
                    aria-label={isAr ? 'قسم الاختبار التجريبي' : 'Practice exam section'} value={mockSection}
                    onChange={e => setMockSection(e.target.value as any)}
                    className="w-full bg-[#0d102c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">{isAr ? 'شامل (عام + كودي محدد + عملي)' : 'Full Composite (General + Specific + Practical)'}</option>
                    <option value="general">{isAr ? 'الجزء العام: فيزياء ومبادئ الطرق' : 'Part A: General Theory & Principles'}</option>
                    <option value="specific">{isAr ? 'الجزء المحدد: أكواد ASME / API / AWS' : 'Part B: Specific Code Requirements'}</option>
                    <option value="practical">{isAr ? 'الجزء العملي: توصيف وتقييم العيوب' : 'Part C: Practical Interpretation & Sizing'}</option>
                  </select>
                </div>
              </div>

              {/* Exam Rules & Advice */}
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-200/90 space-y-2">
                <strong className="block text-amber-300 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  {isAr ? 'تعليمات ونظام الاختبار التجريبي:' : 'Mock Examination Rules & Scoring Benchmark:'}
                </strong>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  <li>{isAr ? 'زمن الاختبار: 45 دقيقة مؤقتة مع تنبيهات عند اقتراب النهاية.' : 'Timer duration: 45 minutes countdown with alerts.'}</li>
                  <li>{isAr ? 'هدف التدريب المقررة: 70% كحد أدنى لكل قسم، أو 80% في ASNT المركب.' : 'Passing threshold: 70% minimum per part (80% composite for ASNT).' }</li>
                  <li>{isAr ? 'يمكنك وضع علامة (Flag) على أي سؤال لمراجعته لاحقاً قبل التسليم النهائي.' : 'You can Flag questions to review later before final submission.'}</li>
                </ul>
              </div>

              {/* Start Button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => startMockTest()}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black text-sm transition shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isAr ? 'بدء الاختبار التجريبي الآن' : 'Start Mock Practice Test Now'}</span>
                </button>
              </div>
            </div>
          ) : isTestRunning && !isTestSubmitted ? (
            /* Active Live Test Simulator */
            <div className="rounded-3xl border border-slate-800 bg-[#0c0f24] p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Header with Timer and Progress */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
                    {mockExamId.toUpperCase()} • MOCK EXAMINATION
                  </span>
                  <h4 className="text-lg font-black text-white">
                    {isAr ? `السؤال ${currentQuestionIdx + 1} من ${testQuestions.length}` : `Question ${currentQuestionIdx + 1} of ${testQuestions.length}`}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  {/* Timer display */}
                  <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-sm font-black ${
                    remainingSeconds < 300
                      ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                      : 'bg-[#15193f] text-sky-300 border-sky-500/30'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(remainingSeconds)}</span>
                  </div>

                  <button
                    onClick={handleSubmitMockTest}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition cursor-pointer shadow"
                  >
                    {isAr ? 'إنهاء وتسليم الاختبار' : 'Submit Exam'}
                  </button>
                </div>
              </div>

              {/* Question Navigation Matrix */}
              <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-[#060818] border border-slate-800">
                <span className="text-xs text-slate-400 font-bold me-2">{isAr ? 'خريطة الأسئلة:' : 'Question Grid:'}</span>
                {testQuestions.map((_, qIdx) => {
                  const isAnswered = answers[qIdx] !== undefined;
                  const isCurrent = currentQuestionIdx === qIdx;
                  const isFlagged = flaggedQuestions[qIdx];

                  return (
                    <button
                      key={qIdx}
                      onClick={() => setCurrentQuestionIdx(qIdx)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center relative cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                          : isAnswered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#10132b] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {qIdx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Current Question View */}
              {testQuestions[currentQuestionIdx] && (() => {
                const q = testQuestions[currentQuestionIdx];
                const selectedOption = answers[currentQuestionIdx];

                return (
                  <div className="space-y-6">
                    {/* Domain & Code Reference */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                        {q.domain} • Part {q.section.toUpperCase()}
                      </span>
                      {q.codeReference && (
                        <span className="font-mono text-cyan-300 bg-[#12163b] px-3 py-1 rounded-full border border-cyan-500/30">
                          {q.codeReference}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setFlaggedQuestions(prev => ({ ...prev, [currentQuestionIdx]: !prev[currentQuestionIdx] }));
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          flaggedQuestions[currentQuestionIdx]
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{flaggedQuestions[currentQuestionIdx] ? (isAr ? 'تم تعليم السؤال' : 'Flagged') : (isAr ? 'تعليم للمراجعة' : 'Flag Question')}</span>
                      </button>
                    </div>

                    {/* Question Statement */}
                    <div className="bg-[#0a0d24] p-5 rounded-2xl border border-slate-800">
                      <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {q.question[language]}
                      </h4>
                    </div>

                    {/* Options List */}
                    <div className="space-y-3">
                      {q.options[language].map((optText, optIdx) => {
                        const isChosen = selectedOption === optIdx;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              setAnswers(prev => ({ ...prev, [currentQuestionIdx]: optIdx }));
                            }}
                            className={`w-full text-start p-4 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                              isChosen
                                ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                                : 'bg-[#0a0d24] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                              isChosen
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-xs sm:text-sm leading-relaxed">{optText}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <button
                        disabled={currentQuestionIdx === 0}
                        onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#141a3d] text-slate-200 hover:bg-[#1f275c] disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                      >
                        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{isAr ? 'السؤال السابق' : 'Previous Question'}</span>
                      </button>

                      {currentQuestionIdx < testQuestions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                          className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 hover:bg-amber-400 transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? 'السؤال التالي' : 'Next Question'}</span>
                          {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitMockTest}
                          className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? 'تسليم الاختبار النهائي' : 'Submit Mock Exam'}</span>
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Mock Test Performance Analytics & Review */
            mockScoreResults && (
              <div className="rounded-3xl border border-slate-800 bg-[#0c0f24] p-6 sm:p-10 space-y-8 shadow-2xl">
                {/* Result Hero Header */}
                <div className="text-center space-y-3 pb-6 border-b border-slate-800">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-2xl ${
                    mockScoreResults.passed
                      ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50'
                      : 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/50'
                  }`}>
                    {mockScoreResults.passed ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {mockScoreResults.passed
                      ? (isAr ? 'تهانينا! لقد اجتزت الاختبار التجريبي بنجاح' : 'Congratulations! You Passed the Mock Test')
                      : (isAr ? 'نتيجة الاختبار التجريبي - بحاجة لمزيد من المراجعة' : 'Mock Test Results - Further Review Needed')}
                  </h3>

                  <div className="flex items-center justify-center gap-4 text-sm font-bold">
                    <span className="text-slate-300">
                      {isAr ? 'الدرجة المحققة:' : 'Score:'} <strong className="text-2xl text-amber-300 font-mono ms-1">{mockScoreResults.percent}%</strong>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      {isAr ? 'الأسئلة الصحيحة:' : 'Correct Answers:'} <strong className="text-emerald-400 font-mono">{mockScoreResults.correct} / {mockScoreResults.total}</strong>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      {isAr ? 'حد النجاح:' : 'Passing Mark:'} <strong className="text-slate-400 font-mono">70%</strong>
                    </span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => startMockTest()}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isAr ? 'إعادة الاختبار التجريبي' : 'Retake Mock Test'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isAr ? 'راجع أمثلة الاختبارات' : 'Review exam examples'}</span>
                  </button>
                </div>

                {/* Question-by-Question Detailed Review */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                    <BookOpen className="w-5 h-5 text-sky-400" />
                    <span>{isAr ? 'المراجعة التحليلية الشاملة وتفسيرات الأكواد' : 'Detailed Question Review & Code Explanations'}</span>
                  </h4>

                  <div className="space-y-4">
                    {testQuestions.map((q, idx) => {
                      const userChoice = answers[idx];
                      const isCorrect = userChoice === q.correctAnswer;

                      return (
                        <div
                          key={q.id}
                          className={`p-5 rounded-2xl border space-y-3 ${
                            isCorrect
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-red-950/20 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <X className="w-4 h-4 text-red-400" />
                              )}
                              <span>{isAr ? `السؤال ${idx + 1}` : `Question ${idx + 1}`}</span>
                            </span>

                            {q.codeReference && (
                              <span className="font-mono text-cyan-300 bg-slate-900 px-2.5 py-0.5 rounded text-[11px] border border-slate-800">
                                {q.codeReference}
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                            {q.question[language]}
                          </p>

                          <div className="text-xs space-y-1">
                            <div className="text-slate-300">
                              <span className="text-slate-400">{isAr ? 'إجابتك: ' : 'Your Answer: '}</span>
                              <strong className={isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                                {userChoice !== undefined ? q.options[language][userChoice] : (isAr ? 'لم تتم الإجابة' : 'Unanswered')}
                              </strong>
                            </div>

                            {!isCorrect && (
                              <div className="text-emerald-300">
                                <span className="text-slate-400">{isAr ? 'الإجابة الصحيحة: ' : 'Correct Answer: '}</span>
                                <strong>{q.options[language][q.correctAnswer]}</strong>
                              </div>
                            )}
                          </div>

                          {/* Technical Code Explanation */}
                          <div className="p-3 bg-[#070918] rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                            <strong className="text-amber-400 block mb-1 font-semibold">
                              {isAr ? 'التفسير الهندسي والمرجع الكودي:' : 'Technical Engineering Rationale:'}
                            </strong>
                            <p>{q.explanation[language]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 4: QUICK ELIGIBILITY CALCULATOR
         ========================================================================= */}
      {activeTab === 'calculator' && (
        <section aria-label={isAr ? 'حاسبة الأهلية' : 'Eligibility Calculator'} className="space-y-6 max-w-3xl mx-auto">
          <div className="rounded-3xl border border-slate-800 bg-[#0c0f26] p-6 sm:p-10 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? 'حاسبة أهلية مستويات NDT وشهادات التفتيش' : 'Interactive NDT Certification Eligibility Calculator'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
                {isAr
                  ? 'أدخل ساعات تدريبك وخبرتك الميدانية الموثقة لتحديد المستوى الأنسب والأكواد التي تؤهلك لدخول امتحاناتها.'
                  : 'Enter your documented training hours, field experience, and education to instantly evaluate which certification level you qualify for.'}
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-4 bg-[#070918] p-5 rounded-2xl border border-slate-800">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>{isAr ? 'ساعات الدراسة / التدريب المدخلة:' : 'Reported study / training hours:'}</span>
                  <span className="text-amber-400 font-mono">{calcHours} {isAr ? 'ساعة' : 'hours'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="240"
                  step="10"
                  aria-label={isAr ? 'ساعات التدريب' : 'Training hours'} value={calcHours}
                  onChange={e => setCalcHours(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>{isAr ? 'الخبرة الميدانية الموثقة (بالأشهر):' : 'Documented Field Experience (Months):'}</span>
                  <span className="text-sky-400 font-mono">{calcExperienceMonths} {isAr ? 'شهراً' : 'months'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="1"
                  aria-label={isAr ? 'شهور الخبرة' : 'Experience in months'} value={calcExperienceMonths}
                  onChange={e => setCalcExperienceMonths(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">{isAr ? 'المؤهل الأكاديمي الأساسي:' : 'Educational Qualification Level:'}</label>
                <select
                  aria-label={isAr ? 'المؤهل التعليمي' : 'Education level'} value={calcEducation}
                  onChange={e => setCalcEducation(e.target.value as any)}
                  className="w-full bg-[#0d102c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="high_school">{isAr ? 'ثانوية عامة / دبلوم فني متوسط' : 'High School Diploma / Vocational'}</option>
                  <option value="associate_diploma">{isAr ? 'دبلوم تقني صناعي سنتين أو ثلاث' : '2-3 Year Technical Industrial Diploma'}</option>
                  <option value="bsc_engineering">{isAr ? 'بكالوريوس هندسة ميكانيكية / فلزات / فيزياء' : 'B.Sc. Mechanical / Metallurgy / Physics'}</option>
                </select>
              </div>
            </div>

            {/* Calculated Result Card */}
            {(() => {
              let eligibleLevel = 'Pre-Level I Foundation';
              let eligibleTitleAr = 'المستوى التمهيدي للأساس العلمي (Pre-Level I)';
              let eligibleTitleEn = 'Pre-Level I Scientific Foundation';
              let descriptionAr = 'راجع المثال للمستوى الأول. شروط التأهيل الفعلية تحددها جهة العمل أو الجهة المانحة.';
              let descriptionEn = 'Review the entry-level example. Actual requirements depend on the employer or certifying body.';

              if (calcHours >= 160 && calcExperienceMonths >= 24) {
                eligibleLevel = 'Level III / API 570 Inspector';
                eligibleTitleAr = 'مثال متقدم للمستوى الثالث أو API 570/510';
                eligibleTitleEn = 'Advanced Level III / API 570 example';
                descriptionAr = 'مدخلاتك تطابق هذا المثال المتقدم. لا تمنحك إذنًا للتفتيش أو لاعتماد الإجراءات.';
                descriptionEn = 'Your input matches this advanced study example, not an authorization to inspect or approve procedures.';
              } else if (calcHours >= 80 && calcExperienceMonths >= 9) {
                eligibleLevel = 'Level II Senior Inspector';
                eligibleTitleAr = 'مثال دراسة للمستوى الثاني (Level II)';
                eligibleTitleEn = 'Level II study example';
                descriptionAr = 'مدخلاتك تطابق هذا المثال، وليس ذلك إذنًا لتقييم العيوب أو توقيع التقارير.';
                descriptionEn = 'Your input matches this example, not an authorization to evaluate flaws or sign reports.';
              } else if (calcHours >= 40 && calcExperienceMonths >= 3) {
                eligibleLevel = 'Level I Operator';
                eligibleTitleAr = 'مثال دراسة للمستوى الأول (Level I)';
                eligibleTitleEn = 'Level I study example';
                descriptionAr = 'مدخلاتك تطابق هذا المثال، لا متطلبات تشغيل المعدات ميدانيًا.';
                descriptionEn = 'Your input matches this example, not the requirements for operating equipment in the field.';
              }

              return (
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#0c1a2e] to-[#070e1c] p-5 space-y-3">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                    {isAr ? 'نتيجة المقارنة التدريبية' : 'ILLUSTRATIVE STUDY MATCH'}
                  </span>
                  <h4 className="text-xl font-black text-white">
                    {isAr ? eligibleTitleAr : eligibleTitleEn}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {isAr ? descriptionAr : descriptionEn}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition cursor-pointer"
                    >
                      {isAr ? 'استعرض أمثلة الاختبارات' : 'Browse exam examples'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 5: DYNAMIC NDT LEVEL 1 & 2 CERTIFICATION EXAM SIMULATION
         ========================================================================= */}
      {activeTab === 'exam_simulation' && (
        <section aria-label={isAr ? 'محاكي امتحانات التأهيل' : 'Certification Exam Simulation'} className="space-y-6">
          <CertificationExamSimulation
            language={language}
            onNavigateToCurriculumModule={onNavigateToModule}
          />
        </section>
      )}

      {/* =========================================================================
          MODAL 1: VIEW DETAILED ELIGIBILITY REQUIREMENTS
         ========================================================================= */}
      {viewingEligibilityExam && (
        <PracticeDialog title={viewingEligibilityExam.title[language]} closeLabel={closeLabel} onClose={() => setViewingEligibilityExam(null)}>
            <p className="text-sm text-sky-200">{practiceNotice}</p>
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-[#070918] p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-semibold">{isAr ? 'ساعات التدريب المطلوبة:' : 'Training Hours Required:'}</span>
                  <p className="text-white font-bold text-base">{viewingEligibilityExam.prerequisites.trainingHours} {isAr ? 'ساعة تدريب في المثال' : 'Example training hours'}</p>
                </div>

                <div className="bg-[#070918] p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-semibold">{isAr ? 'الخبرة الميدانية المطلوبة:' : 'Field Experience Required:'}</span>
                  <p className="text-white font-bold text-base">{viewingEligibilityExam.prerequisites.experienceMonths} {isAr ? 'شهراً موثقاً' : 'Logged Months'}</p>
                </div>
              </div>

              <div className="bg-[#070918] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  {isAr ? 'فحص حدة النظر وتمييز الألوان:' : 'Vision Acuity & Color Contrast Standard:'}
                </span>
                <p className="text-slate-200 leading-relaxed">{viewingEligibilityExam.prerequisites.visionAcuity[language]}</p>
              </div>

              <div className="bg-[#070918] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  {isAr ? 'الحد الأدنى للمؤهل التعليمي:' : 'Minimum Educational Level:'}
                </span>
                <p className="text-slate-200">{viewingEligibilityExam.prerequisites.minimumEducation[language]}</p>
              </div>

              <div className="bg-[#070918] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">{isAr ? 'المراجع لهذا المثال:' : 'References for this example:'}</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {viewingEligibilityExam.prerequisites.applicableCodes.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-[#13173d] text-cyan-300 font-mono text-xs border border-cyan-500/30">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setViewingEligibilityExam(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                onClick={() => {
                  const target = viewingEligibilityExam;
                  setViewingEligibilityExam(null);
                  openPlanner(target);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition cursor-pointer"
              >
                {isAr ? 'خطّط للمذاكرة' : 'Plan a study session'}
              </button>
            </div>
        </PracticeDialog>
      )}

      {planningExam && (
        <PracticeDialog title={isAr ? 'خطة مذاكرة' : 'Plan a study session'} closeLabel={closeLabel} onClose={() => setPlanningExam(null)}>
          <p className="text-sm text-sky-200">{practiceNotice}</p>
          <p className="font-bold">{planningExam.title[language]}</p>
          <form onSubmit={handleSavePlan} className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="block">{isAr ? 'تاريخ المذاكرة' : 'Study date'}</span>
              <input type="date" required value={studyOn} onChange={e => setStudyOn(e.target.value)} className="w-full min-w-0 rounded-lg border border-slate-600 bg-slate-900 p-2" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="block">{isAr ? 'طريقة المذاكرة' : 'Study format'}</span>
              <select value={format} onChange={e => setFormat(e.target.value as ExamPracticePlan['format'])} className="w-full min-w-0 rounded-lg border border-slate-600 bg-slate-900 p-2">
                <option value="in_person">{isAr ? 'مذاكرة حضورية' : 'In-person study'}</option>
                <option value="remote">{isAr ? 'مذاكرة عن بُعد' : 'Remote study'}</option>
              </select>
            </label>
            {saveFailed && <p role="alert" className="text-sm text-rose-300">{isAr ? 'تعذّر حفظ الخطة. تحقّق من التاريخ وحاول مرة أخرى.' : 'Could not save this plan. Check the date and try again.'}</p>}
            <button type="submit" className="rounded-lg bg-sky-300 px-4 py-2 text-sm font-bold text-slate-950">{isAr ? 'احفظ خطة المذاكرة' : 'Save study plan'}</button>
          </form>
        </PracticeDialog>
      )}
      {viewingPlan && (
        <PracticeDialog title={isAr ? 'خطة مذاكرة محفوظة' : 'Saved study plan'} closeLabel={closeLabel} onClose={() => setViewingPlan(null)}>
          <p className="text-sm">{practiceNotice}</p>
          <p className="font-bold">{exams.find(exam => exam.id === viewingPlan.examId)?.title[language]}</p>
          <p className="text-sm"><bdi>{viewingPlan.studyOn}</bdi> · {viewingPlan.format === 'remote' ? (isAr ? 'مذاكرة عن بُعد' : 'Remote study') : (isAr ? 'مذاكرة حضورية' : 'In-person study')}</p>
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-500 px-3 py-2 text-sm print:hidden">{isAr ? 'طباعة خطة المذاكرة' : 'Print study plan'}</button>
        </PracticeDialog>
      )}
    </div>
  );
};
