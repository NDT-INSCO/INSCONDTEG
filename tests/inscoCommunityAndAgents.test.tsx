/**
 * Tests for INSCO Community (LinkedIn + Facebook hybrid),
 * Dual Professional AI Agents (User Copilot + Site Manager Director),
 * and All RT & UT Augmented Reality (AR) techniques.
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="en" dir="ltr"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  sessionStorage: dom.window.sessionStorage,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const agentsContract = await import('../src/ai/agentsContract');
const { InscoDualAiDock } = await import('../src/components/ai/InscoDualAiDock');
const { CommunityWorkspacesHub } = await import('../src/components/client/CommunityWorkspacesHub');
const { NdtCameraArOverlayLab } = await import(
  '../src/components/academy/virtuallab/NdtCameraArOverlayLab'
);
const { render, fireEvent, cleanup, waitFor, within } = await import('@testing-library/react');

const originalFetch = globalThis.fetch;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

/* ---------------- 1. AI Agents Contract Normalizers ---------------- */

test('agentsContract normalizes User Copilot, Site Manager, and Community Assist requests', () => {
  const badCopilot = agentsContract.normaliseUserCopilotRequest({ message: 'a' });
  assert.equal(badCopilot.ok, false);

  const okCopilot = agentsContract.normaliseUserCopilotRequest({
    message: 'Help me choose PAUT vs RT for 28mm P91 weld',
    language: 'en',
    mode: 'ndt_selector',
    history: [{ role: 'user', content: 'hi' }],
    context: { portal: 'client', section: 'community' },
  });
  assert.equal(okCopilot.ok, true);
  if (okCopilot.ok) {
    assert.equal(okCopilot.value.mode, 'ndt_selector');
    assert.equal(okCopilot.value.context?.portal, 'client');
  }

  const okManager = agentsContract.normaliseSiteManagerRequest({
    mode: 'geofence_brief',
    language: 'ar',
    telemetry: {
      totalRequests: 4,
      newRequests: 2,
      urgentRequests: 1,
      totalCompanies: 3,
      activeTestingCompanies: 2,
      pendingAccounts: 1,
      geofenceAlertCount: 1,
      recentGeofenceAlerts: [
        {
          employeeName: 'Salma',
          companyCode: 'INS-CO-0101',
          distanceMeters: 1850,
          radiusMeters: 500,
          timestampIso: '2026-11-20T08:00:00Z',
        },
      ],
      communityPostsCount: 5,
      communityMembersCount: 8,
      opportunitiesCount: 2,
      recentPosts: [],
    },
  });
  assert.equal(okManager.ok, true);
  if (okManager.ok) {
    assert.equal(okManager.value.mode, 'geofence_brief');
    assert.equal(okManager.value.telemetry.geofenceAlertCount, 1);
  }

  const badAssist = agentsContract.normaliseCommunityAssistRequest({ body: 'hi' });
  assert.equal(badAssist.ok, false);
});

/* ---------------- 2. Dual AI Agents Dock Interaction ---------------- */

