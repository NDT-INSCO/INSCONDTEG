/**
 * Containment guard for the simulation-labs page (`#sim_labs_rt`).
 *
 * The page used to open with a free-flowing row of six single-line lab buttons.
 * Each Arabic label is longer than a phone screen, so the row pushed past the
 * card and the icons ended up outside the page. These tests pin the layout that
 * replaced it: a bounded grid, fixed-size icons, and labels that wrap instead of
 * stretching. They read the rendered DOM, so a class change that reintroduces
 * the overflow fails here rather than in the browser.
 */
import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/-Project-/',
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
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16).unref(),
  cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
Object.assign(dom.window, { ResizeObserver: globalThis.ResizeObserver });
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const { render, cleanup } = await import('@testing-library/react');
const { InteractiveWorkshops } = await import('../src/components/academy/InteractiveWorkshops');

const LAB_SWITCHES = [
  'switch-ar-rt-all-codes',
  'switch-rt-panorama-ellipse-street',
  'switch-ge-exposure-time',
  'switch-ar-camera-overlay',
  'switch-digital-3d-lab',
  'switch-ndt-master-workbench',
];

function classes(el: Element): string[] {
  return (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

function isFixedSizeIcon(svg: Element): boolean {
  const cls = classes(svg);
  const width = cls.find(name => /^w-\[?\d/.test(name) && !name.includes('w-full'));
  const height = cls.find(name => /^h-\[?\d/.test(name) && !name.includes('h-auto'));
  return Boolean(width && height);
}

test('the six lab switches sit in a bounded grid, not a scrolling row', () => {
  const ui = render(<InteractiveWorkshops language="ar" />);
  const switcher = ui.getByTestId('sim-labs-switcher');

  assert.ok(classes(switcher).includes('grid'), 'the switcher must be a grid');
  assert.ok(classes(switcher).includes('min-w-0'), 'the grid must be allowed to shrink inside the page');
  assert.ok(
    classes(switcher).some(name => name === 'grid-cols-2' || name.startsWith('grid-cols-')),
    'the grid must declare an explicit column count on a phone'
  );
  assert.ok(
    classes(switcher).includes('xl:grid-cols-6') || classes(switcher).includes('lg:grid-cols-6'),
    'all six labs must share one row only where there is room for them'
  );
  assert.equal(switcher.querySelectorAll('button').length, LAB_SWITCHES.length);

  cleanup();
});

test('every lab switch keeps its icon inside its own cell', () => {
  const ui = render(<InteractiveWorkshops language="ar" />);

  for (const id of LAB_SWITCHES) {
    const button = ui.getByTestId(id);
    const cls = classes(button);

    assert.ok(cls.includes('min-w-0'), `${id} must shrink instead of overflowing its column`);
    assert.ok(!cls.includes('whitespace-nowrap'), `${id} must let its long label wrap`);

    const icon = button.querySelector('svg');
    assert.ok(icon, `${id} needs its icon`);
    assert.ok(classes(icon!).includes('shrink-0'), `${id} icon must not be squeezed by the label`);
    assert.ok(isFixedSizeIcon(icon!), `${id} icon needs an explicit width and height`);
  }

  cleanup();
});

test('the RT workbench toolbar wraps instead of pushing its tools off the card', () => {
  const ui = render(<InteractiveWorkshops language="ar" />);
  const toolbar = ui.getByTestId('rt-workbench-toolbar');
  const cls = classes(toolbar);

  assert.ok(cls.includes('flex-wrap'), 'the toolbar must wrap');
  assert.ok(cls.includes('min-w-0'), 'the toolbar must be able to shrink');

  const buttons = Array.from(toolbar.querySelectorAll('button'));
  assert.ok(buttons.length >= 4, 'the four workbench tools must still be there');
  for (const button of buttons) {
    const buttonClasses = classes(button);
    assert.ok(buttonClasses.includes('min-w-0'), 'a toolbar button must shrink with the card');
    assert.ok(!buttonClasses.includes('whitespace-nowrap'), 'a toolbar label must wrap');
    const icon = button.querySelector('svg');
    if (icon) {
      assert.ok(classes(icon).includes('shrink-0'), 'toolbar icons must not be squeezed');
      assert.ok(isFixedSizeIcon(icon), 'toolbar icons need an explicit size');
    }
  }

  cleanup();
});

test('no icon anywhere on the simulation-labs page is left unsized or squeezable', () => {
  const ui = render(<InteractiveWorkshops language="ar" />);

  const icons = Array.from(ui.container.querySelectorAll('svg.lucide'));
  assert.ok(icons.length > 10, `expected the page to draw its icons, found ${icons.length}`);

  const offenders = icons
    .filter(icon => !classes(icon).includes('shrink-0') || !isFixedSizeIcon(icon))
    .map(icon => `${classes(icon).join(' ')} :: ${icon.parentElement?.textContent?.slice(0, 40) ?? ''}`);

  assert.deepEqual(offenders, [], `icons that can escape their box:\n${offenders.join('\n')}`);
  cleanup();
});

test('no element on the page asks for a single-line layout', () => {
  const ui = render(<InteractiveWorkshops language="ar" />);
  const nowrap = Array.from(ui.container.querySelectorAll('.whitespace-nowrap')).map(
    el => `${el.tagName}: ${el.textContent?.slice(0, 50) ?? ''}`
  );
  assert.deepEqual(nowrap, [], `single-line labels that cannot fit a phone:\n${nowrap.join('\n')}`);
  cleanup();
});
