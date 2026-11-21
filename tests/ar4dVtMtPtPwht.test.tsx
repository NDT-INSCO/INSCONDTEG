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
  AR4D_VT_MT_PT_PWHT_DISCIPLINES,
  computeVt4dTelemetry,
  computeMt4dTelemetry,
  computePt4dTelemetry,
  computePwht4dTelemetry,
  computePwhtCycleDerivatives,
} = await import('../src/data/ar4dVtMtPtPwhtEngine');

const { VtMtPtPwhtAr4dSimulator } = await import(
  '../src/components/academy/virtuallab/VtMtPtPwhtAr4dSimulator'
);
const { NdtCameraArOverlayLab } = await import(
  '../src/components/academy/virtuallab/NdtCameraArOverlayLab'
);
const { NdtVirtualLabWorkbench } = await import(
  '../src/components/academy/virtuallab/NdtVirtualLabWorkbench'
);
const { WorkshopAr4dAllBranchesLab } = await import(
  '../src/components/academy/virtuallab/WorkshopAr4dAllBranchesLab'
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

test('VT, MT, PT, and PWHT physics engines evaluate all 20 code clauses accurately across 4D phases', () => {
  assert.equal(AR4D_VT_MT_PT_PWHT_DISCIPLINES.length, 4);

  // 1. VT: Pass vs Lux / Undercut / Crack rejection
  const vtPass = computeVt4dTelemetry(
    {
      jointType: 'butt_pipe',
      wallThicknessMm: 14,
      illuminationLux: 1200,
      viewingDistanceMm: 350,
      viewingAngleDeg: 55,
      capReinforcementMm: 2.0,
      undercutDepthMm: 0.3,
      hiLoMismatchMm: 1.0,
      discontinuityLengthMm: 8,
      hasSurfaceCrackOrPin: false,
    },
    0.75
  );
  assert.equal(vtPass.overallPass, true);
  assert.equal(vtPass.codeReviews.length, 5);
  assert.equal(vtPass.phaseIndex, 2);

  const vtFail = computeVt4dTelemetry(
    {
      jointType: 'butt_pipe',
      wallThicknessMm: 14,
      illuminationLux: 700,
      viewingDistanceMm: 350,
      viewingAngleDeg: 55,
      capReinforcementMm: 2.0,
      undercutDepthMm: 0.9,
      hiLoMismatchMm: 2.2,
      discontinuityLengthMm: 15,
      hasSurfaceCrackOrPin: false,
    },
    1.0
  );
  assert.equal(vtFail.overallPass, false);
  assert.equal(vtFail.codeReviews.find((c) => c.codeId === 'ASME_V_ART9')?.verdict, 'reject');

  // 2. MT: Pass vs AC lift weight / linear crack > 1.5mm / residual > 3G
  const mtPass = computeMt4dTelemetry(
    {
      mode: 'ac_yoke',
      wallThicknessMm: 18,
      poleSpacingMm: 115,
      yokeLiftKg: 5.5,
      uvaIntensityUwCm2: 1400,
      ambientLightLux: 12,
      twoDirectionScan: true,
      residualGauss: 1.5,
      morphology: 'rounded',
      indicationSizeMm: 1.2,
      alignedCount: 1,
    },
    0.68
  );
  assert.equal(mtPass.overallPass, true);
  assert.equal(mtPass.codeReviews.length, 5);

  const mtFail = computeMt4dTelemetry(
    {
      mode: 'ac_yoke',
      wallThicknessMm: 18,
      poleSpacingMm: 115,
      yokeLiftKg: 3.5,
      uvaIntensityUwCm2: 1400,
      ambientLightLux: 12,
      twoDirectionScan: true,
      residualGauss: 5.2,
      morphology: 'linear',
      indicationSizeMm: 2.4,
      alignedCount: 1,
    },
    1.0
  );
  assert.equal(mtFail.overallPass, false);
  assert.equal(mtFail.codeReviews.find((c) => c.codeId === 'ASME_V_ART7')?.verdict, 'reject');
  assert.equal(mtFail.codeReviews.find((c) => c.codeId === 'ASTM_E709')?.verdict, 'warn');

  // 3. PT: Pass vs SS halogen > 250ppm & temp > 52C rejection
  const ptPass = computePt4dTelemetry(
    {
      systemType: 'type1_fluorescent_method_d',
      alloyGroup: 'austenitic_ss_nickel',
      wallThicknessMm: 12,
      surfaceTempC: 28,
      dwellTimeMin: 15,
      developerEvalMin: 20,
      lightLevel: 1500,
      ambientDarkLux: 10,
      halogenSulfurPpm: 90,
      morphology: 'rounded',
      indicationSizeMm: 1.2,
      alignedCount: 1,
    },
    0.9
  );
  assert.equal(ptPass.overallPass, true);
  assert.ok(ptPass.visualState.capillaryBleed01 > 0.5);

  const ptFail = computePt4dTelemetry(
    {
      systemType: 'type1_fluorescent_method_d',
      alloyGroup: 'austenitic_ss_nickel',
      wallThicknessMm: 12,
      surfaceTempC: 58,
      dwellTimeMin: 15,
      developerEvalMin: 20,
      lightLevel: 1500,
      ambientDarkLux: 10,
      halogenSulfurPpm: 420,
      morphology: 'linear',
      indicationSizeMm: 2.6,
      alignedCount: 1,
    },
    0.9
  );
  assert.equal(ptFail.overallPass, false);
  assert.equal(ptFail.codeReviews.find((c) => c.codeId === 'ASME_V_ART6')?.verdict, 'reject');

  // 4. PWHT: P4 soak & UCS-56 rates & AWS D10.10 ΔT & NACE MR0175 <= 248 HV
  const pwhtInput = {
    pNumber: 'P4' as const,
    pipeOdMm: 273,
    wallThicknessMm: 22,
    weldWidthMm: 18,
    targetSoakC: 690,
    soakHoldMin: 75,
    rampRateCPerHr: 165,
    coolRateCPerHr: 185,
    tcSpreadDeltaC: 14,
    sourServiceNace: true,
  };
  const deriv = computePwhtCycleDerivatives(pwhtInput);
  assert.ok(deriv.heatedBandMm > deriv.soakBandMm);
  assert.ok(deriv.postHardnessHv <= 248);

  const pwhtPass = computePwht4dTelemetry(pwhtInput, 0.5);
  assert.equal(pwhtPass.overallPass, true);
  assert.ok(pwhtPass.visualState.liveTempC > 650);

  const pwhtFail = computePwht4dTelemetry(
    {
      ...pwhtInput,
      targetSoakC: 615, // below P4 min 650°C
      rampRateCPerHr: 290, // exceeds UCS-56 ceiling
      tcSpreadDeltaC: 35, // exceeds AWS D10.10 25°C
    },
    0.5
  );
  assert.equal(pwhtFail.overallPass, false);
  assert.equal(pwhtFail.codeReviews.find((c) => c.codeId === 'ASME_B31_3_331')?.verdict, 'reject');
  assert.equal(pwhtFail.codeReviews.find((c) => c.codeId === 'ASME_VIII_UCS56')?.verdict, 'reject');
  assert.equal(pwhtFail.codeReviews.find((c) => c.codeId === 'AWS_D10_10')?.verdict, 'reject');
});

test('VtMtPtPwhtAr4dSimulator renders AR+3D+4D visuals, switches all 4 disciplines, detects code faults, streams camera, and logs XP', async () => {
  let stopCount = 0;
  const fakeTrack = {
    kind: 'video',
    label: 'INSCO VT/MT/PT/PWHT AR Lens',
    stop: () => {
      stopCount += 1;
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
      enumerateDevices: async () => [],
    },
  });

  const view = render(<VtMtPtPwhtAr4dSimulator language="ar" />);

  // Initial VT view shows SVG 4D VT layer & 5 VT codes
  assert.ok(view.getByTestId('vtmtptpwht-ar4d-svg-fallback'));
  assert.ok(view.getByTestId('svg-4d-vt-layer'));
  assert.ok(view.getByTestId('code-review-ASME_V_ART9'));
  assert.ok(view.getByTestId('code-review-ISO_5817_B'));

  // Switch to MT -> PT -> PWHT and verify dedicated 3D/4D layers and 5 code cards
  fireEvent.click(view.getByTestId('vtmtptpwht-tab-mt'));
  assert.ok(view.getByTestId('svg-4d-mt-layer'));
  assert.ok(view.getByTestId('code-review-ASME_VIII_APP6'));

  fireEvent.click(view.getByTestId('vtmtptpwht-tab-pt'));
  assert.ok(view.getByTestId('svg-4d-pt-layer'));
  assert.ok(view.getByTestId('code-review-ASTM_E165'));

  fireEvent.click(view.getByTestId('vtmtptpwht-tab-pwht'));
  assert.ok(view.getByTestId('svg-4d-pwht-layer'));
  assert.ok(view.getByTestId('code-review-NACE_MR0175'));

  // Inject code violation preset and confirm rejection flags appear across matrix
  fireEvent.click(view.getByTestId('vtmtptpwht-preset-fault'));
  assert.ok(view.getByText(/REJECT/));

  // Restore PASS preset
  fireEvent.click(view.getByTestId('vtmtptpwht-preset-pass'));

  // Scrub 4D timeline & click milestone 3
  const scrubber = view.getByTestId('vtmtptpwht-timeline-scrubber') as HTMLInputElement;
  fireEvent.change(scrubber, { target: { value: '66' } });
  assert.equal(scrubber.value, '66');
  fireEvent.click(view.getByTestId('vtmtptpwht-phase-btn-3'));
  assert.equal(scrubber.value, '100');

  // Toggle dock hide/show
  fireEvent.click(view.getByTestId('vtmtptpwht-dock-toggle'));
  assert.equal(view.queryByTestId('vtmtptpwht-bottom-dock'), null);
  fireEvent.click(view.getByTestId('vtmtptpwht-dock-toggle'));
  assert.ok(view.getByTestId('vtmtptpwht-bottom-dock'));

  // Start live AR camera
  fireEvent.click(view.getByTestId('vtmtptpwht-start-camera-btn'));
  await waitFor(() => {
    assert.ok(view.queryByTestId('vtmtptpwht-stop-camera-btn'));
  });
  assert.ok(view.getByText(/INSCO VT\/MT\/PT\/PWHT AR Lens/));

  // Capture PNG snapshot & verify XP logged
  fireEvent.click(view.getByTestId('vtmtptpwht-capture-xp-btn'));
  assert.ok(view.getByTestId('vtmtptpwht-snapshot-preview'));
  assert.ok(view.getByTestId('vtmtptpwht-xp-banner'));

  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].simulatorId, 'ar4d_codes_pwht');
  assert.equal(history[0].targetSubTab, 'sim_labs_ar');

  fireEvent.click(view.getByTestId('vtmtptpwht-stop-camera-btn'));
  assert.ok(stopCount >= 1);
});

