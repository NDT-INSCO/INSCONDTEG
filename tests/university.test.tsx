/**
 * جامعة إنسكو الروبوتية — the Robotic University contract test.
 *
 * Guards the properties the product promises: twelve specialisations with two
 * collector robots and a neural cell each, a documented and complete seed
 * archive, deterministic organisation («المُنظِّم»), an honest neural merge
 * («الخلية»), and teaching packs «المعمل» can hand to platform agents — plus
 * a render smoke test in Arabic.
 */
import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html dir="rtl" lang="ar"><body></body></html>', {
  url: 'https://example.org/',
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

const university = await import('../src/data/university');
const knowledge = await import('../src/data/universityKnowledge');
const contract = await import('../src/ai/universityContract');
const { SEED_KNOWLEDGE, organizeKnowledgeRecords, mergeKnowledgeRecords, normaliseKnowledgeRecord,
        recordCompleteness, buildLabTeachingPack, filterKnowledgeRecords, knowledgeStats } = knowledge;
const { UNIVERSITY_DEPARTMENTS, UNIVERSITY_AGENTS, UNIVERSITY_COLLECTORS, UNIVERSITY_NEURAL_CELLS,
        UNIVERSITY_CENTRAL_AGENTS, PLATFORM_AGENT_TARGETS } = university;

/* --------------------------------- catalog -------------------------------- */

test('there are exactly twelve specialisations with unique archive codes', () => {
  assert.equal(UNIVERSITY_DEPARTMENTS.length, 12);
  const ids = new Set(UNIVERSITY_DEPARTMENTS.map(d => d.id));
  const codes = new Set(UNIVERSITY_DEPARTMENTS.map(d => d.code));
  assert.equal(ids.size, 12);
  assert.equal(codes.size, 12);
  for (const department of UNIVERSITY_DEPARTMENTS) {
    assert.match(department.code, /^[A-Z]{2,4}$/);
    assert.ok(department.ar.length > 3 && department.en.length > 3);
    assert.ok(department.tracksAr.length >= 3 && department.tracksEn.length >= 3);
  }
});

test('every specialisation has exactly two internet collectors and one neural cell', () => {
  for (const department of UNIVERSITY_DEPARTMENTS) {
    const collectors = UNIVERSITY_COLLECTORS.filter(a => a.departmentId === department.id);
    assert.equal(collectors.length, 2, `${department.id} must have two collectors`);
    const cells = UNIVERSITY_NEURAL_CELLS.filter(a => a.departmentId === department.id);
    assert.equal(cells.length, 1, `${department.id} must have one neural cell`);
  }
  assert.equal(UNIVERSITY_COLLECTORS.length, 24);
  assert.equal(UNIVERSITY_NEURAL_CELLS.length, 12);
  const centrals = UNIVERSITY_CENTRAL_AGENTS.map(a => a.id).sort();
  assert.deepEqual(centrals, ['archivist', 'lab', 'nucleus', 'rector']);
  assert.equal(UNIVERSITY_AGENTS.length, 40);
  const unique = new Set(UNIVERSITY_AGENTS.map(a => a.id));
  assert.equal(unique.size, UNIVERSITY_AGENTS.length, 'agent ids must be unique');
});

test('the platform agent targets «المعمل» can teach are all wired', () => {
  assert.equal(PLATFORM_AGENT_TARGETS.length, 5);
  for (const target of PLATFORM_AGENT_TARGETS) {
    assert.ok(university.isPlatformAgentTarget(target.id));
  }
  assert.equal(university.isPlatformAgentTarget('nonsense'), false);
});

/* ------------------------------ seed archive ------------------------------- */

