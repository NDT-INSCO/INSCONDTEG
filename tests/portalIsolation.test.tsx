/**
 * Portal isolation — the two paths must not blend.
 *
 * The site serves two audiences. After this change every screen belongs to
 * exactly one portal: the corporate profile keeps its five destinations and the
 * RFQ action, the academy keeps its own identity, its own bar and its own
 * footer, and a permanent bar at the top says where you are and how to switch.
 *
 * These tests pin the four promises:
 *   1. the router understands both portals and every legacy `#tab` link,
 *   2. the two navigations never appear on the same screen,
 *   3. each discipline has its own page under the discipline index,
 *   4. each academy section has its own page with only its own tabs.
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  history: dom.window.history,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const { App } = await import('../src/App');
const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { AcademyDisciplineIndex } = await import('../src/components/academy/AcademyDisciplineIndex');
const { AcademyDisciplinePage } = await import('../src/components/academy/AcademyDisciplinePage');
const { buildAcademyStations } = await import('../src/components/academy/AcademyStationNav');
const { ACADEMY_TABS } = await import('../src/academyTabs');
const { ENGINEERING_DISCIPLINES } = await import('../src/data/academyCurriculum');
const routes = await import('../src/utils/portalRoutes');
const { PORTAL_CHOICE_KEY } = await import('../src/utils/portalChoice');
const { render, fireEvent, cleanup, waitFor, within } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

/* --------------------------------- router -------------------------------- */

test('every address resolves to one portal and comes back unchanged', () => {
  const cases: { hash: string; check: (route: routes.Route) => void }[] = [
    {
      hash: '',
      check: route => {
        assert.equal(route.portal, 'company');
        assert.equal(route.page, 'home');
      },
    },
    {
      hash: '#services/pwht',
      check: route => {
        assert.equal(route.portal, 'company');
        assert.equal(route.page, 'service');
        assert.equal((route as routes.CompanyRoute & { family: string }).family, 'pwht');
      },
    },
    { hash: '#demo', check: route => assert.equal(route.page, 'demo') },
    { hash: '#academy', check: route => assert.equal(route.page, 'hub') },
    { hash: '#academy/disciplines', check: route => assert.equal(route.page, 'disciplines') },
    {
      hash: '#academy/disciplines/ndt_advanced',
      check: route => {
        assert.equal(route.page, 'discipline');
        assert.equal((route as { disciplineId: string }).disciplineId, 'ndt_advanced');
      },
    },
    {
      hash: '#academy/practice',
      check: route => {
        assert.equal(route.page, 'section');
        assert.equal((route as { section: string }).section, 'practice');
      },
    },
    {
      hash: '#academy/learn/edb',
      check: route => {
        assert.equal(route.page, 'section');
        assert.equal((route as { section: string }).section, 'learn');
        assert.equal((route as { tab?: string }).tab, 'edb');
      },
    },
  ];

  for (const { hash, check } of cases) {
    const route = routes.parseRoute(hash);
    check(route);
    assert.equal(routes.routeToHash(route), hash, `${hash} must round-trip`);
  }
});

test('the corporate home stays hash-free, and an unknown hash is just an anchor', () => {
  assert.equal(routes.routeToHash({ portal: 'company', page: 'home' }), '');
  const unknown = routes.parseRoute('#not-a-page');
  assert.equal(unknown.portal, 'company');
  assert.equal(unknown.page, 'home');
  assert.equal(routes.routeToHash(unknown), '#not-a-page');
});

test('all 33 legacy tab links still open the academy, in the section that owns them', () => {
  assert.equal(ACADEMY_TABS.length, 33);
  const seen = new Set<string>();

  for (const tab of ACADEMY_TABS) {
    const route = routes.parseRoute(`#${tab}`);
    assert.equal(route.portal, 'academy', `#${tab} must open the academy`);
    assert.equal(route.page, 'section', `#${tab} must land on a section page`);
    const section = (route as { section: string }).section;
    assert.ok(
      routes.ACADEMY_SECTION_TABS[section as routes.AcademySectionId].includes(tab),
      `#${tab} landed in ${section}, which does not list it`
    );
    assert.equal((route as { tab?: string }).tab, tab, `#${tab} must keep the requested tab`);
    seen.add(section);
  }

  assert.deepEqual(
    [...seen].sort(),
    ['choose', 'learn', 'mentor', 'practice', 'progress', 'test'],
    'every section must be reachable through the legacy links'
  );
});

test('the section map and the journey navigation group the tabs identically', () => {
  const stations = buildAcademyStations({ books: 11, documents: 18, courses: 7, paths: 5 });

  for (const station of stations) {
    const section = station.id === 'tutor' ? 'mentor' : station.id;
    const declared = [...routes.ACADEMY_SECTION_TABS[section as routes.AcademySectionId]].sort();
    const rendered = station.children.map(child => child.tab).sort();
    assert.deepEqual(
      rendered,
      declared,
      `${station.id} and ${section} disagree about their tabs`
    );
  }
});

