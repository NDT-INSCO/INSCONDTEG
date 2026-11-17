import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { App } from '../src/App';
import { CompanyHero } from '../src/components/company/CompanyHero';
import { CompanyServicesSection } from '../src/components/company/CompanyServicesSection';
import { CompanyCertificationsSection } from '../src/components/company/CompanyCertificationsSection';
import { CompanyProjectsSection } from '../src/components/company/CompanyProjectsSection';
import { CompanyTestimonialsSection } from '../src/components/company/CompanyTestimonialsSection';
import { CompanyVendorVaultSection } from '../src/components/company/CompanyVendorVaultSection';
import { CompanyContactSection } from '../src/components/company/CompanyContactSection';
import { CompanyFleetInspector } from '../src/components/company/CompanyFleetInspector';
import { CompanyStandardsMatrix } from '../src/components/company/CompanyStandardsMatrix';
import { PwhtCycleSimulator } from '../src/components/company/PwhtCycleSimulator';
import { RadiographicFilmViewer } from '../src/components/company/RadiographicFilmViewer';
import { CompanyUltrasonicLabSection } from '../src/components/company/CompanyUltrasonicLabSection';
import { UtFlawDetectorDevice } from '../src/components/academy/virtuallab/UtFlawDetectorDevice';
import { PautOmniScanDevice } from '../src/components/academy/virtuallab/PautOmniScanDevice';
import { NdtVirtualLabWorkbench } from '../src/components/academy/virtuallab/NdtVirtualLabWorkbench';
import { INSCO_COMPANY_DATA } from '../src/data/inscoCompanyData';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16).unref(),
  cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
});

// Mock scrollTo, scrollIntoView, and HTML5 canvas for jsdom
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
// @ts-expect-error jsdom canvas mock
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  strokeRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: new Array(4) }),
  putImageData: () => {},
  createImageData: () => ([]),
  setTransform: () => {},
  translate: () => {},
  rotate: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  ellipse: () => {},
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  setLineDash: () => {},
});
dom.window.HTMLCanvasElement.prototype.toDataURL = () =>
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
});

test('CompanyHero renders official brochure facade in Arabic with metrics and PDF link', () => {
  const ui = render(
    <CompanyHero
      language="ar"
      onNavigateToAcademy={() => {}}
      onNavigateToSection={() => {}}
    />
  );

  // Check company name, document reference, and revision
  assert.ok(ui.getAllByText(INSCO_COMPANY_DATA.name.ar).length > 0);
  assert.ok(ui.getAllByText(INSCO_COMPANY_DATA.docRef).length > 0);
  assert.ok(ui.getAllByText(INSCO_COMPANY_DATA.revision).length > 0);
  assert.ok(ui.getAllByText(/وحدة معالجة حرارية/i).length > 0);

  // Check PDF link
  const pdfLink = ui.getByRole('link', { name: /ملف الشركة \(PDF\)/i });
  assert.equal(pdfLink.getAttribute('href'), INSCO_COMPANY_DATA.pdfBrochureUrl);
});

test('CompanyServicesSection displays 12 NDT methods and 16 PWHT fleet details', () => {
  const ui = render(<CompanyServicesSection language="en" />);

  // Check PWHT fleet 16 units
  assert.ok(ui.getAllByText(/65 kW/i).length > 0);
  assert.ok(ui.getAllByText(/16/).length > 0);

  // Check presence of key NDT methods
  assert.ok(ui.getAllByText(/Ultrasonic Testing/i).length > 0);
  assert.ok(ui.getAllByText(/Radiographic Testing/i).length > 0);
  assert.ok(ui.getAllByText(/Magnetic Particle Testing/i).length > 0);

  // Filter by Volumetric
  const volumetricFilter = ui.getByRole('button', { name: /Volumetric NDT/i });
  fireEvent.click(volumetricFilter);

  // Ultrasonic is still present
  assert.ok(ui.getAllByText(/Ultrasonic/i).length > 0);
});

test('CompanyCertificationsSection displays Triple ISO, IRCA Lead Auditor and ENRRA license', () => {
  const ui = render(<CompanyCertificationsSection language="ar" />);

  // Check ISO 9001, 14001, 45001
  assert.ok(ui.getAllByText(/ISO 9001:2015/i).length > 0);
  assert.ok(ui.getAllByText(/ISO 14001:2015/i).length > 0);
  assert.ok(ui.getAllByText(/ISO 45001:2018/i).length > 0);

  // Check IRCA Lead Auditor details
  assert.ok(ui.getAllByText(/UDN 27956/i).length > 0);

  // Check ENRRA license
  assert.ok(ui.getAllByText(/ترخيص هيئة الرقابة النووية والإشعاعية/i).length > 0);

  // Check Five Reasons
  assert.ok(ui.getAllByText(/01\./i).length > 0);
  assert.ok(ui.getAllByText(/05\./i).length > 0);
});

