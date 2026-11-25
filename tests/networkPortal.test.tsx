/**
 * The fourth portal — the INSCO Engineering Professional Network.
 *
 * Verifies:
 *   1. routing — `#network`, its twelve live sections and nested entry IDs,
 *   2. isolation — the network brings its own header and footer, and none of the
 *      corporate / client / academy navigation or forbidden commercial terms,
 *   3. honesty & full-stack live migration — zero prototype banners, sample badges,
 *      or disabled placeholder actions; unavailable states never invent data;
 *      verification tracks stay strictly separated and never auto-awarded,
 *   4. layout safety & theme support — bounded grids, clipped icons (shrink-0),
 *      zero horizontal overflow utilities, and Light/Dark theme toggling.
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
const { PORTAL_CHOICE_KEY, readPortalChoice } = await import('../src/utils/portalChoice');
const { NetworkPortal } = await import('../src/components/network/NetworkPortal');
const { PortalSwitchBar } = await import('../src/components/PortalSwitchBar');
const { App } = await import('../src/App');
const { render, cleanup, fireEvent, waitFor } = await import('@testing-library/react');

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

test('the visitor can remember the network as their preferred portal', () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'network');
  assert.equal(readPortalChoice(), 'network');
});

test('the network renders its own header and links back to the other portals', () => {
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

  for (const forbidden of ['طلب عرض سعر', 'ملف تأهيل المورد', 'معامل المحاكاة', 'مسارات التعلم']) {
    assert.ok(!text.includes(forbidden), `"${forbidden}" must not appear in the network`);
  }
});

test('every one of the twelve sections renders live without prototype banners or fake disabled actions', async () => {
  for (const section of routes.NETWORK_SECTIONS) {
    const { container, queryAllByTestId, unmount } = render(
      <NetworkPortal
        language="ar"
        section={section}
        onOpenSection={() => {}}
        onOpenCompany={() => {}}
        onOpenAcademy={() => {}}
      />
    );
    await waitFor(
      () => {
        assert.ok(
          container.querySelector(`[data-testid="network-section-${section}"]`),
          `section ${section} must render its own live body`
        );
      },
      { timeout: 5000 }
    );
    assert.equal(container.querySelector('[data-testid="network-prototype-banner"]'), null);
    assert.equal(container.querySelector('[data-prototype="true"]'), null);
    assert.equal(queryAllByTestId('network-sample-badge').length, 0);
    assert.equal(queryAllByTestId('network-write-disabled').length, 0);
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

test('groups renders its real state without fake disabled buttons', async () => {
  const { queryAllByTestId, container } = render(
    <NetworkPortal
      language="ar"
      section="groups"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  await waitFor(() => {
    const states = ['network-groups-live', 'network-groups-gate', 'network-groups-unavailable', 'network-groups-loading'];
    assert.ok(
      states.some(id => container.querySelector(`[data-testid="${id}"]`)),
      'groups renders its real state'
    );
  });
  assert.equal(queryAllByTestId('network-write-disabled').length, 0);
});

test('without Firestore configured, feed and messages cleanly show unavailable state instead of fake forms', async () => {
  const feed = render(
    <NetworkPortal
      language="ar"
      section="feed"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  await waitFor(() => assert.ok(feed.getByTestId('network-feed-unavailable')));
  assert.equal(feed.container.querySelector('textarea'), null);
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
  await waitFor(() => assert.ok(messages.getByTestId('network-messages-unavailable')));
  messages.unmount();
});

test('the profile never invents a card, and verification keeps the three tracks separate', async () => {
  const profile = render(
    <NetworkPortal
      language="ar"
      section="profile"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  await waitFor(() => assert.ok(profile.container.querySelector('[data-testid="network-section-profile"]')));
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
  await waitFor(() => assert.ok(verify.container.querySelector('[data-testid="network-section-verify"]')));
  const verifyText = verify.container.textContent ?? '';
  assert.ok(verifyText.includes('التحقق من الهوية'));
  assert.ok(verifyText.includes('التحقق من المؤسسة'));
  assert.ok(verifyText.includes('التحقق من المؤهل'));
  assert.ok(verifyText.includes('لا تُمنح أي شارة تلقائياً'));
  verify.unmount();
});

/* ------------------------------ theme support ------------------------------ */

test('the network header includes a working Light/Dark theme toggle that updates surfaces', () => {
  const { container, getByTestId } = render(
    <NetworkPortal
      language="ar"
      section="feed"
      onOpenSection={() => {}}
      onOpenCompany={() => {}}
      onOpenAcademy={() => {}}
    />
  );
  const root = container.querySelector('[data-portal="network"]')!;
  const initialClass = root.className;
  const toggle = getByTestId('network-theme-toggle');
  fireEvent.click(toggle);
  assert.notEqual(root.className, initialClass, 'toggling theme must switch network surface classes');
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

  const svgs = container.querySelectorAll('svg');
  assert.ok(svgs.length > 0);
  svgs.forEach(svg => {
    assert.ok(svg.getAttribute('class')?.includes('shrink-0'), 'icons need shrink-0');
  });
});

test('network source files avoid whitespace-nowrap and overflow-x-auto', () => {
  const dir = join(process.cwd(), 'src', 'components', 'network');
  const files = readdirSync(dir).filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));
  assert.ok(files.length >= 10);

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
  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), null);
});
