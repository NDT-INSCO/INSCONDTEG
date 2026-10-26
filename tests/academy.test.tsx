import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { AcademyKnowledgeLibrary } from '../src/components/academy/AcademyKnowledgeLibrary';
import { KNOWLEDGE_LESSONS, ACADEMY_SOURCES } from '../src/data/academyKnowledge';
import { ACADEMY_ROADMAP, ROADMAP_STATES } from '../src/data/academyRoadmap';
import { AcademyDevelopmentRoadmap } from '../src/components/academy/AcademyDevelopmentRoadmap';
import { ACADEMY_SUBJECTS } from '../src/data/academySubjects';
import { ACADEMY_CASES } from '../src/data/academyCases';
import { ENGINEERING_DISCIPLINES } from '../src/data/academyCurriculum';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement });
const { render, fireEvent, cleanup } = await import('@testing-library/react');
afterEach(() => { cleanup(); localStorage.clear(); });
const open = (language: 'ar' | 'en' = 'en', onCurriculum = (_id: string) => {}) => render(<AcademyKnowledgeLibrary language={language} onCurriculum={onCurriculum} />);

test('all lessons have unique IDs, valid sources, bilingual content and valid answers', () => {
  assert.equal(new Set(KNOWLEDGE_LESSONS.map(l => l.id)).size, KNOWLEDGE_LESSONS.length);
  assert.equal(KNOWLEDGE_LESSONS.length, 24);
  for (const l of KNOWLEDGE_LESSONS) {
    assert.ok(ENGINEERING_DISCIPLINES.some(d => d.id === l.discipline));
    assert.ok(l.sources.length && l.sources.every(id => ACADEMY_SOURCES.some(s => s.id === id)));
    assert.ok(l.answer >= 0 && l.answer < l.options.length);
    for (const lang of ['ar', 'en'] as const) {
      assert.ok(l.title[lang] && l.example[lang] && l.explanation[lang]);
      assert.equal(l.sections.length, 3);
      assert.ok(l.sections.every(s => s.body[lang].length > 80));
    }
  }
  for (const d of ENGINEERING_DISCIPLINES) assert.ok(KNOWLEDGE_LESSONS.some(l => l.discipline === d.id));
});

test('search, empty state and reset', () => {
  const ui = open();
  fireEvent.change(ui.getByRole('textbox', { name: 'Search lessons' }), { target: { value: 'no-such-lesson' } });
  assert.ok(ui.getByText(/No results/));
  fireEvent.click(ui.getByRole('button', { name: 'Clear search and filters' }));
  assert.ok(ui.getAllByRole('button', { name: /Measurement, units/ })[0]);
  fireEvent.change(ui.getByRole('textbox'), { target: { value: 'capillary' } });
  assert.ok(ui.getByRole('button', { name: /PT: wetting/ }));
  assert.equal(ui.queryByRole('button', { name: /FOUNDATION Measurement, units/ }), null);
});

test('Arabic search handles hamza and renders RTL', () => {
  const ui = open('ar');
  assert.equal(ui.container.firstElementChild?.getAttribute('dir'), 'rtl');
  fireEvent.change(ui.getByRole('textbox'), { target: { value: 'الانبعاث' } });
  assert.ok(ui.getByRole('button', { name: /الانبعاث الصوتي/ }));
});

test('discipline filter and related curriculum navigation', () => {
  let destination = '';
  const ui = open('en', id => { destination = id; });
  fireEvent.change(ui.getByRole('combobox'), { target: { value: 'api_inspection' } });
  fireEvent.click(ui.getByRole('button', { name: /Corrosion rate & remaining life/ }));
  fireEvent.click(ui.getByRole('button', { name: 'Open related curriculum' }));
  assert.equal(destination, 'api_inspection');
});

test('knowledge check requires selection, explains wrong answer and allows retry', () => {
  const ui = open();
  fireEvent.click(ui.getAllByRole('button', { name: /Measurement, units/ })[0]);
  assert.equal((ui.getByRole('button', { name: 'Check answer' }) as HTMLButtonElement).disabled, true);
  fireEvent.click(ui.getByRole('radio', { name: 'Always' }));
  fireEvent.click(ui.getByRole('button', { name: 'Check answer' }));
  assert.ok(ui.getByText('Review the concept and try again'));
  fireEvent.click(ui.getByRole('button', { name: 'Try again' }));
  fireEvent.click(ui.getByRole('radio', { name: 'No; a common bias may remain' }));
  fireEvent.click(ui.getByRole('button', { name: 'Check answer' }));
  assert.ok(ui.getByText('Correct'));
  fireEvent.click(ui.getByRole('button', { name: 'Next lesson →' }));
  assert.equal(ui.getAllByRole('radio').some(r => (r as HTMLInputElement).checked), false);
});

