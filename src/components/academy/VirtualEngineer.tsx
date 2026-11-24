import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Minimize2, Send, Sparkles, X } from 'lucide-react';
import { VirtualEngineer3D } from './VirtualEngineer3D';
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

type Props = { language: Language; route: string; onOpenHash: (hash: string) => void };

const simulatorForQuestion = (question: string): string => {
  const q = question.toLowerCase();
  if (/paut|phased array|مصفوفة/.test(q)) return 'paut_controller';
  if (/dac|دك|منحنى/.test(q)) return 'dac_builder';
  if (/v1|v2|معاير/.test(q)) return 'v1_v2_calibration';
  if (/(^|[^a-z])rt([^a-z]|$)|radiograph|تصوير|أشعة/.test(q)) return 'rt_lab';
  if (/weld|لحام|(^|[^a-z])ut([^a-z]|$)|ultrasonic|موجات فوق/.test(q)) return 'weld_simulator';
  return 'sim_labs_rt';
};

const suggestions = {
  ar: ['اشرح مبدأ UT', 'كيف أقرأ A-Scan؟', 'اشرح معايرة DAC'],
  en: ['Explain UT principles', 'How do I read an A-scan?', 'Explain DAC calibration'],
};

export const VirtualEngineer: React.FC<Props> = ({ language, route, onOpenHash }) => {
  const isAr = language === 'ar';
  const tutorLanguage: TutorLanguage = isAr ? 'ar' : 'en';
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const lastQuestion = useRef('');
  const lessonTopic = useRef('');
  const [lessonFocus, setLessonFocus] = useState<'ascan' | 'dac' | 'ut'>('ascan');
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
    lastQuestion.current = q;
    if (!/كمّل من النقطة|continue from where/i.test(q)) lessonTopic.current = q;
    setSessionEnded(false);
    const normalizedQuestion = q.toLowerCase();
    setLessonFocus(/dac|calibrat|معاير/.test(normalizedQuestion) ? 'dac' : /principle|مبدأ|مبادئ/.test(normalizedQuestion) ? 'ut' : 'ascan');
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
              { role: 'assistant' as const, content: answerRef.current },
            ].slice(-20);
          }
          setLoading(false);
        },
      }
    );

    if (abortRef.current === controller) abortRef.current = null;
    setLoading(false);
  };

  const stopExplanation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (answerRef.current.trim()) {
      history.current = [
        ...history.current,
        { role: 'user' as const, content: lastQuestion.current },
        { role: 'assistant' as const, content: answerRef.current },
      ].slice(-20);
    }
    setLoading(false);
    setSessionEnded(true);
  };

  const continueExplanation = () => {
    void ask(isAr ? 'كمّل من النقطة التي انتهيت عندها، واشرح الجزء التالي فقط ثم انتظر اختياري.' : 'Continue from where you stopped. Explain only the next part, then wait for my choice.');
  };

  const showSimulator = () => {
    const tab = simulatorForQuestion(lessonTopic.current || lastQuestion.current);
    onOpenHash(`#${tab}`);
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
      <header className="ve-header"><div className="ve-avatar"><Bot size={21}/></div><div className="ve-heading"><strong>INSCO Virtual Engineer</strong><small>{isAr ? 'مدرّب الأكاديمية · ' + route : 'Academy tutor · ' + route}</small></div>
        <button type="button" onClick={() => setExpanded(v => !v)} aria-label={isAr ? 'تصغير' : 'Minimize'}><Minimize2 size={17}/></button>
        <button type="button" onClick={handleClose} aria-label={isAr ? 'إغلاق' : 'Close'}><X size={18}/></button></header>
      {expanded && <div className="ve-body">
        <div className="ve-welcome"><Sparkles size={17}/><p>{isAr ? 'أهلاً بك! اسألني عن محتوى الدرس، وسأستخدم مدرس INSCO ومكتبته المتاحة للإجابة.' : 'Welcome! Ask about the lesson and I’ll use the INSCO tutor and its available library.'}</p></div>
        <div className="ve-classroom" aria-label={isAr ? 'المهندس يشرح على السبورة' : 'Engineer teaching at the whiteboard'}>
          <div className="ve-board-wrap">
            <div className="ve-board">
              <div className="ve-board-top"><b>INSCO NDT ACADEMY</b><span>UT · A-SCAN</span></div>
              <svg className="ve-ascangraph" viewBox="0 0 420 190" role="img" aria-label={isAr ? 'رسم توضيحي مبسط لإشارة A-Scan' : 'Illustrative A-scan signal'}>
                <defs><pattern id="ve-grid" width="28" height="24" patternUnits="userSpaceOnUse"><path d="M28 0H0V24" fill="none" stroke="#b9d0d2" strokeWidth="1"/></pattern></defs>
                <rect width="420" height="190" fill="url(#ve-grid)"/>
                <path d="M20 154 L55 154 L66 45 L78 154 L175 154 L187 124 L199 154 L255 154 L266 82 L278 154 L400 154" fill="none" stroke="#087e83" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M20 154H400" stroke="#49616c" strokeWidth="1.5"/>
                <path d="M66 30V166M266 67V166" stroke="#d18a2d" strokeDasharray="5 5" strokeWidth="2"/>
                <text x="48" y="22" fill="#9b641e" fontSize="12">Entry</text><text x="245" y="56" fill="#9b641e" fontSize="12">Echo</text>
                <text x="340" y="178" fill="#49616c" fontSize="11">Time →</text>
              </svg>
              <div className="ve-board-notes"><span>① Initial pulse</span><span>② Back-wall / reflector echo</span></div>
            </div>
          </div>
          <div className={`ve-instructor ${loading ? "is-thinking" : answer ? "is-speaking" : "is-idle"}`} aria-label={isAr ? "مهندس ثلاثي الأبعاد يشير إلى السبورة" : "3D instructor pointing at the whiteboard"} role="img">
            <VirtualEngineer3D speaking={Boolean(answer)} thinking={loading} lesson={lessonFocus} />
            <svg viewBox="0 0 230 300" className="ve-instructor-art ve-instructor-fallback">
              <defs><linearGradient id="ve-skin" x2="1" y2="1"><stop stopColor="#f0c6a3"/><stop offset="1" stopColor="#bd8061"/></linearGradient><linearGradient id="ve-jacket" x2="1" y2="1"><stop stopColor="#e8eef2"/><stop offset="1" stopColor="#8299aa"/></linearGradient></defs>
              <ellipse cx="119" cy="292" rx="78" ry="7" fill="#081a2a" opacity=".18"/>
              <path d="M65 171 Q35 188 30 288 L194 288 Q189 190 151 171Z" fill="url(#ve-jacket)" stroke="#39576d" strokeWidth="3"/>
              <path d="M99 174 L117 207 L137 174 L129 289 L107 289Z" fill="#173b59"/>
              <path d="M116 206 L117 269" stroke="#e0a944" strokeWidth="3"/>
              <path d="M68 186 Q33 178 19 130 Q13 112 25 108 Q37 106 43 125 L79 164" fill="none" stroke="#39576d" strokeWidth="23" strokeLinecap="round"/>
              <path d="M24 116 Q15 105 5 92" stroke="url(#ve-skin)" strokeWidth="15" strokeLinecap="round" fill="none"/>
              <path d="M151 182 Q172 159 180 127 Q184 112 196 106" stroke="#39576d" strokeWidth="22" strokeLinecap="round" fill="none"/>
              <path d="M195 108 Q204 96 211 84" stroke="url(#ve-skin)" strokeWidth="14" strokeLinecap="round" fill="none"/>
              <path d="M201 88 L213 82 L220 85 L211 93" fill="url(#ve-skin)" stroke="#9e684f" strokeWidth="2"/>
              <path d="M76 85 Q75 34 116 31 Q158 34 157 88 L150 125 Q140 154 116 157 Q89 151 80 125Z" fill="url(#ve-skin)" stroke="#865a46" strokeWidth="2"/>
              <path d="M72 77 Q65 23 116 17 Q167 20 163 79 L151 68 Q132 53 96 64 L81 84Z" fill="#e8b74e" stroke="#a36d22" strokeWidth="3"/>
              <path d="M69 77 Q115 65 166 77" fill="none" stroke="#f5d58b" strokeWidth="7" strokeLinecap="round"/>
              <path d="M100 99 Q106 94 111 99 M127 99 Q133 94 138 99" stroke="#263b4b" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M109 125 Q117 131 126 125" stroke="#854c42" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M91 164 L116 195 L141 164" fill="#f7fafc" stroke="#8ba0ad" strokeWidth="2"/>
              <rect x="143" y="207" width="25" height="35" rx="4" fill="#173b59"/><text x="155" y="229" fill="#f4c96a" fontSize="10" textAnchor="middle">INSCO</text>
            </svg>
            <div className={`ve-speech-indicator ${loading ? 'is-thinking' : answer ? 'is-speaking' : ''}`}><span/>{loading ? (isAr ? 'بيحضّر الشرح' : 'Preparing') : answer ? (isAr ? 'بيشرح' : 'Explaining') : (isAr ? 'جاهز للشرح' : 'Ready to teach')}</div>
          </div>
        </div>
        {status === null && <small className="ve-disclaimer">{isAr ? 'جارٍ التحقق من اتصال المدرّس…' : 'Checking tutor availability…'}</small>}
        {status && !status.configured && status.reason !== 'unreachable' && <small className="ve-disclaimer">{isAr ? 'الرد من مكتبة إنسكو التعليمية عند عدم توفر نموذج خارجي.' : 'The INSCO learning library may answer when no external model is configured.'}</small>}
        <div className="ve-chips">{suggestions[isAr ? 'ar' : 'en'].map(item => <button key={item} type="button" disabled={loading} onClick={() => void ask(item)}>{item}</button>)}</div>
        {answer && <div className="ve-answer"><strong>{isAr ? 'شرح المهندس' : 'Engineer explanation'}</strong><p>{answer}</p>
          {answerMeta?.source && <small className="ve-disclaimer">{sourceLabel(answerMeta.source)}{answerMeta.kind === 'library' ? (isAr ? ' · إجابة مستخرجة من المكتبة' : ' · library-composed answer') : ''}</small>}
          {citations.length > 0 && <div className="ve-citations"><strong>{isAr ? 'المراجع المستخدمة' : 'Sources used'}</strong>{citations.slice(0, 4).map((citation, index) => <span key={citation.id || index}>{citation.title[isAr ? 'ar' : 'en']}</span>)}</div>}
        </div>}
        {answer && !loading && <div className="ve-next-actions" aria-label={isAr ? 'اختيارات المتعلم' : 'Learner choices'}>
          <p>{isAr ? (sessionEnded ? 'تم إيقاف الشرح عند هذه النقطة.' : 'تحب نعمل إيه بعد الجزء ده؟') : (sessionEnded ? 'The explanation is paused here.' : 'What would you like to do next?')}</p>
          <div>
            <button type="button" onClick={continueExplanation}>{isAr ? 'نكمل الجزء التالي' : 'Continue'}</button>
            <button type="button" onClick={showSimulator}>{isAr ? 'ورّيني المحاكي' : 'Show me the simulator'}</button>
            <button type="button" onClick={() => setSessionEnded(true)}>{isAr ? 'نكتفي هنا' : 'That’s enough'}</button>
          </div>
        </div>}
        {loading && <button className="ve-stop" type="button" onClick={stopExplanation}>{isAr ? 'إيقاف الشرح الآن' : 'Stop explanation'}</button>}
        {failure && <p className="ve-error" role="alert">{failureMessage(failure.code, tutorLanguage)}{failure.retryAfterSeconds ? ` (${failure.retryAfterSeconds}s)` : ''}</p>}
        {loading && !answer && <small className="ve-disclaimer">{isAr ? 'المدرّس بيبحث في المصادر وبيجهز الشرح…' : 'The tutor is retrieving sources and preparing an explanation…'}</small>}
        <form className="ve-input" onSubmit={e => { e.preventDefault(); void ask(question); }}><input value={question} onChange={e => setQuestion(e.target.value)} maxLength={4000} placeholder={isAr ? 'اكتب سؤالك هنا…' : 'Ask a question…'} aria-label={isAr ? 'سؤالك' : 'Your question'}/><button type="submit" disabled={!question.trim() || loading} aria-label={isAr ? 'إرسال' : 'Send'}><Send size={17}/></button></form>
        <small className="ve-disclaimer">{isAr ? 'للتعلّم فقط. لا تعتمد عليه في قرارات قبول/رفض الفحص؛ ارجع للإجراء والمراجع المعتمدة ومراجعة المختص.' : 'For learning only. Do not use it for inspection acceptance/rejection; follow the approved procedure, references and qualified review.'}</small>
      </div>}
    </section>}
    <button className="ve-launcher" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}><span className="ve-launcher-icon"><Bot size={25}/></span><span>{isAr ? 'المهندس الافتراضي' : 'Virtual Engineer'}</span><MessageCircle size={16}/></button>
  </div>;
};
