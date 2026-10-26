import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  ListChecks,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import {
  NDE_ED_ATTRIBUTION,
  NDE_ED_COURSES,
  NDE_ED_EDITORIAL_DATE,
  NDE_ED_LESSONS,
  NDE_ED_SOURCES,
  NDE_ED_TOTAL_MINUTES,
  NdeEdCourse,
  NdeEdLesson,
  NdeEdText,
  courseAssessment,
  courseMinutes,
  getSource,
} from '../../data/ndeEd';
import { REVIEW_STAGE_LABEL, reviewFor, reviewSummary } from '../../data/ndeEd/review';
import {
  NdeEdProgressState,
  getCourseProgress,
  markExerciseRevealed,
  overallNdeEdProgress,
  readNdeEdProgress,
  recordFinalScore,
  recordNdeEdQuiz,
  resetNdeEdProgress,
  toggleLessonComplete,
} from '../../utils/ndeEdProgress';
import { textOf } from '../../utils/edbLibrary';
import { getNdeEdLessonQuizPack } from '../../data/curriculumLessonQuizzes';
import { PostLessonQuizPanel } from './PostLessonQuizPanel';

interface NdeEdCourseCatalogProps {
  language: Language;
  initialCourseId?: string;
  onOpenCurriculum?: (disciplineId: string, levelId?: string, moduleId?: string) => void;
  onOpenTextbook?: (bookId: string, pageNumber: number) => void;
  onOpenLab?: (labId: string) => void;
  onOpenEdb?: (courseId: string) => void;
  onOpenLeaderboard?: () => void;
}

const LEVEL_LABEL: Record<string, NdeEdText> = {
  foundation: { ar: 'تأسيسي', en: 'Foundation' },
  level1: { ar: 'Level 1', en: 'Level 1' },
  level2: { ar: 'Level 2', en: 'Level 2' },
  level3: { ar: 'Level 3', en: 'Level 3' },
};

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ');

function disciplineName(id: string, language: Language): string {
  const discipline = ENGINEERING_DISCIPLINES.find(item => item.id === id);
  if (discipline) return language === 'ar' ? discipline.titleAr : discipline.titleEn;
  return id;
}

const SourceLink: React.FC<{ sourceId: string; language: Language; compact?: boolean }> = ({ sourceId, language, compact }) => {
  const isAr = language === 'ar';
  const source = getSource(sourceId);
  if (!source) return null;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-start gap-2 rounded-xl border border-[#2a335c] bg-[#0b0d1e] p-3 transition hover:border-amber-400/70 ${compact ? 'text-[11px]' : 'text-xs'}`}
    >
      <ExternalLink className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block font-bold text-amber-300">{source.publisher}</span>
        <span dir="ltr" className="block text-slate-200 mt-0.5">{source.title}</span>
        {!compact && <span className="block text-[10px] text-slate-400 mt-1 leading-5">{textOf(source.covers, language)}{source.historical ? (isAr ? ' • مرجع تاريخي' : ' • historical') : ''}</span>}
      </span>
    </a>
  );
};

const ProgressBar: React.FC<{ percent: number; accent: string; label: string }> = ({ percent, accent, label }) => (
  <div>
    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
      <span>{label}</span>
      <span className="font-mono">{percent}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: accent }} />
    </div>
  </div>
);

const CourseCard: React.FC<{
  course: NdeEdCourse;
  language: Language;
  state: NdeEdProgressState;
  onOpen: () => void;
  onOpenEdb?: () => void;
}> = ({ course, language, state, onOpen, onOpenEdb }) => {
  const isAr = language === 'ar';
  const progress = getCourseProgress(course.id, state);
  return (
    <article className="group rounded-2xl border border-[#29315b] bg-[#10132b] p-4 flex flex-col gap-3 hover:border-amber-400/60 transition">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: `${course.accent}22`, color: course.accent, border: `1px solid ${course.accent}55` }}>
          {course.code} • {textOf(LEVEL_LABEL[course.level], language)}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{course.lessons.length} {isAr ? 'دروس' : 'lessons'}</span>
      </div>
      <div>
        <h3 className="text-lg font-black text-white leading-snug">{textOf(course.title, language)}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-6">{textOf(course.subtitle, language)}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-300">
        <span className="rounded border border-[#303961] px-2 py-1 flex items-center gap-1"><Clock className="w-3 h-3" />{courseMinutes(course)} {isAr ? 'دقيقة' : 'min'}</span>
        <span className="rounded border border-[#303961] px-2 py-1 flex items-center gap-1"><FileText className="w-3 h-3" />{new Set(course.lessons.flatMap(lesson => lesson.sources)).size} {isAr ? 'مصادر' : 'sources'}</span>
        <span className="rounded border border-[#303961] px-2 py-1">{disciplineName(course.disciplineId, language)}</span>
      </div>
      <ProgressBar percent={progress.percent} accent={course.accent} label={isAr ? `أكملت ${progress.completed}/${progress.total}` : `${progress.completed}/${progress.total} completed`} />
      <div className="flex gap-2 mt-auto">
        <button type="button" onClick={onOpen} className="flex-1 rounded-lg px-3 py-2 text-xs font-black text-slate-950 flex items-center justify-center gap-1" style={{ backgroundColor: course.accent }}>
          {progress.completed > 0 ? (isAr ? 'تابع المقرر' : 'Continue') : (isAr ? 'ابدأ المقرر' : 'Start course')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        {onOpenEdb && (
          <button type="button" onClick={onOpenEdb} className="rounded-lg border border-[#343d65] px-2.5 py-2 text-[10px] text-slate-300 hover:border-amber-400" title={isAr ? 'نسخة EDB' : 'EDB edition'}>
            EDB
          </button>
        )}
      </div>
    </article>
  );
};

