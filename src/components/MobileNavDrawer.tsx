import React, { useEffect } from 'react';
import { X, Building2, GraduationCap, Phone } from 'lucide-react';
import { Language } from '../types';
import { INSCO_COMPANY_DATA } from '../data/inscoCompanyData';
import { useEscapeKey } from '../utils/a11y';
import type { AcademyTab } from '../academyTabs';

interface MobileNavDrawerProps {
  open: boolean;
  language: Language;
  /** Which portal the visitor is in; its group is listed first. */
  portal?: 'company' | 'academy';
  onClose: () => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenDemo: () => void;
  onOpenAcademy: (tab?: AcademyTab) => void;
}

interface DrawerLink {
  labelAr: string;
  labelEn: string;
  action: () => void;
}

/**
 * One mobile menu instead of the old 14-chip sticky strip.
 *
 * Two labelled groups (company / academy) keep the two audiences apart without
 * hiding anything: every destination the strip offered is still one tap away.
 */
export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  open,
  language,
  portal = 'company',
  onClose,
  onNavigateSection,
  onOpenDemo,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';

  useEscapeKey(open, onClose);

  // The drawer is a page-level overlay: the content behind it must not scroll.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const section = (id: string) => () => {
    onClose();
    onNavigateSection(id);
  };

  const academy = (tab?: AcademyTab) => () => {
    onClose();
    onOpenAcademy(tab);
  };

  const companyLinks: DrawerLink[] = [
    { labelAr: 'الرئيسية وملف الشركة', labelEn: 'Home & profile', action: section('top') },
    { labelAr: 'الخدمات وأسطول PWHT', labelEn: 'Services & PWHT fleet', action: section('services') },
    { labelAr: 'الإمكانيات والمعدات', labelEn: 'Capabilities & equipment', action: section('fleet-inspector') },
    { labelAr: 'الاعتمادات والأكواد', labelEn: 'Accreditations & codes', action: section('certifications') },
    { labelAr: 'سابقة الأعمال', labelEn: 'Track record', action: section('projects') },
    { labelAr: 'ملف تأهيل المورد', labelEn: 'Vendor qualification', action: section('vault') },
    {
      labelAr: 'العرض الفني التفاعلي',
      labelEn: 'Technical demonstrations',
      action: () => {
        onClose();
        onOpenDemo();
      },
    },
    { labelAr: 'طلب عرض سعر', labelEn: 'Request a quote', action: section('rfq') },
  ];

  const academyLinks: DrawerLink[] = [
    { labelAr: 'مسارات التعلم', labelEn: 'Learning paths', action: academy('paths') },
    { labelAr: 'المكتبة والمراجع', labelEn: 'Library & references', action: academy('encyclopedia') },
    { labelAr: 'معامل المحاكاة', labelEn: 'Simulation labs', action: academy('sim_labs_rt') },
    { labelAr: 'الاختبارات والتقييم', labelEn: 'Exams & assessment', action: academy('quiz') },
    { labelAr: 'متابعة الإنجاز', labelEn: 'Progress tracking', action: academy('completion_map') },
    { labelAr: 'المدرّس الذكي', labelEn: 'AI tutor', action: academy('ask_ai') },
  ];

  const renderGroup = (title: string, links: DrawerLink[]) => (
    <div className="space-y-1">
      <div className="px-1 pt-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-500">{title}</div>
      {links.map(link => (
        <button
          key={link.labelEn}
          type="button"
          onClick={link.action}
          className="w-full text-start rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
        >
          {isAr ? link.labelAr : link.labelEn}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] xl:hidden" role="presentation">
      <button
        type="button"
        tabIndex={-1}
        aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'قائمة التنقل' : 'Navigation menu'}
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative z-10 h-full w-[85%] max-w-sm bg-slate-950 border-e border-slate-800 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-black text-white">{isAr ? 'إنسكو' : 'INSCO'}</span>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
            className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {/* The portal you are in comes first, so the menu never makes you
              scroll past the other audience to find your own pages. */}
          {(portal === 'academy' ? ['academy', 'company'] : ['company', 'academy']).map(group =>
            group === 'company' ? (
              <React.Fragment key="company">
                <div className="flex items-center gap-2 px-1 pt-4 text-cyan-300 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {isAr ? 'الشركة' : 'Company'}
                </div>
                {renderGroup(isAr ? 'الخدمات والمشروعات' : 'Services & projects', companyLinks)}
              </React.Fragment>
            ) : (
              <React.Fragment key="academy">
                <div className="flex items-center gap-2 px-1 pt-5 text-amber-300 text-xs font-bold">
                  <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                  {isAr ? 'أكاديمية إنسكو' : 'INSCO Academy'}
                </div>
                {renderGroup(isAr ? 'رحلة المتعلم' : 'Learning journey', academyLinks)}
              </React.Fragment>
            )
          )}
        </nav>

        <div className="border-t border-slate-800 p-3 space-y-2">
          <a
            href={`tel:${INSCO_COMPANY_DATA.contacts.phones[0].replace(/[^\d+]/g, '')}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono" dir="ltr">{INSCO_COMPANY_DATA.contacts.phones[0]}</span>
          </a>
          {portal === 'company' ? (
            <button
              type="button"
              onClick={section('rfq')}
              className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-2.5 text-sm font-black transition cursor-pointer"
            >
              {isAr ? 'اطلب عرض سعر' : 'Request a quote'}
            </button>
          ) : (
            <button
              type="button"
              onClick={academy()}
              className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-2.5 text-sm font-black transition cursor-pointer"
            >
              {isAr ? 'رئيسية الأكاديمية' : 'Academy home'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