test('CompanyProjectsSection allows switching between clients and power plant facilities', () => {
  const ui = render(<CompanyProjectsSection language="en" />);

  // Major clients presence
  assert.ok(ui.getAllByText(/SIEMENS/i).length > 0);
  assert.ok(ui.getAllByText(/ORASCOM/i).length > 0);
  assert.ok(ui.getAllByText(/PETROMASILA/i).length > 0);

  // Switch to facilities
  const facilitiesBtn = ui.getByRole('button', { name: /Major Facilities Served/i });
  fireEvent.click(facilitiesBtn);

  assert.ok(ui.getAllByText(/Burullus/i).length > 0);
  assert.ok(ui.getAllByText(/Ayoun Mousa/i).length > 0);
});

test('CompanyVendorVaultSection lists all 5 Annexes and provides verified PDF download', () => {
  const ui = render(<CompanyVendorVaultSection language="ar" />);

  // Check Annexes codes
  assert.ok(ui.getAllByText('B-01').length > 0);
  assert.ok(ui.getAllByText('C-01').length > 0);
  assert.ok(ui.getAllByText('D-02').length > 0);
  assert.ok(ui.getAllByText('E-01').length > 0);

  // Check direct download link
  const dlLink = ui.getByRole('link', { name: /تحميل الملف كاملاً \(PDF مباشر\)/i });
  assert.equal(dlLink.getAttribute('href'), '/assets/aistudio/__________________d082de13.pdf');
});

const fillRfq = (ui: { getByPlaceholderText: (pattern: RegExp) => HTMLElement }) => {
  fireEvent.change(ui.getByPlaceholderText(/مثال: شركة بترول خليج السويس/i), { target: { value: 'Orascom Construction' } });
  fireEvent.change(ui.getByPlaceholderText(/\+20 100/i), { target: { value: '+20 109 077 7202' } });
  fireEvent.change(ui.getByPlaceholderText(/contracts@company\.com/i), { target: { value: 'qc@orascom.com' } });
};

test('RFQ never claims success when the request could not be sent', async () => {
  const ui = render(
    <CompanyContactSection
      language="ar"
      submitRequest={async () => ({ status: 'failed', reason: 'not_configured' })}
    />,
  );
  fillRfq(ui);
  fireEvent.click(ui.getByRole('button', { name: /إرسال طلب التسعير المعتمد/i }));

  await waitFor(() => assert.ok(ui.getByRole('alert')));
  assert.equal(ui.queryAllByText(/تم استلام طلبكم بنجاح/i).length, 0, 'no success screen without a server');
  assert.equal(ui.queryAllByText(/INSCO-RFQ-/i).length, 0, 'no reference is invented in the browser');
  assert.ok(ui.getByRole('alert').textContent?.includes('لم يُسجَّل'));
  // The customer still gets a channel that reaches a human.
  const mail = ui.getByRole('link', { name: /إرسال بالبريد الإلكتروني/i });
  assert.ok(mail.getAttribute('href')?.startsWith('mailto:'));
  assert.ok(decodeURIComponent(mail.getAttribute('href')!).includes('Orascom Construction'));
  assert.ok(ui.getByRole('link', { name: /إرسال واتساب/i }));
});

test('RFQ shows the reference issued by the server, and only that', async () => {
  const ui = render(
    <CompanyContactSection
      language="ar"
      submitRequest={async () => ({ status: 'sent', reference: 'INSCO-RFQ-20261117-7K2Q9P' })}
    />,
  );
  fillRfq(ui);
  fireEvent.click(ui.getByRole('button', { name: /إرسال طلب التسعير المعتمد/i }));

  await waitFor(() => assert.ok(ui.getAllByText(/تم استلام طلبكم بنجاح/i).length > 0));
  assert.ok(ui.getAllByText(/INSCO-RFQ-20261117-7K2Q9P/).length > 0);
  assert.equal(ui.queryAllByRole('alert').length || 0, 0);
});

