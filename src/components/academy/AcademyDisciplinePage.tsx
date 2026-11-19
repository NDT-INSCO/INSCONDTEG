import React from 'react';
import { Award, BookOpen, Clock, Layers, Target, Wrench } from 'lucide-react';
import type { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { useUserCourseProgress } from '../../utils/userCourseProgressStore';
import { AcademyPageHeader } from './AcademyShell';
import { DisciplineCurriculumView } from './DisciplineCurriculumView';
import { disciplineHash } from '../../utils/portalRoutes';

interface AcademyDisciplinePageProps {
  language: Language;
  disciplineId: string;
  onOpenHash: (hash: string) => void;
}

/**
 * One discipline, one page.
 *
 * The page owns the discipline's own hierarchy: the eight siblings at the top,
 * then the levels, modules, topics and post-lesson quizzes of this discipline
 * only, then the doors to its labs, its tests and its progress. Nothing from
 * another discipline is mixed in, and no commercial content is present.
 */
export const AcademyDisciplinePage: React.FC<AcademyDisciplinePageProps> = ({
  language,
  disciplineId,
  onOpenHash,
}) => {
  const isAr = language === 'ar';
  const discipline = ENGINEERING_DISCIPLINES.find(item => item.id === disciplineId);
  const { activeSummary } = useUserCourseProgress();

  if (!discipline) {
    return (
      <div data-testid="academy-discipline-not-found" className="space-y-4">
        <AcademyPageHeader
          eyebrow={isAr ? 'تخصص غير معروف' : 'Unknown discipline'}
          title={isAr ? 'هذا التخصص غير موجود في المناهج الثمانية' : 'This discipline is not one of the eight'}
          description={
            isAr
              ? 'الرابط قد يكون قديماً أو مكتوباً خطأً. اختر من قائمة التخصصات المتاحة.'
              : 'The link may be old or mistyped. Pick one of the available disciplines.'
          }
          actions={
            <button
              type="button"
              onClick={() => onOpenHash('#academy/disciplines')}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 transition cursor-pointer"
            >
              <Layers className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'كل التخصصات' : 'All disciplines'}</span>
            </button>
          }
        />
      </div>
    );
  }

  const modules = discipline.levels.reduce((sum, level) => sum + level.modules.length, 0);
  const hours = discipline.levels.reduce((sum, level) => sum + level.trainingHours, 0);
  const stat = activeSummary.byDiscipline.find(item => item.disciplineId === discipline.id);
  const percent = stat?.percent ?? 0;

  return (
    <div data-testid={`academy-discipline-page-${discipline.id}`} className="space-y-6">
      {/* Siblings: the eight disciplines, this one current. */}
      <nav
        aria-label={isAr ? 'التخصصات الشقيقة' : 'Sibling disciplines'}
        className="flex items-center gap-1.5 overflow-x-auto pb-1"
      >
        <button
          type="button"
          onClick={() => onOpenHash('#academy/disciplines')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#212752] bg-[#10132b] hover:border-amber-400/50 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition cursor-pointer whitespace-nowrap"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span>{isAr ? 'كل التخصصات' : 'All disciplines'}</span>
        </button>
        {ENGINEERING_DISCIPLINES.map(item => {
          const isCurrent = item.id === discipline.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenHash(disciplineHash(item.id))}
              aria-current={isCurrent ? 'page' : undefined}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950'
                  : 'border border-[#212752] bg-[#10132b] text-slate-300 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              {isAr ? item.titleAr : item.titleEn}
            </button>
          );
        })}
      </nav>

      <AcademyPageHeader
        eyebrow={isAr ? `تخصص · ${discipline.category}` : `Discipline · ${discipline.category}`}
        title={isAr ? discipline.titleAr : discipline.titleEn}
        description={isAr ? discipline.overviewAr : discipline.overviewEn}
        actions={
          <>
            <button
              type="button"
              onClick={() => onOpenHash('#curriculum')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 transition cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'ابدأ الدراسة' : 'Start studying'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenHash('#academy/practice')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#303961] bg-[#10132b] hover:border-cyan-400/60 px-3.5 py-2 text-xs font-bold text-cyan-200 transition cursor-pointer whitespace-nowrap"
            >
              <Wrench className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'معامل التخصص' : 'Discipline labs'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenHash('#academy/test')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#303961] bg-[#10132b] hover:border-cyan-400/60 px-3.5 py-2 text-xs font-bold text-cyan-200 transition cursor-pointer whitespace-nowrap"
            >
              <Award className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'اختبارات التخصص' : 'Discipline tests'}</span>
            </button>
          </>
        }
      />

      {/* Facts about this programme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: isAr ? 'المستويات' : 'Levels', value: String(discipline.levels.length) },
          { label: isAr ? 'الوحدات' : 'Modules', value: String(modules) },
          { label: isAr ? 'ساعات التدريب' : 'Training hours', value: `${hours}h` },
          {
            label: isAr ? 'إنجازك' : 'Your progress',
            value: stat ? `${stat.completed}/${stat.total}` : `0/${modules}`,
          },
        ].map(fact => (
          <div
            key={fact.label}
            className="rounded-xl border border-[#29315b] bg-[#10132b] p-3.5"
          >
            <div className="text-[10px] text-slate-500">{fact.label}</div>
            <div className="text-lg font-black text-white tabular-nums">{fact.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
            <Target className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'التقنيات' : 'Key techniques'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {discipline.keyTechniques.map(technique => (
              <span
                key={technique}
                className="rounded-md bg-[#181d45] border border-cyan-500/25 px-2 py-0.5 text-[10px] font-mono text-cyan-200"
              >
                {technique}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
            <Award className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'الاعتمادات المرجعية' : 'Accreditations'}</span>
          </div>
          <ul className="text-[11px] text-slate-300 space-y-1">
            {discipline.globalAccreditations.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'القطاعات المستهدفة' : 'Target industries'}</span>
          </div>
          <ul className="text-[11px] text-slate-300 space-y-1">
            {discipline.targetIndustries.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* The discipline's own curriculum: levels, modules, topics, quizzes. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">
            {isAr ? 'المستويات والوحدات والاختبارات' : 'Levels, modules and quizzes'}
          </h3>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {isAr ? `${percent}% مكتمل` : `${percent}% complete`}
          </span>
        </div>
        <DisciplineCurriculumView
          language={language}
          disciplineId={discipline.id}
          compact
          onLaunchQuiz={() => onOpenHash('#academy/test')}
          onLaunchFlashcards={() => onOpenHash('#academy/learn')}
        />
      </div>
    </div>
  );
};
