/**
 * UX restructure — P1/P2/P3 acceptance.
 *
 * These tests pin the promises made in `documentation/ux/UX_BLUEPRINT_AR.md`:
 * the two-door chooser appears once and never covers a deep link, the corporate
 * page answers the buyer's questions in order, the interactive labs have their
 * own page, and the mobile menu replaces the 14-chip strip.
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/-Project-/',
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
const { CompanyPortal } = await import('../src/components/company/CompanyPortal');
const { INSCO_COMPANY_DATA } = await import('../src/data/inscoCompanyData');
const { PORTAL_CHOICE_KEY } = await import('../src/utils/portalChoice');
const serviceFamiliesModule = await import('../src/utils/serviceFamilies');
const { render, fireEvent, cleanup, within, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  dom.window.history.replaceState(null, '', '/-Project-/');
});

afterEach(() => cleanup());

/* ------------------------------ chooser rules ----------------------------- */

test('a first visit opens the company page without covering it with a dialog', () => {
  const ui = render(<App />);
  assert.equal(ui.queryByRole('dialog'), null);
  assert.ok(ui.getByRole('button', { name: 'دليل البوابات' }));
  assert.equal(dom.window.location.hash, '');
});

test('choosing the corporate door is remembered and closes the dialog', () => {
  const ui = render(<App />);
  fireEvent.click(ui.getByRole('button', { name: 'دليل البوابات' }));
  const dialog = ui.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /دخول بوابة الشركة/ }));

  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), 'company');
  assert.equal(ui.queryByRole('dialog'), null);
});

test('choosing the academy door is remembered and opens the academy', () => {
  const ui = render(<App />);
  fireEvent.click(ui.getByRole('button', { name: 'دليل البوابات' }));
  const dialog = ui.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /دخول الأكاديمية/ }));

  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), 'academy');
  assert.match(ui.container.textContent || '', /أكاديمية إنسكو الهندسية للفحص غير الإتلافي/);
});

test('a remembered visitor is not asked again', () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'company');
  const ui = render(<App />);
  assert.equal(ui.queryByRole('dialog'), null);
});

/* ------------------------------ corporate order --------------------------- */

test('the interactive landing preserves the buyer story without mounting detail tools', () => {
  const ui = render(<CompanyPortal language="ar" onNavigateToAcademy={() => {}} />);
  const sections = [...ui.container.querySelectorAll('section[aria-labelledby]')];
  assert.deepEqual(sections.map(section => section.getAttribute('aria-labelledby')), [
    'corporate-hero-title', 'corporate-overview-title', 'corporate-services-title', 'corporate-equipment-title',
    'corporate-projects-title', 'corporate-academy-title', 'corporate-contact-title',
  ]);
  for (const moved of ['hologram-lab', 'pwht-simulator', 'radiography-viewer', 'ultrasonic-lab', 'fleet-inspector',
    'rfq', 'cost-estimator', 'inspector-qr-access', 'field-attendance-timeline']) {
    assert.equal(ui.container.querySelector(`#${moved}`), null, `${moved} belongs on its own page`);
  }
  assert.equal(ui.queryByTestId('company-hero-banner'), null);
});

