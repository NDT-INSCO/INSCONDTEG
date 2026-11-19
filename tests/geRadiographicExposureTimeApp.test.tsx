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
  GeRadiographicExposureTimeApp,
  buildConversionLogCsv,
  getUnitConversionFormula
} from '../src/components/academy/virtuallab/GeRadiographicExposureTimeApp';
import { NdtVirtualLabWorkbench } from '../src/components/academy/virtuallab/NdtVirtualLabWorkbench';
import { RadiographicTestingLab } from '../src/components/academy/virtuallab/RadiographicTestingLab';
import { InteractiveWorkshops } from '../src/components/academy/InteractiveWorkshops';
import { ArCompleteRtCodeSimulator } from '../src/components/academy/virtuallab/ArCompleteRtCodeSimulator';
import { generateGeRadiographicExposurePdf } from '../src/utils/geRadiographicExposurePdfGenerator';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event
});

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:mock-pdf-url';
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = () => {};
}

const { render, fireEvent, cleanup, screen, waitFor } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
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

test('GeRadiographicExposureTimeApp records up to 5 conversions in the Conversion Log inside the unit toggler', () => {
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

  // Close panel
  fireEvent.click(ui.getByTestId('ge-conversion-log-close-btn'));
  assert.equal(ui.queryByTestId('ge-conversion-log-panel'), null);

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
  assert.equal(ui.queryByTestId('ge-conversion-log-panel'), null, 'Panel should close after applying snapshot');
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
  const quickSwitch = ui.getByTestId('ge-quick-units-switch');

  assert.ok(quickBar.contains(sparkline), 'Expected D3 sparkline container inside #ge-quick-units-bar');
  assert.ok(quickBar.contains(sparklineSvg), 'Expected D3 sparkline SVG inside #ge-quick-units-bar');
  assert.equal(sparklineSummary.textContent, 'M:0/I:0');
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-point-0'), null);
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-path'), null);

  // 1st toggle: metric -> imperial
  fireEvent.click(quickSwitch);
  assert.equal(sparklineSummary.textContent, 'M:0/I:1');
  const firstPoint = ui.getByTestId('ge-quick-units-sparkline-point-0');
  assert.equal(firstPoint.getAttribute('fill'), '#f59e0b');

  // Toggle 4 more times (total 5 entries: M->I, I->M, M->I, I->M, M->I => M:2 / I:3)
  for (let i = 0; i < 4; i++) {
    fireEvent.click(quickSwitch);
  }
  assert.equal(sparklineSummary.textContent, 'M:2/I:3');
  const trendPath = ui.getByTestId('ge-quick-units-sparkline-path');
  assert.ok(trendPath.getAttribute('d')?.startsWith('M'), 'Expected valid SVG path string generated by D3');
  assert.ok(ui.getByTestId('ge-quick-units-sparkline-point-4'));
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-point-5'), null);

  // 6th toggle: I->M drops oldest M->I, leaving M:3 / I:2 over last 5 entries
  fireEvent.click(quickSwitch);
  assert.equal(sparklineSummary.textContent, 'M:3/I:2');
  assert.equal(ui.queryByTestId('ge-quick-units-sparkline-point-5'), null);

  // Clearing conversion log resets sparkline counts & points
  fireEvent.click(ui.getByTestId('ge-quick-units-history-toggle'));
  fireEvent.click(ui.getByTestId('ge-quick-units-history-clear'));
  assert.equal(sparklineSummary.textContent, 'M:0/I:0');
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