/* ------------------------------ portal chrome ----------------------------- */

test('the corporate portal shows the company bar and none of the academy sections', () => {
  const ui = render(<App />);

  const bar = ui.getByRole('group', { name: /تبديل المسار/ });
  assert.ok(within(bar).getByRole('button', { name: /بوابة الشركة/ }).getAttribute('aria-current'));
  assert.equal(
    within(bar).getByRole('button', { name: /أكاديمية إنسكو/ }).getAttribute('aria-current'),
    null
  );

  for (const label of ['الرئيسية', 'خدماتنا', 'إمكانياتنا', 'مشروعاتنا', 'ملف التأهيل']) {
    assert.ok(ui.getAllByRole('button', { name: label }).length > 0, `${label} must stay`);
  }

  assert.equal(ui.queryByRole('button', { name: 'رئيسية الأكاديمية' }), null);
  assert.equal(ui.queryByRole('button', { name: /اختر مسارك/ }), null);
  assert.ok(ui.container.querySelector('footer')!.textContent!.includes('ملف الاعتماد والتأهيل'));
});

test('the academy portal shows its own bar and footer, and no commercial actions', async () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'academy');
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#academy');
  const ui = render(<App />);

  const bar = ui.getByRole('group', { name: /تبديل المسار/ });
  assert.ok(within(bar).getByRole('button', { name: /أكاديمية إنسكو/ }).getAttribute('aria-current'));

  // Academy identity + its own navigation.
  assert.ok(ui.getAllByText(/أكاديمية إنسكو الهندسية للفحص غير الإتلافي/).length > 0);
  for (const label of [
    'رئيسية الأكاديمية',
    'التخصصات الثمانية',
    'اختر مسارك',
    'تعلّم',
    'تدرّب · معامل المحاكاة',
    'اختبر نفسك',
    'تابع إنجازك',
    'اسأل المدرّس',
  ]) {
    assert.ok(ui.getAllByRole('button', { name: label }).length > 0, `${label} is missing`);
  }

  // None of the company's destinations, and no quote action.
  assert.equal(ui.queryByRole('button', { name: 'خدماتنا' }), null);
  assert.equal(ui.queryByRole('button', { name: 'ملف التأهيل' }), null);
  assert.equal(ui.queryByRole('button', { name: 'اطلب عرض سعر' }), null);

  const footer = ui.container.querySelector('footer')!;
  assert.match(footer.textContent || '', /إفادة تعلّم ذاتي غير معتمدة/);
  assert.doesNotMatch(footer.textContent || '', /ملف الاعتماد والتأهيل/);

  await waitFor(() => {
    assert.ok(ui.container.querySelector('[data-testid="academy-hub"]'), 'the hub must mount');
  });
});

test('the top bar switches portal, remembers the choice, and writes the address', () => {
  const ui = render(<App />);

  const bar = ui.getByRole('group', { name: /تبديل المسار/ });
  fireEvent.click(within(bar).getByRole('button', { name: /أكاديمية إنسكو/ }));

  assert.equal(dom.window.location.hash, '#academy');
  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), 'academy');
  assert.match(document.title, /أكاديمية/);

  // …and back to the corporate profile, with an empty hash again.
  fireEvent.click(ui.getByText(/العودة إلى ملف وخدمات الشركة/));
  assert.equal(dom.window.location.hash, '');
  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), 'company');
});

test('a returning academy visitor lands in the academy, not on the profile', () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'academy');
  const ui = render(<App />);

  assert.equal(dom.window.location.hash, '#academy', 'entry must be isolated to the chosen path');
  assert.ok(ui.getAllByText(/أكاديمية إنسكو الهندسية للفحص غير الإتلافي/).length > 0);
  assert.equal(ui.queryByRole('button', { name: 'خدماتنا' }), null);

  // A company visitor keeps the commercial profile.
  cleanup();
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
  localStorage.setItem(PORTAL_CHOICE_KEY, 'company');
  const corporate = render(<App />);
  assert.equal(dom.window.location.hash, '');
  assert.ok(corporate.getAllByRole('button', { name: 'خدماتنا' }).length > 0);
});

test('a legacy deep link keeps its exact hash and opens the owning section', () => {
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#edb');
  render(<App />);

  assert.equal(dom.window.location.hash, '#edb');
  assert.match(document.title, /تعلّم/);
});

/* ------------------------------ the hierarchy ----------------------------- */

