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
const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/-Project-/',
  pretendToBeVisual: true,
});

dom.window.HTMLMediaElement.prototype.play = async function () {};
dom.window.HTMLMediaElement.prototype.pause = function () {};

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16).unref(),
  cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

Object.assign(dom.window, { ResizeObserver: globalThis.ResizeObserver });

const {
  MISSING_NDT_METHODS,
  MISSING_NDT_CODE_SCENARIOS,
  evaluateMissingNdtMethod,
} = await import('../src/data/missingNdtTestsEngine');

const { MissingNdtTestsSimulator } = await import(
  '../src/components/academy/virtuallab/MissingNdtTestsSimulator'
);
const { NdtVirtualLabWorkbench } = await import(
  '../src/components/academy/virtuallab/NdtVirtualLabWorkbench'
);
const { WorkshopAr4dAllBranchesLab } = await import(
  '../src/components/academy/virtuallab/WorkshopAr4dAllBranchesLab'
);
const { GeRadiographicExposureTimeApp } = await import(
  '../src/components/academy/virtuallab/GeRadiographicExposureTimeApp'
);
const { getSimulationHistory, clearSimulationHistory } = await import(
  '../src/utils/simulationHistoryStore'
);
const { render, fireEvent, cleanup } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  clearSimulationHistory();
});

afterEach(() => {
  cleanup();
});

test('missingNdtTestsEngine evaluates all 6 missing NDT disciplines and all 24 international code scenarios accurately', () => {
  assert.equal(MISSING_NDT_METHODS.length, 6);
  assert.equal(MISSING_NDT_CODE_SCENARIOS.length, 24);

  // Every scenario must evaluate cleanly with 5 international code clauses and match its expected outcome
  for (const scenario of MISSING_NDT_CODE_SCENARIOS) {
    const res = evaluateMissingNdtMethod(scenario.methodId, scenario.params);
    assert.equal(res.clauses.length, 5, `${scenario.id} must evaluate 5 international codes`);
    assert.equal(
      res.overallStatus,
      scenario.expectedOutcome,
      `Scenario ${scenario.id} expected ${scenario.expectedOutcome}, got ${res.overallStatus}`
    );
    assert.equal(res.metrics.length, 4);
  }
});

test('MissingNdtTestsSimulator switches all 6 labs, loads code scenarios, updates sliders, and records XP in Arabic RTL & English', () => {
  const ui = render(<MissingNdtTestsSimulator language="ar" />);

  assert.equal(ui.getByTestId('missing-ndt-tests-simulator').getAttribute('dir'), 'rtl');
  assert.ok(ui.getByTestId('missing-ndt-svg-et_rft'));

  // Load TEMA 40% plugging reject scenario
  fireEvent.click(ui.getByTestId('missing-ndt-scenario-et_reject_tema_plug'));
  assert.equal(ui.getByTestId('missing-ndt-overall-verdict').getAttribute('data-status'), 'reject');
  assert.equal(ui.getByTestId('missing-ndt-clause-tema_rcb').getAttribute('data-clause-status'), 'reject');

  // Switch trainee verdict to REJECT and log XP
  fireEvent.click(ui.getByTestId('missing-ndt-verdict-reject'));
  fireEvent.click(ui.getByTestId('missing-ndt-log-xp-btn'));
  const xpBanner = ui.getByTestId('missing-ndt-xp-banner');
  assert.ok(xpBanner.textContent?.includes('REJECT'));
  assert.equal(getSimulationHistory().length, 1);

  // Switch across every remaining discipline and check custom SVG canvas + code scenario loading
  fireEvent.click(ui.getByTestId('missing-ndt-tab-lt_hydro'));
  assert.ok(ui.getByTestId('missing-ndt-svg-lt_hydro'));
  fireEvent.click(ui.getByTestId('missing-ndt-scenario-lt_reject_decay'));
  assert.equal(ui.getByTestId('missing-ndt-clause-asme_b313').getAttribute('data-clause-status'), 'reject');

  fireEvent.click(ui.getByTestId('missing-ndt-tab-tofd'));
  assert.ok(ui.getByTestId('missing-ndt-svg-tofd'));
  fireEvent.click(ui.getByTestId('missing-ndt-scenario-tofd_reject_surface_crack'));
  assert.equal(ui.getByTestId('missing-ndt-clause-asme_viii_app12').getAttribute('data-clause-status'), 'reject');

  fireEvent.click(ui.getByTestId('missing-ndt-tab-mfl_api_ffs'));
  assert.ok(ui.getByTestId('missing-ndt-svg-mfl_api_ffs'));
  fireEvent.click(ui.getByTestId('missing-ndt-scenario-mfl_pass_api'));
  assert.equal(ui.getByTestId('missing-ndt-overall-verdict').getAttribute('data-status'), 'pass');

  fireEvent.click(ui.getByTestId('missing-ndt-tab-coating_holiday'));
  assert.ok(ui.getByTestId('missing-ndt-svg-coating_holiday'));
  fireEvent.click(ui.getByTestId('missing-ndt-scenario-coat_reject_dewpoint'));
  assert.equal(ui.getByTestId('missing-ndt-clause-iso_8502_dew').getAttribute('data-clause-status'), 'reject');

  fireEvent.click(ui.getByTestId('missing-ndt-tab-pmi_hardness'));
  assert.ok(ui.getByTestId('missing-ndt-svg-pmi_hardness'));
  fireEvent.click(ui.getByTestId('missing-ndt-scenario-pmi_reject_nace_hard'));
  assert.equal(ui.getByTestId('missing-ndt-clause-nace_mr0175').getAttribute('data-clause-status'), 'reject');

  // Interactive slider recovery brings NACE hardness back under 248 HV
  const hvSlider = ui.getByTestId('missing-ndt-slider-hazHardnessHv') as HTMLInputElement;
  fireEvent.change(hvSlider, { target: { value: '212' } });
  assert.equal(ui.getByTestId('missing-ndt-clause-nace_mr0175').getAttribute('data-clause-status'), 'pass');
});

