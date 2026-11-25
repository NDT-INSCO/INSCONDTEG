import React, { useCallback, useEffect, useState } from 'react';
import { Activity, BookOpen, Bot, BrainCircuit, Globe2, MessagesSquare, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { fetchTutorStatus } from '../../ai/client';
import type { TutorStatus } from '../../ai/contract';
import type { Language } from '../../types';
import { AdminLoading } from './AdminUi';

interface AdminAgentsProps { language: Language; active: boolean }

const AGENTS = [
  { id: 'tutor', icon: BookOpen, ar: 'المعلّم التقني', en: 'Technical tutor', arDetail: 'يستند إلى مكتبة الأكاديمية والمراجع المتاحة لشرح موضوعات NDT.', enDetail: 'Uses the academy library and available references to explain NDT topics.' },
  { id: 'copilot', icon: Bot, ar: 'المساعد العام', en: 'User copilot', arDetail: 'يساعد المستخدم في التنقل وصياغة المحتوى والوصول إلى خدمات الموقع.', enDetail: 'Helps users navigate, draft content and reach site services.' },
  { id: 'site-manager', icon: Activity, ar: 'مدير الموقع', en: 'Site manager', arDetail: 'يدعم مراجعة التشغيل وفرز الأولويات واقتراح إجراءات للمشرف.', enDetail: 'Supports operational reviews, triage and suggested actions for administrators.' },
  { id: 'community', icon: Users, ar: 'مساعد المجتمع', en: 'Community assistant', arDetail: 'يساعد في إعداد ومراجعة محتوى مجتمع INSCO.', enDetail: 'Assists with preparing and reviewing INSCO community content.' },
  { id: 'chatgpt-stream', icon: MessagesSquare, ar: 'المحادثة المتدفقة', en: 'Streaming assistant', arDetail: 'واجهة محادثة متدفقة مشتركة عبر بوابة الذكاء الاصطناعي.', enDetail: 'A shared streaming conversation surface through the AI gateway.' },
] as const;

function providerName(status: TutorStatus, ar: boolean) {
  if (status.provider === 'local') return ar ? 'المحرك المحلي' : 'Local engine';
  if (status.provider === 'gemini') return 'Gemini';
  if (status.provider === 'manus') return 'Manus';
  if (status.provider === 'auto') return ar ? 'محلي ثم خارجي' : 'Local then external';
  return ar ? 'غير محدد' : 'Not reported';
}

export function AdminAgents({ language, active }: AdminAgentsProps) {
  const ar = language === 'ar';
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try { setStatus(await fetchTutorStatus()); }
    catch { setFailed(true); setStatus(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (active && status === null && !loading) void refresh();
  }, [active, status, loading, refresh]);

  const ready = status?.configured === true;
  const engine = status?.brain?.model || status?.model || '—';
  const corpus = status?.retrieval?.documents ?? status?.brain?.documents ?? 0;

  return (
    <div className="ad-stack">
      <section className="ad-welcome">
        <div>
          <span className="ad-eyebrow"><span className="ad-dot" />{ar ? 'مركز الذكاء الاصطناعي' : 'AI CONTROL CENTER'}</span>
          <h2>{ar ? 'وكلاء INSCO AI' : 'INSCO AI agents'}</h2>
          <p>{ar ? 'متابعة المحرك والوكلاء الموجودين داخل الموقع من لوحة الإدارة الحالية.' : 'Monitor the engine and the agents already integrated into the existing site.'}</p>
        </div>
        <div className="ad-welcome-art" aria-hidden="true"><BrainCircuit size={72} strokeWidth={1.2} /></div>
      </section>

      <section className="ad-panel">
        <div className="ad-panel-heading">
          <div><h2><ShieldCheck size={19} aria-hidden="true" />{ar ? 'حالة المحرك المركزي' : 'Central engine status'}</h2><p>{ar ? 'قراءة فعلية من بوابة الذكاء الاصطناعي، دون عرض مفاتيح أو أسرار.' : 'Live read from the AI gateway; keys and secrets are never displayed.'}</p></div>
          <button type="button" className="ad-button ad-button-muted" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} aria-hidden="true" />{ar ? 'تحديث الحالة' : 'Refresh status'}</button>
        </div>
        {loading && !status ? <AdminLoading language={language} /> : status ? (
          <>
            <div className="ad-agent-summary">
              <div><small>{ar ? 'المحرك' : 'Engine'}</small><strong>{engine}</strong></div>
              <div><small>{ar ? 'مزود الإجابة' : 'Answer provider'}</small><strong>{providerName(status, ar)}</strong></div>
              <div><small>{ar ? 'مقاطع المعرفة' : 'Knowledge passages'}</small><strong><bdi>{corpus}</bdi></strong></div>
            </div>
            <ul className="ad-services">
              <li><span>{ar ? 'جاهزية الإجابة' : 'Answer readiness'}</span><span className={'ad-service-state ' + (ready ? 'is-on' : '')}><span className="ad-dot" />{ready ? (ar ? 'جاهز' : 'Ready') : (ar ? 'يحتاج مراجعة' : 'Needs attention')}</span></li>
              <li><span>{ar ? 'مصدر المعرفة' : 'Knowledge source'}</span><span>{status.retrieval.source || '—'}</span></li>
              <li><span>{ar ? 'الخدمات الخارجية' : 'External services'}</span><span>{status.external ? (ar ? 'مستخدمة في المسار الحالي' : 'Used by current provider mode') : (ar ? 'غير مستخدمة في المسار الحالي' : 'Not used by current provider mode')}</span></li>
              <li><span>{ar ? 'الاسترجاع' : 'Retrieval'}</span><span>{status.retrieval.ready ? (ar ? 'متاح' : 'Available') : (ar ? 'غير جاهز' : 'Not ready')}</span></li>
            </ul>
            {status.retrieval.error && <p>{ar ? 'ملاحظة في مكتبة المعرفة: ' : 'Knowledge library note: '}{status.retrieval.error}</p>}
          </>
        ) : <p role="status">{failed ? (ar ? 'تعذّر قراءة حالة البوابة. جرّب التحديث.' : 'Could not read gateway status. Try refreshing.') : (ar ? 'لم تصل بيانات الحالة بعد.' : 'Status has not been loaded yet.')}</p>}
      </section>

      <section className="ad-panel">
        <div className="ad-panel-heading"><div><h2><Bot size={19} aria-hidden="true" />{ar ? 'الوكلاء المتكاملون حاليًا' : 'Currently integrated agents'}</h2><p>{ar ? 'هذه خريطة للوظائف الموجودة؛ ظهور الوكيل هنا لا يعني أن كل مهمة تشغيلية مفعّلة تلقائيًا.' : 'This is an inventory of existing capabilities; listing an agent does not imply every operational task is enabled.'}</p></div></div>
        <div className="ad-agent-grid">
          {AGENTS.map(agent => {
            const Icon = agent.icon;
            return <article className="ad-agent-card" key={agent.id}>
              <div className="ad-agent-topline">
                <h3><Icon size={18} aria-hidden="true" />{agent[language]}</h3>
                <span className="ad-agent-state"><span className="ad-dot" />{ar ? 'موجود في البوابة' : 'In gateway'}</span>
              </div>
              <p>{ar ? agent.arDetail : agent.enDetail}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="ad-panel">
        <div className="ad-panel-heading"><div><h2><Globe2 size={19} aria-hidden="true" />{ar ? 'سياسة التشغيل' : 'Operating policy'}</h2><p>{ar ? 'حدود الصلاحيات قبل إضافة التنفيذ المستقل.' : 'Permission boundaries before autonomous execution is added.'}</p></div></div>
        <ul className="ad-services">
          <li><span>{ar ? 'العمل المحلي أولًا' : 'Local-first operation'}</span><span className="ad-service-state is-on">{ar ? 'الافتراضي' : 'Default'}</span></li>
          <li><span>{ar ? 'الخدمات الخارجية' : 'External providers'}</span><span>{ar ? 'اختيارية' : 'Optional'}</span></li>
          <li><span>{ar ? 'النشر وتغيير الإنتاج' : 'Production changes and deployment'}</span><span>{ar ? 'يتطلب موافقة بشرية' : 'Human approval required'}</span></li>
          <li><span>{ar ? 'الحذف وتغيير بيانات العملاء' : 'Deletion and customer-data changes'}</span><span>{ar ? 'يتطلب صلاحية وموافقة' : 'Permission and approval required'}</span></li>
        </ul>
      </section>
    </div>
  );
}
