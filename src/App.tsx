import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { CompanyPortal } from './components/company/CompanyPortal';
import { CompanyServicePage } from './components/company/CompanyServicePage';
import { CompanyFooter } from './components/company/CompanyFooter';
import { PortalChooser } from './components/PortalChooser';
import { PortalSwitchBar, type PortalTrailStep } from './components/PortalSwitchBar';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { GlobalHeaderSearch } from './components/GlobalHeaderSearch';
import { GlobalThemeSwitcher } from './components/GlobalThemeSwitcher';
import { GlobalAppConfigControl } from './components/GlobalAppConfigControl';
import { Language } from './types';
import { AcademyTab } from './academyTabs';
import { INSCO_COMPANY_DATA } from './data/inscoCompanyData';
import {
  serviceFamilyById,
  type ServiceFamilyId,
} from './utils/serviceFamilies';
import {
  academySectionLabel,
  academySectionOfTab,
  clientSectionLabel,
  parseRoute,
  routeToHash,
  type AcademyRoute,
  type ClientRoute,
  type ClientSectionId,
  type PortalId,
  type Route,
} from './utils/portalRoutes';
import { AcademyHeader, AcademyFooter } from './components/academy/AcademyShell';
import { RFQ_QUICK_ACTION_EVENT } from './components/company/CompanyQuickActionsSection';
import { useTheme } from './utils/themeStore';
import { useDefaultUnitSystem } from './utils/unitSystemStore';
import {
  readPortalChoice,
  savePortalChoice,
  shouldOfferPortalChooser,
  type PortalChoice,
} from './utils/portalChoice';
import {
  BriefcaseBusiness,
  Globe,
  GraduationCap,
  Building2,
  FileText,
  Menu,
  MessageCircle,
} from 'lucide-react';

// The academy pages carry the whole NDT library (textbooks, encyclopedia,
// quizzes, the AI index, fourteen simulators). Visitors landing on the company
// profile must not download any of it, so the four academy pages share one
// code-split boundary that is fetched when the academy is actually opened.
const AcademyContent = React.lazy(() =>
  import('./components/academy/AcademyContent').then(module => ({ default: module.AcademyContent }))
);

// The demonstrations page carries four interactive simulators. It is its own
// route, so it is fetched on demand instead of shipping with the profile.
const CompanyDemoPortal = React.lazy(() =>
  import('./components/company/CompanyDemoPortal').then(module => ({ default: module.CompanyDemoPortal }))
);

// The client portal manages authentication, client requests, coded companies,
// and inspection report dossiers in its own code-split chunk.
const ClientPortal = React.lazy(() =>
  import('./components/client/ClientPortal').then(module => ({ default: module.ClientPortal }))
);

