import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  playCalibrationClick,
  playCalibrationSuccessPing,
  playDefectDetectedPing,
  playProbeScanTick,
  readNdtAudioPreferences,
  resetNdtAudioCooldowns,
  writeNdtAudioPreferences,
} from '../src/utils/ndtAudioFeedback';
import {
  clearDiscoveredDefects,
  deriveDefectSeverity,
  entryTo3DWireframeSpec,
  logDiscoveredDefect,
  readDiscoveredDefects,
  removeDiscoveredDefect,
} from '../src/utils/discoveredDefectsStore';
import { NdtAudioControlChip } from '../src/components/academy/virtuallab/NdtAudioControlChip';
import {
  DiscoveredDefectsLogTable,
  computeNormalizedSpecimenSpot,
} from '../src/components/academy/virtuallab/DiscoveredDefectsLogTable';
import { VirtualLab } from '../src/components/academy/VirtualLab';
import { UtThreeScene } from '../src/components/academy/virtuallab/UtThreeScene';
import { BeamConeAndDefectExplorer } from '../src/components/academy/virtuallab/BeamConeAndDefectExplorer';
import {
  DefectFrequencyD3Chart,
  WELDING_ERROR_CATEGORIES,
  aggregateDefectFrequencyByCategory,
  classifyDiscoveredDefectBucket,
} from '../src/components/academy/virtuallab/DefectFrequencyD3Chart';
import { V1V2CalibrationLab } from '../src/components/academy/virtuallab/V1V2CalibrationLab';
import { V1V2ThreeScene } from '../src/components/academy/virtuallab/V1V2ThreeScene';
import {
  CALIBRATION_CODES,
  CALIBRATION_WORKFLOW_STEPS,
  V1_BLOCK_METADATA,
  V1_BLOCK_REFLECTORS,
  V2_BLOCK_METADATA,
  V2_BLOCK_REFLECTORS,
  computeCalibrationPhysics,
} from '../src/data/v1v2CalibrationData';
import { getSimulationHistory } from '../src/utils/simulationHistoryStore';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/-Project-/#academy',
});

// Track procedural Web Audio oscillator invocations in headless JSDOM
const audioOscillatorCalls: Array<{ type: string; freq: number }> = [];

class MockAudioContext {
  public state: AudioContextState = 'running';
  public currentTime = 0;
  public destination = {};

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  createOscillator() {
    const record = { type: 'sine', freq: 440 };
    audioOscillatorCalls.push(record);
    return {
      set type(val: string) {
        record.type = val;
      },
      get type() {
        return record.type;
      },
      frequency: {
        setValueAtTime: (f: number) => {
          record.freq = f;
        },
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
}

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent,
  HTMLElement: dom.window.HTMLElement,
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

Object.assign(dom.window, {
  AudioContext: MockAudioContext,
  ResizeObserver: globalThis.ResizeObserver,
});

// @ts-expect-error jsdom 2d canvas mock
dom.window.HTMLCanvasElement.prototype.getContext = (kind: string) => {
  if (kind === 'webgl' || kind === 'webgl2') return null;
  return {
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Array(4) }),
    putImageData: () => {},
    createImageData: () => [],
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
  };
};

const { render, fireEvent, cleanup } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
  localStorage.clear();
  resetNdtAudioCooldowns();
  audioOscillatorCalls.length = 0;
});

test('Procedural Web Audio synthesizer emits calibration clicks, scan ticks, and defect pings & respects mute state', () => {
  const initialPrefs = readNdtAudioPreferences();
  assert.equal(initialPrefs.enabled, true);

  assert.equal(playCalibrationClick(), true);
  assert.equal(playProbeScanTick(), true);
  assert.equal(playCalibrationSuccessPing(), true);
  assert.equal(playDefectDetectedPing('Critical'), true);
  assert.ok(audioOscillatorCalls.length >= 5, 'Expected multiple Web Audio oscillator tones');

  // Muting audio blocks sound synthesis and persists preference
  writeNdtAudioPreferences({ enabled: false, volume: 0.4 });
  const countBeforeMuted = audioOscillatorCalls.length;
  assert.equal(playCalibrationClick(), false);
  assert.equal(playDefectDetectedPing('High'), false);
  assert.equal(audioOscillatorCalls.length, countBeforeMuted);
  assert.equal(readNdtAudioPreferences().enabled, false);
  assert.equal(readNdtAudioPreferences().volume, 0.4);
});

test('NdtAudioControlChip toggles mute, adjusts volume, and fires test ping', () => {
  const ui = render(<NdtAudioControlChip language="en" />);
  const muteBtn = ui.getByRole('button', { name: /Lab Audio: ON/i });
  assert.ok(muteBtn);

  const testBtn = ui.getByRole('button', { name: /Test Ping/i });
  fireEvent.click(testBtn);
  assert.ok(audioOscillatorCalls.length > 0);

  fireEvent.click(muteBtn);
  assert.equal(readNdtAudioPreferences().enabled, false);
  assert.ok(ui.getByRole('button', { name: /Lab Audio: MUTED/i }));
});