test('the disciplines index lists the eight disciplines as links to their own pages', () => {
  const opened: string[] = [];
  const ui = render(<AcademyDisciplineIndex language="ar" onOpenHash={hash => opened.push(hash)} />);

  for (const discipline of ENGINEERING_DISCIPLINES) {
    assert.ok(
      ui.getByTestId(`discipline-card-${discipline.id}`),
      `${discipline.id} has no card`
    );
  }
  assert.equal(ENGINEERING_DISCIPLINES.length, 8);

  fireEvent.click(within(ui.getByTestId('discipline-card-ndt_advanced')).getByRole('button'));
  assert.deepEqual(opened, ['#academy/disciplines/ndt_advanced']);
});

test('a discipline page is nested under the disciplines page and shows its own modules', () => {
  const opened: string[] = [];
  const ui = render(
    <AcademyDisciplinePage
      language="ar"
      disciplineId="ndt_advanced"
      onOpenHash={hash => opened.push(hash)}
    />
  );

  const page = ui.getByTestId('academy-discipline-page-ndt_advanced');
  assert.match(page.textContent || '', /الفحص المتقدم/);

  // The siblings are the parent level of the hierarchy.
  const siblings = ui.getByRole('navigation', { name: 'التخصصات الشقيقة' });
  assert.ok(within(siblings).getByRole('button', { name: /كل التخصصات/ }));
  assert.equal(
    within(siblings).getByRole('button', { name: /الفحص المتقدم/ }).getAttribute('aria-current'),
    'page'
  );

  // Its own curriculum, and only its own: the first module of the discipline.
  assert.ok(page.querySelector('[data-testid="curriculum-module-mod_adv_ut"]'));
  assert.equal(page.querySelector('[data-testid="curriculum-module-mod_weld_1"]'), null);

  fireEvent.click(within(siblings).getByRole('button', { name: /كل التخصصات/ }));
  assert.deepEqual(opened, ['#academy/disciplines']);
});

test('an unknown discipline link is explained instead of rendering an empty page', () => {
  const ui = render(
    <AcademyDisciplinePage language="ar" disciplineId="not_a_discipline" onOpenHash={() => {}} />
  );
  assert.match(ui.getByTestId('academy-discipline-not-found').textContent || '', /غير موجود/);
});

test('a section page shows only the tabs of that section', () => {
  const ui = render(<EducationalAcademy language="ar" section="practice" />);

  // A practice lab is offered…
  assert.ok(ui.getByRole('button', { name: /معمل التصوير الإشعاعي RT/ }));
  // …and nothing from the other sections is on offer.
  assert.equal(ui.queryByRole('button', { name: 'خريطة الاستكمال' }), null);
  assert.equal(ui.queryByRole('button', { name: /الكتب الدراسية التفاعلية/ }), null);
  assert.equal(ui.queryByRole('button', { name: 'محاكي امتحانات التأهيل (Level 1 & 2)' }), null);
  // The six-station grid belongs to the hub, not to a section page.
  assert.equal(ui.queryByTestId('academy-simulation-labs-hub'), null);
});

test('a discipline address opens the discipline page inside the academy portal', async () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'academy');
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#academy/disciplines/pwht_metallurgy');
  const ui = render(<App />);

  // The academy frame is immediate…
  assert.ok(ui.getAllByText(/أكاديمية إنسكو الهندسية للفحص غير الإتلافي/).length > 0);
  // …and the page itself arrives with the code-split chunk.
  await waitFor(() => {
    assert.ok(
      ui.container.querySelector('[data-testid="academy-discipline-page-pwht_metallurgy"]'),
      'the discipline page must mount'
    );
  });
  assert.match(ui.container.textContent || '', /المعالجة الحرارية/);
  assert.equal(dom.window.location.hash, '#academy/disciplines/pwht_metallurgy');
});

test('a link to another section leaves the section page instead of doing nothing', () => {
  const opened: string[] = [];
  const ui = render(
    <EducationalAcademy language="ar" section="learn" onOpenTab={tab => opened.push(tab)} />
  );

  // The progress tracker on the "learn" page links to the leaderboard, which
  // lives in "track progress". The click must carry the learner there.
  fireEvent.click(ui.getByRole('button', { name: /لوحة المتصدرين/ }));
  assert.deepEqual(opened, ['leaderboard']);
});

test('a tab requested outside the section is clamped instead of blanking the page', () => {
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#quiz');
  const ui = render(<EducationalAcademy language="ar" section="learn" />);

  // `#quiz` belongs to "test yourself"; on the "learn" page the first learn tab
  // wins and the address is corrected instead of showing an empty section.
  assert.equal(ui.queryByTestId('academy-subtab-exam-simulation'), null);
  assert.equal(dom.window.location.hash, '#encyclopedia');
  assert.ok(ui.getByRole('button', { name: /مكتبة الدروس ومسار القراءة التأسيسي/ }));
});
