import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { BookViewer } from '../src/components/BookViewer';
import { NDT_TEXTBOOKS } from '../src/data/ndeTextbooksData';
import { generateKnowledgeCheckQuestions } from '../src/utils/knowledgeCheckGenerator';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#textbooks' });
Object.assign(globalThis, { 
  window: dom.window, 
  document: dom.window.document, 
  localStorage: dom.window.localStorage, 
  HTMLElement: dom.window.HTMLElement,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
});

// Provide fallback 2D context for JSDOM canvas tests
if (!dom.window.HTMLCanvasElement.prototype.getContext) {
  dom.window.HTMLCanvasElement.prototype.getContext = (() => ({
    fillRect() {},
    clearRect() {},
    getImageData() { return { data: [] }; },
    putImageData() {},
    createImageData() { return []; },
    setTransform() {},
    drawImage() {},
    save() {},
    fillText() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    stroke() {},
    fill() {},
    arc() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    setLineDash() {}
  })) as any;
}

const { render, fireEvent, cleanup } = await import('@testing-library/react');
afterEach(() => { cleanup(); localStorage.clear(); });

test('knowledge check generator produces valid bilingual questions for every textbook page', () => {
  for (const book of NDT_TEXTBOOKS) {
    for (const page of book.pages) {
      const questions = generateKnowledgeCheckQuestions(page, 'ar', book.discipline);
      assert.ok(questions.length > 0, `Page ${page.pageNumber} in ${book.id} must have questions`);
      for (const q of questions) {
        assert.ok(q.questionAr.length > 10);
        assert.ok(q.questionEn.length > 10);
        assert.equal(q.optionsAr.length, 4);
        assert.equal(q.optionsEn.length, 4);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
        assert.ok(q.explanationAr.length > 10);
        assert.ok(q.explanationEn.length > 10);
      }
    }
  }
});

test('BookViewer renders initial page and simulates 3D book navigation', () => {
  const ui = render(<BookViewer language="en" initialBookId="book-ut" />);
  
  // Confirms the textbook title and page title appear
  assert.ok(ui.getByText(NDT_TEXTBOOKS[0].titleEn));
  assert.ok(ui.getByText(NDT_TEXTBOOKS[0].pages[0].pageTitleEn));

  // Confirms Knowledge Check section is rendered for current page
  assert.ok(ui.getByText('Knowledge Check Quiz'));

  // Test page turn forward
  const nextBtn = ui.getByRole('button', { name: /Flip to Next Page/i });
  assert.ok(nextBtn);
  fireEvent.click(nextBtn);
});

test('BookViewer Knowledge Check interactive feedback allows option selection and provides explanation', () => {
  const ui = render(<BookViewer language="en" initialBookId="book-ut" />);
  
  // Find option 0 in the Knowledge Check
  const option0 = ui.getByTestId('knowledge-check-option-0');
  assert.ok(option0);

  // Click option
  fireEvent.click(option0);

  // Check that certified explanation appears
  assert.ok(ui.getByText(/Certified Engineering Explanation:/i));
});

test('NdeReferenceTablesView renders acoustic properties and engineering tables correctly', async () => {
  const { NdeReferenceTablesView } = await import('../src/components/academy/NdeReferenceTablesView');
  const ui = render(<NdeReferenceTablesView language="en" />);
  
  // Confirms acoustic materials table is shown
  assert.ok(ui.getByText(/Carbon Steel \(AISI 1020\)/i));
  assert.ok(ui.getByText(/Aircraft Aluminum \(7075-T6\)/i));

  // Switch to Radioisotopes tab
  const isotopesTab = ui.getByRole('button', { name: /Radioisotopes & Shielding/i });
  assert.ok(isotopesTab);
  fireEvent.click(isotopesTab);

  // Confirms radioisotopes are rendered
  assert.ok(ui.getByText(/Iridium-192/i));
  assert.ok(ui.getByText(/Cobalt-60/i));
});

test('VirtualLab experiments data and CalibrationReportModal render correctly', async () => {
  const { VIRTUAL_LAB_EXPERIMENTS } = await import('../src/data/virtualLabData');
  const { CalibrationReportModal } = await import('../src/components/academy/virtuallab/CalibrationReportModal');

  // Verify all experiments are defined with required properties
  assert.equal(VIRTUAL_LAB_EXPERIMENTS.length, 4);
  for (const exp of VIRTUAL_LAB_EXPERIMENTS) {
    assert.ok(exp.id.length > 0);
    assert.ok(exp.titleAr.length > 5);
    assert.ok(exp.titleEn.length > 5);
    assert.ok(exp.steps.length >= 3);
    assert.ok(exp.objectivesAr.length >= 3);
    assert.ok(exp.standard.length > 0);
  }

  // Render CalibrationReportModal and verify official compliance text
  const mockReport = {
    certificateId: 'INSC-CAL-2026-001',
    technicianName: 'Eng. Ahmad NDT Specialist',
    companyName: 'INSCO NDT International',
    discipline: 'Ultrasonic Testing (UT Level II)',
    experimentTitle: 'Range & Sound Velocity Calibration on IIW V1 Block',
    standard: 'ASME Sec V Art. 4 / ISO 2400',
    date: '2026-10-21',
    equipmentModel: 'INSCO EPOCH 650',
    equipmentSerial: 'USM-98442',
    transducerModel: 'N0-5MHz-Longitudinal',
    transducerFreqMHz: 5.0,
    transducerSizeMm: 12.7,
    transducerAngleDeg: 0,
    blockType: 'IIW Type 1 (ISO 2400)',
    calibratedVelocity: 5920,
    calibratedZeroDelay: 0.8,
    calibratedGainDb: 44.0,
    referenceEchoFshPercent: 80.0,
    status: 'PASSED' as const,
    evaluatorNotesAr: 'تمت المعايرة بنجاح تام وفق متطلبات الكود المعياري ASME Sec V.',
    evaluatorNotesEn: 'Calibration fully verified according to ASME Sec V code requirements.'
  };

  const modalUi = render(
    <CalibrationReportModal
      isOpen={true}
      onClose={() => {}}
      language="ar"
      reportData={mockReport}
    />
  );

  assert.ok(modalUi.getByText(/INSC-CAL-2026-001/i));
  assert.ok(modalUi.getByText(/Eng. Ahmad NDT Specialist/i));
  assert.ok(modalUi.getAllByText(/5920 m\/s/i).length > 0);
  assert.ok(modalUi.getAllByText(/PASSED/i).length > 0);
  assert.ok(modalUi.getByText(/CALIBRATION VERIFIED/i));
});

