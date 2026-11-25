import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  calculateIsotopeDecay,
  calculateGeRadiographicExposure,
  getAsmeMaxUg,
  getAsmeWireIqi,
  GE_ISOTOPES,
  GE_STRUCTURIX_FILMS
} from '../src/utils/geExposureTimeEngine';
import {
  generateGeRadiographicExposurePdf,
  generateGeConversionLogPdf
} from '../src/utils/geRadiographicExposurePdfGenerator';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  SVGElement: dom.window.SVGElement,
  SVGPathElement: dom.window.SVGPathElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event
});

if (!globalThis.requestAnimationFrame) {
  const raf = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
  const caf = (id: number) => clearTimeout(id);
  globalThis.requestAnimationFrame = raf;
  globalThis.cancelAnimationFrame = caf;
  (dom.window as unknown as Window).requestAnimationFrame = raf;
  (dom.window as unknown as Window).cancelAnimationFrame = caf;
}

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:mock-pdf-url';
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = () => {};
}

const { render, fireEvent, cleanup, screen, waitFor } = await import('@testing-library/react');
const {
  GeRadiographicExposureTimeApp,
  GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY,
  GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY,
  getPbGhostTrailAnimationConfig,
  computePbGhostTrailEndpoint,
  buildConversionLogCsv,
  getUnitConversionFormula,
  computeBeamDecayProfile,
  interpolateBeamDecayAtNorm,
  compute4dDecayShiftSnapshot
} = await import('../src/components/academy/virtuallab/GeRadiographicExposureTimeApp');
const { computeLongitudinalPenetrationModel } = await import(
  '../src/components/academy/virtuallab/LongitudinalWavePenetrationSim'
);
const { NdtVirtualLabWorkbench } = await import('../src/components/academy/virtuallab/NdtVirtualLabWorkbench');
const { RadiographicTestingLab } = await import('../src/components/academy/virtuallab/RadiographicTestingLab');
const { InteractiveWorkshops } = await import('../src/components/academy/InteractiveWorkshops');
const { ArCompleteRtCodeSimulator } = await import('../src/components/academy/virtuallab/ArCompleteRtCodeSimulator');

afterEach(() => {
  cleanup();
  localStorage.removeItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY);
  localStorage.removeItem(GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY);
});

test('calculateIsotopeDecay accurately computes radioactive decay for Ir-192 and Se-75', () => {
  // 1. Ir-192: 100 Ci, half-life 73.83 days. After exactly 73.83 days -> 50 Ci (50% remaining)
  const d0 = '2026-01-01';
  const d1 = '2026-03-16'; // ~74 days later
  const irDecay = calculateIsotopeDecay(100, d0, d1, GE_ISOTOPES.ir192.halfLifeDays);
  assert.ok(irDecay.daysElapsed >= 73 && irDecay.daysElapsed <= 75);
  assert.ok(irDecay.currentCi >= 48 && irDecay.currentCi <= 52, `Expected ~50 Ci, got ${irDecay.currentCi}`);

  // 2. Se-75: 60 Ci, after 0 days -> 60 Ci
  const se0 = calculateIsotopeDecay(60, '2026-05-01', '2026-05-01', GE_ISOTOPES.se75.halfLifeDays);
  assert.equal(se0.daysElapsed, 0);
  assert.equal(se0.currentCi, 60);
});

test('calculateGeRadiographicExposure conforms to inverse square law and film speed', () => {
  // Baseline test on 12mm carbon steel, Ir-192 45 Ci, Agfa D7, SFD 70cm
  const baseline = calculateGeRadiographicExposure({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    filmId: 'd7',
    technique: 'dwsi_contact',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true
  });

  assert.ok(baseline.calculatedTotalSeconds > 20 && baseline.calculatedTotalSeconds < 600, 'Baseline exposure in field range');
  assert.ok(baseline.passesAsmeUg, 'Should pass ASME Section V geometric unsharpness');
  assert.ok(baseline.controlledAreaPerimeter2mR_Meters > 0);

  // If SFD is doubled to 140cm, exposure time should quadruple by the Inverse Square Law (~4x)
  const doubledSfd = calculateGeRadiographicExposure({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    filmId: 'd7',
    technique: 'dwsi_contact',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 140, // 2x SFD
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true
  });

  const ratio = doubledSfd.calculatedTotalSeconds / baseline.calculatedTotalSeconds;
  assert.ok(ratio >= 3.8 && ratio <= 4.2, `Expected ~4x time ratio for 2x SFD, got ${ratio}`);

  // Structurix D4 is ~2.3x slower than D7, requiring more exposure
  const d4Film = calculateGeRadiographicExposure({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    filmId: 'd4',
    technique: 'dwsi_contact',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true
  });

  assert.ok(d4Film.calculatedTotalSeconds > baseline.calculatedTotalSeconds, 'D4 must require more exposure time than D7');
});

test('GeRadiographicExposureTimeApp renders with authentic GE controls, decay tracking, and live clock', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Title and branding
  assert.ok(ui.getByTestId('ge-exposure-calculator-app'));
  assert.ok(ui.getByText(/GE \/ Waygate Radiographic Exposure Time App/i));

  // Calculated exposure display
  const display = ui.getByTestId('ge-calculated-exposure-display');
  assert.ok(display);
  assert.ok(ui.getByTestId('ge-curie-minutes'));
  assert.ok(ui.getByTestId('ge-effective-thickness'));
  assert.ok(ui.getByTestId('ge-ug-metric'));

  // Quick preset loading: 2" Pipe Elliptical
  fireEvent.click(ui.getByTestId('preset-pipe-2in'));
  const techSelect = ui.getByTestId('ge-select-technique') as HTMLSelectElement;
  assert.equal(techSelect.value, 'dwdi_elliptical');

  // Switch film to Agfa D4
  const filmSelect = ui.getByTestId('ge-select-film');
  fireEvent.change(filmSelect, { target: { value: 'd4' } });

  // Live timer controls
  const startBtn = ui.getByTestId('ge-timer-start-btn');
  assert.ok(startBtn);
  fireEvent.click(startBtn);
  assert.ok(ui.getByTestId('ge-timer-pause-btn'));
  fireEvent.click(ui.getByTestId('ge-timer-pause-btn'));

  // Reset timer
  fireEvent.click(ui.getByTestId('ge-timer-reset-btn'));
  assert.ok(ui.getByTestId('ge-timer-start-btn'));

  // Open technique sheet modal
  fireEvent.click(ui.getByTestId('ge-technique-sheet-btn'));
  assert.ok(ui.getByText(/ASME Sec V Article 2 Radiographic Technique Card/i));
});

test('GeRadiographicExposureTimeApp renders seamlessly in Arabic RTL layout', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="ar" />);

  assert.ok(ui.getByText(/حاسبة وقت التعريض الإشعاعي المعتمدة/i));
  assert.ok(ui.getByText(/زمن التعريض المحسوب بدقة GE/i));
  assert.ok(ui.getByTestId('preset-pipe-6in'));
});

test('NdtVirtualLabWorkbench mode selector switches to GE Exposure Time App', () => {
  const ui = render(<NdtVirtualLabWorkbench language="en" />);

  // Mode button presence
  const modeBtn = ui.getByTestId('lab-mode-ge-exposure-calc');
  assert.ok(modeBtn);

  // Click to open GE app
  fireEvent.click(modeBtn);
  assert.ok(ui.getByTestId('ge-exposure-calculator-app'));
  assert.ok(ui.getByTestId('ge-calculated-exposure-display'));
});

test('RadiographicTestingLab allows launching GE Exposure Time App and applying calculated time', () => {
  const ui = render(<RadiographicTestingLab language="en" />);

  // Proceed to exposure stage
  fireEvent.click(ui.getByRole('button', { name: /Proceed to Exposure & Shooting/i }));

  // Click GE Exposure Time App button
  const geBtn = ui.getByTestId('rt-open-ge-exposure-calculator-btn');
  assert.ok(geBtn);
  fireEvent.click(geBtn);

  // GE app modal is visible
  assert.ok(ui.getByTestId('ge-exposure-calculator-app'));

  // Click Apply to RT Lab button
  const applyBtn = ui.getByTestId('ge-apply-to-lab-btn');
  assert.ok(applyBtn);
  fireEvent.click(applyBtn);

  // Modal closes and applied time is synced
  assert.equal(ui.queryByTestId('ge-apply-to-lab-btn'), null);
});

test('calculateGeRadiographicExposure reduces exposure time by ~45% in ASME T-282.1 dual composite mode', () => {
  const singleInput = {
    sourceType: 'ir192' as const,
    materialId: 'carbon_steel' as const,
    filmId: 'd7' as const,
    technique: 'dwsi_contact' as const,
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true
  };

  const singleResult = calculateGeRadiographicExposure(singleInput);

  const dualCompositeResult = calculateGeRadiographicExposure({
    ...singleInput,
    multiFilmConfig: {
      mode: 'dual_composite',
      primaryFilmId: 'd7'
    }
  });

  assert.equal(dualCompositeResult.isMultiFilm, true);
  assert.equal(dualCompositeResult.filmLoadingMode, 'dual_composite');
  assert.equal(dualCompositeResult.multiFilmTimeFactor, 0.55);
  // Time should be approximately 0.55 * singleResult time
  const expectedSecs = Math.round(singleResult.calculatedTotalSeconds * 0.55);
  assert.equal(dualCompositeResult.calculatedTotalSeconds, expectedSecs);
  assert.ok(dualCompositeResult.calculatedTotalSeconds < singleResult.calculatedTotalSeconds);
  assert.equal(
    dualCompositeResult.compositeSuperimposedDensity,
    Number((dualCompositeResult.film1PredictedDensity + dualCompositeResult.film2PredictedDensity!).toFixed(2))
  );
  assert.ok(dualCompositeResult.compositeSuperimposedDensity >= 2.4 && dualCompositeResult.compositeSuperimposedDensity <= 2.6);
  assert.ok(dualCompositeResult.film1PredictedDensity > 0);
  assert.ok(dualCompositeResult.film2PredictedDensity! > 0);
});

test('calculateGeRadiographicExposure calculates wide-latitude different film combinations and interleaf lead attenuation', () => {
  const wideLatResult = calculateGeRadiographicExposure({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    filmId: 'd4', // Front film: D4 (Class I, slower, fine grain)
    technique: 'dwsi_contact',
    materialThicknessMm: 16.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true,
    multiFilmConfig: {
      mode: 'dual_different',
      primaryFilmId: 'd4',
      secondaryFilmId: 'd7', // Back film: D7 (Class II, faster)
      hasInterleafLeadScreen: true,
      wideLatitudeGoverning: 'primary_film'
    }
  });

  assert.equal(wideLatResult.isMultiFilm, true);
  assert.equal(wideLatResult.filmLoadingMode, 'dual_different');
  assert.equal(wideLatResult.hasInterleafLeadScreen, true);
  assert.ok(wideLatResult.speedRatioDescription.includes('D4') && wideLatResult.speedRatioDescription.includes('D7'));
  assert.equal(wideLatResult.primaryFilmSpec.id, 'd4');
  assert.equal(wideLatResult.secondaryFilmSpec?.id, 'd7');
  assert.ok(wideLatResult.film1PredictedDensity > 0);
  assert.ok(wideLatResult.film2PredictedDensity! > wideLatResult.film1PredictedDensity, 'Faster D7 back film should achieve higher optical density');
});

test('GeRadiographicExposureTimeApp renders Recent Sources quick-switch chips and allows instant switching', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Should render recent source chips
  const irChip = ui.getByTestId('recent-source-chip-ir192');
  const seChip = ui.getByTestId('recent-source-chip-se75');
  assert.ok(irChip);
  assert.ok(seChip);

  // Click Se-75 chip to switch source
  fireEvent.click(seChip);
  const sourceSelect = ui.getByTestId('ge-select-source-type') as HTMLSelectElement;
  assert.equal(sourceSelect.value, 'se75');

  // Verify recent sources reordered with Se-75 first
  const updatedSeChip = ui.getByTestId('recent-source-chip-se75');
  assert.ok(updatedSeChip.classList.contains('bg-amber-500'));
});

test('GeRadiographicExposureTimeApp allows switching film loading modes and configures multi-film options', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Initially in single film mode
  assert.equal(ui.queryByTestId('ge-multi-film-badge'), null);

  // Switch to Dual Composite mode
  const dualCompBtn = ui.getByTestId('ge-film-loading-mode-dual-composite');
  fireEvent.click(dualCompBtn);

  // Badge should now appear in HUD
  const multiFilmBadge = ui.getByTestId('ge-multi-film-badge');
  assert.ok(multiFilmBadge);
  assert.ok(ui.getByText(/Dual Composite Superimposed \(ASME T-282\.1\)/i));
  assert.ok(ui.getByText(/-45% time/i));

  // Switch to Wide-Latitude Dual Different mode
  const wideLatBtn = ui.getByTestId('ge-film-loading-mode-dual-different');
  fireEvent.click(wideLatBtn);

  // Secondary film selector, interleaf toggle, and governing select should now be visible
  const secondarySelect = ui.getByTestId('ge-select-secondary-film') as HTMLSelectElement;
  assert.ok(secondarySelect);
  const interleafToggle = ui.getByTestId('ge-interleaf-screen-toggle') as HTMLInputElement;
  assert.ok(interleafToggle);
  assert.equal(interleafToggle.checked, false);

  // Toggle interleaf screen
  fireEvent.click(interleafToggle);
  assert.equal(interleafToggle.checked, true);
  assert.ok(ui.getByText(/\+0\.025mm Pb Interleaf/i));
});

test('generateGeRadiographicExposurePdf builds valid formatted PDF document with all engineering parameters', () => {
  const doc = generateGeRadiographicExposurePdf({
    reportNumber: 'RT-EXP-TEST-001',
    reportDate: '2026-11-06',
    clientName: 'INSCO Test Client',
    projectFacility: 'Cairo Fabrication Yard',
    weldJointId: 'WJ-PIPE-04',
    leadRadiographer: 'Eng. Ahmed Level II',
    radiographerLevel: 'Level II',
    inspectorCertNumber: 'INSCO-RT-4421',

    sourceType: 'ir192',
    isotopeSpec: GE_ISOTOPES.ir192,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-10-06',
    measurementDate: '2026-11-06',
    decayDaysElapsed: 31,
    currentLiveActivityCi: 33.6,

    materialSpec: {
      id: 'carbon_steel',
      nameEn: 'Carbon Steel (P1)',
      nameAr: 'الصلب الكربوني',
      rFactorIr192: 1.0,
      rFactorSe75: 1.0,
      rFactorCo60: 1.0,
      rFactorXray: 1.0,
      densityGcm3: 7.85
    },
    nominalThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    pipeOuterDiameterMm: 114.3,
    techniqueSpec: {
      id: 'dwsi_contact',
      nameEn: 'DWSI Contact (Single Wall Viewing)',
      nameAr: 'DWSI تلامس',
      wallsPenetrated: 2,
      descriptionEn: 'Double Wall Single Image',
      descriptionAr: 'جدار مزدوج صورة أحادية',
      defaultReinforcementMm: 2.5
    },
    sfdCm: 70,

    filmLoadingMode: 'dual_composite',
    primaryFilmSpec: GE_STRUCTURIX_FILMS.d7,
    secondaryFilmSpec: GE_STRUCTURIX_FILMS.d7,
    hasInterleafLeadScreen: false,
    hasLeadScreens: true,
    hasCollimator: true,
    targetOpticalDensity: 2.5,

    calculatedExposureSeconds: 84,
    formattedExposureDuration: '1m 24s',
    exposureInCurieMinutes: 47.0,
    effectiveSteelThicknessMm: 26.5,
    halfValueLayersCount: 2.1,
    attenuationFactor: 4.25,
    calculatedUgMm: 0.38,
    maxAllowedUgMm: 0.51,
    passesAsmeUg: true,
    essentialWireIdentity: '#8 (Wire 8)',
    essentialWireDiameterMm: 0.33,
    iqiSetDesignation: 'Set B (Wires 6-11)',
    controlledAreaPerimeter2mR_Meters: 17.2,
    publicBarricadePerimeter075mR_Meters: 28.1,

    isMultiFilm: true,
    film1PredictedDensity: 1.25,
    film2PredictedDensity: 1.25,
    compositeSuperimposedDensity: 2.5,
    multiFilmTimeFactor: 0.55,
    speedRatioDescription: 'Composite Superimposed Viewing'
  });

  const pdfBytes = doc.output('arraybuffer');
  assert.ok(pdfBytes.byteLength > 2000, `Expected PDF buffer length > 2000 bytes, got ${pdfBytes.byteLength}`);
});

test('GeRadiographicExposureTimeApp exports PDF report and displays confirmation banner', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Export PDF button should be present in top bar
  const exportBtn = ui.getByTestId('ge-export-pdf-report-btn');
  assert.ok(exportBtn);
  assert.ok(ui.getByText(/Export PDF Report/i));

  // Click Export PDF button
  fireEvent.click(exportBtn);

  // Success banner should appear
  const successBanner = ui.getByTestId('ge-pdf-success-banner');
  assert.ok(successBanner);
  assert.ok(ui.getByText(/PDF Report successfully exported/i));
});

test('GeRadiographicExposureTimeApp Technique Sheet modal triggers PDF export successfully', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="ar" />);

  // Open Technique Sheet modal
  const openModalBtn = ui.getByTestId('ge-technique-sheet-btn');
  fireEvent.click(openModalBtn);

  // Modal export button should be visible
  const modalExportBtn = ui.getByTestId('ge-modal-export-pdf-btn');
  assert.ok(modalExportBtn);

  // Click modal export button
  fireEvent.click(modalExportBtn);

  // Success banner should be active
  assert.ok(ui.getByTestId('ge-pdf-success-banner'));
  assert.ok(ui.getByText(/تم تصدير تقرير PDF بنجاح/i));
});

