import React, { useState, useMemo } from 'react';
import {
  Zap,
  Send,
  Download,
  CheckCircle2,
  BookOpen,
  Clock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Language } from '../../types';
import {
  downloadTrainingSyllabus,
  getSyllabusSummaryStats,
} from '../../utils/trainingSyllabusGenerator';

export const RFQ_QUICK_ACTION_EVENT = 'insco:rfq-quick-action';

export interface RfqQuickActionDetail {
  serviceType?: string;
  projectLocation?: string;
  description?: string;
}

export interface CompanyQuickActionsSectionProps {
  language: Language;
  onRequestQuote?: (serviceType?: string) => void;
  onOpenCurriculum?: () => void;
  /**
   * The two cards used to sit together on the landing page, mixing a commercial
   * action with a training asset. The audit asked to separate the two paths, so
   * the RFQ section renders `quote` and the academy renders `syllabus`.
   */
  mode?: 'both' | 'quote' | 'syllabus';
}

export const CompanyQuickActionsSection: React.FC<CompanyQuickActionsSectionProps> = ({
  language,
  onRequestQuote,
  onOpenCurriculum,
  mode = 'both',
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const syllabusStats = useMemo(() => getSyllabusSummaryStats(), []);

  const [quoteTriggeredService, setQuoteTriggeredService] = useState<string | null>(null);
  const [downloadedFilename, setDownloadedFilename] = useState<string | null>(null);

  const handleOneClickQuote = (serviceType?: string) => {
    setQuoteTriggeredService(serviceType ?? 'general');

    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<RfqQuickActionDetail>(RFQ_QUICK_ACTION_EVENT, {
          detail: { serviceType },
        })
      );
    }

    if (onRequestQuote) {
      onRequestQuote(serviceType);
    } else if (typeof document !== 'undefined') {
      const rfqEl = document.getElementById('rfq');
      if (rfqEl && typeof rfqEl.scrollIntoView === 'function') {
        rfqEl.scrollIntoView({ behavior: 'smooth' });
      }
    }

    if (typeof document !== 'undefined') {
      const companyInput = document.getElementById('rfq-company-input') as HTMLInputElement | null;
      if (companyInput && typeof companyInput.focus === 'function') {
        companyInput.focus({ preventScroll: true });
      }
    }
  };

  const handleOneClickDownloadSyllabus = () => {
    const generated = downloadTrainingSyllabus(language);
    setDownloadedFilename(generated.filename);
  };

  const servicePresets: readonly { id: string; label: { ar: string; en: string } }[] = [
    { id: 'pwht', label: { ar: 'معالجة حرارية PWHT', en: 'PWHT Fleet' } },
    { id: 'ut_paut', label: { ar: 'فحص UT / PAUT', en: 'UT / PAUT' } },
    { id: 'rt_gamma', label: { ar: 'تصوير جاما وإكس راي RT', en: 'Gamma & X-Ray RT' } },
    { id: 'prequal', label: { ar: 'تأهيل موردين AVL', en: 'Vendor Prequal' } },
  ];

  return (
    <section
      id="quick-actions"
      aria-labelledby="quick-actions-heading"
      className="py-10 border-b border-slate-800 bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {mode === 'syllabus'
                  ? isAr ? 'الأكاديمية · المنهج التدريبي' : 'Academy · Training syllabus'
                  : isAr ? 'تجهيز طلب عرض سعر' : 'Quote request presets'}
              </span>
            </div>
            <h2
              id="quick-actions-heading"
              className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1"
            >
              {mode === 'syllabus'
                ? isAr
                  ? 'المنهج التدريبي بنقرة واحدة'
                  : 'Training syllabus in one click'
                : mode === 'quote'
                  ? isAr
                    ? 'ابدأ طلب عرض سعر باختيار الخدمة'
                    : 'Start a quote request by service'
                  : isAr
                    ? 'الوصول المباشر بنقرة واحدة للتسعير التجاري والمنهج التدريبي'
                    : 'Quote presets and training syllabus'}
            </h2>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
            <span>
              {mode === 'syllabus'
                ? (isAr ? 'للتعلّم الذاتي، وليس اعتمادًا مهنيًا' : 'Self-study, not professional certification')
                : (isAr ? 'يساعدك في تجهيز نطاق طلبك' : 'Prepare your project scope')}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-5 ${mode === 'both' ? 'lg:grid-cols-2' : 'max-w-3xl'}`}>
          {/* Action Card 1: One-Click Request Quote */}
          {mode !== 'syllabus' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-mono text-cyan-400 tabular-nums">
                {isAr
                  ? 'التعاقدات والعمليات الميدانية'
                  : 'Project enquiries'}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white">
                {isAr
                  ? 'اختار نطاق الفحص أو المعالجة المطلوب'
                  : 'Select the scope of inspection or heat treatment'}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? 'اختار نوع الخدمة لملء جزء من نموذج الطلب. الاختيار لا يرسل الطلب ولا يصدر عرض سعر.'
                  : 'Choose a service to prefill the request form. This does not send a request or issue a quote.'}
              </p>

              {/* Optional 1-click scope presets */}
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                {servicePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleOneClickQuote(preset.id)}
                    className="px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                  >
                    {preset.label[language]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="quick-action-request-quote"
                  onClick={() => handleOneClickQuote()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'طلب عرض سعر (Request Quote)' : 'Request Quote'}</span>
                  <ArrowIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              </div>

              {quoteTriggeredService && (
                <div
                  role="status"
                  className="flex items-center gap-2 text-xs font-mono text-emerald-400"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? 'نموذج طلب عرض السعر جاهز للمراجعة. لم يُرسل طلب.'
                      : 'Quote form ready to review. Nothing was submitted.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          )}

          {/* Action Card 2: One-Click Download Training Syllabus */}
          {mode !== 'quote' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-mono text-amber-400 tabular-nums">
                {syllabusStats.disciplineCount}{' '}
                {isAr ? 'تخصصات' : 'Disciplines'} · {syllabusStats.moduleCount}{' '}
                {isAr ? 'وحدة تدريبية' : 'Modules'} · {syllabusStats.totalTrainingHours}h{' '}
                {isAr ? 'تقديرية للتعلّم' : 'estimated study'}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white">
                {isAr
                  ? 'تحميل دليل المنهج التدريبي الكامل لأكاديمية إنسكو'
                  : 'INSCO Engineering Academy study syllabus'}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? 'حمّل خطة المقررات وساعات الدراسة التقديرية في UT وPAUT وRT وPWHT. لا تحل الخطة محل تدريب رسمي موثّق.'
                  : 'Download the print-ready master syllabus covering Level I, II, and III qualification hours, laboratory modules, and ASME/API code competencies in one click.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="quick-action-download-syllabus"
                  onClick={handleOneClickDownloadSyllabus}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? 'تحميل المنهج التدريبي (Download Training Syllabus)'
                      : 'Download Training Syllabus'}
                  </span>
                </button>

                {onOpenCurriculum && (
                  <button
                    type="button"
                    onClick={onOpenCurriculum}
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'تصفح المناهج تفاعلياً' : 'Explore Interactive Curricula'}</span>
                  </button>
                )}
              </div>

              {downloadedFilename && (
                <div
                  role="status"
                  className="flex items-center gap-2 text-xs font-mono text-emerald-400 tabular-nums"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? `تم تجهيز وتحميل الملف: ${downloadedFilename}`
                      : `Syllabus downloaded: ${downloadedFilename}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
};