test('Reactive discoveredDefectsStore and DiscoveredDefectsLogTable deduplicate hits, filter by severity, sort, and focus', () => {
  assert.equal(deriveDefectSeverity('Planar', 'root_crack'), 'Critical');
  assert.equal(deriveDefectSeverity('Volumetric', 'slag_inclusion'), 'High');
  assert.equal(deriveDefectSeverity('Volumetric', 'tungsten_inclusion'), 'Moderate');
  assert.equal(deriveDefectSeverity('Volumetric', 'isolated_pore'), 'Low');

  let focusedKey: string | null = null;
  const ui = render(
    <DiscoveredDefectsLogTable
      language="en"
      onFocusDefectIn3D={(entry) => {
        focusedKey = entry.defectKey;
      }}
    />
  );

  // Starts in clean empty state
  assert.ok(ui.getByText(/No Defects Logged Yet/i));

  // Log first defect dynamically — table reacts immediately via CustomEvent!
  const first = logDiscoveredDefect({
    defectKey: 'ut3d:root_crack',
    catalogDefectId: 'root_crack',
    codeSymbol: 'CR-R',
    type: { ar: 'شرخ الجذر', en: 'Longitudinal Root Crack' },
    morphology: 'Planar',
    method: 'UT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'جذر اللحام', en: 'Weld Root Centerline' },
      xMm: 0,
      yMm: 50,
      depthZMm: 23.8,
      soundPathOrAngle: 'S=47.6mm @ 60°',
    },
    severity: 'Critical',
    peakSignalPct: 82,
  });
  assert.equal(first.isNewDiscovery, true);

  // Re-logging same defectKey increments hitCount and updates peakSignalPct without duplicate rows
  const secondHit = logDiscoveredDefect({
    defectKey: 'ut3d:root_crack',
    catalogDefectId: 'root_crack',
    codeSymbol: 'CR-R',
    type: { ar: 'شرخ الجذر', en: 'Longitudinal Root Crack' },
    morphology: 'Planar',
    method: 'UT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'جذر اللحام', en: 'Weld Root Centerline' },
      xMm: 0,
      yMm: 50,
      depthZMm: 23.8,
      soundPathOrAngle: 'S=47.6mm @ 60°',
    },
    severity: 'Critical',
    peakSignalPct: 94,
  });
  assert.equal(secondHit.isNewDiscovery, false);
  assert.equal(secondHit.entry.hitCount, 2);
  assert.equal(secondHit.entry.peakSignalPct, 94);

  // Log a second Moderate defect
  logDiscoveredDefect({
    defectKey: 'ut3d:tungsten',
    catalogDefectId: 'tungsten_inclusion',
    codeSymbol: 'TI',
    type: { ar: 'تضمين تنجستين', en: 'Dense Tungsten Inclusion' },
    morphology: 'Volumetric',
    method: 'PAUT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'قلب اللحام', en: 'Mid-Wall Fill Pass' },
      xMm: 2.5,
      yMm: 45,
      depthZMm: 12.5,
      soundPathOrAngle: 'S=25.0mm @ 60°',
    },
    severity: 'Moderate',
    peakSignalPct: 64,
  });

  assert.equal(readDiscoveredDefects().length, 2);
  ui.rerender(
    <DiscoveredDefectsLogTable
      language="en"
      onFocusDefectIn3D={(entry) => {
        focusedKey = entry.defectKey;
      }}
    />
  );

  assert.ok(ui.getAllByText(/Longitudinal Root Crack/i).length >= 1);
  assert.ok(ui.getAllByText(/Dense Tungsten Inclusion/i).length >= 1);

  // Verify per-row Weld Specimen Heat Map icons render for each detected defect
  const crHeatMapBtn = ui.getByRole('button', {
    name: /Weld specimen heat map icon for CR-R at X=0mm, Y=50mm, Depth Z=23.8mm/i,
  });
  const tiHeatMapBtn = ui.getByRole('button', {
    name: /Weld specimen heat map icon for TI at X=2.5mm, Y=45mm, Depth Z=12.5mm/i,
  });
  assert.ok(crHeatMapBtn);
  assert.ok(tiHeatMapBtn);

  // Verify Composite Simulated Weld Specimen Heat Map overview is visible and interactive
  assert.ok(ui.getByLabelText(/Composite Simulated Weld Specimen Defect Heat Map/i));

  // Clicking a row's Weld Heat Map icon selects that spot on the composite map & triggers onFocusDefectIn3D
  fireEvent.click(tiHeatMapBtn);
  assert.equal(focusedKey, 'ut3d:tungsten');
  assert.ok(ui.getByText(/X = 2.5 mm/i));

  // Toggle Composite Specimen Heat Map visibility
  fireEvent.click(ui.getByRole('button', { name: /Hide Specimen Heat Map/i }));
  assert.equal(ui.queryByLabelText(/Composite Simulated Weld Specimen Defect Heat Map/i), null);
  fireEvent.click(ui.getByRole('button', { name: /Show Specimen Heat Map/i }));
  assert.ok(ui.getByLabelText(/Composite Simulated Weld Specimen Defect Heat Map/i));

  // Verify normalized specimen spot coordinate & thermal color math
  const rootSpot = computeNormalizedSpecimenSpot({
    location: { zone: { ar: '', en: '' }, xMm: 0, yMm: 50, depthZMm: 25, soundPathOrAngle: '' },
    severity: 'Critical',
    peakSignalPct: 92,
  });
  assert.equal(rootSpot.normX, 0.5);
  assert.equal(rootSpot.normY, 0.5);
  assert.equal(rootSpot.normZ, 1);
  assert.equal(rootSpot.coreColor, '#ef4444');

  const midWallSpot = computeNormalizedSpecimenSpot({
    location: { zone: { ar: '', en: '' }, xMm: 12.5, yMm: 25, depthZMm: 12.5, soundPathOrAngle: '' },
    severity: 'Moderate',
    peakSignalPct: 60,
  });
  assert.equal(midWallSpot.normX, 0.75);
  assert.equal(midWallSpot.normY, 0.25);
  assert.equal(midWallSpot.normZ, 0.5);
  assert.equal(midWallSpot.coreColor, '#38bdf8');

  // Filter strictly by Critical severity
  fireEvent.click(ui.getByRole('button', { name: /^Critical$/ }));
  assert.ok(ui.getAllByText(/Longitudinal Root Crack/i).length >= 1);
  assert.equal(ui.queryByText(/Dense Tungsten Inclusion/i), null);

  // Focus 3D callback works
  fireEvent.click(ui.getByRole('button', { name: /Focus 3D/i }));
  assert.equal(focusedKey, 'ut3d:root_crack');

  // Remove & clear store
  removeDiscoveredDefect(first.entry.id);
  assert.equal(readDiscoveredDefects().length, 1);
  clearDiscoveredDefects();
  assert.equal(readDiscoveredDefects().length, 0);
});

