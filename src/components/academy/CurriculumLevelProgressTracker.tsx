import React from 'react';
import { Award, CheckCircle2, HelpCircle, Trophy } from 'lucide-react';
import { Language } from '../../types';
import { useLessonQuizStore } from '../../utils/lessonQuizStore';
import { useUserCourseProgress } from '../../utils/userCourseProgressStore';

interface CurriculumLevelProgressTrackerProps {
  language: Language;
  onNavigate?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
  onNavigateToModule?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
  onNavigateToCertificates?: () => void;
  onLaunchQuiz?: (
    disciplineId: string,
    levelId?: string,
    moduleId?: string,
    moduleTitle?: { ar: string; en: string }
  ) => void;
  onOpenLeaderboard?: () => void;
}

export const CurriculumLevelProgressTracker: React.FC<CurriculumLevelProgressTrackerProps> = ({
  language,
  onNavigate,
  onNavigateToModule,
  onNavigateToCertificates,
  onLaunchQuiz,
  onOpenLeaderboard,
}) => {
  const isAr = language === 'ar';
  const quizStore = useLessonQuizStore();
  const { activeUser, activeSummary, allModules } = useUserCourseProgress();

  const completedSet = new Set(activeUser.completedModuleIds);
  const completedUnitsCount = allModules.filter(
    (m) =>
      completedSet.has(m.moduleId) ||
      Boolean(quizStore.recordsMap[`curriculum:${m.moduleId}`]?.passed)
  ).length;

  const nextRecommended =
    activeSummary.nextRecommendedModule ||
    allModules.find(
      (m) =>
        !completedSet.has(m.moduleId) &&
        !quizStore.recordsMap[`curriculum:${m.moduleId}`]?.passed
    ) ||
    allModules[0];

  const handleOpenNextModule = () => {
    if (!nextRecommended) return;
    const nav = onNavigateToModule || onNavigate;
    nav?.(nextRecommended.disciplineId, nextRecommended.levelIdx, nextRecommended.moduleId);
  };

  const handleLaunchNextQuiz = () => {
    if (!nextRecommended || !onLaunchQuiz) return;
    onLaunchQuiz(
      nextRecommended.disciplineId,
      nextRecommended.levelId,
      nextRecommended.moduleId,
      { ar: nextRecommended.titleAr, en: nextRecommended.titleEn }
    );
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="rounded-2xl border border-[#29315b] bg-[#10132b] px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
          <span className="font-semibold text-amber-300">
            {isAr ? 'تتبع التقدم ونقاط الخبرة' : 'Curriculum Progress & XP Tracker'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-200 font-medium">
            {isAr ? activeUser.nameAr : activeUser.nameEn}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 text-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {completedUnitsCount}/{allModules.length}{' '}
            {isAr ? 'وحدة منهجية مجتازة' : 'accredited units passed'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-300 font-semibold">
            {quizStore.totalStudentXp} XP ({quizStore.tier})
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-cyan-300">
            {isAr
              ? `الترتيب العام #${quizStore.currentUserRank}`
              : `Leaderboard #${quizStore.currentUserRank}`}
          </span>
        </div>

        {nextRecommended && (
          <p className="text-xs sm:text-sm text-slate-200">
            <span className="text-slate-400">
              {isAr ? 'الدرس التالي المقترح للاختبار: ' : 'Next lesson quiz up: '}
            </span>
            <button
              type="button"
              onClick={handleOpenNextModule}
              className="font-semibold text-white hover:text-amber-300 underline decoration-slate-600 underline-offset-4 transition-colors cursor-pointer"
            >
              {isAr ? nextRecommended.titleAr : nextRecommended.titleEn}
            </button>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {onLaunchQuiz && nextRecommended && (
          <button
            type="button"
            onClick={handleLaunchNextQuiz}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'اختبر معلوماتك (+XP)' : 'Take Lesson Quiz (+XP)'}</span>
          </button>
        )}

        {onOpenLeaderboard && (
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="px-3.5 py-2 rounded-lg border border-[#343d65] bg-[#0b0d1e] hover:border-amber-400 text-xs font-semibold text-amber-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{isAr ? 'لوحة المتصدرين' : 'XP Leaderboard'}</span>
          </button>
        )}

        {onNavigateToCertificates && (
          <button
            type="button"
            onClick={onNavigateToCertificates}
            className="px-3 py-2 rounded-lg border border-[#303961] text-xs font-medium text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Award className="w-3.5 h-3.5 text-sky-400" />
            <span>{isAr ? 'إفادة التعلم' : 'Statement'}</span>
          </button>
        )}
      </div>
    </div>
  );
};