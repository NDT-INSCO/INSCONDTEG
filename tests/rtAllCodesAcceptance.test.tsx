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

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:mock-rt-report';
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = () => {};
}

const {
  evaluateFilmReadingAcrossAllCodes,
  mapLabClassificationToArDefectId,
} = await import('../src/components/academy/virtuallab/RtAllCodesAcceptanceSimulator');
const { RT_FILM_REPORTS_ARCHIVE_STORAGE_KEY } = await import(
  '../src/components/academy/virtuallab/RtIntegratedFilmWorkbench'
);
const {
  computeAllCodesAggregateForFilm,
  generateRtFilmInterpretationPdf,
  buildRtFilmReportCsv,
} = await import('../src/utils/rtFilmReportPdfGenerator');
const { RadiographicTestingLab } = await import(
  '../src/components/academy/virtuallab/RadiographicTestingLab'
);
const { setTheme } = await import('../src/utils/themeStore');
const { render, fireEvent, cleanup } = await import('@testing-library/react');

beforeEach(() => {
  storage.clear();
  setTheme('dark');
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
});

afterEach(() => cleanup());

test('evaluateFilmReadingAcrossAllCodes covers all 7 international codes accurately across sound, planar, crater, porosity, and slag flaws', () => {
  // 1. Sound Weld -> unanimous ACCEPT across 7 codes
  const soundVerdicts = evaluateFilmReadingAcrossAllCodes({
    defectId: 'sound',
    wallThicknessMm: 16,
    indicationLengthMm: 0,
    indicationWidthMm: 0,
    indicationDepthMm: 0,
    indicationCount: 0,
  });
  assert.equal(soundVerdicts.length, 7);
  assert.ok(soundVerdicts.every((v) => v.verdict === 'ACCEPT'));

  // 2. Longitudinal Crack -> unanimous REJECT across 7 codes
  const crackVerdicts = evaluateFilmReadingAcrossAllCodes({
    defectId: mapLabClassificationToArDefectId('crack'),
    wallThicknessMm: 18,
    indicationLengthMm: 14,
    indicationWidthMm: 0.6,
    indicationDepthMm: 4,
    indicationCount: 1,
  });
  assert.equal(crackVerdicts.length, 7);
  assert.ok(crackVerdicts.every((v) => v.verdict === 'REJECT'));

  // 3. Crater Crack (3.5 mm <= 4 mm) -> ACCEPT in API 1104, REJECT in ASME VIII UW-51 / AWS D1.1 / ISO 10675
  const craterVerdicts = evaluateFilmReadingAcrossAllCodes({
    defectId: 'crack_crater',
    wallThicknessMm: 12.7,
    indicationLengthMm: 3.5,
    indicationWidthMm: 2.8,
    indicationDepthMm: 1.4,
    indicationCount: 1,
  });
  const craterApi = craterVerdicts.find((v) => v.codeId === 'API_1104');
  const craterUw51 = craterVerdicts.find((v) => v.codeId === 'ASME_VIII_UW51');
  assert.equal(craterApi?.verdict, 'ACCEPT');
  assert.equal(craterUw51?.verdict, 'REJECT');

  // 4. Scattered Porosity (2.5 mm) -> Exempt in ASME VIII UW-52 Spot RT
  const porosityVerdicts = evaluateFilmReadingAcrossAllCodes({
    defectId: 'porosity_scattered',
    wallThicknessMm: 16,
    indicationLengthMm: 2.5,
    indicationWidthMm: 2.5,
    indicationDepthMm: 1.5,
    indicationCount: 4,
  });
  const porositySpot = porosityVerdicts.find((v) => v.codeId === 'ASME_VIII_UW52');
  assert.equal(porositySpot?.verdict, 'ACCEPT');
  assert.equal(porositySpot?.governingParameter, 'exempt_in_spot');

  // 5. Elongated Slag (12 mm, t=18 mm) -> REJECT in UW-51 (6 mm max), ACCEPT in UW-52 (2t/3 = 12 mm) & API 1104 (50 mm max)
  const slagVerdicts = evaluateFilmReadingAcrossAllCodes({
    defectId: 'slag_elongated_wagon',
    wallThicknessMm: 18,
    indicationLengthMm: 12,
    indicationWidthMm: 1.5,
    indicationDepthMm: 2,
    indicationCount: 1,
  });
  assert.equal(slagVerdicts.find((v) => v.codeId === 'ASME_VIII_UW51')?.verdict, 'REJECT');
  assert.equal(slagVerdicts.find((v) => v.codeId === 'ASME_VIII_UW52')?.verdict, 'ACCEPT');
  assert.equal(slagVerdicts.find((v) => v.codeId === 'API_1104')?.verdict, 'ACCEPT');
});