test('InteractiveWorkshops provides direct switch to GE Exposure Time section', () => {
  const ui = render(<InteractiveWorkshops language="en" />);

  // Should have the switch-ge-exposure-time button
  const geSwitchBtn = ui.getByTestId('switch-ge-exposure-time');
  assert.ok(geSwitchBtn);

  // Click to switch
  fireEvent.click(geSwitchBtn);

  // Should render GE Radiographic Exposure Time App
  assert.ok(ui.getByTestId('ge-exposure-calculator-app'));
  assert.ok(ui.getByTestId('ge-calculated-exposure-display'));
});

test('GeRadiographicExposureTimeApp allows toggling between Metric (mm/cm) and Imperial (in/ft) units and updates calculations', () => {
  // Clear any existing localStorage preference to test default metric state
  localStorage.removeItem('ge_app_unit_system');

  const ui = render(<GeRadiographicExposureTimeApp language="en" initialThicknessMm={12.0} initialSfdCm={70} />);

  // 1. Verify default Metric mode
  const metricToggle = ui.getByTestId('ge-unit-toggle-metric');
  const imperialToggle = ui.getByTestId('ge-unit-toggle-imperial');
  assert.ok(metricToggle);
  assert.ok(imperialToggle);

  const unitBadge = ui.getByTestId('ge-unit-mode-badge');
  assert.ok(unitBadge.textContent?.includes('Metric (mm/cm)'));

  // Initial exposure display in metric
  const initialExposureDisplay = ui.getByTestId('ge-calculated-exposure-display').textContent;
  assert.ok(initialExposureDisplay);

  // Initial thickness number input in metric should be 12 mm
  const metricNumberInput = ui.getByTestId('ge-thickness-number-input') as HTMLInputElement;
  assert.equal(metricNumberInput.value, '12');

  // 2. Toggle to Imperial (in/ft)
  fireEvent.click(imperialToggle);

  // Badge should now state Imperial
  assert.ok(unitBadge.textContent?.includes('Imperial (in/ft)'));

  // Imperial inputs should be mounted
  const imperialThicknessInput = ui.getByTestId('ge-thickness-imperial-input') as HTMLInputElement;
  const imperialSfdInput = ui.getByTestId('ge-sfd-imperial-input') as HTMLInputElement;
  assert.ok(imperialThicknessInput);
  assert.ok(imperialSfdInput);

  // 12 mm / 25.4 = ~0.472 in
  assert.equal(imperialThicknessInput.value, '0.472');
  // 70 cm / 2.54 = ~27.6 in
  assert.equal(imperialSfdInput.value, '27.6');

  // Telemetry HUD should show inches
  const effectiveThicknessHud = ui.getByTestId('ge-effective-thickness');
  assert.ok(effectiveThicknessHud.textContent?.includes('in'));

  const ugHud = ui.getByTestId('ge-ug-metric');
  assert.ok(ugHud.textContent?.includes('in'));

  // 3. Update thickness via Imperial input to 1.0 inch (25.4 mm)
  fireEvent.change(imperialThicknessInput, { target: { value: '1.0' } });

  // Calculation should update automatically — 1 inch steel requires significantly longer exposure than 0.472 inch!
  const updatedExposureDisplay = ui.getByTestId('ge-calculated-exposure-display').textContent;
  assert.notEqual(updatedExposureDisplay, initialExposureDisplay, 'Calculated exposure must automatically update when imperial thickness changes');

  // 4. Update SFD via Imperial input to 36 inches
  const expBeforeSfd = ui.getByTestId('ge-calculated-exposure-display').textContent;
  fireEvent.change(imperialSfdInput, { target: { value: '36' } });

  const expAfterSfd = ui.getByTestId('ge-calculated-exposure-display').textContent;
  assert.notEqual(expAfterSfd, expBeforeSfd, 'Calculated exposure must update automatically by Inverse Square Law when imperial SFD changes');

  // 5. Toggle back to Metric (mm/cm)
  fireEvent.click(metricToggle);
  assert.ok(unitBadge.textContent?.includes('Metric (mm/cm)'));

  // The metric thickness input should now reflect 25.4 mm (1.0 inch)
  const restoredMetricInput = ui.getByTestId('ge-thickness-number-input') as HTMLInputElement;
  assert.equal(restoredMetricInput.value, '25.4');

  // The metric SFD input should now reflect ~91 cm (36 inches * 2.54)
  const restoredSfdInput = ui.getByTestId('ge-sfd-number-input') as HTMLInputElement;
  assert.equal(restoredSfdInput.value, '91');
});

test('ArCompleteRtCodeSimulator provides companion button to open GE Exposure Time app modal', () => {
  const ui = render(<ArCompleteRtCodeSimulator language="en" />);

  // GE Exposure Time Companion Button
  const companionBtn = ui.getByTestId('ar-open-ge-exposure-btn');
  assert.ok(companionBtn);

  // Click to open modal
  fireEvent.click(companionBtn);

  // Modal should display GE Radiographic Exposure Time App
  assert.ok(ui.getByTestId('ge-exposure-calculator-app'));
  assert.ok(ui.getByTestId('ge-calculated-exposure-display'));
});

test('GeRadiographicExposureTimeApp renders dynamic unit conversion tooltips next to thickness and distance labels', () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" initialThicknessMm={12.0} initialSfdCm={70} />);

  // 1. In Metric mode, tooltips show mm -> in and cm -> in/ft conversion formulas with live values
  const thicknessTooltipBtn = ui.getByTestId('ge-tooltip-thickness');
  const reinforcementTooltipBtn = ui.getByTestId('ge-tooltip-reinforcement');
  const sfdTooltipBtn = ui.getByTestId('ge-tooltip-sfd');
  const pipeOdTooltipBtn = ui.getByTestId('ge-tooltip-pipe-od');

  assert.ok(thicknessTooltipBtn.getAttribute('title')?.includes('1 mm = 0.0394 in'));
  assert.ok(thicknessTooltipBtn.getAttribute('title')?.includes('1 inch = 25.4 mm'));
  assert.ok(thicknessTooltipBtn.getAttribute('title')?.includes('12 mm = 0.472 in'));
  assert.ok(reinforcementTooltipBtn.getAttribute('title')?.includes('1 inch = 25.4 mm'));
  assert.ok(sfdTooltipBtn.getAttribute('title')?.includes('1 cm = 0.3937 in'));
  assert.ok(sfdTooltipBtn.getAttribute('title')?.includes('1 inch = 2.54 cm'));
  assert.ok(pipeOdTooltipBtn.getAttribute('title')?.includes('1 inch = 25.4 mm'));

  // Popover tooltip content is also rendered and updates when clicked
  fireEvent.click(thicknessTooltipBtn);
  assert.equal(thicknessTooltipBtn.getAttribute('aria-expanded'), 'true');
  const thicknessPopover = ui.getByTestId('ge-tooltip-thickness-content');
  assert.ok(thicknessPopover.textContent?.includes('1 inch = 25.4 mm'));

  // 2. Toggle to Imperial mode and verify tooltips update dynamically
  fireEvent.click(ui.getByTestId('ge-unit-toggle-imperial'));

  assert.ok(thicknessTooltipBtn.getAttribute('title')?.includes('1 inch = 25.4 mm'));
  assert.ok(thicknessTooltipBtn.getAttribute('title')?.includes('0.472 in → 12.0 mm'));
  assert.ok(sfdTooltipBtn.getAttribute('title')?.includes('1 inch = 2.54 cm'));
  assert.ok(sfdTooltipBtn.getAttribute('title')?.includes('1 ft = 12 in = 30.48 cm'));
});

test('GeRadiographicExposureTimeApp records up to 5 conversions in the Conversion Log inside the unit toggler', async () => {
  localStorage.removeItem('ge_app_unit_system');
  localStorage.removeItem('ge_app_conversion_log');

  const ui = render(<GeRadiographicExposureTimeApp language="en" initialThicknessMm={12.0} initialSfdCm={70} />);

  const metricBtn = ui.getByTestId('ge-unit-toggle-metric');
  const imperialBtn = ui.getByTestId('ge-unit-toggle-imperial');
  const logToggleBtn = ui.getByTestId('ge-conversion-log-toggle');
  const logCountBadge = ui.getByTestId('ge-conversion-log-count');

  // 1. Initially 0 conversions logged
  assert.equal(logCountBadge.textContent, '0');
  fireEvent.click(logToggleBtn);
  assert.ok(ui.getByTestId('ge-conversion-log-panel'));
  assert.ok(ui.getByTestId('ge-conversion-log-empty'));

  // Close panel (waits for Framer Motion AnimatePresence slide-out transition)
  fireEvent.click(ui.getByTestId('ge-conversion-log-close-btn'));
  await waitFor(() => {
    assert.equal(ui.queryByTestId('ge-conversion-log-panel'), null);
  });

  // 2. Switch Metric -> Imperial (Conversion #1: 12 mm -> 0.472 in)
  fireEvent.click(imperialBtn);
  assert.equal(logCountBadge.textContent, '1');

  // Change wall thickness to 1.0 in (25.4 mm), then switch Imperial -> Metric (Conversion #2)
  const imperialThicknessInput = ui.getByTestId('ge-thickness-imperial-input') as HTMLInputElement;
  fireEvent.change(imperialThicknessInput, { target: { value: '1.0' } });
  fireEvent.click(metricBtn);
  assert.equal(logCountBadge.textContent, '2');

  // 3. Perform 4 more toggles (total 6 switches) to confirm max cap of 5 entries
  fireEvent.change(ui.getByTestId('ge-thickness-number-input'), { target: { value: '20' } });
  fireEvent.click(imperialBtn); // #3
  fireEvent.click(metricBtn);   // #4
  fireEvent.change(ui.getByTestId('ge-thickness-number-input'), { target: { value: '30' } });
  fireEvent.click(imperialBtn); // #5
  fireEvent.click(metricBtn);   // #6 (oldest #1 should roll off)

  assert.equal(logCountBadge.textContent, '5');

  // Open Conversion Log panel and inspect recorded rows
  fireEvent.click(logToggleBtn);
  const entry0 = ui.getByTestId('ge-conversion-log-entry-0');
  const entry4 = ui.getByTestId('ge-conversion-log-entry-4');
  assert.ok(entry0.textContent?.includes('30 mm'));
  assert.ok(entry0.textContent?.includes('in/ft'));
  assert.ok(entry4.textContent?.includes('25.4 mm'));
  assert.equal(ui.queryByTestId('ge-conversion-log-entry-5'), null, 'Log should retain only the last 5 conversions');

  // 4. Restore an earlier conversion (entry4: 25.4 mm / metric)
  fireEvent.click(ui.getByTestId('ge-conversion-log-restore-4'));
  await waitFor(() => {
    assert.equal(ui.queryByTestId('ge-conversion-log-panel'), null, 'Panel should close after applying snapshot');
  });
  const restoredThickness = ui.getByTestId('ge-thickness-number-input') as HTMLInputElement;
  assert.equal(restoredThickness.value, '25.4');

  // 5. Re-open and clear conversion history
  fireEvent.click(logToggleBtn);
  fireEvent.click(ui.getByTestId('ge-conversion-log-clear-btn'));
  assert.equal(logCountBadge.textContent, '0');
  assert.ok(ui.getByTestId('ge-conversion-log-empty'));
});

test('GeRadiographicExposureTimeApp applies dynamic Metric (sky) and Imperial (amber) visual color indicators to all input fields', () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Inputs across Column 1, 2, 3
  const sourceSelect = ui.getByTestId('ge-select-source-type');
  const curieInput = ui.getByTestId('ge-initial-curie-input');
  const calibDateInput = ui.getByTestId('ge-calib-date-input');
  const materialSelect = ui.getByTestId('ge-select-material');
  const techniqueSelect = ui.getByTestId('ge-select-technique');
  const thicknessSlider = ui.getByTestId('ge-thickness-slider');
  const sfdSlider = ui.getByTestId('ge-sfd-slider');
  const filmSelect = ui.getByTestId('ge-select-film');
  const densitySlider = ui.getByTestId('ge-density-slider');
  const leadScreensCheckbox = ui.getByTestId('ge-lead-screens-toggle');

  // Inline unit tags on dimensional inputs
  const tagThickness = ui.getByTestId('ge-unit-tag-thickness');
  const tagReinforcement = ui.getByTestId('ge-unit-tag-reinforcement');
  const tagSfd = ui.getByTestId('ge-unit-tag-sfd');
  const tagPipeOd = ui.getByTestId('ge-unit-tag-pipe-od');

  // 1. Metric Mode -> Sky visual styling + mm/cm tags
  for (const el of [sourceSelect, curieInput, calibDateInput, materialSelect, techniqueSelect, filmSelect]) {
    assert.equal(el.getAttribute('data-unit-mode'), 'metric');
    assert.ok(el.className.includes('border-sky-400'), `Expected sky border in metric mode on ${el.getAttribute('data-testid')}`);
  }
  for (const slider of [thicknessSlider, sfdSlider, densitySlider, leadScreensCheckbox]) {
    assert.ok(slider.className.includes('accent-sky-500'), `Expected sky accent in metric mode on ${slider.getAttribute('data-testid')}`);
  }
  assert.equal(tagThickness.textContent, 'mm');
  assert.equal(tagReinforcement.textContent, 'mm');
  assert.equal(tagSfd.textContent, 'cm');
  assert.equal(tagPipeOd.textContent, 'mm');
  assert.ok(tagThickness.className.includes('bg-sky-500/15'));
  assert.ok(tagSfd.className.includes('border-sky-500/40'));

  // 2. Switch to Imperial Mode -> Amber visual styling + in tags
  fireEvent.click(ui.getByTestId('ge-unit-toggle-imperial'));

  for (const el of [sourceSelect, curieInput, calibDateInput, materialSelect, techniqueSelect, filmSelect]) {
    assert.equal(el.getAttribute('data-unit-mode'), 'imperial');
    assert.ok(el.className.includes('border-amber-400'), `Expected amber border in imperial mode on ${el.getAttribute('data-testid')}`);
    assert.ok(!el.className.includes('border-sky-400'));
  }
  for (const slider of [thicknessSlider, sfdSlider, densitySlider, leadScreensCheckbox]) {
    assert.ok(slider.className.includes('accent-amber-500'), `Expected amber accent in imperial mode on ${slider.getAttribute('data-testid')}`);
    assert.ok(!slider.className.includes('accent-sky-500'));
  }
  assert.equal(tagThickness.textContent, 'in');
  assert.equal(tagReinforcement.textContent, 'in');
  assert.equal(tagSfd.textContent, 'in');
  assert.equal(tagPipeOd.textContent, 'in');
  assert.ok(tagThickness.className.includes('bg-amber-500/15'));
  assert.ok(tagSfd.className.includes('border-amber-500/40'));
});

test('GeRadiographicExposureTimeApp Reset All Inputs button restores all inputs and settings to defaults', () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const baselineExposure = ui.getByTestId('ge-calculated-exposure-display').textContent;

  // Modify multiple inputs and settings away from defaults
  fireEvent.click(ui.getByTestId('ge-unit-toggle-imperial'));
  fireEvent.change(ui.getByTestId('ge-select-source-type'), { target: { value: 'co60' } });
  fireEvent.change(ui.getByTestId('ge-select-material'), { target: { value: 'stainless_steel' } });
  fireEvent.change(ui.getByTestId('ge-select-technique'), { target: { value: 'swsi_plate' } });
  fireEvent.change(ui.getByTestId('ge-select-film'), { target: { value: 'd4' } });
  fireEvent.click(ui.getByTestId('ge-film-loading-mode-dual-composite'));
  fireEvent.change(ui.getByTestId('ge-thickness-imperial-input'), { target: { value: '2.0' } });
  fireEvent.change(ui.getByTestId('ge-sfd-imperial-input'), { target: { value: '40' } });
  fireEvent.click(ui.getByTestId('ge-lead-screens-toggle')); // false
  fireEvent.click(ui.getByTestId('ge-collimator-toggle')); // false

  assert.notEqual(ui.getByTestId('ge-calculated-exposure-display').textContent, baselineExposure);
  assert.ok(ui.getByTestId('ge-multi-film-badge'));

  // Click Reset All Inputs
  const resetBtn = ui.getByTestId('ge-reset-all-inputs-btn');
  fireEvent.click(resetBtn);

  // Visual confirmation label & restored default values
  assert.ok(resetBtn.textContent?.includes('Defaults Restored'));
  assert.equal((ui.getByTestId('ge-select-source-type') as HTMLSelectElement).value, 'ir192');
  assert.equal((ui.getByTestId('ge-select-material') as HTMLSelectElement).value, 'carbon_steel');
  assert.equal((ui.getByTestId('ge-select-technique') as HTMLSelectElement).value, 'dwsi_contact');
  assert.equal((ui.getByTestId('ge-select-film') as HTMLSelectElement).value, 'd7');
  assert.equal(ui.queryByTestId('ge-multi-film-badge'), null);
  assert.equal((ui.getByTestId('ge-thickness-number-input') as HTMLInputElement).value, '12');
  assert.equal((ui.getByTestId('ge-sfd-number-input') as HTMLInputElement).value, '70');
  assert.equal((ui.getByTestId('ge-lead-screens-toggle') as HTMLInputElement).checked, true);
  assert.equal((ui.getByTestId('ge-collimator-toggle') as HTMLInputElement).checked, true);
  assert.ok(ui.getByTestId('ge-unit-mode-badge').textContent?.includes('Metric (mm/cm)'));
  assert.equal(ui.getByTestId('ge-calculated-exposure-display').textContent, baselineExposure);
});

