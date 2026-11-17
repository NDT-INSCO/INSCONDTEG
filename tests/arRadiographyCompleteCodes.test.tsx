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
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  SVGElement: dom.window.SVGElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

dom.window.HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === 'webgl' || contextId === 'webgl2') return null;
  return {
    clearRect() {},
    fillRect() {},
    strokeRect() {},
    drawImage() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    arc() {},
    ellipse() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    rect() {},
    roundRect() {},
    stroke() {},
    fill() {},
    fillText() {},
    save() {},
    restore() {},
    setLineDash() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    measureText() {
      return { width: 42 };
    },
  } as unknown as CanvasRenderingContext2D;
} as unknown as typeof dom.window.HTMLCanvasElement.prototype.getContext;

const {
  AR_RT_CODE_TECHNIQUES,
  AR_RT_FILM_DEFECTS,
  AR_RT_ACCEPTANCE_CODES,
  computeArRtTechniquePhysics,
  computeFilmDensityProfile,
  evaluateDefectAcrossAllCodes,
} = await import('../src/data/arRadiographyCompleteEngine');
const { ArCompleteRtCodeSimulator } = await import(
  '../src/components/academy/virtuallab/ArCompleteRtCodeSimulator'
);
const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { NdtCameraArOverlayLab } = await import(
  '../src/components/academy/virtuallab/NdtCameraArOverlayLab'
);
const { getSimulationHistory, clearSimulationHistory } = await import(
  '../src/utils/simulationHistoryStore'
);
const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  clearSimulationHistory();
});

afterEach(() => {
  cleanup();
});

test('AR Radiography Engine covers all 8 code techniques, all 18 film defects, and optical density physics', () => {
  assert.equal(AR_RT_CODE_TECHNIQUES.length, 8);
  assert.equal(AR_RT_FILM_DEFECTS.length, 18);
  assert.equal(AR_RT_ACCEPTANCE_CODES.length, 7);

  // Verify DWDI Elliptical rejects OD > 88.9 mm per ASME Sec V T-271.2
  const invalidEllipse = computeArRtTechniquePhysics({
    techniqueId: 'dwdi_elliptical',
    sourceId: 'ir192',
    pipeOdMm: 168.3,
    wallThicknessMm: 8.0,
    sfdMm: 500,
    beamOffsetDeg: 18,
  });
  assert.equal(invalidEllipse.geometryCompliant, false);

  // Verify Panoramic 360° uses SFD = OD / 2 and single exposure
  const validPanoramic = computeArRtTechniquePhysics({
    techniqueId: 'swsi_panoramic',
    sourceId: 'se75',
    pipeOdMm: 406.4,
    wallThicknessMm: 10.0,
    sfdMm: 203.2,
    beamOffsetDeg: 0,
  });
  assert.equal(validPanoramic.minExposuresRequired, 1);
  assert.equal(validPanoramic.overallCodeCompliant, true);

  // Verify Tungsten Inclusion lowers optical density (bright white on radiograph) while LOP raises density (dark)
  const tungstenSpec = AR_RT_FILM_DEFECTS.find((d) => d.id === 'tungsten_inclusion')!;
  const lopSpec = AR_RT_FILM_DEFECTS.find((d) => d.id === 'incomplete_penetration')!;
  const tungstenScan = computeFilmDensityProfile({
    baseDensityHd: 2.6,
    defect: tungstenSpec,
    defectLengthMm: 3,
    defectWidthMm: 2,
    stationXMm: 100,
  });
  const lopScan = computeFilmDensityProfile({
    baseDensityHd: 2.6,
    defect: lopSpec,
    defectLengthMm: 18,
    defectWidthMm: 2,
    stationXMm: 100,
  });
  assert.ok(tungstenScan.stationOpticalDensityHd < 2.0, 'Tungsten must produce bright low-density peak');
  assert.ok(lopScan.stationOpticalDensityHd > 3.1, 'LOP must produce dark high-density peak');
});

