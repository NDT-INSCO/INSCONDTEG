import React from 'react';
import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';

import {
  PRACTICAL_METHODS,
  PRACTICAL_TASKS,
  PPA_POLICY,
  getPracticalTask,
  tasksForMethod,
} from '../src/data/practicalAssessment';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  get length() { return this.store.size; }
}

const storage = new MemoryStorage();
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy', pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: storage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const {
  PPA_STORAGE_KEY,
  createPracticalAssessment,
  deletePracticalAssessment,
  exportPracticalAssessments,
  practicalStats,
  readPracticalAssessments,
  resetPracticalAssessments,
  summarise,
} = await import('../src/utils/practicalAssessment');
const { PracticalAssessmentView } = await import('../src/components/academy/PracticalAssessmentView');
const { render, fireEvent, cleanup, screen } = await import('@testing-library/react');

const task = PRACTICAL_TASKS[0];

function makeRecord(overrides: Record<string, unknown> = {}) {
  const scores = task.criteria.map(criterion => ({ criterionId: criterion.id, score: 3 as const }));
  return {
    taskId: task.id,
    candidate: 'متدرّب تجريبي',
    assessor: 'مقيّم مستقل',
    assessorRef: '',
    performedOn: '2026-10-21',
    specimenId: 'SPEC-01',
    procedureRef: 'PROC-UT-01 rev 2',
    notes: '',
    declared: true,
    scores,
    ...overrides,
  };
}

beforeEach(() => storage.clear());
afterEach(() => cleanup());

test('the task bank covers all six methods with observable, bilingual criteria', () => {
  assert.deepEqual([...new Set(PRACTICAL_TASKS.map(item => item.method))].sort(), [...PRACTICAL_METHODS].sort());
  const ids = new Set<string>();
  for (const item of PRACTICAL_TASKS) {
    assert.ok(!ids.has(item.id), `duplicate task id ${item.id}`);
    ids.add(item.id);
    assert.ok(item.criteria.length >= 4, `${item.id} needs at least four criteria`);
    assert.ok(item.criteria.filter(criterion => criterion.critical).length >= 1, `${item.id} needs a critical step`);
    assert.ok(item.equipment.length >= 3, `${item.id} needs equipment`);
    for (const criterion of item.criteria) {
      assert.ok(criterion.label.ar.trim() && criterion.label.en.trim(), `${criterion.id} label`);
      assert.ok(criterion.evidence.ar.trim() && criterion.evidence.en.trim(), `${criterion.id} evidence`);
    }
  }
  assert.equal(tasksForMethod('VT').length, PRACTICAL_TASKS.filter(item => item.method === 'VT').length);
  assert.equal(getPracticalTask('does-not-exist'), undefined);
});

test('a fully met record is complete and meets the training criteria', () => {
  const { record } = createPracticalAssessment(makeRecord());
  assert.ok(record);
  const summary = summarise(record!);
  assert.equal(summary.percent, 100);
  assert.deepEqual(summary.criticalFailures, []);
  assert.equal(summary.outcome, 'meets');
  assert.equal(summary.complete, true);
});

test('a critical step below "meets" fails the record regardless of total score', () => {
  const critical = task.criteria.find(criterion => criterion.critical)!;
  const scores = task.criteria.map(criterion => ({
    criterionId: criterion.id,
    score: (criterion.id === critical.id ? 1 : 3) as 1 | 3,
  }));
  const { record } = createPracticalAssessment(makeRecord({ scores }));
  const summary = summarise(record!);
  assert.equal(summary.outcome, 'not_yet');
  assert.deepEqual(summary.criticalFailures, [critical.id]);
  assert.ok(summary.percent > 80, 'score can still be high while the outcome fails');
});

test('an unscored criterion keeps the record incomplete and blocks a pass', () => {
  const scores = task.criteria.slice(1).map(criterion => ({ criterionId: criterion.id, score: 3 as const }));
  const { record } = createPracticalAssessment(makeRecord({ scores }));
  const summary = summarise(record!);
  assert.equal(summary.complete, false);
  assert.ok(summary.missingFields.includes('scores'));
  assert.equal(summary.outcome, 'not_yet');
});

test('identity fields and the declaration are required for completeness', () => {
  const { record } = createPracticalAssessment(makeRecord({ candidate: '', assessor: '', declared: false }));
  const summary = summarise(record!);
  assert.equal(summary.complete, false);
  assert.deepEqual(summary.missingFields.sort(), ['assessor', 'candidate', 'declaration']);
});

test('unknown tasks, criteria and out-of-range scores are rejected on save', () => {
  assert.equal(createPracticalAssessment(makeRecord({ taskId: 'made-up' })).record, null);

  const scores = [
    ...task.criteria.map(criterion => ({ criterionId: criterion.id, score: 3 as const })),
    { criterionId: 'ghost-criterion', score: 3 as any },
    { criterionId: task.criteria[0].id, score: 9 as any },
  ];
  const { record } = createPracticalAssessment(makeRecord({ scores }));
  assert.equal(record!.scores.length, task.criteria.length);
  assert.ok(record!.scores.every(row => row.score >= 0 && row.score <= 3));
});