function AcademyLoading({ isAr }: { isAr: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-3 rounded-2xl border border-[#29315b] bg-[#10132b] p-8"
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

function ClientLoading({ isAr }: { isAr: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
    >
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-700/70" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
        <p className="pt-2 text-xs text-slate-400">
          {isAr ? 'جارٍ تحميل بوابة العملاء والملفات…' : 'Loading the Client & Dossier Portal…'}
        </p>
      </div>
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

/** The view mapped for chooser rules across all three portals. */
function chooserViewOf(route: Route): 'company' | 'client' | 'academy' | 'demo' | 'service' {
  if (route.portal === 'academy') return 'academy';
  if (route.portal === 'client') return 'client';
  if (route.page === 'demo') return 'demo';
  if (route.page === 'service') return 'service';
  return 'company';
}

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(readLanguage);
  const { theme, isLight } = useTheme();
  const { defaultUnitSystem } = useDefaultUnitSystem();

  // The hash is the router: one structured route across three portals.
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [chooserOpen, setChooserOpen] = useState(() => {
    const initial = parseRoute(window.location.hash);
    return shouldOfferPortalChooser({
      choice: readPortalChoice(),
      hasAcademyHash: initial.portal === 'academy',
      hasClientHash: initial.portal === 'client',
      hasDemoHash: initial.portal === 'company' && initial.page !== 'home',
      view: chooserViewOf(initial),
    });
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const isAr = language === 'ar';
  const portal: PortalId = route.portal;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* private mode: language simply resets on reload */
    }
  }, [language, isAr]);

  /* ------------------------------- routing -------------------------------- */

  /** Write the address bar without re-running the whole router. */
  const writeHash = useCallback((next: Route, mode: 'push' | 'replace') => {
    const target = `${window.location.pathname}${window.location.search}${routeToHash(next)}`;
    if (mode === 'push') window.history.pushState(null, '', target);
    else window.history.replaceState(null, '', target);
  }, []);

  const scrollToId = useCallback((id: string, delay = 60) => {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, delay);
  }, []);

  /** Corporate profile, optionally at one of its sections. */
  const openCompany = useCallback(
    (sectionId?: string) => {
      setRoute({ portal: 'company', page: 'home' });
      // The hash belongs to the academy/service page. Leaving it behind would
      // make the address bar claim the reader is still somewhere else.
      if (window.location.hash) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }
      if (sectionId) scrollToId(sectionId);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      savePortalChoice('company');
    },
    [scrollToId]
  );

  const openDemo = useCallback(
    (anchorId?: string) => {
      const next: Route = { portal: 'company', page: 'demo' };
      setRoute(next);
      writeHash(next, 'replace');
      if (anchorId) scrollToId(anchorId, 120);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      savePortalChoice('company');
    },
    [scrollToId, writeHash]
  );

  const openService = useCallback(
    (id: ServiceFamilyId) => {
      const next: Route = { portal: 'company', page: 'service', family: id };
      setRoute(next);
      writeHash(next, 'replace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      savePortalChoice('company');
    },
    [writeHash]
  );

  /**
   * Any academy address: `#academy`, `#academy/disciplines/<id>`, `#academy/learn`
   * or a legacy bare tab (`#edb`, `#rt_lab`). The hash is written verbatim so an
   * old bookmark keeps its exact form.
   */
  const openAcademyHash = useCallback((hash: string) => {
    const next = parseRoute(hash);
    if (next.portal !== 'academy') return;
    setRoute(next);
    const target = hash.startsWith('#') ? hash : routeToHash(next);
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${target}`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    savePortalChoice('academy');
  }, []);

  const openAcademy = useCallback(
    (tab?: AcademyTab) => {
      if (tab) {
        openAcademyHash(`#${tab}`);
        return;
      }
      openAcademyHash('#academy');
    },
    [openAcademyHash]
  );

  /** Open the Client & Dossier Portal at an optional section and company file. */
  const openClient = useCallback(
    (section: ClientSectionId = 'overview', companyId?: string) => {
      const next: ClientRoute = {
        portal: 'client',
        page: 'section',
        section,
        ...(section === 'companies' && companyId ? { companyId } : {}),
      };
      setRoute(next);
      window.history.pushState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${routeToHash(next)}`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      savePortalChoice('client');
    },
    []
  );

  /** A tab moved inside a section: follow it without touching the history. */
  const handleAcademyTabChange = useCallback((tab: AcademyTab) => {
    setRoute(prev => {
      if (prev.portal !== 'academy' || prev.page !== 'section') return prev;
      const section = academySectionOfTab(tab);
      if (prev.section === section && prev.tab === tab) return prev;
      return { portal: 'academy', page: 'section', section, tab };
    });
  }, []);

  const openPortal = useCallback(
    (next: PortalId) => {
      if (next === portal) return;
      if (next === 'academy') openAcademyHash('#academy');
      else if (next === 'client') openClient('overview');
      else openCompany();
    },
    [openAcademyHash, openClient, openCompany, portal]
  );

  /**
   * Entry isolation: a visitor who chose the academy or client portal last time
   * lands back there, not on the commercial profile. Deep links are never redirected.
   */
  useEffect(() => {
    if (window.location.hash) return;
    const savedChoice = readPortalChoice();
    if (savedChoice === 'academy') {
      setRoute({ portal: 'academy', page: 'hub' });
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#academy`
      );
    } else if (savedChoice === 'client') {
      setRoute({ portal: 'client', page: 'section', section: 'overview' });
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#client`
      );
    }
    // Runs once: later portal switches are the visitor's own decision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/forward between portals, service pages, demos and academy deep links.
  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  // Route-specific titles: a shared link must not open with the home title.
  useEffect(() => {
    const companyName = isAr ? 'إنسكو' : 'INSCO';
    const routeTitle = (() => {
      if (route.portal === 'client') {
        return clientSectionLabel(route.section, isAr ? 'ar' : 'en');
      }
      if (route.portal === 'academy') {
        if (route.page === 'hub') return isAr ? 'أكاديمية إنسكو الهندسية' : 'INSCO Engineering Academy';
        if (route.page === 'disciplines') return isAr ? 'التخصصات الهندسية الثمانية' : 'The eight engineering disciplines';
        if (route.page === 'discipline') return isAr ? 'صفحة التخصص' : 'Discipline';
        return academySectionLabel(route.section, isAr ? 'ar' : 'en');
      }
      if (route.page === 'demo') return isAr ? 'العرض الفني التفاعلي' : 'Technical Demonstrations';
      if (route.page === 'service') {
        const family = serviceFamilyById(route.family);
        if (family) return family.title[language];
      }
      return isAr ? 'خدمات الفحص غير الإتلافي والمعالجة الحرارية' : 'NDT Inspection & PWHT Services';
    })();
    document.title = `${routeTitle} | ${companyName}`;
  }, [route, language, isAr]);

  /**
   * "Request a quote for this service": open the RFQ with the service chosen.
   * The form listens for this event, so the choice survives the page switch.
   */
  const handleRequestQuoteFor = useCallback(
    (serviceType: string) => {
      openCompany();
      window.setTimeout(() => {
        if (typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent(RFQ_QUICK_ACTION_EVENT, { detail: { serviceType } }));
        }
        document.getElementById('rfq')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    },
    [openCompany]
  );

  const handleChoosePortal = (choice: PortalChoice) => {
    savePortalChoice(choice);
    setChooserOpen(false);
    if (choice === 'academy') openAcademyHash('#academy');
    else if (choice === 'client') openClient('overview');
    else openCompany();
  };

  /* ------------------------------ navigation ------------------------------ */

  // The corporate destinations, and only them: the academy has its own bar.
  const corporateNav = useMemo(
    () => [
      { ar: 'الرئيسية', en: 'Home', onClick: () => openCompany(), current: route.portal === 'company' && route.page === 'home' },
      { ar: 'خدماتنا', en: 'Services', onClick: () => openCompany('services') },
      { ar: 'إمكانياتنا', en: 'Capabilities', onClick: () => openCompany('fleet-inspector') },
      { ar: 'مشروعاتنا', en: 'Projects', onClick: () => openCompany('projects') },
      { ar: 'ملف التأهيل', en: 'Vendor dossier', onClick: () => openCompany('vault') },
    ],
    [openCompany, route]
  );

  const clientNav = useMemo(
    () =>
      (
        [
          { id: 'overview', ar: 'لوحة التحكم', en: 'Overview' },
          { id: 'requests', ar: 'طلبات العملاء', en: 'Requests' },
          { id: 'companies', ar: 'أرشيف الشركات والملفات', en: 'Companies & Dossiers' },
          { id: 'timeclock', ar: 'الحضور والانصراف', en: 'Time-Clock' },
          { id: 'community', ar: 'مجتمع الأعمال', en: 'Community' },
          { id: 'register', ar: 'التسجيل وربط الكود', en: 'Registration' },
        ] as { id: ClientSectionId; ar: string; en: string }[]
      ).map(item => ({
        ...item,
        current: route.portal === 'client' && route.section === item.id,
        onClick: () => openClient(item.id),
      })),
    [openClient, route]
  );

  /** Portal › page › sub-page, for the bar at the very top. */
  const trail: PortalTrailStep[] = useMemo(() => {
    if (route.portal === 'company') {
      const steps: PortalTrailStep[] = [
        { label: isAr ? 'بوابة الشركة' : 'Company portal', onClick: () => openCompany() },
      ];
      if (route.page === 'service') {
        const family = serviceFamilyById(route.family);
        steps.push({ label: family ? family.title[language] : '' });
      } else if (route.page === 'demo') {
        steps.push({ label: isAr ? 'العرض الفني التفاعلي' : 'Technical demonstrations' });
      } else {
        steps.push({ label: isAr ? 'ملف الشركة والخدمات' : 'Profile & services' });
      }
      return steps;
    }

    if (route.portal === 'client') {
      const steps: PortalTrailStep[] = [
        { label: isAr ? 'بوابة العملاء' : 'Client portal', onClick: () => openClient('overview') },
        {
          label: clientSectionLabel(route.section, isAr ? 'ar' : 'en'),
          onClick: route.companyId ? () => openClient('companies') : undefined,
        },
      ];
      if (route.companyId) {
        steps.push({ label: isAr ? 'فايل الشركة والتقارير' : 'Company Dossier' });
      }
      return steps;
    }

    const academy = isAr ? 'الأكاديمية الهندسية' : 'Engineering academy';
    const steps: PortalTrailStep[] = [
      { label: academy, onClick: () => openAcademyHash('#academy') },
    ];
    if (route.page === 'disciplines') {
      steps.push({ label: isAr ? 'التخصصات الثمانية' : 'Eight disciplines' });
    } else if (route.page === 'discipline') {
      steps.push({
        label: isAr ? 'التخصصات الثمانية' : 'Eight disciplines',
        onClick: () => openAcademyHash('#academy/disciplines'),
      });
      steps.push({ label: isAr ? 'صفحة التخصص' : 'Discipline page' });
    } else if (route.page === 'section') {
      steps.push({
        label: academySectionLabel(route.section, isAr ? 'ar' : 'en'),
        onClick: () => openAcademyHash(`#academy/${route.section}`),
      });
    } else {
      steps.push({ label: isAr ? 'رئيسية الأكاديمية' : 'Academy home' });
    }
    return steps;
  }, [route, isAr, language, openCompany, openClient, openAcademyHash]);

  const academyRoute: AcademyRoute | null = route.portal === 'academy' ? route : null;
  const clientRoute: ClientRoute | null = route.portal === 'client' ? route : null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      data-theme={theme}
      data-unit-system={defaultUnitSystem}
      data-portal={portal}
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      <div className="sticky top-0 z-50">
        {mapsQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}
        {/* Which portal am I in, and how do I get to the other one. */}
        <PortalSwitchBar
          language={language}
          portal={portal}
          trail={trail}
          onSwitchPortal={openPortal}
        />

        <header
          className={`border-b backdrop-blur-md transition-colors ${
            portal === 'academy'
              ? isLight
                ? 'border-slate-200 bg-white/95'
                : 'border-amber-500/20 bg-[#0b0c1c]/95'
              : portal === 'client'
                ? isLight
                  ? 'border-slate-200 bg-white/95'
                  : 'border-emerald-500/25 bg-slate-950/95'
                : isLight
                  ? 'border-slate-200 bg-white/95'
                  : 'border-slate-800 bg-slate-950/95'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Zone 1: the company wordmark. It belongs to the company, so it
                always leads back to the corporate profile. */}
            <button
              type="button"
              aria-label={isAr ? 'الرئيسية - شركة إنسكو' : 'INSCO Home Profile'}
              onClick={() => openCompany()}
              className="flex items-center gap-2.5 text-start cursor-pointer group"
            >
              <div
                className={`p-2 rounded-lg border transition ${
                  portal === 'academy'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:border-amber-400'
                    : portal === 'client'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400'
                      : 'bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400'
                }`}
              >
                {portal === 'academy' ? (
                  <GraduationCap className="w-5 h-5" aria-hidden="true" />
                ) : portal === 'client' ? (
                  <BriefcaseBusiness className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <div className="whitespace-nowrap">
                <div className="text-base sm:text-lg font-black text-white tracking-tight">
                  {isAr
                    ? 'الشركة الدولية للخدمات والمقاولات - إنسكو'
                    : 'INSCO Industrial'}
                </div>
                <div
                  className={`text-[11px] font-mono flex items-center gap-1.5 ${
                    portal === 'academy'
                      ? 'text-amber-400'
                      : portal === 'client'
                        ? 'text-emerald-400'
                        : 'text-cyan-400'
                  }`}
                >
                  <span>
                    {portal === 'academy'
                      ? isAr
                        ? 'مسار المتدرّب · البوابة الهندسية'
                        : 'Learner path · engineering portal'
                      : portal === 'client'
                        ? isAr
                          ? 'بوابة العملاء والملفات المكوّدة'
                          : 'Client & Coded Dossier Portal'
                        : isAr
                          ? 'أكاديمية إنسكو NDT'
                          : 'INSCO NDT Academy'}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>CP/2026-10</span>
                </div>
              </div>
            </button>

            {/* Zone 2: the corporate or client portal destinations. */}
            {portal === 'company' && (
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
                  onClick={() => openCompany('rfq')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-slate-950 font-black transition whitespace-nowrap cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  {isAr ? 'اطلب عرض سعر' : 'Request a quote'}
                </button>
              </nav>
            )}

            {portal === 'client' && (
              <nav
                aria-label={isAr ? 'التنقل في بوابة العملاء' : 'Client portal navigation'}
                className="hidden xl:flex items-center gap-4 text-xs font-semibold text-slate-300"
              >
                {clientNav.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    aria-current={item.current ? 'page' : undefined}
                    className={`hover:text-emerald-400 transition whitespace-nowrap cursor-pointer ${
                      item.current ? 'text-emerald-400 font-bold' : ''
                    }`}
                  >
                    {isAr ? item.ar : item.en}
                  </button>
                ))}
              </nav>
            )}

            {portal === 'academy' && (
              <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-slate-400">
                <GraduationCap className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>{isAr ? 'مسار المتدرّب · بلا خدمات تجارية' : 'Learner path · no commercial content'}</span>
              </div>
            )}

            {/* Global search works across all portals. */}
            <div className="flex-1 max-w-xs hidden md:block">
              <GlobalHeaderSearch
                language={language}
                onNavigateToCompany={openCompany}
                onNavigateToClient={section => openClient(section)}
                onNavigateToAcademy={tab => openAcademy(tab as AcademyTab | undefined)}
              />
            </div>

            {/* Zone 3: actions, menu, theme, language. */}
            <div className="flex items-center gap-2 shrink-0">
              {portal === 'company' && (
                <>
                  <button
                    type="button"
                    onClick={() => openCompany('rfq')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition whitespace-nowrap cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'اطلب عرض سعر' : 'Request a quote'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={isAr ? 'فتح قائمة التنقل' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <Menu className="w-4 h-4" aria-hidden="true" />
              </button>

              <GlobalAppConfigControl language={language} />

              <GlobalThemeSwitcher language={language} />

              <button
                type="button"
                onClick={() => setLanguage(isAr ? 'en' : 'ar')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="font-semibold">{isAr ? 'English' : 'العربية'}</span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* ------------------------------ the pages ---------------------------- */}
      <main className={`flex-1 ${route.portal === 'company' ? 'pb-20 xl:pb-0' : ''}`}>
        {route.portal === 'company' && route.page === 'home' && (
          <CompanyPortal
            language={language}
            onNavigateToAcademy={() => openAcademyHash('#academy')}
            onNavigateToClient={sec => openClient(sec ?? 'companies')}
            onOpenCompanyDossier={companyId => openClient('companies', companyId)}
            onOpenDemo={() => openDemo()}
            onOpenService={openService}
          />
        )}

        {route.portal === 'company' && route.page === 'service' && (
          <CompanyServicePage
            language={language}
            family={serviceFamilyById(route.family) ?? serviceFamilyById('ndt')!}
            onBack={() => openCompany('services')}
            onOpenFamily={openService}
            onRequestQuote={handleRequestQuoteFor}
            onOpenDemo={anchorId => openDemo(anchorId)}
            onOpenAcademy={tab => openAcademy(tab as AcademyTab | undefined)}
          />
        )}

        {route.portal === 'company' && route.page === 'demo' && (
          <Suspense fallback={<AcademyLoading isAr={isAr} />}>
            <CompanyDemoPortal
              language={language}
              onBack={() => openCompany()}
              onRequestQuote={() => openCompany('rfq')}
              onOpenAcademy={tab => openAcademy(tab as AcademyTab | undefined)}
            />
          </Suspense>
        )}

        {clientRoute && (
          <div data-portal="client" className="min-h-full">
            <Suspense fallback={<ClientLoading isAr={isAr} />}>
              <ClientPortal
                language={language}
                section={clientRoute.section}
                companyId={clientRoute.companyId}
                onNavigateSection={(sec, compId) => openClient(sec, compId)}
                onOpenCompanyPortal={() => openCompany()}
              />
            </Suspense>
          </div>
        )}

        {academyRoute && (
          <div data-portal="academy" className="bg-[#080914] min-h-full">
            {/* The academy door is rendered here, synchronously: it is the proof
                that the visitor changed portal, before the library loads. */}
            <AcademyHeader
              language={language}
              route={academyRoute}
              onOpenHash={openAcademyHash}
              onOpenCompany={() => openCompany()}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              <Suspense fallback={<AcademyLoading isAr={isAr} />}>
                <AcademyContent
                  language={language}
                  route={academyRoute}
                  onOpenHash={openAcademyHash}
                  onTabChange={handleAcademyTabChange}
                />
              </Suspense>
            </div>

            <AcademyFooter
              language={language}
              onOpenHash={openAcademyHash}
              onOpenCompany={() => openCompany()}
            />
          </div>
        )}
      </main>

      {/* One mobile menu for all portals, each audience in its own group. */}
      <MobileNavDrawer
        open={menuOpen}
        language={language}
        portal={portal}
        onClose={() => setMenuOpen(false)}
        onNavigateSection={sectionId => openCompany(sectionId)}
        onOpenDemo={() => openDemo()}
        onOpenAcademy={tab => openAcademy(tab)}
        onOpenClient={section => openClient(section)}
      />

      {/* First-visit fork across the three portals (never covers a deep link) */}
      {chooserOpen && (
        <PortalChooser
          language={language}
          onChoose={handleChoosePortal}
          onDismiss={() => setChooserOpen(false)}
        />
      )}

      {/* Sticky conversion bar — corporate portal only. */}
      {route.portal === 'company' && (
        <div className="xl:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCompany('rfq')}
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
            <MessageCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
          </a>
        </div>
      )}

      {/* Each portal ends in its own footer. */}
      {route.portal === 'company' && (
        <CompanyFooter
          language={language}
          onOpenSection={openCompany}
          onOpenDemo={() => openDemo()}
          onOpenAcademy={() => openAcademyHash('#academy')}
          onOpenClient={() => openClient('overview')}
        />
      )}

      {route.portal === 'client' && (
        <footer className="border-t border-emerald-500/20 bg-slate-950 py-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? 'بوابة عملاء إنسكو وأرشيف الشركات المكوّدة وملفات التقارير'
                  : 'INSCO Client Portal — Coded Company Archive & Inspection Dossiers'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => openCompany()}
                className="hover:text-cyan-300 transition cursor-pointer"
              >
                {isAr ? 'بوابة الشركة والخدمات' : 'Corporate Portal'}
              </button>
              <button
                type="button"
                onClick={() => openAcademyHash('#academy')}
                className="hover:text-amber-300 transition cursor-pointer"
              >
                {isAr ? 'أكاديمية إنسكو' : 'INSCO Academy'}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