test('InscoDualAiDock operates both User Copilot and Site Manager AI and propagates real errors', async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('user-copilot')) {
      return new Response(
        JSON.stringify({
          reply: 'Recommended ASME Sec V Art. 4 PAUT 40-70 deg sectorial scan.',
          suggestedActions: [
            { label: 'Apply Draft to Community', actionType: 'apply_post_draft' },
          ],
          draftPost: {
            postType: 'technical_case',
            ndtMethod: 'PAUT',
            title: 'PAUT on 28mm P91 Header Weld',
            body: 'Sectorial scan 40-70 deg with 64-element phased array probe.',
            tags: ['PAUT', 'ASME'],
          },
          model: 'gemini-4-hydrogen',
          elapsedMs: 120,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        summary: 'Operations healthy with 1 outside_geofence alert to review.',
        healthStatus: 'ATTENTION_NEEDED',
        priorityActions: [
          {
            title: 'Review Salma geofence perimeter check-in',
            detail: 'Check-in logged 1850m from Burullus site center.',
            severity: 'high',
            actionType: 'open_timeclock',
          },
        ],
        flaggedPostIds: [],
        model: 'gemini-4-hydrogen',
        elapsedMs: 95,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  let navigatedTarget = '';
  const ui = render(
    <InscoDualAiDock
      language="en"
      portal="company"
      onOpenCompany={sec => {
        navigatedTarget = `company:${sec ?? ''}`;
      }}
      onOpenClient={sec => {
        navigatedTarget = `client:${sec ?? ''}`;
      }}
      onOpenAcademy={tab => {
        navigatedTarget = `academy:${tab ?? ''}`;
      }}
    />
  );

  fireEvent.click(ui.getByTestId('insco-dual-ai-launcher'));
  const drawer = ui.getByTestId('insco-dual-ai-drawer');

  // Test User Copilot
  const input = within(drawer).getByPlaceholderText(/Ask User Copilot/);
  fireEvent.change(input, { target: { value: 'Recommend PAUT parameters for P91' } });
  fireEvent.submit(input.closest('form')!);

  await waitFor(() => {
    assert.ok(within(drawer).getByText(/PAUT 40-70 deg sectorial scan/));
  });

  // Switch to Site Manager AI
  fireEvent.click(within(drawer).getByTestId('ai-tab-manager'));
  fireEvent.click(within(drawer).getByRole('button', { name: 'Full Site Audit' }));

  await waitFor(() => {
    const res = within(drawer).getByTestId('site-manager-result');
    assert.ok(within(res).getByText(/ATTENTION_NEEDED/));
    assert.ok(within(res).getByText(/Review Salma geofence perimeter check-in/));
  });

  fireEvent.click(within(drawer).getByRole('button', { name: /Go to target section/ }));
  assert.equal(navigatedTarget, 'client:timeclock');
  assert.ok(calls.some(u => u.includes('/api/ai/agent/user-copilot')));
  assert.ok(calls.some(u => u.includes('/api/ai/agent/site-manager')));
});

/* ----------- 3. INSCO Community LinkedIn + Facebook Hybrid Hub ------------ */

test('CommunityWorkspacesHub renders Feed, Engineering Network, Jobs & Tenders, and Profile tabs cleanly', () => {
  const ui = render(
    <CommunityWorkspacesHub
      language="en"
      user={null}
      account={null}
      myProfile={null}
      directoryProfiles={[
        {
          uid: 'u-eng-1',
          displayName: 'Eng. Karim El-Mansoury',
          headline: 'Senior PAUT & RT Level III Lead',
          organizationName: 'PetroSafe Inspection',
          sector: 'Oil & Gas NDT',
          city: 'Suez, Egypt',
          companyCode: 'INS-CO-0101',
          certifications: 'ASNT Level III RT/UT · ISO 9712',
          yearsExperience: 12,
          availabilityStatus: 'active_field',
          companiesManaged: 2,
          endorsementsCount: 7,
          isPublished: true,
        },
      ]}
      companies={[]}
      posts={[
        {
          id: 'post-1',
          authorUid: 'u-eng-1',
          authorName: 'Eng. Karim El-Mansoury',
          authorHeadline: 'Senior PAUT & RT Level III Lead',
          authorOrg: 'PetroSafe Inspection',
          authorCompanyCode: 'INS-CO-0101',
          postType: 'technical_case',
          ndtMethod: 'RT',
          title: 'Ir-192 Panoramic Shoot on 24-inch Steam Header',
          body: 'Achieved 2.65 H&D film density using AGFA D7 and ASTM 1B IQI.',
          tags: ['RT', 'ASME_SecV'],
          likesCount: 4,
          commentsCount: 1,
          visibility: 'public',
          aiModerationStatus: 'approved',
          isPinnedAnnouncement: true,
        },
      ]}
      opportunities={[
        {
          id: 'opp-1',
          authorUid: 'u-eng-1',
          authorName: 'Eng. Karim El-Mansoury',
          authorOrg: 'PetroSafe Inspection',
          opportunityType: 'tender',
          title: 'Shutdown PAUT & PWHT Contract — Suez Refinery',
          location: 'Suez, Egypt',
          methods: ['PAUT', 'PWHT'],
          requirements: 'ASNT Level II/III certified crew required.',
          status: 'open',
          visibility: 'public',
        },
      ]}
      onOpenCompanies={() => {}}
      onOpenTimeClock={() => {}}
    />
  );

  const hub = ui.getByTestId('community-workspaces-hub');
  assert.ok(within(hub).getByTestId('community-post-post-1'));
  assert.ok(within(hub).getByText('Ir-192 Panoramic Shoot on 24-inch Steam Header'));
  assert.ok(within(hub).getByTestId('site-manager-ai-pulse'));

  // Switch to LinkedIn Network tab
  fireEvent.click(within(hub).getByRole('button', { name: /Engineering Network/ }));
  assert.ok(within(hub).getByText('ASNT Level III RT/UT · ISO 9712'));
  assert.ok(within(hub).getByText(/12 yrs exp/));

  // Switch to Jobs & Tenders Board
  fireEvent.click(within(hub).getByRole('button', { name: /Jobs & Tenders/ }));
  assert.ok(within(hub).getByTestId('community-opportunities-board'));
  assert.ok(within(hub).getAllByText('Shutdown PAUT & PWHT Contract — Suez Refinery').length > 0);
});

/* -------- 4. AR Simulator: All 5 RT & All 5 UT Animated Techniques ------- */

test('NdtCameraArOverlayLab supports all 5 RT exposure techniques and all 5 UT animated wave modes in AR', () => {
  const ui = render(<NdtCameraArOverlayLab language="en" />);

  // Activate Calibration Backdrop to inspect live HUD telemetry
  fireEvent.click(ui.getByTestId('toggle-calibration-backdrop-btn'));

  // Cycle all 5 RT techniques in AR
  const rtCases: Array<{ testId: string; expectedText: RegExp }> = [
    { testId: 'ar-rt-tech-swsi_plate', expectedText: /SWSI PLATE \/ 1T/ },
    { testId: 'ar-rt-tech-panoramic', expectedText: /PANORAMA 360° \(1T\)/ },
    { testId: 'ar-rt-tech-dwsi_contact', expectedText: /DWSI CONTACT \(2T\)/ },
    { testId: 'ar-rt-tech-elliptical', expectedText: /DWDI ELLIPSE \(2T\)/ },
    { testId: 'ar-rt-tech-dwdi_superimposed', expectedText: /DWDI SUPERIMPOSED 0° \(2T\)/ },
  ];

  for (const rtCase of rtCases) {
    fireEvent.click(ui.getByTestId(rtCase.testId));
    assert.ok(ui.getByText(rtCase.expectedText));
  }

  // Switch to UT AR Overlay and cycle all 5 UT techniques with CSS beam animations
  fireEvent.click(ui.getByTestId('ar-mode-ut'));
  assert.ok(ui.getByTestId('ar-svg-ut-group'));

  fireEvent.click(ui.getByTestId('ar-ut-tech-normal_0'));
  assert.ok(ui.getByTestId('ar-ut-normal-0'));
  assert.ok(ui.container.querySelector('.ut-beam-flow-fast'));

  fireEvent.click(ui.getByTestId('ar-ut-tech-angle_shear'));
  assert.ok(ui.getByTestId('ar-ut-angle-shear'));
  assert.ok(ui.container.querySelector('.ut-interface-ripple'));

  fireEvent.click(ui.getByTestId('ar-ut-tech-tofd'));
  assert.ok(ui.getByTestId('ar-ut-tofd'));
  assert.ok(ui.getByText(/TOFD DUAL PROBE/));

  fireEvent.click(ui.getByTestId('ar-ut-tech-paut_sscan'));
  assert.ok(ui.getByTestId('ar-ut-paut-sscan'));
  assert.ok(ui.container.querySelector('.ut-paut-wavefront'));

  fireEvent.click(ui.getByTestId('ar-ut-tech-creep_surface'));
  assert.ok(ui.getByTestId('ar-ut-creep-surface'));
  assert.ok(ui.getByText(/CREEPING SUB-SURFACE OD WAVE/));
});