test('3D VirtualLab, UtThreeScene & BeamConeAndDefectExplorer log defects and render 3D wireframe overlays with exact Depth and Length', async () => {
  // 1) VirtualLab (Three.js 3D Lab): trigger Quick Sample Scan / Angle Weld root hit & MT Yoke surface crack
  const vLab = render(<VirtualLab language="en" />);
  assert.equal(readDiscoveredDefects().length, 0);

  // Trigger quick-scan on the reactive table empty state inside VirtualLab
  const quickScanBtn = vLab.getByRole('button', { name: /Aim 3D Probe & Detect Flaw Now/i });
  fireEvent.click(quickScanBtn);

  const loggedAfterUt = readDiscoveredDefects();
  assert.equal(loggedAfterUt.length, 1);
  assert.equal(loggedAfterUt[0].codeSymbol, 'LOP-R');
  assert.equal(loggedAfterUt[0].severity, 'Critical');
  assert.equal(loggedAfterUt[0].location.depthZMm, 20);
  assert.equal(loggedAfterUt[0].sizing?.calculatedDepthMm, 20);
  assert.equal(loggedAfterUt[0].sizing?.calculatedLengthMm, 12);

  // Verify lazy-loaded UtThreeScene inside VirtualLab renders the 3D Weld Defect Wireframe Sizing Overlay
  const utWireframeRegion = await vLab.findByRole('region', {
    name: /3D Weld Defect Wireframe Sizing Overlay/i,
  });
  assert.ok(utWireframeRegion.textContent?.includes('Depth Z = 20.0 mm'));
  assert.ok(utWireframeRegion.textContent?.includes('Length L = 12.0 mm'));

  // Toggle X-Ray Weld mode & 3D Defect Wireframe toggle inside VirtualLab
  const xrayBtn = vLab.getByRole('button', { name: /X-Ray Weld: OFF/i });
  fireEvent.click(xrayBtn);
  assert.ok(vLab.getByRole('button', { name: /X-Ray Weld: ON/i }));

  // Switch to Magnetic Particle Yoke 3D experiment and energize + apply iron powder at 90°
  const mtExpCards = vLab.getAllByText(/Magnetic Particle/i);
  fireEvent.click(mtExpCards[0]);
  fireEvent.click(vLab.getByRole('button', { name: /Energize Yoke/i }));
  fireEvent.click(vLab.getByRole('button', { name: /Apply Particles/i }));

  const loggedAfterMt = readDiscoveredDefects();
  assert.equal(loggedAfterMt.length, 2);
  const mtEntry = loggedAfterMt.find((d) => d.codeSymbol === 'MT-CR' && d.method === 'MT 3D');
  assert.ok(mtEntry);
  assert.equal(mtEntry.sizing?.calculatedDepthMm, 0);
  assert.equal(mtEntry.sizing?.calculatedLengthMm, 24);

  const wfSpec = entryTo3DWireframeSpec(mtEntry, true);
  assert.equal(wfSpec.calculatedDepthMm, 0);
  assert.equal(wfSpec.calculatedLengthMm, 24);

  const mtWireframeRegion = vLab.getByRole('region', {
    name: /3D Weld Defect Wireframe Sizing Overlay/i,
  });
  assert.ok(mtWireframeRegion.textContent?.includes('Depth Z = 0.0 mm'));
  assert.ok(mtWireframeRegion.textContent?.includes('Length L = 24.0 mm'));
  cleanup();

  // Direct UtThreeScene standalone toggle verification
  const sceneUi = render(
    <UtThreeScene
      language="en"
      blockType="angle_weld"
      probePositionMm={35}
      probeAngleDeg={60}
      plateThicknessMm={20}
      defectDetected={true}
      detectedWireframeOverlays={[
        {
          id: 'test-wf-1',
          codeSymbol: 'CR-R',
          label: { ar: 'شرخ الجذر', en: 'Root Crack' },
          severity: 'Critical',
          morphology: 'Planar',
          xMm: 0,
          yMm: 50,
          calculatedDepthMm: 19.2,
          calculatedLengthMm: 14.5,
          heightMm: 3.5,
          transverseWidthMm: 2.0,
          isLiveActive: true,
        },
      ]}
    />
  );
  assert.ok(sceneUi.getByText(/Depth Z = 19.2 mm/i));
  assert.ok(sceneUi.getByText(/Length L = 14.5 mm/i));
  fireEvent.click(sceneUi.getByRole('button', { name: /3D Defect Wireframe: ON/i }));
  assert.equal(sceneUi.queryByText(/Depth Z = 19.2 mm/i), null);
  cleanup();

  // 2) BeamConeAndDefectExplorer (3D Volumetric Beam Cone & 16-Defect Lab)
  clearDiscoveredDefects();
  const coneUi = render(<BeamConeAndDefectExplorer language="en" />);
  fireEvent.click(coneUi.getByRole('button', { name: /Aim 3D Probe & Detect Flaw Now/i }));
  const coneLogged = readDiscoveredDefects();
  assert.equal(coneLogged.length, 1);
  assert.equal(coneLogged[0].codeSymbol, 'LOF-SW');
  assert.equal(coneLogged[0].severity, 'Critical');
  assert.ok((coneLogged[0].sizing?.calculatedLengthMm ?? 0) > 0);

  const coneWfRegion = coneUi.getByRole('region', {
    name: /3D Weld Specimen Wireframe Defect Sizing/i,
  });
  assert.ok(coneWfRegion.textContent?.includes('LOF-SW'));
  assert.ok(coneWfRegion.textContent?.includes('Depth Z ='));
  assert.ok(coneWfRegion.textContent?.includes('Length L ='));

  // Toggling 3D Flaw Wireframe hides/shows the 3D wireframe sizing overlay
  fireEvent.click(coneUi.getByRole('button', { name: /3D Flaw Wireframe/i }));
  assert.equal(
    coneUi.queryByRole('region', { name: /3D Weld Specimen Wireframe Defect Sizing/i }),
    null
  );
});