const LessonRow: React.FC<{
  lesson: NdeEdLesson;
  index: number;
  language: Language;
  completed: boolean;
  quizCorrect: boolean;
  onOpen: () => void;
}> = ({ lesson, index, language, completed, quizCorrect, onOpen }) => {
  const isAr = language === 'ar';
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-start gap-3 rounded-xl border border-[#29315b] bg-[#0b0d1e] p-3 text-start hover:border-amber-400/60 transition"
    >
      <span className="mt-0.5 shrink-0">
        {completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-label={isAr ? 'مكتمل' : 'Complete'} /> : <Circle className="w-5 h-5 text-slate-600" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="font-mono">{String(index + 1).padStart(2, '0')}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.minutes} {isAr ? 'دقيقة' : 'min'}</span>
          {quizCorrect && <span className="text-emerald-400">{isAr ? '• فحص الفهم صحيح' : '• check correct'}</span>}
        </span>
        <span className="block text-sm font-bold text-slate-100 mt-1">{textOf(lesson.title, language)}</span>
        <span className="block text-[11px] text-slate-400 mt-1 leading-5">{textOf(lesson.summary, language)}</span>
      </span>
      <ChevronRight className={`w-4 h-4 text-slate-500 shrink-0 mt-1 ${isAr ? 'rotate-180' : ''}`} />
    </button>
  );
};

