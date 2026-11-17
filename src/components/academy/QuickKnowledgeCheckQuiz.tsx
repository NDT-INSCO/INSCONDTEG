import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../../types';
import { NdtTextbook } from '../../data/ndeTextbooksData';
import { EdbDocument } from '../../edb/types';
import { useTheme } from '../../utils/themeStore';
import {
  QuickCheckItem,
  QuickCheckScope,
  buildTextbookKnowledgeCheckDeck,
  buildEdbKnowledgeCheckDeck,
  getBookQuickCheckRecord,
  recordQuickCheckAnswer,
  resetQuickCheckBookProgress,
} from '../../utils/textbookKnowledgeCheckBank';

export interface QuickKnowledgeCheckQuizProps {
  language: Language;
  /** Loaded NdtTextbook from the Academy 3D Reader / Encyclopedia */
  textbook?: NdtTextbook;
  /** Or loaded EdbDocument from the EDB Digital Book Reader */
  edbDocument?: EdbDocument;
  /** 1-based page number currently open in the textbook reader */
  activePageNumber?: number;
  /** Optional list of textbooks allowing learners to switch the loaded book */
  availableTextbooks?: NdtTextbook[];
  /** Syncs textbook selection back to the reader */
  onSelectTextbook?: (bookId: string) => void;
  /** Jumps the textbook reader directly to the question's cited page */
  onJumpToPage?: (pageNumber: number) => void;
  /** Default quiz scope */
  defaultScope?: QuickCheckScope;
  /** Maximum questions in loaded_book mode */
  maxQuestions?: number;
  className?: string;
}

