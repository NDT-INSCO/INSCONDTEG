/**
 * One address book for the two portals.
 *
 * The site sells two different things to two different audiences, so every
 * screen belongs to exactly one portal and the address says which:
 *
 *   company portal   ''                      corporate profile
 *                    `#services/<family>`    one service family page
 *                    `#demo`                 technical demonstrations
 *
 *   academy portal   `#academy`                       academy home
 *                    `#academy/disciplines`           the eight disciplines
 *                    `#academy/disciplines/<id>`      one discipline page
 *                    `#academy/<section>`             one journey section
 *                    `#academy/<section>/<tab>`       a section + a tab
 *
 * Legacy links keep working: every one of the 33 bare tab hashes (`#edb`,
 * `#rt_lab`, `#quiz`…) still resolves to the academy, and the section that owns
 * that tab is derived from the same grouping the journey navigation uses.
 *
 * This module is deliberately dependency-free apart from the tiny tab list and
 * the service-family list, so the app shell can import it without pulling the
 * academy library into the first payload.
 */
import { isAcademyTab, type AcademyTab } from '../academyTabs';
import {
  readServiceFamilyHash,
  serviceFamilyHash,
  type ServiceFamilyId,
} from './serviceFamilies';

import { companyDetailForHash, isCompanyDemoAnchor, type CompanyDemoAnchor, type CompanyDetailId } from './companyRoutes';

export type PortalId = 'company' | 'client' | 'academy' | 'network';

/* -------------------------------- client ---------------------------------- */

export const CLIENT_SECTIONS = [
  'overview',
  'requests',
  'companies',
  'timeclock',
  'community',
  'register',
] as const;

export type ClientSectionId = (typeof CLIENT_SECTIONS)[number];

const CLIENT_SECTION_LABELS: Record<ClientSectionId, { ar: string; en: string }> = {
  overview: { ar: 'لوحة بوابة العملاء', en: 'Client Overview' },
  requests: { ar: 'طلبات العملاء الجدد', en: 'Client Requests' },
  companies: { ar: 'أرشيف الشركات والملفات', en: 'Companies & Dossiers' },
  timeclock: { ar: 'بوابة الحضور والانصراف', en: 'Worker Time-Clock' },
  community: { ar: 'مجتمع إدارة الأعمال', en: 'Business Community' },
  register: { ar: 'التسجيل وربط الكود', en: 'Registration & Code Link' },
};

export function clientSectionLabel(section: ClientSectionId, language: 'ar' | 'en'): string {
  return CLIENT_SECTION_LABELS[section][language];
}

export function isClientSectionId(value: string): value is ClientSectionId {
  return (CLIENT_SECTIONS as readonly string[]).includes(value);
}

/* ------------------------------- academy ---------------------------------- */

export const ACADEMY_SECTIONS = [
  'choose',
  'learn',
  'practice',
  'test',
  'progress',
  'mentor',
] as const;

export type AcademySectionId = (typeof ACADEMY_SECTIONS)[number];

/**
 * Which tabs live under each section. This mirrors the station grouping in
 * `AcademyStationNav` exactly; `tests/portalIsolation.test.tsx` compares the two
 * so the map and the navigation can never drift apart.
 */
export const ACADEMY_SECTION_TABS: Record<AcademySectionId, readonly AcademyTab[]> = {
  choose: ['paths', 'curriculum', 'courses', 'methods'],
  learn: ['encyclopedia', 'knowledge', 'edb', 'flashcards', 'standards'],
  practice: [
    'sim_labs_rt',
    'sim_labs_ar',
    'ar_rt_codes',
    'ge_exposure_time',
    'workshops',
    'rt_lab',
    'rt_techniques',
    'paut_controller',
    'weld_simulator',
    'dac_builder',
    'v1_v2_calibration',
    'defects',
    'pwht_curve',
    'simulation_history',
  ],
  test: ['quiz', 'exam_simulation', 'practical', 'certification_center'],
  progress: ['completion_map', 'roadmap', 'leaderboard', 'certificates'],
  mentor: ['ask_ai', 'video_gen'],
};