test('GeRadiographicExposureTimeApp renders Quick Units toggle switch directly above main inputs synchronized with #ge-unit-toggle-metric and #ge-unit-toggle-imperial', () => {
  localStorage.removeItem('ge_app_unit_system');
  localStorage.removeItem('ge_app_conversion_log');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Primary unit togglers expose exact CSS selector IDs
  const primaryMetric = ui.container.querySelector('#ge-unit-toggle-metric');
  const primaryImperial = ui.container.querySelector('#ge-unit-toggle-imperial');
  assert.ok(primaryMetric, 'Expected #ge-unit-toggle-metric ID in DOM');
  assert.ok(primaryImperial, 'Expected #ge-unit-toggle-imperial ID in DOM');

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  assert.ok(quickBar, 'Expected #ge-quick-units-bar ID in DOM');
  assert.equal(quickBar, ui.getByTestId('ge-quick-units-bar'));
  const quickSwitch = ui.getByTestId('ge-quick-units-switch');
  const quickCue = ui.getByTestId('ge-quick-units-active-cue');
  const quickPreview = ui.getByTestId('ge-quick-units-preview');

  // Verify DOM placement: Quick Units bar sits directly above main inputs grid
  const firstInput = ui.getByTestId('ge-select-source-type');
  assert.ok(
    quickBar.nextElementSibling?.contains(firstInput),
    'Expected Quick Units bar to be placed directly above the main inputs grid'
  );

  // Smooth CSS transition classes on #ge-quick-units-bar
  assert.ok(quickBar.className.includes('transition-all'));
  assert.ok(quickBar.className.includes('duration-500'));
  assert.ok(quickBar.className.includes('ease-in-out'));

  // Initial Metric visual cue, colors & preview
  assert.equal(quickBar.getAttribute('data-unit-mode'), 'metric');
  assert.ok(quickBar.className.includes('bg-sky-500/10'));
  assert.ok(quickBar.className.includes('border-sky-500/60'));
  assert.equal(quickSwitch.getAttribute('aria-checked'), 'false');
  assert.ok(quickCue.textContent?.includes('METRIC (mm / cm)'));
  assert.ok(quickCue.className.includes('bg-sky-500'));
  assert.ok(quickPreview.textContent?.includes('12.0 mm'));

  // Toggle to Imperial using the Quick Units switch -> smooth fade to amber theme
  fireEvent.click(quickSwitch);

  assert.equal(quickBar.getAttribute('data-unit-mode'), 'imperial');
  assert.ok(quickBar.className.includes('bg-amber-500/10'));
  assert.ok(quickBar.className.includes('border-amber-500/70'));
  assert.equal(quickSwitch.getAttribute('aria-checked'), 'true');
  assert.ok(quickCue.textContent?.includes('IMPERIAL (in / ft)'));
  assert.ok(quickCue.className.includes('bg-amber-500'));
  assert.ok(quickPreview.textContent?.includes('0.472"'));
  assert.ok(ui.getByTestId('ge-thickness-imperial-input'));
  assert.ok(primaryImperial.className.includes('bg-amber-500'));
  assert.equal(ui.getByTestId('ge-conversion-log-count').textContent, '1');

  // Toggle back to Metric using Quick Units metric button
  fireEvent.click(ui.getByTestId('ge-quick-units-metric'));
  assert.equal(quickBar.getAttribute('data-unit-mode'), 'metric');
  assert.equal(quickSwitch.getAttribute('aria-checked'), 'false');
  assert.ok(primaryMetric.className.includes('bg-sky-500'));
  assert.equal(ui.getByTestId('ge-conversion-log-count').textContent, '2');

  // Toggle to Imperial via primary #ge-unit-toggle-imperial stays synced on Quick Units bar
  fireEvent.click(primaryImperial);
  assert.equal(quickBar.getAttribute('data-unit-mode'), 'imperial');
  assert.equal(quickSwitch.getAttribute('aria-checked'), 'true');
  assert.equal(ui.getByTestId('ge-conversion-log-count').textContent, '3');
});

test('GeRadiographicExposureTimeApp #ge-quick-units-bar includes a dropdown menu to view and re-apply the last 5 unit conversions', () => {
  localStorage.removeItem('ge_app_unit_system');
  localStorage.removeItem('ge_app_conversion_log');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  assert.ok(quickBar);

  const historyToggle = ui.getByTestId('ge-quick-units-history-toggle');
  assert.ok(quickBar.contains(historyToggle), 'Expected history toggle inside #ge-quick-units-bar');
  assert.equal(ui.getByTestId('ge-quick-units-history-count').textContent, '0');

  // Empty state before any conversions
  fireEvent.click(historyToggle);
  assert.ok(ui.getByTestId('ge-quick-units-history-menu'));
  assert.ok(ui.getByTestId('ge-quick-units-history-empty'));
  fireEvent.click(ui.getByTestId('ge-quick-units-history-close'));
  assert.equal(ui.queryByTestId('ge-quick-units-history-menu'), null);

  // Perform 6 conversions with distinct wall thicknesses so only the last 5 remain
  const quickSwitch = ui.getByTestId('ge-quick-units-switch');
  const thicknessValuesMm = ['10', '16', '22', '28', '34', '40'];
  for (let i = 0; i < thicknessValuesMm.length; i++) {
    if (i % 2 === 0) {
      fireEvent.change(ui.getByTestId('ge-thickness-number-input'), { target: { value: thicknessValuesMm[i] } });
    } else {
      const inchesVal = (Number(thicknessValuesMm[i]) / 25.4).toFixed(3);
      fireEvent.change(ui.getByTestId('ge-thickness-imperial-input'), { target: { value: inchesVal } });
    }
    fireEvent.click(quickSwitch);
  }

  assert.equal(ui.getByTestId('ge-quick-units-history-count').textContent, '5');

  // Open Quick Units history menu and verify max 5 items (most recent first)
  fireEvent.click(historyToggle);
  const menu = ui.getByTestId('ge-quick-units-history-menu');
  assert.ok(quickBar.contains(menu));
  assert.ok(ui.getByTestId('ge-quick-units-history-item-0').textContent?.includes('40 mm'));
  assert.ok(ui.getByTestId('ge-quick-units-history-item-4').textContent?.includes('16 mm'));
  assert.equal(ui.queryByTestId('ge-quick-units-history-item-5'), null);

  // Re-apply item #3 (22 mm -> imperial) and confirm inputs + unit mode restore and menu closes
  fireEvent.click(ui.getByTestId('ge-quick-units-history-apply-3'));
  assert.equal(ui.queryByTestId('ge-quick-units-history-menu'), null);
  assert.equal(quickBar.getAttribute('data-unit-mode'), 'imperial');
  assert.ok(ui.getByTestId('ge-quick-units-preview').textContent?.includes('0.866"'));

  // Re-open menu and re-apply item #4 (16 mm -> metric)
  fireEvent.click(historyToggle);
  fireEvent.click(ui.getByTestId('ge-quick-units-history-apply-4'));
  assert.equal(ui.queryByTestId('ge-quick-units-history-menu'), null);
  assert.equal(quickBar.getAttribute('data-unit-mode'), 'metric');
  assert.ok(ui.getByTestId('ge-quick-units-preview').textContent?.includes('16.0 mm'));

  // Re-open menu and clear conversion history
  fireEvent.click(historyToggle);
  fireEvent.click(ui.getByTestId('ge-quick-units-history-clear'));
  assert.equal(ui.getByTestId('ge-quick-units-history-count').textContent, '0');
  assert.ok(ui.getByTestId('ge-quick-units-history-empty'));
});

test('GeRadiographicExposureTimeApp #ge-quick-units-bar Reset Units Only resets only thickness and distance inputs without full app reset', () => {
  localStorage.removeItem('ge_app_unit_system');
  localStorage.removeItem('ge_app_conversion_log');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  const resetUnitsBtn = ui.getByTestId('ge-quick-units-reset-only-btn');
  assert.ok(quickBar.contains(resetUnitsBtn), 'Expected Reset Units Only button inside #ge-quick-units-bar');
  assert.ok(resetUnitsBtn.textContent?.includes('Reset Units Only'));

  // Modify non-unit inputs
  fireEvent.change(ui.getByTestId('ge-select-source-type'), { target: { value: 'co60' } });
  fireEvent.change(ui.getByTestId('ge-select-material'), { target: { value: 'stainless_steel' } });
  fireEvent.change(ui.getByTestId('ge-select-film'), { target: { value: 'd4' } });
  fireEvent.click(ui.getByTestId('ge-lead-screens-toggle')); // false

  // Switch to Imperial (saved as last unit system in localStorage) and modify thickness & SFD
  fireEvent.click(ui.getByTestId('ge-quick-units-imperial'));
  fireEvent.change(ui.getByTestId('ge-thickness-imperial-input'), { target: { value: '2.0' } });
  fireEvent.change(ui.getByTestId('ge-sfd-imperial-input'), { target: { value: '40' } });
  assert.ok(ui.getByTestId('ge-quick-units-preview').textContent?.includes('2"'));

  // Click Reset Units Only
  fireEvent.click(resetUnitsBtn);

  // Visual confirmation & dimensional inputs restored to defaults (12 mm = 0.472", 70 cm = 27.6")
  assert.ok(resetUnitsBtn.textContent?.includes('Units Reset'));
  assert.equal(quickBar.getAttribute('data-unit-mode'), 'imperial'); // respects last saved unit system
  assert.equal((ui.getByTestId('ge-thickness-imperial-input') as HTMLInputElement).value, '0.472');
  assert.equal((ui.getByTestId('ge-sfd-imperial-input') as HTMLInputElement).value, '27.6');

  // Non-unit settings remain untouched (NOT a full app reset)
  assert.equal((ui.getByTestId('ge-select-source-type') as HTMLSelectElement).value, 'co60');
  assert.equal((ui.getByTestId('ge-select-material') as HTMLSelectElement).value, 'stainless_steel');
  assert.equal((ui.getByTestId('ge-select-film') as HTMLSelectElement).value, 'd4');
  assert.equal((ui.getByTestId('ge-lead-screens-toggle') as HTMLInputElement).checked, false);
});

test('GeRadiographicExposureTimeApp #ge-quick-units-bar exports the current conversion log as a valid CSV file', async () => {
  localStorage.removeItem('ge_app_unit_system');
  localStorage.removeItem('ge_app_conversion_log');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  const exportCsvBtn = ui.getByTestId('ge-quick-units-export-csv-btn') as HTMLButtonElement;
  assert.ok(quickBar.contains(exportCsvBtn), 'Expected Export CSV button inside #ge-quick-units-bar');

  // Disabled before any conversions are logged
  assert.equal(exportCsvBtn.disabled, true);

  // Record 2 conversions with distinct thickness values
  fireEvent.change(ui.getByTestId('ge-thickness-number-input'), { target: { value: '18' } });
  fireEvent.click(ui.getByTestId('ge-quick-units-switch')); // metric -> imperial
  fireEvent.click(ui.getByTestId('ge-quick-units-switch')); // imperial -> metric

  assert.equal(exportCsvBtn.disabled, false);

  // Intercept Blob & createObjectURL to inspect exported CSV content and download filename
  let capturedBlob: Blob | null = null;
  let downloadedFilename: string | null = null;
  const origCreateObjectURL = globalThis.URL.createObjectURL;
  const origCreateElement = document.createElement.bind(document);

  globalThis.URL.createObjectURL = ((obj: Blob) => {
    capturedBlob = obj;
    return 'blob:mock-csv-url';
  }) as any;

  (document as any).createElement = (tagName: string, options?: any) => {
    const el = origCreateElement(tagName, options);
    if (tagName.toLowerCase() === 'a') {
      const origSetAttr = el.setAttribute.bind(el);
      el.setAttribute = (name: string, value: string) => {
        if (name === 'download') {
          downloadedFilename = value;
        }
        return origSetAttr(name, value);
      };
      el.click = () => {};
    }
    return el;
  };

  try {
    fireEvent.click(exportCsvBtn);

    assert.ok(exportCsvBtn.textContent?.includes('CSV Exported'));
    assert.ok(downloadedFilename?.startsWith('ge-conversion-log-') && downloadedFilename?.endsWith('.csv'));
    assert.ok(capturedBlob, 'Expected a Blob to be created for CSV download');

    const csvText = await (capturedBlob as Blob).text();
    const lines = csvText.trim().split('\n');
    assert.equal(lines.length, 3); // header + 2 conversion rows
    assert.ok(lines[0].startsWith('Timestamp,From Unit,To Unit,Thickness (mm),Thickness (in),SFD (cm)'));
    assert.ok(csvText.includes('18'));
    assert.ok(csvText.includes('imperial,metric'));
    assert.ok(csvText.includes('metric,imperial'));
  } finally {
    globalThis.URL.createObjectURL = origCreateObjectURL;
    (document as any).createElement = origCreateElement;
  }

  // Also verify direct CSV escaping helper for commas/quotes
  const escapedCsv = buildConversionLogCsv([
    {
      id: '1',
      timestamp: '10:00:00 AM',
      fromUnit: 'metric',
      toUnit: 'imperial',
      thicknessMm: 12,
      thicknessInches: 0.472,
      sfdCm: 70,
      sfdInches: 27.6,
      sfdFeet: 2.3,
      sourceType: 'ir192',
      sourceLabel: 'Ir-192, "High"',
      calculatedTotalSeconds: 120,
      formattedDuration: '2m 00s'
    }
  ]);
  assert.ok(escapedCsv.includes('"Ir-192, ""High"""'));
});

test('GeRadiographicExposureTimeApp #ge-quick-units-bar renders interactive info tooltips explaining Thickness and SFD conversion math', () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  const tTooltipBtn = ui.getByTestId('ge-quick-units-tooltip-thickness');
  const tTooltipContent = ui.getByTestId('ge-quick-units-tooltip-thickness-content');
  const sfdTooltipBtn = ui.getByTestId('ge-quick-units-tooltip-sfd');
  const sfdTooltipContent = ui.getByTestId('ge-quick-units-tooltip-sfd-content');

  assert.ok(quickBar.contains(tTooltipBtn), 'Expected Thickness info tooltip inside #ge-quick-units-bar');
  assert.ok(quickBar.contains(sfdTooltipBtn), 'Expected SFD info tooltip inside #ge-quick-units-bar');

  // Metric mode math explanations
  assert.ok(tTooltipContent.textContent?.includes('1 in = 25.4 mm'));
  assert.ok(tTooltipContent.textContent?.includes('12.0 mm ÷ 25.4 = 0.472 in'));
  assert.ok(sfdTooltipContent.textContent?.includes('1 in = 2.54 cm'));
  assert.ok(sfdTooltipContent.textContent?.includes('70 cm ÷ 2.54 = 27.6 in (2.3 ft)'));

  // Interactive click toggle pins/unpins tooltip
  assert.equal(tTooltipBtn.getAttribute('aria-expanded'), 'false');
  fireEvent.click(tTooltipBtn);
  assert.equal(tTooltipBtn.getAttribute('aria-expanded'), 'true');
  assert.ok(tTooltipContent.className.includes('opacity-100'));
  fireEvent.click(tTooltipBtn);
  assert.equal(tTooltipBtn.getAttribute('aria-expanded'), 'false');

  // Switch to Imperial mode -> tooltip math dynamically updates to multiplication formulas
  fireEvent.click(ui.getByTestId('ge-quick-units-switch'));
  assert.ok(tTooltipContent.textContent?.includes('0.472 in × 25.4 = 12.0 mm'));
  assert.ok(sfdTooltipContent.textContent?.includes('27.6 in × 2.54 = 70 cm'));
});

test('getUnitConversionFormula dynamically returns unit-system-specific conversion formulas for Thickness and SFD', () => {
  const metricThicknessEn = getUnitConversionFormula({
    kind: 'quick_thickness',
    unitSystem: 'metric',
    isAr: false,
    metricValue: 25.4,
    imperialValue: 1
  });
  assert.ok(metricThicknessEn.includes('1 in = 25.4 mm'));
  assert.ok(metricThicknessEn.includes('25.4 mm ÷ 25.4 = 1 in'));

  const imperialThicknessEn = getUnitConversionFormula({
    kind: 'quick_thickness',
    unitSystem: 'imperial',
    isAr: false,
    metricValue: 25.4,
    imperialValue: 1
  });
  assert.ok(imperialThicknessEn.includes('1 in = 25.4 mm'));
  assert.ok(imperialThicknessEn.includes('1 in × 25.4 = 25.4 mm'));

  const imperialSfdAr = getUnitConversionFormula({
    kind: 'quick_sfd',
    unitSystem: 'imperial',
    isAr: true,
    metricValue: 70,
    imperialValue: 27.6,
    secondaryImperialValue: 2.3
  });
  assert.ok(imperialSfdAr.includes('1 بوصة = 2.54 سم'));
  assert.ok(imperialSfdAr.includes('27.6 بوصة × 2.54 = 70 سم'));
});