test('RadiographicTestingLab Film Reading stage integrates 7-code Acceptance Simulator, syncs with film inputs, respects Blind Exam Mode, and runs interactive presets', () => {
  const ui = render(<RadiographicTestingLab language="ar" />);

  // Jump to Stage 4: Film Reading & Code Evaluation
  fireEvent.click(ui.getByRole('button', { name: /STAGE 04/i }));

  const sim = ui.getByTestId('rt-all-codes-acceptance-simulator');
  assert.ok(sim);

  // All 7 codes should be rendered inside the matrix
  const codeIds = [
    'ASME_VIII_UW51',
    'ASME_VIII_UW52',
    'ASME_B31_3_NORMAL',
    'ASME_B31_1',
    'API_1104',
    'AWS_D1_1',
    'ISO_10675_1_B',
  ];
  for (const id of codeIds) {
    assert.ok(ui.getByTestId(`rt-film-code-row-${id}`));
  }

  // Default synced classification is 'crack' -> 0 / 7 ACCEPT
  assert.match(ui.getByTestId('rt-codes-accept-count').textContent || '', /0 \/ 7 ACCEPT/);

  // Clicking Sound Weld in Film Reading report form immediately updates all 7 codes to ACCEPT
  fireEvent.click(
    ui.getByRole('button', { name: /^لحام سليم 100%/i })
  );
  assert.match(ui.getByTestId('rt-codes-accept-count').textContent || '', /7 \/ 7 ACCEPT/);

  // Applying Crater Crack 3.5 mm divergence preset flips API 1104 to ACCEPT while ASME UW-51 remains REJECT
  fireEvent.click(ui.getByTestId('rt-code-preset-crater_crack_api_exception'));
  assert.match(ui.getByTestId('rt-film-code-status-API_1104').textContent || '', /ACCEPT/);
  assert.match(ui.getByTestId('rt-film-code-status-ASME_VIII_UW51').textContent || '', /REJECT/);

  // Adjusting length slider above 4 mm (to 6 mm) causes API 1104 crater crack verdict to flip to REJECT
  const lenSlider = ui.getByTestId('rt-codes-length-slider') as HTMLInputElement;
  fireEvent.change(lenSlider, { target: { value: '6' } });
  assert.match(ui.getByTestId('rt-film-code-status-API_1104').textContent || '', /REJECT/);

  // Blind Exam Mode must hide "تحميل عيب العينة الفعلي للمقارنة" before submission
  assert.ok(ui.queryByTestId('rt-codes-load-specimen'));
  fireEvent.click(ui.getByRole('button', { name: /وضع التدريب الإرشادي/i }));
  assert.equal(ui.queryByTestId('rt-codes-load-specimen'), null);

  cleanup();

  // Light theme & English LTR sanity check
  setTheme('light');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  const enUi = render(<RadiographicTestingLab language="en" />);
  fireEvent.click(enUi.getByRole('button', { name: /STAGE 04/i }));
  assert.ok(
    enUi.getByText(/All-Codes Radiographic Acceptance & Rejection Criteria Simulator/i)
  );
  fireEvent.click(enUi.getByTestId('rt-code-preset-wagon_slag_12mm'));
  assert.match(enUi.getByTestId('rt-film-code-status-ASME_VIII_UW51').textContent || '', /REJECT/);
  assert.match(enUi.getByTestId('rt-film-code-status-ASME_VIII_UW52').textContent || '', /ACCEPT/);
});

