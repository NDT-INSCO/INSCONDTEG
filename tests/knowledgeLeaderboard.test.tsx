import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { KnowledgeLeaderboard } from '../src/components/academy/KnowledgeLeaderboard';
import { 
  getKnowledgeLeaderboard, 
  getCurrentStudentProfile, 
  logStudySession, 
  updateStudentProfile,
  calculateTier,
  calculateXp
} from '../src/utils/knowledgeLeaderboardService';

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

test('calculateTier assigns correct tiers based on XP thresholds', () => {
  assert.equal(calculateTier(4500), 'Master');
  assert.equal(calculateTier(3500), 'Diamond');
  assert.equal(calculateTier(2600), 'Platinum');
  assert.equal(calculateTier(1900), 'Gold');
  assert.equal(calculateTier(1200), 'Silver');
  assert.equal(calculateTier(500), 'Bronze');
});

test('calculateXp accurately computes composite score from metrics', () => {
  const xp = calculateXp({
    studyHours: 10, // 10 * 25 = 250
    completedModules: 2, // 2 * 50 = 100
    completedTopics: 5, // 5 * 10 = 50
    quizzesTaken: 4, // 4 * 25 = 100
    quizAccuracy: 90 // 90/100 * 300 = 270
  });
  assert.equal(xp, 250 + 100 + 50 + 100 + 270);
});

test('logStudySession records hours and updates user profile', () => {
  const result = logStudySession({
    date: new Date().toISOString(),
    durationMinutes: 90,
    topicOrDiscipline: 'ASME Section V Calibration',
    sessionType: 'reading'
  });

  assert.ok(result.totalMinutes >= 90);
  assert.ok(result.totalHours >= 1.5);

  const profile = getCurrentStudentProfile();
  assert.ok(profile.studyHours >= 1.5);
  assert.ok(profile.xp > 0);
});

test('getKnowledgeLeaderboard returns sorted performers including current student', () => {
  const data = getKnowledgeLeaderboard({ timeframe: 'all_time', sortMetric: 'xp' });
  assert.ok(data.rankedPerformers.length >= 8);
  assert.ok(data.currentUserRank > 0);
  assert.ok(data.currentUser);

  // Verification that top performer has the highest XP
  const top1 = data.rankedPerformers[0];
  const top2 = data.rankedPerformers[1];
  assert.ok(top1.xp >= top2.xp);
});

test('KnowledgeLeaderboard renders header, podium, and student profile card', () => {
  const ui = render(<KnowledgeLeaderboard language="en" />);
  
  // Confirms header banner renders
  assert.ok(ui.getByText(/Knowledge & Competency Leaderboard/i));
  assert.ok(ui.getByText(/Educational Academy Knowledge Leaderboard/i));

  // Confirms podium elements are present
  assert.ok(ui.getAllByText(/Grand Champion/i).length > 0);

  // Confirms action buttons exist
  assert.ok(ui.getByText(/Start Focus Study Session/i));
  assert.ok(ui.getByText(/Log Self-Study Hours/i));

  // Confirms sorting tabs exist
  assert.ok(ui.getAllByText(/Active Study Hours/i).length > 0);
  assert.ok(ui.getAllByText(/Quiz Accuracy/i).length > 0);
});

test('KnowledgeLeaderboard renders Arabic RTL layout with correct Arabic labels', () => {
  const ui = render(<KnowledgeLeaderboard language="ar" />);
  
  assert.equal(ui.container.firstElementChild?.getAttribute('dir'), 'rtl');
  assert.ok(ui.getByText(/لوحة متصدري المعرفة وساعات الدراسة النشطة/i));
  assert.ok(ui.getByText(/بدء مؤقت دراسة مركزة/i));
});