test('Multi-Code Acceptance Engine accurately captures real cross-code distinctions across all 7 codes', () => {
  // Case 1: Shallow Crater Crack (3.5 mm) -> REJECT in ASME VIII UW-51 & AWS D1.1, ACCEPT in API 1104 Sec. 9.3.10
  const craterVerdicts = evaluateDefectAcrossAllCodes({
    defectId: 'crack_crater',
    wallThicknessMm: 12.0,
    indicationLengthMm: 3.5,
    indicationWidthMm: 2.5,
    indicationDepthMm: 1.5,
    indicationCount: 1,
    weldEvalWindowMm: 300,
  });
  const uw51Crater = craterVerdicts.find((v) => v.codeId === 'ASME_VIII_UW51')!;
  const apiCrater = craterVerdicts.find((v) => v.codeId === 'API_1104')!;
  const awsCrater = craterVerdicts.find((v) => v.codeId === 'AWS_D1_1')!;
  assert.equal(uw51Crater.verdict, 'REJECT');
  assert.equal(awsCrater.verdict, 'REJECT');
  assert.equal(apiCrater.verdict, 'ACCEPT');

  // Case 2: Scattered Porosity (2.5 mm in 6 mm thin wall) -> REJECT in UW-51 (t/3=2.0mm), ACCEPT in UW-52 Spot RT!
  const spotPorosityVerdicts = evaluateDefectAcrossAllCodes({
    defectId: 'porosity_scattered',
    wallThicknessMm: 6.0,
    indicationLengthMm: 2.5,
    indicationWidthMm: 2.5,
    indicationDepthMm: 1.2,
    indicationCount: 3,
    weldEvalWindowMm: 150,
  });
  assert.equal(spotPorosityVerdicts.find((v) => v.codeId === 'ASME_VIII_UW51')!.verdict, 'REJECT');
  assert.equal(spotPorosityVerdicts.find((v) => v.codeId === 'ASME_VIII_UW52')!.verdict, 'ACCEPT');
});

test('ArCompleteRtCodeSimulator streams AR camera, updates all 8 techniques & 18 defects, grades inspector verdicts, and stops tracks', async () => {
  let stoppedCount = 0;
  const fakeTrack = {
    kind: 'video',
    label: 'AR Radiography Field Lens',
    stop: () => {
      stoppedCount += 1;
    },
    getSettings: () => ({ width: 1280, height: 720 }),
  };
  const fakeStream = {
    getTracks: () => [fakeTrack],
    getVideoTracks: () => [fakeTrack],
  } as unknown as MediaStream;

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => fakeStream,
      enumerateDevices: async () => [
        { kind: 'videoinput', deviceId: 'cam-1', label: 'AR Radiography Field Lens' },
      ],
    },
  });

  const view = render(<ArCompleteRtCodeSimulator language="ar" />);

  // Start Live AR Camera
  fireEvent.click(view.getByTestId('ar-rt-start-camera-btn'));
  await waitFor(() => {
    assert.ok(view.queryByTestId('ar-rt-stop-camera-btn'));
  });
  assert.ok(view.getByText(/AR Radiography Field Lens/));

  // Switch Technique to Tangential Profile
  fireEvent.click(view.getByTestId('select-ar-tech-tangential_profile'));
  assert.match(view.getByTestId('ar-rt-live-hud-summary').textContent || '', /Tangential Corrosion/);

  // Switch to Pillar 2 (All 18 Film Defects), select Crater Crack, and verify length slider updates
  fireEvent.click(view.getByTestId('pillar-tab-defects'));
  fireEvent.click(view.getByTestId('select-film-defect-crack_crater'));
  assert.equal(view.getByTestId('defect-length-readout').textContent, '3.5 mm');

  // Switch to Pillar 3 (All-Codes Acceptance Criteria), verify UW-51 vs API 1104 verdicts, and submit inspector verdict
  fireEvent.click(view.getByTestId('pillar-tab-codes'));
  assert.match(
    view.getByTestId('code-verdict-status-ASME_VIII_UW51').textContent || '',
    /REJECT/
  );
  assert.match(
    view.getByTestId('code-verdict-status-API_1104').textContent || '',
    /ACCEPT/
  );

  // Submit correct REJECT verdict for default target code ASME_VIII_UW51 -> logs XP!
  fireEvent.click(view.getByTestId('submit-verdict-reject'));
  assert.ok(view.getByTestId('inspector-verdict-feedback'));
  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].status, 'PASS');
  assert.ok(history[0].xpEarned > 0);

  // Capture Composite AR Report
  fireEvent.click(view.getByTestId('ar-rt-capture-report-btn'));
  assert.ok(view.getByTestId('ar-rt-captured-report-card'));

  // Stop AR Camera & verify track cleanup
  fireEvent.click(view.getByTestId('ar-rt-stop-camera-btn'));
  assert.ok(stoppedCount >= 1);
});

test('Complete AR RT Simulator is accessible from EducationalAcademy Hub 3 and NdtCameraArOverlayLab', () => {
  const academyView = render(<EducationalAcademy language="ar" initialSubTab="ar_rt_codes" />);
  assert.ok(academyView.getByTestId('ar-complete-rt-code-simulator'));
  cleanup();

  const camLabView = render(<NdtCameraArOverlayLab language="ar" />);
  fireEvent.click(camLabView.getByTestId('launch-ar-complete-rt-codes-btn'));
  assert.ok(camLabView.getByTestId('ar-complete-rt-code-simulator'));
});
