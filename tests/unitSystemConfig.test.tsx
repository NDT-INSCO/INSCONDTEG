import React from 'react';
import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  get length() {
    return this.store.size;
  }
}

const storage = new MemoryStorage();
const dom = new JSDOM('<!doctype html><html lang="en" dir="ltr"><body></body></html>', {
  url: 'https://ndt-insco.github.io/-Project-/',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  CustomEvent: dom.window.CustomEvent,
  StorageEvent: dom.window.StorageEvent,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const {
  DEFAULT_UNIT_SYSTEM_STORAGE_KEY,
  GE_APP_UNIT_OVERRIDE_KEY,
  readDefaultUnitSystem,
  setDefaultUnitSystem,
  toggleDefaultUnitSystem,
  resolveCalculatorInitialUnitSystem,
} = await import('../src/utils/unitSystemStore');
const { App } = await import('../src/App');
const { GeRadiographicExposureTimeApp } = await import(
  '../src/components/academy/virtuallab/GeRadiographicExposureTimeApp'
);
const { NdeEncyclopediaView } = await import(
  '../src/components/academy/NdeEncyclopediaView'
);
const { CompanyProjectCostEstimator } = await import(
  '../src/components/company/CompanyProjectCostEstimator'
);
const { render, fireEvent, cleanup, act } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  dom.window.history.replaceState(null, '', '/-Project-/');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  document.documentElement.removeAttribute('data-unit-system');
});

afterEach(() => cleanup());

test('unitSystemStore defaults to metric, persists changes, clears calculator overrides, and resolves calculator priority', () => {
  assert.equal(readDefaultUnitSystem(), 'metric');

  storage.setItem(GE_APP_UNIT_OVERRIDE_KEY, 'metric');
  setDefaultUnitSystem('imperial');

  assert.equal(readDefaultUnitSystem(), 'imperial');
  assert.equal(storage.getItem(DEFAULT_UNIT_SYSTEM_STORAGE_KEY), 'imperial');
  assert.equal(document.documentElement.dataset.unitSystem, 'imperial');
  // Changing the global default clears stale per-calculator overrides
  assert.equal(storage.getItem(GE_APP_UNIT_OVERRIDE_KEY), null);
  assert.equal(resolveCalculatorInitialUnitSystem(GE_APP_UNIT_OVERRIDE_KEY), 'imperial');

  // Direct local override takes priority if set after global config
  storage.setItem(GE_APP_UNIT_OVERRIDE_KEY, 'metric');
  assert.equal(resolveCalculatorInitialUnitSystem(GE_APP_UNIT_OVERRIDE_KEY), 'metric');

  // Toggle helper flips cleanly back to metric
  const toggled = toggleDefaultUnitSystem();
  assert.equal(toggled, 'metric');
  assert.equal(storage.getItem(DEFAULT_UNIT_SYSTEM_STORAGE_KEY), 'metric');
  assert.equal(document.documentElement.dataset.unitSystem, 'metric');
});

test('GlobalAppConfigControl persists default unit system in localStorage across App unmount and remount', () => {
  const firstMount = render(<App />);
  const toggleBtn = firstMount.getByTestId('global-app-config-toggle');
  assert.equal(toggleBtn.getAttribute('data-default-unit'), 'metric');
  assert.equal(document.documentElement.dataset.unitSystem, 'metric');

  // Open App Configuration popover
  fireEvent.click(toggleBtn);
  const panel = firstMount.getByTestId('global-app-config-panel');
  assert.ok(panel);

  const imperialBtn = firstMount.getByTestId('global-default-unit-imperial');
  fireEvent.click(imperialBtn);

  assert.equal(storage.getItem(DEFAULT_UNIT_SYSTEM_STORAGE_KEY), 'imperial');
  assert.equal(toggleBtn.getAttribute('data-default-unit'), 'imperial');
  assert.equal(document.documentElement.dataset.unitSystem, 'imperial');

  // Escape closes popover
  fireEvent.keyDown(window, { key: 'Escape' });
  assert.equal(firstMount.queryByTestId('global-app-config-panel'), null);

  // Unmount and remount App — global unit system restores from localStorage
  cleanup();
  document.documentElement.removeAttribute('data-unit-system');

  const secondMount = render(<App />);
  const remountedToggle = secondMount.getByTestId('global-app-config-toggle');
  assert.equal(remountedToggle.getAttribute('data-default-unit'), 'imperial');
  assert.equal(document.documentElement.dataset.unitSystem, 'imperial');
});

test('GeRadiographicExposureTimeApp defaults to the global default unit system and syncs live when config changes', () => {
  setDefaultUnitSystem('imperial');

  const ui = render(<GeRadiographicExposureTimeApp language="en" />);
  const imperialBtn = ui.getByTestId('ge-unit-toggle-imperial');
  const metricBtn = ui.getByTestId('ge-unit-toggle-metric');

  assert.ok(imperialBtn.className.includes('bg-amber-500'));
  assert.equal(metricBtn.className.includes('bg-sky-500'), false);

  // Changing global setting in App Config updates mounted exposure calculator immediately
  act(() => {
    setDefaultUnitSystem('metric');
  });

  assert.ok(metricBtn.className.includes('bg-sky-500'));
  assert.equal(imperialBtn.className.includes('bg-amber-500'), false);
});

test('NdeEncyclopediaView formula calculators default to the global unit system and convert dimensional units', () => {
  setDefaultUnitSystem('imperial');

  const ui = render(<NdeEncyclopediaView language="en" />);

  // Open Formula Lab tab
  const calcTabBtn = ui.getByRole('button', { name: 'Formula Lab' });
  assert.ok(calcTabBtn);
  fireEvent.click(calcTabBtn);

  const workspace = ui.getByTestId('encyclopedia-calculator-workspace');
  assert.equal(workspace.getAttribute('data-unit-mode'), 'imperial');

  // First formula is UT Near Field: default crystal diameter D = 12.7 mm = 0.5 in
  const crystalDisplay = ui.getByTestId('encyclopedia-var-value-D');
  assert.match(crystalDisplay.textContent || '', /0\.5 in/);

  const resultEl = ui.getByTestId('encyclopedia-calc-result');
  assert.match(resultEl.textContent || '', /in\b/);

  // Switching global setting to metric converts sliders & output back to mm
  act(() => {
    setDefaultUnitSystem('metric');
  });

  assert.equal(workspace.getAttribute('data-unit-mode'), 'metric');
  assert.match(ui.getByTestId('encyclopedia-var-value-D').textContent || '', /12\.7 mm/);
  assert.match(ui.getByTestId('encyclopedia-calc-result').textContent || '', /mm\b/);
});

test('CompanyProjectCostEstimator reflects the global default unit system in wall thickness options', () => {
  setDefaultUnitSystem('imperial');

  const ui = render(<CompanyProjectCostEstimator language="en" />);
  const section = document.getElementById('cost-estimator');
  assert.equal(section?.getAttribute('data-unit-mode'), 'imperial');

  const select = document.getElementById('estimator-thickness-tier') as HTMLSelectElement | null;
  assert.ok(select);
  assert.match(select.options[0]?.textContent || '', /0\.47"/);

  act(() => {
    setDefaultUnitSystem('metric');
  });

  assert.equal(section?.getAttribute('data-unit-mode'), 'metric');
  assert.match(select.options[0]?.textContent || '', /12 mm/);
});