test('CompanyTestimonialsSection displays sliding cards with client feedback and controls', () => {
  const ui = render(<CompanyTestimonialsSection language="ar" />);

  // Should render section title and initial client testimonial (Siemens)
  assert.ok(ui.getAllByText(/شهادات العملاء وسجلات النجاح الميداني/i).length > 0);
  assert.ok(ui.getAllByText(/SIEMENS Energy \/ PGESCO/i).length > 0);
  assert.ok(ui.getAllByText(/1,200\+/i).length > 0);

  // Quick client selector tabs are present for all partners
  assert.ok(ui.getByRole('button', { name: /ORASCOM Construction/i }));
  assert.ok(ui.getByRole('button', { name: /PETROMASILA Exploration & Production/i }));
  assert.ok(ui.getByRole('button', { name: /El Sewedy Electric/i }));
  assert.ok(ui.getByRole('button', { name: /Serka Insaat/i }));

  // Click Next button to slide to next card
  const nextBtn = ui.getByRole('button', { name: /Next Testimonial/i });
  fireEvent.click(nextBtn);

  // Counter updates to 02 / 05
  assert.ok(ui.getAllByText(/02/i).length > 0);
});

test('App root renders corporate facade by default and switches to Educational Academy', () => {
  const ui = render(<App />);

  // Default is company portal facade
  assert.ok(ui.getAllByText(/الشركة الدولية للخدمات والمقاولات - إنسكو/i).length > 0);
  assert.ok(ui.getAllByText(/CP\/2026-10/i).length > 0);

  // Find academy navigation button in header
  const academyNavBtns = ui.getAllByRole('button', { name: /أكاديمية إنسكو/i });
  fireEvent.click(academyNavBtns[0]);

  // Should show Academy banner with return link
  assert.ok(ui.getAllByText(/أكاديمية إنسكو الهندسية للفحص غير الإتلافي/i).length > 0);
  assert.ok(ui.getAllByText(/العودة إلى ملف وخدمات الشركة/i).length > 0);

  // Click back to corporate profile
  const backBtn = ui.getByRole('button', { name: /العودة إلى ملف وخدمات الشركة/i });
  fireEvent.click(backBtn);

  // Corporate portal restored: the six-link corporate nav is back
  assert.ok(ui.getAllByRole('button', { name: 'خدماتنا' }).length > 0);
  assert.ok(ui.getAllByRole('button', { name: 'ملف التأهيل' }).length > 0);
});

test('CompanyFleetInspector displays calibrated equipment registry and allows category filtering', () => {
  const ui = render(<CompanyFleetInspector language="ar" />);

  // Should display equipment registry heading and metrics
  assert.ok(ui.getAllByText(/سجل الأصول والمعايرة والتجهيزات الميدانية/i).length > 0);
  assert.ok(ui.getAllByText(/48\+/i).length > 0);

  // Default item is PWHT 65 kW units
  assert.ok(ui.getAllByText(/INS-PWHT-01 to INS-PWHT-16/i).length > 0);
  assert.ok(ui.getAllByText(/National Institute for Standards/i).length > 0 || ui.getAllByText(/NIS/i).length > 0);

  // Switch category to UT / PAUT
  const utTab = ui.getByRole('button', { name: /أجهزة الموجات UT/i });
  fireEvent.click(utTab);

  // Olympus OmniScan should be listed
  assert.ok(ui.getAllByText(/OmniScan/i).length > 0);
});

