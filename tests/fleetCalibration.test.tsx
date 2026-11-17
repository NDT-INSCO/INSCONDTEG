/**
 * Calibration register: the badge must follow the date, never a hard-coded
 * "verified" string. A unit that expired in October 2026 was shown as green in
 * November 2026 — that is what these tests exist to prevent.
 */
import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  calibrationLabel,
  calibrationState,
  formatValidity,
  validityEnd,
} from '../src/utils/calibration';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://ndt-insco.github.io/INSCONDTEG/' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
});
const { render, fireEvent, cleanup, within } = await import('@testing-library/react');
const { CompanyFleetInspector } = await import('../src/components/company/CompanyFleetInspector');
afterEach(() => cleanup());

const TODAY = new Date('2026-11-17T09:00:00.000Z');

test('month precision means "valid through the last day of that month"', () => {
  const end = validityEnd('2026-10');
  assert.ok(end);
  assert.equal(end!.toISOString(), '2026-10-31T23:59:59.000Z');
  const exact = validityEnd('2026-10-31');
  assert.equal(exact!.toISOString(), '2026-10-31T23:59:59.000Z');
  assert.equal(validityEnd(null), null);
  assert.equal(validityEnd('nonsense'), null);
});

test('state is derived from the date: expired / expiring / valid / unknown', () => {
  assert.equal(calibrationState('2026-10', TODAY), 'expired');
  assert.equal(calibrationState('2026-11', TODAY), 'expiring'); // ends 30 Nov, 13 days away
  assert.equal(calibrationState('2026-12', TODAY), 'expiring'); // ends 31 Dec, 44 days away
  assert.equal(calibrationState('2027-06', TODAY), 'valid');
  assert.equal(calibrationState(null, TODAY), 'unknown');
});

test('labels and dates read naturally in both languages', () => {
  assert.equal(calibrationState('2026-10', TODAY), 'expired');
  assert.equal(calibrationLabel('expired', 'ar'), 'المعايرة منتهية');
  assert.equal(calibrationLabel('valid', 'en'), 'Calibration valid');
  assert.equal(formatValidity('2026-10', 'ar'), 'أكتوبر 2026');
  assert.equal(formatValidity('2026-10', 'en'), 'October 2026');
  assert.equal(formatValidity('2026-10-31', 'en'), '31 October 2026');
  assert.equal(formatValidity(null, 'ar'), 'غير محددة');
});

test('the fleet card for the expired Krautkramer unit is red, not green', () => {
  const ui = render(<CompanyFleetInspector language="ar" now={TODAY} />);

  // The register still lists the unit…
  assert.ok(ui.getAllByText(/Krautkramer USM 35X/i).length > 0);
  // …says it is expired, with the date it expired…
  assert.ok(ui.getAllByText(/المعايرة منتهية/i).length > 0);
  assert.ok(ui.getAllByText(/حتى أكتوبر 2026/i).length > 0);
  // …and its own card never claims validity (other, in-date units still may).
  const card = ui.getByRole('button', { name: /Krautkramer USM 35X/i });
  assert.equal(within(card).queryByText(/^معايرة سارية$/), null);
  assert.ok(within(card).getByText(/^المعايرة منتهية$/));
});

test('selecting a unit works from the keyboard because cards are buttons', () => {
  const ui = render(<CompanyFleetInspector language="ar" now={TODAY} />);
  const card = ui.getByRole('button', { name: /Krautkramer USM 35X/i });
  assert.equal(card.tagName, 'BUTTON');
  card.focus();
  assert.equal(document.activeElement, card);
  fireEvent.click(card);
  assert.equal(card.getAttribute('aria-pressed'), 'true');
});

test('the expired record is surfaced in the section summary', () => {
  const ui = render(<CompanyFleetInspector language="ar" now={TODAY} />);
  assert.ok(ui.getByText(/سجل معايرة منتهٍ/i));
});
