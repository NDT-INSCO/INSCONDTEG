import React from 'react';
import { ArrowLeft, ArrowRight, Clock, GraduationCap, Layers } from 'lucide-react';
import type { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { useUserCourseProgress } from '../../utils/userCourseProgressStore';
import { AcademyPageHeader } from './AcademyShell';
import { disciplineHash } from '../../utils/portalRoutes';

interface AcademyDisciplineIndexProps {
  language: Language;
  onOpenHash: (hash: string) => void;
}

/**
 * The discipline shelf.
 *
 * Every discipline is a page of its own (`#academy/disciplines/<id>`) with its
 * levels, modules, labs and tests — this index exists so a learner can compare
 * the eight programmes and pick one, not so everything can be poured onto one
 * screen.
 */
export const AcademyDisciplineIndex: React.FC<AcademyDisciplineIndexProps> = ({
  language,
  onOpenHash,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const { activeSummary } = useUserCourseProgress();
  const stats = new Map(activeSummary.byDiscipline.map(stat => [stat.disciplineId, stat]));

  return (
    <div data-testid="academy-discipline-index" className="space-y-6">
      <AcademyPageHeader
        eyebrow={isAr ? 'التخصصات الهندسية' : 'Engineering disciplines'}
        title={
          isAr
            ? `${ENGINEERING_DISCIPLINES.length} تخصصات، لكل تخصص صفحته ومستوياته ومعامله`
            : `${ENGINEERING_DISCIPLINES.length} disciplines, each with its own page, levels and labs`
        }
        description={
          isAr
            ? 'اختر التخصص لتدخل صفحته الخاصة: المستويات، الوحدات والموضوعات، الاختبارات، والمعامل المرتبطة به. تقدّمك محفوظ لكل تخصص على حدة.'
            : 'Open a discipline to reach its own page: levels, modules and topics, quizzes, and the labs that belong to it. Progress is kept per discipline.'
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ENGINEERING_DISCIPLINES.map((discipline, index) => {
          const modules = discipline.levels.reduce((sum, level) => sum + level.modules.length, 0);
          const hours = discipline.levels.reduce((sum, level) => sum + level.trainingHours, 0);
          const stat = stats.get(discipline.id);
          const percent = stat?.percent ?? 0;

          return (
            <article
              key={discipline.id}
              data-testid={`discipline-card-${discipline.id}`}
              className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 space-y-3 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                    {String(index + 1).padStart(2, '0')} · {discipline.category}
                  </div>
                  <h3 className="text-base font-black text-white leading-tight">
                    {isAr ? discipline.titleAr : discipline.titleEn}
                  </h3>
                </div>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {isAr ? discipline.overviewAr : discipline.overviewEn}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                {discipline.keyTechniques.slice(0, 5).map(technique => (
                  <span
                    key={technique}
                    className="rounded-md bg-[#181d45] border border-cyan-500/25 px-2 py-0.5 font-mono text-cyan-200"
                  >
                    {technique}
                  </span>
                ))}
              </div>

              <dl className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-[#0b0d1e] border border-[#242c54] py-2">
                  <dt className="text-slate-500">{isAr ? 'مستويات' : 'Levels'}</dt>
                  <dd className="font-black text-white tabular-nums">{discipline.levels.length}</dd>
                </div>
                <div className="rounded-lg bg-[#0b0d1e] border border-[#242c54] py-2">
                  <dt className="text-slate-500">{isAr ? 'وحدات' : 'Modules'}</dt>
                  <dd className="font-black text-white tabular-nums">{modules}</dd>
                </div>
                <div className="rounded-lg bg-[#0b0d1e] border border-[#242c54] py-2">
                  <dt className="text-slate-500">{isAr ? 'ساعات' : 'Hours'}</dt>
                  <dd className="font-black text-white tabular-nums">{hours}</dd>
                </div>
              </dl>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                  <span>{isAr ? 'إنجازك في هذا التخصص' : 'Your progress in this discipline'}</span>
                  <span className="text-amber-300 font-bold">
                    {stat ? `${stat.completed}/${stat.total}` : `0/${modules}`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label={
                    isAr
                      ? `نسبة إنجاز ${discipline.titleAr}`
                      : `Completion of ${discipline.titleEn}`
                  }
                  className="h-1.5 w-full rounded-full bg-[#1b2148] overflow-hidden"
                >
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 mt-auto">
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {discipline.globalAccreditations.join(' · ')}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenHash(disciplineHash(discipline.id))}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-[11px] font-black text-slate-950 transition cursor-pointer whitespace-nowrap"
                >
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'افتح صفحة التخصص' : 'Open discipline page'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
