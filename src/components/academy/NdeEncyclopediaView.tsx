import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Calculator, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Atom, 
  Flame, 
  FileText, 
  Zap, 
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Menu,
  X,
  RotateCcw,
  GraduationCap,
  Maximize2,
  Minimize2,
  Table,
  FlaskConical
} from 'lucide-react';
import { Language } from '../../types';
import { 
  ENCYCLOPEDIA_ARTICLES, 
  NDT_DEFECT_ATLAS, 
  NDT_INTERACTIVE_FORMULAS, 
  SYLLABUS_CHAPTERS,
  ARTICLE_CHAPTER_MAP,
  EncyclopediaArticle, 
  DefectProfile, 
  NdtFormula 
} from '../../data/ndeEncyclopediaData';
import { ARTICLE_QUIZZES, ArticleQuizQuestion } from '../../data/ndeCurriculumQuizzes';
import { NdtTextbookReader } from './NdtTextbookReader';
import { BookViewer } from '../BookViewer';
import { NDT_TEXTBOOKS } from '../../data/ndeTextbooksData';
import { NdeReferenceTablesView } from './NdeReferenceTablesView';
import { VirtualLab } from './VirtualLab';

interface NdeEncyclopediaViewProps {
  language: Language;
  initialBookId?: string;
  initialPageNumber?: number;
  onOpenQuiz?: (disciplineId: string) => void;
  onOpenFlashcards?: (method: string) => void;
}

