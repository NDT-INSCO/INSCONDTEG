import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { ComprehensiveWeldUtSimulator } from '../src/components/academy/virtuallab/ComprehensiveWeldUtSimulator';
import {
  DacCalibrationBuilder,
  getAsmeTableT434Rule,
  getAsmeAppendix12MaxLengthMm,
} from '../src/components/academy/virtuallab/DacCalibrationBuilder';
import { NdtVirtualLabWorkbench } from '../src/components/academy/virtuallab/NdtVirtualLabWorkbench';
import { UtFlawDetectorDevice } from '../src/components/academy/virtuallab/UtFlawDetectorDevice';
import { PautOmniScanDevice } from '../src/components/academy/virtuallab/PautOmniScanDevice';
import { BeamConeAndDefectExplorer } from '../src/components/academy/virtuallab/BeamConeAndDefectExplorer';
import {
  ALL_WELD_DEFECTS_CATALOG,
  INSPECTION_CODES_META,
  computeUltrasonicBeamCone,
  getAllDefectsCodeToleranceSchedule,
  getDefectCodeTolerance,
} from '../src/data/utWeldDefectsCatalog';
import { EducationalAcademy } from '../src/components/EducationalAcademy';
import { generateWeldInspectionPdf } from '../src/utils/weldInspectionPdfGenerator';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent,
  HTMLElement: dom.window.HTMLElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16).unref(),
  cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
});

// Mock HTML5 canvas getContext & toDataURL for jsdom
// @ts-expect-error jsdom canvas mock
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  strokeRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: new Array(4) }),
  putImageData: () => {},
  createImageData: () => ([]),
  setTransform: () => {},
  translate: () => {},
  rotate: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  ellipse: () => {},
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  setLineDash: () => {},
});

dom.window.HTMLCanvasElement.prototype.toDataURL = () =>
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const { render, fireEvent, cleanup } = await import('@testing-library/react');
afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('ComprehensiveWeldUtSimulator renders UT/PAUT switchers, Flat/Curved specimen toggles, and scanning controls', () => {
  const ui = render(<ComprehensiveWeldUtSimulator language="en" />);

  assert.ok(ui.getAllByText(/Comprehensive Ultrasonic Weld Inspection/i).length > 0);

  // 5 Workflow stage buttons
  assert.ok(ui.getByRole('button', { name: /1\. Scan & Ray Trace/i }));
  assert.ok(ui.getByRole('button', { name: /2\. Full Calibration Keys/i }));
  assert.ok(ui.getByRole('button', { name: /3\. Code Evaluation/i }));
  assert.ok(ui.getByRole('button', { name: /4\. Official Test Report/i }));
  assert.ok(ui.getByRole('button', { name: /5\. 3D Beam Cone & 16 Defects/i }));

  // Instrument & Geometry switchers
  assert.ok(ui.getByRole('button', { name: /Conventional UT Device/i }));
  assert.ok(ui.getByRole('button', { name: /Phased Array PAUT Device/i }));
  assert.ok(ui.getByRole('button', { name: /Flat Butt-Weld Plate/i }));
  assert.ok(ui.getByRole('button', { name: /Curved Pipe Weld/i }));

  // Angle beam probe buttons (0° Long. + 45°, 60°, 70° Shear) & X/Y probe sliders
  assert.ok(ui.getByRole('button', { name: /0° Long\./i }));
  assert.ok(ui.getByRole('button', { name: /45° Shear/i }));
  assert.ok(ui.getByRole('button', { name: /60° Shear/i }));
  assert.ok(ui.getByRole('button', { name: /70° Shear/i }));

  const standoffSlider = ui.getByLabelText(/Probe Standoff Distance/i) as HTMLInputElement;
  assert.equal(standoffSlider.min, '10');
  assert.equal(standoffSlider.max, '80');

  const seamSlider = ui.getByLabelText(/Weld Seam Axis Position/i) as HTMLInputElement;
  assert.equal(seamSlider.min, '0');
  assert.equal(seamSlider.max, '100');
});

