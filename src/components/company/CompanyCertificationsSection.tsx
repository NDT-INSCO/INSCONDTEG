import React from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { ShieldCheck, Award, FileCheck2, ExternalLink } from 'lucide-react';

interface CompanyCertificationsSectionProps {
  language: Language;
}

export const CompanyCertificationsSection: React.FC<CompanyCertificationsSectionProps> = ({
  language,
}) => {
  const isAr = language === 'ar';

  return (
    <section id="certifications" className="py-16 border-b border-slate-800 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
            {isAr ? 'الامتثال القياسي والتأهيل المؤسسي' : 'Accreditations, Compliance & Lead Audit'}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {isAr
              ? 'شهادات الجودة الثلاثية والاعتمادات الرسمية السارية حتى 2028'
              : 'Triple ISO Certifications & Formal Accreditations Valid to 2028'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {isAr
              ? 'نظام إدارة جودة متكامل وموثق تحت إشراف مدقق رئيسي معتمد دولياً من CQI-IRCA، وترخيص ممارسة الفحوصات الإشعاعية من هيئة الرقابة النووية والإشعاعية (ENRRA).'
              : 'An integrated QHSE management system governed by an in-house CQI-IRCA certified Lead Auditor, combined with ENRRA licensing for industrial radiography.'}
          </p>
        </div>

        {/* Triple ISO Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {INSCO_COMPANY_DATA.certifications.map(cert => (
            <div
              key={cert.id}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {cert.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {isAr ? 'حتى سبتمبر 2028' : 'Valid to Sept 2028'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {cert.title[language]}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {cert.scope[language]}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-1 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>{isAr ? 'رقم الشهادة:' : 'Cert No:'}</span>
                  <span className="text-slate-200">{cert.certNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'جهة الاعتماد:' : 'Accreditation:'}</span>
                  <span className="text-cyan-300 font-semibold">{cert.accreditationBody}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CQI-IRCA Lead Auditor & ENRRA Spotlight Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          {/* CQI-IRCA Lead Auditor */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  {INSCO_COMPANY_DATA.leadAuditor.title[language]}
                </h4>
                <div className="text-xs text-cyan-400 font-mono">
                  {INSCO_COMPANY_DATA.leadAuditor.body}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {INSCO_COMPANY_DATA.leadAuditor.scope[language]}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'الكود' : 'Course'}</div>
                <div className="font-bold text-slate-200">{INSCO_COMPANY_DATA.leadAuditor.courseNo}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'رقم الشهادة' : 'Cert #'}</div>
                <div className="font-bold text-slate-200">{INSCO_COMPANY_DATA.leadAuditor.certNo}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">{isAr ? 'رقم UDN' : 'UDN'}</div>
                <div className="font-bold text-cyan-400">{INSCO_COMPANY_DATA.leadAuditor.udn}</div>
              </div>
            </div>
          </div>

          {/* Radiation Safety & Nuclear Regulatory Licensing (ENRRA) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  {isAr
                    ? 'ترخيص هيئة الرقابة النووية والإشعاعية (ENRRA)'
                    : 'Egyptian Nuclear & Radiological Regulatory Authority (ENRRA)'}
                </h4>
                <div className="text-xs text-cyan-400 font-mono">
                  {isAr ? 'رخصة ممارسة رسمية للمصادر المشعة الصناعية' : 'Formal Practice License for Industrial Isotopes'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'تمتلك الشركة تراخيص معتمدة لتشغيل واستخدام مصادر جاما المشعة (Iridium-192 وSelenium-75) وأنابيب الأشعة السينية الصناعية (X-Ray Tubes)، مع وجود ضباط وقاية إشعاعية RSO معتمدين ومستودعات تخزين آمنة محصنة.'
                : 'Licensed for active industrial gamma radiation sources (Ir-192, Se-75) and high-kV X-ray directional tubes, with dedicated certified Radiation Safety Officers (RSO) and bunker storage.'}
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{isAr ? 'سجل NDT العالمي:' : 'ndt.org Global Registry:'}</span>
              <a
                href={INSCO_COMPANY_DATA.contacts.ndtOrgListingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold"
              >
                <span>ID: {INSCO_COMPANY_DATA.ndtOrgId}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Five Reasons Vendor Committees Say YES */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
              {isAr ? 'لماذا تختارنا لجان المشتريات والتأهيل؟' : 'Why Vendor Committees Approve INSCO'}
            </div>
            <h3 className="text-xl font-bold text-white">
              {isAr ? 'خمس ركائز حاسمة في اتخاذ قرار التعاقد' : 'Five Reasons Vendor Committees Say "YES"'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INSCO_COMPANY_DATA.fiveReasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-cyan-400">
                    0{reason.number}.
                  </span>
                  <h4 className="text-xs font-bold text-slate-200">
                    {reason.title[language]}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {reason.description[language]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