test('V1 & V2 Calibration Blocks data, acoustic physics engine, and 7-stage Start-Check simulator work end-to-end', () => {
  assert.equal(V1_BLOCK_METADATA.overallDimensionsMm.length, 300);
  assert.equal(V1_BLOCK_METADATA.overallDimensionsMm.height, 100);
  assert.equal(V1_BLOCK_METADATA.overallDimensionsMm.thickness, 25);
  assert.ok(V1_BLOCK_REFLECTORS.length >= 5);

  assert.equal(V2_BLOCK_METADATA.overallDimensionsMm.length, 75);
  assert.equal(V2_BLOCK_METADATA.overallDimensionsMm.height, 43);
  assert.deepEqual(V2_BLOCK_METADATA.overallDimensionsMm.thicknessOptions, [12.5, 20]);
  assert.ok(V2_BLOCK_REFLECTORS.length >= 4);
  assert.equal(CALIBRATION_WORKFLOW_STEPS.length, 7);
  assert.ok(CALIBRATION_CODES.iso_17640);
  assert.ok(CALIBRATION_CODES.asme_sec_v);

  // Verify V1 R100 & R200 shear wave echoes when calibrated (VS = 3255 m/s, Zero = 2.35 µs)
  const v1Shear = computeCalibrationPhysics({
    targetBlock: 'v1_iso2400',
    v2ThicknessMm: 12.5,
    probeMode: 'angle_shear',
    nominalAngleDeg: 60,
    probeActualAngleSkewDeg: 0,
    probePositionXmm: 200,
    beamDirection: 'right',
    instrumentVelocityMs: 3255,
    instrumentZeroDelayUs: 2.35,
    screenRangeMm: 220,
    gainDb: 48,
    transferCorrectionDb: 0,
    scanningGainActive: false,
    dampingOhms: 50,
    weldThicknessMm: 25,
    v1ZeroSpot: 'thk_25',
  });
  assert.equal(v1Shear.echoes.length, 2);
  assert.equal(v1Shear.echoes[0].displayedSoundPathMm, 100);
  assert.equal(v1Shear.echoes[1].displayedSoundPathMm, 200);

  // Render full Arabic V1V2CalibrationLab and walk through Stage 1 -> Stage 7 Weld Start-Check & Sign-Off
  let proceededToWeld = false;
  const calUi = render(
    <V1V2CalibrationLab
      language="ar"
      onCompleteAndProceedToWeld={() => {
        proceededToWeld = true;
      }}
    />
  );

  assert.ok(
    calUi.getByText(/بلوكات المعايرة V1 & V2 بكامل أبعادها ومحاكاة الكالبريشن حتى استارت تشيك اللحام/)
  );

  // Switch to V2 block blueprint and verify R25 / R50 & Ø5.0 mm SDH render
  fireEvent.click(calUi.getAllByRole('button', { name: /اعرض V2 على المحاكي/ })[0]);
  assert.ok(calUi.getByLabelText(/IIW V2 ISO 7963 Miniature Calibration Block/i));

  // Auto-calibrate Stages 1 through 7 step by step
  for (const stageNum of [1, 2, 3, 4, 5, 6, 7] as const) {
    fireEvent.click(calUi.getAllByRole('button', { name: new RegExp(`مرحلة ${stageNum}`) })[0]);
    fireEvent.click(
      calUi.getAllByRole('button', { name: new RegExp(`تطبيق وضبط المرحلة ${stageNum} قياسياً`) })[0]
    );
  }

  // Stage 7 On-Weld Start-Check blueprint & sign-off certificate + XP history record
  assert.ok(calUi.getByLabelText(/Weld Pre-Scan Start-Check Cross Section/i));
  fireEvent.click(
    calUi.getByRole('button', {
      name: /اعتماد شهادة الكالبريشن واستارت تشيك اللحام وتسجيل نقاط الخبرة/,
    })
  );

  const history = getSimulationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].simulatorId, 'v1_v2_code_calibration_lab');
  assert.equal(history[0].status, 'PASS');
  assert.ok(history[0].xpEarned > 0);

  fireEvent.click(
    calUi.getByRole('button', { name: /ابدأ مسح اللحام الفعلي بهذه الإعدادات المعايرة/ })
  );
  assert.equal(proceededToWeld, true);
});

