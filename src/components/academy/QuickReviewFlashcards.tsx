import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  Trophy, 
  Award, 
  Flame, 
  ArrowRight, 
  BookMarked,
  BrainCircuit,
  Filter
} from 'lucide-react';
import { Language } from '../../types';
import { CURRICULUM_FLASHCARDS, Flashcard } from '../../data/curriculumFlashcards';

interface QuickReviewFlashcardsProps {
  language: Language;
  initialDisciplineId?: string;
  initialModuleId?: string;
  onLaunchQuiz?: (disciplineId: string, levelId?: 'academic' | 'level1' | 'level2' | 'level3', moduleId?: string) => void;
  onNavigateToCurriculum?: (disciplineId: string) => void;
}

type CardConfidence = 'unrated' | 'hard' | 'medium' | 'mastered';

const STORAGE_KEY = 'insco_flashcards_confidence_v1';

export const QuickReviewFlashcards: React.FC<QuickReviewFlashcardsProps> = ({
  language,
  initialDisciplineId,
  initialModuleId,
  onLaunchQuiz,
  onNavigateToCurriculum,
}) => {
  const isAr = language === 'ar';

  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [confidenceMap, setConfidenceMap] = useState<Record<string, CardConfidence>>({});

  // Load confidence map
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setConfidenceMap(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const saveConfidence = (cardId: string, rating: CardConfidence) => {
    setConfidenceMap(prev => {
      const updated = { ...prev, [cardId]: rating };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Filter cards
  const filteredCards = useMemo(() => {
    let list = CURRICULUM_FLASHCARDS;
    if (initialDisciplineId && initialDisciplineId !== 'ALL') {
      list = list.filter(c => c.disciplineId === initialDisciplineId);
    }
    if (selectedMethod !== 'ALL') {
      list = list.filter(c => c.method === selectedMethod);
    }
    return list;
  }, [initialDisciplineId, selectedMethod]);

  const currentCard: Flashcard | undefined = filteredCards[currentIndex] || filteredCards[0];

  // Stats
  const stats = useMemo(() => {
    const total = filteredCards.length;
    let mastered = 0;
    let medium = 0;
    let hard = 0;
    filteredCards.forEach(c => {
      const r = confidenceMap[c.id];
      if (r === 'mastered') mastered++;
      else if (r === 'medium') medium++;
      else if (r === 'hard') hard++;
    });
    return { total, mastered, medium, hard };
  }, [filteredCards, confidenceMap]);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setCurrentIndex(Math.floor(Math.random() * filteredCards.length));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowRight') {
        isAr ? handlePrev() : handleNext();
      } else if (e.key === 'ArrowLeft') {
        isAr ? handleNext() : handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAr, filteredCards.length]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d122f] via-[#151c48] to-[#0d122f] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>{isAr ? 'نظام المراجعة السريعة والبطاقات الذكية' : 'NDT Quick Review Flashcards'}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide">
              {isAr ? 'بطاقات الاستذكار السريع لاجتياز الاختبارات' : 'Smart Flashcard Exam Preparation'}
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              {isAr
                ? 'استعرض القوانين الفيزيائية، بنود الأكواد الدولية، ومعايير القبول والرفض قبل بدء الاختبار التأهيلي للمنهج.'
                : 'Review critical formulas, ASME/API code clauses, and defect acceptance criteria before launching module quizzes.'}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-[#0a0d24]/80 p-3 rounded-xl border border-slate-700/50">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400">{isAr ? 'الإجمالي' : 'Total'}</div>
              <div className="text-base font-bold text-white font-mono">{stats.total}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-emerald-400">{isAr ? 'أتقنتها' : 'Mastered'}</div>
              <div className="text-base font-bold text-emerald-400 font-mono">{stats.mastered}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-rose-400">{isAr ? 'مراجعة' : 'Review'}</div>
              <div className="text-base font-bold text-rose-400 font-mono">{stats.hard}</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            {isAr ? 'تصفية بالطريقة:' : 'Method:'}
          </span>
          {['ALL', 'VT', 'PT', 'MT', 'UT', 'RT', 'PWHT', 'API', 'WELD'].map(m => (
            <button
              key={m}
              onClick={() => { setSelectedMethod(m); setCurrentIndex(0); setIsFlipped(false); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedMethod === m
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {m === 'ALL' ? (isAr ? 'الكل' : 'All Methods') : m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Flashcard Card Container */}
      {currentCard ? (
        <div className="space-y-4">
          {/* Card Meta Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentCard.method}
              </span>
              {currentCard.codeReference && (
                <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
                  {currentCard.codeReference}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span>{currentIndex + 1} / {filteredCards.length}</span>
              <button 
                onClick={handleShuffle}
                title={isAr ? 'ترتيب عشوائي' : 'Shuffle cards'}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Flip Card */}
          <div 
            onClick={() => setIsFlipped(prev => !prev)}
            className="cursor-pointer select-none perspective-1000 min-h-[320px] md:min-h-[350px] relative rounded-2xl bg-gradient-to-b from-[#131938] to-[#0c1026] border-2 border-[#2b3566] hover:border-amber-400/60 p-6 md:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:shadow-amber-500/10 group"
          >
            {/* Top Prompt */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                {isFlipped 
                  ? (isAr ? 'الإجابة والتفسير الهندسي (انقر للوجه)' : 'Answer & Code Explanation (Click to flip)')
                  : (isAr ? 'سؤال ومفهوم المراجعة (انقر للحل)' : 'Question / Concept (Click to flip)')}
              </span>
              <span className="text-xs text-amber-400/80 font-mono">
                {isAr ? 'مسافة أو انقر للقلب' : 'Space or click to flip'}
              </span>
            </div>

            {/* Card Content */}
            <div className="py-6 my-auto">
              {!isFlipped ? (
                // FRONT
                <div className="space-y-4">
                  <div className="text-lg md:text-xl font-bold text-white leading-relaxed">
                    {isAr ? currentCard.frontAr : currentCard.frontEn}
                  </div>
                  {currentCard.keyFormula && (
                    <div className="inline-block bg-[#090d20] border border-cyan-500/40 text-cyan-300 font-mono px-4 py-2 rounded-xl text-sm mt-3 shadow-inner">
                      {currentCard.keyFormula}
                    </div>
                  )}
                </div>
              ) : (
                // BACK
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-base md:text-lg text-amber-200 whitespace-pre-line leading-relaxed font-medium">
                    {isAr ? currentCard.backAr : currentCard.backEn}
                  </div>

                  {currentCard.keyFormula && (
                    <div className="bg-[#090d20] border border-cyan-500/40 text-cyan-300 font-mono px-4 py-2 rounded-xl text-sm shadow-inner inline-block">
                      {currentCard.keyFormula}
                    </div>
                  )}

                  {currentCard.examTipAr && (
                    <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block mb-0.5 text-amber-200">{isAr ? 'نصيحة الامتحان:' : 'Exam Tip:'}</strong>
                        {isAr ? currentCard.examTipAr : currentCard.examTipEn}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom State Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
              <span className="font-mono">
                {currentCard.disciplineId}
              </span>
              <span className="text-slate-500">
                {isAr ? 'بطاقة مراجعة معتمدة' : 'Verified Study Card'}
              </span>
            </div>
          </div>

          {/* Confidence Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d122c] border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{isAr ? 'تقييم الحفظ:' : 'Rate confidence:'}</span>
              <button
                onClick={() => saveConfidence(currentCard.id, 'hard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  confidenceMap[currentCard.id] === 'hard'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 border border-rose-800/40'
                }`}
              >
                <span>{isAr ? 'أحتاج تدريباً' : 'Need Review'}</span>
              </button>
              <button
                onClick={() => saveConfidence(currentCard.id, 'medium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  confidenceMap[currentCard.id] === 'medium'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 border border-amber-800/40'
                }`}
              >
                <span>{isAr ? 'متوسط' : 'Getting There'}</span>
              </button>
              <button
                onClick={() => saveConfidence(currentCard.id, 'mastered')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  confidenceMap[currentCard.id] === 'mastered'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'أتقنتها' : 'Mastered'}</span>
              </button>
            </div>

            {/* Launch Quiz Button */}
            {onLaunchQuiz && (
              <button
                onClick={() => onLaunchQuiz(currentCard.disciplineId, 'academic', currentCard.moduleId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Trophy className="w-4 h-4" />
                <span>{isAr ? 'بدء اختبار هذا المنهج' : 'Take Module Quiz Now'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handlePrev}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              <span>{isAr ? 'البطاقة السابقة' : 'Previous Card'}</span>
            </button>

            <button
              onClick={() => setIsFlipped(prev => !prev)}
              className="py-3 px-6 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span>{isAr ? 'اقلب البطاقة' : 'Flip Card'}</span>
            </button>

            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <span>{isAr ? 'البطاقة التالية' : 'Next Card'}</span>
              <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            {isAr ? 'لا توجد بطاقات تطابق التصفية الحالية' : 'No flashcards match the current filter'}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {isAr ? 'اختر طريقة فحص أخرى أو أعد ضبط التصفية.' : 'Select another method or reset filter.'}
          </p>
          <button
            onClick={() => setSelectedMethod('ALL')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            {isAr ? 'عرض كل البطاقات' : 'Show All Cards'}
          </button>
        </div>
      )}
    </div>
  );
};