test('ComprehensiveWeldUtSimulator switches to Curved Pipe geometry and PAUT multi-view console', () => {
  const ui = render(<ComprehensiveWeldUtSimulator language="en" />);

  // Switch to Curved Pipe specimen
  fireEvent.click(ui.getByRole('button', { name: /Curved Pipe Weld/i }));
  assert.ok(ui.getByText(/Curved Pipe Geometry Correction/i));
  const odSelect = ui.getByLabelText(/Pipe Outer Diameter/i) as HTMLSelectElement;
  fireEvent.change(odSelect, { target: { value: '324' } });
  assert.equal(odSelect.value, '324');

  // Switch to PAUT Phased Array mode
  fireEvent.click(ui.getByRole('button', { name: /Phased Array PAUT Device/i }));
  assert.ok(ui.getByText(/OMNISCAN X3 MULTI-VIEW/i));
  assert.ok(ui.getByText(/PAUT Focal Law & Hardware Console/i));
  assert.ok(ui.getByRole('button', { name: '64E' }));
});

test('ComprehensiveWeldUtSimulator supports interactive 5-step calibration lab, -6dB sizing, code matrix, and PDF report', () => {
  const ui = render(<ComprehensiveWeldUtSimulator language="en" />);

  // Capture -6 dB drop endpoints along Y axis
  const seamSlider = ui.getByLabelText(/Weld Seam Axis Position/i);
  fireEvent.change(seamSlider, { target: { value: '43' } });
  fireEvent.click(ui.getByRole('button', { name: /Set Y1/i }));
  fireEvent.change(seamSlider, { target: { value: '57' } });
  fireEvent.click(ui.getByRole('button', { name: /Set Y2/i }));
  assert.ok(ui.getByText(/ΔL = 14\.0 mm/i));

  // Step 2: Interactive Calibration Lab & Full Hardware Keys
  fireEvent.click(ui.getByRole('button', { name: /2\. Full Calibration Keys/i }));
  assert.ok(ui.getByText(/VELOCITY & PROBE ZERO/i));
  assert.ok(ui.getByText(/PULSER & RECEIVER/i));
  assert.ok(ui.getByText(/CALIBRATION BLOCK & DAC/i));
  assert.ok(ui.getByText(/PAUT FOCAL LAW & TCG/i));
  assert.ok(ui.getByText(/5-Step Practical Calibration Procedure/i));
  fireEvent.click(ui.getByRole('button', { name: /Auto-Cal Standard/i }));
  assert.ok(ui.getByText(/5\/5 Verified/i));

  // Step 3: Code Evaluation
  fireEvent.click(ui.getByRole('button', { name: /3\. Code Evaluation/i }));
  assert.ok(ui.getByText(/Code Compliance & Flaw Acceptance Engine/i));
  assert.ok(ui.getByText(/VERDICT: REJECTED \/ UNACCEPTABLE/i));
  assert.ok(ui.getAllByText(/ASME Sec VIII Div 1/i).length > 0);

  // Step 4: Official Report + Virtual Signature Pad
  fireEvent.click(ui.getByRole('button', { name: /4\. Official Test Report/i }));
  assert.ok(ui.getByText(/Official Ultrasonic Examination Test Report/i));
  assert.ok(ui.getByText(/INSCO-UT-2026-0428/i));
  assert.ok(ui.getAllByText(/Virtual Electronic Signature Pad/i).length > 0);
  assert.ok(ui.getByRole('button', { name: /Download Signed PDF Report/i }));
});

test('generateWeldInspectionPdf builds valid PDF document for both Rejected and Accepted curved/PAUT inspections', () => {
  const doc = generateWeldInspectionPdf({
    reportNumber: 'INSCO-PAUT-2026-099',
    inspectionDate: '2026-10-24',
    clientName: 'ERC Refinery',
    facility: 'Pipe Spool Shop',
    weldJointId: 'WJ-PIPE-8IN',
    inspectorName: 'Eng. Ahmed M.',
    inspectorLevel: 'Level III',
    inspectorCertNumber: 'PAUT-9921',
    selectedCode: 'asme_viii',
    codeClauseCitation: 'ASME Sec VIII Div 1 (UW-51)',
    materialSpecification: 'API 5L X65',
    plateThicknessMm: 20,
    specimenGeometry: 'curved',
    pipeOuterDiameterMm: 219,
    instrumentMode: 'paut',
    jointType: 'Single-V Pipe Weld',
    probeModel: 'Olympus OmniScan X3',
    probeAngleDeg: 60,
    probeFrequencyMhz: 5.0,
    velocityMs: 3240,
    zeroDelayUs: 2.4,
    gainDb: 46,
    calBlockUsed: 'Curved Pipe ASME Reference Ring',
    pautApertureElements: 32,
    pautFocalDepthMm: 20,
    flawName: 'Root Crack',
    flawCategory: 'Planar',
    soundPathMm: 40.0,
    trueDepthMm: 19.2,
    surfaceDistMm: 34.6,
    flawLengthMm: 14.0,
    flawHeightMm: 3.5,
    echoAmplitudePct: 88,
    isReject: true,
    codeExplanation: 'Planar crack rejected.',
    signatureDataUrl: null,
    language: 'ar',
  });

  const pdfOutput = doc.output('arraybuffer');
  assert.ok(pdfOutput.byteLength > 1000);
});

