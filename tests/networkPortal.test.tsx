/**
 * The fourth portal — the engineering network.
 *
 * The addendum asks for a community that is *obviously* distinct from the
 * brochure, the client portal and the academy, and that never pretends to have
 * members before it has them. These tests pin exactly that:
 *
 *   1. routing — `#network`, its twelve sections and a record inside a section,
 *   2. isolation — the network brings its own header and footer, and none of the
 *      corporate / client / academy navigation,
 *   3. honesty — the prototype banner, the per-card sample badge, and write
 *      actions that are genuinely disabled,
 *   4. layout safety — bounded grids and clipped icons instead of a sheet that
 *      slides off a phone screen.
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

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

const routes = await import('../src/utils/portalRoutes');
const { PORTAL_CHOICE_KEY, readPortalChoice, shouldOfferPortalChooser } = await import(
  '../src/utils/portalChoice'
);
const { NetworkPortal } = await import('../src/components/network/NetworkPortal');
const { PortalSwitchBar } = await import('../src/components/PortalSwitchBar');
const { App } = await import('../src/App');
const { render, cleanup, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

/* ---------------------------------- router --------------------------------- */

test('the network has twelve sections, each with a label and a one-line purpose', () => {
  assert.equal(routes.NETWORK_SECTIONS.length, 12);
  for (const section of routes.NETWORK_SECTIONS) {
    for (const language of ['ar', 'en'] as const) {
      assert.ok(routes.networkSectionLabel(section, language).length > 1, `${section} label (${language})`);
      assert.ok(routes.networkSectionShort(section, language).length > 1, `${section} short (${language})`);
      assert.ok(routes.NETWORK_SECTION_COPY[section][language].length > 20, `${section} copy (${language})`);
    }
  }
});

test('every network address round-trips, and nothing else claims the namespace', () => {
  const cases = [
    '#network',
    '#network/feed',
    '#network/profile',
    '#network/groups',
    '#network/people',
    '#network/jobs',
    '#network/articles',
    '#network/events',
    '#network/companies',
    '#network/messages',
    '#network/notifications',
    '#network/search',
    '#network/verify',
    '#network/profile/ahmed-ndt2',
    '#network/jobs/job-rt-2',
  ];

  for (const hash of cases) {
    const route = routes.parseRoute(hash);
    assert.equal(route.portal, 'network', `${hash} must open the network`);
    assert.equal(routes.routeToHash(route), hash, `${hash} must round-trip`);
    assert.equal(routes.isNetworkRoute(route), true);
  }

  const home = routes.parseRoute('#network');
  assert.equal(home.page, 'home');

  const job = routes.parseRoute('#network/jobs/job-rt-2');
  assert.equal(job.page, 'section');
  assert.equal((job as { section: string }).section, 'jobs');
  assert.equal((job as { entryId?: string }).entryId, 'job-rt-2');
});

test('an unknown network section lands on the network home, not on the company site', () => {
  const route = routes.parseRoute('#network/does-not-exist');
  assert.equal(route.portal, 'network');
  assert.equal(route.page, 'home');
});

test('the network never steals an academy tab', () => {
  for (const tab of ['feed', 'profile', 'jobs', 'search', 'verify']) {
    const bare = routes.parseRoute(`#${tab}`);
    assert.notEqual(bare.portal, 'network', `#${tab} must stay an academy link`);
  }
});

test('the chooser stays shut on a network deep link, and remembers the choice', () => {
  assert.equal(
    shouldOfferPortalChooser({
      choice: null,
      hasAcademyHash: false,
      hasNetworkHash: true,
      view: 'network',
    }),
    false
  );
  localStorage.setItem(PORTAL_CHOICE_KEY, 'network');
  assert.equal(readPortalChoice(), 'network');
});

/* -------------------------------- isolation -------------------------------- */

test('the network renders its own header and links back to the other two portals', () => {
  const { container, getByTestId } = render(
    <NetworkPortal
      language="ar"
      section="feed"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );

  assert.ok(getByTestId('network-header'), 'the network header must exist');
  assert.ok(container.querySelector('[data-portal="network"]'));
  assert.equal(container.querySelector('[data-portal="company"]'), null);
  assert.equal(container.querySelector('[data-portal="academy"]'), null);

  const text = container.textContent ?? '';
  assert.ok(text.includes('الأكاديمية'), 'a door back to the academy');
  assert.ok(text.includes('بوابة الشركة'), 'a door back to the company profile');

  // Corporate commerce and academy coursework never appear inside the network.
  for (const forbidden of ['طلب عرض سعر', 'ملف تأهيل المورد', 'معامل المحاكاة', 'مسارات التعلم']) {
    assert.ok(!text.includes(forbidden), `"${forbidden}" must not appear in the network`);
  }
});

test('every one of the twelve sections renders without throwing', () => {
  for (const section of routes.NETWORK_SECTIONS) {
    const { container, unmount } = render(
      <NetworkPortal
        language="ar"
        section={section}
        onOpenSection={() => {}}
        onOpenCompany={() => {}}
        onOpenAcademy={() => {}}
      />
    );
    assert.ok(
      container.querySelector(`[data-testid="network-section-${section}"]`),
      `section ${section} must render its own body`
    );
    assert.ok(container.querySelector('[data-testid="network-prototype-banner"]'));
    unmount();
  }
});

test('the four doors are present in the switch bar, with the network marked as current', () => {
  const { container, getAllByRole } = render(
    <PortalSwitchBar language="ar" portal="network" onSwitchPortal={() => {}} />
  );

  const buttons = getAllByRole('button').map(button => button.textContent ?? '');
  for (const door of ['الشركة', 'العملاء', 'الأكاديمية', 'الشبكة']) {
    assert.ok(buttons.some(text => text.includes(door)), `missing the ${door} door`);
  }
  const current = container.querySelector('[aria-current="page"]');
  assert.ok(current && (current.textContent ?? '').includes('الشبكة'));
});

