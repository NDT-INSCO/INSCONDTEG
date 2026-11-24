import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardCheck, Inbox, LoaderCircle, Mail, Phone, RotateCw, Search } from 'lucide-react';
import { useAdminClient } from '../../admin/connection';
import { isQuoteStatus, QUOTE_STATUSES } from '../../admin/contract';
import type { ManagedQuote, QuotePage, QuoteStatus } from '../../admin/contract';
import type { Language } from '../../types';
import { adminError, AdminLoading, AdminMessage, BackIcon, EmptyQuotes, numberText, QuoteStatusPill, QuoteTable, serviceText, shortDate, STATUS_COPY } from './AdminUi';

type SessionErrorHandler = (error: unknown) => boolean;
type Load<T> = { data: T } | { error: unknown } | null;

interface InboxProps {
  language: Language;
  initialStatus: QuoteStatus | '';
  reference: string | null;
  onOpen: (reference: string | null) => void;
  onSessionError: SessionErrorHandler;
  onUpdate: () => void;
}

export function AdminQuotes({ language, initialStatus, reference, onOpen, onSessionError, onUpdate }: InboxProps) {
  const adminClient = useAdminClient();
  const ar = language === 'ar';
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatus | ''>(initialStatus);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [load, setLoad] = useState<Load<QuotePage>>(null);

  useEffect(() => {
    if (reference) return;
    const controller = new AbortController();
    setLoad(null);
    void adminClient.quotes(search, status, page, controller.signal).then(data => {
      if (!controller.signal.aborted) setLoad({ data });
    }).catch(error => {
      if (!controller.signal.aborted && !onSessionError(error)) setLoad({ error });
    });
    return () => controller.abort();
  }, [adminClient, reference, search, status, page, version, onSessionError]);

  if (reference) return <QuoteDetails key={reference} reference={reference} language={language} onBack={() => { setLoad(null); onOpen(null); }} onSessionError={onSessionError} onUpdate={onUpdate} />;
  return (
    <section className="ad-panel ad-inbox">
      <div className="ad-panel-heading">
        <div><h2><Inbox size={20} aria-hidden="true" />{ar ? 'صندوق طلبات عروض الأسعار' : 'Quote request inbox'}</h2><p>{ar ? 'ابحث عن الطلبات المستلمة عبر هذا الخادم وافتحها لمتابعة حالتها.' : 'Find requests received by this server and open them to update their status.'}</p></div>
        <button type="button" className="ad-button ad-button-muted" onClick={() => setVersion(value => value + 1)}><RotateCw size={16} aria-hidden="true" />{ar ? 'تحديث القائمة' : 'Refresh list'}</button>
      </div>
      <form className="ad-filters" onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setPage(1); setVersion(value => value + 1); }}>
        <label className="ad-filter-search">
          <span>{ar ? 'ابحث في الصندوق' : 'Search the inbox'}</span>
          <span className="ad-icon-field"><Search size={17} aria-hidden="true" /><input className="ad-input" type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={160} placeholder={ar ? 'اسم الشركة أو رقم الطلب' : 'Company name or reference'} dir="auto" /></span>
        </label>
        <label>
          <span>{ar ? 'تصفية حسب الحالة' : 'Filter by status'}</span>
          <select className="ad-input" value={status} onChange={event => { const value = event.target.value; setStatus(isQuoteStatus(value) ? value : ''); setPage(1); }}>
            <option value="">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {QUOTE_STATUSES.map(value => <option value={value} key={value}>{STATUS_COPY[value][language]}</option>)}
          </select>
        </label>
        <button type="submit" className="ad-button ad-primary">{ar ? 'بحث' : 'Search'}</button>
      </form>
      {!load && <AdminLoading language={language} />}
      {load && 'error' in load && <AdminMessage>{adminError(load.error, language)}</AdminMessage>}
      {load && 'data' in load && (
        <>
          {load.data.items.length ? <QuoteTable items={load.data.items} language={language} onOpen={onOpen} /> : <EmptyQuotes filtered={Boolean(search || status)} language={language} />}
          <div className="ad-pagination">
            <span role="status">{ar ? `عدد النتائج: ${numberText(load.data.total, language)}` : `Results: ${numberText(load.data.total, language)}`}</span>
            {load.data.pages > 1 && <div>
              <button type="button" className="ad-icon-button" disabled={load.data.page <= 1} onClick={() => setPage(load.data.page - 1)} aria-label={ar ? 'الصفحة السابقة' : 'Previous page'}><ChevronLeft size={18} className="ad-directional" aria-hidden="true" /></button>
              <bdi>{numberText(load.data.page, language)} / {numberText(load.data.pages, language)}</bdi>
              <button type="button" className="ad-icon-button" disabled={load.data.page >= load.data.pages} onClick={() => setPage(load.data.page + 1)} aria-label={ar ? 'الصفحة التالية' : 'Next page'}><ChevronRight size={18} className="ad-directional" aria-hidden="true" /></button>
            </div>}
          </div>
        </>
      )}
    </section>
  );
}

