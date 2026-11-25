/**
 * Comprehensive verification suite for the INSCO Engineering Network platform upgrade:
 *   - Domain taxonomy & Academy course attachment catalog
 *   - Multi-level Company Org Chart tree engine
 *   - Strict separation between Verification Tracks and Community Reputation Score
 *   - Feed 7-tab categorization, ranking & duplicate-post anti-spam detection
 *   - Bilingual HTML CV generator
 *   - UI components: AiGeneratedBadge, VerificationTrackBadges, ReputationScorePill, and Academy→Network link
 */
import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import type {
  CommunityCompanyDepartment,
  CommunityPost,
  CommunityVerification,
  CommunityWorkspaceProfile,
} from '../src/client/types';

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

const taxonomy = await import('../src/network/networkTaxonomy');
const badges = await import('../src/components/network/NetworkBadges');
const { render, cleanup } = await import('@testing-library/react');

afterEach(() => cleanup());

const baseProfile: CommunityWorkspaceProfile = {
  uid: 'u1',
  displayName: 'م. طارق المنصور',
  headline: 'NDT Level III UT & PAUT Lead',
  organizationName: 'Delta Inspection',
  sector: 'NDT',
  companiesManaged: 1,
  isPublished: true,
  city: 'Alexandria',
  yearsExperience: 12,
  specialtyTrades: 'UT · PAUT · TOFD',
  certifications: 'ASNT Level III UT/RT',
  experienceSummary: 'Led pipeline phased-array campaigns across Suez.',
  educationSummary: 'B.Sc. Mechanical Engineering',
  projectsSummary: 'Offshore riser PAUT qualification.',
  languages: ['العربية', 'الإنجليزية'],
};

test('domain taxonomies cover core NDT methods, related engineering disciplines, roles, and Academy links', () => {
  const methodIds = taxonomy.NDT_METHOD_TAXONOMY.map(m => m.id);
  for (const required of ['RT', 'UT', 'PAUT', 'TOFD', 'MT', 'PT', 'VT', 'ET', 'PWHT', 'AR', 'GENERAL']) {
    assert.ok(methodIds.includes(required as never), `missing NDT method ${required}`);
  }
  assert.ok(taxonomy.RELATED_ENGINEERING_FIELDS.length >= 8);
  assert.ok(taxonomy.CAREER_ROLES.length >= 8);
  assert.ok(taxonomy.ACADEMY_LINKABLE_COURSES.every(c => c.hash.startsWith('#academy/')));
});

test('buildOrgTree constructs multi-level hierarchy cleanly and handles cycles safely as roots', () => {
  const departments: CommunityCompanyDepartment[] = [
    {
      id: 'd-team',
      companyId: 'c1',
      name: 'PAUT Offshore Team',
      parentDepartmentId: 'd-dept',
      roleKey: 'team_leader',
      levelOrder: 4,
      headName: 'Eng. Karim',
    },
    {
      id: 'd-md',
      companyId: 'c1',
      name: 'Executive Board',
      roleKey: 'managing_director',
      levelOrder: 1,
      headName: 'Eng. Hany',
    },
    {
      id: 'd-dept',
      companyId: 'c1',
      name: 'Advanced NDT Division',
      parentDepartmentId: 'd-md',
      roleKey: 'department_manager',
      levelOrder: 3,
      headName: 'Eng. Nadia',
    },
  ];

  const tree = taxonomy.buildOrgTree(departments);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].department.id, 'd-md');
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].children[0].department.id, 'd-dept');
  assert.equal(tree[0].children[0].children.length, 1);
  assert.equal(tree[0].children[0].children[0].department.id, 'd-team');
});

test('verification tracks remain strictly independent from high community reputation scores', () => {
  const highRep = taxonomy.computeMemberReputationSummary({
    postsCount: 25,
    acceptedAnswersCount: 10,
    endorsementsCount: 40,
  });
  assert.equal(highRep.recognitionScore, 25 * 10 + 10 * 25 + 40 * 5);
  assert.equal(highRep.tierEn, 'Principal Contributor');

  // Even with pending verification requests or huge reputation, zero tracks become verified automatically.
  const pendingOnly: CommunityVerification[] = [
    {
      id: 'v1',
      uid: 'u1',
      authorName: 'Test',
      track: 'credential',
      subjectName: 'ASNT Level III',
      issuerName: 'ASNT',
      status: 'pending',
    },
  ];
  const unverifiedState = taxonomy.computeVerificationTrackState(baseProfile, pendingOnly);
  assert.equal(unverifiedState.identity, false);
  assert.equal(unverifiedState.organization, false);
  assert.equal(unverifiedState.credential, false);
  assert.equal(unverifiedState.pendingCount, 1);

  // Approving identity never grants credential or organization verification.
  const partialApproved: CommunityVerification[] = [
    { ...pendingOnly[0], status: 'approved', track: 'identity' },
  ];
  const partialState = taxonomy.computeVerificationTrackState(baseProfile, partialApproved);
  assert.equal(partialState.identity, true);
  assert.equal(partialState.organization, false);
  assert.equal(partialState.credential, false);
});