test('NdtVirtualLabWorkbench switches across Master Workshop, DAC Builder, Standalone UT, Standalone PAUT, 3D Beam Cone, and renders Training Results underneath', () => {
  const ui = render(<NdtVirtualLabWorkbench language="ar" />);
  assert.ok(ui.getByText(/ورشة أجهزة الموجات فوق الصوتية والمصفوفات الطورية/i));
  // Training Results Panel is rendered directly beneath the workshop
  assert.ok(ui.getByText(/النتائج التدريبية وتقييم أداء الفاحص تحت ورشة العمل/i));

  fireEvent.click(ui.getByRole('button', { name: /مختبر منحنى المعايرة DAC/i }));
  assert.ok(ui.getByText(/مختبر إنشاء منحنى المعايرة DAC خطوة بخطوة وتأثير سماكة العينة/i));

  fireEvent.click(ui.getByRole('button', { name: /جهاز UT المستقل/i }));
  assert.ok(ui.getByText(/جهاز UT بجميع مفاتيحه/i));
  assert.ok(ui.getByRole('button', { name: /عينة لحام كيرف/i }));

  fireEvent.click(ui.getByRole('button', { name: /جهاز PAUT المستقل/i }));
  assert.ok(ui.getByText(/جهاز PAUT بجميع مفاتيحه/i));
  assert.ok(ui.getByRole('button', { name: /عينة كيرف/i }));

  fireEvent.click(ui.getByRole('button', { name: /كوم الأشعة 3D وموسوعة الـ 16 عيباً/i }));
  assert.ok(ui.getAllByText(/منظور ثلاثي الأبعاد لكوم الأشعة داخل اللحام/i).length > 0);
});

test('ALL_WELD_DEFECTS_CATALOG contains all 16 morphologies and computeUltrasonicBeamCone models Fresnel near-field & cone divergence', () => {
  assert.equal(ALL_WELD_DEFECTS_CATALOG.length, 16);
  const families = new Set(ALL_WELD_DEFECTS_CATALOG.map((d) => d.family));
  assert.equal(families.size, 4);

  const cone = computeUltrasonicBeamCone({
    frequencyMhz: 4.0,
    velocityMs: 3240,
    crystalDiameterMm: 10,
    isPaut: false,
  });
  // N = D^2 / (4 * lambda), lambda = 3240 / 4e6 * 1000 = 0.81 mm => N = 100 / 3.24 ≈ 30.86 mm
  assert.ok(cone.nearFieldLengthMm > 30 && cone.nearFieldLengthMm < 32);
  assert.ok(cone.halfAngleMinus20dBDeg > cone.halfAngleMinus6dBDeg);
  assert.ok(cone.width20dBAtDepthMm(50) > cone.width6dBAtDepthMm(50));
});

