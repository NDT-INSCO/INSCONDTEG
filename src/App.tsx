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
import { SiteAccountActions } from './components/account/SiteAccountActions';
import { SiteAccountProvider, useSiteAccount } from './account/SiteAccountContext';
import { InscoDualAiDock } from './components/ai/InscoDualAiDock';
import { TranslatorRobot } from './components/TranslatorRobot';
import { GeoLocaleBanner } from './components/GeoLocaleBanner';
import { SeoManager } from './components/SeoManager';
import { HeaderLanguageSelector } from './components/HeaderLanguageSelector';
import { getRobotTarget, translationRobot } from './i18n/translationStore';
import { markManualOverride } from './i18n/geoLocale';
import { reportWebVitals } from './utils/performance';
import { notifyNativeLanguageChange, subscribeGlobalLanguage } from './i18n/globalLanguageSync';
import { Language } from './types';
import { AcademyTab } from './academyTabs';
import { ADMIN_HASH } from './admin/contract';
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
  networkSectionLabel,
  type AcademyRoute,
  type ClientRoute,
  type ClientSectionId,
  type NetworkSectionId,
  type PortalId,
  type Route,
} from './utils/portalRoutes';
import { AcademyHeader, AcademyFooter } from './components/academy/AcademyShell';
import { COMPANY_DETAILS, isCompanyDemoAnchor } from './utils/companyRoutes';
import { CompanyAnchor } from './components/company/CompanyAnchor';
import { useTheme } from './utils/themeStore';
import { useDefaultUnitSystem } from './utils/unitSystemStore';
import {
  readPortalChoice,
  savePortalChoice,
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

const CompanyDestination = React.lazy(() =>
  import('./components/company/CompanyDestination').then(module => ({ default: module.CompanyDestination }))
);

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

// The engineering network is the fourth portal. It is a community, so it keeps
// its own header, footer and data — and its own chunk: a visitor reading about
// PWHT services never downloads a feed.
const NetworkPortal = React.lazy(() =>
  import('./components/network/NetworkPortal').then(module => ({ default: module.NetworkPortal }))
);

// The admin portal (password + passkeys) is a stand-alone page: it replaces the
// site chrome instead of floating inside a corporate or academy page.
const AdminPortal = React.lazy(() => import('./components/admin/AdminPortal'));

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

function CompanyLoading({ language }: { language: Language }) {
  return (
    <p role="status" className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-300 sm:px-6">
      {language === 'ar' ? 'جارٍ تحميل صفحة الشركة…' : 'Loading the company page…'}
    </p>
  );
}

function SkipToContent({ language }: { language: Language }) {
  return (
    <a
      href="#insco-main"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-sky-200 focus:px-4 focus:py-2 focus:font-bold focus:text-slate-950"
      onClick={event => {
        event.preventDefault();
        document.getElementById('insco-main')?.focus();
      }}
    >
      {language === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to content'}
    </a>
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

/** Drop any page-local private state immediately on an account switch. */
function PublicRouteMain({ children, className }: React.ComponentProps<'main'>) {
  const { user } = useSiteAccount();
  return <main id="insco-main" tabIndex={-1} key={user ? `account:${user.uid}` : 'guest'} className={className}>{children}</main>;
}

const LANGUAGE_KEY = 'insco_language_v1';

function readLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    // Default to English — Arabic only when explicitly saved
    return saved === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(readLanguage);
  const { theme, isLight } = useTheme();
  const { defaultUnitSystem } = useDefaultUnitSystem();

  // One structured hash route across all public portals.
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [chooserOpen, setChooserOpen] = useState(false);
  const [quoteService, setQuoteService] = useState<string>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  // `#admin` is its own page, not a fourth portal: no nav, no footer, no browsing.
  const [adminOpen, setAdminOpen] = useState(() => window.location.hash === ADMIN_HASH);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const isAr = language === 'ar';
  const portal: PortalId = route.portal;
  const companyHome = route.portal === 'company' && route.page === 'home';

  useEffect(() => {
    const chrome = document.getElementById('site-chrome');
    if (!chrome) return;
    const sync = () => document.documentElement.style.setProperty('--insco-sticky-offset', `${chrome.getBoundingClientRect().height + 12}px`);
    sync();
    const observer = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver(sync) : null;
    observer?.observe(chrome);
    return () => {
      observer?.disconnect();
      document.documentElement.style.removeProperty('--insco-sticky-offset');
    };
  }, [portal, adminOpen]);

  const switchLanguage = useCallback((next: Language) => {
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* ignore */ }
    markManualOverride();
    setLanguage(next);
    try { notifyNativeLanguageChange(next); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // While the Translator Robot is active it owns <html lang/dir> (the
    // translated language may be RTL even when the native site is LTR).
    if (!getRobotTarget()) {
      document.documentElement.lang = language;
      document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    }
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* private mode: language simply resets on reload */
    }
  }, [language, isAr]);

  // Global language sync — any page changes language, whole site updates
  useEffect(() => {
    const unsub = subscribeGlobalLanguage(detail => {
      if (detail.source && detail.source !== language) {
        setLanguage(detail.source);
      }
      if (detail.target !== undefined) {
        const current = getRobotTarget();
        if (detail.target !== current) {
          if (detail.target) {
            // Another tab/page chose a world language — apply it here silently
            void translationRobot.enable(detail.target, { manual: false });
          } else if (current) {
            translationRobot.disable({ manual: false });
          }
        }
      }
      // Also handle legacy robot-changed custom event for intra-tab
    });
    const onRobotChanged = (e: Event) => {
      const d = (e as CustomEvent<{ target: string | null }>).detail;
      if (d?.target !== undefined) {
        const cur = getRobotTarget();
        if (d.target !== cur) {
          if (d.target) void translationRobot.enable(d.target, { manual: false });
          else if (cur) translationRobot.disable({ manual: false });
        }
      }
    };
    window.addEventListener('insco:robot-changed', onRobotChanged as EventListener);
    return () => {
      unsub();
      window.removeEventListener('insco:robot-changed', onRobotChanged as EventListener);
    };
  }, [language]);

  // Performance vitals in dev
  useEffect(() => {
    try {
      if ((import.meta as unknown as { env?: { DEV?: boolean } })?.env?.DEV) reportWebVitals();
    } catch { /* ignore */ }
  }, []);

  /* ------------------------------- routing -------------------------------- */

  /** Write the address bar without re-running the whole router. */
  const writeHash = useCallback((next: Route, mode: 'push' | 'replace') => {
    const target = `${window.location.pathname}${window.location.search}${routeToHash(next)}`;
    if (target === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
    if (mode === 'push') window.history.pushState(null, '', target);
    else window.history.replaceState(null, '', target);
  }, []);

  /** Corporate profile or shareable destination. Store no form fields in the URL. */
  const openCompany = useCallback(
    (sectionId?: string, service?: string) => {
      const next = parseRoute(sectionId && sectionId !== 'top' ? `#${sectionId}` : '');
      setRoute(next);
      setQuoteService(service);
      setChooserOpen(false);
      writeHash(next, 'push');
      window.scrollTo({ top: 0, behavior: 'auto' });
      savePortalChoice('company');
    },
    [writeHash]
  );

  const openDemo = useCallback(
    (anchorId?: string) => {
      const next: Route = {
        portal: 'company',
        page: 'demo',
        anchor: anchorId && isCompanyDemoAnchor(anchorId) ? anchorId : undefined,
      };
      setRoute(next);
      writeHash(next, 'push');
      window.scrollTo({ top: 0, behavior: 'auto' });
      savePortalChoice('company');
    },
    [writeHash]
  );

  const openService = useCallback(
    (id: ServiceFamilyId) => {
      const next: Route = { portal: 'company', page: 'service', family: id };
      setRoute(next);
      writeHash(next, 'push');
      window.scrollTo({ top: 0, behavior: 'auto' });
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

  /**
   * The engineering network: `#network`, `#network/<section>`, or a record inside
   * a section (`#network/profile/<handle>`). Kept on the hash so a member's post
   * can be linked and shared like any other page.
   */
  const openNetwork = useCallback((section: NetworkSectionId = 'feed', entryId?: string) => {
    const next: Route = {
      portal: 'network',
      page: 'section',
      section,
      ...(entryId ? { entryId } : {}),
    };
    setRoute(next);
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${routeToHash(next)}`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    savePortalChoice('network');
  }, []);

  const openPortal = useCallback(
    (next: PortalId) => {
      if (next === portal) return;
      if (next === 'academy') openAcademyHash('#academy');
      else if (next === 'client') openClient('overview');
      else if (next === 'network') openNetwork('feed');
      else openCompany();
    },
    [openAcademyHash, openClient, openNetwork, openCompany, portal]
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
    } else if (savedChoice === 'network') {
      setRoute({ portal: 'network', page: 'section', section: 'feed' });
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#network/feed`
      );
    }
    // Runs once: later portal switches are the visitor's own decision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/forward between portals, service pages, demos and academy deep links.
  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute(window.location.hash);
      setRoute(next);
      // Fragment history can fire both popstate and hashchange. Do not scroll
      // to the top over an anchor the lazy destination has already positioned.
      if (next.portal === 'company' && (
        (next.page === 'service' && !next.method) ||
        (next.page === 'demo' && !next.anchor) ||
        (next.page === 'detail' && (!next.anchor || next.anchor === COMPANY_DETAILS[next.detail].hash || /^(contact|vendor|capabilities)$/.test(next.anchor)))
      )) window.scrollTo({ top: 0, behavior: 'auto' });
      setQuoteService(undefined);
      setChooserOpen(false);
      setAdminOpen(window.location.hash === ADMIN_HASH);
    };
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
      if (route.portal === 'network') {
        const networkName = isAr ? 'الشبكة الهندسية' : 'Engineering Network';
        return route.page === 'home'
          ? networkName
          : `${networkSectionLabel(route.section, isAr ? 'ar' : 'en')} | ${networkName}`;
      }
      if (route.portal === 'academy') {
        if (route.page === 'hub') return isAr ? 'أكاديمية إنسكو الهندسية' : 'INSCO Engineering Academy';
        if (route.page === 'disciplines') return isAr ? 'التخصصات الهندسية الثمانية' : 'The eight engineering disciplines';
        if (route.page === 'discipline') return isAr ? 'صفحة التخصص' : 'Discipline';
        return academySectionLabel(route.section, isAr ? 'ar' : 'en');
      }
      if (route.page === 'demo') return isAr ? 'العرض الفني التفاعلي' : 'Technical Demonstrations';
      if (route.page === 'detail') return COMPANY_DETAILS[route.detail][language];
      if (route.page === 'service') {
        const family = serviceFamilyById(route.family);
        if (family) return family.title[language];
      }
      return isAr ? 'خدمات الفحص غير الإتلافي والمعالجة الحرارية' : 'NDT Inspection & PWHT Services';
    })();
    document.title = `${routeTitle} | ${companyName}`;
  }, [route, language, isAr]);

  // The route carries only its destination; prefill lives in state, not in a timed event.
  const handleRequestQuoteFor = useCallback((serviceType: string) => openCompany('rfq', serviceType), [openCompany]);

  const handleChoosePortal = (choice: PortalChoice) => {
    savePortalChoice(choice);
    setChooserOpen(false);
    if (choice === 'academy') openAcademyHash('#academy');
    else if (choice === 'client') openClient('overview');
    else if (choice === 'network') openNetwork('feed');
    else openCompany();
  };

  /* ------------------------------ navigation ------------------------------ */

  // The corporate destinations, and only them: the academy has its own bar.
  const corporateNav = useMemo(
    () => [
      { ar: 'الرئيسية', en: 'Home', onClick: () => openCompany(), current: route.portal === 'company' && route.page === 'home' },
      { ar: 'خدماتنا', en: 'Services', onClick: () => openCompany('services'), current: route.portal === 'company' && (route.page === 'service' || (route.page === 'detail' && route.detail === 'services')) },
      { ar: 'إمكانياتنا', en: 'Capabilities', onClick: () => openCompany('fleet-inspector'), current: route.portal === 'company' && route.page === 'detail' && route.detail === 'equipment' },
      { ar: 'مشروعاتنا', en: 'Projects', onClick: () => openCompany('projects'), current: route.portal === 'company' && route.page === 'detail' && route.detail === 'projects' },
      { ar: 'عن إنسكو', en: 'About', onClick: () => openCompany('about'), current: route.portal === 'company' && route.page === 'detail' && route.detail === 'about' },
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
          { id: 'community', ar: 'مجتمع INSCO', en: 'INSCO Community' },
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
    if (route.portal === 'network') {
      const steps: PortalTrailStep[] = [
        {
          label: isAr ? 'الشبكة الهندسية' : 'Engineering Network',
          onClick: () => openNetwork('feed'),
        },
      ];
      if (route.page === 'section') {
        steps.push({ label: networkSectionLabel(route.section, isAr ? 'ar' : 'en') });
      } else {
        steps.push({ label: isAr ? 'المنشورات' : 'Feed' });
      }
      return steps;
    }

    if (route.portal === 'company') {
      const steps: PortalTrailStep[] = [
        { label: isAr ? 'بوابة الشركة' : 'Company portal', onClick: () => openCompany() },
      ];
      if (route.page === 'service') {
        const family = serviceFamilyById(route.family);
        steps.push({ label: isAr ? 'الخدمات' : 'Services', onClick: () => openCompany('services') });
        steps.push({ label: family ? family.title[language] : '' });
      } else if (route.page === 'demo') {
        steps.push({ label: isAr ? 'العرض الفني التفاعلي' : 'Technical demonstrations' });
      } else if (route.page === 'detail') {
        steps.push({ label: COMPANY_DETAILS[route.detail][language] });
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
  }, [route, isAr, language, openCompany, openClient, openAcademyHash, openNetwork]);

  /** Stand-alone admin page: the site chrome is replaced, not covered. */
  const openAdmin = useCallback(() => {
    setMenuOpen(false);
    setAdminOpen(true);
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${ADMIN_HASH}`
    );
  }, []);

  /** Back to the site, with the address bar no longer claiming `#admin`. */
  const closeAdmin = useCallback(() => {
    setAdminOpen(false);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  const academyRoute: AcademyRoute | null = route.portal === 'academy' ? route : null;
  const clientRoute: ClientRoute | null = route.portal === 'client' ? route : null;

  if (adminOpen) {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        data-theme={theme}
        data-portal="admin"
        className={`min-h-screen font-sans ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}
      >
        <Suspense
          fallback={
            <div role="status" aria-live="polite" className="p-8 text-sm text-slate-400">
              {isAr ? 'جارٍ فتح بوابة الإدارة…' : 'Opening the admin portal…'}
            </div>
          }
        >
          <AdminPortal
            language={language}
            onBack={closeAdmin}
            onToggleLanguage={() => switchLanguage(isAr ? 'en' : 'ar')}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <SiteAccountProvider>
    {/* The Network consumes the same provider as all other public routes. */}
    {route.portal === 'network' ? (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        data-theme={theme}
        data-portal="network"
        className={`min-h-screen flex flex-col font-sans ${isLight ? 'bg-[#f6f6fb] text-slate-900' : 'bg-[#07070f] text-slate-100'}`}
      >
        <SkipToContent language={language} />
        <div id="site-chrome" className="sticky top-0 z-50">
          <PortalSwitchBar
            language={language}
            portal={portal}
            trail={trail}
            onSwitchPortal={openPortal}
          />
          <header className="border-b border-violet-500/20 bg-slate-950">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2 px-4 pt-2 sm:px-6">
              <GlobalThemeSwitcher language={language} />
              <HeaderLanguageSelector source={language} onSwitchNativeLanguage={switchLanguage} />
              <button type="button" onClick={() => switchLanguage(isAr ? 'en' : 'ar')} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white">
                {isAr ? 'English' : 'العربية'}
              </button>
            </div>
          </header>
        </div>
        <Suspense
          fallback={
            <div role="status" aria-live="polite" className="p-8 text-sm text-slate-400">
              {isAr ? 'جارٍ فتح الشبكة الهندسية…' : 'Opening the Engineering Network…'}
            </div>
          }
        >
          <NetworkPortal
            language={language}
            section={route.page === 'section' ? route.section : 'feed'}
            entryId={route.page === 'section' ? route.entryId : undefined}
            onOpenSection={openNetwork}
            onOpenCompany={() => openCompany()}
            onOpenAcademy={() => openAcademyHash('#academy')}
            onOpenPrivateProfile={() => openClient('register')}
          />
        </Suspense>
      </div>
    ) : (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      data-theme={theme}
      data-unit-system={defaultUnitSystem}
      data-portal={portal}
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      <SkipToContent language={language} />
      <div id="site-chrome" className="sticky top-0 z-50">
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
          onOpenCommunity={() => openClient('community')}
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
              className="flex min-w-0 items-center gap-2.5 text-start cursor-pointer group"
            >
              <div
                className={`p-2 rounded-lg border transition ${
                  portal === 'academy'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:border-amber-400'
                    : portal === 'client'
                      ? 'shrink-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400'
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
              <div className="min-w-0">
                <div className="truncate text-base sm:text-lg font-black text-white tracking-tight">
                  <span className="sm:hidden">{isAr ? 'إنسكو' : 'INSCO'}</span>
                  <span className="hidden sm:inline">
                    {portal === 'company' ? 'INSCO NDT' : isAr ? 'إنسكو' : 'INSCO'}
                  </span>
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
                  <span className="min-w-0 truncate">
                    {portal === 'academy'
                      ? isAr
                        ? 'مسار المتدرّب · البوابة الهندسية'
                        : 'Learner path · engineering portal'
                      : portal === 'client'
                        ? isAr
                          ? 'بوابة العملاء والملفات المكوّدة'
                          : 'Client & Coded Dossier Portal'
                        : 'NDT / PWHT'}
                  </span>
                  <span aria-hidden="true" className="hidden lg:inline text-slate-600">·</span>
                  <span className="hidden lg:inline shrink-0">CP/2026-10</span>
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
                    className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-300 hover:bg-sky-200 text-slate-950 text-xs font-black transition whitespace-nowrap cursor-pointer"
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
                aria-haspopup="dialog"
                className={`${portal === 'company' ? '' : 'xl:hidden'} inline-flex items-center justify-center p-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition cursor-pointer`}
              >
                <Menu className="w-4 h-4" aria-hidden="true" />
              </button>

              <GlobalAppConfigControl language={language} />

              <GlobalThemeSwitcher language={language} />

              <HeaderLanguageSelector source={language} onSwitchNativeLanguage={switchLanguage} />

              {/* Direct ar/en toggle for quick switch + test compatibility */}
              <button
                type="button"
                onClick={() => switchLanguage(isAr ? 'en' : 'ar')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <span className="font-semibold">{isAr ? 'English' : 'العربية'}</span>
              </button>
            </div>
          </div>
          <SiteAccountActions language={language} onOpenProfile={() => openClient('register')} />
        </header>
      </div>

      {/* ------------------------------ the pages ---------------------------- */}
      <PublicRouteMain className={`flex-1 ${route.portal === 'company' ? 'pb-20 xl:pb-0' : ''}`}>
        {companyHome && (
          <CompanyPortal
            language={language}
            onNavigateToSection={openCompany}
            onOpenDemo={() => openDemo()}
            onNavigateToClient={() => openClient('overview')}
            onNavigateToAcademy={() => openAcademyHash('#academy')}
          />
        )}

        {route.portal === 'company' && route.page === 'home' && <CompanyAnchor id={route.anchor} />}

        {route.portal === 'company' && route.page === 'detail' && (
          <Suspense fallback={<CompanyLoading language={language} />}>
            <CompanyDestination
              key={route.detail}
              language={language}
              detail={route.detail}
              anchor={route.anchor}
              quoteService={quoteService}
              onOpen={openCompany}
              onOpenService={openService}
              onOpenDemo={openDemo}
              onOpenClient={openClient}
              onOpenDossier={id => openClient('companies', id)}
              onOpenAcademy={tab => openAcademy(tab as AcademyTab | undefined)}
            />
          </Suspense>
        )}

        {route.portal === 'company' && route.page === 'service' && (
          <>
          <CompanyServicePage
            language={language}
            family={serviceFamilyById(route.family) ?? serviceFamilyById('ndt')!}
            methodId={route.method}
            onBack={() => openCompany('services')}
            onOpenFamily={openService}
            onRequestQuote={handleRequestQuoteFor}
            onOpenDemo={anchorId => openDemo(anchorId)}
            onOpenAcademy={tab => openAcademy(tab as AcademyTab | undefined)}
          />
          <CompanyAnchor id={route.method ? `service-method-${route.method}` : undefined} />
          </>
        )}

        {route.portal === 'company' && route.page === 'demo' && (
          <Suspense fallback={<CompanyLoading language={language} />}>
            <CompanyDemoPortal
              language={language}
              anchor={route.anchor}
              onBack={() => openCompany()}
              onRequestQuote={() => openCompany('rfq')}
              onOpenAcademy={tab => openAcademy(tab as AcademyTab | undefined)}
            />
            <CompanyAnchor id={route.anchor} />
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
              onOpenAdmin={openAdmin}
            />
          </div>
        )}
      </PublicRouteMain>

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
        onOpenNetwork={section => openNetwork(section)}
      />

      {/* Optional portal guide; it never blocks the first view. */}
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
            className="flex-1 rounded-lg bg-sky-300 hover:bg-sky-200 text-slate-950 px-3 py-2.5 text-sm font-black transition cursor-pointer"
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
          onOpenAdmin={openAdmin}
          onOpenChooser={() => setChooserOpen(true)}
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
      {/* Dual Professional AI Agents Dock (User Copilot + Site Manager Director) */}
      <InscoDualAiDock
        language={language}
        portal={portal}
        section={
          route.portal === 'client'
            ? route.section
            : route.portal === 'academy' && route.page === 'section'
              ? route.section
              : route.portal === 'company'
                ? route.page === 'detail' ? route.detail : route.page
                : undefined
        }
        onOpenCompany={sectionId => openCompany(sectionId)}
        onOpenClient={sec => openClient(sec)}
        onOpenAcademy={tab => openAcademy(tab)}
      />
    </div>
    )}
    <SeoManager language={language} portal={portal} routePath={window.location.hash || '#'} />
    {/* Geo-aware auto-translation (IP → country → language): opens the site in the visitor's language, change always optional */}
    <GeoLocaleBanner source={language} onSwitchNativeLanguage={switchLanguage} />
    {/* Universal Translator Robot — every world language, on every portal. */}
    <TranslatorRobot source={language} />
    </SiteAccountProvider>
  );
};