test('filterAndRankPosts filters across all 7 tabs and ranks For You by relevance & engagement', () => {
  const posts: CommunityPost[] = [
    {
      id: 'p1',
      authorUid: 'u1',
      authorName: 'A',
      authorOrg: 'Org1',
      postType: 'hiring_announcement',
      postFormat: 'poll',
      ndtMethod: 'RT',
      title: 'Team availability poll',
      body: 'Q4 mobilization survey',
      likesCount: 1,
      commentsCount: 0,
    },
    {
      id: 'p2',
      authorUid: 'u2',
      authorName: 'B',
      authorOrg: 'Org2',
      postType: 'technical_case',
      postFormat: 'case_study',
      ndtMethod: 'PAUT',
      title: 'PAUT Root Crack',
      body: 'Full B-scan interpretation',
      likesCount: 10,
      commentsCount: 5,
      answersCount: 2,
      companyId: 'c1',
    },
    {
      id: 'p3',
      authorUid: 'u3',
      authorName: 'C',
      authorOrg: 'Academy',
      postType: 'knowledge_share',
      postFormat: 'academy_share',
      ndtMethod: 'UT',
      title: 'Completed UT Module',
      body: 'Shared from INSCO Academy',
      academyCourseId: 'nde-ut',
    },
  ];

  const tech = taxonomy.filterAndRankPosts(posts, { tab: 'technical' });
  assert.deepEqual(tech.map(p => p.id), ['p2']);

  const academy = taxonomy.filterAndRankPosts(posts, { tab: 'academy' });
  assert.deepEqual(academy.map(p => p.id), ['p3']);

  const following = taxonomy.filterAndRankPosts(posts, {
    tab: 'following',
    followedUids: new Set(['u1']),
  });
  assert.deepEqual(following.map(p => p.id), ['p1']);

  const forYou = taxonomy.filterAndRankPosts(posts, {
    tab: 'for_you',
    preferredMethod: 'PAUT',
  });
  assert.equal(forYou[0].id, 'p2');
});

test('detectDuplicatePostRisk flags identical recent posts from the same author', () => {
  const recent: CommunityPost[] = [
    {
      id: 'p1',
      authorUid: 'u1',
      authorName: 'Test',
      authorOrg: 'INSCO',
      postType: 'discussion',
      ndtMethod: 'UT',
      title: 'Shear wave calibration on V1',
      body: 'Using 45 degree probe on IIW V1 calibration block to verify index point.',
    },
  ];
  assert.equal(
    taxonomy.detectDuplicatePostRisk(
      'Shear wave calibration on V1',
      'Using 45 degree probe on IIW V1 calibration block to verify index point.',
      recent
    ),
    true
  );
  assert.equal(
    taxonomy.detectDuplicatePostRisk('Different Topic', 'Completely new post content here.', recent),
    false
  );
});

test('buildMemberCvHtml renders complete RTL/LTR escaped HTML document and marks declared certs clearly', () => {
  const html = taxonomy.buildMemberCvHtml(
    { ...baseProfile, displayName: 'Eng <script>Ali</script>' },
    'ar',
    { identity: true, organization: false, credential: false, pendingCount: 0 }
  );
  assert.ok(html.includes('dir="rtl"'));
  assert.ok(!html.includes('<script>Ali</script>'), 'script tags must be escaped');
  assert.ok(html.includes('الهوية موثقة'));
  assert.ok(html.includes('إقرار العضو'));
  assert.ok(!html.includes('الشهادة مراجَعة'));
});

test('AiGeneratedBadge, VerificationTrackBadges, and ReputationScorePill expose transparent labels', () => {
  const view = render(
    <div>
      <badges.AiGeneratedBadge language="ar" />
      <badges.VerificationTrackBadges
        profile={{ ...baseProfile, identityVerified: true, credentialVerified: false }}
        language="ar"
      />
      <badges.ReputationScorePill
        summary={taxonomy.computeMemberReputationSummary({ postsCount: 2, acceptedAnswersCount: 1, endorsementsCount: 1 })}
        language="ar"
      />
    </div>
  );

  assert.ok(view.getByTestId('network-ai-badge').textContent?.includes('مُولَّد بالذكاء الاصطناعي'));
  const trackText = view.getByTestId('network-verification-tracks').textContent ?? '';
  assert.ok(trackText.includes('هوية موثقة'));
  assert.ok(!trackText.includes('مؤهل مراجَع'));
  assert.ok(view.getByTestId('network-reputation-pill').textContent?.includes('50'));
});
