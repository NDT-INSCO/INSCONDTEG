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
  RT_SOURCES,
  RT_TECHNIQUES,
  RT_FILMS,
  RT_WELD_SPECIMENS,
  computeGeometricUnsharpness,
  computeRadiationSafetyZone,
  selectEssentialAsmeWire,
  computeOptimalExposureSeconds,
  evaluateDevelopedFilm,
} = await import('../src/data/rtSimulationData');

const { RadiographicTestingLab } = await import(
  '../src/components/academy/virtuallab/RadiographicTestingLab'
);
const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { NdtVirtualLabWorkbench } = await import(
  '../src/components/academy/virtuallab/NdtVirtualLabWorkbench'
);
const { getSimulationHistory } = await import('../src/utils/simulationHistoryStore');
const { render, fireEvent, cleanup } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  dom.window.history.replaceState(null, '', '/-Project-/');
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
});

afterEach(() => cleanup());

test('ASME Sec V Art. 2 physics helpers compute Ug, 2 mR/hr barricade zone, IQI wire, and H&D density accurately', () => {
  const ir192 = RT_SOURCES.find((s) => s.id === 'ir192')!;
  const xrayDir = RT_SOURCES.find((s) => s.id === 'xray_directional')!;
  const swsi = RT_TECHNIQUES.find((t) => t.id === 'swsi_plate')!;
  const class1 = RT_FILMS.find((f) => f.id === 'class_1')!;

  // 1. Geometric unsharpness Ug: close SFD (140mm) fails; standard SFD (600mm) passes
  const badUg = computeGeometricUnsharpness(ir192.focalSpotMm, 110, 18, 1);
  assert.equal(badUg.passesAsmeUg, false);
  assert.ok(badUg.ugMm > badUg.maxAllowedUgMm);

  const goodUg = computeGeometricUnsharpness(ir192.focalSpotMm, 600, 18, 1);
  assert.equal(goodUg.passesAsmeUg, true);
  assert.ok(goodUg.ugMm <= 0.51);

  // 2. Radiation safety zone: Tungsten 4-HVL collimator shrinks 2 mR/hr barricade distance
  const uncollimated = computeRadiationSafetyZone(ir192, 50, 0, 0, false);
  const collimated = computeRadiationSafetyZone(ir192, 50, 0, 0, true);
  assert.ok(collimated.barricadeRadius2mRhrMeters < uncollimated.barricadeRadius2mRhrMeters);

  // X-Ray safety zone scales with kV and mA
  const xrayZone = computeRadiationSafetyZone(xrayDir, 0, 220, 5, true);
  assert.ok(xrayZone.barricadeRadius2mRhrMeters > 5);

  // 3. Essential ASME Table T-276 IQI wire selection: film-side requires 1 wire thinner than source-side
  const srcWire = selectEssentialAsmeWire(16, true);
  const filmWire = selectEssentialAsmeWire(16, false);
  assert.ok(filmWire.essentialWireDiameterMm < srcWire.essentialWireDiameterMm);

  // 4. Film density H&D evaluation across under-exposure, optimal, and over-exposure
  const baseInput = {
    source: ir192,
    technique: swsi,
    filmClass: class1,
    wallThicknessMm: 18,
    sfdMm: 600,
    activityCi: 45,
    kv: 0,
    ma: 0,
    hasLeadScreens: true,
    hasBackscatterB: true,
    developerTempC: 20,
    developerMinutes: 5,
  };

  const optSec = computeOptimalExposureSeconds(baseInput);
  assert.ok(optSec >= 12 && optSec <= 900);

  const optimalEval = evaluateDevelopedFilm(baseInput, optSec, goodUg.ugMm, goodUg.maxAllowedUgMm);
  assert.equal(optimalEval.passesFilmQc, true);
  assert.ok(optimalEval.weldMetalDensity >= 2.0 && optimalEval.weldMetalDensity <= 4.0);
  assert.equal(optimalEval.essentialWireVisible, true);

  const underEval = evaluateDevelopedFilm(
    baseInput,
    Math.max(2, Math.round(optSec * 0.15)),
    goodUg.ugMm,
    goodUg.maxAllowedUgMm
  );
  assert.equal(underEval.passesAsmeDensity, false);
  assert.ok(underEval.weldMetalDensity < 2.0);

  const overEval = evaluateDevelopedFilm(
    baseInput,
    optSec * 4,
    goodUg.ugMm,
    goodUg.maxAllowedUgMm
  );
  assert.equal(overEval.passesAsmeDensity, false);
  assert.ok(overEval.weldMetalDensity > 4.0);
});