test('D3.js DefectFrequencyD3Chart tracks welding error frequencies reactively, sorts bars, switches metrics, and integrates in 3D VirtualLab', () => {
  assert.equal(WELDING_ERROR_CATEGORIES.length, 6);
  assert.equal(
    classifyDiscoveredDefectBucket({
      catalogDefectId: 'porosity_cluster',
      codeSymbol: 'POR-C',
      type: { ar: 'مسامية', en: 'Clustered Porosity' },
      morphology: 'Volumetric',
    }),
    'porosity'
  );
  assert.equal(
    classifyDiscoveredDefectBucket({
      catalogDefectId: 'lack_of_fusion',
      codeSymbol: 'LOF-SW',
      type: { ar: 'نقص انصهار', en: 'Sidewall Lack of Fusion' },
      morphology: 'Planar',
    }),
    'lack_of_fusion'
  );
  assert.equal(
    classifyDiscoveredDefectBucket({
      catalogDefectId: 'slag_inclusion',
      codeSymbol: 'SL-I',
      type: { ar: 'خبث', en: 'Elongated Slag Inclusion' },
      morphology: 'Volumetric',
    }),
    'slag_inclusions'
  );
  assert.equal(
    classifyDiscoveredDefectBucket({
      catalogDefectId: 'incomplete_penetration',
      codeSymbol: 'LOP-R',
      type: { ar: 'عدم تغلغل', en: 'Incomplete Root Penetration' },
      morphology: 'Planar',
    }),
    'incomplete_penetration'
  );
  assert.equal(
    classifyDiscoveredDefectBucket({
      catalogDefectId: 'root_crack',
      codeSymbol: 'CR-R',
      type: { ar: 'شرخ', en: 'Root Crack' },
      morphology: 'Planar',
    }),
    'cracks'
  );
  assert.equal(
    classifyDiscoveredDefectBucket({
      catalogDefectId: 'toe_undercut',
      codeSymbol: 'UND-T',
      type: { ar: 'عضة', en: 'Toe Undercut' },
      morphology: 'Surface',
    }),
    'undercut_lamination'
  );

  // Render standalone D3 chart initially empty
  let focusedDefectKey: string | null = null;
  const chartUi = render(
    <DefectFrequencyD3Chart
      language="en"
      onFocusDefectIn3D={(entry) => {
        focusedDefectKey = entry.defectKey;
      }}
    />
  );

  const initialBars = chartUi.container.querySelectorAll('svg g.d3-bar-node');
  assert.equal(initialBars.length, 6, 'Expected D3 to render 6 welding error category bar groups');
  for (const bar of Array.from(initialBars)) {
    assert.equal(bar.getAttribute('data-count'), '0');
  }

  // Log 2 Porosity defects (one with 3 scan hits), 1 Lack of Fusion defect, and 1 Slag Inclusion defect
  logDiscoveredDefect({
    defectKey: 'd3test:por1',
    catalogDefectId: 'porosity_cluster',
    codeSymbol: 'POR-C',
    type: { ar: 'عنقود مسامية', en: 'Clustered Gas Porosity' },
    morphology: 'Volumetric',
    method: 'UT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'قلب اللحام', en: 'Fill Pass' },
      xMm: 2,
      yMm: 42,
      depthZMm: 10.5,
      soundPathOrAngle: 'S=21mm @ 60°',
    },
    severity: 'Moderate',
    peakSignalPct: 58,
  });
  // Hit Porosity #1 two more times so hitCount === 3
  logDiscoveredDefect({
    defectKey: 'd3test:por1',
    catalogDefectId: 'porosity_cluster',
    codeSymbol: 'POR-C',
    type: { ar: 'عنقود مسامية', en: 'Clustered Gas Porosity' },
    morphology: 'Volumetric',
    method: 'UT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'قلب اللحام', en: 'Fill Pass' },
      xMm: 2,
      yMm: 42,
      depthZMm: 10.5,
      soundPathOrAngle: 'S=21mm @ 60°',
    },
    severity: 'Moderate',
    peakSignalPct: 62,
  });
  logDiscoveredDefect({
    defectKey: 'd3test:por2',
    catalogDefectId: 'isolated_pore',
    codeSymbol: 'POR-I',
    type: { ar: 'مسامية منفردة', en: 'Isolated Gas Pore' },
    morphology: 'Volumetric',
    method: 'UT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'قلب اللحام', en: 'Cap Pass' },
      xMm: -1,
      yMm: 60,
      depthZMm: 6.0,
      soundPathOrAngle: 'S=12mm @ 60°',
    },
    severity: 'Low',
    peakSignalPct: 44,
  });
  logDiscoveredDefect({
    defectKey: 'd3test:lof1',
    catalogDefectId: 'lack_of_fusion',
    codeSymbol: 'LOF-SW',
    type: { ar: 'نقص انصهار جانبي', en: 'Sidewall Lack of Fusion' },
    morphology: 'Planar',
    method: 'UT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'جدار الشطف', en: 'Bevel Sidewall' },
      xMm: 4,
      yMm: 50,
      depthZMm: 12.5,
      soundPathOrAngle: 'S=25mm @ 60°',
    },
    severity: 'Critical',
    peakSignalPct: 88,
  });
  logDiscoveredDefect({
    defectKey: 'd3test:slag1',
    catalogDefectId: 'slag_inclusion',
    codeSymbol: 'SL-I',
    type: { ar: 'شوائب خبث', en: 'Elongated Slag Inclusion' },
    morphology: 'Volumetric',
    method: 'UT 3D',
    sourceLab: { ar: 'معمل 3D', en: '3D Lab' },
    location: {
      zone: { ar: 'بين الطبقات', en: 'Interpass Toe' },
      xMm: -2.5,
      yMm: 55,
      depthZMm: 14.0,
      soundPathOrAngle: 'S=28mm @ 60°',
    },
    severity: 'High',
    peakSignalPct: 74,
  });

  const aggUnique = aggregateDefectFrequencyByCategory(readDiscoveredDefects(), 'unique_defects');
  assert.equal(aggUnique.find((b) => b.id === 'porosity')?.uniqueCount, 2);
  assert.equal(aggUnique.find((b) => b.id === 'lack_of_fusion')?.uniqueCount, 1);
  assert.equal(aggUnique.find((b) => b.id === 'slag_inclusions')?.uniqueCount, 1);

  chartUi.rerender(
    <DefectFrequencyD3Chart
      language="en"
      onFocusDefectIn3D={(entry) => {
        focusedDefectKey = entry.defectKey;
      }}
    />
  );

  // Verify D3 SVG bar nodes updated reactively with exact unique counts
  const porBar = chartUi.container.querySelector('svg g.d3-bar-node[data-category="porosity"]');
  const lofBar = chartUi.container.querySelector('svg g.d3-bar-node[data-category="lack_of_fusion"]');
  const slgBar = chartUi.container.querySelector('svg g.d3-bar-node[data-category="slag_inclusions"]');
  assert.equal(porBar?.getAttribute('data-count'), '2');
  assert.equal(lofBar?.getAttribute('data-count'), '1');
  assert.equal(slgBar?.getAttribute('data-count'), '1');

  // Switch metric mode to "Scan Hits" -> porosity has 2 + 1 = 3 scan hits
  fireEvent.click(chartUi.getByRole('button', { name: /Scan Hits/i }));
  const porBarHits = chartUi.container.querySelector('svg g.d3-bar-node[data-category="porosity"]');
  assert.equal(porBarHits?.getAttribute('data-count'), '3');

  // Click Lack of Fusion D3 bar to inspect welding root cause & focus 3D spot
  const lofBarAfter = chartUi.container.querySelector('svg g.d3-bar-node[data-category="lack_of_fusion"]');
  assert.ok(lofBarAfter);
  fireEvent.click(lofBarAfter);
  assert.ok(chartUi.getByText(/Sidewall & Interpass Lack of Fusion/i));
  assert.ok(chartUi.getByText(/Insufficient heat input/i));

  fireEvent.click(chartUi.getByRole('button', { name: /^3D$/i }));
  assert.equal(focusedDefectKey, 'd3test:lof1');

  // Sort by Frequency places Porosity first
  fireEvent.click(chartUi.getByRole('button', { name: /Sort by Frequency/i }));
  const orderedCategories = Array.from(
    chartUi.container.querySelectorAll('svg g.d3-bar-node')
  ).map((el) => el.getAttribute('data-category'));
  assert.equal(orderedCategories[0], 'porosity');
  cleanup();

  // Verify multi-defect sample loader inside 3D VirtualLab populates D3 chart bars across error types
  clearDiscoveredDefects();
  const vLab = render(<VirtualLab language="en" />);
  const sampleBtn = vLab.getByRole('button', { name: /Load Multi-Defect Sample/i });
  fireEvent.click(sampleBtn);

  assert.equal(readDiscoveredDefects().length, 6, 'Expected multi-defect sample to log 6 flaws with Porosity as most frequent');
  const vLabPorBar = vLab.container.querySelector('svg g.d3-bar-node[data-category="porosity"]');
  const vLabLofBar = vLab.container.querySelector('svg g.d3-bar-node[data-category="lack_of_fusion"]');
  const vLabSlgBar = vLab.container.querySelector('svg g.d3-bar-node[data-category="slag_inclusions"]');
  assert.equal(vLabPorBar?.getAttribute('data-count'), '2');
  assert.equal(vLabLofBar?.getAttribute('data-count'), '1');
  assert.equal(vLabSlgBar?.getAttribute('data-count'), '1');
});

