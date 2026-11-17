import React from 'react';
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { JSDOM } from 'jsdom';
import { geoArea } from 'd3';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://example.org/',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const { render, fireEvent, cleanup, within } = await import('@testing-library/react');
const { CompanyRegionalFleetMap } = await import('../src/components/company/CompanyRegionalFleetMap');
const { CompanyServicesSection } = await import('../src/components/company/CompanyServicesSection');
const {
  GIZA_DEPOT_COORDINATES,
  INSCO_REGIONAL_SITES,
  REGIONAL_LANDMASS_COLLECTION,
  TOTAL_OWNED_PWHT_UNITS,
  calculateMobilizationDistanceKm,
} = await import('../src/data/inscoRegionalMapData');

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
});

test('regional GeoJSON polygons obey d3-geo spherical winding and mobilization distances are accurate', () => {
  for (const feat of REGIONAL_LANDMASS_COLLECTION.features) {
    const area = geoArea(feat);
    assert.ok(
      area > 0 && area < 0.25,
      `Country ${feat.properties.id} must have valid non-inverted spherical area, got ${area}`
    );
  }

  assert.equal(calculateMobilizationDistanceKm(GIZA_DEPOT_COORDINATES), 0);

  const burullus = INSCO_REGIONAL_SITES.find((s) => s.id === 'burullus-ccpp')!;
  const burullusKm = calculateMobilizationDistanceKm(burullus.coordinates);
  assert.ok(burullusKm > 150 && burullusKm < 230, `Expected ~188 km to Burullus, got ${burullusKm}`);

  const bagram = INSCO_REGIONAL_SITES.find((s) => s.id === 'bagram-afghanistan')!;
  const bagramKm = calculateMobilizationDistanceKm(bagram.coordinates);
  assert.ok(bagramKm > 3200 && bagramKm < 4000, `Expected ~3550 km to Bagram, got ${bagramKm}`);

  // Egyptian active + reserve unit allocations account for all 16 company-owned 65 kW PWHT units
  const egyptAllocatedSum = INSCO_REGIONAL_SITES.filter((s) => s.countryCode === 'EG').reduce(
    (sum, s) => sum + s.pwhtUnitsAllocated,
    0
  );
  assert.equal(egyptAllocatedSum, TOTAL_OWNED_PWHT_UNITS);
});

test('CompanyRegionalFleetMap renders all 11 hubs & project sites and updates dossier on pin/directory click', () => {
  const ui = render(<CompanyRegionalFleetMap language="en" />);

  const mapContainer = ui.getByTestId('company-regional-fleet-map');
  assert.ok(mapContainer);

  // All 11 sites should be rendered as interactive pins in Regional Overview
  for (const site of INSCO_REGIONAL_SITES) {
    assert.ok(ui.getByTestId(`map-pin-${site.id}`), `Expected map pin for ${site.id}`);
  }

  // Default selected site is Burullus 4,800 MW CCPP
  const dossier = ui.getByTestId('regional-map-site-dossier');
  assert.match(dossier.textContent || '', /El-Burullus 4,800 MW/i);
  assert.match(dossier.textContent || '', /4 \/ 16 Units/i);
  assert.match(dossier.textContent || '', /INS-PWHT-01 – INS-PWHT-04/);

  // Click Giza 16-Unit Depot pin directly on the SVG map
  fireEvent.click(ui.getByTestId('map-pin-giza-fleet-depot'));
  assert.match(dossier.textContent || '', /Central PWHT Fleet Depot/i);
  assert.match(dossier.textContent || '', /0 km \(Central Base\)/i);
  assert.match(dossier.textContent || '', /16 \/ 16 Units/i);

  // Select Masila Block (Yemen) from directory
  fireEvent.click(ui.getByTestId('directory-site-masila-yemen'));
  assert.match(dossier.textContent || '', /PETROMASILA/i);
  assert.match(dossier.textContent || '', /API 1104/i);
});

test('sector filters, camera presets, zoom controls, and mobilization arc toggle work in Arabic RTL', () => {
  const ui = render(<CompanyRegionalFleetMap language="ar" />);

  // Filter to Power Stations only (5 Egyptian power plants)
  fireEvent.click(ui.getByRole('button', { name: 'محطات الطاقة' }));
  assert.ok(ui.getByText(/دليل المواقع المعروضة \(5\)/));
  assert.equal(ui.queryByTestId('directory-site-masila-yemen'), null);
  assert.ok(ui.getByTestId('directory-site-burullus-ccpp'));

  // Switch camera preset to Egypt National Grid and Greater Cairo Hub
  const egyptPresetBtn = ui.getByRole('button', { name: 'الشبكة القومية (مصر)' });
  fireEvent.click(egyptPresetBtn);
  assert.equal(egyptPresetBtn.getAttribute('aria-pressed'), 'true');

  const cairoPresetBtn = ui.getByRole('button', { name: 'مركز القاهرة والجيزة' });
  fireEvent.click(cairoPresetBtn);
  assert.equal(cairoPresetBtn.getAttribute('aria-pressed'), 'true');

  // Zoom in, zoom out, reset, and toggle mobilization arcs
  fireEvent.click(ui.getByRole('button', { name: 'تكبير الخريطة' }));
  fireEvent.click(ui.getByRole('button', { name: 'تصغير الخريطة' }));
  fireEvent.click(ui.getByRole('button', { name: 'إعادة ضبط عرض الخريطة' }));

  const arcsBtn = ui.getByRole('button', { name: /مسارات الاستنفار من الجيزة/ });
  assert.equal(arcsBtn.getAttribute('aria-pressed'), 'true');
  fireEvent.click(arcsBtn);
  assert.equal(arcsBtn.getAttribute('aria-pressed'), 'false');
});

test('CompanyServicesSection integrates the regional map and links site NDT methods to the method catalog', () => {
  const ui = render(<CompanyServicesSection language="en" />);

  const mapSection = ui.getByTestId('company-regional-fleet-map');
  assert.ok(mapSection);

  // Select Elsewedy Electric on the map
  fireEvent.click(ui.getByTestId('map-pin-elsewedy-cairo'));
  const dossier = ui.getByTestId('regional-map-site-dossier');
  assert.match(dossier.textContent || '', /El Sewedy Electric/i);
  assert.match(dossier.textContent || '', /PO GM102473/i);

  // Click 'HT' (Field Hardness Testing) inside the site dossier -> updates CompanyServicesSection catalog below
  const htBtn = within(dossier).getByRole('button', { name: 'HT' });
  fireEvent.click(htBtn);

  assert.ok(ui.getAllByText(/Field Hardness Testing \(HT\)/i).length > 0);
  assert.ok(ui.getAllByText(/ASTM A956/i).length > 0);
});
