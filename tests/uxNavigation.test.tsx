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
const { shouldOfferPortalChooser, PORTAL_CHOICE_KEY } = await import('../src/utils/portalChoice');
const { render, fireEvent, cleanup, within, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  dom.window.history.replaceState(null, '', '/-Project-/');
});

afterEach(() => cleanup());

/* ------------------------------ chooser rules ----------------------------- */

test('the chooser is offered once, and never on top of a deep link', () => {
  assert.equal(
    shouldOfferPortalChooser({ choice: null, hasAcademyHash: false, view: 'company' }),
    true,
    'a first-time visitor on the profile should be asked'
  );
  assert.equal(
    shouldOfferPortalChooser({ choice: 'company', hasAcademyHash: false, view: 'company' }),
    false,
    'a remembered choice must not be asked again'
  );
  assert.equal(
    shouldOfferPortalChooser({ choice: null, hasAcademyHash: true, view: 'academy' }),
    false,
    'a shared #quiz link must open directly'
  );
  assert.equal(
    shouldOfferPortalChooser({ choice: null, hasDemoHash: true, view: 'demo' }),
    false,
    'a #demo link must open directly'
  );
});

test('choosing the corporate door is remembered and closes the dialog', () => {
  const ui = render(<App />);
  const dialog = ui.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /دخول بوابة الشركة/ }));

  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), 'company');
  assert.equal(ui.queryByRole('dialog'), null);
});

test('choosing the academy door is remembered and opens the academy', () => {
  const ui = render(<App />);
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

test('the corporate page answers the buyer in order and keeps the labs off it', () => {
  const ui = render(<CompanyPortal language="ar" onNavigateToAcademy={() => {}} />);
  const ids = [...ui.container.querySelectorAll('section[id]')].map(section => section.id);

  const order = ['services', 'certifications', 'fleet-inspector', 'projects', 'vault', 'contact'];
  const positions = order.map(id => ids.indexOf(id));
  assert.ok(positions.every(index => index >= 0), `missing section(s): ${JSON.stringify({ ids, positions })}`);
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(
      positions[i - 1] < positions[i],
      `wrong order around ${order[i - 1]} → ${order[i]}: ${ids.join(', ')}`
    );
  }

  // The demonstrations moved to their own page; they must not sit before the
  // accreditations any more.
  for (const lab of ['hologram-lab', 'pwht-simulator', 'radiography-viewer', 'ultrasonic-lab']) {
    assert.equal(ids.includes(lab), false, `${lab} still competes with the commercial content`);
  }

  // …and the estimator became a step inside the RFQ section.
  const contact = ui.container.querySelector('section#contact')!;
  assert.ok(contact.querySelector('#cost-estimator'), 'estimator must live inside the RFQ section');
});

test('the hero leads with the quote action, not the brochure', () => {
  const ui = render(<CompanyPortal language="ar" onNavigateToAcademy={() => {}} />);
  const hero = ui.container.querySelector('section')!;
  const buttons = [...hero.querySelectorAll('button, a')].map(el => (el.textContent || '').trim());
  const quoteIndex = buttons.findIndex(label => /اطلب عرض سعر/.test(label));
  const brochureIndex = buttons.findIndex(label => /ملف الشركة/.test(label));

  assert.ok(quoteIndex >= 0, `hero has no quote action: ${buttons.join(' | ')}`);
  assert.ok(brochureIndex > quoteIndex, 'the brochure must come after the primary quote action');
});

/* --------------------------------- demo page ------------------------------ */

test('#demo renders the demonstrations and skips the chooser', async () => {
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
