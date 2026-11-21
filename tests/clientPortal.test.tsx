/**
 * Client Portal tests — verifies the 3rd portal routes, portal isolation,
 * company code generators, search integration, coded archive filtering,
 * and report dossier/builder interactions.
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

// These tests cover routing and rendering, not live Firebase connectivity.
// ClientAuthFlow exercises authentication and writes against local fixtures.
const firebaseConfig = await import('../src/firebase/config');
mock.module('../src/firebase/config.ts', {
  namedExports: { ...firebaseConfig, auth: null, db: null, isFirebaseConfigured: false },
});

const { App } = await import('../src/App');
const routes = await import('../src/utils/portalRoutes');
const { PORTAL_CHOICE_KEY } = await import('../src/utils/portalChoice');
const { filterGlobalSearchItems } = await import('../src/utils/globalSearchIndex');
const clientTypes = await import('../src/client/types');
const { getReportTemplate, REPORT_TEMPLATES } = await import('../src/client/reportTemplates');
const { ClientCompaniesSection } = await import('../src/components/client/ClientCompaniesSection');
const { ClientCompanyDossier } = await import('../src/components/client/ClientCompanyDossier');
const { render, fireEvent, cleanup, configure, waitFor, within } = await import('@testing-library/react');
configure({ asyncUtilTimeout: 3000 });

beforeEach(() => {
  localStorage.clear();
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
});

afterEach(() => cleanup());

/* --------------------------- 1. Routing & Helpers -------------------------- */

test('client portal routes parse and round-trip deterministically', () => {
  const cases: Array<{ hash: string; section: routes.ClientSectionId; companyId?: string }> = [
    { hash: '#client', section: 'overview' },
    { hash: '#client/requests', section: 'requests' },
    { hash: '#client/companies', section: 'companies' },
    { hash: '#client/companies/comp_2026_01', section: 'companies', companyId: 'comp_2026_01' },
    { hash: '#client/register', section: 'register' },
  ];

  for (const c of cases) {
    const parsed = routes.parseRoute(c.hash);
    assert.equal(parsed.portal, 'client');
    assert.ok(routes.isClientRoute(parsed));
    if (routes.isClientRoute(parsed)) {
      assert.equal(parsed.section, c.section);
      assert.equal(parsed.companyId, c.companyId);
    }
    assert.equal(routes.routeToHash(parsed), c.hash);
  }

  // Plural alias resolves cleanly to client portal
  const alias = routes.parseRoute('#clients/companies');
  assert.equal(alias.portal, 'client');
  if (routes.isClientRoute(alias)) {
    assert.equal(alias.section, 'companies');
  }
});

test('company code, report number, and template utilities work cleanly', () => {
  const year = new Date().getFullYear();
  assert.equal(clientTypes.sanitizeUpperCode(' ins co 0104! '), 'INS-CO-0104');
  assert.equal(clientTypes.sanitizeUpperCode('ins-co-0104'), 'INS-CO-0104');
  assert.equal(clientTypes.generateNextCompanyCode([]), 'INS-CO-0101');
  assert.equal(
    clientTypes.generateNextCompanyCode(['INS-CO-0101', 'INS-CO-0105']),
    'INS-CO-0106'
  );

  const rNo = clientTypes.generateNextReportNumber('INS-CO-0101', 'UT', [
    `INS-CO-0101-UT-${year}-001`,
  ]);
  assert.equal(rNo, `INS-CO-0101-UT-${year}-002`);
  assert.match(clientTypes.generateRequestCode(), /^REQ-\d{4}-[A-Z0-9]+$/);

  assert.ok(REPORT_TEMPLATES.length >= 6);
  const utTpl = getReportTemplate('ut_weld_v1');
  assert.equal(utTpl.method, 'UT');
  assert.equal(getReportTemplate('unknown_key').templateKey, 'custom_template_v1');
});

/* ----------------------- 2. 3rd Portal Shell & Isolation ------------------- */