test('stored records are sanitised on read and survive a reload', () => {
  createPracticalAssessment(makeRecord());
  const loaded = readPracticalAssessments();
  assert.equal(loaded.length, 1);

  storage.setItem(PPA_STORAGE_KEY, JSON.stringify([
    { taskId: task.id, candidate: 'x'.repeat(500), assessor: 'a', performedOn: 'not-a-date', scores: [{ criterionId: task.criteria[0].id, score: 2 }] },
    { taskId: 'evil', candidate: 'nobody' },
    'not-an-object',
  ]));
  const sanitised = readPracticalAssessments();
  assert.equal(sanitised.length, 1);
  assert.equal(sanitised[0].candidate.length, 80);
  assert.equal(sanitised[0].performedOn, '');
  assert.equal(sanitised[0].declared, false);
});

test('malformed storage never throws', () => {
  storage.setItem(PPA_STORAGE_KEY, '{broken');
  assert.deepEqual(readPracticalAssessments(), []);
  storage.setItem(PPA_STORAGE_KEY, '{"not":"an array"}');
  assert.deepEqual(readPracticalAssessments(), []);
});

test('records can be deleted and reset', () => {
  const { record } = createPracticalAssessment(makeRecord());
  assert.equal(readPracticalAssessments().length, 1);
  assert.equal(deletePracticalAssessment(record!.id), true);
  assert.equal(readPracticalAssessments().length, 0);
  createPracticalAssessment(makeRecord());
  assert.equal(resetPracticalAssessments(), true);
  assert.equal(readPracticalAssessments().length, 0);
});

test('stats count complete passes per method', () => {
  createPracticalAssessment(makeRecord());
  const critical = task.criteria.find(criterion => criterion.critical)!;
  createPracticalAssessment(makeRecord({
    scores: task.criteria.map(criterion => ({ criterionId: criterion.id, score: (criterion.id === critical.id ? 0 : 3) as 0 | 3 })),
  }));
  const stats = practicalStats();
  assert.equal(stats.total, 2);
  assert.equal(stats.complete, 2);
  assert.equal(stats.meets, 1);
  assert.equal(stats.byMethod[task.method], 2);
  assert.equal(stats.methodsCovered, 1);
});

test('the export states explicitly that it is not a certificate', () => {
  createPracticalAssessment(makeRecord());
  const payload = JSON.parse(exportPracticalAssessments());
  assert.equal(payload.format, 'INSCO-PPA');
  assert.match(payload.notice, /Not a certificate/i);
  assert.match(payload.notice, /not evidence of competence/i);
  assert.match(payload.notice, /ASNT/);
  assert.match(payload.disclaimerAr, /ليس شهادة/);
  assert.equal(payload.records.length, 1);
  assert.equal(payload.records[0].summary.outcome, 'meets');
});

test('the policy forbids self-assessment and explains the critical-step rule', () => {
  assert.match(PPA_POLICY.assessorRule.en, /cannot sign their own/i);
  assert.match(PPA_POLICY.outcomeRule.en, /critical step below/i);
  assert.match(PPA_POLICY.statement.en, /not a certificate/i);
});

test('the view renders the task bank and refuses to save without a declaration', () => {
  const ui = render(<PracticalAssessmentView language="en" />);
  assert.ok(ui.getAllByText(/Training practical assessment/i).length >= 1);
  assert.ok(ui.getByText(/Documented practical tasks/i));
  fireEvent.click(ui.getAllByText(/Start assessment/i)[0]);
  assert.ok(ui.getByText(/Performance criteria/i));

  const save = ui.getByRole('button', { name: /Save record/i }) as HTMLButtonElement;
  assert.equal(save.disabled, true, 'save must be disabled until the declaration is accepted');
});

test('a record can be created through the form and appears in the list', () => {
  const ui = render(<PracticalAssessmentView language="en" />);
  fireEvent.click(ui.getAllByText(/Start assessment/i)[0]);

  const inputs = Array.from(ui.container.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
  const [candidateInput, assessorInput, , , specimenInput] = inputs;
  fireEvent.change(candidateInput, { target: { value: 'Test Candidate' } });
  fireEvent.change(assessorInput, { target: { value: 'Independent Assessor' } });
  fireEvent.change(specimenInput, { target: { value: 'SPEC-9' } });

  const groups = ui.getAllByRole('radiogroup');
  groups.forEach(group => {
    const meets = Array.from(group.querySelectorAll('button')).find(button => button.textContent?.startsWith('2 ·'));
    assert.ok(meets);
    fireEvent.click(meets!);
  });

  fireEvent.click(ui.getByRole('checkbox'));
  fireEvent.click(ui.getByRole('button', { name: /Save record/i }));

  const stored = readPracticalAssessments();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].candidate, 'Test Candidate');
  assert.equal(summarise(stored[0]).outcome, 'meets');
  assert.ok(ui.getByText(/Candidate \(local\)/i));
});
