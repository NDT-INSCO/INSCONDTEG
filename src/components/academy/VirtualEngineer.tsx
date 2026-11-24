import React, { useMemo, useState } from 'react';
import { Bot, ChevronDown, MessageCircle, Minimize2, Send, Sparkles, X } from 'lucide-react';
import type { Language } from '../../types';
import './VirtualEngineer.css';

type Props = { language: Language; route: string };

const replies = {
  ar: [
    { keys: ['ut', 'موجات', 'صوت', 'ultrasonic'], text: 'في فحص UT نرسل نبضة فوق صوتية داخل المادة، ثم نستقبل الصدى المنعكس. في طريقة Pulse-Echo نحسب المسافة من زمن الرحلة ذهاباً وعودة: d = v × t ÷ 2. يجب مراعاة سرعة المادة وتأخير المسبار والمعايرة.' },
    { keys: ['a-scan', 'اسكان', 'إشارة', 'شاشة'], text: 'يعرض A-Scan السعة مقابل الزمن أو المسافة الصوتية. موضع الإشارة يساعد في تقدير موقع العاكس، وارتفاعها يتأثر بحجم العاكس واتجاهه والمسافة والكسب والاقتران؛ لذلك لا يكفي ارتفاع الإشارة وحده للحكم على العيب.' },
    { keys: ['معايرة', 'calibration', 'dac'], text: 'المعايرة تربط قاعدة الزمن والمدى بسرعة الصوت وأبعاد بلوك مرجعي مناسب، وتتحقق من استجابة الجهاز والمسبار. يجب اتباع إجراء الفحص والبلوك المعتمدين قبل تفسير النتائج.' },
  ],
  en: [
    { keys: ['ut', 'ultrasonic', 'sound', 'wave'], text: 'In UT, a probe sends an ultrasonic pulse into the material and receives reflected echoes. In pulse-echo, distance is d = v × t ÷ 2 because the measured time includes the outward and return paths. Account for material velocity, probe delay and calibration.' },
    { keys: ['a-scan', 'signal', 'screen'], text: 'An A-scan plots signal amplitude against time or sound path. Echo position helps estimate reflector location. Amplitude also depends on reflector size and orientation, distance, gain and coupling, so amplitude alone is not a defect verdict.' },
    { keys: ['calibration', 'dac'], text: 'Calibration relates the time base and range to sound velocity and a suitable reference block, and checks instrument/probe response. Follow the applicable inspection procedure and reference-block requirements.' },
  ],
};

export const VirtualEngineer: React.FC<Props> = ({ language, route }) => {
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const suggestions = isAr ? ['اشرح مبدأ UT', 'ما هو A-Scan؟', 'كيف تتم المعايرة؟'] : ['Explain UT principles', 'What is A-scan?', 'How is calibration done?'];
  const lesson = useMemo(() => route.toLowerCase().includes('ut') || window.location.hash.toLowerCase().includes('ut') ? 'UT' : (isAr ? 'الأكاديمية' : 'Academy'), [route, isAr]);
  const ask = (value: string) => {
    const q = value.trim();
    if (!q) return;
    const match = replies[isAr ? 'ar' : 'en'].find(item => item.keys.some(key => q.toLowerCase().includes(key)));
    setAnswer(match?.text || (isAr
      ? 'أقدر أساعدك في مبادئ UT وقراءة A-Scan والمعايرة. اكتب سؤالك باستخدام أحد هذه الموضوعات. هذه نسخة تجريبية بإجابات تعليمية مدمجة وليست اتصالاً حياً بنموذج الذكاء الاصطناعي.'
      : 'I can help with UT principles, A-scan interpretation and calibration. Try one of those topics. This prototype uses built-in teaching responses; it is not yet connected to a live AI model.'));
    setQuestion('');
  };
  return <div className="ve-root" dir={isAr ? 'rtl' : 'ltr'}>
    {open && <section className="ve-panel" aria-label={isAr ? 'المهندس الافتراضي' : 'Virtual Engineer'}>
      <header className="ve-header"><div className="ve-avatar"><Bot size={23}/></div><div className="ve-heading"><strong>INSCO Virtual Engineer</strong><small>{isAr ? 'مساعد الأكاديمية · ' + lesson : 'Academy guide · ' + lesson}</small></div>
        <button type="button" onClick={() => setExpanded(v => !v)} aria-label={isAr ? 'تصغير' : 'Minimize'}><Minimize2 size={17}/></button>
        <button type="button" onClick={() => setOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'}><X size={18}/></button></header>
      {expanded && <div className="ve-body">
        <div className="ve-welcome"><Sparkles size={17}/><p>{isAr ? 'أهلاً بك! أنا مهندسك الافتراضي. اختر موضوعاً من UT أو اكتب سؤالك.' : 'Welcome! I’m your virtual engineer. Choose a UT topic or type a question.'}</p></div>
        <div className="ve-chips">{suggestions.map(item => <button key={item} type="button" onClick={() => ask(item)}>{item}</button>)}</div>
        {answer && <div className="ve-answer"><strong>{isAr ? 'شرح المهندس' : 'Engineer explanation'}</strong><p>{answer}</p></div>}
        <form className="ve-input" onSubmit={e => { e.preventDefault(); ask(question); }}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder={isAr ? 'اكتب سؤالك هنا…' : 'Ask a question…'} aria-label={isAr ? 'سؤالك' : 'Your question'}/><button type="submit" aria-label={isAr ? 'إرسال' : 'Send'}><Send size={17}/></button></form>
        <small className="ve-disclaimer">{isAr ? 'نسخة تجريبية: إجابات مدمجة، دون اتصال حي بالذكاء الاصطناعي أو صوت/تحريك ثلاثي الأبعاد حتى الآن.' : 'Prototype: built-in answers; live AI, voice and 3D animation are not connected yet.'}</small>
      </div>}
    </section>}
    <button className="ve-launcher" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}><span className="ve-launcher-icon"><Bot size={25}/></span><span>{isAr ? 'المهندس الافتراضي' : 'Virtual Engineer'}</span><MessageCircle size={16}/></button>
  </div>;
};