export const NdeEncyclopediaView: React.FC<NdeEncyclopediaViewProps> = ({ 
  language,
  initialBookId,
  initialPageNumber,
  onOpenQuiz,
  onOpenFlashcards 
}) => {
  const isAr = language === 'ar';

  // Navigation modes
  type MainTab = 'textbooks' | 'virtual_lab' | 'syllabus' | 'calculators' | 'defect_atlas' | 'tables';
  const [activeTab, setActiveTab] = useState<MainTab>('textbooks');

  // Currently selected article (defaults to the first lesson for immediate structured reading)
  const [selectedArticleId, setSelectedArticleId] = useState<string>(ENCYCLOPEDIA_ARTICLES[0].id);
  const currentArticle = useMemo(() => {
    return ENCYCLOPEDIA_ARTICLES.find(a => a.id === selectedArticleId) || ENCYCLOPEDIA_ARTICLES[0];
  }, [selectedArticleId]);

  // Sidebar visibility (expand/collapse)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Search state within syllabus
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

  // Reading progress tracking in localStorage
  const READ_KEY = 'insco_encyclopedia_read_v2';
  const [readArticles, setReadArticles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(READ_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleArticleRead = (id: string) => {
    setReadArticles(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // User answers state for in-lesson quiz: Record<questionId, selectedOptionIndex>
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const handleSelectQuizAnswer = (qId: string, optIdx: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
  };

  const handleResetQuiz = (qIds: string[]) => {
    setQuizAnswers(prev => {
      const next = { ...prev };
      qIds.forEach(id => delete next[id]);
      return next;
    });
  };

  // Sequential Next / Previous navigation calculation
  const currentArticleIndex = useMemo(() => {
    return ENCYCLOPEDIA_ARTICLES.findIndex(a => a.id === selectedArticleId);
  }, [selectedArticleId]);

  const prevArticle = useMemo(() => {
    if (currentArticleIndex > 0) {
      return ENCYCLOPEDIA_ARTICLES[currentArticleIndex - 1];
    }
    return null;
  }, [currentArticleIndex]);

  const nextArticle = useMemo(() => {
    if (currentArticleIndex < ENCYCLOPEDIA_ARTICLES.length - 1) {
      return ENCYCLOPEDIA_ARTICLES[currentArticleIndex + 1];
    }
    return null;
  }, [currentArticleIndex]);

  // Active calculator state
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(NDT_INTERACTIVE_FORMULAS[0].id);
  const selectedFormula = useMemo(() => {
    return NDT_INTERACTIVE_FORMULAS.find(f => f.id === selectedFormulaId) || NDT_INTERACTIVE_FORMULAS[0];
  }, [selectedFormulaId]);

  // Calculator inputs state
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    NDT_INTERACTIVE_FORMULAS.forEach(f => {
      f.variables.forEach(v => {
        init[`${f.id}_${v.symbol}`] = v.defaultValue;
      });
    });
    return init;
  });

  const handleInputChange = (formulaId: string, symbol: string, value: number) => {
    setFormulaInputs(prev => ({
      ...prev,
      [`${formulaId}_${symbol}`]: value
    }));
  };

  const formulaCalculation = useMemo(() => {
    const inputs: Record<string, number> = {};
    selectedFormula.variables.forEach(v => {
      inputs[v.symbol] = formulaInputs[`${selectedFormula.id}_${v.symbol}`] ?? v.defaultValue;
    });
    try {
      return selectedFormula.calculate(inputs);
    } catch {
      return {
        result: 0,
        unit: '',
        formattedAr: 'خطأ في المدخلات',
        formattedEn: 'Input computation error',
        explanationAr: 'يرجى مراجعة القيم المدخلة',
        explanationEn: 'Please review input parameters'
      };
    }
  }, [selectedFormula, formulaInputs]);

  // Selected defect for atlas view
  const [selectedDefectId, setSelectedDefectId] = useState<string>(NDT_DEFECT_ATLAS[0].id);
  const [selectedDefectOrigin, setSelectedDefectOrigin] = useState<string>('all');
  const currentDefect = useMemo(() => {
    return NDT_DEFECT_ATLAS.find(d => d.id === selectedDefectId) || NDT_DEFECT_ATLAS[0];
  }, [selectedDefectId]);

  // Filtered articles in sidebar
  const filteredSidebarArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ENCYCLOPEDIA_ARTICLES.filter(art => {
      if (selectedChapterId !== 'all') {
        const chapter = SYLLABUS_CHAPTERS.find(c => c.id === selectedChapterId);
        if (chapter && !chapter.articleIds.includes(art.id)) return false;
      }
      if (!q) return true;
      return (
        art.titleAr.toLowerCase().includes(q) ||
        art.titleEn.toLowerCase().includes(q) ||
        art.summaryAr.toLowerCase().includes(q) ||
        art.summaryEn.toLowerCase().includes(q) ||
        art.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedChapterId]);

  // Get current lesson chapter metadata
  const currentChapterMeta = useMemo(() => {
    return ARTICLE_CHAPTER_MAP[currentArticle.id] || {
      chapterNumber: 1,
      lessonNumber: '1.1',
      chapterTitleAr: 'المنهاج التأسيسي لـ NDT',
      chapterTitleEn: 'NDT Foundation Curriculum'
    };
  }, [currentArticle.id]);

  // Current lesson quiz questions
  const currentQuizQuestions: ArticleQuizQuestion[] = useMemo(() => {
    return ARTICLE_QUIZZES[currentArticle.id] || [];
  }, [currentArticle.id]);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-6 animate-fadeIn text-slate-100">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & METRICS BAR */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#121638] via-[#0d1029] to-[#080918] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'أكاديمية إنسكو الهندسية • المنهاج الأكاديمي الشامل لعلوم وفحوصات NDT' : 'INSCO NDT ACADEMY • Comprehensive Academic Syllabus'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAr ? 'الموسوعة والمنهاج الأكاديمي التخصصي للفحوصات الهندسية' : 'Comprehensive NDT Engineering & Science Syllabus'}
            </h2>
            <p className="text-slate-300 max-w-3xl text-xs sm:text-sm leading-relaxed">
              {isAr 
                ? 'مرجع هندسي وأكاديمي متكامل مبني ومبوب طبقاً لأعلى المعايير العالمية: الأبواب الأكاديمية الستة، المبادئ الفيزيائية، موسوعة طرق الفحص (VT, PT, MT, UT, RT, ET)، علم المواد وتشكيل العيوب، معمل المعادلات، وأطلس التوصيف المورفولوجي.'
                : 'Authoritative university-level reference inside INSCO: 6 Academic Chapters, wave and radiation physics, 12 core and advanced methods, metallurgy, interactive formula lab, and cross-method defect atlas.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0 text-xs">
            <div className="bg-[#14193d] border border-[#273273] rounded-2xl p-3 text-center">
              <span className="block text-amber-400 font-black text-lg sm:text-xl font-mono">{NDT_TEXTBOOKS.length}</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'كتب دراسية تفاعلية' : 'Textbooks'}</span>
            </div>
            <div className="bg-[#14193d] border border-[#273273] rounded-2xl p-3 text-center">
              <span className="block text-emerald-400 font-black text-lg sm:text-xl font-mono">{ENCYCLOPEDIA_ARTICLES.length}</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'مبحثاً أكاديمياً' : 'Lessons'}</span>
            </div>
            <div className="bg-[#14193d] border border-[#273273] rounded-2xl p-3 text-center">
              <span className="block text-sky-400 font-black text-lg sm:text-xl font-mono">{NDT_INTERACTIVE_FORMULAS.length}</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'معادلات ومعامل' : 'Formulas'}</span>
            </div>
            <div className="bg-[#14193d] border border-[#273273] rounded-2xl p-3 text-center">
              <span className="block text-purple-400 font-black text-lg sm:text-xl font-mono">{readArticles.length}/{ENCYCLOPEDIA_ARTICLES.length}</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'تمت دراستها' : 'Completed'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#21295c] pb-3">
        <div className="flex flex-wrap items-center gap-2 bg-[#0c0f2b] p-1.5 rounded-2xl border border-[#202755]">
          {/* Tab 0: Digital Flippable Textbooks with Labs */}
          <button
            onClick={() => setActiveTab('textbooks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'textbooks'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isAr ? `الكتب الدراسية والتجارب (${NDT_TEXTBOOKS.length} مراجع)` : `Textbooks & 3D Reader (${NDT_TEXTBOOKS.length})`}</span>
          </button>

          {/* Tab 1: 3D Virtual NDT Lab */}
          <button
            onClick={() => setActiveTab('virtual_lab')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'virtual_lab'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-sky-400" />
            <span>{isAr ? 'المختبر ثلاثي الأبعاد 3D Virtual Lab' : '3D Virtual Lab'}</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'syllabus'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isAr ? 'المنهاج والدروس الأكاديمية (18 درساً)' : 'Syllabus & Lessons (18)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('calculators')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'calculators'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{isAr ? 'معمل المعادلات والحسابات' : 'Formula Lab'}</span>
          </button>

          <button
            onClick={() => setActiveTab('defect_atlas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'defect_atlas'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isAr ? 'أطلس العيوب والتوصيف' : 'Defect Atlas'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-[#161a3f]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>{isAr ? 'جداول الخواص والمعايير الهندسية' : 'Engineering Reference Tables'}</span>
          </button>
        </div>

        {/* Focus Mode & Sidebar Toggle when in Syllabus tab */}
        {activeTab === 'syllabus' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e1233] hover:bg-[#171d4e] border border-[#222b64] text-xs font-semibold text-slate-200 transition cursor-pointer"
              title={isAr ? 'إظهار / إخفاء فهرس المنهاج' : 'Toggle Syllabus Sidebar'}
            >
              {isSidebarOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">{isSidebarOpen ? (isAr ? 'إخفاء الفهرس' : 'Hide Sidebar') : (isAr ? 'إظهار الفهرس' : 'Show Sidebar')}</span>
            </button>

            <button
              onClick={() => setIsFocusMode(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e1233] hover:bg-[#171d4e] border border-[#222b64] text-xs font-semibold text-slate-200 transition cursor-pointer"
              title={isAr ? 'وضع التركيز والقراءة الكاملة' : 'Toggle Focus Reading Mode'}
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isFocusMode ? (isAr ? 'الوضع العادي' : 'Standard View') : (isAr ? 'وضع التركيز' : 'Focus Mode')}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 0. TAB 0: INTERACTIVE 3D FLIPPABLE TEXTBOOKS & VIRTUAL LABS */}
      {/* ========================================================================= */}
      {activeTab === 'textbooks' && (
        <BookViewer
          language={language}
          initialBookId={initialBookId}
          initialPageNumber={initialPageNumber}
          onOpenQuiz={onOpenQuiz}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. SYLLABUS & LESSON READER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= SIDEBAR: STRUCTURED CURRICULUM TREE ================= */}
          {(!isFocusMode && isSidebarOpen) && (
            <aside className="lg:col-span-4 xl:col-span-4 space-y-4 bg-[#0a0d24] border border-[#1e2554] rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1b2149]">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {isAr ? 'فهرس المنهاج الأكاديمي' : 'Academic Syllabus Index'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {readArticles.length} / {ENCYCLOPEDIA_ARTICLES.length} {isAr ? 'مكتمل' : 'Done'}
                </span>
              </div>

              {/* Search bar inside sidebar */}
              <div className="relative">
                <Search className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-3.5 h-3.5 text-slate-400`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في الدروس والموضوعات…' : 'Search syllabus lessons…'}
                  className={`w-full bg-[#101438] border border-[#232c66] rounded-xl py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              {/* Chapter filter selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedChapterId('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedChapterId === 'all'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#12163b] text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'كل الأبواب (6)' : 'All Chapters'}
                </button>
                {SYLLABUS_CHAPTERS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedChapterId === ch.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-[#12163b] text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? `الباب ${ch.chapterNumber}` : `Ch. ${ch.chapterNumber}`}
                  </button>
                ))}
              </div>

              {/* Grouped Syllabus Tree */}
              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {SYLLABUS_CHAPTERS.filter(ch => selectedChapterId === 'all' || selectedChapterId === ch.id).map(chapter => {
                  const chapterLessons = filteredSidebarArticles.filter(a => chapter.articleIds.includes(a.id));
                  if (chapterLessons.length === 0 && searchQuery) return null;
                  const chapterDoneCount = chapter.articleIds.filter(id => readArticles.includes(id)).length;

                  return (
                    <div key={chapter.id} className="space-y-1.5 bg-[#0e1233]/70 rounded-2xl p-2.5 border border-[#1b2250]">
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-[11px] font-black text-amber-300">
                          {isAr ? chapter.titleAr : chapter.titleEn}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {chapterDoneCount}/{chapter.articleIds.length}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {chapterLessons.map(lesson => {
                          const isSelected = lesson.id === selectedArticleId;
                          const isDone = readArticles.includes(lesson.id);
                          const meta = ARTICLE_CHAPTER_MAP[lesson.id] || { lessonNumber: '' };

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setSelectedArticleId(lesson.id);
                                window.scrollTo({ top: 380, behavior: 'smooth' });
                              }}
                              className={`w-full text-start p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                isSelected
                                  ? 'bg-[#232c66] text-white border border-amber-400/80 shadow-md font-bold'
                                  : 'bg-[#0b0e26] text-slate-300 hover:bg-[#151a44] hover:text-white border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-[#181f4d] text-amber-400'
                                }`}>
                                  {meta.lessonNumber}
                                </span>
                                <span className="text-xs truncate">
                                  {isAr ? lesson.titleAr : lesson.titleEn}
                                </span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                {isDone && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {lesson.readTimeMin}m
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {/* ================= MAIN LESSON READING PANE ================= */}
          <main className={`${(!isFocusMode && isSidebarOpen) ? 'lg:col-span-8 xl:col-span-8' : 'lg:col-span-12'} space-y-6`}>
            {/* Breadcrumb Navigation */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 bg-[#0c0f2b] p-3 rounded-2xl border border-[#1d2452]">
              <span className="text-slate-400">{isAr ? 'المنهاج الأكاديمي' : 'Syllabus'}</span>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-500 ${isAr ? 'rotate-180' : ''}`} />
              <span className="text-amber-400/90 font-medium">
                {isAr ? currentChapterMeta.chapterTitleAr : currentChapterMeta.chapterTitleEn}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-500 ${isAr ? 'rotate-180' : ''}`} />
              <span className="text-white font-bold truncate">
                {isAr ? currentArticle.titleAr : currentArticle.titleEn}
              </span>
            </div>

            {/* Article Detail Card */}
            <div className="bg-[#0c0f2b] border border-[#232c66] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
              {/* Header Box */}
              <div className="border-b border-[#1f2756] pb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {isAr ? `الدرس ${currentChapterMeta.lessonNumber}` : `Lesson ${currentChapterMeta.lessonNumber}`} • {currentArticle.badge}
                    </span>
                    <span className="text-xs text-slate-400">
                      {isAr ? `زمن القراءة المتوقع: ~${currentArticle.readTimeMin} دقائق` : `Est. Reading Time: ~${currentArticle.readTimeMin} mins`}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleArticleRead(currentArticle.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      readArticles.includes(currentArticle.id)
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'bg-[#18204d] hover:bg-[#202b66] text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {readArticles.includes(currentArticle.id)
                        ? (isAr ? 'تم استكمال الدرس بنجاح ✓' : 'Lesson Completed ✓')
                        : (isAr ? 'تأكيد إتمام دراسة الدرس' : 'Mark as Studied')}
                    </span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                  {isAr ? currentArticle.titleAr : currentArticle.titleEn}
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed bg-[#080a1c] p-4 rounded-2xl border border-[#181f4d]">
                  {isAr ? currentArticle.summaryAr : currentArticle.summaryEn}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {currentArticle.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-lg bg-[#14193d] border border-[#26306c] text-[11px] text-slate-300 font-mono">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Quick Outline Jump Chips */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">
                    {isAr ? 'فهرس عناصر ومحاور الدرس:' : 'Lesson Outline:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentArticle.sections.map((sec, sIdx) => (
                      <a
                        key={sIdx}
                        href={`#section-${sIdx}`}
                        className="px-2.5 py-1 rounded-lg bg-[#11163b] hover:bg-[#1a2154] border border-[#202758] text-[11px] text-amber-300/90 transition cursor-pointer"
                      >
                        {sIdx + 1}. {isAr ? sec.headingAr : sec.headingEn}
                      </a>
                    ))}
                    <a
                      href="#tips-section"
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-[11px] text-emerald-300 transition cursor-pointer"
                    >
                      ★ {isAr ? 'إرشادات التفتيش العملي' : 'Field Best Practices'}
                    </a>
                    {currentQuizQuestions.length > 0 && (
                      <a
                        href="#quiz-section"
                        className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-[11px] text-amber-300 transition cursor-pointer font-bold"
                      >
                        ? {isAr ? 'اختبار الفهم الذاتي' : 'Self-Assessment Quiz'}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Sections Deep Content */}
              <div className="space-y-8">
                {currentArticle.sections.map((sec, idx) => (
                  <div key={idx} id={`section-${idx}`} className="space-y-4 bg-[#101438]/60 border border-[#1f2656] rounded-2xl p-5 sm:p-7 scroll-mt-24">
                    <h3 className="text-lg sm:text-xl font-bold text-amber-300 flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                        {idx + 1}
                      </span>
                      <span>{isAr ? sec.headingAr : sec.headingEn}</span>
                    </h3>

                    <p className="text-slate-200 text-xs sm:text-sm leading-loose whitespace-pre-line font-sans">
                      {isAr ? sec.contentAr : sec.contentEn}
                    </p>

                    {sec.formula && (
                      <div className="p-4 rounded-xl bg-[#070918] border border-amber-500/40 text-amber-300 font-mono text-sm sm:text-base text-center my-4 shadow-inner">
                        <span className="text-[11px] text-slate-400 block mb-1 font-sans">{isAr ? 'القانون والمعادلة الهندسية الحاكمة:' : 'Governing Engineering Formula:'}</span>
                        {sec.formula}
                      </div>
                    )}

                    {sec.keyPointsAr && (
                      <div className="mt-4 pt-3 border-t border-[#1a2048] space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          {isAr ? 'نقاط هندسية وتحليلية جوهرية:' : 'Key Engineering Insights:'}
                        </span>
                        <ul className="space-y-2">
                          {(isAr ? sec.keyPointsAr : sec.keyPointsEn || sec.keyPointsAr).map((kp, kIdx) => (
                            <li key={kIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Practical Inspection Tips Box */}
              <div id="tips-section" className="p-5 sm:p-7 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 space-y-3 scroll-mt-24">
                <h4 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'إرشادات التفتيش العملي والميداني المعتمدة (INSCO Best Practices):' : 'INSCO Approved Field Inspection Best Practices:'}</span>
                </h4>
                <ul className="space-y-2">
                  {(isAr ? currentArticle.practicalInspectionTipsAr : currentArticle.practicalInspectionTipsEn).map((tip, tIdx) => (
                    <li key={tIdx} className="text-xs sm:text-sm text-emerald-100 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-2" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Applicable International Codes */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#090b1c] border border-[#1b224e]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">{isAr ? 'الكودات والمواصفات المرجعية الحاكمة:' : 'Governing Standards & Codes:'}</span>
                  {currentArticle.applicableCodes.map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-md bg-[#161c44] border border-[#2c3877] text-xs font-semibold text-amber-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* ================= IN-LESSON SELF-ASSESSMENT QUIZ ================= */}
              {currentQuizQuestions.length > 0 && (
                <div id="quiz-section" className="space-y-6 pt-6 border-t border-[#1f2756] scroll-mt-24">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-amber-400" />
                      <h4 className="text-base sm:text-lg font-black text-white">
                        {isAr ? 'اختبار الفهم الذاتي والتقييم الأكاديمي للدرس' : 'In-Lesson Self-Assessment Quiz'}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleResetQuiz(currentQuizQuestions.map(q => q.id))}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إعادة المحاولة' : 'Reset Quiz'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    {isAr 
                      ? 'اختبر استيعابك للمفاهيم والقوانين الهندسية الواردة في هذا الدرس؛ انقر على الإجابة لتتحقق من صحتها وتتعرف على التفسير العلمي المعتمد.'
                      : 'Test your grasp of the engineering principles covered in this lesson. Click an option to reveal instant verification and technical explanation.'}
                  </p>

                  <div className="space-y-6">
                    {currentQuizQuestions.map((q, qIndex) => {
                      const selectedOpt = quizAnswers[q.id];
                      const hasAnswered = selectedOpt !== undefined;
                      const isCorrect = selectedOpt === q.correctIndex;

                      return (
                        <div key={q.id} className="bg-[#0e1233] border border-[#202758] rounded-2xl p-5 space-y-4">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                              {qIndex + 1}
                            </span>
                            <h5 className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                              {isAr ? q.questionAr : q.questionEn}
                            </h5>
                          </div>

                          <div className="space-y-2">
                            {(isAr ? q.optionsAr : q.optionsEn).map((opt, optIndex) => {
                              const isThisSelected = selectedOpt === optIndex;
                              const isThisCorrect = optIndex === q.correctIndex;

                              let btnClasses = 'bg-[#080b20] border-[#1c224b] text-slate-300 hover:bg-[#151a44] hover:text-white';
                              if (hasAnswered) {
                                if (isThisCorrect) {
                                  btnClasses = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                                } else if (isThisSelected) {
                                  btnClasses = 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold';
                                } else {
                                  btnClasses = 'bg-[#080b20]/50 border-transparent text-slate-500 opacity-60';
                                }
                              }

                              return (
                                <button
                                  key={optIndex}
                                  onClick={() => handleSelectQuizAnswer(q.id, optIndex)}
                                  className={`w-full text-start p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer flex items-center justify-between gap-3 ${btnClasses}`}
                                >
                                  <span>{opt}</span>
                                  {hasAnswered && isThisCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Box */}
                          {hasAnswered && (
                            <div className={`p-4 rounded-xl text-xs leading-relaxed border ${
                              isCorrect 
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            }`}>
                              <span className="font-bold block mb-1">
                                {isCorrect ? (isAr ? '✓ إجابة صحيحة وموفقة!' : '✓ Correct Answer!') : (isAr ? '✕ إجابة غير دقيقة - التفسير الهندسي المعتمد:' : '✕ Incorrect - Technical Explanation:')}
                              </span>
                              <p>{isAr ? q.explanationAr : q.explanationEn}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= SEQUENTIAL NEXT / PREVIOUS NAVIGATION ================= */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#1f2756]">
                {prevArticle ? (
                  <button
                    onClick={() => {
                      setSelectedArticleId(prevArticle.id);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto flex items-center gap-2 px-4 py-3 rounded-xl bg-[#11163b] hover:bg-[#1a2154] border border-[#232c66] text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className={`w-4 h-4 text-amber-400 ${isAr ? 'rotate-180' : ''}`} />
                    <div className="text-start">
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'الدرس السابق:' : 'Previous Lesson:'}</span>
                      <span className="truncate block max-w-[200px]">{isAr ? prevArticle.titleAr : prevArticle.titleEn}</span>
                    </div>
                  </button>
                ) : <div />}

                {nextArticle && (
                  <button
                    onClick={() => {
                      setSelectedArticleId(nextArticle.id);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto flex items-center justify-end gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    <div className="text-end">
                      <span className="text-[10px] text-slate-800 block font-semibold">{isAr ? 'الدرس التالي في المنهاج:' : 'Next Lesson in Syllabus:'}</span>
                      <span className="truncate block max-w-[200px]">{isAr ? nextArticle.titleAr : nextArticle.titleEn}</span>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: INTERACTIVE FORMULA & CALCULATORS LAB */}
      {/* ========================================================================= */}
      {activeTab === 'calculators' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Formula Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-1">
              {isAr ? 'اختر المعادلة أو القانون الهندسي:' : 'Select Formula Calculator:'}
            </h3>
            {NDT_INTERACTIVE_FORMULAS.map(f => {
              const isSelected = f.id === selectedFormulaId;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormulaId(f.id)}
                  className={`w-full text-start p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1e2554] border-amber-400 text-white shadow-lg'
                      : 'bg-[#0d1029] border-[#202755] text-slate-300 hover:bg-[#13173d] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#0c0e22] text-amber-400 border border-amber-500/30">
                      {f.method}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {f.formulaLatex}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold truncate">
                    {isAr ? f.nameAr : f.nameEn}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Calculator Workspace */}
          <div className="lg:col-span-8 bg-[#0c0f2b] border border-[#242c64] rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
            <div className="border-b border-[#1f2756] pb-6">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-3">
                {selectedFormula.method} Method Formula
              </span>
              <h3 className="text-2xl font-black text-white mb-2">
                {isAr ? selectedFormula.nameAr : selectedFormula.nameEn}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                {isAr ? selectedFormula.descriptionAr : selectedFormula.descriptionEn}
              </p>
              <div className="p-4 rounded-xl bg-[#090b1c] border border-amber-500/30 text-center font-mono text-base sm:text-lg text-amber-300">
                {selectedFormula.formulaLatex}
              </div>
            </div>

            {/* Input Variables Form */}
            <div className="space-y-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {isAr ? 'مدخلات الحساب والمتغيرات الهندسية:' : 'Formula Inputs & Parameters:'}
              </h4>
              <div className="grid sm:grid-cols-2 gap-5">
                {selectedFormula.variables.map(v => {
                  const val = formulaInputs[`${selectedFormula.id}_${v.symbol}`] ?? v.defaultValue;
                  return (
                    <div key={v.symbol} className="bg-[#101438] border border-[#202859] rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-200">
                          {isAr ? v.nameAr : v.nameEn} ({v.symbol})
                        </label>
                        <span className="font-mono text-amber-400 font-bold">
                          {val} {v.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={v.min}
                        max={v.max}
                        step={v.step}
                        value={val}
                        onChange={(e) => handleInputChange(selectedFormula.id, v.symbol, parseFloat(e.target.value) || 0)}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{v.min} {v.unit}</span>
                        <span>{v.max} {v.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Computation Result Output */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-[#121638] to-[#0c0f2b] border-2 border-amber-400/50 shadow-2xl space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
                {isAr ? 'النتيجة الهندسية المحسوبة:' : 'Calculated Engineering Output:'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-baseline gap-2">
                <span>{formulaCalculation.result.toFixed(2)}</span>
                <span className="text-sm font-bold text-amber-400 font-sans">{formulaCalculation.unit}</span>
              </div>
              <p className="text-sm font-semibold text-amber-200">
                {isAr ? formulaCalculation.formattedAr : formulaCalculation.formattedEn}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed border-t border-[#232c66] pt-3">
                {isAr ? formulaCalculation.explanationAr : formulaCalculation.explanationEn}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: DEFECT MORPHOLOGY ATLAS */}
      {/* ========================================================================= */}
      {activeTab === 'defect_atlas' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Defect List Selector */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
              {isAr ? 'كتالوج العيوب والتوصيف المورفولوجي:' : 'Defect Morphology Profiles:'}
            </h3>

            {/* Filter by Origin */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              {[
                { id: 'all', titleAr: 'كل العيوب (7)', titleEn: 'All Flaws (7)' },
                { id: 'Welding', titleAr: 'عيوب اللحام', titleEn: 'Welding' },
                { id: 'Inherent', titleAr: 'السباكة والتصنيع', titleEn: 'Casting/Processing' },
                { id: 'Service', titleAr: 'أثناء الخدمة', titleEn: 'In-Service' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedDefectOrigin(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    selectedDefectOrigin === f.id
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#10132e] text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? f.titleAr : f.titleEn}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {NDT_DEFECT_ATLAS.filter(d => {
                if (selectedDefectOrigin === 'all') return true;
                if (selectedDefectOrigin === 'Welding') return d.origin === 'Welding';
                if (selectedDefectOrigin === 'Inherent') return d.origin.includes('Casting') || d.origin.includes('Forging');
                if (selectedDefectOrigin === 'Service') return d.origin.includes('Service');
                return true;
              }).map(d => {
                const isSelected = d.id === selectedDefectId;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDefectId(d.id)}
                    className={`w-full text-start p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e2554] border-amber-400 text-white shadow-lg'
                        : 'bg-[#0d1029] border-[#202755] text-slate-300 hover:bg-[#13173d] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-amber-400 font-mono">
                        {d.originAr}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                        d.criticality.includes('Critical') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {d.criticalityAr}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold">
                      {isAr ? d.nameAr : d.nameEn}
                    </h4>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Defect Detailed View with 6-Method Detection Matrix */}
          <div className="lg:col-span-8 bg-[#0c0f2b] border border-[#242c64] rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
            <div className="border-b border-[#1f2756] pb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {currentDefect.criticalityAr}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#151c44] text-slate-300 border border-[#253275]">
                  {currentDefect.originAr}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? currentDefect.nameAr : currentDefect.nameEn}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0e1233] p-4 rounded-2xl border border-[#1e265c]">
                <strong className="text-amber-300 block mb-1">{isAr ? 'التوصيف المورفولوجي والشكل الهندسي:' : 'Morphological Description:'}</strong>
                {isAr ? currentDefect.morphologyAr : currentDefect.morphologyEn}
              </p>
            </div>

            {/* Detection Sensitivity Matrix */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'مصفوفة حساسية وقدرة الكشف عبر طرق الفحص المتزامنة (6 طرق):' : 'Multi-Method Detectability Matrix (6 Methods):'}</span>
              </h4>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentDefect.detectionMatrix.map(m => {
                  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                  if (m.detectability === 'Moderate') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  if (m.detectability === 'Low') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  if (m.detectability === 'Not Applicable') badgeColor = 'bg-slate-700/30 text-slate-400 border-slate-600/40';

                  return (
                    <div key={m.method} className="bg-[#101438] border border-[#202758] rounded-2xl p-3.5 space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-black text-white px-2 py-0.5 rounded bg-[#161c47]">
                          {m.method}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {isAr ? m.detectabilityAr : m.detectability}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isAr ? m.descriptionAr : m.descriptionEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Root Causes and Prevention */}
            <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-[#1f2756]">
              <div className="space-y-3 bg-[#11163b] p-5 rounded-2xl border border-[#222c66]">
                <h5 className="text-xs font-black uppercase tracking-wider text-rose-400">
                  {isAr ? 'الأسباب الجذرية لحدوث الخلل:' : 'Root Causes:'}
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(isAr ? currentDefect.rootCausesAr : currentDefect.rootCausesEn).map((rc, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <span>{rc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 bg-[#11163b] p-5 rounded-2xl border border-[#222c66]">
                <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {isAr ? 'طرق الوقاية وتفادي التكرار:' : 'Prevention Methods:'}
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr ? currentDefect.preventionMethodAr : currentDefect.preventionMethodEn}
                </p>
              </div>
            </div>

            {/* Code Acceptance Criteria */}
            <div className="p-5 rounded-2xl bg-[#090c24] border border-[#242c64] space-y-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                {isAr ? 'معايير القبول والرفض الرسمية (ASME Sec VIII / ASME B31.3 / AWS D1.1):' : 'Official Code Acceptance & Rejection Limits:'}
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {isAr ? currentDefect.asmeAwsAcceptanceCriteriaAr : currentDefect.asmeAwsAcceptanceCriteriaEn}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ENGINEERING REFERENCE TABLES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'tables' && (
        <NdeReferenceTablesView language={language} />
      )}

      {/* ========================================================================= */}
      {/* 6. 3D VIRTUAL NDT LAB */}
      {/* ========================================================================= */}
      {activeTab === 'virtual_lab' && (
        <VirtualLab language={language} />
      )}
    </div>
  );
};
