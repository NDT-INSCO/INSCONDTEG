import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { CertificationCenter } from '../src/components/academy/CertificationCenter';
import {
  getPracticeExamExamples, getExamPracticePlans, saveExamPracticePlan, removeExamPracticePlan,
  checkCandidateEligibility, getMockExamQuestions,
} from '../src/utils/certificationExamService';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement, CustomEvent: dom.window.CustomEvent, Event: dom.window.Event,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});

const { render, fireEvent, cleanup, within } = await import('@testing-library/react');
afterEach(() => { cleanup(); dom.window.localStorage.clear(); });

test('the guide keeps the catalog, schemes and mock tests, without promising certification', () => {
  const ui = render(<CertificationCenter language="en" />);
  assert.ok(ui.getByText(/Qualification Guide & Exam Practice/i));
  assert.ok(ui.getByText(/does not book exams or issue professional certification/i));
  assert.ok(ui.getByRole('button', { name: 'Exam Catalog & Prerequisites' }));
  assert.ok(ui.getByRole('button', { name: 'Pre-Exam Mock Simulator' }));
  assert.ok(ui.getByRole('button', { name: 'Eligibility Calculator' }));
  for (const code of ['ASNT-UT-L1', 'API-570-ICP', 'CSWIP-WELD-3.1']) assert.ok(ui.getByText(code));
  assert.equal(ui.queryByText(/authorized testing centers|official fee/i), null);
});

test('the guide and practice labels are available in Arabic', () => {
  const ui = render(<CertificationCenter language="ar" />);
  assert.ok(ui.getByText(/دليل التأهيل والتدريب على الاختبارات/i));
  assert.ok(ui.getByText(/لا يوجد حجز رسمي/i));
  assert.ok(ui.getByText(/دليل الاختبارات وشروط الأهلية/i));
  assert.ok(ui.getByText(/محاكي الاختبارات التجريبية/i));
  assert.ok(ui.getByText(/حاسبة الأهلية السريعة/i));
});

test('example eligibility still computes requirements without awarding qualification', () => {
  const example = getPracticeExamExamples().find(exam => exam.id === 'asnt_ut_lvl1')!;
  const report = checkCandidateEligibility(example);
  assert.equal(report.examId, 'asnt_ut_lvl1');
  assert.equal(report.trainingHoursRequired, 40);
  assert.equal(report.experienceMonthsRequired, 3);
});

test('study plans save locally, can be removed, and cannot encode an admission ticket', () => {
  assert.equal(saveExamPracticePlan('asnt_ut_lvl1', '2027-02-30', 'remote'), null);
  const plan = saveExamPracticePlan('asnt_ut_lvl1', '2027-02-20', 'remote');
  assert.ok(plan?.id.startsWith('practice_'));
  assert.deepEqual(getExamPracticePlans(), [plan]);
  assert.deepEqual(Object.keys(plan!), ['id', 'examId', 'studyOn', 'format']);
  assert.ok(removeExamPracticePlan(plan!.id));
  assert.deepEqual(getExamPracticePlans(), []);
});

test('legacy local records lose identity, attestation and simulated admission references', () => {
  localStorage.setItem('insco_exam_registrations_v1', JSON.stringify([{
    registrationId: 'reg_17', examId: 'asnt_ut_lvl1', examDate: '2027-01-01', examFormatMode: 'in_person_center',
    candidateEmail: 'fixture@example.org', nationalIdOrPassport: 'PRIVATE-ID', admissionNumber: 'INSCO-ADM-17', status: 'Confirmed',
  }]));
  assert.deepEqual(getExamPracticePlans(), [{ id: 'reg_17', examId: 'asnt_ut_lvl1', studyOn: '2027-01-01', format: 'in_person' }]);
  assert.equal(localStorage.getItem('insco_exam_registrations_v1'), null);
  assert.doesNotMatch(localStorage.getItem('insco_exam_practice_plans_v1')!, /PRIVATE-ID|fixture@|Confirmed|INSCO-ADM/);
});

test('practice plan dialog uses only study options and can be dismissed with Escape', () => {
  const ui = render(<CertificationCenter language="en" />);
  const open = ui.getAllByRole('button', { name: 'Plan study session' })[0];
  open.focus();
  fireEvent.click(open);
  const dialog = within(ui.getByRole('dialog', { name: 'Plan a study session' }));
  assert.ok(dialog.getByLabelText('Study date'));
  assert.ok(dialog.getByRole('combobox', { name: 'Study format' }));
  assert.equal(dialog.queryByLabelText(/passport|email|phone/i), null);
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(ui.queryByRole('dialog'), null);
  assert.equal(document.activeElement, open);
});

test('mock simulator keeps its questions and timed practice', () => {
  assert.ok(getMockExamQuestions().length >= 5);
  const ui = render(<CertificationCenter language="en" initialTab="mock_test" />);
  assert.ok(ui.getByText(/NDT Mock Test Simulator/i));
  assert.ok(ui.getByText(/Select Target Exam Specialty/i));
  fireEvent.click(ui.getByRole('button', { name: /Start Mock Practice Test Now/i }));
  assert.ok(ui.getByText(/Question 1 of/i));
  assert.ok(ui.getByText(/Submit Exam/i));
});

test('calculator gives a clearly labeled illustrative study match', () => {
  const ui = render(<CertificationCenter language="en" initialTab="calculator" />);
  assert.ok(ui.getByText(/Interactive NDT Certification Eligibility Calculator/i));
  assert.ok(ui.getByText(/ILLUSTRATIVE STUDY MATCH/i));
  assert.ok(ui.getByText(/not an authorization/i));
});