test('without WebGL the homepage banner keeps the corporate actions and the full-width still', () => {
  const ui = render(<App />);
  const section = ui.getByTestId('corporate-landing-hero');
  const hero = within(section);
  const chrome = document.getElementById('site-chrome')!;
  assert.ok(document.getElementById('insco-main')?.contains(section));
  assert.equal(chrome.contains(section), false);
  assert.equal(chrome.hasAttribute('data-masthead-in-view'), false);
  assert.ok(hero.getByRole('heading', { level: 1, name: INSCO_COMPANY_DATA.name.ar }));
  assert.equal(hero.getByRole('link', { name: 'استكشف خدماتنا' }).getAttribute('href'), '#services');
  assert.ok(hero.getByRole('button', { name: 'أكاديمية إنسكو' }));
  assert.ok(hero.getByRole('button', { name: 'اطلب عرض سعر' }));
  assert.ok(hero.getByRole('button', { name: 'بوابة العملاء والملفات' }));
  assert.ok(hero.getByRole('button', { name: 'شاهد العرض الفني' }));
  assert.equal(hero.getByRole('link', { name: 'ملف الشركة (PDF)' }).getAttribute('href'), INSCO_COMPANY_DATA.pdfBrochureUrl);
  assert.deepEqual([...hero.getByTestId('corporate-hero-metrics').querySelectorAll('bdi')].map(el => el.textContent),
    INSCO_COMPANY_DATA.metrics.map(metric => metric.value));
  const backdrop = hero.getByTestId('corporate-hero-backdrop');
  const poster = hero.getByTestId('corporate-hero-poster');
  assert.equal(poster.getAttribute('aria-hidden'), 'true');
  assert.equal(poster.querySelector('img')?.getAttribute('alt'), '');
  assert.equal(backdrop.querySelector('canvas'), null);
  assert.equal(hero.queryByRole('figure'), null, 'the photograph is a background, not a separate frame');
  assert.ok(hero.getByRole<HTMLButtonElement>('button', { name: 'موجات PAUT' }).disabled);

  const field = hero.getByRole('button', { name: 'المشهد الميداني' });
  fireEvent.click(field);
  assert.equal(field.getAttribute('aria-pressed'), 'true');
  assert.equal(hero.queryByTestId('hero-3d-control-dock'), null);
  assert.ok(hero.getByTestId('corporate-hero-poster'));
});

/* --------------------------------- demo page ------------------------------ */

test('#demo renders anchors but does not mount demonstration tools without opt-in', async () => {
  dom.window.history.replaceState(null, '', '/-Project-/#demo');
  const ui = render(<App />);

  assert.equal(ui.queryByRole('dialog'), null, 'a deep link must not be covered by the chooser');
  // The demonstrations page is code-split: wait for its own heading (the footer
  // also mentions the phrase, so wait for the lab itself instead).
  await waitFor(() => {
    assert.ok(ui.container.querySelector('#hologram-lab'), 'the 3D scene must be on the demo page');
  });
  assert.ok(ui.container.querySelector('#ultrasonic-lab'), 'the UT/PAUT lab must be on the demo page');
  assert.equal(ui.container.querySelector('#services'), null, 'the commercial page must not render');
  assert.equal(ui.container.querySelector('details[open]'), null);
  assert.equal(ui.container.querySelector('[data-demonstration]'), null);
  assert.equal(ui.queryByTestId('company-hero-banner'), null);
});

/* ------------------------------- mobile menu ------------------------------ */

test('one menu replaces the chip strip and closes with Escape', () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'company');
  const ui = render(<App />);

  fireEvent.click(ui.getByRole('button', { name: 'فتح قائمة التنقل' }));
  const drawer = ui.getByRole('dialog', { name: 'قائمة التنقل' });

  // Both audiences are present, each in its own group.
  assert.ok(within(drawer).getByText('الشركة'));
  assert.ok(within(drawer).getByText('أكاديمية إنسكو'));
  assert.ok(within(drawer).getByRole('button', { name: 'ملف تأهيل المورد' }));
  assert.ok(within(drawer).getByRole('button', { name: 'معامل المحاكاة' }));

  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(ui.queryByRole('dialog'), null, 'Escape must close the drawer');
});

/* ------------------------------ service pages ----------------------------- */

test('every service family is a shareable page, and none of them shows the chooser', () => {
  const { SERVICE_FAMILIES, readServiceFamilyHash, serviceFamilyHash } = serviceFamiliesModule;

  for (const family of SERVICE_FAMILIES) {
    const hash = serviceFamilyHash(family.id);
    assert.equal(readServiceFamilyHash(hash), family.id);
  }
  assert.equal(readServiceFamilyHash('#services/unknown'), undefined);
  assert.equal(readServiceFamilyHash('#services'), undefined);
});