export const ACADEMY_SECTION_DEFAULT_TAB: Record<AcademySectionId, AcademyTab> = {
  choose: 'paths',
  learn: 'encyclopedia',
  practice: 'sim_labs_rt',
  test: 'quiz',
  progress: 'completion_map',
  mentor: 'ask_ai',
};

const SECTION_LABELS: Record<AcademySectionId, { ar: string; en: string }> = {
  choose: { ar: 'اختر مسارك', en: 'Choose your path' },
  learn: { ar: 'تعلّم', en: 'Learn' },
  practice: { ar: 'تدرّب · معامل المحاكاة', en: 'Practice · Labs' },
  test: { ar: 'اختبر نفسك', en: 'Test yourself' },
  progress: { ar: 'تابع إنجازك', en: 'Track progress' },
  mentor: { ar: 'اسأل المدرّس', en: 'Ask the mentor' },
};

export function academySectionLabel(section: AcademySectionId, language: 'ar' | 'en'): string {
  return SECTION_LABELS[section][language];
}

/** One-line description of what lives in each section, used by the pages. */
export const ACADEMY_SECTION_COPY: Record<AcademySectionId, { ar: string; en: string }> = {
  choose: {
    ar: 'مسارات التعلم والمناهج الثمانية ومقررات NDE-Ed ودليل الطرق — ابدأ من هنا إذا لم تحدد تخصصك بعد.',
    en: 'Learning paths, the eight curricula, NDE-Ed courses and the methods guide — start here if you have not picked a discipline yet.',
  },
  learn: {
    ar: 'الكتب الدراسية التفاعلية، مكتبة الدروس، مستندات EDB، بطاقات الاستذكار ومكتبة الأكواد.',
    en: 'Interactive textbooks, the lesson library, EDB documents, flashcards and the standards library.',
  },
  practice: {
    ar: 'أربعة عشر معملاً ومحاكياً: RT، PAUT، فحص اللحام، DAC، V1/V2، عيوب اللحام ومنحنيات PWHT.',
    en: 'Fourteen labs and simulators: RT, PAUT, weld UT, DAC, V1/V2, weld defects and PWHT curves.',
  },
  test: {
    ar: 'اختبار المعرفة، محاكي امتحانات المستوى 1 و2، التقييم العملي الموثّق ومركز الاختبارات.',
    en: 'Knowledge quiz, Level 1 & 2 exam simulation, documented practical assessment and the exam centre.',
  },
  progress: {
    ar: 'خريطة الاستكمال، خارطة المسار، لوحة المتصدرين، وإفادة التعلّم الذاتي غير المعتمدة.',
    en: 'Completion map, roadmap, leaderboard, and the non-accredited self-study statement.',
  },
  mentor: {
    ar: 'المستشار الأكاديمي المدعوم بالذكاء الاصطناعي وتوليد فيديو المحاكاة.',
    en: 'The AI academic tutor and the simulation video generator.',
  },
};

export function isAcademySectionId(value: string): value is AcademySectionId {
  return (ACADEMY_SECTIONS as readonly string[]).includes(value);
}

/** The section that owns a tab (the inverse of `ACADEMY_SECTION_TABS`). */
export function academySectionOfTab(tab: AcademyTab): AcademySectionId {
  const found = ACADEMY_SECTIONS.find(section =>
    ACADEMY_SECTION_TABS[section].includes(tab)
  );
  return found ?? 'learn';
}

export function academySectionTabs(section: AcademySectionId): readonly AcademyTab[] {
  return ACADEMY_SECTION_TABS[section];
}

/* -------------------------------- network --------------------------------- */

/**
 * The professional network — the fourth portal.
 *
 * It is a community, not a brochure: the sections are the things a member does
 * (read the feed, look someone up, join a group, find a job), never a mix of
 * corporate or academy material.
 */
export const NETWORK_SECTIONS = [
  'feed',
  'profile',
  'groups',
  'people',
  'jobs',
  'articles',
  'events',
  'companies',
  'messages',
  'notifications',
  'search',
  'verify',
] as const;

