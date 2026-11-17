import React from 'react';
import { Building2, GraduationCap, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { INSCO_COMPANY_DATA } from '../data/inscoCompanyData';
import { useEscapeKey } from '../utils/a11y';
import type { PortalChoice } from '../utils/portalChoice';

interface PortalChooserProps {
  language: Language;
  onChoose: (choice: PortalChoice) => void;
  onDismiss: () => void;
}

/**
 * First-visit fork between the corporate profile and the academy.
 *
 * Both doors are real buttons, the dialog is announced, Escape dismisses it
 * without recording a choice (so a deliberate decision is always the visitor's)
 * and the backdrop is a keyboard-skippable button rather than a clickable div.
 */
export const PortalChooser: React.FC<PortalChooserProps> = ({ language, onChoose, onDismiss }) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const titleId = 'portal-chooser-title';
  const descId = 'portal-chooser-desc';

  useEscapeKey(true, onDismiss);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        tabIndex={-1}
        aria-label={isAr ? 'إغلاق نافذة اختيار المسار' : 'Dismiss the portal chooser'}
        onClick={onDismiss}
        className="absolute inset-0 w-full h-full bg-slate-950/85 backdrop-blur-sm cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden"
      >
        <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-slate-800 text-center space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
            {isAr ? 'INSCO · بوابة موحّدة' : 'INSCO · One company, two doors'}
          </div>
          <h2 id={titleId} className="text-xl sm:text-2xl font-black text-white">
            {isAr ? 'اختر المسار الذي يناسبك' : 'Choose the path that fits you'}
          </h2>
          <p id={descId} className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'بوابة الشركة للعملاء والمشروعات والمشتريات والجودة. الأكاديمية للمهندسين والمتدرّبين. يمكنك التبديل بينهما في أي وقت من أعلى الصفحة.'
              : 'The corporate portal serves clients, projects, procurement and quality teams. The academy serves engineers and trainees. You can switch at any time from the header.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-6">
          <button
            type="button"
            autoFocus
            onClick={() => onChoose('company')}
            className="group text-start rounded-xl border border-slate-700 bg-slate-900/60 hover:border-amber-400/70 focus-visible:border-amber-400 p-5 transition cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Building2 className="w-4 h-4" />
              {isAr ? 'بوابة الشركة' : 'Corporate Portal'}
            </span>
            <span className="block mt-2 text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'الخدمات · الاعتمادات · المعدات · سابقة الأعمال · ملف تأهيل المورد · طلب عرض سعر.'
                : 'Services · accreditations · equipment · track record · vendor dossier · request a quote.'}
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white">
              {isAr ? 'دخول بوابة الشركة' : 'Enter the corporate portal'}
              <ArrowIcon className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChoose('academy')}
            className="group text-start rounded-xl border border-slate-700 bg-slate-900/60 hover:border-cyan-400/70 focus-visible:border-cyan-400 p-5 transition cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <GraduationCap className="w-4 h-4" />
              {isAr ? 'أكاديمية إنسكو' : 'INSCO Academy'}
            </span>
            <span className="block mt-2 text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'مسارات التعلم · المكتبة والمراجع · معامل المحاكاة · الاختبارات · متابعة الإنجاز · المدرّس الذكي.'
                : 'Learning paths · library and references · simulation labs · exams · progress · AI tutor.'}
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white">
              {isAr ? 'دخول الأكاديمية' : 'Enter the academy'}
              <ArrowIcon className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        <div className="px-5 sm:px-8 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isAr ? 'ISO 9001 / 14001 / 45001 · EGAC' : 'ISO 9001 / 14001 / 45001 · EGAC'} #{INSCO_COMPANY_DATA.egacCabNo}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChoose('company')}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-4 cursor-pointer"
          >
            {isAr ? 'تخطّي والبقاء في موقع الشركة' : 'Skip and browse the company site'}
          </button>
        </div>
      </div>
    </div>
  );
};