/* --------------------------------- honesty --------------------------------- */

test('the banner tells the truth about what is live and what is still a prototype', () => {
  const { container, getAllByTestId } = render(
    <NetworkPortal
      language="ar"
      section="jobs"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );

  const banner = getAllByTestId('network-prototype-banner')[0];
  const bannerText = banner.textContent ?? '';
  // What is live now: the account, the professional card, the directory.
  assert.ok(bannerText.includes('ملفك المهني'));
  assert.ok(bannerText.includes('دليل الأعضاء'));
  // What is still a prototype: posts, jobs, messages, verification.
  assert.ok(bannerText.includes('تصوراً تصميمياً'));
  assert.ok(bannerText.includes('معطّل'));

  assert.ok(container.querySelector('[data-prototype="true"]'));
  const badges = getAllByTestId('network-sample-badge');
  assert.ok(badges.length >= 3, 'a job page must badge each template, not the page once');
});

test('write actions are genuinely disabled, not merely styled to look disabled', () => {
  for (const section of ['feed', 'jobs', 'groups', 'messages', 'verify'] as const) {
    const { getAllByTestId, unmount } = render(
      <NetworkPortal
        language="ar"
        section={section}
        onOpenSection={() => {}}
        onOpenCompany={() => {}}
        onOpenAcademy={() => {}}
      />
    );
    const actions = getAllByTestId('network-write-disabled');
    assert.ok(actions.length > 0, `${section} must show at least one write action`);
    for (const action of actions) {
      assert.equal((action as HTMLButtonElement).disabled, true, `${section} left a live write button`);
      assert.equal(action.getAttribute('aria-disabled'), 'true');
    }
    unmount();
  }
});

test('the composer and the message box cannot be typed into', () => {
  const feed = render(
    <NetworkPortal
      language="ar"
      section="feed"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  const composer = feed.getByTestId('network-composer-disabled') as HTMLTextAreaElement;
  assert.equal(composer.disabled, true);
  feed.unmount();

  const messages = render(
    <NetworkPortal
      language="ar"
      section="messages"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  const boxes = messages.container.querySelectorAll('input');
  assert.ok(boxes.length > 0);
  boxes.forEach(box => assert.equal((box as HTMLInputElement).disabled, true));
});

test('the profile never invents a card, and verification keeps the two tracks apart', () => {
  const profile = render(
    <NetworkPortal
      language="ar"
      section="profile"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  // With no account service in this render the card cannot be created — and the
  // page says so instead of showing a plausible-looking empty profile.
  const profileText = profile.container.textContent ?? '';
  assert.ok(profileText.includes('لن نعرض لك ملفاً وهمياً'));
  assert.ok(!profileText.includes('شهادة مُتحقَّقة'), 'no certificate may be pre-verified');
  profile.unmount();

  const verify = render(
    <NetworkPortal
      language="ar"
      section="verify"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  const verifyText = verify.container.textContent ?? '';
  assert.ok(verifyText.includes('التحقق من الهوية'));
  assert.ok(verifyText.includes('التحقق من المؤهل'));
  assert.ok(verifyText.includes('لا تُمنح أي شارة تلقائياً'));
  verify.unmount();
});

/* ----------------------------- layout safety ------------------------------- */

test('the network navigation is a bounded grid, and icons never get squashed', () => {
  const { container } = render(
    <NetworkPortal
      language="ar"
      section="feed"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );

  const nav = container.querySelector('[data-testid="network-header"] nav');
  assert.ok(nav);
  const navClass = nav!.className;
  assert.ok(navClass.includes('grid'), 'the navigation is a grid, not a flex strip');
  assert.ok(navClass.includes('grid-cols-4'), 'four columns on the narrowest screen');
  assert.ok(!navClass.includes('overflow-x'), 'the navigation must not scroll sideways');

  // Every icon inside the network shell is explicitly protected from shrinking.
  const svgs = container.querySelectorAll('svg');
  assert.ok(svgs.length > 0);
  svgs.forEach(svg => {
    assert.ok(svg.getAttribute('class')?.includes('shrink-0'), 'icons need shrink-0');
  });
});

test('network source files avoid the two patterns that broke the mobile rebuilds', () => {
  const dir = join(process.cwd(), 'src', 'components', 'network');
  const files = readdirSync(dir).filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));
  assert.ok(files.length >= 4);

  for (const file of files) {
    const source = readFileSync(join(dir, file), 'utf8');
    assert.ok(!source.includes('whitespace-nowrap'), `${file} must let long Arabic labels wrap`);
    assert.ok(!source.includes('overflow-x-auto'), `${file} must not introduce a sideways scroller`);
  }
});

/* ------------------------------ the real router ---------------------------- */

test('a #network deep link opens the network portal instead of the company home', async () => {
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#network/jobs');
  const { container } = render(<App />);

  await waitFor(
    () => {
      assert.ok(
        container.querySelector('[data-portal="network"]'),
        'the network portal must mount for #network/jobs'
      );
    },
    { timeout: 8000 }
  );

  await waitFor(() => {
    const jobs = container.querySelector('[data-testid="network-section-jobs"]');
    assert.ok(jobs, 'the jobs section, not the feed, must render');
  });

  assert.equal(container.querySelector('[data-portal="company"]'), null);
  assert.ok(document.title.includes('الشبكة الهندسية'));
  // A shared deep link opens the portal without silently rewriting the visitor's
  // saved preference — that only happens when they choose a door themselves.
  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), null);
});