export type NetworkSectionId = (typeof NETWORK_SECTIONS)[number];

const NETWORK_SECTION_LABELS: Record<NetworkSectionId, { ar: string; en: string }> = {
  feed: { ar: 'المنشورات', en: 'Feed' },
  profile: { ar: 'ملفي المهني', en: 'My profile' },
  groups: { ar: 'المجموعات', en: 'Groups' },
  people: { ar: 'الخبراء والأعضاء', en: 'People & experts' },
  jobs: { ar: 'الفرص المهنية', en: 'Jobs' },
  articles: { ar: 'المقالات', en: 'Articles' },
  events: { ar: 'الفعاليات', en: 'Events' },
  companies: { ar: 'المؤسسات', en: 'Organisations' },
  messages: { ar: 'الرسائل', en: 'Messages' },
  notifications: { ar: 'الإشعارات', en: 'Notifications' },
  search: { ar: 'البحث', en: 'Search' },
  verify: { ar: 'التحقق المهني', en: 'Verification' },
};

/** One word per section, for the narrow four-column phone navigation. */
export const NETWORK_SECTION_SHORT: Record<NetworkSectionId, { ar: string; en: string }> = {
  feed: { ar: 'المنشورات', en: 'Feed' },
  profile: { ar: 'ملفي', en: 'Profile' },
  groups: { ar: 'المجموعات', en: 'Groups' },
  people: { ar: 'الخبراء', en: 'People' },
  jobs: { ar: 'الفرص', en: 'Jobs' },
  articles: { ar: 'المقالات', en: 'Articles' },
  events: { ar: 'الفعاليات', en: 'Events' },
  companies: { ar: 'المؤسسات', en: 'Orgs' },
  messages: { ar: 'الرسائل', en: 'Inbox' },
  notifications: { ar: 'الإشعارات', en: 'Alerts' },
  search: { ar: 'البحث', en: 'Search' },
  verify: { ar: 'التحقق', en: 'Verified' },
};

export function networkSectionLabel(section: NetworkSectionId, language: 'ar' | 'en'): string {
  return NETWORK_SECTION_LABELS[section][language];
}

export function networkSectionShort(section: NetworkSectionId, language: 'ar' | 'en'): string {
  return NETWORK_SECTION_SHORT[section][language];
}

/** What each section is for, in one line — used on the cards and the page header. */
export const NETWORK_SECTION_COPY: Record<NetworkSectionId, { ar: string; en: string }> = {
  feed: {
    ar: 'منشورات ونقاشات فنية وأسئلة ميدانية ودراسات حالة — مصنّفة بالتخصص.',
    en: 'Technical posts, field questions and case studies — sorted by discipline.',
  },
  profile: {
    ar: 'هويتك المهنية: المسمّى، التخصص، مستويات NDT، الخبرة، والشهادات وحالة التحقق منها.',
    en: 'Your professional identity: headline, discipline, NDT levels, experience, and certificates with their verification state.',
  },
  groups: {
    ar: 'مجموعات متخصصة: UT · PAUT/TOFD · RT · فحص اللحام · PWHT · QA/QC · التآكل والمواد.',
    en: 'Discipline groups: UT · PAUT/TOFD · RT · welding inspection · PWHT · QA/QC · corrosion & materials.',
  },
  people: {
    ar: 'دليل الخبراء واقتراحات زملاء من نفس التخصص، مع طلب اتصال أو متابعة.',
    en: 'The expert directory and colleague suggestions from your discipline, with connect or follow.',
  },
  jobs: {
    ar: 'وظائف وفرص ومهام فحص في الموقع — بفلاتر التخصص والدولة والخبرة.',
    en: 'Jobs, contracts and site inspection assignments — filtered by discipline, country and experience.',
  },
  articles: {
    ar: 'مقالات وأبحاث ودراسات حالة، وربطها بدروس الأكاديمية عند توفر الصلة.',
    en: 'Articles, research and case studies, linked to academy lessons where they apply.',
  },
  events: {
    ar: 'ورش العمل والندوات والمؤتمرات المهنية وتسجيل الحضور.',
    en: 'Workshops, seminars and professional conferences, with registration.',
  },
  companies: {
    ar: 'صفحات المؤسسات: الخدمات والقطاعات والوظائف والأخبار — ومنها صفحة إنسكو.',
    en: 'Organisation pages: services, sectors, jobs and news — including the INSCO page.',
  },
  messages: {
    ar: 'رسائل مباشرة بين الأعضاء، منفصلة تماماً عن طلبات عروض الأسعار.',
    en: 'Direct messages between members, kept entirely apart from quote requests.',
  },
  notifications: {
    ar: 'طلبات الاتصال والتعليقات والتفاعلات وإشعارات المجموعات، بضبط كامل.',
    en: 'Connection requests, comments, reactions and group notices, fully adjustable.',
  },
  search: {
    ar: 'بحث واحد في الأشخاص والمجموعات والوظائف والمقالات والفعاليات.',
    en: 'One search across people, groups, jobs, articles and events.',
  },
  verify: {
    ar: 'INSCO Verified Professional: التحقق من الهوية والتحقق من الشهادة كمسارين منفصلين.',
    en: 'INSCO Verified Professional: identity verification and credential verification as two separate tracks.',
  },
};

