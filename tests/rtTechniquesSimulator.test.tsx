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

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const {
  computePanoramicSimulation,
  computeEllipticalSimulation,
  computeStraightSimulation,
} = await import('../src/data/rtTechniquesPhysics');
const { RtShootingTechniquesSimulator } = await import(
  '../src/components/academy/virtuallab/RtShootingTechniquesSimulator'
);
const { RadiographicTestingLab } = await import(
  '../src/components/academy/virtuallab/RadiographicTestingLab'
);
const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { readAcademyTab } = await import('../src/academyTabs');
const { getSimulationHistory, clearSimulationHistory } = await import(
  '../src/utils/simulationHistoryStore'
);
const { render, fireEvent, cleanup } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  clearSimulationHistory();
  window.location.hash = '';
});

afterEach(() => {
  cleanup();
});

test('Panoramic, Elliptical, and Straight physics engines satisfy ASME Sec V Art. 2 rules', () => {
  // 1. Panoramic 16" pipe (OD 406.4 mm, C ~ 1276.7 mm, 400mm film w/ 30mm overlap => 370mm eff => 4 films)
  const panoCentered = computePanoramicSimulation({
    odMm: 406.4,
    wallMm: 9.5,
    sourceId: 'ir192',
    filmLengthMm: 400,
    overlapMm: 30,
    eccentricityMm: 0,
  });
  assert.equal(panoCentered.exposuresRequired, 1);
  assert.equal(panoCentered.requiredFilmsCount, 4);
  assert.equal(panoCentered.nearWallDensityHd, 2.6);
  assert.equal(panoCentered.farWallDensityHd, 2.6);
  assert.equal(panoCentered.passesAsmeCode, true);

  // Off-center spider eccentricity spikes 12:00 density and drops 6:00 density
  const panoEccentric = computePanoramicSimulation({
    odMm: 406.4,
    wallMm: 9.5,
    sourceId: 'ir192',
    filmLengthMm: 400,
    overlapMm: 30,
    eccentricityMm: 55,
  });
  assert.ok(panoEccentric.nearWallDensityHd > 3.0);
  assert.ok(panoEccentric.farWallDensityHd < 2.3);
  assert.equal(panoEccentric.passesAsmeCode, false);

  // 2. Elliptical small-bore 2" pipe (OD 60.3 mm <= 88.9 mm)
  const ellipClosed = computeEllipticalSimulation({
    odMm: 60.3,
    wallMm: 5.5,
    weldCapWidthMm: 9,
    sfdMm: 480,
    axialOffsetMm: 0,
    sourceId: 'se75',
    activeShotIndex: 0,
  });
  assert.equal(ellipClosed.status, 'SUPERIMPOSED_CLOSED');
  assert.equal(ellipClosed.passesAsmeCode, false);

  const ellipOpenShot1 = computeEllipticalSimulation({
    odMm: 60.3,
    wallMm: 5.5,
    weldCapWidthMm: 9,
    sfdMm: 480,
    axialOffsetMm: ellipClosed.optimalOffsetMm,
    sourceId: 'se75',
    activeShotIndex: 0,
  });
  assert.equal(ellipOpenShot1.status, 'OPTIMAL_OPEN_ELLIPSE');
  assert.equal(ellipOpenShot1.exposuresRequired, 2);
  assert.equal(ellipOpenShot1.rotationStepDeg, 90);
  assert.equal(ellipOpenShot1.passesAsmeCode, true);

  // At Shot 1 (0 deg), 3:00 flaw is on tangential edge; at Shot 2 (90 deg), 3:00 flaw rotates to center!
  const flaw3Shot1 = ellipOpenShot1.projectedFlaws.find((f) => f.clockHour === 3)!;
  assert.equal(flaw3Shot1.clearlyResolvedInCurrentShot, false);

  const ellipOpenShot2 = computeEllipticalSimulation({
    odMm: 60.3,
    wallMm: 5.5,
    weldCapWidthMm: 9,
    sfdMm: 480,
    axialOffsetMm: ellipClosed.optimalOffsetMm,
    sourceId: 'se75',
    activeShotIndex: 1,
  });
  const flaw3Shot2 = ellipOpenShot2.projectedFlaws.find((f) => f.clockHour === 3)!;
  assert.equal(flaw3Shot2.clearlyResolvedInCurrentShot, true);

  // OD > 88.9 mm triggers EXCEEDS_OD_LIMIT
  const ellipTooLarge = computeEllipticalSimulation({
    odMm: 114.3,
    wallMm: 6.0,
    weldCapWidthMm: 10,
    sfdMm: 600,
    axialOffsetMm: 120,
    sourceId: 'se75',
    activeShotIndex: 0,
  });
  assert.equal(ellipTooLarge.status, 'EXCEEDS_OD_LIMIT');

  // 3. Straight Technique: Superimposed (3 shots @ 60 deg), Contact DWSI (4 shots @ 90 deg), and Flat Plate
  const straightSuper = computeStraightSimulation({
    subMode: 'dwdi_superimposed',
    odMm: 60.3,
    wallMm: 11.1,
    plateWeldLengthMm: 1000,
    filmLengthMm: 400,
    sfdMm: 500,
    sourceId: 'se75',
    activeShotIndex: 0,
  });
  assert.equal(straightSuper.exposuresRequired, 3);
  assert.equal(straightSuper.rotationStepDeg, 60);
  assert.equal(straightSuper.passesAsmeCode, true);

  const straightContact = computeStraightSimulation({
    subMode: 'dwsi_contact',
    odMm: 219.1,
    wallMm: 12.7,
    plateWeldLengthMm: 1000,
    filmLengthMm: 400,
    sfdMm: 230,
    sourceId: 'ir192',
    activeShotIndex: 1,
  });
  assert.equal(straightContact.exposuresRequired, 4);
  assert.equal(straightContact.rotationStepDeg, 90);
  assert.equal(straightContact.wallsPenetrated, 2);
  assert.equal(straightContact.wallsViewed, 1);
  assert.equal(straightContact.passesAsmeCode, true);
});