test('computeAllCodesAggregateForFilm, generateRtFilmInterpretationPdf, and buildRtFilmReportCsv process multi-indication RT reports across all 7 codes', () => {
  const ind1Verdicts = evaluateFilmReadingAcrossAllCodes({
    defectId: 'porosity_scattered',
    wallThicknessMm: 18,
    indicationLengthMm: 2.5,
    indicationWidthMm: 2.5,
    indicationDepthMm: 1.5,
    indicationCount: 3,
  });
  const ind2Verdicts = evaluateFilmReadingAcrossAllCodes({
    defectId: 'slag_elongated_wagon',
    wallThicknessMm: 18,
    indicationLengthMm: 12,
    indicationWidthMm: 1.5,
    indicationDepthMm: 2,
    indicationCount: 1,
  });

  const indications = [
    {
      id: 'ind-1',
      filmSegment: '0-1',
      stationStartMm: 45,
      stationEndMm: 47.5,
      defectId: 'porosity_scattered' as const,
      defectNameEn: 'Scattered Porosity',
      defectNameAr: 'مسامية متفرقة',
      lengthMm: 2.5,
      widthMm: 2.5,
      depthMm: 1.5,
      countInWindow: 3,
      repairAction: 'NONE' as const,
      verdicts: ind1Verdicts,
    },
    {
      id: 'ind-2',
      filmSegment: '1-2',
      stationStartMm: 130,
      stationEndMm: 142,
      defectId: 'slag_elongated_wagon' as const,
      defectNameEn: 'Elongated Slag (Wagon Tracks)',
      defectNameAr: 'خبث ممدود (خطوط سكة)',
      lengthMm: 12,
      widthMm: 1.5,
      depthMm: 2,
      countInWindow: 1,
      repairAction: 'LOCAL_GRIND_RE_RT' as const,
      verdicts: ind2Verdicts,
    },
  ];

  const aggregate = computeAllCodesAggregateForFilm(indications);
  assert.equal(aggregate.length, 7);
  assert.equal(aggregate.find((a) => a.codeId === 'ASME_VIII_UW51')?.verdict, 'REJECT');
  assert.equal(aggregate.find((a) => a.codeId === 'ASME_VIII_UW52')?.verdict, 'ACCEPT');
  assert.equal(aggregate.find((a) => a.codeId === 'API_1104')?.verdict, 'ACCEPT');

  const reportPayload = {
    reportNumber: 'RT-TEST-2026-001',
    inspectionDate: '2026-11-22',
    clientName: 'PetroGas Corp',
    projectFacility: 'Hydrocracker Unit 4',
    lineOrEquipmentTag: '12-P-401',
    weldJointId: 'WJ-104',
    welderStamp: 'W-14',
    materialSpec: 'API 5L X65',
    weldingProcess: 'SMAW + GTAW',
    wallThicknessMm: 18,
    outerDiameterMm: 323.9,
    sourceShortCode: 'Ir-192',
    energySummary: '45 Ci',
    techniqueCode: 'DWSI',
    sfdMm: 720,
    filmClassLabel: 'ASTM Class 1',
    hasLeadScreens: true,
    hasBackscatterB: true,
    iqiDesignation: 'ASTM Set B (Wire #10)',
    iqiPlacement: 'film_side' as const,
    visibleIqiWires: 6,
    requiredIqiWires: 6,
    calculatedUgMm: 0.19,
    maxAllowedUgMm: 0.51,
    weldOpticalDensity: 2.65,
    baseOpticalDensity: 2.35,
    passesFilmQc: true,
    governingCodeId: 'ASME_VIII_UW51' as const,
    governingCodeLabel: 'ASME VIII UW-51',
    finalDisposition: 'REJECTED_REPAIR' as const,
    indications,
    inspectorName: 'Eng. Ahmed Mansour',
    inspectorLevel: 'Level II' as const,
    inspectorCertNumber: 'ASNT-RT2-88419',
    inspectorComments: 'Excavate wagon track slag at station 130-142mm per UW-51.',
    signatureDataUrl: null,
    language: 'en' as const,
  };

  const pdfDoc = generateRtFilmInterpretationPdf(reportPayload);
  assert.ok(pdfDoc.getNumberOfPages() >= 1);

  const csv = buildRtFilmReportCsv(reportPayload);
  assert.match(csv, /RT-TEST-2026-001/);
  assert.match(csv, /ASME_VIII_UW51,ASME_VIII_UW52,ASME_B31_3_NORMAL,ASME_B31_1,API_1104,AWS_D1_1,ISO_10675_1_B/);
  assert.match(csv, /Elongated Slag/);
});

