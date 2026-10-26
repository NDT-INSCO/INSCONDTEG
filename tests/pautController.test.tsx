import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { PautInspectorController } from '../src/components/academy/PautInspectorController';
import { PautOmniScanDevice } from '../src/components/academy/virtuallab/PautOmniScanDevice';
import { EducationalAcademy } from '../src/components/EducationalAcademy';
import {
  computePautSectorFlawProjections,
  computeWeldBevelHalfWidthAtDepthMm,
  polarUtToCanvas,
} from '../src/utils/pautWeldOverlayRenderer';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
});

// Mock HTML5 canvas getContext for jsdom
if (!dom.window.HTMLCanvasElement.prototype.getContext) {
  // @ts-expect-error jsdom canvas mock
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Array(4) }),
    putImageData: () => {},
    createImageData: () => ([]),
    setTransform: () => {},
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
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {},
  });
}

const { render, fireEvent, cleanup } = await import('@testing-library/react');
afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('PautInspectorController renders with all primary instrument controls in English', () => {
  const ui = render(<PautInspectorController language="en" />);

  // Title and subtitle
  assert.ok(ui.getAllByText(/PAUT INSPECTOR CONTROLLER/i).length > 0);
  assert.ok(ui.getByText(/Interactive PAUT Inspector Controller & Focal Law Engine/i));

  // Beam Angle slider (0 to 90 degrees)
  const angleSlider = ui.getByLabelText(/Beam Angle/i) as HTMLInputElement;
  assert.ok(angleSlider);
  assert.equal(angleSlider.min, '0');
  assert.equal(angleSlider.max, '90');

  // Focal depth slider
  const depthSlider = ui.getByLabelText(/Focal Depth/i) as HTMLInputElement;
  assert.ok(depthSlider);
  assert.equal(depthSlider.min, '5');
  assert.equal(depthSlider.max, '50');

  // Virtual Gain slider
  const gainSlider = ui.getByLabelText(/Virtual System Gain/i) as HTMLInputElement;
  assert.ok(gainSlider);
  assert.equal(gainSlider.min, '0');
  assert.equal(gainSlider.max, '80');

  // Element Aperture buttons
  assert.ok(ui.getByRole('button', { name: /16 Elements/i }));
  assert.ok(ui.getByRole('button', { name: /32 Elements/i }));
  assert.ok(ui.getByRole('button', { name: /64 Elements/i }));

  // Sound path, True depth, and ASME code metrics are visible
  assert.ok(ui.getByText(/Sound Path \(S\):/i));
  assert.ok(ui.getByText(/True Depth \(D\):/i));
  assert.ok(ui.getByText(/ASME STATUS:/i));
});

test('PautInspectorController allows interactive adjustment of beam angle, gain, and defect selection', () => {
  const ui = render(<PautInspectorController language="en" />);

  // Change Beam Angle to 60 via preset button
  const btn60 = ui.getByRole('button', { name: '60°' });
  fireEvent.click(btn60);
  assert.ok(ui.getByText(/BEAM: 60°/i));

  // Change Virtual Gain via +6dB button
  const plus6Btn = ui.getByRole('button', { name: '+6 dB' });
  fireEvent.click(plus6Btn);

  // Switch defect from Crack to Porosity
  const porosityBtn = ui.getByRole('button', { name: /Porosity/i });
  fireEvent.click(porosityBtn);

  // Verify defect name updated in display
  assert.ok(ui.getByText(/Select Target Defect from Simulated UT Database:/i));
  assert.ok(ui.getAllByText(/Porosity/i).length > 0);
});

test('PautInspectorController renders properly in Arabic locale', () => {
  const ui = render(<PautInspectorController language="ar" />);

  // Check Arabic titles and labels
  assert.ok(ui.getByText(/وحدة التحكم بمفتش المصفوفات الطورية/i));
  assert.ok(ui.getByText(/زاوية الشعاع/i));
  assert.ok(ui.getByText(/إعدادات قانون التركيز/i));
  assert.ok(ui.getByText(/التحكم الافتراضي بالكسب/i));
  assert.ok(ui.getByText(/المسار الصوتي/i));
});

test('EducationalAcademy mounts PautInspectorController when initialSubTab is paut_controller', () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="paut_controller" />);

  assert.ok(ui.getAllByText(/PAUT INSPECTOR CONTROLLER/i).length > 0);
  assert.ok(ui.getByLabelText(/Beam Angle/i));
});

