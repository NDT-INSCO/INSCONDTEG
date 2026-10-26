import React from 'react';
import { Language } from '../../types';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';
import { FileText, Download, ShieldCheck, CheckCircle2, ExternalLink } from 'lucide-react';

interface CompanyVendorVaultSectionProps {
  language: Language;
}

export const CompanyVendorVaultSection: React.FC<CompanyVendorVaultSectionProps> = ({
  language,
}) => {
  const isAr = language === 'ar';

  const prequalChecklist = [
    { ar: 'السجل التجاري والبطاقة الضريبية سارية', en: 'Valid Commercial Registration & Tax Card' },
    { ar: 'شهادات الأيزو الثلاثية المعتمدة (9001 / 14001 / 45001)', en: 'Triple ISO Accredited Certificates (9001/14001/45001)' },
    { ar: 'شهادة المدقق الرئيسي CQI-IRCA المعتمد', en: 'CQI-IRCA Lead Auditor Credential' },
    { ar: 'شهادات مؤهلات وتراخيص مهندسي ASNT Level II / III', en: 'Certified ASNT Level II & III Inspector Credentials' },
    { ar: 'تراخيص هيئة الرقابة النووية والإشعاعية (ENRRA)', en: 'ENRRA Industrial Radiation Source Licenses' },
    { ar: 'شهادات معايرة الأجهزة المجددة دورياً طبقا لـ NIST', en: 'Traceable Equipment Calibration Certificates' },
    { ar: 'سجل سابقة أعمال معتمدة وأوامر توريد مشروعات كبرى', en: 'Verified Track Record & Major Project Work Orders' },
    { ar: 'سياسة السلامة والصحة المهنية والبيئة (HSE Manual)', en: 'Comprehensive Corporate HSE & QA/QC Manual' },
  ];

  return (
    <section id="vault" className="py-16 border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
            {isAr ? 'خزينة وثائق التأهيل والكتالوج الرسمي' : 'Vendor Vault & Evidence Annexes'}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {isAr
              ? 'ملف التأهيل الفني والبروشور المعتمد (50 صفحة)'
              : 'Complete 50-Page Vendor Prequalification Dossier'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {isAr
              ? 'يمكن لفرق المشتريات والمشروعات تحميل البروشور الرسمي بصيغة PDF ومراجعة الملاحق الثبوتية كاملة من شهادات الأيزو وتراخيص الأجهزة وسوابق الأعمال.'
              : 'Procurement and QA/QC committees can directly download the master corporate profile PDF containing the full catalogue of evidence annexes.'}
          </p>
        </div>

        {/* Master PDF Download Card */}
        <div className="mb-14 rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900 to-cyan-950/30 p-8 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <FileText className="w-4 h-4" />
                <span>{INSCO_COMPANY_DATA.docRef} · {INSCO_COMPANY_DATA.revision}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isAr
                  ? 'بروشور وملف سابقة الأعمال الرسمية لشركة إنسكو (PDF)'
                  : 'Official INSCO Corporate Profile & Track Record Dossier (PDF)'}
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? 'ملف رسمي شامل يضم الرؤية، المعدات المملوكة (16 وحدة معالجة حرارية وأجهزة كراوتكرامر وأوليمبوس)، كشوفات المشاريع، والسير الذاتية لكوادر التفتيش.'
                  : 'Comprehensive 50-page dossier detailing executive governance, owned fleet (16 PWHT units, Olympus/Krautkramer systems), major project contracts, and engineer qualification registers.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                  download="INSCO_Company_Profile_2026.pdf"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition shadow-sm"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'تحميل الملف كاملاً (PDF مباشر)' : 'Download Full PDF (50 Pages)'}</span>
                </a>

                <a
                  href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'معاينة في تبويب جديد' : 'Open in New Tab'}</span>
                </a>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 font-mono text-xs text-slate-300">
              <div className="text-slate-400 font-bold uppercase pb-1 border-b border-slate-800">
                {isAr ? 'بيانات الوثيقة المعتمدة' : 'Dossier Meta'}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'عدد الصفحات:' : 'Pages:'}</span>
                <span className="text-cyan-400 font-bold">50 صفحة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'تاريخ الإصدار:' : 'Issue Date:'}</span>
                <span className="text-slate-200">05 OCT 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'الإصدار:' : 'Revision:'}</span>
                <span className="text-slate-200">Rev. 05</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'اعتماد إيجاك:' : 'EGAC CAB:'}</span>
                <span className="text-cyan-400 font-bold">#120007</span>
              </div>
            </div>
          </div>
        </div>

        {/* Annexes A to E Catalog Grid */}
        <div className="space-y-6 mb-14">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isAr ? 'فهرس الملاحق الثبوتية (Annexes A - E)' : 'Index of Certified Evidence Annexes'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? 'أرقام الصفحات المباشرة في ملف الـ PDF المرفق' : 'Direct page markers within the 50-page PDF document'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {INSCO_COMPANY_DATA.annexes.map((annex) => (
              <div
                key={annex.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {annex.code}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {isAr ? `صفحة ${annex.pageNo}` : `Page ${annex.pageNo}`}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {annex.title[language]}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {annex.summary[language]}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>{annex.issuingBody}</span>
                  <a
                    href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {isAr ? 'انتقل للصفحة' : 'Jump'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Pre-qualification Submission Checklist */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
              {isAr ? 'قائمة التحقق لاعتماد الموردين' : 'Vendor Registration Ready-Pack'}
            </div>
            <h3 className="text-xl font-bold text-white">
              {isAr
                ? 'جاهزية كاملة لمتطلبات التسجيل بسجلات الموردين'
                : '100% Pre-Packaged Compliance for Approved Vendor Lists (AVL)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'توفر إنسكو كافة الوثائق القانونية والفنية والمالية المطلوبة من إدارات العقود والمشتريات.'
                : 'INSCO maintains pre-compiled compliance packages ready for corporate procurement evaluations.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {prequalChecklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{item[language]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
