import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Download,
  GraduationCap,
  Info,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { KNOWLEDGE_LESSONS } from '../../data/academyKnowledge';
import { NDE_ED_LESSONS } from '../../data/ndeEd';
import { getCompletedModules, getCompletedTopics, getQuizResults } from '../../utils/curriculumProgress';
import { overallNdeEdProgress, readNdeEdProgress } from '../../utils/ndeEdProgress';
import { readEdbProgress } from '../../utils/edbLibrary';

interface CurriculumCertificatesViewProps {
  language: Language;
  onLaunchQuiz?: (disciplineId: string) => void;
  onOpenCertificationCenter?: () => void;
}

const NAME_KEY = 'insco_self_study_name_v1';

interface Badge {
  id: string;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  unlocked: boolean;
}

export const CurriculumCertificatesView: React.FC<CurriculumCertificatesViewProps> = ({
  language,
  onLaunchQuiz,
  onOpenCertificationCenter,
}) => {
  const isAr = language === 'ar';
  const [name, setName] = useState(() => {
    try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
  });
  const [saved, setSaved] = useState(false);

  const data = useMemo(() => {
    let modulesCompleted = 0;
    let modulesTotal = 0;
    ENGINEERING_DISCIPLINES.forEach(discipline => {
      discipline.levels.forEach(level => {
        modulesTotal += level.modules.length;
      });
    });
    const completedModules = getCompletedModules();
    modulesCompleted = Object.values(completedModules).filter(Boolean).length;

    const topics = getCompletedTopics();
    // The topic map is user-writable; count only entries that really are arrays.
    const topicsCompleted = Object.values(topics).reduce(
      (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
      0
    );

    let knowledgeRead = 0;
    try {
      const raw = JSON.parse(localStorage.getItem('insco_knowledge_read_v1') || '[]');
      if (Array.isArray(raw)) knowledgeRead = raw.filter(id => typeof id === 'string' && KNOWLEDGE_LESSONS.some(lesson => lesson.id === id)).length;
    } catch {
      knowledgeRead = 0;
    }

    const ndeEdState = readNdeEdProgress();
    const ndeEd = overallNdeEdProgress(ndeEdState);
    const edb = readEdbProgress();
    const edbPages = Object.values(edb).reduce((sum, item) => sum + item.readPages.length, 0);
    const edbBooksStarted = Object.values(edb).filter(item => item.readPages.length > 0).length;

    const quizResults = getQuizResults();
    const scores = Object.values(quizResults).map(result => result.score).filter(score => Number.isFinite(score));
    const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    const totalActivities = modulesCompleted + knowledgeRead + ndeEd.completed + edbPages;
    return {
      modulesCompleted,
      modulesTotal,
      topicsCompleted,
      knowledgeRead,
      ndeEd,
      edbPages,
      edbBooksStarted,
      quizCount: scores.length,
      averageScore,
      totalActivities,
    };
  }, []);

  const badges: Badge[] = [
    {
      id: 'first-step',
      labelAr: 'خطوة أولى',
      labelEn: 'First step',
      descAr: 'أنهيت أول نشاط تعلم محلي.',
      descEn: 'Completed your first local learning activity.',
      unlocked: data.totalActivities >= 1,
    },
    {
      id: 'reading-path',
      labelAr: 'قارئ منهجي',
      labelEn: 'Structured reader',
      descAr: `قرأت ${data.knowledgeRead}/${KNOWLEDGE_LESSONS.length} درساً تأسيسياً.`,
      descEn: `Read ${data.knowledgeRead}/${KNOWLEDGE_LESSONS.length} foundation lessons.`,
      unlocked: data.knowledgeRead >= 10,
    },
    {
      id: 'nde-ed',
      labelAr: 'باني الأساس',
      labelEn: 'Foundation builder',
      descAr: `أكملت ${data.ndeEd.completed}/${NDE_ED_LESSONS.length} درساً في مقررات NDE-Ed.`,
      descEn: `Completed ${data.ndeEd.completed}/${NDE_ED_LESSONS.length} NDE-Ed lessons.`,
      unlocked: data.ndeEd.completed >= 10,
    },
    {
      id: 'curriculum',
      labelAr: 'متتبع المنهج',
      labelEn: 'Curriculum tracker',
      descAr: `أكملت ${data.modulesCompleted}/${data.modulesTotal} وحدة منهج.`,
      descEn: `Completed ${data.modulesCompleted}/${data.modulesTotal} curriculum modules.`,
      unlocked: data.modulesCompleted >= 3,
    },
    {
      id: 'edb',
      labelAr: 'قارئ EDB',
      labelEn: 'EDB reader',
      descAr: `قرأت ${data.edbPages} صفحة من كتب EDB.`,
      descEn: `Read ${data.edbPages} EDB pages.`,
      unlocked: data.edbPages >= 25,
    },
    {
      id: 'assessments',
      labelAr: 'ممارس الفحص الذاتي',
      labelEn: 'Self-check practitioner',
      descAr: `أكملت ${data.quizCount} اختباراً محلياً بمتوسط ${data.averageScore}%.`,
      descEn: `Completed ${data.quizCount} local quizzes at an average of ${data.averageScore}%.`,
      unlocked: data.quizCount >= 3,
    },
  ];

  const displayName = name.trim() || (isAr ? 'متعلم/ة على هذه المنصة' : 'Learner on this platform');
  const today = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  const statementText = isAr
    ? `إفادة تعلم ذاتي غير معتمدة
الاسم المسجل محلياً: ${displayName}
التاريخ: ${today}

سجل التعلم المحلي في هذا المتصفح:
- دروس المكتبة التأسيسية: ${data.knowledgeRead} من ${KNOWLEDGE_LESSONS.length}
- دروس مقررات NDE-Ed: ${data.ndeEd.completed} من ${NDE_ED_LESSONS.length}
- وحدات المنهج المكتملة: ${data.modulesCompleted} من ${data.modulesTotal}
- موضوعات المنهج المكتملة: ${data.topicsCompleted}
- صفحات EDB المقروءة: ${data.edbPages} من ${data.edbBooksStarted} كتب بدأت
- الاختبارات المحلية: ${data.quizCount} بمتوسط ${data.averageScore}%

تنبيه:
هذه إفادة تعلم ذاتي غير معتمدة، وليست شهادة أو ترخيصاً أو تصريح صلاحية. لا تصدر عن ASNT أو ISO أو أي جهة اعتماد، ولا تعني التحقق من الهوية أو إتمام تدريب عملي أو اجتياز امتحان رسمي. السجل محلي في هذا المتصفح وقد يُفقد عند مسح البيانات، ولا يُستخدم كسجل ساعات تدريب أو خبرة.
`
    : `Self-study learning statement — NOT ACCREDITED
Locally recorded name: ${displayName}
Date: ${today}

Local learning record in this browser:
- Foundation library lessons: ${data.knowledgeRead} of ${KNOWLEDGE_LESSONS.length}
- NDE-Ed course lessons: ${data.ndeEd.completed} of ${NDE_ED_LESSONS.length}
- Curriculum modules completed: ${data.modulesCompleted} of ${data.modulesTotal}
- Curriculum topics completed: ${data.topicsCompleted}
- EDB pages read: ${data.edbPages} across ${data.edbBooksStarted} started books
- Local quizzes: ${data.quizCount} at an average of ${data.averageScore}%

Notice:
This is a non-accredited self-study statement, not a certificate, licence or authorisation. It is not issued by ASNT, ISO or any accrediting body and does not verify identity, practical training or a formal examination. The record is local to this browser, may be lost when data is cleared, and must not be used as a training-hours or experience record.
`;

  const saveName = (value: string) => {
    setName(value);
    setSaved(false);
    try { localStorage.setItem(NAME_KEY, value); } catch { /* local only */ }
  };

  const download = () => {
    try {
      const blob = new Blob([statementText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `insco-self-study-statement-${new Date().toISOString().slice(0, 10)}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
      <header className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-[#171c3c] via-[#0d1028] to-[#060812] p-5 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
          <ShieldCheck className="w-4 h-4" /> {isAr ? 'إفادة تعلم ذاتي — غير معتمدة' : 'Self-study statement — non-accredited'}
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white">{isAr ? 'سجل تعلمك المحلي، بوضوح ودون ادعاء اعتماد' : 'Your local learning record, clear and without accreditation claims'}</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          {isAr
            ? 'تعرض هذه الصفحة نشاطك التعليمي المسجل في هذا المتصفح: قراءة الدروس، إكمال وحدات المنهج، صفحات EDB، والاختبارات الذاتية. يمكنك طباعة إفادة أو تنزيلها للنفس، لكنها ليست شهادة ولا تمنح تأهيلاً.'
            : 'This page shows your learning activity stored in this browser: lesson reading, curriculum modules, EDB pages and self-checks. You may print or download a statement for your own records, but it is not a certificate and grants no qualification.'}
        </p>
      </header>

      <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 flex gap-3">
        <ShieldAlert className="w-6 h-6 text-rose-300 shrink-0 mt-0.5" />
        <div className="text-xs leading-6 text-rose-100/90">
          <p className="font-black text-rose-200">{isAr ? 'اقرأ هذا قبل الطباعة أو المشاركة' : 'Read before printing or sharing'}</p>
          <p className="mt-1">
            {isAr
              ? 'هذه إفادة تعلم ذاتي غير معتمدة. لا تصدر عن ASNT أو ISO أو أي جهة اعتماد، ولا تعني التحقق من الهوية أو إتمام تدريب عملي أو اجتياز امتحان رسمي. التسجيل محلي في المتصفح وقد يُفقد عند مسح البيانات. لا تستخدمها كسجل ساعات تدريب أو خبرة أو كدليل كفاءة.'
              : 'This is a non-accredited self-study statement. It is not issued by ASNT, ISO or any accrediting body and does not verify identity, practical training or a formal examination. The record is local to the browser and may be lost if data is cleared. Do not use it as a training-hours, experience or competence record.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-[#29315b] bg-[#10132b] p-5 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" />{isAr ? 'إفادة تعلم ذاتي غير معتمدة' : 'Self-study learning statement (non-accredited)'}</h3>
            <span className="rounded border border-[#303961] px-2 py-1 text-[10px] font-mono text-slate-400">{today}</span>
          </div>

          <label className="block">
            <span className="block text-[11px] font-bold text-slate-300 mb-1">{isAr ? 'الاسم كما تريد ظهوره (اختياري، محلي فقط)' : 'Name to display (optional, local only)'}</span>
            <input
              value={name}
              onChange={event => saveName(event.target.value)}
              placeholder={isAr ? 'اكتب اسمك…' : 'Type your name…'}
              className="w-full rounded-xl border border-[#29315b] bg-[#0b0d1e] px-3 py-2 text-sm text-white"
            />
            <span className="block text-[10px] text-slate-500 mt-1">{isAr ? 'لا يتم التحقق من الاسم ولا إرساله إلى خادم.' : 'The name is not verified and is not sent to a server.'}</span>
          </label>

          <div className="rounded-xl border border-[#303961] bg-[#0b0d1e] p-4 text-sm leading-8 text-slate-200">
            <p>{isAr ? 'تشير السجلات المحلية إلى أن ' : 'Local records indicate that '}<strong className="text-amber-300">{displayName}</strong>{isAr ? ' أنجز الأنشطة التالية:' : ' completed the following activities:'}</p>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <li className="rounded border border-[#29315b] px-3 py-2">{isAr ? 'دروس المكتبة التأسيسية: ' : 'Foundation lessons: '}<strong className="text-white">{data.knowledgeRead}/{KNOWLEDGE_LESSONS.length}</strong></li>
              <li className="rounded border border-[#29315b] px-3 py-2">{isAr ? 'دروس NDE-Ed: ' : 'NDE-Ed lessons: '}<strong className="text-white">{data.ndeEd.completed}/{NDE_ED_LESSONS.length}</strong></li>
              <li className="rounded border border-[#29315b] px-3 py-2">{isAr ? 'وحدات المنهج: ' : 'Curriculum modules: '}<strong className="text-white">{data.modulesCompleted}/{data.modulesTotal}</strong></li>
              <li className="rounded border border-[#29315b] px-3 py-2">{isAr ? 'صفحات EDB: ' : 'EDB pages: '}<strong className="text-white">{data.edbPages}</strong></li>
              <li className="rounded border border-[#29315b] px-3 py-2">{isAr ? 'اختبارات محلية: ' : 'Local quizzes: '}<strong className="text-white">{data.quizCount}</strong></li>
              <li className="rounded border border-[#29315b] px-3 py-2">{isAr ? 'متوسط النتائج: ' : 'Average score: '}<strong className="text-white">{data.averageScore}%</strong></li>
            </ul>
          </div>

          <p className="text-xs text-slate-400 leading-6">
            {isAr
              ? 'هذه الصفحة لا تصدر شهادة. للحصول على تأهيل NDT رسمي، راجع مركز اختبارات NDT وشروط الأهلية والجهة المانحة المعتمدة. قبول أي إفادة خارجياً يخضع لسياسة الجهة المستقبلة.'
              : 'This page does not issue a certificate. For formal NDT qualification, use the NDT examination centre, eligibility conditions and the recognised awarding body. External acceptance of any statement is at the receiving organisation’s discretion.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={download} className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 flex items-center gap-1.5"><Download className="w-4 h-4" />{isAr ? 'تنزيل الإفادة (نص)' : 'Download statement (text)'}</button>
            <button type="button" onClick={() => window.print()} className="rounded-lg border border-[#343d65] px-4 py-2 text-xs text-slate-200 flex items-center gap-1.5"><Printer className="w-4 h-4" />{isAr ? 'طباعة' : 'Print'}</button>
            {onOpenCertificationCenter && <button type="button" onClick={onOpenCertificationCenter} className="rounded-lg border border-amber-400/40 px-4 py-2 text-xs text-amber-200">{isAr ? 'مركز اختبارات NDT' : 'NDT examination centre'}</button>}
            {onLaunchQuiz && <button type="button" onClick={() => onLaunchQuiz('conventional_ndt')} className="rounded-lg border border-emerald-400/40 px-4 py-2 text-xs text-emerald-200">{isAr ? 'ابدأ اختباراً تجريبياً' : 'Start a mock quiz'}</button>}
          </div>
          {saved && <p role="status" className="text-[11px] text-emerald-300">{isAr ? 'تم تنزيل نسخة نصية. راجع محتواها قبل المشاركة.' : 'A text copy was downloaded. Review it before sharing.'}</p>}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4">
            <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" />{isAr ? 'أوسمة تعلم محلية' : 'Local learning badges'}</h3>
            <div className="space-y-2">
              {badges.map(badge => (
                <div key={badge.id} className={`flex items-start gap-2 rounded-xl border p-2.5 ${badge.unlocked ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-[#29315b] opacity-70'}`}>
                  {badge.unlocked ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-bold text-slate-100">{isAr ? badge.labelAr : badge.labelEn}</p>
                    <p className="text-[10px] text-slate-400 leading-5">{isAr ? badge.descAr : badge.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-slate-500 leading-5">{isAr ? 'أوسمة محلية للتحفيز فقط، وليست شهادات أو اعتمادات أو مؤهلات.' : 'Local motivational badges only; not certificates, accreditations or qualifications.'}</p>
          </section>

          <section className="rounded-2xl border border-[#29315b] bg-[#10132b] p-4 text-xs text-slate-300 leading-6">
            <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-sky-400" />{isAr ? 'أين سجلي؟' : 'Where is my record?'}</h3>
            <p>{isAr ? 'البيانات في localStorage فقط: قراءة الدروس، المنهج، مقررات NDE-Ed، صفحات EDB، والاختبارات. لا مزامنة سحابية ولا تحقق هوية.' : 'Data lives only in localStorage: lesson reading, curriculum, NDE-Ed courses, EDB pages and quizzes. No cloud sync or identity verification.'}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[9px] text-slate-500" dir="ltr">
              <span className="rounded border border-[#303961] px-1.5 py-0.5">insco_knowledge_read_v1</span>
              <span className="rounded border border-[#303961] px-1.5 py-0.5">insco_academy_completed_modules</span>
              <span className="rounded border border-[#303961] px-1.5 py-0.5">insco_nde_ed_progress_v1</span>
              <span className="rounded border border-[#303961] px-1.5 py-0.5">insco_edb_reading_v1</span>
            </div>
          </section>

          <section className="rounded-2xl border border-sky-400/30 bg-sky-400/5 p-4 text-[11px] leading-6 text-sky-100">
            <h3 className="text-sm font-black flex items-center gap-2 mb-2"><GraduationCap className="w-4 h-4" />{isAr ? 'الفرق بين الإفادة والاختبار' : 'Statement vs examination'}</h3>
            <p>{isAr ? 'مركز اختبارات NDT يعرض شروط الأهلية والاختبارات التجريبية ومعلومات التسجيل، لكنه لا يصدر اعتماداً نيابة عن ASNT/ISO. التأهيل الرسمي يتطلب جهة معترفاً بها وتدريباً واختباراً وتحققاً.' : 'The NDT examination centre presents eligibility, mock tests and registration information, but does not issue accreditation on behalf of ASNT/ISO. Formal qualification requires a recognised body, training, examination and verification.'}</p>
          </section>
        </aside>
      </div>

      <section className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 text-[11px] text-slate-400 leading-6 flex gap-2">
        <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>{isAr ? 'هذه الصفحة تمثل إعادة تسمية P1: «الشهادات» أصبحت «إفادة تعلم ذاتي غير معتمدة». أي قالب قديم يعرض كلمة «شهادة» يجب مراجعته قبل النشر.' : 'This page implements the P1 rename: “certificates” became “non-accredited self-study statement”. Any older template still using “certificate” must be reviewed before publishing.'}</p>
      </section>
    </div>
  );
};