test('RadiographicTestingLab integrated film workbench logs multiple indications, switches governing codes across 7 standards, exports PDF/CSV, and archives reports', () => {
  const ui = render(<RadiographicTestingLab language="ar" />);
  fireEvent.click(ui.getByRole('button', { name: /STAGE 04/i }));

  assert.ok(ui.getByTestId('rt-integrated-film-workbench'));

  // 1. Add Elongated Slag (12 mm) + Crater Crack (3.5 mm) to Film Indications Log
  const defectSelect = ui.getByTestId('rt-workbench-defect-select') as HTMLSelectElement;
  const lengthInput = ui.getByTestId('rt-workbench-length-input') as HTMLInputElement;
  const addBtn = ui.getByTestId('rt-workbench-add-indication');

  fireEvent.change(defectSelect, { target: { value: 'slag_elongated_wagon' } });
  fireEvent.change(lengthInput, { target: { value: '12' } });
  fireEvent.click(addBtn);

  fireEvent.change(defectSelect, { target: { value: 'crack_crater' } });
  fireEvent.change(lengthInput, { target: { value: '3.5' } });
  fireEvent.click(addBtn);

  const table = ui.getByTestId('rt-workbench-indications-table');
  assert.equal(table.querySelectorAll('tbody tr').length, 2);

  // 2. Open All-7-Codes Matrix tab -> API 1104 accepts both (12mm slag <= 50mm & 3.5mm crater <= 4mm) while ASME VIII UW-51 rejects
  fireEvent.click(ui.getByTestId('rt-workbench-tab-codes_matrix'));
  assert.match(
    ui.getByTestId('rt-workbench-matrix-card-API_1104').textContent || '',
    /ACCEPT/
  );
  assert.match(
    ui.getByTestId('rt-workbench-matrix-card-ASME_VIII_UW51').textContent || '',
    /REJECT/
  );

  // Selecting API_1104 as governing updates film disposition badge to ACCEPTED / مقبول
  fireEvent.click(ui.getByTestId('rt-workbench-set-gov-API_1104'));
  assert.match(
    ui.getByTestId('rt-workbench-disposition-badge').textContent || '',
    /ACCEPT|مقبول/
  );

  // 3. Open Report Builder & Digital Sign-Off tab, customize metadata, export PDF & CSV, and save to archive
  fireEvent.click(ui.getByTestId('rt-workbench-tab-report'));
  const rptInput = ui.getByTestId('rt-report-number-input') as HTMLInputElement;
  fireEvent.change(rptInput, { target: { value: 'RT-INT-2026-777' } });

  const preview = ui.getByTestId('rt-report-live-preview');
  assert.match(preview.textContent || '', /RT-INT-2026-777/);
  assert.match(preview.textContent || '', /API 1104/);

  fireEvent.click(ui.getByTestId('rt-workbench-export-pdf'));
  assert.match(
    ui.getByTestId('rt-workbench-export-status').textContent || '',
    /RT-INT-2026-777\.pdf/
  );

  fireEvent.click(ui.getByTestId('rt-workbench-export-csv'));
  assert.match(
    ui.getByTestId('rt-workbench-export-status').textContent || '',
    /RT-INT-2026-777_all_codes\.csv/
  );

  fireEvent.click(ui.getByTestId('rt-workbench-save-archive'));

  // 4. Verify saved report appears in Archive tab and localStorage
  fireEvent.click(ui.getByTestId('rt-workbench-tab-archive'));
  assert.match(
    ui.getByTestId('rt-workbench-archive-list').textContent || '',
    /RT-INT-2026-777/
  );
  const storedRaw = localStorage.getItem(RT_FILM_REPORTS_ARCHIVE_STORAGE_KEY);
  assert.ok(storedRaw && storedRaw.includes('RT-INT-2026-777'));
});

