/**
 * Company QR Code tests — verifies unique per-company-ID QR generation,
 * crisp vector SVG/PDF rendering, modal controls, Company Portal quick-access lookup,
 * and Client Portal archive/dossier QR integration.
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { jsPDF } from 'jspdf';

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

const companyQr = await import('../src/client/companyQr');
const { CompanyQrBadge } = await import('../src/components/client/CompanyQrBadge');
const { CompanyQrModal } = await import('../src/components/client/CompanyQrModal');
const { ClientCompaniesSection } = await import('../src/components/client/ClientCompaniesSection');
const { ClientCompanyDossier } = await import('../src/components/client/ClientCompanyDossier');
const { CompanyPortal } = await import('../src/components/company/CompanyPortal');
const { render, fireEvent, cleanup, within } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
  dom.window.history.replaceState(null, '', '/INSCONDTEG/');
});

afterEach(() => cleanup());

test('company ID sanitization, validation, and deep-link QR URL builder', () => {
  assert.equal(companyQr.sanitizeCompanyIdSlug(' comp_petrogulf-01!@# '), 'comp_petrogulf-01');
  assert.equal(companyQr.isValidCompanyIdSlug('comp_petrogulf-01'), true);
  assert.equal(companyQr.isValidCompanyIdSlug('   '), false);
  assert.equal(companyQr.isValidCompanyIdSlug('x'.repeat(129)), false);

  const url = companyQr.buildCompanyDossierUrl('comp_burullus_99');
  assert.equal(
    url,
    'https://ndt-insco.github.io/INSCONDTEG/#client/companies/comp_burullus_99'
  );
});

test('buildQrVectorGeometry generates distinct deterministic QR matrices per company ID', () => {
  const qr1 = companyQr.buildQrVectorGeometry(
    companyQr.buildCompanyDossierUrl('comp_alpha_01')
  );
  const qr2 = companyQr.buildQrVectorGeometry(
    companyQr.buildCompanyDossierUrl('comp_beta_02')
  );
  const qr1Repeat = companyQr.buildQrVectorGeometry(
    companyQr.buildCompanyDossierUrl('comp_alpha_01')
  );

  assert.ok(qr1.size >= 21);
  assert.equal(qr1.totalSize, qr1.size + qr1.margin * 2);
  assert.ok(qr1.pathData.startsWith('M'));
  assert.equal(qr1.pathData, qr1Repeat.pathData);
  assert.notEqual(qr1.pathData, qr2.pathData);
});

test('generateCompanyQrPngDataUrl and drawVectorQrOnPdf produce valid QR outputs', async () => {
  const pngUrl = await companyQr.generateCompanyQrPngDataUrl('comp_suez_05', 256);
  assert.ok(pngUrl.startsWith('data:image/png;base64,'));

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  companyQr.drawVectorQrOnPdf(
    doc,
    companyQr.buildCompanyDossierUrl('comp_suez_05'),
    176,
    4,
    22,
    1
  );
  const pdfUri = doc.output('datauristring');
  assert.ok(pdfUri.startsWith('data:application/pdf'));
});

test('CompanyQrModal displays unique company QR, copies URL, opens dossier, and closes on Escape', () => {
  const opened: string[] = [];
  let closedCount = 0;

  const ui = render(
    <CompanyQrModal
      language="en"
      company={{
        id: 'comp_modal_77',
        companyCode: 'INS-CO-0177',
        nameEn: 'Red Sea Refining Co.',
      }}
      onClose={() => {
        closedCount += 1;
      }}
      onOpenDossier={id => opened.push(id)}
    />
  );

  const badge = ui.getByTestId('company-qr-badge-comp_modal_77');
  assert.equal(
    badge.getAttribute('data-qr-target'),
    'https://ndt-insco.github.io/INSCONDTEG/#client/companies/comp_modal_77'
  );
  assert.ok(badge.querySelector('svg path')?.getAttribute('d'));

  fireEvent.click(ui.getByRole('button', { name: /Open Company File & Dossier Now/ }));
  assert.deepEqual(opened, ['comp_modal_77']);
  assert.equal(closedCount, 1);

  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(closedCount, 2);
});

test('CompanyPortal Inspector QR Quick Access section generates QR by Company ID and opens dossier', () => {
  const openedDossiers: string[] = [];

  const ui = render(
    <CompanyPortal
      language="ar"
      onNavigateToAcademy={() => {}}
      onOpenCompanyDossier={id => openedDossiers.push(id)}
    />
  );

  const qrSection = ui.container.querySelector('section#inspector-qr-access');
  assert.ok(qrSection, 'CompanyPortal must render #inspector-qr-access');

  const input = within(qrSection as HTMLElement).getByLabelText(
    /المعرّف الفردي للشركة المسجلة/
  ) as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'comp_burullus_01' } });

  const badge = within(qrSection as HTMLElement).getByTestId(
    'company-qr-badge-comp_burullus_01'
  );
  assert.equal(
    badge.getAttribute('data-qr-target'),
    'https://ndt-insco.github.io/INSCONDTEG/#client/companies/comp_burullus_01'
  );

  fireEvent.click(
    within(qrSection as HTMLElement).getByRole('button', {
      name: /فتح ملف الشركة والتقارير/,
    })
  );
  assert.deepEqual(openedDossiers, ['comp_burullus_01']);
});

test('ClientCompaniesSection and ClientCompanyDossier expose per-company QR badges and modal triggers', () => {
  const sampleCompany = {
    id: 'comp_archive_99',
    companyCode: 'INS-CO-0199',
    nameAr: 'الشركة المصرية للغاز',
    nameEn: 'Egyptian Gas Engineering',
    archiveCategory: 'active_testing' as const,
    hasActiveTestingDossier: true,
    sector: 'Oil & Gas',
    reportsCount: 1,
    assignedClientUid: '',
    createdByUid: 'admin_1',
  };

  const archiveUi = render(
    <ClientCompaniesSection
      language="en"
      companies={[sampleCompany]}
      loading={false}
      isAdmin={true}
      currentUid="admin_1"
      onOpenCompanyDossier={() => {}}
    />
  );

  fireEvent.click(
    archiveUi.getByRole('button', { name: /Show QR pass for Egyptian Gas Engineering/ })
  );
  const modal = archiveUi.getByRole('dialog');
  assert.ok(within(modal).getByTestId('company-qr-badge-comp_archive_99'));
  cleanup();

  const dossierUi = render(
    <ClientCompanyDossier
      language="en"
      company={sampleCompany}
      reports={[]}
      isAdmin={true}
      currentUid="admin_1"
      onBackToArchive={() => {}}
    />
  );

  // Header Field QR Pass button opens modal
  fireEvent.click(dossierUi.getByRole('button', { name: /Field QR Pass/ }));
  assert.ok(within(dossierUi.getByRole('dialog')).getByTestId('company-qr-badge-comp_archive_99'));
  fireEvent.keyDown(document, { key: 'Escape' });

  // Company Profile tab embeds live CompanyQrBadge
  fireEvent.click(dossierUi.getByRole('tab', { name: /Company Profile & Scope/ }));
  assert.ok(dossierUi.getByTestId('company-qr-badge-comp_archive_99'));
});
