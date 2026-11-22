import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { Phone, Mail, MapPin, Send, CheckCircle2, MessageSquare, AlertTriangle, Loader2, Copy } from 'lucide-react';
import { RFQ_QUICK_ACTION_EVENT, RfqQuickActionDetail } from './CompanyQuickActionsSection';
import {
  buildRfqMessage,
  buildRfqPayload,
  resolveRfqEndpoint,
  submitRfq,
  type RfqFailureReason,
} from '../../rfq/submit';
import { RFQ_FIELD_LIMITS, normalizeRfqPhone, validRfqEmail } from '../../rfq/validation';
import { SectionHeading } from '../ui/SectionHeading';

interface CompanyContactSectionProps {
  language: Language;
  /** Testing seam: lets a test drive the network outcome without a server. */
  submitRequest?: typeof submitRfq;
  initialService?: string;
  toolsSlot?: React.ReactNode;
}

export const CompanyContactSection: React.FC<CompanyContactSectionProps> = ({
  language,
  submitRequest,
  initialService,
  toolsSlot,
}) => {
  const isAr = language === 'ar';
  const configured = Boolean(submitRequest || resolveRfqEndpoint());
  const emptyDraft = {
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    serviceType: initialService ?? 'pwht',
    projectLocation: '',
    description: '',
  };
  const [formData, setFormData] = useState(emptyDraft);

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quickQuoteActive, setQuickQuoteActive] = useState(Boolean(initialService));
  const [sending, setSending] = useState<boolean>(false);
  const [failure, setFailure] = useState<RfqFailureReason | null>(null);
  const [copyStatus, setCopyStatus] = useState<'copied' | 'manual' | null>(null);
  const sendingRef = useRef(false);
  const trap = useRef<HTMLInputElement>(null);
  const receiptHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (submittedRef) receiptHeading.current?.focus();
  }, [submittedRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleQuickAction = (event: Event) => {
      if (sendingRef.current) return;
      const custom = event as CustomEvent<RfqQuickActionDetail>;
      const requestedService = custom.detail?.serviceType;
      const requestedLocation = custom.detail?.projectLocation;
      const requestedDescription = custom.detail?.description;
      setSubmittedRef(null);
      setErrorMessage(null);
      setFailure(null);
      setQuickQuoteActive(true);
      setFormData((prev) => ({
        ...prev,
        ...(requestedService ? { serviceType: requestedService } : {}),
        ...(requestedLocation ? { projectLocation: requestedLocation } : {}),
        ...(requestedDescription ? { description: requestedDescription } : {}),
      }));
    };
    window.addEventListener(RFQ_QUICK_ACTION_EVENT, handleQuickAction);
    return () => window.removeEventListener(RFQ_QUICK_ACTION_EVENT, handleQuickAction);
  }, []);

  useEffect(() => {
    if (!initialService) return;
    setFormData(prev => ({ ...prev, serviceType: initialService }));
    setQuickQuoteActive(true);
  }, [initialService]);

  const sendRequest = async () => {
    if (sendingRef.current || !configured) return;
    const payload = { ...buildRfqPayload(formData, language), website: trap.current?.value ?? '' };
    const oversized = Object.entries(RFQ_FIELD_LIMITS).some(([key, limit]) =>
      payload[key as keyof typeof RFQ_FIELD_LIMITS].length > limit);
    if (!payload.companyName || !normalizeRfqPhone(payload.phone) || !validRfqEmail(payload.email) || oversized) {
      setErrorMessage(isAr
        ? 'راجع اسم الشركة ورقم الهاتف والبريد الإلكتروني، وتأكد من أن طول النص لا يتجاوز الحد المسموح.'
        : 'Check the company name, phone number and email, and keep each field within its character limit.');
      return;
    }

    setErrorMessage(null);
    setFailure(null);
    setCopyStatus(null);
    sendingRef.current = true;
    setSending(true);
    try {
      const outcome = await (submitRequest ?? submitRfq)(payload);
      if (outcome.status === 'sent') {
        setFormData(emptyDraft);
        setSubmittedRef(outcome.reference);
      } else {
        setFailure(outcome.reason);
      }
    } catch {
      setFailure('network');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const failureMessage = (reason: RfqFailureReason): string => {
    if (reason === 'not_configured') return isAr
      ? 'الإرسال المباشر من الموقع غير متاح، ولم يُسجَّل طلب. استخدم قنوات التواصل أدناه.'
      : 'Online submission is unavailable and no request was registered. Use the contact options below.';
    if (reason === 'rate_limited') return isAr
      ? 'تم رفض المحاولة بسبب كثرة الطلبات. انتظر قبل المحاولة مرة أخرى أو تواصل معنا مباشرة.'
      : 'Too many attempts. Wait before trying again, or contact us directly.';
    if (reason === 'validation') return isAr
      ? 'رفض الخادم البيانات. راجع الحقول قبل إعادة الإرسال.'
      : 'The server rejected the form. Check the fields before trying again.';
    return isAr
      ? 'لم يصل تأكيد الاستلام. تحقّق مع الفريق قبل إعادة الإرسال لتجنّب تكرار الطلب.'
      : 'Receipt could not be confirmed. Check with the team before resending to avoid a duplicate.';
  };

  const fallback = !configured || failure !== null;
  const draftMessage = () => buildRfqMessage(formData, language);
  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftMessage());
      setCopyStatus('copied');
    } catch {
      setCopyStatus('manual');
    }
  };

  return (
    <section id="contact" className="py-16 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <SectionHeading
          className="mb-12"
          eyebrow={isAr ? 'قنوات التواصل وطلب عروض الأسعار' : 'Technical enquiries and quotation'}
          title={
            isAr
              ? 'تواصل مع الفريق الفني أو اطلب عرض سعر'
              : 'Contact Technical Operations or Submit an RFQ'
          }
          description={
            isAr
              ? 'شارك نطاق العمل وموقعه علشان الفريق الفني يقدر يراجع طلبك ويحدد الخطوات التالية.'
              : 'Share your scope and location so the technical team can review your request and advise on next steps.'
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Contact Cards & Addresses */}
          <div className="lg:col-span-5 space-y-5">
            {/* Maadi Head Office */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'المقر الرئيسي (القاهرة)' : 'Corporate Headquarters (Cairo)'}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {INSCO_COMPANY_DATA.contacts.headOffice[language]}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="text-[11px] font-mono text-cyan-400 uppercase">
                  {isAr ? 'الورش المركزية والمخازن:' : 'Central Maintenance Workshops:'}
                </div>
                <div className="mt-0.5 text-slate-300">
                  {INSCO_COMPANY_DATA.contacts.workshops[language]}
                </div>
              </div>
            </div>

            {/* Direct Phone Lines & WhatsApp */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'أرقام التواصل الفني' : 'Technical contact numbers'}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {isAr ? 'تنسيق العمليات الميدانية والانتشار' : 'Site dispatch & mobilization coordination'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {INSCO_COMPANY_DATA.contacts.phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-slate-200">
                    <span>{phone}</span>
                    <a
                      href={`tel:${phone.replace(/\s+/g, '')}`}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      {isAr ? 'اتصال مباشر' : 'Call'}
                    </a>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'واتساب الإدارة الميدانية:' : 'Operations WhatsApp:'}</span>
                </div>
                <a
                  href={`https://wa.me/${INSCO_COMPANY_DATA.contacts.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {INSCO_COMPANY_DATA.contacts.whatsapp}
                </a>
              </div>
            </div>

            {/* Email & Dispatch SLA */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'البريد الرسمي للمراسلات' : 'Official Communications'}
                  </h3>
                  <a
                    href={`mailto:${INSCO_COMPANY_DATA.contacts.email}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    {INSCO_COMPANY_DATA.contacts.email}
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Interactive RFQ Form */}
          <div id="rfq" className="lg:col-span-7">
            <div
              className={`rounded-xl border bg-slate-950 p-6 sm:p-8 space-y-6 transition ${
                quickQuoteActive ? 'border-cyan-500/70' : 'border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isAr ? 'طلب عرض سعر / اعتماد في سجل الموردين' : 'Formal RFQ & Vendor Prequalification Form'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr
                      ? 'اكتب فقط المعلومات اللازمة للتسعير. لا تُدرج مستندات هوية أو بيانات سرّية في هذا النموذج.'
                      : 'Share only what is needed for the quote. Do not include identity documents or confidential information.'}
                  </p>
                </div>
                {quickQuoteActive && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    {isAr ? 'وضع التسعير السريع مفعل' : 'Express Quote Ready'}
                  </span>
                )}
              </div>

              {submittedRef ? (
                <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 ref={receiptHeading} tabIndex={-1} className="text-base font-bold text-white">
                    {isAr ? 'تم استلام طلبكم بنجاح' : 'RFQ Successfully Received'}
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    {isAr
                      ? 'رقم المتابعة مع فريق التسعير:'
                      : 'Reference to use when following up with the tender desk:'}{' '}
                    <bdi className="break-all font-mono">{submittedRef}</bdi>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedRef(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    {isAr ? 'إرسال طلب جديد' : 'Submit Another Request'}
                  </button>
                </div>
              ) : (
                <form onSubmit={event => { event.preventDefault(); void sendRequest(); }} className="space-y-4">
                  <div hidden aria-hidden="true">
                    <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </div>
                  {(errorMessage || failure || !configured) && (
                    <p role={configured ? 'alert' : undefined} className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-slate-900 p-3 text-xs leading-relaxed text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {errorMessage ?? failureMessage(failure ?? 'not_configured')}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rfq-company-input" className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'اسم الشركة / المقاول *' : 'Company / Contractor Name *'}
                      </label>
                      <input
                        id="rfq-company-input"
                        type="text"
                        required
                        maxLength={RFQ_FIELD_LIMITS.companyName}
                        autoComplete="organization"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder={isAr ? 'مثال: شركة بترول خليج السويس' : 'e.g., Petrobel / Eni / Orascom'}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="rfq-person" className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'اسم المسؤول / المسمى الوظيفي' : 'Contact Person & Title'}
                      </label>
                      <input
                        type="text"
                        id="rfq-person"
                        maxLength={RFQ_FIELD_LIMITS.contactName}
                        autoComplete="name"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder={isAr ? 'م. أحمد سعيد - مدير المشروع' : 'Eng. John Smith - Project Director'}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rfq-phone" className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'رقم الهاتف للتواصل الميداني *' : 'Mobile / Direct Phone *'}
                      </label>
                      <input
                        type="tel"
                        required
                        id="rfq-phone"
                        maxLength={RFQ_FIELD_LIMITS.phone}
                        autoComplete="tel"
                        dir="ltr"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+20 100 ..."
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="rfq-email" className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'البريد الإلكتروني المؤسسي *' : 'Corporate Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        id="rfq-email"
                        maxLength={RFQ_FIELD_LIMITS.email}
                        autoComplete="email"
                        dir="ltr"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contracts@company.com"
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rfq-service" className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'نوع الخدمة المطلوبة' : 'Primary Service Needed'}
                      </label>
                      <select
                        id="rfq-service"
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="pwht">{isAr ? 'معالجة حرارية بعد اللحام (PWHT)' : 'Post-Weld Heat Treatment (PWHT)'}</option>
                        <option value="ut_paut">{isAr ? 'فحص بالموجات فوق الصوتية (UT / PAUT)' : 'Ultrasonic & Phased Array (UT/PAUT)'}</option>
                        <option value="rt_gamma">{isAr ? 'فحص إشعاعي جاما / أشعة سينية (RT)' : 'Industrial Radiography Gamma/X-Ray (RT)'}</option>
                        <option value="mt_pt">{isAr ? 'فحوصات سطحية (MT / PT / VT)' : 'Surface Testing (MT/PT/VT)'}</option>
                        <option value="pmi_hardness">{isAr ? 'تحليل سبائك واختبار صلادة (PMI / HT)' : 'Alloy Analysis PMI & Hardness HT'}</option>
                        <option value="hydro">{isAr ? 'اختبار هيدروستاتيكي للضغوط العالية (HYDRO)' : 'Hydrostatic High-Pressure Testing'}</option>
                        <option value="manpower">{isAr ? 'توريد عمالة لحام وتفتيش معتمدة' : 'Welder & QC Manpower Supply'}</option>
                        <option value="prequal">{isAr ? 'طلب تسجيل إنسكو في سجل الموردين المعتمدين' : 'Approved Vendor List (AVL) Registration'}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="rfq-location" className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'موقع المشروع / المحافظة' : 'Job Site / Location'}
                      </label>
                      <input
                        type="text"
                        id="rfq-location"
                        maxLength={RFQ_FIELD_LIMITS.projectLocation}
                        value={formData.projectLocation}
                        onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                        placeholder={isAr ? 'مثال: العين السخنة، حقل ظهر، الإسكندرية' : 'e.g. Ain Sokhna, Alexandria yard'}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rfq-scope" className="block text-xs font-medium text-slate-300 mb-1">
                      {isAr ? 'تفاصيل المواصفات الفنية أو حجم الأعمال' : 'Technical Specifications / Project Scope'}
                    </label>
                    <textarea
                      rows={3}
                      id="rfq-scope"
                      maxLength={RFQ_FIELD_LIMITS.description}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={isAr ? 'القطر، نوع المعدن، الكود المرجعي (ASME B31.3, AWS D1.1)...' : 'Pipe diameter, material grade, code (ASME B31.3, AWS D1.1)...'}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                    />
                  </div>

                  {configured && failure !== 'not_configured' && <div className="pt-2">
                    <button
                      type="submit"
                      disabled={sending}
                      aria-busy={sending}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-sky-300 hover:bg-sky-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition shadow-sm cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {sending
                          ? (isAr ? 'جارٍ إرسال الطلب…' : 'Sending your request…')
                          : (isAr ? 'إرسال طلب التسعير' : 'Submit Request to Technical Team')}
                      </span>
                    </button>
                  </div>}
                  {fallback && <div className="space-y-3 border-t border-slate-800 pt-4 text-sm text-slate-300">
                    <p>{isAr
                      ? 'يمكنك نسخ المسودة ولصقها في رسالة ترسلها بنفسك. فتح البريد أو واتساب لا يرسل الطلب تلقائيًا.'
                      : 'Copy the draft and paste it into a message you send yourself. Opening email or WhatsApp does not submit the request.'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => { void copyDraft(); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold hover:bg-slate-800">
                        <Copy className="h-4 w-4" aria-hidden="true" />{isAr ? 'نسخ مسودة الطلب' : 'Copy request draft'}
                      </button>
                      <a href={`mailto:${INSCO_COMPANY_DATA.contacts.email}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold hover:bg-slate-800">
                        <Mail className="h-4 w-4" aria-hidden="true" />{isAr ? 'إرسال بالبريد الإلكتروني' : 'Open email'}
                      </a>
                      <a href={`https://wa.me/${INSCO_COMPANY_DATA.contacts.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-bold hover:bg-slate-800">
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />{isAr ? 'إرسال واتساب' : 'Open WhatsApp'}
                      </a>
                    </div>
                    {copyStatus === 'copied' && <p role="status">{isAr ? 'تم نسخ المسودة. لم يُرسَل الطلب.' : 'Draft copied. Nothing was sent.'}</p>}
                    {copyStatus === 'manual' && <label className="block text-xs">
                      {isAr ? 'انسخ النص التالي يدويًا:' : 'Copy this text manually:'}
                      <textarea readOnly value={draftMessage()} rows={4} className="mt-1 w-full rounded bg-slate-900 p-2" />
                    </label>}
                  </div>}
                </form>
              )}
            </div>
          </div>
        </div>
        {toolsSlot}
      </div>
    </section>
  );
};