test('CompanyStandardsMatrix allows exploring ASME, API, AWS, and ISO requirements across sectors', () => {
  const ui = render(<CompanyStandardsMatrix language="ar" />);

  // Heading and initial sector
  assert.ok(ui.getAllByText(/مصفوفة الأكواد والمعايير الهندسية الدولية/i).length > 0);
  assert.ok(ui.getAllByText(/ASME Section I/i).length > 0);
  assert.ok(ui.getAllByText(/CAB #120007/i).length > 0);

  // Switch to Oil & Gas cross-country pipelines
  const pipelineBtn = ui.getByRole('button', { name: /خطوط أنابيب نقل البترول والغاز/i });
  fireEvent.click(pipelineBtn);

  // API 1104 should be displayed
  assert.ok(ui.getAllByText(/API 1104/i).length > 0);
});

test('PwhtCycleSimulator renders thermal cockpit and allows recipe selection and execution', () => {
  const ui = render(<PwhtCycleSimulator language="ar" />);

  // Should display PWHT simulator header and metrics
  assert.ok(ui.getAllByText(/المحاكي الحراري الحي لأسطول وحدات 65 kW/i).length > 0);
  assert.ok(ui.getAllByText(/16 وحدة مملوكة بالكامل/i).length > 0);

  // Default is P91 alloy
  assert.ok(ui.getAllByText(/Grade 91/i).length > 0);
  assert.ok(ui.getAllByText(/760 °C/i).length > 0);

  // Switch to P22
  const p22Btn = ui.getByRole('button', { name: /سبيكة P22/i });
  fireEvent.click(p22Btn);

  assert.ok(ui.getAllByText(/715 °C/i).length > 0);

  // Toggle run cycle button
  const runBtn = ui.getByRole('button', { name: /تشغيل الدورة/i });
  fireEvent.click(runBtn);

  // Should now indicate pause
  assert.ok(ui.getAllByText(/إيقاف مؤقت/i).length > 0);
});

test('RadiographicFilmViewer displays digital light box with flaw defect measurement', () => {
  const ui = render(<RadiographicFilmViewer language="ar" />);

  // Header and initial crack sample
  assert.ok(ui.getAllByText(/مختبر قراءة وتفسير صور الأشعة وأفلام جاما RT/i).length > 0);
  assert.ok(ui.getAllByText(/شرخ طولي حرج بجذر اللحام/i).length > 0);
  assert.ok(ui.getAllByText(/REJECT/i).length > 0);

  // Switch to sound weld
  const soundBtn = ui.getByRole('button', { name: /لحام سليم تام النفاذية/i });
  fireEvent.click(soundBtn);

  // Should show ACCEPT verdict
  assert.ok(ui.getAllByText(/مقبول بامتياز/i).length > 0);
});

test('UtFlawDetectorDevice allows gain adjustment, range switching, and specimen selection', () => {
  const ui = render(<UtFlawDetectorDevice language="ar" />);

  // Should display Krautkrämer USM 35X header
  assert.ok(ui.getAllByText(/Krautkrämer USM 35X/i).length > 0);
  assert.ok(ui.getAllByText(/42.0 dB/i).length > 0);

  // Increase gain by +6 dB
  const plusSixBtn = ui.getByRole('button', { name: '+6' });
  fireEvent.click(plusSixBtn);

  // Gain should now be 48.0 dB
  assert.ok(ui.getAllByText(/48.0 dB/i).length > 0);

  // Switch specimen to Flat Butt Weld
  const buttWeldBtn = ui.getByRole('button', { name: /عينة لحام فلات/i });
  fireEvent.click(buttWeldBtn);

  // Should show probe angle 60°
  assert.ok(ui.getAllByText(/60°/i).length > 0);
});

test('PautOmniScanDevice renders S-Scan sectorial sweep, cursor scrubbing, and flaw sizing', () => {
  const ui = render(<PautOmniScanDevice language="ar" />);

  // Header and initial Root Crack target
  assert.ok(ui.getAllByText(/Olympus OmniScan/i).length > 0);
  assert.ok(ui.getAllByText(/SECTORIAL S-SCAN/i).length > 0);
  assert.ok(ui.getAllByText(/REJECT/i).length > 0);

  // Switch flaw target to Lack of Sidewall Fusion
  const lofBtn = ui.getByRole('button', { name: /نقص انصهار بالجدار الجانبي/i });
  fireEvent.click(lofBtn);

  assert.ok(ui.getAllByText(/نقص انصهار بالجدار الجانبي/i).length > 0);
});

test('CompanyUltrasonicLabSection mounts on corporate profile and allows toggling UT and PAUT', () => {
  const ui = render(<CompanyUltrasonicLabSection language="ar" onNavigateToAcademy={() => {}} />);

  // Heading and device toggles
  assert.ok(ui.getAllByText(/مختبر المحاكاة التفاعلي لأجهزة الفحص بالموجات والمصفوفات/i).length > 0);
  assert.ok(ui.getByRole('button', { name: /جهاز UT الرقمي/i }));
  assert.ok(ui.getByRole('button', { name: /جهاز PAUT المصفوفات/i }));

  // Switch to PAUT
  const pautBtn = ui.getByRole('button', { name: /جهاز PAUT المصفوفات/i });
  fireEvent.click(pautBtn);

  // OmniScan should be active
  assert.ok(ui.getAllByText(/OmniScan/i).length > 0);
});

test('NdtVirtualLabWorkbench integrates training missions, theory formulas, and instruments', () => {
  const ui = render(<NdtVirtualLabWorkbench language="ar" />);

  // Heading and missions
  assert.ok(ui.getAllByText(/ورشة أجهزة الموجات فوق الصوتية والمصفوفات الطورية/i).length > 0);
  assert.ok(ui.getAllByText(/3240 m\/s/i).length > 0);

  // Theory formulas presence
  assert.ok(ui.getAllByText(/قانون سنيل للانكسار/i).length > 0);
});

test('GlobalHeaderSearch filters services, educational modules, and company info and navigates directly', async () => {
  const { filterGlobalSearchItems } = await import('../src/utils/globalSearchIndex');

  // Verify pure text filter across all 3 categories in both Arabic & English
  const serviceMatches = filterGlobalSearchItems('PWHT 65 kW', 'services');
  assert.ok(serviceMatches.length > 0);
  assert.ok(serviceMatches.every((m) => m.category === 'services'));

  const moduleMatches = filterGlobalSearchItems('منحنى المعايرة DAC', 'academy');
  assert.ok(moduleMatches.some((m) => m.id === 'academy-dac-builder'));

  const companyMatches = filterGlobalSearchItems('ISO 9001', 'company');
  assert.ok(companyMatches.some((m) => m.id === 'company-cert-iso_9001'));

  // Render full App and interact with the header global search bar
  const ui = render(<App />);

  const headerEl = ui.container.querySelector('header');
  assert.ok(headerEl, 'Header should exist');

  const searchInput = ui.getByRole('searchbox', {
    name: /بحث شامل في الخدمات والوحدات التعليمية ومعلومات الشركة/i,
  });
  assert.ok(headerEl.contains(searchInput), 'Global search input must be inside the header');

  // 1. Filter for an Educational Module ("DAC") and select it -> navigates to Academy DAC Builder
  fireEvent.focus(searchInput);
  fireEvent.change(searchInput, { target: { value: 'ASME DAC' } });

  const dacOption = ui.getByRole('button', {
    name: /منشئ منحنى المعايرة DAC التفاعلي/i,
  });
  fireEvent.click(dacOption);

  // App switched to Educational Academy view
  assert.ok(ui.getAllByText(/أكاديمية إنسكو الهندسية للفحص غير الإتلافي/i).length > 0);

  // 2. From inside Academy view, search for Company Info ("ISO 9001") and jump back to Company Portal
  fireEvent.focus(searchInput);
  fireEvent.change(searchInput, { target: { value: 'ISO 9001:2015' } });

  const isoOption = ui.getByRole('button', {
    name: /ISO 9001:2015 — نظام إدارة الجودة/i,
  });
  fireEvent.click(isoOption);

  // Restored to Company Portal view (header now leads with the quote action)
  assert.ok(ui.getAllByRole('button', { name: /اطلب عرض سعر/i }).length > 0);
});

test('the corporate portal keeps express quotation and hands the training syllabus to the academy', async () => {
  const { CompanyPortal } = await import('../src/components/company/CompanyPortal');
  const { CompanyQuickActionsSection } = await import('../src/components/company/CompanyQuickActionsSection');
  const { buildTrainingSyllabusDocument } = await import('../src/utils/trainingSyllabusGenerator');

  // The generated syllabus document is unchanged (same 8 disciplines, ASNT/ISO metadata).
  const syllabusEn = buildTrainingSyllabusDocument('en');
  assert.equal(syllabusEn.filename, 'INSCO_NDT_Training_Syllabus_2026.html');
  assert.equal(syllabusEn.stats.disciplineCount, 8);
  assert.ok(syllabusEn.stats.moduleCount > 10);
  assert.match(syllabusEn.content, /ASNT SNT-TC-1A/i);

  let clickedDownloadFilename: string | null = null;
  const origClick = dom.window.HTMLAnchorElement.prototype.click;
  dom.window.HTMLAnchorElement.prototype.click = function () {
    clickedDownloadFilename = this.getAttribute('download');
  };

  try {
    const ui = render(<CompanyPortal language="en" onNavigateToAcademy={() => {}} />);

    // The corporate portal keeps the express quotation card only: the audit
    // asked us to stop mixing a training download into the commercial path.
    assert.ok(ui.getAllByText(/Express quotation/i).length > 0);
    assert.equal(
      ui.queryByRole('button', { name: /^Download Training Syllabus$/i }),
      null,
      'the training syllabus must not sit inside the commercial RFQ flow'
    );

    const quoteBtn = ui.getByRole('button', { name: /^Request Quote$/i });
    fireEvent.click(quoteBtn);
    assert.ok(ui.getByText(/RFQ form activated and focused/i));
    const companyInput = ui.container.querySelector('#rfq-company-input');
    assert.equal(document.activeElement, companyInput);

    // The estimator is an optional step inside the RFQ section, not a section of its own.
    const rfqForm = ui.container.querySelector('#rfq');
    const estimator = ui.container.querySelector('#cost-estimator');
    assert.ok(rfqForm && estimator, 'both the RFQ form and the estimator must exist');
    assert.ok(
      rfqForm!.closest('section#contact')!.contains(estimator!),
      'the estimator must live inside the RFQ section'
    );

    fireEvent.click(ui.getByRole('button', { name: /^Gamma & X-Ray RT$/i }));
    const rfqSelect = ui.container.querySelector('#rfq select') as HTMLSelectElement;
    assert.equal(rfqSelect.value, 'rt_gamma');

    // The syllabus moved to the academy, where its download still works.
    cleanup();
    const academyCard = render(<CompanyQuickActionsSection language="en" mode="syllabus" />);
    const syllabusBtn = academyCard.getByRole('button', { name: /^Download Training Syllabus$/i });
    fireEvent.click(syllabusBtn);
    assert.equal(clickedDownloadFilename, 'INSCO_NDT_Training_Syllabus_2026.html');
    assert.ok(academyCard.getByText(/Syllabus downloaded: INSCO_NDT_Training_Syllabus_2026\.html/i));
  } finally {
    dom.window.HTMLAnchorElement.prototype.click = origClick;
  }
});

test('CompanyProjectCostEstimator computes service budgets & site requirements and transfers scope to RFQ', async () => {
  const { CompanyPortal } = await import('../src/components/company/CompanyPortal');
  const { calculateProjectEstimate } = await import('../src/utils/projectCostEstimator');

  // 1. Verify pure estimator engine across shifts, thickness, and RT RSO allocation
  const dayEst = calculateProjectEstimate({
    selectedServices: ['pwht', 'ut'],
    jointCount: 60,
    thicknessTier: 'medium_std',
    mobilizationZone: 'cairo_suez',
    shiftSchedule: 'day_standard',
  });
  assert.ok(dayEst.totalMidpointUsd > 0);
  assert.ok(dayEst.pwhtUnitsAllocated >= 2);
  assert.equal(dayEst.includesRsoOfficer, false);

  const turnaroundRtEst = calculateProjectEstimate({
    selectedServices: ['pwht', 'ut', 'rt'],
    jointCount: 60,
    thicknessTier: 'heavy_thick',
    mobilizationZone: 'red_sea_upper',
    shiftSchedule: 'shutdown_24_7',
  });
  assert.equal(turnaroundRtEst.includesRsoOfficer, true);
  assert.ok(turnaroundRtEst.estimatedRtFilms > 0);
  assert.ok(turnaroundRtEst.totalCertifiedPersonnel > dayEst.totalCertifiedPersonnel);

  // 2. Render CompanyPortal and interact with the Project Cost Estimator UI
  const ui = render(<CompanyPortal language="en" onNavigateToAcademy={() => {}} />);

  assert.ok(
    ui.getByText(/Interactive Project Cost & Mobilization Requirements Estimator/i)
  );

  // Add RT service (now 3 services: PWHT + UT + RT -> 5% bundle applied)
  fireEvent.click(ui.getByTestId('estimator-service-rt'));
  assert.ok(ui.getByText(/5% Bundle Applied/i));
  assert.ok(ui.getByText(/Includes dedicated ENRRA Radiation Safety Officer/i));

  // Update joint count to 80 and switch currency to EGP
  const jointInput = ui.getByLabelText(/Estimated Weld Joints \/ Test Points/i) as HTMLInputElement;
  fireEvent.change(jointInput, { target: { value: '80' } });

  fireEvent.click(ui.getByRole('button', { name: /EGP/i }));
  assert.match(ui.getByTestId('estimator-budget-range').textContent || '', /EGP/);

  // Transfer estimate to #rfq and verify scope textarea is populated
  fireEvent.click(ui.getByTestId('estimator-transfer-rfq-btn'));
  const rfqTextarea = ui.container.querySelector('#rfq textarea') as HTMLTextAreaElement;
  assert.match(rfqTextarea.value, /80 weld joints/i);
  assert.match(rfqTextarea.value, /PWHT \+ UT \/ PAUT \+ RT/i);
});


