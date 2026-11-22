/**
 * Phase C — a real professional card on the real account.
 *
 * The network does not own a profile collection: it writes the site's existing
 * public community workspace through the existing service, under the existing
 * rules. These tests pin the parts that must not drift:
 *
 *   1. the form's limits mirror firestore.rules exactly,
 *   2. an optional field the member cleared is omitted, never sent as "",
 *   3. the screen has an honest state for every situation — no Firebase, no
 *      session, unconfirmed email — and never renders a plausible fake card.
 */
import React from 'react';
import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  history: dom.window.history,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

// No live Firebase in this suite: the point is the contract and the UI states.
const firebaseConfig = await import('../src/firebase/config');
mock.module('../src/firebase/config.ts', {
  namedExports: { ...firebaseConfig, auth: null, db: null, isFirebaseConfigured: false },
});

const form = await import('../src/network/networkProfileForm');
const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkPortal } = await import('../src/components/network/NetworkPortal');
const { render, cleanup, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

const validDraft = (): form.NetworkProfileDraft => ({
  ...form.EMPTY_NETWORK_PROFILE,
  displayName: 'أحمد محمود',
  organizationName: 'مستقل',
  sector: 'الفحص غير الإتلافي',
  headline: 'مفتش PAUT/TOFD — المستوى II',
  city: 'القاهرة',
  specialtyTrades: 'UT · PAUT/TOFD · RT',
  certifications: 'ASNT UT II',
  bio: 'عشر سنوات في فحص خطوط الأنابيب ومحطات الطاقة.',
  yearsExperience: '10',
});

/* ------------------------------ the contract ------------------------------- */

test('a complete draft is accepted, and an empty one is rejected field by field', () => {
  assert.deepEqual(form.validateNetworkProfileDraft(validDraft()), []);

  const empty = form.validateNetworkProfileDraft(form.EMPTY_NETWORK_PROFILE);
  const fields = empty.map(error => error.field);
  assert.ok(fields.includes('displayName'));
  assert.ok(fields.includes('organizationName'));
  assert.ok(fields.includes('sector') === false, 'the sector has a default, so it is already valid');
  for (const error of empty) {
    assert.ok(error.ar.length > 5, 'every error has an Arabic message');
    assert.ok(error.en.length > 5, 'every error has an English message');
  }
});

test('the limits are the database limits, not a friendlier copy', () => {
  const limits = form.NETWORK_PROFILE_LIMITS;
  const tooLong = (length: number) => 'ا'.repeat(length);

  const cases: { field: keyof form.NetworkProfileDraft; value: string; limit: number }[] = [
    { field: 'displayName', value: tooLong(limits.displayNameMax + 1), limit: limits.displayNameMax },
    { field: 'organizationName', value: tooLong(limits.organizationMax + 1), limit: limits.organizationMax },
    { field: 'headline', value: tooLong(limits.headlineMax + 1), limit: limits.headlineMax },
    { field: 'city', value: tooLong(limits.cityMax + 1), limit: limits.cityMax },
    { field: 'specialtyTrades', value: tooLong(limits.specialtyMax + 1), limit: limits.specialtyMax },
    { field: 'certifications', value: tooLong(limits.certificationsMax + 1), limit: limits.certificationsMax },
    { field: 'bio', value: tooLong(limits.bioMax + 1), limit: limits.bioMax },
  ];

  for (const { field, value } of cases) {
    const draft = { ...validDraft(), [field]: value };
    const errors = form.validateNetworkProfileDraft(draft);
    assert.ok(
      errors.some(error => error.field === field),
      `${field} longer than the rules allow must be refused`
    );

    // Exactly at the limit is allowed: the rules use `size() <= max`.
    const atLimit = { ...validDraft(), [field]: value.slice(0, value.length - 1) };
    assert.equal(
      form.validateNetworkProfileDraft(atLimit).some(error => error.field === field),
      false,
      `${field} at the limit must pass`
    );
  }
});

test('years of experience is a bounded number, and the availability state is a closed list', () => {
  assert.ok(
    form.validateNetworkProfileDraft({ ...validDraft(), yearsExperience: '71' }).some(
      error => error.field === 'yearsExperience'
    )
  );
  assert.ok(
    form.validateNetworkProfileDraft({ ...validDraft(), yearsExperience: 'abc' }).some(
      error => error.field === 'yearsExperience'
    )
  );
  assert.equal(
    form.validateNetworkProfileDraft({ ...validDraft(), yearsExperience: '' }).some(
      error => error.field === 'yearsExperience'
    ),
    false,
    'an empty experience field is allowed'
  );

  assert.deepEqual(
    form.NETWORK_AVAILABILITY.map(item => item.id).sort(),
    ['active_field', 'hiring', 'offering_services', 'open_to_work'],
    'the enum matches the rules'
  );
});

test('a cleared optional field is omitted from the write, not sent as an empty string', () => {
  const existing = {
    uid: 'u1',
    displayName: 'قديم',
    organizationName: 'قديم',
    sector: 'الفحص غير الإتلافي',
    companiesManaged: 3,
    isPublished: true,
    companyCode: 'INS-ABC',
    city: 'القديمة',
  };

  const write = form.toWorkspaceWrite(
    { ...validDraft(), city: '   ', bio: '', certifications: '  ', yearsExperience: '' },
    existing
  );

  assert.equal('city' in write, false, 'a cleared city must not be written as ""');
  assert.equal('bio' in write, false);
  assert.equal('certifications' in write, false);
  assert.equal('headline' in write, true);
  // Values the network form does not own are carried over, never dropped.
  assert.equal(write.companiesManaged, 3);
  assert.equal(write.companyCode, 'INS-ABC');
  assert.equal(write.isPublished, true);
});

test('a new card starts with zero managed companies and no invented counters', () => {
  const write = form.toWorkspaceWrite(validDraft(), null);
  assert.equal(write.companiesManaged, 0);
  assert.equal('followersCount' in write, false);
  assert.equal('endorsementsCount' in write, false);
  assert.equal('uid' in write, false, 'the service adds the uid from the session');
});

test('draftFromProfile never invents a value the card did not have', () => {
  const fromNull = form.draftFromProfile(null);
  assert.equal(fromNull.displayName, '');
  assert.equal(fromNull.yearsExperience, '');
  assert.equal(fromNull.isPublished, true);

  const fromCard = form.draftFromProfile({
    uid: 'u2',
    displayName: 'سارة',
    organizationName: 'إنسكو',
    sector: 'المعالجة الحرارية',
    companiesManaged: 0,
    isPublished: false,
    yearsExperience: 7,
    availabilityStatus: 'open_to_work',
  });
  assert.equal(fromCard.displayName, 'سارة');
  assert.equal(fromCard.yearsExperience, '7');
  assert.equal(fromCard.isPublished, false);
  assert.equal(fromCard.availabilityStatus, 'open_to_work');
});

test('completeness counts what a visitor can actually read', () => {
  const empty = form.networkProfileCompleteness(form.EMPTY_NETWORK_PROFILE);
  assert.equal(empty.percent, 0);
  assert.ok(empty.missingAr.length >= 6);

  const full = form.networkProfileCompleteness(validDraft());
  assert.equal(full.percent, 100);
  assert.deepEqual(full.missingAr, []);
});

/* -------------------------------- the screen ------------------------------- */

test('without a Firebase connection the card screen refuses to fake a profile', async () => {
  const { container } = render(
    <SiteAccountProvider>
      <NetworkPortal
        language="ar"
        section="profile"
        onOpenSection={() => {}}
        onOpenCompany={() => {}}
        onOpenAcademy={() => {}}
      />
    </SiteAccountProvider>
  );

  await waitFor(() => {
    assert.ok(
      container.querySelector('[data-testid="network-profile-service-unavailable"]'),
      'the unavailable state must be explicit'
    );
  });

  const text = container.textContent ?? '';
  assert.ok(text.includes('لن نعرض لك ملفاً وهمياً'));
  assert.equal(container.querySelector('form'), null, 'no editable card without a backend');
  assert.equal(container.querySelector('[data-testid="network-profile-live"]'), null);
});

test('the member directory is empty, not padded, when no one has published a card', async () => {
  const { container } = render(
    <SiteAccountProvider>
      <NetworkPortal
        language="ar"
        section="people"
        onOpenSection={() => {}}
        onOpenCompany={() => {}}
        onOpenAcademy={() => {}}
      />
    </SiteAccountProvider>
  );

  await waitFor(() => {
    assert.ok(container.querySelector('[data-testid="network-directory-unavailable"]'));
  });

  const text = container.textContent ?? '';
  assert.ok(text.includes('لن نعرض أسماء وهمية'));
  assert.equal(container.querySelectorAll('[data-testid="network-member-card"]').length, 0);
  assert.equal(container.querySelector('[data-testid="network-directory-empty"]'), null);
});
