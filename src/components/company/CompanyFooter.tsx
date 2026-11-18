import React from 'react';
import { Award, BriefcaseBusiness, Building2, FileText, GraduationCap, Mail, Phone, ShieldCheck } from 'lucide-react';
import type { Language } from '../../types';
import { AdminKey } from '../admin/AdminKey';
import { INSCO_COMPANY_DATA } from '../../data/inscoCompanyData';

interface CompanyFooterProps {
  language: Language;
  /** Jump to a section of the corporate profile. */
  onOpenSection: (sectionId: string) => void;
  onOpenDemo: () => void;
  /** Opens the academy portal. */
  onOpenAcademy: () => void;
  /** Opens the client & dossier portal. */
  onOpenClient?: () => void;
  /** Opens the password-protected admin portal. */
  onOpenAdmin?: () => void;
}

/**
 * The corporate footer.
 *
 * It used to carry a column of academy modules, which made the buyer's page look
 * like a training catalogue and blurred the two portals. The column is now the
 * evidence a procurement or QA reviewer actually looks for (accreditations,
 * qualifications dossier, track record, brochure), and the academy/client doors appear separately.
 */
export const CompanyFooter: React.FC<CompanyFooterProps> = ({
  language,
  onOpenSection,
  onOpenDemo,
  onOpenAcademy,
  onOpenClient,
  onOpenAdmin,
}) => {
  const isAr = language === 'ar';

  const evidence: { ar: string; en: string; sectionId?: string; action?: () => void }[] = [
    { ar: 'الاعتمادات وشهادات ISO', en: 'Accreditations & ISO', sectionId: 'certifications' },
    { ar: 'ملف تأهيل المورد', en: 'Vendor qualification dossier', sectionId: 'vault' },
    { ar: 'سابقة الأعمال والمشروعات', en: 'Track record & projects', sectionId: 'projects' },
    { ar: 'أسطول وحدات PWHT', en: 'PWHT fleet & equipment', sectionId: 'fleet-inspector' },
    { ar: 'العرض الفني التفاعلي', en: 'Technical demonstrations', action: onOpenDemo },
  ];

  return (
    <footer
      id="company-footer"
      className="border-t border-slate-800 bg-slate-950 pt-12 pb-8 text-xs text-slate-400"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Column 1: Brand & registrations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-base">
              <Building2 className="w-5 h-5 shrink-0 text-cyan-400" aria-hidden="true" />
              {/* The admin door sits against the legal name: one small key for
                  the owner, invisible to a buyer comparing suppliers. */}
              <span className="min-w-0 truncate">{INSCO_COMPANY_DATA.name[language]}</span>
              <AdminKey language={language} onOpen={onOpenAdmin} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {INSCO_COMPANY_DATA.subSlogan[language]}
            </p>
            <div className="space-y-1 font-mono text-[11px] text-slate-400">
              <div>{isAr ? 'سجل تجاري:' : 'CR:'} {INSCO_COMPANY_DATA.commercialRegistrationNo}</div>
              <div>{isAr ? 'تأسيس رقم:' : 'Incorporation:'} {INSCO_COMPANY_DATA.incorporationNo}</div>
              <div>{isAr ? 'كود إيجاك:' : 'EGAC CAB:'} {INSCO_COMPANY_DATA.egacCabNo}</div>
              <div>{isAr ? 'سجل NDT العالمي:' : 'ndt.org:'} #{INSCO_COMPANY_DATA.ndtOrgId}</div>
            </div>
          </div>

          {/* Column 2: core capabilities */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {isAr ? 'خدمات الشركة المعتمدة' : 'Core capabilities'}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>{isAr ? 'معالجة حرارية بعد اللحام (16 وحدة PWHT)' : 'PWHT Heat Treatment (16 Units)'}</li>
              <li>{isAr ? 'فحوصات حجمية (UT, PAUT, RT إشعاعي)' : 'Volumetric NDT (UT, PAUT, RT)'}</li>
              <li>{isAr ? 'فحوصات سطحية (MT, PT, VT, Coating)' : 'Surface NDT (MT, PT, VT)'}</li>
              <li>{isAr ? 'تحليل سبائك واختبار صلادة (PMI, Hardness)' : 'Positive Material ID (PMI & Hardness)'}</li>
              <li>{isAr ? 'اختبارات هيدروستاتيكية وتوريد عمالة' : 'Hydrostatic Testing & Manpower'}</li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenSection('rfq')}
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-4 transition cursor-pointer"
                >
                  {isAr ? 'اطلب عرض سعر لاحتياجك' : 'Request a quote'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: the evidence */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              <span>{isAr ? 'ملف الاعتماد والتأهيل' : 'Compliance & qualification'}</span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {evidence.map(item => (
                <li key={item.en}>
                  <button
                    type="button"
                    onClick={() => (item.action ? item.action() : onOpenSection(item.sectionId!))}
                    className="hover:text-cyan-400 transition cursor-pointer text-start"
                  >
                    {isAr ? item.ar : item.en}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onOpenAcademy}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:border-amber-500/50 transition cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isAr ? 'مهندس أو متدرّب؟ بوابة الأكاديمية' : 'Engineer or trainee? Academy portal'}
              </span>
            </button>
            {onOpenClient && (
              <button
                type="button"
                onClick={onOpenClient}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:border-emerald-400/60 transition cursor-pointer"
              >
                <BriefcaseBusiness className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {isAr ? 'عميل حالي؟ بوابة العملاء والتقارير' : 'Client? Client & Dossier Portal'}
                </span>
              </button>
            )}
          </div>

          {/* Column 4: contact & brochure */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {isAr ? 'التواصل المباشر والبروشور' : 'Direct dispatch & PDF'}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                <span className="font-mono">{INSCO_COMPANY_DATA.contacts.phones[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                <span className="font-mono">{INSCO_COMPANY_DATA.contacts.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                <span>ISO 9001 · ISO 14001 · ISO 45001</span>
              </div>
            </div>
            <div className="pt-2">
              <a
                href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                download="INSCO_Brochure_2026.pdf"
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
              >
                <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'تحميل البروشور (50 صفحة)' : 'Download dossier PDF'}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © 2026 {INSCO_COMPANY_DATA.name[language]}. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">{INSCO_COMPANY_DATA.docRef}</span>
            <span aria-hidden="true">·</span>
            <span>ISO 9001:2015 · ISO 14001:2015 · ISO 45001:2018</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
