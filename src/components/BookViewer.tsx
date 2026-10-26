import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Menu, 
  X, 
  RotateCw,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Award,
  Layers,
  FileText
} from 'lucide-react';
import { Language } from '../types';
import { NDT_TEXTBOOKS, NdtTextbook, BookPage } from '../data/ndeTextbooksData';
import { InteractiveBookExperiment } from './academy/InteractiveBookExperiment';
import { 
  generateKnowledgeCheckQuestions, 
  KnowledgeCheckQuestion 
} from '../utils/knowledgeCheckGenerator';

export interface BookViewerProps {
  language?: Language;
  initialBookId?: string;
  initialPageNumber?: number;
  onOpenQuiz?: (disciplineId: string) => void;
  className?: string;
}

// Synthesized Realistic Paper Page-Flip Sound via Web Audio API
const playPageFlipSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Generate gentle white noise burst for paper rustle
    const bufferSize = ctx.sampleRate * 0.16;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.045));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to sound like natural paper movement
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1750;
    filter.Q.value = 1.3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch {
    // Fail silently if audio context is blocked
  }
};

export const BookViewer: React.FC<BookViewerProps> = ({ 
  language = 'ar',
  initialBookId,
  initialPageNumber,
  onOpenQuiz,
  className = ''
}) => {
  const isAr = language === 'ar';

  // Selected Textbook
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || NDT_TEXTBOOKS[0].id);
  const activeBook: NdtTextbook = useMemo(() => {
    return NDT_TEXTBOOKS.find(b => b.id === selectedBookId) || NDT_TEXTBOOKS[0];
  }, [selectedBookId]);

  // Current page index (0 to activeBook.pages.length - 1)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Deep-link support from the NDE-Ed courses (textbook page shortcut).
  useEffect(() => {
    if (!initialBookId) return;
    const target = NDT_TEXTBOOKS.find(book => book.id === initialBookId);
    if (!target) return;
    setSelectedBookId(target.id);
    const index = Math.min(Math.max((initialPageNumber || 1) - 1, 0), target.pages.length - 1);
    setCurrentPageIndex(index);
  }, [initialBookId, initialPageNumber]);

  // 3D Flip animation state
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const [targetPageIndex, setTargetPageIndex] = useState<number>(0);

  // Sound effect enabled
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Table of Contents Drawer
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);

  // Book selection dropdown
  const [isBookSelectorOpen, setIsBookSelectorOpen] = useState<boolean>(false);

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Paper Appearance Theme
  type PaperTheme = 'dark-engineering' | 'parchment' | 'midnight-slate';
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('dark-engineering');

  // Bookmarks in localStorage: Record<bookId, pageNumber[]>
  const BOOKMARK_KEY = 'insco_3d_book_bookmarks';
  const [bookmarks, setBookmarks] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleBookmark = (bookId: string, pageNum: number) => {
    setBookmarks(prev => {
      const list = prev[bookId] || [];
      const updated = list.includes(pageNum) ? list.filter(p => p !== pageNum) : [...list, pageNum];
      const next = { ...prev, [bookId]: updated };
      try {
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // =========================================================================
  // KNOWLEDGE CHECK QUIZ STATE & GENERATION
  // =========================================================================
  // Active question index per page: Record<pageNumber, questionIndex>
  const [activeQuestionIndexes, setActiveQuestionIndexes] = useState<Record<number, number>>({});
  // Selected option per page & question: Record<`${pageNum}_${qId}`, optionIndex>
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  // Mastered questions tracking
  const [masteredPages, setMasteredPages] = useState<Record<number, boolean>>({});

  const currentPage = activeBook.pages[currentPageIndex] || activeBook.pages[0];
  const totalPages = activeBook.pages.length;

  // Generate Knowledge Check questions dynamically for current page
  const pageQuestions: KnowledgeCheckQuestion[] = useMemo(() => {
    return generateKnowledgeCheckQuestions(currentPage, language, activeBook.discipline);
  }, [currentPage, language, activeBook.discipline]);

  const currentQIndex = (activeQuestionIndexes[currentPage.pageNumber] || 0) % (pageQuestions.length || 1);
  const currentQuestion = pageQuestions[currentQIndex] || pageQuestions[0];
  const answerKey = `${currentPage.pageNumber}_${currentQuestion?.id || 'default'}`;
  const selectedOption = selectedAnswers[answerKey];
  const hasAnswered = selectedOption !== undefined;
  const isCorrect = hasAnswered && selectedOption === currentQuestion?.correctIndex;

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [answerKey]: optIndex
    }));
    if (optIndex === currentQuestion.correctIndex) {
      setMasteredPages(prev => ({
        ...prev,
        [currentPage.pageNumber]: true
      }));
    }
  };

  const handleRetryQuestion = () => {
    setSelectedAnswers(prev => {
      const updated = { ...prev };
      delete updated[answerKey];
      return updated;
    });
  };

  const handleNextQuestion = () => {
    if (pageQuestions.length > 1) {
      setActiveQuestionIndexes(prev => ({
        ...prev,
        [currentPage.pageNumber]: (currentQIndex + 1) % pageQuestions.length
      }));
    }
  };

  // =========================================================================
  // 3D PAGE TURNING LOGIC
  // =========================================================================
  const flipToNextPage = useCallback(() => {
    if (isFlipping || currentPageIndex >= totalPages - 1) return;
    
    if (soundEnabled) playPageFlipSound();
    setFlipDirection('forward');
    setTargetPageIndex(currentPageIndex + 1);
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentPageIndex(prev => prev + 1);
      setIsFlipping(false);
    }, 550);
  }, [isFlipping, currentPageIndex, totalPages, soundEnabled]);

  const flipToPrevPage = useCallback(() => {
    if (isFlipping || currentPageIndex <= 0) return;

    if (soundEnabled) playPageFlipSound();
    setFlipDirection('backward');
    setTargetPageIndex(currentPageIndex - 1);
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentPageIndex(prev => prev - 1);
      setIsFlipping(false);
    }, 550);
  }, [isFlipping, currentPageIndex, soundEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTocOpen || isBookSelectorOpen) return;
      if (e.key === 'ArrowRight') {
        if (isAr) flipToPrevPage();
        else flipToNextPage();
      } else if (e.key === 'ArrowLeft') {
        if (isAr) flipToNextPage();
        else flipToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAr, isTocOpen, isBookSelectorOpen, flipToNextPage, flipToPrevPage]);

  // Theme styling configurations
  const themeStyles = useMemo(() => {
    switch (paperTheme) {
      case 'parchment':
        return {
          bookCover: 'bg-gradient-to-r from-[#2c1c0c] via-[#452b12] to-[#2c1c0c] border-[#8c6239]',
          pagePaper: 'bg-[#fcf8f0] text-[#1c1813] border-[#e2d5c3] shadow-[inset_0_0_40px_rgba(139,94,60,0.12)]',
          pageHeaderBorder: 'border-[#dfcebc]',
          textColor: 'text-[#2a241e]',
          headingColor: 'text-[#7a3e10]',
          formulaBg: 'bg-[#f3ebe0] border-[#d8c7b3] text-[#78350f]',
          calloutBg: 'bg-[#f7f0e4] border-[#d8c5af]',
          pageNumberColor: 'text-[#8c745d]',
          quizCardBg: 'bg-[#f5ecdd] border-[#dfceba]',
          quizOptionDefault: 'bg-[#fffdf9] border-[#d8c6b2] text-[#2c2217] hover:bg-[#eae0cf]',
          spineShadow: 'linear-gradient(to right, rgba(44,28,12,0.35), transparent 8%, transparent 92%, rgba(44,28,12,0.35))'
        };
      case 'midnight-slate':
        return {
          bookCover: 'bg-gradient-to-r from-[#0d131f] via-[#1a2336] to-[#0d131f] border-[#2f3e5b]',
          pagePaper: 'bg-[#0f172a] text-[#f1f5f9] border-[#1e293b] shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]',
          pageHeaderBorder: 'border-[#1e293b]',
          textColor: 'text-slate-200',
          headingColor: 'text-sky-300',
          formulaBg: 'bg-[#090d16] border-sky-500/40 text-sky-300',
          calloutBg: 'bg-[#131d33] border-[#233559]',
          pageNumberColor: 'text-slate-400',
          quizCardBg: 'bg-[#0c1322] border-[#1e2a42]',
          quizOptionDefault: 'bg-[#131d33] border-[#233352] text-slate-200 hover:bg-[#1a2642]',
          spineShadow: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent 8%, transparent 92%, rgba(0,0,0,0.5))'
        };
      case 'dark-engineering':
      default:
        return {
          bookCover: 'bg-gradient-to-r from-[#0e122b] via-[#161c44] to-[#0e122b] border-[#293577]',
          pagePaper: 'bg-gradient-to-br from-[#0c0f2b] via-[#090b20] to-[#060817] text-slate-100 border-[#202758] shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]',
          pageHeaderBorder: 'border-[#1c2352]',
          textColor: 'text-slate-200',
          headingColor: 'text-amber-300',
          formulaBg: 'bg-[#050714] border-amber-500/40 text-amber-300',
          calloutBg: 'bg-[#0d1230] border-[#1f2759]',
          pageNumberColor: 'text-amber-400',
          quizCardBg: 'bg-[#080b1e] border-[#1b2354]',
          quizOptionDefault: 'bg-[#0e1333] border-[#1f285e] text-slate-200 hover:bg-[#151c4a]',
          spineShadow: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent 8%, transparent 92%, rgba(0,0,0,0.6))'
        };
    }
  }, [paperTheme]);

  // Page Stack Thickness calculation
  const leftStackThickness = Math.max(3, Math.round(((currentPageIndex + 1) / totalPages) * 14));
  const rightStackThickness = Math.max(3, Math.round(((totalPages - currentPageIndex) / totalPages) * 14));

  // The destination page for the 3D flipping leaf
  const nextTargetPage = flipDirection === 'forward'
    ? activeBook.pages[currentPageIndex + 1]
    : activeBook.pages[currentPageIndex - 1];

  return (
    <div 
      ref={containerRef}
      dir={isAr ? 'rtl' : 'ltr'} 
      className={`relative select-none font-sans text-slate-100 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#04050d] p-4 sm:p-8 overflow-y-auto' : ''} ${className}`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP BOOK CONTROLLER & TOOLBAR */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0d24] border-2 border-[#1f275c] p-3 sm:p-4 rounded-3xl shadow-2xl mb-6">
        {/* Book Selector Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsBookSelectorOpen(prev => !prev)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#14193d] hover:bg-[#1d255c] border border-amber-500/40 text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="truncate max-w-[200px] sm:max-w-xs">
              {isAr ? activeBook.titleAr : activeBook.titleEn}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform ${isBookSelectorOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Book Selector Dropdown Menu */}
          {isBookSelectorOpen && (
            <div className="absolute top-full mt-2 z-40 w-72 sm:w-80 bg-[#0d112d] border-2 border-amber-500/40 rounded-3xl p-3 shadow-2xl space-y-1.5 animate-fadeIn">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
                {isAr ? 'اختر الكتاب الدراسي التخصصي:' : 'Select NDT Textbook:'}
              </span>
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {NDT_TEXTBOOKS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBookId(b.id);
                      setCurrentPageIndex(0);
                      setIsBookSelectorOpen(false);
                      if (soundEnabled) playPageFlipSound();
                    }}
                    className={`w-full text-start p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      b.id === activeBook.id
                        ? 'bg-[#202966] text-amber-300 border-amber-400'
                        : 'bg-[#101435] text-slate-300 hover:bg-[#182050] hover:text-white border-transparent'
                    }`}
                  >
                    <span className="truncate">{isAr ? b.titleAr : b.titleEn}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-amber-400 font-mono">
                      {b.discipline}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Center: Page Numbers & Quick Flip Buttons */}
        <div className="flex items-center gap-2 bg-[#12163b] px-3 py-1.5 rounded-2xl border border-[#232c66]">
          <button
            onClick={flipToPrevPage}
            disabled={currentPageIndex === 0 || isFlipping}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              currentPageIndex === 0 ? 'text-slate-600 opacity-40 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-[#1e2554]'
            }`}
            title={isAr ? 'الصفحة السابقة' : 'Previous Page'}
          >
            <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </button>

          <span className="text-xs font-mono font-bold text-amber-400 px-2 min-w-[70px] text-center">
            {currentPage.pageNumber} / {totalPages}
          </span>

          <button
            onClick={flipToNextPage}
            disabled={currentPageIndex >= totalPages - 1 || isFlipping}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              currentPageIndex >= totalPages - 1 ? 'text-slate-600 opacity-40 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-[#1e2554]'
            }`}
            title={isAr ? 'الصفحة التالية' : 'Next Page'}
          >
            <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Toolbar Utilities (Sound, Bookmark, Theme, TOC, Fullscreen) */}
        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
              soundEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#12163b] text-slate-500 border-[#232c66]'
            }`}
            title={soundEnabled ? (isAr ? 'صوت تقليب الصفحات: مفعل' : 'Page Turn Sound: ON') : (isAr ? 'صوت تقليب الصفحات: مكتوم' : 'Page Turn Sound: MUTED')}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => toggleBookmark(activeBook.id, currentPage.pageNumber)}
            className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
              (bookmarks[activeBook.id] || []).includes(currentPage.pageNumber)
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-[#12163b] text-slate-400 border-[#232c66] hover:text-white'
            }`}
            title={isAr ? 'إشارة مرجعية للصفحة' : 'Bookmark Page'}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Theme Switcher */}
          <div className="hidden sm:flex items-center bg-[#12163b] border border-[#232c66] rounded-xl p-0.5">
            <button
              onClick={() => setPaperTheme('dark-engineering')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${paperTheme === 'dark-engineering' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              title={isAr ? 'ورق هندسي ليلي' : 'Dark Engineering Paper'}
            >
              Dark
            </button>
            <button
              onClick={() => setPaperTheme('parchment')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${paperTheme === 'parchment' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              title={isAr ? 'ورق عتيق كلاسيكي' : 'Classic Parchment'}
            >
              Classic
            </button>
          </div>

          {/* Table of Contents Button */}
          <button
            onClick={() => setIsTocOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#12163b] hover:bg-[#1c235c] border border-[#232c66] text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{isAr ? 'الفهرس' : 'TOC'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-2 rounded-xl bg-[#12163b] hover:bg-[#1c235c] border border-[#232c66] text-slate-200 transition cursor-pointer"
            title={isAr ? 'وضع ملء الشاشة' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLE OF CONTENTS MODAL */}
      {/* ========================================================================= */}
      {isTocOpen && (
        <div className="bg-[#0b0e26] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl mb-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#21295c]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-black text-white">
                {isAr ? 'فهرس فصول وموضوعات الكتاب الدراسي' : 'Table of Contents & Chapters'}
              </h4>
            </div>
            <button
              onClick={() => setIsTocOpen(false)}
              className="p-1.5 rounded-lg bg-[#14193d] hover:bg-[#1e2554] text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {activeBook.pages.map((p, idx) => {
              const isCurrent = idx === currentPageIndex;
              const isBookmarked = (bookmarks[activeBook.id] || []).includes(p.pageNumber);
              const isMastered = masteredPages[p.pageNumber];

              return (
                <button
                  key={p.pageNumber}
                  onClick={() => {
                    setCurrentPageIndex(idx);
                    setIsTocOpen(false);
                    if (soundEnabled) playPageFlipSound();
                  }}
                  className={`text-start p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#1e2554] border-amber-400 text-white font-bold'
                      : 'bg-[#0d1029] border-[#1d234d] text-slate-300 hover:bg-[#14193d] hover:text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {isAr ? `صفحة ${p.pageNumber}` : `Page ${p.pageNumber}`}
                      </span>
                      {isMastered && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {isAr ? 'فهم تام' : 'Mastered'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold truncate block mt-0.5">
                      {isAr ? p.pageTitleAr : p.pageTitleEn}
                    </span>
                  </div>

                  {isBookmarked && (
                    <Bookmark className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PHYSICAL 3D BOOK DESK & 3D PAGE-FLIP CONTAINER */}
      {/* ========================================================================= */}
      <div 
        className="relative mx-auto my-4 transition-all duration-300"
        style={{ perspective: '2600px' }}
      >
        {/* Hardcover Outer Frame with Leatherette Edge & Metal Corners */}
        <div 
          className={`relative rounded-[32px] p-2.5 sm:p-5 border-4 ${themeStyles.bookCover} shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)]`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Metal Corner Protectors (Top-Right, Top-Left, Bottom-Right, Bottom-Left) */}
          <div className="absolute top-1 right-1 w-7 h-7 border-t-2 border-r-2 border-amber-400/70 rounded-tr-xl pointer-events-none z-30" />
          <div className="absolute top-1 left-1 w-7 h-7 border-t-2 border-l-2 border-amber-400/70 rounded-tl-xl pointer-events-none z-30" />
          <div className="absolute bottom-1 right-1 w-7 h-7 border-b-2 border-r-2 border-amber-400/70 rounded-br-xl pointer-events-none z-30" />
          <div className="absolute bottom-1 left-1 w-7 h-7 border-b-2 border-l-2 border-amber-400/70 rounded-bl-xl pointer-events-none z-30" />

          {/* Bookmark Silk Ribbon Hanging from Top */}
          <div 
            onClick={() => toggleBookmark(activeBook.id, currentPage.pageNumber)}
            className="absolute -top-3 left-16 sm:left-24 z-40 w-5 h-16 bg-gradient-to-b from-rose-600 via-rose-700 to-rose-900 shadow-xl cursor-pointer hover:h-20 transition-all rounded-b-md"
            title={isAr ? 'شريط العلامة المرجعية (انقر للتثبيت)' : 'Silk Bookmark Ribbon (Click to toggle)'}
          >
            <div className="w-full h-full border-x border-rose-400/30 flex items-end justify-center pb-1">
              <span className="w-1.5 h-1.5 bg-amber-300 rounded-full" />
            </div>
          </div>

          {/* ================= THE OPEN BOOK SPREAD ================= */}
          <div className="relative rounded-[24px] overflow-hidden min-h-[660px]">
            {/* Page Stack Thickness Layer (Multi-border depth) */}
            <div 
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                boxShadow: isAr
                  ? `inset ${rightStackThickness}px 0 0 rgba(0,0,0,0.4), inset -${leftStackThickness}px 0 0 rgba(0,0,0,0.4)`
                  : `inset ${leftStackThickness}px 0 0 rgba(0,0,0,0.4), inset -${rightStackThickness}px 0 0 rgba(0,0,0,0.4)`
              }}
            />

            {/* Central Book Spine Fold & Seam */}
            <div 
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 z-30 pointer-events-none"
              style={{ background: themeStyles.spineShadow }}
            />

            {/* ================= 3D FLIPPING LEAF SIMULATION LAYER ================= */}
            {isFlipping && nextTargetPage && (
              <div 
                className="absolute inset-0 z-30 pointer-events-none"
                style={{
                  perspective: '2200px',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  className={`absolute inset-0 rounded-[22px] transition-transform duration-500 ease-in-out ${themeStyles.pagePaper}`}
                  style={{
                    transformOrigin: isAr
                      ? (flipDirection === 'forward' ? '0% 50%' : '100% 50%')
                      : (flipDirection === 'forward' ? '100% 50%' : '0% 50%'),
                    transform: flipDirection === 'forward'
                      ? (isAr ? 'rotateY(75deg)' : 'rotateY(-75deg)')
                      : (isAr ? 'rotateY(-75deg)' : 'rotateY(75deg)'),
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                  }}
                >
                  {/* Dynamic Light/Shadow gradient sweeping over the turning leaf */}
                  <div 
                    className="absolute inset-0 rounded-[22px]"
                    style={{
                      background: flipDirection === 'forward'
                        ? 'linear-gradient(to right, rgba(0,0,0,0.35), transparent 40%, rgba(255,255,255,0.06) 80%, rgba(0,0,0,0.25))'
                        : 'linear-gradient(to left, rgba(0,0,0,0.35), transparent 40%, rgba(255,255,255,0.06) 80%, rgba(0,0,0,0.25))'
                    }}
                  />
                </div>
              </div>
            )}

            {/* ================= ACTIVE PAGE SURFACE ================= */}
            <div 
              className={`relative z-10 p-6 sm:p-12 border-2 rounded-[22px] min-h-[660px] flex flex-col justify-between transition-all duration-300 ${themeStyles.pagePaper}`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipping 
                  ? (flipDirection === 'forward' 
                      ? (isAr ? 'rotateY(4deg) translateZ(8px)' : 'rotateY(-4deg) translateZ(8px)') 
                      : (isAr ? 'rotateY(-4deg) translateZ(8px)' : 'rotateY(4deg) translateZ(8px)'))
                  : 'rotateY(0deg) translateZ(0)'
              }}
            >
              {/* Top Page Header & Breadcrumb */}
              <div>
                <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-4 mb-6 ${themeStyles.pageHeaderBorder}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                    <span className={`text-xs font-mono font-bold tracking-wider ${themeStyles.headingColor}`}>
                      {isAr ? currentPage.chapterTitleAr : currentPage.chapterTitleEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    {masteredPages[currentPage.pageNumber] && (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isAr ? 'مُتقن' : 'Mastered'}</span>
                      </span>
                    )}

                    <span className={themeStyles.pageNumberColor}>
                      {isAr ? `صفحة ${currentPage.pageNumber} من ${totalPages}` : `Page ${currentPage.pageNumber} of ${totalPages}`}
                    </span>
                    {(bookmarks[activeBook.id] || []).includes(currentPage.pageNumber) && (
                      <Bookmark className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    )}
                  </div>
                </div>

                {/* Page Title */}
                <h2 className="text-xl sm:text-3xl font-black mb-6 leading-tight">
                  {isAr ? currentPage.pageTitleAr : currentPage.pageTitleEn}
                </h2>

                {/* Main Technical Content Text */}
                <div className={`space-y-6 text-xs sm:text-sm leading-relaxed ${themeStyles.textColor}`}>
                  <p className="whitespace-pre-line font-sans leading-loose text-justify">
                    {isAr ? currentPage.contentAr : currentPage.contentEn}
                  </p>

                  {/* Governing Formula in Textbook Style */}
                  {currentPage.formula && (
                    <div className={`p-4 rounded-2xl border text-center space-y-1 shadow-inner my-5 ${themeStyles.formulaBg}`}>
                      <span className="text-[11px] opacity-80 block font-sans">
                        {isAr ? currentPage.formula.descriptionAr : currentPage.formula.descriptionEn}
                      </span>
                      <div className="text-base sm:text-xl font-mono font-black tracking-wide">
                        {currentPage.formula.latex}
                      </div>
                    </div>
                  )}

                  {/* Key Engineering Principles Callout Box */}
                  {currentPage.keyPointsAr && (
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 my-5 ${themeStyles.calloutBg}`}>
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'النقاط الهندسية الحاكمة في هذا الباب:' : 'Governing Engineering Takeaways:'}</span>
                      </span>
                      <ul className="space-y-2 text-xs">
                        {(isAr ? currentPage.keyPointsAr : currentPage.keyPointsEn || currentPage.keyPointsAr).map((kp, kIdx) => (
                          <li key={kIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ================= EMBEDDED LIVE VIRTUAL LABORATORY ================= */}
                  {currentPage.experimentId && (
                    <div className="my-6">
                      <InteractiveBookExperiment
                        experimentId={currentPage.experimentId}
                        language={language}
                      />
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* KNOWLEDGE CHECK QUIZ FEATURE (GENERATED FROM CURRENT PAGE CONTENT) */}
                  {/* ========================================================================= */}
                  <div className={`p-5 sm:p-6 rounded-3xl border-2 space-y-4 my-8 shadow-xl transition-all ${themeStyles.quizCardBg}`}>
                    {/* Header with Title and Generator Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-black text-white">
                              {isAr ? 'اختبار الفهم • Knowledge Check' : 'Knowledge Check Quiz'}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                              {isAr ? currentQuestion.conceptTagAr : currentQuestion.conceptTagEn}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {isAr 
                              ? 'أسئلة معيارية مولّدة آلياً ومباشرة من محتوى ومعادلات هذه الصفحة لترسيخ الفهم الهندسي'
                              : 'Multiple-choice questions dynamically generated from this page content & equations to reinforce learning'}
                          </p>
                        </div>
                      </div>

                      {/* Generator & Question Switcher Controls */}
                      <div className="flex items-center gap-2">
                        {pageQuestions.length > 1 && (
                          <button
                            onClick={handleNextQuestion}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14193d] hover:bg-[#1d2458] border border-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer shadow-sm"
                            title={isAr ? 'توليد وتبديل سؤال فحص آخر عن الصفحة' : 'Cycle next question generated for this page'}
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isAr ? `سؤال آخر (${currentQIndex + 1}/${pageQuestions.length})` : `Next Q (${currentQIndex + 1}/${pageQuestions.length})`}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div className="p-3.5 rounded-2xl bg-black/20 border border-[#202758]">
                      <span className="text-[10px] font-mono font-bold text-amber-400 block mb-1">
                        {isAr ? `السؤال ${currentQIndex + 1}:` : `Question ${currentQIndex + 1}:`}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed">
                        {isAr ? currentQuestion.questionAr : currentQuestion.questionEn}
                      </p>
                    </div>

                    {/* Options (A, B, C, D) */}
                    <div className="space-y-2.5">
                      {(isAr ? currentQuestion.optionsAr : currentQuestion.optionsEn).map((opt, oIdx) => {
                        const optionLabelsAr = ['أ', 'ب', 'ج', 'د'];
                        const optionLabelsEn = ['A', 'B', 'C', 'D'];
                        const label = isAr ? optionLabelsAr[oIdx] : optionLabelsEn[oIdx];

                        let optionClasses = themeStyles.quizOptionDefault;

                        if (hasAnswered) {
                          if (oIdx === currentQuestion.correctIndex) {
                            optionClasses = 'bg-emerald-950/70 border-emerald-400 text-emerald-200 font-bold shadow-lg shadow-emerald-900/30';
                          } else if (selectedOption === oIdx) {
                            optionClasses = 'bg-rose-950/70 border-rose-500 text-rose-200 font-bold shadow-lg shadow-rose-900/30';
                          } else {
                            optionClasses = 'bg-black/30 border-transparent text-slate-500 opacity-40';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            data-testid={`knowledge-check-option-${oIdx}`}
                            onClick={() => handleSelectOption(oIdx)}
                            disabled={hasAnswered}
                            className={`w-full text-start p-3 sm:p-3.5 rounded-2xl border text-xs leading-relaxed transition-all flex items-center justify-between gap-3 ${optionClasses} ${!hasAnswered ? 'cursor-pointer hover:border-amber-400 hover:scale-[1.01]' : 'cursor-default'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 text-amber-400">
                                {label}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {hasAnswered && oIdx === currentQuestion.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            {hasAnswered && selectedOption === oIdx && oIdx !== currentQuestion.correctIndex && (
                              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback and Scientific Explanation */}
                    {hasAnswered && (
                      <div className={`p-4 rounded-2xl border space-y-2 animate-fadeIn ${
                        isCorrect 
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-rose-400" />
                            )}
                            <strong className="text-xs sm:text-sm font-black">
                              {isCorrect 
                                ? (isAr ? 'إجابة صحيحة ومطابقة للمعايير الهندسية!' : 'Correct Answer! Verified by NDT Principles.') 
                                : (isAr ? 'إجابة غير صحيحة - راجع التفسير العلمي أدناه' : 'Incorrect. Review the technical explanation below.')}
                            </strong>
                          </div>

                          {!isCorrect && (
                            <button
                              onClick={handleRetryQuestion}
                              className="px-3 py-1 rounded-xl bg-[#14193d] hover:bg-[#1e2554] border border-amber-400 text-amber-300 text-xs font-bold transition cursor-pointer"
                            >
                              {isAr ? 'إعادة المحاولة' : 'Try Again'}
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed pt-1">
                          <span className="font-bold text-amber-300 block mb-1">
                            {isAr ? 'التفسير العلمي المعتمد للصفحة:' : 'Certified Engineering Explanation:'}
                          </span>
                          {isAr ? currentQuestion.explanationAr : currentQuestion.explanationEn}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ================= BOTTOM FLIPPING ACTION FOOTER ================= */}
              <div className={`border-t pt-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 ${themeStyles.pageHeaderBorder}`}>
                {/* Previous Page Turn Button */}
                <button
                  onClick={flipToPrevPage}
                  disabled={currentPageIndex === 0 || isFlipping}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    currentPageIndex === 0
                      ? 'bg-[#12163b] text-slate-600 border border-transparent cursor-not-allowed opacity-40'
                      : 'bg-[#141a47] hover:bg-[#1e2666] border border-[#27347a] text-slate-200 hover:scale-[1.02]'
                  }`}
                >
                  <ArrowLeft className={`w-3.5 h-3.5 text-amber-400 ${isAr ? 'rotate-180' : ''}`} />
                  <span>{isAr ? '← اقلب للصفحة السابقة' : '← Flip to Previous Page'}</span>
                </button>

                {/* Page Number & Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {currentPage.pageNumber} / {totalPages}
                  </span>
                  <div className="w-28 sm:w-36 bg-[#12163b] h-2 rounded-full overflow-hidden border border-[#202758]">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(currentPage.pageNumber / totalPages) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Next Page Turn Button */}
                <button
                  onClick={flipToNextPage}
                  disabled={currentPageIndex >= totalPages - 1 || isFlipping}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg cursor-pointer ${
                    currentPageIndex >= totalPages - 1
                      ? 'bg-[#12163b] text-slate-600 border border-transparent cursor-not-allowed opacity-40'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 hover:scale-[1.02]'
                  }`}
                >
                  <span>{isAr ? 'اقلب للصفحة التالية →' : 'Flip to Next Page →'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Interactive Corner Curl Cue */}
              <div 
                onClick={currentPageIndex < totalPages - 1 ? flipToNextPage : undefined}
                className="absolute bottom-2 end-2 w-10 h-10 cursor-pointer overflow-hidden opacity-60 hover:opacity-100 transition-opacity pointer-events-auto"
                title={isAr ? 'انقر على حافة الصفحة للتقليب' : 'Click corner to flip page'}
              >
                <div className="w-full h-full border-b-2 border-e-2 border-amber-400/80 rounded-br-lg transform rotate-0 hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. KEYBOARD SHORTCUTS & HINTS CUE */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-mono pt-2">
        <span>{isAr ? '⌨️ تصفح بالأسهم: استخدم ← و → في لوحة المفاتيح لتقليب الصفحات ككتاب ورقي حقيقي' : '⌨️ Keyboard Navigation: Use Left and Right arrow keys to flip pages'}</span>
        <span>•</span>
        <span>{isAr ? '💡 اختبار الفهم: أسئلة متعددة الخيارات مع شروح تقنية مولدة لكل صفحة' : '💡 Knowledge Check: Multi-choice questions generated for each page'}</span>
      </div>
    </div>
  );
};