test('BeamConeAndDefectExplorer, UtFlawDetectorDevice, and PautOmniScanDevice integrate with live worktables and training scorecard', () => {
  let selectedFromExplorer = '';
  const explorerUi = render(
    <BeamConeAndDefectExplorer
      language="en"
      onSelectDefectForLiveSim={(id) => {
        selectedFromExplorer = id;
      }}
    />
  );
  assert.ok(explorerUi.getAllByText(/Interactive 3D Volumetric Beam Cone/i).length > 0);
  fireEvent.click(explorerUi.getByRole('button', { name: /Inspect in Live UT\/PAUT/i }));
  assert.equal(selectedFromExplorer, 'lack_of_fusion');
  cleanup();

  const utUi = render(<UtFlawDetectorDevice language="en" />);
  assert.ok(utUi.getAllByText(/Krautkrämer USM 35X/i).length > 0);
  fireEvent.click(utUi.getByRole('button', { name: /Flat Butt Weld/i }));
  fireEvent.click(utUi.getByRole('button', { name: /Log to Results/i }));
  assert.ok(utUi.getByText(/Logged to Training Results below/i));
  cleanup();

  const pautUi = render(<PautOmniScanDevice language="en" />);
  assert.ok(pautUi.getAllByText(/Olympus OmniScan/i).length > 0);
  fireEvent.click(pautUi.getByRole('button', { name: /Log PAUT Result/i }));
  assert.ok(pautUi.getByText(/PAUT inspection logged to Training Results/i));
});

test('DacCalibrationBuilder builds step-by-step ASME DAC curve, simulates specimen thickness loss, and evaluates ASME App. 12', () => {
  // Verify ASME Sec V Table T-434.2.1 & Sec VIII App. 12 helper rules
  assert.equal(getAsmeTableT434Rule(20).sdhDiameterMm, 2.5);
  assert.equal(getAsmeTableT434Rule(40).sdhDiameterMm, 3.0);
  assert.equal(getAsmeTableT434Rule(80).sdhDiameterMm, 5.0);
  assert.equal(getAsmeAppendix12MaxLengthMm(16), 6.0);
  assert.equal(getAsmeAppendix12MaxLengthMm(36), 12.0);
  assert.equal(getAsmeAppendix12MaxLengthMm(75), 19.0);

  let syncedCount = 0;
  const ui = render(
    <DacCalibrationBuilder
      language="en"
      onSyncDacPoints={(pts) => {
        syncedCount = pts.length;
      }}
    />
  );

  // Step 1: Adjust specimen thickness and verify ASME SDH & max length updates
  const thicknessSlider = ui.getByLabelText(/Weld Specimen Thickness \(t\)/i) as HTMLInputElement;
  fireEvent.change(thicknessSlider, { target: { value: '75' } });
  assert.ok(ui.getByText(/3\/16 in\. \(5\.0 mm\)/i));

  // Step 2 & 3: Record 1/4 T, 1/2 T, and 3/4 T DAC points step by step
  fireEvent.click(ui.getByRole('button', { name: /80% 1\/4T/i }));
  fireEvent.click(ui.getByRole('button', { name: /Record Peak DAC Point \(1\/4 T\)/i }));
  assert.ok(ui.getByText(/1\/4 Pts/i));
  assert.ok(ui.getByText(/Gain locked per ASME T-464\.1\.2/i));

  fireEvent.click(ui.getByRole('button', { name: /Record Peak DAC Point \(1\/2 T\)/i }));
  assert.ok(ui.getByText(/2\/4 Pts/i));

  fireEvent.click(ui.getByRole('button', { name: /Record Peak DAC Point \(3\/4 T\)/i }));
  assert.ok(ui.getByText(/3\/4 Pts/i));

  // Sync constructed DAC curve to main console
  fireEvent.click(ui.getByRole('button', { name: /Sync DAC to Main Console/i }));
  assert.equal(syncedCount, 3);

  // Step 5: Evaluate Planar vs Volumetric flaw against ASME Sec VIII App. 12
  fireEvent.click(ui.getByRole('button', { name: /Planar \(Crack \/ LOF\)/i }));
  assert.ok(ui.getByText(/ASME VERDICT: REJECTED/i));
});

test('EducationalAcademy renders ComprehensiveWeldUtSimulator + Training Results when initialSubTab is weld_simulator and DacCalibrationBuilder for dac_builder', () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="weld_simulator" />);
  assert.ok(ui.getAllByText(/Comprehensive Ultrasonic Weld Inspection/i).length > 0);
  assert.ok(ui.getByLabelText(/Probe Standoff Distance/i));
  assert.ok(ui.getByText(/Trainee Practical Inspection Results & Sizing Accuracy Scorecard/i));
  cleanup();

  const uiDac = render(<EducationalAcademy language="ar" initialSubTab="dac_builder" />);
  assert.ok(uiDac.getByText(/مختبر إنشاء منحنى المعايرة DAC خطوة بخطوة وتأثير سماكة العينة/i));
});