export const QuickKnowledgeCheckQuiz: React.FC<QuickKnowledgeCheckQuizProps> = ({
  language,
  textbook,
  edbDocument,
  activePageNumber = 1,
  availableTextbooks,
  onSelectTextbook,
  onJumpToPage,
  defaultScope = 'loaded_book',
  maxQuestions = 8,
  className = '',
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();

  const [scope, setScope] = useState<QuickCheckScope>(defaultScope);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // Session selections: questionId -> chosen option index
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, number>>({});

  const activeBookId = textbook?.id || edbDocument?.id || 'default-book';
  const activeBookTitle = textbook
    ? isAr
      ? textbook.titleAr
      : textbook.titleEn
    : edbDocument
      ? isAr
        ? edbDocument.metadata.title.ar
        : edbDocument.metadata.title.en
      : isAr
        ? 'المرجع الهندسي المحمّل'
        : 'Loaded NDT Textbook';

  const activeDiscipline = textbook
    ? textbook.discipline
    : edbDocument?.metadata.relatedDiscipline || 'NDT';

  const activeStandards = textbook
    ? textbook.applicableStandards.slice(0, 3).join(' · ')
    : (edbDocument?.metadata.standards || []).slice(0, 3).join(' · ');

  const [persistedRecord, setPersistedRecord] = useState(() =>
    getBookQuickCheckRecord(activeBookId)
  );

  useEffect(() => {
    setPersistedRecord(getBookQuickCheckRecord(activeBookId));
  }, [activeBookId]);

  const deck: QuickCheckItem[] = useMemo(() => {
    if (textbook) {
      return buildTextbookKnowledgeCheckDeck(textbook, {
        scope,
        pageNumber: activePageNumber,
        maxQuestions,
      });
    }
    if (edbDocument) {
      return buildEdbKnowledgeCheckDeck(edbDocument, {
        scope,
        pageNumber: activePageNumber,
        maxQuestions,
      });
    }
    return [];
  }, [textbook, edbDocument, scope, activePageNumber, maxQuestions]);

  // Reset index cleanly whenever book or scope changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeBookId, scope, activePageNumber]);

  const safeIndex = deck.length > 0 ? Math.min(currentIndex, deck.length - 1) : 0;
  const currentQuestion = deck[safeIndex];

  const sessionStats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    for (const item of deck) {
      const choice = selectedByQuestion[item.id];
      if (choice !== undefined) {
        answered += 1;
        if (choice === item.correctIndex) {
          correct += 1;
        }
      }
    }
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return {
      answered,
      correct,
      total: deck.length,
      accuracy,
      allAnswered: deck.length > 0 && answered === deck.length,
    };
  }, [deck, selectedByQuestion]);

  if (!currentQuestion) {
    return null;
  }

  const selectedOption = selectedByQuestion[currentQuestion.id];
  const hasAnsweredCurrent = selectedOption !== undefined;
  const isCurrentCorrect =
    hasAnsweredCurrent && selectedOption === currentQuestion.correctIndex;

  const handleChooseOption = (optionIndex: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedByQuestion(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
    const updated = recordQuickCheckAnswer(
      activeBookId,
      currentQuestion.id,
      optionIndex === currentQuestion.correctIndex
    );
    setPersistedRecord(updated);
  };

  const handleRetryCurrentQuestion = () => {
    setSelectedByQuestion(prev => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const handleResetQuiz = () => {
    setSelectedByQuestion(prev => {
      const next = { ...prev };
      for (const item of deck) {
        delete next[item.id];
      }
      return next;
    });
    resetQuickCheckBookProgress(activeBookId);
    setPersistedRecord(getBookQuickCheckRecord(activeBookId));
    setCurrentIndex(0);
  };

  const handleRetryMissedOnly = () => {
    const firstMissedIdx = deck.findIndex(item => {
      const picked = selectedByQuestion[item.id];
      return picked !== undefined && picked !== item.correctIndex;
    });
    setSelectedByQuestion(prev => {
      const next = { ...prev };
      for (const item of deck) {
        if (next[item.id] !== undefined && next[item.id] !== item.correctIndex) {
          delete next[item.id];
        }
      }
      return next;
    });
    if (firstMissedIdx >= 0) {
      setCurrentIndex(firstMissedIdx);
    }
  };

  const optionLabels = isAr ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
  const optionsList = isAr ? currentQuestion.optionsAr : currentQuestion.optionsEn;

  // Theme-adaptive surface classes (strictly WCAG AA compliant in Light & Dark modes)
  const shellSurface = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-[#0b0e24] border-[#1f2759] text-slate-100';
  const subtleDivider = isLight ? 'border-slate-200' : 'border-[#1d2554]';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';
  const segmentedTrack = isLight
    ? 'bg-slate-100 border border-slate-200'
    : 'bg-[#111638] border border-[#232c66]';
  const segmentedActive = isLight
    ? 'bg-slate-900 text-white shadow-xs'
    : 'bg-amber-500 text-slate-950 font-bold';
  const segmentedInactive = isLight
    ? 'text-slate-700 hover:text-slate-950'
    : 'text-slate-300 hover:text-white';
  const secondaryBtn = isLight
    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
    : 'bg-[#13183d] hover:bg-[#1b2256] border border-[#273273] text-slate-200';
  const primaryBtn = isLight
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : 'bg-amber-500 hover:bg-amber-400 text-slate-950';

  return (
    <section
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="quick-knowledge-check"
      aria-label={isAr ? 'اختبار المعرفة السريع' : 'Quick Knowledge Check'}
      className={`rounded-2xl border p-5 sm:p-7 transition-colors ${shellSurface} ${className}`}
    >
      {/* 1. Header: Kicker, Title, Loaded Textbook Context & Scope Switcher */}
      <div className={`flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b ${subtleDivider}`}>
        <div className="space-y-1.5 min-w-0">
          {/* Quiet unboxed metadata line (no pills) */}
          <div className={`flex flex-wrap items-center gap-2 text-xs ${mutedText}`}>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {isAr ? 'اختبار المعرفة السريع' : 'Quick Knowledge Check'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{activeDiscipline}</span>
            {activeStandards && (
              <>
                <span aria-hidden="true">·</span>
                <span dir="ltr">{activeStandards}</span>
              </>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-balance">
            {isAr
              ? `اختبر استيعابك لمحتوى: ${activeBookTitle}`
              : `Quick Knowledge Check: ${activeBookTitle}`}
          </h3>

          <p className={`text-xs sm:text-sm leading-relaxed max-w-3xl ${mutedText}`}>
            {isAr
              ? 'اختر الإجابة الصحيحة للحصول على تصحيح فوري وتفسير هندسي مفصّل مستند مباشرةً إلى صفحات ومعادلات المرجع المحمّل.'
              : 'Select an answer below to receive immediate verification and a detailed engineering explanation grounded in the loaded textbook.'}
          </p>
        </div>

        {/* Controls: Optional Textbook Switcher + Scope Segmented Control */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {availableTextbooks && availableTextbooks.length > 1 && onSelectTextbook && textbook && (
            <label className="sr-only" htmlFor="quick-check-book-select">
              {isAr ? 'اختر الكتاب المحمّل' : 'Loaded Textbook'}
            </label>
          )}
          {availableTextbooks && availableTextbooks.length > 1 && onSelectTextbook && textbook && (
            <div className="relative">
              <select
                id="quick-check-book-select"
                data-testid="quick-check-book-select"
                value={textbook.id}
                onChange={e => onSelectTextbook(e.target.value)}
                aria-label={isAr ? 'اختر الكتاب الدراسي للاختبار' : 'Select loaded textbook for quiz'}
                className={`rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer max-w-[230px] truncate ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900'
                    : 'bg-[#111638] border border-[#263170] text-slate-100'
                }`}
              >
                {availableTextbooks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.discipline} — {isAr ? b.titleAr : b.titleEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Functional Segmented Scope Toggle */}
          <div
            role="group"
            aria-label={isAr ? 'نطاق أسئلة الاختبار' : 'Quiz question scope'}
            className={`inline-flex items-center p-1 rounded-xl ${segmentedTrack}`}
          >
            <button
              type="button"
              data-testid="quick-check-scope-book"
              onClick={() => setScope('loaded_book')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                scope === 'loaded_book' ? segmentedActive : segmentedInactive
              }`}
            >
              {isAr ? 'الكتاب كاملاً' : 'Loaded Textbook'}
            </button>
            <button
              type="button"
              data-testid="quick-check-scope-page"
              onClick={() => setScope('current_page')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                scope === 'current_page' ? segmentedActive : segmentedInactive
              }`}
            >
              {isAr ? `الصفحة الحالية (${activePageNumber})` : `Current Page (p. ${activePageNumber})`}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Progress & Live Score Bar (Unboxed Tabular Metrics + Question Stepper) */}
      <div className={`py-4 border-b ${subtleDivider} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums">
          <span className="font-semibold">
            {isAr
              ? `السؤال ${safeIndex + 1} من ${deck.length}`
              : `Question ${safeIndex + 1} of ${deck.length}`}
          </span>
          <span aria-hidden="true" className={mutedText}>·</span>
          <span data-testid="quick-check-score" className={mutedText}>
            {isAr
              ? `الإجابات الصحيحة: ${sessionStats.correct}/${sessionStats.answered}`
              : `Score: ${sessionStats.correct}/${sessionStats.answered}`}
            {sessionStats.answered > 0 ? ` (${sessionStats.accuracy}%)` : ''}
          </span>
          {persistedRecord.correctIds.length > 0 && (
            <>
              <span aria-hidden="true" className={mutedText}>·</span>
              <span className={mutedText}>
                {isAr
                  ? `إتقان محفوظ: ${persistedRecord.correctIds.length}`
                  : `Saved Mastery: ${persistedRecord.correctIds.length}`}
              </span>
            </>
          )}
        </div>

        {/* Question Number Navigation Buttons */}
        <div
          role="navigation"
          aria-label={isAr ? 'التنقل بين الأسئلة' : 'Question navigation'}
          className="flex flex-wrap items-center gap-1.5"
        >
          {deck.map((q, idx) => {
            const picked = selectedByQuestion[q.id];
            const isAnswered = picked !== undefined;
            const isRight = isAnswered && picked === q.correctIndex;
            const isCurrent = idx === safeIndex;

            let stepClass = isLight
              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-400'
              : 'bg-[#12173b] text-slate-300 border-[#242e69] hover:border-slate-400';

            if (isCurrent) {
              stepClass = isLight
                ? 'bg-slate-900 text-white border-slate-900 font-bold'
                : 'bg-amber-500 text-slate-950 border-amber-400 font-bold';
            } else if (isAnswered && isRight) {
              stepClass = isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 font-semibold';
            } else if (isAnswered && !isRight) {
              stepClass = isLight
                ? 'bg-rose-50 text-rose-800 border-rose-400 font-semibold'
                : 'bg-rose-950/60 text-rose-300 border-rose-500/50 font-semibold';
            }

            return (
              <button
                key={q.id}
                type="button"
                data-testid={`quick-check-step-${idx}`}
                onClick={() => setCurrentIndex(idx)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={
                  isAr
                    ? `السؤال ${idx + 1}${isAnswered ? (isRight ? ' - صحيح' : ' - غير صحيح') : ''}`
                    : `Question ${idx + 1}${isAnswered ? (isRight ? ' - correct' : ' - incorrect') : ''}`
                }
                className={`min-w-8 h-8 px-2 rounded-lg border text-xs font-mono tabular-nums transition-colors cursor-pointer ${stepClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Question Prompt & Source Attribution */}
      <div className="pt-6 space-y-5">
        <div className="space-y-2">
          <div className={`flex flex-wrap items-center gap-2 text-xs ${mutedText}`}>
            <span>
              {isAr ? currentQuestion.chapterTitleAr : currentQuestion.chapterTitleEn}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isAr
                ? `صفحة ${currentQuestion.sourcePageNumber}: ${currentQuestion.pageTitleAr}`
                : `Page ${currentQuestion.sourcePageNumber}: ${currentQuestion.pageTitleEn}`}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isAr ? currentQuestion.conceptTagAr : currentQuestion.conceptTagEn}
            </span>
          </div>

          <h4
            data-testid="quick-check-question-text"
            className="text-base sm:text-lg font-semibold leading-relaxed"
          >
            {isAr ? currentQuestion.questionAr : currentQuestion.questionEn}
          </h4>
        </div>

        {/* 4. Answer Options (Immediate Evaluation on Click) */}
        <div
          role="radiogroup"
          aria-label={isAr ? currentQuestion.questionAr : currentQuestion.questionEn}
          className="grid grid-cols-1 gap-2.5"
        >
          {optionsList.map((optionText, oIdx) => {
            const label = optionLabels[oIdx] || String.fromCharCode(65 + oIdx);
            const isSelected = selectedOption === oIdx;
            const isRightOption = oIdx === currentQuestion.correctIndex;

            let optionStyle = isLight
              ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 hover:border-slate-400 text-slate-900'
              : 'bg-[#101536] hover:bg-[#161d4a] border-[#232d69] hover:border-amber-400/70 text-slate-100';

            let keyBadgeStyle = isLight
              ? 'bg-white border-slate-300 text-slate-700'
              : 'bg-[#0a0d24] border-[#2a3578] text-amber-300';

            if (hasAnsweredCurrent) {
              if (isRightOption) {
                optionStyle = isLight
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium'
                  : 'bg-emerald-950/55 border-emerald-400 text-emerald-100 font-medium';
                keyBadgeStyle = isLight
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-emerald-500 border-emerald-400 text-slate-950';
              } else if (isSelected) {
                optionStyle = isLight
                  ? 'bg-rose-50 border-rose-500 text-rose-950 font-medium'
                  : 'bg-rose-950/55 border-rose-400 text-rose-100 font-medium';
                keyBadgeStyle = isLight
                  ? 'bg-rose-600 border-rose-600 text-white'
                  : 'bg-rose-500 border-rose-400 text-white';
              } else {
                optionStyle = isLight
                  ? 'bg-slate-50/50 border-slate-200 text-slate-500'
                  : 'bg-[#0c1029] border-[#19204a] text-slate-400';
              }
            }

            return (
              <button
                key={`${currentQuestion.id}-opt-${oIdx}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`quick-check-option-${oIdx}`}
                disabled={hasAnsweredCurrent}
                onClick={() => handleChooseOption(oIdx)}
                className={`w-full text-start px-4 py-3.5 rounded-xl border text-sm leading-relaxed transition-colors flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${optionStyle} ${
                  hasAnsweredCurrent ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs font-bold shrink-0 ${keyBadgeStyle}`}
                  >
                    {label}
                  </span>
                  <span>{optionText}</span>
                </span>

                {hasAnsweredCurrent && isRightOption && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {isAr ? 'الإجابة الصحيحة' : 'Correct'}
                    </span>
                  </span>
                )}

                {hasAnsweredCurrent && isSelected && !isRightOption && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 shrink-0">
                    <XCircle className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {isAr ? 'اختيارك' : 'Your Choice'}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 5. Immediate Feedback & Technical Explanation Panel */}
        {hasAnsweredCurrent && (
          <div
            role="status"
            aria-live="polite"
            data-testid="quick-check-explanation"
            className={`rounded-xl border p-4 sm:p-5 space-y-3 ${
              isCurrentCorrect
                ? isLight
                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-slate-100'
                : isLight
                  ? 'bg-rose-50/70 border-rose-300 text-slate-900'
                  : 'bg-rose-950/30 border-rose-500/40 text-slate-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isCurrentCorrect ? (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <p
                  data-testid="quick-check-verdict"
                  className={`text-sm font-bold ${
                    isCurrentCorrect
                      ? isLight
                        ? 'text-emerald-900'
                        : 'text-emerald-300'
                      : isLight
                        ? 'text-rose-900'
                        : 'text-rose-300'
                  }`}
                >
                  {isCurrentCorrect
                    ? isAr
                      ? 'إجابة صحيحة — مطابقة للمرجع الهندسي'
                      : 'Correct — Verified against loaded textbook content'
                    : isAr
                      ? 'إجابة غير صحيحة — راجع التفسير الهندسي أدناه'
                      : 'Incorrect — Review the textbook explanation below'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onJumpToPage && (
                  <button
                    type="button"
                    data-testid="quick-check-jump-page"
                    onClick={() => onJumpToPage(currentQuestion.sourcePageNumber)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${secondaryBtn}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {isAr
                        ? `مراجعة صفحة ${currentQuestion.sourcePageNumber}`
                        : `Review Page ${currentQuestion.sourcePageNumber}`}
                    </span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}

                {!isCurrentCorrect && (
                  <button
                    type="button"
                    data-testid="quick-check-retry-question"
                    onClick={handleRetryCurrentQuestion}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${secondaryBtn}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
                  </button>
                )}
              </div>
            </div>

            {!isCurrentCorrect && (
              <p className={`text-xs font-medium ${mutedText}`}>
                {isAr ? 'الإجابة الصحيحة المعتمدة: ' : 'Correct answer: '}
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                  {optionsList[currentQuestion.correctIndex]}
                </strong>
              </p>
            )}

            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                {isAr ? 'التفسير الهندسي والمرجعي:' : 'Engineering Explanation:'}
              </p>
              <p className="text-sm leading-relaxed">
                {isAr ? currentQuestion.explanationAr : currentQuestion.explanationEn}
              </p>
            </div>

            {currentQuestion.formulaLatex && (
              <div
                dir="ltr"
                className={`rounded-lg border px-3 py-2 text-xs font-mono ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-[#080b1f] border-[#212b63] text-amber-200'
                }`}
              >
                {currentQuestion.formulaLatex}
              </div>
            )}
          </div>
        )}

        {/* 6. Completion Summary Banner when full deck is answered */}
        {sessionStats.allAnswered && (
          <div
            data-testid="quick-check-summary"
            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-[#101538] border-[#2a367c] text-slate-100'
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-sm font-bold">
                {isAr
                  ? `اكتمل اختبار المعرفة السريع — النتيجة: ${sessionStats.correct} من ${sessionStats.total} (${sessionStats.accuracy}%)`
                  : `Quick Knowledge Check Complete — Score: ${sessionStats.correct} of ${sessionStats.total} (${sessionStats.accuracy}%)`}
              </p>
              <p className={`text-xs ${mutedText}`}>
                {sessionStats.accuracy >= 80
                  ? isAr
                    ? 'مستوى ممتاز في استيعاب المبادئ الفيزيائية والمعايير الهندسية للكتاب المحمّل.'
                    : 'Strong command of the physical principles and code criteria in the loaded textbook.'
                  : isAr
                    ? 'راجع التفسيرات الهندسية والصفحات المرجعية للأسئلة غير الصحيحة ثم أعد المحاولة.'
                    : 'Review the explanations and cited pages for missed items, then retry to solidify mastery.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {sessionStats.correct < sessionStats.total && (
                <button
                  type="button"
                  data-testid="quick-check-retry-missed"
                  onClick={handleRetryMissedOnly}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${primaryBtn}`}
                >
                  {isAr ? 'إعادة الأسئلة الخاطئة' : 'Retry Missed Questions'}
                </button>
              )}
              <button
                type="button"
                data-testid="quick-check-reset-all"
                onClick={handleResetQuiz}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${secondaryBtn}`}
              >
                {isAr ? 'إعادة الاختبار بالكامل' : 'Reset Quiz'}
              </button>
            </div>
          </div>
        )}

        {/* 7. Bottom Question Controls (Previous / Reset / Next) */}
        <div className={`pt-4 border-t ${subtleDivider} flex flex-wrap items-center justify-between gap-3`}>
          <button
            type="button"
            data-testid="quick-check-prev"
            disabled={safeIndex === 0}
            onClick={() => setCurrentIndex(idx => Math.max(0, idx - 1))}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              safeIndex === 0
                ? 'opacity-40 cursor-not-allowed ' + secondaryBtn
                : 'cursor-pointer ' + secondaryBtn
            }`}
          >
            {isAr ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{isAr ? 'السؤال السابق' : 'Previous'}</span>
          </button>

          <div className="flex items-center gap-2">
            {sessionStats.answered > 0 && (
              <button
                type="button"
                data-testid="quick-check-reset"
                onClick={handleResetQuiz}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${secondaryBtn}`}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}

            <button
              type="button"
              data-testid="quick-check-next"
              disabled={safeIndex >= deck.length - 1}
              onClick={() => setCurrentIndex(idx => Math.min(deck.length - 1, idx + 1))}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                safeIndex >= deck.length - 1
                  ? 'opacity-40 cursor-not-allowed ' + secondaryBtn
                  : 'cursor-pointer ' + primaryBtn
              }`}
            >
              <span>{isAr ? 'السؤال التالي' : 'Next Question'}</span>
              {isAr ? (
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