test('RtShootingTechniquesSimulator switches across Panoramic, Elliptical, and Straight modes and logs XP', () => {
  assert.equal(readAcademyTab('#rt_techniques'), 'rt_techniques');

  const view = render(<RtShootingTechniquesSimulator language="ar" />);

  // Default mode is Panoramic
  assert.ok(view.getByLabelText('Panoramic axial cross section'));
  assert.ok(view.getByLabelText('Panoramic unrolled film belt preview'));

  // Switch to Elliptical Technique
  fireEvent.click(view.getByRole('button', { name: /02 · DWDI ELLIPTICAL/i }));
  assert.ok(view.getByLabelText('Elliptical offset axial ray tracing'));
  assert.ok(view.getByLabelText('Elliptical weld film projection'));

  // Toggle to Shot 2 (90 deg rotation)
  fireEvent.click(view.getByRole('button', { name: /لقطة 2/i }));
  assert.ok(view.getByText(/W-02 · 90°/));

  // Switch to Straight Technique and select DWSI Contact sub-mode
  fireEvent.click(view.getByRole('button', { name: /03 · 0° PERPENDICULAR STRAIGHT/i }));
  assert.ok(view.getByLabelText('Straight 0 degree perpendicular ray tracing'));
  assert.ok(view.getByLabelText('Straight 0 degree film preview'));
  fireEvent.click(view.getByRole('button', { name: /ستريت ملامس للمواسير/i }));
  assert.ok(view.getByText(/DWSI 0° Contact · Diagnostic Chord/));

  // Answer mastery check questions and log XP
  fireEvent.click(view.getByRole('button', { name: /الإليبس تكنيك \(DWDI Elliptical\) — لقطتان/i }));
  fireEvent.click(view.getByRole('button', { name: /الستريت تكنيك المتطابق/i }));
  fireEvent.click(view.getByRole('button', { name: /زيادة اسوداد الفيلم/i }));

  fireEvent.click(view.getByRole('button', { name: /حفظ إتمام محاكاة التكنيكات الثلاثة/i }));

  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].ndtMethod, 'RT');
  assert.equal(history[0].targetSubTab, 'rt_techniques');
  assert.equal(history[0].scorePct, 100);
});