test('#services/pwht renders the PWHT page directly and switches family in place', () => {
  dom.window.history.replaceState(null, '', '/-Project-/#services/pwht');
  const ui = render(<App />);

  assert.equal(ui.queryByRole('dialog'), null, 'a service link must open directly');
  assert.match(ui.container.textContent || '', /المعالجة الحرارية بعد اللحام/);
  assert.equal(ui.container.querySelector('#services'), null, 'the landing page must not render');

  fireEvent.click(ui.getByRole('button', { name: /تحليل المواد والصلادة/ }));
  assert.equal(dom.window.location.hash, '#services/materials');
});

test('requesting a quote from a service page pre-selects that service in the RFQ form', async () => {
  dom.window.history.replaceState(null, '', '/-Project-/#services/materials');
  const ui = render(<App />);

  fireEvent.click(ui.getByRole('button', { name: /اطلب عرض سعر لهذه الخدمة/ }));

  await waitFor(() => {
    const select = ui.container.querySelector('#rfq select') as HTMLSelectElement | null;
    assert.ok(select, 'the RFQ form must be on screen after the request');
    assert.equal(select!.value, 'pmi_hardness');
  });
  assert.equal(dom.window.location.hash, '#rfq', 'the quote has its own shareable address');
});

test('the core service cards are shareable method links; the full catalogue retains the other families', async () => {
  const ui = render(<CompanyPortal language="ar" onNavigateToAcademy={() => {}} />);
  assert.deepEqual([...ui.container.querySelectorAll('.corporate-service-card')].map(link => link.getAttribute('href')), [
    '#services/ndt/ut', '#services/ndt/rt', '#services/ndt/mt', '#services/ndt/pt', '#services/ndt/vt', '#services/pwht',
  ]);
  cleanup();
  dom.window.history.replaceState(null, '', '/-Project-/#services');
  const catalogue = render(<App />);
  fireEvent.click(await catalogue.findByRole('button', { name: /تحليل المواد والصلادة/ }, { timeout: 6000 }));
  assert.equal(dom.window.location.hash, '#services/materials');
});

test('each route sets its own document title', () => {
  dom.window.history.replaceState(null, '', '/-Project-/#services/pwht');
  const ui = render(<App />);
  assert.match(document.title, /المعالجة الحرارية بعد اللحام/);

  fireEvent.click(ui.getByRole('button', { name: /تحليل المواد والصلادة/ }));
  assert.match(document.title, /تحليل المواد والصلادة/);

  fireEvent.click(ui.getAllByRole('button', { name: /أكاديمية إنسكو/ })[0]);
  assert.match(document.title, /أكاديمية/);
});


test('a corporate detail bookmark opens its own page and leaves the landing page unmounted', async () => {
  dom.window.history.replaceState(null, '', '/-Project-/#standards-matrix');
  const ui = render(<App />);
  const standards = await waitFor(() => {
    const section = ui.container.querySelector('#standards-matrix');
    assert.ok(section);
    return section;
  }, { timeout: 6000 });
  assert.equal(standards.closest('[data-company-detail]')?.getAttribute('data-company-detail'), 'quality');
  assert.equal(ui.queryByTestId('company-hero-banner'), null);
  assert.equal(dom.window.location.hash, '#standards-matrix');
  assert.match(document.title, /الجودة والشهادات/);
});


test('a method bookmark stays shareable and preselects the correct quote scope', async () => {
  dom.window.history.replaceState(null, '', '/-Project-/#services/ndt/rt');
  const ui = render(<App />);
  assert.ok(ui.container.querySelector('#service-method-rt'));
  fireEvent.click(ui.getByRole('button', { name: /اطلب عرض سعر لهذه الخدمة/ }));
  await waitFor(() => {
    const select = ui.container.querySelector<HTMLSelectElement>('#rfq select');
    assert.equal(select?.value, 'rt_gamma');
  }, { timeout: 6000 });
});
