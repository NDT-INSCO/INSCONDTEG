import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Minimize2, Send, Sparkles, X } from 'lucide-react';
import type { Language } from '../../types';
import { fetchTutorStatus, streamTutor } from '../../ai/client';
import {
  failureMessage,
  TutorCitation,
  TutorFailure,
  TutorLanguage,
  TutorMessage,
  TutorMeta,
  TutorStatus,
} from '../../ai/contract';
import './VirtualEngineer.css';

type Props = { language: Language; route: string };

const suggestions = {
  ar: ['اشرح مبدأ UT', 'كيف أقرأ A-Scan؟', 'اشرح معايرة DAC'],
  en: ['Explain UT principles', 'How do I read an A-scan?', 'Explain DAC calibration'],
};

export const VirtualEngineer: React.FC<Props> = ({ language, route }) => {
  const isAr = language === 'ar';
  const tutorLanguage: TutorLanguage = isAr ? 'ar' : 'en';
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [citations, setCitations] = useState<TutorCitation[]>([]);
  const [failure, setFailure] = useState<TutorFailure | null>(null);
  const [answerMeta, setAnswerMeta] = useState<Pick<TutorMeta, 'kind' | 'source' | 'provider'> | null>(null);
  const history = useRef<TutorMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const answerRef = useRef('');

  useEffect(() => {
    if (!open || status) return;
    let active = true;
    void fetchTutorStatus().then(next => {
      if (active) setStatus(next);
    });
    return () => { active = false; };
  }, [open, status]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || loading) return;

    setQuestion('');
    setAnswer('');
    answerRef.current = '';
    setCitations([]);
    setFailure(null);
    setAnswerMeta(null);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const currentPage = typeof window === 'undefined'
      ? route
      : `${route} | ${window.location.hash || 'academy'}`;
    const contextualQuestion = isAr
      ? `سياق المتعلم الحالي داخل أكاديمية INSCO: ${currentPage}. أنت المهندس الافتراضي ومهمتك شرح NDT للتعلم. أجب عن سؤال المتعلم مع ربط الشرح بسياق الصفحة الحالية متى كان ذلك مناسباً. وضّح الافتراضات وحدود الإجابة، ولا تصدر قرار قبول/رفض تشغيلياً ولا تخترع مرجعاً.\n\nسؤال المتعلم: ${q}`
      : `Learner context in INSCO Academy: ${currentPage}. You are the virtual NDT learning engineer. Answer the learner's question and relate the explanation to the current page when relevant. State assumptions and limits; do not issue operational accept/reject decisions or invent references.\n\nLearner question: ${q}`;

    const messages: TutorMessage[] = [
      ...history.current.slice(-18),
      { role: 'user', content: contextualQuestion },
    ];
    const liveStatus = status ?? await fetchTutorStatus();
    setStatus(liveStatus);
    if (!liveStatus.configured && liveStatus.reason === 'unreachable') {
      setFailure({ code: 'not_configured', message: isAr ? 'خدمة المدرّس غير متاحة حالياً من هذا النشر.' : 'The tutor service is not reachable from this deployment.' });
      setLoading(false);
      return;
    }

    await streamTutor(
      { messages, language: tutorLanguage, mode: 'explain' },
      {
        signal: controller.signal,
        onMeta: meta => {
          setCitations(meta.citations);
          setAnswerMeta({ kind: meta.kind, source: meta.source, provider: meta.provider });
        },
        onDelta: chunk => {
          answerRef.current += chunk;
          setAnswer(previous => previous + chunk);
        },
        onError: next => setFailure(next),
        onDone: () => {
          if (answerRef.current.trim()) {
            history.current = [
              ...messages,
              { role: 'assistant', content: answerRef.current },
            ].slice(-20);
          }
          setLoading(false);
        },
      }
    );

    if (abortRef.current === controller) abortRef.current = null;
    setLoading(false);
  };

  const sourceLabel = (source: TutorMeta['source']) => {
    if (!source) return '';
    const labels = {
      ar: { reviewed: 'مصادر تعليمية مُراجَعة', academy: 'مكتبة الأكاديمية', private: 'مصادر خاصة', mixed: 'مصادر متعددة', none: 'دون مراجع مسترجعة' },
      en: { reviewed: 'Reviewed learning sources', academy: 'Academy library', private: 'Private sources', mixed: 'Mixed sources', none: 'No retrieved sources' },
    };
    return labels[isAr ? 'ar' : 'en'][source === 'private-drive' ? 'private' : source];
  };

  const handleClose = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setOpen(false);
  };

  return <div className="ve-root" dir={isAr ? 'rtl' : 'ltr'}>
    {open && <section className="ve-panel" aria-label={isAr ? 'المهندس الافتراضي' : 'Virtual Engineer'}>
      <header className="ve-header"><div className="ve-avatar"><Bot size={23}/></div><div className="ve-heading"><strong>INSCO Virtual Engineer</strong><small>{isAr ? 'مدرّب الأكاديمية · ' + route : 'Academy tutor · ' + route}</small></div>
        <button type="button" onClick={() => setExpanded(v => !v)} aria-label={isAr ? 'تصغير' : 'Minimize'}><Minimize2 size={17}/></button>
        <button type="button" onClick={handleClose} aria-label={isAr ? 'إغلاق' : 'Close'}><X size={18}/></button></header>
      {expanded && <div className="ve-body">
        <div className="ve-welcome"><Sparkles size={17}/><p>{isAr ? 'أهلاً بك! اسألني عن محتوى الدرس، وسأستخدم مدرس INSCO ومكتبته المتاحة للإجابة.' : 'Welcome! Ask about the lesson and I’ll use the INSCO tutor and its available library.'}</p></div>
        {status === null && <small className="ve-disclaimer">{isAr ? 'جارٍ التحقق من اتصال المدرّس…' : 'Checking tutor availability…'}</small>}
        {status && !status.configured && status.reason !== 'unreachable' && <small className="ve-disclaimer">{isAr ? 'الرد من مكتبة إنسكو التعليمية عند عدم توفر نموذج خارجي.' : 'The INSCO learning library may answer when no external model is configured.'}</small>}
        <div className="ve-chips">{suggestions[isAr ? 'ar' : 'en'].map(item => <button key={item} type="button" disabled={loading} onClick={() => void ask(item)}>{item}</button>)}</div>
        {answer && <div className="ve-answer"><strong>{isAr ? 'شرح المهندس' : 'Engineer explanation'}</strong><p>{answer}</p>
          {answerMeta?.source && <small className="ve-disclaimer">{sourceLabel(answerMeta.source)}{answerMeta.kind === 'library' ? (isAr ? ' · إجابة مستخرجة من المكتبة' : ' · library-composed answer') : ''}</small>}
          {citations.length > 0 && <div className="ve-citations"><strong>{isAr ? 'المراجع المستخدمة' : 'Sources used'}</strong>{citations.slice(0, 4).map((citation, index) => <span key={citation.id || index}>{citation.title[isAr ? 'ar' : 'en']}</span>)}</div>}
        </div>}
        {failure && <p className="ve-error" role="alert">{failureMessage(failure.code, tutorLanguage)}{failure.retryAfterSeconds ? ` (${failure.retryAfterSeconds}s)` : ''}</p>}
        {loading && !answer && <small className="ve-disclaimer">{isAr ? 'المدرّس بيبحث في المصادر وبيجهز الشرح…' : 'The tutor is retrieving sources and preparing an explanation…'}</small>}
        <form className="ve-input" onSubmit={e => { e.preventDefault(); void ask(question); }}><input value={question} onChange={e => setQuestion(e.target.value)} maxLength={4000} placeholder={isAr ? 'اكتب سؤالك هنا…' : 'Ask a question…'} aria-label={isAr ? 'سؤالك' : 'Your question'}/><button type="submit" disabled={!question.trim() || loading} aria-label={isAr ? 'إرسال' : 'Send'}><Send size={17}/></button></form>
        <small className="ve-disclaimer">{isAr ? 'للتعلّم فقط. لا تعتمد عليه في قرارات قبول/رفض الفحص؛ ارجع للإجراء والمراجع المعتمدة ومراجعة المختص.' : 'For learning only. Do not use it for inspection acceptance/rejection; follow the approved procedure, references and qualified review.'}</small>
      </div>}
    </section>}
    <button className="ve-launcher" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}><span className="ve-launcher-icon"><Bot size={25}/></span><span>{isAr ? 'المهندس الافتراضي' : 'Virtual Engineer'}</span><MessageCircle size={16}/></button>
  </div>;
};