export function isNetworkSectionId(value: string): value is NetworkSectionId {
  return (NETWORK_SECTIONS as readonly string[]).includes(value);
}

/* -------------------------------- routes ---------------------------------- */

export type CompanyRoute =
  | { portal: 'company'; page: 'home'; anchor?: string }
  | { portal: 'company'; page: 'service'; family: ServiceFamilyId }
  | { portal: 'company'; page: 'detail'; detail: CompanyDetailId; anchor: string }
  | { portal: 'company'; page: 'demo'; anchor?: CompanyDemoAnchor; legacyAnchor?: true };

export type AcademyRoute =
  | { portal: 'academy'; page: 'hub' }
  | { portal: 'academy'; page: 'disciplines' }
  | { portal: 'academy'; page: 'discipline'; disciplineId: string }
  | {
      portal: 'academy';
      page: 'section';
      section: AcademySectionId;
      tab?: AcademyTab;
    };

export type ClientRoute = {
  portal: 'client';
  page: 'section';
  section: ClientSectionId;
  companyId?: string;
};

export type NetworkRoute =
  | { portal: 'network'; page: 'home' }
  | { portal: 'network'; page: 'section'; section: NetworkSectionId; entryId?: string };

export type Route = CompanyRoute | ClientRoute | AcademyRoute | NetworkRoute;

const DISCIPLINE_SLUG = /^[a-z0-9][a-z0-9_-]*$/i;
const COMPANY_DOC_SLUG = /^[a-zA-Z0-9_-]{1,128}$/;

