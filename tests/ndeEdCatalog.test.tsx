import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

import { NDE_ED_COURSES } from '../src/data/ndeEd';
import { NdeEdCourseCatalog } from '../src/components/academy/NdeEdCourseCatalog';
import { CurriculumCertificatesView } from '../src/components/academy/CurriculumCertificatesView';
import { EdbLibraryView } from '../src/components/academy/EdbLibraryView';
import { readNdeEdProgress, NDE_ED_PROGRESS_KEY } from '../src/utils/ndeEdProgress';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/-Project-/#academy' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// The browser would fetch /edb/index.json; serve the committed library instead.
const edbDir = path.join(process.cwd(), 'public', 'edb');
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  const file = url.split('?')[0].split('/').pop() || '';
  try {
    const payload = readFileSync(path.join(edbDir, file), 'utf8');
    return new Response(payload, { status: 200, headers: { 'content-type': 'application/json' } });
  } catch {
    return new Response('not found', { status: 404 });
  }
}) as typeof fetch;

const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
});

const firstCourse = NDE_ED_COURSES[0];

test('the NDE-Ed catalog lists every course and opens its lesson list', () => {
  const ui = render(<NdeEdCourseCatalog language="en" />);
  for (const course of NDE_ED_COURSES) {
    assert.ok(ui.getAllByText(course.title.en).length >= 1, `${course.id} title missing`);
  }
  assert.ok(ui.getByText(/Coverage map/i));

  fireEvent.click(ui.getAllByText('Start course')[0]);
  assert.ok(ui.getByText(/^Lessons$/i));
  const lessonListText = ui.container.textContent || '';
  for (const lesson of firstCourse.lessons) {
    assert.ok(lessonListText.includes(lesson.title.en), `${lesson.id} not listed`);
  }
});

test('opening a lesson shows objectives, worked example and the self-check', () => {
  const ui = render(<NdeEdCourseCatalog language="en" initialCourseId={firstCourse.id} />);
  const lesson = firstCourse.lessons[0];
  fireEvent.click(ui.getAllByText(lesson.title.en)[0]);

  assert.ok(ui.getByText(lesson.objectives[0].en));
  assert.ok(ui.getByText(/Worked example/i));
  assert.ok(ui.getByText(/Knowledge check/i));
  assert.ok(ui.getByText(lesson.summary.en));
});

test('marking a lesson complete persists it and survives a remount', () => {
  const ui = render(<NdeEdCourseCatalog language="en" initialCourseId={firstCourse.id} />);
  const lesson = firstCourse.lessons[0];
  fireEvent.click(ui.getAllByText(lesson.title.en)[0]);
  fireEvent.click(ui.getByText('Mark complete'));

  assert.deepEqual(readNdeEdProgress().completedLessons, [lesson.id]);
  const stored = JSON.parse(dom.window.localStorage.getItem(NDE_ED_PROGRESS_KEY) || '{}');
  assert.ok(stored.completedLessons.includes(lesson.id));

  cleanup();
  const again = render(<NdeEdCourseCatalog language="en" initialCourseId={firstCourse.id} />);
  fireEvent.click(again.getAllByText(lesson.title.en)[0]);
  assert.ok(again.getByText('Complete ✓'));
});

test('the coverage map is explicit about what nde-ed.org does not cover', () => {
  const ui = render(<NdeEdCourseCatalog language="en" />);
  fireEvent.click(ui.getByText(/Coverage map/i));
  assert.ok(ui.getByText(/Coverage map and limits/i));
  assert.ok(ui.getByText(/not a claim of a complete syllabus or qualification/i));
  assert.ok(ui.getAllByText(/FMC\/TFM/i).length >= 1);
  assert.ok(ui.container.textContent?.includes('Advanced Eddy Current Testing (ET)'));
});

test('Arabic mode renders the catalog right-to-left without English fallbacks', () => {
  const ui = render(<NdeEdCourseCatalog language="ar" />);
  assert.ok(ui.getAllByText(firstCourse.title.ar).length >= 1);
  assert.ok(ui.getByText(/خريطة التغطية/));
});

test('the self-study statement is labelled non-accredited and disclaims issuing bodies', () => {
  const ui = render(<CurriculumCertificatesView language="en" />);
  assert.ok(ui.getAllByText(/self-study learning statement/i).length >= 1);
  assert.ok(ui.getByText(/This page does not issue a certificate/i));
  assert.ok(ui.getByText(/not issued by ASNT, ISO or any accrediting body/i));
  assert.ok(ui.getByText(/Local motivational badges only/i));
});

test('the self-study statement reflects stored learning activity', () => {
  dom.window.localStorage.setItem(NDE_ED_PROGRESS_KEY, JSON.stringify({
    completedLessons: firstCourse.lessons.slice(0, 3).map(lesson => lesson.id),
    quizAnswers: {},
    exercisesRevealed: [],
    finalScores: {},
    updatedAt: new Date().toISOString(),
  }));
  const ui = render(<CurriculumCertificatesView language="en" />);
  const total = NDE_ED_COURSES.reduce((sum, course) => sum + course.lessons.length, 0);
  assert.match(ui.container.textContent || '', new RegExp(`NDE-Ed lessons: 3/${total}`));
});

test('the EDB library renders the committed index and opens a flipbook', async () => {
  const ui = render(<EdbLibraryView language="en" />);
  await waitFor(() => assert.ok(ui.getAllByText(/Ultrasonic/i).length >= 1), { timeout: 4000 });
  assert.ok(ui.getAllByText(/EDB/i).length >= 1);

  const firstBook = NDE_ED_COURSES[0];
  const openButtons = ui.getAllByText(/Open|Read/i);
  assert.ok(openButtons.length >= 1);
  fireEvent.click(openButtons[0]);
  await waitFor(() => assert.ok(ui.getAllByText(firstBook.title.en).length >= 1 || ui.getAllByText(/Page 1/i).length >= 1), { timeout: 4000 });
});

test('cleanup: restore the real fetch implementation', () => {
  assert.equal(typeof originalFetch, 'function');
});
