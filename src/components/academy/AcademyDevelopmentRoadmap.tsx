import React from 'react';
import { ArrowRight, BookOpen, ClipboardCheck, Compass, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';
import { ACADEMY_ROADMAP, ROADMAP_STATES } from '../../data/academyRoadmap';
import { KNOWLEDGE_LESSONS, ACADEMY_SOURCES } from '../../data/academyKnowledge';
import { ACADEMY_SUBJECTS } from '../../data/academySubjects';
import { ACADEMY_CASES } from '../../data/academyCases';
export function AcademyDevelopmentRoadmap({ language, onOpenLesson, onOpenCases }: {
  language: Language; onOpenLesson: (id: string) => void; onOpenCases: () => void;
}) {
  const isAr = language === 'ar';
  const models = new Set(ACADEMY_SUBJECTS.flatMap(subject => subject.lab ? [subject.lab] : [])).size;
  const counters = [
    { id: 'lessons', value: KNOWLEDGE_LESSONS.length, label: isAr ? 'دروس تأسيسية' : 'Foundation lessons' },
    { id: 'subjects', value: ACADEMY_SUBJECTS.length, label: isAr ? 'خانات دراسة وموارد' : 'Subject & resource spaces' },
    { id: 'models', value: models, label: isAr ? 'نماذج علمية مشتركة' : 'Shared science models' },
    { id: 'cases', value: ACADEMY_CASES.length, label: isAr ? 'حالات تدريبية' : 'Practice cases' },
    { id: 'sources', value: ACADEMY_SOURCES.length, label: isAr ? 'مراجع للقراءة' : 'Reading references' },
  ];
  return <section dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'خريطة استكمال الأكاديمية' : 'Academy development roadmap'} className="space-y-6">
    <header className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#152c3a] to-[#10132b] p-5 sm:p-7 space-y-4">
      <div className="text-cyan-300 text-xs font-bold tracking-wider flex items-center gap-2"><Compass className="w-5 h-5" /> INSCO • DEVELOPMENT ROADMAP</div>
      <h4 className="text-white font-black text-2xl sm:text-3xl">{isAr ? 'إيه الموجود وإيه الخطوة الجاية؟' : 'What exists, and what comes next?'}</h4>
      <p className="text-slate-300 text-sm leading-loose max-w-4xl">{isAr ? 'هدفنا أكاديمية منظمة بعلوم ودروس وتجارب وتقييم واضح الحدود. الأرقام أدناه محسوبة من محتوى هذه النسخة، والخطة تميز المتاح عن المراجعة والعمل المستقبلي. ليست مؤشراً لاكتمال التأهيل أو تأكيداً بنشر تحديث معين.' : 'Our aim is a structured academy connecting science, lessons, experiments and clearly scoped assessment. Counts below come from this version’s content; the plan separates available material, review and future work. It does not indicate qualification completion or confirm a particular deployment.'}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{counters.map(counter => <div key={counter.id} className="rounded-xl border border-[#31445d] bg-[#0b1325] p-3"><dt className="text-slate-400 text-xs">{counter.label}</dt><dd data-testid={`roadmap-${counter.id}`} className="text-cyan-200 text-2xl font-black mt-2">{counter.value}</dd></div>)}</dl>
      <div className="flex flex-wrap gap-3"><button onClick={() => onOpenLesson('safety')} className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold bg-amber-400 text-slate-950"><BookOpen className="w-4 h-4" />{isAr ? 'ابدأ بالسلامة والأساسيات' : 'Start with safety & foundations'}</button><button onClick={onOpenCases} className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm border border-emerald-400/40 text-emerald-200"><ClipboardCheck className="w-4 h-4" />{isAr ? 'افتح دفتر الحالات' : 'Open the case workbook'}</button></div>
    </header>
    <p className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-amber-100 text-sm leading-relaxed flex items-start gap-3"><ShieldCheck className="w-5 h-5 shrink-0" /><span>{isAr ? 'المتاح حالياً تعليم ذاتي ومراجعة مفاهيم. اكتمال قراءة الدروس أو المحاكيات لا يمنح Level II/III أو شهادة API أو تصريح تشغيل. المراحل المخططة أدناه لا تُعرض كمحتوى منفذ.' : 'Current material supports self-study and concept review. Reading lessons or using models does not award Level II/III, API certification or operating authorisation. Planned stages below are not presented as completed content.'}</span></p>
    <ol className="space-y-4">{ACADEMY_ROADMAP.map((milestone, index) => <li key={milestone.id} className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3"><span className="rounded-lg bg-cyan-400/10 text-cyan-200 font-mono p-2">{String(index + 1).padStart(2, '0')}</span><h5 className="text-white font-bold text-lg flex-1">{milestone.title[language]}</h5><span className={`text-xs rounded-full border px-3 py-1.5 ${milestone.state === 'available' ? 'text-emerald-200 border-emerald-400/30 bg-emerald-400/10' : milestone.state === 'review' ? 'text-amber-200 border-amber-400/30 bg-amber-400/10' : 'text-slate-300 border-slate-600 bg-slate-500/10'}`}>{ROADMAP_STATES[milestone.state][language]}</span></div>
      <p className="text-slate-300 text-sm leading-relaxed">{milestone.goal[language]}</p>
      <ul className="grid md:grid-cols-3 gap-3">{milestone.deliverables.map((item, i) => <li key={i} className="bg-[#0a0e21] border border-[#202d48] rounded-lg p-3 text-slate-200 text-sm leading-relaxed flex items-start gap-2"><ArrowRight className={`w-4 h-4 shrink-0 mt-1 text-cyan-300 ${isAr ? 'rotate-180' : ''}`} />{item[language]}</li>)}</ul>
      <p className="text-xs text-slate-400 leading-loose"><strong className="text-slate-200">{isAr ? 'شرط الإنجاز وحدود المرحلة: ' : 'Completion criterion & scope: '}</strong>{milestone.acceptance[language]}</p>
      {milestone.dependsOn.length > 0 && <p className="text-xs text-cyan-200 leading-relaxed">{isAr ? 'يعتمد على: ' : 'Depends on: '}{milestone.dependsOn.map(id => ACADEMY_ROADMAP.find(item => item.id === id)!.title[language]).join(isAr ? '؛ ' : '; ')}</p>}
    </li>)}</ol>
    <p className="text-slate-400 text-xs leading-relaxed">{isAr ? 'الخطة قابلة للتحديث بعد المراجعة وتوفر المختصين والتراخيص والمعدات. لا توجد مواعيد إتمام أو شراكات اعتماد مُعلنة ضمن هذه الخريطة.' : 'The plan may change after review and according to specialist, licensing and equipment availability. No completion dates or accreditation partnerships are announced by this roadmap.'}</p>
  </section>;
}
