import React from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { ShieldCheck, Award, FileCheck2, ExternalLink } from 'lucide-react';
import { SectionHeading } from '../ui/SectionHeading';

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
        <SectionHeading
          className="mb-12"
          eyebrow={isAr ? 'الجودة والتأهيل المؤسسي' : 'Quality and vendor qualification'}
          title={
            isAr
              ? 'الشهادات والتراخيص الواردة في ملف الشركة'
              : 'Certificates and licences in the company dossier'
          }
          description={
            isAr
              ? 'بيانات الشهادات من النسخة المنشورة من ملف إنسكو. تحقّق من سريانها ونطاقها مع الجهة المصدرة قبل التأهيل أو التعاقد.'
              : 'These records are from the published INSCO dossier. Confirm current status and scope with the issuing body before qualification or contracting.'
          }
        />

        {/* Triple ISO Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {INSCO_COMPANY_DATA.certifications.map((cert, index) => (
            <div
              key={cert.id}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {cert.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {isAr ? 'انتهاء مدوّن:' : 'Listed expiry:'} <bdi>{cert.expiryDate}</bdi>
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
                <a className="inline-flex min-h-9 items-center gap-1 font-semibold text-cyan-300 underline underline-offset-4"
                  href={`${INSCO_COMPANY_DATA.pdfBrochureUrl}#page=${15 + index}`} target="_blank" rel="noopener noreferrer">
                  {isAr ? `وثيقة ${cert.code} في الملف (PDF)` : `${cert.code} in the dossier (PDF)`}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
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

            <a href="#contact" className="inline-flex min-h-9 items-center text-xs font-semibold text-cyan-300 underline underline-offset-4">
              {isAr ? 'اطلب وثائق التأهيل الحالية' : 'Request current personnel qualifications'}
            </a>
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
                  {isAr ? 'المصدر: الملحق C في ملف الشركة' : 'Source: company dossier, Annex C'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'الملحق يفهرس وثائق التصوير الإشعاعي الصناعي؛ النسخ غير متاحة للعامة. اطلب الترخيص الحالي وتحقق من نطاقه قبل العمل.'
                : 'The annex indexes industrial radiography records. Request the current licence and confirm its scope; the scans are not distributed publicly.'}
            </p>

            <a className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-cyan-300 underline underline-offset-4"
              href="#contact">
              {isAr ? 'اطلب مستند الترخيص الحالي' : 'Request current licensing evidence'}
            </a>

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
              {isAr ? 'ملخص ملف الشركة' : 'Company profile summary'}
            </div>
            <h3 className="text-xl font-bold text-white">
              {isAr ? 'موضوعات للمراجعة عند التأهيل' : 'Items to review during qualification'}
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