test('GeRadiographicExposureTimeApp #ge-quick-units-bar renders D3 sparkline visualizing conversion frequency over last 5 entries', () => {
  localStorage.removeItem('ge_app_unit_system');
  localStorage.removeItem('ge_app_conversion_log');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  const sparkline = ui.getByTestId('ge-quick-units-sparkline');
  const sparklineSvg = ui.getByTestId('ge-quick-units-sparkline-svg');
  const sparklineSummary = ui.getByTestId('ge-quick-units-sparkline-summary');
  const sparklineUsage = ui.getByTestId('ge-quick-units-sparkline-usage');
  const quickSwitch = ui.getByTestId('ge-quick-units-switch');

  assert.ok(quickBar.contains(sparkline), 'Expected D3 sparkline container inside #ge-quick-units-bar');
  assert.ok(quickBar.contains(sparklineSvg), 'Expected D3 sparkline SVG inside #ge-quick-units-bar');
  assert.equal(sparklineSummary.textContent, 'M:0/I:0');
  assert.equal(sparklineUsage.textContent, '0% Metric/0% Imperial');
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-point-0'), null);
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-path'), null);

  // 1st toggle: metric -> imperial
  fireEvent.click(quickSwitch);
  assert.equal(sparklineSummary.textContent, 'M:0/I:1');
  assert.equal(sparklineUsage.textContent, '0% Metric/100% Imperial');
  const firstPoint = ui.getByTestId('ge-quick-units-sparkline-point-0');
  assert.equal(firstPoint.getAttribute('fill'), '#f59e0b');

  // Toggle 4 more times (total 5 entries: M->I, I->M, M->I, I->M, M->I => M:2 / I:3)
  for (let i = 0; i < 4; i++) {
    fireEvent.click(quickSwitch);
  }
  assert.equal(sparklineSummary.textContent, 'M:2/I:3');
  assert.equal(sparklineUsage.textContent, '40% Metric/60% Imperial');
  const trendPath = ui.getByTestId('ge-quick-units-sparkline-path');
  assert.ok(trendPath.getAttribute('d')?.startsWith('M'), 'Expected valid SVG path string generated by D3');
  assert.ok(ui.getByTestId('ge-quick-units-sparkline-point-4'));
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-point-5'), null);

  // 6th toggle: I->M drops oldest M->I, leaving M:3 / I:2 over last 5 entries
  fireEvent.click(quickSwitch);
  assert.equal(sparklineSummary.textContent, 'M:3/I:2');
  assert.equal(sparklineUsage.textContent, '60% Metric/40% Imperial');
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-point-5'), null);

  // Clearing conversion log resets sparkline counts, percentages & points
  fireEvent.click(ui.getByTestId('ge-quick-units-history-toggle'));
  fireEvent.click(ui.getByTestId('ge-quick-units-history-clear'));
  assert.equal(sparklineSummary.textContent, 'M:0/I:0');
  assert.equal(sparklineUsage.textContent, '0% Metric/0% Imperial');
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-point-0'), null);
});

test('GeRadiographicExposureTimeApp #ge-quick-units-bar Copy to Clipboard button copies formatted Thickness and SFD values', async () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  const activeCue = ui.getByTestId('ge-quick-units-active-cue');
  const copyBtn = ui.getByTestId('ge-quick-units-copy-btn');

  assert.ok(quickBar.contains(copyBtn), 'Expected Copy button inside #ge-quick-units-bar');
  assert.equal(activeCue.nextElementSibling, copyBtn, 'Expected Copy button right next to active unit indicator');

  const copiedStrings: string[] = [];
  const origDescriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'clipboard');
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copiedStrings.push(text);
      }
    }
  });

  try {
    // 1. Copy in Metric mode
    fireEvent.click(copyBtn);
    await waitFor(() => {
      assert.equal(copiedStrings[0], 'Thickness (t): 12.0 mm · SFD: 70 cm');
      assert.ok(copyBtn.textContent?.includes('Copied'));
    });

    // 2. Switch to Imperial mode and copy updated formatted values
    fireEvent.click(ui.getByTestId('ge-quick-units-switch'));
    fireEvent.click(copyBtn);
    await waitFor(() => {
      assert.equal(copiedStrings[1], 'Thickness (t): 0.472" · SFD: 27.6" (2.3 ft)');
    });
  } finally {
    if (origDescriptor) {
      Object.defineProperty(globalThis.navigator, 'clipboard', origDescriptor);
    } else {
      delete (globalThis.navigator as any).clipboard;
    }
  }
});

test('GeRadiographicExposureTimeApp #ge-quick-units-bar emphasizes unit system changes with smooth transition ring and scale pulse', async () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  const activeCue = ui.getByTestId('ge-quick-units-active-cue');
  const quickSwitch = ui.getByTestId('ge-quick-units-switch');

  // Resting state on initial mount
  assert.equal(quickBar.getAttribute('data-unit-transitioning'), 'false');
  assert.ok(quickBar.className.includes('scale-100'));
  assert.ok(activeCue.className.includes('scale-100'));

  // Toggle to Imperial -> active amber ring & scale pulse
  fireEvent.click(quickSwitch);
  assert.equal(quickBar.getAttribute('data-unit-transitioning'), 'true');
  assert.ok(quickBar.className.includes('ring-4'));
  assert.ok(quickBar.className.includes('ring-amber-400/50'));
  assert.ok(quickBar.className.includes('scale-[1.01]'));
  assert.ok(activeCue.className.includes('scale-105'));

  // Toggle back to Metric -> active sky ring & scale pulse
  fireEvent.click(quickSwitch);
  assert.equal(quickBar.getAttribute('data-unit-transitioning'), 'true');
  assert.ok(quickBar.className.includes('ring-sky-400/45'));

  // Settles cleanly back to resting state after animation completes
  await waitFor(
    () => {
      assert.equal(quickBar.getAttribute('data-unit-transitioning'), 'false');
      assert.ok(quickBar.className.includes('scale-100'));
    },
    { timeout: 1000 }
  );
});

test('GeRadiographicExposureTimeApp initializes unitSystem from localStorage and persists changes via useEffect', () => {
  // 1. Pre-populated 'imperial' in localStorage is read as initial state
  localStorage.setItem('ge_app_unit_system', 'imperial');
  const firstMount = render(<GeRadiographicExposureTimeApp language="en" />);
  assert.equal(
    firstMount.container.querySelector('#ge-quick-units-bar')?.getAttribute('data-unit-mode'),
    'imperial'
  );
  assert.ok(firstMount.getByTestId('ge-thickness-imperial-input'));

  // 2. Switching to Metric persists 'metric' to localStorage automatically
  fireEvent.click(firstMount.getByTestId('ge-quick-units-metric'));
  assert.equal(localStorage.getItem('ge_app_unit_system'), 'metric');

  // 3. Switching back to Imperial persists 'imperial' and survives remount
  fireEvent.click(firstMount.getByTestId('ge-unit-toggle-imperial'));
  assert.equal(localStorage.getItem('ge_app_unit_system'), 'imperial');
  firstMount.unmount();

  const secondMount = render(<GeRadiographicExposureTimeApp language="en" />);
  assert.equal(
    secondMount.container.querySelector('#ge-quick-units-bar')?.getAttribute('data-unit-mode'),
    'imperial'
  );
  secondMount.unmount();

  // 4. Invalid stored value falls back safely to 'metric' and syncs localStorage
  localStorage.setItem('ge_app_unit_system', 'invalid-unit');
  const fallbackMount = render(<GeRadiographicExposureTimeApp language="en" />);
  assert.equal(
    fallbackMount.container.querySelector('#ge-quick-units-bar')?.getAttribute('data-unit-mode'),
    'metric'
  );
  assert.equal(localStorage.getItem('ge_app_unit_system'), 'metric');
});

test('GeRadiographicExposureTimeApp renders interactive D3 isotope decay curve with vertical shot-date line across isotopes', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const card = ui.getByTestId('isotope-decay-curve-card');
  const svg = ui.getByTestId('isotope-decay-svg');
  const curvePath = ui.getByTestId('isotope-decay-path');
  const shotLine = ui.getByTestId('isotope-decay-shot-line');
  const shotLabel = ui.getByTestId('isotope-decay-shot-label');

  assert.ok(card);
  assert.ok(svg);
  const initialD = curvePath.getAttribute('d') || '';
  assert.ok(initialD.startsWith('M') && !initialD.includes('NaN'), `Valid SVG path expected, got: ${initialD.slice(0, 40)}`);

  // Shot marker line must be strictly vertical (x1 === x2) and have finite coordinates
  const initialX1 = Number(shotLine.getAttribute('x1'));
  const initialX2 = Number(shotLine.getAttribute('x2'));
  assert.equal(initialX1, initialX2);
  assert.ok(Number.isFinite(initialX1) && initialX1 > 0);
  assert.ok((shotLabel.textContent || '').includes('2026-11-05'));

  // Half-life milestone marker 1 T1/2 should appear in 3xT1/2 default horizon
  assert.ok(ui.getByTestId('isotope-decay-halflife-1'));
  assert.ok(ui.getByTestId('isotope-decay-halflife-2'));

  // Switching isotope to Se-75 (half-life 119.78d) changes curve geometry and vertical shot position
  const sourceSelect = ui.getByTestId('ge-select-source-type');
  fireEvent.change(sourceSelect, { target: { value: 'se75' } });
  const sePath = ui.getByTestId('isotope-decay-path').getAttribute('d') || '';
  const seShotX = Number(ui.getByTestId('isotope-decay-shot-line').getAttribute('x1'));
  assert.notEqual(sePath, initialD);
  assert.notEqual(seShotX, initialX1);
  assert.ok((ui.getByTestId('isotope-decay-curve-card').textContent || '').includes('119.78d'));

  // Toggle isotope comparison curves on and verify Co-60 / Ir-192 overlays render
  fireEvent.click(ui.getByTestId('isotope-decay-compare-btn'));
  assert.ok(ui.getByTestId('isotope-decay-compare-ir192'));
  assert.ok(ui.getByTestId('isotope-decay-compare-co60'));
  assert.ok(ui.getByTestId('isotope-decay-compare-yb169'));

  // Switch to X-Ray tube -> flat constant output with zero NaN coordinates
  fireEvent.change(sourceSelect, { target: { value: 'xray_dir' } });
  const xrayPath = ui.getByTestId('isotope-decay-path').getAttribute('d') || '';
  assert.ok(xrayPath.startsWith('M') && !xrayPath.includes('NaN'));
  assert.ok((ui.getByTestId('isotope-decay-curve-card').textContent || '').includes('Non-decaying'));
});

test('IsotopeDecayCurveChart supports hover crosshair, horizon toggle, and clicking/scrubbing to move shot date', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const shotLine = ui.getByTestId('isotope-decay-shot-line');
  const shotInput = ui.getByTestId('ge-shot-date-input') as HTMLInputElement;
  const initialShotDate = shotInput.value;
  const initialShotX = Number(shotLine.getAttribute('x1'));

  // Hovering over plot reveals crosshair vertical line and telemetry readout
  const interactionLayer = ui.getByTestId('isotope-decay-interaction-layer');
  fireEvent.mouseMove(interactionLayer, { clientX: 350, clientY: 120 });
  assert.ok(ui.getByTestId('isotope-decay-hover-line'));
  const hoverReadout = ui.getByTestId('isotope-decay-hover-readout').textContent || '';
  assert.ok(hoverReadout.includes('Ci') && hoverReadout.includes('%'));

  fireEvent.mouseLeave(interactionLayer);
  assert.equal(ui.queryByTestId('isotope-decay-hover-line'), null);

  // Clicking on the curve updates measurementDate & recalculates live activity badge
  fireEvent.click(interactionLayer, { clientX: 420, clientY: 120 });
  const clickedShotDate = (ui.getByTestId('ge-shot-date-input') as HTMLInputElement).value;
  assert.notEqual(clickedShotDate, initialShotDate);
  const clickedShotX = Number(ui.getByTestId('isotope-decay-shot-line').getAttribute('x1'));
  assert.notEqual(clickedShotX, initialShotX);

  // Jumping to 1xT1/2 (~74 days after 2026-10-06 -> ~50% of 45 Ci = ~22.5 Ci)
  fireEvent.click(ui.getByTestId('isotope-decay-jump-half1'));
  const liveBadgeText = ui.getByTestId('ge-live-curie-badge').textContent || '';
  const liveCi = parseFloat(liveBadgeText);
  assert.ok(liveCi >= 22 && liveCi <= 23, `Expected ~22.5 Ci at 1xT1/2, got ${liveBadgeText}`);

  // Switching horizon to 5xT1/2 adjusts domain and keeps vertical line inside plot
  fireEvent.click(ui.getByTestId('isotope-decay-horizon-5'));
  const horizon5X = Number(ui.getByTestId('isotope-decay-shot-line').getAttribute('x1'));
  assert.ok(horizon5X > 58 && horizon5X < 704, `Shot line x=${horizon5X} must remain inside plot`);
});

test('computeBeamDecayProfile accurately models Beer-Lambert attenuation, HVL markers, and pipe bore plateaus', () => {
  // 1. Default Double-Wall (dwsi_contact), 12mm Carbon Steel + 2.5mm weld cap, Ir-192 (HVL = 12.7mm)
  const dwsiProfile = computeBeamDecayProfile({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    technique: 'dwsi_contact',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5
  });

  assert.equal(dwsiProfile.wallsPenetrated, 2);
  assert.equal(dwsiProfile.effectiveSteelThicknessMm, 26.5);
  assert.equal(dwsiProfile.totalHvlCount, 2.09);
  const expectedExitPct = Number((100 * Math.pow(0.5, 26.5 / 12.7)).toFixed(2));
  assert.equal(dwsiProfile.exitIntensityPct, expectedExitPct);
  assert.equal(dwsiProfile.hvlMarkers.length, 2);
  assert.equal(dwsiProfile.hvlMarkers[0].intensityPct, 50);
  assert.equal(dwsiProfile.hvlMarkers[1].intensityPct, 25);

  // Air-filled pipe bore segment must produce zero attenuation plateau
  const cavitySeg = dwsiProfile.wallSegments.find((s) => s.id === 'cavity');
  assert.ok(cavitySeg, 'Expected internal pipe bore cavity segment for 2-wall technique');
  assert.equal(cavitySeg.entryIntensityPct, cavitySeg.exitIntensityPct);
  const midCavity = interpolateBeamDecayAtNorm(dwsiProfile, (cavitySeg.startNorm + cavitySeg.endNorm) / 2);
  assert.equal(midCavity.inCavity, true);
  assert.equal(midCavity.intensityPct, cavitySeg.entryIntensityPct);

  // 2. Single-Wall (swsi_plate) has no cavity and substantially higher exit intensity
  const swsiProfile = computeBeamDecayProfile({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    technique: 'swsi_plate',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5
  });
  assert.equal(swsiProfile.wallsPenetrated, 1);
  assert.equal(swsiProfile.wallSegments.some((s) => s.id === 'cavity'), false);
  assert.ok(swsiProfile.exitIntensityPct > dwsiProfile.exitIntensityPct);

  // 3. Aluminum (low R-factor = 0.22 for Ir-192) transmits much more beam than Carbon Steel (R = 1.0)
  const aluProfile = computeBeamDecayProfile({
    sourceType: 'ir192',
    materialId: 'aluminum',
    technique: 'swsi_plate',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5
  });
  assert.equal(aluProfile.rFactor, 0.22);
  assert.ok(aluProfile.exitIntensityPct > swsiProfile.exitIntensityPct);

  // 4. Co-60 (HVL = 21.8mm) penetrates far better than Se-75 (HVL = 8.0mm)
  const coProfile = computeBeamDecayProfile({
    sourceType: 'co60',
    materialId: 'carbon_steel',
    technique: 'swsi_plate',
    materialThicknessMm: 20.0,
    weldReinforcementMm: 2.0
  });
  const seProfile = computeBeamDecayProfile({
    sourceType: 'se75',
    materialId: 'carbon_steel',
    technique: 'swsi_plate',
    materialThicknessMm: 20.0,
    weldReinforcementMm: 2.0
  });
  assert.ok(coProfile.exitIntensityPct > seProfile.exitIntensityPct);
  assert.ok(coProfile.muSteelPerMm < seProfile.muSteelPerMm);
});

test('GeRadiographicExposureTimeApp renders live beam intensity decay overlay on exposure path with reactive updates & depth scrub probe', async () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const overlayCard = ui.getByTestId('ge-beam-intensity-decay-overlay');
  const svg = ui.getByTestId('ge-beam-decay-svg');
  const curvePath = ui.getByTestId('ge-beam-decay-curve-path');
  const muLabel = ui.getByTestId('ge-beam-decay-mu');
  const exitPctLabel = ui.getByTestId('ge-beam-decay-exit-pct');
  const probeHud = ui.getByTestId('ge-beam-decay-probe-hud');

  assert.ok(overlayCard);
  assert.ok(svg);
  assert.ok(ui.getByTestId('ge-beam-attenuation-cone'));
  assert.ok(ui.getByTestId('ge-beam-photon-stream'));
  assert.ok(ui.getByTestId('ge-beam-decay-exit-dot'));
  assert.ok(ui.getByTestId('ge-beam-collimator-jaws'));
  assert.ok(ui.getByTestId('ge-beam-segment-cavity'));
  assert.ok(ui.getByTestId('ge-beam-hvl-marker-1'));
  assert.ok(ui.getByTestId('ge-beam-hvl-marker-2'));

  const initialCurveD = curvePath.getAttribute('d') || '';
  assert.ok(initialCurveD.startsWith('M') && !initialCurveD.includes('NaN'));
  const initialExitText = exitPctLabel.textContent || '';
  const initialMuText = muLabel.textContent || '';

  // Switch technique to Single-Wall Plate -> cavity disappears, exit intensity rises, & curve morphs over 300ms
  fireEvent.change(ui.getByTestId('ge-select-technique'), { target: { value: 'swsi_plate' } });
  assert.equal(ui.queryByTestId('ge-beam-segment-cavity'), null);
  assert.notEqual(exitPctLabel.textContent, initialExitText);
  await waitFor(
    () => {
      assert.notEqual(ui.getByTestId('ge-beam-decay-curve-path').getAttribute('d'), initialCurveD);
    },
    { timeout: 1000 }
  );

  // Switch source to Se-75 -> linear attenuation coefficient μ changes
  fireEvent.change(ui.getByTestId('ge-select-source-type'), { target: { value: 'se75' } });
  assert.notEqual(muLabel.textContent, initialMuText);

  // Toggle collimator off -> jaws removed from SVG schematic
  fireEvent.click(ui.getByTestId('ge-collimator-toggle'));
  assert.equal(ui.queryByTestId('ge-beam-collimator-jaws'), null);

  // Scrub pointer along exposure path -> vertical crosshair appears & probe HUD activates
  const interactionLayer = ui.getByTestId('ge-beam-decay-interaction-layer');
  fireEvent.mouseMove(interactionLayer, { clientX: 394, clientY: 120 });
  assert.ok(ui.getByTestId('ge-beam-decay-hover-line'));
  assert.ok((probeHud.textContent || '').includes('Cursor Depth Probe:'));

  fireEvent.mouseLeave(interactionLayer);
  assert.equal(ui.queryByTestId('ge-beam-decay-hover-line'), null);
  assert.ok((probeHud.textContent || '').includes('Exit Plane Readout'));
});