test('Near-Field (Fresnel) physics calculates λ, N, wedge subtraction N_eff, axial pressure, and zone advisories accurately', () => {
  const coneWithWedge = computeUltrasonicBeamCone({
    frequencyMhz: 4.0,
    velocityMs: 3240,
    crystalDiameterMm: 10,
    wedgeTravelMm: 12,
    wedgeVelocityMs: 2330,
  });

  // λ = 3240 / 4e6 * 1000 = 0.81 mm; N = 10^2 / (4 * 0.81) = 30.864 mm
  assert.ok(Math.abs(coneWithWedge.wavelengthMm - 0.81) < 0.01);
  assert.ok(Math.abs(coneWithWedge.nearFieldLengthMm - 30.86) < 0.1);
  // Wedge steel equivalent = 12 * (2330 / 3240) ≈ 8.63 mm => N_eff ≈ 22.23 mm
  assert.ok(coneWithWedge.wedgeEquivalentSteelMm > 8.5 && coneWithWedge.wedgeEquivalentSteelMm < 8.8);
  assert.ok(
    Math.abs(
      coneWithWedge.effectiveNearFieldInSpecimenMm -
        (coneWithWedge.nearFieldLengthMm - coneWithWedge.wedgeEquivalentSteelMm)
    ) < 0.05
  );

  // Inside Near Field vs Outside in Safe Far Field
  const insideZone = coneWithWedge.evaluateNearFieldZone(12.0);
  assert.equal(insideZone.zone, 'near_field');
  assert.equal(insideZone.isUnreliableAmplitudeZone, true);

  const farZone = coneWithWedge.evaluateNearFieldZone(45.0);
  assert.equal(farZone.zone, 'far_field');
  assert.equal(farZone.isUnreliableAmplitudeZone, false);

  // Natural focal peak at N_eff should approach 1.0 and decay smoothly in far field
  const peakAtNf = coneWithWedge.axialPressureAtPath(coneWithWedge.effectiveNearFieldInSpecimenMm);
  const farAt90 = coneWithWedge.axialPressureAtPath(90);
  assert.ok(peakAtNf > 0.98);
  assert.ok(farAt90 < peakAtNf && farAt90 > 0.1);
});

test('Per-defect code tolerance engine computes exact allowable tolerances across all 16 defects and 5 codes', () => {
  assert.equal(INSPECTION_CODES_META.length, 5);

  for (const codeMeta of INSPECTION_CODES_META) {
    const schedule = getAllDefectsCodeToleranceSchedule(codeMeta.id, 25);
    assert.equal(schedule.length, 16);
    for (const row of schedule) {
      assert.ok(row.tolerance.toleranceBadge.ar.length > 0);
      assert.ok(row.tolerance.toleranceBadge.en.length > 0);
      assert.ok(row.tolerance.clauseRef.length > 0);
    }
  }

  // Cracks: 0 mm across codes except API 1104 shallow star crater crack (<= 4.0 mm)
  assert.equal(getDefectCodeTolerance('root_crack', 'asme_viii', 25).isZeroTolerance, true);
  assert.equal(getDefectCodeTolerance('crater_star_crack', 'asme_viii', 25).isZeroTolerance, true);
  const apiCrater = getDefectCodeTolerance('crater_star_crack', 'api_1104', 25, { lengthMm: 3.5, heightMm: 1.0 });
  assert.equal(apiCrater.isZeroTolerance, false);
  assert.equal(apiCrater.maxLengthMm, 4.0);
  assert.equal(apiCrater.reject, false);

  // Incomplete penetration: 0 mm in ASME VIII vs Δh <= 1.0 mm in ASME B31.3 Normal Fluid Service
  assert.equal(getDefectCodeTolerance('incomplete_penetration', 'asme_viii', 25).isZeroTolerance, true);
  const b313Lop = getDefectCodeTolerance('incomplete_penetration', 'asme_b31_3', 25, { lengthMm: 10, heightMm: 0.8 });
  assert.equal(b313Lop.maxHeightOrDepthMm, 1.0);
  assert.equal(b313Lop.reject, false);

  // ASME Sec VIII Appendix 12 thickness scaling on Slag Inclusion (15mm -> 6.0mm, 30mm -> 10.0mm, 60mm -> 19.0mm)
  assert.equal(getDefectCodeTolerance('slag_inclusion', 'asme_viii', 15).maxLengthMm, 6.0);
  assert.equal(getDefectCodeTolerance('slag_inclusion', 'asme_viii', 30).maxLengthMm, 10.0);
  assert.equal(getDefectCodeTolerance('slag_inclusion', 'asme_viii', 60).maxLengthMm, 19.0);
});