test('NdtCameraArOverlayLab, NdtVirtualLabWorkbench, and WorkshopAr4dAllBranchesLab launch VT/MT/PT/PWHT AR+3D+4D Studio cleanly', () => {
  // 1. From NdtCameraArOverlayLab launcher button
  const cam = render(<NdtCameraArOverlayLab language="ar" />);
  fireEvent.click(cam.getByTestId('launch-ar4d-vt-mt-pt-pwht-btn'));
  assert.ok(cam.getByTestId('vtmtptpwht-ar4d-simulator'));
  fireEvent.click(cam.getByTestId('vtmtptpwht-back-btn'));
  assert.ok(cam.getByTestId('ar-mode-rt'));
  cleanup();

  // 2. From NdtVirtualLabWorkbench top mode bar
  const wb = render(<NdtVirtualLabWorkbench language="ar" />);
  fireEvent.click(wb.getByTestId('lab-mode-vt-mt-pt-pwht-ar4d'));
  assert.ok(wb.getByTestId('vtmtptpwht-ar4d-simulator'));
  cleanup();

  // 3. From WorkshopAr4dAllBranchesLab (pwht_metallurgy deep link preselecting PWHT)
  const allBranches = render(
    <WorkshopAr4dAllBranchesLab language="ar" initialBranchId="pwht_metallurgy" />
  );
  fireEvent.click(allBranches.getByTestId('ar4d-open-vt-mt-pt-pwht-suite'));
  assert.ok(allBranches.getByTestId('vtmtptpwht-ar4d-simulator'));
  assert.ok(allBranches.getByTestId('svg-4d-pwht-layer'));
});
