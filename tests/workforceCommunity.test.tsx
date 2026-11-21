/**
 * Workforce Community, EmployeeMapTracker, Worker Time-Clock & Geofenced Attendance Timeline tests.
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
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

const geofencing = await import('../src/client/geofencing');
const faceVerification = await import('../src/client/faceVerification');
const routes = await import('../src/utils/portalRoutes');
const { filterGlobalSearchItems } = await import('../src/utils/globalSearchIndex');
const clientTypes = await import('../src/client/types');
const workforceLocalStore = await import('../src/client/workforceLocalStore');
const { ClientCompaniesSection } = await import('../src/components/client/ClientCompaniesSection');
const { ClientCompanyDossier } = await import('../src/components/client/ClientCompanyDossier');
const { EmployeeTimeClockPortal } = await import('../src/components/client/EmployeeTimeClockPortal');
const { CompanyFieldTools } = await import('../src/components/company/CompanyFieldTools');
const { render, fireEvent, cleanup, within } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  workforceLocalStore.resetLocalWorkforceSnapshot();
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

/* ------------------- 1. Geofencing & Face Verification Core ---------------- */

test('geofencing calculates Haversine distances and detects outside-perimeter breaches', () => {
  const zeroDist = geofencing.calculateDistanceMeters(31.5453, 31.0872, 31.5453, 31.0872);
  assert.equal(zeroDist, 0);

  const insideEval = geofencing.evaluateGeofence({
    workerLat: 31.5461,
    workerLng: 31.0881,
    siteLat: 31.5453,
    siteLng: 31.0872,
    radiusMeters: 500,
  });
  assert.equal(insideEval.status, 'inside_geofence');
  assert.equal(insideEval.exceededByMeters, 0);
  assert.ok(insideEval.distanceMeters < 200);

  const outsideEval = geofencing.evaluateGeofence({
    workerLat: 31.572,
    workerLng: 31.112,
    siteLat: 31.5453,
    siteLng: 31.0872,
    radiusMeters: 500,
  });
  assert.equal(outsideEval.status, 'outside_geofence');
  assert.ok(outsideEval.distanceMeters > 2500);
  assert.ok(outsideEval.exceededByMeters > 2000);

  const suez = geofencing.resolveSiteCoordinates({ projectLocation: 'Suez Refinery Sector' });
  assert.equal(Math.round(suez.lat), 30);
  assert.equal(suez.geofenceRadiusMeters, 600);
});

test('faceVerification produces deterministic compact digests and rejects flat black frames', () => {
  const digestA = faceVerification.computeCompactFaceDigest('EMP-101-SAMPLE');
  const digestB = faceVerification.computeCompactFaceDigest('EMP-101-SAMPLE');
  assert.equal(digestA, digestB);
  assert.match(digestA, /^FC-[0-9A-F]{8}-[0-9A-F]{8}$/);

  const w = 40;
  const h = 40;
  const blackFrame = new Uint8ClampedArray(w * h * 4);
  const blackResult = faceVerification.analyzeRgbaFrame(blackFrame, w, h);
  assert.equal(blackResult.faceDetected, false);

  const litFrame = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = (y * w + x) * 4;
      const val = ((x >> 2) + (y >> 2)) % 2 === 0 ? 70 : 185;
      litFrame[idx] = val;
      litFrame[idx + 1] = val;
      litFrame[idx + 2] = val;
      litFrame[idx + 3] = 255;
    }
  }
  const litResult = faceVerification.analyzeRgbaFrame(litFrame, w, h);
  assert.equal(litResult.faceDetected, true);
  assert.ok(litResult.contrastStd > 20);
});

/* ---------------- 2. Community Routing & Self-Service Company ------------- */

test('portalRoutes and globalSearchIndex include Time-Clock and Business Community routes', () => {
  const tc = routes.parseRoute('#client/timeclock');
  assert.equal(tc.portal, 'client');
  if (routes.isClientRoute(tc)) {
    assert.equal(tc.section, 'timeclock');
  }
  assert.equal(routes.routeToHash(tc), '#client/timeclock');

  const comm = routes.parseRoute('#client/community');
  assert.equal(comm.portal, 'client');
  if (routes.isClientRoute(comm)) {
    assert.equal(comm.section, 'community');
  }
  assert.equal(routes.routeToHash(comm), '#client/community');

  const searchCommunity = filterGlobalSearchItems('community', 'client', 10);
  assert.ok(searchCommunity.some(item => item.destination.type === 'client' && item.destination.section === 'community'));

  const searchTimeClock = filterGlobalSearchItems('geofence', 'client', 10);
  assert.ok(searchTimeClock.some(item => item.destination.type === 'client' && item.destination.section === 'timeclock'));
});

