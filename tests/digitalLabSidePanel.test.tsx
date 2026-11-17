import React from 'react';
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  requestAnimationFrame: (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16).unref(),
  cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
});

Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
});

Object.assign(dom.window, {
  ResizeObserver: globalThis.ResizeObserver,
});

// Mock 2D Canvas Context for A-Scan, D3, and procedural textures in headless JSDOM
dom.window.HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === 'webgl' || contextId === 'webgl2') return null;
  return {
    clearRect() {},
    fillRect() {},
    strokeRect() {},
    getImageData: () => ({ data: new Array(4) }),
    putImageData() {},
    createImageData: () => [],
    setTransform() {},
    translate() {},
    rotate() {},
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
    strokeText() {},
    save() {},
    restore() {},
    setLineDash() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
    measureText() {
      return { width: 42 };
    },
  } as unknown as CanvasRenderingContext2D;
} as unknown as typeof dom.window.HTMLCanvasElement.prototype.getContext;

const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');
const { VirtualLab } = await import('../src/components/academy/VirtualLab');
const { InteractiveWorkshops } = await import('../src/components/academy/InteractiveWorkshops');

describe('Digital Lab Side Settings Panel & Instant 3D Scene Sync', () => {
  afterEach(() => {
    cleanup();
    dom.window.localStorage.clear();
  });

  it('renders the side settings panel by default in Arabic and toggles open/closed cleanly', async () => {
    const view = render(<VirtualLab language="ar" />);

    const panel = view.getByTestId('digital-lab-side-settings-panel');
    assert.ok(panel, 'Side settings panel should be visible by default');
    assert.match(panel.textContent || '', /ضبط المتغيرات التقنية للمختبر الرقمي/);

    const toggleBtn = view.getByTestId('toggle-digital-lab-sidebar');
    assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');

    fireEvent.click(toggleBtn);
    assert.equal(view.queryByTestId('digital-lab-side-settings-panel'), null);
    assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');

    fireEvent.click(toggleBtn);
    assert.ok(view.getByTestId('digital-lab-side-settings-panel'));
  });

  it('immediately updates the 3D UT scene telemetry when transducer frequency and refraction angle change', async () => {
    const view = render(<VirtualLab language="ar" />);

    const telemetry = await waitFor(() => view.getByTestId('three-scene-live-telemetry'));
    assert.match(telemetry.textContent || '', /UT f = 4\.00 MHz/);

    // Adjust Transducer Frequency slider to 2.25 MHz
    const freqSlider = view.getByTestId('side-panel-freq-slider');
    fireEvent.change(freqSlider, { target: { value: '2.25' } });

    assert.equal(view.getByTestId('side-panel-freq-value').textContent, '2.25 MHz');
    assert.match(
      view.getByTestId('three-scene-live-telemetry').textContent || '',
      /UT f = 2\.25 MHz/
    );

    // Adjust Refraction Angle slider to 70° -> switches to 3D Angle Weld scene and updates ∠70° immediately
    const angleSlider = view.getByTestId('side-panel-angle-slider');
    fireEvent.change(angleSlider, { target: { value: '70' } });

    assert.equal(view.getByTestId('side-panel-angle-value').textContent, '70°');
    assert.match(
      view.getByTestId('three-scene-live-telemetry').textContent || '',
      /∠70°/
    );
  });

  it('immediately switches to and updates the 3D MT Yoke scene when magnetic field strength changes, and resets cleanly', async () => {
    const view = render(<VirtualLab language="en" />);

    await waitFor(() => view.getByTestId('three-scene-live-telemetry'));

    // Adjust Magnetic Field Strength (H) slider to 4.5 kA/m
    const magSlider = view.getByTestId('side-panel-mag-slider');
    fireEvent.change(magSlider, { target: { value: '4.5' } });

    assert.equal(view.getByTestId('side-panel-mag-value').textContent, '4.5 kA/m');

    const telemetryText = view.getByTestId('three-scene-live-telemetry').textContent || '';
    assert.match(telemetryText, /MT AC · H = 4\.5 kA\/m/);

    // Click Reset in Side Panel -> restores 3.6 kA/m, 4.00 MHz, 60°
    fireEvent.click(view.getByTestId('side-panel-reset-btn'));
    assert.equal(view.getByTestId('side-panel-freq-value').textContent, '4.00 MHz');
    assert.equal(view.getByTestId('side-panel-angle-value').textContent, '60°');
    assert.equal(view.getByTestId('side-panel-mag-value').textContent, '3.6 kA/m');
  });

  it('allows opening the 3D Digital Lab & Side Settings directly from Simulation Labs (InteractiveWorkshops)', async () => {
    const view = render(<InteractiveWorkshops language="ar" />);

    const open3dLabBtn = view.getByTestId('switch-digital-3d-lab');
    fireEvent.click(open3dLabBtn);

    const sidePanel = await waitFor(() => view.getByTestId('digital-lab-side-settings-panel'));
    assert.ok(sidePanel);
  });
});
