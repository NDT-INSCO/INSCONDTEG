import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/-Project-/#academy',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  StorageEvent: dom.window.StorageEvent,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16).unref(),
  cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

dom.window.scrollTo = () => {};
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

const { render, fireEvent, cleanup } = await import('@testing-library/react');
const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { UtFlawDetectorDevice } = await import(
  '../src/components/academy/virtuallab/UtFlawDetectorDevice'
);
const { PautInspectorController } = await import(
  '../src/components/academy/PautInspectorController'
);
const {
  SIMULATION_HISTORY_STORAGE_KEY,
  getSimulationHistory,
  recordSimulationAttempt,
  clearSimulationHistory,
  calculateSimulationAttemptXp,
} = await import('../src/utils/simulationHistoryStore');

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
  dom.window.history.replaceState(null, '', '/-Project-/#academy');
});

test('EducationalAcademy exposes Simulation History sub-tab and opens empty state cleanly with Level 1 milestone', () => {
  const ui = render(<EducationalAcademy language="en" />);

  // Click the 'Simulation History' sub-tab button
  const simHistoryBtn = ui.getByRole('button', { name: /Simulation History/i });
  fireEvent.click(simHistoryBtn);

  assert.equal(dom.window.location.hash, '#simulation_history');
  assert.ok(ui.getByText(/No NDT simulation attempts recorded yet/i));
  assert.equal(ui.getByTestId('sim-history-total-count').textContent, '0');
  assert.equal(ui.getByTestId('sim-history-total-xp').textContent, '0 XP');
  assert.equal(ui.getByTestId('sim-history-level-title').textContent, 'NDT Trainee');
});

test('NDT simulation attempts from UT, PAUT, and Defect simulators persist across remounts with defect types, pass/fail status, XP, and timestamp', () => {
  // 1. Log a UT weld inspection attempt from standalone UT Flaw Detector
  const utUi = render(<UtFlawDetectorDevice language="en" />);
  fireEvent.click(utUi.getByRole('button', { name: /Flat Butt Weld/i }));
  fireEvent.click(utUi.getByRole('button', { name: /Log to Results/i }));
  utUi.unmount();

  // 2. Log a PAUT attempt with mismatched verdict (FAIL) in PAUT Inspector Controller
  const pautUi = render(<PautInspectorController language="en" />);
  // Default defect is Crack (ASME REJECT); pick ACCEPT to trigger a FAIL attempt
  fireEvent.click(pautUi.getByRole('button', { name: 'ACCEPT' }));
  fireEvent.click(pautUi.getByRole('button', { name: /Record Attempt to Simulation History/i }));
  pautUi.unmount();

  // Verify raw localStorage persistence including XP and accuracy
  const rawStored = dom.window.localStorage.getItem(SIMULATION_HISTORY_STORAGE_KEY);
  assert.ok(rawStored, 'Simulation history should be written to localStorage');
  const parsed = getSimulationHistory();
  assert.equal(parsed.length, 2);
  for (const item of parsed) {
    assert.ok(item.xpEarned > 0, `Expected positive XP earned, got ${item.xpEarned}`);
    assert.ok(item.accuracyPct >= 0 && item.accuracyPct <= 100);
  }

  // 3. Mount EducationalAcademy directly on Simulation History sub-tab after unmount
  const academyUi = render(
    <EducationalAcademy language="en" initialSubTab="simulation_history" />
  );

  assert.equal(academyUi.getByTestId('sim-history-total-count').textContent, '2');
  assert.equal(academyUi.getByTestId('sim-history-pass-count').textContent, '1');
  assert.equal(academyUi.getByTestId('sim-history-fail-count').textContent, '1');

  const expectedTotalXp = parsed.reduce((acc, item) => acc + item.xpEarned, 0);
  assert.equal(
    academyUi.getByTestId('sim-history-total-xp').textContent,
    `${expectedTotalXp} XP`
  );

  const rows = academyUi.getAllByTestId('simulation-history-row');
  assert.equal(rows.length, 2);

  const xpCells = academyUi.getAllByTestId('simulation-attempt-xp');
  assert.equal(xpCells.length, 2);
  assert.match(xpCells[0].textContent || '', /^\+\d+ XP$/);

  // Check defect names, PASS / FAIL statuses, and valid ISO <time> timestamps
  const tableText = academyUi.container.textContent || '';
  assert.match(tableText, /Crack/i);
  assert.match(tableText, /PASS/);
  assert.match(tableText, /FAIL/);

  const timeElements = academyUi.container.querySelectorAll('time[datetime]');
  assert.equal(timeElements.length, 2);
  for (const tEl of timeElements) {
    const dt = tEl.getAttribute('datetime') || '';
    assert.ok(!Number.isNaN(Date.parse(dt)), `Expected valid ISO timestamp, got: ${dt}`);
  }
});

