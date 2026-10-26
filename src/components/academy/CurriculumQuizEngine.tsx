import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  Search,
  Trophy,
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { NDE_ED_COURSES } from '../../data/ndeEd';
import {
  getAllCurriculumQuizPacks,
  getNdeEdLessonQuizPack,
  LessonQuizPack,
} from '../../data/curriculumLessonQuizzes';
import { useLessonQuizStore } from '../../utils/lessonQuizStore';
import { PostLessonQuizPanel } from './PostLessonQuizPanel';

interface CurriculumQuizEngineProps {
  language: Language;
  quizTarget?: {
    disciplineId?: string;
    levelId?: string;
    moduleId?: string;
    moduleTitle?: { ar: string; en: string };
  } | null;
  /** Deep-link target fields used by the academy container. */
  initialDisciplineId?: string;
  initialLevelId?: string;
  initialModuleId?: string;
  initialModuleTitle?: { ar: string; en: string };
  onCloseTargetedQuiz?: () => void;
  onNavigateToDiscipline?: () => void;
  onOpenLeaderboard?: () => void;
}

export const CurriculumQuizEngine: React.FC<CurriculumQuizEngineProps> = ({
  language,
  quizTarget,
  initialDisciplineId,
  initialModuleId,
  onCloseTargetedQuiz,
  onNavigateToDiscipline,
  onOpenLeaderboard,
}) => {
  const isAr = language === 'ar';
  const quizStore = useLessonQuizStore();

  const allAccreditedPacks = useMemo(() => getAllCurriculumQuizPacks(), []);
  const allNdeCoursePacks = useMemo(() => {
    const list: LessonQuizPack[] = [];
    for (const course of NDE_ED_COURSES) {
      for (const lesson of course.lessons) {
        list.push(getNdeEdLessonQuizPack(course, lesson));
      }
    }
    return list;
  }, []);

  const targetDiscipline = quizTarget?.disciplineId || initialDisciplineId;
  const targetModule = quizTarget?.moduleId || initialModuleId;

  const [catalogSource, setCatalogSource] = useState<'curriculum' | 'nde_ed'>('curriculum');
  const [disciplineFilter, setDisciplineFilter] = useState<string>(targetDiscipline || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPackId, setSelectedPackId] = useState<string>(() => {
    if (targetModule) {
      return `curriculum:${targetModule}`;
    }
    if (targetDiscipline) {
      const firstMatch = allAccreditedPacks.find((p) => p.disciplineId === targetDiscipline);
      if (firstMatch) return firstMatch.packId;
    }
    return allAccreditedPacks[0]?.packId || '';
  });

  useEffect(() => {
    const modId = quizTarget?.moduleId || initialModuleId;
    const discId = quizTarget?.disciplineId || initialDisciplineId;
    if (modId) {
      setCatalogSource('curriculum');
      setDisciplineFilter(discId || 'ALL');
      setSelectedPackId(`curriculum:${modId}`);
      return;
    }
    if (discId) {
      setCatalogSource('curriculum');
      setDisciplineFilter(discId);
      const firstMatch = allAccreditedPacks.find((p) => p.disciplineId === discId);
      if (firstMatch) {
        setSelectedPackId(firstMatch.packId);
      }
    }
  }, [
    allAccreditedPacks,
    initialDisciplineId,
    initialModuleId,
    quizTarget?.disciplineId,
    quizTarget?.moduleId,
  ]);

  const activePool = catalogSource === 'curriculum' ? allAccreditedPacks : allNdeCoursePacks;

  const filteredPacks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activePool.filter((pack) => {
      if (disciplineFilter !== 'ALL' && pack.disciplineId !== disciplineFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = `${pack.title.ar} ${pack.title.en} ${pack.subtitle.ar} ${pack.subtitle.en}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activePool, disciplineFilter, searchQuery]);

  const activePack = useMemo(() => {
    return (
      filteredPacks.find((p) => p.packId === selectedPackId) ||
      activePool.find((p) => p.packId === selectedPackId) ||
      filteredPacks[0] ||
      allAccreditedPacks[0]
    );
  }, [activePool, allAccreditedPacks, filteredPacks, selectedPackId]);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Quiz System Header & Live XP / Rank HUD */}
      <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-7 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
              <span className="font-semibold text-amber-300">
                {isAr ? 'نظام الاختبارات التفاعلي المعتمد' : 'Accredited Interactive Quiz System'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {allAccreditedPacks.length + allNdeCoursePacks.length}{' '}
                {isAr ? 'اختبار درس متاح' : 'Lesson Quizzes'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? 'نتائج فورية وتفسير كودي' : 'Instant Grading & Code Explanations'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {isAr
                ? 'محرك اختبارات الدروس وتأهيل نقاط المتصدرين (XP)'
                : 'Curriculum Lesson Quiz Engine & Live XP Qualification'}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'اختر أي درس من المناهج الهندسية الثمانية أو مقررات NDE-Ed التفاعلية لاختبار معلوماتك فوراً وتحديث ترتيبك في لوحة المتصدرين.'
                : 'Select any lesson across the 8 accredited curricula or NDE-Ed courses to test your knowledge with instant scoring and real-time XP leaderboard updates.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateToDiscipline && (
              <button
                type="button"
                onClick={onCloseTargetedQuiz || onNavigateToDiscipline}
                className="px-3.5 py-2.5 rounded-xl border border-[#343d65] text-xs font-semibold text-slate-200 hover:border-slate-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isAr ? 'العودة إلى المناهج' : 'Back to Curricula'}
              </button>
            )}

            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trophy className="w-4 h-4" />
                <span>{isAr ? 'لوحة المتصدرين (XP)' : 'XP Leaderboard'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Column Live Trainee Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 tabular-nums">
          <div className="rounded-xl border border-[#242c54] bg-[#0b0d1e] p-4">
            <div className="text-xs text-slate-400">
              {isAr ? 'إجمالي نقاط الخبرة (XP)' : 'Total Student XP'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {quizStore.totalStudentXp} XP
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isAr
                ? `+${quizStore.bonusQuizXp} XP من اختبارات الدروس`
                : `+${quizStore.bonusQuizXp} XP from lesson quizzes`}
            </div>
          </div>

          <div className="rounded-xl border border-[#242c54] bg-[#0b0d1e] p-4">
            <div className="text-xs text-slate-400">
              {isAr ? 'ترتيبك في لوحة المتصدرين' : 'Current Leaderboard Rank'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
              #{quizStore.currentUserRank}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {quizStore.totalStudentsCount}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isAr ? `الفئة الهندسية: ${quizStore.tier}` : `Tier: ${quizStore.tier}`}
            </div>
          </div>

          <div className="rounded-xl border border-[#242c54] bg-[#0b0d1e] p-4">
            <div className="text-xs text-slate-400">
              {isAr ? 'الدروس المجتازة بنجاح' : 'Passed Lesson Quizzes'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-1">
              {quizStore.passedCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {allAccreditedPacks.length + allNdeCoursePacks.length}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isAr
                ? `إجمالي المحاولات: ${quizStore.totalAttempts}`
                : `Total attempts: ${quizStore.totalAttempts}`}
            </div>
          </div>

          <div className="rounded-xl border border-[#242c54] bg-[#0b0d1e] p-4">
            <div className="text-xs text-slate-400">
              {isAr ? 'متوسط دقة الإجابات' : 'Average Quiz Accuracy'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {quizStore.averageBestPct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isAr ? 'حد الاجتياز المعتمد: 75%' : 'Accredited pass mark: 75%'}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Zone Sandbox Layout: Lesson Selector + Active Interactive Quiz Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Start Zone: Filterable Lesson Quiz Bank */}
        <aside className="lg:col-span-5 rounded-2xl border border-[#29315b] bg-[#10132b] p-4 sm:p-5 space-y-4">
          {/* Source Toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0b0d1e] border border-[#242c54]">
            <button
              type="button"
              onClick={() => {
                setCatalogSource('curriculum');
                if (allAccreditedPacks[0]) setSelectedPackId(allAccreditedPacks[0].packId);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                catalogSource === 'curriculum'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? `المناهج المعتمدة (${allAccreditedPacks.length})`
                  : `Accredited Units (${allAccreditedPacks.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCatalogSource('nde_ed');
                setDisciplineFilter('ALL');
                if (allNdeCoursePacks[0]) setSelectedPackId(allNdeCoursePacks[0].packId);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                catalogSource === 'nde_ed'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? `دروس NDE-Ed (${allNdeCoursePacks.length})`
                  : `NDE-Ed Lessons (${allNdeCoursePacks.length})`}
              </span>
            </button>
          </div>

          {/* Search & Discipline Filter */}
          <div className="space-y-2.5">
            <label className="relative block">
              <span className="sr-only">{isAr ? 'ابحث عن اختبار درس' : 'Search lesson quiz'}</span>
              <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr ? 'ابحث باسم الدرس أو الكود...' : 'Search lesson title or code...'
                }
                className="w-full rounded-xl border border-[#242c54] bg-[#0b0d1e] py-2.5 ps-9 pe-3 text-xs text-white"
              />
            </label>

            <select
              aria-label={isAr ? 'تصفية حسب التخصص' : 'Filter by discipline'}
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="w-full rounded-xl border border-[#242c54] bg-[#0b0d1e] px-3 py-2.5 text-xs text-slate-200"
            >
              <option value="ALL">
                {isAr ? 'جميع التخصصات الهندسية (8 مسارات)' : 'All Engineering Disciplines (8)'}
              </option>
              {ENGINEERING_DISCIPLINES.map((d) => (
                <option key={d.id} value={d.id}>
                  {isAr ? d.titleAr : d.titleEn}
                </option>
              ))}
            </select>
          </div>

          {/* Scrollable Lesson Quiz List */}
          <div className="space-y-2 max-h-[540px] overflow-y-auto pe-1">
            {filteredPacks.map((pack) => {
              const rec = quizStore.recordsMap[pack.packId];
              const isSelected = activePack?.packId === pack.packId;
              return (
                <button
                  key={pack.packId}
                  type="button"
                  onClick={() => setSelectedPackId(pack.packId)}
                  className={`w-full rounded-xl border p-3.5 text-start transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-[#1a2049] text-white'
                      : 'border-[#242c54] bg-[#0b0d1e] text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 tabular-nums mb-1">
                    <span className="truncate">{isAr ? pack.subtitle.ar : pack.subtitle.en}</span>
                    {rec ? (
                      <span
                        className={`inline-flex items-center gap-1 font-bold shrink-0 ${
                          rec.passed ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {rec.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <HelpCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{rec.bestScorePct}%</span>
                      </span>
                    ) : (
                      <span className="text-cyan-300 shrink-0">+{pack.maxXpReward} XP</span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                    {isAr ? pack.title.ar : pack.title.en}
                  </div>
                </button>
              );
            })}

            {filteredPacks.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#343d65] p-6 text-center text-xs text-slate-400 space-y-2">
                <p>{isAr ? 'لا توجد اختبارات مطابقة للبحث.' : 'No matching lesson quizzes.'}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDisciplineFilter('ALL');
                  }}
                  className="text-amber-400 underline cursor-pointer"
                >
                  {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right/Main Zone: Active Quiz Stage */}
        <div className="lg:col-span-7">
          {activePack ? (
            <PostLessonQuizPanel
              pack={activePack}
              language={language}
              defaultCollapsed={false}
              onOpenLeaderboard={onOpenLeaderboard}
            />
          ) : (
            <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-8 text-center text-slate-300 text-sm">
              <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p>
                {isAr
                  ? 'اختر درساً من القائمة لبدء الاختبار التفاعلي.'
                  : 'Select a lesson from the list to launch its quiz.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};