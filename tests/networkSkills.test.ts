/**
 * Skills, endorsements and recommendations — the pure rules.
 *
 * These are the promises the interface must not overstate: a skill is a claim, an
 * endorsement is one colleague's word and can only come from someone else, and a
 * recommendation is written text of a minimum length that its author (or its subject,
 * to take it down) controls. Nothing here produces a number that was not counted from
 * documents, and nothing can be produced by the member about themselves.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  EMPTY_RECOMMENDATION,
  NETWORK_SKILLS,
  NETWORK_SKILL_GROUPS,
  NETWORK_SKILL_LIMITS,
  canEndorse,
  canManageRecommendation,
  countEndorsements,
  endorsementId,
  endorsersOf,
  parseSkills,
  recommendationId,
  relationLabel,
  serialiseSkills,
  skillById,
  skillLabel,
  toggleSkill,
  validateRecommendation,
} from '../src/network/networkSkills';

const ids = NETWORK_SKILLS.map(skill => skill.id);

test('the catalogue is closed, unique and inside the rule limits', () => {
  assert.ok(NETWORK_SKILLS.length >= 20, 'a usable vocabulary needs real breadth');
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids');
  for (const skill of NETWORK_SKILLS) {
    assert.match(skill.id, /^[a-z0-9_]{1,40}$/, `${skill.id} must satisfy the rules regex`);
    assert.ok(skill.ar.trim().length > 0 && skill.en.trim().length > 0, `${skill.id} needs both labels`);
    assert.ok(
      NETWORK_SKILL_GROUPS.some(group => group.id === skill.group),
      `${skill.id} belongs to a real group`
    );
  }
  // The stored string is capped at 20 ids, which the rules regex also caps.
  assert.equal(NETWORK_SKILL_LIMITS.maxSkills, 20);
});

test('parseSkills keeps only catalogue ids, in order and without duplicates', () => {
  assert.deepEqual(parseSkills('ut,paut,ut'), ['ut', 'paut']);
  assert.deepEqual(parseSkills(' ut , ,mt '), ['ut', 'mt']);
  assert.deepEqual(parseSkills('not_a_skill,ut'), ['ut'], 'an unknown id is dropped, never rendered');
  assert.deepEqual(parseSkills(undefined), []);
  assert.deepEqual(parseSkills(''), []);
  assert.deepEqual(parseSkills(',,,'), []);
});

test('parseSkills stops at the ceiling instead of growing the string', () => {
  const tooMany = ids.slice(0, NETWORK_SKILL_LIMITS.maxSkills + 2).join(',');
  const parsed = parseSkills(tooMany);
  assert.equal(parsed.length, NETWORK_SKILL_LIMITS.maxSkills);
  assert.deepEqual(parsed, ids.slice(0, NETWORK_SKILL_LIMITS.maxSkills));
});

test('serialiseSkills round-trips a clean list and refuses junk', () => {
  assert.equal(serialiseSkills(['ut', 'paut']), 'ut,paut');
  assert.equal(serialiseSkills([]), '');
  assert.equal(serialiseSkills(['UT', 'paut']), 'paut', 'ids are lower_snake; “UT” is not an id');
  assert.equal(serialiseSkills(['ut', 'ut']), 'ut');
});

test('toggleSkill adds, removes, and reports the ceiling without lying', () => {
  assert.deepEqual(toggleSkill('', 'ut'), { value: 'ut', rejected: null });
  assert.deepEqual(toggleSkill('ut', 'ut'), { value: '', rejected: null });
  assert.deepEqual(toggleSkill('ut', 'not_a_skill'), { value: 'ut', rejected: null });

  const full = ids.slice(0, NETWORK_SKILL_LIMITS.maxSkills).join(',');
  const extra = ids[NETWORK_SKILL_LIMITS.maxSkills];
  assert.equal(toggleSkill(full, extra).value, full, 'the 21st skill is not silently swapped in');
  assert.equal(toggleSkill(full, extra).rejected, 'limit');
  // Removing still works at the ceiling.
  assert.equal(toggleSkill(full, ids[0]).rejected, null);
  assert.equal(parseSkills(toggleSkill(full, ids[0]).value).length, NETWORK_SKILL_LIMITS.maxSkills - 1);
});

test('labels fall back to the id rather than inventing a name', () => {
  const ut = skillById('ut');
  assert.ok(ut);
  assert.equal(skillLabel(ut!, true), ut!.ar);
  assert.equal(skillLabel(ut!, false), ut!.en);
  assert.equal(skillById('gone_skill'), undefined);
  assert.equal(relationLabel('colleague', true), 'زميل عمل');
  assert.equal(relationLabel('colleague', false), 'Colleague');
  assert.ok(relationLabel('invented', true).length > 0, 'an unknown relation still reads as text');
});

test('counts are computed from the documents, per skill', () => {
  const rows = [
    { skillId: 'ut', fromUid: 'a', fromName: 'أ' },
    { skillId: 'ut', fromUid: 'b', fromName: 'ب' },
    { skillId: 'paut', fromUid: 'a', fromName: 'أ' },
  ];
  assert.deepEqual(countEndorsements(rows), { ut: 2, paut: 1 });
  assert.deepEqual(countEndorsements([]), {});
  assert.deepEqual(endorsersOf(rows, 'ut'), ['أ', 'ب']);
  assert.deepEqual(endorsersOf(rows, 'tofd'), []);
});

test('an endorsement is one document per (target × skill × endorser)', () => {
  assert.equal(endorsementId('target', 'ut', 'from'), 'target_ut_from');
  // Same pair twice → same id → the second write is the same document.
  assert.equal(endorsementId('target', 'ut', 'from'), endorsementId('target', 'ut', 'from'));
  assert.notEqual(endorsementId('target', 'ut', 'from'), endorsementId('target', 'paut', 'from'));
  assert.equal(recommendationId('from', 'to'), 'from_to');
});

test('canEndorse refuses every case the rules would refuse, with a reason', () => {
  const base = {
    viewerUid: 'me',
    viewerVerified: true,
    toUid: 'other',
    skillId: 'ut',
    targetSkills: ['ut'],
    existing: [] as { skillId: string; fromUid: string }[],
  };

  assert.equal(canEndorse(base).allowed, true);
  assert.equal(canEndorse(base).reasonAr, null);

  const cases: [Record<string, unknown>, string][] = [
    [{ viewerUid: null }, ''],
    [{ viewerVerified: false }, ''],
    [{ toUid: 'me' }, ''],
    [{ skillId: 'paut' }, ''],
    [{ existing: [{ skillId: 'ut', fromUid: 'me' }] }, ''],
  ];
  for (const [override, _] of cases) {
    const gate = canEndorse({ ...base, ...override });
    assert.equal(gate.allowed, false, JSON.stringify(override));
    assert.ok(gate.reasonAr && gate.reasonEn, 'a blocked click must say why, in both languages');
  }

  // Someone else's endorsement of the same skill does not block mine.
  assert.equal(canEndorse({ ...base, existing: [{ skillId: 'ut', fromUid: 'someone-else' }] }).allowed, true);
});

test('self-endorsement is impossible even with a verified session', () => {
  const gate = canEndorse({
    viewerUid: 'same',
    viewerVerified: true,
    toUid: 'same',
    skillId: 'ut',
    targetSkills: ['ut'],
    existing: [],
  });
  assert.equal(gate.allowed, false);
});

test('validateRecommendation enforces the same bounds as firestore.rules', () => {
  const short = validateRecommendation({ relation: 'colleague', body: 'جيد' });
  assert.equal(short.length, 1);
  assert.equal(short[0].field, 'body');

  const spaced = validateRecommendation({ relation: 'colleague', body: ' '.repeat(80) });
  assert.equal(spaced.length, 1, 'whitespace is not a recommendation');

  const atMin = validateRecommendation({
    relation: 'client',
    body: 'ع'.repeat(NETWORK_SKILL_LIMITS.recommendationMin),
  });
  assert.deepEqual(atMin, []);

  const tooLong = validateRecommendation({
    relation: 'instructor',
    body: 'ع'.repeat(NETWORK_SKILL_LIMITS.recommendationMax + 1),
  });
  assert.equal(tooLong.length, 1);

  const badRelation = validateRecommendation({
    relation: 'friend' as never,
    body: 'ع'.repeat(60),
  });
  assert.equal(badRelation[0].field, 'relation');

  assert.ok(validateRecommendation(EMPTY_RECOMMENDATION).length > 0, 'the empty draft is not submittable');
});

test('a recommendation can be managed by its author or its subject, never a third party', () => {
  const row = { id: 'from_to', fromUid: 'from', toUid: 'to' };
  assert.equal(canManageRecommendation(row, 'from'), true);
  assert.equal(canManageRecommendation(row, 'to'), true);
  assert.equal(canManageRecommendation(row, 'stranger'), false);
  assert.equal(canManageRecommendation(row, null), false);
});