test('GeRadiographicExposureTimeApp synchronizes CSS photon flow animation speed on SVG beam decay path with isotope intensity', () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const syncHud = ui.getByTestId('ge-beam-photon-sync-hud');
  const curveFlow = ui.getByTestId('ge-beam-decay-curve-flow');
  const specimenStream = ui.getByTestId('ge-beam-specimen-photon-stream');
  const firstPhoton = ui.getByTestId('ge-beam-photon-particle-0');

  assert.ok(curveFlow.classList.contains('rt-photon-curve-flow'));
  assert.ok(specimenStream.classList.contains('rt-photon-beam-flow'));
  assert.ok(firstPhoton.classList.contains('rt-photon-particle'));

  const getPhotonDuration = () => Number(syncHud.getAttribute('data-photon-duration'));
  const irDuration = getPhotonDuration();
  assert.ok(Number.isFinite(irDuration) && irDuration > 0);
  assert.equal(curveFlow.style.getPropertyValue('--rt-photon-duration'), `${irDuration}s`);
  assert.equal(firstPhoton.style.getPropertyValue('--rt-photon-duration'), `${irDuration}s`);

  // Switch to high-intensity Co-60 (Γ = 1.30) -> photon flow speeds up (shorter cycle duration)
  fireEvent.change(ui.getByTestId('ge-select-source-type'), { target: { value: 'co60' } });
  const coDuration = getPhotonDuration();
  assert.ok(coDuration < irDuration, `Expected Co-60 photon duration (${coDuration}s) < Ir-192 (${irDuration}s)`);

  // Switch to low-intensity Yb-169 (Γ = 0.125) -> photon flow slows down (longer cycle duration)
  fireEvent.change(ui.getByTestId('ge-select-source-type'), { target: { value: 'yb169' } });
  const ybDuration = getPhotonDuration();
  assert.ok(ybDuration > irDuration, `Expected Yb-169 photon duration (${ybDuration}s) > Ir-192 (${irDuration}s)`);
});

test('compute4dDecayShiftSnapshot accurately models half-life parameter shifts, exposure multipliers, and film underexposure', () => {
  const baseInput = {
    sourceType: 'ir192' as const,
    materialId: 'carbon_steel' as const,
    filmId: 'd7' as const,
    technique: 'dwsi_contact' as const,
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-10-06',
    measurementDate: '2026-10-06',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true
  };
  const beamProfile = computeBeamDecayProfile(baseInput);

  const snap0 = compute4dDecayShiftSnapshot(baseInput, beamProfile, 0);
  assert.equal(snap0.dayOffset, 0);
  assert.equal(snap0.decayPercentRemaining, 100);
  assert.equal(snap0.exposureTimeMultiplier, 1);
  assert.equal(snap0.uncompensatedDensityHd, 2.5);
  assert.equal(snap0.isUncompensatedUnderexposed, false);

  // At 1 half-life of Ir-192 (~74 days): ~50% Ci, ~2.0x exposure duration, uncompensated OD < 2.0 H&D, slower photons
  const oneHlDays = Math.round(GE_ISOTOPES.ir192.halfLifeDays);
  const snap1Hl = compute4dDecayShiftSnapshot(baseInput, beamProfile, oneHlDays);
  assert.ok(snap1Hl.decayPercentRemaining >= 49 && snap1Hl.decayPercentRemaining <= 51);
  assert.ok(snap1Hl.exposureTimeMultiplier >= 1.95 && snap1Hl.exposureTimeMultiplier <= 2.05);
  assert.ok(snap1Hl.perimeterShrinkPct >= 28 && snap1Hl.perimeterShrinkPct <= 31);
  assert.ok(snap1Hl.uncompensatedDensityHd < 2.0);
  assert.equal(snap1Hl.isUncompensatedUnderexposed, true);
  assert.ok(snap1Hl.shiftedExitIntensityPct < snap0.shiftedExitIntensityPct);
  assert.ok(snap1Hl.photonDurationSec > snap0.photonDurationSec);

  // Constant-potential X-Ray tube has 0% calendar decay
  const xrayInput = { ...baseInput, sourceType: 'xray_dir' as const, tubeKv: 220, tubeMa: 4.0 };
  const xrayBeam = computeBeamDecayProfile(xrayInput);
  const xraySnap = compute4dDecayShiftSnapshot(xrayInput, xrayBeam, 120);
  assert.equal(xraySnap.isGammaIsotope, false);
  assert.equal(xraySnap.decayFraction, 1);
  assert.equal(xraySnap.exposureTimeMultiplier, 1);
});

test('GeRadiographicExposureTimeApp toggles 4D decay view, animates wavefront overlay, shifts beam parameters over time, and applies 4D date', async () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Off by default
  const toggleBtn = ui.getByTestId('ge-4d-view-toggle');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(ui.queryByTestId('ge-4d-controls-bar'), null);
  assert.equal(ui.queryByTestId('ge-4d-shift-hud'), null);
  assert.equal(ui.queryByTestId('ge-4d-decay-wavefront'), null);

  const staticCurveD = ui.getByTestId('ge-beam-decay-curve-path').getAttribute('d') || '';
  const staticDuration = Number(ui.getByTestId('ge-beam-photon-sync-hud').getAttribute('data-photon-duration'));

  // Enable 4D Decay View
  fireEvent.click(toggleBtn);
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'true');
  assert.ok(ui.getByTestId('ge-4d-controls-bar'));
  assert.ok(ui.getByTestId('ge-4d-shift-hud'));
  assert.ok(ui.getByTestId('ge-4d-baseline-curve'));
  assert.ok(ui.getByTestId('ge-4d-decayed-beam-overlay'));

  const wavefront = ui.getByTestId('ge-4d-decay-wavefront');
  assert.ok(wavefront.classList.contains('rt-4d-decay-wavefront'));
  assert.equal(ui.getByTestId('ge-4d-baseline-curve').getAttribute('d'), staticCurveD);

  // Jump to 2 T1/2 (25% remaining) -> decayed curve interpolates downward & exposure time ~4x
  fireEvent.click(ui.getByTestId('ge-4d-milestone-2hl'));
  await waitFor(
    () => {
      const decayedCurveD = ui.getByTestId('ge-beam-decay-curve-path').getAttribute('d') || '';
      assert.notEqual(decayedCurveD, staticCurveD);
    },
    { timeout: 1000 }
  );

  const decayedDuration = Number(ui.getByTestId('ge-beam-photon-sync-hud').getAttribute('data-photon-duration'));
  assert.ok(
    decayedDuration > staticDuration,
    `Expected slowed 4D decayed photon duration (${decayedDuration}s) > Day-0/initial (${staticDuration}s)`
  );

  const shiftHudText = ui.getByTestId('ge-4d-shift-hud').textContent || '';
  assert.ok(
    shiftHudText.includes('24.9%') || shiftHudText.includes('25.0%'),
    `Expected ~25% activity remaining at 2 T1/2 (148d), got: ${shiftHudText}`
  );
  assert.ok(shiftHudText.includes('UNDER < 2.0'), `Expected underexposure alert at 2 T1/2, got: ${shiftHudText}`);

  // Scrub slider manually & toggle playback button
  const scrubber = ui.getByTestId('ge-4d-day-scrubber') as HTMLInputElement;
  fireEvent.change(scrubber, { target: { value: '74' } });
  assert.ok((ui.getByTestId('ge-4d-controls-bar').textContent || '').includes('t = +74d'));

  const playBtn = ui.getByTestId('ge-4d-play-btn');
  assert.ok((playBtn.textContent || '').includes('Play 4D Decay'));
  fireEvent.click(playBtn);
  assert.ok((playBtn.textContent || '').includes('Pause 4D Decay'));

  // Apply 4D projected date to shot date input and verify sync
  fireEvent.click(ui.getByTestId('ge-4d-apply-date-btn'));
  const shotInput = ui.getByTestId('ge-shot-date-input') as HTMLInputElement;
  assert.equal(shotInput.value, '2026-12-19');

  // Reset to t0 interpolates back to 100% baseline within ~300ms
  fireEvent.click(ui.getByTestId('ge-4d-reset-btn'));
  await waitFor(
    () => {
      assert.equal(ui.getByTestId('ge-beam-decay-curve-path').getAttribute('d'), staticCurveD);
    },
    { timeout: 1000 }
  );
  assert.ok((ui.getByTestId('ge-4d-shift-hud').textContent || '').includes('100.0%'));
});

test('GeRadiographicExposureTimeApp Multi-Film Loading Time-Correction Factor slider fine-tunes composite exposure duration', () => {
  // 1. Engine math check with custom compositeTimeCorrectionFactor
  const baseSingle = calculateGeRadiographicExposure({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    filmId: 'd7',
    technique: 'dwsi_contact',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true,
  });

  const defaultComposite = calculateGeRadiographicExposure({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    filmId: 'd7',
    technique: 'dwsi_contact',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true,
    multiFilmConfig: {
      mode: 'dual_composite',
      primaryFilmId: 'd7',
    },
  });

  const boostedComposite = calculateGeRadiographicExposure({
    sourceType: 'ir192',
    materialId: 'carbon_steel',
    filmId: 'd7',
    technique: 'dwsi_contact',
    materialThicknessMm: 12.0,
    weldReinforcementMm: 2.5,
    sfdCm: 70,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-11-05',
    measurementDate: '2026-11-05',
    targetOpticalDensity: 2.5,
    hasLeadScreens: true,
    hasCollimator: true,
    multiFilmConfig: {
      mode: 'dual_composite',
      primaryFilmId: 'd7',
      compositeTimeCorrectionFactor: 0.72,
    },
  });

  assert.equal(boostedComposite.multiFilmTimeFactor, 0.72);
  assert.ok(
    Math.abs(
      boostedComposite.calculatedTotalSeconds -
        Math.round(baseSingle.calculatedTotalSeconds * 0.72)
    ) <= 1
  );
  assert.ok(boostedComposite.calculatedTotalSeconds > defaultComposite.calculatedTotalSeconds);
  assert.ok(boostedComposite.calculatedTotalSeconds < baseSingle.calculatedTotalSeconds);

  // 2. React UI slider interaction check
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);
  assert.equal(ui.queryByTestId('ge-composite-time-correction-slider'), null);

  // Switch to Dual Composite mode
  fireEvent.click(ui.getByTestId('ge-film-loading-mode-dual-composite'));

  const slider = ui.getByTestId('ge-composite-time-correction-slider') as HTMLInputElement;
  assert.equal(slider.value, '0.55');
  assert.equal(ui.getByTestId('ge-composite-time-correction-value').textContent, '×0.55');

  const initialDurationText = ui.getByTestId('ge-calculated-exposure-display').textContent;

  // Fine-tune factor upward to 0.75x
  fireEvent.change(slider, { target: { value: '0.75' } });
  assert.equal(ui.getByTestId('ge-composite-time-correction-value').textContent, '×0.75');
  assert.ok((ui.getByTestId('ge-multi-film-badge').textContent || '').includes('-25% time'));
  assert.notEqual(
    ui.getByTestId('ge-calculated-exposure-display').textContent,
    initialDurationText
  );

  // Click quick reset chip back to ASME 0.55x standard
  fireEvent.click(ui.getByTestId('ge-composite-time-correction-reset'));
  assert.equal(ui.getByTestId('ge-composite-time-correction-value').textContent, '×0.55');
  assert.equal(
    ui.getByTestId('ge-calculated-exposure-display').textContent,
    initialDurationText
  );
});

test('GeRadiographicExposureTimeApp Primary HUD toggle hides 4D/Beam Intensity overlay while keeping numeric calculations intact', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const toggleBtn = ui.getByTestId('ge-hud-toggle-beam-overlay');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(toggleBtn.getAttribute('data-overlay-visible'), 'true');
  assert.ok(ui.getByTestId('ge-beam-intensity-decay-overlay'));

  // Hide the 4D / Beam Intensity overlay from the Primary HUD
  fireEvent.click(toggleBtn);
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(toggleBtn.getAttribute('data-overlay-visible'), 'false');
  assert.equal(ui.queryByTestId('ge-beam-intensity-decay-overlay'), null);

  // Verify basic numeric calculations remain visible and reactive
  const initialExposure = ui.getByTestId('ge-calculated-exposure-display').textContent;
  assert.ok(ui.getByTestId('ge-curie-minutes').textContent);
  assert.ok(ui.getByTestId('ge-effective-thickness').textContent);
  assert.ok(ui.getByTestId('ge-ug-metric').textContent);
  assert.ok(ui.getByTestId('ge-essential-wire').textContent);

  fireEvent.change(ui.getByTestId('ge-thickness-number-input'), { target: { value: '24' } });
  assert.notEqual(
    ui.getByTestId('ge-calculated-exposure-display').textContent,
    initialExposure
  );
  assert.equal(ui.queryByTestId('ge-beam-intensity-decay-overlay'), null);

  // Re-toggle to show the overlay again
  fireEvent.click(toggleBtn);
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(toggleBtn.getAttribute('data-overlay-visible'), 'true');
  assert.ok(ui.getByTestId('ge-beam-intensity-decay-overlay'));

  // Hide again, then verify Reset All Inputs restores the overlay
  fireEvent.click(toggleBtn);
  assert.equal(ui.queryByTestId('ge-beam-intensity-decay-overlay'), null);

  fireEvent.click(ui.getByTestId('ge-reset-all-inputs-btn'));
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.ok(ui.getByTestId('ge-beam-intensity-decay-overlay'));
});

