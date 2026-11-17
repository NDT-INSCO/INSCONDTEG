import React, { Suspense, useEffect, useState } from 'react';
import { CompanyPortal } from './components/company/CompanyPortal';
import { CompanyServicePage } from './components/company/CompanyServicePage';
import { PortalChooser } from './components/PortalChooser';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { GlobalHeaderSearch } from './components/GlobalHeaderSearch';
import { GlobalThemeSwitcher } from './components/GlobalThemeSwitcher';
import { Language } from './types';
import { AcademyTab, readAcademyTab } from './academyTabs';
import { INSCO_COMPANY_DATA } from './data/inscoCompanyData';
import { downloadTrainingSyllabus } from './utils/trainingSyllabusGenerator';
import {
  readServiceFamilyHash,
  serviceFamilyById,
  serviceFamilyHash,
  type ServiceFamilyId,
} from './utils/serviceFamilies';
import { RFQ_QUICK_ACTION_EVENT } from './components/company/CompanyQuickActionsSection';
import { useTheme } from './utils/themeStore';
import {
  readPortalChoice,
  savePortalChoice,
  shouldOfferPortalChooser,
  type PortalChoice,
} from './utils/portalChoice';
import { 
  Globe, 
  GraduationCap, 
  Building2, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  Phone,
  Mail,
  Award,
  Menu,
  MessageCircle,
  Download
} from 'lucide-react';

// The academy carries the whole NDT library (textbooks, encyclopedia, quizzes,
// the AI index). Visitors landing on the company profile must not download it,
// so it is split out and fetched when the academy is actually opened.
const EducationalAcademy = React.lazy(() =>
  import('./components/EducationalAcademy').then(module => ({ default: module.EducationalAcademy }))
);

// The demonstrations page carries four interactive simulators. It is its own
// route now, so it is fetched on demand instead of shipping with the profile.
const CompanyDemoPortal = React.lazy(() =>
  import('./components/company/CompanyDemoPortal').then(module => ({ default: module.CompanyDemoPortal }))
);

function AcademyLoading({ isAr }: { isAr: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-8"
    >
      <div className="h-4 w-40 animate-pulse rounded bg-slate-700/70" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
      <p className="pt-2 text-xs text-slate-400">
        {isAr ? 'جارٍ تحميل مكتبة الأكاديمية…' : 'Loading the academy library…'}
      </p>
    </div>
  );
}

const LANGUAGE_KEY = 'insco_language_v1';