test('Experience Points (XP) scale with defect detection accuracy and trigger Level Up toast upon reaching a new milestone', () => {
  const highAccuracyXp = calculateSimulationAttemptXp({
    status: 'PASS',
    accuracyPct: 98,
    defectCount: 1,
  });
  const moderateAccuracyXp = calculateSimulationAttemptXp({
    status: 'PASS',
    accuracyPct: 72,
    defectCount: 1,
  });
  const failedAttemptXp = calculateSimulationAttemptXp({
    status: 'FAIL',
    accuracyPct: 40,
    defectCount: 1,
  });

  assert.ok(
    highAccuracyXp > moderateAccuracyXp,
    `98% accuracy PASS (${highAccuracyXp} XP) should earn more XP than 72% accuracy PASS (${moderateAccuracyXp} XP)`
  );
  assert.ok(
    moderateAccuracyXp > failedAttemptXp,
    `PASS attempt (${moderateAccuracyXp} XP) should earn more XP than FAIL attempt (${failedAttemptXp} XP)`
  );

  // Seed 1 attempt below the 100 XP Level 2 threshold (70% accuracy PASS -> 82 XP, still Level 1)
  const firstRec = recordSimulationAttempt({
    timestamp: '2026-10-24T08:00:00.000Z',
    simulatorId: 'weld_simulator',
    targetSubTab: 'weld_simulator',
    simulatorTitle: { ar: 'محاكي اللحام', en: 'Weld UT Simulator' },
    ndtMethod: 'UT',
    defectTypes: [{ id: 'slag_inclusion', ar: 'شوائب الخبث', en: 'Slag Inclusion' }],
    status: 'PASS',
    scorePct: 70,
  });
  assert.equal(firstRec.xpEarned, 82);

  // Mount EducationalAcademy on PAUT Controller (currently 82 XP -> Level 1)
  const ui = render(<EducationalAcademy language="en" initialSubTab="paut_controller" />);
  assert.equal(ui.queryByTestId('simulation-level-up-toast'), null);

  // Record an accurate PAUT inspection (Crack -> REJECT) which adds ~99 XP, crossing 100 XP -> Level 2!
  fireEvent.click(ui.getByRole('button', { name: /Record Attempt to Simulation History/i }));

  const toast = ui.getByTestId('simulation-level-up-toast');
  assert.ok(toast, 'Expected Level Up toast notification to appear on reaching Level 2');
  assert.match(toast.textContent || '', /Level Up/i);
  assert.match(toast.textContent || '', /Level 2 — NDT Level I Operator/i);

  // Click 'View Simulation History & XP' action inside the Level Up toast
  fireEvent.click(ui.getByRole('button', { name: /View Simulation History & XP/i }));
  assert.equal(dom.window.location.hash, '#simulation_history');
  assert.equal(ui.getByTestId('sim-history-level-title').textContent, 'NDT Level I Operator');
  assert.equal(ui.queryByTestId('simulation-level-up-toast'), null);
});

test('Simulation History supports Pass/Fail filtering, multi-defect logging, item deletion, and two-step Clear History', () => {
  recordSimulationAttempt({
    timestamp: '2026-10-24T08:15:00.000Z',
    simulatorId: 'weld_simulator',
    targetSubTab: 'weld_simulator',
    simulatorTitle: { ar: 'محاكي اللحام', en: 'Weld UT Simulator' },
    ndtMethod: 'UT',
    defectTypes: [
      { id: 'lack_of_fusion', ar: 'نقص الانصهار', en: 'Lack of Sidewall Fusion' },
      { id: 'slag_inclusion', ar: 'شوائب الخبث', en: 'Slag Inclusion' },
    ],
    status: 'PASS',
    codeVerdict: 'REJECT',
    traineeVerdict: 'REJECT',
    codeStandard: 'ASME Sec VIII Div.1',
    scorePct: 96,
  });

  recordSimulationAttempt({
    timestamp: '2026-10-24T09:30:00.000Z',
    simulatorId: 'paut_console',
    targetSubTab: 'paut_controller',
    simulatorTitle: { ar: 'مصفوفات PAUT', en: 'PAUT Console' },
    ndtMethod: 'PAUT',
    defectTypes: [{ id: 'porosity_cluster', ar: 'مسامية متجمعة', en: 'Cluster Porosity' }],
    status: 'FAIL',
    codeVerdict: 'ACCEPT',
    traineeVerdict: 'REJECT',
    codeStandard: 'API 1104 Sec. 9',
    scorePct: 40,
  });

  const ui = render(<EducationalAcademy language="ar" initialSubTab="simulation_history" />);

  assert.equal(ui.getByTestId('sim-history-total-count').textContent, '2');
  assert.ok(ui.getByText(/نقص الانصهار ، شوائب الخبث/));
  assert.ok(ui.getByText(/مسامية متجمعة/));

  // Filter by PASS only
  fireEvent.click(ui.getByRole('button', { name: /ناجح PASS \(1\)/i }));
  assert.equal(ui.getAllByTestId('simulation-history-row').length, 1);
  assert.ok(ui.getByText(/نقص الانصهار/));
  assert.equal(ui.queryByText(/مسامية متجمعة/), null);

  // Filter by FAIL only
  fireEvent.click(ui.getByRole('button', { name: /راسب FAIL \(1\)/i }));
  assert.equal(ui.getAllByTestId('simulation-history-row').length, 1);
  assert.ok(ui.getByText(/مسامية متجمعة/));

  // Reset to ALL
  fireEvent.click(ui.getByRole('button', { name: /الكل \(2\)/i }));
  assert.equal(ui.getAllByTestId('simulation-history-row').length, 2);

  // Delete one attempt
  fireEvent.click(ui.getByRole('button', { name: /حذف محاولة مسامية متجمعة/i }));
  assert.equal(ui.getAllByTestId('simulation-history-row').length, 1);
  assert.equal(getSimulationHistory().length, 1);

  // Two-step Clear History (no window.confirm)
  fireEvent.click(ui.getByRole('button', { name: /مسح السجل/i }));
  fireEvent.click(ui.getByRole('button', { name: /تأكيد المسح/i }));
  assert.equal(getSimulationHistory().length, 0);
  assert.ok(ui.getByText(/لا توجد محاولات محاكاة مسجلة حتى الآن/i));
});

test('Malformed localStorage data is handled gracefully without crashing Simulation History', () => {
  dom.window.localStorage.setItem(SIMULATION_HISTORY_STORAGE_KEY, '{corrupted-json');
  const ui = render(<EducationalAcademy language="en" initialSubTab="simulation_history" />);
  assert.equal(ui.getByTestId('sim-history-total-count').textContent, '0');
  clearSimulationHistory();
});
