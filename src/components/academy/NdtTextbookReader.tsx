import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  BookmarkCheck, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  Award, 
  Compass, 
  Layers, 
  ArrowRight, 
  ArrowLeft,
  X,
  Menu,
  GraduationCap
} from 'lucide-react';
import { Language } from '../../types';
import { NDT_TEXTBOOKS, NdtTextbook, BookPage } from '../../data/ndeTextbooksData';
import { InteractiveBookExperiment } from './InteractiveBookExperiment';

interface NdtTextbookReaderProps {
  language: Language;
  initialBookId?: string;
  onOpenQuiz?: (disciplineId: string) => void;
}

export const NdtTextbookReader: React.FC<NdtTextbookReaderProps> = ({ 
  language,
  initialBookId,
  onOpenQuiz 
}) => {
  const isAr = language === 'ar';

  // Selected book state
  const [activeBookId, setActiveBookId] = useState<string | null>(initialBookId || null);
  const activeBook = useMemo(() => {
    return NDT_TEXTBOOKS.find(b => b.id === activeBookId) || null;
  }, [activeBookId]);

  // Current page index (0-based)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Table of Contents drawer
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Font size multiplier
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Bookmarks in localStorage: Record<bookId, pageNumber[]>
  const BOOKMARK_STORAGE_KEY = 'insco_ndt_textbook_bookmarks_v1';
  const [bookmarks, setBookmarks] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleBookmark = (bookId: string, pageNum: number) => {
    setBookmarks(prev => {
      const currentList = prev[bookId] || [];
      const updatedList = currentList.includes(pageNum) 
        ? currentList.filter(p => p !== pageNum)
        : [...currentList, pageNum];
      const next = { ...prev, [bookId]: updatedList };
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Completed / Read pages tracking
  const READ_PAGES_KEY = 'insco_ndt_read_pages_v1';
  const [readPages, setReadPages] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem(READ_PAGES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const markPageRead = (bookId: string, pageNum: number) => {
    setReadPages(prev => {
      const currentList = prev[bookId] || [];
      if (currentList.includes(pageNum)) return prev;
      const next = { ...prev, [bookId]: [...currentList, pageNum] };
      try {
        localStorage.setItem(READ_PAGES_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // User answers for embedded quizzes in pages: Record<pageNumber, selectedIndex>
  const [pageQuizAnswers, setPageQuizAnswers] = useState<Record<number, number>>({});
  const handleQuizAnswer = (pageNum: number, optionIdx: number) => {
    setPageQuizAnswers(prev => ({
      ...prev,
      [pageNum]: optionIdx
    }));
  };

  // Page turning animation state
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  const goToNextPage = useCallback(() => {
    if (!activeBook) return;
    if (currentPageIndex < activeBook.pages.length - 1) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPageIndex(prev => {
          const nextIdx = prev + 1;
          markPageRead(activeBook.id, activeBook.pages[nextIdx].pageNumber);
          return nextIdx;
        });
        setIsFlipping(false);
        window.scrollTo({ top: 250, behavior: 'smooth' });
      }, 150);
    }
  }, [activeBook, currentPageIndex]);

  const goToPrevPage = useCallback(() => {
    if (!activeBook) return;
    if (currentPageIndex > 0) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPageIndex(prev => prev - 1);
        setIsFlipping(false);
        window.scrollTo({ top: 250, behavior: 'smooth' });
      }, 150);
    }
  }, [activeBook, currentPageIndex]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeBook) return;
      if (e.key === 'ArrowRight') {
        if (isAr) goToPrevPage();
        else goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        if (isAr) goToNextPage();
        else goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBook, isAr, goToNextPage, goToPrevPage]);

  // Current page object
  const currentPage: BookPage | null = useMemo(() => {
    if (!activeBook) return null;
    return activeBook.pages[currentPageIndex] || activeBook.pages[0];
  }, [activeBook, currentPageIndex]);

  // Track page reading automatically upon landing
  useEffect(() => {
    if (activeBook && currentPage) {
      markPageRead(activeBook.id, currentPage.pageNumber);
    }
  }, [activeBook, currentPage]);

  // Font size classes
  const fontClasses = useMemo(() => {
    if (fontSize === 'sm') return 'text-xs sm:text-sm leading-relaxed';
    if (fontSize === 'lg') return 'text-base sm:text-lg leading-loose';
    return 'text-sm sm:text-base leading-relaxed';
  }, [fontSize]);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-6 animate-fadeIn text-slate-100">
      {/* ========================================================================= */}
      {/* VIEW 1: BOOKSHELF / LIBRARY OF TEXTBOOKS */}
      {/* ========================================================================= */}
      {!activeBook ? (
        <div className="space-y-8">
          {/* Library Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#101538] via-[#0b0e26] to-[#070918] p-6 sm:p-10 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-4xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'مكتبة الكتب الدراسية الهندسية التفاعلية • INSCO NDT TEXTBOOKS' : 'INSCO Interactive Engineering Textbooks Library'}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {isAr ? 'المكتبة الأكاديمية: كتب دراسية تفاعلية لكل تخصص NDT' : 'NDT Academic Textbooks & Virtual Labs Library'}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {isAr 
                  ? 'تم تحويل كافة علوم وفحوصات NDT إلى كتب دراسية أكاديمية متكاملة وقابلة لتقليب الصفحات يدوياً؛ يحتوي كل كتاب على فصول دراسية، تجارب ومعامل تفاعلية حية مدمجة بالصفحات، كودات القبول والرفض، واختبارات فهم ذاتي.'
                  : 'Complete NDT curriculum converted into standalone digital flip-books. Each discipline has its dedicated textbook featuring flippable pages, live virtual labs embedded in the pages, ASME/AWS code limits, and self-assessment exams.'}
              </p>
            </div>
          </div>

          {/* Bookshelf Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'اختر الكتاب الدراسي لبدء القراءة وتقليب الصفحات:' : 'Select a Textbook to Open & Flip Pages:'}</span>
              </h3>
              <span className="text-xs text-amber-400/90 font-mono">
                {NDT_TEXTBOOKS.length} {isAr ? 'كتب دراسية تخصصية' : 'Textbooks Available'}
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {NDT_TEXTBOOKS.map((book) => {
                const bookReadPages = readPages[book.id] || [];
                const readProgressPct = Math.round((bookReadPages.length / book.totalPages) * 100);

                return (
                  <div
                    key={book.id}
                    onClick={() => {
                      setActiveBookId(book.id);
                      setCurrentPageIndex(0);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="group relative bg-[#0c102a] hover:bg-[#12173d] border-2 border-[#1e265c] hover:border-amber-400/80 rounded-3xl p-5 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between hover:-translate-y-1.5"
                  >
                    {/* Realistic Book Spine Effect */}
                    <div className="absolute top-0 bottom-0 left-0 w-3 rounded-l-3xl bg-gradient-to-r from-black/60 to-transparent" />

                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${book.colorTheme.badgeBg} ${book.colorTheme.badgeText} ${book.colorTheme.border}`}>
                          {book.discipline} Textbook
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>~{book.estimatedHours}h</span>
                        </div>
                      </div>

                      {/* Book Cover Design */}
                      <div className={`p-5 rounded-2xl bg-gradient-to-br ${book.colorTheme.gradient} border ${book.colorTheme.border} shadow-inner space-y-3`}>
                        <div className="w-8 h-1 bg-amber-400 rounded-full" />
                        <h4 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition leading-snug">
                          {isAr ? book.titleAr : book.titleEn}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2">
                          {isAr ? book.subtitleAr : book.subtitleEn}
                        </p>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {isAr ? book.coverSummaryAr : book.coverSummaryEn}
                      </p>

                      {/* Standards */}
                      <div className="flex flex-wrap gap-1">
                        {book.applicableStandards.slice(0, 3).map(st => (
                          <span key={st} className="px-2 py-0.5 rounded bg-[#151c47] text-[10px] text-slate-300 font-mono">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Progress & Action */}
                    <div className="pt-4 mt-4 border-t border-[#1b224d] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{book.totalPages} {isAr ? 'صفحات دراسية' : 'Pages'}</span>
                        <span className="text-amber-400 font-mono font-bold">{readProgressPct}% {isAr ? 'تمت دراسته' : 'Read'}</span>
                      </div>
                      <div className="w-full bg-[#141838] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${readProgressPct}%` }} />
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                        <span>{isAr ? 'افتح الكتاب وابدأ التصفح' : 'Open & Flip Pages'}</span>
                        <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isAr ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: FLIPPABLE DIGITAL BOOK READER */
        /* ========================================================================= */
        <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#060814] p-4 sm:p-8 overflow-y-auto' : ''}`}>
          {/* Reader Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0d24] border border-[#1e265c] p-3 sm:p-4 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveBookId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141b47] hover:bg-[#1d2766] text-xs font-bold text-amber-300 transition cursor-pointer"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                <span>{isAr ? 'رف الكتب' : 'Bookshelf'}</span>
              </button>

              <div className="hidden sm:block border-l border-[#202758] pl-3">
                <span className="text-xs font-bold text-white block truncate max-w-xs lg:max-w-md">
                  {isAr ? activeBook.titleAr : activeBook.titleEn}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeBook.edition} • {isAr ? activeBook.authorAr : activeBook.authorEn}
                </span>
              </div>
            </div>

            {/* Reader Utilities */}
            <div className="flex items-center gap-2">
              {/* Table of Contents Drawer Button */}
              <button
                onClick={() => setIsTocOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12163b] hover:bg-[#191f52] border border-[#232c66] text-xs text-slate-200 transition cursor-pointer"
                title={isAr ? 'فهرس فصول وصفحات الكتاب' : 'Table of Contents'}
              >
                <Menu className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">{isAr ? 'فهرس الكتاب' : 'Index'}</span>
              </button>

              {/* Bookmark Toggle */}
              {currentPage && (
                <button
                  onClick={() => toggleBookmark(activeBook.id, currentPage.pageNumber)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    (bookmarks[activeBook.id] || []).includes(currentPage.pageNumber)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                      : 'bg-[#12163b] text-slate-400 border-[#232c66] hover:text-white'
                  }`}
                  title={isAr ? 'إضافة علامة مرجعية' : 'Bookmark Page'}
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">{isAr ? 'إشارة مرجعية' : 'Bookmark'}</span>
                </button>
              )}

              {/* Font Size Adjuster */}
              <div className="flex items-center bg-[#12163b] border border-[#232c66] rounded-xl p-0.5 text-xs font-bold">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-1 rounded-lg ${fontSize === 'sm' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('md')}
                  className={`px-2 py-1 rounded-lg ${fontSize === 'md' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-1 rounded-lg ${fontSize === 'lg' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  A+
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(prev => !prev)}
                className="p-2 rounded-xl bg-[#12163b] hover:bg-[#191f52] border border-[#232c66] text-slate-200 transition cursor-pointer"
                title={isAr ? 'ملء الشاشة' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Table of Contents Drawer Modal */}
          {isTocOpen && (
            <div className="bg-[#0c0f2b] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#21295c]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-black text-white">
                    {isAr ? 'فهرس فصول ومحتويات الكتاب' : 'Textbook Table of Contents'}
                  </h4>
                </div>
                <button
                  onClick={() => setIsTocOpen(false)}
                  className="p-1.5 rounded-lg bg-[#14193d] hover:bg-[#1e2554] text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {activeBook.pages.map((p, idx) => {
                  const isCurrent = idx === currentPageIndex;
                  const isBookmarked = (bookmarks[activeBook.id] || []).includes(p.pageNumber);
                  const isRead = (readPages[activeBook.id] || []).includes(p.pageNumber);

                  return (
                    <button
                      key={p.pageNumber}
                      onClick={() => {
                        setCurrentPageIndex(idx);
                        setIsTocOpen(false);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className={`text-start p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-[#1e2554] border-amber-400 text-white font-bold'
                          : 'bg-[#090c24] border-[#1d234d] text-slate-300 hover:bg-[#14193d] hover:text-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-amber-400 block font-bold">
                          {isAr ? `صفحة ${p.pageNumber}` : `Page ${p.pageNumber}`} • {isAr ? p.chapterTitleAr : p.chapterTitleEn}
                        </span>
                        <span className="text-xs font-bold truncate block">
                          {isAr ? p.pageTitleAr : p.pageTitleEn}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isBookmarked && <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        {isRead && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= FLIPPABLE BOOK PAGE CONTAINER ================= */}
          {currentPage && (
            <div className="relative">
              {/* Flippable Page Sheet with Texture & Shadows */}
              <div 
                className={`relative bg-gradient-to-br from-[#0c0f2b] via-[#090b20] to-[#060817] border-2 border-[#202859] rounded-3xl p-6 sm:p-12 shadow-2xl min-h-[600px] flex flex-col justify-between transition-all duration-300 ${
                  isFlipping 
                    ? flipDirection === 'next' ? 'opacity-40 translate-x-3 scale-[0.99]' : 'opacity-40 -translate-x-3 scale-[0.99]'
                    : 'opacity-100 translate-x-0 scale-100'
                }`}
              >
                {/* Book Page Header */}
                <div className="border-b border-[#1b224d] pb-4 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-amber-400 font-mono font-bold tracking-wider">
                      {isAr ? currentPage.chapterTitleAr : currentPage.chapterTitleEn}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {isAr ? `صفحة ${currentPage.pageNumber} من ${activeBook.totalPages}` : `Page ${currentPage.pageNumber} of ${activeBook.totalPages}`}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-white mt-3">
                    {isAr ? currentPage.pageTitleAr : currentPage.pageTitleEn}
                  </h2>
                </div>

                {/* Main Content Area */}
                <div className={`space-y-6 ${fontClasses}`}>
                  <p className="text-slate-200 whitespace-pre-line font-sans leading-loose">
                    {isAr ? currentPage.contentAr : currentPage.contentEn}
                  </p>

                  {/* Governing Formula if available */}
                  {currentPage.formula && (
                    <div className="p-4 rounded-2xl bg-[#060714] border border-amber-500/40 text-center space-y-1 shadow-inner">
                      <span className="text-[11px] text-slate-400 block font-sans">
                        {isAr ? currentPage.formula.descriptionAr : currentPage.formula.descriptionEn}
                      </span>
                      <div className="text-base sm:text-xl font-mono text-amber-300 font-black">
                        {currentPage.formula.latex}
                      </div>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {currentPage.keyPointsAr && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1230] border border-[#1e265c] space-y-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                        {isAr ? 'النقاط الهندسية الحاكمة:' : 'Governing Engineering Principles:'}
                      </span>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                        {(isAr ? currentPage.keyPointsAr : currentPage.keyPointsEn || currentPage.keyPointsAr).map((kp, kIdx) => (
                          <li key={kIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ================= EMBEDDED LIVE VIRTUAL EXPERIMENT ================= */}
                  {currentPage.experimentId && (
                    <InteractiveBookExperiment
                      experimentId={currentPage.experimentId}
                      language={language}
                    />
                  )}

                  {/* ================= EMBEDDED SELF-ASSESSMENT QUIZ ================= */}
                  {currentPage.quizQuestion && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#090c24] border border-[#21295e] space-y-4 my-6">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {isAr ? 'اختبار الفهم المعياري للصفحة' : 'Page Self-Assessment Review'}
                        </h4>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-200">
                        {isAr ? currentPage.quizQuestion.questionAr : currentPage.quizQuestion.questionEn}
                      </p>

                      <div className="space-y-2">
                        {(isAr ? currentPage.quizQuestion.optionsAr : currentPage.quizQuestion.optionsEn).map((opt, oIdx) => {
                          const selected = pageQuizAnswers[currentPage.pageNumber];
                          const hasAnswered = selected !== undefined;
                          const isCorrect = oIdx === currentPage.quizQuestion?.correctIndex;

                          let btnClasses = 'bg-[#0e1233] border-[#1e2759] text-slate-300 hover:bg-[#151c4a] hover:text-white';
                          if (hasAnswered) {
                            if (isCorrect) {
                              btnClasses = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                            } else if (selected === oIdx) {
                              btnClasses = 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold';
                            } else {
                              btnClasses = 'bg-[#0a0d24] border-transparent text-slate-500 opacity-50';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleQuizAnswer(currentPage.pageNumber, oIdx)}
                              className={`w-full text-start p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer flex items-center justify-between gap-3 ${btnClasses}`}
                            >
                              <span>{opt}</span>
                              {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {pageQuizAnswers[currentPage.pageNumber] !== undefined && (
                        <div className="p-3.5 rounded-xl bg-[#0e163d] border border-amber-400/40 text-xs text-amber-200 leading-relaxed">
                          <strong className="block mb-1">{isAr ? 'التفسير العلمي المعتمد:' : 'Certified Technical Explanation:'}</strong>
                          {isAr ? currentPage.quizQuestion.explanationAr : currentPage.quizQuestion.explanationEn}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Book Page Footer with Navigation */}
                <div className="border-t border-[#1b224d] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Previous Page Button */}
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPageIndex === 0}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      currentPageIndex === 0
                        ? 'bg-[#101438] text-slate-600 border border-transparent cursor-not-allowed opacity-40'
                        : 'bg-[#12173f] hover:bg-[#1b235e] border border-[#242e70] text-slate-200'
                    }`}
                  >
                    <ChevronLeft className={`w-4 h-4 text-amber-400 ${isAr ? 'rotate-180' : ''}`} />
                    <span>{isAr ? '← الصفحة السابقة' : '← Previous Page'}</span>
                  </button>

                  {/* Page Indicator and Slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {currentPage.pageNumber} / {activeBook.totalPages}
                    </span>
                    <div className="w-32 bg-[#12163b] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${(currentPage.pageNumber / activeBook.totalPages) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Page Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPageIndex === activeBook.pages.length - 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition cursor-pointer ${
                      currentPageIndex === activeBook.pages.length - 1
                        ? 'bg-[#101438] text-slate-600 border border-transparent cursor-not-allowed opacity-40'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                    }`}
                  >
                    <span>{isAr ? 'الصفحة التالية →' : 'Next Page →'}</span>
                    <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