const AssessmentView: React.FC<{
  course: NdeEdCourse;
  language: Language;
  state: NdeEdProgressState;
  onBack: () => void;
  onSaved: (state: NdeEdProgressState) => void;
}> = ({ course, language, state, onBack, onSaved }) => {
  const isAr = language === 'ar';
  const items = useMemo(() => courseAssessment(course), [course]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const previous = state.finalScores[course.id];

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  }, [course.id]);

  const submit = () => {
    const correct = items.filter(item => answers[item.lessonId] === item.quiz.answer).length;
    setScore(correct);
    setSubmitted(true);
    onSaved(recordFinalScore(course.id, correct, items.length));
  };

  const passed = submitted && score / items.length >= 0.8;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs text-amber-400 flex items-center gap-1">
        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isAr ? 'العودة إلى المقرر' : 'Back to course'}
      </button>
      <header className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-[#171c3c] to-[#0b0d1e] p-5">
        <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">{isAr ? 'فحص فهم شامل — ليس اختباراً رسمياً' : 'Course self-check — not a formal exam'}</div>
        <h2 className="text-2xl font-black text-white mt-2">{textOf(course.title, language)}</h2>
        <p className="text-sm text-slate-300 mt-2 leading-7">
          {isAr
            ? `يعرض هذا الفحص سؤالاً واحداً من كل درس (${items.length} سؤالاً). النجاح المقترح 80% لأغراض التعلم فقط، ولا يمنح شهادة أو أهلية أو صلاحية توقيع.`
            : `This self-check presents one question from each lesson (${items.length} questions). The suggested 80% pass mark is for learning only; it grants no certificate, qualification or signing authority.`}
        </p>
        {previous && (
          <p className="mt-2 text-xs text-emerald-300">{isAr ? 'أفضل/آخر نتيجة محفوظة: ' : 'Last saved result: '}{previous.score}/{previous.total} • {new Date(previous.answeredAt).toLocaleDateString()}</p>
        )}
      </header>

      {items.map((item, index) => {
        const selected = answers[item.lessonId];
        const question = item.quiz;
        return (
          <section key={item.lessonId} className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-500">{isAr ? 'الدرس' : 'Lesson'} {index + 1}: {textOf(item.lessonTitle, language)}</p>
              {submitted && <span className={`text-[10px] font-bold ${selected === question.answer ? 'text-emerald-400' : 'text-rose-400'}`}>{selected === question.answer ? (isAr ? 'صحيح' : 'Correct') : (isAr ? 'خطأ' : 'Incorrect')}</span>}
            </div>
            <p className="text-sm font-bold text-white leading-7">{textOf(question.question, language)}</p>
            <div role="radiogroup" aria-label={textOf(question.question, language)} className="grid sm:grid-cols-2 gap-2">
              {question.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  type="button"
                  role="radio"
                  aria-checked={selected === optionIndex}
                  disabled={submitted}
                  onClick={() => setAnswers(prev => ({ ...prev, [item.lessonId]: optionIndex }))}
                  className={`rounded-lg border px-3 py-2 text-start text-xs transition ${
                    submitted && optionIndex === question.answer
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                      : submitted && selected === optionIndex
                        ? 'border-rose-400 bg-rose-400/10 text-rose-100'
                        : selected === optionIndex
                          ? 'border-amber-400 bg-amber-400/10 text-white'
                          : 'border-[#29315b] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-bold text-amber-300 me-1">{String.fromCharCode(65 + optionIndex)}.</span>
                  {textOf(option, language)}
                </button>
              ))}
            </div>
            {submitted && (
              <p className="text-[11px] leading-6 text-slate-300">
                <span className="font-bold text-amber-300">{isAr ? 'التفسير: ' : 'Explanation: '}</span>
                {textOf(question.explanation, language)}
              </p>
            )}
          </section>
        );
      })}

      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={Object.keys(answers).length !== items.length}
          className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-40"
        >
          {isAr ? `تسليم الفحص (${Object.keys(answers).length}/${items.length})` : `Submit self-check (${Object.keys(answers).length}/${items.length})`}
        </button>
      ) : (
        <div role="status" className={`rounded-2xl border p-5 ${passed ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-amber-400/40 bg-amber-400/10'}`}>
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${passed ? 'text-emerald-300' : 'text-amber-300'}`} />
            <p className="text-lg font-black text-white">{isAr ? 'النتيجة: ' : 'Score: '}{score}/{items.length} ({Math.round(score / items.length * 100)}%)</p>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-6">
            {passed
              ? (isAr ? 'أكملت الفحص بثبات. هذه نتيجة تعلم ذاتي، وليست شهادة أو تصريحاً.' : 'You completed the self-check. This is a self-study result, not a certificate or authorisation.')
              : (isAr ? 'راجع الدروس المرتبطة وأعد المحاولة. الفحص أداة تعلم لا حكم كفاءة.' : 'Review the linked lessons and retry. The check is a learning aid, not a competence ruling.')}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={() => { setAnswers({}); setSubmitted(false); setScore(0); }} className="rounded-lg border border-[#343d65] px-3 py-2 text-xs text-slate-200 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
            <button type="button" onClick={onBack} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950">{isAr ? 'العودة إلى المقرر' : 'Back to course'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const NdeEdCourseCatalog: React.FC<NdeEdCourseCatalogProps> = ({
  language,
  initialCourseId,
  onOpenCurriculum,
  onOpenTextbook,
  onOpenLab,
  onOpenEdb,
  onOpenLeaderboard,
}) => {
  const isAr = language === 'ar';
  const [courseId, setCourseId] = useState<string | null>(initialCourseId || null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState(false);
  const [coverage, setCoverage] = useState(false);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'foundation' | 'level1' | 'level2'>('all');
  const [state, setState] = useState<NdeEdProgressState>(() => readNdeEdProgress());

  useEffect(() => {
    if (initialCourseId) setCourseId(initialCourseId);
  }, [initialCourseId]);

  const course = courseId ? NDE_ED_COURSES.find(item => item.id === courseId) : null;
  const lesson = course && lessonId ? course.lessons.find(item => item.id === lessonId) : null;
  const overall = overallNdeEdProgress(state);
  const reviewLabel = reviewSummary().label;

  const filteredCourses = useMemo(() => {
    const q = normalize(query.trim());
    return NDE_ED_COURSES.filter(item => {
      if (levelFilter !== 'all' && item.level !== levelFilter) return false;
      if (!q) return true;
      return normalize(`${item.title.ar} ${item.title.en} ${item.subtitle.ar} ${item.subtitle.en} ${item.code} ${item.description.ar} ${item.description.en}`).includes(q);
    });
  }, [levelFilter, query]);

  const update = (next: NdeEdProgressState) => setState(next);

  if (lesson) {
    return (
      <LessonPlayer
        lesson={lesson}
        course={course!}
        language={language}
        state={state}
        onState={update}
        onBack={() => { setLessonId(null); }}
        onNextLesson={(nextId) => setLessonId(nextId)}
        onOpenCurriculum={onOpenCurriculum}
        onOpenTextbook={onOpenTextbook}
        onOpenLab={onOpenLab}
        onOpenEdb={onOpenEdb ? () => onOpenEdb(course!.id) : undefined}
        onOpenLeaderboard={onOpenLeaderboard}
      />
    );
  }

  if (course && assessment) {
    return (
      <AssessmentView
        course={course}
        language={language}
        state={state}
        onBack={() => setAssessment(false)}
        onSaved={next => setState(next)}
      />
    );
  }

  if (course) {
    const progress = getCourseProgress(course.id, state);
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => { setCourseId(null); setAssessment(false); }} className="text-xs text-amber-400 flex items-center gap-1">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isAr ? 'كل المقررات' : 'All courses'}
          </button>
          <div className="flex gap-2">
            {onOpenEdb && (
              <button type="button" onClick={() => onOpenEdb(course.id)} className="rounded-lg border border-[#343d65] px-3 py-1.5 text-[11px] text-slate-200 hover:border-amber-400">
                {isAr ? 'نسخة EDB' : 'EDB edition'}
              </button>
            )}
            <button type="button" onClick={() => setAssessment(true)} className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-black text-slate-950">
              {isAr ? 'الفحص الشامل' : 'Final self-check'}
            </button>
          </div>
        </div>

        <header className="relative overflow-hidden rounded-3xl border p-5 sm:p-8" style={{ borderColor: `${course.accent}44`, background: `linear-gradient(135deg, ${course.accent}18 0%, #10132b 60%, #080a16 100%)` }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: `${course.accent}22`, color: course.accent }}>{course.code} • {textOf(LEVEL_LABEL[course.level], language)}</span>
            <span className="rounded-full border border-[#303961] px-3 py-1 text-[10px] text-slate-300">{disciplineName(course.disciplineId, language)}</span>
            <span className="rounded-full border border-[#303961] px-3 py-1 text-[10px] text-slate-300">{courseMinutes(course)} {isAr ? 'دقيقة دراسة مقترحة' : 'suggested minutes'}</span>
            {(() => {
              const review = reviewFor(course.id);
              if (!review) return null;
              const label = REVIEW_STAGE_LABEL[review.stage];
              const tone = review.stage === 'reviewed'
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                : review.stage === 'assigned'
                  ? 'border-sky-400/40 bg-sky-400/10 text-sky-300'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-300';
              return (
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${tone}`} title={review.technicalRole}>
                  {textOf(label, language)}
                </span>
              );
            })()}
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 leading-tight">{textOf(course.title, language)}</h2>
          <p className="text-sm text-slate-300 mt-2">{textOf(course.subtitle, language)}</p>
          <p className="text-sm text-slate-300 mt-4 max-w-4xl leading-7">{textOf(course.description, language)}</p>
          <div className="mt-4 max-w-md"><ProgressBar percent={progress.percent} accent={course.accent} label={isAr ? `أكملت ${progress.completed}/${progress.total} درساً` : `${progress.completed}/${progress.total} lessons completed`} /></div>
          {progress.finalScore && (
            <p className="mt-2 text-[11px] text-emerald-300">{isAr ? 'آخر فحص شامل: ' : 'Last self-check: '}{progress.finalScore.score}/{progress.finalScore.total}</p>
          )}
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-amber-400" />{isAr ? 'مخرجات التعلم' : 'Learning outcomes'}</h3>
              <ul className="space-y-2">
                {course.outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-slate-300 leading-6">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-1" aria-hidden="true" />
                    <span>{textOf(outcome, language)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2"><ListChecks className="w-4 h-4 text-amber-400" />{isAr ? 'الدروس' : 'Lessons'}</h3>
                <span className="text-[10px] text-slate-500">{progress.completed}/{progress.total}</span>
              </div>
              {course.lessons.map((item, index) => (
                <LessonRow
                  key={item.id}
                  lesson={item}
                  index={index}
                  language={language}
                  completed={state.completedLessons.includes(item.id)}
                  quizCorrect={Boolean(state.quizAnswers[item.id]?.correct)}
                  onOpen={() => setLessonId(item.id)}
                />
              ))}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
              <h3 className="text-sm font-black text-white mb-2">{isAr ? 'المتطلبات السابقة' : 'Prerequisites'}</h3>
              <p className="text-xs text-slate-300 leading-6">{textOf(course.prerequisites, language)}</p>
            </section>
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h3 className="text-sm font-black text-amber-200 flex items-center gap-2 mb-2"><ShieldAlert className="w-4 h-4" />{isAr ? 'حدود المقرر' : 'Course limits'}</h3>
              <p className="text-xs text-amber-100/90 leading-6">{textOf(course.limits, language)}</p>
            </section>
            <section className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
              <h3 className="text-sm font-black text-white mb-2">{isAr ? 'الأكواد المرتبطة' : 'Related standards'}</h3>
              <div className="flex flex-wrap gap-1.5" dir="ltr">
                {course.standards.map(code => <span key={code} className="rounded border border-[#303961] px-2 py-1 text-[10px] font-mono text-slate-300">{code}</span>)}
              </div>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-black text-white">{isAr ? 'صفحة المصدر الرئيسية' : 'Course source landing page'}</h3>
              <a href={course.sourceLanding} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-[#2a335c] bg-[#0b0d1e] p-3 text-xs text-slate-200 hover:border-amber-400/70">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span dir="ltr">nde-ed.org</span>
              </a>
              <p className="text-[10px] text-slate-500 leading-5">{textOf(NDE_ED_ATTRIBUTION.statement, language)}</p>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  if (coverage) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setCoverage(false)} className="text-xs text-amber-400 flex items-center gap-1">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isAr ? 'العودة إلى المقررات' : 'Back to courses'}
        </button>
        <header className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5">
          <h2 className="text-2xl font-black text-white">{isAr ? 'خريطة التغطية والحدود' : 'Coverage map and limits'}</h2>
          <p className="text-sm text-slate-300 mt-2 leading-7">
            {isAr
              ? 'تربط هذه الخريطة مقررات NDE-Ed بالمجالات الثمانية في الأكاديمية. التغطية تعني وجود دروس مرتبطة، وليست ادعاء اكتمال منهج أو تأهيل.'
              : 'This map links NDE-Ed courses to the eight academy disciplines. Coverage means lessons exist; it is not a claim of a complete syllabus or qualification.'}
          </p>
        </header>
        <div className="overflow-x-auto rounded-2xl border border-[#29315b]">
          <table className="w-full text-xs text-start">
            <thead className="bg-[#151a38] text-slate-300">
              <tr>
                <th className="p-3 text-start">{isAr ? 'المقرر' : 'Course'}</th>
                <th className="p-3 text-start">{isAr ? 'المجال' : 'Discipline'}</th>
                <th className="p-3 text-start">{isAr ? 'المستوى' : 'Level'}</th>
                <th className="p-3 text-start">{isAr ? 'الدروس' : 'Lessons'}</th>
                <th className="p-3 text-start">{isAr ? 'الدقائق' : 'Minutes'}</th>
                <th className="p-3 text-start">{isAr ? 'روابط المنهج' : 'Curriculum links'}</th>
              </tr>
            </thead>
            <tbody>
              {NDE_ED_COURSES.map(item => (
                <tr key={item.id} className="border-t border-[#29315b] text-slate-300">
                  <td className="p-3 font-bold text-white">{textOf(item.title, language)}</td>
                  <td className="p-3">{disciplineName(item.disciplineId, language)}</td>
                  <td className="p-3">{textOf(LEVEL_LABEL[item.level], language)}</td>
                  <td className="p-3 font-mono">{item.lessons.length}</td>
                  <td className="p-3 font-mono">{courseMinutes(item)}</td>
                  <td className="p-3 font-mono text-[10px]">{item.lessons.filter(lessonItem => lessonItem.curriculum).length}/{item.lessons.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-sm font-black text-amber-200 mb-2">{isAr ? 'ما لم يغطّه NDE-Ed بعد' : 'Not yet covered by NDE-Ed'}</h3>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-amber-100/90 leading-6 list-disc ps-5">
            {(isAr ? [
              'التقنيات المتقدمة FMC/TFM والموجات الموجهة والميكروويف والتصوير الحراري والانبعاث الصوتي.',
              'اللحام ومعادن PWHT وسبائك Cr-Mo/P91 والزحف والتعب.',
              'API 510/570/580/653، الدهانات والتآكل، سلامة الأصول والوصول بالحبال.',
              'الجودة ISO 9001/17020/17025 وإحصاء POD وتقييم الكفاءة.',
            ] : [
              'FMC/TFM, guided waves, microwave, thermography and acoustic emission.',
              'Welding, PWHT metallurgy, Cr-Mo/P91, creep and fatigue.',
              'API 510/570/580/653, coatings and corrosion, asset integrity and rope access.',
              'ISO 9001/17020/17025 quality, POD statistics and performance evaluation.',
            ]).map((item, index) => <li key={index}>{item}</li>)}
          </ul>
          <p className="text-[10px] text-amber-100/70 mt-3">
            {isAr ? 'nde-ed.org لا يضم وحدة VT منفصلة في فهرسه؛ استُخدمت صفحات الإبصار والتباين والإضاءة، وأُكملت هندسة الوصلات من المنهج الأصلي.' : 'nde-ed.org has no separate VT module in its index; its vision, contrast and lighting pages were used, with weld geometry added from INSCO’s own curriculum.'}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c2333] via-[#0b1028] to-[#060812] p-5 sm:p-8">
        <div className="absolute -top-20 -end-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            <GraduationCap className="w-4 h-4" /> NDE-ED.ORG • STRUCTURED COURSES
          </div>
          <h2 className="mt-4 text-2xl sm:text-4xl font-black text-white leading-tight">
            {isAr ? 'من قائمة موضوعات إلى مقرر: درس، تمرين، وفحص فهم' : 'From a topic list to a course: lesson, exercise, self-check'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {isAr
              ? `${NDE_ED_COURSES.length} مقررات و${NDE_ED_LESSONS.length} درساً أصلي الصياغة، مبنية على هيكل موضوعات nde-ed.org: أهداف قابلة للقياس، شرح، مثال محلول، تمرين، سؤال فهم، ومصادر قراءة. التقدم محلي ومنفصل عن المناهج وإفادة التعلم الذاتي.`
              : `${NDE_ED_COURSES.length} courses and ${NDE_ED_LESSONS.length} original lessons structured from nde-ed.org topics: measurable objectives, explanation, worked example, exercise, knowledge check and reading sources. Progress is local and separate from curricula and the self-study statement.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-200">
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{NDE_ED_COURSES.length} {isAr ? 'مقررات' : 'courses'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{NDE_ED_LESSONS.length} {isAr ? 'درساً' : 'lessons'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{NDE_ED_SOURCES.length} {isAr ? 'مصدر قراءة' : 'reading sources'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{Math.round(NDE_ED_TOTAL_MINUTES / 60)}h {isAr ? 'دراسة مقترحة' : 'suggested study'}</span>
            <span className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-emerald-300">{overall.completed}/{overall.total} {isAr ? 'درساً مكتملاً' : 'lessons complete'}</span>
            <span className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-1.5 text-amber-200">{textOf(reviewLabel, language)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setCoverage(true)} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950">{isAr ? 'خريطة التغطية' : 'Coverage map'}</button>
            <button type="button" onClick={() => { if (window.confirm(isAr ? 'مسح تقدم مقررات NDE-Ed المحلي؟' : 'Clear local NDE-Ed course progress?')) setState(resetNdeEdProgress()); }} className="rounded-lg border border-[#343d65] px-3 py-2 text-[11px] text-slate-300">{isAr ? 'مسح تقدمي المحلي' : 'Clear local progress'}</button>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-100 leading-6 flex gap-2">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <p>{textOf(NDE_ED_ATTRIBUTION.statement, language)} {isAr ? 'تاريخ البحث التحريري: ' : 'Editorial review date: '}{NDE_ED_EDITORIAL_DATE}.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">{isAr ? 'ابحث في المقررات' : 'Search courses'}</span>
          <Search className="absolute top-3 start-3 w-4 h-4 text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={isAr ? 'ابحث عن مقرر أو موضوع…' : 'Search a course or topic…'} className="w-full rounded-xl border border-[#29315b] bg-[#0b0d1e] py-2.5 ps-9 pe-3 text-sm text-white" />
        </label>
        {(['all', 'foundation', 'level1', 'level2'] as const).map(level => (
          <button key={level} type="button" onClick={() => setLevelFilter(level)} aria-pressed={levelFilter === level} className={`rounded-lg px-3 py-2 text-xs font-bold ${levelFilter === level ? 'bg-cyan-400 text-slate-950' : 'bg-[#151a38] text-slate-200'}`}>
            {level === 'all' ? (isAr ? 'كل المستويات' : 'All levels') : textOf(LEVEL_LABEL[level], language)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map(item => (
          <CourseCard
            key={item.id}
            course={item}
            language={language}
            state={state}
            onOpen={() => { setCourseId(item.id); setLessonId(null); setAssessment(false); }}
            onOpenEdb={onOpenEdb ? () => onOpenEdb(item.id) : undefined}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#343d65] p-8 text-center text-sm text-slate-300">
          <p>{isAr ? 'لا توجد مقررات مطابقة.' : 'No matching courses.'}</p>
          <button type="button" onClick={() => { setQuery(''); setLevelFilter('all'); }} className="mt-3 text-amber-400 underline">{isAr ? 'إعادة الضبط' : 'Reset'}</button>
        </div>
      )}

      <section className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-300" />{isAr ? 'كيف بُني المحتوى؟' : 'How the content was built'}</h3>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-300 leading-6">
          <div className="rounded-xl border border-[#29315b] p-3"><span className="text-cyan-300 font-black">1.</span> {isAr ? 'هيكل الموضوعات من فهارس nde-ed.org لكل تقنية.' : 'Topic structure from nde-ed.org indexes per technique.'}</div>
          <div className="rounded-xl border border-[#29315b] p-3"><span className="text-cyan-300 font-black">2.</span> {isAr ? 'صياغة وأمثلة وتمارين أصلية، بلا نسخ نص المحاضرات أو الأكواد.' : 'Original wording, examples and exercises; no copied lecture text or codes.'}</div>
          <div className="rounded-xl border border-[#29315b] p-3"><span className="text-cyan-300 font-black">3.</span> {isAr ? 'مراجعة بشرية إلزامية قبل الاستخدام المهني؛ هذه نسخة تعلم ذاتي.' : 'Human review is required before professional use; this is a self-study edition.'}</div>
        </div>
      </section>
    </div>
  );
};

interface LessonPlayerProps {
  lesson: NdeEdLesson;
  course: NdeEdCourse;
  language: Language;
  state: NdeEdProgressState;
  onState: (state: NdeEdProgressState) => void;
  onBack: () => void;
  onNextLesson: (lessonId: string) => void;
  onOpenCurriculum?: (disciplineId: string, levelId?: string, moduleId?: string) => void;
  onOpenTextbook?: (bookId: string, pageNumber: number) => void;
  onOpenLab?: (labId: string) => void;
  onOpenEdb?: () => void;
  onOpenLeaderboard?: () => void;
}

const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  course,
  language,
  state,
  onState,
  onBack,
  onNextLesson,
  onOpenCurriculum,
  onOpenTextbook,
  onOpenLab,
  onOpenEdb,
  onOpenLeaderboard,
}) => {
  const isAr = language === 'ar';
  const saved = state.quizAnswers[lesson.id];
  const [selected, setSelected] = useState<number | undefined>(saved?.selected);
  const [checked, setChecked] = useState(Boolean(saved));
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(state.exercisesRevealed.includes(lesson.id));
  const index = course.lessons.findIndex(item => item.id === lesson.id);
  const next = course.lessons[index + 1];
  const previous = course.lessons[index - 1];
  const complete = state.completedLessons.includes(lesson.id);

  useEffect(() => {
    const record = state.quizAnswers[lesson.id];
    setSelected(record?.selected);
    setChecked(Boolean(record));
    setShowHint(false);
    setShowAnswer(state.exercisesRevealed.includes(lesson.id));
  }, [lesson.id, state.exercisesRevealed, state.quizAnswers]);

  const checkAnswer = () => {
    if (selected === undefined) return;
    const correct = selected === lesson.quiz.answer;
    setChecked(true);
    onState(recordNdeEdQuiz(lesson.id, selected, correct));
  };

  const revealAnswer = () => {
    setShowAnswer(true);
    onState(markExerciseRevealed(lesson.id));
  };

  const toggleComplete = () => onState(toggleLessonComplete(lesson.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="text-xs text-amber-400 flex items-center gap-1">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isAr ? 'العودة إلى المقرر' : 'Back to course'}
        </button>
        <div className="flex gap-1.5">
          {onOpenEdb && <button type="button" onClick={onOpenEdb} className="rounded-lg border border-[#343d65] px-2.5 py-1.5 text-[10px] text-slate-300">EDB</button>}
          <button type="button" onClick={toggleComplete} aria-pressed={complete} className={`rounded-lg px-3 py-1.5 text-[10px] font-black ${complete ? 'bg-emerald-400 text-slate-950' : 'border border-[#343d65] text-slate-200'}`}>
            {complete ? (isAr ? 'مكتمل ✓' : 'Complete ✓') : (isAr ? 'أكملت الدرس' : 'Mark complete')}
          </button>
        </div>
      </div>

      <header className="rounded-3xl border p-5 sm:p-7" style={{ borderColor: `${course.accent}44`, background: `linear-gradient(135deg, ${course.accent}16 0%, #10132b 65%, #080a16 100%)` }}>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
          <span className="rounded-full px-2 py-1" style={{ backgroundColor: `${course.accent}22`, color: course.accent }}>{course.code}</span>
          <span>{isAr ? 'الدرس' : 'Lesson'} {index + 1} / {course.lessons.length}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.minutes} {isAr ? 'دقيقة' : 'min'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">{textOf(lesson.title, language)}</h2>
        <p className="text-sm text-slate-300 mt-2 leading-7">{textOf(lesson.summary, language)}</p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2">
          {lesson.objectives.map((objective, objectiveIndex) => (
            <li key={objectiveIndex} className="flex items-start gap-2 rounded-lg border border-[#29315b] bg-black/20 px-3 py-2 text-[11px] text-slate-300 leading-5">
              <Target className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />{textOf(objective, language)}
            </li>
          ))}
        </ul>
      </header>

      <article className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-7 space-y-5">
        {lesson.sections.map((section, sectionIndex) => (
          <section key={sectionIndex}>
            <h3 className="text-sm font-black text-amber-300 mb-2">{textOf(section.heading, language)}</h3>
            <p className="text-sm sm:text-[15px] leading-8 text-slate-200" dir={isAr ? 'rtl' : 'ltr'}>{textOf(section.body, language)}</p>
          </section>
        ))}
      </article>

      <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-5">
        <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4" />{isAr ? 'مثال محلول' : 'Worked example'}</h3>
        <p className="text-sm font-bold text-white leading-7">{textOf(lesson.workedExample.prompt, language)}</p>
        <p className="mt-2 text-sm text-slate-200 leading-8">{textOf(lesson.workedExample.solution, language)}</p>
      </section>

      <section className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-5 space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><ListChecks className="w-4 h-4 text-amber-400" />{isAr ? 'تمرين' : 'Exercise'}</h3>
        <p className="text-sm text-slate-200 leading-7">{textOf(lesson.exercise.prompt, language)}</p>
        {!showHint ? (
          <button type="button" onClick={() => setShowHint(true)} className="text-xs text-amber-400 underline">{isAr ? 'أظهر تلميحاً' : 'Show a hint'}</button>
        ) : (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100 leading-6">{textOf(lesson.exercise.hint, language)}</p>
        )}
        {showAnswer ? (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-300 mb-1">{isAr ? 'الإجابة النموذجية' : 'Model answer'}</p>
            <p className="text-xs text-emerald-50 leading-6">{textOf(lesson.exercise.answer, language)}</p>
          </div>
        ) : (
          <button type="button" onClick={revealAnswer} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950">{isAr ? 'أظهر الإجابة بعد المحاولة' : 'Reveal answer after attempting'}</button>
        )}
      </section>

      <section className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" />{isAr ? 'فحص الفهم' : 'Knowledge check'}</h3>
        <p className="text-sm font-bold text-white leading-7">{textOf(lesson.quiz.question, language)}</p>
        <div role="radiogroup" aria-label={textOf(lesson.quiz.question, language)} className="grid sm:grid-cols-2 gap-2">
          {lesson.quiz.options.map((option, optionIndex) => {
            const isSelected = selected === optionIndex;
            const showCorrect = checked && optionIndex === lesson.quiz.answer;
            const showWrong = checked && isSelected && optionIndex !== lesson.quiz.answer;
            return (
              <button
                key={optionIndex}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={checked}
                onClick={() => setSelected(optionIndex)}
                className={`rounded-lg border px-3 py-2 text-start text-xs transition ${
                  showCorrect ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100' : showWrong ? 'border-rose-400 bg-rose-400/10 text-rose-100' : isSelected ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-[#29315b] text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="font-bold text-amber-300 me-1">{String.fromCharCode(65 + optionIndex)}.</span>
                {textOf(option, language)}
              </button>
            );
          })}
        </div>
        {!checked ? (
          <button type="button" disabled={selected === undefined} onClick={checkAnswer} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-40">{isAr ? 'تحقق من الإجابة' : 'Check answer'}</button>
        ) : (
          <div role="status" className="space-y-2">
            <p className={`text-xs font-bold ${saved?.correct ? 'text-emerald-300' : 'text-amber-300'}`}>{saved?.correct ? (isAr ? 'إجابة صحيحة' : 'Correct') : (isAr ? 'راجع الفكرة وحاول مرة أخرى' : 'Review the idea and try again')}</p>
            <p className="text-xs text-slate-300 leading-6">{textOf(lesson.quiz.explanation, language)}</p>
            <button type="button" onClick={() => { setChecked(false); setSelected(undefined); }} className="text-xs text-amber-400 underline">{isAr ? 'إعادة المحاولة' : 'Try again'}</button>
          </div>
        )}
      </section>

      <PostLessonQuizPanel
        pack={getNdeEdLessonQuizPack(course, lesson)}
        language={language}
        defaultCollapsed={true}
        onOpenLeaderboard={onOpenLeaderboard}
      />

      <section className="space-y-2">
        <h3 className="text-sm font-black text-white">{isAr ? 'قراءة داعمة' : 'Supporting reading'}</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {lesson.sources.map(sourceId => <SourceLink key={sourceId} sourceId={sourceId} language={language} />)}
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {lesson.curriculum && onOpenCurriculum && (
          <button type="button" onClick={() => onOpenCurriculum(lesson.curriculum!.disciplineId, lesson.curriculum!.levelId, lesson.curriculum!.moduleId)} className="rounded-lg border border-[#343d65] px-3 py-2 text-xs text-slate-200 flex items-center gap-1"><GraduationCap className="w-4 h-4" />{isAr ? 'فتح المنهج المرتبط' : 'Open related curriculum'}</button>
        )}
        {lesson.textbook && onOpenTextbook && (
          <button type="button" onClick={() => onOpenTextbook(lesson.textbook!.bookId, lesson.textbook!.pageNumber)} className="rounded-lg border border-[#343d65] px-3 py-2 text-xs text-slate-200 flex items-center gap-1"><BookOpen className="w-4 h-4" />{isAr ? 'صفحة الكتاب' : 'Textbook page'}</button>
        )}
        {lesson.labId && onOpenLab && (
          <button type="button" onClick={() => onOpenLab(lesson.labId!)} className="rounded-lg border border-[#343d65] px-3 py-2 text-xs text-slate-200 flex items-center gap-1"><FlaskConical className="w-4 h-4" />{isAr ? 'المعمل الافتراضي' : 'Virtual lab'}</button>
        )}
      </section>

      <div className="flex items-center justify-between gap-3 border-t border-[#29315b] pt-4">
        {previous ? (
          <button type="button" onClick={() => onNextLesson(previous.id)} className="text-xs text-slate-300 flex items-center gap-1">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isAr ? 'الدرس السابق' : 'Previous lesson'}
          </button>
        ) : <span />}
        {next ? (
          <button type="button" onClick={() => onNextLesson(next.id)} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 flex items-center gap-1">
            {isAr ? 'الدرس التالي' : 'Next lesson'}{isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        ) : (
          <button type="button" onClick={onBack} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950">{isAr ? 'إلى قائمة الدروس' : 'Back to lessons'}</button>
        )}
      </div>
    </div>
  );
};