test('3D V1 & V2 Calibration Blocks module models SDH & EDM notch flaws, guided sensitivity + start-check UI, and integrates inside 3D VirtualLab', () => {
  // 1. Verify standard dimensions & specific reference flaw types (SDHs + Notches)
  assert.ok(
    V1_BLOCK_REFLECTORS.some((r) => r.id === 'v1_sdh_1_5mm'),
    'Expected V1 Ø1.5 mm side-drilled hole reflector'
  );
  assert.ok(
    V1_BLOCK_REFLECTORS.some((r) => r.id === 'v1_zero_index_notch'),
    'Expected V1 2×3 mm zero-index reference notch'
  );
  assert.ok(
    V1_BLOCK_REFLECTORS.some((r) => r.id === 'v1_resolution_steps'),
    'Expected V1 85/91/100 mm notched resolution steps'
  );
  assert.ok(
    V2_BLOCK_REFLECTORS.some((r) => r.id === 'v2_sdh_5mm'),
    'Expected V2 Ø5.0 mm / Ø1.5 mm side-drilled hole reflector'
  );
  assert.ok(
    V2_BLOCK_REFLECTORS.some((r) => r.id === 'v2_edm_surface_notch'),
    'Expected V2 1.5×2.0 mm EDM surface reference notch'
  );

  // 2. Verify physics engine computes distinct echoes for V2 Ø1.5 mm SDH vs EDM Notch corner trap
  const v2Sdh15 = computeCalibrationPhysics({
    targetBlock: 'v2_iso7963',
    v2ThicknessMm: 12.5,
    probeMode: 'angle_shear',
    nominalAngleDeg: 60,
    probeActualAngleSkewDeg: 0,
    probePositionXmm: 71,
    beamDirection: 'left',
    instrumentVelocityMs: 3255,
    instrumentZeroDelayUs: 2.35,
    screenRangeMm: 100,
    gainDb: 48,
    transferCorrectionDb: 0,
    scanningGainActive: false,
    dampingOhms: 50,
    weldThicknessMm: 25,
    v1ZeroSpot: 'thk_25',
    v2SdhDiameterMm: 1.5,
    sensitivityReflectorMode: 'sdh',
  });
  assert.ok(
    v2Sdh15.echoes.some((e) => e.label.en.includes('Ø1.5 mm Reference SDH')),
    'Expected V2 Ø1.5 mm Reference SDH echo in physics output'
  );

  const v2EdmNotch = computeCalibrationPhysics({
    targetBlock: 'v2_iso7963',
    v2ThicknessMm: 12.5,
    probeMode: 'angle_shear',
    nominalAngleDeg: 60,
    probeActualAngleSkewDeg: 0,
    probePositionXmm: 71,
    beamDirection: 'left',
    instrumentVelocityMs: 3255,
    instrumentZeroDelayUs: 2.35,
    screenRangeMm: 100,
    gainDb: 48,
    transferCorrectionDb: 0,
    scanningGainActive: false,
    dampingOhms: 50,
    weldThicknessMm: 25,
    v1ZeroSpot: 'thk_25',
    sensitivityReflectorMode: 'edm_notch',
  });
  assert.ok(
    v2EdmNotch.echoes.some((e) => e.label.en.includes('EDM Notch Echo')),
    'Expected V2 1.5×2.0 mm EDM Notch Echo when in edm_notch mode'
  );

  // 3. Render dedicated 3D V1V2ThreeScene directly and test HUD dock + X-Ray Internal toggle
  const sceneUi = render(
    <V1V2ThreeScene
      language="en"
      targetBlock="v1_iso2400"
      v2ThicknessMm={12.5}
      v2SdhDiameterMm={5.0}
      sensitivityReflectorMode="sdh"
      v1ZeroSpot="thk_25"
      selectedReflectorId="v1_sdh_1_5mm"
      probeMode="angle_shear"
      nominalAngleDeg={60}
      trueRefractedAngleDeg={60}
      probePositionXmm={200}
      beamDirection="right"
      bipMarkedOnWedge={true}
      weldThicknessMm={25}
      halfSkipWeldMm={43.3}
      fullSkipWeldMm={86.6}
      couplantApplied={true}
      primaryEchoAmplitudePct={80}
    />
  );
  assert.ok(
    sceneUi.getByRole('region', {
      name: /3D V1 and V2 Ultrasonic Calibration Blocks Interactive Viewport/i,
    })
  );
  assert.ok(sceneUi.getAllByText(/3D IIW V1 Block \(ISO 2400 — 300×100×25 mm\)/i).length > 0);
  fireEvent.click(sceneUi.getByRole('button', { name: /X-Ray Internal/i }));
  cleanup();

  // 4. Launch dedicated V1 & V2 3D Calibration Blocks & Start-Check module inside 3D VirtualLab
  localStorage.clear();
  const vLab = render(<VirtualLab language="en" />);
  fireEvent.click(
    vLab.getByRole('button', { name: /V1 & V2 3D Calibration Blocks & Start-Check/i })
  );

  // Verify 3D V1/V2 viewport is mounted inside the 3D NDT Lab
  assert.ok(
    vLab.getByRole('region', {
      name: /3D V1 and V2 Ultrasonic Calibration Blocks Interactive Viewport/i,
    })
  );

  // Switch to Stage 6 (Screen Sensitivity Calibration) and toggle Reference Flaw + V2 Ø1.5mm SDH
  fireEvent.click(vLab.getAllByRole('button', { name: /Stage 6/i })[0]);
  assert.ok(vLab.getByText(/Guided Screen Sensitivity Calibration Ledger:/i));

  fireEvent.click(vLab.getByRole('button', { name: /Reference Notch \(EDM\)/i }));
  assert.ok(vLab.getByText(/Target: EDM Reference Notch \(Corner-Trap\)/i));

  fireEvent.click(vLab.getByRole('button', { name: /^Load V2$/i }));
  fireEvent.click(vLab.getByRole('button', { name: /Ø1\.5mm/i }));

  // Auto-calibrate Stages 1 through 7 and verify Stage 7 Equipment Start-Check Drift Gate
  for (const stageNum of [1, 2, 3, 4, 5, 6, 7] as const) {
    fireEvent.click(vLab.getAllByRole('button', { name: new RegExp(`Stage ${stageNum}`, 'i') })[0]);
    fireEvent.click(
      vLab.getAllByRole('button', {
        name: new RegExp(`Auto-Calibrate Stage ${stageNum}`, 'i'),
      })[0]
    );
  }

  assert.ok(vLab.getByText(/Equipment Start-Check Drift Gate/i));
  assert.ok(vLab.getByText(/✓ Drift Verified \(0\.0 dB\)/i));

  // Sign off calibration certificate and transfer calibrated parameters directly to 3D Weld Inspection
  fireEvent.click(
    vLab.getByRole('button', {
      name: /Sign Off Code Calibration & Weld Start-Check \(\+XP\)/i,
    })
  );
  fireEvent.click(
    vLab.getByRole('button', {
      name: /Start Live Weld Flaw Scan with Calibrated Settings/i,
    })
  );

  // Confirm VirtualLab transitioned to Angle Beam Weld Inspection with 3D Specimen controls active
  assert.ok(vLab.getByText(/Target Welding Error Inside 3D Specimen/i));
});


