import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Search, ExternalLink, ShieldAlert, CheckCircle2, ArrowLeft, ArrowRight, Library } from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { ACADEMY_SOURCES, KNOWLEDGE_LESSONS } from '../../data/academyKnowledge';
import { ACADEMY_CASES } from '../../data/academyCases';
import { AcademyDevelopmentRoadmap } from './AcademyDevelopmentRoadmap';
import { getKnowledgeLessonQuizPack } from '../../data/curriculumLessonQuizzes';
import { PostLessonQuizPanel } from './PostLessonQuizPanel';

const STORAGE_KEY = 'insco_knowledge_read_v1';
const normalize = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
function readProgress(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? [...new Set(data.filter((id): id is string => typeof id === 'string' && KNOWLEDGE_LESSONS.some(l => l.id === id)))] : [];
  } catch { return []; }
}

export function AcademyKnowledgeLibrary({ language, onCurriculum, onOpenLeaderboard }: { language: Language; onCurriculum: (discipline: string) => void; onOpenLeaderboard?: () => void }) {
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'lessons' | 'sources' | 'roadmap' | 'cases'>('lessons');
  const [read, setRead] = useState(readProgress);
  const [storageWarning, setStorageWarning] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selected = KNOWLEDGE_LESSONS.find(l => l.id === selectedId);
  useEffect(() => {
    const sync = (e: StorageEvent) => { if (e.key === STORAGE_KEY || e.key === null) setRead(readProgress()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (selectedId) headingRef.current?.focus();
    setChoice(null); setSubmitted(false);
  }, [selectedId]);
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return KNOWLEDGE_LESSONS.filter(l => (discipline === 'all' || discipline === l.discipline) && (!q || normalize([
      l.title.ar, l.title.en, l.summary.ar, l.summary.en, ...l.sections.flatMap(s => [s.body.ar, s.body.en]),
    ].join(' ')).includes(q)));
  }, [query, discipline]);
  function toggleRead(id: string) {
    const next = read.includes(id) ? read.filter(item => item !== id) : [...read, id];
    setRead(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }
  const sources = selected ? ACADEMY_SOURCES.filter(s => selected.sources.includes(s.id)) : ACADEMY_SOURCES;
  const sourceCards = <div className="grid sm:grid-cols-2 gap-3">{sources.map(source => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#29315b] bg-[#0b0d1e] p-4 hover:border-amber-400 transition">
    <span className="text-amber-400 text-xs font-bold flex items-center justify-between">{source.publisher}<ExternalLink className="w-4 h-4" aria-hidden="true" /></span>
    <span dir="ltr" className="block text-slate-100 text-sm mt-2">{source.title}</span>
    <span className="block text-slate-400 text-xs mt-2">{source.kind[language]} • {isAr ? 'يفتح في نافذة جديدة' : 'Opens in a new tab'}</span>
  </a>)}</div>;
  return <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-6">
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#171c3c] to-[#0b0c1c] p-5 sm:p-8">
      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider"><Library className="w-4 h-4" /> INSCO • KNOWLEDGE LIBRARY</div>
      <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">{isAr ? 'افهم العلم. اربطه بالتطبيق.' : 'Understand the science. Connect it to practice.'}</h3>
      <p className="text-slate-300 mt-3 max-w-3xl leading-relaxed text-sm">{isAr ? 'مكتبة تأسيسية مكملة للمناهج: شرح أصلي ثنائي اللغة، أمثلة محلولة، أسئلة فهم ومراجع للقراءة. ابدأ بالسلامة والقياس، ثم انتقل إلى تخصصك. ليست بديلاً عن منهج تأهيل كامل.' : 'A foundational companion to the curricula: original bilingual notes, worked examples, knowledge checks and further reading. Start with safety and measurement, then follow your discipline. Not a complete qualification course.'}</p>
      <div className="flex flex-wrap gap-3 mt-5 text-xs text-slate-200">
        <span className="rounded-lg border border-[#303961] px-3 py-2">{KNOWLEDGE_LESSONS.length} {isAr ? 'درساً تأسيسياً' : 'foundation lessons'}</span>
        <span className="rounded-lg border border-[#303961] px-3 py-2">{ACADEMY_SOURCES.length} {isAr ? 'مرجعاً من جهات متخصصة' : 'specialist references'}</span>
        <span className="rounded-lg border border-[#303961] px-3 py-2">{read.length}/{KNOWLEDGE_LESSONS.length} {isAr ? 'تمت قراءتها' : 'read'}</span>
      </div>
      <div role="progressbar" aria-label={isAr ? 'تقدم القراءة' : 'Reading progress'} aria-valuenow={read.length} aria-valuemin={0} aria-valuemax={KNOWLEDGE_LESSONS.length} className="h-1.5 rounded bg-slate-800 mt-4 overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${read.length / KNOWLEDGE_LESSONS.length * 100}%` }} /></div>
      <p className="text-xs text-slate-400 mt-2">{isAr ? 'سجل القراءة منفصل عن تقدم المنهج؛ محفوظ في هذا المتصفح فقط، وليس سجلاً لساعات تدريب معتمدة.' : 'Reading progress is separate from curriculum progress; saved in this browser only, not a record of accredited training hours.'}</p>
      {storageWarning && <p role="status" className="text-amber-300 text-sm mt-2">{isAr ? 'تعذر الحفظ؛ التقدم متاح لهذه الجلسة فقط.' : 'Storage unavailable; progress is kept for this session only.'}</p>}
    </div>
    <div className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-100 leading-relaxed"><ShieldAlert className="w-5 h-5 shrink-0 mt-1" /><p>{isAr ? 'محتوى تعليمي غير معتمد مهنياً. لا تستخدم الأمثلة أو المحاكاة كإجراء تشغيل أو قرار قبول أو تصريح صلاحية خدمة. التدريب العملي والخبرة والاختبارات والإبصار والتفويض تخضع لنظام التأهيل والجهة المختصة. راجع نسخة الكود المرخصة وإصدار العقد؛ المراجع القديمة لا تحدد حدود التعرض الإشعاعي الحالية.' : 'Educational content, not professional certification. Examples and simulations are not operating procedures, acceptance decisions or fitness-for-service approval. Practical training, experience, exams, vision and authorisation follow the applicable scheme. Consult licensed contract-edition codes; older references do not establish current radiation exposure limits.'}</p></div>
    <div className="flex gap-2 flex-wrap">
      {(['lessons', 'sources'] as const).map(tab => <button key={tab} onClick={() => { setMode(tab); setSelectedId(null); }} aria-pressed={mode === tab} className={`px-4 py-2 rounded-lg font-bold text-sm ${mode === tab ? 'bg-amber-500 text-slate-950' : 'bg-[#151a38] text-slate-200'}`}>{tab === 'lessons' ? (isAr ? 'الدروس ومسار القراءة' : 'Lessons & reading path') : (isAr ? 'مكتبة المصادر' : 'Source library')}</button>)}
    <button onClick={() => { setMode('roadmap'); setSelectedId(null); }} aria-pressed={mode === 'roadmap'} className={`px-4 py-2 rounded-lg font-bold text-sm ${mode === 'roadmap' ? 'bg-amber-500 text-slate-950' : 'bg-[#151a38] text-slate-200'}`}>{isAr ? 'خطة تطوير الأكاديمية' : 'Development roadmap'}</button>
    </div>
    {mode === 'roadmap' ? <AcademyDevelopmentRoadmap language={language} onOpenLesson={(id: string) => { setSelectedId(id); setMode('lessons'); }} onOpenCases={() => setMode('cases')} /> : mode === 'cases' ? <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 space-y-3"><h4 className="text-white font-bold text-xl">{isAr ? 'دفتر الحالات' : 'Case workbook'}</h4><p className="text-slate-300 text-sm">{isAr ? 'الحالات المراجعة: ' : 'Cases reviewed: '}0/{ACADEMY_CASES.length}</p></div> : mode === 'sources' ? <div className="space-y-4"><h4 className="text-white font-bold text-xl">{isAr ? 'مصادر للقراءة والتوسع' : 'Further reading sources'}</h4><p className="text-sm text-slate-400">{isAr ? 'تاريخ البحث التحريري: 16 أكتوبر 2026. الروابط لا تعني شراكة أو اعتماداً للأكاديمية. الملخصات تعليمية وليست نقلاً لنصوص المواصفات؛ بعض الوثائق تتطلب شراءً أو تسجيلاً، وقد تتغير روابطها ومتطلباتها.' : 'Editorial research: 16 October 2026. Links do not imply partnership or academy accreditation. Notes are educational, not reproductions of standards; some documents require purchase or registration, and links or requirements can change.'}</p>{sourceCards}</div> : selected ? <article className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-8 space-y-6">
      <button onClick={() => setSelectedId(null)} className="text-amber-400 text-sm flex items-center gap-2">{isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isAr ? 'العودة إلى الدروس' : 'Back to lessons'}</button>
      <header><h4 ref={headingRef} tabIndex={-1} className="text-2xl font-black text-white outline-none">{selected.title[language]}</h4><p className="text-slate-400 text-sm mt-2">{isAr ? 'المتطلبات السابقة: ' : 'Prerequisites: '}{selected.prerequisites[language]}</p><p className="text-slate-400 text-xs mt-2">{isAr ? 'زمن دراسة مقترح يشمل التمرين: نحو ' : 'Suggested study time including practice: about '}{selected.minutes} {isAr ? 'دقائق' : 'minutes'}</p></header>
      {selected.sections.map((section, i) => <section key={i}><h5 className="text-amber-300 font-bold mb-2">{section.heading[language]}</h5><p className="text-slate-200 text-sm sm:text-base leading-loose whitespace-pre-line">{section.body[language]}</p></section>)}
      <section className="rounded-xl bg-[#0b0d1e] border-s-4 border-emerald-400 p-4"><h5 className="text-emerald-300 font-bold mb-2">{isAr ? 'مثال تطبيقي' : 'Worked example'}</h5><p className="text-slate-200 leading-loose text-sm">{selected.example[language]}</p></section>
      <form onSubmit={e => { e.preventDefault(); if (choice !== null) setSubmitted(true); }} className="bg-[#0b0d1e] rounded-xl p-4 space-y-3">
        <fieldset><legend className="text-white font-bold mb-3">{isAr ? 'اختبر فهمك: ' : 'Check your understanding: '}{selected.question[language]}</legend><div className="space-y-2">{selected.options.map((option, i) => <label key={i} className="flex items-start gap-3 border border-[#29315b] rounded-lg p-3 text-sm text-slate-200 cursor-pointer"><input type="radio" name={`check-${selected.id}`} value={i} checked={choice === i} disabled={submitted} onChange={() => setChoice(i)} className="mt-1 accent-amber-500" />{option[language]}</label>)}</div></fieldset>
        {!submitted ? <button type="submit" disabled={choice === null} className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg disabled:opacity-40">{isAr ? 'راجع الإجابة' : 'Check answer'}</button> : <div role="status" className="space-y-2"><p className={choice === selected.answer ? 'text-emerald-300' : 'text-amber-300'}>{choice === selected.answer ? (isAr ? 'إجابة صحيحة' : 'Correct') : (isAr ? 'راجع الفكرة وحاول مرة أخرى' : 'Review the concept and try again')}</p><p className="text-slate-300 text-sm leading-relaxed">{selected.explanation[language]}</p><p className="text-emerald-300 text-sm">{isAr ? 'الإجابة الصحيحة: ' : 'Correct answer: '}{selected.options[selected.answer][language]}</p><button type="button" onClick={() => { setChoice(null); setSubmitted(false); }} className="text-amber-400 underline text-sm">{isAr ? 'إعادة المحاولة' : 'Try again'}</button></div>}
      </form>
      <PostLessonQuizPanel pack={getKnowledgeLessonQuizPack(selected)} language={language} defaultCollapsed={true} onOpenLeaderboard={onOpenLeaderboard} />
      <section className="space-y-3"><h5 className="text-white font-bold">{isAr ? 'مراجع هذا الدرس للقراءة والتوسع' : 'Supporting reading for this lesson'}</h5>{sourceCards}</section>
      <div className="flex flex-wrap gap-3"><button aria-pressed={read.includes(selected.id)} onClick={() => toggleRead(selected.id)} className="bg-amber-500 text-slate-950 rounded-lg px-4 py-3 text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{read.includes(selected.id) ? (isAr ? 'إلغاء علامة القراءة' : 'Mark as unread') : (isAr ? 'قرأت وفهمت الدرس' : 'Mark as read')}</button><button onClick={() => onCurriculum(selected.discipline)} className="border border-[#343d65] text-slate-100 rounded-lg px-4 py-3 text-sm">{isAr ? 'فتح المنهج المرتبط' : 'Open related curriculum'}</button>{KNOWLEDGE_LESSONS.findIndex(l => l.id === selected.id) < KNOWLEDGE_LESSONS.length - 1 && <button onClick={() => setSelectedId(KNOWLEDGE_LESSONS[KNOWLEDGE_LESSONS.findIndex(l => l.id === selected.id) + 1].id)} className="text-amber-300 text-sm px-3">{isAr ? 'الدرس التالي ←' : 'Next lesson →'}</button>}</div>
    </article> : <>
      <div className="rounded-xl border border-[#29315b] bg-[#10132b] p-4"><h4 className="text-white font-bold mb-3">{isAr ? 'البداية المقترحة لكل متعلم' : 'Suggested starting sequence'}</h4><div className="flex gap-2 flex-wrap">{['safety', 'measurement', 'qualification', 'waves'].map((id, i) => <button key={id} onClick={() => setSelectedId(id)} className="rounded-lg bg-[#1c2344] px-3 py-2 text-amber-200 text-xs">{i + 1}. {KNOWLEDGE_LESSONS.find(l => l.id === id)!.title[language]}</button>)}</div></div>
      <div className="grid sm:grid-cols-[1fr_280px] gap-3"><label className="relative"><span className="sr-only">{isAr ? 'ابحث في الدروس' : 'Search lessons'}</span><Search className="absolute top-3 start-3 w-5 h-5 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={isAr ? 'ابحث عن موضوع، تقنية أو مصطلح…' : 'Search a topic, technique or term…'} className="w-full bg-[#0b0d1e] border border-[#29315b] rounded-xl py-3 ps-10 pe-3 text-white text-sm" /></label><label><span className="sr-only">{isAr ? 'تصفية حسب المسار' : 'Filter by discipline'}</span><select value={discipline} onChange={e => setDiscipline(e.target.value)} className="w-full bg-[#0b0d1e] border border-[#29315b] rounded-xl p-3 text-white text-sm"><option value="all">{isAr ? 'كل المسارات' : 'All disciplines'}</option>{ENGINEERING_DISCIPLINES.map(d => <option key={d.id} value={d.id}>{isAr ? d.titleAr : d.titleEn}</option>)}</select></label></div>
      <p role="status" className="text-slate-400 text-xs">{filtered.length} {isAr ? 'درساً مطابقاً' : 'matching lessons'}</p>
      {filtered.length === 0 ? <div className="rounded-xl border border-dashed border-[#343d65] p-8 text-center text-slate-300"><p>{isAr ? 'لا توجد نتائج. جرّب مصطلحاً آخر أو كل المسارات.' : 'No results. Try another term or all disciplines.'}</p><button onClick={() => { setQuery(''); setDiscipline('all'); }} className="text-amber-400 mt-3 underline">{isAr ? 'مسح البحث والفلاتر' : 'Clear search and filters'}</button></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((lesson) => <button key={lesson.id} onClick={() => setSelectedId(lesson.id)} className="text-start group rounded-2xl border border-[#29315b] bg-[#10132b] hover:border-amber-400 p-5 transition flex flex-col items-start gap-3"><div className="flex w-full justify-between items-center text-amber-400"><span className="font-mono text-xs">{String(KNOWLEDGE_LESSONS.indexOf(lesson) + 1).padStart(2, '0')} / FOUNDATION</span>{read.includes(lesson.id) ? <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-label={isAr ? 'تمت القراءة' : 'Read'} /> : <BookOpen className="w-5 h-5" />}</div><h4 className="font-bold text-white text-lg group-hover:text-amber-300">{lesson.title[language]}</h4><p className="text-slate-400 text-sm leading-relaxed">{lesson.summary[language]}</p><span className="text-xs text-slate-400 mt-auto">{lesson.minutes} {isAr ? 'دقائق دراسة مقترحة • شرح + مثال + سؤال' : 'suggested study minutes • notes + example + check'}</span></button>)}</div>}
    </>}
  </div>;
}