test('RadiographicTestingLab toggles cleanly into the Panoramic/Elliptical/Straight simulator and back', () => {
  const view = render(<RadiographicTestingLab language="en" />);

  // Default shows 4-stage pipeline
  assert.ok(view.getByText(/STAGE 01/i));

  // Open Techniques Simulator inside RT Lab
  fireEvent.click(view.getByRole('button', { name: /Panoramic · Elliptical · Straight Simulator/i }));
  assert.ok(
    view.getByText(/Detailed RT Exposure Techniques Simulator: Panoramic, Elliptical & Straight/i)
  );

  // Return to 4-Stage Lab
  fireEvent.click(view.getByRole('button', { name: /Open Full Darkroom & Film Reading Lab/i }));
  assert.ok(view.getByText(/STAGE 01/i));
});

test("Academy 'معامل المحاكاة' (Simulation Labs) mounts Panorama, Ellipse, Street workbench with live dynamic technical controls", () => {
  assert.equal(readAcademyTab('#sim_labs_rt'), 'sim_labs_rt');

  const ui = render(<EducationalAcademy language="ar" />);

  // Click 'معامل المحاكاة' hub button in the Academy navigation bar
  const simLabsHubBtn = ui.getByTestId('academy-simulation-labs-hub');
  assert.match(simLabsHubBtn.textContent || '', /معامل المحاكاة/);
  fireEvent.click(simLabsHubBtn);

  // Workbench mounts under 'معامل المحاكاة'
  assert.ok(ui.getByTestId('simulation-labs-rt-workbench'));
  assert.ok(ui.getByLabelText('Dynamic Panorama ray tracing viewport'));

  // Dynamically change Focal Spot F from 3.0mm -> 4.2mm and verify live Ug readout updates
  const ugBefore = ui.getByTestId('live-ug-readout').textContent;
  const focalSlider = ui.getByLabelText(/حجم البؤرة الإشعاعية/i);
  fireEvent.change(focalSlider, { target: { value: '4.2' } });
  const ugAfter = ui.getByTestId('live-ug-readout').textContent;
  assert.notEqual(ugBefore, ugAfter);

  // Switch to Ellipse mode and change Axial Offset dynamically
  fireEvent.click(ui.getByTestId('tech-btn-ellipse'));
  assert.ok(ui.getByLabelText('Dynamic Ellipse ray tracing viewport'));
  const offsetSlider = ui.getByLabelText(/الإزاحة المحورية/i);
  fireEvent.change(offsetSlider, { target: { value: '130' } });
  assert.ok(ui.getByText(/Axial Offset L = 130 mm/));

  // Switch to Straight / Street mode and toggle 3-technique comparison strip
  fireEvent.click(ui.getByTestId('tech-btn-street'));
  assert.ok(ui.getByLabelText('Dynamic Straight 0 degree ray tracing viewport'));
  fireEvent.click(ui.getByRole('button', { name: /مقارنة التقنيات الثلاث معاً/i }));
  assert.ok(ui.getByTestId('live-three-tech-comparison'));

  // Override exposure time manually and verify film density H&D responds dynamically
  const densityBefore = ui.getByTestId('live-density-readout').textContent;
  const expTimeSlider = ui.getByLabelText(/زمن التعريض \(ثانية\)/i);
  fireEvent.change(expTimeSlider, { target: { value: '240' } });
  const densityAfter = ui.getByTestId('live-density-readout').textContent;
  assert.notEqual(densityBefore, densityAfter);

  // Auto-optimize and save lab experiment to history
  fireEvent.click(ui.getByRole('button', { name: /ضبط مثالي تلقائي \(ASME\)/i }));
  fireEvent.click(ui.getByRole('button', { name: /حفظ تجربة المعمل في سجل المحاكاة/i }));

  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].targetSubTab, 'sim_labs_rt');
  assert.equal(history[0].ndtMethod, 'RT');
});

