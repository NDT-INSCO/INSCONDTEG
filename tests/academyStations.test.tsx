/**
 * P5 guard: the academy must be navigable as a seven-station journey without
 * losing a single tab. These tests fail if a tab is dropped, duplicated, or
 * assigned to no station — the exact regression a "tidy up the nav" change
 * usually causes.
 */
import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/-Project-/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { ACADEMY_TABS } = await import('../src/academyTabs');
const { AcademyStationNav, buildAcademyStations, stationForTab } = await import(
  '../src/components/academy/AcademyStationNav'
);
const { render, fireEvent, cleanup } = await import('@testing-library/react');
const { AcademyHub } = await import('../src/components/academy/AcademyHub');

const stations = buildAcademyStations({ books: 11, documents: 18, courses: 7, paths: 5 });

test('there are exactly seven journey stations', () => {
  assert.deepEqual(
    stations.map(station => station.id),
    ['choose', 'learn', 'practice', 'test', 'progress', 'tutor', 'university']
  );
});

test('every academy tab belongs to exactly one station', () => {
  const assigned = stations.flatMap(station => station.children.map(child => child.tab));
  const duplicates = assigned.filter((tab, index) => assigned.indexOf(tab) !== index);
  assert.deepEqual(duplicates, [], `tabs assigned twice: ${duplicates.join(', ')}`);

  const missing = ACADEMY_TABS.filter(tab => !assigned.includes(tab));
  assert.deepEqual(missing, [], `tabs with no station: ${missing.join(', ')}`);

  const unknown = assigned.filter(tab => !(ACADEMY_TABS as readonly string[]).includes(tab));
  assert.deepEqual(unknown, []);
  assert.equal(assigned.length, ACADEMY_TABS.length);
});

test('every tab resolves to the station that owns it', () => {
  for (const tab of ACADEMY_TABS) {
    const station = stationForTab(stations, tab);
    assert.ok(
      station.children.some(child => child.tab === tab),
      `${tab} resolved to ${station.id}, which does not list it`
    );
  }
});

test('a deep link marks its station and its own pill as current', () => {
  const ui = render(
    <AcademyStationNav stations={stations} activeSubTab="rt_lab" isAr onSelect={() => {}} />
  );

  const practice = ui.getByTestId('academy-simulation-labs-hub');
  assert.equal(practice.getAttribute('aria-current'), 'true');
  assert.match(practice.textContent || '', /معامل المحاكاة/);

  const activePills = [...ui.container.querySelectorAll('[aria-current="true"]')];
  // one station + the tab pill itself
  assert.equal(activePills.length, 2);

  cleanup();
});

test('the station bar only shows the children of the active station', () => {
  const ui = render(<AcademyStationNav stations={stations} activeSubTab="ask_ai" isAr onSelect={() => {}} />);

  assert.ok(ui.getByText('اسأل المستشار الأكاديمي'));
  assert.equal(ui.queryByText('خريطة الاستكمال'), null, 'other stations must stay hidden');
  assert.equal(ui.queryByText('محاكي عيوب اللحام (Defect Simulator)'), null);

  cleanup();
});

test('clicking a station opens its default tab', () => {
  const opened: string[] = [];
  const ui = render(
    <AcademyStationNav stations={stations} activeSubTab="paths" isAr onSelect={tab => opened.push(tab)} />
  );

  fireEvent.click(ui.getByTestId('academy-simulation-labs-hub'));
  fireEvent.click(ui.getByRole('button', { name: /تابع إنجازك|Track progress/ }));

  assert.deepEqual(opened, ['sim_labs_rt', 'completion_map']);
  cleanup();
});


test('the academy hub presents six sequential learner steps and the university separately', () => {
  const opened: string[] = [];
  const ui = render(<AcademyHub language="ar" onOpenHash={hash => opened.push(hash)} />);

  const journey = ui.container.querySelector('section[aria-label="رحلة التعلم الأساسية"]');
  assert.ok(journey, 'the core learning journey must be visible');
  assert.equal(journey.querySelectorAll('button').length, 6, 'the learner journey must contain six sequential steps');

  fireEvent.click(ui.getByTestId('academy-university-destination'));
  assert.deepEqual(opened, ['#academy/university']);
  cleanup();
});