test('the commissioned seed is documented, reviewed and complete', () => {
  assert.equal(SEED_KNOWLEDGE.length, 24);
  for (const record of SEED_KNOWLEDGE) {
    assert.ok(university.isUniversityDepartmentId(record.departmentId), record.id);
    assert.match(record.code, /^INSCO-IND-[A-Z]{2,4}-\d{3}$/, record.code);
    assert.equal(record.status, 'reviewed', record.id);
    assert.ok(record.sources.length >= 2, record.id);
    for (const source of record.sources) {
      assert.match(source.url, /^https:\/\//, source.url);
      assert.ok(source.title.length > 3 && source.publisher.length > 1);
    }
    assert.ok(record.keyPointsAr.length >= 3 && record.keyPointsEn.length >= 3);
    assert.equal(recordCompleteness(record), 100, `${record.id} must be 100% complete`);
  }
});

test('seed archive codes are unique and sequential per department', () => {
  const seen = new Set<string>();
  for (const record of SEED_KNOWLEDGE) {
    assert.ok(!seen.has(record.code), `duplicate code ${record.code}`);
    seen.add(record.code);
  }
  for (const department of UNIVERSITY_DEPARTMENTS) {
    const codes = SEED_KNOWLEDGE.filter(r => r.departmentId === department.id).map(r => r.code).sort();
    assert.deepEqual(codes, codes.map((_, i) => `INSCO-IND-${department.code}-00${i + 1}`));
  }
});

/* ----------------------- «المُنظِّم» — the archivist ------------------------- */

test('the Organising robot keeps the stable seed codes and finds nothing wrong', () => {
  const fresh = SEED_KNOWLEDGE.map(r => ({ ...r, sources: [...r.sources] }));
  const result = organizeKnowledgeRecords(fresh);
  assert.equal(result.codesAssigned, 0);
  assert.equal(result.codesKept, SEED_KNOWLEDGE.length);
  assert.equal(result.stats.reviewed, SEED_KNOWLEDGE.length);
  assert.equal(result.stats.pendingReview, 0);
  assert.ok(result.actions.some(a => a.kind === 'clean'));
});

test('the Organising robot refuses to keep undocumented knowledge approved', () => {
  const poisoned = [
    {
      ...SEED_KNOWLEDGE[0],
      id: 'kb-test-poison',
      code: 'INSCO-IND-SCI-900',
      sources: [],
    },
  ];
  const result = organizeKnowledgeRecords(poisoned);
  const fixed = result.records.find(r => r.id === 'kb-test-poison')!;
  assert.equal(fixed.status, 'pending-review');
  assert.ok(result.actions.some(a => a.kind === 'status-held'));
});

test('the Organising robot drops non-HTTPS citations and flags duplicates', () => {
  const clone = { ...SEED_KNOWLEDGE[0], sources: [...SEED_KNOWLEDGE[0].sources] };
  const dirty = { ...clone, id: 'kb-test-dirty', code: 'INSCO-IND-SCI-901',
    sources: [...clone.sources, { title: 'blog post', publisher: 'random blog', url: 'http://insecure.example.com/post' }] };
  const dupe = { ...clone, id: 'kb-test-dupe', code: 'INSCO-IND-SCI-902' };
  const result = organizeKnowledgeRecords([clone, dirty, dupe]);
  const dirtyFixed = result.records.find(r => r.id === 'kb-test-dirty')!;
  assert.equal(dirtyFixed.sources.length, clone.sources.length, 'non-HTTPS source must be dropped');
  assert.ok(result.actions.some(a => a.kind === 'citations-invalid'));
  const dupeFixed = result.records.find(r => r.id === 'kb-test-dupe')!;
  assert.equal(dupeFixed.status, 'pending-review');
  assert.ok(result.actions.some(a => a.kind === 'duplicate-flagged'));
});

/* ------------------------- «الخلية» — the neural cell ------------------------ */

test('a neural cell merges duplicates: union, version bump, held for review', () => {
  const a = { ...SEED_KNOWLEDGE[0], evolvedBy: [] };
  const b = { ...SEED_KNOWLEDGE[0], id: 'kb-test-twin', code: 'INSCO-IND-SCI-903', version: 1,
    keyPointsAr: ['نقطة إضافية نادرة'], keyPointsEn: ['An extra rare point'], evolvedBy: [] };
  const result = mergeKnowledgeRecords([a, b], 'cell-science', '2026-11-24T00:00:00.000Z');
  assert.equal(result.mergedCount, 1);
  const merged = result.records.find(r => r.departmentId === 'science')!;
  assert.equal(merged.status, 'pending-review');
  assert.equal(merged.version, 2);
  assert.ok(merged.evolvedBy.includes('cell-science'));
  assert.ok(merged.keyPointsAr.includes('نقطة إضافية نادرة'));
  // untouched records pass through
  const untouched = mergeKnowledgeRecords([SEED_KNOWLEDGE[1]], 'cell-science', '2026-11-24T00:00:00.000Z');
  assert.equal(untouched.mergedCount, 0);
  assert.equal(untouched.records[0].status, 'reviewed');
});

test('collector normalisation never births an approved record', () => {
  const raw = {
    titleAr: 'عنوان تقني',
    titleEn: 'A technical title',
    summaryAr: 'ملخص تقني موثق بما يكفي للقبول المبدئي في الأرشيف.',
    summaryEn: 'A documented technical summary, long enough to be archived.',
    keyPointsAr: ['نقطة أولى', 'نقطة ثانية', 'نقطة ثالثة'],
    keyPointsEn: ['point one', 'point two'],
    sources: [
      { title: 'ASME B31.3', publisher: 'ASME', url: 'https://www.asme.org/codes-standards' },
      { title: 'bad', publisher: 'bad', url: 'nota-url' },
    ],
  };
  const record = normaliseKnowledgeRecord(raw, { departmentId: 'construction', collectedBy: 'collector-construction-research' })!;
  assert.ok(record);
  assert.equal(record.status, 'pending-review');
  assert.equal(record.sources.length, 1);
  assert.equal(normaliseKnowledgeRecord({ ...raw, sources: [] }, { departmentId: 'construction', collectedBy: 'x' }), null);
  assert.equal(normaliseKnowledgeRecord({ ...raw, keyPointsAr: ['only one'] }, { departmentId: 'construction', collectedBy: 'x' }), null);
});

/* ---------------------- «المعمل» — The Lab teaching packs ------------------- */

test('The Lab builds a documented teaching pack for a platform agent', () => {
  const pack = buildLabTeachingPack('engineering', 'tutor', SEED_KNOWLEDGE, '2026-11-24T00:00:00.000Z')!;
  assert.ok(pack);
  assert.equal(pack.departmentId, 'engineering');
  assert.equal(pack.targetId, 'tutor');
  assert.equal(pack.packId, 'LAB-ENG-TUTOR-2026-11-24');
  assert.ok(pack.digest.length >= 2);
  assert.ok(pack.qaPairs.length >= 2 && pack.qaPairs.length <= 6);
  assert.ok(pack.guardrails.length >= 4);
  assert.ok(pack.preamble.ar.includes('INSCO') && pack.preamble.en.includes('INSCO'));
  for (const source of pack.sources) assert.match(source.url, /^https:\/\//);
  assert.match(pack.honestNote.ar, /مراجعة/);
  assert.equal(buildLabTeachingPack('nope' as never, 'tutor', SEED_KNOWLEDGE), null);
});

test('archive search filters by department, status and free text', () => {
  const eng = filterKnowledgeRecords(SEED_KNOWLEDGE, { departmentId: 'engineering' });
  assert.equal(eng.length, 2);
  const byCode = filterKnowledgeRecords(SEED_KNOWLEDGE, { query: 'INSCO-IND-ENG-001' });
  assert.equal(byCode.length, 1);
  const reviewed = filterKnowledgeRecords(SEED_KNOWLEDGE, { status: 'reviewed' });
  assert.equal(reviewed.length, SEED_KNOWLEDGE.length);
  const none = filterKnowledgeRecords(SEED_KNOWLEDGE, { query: 'zzz-no-such-thing-zzz' });
  assert.equal(none.length, 0);
  const stats = knowledgeStats(SEED_KNOWLEDGE);
  assert.equal(stats.byDepartment.length, 12);
  assert.equal(stats.avgCompleteness, 100);
});

/* ------------------------------ the contract ------------------------------- */

test('the university request normalisers validate strictly', () => {
  assert.equal(contract.normaliseCollectRequest({ departmentId: 'engineering' })?.departmentId, 'engineering');
  assert.equal(contract.normaliseCollectRequest({ departmentId: 'aerospace' }), null);
  assert.equal(contract.normaliseCollectRequest(null), null);
  assert.equal(contract.normaliseCollectRequest({ departmentId: 'science', collectorId: 'collector-science-codes' })?.collectorId, 'collector-science-codes');
  assert.equal(contract.normaliseSynthesizeRequest({ departmentId: 'nde', language: 'en' })?.language, 'en');
  assert.equal(contract.normaliseSynthesizeRequest({ departmentId: 'nde', language: 'fr' })?.language, 'ar');
  assert.equal(contract.normaliseTeachRequest({ departmentId: 'marketing', targetId: 'user-copilot' })?.targetId, 'user-copilot');
  assert.equal(contract.normaliseTeachRequest({ departmentId: 'marketing', targetId: 'jarvis' }), null);
  assert.equal(contract.normaliseOrganizeRequest({})?.language, 'ar');
  assert.match(contract.UNIVERSITY_ENDPOINTS.collect, /^\/api\/university\//);
});

/* ------------------------------- render smoke ------------------------------ */

test('the university halls render in Arabic and switch tabs', async () => {
  const { render, fireEvent, cleanup, within } = await import('@testing-library/react');
  const { InscoUniversity } = await import('../src/components/academy/InscoUniversity');
  const ui = render(<InscoUniversity language="ar" />);
  assert.ok(ui.getByText('جامعة إنسكو الروبوتية للإنشاءات الصناعية'));
  // seven TABS render
  const tablist = ui.getByRole('tablist', { name: 'أجنحة الجامعة' });
  assert.equal(within(tablist).getAllByRole('tab').length, 6);
  // jump to the archive hall
  fireEvent.click(within(tablist).getByRole('tab', { name: /الأرشيف العلمي/ }));
  assert.ok(ui.getByText(/«المُنظِّم» — روبوت التنظيم والهيكلة والأرشفة/));
  // and to The Lab
  fireEvent.click(within(tablist).getByRole('tab', { name: /المعمل/ }));
  assert.ok(ui.getByText(/وحدة تعليم وكلاء الذكاء الاصطناعي/));
  cleanup();
});
