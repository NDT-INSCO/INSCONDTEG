import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  RotateCcw,
  Trophy,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { Language } from '../../types';
import { LessonQuizPack } from '../../data/curriculumLessonQuizzes';
import {
  getLessonQuizRecord,
  QuizAttemptOutcome,
  submitLessonQuizAttempt,
} from '../../utils/lessonQuizStore';

export interface PostLessonQuizPanelProps {
  pack: LessonQuizPack;
  language: Language;
  defaultCollapsed?: boolean;
  onOpenLeaderboard?: () => void;
  onQuizCompleted?: (outcome: QuizAttemptOutcome) => void;
}

export const PostLessonQuizPanel: React.FC<PostLessonQuizPanelProps> = ({
  pack,
  language,
  defaultCollapsed = false,
  onOpenLeaderboard,
  onQuizCompleted,
}) => {
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState<boolean>(!defaultCollapsed);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [outcome, setOutcome] = useState<QuizAttemptOutcome | null>(null);
  const [savedRecord, setSavedRecord] = useState(() => getLessonQuizRecord(pack.packId));

  useEffect(() => {
    setIsExpanded(!defaultCollapsed);
    setActiveIndex(0);
    setSelectedAnswers({});
    setRevealedQuestions({});
    setOutcome(null);
    setSavedRecord(getLessonQuizRecord(pack.packId));
  }, [pack.packId, defaultCollapsed]);

  const totalQuestions = pack.questions.length;
  const currentQuestion = pack.questions[activeIndex] || pack.questions[0];
  const answeredCount = pack.questions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const currentSelected = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isCurrentRevealed = currentQuestion ? Boolean(revealedQuestions[currentQuestion.id]) : false;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (outcome || revealedQuestions[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckCurrentAnswer = () => {
    if (!currentQuestion || currentSelected === undefined) return;
    setRevealedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleFinishQuiz = () => {
    if (answeredCount < totalQuestions) return;
    const allRevealed: Record<string, boolean> = {};
    pack.questions.forEach((q) => {
      allRevealed[q.id] = true;
    });
    setRevealedQuestions(allRevealed);
    const result = submitLessonQuizAttempt(pack, selectedAnswers);
    setOutcome(result);
    setSavedRecord(getLessonQuizRecord(pack.packId));
    onQuizCompleted?.(result);
  };

  const handleRetake = () => {
    setActiveIndex(0);
    setSelectedAnswers({});
    setRevealedQuestions({});
    setOutcome(null);
    setSavedRecord(getLessonQuizRecord(pack.packId));
  };

  if (!isExpanded) {
    return (
      <section
        dir={isAr ? 'rtl' : 'ltr'}
        data-testid={`post-lesson-quiz-collapsed-${pack.packId}`}
        className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
            <span className="font-semibold text-amber-300">
              {isAr ? 'اختبار نهاية الدرس التفاعلي' : 'Interactive Post-Lesson Quiz'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {totalQuestions} {isAr ? 'أسئلة' : 'Questions'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isAr ? `الاجتياز ${pack.passThresholdPct}%` : `Pass ${pack.passThresholdPct}%`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-300">
              {isAr ? `حتى +${pack.maxXpReward} XP` : `Up to +${pack.maxXpReward} XP`}
            </span>
            {savedRecord && (
              <>
                <span aria-hidden="true">·</span>
                <span className={savedRecord.passed ? 'text-emerald-300' : 'text-amber-300'}>
                  {isAr
                    ? `أفضل نتيجة: ${savedRecord.bestScorePct}% (+${savedRecord.bestXpAwarded} XP)`
                    : `Best: ${savedRecord.bestScorePct}% (+${savedRecord.bestXpAwarded} XP)`}
                </span>
              </>
            )}
          </div>
          <h4 className="text-base font-bold text-white">
            {isAr ? pack.title.ar : pack.title.en}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedRecord && onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="px-3.5 py-2 rounded-lg border border-[#343d65] text-xs font-semibold text-amber-300 hover:border-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isAr ? 'لوحة المتصدرين (XP)' : 'XP Leaderboard'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
            <span>
              {savedRecord
                ? isAr
                  ? 'إعادة فتح اختبار الدرس (+XP)'
                  : 'Open Lesson Quiz (+XP)'
                : isAr
                  ? 'ابدأ اختبار الدرس التفاعلي (+XP)'
                  : 'Start Interactive Lesson Quiz (+XP)'}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid={`post-lesson-quiz-${pack.packId}`}
      className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-6 space-y-5"
    >
      {/* Header & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#212850]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
            <span className="font-semibold text-amber-300">
              {isAr ? pack.subtitle.ar : pack.subtitle.en}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {totalQuestions} {isAr ? 'أسئلة كودية' : 'Code Questions'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isAr ? `النجاح ${pack.passThresholdPct}%` : `Pass ${pack.passThresholdPct}%`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-300">
              {isAr ? `مكافأة حتى +${pack.maxXpReward} XP` : `Reward up to +${pack.maxXpReward} XP`}
            </span>
            {savedRecord && (
              <>
                <span aria-hidden="true">·</span>
                <span className={savedRecord.passed ? 'text-emerald-300' : 'text-amber-300'}>
                  {isAr
                    ? `أفضل درجة: ${savedRecord.bestScorePct}%`
                    : `Best Score: ${savedRecord.bestScorePct}%`}
                </span>
              </>
            )}
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-white">
            {isAr ? `اختبار الدرس: ${pack.title.ar}` : `Lesson Quiz: ${pack.title.en}`}
          </h4>
        </div>

        {defaultCollapsed && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="px-3 py-1.5 rounded-lg border border-[#303961] text-xs font-medium text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 self-start"
          >
            <span>{isAr ? 'طي الاختبار' : 'Collapse'}</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Final Results & XP Leaderboard Impact View */}
      {outcome ? (
        <div role="status" className="space-y-5">
          <div
            className={`rounded-xl border p-5 space-y-4 ${
              outcome.passed
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-amber-500/40 bg-amber-500/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {outcome.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <span
                    className={`text-sm font-bold ${
                      outcome.passed ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {outcome.passed
                      ? isAr
                        ? 'اجتزت اختبار الدرس بنجاح'
                        : 'Lesson Quiz Passed'
                      : isAr
                        ? 'لم تصل لحد الاجتياز (75%) — راجع التفسير وأعد المحاولة'
                        : 'Below 75% Pass Mark — Review Explanations & Retry'}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {outcome.scorePct}%{' '}
                  <span className="text-sm font-medium text-slate-300">
                    ({outcome.correctCount}/{outcome.totalQuestions}{' '}
                    {isAr ? 'إجابات صحيحة' : 'correct'})
                  </span>
                </p>
              </div>

              {/* XP & Leaderboard Live Telemetry */}
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#29315b] bg-[#0b0d1e] p-3.5 tabular-nums">
                <div>
                  <div className="text-[11px] text-slate-400">
                    {isAr ? 'نقاط المحاولة' : 'Earned XP'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-400">
                    +{outcome.xpEarnedNow} XP
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">
                    {isAr ? 'إجمالي رصيدك' : 'Total XP'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-cyan-300">
                    {outcome.newTotalXp} XP
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">
                    {isAr ? 'ترتيب المتصدرين' : 'Leaderboard'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-300 flex items-center gap-1">
                    <span>#{outcome.newRank}</span>
                    {outcome.newRank < outcome.previousRank && (
                      <span className="text-xs text-emerald-400 inline-flex items-center">
                        <TrendingUp className="w-3.5 h-3.5" />+
                        {outcome.previousRank - outcome.newRank}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {outcome.xpEarnedNow === 0 && (
              <p className="text-xs text-slate-300">
                {isAr
                  ? `تم احتساب أعلى مكافأة سابقة لهذا الدرس (+${outcome.bestXpForPack} XP) في لوحة المتصدرين؛ إعادة المحاولة متاحة للتدريب أو رفع الدرجة.`
                  : `Your previous best XP reward (+${outcome.bestXpForPack} XP) for this lesson is already credited on the leaderboard; improve your score to earn remaining XP.`}
              </p>
            )}

            {outcome.unlockedBadgeTitle && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-400/35 bg-[#0b0d1e] px-3.5 py-2.5 text-xs text-amber-200">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isAr
                    ? `وسام جديد مُنح في ملفك: ${outcome.unlockedBadgeTitle.ar}`
                    : `New Badge Unlocked: ${outcome.unlockedBadgeTitle.en}`}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-lg border border-[#343d65] bg-[#0b0d1e] hover:border-slate-400 text-xs font-semibold text-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة الاختبار' : 'Retake Quiz'}</span>
              </button>

              {onOpenLeaderboard && (
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    {isAr ? 'عرض لوحة المتصدرين (XP)' : 'View XP Leaderboard'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Full Answer & Code Reference Review */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-slate-200">
              {isAr
                ? 'مراجعة الإجابات والتفسير الكودي التفصيلي'
                : 'Detailed Answer Review & Code Explanations'}
            </h5>
            {pack.questions.map((q, idx) => {
              const userChoice = selectedAnswers[q.id];
              const isRight = userChoice === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-[#242c54] bg-[#0b0d1e] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                    <span className="text-slate-400">
                      {isAr ? `السؤال ${idx + 1}` : `Question ${idx + 1}`} ·{' '}
                      <span dir="ltr" className="font-mono text-amber-300">
                        {q.codeReference}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        isRight ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isRight ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'صحيحة' : 'Correct'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'غير صحيحة' : 'Incorrect'}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {isAr ? q.question.ar : q.question.en}
                  </p>
                  {!isRight && userChoice !== undefined && (
                    <p className="text-xs text-rose-300">
                      {isAr ? 'إجابتك: ' : 'Your answer: '}
                      {isAr ? q.options[userChoice]?.ar : q.options[userChoice]?.en}
                    </p>
                  )}
                  <p className="text-xs text-emerald-300 font-medium">
                    {isAr ? 'الإجابة الصحيحة: ' : 'Correct answer: '}
                    {isAr ? q.options[q.correctIndex]?.ar : q.options[q.correctIndex]?.en}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-[#1d2447]">
                    {isAr ? q.explanation.ar : q.explanation.en}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Interactive Question Stage */
        <div className="space-y-4">
          {/* Question Stepper Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {pack.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isRevealed = Boolean(revealedQuestions[q.id]);
                const isCorrect = isRevealed && selectedAnswers[q.id] === q.correctIndex;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer tabular-nums ${
                      isActive
                        ? 'bg-amber-500 text-slate-950'
                        : isRevealed
                          ? isCorrect
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isAnswered
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                            : 'bg-[#0b0d1e] text-slate-400 border border-[#29315b] hover:text-white'
                    }`}
                    aria-label={`${isAr ? 'سؤال' : 'Question'} ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {isAr
                ? `تمت الإجابة على ${answeredCount} من ${totalQuestions}`
                : `${answeredCount} / ${totalQuestions} answered`}
            </span>
          </div>

          {/* Visual Completion Bar (intentionally no role="progressbar" to avoid colliding with page reading bars) */}
          <div className="h-1.5 rounded-full bg-[#0b0d1e] overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-transform duration-150 origin-left"
              style={{
                transform: `scaleX(${totalQuestions > 0 ? answeredCount / totalQuestions : 0})`,
              }}
            />
          </div>

          {currentQuestion && (
            <div className="rounded-xl border border-[#242c54] bg-[#0b0d1e] p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 tabular-nums">
                <span>
                  {isAr
                    ? `السؤال ${activeIndex + 1} من ${totalQuestions}`
                    : `Question ${activeIndex + 1} of ${totalQuestions}`}
                </span>
                <span dir="ltr" className="font-mono text-amber-300">
                  {currentQuestion.codeReference}
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {isAr ? currentQuestion.question.ar : currentQuestion.question.en}
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isPicked = currentSelected === optIdx;
                  const showRight = isCurrentRevealed && optIdx === currentQuestion.correctIndex;
                  const showWrong =
                    isCurrentRevealed && isPicked && optIdx !== currentQuestion.correctIndex;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      data-testid={`quiz-option-${optIdx}`}
                      disabled={isCurrentRevealed}
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      aria-pressed={isPicked}
                      className={`w-full rounded-xl border px-4 py-3 text-start text-xs sm:text-sm transition-colors flex items-start justify-between gap-3 cursor-pointer disabled:cursor-default ${
                        showRight
                          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                          : showWrong
                            ? 'border-rose-400 bg-rose-500/15 text-rose-100'
                            : isPicked
                              ? 'border-amber-400 bg-amber-500/15 text-white'
                              : 'border-[#29315b] bg-[#10132b] text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      <span className="leading-relaxed">
                        <span className="font-mono font-bold text-amber-300 me-2">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {isAr ? opt.ar : opt.en}
                      </span>
                      {showRight && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {showWrong && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Per-Question Explanation Feedback */}
              {isCurrentRevealed && (
                <div
                  role="status"
                  className={`rounded-lg border p-3.5 space-y-1.5 text-xs ${
                    currentSelected === currentQuestion.correctIndex
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100'
                      : 'border-rose-500/35 bg-rose-500/10 text-rose-100'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {currentSelected === currentQuestion.correctIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          {isAr ? 'إجابة صحيحة (+25 XP)' : 'Correct Answer (+25 XP)'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          {isAr
                            ? 'إجابة غير صحيحة — راجع التفسير الكودي أدناه'
                            : 'Incorrect — Review the code explanation below'}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {isAr ? currentQuestion.explanation.ar : currentQuestion.explanation.en}
                  </p>
                </div>
              )}

              {/* Controls Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                <div className="flex items-center gap-2">
                  {activeIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                      className="px-3.5 py-2 rounded-lg border border-[#303961] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isAr ? 'السؤال السابق' : 'Previous'}
                    </button>
                  )}

                  {!isCurrentRevealed && (
                    <button
                      type="button"
                      disabled={currentSelected === undefined}
                      onClick={handleCheckCurrentAnswer}
                      className="px-4 py-2 rounded-lg border border-amber-400/50 bg-[#171d42] text-amber-300 hover:bg-[#1e2654] disabled:opacity-40 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isAr ? 'تحقق من الإجابة الفورية' : 'Check Instant Answer'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeIndex < totalQuestions - 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                      }
                      className="px-4 py-2 rounded-lg bg-[#1d2552] hover:bg-[#253069] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isAr ? 'السؤال التالي' : 'Next Question'}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={answeredCount < totalQuestions}
                    onClick={handleFinishQuiz}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? `إنهاء الاختبار واحتساب XP (${answeredCount}/${totalQuestions})`
                        : `Submit Quiz & Claim XP (${answeredCount}/${totalQuestions})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