test('switching to Client Portal via PortalSwitchBar isolates view and persists choice', async () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'company');
  const ui = render(<App />);

  const bar = ui.getByRole('group', { name: /تبديل المسار/ });
  fireEvent.click(within(bar).getByRole('button', { name: /بوابة العملاء/ }));

  assert.equal(dom.window.location.hash, '#client');
  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), 'client');

  // Client portal header nav replaces corporate nav and academy bar
  assert.equal(ui.queryByRole('button', { name: 'خدماتنا' }), null);
  assert.equal(ui.queryByRole('button', { name: 'اطلب عرض سعر' }), null);
  assert.equal(ui.queryByRole('button', { name: 'رئيسية الأكاديمية' }), null);

  await waitFor(() => {
    assert.ok(ui.container.querySelector('[data-testid="client-portal-root"]'));
  });
});

test('deep-link #client/companies skips the chooser modal and opens Client Portal directly', async () => {
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#client/companies');
  const ui = render(<App />);

  assert.equal(ui.queryByRole('dialog'), null);
  assert.match(document.title, /أرشيف الشركات والملفات/);

  await waitFor(() => {
    assert.ok(ui.container.querySelector('[data-testid="client-portal-root"]'));
  });
});

test('choosing Client Portal from PortalChooser remembers client preference', () => {
  const ui = render(<App />);
  const dialog = ui.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /دخول بوابة العملاء/ }));

  assert.equal(localStorage.getItem(PORTAL_CHOICE_KEY), 'client');
  assert.equal(dom.window.location.hash, '#client');
  assert.equal(ui.queryByRole('dialog'), null);
});

test('returning client visitor lands directly in #client on next visit', () => {
  localStorage.setItem(PORTAL_CHOICE_KEY, 'client');
  render(<App />);
  assert.equal(dom.window.location.hash, '#client');
});

/* ---------------------- 3. Search & Archive Components --------------------- */

test('global search index includes Client Portal items under client category', () => {
  const clientItems = filterGlobalSearchItems('', 'client', 10);
  assert.ok(clientItems.length >= 4);
  assert.ok(clientItems.every(item => item.destination.type === 'client'));
  const codeSearch = filterGlobalSearchItems('INS-CO-XXXX', 'client', 5);
  assert.ok(codeSearch.length >= 1);
});

test('ClientCompaniesSection filters coded companies by Company Code and archive category', () => {
  const opened: string[] = [];
  const sampleCompanies: clientTypes.CompanyRecord[] = [
    {
      id: 'co1',
      companyCode: 'INS-CO-0101',
      nameAr: 'بتروجلف مصر للبترول',
      nameEn: 'PetroGulf Egypt',
      archiveCategory: 'active_testing',
      hasActiveTestingDossier: true,
      sector: 'Oil & Gas',
      commercialRegNo: '99120',
      contactPerson: 'Eng. Karim',
      contactEmail: 'karim@petrogulf.test',
      contactPhone: '0100111222',
      projectLocation: 'Suez',
      activeScope: 'RT & PAUT',
      legacySinceYear: '2019',
      reportsCount: 4,
      assignedClientUid: '',
      createdByUid: 'admin_1',
    },
    {
      id: 'co2',
      companyCode: 'INS-CO-0042',
      nameAr: 'الدلتا للصناعات القديمة',
      nameEn: 'Delta Legacy Works',
      archiveCategory: 'legacy_archive',
      hasActiveTestingDossier: false,
      sector: 'Power',
      commercialRegNo: '55110',
      contactPerson: 'Eng. Hany',
      contactEmail: 'hany@delta.test',
      contactPhone: '0100333444',
      projectLocation: 'Tanta',
      activeScope: 'PWHT Legacy',
      legacySinceYear: '2014',
      reportsCount: 12,
      assignedClientUid: '',
      createdByUid: 'admin_1',
    },
  ];

  const ui = render(
    <ClientCompaniesSection
      language="ar"
      companies={sampleCompanies}
      loading={false}
      isAdmin={true}
      currentUid="admin_1"
      onOpenCompanyDossier={id => opened.push(id)}
    />
  );

  // Filter by legacy archive tab
  fireEvent.click(ui.getByRole('button', { name: 'أرشيف قديم' }));
  assert.equal(ui.queryByText('بتروجلف مصر للبترول'), null);
  assert.ok(ui.getByText('الدلتا للصناعات القديمة'));

  // Reset to All and search by unique company code INS-CO-0101
  fireEvent.click(ui.getByRole('button', { name: 'جميع الشركات' }));
  const searchInput = ui.getByPlaceholderText(/ابحث بالرقم الكودي/);
  fireEvent.change(searchInput, { target: { value: 'INS-CO-0101' } });
  assert.ok(ui.getByText('بتروجلف مصر للبترول'));
  assert.equal(ui.queryByText('الدلتا للصناعات القديمة'), null);

  fireEvent.click(ui.getByRole('button', { name: /فتح الفايل والتقارير/ }));
  assert.deepEqual(opened, ['co1']);
});