/** `#demo` is the technical-demonstrations page, not an academy tab. */
function isDemoHash(hash: string): boolean {
  return hash.replace(/^#/, '').trim().toLowerCase() === 'demo';
}

type AppView = 'company' | 'academy' | 'demo' | 'service';

function readLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(readLanguage);
  const { theme, isLight } = useTheme();
  // A shared link such as `/-Project-/#courses` must open the academy, and
  // `#demo` must open the demonstrations page, not the profile with a dead hash.
  const [initialHash] = useState(() => window.location.hash);
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const hash = window.location.hash;
    if (readAcademyTab(hash)) return 'academy';
    if (isDemoHash(hash)) return 'demo';
    if (readServiceFamilyHash(hash)) return 'service';
    return 'company';
  });
  const [serviceFamilyId, setServiceFamilyId] = useState<ServiceFamilyId>(
    () => readServiceFamilyHash(window.location.hash) ?? 'ndt'
  );
  const [academySubTab, setAcademySubTab] = useState<AcademyTab | undefined>(() =>
    readAcademyTab(window.location.hash)
  );
  const [portalChoice, setPortalChoice] = useState<PortalChoice | null>(() => readPortalChoice());
  const [chooserOpen, setChooserOpen] = useState(() =>
    shouldOfferPortalChooser({
      choice: readPortalChoice(),
      hasAcademyHash: Boolean(readAcademyTab(initialHash)),
      hasDemoHash: isDemoHash(initialHash) || Boolean(readServiceFamilyHash(initialHash)),
      view: readAcademyTab(initialHash)
        ? 'academy'
        : isDemoHash(initialHash)
          ? 'demo'
          : readServiceFamilyHash(initialHash)
            ? 'service'
            : 'company',
    })
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* private mode: language simply resets on reload */
    }
  }, [language, isAr]);

  // Route-specific titles: a shared `#services/pwht` link must not open with the
  // generic home title, and browser tabs / search previews stay meaningful.
  useEffect(() => {
    const companyName = isAr ? 'إنسكو' : 'INSCO';
    const family = serviceFamilyById(serviceFamilyId);
    const routeTitle = (() => {
      if (currentView === 'academy') return isAr ? 'أكاديمية إنسكو الهندسية' : 'INSCO Engineering Academy';
      if (currentView === 'demo') return isAr ? 'العرض الفني التفاعلي' : 'Technical Demonstrations';
      if (currentView === 'service' && family) return family.title[language];
      return isAr ? 'خدمات الفحص غير الإتلافي والمعالجة الحرارية' : 'NDT Inspection & PWHT Services';
    })();
    document.title = `${routeTitle} | ${companyName}`;
  }, [currentView, serviceFamilyId, language, isAr]);

  const handleNavigateToAcademy = (initialSubTab?: AcademyTab) => {
    if (initialSubTab) {
      setAcademySubTab(initialSubTab);
    }
    setCurrentView('academy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back/forward between a cleared hash, a shared academy link and `#demo`.
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      const tab = readAcademyTab(hash);
      if (tab) {
        setAcademySubTab(tab);
        setCurrentView('academy');
        return;
      }
      if (isDemoHash(hash)) {
        setCurrentView('demo');
        return;
      }
      const family = readServiceFamilyHash(hash);
      if (family) {
        setServiceFamilyId(family);
        setCurrentView('service');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigateToCompany = (sectionId?: string) => {
    setCurrentView('company');
    // The hash belongs to the academy. Leaving it behind would make the address
    // bar claim the reader is still on `#edb` while the company page is shown.
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Page-level destinations live in the hash so they can be shared/bookmarked.
  const handleOpenDemo = (anchorId?: string) => {
    setCurrentView('demo');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#demo`
    );
    if (anchorId) {
      // Wait for the code-split demonstrations page to mount.
      setTimeout(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenService = (id: ServiceFamilyId) => {
    setServiceFamilyId(id);
    setCurrentView('service');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${serviceFamilyHash(id)}`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * "Request a quote for this service": open the RFQ with the service chosen.
   * The form listens for this event, so the choice survives the page switch.
   */
  const handleRequestQuoteFor = (serviceType: string) => {
    handleNavigateToCompany();
    setTimeout(() => {
      if (typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent(RFQ_QUICK_ACTION_EVENT, { detail: { serviceType } }));
      }
      document.getElementById('rfq')?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const handleChoosePortal = (choice: PortalChoice) => {
    savePortalChoice(choice);
    setPortalChoice(choice);
    setChooserOpen(false);
    if (choice === 'academy') handleNavigateToAcademy();
  };

  // Six corporate destinations and one action — the same list on every screen.
  const corporateNav = [
    {
      ar: 'الرئيسية',
      en: 'Home',
      onClick: () => handleNavigateToCompany(),
      current: currentView === 'company',
    },
    { ar: 'خدماتنا', en: 'Services', onClick: () => handleNavigateToCompany('services') },
    { ar: 'إمكانياتنا', en: 'Capabilities', onClick: () => handleNavigateToCompany('fleet-inspector') },
    { ar: 'مشروعاتنا', en: 'Projects', onClick: () => handleNavigateToCompany('projects') },
    { ar: 'ملف التأهيل', en: 'Vendor dossier', onClick: () => handleNavigateToCompany('vault') },
  ];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      data-theme={theme}
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Persistent Corporate Top Bar Contract */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
          isLight
            ? 'border-slate-200 bg-white/95'
            : 'border-slate-800 bg-slate-950/95'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
          {/* Zone 1: Single Brand Element Wordmark */}
          <button
            type="button"
            aria-label={isAr ? 'الرئيسية - شركة إنسكو' : 'INSCO Home Profile'}
            onClick={() => handleNavigateToCompany()}
            className="flex items-center gap-2.5 text-start cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="whitespace-nowrap">
              <div className="text-base sm:text-lg font-black text-white tracking-tight">
                {isAr ? 'الشركة الدولية للخدمات والمقاولات - إنسكو' : 'INSCO Industrial'}
              </div>
              <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5">
                <span>{isAr ? 'أكاديمية إنسكو NDT' : 'INSCO NDT Academy'}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>CP/2026-10</span>
              </div>
            </div>
          </button>

          {/* Zone 2: Six corporate destinations, one action, one academy door. */}
          <nav
            aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'}
            className="hidden xl:flex items-center gap-4 text-xs font-semibold text-slate-300"
          >
            {corporateNav.map(item => (
              <button
                key={item.en}
                type="button"
                onClick={item.onClick}
                aria-current={item.current ? 'page' : undefined}
                className={`hover:text-cyan-400 transition whitespace-nowrap cursor-pointer ${
                  item.current ? 'text-cyan-400 font-bold' : ''
                }`}
              >
                {isAr ? item.ar : item.en}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNavigateToCompany('rfq')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-slate-950 font-black transition whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'اطلب عرض سعر' : 'Request a quote'}
            </button>
            <span aria-hidden="true" className="h-4 w-px bg-slate-700" />
            <button
              type="button"
              onClick={() => handleNavigateToAcademy()}
              aria-current={currentView === 'academy' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                currentView === 'academy'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-cyan-300 bg-slate-900 border border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{isAr ? 'أكاديمية إنسكو' : 'INSCO Academy'}</span>
            </button>
          </nav>

          {/* Global Header Search Bar next to navigation links */}
          <div className="flex-1 max-w-xs hidden md:block">
            <GlobalHeaderSearch
              language={language}
              onNavigateToCompany={handleNavigateToCompany}
              onNavigateToAcademy={handleNavigateToAcademy}
            />
          </div>

          {/* Zone 3: Primary Action & Language Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {currentView !== 'company' ? (
              <button
                type="button"
                onClick={() => handleNavigateToCompany()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition whitespace-nowrap cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'بوابة الشركة' : 'Corporate Portal'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigateToCompany('rfq')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition whitespace-nowrap cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isAr ? 'اطلب عرض سعر' : 'Request a quote'}</span>
              </button>
            )}

            {portalChoice && (
              <button
                type="button"
                onClick={() => setChooserOpen(true)}
                aria-label={isAr ? 'تبديل البوابة' : 'Switch portal'}
                title={isAr ? 'تبديل البوابة' : 'Switch portal'}
                className="hidden lg:inline-flex items-center justify-center p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition cursor-pointer"
              >
                {portalChoice === 'company' ? (
                  <GraduationCap className="w-3.5 h-3.5" />
                ) : (
                  <Building2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* One menu instead of the old 14-chip strip. */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={isAr ? 'فتح قائمة التنقل' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <GlobalThemeSwitcher language={language} />

            <button
              type="button"
              onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-semibold">{isAr ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 xl:pb-0">
        {currentView === 'company' && (
          <CompanyPortal
            language={language}
            onNavigateToAcademy={handleNavigateToAcademy}
            onOpenDemo={() => handleOpenDemo()}
            onOpenService={handleOpenService}
          />
        )}

        {currentView === 'service' && (
          <CompanyServicePage
            language={language}
            family={serviceFamilyById(serviceFamilyId) ?? serviceFamilyById('ndt')!}
            onBack={() => handleNavigateToCompany('services')}
            onOpenFamily={handleOpenService}
            onRequestQuote={handleRequestQuoteFor}
            onOpenDemo={anchorId => handleOpenDemo(anchorId)}
            onOpenAcademy={tab => handleNavigateToAcademy(tab as AcademyTab | undefined)}
          />
        )}

        {currentView === 'demo' && (
          <Suspense fallback={<AcademyLoading isAr={isAr} />}>
            <CompanyDemoPortal
              language={language}
              onBack={() => handleNavigateToCompany()}
              onRequestQuote={() => handleNavigateToCompany('rfq')}
              onOpenAcademy={tab => handleNavigateToAcademy(tab as AcademyTab | undefined)}
            />
          </Suspense>
        )}

        {currentView === 'academy' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Integrated Academy Bar linking back to Company facade */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {isAr ? 'أكاديمية إنسكو الهندسية للفحص غير الإتلافي' : 'INSCO Non-Destructive Testing Academy'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'الذراع الأكاديمي والتدريبي لشركة إنسكو الدولية للخدمات والمقاولات'
                      : 'Academic & Engineer Qualification Division of INSCO Industrial'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadTrainingSyllabus(language)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'تحميل المنهج التدريبي (Syllabus)' : 'Download training syllabus'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateToCompany()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer whitespace-nowrap"
                >
                  <span>{isAr ? 'العودة إلى ملف وخدمات الشركة' : 'Back to Corporate Profile'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mount Full Educational Academy */}
            <Suspense fallback={<AcademyLoading isAr={isAr} />}>
              <EducationalAcademy
                language={language}
                initialSubTab={academySubTab}
              />
            </Suspense>
          </div>
        )}
      </main>

      {/* One mobile menu for both portals */}
      <MobileNavDrawer
        open={menuOpen}
        language={language}
        onClose={() => setMenuOpen(false)}
        onNavigateSection={sectionId => handleNavigateToCompany(sectionId)}
        onOpenDemo={handleOpenDemo}
        onOpenAcademy={tab => handleNavigateToAcademy(tab)}
      />

      {/* First-visit fork between the two audiences (never covers a deep link) */}
      {chooserOpen && (
        <PortalChooser
          language={language}
          onChoose={handleChoosePortal}
          onDismiss={() => setChooserOpen(false)}
        />
      )}

      {/* Sticky conversion bar on phones */}
      {currentView === 'company' && (
        <div className="xl:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigateToCompany('rfq')}
            className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-2.5 text-sm font-black transition cursor-pointer"
          >
            {isAr ? 'اطلب عرض سعر' : 'Request a quote'}
          </button>
          <a
            href={`https://wa.me/${INSCO_COMPANY_DATA.contacts.whatsapp.replace(/[^\d]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
          </a>
        </div>
      )}

      {/* Corporate Comprehensive Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 pt-12 pb-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            {/* Column 1: Brand & Registrations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-black text-base">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>{INSCO_COMPANY_DATA.name[language]}</span>
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

            {/* Column 2: Core Services */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isAr ? 'خدمات الشركة المعتمدة' : 'Core Capabilities'}
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
                    onClick={() => handleOpenDemo()}
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition cursor-pointer"
                  >
                    {isAr ? 'العرض الفني التفاعلي (محاكيات ومعامل)' : 'Technical demonstrations (simulators & labs)'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Academy Modules */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isAr ? 'أكاديمية إنسكو الهندسية' : 'Engineering Academy'}
              </div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateToAcademy('workshops')}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    {isAr ? 'معامل المحاكاة 3D الافتراضية' : '3D Virtual Simulation Labs'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateToAcademy('curriculum')}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    {isAr ? 'المناهج المعتمدة (ASNT / ISO)' : 'Standardized NDT Curricula'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateToAcademy('certification_center')}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    {isAr ? 'مركز الامتحانات والتأهيل المهني' : 'Certification Exam Center'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateToAcademy('roadmap')}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    {isAr ? 'خارطة طريق مهندس الجودة' : 'NDT Career Learning Roadmap'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateToAcademy('leaderboard')}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    {isAr ? 'لوحة المعرفة ونقاط XP' : 'Knowledge Leaderboard & XP'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Master PDF */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isAr ? 'التواصل المباشر والبروشور' : 'Direct Dispatch & PDF'}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-mono">{INSCO_COMPANY_DATA.contacts.phones[0]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-mono">{INSCO_COMPANY_DATA.contacts.email}</span>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                  download="INSCO_Brochure_2026.pdf"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'تحميل البروشور (50 صفحة)' : 'Download Dossier PDF'}</span>
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
    </div>
  );
};