import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ClipboardCheck,
  Clock,
  Compass,
  FileText,
  Info,
  Route,
  ShieldAlert,
} from 'lucide-react';
import { Language } from '../../types';
import { LEARNING_PATHS, LearningPath, PathStep, getLearningPath, pathLessonIds, pathStats } from '../../data/learningPaths';
import { NDE_ED_COURSES } from '../../data/ndeEd';
import { PRACTICAL_TASKS } from '../../data/practicalAssessment';
import { readNdeEdProgress } from '../../utils/ndeEdProgress';
import { readPracticalAssessments, summarise } from '../../utils/practicalAssessment';

interface LearningPathsViewProps {
  language: Language;
  initialPathId?: string;
  onOpenCourse?: (courseId: string) => void;
  onOpenPractical?: (taskId: string) => void;
}

const local = (value: { ar: string; en: string }, language: Language) => value[language];

const STEP_ICON: Record<PathStep['kind'], React.ElementType> = {
  course: BookOpen,
  practical: ClipboardCheck,
  reading: FileText,
  check: CheckCircle2,
};

const STEP_LABEL: Record<PathStep['kind'], { ar: string; en: string }> = {
  course: { ar: 'مقرر', en: 'Course' },
  practical: { ar: 'تقييم عملي', en: 'Practical' },
  reading: { ar: 'قراءة', en: 'Reading' },
  check: { ar: 'فحص فهم', en: 'Check' },
};

