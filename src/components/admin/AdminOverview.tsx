import React from 'react';
import { Activity, ArrowUpRight, Check, ClipboardList, Clock4, FileText, Inbox, Megaphone, ShieldCheck, Sparkles } from 'lucide-react';
import type { DashboardData, QuoteStatus } from '../../admin/contract';
import type { Language } from '../../types';
import { EmptyQuotes, numberText, QuoteTable, shortDate } from './AdminUi';

interface OverviewProps {
  data: DashboardData;
  language: Language;
  onInbox: (status?: QuoteStatus) => void;
  onQuote: (reference: string) => void;
  onAnnouncement: () => void;
}

export function AdminOverview({ data, language, onInbox, onQuote, onAnnouncement }: OverviewProps) {
  const ar = language === 'ar';
  const metrics = [
    { status: undefined, icon: ClipboardList, label: ar ? 'إجمالي الطلبات' : 'Total requests', value: data.totals.total, tone: 'cyan' },
    { status: 'new', icon: Inbox, label: ar ? 'طلبات جديدة' : 'New requests', value: data.totals.new, tone: 'teal' },
    { status: 'in_progress', icon: Clock4, label: ar ? 'قيد المتابعة' : 'In follow-up', value: data.totals.in_progress, tone: 'amber' },
    { status: 'closed', icon: Check, label: ar ? 'طلبات مغلقة' : 'Closed requests', value: data.totals.closed, tone: 'violet' },
  ] as const;
  const peak = Math.max(1, ...data.activity.map(day => day.count));
  const insightText = data.totals.overdue > 0
    ? (ar ? `هناك ${numberText(data.totals.overdue, language)} من الطلبات المفتوحة منذ ٤٨ ساعة أو أكثر.` : `${data.totals.overdue} open request(s) have been waiting for at least 48 hours.`)
    : data.totals.new > 0
      ? (ar ? `لديك ${numberText(data.totals.new, language)} من الطلبات الجديدة بانتظار المراجعة.` : `${data.totals.new} new request(s) are waiting for review.`)
      : (ar ? 'لا توجد طلبات جديدة أو متأخرة تحتاج إلى مراجعة الآن.' : 'No new or overdue requests need your attention right now.');
  const services = [
    { title: ar ? 'صندوق عروض الأسعار' : 'Quote inbox', on: true, offLabel: '' },
    { title: ar ? 'إشعارات الطلبات الخارجية' : 'External quote notifications', on: data.services.rfqNotificationsConfigured, offLabel: ar ? 'الصندوق فقط' : 'Inbox only' },
    { title: ar ? 'المستشار الذكي' : 'AI tutor', on: data.services.tutorConfigured, offLabel: ar ? 'غير مهيّأ' : 'Not configured' },
  ];

  return (
    <div className="ad-stack">
      <section className="ad-welcome">
        <div>
          <span className="ad-eyebrow"><span className="ad-dot" />{ar ? 'نظرة تشغيلية' : 'OPERATIONS OVERVIEW'}</span>
          <h2>{ar ? 'لوحة الإدارة' : 'Website dashboard'}</h2>
          <p>{ar ? 'تابع طلبات العملاء وإعلانات الموقع، واعرف ما يحتاج إلى متابعتك.' : 'Track customer requests and site announcements, and see what needs your attention.'}</p>
        </div>
        <div className="ad-welcome-art" aria-hidden="true"><span /><span /><ShieldCheck size={73} strokeWidth={1.15} /></div>
      </section>

      <div className="ad-metrics" aria-label={ar ? 'ملخص الطلبات' : 'Requests summary'}>
        {metrics.map(({ label, value, icon: Icon, tone, status }) => (
          <button type="button" className={`ad-metric ad-tone-${tone}`} key={label} onClick={() => onInbox(status)}>
            <span className="ad-metric-top"><span className="ad-metric-icon"><Icon size={18} aria-hidden="true" /></span><ArrowUpRight size={15} className="ad-corner-arrow" aria-hidden="true" /></span>
            <strong><bdi>{numberText(value, language)}</bdi></strong>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="ad-overview-grid">
        <section className="ad-panel ad-activity">
          <div className="ad-panel-heading">
            <div><h2><Activity size={19} aria-hidden="true" />{ar ? 'نشاط الطلبات' : 'Request activity'}</h2><p>{ar ? 'عدد الطلبات المستلمة يوميًا' : 'Daily intake of quote requests'}</p></div>
            <span className="ad-neutral-tag">{ar ? 'آخر ٧ أيام · UTC' : 'Last 7 days · UTC'}</span>
          </div>
          <div className="ad-chart">
            <div className="ad-chart-grid" aria-hidden="true"><span /><span /><span /></div>
            <ol className="ad-chart-bars" aria-label={ar ? 'طلبات كل يوم' : 'Requests by day'}>
              {data.activity.map(({ day, count }) => (
                <li key={day} className={count > 0 ? 'has-count' : ''}>
                  <div className="ad-chart-track"><div className="ad-chart-bar" style={{ height: count ? `${Math.max(9, count / peak * 82)}%` : '2px' }}><span>{numberText(count, language)}</span></div></div>
                  <time dateTime={day}>{shortDate(day, language, { timeZone: 'UTC', day: 'numeric', month: 'numeric' })}</time>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ad-panel ad-monitor">
          <div className="ad-panel-heading"><div><h2><Sparkles size={19} aria-hidden="true" />{ar ? 'متابعة ذكية' : 'Smart follow-up'}</h2><p>{ar ? 'تنبيه حسب حالة الطلبات' : 'Updates based on request status'}</p></div></div>
          <div className={`ad-insight ${data.totals.overdue ? 'is-urgent' : ''}`}>
            {data.totals.overdue > 0 ? <Clock4 size={19} aria-hidden="true" /> : <Activity size={19} aria-hidden="true" />}
            <div>
              <strong>{data.totals.overdue > 0 ? (ar ? 'طلبات متأخرة' : 'Overdue requests') : (ar ? 'أولوية المتابعة' : 'Follow-up priority')}</strong>
              <p>{insightText}</p>
              {(data.totals.overdue > 0 || data.totals.new > 0) && <button type="button" className="ad-text-button" onClick={() => onInbox(data.totals.overdue > 0 ? undefined : 'new')}>{ar ? 'راجع صندوق الطلبات' : 'Review the inbox'}</button>}
            </div>
          </div>
          <ul className="ad-services">
            {services.map(service => <li key={service.title}><span>{service.title}</span><span className={`ad-service-state ${service.on ? 'is-on' : ''}`}><span className="ad-dot" />{service.on ? (ar ? 'مهيّأ' : 'Configured') : service.offLabel}</span></li>)}
          </ul>
        </section>
      </div>

      <section className="ad-panel ad-recent">
        <div className="ad-panel-heading">
          <div><h2><FileText size={19} aria-hidden="true" />{ar ? 'أحدث الطلبات' : 'Recent requests'}</h2><p>{ar ? 'آخر الطلبات المستلمة عبر النموذج' : 'Latest enquiries accepted by the quote form'}</p></div>
          <button type="button" className="ad-button ad-button-muted" onClick={() => onInbox()}>{ar ? 'عرض الكل' : 'View all'}<ArrowUpRight size={16} className="ad-corner-arrow" aria-hidden="true" /></button>
        </div>
        {data.recent.length > 0 ? <QuoteTable items={data.recent} language={language} onOpen={onQuote} /> : <EmptyQuotes language={language} />}
      </section>

      <section className="ad-panel ad-announcement-shortcut">
        <span className="ad-metric-icon"><Megaphone size={19} aria-hidden="true" /></span>
        <div><h2>{ar ? 'إعلان الصفحة الرئيسية' : 'Homepage announcement'}</h2><p>{data.announcement.enabled ? (ar ? 'هناك إعلان منشور حاليًا.' : 'An announcement is currently published.') : (ar ? 'لا يوجد إعلان منشور حاليًا.' : 'No announcement is currently published.')}</p></div>
        <button type="button" className="ad-button ad-button-muted" onClick={onAnnouncement}>{ar ? 'إدارة الإعلان' : 'Manage announcement'}</button>
      </section>
    </div>
  );
}