test('ClientCompaniesSection unlocks self-service company & geofence builder for any signed-in user', () => {
  const ui = render(
    <ClientCompaniesSection
      language="en"
      companies={[]}
      loading={false}
      isAdmin={false}
      currentUid="business_owner_uid_1"
      onOpenCompanyDossier={() => {}}
    />
  );

  const addButton = ui.getByRole('button', { name: /Add & Code Company/ });
  fireEvent.click(addButton);

  assert.ok(ui.getByText('Register & Code Company Record'));
  assert.ok(ui.getByLabelText(/Geofence Radius \(m\)/));
  assert.ok(ui.getByLabelText(/Project Latitude/));
  assert.ok(ui.getByLabelText(/Project Longitude/));
});

/* ------- 3. EmployeeMapTracker & Timeline inside ClientCompanyDossier ----- */

test('ClientCompanyDossier integrates EmployeeMapTracker and Attendance Timeline with geofencing alerts', () => {
  const company: clientTypes.CompanyRecord = {
    id: 'co_burullus',
    companyCode: 'INS-CO-0101',
    nameAr: 'محطة كهرباء البرلس',
    nameEn: 'Burullus Power Station',
    archiveCategory: 'active_testing',
    hasActiveTestingDossier: true,
    sector: 'Power',
    siteLat: 31.5453,
    siteLng: 31.0872,
    geofenceRadiusMeters: 500,
    reportsCount: 0,
    assignedClientUid: 'owner_1',
    createdByUid: 'owner_1',
  };

  const employees: clientTypes.CompanyEmployee[] = [
    {
      id: 'emp_1',
      companyId: 'co_burullus',
      companyCode: 'INS-CO-0101',
      assignedClientUid: 'owner_1',
      ownerUid: 'owner_1',
      fullName: 'Eng. Karim Mansour',
      roleTitle: 'RT Senior Inspector',
      badgeCode: 'EMP-101',
      onlineStatus: 'on_site',
      lastLat: 31.5459,
      lastLng: 31.0878,
      faceEnrolled: true,
    },
    {
      id: 'emp_2',
      companyId: 'co_burullus',
      companyCode: 'INS-CO-0101',
      assignedClientUid: 'owner_1',
      ownerUid: 'owner_1',
      fullName: 'Eng. Omar Sherif',
      roleTitle: 'UT Level II Technician',
      badgeCode: 'EMP-102',
      onlineStatus: 'alert',
      lastLat: 31.5715,
      lastLng: 31.1112,
      faceEnrolled: true,
    },
  ];

  const attendanceLogs: clientTypes.AttendanceLog[] = [
    {
      id: 'log_1',
      companyId: 'co_burullus',
      companyCode: 'INS-CO-0101',
      assignedClientUid: 'owner_1',
      employeeId: 'emp_1',
      employeeName: 'Eng. Karim Mansour',
      eventType: 'check_in',
      timestampIso: '2026-11-19T07:15:00Z',
      lat: 31.5459,
      lng: 31.0878,
      distanceFromSiteMeters: 88,
      geofenceRadiusMeters: 500,
      geofenceStatus: 'inside_geofence',
      faceVerified: true,
      verificationMethod: 'face_gps',
    },
    {
      id: 'log_2',
      companyId: 'co_burullus',
      companyCode: 'INS-CO-0101',
      assignedClientUid: 'owner_1',
      employeeId: 'emp_2',
      employeeName: 'Eng. Omar Sherif',
      eventType: 'check_in',
      timestampIso: '2026-11-19T08:05:00Z',
      lat: 31.5715,
      lng: 31.1112,
      distanceFromSiteMeters: 3690,
      geofenceRadiusMeters: 500,
      geofenceStatus: 'outside_geofence',
      faceVerified: true,
      verificationMethod: 'face_gps',
    },
  ];

  const ui = render(
    <ClientCompanyDossier
      language="en"
      company={company}
      reports={[]}
      employees={employees}
      attendanceLogs={attendanceLogs}
      isAdmin={false}
      currentUid="owner_1"
      onBackToArchive={() => {}}
      onExportPdf={() => {}}
    />
  );

  // EmployeeMapTracker renders immediately on selected company dossier
  const tracker = ui.getByTestId('employee-map-tracker');
  assert.ok(within(tracker).getAllByText(/Eng\. Karim Mansour/).length >= 1);
  assert.ok(within(tracker).getAllByText(/Eng\. Omar Sherif/).length >= 1);
  assert.ok(within(tracker).getByText(/1 Outside Perimeter/));

  // Switch to Crew Map & Timeline tab and inspect Timeline + Geofencing Alert Banner
  fireEvent.click(ui.getByRole('tab', { name: /Crew Map & Timeline/ }));
  const timeline = ui.getByTestId('employee-attendance-timeline');
  const adminAlert = within(timeline).getByTestId('geofencing-admin-alert');
  assert.ok(within(adminAlert).getByText(/Admin Geofencing Alert/));
  assert.ok(within(adminAlert).getByText(/Eng\. Omar Sherif/));
});