export const LearningPathsView: React.FC<LearningPathsViewProps> = ({
  language,
  initialPathId,
  onOpenCourse,
  onOpenPractical,
}) => {
  const isAr = language === 'ar';
  const [pathId, setPathId] = useState<string | null>(initialPathId || null);
  const [progress] = useState(() => readNdeEdProgress());
  const [records] = useState(() => readPracticalAssessments());

  const completedLessons = useMemo(() => new Set(progress.completedLessons), [progress]);
  const passedPractical = useMemo(
    () => new Set(records.filter(record => summarise(record).outcome === 'meets').map(record => record.taskId)),
    [records]
  );

  const courseDone = (courseId: string) => {
    const course = NDE_ED_COURSES.find(item => item.id === courseId);
    if (!course) return false;
    return course.lessons.every(lesson => completedLessons.has(lesson.id));
  };

  const stepDone = (step: PathStep): boolean => {
    if (step.kind === 'course' && step.courseId) return courseDone(step.courseId);
    if (step.kind === 'practical' && step.practicalTaskId) return passedPractical.has(step.practicalTaskId);
    if (step.kind === 'check' || step.kind === 'reading') return false;
    return false;
  };

  const activePath = pathId ? getLearningPath(pathId) : null;

  if (activePath) {
    const stats = pathStats(activePath);
    const doneSteps = activePath.steps.filter(stepDone).length;
    const lessons = pathLessonIds(activePath);
    const completedLessonsInPath = lessons.filter(id => completedLessons.has(id)).length;

    return (
      <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
        <button type="button" onClick={() => setPathId(null)} className="flex items-center gap-1 text-xs text-amber-400">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isAr ? 'كل المسارات' : 'All paths'}
        </button>

        <header className="rounded-3xl border border-indigo-400/25 bg-gradient-to-br from-[#141a3d] via-[#0b1028] to-[#060812] p-5 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300">
            <Route className="w-4 h-4" />{isAr ? 'مسار تعلم ذاتي' : 'Self-study path'}
          </div>
          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">{local(activePath.title, language)}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">{local(activePath.summary, language)}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <p className="rounded-xl border border-[#29315b] p-3 text-xs leading-6 text-slate-300"><strong className="text-slate-100">{isAr ? 'لمن: ' : 'For: '}</strong>{local(activePath.audience, language)}</p>
            <p className="rounded-xl border border-[#29315b] p-3 text-xs leading-6 text-slate-300"><strong className="text-slate-100">{isAr ? 'النتيجة: ' : 'Outcome: '}</strong>{local(activePath.outcome, language)}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-200">
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{stats.steps} {isAr ? 'خطوة' : 'steps'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{stats.courses} {isAr ? 'مقررات' : 'courses'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{stats.practical} {isAr ? 'تقييمات عملية' : 'practical tasks'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{Math.round(stats.minutes / 60)}h {isAr ? 'قراءة مقترحة' : 'suggested reading'}</span>
            <span className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-emerald-300">{doneSteps}/{stats.steps} {isAr ? 'خطوات مكتملة' : 'steps complete'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{completedLessonsInPath}/{lessons.length} {isAr ? 'درساً' : 'lessons'}</span>
          </div>
        </header>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100/90 flex gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-300" />
          <p><strong className="text-amber-200">{isAr ? 'حدود المسار: ' : 'Path limits: '}</strong>{local(activePath.limits, language)}</p>
        </div>

        <ol className="space-y-2">
          {activePath.steps.map((step, index) => {
            const Icon = STEP_ICON[step.kind];
            const done = stepDone(step);
            const course = step.courseId ? NDE_ED_COURSES.find(item => item.id === step.courseId) : null;
            const practical = step.practicalTaskId ? PRACTICAL_TASKS.find(item => item.id === step.practicalTaskId) : null;
            const action = step.kind === 'course' && course && onOpenCourse
              ? () => onOpenCourse(course.id)
              : step.kind === 'practical' && practical && onOpenPractical
                ? () => onOpenPractical(practical.id)
                : null;
            return (
              <li key={step.id} className={`flex gap-3 rounded-2xl border p-3 ${done ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-[#29315b] bg-[#10132b]'}`}>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#343d65] font-mono text-[11px] text-slate-300">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 rounded bg-[#181d45] px-2 py-0.5 text-[10px] text-indigo-300"><Icon className="h-3 w-3" />{local(STEP_LABEL[step.kind], language)}</span>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 text-slate-600" />}
                    {step.minutes ? <span className="flex items-center gap-1 text-[10px] text-slate-500"><Clock className="h-3 w-3" />{step.minutes} min</span> : null}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-100">{local(step.title, language)}</p>
                  <p className="mt-1 text-[11px] leading-6 text-slate-400">{local(step.detail, language)}</p>
                  {action && (
                    <button type="button" onClick={action} className="mt-2 rounded-lg border border-indigo-400/40 px-3 py-1.5 text-[11px] font-bold text-indigo-200">
                      {step.kind === 'course' ? (isAr ? 'فتح المقرر' : 'Open course') : (isAr ? 'فتح التقييم العملي' : 'Open practical assessment')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <p className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 text-[11px] leading-6 text-slate-400 flex gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
          {isAr
            ? 'إتمام خطوات المسار يُسجَّل محلياً فقط، ولا يمنح شهادة أو اعتماداً. الخطوة «فحص فهم» تُعد مكتملة عند اجتياز الفحص الشامل للمقرر من صفحته.'
            : 'Path completion is stored locally only and grants no certificate or accreditation. A “check” step counts as done once you pass the course self-check on its own page.'}
        </p>
      </div>
    );
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
      <header className="rounded-3xl border border-indigo-400/25 bg-gradient-to-br from-[#141a3d] via-[#0b1028] to-[#060812] p-5 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300">
          <Compass className="w-4 h-4" />{isAr ? 'مسارات التعلم' : 'Learning paths'}
        </div>
        <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
          {isAr ? 'ترتيب مقترح بدل قائمة مفتوحة' : 'A suggested order instead of an open list'}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          {isAr
            ? 'المسار لا يضيف محتوى جديداً؛ يربط المقررات والمهام العملية الموجودة بترتيب منطقي. يمكنك دائماً فتح أي مقرر مباشرة.'
            : 'A path adds no new content; it links the existing courses and practical tasks in a logical order. You can always open any course directly.'}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {LEARNING_PATHS.map(path => {
          const stats = pathStats(path);
          const lessons = pathLessonIds(path);
          const done = lessons.filter(id => completedLessons.has(id)).length;
          const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          return (
            <article key={path.id} className="flex flex-col rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
              <span className="flex items-center gap-1 rounded bg-[#181d45] px-2 py-0.5 text-[10px] text-indigo-300 w-fit"><Route className="h-3 w-3" />{isAr ? 'مسار' : 'Path'}</span>
              <h3 className="mt-2 text-base font-black text-white">{local(path.title, language)}</h3>
              <p className="mt-1 text-[11px] leading-6 text-slate-400">{local(path.summary, language)}</p>
              <p className="mt-2 text-[10px] text-slate-500">{stats.steps} {isAr ? 'خطوة' : 'steps'} · {stats.courses} {isAr ? 'مقررات' : 'courses'} · {stats.practical} {isAr ? 'عملي' : 'practical'}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500"><span>{isAr ? 'دروس مكتملة' : 'Lessons done'}</span><span className="font-mono">{done}/{lessons.length}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#1a2145]">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <button type="button" onClick={() => setPathId(path.id)} className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-indigo-400 px-3 py-2 text-[11px] font-black text-slate-950">
                {isAr ? 'عرض المسار' : 'View path'}
              </button>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 text-[11px] leading-6 text-slate-400">
        <h3 className="mb-1 flex items-center gap-1.5 text-xs font-black text-slate-200"><Info className="w-3.5 h-3.5 text-sky-400" />{isAr ? 'كيف تُحسب الحالة؟' : 'How status is computed'}</h3>
        <p>{isAr
          ? 'المقرر يُعد مكتملاً عند إتمام كل دروسه. التقييم العملي يُعد منجزاً عند سجل مكتمل نتيجته «يطابق معايير التدريب». لا يتم إخفاء أي نقص؛ الحالة تُقرأ من التخزين المحلي في كل مرة.'
          : 'A course counts as complete when all its lessons are marked complete. A practical task counts once a complete record with a “meets” outcome exists. Nothing is rounded up; status is recomputed from local storage every time.'}</p>
      </section>
    </div>
  );
};
