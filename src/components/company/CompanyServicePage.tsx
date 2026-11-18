import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, FileText, FlaskConical, PlayCircle } from 'lucide-react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { CtaButton } from '../ui/CtaButton';
import {
  SERVICE_FAMILIES,
  type ServiceFamily,
  type ServiceFamilyId,
} from '../../utils/serviceFamilies';

interface CompanyServicePageProps {
  language: Language;
  family: ServiceFamily;
  onBack: () => void;
  onOpenFamily: (id: ServiceFamilyId) => void;
  onRequestQuote: (serviceType: string) => void;
  onOpenDemo: (anchorId?: string) => void;
  onOpenAcademy: (tab?: string) => void;
}

/**
 * One shareable page per service family (`#services/ndt` …).
 *
 * It answers "does this apply to my asset?" before the form: the methods, the
 * reference codes, the equipment we own, and the proof — then a quote action
 * that opens the RFQ with the service already selected.
 */
export const CompanyServicePage: React.FC<CompanyServicePageProps> = ({
  language,
  family,
  onBack,
  onOpenFamily,
  onRequestQuote,
  onOpenDemo,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const methods = INSCO_COMPANY_DATA.ndtMethods.filter((method: { id: string }) =>
    family.methodIds.includes(method.id)
  );
  const companyServices = (family.companyServiceIds ?? [])
    .map(id => INSCO_COMPANY_DATA.services.find((service: { id: string }) => service.id === id))
    .filter(Boolean) as Array<{
    id: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    highlights: { ar: string; en: string }[];
  }>;

  return (
    <div className="space-y-0">
      <section id="top" className="pt-10 pb-12 border-b border-slate-800 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-cyan-950/25 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition cursor-pointer mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:hidden" />
            <ArrowRight className="w-3.5 h-3.5 ltr:hidden" />
            {isAr ? 'كل الخدمات' : 'All services'}
          </button>

          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
              {isAr ? 'عائلة خدمة' : 'Service family'} · {family.id.toUpperCase()}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {family.title[language]}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">{family.description[language]}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <CtaButton variant="primary" onClick={() => onRequestQuote(family.rfqServiceType)}>
                <FileText className="w-4 h-4" />
                {isAr ? 'اطلب عرض سعر لهذه الخدمة' : 'Request a quote for this service'}
              </CtaButton>
              {family.demoAnchorId && (
                <CtaButton variant="secondary" onClick={() => onOpenDemo(family.demoAnchorId)}>
                  <PlayCircle className="w-4 h-4" />
                  {isAr ? 'شاهد العرض الفني' : 'See it demonstrated'}
                </CtaButton>
              )}
              {family.academyTab && (
                <button
                  type="button"
                  onClick={() => onOpenAcademy(family.academyTab)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 text-sm font-semibold transition cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4" />
                  {isAr ? 'المعمل التدريبي' : 'Training lab'}
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {SERVICE_FAMILIES.map(other => (
              <button
                key={other.id}
                type="button"
                onClick={() => onOpenFamily(other.id)}
                aria-current={other.id === family.id ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  other.id === family.id
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {other.title[language]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            {isAr ? 'ما نغطّيه فعلياً' : 'What is actually covered'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {family.bullets.map(bullet => (
              <div key={bullet.en} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300 leading-relaxed">
                {bullet[language]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {methods.length > 0 && (
        <section className="py-12 border-b border-slate-800 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
              {isAr ? `الطرق المشمولة (${methods.length})` : `Included methods (${methods.length})`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {methods.map((method: {
                id: string;
                code: string;
                name: { ar: string; en: string };
                standards: string;
                category: { ar: string; en: string };
                description: { ar: string; en: string };
                equipment: { ar: string; en: string };
              }) => (
                <article key={method.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/30 rounded px-1.5 py-0.5">
                      {method.code}
                    </span>
                    <span className="text-[10px] text-slate-500">{method.category[language]}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{method.name[language]}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{method.description[language]}</p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div>
                      <span className="text-slate-500">{isAr ? 'الكود: ' : 'Code: '}</span>
                      <span className="font-mono" dir="ltr">{method.standards}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{isAr ? 'المعدات: ' : 'Equipment: '}</span>
                      {method.equipment[language]}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {companyServices.length > 0 && (
        <section className="py-12 border-b border-slate-800 bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {companyServices.map(service => (
              <article key={service.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-2">
                <h3 className="text-sm font-bold text-white">{service.title[language]}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{service.description[language]}</p>
                <ul className="space-y-1 pt-2">
                  {service.highlights.map(highlight => (
                    <li key={highlight.en} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{highlight[language]}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="py-10 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-400 max-w-xl">
            {isAr
              ? 'عرض السعر الرسمي يصدر من قطاع العمليات الفنية بعد مراجعة نطاق العمل؛ متوسط الرد أقل من 4 ساعات عمل.'
              : 'The official quote is issued by technical operations after scope review; average response under 4 working hours.'}
          </p>
          <CtaButton variant="primary" size="sm" onClick={() => onRequestQuote(family.rfqServiceType)}>
            {isAr ? 'اطلب عرض سعر' : 'Request a quote'}
            <ArrowIcon className="w-3.5 h-3.5" />
          </CtaButton>
        </div>
      </section>
    </div>
  );
};
