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

// Stub HTMLMediaElement play/pause in JSDOM
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
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { NdtCameraArOverlayLab } = await import(
  '../src/components/academy/virtuallab/NdtCameraArOverlayLab'
);
const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { readAcademyTab } = await import('../src/academyTabs');
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

test('NdtCameraArOverlayLab streams via MediaDevices API, overlays RT/UT/VT NDT guides, logs XP, and stops tracks', async () => {
  let trackStoppedCount = 0;
  let requestedConstraints: MediaStreamConstraints | null = null;

  const fakeTrack = {
    kind: 'video',
    label: 'INSCO Field Inspection Cam',
    stop: () => {
      trackStoppedCount += 1;
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
      getUserMedia: async (constraints: MediaStreamConstraints) => {
        requestedConstraints = constraints;
        return fakeStream;
      },
      enumerateDevices: async () => [
        { kind: 'videoinput', deviceId: 'cam-rear', label: 'Rear Industrial Camera' },
        { kind: 'videoinput', deviceId: 'cam-front', label: 'Front Camera' },
      ],
    },
  });

  const view = render(<NdtCameraArOverlayLab language="ar" />);

  // Click Start Live Camera
  const startBtn = view.getByTestId('start-ndt-camera-btn');
  fireEvent.click(startBtn);

  await waitFor(() => {
    assert.ok(view.queryByTestId('stop-ndt-camera-btn'));
  });

  assert.ok(requestedConstraints);
  assert.equal(requestedConstraints?.audio, false);
  assert.ok(view.getByText(/INSCO Field Inspection Cam/));
  assert.ok(view.getByTestId('ar-svg-rt-group'));

  // Switch to UT Skip & Live A-Scan AR Overlay
  fireEvent.click(view.getByTestId('ar-mode-ut'));
  assert.ok(view.getByTestId('ar-svg-ut-group'));
  assert.ok(view.getByText(/LIVE A-SCAN/));

  // Switch to VT Weld Gauge & MT Yoke AR Overlay
  fireEvent.click(view.getByTestId('ar-mode-vt-mt'));
  assert.ok(view.getByTestId('ar-svg-vt-mt-group'));
  assert.ok(view.getByText(/VT CAP GAUGE/));

  // Capture annotated snapshot & verify XP recorded in simulationHistoryStore
  fireEvent.click(view.getByTestId('capture-ar-snapshot-btn'));
  assert.ok(view.getByTestId('captured-ar-snapshot-panel'));
  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].targetSubTab, 'sim_labs_ar');
  assert.ok(history[0].xpEarned > 0);

  // Stop camera and verify MediaStreamTrack.stop() was invoked
  fireEvent.click(view.getByTestId('stop-ndt-camera-btn'));
  assert.ok(trackStoppedCount >= 1);
});

test('NdtCameraArOverlayLab handles denied camera permission gracefully and allows Calibration Backdrop fallback', async () => {
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => {
        const denied = new Error('Permission denied');
        denied.name = 'NotAllowedError';
        throw denied;
      },
      enumerateDevices: async () => [],
    },
  });

  const view = render(<NdtCameraArOverlayLab language="ar" />);
  fireEvent.click(view.getByTestId('start-ndt-camera-btn'));

  await waitFor(() => {
    assert.ok(view.getByTestId('camera-error-alert'));
  });

  // Switch to Calibration Backdrop Mode and verify capture button becomes enabled
  fireEvent.click(view.getByTestId('toggle-calibration-backdrop-btn'));
  const captureBtn = view.getByTestId('capture-ar-snapshot-btn') as HTMLButtonElement;
  assert.equal(captureBtn.disabled, false);
});

test('Simulation Labs in EducationalAcademy exposes both dedicated sim_labs_ar tab and embedded RT Workbench camera toggle', () => {
  assert.equal(readAcademyTab('#sim_labs_ar'), 'sim_labs_ar');

  const view = render(<EducationalAcademy language="ar" initialSubTab="sim_labs_rt" />);

  // Embedded Camera AR toggle inside Panorama/Ellipse/Street Workbench
  const embeddedToggle = view.getByTestId('rt-workbench-camera-toggle');
  fireEvent.click(embeddedToggle);
  assert.ok(view.getByTestId('ndt-camera-ar-overlay-lab'));

  // Dedicated child sub-tab under Hub 3 ('معامل المحاكاة')
  fireEvent.click(view.getByTestId('academy-subtab-sim-labs-ar'));
  assert.ok(view.getByTestId('ndt-camera-ar-overlay-lab'));
});
