import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { getModuleQuizPack } from '../../data/curriculumLessonQuizzes';
import {
  getCompletedModules,
  getCompletedTopics,
  toggleTopicCompleted,
} from '../../utils/curriculumProgress';
import { useLessonQuizStore } from '../../utils/lessonQuizStore';
import {
  toggleUserModuleCompleted,
  useUserCourseProgress,
} from '../../utils/userCourseProgressStore';
import { PostLessonQuizPanel } from './PostLessonQuizPanel';

interface DisciplineCurriculumViewProps {
  language: Language;
  disciplineId?: string;
  levelIdx?: number;
  moduleId?: string;
  /** Deep-link target names used by the academy container. */
  targetDisciplineId?: string;
  targetLevelIdx?: number;
  targetModuleId?: string;
  onLaunchFlashcards?: (disciplineId: string, moduleId?: string) => void;
  onLaunchQuiz?: (
    disciplineId: string,
    levelId?: string,
    moduleId?: string,
    moduleTitle?: { ar: string; en: string }
  ) => void;
  onOpenLeaderboard?: () => void;
}

export const DisciplineCurriculumView: React.FC<DisciplineCurriculumViewProps> = ({
  language,
  disciplineId,
  levelIdx,
  moduleId,
  targetDisciplineId,
  targetLevelIdx,
  targetModuleId,
  onLaunchFlashcards,
  onLaunchQuiz,
  onOpenLeaderboard,
}) => {
  const isAr = language === 'ar';
  const resolvedDisciplineProp = targetDisciplineId || disciplineId || ENGINEERING_DISCIPLINES[0].id;
  const resolvedLevelProp = targetLevelIdx ?? levelIdx ?? 0;
  const resolvedModuleProp = targetModuleId || moduleId;

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(resolvedDisciplineProp);
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(resolvedLevelProp);
  const [openQuizModuleId, setOpenQuizModuleId] = useState<string | null>(
    resolvedModuleProp || null
  );
  const [completedTopicsMap, setCompletedTopicsMap] = useState(() => getCompletedTopics());
  const [completedModulesMap, setCompletedModulesMap] = useState(() => getCompletedModules());

  const quizStore = useLessonQuizStore();
  const { activeUser, activeSummary } = useUserCourseProgress();
  const activeUserCompletedSet = useMemo(
    () => new Set(activeUser.completedModuleIds),
    [activeUser.completedModuleIds]
  );

  useEffect(() => {
    if (targetDisciplineId || disciplineId) {
      setSelectedDisciplineId(targetDisciplineId || disciplineId || ENGINEERING_DISCIPLINES[0].id);
    }
    if (targetLevelIdx !== undefined || levelIdx !== undefined) {
      setSelectedLevelIdx(targetLevelIdx ?? levelIdx ?? 0);
    }
    if (targetModuleId || moduleId) {
      setOpenQuizModuleId(targetModuleId || moduleId || null);
    }
  }, [disciplineId, levelIdx, moduleId, targetDisciplineId, targetLevelIdx, targetModuleId]);

  useEffect(() => {
    const syncProgress = () => {
      setCompletedTopicsMap(getCompletedTopics());
      setCompletedModulesMap(getCompletedModules());
    };
    window.addEventListener('insco_progress_updated', syncProgress);
    window.addEventListener('insco_user_progress_updated', syncProgress);
    window.addEventListener('insco_topic_progress_updated', syncProgress);
    window.addEventListener('insco_quiz_completed', syncProgress);
    return () => {
      window.removeEventListener('insco_progress_updated', syncProgress);
      window.removeEventListener('insco_user_progress_updated', syncProgress);
      window.removeEventListener('insco_topic_progress_updated', syncProgress);
      window.removeEventListener('insco_quiz_completed', syncProgress);
    };
  }, []);

  const activeDiscipline = useMemo(() => {
    return (
      ENGINEERING_DISCIPLINES.find((d) => d.id === selectedDisciplineId) ||
      ENGINEERING_DISCIPLINES[0]
    );
  }, [selectedDisciplineId]);

  const safeLevelIdx =
    selectedLevelIdx >= 0 && selectedLevelIdx < activeDiscipline.levels.length
      ? selectedLevelIdx
      : 0;
  const activeLevel = activeDiscipline.levels[safeLevelIdx];

  const handleToggleTopic = async (modId: string, topicText: string) => {
    await toggleTopicCompleted(modId, topicText, activeDiscipline.id);
    setCompletedTopicsMap(getCompletedTopics());
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header & Discipline Selector */}
      <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-7 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
              <span className="font-semibold text-amber-300">
                {isAr ? 'المناهج الهندسية المعتمدة' : 'Accredited Engineering Curricula'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {ENGINEERING_DISCIPLINES.length}{' '}
                {isAr ? 'تخصصات صناعية' : 'Industrial Disciplines'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">
                {isAr
                  ? `رصيدك الحالي: ${quizStore.totalStudentXp} XP (المرتبة #${quizStore.currentUserRank})`
                  : `Your Balance: ${quizStore.totalStudentXp} XP (Rank #${quizStore.currentUserRank})`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300">
                {isAr
                  ? `${activeUser.nameAr}: ${activeSummary.completedCount}/${activeSummary.totalCount} (${activeSummary.percent}%)`
                  : `${activeUser.nameEn}: ${activeSummary.completedCount}/${activeSummary.totalCount} (${activeSummary.percent}%)`}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {isAr
                ? 'المناهج المعتمدة واختبارات نهاية الدروس التفاعلية'
                : 'Accredited Curricula & Post-Lesson Interactive Quizzes'}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'ادرس وحدات كل تخصص، ووثّق إتمام الموضوعات، ثم خض اختبار نهاية الدرس الفوري لقياس الاستيعاب الكودي وكسب نقاط XP في لوحة المتصدرين.'
                : 'Study each discipline module, check off completed topics, and take the post-lesson quiz for instant code feedback and Leaderboard XP.'}
            </p>
          </div>

          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 self-start"
            >
              <Trophy className="w-4 h-4" />
              <span>
                {isAr ? 'لوحة المتصدرين (XP)' : 'XP Leaderboard'}
              </span>
            </button>
          )}
        </div>

        {/* 8 Disciplines Interactive Filter Bar */}
        <div
          role="tablist"
          aria-label={isAr ? 'التخصصات الهندسية' : 'Engineering Disciplines'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2"
        >
          {ENGINEERING_DISCIPLINES.map((disc) => {
            const isSelected = disc.id === activeDiscipline.id;
            const totalMods = disc.levels.reduce((acc, l) => acc + l.modules.length, 0);
            const passedMods = disc.levels.reduce(
              (acc, l) =>
                acc +
                l.modules.filter(
                  (m) =>
                    activeUserCompletedSet.has(m.id) ||
                    Boolean(completedModulesMap[m.id]) ||
                    Boolean(quizStore.recordsMap[`curriculum:${m.id}`]?.passed)
                ).length,
              0
            );

            return (
              <button
                key={disc.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedDisciplineId(disc.id);
                  setSelectedLevelIdx(0);
                  setOpenQuizModuleId(null);
                }}
                className={`rounded-xl border p-3.5 text-start transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-[#1a2049] text-white'
                    : 'border-[#252d58] bg-[#0b0d1e] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 tabular-nums mb-1">
                  <span className="truncate font-mono text-amber-300">
                    {disc.keyTechniques.slice(0, 3).join(' / ')}
                  </span>
                  <span>
                    {passedMods}/{totalMods}
                  </span>
                </div>
                <div className="text-sm font-bold text-white line-clamp-1">
                  {isAr ? disc.titleAr : disc.titleEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Discipline Overview & Qualification Level Tabs */}
      {activeLevel && (
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#212850]">
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white">
                {isAr ? activeDiscipline.titleAr : activeDiscipline.titleEn}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isAr ? activeDiscipline.overviewAr : activeDiscipline.overviewEn}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400 tabular-nums">
                <span>
                  {isAr ? 'الاعتمادات المرجعية:' : 'Accreditations:'}{' '}
                  <strong className="text-slate-200">
                    {activeDiscipline.globalAccreditations.join(' · ')}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {isAr ? 'ساعات التدريب القياسية:' : 'Training Hours:'}{' '}
                  <strong className="text-amber-300">{activeLevel.trainingHours}h</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono text-cyan-300">
                  {activeLevel.applicableCodes.join(' · ')}
                </span>
              </div>
            </div>

            {activeDiscipline.levels.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0b0d1e] border border-[#242c54] shrink-0">
                {activeDiscipline.levels.map((lvl, idx) => (
                  <button
                    key={lvl.levelId}
                    type="button"
                    onClick={() => {
                      setSelectedLevelIdx(idx);
                      setOpenQuizModuleId(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      idx === safeLevelIdx
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {isAr ? lvl.nameAr : lvl.nameEn}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Level Modules & Post-Lesson Quizzes */}
          <div className="space-y-5">
            {activeLevel.modules.map((mod, modIdx) => {
              const topics = (isAr ? mod.topicsAr : mod.topicsEn) || [];
              const outcomes = (isAr ? mod.learningOutcomesAr : mod.learningOutcomesEn) || [];
              const doneTopics = completedTopicsMap[mod.id] || [];
              const quizPack = getModuleQuizPack(mod.id, activeDiscipline.id);
              const quizRecord = quizStore.recordsMap[quizPack.packId];
              const isUserMarkedComplete = activeUserCompletedSet.has(mod.id);
              const isPassed = Boolean(
                isUserMarkedComplete || completedModulesMap[mod.id] || quizRecord?.passed
              );
              const isQuizOpen = openQuizModuleId === mod.id;

              return (
                <article
                  key={mod.id}
                  data-testid={`curriculum-module-${mod.id}`}
                  className="rounded-2xl border border-[#242c54] bg-[#0b0d1e] p-5 sm:p-6 space-y-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
                        <span className="font-mono text-amber-300">
                          {String(modIdx + 1).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {mod.duration}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {doneTopics.length}/{topics.length}{' '}
                          {isAr ? 'موضوعات منجزة' : 'topics checked'}
                        </span>
                        <span aria-hidden="true">·</span>
                        {isPassed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isAr
                                ? `مجتاز (${quizRecord?.bestScorePct ?? 100}%)`
                                : `Passed (${quizRecord?.bestScorePct ?? 100}%)`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-cyan-300">
                            {isAr
                              ? `مكافأة الدرس حتى +${quizPack.maxXpReward} XP`
                              : `Up to +${quizPack.maxXpReward} XP`}
                          </span>
                        )}
                      </div>

                      <h5 className="text-lg sm:text-xl font-bold text-white">
                        {isAr ? mod.titleAr : mod.titleEn}
                      </h5>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-testid={`toggle-module-complete-${mod.id}`}
                        aria-pressed={isUserMarkedComplete}
                        onClick={() => toggleUserModuleCompleted(mod.id)}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                          isUserMarkedComplete
                            ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                            : 'border-[#303961] text-slate-200 hover:border-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {isUserMarkedComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>
                          {isUserMarkedComplete
                            ? isAr
                              ? 'وحدة مكتملة'
                              : 'Module Completed'
                            : isAr
                              ? 'تحديد الوحدة كمكتملة'
                              : 'Mark Module Complete'}
                        </span>
                      </button>

                      {onLaunchFlashcards && (
                        <button
                          type="button"
                          onClick={() => onLaunchFlashcards(activeDiscipline.id, mod.id)}
                          className="px-3 py-2 rounded-lg border border-[#303961] text-xs font-semibold text-cyan-300 hover:border-cyan-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                          <span>{isAr ? 'بطاقات المراجعة' : 'Flashcards'}</span>
                        </button>
                      )}

                      {onLaunchQuiz && (
                        <button
                          type="button"
                          onClick={() =>
                            onLaunchQuiz(activeDiscipline.id, activeLevel.levelId, mod.id, {
                              ar: mod.titleAr,
                              en: mod.titleEn,
                            })
                          }
                          className="px-3 py-2 rounded-lg border border-[#303961] text-xs font-semibold text-slate-200 hover:border-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAr ? 'قاعة الاختبارات' : 'Quiz Center'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setOpenQuizModuleId(isQuizOpen ? null : mod.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                          isQuizOpen
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>
                          {isQuizOpen
                            ? isAr
                              ? 'إخفاء اختبار الدرس'
                              : 'Hide Lesson Quiz'
                            : isPassed
                              ? isAr
                                ? 'مراجعة اختبار الدرس (+XP)'
                                : 'Review Lesson Quiz (+XP)'
                              : isAr
                                ? 'اختبر معلوماتك بعد الدرس (+XP)'
                                : 'Take Post-Lesson Quiz (+XP)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Topics Checklist & Learning Outcomes */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 space-y-2.5">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {isAr
                            ? 'مفردات الدرس المعتمدة (اضغط لتأشير الإنجاز):'
                            : 'Accredited Lesson Topics (click to mark studied):'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {topics.map((topic, tIdx) => {
                          const checked = doneTopics.includes(topic);
                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => handleToggleTopic(mod.id, topic)}
                              className={`w-full rounded-xl border px-3.5 py-2.5 text-start text-xs sm:text-sm transition-colors flex items-start gap-2.5 cursor-pointer ${
                                checked
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                                  : 'border-[#212850] bg-[#10132b] text-slate-200 hover:border-slate-500'
                              }`}
                            >
                              {checked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                              )}
                              <span className="leading-relaxed">{topic}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="lg:col-span-5 rounded-xl border border-[#212850] bg-[#10132b] p-4 space-y-2.5">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>
                          {isAr
                            ? 'مخرجات الكفاءة والقياس العملي:'
                            : 'Competency & Learning Outcomes:'}
                        </span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                        {outcomes.map((out, oIdx) => (
                          <li key={oIdx} className="flex items-start gap-2">
                            <span className="font-mono text-amber-400 shrink-0">
                              {oIdx + 1}.
                            </span>
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Inline Interactive Post-Lesson Quiz */}
                  {isQuizOpen && (
                    <PostLessonQuizPanel
                      pack={quizPack}
                      language={language}
                      defaultCollapsed={false}
                      onOpenLeaderboard={onOpenLeaderboard}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};