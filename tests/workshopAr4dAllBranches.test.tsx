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
  WORKSHOP_AR4D_BRANCHES,
  computeWorkshop4dTelemetry,
  mapDisciplineToAr4dBranch,
} = await import('../src/data/workshopAr4dBranchesData');
const { WorkshopAr4dAllBranchesLab } = await import(
  '../src/components/academy/virtuallab/WorkshopAr4dAllBranchesLab'
);
const { NdtVirtualLabWorkbench } = await import(
  '../src/components/academy/virtuallab/NdtVirtualLabWorkbench'
);
const { NdtCameraArOverlayLab } = await import(
  '../src/components/academy/virtuallab/NdtCameraArOverlayLab'
);
const { AcademyDisciplinePage } = await import('../src/components/academy/AcademyDisciplinePage');
const { getSimulationHistory, clearSimulationHistory } = await import(
  '../src/utils/simulationHistoryStore'
);
const { consumePendingAr4dBranch } = await import('../src/utils/workshopAr4dSelection');
const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  clearSimulationHistory();
  consumePendingAr4dBranch();
});

afterEach(() => {
  cleanup();
});

test('all 8 INSCO work branches compute accurate 4D chronological telemetry and map from disciplines', () => {
  assert.equal(WORKSHOP_AR4D_BRANCHES.length, 8);

  for (const branch of WORKSHOP_AR4D_BRANCHES) {
    const start = computeWorkshop4dTelemetry(branch, 0, branch.param1Default, branch.param2Default);
    const mid = computeWorkshop4dTelemetry(branch, 0.55, branch.param1Default, branch.param2Default);
    const end = computeWorkshop4dTelemetry(branch, 1.0, branch.param1Default, branch.param2Default);

    assert.equal(start.phaseIndex, 0);
    assert.ok(mid.phaseIndex >= 1);
    assert.equal(end.phaseIndex, 3);
    assert.ok(mid.metric1Value.length > 0);
    assert.ok(mid.metric2Value.length > 0);
    assert.ok(mid.metric3Value.length > 0);
    assert.ok(end.codeVerdictAr.length > 0);
  }

  assert.equal(mapDisciplineToAr4dBranch('pwht_metallurgy'), 'pwht_metallurgy');
  assert.equal(mapDisciplineToAr4dBranch('ndt_advanced'), 'ut_paut');
  assert.equal(mapDisciplineToAr4dBranch('welding_inspection'), 'welding_hydro');
  assert.equal(mapDisciplineToAr4dBranch('asset_integrity_rope'), 'asset_integrity_irata');
});

test('WorkshopAr4dAllBranchesLab switches across all 8 branches, scrubs 4D dock, streams camera, and logs XP', async () => {
  let stopCount = 0;
  const fakeTrack = {
    kind: 'video',
    label: 'INSCO Multi-Branch Field Cam',
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

  const view = render(<WorkshopAr4dAllBranchesLab language="ar" />);

  // Verify all 8 branch selector cards switch cleanly and render synchronized 4D display
  for (const branch of WORKSHOP_AR4D_BRANCHES) {
    fireEvent.click(view.getByTestId(`ar4d-branch-${branch.id}`));
    assert.ok(view.getAllByText(branch.titleAr).length >= 1);
    assert.ok(view.getByTestId('workshop-ar4d-3d-fallback'));
  }

  // Verify 4D timeline scrubber updates telemetry phase & pause/collapse controls work
  const scrubber = view.getByTestId('ar4d-timeline-scrubber') as HTMLInputElement;
  fireEvent.change(scrubber, { target: { value: '100' } });
  assert.equal(scrubber.value, '100');

  fireEvent.click(view.getByTestId('ar4d-play-toggle'));
  fireEvent.click(view.getByTestId('ar4d-dock-toggle'));
  assert.equal(view.queryByTestId('ar4d-bottom-dock'), null);
  fireEvent.click(view.getByTestId('ar4d-dock-toggle'));
  assert.ok(view.getByTestId('ar4d-bottom-dock'));

  // Adjust parameters & start AR Camera
  const p1Slider = view.getByTestId('ar4d-param1-slider') as HTMLInputElement;
  fireEvent.change(p1Slider, { target: { value: String(WORKSHOP_AR4D_BRANCHES[7].param1Max) } });

  fireEvent.click(view.getByTestId('ar4d-start-camera-btn'));
  await waitFor(() => {
    assert.ok(view.queryByTestId('ar4d-stop-camera-btn'));
  });
  assert.ok(view.getByText(/INSCO Multi-Branch Field Cam/));

  // Capture annotated snapshot & verify XP entry
  fireEvent.click(view.getByTestId('ar4d-record-xp-btn'));
  assert.ok(view.getByTestId('ar4d-snapshot-preview'));
  assert.ok(view.getByTestId('ar4d-xp-logged-banner'));

  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].targetSubTab, 'sim_labs_ar');
  assert.ok(history[0].xpEarned > 0);

  fireEvent.click(view.getByTestId('ar4d-stop-camera-btn'));
  assert.ok(stopCount >= 1);
});

test('NdtVirtualLabWorkbench, NdtCameraArOverlayLab, and AcademyDisciplinePage launch All-8 AR+4D Simulators seamlessly', () => {
  // 1. NdtVirtualLabWorkbench launcher button
  const wb = render(<NdtVirtualLabWorkbench language="ar" />);
  fireEvent.click(wb.getByTestId('lab-mode-ar-4d-all-branches'));
  assert.ok(wb.getByTestId('workshop-ar4d-all-branches-lab'));
  cleanup();

  // 2. NdtCameraArOverlayLab launcher + back button
  const cam = render(<NdtCameraArOverlayLab language="ar" />);
  fireEvent.click(cam.getByTestId('launch-ar-4d-all-branches-btn'));
  assert.ok(cam.getByTestId('workshop-ar4d-all-branches-lab'));
  fireEvent.click(cam.getByTestId('ar4d-back-to-quick-btn'));
  assert.ok(cam.getByTestId('ar-mode-rt'));
  cleanup();

  // 3. AcademyDisciplinePage preselection into NdtCameraArOverlayLab
  let navigatedHash = '';
  const disc = render(
    <AcademyDisciplinePage
      language="ar"
      disciplineId="pwht_metallurgy"
      onOpenHash={(h) => {
        navigatedHash = h;
      }}
    />
  );
  fireEvent.click(disc.getByTestId('discipline-ar4d-launch-pwht_metallurgy'));
  assert.equal(navigatedHash, '#sim_labs_ar');
  cleanup();

  const arFromDiscipline = render(<NdtCameraArOverlayLab language="ar" />);
  assert.ok(arFromDiscipline.getByTestId('workshop-ar4d-all-branches-lab'));
  assert.ok(
    arFromDiscipline.getAllByText(/المعالجة الحرارية بعد اللحام 65 kW وعلم المعادن/).length >= 2
  );
});