test('ClientCompanyDossier filters reports and switches report builder templates', () => {
  const company: clientTypes.CompanyRecord = {
    id: 'co1',
    companyCode: 'INS-CO-0101',
    nameAr: 'بتروجلف مصر للبترول',
    nameEn: 'PetroGulf Egypt',
    archiveCategory: 'active_testing',
    hasActiveTestingDossier: true,
    sector: 'Oil & Gas',
    reportsCount: 2,
    assignedClientUid: '',
    createdByUid: 'admin_1',
  };

  const reports: clientTypes.CompanyInspectionReport[] = [
    {
      id: 'rep_1',
      companyId: 'co1',
      companyCode: 'INS-CO-0101',
      assignedClientUid: '',
      reportNumber: 'INS-CO-0101-RT-001',
      templateKey: 'rt_weld_v1',
      method: 'RT',
      isLegacyArchive: false,
      projectName: 'Pipeline Phase 2',
      componentOrJointId: 'LINE-01-JW12',
      codeStandard: 'ASME B31.3',
      inspectorName: 'Eng. Tarek',
      inspectionDate: '2026-04-10',
      verdict: 'ACCEPT',
      status: 'issued',
      technicalData: { sourceType: 'Gamma Ir-192' },
      createdByUid: 'admin_1',
    },
    {
      id: 'rep_2',
      companyId: 'co1',
      companyCode: 'INS-CO-0101',
      assignedClientUid: '',
      reportNumber: 'INS-CO-0101-PWHT-001',
      templateKey: 'pwht_chart_v1',
      method: 'PWHT',
      isLegacyArchive: true,
      projectName: 'Boiler Header Overhaul',
      componentOrJointId: 'HDR-04-W03',
      codeStandard: 'ASME Sec I',
      inspectorName: 'Eng. Adel',
      inspectionDate: '2021-11-05',
      verdict: 'ACCEPT',
      status: 'archived',
      technicalData: { soakTempC: '725' },
      createdByUid: 'admin_1',
    },
  ];

  const ui = render(
    <ClientCompanyDossier
      language="ar"
      company={company}
      reports={reports}
      isAdmin={true}
      currentUid="admin_1"
      onBackToArchive={() => {}}
    />
  );

  // Both reports visible initially
  assert.ok(ui.getByText('INS-CO-0101-RT-001'));
  assert.ok(ui.getByText('INS-CO-0101-PWHT-001'));

  // Filter by Legacy origin
  fireEvent.click(ui.getByRole('button', { name: 'أرشيف قديم' }));
  assert.equal(ui.queryByText('INS-CO-0101-RT-001'), null);
  assert.ok(ui.getByText('INS-CO-0101-PWHT-001'));

  const year = new Date().getFullYear();
  // Switch to Data-Entry Builder tab and pick PWHT template
  fireEvent.click(ui.getByRole('tab', { name: /آلية إدخال بيانات الريبورتات الجديدة/ }));
  fireEvent.click(ui.getByRole('button', { name: /تقرير المعالجة الحرارية بعد اللحام \(PWHT\)/ }));

  const reportNoInput = ui.getByLabelText(/رقم الريبورت/) as HTMLInputElement;
  assert.equal(reportNoInput.value, `INS-CO-0101-PWHT-${year}-003`);
});
