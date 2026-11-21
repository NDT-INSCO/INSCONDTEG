import React, { useEffect, useRef } from 'react';
import { X, Building2, BriefcaseBusiness, GraduationCap, Phone, Network } from 'lucide-react';
import { Language } from '../types';
import { INSCO_COMPANY_DATA } from '../data/inscoCompanyData';
import { useEscapeKey, useModalFocus } from '../utils/a11y';
import type { AcademyTab } from '../academyTabs';
import type { ClientSectionId, NetworkSectionId, PortalId } from '../utils/portalRoutes';
import { useDefaultUnitSystem } from '../utils/unitSystemStore';

interface MobileNavDrawerProps {
  open: boolean;
  language: Language;
  /** Which portal the visitor is in; its group is listed first. */
  portal?: PortalId;
  onClose: () => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenDemo: () => void;
  onOpenAcademy: (tab?: AcademyTab) => void;
  onOpenClient?: (section?: ClientSectionId) => void;
  onOpenNetwork?: (section?: NetworkSectionId) => void;
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
  onOpenClient,
  onOpenNetwork,
}) => {
  const isAr = language === 'ar';
  const { defaultUnitSystem, setDefaultUnitSystem } = useDefaultUnitSystem();

  const panel = useRef<HTMLDivElement>(null);
  useEscapeKey(open, onClose);
  useModalFocus(open, panel);

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

  const client = (sec: ClientSectionId = 'overview') => () => {
    onClose();
    onOpenClient?.(sec);
  };

  const companyLinks: DrawerLink[] = [
    { labelAr: 'الرئيسية وملف الشركة', labelEn: 'Home & profile', action: section('top') },
    { labelAr: 'عن إنسكو والقطاعات', labelEn: 'About INSCO & industries', action: section('about') },
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
    { labelAr: 'التواصل', labelEn: 'Contact', action: section('contact') },
    { labelAr: 'أدوات المفتش والحضور', labelEn: 'Inspector tools & attendance', action: section('inspector-qr-access') },
  ];

  const academyLinks: DrawerLink[] = [
    { labelAr: 'مسارات التعلم', labelEn: 'Learning paths', action: academy('paths') },
    { labelAr: 'المكتبة والمراجع', labelEn: 'Library & references', action: academy('encyclopedia') },
    { labelAr: 'معامل المحاكاة', labelEn: 'Simulation labs', action: academy('sim_labs_rt') },
    { labelAr: 'الاختبارات والتقييم', labelEn: 'Exams & assessment', action: academy('quiz') },
    { labelAr: 'متابعة الإنجاز', labelEn: 'Progress tracking', action: academy('completion_map') },
    { labelAr: 'المدرّس الذكي', labelEn: 'AI tutor', action: academy('ask_ai') },
  ];

  const network = (sec: NetworkSectionId = 'feed') => () => {
    onClose();
    onOpenNetwork?.(sec);
  };

  const networkLinks: DrawerLink[] = [
    { labelAr: 'المنشورات', labelEn: 'Feed', action: network('feed') },
    { labelAr: 'ملفي المهني', labelEn: 'My profile', action: network('profile') },
    { labelAr: 'المجموعات التخصصية', labelEn: 'Discipline groups', action: network('groups') },
    { labelAr: 'الخبراء والأعضاء', labelEn: 'People & experts', action: network('people') },
    { labelAr: 'الفرص المهنية', labelEn: 'Jobs', action: network('jobs') },
    { labelAr: 'المقالات', labelEn: 'Articles', action: network('articles') },
    { labelAr: 'الفعاليات', labelEn: 'Events', action: network('events') },
    { labelAr: 'المؤسسات', labelEn: 'Organisations', action: network('companies') },
    { labelAr: 'الرسائل', labelEn: 'Messages', action: network('messages') },
    { labelAr: 'الإشعارات', labelEn: 'Notifications', action: network('notifications') },
    { labelAr: 'البحث', labelEn: 'Search', action: network('search') },
    { labelAr: 'التحقق المهني', labelEn: 'Verification', action: network('verify') },
  ];

  const clientLinks: DrawerLink[] = [
    { labelAr: 'لوحة بوابة العملاء', labelEn: 'Client overview', action: client('overview') },
    { labelAr: 'طلبات العملاء الجدد', labelEn: 'New client requests', action: client('requests') },
    { labelAr: 'أرشيف الشركات والملفات', labelEn: 'Coded companies & dossiers', action: client('companies') },
    { labelAr: 'بوابة الحضور والانصراف', labelEn: 'Worker time-clock', action: client('timeclock') },
    { labelAr: 'مجتمع INSCO الهندسي', labelEn: 'INSCO Community', action: client('community') },
    { labelAr: 'التسجيل وربط الكود', labelEn: 'Registration & code link', action: client('register') },
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
        ref={panel}
        tabIndex={-1}
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
            data-modal-initial-focus
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
          {(portal === 'network'
            ? ['network', 'academy', 'client', 'company']
            : portal === 'academy'
              ? ['academy', 'client', 'company', 'network']
              : portal === 'client'
                ? ['client', 'company', 'academy', 'network']
                : ['company', 'client', 'academy', 'network']
          ).map(group =>
            group === 'company' ? (
              <React.Fragment key="company">
                <div className="flex items-center gap-2 px-1 pt-4 text-cyan-300 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {isAr ? 'الشركة' : 'Company'}
                </div>
                {renderGroup(isAr ? 'الخدمات والمشروعات' : 'Services & projects', companyLinks)}
              </React.Fragment>
            ) : group === 'client' ? (
              <React.Fragment key="client">
                <div className="flex items-center gap-2 px-1 pt-5 text-emerald-300 text-xs font-bold">
                  <BriefcaseBusiness className="w-3.5 h-3.5" aria-hidden="true" />
                  {isAr ? 'بوابة العملاء' : 'Client Portal'}
                </div>
                {renderGroup(isAr ? 'الطلبات والأرشيف والتقارير' : 'Requests, archive & dossiers', clientLinks)}
              </React.Fragment>
            ) : group === 'academy' ? (
              <React.Fragment key="academy">
                <div className="flex items-center gap-2 px-1 pt-5 text-amber-300 text-xs font-bold">
                  <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                  {isAr ? 'أكاديمية إنسكو' : 'INSCO Academy'}
                </div>
                {renderGroup(isAr ? 'رحلة المتعلم' : 'Learning journey', academyLinks)}
              </React.Fragment>
            ) : (
              <React.Fragment key="network">
                <div className="flex items-center gap-2 px-1 pt-5 text-violet-300 text-xs font-bold">
                  <Network className="w-3.5 h-3.5" aria-hidden="true" />
                  {isAr ? 'الشبكة الهندسية' : 'Engineering Network'}
                  <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1 text-[9px] font-mono font-bold uppercase">
                    {isAr ? 'تصور' : 'Prototype'}
                  </span>
                </div>
                {renderGroup(isAr ? 'المجتمع المهني' : 'The professional community', networkLinks)}
              </React.Fragment>
            )
          )}
        </nav>

        <div className="border-t border-slate-800 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-2">
            <span className="text-[11px] font-semibold text-slate-300">
              {isAr ? 'وحدات الحاسبات الافتراضية' : 'Default Units'}
            </span>
            <div
              role="group"
              aria-label={isAr ? 'نظام الوحدات الافتراضي' : 'Default Unit System'}
              className="inline-flex rounded-md border border-slate-700 bg-slate-950 p-0.5 text-[11px]"
            >
              <button
                type="button"
                onClick={() => setDefaultUnitSystem('metric')}
                className={`rounded px-2 py-0.5 font-semibold transition cursor-pointer ${
                  defaultUnitSystem === 'metric'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'متري' : 'Metric'}
              </button>
              <button
                type="button"
                onClick={() => setDefaultUnitSystem('imperial')}
                className={`rounded px-2 py-0.5 font-semibold transition cursor-pointer ${
                  defaultUnitSystem === 'imperial'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'إمبريال' : 'Imperial'}
              </button>
            </div>
          </div>
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