function QuoteDetails({ reference, language, onBack, onSessionError, onUpdate }: {
  reference: string;
  language: Language;
  onBack: () => void;
  onSessionError: SessionErrorHandler;
  onUpdate: () => void;
}) {
  const adminClient = useAdminClient();
  const ar = language === 'ar';
  const [load, setLoad] = useState<Load<ManagedQuote>>(null);
  const [version, setVersion] = useState(0);
  const [nextStatus, setNextStatus] = useState<QuoteStatus>('new');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoad(null);
    void adminClient.quote(reference, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setLoad({ data });
      setNextStatus(data.status);
    }).catch(cause => {
      if (!controller.signal.aborted && !onSessionError(cause)) setLoad({ error: cause });
    });
    return () => controller.abort();
  }, [adminClient, reference, version, onSessionError]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const data = await adminClient.updateQuote(reference, nextStatus);
      setLoad({ data });
      setNextStatus(data.status);
      setSaved(true);
      onUpdate();
    } catch (cause) {
      if (!onSessionError(cause)) setError(cause);
    } finally {
      setSaving(false);
    }
  }

  const quote = load && 'data' in load ? load.data : null;
  return (
    <div className="ad-stack">
      <div><button type="button" className="ad-button ad-button-muted" onClick={onBack}><BackIcon />{ar ? 'العودة للطلبات' : 'Back to requests'}</button></div>
      {!load && <section className="ad-panel"><AdminLoading language={language} /></section>}
      {load && 'error' in load && <section className="ad-panel ad-stack"><AdminMessage>{adminError(load.error, language)}</AdminMessage><div><button type="button" className="ad-button ad-button-muted" onClick={() => setVersion(value => value + 1)}>{ar ? 'أعد المحاولة' : 'Try again'}</button></div></section>}
      {quote && (
        <div className="ad-detail-grid">
          <section className="ad-panel">
            <div className="ad-panel-heading"><div><h2><ClipboardCheck size={20} aria-hidden="true" /><bdi>{quote.companyName}</bdi></h2><p className="ad-mono"><bdi>{quote.reference}</bdi></p></div><QuoteStatusPill status={quote.status} language={language} /></div>
            <dl className="ad-quote-facts">
              <div><dt>{ar ? 'اسم المسؤول' : 'Contact name'}</dt><dd dir="auto">{quote.contactName || '—'}</dd></div>
              <div><dt>{ar ? 'الخدمة المطلوبة' : 'Requested service'}</dt><dd dir="auto">{serviceText(quote.serviceType, language)}</dd></div>
              <div><dt>{ar ? 'وقت الاستلام' : 'Received at'}</dt><dd>{shortDate(quote.receivedAt, language, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
              <div><dt>{ar ? 'موقع المشروع' : 'Project location'}</dt><dd dir="auto">{quote.projectLocation || '—'}</dd></div>
              <div><dt>{ar ? 'البريد الإلكتروني' : 'Email'}</dt><dd><a href={`mailto:${encodeURIComponent(quote.email).replace('%40', '@')}`}><Mail size={15} aria-hidden="true" /><bdi>{quote.email}</bdi></a></dd></div>
              <div><dt>{ar ? 'رقم الهاتف' : 'Phone'}</dt><dd><a href={`tel:${quote.phone.trim().startsWith('+') ? '+' : ''}${quote.phone.replace(/\D/g, '')}`}><Phone size={15} aria-hidden="true" /><bdi dir="ltr">{quote.phone}</bdi></a></dd></div>
            </dl>
            <div className="ad-quote-description"><h3>{ar ? 'تفاصيل الطلب' : 'Request details'}</h3><p dir="auto">{quote.description || (ar ? 'لم تُضف تفاصيل.' : 'No details provided.')}</p></div>
          </section>
          <section className="ad-panel">
            <div className="ad-panel-heading"><div><h2>{ar ? 'إدارة حالة الطلب' : 'Manage request status'}</h2><p>{ar ? 'تظهر الحالة لفريق الإدارة فقط.' : 'The status is visible to admins only.'}</p></div></div>
            <form className="ad-form-stack" onSubmit={save}>
              <label>{ar ? 'الحالة' : 'Status'}<select className="ad-input" value={nextStatus} disabled={saving} onChange={event => { const value = event.target.value; if (isQuoteStatus(value)) setNextStatus(value); setSaved(false); }}>
                {QUOTE_STATUSES.map(status => <option key={status} value={status}>{STATUS_COPY[status][language]}</option>)}
              </select></label>
              {error != null && <AdminMessage>{adminError(error, language)}</AdminMessage>}
              {saved && <AdminMessage error={false}>{ar ? 'تم حفظ حالة الطلب.' : 'Request status saved.'}</AdminMessage>}
              <button type="submit" className="ad-button ad-primary" disabled={saving || nextStatus === quote.status}>
                {saving && <LoaderCircle size={16} className="ad-spin" aria-hidden="true" />}{ar ? 'حفظ الحالة' : 'Save status'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
