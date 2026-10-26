import React, { Suspense, useEffect, useState } from 'react';
import { CompanyPortal } from './components/company/CompanyPortal';
import { GlobalHeaderSearch } from './components/GlobalHeaderSearch';
import { Language } from './types';
import { AcademyTab, readAcademyTab } from './academyTabs';
import { INSCO_COMPANY_DATA } from './data/inscoCompanyData';
import { 
  Globe, 
  GraduationCap, 
  Building2, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  Phone,
  Mail,
  Award
} from 'lucide-react';

// The academy carries the whole NDT library (textbooks, encyclopedia, quizzes,
// the AI index). Visitors landing on the company profile must not download it,
// so it is split out and fetched when the academy is actually opened.
const EducationalAcademy = React.lazy(() =>
  import('./components/EducationalAcademy').then(module => ({ default: module.EducationalAcademy }))
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

function readLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(readLanguage);
  // A shared link such as `/-Project-/#courses` must open the academy, not the
  // company profile with an ignored hash.
  const [currentView, setCurrentView] = useState<'company' | 'academy'>(() =>
    readAcademyTab(window.location.hash) ? 'academy' : 'company'
  );
  const [academySubTab, setAcademySubTab] = useState<AcademyTab | undefined>(() =>
    readAcademyTab(window.location.hash)
  );

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

  const handleNavigateToAcademy = (initialSubTab?: AcademyTab) => {
    if (initialSubTab) {
      setAcademySubTab(initialSubTab);
    }
    setCurrentView('academy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back/forward between a cleared hash and a shared academy link.
  useEffect(() => {
    const onHashChange = () => {
      const tab = readAcademyTab(window.location.hash);
      if (tab) {
        setAcademySubTab(tab);
        setCurrentView('academy');
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

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Persistent Corporate Top Bar Contract */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
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

          {/* Zone 2: Clean Single-line Navigation Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => handleNavigateToCompany()}
              className={`hover:text-cyan-400 transition whitespace-nowrap cursor-pointer ${
                currentView === 'company' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              {isAr ? 'الرئيسية وملف الشركة' : 'Profile'}
            </button>

            <button
              type="button"
              onClick={() => handleNavigateToCompany('services')}
              className="hover:text-cyan-400 transition whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'الخدمات وأسطول PWHT' : 'Services & Fleet'}
            </button>

            <button
              type="button"
              onClick={() => handleNavigateToCompany('certifications')}
              className="hover:text-cyan-400 transition whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'شهادات الجودة (ISO)' : 'Accreditations'}
            </button>

            <button
              type="button"
              onClick={() => handleNavigateToCompany('projects')}
              className="hover:text-cyan-400 transition whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'سابقة الأعمال' : 'Track Record'}
            </button>

            <button
              type="button"
              onClick={() => handleNavigateToCompany('testimonials')}
              className="hover:text-cyan-400 transition whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <span>{isAr ? 'آراء العملاء' : 'Testimonials'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateToCompany('hologram-lab')}
              className="hover:text-cyan-400 transition whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'المختبر ثلاثي الأبعاد (3D)' : '3D Lab'}
            </button>

            <button
              type="button"
              onClick={() => handleNavigateToCompany('vault')}
              className="hover:text-cyan-400 transition whitespace-nowrap cursor-pointer"
            >
              {isAr ? 'ملف التأهيل (PDF)' : 'Vendor Vault'}
            </button>

            <button
              type="button"
              onClick={() => handleNavigateToAcademy()}
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
          <div className="flex items-center gap-2.5 shrink-0">
            {currentView === 'company' ? (
              <a
                href={INSCO_COMPANY_DATA.pdfBrochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isAr ? 'بروشور PDF' : 'Brochure PDF'}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigateToCompany()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition whitespace-nowrap cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'بوابة الشركة' : 'Corporate Portal'}</span>
              </button>
            )}

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
      <main className="flex-1">
        {currentView === 'company' ? (
          <CompanyPortal
            language={language}
            onNavigateToAcademy={handleNavigateToAcademy}
          />
        ) : (
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

              <button
                type="button"
                onClick={() => handleNavigateToCompany()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer whitespace-nowrap"
              >
                <span>{isAr ? 'العودة إلى ملف وخدمات الشركة' : 'Back to Corporate Profile'}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
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