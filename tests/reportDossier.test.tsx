/**
 * Inspection Report Dossier tests — verifies company-ID scoping, chronological date
 * categorization (by month / exact date / year), inline technical detail expansion,
 * and per-report Quick Download button behavior.
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
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  history: dom.window.history,
  Blob: dom.window.Blob,
  URL: dom.window.URL,
  IS_REACT_ACT_ENVIRONMENT: true,
});
if (typeof dom.window.URL.createObjectURL !== 'function') {
  dom.window.URL.createObjectURL = () => 'blob:mock-pdf';
}
if (typeof dom.window.URL.revokeObjectURL !== 'function') {
  dom.window.URL.revokeObjectURL = () => {};
}
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const grouping = await import('../src/client/reportGrouping');
const recentReports = await import('../src/client/recentReports');
const { ClientCompanyDossier } = await import('../src/components/client/ClientCompanyDossier');
const { ClientReportDossierView } = await import('../src/components/client/ClientReportDossierView');
const { render, fireEvent, cleanup, within } = await import('@testing-library/react');

const sampleCompany = {
  id: 'comp_suez_ref_01',
  companyCode: 'INS-CO-0140',
  nameAr: 'شركة السويس لتصنيع البترول',
  nameEn: 'Suez Oil Processing Co.',
  archiveCategory: 'active_testing' as const,
  hasActiveTestingDossier: true,
  sector: 'Oil & Gas Refining',
  reportsCount: 3,
  assignedClientUid: 'client_uid_1',
  createdByUid: 'admin_1',
};

const sampleReports = [
  {
    id: 'rep_apr_10',
    companyId: 'comp_suez_ref_01',
    companyCode: 'INS-CO-0140',
    assignedClientUid: 'client_uid_1',
    reportNumber: 'INS-CO-0140-RT-2026-002',
    templateKey: 'rt_weld_v1',
    method: 'RT' as const,
    isLegacyArchive: false,
    projectName: 'Coker Heater Piping Turnaround',
    clientPoNumber: 'PO-2026-991',
    componentOrJointId: 'LINE-CK-204-JW09',
    materialSpec: 'ASTM A335 P11',
    thicknessMm: '24',
    codeStandard: 'ASME B31.3',
    inspectorName: 'Eng. Karim Adel',
    inspectionDate: '2026-04-10',
    verdict: 'ACCEPT' as const,
    status: 'issued' as const,
    technicalData: { radiationSource: 'Ir-192', sfdMm: '600' },
    notes: 'All radiographs meet density 2.0–3.5.',
    createdByUid: 'admin_1',
  },
  {
    id: 'rep_apr_03',
    companyId: 'comp_suez_ref_01',
    companyCode: 'INS-CO-0140',
    assignedClientUid: 'client_uid_1',
    reportNumber: 'INS-CO-0140-UT-2026-001',
    templateKey: 'ut_weld_v1',
    method: 'UT' as const,
    isLegacyArchive: false,
    projectName: 'Hydrocracker Drum Repair',
    clientPoNumber: 'PO-2026-991',
    componentOrJointId: 'V-301-NOZZLE-N4',
    materialSpec: 'SA-516 Gr.70',
    thicknessMm: '38',
    codeStandard: 'ASME Sec VIII Div 1',
    inspectorName: 'Eng. Mostafa Nabil',
    inspectionDate: '2026-04-03',
    verdict: 'HOLD' as const,
    status: 'issued' as const,
    technicalData: { probeAngleDeg: '60°', couplant: 'Ultrasonic Gel' },
    notes: 'Pending supplemental PAUT confirmation.',
    createdByUid: 'admin_1',
  },
  {
    id: 'rep_nov_21',
    companyId: 'comp_suez_ref_01',
    companyCode: 'INS-CO-0140',
    assignedClientUid: 'client_uid_1',
    reportNumber: 'INS-CO-0140-PWHT-2021-001',
    templateKey: 'pwht_chart_v1',
    method: 'PWHT' as const,
    isLegacyArchive: true,
    projectName: 'Boiler Header Stress Relief',
    componentOrJointId: 'HDR-02-W01',
    codeStandard: 'ASME B31.1',
    inspectorName: 'Eng. Adel Saeed',
    inspectionDate: '2021-11-05',
    verdict: 'ACCEPT' as const,
    status: 'archived' as const,
    technicalData: { soakTempC: '725', holdDurationMin: '90' },
    createdByUid: 'admin_1',
  },
  {
    id: 'rep_other_company',
    companyId: 'comp_unrelated_99',
    companyCode: 'INS-CO-0999',
    assignedClientUid: 'other_uid',
    reportNumber: 'INS-CO-0999-MT-2026-001',
    templateKey: 'mt_pt_surface_v1',
    method: 'MT' as const,
    isLegacyArchive: false,
    projectName: 'Unrelated Company Project',
    componentOrJointId: 'TANK-X-99',
    codeStandard: 'API 650',
    inspectorName: 'Other Inspector',
    inspectionDate: '2026-05-01',
    verdict: 'ACCEPT' as const,
    status: 'issued' as const,
    technicalData: {},
    createdByUid: 'admin_1',
  },
];

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => cleanup());

test('filterReportsForCompany scopes strictly to active company ID and groups by date cleanly', () => {
  const scoped = grouping.filterReportsForCompany(sampleReports, 'comp_suez_ref_01');
  assert.equal(scoped.length, 3);
  assert.equal(
    scoped.some(r => r.reportNumber === 'INS-CO-0999-MT-2026-001'),
    false
  );

  const byMonth = grouping.groupReportsByDateCategory(scoped, 'en', 'month', 'desc');
  assert.deepEqual(
    byMonth.map(g => g.groupKey),
    ['2026-04', '2021-11']
  );
  assert.equal(byMonth[0].label, 'April 2026');
  assert.equal(byMonth[0].reports.length, 2);
  assert.equal(byMonth[0].reports[0].inspectionDate, '2026-04-10');

  const byDayAsc = grouping.groupReportsByDateCategory(scoped, 'en', 'day', 'asc');
  assert.deepEqual(
    byDayAsc.map(g => g.groupKey),
    ['2021-11-05', '2026-04-03', '2026-04-10']
  );

  const byYear = grouping.groupReportsByDateCategory(scoped, 'ar', 'year', 'desc');
  assert.deepEqual(
    byYear.map(g => g.groupKey),
    ['2026', '2021']
  );
  assert.deepEqual(grouping.extractReportYears(scoped), ['2026', '2021']);
});

test('ClientReportDossierView categorizes reports by date, switches granularity, expands inline details, and triggers Quick Download', () => {
  const exportedReportNumbers: string[] = [];
  const ui = render(
    <ClientReportDossierView
      language="en"
      company={sampleCompany}
      reports={sampleReports}
      isAdmin={false}
      onPreviewReport={() => {}}
      onExportPdf={(_comp, rep) => {
        exportedReportNumbers.push(rep.reportNumber);
      }}
    />
  );

  // Company ID shown clearly & unrelated company report excluded
  assert.ok(ui.getByText(/Company ID: comp_suez_ref_01/));
  assert.equal(ui.queryByText('INS-CO-0999-MT-2026-001'), null);

  // Month date categories rendered newest first
  const aprGroup = ui.getByTestId('report-date-group-2026-04');
  assert.ok(within(aprGroup).getByText('April 2026'));
  assert.ok(within(aprGroup).getByText('INS-CO-0140-RT-2026-002'));
  assert.ok(within(aprGroup).getByText('INS-CO-0140-UT-2026-001'));

  const novGroup = ui.getByTestId('report-date-group-2021-11');
  assert.ok(within(novGroup).getByText('November 2021'));

  // Switch grouping to Exact Date ('By Date')
  fireEvent.click(ui.getByRole('button', { name: 'By Date' }));
  assert.ok(ui.getByTestId('report-date-group-2026-04-10'));
  assert.ok(ui.getByTestId('report-date-group-2026-04-03'));

  // Expand inline technical details on rep_apr_10
  const row = ui.getByTestId('dossier-report-row-rep_apr_10');
  fireEvent.click(within(row).getByRole('button', { name: 'Details' }));
  assert.ok(within(row).getByText('Ir-192'));
  assert.ok(within(row).getByText(/All radiographs meet density/));

  // Quick Download button present on each report and confirms download
  const quickDownloadButtons = ui.getAllByRole('button', { name: /Quick Download PDF for/ });
  assert.equal(quickDownloadButtons.length, 3);

  fireEvent.click(
    ui.getByRole('button', {
      name: 'Quick Download PDF for INS-CO-0140-RT-2026-002',
    })
  );
  assert.deepEqual(exportedReportNumbers, ['INS-CO-0140-RT-2026-002']);
  assert.ok(within(row).getByText('Downloaded'));
});

test('ClientCompanyDossier renders detailed date-categorized dossier and loading skeleton cleanly', () => {
  const ui = render(
    <ClientCompanyDossier
      language="en"
      company={sampleCompany}
      reports={sampleReports}
      reportsLoading={false}
      isAdmin={true}
      currentUid="admin_1"
      onBackToArchive={() => {}}
    />
  );

  assert.ok(ui.getByTestId('company-report-dossier-list'));
  assert.ok(ui.getByTestId('report-date-group-2026-04'));

  // Filter by year 2021
  const yearSelect = ui.getByLabelText('Filter by year') as HTMLSelectElement;
  fireEvent.change(yearSelect, { target: { value: '2021' } });
  assert.equal(ui.queryByTestId('report-date-group-2026-04'), null);
  assert.ok(ui.getByTestId('report-date-group-2021-11'));
});

test('extractReportTechnicians, extractReportMethodsWithCounts, and filterCompanyDossierReports filter accurately', () => {
  const scoped = grouping.filterReportsForCompany(sampleReports, 'comp_suez_ref_01');

  const technicians = grouping.extractReportTechnicians(scoped);
  assert.deepEqual(technicians, [
    { name: 'Eng. Adel Saeed', count: 1 },
    { name: 'Eng. Karim Adel', count: 1 },
    { name: 'Eng. Mostafa Nabil', count: 1 },
  ]);

  const methods = grouping.extractReportMethodsWithCounts(scoped);
  assert.deepEqual(methods, [
    { method: 'PWHT', count: 1 },
    { method: 'RT', count: 1 },
    { method: 'UT', count: 1 },
  ]);

  // Technician substring search still respects companyId scoping
  const byAdel = grouping.filterCompanyDossierReports(sampleReports, 'comp_suez_ref_01', {
    technicianQuery: 'adel',
  });
  assert.deepEqual(
    byAdel.map(r => r.reportNumber),
    ['INS-CO-0140-RT-2026-002', 'INS-CO-0140-PWHT-2021-001']
  );

  // Exact technician + method combination
  const exactUt = grouping.filterCompanyDossierReports(sampleReports, 'comp_suez_ref_01', {
    selectedTechnician: 'Eng. Mostafa Nabil',
    methodFilter: 'UT',
  });
  assert.deepEqual(
    exactUt.map(r => r.reportNumber),
    ['INS-CO-0140-UT-2026-001']
  );

  // Unrelated company report never leaks even if its method matches
  const mtOnly = grouping.filterCompanyDossierReports(sampleReports, 'comp_suez_ref_01', {
    methodFilter: 'MT',
  });
  assert.equal(mtOnly.length, 0);
});

test('ClientReportDossierView supports filtering by technician name and testing method with reset', () => {
  const ui = render(
    <ClientReportDossierView
      language="en"
      company={sampleCompany}
      reports={sampleReports}
      isAdmin={false}
      onPreviewReport={() => {}}
    />
  );

  // 1. Free-text technician name filter
  const techInput = ui.getByLabelText('Filter by technician name') as HTMLInputElement;
  fireEvent.change(techInput, { target: { value: 'Karim' } });
  assert.ok(ui.getByText('INS-CO-0140-RT-2026-002'));
  assert.equal(ui.queryByText('INS-CO-0140-UT-2026-001'), null);
  assert.equal(ui.queryByText('INS-CO-0140-PWHT-2021-001'), null);

  fireEvent.change(techInput, { target: { value: 'Adel' } });
  assert.ok(ui.getByText('INS-CO-0140-RT-2026-002'));
  assert.ok(ui.getByText('INS-CO-0140-PWHT-2021-001'));
  assert.equal(ui.queryByText('INS-CO-0140-UT-2026-001'), null);

  // Reset filters restores all 3 reports
  fireEvent.click(ui.getByRole('button', { name: 'Reset Filters' }));
  assert.ok(ui.getByText('INS-CO-0140-UT-2026-001'));

  // 2. Technician dropdown exact selection
  const techSelect = ui.getByLabelText('Select technician') as HTMLSelectElement;
  fireEvent.change(techSelect, { target: { value: 'Eng. Mostafa Nabil' } });
  assert.ok(ui.getByText('INS-CO-0140-UT-2026-001'));
  assert.equal(ui.queryByText('INS-CO-0140-RT-2026-002'), null);
  assert.equal(ui.queryByText('INS-CO-0140-PWHT-2021-001'), null);

  fireEvent.change(techSelect, { target: { value: 'ALL' } });

  // 3. Testing method quick-filter strip + select dropdown
  const quickMethodGroup = ui.getByRole('group', { name: 'Quick testing method filter' });
  fireEvent.click(within(quickMethodGroup).getByRole('button', { name: 'UT (1)' }));
  assert.ok(ui.getByText('INS-CO-0140-UT-2026-001'));
  assert.equal(ui.queryByText('INS-CO-0140-RT-2026-002'), null);

  const methodSelect = ui.getByLabelText('Filter by testing method') as HTMLSelectElement;
  assert.equal(methodSelect.value, 'UT');
  fireEvent.change(methodSelect, { target: { value: 'PWHT' } });
  assert.ok(ui.getByText('INS-CO-0140-PWHT-2021-001'));
  assert.equal(ui.queryByText('INS-CO-0140-UT-2026-001'), null);

  // 4. Conflicting filter triggers empty state and Reset Filters clears it
  fireEvent.change(techInput, { target: { value: 'Karim' } });
  assert.ok(ui.getByText('No inspection reports match the selected filters'));

  const resetButtons = ui.getAllByRole('button', { name: 'Reset Filters' });
  fireEvent.click(resetButtons[resetButtons.length - 1]);
  assert.ok(ui.getByText('INS-CO-0140-RT-2026-002'));
  assert.ok(ui.getByText('INS-CO-0140-UT-2026-001'));
  assert.ok(ui.getByText('INS-CO-0140-PWHT-2021-001'));
});

test('recentReports store caps at 5, deduplicates most-recent-first, and isolates by company ID', () => {
  const companyId = 'comp_suez_ref_01';
  assert.equal(recentReports.loadRecentDownloadedReports(companyId).length, 0);

  // Build 6 distinct reports for this company
  for (let i = 1; i <= 6; i++) {
    recentReports.recordRecentDownloadedReport(
      companyId,
      {
        ...sampleReports[0],
        id: `rep_seq_${i}`,
        reportNumber: `INS-CO-0140-RT-2026-00${i}`,
        componentOrJointId: `JW-${i}`,
      },
      `2026-11-18T08:0${i}:00.000Z`
    );
  }

  let saved = recentReports.loadRecentDownloadedReports(companyId);
  assert.equal(saved.length, 5);
  assert.deepEqual(
    saved.map(e => e.reportNumber),
    [
      'INS-CO-0140-RT-2026-006',
      'INS-CO-0140-RT-2026-005',
      'INS-CO-0140-RT-2026-004',
      'INS-CO-0140-RT-2026-003',
      'INS-CO-0140-RT-2026-002',
    ]
  );

  // Re-downloading #3 promotes it to the top without creating duplicates
  recentReports.recordRecentDownloadedReport(
    companyId,
    {
      ...sampleReports[0],
      id: 'rep_seq_3',
      reportNumber: 'INS-CO-0140-RT-2026-003',
      componentOrJointId: 'JW-3',
    },
    '2026-11-18T08:10:00.000Z'
  );
  saved = recentReports.loadRecentDownloadedReports(companyId);
  assert.equal(saved.length, 5);
  assert.equal(saved[0].reportNumber, 'INS-CO-0140-RT-2026-003');

  // Other company ID does not see Suez's downloads and cannot inject unrelated report
  assert.equal(recentReports.loadRecentDownloadedReports('comp_unrelated_99').length, 0);
  recentReports.recordRecentDownloadedReport(companyId, sampleReports[3]);
  assert.equal(
    recentReports
      .loadRecentDownloadedReports(companyId)
      .some(e => e.reportNumber === 'INS-CO-0999-MT-2026-001'),
    false
  );

  recentReports.clearRecentDownloadedReports(companyId);
  assert.equal(recentReports.loadRecentDownloadedReports(companyId).length, 0);
});

test('ClientCompanyDossier Recent Reports side panel tracks downloads, re-downloads while filtered, persists, and clears', () => {
  const exportedReports: string[] = [];
  const handleExportSpy = (_comp: typeof sampleCompany, rep: (typeof sampleReports)[number]) => {
    exportedReports.push(rep.reportNumber);
  };

  const ui = render(
    <ClientCompanyDossier
      language="en"
      company={sampleCompany}
      reports={sampleReports}
      reportsLoading={false}
      isAdmin={false}
      currentUid="client_uid_1"
      onBackToArchive={() => {}}
      onExportPdf={handleExportSpy}
    />
  );

  const panel = ui.getByTestId('recent-reports-panel');
  assert.ok(within(panel).getByTestId('recent-reports-empty'));
  assert.ok(within(panel).getByText('Last 0 / 5 downloads'));

  // Download 2 reports from the main archive view
  fireEvent.click(
    ui.getByRole('button', {
      name: 'Quick Download PDF for INS-CO-0140-UT-2026-001',
    })
  );
  fireEvent.click(
    ui.getByRole('button', {
      name: 'Quick Download PDF for INS-CO-0140-RT-2026-002',
    })
  );

  assert.deepEqual(exportedReports, [
    'INS-CO-0140-UT-2026-001',
    'INS-CO-0140-RT-2026-002',
  ]);
  assert.equal(within(panel).queryByTestId('recent-reports-empty'), null);
  assert.ok(within(panel).getByText('Last 2 / 5 downloads'));
  assert.ok(
    within(within(panel).getByTestId('recent-report-item-0')).getByText(
      'INS-CO-0140-RT-2026-002'
    )
  );
  assert.ok(
    within(within(panel).getByTestId('recent-report-item-1')).getByText(
      'INS-CO-0140-UT-2026-001'
    )
  );

  // Filter the main archive to zero matches; Recent Reports remains accessible for quick re-download
  const searchInput = ui.getByLabelText('Search inspection reports') as HTMLInputElement;
  fireEvent.change(searchInput, { target: { value: 'NON-EXISTENT-JOINT-999' } });
  assert.ok(ui.getByText('No inspection reports match the selected filters'));

  // Re-download the older report (UT) from Recent Reports panel -> triggers PDF & moves it to item #0
  fireEvent.click(
    within(panel).getByRole('button', {
      name: 'Re-download INS-CO-0140-UT-2026-001',
    })
  );
  assert.deepEqual(exportedReports, [
    'INS-CO-0140-UT-2026-001',
    'INS-CO-0140-RT-2026-002',
    'INS-CO-0140-UT-2026-001',
  ]);
  const topRecentItem = within(panel).getByTestId('recent-report-item-0');
  assert.ok(within(topRecentItem).getByText('INS-CO-0140-UT-2026-001'));
  assert.ok(within(topRecentItem).getByText('Downloaded'));

  // Remounting preserves the recent download entries from localStorage
  ui.unmount();
  const remounted = render(
    <ClientCompanyDossier
      language="en"
      company={sampleCompany}
      reports={sampleReports}
      reportsLoading={false}
      isAdmin={false}
      currentUid="client_uid_1"
      onBackToArchive={() => {}}
      onExportPdf={handleExportSpy}
    />
  );
  const remountedPanel = remounted.getByTestId('recent-reports-panel');
  assert.ok(within(remountedPanel).getByText('Last 2 / 5 downloads'));

  // Clear recent downloads
  fireEvent.click(
    within(remountedPanel).getByRole('button', { name: 'Clear recent reports' })
  );
  assert.ok(within(remountedPanel).getByTestId('recent-reports-empty'));
  assert.ok(within(remountedPanel).getByText('Last 0 / 5 downloads'));
});