test('read/unread persists without affecting existing curriculum progress', () => {
  localStorage.setItem('insco_academy_completed_modules', '{"existing":true}');
  const ui = open();
  fireEvent.click(ui.getAllByRole('button', { name: /Measurement, units/ })[0]);
  fireEvent.click(ui.getByRole('button', { name: 'Mark as read' }));
  assert.deepEqual(JSON.parse(localStorage.getItem('insco_knowledge_read_v1')!), ['measurement']);
  assert.equal(localStorage.getItem('insco_academy_completed_modules'), '{"existing":true}');
  ui.unmount();
  const reloaded = open();
  assert.equal(reloaded.getByRole('progressbar').getAttribute('aria-valuenow'), '1');
  fireEvent.click(reloaded.getAllByRole('button', { name: /Measurement, units/ })[0]);
  fireEvent.click(reloaded.getByRole('button', { name: 'Mark as unread' }));
  assert.equal(reloaded.getByRole('progressbar').getAttribute('aria-valuenow'), '0');
});

test('malformed and duplicate saved progress is handled', () => {
  localStorage.setItem('insco_knowledge_read_v1', 'null');
  const ui = open();
  assert.equal(ui.getByRole('progressbar').getAttribute('aria-valuenow'), '0');
  ui.unmount();
  localStorage.setItem('insco_knowledge_read_v1', '["measurement","measurement","unknown",42]');
  const next = open();
  assert.equal(next.getByRole('progressbar').getAttribute('aria-valuenow'), '1');
});

test('source directory has safe external links and lesson references', () => {
  const ui = open();
  fireEvent.click(ui.getByRole('button', { name: 'Source library' }));
  assert.equal(ui.getAllByRole('link').length, ACADEMY_SOURCES.length);
  for (const link of ui.getAllByRole('link')) {
    assert.ok(link.getAttribute('href')?.startsWith('https://'));
    assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
  }
});

test('roadmap separates available, review and planned work with ordered valid dependencies', () => {
  assert.equal(new Set(ACADEMY_ROADMAP.map(stage => stage.id)).size, ACADEMY_ROADMAP.length);
  for (let i = 0; i < ACADEMY_ROADMAP.length; i++) {
    const stage = ACADEMY_ROADMAP[i];
    assert.ok(stage.state in ROADMAP_STATES);
    assert.ok(stage.dependsOn.every(id => ACADEMY_ROADMAP.slice(0, i).some(previous => previous.id === id)));
    for (const language of ['ar', 'en'] as const) {
      assert.ok(stage.title[language] && stage.goal[language] && stage.acceptance[language]);
      assert.ok(stage.deliverables.length > 0 && stage.deliverables.every(item => item[language]));
    }
  }
  assert.equal(ACADEMY_ROADMAP.find(stage => stage.id === 'validation')?.state, 'review');
  assert.equal(ACADEMY_ROADMAP.find(stage => stage.id === 'practical-assessment')?.state, 'planned');
});

test('roadmap displays live content counts without claiming deployment or qualification', () => {
  const ui = render(<AcademyDevelopmentRoadmap language="en" onOpenLesson={() => {}} onOpenCases={() => {}} />);
  assert.equal(ui.getByTestId('roadmap-lessons').textContent, String(KNOWLEDGE_LESSONS.length));
  assert.equal(ui.getByTestId('roadmap-subjects').textContent, String(ACADEMY_SUBJECTS.length));
  assert.equal(ui.getByTestId('roadmap-models').textContent, String(new Set(ACADEMY_SUBJECTS.flatMap(s => s.lab ? [s.lab] : [])).size));
  assert.equal(ui.getByTestId('roadmap-cases').textContent, String(ACADEMY_CASES.length));
  assert.equal(ui.getByTestId('roadmap-sources').textContent, String(ACADEMY_SOURCES.length));
  assert.ok(ui.getByText(/does not indicate qualification completion/));
  assert.ok(ui.getByText('Review and validation needed'));
  assert.equal(ui.getAllByText('Planned — not implemented yet').length, 3);
});

test('roadmap library entry opens the real safety lesson', () => {
  const ui = render(<AcademyKnowledgeLibrary language="en" onCurriculum={() => {}} />);
  fireEvent.click(ui.getByRole('button', { name: 'Development roadmap' }));
  fireEvent.click(ui.getByRole('button', { name: 'Start with safety & foundations' }));
  assert.ok(ui.getByRole('heading', { name: 'Safety & limits of educational simulation' }));
});

test('roadmap opens all cases without reusing a lesson-specific filter', () => {
  const ui = render(<AcademyKnowledgeLibrary language="en" onCurriculum={() => {}} />);
  fireEvent.click(ui.getByRole('button', { name: 'Development roadmap' }));
  fireEvent.click(ui.getByRole('button', { name: 'Open the case workbook' }));
  assert.ok(ui.getByText(`Cases reviewed: 0/${ACADEMY_CASES.length}`));
});

test('Arabic roadmap uses RTL and does not modify learning progress storage', () => {
  localStorage.setItem('insco_knowledge_read_v1', '["measurement"]');
  const ui = render(<AcademyKnowledgeLibrary language="ar" onCurriculum={() => {}} />);
  fireEvent.click(ui.getByRole('button', { name: 'خطة تطوير الأكاديمية' }));
  assert.equal(ui.getByRole('region', { name: 'خريطة استكمال الأكاديمية' }).getAttribute('dir'), 'rtl');
  assert.ok(ui.getByText('متاح في نسخة العمل'));
  assert.equal(localStorage.getItem('insco_knowledge_read_v1'), '["measurement"]');
});