test('GeRadiographicExposureTimeApp Primary HUD granular toggles control Lead-Screen intensity and Weld-Reinforcement profile overlays independently', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const leadToggle = ui.getByTestId('ge-hud-toggle-lead-screen-overlay');
  const beamLeadToggle = ui.getByTestId('ge-beam-toggle-lead-screen-overlay');
  const weldToggle = ui.getByTestId('ge-hud-toggle-weld-profile-overlay');

  // Both sub-overlays are enabled and visible on initial mount (default weldReinforcementMm = 2.5, hasLeadScreens = true)
  assert.equal(leadToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(beamLeadToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(weldToggle.getAttribute('aria-pressed'), 'true');
  assert.ok(ui.getByTestId('ge-lead-screen-intensity-overlay'));
  assert.ok(ui.getByTestId('ge-weld-reinforcement-profile-overlay'));
  assert.equal(
    ui.getByTestId('ge-lead-screen-intensity-overlay').getAttribute('data-lead-screens-enabled'),
    'true'
  );
  assert.equal(
    ui.getByTestId('ge-weld-reinforcement-profile-overlay').getAttribute('data-weld-mm'),
    '2.5'
  );

  // Toggle OFF Lead-Screen intensity overlay via inline beam visualization toggle -> declutters Pb overlay & syncs HUD
  fireEvent.click(beamLeadToggle);
  assert.equal(beamLeadToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(leadToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(ui.queryByTestId('ge-lead-screen-intensity-overlay'), null);
  assert.ok(ui.getByTestId('ge-weld-reinforcement-profile-overlay'));

  // Toggle OFF Weld-Reinforcement profile visualizer -> main 4D/Beam overlay remains visible
  fireEvent.click(weldToggle);
  assert.equal(weldToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(ui.queryByTestId('ge-weld-reinforcement-profile-overlay'), null);
  assert.ok(ui.getByTestId('ge-beam-intensity-decay-overlay'));
  assert.ok(ui.getByTestId('ge-beam-decay-curve-path'));

  // Toggle Lead-Screen back ON from HUD -> updates inline beam toggle & appears without forcing Weld profile ON
  fireEvent.click(leadToggle);
  assert.equal(leadToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(beamLeadToggle.getAttribute('aria-pressed'), 'true');
  assert.ok(ui.getByTestId('ge-lead-screen-intensity-overlay'));
  assert.equal(ui.queryByTestId('ge-weld-reinforcement-profile-overlay'), null);

  // Reset All Inputs restores both granular overlays back to ON
  fireEvent.click(ui.getByTestId('ge-reset-all-inputs-btn'));
  assert.equal(leadToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(beamLeadToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(weldToggle.getAttribute('aria-pressed'), 'true');
  assert.ok(ui.getByTestId('ge-lead-screen-intensity-overlay'));
  assert.ok(ui.getByTestId('ge-weld-reinforcement-profile-overlay'));
});

test('GeRadiographicExposureTimeApp smoothly animates intensity decay curve with 300ms Motion interpolation across material and SFD distance changes', async () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const curvePath = ui.getByTestId('ge-beam-decay-curve-path');
  const curveFlow = ui.getByTestId('ge-beam-decay-curve-flow');
  const areaPath = ui.getByTestId('ge-beam-decay-area');
  const exitDot = ui.getByTestId('ge-beam-decay-exit-dot');

  assert.equal(curvePath.getAttribute('data-transition-ms'), '300');
  assert.ok(curveFlow.classList.contains('rt-photon-curve-flow'));
  assert.ok(areaPath.classList.contains('rt-beam-curve-color-transition'));
  assert.ok(exitDot.classList.contains('rt-beam-curve-color-transition'));

  const countSegments = (d: string) => (d.match(/[ML]/g) || []).length;
  const baseD = curvePath.getAttribute('d') || '';
  const baseSegments = countSegments(baseD);
  assert.equal(baseSegments, 97); // 1 'M' + 96 uniform 'L' vertices for glitch-free path morphing

  // 1. Change material from Carbon Steel to Aluminum -> does NOT jump synchronously on frame 0, then settles over 300ms
  fireEvent.change(ui.getByTestId('ge-select-material'), { target: { value: 'aluminum' } });
  assert.equal(curvePath.getAttribute('d'), baseD); // No sudden 0ms jump

  await new Promise((resolve) => setTimeout(resolve, 420));
  const aluD = curvePath.getAttribute('d') || '';
  assert.notEqual(aluD, baseD);
  assert.equal(countSegments(aluD), baseSegments);

  // 2. Change distance (SFD) from 70 cm to 120 cm -> starts smoothly at aluD, moves through intermediate states, settles over 300ms
  fireEvent.change(ui.getByTestId('ge-sfd-number-input'), { target: { value: '120' } });
  assert.equal(curvePath.getAttribute('d'), aluD); // No sudden 0ms jump

  const observedSnapshots = new Set<string>([aluD]);
  for (let step = 0; step < 6; step++) {
    await new Promise((resolve) => setTimeout(resolve, 75));
    observedSnapshots.add(curvePath.getAttribute('d') || '');
  }
  const farSfdD = curvePath.getAttribute('d') || '';
  assert.notEqual(farSfdD, aluD);
  assert.ok(
    observedSnapshots.size >= 3,
    `Expected multi-frame interpolated SVG path transitions over 300ms, saw ${observedSnapshots.size} distinct states`
  );
  assert.equal(countSegments(farSfdD), baseSegments);

  // 3. Switch to Single-Wall Plate -> vertex count stays identical even without internal bore cavity
  fireEvent.change(ui.getByTestId('ge-select-technique'), { target: { value: 'swsi_plate' } });
  await new Promise((resolve) => setTimeout(resolve, 420));
  const plateD = curvePath.getAttribute('d') || '';
  assert.notEqual(plateD, farSfdD);
  assert.equal(countSegments(plateD), baseSegments);

  // 4. During active 4D playback, transition duration switches smoothly to 160ms playback pacing
  fireEvent.click(ui.getByTestId('ge-4d-view-toggle'));
  fireEvent.click(ui.getByTestId('ge-4d-play-btn'));
  assert.equal(curvePath.getAttribute('data-transition-ms'), '160');
  fireEvent.click(ui.getByTestId('ge-4d-play-btn'));
  assert.equal(curvePath.getAttribute('data-transition-ms'), '300');
});

test('GeRadiographicExposureTimeApp Primary HUD printer icon opens the Print Technique Card modal in one click', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  assert.equal(ui.queryByText('ASME Sec V Article 2 Radiographic Technique Card'), null);

  const hudPrintBtn = ui.getByTestId('ge-hud-print-technique-card-btn');
  assert.equal(hudPrintBtn.getAttribute('aria-label'), 'Print Technique Card');
  assert.ok(hudPrintBtn.querySelector('svg'));

  // One-click opens the exact same Technique Card modal
  fireEvent.click(hudPrintBtn);
  assert.ok(ui.getByText('ASME Sec V Article 2 Radiographic Technique Card'));
  assert.ok(ui.getByText('Print Card'));
  assert.ok(ui.getByTestId('ge-modal-export-pdf-btn'));

  // Close restores previous state
  fireEvent.click(ui.getByText('Close'));
  assert.equal(ui.queryByText('ASME Sec V Article 2 Radiographic Technique Card'), null);
});

test('GeRadiographicExposureTimeApp toggles secondary photoelectron intensification vector paths with staggered origin entrance and rapid source-point collapse', async () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const pbPathsToggle = ui.container.querySelector('#ge-beam-toggle-pb-photoelectron-paths') as HTMLButtonElement;
  assert.ok(pbPathsToggle);
  assert.equal(pbPathsToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(pbPathsToggle.getAttribute('data-pb-screens-active'), 'true');

  const leadOverlay = ui.getByTestId('ge-lead-screen-intensity-overlay');
  const pbPathsGroup = ui.getByTestId('ge-pb-photoelectron-paths');
  assert.equal(pbPathsGroup.getAttribute('data-animated-transition'), 'stagger-collapse');
  assert.equal(pbPathsGroup.getAttribute('data-entrance-effect'), 'fade-outward-scale');
  assert.equal(pbPathsGroup.getAttribute('data-ghost-trail-enabled'), 'true');
  assert.ok(leadOverlay.contains(pbPathsGroup));
  assert.ok(ui.getByTestId('ge-pb-photoelectron-legend').textContent?.includes('Pb +e⁻ → Film'));

  const frontLines = pbPathsGroup.querySelectorAll('line[data-vector-origin="front_pb"]');
  const backLines = pbPathsGroup.querySelectorAll('line[data-vector-origin="back_pb"]');
  const frontGhostTrails = pbPathsGroup.querySelectorAll('line[data-ghost-trail="front_pb"]');
  const backGhostTrails = pbPathsGroup.querySelectorAll('line[data-ghost-trail="back_pb"]');
  const frontDots = pbPathsGroup.querySelectorAll('circle[data-origin-dot="front_pb"]');
  const backDots = pbPathsGroup.querySelectorAll('circle[data-origin-dot="back_pb"]');
  assert.equal(frontLines.length, 5);
  assert.equal(backLines.length, 5);
  assert.equal(frontGhostTrails.length, 10);
  assert.equal(backGhostTrails.length, 10);
  assert.equal(frontDots.length, 5);
  assert.equal(backDots.length, 5);
  assert.equal(frontGhostTrails[0].getAttribute('data-trail-tier'), 'residual');
  assert.equal(frontGhostTrails[0].getAttribute('data-trail-blur'), '2.1px');
  assert.ok(frontGhostTrails[0].classList.contains('rt-pb-electron-ghost-trail-residual'));
  assert.equal(frontGhostTrails[1].getAttribute('data-trail-tier'), 'primary');
  assert.equal(frontGhostTrails[1].getAttribute('data-trail-blur'), '1.1px');
  assert.ok(frontGhostTrails[1].classList.contains('rt-pb-electron-ghost-trail-primary'));
  assert.ok(
    Number(frontGhostTrails[0].getAttribute('data-stagger-delay')) >
      Number(frontGhostTrails[1].getAttribute('data-stagger-delay'))
  );
  assert.ok(
    Number(frontGhostTrails[1].getAttribute('data-stagger-delay')) >
      Number(frontLines[0].getAttribute('data-stagger-delay'))
  );
  assert.equal(frontLines[0].getAttribute('data-entrance-effect'), 'fade-outward-scale');
  assert.equal(backLines[0].getAttribute('data-entrance-effect'), 'fade-outward-scale');
  assert.equal(frontLines[0].getAttribute('data-color-pulse'), 'yellow-to-teal');
  assert.equal(backLines[0].getAttribute('data-color-pulse'), 'yellow-to-teal');
  assert.equal(frontLines[0].getAttribute('stroke'), 'url(#gePbElectronDissipationFront)');
  assert.equal(backLines[0].getAttribute('stroke'), 'url(#gePbElectronDissipationBack)');
  assert.ok(frontDots[0].classList.contains('rt-pb-energy-origin-spark'));
  assert.equal(frontDots[0].getAttribute('fill'), '#fde047');

  // Verify warm-yellow-to-cool-teal dissipation gradients & pulsing stop classes in SVG defs
  const frontGrad = ui.container.querySelector('#gePbElectronDissipationFront');
  const backGrad = ui.container.querySelector('#gePbElectronDissipationBack');
  assert.ok(frontGrad);
  assert.ok(backGrad);
  const frontStops = frontGrad.querySelectorAll('stop');
  assert.equal(frontStops.length, 3);
  assert.equal(frontStops[0].getAttribute('stop-color'), '#fde047');
  assert.ok(frontStops[0].classList.contains('rt-pb-energy-stop-origin'));
  assert.ok(frontStops[1].classList.contains('rt-pb-energy-stop-mid'));
  assert.equal(frontStops[2].getAttribute('stop-color'), '#14b8a6');
  assert.ok(frontStops[2].classList.contains('rt-pb-energy-stop-tip'));
  const arrowPath = ui.container.querySelector('#gePbElectronArrow path');
  assert.ok(arrowPath);
  assert.equal(arrowPath.getAttribute('fill'), '#14b8a6');
  assert.ok(arrowPath.classList.contains('rt-pb-energy-arrow-tip'));

  // Verify progressive stagger delays across vectors and origin coordinate anchors
  const frontDelays = [...frontLines].map((el) => Number(el.getAttribute('data-stagger-delay')));
  const backDelays = [...backLines].map((el) => Number(el.getAttribute('data-stagger-delay')));
  assert.deepEqual(frontDelays, [0, 0.035, 0.07, 0.105, 0.14]);
  assert.deepEqual(backDelays, [0.06, 0.095, 0.13, 0.165, 0.2]);
  assert.equal(frontLines[0].getAttribute('x1'), frontLines[0].getAttribute('data-origin-x'));
  assert.equal(frontLines[0].getAttribute('y1'), frontLines[0].getAttribute('data-origin-y'));
  assert.equal(frontLines[0].getAttribute('marker-end'), 'url(#gePbElectronArrow)');
  assert.equal(backLines[0].getAttribute('marker-end'), 'url(#gePbElectronArrow)');
  assert.ok(frontLines[0].classList.contains('rt-pb-electron-vector'));
  assert.ok(backLines[0].classList.contains('rt-pb-electron-vector'));

  // Toggle OFF secondary photoelectron paths -> rapid collapse back to Pb source points (~140ms) while keeping Lead Screen overlay visible
  fireEvent.click(pbPathsToggle);
  assert.equal(pbPathsToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(pbPathsToggle.getAttribute('data-layer-active'), 'false');
  assert.ok(ui.getByTestId('ge-lead-screen-intensity-overlay'));

  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(ui.queryByTestId('ge-pb-photoelectron-paths'), null);

  // Hide enclosing Lead Screen overlay, then toggle Pb e⁻ Paths ON -> auto-reveals Lead Screen overlay & runs fade-in + outward scale entrance
  fireEvent.click(ui.getByTestId('ge-beam-toggle-lead-screen-overlay'));
  assert.equal(ui.queryByTestId('ge-lead-screen-intensity-overlay'), null);
  fireEvent.click(pbPathsToggle);
  assert.equal(pbPathsToggle.getAttribute('aria-pressed'), 'true');
  assert.ok(ui.getByTestId('ge-lead-screen-intensity-overlay'));
  const reEnteredPaths = ui.getByTestId('ge-pb-photoelectron-paths');
  assert.equal(reEnteredPaths.getAttribute('data-animated-transition'), 'stagger-collapse');
  assert.equal(reEnteredPaths.getAttribute('data-entrance-effect'), 'fade-outward-scale');

  // Right at mount frame 0, vectors initialize faded out and collapsed at their Pb origin point (x2 == originX, opacity == 0, scale(0.08))
  const reFront0 = reEnteredPaths.querySelector('line[data-vector-origin="front_pb"]') as SVGLineElement;
  const reFrontPrimaryTrail0 = reEnteredPaths.querySelector(
    'line[data-ghost-trail="front_pb"][data-trail-tier="primary"]'
  ) as SVGLineElement;
  const reFrontResidualTrail0 = reEnteredPaths.querySelector(
    'line[data-ghost-trail="front_pb"][data-trail-tier="residual"]'
  ) as SVGLineElement;
  assert.equal(reFront0.getAttribute('x2'), reFront0.getAttribute('data-origin-x'));
  assert.equal(reEnteredPaths.getAttribute('opacity'), '0');
  assert.equal(reFront0.getAttribute('opacity'), '0');
  assert.equal(reFrontPrimaryTrail0.getAttribute('opacity'), '0');
  assert.equal(reFrontResidualTrail0.getAttribute('opacity'), '0');
  assert.match(reEnteredPaths.style.transform, /scale\(0\.92\)/);
  assert.match(reFront0.style.transform, /scale\(0\.08\)/);

  // Wait for staggered fade-in + outward scale overshoot + lagging blurred ghost trails to settle cleanly
  await new Promise((resolve) => setTimeout(resolve, 640));
  assert.equal(Number(reEnteredPaths.getAttribute('opacity') || '0'), 1);
  const crispOpacity = Number(reFront0.getAttribute('opacity') || '0');
  const primaryTrailOpacity = Number(reFrontPrimaryTrail0.getAttribute('opacity') || '0');
  const residualTrailOpacity = Number(reFrontResidualTrail0.getAttribute('opacity') || '0');
  assert.ok(crispOpacity >= 0.9);
  assert.ok(primaryTrailOpacity > residualTrailOpacity && primaryTrailOpacity < crispOpacity);
  assert.ok(residualTrailOpacity > 0.05 && residualTrailOpacity < 0.25);
  assert.notEqual(reFront0.getAttribute('x2'), reFront0.getAttribute('data-origin-x'));

  // Enable Multi-Film Different (Wide-Latitude) + Interleaf 0.025mm Pb Foil -> renders bidirectional staggered interleaf vectors, ghost trails, origin sparks & dual legend
  fireEvent.click(ui.getByTestId('ge-film-loading-mode-dual-different'));
  fireEvent.click(ui.getByTestId('ge-interleaf-screen-toggle'));
  const interleafLines = ui
    .getByTestId('ge-pb-photoelectron-paths')
    .querySelectorAll('line[data-vector-origin="interleaf_pb"]');
  const interleafGhostTrails = ui
    .getByTestId('ge-pb-photoelectron-paths')
    .querySelectorAll('line[data-ghost-trail="interleaf_pb"]');
  const interleafDots = ui
    .getByTestId('ge-pb-photoelectron-paths')
    .querySelectorAll('circle[data-origin-dot="interleaf_pb"]');
  assert.equal(interleafLines.length, 6);
  assert.equal(interleafGhostTrails.length, 12);
  assert.equal(interleafDots.length, 3);
  assert.equal(interleafLines[0].getAttribute('data-entrance-effect'), 'fade-outward-scale');
  assert.equal(interleafLines[0].getAttribute('data-color-pulse'), 'yellow-to-teal');
  assert.equal(interleafLines[0].getAttribute('stroke'), 'url(#gePbElectronDissipationInterleafLeft)');
  assert.equal(interleafLines[1].getAttribute('stroke'), 'url(#gePbElectronDissipationInterleafRight)');
  assert.ok(interleafDots[0].classList.contains('rt-pb-energy-origin-spark'));
  assert.ok(ui.getByTestId('ge-pb-photoelectron-legend').textContent?.includes('Dual'));

  // Disabling Lead Screens & Interleaf rapidly collapses vector paths back to Pb points and shows Pb Off educational note
  fireEvent.click(ui.getByTestId('ge-interleaf-screen-toggle'));
  fireEvent.click(ui.getByTestId('ge-lead-screens-toggle'));
  assert.equal(pbPathsToggle.getAttribute('data-pb-screens-active'), 'false');
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(ui.queryByTestId('ge-pb-photoelectron-paths'), null);
  assert.ok(ui.getByTestId('ge-pb-photoelectron-disabled-note').textContent?.includes('Pb Off'));

  // Reset All Inputs restores Lead Screens and Pb e- Paths back ON
  fireEvent.click(ui.getByTestId('ge-reset-all-inputs-btn'));
  assert.equal(pbPathsToggle.getAttribute('aria-pressed'), 'true');
  assert.ok(ui.getByTestId('ge-pb-photoelectron-paths'));
});

test('GeRadiographicExposureTimeApp persists #ge-beam-toggle-pb-photoelectron-paths state across sessions via localStorage', () => {
  localStorage.removeItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY);

  // 1. First session: default ON -> persisted as 'true', toggling OFF saves 'false'
  const session1 = render(<GeRadiographicExposureTimeApp language="en" />);
  const toggle1 = session1.container.querySelector('#ge-beam-toggle-pb-photoelectron-paths') as HTMLButtonElement;
  assert.equal(toggle1.getAttribute('aria-pressed'), 'true');
  assert.equal(localStorage.getItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY), 'true');

  fireEvent.click(toggle1);
  assert.equal(toggle1.getAttribute('aria-pressed'), 'false');
  assert.equal(localStorage.getItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY), 'false');
  session1.unmount();

  // 2. Second session: initializes OFF from persisted 'false', keeping photoelectron paths hidden
  const session2 = render(<GeRadiographicExposureTimeApp language="en" />);
  const toggle2 = session2.container.querySelector('#ge-beam-toggle-pb-photoelectron-paths') as HTMLButtonElement;
  assert.equal(toggle2.getAttribute('aria-pressed'), 'false');
  assert.equal(session2.queryByTestId('ge-pb-photoelectron-paths'), null);

  // Enable in session 2 -> persists 'true'
  fireEvent.click(toggle2);
  assert.equal(toggle2.getAttribute('aria-pressed'), 'true');
  assert.equal(localStorage.getItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY), 'true');
  assert.ok(session2.getByTestId('ge-pb-photoelectron-paths'));
  session2.unmount();

  // 3. Third session: initializes ON with vector paths visible immediately
  const session3 = render(<GeRadiographicExposureTimeApp language="en" />);
  const toggle3 = session3.container.querySelector('#ge-beam-toggle-pb-photoelectron-paths') as HTMLButtonElement;
  assert.equal(toggle3.getAttribute('aria-pressed'), 'true');
  assert.ok(session3.getByTestId('ge-pb-photoelectron-paths'));
  session3.unmount();

  // 4. Corrupted storage value falls back safely to default ON ('true')
  localStorage.setItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY, 'corrupted-value');
  const session4 = render(<GeRadiographicExposureTimeApp language="en" />);
  const toggle4 = session4.container.querySelector('#ge-beam-toggle-pb-photoelectron-paths') as HTMLButtonElement;
  assert.equal(toggle4.getAttribute('aria-pressed'), 'true');
  assert.equal(localStorage.getItem(GE_PB_PHOTOELECTRON_PATHS_STORAGE_KEY), 'true');
  assert.ok(session4.getByTestId('ge-pb-photoelectron-paths'));
});

test('GeRadiographicExposureTimeApp renders physics & film-contrast tooltip and legend for #ge-beam-toggle-pb-photoelectron-paths in EN and AR', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const pbToggle = ui.container.querySelector('#ge-beam-toggle-pb-photoelectron-paths') as HTMLButtonElement;
  const infoBtn = ui.getByTestId('ge-pb-photoelectron-info-btn') as HTMLButtonElement;
  const tooltip = ui.getByTestId('ge-pb-photoelectron-physics-tooltip');

  assert.equal(pbToggle.getAttribute('aria-describedby'), 'ge-pb-photoelectron-physics-tooltip');
  assert.equal(infoBtn.getAttribute('aria-controls'), 'ge-pb-photoelectron-physics-tooltip');
  assert.equal(infoBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(tooltip.getAttribute('data-open'), 'false');

  // Verify English physics & contrast gain copy + Front/Back/Interleaf vector legend
  const enText = tooltip.textContent || '';
  assert.match(enText, /photoelectric effect/i);
  assert.match(enText, /Intensification Factor/i);
  assert.match(enText, /Contrast Gain/i);
  assert.match(enText, /Warm Yellow \(Pb\) → Cool Teal \(Film\)/i);
  assert.match(enText, /Front Pb → Film/i);
  assert.match(enText, /Back Pb → Film/i);
  assert.match(enText, /Interleaf Pb \(Dual\)/i);

  // Clicking info button pins tooltip open without altering vector toggle state; blur closes it
  fireEvent.click(infoBtn);
  assert.equal(infoBtn.getAttribute('aria-expanded'), 'true');
  assert.equal(tooltip.getAttribute('data-open'), 'true');
  assert.equal(pbToggle.getAttribute('aria-pressed'), 'true');

  fireEvent.blur(infoBtn);
  assert.equal(infoBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(tooltip.getAttribute('data-open'), 'false');
  ui.unmount();

  // Arabic RTL physics explanation check
  const arUi = render(<GeRadiographicExposureTimeApp language="ar" />);
  const arTooltip = arUi.getByTestId('ge-pb-photoelectron-physics-tooltip');
  const arText = arTooltip.textContent || '';
  assert.match(arText, /التأثير الكهروضوئي/);
  assert.match(arText, /تعزيز التباين/);
  assert.match(arText, /حساسية سلك IQI/);
  assert.match(arText, /أصفر دافئ/);
});

test('getPbGhostTrailAnimationConfig and computePbGhostTrailEndpoint scale reach, lag, opacity, and durations across short, medium, and long', () => {
  const shortCfg = getPbGhostTrailAnimationConfig('short');
  const mediumCfg = getPbGhostTrailAnimationConfig('medium');
  const longCfg = getPbGhostTrailAnimationConfig('long');

  assert.equal(shortCfg.length, 'short');
  assert.equal(mediumCfg.length, 'medium');
  assert.equal(longCfg.length, 'long');

  // Monotonically increasing reach factors, stagger lag delays, durations, and settled wake opacities
  assert.ok(shortCfg.primary.reachFactor < mediumCfg.primary.reachFactor && mediumCfg.primary.reachFactor < longCfg.primary.reachFactor);
  assert.ok(shortCfg.residual.reachFactor < mediumCfg.residual.reachFactor && mediumCfg.residual.reachFactor < longCfg.residual.reachFactor);
  assert.ok(shortCfg.residual.lagDelay < mediumCfg.residual.lagDelay && mediumCfg.residual.lagDelay < longCfg.residual.lagDelay);
  assert.ok(shortCfg.residual.enterDuration < mediumCfg.residual.enterDuration && mediumCfg.residual.enterDuration < longCfg.residual.enterDuration);
  assert.ok(shortCfg.residual.wakeDurationSec < mediumCfg.residual.wakeDurationSec && mediumCfg.residual.wakeDurationSec < longCfg.residual.wakeDurationSec);
  assert.ok(shortCfg.primary.settledOpacity < mediumCfg.primary.settledOpacity && mediumCfg.primary.settledOpacity < longCfg.primary.settledOpacity);

  // Forward Front Pb vector endpoint extrapolation scales monotonically along direction
  const originX = 100;
  const originY = 80;
  const targetX = 106.5;
  const targetY = 77;
  const sEnd = computePbGhostTrailEndpoint(originX, originY, targetX, targetY, shortCfg.residual.reachFactor);
  const mEnd = computePbGhostTrailEndpoint(originX, originY, targetX, targetY, mediumCfg.residual.reachFactor);
  const lEnd = computePbGhostTrailEndpoint(originX, originY, targetX, targetY, longCfg.residual.reachFactor);
  assert.ok(sEnd.x2 > originX && sEnd.x2 < mEnd.x2 && mEnd.x2 < lEnd.x2);
  assert.ok(lEnd.y2 < mEnd.y2 && mEnd.y2 < sEnd.y2);
});

test('GeRadiographicExposureTimeApp toggles photoelectron ghost trail length dynamically between short, medium, and long with persistence and RTL labels', async () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const toggleGroup = ui.getByTestId('ge-pb-ghost-trail-length-toggle');
  const shortBtn = ui.getByTestId('ge-pb-ghost-trail-length-short') as HTMLButtonElement;
  const mediumBtn = ui.getByTestId('ge-pb-ghost-trail-length-medium') as HTMLButtonElement;
  const longBtn = ui.getByTestId('ge-pb-ghost-trail-length-long') as HTMLButtonElement;

  assert.equal(toggleGroup.getAttribute('data-trail-length'), 'medium');
  assert.equal(mediumBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(shortBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(longBtn.getAttribute('aria-pressed'), 'false');

  const pathsGroup = ui.getByTestId('ge-pb-photoelectron-paths');
  assert.equal(pathsGroup.getAttribute('data-ghost-trail-length'), 'medium');

  const getFrontResidual = () =>
    pathsGroup.querySelector('line[data-ghost-trail="front_pb"][data-trail-tier="residual"]') as SVGLineElement;
  const getFrontPrimary = () =>
    pathsGroup.querySelector('line[data-ghost-trail="front_pb"][data-trail-tier="primary"]') as SVGLineElement;

  // Toggle to SHORT
  fireEvent.click(shortBtn);
  assert.equal(shortBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(mediumBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(pathsGroup.getAttribute('data-ghost-trail-length'), 'short');
  assert.equal(localStorage.getItem(GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY), 'short');

  await new Promise((resolve) => setTimeout(resolve, 420));
  const shortResidual = getFrontResidual();
  const shortPrimary = getFrontPrimary();
  assert.equal(shortResidual.getAttribute('data-trail-length'), 'short');
  assert.equal(shortResidual.getAttribute('data-trail-reach'), '0.54');
  assert.equal(shortPrimary.getAttribute('data-trail-reach'), '0.7');
  assert.ok(shortResidual.classList.contains('rt-pb-ghost-len-short'));
  assert.ok(shortPrimary.classList.contains('rt-pb-ghost-len-short'));
  assert.equal(shortResidual.getAttribute('data-wake-duration'), '1.5s');
  assert.equal(shortPrimary.getAttribute('data-flow-duration'), '0.9s');
  const shortOriginX = Number(shortResidual.getAttribute('x1'));
  const shortEndX = Number(shortResidual.getAttribute('x2'));
  assert.ok(shortEndX > shortOriginX);

  // Toggle to LONG
  fireEvent.click(longBtn);
  assert.equal(longBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(shortBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(pathsGroup.getAttribute('data-ghost-trail-length'), 'long');
  assert.equal(localStorage.getItem(GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY), 'long');

  await new Promise((resolve) => setTimeout(resolve, 640));
  const longResidual = getFrontResidual();
  const longPrimary = getFrontPrimary();
  assert.equal(longResidual.getAttribute('data-trail-length'), 'long');
  assert.equal(longResidual.getAttribute('data-trail-reach'), '1.65');
  assert.equal(longPrimary.getAttribute('data-trail-reach'), '1.38');
  assert.ok(longResidual.classList.contains('rt-pb-ghost-len-long'));
  assert.ok(longPrimary.classList.contains('rt-pb-ghost-len-long'));
  assert.equal(longResidual.getAttribute('data-wake-duration'), '3.1s');
  assert.equal(longPrimary.getAttribute('data-flow-duration'), '1.65s');
  assert.equal(longResidual.getAttribute('stroke-dasharray'), '5.2 1.5');
  const longEndX = Number(longResidual.getAttribute('x2'));
  assert.ok(longEndX - shortOriginX > shortEndX - shortOriginX);

  // Session reload restores persisted 'long'
  ui.unmount();
  const session2 = render(<GeRadiographicExposureTimeApp language="ar" />);
  assert.equal(session2.getByTestId('ge-pb-ghost-trail-length-long').getAttribute('aria-pressed'), 'true');
  assert.equal(session2.getByTestId('ge-pb-photoelectron-paths').getAttribute('data-ghost-trail-length'), 'long');
  assert.equal(session2.getByTestId('ge-pb-ghost-trail-length-short').textContent?.trim(), 'قصير');
  assert.equal(session2.getByTestId('ge-pb-ghost-trail-length-medium').textContent?.trim(), 'متوسط');
  assert.equal(session2.getByTestId('ge-pb-ghost-trail-length-long').textContent?.trim(), 'طويل');

  // Reset restores default 'medium'
  fireEvent.click(session2.getByTestId('ge-reset-all-inputs-btn'));
  assert.equal(session2.getByTestId('ge-pb-ghost-trail-length-medium').getAttribute('aria-pressed'), 'true');
  assert.equal(session2.getByTestId('ge-pb-photoelectron-paths').getAttribute('data-ghost-trail-length'), 'medium');
  session2.unmount();

  // Explicit initialPbGhostTrailLength prop overrides stored preference on mount
  localStorage.setItem(GE_PB_GHOST_TRAIL_LENGTH_STORAGE_KEY, 'long');
  const propSession = render(<GeRadiographicExposureTimeApp language="en" initialPbGhostTrailLength="short" />);
  assert.equal(propSession.getByTestId('ge-pb-ghost-trail-length-short').getAttribute('aria-pressed'), 'true');
  assert.equal(propSession.getByTestId('ge-pb-photoelectron-paths').getAttribute('data-ghost-trail-length'), 'short');
});

test('GeRadiographicExposureTimeApp real-time 4D isotope decay playback slider visualizes activity decay and updates calculated exposure times automatically', async () => {
  localStorage.removeItem('ge_app_unit_system');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  assert.ok(ui.getByTestId('ge-decay-4d-playback-panel'));
  const slider = ui.getByTestId('ge-decay-4d-slider') as HTMLInputElement;
  const playBtn = ui.getByTestId('ge-decay-4d-play-btn');
  const exposureDisplay = ui.getByTestId('ge-calculated-exposure-display');
  const activityReadout = ui.getByTestId('ge-decay-4d-activity-readout');
  const multiplierReadout = ui.getByTestId('ge-decay-4d-multiplier-readout');

  // 1. Reset to t0 (100% calibration day)
  fireEvent.click(ui.getByTestId('ge-decay-4d-reset-btn'));
  assert.equal(slider.value, '0');
  assert.ok((activityReadout.textContent || '').includes('45 Ci / 45 Ci'));
  assert.ok((multiplierReadout.textContent || '').includes('×1.00 t₀'));
  const t0ExposureText = exposureDisplay.textContent || '';

  // Parse minutes/seconds into seconds helper
  const parseDisplaySeconds = (txt: string) => {
    const match = /(\d+)m\s+(\d+)s/.exec(txt);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
  };
  const t0Seconds = parseDisplaySeconds(t0ExposureText);
  assert.ok(t0Seconds > 0);

  // 2. Scrubbing slider to 1xT1/2 (~74d for Ir-192) halves Ci & doubles calculated exposure time in real time
  fireEvent.change(slider, { target: { value: '74' } });
  assert.equal((ui.getByTestId('ge-shot-date-input') as HTMLInputElement).value, '2026-12-19');
  const hl1Seconds = parseDisplaySeconds(exposureDisplay.textContent || '');
  assert.ok(
    hl1Seconds >= t0Seconds * 1.9 && hl1Seconds <= t0Seconds * 2.1,
    `Expected 1xT1/2 exposure (~2x of ${t0Seconds}s), got ${hl1Seconds}s`
  );
  assert.ok((multiplierReadout.textContent || '').includes('×2.00 t₀') || (multiplierReadout.textContent || '').includes('×1.99') || (multiplierReadout.textContent || '').includes('×2.01'));
  assert.ok((ui.getByTestId('isotope-decay-shot-label').textContent || '').includes('2026-12-19'));

  // 3. Jump to 2xT1/2 (~25% Ci, ~4x exposure)
  fireEvent.click(ui.getByTestId('ge-decay-4d-jump-2hl'));
  const hl2Seconds = parseDisplaySeconds(exposureDisplay.textContent || '');
  assert.ok(hl2Seconds >= t0Seconds * 3.85 && hl2Seconds <= t0Seconds * 4.15);

  // 4. Reset to t0, select 2x speed, and start automated playback -> slider & calculated exposure advance automatically
  fireEvent.click(ui.getByTestId('ge-decay-4d-reset-btn'));
  fireEvent.click(ui.getByTestId('ge-decay-4d-speed-2'));
  assert.equal(playBtn.getAttribute('aria-pressed'), 'false');
  fireEvent.click(playBtn);
  assert.equal(playBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(ui.getByTestId('isotope-decay-play-btn').textContent?.includes('Pause'), true);

  await waitFor(
    () => {
      const autoDay = Number((ui.getByTestId('ge-decay-4d-slider') as HTMLInputElement).value);
      const autoSecs = parseDisplaySeconds(ui.getByTestId('ge-calculated-exposure-display').textContent || '');
      assert.ok(autoDay > 0, `Expected automated playback day > 0, got ${autoDay}`);
      assert.ok(autoSecs > t0Seconds, `Expected automated exposure > ${t0Seconds}s, got ${autoSecs}s`);
    },
    { timeout: 1500 }
  );

  // Pause playback via D3 chart synced play/pause toggle
  fireEvent.click(ui.getByTestId('isotope-decay-play-btn'));
  assert.equal(playBtn.getAttribute('aria-pressed'), 'false');

  // 5. Switch to constant-potential X-Ray tube -> displays non-decaying mode cleanly
  fireEvent.change(ui.getByTestId('ge-select-source-type'), { target: { value: 'xray_dir' } });
  assert.equal(ui.queryByTestId('ge-decay-4d-slider'), null);
  assert.ok((ui.getByTestId('ge-decay-4d-playback-panel').textContent || '').includes('Constant-Potential X-Ray Tube Generator'));
});

test('generateGeConversionLogPdf builds structured INSCO-branded PDF report containing radiographic data fields and unit conversion entries', () => {
  const doc = generateGeConversionLogPdf({
    reportNumber: 'RT-CONV-TEST-001',
    reportDate: '2026-11-23',
    clientName: 'INSCO Test Client',
    projectFacility: 'Cairo Fabrication Yard',
    weldJointId: 'WJ-PIPE-04',
    leadRadiographer: 'Eng. Ahmed Level II',
    radiographerLevel: 'Level II',
    inspectorCertNumber: 'INSCO-RT-4421',

    sourceType: 'ir192',
    isotopeSpec: GE_ISOTOPES.ir192,
    initialActivityCi: 45,
    initialCalibrationDate: '2026-10-06',
    measurementDate: '2026-11-23',
    decayDaysElapsed: 48,
    currentLiveActivityCi: 28.7,

    materialSpec: {
      id: 'carbon_steel',
      nameEn: 'Carbon Steel (P1)',
      nameAr: 'الصلب الكربوني',
      rFactorIr192: 1.0,
      rFactorSe75: 1.0,
      rFactorCo60: 1.0,
      rFactorXray: 1.0,
      densityGcm3: 7.85
    },
    nominalThicknessMm: 18.0,
    weldReinforcementMm: 2.5,
    pipeOuterDiameterMm: 114.3,
    techniqueSpec: {
      id: 'dwsi_contact',
      nameEn: 'DWSI Contact (Single Wall Viewing)',
      nameAr: 'DWSI تلامس',
      wallsPenetrated: 2,
      descriptionEn: 'Double Wall Single Image',
      descriptionAr: 'جدار مزدوج صورة أحادية',
      defaultReinforcementMm: 2.5
    },
    sfdCm: 70,

    filmLoadingMode: 'single',
    primaryFilmSpec: GE_STRUCTURIX_FILMS.d7,
    hasInterleafLeadScreen: false,
    hasLeadScreens: true,
    hasCollimator: true,
    targetOpticalDensity: 2.5,

    calculatedExposureSeconds: 135,
    formattedExposureDuration: '2m 15s',
    exposureInCurieMinutes: 64.6,
    effectiveSteelThicknessMm: 38.5,
    halfValueLayersCount: 3.1,
    attenuationFactor: 8.5,
    calculatedUgMm: 0.38,
    maxAllowedUgMm: 0.51,
    passesAsmeUg: true,
    essentialWireIdentity: '#9 (Wire 9)',
    essentialWireDiameterMm: 0.41,
    iqiSetDesignation: 'Set B (Wires 6-11)',
    controlledAreaPerimeter2mR_Meters: 15.8,
    publicBarricadePerimeter075mR_Meters: 25.9,

    isMultiFilm: false,
    film1PredictedDensity: 2.5,
    multiFilmTimeFactor: 1.0,

    activeUnitSystem: 'imperial',
    conversionEntries: [
      {
        id: 'conv-1',
        timestamp: '10:15:30 AM',
        fromUnit: 'metric',
        toUnit: 'imperial',
        thicknessMm: 18.0,
        thicknessInches: 0.709,
        sfdCm: 70,
        sfdInches: 27.6,
        sfdFeet: 2.3,
        sourceType: 'ir192',
        sourceLabel: 'Ir-192',
        calculatedTotalSeconds: 135,
        formattedDuration: '2m 15s'
      },
      {
        id: 'conv-2',
        timestamp: '10:16:05 AM',
        fromUnit: 'imperial',
        toUnit: 'metric',
        thicknessMm: 12.0,
        thicknessInches: 0.472,
        sfdCm: 60,
        sfdInches: 23.6,
        sfdFeet: 1.97,
        sourceType: 'se75',
        sourceLabel: 'Se-75',
        calculatedTotalSeconds: 92,
        formattedDuration: '1m 32s'
      }
    ]
  });

  const pdfBytes = doc.output('arraybuffer');
  assert.ok(pdfBytes.byteLength > 2000, `Expected PDF buffer length > 2000 bytes, got ${pdfBytes.byteLength}`);

  const pageStream = (doc.internal.pages[1] || []).join('\n');
  assert.ok(pageStream.includes('INSCO NDT & INSPECTION SERVICES CO.'));
  assert.ok(pageStream.includes('GE / WAYGATE UNIT CONVERSION LOG & RADIOGRAPHIC AUDIT REPORT'));
  assert.ok(pageStream.includes('RT-CONV-TEST-001'));
  assert.ok(pageStream.includes('Cairo Fabrication Yard'));
  assert.ok(pageStream.includes('WJ-PIPE-04'));
  assert.ok(pageStream.includes('IMPERIAL \\(in / ft\\)'));
  assert.ok(pageStream.includes('mm/cm -> in/ft'));
  assert.ok(pageStream.includes('18 mm / 0.709 in'));
  assert.ok(pageStream.includes('70 cm / 27.6 in \\(2.3 ft\\)'));
  assert.ok(pageStream.includes('2m 15s \\(135s\\)'));
  assert.ok(pageStream.includes('INSCO NDT Quality Management System'));
});

test('GeRadiographicExposureTimeApp exports the current unit conversion log as a structured PDF report from #ge-quick-units-bar and conversion log panel (EN & AR)', async () => {
  localStorage.removeItem('ge_app_unit_system');
  localStorage.removeItem('ge_app_conversion_log');
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  const quickBar = ui.container.querySelector('#ge-quick-units-bar') as HTMLElement;
  const exportPdfBtn = ui.getByTestId('ge-quick-units-export-pdf-btn') as HTMLButtonElement;
  assert.ok(quickBar.contains(exportPdfBtn), 'Expected Export PDF button inside #ge-quick-units-bar');

  // Disabled before any conversions are logged
  assert.equal(exportPdfBtn.disabled, true);
  assert.ok(exportPdfBtn.textContent?.includes('Export PDF'));

  // Record 2 conversions with distinct thickness values
  fireEvent.change(ui.getByTestId('ge-thickness-number-input'), { target: { value: '18' } });
  fireEvent.click(ui.getByTestId('ge-quick-units-switch')); // metric -> imperial
  fireEvent.click(ui.getByTestId('ge-quick-units-switch')); // imperial -> metric

  assert.equal(exportPdfBtn.disabled, false);

  const fs = await import('node:fs');
  const todayStr = new Date().toISOString().split('T')[0];
  const expectedFilename = `ge-conversion-log-${todayStr}.pdf`;

  const removeIfExists = () => {
    try {
      if (fs.existsSync(expectedFilename)) {
        fs.unlinkSync(expectedFilename);
      }
    } catch {
      // ignore cleanup error
    }
  };

  removeIfExists();

  try {
    // 1. Export from #ge-quick-units-bar
    fireEvent.click(exportPdfBtn);
    assert.ok(exportPdfBtn.textContent?.includes('PDF Exported'));
    assert.equal(fs.existsSync(expectedFilename), true, `Expected ${expectedFilename} to be generated`);
    const firstPdfBuf = fs.readFileSync(expectedFilename);
    assert.ok(firstPdfBuf.byteLength > 2000, `Expected PDF > 2000 bytes, got ${firstPdfBuf.byteLength}`);
    assert.ok(firstPdfBuf.subarray(0, 5).toString('utf8') === '%PDF-');

    // 2. Also verify Export PDF button inside conversion log panel header
    removeIfExists();
    fireEvent.click(ui.getByTestId('ge-conversion-log-toggle'));
    const panel = ui.getByTestId('ge-conversion-log-panel');
    const panelPdfBtn = ui.getByTestId('ge-conversion-log-export-pdf-btn') as HTMLButtonElement;
    assert.ok(panel.contains(panelPdfBtn), 'Expected Export PDF button inside conversion log panel');
    fireEvent.click(panelPdfBtn);
    assert.equal(fs.existsSync(expectedFilename), true, `Expected ${expectedFilename} from conversion log panel`);
    const secondPdfBuf = fs.readFileSync(expectedFilename);
    assert.ok(secondPdfBuf.byteLength > 2000);

    // 3. Arabic localization check
    removeIfExists();
    cleanup();
    const uiAr = render(<GeRadiographicExposureTimeApp language="ar" />);
    const arPdfBtn = uiAr.getByTestId('ge-quick-units-export-pdf-btn') as HTMLButtonElement;
    assert.equal(arPdfBtn.disabled, false);
    assert.ok(arPdfBtn.textContent?.includes('تصدير PDF'));
    fireEvent.click(arPdfBtn);
    assert.ok(arPdfBtn.textContent?.includes('تم تصدير PDF'));
    assert.equal(fs.existsSync(expectedFilename), true, `Expected ${expectedFilename} in Arabic mode`);
  } finally {
    removeIfExists();
  }
});

test('GeRadiographicExposureTimeApp groups quick industry presets into categorized tabs, optgroup dropdown, and filters by name or source type', () => {
  const ui = render(<GeRadiographicExposureTimeApp language="en" />);

  // Default tab is 'pipe', keeping pipe presets immediately visible while hiding clutter from other categories
  const pipeTab = ui.getByTestId('ge-preset-tab-pipe');
  const plateTab = ui.getByTestId('ge-preset-tab-plate');
  const vesselTab = ui.getByTestId('ge-preset-tab-vessel');
  const xrayTab = ui.getByTestId('ge-preset-tab-xray');

  assert.equal(pipeTab.getAttribute('aria-selected'), 'true');
  assert.ok(ui.getByTestId('preset-pipe-2in'));
  assert.ok(ui.getByTestId('preset-pipe-6in'));
  assert.equal(ui.queryByTestId('preset-plate-se75'), null);
  assert.equal(ui.queryByTestId('preset-vessel-co60'), null);
  assert.equal(ui.queryByTestId('preset-tube-xray'), null);

  // Switch tabs to Plate, Vessel, X-Ray
  fireEvent.click(plateTab);
  assert.equal(plateTab.getAttribute('aria-selected'), 'true');
  assert.ok(ui.getByTestId('preset-plate-se75'));
  assert.equal(ui.queryByTestId('preset-pipe-2in'), null);

  fireEvent.click(vesselTab);
  assert.ok(ui.getByTestId('preset-vessel-co60'));

  fireEvent.click(xrayTab);
  assert.ok(ui.getByTestId('preset-tube-xray'));

  // Categorized <select> optgroups jump directly and load preset
  const presetSelect = ui.getByTestId('ge-preset-category-select') as HTMLSelectElement;
  assert.equal(presetSelect.querySelectorAll('optgroup').length, 4);
  fireEvent.change(presetSelect, { target: { value: 'vessel_co60' } });
  assert.equal((ui.getByTestId('ge-select-source-type') as HTMLSelectElement).value, 'co60');
  assert.equal(ui.getByTestId('ge-preset-tab-vessel').getAttribute('aria-selected'), 'true');

  // CSS selector check requested for preset bar search input
  const bar = ui.container.querySelector(
    '#ge-exposure-calculator-app .flex-wrap.items-center.gap-2:has(.font-bold.text-slate-600)'
  );
  assert.ok(bar, 'Expected categorized preset bar to preserve selector match');
  const searchInput = ui.getByTestId('ge-preset-search-input') as HTMLInputElement;
  assert.ok(bar?.contains(searchInput));

  // Filter by source type across categories (Se-75)
  fireEvent.change(searchInput, { target: { value: 'Se-75' } });
  assert.ok(ui.getByTestId('preset-plate-se75'));
  assert.equal(ui.queryByTestId('preset-pipe-2in'), null);
  assert.equal(ui.queryByTestId('preset-vessel-co60'), null);

  // Filter by name (Vessel)
  fireEvent.change(searchInput, { target: { value: 'Vessel' } });
  assert.ok(ui.getByTestId('preset-vessel-co60'));
  assert.equal(ui.queryByTestId('preset-plate-se75'), null);

  // Empty search state + clear button
  fireEvent.change(searchInput, { target: { value: 'nonexistent-isotope-999' } });
  assert.ok(ui.getByTestId('ge-preset-search-empty'));
  fireEvent.click(ui.getByTestId('ge-preset-search-clear'));
  assert.equal(searchInput.value, '');
  assert.ok(ui.getByTestId('preset-vessel-co60'));

  // Arabic localization check
  cleanup();
  const uiAr = render(<GeRadiographicExposureTimeApp language="ar" />);
  assert.ok(uiAr.getByTestId('ge-preset-tab-pipe').textContent?.includes('أنابيب'));
  assert.ok(uiAr.getByTestId('ge-preset-search-input'));
});

test('GeRadiographicExposureTimeApp slides the conversion log panel in from the side with Framer Motion on toggle open and close', async () => {
  localStorage.removeItem('ge_app_conversion_log');

  // LTR: slides in from the right side (x: 32 -> 0)
  const uiEn = render(<GeRadiographicExposureTimeApp language="en" />);
  const toggleEn = uiEn.getByTestId('ge-conversion-log-toggle');
  assert.equal(uiEn.queryByTestId('ge-conversion-log-panel'), null);

  fireEvent.click(toggleEn);
  const panelEn = uiEn.getByTestId('ge-conversion-log-panel');
  assert.equal(panelEn.style.opacity, '0');
  assert.match(panelEn.style.transform, /translateX\(32px\)/);

  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.equal(Number(panelEn.style.opacity || '0'), 1);

  fireEvent.click(toggleEn);
  await waitFor(() => {
    assert.equal(uiEn.queryByTestId('ge-conversion-log-panel'), null);
  });

  // RTL: slides in from the left side (x: -32 -> 0)
  cleanup();
  const uiAr = render(<GeRadiographicExposureTimeApp language="ar" />);
  const toggleAr = uiAr.getByTestId('ge-conversion-log-toggle');
  fireEvent.click(toggleAr);
  const panelAr = uiAr.getByTestId('ge-conversion-log-panel');
  assert.equal(panelAr.style.opacity, '0');
  assert.match(panelAr.style.transform, /translateX\(-32px\)/);

  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.equal(Number(panelAr.style.opacity || '0'), 1);

  fireEvent.click(uiAr.getByTestId('ge-conversion-log-close-btn'));
  await waitFor(() => {
    assert.equal(uiAr.queryByTestId('ge-conversion-log-panel'), null);
  });
});

test('computeLongitudinalPenetrationModel calculates wavelength shift, acoustic impedance mismatch, and density attenuation across penetration', () => {
  const steelModel = computeLongitudinalPenetrationModel({
    materialId: 'carbon_steel',
    thicknessMm: 25,
    frequencyMhz: 4.0,
    couplantId: 'glycerin',
    flawMode: 'none'
  });

  // 1920 / 4000 = 0.48 mm in glycerin -> 5920 / 4000 = 1.48 mm in carbon steel
  assert.equal(steelModel.couplantWavelengthMm, 0.48);
  assert.equal(steelModel.specimenWavelengthMm, 1.48);
  assert.ok(steelModel.wavelengthExpansionRatio > 3.0);
  assert.ok(steelModel.transmissionEnergyPct > 15 && steelModel.transmissionEnergyPct < 25);
  assert.ok(steelModel.backWallEnergyDensityPct < steelModel.transmissionEnergyPct);

  // Air gap without couplant blocks nearly all ultrasonic longitudinal wave transmission
  const airGapModel = computeLongitudinalPenetrationModel({
    materialId: 'carbon_steel',
    thicknessMm: 25,
    frequencyMhz: 4.0,
    couplantId: 'air_gap',
    flawMode: 'none'
  });
  assert.ok(airGapModel.reflectionEnergyPct > 99.9);
  assert.ok(airGapModel.transmissionEnergyPct < 0.1);

  // Perspex (2730 m/s) -> Lead (2160 m/s) compacts wavelength upon penetration
  const leadModel = computeLongitudinalPenetrationModel({
    materialId: 'lead',
    thicknessMm: 25,
    frequencyMhz: 4.0,
    couplantId: 'perspex',
    flawMode: 'none'
  });
  assert.ok(leadModel.wavelengthExpansionRatio < 1);
  assert.ok(leadModel.spatialWavefrontDensityPerCm > steelModel.spatialWavefrontDensityPerCm);

  // Internal crack drops retained exit wave density sharply
  const crackedSteel = computeLongitudinalPenetrationModel({
    materialId: 'carbon_steel',
    thicknessMm: 25,
    frequencyMhz: 4.0,
    couplantId: 'glycerin',
    flawMode: 'planar_crack'
  });
  assert.ok(crackedSteel.backWallEnergyDensityPct < steelModel.backWallEnergyDensityPct * 0.1);
});

test('GeRadiographicExposureTimeApp exposes Longitudinal Waves option inside #ge-exposure-calculator-app with wave shape and penetration density controls (AR & EN)', () => {
  const uiAr = render(<GeRadiographicExposureTimeApp language="ar" />);
  const appRoot = uiAr.container.querySelector('#ge-exposure-calculator-app') as HTMLElement;
  assert.ok(appRoot, 'Expected #ge-exposure-calculator-app container');

  const longitudinalOptionBtn = uiAr.getByTestId('ge-longitudinal-wave-option-btn');
  assert.ok(appRoot.contains(longitudinalOptionBtn));
  assert.ok(longitudinalOptionBtn.textContent?.includes('الموجات الطولية'));
  assert.equal(longitudinalOptionBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(uiAr.queryByTestId('ge-longitudinal-wave-simulator'), null);

  // Activate Longitudinal Waves simulator
  fireEvent.click(longitudinalOptionBtn);
  assert.equal(longitudinalOptionBtn.getAttribute('aria-pressed'), 'true');

  const sim = uiAr.getByTestId('ge-longitudinal-wave-simulator');
  assert.ok(appRoot.contains(sim), 'Expected Longitudinal Waves simulator inside #ge-exposure-calculator-app');
  assert.ok(uiAr.getByTestId('ge-longitudinal-wave-svg'));
  assert.ok(uiAr.getByTestId('ge-longitudinal-compression-bands').querySelectorAll('rect').length > 20);
  assert.ok(uiAr.getByTestId('ge-longitudinal-particle-field').querySelectorAll('circle').length > 100);
  assert.ok(uiAr.getByTestId('ge-longitudinal-waveform-path').getAttribute('d')?.startsWith('M '));
  assert.ok(uiAr.getByTestId('ge-longitudinal-envelope-upper').getAttribute('d')?.startsWith('M '));

  // Initial Carbon Steel telemetry
  assert.ok(uiAr.getByTestId('ge-longitudinal-velocity-readout').textContent?.includes('5,920'));
  assert.ok(uiAr.getByTestId('ge-longitudinal-density-readout').textContent?.includes('7.85'));
  const initialExitDensity = uiAr.getByTestId('ge-longitudinal-exit-density-readout').textContent ?? '';

  // Changing frequency increases wavefront density & alters wavelength
  fireEvent.change(uiAr.getByTestId('ge-longitudinal-freq-slider'), { target: { value: '8' } });
  assert.equal(uiAr.getByTestId('ge-longitudinal-freq-value').textContent, '8.0 MHz');
  assert.ok(uiAr.getByTestId('ge-longitudinal-wavelength-readout').textContent?.includes('0.74 mm'));

  // Changing material inside simulator syncs with calculator material select
  fireEvent.change(uiAr.getByTestId('ge-longitudinal-material-select'), { target: { value: 'aluminum' } });
  assert.equal((uiAr.getByTestId('ge-select-material') as HTMLSelectElement).value, 'aluminum');
  assert.ok(uiAr.getByTestId('ge-longitudinal-velocity-readout').textContent?.includes('6,320'));
  assert.ok(uiAr.getByTestId('ge-longitudinal-density-readout').textContent?.includes('2.70'));

  // Enabling internal planar crack adds flaw marker and lowers exit density
  fireEvent.click(uiAr.getByTestId('ge-longitudinal-flaw-planar_crack'));
  assert.ok(uiAr.getByTestId('ge-longitudinal-flaw-marker'));
  const crackedExitDensity = uiAr.getByTestId('ge-longitudinal-exit-density-readout').textContent ?? '';
  assert.notEqual(crackedExitDensity, initialExitDensity);

  // Switching couplant to dry air_gap shows impedance block status
  fireEvent.change(uiAr.getByTestId('ge-longitudinal-couplant-select'), { target: { value: 'air_gap' } });
  assert.ok(uiAr.getByTestId('ge-longitudinal-coupling-status').textContent?.includes('انعكاس شبه كلي'));

  // Playback controls: pause & step phase without throwing
  fireEvent.click(uiAr.getByTestId('ge-longitudinal-play-pause-btn'));
  fireEvent.click(uiAr.getByTestId('ge-longitudinal-step-btn'));
  assert.ok(uiAr.getByTestId('ge-longitudinal-waveform-path').getAttribute('d'));
});