test('NdtVirtualLabWorkbench and WorkshopAr4dAllBranchesLab launch MissingNdtTestsSimulator directly for all missing workshop branches', () => {
  const wb = render(<NdtVirtualLabWorkbench language="ar" />);
  fireEvent.click(wb.getByTestId('lab-mode-missing-ndt-tests'));
  assert.ok(wb.getByTestId('missing-ndt-tests-simulator'));
  wb.unmount();

  const ar4d = render(<WorkshopAr4dAllBranchesLab language="en" />);
  fireEvent.click(ar4d.getByTestId('ar4d-branch-welding_hydro'));
  fireEvent.click(ar4d.getByTestId('ar4d-open-missing-ndt-suite'));
  assert.ok(ar4d.getByTestId('missing-ndt-svg-lt_hydro'));
  fireEvent.click(ar4d.getByTestId('ar4d-back-from-missing-ndt-btn'));
  assert.ok(ar4d.getByTestId('workshop-ar4d-all-branches-lab'));
});

test('GeRadiographicExposureTimeApp ghost trail segmented control displays reach multiplier and auto-reveals Pb photoelectron paths if hidden', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);
  const toggleGroup = ui.getByTestId('ge-pb-ghost-trail-length-toggle');
  assert.ok(toggleGroup.textContent?.includes('Ghost Trail:'));
  assert.equal(ui.getByTestId('ge-pb-ghost-trail-reach-badge').textContent?.trim(), '1×');

  // Toggle Pb paths OFF first
  const pbPathsBtn = ui.getByTestId('ge-beam-toggle-pb-photoelectron-paths');
  fireEvent.click(pbPathsBtn);
  assert.equal(pbPathsBtn.getAttribute('aria-pressed'), 'false');

  // Selecting 'long' from segmented ghost trail control auto-enables Pb paths and applies rt-pb-ghost-len-long
  fireEvent.click(ui.getByTestId('ge-pb-ghost-trail-length-long'));
  assert.equal(pbPathsBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(ui.getByTestId('ge-pb-ghost-trail-reach-badge').textContent?.trim(), '1.65×');
  const pathsGroup = ui.getByTestId('ge-pb-photoelectron-paths');
  assert.ok(pathsGroup.querySelector('line.rt-pb-electron-ghost-trail-primary.rt-pb-ghost-len-long'));
});