test('PAUT S-Scan weld bevel geometry & vertical-normal polar graduation math are physically accurate', () => {
  // 1. Polar convention: 0° points straight down (+Z/Y), 90° points horizontally (+X)
  const p0 = polarUtToCanvas(50, 30, 5, 20, 0);
  assert.ok(Math.abs(p0.x - 50) < 1e-6);
  assert.ok(Math.abs(p0.y - 130) < 1e-6);

  const p90 = polarUtToCanvas(50, 30, 5, 20, 90);
  assert.ok(Math.abs(p90.x - 150) < 1e-6);
  assert.ok(Math.abs(p90.y - 30) < 1e-6);

  // 2. Single-V vs Double-V groove profiles
  const topSingleV = computeWeldBevelHalfWidthAtDepthMm(0, 20, {
    grooveType: 'single_v',
    bevelAngleDeg: 30,
    rootGapMm: 2,
    rootFaceMm: 2,
    hazWidthMm: 2.5,
    capReinforcementMm: 1.5,
  });
  const rootSingleV = computeWeldBevelHalfWidthAtDepthMm(20, 20, {
    grooveType: 'single_v',
    bevelAngleDeg: 30,
    rootGapMm: 2,
    rootFaceMm: 2,
    hazWidthMm: 2.5,
    capReinforcementMm: 1.5,
  });
  assert.ok(topSingleV > rootSingleV + 8);
  assert.equal(rootSingleV, 1.0);

  const topDoubleV = computeWeldBevelHalfWidthAtDepthMm(0, 20, {
    grooveType: 'double_v',
    bevelAngleDeg: 30,
    rootGapMm: 2,
    rootFaceMm: 2,
    hazWidthMm: 2.5,
    capReinforcementMm: 1.5,
  });
  const botDoubleV = computeWeldBevelHalfWidthAtDepthMm(20, 20, {
    grooveType: 'double_v',
    bevelAngleDeg: 30,
    rootGapMm: 2,
    rootFaceMm: 2,
    hazWidthMm: 2.5,
    capReinforcementMm: 1.5,
  });
  const midDoubleV = computeWeldBevelHalfWidthAtDepthMm(10, 20, {
    grooveType: 'double_v',
    bevelAngleDeg: 30,
    rootGapMm: 2,
    rootFaceMm: 2,
    hazWidthMm: 2.5,
    capReinforcementMm: 1.5,
  });
  assert.ok(Math.abs(topDoubleV - botDoubleV) < 1e-6);
  assert.ok(midDoubleV < topDoubleV);

  // 3. Multi-Leg (Leg 1 Direct + Leg 2 1T->2T Mirror) projections inside 40°-70° S-Scan
  const summary = computePautSectorFlawProjections({
    canvasWidth: 600,
    canvasHeight: 280,
    plateThicknessMm: 20,
    probeIndexOffsetMm: 42,
    minAngleDeg: 40,
    maxAngleDeg: 70,
    selectedAngleDeg: 50,
    showSkipMirror: true,
    flaw: {
      id: 'lack_of_fusion',
      depthMm: 11.2,
      heightMm: 2.8,
      offsetFromCenterTowardsProbeMm: 5.2,
      isPlanar: true,
    },
  });
  assert.equal(summary.projections.length, 2);
  assert.equal(summary.projections[0].leg, 1);
  assert.equal(summary.projections[1].leg, 2);
  assert.ok(Math.abs(summary.projections[1].unfoldedDepthMm - (40 - 11.2)) < 1e-6);
  assert.equal(summary.projections[1].isInsideSector, true);
});

test('PautOmniScanDevice and PautInspectorController expose interactive weld bevel & 1T/2T mirror controls inside S-Scan', () => {
  const omniUi = render(<PautOmniScanDevice language="ar" />);
  assert.ok(omniUi.getByRole('button', { name: 'شكل اللحام' }));
  assert.ok(omniUi.getByRole('button', { name: 'انعكاس 1T/2T' }));
  fireEvent.click(omniUi.getByRole('button', { name: 'X مزدوجة' }));
  fireEvent.click(omniUi.getByRole('button', { name: '37.5°' }));
  cleanup();

  const ctrlUi = render(<PautInspectorController language="en" />);
  assert.ok(ctrlUi.getByRole('button', { name: 'Weld Bevel' }));
  assert.ok(ctrlUi.getByRole('button', { name: '1T/2T Mirror' }));
  fireEvent.click(ctrlUi.getByRole('button', { name: 'Double-V' }));
  const x0Slider = ctrlUi.getByLabelText(/Probe Index Offset X0/i) as HTMLInputElement;
  fireEvent.change(x0Slider, { target: { value: '44' } });
  assert.equal(x0Slider.value, '44');
});

