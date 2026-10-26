import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  User,
  ShieldCheck,
  Printer,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  Sparkles,
  HelpCircle,
  Building2,
  Check,
  X,
  RotateCcw,
  Flag,
  ChevronRight,
  Eye,
  BookOpen,
  Layers,
  GraduationCap,
  ExternalLink,
  Download,
  AlertTriangle,
  Play,
  Calculator
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../../types';
import {
  OfficialExam,
  ExamRegistration,
  MockExamQuestion,
  MOCK_EXAM_QUESTIONS,
  getOfficialExams,
  getExamRegistrations,
  registerForExam,
  cancelExamRegistration,
  checkCandidateEligibility,
  getMockExamQuestions,
  EXAM_CENTERS
} from '../../utils/certificationExamService';

interface CertificationCenterProps {
  language: Language;
  onNavigateToModule?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
  onOpenRoadmap?: () => void;
  initialTab?: 'catalog' | 'registrations' | 'mock_test' | 'calculator';
}

export const CertificationCenter: React.FC<CertificationCenterProps> = ({
  language,
  onNavigateToModule,
  onOpenRoadmap,
  initialTab = 'catalog'
}) => {
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'catalog' | 'registrations' | 'mock_test' | 'calculator'>(initialTab);
  const [exams, setExams] = useState<OfficialExam[]>([]);
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([]);
  
  // Search & Filter state for catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  
  // Detailed Eligibility Modal / Drawer
  const [viewingEligibilityExam, setViewingEligibilityExam] = useState<OfficialExam | null>(null);

  // Registration Modal State
  const [registeringExam, setRegisteringExam] = useState<OfficialExam | null>(null);
  const [candidateName, setCandidateName] = useState('Eng. NDT Candidate');
  const [candidateEmail, setCandidateEmail] = useState('candidate@insco-ndt.com');
  const [nationalId, setNationalId] = useState('EGY-2940815-12345');
  const [phone, setPhone] = useState('+20 100 123 4567');
  const [company, setCompany] = useState('Petrochem Inspection Services');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCenter, setSelectedCenter] = useState<string>(EXAM_CENTERS[0].id);
  const [formatMode, setFormatMode] = useState<'in_person_center' | 'remote_proctored'>('in_person_center');
  const [visionConfirmed, setVisionConfirmed] = useState(true);
  const [ethicsAgreed, setEthicsAgreed] = useState(true);
  const [registrationSuccessTicket, setRegistrationSuccessTicket] = useState<ExamRegistration | null>(null);

  // Viewing Admission Slip Modal
  const [viewingTicket, setViewingTicket] = useState<ExamRegistration | null>(null);

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

  // Load Exams and Registrations
  const refreshData = () => {
    setExams(getOfficialExams());
    setRegistrations(getExamRegistrations());
  };

  useEffect(() => {
    refreshData();
    const handleUpdated = () => refreshData();
    window.addEventListener('insco_exam_registered', handleUpdated);
    window.addEventListener('insco_exam_registration_cancelled', handleUpdated);
    return () => {
      window.removeEventListener('insco_exam_registered', handleUpdated);
      window.removeEventListener('insco_exam_registration_cancelled', handleUpdated);
    };
  }, []);

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

  // Handle Register Form Submit
  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringExam) return;
    if (!visionConfirmed || !ethicsAgreed) {
      alert(isAr ? 'يرجى تأكيد إقرار فحص النظر وميثاق النزاهة المهنية' : 'Please confirm vision acuity and code of ethics');
      return;
    }

    const regDate = selectedDate || registeringExam.upcomingDates[0]?.date || '2026-11-25';
    const reg = registerForExam({
      examId: registeringExam.id,
      candidateName,
      candidateEmail,
      nationalIdOrPassport: nationalId,
      phone,
      companyOrUniversity: company,
      examDate: regDate,
      examCenter: selectedCenter,
      examFormatMode: formatMode,
      visionAttestationConfirmed: visionConfirmed,
      codeOfEthicsAgreed: ethicsAgreed
    });

    setRegisteringExam(null);
    setRegistrationSuccessTicket(reg);
    refreshData();
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Handle Cancel Registration
  const handleCancelRegistration = (regId: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من إلغاء حجز هذا الاختبار؟' : 'Are you sure you want to cancel this exam registration?')) {
      cancelExamRegistration(regId);
      refreshData();
      if (viewingTicket?.registrationId === regId) {
        setViewingTicket(null);
      }
    }
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

  // Print Admission Ticket
  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full space-y-8 animate-fadeIn text-slate-100">
      
      {/* 1. HERO BANNER: OFFICIAL NDT CERTIFICATION & TESTING CENTER */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#12163b] via-[#0d102b] to-[#080a1c] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-10 -ms-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
              <Award className="w-4 h-4 text-amber-400" />
              <span>INSCO • OFFICIAL NDT CERTIFICATION & ASSESSMENT CENTER</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                ✓ {isAr ? 'أنظمة معتمدة: ASNT / ISO 9712 / API / CSWIP' : 'Accredited Schemes: ASNT / ISO 9712 / API / CSWIP'}
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {isAr ? 'مركز تسجيل شهادات واختبارات NDT المعتمدة' : 'Official NDT Certification & Exam Registration Center'}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
            {isAr
              ? 'بوابتك الرسمية للتحقق من شروط الأهلية والخبرة الميدانية، والتسجيل في دورات الاختبارات المهنية المعتمدة لـ ASNT و ISO 9712 و API و CSWIP، مع إمكانية خوض الاختبارات التجريبية المحاكية (Mock Exams) قبل الدخول الفعلي.'
              : 'Your centralized portal to audit prerequisites, register for proctored NDT qualification exams (ASNT SNT-TC-1A, ISO 9712, API ICP, CSWIP), download official admission slips, and master pre-exam mock practice tests.'}
          </p>

          {/* Top Quick Status Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-2xl border border-slate-800 bg-[#0c0f24]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'الاختبارات الرسمية المتاحة' : 'Official Exams Catalog'}
              </span>
              <div className="text-2xl font-black text-white">{exams.length} {isAr ? 'شهادة' : 'Certs'}</div>
              <span className="text-[11px] text-amber-400/80 mt-1 block">
                Level I, Level II, Level III & API
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0c0f24]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                {isAr ? 'حجوزاتك المؤكدة' : 'Active Registrations'}
              </span>
              <div className="text-2xl font-black text-sky-300">{registrations.length}</div>
              <span className="text-[11px] text-sky-400/80 mt-1 block">
                {registrations.length > 0 ? (isAr ? 'بطاقة الدخول جاهزة' : 'Admission slips ready') : (isAr ? 'لا توجد حجوزات نشطة' : 'No active bookings')}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0c0f24]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                {isAr ? 'المراكز المعتمدة دولياً' : 'Authorized Testing Centers'}
              </span>
              <div className="text-2xl font-black text-purple-300">{EXAM_CENTERS.length}</div>
              <span className="text-[11px] text-purple-400/80 mt-1 block">
                {isAr ? 'الشرق الأوسط وأوروبا وأمريكا' : 'Middle East, UK & USA'}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0c0f24]/80 p-3.5 backdrop-blur-sm">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'بنك الاختبارات التجريبية' : 'Mock Practice Bank'}
              </span>
              <div className="text-2xl font-black text-emerald-300">{MOCK_EXAM_QUESTIONS.length}+</div>
              <span className="text-[11px] text-emerald-400/80 mt-1 block">
                {isAr ? 'أسئلة عامة وخاصة وعملية' : 'General, Specific & Practical'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION SEGMENT TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
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
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer relative ${
              activeTab === 'registrations'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-[#10142e] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'حجوزاتي وبطاقات الدخول' : 'My Registrations & Slips'}</span>
            {registrations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                {registrations.length}
              </span>
            )}
          </button>

          <button
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
                value={searchQuery}
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
                value={selectedSchemeFilter}
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
                value={selectedLevelFilter}
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
                      <div className="flex items-center gap-2">
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
                          {isAr ? 'مستوفٍ للشروط المبدئية' : 'Eligible to Register'}
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
                        <span className="text-slate-400 block text-[11px] mb-0.5">{isAr ? 'مدة الامتحان' : 'Duration'}</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          {exam.examFormat.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">{isAr ? 'نسبة النجاح' : 'Pass Score'}</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {exam.examFormat.passingScorePercent}%
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">{isAr ? 'رسوم الدخول' : 'Official Fee'}</span>
                        <span className="font-bold text-amber-300 font-mono">
                          ${exam.feeUSD}
                        </span>
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startMockTest(exam.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
                        title={isAr ? 'خوض تدريب تجريبي محاكي للاختبار' : 'Launch Mock Practice Exam'}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'امتحان تجريبي' : 'Mock Test'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setRegisteringExam(exam);
                          setSelectedDate(exam.upcomingDates[0]?.date || '');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حجز موعد الاختبار' : 'Register for Exam'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 2: ACTIVE REGISTRATIONS & OFFICIAL ADMISSION SLIPS
         ========================================================================= */}
      {activeTab === 'registrations' && (
        <section aria-label={isAr ? 'حجوزات الاختبارات' : 'Active Registrations'} className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>{isAr ? 'حجوزاتك المؤكدة وبطاقات دخول الاختبارات' : 'Your Scheduled Exams & Admission Tickets'}</span>
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                {isAr
                  ? 'يرجى طباعة بطاقة الدخول (Admission Ticket) وإحضار إثبات الشخصية الأصلي يوم الاختبار إلى المركز المعتمد.'
                  : 'Please print your admission ticket and bring valid government photo ID to the test center on your scheduled date.'}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('catalog')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
            >
              + {isAr ? 'حجز اختبار جديد' : 'Register New Exam'}
            </button>
          </div>

          {registrations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center space-y-4 bg-[#0a0d24]">
              <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-white">{isAr ? 'لا توجد اختبارات مسجلة حالياً' : 'No Active Exam Registrations Found'}</h4>
              <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                {isAr
                  ? 'استعرض دليل الاختبارات الرسمية لاختيار الشهادة الأنسب لمسارك، واطلع على شروط الخبرة وساعات التدريب ثم أكد حجزك.'
                  : 'Explore the official exam catalog to choose the right qualification for your career path and schedule your examination session.'}
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                {isAr ? 'استعراض دليل الاختبارات الآن' : 'Browse Exam Catalog Now'}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {registrations.map((reg) => {
                const exam = exams.find(e => e.id === reg.examId) || exams[0];
                const centerObj = EXAM_CENTERS.find(c => c.id === reg.examCenter);

                return (
                  <div
                    key={reg.registrationId}
                    className="rounded-3xl border border-slate-800 bg-[#0d102c] p-6 space-y-4 shadow-xl hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                        {reg.admissionNumber}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {reg.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-black text-white">{exam.title[language]}</h4>
                      <p className="text-xs text-slate-400 mt-1">{isAr ? 'المرشح:' : 'Candidate:'} <strong className="text-white">{reg.candidateName}</strong></p>
                    </div>

                    <div className="bg-[#070918] p-3.5 rounded-2xl border border-slate-800/80 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          {isAr ? 'تاريخ الجلسة:' : 'Exam Date:'}
                        </span>
                        <span className="font-bold text-white">{reg.examDate}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                          {isAr ? 'المركز المعتمد:' : 'Testing Center:'}
                        </span>
                        <span className="font-medium text-slate-200 text-end truncate max-w-[200px]">
                          {centerObj ? (isAr ? centerObj.nameAr : centerObj.nameEn) : reg.examCenter}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">{isAr ? 'نظام الامتحان:' : 'Delivery Mode:'}</span>
                        <span className="font-bold text-emerald-400">
                          {reg.examFormatMode === 'in_person_center' ? (isAr ? 'حضوري بالمركز' : 'In-Person Center') : (isAr ? 'عن بُعد مع مراقب' : 'Remote Proctored')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setViewingTicket(reg)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{isAr ? 'عرض وطباعة بطاقة الدخول' : 'View Admission Ticket'}</span>
                      </button>

                      <button
                        onClick={() => handleCancelRegistration(reg.registrationId)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/25 transition cursor-pointer"
                      >
                        {isAr ? 'إلغاء الحجز' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  {isAr ? 'محاكي الاختبارات التأهيلية الرسمية لـ NDT' : 'Official NDT Pre-Exam Mock Test Simulator'}
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
                    value={mockExamId}
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
                    value={mockSection}
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
                  <li>{isAr ? 'نسبة النجاح المقررة: 70% كحد أدنى لكل قسم، أو 80% في ASNT المركب.' : 'Passing threshold: 70% minimum per part (80% composite for ASNT).' }</li>
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
                    <span>{isAr ? 'التسجيل في الاختبار الرسمي الحقيقي' : 'Register for Real Exam Session'}</span>
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
                  <span>{isAr ? 'ساعات التدريب الصفي/المعملي المعتمدة:' : 'Classroom & Simulator Training Hours:'}</span>
                  <span className="text-amber-400 font-mono">{calcHours} {isAr ? 'ساعة' : 'hours'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="240"
                  step="10"
                  value={calcHours}
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
                  value={calcExperienceMonths}
                  onChange={e => setCalcExperienceMonths(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">{isAr ? 'المؤهل الأكاديمي الأساسي:' : 'Educational Qualification Level:'}</label>
                <select
                  value={calcEducation}
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
              let descriptionAr = 'يوصى بإتمام المزيد من الساعات التدريبية للوصول لرتبة مشغل معتمد.';
              let descriptionEn = 'Recommended to accumulate more accredited training hours to qualify for Level I operator.';

              if (calcHours >= 160 && calcExperienceMonths >= 24) {
                eligibleLevel = 'Level III / API 570 Inspector';
                eligibleTitleAr = 'مستوى ثالث أو مفتش أنظمة API 570/510 معتمد';
                eligibleTitleEn = 'Level III Consultant / API 570 Authorized Inspector';
                descriptionAr = 'مؤهل للتقدم لامتحانات المستويات القيادية واعتماد إجراءات التفتيش.';
                descriptionEn = 'Qualified for senior authority exams, procedure approvals, and in-service plant inspection.';
              } else if (calcHours >= 80 && calcExperienceMonths >= 9) {
                eligibleLevel = 'Level II Senior Inspector';
                eligibleTitleAr = 'مفتش NDT المستوى الثاني (Level II Sizing & Acceptance)';
                eligibleTitleEn = 'Level II Senior NDT Inspector (Sizing & Acceptance)';
                descriptionAr = 'مؤهل لإجراء اختبارات المستوى الثاني الكودية وتقييم العيوب وتوقيع التقارير.';
                descriptionEn = 'Qualified for Level II exams, DAC curve calibrations, flaw sizing, and signing reports.';
              } else if (calcHours >= 40 && calcExperienceMonths >= 3) {
                eligibleLevel = 'Level I Operator';
                eligibleTitleAr = 'مشغل فحص غير إتلافي المستوى الأول (Level I Operator)';
                eligibleTitleEn = 'Level I Certified NDT Operator';
                descriptionAr = 'مؤهل لامتحانات المستوى الأول لمعايرة الأجهزة وتطبيق الفحص الميداني.';
                descriptionEn = 'Qualified for Level I calibration and field testing operator exams.';
              }

              return (
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#0c1a2e] to-[#070e1c] p-5 space-y-3">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                    {isAr ? 'نتيجة تقييم الأهلية المبدئية' : 'CALCULATED ELIGIBILITY STATUS'}
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
                      {isAr ? 'الانتقال لدليل الامتحانات والتسجيل ←' : 'Go to Exam Catalog & Register →'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* =========================================================================
          MODAL 1: VIEW DETAILED ELIGIBILITY REQUIREMENTS
         ========================================================================= */}
      {viewingEligibilityExam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1233] border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400">{viewingEligibilityExam.code}</span>
                <h3 className="text-xl font-black text-white mt-1">{viewingEligibilityExam.title[language]}</h3>
              </div>
              <button
                onClick={() => setViewingEligibilityExam(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-[#070918] p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-semibold">{isAr ? 'ساعات التدريب المطلوبة:' : 'Training Hours Required:'}</span>
                  <p className="text-white font-bold text-base">{viewingEligibilityExam.prerequisites.trainingHours} {isAr ? 'ساعة تدريبية معتمدة' : 'Accredited Hours'}</p>
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
                <span className="text-slate-400 block font-semibold">{isAr ? 'الأكواد المرجعية المقررة في الاختبار:' : 'Required Governing Codes:'}</span>
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
                  setRegisteringExam(target);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition cursor-pointer"
              >
                {isAr ? 'متابعة الحجز والتسجيل' : 'Proceed to Registration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EXAM REGISTRATION WORKFLOW FORM
         ========================================================================= */}
      {registeringExam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmRegistration}
            className="bg-[#0e1233] border border-amber-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl animate-scaleUp"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  {registeringExam.accreditationBody} • REGISTRATION FORM
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {registeringExam.title[language]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRegisteringExam(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">{isAr ? 'الاسم الكامل (كما في جواز السفر):' : 'Full Name (as in Passport):'}</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    className="w-full bg-[#070918] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">{isAr ? 'البريد الإلكتروني المهني:' : 'Email Address:'}</label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={e => setCandidateEmail(e.target.value)}
                    className="w-full bg-[#070918] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">{isAr ? 'رقم الهوية الوطنية / جواز السفر:' : 'National ID / Passport Number:'}</label>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value)}
                    className="w-full bg-[#070918] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">{isAr ? 'جهة العمل / الشركة / الجامعة:' : 'Company / Sponsor / University:'}</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full bg-[#070918] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">{isAr ? 'موعد جلسة الاختبار المفضلة:' : 'Select Examination Session Date:'}</label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {registeringExam.upcomingDates.map((d) => (
                    <label
                      key={d.id}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                        selectedDate === d.date
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-[#070918] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="examDate"
                        checked={selectedDate === d.date}
                        onChange={() => setSelectedDate(d.date)}
                        className="sr-only"
                      />
                      <span className="font-bold text-white block">{d.date}</span>
                      <span className="text-[11px] text-slate-400 mt-1">{d.session}</span>
                      <span className="text-[10px] text-emerald-400 mt-1">{d.seatsLeft} {isAr ? 'مقاعد شاغرة' : 'seats left'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Center Selection */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">{isAr ? 'المركز المعتمد للاختبار:' : 'Authorized Examination Center:'}</label>
                <select
                  value={selectedCenter}
                  onChange={e => setSelectedCenter(e.target.value)}
                  className="w-full bg-[#070918] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer text-xs sm:text-sm"
                >
                  {EXAM_CENTERS.map(c => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.nameAr : c.nameEn} ({c.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Format Mode */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">{isAr ? 'نظام أداء الاختبار:' : 'Test Delivery Option:'}</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className={`p-3 rounded-xl border cursor-pointer ${formatMode === 'in_person_center' ? 'bg-sky-500/20 border-sky-400 text-white' : 'bg-[#070918] border-slate-800 text-slate-300'}`}>
                    <input
                      type="radio"
                      name="formatMode"
                      checked={formatMode === 'in_person_center'}
                      onChange={() => setFormatMode('in_person_center')}
                      className="sr-only"
                    />
                    <strong className="block mb-1">{isAr ? 'حضوري بالمركز المعتمد' : 'In-Person Testing Center'}</strong>
                    <span className="text-[11px] text-slate-400">{isAr ? 'يشمل فحص العينات الحقيقية' : 'Includes physical specimens'}</span>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer ${formatMode === 'remote_proctored' ? 'bg-sky-500/20 border-sky-400 text-white' : 'bg-[#070918] border-slate-800 text-slate-300'}`}>
                    <input
                      type="radio"
                      name="formatMode"
                      checked={formatMode === 'remote_proctored'}
                      onChange={() => setFormatMode('remote_proctored')}
                      className="sr-only"
                    />
                    <strong className="block mb-1">{isAr ? 'اختبار رقمي عن بُعد (Proctored)' : 'Remote Online Proctored'}</strong>
                    <span className="text-[11px] text-slate-400">{isAr ? 'للأقسام النظرية والكودية' : 'Theory & Specific sections only'}</span>
                  </label>
                </div>
              </div>

              {/* Attestations */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visionConfirmed}
                    onChange={e => setVisionConfirmed(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span>
                    {isAr
                      ? 'أقر بأنني أجريت فحص حدة الإبصار Jaeger 1 وتمييز الألوان بنجاح ومستعد لتقديم الشهادة الطبية الأصلية يوم الاختبار.'
                      : 'I certify that I have passed the required Jaeger J-1 near-vision acuity and color contrast tests and will present medical attestation.'}
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={ethicsAgreed}
                    onChange={e => setEthicsAgreed(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span>
                    {isAr
                      ? 'أوافق على ميثاق الشرف والنزاهة المهنية لـ ASNT و ISO 9712 والتزم بكافة معايير السلامة المهنية ومكافحة الغش.'
                      : 'I agree to the ASNT / ISO 9712 Code of Ethics and professional conduct rules for certification testing.'}
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {isAr ? 'الرسوم المقررة: ' : 'Official Exam Fee: '}
                <strong className="text-amber-300 font-mono text-base">${registeringExam.feeUSD}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegisteringExam(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black transition cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isAr ? 'تأكيد الحجز وإصدار بطاقة الدخول' : 'Confirm Registration & Issue Slip'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADMISSION TICKET / SLIP VIEW & PRINT (CANVAS STYLE)
         ========================================================================= */}
      {(viewingTicket || registrationSuccessTicket) && (() => {
        const ticket = viewingTicket || registrationSuccessTicket!;
        const exam = exams.find(e => e.id === ticket.examId) || exams[0];
        const centerObj = EXAM_CENTERS.find(c => c.id === ticket.examCenter);

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b0e26] border-2 border-amber-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-scaleUp print:border-black print:bg-white print:text-black">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b border-amber-500/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 print:text-black">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase block">
                      OFFICIAL EXAMINATION ADMISSION SLIP
                    </span>
                    <h3 className="text-xl font-black text-white print:text-black font-mono">
                      {isAr ? 'بطاقة دخول الاختبار المهني المعتمد' : 'NDT Candidate Examination Ticket'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handlePrintTicket}
                    className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer"
                    title={isAr ? 'طباعة بطاقة الدخول' : 'Print Slip'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setViewingTicket(null);
                      setRegistrationSuccessTicket(null);
                    }}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Admission Number & Barcode Simulation */}
              <div className="bg-[#07091a] p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 print:bg-slate-100 print:border-black">
                <div>
                  <span className="text-slate-400 text-xs block">{isAr ? 'رقم ترخيص الدخول الرسمي:' : 'Admission Reference ID:'}</span>
                  <span className="text-xl font-mono font-black text-amber-400 print:text-black tracking-wider">
                    {ticket.admissionNumber}
                  </span>
                </div>

                {/* Simulated Barcode */}
                <div className="font-mono text-xs text-slate-400 tracking-widest bg-black px-3 py-1.5 rounded border border-slate-700 text-center">
                  ||||| | |||| ||| ||||| ||
                  <span className="block text-[9px] text-slate-500 mt-0.5">{ticket.registrationId}</span>
                </div>
              </div>

              {/* Candidate & Exam Data Table */}
              <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 text-xs block">{isAr ? 'اسم المرشح:' : 'Candidate Name:'}</span>
                    <strong className="text-white print:text-black text-base">{ticket.candidateName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">{isAr ? 'رقم الهوية / جواز السفر:' : 'National ID / Passport:'}</span>
                    <span className="text-slate-200 print:text-black font-mono">{ticket.nationalIdOrPassport}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">{isAr ? 'جهة العمل / الانتساب:' : 'Sponsor / Company:'}</span>
                    <span className="text-slate-200 print:text-black">{ticket.companyOrUniversity || 'Independent Candidate'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 text-xs block">{isAr ? 'الاختبار المسجل:' : 'Scheduled Exam:'}</span>
                    <strong className="text-amber-300 print:text-black font-semibold">{exam.title[language]}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">{isAr ? 'تاريخ وموعد الجلسة:' : 'Session Date:'}</span>
                    <span className="text-white print:text-black font-bold font-mono">{ticket.examDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">{isAr ? 'موقع المركز المعتمد:' : 'Center Location:'}</span>
                    <span className="text-slate-200 print:text-black">
                      {centerObj ? (isAr ? centerObj.nameAr : centerObj.nameEn) : ticket.examCenter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions on Exam Day */}
              <div className="rounded-2xl border border-slate-800 bg-[#070918] p-4 text-xs text-slate-300 space-y-1.5 print:bg-slate-50 print:border-black">
                <strong className="text-amber-400 print:text-black font-bold block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {isAr ? 'تعليمات وإرشادات يوم الاختبار للمرشح:' : 'Candidate Test Day Mandatory Guidelines:'}
                </strong>
                <p>• {isAr ? 'الحضور إلى المركز قبل موعد الاختبار بـ 30 دقيقة على الأقل لإجراءات التسجيل والتحقق من الهوية.' : 'Arrive at the testing center at least 30 minutes prior to session start.'}</p>
                <p>• {isAr ? 'إحضار أصل بطاقة الرقم القومي أو جواز السفر الساري وشهادة فحص النظر الطبية.' : 'Bring original government photo ID and original eye examination attestation.'}</p>
                <p>• {isAr ? 'الأكواد المسموح بإدخالها تخضع للتفتيش؛ يمنع إدخال الهواتف أو الساعات الذكية إلى قاعة الامتحان.' : 'Permitted code books will be audited; smart devices are strictly prohibited in the testing hall.'}</p>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400 print:text-black">
                <span>{isAr ? 'تاريخ الإصدار: ' : 'Issued At: '}{new Date().toLocaleDateString()}</span>
                <span className="font-mono">{exam.accreditationBody}</span>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
