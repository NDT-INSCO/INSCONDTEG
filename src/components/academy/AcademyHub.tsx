import React from 'react';
import {
  Award,
  BookOpen,
  Compass,
  GraduationCap,
  Layers,
  ShieldAlert,
  Sparkles,
  Trophy,
  Wrench,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { useUserCourseProgress } from '../../utils/userCourseProgressStore';
import { AcademyPageHeader } from './AcademyShell';
import {
  ACADEMY_SECTION_COPY,
  ACADEMY_JOURNEY_SECTIONS,
  academySectionLabel,
  disciplineHash,
  type AcademySectionId,
} from '../../utils/portalRoutes';

const SECTION_ICONS: Record<AcademySectionId, typeof Compass> = {
  choose: Compass,
  learn: BookOpen,
  practice: Wrench,
  test: Award,
  progress: Trophy,
  mentor: Sparkles,
  university: GraduationCap,
};

interface AcademyHubProps {
  language: Language;
  onOpenHash: (hash: string) => void;
}

/**
 * The academy's own home page.
 *
 * It answers one question — "where do I stand and what is my next step?" — and
 * then sends the learner down one of two branches: the eight disciplines, or the
 * six sections of the journey. It never shows commercial content.
 */
export const AcademyHub: React.FC<AcademyHubProps> = ({ language, onOpenHash }) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const { activeUser, activeSummary } = useUserCourseProgress();
  const next = activeSummary.nextRecommendedModule;
  const byDiscipline = new Map(
    activeSummary.byDiscipline.map(stat => [stat.disciplineId, stat])
  );

  return (
    <div data-testid="academy-hub" className="space-y-6">
      <AcademyPageHeader
        eyebrow={isAr ? 'رئيسية الأكاديمية' : 'Academy home'}
        title={
          isAr
            ? 'مسار تعلّم مستقل: تخصص ← وحدات ← معامل ← اختبارات ← إنجاز'
            : 'An independent learning path: discipline → modules → labs → tests → progress'
        }
        description={
          isAr
            ? 'كل شيء هنا يخص المتدرّب فقط. لا يوجد طلب عرض سعر ولا خدمات شركة في هذا المسار، ويمكنك الرجوع إلى بوابة الشركة من الأعلى في أي وقت.'
            : 'Everything here belongs to the learner. No quotes and no commercial services on this path; the company portal is one click away at the top.'
        }
        actions={
          <button
            type="button"
            onClick={() => onOpenHash('#academy/disciplines')}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 transition cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'اختر تخصصك (8 تخصصات)' : 'Choose your discipline (8)'}</span>
          </button>
        }
      />

      <nav aria-label={isAr ? 'أدوات التعلّم' : 'Learning tools'} className="flex flex-wrap gap-2">
        {[
          ['#edb', 'مكتبة EDB', 'EDB library'],
          ['#standards', 'المراجع والأكواد', 'References & standards'],
          ['#ask_ai', 'المستشار التعليمي', 'AI tutor'],
        ].map(([hash, ar, en]) => (
          <a key={hash} href={hash} className="inline-flex min-h-10 items-center rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-sky-200 hover:border-sky-400">{isAr ? ar : en}</a>
        ))}
      </nav>

      {/* Where I stand + my next step */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border border-[#29315b] bg-[#10132b] p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-bold text-slate-200">
              {isAr ? `تقدّمك يا ${activeUser.nameAr}` : `Your progress, ${activeUser.nameEn}`}
            </span>
            <span className="font-mono tabular-nums text-amber-300">
              {activeSummary.completedCount}/{activeSummary.totalCount} · {activeSummary.percent}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={activeSummary.percent}
            aria-label={isAr ? 'نسبة إنجاز وحدات الأكاديمية' : 'Academy modules completion'}
            className="h-2 w-full rounded-full bg-[#1b2148] overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${activeSummary.percent}%` }}
            />
          </div>

          {next ? (
            <div className="rounded-xl border border-amber-500/30 bg-[#15122b] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  {isAr ? 'خطوتك التالية' : 'Your next step'}
                </div>
                <div className="text-sm font-bold text-white">
                  {isAr ? next.titleAr : next.titleEn}
                </div>
                <div className="text-[11px] text-slate-400">
                  {(isAr ? next.disciplineTitleAr : next.disciplineTitleEn)} ·{' '}
                  {(isAr ? next.levelNameAr : next.levelNameEn)} · {next.duration}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenHash(disciplineHash(next.disciplineId))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold text-cyan-200 transition cursor-pointer whitespace-nowrap"
              >
                <span>{isAr ? 'افتح التخصص' : 'Open discipline'}</span>
                <ArrowIcon className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-emerald-300">
              {isAr
                ? 'أنهيت كل الوحدات المتاحة. راجع مكتبة الأكواد أو أعد الاختبارات لتثبيت المعرفة.'
                : 'You finished every available module. Revisit the standards library or retake the quizzes.'}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
            {isAr ? 'حدود الإفادة' : 'Statement limits'}
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              {isAr
                ? 'ما يصدر من الأكاديمية هو «إفادة تعلّم ذاتي غير معتمدة». التأهيل المهني يخضع للجهة المانحة أو لجهة العمل بحسب النظام.'
                : 'The academy issues a non-accredited self-study statement. Professional qualification is handled by the awarding body or employer under the applicable scheme.'}
            </p>
          </div>
        </div>
      </div>

      {/* The eight disciplines */}
      <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">
            {isAr ? 'التخصصات الهندسية الثمانية' : 'The eight engineering disciplines'}
          </h3>
          <button
            type="button"
            onClick={() => onOpenHash('#academy/disciplines')}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 underline underline-offset-4 cursor-pointer"
          >
            {isAr ? 'كل التخصصات' : 'All disciplines'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {ENGINEERING_DISCIPLINES.map(discipline => {
            const stat = byDiscipline.get(discipline.id);
            return (
              <button
                key={discipline.id}
                type="button"
                onClick={() => onOpenHash(disciplineHash(discipline.id))}
                className="min-w-0 rounded-xl border border-[#252d58] bg-[#0b0d1e] hover:border-amber-400/50 p-3 text-start transition cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-amber-300 mb-1">
                  <span className="truncate">{discipline.keyTechniques.slice(0, 3).join(' / ')}</span>
                  <span className="tabular-nums text-slate-400">
                    {stat ? `${stat.completed}/${stat.total}` : `0/${discipline.levels.reduce((sum, level) => sum + level.modules.length, 0)}`}
                  </span>
                </div>
                <div className="text-xs font-bold text-white line-clamp-2">
                  {isAr ? discipline.titleAr : discipline.titleEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/*
        The six core journey sections, one under the other.

        They used to sit in a three-column grid: on a narrow screen the cards
        squeezed and their icons and labels ran into each other. As full-width
        rows every icon has a fixed tile, the text has room to breathe, and the
        order of the journey is read top-to-bottom like a table of contents.
      */}
      <section aria-label={isAr ? 'رحلة التعلم الأساسية' : 'Core learning journey'} className="space-y-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-sm font-bold text-white">
            {isAr ? 'رحلة التعلم الأساسية' : 'Core learning journey'}
          </h3>
          <span className="text-[11px] text-slate-500 tabular-nums">
            {ACADEMY_JOURNEY_SECTIONS.length} {isAr ? 'محطات' : 'steps'}
          </span>
        </div>

        {ACADEMY_JOURNEY_SECTIONS.map((section, index) => {
          const Icon = SECTION_ICONS[section];
          return (
            <button
              key={section}
              type="button"
              onClick={() => onOpenHash(`#academy/${section}`)}
              className="w-full min-w-0 rounded-2xl border border-[#29315b] bg-[#10132b] hover:border-amber-400/50 hover:bg-[#131736] p-3.5 text-start transition cursor-pointer flex items-center gap-3"
            >
              <span className="inline-flex shrink-0 items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 text-[11px] font-black tabular-nums">
                {index + 1}
              </span>
              <span className="inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[#0b0d1e] border border-[#252d58] text-amber-400">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">
                  {academySectionLabel(section, isAr ? 'ar' : 'en')}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400 leading-relaxed">
                  {isAr ? ACADEMY_SECTION_COPY[section].ar : ACADEMY_SECTION_COPY[section].en}
                </span>
              </span>
              <ArrowIcon className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
            </button>
          );
        })}
      </section>

      <section aria-labelledby="academy-university-title" className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-[#17132b] to-[#10132b] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="inline-flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-300">
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
                {isAr ? 'وجهة تعليمية مستقلة' : 'Independent learning destination'}
              </div>
              <h3 id="academy-university-title" className="text-sm font-bold text-white">
                {academySectionLabel('university', isAr ? 'ar' : 'en')}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr ? ACADEMY_SECTION_COPY.university.ar : ACADEMY_SECTION_COPY.university.en}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="academy-university-destination"
            onClick={() => onOpenHash('#academy/university')}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/10 px-3.5 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/20 transition cursor-pointer"
          >
            <span>{isAr ? 'افتح الجامعة الروبوتية' : 'Open Robotic University'}</span>
            <ArrowIcon className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
};