/* ---------------- 4. Time-Clock Portal Live Geofence Evaluation ------------ */

test('EmployeeTimeClockPortal flags outside-perimeter presets before submission', () => {
  const company: clientTypes.CompanyRecord = {
    id: 'co_1',
    companyCode: 'INS-CO-0101',
    nameAr: 'شركة الاختبار',
    nameEn: 'Alpha Testing Co',
    archiveCategory: 'active_testing',
    hasActiveTestingDossier: true,
    sector: 'Oil & Gas',
    siteLat: 31.5453,
    siteLng: 31.0872,
    geofenceRadiusMeters: 500,
    reportsCount: 0,
    assignedClientUid: 'u1',
    createdByUid: 'u1',
  };
  const employees: clientTypes.CompanyEmployee[] = [
    {
      id: 'e1',
      companyId: 'co_1',
      companyCode: 'INS-CO-0101',
      assignedClientUid: 'u1',
      ownerUid: 'u1',
      fullName: 'Tarek Hassan',
      roleTitle: 'UT Tech',
      badgeCode: 'EMP-101',
      onlineStatus: 'off_duty',
      faceEnrolled: true,
    },
  ];

  const ui = render(
    <EmployeeTimeClockPortal
      language="en"
      currentUid="u1"
      companies={[company]}
      selectedCompanyId="co_1"
      employees={employees}
      attendanceLogs={[]}
    />
  );

  // Initially inside geofence near site center
  assert.ok(ui.getByText(/Inside Project Geofence/));

  // Click Outside Perimeter preset (+2 km)
  fireEvent.click(ui.getByRole('button', { name: /Test Outside Perimeter/ }));
  assert.ok(ui.getByText(/Warning: Outside Designated Project Perimeter/));

  // Return to Inside preset
  fireEvent.click(ui.getByRole('button', { name: /Set Inside Site Center/ }));
  assert.ok(ui.getByText(/Inside Project Geofence/));
});

/* --------- 5. Field tools Geofenced Attendance Timeline & Filtering ------ */

test('Field tools display Geofenced Attendance Timeline, Admin Alerts, and interactive simulator', () => {
  const ui = render(
    <CompanyFieldTools
      language="en"
      onOpenClient={() => {}}
      onOpenDossier={() => {}}
    />
  );

  const section = ui.getByTestId('company-attendance-timeline-section');
  const alertBanner = within(section).getByTestId('geofencing-admin-alert');
  assert.ok(within(alertBanner).getByText(/Admin Geofencing Alert/));

  // Filter timeline strictly to Geofence Alerts
  const alertFilterBtn = within(section).getByRole('button', { name: /Geofence Alerts \(1\)/ });
  fireEvent.click(alertFilterBtn);

  // Trigger a second outside alert via interactive preview control
  fireEvent.click(within(section).getByRole('button', { name: /Test Outside Alert/ }));
  assert.ok(within(section).getByRole('button', { name: /Geofence Alerts \(2\)/ }));

  // Reset preview store cleanly
  fireEvent.click(within(section).getByRole('button', { name: /Reset preview log/ }));
  assert.ok(within(section).getByRole('button', { name: /Geofence Alerts \(1\)/ }));
});
