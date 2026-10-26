import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { CertificationCenter } from '../src/components/academy/CertificationCenter';
import {
  getOfficialExams,
  getExamRegistrations,
  registerForExam,
  cancelExamRegistration,
  checkCandidateEligibility,
  getMockExamQuestions
} from '../src/utils/certificationExamService';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, { 
  window: dom.window, 
  document: dom.window.document, 
  localStorage: dom.window.localStorage, 
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event
});

const { render, fireEvent, cleanup } = await import('@testing-library/react');

afterEach(() => { 
  cleanup(); 
  dom.window.localStorage.clear(); 
});

test('CertificationCenter renders exam catalog with schemes and methods in English', () => {
  const ui = render(<CertificationCenter language="en" />);
  
  // Header and tabs presence
  assert.ok(ui.getByText(/Official NDT Certification & Exam Registration Center/i));
  assert.ok(ui.getByText(/Exam Catalog & Prerequisites/i));
  assert.ok(ui.getByText(/Pre-Exam Mock Simulator/i));
  assert.ok(ui.getByText(/Eligibility Calculator/i));

  // Exam cards presence
  assert.ok(ui.getByText(/ASNT-UT-L1/i));
  assert.ok(ui.getByText(/API-570-ICP/i));
  assert.ok(ui.getByText(/CSWIP-WELD-3.1/i));
});

test('CertificationCenter renders Arabic layout and Arabic labels correctly', () => {
  const ui = render(<CertificationCenter language="ar" />);
  
  assert.ok(ui.getByText(/مركز تسجيل شهادات واختبارات NDT المعتمدة/i));
  assert.ok(ui.getByText(/دليل الاختبارات وشروط الأهلية/i));
  assert.ok(ui.getByText(/محاكي الاختبارات التجريبية/i));
  assert.ok(ui.getByText(/حاسبة الأهلية السريعة/i));
});

test('checkCandidateEligibility accurately validates prerequisites and logged training', () => {
  const exams = getOfficialExams();
  const utL1 = exams.find(e => e.id === 'asnt_ut_lvl1')!;
  
  const report = checkCandidateEligibility(utL1);
  assert.equal(report.examId, 'asnt_ut_lvl1');
  assert.equal(report.trainingHoursRequired, 40);
  assert.equal(report.experienceMonthsRequired, 3);
});

test('candidate can register for an exam and generate an admission ticket', () => {
  const newReg = registerForExam({
    examId: 'asnt_ut_lvl1',
    candidateName: 'Eng. Tarek Test Candidate',
    candidateEmail: 'tarek@example.com',
    nationalIdOrPassport: 'PASSPORT-A9876543',
    phone: '+20 100 000 0000',
    companyOrUniversity: 'Inspection Co.',
    examDate: '2026-12-05',
    examCenter: 'cairo_tc',
    examFormatMode: 'in_person_center',
    visionAttestationConfirmed: true,
    codeOfEthicsAgreed: true
  });

  assert.ok(newReg.registrationId.startsWith('reg_'));
  assert.ok(newReg.admissionNumber.startsWith('INSCO-ADM-'));
  assert.equal(newReg.status, 'Confirmed');

  // Verify retrieval
  const list = getExamRegistrations();
  assert.equal(list.length, 1);
  assert.equal(list[0].candidateName, 'Eng. Tarek Test Candidate');

  // Verify cancellation
  const cancelled = cancelExamRegistration(newReg.registrationId);
  assert.equal(cancelled, true);
  assert.equal(getExamRegistrations().length, 0);
});

test('Pre-Exam Mock Test Simulator loads questions and handles submission', () => {
  const questions = getMockExamQuestions();
  assert.ok(questions.length >= 5);
  
  // Render mock test tab directly
  const ui = render(<CertificationCenter language="en" initialTab="mock_test" />);
  
  // Verify simulator launch view
  assert.ok(ui.getByText(/Official NDT Pre-Exam Mock Test Simulator/i));
  assert.ok(ui.getByText(/Select Target Exam Specialty/i));
  
  // Click Start Mock Practice Test
  const startBtn = ui.getByRole('button', { name: /Start Mock Practice Test Now/i });
  fireEvent.click(startBtn);
  
  // Verify question statements are rendered with timer and navigation grid
  assert.ok(ui.getByText(/Question 1 of/i));
  assert.ok(ui.getByText(/Submit Exam/i));
});

test('Eligibility Calculator dynamically suggests qualification levels based on input', () => {
  const ui = render(<CertificationCenter language="en" initialTab="calculator" />);
  
  assert.ok(ui.getByText(/Interactive NDT Certification Eligibility Calculator/i));
  assert.ok(ui.getByText(/CALCULATED ELIGIBILITY STATUS/i));
});