/** `#anything` → a structured route. Never throws, never returns undefined. */
export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '').trim();
  const lower = raw.toLowerCase();

  if (!raw) return { portal: 'company', page: 'home' };

  const family = readServiceFamilyHash(hash);
  if (family) return { portal: 'company', page: 'service', family };
  if (lower === 'demo') return { portal: 'company', page: 'demo' };
  if (lower.startsWith('demo/')) {
    const anchor = lower.slice('demo/'.length);
    if (isCompanyDemoAnchor(anchor)) return { portal: 'company', page: 'demo', anchor };
  }
  if (isCompanyDemoAnchor(lower)) return { portal: 'company', page: 'demo', anchor: lower, legacyAnchor: true };
  const detail = companyDetailForHash(lower);
  if (detail) return { portal: 'company', page: 'detail', detail, anchor: lower };

  const parts = lower.split('/').filter(Boolean);
  const rawParts = raw.split('/').filter(Boolean);

  if (parts[0] === 'client' || parts[0] === 'clients') {
    const sec = parts[1];
    if (sec && isClientSectionId(sec)) {
      if (sec === 'companies' && rawParts[2] && COMPANY_DOC_SLUG.test(rawParts[2])) {
        return { portal: 'client', page: 'section', section: 'companies', companyId: rawParts[2] };
      }
      return { portal: 'client', page: 'section', section: sec };
    }
    return { portal: 'client', page: 'section', section: 'overview' };
  }

  if (parts[0] === 'network') {
    if (parts.length === 1) return { portal: 'network', page: 'home' };
    const section = parts[1];
    if (isNetworkSectionId(section)) {
      const entryId = rawParts[2] && COMPANY_DOC_SLUG.test(rawParts[2]) ? rawParts[2] : undefined;
      return { portal: 'network', page: 'section', section, ...(entryId ? { entryId } : {}) };
    }
    return { portal: 'network', page: 'home' };
  }

  if (parts[0] === 'academy') {
    if (parts.length === 1) return { portal: 'academy', page: 'hub' };

    if (parts[1] === 'disciplines') {
      const requested = raw.split('/').filter(Boolean)[2];
      if (requested && DISCIPLINE_SLUG.test(requested)) {
        return { portal: 'academy', page: 'discipline', disciplineId: requested };
      }
      return { portal: 'academy', page: 'disciplines' };
    }

    if (isAcademySectionId(parts[1])) {
      const tabCandidate = parts[2];
      const tab = tabCandidate && isAcademyTab(tabCandidate) ? tabCandidate : undefined;
      return { portal: 'academy', page: 'section', section: parts[1], tab };
    }

    return { portal: 'academy', page: 'hub' };
  }

  // A bare tab (the legacy scheme) is still the canonical academy deep link.
  if (isAcademyTab(raw)) {
    return {
      portal: 'academy',
      page: 'section',
      section: academySectionOfTab(raw),
      tab: raw,
    };
  }

  // Anything else is an in-page anchor on the corporate profile.
  return { portal: 'company', page: 'home', anchor: raw };
}

/**
 * The hash for a route. The corporate home deliberately stays hash-free: the
 * profile is the landing page, and an empty address is what a printed business
 * card points at.
 */
export function routeToHash(route: Route): string {
  if (route.portal === 'company') {
    if (route.page === 'demo') {
      if (!route.anchor) return '#demo';
      return route.legacyAnchor ? `#${route.anchor}` : `#demo/${route.anchor}`;
    }
    if (route.page === 'service') return serviceFamilyHash(route.family);
    return route.anchor ? `#${route.anchor}` : '';
  }
  if (route.portal === 'client') {
    if (route.section === 'overview') return '#client';
    if (route.section === 'companies' && route.companyId) {
      return `#client/companies/${route.companyId}`;
    }
    return `#client/${route.section}`;
  }
  if (route.portal === 'network') {
    if (route.page === 'home') return '#network';
    return route.entryId ? `#network/${route.section}/${route.entryId}` : `#network/${route.section}`;
  }
  if (route.page === 'hub') return '#academy';
  if (route.page === 'disciplines') return '#academy/disciplines';
  if (route.page === 'discipline') return `#academy/disciplines/${route.disciplineId}`;
  return route.tab
    ? `#academy/${route.section}/${route.tab}`
    : `#academy/${route.section}`;
}

export function portalOf(route: Route): PortalId {
  return route.portal;
}

export function clientSectionHash(section: ClientSectionId, companyId?: string): string {
  if (section === 'overview') return '#client';
  if (section === 'companies' && companyId) return `#client/companies/${companyId}`;
  return `#client/${section}`;
}

export function isClientRoute(route: Route): route is ClientRoute {
  return route.portal === 'client';
}

export function disciplineHash(disciplineId: string): string {
  return `#academy/disciplines/${disciplineId}`;
}

export function academySectionHash(
  section: AcademySectionId,
  tab?: AcademyTab
): string {
  return tab ? `#academy/${section}/${tab}` : `#academy/${section}`;
}

/** True for every route that renders inside the academy portal. */
export function networkSectionHash(section: NetworkSectionId, entryId?: string): string {
  return entryId ? `#network/${section}/${entryId}` : `#network/${section}`;
}

export function isNetworkRoute(route: Route): route is NetworkRoute {
  return route.portal === 'network';
}

export function isAcademyRoute(route: Route): route is AcademyRoute {
  return route.portal === 'academy';
}
