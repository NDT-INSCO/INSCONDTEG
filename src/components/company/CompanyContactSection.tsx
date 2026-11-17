import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { Phone, Mail, MapPin, Send, CheckCircle2, MessageSquare, Clock, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { RFQ_QUICK_ACTION_EVENT, RfqQuickActionDetail } from './CompanyQuickActionsSection';
import {
  buildRfqMailto,
  buildRfqPayload,
  buildRfqWhatsApp,
  submitRfq,
  type RfqFailureReason,
} from '../../rfq/submit';

interface CompanyContactSectionProps {
  language: Language;
  /** Testing seam: lets a test drive the network outcome without a server. */
  submitRequest?: typeof submitRfq;
}

export const CompanyContactSection: React.FC<CompanyContactSectionProps> = ({
  language,
  submitRequest,
}) => {
  const isAr = language === 'ar';
  const sendToServer = submitRequest ?? submitRfq;

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    serviceType: 'pwht',
    projectLocation: '',
    description: '',
  });

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quickQuoteActive, setQuickQuoteActive] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [failure, setFailure] = useState<{ reason: RfqFailureReason; detail?: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleQuickAction = (event: Event) => {
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

  const sendRequest = async () => {
    if (sending) return;
    if (!formData.companyName.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setErrorMessage(
        isAr
          ? 'يرجى استيفاء اسم الشركة، ورقم الهاتف، والبريد الإلكتروني.'
          : 'Please enter company name, contact phone, and email.'
      );
      return;
    }

    setErrorMessage(null);
    setFailure(null);
    setSending(true);
    const payload = buildRfqPayload(formData, language, {
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    });
    const outcome = await sendToServer(payload);
    setSending(false);

    if (outcome.status === 'sent') {
      // Reference comes from the server that stored the request.
      setSubmittedRef(outcome.reference);
      return;
    }
    // Nothing is claimed as received: keep the form, explain, and offer a
    // channel that a human actually reads.
    setFailure({ reason: outcome.reason, detail: outcome.detail });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendRequest();
  };

  const failureMessage = (reason: RfqFailureReason, detail?: string): string => {
    if (isAr) {
      if (reason === 'not_configured') {
        return 'الإرسال المباشر من الموقع غير مُهيّأ بعد، ولم يُسجَّل طلبك في أي مكان. استخدم الأزرار أدناه ليصل طلبك إلى فريق التسعير الآن (نفس البيانات مكتوبة مسبقًا).';
      }
      if (reason === 'network') {
        return 'تعذّر الوصول إلى خادم الطلبات (شبكة أو مهلة اتصال). لم يُسجَّل الطلب بعد، ويمكنك إعادة المحاولة.';
      }
      if (reason === 'validation') {
        return 'بيانات الطلب غير مكتملة أو غير صحيحة، ولم يُسجَّل. راجع الحقول وأعد المحاولة.';
      }
      return 'تعذّر تسجيل الطلب على الخادم، ولم يُسجَّل بعد. أعد المحاولة أو استخدم البريد/واتساب.';
    }
    if (reason === 'not_configured') {
      return 'Online submission is not configured on this deployment, so your request was not registered. Use the buttons below to reach the tender team now — your details are pre-filled.';
    }
    if (reason === 'network') {
      return 'The request server could not be reached (network or timeout). Nothing was registered — please retry.';
    }
    if (reason === 'validation') {
      return 'The request was rejected as incomplete, and nothing was registered. Check the fields and retry.';
    }
    return 'The server could not register the request. Retry, or use email/WhatsApp.';
  };

  const mailtoHref = buildRfqMailto(formData, INSCO_COMPANY_DATA.contacts.email, language);
  const whatsappHref = buildRfqWhatsApp(formData, INSCO_COMPANY_DATA.contacts.whatsapp, language);

  return (
    <section id="contact" className="py-16 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
            {isAr ? 'قنوات التواصل وطلب عروض الأسعار' : 'Direct Dispatch & RFQ Portal'}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {isAr
              ? 'تواصل مع الإدارة الفنية أو اطلب اعتماد مورد فوري'
              : 'Contact Technical Operations or Submit an RFQ'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {isAr
              ? 'فريق العمليات متواجد على مدار 24 ساعة للاستجابة لمواقع الطوارئ، التوريد العاجل لوحدات المعالجة الحرارية، وفحوصات الصيانة الدورية.'
              : 'Our operations team is on call 24/7 to mobilize PWHT fleets and certified NDT personnel to refinery shutdowns and emergency outages.'}
          </p>
        </div>

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
                    {isAr ? 'أرقام الطوارئ والتكليفات (24/7)' : 'Operations Hotline (24/7)'}
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

              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  {isAr
                    ? 'متوسط الرد على عروض الأسعار: أقل من 4 ساعات عمل'
                    : 'Average commercial response time: Under 4 working hours'}
                </span>
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
                      ? 'سيتم مراجعة الطلب بواسطة رئيس قطاع العمليات الفنية والرد بملف التسعير ومستندات التأهيل.'
                      : 'Your request will be assigned directly to our Technical Operations Director for commercial quotation.'}
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
                  <h4 className="text-base font-bold text-white">
                    {isAr ? 'تم استلام طلبكم بنجاح' : 'RFQ Successfully Received'}
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    {isAr
                      ? `تم تسجيل طلبكم لدى فريق التسعير تحت الكود المرجعي (${submittedRef}) وإرسال إشعار بريدي. سيتواصل معكم مهندس العمليات خلال ساعات.`
                      : `Your request was registered with the tender desk under reference (${submittedRef}) and a notification was emailed. Our lead project engineer will contact you shortly.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRef(null);
                      setFormData({
                        companyName: '',
                        contactName: '',
                        phone: '',
                        email: '',
                        serviceType: 'pwht',
                        projectLocation: '',
                        description: '',
                      });
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    {isAr ? 'إرسال طلب جديد' : 'Submit Another Request'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {(errorMessage || failure) && (
                    <div
                      role="alert"
                      className={`p-4 rounded-lg border text-xs space-y-3 ${
                        failure?.reason === 'not_configured'
                          ? 'bg-amber-950/30 border-amber-700 text-amber-100'
                          : 'bg-red-950/30 border-red-800 text-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errorMessage ?? (failure ? failureMessage(failure.reason, failure.detail) : '')}</span>
                      </div>
                      {failure && (
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={mailtoHref}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold hover:border-cyan-500 transition"
                          >
                            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'إرسال بالبريد الإلكتروني' : 'Send by email'}</span>
                          </a>
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold hover:border-emerald-500 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'إرسال واتساب' : 'Send on WhatsApp'}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => { setFailure(null); void sendRequest(); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-semibold hover:border-cyan-500 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
                          </button>
                        </div>
                      )}
                    </div>
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
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder={isAr ? 'مثال: شركة بترول خليج السويس' : 'e.g., Petrobel / Eni / Orascom'}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'اسم المسؤول / المسمى الوظيفي' : 'Contact Person & Title'}
                      </label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder={isAr ? 'م. أحمد سعيد - مدير المشروع' : 'Eng. John Smith - Project Director'}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'رقم الهاتف للتواصل الميداني *' : 'Mobile / Direct Phone *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+20 100 ..."
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'البريد الإلكتروني المؤسسي *' : 'Corporate Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contracts@company.com"
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'نوع الخدمة المطلوبة' : 'Primary Service Needed'}
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="pwht">{isAr ? 'معالجة حرارية بعد اللحام (PWHT - 16 وحدة)' : 'Post-Weld Heat Treatment (PWHT - 16 Units)'}</option>
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
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {isAr ? 'موقع المشروع / المحافظة' : 'Job Site / Location'}
                      </label>
                      <input
                        type="text"
                        value={formData.projectLocation}
                        onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                        placeholder={isAr ? 'مثال: العين السخنة، حقل ظهر، الإسكندرية' : 'e.g. Ain Sokhna, Alexandria yard'}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {isAr ? 'تفاصيل المواصفات الفنية أو حجم الأعمال' : 'Technical Specifications / Project Scope'}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={isAr ? 'القطر، نوع المعدن، الكود المرجعي (ASME B31.3, AWS D1.1)...' : 'Pipe diameter, material grade, code (ASME B31.3, AWS D1.1)...'}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={sending}
                      aria-busy={sending}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {sending
                          ? (isAr ? 'جارٍ إرسال الطلب…' : 'Sending your request…')
                          : (isAr ? 'إرسال طلب التسعير المعتمد' : 'Submit Request to Technical Team')}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