test('ComprehensiveWeldUtSimulator displays interactive Near-Field calculator and updates per-defect tolerances on code switch', () => {
  const ui = render(<ComprehensiveWeldUtSimulator language="ar" />);

  // Near-Field Arabic section & live formulas
  assert.ok(ui.getByText(/منطقة المجال القريب \(Near Field \/ Fresnel Zone\) وحساباتها الفيزيائية الحية/i));
  assert.ok(ui.getByText(/λ = 0\.81 mm/i));

  // Change crystal diameter from 10mm -> 20mm and verify Total Near Field N quadruples (~123.5 mm)
  const crystalSlider = ui.getByLabelText(/قطر بلورة المجس/i);
  fireEvent.change(crystalSlider, { target: { value: '20' } });
  assert.ok(ui.getByText(/N = 123\.5 mm/i));

  // Toggle expandable All 16 Defects Code Tolerances table and switch code to API 1104
  fireEvent.click(ui.getByRole('button', { name: /جدول سماحية كل العيوب/i }));
  fireEvent.click(ui.getAllByRole('button', { name: 'API 1104' })[0]);
  assert.ok(ui.getAllByText(/L ≤ 4\.0 مم/i).length > 0);
});

test('Selecting or hovering a defect triggers visual Tooltip and Modal tolerance alerts with INSCO Academy international standards', () => {
  const ui = render(<ComprehensiveWeldUtSimulator language="ar" />);

  // Modal is closed on initial mount
  assert.equal(ui.queryByRole('dialog'), null);
  assert.equal(ui.queryByRole('tooltip'), null);

  // Hovering a defect card reveals the visual tolerance Tooltip
  const slagButtons = ui.getAllByRole('button', { name: /SL-E/i });
  fireEvent.mouseEnter(slagButtons[0].parentElement!);
  const tooltip = ui.getByRole('tooltip');
  assert.ok(tooltip.textContent?.includes('تنبيه السماحية — معايير أكاديمية إنسكو'));
  assert.ok(tooltip.textContent?.includes('ASME Sec VIII'));
  assert.ok(tooltip.textContent?.includes('API 1104'));
  fireEvent.mouseLeave(slagButtons[0].parentElement!);
  assert.equal(ui.queryByRole('tooltip'), null);

  // Clicking a defect card opens the International Standards Tolerance Alert Modal
  fireEvent.click(slagButtons[0]);
  const modal = ui.getByRole('dialog');
  assert.ok(modal.textContent?.includes('تنبيه مرئي لقيم السماحية المسموح بها — معايير أكاديمية إنسكو الدولية'));
  assert.ok(modal.textContent?.includes('ASME Sec VIII'));
  assert.ok(modal.textContent?.includes('ASME B31.3'));
  assert.ok(modal.textContent?.includes('AWS D1.1'));
  assert.ok(modal.textContent?.includes('API 1104'));
  assert.ok(modal.textContent?.includes('ISO 11666'));

  // Close modal via Escape key
  fireEvent.keyDown(window, { key: 'Escape' });
  assert.equal(ui.queryByRole('dialog'), null);

  // Can also disable Auto-Alert and still open manually via trigger button
  fireEvent.click(ui.getByRole('button', { name: /التنبيه التلقائي: مفعل/i }));
  fireEvent.click(slagButtons[0]);
  assert.equal(ui.queryByRole('dialog'), null);
  fireEvent.click(ui.getByRole('button', { name: /عرض تنبيه السماحية وفق المعايير الدولية/i }));
  assert.ok(ui.getByRole('dialog'));
  cleanup();

  // Verify EducationalAcademy Defect Simulator sub-tab also opens visual tolerance modal on defect click
  const academyUi = render(<EducationalAcademy language="ar" initialSubTab="defects" />);
  fireEvent.click(academyUi.getByRole('button', { name: /الشرخ/i }));
  const academyModal = academyUi.getByRole('dialog');
  assert.ok(academyModal.textContent?.includes('0.0 مم'));
});