test('RadiographicTestingLab executes full 4-stage workflow (Setup → Shoot & Survey → Darkroom → Film Defect Reading & XP Log)', () => {
  assert.equal(RT_WELD_SPECIMENS.length, 8);
  const ui = render(<RadiographicTestingLab language="ar" />);

  // Stage 1: Verify header & switch source between Gamma Se-75 and X-Ray Directional, then back to Ir-192
  assert.ok(
    ui.getByText(/معمل التصوير الإشعاعي الشامل: من تجهيز الموقع والتصوير حتى قراءة الأفلام/i)
  );
  fireEvent.click(ui.getByRole('button', { name: /Directional X-Ray|ماكينة إكس راي اتجاهية/i }));
  assert.ok(ui.getByLabelText(/جهد الأنبوبة/i));

  fireEvent.click(ui.getByRole('button', { name: /جاما إيريديوم-192/i }));
  assert.ok(ui.getByLabelText(/نشاط مصدر الجاما الحالي/i));

  // Advance to Stage 2: Exposure & Shooting
  fireEvent.click(
    ui.getByRole('button', { name: /الانتقال لمنصة التعريض والتصوير الميداني/i })
  );

  // Crank out Gamma source -> Instant Finish -> Retract & Survey -> Proceed to Darkroom
  fireEvent.click(ui.getByTestId('rt-start-exposure-btn'));
  fireEvent.click(ui.getByTestId('rt-instant-finish-btn'));
  fireEvent.click(ui.getByTestId('rt-retract-survey-btn'));
  fireEvent.click(ui.getByTestId('rt-proceed-darkroom-btn'));

  // Stage 3: Darkroom QC should show PASS for optimal setup
  assert.ok(ui.getByText(/الفيلم مقبول فنياً للقراءة/i));

  // Advance to Stage 4: Negatoscope & Film Interpretation
  fireEvent.click(
    ui.getByRole('button', { name: /تركيب الفيلم على النيجاتوسكوب وقراءة العيوب/i })
  );

  // Default specimen #1 is Root Crack (18.0 mm, REJECT under ASME VIII UW-51)
  const lengthInput = ui.getByLabelText(/طول العيب المقاس/i) as HTMLInputElement;
  fireEvent.change(lengthInput, { target: { value: '18.0' } });

  fireEvent.click(
    ui.getByRole('button', { name: /اعتماد تقرير قراءة الفيلم وتسجيل النقاط/i })
  );

  // Should pass with 100% score and log into simulationHistoryStore as 'RT'
  assert.ok(ui.getByText(/اجتياز تقييم قراءة الفيلم بنجاح/i));
  assert.ok(ui.getByText(/100% · \+\d+ XP/));

  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].ndtMethod, 'RT');
  assert.equal(history[0].targetSubTab, 'rt_lab');
  assert.equal(history[0].status, 'PASS');
  assert.ok(history[0].xpEarned > 0);
});

test('RadiographicTestingLab supports Sound Weld ACCEPT evaluation and #rt_lab routing in EducationalAcademy & NdtVirtualLabWorkbench', () => {
  // 1. Direct English Sound Weld evaluation
  const labUi = render(<RadiographicTestingLab language="en" />);
  fireEvent.click(labUi.getByRole('button', { name: /#8 · W-150/i }));
  fireEvent.click(labUi.getByRole('button', { name: /STAGE 04/i }));

  fireEvent.click(
    labUi.getByRole('button', { name: /^Sound Weld — No Rejectable Discontinuities$/i })
  );
  fireEvent.click(labUi.getByRole('button', { name: /Submit RT Film Interpretation & Log XP/i }));

  assert.ok(labUi.getByText(/RT Film Interpretation Passed!/i));
  cleanup();

  // 2. NdtVirtualLabWorkbench switches into Gamma & X-Ray RT Lab
  const wbUi = render(<NdtVirtualLabWorkbench language="ar" />);
  fireEvent.click(
    wbUi.getByRole('button', {
      name: /معمل التصوير الإشعاعي RT \(جاما وإكس راي \+ قراءة الأفلام\)/i,
    })
  );
  assert.ok(
    wbUi.getByText(/معمل التصوير الإشعاعي الشامل: من تجهيز الموقع والتصوير حتى قراءة الأفلام/i)
  );
  cleanup();

  // 3. EducationalAcademy deep-links via #rt_lab hash
  dom.window.location.hash = '#rt_lab';
  const acadUi = render(<EducationalAcademy language="ar" />);
  assert.ok(
    acadUi.getByText(/معمل التصوير الإشعاعي الشامل: من تجهيز الموقع والتصوير حتى قراءة الأفلام/i)
  );
});
